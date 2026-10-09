// corrige-altura-raiz.mjs — o wrapper RAIZ com altura congelada corta o fim da
// página e trava o scroll.
//
// 🚨 Classe de defeito medida no framer-2, e ela só APARECE
// depois que outra correção funciona. O ditto grava a altura do wrapper raiz em
// px (`h-[12490.7px]`) com `overflow: clip`. Enquanto o clone erra as alturas
// internas, o número fecha. No instante em que se devolve altura a uma seção
// (ex.: `corrige-vh-afim` pondo 100vh de volta em 3 seções, +300px), o conteúdo
// cresce e o wrapper NÃO acompanha: os px que sobram são cortados e o documento
// não rola até eles.
//
// Medido na home: rodapé em docY=12501 num documento que rolava até 12491 — os
// links do rodapé ficavam INALCANÇÁVEIS para quem usa o site. E nenhuma medição
// acusava: a caixa do rodapé estava na posição certa (a geometria batia), o
// conteúdo estava no DOM (o texto batia), a rota respondia 200. Só medindo
// `scrollHeight` do documento contra o fundo real dos filhos.
//
// O sintoma que denuncia: alvos do rodapé dando TIMEOUT de hover no Playwright
// porque ele não consegue rolar até eles (13 no clone × 1 no original).
//
// A correção é estrutural e global: liberar a altura do body, do primeiro
// wrapper e do container `min-h-screen`, deixando o conteúdo mandar — que é o
// que o original faz. `min-height` fica, então nada encolhe.
//
// O que o faz SE CALAR:
//   - nenhuma rota com déficit            -> não escreve
//   - a regra já está no CSS              -> não duplica
//   - o original também tem déficit       -> declara, não escreve
//
// Uso:
//   ORIGINAL=... CLONE=http://127.0.0.1:8082 APP=<app> ROTAS=<rotas.json|lista>
//   node corrige-altura-raiz.mjs
//
// Variáveis: ORIGINAL, CLONE, APP (obrigatórias), ROTAS (padrão "/"),
//   CSS_GLOBAL (arquivo onde escrever; padrão src/app/interacao.css),
//   ESCREVER (0 simula), DITTO

import { createRequire } from "node:module";
import { readFileSync, appendFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const ORIGINAL = process.env.ORIGINAL, CLONE = process.env.CLONE, APP = process.env.APP;
if (!ORIGINAL || !CLONE || !APP) { console.error("faltam ORIGINAL/CLONE/APP"); process.exit(1); }
const ESCREVER = process.env.ESCREVER !== "0";
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

function carregarRotas() {
  const bruto = process.env.ROTAS ?? "/";
  if (existsSync(bruto) && statSync(bruto).isFile()) {
    const j = JSON.parse(readFileSync(bruto, "utf8"));
    return (j.rotas ?? j).map((r) => r.rota ?? r).filter((r) => typeof r === "string");
  }
  return bruto.split(",").map((s) => s.trim()).filter(Boolean);
}

const nav = await chromium.launch();

// mede o déficit: o quanto o conteúdo passa do que o documento rola
async function deficit(base, rota) {
  const p = await nav.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(new URL(rota, base).href, { waitUntil: "load", timeout: 60000 });
  await p.waitForTimeout(1800);
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 800) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } scrollTo(0, 0); });
  await p.waitForTimeout(900);
  const d = await p.evaluate(() => {
    let fundoReal = 0;
    for (const el of document.querySelectorAll("body *")) {
      const b = el.getBoundingClientRect();
      if (b.height > 0 && b.width > 0) fundoReal = Math.max(fundoReal, b.bottom + scrollY);
    }
    return { scrollHeight: document.documentElement.scrollHeight, fundoReal: Math.round(fundoReal) };
  });
  await p.close();
  return { ...d, deficit: Math.round(d.fundoReal - d.scrollHeight) };
}

const rotas = carregarRotas();
const comDeficit = [];
for (const rota of rotas) {
  const c = await deficit(CLONE, rota);
  if (c.deficit > 4) {
    const o = await deficit(ORIGINAL, rota);
    if (o.deficit > 4) {
      console.log(`⚠️ ${rota}: o ORIGINAL também tem déficit (${o.deficit}px) — declarado, não escrito`);
    } else {
      console.log(`🚨 ${rota}: déficit de ${c.deficit}px (scroll até ${c.scrollHeight}, conteúdo até ${c.fundoReal}) · original limpo`);
      comDeficit.push({ rota, ...c });
    }
  } else {
    console.log(`   ${rota}: ok (déficit ${c.deficit}px)`);
  }
}
await nav.close();

if (!comDeficit.length) { console.log("\nnenhuma rota com déficit — nada escrito"); process.exit(0); }

const arq = process.env.CSS_GLOBAL ?? join(APP, "src", "app", "interacao.css");
const MARC = "== altura do wrapper RAIZ congelada (corrige-altura-raiz) ==";
const css = existsSync(arq) ? readFileSync(arq, "utf8") : "";
if (css.includes(MARC)) { console.log("\nregra já presente — não duplico"); process.exit(0); }

const bloco =
  `\n/* ${MARC}\n` +
  `   Medido: ${comDeficit.map((d) => `${d.rota} cortava ${d.deficit}px`).join("; ")}.\n` +
  `   O wrapper raiz sai da captura com altura em px e overflow:clip; quando uma\n` +
  `   altura interna é devolvida, o conteúdo cresce e o excedente é CORTADO — o\n` +
  `   documento não rola até o fim e o rodapé fica inalcançável. Liberar a\n` +
  `   altura (min-height permanece) devolve o comportamento do original. */\n` +
  `body,\nbody > div:first-of-type,\nbody > div > div.min-h-screen { height: auto !important; }\n`;

if (ESCREVER) { appendFileSync(arq, bloco); console.log(`\n✅ regra escrita em ${arq} (${comDeficit.length} rota(s) com déficit)`); }
else console.log("\n(simulação)\n" + bloco);
