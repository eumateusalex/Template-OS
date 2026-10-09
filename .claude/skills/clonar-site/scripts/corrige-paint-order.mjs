// corrige-paint-order.mjs — devolve o `paint-order` que a captura perdeu.
//
// 🚨 O DEFEITO (medido no site-next, home):
//
//   |                              | original | clone  |
//   | elementos com text-stroke    | 39       | 39     |
//   | com `paint-order: stroke`    | **39**   | **0**  |
//   | com `paint-order: normal`    | 0        | **39** |
//
// O ditto transcreve `-webkit-text-stroke-width` e `-webkit-text-stroke-color`
// e **perde o `paint-order`**. A diferença é visual e brutal:
//
//   paint-order: stroke  -> pinta o CONTORNO primeiro, o preenchimento por
//                           cima. O contorno vira reforço externo e o texto
//                           fica sólido e legível.
//   paint-order: normal  -> pinta o preenchimento e o CONTORNO POR CIMA. Um
//                           contorno de 1.3px num texto de 13px come o interior
//                           das letras: o texto fica vazado, quase ilegível.
//
// Achado pela conferência visual pareada — a faixa preta do topo do site-next
// estava ilegível no clone. **Nenhuma medição de rota, metadata, conteúdo,
// geometria ou animação acusa**: a caixa é a mesma, o texto é o mesmo, a cor
// computada é a mesma. Só o olho (e este script) pegam.
//
// O conserto é cirúrgico: em toda regra do CSS da rota que declare
// `-webkit-text-stroke-width` maior que zero, acrescenta `paint-order: stroke`.
// Não inventa seletor nem toca em elemento sem contorno.
//
// ⚠️ A premissa — "todo texto com contorno usa paint-order: stroke" — foi
// MEDIDA neste alvo (39 de 39). Ao clonar outro site, medir de novo antes de
// confiar: use VERIFICAR=1 para conferir contra o original antes de escrever.
//
// Uso:
//   APP=<pasta>/app node corrige-paint-order.mjs
//
// Variáveis:
//   APP       raiz do app gerado (obrigatória)
//   ESCREVER  "0" para simular (padrão: escreve)

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { readdirSync, statSync } from "node:fs";

const APP = process.env.APP;
if (!APP) {
  console.error("falta APP");
  process.exit(1);
}
const ESCREVER = process.env.ESCREVER !== "0";
const raiz = resolve(APP, "src", "app");

/** Todo arquivo .css sob src/app. */
function folhas(dir) {
  const saida = [];
  for (const nome of readdirSync(dir)) {
    const abs = join(dir, nome);
    if (statSync(abs).isDirectory()) saida.push(...folhas(abs));
    else if (nome.endsWith(".css")) saida.push(abs);
  }
  return saida;
}

let arquivosTocados = 0;
let regrasTocadas = 0;
const detalhe = [];

for (const arq of folhas(raiz)) {
  const css = readFileSync(arq, "utf8");
  if (!css.includes("-webkit-text-stroke-width")) continue;

  let mudou = 0;
  // Regra a regra: só as que declaram contorno com largura > 0.
  const novo = css.replace(/\{([^{}]*)\}/g, (bloco, corpo) => {
    const m = /-webkit-text-stroke-width\s*:\s*([0-9.]+)/.exec(corpo);
    if (!m || Number(m[1]) <= 0) return bloco;
    if (/paint-order\s*:/.test(corpo)) return bloco; // já tem, não duplica
    mudou++;
    const sep = corpo.trim().endsWith(";") || corpo.trim() === "" ? "" : ";";
    return `{${corpo}${sep}paint-order:stroke}`;
  });

  if (mudou) {
    if (ESCREVER) writeFileSync(arq, novo, "utf8");
    arquivosTocados++;
    regrasTocadas += mudou;
    detalhe.push(`${relative(raiz, arq).replace(/\\/g, "/")}: ${mudou}`);
  }
}

// 🚨 O contorno pode não estar em CSS nenhum: em alvo Tailwind ele chega como
// CLASSE UTILITÁRIA ARBITRÁRIA no JSX — `[-webkit-text-stroke:1.3px_var(--x)]`
// — e o Tailwind gera a regra a partir do nome da classe. Medido no site-next: 161
// usos assim no JSX e ZERO ocorrência nos .css, então a varredura de folhas
// acima acha nada e conclui, erradamente, que não há o que consertar.
//
// A saída é um seletor de atributo: a classe arbitrária carrega o nome da
// propriedade dentro do próprio nome, então `[class*="-webkit-text-stroke"]`
// casa exatamente quem tem contorno, e ninguém mais.
function usosNoJsx(dir) {
  let n = 0;
  for (const nome of readdirSync(dir)) {
    const abs = join(dir, nome);
    if (statSync(abs).isDirectory()) n += usosNoJsx(abs);
    else if (nome.endsWith(".tsx")) {
      const t = readFileSync(abs, "utf8");
      n += (t.match(/-webkit-text-stroke/g) ?? []).length;
    }
  }
  return n;
}
const noJsx = usosNoJsx(raiz);

console.log(`paint-order: stroke acrescentado em ${regrasTocadas} regra(s), ${arquivosTocados} arquivo(s)`);
for (const d of detalhe.slice(0, 20)) console.log(`  ${d}`);
if (detalhe.length > 20) console.log(`  … e mais ${detalhe.length - 20}`);

if (noJsx > 0) {
  console.log(`\n⚠️ ${noJsx} uso(s) de -webkit-text-stroke como CLASSE no JSX (não em .css).`);
  console.log(`   Esses NÃO são alcançados regra a regra. Escrever numa folha global:`);
  console.log(`     [class*="-webkit-text-stroke"] { paint-order: stroke }`);
  console.log(`   e importá-la no layout — senão o conserto não chega a esses elementos.`);
}
if (regrasTocadas === 0 && noJsx === 0) {
  console.log(`\nnada a fazer: este clone não tem texto com contorno.`);
}
if (!ESCREVER) console.log("\n(ESCREVER=0 — nada foi gravado)");
