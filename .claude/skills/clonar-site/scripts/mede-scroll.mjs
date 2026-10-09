// mede-scroll.mjs — o que o scroll muda, em que ponto, e para qual estado.
//
// Dimensão 6, parte scroll. Rodar nos DOIS lados: no original para descobrir o
// que existe, no clone para provar a reconstrução.
//
// 🚨 Por que este instrumento existe: contar animações antes e depois do
// scroll dá ZERO em site que anima por rAF em estilo inline (Framer Motion,
// GSAP). Medi assim uma vez e concluí "zero animação de scroll" num site cuja
// nav colapsa e cuja barra de contato desliza. Quem responde é a GEOMETRIA
// amostrada durante o scroll.
//
// ⚠️ Elemento `fixed`/`sticky` muda de posição DOCUMENTAL por definição quando
// a página rola. Para eles o que interessa é a posição no VIEWPORT; para o
// resto, a posição no documento.
//
// Uso:
//   SITE=<url> SAIDA=./scroll node mede-scroll.mjs
//
// Variáveis:
//   SITE     URL a medir (obrigatória)
//   ROTA     rota (padrão: /)
//   SAIDA    pasta de saída (padrão: ./scroll)
//   LARGURA  viewport (padrão: 1280)
//   PASSOS   quantas posições de scroll amostrar (padrão: 24)
//   DITTO    raiz do ditto (padrão: C:/dev/ditto)

import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const SITE = process.env.SITE;
if (!SITE) {
  console.error("falta SITE=<url>");
  process.exit(1);
}
const ROTA = process.env.ROTA ?? "/";
const SAIDA = resolve(process.env.SAIDA ?? "./scroll");
const LARGURA = Number(process.env.LARGURA ?? 1280);
const PASSOS = Number(process.env.PASSOS ?? 24);
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
mkdirSync(SAIDA, { recursive: true });

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: LARGURA, height: 900 } });
const page = await ctx.newPage();
await page.goto(new URL(ROTA, SITE).href + (SITE.includes("127.0.0.1") ? "?_v=" + Date.now() : ""), {
  waitUntil: "networkidle",
  timeout: 60000,
});
await page.waitForTimeout(1500);

const dados = await page.evaluate(async (PASSOS) => {
  // Identidade estável: não dá para comparar por índice — elementos entram e
  // saem do filtro ao rolar, e comparar índices compara elementos diferentes.
  const chave = (el) => {
    const pai = el.parentElement;
    const idx = pai ? Array.prototype.indexOf.call(pai.children, el) : -1;
    return (
      el.tagName +
      "|" +
      idx +
      "|" +
      (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 20)
    );
  };

  // Watch-list: só o que é fixo/sticky ou está no primeiro terço. É onde mora
  // o comportamento de scroll (nav, barras, botões flutuantes).
  const alvos = Array.from(document.querySelectorAll("body *")).filter((el) => {
    const b = el.getBoundingClientRect();
    if (b.width < 20 || b.height < 12) return false;
    const pos = getComputedStyle(el).position;
    return pos === "fixed" || pos === "sticky" || b.top + window.scrollY < 1200;
  });

  const ler = () => {
    const m = new Map();
    for (const el of alvos) {
      const b = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const fixo = cs.position === "fixed" || cs.position === "sticky";
      m.set(chave(el), {
        y: Math.round(fixo ? b.top : b.top + window.scrollY),
        x: Math.round(b.left),
        w: Math.round(b.width),
        h: Math.round(b.height),
        op: cs.opacity,
        tr: cs.transform,
        fixo,
      });
    }
    return m;
  };

  const alturaTotal = document.documentElement.scrollHeight;
  const passo = Math.max(60, Math.floor((alturaTotal - window.innerHeight) / PASSOS));
  const serie = [];
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 700));
  const inicial = ler();

  for (let i = 0; i <= PASSOS; i++) {
    const y = i * passo;
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 160));
    serie.push({ scrollY: Math.round(window.scrollY), estado: [...ler().entries()] });
  }

  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 900));
  const final = ler();

  // O que mudou em algum ponto do scroll, e qual o LIMIAR (primeiro scrollY em
  // que a mudança aparece).
  const mudancas = [];
  for (const [k, ini] of inicial) {
    let limiar = null;
    let extremo = null;
    for (const ponto of serie) {
      const est = new Map(ponto.estado).get(k);
      if (!est) continue;
      const dif =
        Math.abs(est.y - ini.y) > 2 ||
        Math.abs(est.w - ini.w) > 2 ||
        Math.abs(est.h - ini.h) > 2 ||
        est.op !== ini.op;
      if (dif && limiar === null) limiar = ponto.scrollY;
      if (dif) extremo = est;
    }
    if (limiar !== null) {
      const volta = final.get(k);
      mudancas.push({
        chave: k,
        fixo: ini.fixo,
        limiar,
        // ⚠️ Guardar o TRANSFORM inteiro, não só o deslocamento em y.
        // O elemento costuma já ter um translateX (centralização), e escrever
        // `transform: translateY(...)` SOBRESCREVE esse X — medido: a barra do
        // site-exemplo tem `matrix(1,0,0,1,-121.359,100)` no repouso, e um
        // translateY sozinho a jogou para `matrix(1,0,0,1,0,-71)`, deslocando
        // 121px na horizontal sem ninguém pedir.
        de: { y: ini.y, w: ini.w, h: ini.h, op: ini.op, tr: ini.tr },
        para: extremo ? { y: extremo.y, w: extremo.w, h: extremo.h, op: extremo.op, tr: extremo.tr } : null,
        voltouAoInicio: volta
          ? Math.abs(volta.y - ini.y) <= 2 && Math.abs(volta.h - ini.h) <= 2 && volta.op === ini.op
          : null,
      });
    }
  }

  return {
    observados: inicial.size,
    alturaTotal,
    mudancas: mudancas.sort((a, b) => a.limiar - b.limiar),
  };
}, PASSOS);

await navegador.close();

const fixos = dados.mudancas.filter((m) => m.fixo);
const naoVoltaram = dados.mudancas.filter((m) => m.voltouAoInicio === false);

writeFileSync(join(SAIDA, "scroll.json"), JSON.stringify({ site: SITE, rota: ROTA, largura: LARGURA, ...dados }, null, 2), "utf8");

console.log(`scroll em ${SITE}${ROTA === "/" ? "" : ROTA} @${LARGURA}`);
console.log(`  observados:                 ${dados.observados}`);
console.log(`  mudam com o scroll:         ${dados.mudancas.length}`);
console.log(`  destes, fixed/sticky:       ${fixos.length}`);
console.log(`  NÃO voltam ao estado inicial: ${naoVoltaram.length}`);
if (fixos.length) {
  console.log(`\n  elementos fixos que reagem ao scroll (os que importam):`);
  for (const m of fixos.slice(0, 10)) {
    console.log(
      `    limiar=${String(m.limiar).padStart(5)}px  ${m.chave.slice(0, 40).padEnd(42)}` +
        `  y ${m.de.y}->${m.para?.y}  w ${m.de.w}->${m.para?.w}  h ${m.de.h}->${m.para?.h}  op ${m.de.op}->${m.para?.op}`,
    );
  }
}
console.log(`\n-> ${join(SAIDA, "scroll.json")}`);
