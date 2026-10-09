// gera-carrossel.mjs — devolve ao clone o movimento AUTÔNOMO (marquee/ticker).
//
// Entra: o `carrossel.json` do `mede-carrossel.mjs`, medido no ORIGINAL.
// Sai:   `carrossel.css` na pasta da rota do clone, mais o import.
//
// 🚨 O que vem de onde, e por quê:
//   · a VELOCIDADE (px/s) vem da medição no ORIGINAL — é o que define o ritmo;
//   · a DISTÂNCIA do laço vem da geometria do CLONE — é o que faz emendar sem
//     salto. Copiar a distância do original emendaria errado se o clone tiver
//     um item a menos (e ele tem: a captura pega o carrossel num instante).
// Nenhum dos dois é digitado.
//
// Marquee com clone de laço (`temClonesDeLoop`) duplica o conteúdo para emendar:
// o ciclo é METADE do conteúdo total. Deslocar por essa metade e repetir dá um
// laço contínuo sem salto visível.
//
// 🚨 O guard (o que faz este instrumento se calar): se nenhum trilho do
// original casar com elemento do clone, ele DECLARA e não escreve nada. Nunca
// inventa trilho, nunca chuta distância.
//
// ⚠️ `prefers-reduced-motion` é obrigatório: quem desativou movimento recebe o
// trilho PARADO no início, nunca a página sem conteúdo.
//
// Uso:
//   MED=<med>/carrossel/<x>/carrossel.json CLONE=http://127.0.0.1:8081 \
//   APP=<app> ROTA=/servicos node gera-carrossel.mjs
//
// Variáveis:
//   MED       carrossel.json medido no ORIGINAL (obrigatória)
//   CLONE     URL base do clone servido (obrigatória)
//   APP       raiz do app do clone (obrigatória)
//   ROTA      rota a tratar (padrão: /)
//   ESCREVER  0 = simula, não toca em arquivo (padrão: 1)
//   DITTO     raiz do ditto (padrão: C:/dev/ditto)

import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const MED = process.env.MED;
const CLONE = process.env.CLONE;
const APP = process.env.APP;
if (!MED || !CLONE || !APP) {
  console.error("faltam MED, CLONE e/ou APP");
  process.exit(1);
}
const ROTA = process.env.ROTA ?? "/";
const ESCREVER = process.env.ESCREVER !== "0";
const DITTO = process.env.DITTO ?? "C:/dev/ditto";

const vel0 = (t) => t.velocidadeMediaPxPorS || 1;

const medido = JSON.parse(readFileSync(MED, "utf8").replace(/^\uFEFF/, ""));
const trilhos = (medido.trilhos ?? []).filter((t) => t.regime === "continuo" && t.velocidadeMediaPxPorS > 0);
if (!trilhos.length) {
  console.log("nenhum trilho contínuo medido no original — nada a reconstruir (o instrumento se cala)");
  process.exit(0);
}
console.log(`trilhos contínuos no original: ${trilhos.length}`);

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");
const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: medido.largura ?? 1280, height: 900 } });
const page = await ctx.newPage();
await page.goto(new URL(ROTA, CLONE).href, { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(1200);

// Casa cada trilho do original com um do clone por TEXTO dos itens (identidade
// forte: o texto de um depoimento não se repete por acaso) e confere a contagem.
const achados = await page.evaluate((trilhos) => {
  const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
  const out = [];
  for (const t of trilhos) {
    const textos = (t.filhos ?? []).map((f) => norm(f.texto)).filter(Boolean);
    if (!textos.length) { out.push({ id: t.id, erro: "trilho do original sem texto — não dá para casar" }); continue; }
    const alvo = textos[0];
    let melhor = null;
    for (const el of document.querySelectorAll("ul,ol,div")) {
      const filhos = [...el.children];
      if (filhos.length < 2) continue;
      const meus = filhos.map((f) => norm(f.textContent));
      if (!meus.some((m) => m && (m === alvo || m.startsWith(alvo.slice(0, 24))))) continue;
      // o mais RASO que contém os itens (o trilho, não um ancestral qualquer)
      const cand = {
        cid: el.getAttribute("data-cid") || null,
        itens: filhos.length,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        larguraItem: Math.round(filhos[0].getBoundingClientRect().width),
        profundidade: (() => { let d = 0, p = el; while ((p = p.parentElement)) d++; return d; })(),
      };
      if (!melhor || cand.profundidade > melhor.profundidade) melhor = cand;
    }
    out.push(melhor ? { id: t.id, ...melhor } : { id: t.id, erro: "nenhum elemento do clone casou por texto" });
  }
  return out;
}, trilhos);

await navegador.close();

const regras = [];
const declarados = [];
for (let i = 0; i < trilhos.length; i++) {
  const t = trilhos[i];
  const c = achados[i];
  if (!c || c.erro || !c.cid) { declarados.push({ id: t.id, motivo: c?.erro ?? "sem data-cid no clone" }); continue; }
  // Distância do ciclo: com clones de laço, metade do conteúdo. Sem clones,
  // o conteúdo que excede a janela.
  const total = c.scrollWidth || c.itens * c.larguraItem;
  const distancia = t.temClonesDeLoop ? Math.round(total / 2) : Math.max(0, total - c.clientWidth);
  if (distancia < 10) { declarados.push({ id: t.id, motivo: `distância de ciclo medida em ${distancia}px — pequena demais para ser laço` }); continue; }
  // 🚨 GUARD DO TRILHO MUTILADO. A captura fotografa o carrossel num instante e
  // traz só os itens daquele quadro. Animar o que sobrou NÃO reproduz o
  // original: produz um laço curto e nervoso onde o original faz um longo.
  // Medido no framer-6: clone com 2 dos 8 itens daria ciclo de
  // 166px/2,77s onde o original faz 1520px/~25s. Reconstruir aí seria trocar
  // "parado, faltando conteúdo" por "andando errado", que é pior — some com o
  // sintoma e mantém o defeito.
  if (c.itens < t.itens * 0.75) {
    declarados.push({
      id: t.id,
      motivo: `clone tem ${c.itens} dos ${t.itens} itens do trilho (conteúdo de carrossel que a captura não trouxe). ` +
        `Reproduzir daria ciclo de ${distancia}px/${(distancia / vel0(t)).toFixed(2)}s onde o original faz ~${Math.round(t.itens / 2 * (t.filhos?.[0]?.w ?? 0))}px. ` +
        `Residual: falta CONTEÚDO, não animação.`,
    });
    continue;
  }
  const vel = t.velocidadeMediaPxPorS;
  const dur = +(distancia / vel).toFixed(2);
  const nome = `ditto-trilho-${c.cid}`;
  regras.push({ cid: c.cid, nome, distancia, dur, vel, itens: c.itens, origemItens: t.itens });
}

console.log(`\ntrilhos casados no clone: ${regras.length}  ·  declarados sem casar: ${declarados.length}`);
for (const d of declarados) console.log(`  ⚠️ trilho ${d.id}: ${d.motivo}`);
for (const r of regras) {
  console.log(`  ✅ ${r.cid}: ${r.itens} itens (original ${r.origemItens}), ciclo ${r.distancia}px a ${r.vel}px/s = ${r.dur}s`);
}

if (!regras.length) {
  console.log("\nnada casou — o instrumento não escreve (guard).");
  process.exit(1);
}
if (!ESCREVER) { console.log("\nESCREVER=0: nada foi escrito."); process.exit(0); }

const linhas = [
  `/* carrossel.css — movimento AUTÔNOMO (marquee), reconstruído por`,
  `   scripts/gera-carrossel.mjs. Nenhum número digitado.`,
  `   Velocidade medida no ORIGINAL; distância do ciclo medida no CLONE`,
  `   (para o laço emendar na geometria que o clone realmente tem). */`,
  ``,
];
for (const r of regras) {
  linhas.push(`@keyframes ${r.nome}{from{transform:translateX(0)}to{transform:translateX(-${r.distancia}px)}}`);
  linhas.push(`[data-cid="${r.cid}"]{animation:${r.nome} ${r.dur}s linear infinite;will-change:transform}`);
  linhas.push(`  /* ${r.itens} itens · ciclo ${r.distancia}px · ${r.vel}px/s medidos no original */`);
}
linhas.push(``);
linhas.push(`/* 🚨 Movimento infinito PARA com reduced-motion, sempre. Quem desativou`);
linhas.push(`   movimento recebe o trilho parado no início, com o conteúdo à vista. */`);
linhas.push(`@media (prefers-reduced-motion: reduce){`);
for (const r of regras) linhas.push(`  [data-cid="${r.cid}"]{animation:none;transform:translateX(0)}`);
linhas.push(`}`);
linhas.push(``);

const pasta = ROTA === "/" ? join(APP, "src", "app") : join(APP, "src", "app", ...ROTA.split("/").filter(Boolean));
mkdirSync(pasta, { recursive: true });
const arq = join(pasta, "carrossel.css");
writeFileSync(arq, linhas.join("\n"));
console.log(`\n✅ ${arq}`);

// garante o import na page.tsx da rota (escrever o CSS não o liga)
const pageTsx = join(pasta, "page.tsx");
if (existsSync(pageTsx)) {
  const src = readFileSync(pageTsx, "utf8");
  if (!src.includes('./carrossel.css')) {
    writeFileSync(pageTsx, `import "./carrossel.css";\n` + src);
    console.log(`✅ import acrescentado em ${pageTsx}`);
  } else {
    console.log(`   import já existia`);
  }
} else {
  console.log(`   ⚠️ page.tsx não encontrada em ${pasta} — LIGAR O IMPORT À MÃO`);
}
