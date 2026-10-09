// corrige-line-height.mjs — o line-height ARREDONDADO, mesmo com font-size igual.
//
// 🚨 Variante que o `corrige-tipografia` não pega, medida no framer-2.
// Aquele instrumento corrige onde a ESCALA DE TIPO trava (font
// fluido arredondado). Aqui o font-size bate nos dois lados (16px = 16px) e
// mesmo assim o line-height sai arredondado: 21.76px → 22px.
//
// 🚨 O estrago é DESPROPORCIONAL ao número. Medido em /patients-stories: o
// container é `flex-direction: column` com `flex-wrap: wrap` e altura fixa de
// 56.6px. No original os dois filhos somam 21.8 + 12 (gap) + 22.8 = 56.6 e
// EMPILHAM. No clone somam 56.8 — os 0.24px do arredondamento estouram a
// altura, o wrap dispara, e o segundo bloco quebra para uma NOVA COLUNA: os
// dois ficam lado a lado, 18px fora do lugar. Um desvio de 18px na tela cuja
// causa é 0.2px de line-height.
//
// Por isso a régua não é "diferença visível": é diferença NENHUMA. Qualquer
// fração perdida pode cruzar um limite de layout em algum lugar da página.
//
// Escreve em `ratio` (sem unidade) quando bate com o font-size, porque assim a
// regra sobrevive a mudança de tamanho; senão, em px medido.
//
// O que o faz SE CALAR:
//   - nenhum elemento com line-height divergente  -> não escreve
//   - o texto não casa entre os lados             -> declara, não escreve
//   - diferença abaixo de TOL                     -> ignora
//   - mais regras que MAX_REGRAS                  -> declara, não escreve nada
//
// Uso:
//   ORIGINAL=... CLONE=... APP=<app> ROTAS=</a,/b|rotas.json>
//   node corrige-line-height.mjs
//
// Variáveis: ORIGINAL, CLONE, APP (obrigatórias), ROTAS (padrão /),
//   TOL (px, padrão 0.1), MAX_REGRAS (padrão 400), FAIXA, ESCREVER, DITTO

import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync, statSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const ORIGINAL = process.env.ORIGINAL, CLONE = process.env.CLONE, APP = process.env.APP;
if (!ORIGINAL || !CLONE || !APP) { console.error("faltam ORIGINAL/CLONE/APP"); process.exit(1); }
const TOL = Number(process.env.TOL ?? 0.1);
const MAX_REGRAS = Number(process.env.MAX_REGRAS ?? 400);
const FAIXA = process.env.FAIXA ?? "(min-width: 1024px)";
const ESCREVER = process.env.ESCREVER !== "0";
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

function carregarRotas() {
  const bruto = process.env.ROTAS ?? "/";
  if (existsSync(bruto) && statSync(bruto).isFile()) {
    const j = JSON.parse(readFileSync(bruto, "utf8"));
    return (j.rotas ?? j).map((r) => r.rota ?? r).filter((r) => typeof r === "string");
  }
  return bruto.split(",").map((s) => s.trim()).filter(Boolean);
}

// colhe (texto → line-height, font-size) de todo elemento com texto próprio
const COLETOR = () => {
  const out = {};
  for (const el of document.querySelectorAll("p,h1,h2,h3,h4,h5,h6,span,a,li,div")) {
    let proprio = "";
    for (const n of el.childNodes) if (n.nodeType === 3) proprio += n.textContent;
    proprio = proprio.replace(/\s+/g, " ").trim();
    if (proprio.length < 3) continue;
    const cs = getComputedStyle(el);
    const chave = el.tagName + "|" + proprio.slice(0, 44);
    if (out[chave]) continue;
    out[chave] = {
      lh: Math.round(parseFloat(cs.lineHeight) * 100) / 100,
      fs: Math.round(parseFloat(cs.fontSize) * 100) / 100,
      cid: el.getAttribute("data-cid"),
    };
  }
  return out;
};

const nav = await chromium.launch();
async function colher(base, rota) {
  const p = await nav.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(new URL(rota, base).href, { waitUntil: "load", timeout: 60000 });
  await p.waitForTimeout(1800);
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } scrollTo(0, 0); });
  await p.waitForTimeout(1000);
  const r = await p.evaluate(COLETOR);
  await p.close();
  return r;
}

let total = 0;
for (const rota of carregarRotas()) {
  const [o, c] = [await colher(ORIGINAL, rota), await colher(CLONE, rota)];
  const regras = [];
  let semPar = 0;
  for (const [chave, vc] of Object.entries(c)) {
    const vo = o[chave];
    if (!vo) { semPar++; continue; }
    if (!vc.cid) continue;
    if (!isFinite(vo.lh) || !isFinite(vc.lh)) continue;
    if (Math.abs(vo.lh - vc.lh) <= TOL) continue;
    // ratio sem unidade quando o font-size bate (sobrevive a mudança de tamanho)
    const mesmoFs = Math.abs(vo.fs - vc.fs) < 0.05;
    const valor = mesmoFs ? String(Math.round((vo.lh / vo.fs) * 10000) / 10000) : `${vo.lh}px`;
    regras.push({ cid: vc.cid, valor, de: vc.lh, para: vo.lh });
  }
  if (!regras.length) { console.log(`   ${rota}: line-height ok (${semPar} sem par)`); continue; }
  if (regras.length > MAX_REGRAS) { console.log(`⚠️ ${rota}: ${regras.length} > teto — nada escrito`); continue; }
  const arq = join(APP, "src", "app", ...rota.split("/").filter(Boolean), "tipografia.css");
  const MARC = "/* == corrige-line-height == */";
  let css = existsSync(arq) ? readFileSync(arq, "utf8") : "";
  if (css.includes(MARC)) {
    const i = css.indexOf(MARC), f = css.indexOf("/* == /corrige-line-height == */");
    css = css.slice(0, i) + css.slice(f + "/* == /corrige-line-height == */".length);
    writeFileSync(arq, css);
  }
  const bloco = `\n${MARC}\n/* line-height que a captura arredondou (font-size já batia).\n` +
    `   0.2px aqui estouram um flex-wrap lá e jogam um bloco inteiro de coluna. */\n` +
    `@media ${FAIXA} {\n` +
    regras.map((r) => `  [data-cid="${r.cid}"]{line-height:${r.valor}}  /* ${r.de} -> ${r.para} */`).join("\n") +
    `\n}\n/* == /corrige-line-height == */\n`;
  if (ESCREVER) { appendFileSync(arq, bloco); console.log(`✅ ${rota}: ${regras.length} regra(s) -> ${arq}`); }
  else console.log(`(simulação) ${rota}: ${regras.length} regra(s)`);
  total += regras.length;
}
console.log(`\nTOTAL: ${total} regra(s)`);
await nav.close();
