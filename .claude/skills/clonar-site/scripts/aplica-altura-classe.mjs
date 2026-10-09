// aplica-altura-classe.mjs — entrega as alturas medidas pelo corrige-viewport
// COMO CLASSE do Tailwind, no JSX, em vez de regra CSS.
//
// 🚨 Por que existe (medido no framer-4): a regra
// `[data-cid="n92"][data-cid]{height:100vh !important}` estava na folha
// servida, dentro de uma @media comprovadamente ativa, com o seletor casando
// (`el.matches` deu true) e a folha parseada e viva — e o navegador
// simplesmente NÃO a considerava. O `CSS.getMatchedStylesForNode` do CDP
// listou UMA declaração de `height` casando com o elemento: a `.h-200` do
// Tailwind, dentro de `@layer utilities`. A nossa não aparecia na lista.
//
// O detalhe que fecha o diagnóstico: a regra de LARGURA do
// corrige-largura-secao (`width:100%`, sem !important, na mesma entrega)
// aplicou sem problema — porque não disputava com nenhuma utilitária. Só
// perde quem compete com uma classe do Tailwind.
//
// Como o clone JÁ é construído com Tailwind, a entrega que sempre vence é
// escrever a altura como classe no próprio elemento: ela nasce dentro de
// `@layer utilities`, na mesma disputa, e a variante mais específica ganha.
//
// O método, por rota:
//   1. lê o `viewport.css` da rota (escrito pelo corrige-viewport) e colhe os
//      pares data-cid → altura medida (ex.: 96vh);
//   2. acha o elemento no `page.tsx` pelo `data-cid`;
//   3. insere `lg:h-[<altura>]` no início do className — `lg:` porque a
//      medição foi feita em 1280px e a regra original vivia dentro de
//      `@media (min-width: 1024px)`;
//   4. NÃO remove a classe antiga: ela segue valendo abaixo de 1024px, que é
//      onde a captura mobile já estava certa.
//
// O que o faz SE CALAR:
//   - sem viewport.css na rota                  -> nada a fazer
//   - data-cid não achado no page.tsx           -> declara, não escreve
//   - className não achado no elemento          -> declara, não escreve
//   - a classe `lg:h-[...]` já está lá          -> pula (idempotente)
//
// Uso:
//   APP=<app> ROTAS=<med>/rotas.json node aplica-altura-classe.mjs
//   ESCREVER=0 simula

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const APP = process.env.APP;
if (!APP) {
  console.error("falta APP=<pasta do app>");
  process.exit(1);
}
const ESCREVER = process.env.ESCREVER !== "0";
const FAIXA = process.env.FAIXA ?? "lg";

function rotas() {
  if (process.env.ROTAS) {
    const j = JSON.parse(readFileSync(process.env.ROTAS, "utf8"));
    const lista = Array.isArray(j) ? j : (j.rotas ?? []);
    return lista
      .map((r) => (typeof r === "string" ? r : (r.rota ?? r.caminho)))
      .filter((r) => typeof r === "string" && r !== "/404");
  }
  return [process.env.ROTA ?? "/"];
}

// A home pode ter mudado para um grupo de rotas (ver entrega-inline).
function pastaDaRota(rota) {
  if (rota !== "/") return join(APP, "src/app", rota.replace(/^\//, ""));
  const grupo = join(APP, "src/app", "(inicio)");
  return existsSync(join(grupo, "page.tsx")) ? grupo : join(APP, "src/app");
}

let totalAplicadas = 0;
const declaradas = [];

for (const rota of rotas()) {
  const dir = pastaDaRota(rota);
  const cssPath = join(dir, "viewport.css");
  const pagePath = join(dir, "page.tsx");
  if (!existsSync(cssPath) || !existsSync(pagePath)) continue;

  const css = readFileSync(cssPath, "utf8");
  const regras = [...css.matchAll(/\[data-cid="([^"]+)"\]\[data-cid\]\{height:([^;!}]+)/g)].map((m) => ({
    cid: m[1],
    altura: m[2].trim(),
  }));
  if (!regras.length) continue;

  let jsx = readFileSync(pagePath, "utf8");
  const aplicadas = [];

  for (const { cid, altura } of regras) {
    const classeNova = `${FAIXA}:h-[${altura}]`;
    if (jsx.includes(classeNova)) {
      aplicadas.push({ cid, altura, nota: "já estava" });
      continue;
    }
    // achar o className do elemento que carrega este data-cid
    const alvo = new RegExp(`className="([^"]*)"([^>]*?)data-cid="${cid}"`);
    const m = jsx.match(alvo);
    if (!m) {
      declaradas.push({ rota, motivo: `${cid}: não achei className+data-cid no page.tsx` });
      continue;
    }
    const antes = m[0];
    const depois = antes.replace(`className="${m[1]}"`, `className="${classeNova} ${m[1]}"`);
    jsx = jsx.replace(antes, depois);
    aplicadas.push({ cid, altura, nota: "aplicada" });
  }

  if (!aplicadas.length) continue;
  if (ESCREVER) writeFileSync(pagePath, jsx, "utf8");
  console.log(`\n=== ${rota}`);
  for (const a of aplicadas) console.log(`   ${a.nota === "aplicada" ? "✅" : "•"} ${a.cid} -> ${FAIXA}:h-[${a.altura}]  (${a.nota})`);
  totalAplicadas += aplicadas.filter((a) => a.nota === "aplicada").length;
}

console.log(`\n${"=".repeat(70)}`);
console.log(`TOTAL: ${totalAplicadas} altura(s) entregue(s) como classe${ESCREVER ? "" : " (simulado)"}`);
if (declaradas.length) {
  console.log(`\n⚠️ ${declaradas.length} declaração(ões):`);
  for (const d of declaradas) console.log(`   ${d.rota}: ${d.motivo}`);
}
console.log("🚨 rebuildar — escrever a classe não é aplicar.");
