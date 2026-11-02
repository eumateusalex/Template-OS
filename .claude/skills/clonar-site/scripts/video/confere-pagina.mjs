// confere-pagina.mjs — as provas que valem para qualquer página reconstruída:
// nada vaza nem é cortado em nenhuma largura, tudo fica visível com movimento
// reduzido, nenhuma imagem quebrada e nenhum erro no console.
//
// A régua de tinta não vê nada disso. Medido em dois testes reais: com `reduce`,
// um título ficou com `blur(10px)` PARA SEMPRE (o Motion deixa o último valor
// preso quando a chave sai do style); e com o piso do `clamp` errado, a 1024 px
// uma aba saía cortada pelo próprio cartão sem a página rolar para o lado.
//
// Uso (S é a pasta scripts/video da skill):
//   URL=http://localhost:4517 BASE=1400 LARGURAS=390,768,1024,1280,1400 node "$S/confere-pagina.mjs"
//
// Variáveis:
//   URL       a página (obrigatória)
//   BASE      a largura do corte do vídeo (padrão: a maior de LARGURAS). É a
//             largura que a régua de posição e o olho já provaram contra o vídeo.
//   LARGURAS  as janelas a provar (padrão: 390,768,1024,1280 e a BASE)
//   DITTO     raiz do ditto (padrão: ~/dev/ditto)
//
// Para cada largura, rolando a página inteira (as entradas acontecem):
//  (1) a página não rola para o lado;
//  (2) nenhum elemento passa da borda, fora o que mora em quem corta de propósito;
//  (3) nenhum TEXTO é cortado pelo próprio cartão. O que já sai cortado na BASE é
//      desenho do original (o vídeo mostra assim) e fica de fora; o que só corta
//      em outra largura reprova. Trilho em laço (animação CSS) e faixa rolável
//      (overflow auto ou scroll: abas que correm de lado no celular) não contam;
//  (4) nenhuma imagem quebrada;  (5) console sem erro.
// Com movimento reduzido, na menor largura e na BASE:
//  (6) todo texto visível EM CADA PARADA da rolagem, não só no fim: opacidade
//      acumulada dos pais acima de 0,9 e nenhum blur na árvore. Sobe a árvore
//      inteira: o borrão e a opacidade costumam estar num pai. Texto dentro de
//      `aria-hidden` CONTA (o `Palavras` do modelo põe cada palavra animada ali).
//      Preso é o que continua assim depois de posto no meio da tela e esperado:
//      texto na beirada, que ainda não entrou, não é defeito.
//
// 🚨 Elemento que some de propósito (o conteúdo de um hero que vira faixa) leva
// `visibility: hidden` no estado apagado. Opacidade zero sozinha deixa o botão
// invisível recebendo foco, e aqui reprova como texto preso.
//
// Sai 1 se alguma prova falhar, e imprime # provas e # falhas.
// A INTERAÇÃO que o vídeo mostra (aba, acordeão, carrossel) é de cada página:
// vai num `regua/interacao.mjs` do projeto (molde em `modelos/interacao.mjs`).

import { createRequire } from "node:module";

const URL_ = process.env.URL;
if (!URL_) {
  console.error("falta URL");
  process.exit(1);
}
const pedidas = (process.env.LARGURAS ?? "").split(",").map((n) => Number(n.trim())).filter(Boolean);
const BASE = Number(process.env.BASE) || (pedidas.length ? Math.max(...pedidas) : 1440);
const LARGURAS = [...new Set([BASE, ...(pedidas.length ? pedidas : [390, 768, 1024, 1280])])];
const DITTO = process.env.DITTO ?? (process.env.USERPROFILE ?? process.env.HOME) + "/dev/ditto";
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

let provas = 0;
const falhas = [];
const prova = (nome, ok, detalhe = "") => {
  provas++;
  console.log(`${ok ? "ok   " : "FALHA"} ${nome}${detalhe ? "  " + detalhe : ""}`);
  if (!ok) falhas.push(nome);
};

// Os textos borrados ou apagados. `soNaTela` pega os que cruzam a janela agora e
// os marca (data-regua); sem ele, reconfere os já marcados, onde quer que estejam.
const apagados = (soNaTela) => {
  const estado = (dono) => {
    let opacidade = 1, borrao = null, sumido = false;
    for (let p = dono; p && p !== document.documentElement; p = p.parentElement) {
      const c = getComputedStyle(p);
      opacidade *= parseFloat(c.opacity);
      const b = c.filter.match(/blur\(([\d.]+)px\)/);
      if (b && parseFloat(b[1]) > 0.5) borrao = b[1];
      if (c.visibility === "hidden" || c.display === "none") sumido = true;
    }
    if (sumido || (opacidade >= 0.9 && !borrao)) return null;
    return borrao ? `blur ${borrao}px` : `opacidade ${opacidade.toFixed(2)}`;
  };
  const lista = [];
  if (!soNaTela) {
    for (const dono of document.querySelectorAll("[data-regua]")) {
      const motivo = estado(dono);
      if (motivo) lista.push({ id: dono.dataset.regua, texto: dono.textContent.trim().slice(0, 28), motivo });
    }
    return lista;
  }
  window.__regua = window.__regua ?? 0;
  const andador = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = andador.nextNode(); n; n = andador.nextNode()) {
    if (!n.textContent.trim()) continue;
    const dono = n.parentElement;
    if (!dono || dono.closest("script,style,noscript,.sr-only")) continue;
    const caixa = dono.getBoundingClientRect();
    if (!caixa.width || !caixa.height || caixa.bottom < 0 || caixa.top > innerHeight) continue;
    const motivo = estado(dono);
    if (!motivo) continue;
    if (!dono.dataset.regua) dono.dataset.regua = String(++window.__regua);
    lista.push({ id: dono.dataset.regua, texto: n.textContent.trim().slice(0, 28), motivo });
  }
  return lista;
};

// Os textos cortados na horizontal pelo ancestral que corta mais perto.
const textosCortados = () => {
  const cortados = [];
  const andador = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const faixa = document.createRange();
  for (let n = andador.nextNode(); n; n = andador.nextNode()) {
    const texto = n.textContent.trim();
    if (!texto) continue;
    const dono = n.parentElement;
    if (!dono || dono.closest("script,style,noscript,.sr-only")) continue;
    faixa.selectNodeContents(n);
    const r = faixa.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    let animado = false, sumido = false, quemCorta = null;
    for (let p = dono; p && p !== document.documentElement; p = p.parentElement) {
      const c = getComputedStyle(p);
      if (c.animationName !== "none") animado = true; // trilho em laço
      if (c.visibility === "hidden" || c.display === "none" || parseFloat(c.opacity) === 0) sumido = true;
      // dentro de uma faixa rolável (abas que correm de lado no celular) o texto é alcançável
      if (!quemCorta && /auto|scroll/.test(c.overflowX)) animado = true;
      if (!quemCorta && /hidden|clip/.test(c.overflowX)) quemCorta = p;
    }
    if (animado || sumido || !quemCorta) continue;
    const b = quemCorta.getBoundingClientRect();
    if (r.right <= b.right + 2 && r.left >= b.left - 2) continue;
    // a caixa do texto passa, mas pode ser só o espaço que o `pre-wrap` deixa
    // pendurado no fim da linha (invisível): conta só letra de verdade
    let dir = -Infinity, esq = Infinity;
    const s = n.textContent;
    const letra = document.createRange();
    for (let i = 0; i < s.length; i++) {
      if (/\s/.test(s[i])) continue;
      letra.setStart(n, i);
      letra.setEnd(n, i + 1);
      for (const q of letra.getClientRects()) { dir = Math.max(dir, q.right); esq = Math.min(esq, q.left); }
    }
    if (dir > b.right + 2 || esq < b.left - 2) cortados.push(texto.slice(0, 32));
  }
  return [...new Set(cortados)];
};

const navegador = await chromium.launch();
const visita = async (largura, reduzido, aCadaParada) => {
  const contexto = await navegador.newContext({
    viewport: { width: largura, height: largura < 700 ? 844 : 900 },
    reducedMotion: reduzido ? "reduce" : "no-preference",
  });
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  pagina.on("pageerror", (e) => erros.push(e.message));
  await pagina.goto(URL_, { waitUntil: "load" });
  await pagina.waitForTimeout(2000);
  if (aCadaParada) await aCadaParada(pagina);
  const total = await pagina.evaluate(() => document.documentElement.scrollHeight);
  const passo = await pagina.evaluate(() => Math.round(innerHeight * 0.6));
  for (let y = passo; y < total; y += passo) {
    await pagina.evaluate((v) => scrollTo(0, v), y);
    await pagina.waitForTimeout(700);
    if (aCadaParada) await aCadaParada(pagina);
  }
  await pagina.waitForTimeout(1500);
  if (aCadaParada) await aCadaParada(pagina);
  return { contexto, pagina, erros };
};

let deProposito = [];
for (const largura of LARGURAS) {
  const { contexto, pagina, erros } = await visita(largura, false);
  const r = await pagina.evaluate(() => {
    const d = document.documentElement;
    const corta = (e) => {
      for (let p = e.parentElement; p && p !== d; p = p.parentElement) {
        const c = getComputedStyle(p);
        if (/hidden|clip/.test(c.overflowX) || c.maskImage !== "none" || c.webkitMaskImage !== "none" || c.clipPath !== "none") return true;
      }
      return false;
    };
    const fora = [...document.querySelectorAll("body *")]
      .filter((e) => {
        const b = e.getBoundingClientRect();
        return b.width > 0 && b.height > 0 && (b.right > d.clientWidth + 1 || b.left < -1) && getComputedStyle(e).position !== "fixed" && !corta(e);
      })
      .slice(0, 4)
      .map((e) => `${e.tagName.toLowerCase()}.${String(e.className).slice(0, 40)}`);
    // quebrada é a imagem EXIBIDA que não carregou. A que mora num pai com
    // display:none (a foto que só existe no desktop) não tem caixa e, sendo
    // preguiçosa, nunca carrega: não é defeito. Imagem com erro de verdade
    // continua tendo caixa (o navegador desenha o ícone) e segue reprovando.
    const quebradas = [...document.images].filter((i) => i.getClientRects().length > 0 && (!i.complete || i.naturalWidth === 0)).map((i) => i.src.split("/").pop());
    return { rolavel: d.scrollWidth, cliente: d.clientWidth, fora, quebradas };
  });
  const cortados = await pagina.evaluate(textosCortados);
  prova(`${largura}px: a página não rola para o lado`, r.rolavel <= r.cliente, `${r.rolavel} de ${r.cliente}`);
  prova(`${largura}px: nada passa da borda`, r.fora.length === 0, r.fora.join(" | "));
  if (largura === BASE) {
    deProposito = cortados;
    console.log(`-     ${largura}px (a largura do vídeo): ${cortados.length} texto(s) cortado(s) pelo cartão, tidos como desenho do original${cortados.length ? ": " + cortados.slice(0, 4).join(" | ") : ""}`);
  } else {
    const novos = cortados.filter((t) => !deProposito.includes(t));
    prova(`${largura}px: nenhum texto cortado pelo próprio cartão`, novos.length === 0, novos.slice(0, 4).join(" | "));
  }
  prova(`${largura}px: nenhuma imagem quebrada`, r.quebradas.length === 0, r.quebradas.join(" | "));
  prova(`${largura}px: console sem erro`, erros.length === 0, erros.slice(0, 2).join(" | "));
  await contexto.close();
}

for (const largura of [...new Set([Math.min(...LARGURAS), BASE])]) {
  const presos = new Set();
  // Preso é o que CONTINUA borrado ou apagado depois de posto no MEIO da tela e
  // esperado. Texto na beirada da janela ainda não entrou (a entrada pede uma
  // fração dele visível), e com `reduce` ele ainda chega esmaecendo: nenhum dos
  // dois é defeito. Por isso cada suspeito é centralizado e reconferido.
  const { contexto } = await visita(largura, true, async (pagina) => {
    const aqui = await pagina.evaluate(() => scrollY);
    let suspeitos = await pagina.evaluate(apagados, true);
    for (let volta = 0; suspeitos.length && volta < 12; volta++) {
      const alvo = suspeitos[0];
      await pagina.evaluate((id) => document.querySelector(`[data-regua="${id}"]`)?.scrollIntoView({ block: "center" }), alvo.id);
      await pagina.waitForTimeout(1600);
      const ainda = await pagina.evaluate(apagados, false);
      const preso = ainda.find((a) => a.id === alvo.id);
      if (preso) presos.add(`"${preso.texto}" ${preso.motivo}`);
      suspeitos = suspeitos.filter((x) => x.id !== alvo.id && ainda.some((a) => a.id === x.id));
    }
    await pagina.evaluate(() => document.querySelectorAll("[data-regua]").forEach((e) => delete e.dataset.regua));
    await pagina.evaluate((y) => scrollTo(0, y), aqui);
  });
  const lista = [...presos];
  prova(`${largura}px com movimento reduzido: todo texto visível em cada parada da rolagem`, lista.length === 0, `${lista.length ? lista.length + " presos: " : ""}${lista.slice(0, 3).join(" | ")}`);
  await contexto.close();
}
await navegador.close();

console.log(`# provas ${provas}  # falhas ${falhas.length}`);
process.exitCode = falhas.length ? 1 : 0;
