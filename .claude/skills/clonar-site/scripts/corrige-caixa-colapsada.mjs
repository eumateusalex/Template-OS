// corrige-caixa-colapsada.mjs — devolve largura ao elemento que nasceu com
// zero porque todo o conteúdo dele é absoluto.
//
// O buraco que ele tapa (medido no framer-4): o ditto emite
// invólucros que só declaram ALTURA (`h-5 block relative shrink-0`) e cujo
// único filho é `absolute`. Filho absoluto não empurra caixa nenhuma: o
// invólucro fica com `width: 0px`, o `<img>` dentro dele é `w-full` e some.
// Na tela não fica um buraco óbvio — fica um risco de 3px de largura, fácil de
// não ver, e a geometria acusa o vizinho errado.
//
// 🚨 O que denuncia sem precisar do original: a MESMA peça aparece outras
// vezes na página com `w-35` no invólucro e renderiza certo (medido: dos três
// exemplares da assinatura do framer-4, dois tinham a classe de largura e um
// não). A captura não perde a largura sempre — perde onde o elemento estava
// fora do enquadramento no instante da foto.
//
// De onde vem o número (nenhum se digita): da PROPORÇÃO que a própria imagem
// declara mais a altura que o invólucro já tem. `aspect-[auto_140/20]` com
// altura 20 dá largura 140; `aspect-[auto_101/111]` com altura 35 dá 31.85.
// É a mesma conta que o navegador faria se a caixa não tivesse colapsado.
//
// ⚠️ Elemento GIRADO: a caixa que a geometria compara é o retângulo
// envolvente, não o elemento. No framer-4 a assinatura mora dentro de um cartão
// com `matrix(0.987688,-0.156434,...)` (~9°), e 140x20 girado mede 141.4x41.7.
// Por isso a conta se faz com a largura COMPUTADA, nunca com o bounding rect.
//
// O que o faz SE CALAR:
//   - elemento sem imagem com proporção declarada  -> ignora (não inventa)
//   - altura indefinida ou zero                    -> ignora
//   - elemento sem data-cid                        -> declara e segue
//   - largura calculada <= 0                       -> declara e segue
//
// Uso:
//   CLONE=http://127.0.0.1:8093 APP=<app> ROTAS=/,/studio node corrige-caixa-colapsada.mjs
//
// Variáveis: CLONE, APP (obrigatórias) · ROTAS (padrão "/") · LARGURA (1280)
//   ESCREVER=0 simula · DITTO (C:/dev/ditto)

import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const CLONE = process.env.CLONE;
const APP = process.env.APP;
if (!CLONE || !APP) { console.error("falta CLONE=<url> APP=<app>"); process.exit(1); }
const ROTAS = (process.env.ROTAS ?? "/").split(",").map((s) => s.trim()).filter(Boolean);
const LARGURA = Number(process.env.LARGURA ?? 1280);
const ESCREVER = process.env.ESCREVER !== "0";
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

// a home pode morar no grupo de rotas (inicio) — ver entrega-inline.mjs
function arquivoDaRota(rota) {
  if (rota === "/") {
    const grupo = join(APP, "src", "app", "(inicio)", "page.tsx");
    return existsSync(grupo) ? grupo : join(APP, "src", "app", "page.tsx");
  }
  return join(APP, "src", "app", ...rota.split("/").filter(Boolean), "page.tsx");
}

const nav = await chromium.launch();
const pagina = await nav.newPage({ viewport: { width: LARGURA, height: 900 } });
let totalCorrigidos = 0, totalDeclarados = 0;

for (const rota of ROTAS) {
  await pagina.goto(new URL(rota, CLONE).href, { waitUntil: "load", timeout: 60000 });
  await pagina.waitForTimeout(1200);
  await pagina.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); }
    scrollTo(0, 0);
  });
  await pagina.waitForTimeout(600);

  const achados = await pagina.evaluate(() => {
    const saida = [];
    for (const el of document.querySelectorAll("[data-cid]")) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const larguraComputada = parseFloat(cs.width);
      if (!(larguraComputada < 1)) continue; // só o que colapsou
      const alturaComputada = parseFloat(cs.height);
      if (!(alturaComputada > 0)) continue;
      // 🚨 NÃO se exige que o pai esteja são. Exigir deixa passar o caso em que
      // o colapso é CIRCULAR: o invólucro tem `basis-full` (flex-basis 100% do
      // pai) e o pai encolhe para o conteúdo — cada um esperando a medida do
      // outro, os dois em zero. O instrumento pularia o filho ("o pai também
      // colapsou, quem se conserta é ele") e pularia o pai (nem todo filho dele
      // é absoluto). Ninguém se consertaria.
      // Quem quebra o círculo é o elemento MAIS INTERNO que tem altura própria,
      // porque é ele que carrega a proporção.
      const pai = el.parentElement;
      // elemento absoluto com inset horizontal tira a largura do ancestral
      // posicionado: dar-lhe largura própria seria trocar o efeito pela causa
      if (cs.position === "absolute" && cs.left !== "auto" && cs.right !== "auto") continue;
      // a proporção declarada pela imagem de dentro
      const img = el.querySelector("img");
      if (!img) continue;
      const ar = getComputedStyle(img).aspectRatio;
      const m = /([\d.]+)\s*\/\s*([\d.]+)/.exec(ar || "");
      let razao = m ? Number(m[1]) / Number(m[2]) : null;
      if (!razao || !isFinite(razao)) {
        const aw = Number(img.getAttribute("width")), ah = Number(img.getAttribute("height"));
        razao = aw && ah ? aw / ah : null;
      }
      if (!razao || !isFinite(razao) || razao <= 0) continue;
      const alvo = Math.round(alturaComputada * razao * 100) / 100;
      if (!(alvo > 0)) continue;
      // 🚨 Proporção é do RECORTE, não da caixa. Quando a largura que ela dá
      // quase preenche o pai, a caixa foi feita para preencher: o herói do
      // framer-4 tem `object-cover` com proporção 1.406 e altura 900 (=1265px)
      // dentro de um pai de 1280 — escrever 1265 deixaria uma faixa de 15px de
      // fundo aparecendo. Quem manda aí é o pai, e a prova é a distância entre
      // os dois números, ambos medidos.
      const paiW = pai ? parseFloat(getComputedStyle(pai).width) : 0;
      const preenche = paiW > 0 && Math.abs(alvo - paiW) / paiW < 0.03;
      saida.push({
        el,
        cid: el.getAttribute("data-cid"),
        altura: alturaComputada,
        razao: Math.round(razao * 10000) / 10000,
        largura: alvo, paiW: Math.round(paiW * 100) / 100, preenche,
        classe: preenche ? "w-full" : `w-[${alvo}px]`,
        img: (img.getAttribute("src") || "").slice(-24),
      });
    }
    // só o MAIS INTERNO de cada aninhamento: consertar o de fora deixaria o de
    // dentro em zero, e consertar os dois somaria larguras que não existem
    return saida
      .filter((a) => !saida.some((b) => b !== a && a.el.contains(b.el)))
      .map(({ el, ...resto }) => resto);
  });

  const arquivo = arquivoDaRota(rota);
  console.log(`\n=== ${rota} · ${achados.length} caixa(s) colapsada(s) ===`);
  if (!achados.length) continue;
  if (!existsSync(arquivo)) { console.log(`  arquivo da rota não existe (${arquivo}) — declarado`); totalDeclarados += achados.length; continue; }

  let jsx = readFileSync(arquivo, "utf8");
  let feitos = 0;
  for (const a of achados) {
    if (!a.cid) { console.log(`  ⚠️ elemento sem data-cid (${a.largura}px) — declarado`); totalDeclarados++; continue; }
    const marca = `data-cid="${a.cid}"`;
    const pos = jsx.indexOf(marca);
    if (pos < 0) { console.log(`  ⚠️ ${a.cid} não achado no JSX — declarado`); totalDeclarados++; continue; }
    const ini = jsx.lastIndexOf("<", pos);
    const fim = jsx.indexOf(">", pos);
    const abertura = jsx.slice(ini, fim + 1);
    if (/(?<![:\w-])w-(?:\[|full\b)/.test(abertura)) { console.log(`  ${a.cid} já tem largura explícita — nada a fazer`); continue; }
    const nova = abertura.replace(/className="/, `className="${a.classe} `);
    if (nova === abertura) { console.log(`  ⚠️ ${a.cid} sem className — declarado`); totalDeclarados++; continue; }
    jsx = jsx.slice(0, ini) + nova + jsx.slice(fim + 1);
    console.log(
      `  ${a.cid}: altura ${a.altura}px × proporção ${a.razao} = ${a.largura}px` +
        (a.preenche ? `, e o pai mede ${a.paiW}px (< 3%) -> ${a.classe} (a caixa preenche o pai)` : ` -> ${a.classe}`) +
        `   (img ${a.img})`
    );
    feitos++;
  }
  if (ESCREVER && feitos) writeFileSync(arquivo, jsx);
  totalCorrigidos += feitos;
  console.log(`  ${ESCREVER ? "escrito" : "SIMULADO"}: ${feitos} correção(ões)`);
}

console.log(`\n${totalCorrigidos} caixa(s) corrigida(s), ${totalDeclarados} declarada(s) sem conserto.`);
await nav.close();
