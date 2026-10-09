// escopa-variaveis-por-rota.mjs — conserta a COLISÃO DE VARIÁVEIS entre lotes.
//
// 🚨 O defeito que este script existe para consertar (medido no site-next):
// o ditto numera as variáveis de cor por ORDEM DE DESCOBERTA
// dentro da captura. Cada lote descobre em ordem diferente, então o MESMO nome
// carrega VALOR DIFERENTE em lotes diferentes — medido: 94 de 236 nomes comuns
// divergentes entre o lote 1 e o lote 3, com deslocamento de índice
// (`--clr-11` do lote 1 é o `--clr-12` do lote 3).
//
// Juntar os lotes ficando com um globals.css só pinta 11/12 do site com as
// cores erradas, e NENHUMA medição de rota, metadata, conteúdo ou geometria
// acusa — geometria mede caixa, não cor.
//
// Por que NÃO renomear com prefixo por lote: as variáveis alimentam o
// `@theme inline` do Tailwind, que gera as classes utilitárias. Medido no lote
// 3: 1990 usos de `bg-*`, 4900 de `text-*`, 943 de `border-*` derivados de
// nome de tema. Renomear a variável obrigaria a reescrever milhares de classes
// — caro e arriscado.
//
// O conserto: NOME fica, VALOR passa a ser escopado à rota.
//   1. globals.css final recebe a UNIÃO dos nomes (para que toda classe
//      utilitária exista) com um valor padrão.
//   2. Cada rota ganha, no seu próprio ditto.css, um bloco
//      `[data-rota="<slug>"]{ ... }` com as variáveis do SEU lote que divergem
//      do padrão — a regra desta skill: acrescenta o que falta, não reescreve o
//      que já está certo.
//   3. O wrapper de topo de cada page.tsx recebe `data-rota="<slug>"`.
// Custom property que referencia outra (`--color-x: var(--x)`) resolve no
// ponto de USO, então redefinir a variável crua no wrapper corrige também as
// classes utilitárias que passam pelo alias, sem tocar em uma classe sequer.
//
// Uso:
//   LOTES=<pasta app-lote-*> APP=<app juntado> node escopa-variaveis-por-rota.mjs
//
// Variáveis:
//   LOTES     pasta com as app-lote-* (obrigatória)
//   APP       app já juntado pelo junta-lotes.mjs (obrigatória)
//   ESCREVER  "0" para simular sem gravar (padrão: grava)

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, resolve, relative } from "node:path";

const LOTES = process.env.LOTES;
const APP = process.env.APP;
if (!LOTES || !APP) {
  console.error("faltam LOTES e/ou APP");
  process.exit(1);
}
const raizLotes = resolve(LOTES);
const app = resolve(APP);
const ESCREVER = process.env.ESCREVER !== "0";

const pastasLote = readdirSync(raizLotes)
  .filter((n) => /^app-lote-\d+$/.test(n))
  .sort()
  .filter((n) => existsSync(join(raizLotes, n, "src", "app", "globals.css")));

if (!pastasLote.length) {
  console.error("nenhum lote com globals.css");
  process.exit(1);
}

/** Extrai `--nome: valor` de todos os blocos `:root { }` de um CSS. */
function varsDeRoot(css) {
  const mapa = new Map();
  const re = /:root\s*\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    for (const decl of m[1].split(";")) {
      const d = decl.trim();
      if (!d.startsWith("--")) continue;
      const i = d.indexOf(":");
      if (i < 0) continue;
      mapa.set(d.slice(0, i).trim(), d.slice(i + 1).trim());
    }
  }
  return mapa;
}

/** Extrai os aliases declarados dentro do `@theme inline { }`. */
function varsDeTema(css) {
  const mapa = new Map();
  const i = css.indexOf("@theme inline");
  if (i < 0) return mapa;
  const abre = css.indexOf("{", i);
  let nivel = 0, fim = -1;
  for (let k = abre; k < css.length; k++) {
    if (css[k] === "{") nivel++;
    else if (css[k] === "}") { nivel--; if (nivel === 0) { fim = k; break; } }
  }
  if (fim < 0) return mapa;
  for (const decl of css.slice(abre + 1, fim).split(";")) {
    const d = decl.trim();
    if (!d.startsWith("--")) continue;
    const j = d.indexOf(":");
    if (j < 0) continue;
    mapa.set(d.slice(0, j).trim(), d.slice(j + 1).trim());
  }
  return { mapa, abre, fim };
}

/** Blocos @font-face inteiros, chaveados pela url do src (identidade estável). */
function fontFaces(css) {
  const saida = new Map();
  const re = /@font-face\s*\{[^}]*\}/g;
  let m;
  while ((m = re.exec(css))) {
    const url = /url\(["']?([^"')]+)/.exec(m[0]);
    saida.set(url ? url[1] : m[0], m[0]);
  }
  return saida;
}

/** Rotas (slug de URL) que um lote contém, pela presença de page.tsx. */
function rotasDoLote(pastaApp) {
  const raiz = join(pastaApp, "src", "app");
  const saida = [];
  (function anda(dir) {
    for (const nome of readdirSync(dir)) {
      const abs = join(dir, nome);
      if (statSync(abs).isDirectory()) anda(abs);
      else if (nome === "page.tsx") {
        const rel = relative(raiz, dir).replace(/\\/g, "/");
        saida.push(rel === "" ? "/" : "/" + rel);
      }
    }
  })(raiz);
  return saida;
}

// ---- 1. ler cada lote ----
const lotes = pastasLote.map((nome) => {
  const css = readFileSync(join(raizLotes, nome, "src", "app", "globals.css"), "utf8");
  const tema = varsDeTema(css);
  return {
    nome,
    root: varsDeRoot(css),
    tema: tema.mapa ?? new Map(),
    fontes: fontFaces(css),
    rotas: rotasDoLote(join(raizLotes, nome)),
  };
});

// ---- 2. rota -> lote (primeiro lote que a tem; a home fica com o lote 1) ----
const donoDaRota = new Map();
for (const lote of lotes) for (const r of lote.rotas) if (!donoDaRota.has(r)) donoDaRota.set(r, lote);

// ---- 3. união dos nomes, valor padrão = do primeiro lote que define ----
const rootPadrao = new Map();
const temaPadrao = new Map();
const fontesUniao = new Map();
for (const lote of lotes) {
  for (const [k, v] of lote.root) if (!rootPadrao.has(k)) rootPadrao.set(k, v);
  for (const [k, v] of lote.tema) if (!temaPadrao.has(k)) temaPadrao.set(k, v);
  for (const [k, v] of lote.fontes) if (!fontesUniao.has(k)) fontesUniao.set(k, v);
}

const base = lotes[0];
const faltamTema = [...temaPadrao].filter(([k]) => !base.tema.has(k));
const faltamRoot = [...rootPadrao].filter(([k]) => !base.root.has(k));
const faltamFontes = [...fontesUniao].filter(([k]) => !base.fontes.has(k));

// ---- 4. globals.css final ----
const caminhoGlobals = join(app, "src", "app", "globals.css");
let globals = readFileSync(caminhoGlobals, "utf8");
if (!globals.includes("/* uniao-de-lotes */")) {
  const t = varsDeTema(globals);
  if (t.fim > 0 && faltamTema.length) {
    const bloco = faltamTema.map(([k, v]) => `  ${k}: ${v};`).join("\n");
    globals = globals.slice(0, t.fim) + `\n  /* uniao-de-lotes: nomes vindos de outros lotes, para as classes utilitarias existirem */\n${bloco}\n` + globals.slice(t.fim);
  }
  const extras = [];
  if (faltamRoot.length)
    extras.push(`/* uniao-de-lotes: valores padrao; o valor CERTO de cada rota vem do bloco [data-rota] do ditto.css dela */\n:root {\n${faltamRoot.map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}`);
  if (faltamFontes.length) extras.push(faltamFontes.map(([, v]) => v).join("\n"));
  if (extras.length) globals += `\n\n/* uniao-de-lotes */\n` + extras.join("\n\n") + "\n";
  if (ESCREVER) writeFileSync(caminhoGlobals, globals, "utf8");
}

// ---- 5. escopo por rota ----
function slug(rota) {
  return rota === "/" ? "raiz" : rota.replace(/^\//, "").replace(/[^a-zA-Z0-9]+/g, "-");
}

let rotasComEscopo = 0, varsEscritas = 0, rotasSemDiferenca = 0, paginasMarcadas = 0;
const semWrapper = [];

for (const [rota, lote] of donoDaRota) {
  const pastaRota = rota === "/" ? join(app, "src", "app") : join(app, "src", "app", rota.slice(1));
  const caminhoCss = join(pastaRota, "ditto.css");
  const caminhoPage = join(pastaRota, "page.tsx");
  if (!existsSync(caminhoPage)) continue;

  const s = slug(rota);
  const diff = [...lote.root].filter(([k, v]) => rootPadrao.get(k) !== v);

  if (existsSync(caminhoCss)) {
    let css = readFileSync(caminhoCss, "utf8");
    if (!css.includes("/* escopo-de-lote */")) {
      if (diff.length) {
        css += `\n/* escopo-de-lote: ${lote.nome} — ${diff.length} variavel(is) que divergem do padrao global.\n   Nome mantido de proposito: as classes utilitarias do @theme dependem dele. */\n[data-rota="${s}"] {\n${diff.map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}\n`;
        if (ESCREVER) writeFileSync(caminhoCss, css, "utf8");
        rotasComEscopo++;
        varsEscritas += diff.length;
      } else rotasSemDiferenca++;
    }
  }

  // marca TODOS os filhos de topo do fragmento (há páginas com mais de um)
  let page = readFileSync(caminhoPage, "utf8");
  if (!page.includes(`data-rota="${s}"`)) {
    let marcou = 0;
    page = page.replace(/^(      <[a-zA-Z][a-zA-Z0-9]*)(\s)/gm, (m, ini, esp) => {
      marcou++;
      return `${ini} data-rota="${s}"${esp}`;
    });
    if (marcou) {
      if (ESCREVER) writeFileSync(caminhoPage, page, "utf8");
      paginasMarcadas++;
    } else semWrapper.push(rota);
  }
}

console.log(`lotes lidos: ${lotes.length}  ·  rotas mapeadas: ${donoDaRota.size}`);
console.log(`globals.css: +${faltamTema.length} alias(es) de tema, +${faltamRoot.length} variavel(is) padrao, +${faltamFontes.length} @font-face`);
console.log(`escopo por rota: ${rotasComEscopo} rota(s) com bloco [data-rota] (${varsEscritas} variaveis), ${rotasSemDiferenca} sem divergencia`);
console.log(`paginas marcadas com data-rota: ${paginasMarcadas}`);
if (semWrapper.length) {
  console.log(`⚠️ ${semWrapper.length} rota(s) sem wrapper de topo reconhecido (o escopo NAO se aplica nelas):`);
  for (const r of semWrapper.slice(0, 10)) console.log(`   ${r}`);
}
if (!ESCREVER) console.log("\n(ESCREVER=0 — nada foi gravado)");
