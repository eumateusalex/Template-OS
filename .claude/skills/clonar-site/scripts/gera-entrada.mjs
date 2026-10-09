// gera-entrada.mjs — devolve ao clone a animação de entrada que ele perdeu.
//
// Entra: o `movimento.json` do inventario-movimento.mjs, medido no ORIGINAL.
// Sai:   `public/entrada.css` no app do clone, mais o <link> no layout.
//
// 🚨 Nenhum número é digitado. Duração, atraso, ease e propriedades saem da
// medição. Se um valor daqui estiver errado, o erro está na medição, não num
// chute — e é isso que torna o resultado conferível.
//
// Como o elemento do original vira elemento do clone: por GEOMETRIA. O clone
// tem a mesma altura de página do original (medido: 0px de diferença em 21
// rotas), então a caixa (x,y,w,h) casa. Achado o elemento no clone, a regra é
// escrita contra o `data-cid` dele, que é seletor estável e já existe no
// código gerado.
//
// Uso:
//   MOV=<movimento.json> CLONE=http://127.0.0.1:8081 APP=<pasta>/app \
//   node gera-entrada.mjs
//
// Variáveis:
//   MOV     movimento.json do original (obrigatória)
//   CLONE   URL base do clone servido (obrigatória)
//   APP     raiz do app gerado (obrigatória)
//   ROTA    rota a tratar (padrão: /)
//   TOL     tolerância de casamento de caixa em px (padrão: 6)
//   DITTO   raiz do ditto (padrão: C:/dev/ditto)

import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const MOV = process.env.MOV;
const CLONE = process.env.CLONE;
const APP = process.env.APP;
if (!MOV || !CLONE || !APP) {
  console.error("faltam MOV, CLONE e/ou APP");
  process.exit(1);
}
const ROTA = process.env.ROTA ?? "/";
const TOL = Number(process.env.TOL ?? 6);
// 🚨 Teto de duração: entrada que dura MUITO não é entrada, é laço lido errado.
// Medido no framer-4: a WAAPI reportou 10.000ms no contêiner do menu, que é o
// texto rolante da nav. Escrito como `animation ... both`, o elemento fica
// eternamente "animando" e o navegador nunca o considera estável: os 5 links
// do menu passaram a dar TIMEOUT no hover, num clone onde o original responde.
// A camada tinha piorado o clone, e só a medição de interação acusou.
const MAX_DUR = Number(process.env.MAX_DUR ?? 4000);
const DITTO = process.env.DITTO ?? "C:/dev/ditto";

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

const medicao = JSON.parse(readFileSync(MOV, "utf8"));
const largura = medicao.largura ?? 1280;
const brutas = (medicao.fonteA_waapi?.animacoesDoLoad ?? []).filter((a) => a.assinatura);

// Juntar por elemento: opacity e filter do mesmo elemento são UMA entrada.
const porElemento = new Map();
for (const a of brutas) {
  const s = a.assinatura;
  if (!s.w || !s.h) continue; // caixa 0x0 não casa com nada; pular declarando
  const chave = [s.x, s.y, s.w, s.h].join(",");
  if (!porElemento.has(chave)) porElemento.set(chave, { s, props: new Set(), dur: 0, atraso: Infinity, ease: null, keyframes: [] });
  const e = porElemento.get(chave);
  for (const p of a.propriedades) e.props.add(p);
  e.dur = Math.max(e.dur, Number(a.duracao) || 0);
  e.atraso = Math.min(e.atraso, Number(a.atraso) || 0);
  if (!e.ease) e.ease = a.ease;
  if (a.keyframes?.length) e.keyframes.push(...a.keyframes);
}
const pulados0x0 = brutas.filter((a) => !a.assinatura.w || !a.assinatura.h).length;

const todosAlvos = [...porElemento.values()].sort((a, b) => a.s.y - b.s.y);
const longos = todosAlvos.filter((a) => a.dur > MAX_DUR);
const alvos = todosAlvos.filter((a) => a.dur <= MAX_DUR);
console.log(`medição: ${brutas.length} animações → ${todosAlvos.length} elementos animados`);
if (pulados0x0) console.log(`  ⚠️ ${pulados0x0} animação(ões) em elemento 0x0, puladas (não há como casar por caixa)`);
if (longos.length) {
  console.log(`  ⚠️ ${longos.length} com duração > ${MAX_DUR}ms — NÃO são entrada, são laço lido errado (declarados):`);
  for (const l of longos) {
    console.log(`     ${l.dur}ms  y=${l.s.y} ${l.s.w}x${l.s.h}${l.s.texto ? ' "' + l.s.texto.slice(0, 28) + '"' : ""}`);
  }
}

// ---- casar cada alvo com o elemento correspondente no clone ----------------
const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: largura, height: 900 } });
const page = await ctx.newPage();
await page.goto(new URL(ROTA, CLONE).href + "?_v=" + Date.now(), { waitUntil: "networkidle", timeout: 60000 });
await page.evaluate(async () => {
  const passo = Math.max(200, window.innerHeight * 0.8);
  for (let y = 0; y < document.body.scrollHeight; y += passo) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 60));
  }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 200));
});

const casados = await page.evaluate(
  ({ alvos, TOL }) => {
    const todos = Array.from(document.querySelectorAll("[data-cid]"));
    // 🚨 Desligar a animação que uma rodada ANTERIOR deste mesmo instrumento
    // escreveu, antes de ler caixa e transform de base. Com `fill: both` o
    // estado final da animação É o estilo computado: lido como "base", ele
    // volta para dentro do keyframe novo e o deslocamento se EMPILHA a cada
    // rodada. Medido no framer-4: `/projects` saiu de 2 elementos fora do
    // lugar (clone puro) para 42, todos com o mesmo dy=+15,5px, que é
    // exatamente o `translateY` que o keyframe da rodada anterior deixou.
    const animacoesSalvas = todos.map((el) => el.style.animation);
    for (const el of todos) el.style.animation = "none";
    void document.body.offsetHeight; // força o reflow antes de medir
    const caixas = todos.map((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        el,
        cid: el.getAttribute("data-cid"),
        // 🚨 O transform e o filter que o elemento JÁ TEM. Sem eles, o
        // keyframe compartilhado termina em `transform:none` e APAGA o
        // transform de base — que num site de construtor costuma ser a
        // centralização do elemento.
        transformBase: cs.transform === "none" ? null : cs.transform,
        filtroBase: cs.filter === "none" ? null : cs.filter,
        x: Math.round(r.left + window.scrollX),
        y: Math.round(r.top + window.scrollY),
        w: Math.round(r.width),
        h: Math.round(r.height),
        texto: (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60),
      };
    });
    for (let i = 0; i < todos.length; i++) todos[i].style.animation = animacoesSalvas[i];
    return alvos.map((a) => {
      const s = a.s;
      const candidatos = caixas
        .map((c) => ({
          c,
          erro: Math.abs(c.x - s.x) + Math.abs(c.y - s.y) + Math.abs(c.w - s.w) + Math.abs(c.h - s.h),
        }))
        .filter((v) => v.erro <= TOL * 4)
        .sort((p, q) => p.erro - q.erro);
      // Desempate por texto: duas caixas idênticas com textos diferentes não
      // são o mesmo elemento.
      const comTexto = s.texto ? candidatos.filter((v) => v.c.texto === s.texto) : [];
      const escolhido = (comTexto[0] ?? candidatos[0]) || null;
      return escolhido
        ? {
            cid: escolhido.c.cid,
            erro: escolhido.erro,
            texto: escolhido.c.texto,
            transformBase: escolhido.c.transformBase,
            filtroBase: escolhido.c.filtroBase,
          }
        : null;
    });
  },
  { alvos: alvos.map((a) => ({ s: a.s })), TOL },
);
await navegador.close();

/** 🚨 O minificador do Next CORTA o `%` do primeiro stop de `linear()`.
 *
 *  Provado ponta a ponta nesta construção:
 *    fonte:  linear(0 0%, 0.0063 1.26%, ...)
 *    build:  linear(0 0,  .0063 1.26%, ...)
 *  `0 0` não é posição válida, a função inteira fica inválida, e o navegador
 *  descarta a declaração `animation` INTEIRA — `animation-name` vira `none`.
 *  Custou 2 dos 12 elementos animados, sem erro nenhum em lugar nenhum.
 *
 *  O primeiro stop de `linear()` já tem 0% por padrão, então escrever sem a
 *  posição é equivalente e não deixa `%` para o minificador cortar. */
function easeSeguro(ease) {
  if (!ease || !ease.startsWith("linear(")) return ease;
  return ease.replace(/^linear\(\s*([\d.]+)\s+0%\s*,/, "linear($1,");
}

// ---- quem o scroll.css já reivindicou não entra aqui ------------------------
//
// 🚨 Duas camadas escrevendo `opacity`/`transform` no MESMO elemento brigam em
// silêncio, e quem ganha depende da ordem de import. A entrada cuida do que
// anima ao CARREGAR; a revelação por scroll cuida do que anima ao APARECER na
// tela. O mesmo elemento não pode estar nos dois.
// 🚨 A rota vem PERCENT-ENCODED (é assim que ela existe no original), mas a
// pasta no disco tem o caractere literal. Sem decodificar, toda rota com
// acento ou unicode aponta para uma pasta que não existe e o instrumento
// aborta. Medido no framer-7: /blog/...director%E2%80%99s-... falhou com
// "entrada: status 1" enquanto as outras 11 rotas passaram.
const decodificarSegmento = (s) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s; // encoding malformado: seguir com o cru, nunca derrubar o instrumento
  }
};
const dirRotaPrevia =
  ROTA === "/"
    ? // 🚨 A home pode ter mudado para o grupo de rotas `(inicio)` (ver
      // entrega-inline.mjs): lá ela ganha layout próprio, que a raiz não pode
      // ter. Quem escreve folha por rota precisa procurar o grupo PRIMEIRO —
      // senão recria o arquivo em src/app, que ninguém importa, e a correção
      // parece feita sem nunca chegar à página.
      existsSync(join(APP, "src", "app", "(inicio)", "page.tsx"))
      ? join(APP, "src", "app", "(inicio)")
      : join(APP, "src", "app")
    : join(APP, "src", "app", ...ROTA.split("/").filter(Boolean).map(decodificarSegmento));
let cidsDoScroll = new Set();
try {
  const cssScroll = readFileSync(join(dirRotaPrevia, "scroll.css"), "utf8");
  cidsDoScroll = new Set([...cssScroll.matchAll(/data-cid="([^"]+)"/g)].map((m) => m[1]));
} catch {
  /* sem scroll.css nesta rota: nada a excluir */
}

// ---- gerar o CSS -----------------------------------------------------------
const regras = [];
const quadros = [];
const naoCasados = [];
const saidas = []; // animacoes de SAIDA lidas no meio do laco — declaradas, nunca escritas como entrada
const cidsAnimados = [];
let cedidosAoScroll = 0;
alvos.forEach((a, i) => {
  const m = casados[i];
  if (!m) {
    naoCasados.push(a);
    return;
  }
  if (cidsDoScroll.has(m.cid)) {
    cedidosAoScroll++;
    return;
  }
  cidsAnimados.push(m.cid);
  const temBlur = a.props.has("filter");
  const temTransform = a.props.has("transform");

  // 🚨 QUANDO O ELEMENTO JÁ TEM TRANSFORM OU FILTER, o keyframe compartilhado
  // não serve: ele termina em `transform:none`/`filter:blur(0)` e, com
  // `fill-mode: both`, APAGA o valor de base PARA SEMPRE.
  //
  // Medido nesta construção: `matrix(1,0,0,1,-121.359,100)` virou
  // `matrix(1,0,0,1,0,-71)` e o elemento andou 121px na horizontal sem ninguém
  // pedir. Aqui se escreve um keyframe próprio que COMPÕE com a base —
  // `matrix(...) translateY(20px)` é lista de transform válida e preserva o X.
  // 🚨 O ESTADO INICIAL SAI DA MEDIÇÃO, NUNCA DE UM PADRÃO.
  // Esta função lê os keyframes que a WAAPI devolveu e pega o valor do offset
  // 0 de cada propriedade. Medido no site-next: o site abre com `blur(1.5px)`, e um
  // padrão fixo de `blur(10px)` seria quase 7× mais forte, um borrão onde o
  // original tem um véu. Nenhuma medição de geometria acusaria,
  // porque a caixa final é a mesma.
  const inicial = (prop) => {
    const ordenados = [...(a.keyframes ?? [])].sort(
      (x, y) => (x.offsetComputado ?? x.offset ?? 0) - (y.offsetComputado ?? y.offset ?? 0),
    );
    for (const k of ordenados) {
      if (k[prop] != null && (k.offsetComputado ?? k.offset ?? 0) === 0) return String(k[prop]);
    }
    return null;
  };
  const opacidadeInicial = inicial("opacity") ?? "0";
  const filtroInicial = inicial("filter");
  const transformInicial = inicial("transform");

  // 🚨 NEM TODA ANIMAÇÃO CAPTURADA NO LOAD É ENTRADA.
  // O coletor roda por 8s e pega o site no meio do ciclo, então demos em laço
  // aparecem na fase de SAÍDA. Medido no site-next: 26 dos 85 registros são
  // `opacity 1→0` ou blur AUMENTANDO — passos de "agente pensando" e crossfade
  // de telas de produto. Escrevê-los como entrada gera regra que não faz nada
  // (`from opacity:1 to opacity:1`) ou, pior, deixa o elemento preso invisível
  // com `fill: both`. Quem entra fica; quem sai é declarado e pulado.
  const finalOpacidade = (() => {
    const ord = [...(a.keyframes ?? [])].sort(
      (x, y) => (x.offsetComputado ?? x.offset ?? 0) - (y.offsetComputado ?? y.offset ?? 0),
    );
    for (let k = ord.length - 1; k >= 0; k--) if (ord[k].opacity != null) return Number(ord[k].opacity);
    return 1;
  })();
  const desaparece = Number(opacidadeInicial) >= finalOpacidade && Number(opacidadeInicial) > 0;
  const borraMais = (() => {
    const n = (s) => Number(/blur\(([0-9.]+)/.exec(s ?? "")?.[1] ?? 0);
    const ord = [...(a.keyframes ?? [])].sort(
      (x, y) => (x.offsetComputado ?? x.offset ?? 0) - (y.offsetComputado ?? y.offset ?? 0),
    );
    const comFiltro = ord.filter((k) => k.filter != null);
    if (comFiltro.length < 2) return false;
    return n(comFiltro[comFiltro.length - 1].filter) > n(comFiltro[0].filter);
  })();
  if (desaparece || borraMais) {
    saidas.push({ s: a.s, motivo: desaparece ? "opacity não cresce" : "blur aumenta" });
    return;
  }

  let nome;
  if (temTransform && (transformInicial || m.transformBase)) {
    nome = `dittoEntrada_${m.cid}`;
    // valor medido quando existir; senão compõe com a base para não apagá-la
    const de = transformInicial ?? `${m.transformBase} translateY(20px)`;
    const ate = m.transformBase || "none";
    quadros.push(`@keyframes ${nome}{from{opacity:${opacidadeInicial};transform:${de}}to{opacity:1;transform:${ate}}}`);
  } else if (temBlur && (filtroInicial || m.filtroBase)) {
    nome = `dittoEntrada_${m.cid}`;
    const de = filtroInicial ?? `${m.filtroBase} blur(10px)`;
    const ate = m.filtroBase || "blur(0px)";
    quadros.push(`@keyframes ${nome}{from{opacity:${opacidadeInicial};filter:${de}}to{opacity:1;filter:${ate}}}`);
  } else if (opacidadeInicial !== "0") {
    // fade que não começa em zero (ex.: 0.5 do banner de cookies) também é medido
    nome = `dittoEntrada_${m.cid}`;
    quadros.push(`@keyframes ${nome}{from{opacity:${opacidadeInicial}}to{opacity:1}}`);
  } else {
    nome = temBlur ? "dittoEntradaBlur" : temTransform ? "dittoEntradaSobe" : "dittoEntradaFade";
  }

  regras.push(
    `[data-cid="${m.cid}"]{animation:${nome} ${a.dur}ms ${easeSeguro(a.ease)} ${a.atraso}ms both}` +
      `  /* y=${a.s.y} ${a.s.w}x${a.s.h}${a.s.texto ? ' "' + a.s.texto.slice(0, 28) + '"' : ""} erro=${m.erro}px${m.transformBase ? " base=composto" : ""} */`,
  );
});
if (cedidosAoScroll) {
  console.log(`  ↪️ ${cedidosAoScroll} elemento(s) cedido(s) ao scroll.css (revelação ao entrar na tela)`);
}

// 🚨 A regra vale SÓ na faixa em que foi medida. Sem isto, um atraso e uma
// curva medidos a 1280px passariam a valer a 375px, onde o original escalona
// outra coisa (ou não escalona nada).
const FAIXA =
  process.env.FAIXA ??
  (largura >= 1024
    ? "(min-width: 1024px)"
    : largura >= 768
      ? "(min-width: 768px) and (max-width: 1023.98px)"
      : "(max-width: 767.98px)");

const css = `/* entrada.css — animação de entrada reconstruída a partir de medição do
   original por scripts/gera-entrada.mjs. Nenhum número foi digitado à mão.
   Origem: ${medicao.site} @${largura}px · faixa: ${FAIXA}
   ${alvos.length} elementos medidos, ${regras.length} escritos no clone.
   ${quadros.length} com keyframe PRÓPRIO, com o estado inicial MEDIDO no
   original (blur, transform e opacity saem do keyframe da WAAPI, não de padrão).
   Os três genéricos abaixo só entram onde a medição não trouxe valor inicial. */

@keyframes dittoEntradaFade{from{opacity:0}to{opacity:1}}
@keyframes dittoEntradaBlur{from{opacity:0;filter:blur(10px)}to{opacity:1;filter:blur(0)}}
@keyframes dittoEntradaSobe{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
${quadros.join("\n")}

@media ${FAIXA} {
${regras.join("\n")}
}

/* 🚨 Quem desativou animação recebe o ESTADO FINAL, sem movimento — nunca a
   página invisível. Obrigatório mesmo quando o original não faz isso.
   Escopado nos cids desta rota, não em [data-cid] inteiro. */
@media (prefers-reduced-motion: reduce){
  ${cidsAnimados.length ? cidsAnimados.map((c) => `[data-cid="${c}"]`).join(",") + "{animation:none !important}" : ""}
}
`;

// ---- gravar DENTRO da pasta da rota ---------------------------------------
// 🚨 `data-cid` COLIDE entre rotas: `n61` existe nas 21 páginas do clone. Um
// `public/entrada.css` ligado no layout raiz aplicaria a animação da home em
// TODAS as rotas, animando elemento que não tem nada a ver.
//
// O escopo vem de ONDE o CSS é importado: um `entrada.css` na pasta da rota,
// importado pela `page.tsx` dela, só é carregado naquela rota. É o mesmo
// padrão que o ditto já usa com o `ditto.css`.
// mesma decodificação do dirRotaPrevia: rota codificada, pasta literal
const dirRota =
  ROTA === "/"
    ? // 🚨 o grupo `(inicio)` vem antes da raiz — ver o comentário no dirRotaPrevia
      existsSync(join(resolve(APP), "src", "app", "(inicio)", "page.tsx"))
      ? join(resolve(APP), "src", "app", "(inicio)")
      : join(resolve(APP), "src", "app")
    : join(resolve(APP), "src", "app", ...ROTA.split("/").filter(Boolean).map(decodificarSegmento));
if (!existsSync(dirRota)) {
  console.error(`\npasta da rota não existe: ${dirRota}`);
  process.exit(1);
}
const arquivoCss = join(dirRota, "entrada.css");
mkdirSync(dirRota, { recursive: true });
writeFileSync(arquivoCss, css, "utf8");

// ---- importar na page.tsx da rota -----------------------------------------
const arquivoPage = join(dirRota, "page.tsx");
let ligado = false;
if (existsSync(arquivoPage)) {
  const fonte = readFileSync(arquivoPage, "utf8");
  if (fonte.includes('"./entrada.css"')) {
    ligado = true; // idempotente
  } else {
    // Depois do import do ditto.css, para a entrada vencer na cascata.
    const marca = 'import "./ditto.css";';
    const novo = fonte.includes(marca)
      ? fonte.replace(marca, marca + '\nimport "./entrada.css";')
      : 'import "./entrada.css";\n' + fonte;
    writeFileSync(arquivoPage, novo, "utf8");
    ligado = true;
  }
}

console.log(`\ncasados no clone: ${regras.length}/${alvos.length}`);
if (saidas.length) {
  console.log(`  ⚠️ ${saidas.length} animação(ões) de SAÍDA lidas no meio do laço (não são entrada; declaradas e puladas):`);
  for (const s of saidas.slice(0, 8)) {
    console.log(`     ${s.motivo}  y=${s.s.y} ${s.s.w}x${s.s.h}${s.s.texto ? ' "' + s.s.texto.slice(0, 28) + '"' : ""}`);
  }
  if (saidas.length > 8) console.log(`     … e mais ${saidas.length - 8}`);
}
if (naoCasados.length) {
  console.log(`⚠️ ${naoCasados.length} NÃO casaram (declarados, nunca silenciados):`);
  for (const a of naoCasados) console.log(`   y=${a.s.y} ${a.s.w}x${a.s.h} "${a.s.texto.slice(0, 40)}"`);
}
console.log(`css  -> ${arquivoCss}`);
console.log(`import na page: ${ligado ? "ok" : "NÃO CONSEGUI — ligar à mão"}`);
console.log(`escopo: só a rota ${ROTA} carrega este CSS`);
