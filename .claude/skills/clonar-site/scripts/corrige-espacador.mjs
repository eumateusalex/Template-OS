// corrige-espacador.mjs — o ESPAÇADOR relativo ao viewport que a captura
// congelou em px.
//
// 🚨 Irmão do corrige-viewport.mjs, e existe por causa de um buraco dele: para
// casar um contêiner sem texto, aquele instrumento desce até o primeiro
// DESCENDENTE com texto. Um espaçador não tem descendente nenhum — é uma
// <section> vazia que só ocupa altura. Ele não entra nem como candidato, e o
// defeito passa inteiro.
//
// 🚨 E o estrago é o pior de todos de diagnosticar: um espaçador de topo
// errado por 40px desloca A PÁGINA INTEIRA por 40px. Medido no framer-9,
// em 4 rotas ao mesmo tempo: o histograma de desvios é um balde só
// ({-40: 74}), começando no PRIMEIRO texto da página. Cada elemento parece
// estar errado; o errado é um só, e vazio.
//
//   original    700    900   1100     -> 280 / 360 / 440 = 0.4·viewport (40vh)
//   clone       320    320    320     -> congelado na janela de captura (800)
//
// 🚨 COMO CASAR UM ELEMENTO SEM TEXTO NENHUM: pelo VIZINHO SEGUINTE. Acha-se
// o próximo elemento com texto próprio na ordem do documento, casa-se ESSE no
// original pelo texto, e sobe-se do vizinho até o espaçador contando os mesmos
// passos. É o espelho do casamento por descendente — quando não há descendente,
// o que sobra é a vizinhança.
//
// 🚨 O CONTROLE QUE AUTORIZA ESCREVER é o mesmo do corrige-viewport: mede-se o
// ORIGINAL em várias alturas de janela e só se escreve `Nvh` se a razão
// altura/viewport for a MESMA em todas. Espaçador que no original também é
// fixo fica declarado, não escrito.
//
// O que o faz SE CALAR:
//   - nenhum espaçador congelado na rota            -> não escreve
//   - o original também é fixo                      -> declara, não escreve
//   - a razão não é constante entre as alturas      -> declara, não escreve
//   - o texto do vizinho não casa, ou casa 2+ vezes -> declara, não escreve
//   - o candidato tem texto (não é espaçador)       -> nem entra
//   - mais regras que MAX_REGRAS                    -> declara, não escreve nada
//
// 🚨 REGRA 4: dono de `height` de ELEMENTO VAZIO. O corrige-viewport é dono de
// height de elemento com conteúdo. Os dois nunca escrevem no mesmo cid — este
// pula quem já está no viewport.css da rota.
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 APP=<app> \
//   ROTAS=<med>/rotas.json SAIDA=<med>/espacador node corrige-espacador.mjs
//
// Variáveis:
//   ALTURAS     alturas de janela a testar (padrão 700,900,1100)
//   LARGURA     largura fixa durante o teste (padrão 1280)
//   MIN_PX      altura mínima para considerar espaçador (padrão 40)
//   ALTURA_CAPTURA  altura da janela em que o ditto capturou (padrão 800) — é
//               a régua que separa CONGELADO de COLAPSADO: um elemento
//               realmente congelado mede razão × esta altura no clone

//   TOL         px de folga na conferência da razão (padrão 1.5)
//   MAX_REGRAS  teto por rota (padrão 30)
//   ESCREVER    0 simula

import { createRequire } from "node:module";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const ORIGINAL = process.env.ORIGINAL;
const CLONE = process.env.CLONE;
const APP = process.env.APP;
if (!ORIGINAL || !CLONE || !APP) {
  console.error("faltam ORIGINAL, CLONE e/ou APP");
  process.exit(1);
}
const ALTURAS = (process.env.ALTURAS ?? "700,900,1100").split(",").map(Number).filter(Boolean);
const LARGURA = Number(process.env.LARGURA ?? 1280);
const MIN_PX = Number(process.env.MIN_PX ?? 40);
// altura da janela em que o ditto CAPTUROU — é a régua que separa elemento
// congelado (mede razão × esta altura) de elemento colapsado por outro motivo.
// Confere-se no clone: um `100vh` congelado mede exatamente este valor.
const ALTURA_CAPTURA = Number(process.env.ALTURA_CAPTURA ?? 800);
const TOL = Number(process.env.TOL ?? 1.5);
const MAX_REGRAS = Number(process.env.MAX_REGRAS ?? 30);
const ESCREVER = process.env.ESCREVER !== "0";
const SAIDA = resolve(process.env.SAIDA ?? "./espacador");
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
mkdirSync(SAIDA, { recursive: true });

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

function rotas() {
  const r = process.env.ROTAS;
  if (!r) return ["/"];
  if (existsSync(r) && require("node:fs").statSync(r).isFile()) {
    const j = JSON.parse(readFileSync(r, "utf8"));
    return j.rotas.filter((x) => x.status === 200).map((x) => x.rota);
  }
  return r.split(",").map((s) => s.trim()).filter(Boolean);
}

const pastaDaRota = (rota) => join(APP, "src", "app", ...(rota === "/" ? [] : rota.replace(/^\//, "").split("/")));

// No CLONE: espaçadores congelados + o texto do vizinho seguinte que os ancora.
const colheClone = (MIN_PX) => {
  const semTexto = (el) => (el.textContent || "").trim() === "";
  // 🚨 SEM TEXTO NÃO É SER ESPAÇADOR. Imagem, SVG, vídeo e canvas também não
  // têm texto, e são CONTEÚDO: a altura deles significa alguma coisa.
  // Aceitá-los propõe `height:40vh` para um <img>, um <svg> e um <a> — os
  // três casando no MESMO espaçador do original. Espaçador é
  // caixa vazia: nada dentro, e nenhuma mídia por dentro.
  // ⚠️ `tagName` de elemento SVG vem em MINÚSCULA ("svg"), ao contrário do HTML.
  // Comparar sem normalizar deixou <svg> passar como espaçador — e o
  // instrumento propôs 200vh para um ícone. Medido no framer-9.
  const MIDIA = new Set(["IMG", "SVG", "VIDEO", "CANVAS", "PICTURE", "IFRAME", "OBJECT"]);
  const ehEspacador = (el) =>
    semTexto(el) &&
    !MIDIA.has(String(el.tagName).toUpperCase()) &&
    !el.querySelector("img, svg, video, canvas, picture, iframe, object");
  const todos = [...document.querySelectorAll("[data-cid]")];
  const saida = [];
  for (let i = 0; i < todos.length; i++) {
    const el = todos[i];
    if (!ehEspacador(el)) continue;
    const cs = getComputedStyle(el);
    if (!/px$/.test(cs.height)) continue;
    const h = parseFloat(cs.height);
    if (!(h >= MIN_PX)) continue;
    if (cs.position === "absolute" || cs.position === "fixed") continue;
    // 🚨 O casamento é ESTRUTURAL, não "o vazio mais próximo". Acha-se o
    // próximo elemento com texto (a âncora) e mede-se em QUANTOS NÍVEIS acima
    // da âncora este espaçador é o irmão anterior. Esse par (texto, nível) é
    // reproduzível no original e é injetivo por construção: dois espaçadores
    // diferentes ou têm âncoras diferentes, ou níveis diferentes.
    // Pegar "o elemento vazio mais próximo antes da âncora" põe três
    // candidatos no mesmo alvo — inclusive o espaçador de topo CERTO, que é
    // descartado junto (medido no framer-9, /legal).
    // A âncora é o primeiro elemento com texto que COMEÇA onde este espaçador
    // TERMINA (mesmo critério geométrico usado no original — os dois lados
    // precisam perguntar a mesma coisa, senão casam elementos diferentes).
    const base = el.getBoundingClientRect().top + window.scrollY + h;
    let ancora = null;
    for (let j = i + 1; j < todos.length && j < i + 120; j++) {
      const t = (todos[j].textContent || "").trim();
      if (t.length < 4) continue;
      const topo = todos[j].getBoundingClientRect().top + window.scrollY;
      if (Math.abs(topo - base) > 3) continue;
      ancora = { texto: t.slice(0, 60) };
      break;
    }
    if (!ancora) continue;
    saida.push({ cid: el.dataset.cid, h, tag: el.tagName.toLowerCase(), ancora });
  }
  return saida;
};

// No ORIGINAL: dado o texto-âncora, sobe até o espaçador vazio anterior e mede.
// ⚠️ A varredura do DOM é feita UMA vez e reaproveitada por todas as âncoras.
// Refazer `querySelectorAll` + `textContent` por âncora, com 38 âncoras numa
// página do Framer, derruba o navegador na 8ª rota ("Target page, context or
// browser has been closed"). Medido no framer-9.
const mediuOriginal = (ancoras) => {
  const todos = [...document.querySelectorAll("body *")];
  const textos = todos.map((el) => (el.textContent || "").trim());
  const res = {};
  for (const a of ancoras) {
    const idxCasam = [];
    for (let i = 0; i < todos.length && idxCasam.length <= 4; i++) {
      if (!textos[i].startsWith(a.texto)) continue;
      // o mais fundo que ainda contém o texto inteiro (evita pegar o ancestral)
      const filhoIgual = [...todos[i].children].some((c) => (c.textContent || "").trim() === textos[i]);
      if (!filhoIgual) idxCasam.push(i);
    }
    if (idxCasam.length === 0) { res[a.cid] = { erro: "âncora não achada" }; continue; }
    // ⚠️ Texto repetido em elementos ANINHADOS não é ambiguidade real: h1, span
    // e wrappers carregam o mesmo texto e começam na mesma altura. Quem
    // desambigua é a geometria logo abaixo — tenta-se cada casamento e vale o
    // primeiro que tenha um elemento vazio terminando onde ele começa.
    // Rejeitar por contagem descartava o espaçador de topo CERTO em 3 rotas.
    if (idxCasam.length > 8) { res[a.cid] = { erro: `âncora ambígua demais (${idxCasam.length})` }; continue; }
    // 🚨 Casamento GEOMÉTRICO, não estrutural. O DOM do clone NÃO tem o mesmo
    // aninhamento do original — o ditto acrescenta e remove níveis de wrapper —
    // então contar níveis não atravessa os dois lados (medido: recusou 100% dos
    // candidatos, inclusive os certos). O que define um espaçador é onde ele
    // COMEÇA e ONDE TERMINA: é a caixa vazia que acaba onde o conteúdo começa.
    // Então: entre os elementos vazios do original, o alvo é o que termina na
    // altura em que a âncora começa.
    let esp = null, alturaEsp = -1;
    for (const idxA of idxCasam) {
      const topoAncora = todos[idxA].getBoundingClientRect().top + window.scrollY;
      if (topoAncora <= 0) continue; // âncora invisível/no topo absoluto não serve de referência
      for (let j = 0; j < todos.length; j++) {
        if (textos[j] !== "") continue;
        const r = todos[j].getBoundingClientRect();
        if (r.height < 20 || r.width <= 0) continue;
        const base = r.top + window.scrollY + r.height;
        if (Math.abs(base - topoAncora) > 3) continue;
        if (r.height > alturaEsp) { alturaEsp = r.height; esp = todos[j]; }
      }
      if (esp) break;
    }
    if (!esp) { res[a.cid] = { erro: "nenhum elemento vazio termina onde a âncora começa, no original" }; continue; }
    // devolve QUAL elemento do original casou, para o chamador provar que o
    // casamento é um-para-um (dois candidatos no mesmo alvo = casamento falso)
    res[a.cid] = { h: Math.round(esp.getBoundingClientRect().height * 100) / 100, alvo: todos.indexOf(esp) };
  }
  return res;
};

// ⚠️ UM navegador, UM contexto, UMA página, reaproveitados — e ressuscitados se
// morrerem. Abrir contexto por altura (3 por rota) matou o navegador na 8ª rota
// do framer-9. A altura muda por setViewportSize + reload, que recarrega a
// página COM a janela já no tamanho certo (layout de load, não de resize).
let nav = await chromium.launch();
let ctx = await nav.newContext({ viewport: { width: LARGURA, height: ALTURAS[0] }, deviceScaleFactor: 1 });
let pg = await ctx.newPage();
const ressuscita = async () => {
  try { await nav.close(); } catch { /* já morto */ }
  nav = await chromium.launch();
  ctx = await nav.newContext({ viewport: { width: LARGURA, height: ALTURAS[0] }, deviceScaleFactor: 1 });
  pg = await ctx.newPage();
  console.log("   ♻️ navegador reiniciado");
};
const abre = async (url, altura, espera) => {
  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    try {
      await pg.setViewportSize({ width: LARGURA, height: altura });
      await pg.goto(url, { waitUntil: "load", timeout: 45000 });
      await pg.waitForTimeout(espera);
      return true;
    } catch (e) {
      console.log(`   ⚠️ falha ao abrir ${url} @${altura}: ${String(e.message).slice(0, 60)}`);
      await ressuscita();
    }
  }
  return false;
};

// 🚨 Servidor do clone no ar ANTES de medir. Sem isto, toda rota falha ao abrir
// e o instrumento reporta "0 candidatos" em todas — que é indistinguível de
// "nada congelado", a pior forma de falso sucesso: se o serve-clone.mjs morre
// no meio, uma rodada inteira mede o nada.
try {
  const r = await fetch(CLONE, { redirect: "follow" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
} catch (e) {
  console.error(`⛔ o clone não responde em ${CLONE} (${e.message}) — suba o serve-clone.mjs antes`);
  await nav.close();
  process.exit(1);
}

const relatorio = [];

for (const rota of rotas()) {
  const uo = new URL(rota, ORIGINAL).href;
  const uc = new URL(rota, CLONE).href;
  console.log(`\n=== ${rota}`);

  // 1. candidatos no clone, na primeira altura
  if (!(await abre(uc, ALTURAS[0], 900))) {
    // 🚨 O clone não abrir quase sempre é o SERVIDOR fora do ar, não defeito da
    // rota. Sai como pendência declarada, nunca como "nada a corrigir aqui".
    relatorio.push({ rota, candidatos: 0, regras: 0, recusas: ["clone não abriu (servidor fora do ar?)"] });
    continue;
  }
  let candidatos = await pg.evaluate(colheClone, MIN_PX);

  // não disputar cid com o corrige-viewport (regra 4)
  const arqViewport = join(pastaDaRota(rota), "viewport.css");
  if (existsSync(arqViewport)) {
    const jaEscritos = new Set([...readFileSync(arqViewport, "utf8").matchAll(/data-cid="([^"]+)"/g)].map((m) => m[1]));
    candidatos = candidatos.filter((c) => !jaEscritos.has(c.cid));
  }
  console.log(`   espaçadores congelados: ${candidatos.length}`);
  if (!candidatos.length) { relatorio.push({ rota, candidatos: 0, regras: 0, recusas: [] }); continue; }

  // 2. medir o original em cada altura, na MESMA página (recarregada)
  const porAltura = {};
  let abortou = false;
  for (const alt of ALTURAS) {
    if (!(await abre(uo, alt, 1400))) { abortou = true; break; }
    porAltura[alt] = await pg.evaluate(mediuOriginal, candidatos.map((c) => ({ cid: c.cid, texto: c.ancora.texto, nivel: c.ancora.nivel })));
  }
  if (abortou) { relatorio.push({ rota, candidatos: candidatos.length, regras: 0, recusas: ["original não abriu em alguma altura"] }); continue; }

  // 🚨 O casamento tem que ser UM-PARA-UM. Se dois candidatos do clone chegam
  // ao MESMO elemento do original, no máximo um está certo e não há como saber
  // qual — os dois saem declarados. Sem este controle o instrumento propõe
  // `40vh` para quatro elementos diferentes do /journal com a medição idêntica
  // do mesmo espaçador (medido no framer-9).
  const donos = new Map();
  for (const c of candidatos) {
    const m = porAltura[ALTURAS[0]][c.cid];
    if (m && m.alvo != null) donos.set(m.alvo, (donos.get(m.alvo) ?? 0) + 1);
  }

  // 3. decidir: razão constante -> vh; senão declara
  const regras = [], recusas = [];
  for (const c of candidatos) {
    const medidas = ALTURAS.map((a) => porAltura[a][c.cid]);
    const erro = medidas.find((m) => m && m.erro);
    if (erro) { recusas.push(`${c.cid}: ${erro.erro}`); continue; }
    const alvo = medidas[0] && medidas[0].alvo;
    if (alvo != null && donos.get(alvo) > 1) {
      recusas.push(`${c.cid}: casamento não é um-para-um (${donos.get(alvo)} candidatos no mesmo alvo)`);
      continue;
    }
    if (medidas.some((m) => !m || m.h == null)) { recusas.push(`${c.cid}: não medido em alguma altura`); continue; }
    // ⚠️ "original também é fixo" vem ANTES de "razão não é constante": altura
    // fixa TEM razão variável por definição, e reportá-la como razão inconstante
    // esconde o diagnóstico. Medido no framer-9: as rotas /legal saíram como
    // "razão 0.314/0.244/0.200" quando a verdade era 220px fixos nas três.
    const variacao = Math.max(...medidas.map((m) => m.h)) - Math.min(...medidas.map((m) => m.h));
    if (variacao <= TOL) { recusas.push(`${c.cid}: original também é fixo (${medidas[0].h}px)`); continue; }
    const razoes = medidas.map((m, i) => m.h / ALTURAS[i]);
    const media = razoes.reduce((a, b) => a + b, 0) / razoes.length;
    const constante = ALTURAS.every((a, i) => Math.abs(medidas[i].h - media * a) <= TOL);
    if (!constante) {
      recusas.push(`${c.cid}: razão não é constante (${razoes.map((r) => r.toFixed(3)).join("/")})`);
      continue;
    }
    // 🚨 O CONTROLE QUE SEPARA "CONGELADO" DE "COLAPSADO". Se o elemento é
    // mesmo `Nvh` congelado, o valor no clone TEM que ser N × a altura da
    // janela em que o ditto capturou. Quando não é, o elemento não foi
    // congelado — ele colapsou por outro motivo (contêiner pinado que o clone
    // não tem, caixa sem conteúdo), e escrever `Nvh` ali não devolve estrutura
    // nenhuma: inventa altura.
    // Medido no framer-9: 4 <section> do /stories dariam 200vh
    // (= 1600px na captura) e medem 523px no clone. Aplicar somaria mais
    // de 5000px a uma página que precisa de 40. Este guard barra as quatro.
    const previsto = media * ALTURA_CAPTURA;
    if (Math.abs(c.h - previsto) > Math.max(TOL, previsto * 0.02)) {
      recusas.push(`${c.cid}: não é congelamento — no clone mede ${c.h}px, e ${(media * 100).toFixed(1)}vh na janela de captura (${ALTURA_CAPTURA}px) daria ${previsto.toFixed(1)}px`);
      continue;
    }
    const vh = Math.round(media * 1000) / 10;
    regras.push(`  [data-cid="${c.cid}"][data-cid]{height:${vh}vh !important}  /* <${c.tag}> vazio: medido ${medidas.map((m, i) => `${m.h}@${ALTURAS[i]}`).join(" ")}; a captura congelou em ${c.h}px (= ${vh}vh de ${ALTURA_CAPTURA}px) */`);
  }

  const arq = join(pastaDaRota(rota), "espacador.css");
  if (regras.length > MAX_REGRAS) {
    console.log(`   ⛔ ${regras.length} regras passam do teto ${MAX_REGRAS} — não escrevi nada`);
  } else if (!regras.length) {
    console.log(`   (nada a escrever)`);
  } else if (!existsSync(pastaDaRota(rota))) {
    console.log(`   ⛔ pasta da rota não existe`);
  } else if (ESCREVER) {
    writeFileSync(arq, [
      "/* espacador.css — espaçador VAZIO relativo ao viewport que a captura",
      `   congelou em px. Razão medida no original nas alturas ${ALTURAS.join("/")}px,`,
      "   e só escrita quando é a mesma em todas. Por scripts/corrige-espacador.mjs.",
      `   Origem: ${uo} */`,
      ...regras,
    ].join("\n") + "\n");
    console.log(`   ✅ ${regras.length} regra(s) -> ${arq}`);
  } else {
    console.log(`   (ESCREVER=0) ${regras.length} regra(s) seriam escritas`);
  }
  for (const r of recusas.slice(0, 6)) console.log(`   ⚠️ ${r}`);
  if (recusas.length > 6) console.log(`   ⚠️ ... e mais ${recusas.length - 6}`);
  relatorio.push({ rota, candidatos: candidatos.length, regras: regras.length, recusas });
  // progresso salvo a cada rota: uma queda no meio não custa as anteriores
  writeFileSync(join(SAIDA, "espacador.json"), JSON.stringify({ ALTURAS, LARGURA, relatorio }, null, 2));
}

try { await nav.close(); } catch { /* já morto */ }
writeFileSync(join(SAIDA, "espacador.json"), JSON.stringify({ ALTURAS, LARGURA, relatorio }, null, 2));
console.log("\n" + "=".repeat(70));
console.log(`TOTAL: ${relatorio.reduce((s, r) => s + r.regras, 0)} regra(s) · ${relatorio.reduce((s, r) => s + r.recusas.length, 0)} declarada(s)`);
console.log("🚨 entregar (entrega-inline/import) e rebuildar — escrever não é aplicar.");
