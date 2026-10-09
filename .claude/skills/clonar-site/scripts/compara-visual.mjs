// compara-visual.mjs — o clone parece o original? Por número, não por olhar.
//
// Mede os DOIS lados no MESMO viewport e compara: altura de página, marcos de
// seção, fontes que efetivamente renderizaram e contagem de imagens.
//
// 🚨 Duas regras que decidem se a medição vale:
//
// 1. MESMO VIEWPORT nos dois lados. Comparar em janelas diferentes já produziu
//    "diferença" que não existia.
// 2. SELETOR ESTRUTURAL, nunca por classe. `.bg-surface-6` é Tailwind e só
//    existe no clone; medir os dois lados com ele compara coisas diferentes e
//    chama isso de divergência. Aqui se usa profundidade/tag/ordem.
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 \
//   ROTAS=./rotas.json SAIDA=./visual node compara-visual.mjs
//
// Variáveis:
//   ORIGINAL  URL base do original (obrigatória)
//   CLONE     URL base do clone servido (obrigatória)
//   ROTAS     rotas.json, OU lista separada por vírgula
//   SAIDA     pasta de saída (padrão: ./visual)
//   LARGURAS  larguras a medir, separadas por vírgula (padrão: 1280,375)
//   TOL       tolerância em px para altura de página (padrão: 24)
//   DITTO     raiz do ditto (padrão: C:/dev/ditto)

import { createRequire } from "node:module";
import { writeFileSync, mkdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const ORIGINAL = process.env.ORIGINAL;
const CLONE = process.env.CLONE;
if (!ORIGINAL || !CLONE) {
  console.error("faltam ORIGINAL e/ou CLONE");
  process.exit(1);
}
const SAIDA = resolve(process.env.SAIDA ?? "./visual");
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
const ESPERA = process.env.ESPERA ?? "networkidle";
const ASSENTA = Number(process.env.ASSENTA ?? (process.env.ESPERA && process.env.ESPERA !== "networkidle" ? 1200 : 0));
const LARGURAS = (process.env.LARGURAS ?? "1280,375").split(",").map((n) => Number(n.trim()));
const TOL = Number(process.env.TOL ?? 24);
mkdirSync(SAIDA, { recursive: true });

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

function carregarRotas() {
  const r = process.env.ROTAS;
  if (!r) return ["/"];
  // ⚠️ Tem que ser ARQUIVO, nao so "existe": ROTAS="/" e um caminho que
  // EXISTE (a raiz do disco), e o readFileSync estoura com EISDIR.
  if (existsSync(r) && statSync(r).isFile()) {
    const j = JSON.parse(readFileSync(r, "utf8"));
    return j.rotas.filter((x) => x.status === 200 || x.status === null).map((x) => x.rota);
  }
  return r.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Rola a página inteira e volta: conteúdo que só aparece ao entrar em tela
 *  não pode ficar de fora da medição. */
async function assentar(page) {
  await page.evaluate(async () => {
    const passo = Math.max(200, window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight + window.innerHeight; y += passo) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
}

/** Marcos estruturais: cabeçalhos e seções, identificados por tag + ordem +
 *  texto — nunca por classe, que não existe nos dois lados. */
async function medir(page) {
  return page.evaluate(() => {
    const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();
    const marcos = [];
    const alvos = Array.from(document.querySelectorAll("h1,h2,h3,section,footer,header,main"));
    alvos.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      marcos.push({
        i,
        tag: el.tagName.toLowerCase(),
        texto: norm(el.textContent).slice(0, 80),
        topo: Math.round(r.top + window.scrollY),
        altura: Math.round(r.height),
      });
    });
    const fontes = new Set();
    for (const el of Array.from(document.querySelectorAll("h1,h2,p,a,span,li")).slice(0, 400)) {
      const f = getComputedStyle(el).fontFamily;
      if (f) fontes.add(f.split(",")[0].replace(/["']/g, "").trim());
    }
    return {
      alturaPagina: Math.round(document.documentElement.scrollHeight),
      larguraRolagem: Math.round(document.documentElement.scrollWidth),
      marcos,
      fontes: [...fontes].sort(),
      imagens: document.images.length,
      titulo: document.title,
    };
  });
}

const rotas = carregarRotas();
const navegador = await chromium.launch();
const relatorio = [];

for (const largura of LARGURAS) {
  const ctx = await navegador.newContext({ viewport: { width: largura, height: 900 } });
  const page = await ctx.newPage();
  for (const rota of rotas) {
    const linha = { rota, largura, original: null, clone: null, erro: null };
    try {
      for (const [lado, base] of [["original", ORIGINAL], ["clone", CLONE]]) {
        const url = new URL(rota, base).href + (lado === "clone" ? "?_v=" + Date.now() : "");
        await page.goto(url, { waitUntil: ESPERA, timeout: 60000 });
      if (ASSENTA) await page.waitForTimeout(ASSENTA);
        await assentar(page);
        linha[lado] = await medir(page);
      }
    } catch (e) {
      linha.erro = String(e.message ?? e).slice(0, 200);
    }
    if (linha.original && linha.clone) {
      linha.deltaAltura = linha.clone.alturaPagina - linha.original.alturaPagina;
      linha.alturaBate = Math.abs(linha.deltaAltura) <= TOL;
      linha.deltaMarcos = linha.clone.marcos.length - linha.original.marcos.length;
      const fo = new Set(linha.original.fontes);
      const fc = new Set(linha.clone.fontes);
      linha.fontesFaltando = [...fo].filter((f) => !fc.has(f));
      linha.fontesBatem = linha.fontesFaltando.length === 0;
      linha.deltaImagens = linha.clone.imagens - linha.original.imagens;
    }
    relatorio.push(linha);
    const marca = linha.erro ? "ERRO" : linha.alturaBate ? "ok" : "DIFF";
    console.log(
      `  ${String(largura).padEnd(5)} ${marca.padEnd(5)} ${rota}` +
        (linha.deltaAltura !== undefined ? `  Δaltura=${linha.deltaAltura}px` : ""),
    );
  }
  await ctx.close();
}
await navegador.close();

writeFileSync(join(SAIDA, "visual.json"), JSON.stringify({ ORIGINAL, CLONE, TOL, relatorio }, null, 2), "utf8");

const comDiff = relatorio.filter((l) => l.alturaBate === false);
const semFonte = relatorio.filter((l) => l.fontesBatem === false);
const naoMedidas = relatorio.filter((l) => l.erro);

const md = [
  `# Fidelidade visual — original × clone`,
  ``,
  `Tolerância de altura: ${TOL}px · larguras: ${LARGURAS.join(", ")}`,
  ``,
  `| Rota | Largura | Altura orig. | Altura clone | Δ | Marcos Δ | Fontes | Imagens Δ |`,
  `|---|---|---|---|---|---|---|---|`,
  ...relatorio.map((l) =>
    l.erro
      ? `| \`${l.rota}\` | ${l.largura} | | | | | | |`
      : `| \`${l.rota}\` | ${l.largura} | ${l.original.alturaPagina} | ${l.clone.alturaPagina} | ${l.deltaAltura} | ${l.deltaMarcos} | ${l.fontesBatem ? "ok" : "FALTA " + l.fontesFaltando.join(", ")} | ${l.deltaImagens} |`,
  ),
  ``,
  `## Resumo`,
  ``,
  `- alturas dentro da tolerância: **${relatorio.filter((l) => l.alturaBate).length}/${relatorio.length}**`,
  `- divergem em altura: **${comDiff.length}**`,
  `- perderam fonte: **${semFonte.length}**`,
  `- não medidas (célula vazia = trabalho não feito): **${naoMedidas.length}**`,
].join("\n");
writeFileSync(join(SAIDA, "VISUAL.md"), md, "utf8");

console.log(`\nvisual: ${relatorio.filter((l) => l.alturaBate).length}/${relatorio.length} dentro de ${TOL}px -> ${join(SAIDA, "VISUAL.md")}`);
if (naoMedidas.length) console.log(`⚠️ ${naoMedidas.length} não medidas — pendência, não aprovação`);
process.exitCode = naoMedidas.length ? 1 : 0;
