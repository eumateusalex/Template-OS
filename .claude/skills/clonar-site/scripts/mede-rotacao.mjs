// mede-rotacao.mjs — separa "elemento parado numa matriz girada" de "elemento
// GIRANDO", que a foto não distingue e a comparação de caixa julga errado.
//
// 🚨 Por que existe. O `mede-carrossel.mjs` lê `m.e`/`m.f` da matriz — a
// TRANSLAÇÃO. Rotação vive em `a`/`b`/`c`/`d`, e passa inteira por baixo dele.
// Um avatar que gira em laço é fotografado num ângulo qualquer pela captura, o
// clone recebe aquela matriz como estado FIXO, e a comparação de geometria
// acusa uns poucos px de desvio que resistem a toda rodada — porque não são
// defeito de posição, são FASE de um movimento que o clone não tem.
//
// A pergunta que ele responde: o ângulo cresce de forma monotônica e com
// velocidade constante (laço) ou está parado (estado)? A resposta muda o
// conserto: laço pede `@keyframes` com a velocidade medida; estado pede a
// matriz de repouso certa e exige zero.
//
// ⚠️ Rotação NÃO desloca a caixa (é cíclica e não acumula posição), então o
// runtime não precisa de IntersectionObserver para pausar fora da janela — ao
// contrário do trilho de um marquee, onde pausar é obrigatório.
//
// Uso:
//   SITE=https://site.com ROTA=/about SAIDA=./rotacao node mede-rotacao.mjs
//
// Variáveis: SITE ROTA SAIDA LARGURA AMOSTRA MAX DITTO
//   AMOSTRA  janela de observação em ms (padrão 8000)
//   MAX      teto de alvos observados (padrão 12)

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { createRequire } from "node:module";

const SITE = process.env.SITE;
if (!SITE) {
  console.error("falta SITE=<url>");
  process.exit(1);
}
const ROTA = process.env.ROTA ?? "/";
const SAIDA = resolve(process.env.SAIDA ?? "./rotacao");
const LARGURA = Number(process.env.LARGURA ?? 1280);
const AMOSTRA = Number(process.env.AMOSTRA ?? 8000);
const MAX = Number(process.env.MAX ?? 12);
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
mkdirSync(SAIDA, { recursive: true });

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

// Marca quem tem componente de rotação na matriz, DEPOIS de trazer a seção
// para a tela — o que está fora do viewport pode nem ter começado a animar.
const MARCAR = (MAX) => {
  // 🚨 `transform` NÃO contém `rotate`. As propriedades individuais de
  // transformação (`rotate`, `scale`, `translate`) são separadas no computed, e
  // um medidor que lê só `transform` declara ESTÁTICO um elemento que gira por
  // `rotate` — como no clone do framer-5, onde a animação é escrita
  // justamente em `rotate` para não disputar `transform` com a camada de
  // revelação. O ângulo efetivo é a SOMA dos dois.
  const angDe = (cs) => {
    const n = (String(cs.transform).match(/-?\d+\.?\d*(e-?\d+)?/g) || []).map(Number);
    const doTransform = n.length >= 6 ? (Math.atan2(n[1], n[0]) * 180) / Math.PI : 0;
    const r = String(cs.rotate || "none");
    let doRotate = 0;
    if (r && r !== "none") {
      const m = r.match(/(-?\d+\.?\d*)deg/);
      if (m) doRotate = Number(m[1]);
    }
    if (n.length < 6 && !doRotate) return null;
    return doTransform + doRotate;
  };
  const ang = (el) => angDe(getComputedStyle(el));
  let k = 0;
  const achados = [];
  for (const el of Array.from(document.querySelectorAll("*"))) {
    const cs = getComputedStyle(el);
    // ⚠️ Não basta exigir `transform`: quem gira por `rotate` tem
    // `transform: none` e seria descartado antes de ser medido.
    const semTransform = !cs.transform || cs.transform === "none";
    const semRotate = !cs.rotate || cs.rotate === "none";
    if (semTransform && semRotate) continue;
    const a = ang(el);
    if (a === null || Math.abs(a) < 0.01) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 6 || r.height < 6) continue;
    el.setAttribute("data-rot", String(k));
    achados.push({
      k,
      cid: el.getAttribute("data-cid"),
      tag: el.tagName.toLowerCase(),
      src: el.tagName === "IMG" ? (el.getAttribute("src") || "").split("/").pop() : null,
      texto: (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 30),
      anguloInicial: Math.round(a * 100) / 100,
      docY: Math.round(r.top + window.scrollY),
      w: Math.round(r.width * 10) / 10,
      h: Math.round(r.height * 10) / 10,
    });
    k++;
    if (k >= MAX) break;
  }
  return achados;
};

const AMOSTRAR = (ms) =>
  new Promise((resolve) => {
    const alvos = Array.from(document.querySelectorAll("[data-rot]"));
    // 🚨 Mesmo cuidado do MARCAR: `transform` não contém `rotate`. Ler só o
    // transform declara ESTÁTICO quem gira pela propriedade individual.
    const ang = (el) => {
      const cs = getComputedStyle(el);
      const n = (String(cs.transform).match(/-?\d+\.?\d*(e-?\d+)?/g) || []).map(Number);
      const doTransform = n.length >= 6 ? (Math.atan2(n[1], n[0]) * 180) / Math.PI : 0;
      const r = String(cs.rotate || "none");
      let doRotate = 0;
      if (r !== "none") {
        const m = r.match(/(-?\d+\.?\d*)deg/);
        if (m) doRotate = Number(m[1]);
      }
      if (n.length < 6 && !doRotate) return null;
      return doTransform + doRotate;
    };
    const series = alvos.map(() => []);
    const inicio = performance.now();
    const passo = () => {
      const t = performance.now() - inicio;
      for (let i = 0; i < alvos.length; i++) {
        const a = ang(alvos[i]);
        const r = alvos[i].getBoundingClientRect();
        series[i].push({ t, a, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 });
      }
      if (t >= ms) return resolve(series);
      requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  });

/** Desenrola o ângulo (evita o salto de +180 para -180) e mede a velocidade. */
function analisar(serie) {
  const pts = serie.filter((p) => p.a !== null);
  if (pts.length < 10) return { regime: "sem-amostra", n: pts.length };
  let acc = 0;
  const desenrolado = [{ t: pts[0].t, a: pts[0].a }];
  for (let i = 1; i < pts.length; i++) {
    let d = pts[i].a - pts[i - 1].a;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    acc += d;
    desenrolado.push({ t: pts[i].t, a: pts[0].a + acc });
  }
  const total = acc;
  const dur = pts[pts.length - 1].t - pts[0].t;
  if (Math.abs(total) < 1) {
    return {
      regime: "estatico",
      grausNoIntervalo: Math.round(total * 100) / 100,
      intervaloMs: Math.round(dur),
      anguloMedio: Math.round(pts[0].a * 100) / 100,
      amostras: pts.length,
    };
  }
  // velocidade instantânea por janelas, para ver se é CONSTANTE
  const jan = Math.max(2, Math.floor(desenrolado.length / 12));
  const vs = [];
  for (let i = jan; i < desenrolado.length; i += jan) {
    const dt = desenrolado[i].t - desenrolado[i - jan].t;
    if (dt <= 0) continue;
    vs.push(((desenrolado[i].a - desenrolado[i - jan].a) / dt) * 1000);
  }
  const med = vs.reduce((s, v) => s + v, 0) / (vs.length || 1);
  const dp = Math.sqrt(vs.reduce((s, v) => s + (v - med) ** 2, 0) / (vs.length || 1));
  const cv = med === 0 ? Infinity : Math.abs(dp / med);
  return {
    regime: cv < 0.1 ? "continuo" : "variavel",
    grausPorSegundo: Math.round(med * 100) / 100,
    desvioRelativo: Math.round(cv * 1000) / 1000,
    // ⚠️ `atan2(b,a)` da matriz CSS devolve o MESMO ângulo que `rotate()` usa:
    // rotate(45deg) → matrix(.707,.707,-.707,.707,0,0) → atan2 = +45. E em CSS
    // o ângulo positivo é HORÁRIO (o eixo y aponta para baixo). Então ângulo
    // crescente = horário, e o keyframe do conserto vai de 0 a +360deg.
    sentido: med > 0 ? "horario" : "anti-horario",
    // pronto para colar no @keyframes, com o sinal certo
    keyframeDe: "0deg",
    keyframePara: (med > 0 ? "" : "-") + "360deg",
    periodoSegundos: med === 0 ? null : Math.round((360 / Math.abs(med)) * 100) / 100,
    grausNoIntervalo: Math.round(total * 100) / 100,
    intervaloMs: Math.round(dur),
    amostras: pts.length,
  };
}

const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: LARGURA, height: 900 } });
const page = await ctx.newPage();
await page.goto(new URL(ROTA, SITE).href + (SITE.includes("127.0.0.1") ? "?_v=" + Date.now() : ""), {
  waitUntil: "load",
  timeout: 60000,
});
await page.waitForTimeout(2000);

// rolar a página inteira: o que nunca entrou na tela pode nem ter começado
await page.evaluate(async () => {
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const passo = Math.round(window.innerHeight * 0.8);
  for (let y = 0; y < document.body.scrollHeight; y += passo) {
    window.scrollTo({ top: y, behavior: "instant" });
    await espera(120);
  }
  window.scrollTo({ top: 0, behavior: "instant" });
});
await page.waitForTimeout(1200);

const achados = await page.evaluate(MARCAR, MAX);
console.log(`${achados.length} elemento(s) com rotação na matriz`);
if (!achados.length) {
  console.log("nada a observar — nenhum transform com componente de rotação nesta rota");
}

const series = achados.length ? await page.evaluate(AMOSTRAR, AMOSTRA) : [];
await navegador.close();

const alvos = achados.map((a, i) => ({ ...a, ...analisar(series[i] || []) }));
for (const a of alvos) {
  const id = a.cid ?? a.tag;
  if (a.regime === "continuo") {
    console.log(
      `  ${id} ${a.w}x${a.h} → CONTÍNUO: ${a.grausPorSegundo}°/s ${a.sentido}, volta em ${a.periodoSegundos}s (cv=${a.desvioRelativo})`
    );
  } else if (a.regime === "estatico") {
    console.log(`  ${id} ${a.w}x${a.h} → ESTÁTICO em ${a.anguloMedio}° (${a.grausNoIntervalo}° em ${a.intervaloMs}ms)`);
  } else {
    console.log(`  ${id} ${a.w}x${a.h} → ${a.regime}: ${a.grausNoIntervalo}° em ${a.intervaloMs}ms`);
  }
}

const nome = SITE.includes("127.0.0.1") || SITE.includes("localhost") ? "rotacao-clone.json" : "rotacao-original.json";
const arq = join(SAIDA, nome);
writeFileSync(arq, JSON.stringify({ site: SITE, rota: ROTA, largura: LARGURA, amostraMs: AMOSTRA, alvos }, null, 2), "utf8");
console.log(`\n→ ${arq}`);
