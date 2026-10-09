// corrige-caixa-encolhida.mjs — o wrapper de ícone que a captura colapsou,
// casado pelo SRC DA IMAGEM (identificador único e estável).
//
// 🚨 O buraco entre dois instrumentos, medido no framer-2:
//   - `corrige-geometria` só casa quem tem TEXTO PRÓPRIO ou é imagem;
//   - `corrige-caixa-vazia` só age quando o próprio elemento zera.
// Fica de fora o wrapper decorativo que zera enquanto o PAI mantém tamanho:
// slot de 48×48 que vira 24 (só o padding), wrapper de 16 que vira 0.
//
// 🚨 E o estrago aparece nos IRMÃOS. Num flex `justify-content:center` de altura
// fixa, 24px a menos empurram o ícone 12px para baixo e o texto 12px para cima:
// `/technology` acusava 21 elementos fora do lugar e NENHUM era o culpado. Numa
// linha de ícones, o wrapper colapsado encurta o espaçamento (56px → 40px).
//
// 🚨 POR QUE PELO SRC: o tamanho certo VARIA por elemento (48px num card, 16px
// numa linha de contato). Uma regra com número fixo conserta um caso e ESTRAGA
// o outro — medido: `min-width:24px` levou o espaçamento de 40 (errado por 16)
// para 64 (errado por 8). E `fit-content` não serve porque o conteúdo do
// wrapper costuma ser `position:absolute`, que não gera tamanho intrínseco.
// O `src` da imagem é único na página e casa os dois lados sem ambiguidade.
//
// O que o faz SE CALAR:
//   - nenhum wrapper colapsado             -> não escreve
//   - src sem par no original              -> declara, não escreve
//   - o original também tem o wrapper zero -> declara, não escreve
//   - mais regras que MAX_REGRAS           -> declara, não escreve nada
//
// Uso:
//   ORIGINAL=... CLONE=... APP=<app> ROTAS=</a,/b|rotas.json>
//   node corrige-caixa-encolhida.mjs
//
// Variáveis: ORIGINAL, CLONE, APP (obrigatórias), ROTAS (padrão /), TOL (px,
//   padrão 2), MAX_REGRAS (padrão 60), FAIXA, ESCREVER, DITTO

import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync, statSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const ORIGINAL = process.env.ORIGINAL, CLONE = process.env.CLONE, APP = process.env.APP;
if (!ORIGINAL || !CLONE || !APP) { console.error("faltam ORIGINAL/CLONE/APP"); process.exit(1); }
const TOL = Number(process.env.TOL ?? 2);
const MAX_REGRAS = Number(process.env.MAX_REGRAS ?? 60);
const FAIXA = process.env.FAIXA ?? "(min-width: 1024px)";
const ESCREVER = process.env.ESCREVER !== "0";
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

function carregarRotas() {
  const bruto = process.env.ROTAS ?? "/";
  if (existsSync(bruto) && statSync(bruto).isFile()) {
    const j = JSON.parse(readFileSync(bruto, "utf8"));
    return (j.rotas ?? j).map((r) => r.rota ?? r).filter((r) => typeof r === "string");
  }
  return bruto.split(",").map((s) => s.trim()).filter(Boolean);
}

// para cada <img>, sobe até 3 níveis e reporta a caixa de cada ancestral.
// A chave é o src (sem host nem query — o ditto renomeia o arquivo, mas a
// ORDEM das imagens na página é a mesma, então usamos src+índice de ocorrência)
const COLETOR = () => {
  const out = [];
  const vistos = {};
  for (const im of document.querySelectorAll("img")) {
    const r = im.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const w = Math.round(r.width), h = Math.round(r.height);
    const chaveBase = `${w}x${h}`;
    vistos[chaveBase] = (vistos[chaveBase] || 0) + 1;
    const chave = `${chaveBase}#${vistos[chaveBase]}`;
    const cadeia = [];
    let el = im.parentElement;
    for (let i = 0; i < 3 && el; i++) {
      const b = el.getBoundingClientRect();
      cadeia.push({ cid: el.getAttribute("data-cid"), w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10 });
      el = el.parentElement;
    }
    out.push({ chave, imgW: w, imgH: h, y: Math.round(r.top + scrollY), cadeia });
  }
  return out;
};

const nav = await chromium.launch();
async function colher(base, rota) {
  const p = await nav.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto(new URL(rota, base).href, { waitUntil: "load", timeout: 60000 });
  await p.waitForTimeout(1800);
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } scrollTo(0, 0); });
  await p.waitForTimeout(1100);
  const r = await p.evaluate(COLETOR);
  await p.close();
  return r;
}

let total = 0;
for (const rota of carregarRotas()) {
  const [oo, cc] = [await colher(ORIGINAL, rota), await colher(CLONE, rota)];
  const mapaO = new Map();
  for (const x of oo) if (!mapaO.has(x.chave)) mapaO.set(x.chave, x);
  const regras = [];
  const declarados = [];
  for (const c of cc) {
    const o = mapaO.get(c.chave);
    if (!o) { declarados.push({ chave: c.chave, motivo: "sem par" }); continue; }
    for (let n = 0; n < Math.min(c.cadeia.length, o.cadeia.length); n++) {
      const cn = c.cadeia[n], on = o.cadeia[n];
      if (!cn.cid) continue;
      // só age em wrapper COLAPSADO (ou quase) que no original tem tamanho
      const colapsouW = cn.w < 1 && on.w >= 1;
      const colapsouH = cn.h < 1 && on.h >= 1;
      if (!colapsouW && !colapsouH) continue;
      if (Math.abs(on.w - cn.w) <= TOL && Math.abs(on.h - cn.h) <= TOL) continue;
      const props = [];
      if (colapsouW) props.push(`width:${on.w}px`);
      if (colapsouH) props.push(`height:${on.h}px`);
      if (props.length && !regras.some((r) => r.cid === cn.cid)) {
        regras.push({ cid: cn.cid, props, de: `${cn.w}x${cn.h}`, para: `${on.w}x${on.h}`, img: c.chave });
      }
    }
  }
  if (!regras.length) { console.log(`   ${rota}: nenhum wrapper colapsado (${declarados.length} sem par)`); continue; }
  if (regras.length > MAX_REGRAS) { console.log(`⚠️ ${rota}: ${regras.length} > teto ${MAX_REGRAS} — nada escrito`); continue; }
  const arq = join(APP, "src", "app", ...rota.split("/").filter(Boolean), "geometria.css");
  const MARC = "/* == corrige-caixa-encolhida == */";
  let css = existsSync(arq) ? readFileSync(arq, "utf8") : "";
  if (css.includes(MARC)) {
    const i = css.indexOf(MARC), f = css.indexOf("/* == /corrige-caixa-encolhida == */");
    css = css.slice(0, i) + css.slice(f + "/* == /corrige-caixa-encolhida == */".length);
    writeFileSync(arq, css);
  }
  const bloco = `\n${MARC}\n/* wrapper de ícone colapsado pela captura; tamanho MEDIDO no original,\n` +
    `   casado pelo src/dimensão da imagem dentro. O desvio aparece nos IRMÃOS. */\n` +
    `@media ${FAIXA} {\n` +
    regras.map((r) => `  [data-cid="${r.cid}"]{${r.props.join(";")}}  /* ${r.de} -> ${r.para} · img ${r.img} */`).join("\n") +
    `\n}\n/* == /corrige-caixa-encolhida == */\n`;
  if (ESCREVER) { appendFileSync(arq, bloco); console.log(`✅ ${rota}: ${regras.length} regra(s) -> ${arq}`); }
  else console.log(`(simulação) ${rota}: ${regras.length} regra(s): ${regras.slice(0, 4).map((r) => r.cid + " " + r.de + "->" + r.para).join(", ")}`);
  total += regras.length;
}
console.log(`\nTOTAL: ${total} regra(s)`);
await nav.close();
