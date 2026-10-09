// corrige-largura-elemento.mjs — devolve a LARGURA de elemento que a captura
// perdeu, entregando como CLASSE do Tailwind.
//
// 🚨 Irmão do corrige-largura-secao, para quando o culpado não é um <section>.
// Medido no framer-4, nas 10 páginas de artigo: o aparte lateral
// ("Overview:") mede 32% do contêiner no original e nasce `w-full` no clone.
// Com ele ocupando a linha inteira, o corpo do artigo é empurrado para
// x=1365 numa janela de 1280 — ou seja, PARA FORA DA TELA. O texto está lá,
// no tamanho certo, e ninguém consegue ler.
//
// Por que a largura se mede contra o PAI, e não contra a janela: medido no
// original, o aparte dá 389.1 / 440.3 / 593.9 px nas janelas 1280/1440/1920.
// Contra a janela isso é 30.40% / 30.58% / 30.93% — três números diferentes,
// que reprovariam a regra. Contra a caixa de conteúdo do pai (que desconta o
// padding) é 32.00% nas três. A razão certa é a razão com o pai.
//
// A entrega é por CLASSE porque largura disputa com utilitária do Tailwind
// (`w-full`), e nessa disputa a regra CSS gerada não entra na cascata deste
// build (ver armadilhas.md, "Regra que DISPUTA com utilitária do Tailwind").
//
// O método, por rota:
//   1. casa os elementos com texto do ORIGINAL e do CLONE pelo texto (mesma
//      regra do compara-geometria: contagem igual dos dois lados casa por
//      ordem de DOM);
//   2. separa os que divergem de largura acima de TOL;
//   3. no ORIGINAL, mede a razão largura/caixa-de-conteúdo-do-pai em três
//      larguras de janela — só segue quem tem razão CONSTANTE;
//   4. PROVA no navegador que `width:<razão>%` devolve a largura do original;
//   5. escreve a classe `lg:w-[N%]` no elemento, no page.tsx.
//
// O que o faz SE CALAR:
//   - razão não constante nas três janelas   -> declara, não escreve
//   - a prova não devolve a largura medida   -> declara, não escreve
//   - elemento sem data-cid ou sem className -> declara, não escreve
//   - texto ambíguo (contagem diferente)     -> declara, não escreve
//
// Uso:
//   ORIGINAL=... CLONE=... APP=<app> ROTAS=<med>/rotas.json \
//   node corrige-largura-elemento.mjs      (ESCREVER=0 simula)

import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ORIGINAL = process.env.ORIGINAL;
const CLONE = process.env.CLONE;
const APP = process.env.APP;
if (!ORIGINAL || !CLONE || !APP) {
  console.error("faltam ORIGINAL, CLONE e/ou APP");
  process.exit(1);
}
const TOL = Number(process.env.TOL ?? 4);
const TOL_RAZAO = Number(process.env.TOL_RAZAO ?? 0.004); // 0,4 ponto percentual
const ESCREVER = process.env.ESCREVER !== "0";
const LARGURAS = (process.env.LARGURAS ?? "1280,1440,1920").split(",").map(Number);
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

function rotasAlvo() {
  if (process.env.ROTAS) {
    const j = JSON.parse(readFileSync(process.env.ROTAS, "utf8"));
    const lista = Array.isArray(j) ? j : (j.rotas ?? []);
    return lista
      .map((r) => (typeof r === "string" ? r : (r.rota ?? r.caminho)))
      .filter((r) => typeof r === "string" && r !== "/404");
  }
  return [process.env.ROTA ?? "/"];
}

function pastaDaRota(rota) {
  if (rota !== "/") return join(APP, "src/app", rota.replace(/^\//, ""));
  const grupo = join(APP, "src/app", "(inicio)");
  return existsSync(join(grupo, "page.tsx")) ? grupo : join(APP, "src/app");
}

const percorrer = async (p) => {
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 55));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 250));
  });
};

/** Colhe elementos com texto próprio, com caixa viva. */
const colher = () => {
  const out = [];
  for (const el of document.querySelectorAll("div,section,aside,article,nav,ul")) {
    const r = el.getBoundingClientRect();
    if (r.width < 20 || r.height < 10) continue;
    const txt = (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 44);
    if (!txt) continue;
    out.push({
      txt,
      w: Math.round(r.width * 10) / 10,
      x: Math.round(r.left * 10) / 10,
      cid: el.getAttribute("data-cid"),
    });
  }
  return out;
};

const navegador = await chromium.launch();
let total = 0;
const declaradas = [];

for (const rota of rotasAlvo()) {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  await page.goto(new URL(rota, ORIGINAL).href, { waitUntil: "networkidle", timeout: 60000 });
  await percorrer(page);
  const orig = await page.evaluate(colher);

  await page.goto(new URL(rota, CLONE).href + "?_v=" + Date.now(), { waitUntil: "networkidle", timeout: 60000 });
  await percorrer(page);
  const clone = await page.evaluate(colher);

  // casar por texto; só quando a contagem bate dos dois lados (mesma regra do juiz)
  const porTexto = (lista) => {
    const m = new Map();
    for (const e of lista) {
      if (!m.has(e.txt)) m.set(e.txt, []);
      m.get(e.txt).push(e);
    }
    return m;
  };
  const mo = porTexto(orig);
  const mc = porTexto(clone);

  const candidatos = [];
  for (const [txt, listaO] of mo) {
    const listaC = mc.get(txt);
    if (!listaC || listaC.length !== listaO.length) continue;
    for (let i = 0; i < listaO.length; i++) {
      const o = listaO[i];
      const c = listaC[i];
      if (!c.cid) continue;
      if (Math.abs(o.w - c.w) <= TOL) continue;
      // 🚨 o ÍNDICE dentro do grupo de mesmo texto viaja junto: `textContent`
      // sobe para os ancestrais, então vários elementos compartilham o mesmo
      // prefixo. Pegar "o primeiro com esse texto" pega o ancestral, e a razão
      // sai ~100%, reprovando todos os candidatos bons por medir o pai em vez
      // do elemento.
      candidatos.push({ txt, idx: i, cid: c.cid, wOrig: o.w, wClone: c.w });
    }
  }
  await ctx.close();

  if (!candidatos.length) {
    console.log(`✅ ${rota}: nenhuma largura divergente`);
    continue;
  }

  // razão contra a caixa de conteúdo do PAI, em três janelas
  const razoes = {};
  for (const larg of LARGURAS) {
    const c2 = await navegador.newContext({ viewport: { width: larg, height: 900 } });
    const p2 = await c2.newPage();
    await p2.goto(new URL(rota, ORIGINAL).href, { waitUntil: "networkidle", timeout: 60000 });
    await percorrer(p2);
    const medidas = await p2.evaluate((alvos) => {
      const out = {};
      for (const { txt, idx, chave } of alvos) {
        const iguais = [];
        for (const el of document.querySelectorAll("div,section,aside,article,nav,ul")) {
          const r = el.getBoundingClientRect();
          if (r.width < 20 || r.height < 10) continue;
          const t = (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 44);
          if (t === txt) iguais.push(el);
        }
        const alvo = iguais[idx];
        if (!alvo || !alvo.parentElement) continue;
        const pai = alvo.parentElement;
        const cs = getComputedStyle(pai);
        const larguraPai =
          pai.getBoundingClientRect().width - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
        out[chave] = alvo.getBoundingClientRect().width / larguraPai;
      }
      return out;
    }, candidatos.map((c) => ({ txt: c.txt, idx: c.idx, chave: c.cid })));
    razoes[larg] = medidas;
    await c2.close();
  }

  const aprovados = [];
  for (const cand of candidatos) {
    const vals = LARGURAS.map((l) => razoes[l][cand.cid]).filter((v) => typeof v === "number");
    if (vals.length !== LARGURAS.length) {
      declaradas.push({ rota, motivo: `${cand.cid}: não medi a razão em todas as janelas` });
      continue;
    }
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    if (max - min > TOL_RAZAO) {
      declaradas.push({
        rota,
        motivo: `${cand.cid}: razão não constante (${vals.map((v) => (v * 100).toFixed(2) + "%").join(" / ")}) — não escrito`,
      });
      continue;
    }
    const pct = Math.round(((min + max) / 2) * 10000) / 100;
    aprovados.push({ ...cand, pct });
  }

  if (!aprovados.length) continue;

  // PROVA no clone
  const c3 = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
  const p3 = await c3.newPage();
  await p3.goto(new URL(rota, CLONE).href + "?_v=" + Date.now(), { waitUntil: "networkidle", timeout: 60000 });
  await percorrer(p3);
  // 🚨 A prova vai por ESTILO INLINE, não por <style>. Largura disputa com a
  // utilitária `w-full` do Tailwind, e nessa disputa a regra injetada não
  // entra na cascata deste build: a prova por <style> reprova todos os
  // candidatos, devolvendo a largura errada (1216 onde o original tem 389).
  // O estilo inline vence sempre, então mede o que se
  // quer medir: se a razão está certa. A ENTREGA continua sendo por classe.
  const prova = await p3.evaluate((lista) => {
    const out = {};
    for (const a of lista) {
      const el = document.querySelector(`[data-cid="${a.cid}"]`);
      if (!el) {
        out[a.cid] = null;
        continue;
      }
      // ⚠️ com `important`: medido neste build, estilo inline SEM important
      // não vence a utilitária `w-full` do Tailwind — a prova dava 1216 (o
      // valor errado) e reprovava candidato bom.
      const antes = el.style.width;
      el.style.setProperty("width", `${a.pct}%`, "important");
      void document.body.offsetHeight;
      out[a.cid] = Math.round(el.getBoundingClientRect().width * 10) / 10;
      el.style.width = antes;
    }
    return out;
  }, aprovados);
  await c3.close();

  const finais = [];
  for (const a of aprovados) {
    if (prova[a.cid] !== null && Math.abs(prova[a.cid] - a.wOrig) <= TOL) finais.push({ ...a, wProva: prova[a.cid] });
    else declaradas.push({ rota, motivo: `${a.cid}: prova deu ${prova[a.cid]}, original tem ${a.wOrig} — não escrito` });
  }
  if (!finais.length) continue;

  const pagePath = join(pastaDaRota(rota), "page.tsx");
  if (!existsSync(pagePath)) {
    declaradas.push({ rota, motivo: "page.tsx não achado" });
    continue;
  }
  let jsx = readFileSync(pagePath, "utf8");
  console.log(`\n=== ${rota}`);
  let escritas = 0;
  for (const f of finais) {
    const classeNova = `lg:w-[${f.pct}%]`;
    if (jsx.includes(classeNova)) continue;
    const alvo = new RegExp(`className="([^"]*)"([^>]*?)data-cid="${f.cid}"`);
    const m = jsx.match(alvo);
    if (!m) {
      declaradas.push({ rota, motivo: `${f.cid}: className+data-cid não achado no page.tsx` });
      continue;
    }
    jsx = jsx.replace(m[0], m[0].replace(`className="${m[1]}"`, `className="${classeNova} ${m[1]}"`));
    console.log(`   ✅ ${f.cid}  ${f.wClone} → ${f.wProva} (original ${f.wOrig})  ${classeNova}  ${JSON.stringify(f.txt.slice(0, 26))}`);
    escritas++;
  }
  if (escritas && ESCREVER) writeFileSync(pagePath, jsx, "utf8");
  total += escritas;
}

await navegador.close();
console.log(`\n${"=".repeat(70)}`);
console.log(`TOTAL: ${total} largura(s) devolvida(s) como classe${ESCREVER ? "" : " (simulado)"}`);
if (declaradas.length) {
  console.log(`\n⚠️ ${declaradas.length} declaração(ões):`);
  for (const d of declaradas.slice(0, 25)) console.log(`   ${d.rota}: ${d.motivo}`);
  if (declaradas.length > 25) console.log(`   ... e mais ${declaradas.length - 25}`);
}
console.log("🚨 rebuildar.");
