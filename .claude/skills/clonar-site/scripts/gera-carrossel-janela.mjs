// gera-carrossel-janela.mjs — carrossel de setas cujos slides JÁ ESTÃO no DOM,
// e o que anda é uma JANELA de visibilidade mais o transform do trilho.
//
// Diferente do captura-slides.mjs, que existe para o carrossel VIRTUALIZADO
// (slides que só nascem quando se navega até eles). Medido no framer-4: o
// original serve os 20 <li> completos e esconde com `visibility` quem está
// fora da janela corrente ±1. Não há markup a inventar — há um mecanismo a
// devolver. O reconstroi-trilho.mjs põe os slides; este põe o movimento.
//
// O que mede no ORIGINAL (nada se digita):
//   x de repouso · largura do slide · quais índices ficam visíveis no repouso
//   passo de um clique · duração · curva normalizada (25 amostras)
//   opacidade da bolinha ativa e das inativas · pointer-events dos controles
//
// O que o faz SE CALAR:
//   - trilho, seta ou bolinha não achados        -> declara e sai
//   - clique não move o trilho                   -> declara e sai
//   - janela de visibilidade não muda no clique  -> declara e sai (não é este
//                                                   tipo de carrossel)
//   - cid do clone não informado                 -> mede e não escreve runtime
//
// Uso:
//   ORIGINAL=<url> APP=<app> ROTA=/ ANCORA_Y=8934 \
//   CID_TRILHO=n1293 CID_PREV=n1333 CID_NEXT=n1335 \
//   CID_DOTS=n1338,n1340,n1342,n1344,n1346 node gera-carrossel-janela.mjs
//
// Variáveis: ORIGINAL, APP (obrigatórias) · ROTA (/) · ANCORA_Y (0)
//   CID_* · SAIDA · ESCREVER=0 simula · DITTO

import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ORIGINAL = process.env.ORIGINAL, APP = process.env.APP;
if (!ORIGINAL || !APP) { console.error("falta ORIGINAL=<url> APP=<app>"); process.exit(1); }
const ROTA = process.env.ROTA ?? "/";
const ANCORA_Y = Number(process.env.ANCORA_Y ?? 0);
const CID_TRILHO = process.env.CID_TRILHO, CID_PREV = process.env.CID_PREV, CID_NEXT = process.env.CID_NEXT;
const CID_DOTS = (process.env.CID_DOTS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const SAIDA = resolve(process.env.SAIDA ?? "./carrossel-janela");
const ESCREVER = process.env.ESCREVER !== "0";
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
mkdirSync(SAIDA, { recursive: true });
if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

const nav = await chromium.launch();
const p = await nav.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto(new URL(ROTA, ORIGINAL).href, { waitUntil: "load", timeout: 60000 });
await p.waitForTimeout(2200);
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } });
await p.evaluate((y) => scrollTo(0, Math.max(0, y - 300)), ANCORA_Y);
await p.waitForTimeout(1500);

const achou = await p.evaluate((alvoY) => {
  let ul = null, d = Infinity;
  for (const u of document.querySelectorAll("ul")) {
    const dd = Math.abs(u.getBoundingClientRect().top + scrollY - alvoY);
    if (dd < d) { d = dd; ul = u; }
  }
  if (!ul) return null;
  ul.setAttribute("data-cj", "trilho");
  const perto = (el) => Math.abs(el.getBoundingClientRect().top + scrollY - (ul.getBoundingClientRect().top + scrollY)) < 1200;
  let nSetas = 0;
  for (const rot of ["Previous", "Next"]) {
    const c = [...document.querySelectorAll("button,[role=button]")]
      .filter((b) => b.getAttribute("aria-label") === rot && b.getBoundingClientRect().width > 0 && perto(b));
    if (c.length) { c[0].setAttribute("data-cj", rot); nSetas++; }
  }
  const dots = [...document.querySelectorAll("button,[role=button]")].filter((b) => /Scroll to page/i.test(b.getAttribute("aria-label") || "") && perto(b));
  dots.forEach((b, i) => b.setAttribute("data-cj-dot", String(i)));
  return { itens: ul.children.length, setas: nSetas, dots: dots.length };
}, ANCORA_Y);

if (!achou || achou.setas < 2) { console.log("trilho ou par de setas não achado — nada medido, nada escrito."); await nav.close(); process.exit(0); }
console.log(`trilho: ${achou.itens} itens · setas: ${achou.setas} · bolinhas: ${achou.dots}`);

const estado = () =>
  p.evaluate(() => {
    const ul = document.querySelector('[data-cj="trilho"]');
    const t = getComputedStyle(ul).transform;
    let x = 0;
    try { x = Math.round(new DOMMatrixReadOnly(t === "none" ? "" : t).e * 100) / 100; } catch {}
    const vis = [];
    [...ul.children].forEach((li, i) => {
      const f = li.firstElementChild;
      if (f && getComputedStyle(f).visibility === "visible") vis.push(i);
    });
    const larguras = [...ul.children].map((li) => { const f = li.firstElementChild; return f ? Math.round(f.getBoundingClientRect().width * 10) / 10 : 0; });
    const dots = [...document.querySelectorAll("[data-cj-dot]")].map((d) => {
      const f = d.firstElementChild || d;
      return Math.round(parseFloat(getComputedStyle(f).opacity) * 100) / 100;
    });
    const pe = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el).pointerEvents : null; };
    return { x, vis, larguraSlide: larguras[vis[0]] ?? larguras[0] ?? 0, dots, peNext: pe('[data-cj="Next"]'), pePrev: pe('[data-cj="Previous"]') };
  });

const repouso = await estado();
console.log(`repouso: x=${repouso.x} · visíveis=[${repouso.vis.join(",")}] · slide=${repouso.larguraSlide}px · bolinhas=[${repouso.dots.join(",")}] · pointer-events(Next)=${repouso.peNext}`);
if (!repouso.vis.length) { console.log("nenhum slide visível — não é carrossel de janela, nada escrito."); await nav.close(); process.exit(0); }

// --- um clique: passo, duração e curva -------------------------------------
const serie = await p.evaluate(() => new Promise((fim) => {
  const ul = document.querySelector('[data-cj="trilho"]');
  const pts = []; const t0 = performance.now();
  document.querySelector('[data-cj="Next"]').click();
  (function tick(t) {
    let x = 0;
    const tr = getComputedStyle(ul).transform;
    try { x = new DOMMatrixReadOnly(tr === "none" ? "" : tr).e; } catch {}
    pts.push([Math.round((t - t0) * 10) / 10, Math.round(x * 100) / 100]);
    if (t - t0 < 2800) requestAnimationFrame(tick); else fim(pts);
  })(performance.now());
}));
await p.waitForTimeout(400);
const depois = await estado();

const x0 = serie[0][1];
const passo = Math.round((depois.x - x0) * 10) / 10;
if (Math.abs(passo) < 10) { console.log(`o clique moveu ${passo}px — sem mecanismo a reconstruir, nada escrito.`); await nav.close(); process.exit(0); }
const janelaAndou = depois.vis.join(",") !== repouso.vis.join(",");
if (!janelaAndou) { console.log("a janela de visibilidade não mudou no clique — não é carrossel de janela, nada escrito."); await nav.close(); process.exit(0); }

const movimentos = serie.filter((s, i) => i > 0 && Math.abs(s[1] - serie[i - 1][1]) > 0.05);
const tIni = movimentos.length ? movimentos[0][0] : 0;
const dur = movimentos.length ? Math.round(movimentos[movimentos.length - 1][0] - tIni) : 0;
const curva = Array.from({ length: 25 }, (_, k) => {
  const alvoT = tIni + (dur * k) / 24;
  let q = serie[0];
  for (const s of serie) { if (s[0] <= alvoT) q = s; else break; }
  return Math.round(((q[1] - x0) / passo) * 1000) / 1000;
});

const correnteRepouso = repouso.vis[Math.floor(repouso.vis.length / 2)];
const dotAtivoRepouso = repouso.dots.findIndex((o) => o >= 0.99);
const medicao = {
  original: new URL(ROTA, ORIGINAL).href, rota: ROTA,
  itens: achou.itens, larguraSlide: repouso.larguraSlide,
  xRepouso: repouso.x, visiveisRepouso: repouso.vis, correnteRepouso,
  passoPx: passo, duracaoMs: dur, curva,
  dots: repouso.dots.length, dotAtivoRepouso,
  opacidadeAtiva: repouso.dots[dotAtivoRepouso] ?? 1,
  opacidadeInativa: repouso.dots.find((_, i) => i !== dotAtivoRepouso) ?? 0.5,
  pointerEventsControles: repouso.peNext,
  visiveisDepois: depois.vis,
};
writeFileSync(join(SAIDA, "carrossel.json"), JSON.stringify(medicao, null, 1));
console.log(`passo=${passo}px · duração=${dur}ms · corrente no repouso=${correnteRepouso} · bolinha ativa=${dotAtivoRepouso} (${medicao.opacidadeAtiva} contra ${medicao.opacidadeInativa})`);
console.log(`depois do clique: visíveis=[${depois.vis.join(",")}]  (a janela andou ${depois.vis[0] - repouso.vis[0]})`);
console.log(`-> ${join(SAIDA, "carrossel.json")}`);

if (!CID_TRILHO || !CID_PREV || !CID_NEXT) { console.log("CID_TRILHO/CID_PREV/CID_NEXT não informados — medição gravada, runtime NÃO gerado."); await nav.close(); process.exit(0); }

const largura = repouso.vis.length; // quantos slides ficam visíveis por vez
const periodo = CID_DOTS.length || 0;
const runtime = `// Gerado por scripts/gera-carrossel-janela.mjs — NÃO editar à mão.
// Carrossel de setas com os slides JÁ no DOM: o que anda é o transform do
// trilho e a JANELA de visibilidade (${largura} slides por vez, corrente ±${Math.floor(largura / 2)}).
// Passo ${passo}px, ${dur}ms, curva de 25 amostras — tudo medido no original.
(function () {
  var ROTA = ${JSON.stringify(ROTA)};
  var CFG = {
    trilho: ${JSON.stringify(CID_TRILHO)},
    prev: ${JSON.stringify(CID_PREV)},
    next: ${JSON.stringify(CID_NEXT)},
    dots: ${JSON.stringify(CID_DOTS)},
    passo: ${passo},
    dur: ${dur},
    curva: ${JSON.stringify(curva)},
    corrente: ${correnteRepouso},
    largura: ${largura},
    periodo: ${periodo},
    dotAtivo: ${dotAtivoRepouso},
    opAtiva: ${medicao.opacidadeAtiva},
    opInativa: ${medicao.opacidadeInativa}
  };

  function rotaAtual() {
    var p = location.pathname.replace(/\\/+$/, "");
    return p === "" ? "/" : p;
  }

  function montar() {
    if (rotaAtual() !== ROTA) return; // cid reinicia por rota
    var trilho = document.querySelector('[data-cid="' + CFG.trilho + '"]');
    if (!trilho) return;
    // idempotência POR TRILHO: guard global calaria a 2ª rota inteira
    if (trilho.getAttribute("data-carrossel") === "1") return;
    var prev = document.querySelector('[data-cid="' + CFG.prev + '"]');
    var next = document.querySelector('[data-cid="' + CFG.next + '"]');
    if (!prev || !next) return;
    trilho.setAttribute("data-carrossel", "1");

    var itens = trilho.children;
    var corrente = CFG.corrente;
    var x = -corrente * Math.abs(CFG.passo);
    var animando = false;
    var reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var meia = Math.floor(CFG.largura / 2);

    // 🚨 os controles do original recebem clique; no clone o <fieldset> que os
    // embrulha vem com pointer-events:none da captura e nenhum filho o
    // reativa. Sem isto o botão existe, aparece, e não recebe nada.
    var controles = [prev, next];
    for (var d = 0; d < CFG.dots.length; d++) {
      var b = document.querySelector('[data-cid="' + CFG.dots[d] + '"]');
      if (b) controles.push(b);
    }
    for (var c = 0; c < controles.length; c++) controles[c].style.pointerEvents = ${JSON.stringify(medicao.pointerEventsControles === "none" ? "none" : "auto")};

    function pintar() {
      for (var i = 0; i < itens.length; i++) {
        var filho = itens[i].firstElementChild;
        if (!filho) continue;
        filho.style.visibility = Math.abs(i - corrente) <= meia ? "visible" : "hidden";
      }
      if (CFG.periodo > 0) {
        var ativo = ((corrente % CFG.periodo) + CFG.periodo) % CFG.periodo;
        for (var k = 0; k < CFG.dots.length; k++) {
          var bd = document.querySelector('[data-cid="' + CFG.dots[k] + '"]');
          if (!bd) continue;
          var alvo = bd.firstElementChild || bd;
          alvo.style.opacity = k === ativo ? CFG.opAtiva : CFG.opInativa;
        }
      }
    }

    function interpolar(p) {
      var n = CFG.curva.length - 1;
      var i = Math.min(n - 1, Math.floor(p * n));
      var t = p * n - i;
      return CFG.curva[i] + (CFG.curva[i + 1] - CFG.curva[i]) * t;
    }

    function irPara(alvoIndice) {
      if (animando) return;
      // o conteúdo se repete a cada CFG.periodo: manter o índice no miolo do
      // trilho evita chegar na ponta, e a troca é invisível porque o slide de
      // destino mostra exatamente o mesmo depoimento
      var limite = itens.length - 1 - meia;
      if (CFG.periodo > 0) {
        while (alvoIndice > limite) alvoIndice -= CFG.periodo;
        while (alvoIndice < meia) alvoIndice += CFG.periodo;
      }
      if (alvoIndice === corrente) return;
      var de = x;
      var para = -alvoIndice * Math.abs(CFG.passo);
      corrente = alvoIndice;
      if (reduz || CFG.dur <= 0) { x = para; trilho.style.transform = "translateX(" + x + "px)"; pintar(); return; }
      animando = true;
      pintar(); // o destino aparece antes de andar, como no original
      var t0 = 0;
      function quadro(t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / CFG.dur);
        x = de + (para - de) * interpolar(p);
        trilho.style.transform = "translateX(" + x + "px)";
        if (p < 1) requestAnimationFrame(quadro);
        else { x = para; trilho.style.transform = "translateX(" + x + "px)"; animando = false; }
      }
      requestAnimationFrame(quadro);
    }

    next.addEventListener("click", function (e) { e.preventDefault(); irPara(corrente + 1); });
    prev.addEventListener("click", function (e) { e.preventDefault(); irPara(corrente - 1); });
    for (var j = 0; j < CFG.dots.length; j++) {
      (function (indice) {
        var bd = document.querySelector('[data-cid="' + CFG.dots[indice] + '"]');
        if (!bd) return;
        bd.addEventListener("click", function (e) {
          e.preventDefault();
          var atual = ((corrente % CFG.periodo) + CFG.periodo) % CFG.periodo;
          irPara(corrente + (indice - atual));
        });
      })(j);
    }

    trilho.style.transform = "translateX(" + x + "px)";
    pintar();
  }

  window.__dittoCarrosselMontar = montar;
  if (document.readyState === "complete") montar();
  else window.addEventListener("load", montar);
})();
`;

const destino = join(APP, "public", "carrossel.js");
if (ESCREVER) writeFileSync(destino, runtime);
console.log(`\n${ESCREVER ? "escrito" : "SIMULADO"}: ${destino}`);
console.log(`⚠️ falta ligar no layout: <script src="/carrossel.js" defer /> e __dittoCarrosselMontar() no religar da navegação.`);
await nav.close();
