// corrige-caixa-vazia.mjs — o ditto perde a LARGURA de elemento decorativo.
//
// 🚨 Classe de defeito medida no clone do site-landing.
// Elemento sem texto e sem filhos — um pontinho, uma barra, um
// separador — costuma ser dimensionado por `width` e `height` no original. O
// ditto emite só a altura, e como não há conteúdo que force largura, a caixa
// COLAPSA para zero:
//
//   original /links   : <i> width 5px, height 5px
//   clone    /links   : <i> width 0px, height 5px
//   original /ai-first: <i> width 6px  ·  clone: 0px
//
// O estrago é lateral e some no meio da linha: o crachá inteiro fica 5px mais
// estreito, e o `compara-geometria` acusa o ELEMENTO PAI fora do lugar, nunca
// o pontinho — porque o pontinho não tem texto e não entra no casamento.
//
// 🚨 COMO CASAR UM ELEMENTO SEM TEXTO. Ele não casa por texto, e casar por
// índice global quebra ao primeiro elemento a mais de um lado. A saída é
// ancorar no parente:
//
//   1. no clone, achar o elemento de largura (ou altura) ZERO
//   2. subir até o ancestral mais próximo que tenha texto próprio
//   3. casar ESSE ancestral no original, por texto — que é o casamento
//      confiável que os outros instrumentos já usam
//   4. dentro do ancestral casado, pegar o filho de MESMO ÍNDICE
//
// O índice só é usado DENTRO de um par já casado por texto, que é onde ele é
// seguro.
//
// O que o faz SE CALAR:
//   - nenhum elemento colapsado na rota          -> não escreve
//   - o ancestral com texto não casa no original -> declara, não escreve
//   - o par tem contagem de filhos diferente     -> declara, não escreve
//   - o original TAMBÉM tem zero ali             -> declara, não escreve
//   - mais regras que MAX_REGRAS                 -> declara, não escreve nada
//
// 🚨 REGRA 4: este instrumento é dono de `width`/`height` de caixa vazia, e de
// mais nada. Não toca em tipografia nem em posição.
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 APP=<app> \
//   ROTAS=<med>/rotas.json SAIDA=<med>/caixa node corrige-caixa-vazia.mjs
//
// Variáveis:
//   ORIGINAL/CLONE/APP  obrigatórias
//   ROTA | ROTAS        rota única, ou o rotas.json
//   LARGURA             viewport da medição (padrão 1280)
//   MAX_REGRAS          teto por rota (padrão 200)
//   ESCREVER            0 simula sem tocar em arquivo

import { createRequire } from "node:module";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const ORIGINAL = process.env.ORIGINAL;
const CLONE = process.env.CLONE;
const APP = process.env.APP;
if (!ORIGINAL || !CLONE || !APP) {
  console.error("faltam ORIGINAL, CLONE e/ou APP");
  process.exit(1);
}
const LARGURA = Number(process.env.LARGURA ?? 1280);
const MAX_REGRAS = Number(process.env.MAX_REGRAS ?? 200);
const ESCREVER = process.env.ESCREVER !== "0";
const SAIDA = resolve(process.env.SAIDA ?? "./caixa-vazia");
const DITTO = process.env.DITTO ?? "C:/dev/ditto";

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

function rotas() {
  const arq = process.env.ROTAS;
  if (arq && existsSync(arq)) {
    const j = JSON.parse(readFileSync(arq, "utf8"));
    const lista = j.rotas ?? j;
    return (Array.isArray(lista) ? lista : Object.keys(lista))
      .map((r) => (typeof r === "string" ? r : r.rota ?? r.path))
      .filter(Boolean);
  }
  if (arq) return arq.split(",").map((s) => s.trim()).filter(Boolean);
  return [process.env.ROTA ?? "/"];
}

/** No CLONE: acha caixa colapsada e devolve a âncora (texto do ancestral +
 *  índice do filho) que permite reencontrá-la no original. */
const COLHER_CLONE = () => {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const textoProprio = (el) => {
    let t = "";
    for (const n of el.childNodes) if (n.nodeType === 3) t += n.nodeValue;
    return norm(t);
  };
  const saida = [];
  for (const el of document.querySelectorAll("body *")) {
    const cid = el.getAttribute("data-cid");
    if (!cid) continue;
    if (el.children.length) continue;          // só folha da árvore
    if (norm(el.textContent)) continue;        // e sem texto
    const r = el.getBoundingClientRect();
    const colapsaW = r.width === 0 && r.height > 0;
    const colapsaH = r.height === 0 && r.width > 0;
    if (!colapsaW && !colapsaH) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.position === "fixed") continue;

    // sobe até um ancestral com texto próprio, guardando o caminho de índices
    const caminho = [];
    let no = el;
    let anc = el.parentElement;
    while (anc && anc !== document.body) {
      caminho.unshift([...anc.children].indexOf(no));
      if (textoProprio(anc)) break;
      no = anc;
      anc = anc.parentElement;
    }
    if (!anc || anc === document.body) continue;
    saida.push({
      cid,
      tag: el.tagName.toLowerCase(),
      w: Math.round(r.width * 100) / 100,
      h: Math.round(r.height * 100) / 100,
      ancoraTag: anc.tagName.toLowerCase(),
      ancoraTexto: textoProprio(anc).slice(0, 60),
      caminho,
      colapsa: colapsaW ? "w" : "h",
    });
  }
  return saida;
};

/** No ORIGINAL: dado (tag+texto do ancestral, caminho de índices), mede a
 *  caixa correspondente. */
const MEDIR_ORIGINAL = ({ pedidos }) => {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const textoProprio = (el) => {
    let t = "";
    for (const n of el.childNodes) if (n.nodeType === 3) t += n.nodeValue;
    return norm(t);
  };
  const porChave = new Map();
  for (const el of document.querySelectorAll("body *")) {
    const t = textoProprio(el);
    if (!t) continue;
    const k = `${el.tagName.toLowerCase()}|${t.slice(0, 60)}`;
    if (!porChave.has(k)) porChave.set(k, []);
    porChave.get(k).push(el);
  }
  const saida = [];
  for (const p of pedidos) {
    const cand = porChave.get(`${p.ancoraTag}|${p.ancoraTexto}`) || [];
    if (cand.length !== 1) { saida.push({ cid: p.cid, erro: cand.length ? "âncora ambígua" : "âncora não achada" }); continue; }
    let no = cand[0];
    let ok = true;
    for (const i of p.caminho) {
      if (!no || !no.children || i < 0 || i >= no.children.length) { ok = false; break; }
      no = no.children[i];
    }
    if (!ok || !no) { saida.push({ cid: p.cid, erro: "caminho não bate (contagem de filhos difere)" }); continue; }
    if (no.tagName.toLowerCase() !== p.tag) { saida.push({ cid: p.cid, erro: `tag difere: original=${no.tagName.toLowerCase()} clone=${p.tag}` }); continue; }
    const r = no.getBoundingClientRect();
    const cs = getComputedStyle(no);
    saida.push({
      cid: p.cid,
      w: Math.round(r.width * 100) / 100,
      h: Math.round(r.height * 100) / 100,
      // 🚨 o valor a escrever é o DECLARADO, não o renderizado: o pontinho
      // pulsa com transform:scale, então a caixa medida (4.36) é menor que a
      // largura de verdade (5px). Escrever o renderizado encolheria o elemento.
      width: cs.width,
      height: cs.height,
    });
  }
  return saida;
};

async function abrir(nav, url) {
  const ctx = await nav.newContext({ viewport: { width: LARGURA, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1800);
  return { ctx, page };
}

mkdirSync(SAIDA, { recursive: true });
const nav = await chromium.launch();
const relatorio = [];

for (const rota of rotas()) {
  const uo = new URL(rota, ORIGINAL).href;
  const uc = new URL(rota, CLONE).href;
  console.log(`\n=== ${rota}`);

  const c = await abrir(nav, uc);
  const colapsadas = await c.page.evaluate(COLHER_CLONE);
  await c.ctx.close();
  console.log(`   caixas colapsadas no clone: ${colapsadas.length}`);
  if (!colapsadas.length) { relatorio.push({ rota, colapsadas: 0, regras: 0, recusas: [] }); continue; }

  const o = await abrir(nav, uo);
  const medidas = await o.page.evaluate(MEDIR_ORIGINAL, { pedidos: colapsadas });
  await o.ctx.close();

  const porCid = new Map(medidas.map((m) => [m.cid, m]));
  const regras = [];
  const recusas = [];
  for (const p of colapsadas) {
    const m = porCid.get(p.cid);
    if (!m || m.erro) { recusas.push(`${p.cid}: ${m?.erro ?? "sem medida"}`); continue; }
    const alvo = p.colapsa === "w" ? m.width : m.height;
    const n = parseFloat(alvo);
    if (!Number.isFinite(n) || n <= 0) { recusas.push(`${p.cid}: original também é ${alvo}`); continue; }
    const prop = p.colapsa === "w" ? "width" : "height";
    regras.push(`  [data-cid="${p.cid}"][data-cid]{${prop}:${n}px}  /* <${p.tag}> vazio que a captura colapsou */`);
  }

  const dir = rota === "/" ? join(APP, "src/app") : join(APP, "src/app", rota.replace(/^\//, ""));
  const arq = join(dir, "caixa.css");
  if (!regras.length) {
    console.log("   ✅ nada a corrigir");
  } else if (regras.length > MAX_REGRAS) {
    console.log(`   ⛔ ${regras.length} acima do teto ${MAX_REGRAS} — não escrevi nada`);
  } else if (!existsSync(dir)) {
    console.log(`   ⛔ pasta da rota não existe: ${dir}`);
  } else if (ESCREVER) {
    const L = [
      "/* caixa.css — largura/altura de elemento vazio que a captura colapsou.",
      "   Medido no original por scripts/corrige-caixa-vazia.mjs.",
      `   Origem: ${uo} @${LARGURA}px  ·  valor DECLARADO, não o renderizado. */`,
      ...regras,
    ];
    writeFileSync(arq, L.join("\n") + "\n");
    console.log(`   ✅ ${regras.length} regra(s) -> ${arq}`);
  } else {
    console.log(`   (ESCREVER=0) ${regras.length} regra(s) seriam escritas`);
  }
  for (const r of recusas.slice(0, 8)) console.log(`   ⚠️ ${r}`);
  if (recusas.length > 8) console.log(`   ⚠️ ... e mais ${recusas.length - 8}`);

  relatorio.push({ rota, colapsadas: colapsadas.length, regras: regras.length, recusas });
}

await nav.close();
writeFileSync(join(SAIDA, "caixa-vazia.json"), JSON.stringify({ LARGURA, relatorio }, null, 2));
console.log("\n" + "=".repeat(70));
const tot = relatorio.reduce((s, r) => s + r.regras, 0);
const totRec = relatorio.reduce((s, r) => s + r.recusas.length, 0);
console.log(`TOTAL: ${tot} regra(s) · ${totRec} recusada(s) e declarada(s)`);
console.log("🚨 rodar entrega-inline.mjs e rebuildar — escrever não liga.");
