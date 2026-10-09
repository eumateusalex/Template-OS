// confere-entrada.mjs — cada regra que eu escrevi realmente APLICOU?
//
// 🚨 O gate que fecha o buraco entre "gerei o CSS" e "o navegador obedeceu".
// Escrever a regra não garante que ela sobreviva ao build: um minificador pode
// invalidar a declaração e o navegador a descarta CALADO — sem erro no build,
// sem erro no console, sem nada.
//
// O minificador do Next pode cortar o `%` do primeiro stop de `linear()`: a
// função fica inválida, o elemento para de animar e o build passa em exit 0.
// Só um instrumento como este acusa.
//
// Compara o que o CSS FONTE promete com o que o navegador ENTREGA no build.
//
// Uso:
//   CSS=<app>/src/app/entrada.css CLONE=http://127.0.0.1:8081 ROTA=/ \
//   node confere-entrada.mjs
//
// Variáveis:
//   CSS    caminho do entrada.css da rota (obrigatória)
//   CLONE  URL base do clone servido (obrigatória)
//   ROTA   rota a conferir (padrão: /)
//   DITTO  raiz do ditto (padrão: C:/dev/ditto)

import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";

const CSS = process.env.CSS;
const CLONE = process.env.CLONE;
if (!CSS || !CLONE) {
  console.error("faltam CSS e/ou CLONE");
  process.exit(1);
}
const ROTA = process.env.ROTA ?? "/";
const DITTO = process.env.DITTO ?? "C:/dev/ditto";

if (!existsSync(CSS)) {
  console.error(`CSS não existe: ${CSS}`);
  process.exit(1);
}

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

const css = readFileSync(CSS, "utf8");
// O que o fonte promete: cid -> nome da animação declarada.
const prometidos = [...css.matchAll(/^\[data-cid="([^"]+)"\]\{animation:([A-Za-z][\w-]*)/gm)].map((m) => ({
  cid: m[1],
  animacao: m[2],
}));

if (!prometidos.length) {
  console.error("nenhuma regra encontrada no CSS — nada a conferir");
  process.exit(1);
}
console.log(`o CSS promete ${prometidos.length} elemento(s) animado(s) em ${ROTA}`);

const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.goto(new URL(ROTA, CLONE).href + "?_v=" + Date.now(), { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(300);

const entregues = await page.evaluate((prometidos) => {
  return prometidos.map((p) => {
    const els = document.querySelectorAll(`[data-cid="${p.cid}"]`);
    const el = els[0];
    if (!el) return { ...p, existe: 0, ocorrencias: 0, aplicou: false, animacaoReal: "", motivo: "elemento não existe nesta rota" };
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const aplicou = cs.animationName === p.animacao;
    return {
      ...p,
      existe: 1,
      // ⚠️ data-cid COLIDE entre rotas; mais de uma ocorrência na MESMA rota
      // significa seletor ambíguo, e a regra pega em elemento errado.
      ocorrencias: els.length,
      aplicou,
      animacaoReal: cs.animationName,
      visivel: r.width > 0 && r.height > 0,
      motivo: aplicou
        ? ""
        : cs.animationName === "none"
          ? "declaração descartada pelo navegador (regra inválida depois do build?)"
          : `animação diferente da prometida: ${cs.animationName}`,
    };
  });
}, prometidos);

await navegador.close();

const ok = entregues.filter((x) => x.aplicou);
const falhas = entregues.filter((x) => !x.aplicou);
const ambiguos = entregues.filter((x) => x.ocorrencias > 1);

for (const x of entregues) {
  console.log(
    `  ${(x.aplicou ? "ok" : "FALHA").padEnd(5)} ${x.cid.padEnd(7)} ${x.animacao}` +
      (x.aplicou ? "" : `  <- ${x.motivo}`),
  );
}

console.log(`\naplicaram: ${ok.length}/${entregues.length}`);
if (ambiguos.length) {
  console.log(`⚠️ ${ambiguos.length} cid(s) com MAIS DE UMA ocorrência nesta rota — seletor ambíguo:`);
  for (const x of ambiguos) console.log(`   ${x.cid}: ${x.ocorrencias} elementos`);
}
if (falhas.length) {
  console.log(`\n🚨 ${falhas.length} regra(s) NÃO aplicaram. Isso não é aviso, é reprovação.`);
  console.log(`   Suspeito número 1: o minificador invalidou a declaração no build.`);
  console.log(`   Conferir a regra no CSS gerado dentro de out/_next/static/css/.`);
}

process.exitCode = falhas.length ? 1 : 0;
