// corrige-viewport.mjs — o ditto CONGELA tamanho relativo ao viewport.
//
// 🚨 Classe de defeito medida no clone do site-landing.
// O que no original é `height: 100vh` (ou 100dvh, 50vw, etc.)
// sai do ditto como px FIXO, do tamanho da janela em que ele capturou.
//
// Medido, no overlay do modal da /ai-first:
//
//   viewport   700    900   1100
//   original  700px  900px 1100px   <- acompanha, é 100vh
//   clone     800px  800px  800px   <- congelado na janela da captura
//
// 🚨 E o estrago aparece LONGE do culpado. O modal é centrado dentro desse
// overlay: 100px a menos de contêiner sobem o modal 50px, e o
// `compara-geometria` acusa SEIS elementos do modal fora do lugar, nenhum
// deles o overlay — que não tem texto e por isso nem entra no casamento.
//
// 🚨 COMO CASAR UM CONTÊINER SEM TEXTO: pelo DESCENDENTE. Acha-se o primeiro
// descendente com texto próprio, casa-se ESSE no original (casamento
// confiável), e sobe-se o mesmo número de níveis. É o espelho do que o
// corrige-caixa-vazia.mjs faz com o ancestral.
//
// 🚨 O CONTROLE QUE AUTORIZA ESCREVER: mede-se o ORIGINAL em várias alturas de
// viewport e só se escreve `Nvh` se a razão tamanho/viewport for a MESMA em
// todas. Um elemento que por acaso tem 900px numa janela de 900px não é
// 100vh, e sem esse controle viraria um.
//
// O que o faz SE CALAR:
//   - nada congelado na rota                      -> não escreve
//   - o original também é fixo                    -> declara, não escreve
//   - a razão não é constante entre as alturas    -> declara, não escreve
//   - o descendente âncora não casa, ou é ambíguo -> declara, não escreve
//   - mais regras que MAX_REGRAS                  -> declara, não escreve nada
//
// 🚨 REGRA 4: dono de height/width de elemento que acompanha o viewport.
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 APP=<app> \
//   ROTAS=<med>/rotas.json SAIDA=<med>/viewport node corrige-viewport.mjs
//
// Variáveis:
//   ALTURAS     alturas de viewport a testar (padrão 700,900,1100)
//   LARGURA     largura fixa durante o teste de altura (padrão 1280)
//   TOL         px de folga (padrão 1)
//   MAX_REGRAS  teto por rota (padrão 60)
//   ESCREVER    0 simula
//   AJUSTE      "linear" aceita altura MISTA h = a + b·viewport e escreve
//               calc(a px + (100·b)vh). Medido no framer-3: a seção de
//               features mede 492 + 5.25·viewport no original — razão
//               h/viewport NUNCA constante, e o modo padrão recusa certo.
//               Guard próprio: os 3+ pontos têm que cair na MESMA reta (cada
//               ponto do meio dentro de TOL da reta dos extremos), e
//               |b| < 0.02 continua contando como "original também é fixo".
//               Padrão: desligado — o comportamento provado no site-landing
//               não muda sem pedir.

import { createRequire } from "node:module";
import { writeFileSync, readFileSync, existsSync, mkdirSync, statSync } from "node:fs";
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
const TOL = Number(process.env.TOL ?? 1);
const MAX_REGRAS = Number(process.env.MAX_REGRAS ?? 60);
const ESCREVER = process.env.ESCREVER !== "0";
const AJUSTE = process.env.AJUSTE ?? "razao"; // "razao" (provado no site-landing) | "linear" (framer-3)
const SAIDA = resolve(process.env.SAIDA ?? "./viewport");
const DITTO = process.env.DITTO ?? "C:/dev/ditto";

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

function rotas() {
  const arq = process.env.ROTAS;
  // ⚠️ Tem que ser ARQUIVO, não só "existe": "/" é um caminho que EXISTE (a
  // raiz do disco) e o readFileSync estoura com EISDIR. É o que acontece com
  // `ROTAS=/` para tratar só a home. O compara-geometria.mjs carrega o mesmo
  // guard.
  if (arq && existsSync(arq) && statSync(arq).isFile()) {
    const j = JSON.parse(readFileSync(arq, "utf8"));
    const lista = j.rotas ?? j;
    return (Array.isArray(lista) ? lista : Object.keys(lista))
      .map((r) => (typeof r === "string" ? r : r.rota ?? r.path))
      .filter(Boolean);
  }
  if (arq) return arq.split(",").map((s) => s.trim()).filter(Boolean);
  return [process.env.ROTA ?? "/"];
}

/** No CLONE: todo elemento com cid, sua altura e uma âncora de descendente. */
const COLHER_CLONE = () => {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const textoProprio = (el) => {
    let t = "";
    for (const n of el.childNodes) if (n.nodeType === 3) t += n.nodeValue;
    return norm(t);
  };
  const saida = [];
  for (const el of document.querySelectorAll("body *")) {
    const cid = el.getAttribute("data-cid");
    if (!cid) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none") continue;
    const r = el.getBoundingClientRect();
    if (r.height <= 0) continue;
    // só interessa quem é grande o bastante para ser candidato a viewport
    if (r.height < window.innerHeight * 0.4) continue;

    // âncora: primeiro descendente com texto próprio, e quantos níveis abaixo
    let ancora = null;
    const fila = [{ el, prof: 0 }];
    while (fila.length) {
      const { el: e, prof } = fila.shift();
      if (prof > 0 && textoProprio(e)) { ancora = { tag: e.tagName.toLowerCase(), texto: textoProprio(e).slice(0, 60), prof }; break; }
      for (const c of e.children) fila.push({ el: c, prof: prof + 1 });
      if (prof > 6) break;
    }
    if (!ancora) continue;
    saida.push({ cid, tag: el.tagName.toLowerCase(), h: Math.round(r.height * 10) / 10, hCss: cs.height, pos: cs.position, ancora });
  }
  return { vh: window.innerHeight, itens: saida };
};

/** No ORIGINAL: dada a âncora, sobe `prof` níveis e mede. */
const MEDIR_ORIGINAL = ({ pedidos }) => {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const textoProprio = (el) => {
    let t = "";
    for (const n of el.childNodes) if (n.nodeType === 3) t += n.nodeValue;
    return norm(t);
  };
  const porChave = new Map();
  for (const el of document.querySelectorAll("body *")) {
    const t = textoProprio(el);
    if (!t) continue;
    const k = `${el.tagName.toLowerCase()}|${t.slice(0, 60)}`;
    if (!porChave.has(k)) porChave.set(k, []);
    porChave.get(k).push(el);
  }
  const saida = [];
  for (const p of pedidos) {
    const cand = porChave.get(`${p.ancora.tag}|${p.ancora.texto}`) || [];
    if (cand.length !== 1) { saida.push({ cid: p.cid, erro: cand.length ? "âncora ambígua" : "âncora não achada" }); continue; }
    let no = cand[0];
    for (let i = 0; i < p.ancora.prof && no; i++) no = no.parentElement;
    if (!no || no === document.body) { saida.push({ cid: p.cid, erro: "subida saiu da árvore" }); continue; }
    const r = no.getBoundingClientRect();
    saida.push({ cid: p.cid, h: Math.round(r.height * 10) / 10, tag: no.tagName.toLowerCase() });
  }
  return { vh: window.innerHeight, itens: saida };
};

async function medir(nav, url, altura, fn, arg) {
  const ctx = await nav.newContext({ viewport: { width: LARGURA, height: altura } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const r = await page.evaluate(fn, arg);
  await ctx.close();
  return r;
}

mkdirSync(SAIDA, { recursive: true });
const nav = await chromium.launch();
const relatorio = [];

for (const rota of rotas()) {
  const uo = new URL(rota, ORIGINAL).href;
  const uc = new URL(rota, CLONE).href;
  console.log(`\n=== ${rota}`);

  // 1. clone nas várias alturas: quem NÃO muda de altura é candidato
  const porAltura = [];
  for (const A of ALTURAS) porAltura.push(await medir(nav, uc, A, COLHER_CLONE));
  const base = new Map(porAltura[0].itens.map((i) => [i.cid, i]));
  const congelados = [];
  for (const [cid, it] of base) {
    let constante = true;
    for (const m of porAltura.slice(1)) {
      const o = m.itens.find((x) => x.cid === cid);
      if (!o || Math.abs(o.h - it.h) > TOL) { constante = false; break; }
    }
    if (constante) congelados.push(it);
  }
  console.log(`   candidatos com altura congelada no clone: ${congelados.length}`);
  if (!congelados.length) { relatorio.push({ rota, congelados: 0, regras: 0, recusas: [] }); continue; }

  // 2. o original acompanha o viewport nesses mesmos elementos?
  const medidasO = [];
  for (const A of ALTURAS) medidasO.push(await medir(nav, uo, A, MEDIR_ORIGINAL, { pedidos: congelados }));

  const regras = [];
  const recusas = [];
  for (const c of congelados) {
    const linha = medidasO.map((m) => ({ vh: m.vh, o: m.itens.find((x) => x.cid === c.cid) }));
    if (linha.some((l) => !l.o || l.o.erro)) { recusas.push(`${c.cid}: ${linha.find((l) => !l.o || l.o.erro)?.o?.erro ?? "sem medida"}`); continue; }
    // o original ser constante em px desqualifica nos dois modos: aí não é vh
    const alturas = linha.map((l) => l.o.h);
    if (Math.max(...alturas) - Math.min(...alturas) <= TOL) { recusas.push(`${c.cid}: original também é fixo (${alturas[0]}px)`); continue; }
    if (AJUSTE === "linear") {
      // reta pelos extremos; TODO ponto do meio tem que cair nela (guard)
      const p0 = linha[0], pN = linha[linha.length - 1];
      const b = (pN.o.h - p0.o.h) / (pN.vh - p0.vh);
      const a = p0.o.h - b * p0.vh;
      const residuo = Math.max(...linha.map((l) => Math.abs(a + b * l.vh - l.o.h)));
      if (residuo > TOL) { recusas.push(`${c.cid}: não cai numa reta (resíduo ${residuo.toFixed(1)}px nas alturas ${linha.map((l) => l.vh).join("/")})`); continue; }
      if (Math.abs(b) < 0.02) { recusas.push(`${c.cid}: coeficiente de viewport desprezível (b=${b.toFixed(3)})`); continue; }
      const aR = Math.round(a * 10) / 10;
      const bR = Math.round(b * 10000) / 100; // 100·b, em "vh"
      regras.push(`  [data-cid="${c.cid}"][data-cid]{height:calc(${aR}px + ${bR}vh) !important}  /* <${c.tag}> ${c.pos}: medido h=${aR}+${b.toFixed(3)}·viewport; a captura congelou em ${c.hCss} */`);
    } else {
      const razoes = linha.map((l) => l.o.h / l.vh);
      const media = razoes.reduce((s, r) => s + r, 0) / razoes.length;
      const constante = razoes.every((r) => Math.abs(r - media) * linha[0].vh <= TOL);
      if (!constante) { recusas.push(`${c.cid}: original não acompanha o viewport (razões ${razoes.map((r) => r.toFixed(3)).join("/")})`); continue; }
      const vh = Math.round(media * 1000) / 10;
      regras.push(`  [data-cid="${c.cid}"][data-cid]{height:${vh}vh !important}  /* <${c.tag}> ${c.pos}: a captura congelou em ${c.hCss} */`);
    }
  }

  const dir = rota === "/" ? join(APP, "src/app") : join(APP, "src/app", rota.replace(/^\//, ""));
  const arq = join(dir, "viewport.css");
  if (!regras.length) {
    console.log("   ✅ nada a corrigir");
  } else if (regras.length > MAX_REGRAS) {
    console.log(`   ⛔ ${regras.length} acima do teto ${MAX_REGRAS} — não escrevi nada`);
  } else if (!existsSync(dir)) {
    console.log(`   ⛔ pasta da rota não existe: ${dir}`);
  } else if (ESCREVER) {
    writeFileSync(arq, [
      "/* viewport.css — tamanho relativo ao viewport que a captura congelou em px.",
      `   Razão MEDIDA no original nas alturas ${ALTURAS.join("/")}px, e só escrita`,
      "   quando ela é a mesma em todas. Por scripts/corrige-viewport.mjs.",
      "   🚨 Dentro da @media da largura MEDIDA (regra 3 da skill): sem o",
      "   envelope, as regras vazaram pro 375 no framer-3 e afundaram as homes",
      "   mobile ~2400px — o mobile capturado já estava certo.",
      `   Origem: ${uo} */`,
      `@media (min-width: 1024px) {`,
      ...regras,
      `}`,
    ].join("\n") + "\n");
    console.log(`   ✅ ${regras.length} regra(s) -> ${arq}`);
  } else {
    console.log(`   (ESCREVER=0) ${regras.length} regra(s) seriam escritas`);
  }
  for (const r of recusas.slice(0, 6)) console.log(`   ⚠️ ${r}`);
  if (recusas.length > 6) console.log(`   ⚠️ ... e mais ${recusas.length - 6}`);
  relatorio.push({ rota, congelados: congelados.length, regras: regras.length, recusas });
}

await nav.close();
writeFileSync(join(SAIDA, "viewport.json"), JSON.stringify({ ALTURAS, LARGURA, relatorio }, null, 2));
console.log("\n" + "=".repeat(70));
console.log(`TOTAL: ${relatorio.reduce((s, r) => s + r.regras, 0)} regra(s) · ${relatorio.reduce((s, r) => s + r.recusas.length, 0)} declarada(s)`);
console.log("🚨 rodar entrega-inline.mjs com viewport.css na lista e rebuildar.");
