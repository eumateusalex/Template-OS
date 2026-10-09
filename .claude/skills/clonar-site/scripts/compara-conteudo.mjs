// compara-conteudo.mjs — o clone tem o MESMO conteúdo do original?
//
// Dimensão 4 das 7. Responde, por rota: mesmo texto? mesmas imagens, e elas
// carregam? mesmos links, e eles clicam?
//
// 🚨 Mede no NAVEGADOR nos dois lados. Comparar fonte não serve: o original é
// HTML renderizado (com script inline gigante de framework) e o clone é JSX.
// Comparar os dois como texto dá diferença de centenas de milhares de bytes
// que não significa nada.
//
// 🚨 Texto de estado FECHADO conta. Um acordeão fechado normalmente mantém a
// resposta no DOM com `opacity:0` — e isso é conteúdo que o clone precisa ter.
// Por isso a colheita inclui elemento invisível por opacidade, e exclui só o
// que está fora do documento (`display:none` e afins).
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 \
//   ROTAS=./rotas.json SAIDA=./conteudo node compara-conteudo.mjs
//
// Variáveis:
//   ORIGINAL  URL base do original (obrigatória)
//   CLONE     URL base do clone servido (obrigatória)
//   ROTAS     rotas.json do levanta-rotas.mjs, OU lista separada por vírgula
//   SAIDA     pasta de saída (padrão: ./conteudo)
//   LARGURA   viewport (padrão: 1280)
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
const SAIDA = resolve(process.env.SAIDA ?? "./conteudo");
const LARGURA = Number(process.env.LARGURA ?? 1280);
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
const ESPERA = process.env.ESPERA ?? "networkidle";
const ASSENTA = Number(process.env.ASSENTA ?? (process.env.ESPERA && process.env.ESPERA !== "networkidle" ? 1200 : 0));
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
  if (existsSync(r) && statSync(r).isFile()) {
    const j = JSON.parse(readFileSync(r, "utf8"));
    return j.rotas.filter((x) => x.status === 200 || x.status === null).map((x) => x.rota);
  }
  return r.split(",").map((s) => s.trim()).filter(Boolean);
}

/** 🚨 Badge de plataforma NÃO é conteúdo do site.
 *
 *  Site em plano grátis do Framer, Wix, Webflow e afins recebe um selo fixo com
 *  link para a plataforma. Medido no site do exemplo: "Create a free website with
 *  Framer..." em posição fixa, mais um link para framer.com, presentes nas 21
 *  rotas. Isso é propaganda da hospedagem, não conteúdo — e reproduzir num
 *  clone seria carregar publicidade de terceiro.
 *
 *  Vira RESIDUAL DECLARADO, nunca defeito a consertar. */
const RUIDO_PLATAFORMA = [
  /create a free website with framer/i,
  /made (in|with) framer/i,
  /this site was created in webflow/i,
  /create your website today/i,
  /powered by (wix|squarespace|webflow|framer)/i,
  /^built with framer$/i,
];
function ruidoDePlataforma(texto) {
  return RUIDO_PLATAFORMA.some((re) => re.test(texto));
}
const LINK_PLATAFORMA = /^https?:\/\/(www\.)?(framer|wix|webflow|squarespace)\.com\/?/i;

async function assentar(page) {
  await page.evaluate(async () => {
    const passo = Math.max(200, window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight + window.innerHeight; y += passo) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 250));
  });
}

async function colher(page, origem) {
  return page.evaluate((origem) => {
    const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();

    // Texto: só nós FOLHA, para não contar o mesmo texto em cada ancestral.
    const textos = [];
    const vistos = new Set();
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      if (el.children.length > 0) continue;
      const tag = el.tagName.toLowerCase();
      if (tag === "script" || tag === "style" || tag === "noscript") continue;
      const cs = getComputedStyle(el);
      // ⚠️ NÃO filtrar por opacity: acordeão fechado guarda a resposta com
      // opacity 0, e aquilo é conteúdo que o clone precisa ter.
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const t = norm(el.textContent);
      if (!t) continue;
      const r = el.getBoundingClientRect();
      // 🚨 A chave PRECISA levar o X. Com `texto@y` só, três cards lado a lado
      // na mesma fileira (mesma data, mesmo "5 min read") colapsam num item —
      // e colapsam de forma DIFERENTE nos dois lados, porque basta 1px de
      // arredondamento para um deles escapar do colapso.
      // Medido no framer-6, /blog/*: o original põe o 3º card 2px
      // mais baixo (y=3137 contra 3135) e sobrevive com 2 entradas; o clone
      // alinha os três em 3135 e fica com 1. Sem o X, o comparador declara
      // "Jul 3, 2026", "5 min read" e "By" AUSENTES em 4 rotas — 12 das 53
      // divergências do relatório são este fantasma, e o clone está certo.
      // Duas folhas com o mesmo texto na mesma linha são dois elementos.
      const chave = t + "@" + Math.round(r.top + window.scrollY) + "," + Math.round(r.left + window.scrollX);
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      textos.push({ t, y: Math.round(r.top + window.scrollY), x: Math.round(r.left + window.scrollX) });
    }

    const imagens = Array.from(document.images).map((img) => {
      const r = img.getBoundingClientRect();
      return {
        src: img.currentSrc || img.src || "",
        alt: img.alt ?? "",
        y: Math.round(r.top + window.scrollY),
        w: Math.round(r.width),
        h: Math.round(r.height),
        quebrada: img.complete && img.naturalWidth === 0,
      };
    });

    const links = Array.from(document.querySelectorAll("a[href]")).map((a) => {
      const cs = getComputedStyle(a);
      const r = a.getBoundingClientRect();
      let destino = "";
      try {
        const u = new URL(a.href, location.href);
        destino = u.origin === location.origin ? u.pathname.replace(/\/+$/, "") || "/" : u.href;
      } catch {
        destino = a.getAttribute("href") ?? "";
      }
      // Link "morto": recebe href mas não recebe clique.
      const morto = cs.pointerEvents === "none";
      return { destino, texto: norm(a.textContent).slice(0, 60), morto, y: Math.round(r.top + window.scrollY) };
    });

    return { origem, textos, imagens, links, titulo: document.title };
  }, origem);
}

const rotas = carregarRotas();
const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: LARGURA, height: 900 } });
const page = await ctx.newPage();

const linhas = [];
for (const rota of rotas) {
  const linha = { rota, erro: null };
  try {
    for (const [lado, base] of [["original", ORIGINAL], ["clone", CLONE]]) {
      const url = new URL(rota, base).href + (lado === "clone" ? "?_v=" + Date.now() : "");
      await page.goto(url, { waitUntil: ESPERA, timeout: 60000 });
      if (ASSENTA) await page.waitForTimeout(ASSENTA);
      await assentar(page);
      linha[lado] = await colher(page, lado);
      // 🚨 TEXTO QUE MUDA COM O TEMPO — o contador numérico.
      //
      // O texto de um contador É o número, e ele sobe enquanto a seção está em
      // tela. Duas fotos tiradas com um tique de diferença mostram valores
      // diferentes, e o comparador acusa "divergência" num elemento que está
      // perfeito: medido no framer-4, o original marcava 83 e o clone 82, na
      // mesma posição, cada um reproduzindo fielmente a mesma contagem.
      //
      // Segunda foto depois de uma pausa: o que mudou de valor NO MESMO LUGAR
      // depende do instante e sai da conta, declarado. Quem verifica contador
      // é o mede-contador.mjs, nos dois lados, comparando partida, chegada,
      // duração e curva — prova mais forte que uma fotografia.
      // ⚠️ a chave NÃO pode ser a coordenada exata: o contador muda de LARGURA
      // junto com o número (80 e 120 não medem igual), então ele e o vizinho
      // andam de lugar entre as duas fotos e a chave por x|y nunca casa. Quem
      // identifica é a FAIXA de altura: o conjunto de textos daquela linha.
      // ⚠️ ...e esperar parado NÃO basta: o contador PAUSA fora da tela (é o
      // que o original faz, e o clone reproduz). Com a página no topo as duas
      // fotos saem idênticas, a faixa não é sinalizada, e a divergência entre
      // os lados — cada um congelado num número — passa por defeito. Entre uma
      // foto e outra é preciso VISITAR a página, para o que depende do tempo
      // voltar a correr.
      await page.evaluate(async () => {
        const altura = document.body.scrollHeight;
        const passo = Math.max(500, Math.round(altura / 8));
        for (let y = 0; y < altura; y += passo) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); }
        scrollTo(0, 0);
      });
      await page.waitForTimeout(Number(process.env.INSTAVEL_MS ?? 900));
      const segunda = await colher(page, lado);
      const porFaixa = (lista) => {
        const m = new Map();
        for (const t of lista) {
          const f = Math.round(t.y / 8);
          if (!m.has(f)) m.set(f, []);
          m.get(f).push(t.t);
        }
        for (const [k, v] of m) m.set(k, v.slice().sort().join(""));
        return m;
      };
      const f1 = porFaixa(linha[lado].textos), f2 = porFaixa(segunda.textos);
      const faixas = [];
      for (const [k, v] of f1) if (f2.has(k) && f2.get(k) !== v) faixas.push(k);
      linha[lado].instaveis = faixas;
    }
  } catch (e) {
    linha.erro = String(e.message ?? e).slice(0, 200);
  }

  if (linha.original && linha.clone) {
    // ⚠️ Comparar só por CONJUNTO de strings chama de "ausente" o que é
    // "diferente". Medido: o rodapé do original diz "© 2026 Nome do Dono"
    // e o do clone "© 2025", na MESMA posição (y=4883). Como conjunto, some um
    // e sobra outro; casando por posição, aparece o que realmente é: um texto
    // divergente, com conserto óbvio. Casar por posição PRIMEIRO.
    const usados = new Set();
    const divergentes = [];
    const ausentes = [];
    // posições cujo texto depende do instante (contador) — ver o bloco na
    // coleta. Sai da conta dos DOIS lados e vai declarado no relatório.
    const instavel = new Set([...(linha.original.instaveis ?? []), ...(linha.clone.instaveis ?? [])]);
    const ehInstavel = (t) => instavel.has(Math.round(t.y / 8));
    linha.textoInstavel = instavel.size;
    for (const o of linha.original.textos) {
      if (ruidoDePlataforma(o.t)) continue;
      if (ehInstavel(o)) continue;
      const exato = linha.clone.textos.find((c, i) => !usados.has(i) && c.t === o.t);
      if (exato) {
        usados.add(linha.clone.textos.indexOf(exato));
        continue;
      }
      // Mesmo lugar, texto outro: é divergência, não ausência.
      const noLugar = linha.clone.textos.find(
        (c, i) => !usados.has(i) && Math.abs(c.y - o.y) <= 3 && Math.abs(c.x - o.x) <= 6,
      );
      if (noLugar) {
        usados.add(linha.clone.textos.indexOf(noLugar));
        divergentes.push({ y: o.y, original: o.t, clone: noLugar.t });
      } else {
        ausentes.push(o.t);
      }
    }
    linha.textoDivergente = divergentes;
    linha.textoFaltando = ausentes;
    const setOrig = new Set(linha.original.textos.map((x) => x.t));
    linha.textoSobrando = linha.clone.textos.filter((x) => !ehInstavel(x)).map((x) => x.t).filter((t) => !setOrig.has(t) && !ruidoDePlataforma(t));

    linha.imagensOriginal = linha.original.imagens.length;
    linha.imagensClone = linha.clone.imagens.length;
    linha.imagensQuebradas = linha.clone.imagens.filter((i) => i.quebrada).length;

    const destinosOrig = new Set(linha.original.links.filter((l) => !l.morto).map((l) => l.destino));
    const destinosClone = new Set(linha.clone.links.filter((l) => !l.morto).map((l) => l.destino));
    linha.linksFaltando = [...destinosOrig].filter((d) => !destinosClone.has(d) && !LINK_PLATAFORMA.test(d));
    linha.linksPlataformaIgnorados = [...destinosOrig].filter((d) => LINK_PLATAFORMA.test(d));
    // Link morto no clone que está VIVO no original: defeito de verdade.
    const mortosOrig = new Set(linha.original.links.filter((l) => l.morto).map((l) => l.destino));
    linha.linksMortosIndevidos = linha.clone.links
      .filter((l) => l.morto && !mortosOrig.has(l.destino))
      .map((l) => ({ destino: l.destino, texto: l.texto }));

    linha.bate =
      linha.textoFaltando.length === 0 &&
      linha.textoDivergente.length === 0 &&
      linha.imagensQuebradas === 0 &&
      linha.linksFaltando.length === 0 &&
      linha.linksMortosIndevidos.length === 0;
  }

  linhas.push(linha);
  const marca = linha.erro ? "ERRO" : linha.bate ? "ok" : "DIFF";
  console.log(
    `  ${marca.padEnd(5)} ${linha.rota}` +
      (linha.erro
        ? ""
        : `  falta=${linha.textoFaltando.length} diverge=${linha.textoDivergente.length} img=${linha.imagensClone}/${linha.imagensOriginal} quebrada=${linha.imagensQuebradas} link-falta=${linha.linksFaltando.length} link-morto=${linha.linksMortosIndevidos.length}`),
  );
}

await navegador.close();

const naoMedidas = linhas.filter((l) => l.erro);
const batem = linhas.filter((l) => l.bate);

writeFileSync(join(SAIDA, "conteudo.json"), JSON.stringify({ ORIGINAL, CLONE, LARGURA, linhas }, null, 2), "utf8");

const md = [
  `# Paridade de conteúdo — original × clone`,
  ``,
  `Medido no navegador a ${LARGURA}px, nos dois lados.`,
  ``,
  `| Rota | Texto faltando | Texto divergente | Imagens (clone/orig) | Quebradas | Links faltando | Links mortos indevidos |`,
  `|---|---|---|---|---|---|---|`,
  ...linhas.map((l) =>
    l.erro
      ? `| \`${l.rota}\` | | | | | | |`
      : `| \`${l.rota}\` | ${l.textoFaltando.length} | ${l.textoDivergente.length} | ${l.imagensClone}/${l.imagensOriginal} | ${l.imagensQuebradas} | ${l.linksFaltando.length} | ${l.linksMortosIndevidos.length} |`,
  ),
  ``,
  `## Resumo`,
  ``,
  `- rotas com conteúdo batendo: **${batem.length}/${linhas.length}**`,
  `- não medidas (célula vazia = trabalho não feito): **${naoMedidas.length}**`,
].join("\n");
writeFileSync(join(SAIDA, "CONTEUDO.md"), md, "utf8");

console.log(`\nconteúdo: ${batem.length}/${linhas.length} batendo -> ${join(SAIDA, "CONTEUDO.md")}`);
for (const l of linhas.filter((x) => x.bate === false)) {
  console.log(`\n  ✖ ${l.rota}`);
  for (const d of l.textoDivergente.slice(0, 6)) {
    console.log(`      texto DIVERGE em y=${d.y}`);
    console.log(`        original: "${d.original.slice(0, 66)}"`);
    console.log(`        clone:    "${d.clone.slice(0, 66)}"`);
  }
  if (l.textoDivergente.length > 6) console.log(`      ... mais ${l.textoDivergente.length - 6} divergências`);
  if (l.textoFaltando.length)
    for (const t of l.textoFaltando.slice(0, 6)) console.log(`      texto ausente: "${t.slice(0, 70)}"`);
  if (l.textoFaltando.length > 6) console.log(`      ... mais ${l.textoFaltando.length - 6}`);
  if (l.imagensQuebradas) console.log(`      ${l.imagensQuebradas} imagem(ns) quebrada(s)`);
  if (l.linksFaltando.length) console.log(`      links ausentes: ${l.linksFaltando.slice(0, 6).join(", ")}`);
  for (const m of l.linksMortosIndevidos.slice(0, 6))
    console.log(`      link morto no clone e vivo no original: ${m.destino} "${m.texto}"`);
}
process.exitCode = naoMedidas.length ? 1 : 0;
