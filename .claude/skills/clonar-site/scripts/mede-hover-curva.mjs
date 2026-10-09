// mede-hover-curva.mjs — a CURVA do hover, não só os dois extremos.
//
// 🚨 Por que existe. O `mede-interacao.mjs` é um censo: passa o mouse, espera
// 450ms, tira uma foto; tira o mouse, espera 550ms, tira outra. Com isso o
// `gera-interacao.mjs` escreve um `:hover` que troca de estado INSTANTANEAMENTE
// — e a transição inteira do original, que é o que a pessoa vê, some.
// Medido no framer-5: o original tem 48 alvos com mudança de
// hover em 3 rotas e o clone reproduz 4, nenhum com transição.
//
// E a foto de 450ms não é sequer confiável para o VALOR final: hover com
// transição mais longa que isso é fotografado em pleno voo, e vira estado de
// repouso errado — a mesma classe de defeito que o ditto comete sozinho
// ("o ditto gera :hover com valor capturado NO MEIO da animação").
//
// O que este instrumento faz, por alvo:
//   1. lê o `transition*` COMPUTADO nos dois estados (custa zero e resolve o
//      hover feito por transição CSS, que é a maioria);
//   2. amostra por rAF a IDA (pointerover) e a VOLTA (pointerout) SEPARADAS —
//      elas têm durações e curvas diferentes, e sempre tiveram;
//   3. declara o regime: `transicao`, `instantaneo` (≤2 quadros: o fiel é NÃO
//      escrever transition) ou `continuo` (hover que dispara laço; declarado,
//      nunca virado transition).
//
// ⚠️ Não se amostram os 48 alvos: amostram-se as ASSINATURAS. "Link que muda
// color", "botão que muda bg+color" e "card que escala a imagem" são a mesma
// curva escrita N vezes. O JSON diz quais índices cada assinatura representa.
//
// Uso:
//   SITE=https://site.com ROTA=/ ALVOS=./interacao/interacao.json \
//   SAIDA=./hover-curva node mede-hover-curva.mjs
//
// Variáveis: SITE ROTA ALVOS SAIDA LARGURA MAX_CURVA TETO_MS ESTAVEL_MS DITTO

import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { createRequire } from "node:module";

const SITE = process.env.SITE;
if (!SITE) {
  console.error("falta SITE=<url>");
  process.exit(1);
}
const ROTA = process.env.ROTA ?? "/";
const ALVOS = process.env.ALVOS;
const SAIDA = resolve(process.env.SAIDA ?? "./hover-curva");
const LARGURA = Number(process.env.LARGURA ?? 1280);
const MAX_CURVA = Number(process.env.MAX_CURVA ?? 12);
const TETO_MS = Number(process.env.TETO_MS ?? 3000);
const ESTAVEL_MS = Number(process.env.ESTAVEL_MS ?? 250);
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
mkdirSync(SAIDA, { recursive: true });

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

// Propriedades que fazem sentido animar. `display`/`visibility` ficam de fora:
// não interpolam, e entrariam na curva como degrau falso.
const ANIMAVEIS = new Set([
  "transform", "opacity", "filter", "backgroundColor", "color", "borderColor",
  "borderRadius", "boxShadow", "width", "height", "left", "top", "scale",
  "rotate", "translate", "letterSpacing",
]);

// ---------- leitura do censo ----------

function candidatos() {
  if (!ALVOS || !existsSync(ALVOS)) {
    console.error(`falta ALVOS=<interacao.json> (não achei "${ALVOS}")`);
    process.exit(1);
  }
  const j = JSON.parse(readFileSync(ALVOS, "utf8"));
  const lista = j.medidos ?? j.alvos ?? [];
  const out = [];
  for (const m of lista) {
    if (!m || m.pulado || m.morto || m.erro) continue;
    const h = m.hover ?? {};
    const props = Object.keys(h).filter((k) => ANIMAVEIS.has(k));
    if (!props.length) continue;
    out.push({
      i: m.i,
      tag: m.tag,
      texto: (m.texto ?? "").slice(0, 40),
      docX: m.docX,
      docY: m.docY,
      props,
      hover: h,
      pontoBom: m.pilha?.pontoBom ?? null,
    });
  }
  return out;
}

// Assinatura: o que faz duas curvas serem A MESMA curva. Cor quantizada em 8
// níveis por canal e px arredondado — variação de matiz entre dois links não
// muda a duração nem a forma da transição.
function assinatura(c) {
  const quant = (v) =>
    String(v)
      .replace(/(\d+\.?\d*)/g, (n) => String(Math.round(Number(n) / 32) * 32))
      .replace(/\s+/g, "");
  const pares = c.props
    .slice()
    .sort()
    .map((p) => p + ":" + quant(c.hover[p][0]) + ">" + quant(c.hover[p][1]))
    .join("|");
  return c.tag + "|" + pares;
}

// ---------- coletor por rAF, injetado na página ----------

const COLETOR = ({ props, tetoMs, estavelMs, evento }) =>
  new Promise((resolve) => {
    const el = document.querySelector("[data-hovercurva]");
    if (!el) return resolve({ erro: "sem elemento marcado" });
    const ler = () => {
      const cs = getComputedStyle(el);
      const o = {};
      for (const p of props) o[p] = cs[p];
      return o;
    };
    const amostras = [];
    const inicio = performance.now();
    let tEvento = null;
    const marcar = () => {
      if (tEvento === null) tEvento = performance.now() - inicio;
    };
    el.addEventListener(evento, marcar, { once: true });

    let anterior = ler();
    let ultimaMudanca = 0;
    amostras.push({ t: 0, v: anterior });

    const passo = () => {
      const t = performance.now() - inicio;
      const v = ler();
      let mudou = false;
      for (const p of props) if (v[p] !== anterior[p]) { mudou = true; break; }
      if (mudou) { ultimaMudanca = t; anterior = v; }
      amostras.push({ t, v });
      const parado = t - ultimaMudanca >= estavelMs;
      if ((parado && amostras.length > 3) || t >= tetoMs) {
        el.removeEventListener(evento, marcar);
        return resolve({
          amostras,
          tEvento,
          estourouTeto: t >= tetoMs && !parado,
          declarado: (() => {
            const cs = getComputedStyle(el);
            return {
              property: cs.transitionProperty,
              duration: cs.transitionDuration,
              timingFunction: cs.transitionTimingFunction,
              delay: cs.transitionDelay,
            };
          })(),
        });
      }
      requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  });

// ---------- análise da série ----------

const numeros = (s) => (String(s).match(/-?\d+\.?\d*(e-?\d+)?/g) || []).map(Number);

/** Progresso 0..1 de uma amostra, pela norma da distância até o valor final.
 *  Usa a propriedade de maior excursão como dominante — é ela que a curva
 *  descreve; as outras costumam andar junto. */
function analisar(amostras, props) {
  if (!amostras || amostras.length < 2) return null;
  const v0 = amostras[0].v;
  const vf = amostras[amostras.length - 1].v;

  let dominante = null;
  let maiorExcursao = 0;
  for (const p of props) {
    const a = numeros(v0[p]);
    const b = numeros(vf[p]);
    if (!a.length || a.length !== b.length) continue;
    let d = 0;
    for (let k = 0; k < a.length; k++) d += (b[k] - a[k]) ** 2;
    d = Math.sqrt(d);
    if (d > maiorExcursao) { maiorExcursao = d; dominante = p; }
  }
  const mudaram = props.filter((p) => v0[p] !== vf[p]);
  if (!dominante || maiorExcursao === 0) {
    return { regime: mudaram.length ? "sem-curva-numerica" : "sem-mudanca", props: mudaram, de: v0, para: vf };
  }

  const a0 = numeros(v0[dominante]);
  const af = numeros(vf[dominante]);
  const prog = (v) => {
    const a = numeros(v[dominante]);
    if (a.length !== a0.length) return null;
    let num = 0;
    for (let k = 0; k < a.length; k++) num += (a[k] - a0[k]) * (af[k] - a0[k]);
    return num / (maiorExcursao * maiorExcursao);
  };

  // primeiro e último quadro que MEXERAM: fora deles é atraso e assentamento
  let iPrim = -1, iUlt = -1;
  for (let k = 1; k < amostras.length; k++) {
    let dif = false;
    for (const p of props) if (amostras[k].v[p] !== amostras[k - 1].v[p]) { dif = true; break; }
    if (dif) { if (iPrim < 0) iPrim = k; iUlt = k; }
  }
  if (iPrim < 0) return { regime: "sem-mudanca", props: [], de: v0, para: vf };

  const tIni = amostras[iPrim - 1].t;
  const tFim = amostras[iUlt].t;
  const dur = Math.round(tFim - tIni);
  const quadros = iUlt - iPrim + 1;

  // 25 pontos, reamostrados por interpolação linear no tempo normalizado
  const N = 25;
  const curva = [];
  for (let k = 0; k < N; k++) {
    const alvo = tIni + ((tFim - tIni) * k) / (N - 1);
    let j = iPrim - 1;
    while (j < amostras.length - 1 && amostras[j + 1].t < alvo) j++;
    const A = amostras[j], B = amostras[Math.min(j + 1, amostras.length - 1)];
    const pa = prog(A.v), pb = prog(B.v);
    if (pa === null || pb === null) { curva.push(k / (N - 1)); continue; }
    const f = B.t === A.t ? 0 : (alvo - A.t) / (B.t - A.t);
    curva.push(Math.max(0, Math.min(1, pa + (pb - pa) * f)));
  }
  curva[0] = 0;
  curva[N - 1] = 1;

  return {
    regime: quadros <= 2 ? "instantaneo" : "transicao",
    dominante,
    props: mudaram,
    de: Object.fromEntries(mudaram.map((p) => [p, v0[p]])),
    para: Object.fromEntries(mudaram.map((p) => [p, vf[p]])),
    atrasoMs: Math.round(tIni),
    duracaoMs: dur,
    quadros,
    curva: curva.map((x) => Math.round(x * 1e4) / 1e4),
    curvaLinear: "linear(" + curva.map((x) => Math.round(x * 1e4) / 1e4).join(", ") + ")",
  };
}

// ---------- execução ----------

const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: LARGURA, height: 900 } });
const page = await ctx.newPage();

const todos = candidatos();
const porAssinatura = new Map();
for (const c of todos) {
  const a = assinatura(c);
  if (!porAssinatura.has(a)) porAssinatura.set(a, []);
  porAssinatura.get(a).push(c);
}
const escolhidos = [];
for (const [a, grupo] of porAssinatura) {
  grupo.sort((x, y) => (y.props.length - x.props.length) || (x.i - y.i));
  escolhidos.push({ ...grupo[0], assinatura: a, representa: grupo.map((g) => g.i) });
  if (escolhidos.length >= MAX_CURVA) break;
}
console.log(
  `${todos.length} alvos com hover no censo → ${porAssinatura.size} assinaturas → amostrando ${escolhidos.length}`
);

const url = new URL(ROTA, SITE).href + (SITE.includes("127.0.0.1") ? "?_v=" + Date.now() : "");
const amostrados = [];
const naoAmostrados = [];

// A MESMA marcação do mede-interacao, para que o índice `i` do censo aponte
// para o mesmo nó. Se o texto não bater, o alvo é declarado e pulado — casar
// por índice sem conferir é como o casamento por índice erra sempre.
const MARCAR = (MAX) => {
  const sel =
    'a[href], button, input, select, textarea, [role="button"], [role="tab"], [tabindex]:not([tabindex="-1"]), summary';
  const todos = Array.from(document.querySelectorAll(sel));
  for (const el of document.querySelectorAll("div,p,span,li")) {
    if (todos.includes(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.cursor !== "pointer") continue;
    if (el.parentElement && getComputedStyle(el.parentElement).cursor === "pointer") continue;
    if (el.closest("a[href], button")) continue;
    todos.push(el);
  }
  let n = 0;
  for (const el of todos) {
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) continue;
    el.setAttribute("data-medir", String(n));
    n++;
    if (n >= MAX) break;
  }
  return n;
};

for (const alvo of escolhidos) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.evaluate(MARCAR, Math.max(40, alvo.i + 1));

  const ok = await page.evaluate((info) => {
    const el = document.querySelector(`[data-medir="${info.i}"]`);
    if (!el) return { ok: false, motivo: "índice não existe nesta carga" };
    const texto = (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
    if (info.texto && texto !== info.texto) {
      return { ok: false, motivo: `texto mudou: censo="${info.texto}" agora="${texto}"` };
    }
    document.querySelectorAll("[data-hovercurva]").forEach((n) => n.removeAttribute("data-hovercurva"));
    el.setAttribute("data-hovercurva", "1");
    el.scrollIntoView({ block: "center", behavior: "instant" });
    return { ok: true };
  }, { i: alvo.i, texto: alvo.texto });

  if (!ok.ok) {
    naoAmostrados.push({ i: alvo.i, texto: alvo.texto, motivo: ok.motivo });
    console.log(`  [${alvo.i}] pulado: ${ok.motivo}`);
    continue;
  }
  // 🚨 O `scrollIntoView` acima ACABA de trazer o alvo para a tela, e é isso
  // que dispara a animação de revelação (400ms medidos no framer-5). Amostrar
  // logo em seguida colheria a revelação junto com o hover: o transform nunca
  // estabiliza, o coletor estoura o teto e o alvo é declarado "continuo" — um
  // laço que não existe. A espera é maior que a revelação, de propósito.
  await page.waitForTimeout(1100);

  const props = Array.from(new Set([...alvo.props, "transform", "opacity"]));
  const alvoLoc = page.locator("[data-hovercurva]");

  // IDA: coletor primeiro (sem await), hover depois — a curva começa no evento
  const coletaIda = page.evaluate(COLETOR, { props, tetoMs: TETO_MS, estavelMs: ESTAVEL_MS, evento: "pointerover" });
  try {
    await alvoLoc.hover({ timeout: 4000 });
  } catch (e) {
    naoAmostrados.push({ i: alvo.i, texto: alvo.texto, motivo: "hover falhou: " + String(e).slice(0, 60) });
    await coletaIda.catch(() => {});
    continue;
  }
  const ida = await coletaIda;

  // VOLTA: mesma dança, com o mouse indo embora
  const coletaVolta = page.evaluate(COLETOR, { props, tetoMs: TETO_MS, estavelMs: ESTAVEL_MS, evento: "pointerout" });
  await page.mouse.move(2, 2);
  const volta = await coletaVolta;

  const aIda = analisar(ida.amostras, props);
  const aVolta = analisar(volta.amostras, props);
  if (ida.estourouTeto && aIda) aIda.regime = "continuo";
  if (volta.estourouTeto && aVolta) aVolta.regime = "continuo";

  amostrados.push({
    i: alvo.i,
    tag: alvo.tag,
    texto: alvo.texto,
    docX: alvo.docX,
    docY: alvo.docY,
    assinatura: alvo.assinatura,
    representa: alvo.representa,
    propsDoCenso: alvo.props,
    declaradoRepouso: volta.declarado ?? null,
    declaradoHover: ida.declarado ?? null,
    ida: aIda,
    volta: aVolta,
  });

  const d = (x) => (x ? `${x.regime} ${x.duracaoMs ?? "-"}ms` : "—");
  console.log(`  [${alvo.i}] ${JSON.stringify(alvo.texto.slice(0, 24))} ida=${d(aIda)} volta=${d(aVolta)} (representa ${alvo.representa.length})`);
}

await navegador.close();

const rel = {
  site: SITE,
  rota: ROTA,
  largura: LARGURA,
  censo: ALVOS,
  totalComHoverNoCenso: todos.length,
  assinaturas: porAssinatura.size,
  amostrados,
  naoAmostrados,
};
const arq = join(SAIDA, "hover-curva.json");
writeFileSync(arq, JSON.stringify(rel, null, 2), "utf8");
console.log(`\n${amostrados.length} amostrados, ${naoAmostrados.length} pulados → ${arq}`);
