// sonda-ida-volta.mjs — descendo e SUBINDO a página, cada elemento fica como no original em cada ponto da rolagem?
//
// 🚨 Por que existe: a transição de rolagem vale na ida e na volta. As outras réguas de movimento provam a DESCIDA (a
// entrada toca) e o estado parado; o que acontece quando se sobe de volta (o efeito desfaz, fica, ou para no meio) só
// esta compara.
//
// Por rota e largura, nos dois lados e no mesmo roteiro: rola do topo ao fim e do fim ao topo em passos de 100px a cada
// 40ms (rolagem contínua), parando a cada PARADA px; em cada parada espera ASSENTA ms e colhe cada texto-folha e imagem
// visível na janela: opacidade efetiva, topo na janela e escala. Casa texto pelo igual mais próximo na página, imagem
// pela caixa. Acusa, por parada e por sentido (desce/sobe), o que difere: opacidade > 0,3 ou topo > TOL px.
// Uso: ORIGINAL=<url> CLONE=<url> ROTAS=<rotas.json | /a,/b> [LARGURAS="1280 375"] [PARADA=600] [ASSENTA=1300]
//      [TOL=12] [DITTO=…] node sonda-ida-volta.mjs
import { createRequire } from "node:module";
import { existsSync, readFileSync, statSync } from "node:fs";
const require = createRequire((process.env.DITTO ?? (process.env.USERPROFILE ?? process.env.HOME) + "/dev/ditto").replace(/\/?$/, "/"));
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
const LARGURAS = (process.env.LARGURAS ?? "1280 375").split(/[ ,]+/).map(Number).filter(Boolean);
const PARADA = Number(process.env.PARADA ?? 600), ASSENTA = Number(process.env.ASSENTA ?? 1300), TOL = Number(process.env.TOL ?? 12);
const rotas = (() => { const r = process.env.ROTAS ?? "/"; if (existsSync(r) && statSync(r).isFile()) return JSON.parse(readFileSync(r, "utf8").replace(/^\uFEFF/, "")).rotas.map((x) => x.rota); return r.split(","); })();

const COLHE = () => {
  const op = (e) => { let o = 1; for (let x = e; x && x.nodeType === 1; x = x.parentElement) { const cs = getComputedStyle(x); if (cs.display !== "contents") o *= +cs.opacity; if (cs.visibility === "hidden") return 0; } return o; };
  const out = [];
  for (const e of document.querySelectorAll("body *")) {
    if (e.closest('[id^="__framer-badge"]')) continue;
    const r = e.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > innerHeight || r.left >= innerWidth || r.right <= 0) continue;
    let k = null;
    if (e.tagName === "IMG") k = "img";
    else if ([...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && !e.querySelector("span, p, h1, h2, h3")) k = e.textContent.replace(/\s+/g, " ").trim().slice(0, 30);
    if (!k) continue;
    const fixo = (() => { for (let x = e; x; x = x.parentElement) if (getComputedStyle(x).position === "fixed") return true; return false; })();
    out.push({ k, o: +op(e).toFixed(2), t: Math.round(r.top), x: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height), yp: Math.round(r.top + (fixo ? 0 : scrollY)), fixo });
  }
  return out;
};
const b = await chromium.launch();
async function roteiro(base, rota, L) {
  const ctx = await b.newContext({ viewport: { width: L, height: 900 } }); const p = await ctx.newPage();
  await p.goto(base.replace(/\/$/, "") + rota, { waitUntil: "load" }); await p.mouse.move(1, 1); await p.waitForTimeout(2500);
  const fim = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const paradas = []; for (let y = 0; y <= fim; y += PARADA) paradas.push(y); if (paradas.at(-1) !== fim) paradas.push(fim);
  const fotos = []; let atual = 0;
  const vai = async (alvo) => { await p.evaluate(async ([de, ate]) => { const passo = ate > de ? 100 : -100; for (let y = de; passo > 0 ? y < ate : y > ate; y += passo) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } scrollTo(0, ate); }, [atual, alvo]); atual = alvo; await p.waitForTimeout(ASSENTA); };
  for (const y of paradas.slice(1)) { await vai(y); fotos.push({ sentido: "desce", y, el: await p.evaluate(COLHE) }); }
  for (const y of paradas.slice(0, -1).reverse()) { await vai(y); fotos.push({ sentido: "sobe", y, el: await p.evaluate(COLHE) }); }
  await ctx.close(); return fotos;
}
let total = 0;
for (const L of LARGURAS) for (const rota of rotas) {
  let o, c;
  try { o = await roteiro(ORIGINAL, rota, L); c = await roteiro(CLONE, rota, L); } catch (e) { console.log(`✖ ${L} ${rota}: ${String(e.message).split("\n")[0]}`); total++; continue; }
  const linhas = [];
  for (let i = 0; i < Math.min(o.length, c.length); i++) {
    const fo = o[i], fc = c[i];
    for (const x of fo.el) {
      const cands = fc.el.filter((y) => y.k === x.k && y.fixo === x.fixo && (x.k !== "img" || (Math.abs(y.w - x.w) <= 4 && Math.abs(y.h - x.h) <= 4)));
      const y = cands.sort((a, b2) => Math.abs(a.yp - x.yp) + Math.abs(a.x - x.x) - Math.abs(b2.yp - x.yp) - Math.abs(b2.x - x.x))[0];
      if (!y || Math.abs(y.yp - x.yp) > 200) continue; // sem par perto: outra régua (geometria, conteúdo) responde
      const dO = Math.abs(y.o - x.o), dT = Math.abs(y.t - x.t);
      if (dO > 0.3 || (x.o > 0.3 && dT > TOL)) linhas.push(`${fo.sentido.padEnd(5)} y=${String(fo.y).padStart(5)}  «${x.k}» original op ${x.o} topo ${x.t} · clone op ${y.o} topo ${y.t}`);
    }
  }
  total += linhas.length;
  const nDesce = linhas.filter((l) => l.startsWith("desce")).length, nSobe = linhas.length - nDesce;
  console.log(`${linhas.length ? "🚨" : "  "} ${String(L).padStart(4)} ${rota.slice(0, 50).padEnd(51)} paradas ${o.length} · diferem: descendo ${nDesce} · subindo ${nSobe}`);
  for (const l of linhas.slice(0, Number(process.env.MOSTRA ?? 8))) console.log(`        ${l}`);
}
await b.close();
console.log(`\nTOTAL: ${total} diferença(s)`);
process.exitCode = total ? 1 : 0;
