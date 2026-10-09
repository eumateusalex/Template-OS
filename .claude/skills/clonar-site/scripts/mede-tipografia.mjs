// mede-tipografia.mjs — o ditto ARREDONDA todo tamanho de fonte fracionário.
//
// 🚨 Classe de defeito medida no clone do site-landing, e que NÃO
// aparece no site-exemplo: um site com escala de tipo
// fluida (`clamp()`, `vw`) computa `font-size` fracionário — 15.5px, 17.5px,
// 20.48px. Ao converter para Tailwind, o ditto arredonda para o inteiro
// acima: 16px, 18px, 21px. O `line-height` vai junto (25.575 -> 26).
//
// O estrago não aparece onde se mexeu. Meio pixel a mais de fonte muda o
// ponto de quebra da linha: um parágrafo de 4 linhas vira 5, ganha 33px de
// altura, e EMPURRA os 14 elementos abaixo dele. A medição de geometria acusa
// 14 elementos fora do lugar e nenhum deles é o culpado.
//
// Este instrumento mede `font-size` e `line-height` dos DOIS lados, em VÁRIAS
// larguras, e responde duas perguntas:
//
//   1. quantos elementos divergem, e por quanto
//   2. o valor do ORIGINAL é constante entre as larguras grandes?
//      Se for, a escala fluida TRAVA num teto e um valor fixo dentro de
//      `@media (min-width: ...)` é exato, não chute. Se não for, escrever
//      valor fixo é inventar número, e o instrumento diz isso em vez de
//      escrever.
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 ROTAS=<rotas.json> \
//   LARGURAS=1280,1440,1920,375 SAIDA=<med>/tipografia node mede-tipografia.mjs
//
// Variáveis:
//   ORIGINAL  URL base do original (obrigatória)
//   CLONE     URL base do clone servido (obrigatória)
//   ROTA      rota única (padrão /), OU ROTAS=arquivo rotas.json
//   LARGURAS  larguras a medir (padrão 1280,1440,1920,375)
//   TOL       px de tolerância para considerar igual (padrão 0.05)
//   SAIDA     pasta de saída (padrão ./tipografia)
//   DITTO     raiz do ditto (padrão C:/dev/ditto)

import { createRequire } from "node:module";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const ORIGINAL = process.env.ORIGINAL;
const CLONE = process.env.CLONE;
if (!ORIGINAL || !CLONE) {
  console.error("faltam ORIGINAL e/ou CLONE");
  process.exit(1);
}
const LARGURAS = (process.env.LARGURAS ?? "1280,1440,1920,375")
  .split(",")
  .map((s) => Number(s.trim()))
  .filter(Boolean);
const TOL = Number(process.env.TOL ?? 0.05);
// Larguras >= TRAVA_MIN formam o grupo em que se testa se a escala TRAVA.
// Padrão 1280 (o teto do desktop). Para testar o piso do mobile, rodar com
// LARGURAS=320,375,430 e TRAVA_MIN=320.
const TRAVA_MIN = Number(process.env.TRAVA_MIN ?? 1280);
const SAIDA = resolve(process.env.SAIDA ?? "./tipografia");
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

// Mesma disciplina do compara-geometria: só elemento com texto PRÓPRIO, e a
// identidade é o texto normalizado, nunca o índice.
const COLHER = () => {
  const norm = (s) => s.replace(/\s+/g, " ").trim();
  const saida = [];
  let i = 0;
  for (const el of document.querySelectorAll("body *")) {
    i++;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    let proprio = "";
    for (const n of el.childNodes) if (n.nodeType === 3) proprio += n.nodeValue;
    proprio = norm(proprio);
    if (!proprio) continue;
    saida.push({
      ordem: i,
      tag: el.tagName.toLowerCase(),
      cid: el.getAttribute("data-cid") || null,
      texto: proprio.slice(0, 60),
      y: Math.round((r.top + window.scrollY) * 10) / 10,
      fs: parseFloat(cs.fontSize),
      lh: cs.lineHeight === "normal" ? null : parseFloat(cs.lineHeight),
      ls: cs.letterSpacing === "normal" ? null : parseFloat(cs.letterSpacing),
    });
  }
  return saida;
};

async function colher(page, url, largura) {
  await page.setViewportSize({ width: largura, height: 900 });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1500);
  return page.evaluate(COLHER);
}

/** Casa por texto, com desempate pela posição vertical mais próxima. */
function alinhar(a, b) {
  const porTexto = new Map();
  for (const it of b) {
    const k = `${it.tag}|${it.texto}`;
    if (!porTexto.has(k)) porTexto.set(k, []);
    porTexto.get(k).push(it);
  }
  const pares = [];
  for (const ia of a) {
    const cand = porTexto.get(`${ia.tag}|${ia.texto}`);
    if (!cand || !cand.length) continue;
    let melhor = null;
    let melhorD = Infinity;
    for (const ib of cand) {
      if (ib.__usado) continue;
      const d = Math.abs(ia.y - ib.y);
      if (d < melhorD) { melhorD = d; melhor = ib; }
    }
    if (!melhor) continue;
    melhor.__usado = true;
    pares.push([ia, melhor]);
  }
  return pares;
}

mkdirSync(SAIDA, { recursive: true });

const navegador = await chromium.launch();
const relatorio = [];

for (const rota of rotas()) {
  const uo = new URL(rota, ORIGINAL).href;
  const uc = new URL(rota, CLONE).href;
  const porLargura = {};

  for (const L of LARGURAS) {
    const ctxO = await navegador.newContext({ viewport: { width: L, height: 900 } });
    const ctxC = await navegador.newContext({ viewport: { width: L, height: 900 } });
    const pO = await ctxO.newPage();
    const pC = await ctxC.newPage();
    const [io, ic] = await Promise.all([colher(pO, uo, L), colher(pC, uc, L)]);
    await ctxO.close();
    await ctxC.close();

    const pares = alinhar(io, ic);
    const divergem = [];
    for (const [o, c] of pares) {
      const dFs = Math.round((c.fs - o.fs) * 1000) / 1000;
      const dLh = o.lh != null && c.lh != null ? Math.round((c.lh - o.lh) * 1000) / 1000 : null;
      if (Math.abs(dFs) > TOL || (dLh != null && Math.abs(dLh) > TOL)) {
        divergem.push({
          cid: c.cid, tag: c.tag, texto: c.texto,
          fsOriginal: o.fs, fsClone: c.fs, dFs,
          lhOriginal: o.lh, lhClone: c.lh, dLh,
        });
      }
    }
    porLargura[L] = { pares: pares.length, divergem };
    console.log(`  ${String(L).padStart(5)}px  ${rota}  pares=${pares.length}  divergem=${divergem.length}`);
  }

  // 🚨 O CONTROLE QUE DECIDE O FORMATO DA CORREÇÃO.
  //
  // Para cada elemento, o font-size do ORIGINAL é o mesmo nas larguras
  // grandes? Se sim, a escala fluida trava num teto e valor fixo dentro de
  // `@media (min-width: <a menor das grandes>)` é EXATO. Se não, escrever
  // valor fixo seria inventar número, e é melhor declarar.
  const grandes = LARGURAS.filter((L) => L >= TRAVA_MIN).sort((a, b) => a - b);
  let travadas = 0;
  let fluidas = 0;
  const amostraFluida = [];
  if (grandes.length >= 2) {
    const base = new Map();
    for (const d of porLargura[grandes[0]].divergem) base.set(d.cid ?? d.texto, d.fsOriginal);
    for (const [chave, fs0] of base) {
      let igual = true;
      for (const L of grandes.slice(1)) {
        const d = porLargura[L].divergem.find((x) => (x.cid ?? x.texto) === chave);
        // não divergir numa largura maior também conta: aí o original mudou
        // e passou a bater com o clone, o que é sinal de fluido, não de travado.
        if (!d || Math.abs(d.fsOriginal - fs0) > TOL) { igual = false; break; }
      }
      if (igual) travadas++;
      else { fluidas++; if (amostraFluida.length < 5) amostraFluida.push(chave); }
    }
  }

  relatorio.push({ rota, porLargura, grandes, travadas, fluidas, amostraFluida });
}

await navegador.close();

writeFileSync(join(SAIDA, "tipografia.json"), JSON.stringify({ larguras: LARGURAS, tol: TOL, relatorio }, null, 2));

console.log("\n" + "=".repeat(70));
let totalDiv = 0;
let totalTrav = 0;
let totalFluid = 0;
for (const r of relatorio) {
  const L0 = r.grandes[0] ?? LARGURAS[0];
  const d = r.porLargura[L0].divergem.length;
  totalDiv += d;
  totalTrav += r.travadas;
  totalFluid += r.fluidas;
  console.log(`${r.rota}  divergem@${L0}px=${d}  escala travada=${r.travadas}  ainda fluida=${r.fluidas}`);
  if (r.amostraFluida.length) console.log(`   ainda fluida (amostra): ${r.amostraFluida.join(", ")}`);
}
console.log("=".repeat(70));
console.log(`TOTAL: ${totalDiv} elemento(s) com tipografia divergente`);
console.log(`  escala TRAVADA no topo (valor fixo é exato):  ${totalTrav}`);
console.log(`  ainda FLUIDA (valor fixo seria chute):        ${totalFluid}`);
console.log(`saída: ${SAIDA}`);
