// gera-interacao.mjs — devolve ao clone os estados de hover que ele perdeu.
//
// Consome o `interacao.json` medido no ORIGINAL e escreve, na rota do clone, um
// CSS de `:hover` com as propriedades medidas.
//
// 🚨 Nenhum valor é digitado. Cada propriedade e cada valor vêm do par
// (repouso, hover) gravado no original com evento REAL do navegador.
//
// ⚠️ Isto cobre HOVER. Comportamento que exige lógica (acordeão que abre,
// modal, filtro de busca) não é estado de CSS — precisa de código, e o
// instrumento declara esses alvos em vez de fingir que resolveu.
//
// Uso:
//   MED=<medicoes>/interacao-original/interacao.json CLONE=http://127.0.0.1:8081 \
//   APP=<pasta>/app ROTA=/ node gera-interacao.mjs
//
// Variáveis:
//   MED    interacao.json medido no ORIGINAL (obrigatória)
//   CLONE  URL base do clone servido (obrigatória)
//   APP    raiz do app gerado (obrigatória)
//   ROTA   rota a tratar (padrão: /)
//   TOL    tolerância de casamento de caixa em px (padrão: 40)
//   DITTO  raiz do ditto (padrão: C:/dev/ditto)

import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const MED = process.env.MED;
const CLONE = process.env.CLONE;
const APP = process.env.APP;
if (!MED || !CLONE || !APP) {
  console.error("faltam MED, CLONE e/ou APP");
  process.exit(1);
}
const ROTA = process.env.ROTA ?? "/";
const TOL = Number(process.env.TOL ?? 40);
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
// CURVA: hover-curva.json do mede-hover-curva.mjs. Sem ele, o hover sai
// INSTANTÂNEO — que é o que este gerador fazia sozinho, e é errado sempre que
// o original tem transição.
const CURVA = process.env.CURVA;

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

const medicao = JSON.parse(readFileSync(MED, "utf8"));
const largura = medicao.largura ?? 1280;

// Só propriedades que fazem sentido como estado de hover em CSS.
// `display` e `visibility` ficam de fora: mudança ali é lógica, não estilo.
const PROPS_CSS = new Set([
  "transform", "opacity", "filter", "backgroundColor", "color", "borderColor",
  "borderRadius", "boxShadow", "scale", "rotate", "translate",
  "textDecorationLine", "letterSpacing",
]);

const camelParaCss = (p) => p.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());

// Alvos do original que respondem a hover com propriedade estilizável.
const comHover = medicao.medidos.filter((m) => {
  const h = m.hover ?? {};
  return Object.keys(h).some((k) => PROPS_CSS.has(k));
});

console.log(`medição do original: ${medicao.medidos.length} alvos, ${comHover.length} com hover estilizável`);

// Alvos que mudam por LÓGICA, não por estilo — declarados, não fingidos.
const exigemCodigo = medicao.medidos.filter(
  (m) => Object.keys(m.clique?.mudanca ?? {}).length > 0 || m.clique?.revelouConteudo,
);

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

// Casar por geometria + texto, igual ao gera-entrada: é o que funciona porque
// a altura do clone bate com a do original.
const casados = await page.evaluate(
  ({ alvos, TOL }) => {
    const caixas = Array.from(document.querySelectorAll("[data-cid]")).map((el) => {
      const r = el.getBoundingClientRect();
      return {
        cid: el.getAttribute("data-cid"),
        tag: el.tagName.toLowerCase(),
        x: Math.round(r.left + window.scrollX),
        y: Math.round(r.top + window.scrollY),
        w: Math.round(r.width),
        h: Math.round(r.height),
        texto: (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60),
      };
    });
    return alvos.map((a) => {
      const mesmaTag = caixas.filter((c) => c.tag === a.tag);
      const custo = (c) =>
        Math.abs(c.x - a.docX) + Math.abs(c.y - a.docY) + Math.abs(c.w - a.w) + Math.abs(c.h - a.h);

      // 🚨 TEXTO ÚNICO MANDA MAIS QUE POSIÇÃO.
      //
      // A posição do original é do instante em que ele foi medido, e num site
      // com revelação ao rolar esse instante não é o mesmo em que o clone é
      // medido. Medido aqui: "Get Started", "Get quote" e "1,214" casaram com
      // 110 a 135px de erro — casaram CERTO, e o erro é a página estar em
      // outro ponto da revelação, não elemento trocado.
      //
      // Quando o texto aparece UMA VEZ SÓ dos dois lados, ele identifica o
      // elemento melhor do que qualquer caixa. Aí a posição vira só desempate.
      if (a.texto) {
        const mesmoTexto = mesmaTag.filter((c) => c.texto === a.texto);
        if (mesmoTexto.length === 1) {
          return { cid: mesmoTexto[0].cid, erro: Math.round(custo(mesmoTexto[0])), via: "texto único" };
        }
        if (mesmoTexto.length > 1) {
          const escolhido = mesmoTexto.sort((p, q) => custo(p) - custo(q))[0];
          return { cid: escolhido.cid, erro: Math.round(custo(escolhido)), via: "texto + posição" };
        }
      }

      const cands = mesmaTag
        .map((c) => ({ c, erro: custo(c) }))
        .filter((v) => v.erro <= TOL * 4)
        .sort((p, q) => p.erro - q.erro);
      const bom = cands[0];
      return bom ? { cid: bom.c.cid, erro: Math.round(bom.erro), via: "caixa" } : null;
    });
  },
  {
    alvos: comHover.map((m) => ({ tag: m.tag, docX: m.docX, docY: m.docY, w: m.caixa.w, h: m.caixa.h, texto: m.texto })),
    TOL,
  },
);
await navegador.close();

// ---- curvas medidas (opcional, via CURVA=) --------------------------------
// O mede-hover-curva amostra uma ASSINATURA e diz quais índices ela representa;
// aqui cada índice representado recebe a curva do seu representante.
const porIndice = new Map();
let curvaMeta = null;
if (CURVA) {
  if (!existsSync(CURVA)) {
    console.error(`CURVA aponta para arquivo que não existe: ${CURVA}`);
    process.exit(1);
  }
  const jc = JSON.parse(readFileSync(CURVA, "utf8"));
  curvaMeta = { amostrados: (jc.amostrados ?? []).length, assinaturas: jc.assinaturas ?? null };
  for (const a of jc.amostrados ?? []) {
    for (const idx of a.representa ?? [a.i]) porIndice.set(idx, a);
  }
  console.log(`curvas: ${curvaMeta.amostrados} amostragem(ns) cobrindo ${porIndice.size} alvo(s)`);
}

/** A `transition` de um lado do hover.
 *
 *  🚨 Em CSS, a transição que vale ao ENTRAR é a declarada no estado NOVO (o
 *  bloco `:hover`), e a que vale ao SAIR é a do seletor BASE. Escrever só uma
 *  delas — ou escrever a mesma nos dois — desfaz a assimetria que a medição
 *  achou: no framer-5 a ida e a volta têm durações e curvas diferentes.
 *
 *  Prefere o `transition` DECLARADO (quando o original anima por CSS, é o
 *  valor exato, e é mais curto que 25 pontos); cai para a curva amostrada
 *  quando o original anima por rAF, onde não há transição declarada nenhuma. */
function transicaoDe(amostra, lado) {
  if (!amostra) return null;
  const a = amostra[lado];
  if (!a) return null;
  // instantâneo: o fiel é NÃO escrever transição. contínuo: é laço, não
  // transição — vira pendência de código, nunca um transition inventado.
  if (a.regime === "instantaneo" || a.regime === "sem-mudanca" || a.regime === "continuo") return null;

  const decl = lado === "ida" ? amostra.declaradoHover : amostra.declaradoRepouso;
  const duracaoUtil = decl && decl.duration && !/^(0s)(,\s*0s)*$/.test(String(decl.duration).trim());
  if (duracaoUtil) {
    const atraso = decl.delay && !/^(0s)(,\s*0s)*$/.test(String(decl.delay).trim()) ? ` ${decl.delay}` : "";
    return `transition:${decl.property} ${decl.duration} ${decl.timingFunction}${atraso}`;
  }
  const props = (a.props ?? []).filter((p) => PROPS_CSS.has(p)).map(camelParaCss);
  if (!props.length || !a.duracaoMs || !a.curvaLinear) return null;
  const atraso = a.atrasoMs > 8 ? ` ${a.atrasoMs}ms` : "";
  return `transition:${props.map((p) => `${p} ${a.duracaoMs}ms ${a.curvaLinear}${atraso}`).join(",")}`;
}

const regras = [];
const regrasBase = [];
const naoCasados = [];
let comTransicao = 0;
const emLaco = [];
comHover.forEach((m, i) => {
  const c = casados[i];
  if (!c) {
    naoCasados.push(m);
    return;
  }
  const amostra = porIndice.get(m.i);

  const decls = [];
  for (const [prop, par] of Object.entries(m.hover)) {
    if (!PROPS_CSS.has(prop)) continue;
    let [, valorHover] = par;
    // 🚨 O valor do censo é uma foto tirada 450ms depois do hover: transição
    // mais longa que isso foi fotografada EM VOO. Quando existe amostragem, o
    // valor bom é o da estabilização.
    if (amostra?.ida?.para?.[prop] !== undefined) valorHover = amostra.ida.para[prop];
    if (valorHover === undefined || valorHover === "" || valorHover === "none") continue;
    decls.push(`${camelParaCss(prop)}:${valorHover}`);
  }
  if (!decls.length) {
    naoCasados.push(m);
    return;
  }

  if (amostra?.ida?.regime === "continuo" || amostra?.volta?.regime === "continuo") {
    emLaco.push({ cid: c.cid, texto: m.texto.slice(0, 30) });
  }

  const tIda = transicaoDe(amostra, "ida");
  const tVolta = transicaoDe(amostra, "volta");
  if (tIda) {
    decls.push(tIda);
    comTransicao++;
  }
  if (tVolta) {
    regrasBase.push(
      `[data-cid="${c.cid}"]{${tVolta}}` +
        `  /* volta: ${amostra.volta.duracaoMs}ms */`,
    );
  }

  const nota = amostra
    ? ` ida=${amostra.ida?.regime ?? "?"}${amostra.ida?.duracaoMs ? " " + amostra.ida.duracaoMs + "ms" : ""}`
    : " sem curva medida";
  regras.push(
    `[data-cid="${c.cid}"]:hover{${decls.join(";")}}` +
      `  /* ${m.tag} "${m.texto.slice(0, 26)}" erro=${c.erro}px${nota} */`,
  );
});

// 🚨 Estado de hover medido a 1280px não vale a 375px: no celular não existe
// ponteiro, e a regra escrita solta gruda o estado de hover no primeiro toque
// e não sai mais até o dedo tocar em outro lugar.
const FAIXA =
  process.env.FAIXA ??
  (largura >= 1024
    ? "(min-width: 1024px)"
    : largura >= 768
      ? "(min-width: 768px) and (max-width: 1023.98px)"
      : "(max-width: 767.98px)");

const css = `/* hover.css — estados de :hover reconstruídos a partir da medição do
   ORIGINAL por scripts/gera-interacao.mjs. Nenhum valor digitado à mão.
   Origem: ${medicao.site}${medicao.rota === "/" ? "" : medicao.rota} @${largura}px
   ${comHover.length} alvos com hover no original, ${regras.length} casados no clone.
   ${
     CURVA
       ? `${comTransicao} com TRANSIÇÃO medida (ida no :hover, volta na base), ${regrasBase.length} com volta própria.`
       : "sem CURVA=: a troca de estado sai INSTANTÂNEA, e isso quase nunca é fiel."
   }
   faixa: ${FAIXA}, e só onde o ponteiro é fino. */

@media ${FAIXA} and (hover: hover) and (pointer: fine) {
${regrasBase.length ? "  /* transição de VOLTA (sai do hover): mora no seletor base */\n" + regrasBase.join("\n") + "\n" : ""}${regras.join("\n")}
}

/* 🚨 prefers-reduced-motion não desliga o hover: um estado de foco visual é
   informação, não enfeite. O que se desliga é a TRANSIÇÃO entre eles. */
@media (prefers-reduced-motion: reduce){
  [data-cid]{transition:none !important}
}
`;

// 🚨 A rota vem PERCENT-ENCODED (é assim que ela existe no original), mas a
// pasta no disco tem o caractere literal. Sem decodificar, toda rota com
// acento ou unicode aponta para pasta inexistente e o instrumento aborta.
// Medido no framer-7: /blog/...director%E2%80%99s-... derrubou dois
// instrumentos em silêncio antes de esta varredura achar o padrão.
const decodificarSegmento = (s) => {
  try { return decodeURIComponent(s); } catch { return s; }
};
// 🚨 A home pode morar no grupo de rotas `(inicio)` (ver entrega-inline.mjs).
// Quem escreve folha por rota tem de procurar o grupo PRIMEIRO — senão cria
// src/app/hover.css, que nenhuma página importa, e a correção parece feita sem
// nunca chegar à tela. Este é o QUARTO instrumento a cair na mesma armadilha,
// depois de gera-entrada, entrega-inline e gera-marquee.
const dirRota =
  ROTA === "/"
    ? existsSync(join(resolve(APP), "src", "app", "(inicio)", "page.tsx"))
      ? join(resolve(APP), "src", "app", "(inicio)")
      : join(resolve(APP), "src", "app")
    : join(resolve(APP), "src", "app", ...ROTA.split("/").filter(Boolean).map(decodificarSegmento));
if (!existsSync(dirRota)) {
  console.error(`pasta da rota não existe: ${dirRota}`);
  process.exit(1);
}
mkdirSync(dirRota, { recursive: true });
const arquivoCss = join(dirRota, "hover.css");
writeFileSync(arquivoCss, css, "utf8");

// Importar na page da rota — mesmo escopo por rota do entrada.css, pelo mesmo
// motivo: `data-cid` colide entre rotas.
const arquivoPage = join(dirRota, "page.tsx");
let ligado = false;
if (existsSync(arquivoPage)) {
  const fonte = readFileSync(arquivoPage, "utf8");
  if (fonte.includes('"./hover.css"')) ligado = true;
  else {
    const marca = 'import "./ditto.css";';
    const novo = fonte.includes(marca)
      ? fonte.replace(marca, marca + '\nimport "./hover.css";')
      : 'import "./hover.css";\n' + fonte;
    writeFileSync(arquivoPage, novo, "utf8");
    ligado = true;
  }
}

console.log(`\ncasados no clone: ${regras.length}/${comHover.length}`);
if (naoCasados.length) {
  console.log(`⚠️ ${naoCasados.length} não casaram ou não tinham propriedade estilizável:`);
  for (const m of naoCasados.slice(0, 8)) console.log(`   ${m.tag} "${m.texto.slice(0, 34)}"`);
}
console.log(`css -> ${arquivoCss}`);
console.log(`import na page: ${ligado ? "ok" : "NÃO CONSEGUI"}`);

if (exigemCodigo.length) {
  console.log(`\n🚨 ${exigemCodigo.length} alvo(s) mudam por LÓGICA, não por estilo — CSS não resolve:`);
  for (const m of exigemCodigo)
    console.log(`   ${m.tag} "${m.texto.slice(0, 40)}"${m.clique?.revelouConteudo ? "  (revela conteúdo)" : ""}`);
  console.log(`   Estes precisam de código. Não estão neste CSS, e isso é pendência declarada.`);
}
