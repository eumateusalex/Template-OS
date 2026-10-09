// corrige-tipografia-fluida.mjs — o tamanho que NÃO trava, escrito como clamp.
//
// 🚨 O par do corrige-tipografia.mjs. Aquele conserta o que trava numa faixa,
// e DECLARA o que não trava, porque escrever px fixo onde o original é fluido
// é inventar número. Este resolve o declarado, medindo a fórmula.
//
// Uma escala fluida é `clamp(piso, Xvw, teto)`: constante embaixo, uma rampa
// proporcional à largura no meio, constante em cima. O formato se descobre
// MEDINDO o original em várias larguras — não se adivinha. A rampa se acha
// por RAZÃO CONSTANTE (v/L igual em vários pontos), não por reta genérica:
// ver o bloco de `modelar()` para o número que provou isso.
//
// 🚨 O CONTROLE QUE AUTORIZA ESCREVER: o modelo é calculado sem um dos pontos
// da rampa e depois VERIFICADO nele. Se a previsão erra mais que TOL_PREV, o
// modelo não descreve o original e o elemento sai DECLARADO, sem regra.
// Ajustar e escrever sem checar previsão seria trocar um número inventado por
// um número inventado com álgebra.
//
// Por que isso importa, medido no site-landing: um único parágrafo
// (`n35` da /infraestrutura) ficava 33px mais alto no clone porque quebrava
// numa linha a mais, e sozinho empurrava 14 elementos abaixo dele. Ele é
// justamente um dos que não travam, então o instrumento de valor fixo não
// podia tocá-lo.
//
// 🚨 REGRA 4: dono de font-size/line-height dos elementos FLUIDOS, e só deles.
// Os cids que o corrige-tipografia.mjs já resolveu com valor fixo não entram
// aqui — este instrumento só olha quem continua divergindo depois daquele.
//
// O que o faz SE CALAR:
//   - nada divergindo na rota                    -> não escreve
//   - a curva não tem rampa identificável        -> declara, não escreve
//   - a previsão no ponto reservado erra         -> declara, não escreve
//   - elemento sem data-cid                      -> declara, não escreve
//   - mais regras que MAX_REGRAS                 -> declara, não escreve nada
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 APP=<app> \
//   ROTAS=<med>/rotas.json SAIDA=<med>/fluida node corrige-tipografia-fluida.mjs
//
// Variáveis:
//   LARGURAS    onde medir (padrão 375,650,900,1050,1100,1150,1200,1250,1300,1400,1500,1920)
//   RESERVADA   largura tirada do cálculo e usada só para verificar (padrão 1200)
//   TOL_RAZAO   folga relativa em v/L para dois pontos serem a mesma rampa (padrão 0.01)
//   TOL         px para considerar dois tamanhos iguais (padrão 0.05)
//   TOL_PREV    erro máximo aceito na largura reservada (padrão 0.2)
//   MAX_REGRAS  teto por rota (padrão 400)
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
const LARGURAS = (process.env.LARGURAS ?? "375,650,900,1050,1100,1150,1200,1250,1300,1400,1500,1920")
  .split(",").map(Number).filter(Boolean).sort((a, b) => a - b);
const RESERVADA = Number(process.env.RESERVADA ?? 1200);   // fica DENTRO da rampa
const TOL = Number(process.env.TOL ?? 0.05);
const TOL_PREV = Number(process.env.TOL_PREV ?? 0.2);
const TOL_RAZAO = Number(process.env.TOL_RAZAO ?? 0.01);   // 1% em v/L conta como mesma rampa
const MAX_REGRAS = Number(process.env.MAX_REGRAS ?? 400);
const ESCREVER = process.env.ESCREVER !== "0";
const SAIDA = resolve(process.env.SAIDA ?? "./tipografia-fluida");
const DITTO = process.env.DITTO ?? "C:/dev/ditto";

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

function rotas() {
  const arq = process.env.ROTAS;
  if (arq && existsSync(arq)) {
    const j = JSON.parse(readFileSync(arq, "utf8"));
    const lista = j.rotas ?? j;
    return (Array.isArray(lista) ? lista : Object.keys(lista))
      .map((r) => (typeof r === "string" ? r : r.rota ?? r.path))
      .filter(Boolean);
  }
  if (arq) return arq.split(",").map((s) => s.trim()).filter(Boolean);
  return [process.env.ROTA ?? "/"];
}

const COLHER = () => {
  const norm = (s) => s.replace(/\s+/g, " ").trim();
  const saida = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    let p = "";
    for (const n of el.childNodes) if (n.nodeType === 3) p += n.nodeValue;
    p = norm(p);
    if (!p) continue;
    saida.push({
      tag: el.tagName.toLowerCase(),
      cid: el.getAttribute("data-cid") || null,
      texto: p.slice(0, 60),
      y: Math.round((r.top + window.scrollY) * 10) / 10,
      fs: parseFloat(cs.fontSize),
      lh: cs.lineHeight === "normal" ? null : parseFloat(cs.lineHeight),
    });
  }
  return saida;
};

async function colher(nav, url, largura) {
  const ctx = await nav.newContext({ viewport: { width: largura, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1400);
  const r = await page.evaluate(COLHER);
  await ctx.close();
  return r;
}

const chave = (it) => `${it.tag}|${it.texto}`;

/** Ajusta fs = a + b*(largura/100) por mínimos quadrados. */
function reta(pontos) {
  const n = pontos.length;
  const sx = pontos.reduce((s, p) => s + p.x, 0);
  const sy = pontos.reduce((s, p) => s + p.y, 0);
  const sxx = pontos.reduce((s, p) => s + p.x * p.x, 0);
  const sxy = pontos.reduce((s, p) => s + p.x * p.y, 0);
  const den = n * sxx - sx * sx;
  if (Math.abs(den) < 1e-9) return null;
  const b = (n * sxy - sx * sy) / den;
  const a = (sy - b * sx) / n;
  return { a, b };
}

/** 🚨 O MODELO CERTO SAIU DA CURVA MEDIDA, NÃO DE UM PALPITE.
 *
 *  Medido no site-landing, o parágrafo `n35` da /infraestrutura:
 *
 *    largura  650  800  1100   1200   1280   1440
 *    original  16   17  17.6   19.2  20.48     21
 *
 *  17.6/1100 = 19.2/1200 = 20.48/1280 = 0,016. Ou seja a rampa é `1.6vw`
 *  PURO, com piso e teto — a forma `clamp(min, Xvw, max)`, que é como se
 *  escreve escala fluida na prática. Ajustar uma reta genérica ali erra:
 *  com os pontos do piso no ajuste, a previsão fura 0,5px e o instrumento
 *  recusa tudo (corretamente).
 *
 *  Então o teste é de RAZÃO, não de reta: procura o maior conjunto de
 *  larguras em que v/L é constante. Esse conjunto é a rampa; o menor valor
 *  medido é o piso e o maior é o teto.
 *
 *  Cai para reta `a + b*vw` só se a razão não fechar em ponto nenhum. */
function modelar(serie) {
  if (serie.length < 3) return { erro: `série curta (${serie.length})` };
  const piso = Math.min(...serie.map((p) => p.v));
  const teto = Math.max(...serie.map((p) => p.v));
  if (teto - piso <= TOL) return { erro: "não varia" };

  // 1) rampa por razão constante: v = B * (L/100)
  const razoes = serie.map((p) => ({ ...p, r: p.v / p.L }));
  let melhor = null;
  for (const base of razoes) {
    const grupo = razoes.filter((q) => Math.abs(q.r - base.r) / base.r <= TOL_RAZAO);
    // um ponto só no piso ou no teto casa consigo mesmo: exigir 3 e que o
    // grupo não seja o próprio patamar (valores todos iguais).
    const varia = Math.max(...grupo.map((g) => g.v)) - Math.min(...grupo.map((g) => g.v)) > TOL;
    if (grupo.length >= 3 && varia && (!melhor || grupo.length > melhor.grupo.length)) melhor = { grupo, r: base.r };
  }
  if (melhor) {
    const r = melhor.grupo.reduce((s, g) => s + g.r, 0) / melhor.grupo.length;
    // VERIFICAÇÃO: o ponto da rampa que ficou de fora do cálculo tem que ser
    // previsto. Sem isso o "modelo" é só uma média com nome bonito.
    const fora = melhor.grupo.find((g) => g.L === RESERVADA) ?? melhor.grupo[melhor.grupo.length - 1];
    const semFora = melhor.grupo.filter((g) => g !== fora);
    const r2 = semFora.reduce((s, g) => s + g.r, 0) / semFora.length;
    const err = Math.abs(r2 * fora.L - fora.v);
    if (err > TOL_PREV) return { erro: `razão prevê ${err.toFixed(2)}px fora em ${fora.L}px` };
    return { tipo: "vw", piso, teto, b: r * 100, pontos: melhor.grupo.length, err };
  }

  // 2) fallback: reta sobre o trecho estritamente crescente
  const cresc = [];
  for (let i = 1; i < serie.length; i++) {
    if (serie[i].v - serie[i - 1].v > TOL) {
      if (!cresc.length) cresc.push(serie[i - 1]);
      cresc.push(serie[i]);
    } else if (cresc.length) break;
  }
  if (cresc.length < 3) return { erro: `sem rampa identificável (razão não fecha, ${cresc.length} pontos crescentes)` };
  const fora = cresc.find((g) => g.L === RESERVADA) ?? cresc[cresc.length - 1];
  const ajuste = cresc.filter((g) => g !== fora);
  const m = reta(ajuste.map((p) => ({ x: p.L / 100, y: p.v })));
  if (!m) return { erro: "reta degenerada" };
  const err = Math.abs(m.a + m.b * (fora.L / 100) - fora.v);
  if (err > TOL_PREV) return { erro: `reta prevê ${err.toFixed(2)}px fora em ${fora.L}px` };
  return { tipo: "reta", piso, teto, a: m.a, b: m.b, pontos: cresc.length, err };
}

mkdirSync(SAIDA, { recursive: true });
const nav = await chromium.launch();
const relatorio = [];

for (const rota of rotas()) {
  const uo = new URL(rota, ORIGINAL).href;
  const uc = new URL(rota, CLONE).href;
  console.log(`\n=== ${rota}`);

  // 1. onde ainda diverge? só isso interessa.
  const [oRef, cRef] = await Promise.all([colher(nav, uo, 1280), colher(nav, uc, 1280)]);
  const oPiso = await colher(nav, uo, 375);
  const cPiso = await colher(nav, uc, 375);
  const mapaC = new Map();
  for (const it of cRef) if (it.cid) mapaC.set(chave(it), it);
  const mapaCP = new Map();
  for (const it of cPiso) if (it.cid) mapaCP.set(chave(it), it);

  const alvos = new Map();
  for (const it of oRef) {
    const c = mapaC.get(chave(it));
    if (c && (Math.abs(c.fs - it.fs) > TOL || (c.lh != null && it.lh != null && Math.abs(c.lh - it.lh) > TOL))) alvos.set(chave(it), c.cid);
  }
  for (const it of oPiso) {
    const c = mapaCP.get(chave(it));
    if (c && (Math.abs(c.fs - it.fs) > TOL || (c.lh != null && it.lh != null && Math.abs(c.lh - it.lh) > TOL))) alvos.set(chave(it), c.cid);
  }
  console.log(`   ainda divergem (1280 ou 375): ${alvos.size}`);
  if (!alvos.size) { relatorio.push({ rota, alvos: 0, regras: 0, recusas: [] }); continue; }

  // 2. curva do ORIGINAL em todas as larguras
  const serieFs = new Map();
  const serieLh = new Map();
  for (const L of LARGURAS) {
    const itens = await colher(nav, uo, L);
    const vistos = new Set();
    for (const it of itens) {
      const k = chave(it);
      if (!alvos.has(k) || vistos.has(k)) continue;
      vistos.add(k);
      if (!serieFs.has(k)) { serieFs.set(k, []); serieLh.set(k, []); }
      serieFs.get(k).push({ L, v: it.fs });
      if (it.lh != null) serieLh.get(k).push({ L, v: it.lh });
    }
    console.log(`   medido o original @${L}px`);
  }

  // 3. descrever, ajustar, VERIFICAR na largura reservada
  const regras = [];
  const recusas = [];
  for (const [k, cid] of alvos) {
    if (!cid) { recusas.push(`${k.slice(0, 34)}: sem data-cid`); continue; }
    const decl = [];
    for (const [nome, serieMapa] of [["font-size", serieFs], ["line-height", serieLh]]) {
      const serie = (serieMapa.get(k) ?? []).slice().sort((a, b) => a.L - b.L);
      if (serie.length < LARGURAS.length) continue;   // não apareceu em toda largura
      const constante = serie.every((p) => Math.abs(p.v - serie[0].v) <= TOL);
      if (constante) continue;                        // não é fluido: não é problema deste
      const d = modelar(serie);
      if (d.erro) { recusas.push(`${cid} ${nome}: ${d.erro}`); continue; }
      const b = Math.round(d.b * 1000) / 1000;
      const meio = d.tipo === "vw" ? `${b}vw` : `calc(${Math.round(d.a * 1000) / 1000}px + ${b}vw)`;
      decl.push(`${nome}:clamp(${Math.round(d.piso * 1000) / 1000}px, ${meio}, ${Math.round(d.teto * 1000) / 1000}px) !important`);
    }
    if (!decl.length) continue;
    regras.push(`  [data-cid="${cid}"][data-cid]{${decl.join(";")}}  /* ${k.slice(0, 34).replace(/\*\//g, "")} */`);
  }

  const dir = rota === "/" ? join(APP, "src/app") : join(APP, "src/app", rota.replace(/^\//, ""));
  const arq = join(dir, "tipografia-fluida.css");
  if (!regras.length) {
    console.log("   ✅ nada a escrever");
  } else if (regras.length > MAX_REGRAS) {
    console.log(`   ⛔ ${regras.length} acima do teto ${MAX_REGRAS} — não escrevi nada`);
  } else if (ESCREVER) {
    const L = [
      "/* tipografia-fluida.css — tamanhos que NÃO travam, escritos como clamp().",
      "   A reta foi AJUSTADA sobre o original medido em várias larguras e",
      `   VERIFICADA na largura ${RESERVADA}px, que ficou fora do ajuste.`,
      `   Origem: ${uo}  ·  larguras: ${LARGURAS.join("/")} */`,
      ...regras,
    ];
    writeFileSync(arq, L.join("\n") + "\n");
    console.log(`   ✅ ${regras.length} regra(s) -> ${arq}`);
  } else {
    console.log(`   (ESCREVER=0) ${regras.length} regra(s) seriam escritas`);
  }
  for (const r of recusas.slice(0, 10)) console.log(`   ⚠️ ${r}`);
  if (recusas.length > 10) console.log(`   ⚠️ ... e mais ${recusas.length - 10}`);
  relatorio.push({ rota, alvos: alvos.size, regras: regras.length, recusas });
}

await nav.close();
writeFileSync(join(SAIDA, "fluida.json"), JSON.stringify({ LARGURAS, RESERVADA, TOL, TOL_PREV, relatorio }, null, 2));
console.log("\n" + "=".repeat(70));
console.log(`TOTAL: ${relatorio.reduce((s, r) => s + r.regras, 0)} regra(s) · ${relatorio.reduce((s, r) => s + r.recusas.length, 0)} declarada(s)`);
console.log("🚨 rodar entrega-inline.mjs com tipografia-fluida.css na lista e rebuildar.");
