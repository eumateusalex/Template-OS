// recupera-assets.mjs — materializa os binários que o plano all-static REFERENCIA
// mas nunca baixou.
//
// Por que existe: o clone multi com experimentalClonePlan reusa UMA captura (a
// entrada) e gera o código de todas as rotas a partir do content bundle. O
// código de cada rota referencia /assets/cloned/{images,fonts,svg}/<hash>.<ext>,
// mas os binários das rotas que NÃO são a home nunca foram baixados: ficam só os
// da captura reusada. Medido no framer-6: 654 assets únicos
// referenciados, 157 no disco (só a home), 497 ausentes — fotos de equipe,
// projeto e blog, e as fontes das outras rotas. O endpoint /files/ da API dá 404
// para binário de captura reusada, e o job multi é evictado logo depois, então
// não dá para buscar de lá.
//
// O contorno: o nome do arquivo local É o hash da URL de origem —
// `${sha1_12(url)}.${extFromUrl(url)}` (compiler/src/capture/capture.ts:1227).
// sha1_12 = 12 primeiros hex do SHA1 da URL exata. Então, com o site no ar:
//   1) varrer o CÓDIGO do app pelo conjunto real de assets referenciados
//   2) copiar do capture-cache o que já existe (sem rede)
//   3) para o resto, buscar o HTML e o CSS de cada rota do ORIGINAL, extrair as
//      URLs de asset, reproduzir o hash, e baixar as que casam com um faltante
//   4) DECLARAR o que sobrar sem URL — nunca inventar
//
// 🚨 O guard (o que faz este instrumento se calar): asset faltante sem URL
// casada NÃO é baixado nem forjado; sai na lista `naoResolvidos` do relatório.
// Download que volta vazio ou com bytes que não batem com a extensão é recusado
// e também declarado. Silêncio vira aprovação falsa, e aprovação falsa é o
// defeito mais caro desta skill.
//
// Uso:
//   APP=<app> ROTAS=<rotas.json> ORIGINAL=<url> node recupera-assets.mjs
//
// Variáveis:
//   APP        pasta do app clonado (obrigatória)
//   ROTAS      rotas.json do levanta-rotas.mjs — as rotas a varrer no original (obrigatória)
//   ORIGINAL   URL base do original (obrigatória)
//   STORE      assets-store do capture-cache (padrão: deriva do domínio em C:/dev/ditto/...)
//   MANIFESTO  assets-discovered.json (padrão: STORE/../assets-discovered.json)
//   CONC       downloads/fetches simultâneos (padrão: 6)
//   ESCREVER   0 = só relata, não escreve (padrão: 1)
//   SAIDA      onde gravar recupera-assets.json (padrão: APP/../medicoes)

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

const APP = process.env.APP;
const ROTAS = process.env.ROTAS;
const ORIGINAL = process.env.ORIGINAL;
if (!APP || !ROTAS || !ORIGINAL) {
  console.error("faltam APP, ROTAS e/ou ORIGINAL");
  process.exit(1);
}
const CONC = Number(process.env.CONC ?? 6);
const ESCREVER = process.env.ESCREVER !== "0";
const origem = new URL(ORIGINAL);
const dominio = origem.host;
const STORE = process.env.STORE ??
  `${process.env.DITTO ?? "C:/dev/ditto"}/packages/api/local-data/capture-cache/${dominio}/source/assets-store`;
const MANIFESTO = process.env.MANIFESTO ??
  (STORE ? join(dirname(STORE), "assets-discovered.json") : "");
const SAIDA = process.env.SAIDA ?? resolve(APP, "..", "medicoes");

const sha1_12 = (s) => createHash("sha1").update(s).digest("hex").slice(0, 12);
const extFromUrl = (url) => {
  try {
    const p = new URL(url).pathname;
    const dot = p.lastIndexOf(".");
    if (dot >= 0 && dot > p.lastIndexOf("/")) {
      const ext = p.slice(dot + 1).toLowerCase();
      if (ext.length <= 5 && /^[a-z0-9]+$/.test(ext)) return ext;
    }
  } catch { /* ignore */ }
  return "";
};
// espelha compiler/src/capture/capture.ts CONTENT_TYPE_EXT
const CT_EXT = {
  "image/webp": "webp", "image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg",
  "image/avif": "avif", "image/gif": "gif", "image/svg+xml": "svg",
  "image/x-icon": "ico", "image/vnd.microsoft.icon": "ico", "image/bmp": "bmp",
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov", "video/ogg": "ogv",
  "font/woff2": "woff2", "font/woff": "woff", "font/ttf": "ttf", "font/otf": "otf",
  "application/font-woff2": "woff2", "application/font-woff": "woff",
  "application/x-font-ttf": "ttf", "application/vnd.ms-fontobject": "eot",
  "text/css": "css", "application/json": "json", "application/manifest+json": "webmanifest",
};
const extFromCT = (ct) => (ct ? (CT_EXT[ct.split(";")[0].trim().toLowerCase()] ?? "") : "");
// naming do ditto: extFromUrl PRIMEIRO, content-type como fallback (capture.ts:1224)
const nomeComCT = (url, ct) => {
  const ext = extFromUrl(url) || extFromCT(ct);
  return ext ? `${sha1_12(url)}.${ext}` : null;
};
const nomeDe = (url) => {
  const ext = extFromUrl(url);
  return ext ? `${sha1_12(url)}.${ext}` : null;
};
const decodeAmp = (s) => s.replace(/&amp;/g, "&").replace(/&#38;/g, "&").replace(/&quot;/g, '"');

// 1) O conjunto REAL de assets referenciados pelo código do app ---------------
function varrerArquivos(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".next" || e.name === "out") continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) varrerArquivos(p, out);
    else if (/\.(tsx?|jsx?|css|json)$/.test(e.name)) out.push(p);
  }
  return out;
}
const refRe = /\/assets\/cloned\/(images|fonts|svg|media)\/([0-9a-f]{12})\.([a-z0-9]+)/g;
const necessarios = new Map(); // name -> {subdir, name}
const porRota = new Map(); // "/rota" -> Set(names) — só para priorizar o estágio navegador
const rotaDeArquivo = (f) => {
  const rel = f.replace(/\\/g, "/").split("/src/app/")[1] || "";
  const dir = rel.replace(/\/(page|layout)\.[tj]sx?$/, "").replace(/\.[a-z]+$/, "");
  return "/" + (dir === "page" || dir === "layout" ? "" : dir);
};
for (const f of varrerArquivos(join(APP, "src"))) {
  const txt = readFileSync(f, "utf8");
  const rota = rotaDeArquivo(f);
  let m;
  while ((m = refRe.exec(txt))) {
    const name = `${m[2]}.${m[3]}`;
    necessarios.set(name, { subdir: m[1], name });
    if (!porRota.has(rota)) porRota.set(rota, new Set());
    porRota.get(rota).add(name);
  }
}

const publicDir = join(APP, "public", "assets", "cloned");
const presentes = new Set();
for (const { subdir, name } of necessarios.values()) {
  if (existsSync(join(publicDir, subdir, name))) presentes.add(name);
}
const faltam = [...necessarios.values()].filter((a) => !presentes.has(a.name));

console.log(`referenciados pelo código: ${necessarios.size}`);
console.log(`já em public/: ${presentes.size}`);
console.log(`faltam: ${faltam.length}`);

function garantirDir(subdir) {
  const d = join(publicDir, subdir);
  if (ESCREVER) mkdirSync(d, { recursive: true });
  return d;
}
const okExt = (ext, bytes) => {
  // sanidade grosseira: recusa HTML/JSON servido no lugar de binário
  if (bytes.length < 8) return false;
  const head = bytes.slice(0, 5).toString("latin1").toLowerCase();
  if (/^<!doc|^<html|^\{|^<\?xml/.test(head) && !["svg"].includes(ext)) return false;
  return true;
};

// 2) Copiar do capture-cache o que já existe (sem rede) -----------------------
let copiados = 0;
const aindaFalta = [];
for (const a of faltam) {
  const src = join(STORE, a.name);
  if (existsSync(src)) {
    const d = garantirDir(a.subdir);
    if (ESCREVER) copyFileSync(src, join(d, a.name));
    copiados++;
  } else {
    aindaFalta.push(a);
  }
}
console.log(`copiados do capture-cache: ${copiados}`);
console.log(`a resolver pela origem: ${aindaFalta.length}`);

// 3) Mapa hash->url a partir do original --------------------------------------
// Fontes de URL: manifesto da home + HTML e CSS de todas as rotas.
const alvo = new Set(aindaFalta.map((a) => a.name));
const mapa = new Map(); // name -> url

// 3a) manifesto assets-discovered.json (home)
if (MANIFESTO && existsSync(MANIFESTO)) {
  try {
    const man = JSON.parse(readFileSync(MANIFESTO, "utf8"));
    for (const it of man) {
      if (it && it.storedAs && it.url && alvo.has(it.storedAs)) mapa.set(it.storedAs, it.url);
    }
  } catch { /* ignore */ }
}

// 3b) HTML + CSS das rotas
const lista = JSON.parse(readFileSync(ROTAS, "utf8").replace(/^\uFEFF/, ""));
const rotas = lista.rotas.filter((r) => r.status === 200).map((r) => r.rota);
const cssVistos = new Set();

async function baixaTexto(url) {
  try {
    const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" }, redirect: "follow" });
    if (!r.ok) return "";
    return await r.text();
  } catch { return ""; }
}
function extrairUrls(txt) {
  const urls = new Set();
  // qualquer URL absoluta de asset (framerusercontent e afins) em atributos/style/css
  const re = /https?:\/\/[^\s"'()<>\\]+?\.(?:png|jpe?g|webp|avif|gif|svg|ico|cur|woff2?|ttf|otf|mp4|webm|json)(?:\?[^\s"'()<>\\]*)?/gi;
  let m;
  while ((m = re.exec(txt))) urls.add(decodeAmp(m[0]));
  return urls;
}
function registrar(urls) {
  for (const u of urls) {
    const n = nomeDe(u);
    if (n && alvo.has(n) && !mapa.has(n)) mapa.set(n, u);
  }
}
function cssLinks(html, baseUrl) {
  const out = new Set();
  const re = /<link[^>]+href=["']([^"']+\.css[^"']*)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    try { out.add(new URL(decodeAmp(m[1]), baseUrl).href); } catch { /* ignore */ }
  }
  // @import dentro de <style>
  const re2 = /@import\s+(?:url\()?["']?([^"')]+\.css[^"')]*)/gi;
  while ((m = re2.exec(html))) {
    try { out.add(new URL(decodeAmp(m[1]), baseUrl).href); } catch { /* ignore */ }
  }
  return out;
}

async function comLimite(itens, fn, limite) {
  const fila = [...itens];
  const trab = Array.from({ length: Math.min(limite, fila.length) }, async () => {
    while (fila.length) { const it = fila.shift(); await fn(it); }
  });
  await Promise.all(trab);
}

// varre as rotas: HTML -> urls + descobre CSS; guarda CSS para varrer depois
const cssParaVarrer = new Set();
await comLimite(rotas, async (rota) => {
  const url = new URL(rota, origem).href;
  const html = await baixaTexto(url);
  if (!html) { console.log(`  ⚠️ sem HTML: ${rota}`); return; }
  registrar(extrairUrls(html));
  for (const c of cssLinks(html, url)) cssParaVarrer.add(c);
}, CONC);
console.log(`rotas varridas: ${rotas.length}  ·  CSS descobertos: ${cssParaVarrer.size}  ·  urls mapeadas até aqui: ${mapa.size}`);

// varre os CSS (fontes moram aqui) — inclusive @import aninhado, 1 nível
const cssNivel2 = new Set();
await comLimite([...cssParaVarrer], async (curl) => {
  if (cssVistos.has(curl)) return;
  cssVistos.add(curl);
  const css = await baixaTexto(curl);
  if (!css) return;
  registrar(extrairUrls(css));
  for (const c of cssLinks(css, curl)) if (!cssVistos.has(c)) cssNivel2.add(c);
}, CONC);
await comLimite([...cssNivel2], async (curl) => {
  if (cssVistos.has(curl)) return;
  cssVistos.add(curl);
  const css = await baixaTexto(curl);
  if (css) registrar(extrairUrls(css));
}, CONC);
console.log(`urls mapeadas no total: ${mapa.size} de ${alvo.size} faltantes`);

// 4) Baixar o que casou; declarar o resto ------------------------------------
let baixados = 0;
const falhasDownload = [];
await comLimite([...mapa.entries()], async ([name, url]) => {
  const a = aindaFalta.find((x) => x.name === name);
  if (!a) return;
  try {
    const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" }, redirect: "follow" });
    if (!r.ok) { falhasDownload.push({ name, url, motivo: `HTTP ${r.status}` }); return; }
    const buf = Buffer.from(await r.arrayBuffer());
    const ext = name.split(".").pop();
    if (!okExt(ext, buf)) { falhasDownload.push({ name, url, motivo: "bytes suspeitos" }); return; }
    if (ESCREVER) {
      const d = garantirDir(a.subdir);
      writeFileSync(join(d, name), buf);
    }
    baixados++;
  } catch (e) {
    falhasDownload.push({ name, url, motivo: String(e).slice(0, 80) });
  }
}, CONC);

// 5) Estágio NAVEGADOR — assets que só existem no DOM vivo (Framer lazy-loada
// muita imagem por JS; o HTML servido não as traz). Visita cada rota que ainda
// tem faltante, rola tudo, e salva o CORPO das respostas que casam — reproduz o
// naming do ditto com o content-type real, então pega os .webp de URL sem
// extensão que o passo textual não vê.
let salvosNav = 0;
const faltaAntesNav = aindaFalta.filter((a) => !existsSync(join(publicDir, a.subdir, a.name)));
if (process.env.NAV !== "0" && faltaAntesNav.length) {
  const alvoNav = new Map(faltaAntesNav.map((a) => [a.name, a]));
  // rotas que referenciam algo ainda faltante
  const precisa = new Set();
  for (const a of faltaAntesNav) {
    for (const [rota, nomes] of porRota) if (nomes.has(a.name)) precisa.add(rota);
  }
  const rotasNav = precisa.size ? [...precisa] : rotas;
  console.log(`\nestágio navegador: ${faltaAntesNav.length} ainda faltam, ${rotasNav.length} rota(s) a visitar`);
  const { createRequire } = await import("node:module");
  const DITTO = (process.env.DITTO ?? "C:/dev/ditto").replace(/\/?$/, "/");
  if (!(await import("node:fs")).existsSync(`${DITTO}node_modules/playwright/package.json`)) {
    console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
    process.exit(1);
  }
  const req = createRequire(DITTO);
  const { chromium } = req("playwright");
  const navegador = await chromium.launch();
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 }, userAgent: "Mozilla/5.0" });
  for (const rota of rotasNav) {
    const page = await ctx.newPage();
    const pend = [];
    page.on("response", (resp) => {
      pend.push((async () => {
        try {
          const u = resp.url();
          if (!/^https?:/.test(u)) return;
          const ct = resp.headers()["content-type"] || "";
          const nome = nomeComCT(u, ct);
          if (!nome || !alvoNav.has(nome)) return;
          if (existsSync(join(publicDir, alvoNav.get(nome).subdir, nome))) return;
          const buf = await resp.body();
          const ext = nome.split(".").pop();
          if (!okExt(ext, buf)) return;
          if (ESCREVER) {
            const d = garantirDir(alvoNav.get(nome).subdir);
            writeFileSync(join(d, nome), buf);
          }
          salvosNav++;
        } catch { /* resposta sem corpo / já foi */ }
      })());
    });
    try {
      await page.goto(new URL(rota, origem).href, { waitUntil: "networkidle", timeout: 45000 });
      // rola tudo pra disparar lazy-load, ida e volta
      await page.evaluate(async () => {
        const passo = () => new Promise((r) => setTimeout(r, 120));
        for (let y = 0; y < document.body.scrollHeight; y += Math.round(innerHeight * 0.8)) { scrollTo(0, y); await passo(); }
        scrollTo(0, document.body.scrollHeight); await passo(); scrollTo(0, 0);
      });
      await page.waitForTimeout(800);
    } catch { /* rota lenta; segue */ }
    await Promise.allSettled(pend);
    await page.close();
    process.stdout.write(`\r  navegador: ${salvosNav} salvos`);
  }
  await navegador.close();
  console.log(`\nsalvos pelo navegador: ${salvosNav}`);
}

// verdade de disco: faltante é o que NÃO existe em public/
const naoResolvidos = aindaFalta
  .filter((a) => !existsSync(join(publicDir, a.subdir, a.name)))
  .map((a) => a.name);

console.log(`\n=== resultado ===`);
console.log(`baixados da origem: ${baixados}`);
console.log(`falhas de download: ${falhasDownload.length}`);
console.log(`NÃO RESOLVIDOS (sem URL ou recusados): ${naoResolvidos.length}`);
if (naoResolvidos.length) {
  console.log(`  amostra:`);
  for (const n of naoResolvidos.slice(0, 20)) console.log(`   ${n}`);
}

const relat = {
  gerado: new Date().toISOString(),
  original: ORIGINAL,
  referenciados: necessarios.size,
  jaPresentes: presentes.size,
  faltavam: faltam.length,
  copiadosDoCache: copiados,
  baixadosDaOrigem: baixados,
  salvosPeloNavegador: salvosNav,
  falhasDownload,
  naoResolvidos,
  escreveu: ESCREVER,
};
if (ESCREVER) {
  mkdirSync(SAIDA, { recursive: true });
  writeFileSync(join(SAIDA, "recupera-assets.json"), JSON.stringify(relat, null, 2));
}
process.exitCode = naoResolvidos.length ? 1 : 0;
