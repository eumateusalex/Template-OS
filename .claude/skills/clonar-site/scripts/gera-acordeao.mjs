// gera-acordeao.mjs — devolve ao clone o acordeão que ele perdeu.
//
// O ditto entrega a página congelada: o FAQ existe, o texto da resposta ESTÁ no
// DOM (medido: `deltaTextoDaPagina: 0`), mas nada abre nem fecha, porque não
// vem código nenhum.
//
// O que o original faz, medido item a item:
//   fechado -> height: 52px
//   aberto  -> height: 128–151px (cada item tem a sua)
//
// 🚨 Nenhuma altura é digitada: cada uma vem da medição. A DURAÇÃO da
// transição também é medida aqui, amostrando a altura por rAF no original até
// ela estabilizar — em vez de chutar "300ms fica bom".
//
// ⚠️ O primeiro item do site-exemplo começa ABERTO. Por isso a medição alterna
// DUAS vezes e o gerador respeita o estado inicial de cada um, em vez de supor
// que todos nascem fechados.
//
// Uso:
//   MED=<med>/interacao-original/interacao.json ORIGINAL=<url> \
//   CLONE=http://127.0.0.1:8081 APP=<app> ROTA=/ node gera-acordeao.mjs

import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const MED = process.env.MED;
const ORIGINAL = process.env.ORIGINAL;
const CLONE = process.env.CLONE;
const APP = process.env.APP;
if (!MED || !ORIGINAL || !CLONE || !APP) {
  console.error("faltam MED, ORIGINAL, CLONE e/ou APP");
  process.exit(1);
}
const ROTA = process.env.ROTA ?? "/";
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

const medicao = JSON.parse(readFileSync(MED, "utf8"));
const largura = medicao.largura ?? 1280;

// Alvo de acordeão: o clique muda a ALTURA e volta ao clicar de novo.
const itens = medicao.medidos.filter((m) => {
  const mud = m.clique?.mudanca ?? {};
  const volta = m.clique?.volta ?? {};
  return mud.height && volta.height;
});
console.log(`itens de acordeão na medição: ${itens.length}`);
if (!itens.length) {
  console.log("nenhum acordeão detectado — nada a fazer");
  process.exit(0);
}

for (const m of itens) {
  const [a, b] = m.clique.mudanca.height.map((v) => Math.round(parseFloat(v)));
  // A ida vai de A para B; a volta confirma que B retorna a A.
  m.alturaInicial = a;
  m.alturaAlternada = b;
  m.comecaAberto = a > b; // se encolhe ao clicar, começou aberto
  m.fechada = Math.min(a, b);
  m.aberta = Math.max(a, b);
}

// ---- medir a DURAÇÃO da transição no original ------------------------------
const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: largura, height: 900 } });
const page = await ctx.newPage();
await page.goto(new URL(ROTA, ORIGINAL).href, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1200);

const duracoes = [];
for (const m of itens.slice(0, 3)) {
  try {
    // ⚠️ Casar por TEXTO só não basta: vários ancestrais começam com o mesmo
    // texto, e o primeiro que casa costuma ser um container grande. O item
    // certo é o que tem a ALTURA medida (fechada ou aberta). Sem esse filtro a
    // medição clica no container, a altura dele não muda, e a duração sai 0ms.
    const achou = await page.evaluate(
      ({ txt, fechada, aberta }) => {
        const cands = Array.from(document.querySelectorAll("div,li,details")).filter((e) =>
          (e.textContent ?? "").replace(/\s+/g, " ").trim().startsWith(txt),
        );
        const alvo = cands.find((e) => {
          const h = Math.round(e.getBoundingClientRect().height);
          return Math.abs(h - fechada) <= 3 || Math.abs(h - aberta) <= 3;
        });
        if (!alvo) return false;
        alvo.setAttribute("data-acord", "1");
        alvo.scrollIntoView({ block: "center", behavior: "instant" });
        return true;
      },
      { txt: m.texto.slice(0, 24), fechada: m.fechada, aberta: m.aberta },
    );
    if (!achou) continue;
    await page.waitForTimeout(300);
    // 🚨 ARMAR o gravador primeiro, disparar o clique com EVENTO REAL depois.
    //
    // `el.click()` dentro do evaluate é MouseEvent sintético e não aciona
    // framework — o Framer não responde, a altura não muda, e a duração sai
    // 0ms. É a mesma armadilha que o mede-interacao.mjs avisa, e caí nela aqui.
    // Quem dispara de verdade é `page.click()`, do lado do Playwright.
    await page.evaluate(() => {
      const el = document.querySelector('[data-acord="1"]');
      window.__acord = { alturas: [], t0: performance.now() };
      const passo = () => {
        window.__acord.alturas.push([
          Math.round(performance.now() - window.__acord.t0),
          Math.round(el.getBoundingClientRect().height),
        ]);
        if (performance.now() - window.__acord.t0 < 2000) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    });
    await page.click('[data-acord="1"]', { timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(2100);
    const d = await page.evaluate(() => {
      const alturas = window.__acord?.alturas ?? [];
      let fim = 0;
      let inicio = null;
      for (let i = 1; i < alturas.length; i++) {
        if (Math.abs(alturas[i][1] - alturas[i - 1][1]) > 0.5) {
          if (inicio === null) inicio = alturas[i - 1][0];
          fim = alturas[i][0];
        }
      }
      document.querySelector('[data-acord="1"]')?.removeAttribute("data-acord");
      // Duração = da primeira mudança à última, não do clique à última: o
      // atraso até começar não é parte da transição.
      return { duracao: inicio === null ? 0 : fim - inicio, amostras: alturas.length };
    });
    if (d.duracao > 0) duracoes.push(d.duracao);
    console.log(`  "${m.texto.slice(0, 30)}" -> transição medida: ${d.duracao}ms (${d.amostras} quadros)`);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(900);
  } catch (e) {
    console.log(`  "${m.texto.slice(0, 30)}" -> não consegui medir: ${String(e.message ?? e).slice(0, 60)}`);
  }
}

const duracao = duracoes.length ? Math.round(duracoes.reduce((a, b) => a + b, 0) / duracoes.length) : null;
if (duracao === null) {
  console.log("\n🚨 NÃO consegui medir a duração. Abortando: melhor não gerar do que gerar com número chutado.");
  await navegador.close();
  process.exit(1);
}
console.log(`\nduração da transição (média de ${duracoes.length} medições): ${duracao}ms`);

// ---- casar os itens no CLONE, por texto -------------------------------------
await page.goto(new URL(ROTA, CLONE).href + "?_v=" + Date.now(), { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(600);
// ⚠️ Casar por texto SOZINHO pega o ancestral errado — o filtro do lado do
// original vale aqui também. Sem filtrar por altura, os itens 03 a 05 casam
// com elementos de altura ZERO, e o CSS gerado não faz nada neles.
const casados = await page.evaluate(
  (alvos) =>
    alvos.map(({ t, fechada, aberta }) => {
      const cands = Array.from(document.querySelectorAll("[data-cid]")).filter((e) =>
        (e.textContent ?? "").replace(/\s+/g, " ").trim().startsWith(t),
      );
      // O item certo tem a altura medida no original — fechada OU aberta.
      const el =
        cands.find((e) => {
          const h = Math.round(e.getBoundingClientRect().height);
          return Math.abs(h - fechada) <= 4 || Math.abs(h - aberta) <= 4;
        }) ?? null;
      if (!el) {
        return {
          cid: null,
          motivo:
            "nenhum candidato com altura ~" +
            fechada +
            " ou ~" +
            aberta +
            " (candidatos: " +
            cands.map((e) => Math.round(e.getBoundingClientRect().height)).join(",") +
            ")",
        };
      }
      return { cid: el.getAttribute("data-cid"), alturaAtual: Math.round(el.getBoundingClientRect().height) };
    }),
  itens.map((m) => ({ t: m.texto.slice(0, 24), fechada: m.fechada, aberta: m.aberta })),
);
await navegador.close();

const regras = [];
const naoCasados = [];
itens.forEach((m, i) => {
  const c = casados[i];
  if (!c || !c.cid) {
    m.motivo = c?.motivo ?? "sem candidato";
    naoCasados.push(m);
    return;
  }
  // ══════════════════════════════════════════════════════════════════════
  // 🚨 ANCORAR NA ALTURA QUE O CLONE JÁ TEM, não na do original.
  //
  // Escrever direto `height: <fechada do original>` quebra o que está certo.
  // Medido no site-exemplo: o original devolve 52px para o item fechado, o
  // clone tem 81px para o MESMO item fechado, e forçar 52px encolhe cinco
  // itens. O FAQ inteiro sobe **146px** — e a captura tinha acertado o estado
  // inicial sozinha.
  //
  // O que o original tem de único e confiável é o DELTA entre os dois estados.
  // A altura absoluta vem do clone, do estado que ele já tem, e o outro estado
  // sai do delta. Assim o instrumento só ACRESCENTA o mecanismo que falta, sem
  // mexer no que a captura acertou.
  //
  // E qual estado o clone tem não se supõe: compara-se a altura dele com as
  // duas do original e fica-se com a mais próxima.
  const delta = m.aberta - m.fechada;
  const atual = c.alturaAtual;
  const perto = Math.abs(atual - m.aberta) <= Math.abs(atual - m.fechada) ? "aberta" : "fechada";
  const fechada = perto === "aberta" ? Math.max(0, atual - delta) : atual;
  const aberta = perto === "aberta" ? atual : atual + delta;
  m.ancora = perto;
  m.fechadaEscrita = fechada;
  m.abertaEscrita = aberta;

  regras.push(
    `[data-cid="${c.cid}"]{height:${fechada}px;overflow:hidden;transition:height ${duracao}ms cubic-bezier(0.4,0,0.2,1)}\n` +
      `[data-cid="${c.cid}"].ditto-aberto{height:${aberta}px}` +
      `  /* "${m.texto.slice(0, 26)}" delta medido=${delta}px · clone estava ${perto} em ${atual}px` +
      ` → fechado=${fechada} aberto=${aberta} (original dizia ${m.fechada}/${m.aberta}) */`,
  );
  m.cid = c.cid;
});

// 🚨 Altura em px só vale na largura em que foi medida: um item que ocupa duas
// linhas a 1280px pode ocupar quatro a 375px, e uma altura fixa cortaria o
// texto no celular.
const FAIXA =
  process.env.FAIXA ??
  (largura >= 1024
    ? "(min-width: 1024px)"
    : largura >= 768
      ? "(min-width: 768px) and (max-width: 1023.98px)"
      : "(max-width: 767.98px)");

const css = `/* acordeao.css — acordeão reconstruído a partir da medição do ORIGINAL
   por scripts/gera-acordeao.mjs. Nenhuma altura nem duração digitada.
   Origem: ${medicao.site} @${largura}px · faixa: ${FAIXA}
   ${itens.length} itens medidos, ${regras.length} casados. Transição: ${duracao}ms (medida).

   🚨 A altura ABSOLUTA vem do clone, o DELTA vem do original. Escrever a
   altura absoluta do original encolhe 5 itens e sobe o FAQ inteiro 146px
   (medido) — a captura já acerta o estado inicial. */

@media ${FAIXA} {
${regras.join("\n")}

/* 🚨 Os ALVOS do runtime moram aqui, no CSS DA ROTA, e não dentro do JS.
   O acordeao.js é um arquivo só para o site inteiro: com a lista de itens
   embutida nele, gerar o acordeão de uma segunda rota APAGA o da primeira.
   Medido no framer-5 — a home sobrescreve o /faq, que já funcionava, e o
   FAQ morre sem erro nenhum em lugar nenhum.
   1 = nasce fechado · 2 = nasce aberto (estado inicial MEDIDO no original). */
${itens
  .filter((m) => m.cid)
  .map((m) => `[data-cid="${m.cid}"]{--ditto-acordeao:${m.comecaAberto ? 2 : 1}}`)
  .join("\n")}
}

/* Alvo de teclado: o original não dá, e não custa nada dar. */
[data-cid].ditto-acordeao{cursor:pointer}
[data-cid].ditto-acordeao:focus-visible{outline:2px solid currentColor;outline-offset:2px}

@media (prefers-reduced-motion: reduce){
  [data-cid].ditto-acordeao{transition:none !important}
}
`;

const js = `// acordeao.js — alterna os itens do FAQ. Gerado por scripts/gera-acordeao.mjs.
//
// 🚨 Estado por CLASSE, nunca por 'animationend': aquele evento faz bubbling
// (animação de um filho terminando derruba a classe cedo) e pode nem chegar
// (aba em segundo plano). Classe + transition de CSS não tem essa categoria de
// bug.
//
// ⚠️ Roda depois do 'load', não na hidratação: mutar o DOM enquanto o React
// hidrata compete com ele.
(function () {
  // 🚨 ESTE RUNTIME NAO CARREGA DADO DE ROTA, e a razao e cara: o arquivo e um
  // so para o site inteiro. Com a lista de itens embutida aqui, gerar o
  // acordeao de uma segunda rota APAGA o da primeira — medido no framer-5, a
  // home sobrescreve o /faq que ja funcionava e o FAQ morre em silencio. E a
  // mesma classe de defeito que obriga o scroll.js a ser generico.
  //
  // Os alvos vem do acordeao.css DAQUELA rota, por variavel CSS:
  //    [data-cid="n73"] { --ditto-acordeao: 2 }   -> nasce ABERTO
  //    [data-cid="n85"] { --ditto-acordeao: 1 }   -> nasce fechado
  // Como o Next isola o CSS por rota, nenhuma rota alcanca o cid de outra —
  // e data-cid COLIDE entre rotas.
  function alvos() {
    var achados = [];
    var todos = document.querySelectorAll("[data-cid]");
    for (var i = 0; i < todos.length; i++) {
      var v = getComputedStyle(todos[i]).getPropertyValue("--ditto-acordeao").trim();
      if (v === "1" || v === "2") achados.push({ el: todos[i], comecaAberto: v === "2" });
    }
    return achados;
  }

  function liga() {
    alvos().forEach(function (it) {
      var el = it.el;
      if (el.classList.contains("ditto-acordeao")) return; // este no ja esta ligado
      el.classList.add("ditto-acordeao");
      // ⚠️ Respeitar o estado inicial MEDIDO: no site-exemplo o primeiro item
      // começa aberto, e supor "todos fechados" deixaria a página diferente do
      // original já no carregamento.
      if (it.comecaAberto) el.classList.add("ditto-aberto");
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.setAttribute("aria-expanded", it.comecaAberto ? "true" : "false");
      function alterna() {
        var aberto = el.classList.toggle("ditto-aberto");
        el.setAttribute("aria-expanded", aberto ? "true" : "false");
      }
      el.addEventListener("click", alterna);
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          alterna();
        }
      });
    });
  }
  // 🚨 Reexecutável e idempotente: com navegação client-side o documento não
  // recarrega, e sem religar toda rota depois da primeira fica com o FAQ
  // morto. A classe ditto-acordeao já posta evita ligar o clique duas vezes.
  window.__dittoAcordeao = liga;

  // 🚨 UMA chamada no 'load' NÃO basta, e isto foi medido no framer-7:
  // window.__dittoAcordeao existia como função, nenhum erro no console, e o
  // FAQ continuava morto — classe ausente, cursor 'auto', altura 51px, clique
  // sem efeito. Chamado à mão no console e clicado logo depois: classe posta,
  // cursor 'pointer', altura 121px. Ou seja, a lógica estava certa e o MOMENTO
  // estava errado: o React ainda mexe na árvore depois do 'load' e desfaz a
  // mutação, sem erro nenhum em lugar nenhum.
  //
  // ⚠️ E a guarda tem que olhar o ESTADO real, nunca um sinalizador: um nó que
  // perdeu a classe continuaria "já ligado" para um booleano, e o conserto
  // ficaria calado. Por isso precisa() relê o DOM.
  // (sem crases neste comentário: ele mora DENTRO do template literal que gera
  //  este runtime, e crase aqui fecha o template e quebra o arquivo inteiro)
  function precisa() {
    var a = alvos();
    for (var q = 0; q < a.length; q++) {
      if (!a[q].el.classList.contains("ditto-acordeao")) return true;
    }
    return false;
  }
  function tentar() { if (precisa()) liga(); }
  function agendar() {
    tentar();
    [120, 400, 1000, 2500].forEach(function (ms) { setTimeout(tentar, ms); });
  }
  if (document.readyState === "complete") agendar();
  else window.addEventListener("load", agendar);
})();
`;

// 🚨 A rota vem PERCENT-ENCODED (é assim que ela existe no original), mas a
// pasta no disco tem o caractere literal. Sem decodificar, toda rota com
// acento ou unicode aponta para pasta inexistente e o instrumento aborta.
// Medido no framer-7: /blog/...director%E2%80%99s-... derrubou dois
// instrumentos em silêncio antes de esta varredura achar o padrão.
const decodificarSegmento = (s) => {
  try { return decodeURIComponent(s); } catch { return s; }
};
const dirRota =
  ROTA === "/"
    ? join(resolve(APP), "src", "app")
    : join(resolve(APP), "src", "app", ...ROTA.split("/").filter(Boolean).map(decodificarSegmento));
mkdirSync(dirRota, { recursive: true });
writeFileSync(join(dirRota, "acordeao.css"), css, "utf8");

const publicDir = join(resolve(APP), "public");
mkdirSync(publicDir, { recursive: true });
writeFileSync(join(publicDir, "acordeao.js"), js, "utf8");

// CSS por rota (data-cid colide entre rotas); JS no public, chamado pelo layout.
const arquivoPage = join(dirRota, "page.tsx");
let ligadoCss = false;
if (existsSync(arquivoPage)) {
  const fonte = readFileSync(arquivoPage, "utf8");
  if (fonte.includes('"./acordeao.css"')) ligadoCss = true;
  else {
    const marca = 'import "./ditto.css";';
    writeFileSync(
      arquivoPage,
      fonte.includes(marca) ? fonte.replace(marca, marca + '\nimport "./acordeao.css";') : 'import "./acordeao.css";\n' + fonte,
      "utf8",
    );
    ligadoCss = true;
  }
}

const layout = join(resolve(APP), "src", "app", "layout.tsx");
let ligadoJs = false;
if (existsSync(layout)) {
  const fonte = readFileSync(layout, "utf8");
  if (fonte.includes("acordeao.js")) ligadoJs = true;
  else if (fonte.includes("{children}")) {
    writeFileSync(
      layout,
      fonte.replace("{children}", '{children}\n        <script src="/acordeao.js" defer />'),
      "utf8",
    );
    ligadoJs = true;
  }
}

console.log(`\ncasados: ${regras.length}/${itens.length}`);
if (naoCasados.length)
  for (const m of naoCasados) console.log(`   ⚠️ não casou: "${m.texto.slice(0, 34)}" — ${m.motivo}`);
console.log(`css -> ${join(dirRota, "acordeao.css")}  (import na page: ${ligadoCss ? "ok" : "FALHOU"})`);
console.log(`js  -> ${join(publicDir, "acordeao.js")}  (script no layout: ${ligadoJs ? "ok" : "FALHOU"})`);
