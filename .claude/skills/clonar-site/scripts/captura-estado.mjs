// captura-estado.mjs — captura um estado que SÓ existe depois de uma interação.
//
// ══════════════════════════════════════════════════════════════════════════
// 🚨 O BURACO QUE ELE TAPA
//
// O ditto captura UM estado da página: o que está na tela quando ele olha.
// Tudo que só nasce depois de um clique — drawer, modal, menu de celular,
// carrinho lateral — simplesmente não existe no clone.
//
// Medido no site-exemplo: clicar em "Contact" cria **76 elementos novos** e
// acrescenta 342 caracteres de texto. Um painel fixo de 540×900 com formulário
// de orçamento. Nada disso está no clone, e nenhuma medição de rota, metadata,
// conteúdo ou geometria acusa a falta — porque no estado fechado a página está
// certa.
//
// ══════════════════════════════════════════════════════════════════════════
// 🚨 POR QUE ESTILO INLINE, E NÃO CLASSE
//
// O painel é estilizado pela folha do construtor, que a captura não trouxe.
// Copiar o HTML com as classes originais entrega um esqueleto sem estilo
// nenhum. Copiar o ESTILO COMPUTADO de cada nó, inline, entrega o painel do
// jeito que ele renderiza — sem depender de folha nenhuma, e sem colidir com
// o CSS do clone.
//
// ⚠️ É um retrato estático: o que estiver animando no instante da captura vem
// congelado. Por isso se espera o painel assentar antes de fotografar.
//
// Uso:
//   ORIGINAL=https://site.com ROTA=/ GATILHO='button:has-text("Contact")' \
//   APP=<app> NOME=drawer node captura-estado.mjs
//
// Variáveis:
//   GATILHO        seletor Playwright do que dispara o estado (obrigatória)
//   NOME           nome do estado, vira o nome do arquivo (padrão "estado")
//   TEXTO_GATILHO  textos que, no clone, abrem este estado (separados por |)
//   ESPERA         ms para o estado assentar depois do gatilho (padrão 1400)
//   ESCREVER       0 simula

import { createRequire } from "node:module";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const ORIGINAL = process.env.ORIGINAL;
const GATILHO = process.env.GATILHO;
const APP = process.env.APP;
if (!ORIGINAL || !GATILHO) {
  console.error("faltam ORIGINAL e/ou GATILHO");
  process.exit(1);
}
const ROTA = process.env.ROTA ?? "/";
const NOME = (process.env.NOME ?? "estado").replace(/[^a-z0-9-]/gi, "");
const TEXTO_GATILHO = (process.env.TEXTO_GATILHO ?? "").split("|").map((s) => s.trim()).filter(Boolean);
// CID_GATILHO: data-cid(s) do gatilho NO CLONE, para gatilho SEM texto (ex.:
// hambúrguer que é um div mudo, como no framer-2)
const CID_GATILHO = (process.env.CID_GATILHO ?? "").split(",").map((s) => s.trim()).filter(Boolean);
// 🚨 NEM TODO PAINEL ABRE POR CLIQUE. Medido no site-next: o menu "Platform"
// abre por HOVER (aria-expanded vai a true, +580 caracteres de texto) e o
// clique FECHA (aria-expanded volta a false). Capturar com clique num menu de
// hover devolve a pagina no estado fechado, mais o ruido do que estiver
// animando — e o resultado parece capturado, mas nao tem o painel.
const ACAO = (process.env.ACAO ?? "click").toLowerCase();
const ESPERA = Number(process.env.ESPERA ?? 1400);
const LARGURA = Number(process.env.LARGURA ?? 1280);
const ALTURA = Number(process.env.ALTURA ?? 900);
const ESCREVER = process.env.ESCREVER !== "0";
const SAIDA = resolve(process.env.SAIDA ?? "./estado");
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
// 🚨 networkidle nunca dispara em site que mantem conexao viva (analytics,
// stream). Medido no site-next: timeout de 60s em toda rota. NAVEGA troca a
// estrategia sem mudar o padrao dos outros alvos.
const NAVEGA = process.env.NAVEGA ?? "networkidle";
const ASSENTA_NAV = Number(process.env.ASSENTA_NAV ?? (process.env.NAVEGA && process.env.NAVEGA !== "networkidle" ? 1500 : 0));
mkdirSync(SAIDA, { recursive: true });

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

// Propriedades suficientes para o nó renderizar igual sem folha nenhuma.
// Mais que isto incha o HTML sem mudar o resultado; menos, e o painel desmonta.
const PROPS = [
  "position", "display", "flex-direction", "align-items", "justify-content", "flex-wrap",
  "gap", "row-gap", "column-gap", "top", "right", "bottom", "left", "z-index",
  "width", "height", "min-width", "min-height", "max-width", "max-height",
  "margin", "padding", "box-sizing", "overflow", "overflow-x", "overflow-y",
  "background-color", "background-image", "background-size", "background-position",
  "border-radius", "border-top", "border-right", "border-bottom", "border-left",
  "box-shadow", "opacity", "backdrop-filter", "transform", "transform-origin",
  "color", "font-family", "font-size", "font-weight", "font-style", "line-height",
  "letter-spacing", "text-align", "text-decoration", "text-transform", "white-space",
  "object-fit", "cursor", "pointer-events", "flex-grow", "flex-shrink", "flex-basis",
  "aspect-ratio", "outline", "list-style", "vertical-align",
];

const CARIMBAR = () => {
  const todos = document.querySelectorAll("body *");
  todos.forEach((e) => e.setAttribute("data-antes", "1"));
  return todos.length;
};

const EXTRAIR = ({ props }) => {
  const novos = [...document.querySelectorAll("body *:not([data-antes])")];
  const raizes = novos.filter(
    (e) => !e.parentElement || e.parentElement.hasAttribute("data-antes") || e.parentElement === document.body
  );
  const escapar = (s) =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // Atributos que fazem sentido carregar. Classe do construtor NÃO entra: ela
  // não tem folha aqui, e só serviria para colidir com o CSS do clone.
  const ATTRS = [
    "src", "srcset", "alt", "href", "type", "placeholder", "name", "value", "rows", "cols",
    "aria-label", "role", "loading", "width", "height", "viewBox", "fill", "d", "stroke",
    "stroke-width", "xmlns", "points", "cx", "cy", "r", "x", "y", "x1", "x2", "y1", "y2",
  ];

  function serializar(el, profundidade) {
    if (profundidade > 30) return "";
    const tag = el.tagName.toLowerCase();
    if (tag === "script" || tag === "style" || tag === "link") return "";
    const cs = getComputedStyle(el);
    const estilo = props
      .map((p) => [p, cs.getPropertyValue(p)])
      .filter(([, v]) => v && v !== "none" && v !== "normal" && v !== "auto" && v !== "0px" && v !== "static")
      .map(([p, v]) => `${p}:${v}`)
      .join(";");
    const attrs = ATTRS.filter((a) => el.hasAttribute(a))
      .map((a) => ` ${a}="${escapar(el.getAttribute(a))}"`)
      .join("");
    const dentro = [];
    for (const n of el.childNodes) {
      if (n.nodeType === 3) {
        const t = n.nodeValue;
        if (t && t.trim()) dentro.push(escapar(t));
      } else if (n.nodeType === 1) {
        dentro.push(serializar(n, profundidade + 1));
      }
    }
    const vazias = new Set(["img", "input", "br", "hr", "source", "path", "circle", "line", "rect", "polygon"]);
    if (vazias.has(tag)) return `<${tag}${attrs} style="${escapar(estilo)}">`;
    return `<${tag}${attrs} style="${escapar(estilo)}">${dentro.join("")}</${tag}>`;
  }

  // ⚠️ Colher `currentSrc` E o atributo `src` cru: eles quase nunca são iguais
  // (o `currentSrc` vem resolvido do srcset, com querystring de dimensão), e
  // reescrever só um deixa o outro apontando para o CDN da origem: a imagem
  // baixa, e o HTML continua pedindo a de fora.
  const imagens = new Set();
  for (const r of raizes) {
    for (const img of r.querySelectorAll("img")) {
      if (img.currentSrc) imagens.add(img.currentSrc);
      const bruto = img.getAttribute("src");
      if (bruto) {
        try {
          imagens.add(new URL(bruto, location.href).href);
        } catch {
          /* src inválido: ignora */
        }
      }
    }
  }

  return {
    novos: novos.length,
    raizes: raizes.map((r) => {
      const b = r.getBoundingClientRect();
      const cs = getComputedStyle(r);
      return {
        tag: r.tagName.toLowerCase(),
        caixa: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)],
        position: cs.position,
        z: cs.zIndex,
        texto: (r.textContent || "").replace(/\s+/g, " ").trim().slice(0, 90),
        html: serializar(r, 0),
      };
    }),
    imagens: [...imagens],
    textoTotal: document.body.innerText.length,
  };
};

(async () => {
  const nav = await chromium.launch();
  const ctx = await nav.newContext({ viewport: { width: LARGURA, height: ALTURA } });
  const page = await ctx.newPage();
  await page.goto(new URL(ROTA, ORIGINAL).href, { waitUntil: NAVEGA, timeout: 60000 });
  if (ASSENTA_NAV) await page.waitForTimeout(ASSENTA_NAV);
  await page.waitForTimeout(3200);

  const antes = await page.evaluate(CARIMBAR);
  const textoAntes = await page.evaluate(() => document.body.innerText.length);

  if (ACAO === "hover") {
    await page.hover(GATILHO, { timeout: 12000 }).catch((e) => {
      console.error(`o gatilho ${GATILHO} nao recebeu hover: ${String(e).slice(0, 120)}`);
    });
  } else {
    await page.click(GATILHO, { timeout: 12000 }).catch((e) => {
      console.error(`❌ o gatilho ${GATILHO} não clicou: ${String(e).slice(0, 120)}`);
    });
  }
  await page.waitForTimeout(ESPERA);

  const r = await page.evaluate(EXTRAIR, { props: PROPS });
  await nav.close();

  console.log(`\n📸 estado "${NOME}" em ${new URL(ROTA, ORIGINAL).href}`);
  console.log(`   elementos antes do gatilho: ${antes}`);
  console.log(`   elementos NOVOS: ${r.novos}`);
  console.log(`   texto acrescentado: ${r.textoTotal - textoAntes} caracteres`);
  console.log(`   raízes: ${r.raizes.length}`);
  for (const raiz of r.raizes) {
    console.log(
      `     <${raiz.tag}> ${raiz.position} z=${raiz.z} caixa=${raiz.caixa.join(",")} html=${raiz.html.length}b  ${JSON.stringify(raiz.texto.slice(0, 60))}`
    );
  }
  console.log(`   imagens dentro do estado: ${r.imagens.length}`);
  for (const i of r.imagens) console.log(`     ${i.slice(0, 110)}`);

  if (!r.novos) {
    console.log(`\n⚠️ Nada novo apareceu. Ou o gatilho não abriu nada, ou o estado já estava no DOM.`);
    console.log(`   Nos dois casos NÃO se escreve nada: inventar markup aqui é pior que declarar.`);
    process.exit(2);
  }

  // ── baixar as imagens do estado ─────────────────────────────────────────
  // 🚨 Clone não pode depender do CDN da origem. Deixar o `src` apontando para
  // lá funciona hoje e quebra no dia em que o site sair do ar, mudar de host ou
  // passar a barrar requisição de fora — e quebra sem aviso, num painel que
  // ninguém abre todo dia.
  let html = r.raizes.map((x) => x.html).join("\n");
  if (APP && r.imagens.length) {
    const destino = join(APP, "public", "assets", "estado", NOME);
    mkdirSync(destino, { recursive: true });
    let baixadas = 0;
    const jaFeito = new Map(); // nome de arquivo -> caminho local, para não baixar duas vezes
    for (let k = 0; k < r.imagens.length; k++) {
      const url = r.imagens[k];
      const arquivo = url.split("/").pop().split("?")[0];
      try {
        let local = jaFeito.get(arquivo);
        if (!local) {
          const resp = await fetch(url);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const buf = Buffer.from(await resp.arrayBuffer());
          const ext = (arquivo.match(/\.(jpe?g|png|gif|webp|avif|svg)$/i) ?? [".jpg"])[0];
          const nome = `img${k}${ext}`;
          writeFileSync(join(destino, nome), buf);
          local = `/assets/estado/${NOME}/${nome}`;
          jaFeito.set(arquivo, local);
          baixadas++;
        }
        html = html.split(url).join(local);
        // 🚨 E também por NOME DE ARQUIVO: a mesma imagem aparece no HTML com
        // querystring diferente da que o navegador resolveu, e trocar só a URL
        // exata deixa o resto apontando para fora: a imagem baixa e o HTML
        // continua pedindo a de fora.
        if (arquivo) {
          const escapado = arquivo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          html = html.replace(new RegExp(`(src|href)="[^"]*${escapado}[^"]*"`, "g"), `$1="${local}"`);
        }
      } catch (e) {
        console.log(`   ⚠️ não baixei ${url.slice(0, 70)}: ${String(e.message ?? e).slice(0, 50)}`);
        console.log(`      o src fica apontando para a origem — declarado, não escondido`);
      }
    }
    // ⚠️ O `srcset` aponta para variantes que não foram baixadas; deixá-lo faz
    // o navegador preferir uma URL que não existe mais localmente.
    html = html.replace(/\ssrcset="[^"]*"/g, "");
    console.log(`   imagens baixadas para o clone: ${baixadas}`);
  }

  const arqHtml = join(SAIDA, `${NOME}.html`);
  writeFileSync(arqHtml, html, "utf8");
  writeFileSync(
    join(SAIDA, `${NOME}.json`),
    JSON.stringify({ rota: ROTA, gatilho: GATILHO, ...r, raizes: r.raizes.map(({ html: _h, ...x }) => x) }, null, 2),
    "utf8"
  );
  console.log(`\n✅ ${arqHtml}  (${html.length} bytes, estilo inline em cada nó)`);

  if (!ESCREVER || !APP) {
    console.log(`(sem APP: não injetei no clone)`);
    process.exit(0);
  }

  // ── injetar no clone ────────────────────────────────────────────────────
  const js = `// ${NOME}.js — estado capturado do ORIGINAL depois de uma interação.
// Gerado por scripts/captura-estado.mjs. O markup e o estilo inline saíram do
// navegador, nó por nó; nada foi escrito à mão.
//
// 🚨 Injetado como OVERLAY, escondido por padrão. Ele NÃO participa do fluxo da
// página, então não pode mexer na geometria que já foi medida e fechada.
//
// ⚠️ É um RETRATO: o formulário tem aparência e comportamento local. Enviar de
// verdade depende de um backend que a captura não alcança, e isso fica
// declarado no relatório em vez de fingido.
(function () {
  var HTML = ${JSON.stringify(html)};
  var TEXTOS = ${JSON.stringify(TEXTO_GATILHO)};
  var CIDS = ${JSON.stringify(CID_GATILHO)};
  var caixa = null;

  function montar() {
    if (caixa && document.body.contains(caixa)) return caixa;
    caixa = document.createElement("div");
    caixa.id = "ditto-${NOME}";
    caixa.setAttribute("role", "dialog");
    caixa.setAttribute("aria-modal", "true");
    caixa.setAttribute("aria-label", ${JSON.stringify(r.raizes.map((x) => x.texto).join(" ").slice(0, 60))});
    caixa.style.cssText = "position:fixed;inset:0;z-index:2147483000;display:none";
    caixa.innerHTML = HTML;
    // Fecha clicando fora do painel ou no Esc. Sem isto o visitante fica preso
    // no overlay, porque o botão de fechar do original é um ícone sem texto e
    // não dá para reconhecê-lo com segurança.
    caixa.addEventListener("click", function (e) {
      if (e.target === caixa) fechar();
    });
    document.body.appendChild(caixa);
    return caixa;
  }

  function abrir() {
    var c = montar();
    c.style.display = "block";
    document.documentElement.style.overflow = "hidden";
  }
  function fechar() {
    if (!caixa) return;
    caixa.style.display = "none";
    document.documentElement.style.overflow = "";
  }

  function ehGatilho(el) {
    var cid = el.getAttribute && el.getAttribute("data-cid");
    for (var k = 0; k < CIDS.length; k++) if (cid === CIDS[k]) return true;
    var t = (el.textContent || "").replace(/\\s+/g, " ").trim();
    for (var i = 0; i < TEXTOS.length; i++) if (t === TEXTOS[i]) return true;
    return false;
  }

  var ligado = false;
  function ligar() {
    if (ligado) return;
    ligado = true;
    document.addEventListener(
      "click",
      function (e) {
        // 🚨 O gatilho nem sempre é <a> ou <button>. Medido no framer-4: o
        // "MENU" do cabeçalho é uma <p> dentro de <div>, sem role nenhum, e o
        // runtime nunca disparava — o clone abria a página e o menu não existia,
        // sem erro nenhum no console. Como ehGatilho exige texto EXATAMENTE
        // igual, alargar o seletor para qualquer elemento não cria falso
        // positivo: só casa quem tem o texto do gatilho e mais nada.
        // 🚨 O cid do gatilho se busca por ANCESTRAL e ANTES do casamento por
        // texto. Medido no framer-2: o gatilho é um <div data-cid="n14"> com
        // um <button data-cid="n15"> dentro. O clique cai no button e o
        // closest(lista) devolve o BUTTON (o mais próximo do alvo), cujo cid
        // não está na lista — o menu nunca abria, sem erro em lugar nenhum.
        // Procurar cada cid com closest casa clique em qualquer descendente.
        var alvo = null;
        if (e.target && e.target.closest) {
          for (var ci = 0; ci < CIDS.length && !alvo; ci++) {
            alvo = e.target.closest('[data-cid="' + CIDS[ci] + '"]');
          }
          if (!alvo) {
            var porTexto = e.target.closest("a,button,[role=button],div,p,span,li");
            if (porTexto && ehGatilho(porTexto)) alvo = porTexto;
          }
        }
        if (!alvo) return;
        // não sequestrar o clique dentro do próprio painel
        if (caixa && caixa.contains(alvo)) return;
        e.preventDefault();
        e.stopPropagation();
        abrir();
      },
      true
    );
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") fechar();
    });
  }

  window.__ditto${NOME.replace(/[^a-zA-Z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : "")).replace(/^./, (c) => c.toUpperCase())} = { abrir: abrir, fechar: fechar, ligar: ligar };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ligar);
  else ligar();
})();
`;
  const pub = join(APP, "public");
  if (!existsSync(pub)) {
    console.error(`❌ ${pub} não existe`);
    process.exit(1);
  }
  writeFileSync(join(pub, `${NOME}.js`), js, "utf8");
  console.log(`✅ ${join(pub, `${NOME}.js`)}`);
  console.log(`\n⚠️ Falta o <script src="/${NOME}.js" defer /> no layout.tsx.`);
})();
