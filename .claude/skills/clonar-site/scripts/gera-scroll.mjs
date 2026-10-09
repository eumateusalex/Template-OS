// gera-scroll.mjs — devolve ao clone o comportamento de scroll do original.
//
// ══════════════════════════════════════════════════════════════════════════
// 🚨 AS QUATRO REGRAS DO INSTRUMENTO
//
// Olhar só uns poucos elementos fixos, escrever um limiar global e forçar
// `width`/`transform` no CONTÊINER erra. Medido no site-exemplo: a nav sai
// 158.8px fora do lugar e a barra de contato fica 3.6px PIOR do que não fazer
// nada. Quatro erros, todos corrigidos aqui:
//
// 1. **Contêiner não basta.** Forçar `width:550px` na nav não reproduz o
//    layout interno: os filhos foram capturados no estado colapsado e
//    continuam distribuídos como tal. Medido: "Work" cai em 561.5 onde o
//    original põe 593.6. Por isso se escreve o estado de TODO elemento que muda.
//
// 2. **Limiar é por elemento, não do site.** No site-exemplo a nav troca a 80px
//    e a barra a 240px. Um limiar global aciona um dos dois na hora errada.
//
// 3. **Comparar GEOMETRIA no scroll acusa quem está parado.** Elemento
//    `fixed`/`sticky` muda de posição documental por definição quando a página
//    rola. Aqui se compara ESTILO COMPUTADO, que não depende do scroll.
//
// 4. **Há TRÊS comportamentos distintos, e tratar tudo como um só quebra.**
//      · ALTERNA  — visível no topo, dois estados (nav colapsa, barra desliza)
//      · REVELA   — fora de tela no topo, entra animando quando aparece
//      · CONTÍNUO — visível no topo, valor acompanha o scroll (scrub)
//    O discriminador é objetivo: **o elemento estava dentro da janela quando a
//    página estava no topo?** e **quantos valores distintos ele assume?**
//
// 🚨 E a raiz de tudo: a captura do ditto congela a página no
// estado ROLADO. No site-exemplo a nav sai com 232.5px (colapsada) e a barra
// já entrada, enquanto o original em repouso tem 549.95px e a barra 100px
// abaixo. Por isso se escrevem SEMPRE OS DOIS ESTADOS: escrever só o rolado
// não faz nada, porque o clone já nasce rolado.
//
// 🚨 E o que NÃO se toca: o wrapper da página. A altura dele muda ao rolar
// porque o conteúdo revelado ocupa espaço — é consequência, não comportamento.
// Escrever `height:9544px` nele congela a página.
// ══════════════════════════════════════════════════════════════════════════
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 ROTA=/ \
//   APP=/caminho/app SAIDA=./med node gera-scroll.mjs
//
// Variáveis:
//   ORIGINAL  URL base do original (obrigatória)
//   CLONE     URL base do clone servido (obrigatória)
//   APP       raiz do projeto Next do clone (obrigatória para escrever)
//   ROTA      rota a tratar (padrão /)
//   ESCADA    posições de scroll para achar o limiar dos que ALTERNAM
//             (padrão 0,80,160,240,360,520,800,1400)
//   LARGURA   viewport (padrão 1280)
//   ESCREVER  0 simula sem tocar em arquivo
//   SAIDA     onde gravar a medição bruta (padrão ./scroll)

import { createRequire } from "node:module";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

// 🚨 A rota vem PERCENT-ENCODED (é assim que ela existe no original), mas a
// pasta no disco tem o caractere literal. Sem decodificar, toda rota com
// acento ou unicode aponta para pasta inexistente. Medido no framer-7:
// /blog/...director%E2%80%99s-... derrubou dois instrumentos em silêncio.
const decodificarSegmento = (s) => {
  try { return decodeURIComponent(s); } catch { return s; }
};


const ORIGINAL = process.env.ORIGINAL;
const CLONE = process.env.CLONE;
const APP = process.env.APP;
if (!ORIGINAL || !CLONE) {
  console.error("faltam ORIGINAL e/ou CLONE");
  process.exit(1);
}
const ROTA = process.env.ROTA ?? "/";
const LARGURA = Number(process.env.LARGURA ?? 1280);
const ALTURA = Number(process.env.ALTURA ?? 900);
const ESCADA = (process.env.ESCADA ?? "0,80,160,240,360,520,800,1400")
  .split(",").map((n) => Number(n.trim())).filter((n) => Number.isFinite(n));
const ESCREVER = process.env.ESCREVER !== "0";
const SAIDA = resolve(process.env.SAIDA ?? "./scroll");
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
mkdirSync(SAIDA, { recursive: true });

// 🚨 TODA regra gerada vale SÓ na faixa em que foi medida.
//
// Sem isto, `width:549.953px` medido na nav a 1280px passaria a valer também a
// 375px e destruiria o layout do celular — o clone ficaria idêntico no desktop
// e quebrado no telefone, que é a pior combinação possível porque não aparece
// em nenhuma medição feita numa largura só.
//
// As bordas seguem os breakpoints do Tailwind que o próprio ditto gera
// (md=768, lg=1024), então a regra cai exatamente onde as classes dele caem.
const FAIXA =
  process.env.FAIXA ??
  (LARGURA >= 1024
    ? "(min-width: 1024px)"
    : LARGURA >= 768
      ? "(min-width: 768px) and (max-width: 1023.98px)"
      : "(max-width: 767.98px)");
const MARCA_INI = `/* @ditto-scroll-inicio faixa=${FAIXA} */`;
const MARCA_FIM = `/* @ditto-scroll-fim faixa=${FAIXA} */`;

/** Costura o bloco desta faixa dentro do arquivo, preservando as outras
 *  faixas já geradas. Sem isto a segunda passada (celular) apagaria a
 *  primeira (desktop). */
function costurar(arquivo, bloco) {
  let atual = "";
  try {
    atual = existsSync(arquivo) ? readFileSync(arquivo, "utf8") : "";
  } catch {
    atual = "";
  }
  const ini = atual.indexOf(MARCA_INI);
  const fim = atual.indexOf(MARCA_FIM);
  if (ini >= 0 && fim > ini) {
    return atual.slice(0, ini) + bloco + atual.slice(fim + MARCA_FIM.length);
  }
  const outrasFaixas = atual.includes("@ditto-scroll-inicio") ? atual.trimEnd() + "\n\n" : "";
  return outrasFaixas + bloco;
}

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

// 🚨 Propriedades de ESTILO COMPUTADO, não de geometria.
const PROPS = [
  "transform", "width", "height", "opacity", "background-color", "border-radius",
  "box-shadow", "backdrop-filter", "filter", "padding-left", "padding-right",
  "padding-top", "padding-bottom", "gap", "font-size", "color", "visibility",
];
// Propriedades que NUNCA se escrevem num elemento que embrulha a página: a
// mudança delas é consequência do conteúdo revelado, não comportamento.
const PROPS_DE_CAIXA = new Set(["width", "height"]);

// 🚨 IDENTIDADE ESTÁVEL ENTRE FOTOS.
//
// Casar elemento por ÍNDICE em querySelectorAll parece seguro e não é: o DOM
// do original MUDA entre as fotos (imagem preguiçosa, item de lista que só
// monta ao aparecer), e a partir do primeiro elemento novo todos os índices
// andam. Medido no site-exemplo: a barra "Speak to me" é comparada com um
// `<a>` de outro bloco, e o instrumento conclui que ela muda de `color` para
// o azul-padrão de link e de largura para 490px.
//
// Por isso cada elemento é carimbado UMA vez, e as fotos seguintes leem o
// carimbo. Elemento que entrou no DOM depois não tem carimbo e fica de fora — é o
// certo: ele não existia no repouso.
const CARIMBAR = () => {
  const todos = document.querySelectorAll("body *");
  for (let i = 0; i < todos.length; i++) {
    if (!todos[i].hasAttribute("data-dp")) todos[i].setAttribute("data-dp", "p" + i);
  }
  return todos.length;
};

const COLHER = ({ props }) => {
  const norm = (s) => String(s).replace(/\s+/g, " ").trim();
  const out = [];
  const todos = document.querySelectorAll("body *[data-dp]");
  const alturaDoc = document.documentElement.scrollHeight;
  for (let i = 0; i < todos.length; i++) {
    const el = todos[i];
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    let proprio = "";
    for (const n of el.childNodes) if (n.nodeType === 3) proprio += n.nodeValue;
    const v = {};
    for (const p of props) v[p] = cs.getPropertyValue(p);
    out.push({
      dp: el.getAttribute("data-dp"),
      i,
      tag: el.tagName.toLowerCase(),
      cid: el.getAttribute("data-cid") || null,
      proprio: norm(proprio).slice(0, 60),
      conteudo: norm(el.textContent).slice(0, 60),
      w: Math.round(r.width * 100) / 100,
      h: Math.round(r.height * 100) / 100,
      yTela: Math.round(r.top * 100) / 100,
      yDoc: Math.round((r.top + window.scrollY) * 100) / 100,
      naJanela: r.top < window.innerHeight && r.bottom > 0,
      // embrulho = ocupa mais de 60% da página. Não recebe regra de caixa.
      embrulho: r.height > alturaDoc * 0.6,
      posicao: cs.position,
      v,
    });
  }
  return { itens: out, alturaDoc };
};

function distTransform(a, b) {
  if (a === b) return 0;
  const num = (s) => (String(s).match(/-?[\d.]+/g) || []).map(Number);
  const na = num(a);
  const nb = num(b);
  if (na.length !== nb.length) return Infinity;
  let m = 0;
  for (let i = 0; i < na.length; i++) m = Math.max(m, Math.abs(na[i] - nb[i]));
  return m;
}

function difere(prop, a, b) {
  if (a === b) return false;
  if (prop === "transform") return distTransform(a, b) > 1;
  if (prop === "opacity") return Math.abs(Number(a) - Number(b)) > 0.04;
  const na = parseFloat(a);
  const nb = parseFloat(b);
  if (Number.isFinite(na) && Number.isFinite(nb) && /px|rem|%/.test(String(a) + String(b))) {
    return Math.abs(na - nb) > 1;
  }
  return String(a) !== String(b);
}

async function foto(page, y, espera = 800) {
  await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: "instant" }), y);
  await page.waitForTimeout(espera);
  return page.evaluate(COLHER, { props: PROPS });
}

async function abrir(page, url) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  // Deixa a animação de ENTRADA terminar: medir durante ela mistura os dois
  // comportamentos e atribui ao scroll o que é da entrada.
  await page.waitForTimeout(3200);
}

/** Percorre a página inteira e volta ao topo. É o que dispara as revelações. */
async function percorrer(page) {
  await page.evaluate(async () => {
    const passo = Math.max(200, window.innerHeight * 0.75);
    const fim = document.documentElement.scrollHeight;
    for (let y = 0; y < fim + window.innerHeight; y += passo) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 110));
    }
    // 🚨 VOLTAR EM DEGRAUS, nunca de um salto.
    //
    // O original decide reexpandir a nav observando a DIREÇÃO do scroll. Um
    // `scrollTo(0)` vindo do rodapé é um evento só, e o framework não o lê
    // como "subiu ao topo": a nav ficava colapsada no original e expandida no
    // clone, e a medição culpava 6 elementos que estavam certos por 158.8px.
    for (let y = window.scrollY; y > 0; y -= passo) {
      window.scrollTo({ top: Math.max(0, y - passo), behavior: "instant" });
      await new Promise((r) => setTimeout(r, 110));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    await new Promise((r) => setTimeout(r, 1800));
  });
}

/** Duração de uma transição de scroll, medida vendo quando os estilos param
 *  de mudar depois de um salto. Nada digitado. */
async function medirDuracao(page) {
  return page.evaluate(async () => {
    window.scrollTo({ top: 0, behavior: "instant" });
    await new Promise((r) => setTimeout(r, 1200));
    const alvos = [...document.querySelectorAll("body *")].filter((e) =>
      ["fixed", "sticky"].includes(getComputedStyle(e).position)
    );
    if (!alvos.length) return null;
    const tirar = () => alvos.map((e) => {
      const cs = getComputedStyle(e);
      return cs.transform + "|" + cs.width + "|" + cs.opacity;
    });
    let anterior = tirar();
    window.scrollTo({ top: 800, behavior: "instant" });
    const t0 = performance.now();
    let ultima = t0;
    for (let k = 0; k < 120; k++) {
      await new Promise((r) => requestAnimationFrame(r));
      const agora = tirar();
      if (agora.some((v, i) => v !== anterior[i])) ultima = performance.now();
      anterior = agora;
    }
    return Math.round(ultima - t0);
  });
}

(async () => {
  const nav = await chromium.launch();
  const ctx = await nav.newContext({ viewport: { width: LARGURA, height: ALTURA } });
  const page = await ctx.newPage();

  // ── 1. ORIGINAL, estado de REPOUSO (nunca rolou) ───────────────────────
  await abrir(page, new URL(ROTA, ORIGINAL).href);
  const carimbados = await page.evaluate(CARIMBAR);
  const repouso = (await page.evaluate(COLHER, { props: PROPS })).itens;
  const porDp = (lista) => new Map(lista.map((e) => [e.dp, e]));
  console.log(`\n🔖 ${carimbados} elementos carimbados no repouso (identidade estável entre as fotos)`);

  // ── 1b. CONTROLE DE DERIVA POR TEMPO ───────────────────────────────────
  // 🚨 Sem este controle, tudo que anima em LAÇO vira falso comportamento de
  // scroll. Medido no site do exemplo: o marquee (`translateX(2278px)`) apareceu
  // como "alterna no limiar de 160px" só porque a escada o amostrou em
  // instantes diferentes do laço. Escrever isso teria feito o marquee saltar
  // 2278px na horizontal ao passar de 160px de scroll.
  //
  // O teste é direto: sem rolar nada, tira duas fotos separadas no tempo. O
  // que mudou, mudou por TEMPO, e não é assunto deste instrumento.
  const derivaTempo = new Set();
  for (const espera of [1400, 1400]) {
    await page.waitForTimeout(espera);
    const outra = porDp((await page.evaluate(COLHER, { props: PROPS })).itens);
    for (const a of repouso) {
      const b = outra.get(a.dp);
      if (!b) continue;
      for (const p of PROPS) if (difere(p, a.v[p], b.v[p])) derivaTempo.add(`${a.dp}|${p}`);
    }
  }
  console.log(`\n⏱️  deriva por tempo (animação em laço): ${derivaTempo.size} pares elemento×propriedade excluídos`);

  // ── 2. ORIGINAL, a escada (para achar o limiar de quem ALTERNA) ────────
  const degraus = [];
  for (const y of ESCADA.filter((y) => y > 0)) degraus.push({ y, mapa: porDp((await foto(page, y)).itens) });

  // ── 3. ORIGINAL, página percorrida e de volta ao topo ──────────────────
  //     É este estado que revela tudo que revela.
  await percorrer(page);
  const percorrido = porDp((await page.evaluate(COLHER, { props: PROPS })).itens);
  const durMedida = await medirDuracao(page);

  // ── 4. classificar ─────────────────────────────────────────────────────
  const alterna = [];
  const revela = [];
  const continuo = [];
  const ignorados = [];

  const fundoDaEscada = degraus[degraus.length - 1].mapa;
  let sumiram = 0;
  for (const a of repouso) {
    const z = percorrido.get(a.dp);
    // Elemento que sumiu do DOM entre as fotos não se compara com nada. Antes
    // isto virava comparação com o VIZINHO, pelo índice.
    if (!z) { sumiram++; continue; }
    if (a.tag !== z.tag) continue;

    // 🚨 Elemento ANCORADO NA TELA (fixed/sticky) nunca "entra na tela ao
    // rolar": ele já está lá. O critério de janela não se aplica a ele, e
    // aplicá-lo mandou a barra de contato do site-exemplo para o grupo errado —
    // onde, comparada repouso-contra-repouso, sumiu do relatório inteiro.
    const ancorado = a.posicao === "fixed" || a.posicao === "sticky";
    // 🚨 E cada grupo se decide contra a foto CERTA:
    //   · quem alterna se vê comparando o repouso com o FUNDO DA ESCADA;
    //   · quem revela se vê comparando o repouso com a página PERCORRIDA.
    // Comparar quem alterna contra a página percorrida não acha nada, porque
    // ele já voltou ao estado de repouso — e a barra de contato some do
    // relatório.
    const daEscada = fundoDaEscada.get(a.dp);
    const alvo = ancorado || a.naJanela ? (daEscada ?? z) : z;
    let props = PROPS.filter((p) => difere(p, a.v[p], alvo.v[p]) && !derivaTempo.has(`${a.dp}|${p}`));
    if (a.embrulho) {
      const cortadas = props.filter((p) => PROPS_DE_CAIXA.has(p));
      props = props.filter((p) => !PROPS_DE_CAIXA.has(p));
      if (cortadas.length) ignorados.push({ dp: a.dp, tag: a.tag, motivo: "embrulho da página", props: cortadas });
    }
    if (!props.length) continue;

    // quantos valores distintos ele assume ao longo da escada + repouso + fim
    const trilha = [a, ...degraus.map((d) => d.mapa.get(a.dp)).filter(Boolean), z];
    const distintos = new Set(trilha.map((t) => props.map((p) => t.v[p]).join("¦"))).size;
    // A trilha por posição de scroll é o que permite reproduzir quem faz
    // SCRUB: vira quadro-chave de uma animação guiada pelo scroll.
    const trilhaY = [{ y: 0, v: Object.fromEntries(props.map((p) => [p, a.v[p]])) }];
    for (const d of degraus) {
      const e = d.mapa.get(a.dp);
      if (e) trilhaY.push({ y: d.y, v: Object.fromEntries(props.map((p) => [p, e.v[p]])) });
    }

    const comum = {
      dp: a.dp, tag: a.tag, proprio: a.proprio, conteudo: a.conteudo, props,
      posicao: a.posicao,
      de: Object.fromEntries(props.map((p) => [p, a.v[p]])),
      para: Object.fromEntries(props.map((p) => [p, alvo.v[p]])),
      caixaDe: { w: a.w, h: a.h, y: a.yDoc },
      caixaPara: { w: alvo.w, h: alvo.h, y: alvo.yDoc },
      distintos,
      trilhaY,
    };

    if (!ancorado && !a.naJanela) {
      revela.push(comum);
      continue;
    }
    // limiar: primeiro degrau em que já saiu do repouso
    let limiar = null;
    for (const d of degraus) {
      const e = d.mapa.get(a.dp);
      if (!e) continue;
      if (props.some((p) => difere(p, a.v[p], e.v[p]))) { limiar = d.y; break; }
    }
    // Sem limiar na escada: se está ancorado na tela, não é revelação — é
    // comportamento que a escada não alcançou. Declara e não inventa.
    if (limiar === null) {
      if (ancorado) ignorados.push({ dp: a.dp, tag: a.tag, motivo: "ancorado, limiar fora da escada", props });
      else revela.push(comum);
      continue;
    }

    // 🚨 ALTERNA só quem VOLTA. Quem muda ao rolar e NÃO volta ao estado de
    // repouso é revelação de mão única, e chavear por classe no <body> o faria
    // desfazer a entrada toda vez que a página voltasse ao topo. Medido: os
    // títulos "Latest" e "Projects" ficaram com 10px de resíduo exatamente por
    // isso — reentravam com translateY(10px) a cada volta ao topo.
    const voltaAoRepouso = !props.some((p) => difere(p, a.v[p], z.v[p]));
    if (!voltaAoRepouso) {
      revela.push({ ...comum, deVolta: false });
      continue;
    }
    if (distintos > 3) continuo.push({ ...comum, limiar });
    else alterna.push({ ...comum, limiar });
  }

  console.log(`\n📐 ORIGINAL ${ROTA} @${LARGURA}px — ${repouso.length} elementos varridos, ${sumiram} sumiram do DOM entre as fotos`);
  console.log(`   ALTERNA (dois estados, visível no topo): ${alterna.length}`);
  console.log(`   REVELA  (entra ao aparecer na tela):     ${revela.length}`);
  console.log(`   CONTÍNUO (acompanha o scroll):           ${continuo.length}`);
  console.log(`   ignorados por serem embrulho da página:  ${ignorados.length}`);
  const porLimiar = {};
  for (const m of alterna) porLimiar[m.limiar] = (porLimiar[m.limiar] ?? 0) + 1;
  console.log(`   limiares de alternância: ${Object.entries(porLimiar).map(([y, n]) => `${y}px→${n}`).join("  ") || "-"}`);
  console.log(`   duração medida: ${durMedida === null ? "não medida" : durMedida + "ms"}`);

  // ── 5. CLONE, e casar ──────────────────────────────────────────────────
  await abrir(page, new URL(ROTA, CLONE).href);
  // ⚠️ Carimbar aqui também: o COLHER só enxerga elemento carimbado.
  await page.evaluate(CARIMBAR);
  const noClone = (await page.evaluate(COLHER, { props: PROPS })).itens;
  await nav.close();

  // 🚨 Teto de erro no casamento. Sem ele, todo elemento SEM texto casa com o
  // primeiro outro elemento sem texto da mesma tag — e a regra vai parar num
  // elemento que não tem nada a ver, escondendo a coisa errada. Elemento sem
  // texto é a maioria num site gerado por construtor, então isto não é caso
  // de borda: é o caso comum.
  const TETO_CAIXA = 60; // px de diferença em largura/altura
  const TETO_Y = 220; // px de diferença na posição documental
  const usados = new Set();
  const recusados = [];

  function casar(m) {
    // O clone pode estar congelado em QUALQUER um dos dois estados. Tenta as
    // duas caixas e registra contra qual casou: é isso que diz qual estado a
    // captura já tem, e portanto qual falta escrever.
    let melhor = null;
    for (const c of noClone) {
      if (usados.has(c.i) || c.tag !== m.tag) continue;
      const mesmoTexto = m.proprio ? c.proprio === m.proprio : c.conteudo === m.conteudo;
      if (!mesmoTexto) continue;
      const dDe = Math.hypot(c.w - m.caixaDe.w, c.h - m.caixaDe.h);
      const dPara = Math.hypot(c.w - m.caixaPara.w, c.h - m.caixaPara.h);
      const dY = Math.min(Math.abs(c.yDoc - m.caixaDe.y), Math.abs(c.yDoc - m.caixaPara.y));
      const d = Math.min(dDe, dPara);
      if (d > TETO_CAIXA || dY > TETO_Y) continue;
      const custo = d + dY / 8;
      if (!melhor || custo < melhor.custo) melhor = { c, d, dY, custo, capturaEmRepouso: dDe <= dPara };
    }
    if (!melhor || !melhor.c.cid) {
      recusados.push({ tag: m.tag, texto: (m.proprio || m.conteudo).slice(0, 34), props: m.props });
      return null;
    }
    usados.add(melhor.c.i);
    return {
      ...m,
      cid: melhor.c.cid,
      erro: Math.round(melhor.d * 10) / 10,
      erroY: Math.round(melhor.dY * 10) / 10,
      capturaEmRepouso: melhor.capturaEmRepouso,
    };
  }

  const cAlterna = alterna.map(casar).filter(Boolean);
  const cRevela = revela.map(casar).filter(Boolean);
  const cContinuo = continuo.map(casar).filter(Boolean);
  console.log(`\n🔗 CLONE — casados: alterna ${cAlterna.length}/${alterna.length}, revela ${cRevela.length}/${revela.length}, contínuo ${cContinuo.length}/${continuo.length}`);
  console.log(`   recusados por teto de erro (caixa>${TETO_CAIXA}px ou y>${TETO_Y}px): ${recusados.length} — declarados, nunca forçados`);

  writeFileSync(
    join(SAIDA, `scroll-${ROTA === "/" ? "home" : ROTA.replace(/[^a-z0-9]+/gi, "-")}.json`),
    JSON.stringify({ rota: ROTA, largura: LARGURA, escada: ESCADA, durMedida, derivaTempo: derivaTempo.size, alterna: cAlterna, revela: cRevela, continuo: cContinuo, ignorados, recusados }, null, 2)
  );

  if (!cAlterna.length && !cRevela.length) {
    // 🚨 Escrever numa rota onde nada casou grava `LIMIAR = ` (vazio) e
    // DESTRÓI a home que já funciona. Nada casou = não escreve NADA.
    console.log(`\n⚠️ Nada casou em ${ROTA}. Não escrevendo arquivo algum.`);
    process.exit(0);
  }

  // ── 6. gerar ───────────────────────────────────────────────────────────
  // 🚨 O `|| 400` é um FALLBACK SILENCIOSO: no framer-2, com a medição
// de duração falhando (o cabeçalho do CSS sai com "duração medida: 0ms"), as
// 39 rotas revelam em 400ms onde o original revela em 1050ms — 2,6× mais
// rápido, visível a olho, e nenhum gate acusa porque a regra APLICA, só está
// errada. Quando a medição falhar, o certo é gritar e aceitar
// DUR_FALLBACK medido em OUTRA rota do mesmo site (regra da skill), nunca cair
// num número inventado calado.
if (!durMedida) {
  const dado = Number(process.env.DUR_FALLBACK || 0);
  if (dado) console.log(`⚠️ duração não medida nesta rota — usando DUR_FALLBACK=${dado}ms (medido em outra rota)`);
  else console.log("🚨 duração NÃO medida e sem DUR_FALLBACK: o reveal sai com 400ms EMBUTIDO, que é chute. Medir no original e repassar.");
}
const dur = Math.max(80, Math.min(1200, durMedida || Number(process.env.DUR_FALLBACK || 0) || 400));
  const limiares = [...new Set(cAlterna.map((c) => c.limiar))].sort((a, b) => a - b);
  const congeladoRolado = cAlterna.filter((c) => !c.capturaEmRepouso).length;
  const L = [];
  L.push(`/* scroll.css — comportamento de scroll do ORIGINAL, medido por`);
  L.push(`   scripts/gera-scroll.mjs. Nenhum número digitado à mão.`);
  L.push(`   Origem: ${new URL(ROTA, ORIGINAL).href} @${LARGURA}px`);
  L.push(`   ALTERNA ${cAlterna.length} · REVELA ${cRevela.length} · CONTÍNUO ${cContinuo.length} (scrub, por animação guiada pelo scroll)`);
  L.push(`   limiares medidos: ${limiares.join(", ") || "nenhum"}px · duração medida: ${durMedida}ms`);
  L.push(`   captura congelada no estado ROLADO em ${congeladoRolado}/${cAlterna.length} dos que alternam.`);
  L.push(``);
  L.push(`   🚨 O scroll.js é genérico e lê TUDO daqui: os limiares saem da`);
  L.push(`   variável --ditto-limiares e os alvos de revelação se marcam com`);
  L.push(`   --ditto-revelar. Assim o JS global serve as 21 rotas sem carregar`);
  L.push(`   dado de rota nenhuma. */`);
  L.push("");
  L.push(MARCA_INI);
  L.push(`@media ${FAIXA} {`);
  L.push(`body{--ditto-limiares:"${limiares.join(" ")}"}`);
  L.push("");

  if (cAlterna.length) {
    L.push(`/* ── ALTERNA: dois estados, chaveados pela posição do scroll ── */`);
    for (const c of cAlterna) {
      const de = c.props.map((p) => `${p}:${c.de[p]}`).join(";");
      const para = c.props.map((p) => `${p}:${c.para[p]}`).join(";");
      const trans = c.props.filter((p) => p !== "visibility")
        .map((p) => `${p} ${dur}ms cubic-bezier(0.4,0,0.2,1)`).join(",");
      const nota = `/* ${JSON.stringify((c.proprio || c.conteudo).slice(0, 24))} limiar=${c.limiar} erro=${c.erro}px captura=${c.capturaEmRepouso ? "repouso" : "ROLADO"} */`;
      L.push(`[data-cid="${c.cid}"]{${de}${trans ? `;transition:${trans}` : ""}}`);
      L.push(`body.ditto-y${c.limiar} [data-cid="${c.cid}"]{${para}}  ${nota}`);
    }
    L.push("");
  }

  if (cRevela.length) {
    L.push(`/* ── REVELA: entra quando aparece na tela ──`);
    L.push(`   🚨 O estado oculto é gateado por \`html.ditto-js\`, classe que o`);
    L.push(`   scroll.js põe na PRIMEIRA linha, antes do corpo ser pintado. Duas`);
    L.push(`   coisas saem de graça disso:`);
    L.push(`     · sem JS, nada fica escondido — jamais uma página em branco;`);
    L.push(`     · sem pisca, porque o oculto já vale no primeiro quadro. Esconder`);
    L.push(`       depois do load obrigaria a pular quem já está à vista,`);
    L.push(`       deixando o topo sem entrada.`);
    L.push(`   E o scroll.js ainda revela tudo por segurança depois de 4s, para`);
    L.push(`   o caso de o observador não disparar. */`);
    for (const c of cRevela) {
      const oculto = c.props.map((p) => `${p}:${c.de[p]}`).join(";");
      const trans = c.props.filter((p) => p !== "visibility")
        .map((p) => `${p} ${dur}ms cubic-bezier(0.16,1,0.3,1)`).join(",");
      const nota = `/* ${JSON.stringify((c.proprio || c.conteudo).slice(0, 24))} erro=${c.erro}px ${c.deVolta === false ? "mão-única" : "fora da janela"} */`;
      L.push(`[data-cid="${c.cid}"]{--ditto-revelar:1${trans ? `;transition:${trans}` : ""}}`);
      L.push(`html.ditto-js [data-cid="${c.cid}"]:not(.ditto-revelado){${oculto}}  ${nota}`);
    }
    L.push("");
  }

  if (cContinuo.length) {
    const fim = ESCADA[ESCADA.length - 1];
    L.push(`/* ── CONTÍNUO: ${cContinuo.length} elementos cujo valor acompanha o scroll`);
    L.push(`   quadro a quadro (scrub). Encaixá-los em dois estados os faria`);
    L.push(`   SALTAR em vez de acompanhar, o que fica pior do que deixar`);
    L.push(`   parado. Então aqui viram animação guiada pelo scroll, com um`);
    L.push(`   quadro-chave por degrau MEDIDO da escada.`);
    L.push(``);
    L.push(`   🚨 Dentro de @supports: onde animation-timeline não existe, o`);
    L.push(`   elemento fica como a captura o deixou. Nunca quebra. */`);
    L.push(`@supports (animation-timeline: scroll()) {`);
    for (const c of cContinuo) {
      const nome = `dittoScrub_${c.cid}`;
      L.push(`  [data-cid="${c.cid}"]{animation:${nome} linear both;animation-timeline:scroll(root block);animation-range:0px ${fim}px}  /* ${JSON.stringify((c.proprio || c.conteudo).slice(0, 24))} ${c.distintos} valores medidos */`);
      L.push(`  @keyframes ${nome}{`);
      const vistos = new Set();
      for (const passo of c.trilhaY) {
        const pct = Math.round((passo.y / fim) * 10000) / 100;
        if (vistos.has(pct)) continue;
        vistos.add(pct);
        L.push(`    ${pct}%{${c.props.map((p) => `${p}:${passo.v[p]}`).join(";")}}`);
      }
      L.push(`  }`);
    }
    L.push(`}`);
    L.push("");
  }

  L.push(`}`);  // fecha @media ${FAIXA}
  L.push("");
  L.push(`@media (prefers-reduced-motion: reduce){`);
  L.push(`  [data-cid]{transition:none !important;animation:none !important}`);
  L.push(`  /* ⚠️ Quem desativou movimento recebe o ESTADO FINAL, nunca a`);
  L.push(`     página invisível: desligar a animação sem isto deixaria em tela o`);
  L.push(`     estado oculto de quem revela. */`);
  if (cRevela.length) {
    // ⚠️ Só os alvos de revelação, NUNCA `[data-cid]` inteiro: um
    // `transform:none !important` genérico apagaria o translateX de
    // centralização da nav e de todo elemento posicionado por transform,
    // quebrando o layout justamente para quem pediu menos movimento.
    L.push(`  ${cRevela.map((c) => `html.ditto-js [data-cid="${c.cid}"]:not(.ditto-revelado)`).join(",\n  ")}`);
    L.push(`  {opacity:1 !important;transform:none !important;filter:none !important;visibility:visible !important}`);
  }
  L.push(`}`);
  L.push(MARCA_FIM);
  const css = L.join("\n") + "\n";

  const js = `// scroll.js — runtime GENÉRICO do comportamento de scroll.
// Gerado por scripts/gera-scroll.mjs.
//
// 🚨 Este arquivo não tem dado de rota nenhuma, de propósito: ele é global e
// as 21 rotas o compartilham. Tudo que é específico de rota vem do
// scroll.css DAQUELA rota, por variável CSS:
//    body { --ditto-limiares: "80 240" }   → posições que ligam ditto-yNNN
//    [data-cid=X] { --ditto-revelar: 1 }   → alvo de revelação ao entrar
// É o que deixa um JS global servir CSS por rota: gerado por rota, a última
// rota sobrescreveria as outras.
//
// ⚠️ scroll com { passive: true } e trabalho por CLASSE: ler geometria a cada
// quadro causa layout thrashing e o site perde justamente a fluidez que se
// está tentando reproduzir.
(function () {
  // 🚨 PRIMEIRA LINHA, e o <script> tem que estar no topo do <body> SEM defer.
  // É esta classe que autoriza o CSS a esconder quem revela. Duas garantias
  // saem dela:
  //   · com JS, o estado oculto já vale no primeiro quadro — sem pisca;
  //   · sem JS, nada fica escondido — a página nunca aparece em branco.
  document.documentElement.classList.add("ditto-js");

  // 🚨 E ela precisa SOBREVIVER À HIDRATAÇÃO. Medido no framer-3:
  // a classe entra no parse (t=0) e o React a APAGA por volta de 400ms, ao
  // reconciliar o <html> com o que veio do servidor. Sem ela, o CSS para de
  // esconder quem revela: os 146 alvos da home ficam visíveis desde o
  // início e a animação de revelação simplesmente NÃO TOCA — sem erro em
  // lugar nenhum, e sem aparecer em gate de entrada, de conteúdo ou de rota.
  // O observador devolve a classe no mesmo quadro em que ela some.
  if (typeof MutationObserver === "function") {
    new MutationObserver(function () {
      if (!document.documentElement.classList.contains("ditto-js")) {
        document.documentElement.classList.add("ditto-js");
      }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  }

  function limiares() {
    var v = getComputedStyle(document.body).getPropertyValue("--ditto-limiares") || "";
    return v.replace(/["']/g, "").trim().split(/\\s+/).map(Number).filter(function (n) {
      return isFinite(n);
    });
  }

  // ⚠️ Os limiares são relidos a cada conferência, não guardados: com
  // navegação client-side a rota nova traz OUTROS limiares no CSS dela, e uma
  // lista capturada na primeira página continuaria valendo para sempre.
  var estado = {};
  function confere() {
    var LIM = limiares();
    var y = window.scrollY || document.documentElement.scrollTop || 0;
    for (var k = 0; k < LIM.length; k++) {
      var deve = y >= LIM[k];
      if (estado[LIM[k]] !== deve) {
        estado[LIM[k]] = deve;
        document.body.classList.toggle("ditto-y" + LIM[k], deve);
      }
    }
  }

  var listenersLigados = false;
  function ligarAlternancia() {
    if (!listenersLigados) {
      listenersLigados = true;
      window.addEventListener("scroll", confere, { passive: true });
      window.addEventListener("resize", confere, { passive: true });
    }
    estado = {}; // rota nova: nenhum limiar tem estado conhecido ainda
    confere();
  }

  function ligarRevelacao() {
    var alvos = [];
    var todos = document.querySelectorAll("[data-cid]");
    for (var i = 0; i < todos.length; i++) {
      if (getComputedStyle(todos[i]).getPropertyValue("--ditto-revelar").trim() === "1") {
        alvos.push(todos[i]);
      }
    }
    if (!alvos.length) return;

    function revelar(el) {
      el.classList.add("ditto-revelado");
    }
    // 🚨 REDE DE SEGURANÇA, CONSCIENTE DA JANELA. O estado oculto vem do CSS:
    // se o observador não existir ou não disparar (aba em segundo plano ao
    // carregar, navegador antigo, elemento de altura zero), o conteúdo
    // ficaria escondido para sempre.
    //
    // ⚠️ Mas revelar TUDO de uma vez MATA a revelação: medido no framer-3, os
    // 146 alvos da home aparecem juntos aos 4s e, dali em diante, rolar não
    // anima mais nada. O defeito fica escondido enquanto a hidratação apaga a
    // classe ditto-js (aí nada é ocultado, e a rede não tem o que revelar).
    //
    // Agora a rede só resgata o que JÁ DEVERIA estar visível, e segue
    // vigiando o resto — a garantia continua (nada some para sempre) sem
    // custar a animação.
    var rede = setInterval(function () {
      var h = window.innerHeight || document.documentElement.clientHeight;
      var restam = 0;
      for (var i = 0; i < alvos.length; i++) {
        var el = alvos[i];
        if (el.classList.contains("ditto-revelado")) continue;
        if (el.getBoundingClientRect().top < h) revelar(el); else restam++;
      }
      if (!restam) clearInterval(rede);
    }, 4000);

    if (!("IntersectionObserver" in window)) {
      alvos.forEach(revelar);
      clearInterval(rede);
      return;
    }
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        obs.unobserve(e.target);
        revelar(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.01 });
    alvos.forEach(function (el) { obs.observe(el); });
  }

  function ligar() {
    ligarAlternancia();
    ligarRevelacao();
  }

  // 🚨 REEXECUTÁVEL, e por isso IDEMPOTENTE.
  //
  // Com navegação client-side o documento não recarrega: este arquivo roda uma
  // vez só, na primeira página. Sem um jeito de religar, toda rota visitada
  // depois da primeira fica sem comportamento nenhum — e o defeito é traiçoeiro
  // porque a primeira página funciona.
  //
  // Quem religa é o componente de navegação, chamando window.__dittoLigar()
  // depois da troca de rota. Ligar duas vezes não pode causar dano: o
  // observador só pega quem ainda tem --ditto-revelar sem .ditto-revelado, e o
  // listener de scroll é registrado uma vez só.
  window.__dittoLigar = ligar;

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ligar);
  else ligar();
})();
`;

  if (!ESCREVER || !APP) {
    console.log(`\n(simulação — não escrevi)\n`);
    console.log(css.split("\n").slice(0, 30).join("\n"));
    process.exit(0);
  }

  const pastaRota =
    ROTA === "/" ? join(APP, "src", "app") : join(APP, "src", "app", ...ROTA.split("/").filter(Boolean).map(decodificarSegmento));
  if (!existsSync(pastaRota)) {
    console.error(`❌ pasta da rota não existe: ${pastaRota}`);
    process.exit(1);
  }
  const alvoCss = join(pastaRota, "scroll.css");
  writeFileSync(alvoCss, costurar(alvoCss, css), "utf8");
  writeFileSync(join(APP, "public", "scroll.js"), js, "utf8");
  console.log(`\n✅ ${join(pastaRota, "scroll.css")}  (${cAlterna.length} alternam, ${cRevela.length} revelam)`);
  console.log(`✅ ${join(APP, "public", "scroll.js")}  (runtime genérico, sem dado de rota)`);
})();
