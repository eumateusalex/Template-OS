// corrige-line-height-razao.mjs — o ditto congela line-height SEM UNIDADE
// em px arredondado, e o erro acumula descendo a página.
//
// 🚨 Classe de defeito medida no clone do framer-3, onde o
// `corrige-tipografia.mjs` recusa escrever em 69 de 83 elementos ("ainda
// fluida: valor fixo seria chute") — e está certo em recusar, porque a
// resposta não é valor fixo NENHUM.
//
// O que o original faz: `line-height: 1.4` (sem unidade). O navegador resolve
// para 1.4 × font-size em cada largura. O ditto captura o VALOR RESOLVIDO e
// escreve px, arredondado:
//
//   largura   font-size   original (1.4)   clone
//     1280       36           50.4px       50px
//     1440       32           44.8px       50px   <- e ainda erra o breakpoint
//     1920       32           44.8px       45px
//      375       28           39.2px       39px
//
// Meio pixel por linha não se vê num elemento. Somados ao longo de um artigo,
// viram deriva CRESCENTE: medido -4px no começo e -7px no fim do mesmo post,
// e 34px no FAQ da home.
//
// 🚨 POR QUE ESTE INSTRUMENTO NÃO USA @media: a razão vale em TODA largura.
// Escrever px por faixa reproduziria o efeito só nos pontos medidos e erraria
// entre eles. Devolver a razão é devolver a REGRA, não o sintoma — é a regra 6
// da skill ("ganha o que devolve a ESTRUTURA").
//
// O CONTROLE QUE AUTORIZA ESCREVER: a razão lh/fs medida no ORIGINAL tem que
// ser a MESMA em todas as larguras. Um elemento cuja razão varia não tem
// line-height sem unidade — pode ser px fixo com breakpoints — e sai declarado.
//
// O que o faz SE CALAR:
//   - razão não constante entre as larguras   -> declara, não escreve
//   - font-size zero ou ausente em alguma     -> declara, não escreve
//   - o clone já bate com o original          -> não escreve (nada a fazer)
//   - elemento sem data-cid                   -> declara, não escreve
//   - mais regras que MAX_REGRAS na rota      -> declara, não escreve nada
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8367 APP=<app> \
//   ROTAS=<med>/rotas.json SAIDA=<med>/lh-razao node corrige-line-height-razao.mjs
//
// Variáveis:
//   LARGURAS    larguras a medir (padrão 375,1280,1440,1920)
//   TOL_RAZAO   folga na constância da razão (padrão 0.01)
//   TOL_PX      diferença mínima em px para valer conserto (padrão 0.2)
//   MAX_REGRAS  teto por rota (padrão 400)
//   ESCREVER    0 simula

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
const LARGURAS = (process.env.LARGURAS ?? "375,1280,1440,1920").split(",").map(Number).filter(Boolean);
const TOL_RAZAO = Number(process.env.TOL_RAZAO ?? 0.01);
const TOL_PX = Number(process.env.TOL_PX ?? 0.2);
const MAX_REGRAS = Number(process.env.MAX_REGRAS ?? 400);
const ESCREVER = process.env.ESCREVER !== "0";
const SAIDA = resolve(process.env.SAIDA ?? "./lh-razao");
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
mkdirSync(SAIDA, { recursive: true });

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

const decodificarSegmento = (s) => { try { return decodeURIComponent(s); } catch { return s; } };

function rotas() {
  const arq = process.env.ROTAS;
  if (arq && existsSync(arq)) {
    const j = JSON.parse(readFileSync(arq, "utf8"));
    return (j.rotas ?? j).filter((x) => x.status === 200 || x.status == null).map((x) => x.rota ?? x);
  }
  if (arq) return arq.split(",").map((s) => s.trim()).filter(Boolean);
  return [process.env.ROTA ?? "/"];
}

// Colhe, dos dois lados, todo elemento com TEXTO PRÓPRIO: chave estável
// (tag + texto normalizado) e os valores resolvidos.
const COLHER = () => {
  const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();
  const saida = [];
  for (const el of document.querySelectorAll("body *")) {
    let proprio = "";
    for (const n of el.childNodes) if (n.nodeType === 3) proprio += n.nodeValue;
    proprio = norm(proprio);
    if (!proprio) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const fs = parseFloat(cs.fontSize);
    const lh = parseFloat(cs.lineHeight);
    if (!isFinite(fs) || !isFinite(lh) || fs <= 0) continue;
    saida.push({
      chave: el.tagName.toLowerCase() + "|" + proprio.slice(0, 60),
      cid: el.getAttribute("data-cid") || null,
      fs: Math.round(fs * 100) / 100,
      lh: Math.round(lh * 100) / 100,
    });
  }
  return saida;
};

async function medir(nav, url, largura) {
  const ctx = await nav.newContext({ viewport: { width: largura, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const r = await page.evaluate(COLHER);
  await ctx.close();
  return r;
}

const nav = await chromium.launch();
const relatorio = [];

for (const rota of rotas()) {
  console.log(`\n=== ${rota}`);
  const uo = new URL(rota, ORIGINAL).href;
  const uc = new URL(rota, CLONE).href;

  const oPorL = {}, cPorL = {};
  for (const L of LARGURAS) {
    oPorL[L] = await medir(nav, uo, L);
    cPorL[L] = await medir(nav, uc, L);
  }

  // 🚨 GÊMEOS POR BREAKPOINT: o ditto emite o MESMO conteúdo duas vezes (um
  // por faixa, com o outro em display:none). Descartar chave repetida — que é
  // o reflexo seguro — deixava o FAQ inteiro sem conserto no framer-3: dois <h5>
  // com o mesmo texto (n2339 e n2475), cada um vivo numa largura.
  // A saída correta: agrupar por chave, e só escrever quando TODOS os
  // candidatos do ORIGINAL concordam na razão. Aí a regra vale para todos os
  // cids do clone daquela chave — inclusive o que já está certo, onde ela é
  // inócua.
  const idxLista = (lista) => {
    const m = new Map();
    for (const it of lista) {
      if (!m.has(it.chave)) m.set(it.chave, []);
      m.get(it.chave).push(it);
    }
    return m;
  };

  const idxPorL = {};
  for (const L of LARGURAS) idxPorL[L] = { o: idxLista(oPorL[L]), c: idxLista(cPorL[L]) };

  const regras = [];
  const recusas = [];
  const chaves = new Set();
  for (const L of LARGURAS) for (const k of idxPorL[L].c.keys()) chaves.add(k);

  for (const chave of chaves) {
    const razoes = [];
    let divergeEmAlguma = false;
    let faltou = false;
    const cidsClone = new Set();

    for (const L of LARGURAS) {
      const os = idxPorL[L].o.get(chave) || [];
      const cs = idxPorL[L].c.get(chave) || [];
      if (!os.length || !cs.length) { faltou = true; break; }
      // no original, todos os candidatos precisam concordar na razão
      const rs = os.map((o) => o.lh / o.fs);
      const m0 = rs.reduce((s, x) => s + x, 0) / rs.length;
      if (!rs.every((x) => Math.abs(x - m0) <= TOL_RAZAO)) { faltou = true; break; }
      razoes.push(m0);
      for (const c of cs) {
        if (c.cid) cidsClone.add(c.cid);
        if (os.some((o) => Math.abs(o.lh - c.lh) > TOL_PX)) divergeEmAlguma = true;
      }
    }
    if (faltou) continue;                 // sem par ou original discordante: silencia
    if (!divergeEmAlguma) continue;       // já bate: nada a fazer
    if (!cidsClone.size) { recusas.push(`${chave.slice(0, 40)}: sem data-cid`); continue; }

    const media = razoes.reduce((s, x) => s + x, 0) / razoes.length;
    if (!razoes.every((x) => Math.abs(x - media) <= TOL_RAZAO)) {
      recusas.push(`${[...cidsClone].join("/")}: razão lh/fs NÃO é constante (${razoes.map((x) => x.toFixed(3)).join("/")}) — não é line-height sem unidade`);
      continue;
    }
    const razao = Math.round(media * 1000) / 1000;
    // ⚠️ `[data-cid=X][data-cid]` (especificidade dobrada) porque o
    // corrige-tipografia.mjs escreve line-height com esse mesmo seletor: com
    // !important nos dois, quem decide é a especificidade, e um seletor
    // simples PERDE em silêncio. Duas camadas não deviam disputar a mesma
    // propriedade, mas enquanto disputarem, esta precisa empatar no peso.
    const sel = [...cidsClone].map((c) => `[data-cid="${c}"][data-cid]`).join(",");
    regras.push(`  ${sel}{line-height:${razao} !important}  /* medido: razão constante em ${LARGURAS.join("/")}px${cidsClone.size > 1 ? " · gêmeos por breakpoint" : ""} */`);
  }

  const dec = decodificarSegmento(rota);
  const dir = dec === "/" ? join(APP, "src/app") : join(APP, "src/app", dec.replace(/^\//, ""));
  const arq = join(dir, "lh-razao.css");

  if (!regras.length) {
    console.log("   ✅ nada a corrigir");
  } else if (regras.length > MAX_REGRAS) {
    console.log(`   ⛔ ${regras.length} acima do teto ${MAX_REGRAS} — não escrevi nada`);
  } else if (!existsSync(dir)) {
    console.log(`   ⛔ pasta da rota não existe: ${dir}`);
  } else if (ESCREVER) {
    // 🚨 O ARQUIVO ACUMULA, NUNCA SE REESCREVE DO ZERO.
    // Um elemento já corrigido para de divergir e, por isso, para de ser
    // proposto. Reescrever o arquivo só com as propostas da rodada atual
    // APAGARIA justamente as regras que funcionaram — e elas voltariam a
    // divergir na rodada seguinte, num vaivém sem fim. (É a mesma lição que o
    // corrige-geometria.mjs já carrega.)
    const antigas = new Map();
    if (existsSync(arq)) {
      for (const linha of readFileSync(arq, "utf8").split("\n")) {
        const m = linha.match(/^\s*(\[data-cid=[^{]*)\{/);
        if (m) antigas.set(m[1].trim(), linha);
      }
    }
    for (const nova of regras) {
      const m = nova.match(/^\s*(\[data-cid=[^{]*)\{/);
      if (m) antigas.set(m[1].trim(), nova);   // a rodada atual ganha
    }
    const todas = [...antigas.values()];
    console.log(`   (acumulado: ${regras.length} desta rodada + ${todas.length - regras.length} preservada(s))`);
    writeFileSync(arq, [
      "/* lh-razao.css — line-height SEM UNIDADE que a captura congelou em px.",
      "   O original resolve razão × font-size em cada largura; o ditto gravou",
      "   o valor resolvido, arredondado. Meio pixel por linha vira deriva",
      "   crescente ao longo da página.",
      `   Razão MEDIDA no original em ${LARGURAS.join("/")}px, e só escrita quando`,
      "   é a MESMA em todas. Sem @media de propósito: a razão vale em toda",
      "   largura. Por scripts/corrige-line-height-razao.mjs.",
      `   Origem: ${uo} */`,
      ...todas,
    ].join("\n") + "\n");
    console.log(`   ✅ ${todas.length} regra(s) no arquivo -> ${arq}`);
  }
  for (const r of recusas.slice(0, 5)) console.log(`   ⚠️ ${r}`);
  if (recusas.length > 5) console.log(`   ⚠️ ... e mais ${recusas.length - 5}`);
  relatorio.push({ rota, regras: regras.length, recusas });
}

await nav.close();
writeFileSync(join(SAIDA, "lh-razao.json"), JSON.stringify({ LARGURAS, relatorio }, null, 2));
console.log("\n" + "=".repeat(70));
console.log(`TOTAL: ${relatorio.reduce((s, r) => s + r.regras, 0)} regra(s) · ${relatorio.reduce((s, r) => s + r.recusas.length, 0)} declarada(s)`);
console.log("🚨 ligar lh-razao.css (liga-css.mjs ou entrega-inline.mjs) e rebuildar — escrever não liga.");
