// fotografa.mjs — a reconstrução nas mesmas posições dos quadros do vídeo.
//
// MODO=repouso (padrão): uma foto por posição, com a página assentada. Antes de
// fotografar, rola a página INTEIRA uma vez: entrada com `once` só acontece ao
// passar, e foto tirada antes dela mede texto ainda borrado. Esconde a barra de
// rolagem, porque o vídeo não tem (sem isso a largura útil fica 15px menor e
// todo texto quebra diferente).
//
// MODO=sequencia: uma página NOVA por posição, e nela QUADROS fotos a cada PASSO
// ms, para comparar o MOVIMENTO com o vídeo (prancha.py movimento) e conferir o
// quadro 0 (tinta.py entrada). Com "rolarAte" na posição, as fotos varrem a
// rolagem de "y" até "rolarAte" em vez de esperar o tempo: é o modo da animação
// ligada à rolagem (cartão que encolhe, parallax).
//
// Uso (S é a pasta scripts/video da skill, P o projeto):
//   URL=http://localhost:4517 QUADRO="$P/referencia/stills/s_2.0.png" \
//   POSICOES="$P/regua/posicoes.json" SAIDA="$P/regua/fotos" node "$S/fotografa.mjs"
//
// 🚨 A janela tem de ser a do corte do vídeo. QUADRO lê largura e altura de um
// quadro recortado; ou passe LARGURA e ALTURA. Não há padrão: foto na largura de
// outro projeto reprova tudo na régua sem dizer por quê.
//
// posicoes.json: [
//   {"nome": "c1-hero", "seletor": null, "y": 0},
//   {"nome": "c3-capital", "seletor": "main > section:nth-of-type(3) h2", "y": 144},
//   {"nome": "c5-aba2", "seletor": "#abas", "y": 485, "clicar": "#aba-integrations", "esperar": 1500},
//   {"nome": "transicao", "seletor": null, "y": 0, "rolarAte": 900}
// ]
//   - seletor null é o topo da página.
//   - y é onde o TOPO do elemento fica na tela, em px: lido no quadro do vídeo
//     (o topo da tinta do título, por exemplo). É isso que põe os dois lados na
//     mesma rolagem.
//   - clicar: um seletor para clicar antes da foto (a aba, o item do acordeão), e
//     esperar: quantos ms depois dele. Para o estado que troca sozinho (aba com
//     avanço automático), o clique tem de PARAR o avanço na página de verdade:
//     é comportamento certo (quem clica quer ler), não código só para a régua.
//   - rolarAte (só na sequência): o y final da varredura, em px de rolagem.
//   - video e nasce (só no posicoes-mov.json): o segundo do vídeo em que a
//     entrada começa, e as caixas [x0, y0, x1, y1] do que nasce, em px da foto.
//     Quem lê são o prancha.py movimento e o tinta.py entrada.
//
// Variáveis: QUADRO ou LARGURA e ALTURA; ESPERA (ms depois de rolar, padrão
// 2800); QUADROS (8); PASSO (300); DITTO.
// Sai 1 se faltar seletor ou se o console tiver erro.

import { createRequire } from "node:module";
import { mkdirSync, openSync, readSync, closeSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";

const { URL: URL_, POSICOES } = process.env;
if (!URL_ || !POSICOES) {
  console.error("faltam URL e/ou POSICOES");
  process.exit(1);
}

// largura e altura de um PNG, lidas do cabeçalho (IHDR)
const tamanhoDoPng = (arquivo) => {
  const f = openSync(arquivo, "r");
  const b = Buffer.alloc(24);
  readSync(f, b, 0, 24, 0);
  closeSync(f);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};
let LARGURA = Number(process.env.LARGURA), ALTURA = Number(process.env.ALTURA);
if (process.env.QUADRO) [LARGURA, ALTURA] = tamanhoDoPng(process.env.QUADRO);
if (!LARGURA || !ALTURA) {
  console.error("falta o tamanho da janela: QUADRO=<um quadro recortado do vídeo>, ou LARGURA e ALTURA");
  process.exit(1);
}

const SAIDA = resolve(process.env.SAIDA ?? "./fotos");
const MODO = process.env.MODO ?? "repouso";
const ESPERA = Number(process.env.ESPERA ?? 2800);
const QUADROS = Number(process.env.QUADROS ?? 8);
const PASSO = Number(process.env.PASSO ?? 300);
const DITTO = process.env.DITTO ?? (process.env.USERPROFILE ?? process.env.HOME) + "/dev/ditto";
const posicoes = JSON.parse(readFileSync(POSICOES, "utf-8"));
mkdirSync(SAIDA, { recursive: true });

const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");
const navegador = await chromium.launch();
const erros = [];
const abre = async () => {
  const p = await navegador.newPage({ viewport: { width: LARGURA, height: ALTURA } });
  p.on("console", (m) => m.type() === "error" && erros.push(m.text()));
  p.on("pageerror", (e) => erros.push(e.message));
  return p;
};
let pagina = await abre();

// Instalado antes de a página rodar: enquanto window.__seguraEntrada for verdade, os
// avisos do IntersectionObserver ficam numa fila; __soltaEntrada() entrega a fila e
// solta. Sem a flag, nada muda no comportamento da página.
const RETEM_ENTRADA = () => {
  const Original = window.IntersectionObserver;
  if (!Original || Original.__retido) return;
  const fila = [];
  window.__soltaEntrada = () => {
    window.__seguraEntrada = false;
    fila.splice(0).forEach(([cb, entradas, obs]) => cb(entradas, obs));
  };
  class Retido extends Original {
    constructor(cb, opcoes) {
      super((entradas, obs) => (window.__seguraEntrada ? fila.push([cb, entradas, obs]) : cb(entradas, obs)), opcoes);
    }
  }
  Retido.__retido = true;
  window.IntersectionObserver = Retido;
};

const semBarra = () => pagina.addStyleTag({ content: "html{scrollbar-width:none}html::-webkit-scrollbar{display:none}" });
// devolve o y de rolagem em que parou, ou null se o seletor não existe
const vai = (seletor, y) =>
  pagina.evaluate(([s, y]) => {
    if (!s) return scrollTo(0, y), scrollY;
    const e = document.querySelector(s);
    if (!e) return null;
    scrollTo(0, e.getBoundingClientRect().top + scrollY - y);
    return scrollY;
  }, [seletor, y]);
const clica = async (p) => {
  if (!p.clicar) return true;
  const alvo = pagina.locator(p.clicar).first();
  if (!(await alvo.count())) return false;
  await alvo.click();
  await pagina.waitForTimeout(p.esperar ?? 1200);
  return true;
};

const faltou = [];
if (MODO === "sequencia") {
  for (const [n, p] of posicoes.entries()) {
    // aba nova de verdade a cada posição, com a retenção de entrada (abaixo)
    // instalada antes de a página rodar
    if (n > 0) {
      await pagina.close();
      pagina = await abre();
    }
    await pagina.addInitScript(RETEM_ENTRADA);
    // Página nova a cada posição: entrada com `once` que disparou numa posição
    // (ou numa varredura de rolagem) chegaria morta na seguinte, e o quadro 0
    // dela mostraria tudo já no lugar, que é a assinatura de entrada quebrada.
    // O topo se fotografa desde o primeiro instante; o resto espera a página carregar.
    const varredura = p.rolarAte !== undefined;
    await pagina.goto(URL_, { waitUntil: p.seletor || varredura ? "load" : "commit" });
    await semBarra().catch(() => {});
    // a varredura parte da página assentada: o que ela mostra é a rolagem, não a entrada
    if (varredura) await pagina.waitForTimeout(3500);
    // 🚨 O quadro 0 se tira com o GATILHO DE ENTRADA SEGURO. Uma foto de 1920 px leva
    // uns 800 ms, e a entrada que dispara ao rolar (whileInView, IntersectionObserver)
    // já está quase no fim quando a foto fica pronta: a régua acusava "JÁ ESTAVA LÁ"
    // numa entrada certa (0%, 43% e 94% na mesma posição, só pela variação de tempo).
    // Congelar o relógio não serve: o relógio falso do Playwright para o
    // performance.now e não a WAAPI, e o Motion calcula o início de uma pelo outro (a
    // animação nascia terminada ou no futuro, ao acaso). Aqui o aviso de "entrou na
    // tela" fica retido até a foto 0 sair, e depois é entregue: a entrada corre em
    // tempo real a partir do quadro 1.
    const segura = !varredura;
    if (segura) await pagina.evaluate(() => (window.__seguraEntrada = true));
    const inicio = await vai(p.seletor, p.y);
    if (inicio === null) { faltou.push(p.seletor); continue; }
    if (!(await clica(p))) { faltou.push(p.clicar); continue; }
    let t0 = Date.now();
    for (let i = 0; i < QUADROS; i++) {
      if (segura && i === 1) {
        await pagina.evaluate(() => window.__soltaEntrada?.());
        t0 = Date.now() - PASSO;
      }
      if (p.rolarAte !== undefined) {
        // varredura: cada foto num ponto da rolagem, com um instante para assentar
        await pagina.evaluate((v) => scrollTo(0, v), inicio + ((p.rolarAte - inicio) * i) / (QUADROS - 1));
        await pagina.waitForTimeout(250);
      } else {
        const falta = t0 + i * PASSO - Date.now();
        if (falta > 0) await pagina.waitForTimeout(falta);
      }
      await pagina.screenshot({ path: join(SAIDA, `${p.nome}-${String(i).padStart(2, "0")}.jpg`), type: "jpeg", quality: 75 });
    }
  }
} else {
  await pagina.goto(URL_, { waitUntil: "load" });
  await semBarra();
  await pagina.waitForTimeout(3000);
  const total = await pagina.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += Math.round(ALTURA * 0.6)) {
    await pagina.evaluate((v) => scrollTo(0, v), y);
    await pagina.waitForTimeout(400);
  }
  await pagina.waitForTimeout(2500);
  for (const p of posicoes) {
    if ((await vai(p.seletor, p.y)) === null) { faltou.push(p.seletor); continue; }
    if (!(await clica(p))) { faltou.push(p.clicar); continue; }
    await pagina.waitForTimeout(ESPERA);
    await pagina.screenshot({ path: join(SAIDA, `${p.nome}.png`) });
  }
}
const largura = await pagina.evaluate(() => `${document.documentElement.scrollWidth} de ${document.documentElement.clientWidth}`);
await navegador.close();

console.log(`fotos em ${SAIDA} (${MODO}, janela ${LARGURA}x${ALTURA}); largura rolável ${largura}`);
if (faltou.length) console.log("seletor que não existe: " + faltou.join(" | "));
if (erros.length) console.log("erro no console: " + erros.slice(0, 5).join(" | "));
process.exitCode = faltou.length || erros.length ? 1 : 0;
