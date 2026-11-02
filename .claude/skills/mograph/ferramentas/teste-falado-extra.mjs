// A régua do falado-extra.mjs e do que o falado.js faz com ela: a mídia das cenas, a palavra atrás
// da cabeça e a legenda por tipo de cena. Planta o defeito de cada uma e confere que reprova; a
// peça boa passa, montada de verdade (a /cortes e as cenas) e aberta no Chromium.
//   node teste-falado-extra.mjs
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { conferirFaladoExtra, htmlDoAtras, htmlDasMidias } from './falado-extra.mjs';
import { conferirPlano, preencherDoCorte } from './plano.mjs';
import { montarFalado } from './montar-falado.mjs';
import { abrirNavegador } from './navegador.mjs';
import { amostrar, telaDasAmostras } from './regua-direcao.mjs';
import { tempoMinimo } from './plano.mjs';
import { saidas, DESTINOS } from '../../../../scripts/marca/gerar.mjs';
import { MARCA_A, tokensDe, raizCom } from '../../../../scripts/marca/raiz-de-prova.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..', '..', '..');
const CATALOGO = JSON.parse(readFileSync(join(AQUI, '..', 'biblioteca', 'catalogo.json'), 'utf8'));
let testes = 0, falhas = 0;
const ok = (cond, msg) => { testes++; console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); if (!cond) falhas++; };
const so = (r) => [...new Set(r.erros.map((e) => e.regra))].sort().join(',');
const copia = (x) => JSON.parse(JSON.stringify(x));

// três frases: ele (legenda), a tela cheia, ele de novo com a palavra de trás
const PLANO = {
  nome: 'teste-falado-extra', modo: 'falado', destino: 'organico', fps: 30, filme: 'x', legenda: 'L2', duracao: 10,
  atras: { cena: 'S03', dona: 'o cliente', palavra: 'embora', em: 7.4, ate: 8.9, topo: 428, oculta_frase: [3],
    recorte: { src: 'ativos/recorte.webm', de: 7.0, dur: 2.5 } },
  cenas: [
    { id: 'S01', frase: 1, tipo: 'legenda', funcao: 'HOOK', camera: 'PARADA', de: 0, ate: 3.1 },
    { id: 'S02', frase: 2, tipo: 'tela-cheia', funcao: 'DEMONSTRATION', camera: 'PARADA', texto_tela: '', de: 3.1, ate: 6.5,
      midia: [{ id: 'lupa', src: 'ativos/lupa.webm', de: 3.3, ate: 6.2, x: 600, y: 700, w: 300 }] },
    { id: 'S03', frase: 3, tipo: 'legenda', funcao: 'TENSION', camera: 'PARADA', de: 6.5, ate: 10 }
  ]
};

// ─── 1 · as contas, sem navegador ────────────────────────────────────────────
let r = conferirFaladoExtra(PLANO);
ok(r.erros.length === 0, `o plano bom passa (${so(r) || 'nenhum'})`);
let p = copia(PLANO); p.atras.cena = 'S02';
ok(so(conferirFaladoExtra(p)) === 'atras', 'a palavra de trás numa tela cheia reprova (ele não está na tela)');
p = copia(PLANO); p.atras.palavra = 'o cliente embora';
ok(so(conferirFaladoExtra(p)) === 'atras', 'a palavra de trás com três palavras reprova (uma, grande)');
p = copia(PLANO); p.atras.ate = 8.0;
ok(so(conferirFaladoExtra(p)) === 'atras', 'a palavra que fica menos que o tempo de leitura reprova (0,6 s para "o cliente embora")');
p = copia(PLANO); p.atras.oculta_frase = [3, 'x'];
ok(so(conferirFaladoExtra(p)) === 'atras', 'oculta_frase que não é número de frase reprova');
p = copia(PLANO); p.atras.ate = 9.4;
ok(so(conferirFaladoExtra(p)) === 'atras', 'a palavra que fica além do recorte reprova (passaria na frente da cabeça)');
p = copia(PLANO); p.atras.recorte.src = 'ativos/recorte.mp4';
ok(so(conferirFaladoExtra(p)) === 'atras', 'o recorte sem transparência (mp4) reprova');
p = copia(PLANO); p.cenas[1].midia[0].src = 'ativos/lupa.png';
ok(so(conferirFaladoExtra(p)) === 'midia', 'a mídia que não é vídeo reprova');
p = copia(PLANO); p.cenas[1].midia.push({ ...p.cenas[1].midia[0] });
ok(so(conferirFaladoExtra(p)) === 'midia', 'a mídia com id repetido reprova');
p = copia(PLANO); p.cenas[1].midia[0].ate = 12;
ok(so(conferirFaladoExtra(p)) === 'midia', 'a mídia além do fim da peça reprova');
p = copia(PLANO); p.cenas[0].transicao = 'continuidade';
ok(so(conferirFaladoExtra(p)) === 'transicao', 'a continuidade saindo de uma cena com ele reprova (só entre duas telas cheias)');
p = copia(PLANO); p.cenas[2].tipo = 'tela-cheia'; p.cenas[1].transicao = 'continuidade'; delete p.atras;
ok(conferirFaladoExtra(p).erros.length === 0, 'a continuidade entre duas telas cheias passa');
// pelo conferirPlano: a regra chega lá, e a continuidade deixa de ser "costura que o motor não faz"
p = copia(PLANO); p.cenas[2].tipo = 'tela-cheia'; p.cenas[2].texto_tela = 'x'; p.cenas[1].transicao = 'continuidade'; delete p.atras;
r = conferirPlano(p, { catalogo: CATALOGO });
ok(!r.erros.some((e) => e.regra === 'transicao'), `conferirPlano: a continuidade entre telas cheias passa (${r.erros.map((e) => e.msg).join('; ') || 'nenhum'})`);
p = copia(PLANO); p.atras.cena = 'S02';
ok(conferirPlano(p, { catalogo: CATALOGO }).erros.some((e) => e.regra === 'atras'), 'conferirPlano: a palavra de trás errada reprova por ele também');
const h = htmlDoAtras(PLANO);
ok(/id="atras"[^>]*top:428px/.test(h) && /class="grande"[^>]*>embora</.test(h) && /<video id="atras-recorte" class="clip" src="ativos\/recorte\.webm" data-start="7" data-duration="2\.5"/.test(h),
  'o HTML da palavra: o topo, a palavra e o recorte com o tempo dele');
ok(htmlDoAtras({ ...PLANO, atras: { ...PLANO.atras, palavra: '<b>x</b>' } }).includes('&lt;b>x&lt;/b>'), 'a palavra entra como texto, nunca como HTML');
const atrasSo = h.slice(0, h.indexOf('<video'));
ok(!/#[0-9a-f]{3,6}\b|rgba?\(\s*\d|font-weight:\d/i.test(atrasSo) && !/\bInter\b/.test(atrasSo) && /color:var\(--on-light\)/.test(atrasSo) && /font-family:var\(--f-display\)/.test(atrasSo) && /font-weight:var\(--w-display-bold\)/.test(atrasSo),
  'a palavra de trás sai na fonte, no peso e na cor de texto da marca, sem cor nem fonte à mão');
const hm = htmlDasMidias(PLANO);
ok(/<video id="m-lupa" class="clip midia" data-cena="S02" src="ativos\/lupa\.webm" data-start="3\.3" data-duration="2\.9"/.test(hm) && /z-index:35/.test(hm), 'o HTML da mídia: o vídeo com o tempo, na camada acima das cenas');

// ─── 2 · montada de verdade e aberta no navegador ────────────────────────────
const pasta = mkdtempSync(join(RAIZ, 'rascunho', '.mograph-teste-extra-'));
const navegador = await abrirNavegador();
try {
  mkdirSync(join(pasta, 'cenas'), { recursive: true }); mkdirSync(join(pasta, 'ativos'), { recursive: true });
  const P = (frase, txt, ini) => txt.split(' ').map((texto, i) => ({ texto, inicio: +(ini + i * 0.4).toFixed(2), fim: +(ini + i * 0.4 + 0.32).toFixed(2), frase }));
  const palavras = [...P(1, 'aqui vão quatro coisas', 0.1), ...P(2, 'o título decide o clique', 3.2), ...P(3, 'manda o cliente embora', 6.6)];
  const frases = [[1, 0, 3.1], [2, 3.1, 6.5], [3, 6.5, 9.2]].map(([frase, a, b], i) => ({ frase, texto: palavras.filter((w) => w.frase === frase).map((w) => w.texto).join(' '), t_de: a, t_ate: b, escolhida: i, grupo: [i] }));
  writeFileSync(join(pasta, 'cortes.json'), JSON.stringify({ fps: 30, END: 10, END_voz: 9.2, respiro: { real: 0.8, congelado: 0 }, avisos: [], sincronia: null, voz: { lufs: -14, pico_dbtp: -1.2 },
    clipes: frases.map((f) => ({ frase: f.frase, escolhida: f.escolhida, t: f.t_de })), frases, palavras, trocas: [], descartados: [] }));
  writeFileSync(join(pasta, 'legenda.json'), JSON.stringify({ correcoes: {}, frases: ['aqui vão [quatro] coisas', 'o [título] decide o clique', 'manda o cliente embora'] }));
  writeFileSync(join(pasta, 'peca.json'), JSON.stringify({ ficha: 'duas-vozes', rosto: { cabelo_y: 700, queixo_y: 1000 }, gancho: '', capa: 'x', fatos: [], marca: 'neutra' }));
  writeFileSync(join(pasta, 'plano.json'), JSON.stringify(PLANO, null, 2));
  writeFileSync(join(pasta, 'cenas', 'S02.js'), 'CENA("S02", function (el, c) { el.style.background = "#eee"; });');
  // o vídeo de mentira: a montagem confere que existe, e a página não precisa tocá-lo aqui
  for (const n of ['recorte.webm', 'lupa.webm']) execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=black:s=64x64:d=1', '-c:v', 'libvpx-vp9', join(pasta, 'ativos', n)]);
  let erro = '';
  const semRecorte = copia(PLANO); semRecorte.atras.recorte.src = 'ativos/nao-existe.webm';
  writeFileSync(join(pasta, 'plano.json'), JSON.stringify(semRecorte));
  try { await montarFalado(pasta, { catalogo: CATALOGO }); } catch (e) { erro = e.message; }
  ok(/nao-existe\.webm/.test(erro), `montar: o recorte que não está na pasta reprova (${erro.split('\n')[0] || 'passou'})`);
  writeFileSync(join(pasta, 'plano.json'), JSON.stringify(PLANO, null, 2));
  await montarFalado(pasta, { catalogo: CATALOGO });
  const idx = readFileSync(join(pasta, 'index.html'), 'utf8');
  ok(idx.indexOf('id="camera"') < idx.indexOf('id="atras"') && idx.indexOf('id="atras"') < idx.indexOf('id="atras-recorte"') && idx.indexOf('id="atras-recorte"') < idx.indexOf('id="fatos"'),
    'montar: a palavra e o recorte entram no quadro da câmera, depois dela e nessa ordem (a pessoa na frente da palavra)');
  ok(idx.indexOf('id="m-lupa"') > 0 && idx.indexOf('id="m-lupa"') < idx.indexOf('<div id="legendas"'), 'montar: a mídia da cena entra no HTML, antes da legenda');
  mkdirSync(join(pasta, '_vendor'), { recursive: true });
  for (const v of ['gsap.min.js', 'CustomEase.min.js']) copyFileSync(join(RAIZ, '.claude', 'video', 'html', '_vendor', v), join(pasta, '_vendor', v));
  const pg = await navegador.newPage({ viewport: { width: 1080, height: 1920 } });
  const erros = [];
  pg.on('pageerror', (e) => erros.push(e.message));
  await pg.goto(pathToFileURL(join(pasta, 'index.html')).href);
  await pg.waitForFunction(() => !!(window.__timelines && window.__timelines.main), null, { timeout: 10000 });
  const em = (t) => pg.evaluate((t) => {
    window.__timelines.main.seek(t, false);
    const vis = (el) => !!el && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden' && +getComputedStyle(el).opacity > 0.5;
    const linha = (txt) => [...document.querySelectorAll('#legendas .texto')].find((l) => l.textContent.includes(txt));
    const g = document.querySelector('#atras .grande');
    return { grande: vis(g), recorte: vis(document.getElementById('atras-recorte')), soco: +gsap.getProperty(document.getElementById('soco'), 'scale'),
      pessoaNaFrente: document.getElementById('atras-recorte').compareDocumentPosition(g) === Node.DOCUMENT_POSITION_PRECEDING,
      apoioS02: vis(linha('decide')), chaveS02: vis(linha('título')), fraseDeTras: !!linha('embora') && getComputedStyle(linha('embora')).display !== 'none',
      apoioS01: vis(linha('aqui')) };
  }, t);
  const antes = await em(7.2), meio = await em(8.0), depois = await em(9.45), tela = await em(4.4), comEle = await em(1.6);
  ok(!antes.grande && !antes.recorte && meio.grande && meio.recorte && !depois.grande && !depois.recorte,
    `navegador: a palavra e o recorte só se veem juntos, de "em" à saída (${JSON.stringify({ antes: [antes.grande, antes.recorte], meio: [meio.grande, meio.recorte], depois: [depois.grande, depois.recorte] })})`);
  ok(meio.soco > 1.03 && Math.abs(depois.soco - 1) < 1e-3, `navegador: a câmera dá o soco com a palavra e volta (${meio.soco}, ${depois.soco})`);
  ok(meio.pessoaNaFrente, 'navegador: o recorte da pessoa vem depois da palavra no quadro (pinta por cima dela)');
  ok(!meio.fraseDeTras, 'navegador: a frase que a palavra de trás já diz sai da legenda');
  ok(tela.chaveS02 && !tela.apoioS02, `navegador: na tela cheia (L1) só a palavra forte; o apoio sai (${JSON.stringify({ chave: tela.chaveS02, apoio: tela.apoioS02 })})`);
  ok(comEle.apoioS01, 'navegador: com ele na tela (L2), a fala inteira');
  // a régua tela lê a palavra de trás como legenda (a régua dela é o tempo de leitura, acima), não como texto de cena sem dono
  const am = await amostrar(pasta, { navegador, formato: 'reel', instantes: [8.0, 8.3] });
  const rt = telaDasAmostras(am, PLANO, tempoMinimo);
  ok(!rt.erros.some((e) => /embora|o cliente/.test(e.msg)), `tela: a palavra de trás não conta como texto de cena (${rt.erros.map((e) => e.msg).join('; ') || 'nenhum'})`);
  ok(erros.length === 0, `navegador: sem erro de script (${erros.join('; ') || 'nenhum'})`);
  await pg.close();

  // a curva do falado é a da marca: o movimento.js gerado (a junção _marca) e, sem ele, o --ease-marca do tokens.css
  const prova = raizCom(tokensDe(MARCA_A));
  const movimento = saidas({ raiz: prova.raiz }).get(DESTINOS.movimentoMarca);
  prova.fora();
  const curvaDaPagina = async (init) => {
    const pp = await navegador.newPage({ viewport: { width: 1080, height: 1920 } });
    try {
      await pp.addInitScript(init);
      await pp.goto(pathToFileURL(join(pasta, 'index.html')).href);
      await pp.waitForFunction(() => !!(window.__timelines && window.__timelines.main), null, { timeout: 10000 });
      return await pp.evaluate((c) => {
        const marca = gsap.parseEase('marca');
        CustomEase.create('referencia', `M0,0 C${c[0]},${c[1]} ${c[2]},${c[3]} 1,1`);
        return { tem: typeof marca === 'function', meio: marca ? marca(0.5) : null, ref: gsap.parseEase('referencia')(0.5), power3: gsap.parseEase('power3.out')(0.5) };
      }, MARCA_A.curva);
    } finally { await pp.close(); }
  };
  const pelaJuncao = await curvaDaPagina({ content: movimento });
  ok(pelaJuncao.tem && Math.abs(pelaJuncao.meio - pelaJuncao.ref) < 1e-6 && Math.abs(pelaJuncao.meio - pelaJuncao.power3) > 1e-3,
    `navegador: com o movimento.js da marca, o falado registra a curva dela (${MARCA_A.curva.join(', ')}: ${pelaJuncao.meio} no meio)`);
  const peloCss = await curvaDaPagina({ content: `new MutationObserver((m, o) => { if (document.documentElement) { document.documentElement.style.setProperty('--ease-marca', 'cubic-bezier(${MARCA_A.curva.join(', ')})'); o.disconnect(); } }).observe(document, { childList: true });` });
  ok(peloCss.tem && Math.abs(peloCss.meio - peloCss.ref) < 1e-6, `navegador: sem o movimento.js, a curva sai do --ease-marca do tokens.css (${peloCss.meio} no meio)`);
} finally {
  await navegador.close();
  rmSync(pasta, { recursive: true, force: true });
}
console.log(`\n# tests ${testes}\n# fail ${falhas}`);
process.exit(falhas ? 1 : 0);
