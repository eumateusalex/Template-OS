// corrige-altura-main.mjs — o ditto congela a altura do <main> em px, e ela
// deixa de acompanhar o conteúdo.
//
// 🚨 Classe medida no framer-4, e ela só APARECE depois que os outros
// consertos entram. O ditto escreve `h-[8311.7px]` no <main> — o número exato
// do conteúdo no instante da captura. Enquanto o clone está errado do mesmo
// jeito (seções com vh congelado), o número fecha e nada denuncia. Ao
// devolver 96vh à seção, o conteúdo mede 8407.6px dentro de um <main> travado
// em 8311.7px: o rodapé, que é irmão do <main>, sobe 96px e leva junto TODO o
// resto da página.
//
// O sintoma que denuncia: Δaltura da página igual ao Δ de um degrau único, com
// TODAS as seções medindo igual nos dois lados. Se cada seção bate e a página
// não bate, quem não bate é o contêiner delas.
//
// O método, por rota:
//   1. mede a altura do <main> e a do CONTEÚDO dele nos dois lados;
//   2. confirma que no ORIGINAL o <main> acompanha o conteúdo (é auto) e que
//      no CLONE ele está travado num valor diferente;
//   3. PROVA no navegador que `height:auto` devolve a altura do original;
//   4. só então troca a classe `h-[...]` do <main> por `h-auto` no page.tsx.
//
// A entrega é por CLASSE, não por regra CSS: altura disputa com utilitária do
// Tailwind, e nessa disputa a regra gerada não entra na cascata (ver
// armadilhas.md, "Regra que DISPUTA com utilitária do Tailwind").
//
// O que o faz SE CALAR:
//   - <main> sem classe de altura fixa            -> nada a fazer
//   - no ORIGINAL o <main> também é fixo          -> declara, não escreve
//   - `height:auto` não devolve a altura medida   -> declara, não escreve
//   - <main> não achado no page.tsx               -> declara, não escreve
//
// Uso:
//   ORIGINAL=... CLONE=... APP=<app> ROTAS=<med>/rotas.json \
//   node corrige-altura-main.mjs        (ESCREVER=0 simula)

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
const ESCREVER = process.env.ESCREVER !== "0";
const TOL = Number(process.env.TOL ?? 2);
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

/** 🚨 Os contêineres travados vêm em CADEIA: o <main> e cada ancestral dele
 *  até o <body>. No /studio do framer-4 são dois — o <main> com
 *  `h-[509.175rem]` e o embrulho da página com `h-[9882.5px]`. Consertar só o
 *  <main> não move nada, porque o de fora continua cortando.
 *
 *  E a unidade varia: px num, rem no outro. Reconhecer só px passa direto
 *  pelo /studio dizendo "nada a fazer". */
const medirCadeia = () => {
  const m = document.querySelector("main");
  if (!m) return null;
  const cadeia = [];
  let el = m;
  for (let i = 0; i < 5 && el && el.tagName !== "BODY" && el.tagName !== "HTML"; i++) {
    const r = el.getBoundingClientRect();
    cadeia.push({
      nivel: i,
      tag: el.tagName,
      altura: Math.round(r.height * 10) / 10,
      classe: (el.className || "").toString(),
      cid: el.getAttribute("data-cid"),
    });
    el = el.parentElement;
  }
  return cadeia;
};

const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

let total = 0;
const declaradas = [];

for (const rota of rotasAlvo()) {
  await page.goto(new URL(rota, ORIGINAL).href, { waitUntil: "networkidle", timeout: 60000 });
  await percorrer(page);
  const o = await page.evaluate(medirCadeia);

  await page.goto(new URL(rota, CLONE).href + "?_v=" + Date.now(), { waitUntil: "networkidle", timeout: 60000 });
  await percorrer(page);
  const c = await page.evaluate(medirCadeia);

  if (!o || !c) {
    declaradas.push({ rota, motivo: "<main> não achado em algum dos lados" });
    continue;
  }

  const TRAVADA = /\bh-\[[\d.]+(px|rem)\]/;
  const travados = c
    .filter((x) => TRAVADA.test(x.classe))
    .filter((x) => {
      const par = o.find((y) => y.nivel === x.nivel);
      return par && Math.abs(par.altura - x.altura) > TOL;
    });
  if (!travados.length) continue;

  // 🚨 O CONTROLE é a PROVA, não uma heurística de "conteúdo".
  // Exigir que no original o <main> meça o mesmo que a soma dos filhos
  // reprova /expertise por engano: o construtor envelopa as seções, e o
  // último filho não termina onde a página termina.
  // Medir o filho mais baixo é frágil; o que decide é se `height:auto`
  // reproduz EXATAMENTE a altura medida no original.
  //
  // E a prova é CONJUNTA: solta-se a cadeia inteira de uma vez. Testar um
  // nível por vez mede errado, porque o ancestral ainda travado corta o
  // resultado do filho que se acabou de soltar.
  const prova = await page.evaluate((niveis) => {
    const m = document.querySelector("main");
    const els = [];
    let el = m;
    for (let i = 0; i < 5 && el && el.tagName !== "BODY"; i++) {
      els.push(el);
      el = el.parentElement;
    }
    const antes = els.map((e) => e.style.height);
    for (const n of niveis) if (els[n]) els[n].style.height = "auto";
    void document.body.offsetHeight;
    const out = {};
    for (const n of niveis) if (els[n]) out[n] = Math.round(els[n].getBoundingClientRect().height * 10) / 10;
    els.forEach((e, i) => (e.style.height = antes[i]));
    return out;
  }, travados.map((t) => t.nivel));

  const aprovados = [];
  for (const t of travados) {
    const par = o.find((y) => y.nivel === t.nivel);
    if (Math.abs(prova[t.nivel] - par.altura) > TOL) {
      declaradas.push({
        rota,
        motivo: `nível ${t.nivel} (${t.tag}): height:auto deu ${prova[t.nivel]}, original tem ${par.altura} — NÃO escrito`,
      });
      continue;
    }
    aprovados.push({ ...t, alvo: par.altura, depois: prova[t.nivel] });
  }
  if (!aprovados.length) continue;

  const pagePath = join(pastaDaRota(rota), "page.tsx");
  if (!existsSync(pagePath)) {
    declaradas.push({ rota, motivo: "page.tsx não achado" });
    continue;
  }
  let jsx = readFileSync(pagePath, "utf8");
  let escritas = 0;
  for (const a of aprovados) {
    const classeAntiga = a.classe.match(TRAVADA)[0];
    const escapada = classeAntiga.replace(/[[\]().]/g, "\\$&");
    // casa pelo data-cid quando existe (o <main> do ditto sempre tem)
    const alvo = a.cid
      ? new RegExp(`(className=")([^"]*)${escapada}([^"]*"[^>]*data-cid="${a.cid}")`)
      : new RegExp(`(<${a.tag.toLowerCase()}[^>]*className=")([^"]*)${escapada}`);
    if (!alvo.test(jsx)) {
      declaradas.push({ rota, motivo: `não achei "${classeAntiga}" em ${a.tag} cid=${a.cid}` });
      continue;
    }
    jsx = jsx.replace(alvo, a.cid ? `$1$2h-auto$3` : `$1$2h-auto`);
    console.log(`✅ ${rota}: ${a.tag} cid=${a.cid} ${a.altura} → ${a.depois} (original ${a.alvo})  ${classeAntiga} → h-auto`);
    escritas++;
  }
  if (escritas && ESCREVER) writeFileSync(pagePath, jsx, "utf8");
  total += escritas;
}

await navegador.close();
console.log(`\n${"=".repeat(70)}`);
console.log(`TOTAL: ${total} <main> destravado${ESCREVER ? "" : " (simulado)"}`);
if (declaradas.length) {
  console.log(`\n⚠️ ${declaradas.length} declaração(ões):`);
  for (const d of declaradas) console.log(`   ${d.rota}: ${d.motivo}`);
}
console.log("🚨 rebuildar.");
