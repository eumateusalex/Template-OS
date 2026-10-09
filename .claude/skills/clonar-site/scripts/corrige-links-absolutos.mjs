// corrige-links-absolutos.mjs — faz o clone navegar EM SI MESMO.
//
// 🚨 O DEFEITO (medido no site-next):
//
//   href="https://<domínio-do-original>/customers"   ← 8655 ocorrências, 233 páginas
//
// O ditto materializa link interno como URL ABSOLUTA apontando para o site
// ORIGINAL. O clone abre, renderiza igual, passa em cobertura, metadata,
// geometria, conteúdo e no gate de animação — e **no primeiro clique manda o
// visitante para fora**, para o site que se estava clonando.
//
// É o defeito mais grave desta classe porque não parece defeito: o link
// funciona, leva a uma página que existe, e o texto está certo. Só que não é o
// clone.
//
// 🚨 E o `NavegacaoClient` NÃO salva: ele intercepta absoluto só quando o
// origin bate com o da página. `https://<domínio-do-original>` nunca bate com
// `127.0.0.1:8081`, então o clique passa direto.
//
// O conserto é textual e mecânico: todo `href="<ORIGEM>/caminho"` vira
// `href="/caminho"`. Link para OUTRO host não se toca — é link externo de
// verdade, e o original também o tem.
//
// Uso:
//   APP=<pasta>/app ORIGEM=https://<domínio-do-original> node corrige-links-absolutos.mjs
//
// Variáveis:
//   APP       raiz do app gerado (obrigatória)
//   ORIGEM    origem do site original, sem barra final (obrigatória)
//   ESCREVER  "0" para simular (padrão: escreve)

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, relative } from "node:path";

const APP = process.env.APP;
const ORIGEM = (process.env.ORIGEM ?? "").replace(/\/+$/, "");
if (!APP || !ORIGEM) {
  console.error("faltam APP e/ou ORIGEM");
  process.exit(1);
}
const ESCREVER = process.env.ESCREVER !== "0";
const raiz = resolve(APP, "src");

function arquivos(dir) {
  const saida = [];
  for (const nome of readdirSync(dir)) {
    const abs = join(dir, nome);
    if (statSync(abs).isDirectory()) saida.push(...arquivos(abs));
    else if (/\.(tsx|ts|jsx|js)$/.test(nome)) saida.push(abs);
  }
  return saida;
}

const escapada = ORIGEM.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// href="<origem>/algo" e href="<origem>" (a home)
const reComCaminho = new RegExp(`href="${escapada}(/[^"]*)"`, "g");
const reHome = new RegExp(`href="${escapada}/?"`, "g");

let tocados = 0;
let trocas = 0;
const porArquivo = [];

for (const arq of arquivos(raiz)) {
  const antes = readFileSync(arq, "utf8");
  if (!antes.includes(ORIGEM)) continue;
  let depois = antes.replace(reComCaminho, 'href="$1"');
  depois = depois.replace(reHome, 'href="/"');
  if (depois === antes) continue;
  const n = (antes.match(reComCaminho) ?? []).length + (antes.match(reHome) ?? []).length;
  trocas += n;
  tocados++;
  porArquivo.push(`${relative(raiz, arq).replace(/\\/g, "/")}: ${n}`);
  if (ESCREVER) writeFileSync(arq, depois, "utf8");
}

console.log(`links internos absolutos -> relativos: ${trocas} em ${tocados} arquivo(s)${ESCREVER ? "" : " (simulado)"}`);
for (const l of porArquivo.slice(0, 10)) console.log(`  ${l}`);
if (porArquivo.length > 10) console.log(`  … e mais ${porArquivo.length - 10}`);

// o que sobrou apontando para a origem NÃO é href: canônico, OG, JSON-LD.
// Esses DEVEM continuar apontando para o original — são metadata, não navegação.
let restantes = 0;
for (const arq of arquivos(raiz)) {
  const t = readFileSync(arq, "utf8");
  restantes += (t.match(new RegExp(escapada, "g")) ?? []).length;
}
if (restantes) {
  console.log(`\nrestam ${restantes} menção(ões) a ${ORIGEM} fora de href — canônico, OG e JSON-LD.`);
  console.log(`Essas ficam de propósito: metadata aponta para o original, não para o clone.`);
}
