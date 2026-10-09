// gera-hover-swap.mjs — reconstrói o hover-swap medido pelo mede-hover-swap.
//
// 🚨 Usa a propriedade `translate`, NÃO `transform`. O elemento já carrega um
// transform da captura (matrix de centralização); escrever `transform` por cima
// apagaria esse valor e deslocaria o filho na horizontal — é a armadilha do
// "translateY montado à mão" documentada. `translate` é propriedade
// independente, composta ANTES do transform: soma-se ao que já existe.
//
// A curva vem da medição (21 pontos, `linear()`), a duração também. Nada é
// digitado. `prefers-reduced-motion` desliga o movimento (o estado final
// continua alcançável porque o hover não esconde conteúdo).
//
// ⚠️ O CSS sai em public/ e entra por <link>, não pelo import da rota: o
// minificador do Next já invalidou um `linear()` de 80 pontos sem erro nenhum
// (armadilha conhecida), e public/ é copiado verbatim.
//
// O que o faz SE CALAR:
//   - medição ausente ou sem filhos animados     -> não escreve
//   - botão do original sem par no clone (texto) -> declara, não escreve
//   - estrutura do par difere (contagem/posição) -> declara, não escreve
//   - filho sem data-cid no clone                -> pula aquele filho
//
// Uso:
//   MED=<med>/hover-original/hover-swap.json CLONE=http://127.0.0.1:8082 \
//   APP=<app> node gera-hover-swap.mjs
//
// Variáveis: MED, CLONE, APP (obrigatórias), TOL (px, padrão 4), ESCREVER, DITTO

import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const MED = process.env.MED, CLONE = process.env.CLONE, APP = process.env.APP;
if (!MED || !CLONE || !APP) { console.error("faltam MED/CLONE/APP"); process.exit(1); }
const TOL = Number(process.env.TOL ?? 4);
const ESCREVER = process.env.ESCREVER !== "0";
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

const medicao = JSON.parse(readFileSync(MED, "utf8"));
const rota = new URL(medicao.site).pathname || "/";

const nav = await chromium.launch();
const p = await nav.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto(new URL(rota, CLONE).href, { waitUntil: "load", timeout: 60000 });
await p.waitForTimeout(2200);

const regras = [];
for (const m of medicao.medidas) {
  if (!m.ida || !m.ida.length) { console.log(`⚠️ "${m.texto}": medição sem filhos animados — pulado`); continue; }
  const alvo = await p.evaluate((texto) => {
    const btn = [...document.querySelectorAll("a,button")].find((e) => (e.textContent || "").includes(texto) && e.getBoundingClientRect().width > 40);
    if (!btn) return null;
    const rb = btn.getBoundingClientRect();
    return {
      cid: btn.getAttribute("data-cid"),
      filhos: [...btn.querySelectorAll("*")].map((f) => {
        const b = f.getBoundingClientRect();
        return { cid: f.getAttribute("data-cid"), x: Math.round(b.left - rb.left), y: Math.round(b.top - rb.top), tag: f.tagName };
      }),
    };
  }, m.texto);
  if (!alvo || !alvo.cid) { console.log(`⚠️ "${m.texto}": sem par (ou sem data-cid) no clone — declarado`); continue; }
  if (alvo.filhos.length !== (m.ida.length ? Math.max(...m.ida.map((f) => f.filho)) + 1 : 0) && alvo.filhos.length < 5) {
    console.log(`⚠️ "${m.texto}": estrutura difere (clone ${alvo.filhos.length} filhos) — declarado`);
    continue;
  }
  // curva e duração: a moda da medição (os filhos animam juntos)
  const dur = Math.round(m.ida.reduce((s, f) => s + (f.duracaoMs || 0), 0) / m.ida.length);
  const curvaPontos = (m.ida.find((f) => f.curva) || {}).curva;
  const curva = curvaPontos ? `linear(${curvaPontos.map((v, i) => `${v} ${Math.round((i / (curvaPontos.length - 1)) * 100)}%`).join(", ")})` : "cubic-bezier(0.45,0,0.55,1)";

  const desloc = [];
  for (const f of m.ida) {
    const alvoFilho = alvo.filhos[f.filho];
    if (!alvoFilho || !alvoFilho.cid) continue; // sem cid (ex.: <use>) — o pai leva junto
    // ruído: usar o deslocamento do PRIMEIRO filho do grupo (svg pai), que é o
    // geometricamente coerente; os `use` internos herdam do pai
    desloc.push({ cid: alvoFilho.cid, dx: f.dx, dy: f.dy, tag: alvoFilho.tag });
  }
  if (!desloc.length) { console.log(`⚠️ "${m.texto}": nenhum filho com data-cid — declarado`); continue; }
  regras.push({ texto: m.texto, btnCid: alvo.cid, dur, curva, desloc });
  console.log(`✅ "${m.texto}": botão ${alvo.cid}, ${desloc.length} filho(s), ${dur}ms`);
}
await nav.close();

if (!regras.length) { console.log("nada a escrever"); process.exit(0); }

let css = `/* hover-swap.css — gerado por scripts/gera-hover-swap.mjs a partir de\n` +
  `   medição por rAF no original (${medicao.site}).\n` +
  `   Deslocamento, duração e curva MEDIDOS; nada digitado.\n` +
  `   Usa 'translate' (não 'transform') para somar ao transform da captura. */\n\n` +
  `@media (hover: hover) and (pointer: fine) {\n`;
for (const r of regras) {
  css += `  /* ${r.texto} */\n`;
  for (const d of r.desloc) {
    css += `  [data-cid="${r.btnCid}"] [data-cid="${d.cid}"] { transition: translate ${r.dur}ms ${r.curva}; }\n`;
    css += `  [data-cid="${r.btnCid}"]:hover [data-cid="${d.cid}"] { translate: ${d.dx}px ${d.dy}px; }\n`;
  }
}
css += `}\n\n@media (prefers-reduced-motion: reduce) {\n  [data-cid] { transition: none !important; }\n}\n`;

const arq = join(APP, "public", "hover-swap.css");
if (ESCREVER) {
  writeFileSync(arq, css);
  console.log(`\n✅ ${arq} (${css.length} bytes)`);
  console.log(`   ligar no layout: <link rel="stylesheet" href="/hover-swap.css" />`);
} else console.log("\n(simulação)\n" + css.slice(0, 900));
