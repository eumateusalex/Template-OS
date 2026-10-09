// corrige-altura-congelada.mjs — a captura congela a altura de TODO contêiner,
// e a página inteira deixa de acompanhar o conteúdo.
//
// 🚨 Irmão mais velho do `corrige-altura-main.mjs`, que trata UM elemento (o
// <main>). Esta classe é a mesma, mas em escala: o ditto escreve `h-[...px]`
// em cada contêiner que encontra, e num site sem <main> não há um culpado
// único — são dezenas, aninhados.
//
// Medido no framer-6, home:
//
//   janela          700      900
//   ORIGINAL     13484px  14284px   <- acompanha (~4,07px por px de janela)
//   CLONE        13884px  13884px   <- congelado, não acompanha nada
//
// O original tem 4 alturas de janela no fluxo. A captura rodou numa janela de
// 800px, então o clone carrega 4×800 onde o original tem 4×900: -400px, que
// empurram 190 elementos do rodapé para cima.
//
// 🚨 A ENTREGA É POR CLASSE, NUNCA POR REGRA CSS. Altura disputa com a
// utilitária do Tailwind, e nessa disputa a regra gerada NÃO entra na cascata
// — a mesma armadilha que o `corrige-altura-main.mjs` já registrava.
// Medido aqui, e vale como prova: um `altura.css` com 122 seletores e
// `height:auto !important` chegou ao CSSOM (conferido pelo próprio
// `document.styleSheets`), a `@media` casava (`matchMedia` true), e mesmo
// assim `n2` seguia computando `13883.5px` — o valor da classe
// `h-[13883.5px]`. Estilo INLINE vence (é o que a prova usa); folha, não.
//
// 🚨 E o conserto PARCIAL é pior que nenhum. Devolver altura só às seções, com
// os wrappers ainda travados em px e `overflow-clip`, faz o conteúdo crescer
// DENTRO de uma caixa que não cresce: medido aqui, um bloco que estava a -2px
// foi para -153px. Ou se destrava a cadeia inteira, ou não se destrava nada.
//
// ── As duas famílias ────────────────────────────────────────────────────────
// 1. MÚLTIPLO DA JANELA DA CAPTURA. Altura congelada que é k × JANELA (800,
//    1600, 2400...). No original isso é `k × 100vh` — herói, seção de tela
//    cheia, trilho vertical de cards. Vira `h-screen` (k=1) ou `h-[k00vh]`.
// 2. DERIVADA DO CONTEÚDO. Todo o resto que está travado e tem 2+ filhos:
//    a altura era a soma dos filhos e virou constante. Vira `h-auto`.
// ⚠️ Folha (menos de 2 filhos) que não seja múltiplo da janela NÃO se toca:
//    altura fixa em ícone, avatar e divisória é legítima.
//
// O método:
//   1. mede a altura da PÁGINA nos dois lados, em duas janelas;
//   2. confirma que o ORIGINAL acompanha a janela e que o CLONE está travado;
//   3. classifica os candidatos nas duas famílias;
//   4. 🚨 PROVA no navegador, por estilo INLINE, que a correção devolve a
//      altura do original NAS DUAS JANELAS, dentro de TOL;
//   5. só então reescreve as classes no page.tsx.
//
// O que o faz SE CALAR (declara e não escreve):
//   - o original também está travado           -> não é este o defeito
//   - o clone já acompanha a janela            -> nada a fazer
//   - nenhum candidato                         -> nada a fazer
//   - a prova não devolve a altura do original -> declara o resíduo em px
//   - cid sem className no JSX                 -> declara esse, segue
//
// ⚠️ Só o token SEM prefixo de breakpoint é trocado. `max-md:h-[...]`,
// `md:max-lg:h-[...]` e `2xl:h-[...]` ficam como estão: o layout de celular
// capturado costuma estar certo, e mexer nele afundou as homes do framer-3 em
// ~2400px (armadilhas.md).
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 APP=<app> ROTA=/ \
//   SAIDA=<med>/altura node corrige-altura-congelada.mjs
//
// Variáveis:
//   ORIGINAL, CLONE, APP  (obrigatórias)
//   ROTA      rota única (padrão /) · ROTAS=rotas.json ou lista
//   LARGURA   largura fixa do teste (padrão 1280)
//   ALTURAS   as duas janelas de prova (padrão 700,900)
//   JANELA_CAPTURA  altura da janela em que o ditto capturou (padrão: a mais
//             frequente entre as alturas congeladas)
//   TOL       px de folga entre clone-corrigido e original (padrão 16)
//   ESCREVER  0 simula
//   DITTO     raiz do ditto (padrão C:/dev/ditto)

import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const ORIGINAL = process.env.ORIGINAL;
const CLONE = process.env.CLONE;
const APP = process.env.APP;
if (!ORIGINAL || !CLONE || !APP) {
  console.error("faltam ORIGINAL, CLONE e/ou APP");
  process.exit(1);
}
const LARGURA = Number(process.env.LARGURA ?? 1280);
const ALTURAS = (process.env.ALTURAS ?? "700,900").split(",").map((s) => Number(s.trim())).filter(Boolean);
const TOL = Number(process.env.TOL ?? 16);
// 🚨 cids que OUTRO instrumento já corrigiu, e que este não pode reescrever.
// Medido no framer-6, /about: o `corrige-viewport --linear` prova que o `n4`
// mede `10162px + 100vh` e a correção entra por classe. Sem a lista, este
// instrumento o vê como "contêiner com altura arbitrária", põe `auto` por
// cima e desfaz o conserto: a prova bate na janela de 900 (onde `auto` acerta
// por acaso) e erra 99px na de 700. O guard reprova — certo — e a saída é
// declarar o cid como já tratado, não afrouxar o guard.
const IGNORAR = new Set((process.env.IGNORAR ?? "").split(",").map((s) => s.trim()).filter(Boolean));
const ESCREVER = process.env.ESCREVER !== "0";
const SAIDA = resolve(process.env.SAIDA ?? "./altura");
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
mkdirSync(SAIDA, { recursive: true });

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

function carregarRotas() {
  const r = process.env.ROTAS;
  if (r) {
    // ⚠️ ARQUIVO, não só "existe": "/" é caminho que existe (raiz do disco).
    if (existsSync(r) && statSync(r).isFile()) {
      const j = JSON.parse(readFileSync(r, "utf8").replace(/^\uFEFF/, ""));
      return j.rotas.filter((x) => x.status === 200 || x.status === null).map((x) => x.rota);
    }
    return r.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [process.env.ROTA ?? "/"];
}

const ASSENTAR = async () => {
  const passo = Math.max(200, innerHeight * 0.8);
  for (let y = 0; y < document.body.scrollHeight + innerHeight; y += passo) {
    scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 70));
  }
  scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 500));
};

// Candidatos: elemento com altura arbitrária declarada por classe SEM prefixo.
const CANDIDATOS = () =>
  [...document.querySelectorAll("[data-cid]")]
    .map((el) => {
      const cls = el.getAttribute("class") || "";
      const m = cls.match(/(?:^|\s)h-\[([^\]]+)\]/);
      if (!m) return null;
      const r = el.getBoundingClientRect();
      return {
        cid: el.getAttribute("data-cid"),
        valorClasse: m[1],
        altura: Math.round(r.height * 10) / 10,
        filhos: el.children.length,
      };
    })
    .filter(Boolean);

// A prova: aplica por estilo INLINE (que vence utilitária) e devolve a altura.
const APLICAR = (plano) => {
  let n = 0;
  for (const p of plano) {
    const el = document.querySelector(`[data-cid="${p.cid}"]`);
    if (!el) continue;
    el.style.setProperty("height", p.valor, "important");
    n++;
  }
  return n;
};

const rotas = carregarRotas();
const nav = await chromium.launch();
const relatorio = [];

for (const rota of rotas) {
  const linha = { rota, escreveu: false };
  const alturas = { original: {}, clone: {}, cloneCorrigido: {} };
  let plano = null;
  let janelaCaptura = null;

  for (const altura of ALTURAS) {
    const ctx = await nav.newContext({ viewport: { width: LARGURA, height: altura } });
    const page = await ctx.newPage();

    await page.goto(new URL(rota, ORIGINAL).href, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(2000);
    await page.evaluate(ASSENTAR);
    alturas.original[altura] = await page.evaluate(() => document.documentElement.scrollHeight);

    await page.goto(new URL(rota, CLONE).href + `?_v=${Date.now()}`, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(1600);
    await page.evaluate(ASSENTAR);
    alturas.clone[altura] = await page.evaluate(() => document.documentElement.scrollHeight);

    if (!plano) {
      const cands = await page.evaluate(CANDIDATOS);
      // a janela da captura: a altura congelada mais frequente entre os
      // candidatos que parecem "uma tela inteira" (o ditto escreve o mesmo
      // número em vários elementos da mesma seção)
      if (process.env.JANELA_CAPTURA) janelaCaptura = Number(process.env.JANELA_CAPTURA);
      else {
        const cont = new Map();
        for (const c of cands) {
          if (c.altura < 400 || c.altura > 1400) continue;
          const k = Math.round(c.altura);
          cont.set(k, (cont.get(k) ?? 0) + 1);
        }
        janelaCaptura = [...cont.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      }
      plano = [];
      for (const c of cands) {
        if (IGNORAR.has(c.cid)) continue; // já corrigido por outro instrumento
        if (janelaCaptura) {
          const k = c.altura / janelaCaptura;
          // múltiplo inteiro da janela da captura -> era k × 100vh
          if (Math.abs(k - Math.round(k)) < 0.005 && Math.round(k) >= 1 && Math.round(k) <= 8) {
            const kk = Math.round(k);
            plano.push({ cid: c.cid, familia: "janela", k: kk, valor: `${kk * 100}vh`, classe: kk === 1 ? "h-screen" : `h-[${kk * 100}vh]`, de: c.valorClasse });
            continue;
          }
        }
        // ⚠️ folha com altura fixa que não é múltiplo da janela é legítima
        if (c.filhos < 2) continue;
        plano.push({ cid: c.cid, familia: "derivada", valor: "auto", classe: "h-auto", de: c.valorClasse });
      }
    }

    await page.evaluate(APLICAR, plano);
    alturas.cloneCorrigido[altura] = await page.evaluate(() => document.documentElement.scrollHeight);
    await ctx.close();
  }

  const [a1, a2] = ALTURAS;
  const origAcompanha = Math.abs(alturas.original[a2] - alturas.original[a1]) > 50;
  const cloneTravado = Math.abs(alturas.clone[a2] - alturas.clone[a1]) < 5;
  const provaOk = ALTURAS.every((h) => Math.abs(alturas.cloneCorrigido[h] - alturas.original[h]) <= TOL);

  Object.assign(linha, { alturas, janelaCaptura, plano: plano ?? [], origAcompanha, cloneTravado, provaOk });

  const porFamilia = (f) => (plano ?? []).filter((p) => p.familia === f).length;
  console.log(`\n=== ${rota}`);
  for (const h of ALTURAS) {
    console.log(`   janela ${h}: original ${alturas.original[h]} · clone ${alturas.clone[h]} · clone corrigido ${alturas.cloneCorrigido[h]}  (resíduo ${alturas.cloneCorrigido[h] - alturas.original[h]}px)`);
  }
  console.log(`   janela da captura: ${janelaCaptura}px · candidatos: ${(plano ?? []).length} (${porFamilia("janela")} múltiplos da janela, ${porFamilia("derivada")} derivados do conteúdo)`);

  if (!origAcompanha) { console.log(`   ⚠️ o ORIGINAL também não acompanha a janela — não é este o defeito. DECLARADO.`); relatorio.push(linha); continue; }
  if (!cloneTravado) { console.log(`   ✅ o clone já acompanha a janela — nada a fazer.`); relatorio.push(linha); continue; }
  if (!plano.length) { console.log(`   ⚠️ nenhum candidato. DECLARADO.`); relatorio.push(linha); continue; }
  if (!provaOk) {
    console.log(`   ⚠️ a prova NÃO devolve a altura do original (folga de ${TOL}px). DECLARADO, nada escrito.`);
    relatorio.push(linha);
    continue;
  }
  if (!ESCREVER) { console.log(`   (ESCREVER=0) ${plano.length} classe(s) seriam reescritas`); relatorio.push(linha); continue; }

  // ── escrever: trocar o token de altura NA CLASSE, dentro da tag do cid ────
  const pasta = rota === "/" ? join(APP, "src", "app") : join(APP, "src", "app", ...rota.split("/").filter(Boolean));
  const pageTsx = join(pasta, "page.tsx");
  if (!existsSync(pageTsx)) { console.log(`   ⚠️ page.tsx não achada em ${pasta} — DECLARADO`); relatorio.push(linha); continue; }
  let jsx = readFileSync(pageTsx, "utf8");
  let trocados = 0;
  const declarados = [];
  for (const p of plano) {
    const marca = `data-cid="${p.cid}"`;
    const pos = jsx.indexOf(marca);
    if (pos < 0) { declarados.push(`${p.cid}: não achado no JSX`); continue; }
    // limites da TAG que contém o cid
    const ini = jsx.lastIndexOf("<", pos);
    const fim = jsx.indexOf(">", pos);
    if (ini < 0 || fim < 0) { declarados.push(`${p.cid}: tag não delimitada`); continue; }
    const tag = jsx.slice(ini, fim);
    const mCls = tag.match(/className="([^"]*)"/);
    if (!mCls) { declarados.push(`${p.cid}: sem className`); continue; }
    // 🚨 só o token SEM prefixo de breakpoint
    const novo = mCls[1].replace(/(^|\s)h-\[[^\]]+\]/, `$1${p.classe}`);
    if (novo === mCls[1]) { declarados.push(`${p.cid}: nenhum token h-[...] sem prefixo`); continue; }
    const tagNova = tag.replace(mCls[0], `className="${novo}"`);
    jsx = jsx.slice(0, ini) + tagNova + jsx.slice(fim);
    trocados++;
  }
  writeFileSync(pageTsx, jsx, "utf8");
  linha.escreveu = true;
  linha.trocados = trocados;
  linha.declarados = declarados;
  console.log(`   ✅ ${trocados} classe(s) reescritas em ${pageTsx}`);
  if (declarados.length) {
    console.log(`   ⚠️ ${declarados.length} declarado(s):`);
    for (const d of declarados.slice(0, 8)) console.log(`      ${d}`);
  }
  relatorio.push(linha);
}

await nav.close();
writeFileSync(join(SAIDA, "altura.json"), JSON.stringify({ gerado: new Date().toISOString(), largura: LARGURA, alturas: ALTURAS, tol: TOL, relatorio }, null, 2), "utf8");
const escritas = relatorio.filter((r) => r.escreveu).length;
console.log(`\n${"=".repeat(70)}`);
console.log(`rotas tratadas: ${escritas} · declaradas: ${relatorio.length - escritas}`);
console.log(`saída: ${join(SAIDA, "altura.json")}`);
console.log(`🚨 rebuildar depois.`);
process.exit(escritas ? 0 : 2);
