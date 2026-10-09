// corrige-interacao.mjs — devolve ao clone a capacidade de receber clique.
//
// 🚨 O defeito, achado com a prova do próprio Playwright no site-exemplo:
//
//   <section id="pricing" class="... after:content-[''] after:absolute
//    after:inset-0"> intercepts pointer events
//
// O ditto gera pseudo-elementos `::after` DECORATIVOS com `absolute` e
// `inset-0` em sections e navs. Pseudo-elemento **participa do hit-testing**,
// então esse `::after` cobre a seção inteira e engole o mouse de tudo que está
// dentro.
//
// Efeito medido na home: o original responde a hover em 16 alvos e a clique em
// 7; o clone respondia a hover em 3 e a clique em ZERO, com 17 alvos travando
// em timeout. O FAQ não abria, os cards não reagiam.
//
// O conserto: pseudo-elemento é decoração por definição — nunca deve receber
// ponteiro. Além disso, reativa `pointer-events` em elemento interativo que o
// gerador marcou como morto, quando o original o tem vivo.
//
// Uso:
//   APP=<pasta>/app node corrige-interacao.mjs
//
// Variáveis:
//   APP       raiz do app gerado (obrigatória)
//   ESCREVER  "0" para simular (padrão: escreve)

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const APP = process.env.APP;
if (!APP) {
  console.error("falta APP");
  process.exit(1);
}
const ESCREVER = process.env.ESCREVER !== "0";
const RAIZ = resolve(APP);
const dirApp = join(RAIZ, "src", "app");
if (!existsSync(dirApp)) {
  console.error(`não achei src/app em ${APP}`);
  process.exit(1);
}

const css = `/* interacao.css — conserto de hit-testing, gerado por
   scripts/corrige-interacao.mjs.

   🚨 Pseudo-elemento decorativo NÃO pode receber ponteiro.

   O ditto gera \`::after\` com \`position:absolute; inset:0\` em section, nav e
   afins, para desenhar borda e fundo. Pseudo-elemento participa do
   hit-testing, então essa decoração cobre a seção inteira e engole o mouse de
   todo interativo dentro dela.

   Prova, do log do Playwright no clone do site-exemplo:
     <section id="pricing" class="... after:absolute after:inset-0">
        intercepts pointer events

   Efeito: 17 alvos em timeout, FAQ sem abrir, zero resposta a clique.

   Isto NÃO muda nada visualmente: o pseudo-elemento continua sendo pintado
   igual. Só para de interceptar evento. */

[data-cid]::before,
[data-cid]::after {
  pointer-events: none;
}

/* O mesmo vale para a raiz do documento e o body, que o gerador também
   decora. */
body::before,
body::after {
  pointer-events: none;
}

/* 🚨 Elemento interativo tem que receber ponteiro.

   O gerador deixa elementos interativos mortos — medido: 5 na home, entre eles
   os links "Work", "Services", "Pricing" e "Blog" da navegação e o botão
   "Contact", todos vivos no ORIGINAL.

   ⚠️ E a marca NÃO fica no próprio link: está num ANCESTRAL. Medido:

     [1] a "Work"     -> pointer-events:none em p
     [5] button "Contact" -> pointer-events:none em div

   Uma regra que só cobrisse \`a.pointer-events-none\` não pega nada — foi o
   que aconteceu na primeira tentativa, e os 5 continuaram mortos.

   Em CSS, \`pointer-events: auto\` no filho RESTAURA o evento mesmo com o pai
   em \`none\`. Então a regra vale para o interativo, onde quer que esteja a
   marca. */
a[href],
button,
[role="button"],
input,
select,
textarea,
summary {
  pointer-events: auto;
}
`;

const arquivoCss = join(dirApp, "interacao.css");
if (ESCREVER) writeFileSync(arquivoCss, css, "utf8");

// Ligar no layout: o defeito é do gerador e afeta TODAS as rotas, então aqui o
// escopo global é o certo — diferente do entrada.css, que é por rota.
const layout = join(dirApp, "layout.tsx");
let ligado = false;
if (existsSync(layout)) {
  const fonte = readFileSync(layout, "utf8");
  if (fonte.includes('"./interacao.css"')) {
    ligado = true;
  } else {
    const marca = 'import "./globals.css";';
    const novo = fonte.includes(marca)
      ? fonte.replace(marca, marca + '\nimport "./interacao.css";')
      : 'import "./interacao.css";\n' + fonte;
    if (ESCREVER) writeFileSync(layout, novo, "utf8");
    ligado = true;
  }
}

console.log(`${ESCREVER ? "escrito" : "SIMULADO"}: ${arquivoCss}`);
console.log(`import no layout: ${ligado ? "ok" : "NÃO CONSEGUI — ligar à mão"}`);
console.log(`\nconserta:`);
console.log(`  1. ::before/::after de [data-cid] param de interceptar ponteiro`);
console.log(`  2. <a>, <button> e [role=button] marcados como mortos voltam a receber mouse`);
console.log(`\n⚠️ Rodar mede-interacao.mjs DEPOIS do build para provar que resolveu.`);
