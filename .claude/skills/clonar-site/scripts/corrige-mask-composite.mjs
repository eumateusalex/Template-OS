// corrige-mask-composite.mjs — devolve o `mask-composite` que a captura perdeu.
//
// 🚨 O DEFEITO (medido no site-next):
//
//   | rota                  | original                  | clone        |
//   | /platform/workflows   | intersect: 9, add: 1      | **add: 10**  |
//   | /customers            | intersect: 2, add: 6      | **add: 8**   |
//   | /pricing              | add: 7                    | add: 7  (ok) |
//   | /careers              | add: 1                    | add: 1  (ok) |
//
// Quando um elemento tem VÁRIAS camadas de máscara, `mask-composite` decide
// como elas se combinam:
//   intersect -> a área visível é a INTERSEÇÃO. Uma camada de fade recorta as
//                outras, e o padrão decorativo some onde deve sumir.
//   add       -> as camadas se SOMAM. A camada branca opaca vence e nada é
//                escondido.
//
// O ditto transcreve as `mask-image` (todas as 6 camadas, valores corretos) e
// **perde o `mask-composite`**, que volta ao padrão `add`. Efeito medido em
// /customers: o topo do herói, branco liso no original, aparecia no clone
// coberto por uma grade de pontos que deveria estar mascarada.
//
// 🚨 Como o `paint-order`, isto NÃO é acusado por nenhuma medição automática:
// a caixa é a mesma, o conteúdo é o mesmo, a máscara declarada é a mesma. Só a
// conferência visual pareada pega.
//
// O casamento original -> clone é por GEOMETRIA (caixa) e não por seletor,
// pelo mesmo motivo do gera-entrada.mjs: o clone tem a mesma geometria e o
// `data-cid` é o seletor estável deste lado.
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 APP=<pasta>/app \
//   ROTA=/customers node corrige-mask-composite.mjs
//
// Variáveis:
//   ORIGINAL  URL base do original (obrigatória)
//   CLONE     URL base do clone servido (obrigatória)
//   APP       raiz do app gerado (obrigatória)
//   ROTA      rota a tratar (padrão: /)
//   TOL       tolerância de casamento de caixa em px (padrão: 6)
//   ESPERA    estratégia do goto (padrão: load — networkidle trava em site vivo)
//   ESCREVER  "0" para simular
//   DITTO     raiz do ditto (padrão: C:/dev/ditto)

import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const ORIGINAL = process.env.ORIGINAL;
const CLONE = process.env.CLONE;
const APP = process.env.APP;
if (!ORIGINAL || !CLONE || !APP) {
  console.error("faltam ORIGINAL, CLONE e/ou APP");
  process.exit(1);
}
const ROTA = process.env.ROTA ?? "/";
const TOL = Number(process.env.TOL ?? 6);
const ESPERA = process.env.ESPERA ?? "load";
const ESCREVER = process.env.ESCREVER !== "0";
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

const LER = () =>
  [...document.querySelectorAll("*")]
    .filter((e) => getComputedStyle(e).maskImage !== "none")
    .map((e) => {
      const cs = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      return {
        cid: e.getAttribute("data-cid") ?? null,
        composite: (cs.maskComposite || cs.webkitMaskComposite || "add").split(",")[0].trim(),
        camadas: (cs.maskImage.match(/gradient|url\(/g) ?? []).length,
        x: Math.round(r.left + window.scrollX),
        y: Math.round(r.top + window.scrollY),
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    });

const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 } });

async function ler(base) {
  const p = await ctx.newPage();
  await p.goto(new URL(ROTA, base).href, { waitUntil: ESPERA, timeout: 60000 });
  await p.waitForTimeout(1800);
  // rolar a página inteira: máscara em seção baixa só existe depois de renderizar
  await p.evaluate(async () => {
    const passo = Math.max(200, window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += passo) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 200));
  });
  const r = await p.evaluate(LER);
  await p.close();
  return r;
}

const orig = await ler(ORIGINAL);
const clone = await ler(CLONE);
await nav.close();

// 🚨 Só interessa quem NÃO é `add` no original: `add` já é o padrão que o
// clone tem, e escrever o que já está certo é ruído — e risco.
const divergentes = orig.filter((o) => o.composite && o.composite !== "add");

console.log(`${ROTA}: original ${orig.length} elemento(s) com máscara, ${divergentes.length} com composite != add`);
if (!divergentes.length) {
  console.log("nada a corrigir nesta rota.");
  process.exit(0);
}

const regras = [];
const naoCasados = [];
for (const o of divergentes) {
  const cands = clone
    .map((c) => ({ c, erro: Math.abs(c.x - o.x) + Math.abs(c.y - o.y) + Math.abs(c.w - o.w) + Math.abs(c.h - o.h) }))
    .filter((v) => v.erro <= TOL * 4 && v.c.cid)
    .sort((a, b) => a.erro - b.erro);
  const alvo = cands[0];
  if (!alvo) {
    naoCasados.push(o);
    continue;
  }
  if (alvo.c.composite === o.composite) continue; // já está certo
  regras.push(
    `[data-cid="${alvo.c.cid}"]{mask-composite:${o.composite};-webkit-mask-composite:${o.composite === "intersect" ? "source-in" : o.composite}}` +
      `  /* ${o.w}x${o.h} @${o.x},${o.y} · ${o.camadas} camada(s) · erro=${alvo.erro}px */`,
  );
}

const dirRota = ROTA === "/" ? join(APP, "src", "app") : join(APP, "src", "app", ...ROTA.split("/").filter(Boolean));
if (!existsSync(join(dirRota, "page.tsx"))) {
  console.error(`a rota ${ROTA} não tem page.tsx em ${dirRota} — nada a escrever`);
  process.exit(1);
}

const css =
  `/* mask-composite.css — o modo de composição de máscara que a captura perdeu.\n` +
  `   Medido no original: ${divergentes.length} elemento(s) com composite != add.\n` +
  `   Sem isto, camadas de máscara se SOMAM em vez de se INTERSECTAR, e o que\n` +
  `   deveria estar recortado aparece. Nenhum número foi digitado à mão. */\n\n` +
  regras.join("\n") +
  "\n";

const destino = join(dirRota, "mask-composite.css");
if (ESCREVER && regras.length) {
  writeFileSync(destino, css, "utf8");
  const pageTsx = join(dirRota, "page.tsx");
  let page = readFileSync(pageTsx, "utf8");
  if (!page.includes("mask-composite.css")) {
    page = `import "./mask-composite.css";\n` + page;
    writeFileSync(pageTsx, page, "utf8");
  }
}

console.log(`  regras escritas: ${regras.length}${ESCREVER ? " -> " + destino : " (simulado)"}`);
if (naoCasados.length) {
  console.log(`  ⚠️ ${naoCasados.length} não casaram por caixa (declarados, nunca silenciados):`);
  for (const o of naoCasados.slice(0, 6)) console.log(`     ${o.w}x${o.h} @${o.x},${o.y}`);
}
