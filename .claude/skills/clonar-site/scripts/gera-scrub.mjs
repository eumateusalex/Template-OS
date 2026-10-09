// gera-scrub.mjs — o TRANSFORM que acompanha a rolagem: parallax, cartão que
// desentorta, camada que sobe mais devagar que a página.
//
// O buraco que ele tapa (medido no framer-4): o original tem 35
// elementos cujo transform muda conforme eles atravessam a janela. O clone
// reproduz ZERO. E o pior: **nenhum gate acusa**.
//
// 🚨 Por que nenhum gate acusava. O `compara-geometria` mede com a página
// ASSENTADA e volta ao topo — e no topo o elemento ainda não entrou na janela,
// então o original está no MESMO estado inicial em que a captura congelou o
// clone. Os dois batem, a geometria dá zero, e o defeito só aparece quando
// alguém rola até lá. O cartão da seção de contato do framer-4 fica
// permanentemente torto 9° e 200px baixo no clone; no original ele endireita.
//
// O `gera-scroll.mjs` é irmão deste e não o substitui: aquele separa alterna /
// revela / contínuo e entrega CLASSES; transform ligado à rolagem precisa de
// valor contínuo a cada quadro, e classe não tem como carregar isso.
//
// Como mede (nada se digita): para cada candidato do ORIGINAL, rola de modo
// que o topo dele varra a janela inteira, e grava a matriz completa a cada
// parada, junto com a posição do topo na janela. A saída é uma CURVA
// (topo → matriz), não uma fórmula: o instrumento não supõe que seja linear.
//
// O que o faz SE CALAR:
//   - transform que muda com a PÁGINA PARADA -> é laço (marquee), não scrub:
//     sai fora, senão dois runtimes disputam a mesma propriedade
//   - elemento sem par no clone               -> declara e segue
//   - curva sem variação                      -> não é scrub, ignora
//   - par já reivindicado por outro runtime   -> declara e não escreve
//
// Uso:
//   ORIGINAL=<url> CLONE=<url> APP=<app> ROTA=/ SAIDA=<med> node gera-scrub.mjs
//
// Variáveis: ORIGINAL, CLONE, APP (obrigatórias) · ROTA (/) · LARGURA (1280)
//   PASSOS (12) · MIN (40) tamanho mínimo do candidato · ESCREVER=0 simula

import { createRequire } from "node:module";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const ORIGINAL = process.env.ORIGINAL, CLONE = process.env.CLONE, APP = process.env.APP;
if (!ORIGINAL || !CLONE || !APP) { console.error("faltam ORIGINAL/CLONE/APP"); process.exit(1); }
const ROTA = process.env.ROTA ?? "/";
const LARGURA = Number(process.env.LARGURA ?? 1280);
const PASSOS = Number(process.env.PASSOS ?? 12);
const MIN = Number(process.env.MIN ?? 40);
const SAIDA = resolve(process.env.SAIDA ?? "./scrub");
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

// ---------------------------------------------------------------------------
// Um lado: carimba os candidatos e varre a curva de cada um.
// ---------------------------------------------------------------------------
async function varrer(url, rotulo) {
  const p = await nav.newPage({ viewport: { width: LARGURA, height: 900 } });
  await p.goto(new URL(ROTA, url).href, { waitUntil: "load", timeout: 60000 });
  await p.waitForTimeout(2200);
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); }
    scrollTo(0, 0);
  });
  await p.waitForTimeout(1200);

  const n = await p.evaluate((min) => {
    let i = 0;
    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el);
      if (!/^matrix\(/.test(cs.transform)) continue;
      const q = el.getBoundingClientRect();
      if (q.width < min || q.height < min) continue;
      el.setAttribute("data-scb", String(i++));
    }
    return i;
  }, MIN);

  const curvas = await p.evaluate(
    async ({ passos }) => {
      const ler = (el) => getComputedStyle(el).transform;
      const saida = [];
      const els = [...document.querySelectorAll("[data-scb]")];
      for (const el of els) {
        // posição do elemento no documento, com a página no topo
        scrollTo(0, 0);
        // 🚨 ASSENTAR ANTES DE JULGAR. O parallax do Framer tem inércia: depois
        // de uma rolagem ele continua deslizando por mais de um segundo. Com
        // 90ms de espera, o teste de laço pegava esse rastro e declarava
        // "anda sozinho" — medido no framer-4: 33 dos 35 elementos de parallax
        // foram acusados de laço, e o instrumento não reconstruiu nenhum deles.
        await new Promise((r) => setTimeout(r, 1400));
        const r0 = el.getBoundingClientRect();
        const docY = Math.round(r0.top + scrollY);
        const caixa = { w: Math.round(r0.width), h: Math.round(r0.height) };

        // é LAÇO ou é SCRUB? Duas leituras sem rolar nada, já com tudo parado.
        // O que ainda muda anda pelo relógio, e quem cuida disso é o marquee.
        const a1 = ler(el);
        await new Promise((r) => setTimeout(r, 700));
        const laco = ler(el) !== a1;

        const amostras = [];
        const alturaJanela = innerHeight;
        // 🚨 só quem NÃO é laço ganha a varredura da curva. A camada decorativa
        // do framer-4 tem 32 elementos que saltam sozinhos, e amostrá-los custa
        // 13 paradas cada — quase todo o tempo do instrumento gasto em quem já
        // se sabe que vai ser descartado.
        for (let k = 0; !laco && k <= passos; k++) {
          // o topo do elemento varre de (janela + 350) até -250
          const topoAlvo = alturaJanela + 350 - ((alturaJanela + 600) * k) / passos;
          const alvo = Math.max(0, Math.round(docY - topoAlvo));
          scrollTo(0, alvo);
          // a mesma inércia do teste de laço vale aqui: amostrar cedo demais
          // grava o rastro do deslizamento, não a posição de repouso da curva
          await new Promise((r) => setTimeout(r, 350));
          const q = el.getBoundingClientRect();
          amostras.push({ topo: Math.round(q.top), m: ler(el) });
        }
        scrollTo(0, 0);
        const distintos = new Set(amostras.map((a) => a.m)).size;
        // quem já tem dono não entra: marquee e carrossel escrevem transform a
        // cada quadro, e dois runtimes na mesma propriedade brigam para sempre
        const dono = el.getAttribute("data-marquee") === "1" || el.getAttribute("data-carrossel") === "1" || el.closest("[data-marquee='1'],[data-carrossel='1']") !== null;
        saida.push({ id: el.getAttribute("data-scb"), cid: el.getAttribute("data-cid"), docY, caixa, laco, dono, distintos, amostras });
      }
      scrollTo(0, 0);
      return saida;
    },
    { passos: PASSOS }
  );
  await p.close();
  console.log(`${rotulo}: ${n} candidato(s) com transform · ${curvas.filter((c) => c.distintos > 1 && !c.laco).length} com curva de rolagem · ${curvas.filter((c) => c.laco).length} em laço (do marquee, fora)`);
  return curvas;
}

const oCurvas = await varrer(ORIGINAL, "ORIGINAL");
const cCurvas = await varrer(CLONE, "CLONE");

// ---------------------------------------------------------------------------
// Parear por POSIÇÃO no documento e CAIXA — o original não tem data-cid.
// ---------------------------------------------------------------------------
const scrubs = oCurvas.filter((c) => c.distintos > 1 && !c.laco);
const usados = new Set();
const casados = [];
const semPar = [];
for (const o of scrubs) {
  let melhor = null, erro = Infinity;
  for (const c of cCurvas) {
    if (usados.has(c.id) || !c.cid) continue;
    const e = Math.abs(c.docY - o.docY) + Math.abs(c.caixa.w - o.caixa.w) + Math.abs(c.caixa.h - o.caixa.h);
    if (e < erro) { erro = e; melhor = c; }
  }
  // teto: 40px somados de diferença. Um par pior que isso não é um par.
  if (!melhor || erro > 40) { semPar.push({ docY: o.docY, caixa: o.caixa, erro: melhor ? Math.round(erro) : null }); continue; }
  usados.add(melhor.id);
  if (melhor.laco || melhor.dono) { semPar.push({ docY: o.docY, caixa: o.caixa, motivo: "o par no clone já tem dono (marquee/carrossel) — não se disputa a mesma propriedade" }); continue; }
  casados.push({
    cid: melhor.cid,
    docY: o.docY,
    caixa: o.caixa,
    // a curva vai como veio: topo na janela -> matriz
    curva: o.amostras.map((a) => [a.topo, a.m]),
  });
}

const medicao = { original: new URL(ROTA, ORIGINAL).href, rota: ROTA, largura: LARGURA, comScrub: scrubs.length, casados: casados.length, semPar, itens: casados };
writeFileSync(join(SAIDA, "scrub.json"), JSON.stringify(medicao, null, 1));
console.log(`\ncom scrub no original: ${scrubs.length} · casados no clone: ${casados.length} · sem par: ${semPar.length}`);
for (const s of semPar.slice(0, 6)) console.log(`   ⚠️ sem par: y=${s.docY} ${s.caixa.w}x${s.caixa.h}${s.motivo ? " — " + s.motivo : ` (melhor erro ${s.erro})`}`);
console.log(`-> ${join(SAIDA, "scrub.json")}`);

if (!casados.length) { console.log("nenhum par — runtime NÃO escrito."); await nav.close(); process.exit(0); }

// 🚨 UM arquivo para todas as rotas, com o mapa por rota dentro. Um arquivo
// por rota daria 27 tags de <script> no layout, e o layout é único — cada rota
// carregaria o runtime das outras 26 à toa. Ao rodar de novo para outra rota, o
// mapa que já está no arquivo é lido e MESCLADO, nunca sobrescrito.
const destino = join(APP, "public", "scrub.js");
// 🚨 A fonte da verdade do mapa é um JSON ao lado, NUNCA o próprio .js.
// Reler o mapa de dentro do runtime com uma expressão regular, num lote de
// 26 rotas, perde 25: basta o arquivo estar no
// meio de uma escrita (writeFileSync trunca antes de gravar) para a leitura
// devolver vazio, e aí a rota da vez entra SOZINHA no lugar de todas. O
// sintoma é traiçoeiro — cada rodada diz "escrito" e o lote termina com um
// mapa de uma rota só.
// fora de public/, para não virar asset servido junto com o site
const mapaArq = join(APP, "scrub-mapa.json");
let mapaTudo = {};
if (existsSync(mapaArq)) {
  try { mapaTudo = JSON.parse(readFileSync(mapaArq, "utf8").replace(/^﻿/, "")); } catch { mapaTudo = {}; }
}
mapaTudo[ROTA] = casados.map((c) => ({ cid: c.cid, curva: c.curva }));
if (ESCREVER) writeFileSync(mapaArq, JSON.stringify(mapaTudo));

const runtime = `// Gerado por scripts/gera-scrub.mjs — NÃO editar à mão.
// Transform ligado à ROLAGEM (parallax, cartão que desentorta). Para cada
// elemento, a curva é uma tabela MEDIDA no original: posição do topo na janela
// -> matriz. O runtime interpola entre as amostras e trava nas pontas.
//
// 🚨 Nenhum outro runtime pode escrever transform nestes elementos: marquee e
// carrossel têm os seus, e dois donos da mesma propriedade brigam a cada quadro.
// O pareamento já descarta quem está em laço.
(function () {
  var MAPA = ${JSON.stringify(mapaTudo)};

  function rota() {
    var p = location.pathname.replace(/\\/+$/, "");
    return p === "" ? "/" : p;
  }

  function numeros(m) {
    // 🚨 "none" é a matriz IDENTIDADE, não uma amostra inválida. O cartão da
    // seção de contato do framer-4 termina a curva exatamente em none (ele
    // endireita até não ter transform nenhum); descartar esse ponto tirava
    // justamente o estado de CHEGADA da tabela.
    if (!m || m === "none") return [1, 0, 0, 1, 0, 0];
    var g = /matrix\\(([^)]+)\\)/.exec(m);
    if (!g) return null;
    var v = g[1].split(",").map(Number);
    return v.length === 6 ? v : null;
  }

  function montar() {
    var lista = MAPA[rota()];
    if (!lista) return;
    var reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var vivos = [];
    for (var i = 0; i < lista.length; i++) {
      var cfg = lista[i];
      var el = document.querySelector('[data-cid="' + cfg.cid + '"]');
      if (!el) continue;
      if (el.getAttribute("data-scrub") === "1") continue; // idempotência por elemento
      var pts = [];
      for (var k = 0; k < cfg.curva.length; k++) {
        var v = numeros(cfg.curva[k][1]);
        if (v) pts.push({ topo: cfg.curva[k][0], v: v });
      }
      if (pts.length < 2) continue;
      // ordenar por topo CRESCENTE, para a busca ser monotônica
      pts.sort(function (a, b) { return a.topo - b.topo; });
      el.setAttribute("data-scrub", "1");
      if (reduz) {
        // quem desligou movimento recebe o estado de CHEGADA (topo menor),
        // nunca o de partida — que é o estado torto
        aplicar(el, pts[0].v);
        continue;
      }
      vivos.push({ el: el, pts: pts });
    }
    if (!vivos.length) return;

    function aplicarEm(item) {
      var topo = item.el.getBoundingClientRect().top;
      var pts = item.pts;
      if (topo <= pts[0].topo) return aplicar(item.el, pts[0].v);
      if (topo >= pts[pts.length - 1].topo) return aplicar(item.el, pts[pts.length - 1].v);
      for (var i = 1; i < pts.length; i++) {
        if (topo > pts[i].topo) continue;
        var a = pts[i - 1], b = pts[i];
        var t = b.topo === a.topo ? 0 : (topo - a.topo) / (b.topo - a.topo);
        var v = [];
        for (var j = 0; j < 6; j++) v.push(a.v[j] + (b.v[j] - a.v[j]) * t);
        return aplicar(item.el, v);
      }
    }

    var pedido = false;
    function quadro() {
      pedido = false;
      for (var i = 0; i < vivos.length; i++) aplicarEm(vivos[i]);
    }
    function agendar() {
      if (pedido) return;
      pedido = true;
      requestAnimationFrame(quadro);
    }
    addEventListener("scroll", agendar, { passive: true });
    addEventListener("resize", agendar, { passive: true });
    quadro();
  }

  function aplicar(el, v) {
    el.style.transform = "matrix(" + v[0] + "," + v[1] + "," + v[2] + "," + v[3] + "," + v[4] + "," + v[5] + ")";
  }

  window.__dittoScrub = montar;
  if (document.readyState === "complete") montar();
  else window.addEventListener("load", montar);
})();
`;

if (ESCREVER) writeFileSync(destino, runtime);
console.log(`${ESCREVER ? "escrito" : "SIMULADO"}: ${destino}  (mapa com ${Object.keys(mapaTudo).length} rota(s))`);
console.log(`⚠️ falta ligar no layout e no religar da navegação (__dittoScrub).`);
await nav.close();
