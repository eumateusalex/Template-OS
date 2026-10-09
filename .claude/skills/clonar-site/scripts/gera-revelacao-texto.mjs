// gera-revelacao-texto.mjs — devolve ao clone a REVELAÇÃO DE TEXTO guiada pelo
// scroll: o parágrafo que acende letra a letra conforme a seção sobe na janela.
//
// 🚨 Classe de defeito medida no framer-4. O
// bloco nasce com cada letra em `opacity: .1` e vai a 1 conforme o scroll
// avança. O ditto captura o estado de repouso e não traz mecanismo nenhum:
// no clone o parágrafo inteiro fica em 10% de opacidade, PRATICAMENTE
// INVISÍVEL, e nenhuma medição de rota, metadata, conteúdo ou geometria
// acusa — o texto está lá, no lugar certo, apenas apagado.
//
// Medido no /expertise: 294 letras, opacidade 0.1 → 1, acendendo LINEARMENTE
// com o scroll (scrub puro, sem ease), do instante em que o topo do bloco
// está a ~780px da janela até ele chegar ao topo.
//
// O motor é o GSAP ScrollTrigger com `scrub`, que é a escolha desta skill para
// animação guiada por scroll (referencias/comportamento.md) — ele refaz as
// contas sozinho no resize, o que um ouvinte de scroll à mão erra.
//
// O método:
//   1. no ORIGINAL, acha blocos cujas FOLHAS estão todas com opacidade < 1 em
//      repouso (com o bloco ainda abaixo da dobra);
//   2. varre o scroll medindo quantas folhas já acenderam, e ajusta a reta:
//      de que posição do topo do bloco (em px da janela) até qual ele vai de
//      0 a 100% aceso — nenhum número é digitado;
//   3. casa o bloco no CLONE pelo começo do texto, confere que a contagem de
//      folhas BATE, e pega o data-cid;
//   4. escreve `revelacao.css` da rota (marca o bloco e guarda os números
//      medidos numa propriedade customizada) e `public/revelacao.js` (global,
//      genérico, idempotente, sem dado de rota dentro).
//
// O que o faz SE CALAR:
//   - nenhum bloco apagado no original          -> declara, não escreve
//   - bloco não casa no clone pelo texto        -> declara ESSE, segue
//   - contagem de folhas diferente              -> declara ESSE, segue
//   - a revelação não chega a 100%              -> declara ESSE, segue
//   - reta com menos de 4 pontos medidos        -> declara ESSE, segue
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8093 APP=<app> \
//   ROTA=/expertise node gera-revelacao-texto.mjs
//
// Variáveis:
//   ROTAS     rotas.json (roda em todas) — alternativa a ROTA
//   LARGURA   viewport medido (padrão 1280) · ALTURA (padrão 900)
//   MIN_FOLHAS  quantas folhas apagadas para valer como bloco (padrão 8)
//   ESCREVER  0 simula

import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ORIGINAL = process.env.ORIGINAL;
const CLONE = process.env.CLONE;
const APP = process.env.APP;
if (!ORIGINAL || !CLONE || !APP) {
  console.error("faltam ORIGINAL, CLONE e/ou APP");
  process.exit(1);
}
const LARGURA = Number(process.env.LARGURA ?? 1280);
const ALTURA = Number(process.env.ALTURA ?? 900);
const MIN_FOLHAS = Number(process.env.MIN_FOLHAS ?? 8);
const ESCREVER = process.env.ESCREVER !== "0";
const DITTO = process.env.DITTO ?? "C:/dev/ditto";

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

function rotasAlvo() {
  if (process.env.ROTAS) {
    const j = JSON.parse(readFileSync(process.env.ROTAS, "utf8"));
    const lista = Array.isArray(j) ? j : (j.rotas ?? []);
    return lista
      .map((r) => (typeof r === "string" ? r : (r.rota ?? r.caminho)))
      .filter((r) => typeof r === "string" && r !== "/404");
  }
  return [process.env.ROTA ?? "/"];
}

const pastaDaRota = (rota) => join(APP, "src", "app", rota === "/" ? "" : rota.replace(/^\//, ""));

const percorrer = async (p) => {
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 55));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
};

// --- no ORIGINAL: achar blocos apagados em repouso -------------------------
const acharBlocos = (minFolhas) => {
  const blocos = [];
  for (const el of document.querySelectorAll("h1,h2,h3,h4,p,div")) {
    const folhas = [...el.querySelectorAll("*")].filter((e) => e.children.length === 0);
    if (folhas.length < minFolhas) continue;
    // todas as folhas apagadas, e todas com o MESMO valor (é um estado, não estilo)
    const ops = folhas.map((e) => Number(getComputedStyle(e).opacity));
    const min = Math.min(...ops);
    const max = Math.max(...ops);
    if (max >= 0.95 || min !== max) continue;
    // o menor elemento que contém tudo: ignorar ancestrais que repetem o conjunto
    const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 20) continue;
    blocos.push({
      texto: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60),
      folhas: folhas.length,
      opRepouso: min,
      topoDoc: Math.round(r.top + window.scrollY),
      altura: Math.round(r.height),
    });
  }
  // tirar ancestrais: fica o de MENOS folhas para cada texto igual
  const porTexto = new Map();
  for (const b of blocos) {
    const atual = porTexto.get(b.texto);
    if (!atual || b.folhas < atual.folhas) porTexto.set(b.texto, b);
  }
  return [...porTexto.values()];
};

const contarAcesas = (texto) => {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  let alvo = null;
  for (const el of document.querySelectorAll("h1,h2,h3,h4,p,div")) {
    if (norm(el.textContent).slice(0, 60) === texto) alvo = el;
  }
  if (!alvo) return null;
  const folhas = [...alvo.querySelectorAll("*")].filter((e) => e.children.length === 0);
  const ops = folhas.map((e) => Number(getComputedStyle(e).opacity));
  const r = alvo.getBoundingClientRect();
  return { acesas: ops.filter((o) => o > 0.5).length, total: ops.length, topoJanela: Math.round(r.top) };
};

const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: LARGURA, height: ALTURA } });
const page = await ctx.newPage();

let totalBlocos = 0;
const declaradas = [];
let escreveuRuntime = false;

for (const rota of rotasAlvo()) {
  await page.goto(new URL(rota, ORIGINAL).href, { waitUntil: "networkidle", timeout: 60000 });
  await percorrer(page);
  const candidatos = await page.evaluate(acharBlocos, MIN_FOLHAS);

  if (!candidatos.length) {
    console.log(`✅ ${rota}: nenhum bloco de texto apagado`);
    continue;
  }

  const medidos = [];
  for (const c of candidatos) {
    // varrer o scroll e ajustar a reta acesas(topoJanela)
    const inicio = Math.max(0, c.topoDoc - ALTURA - 100);
    const fim = c.topoDoc + c.altura + 100;
    const passo = Math.max(24, Math.round((fim - inicio) / 30));
    const pontos = [];
    for (let y = inicio; y <= fim; y += passo) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await new Promise((r) => setTimeout(r, 190));
      const m = await page.evaluate(contarAcesas, c.texto);
      if (m) pontos.push(m);
    }
    await page.evaluate(() => window.scrollTo(0, 0));

    const parciais = pontos.filter((p) => p.acesas > 0 && p.acesas < p.total);
    const cheios = pontos.filter((p) => p.acesas === p.total);
    if (!cheios.length) {
      declaradas.push({ rota, motivo: `${JSON.stringify(c.texto.slice(0, 26))}: nunca chega a 100% aceso` });
      continue;
    }
    if (parciais.length < 4) {
      declaradas.push({ rota, motivo: `${JSON.stringify(c.texto.slice(0, 26))}: só ${parciais.length} ponto(s) parcial(is), reta não confiável` });
      continue;
    }
    // reta: acesas = a*topoJanela + b  ->  topo de 0% e de 100%
    const n = parciais.length;
    const sx = parciais.reduce((s, p) => s + p.topoJanela, 0);
    const sy = parciais.reduce((s, p) => s + p.acesas, 0);
    const sxy = parciais.reduce((s, p) => s + p.topoJanela * p.acesas, 0);
    const sxx = parciais.reduce((s, p) => s + p.topoJanela * p.topoJanela, 0);
    const a = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    const b0 = (sy - a * sx) / n;
    if (!isFinite(a) || a >= 0) {
      declaradas.push({ rota, motivo: `${JSON.stringify(c.texto.slice(0, 26))}: reta sem inclinação utilizável` });
      continue;
    }
    const topoInicio = Math.round((0 - b0) / a); // onde 0 acesas
    const topoFim = Math.round((c.folhas - b0) / a); // onde todas acesas
    medidos.push({ ...c, topoInicio, topoFim, pontos: parciais.length });
  }

  if (!medidos.length) {
    console.log(`⚠️ ${rota}: candidatos achados, nenhum medido com confiança`);
    continue;
  }

  // casar no CLONE
  await page.goto(new URL(rota, CLONE).href + "?_v=" + Date.now(), { waitUntil: "networkidle", timeout: 60000 });
  await percorrer(page);
  const casados = await page.evaluate((alvos) => {
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
    return alvos.map((t) => {
      let el = null;
      for (const e of document.querySelectorAll("h1,h2,h3,h4,p,div")) {
        if (norm(e.textContent).slice(0, 60) === t.texto) {
          const folhas = [...e.querySelectorAll("*")].filter((f) => f.children.length === 0);
          if (!el || folhas.length < el.folhas) el = { cid: e.getAttribute("data-cid"), folhas: folhas.length };
        }
      }
      return el;
    });
  }, medidos.map((m) => ({ texto: m.texto })));

  const aprovados = [];
  medidos.forEach((m, i) => {
    const c = casados[i];
    if (!c) {
      declaradas.push({ rota, motivo: `${JSON.stringify(m.texto.slice(0, 26))}: não achado no clone` });
      return;
    }
    if (!c.cid) {
      declaradas.push({ rota, motivo: `${JSON.stringify(m.texto.slice(0, 26))}: sem data-cid no clone` });
      return;
    }
    if (c.folhas !== m.folhas) {
      declaradas.push({
        rota,
        motivo: `${JSON.stringify(m.texto.slice(0, 26))}: ${m.folhas} folhas no original × ${c.folhas} no clone`,
      });
      return;
    }
    aprovados.push({ ...m, cid: c.cid });
  });

  if (!aprovados.length) {
    console.log(`⚠️ ${rota}: nenhum bloco aprovado no casamento`);
    continue;
  }

  console.log(`\n=== ${rota}`);
  for (const a of aprovados) {
    console.log(
      `   ✅ ${a.cid}  ${a.folhas} letras  op ${a.opRepouso}→1  topo ${a.topoInicio}px→${a.topoFim}px  (${a.pontos} pontos)  ${JSON.stringify(a.texto.slice(0, 32))}`,
    );
  }
  totalBlocos += aprovados.length;

  if (!ESCREVER) continue;

  const pasta = pastaDaRota(rota);
  if (!existsSync(pasta)) mkdirSync(pasta, { recursive: true });
  const linhas = [
    "/* revelacao.css — revelação de texto guiada pelo scroll, medida no",
    "   original por scripts/gera-revelacao-texto.mjs. Nenhum número digitado.",
    `   Origem: ${new URL(rota, ORIGINAL).href} @${LARGURA}px`,
    "",
    "   🚨 O revelacao.js é global e genérico: lê os números daqui, da",
    "   propriedade --ditto-revelacao, no formato",
    "   \"<topo em que começa> <topo em que termina> <opacidade de repouso>\".",
    "   Assim o mesmo JS serve todas as rotas sem carregar dado de rota. */",
    "",
    ...aprovados.map(
      (a) =>
        `[data-cid="${a.cid}"]{--ditto-revelacao:"${a.topoInicio} ${a.topoFim} ${a.opRepouso}"}  /* ${a.folhas} letras · ${JSON.stringify(a.texto.slice(0, 30))} */`,
    ),
    "",
    "/* 🚨 Quem desativou animação recebe o texto LEGÍVEL, nunca apagado. */",
    "@media (prefers-reduced-motion: reduce){",
    ...aprovados.map((a) => `  [data-cid="${a.cid}"] *{opacity:1 !important}`),
    "}",
    "",
  ];
  writeFileSync(join(pasta, "revelacao.css"), linhas.join("\n"), "utf8");
  console.log(`   -> ${join(pasta, "revelacao.css")}`);
  escreveuRuntime = true;
}

await navegador.close();

// --- o runtime global -------------------------------------------------------
if (ESCREVER && escreveuRuntime) {
  const js = `/* revelacao.js — revelação de texto guiada pelo scroll.
   Escrito por scripts/gera-revelacao-texto.mjs. GLOBAL e GENÉRICO: todos os
   números vivem no revelacao.css de cada rota, na propriedade
   --ditto-revelacao ("<topoInicio> <topoFim> <opRepouso>").

   Motor: GSAP ScrollTrigger com scrub — a escolha desta skill para animação
   guiada por scroll. Ele refaz as contas sozinho no resize, que é onde um
   ouvinte de scroll escrito à mão erra.

   Idempotente: window.__dittoRevelacao() pode ser chamado de novo a cada
   troca de rota client-side sem duplicar gatilho. */
(function () {
  function ler(el) {
    var v = getComputedStyle(el).getPropertyValue("--ditto-revelacao");
    if (!v) return null;
    var p = v.replace(/["']/g, "").trim().split(/\\s+/);
    if (p.length < 3) return null;
    var ini = parseFloat(p[0]), fim = parseFloat(p[1]), op = parseFloat(p[2]);
    if (!isFinite(ini) || !isFinite(fim) || !isFinite(op)) return null;
    return { ini: ini, fim: fim, op: op };
  }

  function ligar() {
    if (!window.gsap || !window.ScrollTrigger) return false;
    gsap.registerPlugin(ScrollTrigger);

    var reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var alvos = document.querySelectorAll("[data-cid]");

    for (var i = 0; i < alvos.length; i++) {
      var bloco = alvos[i];
      if (bloco.__dittoRevelado) continue;
      var cfg = ler(bloco);
      if (!cfg) continue;
      bloco.__dittoRevelado = true;

      var letras = [];
      var todos = bloco.querySelectorAll("*");
      for (var k = 0; k < todos.length; k++) if (!todos[k].children.length) letras.push(todos[k]);
      if (!letras.length) continue;

      if (reduz) {
        gsap.set(letras, { opacity: 1 });
        continue;
      }

      gsap.set(letras, { opacity: cfg.op });
      gsap.to(letras, {
        opacity: 1,
        duration: 0.01,
        ease: "none",
        stagger: { amount: 1 },
        scrollTrigger: {
          trigger: bloco,
          start: "top " + cfg.ini + "px",
          end: "top " + cfg.fim + "px",
          scrub: true,
        },
      });
    }
    return true;
  }

  window.__dittoRevelacao = ligar;

  function tentar(n) {
    if (ligar()) return;
    if (n > 40) return; // GSAP não chegou: o texto fica no estado de repouso, como no original
    setTimeout(function () { tentar(n + 1); }, 50);
  }
  if (document.readyState === "complete") tentar(0);
  else window.addEventListener("load", function () { tentar(0); });
})();
`;
  const pub = join(APP, "public");
  if (!existsSync(pub)) mkdirSync(pub, { recursive: true });
  writeFileSync(join(pub, "revelacao.js"), js, "utf8");
  console.log(`\nruntime -> ${join(pub, "revelacao.js")}`);
}

console.log(`\n${"=".repeat(70)}`);
console.log(`TOTAL: ${totalBlocos} bloco(s) de texto com revelação reconstruída`);
if (declaradas.length) {
  console.log(`\n⚠️ ${declaradas.length} declaração(ões) — nunca silenciadas:`);
  for (const d of declaradas) console.log(`   ${d.rota}: ${d.motivo}`);
}
console.log("🚨 falta: liga-css com revelacao.css, os <script> do gsap/ScrollTrigger/revelacao.js no layout, e rebuildar.");
process.exit(0);
