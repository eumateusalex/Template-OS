// sonda-escala-congelada.mjs — algum texto do clone está espremido ou esticado por uma escala congelada?
//
// 🚨 Por que existe: o Framer anima tamanho por PROJEÇÃO DE LAYOUT — muda a caixa de uma vez e corrige
// com scaleX/scaleY no pai e o inverso nos filhos, que se anulam (0,846 × 1,073 × 1,102 = 1,000). A
// captura congela essas escalas em classes, às vezes sem o inverso. A frase do rodapé pode sair
// espremida ou esticada em quase todas as rotas (0,80 a 1,16) sem que NENHUMA régua acuse: o texto é o mesmo,
// a borda é a mesma, e a geometria casa o texto pela caixa já distorcida.
//
// O que faz, por rota: para todo elemento com texto próprio, multiplica a escala horizontal e a vertical
// de todos os ancestrais (escala tirada da matriz sem a rotação: √(a²+b²) e √(c²+d²), então cartão
// inclinado não conta) e compara com o mesmo texto no original. Acusa quando a diferença passa de TOL.
// Laço em andamento no original (uma troca no meio) também gera escala; por isso a comparação é entre os
// lados e o resultado diz os dois números.
// Sai com código 1 se achar alguma.
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 ROTAS=<rotas.json | /a,/b> \
//   [LARGURAS="1280 800 375"] [TOL=0.02] node sonda-escala-congelada.mjs
// Variáveis: ROTA=/x no lugar de ROTAS; DITTO onde está o Playwright; ESPERA ms depois do load (padrão 2500).
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
const TOL = Number(process.env.TOL ?? 0.02), ESPERA = Number(process.env.ESPERA ?? 2500);

function carregarRotas() {
  const r = process.env.ROTAS;
  if (r) {
    if (existsSync(r) && statSync(r).isFile()) return JSON.parse(readFileSync(r, "utf8").replace(/^\uFEFF/, "")).rotas.filter((x) => x.status === 200 || x.status === null || x.status === undefined).map((x) => x.rota);
    return r.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [process.env.ROTA ?? "/"];
}

// roda no navegador: [texto, escalaX, escalaY] de todo elemento com texto próprio visível
function colherNaPagina() {
  const out = [];
  for (const e of document.querySelectorAll("body *")) {
    const proprio = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").replace(/\s+/g, " ").trim();
    if (proprio.length < 2) continue;
    const r = e.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    let sx = 1, sy = 1;
    for (let n = e; n && n !== document.documentElement; n = n.parentElement) {
      const t = getComputedStyle(n).transform;
      if (!t || t === "none") continue;
      const m = new DOMMatrix(t);
      sx *= Math.hypot(m.a, m.b); sy *= Math.hypot(m.c, m.d);
    }
    out.push([proprio.slice(0, 60), sx, sy]);
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

let achados = 0, naoMedidas = 0;
for (const L of LARGURAS) {
  for (const rota of carregarRotas()) {
    let o, c;
    try { o = await colher(ORIGINAL, rota, L); c = await colher(CLONE, rota, L); }
    catch (err) { naoMedidas++; console.log(`✖  ${L} ${rota}: não medi (${String(err.message).split("\n")[0]})`); continue; }
    // casa pelo texto, na ordem: a n-ésima ocorrência de um texto com a n-ésima do outro lado
    const fila = new Map(); for (const x of o) { if (!fila.has(x[0])) fila.set(x[0], []); fila.get(x[0]).push(x); }
    const ruins = []; let casados = 0;
    for (const k of c) {
      const q = fila.get(k[0]); if (!q || !q.length) continue;
      const x = q.shift(); casados++;
      const dx = Math.abs(k[1] - x[1]), dy = Math.abs(k[2] - x[2]);
      if (dx > TOL || dy > TOL) ruins.push(`"${k[0].slice(0, 30)}" clone ${k[1].toFixed(3)}×${k[2].toFixed(3)} · original ${x[1].toFixed(3)}×${x[2].toFixed(3)}`);
    }
    achados += ruins.length;
    console.log(`${ruins.length ? "🚨" : "  "} ${String(L).padStart(4)} ${rota.slice(0, 46).padEnd(47)} textos casados: ${String(casados).padStart(4)} de ${c.length} no clone · com escala diferente: ${ruins.length}`);
    for (const r of ruins.slice(0, 6)) console.log(`        ${r}`);
  }
}
await browser.close();
console.log(`\nTOTAL: ${achados} texto(s) com escala diferente do original (tolerância ${TOL}) · ${naoMedidas} medição(ões) que falharam`);
process.exitCode = achados || naoMedidas ? 1 : 0;
