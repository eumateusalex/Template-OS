// bateria-cobertura.mjs — o clone está completo?
//
// Roda a lista-mestra contra o clone SERVIDO e responde, por rota:
// responde 200? tem <title> próprio? rola na horizontal? tem imagem quebrada?
//
// 🚨 Regra desta bateria: CÉLULA VAZIA É TRABALHO NÃO FEITO, nunca "passou".
// Se uma rota não pôde ser medida, ela sai como `null` e conta como pendência.
//
// Uso:
//   CLONE=http://127.0.0.1:8080 ROTAS=./rotas.json SAIDA=./cobertura node bateria-cobertura.mjs
//
// Variáveis:
//   CLONE     URL base do clone servido (obrigatória)
//   ORIGINAL  URL base do site original — sem ela o título não é conferido
//   ROTAS  rotas.json do levanta-rotas.mjs, OU lista separada por vírgula
//   SAIDA  pasta de saída (padrão: ./cobertura)
//   DITTO  raiz do ditto, de onde vem o Playwright (padrão: C:/dev/ditto)
//   SHOTS  "1" para gravar screenshot de cada rota (padrão: desligado)

import { createRequire } from "node:module";
import { writeFileSync, mkdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const CLONE = process.env.CLONE;
if (!CLONE) {
  console.error("falta CLONE=<url base do clone servido>");
  process.exit(1);
}
const SAIDA = resolve(process.env.SAIDA ?? "./cobertura");
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
const SHOTS = process.env.SHOTS === "1";
mkdirSync(SAIDA, { recursive: true });

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

function carregarRotas() {
  const r = process.env.ROTAS;
  if (!r) {
    console.error("falta ROTAS=<rotas.json | /a,/b,/c>");
    process.exit(1);
  }
  // ⚠️ Tem que ser ARQUIVO, nao so "existe": ROTAS="/" e um caminho que
  // EXISTE (a raiz do disco), e o readFileSync estoura com EISDIR.
  if (existsSync(r) && statSync(r).isFile()) {
    const j = JSON.parse(readFileSync(r, "utf8"));
    return j.rotas.map((x) => x.rota);
  }
  return r.split(",").map((s) => s.trim()).filter(Boolean);
}

const rotas = carregarRotas();
const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();

// Falha de rede vista pelo navegador (4xx/5xx de asset, e não só de documento).
let falhasDeRede = [];
page.on("response", (r) => {
  if (r.status() >= 400) falhasDeRede.push({ url: r.url(), status: r.status() });
});

const linhas = [];
for (const rota of rotas) {
  falhasDeRede = [];
  // Furar cache: build novo servido na mesma porta já enganou muita medição.
  const url = new URL(rota, CLONE).href + (rota.includes("?") ? "&" : "?") + "_v=" + Date.now();
  const linha = {
    rota,
    status: null,
    titulo: null,
    overflowHorizontal: null,
    imagensQuebradas: null,
    detalheImagens: [],
    falhasDeRede: [],
    erro: null,
  };
  try {
    const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    linha.status = resp?.status() ?? null;

    linha.titulo = await page.title();

    linha.overflowHorizontal = await page.evaluate(() => {
      const d = document.documentElement;
      // 1px de folga: arredondamento de sub-pixel não é rolagem horizontal.
      return d.scrollWidth - window.innerWidth > 1;
    });

    // ⚠️ Imagem quebrada se afere por currentSrc + complete + naturalWidth,
    // DEPOIS de decode(). `src` engana: com srcset o navegador escolhe outra
    // variante, e sem decode() lazy-loading dá falso positivo.
    const imgs = await page.evaluate(async () => {
      const out = [];
      for (const img of Array.from(document.images)) {
        try {
          await img.decode();
        } catch {
          /* decode falha em imagem quebrada — é justamente o sinal */
        }
        if (img.complete && img.naturalWidth === 0) {
          out.push({ currentSrc: img.currentSrc || img.src || "(vazio)", alt: img.alt ?? "" });
        }
      }
      return out;
    });
    linha.imagensQuebradas = imgs.length;
    linha.detalheImagens = imgs.slice(0, 10);

    if (SHOTS) {
      const nome = (rota === "/" ? "home" : rota.replace(/^\//, "").replace(/\//g, "_")) + ".png";
      await page.screenshot({ path: join(SAIDA, nome), fullPage: true });
    }
  } catch (e) {
    linha.erro = String(e.message ?? e).slice(0, 200);
  }
  linha.falhasDeRede = falhasDeRede.slice(0, 10);
  linhas.push(linha);
  const marca = linha.erro ? "ERRO" : linha.status === 200 ? "200" : String(linha.status);
  console.log(`  ${marca.padEnd(5)} ${rota}`);
}

await navegador.close();

// 🚨 Título repetido NÃO é defeito por si. Muitos sites repetem o mesmo
// <title> em várias rotas de propósito — medido no site-exemplo, onde /, /blog,
// /projects, /terms e /privacy-policy compartilham o título no ORIGINAL.
// Acusar duplicata dentro do clone deu 5 falsos alarmes e escondeu os 2 casos
// reais. O defeito é DIVERGIR DO ORIGINAL, e só se mede comparando com ele.
const ORIGINAL = process.env.ORIGINAL;
for (const l of linhas) l.tituloOriginal = null;
if (ORIGINAL) {
  for (const l of linhas) {
    if (l.status !== 200) continue;
    try {
      const r = await fetch(new URL(l.rota, ORIGINAL).href, { redirect: "follow" });
      if (!r.ok) continue;
      const html = await r.text();
      const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      // Decodificar entidades ANTES de comparar: o clone é lido pelo navegador
      // (document.title, entidades já decodificadas) e o original por regex no
      // HTML cru. Sem isto, "the&nbsp;Noise" ≠ "the Noise" acusa
      // divergência em títulos idênticos (medido no framer-9).
      if (m) l.tituloOriginal = m[1]
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
        .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
        .replace(/\s+/g, " ")
        .trim();
    } catch {
      /* sem título do original = célula vazia, e célula vazia é pendência */
    }
  }
}
// A comparação canoniza espaço em branco NOS DOIS lados (o clone vem do
// document.title do navegador, o original de regex no HTML cru —   de um
// lado e "&nbsp;" do outro acusam divergência em títulos idênticos; medido
// no framer-9). As strings guardadas ficam fiéis; só o juízo canoniza.
const canonTitulo = (s) => s == null ? s : s.replace(/\s+/g, " ").trim();
for (const l of linhas) {
  l.tituloBate = l.tituloOriginal === null ? null : canonTitulo(l.titulo) === canonTitulo(l.tituloOriginal);
}

const naoMedidas = linhas.filter((l) => l.status === null);
const naoOk = linhas.filter((l) => l.status !== null && l.status !== 200);
const comOverflow = linhas.filter((l) => l.overflowHorizontal === true);
const comImagem = linhas.filter((l) => (l.imagensQuebradas ?? 0) > 0);
const tituloDiverge = linhas.filter((l) => l.tituloBate === false);
const tituloNaoConferido = linhas.filter((l) => l.status === 200 && l.tituloBate === null);

const resumo = {
  clone: CLONE,
  geradoPor: "bateria-cobertura.mjs",
  totalRotas: linhas.length,
  responderam200: linhas.filter((l) => l.status === 200).length,
  naoMedidas: naoMedidas.length,
  naoOk: naoOk.length,
  comOverflowHorizontal: comOverflow.length,
  comImagemQuebrada: comImagem.length,
  comTituloDivergente: tituloDiverge.length,
  tituloNaoConferido: tituloNaoConferido.length,
  linhas,
};
writeFileSync(join(SAIDA, "cobertura.json"), JSON.stringify(resumo, null, 2), "utf8");

// Matriz legível. Vazio = não medido, e isso é pendência, não aprovação.
const cel = (v, ok = "ok", ruim = "X") => (v === null || v === undefined ? "" : v ? ruim : ok);
const md = [
  `# Cobertura do clone`,
  ``,
  `Clone: \`${CLONE}\` · ${linhas.length} rotas da lista-mestra`,
  ``,
  `| Rota | HTTP | Título vs original | Overflow horiz. | Imagens quebradas |`,
  `|---|---|---|---|---|`,
  ...linhas.map(
    (l) =>
      `| \`${l.rota}\` | ${l.status ?? ""} | ${l.tituloBate === null ? "" : l.tituloBate ? "bate" : "DIVERGE"} | ${cel(l.overflowHorizontal)} | ${l.imagensQuebradas ?? ""} |`,
  ),
  ``,
  `## Resumo`,
  ``,
  `- responderam 200: **${resumo.responderam200}/${linhas.length}**`,
  `- não medidas (célula vazia = trabalho não feito): **${naoMedidas.length}**`,
  `- status diferente de 200: **${naoOk.length}**`,
  `- com rolagem horizontal: **${comOverflow.length}**`,
  `- com imagem quebrada: **${comImagem.length}**`,
  `- com título divergente do original: **${tituloDiverge.length}**`,
  `- título não conferido (sem ORIGINAL definido): **${tituloNaoConferido.length}**`,
  ``,
  ...(tituloDiverge.length
    ? [
        `### Títulos que divergem`,
        ``,
        `| Rota | Original | Clone |`,
        `|---|---|---|`,
        ...tituloDiverge.map((l) => `| \`${l.rota}\` | ${l.tituloOriginal} | ${l.titulo} |`),
      ]
    : []),
].join("\n");
writeFileSync(join(SAIDA, "COBERTURA.md"), md, "utf8");

console.log(`\ncobertura: ${resumo.responderam200}/${linhas.length} em 200 -> ${join(SAIDA, "COBERTURA.md")}`);
if (naoMedidas.length) console.log(`⚠️ ${naoMedidas.length} rota(s) NAO MEDIDAS — pendência, não aprovação`);
if (naoOk.length) for (const l of naoOk) console.log(`  ✖ ${l.rota}: HTTP ${l.status}`);
if (tituloDiverge.length) {
  console.log(`⚠️ ${tituloDiverge.length} título(s) divergem do original:`);
  for (const l of tituloDiverge) console.log(`     ${l.rota}\n       original: ${l.tituloOriginal}\n       clone:    ${l.titulo}`);
}
if (!ORIGINAL) console.log("⚠️ ORIGINAL não definido — títulos NÃO conferidos (célula vazia, não aprovação)");
if (comImagem.length) for (const l of comImagem) console.log(`  ⚠️ ${l.rota}: ${l.imagensQuebradas} imagem(ns) quebrada(s)`);

process.exitCode = naoMedidas.length || naoOk.length ? 1 : 0;
