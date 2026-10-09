// gera-letras.mjs — devolve ao clone a entrada LETRA A LETRA dos títulos.
//
// 🚨 É a animação assinatura de um site feito no Framer, e a que o clone perde
// inteira. Medido no framer-6, home: das 311 animações vivas no
// load, **306 têm como alvo um <span> de até 2 caracteres**. O clone tem os
// spans no JSX — o que ele não tem é o escalonamento: a folha de entrada anima
// o CONTÊINER de uma vez, e o título aparece em bloco onde o original o
// desenha letra por letra.
//
// Números medidos no original (e é o instrumento que os mede, não o autor):
//   duração 400ms · curva cubic-bezier(0.44, 0, 0.56, 1) · passo de 25ms por
//   letra · opacity .001→1 junto com filter blur(5px)→blur(0px) · atrasos-base
//   em degraus de 25ms, de 0 a 1500ms.
//
// ── Por que NÃO casar por geometria ─────────────────────────────────────────
// 🚨 Casar 1597 spans de UMA letra por posição é exatamente a operação que
// produziu 1635 casamentos falsos na linha de base deste clone, todos com o
// mesmo `dy` absurdo: um "a" casa com qualquer outro "a" da página. Aqui o
// casamento é por CONTÊINER (texto normalizado + contagem de folhas), e a
// letra se identifica pelo ÍNDICE dentro do contêiner — que é estável porque
// a ordem do documento é a mesma dos dois lados.
//
// ── Onde cada coisa mora ────────────────────────────────────────────────────
//   · `letras.css` na pasta da ROTA: quem escalona e com que números, por
//     data-cid (cid reinicia a cada rota, então isso NUNCA pode ser global);
//   · `public/letras.js`: runtime global e genérico, sem um dado de rota
//     dentro. Ele lê os números da CSS var do contêiner e escreve o
//     `animation-delay` de cada letra pelo índice dela.
//
// 🚨 TERRITÓRIO. A folha de entrada e a de scroll animam a OPACIDADE do
// contêiner. Se a camada de letras entrar por cima, a mesma propriedade passa
// a ter dois donos e o resultado é um fade dentro de outro fade. Por isso o
// `letras.css` REIVINDICA o contêiner: fixa a opacidade dele em 1 e desliga a
// transição, e a partir dali quem anima são as letras. A regra vence porque as
// duas folhas escrevem por `[data-cid]` e esta é importada depois.
//
// O que o faz SE CALAR (declara e não escreve):
//   - nenhum contêiner com escalonamento no original
//   - contêiner sem par no clone pelo texto
//   - contagem de letras diferente entre os lados
//   - passo medido inconsistente (mediana não explica a série)
//
// ⚠️ `prefers-reduced-motion`: as letras aparecem no estado final, de uma vez.
// Nunca a página em branco.
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 APP=<app> ROTA=/ \
//   SAIDA=<med>/letras node gera-letras.mjs
//
// Variáveis:
//   ORIGINAL, CLONE, APP  (obrigatórias)
//   ROTA      rota única (padrão /) · ROTAS=rotas.json ou lista
//   LARGURA   viewport (padrão 1280) · ALTURA (padrão 900)
//   MIN_LETRAS  mínimo de letras para valer como bloco (padrão 4)
//   ESCREVER  0 simula
//   DITTO     raiz do ditto (padrão C:/dev/ditto)

import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const ORIGINAL = process.env.ORIGINAL;
const CLONE = process.env.CLONE;
const APP = process.env.APP;
if (!ORIGINAL || !CLONE || !APP) {
  console.error("faltam ORIGINAL, CLONE e/ou APP");
  process.exit(1);
}
const LARGURA = Number(process.env.LARGURA ?? 1280);
const ALTURA = Number(process.env.ALTURA ?? 900);
const MIN_LETRAS = Number(process.env.MIN_LETRAS ?? 4);
const ESCREVER = process.env.ESCREVER !== "0";
const SAIDA = resolve(process.env.SAIDA ?? "./letras");
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
mkdirSync(SAIDA, { recursive: true });

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

function carregarRotas() {
  const r = process.env.ROTAS;
  if (r) {
    if (existsSync(r) && statSync(r).isFile()) {
      const j = JSON.parse(readFileSync(r, "utf8").replace(/^\uFEFF/, ""));
      return j.rotas.filter((x) => x.status === 200 || x.status === null).map((x) => x.rota);
    }
    return r.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [process.env.ROTA ?? "/"];
}

// ── medir no ORIGINAL ───────────────────────────────────────────────────────
// As animações de entrada do Framer nascem no LOAD (mesmo para o que está
// abaixo da dobra: elas são criadas e só TOCAM quando a seção entra). Então se
// mede no load, sem rolar — rolar faria as de cima terminarem e sumirem.
const MEDIR = (minLetras) => {
  const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();
  const ehLetra = (el) => el.children.length === 0 && norm(el.textContent).length > 0 && norm(el.textContent).length <= 2;

  const porContainer = new Map();
  for (const anim of document.getAnimations()) {
    const alvo = anim.effect && anim.effect.target;
    if (!alvo || !alvo.tagName) continue;
    if (!ehLetra(alvo)) continue;
    const pai = alvo.parentElement;
    if (!pai) continue;
    const t = anim.effect.getTiming();
    // atraso e duração em ms; curva como o navegador a devolve
    const delay = Math.round(Number(t.delay) || 0);
    const dur = Math.round(Number(t.duration) || 0);
    if (!dur) continue;
    let props = [];
    try { props = [...new Set(anim.effect.getKeyframes().flatMap((k) => Object.keys(k)))].filter((p) => p !== "offset" && p !== "composite" && p !== "computedOffset" && p !== "easing"); } catch (e) { /* sem keyframes legíveis */ }
    const chave = pai;
    if (!porContainer.has(chave)) porContainer.set(chave, []);
    porContainer.get(chave).push({ alvo, delay, dur, easing: t.easing, props });
  }

  const saida = [];
  for (const [pai, itens] of porContainer) {
    const filhos = [...pai.children];
    if (filhos.length < minLetras) continue;
    // índice DOM de cada letra animada
    const porIndice = [];
    for (const it of itens) {
      const i = filhos.indexOf(it.alvo);
      if (i < 0) continue;
      // uma letra pode ter 2 animações (opacity e filter): fica a de menor atraso
      const ja = porIndice.find((x) => x.i === i);
      if (ja) { ja.delay = Math.min(ja.delay, it.delay); ja.props = [...new Set([...ja.props, ...it.props])]; continue; }
      porIndice.push({ i, delay: it.delay, dur: it.dur, easing: it.easing, props: [...it.props] });
    }
    if (porIndice.length < minLetras) continue;
    porIndice.sort((a, b) => a.i - b.i);

    // passo: mediana da diferença de atraso entre letras VIZINHAS no DOM
    const difs = [];
    for (let k = 1; k < porIndice.length; k++) {
      const di = porIndice[k].i - porIndice[k - 1].i;
      if (di !== 1) continue;
      difs.push(porIndice[k].delay - porIndice[k - 1].delay);
    }
    difs.sort((a, b) => a - b);
    const passo = difs.length ? difs[Math.floor(difs.length / 2)] : 0;
    const base = Math.min(...porIndice.map((x) => x.delay));
    const durs = porIndice.map((x) => x.dur).sort((a, b) => a - b);
    const dur = durs[Math.floor(durs.length / 2)];
    const curvas = {};
    for (const x of porIndice) curvas[x.easing] = (curvas[x.easing] ?? 0) + 1;
    const easing = Object.entries(curvas).sort((a, b) => b[1] - a[1])[0][0];

    // 🚨 o passo tem que EXPLICAR a série: cada letra em base + passo*i, com
    // folga de meio passo. Série que não obedece não é escalonamento.
    let explica = 0;
    for (const x of porIndice) {
      const previsto = base + passo * (x.i - porIndice[0].i);
      if (Math.abs(x.delay - previsto) <= Math.max(4, Math.abs(passo) / 2)) explica++;
    }

    const r = pai.getBoundingClientRect();
    saida.push({
      texto: norm(pai.textContent).slice(0, 60),
      letras: filhos.length,
      animadas: porIndice.length,
      base,
      passo,
      dur,
      easing,
      props: [...new Set(porIndice.flatMap((x) => x.props))],
      explicadas: explica,
      docY: Math.round(r.top + scrollY),
      primeiroIndice: porIndice[0].i,
    });
  }
  return saida;
};

// ── casar no CLONE ──────────────────────────────────────────────────────────
const CASAR = (blocos) => {
  const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();
  const out = [];
  const usados = new Set();
  for (const b of blocos) {
    let melhor = null;
    for (const el of document.querySelectorAll("[data-cid]")) {
      const cid = el.getAttribute("data-cid");
      if (usados.has(cid)) continue;
      if (norm(el.textContent).slice(0, 60) !== b.texto) continue;
      // 🚨 a contagem de folhas tem que bater: contêiner e ancestral têm o
      // mesmo texto, e o ancestral tem outra estrutura por dentro.
      if (el.children.length !== b.letras) continue;
      const filhos = [...el.children];
      const soLetras = filhos.filter((f) => f.children.length === 0 && norm(f.textContent).length <= 2).length;
      const cand = { cid, letras: filhos.length, soLetras, docY: Math.round(el.getBoundingClientRect().top + scrollY) };
      if (!melhor || Math.abs(cand.docY - b.docY) < Math.abs(melhor.docY - b.docY)) melhor = cand;
    }
    if (!melhor) { out.push({ texto: b.texto, erro: "sem par no clone (texto + contagem de filhos)" }); continue; }
    usados.add(melhor.cid);
    // 🚨 Os cids dos FILHOS. É por eles que se cede o território: a folha de
    // entrada anima cada letra individualmente (306 das 311 animações deste
    // site miram um span de uma letra), e esta camada passa a animar as
    // mesmas letras. Sem ceder, o `confere-entrada` reprova a rota inteira
    // com "animação diferente da prometida" — medido no framer-6: uma rota de
    // blog caiu de 58/58 para 1/58, e não havia defeito nenhum, só dois donos
    // para a mesma propriedade.
    const el = document.querySelector(`[data-cid="${melhor.cid}"]`);
    const cidsFilhos = el ? [...el.children].map((f) => f.getAttribute("data-cid")).filter(Boolean) : [];
    out.push({ ...b, cid: melhor.cid, letrasNoClone: melhor.letras, soLetras: melhor.soLetras, cidsFilhos });
  }
  return out;
};

const rotas = carregarRotas();
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport: { width: LARGURA, height: ALTURA } });
const page = await ctx.newPage();
const relatorio = [];
let escreveuRuntime = false;

for (const rota of rotas) {
  await page.goto(new URL(rota, ORIGINAL).href, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(300); // cedo: as animações do herói acabam de nascer

  // 🚨 Colher SÓ no load pega o herói e mais nada. O Framer cria a animação de
  // entrada de cada bloco quando a seção dele se aproxima, então o resto da
  // página é invisível para uma única leitura: medido aqui, 5 blocos no load
  // contra dezenas ao percorrer. Percorre-se em passos curtos, colhendo a cada
  // parada, e cada bloco fica com a leitura mais próxima do gatilho dele.
  const blocosMap = new Map();
  const juntar = (lista) => {
    for (const b of lista) {
      const chave = `${b.texto}@${b.docY}`;
      if (!blocosMap.has(chave)) blocosMap.set(chave, b);
    }
  };
  juntar(await page.evaluate(MEDIR, MIN_LETRAS));
  const alturaPagina = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < alturaPagina; y += Math.round(ALTURA * 0.6)) {
    await page.evaluate((yy) => scrollTo(0, yy), y);
    await page.waitForTimeout(320);
    juntar(await page.evaluate(MEDIR, MIN_LETRAS));
  }
  const blocos = [...blocosMap.values()];

  if (!blocos.length) {
    console.log(`\n=== ${rota}: nenhum bloco com escalonamento por letra — o instrumento se cala.`);
    relatorio.push({ rota, blocos: 0 });
    continue;
  }

  await page.goto(new URL(rota, CLONE).href + `?_v=${Date.now()}`, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(1200);
  const casados = await page.evaluate(CASAR, blocos);

  const bons = casados.filter((c) => c.cid && c.passo > 0 && c.explicadas >= c.animadas * 0.8);
  const maus = casados.filter((c) => !bons.includes(c));

  console.log(`\n=== ${rota}: ${blocos.length} bloco(s) no original · ${bons.length} casado(s) e coerente(s) · ${maus.length} declarado(s)`);
  for (const c of bons.slice(0, 8)) {
    console.log(`   ✅ ${c.cid}  ${c.letras} letras · base ${c.base}ms · passo ${c.passo}ms · ${c.dur}ms · ${c.easing} · ${c.props.join("+")}  ${JSON.stringify(c.texto.slice(0, 34))}`);
  }
  if (bons.length > 8) console.log(`   ... e mais ${bons.length - 8}`);
  for (const c of maus.slice(0, 6)) {
    console.log(`   ⚠️ ${JSON.stringify(String(c.texto).slice(0, 34))}: ${c.erro ?? (c.passo <= 0 ? `passo medido ${c.passo}ms` : `série não explicada (${c.explicadas}/${c.animadas})`)}`);
  }

  relatorio.push({ rota, blocos: blocos.length, casados: bons.length, declarados: maus.length, detalhe: casados });
  if (!bons.length || !ESCREVER) continue;

  // ── escrever o CSS da rota ────────────────────────────────────────────────
  const pasta = rota === "/" ? join(APP, "src", "app") : join(APP, "src", "app", ...rota.split("/").filter(Boolean));
  mkdirSync(pasta, { recursive: true });
  const linhas = [
    `/* letras.css — entrada LETRA A LETRA, medida no original`,
    `   (${new URL(rota, ORIGINAL).href}). Nenhum número digitado: base, passo,`,
    `   duração e curva saem do getAnimations() do próprio original.`,
    ``,
    `   🚨 TERRITÓRIO: cada contêiner abaixo é REIVINDICADO por esta camada.`,
    `   A folha de entrada e a de scroll animam a opacidade do contêiner; se`,
    `   as duas continuassem valendo, seria um fade dentro de outro fade. Aqui`,
    `   o contêiner fica opaco e sem transição, e quem anima são as letras. */`,
    ``,
    `@keyframes ditto-letra {`,
    `  from { opacity: .001; filter: blur(5px) }`,
    `  to   { opacity: 1;    filter: blur(0px) }`,
    `}`,
    ``,
  ];
  for (const c of bons) {
    linhas.push(`/* ${JSON.stringify(c.texto.slice(0, 46))} — ${c.letras} letras */`);
    linhas.push(`[data-cid="${c.cid}"]{--ditto-letras:1;--ditto-letras-base:${c.base}ms;--ditto-letras-passo:${c.passo}ms;--ditto-letras-dur:${c.dur}ms;--ditto-letras-curva:${c.easing};opacity:1 !important;transition:none !important}`);
    // 🚨 O gate é o atributo que o RUNTIME escreve, nunca a classe `ditto-js`
    // do <html>: a hidratação do React apaga aquela classe por volta dos 400ms
    // (armadilha medida no framer-3), e com ela sumiria o estado inicial. Sem JS,
    // nenhum atributo é escrito e as letras ficam visíveis — nunca em branco.
    linhas.push(`[data-cid="${c.cid}"][data-letras="1"] > *{opacity:.001}`);
    linhas.push(`[data-cid="${c.cid}"][data-letras="tocando"] > *{animation:ditto-letra var(--ditto-letras-dur) var(--ditto-letras-curva) both}`);
  }
  linhas.push(``);
  linhas.push(`/* ⚠️ Sem movimento: as letras no estado final, de uma vez. Nunca em branco. */`);
  linhas.push(`@media (prefers-reduced-motion: reduce){`);
  for (const c of bons) linhas.push(`  [data-cid="${c.cid}"] > *{animation:none !important;opacity:1 !important;filter:none !important}`);
  linhas.push(`}`);
  linhas.push(``);
  writeFileSync(join(pasta, "letras.css"), linhas.join("\n"), "utf8");
  console.log(`   ✅ ${join(pasta, "letras.css")}`);

  // 🚨 CEDER O TERRITÓRIO NA FOLHA ANTERIOR. Escrever a camada nova não basta:
  // enquanto o `entrada.css` continuar PROMETENDO animar as mesmas letras, o
  // `confere-entrada` reprova a rota — e com razão, porque duas camadas
  // disputando a mesma propriedade é defeito, mesmo quando o resultado na tela
  // parece certo. Aqui as regras dos cids assumidos saem da folha de entrada,
  // com o motivo escrito no lugar delas.
  const arqEntrada = join(pasta, "entrada.css");
  if (existsSync(arqEntrada)) {
    const cedidos = new Set(bons.flatMap((c) => c.cidsFilhos ?? []));
    if (cedidos.size) {
      const antes = readFileSync(arqEntrada, "utf8");
      const mantidas = antes
        .split("\n")
        .filter((l) => {
          const m = l.match(/^\[data-cid="([^"]+)"\]\{animation:/);
          return !(m && cedidos.has(m[1]));
        });
      const removidas = antes.split("\n").length - mantidas.length;
      if (removidas) {
        mantidas.push(
          ``,
          `/* 🚨 ${removidas} regra(s) de entrada CEDIDAS para o letras.css desta rota.`,
          `   Eram os spans de letra dos ${bons.length} blocos que passaram a entrar`,
          `   escalonados. Duas camadas não podem escrever a mesma propriedade do`,
          `   mesmo elemento: aqui a folha de entrada abre mão, e quem anima essas`,
          `   letras é o letras.css. Por scripts/gera-letras.mjs. */`,
          ``
        );
        writeFileSync(arqEntrada, mantidas.join("\n"), "utf8");
        console.log(`   ✅ ${removidas} regra(s) cedidas em entrada.css`);
      }
    }
  }

  // escrever o CSS não o liga
  const pageTsx = join(pasta, "page.tsx");
  if (existsSync(pageTsx)) {
    const src = readFileSync(pageTsx, "utf8");
    if (!src.includes('./letras.css')) {
      // 🚨 DEPOIS de entrada.css e scroll.css: é esta camada que reivindica o
      // contêiner, e quem chega por último vence entre regras de mesma força.
      const alvo = 'import "./hover.css";';
      const novo = src.includes(alvo) ? src.replace(alvo, `${alvo}\nimport "./letras.css";`) : `import "./letras.css";\n${src}`;
      writeFileSync(pageTsx, novo, "utf8");
      console.log(`   ✅ import acrescentado`);
    }
  }
  escreveuRuntime = true;
}

await nav.close();

// ── runtime global ──────────────────────────────────────────────────────────
if (ESCREVER && escreveuRuntime) {
  const js = `// letras.js — entrada letra a letra. Gerado por scripts/gera-letras.mjs.
//
// 🚨 Nenhum número de rota mora aqui. Quem escalona, com que base, passo,
// duração e curva, vem do CSS DA ROTA na var --ditto-letras* do contêiner —
// data-cid reinicia a cada rota, e uma lista aqui dentro animaria o elemento
// errado na página errada.
//
// O escalonamento é por ÍNDICE no DOM: a letra i recebe
// animation-delay = base + passo × i. Casar letra por posição na tela é o que
// produziu 1635 pares falsos na linha de base deste clone.
//
// Gatilho: a seção entrar na tela, como no original (o Framer cria a animação
// no load e só a toca quando o bloco aparece).
(function () {
  function alvos() {
    var out = [];
    var todos = document.querySelectorAll("[data-cid]");
    for (var i = 0; i < todos.length; i++) {
      if (getComputedStyle(todos[i]).getPropertyValue("--ditto-letras").trim() === "1") out.push(todos[i]);
    }
    return out;
  }

  function ligar() {
    var lista = alvos();
    if (!lista.length) return;
    var parado = matchMedia("(prefers-reduced-motion: reduce)").matches;

    for (var k = 0; k < lista.length; k++) {
      (function (el) {
        if (el.getAttribute("data-letras")) return; // idempotente
        var cs = getComputedStyle(el);
        var base = parseFloat(cs.getPropertyValue("--ditto-letras-base")) || 0;
        var passo = parseFloat(cs.getPropertyValue("--ditto-letras-passo")) || 0;
        var filhos = el.children;
        if (!filhos.length) return;
        // o atraso de cada letra, pelo índice dela no DOM
        for (var i = 0; i < filhos.length; i++) {
          filhos[i].style.animationDelay = (base + passo * i) + "ms";
        }
        if (parado) { el.setAttribute("data-letras", "pronto"); return; }
        el.setAttribute("data-letras", "1"); // esconde as letras (regra do CSS)

        function tocar() {
          el.setAttribute("data-letras", "tocando");
        }
        if (!("IntersectionObserver" in window)) { tocar(); return; }
        var io = new IntersectionObserver(function (es) {
          for (var j = 0; j < es.length; j++) {
            if (!es[j].isIntersecting) continue;
            io.disconnect();
            tocar();
          }
        }, { rootMargin: "0px 0px -8% 0px" });
        io.observe(el);

        // ⚠️ Rede de segurança: bloco que nunca intersecta (contêiner recortado,
        // observer que não dispara) não pode ficar invisível para sempre.
        setTimeout(function () {
          if (el.getAttribute("data-letras") === "1") tocar();
        }, 4000);
      })(lista[k]);
    }
  }

  window.__dittoLetras = ligar;
  if (document.readyState === "complete") ligar();
  else window.addEventListener("load", ligar);
})();
`;
  mkdirSync(join(APP, "public"), { recursive: true });
  writeFileSync(join(APP, "public", "letras.js"), js, "utf8");
  console.log(`\n✅ ${join(APP, "public", "letras.js")}`);
  console.log(`🚨 falta ligar no layout: <script src="/letras.js" defer /> e __dittoLetras() no religar da navegação.`);
}

writeFileSync(join(SAIDA, "letras.json"), JSON.stringify({ gerado: new Date().toISOString(), largura: LARGURA, relatorio }, null, 2), "utf8");
console.log(`\nsaída: ${join(SAIDA, "letras.json")}`);
