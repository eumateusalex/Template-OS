// O render do Guardanapo: confere a cena, mede no navegador o
// que só ele vê e fotografa cada quadro em 2160 × 2700.
//
// Uso: node scripts/guardanapo/render.mjs <pasta> [--fonte hibrida|mao|inter] [--saida <subpasta>]
//   sai 0 com os PNGs e o medidas.json, 1 com erro de régua ou de medida
//   (sem PNG nenhum), 2 com a entrada quebrada
//
// Três passadas: a primeira confere que a fonte carregou e mede a largura real
// de cada palavra; a segunda redesenha com a quebra de linha certa e mede onde caiu a
// palavra que o destaque aponta; a terceira redesenha com as duas medidas,
// confere tudo (texto dentro da caixa, pintura dentro da margem, nó longe de
// nó, texto solto longe das formas) e só então fotografa. Nenhum quadro sai se
// um deles reprovou.
//
// 🚨 Os PNGs velhos da pasta saem ANTES de qualquer coisa: PNG antigo parado na
// pasta parece render novo.
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { T, fontesExcalifont, fontesInter, avisosDeContraste } from './tokens.mjs';
import { desenhar } from './desenhar.mjs';
import { RESPIRO_DO_NO } from './geometria.mjs';
import { conferir, lerCena, origemDaPaleta } from './conferir.mjs';

const FAMILIAS = [T.familia.mao, T.familia.inter];
const PNG = /^quadro-\d+\.png$/;

function cssDasFontes(semFonte) {
  const face = (familia, { arquivo, faixa }, peso) =>
    `@font-face{font-family:'${familia}';src:url(data:font/woff2;base64,${readFileSync(arquivo).toString('base64')}) format('woff2');`
    + `font-weight:${peso};font-style:normal;font-display:block;unicode-range:${faixa};}`;
  let css = '';
  if (semFonte !== T.familia.mao) css += fontesExcalifont().map((x) => face(T.familia.mao, x, '400')).join('');
  if (semFonte !== T.familia.inter) css += fontesInter().map((x) => face(T.familia.inter, x, '100 900')).join('');
  return css;
}

const pagina = (css, svg) =>
  `<!doctype html><html><head><meta charset="utf-8"><style>${css}html,body{margin:0;background:${T.cor.fundo}}</style></head><body>${svg}</body></html>`;

// roda DENTRO do navegador: não enxerga nada daqui de fora
async function medir({ familias, quadro, destaque, margem, largura, altura, respiro }) {
  const erros = [];
  const metricas = {};
  const svg = document.querySelector('svg');
  const onde = `no quadro ${quadro}`;
  const nome = (id) => (id === 'destaque' ? 'o destaque' : `"${id}"`);

  // 1. a fonte que cada texto de fato usa, e se ela carregou
  const usadas = new Set();
  for (const t of svg.querySelectorAll('text')) {
    usadas.add(getComputedStyle(t).fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, ''));
  }
  const fontes = [];
  for (const fam of usadas) {
    if (!familias.includes(fam)) { erros.push(`texto em fonte de reserva ("${fam}") ${onde}`); continue; }
    const faces = await document.fonts.load(`40px "${fam}"`, 'Açãé');
    if (!faces.length || faces.some((f) => f.status !== 'loaded')) erros.push(`a fonte ${fam} não carregou ${onde}`);
    else fontes.push(fam);
  }
  if (erros.length) return { erros, metricas, fontes, fonteFalhou: true };

  // 1b. a largura real de cada palavra (e do espaço), por família e peso, a
  // 100 px: é com ela que a quebra de linha acerta (1% de folga para o kerning)
  const palavras = {};
  const ctx = document.createElement('canvas').getContext('2d');
  for (const ts of svg.querySelectorAll('tspan')) {
    const t = ts.parentNode;
    const fam = getComputedStyle(t).fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '');
    const peso = Number(t.getAttribute('font-weight')) || 400;
    ctx.font = `${peso} 100px "${fam}"`;
    const m = (palavras[`${fam}|${peso}`] ??= { ' ': ctx.measureText(' ').width });
    for (const w of ts.textContent.split(' ')) if (w && m[w] === undefined) m[w] = ctx.measureText(w).width * 1.01;
  }
  metricas.palavras = palavras;

  // a largura real de um trecho, na fonte e no tamanho do <text> dele
  const larguraDe = (t, s) => {
    ctx.font = `${Number(t.getAttribute('font-weight')) || 400} ${t.getAttribute('font-size')}px ${getComputedStyle(t).fontFamily}`;
    return ctx.measureText(s).width * 1.01;
  };

  // 2. o texto de cada nó cabe na caixa dele; quando não cabe, a mensagem diz
  // a largura que caberia (a da forma, com o recuo dela), medida e não chutada
  const DENTRO = { no: 0, folha: 0, elipse: 0.12, losango: 0.2 };
  const QUEBRA = { no: 1, folha: 1, elipse: 1, losango: 0.6 };
  const larguraQueCabe = (tipo, texto) => Math.ceil(Math.max(texto / QUEBRA[tipo] + 2 * respiro, (texto + 24) / (1 - 2 * DENTRO[tipo]))) + 4;
  const caixas = [];
  for (const g of svg.querySelectorAll('g[data-caixa]')) {
    const tipo = g.dataset.tipo;
    const [x0, y0, x1, y1] = g.dataset.caixa.split(',').map(Number);
    if (tipo in DENTRO) caixas.push({ id: g.dataset.id, x0, y0, x1, y1 });
    const t = g.querySelector('text');
    if (!t || !(tipo in DENTRO)) continue;
    const nl = t.querySelectorAll('tspan').length;
    if (nl >= 3) {
      const ws = [...t.querySelectorAll('tspan')].map((x) => x.textContent).join(' ').split(' ').filter(Boolean);
      let melhor = Infinity;
      for (let k = 1; k < ws.length; k++) melhor = Math.min(melhor, Math.max(larguraDe(t, ws.slice(0, k).join(' ')), larguraDe(t, ws.slice(k).join(' '))));
      erros.push(`o rótulo de "${g.dataset.id}" quebra em ${nl} linhas ${onde}: alargue o nó para ${larguraQueCabe(tipo, melhor)} px, ou encurte`);
    }
    const b = t.getBBox();
    const px = 12 + (x1 - x0) * DENTRO[tipo];
    const py = 8 + (y1 - y0) * DENTRO[tipo];
    const deLado = Math.max(x0 + px - b.x, b.x + b.width - (x1 - px));
    const excesso = Math.max(deLado, y0 + py - b.y, b.y + b.height - (y1 - py));
    if (excesso > 0.5) {
      const dica = deLado > 0.5 ? `alargue a forma para ${larguraQueCabe(tipo, b.width)} px` : 'dê mais altura à forma, ou encurte';
      erros.push(`o texto de "${g.dataset.id}" passa da caixa em ${Math.ceil(excesso)} px ${onde}: ${dica}`);
    }
  }

  // 2c. palavra sozinha na última linha, no título, na frase e na anotação
  const sozinha = (t) => {
    const ts = [...t.querySelectorAll('tspan')];
    if (ts.length < 2) return null;
    const total = ts.map((x) => x.textContent).join(' ').split(' ').filter(Boolean).length;
    const ultima = ts[ts.length - 1].textContent.trim();
    return total >= 3 && !ultima.includes(' ') ? ultima : null;
  };
  for (const t of svg.querySelectorAll('text[data-papel]')) {
    const v = sozinha(t);
    if (v) erros.push(`${t.dataset.papel === 'titulo' ? 'o título' : 'a frase'} ${onde.replace(/^no /, 'do ')} deixa "${v}" sozinho na última linha: encurte ou reescreva`);
  }
  for (const g of svg.querySelectorAll('g[data-tipo="anotacao"]')) {
    const t = g.querySelector('text');
    const v = t && sozinha(t);
    if (v) erros.push(`a anotação "${g.dataset.id}" deixa "${v}" sozinho na última linha ${onde}: encurte ou alargue`);
  }

  // 3. nada pintado fora da margem (com 8 px de folga para o tremido do traço)
  const folga = 8;
  const fora = (b) => b.x < margem - folga || b.y < margem - folga || b.x + b.width > largura - margem + folga || b.y + b.height > altura - margem + folga;
  for (const g of svg.querySelectorAll('g[data-id]')) if (fora(g.getBBox())) erros.push(`${nome(g.dataset.id)} passa da margem ${onde}`);
  for (const t of svg.querySelectorAll('text[data-papel]')) if (fora(t.getBBox())) erros.push(`${t.dataset.papel === 'titulo' ? 'o título' : 'a frase'} passa da margem ${onde}`);

  // 4. nó não encosta em nó (a quebra medida pode ter crescido a caixa), e
  // texto solto (rótulo de seta, anotação, título, frase) não encosta em nó
  const cruza = (b, c) => b.x < c.x1 && c.x0 < b.x + b.width && b.y < c.y1 && c.y0 < b.y + b.height;
  for (let a = 0; a < caixas.length; a++) {
    for (let b = a + 1; b < caixas.length; b++) {
      const [p, q] = [caixas[a], caixas[b]];
      if (p.x0 < q.x1 && q.x0 < p.x1 && p.y0 < q.y1 && q.y0 < p.y1) erros.push(`"${p.id}" e "${q.id}" se sobrepõem ${onde}`);
    }
  }
  for (const t of svg.querySelectorAll('text')) {
    const dono = t.closest('g[data-id]');
    const tipo = dono?.dataset.tipo;
    if (tipo && (tipo in DENTRO || tipo === 'grupo' || tipo === 'pessoa')) continue;
    const b = t.getBBox();
    for (const c of caixas) {
      if (cruza(b, c)) erros.push(`o texto ${dono ? `de "${dono.dataset.id}"` : `do ${t.dataset.papel === 'titulo' ? 'título' : 'rodapé'}`} encosta em "${c.id}" ${onde}`);
    }
  }

  // 4b. nenhum texto é cruzado por traço de seta, de linha ou do destaque: o
  // traço passa por dentro da caixa do texto, amostrado a cada 6 px. O
  // sublinhado é do título, e o destaque que circula uma palavra do título
  // cruza o título de propósito
  const nomeDoTexto = (t, dono) => (dono ? `o texto de "${dono.dataset.id}"` : t.dataset.papel === 'titulo' ? 'o título' : 'a frase');
  const textos = [...svg.querySelectorAll('text')].map((t) => ({ t, dono: t.closest('g[data-id]'), b: t.getBBox() }));
  for (const g of svg.querySelectorAll('g[data-tipo="seta"], g[data-tipo="linha"], g[data-id="destaque"]')) {
    const ehDestaque = g.dataset.id === 'destaque';
    if (ehDestaque && g.dataset.tipo === 'sublinhado') continue;
    const pontos = [];
    for (const p of g.querySelectorAll('path')) {
      const n = p.getTotalLength();
      for (let s = 0; s <= n; s += 6) pontos.push(p.getPointAtLength(s));
    }
    for (const { t, dono, b } of textos) {
      if (dono === g) continue;
      if (ehDestaque && (dono?.dataset.id === g.dataset.alvo || (g.dataset.alvo === 'titulo' && t.dataset.papel === 'titulo'))) continue;
      const dentro = pontos.some((q) => q.x > b.x + 2 && q.x < b.x + b.width - 2 && q.y > b.y + 2 && q.y < b.y + b.height - 2);
      if (!dentro) continue;
      erros.push(ehDestaque ? `o destaque cruza ${nomeDoTexto(t, dono).replace(/^o texto de/, 'o texto de')} ${onde}` : `${nomeDoTexto(t, dono)} cruza "${g.dataset.id}" ${onde}`);
    }
  }

  // 5. a posição real da palavra do título que o destaque aponta
  let palavra = null;
  if (destaque?.alvo === 'titulo' && destaque.palavra) {
    const alvo = destaque.palavra.toLowerCase();
    const tit = svg.querySelector('text[data-papel="titulo"]');
    const tam = Number(tit?.getAttribute('font-size'));
    for (const ts of tit ? tit.querySelectorAll('tspan') : []) {
      const i = ts.textContent.toLowerCase().indexOf(alvo);
      if (i < 0) continue;
      const x0 = ts.getStartPositionOfChar(i).x;
      const x1 = ts.getEndPositionOfChar(i + alvo.length - 1).x;
      const yc = Number(ts.getAttribute('y'));
      metricas[`titulo:${destaque.palavra}`] = { x: x0, y: yc - tam / 2, w: x1 - x0, h: tam };
      palavra = { x0, x1 };
      break;
    }
  } else if (destaque?.tipo === 'sublinhado' && destaque.alvo) {
    const t = svg.querySelector(`g[data-id="${destaque.alvo}"] text`);
    if (t) { const b = t.getBBox(); metricas[`texto:${destaque.alvo}`] = { x: b.x, y: b.y, w: b.width, h: b.height }; }
  }
  const gd = svg.querySelector('g[data-id="destaque"]');
  const bd = gd ? gd.getBBox() : null;
  const linhasDoTitulo = svg.querySelectorAll('text[data-papel="titulo"] tspan').length;
  return { erros, metricas, fontes, palavra, linhasDoTitulo, destaque: bd ? { x0: bd.x, x1: bd.x + bd.width } : null };
}

/**
 * Confere, mede e fotografa a peça da pasta. Devolve { codigo, erros, medidas }.
 * `semFonte` tira uma família da página: é a porta do teste da fonte que não carrega.
 */
export async function renderizar(pasta, { fonte, saida, semFonte } = {}) {
  const destino = saida ? join(pasta, saida) : pasta;
  mkdirSync(destino, { recursive: true });
  for (const f of readdirSync(destino)) if (PNG.test(f)) rmSync(join(destino, f));
  rmSync(join(destino, 'medidas.json'), { force: true });

  let cena;
  try {
    cena = lerCena(pasta);
  } catch (err) {
    return { codigo: err.codigo ?? 2, erros: [err.message], medidas: null };
  }
  if (fonte) cena = { ...cena, fonte };
  // antes de medir, só o que não depende da largura do texto
  const conf = conferir(cena, { semMedida: true });
  if (conf.erros.length) return { codigo: 1, erros: conf.erros, medidas: null };

  const css = cssDasFontes(semFonte);
  const arg = (i) => ({
    familias: FAMILIAS, quadro: i + 1, destaque: cena.quadros[i].destaque ?? null,
    margem: T.margem, largura: T.quadro.largura, altura: T.quadro.altura, respiro: RESPIRO_DO_NO,
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: T.quadro.largura, height: T.quadro.altura }, deviceScaleFactor: 2 });
    const passada = async (svgs) => {
      const rs = [];
      for (let i = 0; i < svgs.length; i++) {
        await page.setContent(pagina(css, svgs[i]));
        rs.push(await page.evaluate(medir, arg(i)));
      }
      return rs;
    };
    // A: a fonte carregou? e a largura real da letra, pela maior medida
    const a = await passada(desenhar(cena));
    if (a.some((r) => r.fonteFalhou)) return { codigo: 1, erros: a.flatMap((r) => r.erros), medidas: null };
    const palavras = {};
    for (const r of a) for (const [k, m] of Object.entries(r.metricas.palavras)) Object.assign((palavras[k] ??= {}), m);
    // a régua inteira de novo, agora com a largura real: as linhas do título e da
    // frase e a área livre saem da quebra de verdade, nos dois sentidos
    const conf2 = conferir({ ...cena, medidasDePalavra: palavras });
    if (conf2.erros.length) return { codigo: 1, erros: conf2.erros, medidas: null };
    // B: com a quebra certa, onde cada palavra do destaque caiu
    const b = await passada(desenhar(cena, { metricas: { palavras } }));
    const metricas = Object.assign({}, ...b.map((r) => r.metricas), { palavras });
    // C: o desenho final, medido inteiro; só ele se fotografa
    const svgs = desenhar(cena, { metricas });
    const segunda = await passada(svgs);
    const erros = segunda.flatMap((r) => r.erros);
    if (erros.length) return { codigo: 1, erros, medidas: null };

    for (let i = 0; i < svgs.length; i++) {
      await page.setContent(pagina(css, svgs[i]));
      await page.evaluate(async (familias) => { for (const f of familias) await document.fonts.load(`40px "${f}"`, 'Açãé'); await document.fonts.ready; }, FAMILIAS);
      await page.screenshot({ path: join(destino, `quadro-${String(i + 1).padStart(2, '0')}.png`) });
    }
    const medidas = {
      fonte: cena.fonte ?? T.fontePadrao,
      quadros: segunda.map((r, i) => ({
        quadro: i + 1, nos: conf2.medidas.nos[i], fontes: r.fontes.sort(), linhasDoTitulo: r.linhasDoTitulo,
        ...(r.palavra ? { palavra: r.palavra } : {}), ...(r.destaque ? { destaque: r.destaque } : {}),
      })),
    };
    writeFileSync(join(destino, 'medidas.json'), JSON.stringify(medidas, null, 2));
    return { codigo: 0, erros: [], medidas };
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const valor = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
  const pasta = args.find((a, i) => !a.startsWith('--') && !['--fonte', '--saida'].includes(args[i - 1]));
  if (!pasta) {
    console.error('uso: node scripts/guardanapo/render.mjs <pasta> [--fonte hibrida|mao|inter] [--saida <subpasta>]');
    process.exit(2);
  }
  const r = await renderizar(pasta, { fonte: valor('--fonte'), saida: valor('--saida') });
  if (r.codigo) {
    console.log(`🔴 o render parou em ${r.erros.length} ponto(s):`);
    for (const x of r.erros) console.log(`  - ${x}`);
    process.exit(r.codigo);
  }
  console.log(`✅ ${r.medidas.quadros.length} quadros em ${join(pasta, valor('--saida') ?? '')}, fonte ${r.medidas.fonte}, medidas.json gravado`);
  console.log(`   ${origemDaPaleta()}`);
  for (const x of avisosDeContraste(T.cor)) console.log(`⚠️ ${x}`);
}
