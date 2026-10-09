// mede-hover-swap.mjs — o hover que o mede-interacao NÃO vê.
//
// 🚨 O `gera-interacao` procura mudança de estilo NO ALVO e, num botão de
// hover-swap, não acha nada ("0 hover estilizável"): quem se mexe são os
// FILHOS (dois textos empilhados que deslizam numa janela de clip, e o ícone
// que troca), por transform. Este instrumento amostra a geometria dos filhos
// por rAF durante a entrada e a saída do mouse, com evento REAL do navegador.
//
// Sai com: para cada botão, o deslocamento de cada filho, a duração da ida e
// a da volta (elas diferem), e a curva normalizada — pronta para virar
// `linear()` no CSS ou tween no GSAP, conforme a forma.
//
// Uso:
//   SITE=https://exemplo.com/ ROTA=/ SAIDA=./hover node mede-hover-swap.mjs
//
// Variáveis: SITE (obrigatória), ROTA (padrão /), SAIDA (padrão ./hover),
//   TEXTOS (textos dos botões a medir, separados por |), MS (janela de
//   amostragem, padrão 1200), DITTO

import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const SITE = process.env.SITE;
if (!SITE) { console.error("falta SITE"); process.exit(1); }
const ROTA = process.env.ROTA ?? "/";
const SAIDA = resolve(process.env.SAIDA ?? "./hover");
const MS = Number(process.env.MS ?? 1200);
const TEXTOS = (process.env.TEXTOS ?? "Book Appointment|Explore Services").split("|").map((s) => s.trim()).filter(Boolean);
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
await p.goto(new URL(ROTA, SITE).href, { waitUntil: "load", timeout: 60000 });
await p.waitForTimeout(2500);

// marca os botões alvo
const achados = await p.evaluate((textos) => {
  const out = [];
  const cands = [...document.querySelectorAll("a,button")];
  textos.forEach((t, i) => {
    const b = cands.find((e) => (e.textContent || "").includes(t) && e.getBoundingClientRect().width > 40);
    if (b) { b.setAttribute("data-hs", String(i)); out.push({ i, texto: t, w: Math.round(b.getBoundingClientRect().width), filhos: b.querySelectorAll("*").length }); }
  });
  return out;
}, TEXTOS);
console.log("botões achados: " + JSON.stringify(achados));

const medidas = [];
for (const a of achados) {
  // amostra a geometria dos descendentes durante a ida e a volta do mouse
  const colher = async (fase) => {
    return await p.evaluate(({ i, ms }) => new Promise((fim) => {
      const btn = document.querySelector(`[data-hs="${i}"]`);
      const filhos = [...btn.querySelectorAll("*")];
      const r0 = btn.getBoundingClientRect();
      const amostras = [];
      const t0 = performance.now();
      (function tick(t) {
        amostras.push([Math.round((t - t0) * 10) / 10, filhos.map((f) => {
          const b = f.getBoundingClientRect();
          return [Math.round((b.left - r0.left) * 10) / 10, Math.round((b.top - r0.top) * 10) / 10, Math.round(b.width), Math.round(getComputedStyle(f).opacity * 100) / 100];
        })]);
        if (t - t0 < ms) requestAnimationFrame(tick); else fim({ n: filhos.length, amostras });
      })(performance.now());
    }), { i: a.i, ms: MS });
  };

  // IDA: dispara o hover e amostra
  const pIda = colher("ida");
  await p.hover(`[data-hs="${a.i}"]`, { timeout: 4000 }).catch(() => {});
  const ida = await pIda;
  await p.waitForTimeout(400);
  // VOLTA: tira o mouse e amostra
  const pVolta = colher("volta");
  await p.mouse.move(5, 5);
  const volta = await pVolta;

  // analisa: para cada filho, quanto andou e em quanto tempo
  const analisa = (dados) => {
    const { n, amostras } = dados;
    const res = [];
    for (let f = 0; f < n; f++) {
      const serie = amostras.map((am) => [am[0], am[1][f]]);
      const ini = serie[0][1], fimV = serie[serie.length - 1][1];
      const dx = Math.round((fimV[0] - ini[0]) * 10) / 10, dy = Math.round((fimV[1] - ini[1]) * 10) / 10, dop = Math.round((fimV[3] - ini[3]) * 100) / 100;
      if (Math.abs(dx) < 1.5 && Math.abs(dy) < 1.5 && Math.abs(dop) < 0.08) continue; // parado
      // duração: primeiro e último quadro com variação
      let t1 = null, t2 = null;
      for (let k = 1; k < serie.length; k++) {
        const a0 = serie[k - 1][1], a1 = serie[k][1];
        const mexeu = Math.abs(a1[0] - a0[0]) > 0.2 || Math.abs(a1[1] - a0[1]) > 0.2 || Math.abs(a1[3] - a0[3]) > 0.01;
        if (mexeu) { if (t1 === null) t1 = serie[k - 1][0]; t2 = serie[k][0]; }
      }
      // curva normalizada no eixo dominante
      const eixo = Math.abs(dx) >= Math.abs(dy) ? 0 : 1;
      const base = ini[eixo], amp = (eixo === 0 ? dx : dy);
      const curva = amp ? Array.from({ length: 21 }, (_, q) => {
        const alvoT = (t1 ?? 0) + (((t2 ?? 0) - (t1 ?? 0)) * q) / 20;
        let val = base;
        for (const s of serie) { if (s[0] <= alvoT) val = s[1][eixo]; else break; }
        return Math.round(((val - base) / amp) * 1000) / 1000;
      }) : null;
      res.push({ filho: f, dx, dy, dopacidade: dop, inicioMs: t1, fimMs: t2, duracaoMs: t1 !== null ? Math.round(t2 - t1) : null, curva });
    }
    return res;
  };

  const mIda = analisa(ida), mVolta = analisa(volta);
  console.log(`\n"${a.texto}" (${a.filhos} descendentes):`);
  console.log(`   IDA  : ${mIda.length} filho(s) animam`);
  for (const m of mIda.slice(0, 6)) console.log(`      filho ${m.filho}: dx=${m.dx} dy=${m.dy} dop=${m.dopacidade} dur=${m.duracaoMs}ms`);
  console.log(`   VOLTA: ${mVolta.length} filho(s) animam`);
  for (const m of mVolta.slice(0, 6)) console.log(`      filho ${m.filho}: dx=${m.dx} dy=${m.dy} dop=${m.dopacidade} dur=${m.duracaoMs}ms`);
  medidas.push({ texto: a.texto, ida: mIda, volta: mVolta });
  await p.waitForTimeout(500);
}
writeFileSync(join(SAIDA, "hover-swap.json"), JSON.stringify({ site: new URL(ROTA, SITE).href, medidas }, null, 2));
console.log(`\n-> ${join(SAIDA, "hover-swap.json")}`);
await nav.close();
