// inspeciona.mjs — o microscópio. Dois lados, o MESMO elemento, lado a lado.
//
// O `compara-geometria.mjs` diz QUEM está fora do lugar. Este diz POR QUÊ:
// mostra caixa, transform, largura, altura e o que mais se pedir, do elemento
// no clone (por data-cid) e do correspondente no original (por texto ou por
// posição).
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 ROTA=/ \
//   CIDS=n4,n1276 PROPS=transform,width,height node inspeciona.mjs
//
// Variáveis:
//   CIDS     lista de data-cid do CLONE (obrigatória)
//   TEXTOS   alternativa/complemento: textos para achar nos DOIS lados
//   PROPS    propriedades computadas extras (padrão transform,width,height,
//            position,opacity,display)
//   ROLAR    px de scroll antes de ler (padrão 0)
//   ESPERA   ms depois do load antes de ler (padrão 3000)

import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const ORIGINAL = process.env.ORIGINAL;
const CLONE = process.env.CLONE;
if (!ORIGINAL || !CLONE) {
  console.error("faltam ORIGINAL e/ou CLONE");
  process.exit(1);
}
const ROTA = process.env.ROTA ?? "/";
const CIDS = (process.env.CIDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const TEXTOS = (process.env.TEXTOS ?? "").split("|").map((s) => s.trim()).filter(Boolean);
const PROPS = (process.env.PROPS ?? "transform,width,height,position,opacity,display")
  .split(",").map((s) => s.trim()).filter(Boolean);
const ROLAR = Number(process.env.ROLAR ?? 0);
const ESPERA = Number(process.env.ESPERA ?? 3000);
const SAIDA = resolve(process.env.SAIDA ?? "./inspecao");
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
mkdirSync(SAIDA, { recursive: true });

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

const LER = ({ cids, textos, props }) => {
  const norm = (s) => String(s).replace(/\s+/g, " ").trim();
  const dump = (el, comoAchou) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const o = {
      comoAchou,
      tag: el.tagName.toLowerCase(),
      cid: el.getAttribute("data-cid") || null,
      classe: String(el.className || "").slice(0, 160),
      styleInline: el.getAttribute("style") || null,
      texto: norm(el.textContent).slice(0, 50),
      x: Math.round((r.left + scrollX) * 100) / 100,
      y: Math.round((r.top + scrollY) * 100) / 100,
      w: Math.round(r.width * 100) / 100,
      h: Math.round(r.height * 100) / 100,
      props: {},
      animacoes: el.getAnimations().map((a) => ({
        nome: a.animationName || (a.transitionProperty ?? "?"),
        estado: a.playState,
        dur: a.effect?.getTiming?.().duration ?? null,
        delay: a.effect?.getTiming?.().delay ?? null,
        fill: a.effect?.getTiming?.().fill ?? null,
      })),
      paiTransform: el.parentElement ? getComputedStyle(el.parentElement).transform : null,
      paiW: el.parentElement ? Math.round(el.parentElement.getBoundingClientRect().width * 100) / 100 : null,
    };
    for (const p of props) o.props[p] = cs.getPropertyValue(p);
    return o;
  };
  const saida = [];
  for (const cid of cids) {
    const el = document.querySelector(`[data-cid="${cid}"]`);
    saida.push(el ? dump(el, `cid=${cid}`) : { comoAchou: `cid=${cid}`, ausente: true });
  }
  for (const t of textos) {
    let achado = null;
    // 1a tentativa: texto PRoPRIO (folha de texto).
    for (const el of document.querySelectorAll("body *")) {
      let proprio = "";
      for (const n of el.childNodes) if (n.nodeType === 3) proprio += n.nodeValue;
      if (norm(proprio) === t) { achado = el; break; }
    }
    // 2a tentativa: textContent inteiro. CONTeINER nao tem texto proprio, e
    // era justamente o contêiner (nav, barra) que eu precisava inspecionar —
    // sem isto a coluna ORIGINAL vinha vazia para todo elemento de estrutura.
    if (!achado) {
      let menor = null;
      for (const el of document.querySelectorAll("body *")) {
        if (norm(el.textContent).slice(0, 50) !== t) continue;
        if (!menor || el.getElementsByTagName("*").length < menor.getElementsByTagName("*").length) menor = el;
      }
      achado = menor;
    }
    saida.push(achado ? dump(achado, `texto=${t}`) : { comoAchou: `texto=${t}`, ausente: true });
  }
  return saida;
};

async function ler(page, url, textos) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(ESPERA);
  if (ROLAR) {
    await page.evaluate((y) => window.scrollTo(0, y), ROLAR);
    await page.waitForTimeout(900);
  }
  return page.evaluate(LER, { cids: CIDS, textos, props: PROPS });
}

(async () => {
  const nav = await chromium.launch();
  const ctx = await nav.newContext({ viewport: { width: Number(process.env.LARGURA ?? 1280), height: 900 } });
  const page = await ctx.newPage();

  // No clone acha por cid; no original o cid não existe, então busca pelo
  // TEXTO do que foi achado no clone. É o mesmo casamento do gera-entrada.
  const c = await ler(page, new URL(ROTA, CLONE).href, TEXTOS);
  const textosDoClone = c.filter((x) => !x.ausente && x.texto).map((x) => x.texto);
  const o = await ler(page, new URL(ROTA, ORIGINAL).href, [...new Set([...TEXTOS, ...textosDoClone])]);
  await nav.close();

  const acharOriginal = (item) =>
    o.find((x) => !x.ausente && x.texto && item.texto && x.texto === item.texto) ?? null;

  for (const item of c) {
    console.log("\n" + "=".repeat(72));
    if (item.ausente) { console.log(`❌ CLONE: ${item.comoAchou} NÃO EXISTE`); continue; }
    const par = acharOriginal(item);
    console.log(`${item.comoAchou}  <${item.tag}>  "${item.texto.slice(0, 44)}"`);
    console.log(`  ${"".padEnd(14)} ${"ORIGINAL".padStart(30)} | ${"CLONE".padStart(30)}`);
    const linha = (rot, a, b) =>
      console.log(`  ${rot.padEnd(14)} ${String(a ?? "-").slice(0, 30).padStart(30)} | ${String(b ?? "-").slice(0, 30).padStart(30)}`);
    linha("x", par?.x, item.x);
    linha("y", par?.y, item.y);
    linha("largura", par?.w, item.w);
    linha("altura", par?.h, item.h);
    for (const p of PROPS) linha(p, par?.props?.[p], item.props?.[p]);
    linha("pai.transform", par?.paiTransform, item.paiTransform);
    linha("pai.largura", par?.paiW, item.paiW);
    linha("style inline", par?.styleInline, item.styleInline);
    if (item.animacoes.length || par?.animacoes?.length) {
      console.log(`  animações      original=${JSON.stringify(par?.animacoes ?? [])}`);
      console.log(`                 clone   =${JSON.stringify(item.animacoes)}`);
    }
    if (item.classe) console.log(`  classe clone   ${item.classe}`);
  }

  writeFileSync(join(SAIDA, "inspecao.json"), JSON.stringify({ rota: ROTA, clone: c, original: o }, null, 2));
  console.log(`\nsaída: ${join(SAIDA, "inspecao.json")}`);
})();
