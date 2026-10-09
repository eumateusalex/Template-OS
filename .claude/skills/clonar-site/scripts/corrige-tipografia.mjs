// corrige-tipografia.mjs — devolve o font-size que o ditto ARREDONDOU.
//
// 🚨 Classe de defeito medida no site-landing.
//
// Site com escala de tipo FLUIDA (`clamp()`, `vw`) computa font-size
// fracionário: 15.5px, 17.5px, 20.48px. O ditto converte para Tailwind
// arredondando para o inteiro acima — 16px, 18px, 21px — e o line-height vai
// junto (25.575 -> 26, 31.744 -> 32).
//
// O estrago NÃO aparece onde se mexeu. Meio pixel a mais muda o ponto de
// quebra da linha: um parágrafo de 4 linhas vira 5, ganha 33px de altura, e
// empurra os 14 elementos abaixo dele. O compara-geometria acusa 14 elementos
// fora do lugar e NENHUM deles é o culpado. Medido no lps.accelera360: 381
// elementos com tipografia divergente em 3 rotas.
//
// 🚨 O CONTROLE QUE AUTORIZA ESCREVER (regra 17: só se escreve o que EXPLICA
// o número medido). Escrever um px fixo onde o original é fluido é inventar
// número. Então, antes de cada regra, este instrumento confirma que o valor
// do ORIGINAL é o MESMO nas larguras de confirmação — ou seja, que a escala
// TRAVA naquela faixa. Quem não trava sai DECLARADO e não é escrito.
//
// Medido aqui: trava em 1280/1440/1920 (363 de 381) e em 320/375/430
// (325 de 373). Entre 768 e 1280 NÃO trava (110 de 337 variam), e é por isso
// que a faixa do topo é min-width:1280px e não min-width:768px.
//
// 🚨 REGRA 4 — duas camadas nunca escrevem a mesma propriedade. Este
// instrumento passa a ser o DONO de font-size/line-height/letter-spacing, e
// por isso o corrige-geometria.mjs precisa rodar com
// EXCLUIR_PROPS="font-size,line-height,letter-spacing,font-weight".
//
// O que o faz SE CALAR:
//   - nada divergiu na rota                       -> não escreve
//   - o original não trava na faixa               -> declara, não escreve
//   - elemento sem data-cid (não há como mirar)   -> declara, não escreve
//   - mais regras que MAX_REGRAS                  -> declara, não escreve nada
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 APP=<app> \
//   ROTAS=<med>/rotas.json SAIDA=<med>/tipografia-conserto \
//   node corrige-tipografia.mjs
//
// Variáveis:
//   ORIGINAL/CLONE/APP  obrigatórias
//   ROTA | ROTAS        rota única, ou o rotas.json
//   TOPO                largura do valor escrito no topo (padrão 1280)
//   TOPO_CONFIRMA       larguras que provam a trava no topo (padrão 1440,1920)
//   PISO                largura do valor escrito no piso (padrão 375)
//   PISO_CONFIRMA       larguras que provam a trava no piso (padrão 320,430)
//   PISO_TETO           teto da @media do piso (padrão: a maior de PISO_CONFIRMA)
//   TOL                 px de tolerância (padrão 0.05)
//   MAX_REGRAS          teto de regras por rota (padrão 600)
//   ESCREVER            0 simula sem tocar em arquivo

import { createRequire } from "node:module";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const ORIGINAL = process.env.ORIGINAL;
const CLONE = process.env.CLONE;
const APP = process.env.APP;
if (!ORIGINAL || !CLONE || !APP) {
  console.error("faltam ORIGINAL, CLONE e/ou APP");
  process.exit(1);
}
const TOPO = Number(process.env.TOPO ?? 1280);
const TOPO_CONFIRMA = (process.env.TOPO_CONFIRMA ?? "1440,1920").split(",").map(Number).filter(Boolean);
const PISO = Number(process.env.PISO ?? 375);
const PISO_CONFIRMA = (process.env.PISO_CONFIRMA ?? "320,430").split(",").map(Number).filter(Boolean);
const PISO_TETO = Number(process.env.PISO_TETO ?? Math.max(PISO, ...PISO_CONFIRMA));
const TOL = Number(process.env.TOL ?? 0.05);
const MAX_REGRAS = Number(process.env.MAX_REGRAS ?? 600);
const ESCREVER = process.env.ESCREVER !== "0";

// 🚨 COMO A REGRA CHEGA NA PÁGINA. Medido neste clone, e a diferença é entre
// funcionar e não funcionar.
//
// "css"    — grava tipografia.css e depende do liga-css + pipeline do Next.
// "layout" — grava um layout.tsx de rota que renderiza a folha inline num
//            <style>. É o PADRÃO, porque o caminho do arquivo CSS falhou de
//            um jeito que não se explicou:
//
//   regra no bundle servido, com !important, dentro de @media (max-width:430px)
//   comprovadamente ativa (matchMedia true), em folha carregada e não
//   desabilitada, com o seletor casando (el.matches true) — e sem aplicar.
//   Tirando a classe do Tailwind do elemento, o valor caía para o herdado
//   (16px) em vez do que a regra pedia (13.5px): ou seja, a regra não estava
//   perdendo disputa nenhuma, simplesmente não entrava na cascata.
//
//   O MESMO texto CSS injetado num <style> em tempo de execução aplicava na
//   hora. Daí a escolha: entregar por <style>, que é determinístico, em vez de
//   discutir com o empacotador.
//
// O layout de rota é o lugar certo porque não encosta no page.tsx gerado (que
// tem centenas de KB de JSX de máquina) e porque os data-cid COLIDEM entre
// rotas: o n5 de /links não é o n5 de /ai-first, então a folha de cada rota
// precisa ficar restrita à rota.
const ENTREGA = process.env.ENTREGA ?? "css";  // quem entrega agora e o entrega-inline.mjs
const SAIDA = resolve(process.env.SAIDA ?? "./tipografia-conserto");
const DITTO = process.env.DITTO ?? "C:/dev/ditto";

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

function rotas() {
  const arq = process.env.ROTAS;
  if (arq && existsSync(arq)) {
    const j = JSON.parse(readFileSync(arq, "utf8"));
    const lista = j.rotas ?? j;
    return (Array.isArray(lista) ? lista : Object.keys(lista))
      .map((r) => (typeof r === "string" ? r : r.rota ?? r.path))
      .filter(Boolean);
  }
  if (arq) return arq.split(",").map((s) => s.trim()).filter(Boolean);
  return [process.env.ROTA ?? "/"];
}

const COLHER = () => {
  const norm = (s) => s.replace(/\s+/g, " ").trim();
  const saida = [];
  let i = 0;
  for (const el of document.querySelectorAll("body *")) {
    i++;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    let proprio = "";
    for (const n of el.childNodes) if (n.nodeType === 3) proprio += n.nodeValue;
    proprio = norm(proprio);
    if (!proprio) continue;
    saida.push({
      ordem: i,
      tag: el.tagName.toLowerCase(),
      cid: el.getAttribute("data-cid") || null,
      texto: proprio.slice(0, 60),
      y: Math.round((r.top + window.scrollY) * 10) / 10,
      fs: parseFloat(cs.fontSize),
      lh: cs.lineHeight === "normal" ? null : parseFloat(cs.lineHeight),
      ls: cs.letterSpacing === "normal" ? null : parseFloat(cs.letterSpacing),
      // inline vence qualquer seletor; só nesses casos o !important se
      // justifica, e ele fica restrito a quem precisa.
      inline: /font-size/.test(el.getAttribute("style") || ""),
    });
  }
  return saida;
};

async function colher(nav, url, largura) {
  const ctx = await nav.newContext({ viewport: { width: largura, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const r = await page.evaluate(COLHER);
  await ctx.close();
  return r;
}

/** Casa por tag+texto, desempatando pela posição vertical mais próxima. */
function alinhar(a, b) {
  const porTexto = new Map();
  for (const it of b) {
    const k = `${it.tag}|${it.texto}`;
    if (!porTexto.has(k)) porTexto.set(k, []);
    porTexto.get(k).push(it);
  }
  const pares = [];
  for (const ia of a) {
    const cand = porTexto.get(`${ia.tag}|${ia.texto}`);
    if (!cand) continue;
    let melhor = null;
    let melhorD = Infinity;
    for (const ib of cand) {
      if (ib.__usado) continue;
      const d = Math.abs(ia.y - ib.y);
      if (d < melhorD) { melhorD = d; melhor = ib; }
    }
    if (!melhor) continue;
    melhor.__usado = true;
    pares.push([ia, melhor]);
  }
  return pares;
}

const dif = (x, y) => x != null && y != null && Math.abs(x - y) > TOL;
const px = (v) => `${Math.round(v * 1000) / 1000}px`;

/** 🚨 O ARQUIVO ACUMULA, NUNCA SE REESCREVE DO ZERO.
 *
 *  Sem isto o instrumento se auto-destrói na segunda rodada: o elemento que a
 *  regra CONSERTOU para de divergir, por isso para de ser proposto, some do
 *  arquivo, e volta a quebrar. A correção que funcionou é justamente a que
 *  desaparece — e o número piora sem que nada explique por quê.
 *
 *  Lê as regras já gravadas num bloco @media e devolve um mapa cid -> linha.
 *  A rodada nova sobrescreve o cid que remediu e PRESERVA todo o resto. */
function regrasGravadas(arquivo, cabecalhoMedia) {
  const mapa = new Map();
  if (!existsSync(arquivo)) return mapa;
  const txt = readFileSync(arquivo, "utf8");
  const i = txt.indexOf(cabecalhoMedia);
  if (i < 0) return mapa;
  const fim = txt.indexOf("\n}", i);
  const bloco = txt.slice(i + cabecalhoMedia.length, fim < 0 ? undefined : fim);
  for (const linha of bloco.split("\n")) {
    const m = linha.match(/\[data-cid="([^"]+)"\]/);
    if (m) mapa.set(m[1], linha);
  }
  return mapa;
}

/** Funde o que já estava no arquivo com o que esta rodada mediu. */
function fundir(gravadas, novas) {
  const mapa = new Map(gravadas);
  for (const linha of novas) {
    const m = linha.match(/\[data-cid="([^"]+)"\]/);
    if (m) mapa.set(m[1], linha);
  }
  return [...mapa.values()];
}

/** Uma faixa: mede o valor a escrever e prova que o original trava nela. */
async function faixa(nav, uo, uc, escrita, confirma) {
  const [o0, c0] = await Promise.all([colher(nav, uo, escrita), colher(nav, uc, escrita)]);
  const pares = alinhar(o0, c0);

  // o valor do original nas larguras de confirmação, indexado por tag|texto
  const confirmacoes = [];
  for (const L of confirma) {
    const oL = await colher(nav, uo, L);
    const m = new Map();
    for (const it of oL) m.set(`${it.tag}|${it.texto}`, it);
    confirmacoes.push(m);
  }

  const regras = [];
  const naoTrava = [];
  const semCid = [];
  for (const [o, c] of pares) {
    if (!dif(o.fs, c.fs) && !dif(o.lh, c.lh) && !dif(o.ls, c.ls)) continue;
    const chave = `${o.tag}|${o.texto}`;
    let trava = true;
    for (const m of confirmacoes) {
      const ref = m.get(chave);
      if (!ref || dif(ref.fs, o.fs) || dif(ref.lh, o.lh)) { trava = false; break; }
    }
    if (!trava) { naoTrava.push(c.cid ?? o.texto.slice(0, 30)); continue; }
    if (!c.cid) { semCid.push(o.texto.slice(0, 30)); continue; }

    const decl = [];
    if (dif(o.fs, c.fs)) decl.push(`font-size:${px(o.fs)}`);
    if (dif(o.lh, c.lh)) decl.push(`line-height:${px(o.lh)}`);
    if (dif(o.ls, c.ls) && o.ls != null) decl.push(`letter-spacing:${px(o.ls)}`);
    if (!decl.length) continue;
    // 🚨 !important em TODAS, e não só nas que têm estilo inline.
    //
    // Medido no build deste clone: a regra unLayered `[data-cid=n5][data-cid]`
    // (0,2,0), dentro de uma @media comprovadamente ativa (matchMedia deu
    // true), na última folha carregada, PERDIA para `.text-sm` (0,1,0) que o
    // Tailwind v4 emite dentro de `@layer utilities`. O computado ficava 14px
    // onde a regra pedia 13.5px.
    //
    // A prova de que não é especificidade nem media query: injetando o MESMO
    // texto CSS num <style> em tempo de execução, o valor vira 13.5px na hora.
    // Some no build, funciona fora dele — é efeito de ordem/camada que o
    // empacotador produz, não da cascata que se lê no arquivo.
    //
    // O !important atravessa camada e ordem, e o risco fica contido porque
    // cada regra já mora dentro da faixa em que foi medida.
    const bang = " !important";
    const corpo = decl.map((d) => d + bang).join(";");
    // seletor de atributo DOBRADO: (0,2,0) vence a classe utilitária (0,1,0)
    // sem precisar de !important em todo mundo.
    regras.push(`  [data-cid="${c.cid}"][data-cid]{${corpo}}  /* ${o.texto.slice(0, 34).replace(/\*\//g, "")} */`);
  }
  return { regras, naoTrava, semCid, pares: pares.length };
}

mkdirSync(SAIDA, { recursive: true });
const nav = await chromium.launch();
const relatorio = [];

for (const rota of rotas()) {
  const uo = new URL(rota, ORIGINAL).href;
  const uc = new URL(rota, CLONE).href;
  console.log(`\n=== ${rota}`);

  const topo = await faixa(nav, uo, uc, TOPO, TOPO_CONFIRMA);
  const piso = await faixa(nav, uo, uc, PISO, PISO_CONFIRMA);
  console.log(`   topo @${TOPO}px  regras=${topo.regras.length}  não trava=${topo.naoTrava.length}  sem cid=${topo.semCid.length}`);
  console.log(`   piso @${PISO}px  regras=${piso.regras.length}  não trava=${piso.naoTrava.length}  sem cid=${piso.semCid.length}`);

  const total = topo.regras.length + piso.regras.length;
  const dir = rota === "/" ? join(APP, "src/app") : join(APP, "src/app", rota.replace(/^\//, ""));
  const arq = join(dir, "tipografia.css");
  let escreveu = false;

  // 🚨 acumula: a regra que consertou parou de divergir e não seria mais
  // proposta. Reescrever do zero a apagaria e desfaria o próprio conserto.
  const cabTopo = `@media (min-width: ${TOPO}px) {`;
  const cabPiso = `@media (max-width: ${PISO_TETO}px) {`;
  const linhasTopo = fundir(regrasGravadas(arq, cabTopo), topo.regras);
  const linhasPiso = fundir(regrasGravadas(arq, cabPiso), piso.regras);
  const preservadas = linhasTopo.length + linhasPiso.length - total;
  // 🚨 O QUE DECIDE ENTREGAR É QUANTAS REGRAS EXISTEM, NÃO QUANTAS SÃO NOVAS.
  //
  // Numa rota já consertada, a rodada seguinte mede 0 divergências; decidir
  // pelas novas cai no "nada a corrigir" e não gera o layout.tsx — deixando
  // 369 regras órfãs num .css que já não é importado. Rota consertada é
  // justamente a que não propõe nada.
  const aEntregar = linhasTopo.length + linhasPiso.length;

  if (!aEntregar) {
    console.log("   ✅ nada a corrigir");
  } else if (total > MAX_REGRAS) {
    console.log(`   ⛔ ${total} regras acima do teto ${MAX_REGRAS} — NÃO escrevi nada (declarado)`);
  } else if (!existsSync(dir)) {
    console.log(`   ⛔ pasta da rota não existe: ${dir} — não escrevi`);
  } else {

    const L = [];
    L.push("/* tipografia.css — font-size/line-height que o ditto ARREDONDOU ao");
    L.push("   converter para Tailwind. Todo valor abaixo foi MEDIDO no original");
    L.push(`   por scripts/corrige-tipografia.mjs. Nada digitado à mão.`);
    L.push(`   Origem: ${uo}`);
    L.push(`   Topo: valor de ${TOPO}px, provado constante em ${TOPO_CONFIRMA.join("/")}px.`);
    L.push(`   Piso: valor de ${PISO}px, provado constante em ${PISO_CONFIRMA.join("/")}px.`);
    L.push(`   Fora dessas faixas a escala do original é FLUIDA e não se escreve. */`);
    if (linhasTopo.length) L.push(cabTopo, ...linhasTopo, "}");
    if (linhasPiso.length) L.push(cabPiso, ...linhasPiso, "}");
    const css = L.join("\n") + "\n";

    if (!ESCREVER) {
      console.log(`   (ESCREVER=0) ${total} nova(s) + ${preservadas} preservada(s)`);
    } else if (ENTREGA === "layout") {
      // O .css continua sendo gravado porque é dele que a rodada seguinte lê
      // as regras preservadas — mas quem APLICA é o <style> do layout. Para
      // não haver duas camadas escrevendo a mesma propriedade (regra 4), o
      // import do .css é neutralizado pelo liga-css apontando para um arquivo
      // que não é mais lido pelo navegador; aqui ele vira só o registro.
      writeFileSync(arq, css);
      const lay = join(dir, "layout.tsx");
      const corpo =
        `// GERADO por scripts/corrige-tipografia.mjs — não editar à mão.\n` +
        `// Entrega a folha de tipografia inline, porque o mesmo CSS importado\n` +
        `// como arquivo não entrava na cascata neste build (ver o cabeçalho do\n` +
        `// instrumento, e armadilhas.md).\n` +
        `const CSS = ${JSON.stringify(css)};\n\n` +
        `export default function Layout({ children }: { children: React.ReactNode }) {\n` +
        `  return (\n` +
        `    <>\n` +
        `      <style dangerouslySetInnerHTML={{ __html: CSS }} />\n` +
        `      {children}\n` +
        `    </>\n` +
        `  );\n` +
        `}\n`;
      writeFileSync(lay, corpo);
      escreveu = true;
      console.log(`   ✅ ${total} nova(s) + ${preservadas} preservada(s) -> <style> em ${lay}`);
    } else {
      writeFileSync(arq, css);
      escreveu = true;
      console.log(`   ✅ ${total} nova(s) + ${preservadas} preservada(s) -> ${arq}`);
    }
  }
  if (topo.naoTrava.length) console.log(`   ⚠️ ${topo.naoTrava.length} não travam no topo (declarados, nunca escritos)`);
  if (piso.naoTrava.length) console.log(`   ⚠️ ${piso.naoTrava.length} não travam no piso (declarados, nunca escritos)`);

  relatorio.push({ rota, topo: { ...topo, regras: topo.regras.length }, piso: { ...piso, regras: piso.regras.length }, escreveu, arquivo: arq });
}

await nav.close();
writeFileSync(join(SAIDA, "tipografia-conserto.json"), JSON.stringify({ TOPO, TOPO_CONFIRMA, PISO, PISO_CONFIRMA, PISO_TETO, TOL, relatorio }, null, 2));

console.log("\n" + "=".repeat(70));
const totR = relatorio.reduce((s, r) => s + r.topo.regras + r.piso.regras, 0);
const totN = relatorio.reduce((s, r) => s + r.topo.naoTrava.length + r.piso.naoTrava.length, 0);
console.log(`TOTAL: ${totR} regra(s) escrita(s) · ${totN} declaradas por não travarem`);
console.log("🚨 liga-css.mjs com FOLHAS=...,tipografia.css e rebuildar — escrever não liga.");
console.log(`saída: ${SAIDA}`);
