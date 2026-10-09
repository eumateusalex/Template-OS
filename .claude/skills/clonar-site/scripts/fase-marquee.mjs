// fase-marquee.mjs — devolve ao trilho de laço a FASE INICIAL medida no
// original, apagando a fase que a captura congelou.
//
// O buraco que ele tapa (medido no framer-4): a foto do ditto pega
// o trilho no meio da volta. A galeria do /studio sai com
// `transform-[matrix(1,0,0,1,138.67,0)]` — 138px que NÃO são posição de
// repouso, são o instante do obturador. O runtime do marquee parte desse x0 e
// o mantém para sempre, então os 30 itens ficam 155px fora do lugar o tempo
// todo, com a velocidade certa e a fase errada.
//
// 🚨 O que distingue este instrumento do resto: a fase de repouso de um laço
// NÃO se mede na página assentada (lá o trilho já andou), e sim LOGO DEPOIS DO
// LOAD, antes de o laço acumular percurso. Medido no framer-4: os dois trilhos
// de prêmios começam em 0 nos dois lados e derivam ~11px (jitter de tempo
// visível); a galeria começava em 0 no original e 136 no clone, e essa
// diferença explicava sozinha 155 dos 155,4px de desvio.
//
// O que o faz SE CALAR:
//   - trilho não achado num dos lados        -> declara e sai
//   - a fase do original ainda está mudando  -> declara (não é fase de repouso)
//   - trilho sem classe de transform no JSX  -> declara, não inventa classe
//
// Uso:
//   ORIGINAL=<url> CLONE=<url> APP=<app> SPEC=<spec.json> node fase-marquee.mjs
//
// SPEC: [{ "rota":"/studio", "ancoraY":480, "cidTrilho":"n106",
//          "arquivo":"src/app/studio/page.tsx" }]
//
// Variáveis: ORIGINAL, APP, SPEC (obrigatórias) · LARGURA (1280) ·
//   ESCREVER=0 simula · DITTO (C:/dev/ditto)

import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const ORIGINAL = process.env.ORIGINAL;
const APP = process.env.APP;
const SPEC = process.env.SPEC;
if (!ORIGINAL || !APP || !SPEC) { console.error("falta ORIGINAL=<url> APP=<app> SPEC=<spec.json>"); process.exit(1); }
const LARGURA = Number(process.env.LARGURA ?? 1280);
const ESCREVER = process.env.ESCREVER !== "0";
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");
const espec = JSON.parse(readFileSync(resolve(SPEC), "utf8").replace(/^\uFEFF/, ""));

const nav = await chromium.launch();

// mede o x do trilho em vários instantes desde o load; a fase de repouso é o
// valor dos primeiros quadros, e só vale se ele ainda não começou a andar
async function faseInicial(url, rota, ancoraY) {
  const p = await nav.newPage({ viewport: { width: LARGURA, height: 900 } });
  await p.goto(new URL(rota, url).href, { waitUntil: "domcontentloaded", timeout: 60000 });
  const leitura = async () =>
    p.evaluate((alvo) => {
      let mel = null, d = Infinity;
      for (const u of document.querySelectorAll("ul")) {
        const rr = u.getBoundingClientRect();
        const dd = Math.abs(rr.top + scrollY - alvo);
        if (dd < d) { d = dd; mel = u; }
      }
      if (!mel) return null;
      const t = getComputedStyle(mel).transform;
      try { return Math.round(new DOMMatrixReadOnly(t === "none" ? "" : t).e * 100) / 100; } catch { return null; }
    }, ancoraY);
  await p.waitForTimeout(120);
  const a = await leitura();
  await p.waitForTimeout(200);
  const b = await leitura();
  await p.close();
  return { a, b, estavel: a !== null && b !== null && Math.abs(a - b) < 0.6 };
}

for (const t of espec) {
  const arquivo = join(APP, t.arquivo);
  console.log(`\n=== ${t.cidTrilho} · rota ${t.rota} ===`);
  if (!existsSync(arquivo)) { console.log(`  arquivo ausente: ${t.arquivo} — declarado`); continue; }
  const o = await faseInicial(ORIGINAL, t.rota, t.ancoraY);
  if (o.a === null) { console.log("  trilho não achado no original — declarado"); continue; }
  console.log(`  fase inicial no original: ${o.a} (2ª leitura ${o.b}) ${o.estavel ? "" : "⚠️ ainda andando na largada"}`);

  let jsx = readFileSync(arquivo, "utf8");
  const marca = `data-cid="${t.cidTrilho}"`;
  const pos = jsx.indexOf(marca);
  if (pos < 0) { console.log("  cid não achado no JSX — declarado"); continue; }
  const ini = jsx.lastIndexOf("<", pos);
  const fim = jsx.indexOf(">", pos);
  const abertura = jsx.slice(ini, fim + 1);
  const antes = [...abertura.matchAll(/transform-\[(?:matrix\([^\]]*\)|none)\]/g)].map((m) => m[0]);
  if (!antes.length) { console.log("  trilho sem classe de transform — declarado, nada inventado"); continue; }

  // 🚨 TODAS as variantes de breakpoint vão junto: cada uma guarda a fase do
  // instante da foto naquela largura, e todas erram pelo mesmo motivo.
  const alvo = Math.abs(o.a) < 0.01 ? "transform-[none]" : `transform-[matrix(1,0,0,1,${o.a},0)]`;
  const nova = abertura.replace(/transform-\[(?:matrix\([^\]]*\)|none)\]/g, alvo);
  console.log(`  ${antes.length} classe(s): ${antes.join(" ")}`);
  console.log(`  -> ${alvo}`);
  if (nova === abertura) { console.log("  já estava na fase medida — nada a fazer"); continue; }
  if (ESCREVER) writeFileSync(arquivo, jsx.slice(0, ini) + nova + jsx.slice(fim + 1));
  console.log(`  ${ESCREVER ? "escrito" : "SIMULADO"}`);
}

await nav.close();
