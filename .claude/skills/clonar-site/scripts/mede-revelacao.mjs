// mede-revelacao.mjs — quem está ABAIXO DA DOBRA já apareceu, ou espera o scroll?
//
// 🚨 Por que existe: nem contagem de animação nem geometria respondem isso, e
// as duas levam à conclusão ERRADA (medido no framer-6):
//
//   · Fonte C (geometria durante o scroll) dá 0 elementos mexendo. Mas
//     revelação por `opacity` NÃO MOVE NADA — a fonte é cega para ela.
//   · Fonte A (WAAPI) dá 0 "animações novas depois do scroll". Mas o Framer
//     CRIA todas as animações no load e só as TOCA quando o elemento entra na
//     tela: não há animação nova, há animação parada esperando.
//
//   As duas dizem "este site não tem comportamento de scroll". Errado.
//   Medindo o ESTILO COMPUTADO de quem está abaixo da dobra, parado no topo,
//   depois de assentar: 1711 ocultos contra 1487 visíveis.
//
// O que ele faz: carrega, NÃO rola, espera assentar (ASSENTAR ms, bem além do
// maior atraso de entrada), e conta quem está oculto (`opacity` < LIMIAR)
// separando acima e abaixo da dobra.
//
// Rodar nos DOIS lados: no original para saber o que existe, no clone para
// provar que a revelação foi reconstruída. Os dois números têm que bater.
//
// 🚨 O guard: ele não escreve nada em lugar nenhum. É medidor puro — só relata
// e devolve exit 1 se ORIGINAL e CLONE divergirem além de TOL.
//
// Uso:
//   SITE=<url> node mede-revelacao.mjs                    # um lado só
//   ORIGINAL=<url> CLONE=<url> ROTA=/ node mede-revelacao.mjs   # compara
//
// Variáveis:
//   SITE      lado único a medir (ou use ORIGINAL+CLONE)
//   ORIGINAL  URL base do original
//   CLONE     URL base do clone servido
//   ROTA      rota (padrão: /)
//   LARGURA   viewport (padrão: 1280)
//   ASSENTAR  ms de espera parado no topo (padrão: 6000)
//   LIMIAR    opacity abaixo da qual conta como oculto (padrão: 0.5)
//   TOL       divergência tolerada na proporção de ocultos (padrão: 0.15 = 15%)
//   SAIDA     pasta do relatório (opcional)
//   DITTO     raiz do ditto (padrão: C:/dev/ditto)

import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROTA = process.env.ROTA ?? "/";
const LARGURA = Number(process.env.LARGURA ?? 1280);
const ASSENTAR = Number(process.env.ASSENTAR ?? 6000);
const LIMIAR = Number(process.env.LIMIAR ?? 0.5);
const TOL = Number(process.env.TOL ?? 0.15);
// DUMP=1 grava a identidade de CADA oculto abaixo da dobra (caixa + texto +
// cid), que é o insumo para casar os dois lados e gerar o que falta.
const DUMP = process.env.DUMP === "1";
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
const SAIDA = process.env.SAIDA ? resolve(process.env.SAIDA) : null;

const lados = [];
if (process.env.SITE) lados.push(["site", process.env.SITE]);
if (process.env.ORIGINAL) lados.push(["original", process.env.ORIGINAL]);
if (process.env.CLONE) lados.push(["clone", process.env.CLONE]);
if (!lados.length) {
  console.error("faltam SITE, ou ORIGINAL e CLONE");
  process.exit(1);
}

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

async function medir(base) {
  const navegador = await chromium.launch();
  const ctx = await navegador.newContext({ viewport: { width: LARGURA, height: 900 } });
  const page = await ctx.newPage();
  const url = new URL(ROTA, base).href;
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  } catch {
    try { await page.goto(url, { waitUntil: "load", timeout: 45000 }); } catch { /* segue */ }
  }
  // 🚨 NÃO rolar. A pergunta é o estado em repouso no topo.
  await page.waitForTimeout(ASSENTAR);
  const r = await page.evaluate(([lim, dump]) => {
    const vh = innerHeight;
    const o = { acima: { visivel: 0, oculto: 0 }, abaixo: { visivel: 0, oculto: 0 }, amostra: [], ocultos: [] };
    for (const el of document.querySelectorAll("div,section,p,h1,h2,h3,h4,img,span,a,li")) {
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) continue;
      const op = parseFloat(getComputedStyle(el).opacity);
      const oculto = op < lim;
      const onde = b.top < vh ? "acima" : "abaixo";
      o[onde][oculto ? "oculto" : "visivel"]++;
      if (oculto && onde === "abaixo" && o.amostra.length < 5) {
        o.amostra.push({ tag: el.tagName, y: Math.round(b.top + scrollY), opacity: op, texto: (el.textContent || "").trim().slice(0, 30) });
      }
      // DUMP: identidade de CADA oculto abaixo da dobra, para casar entre lados
      if (dump && oculto && onde === "abaixo") {
        o.ocultos.push({
          tag: el.tagName,
          x: Math.round(b.left + scrollX), y: Math.round(b.top + scrollY),
          w: Math.round(b.width), h: Math.round(b.height),
          opacity: op,
          texto: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40),
          cid: el.getAttribute("data-cid") || null,
        });
      }
    }
    return o;
  }, [LIMIAR, DUMP]);
  await navegador.close();
  const totalAbaixo = r.abaixo.visivel + r.abaixo.oculto;
  r.proporcaoOcultosAbaixo = totalAbaixo ? r.abaixo.oculto / totalAbaixo : 0;
  return r;
}

const res = {};
for (const [nome, base] of lados) {
  res[nome] = await medir(base);
  const x = res[nome];
  console.log(`\n${nome.toUpperCase()}  ${new URL(ROTA, base).href}`);
  console.log(`  acima da dobra:  ${x.acima.visivel} visíveis · ${x.acima.oculto} ocultos`);
  console.log(`  abaixo da dobra: ${x.abaixo.visivel} visíveis · ${x.abaixo.oculto} ocultos` +
    `  (ocultos = ${(x.proporcaoOcultosAbaixo * 100).toFixed(1)}%)`);
  if (x.amostra.length) {
    console.log(`  amostra de ocultos:`);
    for (const a of x.amostra) console.log(`    ${a.tag} @y=${a.y} opacity=${a.opacity} "${a.texto}"`);
  }
}

let exit = 0;
if (res.original && res.clone) {
  const d = Math.abs(res.original.proporcaoOcultosAbaixo - res.clone.proporcaoOcultosAbaixo);
  console.log(`\n=== revelação: original × clone ===`);
  console.log(`  ocultos abaixo da dobra — original ${(res.original.proporcaoOcultosAbaixo * 100).toFixed(1)}%` +
    ` · clone ${(res.clone.proporcaoOcultosAbaixo * 100).toFixed(1)}%  ·  Δ=${(d * 100).toFixed(1)} pontos`);
  if (d <= TOL) console.log(`  ✅ dentro da tolerância (${(TOL * 100).toFixed(0)} pontos)`);
  else { console.log(`  ❌ FORA da tolerância (${(TOL * 100).toFixed(0)} pontos)`); exit = 1; }
}

if (SAIDA) {
  mkdirSync(SAIDA, { recursive: true });
  writeFileSync(join(SAIDA, "revelacao.json"), JSON.stringify({ gerado: new Date().toISOString(), rota: ROTA, largura: LARGURA, assentar: ASSENTAR, limiar: LIMIAR, ...res }, null, 1));
}
process.exitCode = exit;
