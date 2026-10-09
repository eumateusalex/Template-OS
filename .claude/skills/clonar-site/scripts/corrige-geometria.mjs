// corrige-geometria.mjs — conserta o que a captura errou de ESTÁTICO.
//
// ══════════════════════════════════════════════════════════════════════════
// 🚨 POR QUE ELE EXISTE
//
// Depois de reconstruir todo o comportamento de scroll, sobrou no site-exemplo
// um grupo de elementos fora do lugar que NÃO era comportamento: a barra de
// contato ficou 100px acima do original nos DOIS estados. A causa estava numa
// propriedade estática — o original tem `top: 824px` e a captura escreveu
// `top: 724px`.
//
// Nenhum instrumento anterior olhava para isso, porque todos comparavam
// GEOMETRIA (onde a caixa caiu) e não ESTILO (por que ela caiu ali).
//
// ══════════════════════════════════════════════════════════════════════════
// 🚨 AS DUAS REGRAS QUE IMPEDEM ESTE INSTRUMENTO DE DESTRUIR A PÁGINA
//
// Comparar TODOS os elementos propõe **177 correções** numa página onde a
// medição independente aponta **8** elementos fora do lugar. Aplicar aquilo
// arruinaria o clone. Duas causas, as duas aqui resolvidas:
//
// 1. **Só se casa quem tem TEXTO PRÓPRIO ou é imagem.** Contêiner vazio não
//    tem como ser casado com segurança: `conteudo === ""` casa com qualquer
//    outro vazio da mesma tag. É assim que aparece `flex-direction: row`
//    contra `column` — elemento trocado, não captura errada.
//
// 2. **A causa está num ANCESTRAL, e é ele que se corrige.** Caixa errada se
//    propaga para todo filho; estilo errado fica num elemento só. Os 4 filhos
//    da barra têm `top` idêntico nos dois lados — só o contêiner difere.
//    Corrigir por caixa escreveria 4 regras erradas; subir a cadeia até achar
//    o ancestral cujo ESTILO PRÓPRIO diverge escreve 1 regra certa.
//
// ⚠️ `width`/`height` ficam de fora por padrão: quase sempre são consequência,
// e fixá-las em px corta texto e quebra o responsivo. INCLUIR_CAIXA=1 liga.
//
// ⚠️ `transform` fica de fora sempre: quem manda nele é o gera-scroll.mjs, e
// dois instrumentos escrevendo a mesma propriedade brigam em silêncio.
//
// ⚠️ `line-height` só conta em elemento COM texto próprio: em contêiner o
// original devolve `normal` e o clone um px herdado, e isso não move nada.
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 ROTA=/ \
//   APP=/caminho/app SAIDA=./med node corrige-geometria.mjs

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
const TOL = Number(process.env.TOL ?? 4);
const INCLUIR_CAIXA = process.env.INCLUIR_CAIXA === "1";
const ESCREVER = process.env.ESCREVER !== "0";
const SAIDA = resolve(process.env.SAIDA ?? "./geometria-estatica");
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
const MAX_REGRAS = Number(process.env.MAX_REGRAS ?? 40);
mkdirSync(SAIDA, { recursive: true });

const FAIXA =
  process.env.FAIXA ??
  (LARGURA >= 1024
    ? "(min-width: 1024px)"
    : LARGURA >= 768
      ? "(min-width: 768px) and (max-width: 1023.98px)"
      : "(max-width: 767.98px)");
const MARCA_INI = `/* @ditto-geometria-inicio faixa=${FAIXA} */`;
const MARCA_FIM = `/* @ditto-geometria-fim faixa=${FAIXA} */`;

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

const PROPS_POSICAO = [
  // 🚨 `position` entra na COMPARAÇÃO mas nunca na correção: trocar o esquema
  // de posicionamento é mudança estrutural, e enquanto ele diverge as insets
  // (`top`/`left`/...) significam coisas diferentes nos dois lados. Quando
  // `position` diverge, o elemento sai declarado.
  "position", "top", "right", "bottom", "left",
  "margin-top", "margin-right", "margin-bottom", "margin-left",
  "padding-top", "padding-right", "padding-bottom", "padding-left",
  "font-size", "letter-spacing", "font-weight", "line-height",
  "gap", "row-gap", "column-gap",
];
const PROPS_CAIXA = ["width", "height", "min-height", "max-height"];

// 🚨 REGRA 4: duas camadas nunca escrevem a mesma propriedade — quem ganha
// passaria a depender da ordem de import, que é acaso.
//
// Quando o `corrige-tipografia.mjs` estiver em uso na mesma rota, ele PASSA A
// SER O DONO de font-size/line-height/letter-spacing/font-weight, porque mede
// a escala fluida do original em várias larguras e prova que o valor trava.
// Aí este instrumento tem que largar essas propriedades, e é o que esta
// variável faz. Padrão vazio: sem ela, o comportamento é o de sempre.
const EXCLUIR_PROPS = new Set(
  (process.env.EXCLUIR_PROPS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
);
const PROPS = (INCLUIR_CAIXA ? [...PROPS_POSICAO, ...PROPS_CAIXA] : PROPS_POSICAO).filter(
  (p) => !EXCLUIR_PROPS.has(p),
);
const SO_COM_TEXTO = new Set(["font-size", "letter-spacing", "font-weight", "line-height"]);

const COLHER = ({ props }) => {
  const norm = (s) => String(s).replace(/\s+/g, " ").trim();
  const todos = [...document.querySelectorAll("body *")];
  const indice = new Map(todos.map((el, i) => [el, i]));
  const out = [];
  for (let i = 0; i < todos.length; i++) {
    const el = todos[i];
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    let proprio = "";
    for (const n of el.childNodes) if (n.nodeType === 3) proprio += n.nodeValue;
    const v = {};
    for (const p of props) v[p] = cs.getPropertyValue(p);
    out.push({
      idx: i,
      pai: el.parentElement && indice.has(el.parentElement) ? indice.get(el.parentElement) : -1,
      tag: el.tagName.toLowerCase(),
      cid: el.getAttribute("data-cid") || null,
      proprio: norm(proprio).slice(0, 60),
      conteudo: norm(el.textContent).slice(0, 60),
      ehImg: el.tagName === "IMG",
      visivel: cs.display !== "none" && cs.visibility !== "hidden" && (r.width > 0 || r.height > 0),
      x: Math.round((r.left + window.scrollX) * 100) / 100,
      y: Math.round((r.top + window.scrollY) * 100) / 100,
      w: Math.round(r.width * 100) / 100,
      h: Math.round(r.height * 100) / 100,
      v,
    });
  }
  return out;
};

async function assentar(page) {
  await page.evaluate(async () => {
    const passo = Math.max(200, window.innerHeight * 0.75);
    const fim = document.documentElement.scrollHeight;
    for (let y = 0; y < fim + window.innerHeight; y += passo) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 110));
    }
    for (let y = window.scrollY; y > 0; y -= passo) {
      window.scrollTo({ top: Math.max(0, y - passo), behavior: "instant" });
      await new Promise((r) => setTimeout(r, 110));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    await new Promise((r) => setTimeout(r, 1800));
  });
}

async function medir(page, url) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await assentar(page);
  return page.evaluate(COLHER, { props: PROPS });
}

// ⚠️ `gap: normal` E ZERO em flex. O original devolve `normal` e o clone
// `0px` para a mesma coisa, e sem esta normalização o instrumento propunha
// "corrigir" gap em todo contêiner da página — diferença de vocabulário, não
// de layout.
const EQUIVALENTES = [
  ["normal", "0px"],
  ["auto", "0px"],
];
function mesmoValor(a, b) {
  if (a === b) return true;
  for (const [x, y] of EQUIVALENTES) {
    if ((a === x && b === y) || (a === y && b === x)) return true;
  }
  return false;
}

function difere(prop, a, b) {
  if (mesmoValor(a, b)) return false;
  const na = parseFloat(a);
  const nb = parseFloat(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) return Math.abs(na - nb) > 0.6;
  return String(a) !== String(b);
}

function costurar(arquivo, bloco) {
  let atual = "";
  try {
    atual = existsSync(arquivo) ? readFileSync(arquivo, "utf8") : "";
  } catch {
    atual = "";
  }
  const ini = atual.indexOf(MARCA_INI);
  const fim = atual.indexOf(MARCA_FIM);
  if (ini >= 0 && fim > ini) return atual.slice(0, ini) + bloco + atual.slice(fim + MARCA_FIM.length);
  const outras = atual.includes("@ditto-geometria-inicio") ? atual.trimEnd() + "\n\n" : "";
  return outras + bloco;
}

(async () => {
  const nav = await chromium.launch();
  const ctx = await nav.newContext({ viewport: { width: LARGURA, height: 900 } });
  const page = await ctx.newPage();
  const orig = await medir(page, new URL(ROTA, ORIGINAL).href);
  const clone = await medir(page, new URL(ROTA, CLONE).href);
  await nav.close();

  // ── 1. população confiável: só quem tem TEXTO PRÓPRIO ou é imagem ──────
  const confiavel = (e) => e.visivel && (e.proprio.length > 0 || e.ehImg);
  const usados = new Set();
  const pares = [];
  for (const c of clone) {
    if (!confiavel(c)) continue;
    let melhor = null;
    for (let io = 0; io < orig.length; io++) {
      const o = orig[io];
      if (usados.has(io) || o.tag !== c.tag || !confiavel(o)) continue;
      if (c.proprio) {
        if (o.proprio !== c.proprio) continue;
      } else if (!o.ehImg || Math.hypot(o.w - c.w, o.h - c.h) > 40) continue;
      const d = Math.hypot(o.x - c.x, o.y - c.y);
      if (!melhor || d < melhor.d) melhor = { io, d };
    }
    if (!melhor) continue;
    usados.add(melhor.io);
    pares.push({ c, o: orig[melhor.io] });
  }

  const foraDoLugar = pares.filter(
    (p) =>
      Math.abs(p.c.x - p.o.x) > TOL ||
      Math.abs(p.c.y - p.o.y) > TOL ||
      Math.abs(p.c.w - p.o.w) > TOL ||
      Math.abs(p.c.h - p.o.h) > TOL
  );

  // ── 2. subir a cadeia até achar o ancestral cujo ESTILO diverge ─────────
  // Casar um ancestral (que não tem texto próprio) exige critério apertado:
  // mesma tag, MESMO textContent e caixa quase igual. Sem os três, casa
  // errado e produz correções fantasmas (as 177 do cabeçalho).
  const porIdxClone = new Map(clone.map((e) => [e.idx, e]));
  function acharNoOriginal(alvo) {
    let melhor = null;
    for (const o of orig) {
      if (o.tag !== alvo.tag) continue;
      if (o.conteudo !== alvo.conteudo) continue;
      const dCaixa = Math.hypot(o.w - alvo.w, o.h - alvo.h);
      if (dCaixa > 30) continue;
      const d = dCaixa + Math.hypot(o.x - alvo.x, o.y - alvo.y) / 10;
      if (!melhor || d < melhor.d) melhor = { o, d };
    }
    return melhor?.o ?? null;
  }

  const candidatos = new Map(); // cid -> correção
  const semCausa = [];
  for (const p of foraDoLugar) {
    const dx = p.c.x - p.o.x;
    const dy = p.c.y - p.o.y;
    let atual = p.c;
    const achados = [];
    // 🚨 14 saltos, não 8. A cadeia de um site de construtor é funda: a barra
    // de contato do site-exemplo tem 9 níveis entre o texto "Fale comigo" e o
    // contêiner `fixed` que carrega o `top` errado, e parar em 8 fazia o
    // instrumento não achar a única causa que importava.
    for (let salto = 0; salto < 14 && atual; salto++) {
      const par = acharNoOriginal(atual);
      if (par) {
        const temTexto = atual.proprio.length > 0;
        const diff = PROPS.filter(
          (prop) => (temTexto || !SO_COM_TEXTO.has(prop)) && difere(prop, par.v[prop], atual.v[prop])
        );
        // 🚨 `position` divergente DESQUALIFICA o elemento inteiro.
        //
        // Enquanto o esquema de posicionamento difere, `top`/`right`/`bottom`/
        // `left` significam coisas diferentes nos dois lados, e escrever um
        // deles é escrever ruído com cara de medição. E trocar o `position` em
        // si é mudança estrutural, não correção de valor.
        //
        // Medido: os elementos do rotador de palavras ("design/build/create")
        // aparecem ora `absolute` ora `relative` porque a captura os pegou em
        // fases diferentes do laço. Duas rotas propuseram trocar o position
        // deles — reproduziria a fase errada e ainda mexeria no layout.
        if (diff.includes("position")) {
          semCausa.push({
            cid: atual.cid,
            texto: (atual.proprio || atual.conteudo).slice(0, 34),
            dx: Math.round(dx),
            dy: Math.round(dy),
            motivo: `position diverge (${par.v.position} × ${atual.v.position}) — insets incomparáveis`,
          });
          continue;
        }
        if (diff.length && atual.cid) achados.push({ alvo: atual, par, diff, salto });
      }
      atual = atual.pai >= 0 ? porIdxClone.get(atual.pai) : null;
    }

    // 🚨 O ancestral certo é o que EXPLICA o número medido, não o mais alto
    // nem o mais baixo. Se `top` difere em 100px e o elemento está 100px fora
    // de lugar, é esse. Escolher por altura na árvore pegava um ancestral com
    // uma diferença qualquer e deixava a causa real de fora.
    const explica = (a) =>
      a.diff.some((prop) => {
        const d = Math.abs(parseFloat(a.par.v[prop]) - parseFloat(a.alvo.v[prop]));
        return Number.isFinite(d) && (Math.abs(d - Math.abs(dy)) < 2 || Math.abs(d - Math.abs(dx)) < 2);
      });
    // 🚨 SÓ SE ESCREVE O QUE EXPLICA O NÚMERO MEDIDO.
    //
    // "essa propriedade está diferente" não é motivo suficiente para mexer
    // nela. Num site de construtor dezenas de propriedades divergem sem mover
    // nada — vocabulário diferente para o mesmo resultado. O que autoriza a
    // correção é o delta dela BATER com o deslocamento observado.
    //
    // Sem esta regra, medido nesta construção:
    //   · `left: 194.297px` num elemento de largura automática — delta 194px
    //     para um desvio de 5.7px. Escrito, esmagou a caixa: 4.9px → 160.8px.
    //   · `gap: normal` contra `24px` em seis contêineres sem texto de uma
    //     página de blog, onde o desvio real era 64px na horizontal. Nenhuma
    //     das seis explicava nada.
    //
    // Com ela, os dois casos são recusados e o `top: 824px` da barra de
    // contato — delta 100px para um desvio de 100px — passa.
    const achou = achados.find(explica) ?? null;

    if (!achou) {
      semCausa.push({ cid: p.c.cid, texto: (p.c.proprio || "").slice(0, 34), dx: Math.round(p.c.x - p.o.x), dy: Math.round(p.c.y - p.o.y) });
      continue;
    }
    if (!candidatos.has(achou.alvo.cid)) {
      candidatos.set(achou.alvo.cid, {
        cid: achou.alvo.cid,
        tag: achou.alvo.tag,
        texto: (achou.alvo.proprio || achou.alvo.conteudo).slice(0, 34),
        props: achou.diff.map((prop) => ({ prop, original: achou.par.v[prop], clone: achou.alvo.v[prop] })),
        explica: [],
        // cids que esta regra deveria consertar — é contra eles que a rodada
        // seguinte confere se a correção ajudou ou atrapalhou.
        alvos: [],
      });
    }
    const reg = candidatos.get(achou.alvo.cid);
    reg.explica.push((p.c.proprio || "img").slice(0, 24));
    if (p.c.cid) reg.alvos.push(p.c.cid);
  }

  // ── 3. VERIFICAR A RODADA ANTERIOR E DESFAZER O QUE PIOROU ─────────────
  //
  // 🚨 Corrigir pode piorar, e piorar feio. Medido no site-exemplo: escrever
  // `left:194.297px` junto com `right:-16px` num elemento de largura
  // automática determinou a largura pelos dois lados e ESMAGOU a caixa — o
  // elemento saiu de 4.9px fora do lugar para 160.8px, com 154px a menos de
  // largura. A correção estava certa no valor e errada no efeito.
  //
  // Por isso o instrumento guarda o que propôs e, na rodada seguinte, confere
  // elemento por elemento. O que piorou entra na lista negra e nunca mais é
  // proposto — e sai declarado, não escondido.
  const arqEstado = join(SAIDA, `estado-${ROTA === "/" ? "home" : ROTA.replace(/[^a-z0-9]+/gi, "-")}.json`);
  let estado = { rejeitadas: {}, ultimoDesvio: {} };
  try {
    if (existsSync(arqEstado)) estado = JSON.parse(readFileSync(arqEstado, "utf8"));
  } catch {
    /* estado corrompido: recomeça, não trava */
  }
  estado.rejeitadas ??= {};
  estado.ultimoDesvio ??= {};

  const desvioAgora = {};
  for (const p of pares) {
    if (!p.c.cid) continue;
    desvioAgora[p.c.cid] = Math.max(
      Math.abs(p.c.x - p.o.x), Math.abs(p.c.y - p.o.y),
      Math.abs(p.c.w - p.o.w), Math.abs(p.c.h - p.o.h)
    );
  }
  const novasRejeicoes = [];
  for (const [cid, alvos] of Object.entries(estado.aplicadas ?? {})) {
    let piorou = 0;
    let melhorou = 0;
    for (const alvo of alvos) {
      const antes = estado.ultimoDesvio[alvo];
      if (antes == null) continue;
      const agora = desvioAgora[alvo];
      // 🚨 SUMIR do casamento também é piorar, e é a forma mais perigosa: a
      // correção deformou tanto o elemento que ele deixou de casar com o
      // original, e sem esta linha o instrumento leria "nada a relatar".
      // Medido: a caixa do "Lightning Bolt" encolhe 154px e sai da lista —
      // e a rodada seguinte não vê problema nenhum.
      if (agora == null) { piorou++; continue; }
      if (agora > antes + 2) piorou++;
      else if (agora < antes - 2) melhorou++;
    }
    if (piorou > 0 && melhorou === 0) {
      estado.rejeitadas[cid] = { piorou, quando: ROTA };
      novasRejeicoes.push(cid);
    }
  }
  if (novasRejeicoes.length) {
    console.log(`\n🚨 DESFAZENDO ${novasRejeicoes.length} correção(ões) da rodada anterior que PIORARAM:`);
    for (const cid of novasRejeicoes) console.log(`   ${cid} — vai para a lista negra e não será mais proposta`);
  }

  for (const cid of Object.keys(estado.rejeitadas)) candidatos.delete(cid);

  // 🚨 O arquivo se ACUMULA, não se reescreve do zero.
  //
  // Uma regra que funcionou para de ser proposta na rodada seguinte — porque o
  // elemento não está mais fora do lugar, justamente por causa dela. Gerar o
  // CSS só com as propostas da rodada atual APAGA tudo que já estava certo:
  // a correção do `top` da barra de contato, que resolve 100px em 4
  // elementos, some do arquivo na rodada seguinte.
  //
  // Então o estado guarda toda regra viva, e o CSS é a união delas menos a
  // lista negra.
  estado.regras ??= {};
  for (const c of candidatos.values()) {
    estado.regras[c.cid] = { cid: c.cid, tag: c.tag, texto: c.texto, props: c.props, alvos: c.alvos, explica: c.explica };
  }
  for (const cid of Object.keys(estado.rejeitadas)) delete estado.regras[cid];

  const correcoes = Object.values(estado.regras);
  const novas = [...candidatos.values()].length;

  estado.aplicadas = Object.fromEntries(correcoes.map((c) => [c.cid, (c.alvos ?? []).filter(Boolean)]));
  estado.ultimoDesvio = { ...estado.ultimoDesvio, ...desvioAgora };
  writeFileSync(arqEstado, JSON.stringify(estado, null, 2), "utf8");
  if (Object.keys(estado.rejeitadas).length) {
    console.log(`\n⛔ lista negra desta rota: ${Object.keys(estado.rejeitadas).join(", ")}`);
    console.log(`   (apague ${arqEstado} para permitir que sejam tentadas de novo)`);
  }
  console.log(`\n📐 ${ROTA} @${LARGURA}px`);
  console.log(`   pares confiáveis casados (texto próprio ou imagem): ${pares.length}`);
  console.log(`   fora do lugar acima de ${TOL}px: ${foraDoLugar.length}`);
  console.log(`   ancestrais com CAUSA em estilo nesta rodada: ${novas}`);
  console.log(`   regras vivas no arquivo (acumuladas): ${correcoes.length}`);
  console.log(`   fora do lugar SEM causa identificada: ${semCausa.length} — declarados, não corrigidos`);
  for (const c of correcoes) {
    console.log(`\n   ${c.cid}  <${c.tag}>  ${JSON.stringify(c.texto)}  → explica ${c.explica.length} elemento(s)`);
    for (const p of c.props) console.log(`      ${p.prop.padEnd(15)} original=${String(p.original).padStart(13)}   clone=${String(p.clone).padStart(13)}`);
  }
  for (const s of semCausa.slice(0, 12)) console.log(`   ⚠️ sem causa: ${s.cid ?? "-"} ${JSON.stringify(s.texto)} dx=${s.dx} dy=${s.dy}`);

  writeFileSync(
    join(SAIDA, `geometria-${ROTA === "/" ? "home" : ROTA.replace(/[^a-z0-9]+/gi, "-")}.json`),
    JSON.stringify({ rota: ROTA, largura: LARGURA, pares: pares.length, foraDoLugar: foraDoLugar.length, correcoes, semCausa }, null, 2)
  );

  // 🚨 NÃO sair aqui quando `correcoes` está vazio. Zero correções pode
  // significar "nada a fazer" OU "a rodada anterior escreveu uma regra ruim e
  // ela acabou de ser rejeitada" — e nesse segundo caso é obrigatório
  // reescrever o bloco SEM ela. Sair cedo deixava a regra que piorou o
  // elemento morando no arquivo para sempre.
  if (!correcoes.length && !novasRejeicoes.length) {
    console.log(`\n✅ nada a corrigir em ${ROTA}`);
    process.exit(0);
  }
  if (correcoes.length > MAX_REGRAS) {
    // 🚨 Freio. Dezenas de correções não são dezenas de defeitos da captura:
    // são casamento ruim. Antes de escrever tanta coisa, alguém olha.
    console.log(`\n🚨 ${correcoes.length} correções passa do teto de ${MAX_REGRAS}. NÃO escrevendo.`);
    console.log(`   Isso quase sempre é casamento errado, não defeito de captura.`);
    console.log(`   Confira o JSON e, se estiver certo mesmo, suba MAX_REGRAS.`);
    process.exit(3);
  }

  const L = [];
  L.push(MARCA_INI);
  L.push(`/* geometria.css — valores ESTÁTICOS que a captura errou, medidos no`);
  L.push(`   original por scripts/corrige-geometria.mjs. Nada digitado à mão.`);
  L.push(`   Origem: ${new URL(ROTA, ORIGINAL).href} @${LARGURA}px`);
  L.push(`   ${correcoes.length} ancestrais com causa em estilo, explicando ${foraDoLugar.length} elementos fora do lugar.`);
  L.push(`   width/height ${INCLUIR_CAIXA ? "INCLUÍDOS (INCLUIR_CAIXA=1)" : "excluídos: consequência, não causa"}. */`);
  L.push(`@media ${FAIXA} {`);
  for (const c of correcoes) {
    const decl = c.props.map((p) => `${p.prop}:${p.original}`).join(";");
    L.push(`  [data-cid="${c.cid}"]{${decl}}  /* ${JSON.stringify(c.texto)} explica ${c.explica.length} */`);
  }
  L.push(`}`);
  L.push(MARCA_FIM);
  const css = L.join("\n") + "\n";

  if (!ESCREVER || !APP) {
    console.log(`\n(simulação — não escrevi)\n${css}`);
    process.exit(0);
  }
  const pastaRota =
    ROTA === "/" ? join(APP, "src", "app") : join(APP, "src", "app", ...ROTA.split("/").filter(Boolean).map(decodificarSegmento));
  if (!existsSync(pastaRota)) {
    console.error(`❌ pasta da rota não existe: ${pastaRota}`);
    process.exit(1);
  }
  const alvo = join(pastaRota, "geometria.css");
  writeFileSync(alvo, costurar(alvo, css), "utf8");
  console.log(`\n✅ ${alvo}`);
})();
