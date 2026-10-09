// corrige-variaveis-css.mjs — conserta as variáveis CSS que o ditto destrói
// ao converter HTML em JSX.
//
// ══════════════════════════════════════════════════════════════════════════
// 🚨 O DEFEITO
//
// Estilo inline de site feito em construtor carrega propriedade customizada:
//
//   style="--framer-font-size: 296.14px; --framer-font-weight: 500"
//
// Ao virar objeto de estilo do React, o ditto camelCasa a chave e come um dos
// hífens:
//
//   style={{ "-FramerFontSize": "296.14px", "-FramerFontWeight": "500" }}
//
// `-FramerFontSize` não é propriedade CSS nem propriedade customizada (essa
// precisa de DOIS hífens). O navegador descarta a declaração inteira, em
// silêncio, e o texto cai para o padrão herdado.
//
// Medido no site do exemplo: o título "JOSEPH" do rodapé renderizou com **12px**
// onde o original usa **296.14px** — 259px a menos de altura, num bloco de
// 992px de largura. Não aparece em contagem de rota, nem de metadata, nem em
// altura de página (o pai tem altura fixa). Aparece no olho, imediatamente.
//
// Alcance no site-exemplo: **22 elementos, nas 21 rotas**. Não é caso de borda.
//
// ══════════════════════════════════════════════════════════════════════════
// 🚨 O CONSERTO, EM DUAS CAMADAS
//
// 1. **Devolver a variável** (`-FramerFontSize` → `--framer-font-size`), para
//    quem consome `var(--framer-font-size)` voltar a funcionar.
//
// 2. **Escrever também a propriedade REAL** (`fontSize`). Isto é necessário
//    porque a regra que consumia a variável morava na folha de estilo do
//    construtor, que a captura não trouxe. Devolver só a variável restaura um
//    valor que ninguém lê.
//
// Idempotente: depois de rodar, não existe mais chave `-Maiúscula`, e uma
// segunda passada não acha nada. E nunca sobrescreve propriedade real que já
// exista no mesmo objeto.
//
// Uso:
//   APP=/caminho/app node corrige-variaveis-css.mjs
//   APP=... ESCREVER=0 node corrige-variaveis-css.mjs   # simula

import { readFileSync, writeFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join, resolve, relative } from "node:path";

const APP = process.env.APP;
if (!APP) {
  console.error("falta APP");
  process.exit(1);
}
const ESCREVER = process.env.ESCREVER !== "0";
const RAIZ = resolve(APP, "src");

// Variável do construtor → propriedade CSS que ela alimentava.
const EQUIVALE = {
  "--framer-font-family": "fontFamily",
  "--framer-font-size": "fontSize",
  "--framer-font-weight": "fontWeight",
  "--framer-font-style": "fontStyle",
  "--framer-letter-spacing": "letterSpacing",
  "--framer-line-height": "lineHeight",
  "--framer-text-color": "color",
  "--framer-text-alignment": "textAlign",
  "--framer-text-transform": "textTransform",
  "--framer-text-decoration": "textDecoration",
};

/** "-FramerFontSize" → "--framer-font-size" */
function devolverVariavel(chave) {
  const semTraco = chave.slice(1); // FramerFontSize
  const kebab = semTraco.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  return `--${kebab}`;
}

function arquivosTsx(dir) {
  const saida = [];
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) {
      if (nome === "node_modules" || nome === ".next") continue;
      saida.push(...arquivosTsx(p));
    } else if (nome.endsWith(".tsx") || nome.endsWith(".ts")) {
      saida.push(p);
    }
  }
  return saida;
}

/** Acha cada bloco `style={{ ... }}` e devolve [inicioDoMiolo, fimDoMiolo]. */
function blocosDeEstilo(texto) {
  const blocos = [];
  const marca = "style={{";
  let i = 0;
  while ((i = texto.indexOf(marca, i)) !== -1) {
    let nivel = 2; // as duas chaves de style={{
    let j = i + marca.length;
    let aspas = null;
    while (j < texto.length && nivel > 0) {
      const c = texto[j];
      if (aspas) {
        if (c === "\\") j++;
        else if (c === aspas) aspas = null;
      } else if (c === '"' || c === "'" || c === "`") aspas = c;
      else if (c === "{") nivel++;
      else if (c === "}") nivel--;
      j++;
    }
    blocos.push([i + marca.length, j - 2]);
    i = j;
  }
  return blocos;
}

/** Nomes de propriedade já presentes no miolo, para não duplicar. */
function chavesPresentes(miolo) {
  const nomes = new Set();
  const re = /(?:^|[{,\s])(?:"([^"]+)"|'([^']+)'|([A-Za-z_$][\w$]*))\s*:/g;
  let m;
  while ((m = re.exec(miolo))) nomes.add(m[1] ?? m[2] ?? m[3]);
  return nomes;
}

let totalArquivos = 0;
let totalChaves = 0;
let totalPropsAdicionadas = 0;
const porChave = {};
const tocados = [];

for (const arq of arquivosTsx(RAIZ)) {
  const original = readFileSync(arq, "utf8");
  if (!/"-[A-Z]/.test(original)) continue;

  let texto = original;
  // De trás para frente: assim os índices dos blocos anteriores continuam
  // valendo enquanto o texto muda.
  const blocos = blocosDeEstilo(texto);
  for (let b = blocos.length - 1; b >= 0; b--) {
    const [ini, fim] = blocos[b];
    const miolo = texto.slice(ini, fim);
    if (!/"-[A-Z]/.test(miolo)) continue;
    const jaTem = chavesPresentes(miolo);

    let novoMiolo = miolo;
    const extras = [];
    novoMiolo = novoMiolo.replace(
      /"(-[A-Z][A-Za-z0-9]*)"(\s*:\s*)("(?:[^"\\]|\\.)*")/g,
      (todo, chave, meio, valor) => {
        const variavel = devolverVariavel(chave);
        totalChaves++;
        porChave[chave] = (porChave[chave] ?? 0) + 1;
        const prop = EQUIVALE[variavel];
        // 🚨 Só acrescenta a propriedade real se ela ainda NÃO existe no mesmo
        // objeto: sobrescrever um valor que o ditto acertou seria trocar
        // medição por suposição.
        if (prop && !jaTem.has(prop)) {
          jaTem.add(prop);
          extras.push(`${prop}: ${valor}`);
          totalPropsAdicionadas++;
        }
        return `"${variavel}"${meio}${valor}`;
      }
    );
    if (extras.length) {
      const sep = novoMiolo.trim().endsWith(",") ? " " : ", ";
      novoMiolo = novoMiolo.replace(/\s*$/, "") + sep + extras.join(", ") + " ";
    }
    texto = texto.slice(0, ini) + novoMiolo + texto.slice(fim);
  }

  if (texto !== original) {
    totalArquivos++;
    tocados.push(relative(APP, arq));
    if (ESCREVER) writeFileSync(arq, texto, "utf8");
  }
}

console.log(`\n${ESCREVER ? "✅" : "(simulação)"} variáveis CSS devolvidas`);
console.log(`   arquivos alterados: ${totalArquivos}`);
console.log(`   chaves consertadas: ${totalChaves}`);
console.log(`   propriedades reais acrescentadas: ${totalPropsAdicionadas}`);
for (const [k, n] of Object.entries(porChave).sort((a, b) => b[1] - a[1])) {
  console.log(`     ${k.padEnd(24)} ${n}  →  ${devolverVariavel(k)}${EQUIVALE[devolverVariavel(k)] ? ` + ${EQUIVALE[devolverVariavel(k)]}` : ""}`);
}
if (!totalChaves) console.log(`   (nada a fazer — nenhuma chave "-Maiúscula" encontrada)`);
for (const t of tocados.slice(0, 25)) console.log(`   · ${t}`);
if (tocados.length > 25) console.log(`   ... e mais ${tocados.length - 25}`);
