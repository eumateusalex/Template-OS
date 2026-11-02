// sonda-bordas.mjs — toda BORDA visível do original existe no clone, com a mesma largura, estilo e cor?
//
// 🚨 Por que existe: no Framer a borda quase nunca é `border` do elemento; é o `::after` dele, alimentado
// por variáveis (--border-top-width, --border-color…). Se a captura perde as variáveis, o `::after`
// continua lá e a borda mede 0px. A geometria não vê (a caixa é a mesma), a régua de texto também não.
// Um site assim pode perder centenas de bordas de uma vez, e o contorno do cartão inclinado só no celular.
//
// O que faz, por rota: desce a página inteira (o que monta ao rolar fica montado), colhe nos dois lados
// todo elemento cujo próprio box, `::after` ou `::before` tem borda VISÍVEL, e procura no clone:
//   1. pela caixa (±3px): basta QUALQUER elemento com aquela caixa ter a mesma borda — empate de caixa
//      é comum (o bloco e o filho com a mesma caixa), e a borda pode morar num invólucro a mais;
//   2. sem nada na caixa: pelo tamanho (±6px) na página inteira — elemento fixo ou que se move fica em
//      outro ponto do documento quando a página é medida. Achado assim conta como presente e é declarado.
//   3. nem assim: o mesmo tamanho na mesma coluna até 150px acima ou abaixo, SEM a borda, é falta com a
//      caixa deslocada (a página do clone ficou mais curta antes dele, por dezenas de px).
// Borda de cor com alfa 0 NÃO é borda: o Framer deixa muitas (rgba(…, 0)) e elas não se veem.
//
// Saída: por rota, quantas bordas o original tem, quantas faltam no clone, quantas diferem, quantas foram
// achadas só pelo tamanho e quantas ficaram sem par nenhum (essas pedem olho: o instrumento não decide).
// Sai com código 1 se faltar ou diferir alguma.
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 ROTAS=<rotas.json | /a,/b> \
//   [LARGURA=1280] [MOSTRA=8] [SAIDA=bordas.json] node sonda-bordas.mjs
// Variáveis:
//   ORIGINAL, CLONE  URLs base (obrigatórias)
//   ROTAS     arquivo do levanta-rotas (só status 200/null) ou lista separada por vírgula; ou ROTA=/x
//   LARGURA   viewport (padrão 1280) · MOSTRA quantas linhas por rota (padrão 8) · DITTO onde está o Playwright
import { createRequire } from "node:module";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";

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
const L = Number(process.env.LARGURA ?? 1280), MOSTRA = Number(process.env.MOSTRA ?? 8);

function carregarRotas() {
  const r = process.env.ROTAS;
  if (r) {
    if (existsSync(r) && statSync(r).isFile()) return JSON.parse(readFileSync(r, "utf8").replace(/^\uFEFF/, "")).rotas.filter((x) => x.status === 200 || x.status === null || x.status === undefined).map((x) => x.rota);
    return r.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [process.env.ROTA ?? "/"];
}

// roda no navegador: todo elemento visível com borda visível (própria, ::after ou ::before)
function colherNaPagina() {
  const alfa = (cor) => { const m = cor.match(/rgba?\(([^)]*)\)/); if (!m) return 1; const v = m[1].split(/[,/\s]+/).filter(Boolean).map(Number); return v.length >= 4 ? v[3] : 1; };
  const lados = (c) => ["Top", "Right", "Bottom", "Left"].map((s) => { const w = parseFloat(c["border" + s + "Width"]) || 0; const cor = c["border" + s + "Color"]; return w > 0 && c["border" + s + "Style"] !== "none" && c["border" + s + "Style"] !== "hidden" && alfa(cor) > 0.001 ? `${w}px ${c["border" + s + "Style"]} ${cor}` : "0"; }).join(" | ");
  const out = [];
  for (const e of document.querySelectorAll("body *")) {
    const b = e.getBoundingClientRect();
    if (b.width < 2 || b.height < 2) continue;
    const cs = getComputedStyle(e);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const bordas = [["próprio", lados(cs)], ["::after", lados(getComputedStyle(e, "::after"))], ["::before", lados(getComputedStyle(e, "::before"))]].filter(([, l]) => l !== "0 | 0 | 0 | 0");
    out.push({ tag: e.tagName.toLowerCase(), id: e.getAttribute("data-cid") || e.getAttribute("data-framer-name") || "", x: Math.round(b.left), y: Math.round(b.top + scrollY), w: Math.round(b.width), h: Math.round(b.height), bordas: bordas.map(([onde, l]) => `${onde} ${l}`), so: bordas.map(([, l]) => l) });
  }
  return out;
}

const browser = await chromium.launch();
async function colher(base, rota) {
  const ctx = await browser.newContext({ viewport: { width: L, height: 900 } });
  const page = await ctx.newPage();
  try {
    await page.goto(base.replace(/\/$/, "") + rota, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(2500);
    await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 450) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 110)); } });
    await page.waitForTimeout(1400);
    return await page.evaluate(colherNaPagina);
  } finally { await ctx.close(); }
}

const perto = (a, b, t) => Math.abs(a.x - b.x) <= t && Math.abs(a.y - b.y) <= t && Math.abs(a.w - b.w) <= t && Math.abs(a.h - b.h) <= t;
const mesmoTamanho = (a, b, t) => Math.abs(a.w - b.w) <= t && Math.abs(a.h - b.h) <= t;
const temIgual = (e, ks) => ks.some((k) => e.so.every((l) => k.so.includes(l)));

const tudo = {}; const total = { orig: 0, falta: 0, dif: 0, pelo_tamanho: 0, sem_par: 0, erro: 0 };
for (const rota of carregarRotas()) {
  let o, c;
  try { o = await colher(ORIGINAL, rota); c = await colher(CLONE, rota); }
  catch (err) { total.erro++; console.log(`✖  ${rota}: não medi (${String(err.message).split("\n")[0]})`); tudo[rota] = { erro: String(err.message) }; continue; }
  const comBorda = o.filter((e) => e.so.length);
  const linhas = []; const n = { falta: 0, dif: 0, pelo_tamanho: 0, sem_par: 0 };
  for (const e of comBorda) {
    const naCaixa = c.filter((k) => perto(k, e, 3));
    if (naCaixa.length) {
      if (temIgual(e, naCaixa)) continue;
      const k = naCaixa.find((q) => q.so.length);
      if (k) { n.dif++; linhas.push({ tipo: "difere", e, k }); } else { n.falta++; linhas.push({ tipo: "falta", e, k: naCaixa[0] }); }
      continue;
    }
    const peloTamanho = c.filter((k) => mesmoTamanho(k, e, 6) && k.so.length);
    if (temIgual(e, peloTamanho)) { n.pelo_tamanho++; continue; }
    // caixa deslocada: o mesmo elemento existe perto (mesmo tamanho, mesma coluna, até 150px acima ou abaixo)
    // e sem a borda — a página do clone ficou mais curta ou mais alta antes dele
    const vizinho = c.filter((k) => mesmoTamanho(k, e, 6) && Math.abs(k.x - e.x) <= 6 && Math.abs(k.y - e.y) <= 150).sort((a, z) => Math.abs(a.y - e.y) - Math.abs(z.y - e.y))[0];
    if (vizinho) { n.falta++; linhas.push({ tipo: "falta", e, k: vizinho, deslocada: vizinho.y - e.y }); continue; }
    n.sem_par++; linhas.push({ tipo: "sem par", e });
  }
  tudo[rota] = { comBorda: comBorda.length, ...n, linhas };
  total.orig += comBorda.length; for (const k of Object.keys(n)) total[k] += n[k];
  console.log(`${n.falta || n.dif ? "🚨" : "  "} ${rota.slice(0, 48).padEnd(49)} bordas no original: ${String(comBorda.length).padStart(3)} · faltam: ${n.falta} · diferem: ${n.dif} · achadas pelo tamanho: ${n.pelo_tamanho} · sem par: ${n.sem_par}`);
  for (const l of linhas.slice(0, MOSTRA)) console.log(`     ${l.tipo.padEnd(7)} ${l.e.tag} "${l.e.id}" ${l.e.w}x${l.e.h}@${l.e.x},${l.e.y} · original ${l.e.bordas.join(" + ")}${l.k ? ` · clone ${l.k.id || l.k.tag}${l.deslocada ? ` (caixa ${l.deslocada > 0 ? "+" : ""}${l.deslocada}px)` : ""}: ${l.k.bordas.join(" + ") || "sem borda"}` : ""}`);
}
await browser.close();
if (process.env.SAIDA) writeFileSync(process.env.SAIDA, JSON.stringify(tudo, null, 1));
console.log(`\nTOTAL @${L}px: ${total.orig} borda(s) no original · ${total.falta} faltam · ${total.dif} diferem · ${total.pelo_tamanho} achadas pelo tamanho · ${total.sem_par} sem par (olhar) · ${total.erro} rota(s) não medidas`);
process.exitCode = total.falta || total.dif || total.erro ? 1 : 0;
