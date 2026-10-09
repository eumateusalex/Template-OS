// recupera-simbolos-svg.mjs — devolve os SÍMBOLOS SVG que o <use href="#id">
// referencia e o ditto NÃO materializou.
//
// 🚨 Classe de defeito medida no framer-2. O Framer desenha
// ícones (setas de botão, checks) como `<use href="#id">` apontando para um
// `<svg id="id">` que ele injeta por JS num sprite oculto no <body>. A captura
// do ditto traz os `<use>` mas NÃO o sprite — o id fica órfão e o ícone
// renderiza VAZIO. Medido: 18 <use> em 2 ids na home, todas as setas de botão
// invisíveis. Nenhuma medição de rota/metadata/conteúdo/geometria acusa: o
// <use> ocupa a caixa certa, só não desenha.
//
// O conserto é GLOBAL (os ids são os mesmos em todas as rotas): injeta um
// sprite oculto no layout.tsx com cada <svg id="..."> copiado do original.
//
// O que o faz SE CALAR:
//   - nenhum <use> órfão no clone            -> não escreve
//   - o id não existe no original            -> declara, não escreve aquele
//   - o sprite já está no layout             -> não duplica (idempotente)
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8082 APP=<app> \
//   node recupera-simbolos-svg.mjs
//
// Variáveis: ORIGINAL, CLONE, APP (obrigatórias), ROTAS (lista p/ varrer órfãos
//   de várias rotas; padrão "/"), DITTO

import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ORIGINAL = process.env.ORIGINAL, CLONE = process.env.CLONE, APP = process.env.APP;
if (!ORIGINAL || !CLONE || !APP) { console.error("faltam ORIGINAL/CLONE/APP"); process.exit(1); }
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
const rotas = (process.env.ROTAS ?? "/").split(",").map((s) => s.trim()).filter(Boolean);
if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

const nav = await chromium.launch();

// 1. juntar os ids órfãos de todas as rotas do clone
const orfaos = new Set();
for (const rota of rotas) {
  const p = await nav.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(new URL(rota, CLONE).href, { waitUntil: "load", timeout: 60000 });
  await p.waitForTimeout(1500);
  const ids = await p.evaluate(() => {
    const out = [];
    for (const u of document.querySelectorAll("use")) {
      const h = u.getAttribute("href") || u.getAttribute("xlink:href") || "";
      if (h.startsWith("#") && !document.getElementById(h.slice(1))) out.push(h.slice(1));
    }
    return out;
  });
  for (const id of ids) orfaos.add(id);
  await p.close();
}
console.log(`ids órfãos no clone: ${orfaos.size} ${JSON.stringify([...orfaos])}`);
if (!orfaos.size) { console.log("nenhum órfão — nada a fazer"); await nav.close(); process.exit(0); }

// 2. extrair o outerHTML de cada símbolo no ORIGINAL
const p = await nav.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto(ORIGINAL, { waitUntil: "load", timeout: 60000 });
await p.waitForTimeout(2500);
const simbolos = await p.evaluate((ids) => ids.map((id) => {
  const el = document.getElementById(id);
  return el && el.tagName.toLowerCase() === "svg" ? { id, html: el.outerHTML } : { id, html: null };
}), [...orfaos]);
await p.close();
await nav.close();

const bons = simbolos.filter((s) => s.html);
for (const s of simbolos) if (!s.html) console.log(`⚠️ id ${s.id} não é <svg> no original — declarado, não escrito`);
if (!bons.length) { console.log("nenhum símbolo recuperável"); process.exit(0); }

// 3. injetar sprite oculto no layout.tsx
const layoutPath = join(APP, "src", "app", "layout.tsx");
let layout = readFileSync(layoutPath, "utf8");
const MARC_INI = "{/* ditto-simbolos-svg */}";
if (layout.includes(MARC_INI)) { console.log("sprite já no layout — não duplico"); process.exit(0); }

// sprite oculto: aria-hidden, fora do fluxo, os símbolos como <svg id> inertes.
// dangerouslySetInnerHTML porque é markup SVG bruto medido, não JSX.
const spriteHtml = bons.map((s) => s.html).join("");
const bloco =
  `        ${MARC_INI}\n` +
  `        <div aria-hidden="true" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} dangerouslySetInnerHTML={{ __html: ${JSON.stringify(spriteHtml)} }} />\n`;

// inserir logo após a abertura do <body ...>
const mBody = layout.match(/<body[^>]*>/);
if (!mBody) { console.error("não achei <body> no layout"); process.exit(1); }
const at = layout.indexOf(mBody[0]) + mBody[0].length;
layout = layout.slice(0, at) + "\n" + bloco + layout.slice(at);
writeFileSync(layoutPath, layout);
console.log(`✅ sprite com ${bons.length} símbolo(s) injetado no layout: ${bons.map((s) => s.id).join(", ")}`);
