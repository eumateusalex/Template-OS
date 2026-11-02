// sonda-coluna-quebrada.mjs — alguma coluna flex com quebra QUEBROU no clone e jogou um filho para o lado?
//
// 🚨 Por que existe: a captura congela a altura das caixas. Numa coluna com quebra (flex-direction:
// column + flex-wrap), se o conteúdo passa da altura congelada por uma fração de px, o último filho vai
// para uma segunda coluna, ao lado. Caixa de 42,00px com conteúdo de 42,08 basta para o nome ir parar
// 77px à direita do rótulo. Régua de texto e de borda passavam; só a geometria via, e
// misturado com dezenas de outros desvios.
//
// O que faz, por rota e largura: lista as colunas com quebra que têm algum filho fora do eixo do primeiro
// (left diferente em mais de 1px), nos dois lados, e acusa as que quebraram SÓ no clone (casadas pelo
// texto da coluna). Coluna que quebra no original também é design, e fica de fora.
// Sai com código 1 se achar alguma.
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 ROTAS=<rotas.json | /a,/b> \
//   [LARGURAS="1280 800 375"] node sonda-coluna-quebrada.mjs
// Variáveis: ROTA=/x no lugar de ROTAS; DITTO onde está o Playwright; ESPERA ms depois do load (padrão 1500).
// Conserto típico: tirar a altura congelada da coluna (deixar a do conteúdo, como no original).
import { createRequire } from "node:module";
import { existsSync, readFileSync, statSync } from "node:fs";

const DITTO = process.env.DITTO ?? (process.env.USERPROFILE ?? process.env.HOME) + "/dev/ditto";
const require = createRequire(DITTO.replace(/\/?$/, "/"));
{
  const pastaDitto = (process.env.DITTO ?? (process.env.USERPROFILE ?? process.env.HOME) + "/dev/ditto").replace(/\/?$/, "/");
  if (!(await import("node:fs")).existsSync(`${pastaDitto}node_modules/playwright/package.json`)) {
    console.error(`o Playwright do ditto não está em ${pastaDitto}: aponte DITTO=<pasta do ditto>`);
    process.exit(1);
  }
}
const { chromium } = require("playwright");
const { ORIGINAL, CLONE } = process.env;
if (!ORIGINAL || !CLONE) { console.error("ORIGINAL e CLONE são obrigatórias"); process.exit(2); }
const LARGURAS = (process.env.LARGURAS ?? process.env.LARGURA ?? "1280 800 375").split(/[ ,]+/).map(Number).filter(Boolean);
const ESPERA = Number(process.env.ESPERA ?? 1500);

function carregarRotas() {
  const r = process.env.ROTAS;
  if (r) {
    if (existsSync(r) && statSync(r).isFile()) return JSON.parse(readFileSync(r, "utf8").replace(/^\uFEFF/, "")).rotas.filter((x) => x.status === 200 || x.status === null || x.status === undefined).map((x) => x.rota);
    return r.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [process.env.ROTA ?? "/"];
}

// roda no navegador: as colunas com quebra que quebraram, com o texto delas e a altura
function colherNaPagina() {
  const out = [];
  for (const e of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(e);
    if (!cs.display.includes("flex") || !cs.flexDirection.startsWith("column") || cs.flexWrap === "nowrap") continue;
    const filhos = [...e.children].filter((c) => getComputedStyle(c).position !== "absolute" && getComputedStyle(c).position !== "fixed" && c.getBoundingClientRect().width > 0);
    if (filhos.length < 2) continue;
    const x0 = filhos[0].getBoundingClientRect().left;
    const fora = filhos.filter((c) => Math.abs(c.getBoundingClientRect().left - x0) > 1);
    if (fora.length) out.push({ texto: e.textContent.replace(/\s+/g, " ").trim().slice(0, 60), id: e.getAttribute("data-cid") || e.getAttribute("data-framer-name") || e.tagName.toLowerCase(), altura: +e.getBoundingClientRect().height.toFixed(2), deslocamento: Math.round(fora[0].getBoundingClientRect().left - x0) });
  }
  return out;
}

const browser = await chromium.launch();
async function colher(base, rota, L) {
  const ctx = await browser.newContext({ viewport: { width: L, height: 900 } });
  try {
    const page = await ctx.newPage();
    await page.goto(base.replace(/\/$/, "") + rota, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(ESPERA);
    return await page.evaluate(colherNaPagina);
  } finally { await ctx.close(); }
}

let achados = 0, naoMedidas = 0, rodadas = 0;
for (const L of LARGURAS) {
  for (const rota of carregarRotas()) {
    let o, c;
    try { o = await colher(ORIGINAL, rota, L); c = await colher(CLONE, rota, L); rodadas++; }
    catch (err) { naoMedidas++; console.log(`✖  ${L} ${rota}: não medi (${String(err.message).split("\n")[0]})`); continue; }
    const so = c.filter((k) => !o.some((x) => x.texto === k.texto));
    achados += so.length;
    for (const k of so) console.log(`🚨 ${L} ${rota}: ${k.id} "${k.texto}" · altura ${k.altura}px · filho deslocado ${k.deslocamento}px para o lado`);
  }
}
await browser.close();
console.log(`\nTOTAL: ${achados} coluna(s) quebrada(s) só no clone em ${rodadas} rota×largura medidas · ${naoMedidas} medição(ões) que falharam`);
process.exitCode = achados || naoMedidas ? 1 : 0;
