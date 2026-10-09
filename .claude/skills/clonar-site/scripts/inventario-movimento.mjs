// inventario-movimento.mjs — o que se mexe nesta página, e quem consegue ver.
//
// Mede o movimento por TRÊS fontes independentes, de propósito:
//
//   A) Web Animations API — `document.getAnimations()` com keyframes e timing.
//      Dá número EXATO (duração, delay, bezier), mas só enxerga CSS e WAAPI.
//   B) Amostragem de estilo computado por rAF — enxerga QUALQUER motor,
//      inclusive quem anima escrevendo estilo inline (GSAP, Framer Motion),
//      mas dá o efeito, não a declaração.
//   C) A mesma amostragem DURANTE o scroll — o que só se mexe quando a página
//      rola (a nav que colapsa, a barra que desliza), que a (B), com a página
//      parada, não vê.
//
// 🚨 Por que mais de uma: se (A) devolve zero e (B) acusa mudança, o movimento
// existe e é de um motor que a WAAPI não vê. Confiar só em (A) faz a página
// parecer parada. As duas contagens saem lado a lado no relatório justamente
// para essa comparação não depender de memória.
//
// Uso:
//   SITE=https://exemplo.com/ SAIDA=./movimento node inventario-movimento.mjs
//
// Variáveis:
//   SITE     URL a inventariar (obrigatória)
//   SAIDA    pasta de saída (padrão: ./movimento)
//   LARGURA  viewport (padrão: 1280)
//   AMOSTRA  ms de amostragem por rAF (padrão: 2500)
//   DITTO    raiz do ditto (padrão: C:/dev/ditto)

import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const SITE = process.env.SITE;
if (!SITE) {
  console.error("falta SITE=<url>");
  process.exit(1);
}
const SAIDA = resolve(process.env.SAIDA ?? "./movimento");
const LARGURA = Number(process.env.LARGURA ?? 1280);
const AMOSTRA = Number(process.env.AMOSTRA ?? 2500);
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

// ⚠️ Animação de LOAD já acabou quando a página termina de carregar. Para
// pegá-la é preciso armar o coletor ANTES de qualquer script da página rodar.
await ctx.addInitScript(() => {
  window.__mov = { doLoad: [] };
  const registrar = () => {
    try {
      for (const a of document.getAnimations({ subtree: true })) {
        if (window.__mov.doLoad.some((x) => x.a === a)) continue;
        window.__mov.doLoad.push({ a, t: performance.now() });
      }
    } catch {
      /* getAnimations pode não existir cedo demais */
    }
  };
  const id = setInterval(registrar, 50);
  setTimeout(() => clearInterval(id), 8000);
});

const page = await ctx.newPage();
await page.goto(SITE, { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(1500);

// ---- Fonte A: Web Animations API -------------------------------------------
const waapi = await page.evaluate(() => {
  const caminho = (el) => {
    if (!el || !el.tagName) return "(sem elemento)";
    const partes = [];
    let n = el;
    for (let i = 0; n && n.tagName && i < 4; i++) {
      partes.unshift(n.tagName.toLowerCase() + (n.id ? "#" + n.id : ""));
      n = n.parentElement;
    }
    return partes.join(">");
  };
  // ⚠️ Um caminho tipo `div>div>div>div` não serve de seletor e não reconstrói
  // nada. O que casa o elemento animado do ORIGINAL com o do CLONE é a
  // GEOMETRIA (mesma caixa no mesmo viewport) mais um trecho de texto — e isso
  // funciona justamente porque a altura do clone bate com a do original.
  const assinatura = (el) => {
    if (!el || !el.getBoundingClientRect) return null;
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.left + window.scrollX),
      y: Math.round(r.top + window.scrollY),
      w: Math.round(r.width),
      h: Math.round(r.height),
      tag: el.tagName.toLowerCase(),
      texto: (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60),
      framerName: el.getAttribute?.("data-framer-name") ?? null,
    };
  };
  const colher = (lista) =>
    lista.map((a) => {
      let keyframes = [];
      try {
        keyframes = a.effect?.getKeyframes?.() ?? [];
      } catch {
        /* alguns efeitos recusam */
      }
      const t = a.effect?.getTiming?.() ?? {};
      return {
        nome: a.animationName ?? a.transitionProperty ?? a.id ?? "(anônima)",
        alvo: caminho(a.effect?.target),
        assinatura: assinatura(a.effect?.target),
        // 🚨 O easing POR KEYFRAME não pode ser descartado. Numa animação CSS,
        // `getTiming().easing` devolve o timing-function global, e a curva real
        // costuma estar declarada em cada keyframe — jogar fora esse campo faz
        // a reconstrução escrever `linear` onde o original tem uma bezier, e o
        // erro não aparece em nenhuma medição de geometria. Medido no site-next: os
        // 6 registros do motivo `enter` saíram todos como `ease: "linear"`,
        // que é falso.
        keyframes: keyframes.map((k) => {
          const { composite, computedOffset, ...resto } = k;
          // `offset` explícito pode ser null; o computado é o que vale de fato
          return { ...resto, offsetComputado: computedOffset ?? null };
        }),
        duracao: typeof t.duration === "number" ? Math.round(t.duration) : String(t.duration ?? ""),
        atraso: Math.round(t.delay ?? 0),
        ease: t.easing ?? "",
        repeticoes: t.iterations === Infinity ? "infinita" : t.iterations,
        // 🚨 `fill` decide se o elemento FICA no estado final. Sem ele, uma
        // entrada reconstruída volta ao estado inicial ao terminar — e a página
        // fica em branco onde o original está visível. É o campo que separa
        // `animation: x 1s` de `animation: x 1s both`.
        preenchimento: t.fill ?? "auto",
        direcao: t.direction ?? "normal",
        atrasoFinal: Math.round(t.endDelay ?? 0),
        inicioDaIteracao: t.iterationStart ?? 0,
        estado: a.playState,
        propriedades: [...new Set(keyframes.flatMap((k) => Object.keys(k)))].filter(
          (p) => !["offset", "computedOffset", "easing", "composite"].includes(p),
        ),
      };
    });
  const doLoad = (window.__mov?.doLoad ?? []).map((x) => x.a);
  return {
    agora: colher(document.getAnimations({ subtree: true })),
    doLoad: colher(doLoad),
  };
});

// ---- Fonte B: amostragem de estilo computado por rAF ------------------------
const amostragem = await page.evaluate(async (ms) => {
  const PROPS = ["transform", "opacity", "left", "top", "width", "height", "filter", "backgroundColor", "color"];
  // Watch-list enxuta: varrer a página inteira por quadro trava o navegador.
  const alvos = Array.from(document.querySelectorAll("body *"))
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 8 && r.height > 8 && r.top < window.innerHeight * 1.5;
    })
    .slice(0, 120);

  const leitura = () => alvos.map((el) => PROPS.map((p) => getComputedStyle(el)[p]).join("|"));
  const primeira = leitura();
  const mudou = new Array(alvos.length).fill(false);
  const quadros = [];

  await new Promise((pronto) => {
    const inicio = performance.now();
    const passo = () => {
      const atual = leitura();
      for (let i = 0; i < atual.length; i++) if (atual[i] !== primeira[i]) mudou[i] = true;
      quadros.push(performance.now() - inicio);
      if (performance.now() - inicio < ms) requestAnimationFrame(passo);
      else pronto();
    };
    requestAnimationFrame(passo);
  });

  const caminho = (el) => {
    const partes = [];
    let n = el;
    for (let i = 0; n && n.tagName && i < 4; i++) {
      partes.unshift(n.tagName.toLowerCase() + (n.id ? "#" + n.id : ""));
      n = n.parentElement;
    }
    return partes.join(">");
  };

  return {
    observados: alvos.length,
    mudaram: mudou.filter(Boolean).length,
    quadros: quadros.length,
    fps: Math.round((quadros.length / (quadros[quadros.length - 1] || 1)) * 1000),
    exemplos: alvos.filter((_, i) => mudou[i]).slice(0, 12).map(caminho),
  };
}, AMOSTRA);

// ---- Fonte C: amostrar DURANTE o scroll ------------------------------------
//
// 🚨 O ponto cego que me fez concluir errado uma vez: a Fonte A não vê motor
// por rAF, e a Fonte B amostrava com a página PARADA. Resultado: declarei
// "zero animação de scroll" num site cuja nav colapsa e cuja barra de contato
// desliza ao rolar. As duas fontes concordaram — e as duas estavam cegas para
// a mesma coisa.
//
// Contar animação nova depois do scroll NÃO basta: quem anima por rAF em
// estilo inline nunca aparece em `getAnimations()`, nem antes nem depois.
// Quem responde é medir a GEOMETRIA durante o scroll.
const antesDoScroll = waapi.agora.length;

const duranteScroll = await page.evaluate(async () => {
  // Identidade estável: tag + texto + índice entre irmãos. Comparar por
  // ÍNDICE da lista não serve — elementos entram e saem do filtro ao rolar,
  // e aí se compara um elemento com outro e chama isso de movimento.
  const chave = (el) => {
    const pai = el.parentElement;
    const idx = pai ? Array.prototype.indexOf.call(pai.children, el) : -1;
    return el.tagName + "|" + idx + "|" + (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 24);
  };
  const colher = () => {
    const m = new Map();
    for (const el of Array.from(document.querySelectorAll("body *")).slice(0, 400)) {
      const b = el.getBoundingClientRect();
      if (b.width < 20 || b.height < 12) continue;
      const pos = getComputedStyle(el).position;
      // ⚠️ Elemento `fixed`/`sticky` muda de posição DOCUMENTAL por definição
      // quando a página rola — medi-lo assim conta como "mexeu" quem só está
      // parado na tela. Para esses, o que importa é a posição no VIEWPORT;
      // para o resto, a posição no documento.
      const fixo = pos === "fixed" || pos === "sticky";
      m.set(chave(el), [
        Math.round(fixo ? b.top : b.top + window.scrollY),
        Math.round(b.width),
        Math.round(b.height),
        fixo ? 1 : 0,
      ]);
    }
    return m;
  };

  const inicial = colher();
  const mexeram = new Set();
  const passo = Math.max(200, window.innerHeight * 0.8);
  for (let y = 0; y < document.body.scrollHeight; y += passo) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 120));
    const agora = colher();
    for (const [k, v] of agora) {
      const i = inicial.get(k);
      if (!i) continue;
      if (Math.abs(i[0] - v[0]) > 2 || Math.abs(i[1] - v[1]) > 2 || Math.abs(i[2] - v[2]) > 2) mexeram.add(k);
    }
  }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 700));

  const noFim = colher();
  const naoVoltaram = [];
  for (const [k, v] of noFim) {
    const i = inicial.get(k);
    if (!i) continue;
    if (Math.abs(i[0] - v[0]) > 2 || Math.abs(i[2] - v[2]) > 2) naoVoltaram.push({ chave: k, de: i, para: v });
  }

  return {
    observados: inicial.size,
    mexeramNoScroll: mexeram.size,
    exemplos: [...mexeram].slice(0, 10),
    naoVoltaramAoTopo: naoVoltaram.length,
    exemplosNaoVoltaram: naoVoltaram.slice(0, 6),
  };
});

const depoisDoScroll = await page.evaluate(() => document.getAnimations({ subtree: true }).length);

await navegador.close();

const relatorio = {
  site: SITE,
  largura: LARGURA,
  fonteA_waapi: {
    total: waapi.agora.length,
    capturadasNoLoad: waapi.doLoad.length,
    antesDoScroll,
    depoisDoScroll,
    novasComScroll: Math.max(0, depoisDoScroll - antesDoScroll),
    animacoes: waapi.agora,
    // ⚠️ O DETALHE das animações de load é o que a reconstrução consome
    // (duração, atraso, ease e propriedades de cada uma). Guardar só a
    // CONTAGEM não basta: contagem não reconstrói nada.
    animacoesDoLoad: waapi.doLoad,
  },
  fonteB_amostragem: amostragem,
  fonteC_scroll: duranteScroll,
};
writeFileSync(join(SAIDA, "movimento.json"), JSON.stringify(relatorio, null, 2), "utf8");

console.log(`inventário de movimento — ${SITE} @${LARGURA}`);
console.log(`\n  FONTE A (Web Animations API)`);
console.log(`    animações vivas agora:      ${waapi.agora.length}`);
console.log(`    capturadas no load:         ${waapi.doLoad.length}`);
console.log(`    novas depois do scroll:     ${Math.max(0, depoisDoScroll - antesDoScroll)}`);
console.log(`\n  FONTE B (estilo computado por rAF, ${AMOSTRA}ms)`);
console.log(`    elementos observados:       ${amostragem.observados}`);
console.log(`    elementos que MUDARAM:      ${amostragem.mudaram}`);
console.log(`    quadros amostrados:         ${amostragem.quadros} (~${amostragem.fps}fps)`);

console.log(`\n  FONTE C (geometria DURANTE o scroll)`);
console.log(`    elementos observados:       ${duranteScroll.observados}`);
console.log(`    MEXERAM ao rolar:           ${duranteScroll.mexeramNoScroll}`);
console.log(`    não voltaram ao estado inicial: ${duranteScroll.naoVoltaramAoTopo}`);
if (duranteScroll.mexeramNoScroll > 0 && Math.max(0, depoisDoScroll - antesDoScroll) === 0) {
  console.log(`\n🚨 Há comportamento de scroll que a WAAPI NÃO registra.`);
  console.log(`   ${duranteScroll.mexeramNoScroll} elemento(s) mudaram de geometria ao rolar sem`);
  console.log(`   nenhuma animação nova aparecer — é motor por rAF (Framer Motion, GSAP).`);
  console.log(`   Contar getAnimations() antes e depois do scroll daria ZERO aqui, e ZERO`);
  console.log(`   seria a conclusão errada.`);
  for (const e of duranteScroll.exemplos.slice(0, 5)) console.log(`     ${e}`);
}

if (waapi.agora.length === 0 && amostragem.mudaram > 0) {
  console.log(`\n🚨 A WAAPI não vê este movimento. ${amostragem.mudaram} elemento(s) mudaram`);
  console.log(`   de estilo sem nenhuma animação registrada — é motor por rAF`);
  console.log(`   (GSAP, Framer Motion). Medir por amostragem, nunca por getAnimations.`);
} else if (amostragem.mudaram === 0 && waapi.agora.length === 0) {
  console.log(`\n  Nada se mexeu nas duas fontes. Página parada neste viewport.`);
}
console.log(`\n-> ${join(SAIDA, "movimento.json")}`);
