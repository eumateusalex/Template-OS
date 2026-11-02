// sonda-partida.mjs — todo elemento que o original desenha ESCONDIDO antes da entrada (o estado de partida dos efeitos)
// também começa escondido no clone? E o contrário?
//
// 🚨 Por que existe: um título que entra palavra por palavra no original pode ficar parado no clone. A régua dos efeitos (gera-efeitos) só prova o que ela mesma acha; o que
// ela não acha passa calado. Esta mede pelo DESENHO, sem saber de efeito nenhum.
//
// Por rota e largura: no ORIGINAL sem JavaScript (o HTML do servidor traz o estado de partida inline) e no CLONE sem
// JavaScript mas com html.ditto-js ligado (o efeitos.css desenha o estado de partida), colhe cada texto-folha e cada
// imagem visível com a opacidade efetiva. Chave: o texto (ou o nome da imagem) e a ordem entre os iguais. Compara quem
// começa escondido (opacidade < 0,5) de um lado e não do outro.
// Uso: ORIGINAL=<url> CLONE=<url> ROTAS=<rotas.json | /a,/b> [LARGURAS="1280 375"] node sonda-partida.mjs
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
const LARGURAS = (process.env.LARGURAS ?? "1280 375").split(/[ ,]+/).map(Number).filter(Boolean);
const rotas = (() => { const r = process.env.ROTAS ?? "/"; if (existsSync(r) && statSync(r).isFile()) return JSON.parse(readFileSync(r, "utf8").replace(/^\uFEFF/, "")).rotas.map((x) => x.rota); return r.split(","); })();
const COLHE = (clone) => {
  if (clone) document.documentElement.classList.add("ditto-js");
  const op = (e) => { let o = 1; for (let x = e; x && x.nodeType === 1; x = x.parentElement) { const cs = getComputedStyle(x); if (cs.display !== "contents") o *= +cs.opacity; if (cs.visibility === "hidden") return 0; } return o; };
  const fora = (e) => e.closest('[id^="__framer-badge"], nav, [data-framer-name="Nav Bar"], [data-ditto-estado-nav]');
  const vistos = {}, out = [];
  for (const e of document.querySelectorAll("body *")) {
    if (fora(e) || !e.getClientRects().length) continue;
    const r = e.getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue;
    // painel fora da janela (gaveta de contato do clone, à direita): não se vê, não se compara
    if (r.left >= innerWidth || r.right <= 0) continue;
    let k = null;
    if (e.tagName === "IMG") k = "img:" + (e.getAttribute("src") || "").split("/").pop().split("?")[0].replace(/\.[a-z]+$/, "").slice(0, 14);
    else if ([...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && !e.querySelector("span, p, h1, h2, h3")) k = e.textContent.replace(/\s+/g, " ").trim().slice(0, 30);
    if (!k) continue;
    vistos[k] = (vistos[k] || 0) + 1;
    out.push({ k: `${k}#${vistos[k]}`, o: +op(e).toFixed(2), y: Math.round(r.top + scrollY), x: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) });
  }
  return out;
};
const b = await chromium.launch();
let total = 0;
for (const L of LARGURAS) for (const rota of rotas) {
  const lado = async (base, clone) => { const ctx = await b.newContext({ viewport: { width: L, height: 900 }, javaScriptEnabled: false }); const p = await ctx.newPage(); await p.goto(base.replace(/\/$/, "") + rota, { waitUntil: "load" }); await p.waitForTimeout(400); const r = await p.evaluate(COLHE, clone); await ctx.close(); return r; };
  const o = await lado(ORIGINAL, false), c = await lado(CLONE, true);
  const mc = new Map(c.map((x) => [x.k, x]));
  // imagem: o nome difere entre os lados (a mídia clonada ganha hash novo); casa pela CAIXA (±3px). Pela ordem errava:
  // o clone tem imagens que o original não monta (o painel de contato) e a ordem desandava
  const imgsC = c.filter((x) => x.k.startsWith("img:"));
  // texto: o igual MAIS PRÓXIMO na página (pela ordem, um texto repetido casava com o de outro lugar: a palavra do ciclo,
  // o nome no painel)
  const semN = (k) => k.replace(/#\d+$/, "");
  const parDe = (x) => { if (!x.k.startsWith("img:")) { const cs = c.filter((y) => semN(y.k) === semN(x.k)); return cs.sort((a, b) => Math.abs(a.y - x.y) + Math.abs(a.x - x.x) - Math.abs(b.y - x.y) - Math.abs(b.x - x.x))[0]; } return imgsC.find((y) => Math.abs(y.x - x.x) <= 3 && Math.abs(y.y - x.y) <= 3 && Math.abs(y.w - x.w) <= 3 && Math.abs(y.h - x.h) <= 3); };
  const linhas = [];
  for (const x of o) {
    const y = parDe(x); if (!y) continue;
    const eo = x.o < 0.5, ec = y.o < 0.5;
    if (eo && !ec) linhas.push(`falta entrada: «${x.k}» @${x.y} (original ${x.o}, clone ${y.o})`);
    else if (!eo && ec) linhas.push(`sobra entrada: «${x.k}» @${x.y} (original ${x.o}, clone ${y.o})`);
  }
  total += linhas.length;
  console.log(`${linhas.length ? "🚨" : "  "} ${String(L).padStart(4)} ${rota.slice(0, 50).padEnd(51)} escondidos no início: original ${o.filter((x) => x.o < 0.5).length} · clone ${c.filter((x) => x.o < 0.5).length} · diferem ${linhas.length}`);
  for (const l of linhas.slice(0, 8)) console.log(`        ${l}`);
}
await b.close();
console.log(`\nTOTAL: ${total} diferença(s)`);
process.exitCode = total ? 1 : 0;
