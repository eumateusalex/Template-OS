// corrige-texto.mjs — alinha o texto do clone ao do original.
//
// Consome o `conteudo.json` do compara-conteudo.mjs e aplica cada divergência
// MEDIDA: onde o original diz X e o clone diz Y na mesma posição, o clone passa
// a dizer X.
//
// 🚨 Nenhum texto é digitado aqui. O par (original, clone) vem da medição. Se
// uma substituição estiver errada, o erro está na medição e é rastreável.
//
// Caso típico que isto conserta: conteúdo que depende da data. Medido no
// site-exemplo — o rodapé do original diz "© 2026 Nome do Dono" e o clone,
// capturado do HTML servido, congelou "© 2025". Mesma posição, texto outro.
//
// ⚠️ O texto costuma estar repetido em VÁRIAS rotas (rodapé e cabeçalho são
// compartilhados). Este instrumento varre `src/app` inteiro, não só a página da
// rota onde a divergência foi medida.
//
// Uso:
//   CONTEUDO=<medicoes>/conteudo/conteudo.json APP=<pasta>/app node corrige-texto.mjs
//
// Variáveis:
//   CONTEUDO  conteudo.json do compara-conteudo.mjs (obrigatória)
//   APP       raiz do app gerado (obrigatória)
//   ESCREVER  "0" para simular sem tocar em arquivo (padrão: escreve)
//   MINIMO    tamanho mínimo do texto para substituir (padrão: 4) — evita
//             trocar fragmento curto e ambíguo

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const CONTEUDO = process.env.CONTEUDO;
const APP = process.env.APP;
if (!CONTEUDO || !APP) {
  console.error("faltam CONTEUDO e/ou APP");
  process.exit(1);
}
const ESCREVER = process.env.ESCREVER !== "0";
const MINIMO = Number(process.env.MINIMO ?? 4);
const RAIZ = join(resolve(APP), "src", "app");

if (!existsSync(RAIZ)) {
  console.error(`não achei src/app em ${APP}`);
  process.exit(1);
}

/** Todos os .tsx e .ts sob src/app. */
function arquivos(dir, acc = []) {
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    const s = statSync(p);
    if (s.isDirectory()) arquivos(p, acc);
    else if (/\.tsx?$/.test(nome)) acc.push(p);
  }
  return acc;
}

const medicao = JSON.parse(readFileSync(CONTEUDO, "utf8"));

// Juntar as divergências de todas as rotas: o mesmo par costuma repetir, porque
// rodapé e cabeçalho são compartilhados.
const pares = new Map(); // clone -> original
for (const linha of medicao.linhas ?? []) {
  for (const d of linha.textoDivergente ?? []) {
    if (!d.clone || !d.original) continue;
    if (d.clone.length < MINIMO) continue;
    if (d.clone === d.original) continue;
    pares.set(d.clone, d.original);
  }
}

console.log(`divergências distintas medidas: ${pares.size}`);
if (!pares.size) {
  console.log("nada a corrigir");
  process.exit(0);
}
for (const [de, para] of pares) {
  console.log(`  "${de.slice(0, 60)}"`);
  console.log(`    -> "${para.slice(0, 60)}"`);
}

const lista = arquivos(RAIZ);
let tocados = 0;
let trocas = 0;
const naoAchados = new Map([...pares.keys()].map((k) => [k, true]));

for (const arquivo of lista) {
  const fonte = readFileSync(arquivo, "utf8");
  let novo = fonte;
  for (const [de, para] of pares) {
    if (!novo.includes(de)) continue;
    naoAchados.delete(de);
    // ⚠️ split/join, NUNCA String.replace com o texto no padrão de
    // substituição: `$1`, `$&` e `$'` dentro do texto viram referência de
    // captura e corrompem o arquivo em silêncio.
    const partes = novo.split(de);
    trocas += partes.length - 1;
    novo = partes.join(para);
  }
  if (novo !== fonte) {
    if (ESCREVER) writeFileSync(arquivo, novo, "utf8");
    tocados++;
  }
}

console.log(`\n${ESCREVER ? "aplicado" : "SIMULADO"}: ${trocas} troca(s) em ${tocados} arquivo(s)`);
if (naoAchados.size) {
  console.log(`⚠️ ${naoAchados.size} texto(s) medido(s) NÃO encontrado(s) no código — declarados, não silenciados:`);
  for (const t of naoAchados.keys()) console.log(`   "${t.slice(0, 70)}"`);
  console.log(`   (o texto pode estar quebrado em pedaços no JSX, ou vir de dado, não de literal)`);
}
process.exitCode = naoAchados.size ? 1 : 0;
