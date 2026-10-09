// captura-slides.mjs — carrossel MANUAL virtualizado: captura os slides que só
// materializam ao navegar, e devolve ao clone o trilho completo + as setas.
//
// O buraco que ele tapa (medido no framer-2): o construtor
// VIRTUALIZA o carrossel — dos 12 <li> do trilho, só os ~5 perto da janela
// têm conteúdo; o resto é casca vazia. O ditto fotografa esse instante: o
// clone nasce com fragmentos do slide visível e nenhum mecanismo. Nenhuma
// medição de rota/metadata/conteúdo/geometria acusa, porque em repouso a
// página está certa. A falta só aparece quando alguém clica na seta.
//
// O que faz:
//   1. no ORIGINAL: acha o trilho (ul com pai overflow:hidden e transform)
//      e as setas por aria-label perto dele
//   2. clica Next e amostra o transform por rAF: passo (px), duração e curva
//      normalizada saem MEDIDOS — nenhum número digitado
//   3. segue clicando e serializa o slide corrente (estilo computado inline,
//      método do captura-estado) até o ciclo fechar (hash repetir)
//   4. baixa as imagens dos slides para public/assets/slides/ (deixar o src
//      no CDN da origem quebra no dia em que o site sair do ar)
//   5. escreve public/carrossel-depoimentos.js: reconstrói o trilho no clone
//      (cópias dos slides únicos), religa Previous/Next com a mola medida e a
//      normalização de janela do original, idempotente
//      (window.__dittoCarrossel), e com prefers-reduced-motion instantâneo
//
// O que o faz SE CALAR (todo gerador precisa saber não escrever):
//   - trilho ou setas não achados            -> declara e sai sem escrever
//   - o clique não move o trilho (|Δ| < 10)  -> declara e sai sem escrever
//   - ciclo não fecha em MAX_PASSOS          -> declara o que capturou e sai
//   - CIDS não informados para o clone       -> grava medição, não gera runtime
//
// Uso:
//   ORIGINAL=https://site.com ROTA=/ APP=<app> SAIDA=<med>/slides \
//   CID_TRILHO=n1209 CID_PREV=n1283 CID_NEXT=n1285 node captura-slides.mjs
//
// Variáveis:
//   ORIGINAL    URL do original (obrigatória)
//   ROTA        rota (padrão /)
//   APP         raiz do app clonado (obrigatória para escrever o runtime)
//   SAIDA       pasta de medição (padrão ./slides)
//   CID_TRILHO  data-cid do ul do trilho NO CLONE (sem ele: só mede)
//   CID_PREV    data-cid da seta Previous no clone
//   CID_NEXT    data-cid da seta Next no clone
//   MAX_PASSOS  teto de cliques (padrão 12)
//   ESPERA      ms para assentar depois do clique (padrão 2000)
//   ESCREVER    0 simula sem tocar em arquivo
//   DITTO       raiz do ditto (padrão C:/dev/ditto)

import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const ORIGINAL = process.env.ORIGINAL;
if (!ORIGINAL) { console.error("falta ORIGINAL=<url>"); process.exit(1); }
const ROTA = process.env.ROTA ?? "/";
const APP = process.env.APP;
const SAIDA = resolve(process.env.SAIDA ?? "./slides");
const CID_TRILHO = process.env.CID_TRILHO;
const CID_PREV = process.env.CID_PREV;
const CID_NEXT = process.env.CID_NEXT;
const MAX_PASSOS = Number(process.env.MAX_PASSOS ?? 12);
const ESPERA = Number(process.env.ESPERA ?? 2000);
const ESCREVER = process.env.ESCREVER !== "0";
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
mkdirSync(SAIDA, { recursive: true });

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1280, height: 900 } });
await pagina.goto(new URL(ROTA, ORIGINAL).href, { waitUntil: "load", timeout: 60000 });
await pagina.waitForTimeout(2500);

// ---------------------------------------------------------------- o trilho
// 🚨 A escolha NÃO pode ser "o primeiro <ul> do DOM": no framer-4 o primeiro
// é o marquee de LOGOS (45 itens, y=8842) e o carrossel de depoimentos vem
// 440px abaixo (y≈9283). Clicando as setas do carrossel e lendo o transform do
// MARQUEE, o instrumento "mede" passo=75.1px, que é a deriva do laço no
// intervalo entre dois cliques, captura 2 "slides" que são logos SVG sem texto
// e escreve um runtime inteiro de mentira. Nenhum guard pega: o passo é > 10px
// e o ciclo "fecha" em 2.
//
// A escolha tem três filtros, nesta ordem:
//   1. ANCORA=<texto>, quando o operador já sabe qual trilho é;
//   2. AUTONOMIA — trilho que anda sozinho com a página parada é marquee, não
//      carrossel manual, e sai da disputa (é o teste que pegaria o framer-4);
//   3. proximidade de um par completo de setas Previous/Next.
const ANCORA = process.env.ANCORA;

const candidatos = await pagina.evaluate(() => {
  const uls = [...document.querySelectorAll("ul")].filter(
    (u) => u.parentElement && getComputedStyle(u.parentElement).overflow === "hidden" && getComputedStyle(u).transform !== "none"
  );
  const setas = [...document.querySelectorAll("button,[role='button']")]
    .filter((b) => ["Previous", "Next"].includes(b.getAttribute("aria-label")) && b.getBoundingClientRect().width > 0)
    .map((b) => ({ rotulo: b.getAttribute("aria-label"), y: b.getBoundingClientRect().top + scrollY }));
  return uls.map((u, i) => {
    u.setAttribute("data-cs-cand", String(i));
    const secY = u.getBoundingClientRect().top + scrollY;
    const perto = setas.filter((s) => Math.abs(s.y - secY) < 900);
    const dists = perto.map((s) => Math.abs(s.y - secY));
    return {
      i: String(i),
      secY: Math.round(secY),
      itens: u.children.length,
      texto: (u.innerText || "").replace(/\s+/g, " ").trim().slice(0, 60),
      temPar: perto.some((s) => s.rotulo === "Next") && perto.some((s) => s.rotulo === "Previous"),
      distSetas: dists.length ? Math.round(Math.min(...dists)) : null,
    };
  });
});

if (!candidatos.length) {
  console.log("nenhum <ul> com pai overflow:hidden e transform próprio — nada a capturar, nada escrito.");
  await navegador.close();
  process.exit(0);
}

// Teste de autonomia, um candidato por vez. Rolar até ele é OBRIGATÓRIO: o
// Framer PAUSA laço fora da janela, e medir do topo declara "parado"
// justamente o marquee que se quer desqualificar.
for (const c of candidatos) {
  await pagina.evaluate((y) => scrollTo(0, Math.max(0, y - 350)), c.secY);
  await pagina.waitForTimeout(900);
  const ler = () => pagina.evaluate((i) => getComputedStyle(document.querySelector(`[data-cs-cand="${i}"]`)).transform, c.i);
  const a = await ler();
  await pagina.waitForTimeout(1400);
  c.autonomo = a !== (await ler());
  console.log(`  candidato [${c.i}] y=${c.secY} itens=${c.itens} setas=${c.temPar ? `par a ${c.distSetas}px` : "sem par"} · ${c.autonomo ? "🎠 ANDA SOZINHO (marquee)" : "parado"} ${JSON.stringify(c.texto.slice(0, 34))}`);
}

const elegiveis = candidatos.filter((c) => !c.autonomo && c.temPar).sort((a, b) => a.distSetas - b.distSetas);
const escolhido = (ANCORA && candidatos.find((c) => c.texto.includes(ANCORA))) || elegiveis[0];

if (!escolhido) {
  console.log(`nenhum dos ${candidatos.length} trilhos é carrossel MANUAL (todos andam sozinhos, ou nenhum tem par de setas) — nada capturado, nada escrito.`);
  await navegador.close();
  process.exit(0);
}
if (escolhido.autonomo) console.log("⚠️ ANCORA forçou um trilho que anda sozinho — medindo assim mesmo, sob declaração.");

const alvo = await pagina.evaluate((i) => {
  const u = document.querySelector(`[data-cs-cand="${i}"]`);
  u.setAttribute("data-cs", "trilho");
  const secY = u.getBoundingClientRect().top + scrollY;
  // exatamente UMA seta de cada rótulo, a mais próxima e visível: o site emite
  // uma variante do carrossel por breakpoint, e marcar as duas deixaria o
  // seletor ambíguo na hora do clique
  const todas = [...document.querySelectorAll("button,[role='button']")].filter((b) =>
    ["Previous", "Next"].includes(b.getAttribute("aria-label")) && b.getBoundingClientRect().width > 0
  );
  for (const rotulo of ["Previous", "Next"]) {
    const meus = todas
      .filter((b) => b.getAttribute("aria-label") === rotulo)
      .map((b) => ({ b, d: Math.abs(b.getBoundingClientRect().top + scrollY - secY) }))
      .filter((o) => o.d < 900)
      .sort((x, y) => x.d - y.d);
    if (meus.length) meus[0].b.setAttribute("data-cs", rotulo);
  }
  const m = new DOMMatrixReadOnly(getComputedStyle(u).transform);
  return { secY, itens: u.children.length, x0: m.e, temNext: !!document.querySelector('[data-cs="Next"]') };
}, escolhido.i);

if (!alvo.temNext) {
  console.log("seta Next não achada perto do trilho escolhido — nada a capturar, nada escrito.");
  await navegador.close();
  process.exit(0);
}
console.log(`trilho escolhido: [${escolhido.i}] ${alvo.itens} itens, x0=${Math.round(alvo.x0 * 10) / 10}, secY=${Math.round(alvo.secY)}`);
await pagina.evaluate((y) => scrollTo(0, Math.max(0, y - 350)), alvo.secY);
await pagina.waitForTimeout(1200);

// ------------------------------------------------- passo, duração e curva
const lerX = () => pagina.evaluate(() => new DOMMatrixReadOnly(getComputedStyle(document.querySelector('[data-cs="trilho"]')).transform).e);

const antesX = await lerX();
await pagina.click('[data-cs="Next"]', { timeout: 4000 });
const serie = await pagina.evaluate(
  (ms) => new Promise((fim) => {
    const el = document.querySelector('[data-cs="trilho"]');
    const pts = []; const t0 = performance.now();
    (function tick(t) {
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      pts.push([t - t0, m.e]);
      if (t - t0 < ms) requestAnimationFrame(tick); else fim(pts);
    })(performance.now());
  }),
  ESPERA + 600
);
// o assentamento pode terminar num teleporte de normalização — o passo é a
// maior variação CONTÍNUA (sem salto > passoBruto/2)
let fimAnim = serie.length - 1;
for (let i = 1; i < serie.length; i++) {
  if (Math.abs(serie[i][1] - serie[i - 1][1]) > 400) { fimAnim = i - 1; break; }
}
const passo = Math.round((serie[fimAnim][1] - antesX) * 10) / 10;
if (Math.abs(passo) < 10) {
  console.log(`clique em Next moveu só ${passo}px — sem mecanismo a reconstruir, nada escrito.`);
  await navegador.close();
  process.exit(0);
}
const emMov = serie.filter((p, i) => i > 0 && i <= fimAnim && Math.abs(p[1] - serie[i - 1][1]) > 0.05);
const duracao = emMov.length ? Math.round(emMov[emMov.length - 1][0] - emMov[0][0]) : 0;
const t0 = emMov.length ? emMov[0][0] : 0;
const curva = Array.from({ length: 25 }, (_, k) => {
  const alvoT = t0 + (duracao * k) / 24;
  let p = serie[0];
  for (const q of serie.slice(0, fimAnim + 1)) { if (q[0] <= alvoT) p = q; else break; }
  return Math.round(((p[1] - antesX) / passo) * 1000) / 1000;
});
const depoisX = await lerX();
console.log(`passo=${passo}px duração=${duracao}ms xDepoisDaNormalização=${Math.round(depoisX)}`);

// ------------------------------------------- os slides únicos, por ciclo
const SERIALIZAR = `(function(){
  const escapar = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const PROPS = ["display","position","top","left","right","bottom","width","height","min-width","min-height","max-width","flex","flex-direction","flex-wrap","align-items","justify-content","gap","row-gap","column-gap","margin","padding","transform","opacity","overflow","border-radius","border","background","background-color","background-image","background-size","background-position","color","font-family","font-size","font-weight","line-height","letter-spacing","text-align","white-space","box-shadow","z-index","object-fit","object-position","inset","aspect-ratio","filter","backdrop-filter","pointer-events","text-decoration","text-transform","cursor","outline","visibility","will-change","grid-template-columns","grid-template-rows","place-items"];
  function serializar(el){
    if (el.nodeType === 3) return escapar(el.textContent);
    if (el.nodeType !== 1) return "";
    const cs = getComputedStyle(el);
    const estilo = PROPS.map(p=>[p,cs.getPropertyValue(p)])
      .filter(([,v])=>v && v!=="none" && v!=="normal" && v!=="auto" && v!=="0px" && v!=="static" && v!=="visible")
      .map(([p,v])=>p+":"+v).join(";");
    const tag = el.tagName.toLowerCase();
    const attrs = ["src","srcset","alt","href","aria-label","aria-hidden","role"].filter(a=>el.hasAttribute(a))
      .map(a=>" "+a+"=\\""+escapar(el.getAttribute(a))+"\\"").join("");
    const dentro = [...el.childNodes].map(serializar).join("");
    if (tag==="img"||tag==="br") return "<"+tag+attrs+" style=\\""+escapar(estilo)+"\\"/>";
    return "<"+tag+attrs+" style=\\""+escapar(estilo)+"\\">"+dentro+"</"+tag+">";
  }
  return serializar;
})()`;

const slideCorrente = () =>
  pagina.evaluate((SER) => {
    const serializar = eval(SER);
    const u = document.querySelector('[data-cs="trilho"]');
    // o slide corrente: o li com conteúdo cujo centro está mais perto do
    // centro da janela do trilho
    const rJanela = u.parentElement.getBoundingClientRect();
    const cx = rJanela.left + rJanela.width / 2;
    let melhor = null, melhorDist = Infinity;
    // ⚠️ o li pode ter largura 0 (conteúdo filho absoluto transborda a caixa,
    // medido no framer-2) — a caixa útil é a UNIÃO dos rects dos filhos
    const caixaUtil = (li) => {
      let r = li.getBoundingClientRect();
      if (r.width >= 50) return r;
      let l = Infinity, t = Infinity, rt = -Infinity, b = -Infinity;
      for (const f of li.querySelectorAll("*")) {
        const rf = f.getBoundingClientRect();
        if (rf.width === 0 && rf.height === 0) continue;
        l = Math.min(l, rf.left); t = Math.min(t, rf.top);
        rt = Math.max(rt, rf.right); b = Math.max(b, rf.bottom);
      }
      if (!isFinite(l)) return r;
      return { left: l, top: t, width: rt - l, height: b - t };
    };
    [...u.children].forEach((li, i) => {
      if (!(li.innerText || "").trim() && !li.querySelector("img")) return;
      const r = caixaUtil(li);
      if (r.width < 50) return;
      const d = Math.abs(r.left + r.width / 2 - cx);
      if (d < melhorDist) { melhorDist = d; melhor = { i, li }; }
    });
    if (!melhor) return null;
    const r = caixaUtil(melhor.li);
    return {
      indice: melhor.i,
      w: Math.round(r.width * 10) / 10,
      h: Math.round(r.height * 10) / 10,
      texto: (melhor.li.innerText || "").replace(/\s+/g, " ").trim().slice(0, 70),
      html: serializar(melhor.li),
      imgs: [...melhor.li.querySelectorAll("img")].map((im) => im.currentSrc || im.src),
    };
  }, SERIALIZAR);

const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(16); };

const slides = [];
const vistos = new Set();
let fechou = false;
for (let k = 0; k < MAX_PASSOS; k++) {
  const s = await slideCorrente();
  if (s) {
    const h = hash(s.texto || s.html.slice(0, 400));
    if (vistos.has(h)) { if (slides.length >= 2) { fechou = true; break; } }
    else { vistos.add(h); slides.push({ ...s, hash: h, ordem: slides.length }); console.log(`  slide ${slides.length}: [li ${s.indice}] ${s.w}x${s.h} ${JSON.stringify(s.texto.slice(0, 45))}`); }
  }
  await pagina.click('[data-cs="Next"]', { timeout: 4000 });
  await pagina.waitForTimeout(ESPERA);
}
if (!fechou) console.log(`⚠️ ciclo NÃO fechou em ${MAX_PASSOS} passos — capturados ${slides.length} slides; o conjunto pode estar incompleto e vai DECLARADO.`);
else console.log(`ciclo fechou: ${slides.length} slides únicos.`);

// -------------------------------------------------- baixar as imagens
const mapaImg = {};
if (APP && ESCREVER) {
  mkdirSync(join(APP, "public", "assets", "slides"), { recursive: true });
  for (const s of slides) {
    for (const u of s.imgs) {
      if (mapaImg[u]) continue;
      try {
        const r = await fetch(u);
        const buf = Buffer.from(await r.arrayBuffer());
        const ext = (u.match(/\.(png|jpe?g|webp|avif|svg|gif)(\?|$)/i)?.[1] ?? "png").toLowerCase();
        const nome = `${hash(u)}.${ext}`;
        writeFileSync(join(APP, "public", "assets", "slides", nome), buf);
        mapaImg[u] = `/assets/slides/${nome}`;
      } catch (e) {
        console.log(`  ⚠️ imagem não baixou (fica declarada, src mantido): ${u}`);
      }
    }
    for (const [de, para] of Object.entries(mapaImg)) s.html = s.html.split(de).join(para);
  }
}

const medicao = {
  original: new URL(ROTA, ORIGINAL).href,
  x0: alvo.x0, itensOriginais: alvo.itens,
  passoPx: passo, duracaoMs: duracao, curva,
  xAposNormalizacao: Math.round(depoisX * 10) / 10,
  cicloFechou: fechou,
  slides: slides.map(({ html, ...resto }) => resto),
};
writeFileSync(join(SAIDA, "slides.json"), JSON.stringify(medicao, null, 2));
console.log(`-> ${join(SAIDA, "slides.json")}`);

if (!CID_TRILHO || !CID_PREV || !CID_NEXT || !APP) {
  console.log("CID_TRILHO/CID_PREV/CID_NEXT/APP não informados — medição gravada, runtime NÃO gerado.");
  await navegador.close();
  process.exit(0);
}
if (slides.length < 2) {
  // 🚨 guard: runtime sem slides seria markup inventado — o defeito mais caro
  console.log(`só ${slides.length} slide(s) capturado(s) — runtime NÃO gerado (mínimo 2). Medição fica declarada em slides.json.`);
  await navegador.close();
  process.exit(2);
}

// -------------------------------------------------- o runtime do clone
const N_COPIAS = Math.max(2, Math.round(alvo.itens / slides.length));
const período = Math.abs(passo) * slides.length;
const runtime = `// Gerado por scripts/captura-slides.mjs — NÃO editar à mão.
// Trilho de carrossel manual virtualizado: o original só materializa os
// slides perto da janela; aqui o trilho nasce completo (${N_COPIAS}x${slides.length} slides)
// e as setas reproduzem o passo MEDIDO: ${passo}px em ${duracao}ms, com a
// normalização de janela do original (período ${período}px).
(function () {
  // (sem guard global de "roda uma vez": há UM arquivo por rota e o guard
  // fazia o segundo arquivo retornar antes de registrar — a idempotência real
  // vem do data-carrossel por trilho e do registro em __dittoCarrosselFns)
  var SLIDES = ${JSON.stringify(slides.map((s) => s.html))};
  var PASSO = ${passo};
  var DUR = ${duracao};
  var CURVA = ${JSON.stringify(curva)};
  var PERIODO = ${período};
  // repouso = o x ANTES de qualquer clique (o mesmo em que o clone congelou);
  // usar o x pós-clique montaria o trilho um slide adiantado
  var X_REPOUSO = ${Math.round(antesX * 10) / 10};
  function montar() {
    // 🚨 guarda de ROTA: o cid REINICIA por rota — sem isto, o script global
    // (layout) sequestraria o elemento de mesmo cid em outra página
    if (location.pathname.replace(/\\/+$/, "") !== ${JSON.stringify(ROTA.replace(/\/+$/, ""))}) return;
    var trilho = document.querySelector('ul[data-cid="${CID_TRILHO}"]');
    var prev = document.querySelector('[data-cid="${CID_PREV}"]');
    var next = document.querySelector('[data-cid="${CID_NEXT}"]');
    if (!trilho || !prev || !next || trilho.getAttribute("data-carrossel") === "1") return;
    trilho.setAttribute("data-carrossel", "1");
    var slotW = Math.abs(PASSO);
    var slideW = ${JSON.stringify(slides[0] ? slides[0].w : 1060)};
    var N_SLOTS = ${N_COPIAS} * SLIDES.length;
    // 🚨 VIRTUALIZAÇÃO IGUAL À DO ORIGINAL: em repouso ele só preenche o slot
    // corrente ±2 (medido: dos 12 li, 5 com conteúdo). Materializar tudo fez o
    // compara-geometria acusar 99 elementos "só no clone". Slot vazio nasce
    // vazio e ganha conteúdo quando a navegação aproxima dele.
    var html = "";
    for (var k = 0; k < N_SLOTS; k++)
      html += '<li data-slot="' + k + '" style="flex:none;width:' + slideW + 'px;position:relative"></li>';
    trilho.innerHTML = html;
    trilho.style.display = "flex";
    trilho.style.gap = (slotW - slideW) + "px";
    var SLOT_REPOUSO = ${Math.round(Math.abs(antesX) / Math.abs(passo))}; // derivado da medição: |x repouso| / |passo|
    function slotCorrente() { return Math.round((X_REPOUSO - x) / slotW) + SLOT_REPOUSO; }
    function preencher() {
      var atual = slotCorrente();
      for (var k = Math.max(0, atual - 2); k <= Math.min(N_SLOTS - 1, atual + 2); k++) {
        var li = trilho.children[k];
        if (li && !li.firstChild) li.innerHTML = SLIDES[((k - 1) % SLIDES.length + SLIDES.length) % SLIDES.length];
      }
    }
    var x = X_REPOUSO;
    trilho.style.transform = "translateX(" + x + "px)";
    preencher();
    var animando = false;
    var reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
    function aplicar() { trilho.style.transform = "translateX(" + x + "px)"; }
    function animarPara(alvo, fim) {
      if (reduz) { x = alvo; aplicar(); fim && fim(); return; }
      var de = x, t0 = performance.now();
      animando = true;
      (function tick(t) {
        var p = Math.min(1, (t - t0) / DUR);
        var idx = p * (CURVA.length - 1);
        var i0 = Math.floor(idx), i1 = Math.min(CURVA.length - 1, i0 + 1);
        var f = CURVA[i0] + (CURVA[i1] - CURVA[i0]) * (idx - i0);
        x = de + (alvo - de) * f;
        aplicar();
        if (p < 1) requestAnimationFrame(tick);
        else { x = alvo; aplicar(); animando = false; fim && fim(); }
      })(t0);
    }
    // a janela de repouso do original é [X_REPOUSO - PERIODO + PASSO, X_REPOUSO]
    // (medido: settles em [-5350, -3210]); o wrap é um teleporte de PERIODO
    next.addEventListener("click", function (e) {
      e.preventDefault();
      if (animando) return;
      animarPara(x + PASSO, function () {
        if (x <= X_REPOUSO - PERIODO + 1) { x += PERIODO; aplicar(); }
        preencher();
      });
      preencher();
    });
    prev.addEventListener("click", function (e) {
      e.preventDefault();
      if (animando) return;
      if (x - PASSO > X_REPOUSO + 1) { x -= PERIODO; aplicar(); preencher(); }
      animarPara(x - PASSO, preencher);
      preencher();
    });
  }
  // 🚨 ESPERAR A HIDRATAÇÃO DO PRÓPRIO TRILHO antes de MUTAR o DOM.
  // O montar() troca os filhos do trilho (slots virtualizados); feito antes de
  // o React hidratar AQUELE nó, ele acusa mismatch (React error #418). Esperar
  // "algum nó" não basta: o React hidrata progressivamente e um trilho no fim
  // da página ainda não foi processado quando o primeiro filho do body já tem
  // __reactFiber$ — medido, a mesma rota alternava entre erro e limpo. O nó com
  // __reactFiber$/__reactProps$ é um nó que o React já casou: dali, mutar é
  // seguro. Teto de 6s para não travar num documento sem React.
  function montarQuandoHidratado() {
    var trilho = document.querySelector('ul[data-cid="${CID_TRILHO}"]');
    if (!trilho) return montar();
    var t0 = Date.now();
    (function tenta() {
      var ks = Object.keys(trilho);
      var pronto = false;
      for (var i = 0; i < ks.length; i++) {
        if (ks[i].indexOf("__reactFiber$") === 0 || ks[i].indexOf("__reactProps$") === 0) { pronto = true; break; }
      }
      if (pronto || Date.now() - t0 > 6000) montar();
      else requestAnimationFrame(tenta);
    })();
  }
  if (document.readyState === "complete") montarQuandoHidratado();
  else window.addEventListener("load", montarQuandoHidratado);
  // registro ADITIVO: cada rota tem o seu runtime; o chamador global executa
  // todos, e a guarda de rota de cada montar decide quem age
  (window.__dittoCarrosselFns = window.__dittoCarrosselFns || []).push(montar);
  window.__dittoCarrosselMontar = function () {
    for (var i = 0; i < window.__dittoCarrosselFns.length; i++) window.__dittoCarrosselFns[i]();
  };
})();
`;
if (ESCREVER) {
  // ⚠️ nome POR ROTA: com nome fixo, a última rota gerada sobrescrevia as
  // anteriores (medido: o runtime da home sumiu quando o /full-story rodou) —
  // a mesma armadilha já documentada no scroll.js
  const slugRota = ROTA === "/" ? "" : "-" + ROTA.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9-]/gi, "-");
  const nomeArq = `carrossel-depoimentos${slugRota}.js`;
  writeFileSync(join(APP, "public", nomeArq), runtime);
  console.log(`✅ ${join(APP, "public", nomeArq)} (${runtime.length} bytes)`);
  console.log('falta ligar no layout: <script src="/carrossel-depoimentos.js" defer />');
} else {
  console.log("(ESCREVER=0: runtime simulado, nada gravado)");
}
await navegador.close();
