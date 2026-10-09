// corrige-svg-path.mjs — conserta o atributo `d` de SVG que a captura quebrou.
//
// 🚨 O DEFEITO (medido no site-next):
//
//   d="M 15.899999999999999 138\n                       L 15.899999999999999 38.5\n ..."
//
// O ditto preserva a quebra de linha do HTML de origem como a SEQUÊNCIA
// LITERAL `\n` dentro da string JSX. Em SVG, quebra de linha de verdade é
// separador válido; a sequência `\` + `n` **não é**, e o parser aborta:
//
//   Error: <path> attribute d: Expected path command, "…999999999999 138\n…"
//
// Efeito: o caminho não desenha. Medido na home do clone: **5 erros de
// console**, contra **0** no original.
//
// 🚨 Não é acusado por nenhuma medição da skill: rota responde, título bate,
// conteúdo bate, geometria do elemento é a mesma (o <svg> ocupa o espaço), e a
// animação aplica. O que falha é o DESENHO dentro do SVG — só o console do
// navegador e o olho pegam.
//
// O conserto é textual: dentro de `d="..."`, todo `\n` (e `\r`, `\t`) vira
// espaço. Não toca em mais nada — nem em outro atributo, nem fora de SVG.
//
// Uso:
//   APP=<pasta>/app node corrige-svg-path.mjs
//
// Variáveis:
//   APP       raiz do app gerado (obrigatória)
//   ESCREVER  "0" para simular (padrão: escreve)

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, relative } from "node:path";

const APP = process.env.APP;
if (!APP) {
  console.error("falta APP");
  process.exit(1);
}
const ESCREVER = process.env.ESCREVER !== "0";
const raiz = resolve(APP, "src");

function arquivos(dir) {
  const saida = [];
  for (const nome of readdirSync(dir)) {
    const abs = join(dir, nome);
    if (statSync(abs).isDirectory()) saida.push(...arquivos(abs));
    else if (/\.(tsx|jsx)$/.test(nome)) saida.push(abs);
  }
  return saida;
}

let arquivosTocados = 0;
let atributos = 0;
const detalhe = [];

for (const arq of arquivos(raiz)) {
  const antes = readFileSync(arq, "utf8");
  if (!antes.includes('d="')) continue;

  let n = 0;
  // só dentro de d="...": troca a sequência literal \n \r \t por espaço,
  // e depois colapsa a corrida de espaços que sobra.
  const depois = antes.replace(/d="([^"]*)"/g, (todo, valor) => {
    if (!/\\[nrt]/.test(valor)) return todo;
    n++;
    const limpo = valor.replace(/\\[nrt]/g, " ").replace(/\s{2,}/g, " ").trim();
    return `d="${limpo}"`;
  });

  if (n) {
    if (ESCREVER) writeFileSync(arq, depois, "utf8");
    arquivosTocados++;
    atributos += n;
    detalhe.push(`${relative(raiz, arq).replace(/\\/g, "/")}: ${n}`);
  }
}

console.log(`atributos d= consertados: ${atributos} em ${arquivosTocados} arquivo(s)${ESCREVER ? "" : " (simulado)"}`);
for (const d of detalhe.slice(0, 12)) console.log(`  ${d}`);
if (detalhe.length > 12) console.log(`  … e mais ${detalhe.length - 12}`);
if (!atributos) console.log("nada a fazer: nenhum `d=` com quebra de linha literal.");
