// corrige-inercia.mjs — devolve ao clone o que o original mantém MORTO.
//
// 🚨 O contrapeso do corrige-interacao.mjs. Aquele existe porque o clone nasce
// sem receber mouse em lugar nenhum, e por isso revive todo interativo com
// uma regra larga:
//
//   a[href], button, input, select, textarea, summary { pointer-events: auto }
//
// Ela salva o clone, e nesta construção passou do ponto: reviveu os controles
// de um modal FECHADO. Medido na /ai-first do site-landing:
//
//   original: 6 alvos com pointer-events:none (o modal fechado)
//   clone:    0 alvos mortos — todos revividos pela regra larga
//
// Fidelidade não é "tudo clicável", é "clicável onde o original é". Um
// formulário que no original está fechado e no clone responde ao mouse é
// divergência, e das que enganam: nenhuma medição de rota, metadata,
// conteúdo ou geometria acusa, porque a caixa está no lugar certo.
//
// 🚨 O QUE ELE PROCURA: contêiner que o ORIGINAL deixa deliberadamente inerte
// — `pointer-events:none` E `opacity:0` juntos, que é a assinatura de camada
// fechada (modal, drawer, menu). Não basta `pointer-events:none`: elemento
// decorativo tem isso o tempo todo e não contém interativo nenhum.
//
// 🚨 COMO CASAR UM CONTÊINER SEM TEXTO: pelo DESCENDENTE com texto próprio,
// subindo o mesmo número de níveis. Mesmo método do corrige-viewport.mjs.
//
// O que o faz SE CALAR:
//   - nenhum contêiner inerte no original       -> não escreve
//   - o contêiner não casa no clone             -> declara, não escreve
//   - o clone já mantém aquele contêiner morto  -> declara, não escreve
//   - mais regras que MAX_REGRAS                -> declara, não escreve nada
//
// 🚨 REGRA 4: dono de `pointer-events` DENTRO de camada fechada. A regra larga
// do corrige-interacao.mjs continua valendo no resto da página; esta a vence
// só onde foi medido que deve vencer.
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 APP=<app> \
//   ROTAS=<med>/rotas.json SAIDA=<med>/inercia node corrige-inercia.mjs

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
const MAX_REGRAS = Number(process.env.MAX_REGRAS ?? 20);
const ESCREVER = process.env.ESCREVER !== "0";
const SAIDA = resolve(process.env.SAIDA ?? "./inercia");
const DITTO = process.env.DITTO ?? "C:/dev/ditto";

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

const INTERATIVOS = 'a[href],button,input,select,textarea,summary,[role="button"]';

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

/** No ORIGINAL: camadas fechadas que CONTÊM interativo, com âncora de
 *  descendente para reencontrá-las no clone. */
const COLHER_ORIGINAL = (sel) => {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const textoProprio = (el) => {
    let t = "";
    for (const n of el.childNodes) if (n.nodeType === 3) t += n.nodeValue;
    return norm(t);
  };
  const saida = [];
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.pointerEvents !== "none") continue;
    if (parseFloat(cs.opacity) !== 0) continue;      // fechada, não só decorativa
    const dentro = el.querySelectorAll(sel);
    if (!dentro.length) continue;
    // quantos deles o original realmente mantém mortos
    let mortos = 0;
    for (const d of dentro) if (getComputedStyle(d).pointerEvents === "none") mortos++;
    if (!mortos) continue;

    let ancora = null;
    const fila = [{ el, prof: 0 }];
    while (fila.length) {
      const { el: e, prof } = fila.shift();
      if (prof > 0 && textoProprio(e)) { ancora = { tag: e.tagName.toLowerCase(), texto: textoProprio(e).slice(0, 60), prof }; break; }
      for (const c of e.children) fila.push({ el: c, prof: prof + 1 });
      if (prof > 6) break;
    }
    if (!ancora) continue;
    saida.push({ tag: el.tagName.toLowerCase(), interativos: dentro.length, mortos, ancora });
  }
  return saida;
};

/** No CLONE: acha o contêiner pela âncora e diz se ele já está morto. */
const CASAR_CLONE = ({ pedidos, sel }) => {
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
    const cand = porChave.get(`${p.ancora.tag}|${p.ancora.texto}`) || [];
    if (cand.length !== 1) { saida.push({ ancora: p.ancora.texto, erro: cand.length ? "âncora ambígua" : "âncora não achada" }); continue; }
    let no = cand[0];
    for (let i = 0; i < p.ancora.prof && no; i++) no = no.parentElement;
    if (!no || no === document.body) { saida.push({ ancora: p.ancora.texto, erro: "subida saiu da árvore" }); continue; }
    const cid = no.getAttribute("data-cid");
    if (!cid) { saida.push({ ancora: p.ancora.texto, erro: "contêiner sem data-cid" }); continue; }
    const dentro = no.querySelectorAll(sel);
    let vivos = 0;
    for (const d of dentro) if (getComputedStyle(d).pointerEvents !== "none") vivos++;
    saida.push({ ancora: p.ancora.texto, cid, tag: no.tagName.toLowerCase(), interativos: dentro.length, vivos });
  }
  return saida;
};

async function abrir(nav, url, fn, arg) {
  const ctx = await nav.newContext({ viewport: { width: LARGURA, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const r = await page.evaluate(fn, arg);
  await ctx.close();
  return r;
}

mkdirSync(SAIDA, { recursive: true });
const nav = await chromium.launch();
const relatorio = [];

for (const rota of rotas()) {
  const uo = new URL(rota, ORIGINAL).href;
  const uc = new URL(rota, CLONE).href;
  console.log(`\n=== ${rota}`);

  const fechadas = await abrir(nav, uo, COLHER_ORIGINAL, INTERATIVOS);
  console.log(`   camadas FECHADAS no original, com interativo dentro: ${fechadas.length}`);
  if (!fechadas.length) { relatorio.push({ rota, fechadas: 0, regras: 0, recusas: [] }); continue; }
  for (const f of fechadas) console.log(`     <${f.tag}> ${f.mortos}/${f.interativos} inertes  âncora: "${f.ancora.texto.slice(0, 34)}"`);

  const casados = await abrir(nav, uc, CASAR_CLONE, { pedidos: fechadas, sel: INTERATIVOS });
  const regras = [];
  const recusas = [];
  for (const c of casados) {
    if (c.erro) { recusas.push(`${c.ancora.slice(0, 30)}: ${c.erro}`); continue; }
    if (!c.vivos) { recusas.push(`${c.cid}: o clone já mantém os ${c.interativos} inertes`); continue; }
    const partes = INTERATIVOS.split(",").map((s) => `[data-cid="${c.cid}"] ${s}`);
    regras.push(
      `  /* <${c.tag}> cid=${c.cid}: o original mantém esta camada fechada; o clone tinha ${c.vivos} de ${c.interativos} vivos */\n` +
      `  ${partes.join(",\n  ")} { pointer-events: none !important; }`,
    );
  }

  const dir = rota === "/" ? join(APP, "src/app") : join(APP, "src/app", rota.replace(/^\//, ""));
  const arq = join(dir, "inercia.css");
  if (!regras.length) {
    console.log("   ✅ nada a corrigir");
  } else if (regras.length > MAX_REGRAS) {
    console.log(`   ⛔ ${regras.length} acima do teto ${MAX_REGRAS} — não escrevi nada`);
  } else if (!existsSync(dir)) {
    console.log(`   ⛔ pasta da rota não existe: ${dir}`);
  } else if (ESCREVER) {
    writeFileSync(arq, [
      "/* inercia.css — o que o ORIGINAL mantém morto e a regra larga de",
      "   desbloqueio tinha revivido. Medido por scripts/corrige-inercia.mjs.",
      `   Origem: ${uo} @${LARGURA}px */`,
      ...regras,
    ].join("\n") + "\n");
    console.log(`   ✅ ${regras.length} bloco(s) -> ${arq}`);
  } else {
    console.log(`   (ESCREVER=0) ${regras.length} bloco(s) seriam escritos`);
  }
  for (const r of recusas) console.log(`   ⚠️ ${r}`);
  relatorio.push({ rota, fechadas: fechadas.length, regras: regras.length, recusas });
}

await nav.close();
writeFileSync(join(SAIDA, "inercia.json"), JSON.stringify({ LARGURA, relatorio }, null, 2));
console.log("\n" + "=".repeat(70));
console.log(`TOTAL: ${relatorio.reduce((s, r) => s + r.regras, 0)} bloco(s) · ${relatorio.reduce((s, r) => s + r.recusas.length, 0)} declarado(s)`);
console.log("🚨 rodar entrega-inline.mjs com inercia.css na lista e rebuildar.");
