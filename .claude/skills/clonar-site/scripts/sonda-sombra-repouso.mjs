// sonda-sombra-repouso.mjs — toda SOMBRA que o original mostra parado existe no clone, igual?
//
// 🚨 Por que existe: a varredura de hover compara só o que MUDA quando o mouse entra. Um botão cuja
// sombra o clone perdeu em repouso e que a perde também no hover "não muda" nos dois lados e passa. A
// sombra também costuma vir em várias camadas, várias delas transparentes, e ler o box-shadow inteiro
// engana: o "Contact" de um menu pode parecer sem sombra porque as quatro primeiras camadas são
// rgba(0,0,0,0) e as visíveis vêm depois.
//
// O que faz, por rota: com a página parada no topo e o mouse fora, colhe nos dois lados todo elemento
// visível na página inteira (desce até o fim antes: o que monta ao rolar monta) com sombra VISÍVEL (camada com alfa > 0 e algum deslocamento, desfoque ou espalhamento)
// e compara as camadas visíveis, arredondadas a 0,1px e 0,01 de alfa. Empate de caixa conta como no
// sonda-bordas: basta um elemento do clone com aquela caixa (±3px) ter a mesma sombra.
// Sai com código 1 se faltar ou diferir alguma.
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 ROTAS=<rotas.json | /a,/b> \
//   [LARGURAS="1280 375"] [IGNORA="seletor CSS"] node sonda-sombra-repouso.mjs
// Variáveis: ROTA=/x no lugar de ROTAS; DITTO; ESPERA ms depois do load (padrão 2500);
//   IGNORA  seletor do que não é do site (padrão: o selo do Framer, #__framer-badge-container e afins)
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
const LARGURAS = (process.env.LARGURAS ?? process.env.LARGURA ?? "1280 375").split(/[ ,]+/).map(Number).filter(Boolean);
const ESPERA = Number(process.env.ESPERA ?? 2500);
const IGNORA = process.env.IGNORA ?? "#__framer-badge-container, [class*='__framer-badge'], [data-framer-name='Badge']";

function carregarRotas() {
  const r = process.env.ROTAS;
  if (r) {
    if (existsSync(r) && statSync(r).isFile()) return JSON.parse(readFileSync(r, "utf8").replace(/^\uFEFF/, "")).rotas.filter((x) => x.status === 200 || x.status === null || x.status === undefined).map((x) => x.rota);
    return r.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [process.env.ROTA ?? "/"];
}

// roda no navegador: elementos com as camadas VISÍVEIS da sombra, normalizadas
function colherNaPagina(ignora) {
  const fora = new Set(); try { for (const e of document.querySelectorAll(ignora)) { fora.add(e); for (const d of e.querySelectorAll("*")) fora.add(d); } } catch {}
  const camadas = (s) => {
    if (!s || s === "none") return [];
    const partes = s.split(/,(?![^(]*\))/).map((p) => p.trim());
    return partes.map((p) => {
      const cor = (p.match(/rgba?\([^)]*\)/) || ["rgb(0,0,0)"])[0];
      const v = cor.match(/[\d.]+/g).map(Number); const a = v.length >= 4 ? v[3] : 1;
      const nums = p.replace(cor, "").match(/-?[\d.]+px/g)?.map(parseFloat) || [];
      const inset = /inset/.test(p);
      if (a <= 0.001 || nums.every((n) => Math.abs(n) < 0.05)) return null;
      return `${inset ? "inset " : ""}${nums.map((n) => n.toFixed(1)).join(" ")} rgba(${v.slice(0, 3).join(",")},${a.toFixed(2)})`;
    }).filter(Boolean);
  };
  const out = [];
  for (const e of document.querySelectorAll("body *")) {
    if (fora.has(e)) continue;
    const r = e.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(e);
    if (cs.visibility === "hidden" || +cs.opacity === 0) continue;
    out.push({ id: e.getAttribute("data-cid") || e.getAttribute("data-framer-name") || e.tagName.toLowerCase(), texto: e.textContent.replace(/\s+/g, " ").trim().slice(0, 24), x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height), sombra: camadas(cs.boxShadow).join(" ; ") });
  }
  return out;
}

const browser = await chromium.launch();
async function colher(base, rota, L) {
  const ctx = await browser.newContext({ viewport: { width: L, height: 900 } });
  try {
    const page = await ctx.newPage();
    await page.goto(base.replace(/\/$/, "") + rota, { waitUntil: "load", timeout: 60000 });
    await page.mouse.move(1, 1);
    await page.waitForTimeout(ESPERA);
    // a página inteira, não só a primeira tela (o "Get Started" do fim da home escapava); de volta ao topo para medir
    await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 450) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); } scrollTo(0, 0); });
    await page.waitForTimeout(1200);
    return await page.evaluate(colherNaPagina, IGNORA);
  } finally { await ctx.close(); }
}

let falta = 0, dif = 0, total = 0, naoMedidas = 0;
for (const L of LARGURAS) {
  for (const rota of carregarRotas()) {
    let o, c;
    try { o = await colher(ORIGINAL, rota, L); c = await colher(CLONE, rota, L); }
    catch (err) { naoMedidas++; console.log(`✖  ${L} ${rota}: não medi (${String(err.message).split("\n")[0]})`); continue; }
    const comSombra = o.filter((e) => e.sombra); total += comSombra.length;
    const linhas = [];
    for (const e of comSombra) {
      const naCaixa = c.filter((k) => Math.abs(k.x - e.x) <= 3 && Math.abs(k.y - e.y) <= 3 && Math.abs(k.w - e.w) <= 3 && Math.abs(k.h - e.h) <= 3);
      if (naCaixa.some((k) => k.sombra === e.sombra)) continue;
      const k = naCaixa.find((q) => q.sombra);
      if (k) { dif++; linhas.push(`difere "${e.texto}" ${e.w}x${e.h}@${e.x},${e.y} · original ${e.sombra} · clone ${k.id}: ${k.sombra}`); }
      else { falta++; linhas.push(`falta  "${e.texto}" ${e.w}x${e.h}@${e.x},${e.y} · original ${e.sombra}${naCaixa.length ? "" : " · (nada no clone com essa caixa)"}`); }
    }
    console.log(`${linhas.length ? "🚨" : "  "} ${String(L).padStart(4)} ${rota.slice(0, 46).padEnd(47)} sombras no original: ${comSombra.length} · faltam ou diferem: ${linhas.length}`);
    for (const l of linhas.slice(0, 6)) console.log(`        ${l}`);
  }
}
await browser.close();
console.log(`\nTOTAL: ${total} sombra(s) no original · ${falta} faltam · ${dif} diferem · ${naoMedidas} medição(ões) que falharam`);
process.exitCode = falta || dif || naoMedidas ? 1 : 0;
