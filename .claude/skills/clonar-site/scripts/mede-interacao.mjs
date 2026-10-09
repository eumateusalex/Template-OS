// mede-interacao.mjs — o que acontece quando alguém passa o mouse ou clica.
//
// Dimensão 5 das 7. Roda contra o ORIGINAL para descobrir o que existe, e
// contra o CLONE para provar que a reconstrução responde igual.
//
// 🚨 Cinco regras que decidem se esta medição vale alguma coisa:
//
// 1. EVENTO REAL do navegador (`page.hover`, `page.click`). Disparar um
//    MouseEvent sintético não aciona framework — mede-se o nada e reporta-se
//    sucesso.
// 2. IDA E VOLTA SEPARADAS. Entrar e sair do hover não são espelhos: podem ter
//    durações e curvas diferentes. Duas gravações, nunca uma invertida.
// 3. NÃO ASSUMIR ESTADO INICIAL. Num acordeão real um item já vem aberto, e o
//    laço "clica pra abrir, fotografa, clica pra fechar" entra fora de fase a
//    partir dele. Alterna DUAS vezes e guarda as duas fotos.
// 4. RECALCULAR A POSIÇÃO antes de cada clique: cada item que abre empurra o
//    que está abaixo.
// 5. LER A PILHA no ponto do alvo (`elementsFromPoint`). Se o primeiro da pilha
//    não é o alvo, tem camada por cima engolindo o clique — e aí o elemento
//    "não responde" por cobertura, não por falta de código.
//
// Uso:
//   SITE=https://exemplo.com/ SAIDA=./interacao node mede-interacao.mjs
//
// Variáveis:
//   SITE     URL a medir — o original OU o clone (obrigatória)
//   ROTA     rota (padrão: /)
//   SAIDA    pasta de saída (padrão: ./interacao)
//   LARGURA  viewport (padrão: 1280)
//   MAX      teto de alvos medidos (padrão: 40) — watch-list enxuta de propósito
//   DITTO    raiz do ditto (padrão: C:/dev/ditto)

import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const SITE = process.env.SITE;
if (!SITE) {
  console.error("falta SITE=<url>");
  process.exit(1);
}
const ROTA = process.env.ROTA ?? "/";
const SAIDA = resolve(process.env.SAIDA ?? "./interacao");
const LARGURA = Number(process.env.LARGURA ?? 1280);
const MAX = Number(process.env.MAX ?? 40);
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
const ESPERA = process.env.ESPERA ?? "networkidle";
const ASSENTA = Number(process.env.ASSENTA ?? (process.env.ESPERA && process.env.ESPERA !== "networkidle" ? 1200 : 0));
mkdirSync(SAIDA, { recursive: true });

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

// Propriedades que um estado de interação costuma mexer.
// ⚠️ Só olhar `transform` faz a reconstrução sair errada quando `left` também
// anima: o efeito fica quase invisível. Varrer todas.
//
// 🚨 As quatro `transition*` no fim não são enfeite: sem elas este instrumento
// mede DOIS PONTOS PARADOS e o gerador escreve um `:hover` que troca de estado
// INSTANTANEAMENTE. Medido no framer-5: o original tem 48
// alvos com mudança de hover e o clone reproduz 4, nenhum com transição.
// Lidas aqui, cobrem de graça todo hover feito por transição CSS (que é a
// maioria); hover animado por rAF/JS continua exigindo o `mede-hover-curva`.
const PROPS = [
  "transform", "opacity", "filter", "backgroundColor", "color", "borderColor",
  "borderRadius", "boxShadow", "width", "height", "left", "top", "scale",
  "rotate", "translate", "visibility", "display", "textDecorationLine", "letterSpacing",
  "transitionProperty", "transitionDuration", "transitionTimingFunction", "transitionDelay",
];

const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: LARGURA, height: 900 } });
const page = await ctx.newPage();

/** 🚨 Clicar num botão que abre modal DEIXA o modal aberto, e a partir dali
 *  todo alvo seguinte fica coberto pelo overlay. Medido: clicar em "Contact"
 *  abriu o drawer e contaminou 8 alvos seguidos, todos reportando "coberto" e
 *  estourando timeout no hover.
 *
 *  A defesa é recarregar e re-marcar sempre que um clique mudar o estado da
 *  página. Custa uma navegação; medir 33 alvos contaminados custa a medição
 *  inteira. */
async function preparar() {
  await page.goto(new URL(ROTA, SITE).href + (SITE.includes("127.0.0.1") ? "?_v=" + Date.now() : ""), {
    waitUntil: ESPERA,
    timeout: 60000,
  });
      if (ASSENTA) await page.waitForTimeout(ASSENTA);
  await page.waitForTimeout(1200);
  return page.evaluate((MAX) => {
    const sel =
      'a[href], button, input, select, textarea, [role="button"], [role="tab"], [tabindex]:not([tabindex="-1"]), summary';
    const todos = Array.from(document.querySelectorAll(sel));

    // 🚨 O que ABRE coisa nem sempre é <a> ou <button>. Medido no framer-4: o
    // "MENU" do cabeçalho, que abre o overlay inteiro do site, é uma <div> com
    // <p> dentro — sem href, sem role, sem tabindex. No ORIGINAL ele entrava na
    // lista por acaso (é filho de um <a> do logo); no CLONE não entrava, e o
    // gate dizia "revela conteúdo: 0" num clone onde o menu ABRE.
    //
    // O sinal honesto de "isto se clica" é o `cursor: pointer` declarado no
    // próprio elemento e ausente no pai — é o que o site promete ao visitante.
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
      if (r.width < 8 || r.height < 8) continue; // alvo invisível não se mede
      el.setAttribute("data-medir", String(n));
      n++;
      if (n >= MAX) break;
    }
    return { marcados: n, totalNaPagina: todos.length };
  }, MAX);
}

const total = await preparar();
console.log(`alvos interativos: ${total.totalNaPagina} na página, ${total.marcados} marcados para medir`);

/** Quem está por cima do alvo?
 *
 *  ⚠️ Testar SÓ O CENTRO reprova alvo que está perfeitamente acessível. Medido:
 *  nos cards de projeto o centro cai sobre a `<img>`, e 4 cards foram pulados
 *  como "cobertos" quando a borda deles recebe clique normalmente — 6 de 40
 *  alvos viraram célula vazia por causa disso.
 *
 *  Testar CINCO pontos e considerar acessível se QUALQUER um atinge o alvo.
 *  Devolve também o ponto que funcionou, para o hover mirar nele. */
async function lerPilha(idx) {
  return page.evaluate((i) => {
    const el = document.querySelector(`[data-medir="${i}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const pontos = [
      { x: r.left + r.width / 2, y: r.top + r.height / 2, nome: "centro" },
      { x: r.left + r.width * 0.12, y: r.top + r.height * 0.12, nome: "sup-esq" },
      { x: r.left + r.width * 0.88, y: r.top + r.height * 0.12, nome: "sup-dir" },
      { x: r.left + r.width * 0.12, y: r.top + r.height * 0.88, nome: "inf-esq" },
      { x: r.left + r.width * 0.88, y: r.top + r.height * 0.88, nome: "inf-dir" },
    ];
    // 🚨 `pointer-events: none` faz o Playwright esperar PARA SEMPRE por um
    // elemento que nunca vai aceitar o evento — 4s de timeout por alvo, e o
    // log diz "timeout" quando a verdade é "este elemento está morto".
    // `elementsFromPoint` também ignora esses elementos, então a leitura de
    // pilha sozinha não denuncia: quem aparece no topo é um ancestral vivo, e
    // o teste de contenção passa.
    // ⚠️ Basta olhar o COMPUTED do próprio elemento. `pointer-events` é
    // herdado, mas um valor explícito no filho SOBREPÕE o do pai — um `<a>`
    // com `pointer-events:auto` dentro de um `<p>` com `none` recebe eventos
    // normalmente.
    //
    // Subir a cadeia até o body e condenar o elemento por causa do ancestral
    // reprova um conserto que deu certo: os links funcionam e o detector
    // continua dizendo "morto".
    const cs = getComputedStyle(el);
    if (cs.pointerEvents === "none") {
      return {
        alvoNoTopo: false,
        pontoBom: null,
        topo: "",
        morto: true,
        motivoMorto: "pointer-events:none no próprio elemento",
        pointerEvents: cs.pointerEvents,
      };
    }

    let topoDoCentro = "";
    for (const p of pontos) {
      const pilha = document.elementsFromPoint(p.x, p.y);
      const primeiro = pilha[0];
      if (p.nome === "centro") {
        topoDoCentro = primeiro
          ? primeiro.tagName.toLowerCase() + (primeiro.className ? "." + String(primeiro.className).split(" ")[0] : "")
          : "";
      }
      const atinge = primeiro === el || el.contains(primeiro) || (primeiro && primeiro.contains(el));
      if (atinge) {
        return {
          alvoNoTopo: true,
          pontoBom: { x: Math.round(p.x - r.left), y: Math.round(p.y - r.top), nome: p.nome },
          topo: topoDoCentro,
          pontosTestados: pontos.length,
        };
      }
    }
    return { alvoNoTopo: false, pontoBom: null, topo: topoDoCentro, pontosTestados: pontos.length };
  }, idx);
}

async function estado(idx) {
  return page.evaluate(
    ({ idx, PROPS }) => {
      const el = document.querySelector(`[data-medir="${idx}"]`);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const out = { caixa: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } };
      for (const p of PROPS) out[p] = cs[p];
      out.textoInterno = (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
      out.ariaExpanded = el.getAttribute("aria-expanded");
      return out;
    },
    { idx, PROPS },
  );
}

function diff(a, b) {
  if (!a || !b) return null;
  const d = {};
  for (const k of Object.keys(a)) {
    if (k === "caixa") {
      for (const c of ["x", "y", "w", "h"]) {
        if (Math.abs(a.caixa[c] - b.caixa[c]) > 1) d["caixa." + c] = [a.caixa[c], b.caixa[c]];
      }
      continue;
    }
    if (a[k] !== b[k]) d[k] = [a[k], b[k]];
  }
  return d;
}

const medidos = [];
for (let i = 0; i < total.marcados; i++) {
  const alvo = await page.evaluate((idx) => {
    const el = document.querySelector(`[data-medir="${idx}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(),
      href: el.getAttribute("href"),
      texto: (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60),
      role: el.getAttribute("role"),
      tipo: el.getAttribute("type"),
      caixa: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      // Âncora estável para casar original × clone: posição no documento.
      docY: Math.round(r.top + window.scrollY),
      docX: Math.round(r.left + window.scrollX),
    };
  }, i);
  if (!alvo) continue;

  const linha = { i, ...alvo, hover: null, saida: null, clique: null, pilha: null, erro: null };

  try {
    // Trazer para a tela sem mudar a página.
    await page.evaluate((idx) => {
      document.querySelector(`[data-medir="${idx}"]`)?.scrollIntoView({ block: "center", behavior: "instant" });
    }, i);
    await page.waitForTimeout(180);

    linha.pilha = await lerPilha(i);

    // ⚠️ Se o alvo está coberto, o hover vai estourar timeout de qualquer
    // jeito. Registrar o motivo e pular é honesto E rápido — esperar 5s por um
    // fracasso garantido só queima tempo e polui o log.
    if (linha.pilha && !linha.pilha.alvoNoTopo) {
      linha.morto = linha.pilha.morto ?? false;
      linha.pulado = linha.pilha.morto ? linha.pilha.motivoMorto : `coberto por ${linha.pilha.topo}`;
      medidos.push(linha);
      console.log(`  [${String(i).padStart(2)}] ${linha.tag.padEnd(8)} PULADO — ${linha.pulado}  "${linha.texto.slice(0, 26)}"`);
      continue;
    }

    const repouso = await estado(i);

    // --- HOVER, com evento REAL --------------------------------------------
    // Mirar no ponto que a leitura de pilha provou acessível, não no centro.
    await page.hover(`[data-medir="${i}"]`, {
      timeout: 4000,
      ...(linha.pilha?.pontoBom && linha.pilha.pontoBom.nome !== "centro"
        ? { position: { x: linha.pilha.pontoBom.x, y: linha.pilha.pontoBom.y } }
        : {}),
    });
    await page.waitForTimeout(450); // deixar a transição terminar
    const comHover = await estado(i);
    linha.hover = diff(repouso, comHover);

    // --- SAÍDA do hover, gravada SEPARADAMENTE -----------------------------
    await page.mouse.move(2, 2);
    await page.waitForTimeout(550);
    const depoisDoHover = await estado(i);
    linha.saida = diff(comHover, depoisDoHover);
    linha.voltouAoRepouso = Object.keys(diff(repouso, depoisDoHover) ?? {}).length === 0;

    // --- CLIQUE: só onde não navega ----------------------------------------
    const navega = alvo.tag === "a" && alvo.href && !alvo.href.startsWith("#");
    if (!navega && alvo.tag !== "input" && alvo.tag !== "textarea" && alvo.tag !== "select") {
      const antes = await estado(i);
      const domAntes = await page.evaluate(() => document.body.innerText.length);
      // ⚠️ Recalcular a posição: item que abriu acima empurrou este pra baixo.
      await page.evaluate((idx) => {
        document.querySelector(`[data-medir="${idx}"]`)?.scrollIntoView({ block: "center", behavior: "instant" });
      }, i);
      await page.waitForTimeout(150);
      await page.click(`[data-medir="${i}"]`, { timeout: 5000, force: false }).catch(() => {});
      await page.waitForTimeout(700);
      const depois = await estado(i);
      const domDepois = await page.evaluate(() => document.body.innerText.length);
      // ⚠️ Alternar DUAS vezes: não assumir que o item começou fechado.
      await page.click(`[data-medir="${i}"]`, { timeout: 5000, force: false }).catch(() => {});
      await page.waitForTimeout(700);
      const volta = await estado(i);
      linha.clique = {
        mudanca: diff(antes, depois),
        volta: diff(depois, volta),
        deltaTextoDaPagina: domDepois - domAntes,
        revelouConteudo: domDepois > domAntes,
      };

      // 🚨 O clique pode ter deixado um modal aberto. Se o estado da página não
      // voltou ao que era, RECARREGAR antes do próximo alvo — senão o overlay
      // contamina tudo daqui pra frente.
      const domFinal = await page.evaluate(() => document.body.innerText.length);
      const aindaAberto = Math.abs(domFinal - domAntes) > 20;
      const alvoAindaLivre = (await lerPilha(i))?.alvoNoTopo ?? true;
      if (aindaAberto || !alvoAindaLivre) {
        linha.exigiuRecarga = true;
        await preparar();
      }
    }
  } catch (e) {
    linha.erro = String(e.message ?? e).slice(0, 160);
    // Erro no meio deixa a página em estado desconhecido: recarregar.
    linha.exigiuRecarga = true;
    await preparar().catch(() => {});
  }

  medidos.push(linha);
  const nH = Object.keys(linha.hover ?? {}).length;
  const nC = Object.keys(linha.clique?.mudanca ?? {}).length;
  console.log(
    `  [${String(i).padStart(2)}] ${linha.tag.padEnd(8)} hover=${String(nH).padStart(2)} clique=${String(nC).padStart(2)}` +
      (linha.clique?.revelouConteudo ? " revela" : "") +
      (linha.exigiuRecarga ? " ↻" : "") +
      (linha.erro ? "  ERRO: " + linha.erro.slice(0, 40) : "") +
      `  "${linha.texto.slice(0, 30)}"`,
  );
}

await navegador.close();

const comHover = medidos.filter((m) => Object.keys(m.hover ?? {}).length > 0);
const comClique = medidos.filter((m) => Object.keys(m.clique?.mudanca ?? {}).length > 0);
const revelam = medidos.filter((m) => m.clique?.revelouConteudo);
const cobertos = medidos.filter((m) => m.pilha && !m.pilha.alvoNoTopo);
const naoVoltaram = medidos.filter((m) => m.voltouAoRepouso === false);
const pulados = medidos.filter((m) => m.pulado);
const comErro = medidos.filter((m) => m.erro);
const recargas = medidos.filter((m) => m.exigiuRecarga);

writeFileSync(
  join(SAIDA, "interacao.json"),
  JSON.stringify({ site: SITE, rota: ROTA, largura: LARGURA, total, medidos }, null, 2),
  "utf8",
);

console.log(`\ninteração em ${SITE}${ROTA === "/" ? "" : ROTA}`);
console.log(`  alvos medidos:            ${medidos.length}`);
console.log(`  respondem ao hover:       ${comHover.length}`);
console.log(`  respondem ao clique:      ${comClique.length}`);
console.log(`  revelam conteúdo:         ${revelam.length}`);
console.log(`  ⚠️ cobertos por camada:    ${cobertos.length}`);
console.log(`  ⚠️ não voltam ao repouso:  ${naoVoltaram.length}`);
console.log(`  ⚠️ PULADOS (não medidos):  ${pulados.length}`);
console.log(`  🚨 MORTOS (pointer-events:none): ${medidos.filter((m) => m.morto).length}`);
console.log(`  ⚠️ com erro:               ${comErro.length}`);
console.log(`  recargas p/ limpar estado: ${recargas.length}`);
if (pulados.length || comErro.length) {
  console.log(`\n🚨 ${pulados.length + comErro.length} alvo(s) NÃO medidos — pendência, nunca aprovação:`);
  for (const m of [...pulados, ...comErro].slice(0, 10))
    console.log(`   [${m.i}] ${m.tag} "${m.texto.slice(0, 30)}" — ${m.pulado ?? m.erro?.slice(0, 60)}`);
}
console.log(`\n-> ${join(SAIDA, "interacao.json")}`);
