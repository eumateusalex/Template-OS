// mede-carrossel.mjs — o que anda SOZINHO, por tempo, sem scroll nem mouse.
//
// Existe porque as outras fontes são cegas para isto por construção:
//   - a WAAPI não registra motor por rAF (Framer/GSAP escrevendo estilo inline);
//   - a fonte C (geometria no scroll) só olha o que o scroll dispara;
//   - o controle de deriva do compara-geometria amostra ~1.6s, e carrossel que
//     pisa a cada 4-6s fica parado dentro dessa janela e passa por estático.
//
// O que faz: acha os trilhos (elemento cujo transform inline muda com a página
// PARADA), rola cada um para o centro da janela, e amostra matrix(t) por rAF
// tempo suficiente para pegar vários passos. Da série x(t) saem:
//   - regime: CONTÍNUO (marquee, velocidade constante) ou em PASSOS (slider)
//   - por passo: distância, duração do movimento, intervalo entre inícios
//   - a curva de cada passo, normalizada (pronta para virar linear() ou mola)
//   - o perímetro do trilho: itens, larguras, gap, e se há clones de loop
//
// 🚨 O guard: se nenhum candidato mudar de transform com a página parada, o
// instrumento DECLARA isso e não escreve reconstrução nenhuma. Ele nunca
// inventa trilho.
//
// Uso:
//   SITE=https://exemplo.com/ SAIDA=./carrossel node mede-carrossel.mjs
//
// Variáveis:
//   SITE      URL a medir (obrigatória)
//   ROTA      rota (padrão /)
//   SAIDA     pasta de saída (padrão ./carrossel)
//   LARGURA   viewport (padrão 1280)
//   DETECCAO  ms da varredura de candidatos (padrão 9000)
//   AMOSTRA   ms de amostragem por trilho (padrão 16000)
//   ANCORAS   posições Y (vírgula) onde parar para detectar — trilho fora da
//             janela fica PAUSADO (medido: o de depoimentos só anda visível),
//             então detectar só do topo é cegueira. Padrão: "0"
//   DITTO     raiz do ditto (padrão C:/dev/ditto)

import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const SITE = process.env.SITE;
if (!SITE) {
  console.error("falta SITE=<url>");
  process.exit(1);
}
const ROTA = process.env.ROTA ?? "/";
const SAIDA = resolve(process.env.SAIDA ?? "./carrossel");
const LARGURA = Number(process.env.LARGURA ?? 1280);
const DETECCAO = Number(process.env.DETECCAO ?? 9000);
const AMOSTRA = Number(process.env.AMOSTRA ?? 16000);
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
mkdirSync(SAIDA, { recursive: true });

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

const url = new URL(ROTA, SITE).href;
const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: LARGURA, height: 900 } });
await pagina.goto(url, { waitUntil: "load", timeout: 60000 });
await pagina.waitForTimeout(2500);

// ---------------------------------------------------------------------------
// 1. Candidatos: todo elemento que JÁ tem transform inline, mais todo <ul>.
//    O Framer anima escrevendo style.transform — quem nunca recebe transform
//    inline não é trilho. Carimbo data-mc para identidade estável entre fotos
//    (regra 12 do LEIA-ME: índice mente quando o DOM reordena).
// ---------------------------------------------------------------------------
const nCandidatos = await pagina.evaluate(() => {
  const set = new Set();
  for (const el of document.querySelectorAll('[style*="transform"]')) set.add(el);
  for (const el of document.querySelectorAll("ul")) set.add(el);
  let i = 0;
  for (const el of set) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    el.setAttribute("data-mc", String(i++));
  }
  return i;
});

// Duas fotos separadas no tempo, página parada, para achar quem anda sozinho.
const foto = () =>
  pagina.evaluate(() => {
    const m = {};
    for (const el of document.querySelectorAll("[data-mc]")) {
      m[el.getAttribute("data-mc")] = getComputedStyle(el).transform;
    }
    return m;
  });

const ANCORAS = (process.env.ANCORAS ?? "0").split(",").map(Number);
const vivosSet = new Set();
for (const ancora of ANCORAS) {
  await pagina.evaluate((y) => scrollTo(0, y), ancora);
  await pagina.waitForTimeout(1500);
  const f1 = await foto();
  await pagina.waitForTimeout(DETECCAO);
  const f2 = await foto();
  for (const k of Object.keys(f1)) if (f1[k] !== f2[k]) vivosSet.add(k);
}
const vivos = [...vivosSet];

if (vivos.length === 0) {
  console.log(`candidatos: ${nCandidatos} · nenhum mudou de transform em ${DETECCAO}ms com a página parada`);
  console.log("nada a medir — nenhum arquivo de trilho escrito.");
  writeFileSync(join(SAIDA, "carrossel.json"), JSON.stringify({ site: url, largura: LARGURA, trilhos: [], candidatos: nCandidatos, deteccaoMs: DETECCAO }, null, 2));
  await navegador.close();
  process.exit(0);
}

// Agrupar: se um trilho muda, os filhos dele mudam junto. Medir só o ancestral
// mais alto de cada grupo — o resto é consequência.
const trilhos = await pagina.evaluate((ids) => {
  const els = ids.map((id) => document.querySelector(`[data-mc="${id}"]`)).filter(Boolean);
  const topo = els.filter((el) => !els.some((outro) => outro !== el && outro.contains(el)));
  return topo.map((el) => {
    const r = el.getBoundingClientRect();
    const filhos = [...el.children].map((c) => {
      const rc = c.getBoundingClientRect();
      return { tag: c.tagName, w: Math.round(rc.width * 10) / 10, texto: (c.innerText || "").slice(0, 40) };
    });
    const textos = filhos.map((f) => f.texto);
    const repetidos = textos.filter((t, i) => t && textos.indexOf(t) !== i).length;
    let gap = null;
    if (el.children.length >= 2) {
      const a = el.children[0].getBoundingClientRect();
      const b = el.children[1].getBoundingClientRect();
      gap = Math.round((b.left - a.right) * 10) / 10;
    }
    return {
      id: el.getAttribute("data-mc"),
      tag: el.tagName,
      docY: Math.round(r.top + scrollY),
      w: Math.round(r.width),
      h: Math.round(r.height),
      overflowPai: el.parentElement ? getComputedStyle(el.parentElement).overflow : null,
      itens: el.children.length,
      gap,
      temClonesDeLoop: repetidos > 0,
      filhos: filhos.slice(0, 24),
    };
  });
}, vivos);

console.log(`candidatos: ${nCandidatos} · vivos: ${vivos.length} · trilhos de topo: ${trilhos.length}`);

// ---------------------------------------------------------------------------
// 2. Amostrar cada trilho: rolar até ele, esperar assentar, gravar matrix(t).
// ---------------------------------------------------------------------------
for (const trilho of trilhos) {
  await pagina.evaluate((y) => scrollTo(0, Math.max(0, y - 300)), trilho.docY);
  await pagina.waitForTimeout(1500);

  const serie = await pagina.evaluate(
    ({ id, ms }) =>
      new Promise((fim) => {
        const el = document.querySelector(`[data-mc="${id}"]`);
        const pontos = [];
        const t0 = performance.now();
        function tick(t) {
          const m = new DOMMatrixReadOnly(getComputedStyle(el).transform === "none" ? "" : getComputedStyle(el).transform);
          pontos.push([Math.round((t - t0) * 10) / 10, Math.round(m.e * 100) / 100, Math.round(m.f * 100) / 100]);
          if (t - t0 < ms) requestAnimationFrame(tick);
          else fim(pontos);
        }
        requestAnimationFrame(tick);
      }),
    { id: trilho.id, ms: AMOSTRA }
  );

  // --- análise da série x(t): parado × em movimento -------------------------
  const LIMIAR_VEL = 0.02; // px/ms ≈ 20px/s — abaixo disso é repouso
  const eixo = (() => {
    const dx = Math.abs(serie[serie.length - 1][1] - serie[0][1]);
    const dy = Math.abs(serie[serie.length - 1][2] - serie[0][2]);
    let vx = 0, vy = 0;
    for (let i = 1; i < serie.length; i++) {
      vx += Math.abs(serie[i][1] - serie[i - 1][1]);
      vy += Math.abs(serie[i][2] - serie[i - 1][2]);
    }
    return vx >= vy ? 1 : 2; // índice na tupla [t, x, y]
  })();

  const passos = [];
  let emMovimento = false;
  let inicio = null;
  for (let i = 1; i < serie.length; i++) {
    const dt = serie[i][0] - serie[i - 1][0];
    const dv = serie[i][eixo] - serie[i - 1][eixo];
    const vel = dt > 0 ? Math.abs(dv / dt) : 0;
    if (!emMovimento && vel > LIMIAR_VEL) {
      emMovimento = true;
      inicio = i - 1;
    } else if (emMovimento && vel <= LIMIAR_VEL) {
      emMovimento = false;
      const seg = serie.slice(inicio, i + 1);
      const dist = seg[seg.length - 1][eixo] - seg[0][eixo];
      if (Math.abs(dist) >= 4) {
        const d0 = seg[0][eixo];
        const dur = seg[seg.length - 1][0] - seg[0][0];
        passos.push({
          tInicio: seg[0][0],
          duracaoMs: Math.round(dur),
          distanciaPx: Math.round(dist * 10) / 10,
          // curva normalizada 0→1 em 24 amostras, pronta para linear()
          curva: Array.from({ length: 25 }, (_, k) => {
            const alvoT = seg[0][0] + (dur * k) / 24;
            let p = seg[0];
            for (const q of seg) { if (q[0] <= alvoT) p = q; else break; }
            return Math.round(((p[eixo] - d0) / dist) * 1000) / 1000;
          }),
        });
      }
    }
  }

  const totalMovel = serie.reduce((s, p, i) => (i ? s + Math.abs(p[eixo] - serie[i - 1][eixo]) : 0), 0);
  const duracaoTotal = serie[serie.length - 1][0];
  const velMedia = totalMovel / duracaoTotal; // px/ms
  const intervalos = passos.slice(1).map((p, i) => Math.round(p.tInicio - passos[i].tInicio));

  trilho.eixo = eixo === 1 ? "x" : "y";
  trilho.regime = passos.length >= 2 && intervalos.length > 0 ? "passos" : totalMovel > 50 && passos.length <= 1 ? "continuo" : passos.length === 1 ? "passo-unico-na-janela" : "parado-na-janela";
  trilho.passos = passos;
  trilho.intervaloEntrePassosMs = intervalos;
  trilho.velocidadeMediaPxPorS = Math.round(velMedia * 1000 * 10) / 10;
  trilho.amostraMs = AMOSTRA;
  trilho.serieBruta = serie.filter((_, i) => i % 3 === 0); // 1 em 3 quadros basta para conferência

  console.log(`  trilho data-mc=${trilho.id} <${trilho.tag}> y=${trilho.docY} itens=${trilho.itens} regime=${trilho.regime} passos=${passos.length} ` +
    (passos.length ? `dist≈${passos.map((p) => p.distanciaPx).join(",")}px dur≈${passos.map((p) => p.duracaoMs).join(",")}ms intervalos=${intervalos.join(",")}ms` : `velMedia=${trilho.velocidadeMediaPxPorS}px/s`));
}

const resultado = { site: url, largura: LARGURA, candidatos: nCandidatos, deteccaoMs: DETECCAO, trilhos };
writeFileSync(join(SAIDA, "carrossel.json"), JSON.stringify(resultado, null, 2));
console.log(`-> ${join(SAIDA, "carrossel.json")}`);
await navegador.close();
