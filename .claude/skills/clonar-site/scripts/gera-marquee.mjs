// gera-marquee.mjs — liga o marquee/ticker de uma rota: mede a velocidade no
// ORIGINAL e escreve `--ditto-marquee-vel` no CSS da rota, contra o data-cid
// do trilho do CLONE. O runtime (public/marquee.js) só anima trilho com var.
//
// Por que por rota e por trilho: cada ticker tem velocidade própria (medido:
// badges da home 75px/s, preços do service 69.8px/s) e o cid reinicia por
// rota — var global animaria o trilho errado na rota errada.
//
// Como mede: detecção por duas fotos separadas (o trilho anda sozinho), rolagem
// até o trilho, amostragem rAF, velocidade = MEDIANA das velocidades quadro a
// quadro excluindo saltos de wrap (|dx|>=100px).
//
// Como casa original→clone: mesma contagem de itens e mesma sequência de
// larguras (±3px), na mesma ordem do documento. Sem par → declara, não escreve.
//
// O que o faz SE CALAR:
//   - nenhum trilho vivo no original                 -> nada escrito
//   - espalhamento p10-p90 acima de 20% da mediana   -> declara, não escreve
//   - trilho sem par estrutural no clone             -> declara, não escreve
//   - par sem data-cid                               -> declara, não escreve
//
// Uso:
//   ORIGINAL=... CLONE=http://127.0.0.1:8082 APP=<app> ROTA=/ \
//   [ANCORAS=0,2400] node gera-marquee.mjs
//
// Variáveis: ORIGINAL, CLONE, APP (obrigatórias), ROTA (padrão /),
//   ANCORAS (padrão "0" + posição de cada ul do clone), DETECCAO (padrão 6000),
//   AMOSTRA (padrão 12000), ESCREVER (0 simula), DITTO

import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const ORIGINAL = process.env.ORIGINAL, CLONE = process.env.CLONE, APP = process.env.APP;
if (!ORIGINAL || !CLONE || !APP) { console.error("faltam ORIGINAL/CLONE/APP"); process.exit(1); }
const ROTA = process.env.ROTA ?? "/";
const DETECCAO = Number(process.env.DETECCAO ?? 6000);
const AMOSTRA = Number(process.env.AMOSTRA ?? 12000);
const ESCREVER = process.env.ESCREVER !== "0";
const LARGURA = Number(process.env.LARGURA ?? 1280);
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

const nav = await chromium.launch();

// ---- 0. a FASE DE REPOUSO do original, medida com reduced-motion ----------
// 🚨 A captura congela o trilho numa fase arbitrária do loop (medido: o ticker
// do service sai em x=-1276.9 onde o original repousa em x=-20, 1256px de
// diferença). Sem isto o clone NASCE fora de fase: quem abre com
// prefers-reduced-motion vê o trilho deslocado, e toda medição de geometria
// acusa os cards do trilho como "fora do lugar". O repouso do original é
// estável (3 cargas, mesmo valor), então é medível e vale como número.
async function faseDeRepouso(rota) {
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto(new URL(rota, ORIGINAL).href, { waitUntil: "load", timeout: 60000 });
  await p.waitForTimeout(2200);
  const r = await p.evaluate(() =>
    [...document.querySelectorAll("ul")].filter((u) => u.children.length >= 3).map((u) => {
      let x = 0;
      try { x = new DOMMatrixReadOnly(getComputedStyle(u).transform === "none" ? "" : getComputedStyle(u).transform).e; } catch {}
      // o texto do PRIMEIRO item: sem ele o reparo do clone reconstrói o loop
      // a partir de qualquer janela saudável e a sequência sai ROTACIONADA
      // (medido: original começa em "Cosmetic Dentistry" e o clone em "Teeth
      // Whitening" — cards certos, ordem trocada, dx de até 1244px)
      const t0 = u.children[0] ? (u.children[0].innerText || "").replace(/\s+/g, " ").trim().slice(0, 24) : "";
      return { itens: u.children.length, larguras: [...u.children].map((c) => Math.round(c.getBoundingClientRect().width)), x: Math.round(x * 10) / 10, inicio: t0 };
    })
  );
  await ctx.close();
  return r;
}
const repousos = await faseDeRepouso(ROTA);

// ---- 1. os candidatos do CLONE (é lá que precisamos do cid) ----------------
const pc = await nav.newPage({ viewport: { width: LARGURA, height: 900 } });
await pc.goto(new URL(ROTA, CLONE).href, { waitUntil: "load", timeout: 60000 });
await pc.waitForTimeout(1200);
const trilhosClone = await pc.evaluate(() => {
  // 🚨 SÓ TRILHO VISÍVEL NA LARGURA MEDIDA. O site emite o mesmo componente
  // duas vezes, uma por faixa de largura, e esconde uma com `display:none`.
  // Trilho de logotipo não tem texto, então o casamento cai na posição — e os
  // dois gêmeos ficam na MESMA posição. Medido no framer-6: o ticker de logos
  // da home casa com o gêmeo `2xl` (invisível a 1280px), a variável de
  // velocidade é escrita nele, e o trilho que aparece na tela fica parado
  // para sempre. Caixa de largura zero não é trilho: é o gêmeo
  // do outro breakpoint.
  const visivel = (el) => {
    for (let p = el; p; p = p.parentElement) {
      const c = getComputedStyle(p);
      if (c.display === "none" || c.visibility === "hidden") return false;
    }
    return el.getBoundingClientRect().width > 0;
  };
  return [...document.querySelectorAll("ul")]
    .filter(visivel)
    .map((el) => {
      const r = el.getBoundingClientRect();
      return {
        cid: el.getAttribute("data-cid"),
        docY: Math.round(r.top + scrollY),
        itens: el.children.length,
        larguras: [...el.children].map((c) => Math.round(c.getBoundingClientRect().width)),
        // identidade de CONTEÚDO, para não casar trilho pelo tamanho da caixa
        textos: [...el.children].map((c) => (c.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60)).filter(Boolean),
      };
    })
    .filter((u) => u.itens >= 6);
});
await pc.close();

// ---- 2. medir o ORIGINAL: quem anda, e a que velocidade --------------------
const po = await nav.newPage({ viewport: { width: LARGURA, height: 900 } });
await po.goto(new URL(ROTA, ORIGINAL).href, { waitUntil: "load", timeout: 60000 });
await po.waitForTimeout(2000);
await po.evaluate(() => {
  // ⚠️ SEM filtro de contagem de filhos no stamping: ticker virtualizado nasce
  // VAZIO no topo da página e só popula quando o scroll aproxima (medido no
  // framer-2: o de preços tinha 0 li no load e 8 na âncora — o filtro ">=6
  // filhos" o descartava antes de ele existir). A contagem se mede DEPOIS,
  // já na âncora. Carimba-se também quem tem transform inline.
  let i = 0;
  const set = new Set([...document.querySelectorAll("ul"), ...document.querySelectorAll('[style*="transform"]')]);
  for (const el of set) el.setAttribute("data-gm", String(i++));
});
const ancoras = (process.env.ANCORAS ?? ["0", ...trilhosClone.map((t) => String(Math.max(0, t.docY - 300)))].join(",")).split(",").map(Number);
const vivos = new Set();
for (const anc of [...new Set(ancoras)]) {
  await po.evaluate((y) => scrollTo(0, y), anc);
  await po.waitForTimeout(1200);
  const foto = () => po.evaluate(() => {
    const m = {};
    for (const el of document.querySelectorAll("[data-gm]")) m[el.getAttribute("data-gm")] = getComputedStyle(el).transform;
    return m;
  });
  const f1 = await foto();
  await po.waitForTimeout(DETECCAO);
  const f2 = await foto();
  for (const k of Object.keys(f1)) if (f1[k] !== f2[k]) vivos.add(k);
}

const medidos = [];
for (const id of vivos) {
  const info = await po.evaluate((i) => {
    const el = document.querySelector(`[data-gm="${i}"]`);
    // 🚨 o carimbo pode não sobreviver: o Framer remonta a árvore ao trocar de
    // breakpoint ou ao rolar, e o elemento marcado na detecção deixa de
    // existir na hora de medir. Sem esta guarda o instrumento morre com
    // "Cannot read properties of null" e perde a rodada inteira, inclusive os
    // trilhos que já tinham casado (medido no framer-4 a 1920px).
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const sigs = [...el.children].map((c) => {
      const txt = (c.innerText || "").replace(/\s+/g, " ").trim().slice(0, 60);
      const srcs = [...c.querySelectorAll("img")].map((im) => (im.getAttribute("src") || "").slice(-24)).join(",");
      return txt + "|" + srcs;
    });
    // período de CONTEÚDO do loop, medido no original (mínimo 2 pares de prova)
    let periodo = 0;
    for (let p = 2; p <= sigs.length - 2; p++) {
      let ok = true;
      for (let k = 0; k + p < sigs.length; k++) if (sigs[k] !== sigs[k + p]) { ok = false; break; }
      if (ok) { periodo = p; break; }
    }
    return {
      docY: Math.round(r.top + scrollY),
      itens: el.children.length,
      periodo,
      larguras: [...el.children].map((c) => Math.round(c.getBoundingClientRect().width)),
      textos: [...el.children].map((c) => (c.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60)).filter(Boolean),
    };
  }, id);
  if (!info) {
    console.log(`⚠️ trilho ${id}: o elemento marcado sumiu do DOM antes da medição (remontagem do framework) — declarado, não escrito`);
    continue;
  }
  await po.evaluate((y) => scrollTo(0, Math.max(0, y - 300)), info.docY);
  await po.waitForTimeout(1200);
  const serie = await po.evaluate(
    ({ i, ms }) => new Promise((fim) => {
      const el = document.querySelector(`[data-gm="${i}"]`);
      const pts = [];
      const t0 = performance.now();
      (function tick(t) {
        const m = new DOMMatrixReadOnly(getComputedStyle(el).transform === "none" ? "" : getComputedStyle(el).transform);
        pts.push([t - t0, m.e]);
        if (t - t0 < ms) requestAnimationFrame(tick); else fim(pts);
      })(performance.now());
    }),
    { i: id, ms: AMOSTRA }
  );
  // 🚨 A velocidade se mede numa JANELA de quadros, nunca entre quadros
  // vizinhos. A ~60px/s e 60fps o trilho anda 1px por quadro: o compositor
  // arredonda o transform e o `dx` de um quadro vale 0 ou 1 — ruído de ±50%
  // na velocidade instantânea. A mediana sobrevive, mas o espalhamento
  // p10–p90 fica dominado pela quantização, e o guard "não é velocidade
  // constante" reprovaria trilho perfeitamente constante.
  // Medido no framer-6: mediana -61,9px/s com p10 -89,8 e p90
  // -42,5 (espalhamento de 47px/s onde o limite é 12,4) — três trilhos
  // recusados, nenhum deles irregular. Com janela de 30 quadros (~500ms) o
  // mesmo trilho passa, porque o erro de arredondamento se dilui no percurso.
  const JANELA = Number(process.env.JANELA ?? 30);
  // 🚨 O salto do laço se reconhece pelo DESVIO em relação à mediana, nunca
  // por um limite fixo de px. O corte antigo (|dx| >= 100px) foi calibrado
  // para quadros VIZINHOS; numa janela de 30 quadros um trilho de 208px/s
  // percorre ~104px de forma perfeitamente legítima e seria inteiro
  // descartado como wrap — restando só o ruído, que mediu o mesmo trilho a
  // 59,7px/s (medido no framer-6, trilho de cards da home). O wrap é minoria
  // por construção (um por período), então a mediana é o deslocamento SÃO, e
  // o salto é o que se afasta demais dela — em qualquer velocidade.
  const brutos = [];
  for (let i = JANELA; i < serie.length; i++) {
    const dt = serie[i][0] - serie[i - JANELA][0], dx = serie[i][1] - serie[i - JANELA][1];
    if (dt > 0) brutos.push({ dt, dx });
  }
  const dxOrdenado = brutos.map((b) => b.dx).sort((a, b) => a - b);
  const dxMediana = dxOrdenado.length ? dxOrdenado[Math.floor(dxOrdenado.length / 2)] : 0;
  const vels = brutos
    .filter((b) => Math.abs(dxMediana) > 0 && Math.abs(b.dx - dxMediana) <= Math.abs(dxMediana) * 0.5)
    .map((b) => (b.dx / b.dt) * 1000);
  if (vels.length < 30) { console.log(`⚠️ trilho ${id}: só ${vels.length} amostras — declarado, não escrito`); continue; }
  vels.sort((a, b) => a - b);
  const med = vels[Math.floor(vels.length / 2)];
  const p10 = vels[Math.floor(vels.length * 0.1)], p90 = vels[Math.floor(vels.length * 0.9)];
  if (Math.abs(med) < 5) { console.log(`⚠️ trilho ${id}: velocidade ~0 (${med.toFixed(1)}) — parado, nada escrito`); continue; }
  if (Math.abs(p90 - p10) > Math.abs(med) * 0.2) {
    console.log(`⚠️ trilho ${id}: espalhamento alto (p10 ${p10.toFixed(1)} / p90 ${p90.toFixed(1)}, mediana ${med.toFixed(1)}) — não é velocidade constante, declarado`);
    continue;
  }
  medidos.push({ id, ...info, velocidade: Math.round(Math.abs(med) * 10) / 10, sentido: med < 0 ? "esquerda" : "direita" });
}
await po.close();
await nav.close();

if (!medidos.length) {
  console.log(`nenhum trilho vivo/medível no original em ${ROTA} — nada escrito`);
  process.exit(0);
}

// ---- 3. casar com o clone e escrever a var ---------------------------------
// 🚨 UM trilho do clone serve a UM trilho do original. Sem controlar isso, o
// primeiro candidato compatível por CONTAGEM e LARGURA casa com todos:
// medido no framer-6, os três marquees da home (logos y=940,
// cards y=7643, depoimentos y=9481) casam com o MESMO `n249`, e o bloco
// sai com três regras conflitantes para um cid só — animando o trilho errado
// e deixando dois parados. Caixa não é identidade.
// A ordem das provas: TEXTO do conteúdo primeiro (identidade forte), posição
// depois (o layout já foi provado igual pela geometria), caixa por último.
const usados = new Set();
const casadas = [];
for (const m of medidos) {
  // Prefixo tolerante: a captura DERRUBA item de loop (medido: 7 li no clone
  // onde o original tem 8) e COLAPSA largura a zero. O par vale se cada item
  // do clone bater com o do original no mesmo índice (±3px), ignorando os de
  // largura 0 (colapsados — defeito próprio, tratado pelo corrige-caixa-vazia),
  // e se faltarem no máximo 4 itens de cauda. Os que faltam saem DECLARADOS na
  // var --ditto-marquee-completar, e o runtime repõe o clone de loop.
  const compativel = (t) =>
    !usados.has(t.cid) &&
    t.itens <= m.itens && m.itens - t.itens <= 4 &&
    t.larguras.every((w, i) => w === 0 || Math.abs(w - m.larguras[i]) <= 3);

  // 1ª prova: o texto do conteúdo. Trilho de logotipo não tem texto nenhum, e
  // aí esta prova se cala em vez de reprovar (o `src` não serve: o clone
  // reescreve toda imagem para hash, então nunca bateria com o do original).
  const chaveTexto = (t) => (t.textos && t.textos.length ? t.textos[0].slice(0, 40) : null);
  const alvoTexto = chaveTexto(m);
  let candidatos = trilhosClone.filter(compativel);
  if (alvoTexto) {
    const porTexto = candidatos.filter((t) => chaveTexto(t) === alvoTexto);
    if (porTexto.length) candidatos = porTexto;
  }
  // 2ª prova: a POSIÇÃO. A geometria já foi provada igual, então o trilho
  // certo é o que está na mesma altura — e não o primeiro da lista.
  const par = candidatos.sort((a, b) => Math.abs(a.docY - m.docY) - Math.abs(b.docY - m.docY))[0];
  if (par) usados.add(par.cid);
  if (!par) {
    console.log(`⚠️ trilho original y=${m.docY} (${m.itens} itens): SEM PAR no clone — declarado`);
    console.log(`   larguras original: ${JSON.stringify(m.larguras)}`);
    for (const t of trilhosClone) console.log(`   candidato clone cid=${t.cid} itens=${t.itens} y=${t.docY} larguras=${JSON.stringify(t.larguras)}`);
    continue;
  }
  if (!par.cid) { console.log(`⚠️ trilho y=${m.docY}: par sem data-cid — declarado`); continue; }
  // a fase de repouso do trilho equivalente (casada pela sequência de larguras)
  const rep = repousos.find((r) => r.larguras.length && m.larguras.length &&
    r.larguras.every((w, i) => m.larguras[i] === undefined || Math.abs(w - m.larguras[i]) <= 3));
  casadas.push({ cid: par.cid, velocidade: m.velocidade, docY: m.docY, itens: m.itens, sentido: m.sentido, periodo: m.periodo, x0: rep ? rep.x : null, inicio: rep ? rep.inicio : null });
}
if (!casadas.length) { console.log("nenhum trilho casou — nada escrito"); process.exit(0); }

// 🚨 A home pode morar no grupo de rotas `(inicio)` (ver entrega-inline.mjs),
// onde ela ganha o layout próprio que a raiz não pode ter. Todo instrumento que
// escreve folha por rota tem de procurar o grupo PRIMEIRO — senão cria
// src/app/scroll.css, que nenhuma página importa, e a correção parece feita sem
// nunca chegar à tela, e uma rodada inteira se perde.
const arq =
  ROTA === "/"
    ? existsSync(join(APP, "src", "app", "(inicio)", "page.tsx"))
      ? join(APP, "src", "app", "(inicio)", "scroll.css")
      : join(APP, "src", "app", "scroll.css")
    : join(APP, "src", "app", ...ROTA.split("/").filter(Boolean), "scroll.css");
const marcador = "/* == gera-marquee == */";
let css = existsSync(arq) ? readFileSync(arq, "utf8") : "";
if (css.includes(marcador)) {
  const ini = css.indexOf(marcador);
  const fim = css.indexOf("/* == /gera-marquee == */");
  css = css.slice(0, ini) + css.slice(fim + "/* == /gera-marquee == */".length);
  writeFileSync(arq, css);
}
const bloco =
  `${marcador}\n/* velocidade medida no original (mediana rAF); o runtime public/marquee.js só anima trilho com esta var */\n` +
  casadas.map((c) => {
    const ini = c.inicio ? ` --ditto-marquee-inicio: "${c.inicio.replace(/"/g, "")}";` : "";
    let s = `[data-cid="${c.cid}"] { --ditto-marquee-vel: ${c.velocidade};${c.periodo ? ` --ditto-marquee-periodo: ${c.periodo}; --ditto-marquee-itens: ${c.itens};` : ""}${c.x0 !== null ? ` --ditto-marquee-x0: ${c.x0};` : ""}${ini} } /* y=${c.docY}, ${c.itens} itens no original, ${c.sentido} */`;
    if (c.x0 !== null) {
      // fase de REPOUSO medida: vale enquanto o runtime não assumiu (e sempre,
      // sob prefers-reduced-motion, em que o runtime nem liga)
      s += `\n[data-cid="${c.cid}"]:not([data-marquee="1"]) { transform: translateX(${c.x0}px) !important; } /* repouso medido no original */`;
    }
    return s;
  }).join("\n") +
  `\n/* == /gera-marquee == */\n`;
if (ESCREVER) {
  appendFileSync(arq, "\n" + bloco);
  console.log(`✅ ${ROTA}: ${casadas.length} trilho(s) -> ${arq}`);
  for (const c of casadas) console.log(`   ${c.cid}: ${c.velocidade}px/s (${c.itens} itens, y=${c.docY})`);
} else {
  console.log(`(simulação) ${ROTA}:`);
  console.log(bloco);
}
