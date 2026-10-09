// corrige-propriedade-perdida.mjs — devolve ao clone as propriedades que a
// captura simplesmente NÃO TRANSCREVE.
//
// 🚨 POR QUE ESTE INSTRUMENTO EXISTE
// O ditto materializa quase todo o estilo computado, mas algumas propriedades
// somem sem aviso. São sempre do mesmo tipo — as que dizem COMO combinar ou
// COMO distribuir, não as que dizem tamanho ou cor. Medidas no site-next, cada
// uma visível só pela conferência visual pareada:
//
//   | propriedade      | original            | clone   | efeito no clone |
//   |------------------|---------------------|---------|-----------------|
//   | `paint-order`    | stroke (39/39)      | normal  | contorno come a letra |
//   | `mask-composite` | intersect (9 em /platform/workflows) | add | máscara não recorta |
//   | `column-count`   | 4 (rodapé)          | auto    | colunas empilham, +740px de página |
//
// NENHUMA delas é acusada por medição de rota, metadata, conteúdo, geometria
// de elemento ou pelo gate de animação: a caixa do elemento é a mesma, o texto
// é o mesmo, a cor é a mesma. O `column-count` só apareceu porque a ALTURA DA
// PÁGINA divergiu 740px — e mesmo assim foi preciso caçar onde.
//
// COMO FUNCIONA
// Mede a propriedade no original, casa o elemento com o do clone por GEOMETRIA
// (mesmo critério do gera-entrada.mjs, pelo mesmo motivo: o clone tem a mesma
// caixa e o `data-cid` é o seletor estável deste lado), e escreve a regra só
// onde os dois divergem. O que não casar sai DECLARADO.
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 APP=<pasta>/app \
//   PROP=column-count ROTA=/ node corrige-propriedade-perdida.mjs
//
// Variáveis:
//   ORIGINAL  URL base do original (obrigatória)
//   CLONE     URL base do clone servido (obrigatória)
//   APP       raiz do app gerado (obrigatória)
//   PROP      propriedade CSS a comparar (obrigatória; ex.: column-count)
//   ROTA      rota a tratar (padrão: /)
//   PADRAO    valor considerado "sem efeito" e ignorado (padrão: auto)
//   ARQUIVO   nome do css gerado (padrão: derivado de PROP)
//   TOL       tolerância de casamento de caixa em px (padrão: 6)
//   ESPERA    estratégia do goto (padrão: load)
//   ESCREVER  "0" para simular

import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const { ORIGINAL, CLONE, APP, PROP } = process.env;
if (!ORIGINAL || !CLONE || !APP || !PROP) {
  console.error("faltam ORIGINAL, CLONE, APP e/ou PROP");
  process.exit(1);
}
const ROTA = process.env.ROTA ?? "/";
const PADRAO = process.env.PADRAO ?? "auto";
const ARQUIVO = process.env.ARQUIVO ?? `${PROP.replace(/[^a-z0-9-]/gi, "-")}.css`;
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

const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 } });

async function ler(base, prop) {
  const p = await ctx.newPage();
  await p.goto(new URL(ROTA, base).href, { waitUntil: ESPERA, timeout: 60000 });
  await p.waitForTimeout(1800);
  // rolar tudo: seção baixa só tem estilo resolvido depois de renderizar
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 800) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 250));
  });
  const r = await p.evaluate((prop) => {
    return [...document.querySelectorAll("*")]
      .map((e) => {
        const v = getComputedStyle(e).getPropertyValue(prop).trim();
        const b = e.getBoundingClientRect();
        return {
          v,
          cid: e.getAttribute("data-cid") ?? null,
          x: Math.round(b.left + window.scrollX),
          y: Math.round(b.top + window.scrollY),
          w: Math.round(b.width),
          h: Math.round(b.height),
        };
      })
      .filter((o) => o.v && o.w > 0 && o.h > 0);
  }, prop);
  await p.close();
  return r;
}

const orig = await ler(ORIGINAL, PROP);
const clone = await ler(CLONE, PROP);
await nav.close();

const divergentes = orig.filter((o) => o.v !== PADRAO);
console.log(`${ROTA} · ${PROP}: ${divergentes.length} elemento(s) com valor != ${PADRAO} no original`);
if (!divergentes.length) {
  console.log("  nada a corrigir nesta rota.");
  process.exit(0);
}

const regras = [];
const naoCasados = [];
for (const o of divergentes) {
  const alvo = clone
    .map((c) => ({ c, erro: Math.abs(c.x - o.x) + Math.abs(c.y - o.y) + Math.abs(c.w - o.w) + Math.abs(c.h - o.h) }))
    .filter((v) => v.erro <= TOL * 4 && v.c.cid)
    .sort((a, b) => a.erro - b.erro)[0];
  if (!alvo) {
    naoCasados.push(o);
    continue;
  }
  if (alvo.c.v === o.v) continue; // já está certo: não reescrever o que não precisa
  regras.push(`[data-cid="${alvo.c.cid}"]{${PROP}:${o.v}}  /* ${o.w}x${o.h} @${o.x},${o.y} · erro=${alvo.erro}px */`);
}

const dirRota = ROTA === "/" ? join(APP, "src", "app") : join(APP, "src", "app", ...ROTA.split("/").filter(Boolean));
if (!existsSync(join(dirRota, "page.tsx"))) {
  console.error(`  a rota ${ROTA} não tem page.tsx — nada a escrever`);
  process.exit(1);
}

if (regras.length && ESCREVER) {
  const css =
    `/* ${ARQUIVO} — \`${PROP}\` medido no original e devolvido ao clone.\n` +
    `   A captura não transcreve esta propriedade; sem ela o navegador usa o\n` +
    `   padrão (${PADRAO}) e o resultado diverge sem que nenhuma medição de\n` +
    `   rota, conteúdo ou geometria de elemento acuse. Nenhum valor foi\n` +
    `   digitado à mão: todos vieram da medição. */\n\n` +
    regras.join("\n") +
    "\n";
  const destino = join(dirRota, ARQUIVO);
  writeFileSync(destino, css, "utf8");
  const pageTsx = join(dirRota, "page.tsx");
  let page = readFileSync(pageTsx, "utf8");
  if (!page.includes(ARQUIVO)) writeFileSync(pageTsx, `import "./${ARQUIVO}";\n` + page, "utf8");
  console.log(`  regras escritas: ${regras.length} -> ${destino}`);
} else {
  console.log(`  regras a escrever: ${regras.length}${ESCREVER ? "" : " (simulado)"}`);
}
if (naoCasados.length) {
  console.log(`  ⚠️ ${naoCasados.length} não casaram por caixa (declarados):`);
  for (const o of naoCasados.slice(0, 5)) console.log(`     ${o.w}x${o.h} @${o.x},${o.y} valor=${o.v}`);
}
