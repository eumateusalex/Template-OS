// interacao.mjs — molde da dimensão 6: o que o vídeo mostra abrindo, trocando,
// contando e andando, provado na página. Copiar para <projeto>/regua/interacao.mjs
// e trocar as provas pelas da página. O conferir.sh roda este arquivo.
//
//   URL=http://localhost:4517 node regua/interacao.mjs      (sai 1 se algo falhar)
//
// Regras do molde:
// - cada coisa que abre ou troca se prova por CLIQUE e por TECLADO (Enter, e as
//   setas num conjunto de abas), e o foco tem de aparecer;
// - o que avança sozinho (aba, carrossel) tem de PARAR quando a pessoa escolhe;
// - número que sobe se prova pelo valor final; trilho, pela velocidade medida no vídeo;
// - a prova lê o que a pessoa vê (aria-expanded, texto, posição), não nome de classe.
// Se o vídeo não mostra interação nenhuma, este arquivo diz isso e sai 0:
//   console.log("# provas 0  # falhas 0  (o vídeo não mostra interação)");

import { createRequire } from "node:module";

const URL_ = process.env.URL ?? "http://localhost:4517";
const require = createRequire((process.env.DITTO ?? (process.env.USERPROFILE ?? process.env.HOME) + "/dev/ditto").replace(/\/?$/, "/"));
const { chromium } = require("playwright");

let provas = 0;
const falhas = [];
const prova = (nome, ok, detalhe = "") => {
  provas++;
  console.log(`${ok ? "ok   " : "FALHA"} ${nome}${detalhe ? "  " + detalhe : ""}`);
  if (!ok) falhas.push(nome);
};

const navegador = await chromium.launch();
// a janela é a do corte do vídeo (a mesma "largura" do alvos.json)
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 876 } });
await pagina.goto(URL_, { waitUntil: "load" });
await pagina.waitForTimeout(2000);

// leva um elemento para perto do topo da tela, com folga
const ate = (seletor, folga = 0) =>
  pagina.evaluate(([s, f]) => { const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY + f); }, [seletor, folga]);

// --- exemplo 1: acordeão (troque o seletor da seção) ---
const SECAO = "main > section:nth-of-type(5)";
const abertas = () => pagina.evaluate((s) => [...document.querySelectorAll(`${s} button`)].map((b) => b.getAttribute("aria-expanded")).join(","), SECAO);
await ate(SECAO);
await pagina.waitForTimeout(3000);
await pagina.locator(`${SECAO} button`).nth(1).click();
await pagina.waitForTimeout(1000);
prova("clique abre a segunda pergunta", (await abertas()).split(",")[1] === "true", await abertas());
await pagina.locator(`${SECAO} button`).nth(2).focus();
await pagina.keyboard.press("Enter");
await pagina.waitForTimeout(1000);
prova("Enter abre pelo teclado", (await abertas()).split(",")[2] === "true", await abertas());
prova("o foco do teclado aparece", (await pagina.evaluate(() => getComputedStyle(document.activeElement).outlineStyle)) !== "none");

// --- exemplo 2: número que sobe (o valor final lido na tela) ---
// const numero = await pagina.evaluate(() => [...document.querySelectorAll("main span")].map((s) => s.textContent).find((t) => /^\$\d/.test(t)));
// prova("a contagem chega em $1544.52", numero === "$1544.52", numero);

// --- exemplo 3: trilho em laço (px por segundo medidos no vídeo) ---
// const x = () => pagina.evaluate(() => document.querySelector(".trilho").getBoundingClientRect().left);
// const a = await x(); await pagina.waitForTimeout(2000); const b = await x();
// prova("o trilho anda perto de 86 px/s", Math.abs((a - b) / 2 - 86) < 15, `${Math.round((a - b) / 2)} px/s`);

await navegador.close();
console.log(`# provas ${provas}  # falhas ${falhas.length}`);
process.exitCode = falhas.length ? 1 : 0;
