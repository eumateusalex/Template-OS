// reconstroi-trilho.mjs — devolve ao clone os itens de um trilho que a captura
// perdeu, ESTÁTICOS no JSX, como o original os serve.
//
// O buraco que ele tapa (medido no framer-4): o original NÃO
// virtualiza os trilhos — a <ul> de depoimentos serve os 20 <li> completos, o
// marquee de prêmios serve os 45 logos. O ditto fotografa a página e traz só o
// que coube no enquadramento: 3 slides (dois deles vazios) e 8 logos, sete com
// largura 0. O resto vira "só no original" na geometria — 44 logos numa rota,
// 33 noutra, 10 pedaços de depoimento — e nenhum outro instrumento sabe
// recriá-los, porque não é estilo que falta: é MARKUP.
//
// 🚨 Por que ESTÁTICO e não runtime: o original entrega esses itens no HTML.
// Um runtime que os injeta depois deixa a página certa só a partir do momento
// em que o JS roda, e some inteiro para quem desligou o script. O movimento
// (marquee, setas) é outra camada, e essa sim é runtime.
//
// Como funciona:
//   MEDIR   — abre o original, acha o trilho pela âncora Y, e serializa cada
//             item: os textos das folhas, e de cada <img> o src/srcset/alt/
//             width/height, mais aria-hidden e a caixa medida.
//   ESPELHAR— baixa cada imagem nova (3 tentativas), e reaproveita o arquivo
//             que o clone JÁ tem quando o CONTEÚDO é идêntico (hash do binário,
//             não do nome: o ditto rebatiza tudo para <hash>.<ext> e casar por
//             nome duplicaria metade da pasta).
//   ESCREVER— toma um <li> SAUDÁVEL do clone como molde, e emite N cópias
//             trocando, por posição, os textos e as imagens medidos. Cada cópia
//             recebe data-cid próprio (o molde continua com o dele), porque
//             cid repetido faz querySelector devolver sempre o primeiro e
//             qualquer camada por cid passa a mirar um item só.
//
// O que o faz SE CALAR:
//   - trilho não achado num dos lados            -> declara e sai
//   - molde sem <img> onde a medição tem imagem  -> declara e sai
//   - imagem que não baixou em 3 tentativas      -> declara ESSE item e segue
//   - contagem do original <= contagem do clone  -> nada a fazer, declara
//
// Uso:
//   ORIGINAL=<url> APP=<app> SPEC=<spec.json> SAIDA=<med> node reconstroi-trilho.mjs
//
// O SPEC é uma lista de trilhos:
//   [{ "nome":"depoimentos-home", "rota":"/", "ancoraY":8934,
//      "cidTrilho":"n1293", "cidMolde":"n1301", "transform":"auto" }]
//   ancoraY  = docY do trilho no ORIGINAL (o instrumento pega o <ul> mais perto)
//   cidMolde = o <li> do CLONE que serve de forma (o mais completo)
//   transform: "auto" copia o transform do original para a classe do trilho
//
// Variáveis:
//   ORIGINAL, APP, SPEC (obrigatórias) · SAIDA (padrão ./trilhos)
//   LARGURA (1280) · ALTURA (900) · ESCREVER=0 simula · DITTO (C:/dev/ditto)

import { createRequire } from "node:module";
import { writeFileSync, readFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";

const ORIGINAL = process.env.ORIGINAL;
const APP = process.env.APP;
const SPEC = process.env.SPEC;
if (!ORIGINAL || !APP || !SPEC) { console.error("falta ORIGINAL=<url> APP=<app> SPEC=<spec.json>"); process.exit(1); }
const SAIDA = resolve(process.env.SAIDA ?? "./trilhos");
const LARGURA = Number(process.env.LARGURA ?? 1280);
const ALTURA = Number(process.env.ALTURA ?? 900);
const ESCREVER = process.env.ESCREVER !== "0";
// PREFIXO=2xl faz as caixas medidas serem escritas nas classes `2xl:` em vez
// das classes base — para a variante do bloco que só existe naquele breakpoint
const PREFIXO = (process.env.PREFIXO ?? "").trim();
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
mkdirSync(SAIDA, { recursive: true });

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");
const espec = JSON.parse(readFileSync(resolve(SPEC), "utf8").replace(/^\uFEFF/, ""));

// ---------------------------------------------------------------------------
// Parser mínimo de JSX: acha blocos de uma tag respeitando aspas, chaves e
// escapes. Regex não serve — os atributos carregam ">", "/" e aspas escapadas
// (style={{ backgroundImage: "url(\"...\")" }}, aspect-[auto_904/1200]).
// ---------------------------------------------------------------------------
function fimDaTag(s, i) {
  let j = i, aspas = null, chaves = 0;
  while (j < s.length) {
    const c = s[j];
    if (c === "\\") { j += 2; continue; }
    if (aspas) { if (c === aspas) aspas = null; }
    else if (c === '"' || c === "'") aspas = c;
    else if (c === "{") chaves++;
    else if (c === "}") chaves--;
    else if (c === ">" && chaves === 0) return j;
    j++;
  }
  return -1;
}

// blocos da tag `alvo` no nível mais raso da região [de, ate)
function blocosDe(s, de, ate, alvo) {
  const achados = [];
  let i = de, prof = 0, iniAtual = -1;
  while (i < ate) {
    if (s[i] !== "<") { i++; continue; }
    const fecha = s[i + 1] === "/";
    const m = /^<\/?([A-Za-z][\w.-]*)/.exec(s.slice(i, i + 40));
    if (!m) { i++; continue; }
    const tag = m[1];
    const f = fimDaTag(s, i);
    if (f < 0) break;
    const autoFecha = s[f - 1] === "/";
    if (fecha) {
      prof--;
      if (tag === alvo && prof === 0 && iniAtual >= 0) { achados.push({ ini: iniAtual, fim: f + 1 }); iniAtual = -1; }
    } else if (!autoFecha) {
      if (tag === alvo && prof === 0) iniAtual = i;
      prof++;
    }
    i = f + 1;
  }
  return achados;
}

// a região interna de um elemento identificado por data-cid
function regiaoDoCid(s, cid) {
  const marca = `data-cid="${cid}"`;
  const p = s.indexOf(marca);
  if (p < 0) return null;
  const ini = s.lastIndexOf("<", p);
  const f = fimDaTag(s, ini);
  if (f < 0) return null;
  const m = /^<([A-Za-z][\w.-]*)/.exec(s.slice(ini, ini + 40));
  const tag = m[1];
  if (s[f - 1] === "/") return { tag, aberturaIni: ini, aberturaFim: f + 1, interiorIni: f + 1, interiorFim: f + 1, fim: f + 1 };
  // caminhar até o fecho correspondente
  let i = f + 1, prof = 1;
  while (i < s.length && prof > 0) {
    if (s[i] !== "<") { i++; continue; }
    const mm = /^<\/?([A-Za-z][\w.-]*)/.exec(s.slice(i, i + 40));
    if (!mm) { i++; continue; }
    const ff = fimDaTag(s, i);
    if (ff < 0) break;
    if (s[i + 1] === "/") { if (mm[1] === tag) prof--; if (prof === 0) return { tag, aberturaIni: ini, aberturaFim: f + 1, interiorIni: f + 1, interiorFim: i, fim: ff + 1 }; }
    else if (s[ff - 1] !== "/" && mm[1] === tag) prof++;
    i = ff + 1;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Índice de conteúdo dos assets que o clone JÁ tem, por hash do binário.
// ---------------------------------------------------------------------------
const PASTAS = ["assets/cloned/images", "assets/cloned/svg", "assets/cloned/extra"];
const porHash = new Map();
for (const rel of PASTAS) {
  const dir = join(APP, "public", rel);
  if (!existsSync(dir)) continue;
  for (const nome of readdirSync(dir)) {
    try {
      const h = createHash("sha1").update(readFileSync(join(dir, nome))).digest("hex");
      if (!porHash.has(h)) porHash.set(h, `/${rel}/${nome}`);
    } catch {}
  }
}
console.log(`assets já existentes indexados por conteúdo: ${porHash.size}`);

const cacheUrl = new Map();
async function localDe(url) {
  if (!url || !/^https?:/.test(url)) return url;
  if (cacheUrl.has(url)) return cacheUrl.get(url);
  let buf = null;
  for (let t = 1; t <= 3; t++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error("HTTP " + r.status);
      buf = Buffer.from(await r.arrayBuffer());
      break;
    } catch (e) {
      if (t === 3) { console.log(`  ⚠️ imagem não baixou em 3 tentativas (item fica DECLARADO): ${url.slice(0, 90)}`); cacheUrl.set(url, null); return null; }
      await new Promise((r) => setTimeout(r, 700 * t));
    }
  }
  const h = createHash("sha1").update(buf).digest("hex");
  if (porHash.has(h)) { cacheUrl.set(url, porHash.get(h)); return porHash.get(h); }
  const ext = (url.match(/\.(png|jpe?g|webp|avif|svg|gif)(\?|$)/i)?.[1] ?? "png").toLowerCase();
  const sub = ext === "svg" ? "assets/cloned/svg" : "assets/cloned/images";
  mkdirSync(join(APP, "public", sub), { recursive: true });
  const nome = `${h.slice(0, 12)}.${ext}`;
  if (ESCREVER) writeFileSync(join(APP, "public", sub, nome), buf);
  const destino = `/${sub}/${nome}`;
  porHash.set(h, destino);
  cacheUrl.set(url, destino);
  return destino;
}

// ---------------------------------------------------------------------------
const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: LARGURA, height: ALTURA } });
const relatorio = [];

for (const t of espec) {
  console.log(`\n=== ${t.nome} · rota ${t.rota} · trilho ${t.cidTrilho} ===`);
  await pagina.goto(new URL(t.rota, ORIGINAL).href, { waitUntil: "load", timeout: 60000 });
  await pagina.waitForTimeout(2200);
  await pagina.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 35)); }
  });
  await pagina.evaluate((y) => scrollTo(0, Math.max(0, y - 300)), t.ancoraY);
  await pagina.waitForTimeout(1500);

  const med = await pagina.evaluate((alvoY) => {
    let trilho = null, dist = Infinity;
    for (const u of document.querySelectorAll("ul")) {
      const rr = u.getBoundingClientRect();
      const d = Math.abs(rr.top + scrollY - alvoY);
      if (d < dist) { dist = d; trilho = u; }
    }
    if (!trilho) return null;
    const cs = getComputedStyle(trilho);
    return {
      transform: cs.transform, gap: cs.gap,
      docY: Math.round(trilho.getBoundingClientRect().top + scrollY),
      itens: [...trilho.children].map((li) => {
        const textos = [];
        for (const el of li.querySelectorAll("*")) {
          if (el.children.length) continue;
          const tx = (el.textContent || "").trim();
          if (tx) textos.push(tx);
        }
        const imgs = [...li.querySelectorAll("img")].map((im) => {
          const r = im.getBoundingClientRect();
          return {
            src: im.currentSrc || im.src || null,
            srcset: im.getAttribute("srcset"),
            alt: im.getAttribute("alt"),
            largura: im.getAttribute("width"),
            altura: im.getAttribute("height"),
            sizes: im.getAttribute("sizes"),
            w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10,
          };
        });
        // 🚨 a caixa de CADA descendente, em ordem de documento. O molde traz
        // as larguras congeladas de UM item (no framer-4, a coluna de nome do
        // depoimento visível: 276.5px), e o original dimensiona por conteúdo —
        // cada slide tem a sua (175.2, 211.5, 183.2, 246.5). Copiar o molde
        // sem isto alarga a coluna dos outros e desloca o avatar meia
        // diferença para a esquerda.
        const caixas = [...li.querySelectorAll("*")].map((el) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return { tag: el.tagName, w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100, vis: cs.visibility };
        });
        return {
          textos, imgs, caixas,
          ariaHidden: li.getAttribute("aria-hidden"),
          nome: li.firstElementChild?.getAttribute("name") ?? null,
          // como o original ESCONDE o que está fora da janela do carrossel:
          // visibility no primeiro filho, com o li seguindo em display:contents
          visFilho: li.firstElementChild ? getComputedStyle(li.firstElementChild).visibility : null,
        };
      }),
    };
  }, t.ancoraY);

  if (!med) { console.log("  trilho não achado no ORIGINAL — declarado, nada escrito."); relatorio.push({ ...t, erro: "trilho não achado no original" }); continue; }
  console.log(`  original: ${med.itens.length} itens · transform=${med.transform} · gap=${med.gap}`);

  // ---- o lado do clone
  const arquivo = t.arquivo ? join(APP, t.arquivo) : null;
  if (!arquivo || !existsSync(arquivo)) { console.log(`  arquivo do clone não informado/inexistente (${t.arquivo}) — só medição.`); relatorio.push({ ...t, original: med.itens.length, medicao: med }); continue; }
  let jsx = readFileSync(arquivo, "utf8");
  const regTrilho = regiaoDoCid(jsx, t.cidTrilho);
  if (!regTrilho) { console.log(`  trilho ${t.cidTrilho} não achado no JSX — declarado.`); relatorio.push({ ...t, erro: "cidTrilho ausente no JSX" }); continue; }
  const lis = blocosDe(jsx, regTrilho.interiorIni, regTrilho.interiorFim, "li");
  console.log(`  clone: ${lis.length} <li> no JSX`);
  // FORCAR=1 regera mesmo com as contagens iguais: é como se refazem as caixas
  // de um trilho já reconstruído, medindo-o noutro breakpoint (ver PREFIXO)
  if (med.itens.length <= lis.length && process.env.FORCAR !== "1") { console.log("  o clone já tem tantos itens quanto o original — nada a fazer (FORCAR=1 regera)."); relatorio.push({ ...t, original: med.itens.length, clone: lis.length, acao: "nada" }); continue; }

  const regMolde = regiaoDoCid(jsx, t.cidMolde);
  if (!regMolde) { console.log(`  molde ${t.cidMolde} não achado — declarado.`); relatorio.push({ ...t, erro: "cidMolde ausente" }); continue; }
  const molde = jsx.slice(regMolde.aberturaIni, regMolde.fim);

  // quantos textos e imagens o molde comporta
  const imgsMolde = blocosDe(molde, 0, molde.length, "img").length || (molde.match(/<img\b/g) || []).length;
  const textosMolde = [...molde.matchAll(/>\s*([^<>{}][^<>]*?)\s*</g)].filter((m) => m[1].trim() && !/^[\s{}]*$/.test(m[1])).length;
  console.log(`  molde ${t.cidMolde}: ${imgsMolde} <img>, ${textosMolde} nó(s) de texto`);
  const precisaImgs = Math.max(...med.itens.map((i) => i.imgs.length));
  if (precisaImgs > imgsMolde) {
    console.log(`  🚨 a medição tem até ${precisaImgs} imagem(ns) por item e o molde só comporta ${imgsMolde} — DECLARADO, nada escrito.`);
    relatorio.push({ ...t, erro: `molde comporta ${imgsMolde} img, medição pede ${precisaImgs}` });
    continue;
  }

  // ---- baixar tudo que o original usa
  for (const it of med.itens) {
    for (const im of it.imgs) {
      im.local = await localDe(im.src);
      if (im.srcset) {
        const partes = [];
        for (const p of im.srcset.split(",")) {
          const [u, d] = p.trim().split(/\s+/);
          const l = await localDe(u);
          if (l) partes.push(d ? `${l} ${d}` : l);
        }
        im.srcsetLocal = partes.length ? partes.join(", ") : null;
      }
    }
  }

  // ---- gerar os itens
  let proximoCid = 1;
  const usados = new Set([...jsx.matchAll(/data-cid="([^"]+)"/g)].map((m) => m[1]));
  const novoCid = (base) => {
    let c;
    do { c = `${base}r${proximoCid++}`; } while (usados.has(c));
    usados.add(c);
    return c;
  };

  const gerados = [];
  let declarados = 0, pulados = 0, ajustes = 0, ocultos = 0;
  med.itens.forEach((item, idx) => {
    let bloco = molde;
    // 1) cids únicos por cópia
    bloco = bloco.replace(/data-cid="([^"]+)"/g, (_, c) => `data-cid="${novoCid(c)}"`);
    // 2) imagens, por posição
    let k = 0;
    bloco = bloco.replace(/<img\b[^>]*\/>/g, (tagImg) => {
      const im = item.imgs[k++];
      if (!im) return tagImg;
      let saida = tagImg;
      if (im.local) saida = saida.replace(/\bsrc="[^"]*"/, `src="${im.local}"`);
      if (im.srcsetLocal) saida = /\bsrcSet="/.test(saida) ? saida.replace(/\bsrcSet="[^"]*"/, `srcSet="${im.srcsetLocal}"`) : saida.replace(/\bsrc="/, `srcSet="${im.srcsetLocal}" src="`);
      else saida = saida.replace(/\s*\bsrcSet="[^"]*"/, "");
      if (im.alt !== null && im.alt !== undefined) saida = /\balt="/.test(saida) ? saida.replace(/\balt="[^"]*"/, `alt="${im.alt.replace(/"/g, "&quot;")}"`) : saida;
      if (im.largura) saida = saida.replace(/\bwidth="[^"]*"/, `width="${im.largura}"`);
      if (im.altura) saida = saida.replace(/\bheight="[^"]*"/, `height="${im.altura}"`);
      // a proporção mora TAMBÉM na classe: copiar o molde sem trocá-la deixa
      // todo item da galeria com o recorte do item que a captura pegou
      if (im.largura && im.altura) saida = saida.replace(/\baspect-\[auto_[\d.]+\/[\d.]+\]/g, `aspect-[auto_${im.largura}/${im.altura}]`);
      if (im.sizes) saida = /\bsizes="/.test(saida) ? saida.replace(/\bsizes="[^"]*"/, `sizes="${im.sizes}"`) : saida;
      if (!im.local) declarados++;
      return saida;
    });
    // 3) textos, por posição (só nós de texto puro, nunca expressões {})
    let j = 0;
    bloco = bloco.replace(/>(\s*)([^<>{}][^<>]*?)(\s*)</g, (todo, a, txt, b) => {
      if (!txt.trim()) return todo;
      const novo = item.textos[j++];
      if (novo === undefined) return todo;
      return `>${a}${novo.replace(/[<>{}]/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "{": "&#123;", "}": "&#125;" }[ch]))}${b}<`;
    });
    // 4) aria-hidden e name como no original
    if (item.ariaHidden !== null) bloco = /\baria-hidden="/.test(bloco) ? bloco.replace(/\baria-hidden="[^"]*"/, `aria-hidden="${item.ariaHidden}"`) : bloco.replace(/^(<li\b[^>]*?)>/, `$1 aria-hidden="${item.ariaHidden}">`);
    else bloco = bloco.replace(/\s*\baria-hidden="[^"]*"/, "");

    // as tags de abertura em ordem de documento: tags[0] é o próprio <li>, e
    // tags[k] casa com caixas[k-1] (querySelectorAll("*") não inclui a raiz)
    const tags = [];
    for (let i = 0; i < bloco.length; ) {
      if (bloco[i] !== "<") { i++; continue; }
      const m = /^<\/?([A-Za-z][\w.-]*)/.exec(bloco.slice(i, i + 40));
      if (!m) { i++; continue; }
      const f = fimDaTag(bloco, i);
      if (f < 0) break;
      if (bloco[i + 1] !== "/") tags.push({ ini: i, fim: f + 1, tag: m[1] });
      i = f + 1;
    }

    if (tags.length - 1 !== item.caixas.length) {
      // estrutura do molde ≠ estrutura do item: não dá para casar por índice,
      // e chutar largura seria pior que não mexer
      pulados++;
    } else {
      // de trás para frente, para os índices anteriores não se moverem
      for (let k = tags.length - 1; k >= 1; k--) {
        const cx = item.caixas[k - 1];
        const abre = bloco.slice(tags[k].ini, tags[k].fim);
        let nova = abre;
        // A classe reescrita é a da JANELA EM QUE SE MEDIU, e só ela. Sem
        // PREFIXO, mexe na classe base (sem prefixo de breakpoint); com
        // PREFIXO=2xl, mexe nas `2xl:` — porque o site emite uma variante do
        // bloco por breakpoint e a variante larga carrega TODAS as classes
        // prefixadas. Medido no framer-4: reescrever só a base deixou os 45
        // logos da variante 2xl com `2xl:w-30.5`, a largura do primeiro,
        // enquanto a base (que ninguém aplica ali) saía certinha.
        const P = PREFIXO ? `${PREFIXO}:` : "";
        const guarda = PREFIXO ? `${PREFIXO.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\:` : "(?<![:\\w-])";
        nova = nova.replace(new RegExp(`${guarda}w-\\[([\\d.]+)px\\]`, "g"), (todo, v) => (Math.abs(Number(v) - cx.w) > 0.3 ? `${P}w-[${cx.w}px]` : todo));
        nova = nova.replace(new RegExp(`${guarda}h-\\[([\\d.]+)px\\]`, "g"), (todo, v) => (Math.abs(Number(v) - cx.h) > 0.3 ? `${P}h-[${cx.h}px]` : todo));
        // classe de ESCALA (w-84, h-99): o molde de um item da galeria traz a
        // altura daquele item, e os irmãos têm outra. A escala do ditto é de
        // 4px por unidade — conferida contra o próprio molde antes de trocar,
        // para nunca reescrever em cima de uma escala diferente da suposta.
        nova = nova.replace(new RegExp(`${guarda}([wh])-(\\d+(?:\\.\\d+)?)(?![\\w.[-])`, "g"), (todo, eixo, v) => {
          const declarado = Number(v) * 4;
          const medido = eixo === "w" ? cx.w : cx.h;
          return Math.abs(declarado - medido) > 0.3 ? `${P}${eixo}-[${medido}px]` : todo;
        });
        // 🚨 caixa que NASCE colapsada: o invólucro do item do marquee só tem
        // `aspect-[3.39583/1]`, sem largura nem altura. Proporção sozinha não
        // dimensiona nada — o <li> é item de um flex com items-center, sua
        // altura vem do conteúdo, e o conteúdo é um filho absoluto. Resultado
        // medido no framer-4: 7 dos 8 logos com largura 0, e o oitavo só
        // aparece porque sobrou espaço. Com a altura medida, a proporção
        // devolve a largura (35.92 × 3.39583 = 122, o número do original).
        const temBase = (eixo) => new RegExp(`${guarda}${eixo}-[\\w\\[\\]./%-]+`).test(abre);
        if (new RegExp(`${guarda}aspect-\\[(?!auto_)`).test(abre) && !temBase("h") && !temBase("w") && cx.h > 0) {
          nova = nova.replace(/className="/, `className="${P}h-[${cx.h}px] `);
        }
        // ...e a PROPORÇÃO é do molde, não do item: com a altura vinda da
        // medição e a proporção herdada, os 45 logos saem todos com a largura
        // do primeiro (medido: um logo de 152px renderizado a 122.7).
        if (cx.h > 0 && cx.w > 0) {
          const razao = Math.round((cx.w / cx.h) * 100000) / 100000;
          nova = nova.replace(new RegExp(`${guarda}aspect-\\[(?!auto_)[\\d.]+\\/[\\d.]+\\]`, "g"), `${P}aspect-[${razao}/1]`);
        }
        if (nova !== abre) { bloco = bloco.slice(0, tags[k].ini) + nova + bloco.slice(tags[k].fim); ajustes++; }
      }
      // 5) a virtualização: o original mantém os 20 <li> no DOM e esconde com
      // visibility no primeiro filho quem está fora da janela corrente ±1.
      // Sem isto o clone mostra os 20 de uma vez e cada slide extra vira 5
      // elementos "só no clone" (medido: 17 slides = 85 elementos).
      if (item.visFilho === "hidden" && tags.length > 1) {
        const t1 = tags[1];
        const abre = bloco.slice(t1.ini, t1.fim);
        const nova = /\bstyle=\{\{/.test(abre)
          ? abre.replace(/\bstyle=\{\{/, 'style={{ visibility: "hidden", ')
          : abre.replace(/^(<[A-Za-z][\w.-]*)/, '$1 style={{ visibility: "hidden" }}');
        bloco = bloco.slice(0, t1.ini) + nova + bloco.slice(t1.fim);
        ocultos++;
      }
    }
    gerados.push(bloco);
  });

  const indent = "                              ";
  const novoInterior = "\n" + indent + gerados.join("\n" + indent) + "\n" + indent.slice(0, -2);
  let saidaJsx = jsx.slice(0, regTrilho.interiorIni) + novoInterior + jsx.slice(regTrilho.interiorFim);

  // 5) transform do trilho, se pedido
  if (t.transform === "auto" && med.transform && med.transform !== "none") {
    const m = /matrix\(([^)]+)\)/.exec(med.transform);
    if (m) {
      const v = m[1].split(",").map((x) => Math.round(Number(x.trim()) * 100) / 100);
      const alvoClasse = `transform-[matrix(${v.join(",")})]`;
      const reg2 = regiaoDoCid(saidaJsx, t.cidTrilho);
      const abertura = saidaJsx.slice(reg2.aberturaIni, reg2.aberturaFim);
      // troca a variante do breakpoint medido (lg:) e a base
      let nova = abertura
        .replace(/\blg:transform-\[matrix\([^\]]*\)\]/g, `lg:${alvoClasse}`)
        .replace(/(?<![:\w-])transform-\[matrix\([^\]]*\)\]/g, alvoClasse);
      if (!nova.includes(alvoClasse)) nova = nova.replace(/className="/, `className="${alvoClasse} `);
      saidaJsx = saidaJsx.slice(0, reg2.aberturaIni) + nova + saidaJsx.slice(reg2.aberturaFim);
      console.log(`  transform do trilho -> ${alvoClasse}`);
    }
  }

  if (ESCREVER) writeFileSync(arquivo, saidaJsx);
  console.log(
    `  ${ESCREVER ? "escrito" : "SIMULADO"}: ${lis.length} -> ${gerados.length} itens` +
      ` · ${ajustes} caixa(s) medida(s) reescrita(s) · ${ocultos} item(ns) oculto(s) como no original` +
      (declarados ? ` · ⚠️ ${declarados} imagem(ns) DECLARADA(S) sem baixar` : "") +
      (pulados ? ` · ⚠️ ${pulados} item(ns) com estrutura ≠ do molde: caixas NÃO ajustadas, DECLARADO` : "")
  );
  relatorio.push({ ...t, original: med.itens.length, cloneAntes: lis.length, cloneDepois: gerados.length, imagensDeclaradas: declarados, caixasReescritas: ajustes, itensOcultos: ocultos, itensSemCasarEstrutura: pulados, transform: med.transform, medicao: med });
}

writeFileSync(join(SAIDA, "trilhos.json"), JSON.stringify(relatorio, null, 1));
console.log(`\n-> ${join(SAIDA, "trilhos.json")}`);
await navegador.close();
