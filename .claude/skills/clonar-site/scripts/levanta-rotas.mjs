// levanta-rotas.mjs — a lista-mestra de rotas do site original.
//
// Cruza DUAS fontes independentes (sitemap.xml e varredura de links no
// navegador) e grava a procedência de cada rota. Rota achada por uma fonte só
// é rota que merece segunda olhada, não rota descartável.
//
// A lista que sai daqui é o CONTRATO do clone: o clone só está completo
// quando cada linha dela responde.
//
// Uso:
//   SITE=https://exemplo.com/ SAIDA=./rotas.json node levanta-rotas.mjs
//
// Variáveis:
//   SITE    URL base do original (obrigatória)
//   SAIDA   arquivo JSON de saída (padrão: ./rotas.json)
//   DITTO   raiz da instalação do ditto (padrão: C:/dev/ditto) — de onde vem o Playwright
//   PROF    profundidade máxima da varredura (padrão: 3)
//   EXCLUIR regex de rotas FORA do escopo (ex.: '^/(help|apps|changelog)/.').
//           O corte sai DECLARADO na saída — escopo é decisão, não omissão.
//   ESPERA  estratégia do goto (padrão: networkidle). Em site que mantém
//           conexão viva (analytics, stream), networkidle nunca dispara e o
//           status vira ERRO falso — usar ESPERA=load nesses.

import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SITE = process.env.SITE;
if (!SITE) {
  console.error("falta SITE=<url base>");
  process.exit(1);
}
const SAIDA = resolve(process.env.SAIDA ?? "./rotas.json");
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
const PROF = Number(process.env.PROF ?? 3);
const EXCLUIR = process.env.EXCLUIR ? new RegExp(process.env.EXCLUIR) : null;
const ESPERA = process.env.ESPERA ?? "networkidle";

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

const base = new URL(SITE);
const ORIGEM = base.origin;

/** Normaliza para caminho comparável: sem barra final (exceto raiz), sem query, sem hash. */
function paraRota(href, contexto) {
  let u;
  try {
    // ⚠️ Resolver contra o contexto. Filtrar href por startsWith('/') perde
    // link relativo ('./projects/x'), e é uma falha CALADA: acha menos e
    // reporta sucesso.
    u = new URL(href, contexto);
  } catch {
    return null;
  }
  if (u.origin !== ORIGEM) return null; // ⚠️ filtrar por ORIGEM, não por pathname
  let p = u.pathname;
  if (p.length > 1) p = p.replace(/\/+$/, "");
  p = p || "/";
  if (EXCLUIR && EXCLUIR.test(p)) return null;
  return p;
}

async function lerSitemap() {
  const achadas = new Set();
  const naFila = [new URL("/sitemap.xml", ORIGEM).href];
  const vistos = new Set();
  let houveResposta = false;

  while (naFila.length) {
    const url = naFila.shift();
    if (vistos.has(url)) continue;
    vistos.add(url);
    let xml;
    try {
      const r = await fetch(url, { redirect: "follow" });
      if (!r.ok) continue;
      xml = await r.text();
      houveResposta = true;
    } catch {
      continue;
    }
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
    const ehIndice = /<sitemapindex/i.test(xml);
    for (const loc of locs) {
      if (ehIndice) naFila.push(loc);
      else {
        const rota = paraRota(loc, ORIGEM);
        if (rota) achadas.add(rota);
      }
    }
  }
  return { achadas, houveResposta };
}

/** Rola a página inteira. Índice de coleção só renderiza o que entra em tela:
 *  colher sem rolar entrega parte da lista e chama isso de lista completa. */
async function rolarTudo(page) {
  await page.evaluate(async () => {
    const passo = Math.max(200, window.innerHeight * 0.8);
    let y = 0;
    for (let i = 0; i < 200; i++) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
      y += passo;
      if (y > document.body.scrollHeight + window.innerHeight) break;
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 200));
  });
}

async function varrerLinks(semeadas = []) {
  const navegador = await chromium.launch();
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();

  const achadas = new Map(); // rota -> { profundidade, rotulos:Set }
  const fila = [{ rota: paraRota(base.href, ORIGEM) ?? "/", prof: 0 }];
  // ⚠️ Semear com as rotas do sitemap. Rota que existe mas ninguém linka
  // (página de erro, template solto, landing de campanha) nunca entraria pela
  // varredura, e sairia da lista-mestra SEM STATUS — célula vazia bem no lugar
  // mais fácil de esquecer.
  for (const rota of semeadas) fila.push({ rota, prof: 1 });
  const vistos = new Set();
  const falhas = [];

  while (fila.length) {
    const { rota, prof } = fila.shift();
    if (vistos.has(rota)) continue;
    vistos.add(rota);

    const url = new URL(rota, ORIGEM).href;
    let status = null;
    try {
      const resp = await page.goto(url, { waitUntil: ESPERA, timeout: 45000 });
      status = resp?.status() ?? null;
      if (ESPERA !== "networkidle") await page.waitForTimeout(800); // assentar sem depender de rede morta
    } catch (e) {
      falhas.push({ rota, erro: String(e.message ?? e).slice(0, 200) });
      console.log(`  ERRO  ${rota}  (restam ${fila.length} na fila)`);
      continue;
    }
    // ⚠️ Imprimir a cada rota, sempre. Sem isto, varredura travada fica
    // indistinguível de varredura lenta — e a espera vira adivinhação.
    console.log(`  ${String(status ?? "?").padEnd(4)} ${rota}  (restam ${fila.length} na fila)`);
    if (!achadas.has(rota)) achadas.set(rota, { profundidade: prof, rotulos: new Set(), status });
    else achadas.get(rota).status = status;

    if (prof >= PROF) continue;
    await rolarTudo(page);

    const links = await page.$$eval("a[href]", (as) =>
      as.map((a) => ({
        // href resolvido pelo próprio navegador — não o atributo cru
        href: a.href,
        // rótulo INTEIRO. Cortar com slice() quebra o casamento em outro script.
        rotulo: (a.textContent ?? "").trim().replace(/\s+/g, " "),
      })),
    );
    for (const { href, rotulo } of links) {
      const alvo = paraRota(href, url);
      if (!alvo) continue;
      if (!achadas.has(alvo)) achadas.set(alvo, { profundidade: prof + 1, rotulos: new Set(), status: null });
      if (rotulo) achadas.get(alvo).rotulos.add(rotulo);
      if (!vistos.has(alvo)) fila.push({ rota: alvo, prof: prof + 1 });
    }
  }

  await navegador.close();
  return { achadas, falhas };
}

const sitemap = await lerSitemap();
const varredura = await varrerLinks([...sitemap.achadas]);

const todas = new Set([...sitemap.achadas, ...varredura.achadas.keys()]);
const rotas = [...todas].sort().map((rota) => {
  const noSitemap = sitemap.achadas.has(rota);
  const noLink = varredura.achadas.has(rota);
  const extra = varredura.achadas.get(rota);
  return {
    rota,
    procedencia: noSitemap && noLink ? "ambas" : noSitemap ? "so-sitemap" : "so-link",
    status: extra?.status ?? null,
    profundidade: extra?.profundidade ?? null,
    rotulos: extra ? [...extra.rotulos].slice(0, 5) : [],
  };
});

const soUmaFonte = rotas.filter((r) => r.procedencia !== "ambas");
const saida = {
  site: SITE,
  origem: ORIGEM,
  geradoPor: "levanta-rotas.mjs",
  escopo: { excluir: process.env.EXCLUIR ?? null, espera: ESPERA },
  fontes: {
    sitemap: { respondeu: sitemap.houveResposta, rotas: sitemap.achadas.size },
    varredura: { rotas: varredura.achadas.size, profundidadeMax: PROF, falhas: varredura.falhas },
  },
  total: rotas.length,
  rotas,
};
writeFileSync(SAIDA, JSON.stringify(saida, null, 2), "utf8");

console.log(`lista-mestra: ${rotas.length} rotas -> ${SAIDA}`);
console.log(`  sitemap:   ${sitemap.houveResposta ? sitemap.achadas.size + " rotas" : "NAO RESPONDEU"}`);
console.log(`  varredura: ${varredura.achadas.size} rotas (profundidade ${PROF})`);
if (varredura.falhas.length) {
  console.log(`  ⚠️ ${varredura.falhas.length} rota(s) falharam na varredura:`);
  for (const f of varredura.falhas) console.log(`     ${f.rota}: ${f.erro}`);
}
if (!sitemap.houveResposta) {
  console.log("  ⚠️ SEM SITEMAP: a lista vem de uma fonte só. Conferir à mão.");
}
if (soUmaFonte.length) {
  console.log(`  ⚠️ ${soUmaFonte.length} rota(s) em UMA fonte só (merecem segunda olhada):`);
  for (const r of soUmaFonte) console.log(`     [${r.procedencia}] ${r.rota}`);
}
