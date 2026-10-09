// corrige-largura-secao.mjs — devolve a LARGURA das seções que a captura
// encolheu, e prova o conserto no navegador ANTES de escrever.
//
// 🚨 Classe de defeito medida no framer-4: o ditto
// gera o `<main>` com `flex flex-col items-center`. Em flex-column,
// `align-items: center` faz o filho ENCOLHER para o conteúdo em vez de
// esticar. A seção que no original tem 1280px nasce no clone com 1037px, e
// nenhuma classe de largura aparece no JSX para denunciar — a largura sumiu,
// não foi escrita errada.
//
// O estrago não aparece na seção: aparece no texto DENTRO dela. Um parágrafo
// com `max-width: 80%` herda 80% de um pai menor, quebra em 9 linhas onde o
// original quebra em 6, e CADA letra do bloco vira "fora do lugar". Medido em
// /expertise: 486 elementos fora do lugar, todos letras, com dy múltiplo de
// 52px (a altura de linha) — e nenhum deles é o culpado.
//
// O método:
//   1. lê a largura de cada <section> no ORIGINAL e no CLONE, casando por
//      ÍNDICE e conferindo o começo do texto (índice sozinho mente quando um
//      lado tem uma seção a mais);
//   2. para cada seção estreita, aplica `width:100%` NO NAVEGADOR e mede de
//      novo — só entra no arquivo o que provadamente devolve a largura do
//      original (regra: "só se escreve o que EXPLICA o número medido");
//   3. escreve em `estrutura.css` da rota, dentro da @media medida.
//
// O que o faz SE CALAR:
//   - contagem de seções diferente entre os lados  -> declara e não escreve
//   - texto da seção não bate no casamento         -> declara ESSA e segue
//   - seção sem data-cid                           -> declara ESSA e segue
//   - `width:100%` não devolve a largura do original -> declara ESSA e segue
//   - nenhuma seção estreita                       -> declara e não escreve
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8093 APP=<app> \
//   ROTA=/expertise node corrige-largura-secao.mjs
//
// Variáveis:
//   ROTAS     arquivo rotas.json (roda em todas) — alternativa a ROTA
//   LARGURA   viewport medido (padrão 1280); a regra nasce dentro da @media
//             correspondente (>=1024 para 1280)
//   TOL       diferença de largura que conta como estreita (padrão 2px)
//   ESCREVER  0 simula, não toca em arquivo

import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

const ORIGINAL = process.env.ORIGINAL;
const CLONE = process.env.CLONE;
const APP = process.env.APP;
if (!ORIGINAL || !CLONE || !APP) {
  console.error("faltam ORIGINAL, CLONE e/ou APP");
  process.exit(1);
}
const LARGURA = Number(process.env.LARGURA ?? 1280);
const TOL = Number(process.env.TOL ?? 2);
const ESCREVER = process.env.ESCREVER !== "0";
const DITTO = process.env.DITTO ?? "C:/dev/ditto";

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

function rotasAlvo() {
  if (process.env.ROTAS) {
    const j = JSON.parse(readFileSync(process.env.ROTAS, "utf8"));
    const lista = Array.isArray(j) ? j : (j.rotas ?? []);
    return lista
      .map((r) => (typeof r === "string" ? r : (r.rota ?? r.caminho)))
      .filter((r) => r && (typeof r === "string"))
      .filter((r) => r !== "/404");
  }
  return [process.env.ROTA ?? "/"];
}

// A faixa em que a regra nasce: a mesma em que foi medida.
const faixa = LARGURA >= 1024 ? "(min-width: 1024px)" : LARGURA >= 768 ? "(min-width: 768px) and (max-width: 1023px)" : "(max-width: 767px)";

const pastaDaRota = (rota) => join(APP, "src", "app", rota === "/" ? "" : rota.replace(/^\//, ""));

const percorrer = async (p) => {
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 250));
  });
};

const colher = () =>
  [...document.querySelectorAll("section")].map((s, i) => ({
    i,
    cid: s.getAttribute("data-cid"),
    w: Math.round(s.getBoundingClientRect().width * 10) / 10,
    txt: (s.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40),
  }));

const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: LARGURA, height: 900 } });
const page = await ctx.newPage();

let totalEscritas = 0;
const declaradas = [];

for (const rota of rotasAlvo()) {
  await page.goto(new URL(rota, ORIGINAL).href, { waitUntil: "networkidle", timeout: 60000 });
  await percorrer(page);
  const orig = await page.evaluate(colher);

  await page.goto(new URL(rota, CLONE).href + "?_v=" + Date.now(), { waitUntil: "networkidle", timeout: 60000 });
  await percorrer(page);
  const clone = await page.evaluate(colher);

  if (orig.length !== clone.length) {
    console.log(`⚠️ ${rota}: ${orig.length} seções no original × ${clone.length} no clone — não casa por índice, DECLARADO`);
    declaradas.push({ rota, motivo: `contagem de seções ${orig.length}≠${clone.length}` });
    continue;
  }

  const estreitas = [];
  for (const o of orig) {
    const c = clone[o.i];
    if (!c) continue;
    // índice sozinho mente: confirmar pelo começo do texto
    const a = o.txt.slice(0, 18);
    const b = c.txt.slice(0, 18);
    if (a && b && a !== b) {
      declaradas.push({ rota, motivo: `seção ${o.i}: texto não bate (${JSON.stringify(a)} × ${JSON.stringify(b)})` });
      continue;
    }
    if (o.w - c.w > TOL) {
      if (!c.cid) {
        declaradas.push({ rota, motivo: `seção ${o.i} sem data-cid, não há como escrever regra` });
        continue;
      }
      estreitas.push({ cid: c.cid, i: o.i, wOrig: o.w, wClone: c.w, txt: o.txt });
    }
  }

  if (!estreitas.length) {
    console.log(`✅ ${rota}: nenhuma seção estreita`);
    continue;
  }

  // PROVA no navegador antes de escrever
  const prova = await page.evaluate((cids) => {
    const st = document.createElement("style");
    st.textContent = cids.map((c) => `[data-cid="${c}"]{width:100%}`).join("\n");
    document.head.appendChild(st);
    void document.body.offsetHeight;
    const out = {};
    for (const c of cids) {
      const el = document.querySelector(`[data-cid="${c}"]`);
      out[c] = el ? Math.round(el.getBoundingClientRect().width * 10) / 10 : null;
    }
    return out;
  }, estreitas.map((e) => e.cid));

  const aprovadas = [];
  for (const e of estreitas) {
    const depois = prova[e.cid];
    if (depois !== null && Math.abs(depois - e.wOrig) <= TOL) {
      aprovadas.push({ ...e, wDepois: depois });
    } else {
      declaradas.push({
        rota,
        motivo: `seção ${e.i} (${e.cid}): width:100% deu ${depois}, original tem ${e.wOrig} — NÃO escrito`,
      });
    }
  }

  console.log(`\n=== ${rota}`);
  for (const a of aprovadas) {
    console.log(`   ✅ ${a.cid}  ${a.wClone} → ${a.wDepois}  (original ${a.wOrig})  ${JSON.stringify(a.txt.slice(0, 30))}`);
  }
  if (!aprovadas.length) {
    console.log("   nada aprovado na prova — nada escrito");
    continue;
  }

  if (!ESCREVER) {
    console.log(`   (ESCREVER=0, simulação)`);
    totalEscritas += aprovadas.length;
    continue;
  }

  const pasta = pastaDaRota(rota);
  if (!existsSync(pasta)) mkdirSync(pasta, { recursive: true });
  const arquivo = join(pasta, "estrutura.css");
  const linhas = [
    "/* estrutura.css — largura de seção que a captura perdeu, devolvida por",
    "   scripts/corrige-largura-secao.mjs. Cada regra foi PROVADA no navegador:",
    "   width:100% devolve exatamente a largura medida no original.",
    `   Origem: ${new URL(rota, ORIGINAL).href} @${LARGURA}px · faixa: ${faixa} */`,
    "",
    `@media ${faixa} {`,
    ...aprovadas.map(
      (a) => `[data-cid="${a.cid}"]{width:100%}  /* ${a.wClone}px → ${a.wOrig}px · ${JSON.stringify(a.txt.slice(0, 34))} */`,
    ),
    "}",
    "",
  ];
  writeFileSync(arquivo, linhas.join("\n"), "utf8");
  console.log(`   -> ${arquivo}`);
  totalEscritas += aprovadas.length;
}

await navegador.close();

console.log(`\n${"=".repeat(70)}`);
console.log(`TOTAL: ${totalEscritas} seção(ões) com largura devolvida`);
if (declaradas.length) {
  console.log(`\n⚠️ ${declaradas.length} declaração(ões) — nunca silenciadas:`);
  for (const d of declaradas) console.log(`   ${d.rota}: ${d.motivo}`);
}
console.log("🚨 liga-css.mjs com FOLHAS=...,estrutura.css e rebuildar — escrever não liga.");
process.exit(0);
