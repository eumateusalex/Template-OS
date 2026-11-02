// As opções de capa de uma peça do HyperFrames: um quadro da peça parado no instante pedido, sem a
// camada de título da cena, com a frase da capa por cima. Com mais de um instante (ou topo, ou
// tamanho), sai uma capa por opção e a folha lado a lado, com o recorte 3:4 da grade do perfil
// marcado: o que fica fora dele some na grade.
//
//   node capa.mjs <pasta da peça | index.html> <saida.png> --em <s>[,<s>,<s>] --texto "<html da frase>"
//        [--topo 760[,...]] [--tamanho 120[,...]] [--esconde "<seletor>"]
//        [--esquerda 132] [--largura 840] [--cor "<cor css>"] [--peso <peso>] [--estilo "<css a mais>"]
//
// --em, --topo e --tamanho aceitam uma lista por vírgula: cada lista tem 1 valor (vale para todas)
// ou o mesmo número de valores (uma capa por posição). Com uma capa só, ela sai em <saida.png>;
// com várias, em <saida>-1.png, <saida>-2.png... e a folha em <saida>-folha.png.
// --esconde: a camada de título a tirar (padrão: a última camada do #root que não é <audio>,
// <script>, <style> nem <template>). O --texto é HTML: a classe da peça (o <span class="grad">)
// vale, porque a frase entra dentro do #root.
// A frase sai na marca da peça: a fonte --f-display, o peso --w-display-bold e a cor --on-light do
// tokens.css que a peça carrega (o gerado de identidade/marca.tokens.json, pela junção _marca; na peça
// de cliente, os tokens do dono). --cor e --peso trocam só nesta capa, por um valor CSS
// (var(--accent), por exemplo).
// Reprova (código 1) a frase que sai do recorte 3:4 da grade ou da largura do quadro.
import { createRequire } from 'node:module';
import { readFileSync, existsSync, statSync, realpathSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..', '..', '..', '..');

async function abrirNavegador() {
  let chromium;
  try {
    ({ chromium } = createRequire(join(RAIZ, 'scripts', 'package.json'))('playwright'));
  } catch {
    throw new Error(`o Playwright não foi achado em ${join(RAIZ, 'scripts', 'node_modules')}: rode "npm --prefix scripts install" na raiz do workspace`);
  }
  return chromium.launch({ headless: true });
}

/** o recorte 3:4 da grade do perfil, no meio do quadro */
export function recorteDaGrade(largura, altura) {
  const h = Math.min(altura, Math.round((largura * 4) / 3));
  const topo = Math.round((altura - h) / 2);
  return { topo, base: topo + h, esquerda: 0, direita: largura };
}

const lista = (v) => String(v).split(',').map((s) => Number(s.trim()));

export function opcoes({ em, topo = 760, tamanho = 120 }) {
  const ls = { em: lista(em), topo: lista(topo), tamanho: lista(tamanho) };
  const n = Math.max(...Object.values(ls).map((l) => l.length));
  for (const [k, l] of Object.entries(ls)) {
    if (l.some((x) => !Number.isFinite(x))) throw new Error(`--${k} precisa de número (${l.join(',')})`);
    if (l.length !== 1 && l.length !== n) throw new Error(`--${k} tem ${l.length} valores, e as outras listas pedem ${n}`);
  }
  return Array.from({ length: n }, (_, i) => ({ em: ls.em[ls.em.length > 1 ? i : 0], topo: ls.topo[ls.topo.length > 1 ? i : 0], tamanho: ls.tamanho[ls.tamanho.length > 1 ? i : 0] }));
}

export const COR_DA_MARCA = 'var(--on-light)';
export const PESO_DA_MARCA = 'var(--w-display-bold)';

export async function capas(alvo, saida, { em, texto, topo, tamanho, esconde, esquerda = 132, largura = 840, cor = COR_DA_MARCA, peso = PESO_DA_MARCA, estilo = '' }) {
  if (em === undefined || !texto) throw new Error('falta --em ou --texto');
  const arq = existsSync(alvo) && statSync(alvo).isDirectory() ? join(alvo, 'index.html') : alvo;
  if (!existsSync(arq)) throw new Error(`não há ${arq}`);
  const root = readFileSync(arq, 'utf8').match(/<div\b[^>]*\bid="root"[^>]*>/);
  if (!root) throw new Error(`${arq} não tem o #root`);
  const dim = (k, d) => Number((root[0].match(new RegExp(`data-${k}="(\\d+)"`)) || [])[1] || d);
  const W = dim('width', 1080), H = dim('height', 1920);
  const grade = recorteDaGrade(W, H);
  const ops = opcoes({ em, topo, tamanho });
  const base = resolve(saida).replace(/\.png$/i, '');
  const nomes = ops.length === 1 ? [`${base}.png`] : ops.map((_, i) => `${base}-${i + 1}.png`);
  const nav = await abrirNavegador();
  const r = { arquivos: [], caixas: [], erros: [], folha: null, grade };
  try {
    for (const [i, o] of ops.entries()) {
      const pag = await nav.newPage({ viewport: { width: W, height: H } });
      await pag.goto(pathToFileURL(resolve(arq)).href);
      await pag.waitForFunction(() => window.__timelines && Object.keys(window.__timelines).length > 0);
      const caixa = await pag.evaluate(async ({ o, texto, esconde, esquerda, largura, cor, peso, estilo }) => {
        await document.fonts.ready;
        const root = document.getElementById('root');
        const tl = window.__timelines[root.dataset.compositionId] || Object.values(window.__timelines)[0];
        tl.pause?.();
        tl.seek(o.em, false);
        // a camada de título da cena: a pedida, ou a última camada do #root
        const camadas = [...root.children].filter((e) => !/^(AUDIO|SCRIPT|STYLE|TEMPLATE)$/.test(e.tagName));
        const titulo = esconde ? document.querySelector(esconde) : camadas[camadas.length - 1];
        if (!titulo) return { erro: `nada casa com --esconde "${esconde}"` };
        titulo.style.visibility = 'hidden';
        const h = document.createElement('div');
        h.dataset.capa = '';
        h.style.cssText = `position:absolute;left:${esquerda}px;top:${o.topo}px;width:${largura}px;font-size:${o.tamanho}px;font-family:var(--f-display);font-weight:${peso};letter-spacing:-0.035em;line-height:1.02;color:${cor};z-index:2147483647;${estilo}`;
        h.innerHTML = texto;
        root.appendChild(h);
        await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
        // a caixa da tinta: a união das linhas do texto (o div pode ser mais largo que a frase)
        const rg = document.createRange();
        rg.selectNodeContents(h);
        const rs = [...rg.getClientRects()].filter((q) => q.width && q.height);
        const raiz = root.getBoundingClientRect();
        const cs = getComputedStyle(h);
        return { cor: cs.color, fonte: cs.fontFamily, peso: cs.fontWeight, topo: Math.min(...rs.map((q) => q.top)) - raiz.top, base: Math.max(...rs.map((q) => q.bottom)) - raiz.top, esquerda: Math.min(...rs.map((q) => q.left)) - raiz.left, direita: Math.max(...rs.map((q) => q.right)) - raiz.left };
      }, { o, texto, esconde, esquerda, largura, cor, peso, estilo });
      if (caixa.erro) throw new Error(caixa.erro);
      await pag.waitForTimeout(300);
      await pag.screenshot({ path: nomes[i] });
      await pag.close();
      r.arquivos.push(nomes[i]);
      r.caixas.push(caixa);
      const nome = ops.length === 1 ? 'a frase' : `a frase da capa ${i + 1}`;
      if (caixa.topo < grade.topo || caixa.base > grade.base) r.erros.push(`${nome} sai do recorte 3:4 da grade (${Math.round(caixa.topo)} a ${Math.round(caixa.base)} px; a grade mostra ${grade.topo} a ${grade.base})`);
      if (caixa.esquerda < 0 || caixa.direita > W) r.erros.push(`${nome} sai da largura do quadro (${Math.round(caixa.esquerda)} a ${Math.round(caixa.direita)} px de ${W})`);
    }
    if (ops.length > 1) r.folha = await folha(nav, r.arquivos, ops, { W, H, grade, saida: `${base}-folha.png` });
  } finally {
    await nav.close();
  }
  return r;
}

// a folha: as capas lado a lado a 1/3, com o que fica fora do recorte 3:4 escurecido e o recorte
// riscado, e o instante embaixo de cada uma
async function folha(nav, arquivos, lista, { W, H, grade, saida }) {
  const k = 360 / W, w = 360, h = Math.round(H * k);
  const t = Math.round(grade.topo * k), b = Math.round(grade.base * k);
  const cartao = (arq, o, i) => `<figure><div class="q"><img src="data:image/png;base64,${readFileSync(arq).toString('base64')}"><i style="top:0;height:${t}px"></i><i style="top:${b}px;bottom:0"></i><b style="top:${t}px;height:${b - t}px"></b></div><figcaption>${i + 1} · ${String(o.em).replace('.', ',')} s</figcaption></figure>`;
  // a folha é página de revisão (o chrome neutro, fora da peça)
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:24px;background:#f2f2f2;font:600 18px system-ui,sans-serif;color:#222;display:flex;gap:24px}figure{margin:0}.q{position:relative;width:${w}px;height:${h}px;overflow:hidden}img{width:${w}px;height:${h}px;display:block}i{position:absolute;left:0;right:0;background:rgba(0,0,0,.55)}b{position:absolute;left:0;right:0;outline:2px dashed #e5484d;outline-offset:-2px}figcaption{margin-top:10px}</style>${arquivos.map((a, i) => cartao(a, lista[i], i)).join('')}`; // tecnico: a folha de revisão
  const pag = await nav.newPage({ viewport: { width: 24 + arquivos.length * (w + 24), height: h + 90 } });
  await pag.setContent(html);
  await pag.screenshot({ path: saida, fullPage: true });
  await pag.close();
  return saida;
}

function chamadoDireto() {
  try { return !!process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
}

if (chamadoDireto()) {
  const [alvo, saida] = process.argv.slice(2);
  const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : undefined; };
  if (!alvo || !saida || alvo.startsWith('--') || saida.startsWith('--') || arg('em') === undefined || !arg('texto')) {
    console.error('uso: capa.mjs <pasta | index.html> <saida.png> --em <s>[,...] --texto "<html>" [--topo 760] [--tamanho 120] [--esconde "<seletor>"] [--esquerda 132] [--largura 840] [--cor "<cor css>"] [--peso <peso>] [--estilo "<css>"]');
    process.exitCode = 2;
  } else {
    try {
      const num = (n, d) => (arg(n) === undefined ? d : Number(arg(n)));
      const r = await capas(alvo, saida, { em: arg('em'), texto: arg('texto'), topo: arg('topo') ?? 760, tamanho: arg('tamanho') ?? 120, esconde: arg('esconde'), esquerda: num('esquerda', 132), largura: num('largura', 840), cor: arg('cor') ?? COR_DA_MARCA, peso: arg('peso') ?? PESO_DA_MARCA, estilo: arg('estilo') ?? '' });
      for (const a of r.arquivos) console.log(`capa: ${a}`);
      if (r.folha) console.log(`folha: ${r.folha} (o tracejado é o recorte 3:4 da grade, ${r.grade.topo} a ${r.grade.base} px)`);
      for (const e of r.erros) console.log(`REPROVA ${e}`);
      process.exitCode = r.erros.length ? 1 : 0;
    } catch (e) {
      console.error(e.message);
      process.exitCode = 1;
    }
  }
}
