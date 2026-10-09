// gera-texto-rolante.mjs — o link cujo TEXTO ROLA no hover, letra por letra.
//
// O buraco que ele tapa (medido no framer-4): a navegação
// principal tem o efeito de texto rolante — ao passar o mouse, cada letra sobe
// exatamente uma altura de linha, em cascata, e no lugar dela aparece uma
// cópia. No clone, passar o mouse não faz nada, nas 27 rotas.
//
// 🚨 O truque que a captura perde é a SEGUNDA CÓPIA. Ela não é um elemento
// duplicado: é uma `text-shadow` posicionada exatamente uma altura de linha
// abaixo, da mesma cor do texto (`0 22.4px 0 <cor>`). Com `overflow:hidden` no
// pai, a letra sai por cima e a sombra entra por baixo. O ditto traz a
// estrutura inteira — o <p> recortado e um <span> por letra — e deixa para
// trás só o `<style>` que carregava a sombra e o hover. Estrutura completa,
// efeito nenhum.
//
// Por que RUNTIME e não CSS: a regra teria de disputar `transform` com as
// utilitárias do Tailwind que o ditto põe nas letras, e nesse build regra que
// disputa não entra na cascata (ver armadilhas.md). Estilo inline sempre entra.
//
// Por que detecção ESTRUTURAL e não mapa de data-cid: a assinatura é precisa —
// um <a> com um <p> recortado cujos filhos são todos <span> de UM caractere —
// e assim o mesmo runtime serve as 27 rotas sem um mapa por rota.
//
// O que o faz SE CALAR:
//   - nenhum link com a assinatura no original  -> nada escrito
//   - o hover não move as letras                -> nada escrito
//   - deslocamento diferente da altura de linha -> declara e não escreve
//
// Uso:
//   ORIGINAL=<url> APP=<app> ROTA=/contact SAIDA=<med> node gera-texto-rolante.mjs
//
// Variáveis: ORIGINAL, APP (obrigatórias) · ROTA (/) · LARGURA (1280)
//   ESCREVER=0 simula · DITTO

import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const ORIGINAL = process.env.ORIGINAL, APP = process.env.APP;
if (!ORIGINAL || !APP) { console.error("faltam ORIGINAL/APP"); process.exit(1); }
const ROTA = process.env.ROTA ?? "/";
const LARGURA = Number(process.env.LARGURA ?? 1280);
const SAIDA = resolve(process.env.SAIDA ?? "./rolante");
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
const p = await nav.newPage({ viewport: { width: LARGURA, height: 900 } });
await p.goto(new URL(ROTA, ORIGINAL).href, { waitUntil: "load", timeout: 60000 });
await p.waitForTimeout(2500);

// ---- 1. quem tem a assinatura, e como está pintado ------------------------
const alvo = await p.evaluate(() => {
  const ehRolante = (a) => {
    const ps = a.querySelectorAll("p");
    for (const el of ps) {
      const filhos = [...el.children];
      if (filhos.length < 2) continue;
      if (!filhos.every((c) => c.tagName === "SPAN" && (c.textContent || "").length === 1)) continue;
      if (getComputedStyle(el).overflow !== "hidden") continue;
      return el;
    }
    return null;
  };
  let achados = 0, primeiro = null;
  for (const a of document.querySelectorAll("a")) {
    const el = ehRolante(a);
    if (!el) continue;
    achados++;
    if (!primeiro && a.getBoundingClientRect().width > 0) { primeiro = a; a.setAttribute("data-tr", "1"); }
  }
  if (!primeiro) return null;
  const s = primeiro.querySelector("span");
  const cs = getComputedStyle(s);
  const q = primeiro.getBoundingClientRect();
  return {
    achados,
    sombra: cs.textShadow,
    cor: cs.color,
    alturaLinha: cs.lineHeight,
    letras: primeiro.querySelectorAll("p > span").length,
    x: Math.round(q.left + q.width / 2),
    y: Math.round(q.top + q.height / 2),
  };
});

if (!alvo) { console.log("nenhum link com a assinatura de texto rolante — nada medido, nada escrito."); await nav.close(); process.exit(0); }
console.log(`links com a assinatura em ${ROTA}: ${alvo.achados} · letras no medido: ${alvo.letras}`);
console.log(`  sombra: ${alvo.sombra}  ·  cor: ${alvo.cor}  ·  altura de linha: ${alvo.alturaLinha}`);

// ---- 2. a curva do hover, letra a letra ----------------------------------
const promessa = p.evaluate(() => new Promise((fim) => {
  const sp = [...document.querySelector('[data-tr="1"]').querySelectorAll("p > span")];
  const pts = [];
  const t0 = performance.now();
  (function tick(t) {
    pts.push([Math.round(t - t0), sp.map((s) => {
      const m = /matrix\(([^)]+)\)/.exec(getComputedStyle(s).transform);
      return m ? Math.round(Number(m[1].split(",")[5]) * 100) / 100 : 0;
    })]);
    if (t - t0 < 1500) requestAnimationFrame(tick); else fim(pts);
  })(performance.now());
}));
await p.waitForTimeout(100);
await p.mouse.move(alvo.x, alvo.y);
const serie = await promessa;

const finais = serie[serie.length - 1][1];
const desloc = Math.min(...finais);
if (!(desloc < -2)) { console.log(`o hover não moveu as letras (final ${JSON.stringify(finais)}) — nada escrito.`); await nav.close(); process.exit(0); }

// início e fim de cada letra, e daí o atraso em cascata e a duração
const inicioDe = finais.map((_, k) => {
  for (const [t, v] of serie) if (Math.abs(v[k]) > 0.15) return t;
  return null;
});
const fimDe = finais.map((_, k) => {
  for (const [t, v] of serie) if (Math.abs(v[k] - desloc) < 0.15) return t;
  return null;
});
const t0Letra = inicioDe[0];
const atrasos = inicioDe.map((t) => (t === null || t0Letra === null ? null : t - t0Letra));
const passoAtraso = atrasos.filter((a) => a !== null && a > 0).length
  ? Math.round(atrasos.filter((a) => a !== null)[atrasos.filter((a) => a !== null).length - 1] / Math.max(1, finais.length - 1))
  : 0;
const duracao = fimDe[0] !== null && t0Letra !== null ? fimDe[0] - t0Letra : 400;

// curva normalizada da PRIMEIRA letra (as outras repetem com atraso)
const curva = Array.from({ length: 21 }, (_, k) => {
  const alvoT = t0Letra + (duracao * k) / 20;
  let v = 0;
  for (const [t, vals] of serie) { if (t <= alvoT) v = vals[0]; else break; }
  return Math.round((v / desloc) * 1000) / 1000;
});

const alturaLinha = parseFloat(alvo.alturaLinha);
const bate = Math.abs(Math.abs(desloc) - alturaLinha) < 1.5;
console.log(`  deslocamento medido: ${desloc}px · altura de linha: ${alturaLinha}px ${bate ? "(batem)" : "🚨 NÃO batem"}`);
console.log(`  duração: ${duracao}ms · atraso entre letras: ${passoAtraso}ms`);
if (!bate) { console.log("o deslocamento não é de uma altura de linha — declarado, nada escrito."); await nav.close(); process.exit(0); }

const medicao = { original: new URL(ROTA, ORIGINAL).href, rota: ROTA, linksComAssinatura: alvo.achados, sombra: alvo.sombra, cor: alvo.cor, alturaLinha, desloc, duracao, passoAtraso, curva };
writeFileSync(join(SAIDA, "rolante.json"), JSON.stringify(medicao, null, 1));
console.log(`-> ${join(SAIDA, "rolante.json")}`);

const runtime = `// Gerado por scripts/gera-texto-rolante.mjs — NÃO editar à mão.
// Texto que ROLA no hover, letra por letra. Tudo medido no original:
// deslocamento ${desloc}px (uma altura de linha), ${duracao}ms, cascata de
// ${passoAtraso}ms por letra, curva de 21 amostras.
//
// A "segunda cópia" da letra é uma text-shadow uma altura de linha ABAIXO — é
// assim que o original faz, e é o que a captura perde.
(function () {
  var DESLOC = ${desloc};
  var DUR = ${duracao};
  var ATRASO = ${passoAtraso};
  var CURVA = ${JSON.stringify(curva)};

  function interpolar(p) {
    var n = CURVA.length - 1;
    var i = Math.min(n - 1, Math.floor(p * n));
    var t = p * n - i;
    return CURVA[i] + (CURVA[i + 1] - CURVA[i]) * t;
  }

  // a assinatura: <a> com um <p> recortado cujos filhos são todos <span> de um
  // caractere. É o que distingue o link rolante de qualquer outro link.
  function letrasDe(a) {
    var ps = a.querySelectorAll("p");
    for (var i = 0; i < ps.length; i++) {
      var f = ps[i].children;
      if (f.length < 2) continue;
      var ok = true;
      for (var k = 0; k < f.length; k++) {
        if (f[k].tagName !== "SPAN" || (f[k].textContent || "").length !== 1) { ok = false; break; }
      }
      if (!ok) continue;
      if (getComputedStyle(ps[i]).overflow !== "hidden") continue;
      return [].slice.call(f);
    }
    return null;
  }

  function montar() {
    var reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var fino = matchMedia("(hover: hover) and (pointer: fine)").matches;
    var links = document.querySelectorAll("a");
    for (var i = 0; i < links.length; i++) {
      (function (a) {
        if (a.getAttribute("data-rolante") === "1") return; // idempotência por link
        var letras = letrasDe(a);
        if (!letras) return;
        a.setAttribute("data-rolante", "1");

        // a sombra é o que faz a cópia existir; ela vale mesmo sem movimento
        var cor = getComputedStyle(letras[0]).color;
        var lh = parseFloat(getComputedStyle(letras[0]).lineHeight) || Math.abs(DESLOC);
        for (var k = 0; k < letras.length; k++) letras[k].style.textShadow = "0 " + lh + "px 0 " + cor;

        if (reduz || !fino) return; // sem ponteiro fino, ou movimento desligado: fica a sombra, sem rolagem

        var raf = null, t0 = 0, indo = true;
        function quadro(t) {
          if (!t0) t0 = t;
          var passou = t - t0;
          var vivo = false;
          for (var k = 0; k < letras.length; k++) {
            var pr = Math.max(0, Math.min(1, (passou - k * ATRASO) / DUR));
            var v = interpolar(pr) * DESLOC;
            letras[k].style.transform = "translateY(" + (indo ? v : DESLOC - v) + "px)";
            if (pr < 1) vivo = true;
          }
          if (vivo) raf = requestAnimationFrame(quadro);
          else raf = null;
        }
        function partir(paraFrente) {
          indo = paraFrente;
          t0 = 0;
          if (raf) cancelAnimationFrame(raf);
          raf = requestAnimationFrame(quadro);
        }
        a.addEventListener("mouseenter", function () { partir(true); });
        a.addEventListener("mouseleave", function () { partir(false); });
      })(links[i]);
    }
  }

  window.__dittoRolante = montar;
  if (document.readyState === "complete") montar();
  else window.addEventListener("load", montar);
})();
`;

const destino = join(APP, "public", "rolante.js");
if (ESCREVER) writeFileSync(destino, runtime);
console.log(`${ESCREVER ? "escrito" : "SIMULADO"}: ${destino}`);
console.log("⚠️ falta ligar no layout e no religar da navegação (__dittoRolante).");
await nav.close();
