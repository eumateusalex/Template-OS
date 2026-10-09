// mede-navegacao.mjs — DIMENSÃO 7: o clone troca de página como o original?
//
// 🚨 Este instrumento é a ferramenta da dimensão 7 da régua ("ir de página a
// página, medido nos dois lados"). Sem ele, a única prova de navegação é
// "instalei o componente e confio" — que é exatamente o tipo de aprovação por
// fé que esta skill existe para proibir, e deixa o clone ser reportado como
// pronto com a dimensão 7 NÃO medida.
//
// O que mede, por salto, em CADA lado:
//   · marca no window sobreviveu?  -> navegação client-side (sem documento novo)
//     marca perdida                -> recarregou o documento (flash branco, e a
//                                     animação de entrada reexecutando)
//   · a URL virou a rota de destino?
//   · a página de destino RENDERIZOU (título e texto próprios dela)?
//   · quanto tempo levou (ordem de grandeza, não benchmark)
//   · e no CLONE: os runtimes da camada continuam VIVOS depois do salto?
//     (`ditto-js` no <html>, `data-ditto-laco`, `data-ditto-slides`,
//     `data-ditto-toggle`, `data-ditto-rotador`) — é o defeito traiçoeiro que
//     o NavegacaoClient existe para evitar: a primeira página funciona e da
//     segunda em diante o comportamento some, sem erro nenhum.
//
// 🚨 CLIQUE REAL do navegador (`page.click`), nunca `el.click()` sintético:
// clique sintético não aciona framework, e mede-se o nada reportando sucesso.
//
// O que o faz SE CALAR (nunca inventa aprovação):
//   - nenhum link interno para rota diferente  -> declara, não mede
//   - o clique não mudou a URL                 -> declara como salto FALHO
//   - a rota de destino não renderizou         -> declara como salto FALHO
//
// Uso:
//   SITE=https://site.com ROTA=/ SALTOS=3 SAIDA=./nav node mede-navegacao.mjs
//
// Variáveis:
//   SITE     URL base a medir — o original OU o clone (obrigatória)
//   ROTA     rota de partida (padrão /)
//   SALTOS   quantos cliques encadeados (padrão 3) — o 2º e o 3º são os que
//            pegam runtime morto depois da primeira troca
//   LARGURA  viewport (padrão 1280)
//   SAIDA    pasta de saída (padrão ./navegacao)
//   DITTO    raiz do ditto (padrão C:/dev/ditto)

import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const SITE = process.env.SITE;
if (!SITE) {
  console.error("falta SITE=<url>");
  process.exit(1);
}
const ROTA = process.env.ROTA ?? "/";
const SALTOS = Number(process.env.SALTOS ?? 3);
const LARGURA = Number(process.env.LARGURA ?? 1280);
const SAIDA = resolve(process.env.SAIDA ?? "./navegacao");
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
mkdirSync(SAIDA, { recursive: true });

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();

/** Estado da camada do clone. No original sai tudo null, e isso é esperado. */
const LER_CAMADA = () => ({
  dittoJs: document.documentElement.classList.contains("ditto-js"),
  lacos: document.querySelectorAll("[data-ditto-laco]").length,
  slides: document.querySelectorAll("[data-ditto-slides]").length,
  toggle: document.querySelectorAll("[data-ditto-toggle]").length,
  rotador: document.querySelectorAll("[data-ditto-rotador]").length,
  acordeao: document.querySelectorAll("[data-ditto-acordeao]").length,
  runtimes: {
    ligar: typeof window.__dittoLigar === "function",
    lacos: typeof window.__dittoLacos === "function",
    slides: typeof window.__dittoSlides === "function",
    toggle: typeof window.__dittoToggle === "function",
    rotador: typeof window.__dittoRotador === "function",
    acordeao: typeof window.__dittoAcordeao === "function",
  },
});

/** Links internos que levam a OUTRA rota, na ordem do documento. */
const COLHER_LINKS = ({ rotaAtual }) => {
  const saida = [];
  for (const a of document.querySelectorAll("a[href]")) {
    const b = a.getBoundingClientRect();
    if (b.width < 4 || b.height < 4) continue; // invisível não se clica
    const cs = getComputedStyle(a);
    if (cs.pointerEvents === "none" || cs.visibility === "hidden") continue;
    let u;
    try { u = new URL(a.getAttribute("href"), location.href); } catch { continue; }
    if (u.origin !== location.origin) continue;
    const destino = u.pathname.replace(/\/+$/, "") || "/";
    if (destino === rotaAtual) continue;
    const texto = String(a.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40);
    if (saida.some((x) => x.destino === destino)) continue;
    // href CRU também: é por ele que o locator acha o elemento
    saida.push({ destino, href: a.getAttribute("href"), texto, y: Math.round(b.top + window.scrollY) });
  }
  return saida;
};

const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: LARGURA, height: 900 } });
const page = await ctx.newPage();

const saltos = [];
let rotaAtual = ROTA.replace(/\/+$/, "") || "/";
await page.goto(new URL(ROTA, SITE).href, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
await page.waitForTimeout(3000);

for (let n = 1; n <= SALTOS; n++) {
  const links = await page.evaluate(COLHER_LINKS, { rotaAtual });
  if (!links.length) {
    saltos.push({ n, de: rotaAtual, erro: "nenhum link interno para outra rota — não medido" });
    break;
  }
  // prefere um link do corpo (mais alto que o cabeçalho) para não medir só o menu
  const escolhido = links.find((l) => l.y > 200) ?? links[0];

  // planta a marca ANTES do clique
  const marca = "m" + Math.random().toString(36).slice(2, 10);
  await page.evaluate((mm) => { window.__marcaDitto = mm; }, marca);

  const t0 = Date.now();
  let erroClique = null;
  try {
    await page.locator(`a[href]`).filter({ hasText: escolhido.texto || /./ }).first().scrollIntoViewIfNeeded({ timeout: 5000 });
  } catch { /* alguns links não precisam de rolagem */ }
  try {
    // clique REAL, pelo destino (o texto pode repetir na página)
    const alvo = page.locator("a[href]").filter({
      has: undefined,
    });
    await page.evaluate((d) => {
      const a = [...document.querySelectorAll("a[href]")].find((x) => {
        try { return (new URL(x.getAttribute("href"), location.href).pathname.replace(/\/+$/, "") || "/") === d; } catch { return false; }
      });
      if (a) a.scrollIntoView({ block: "center" });
    }, escolhido.destino);
    // 🚨 ESPERAR A CAIXA PARAR DE SE MEXER antes de clicar. A página anima
    // (revelação, laços, entrada), e uma caixa lida logo após o scroll fica
    // obsoleta em milissegundos: o clique cai no vazio e o instrumento
    // reporta "não chegou" numa navegação que funciona. Esse falso negativo
    // faz um clone de navegação consertada e provada parecer inavegável
    // (medido no framer-3).
    const lerCaixa = () => page.evaluate((d) => {
      const a = [...document.querySelectorAll("a[href]")].find((x) => {
        try { return (new URL(x.getAttribute("href"), location.href).pathname.replace(/\/+$/, "") || "/") === d; } catch { return false; }
      });
      if (!a) return null;
      const b = a.getBoundingClientRect();
      return { x: Math.round((b.left + b.width / 2) * 10) / 10, y: Math.round((b.top + b.height / 2) * 10) / 10 };
    }, escolhido.destino);

    // 🚨 CLIQUE POR LOCATOR, não por coordenada. Numa página que anima sem
    // parar (laços, revelação), a caixa lida por evaluate fica obsoleta entre
    // a leitura e o clique, e o ponteiro cai fora do link — o instrumento
    // então reporta "não chegou" numa navegação que FUNCIONA. Medido no
    // framer-3: o original (parado no repouso) passava 4/4 e o clone (com os
    // laços vivos) falhava no salto 1, com a sonda direta provando que a URL
    // mudava normalmente.
    //
    // `:visible` é obrigatório: o ditto emite gêmeos por breakpoint com o
    // MESMO href, e o `.first()` cru pega o gêmeo oculto, que nunca fica
    // acionável e estoura o timeout.
    const alvoSel = `a[href="${escolhido.href}"]:visible`;
    try {
      await page.locator(alvoSel).first().click({ timeout: 15000 });
    } catch {
      const caixa = await lerCaixa();
      if (!caixa) throw new Error("link sumiu antes do clique");
      await page.mouse.click(caixa.x, caixa.y);
    }
  } catch (e) {
    erroClique = String(e.message ?? e).slice(0, 120);
  }
  await page.waitForTimeout(2600);
  const ms = Date.now() - t0;

  const depois = await page.evaluate((mm) => ({
    url: location.pathname.replace(/\/+$/, "") || "/",
    marcaViva: window.__marcaDitto === mm,
    titulo: document.title,
    texto: String(document.body.innerText || "").replace(/\s+/g, " ").trim().slice(0, 90),
    nElementos: document.querySelectorAll("body *").length,
  }), marca);
  const camada = await page.evaluate(LER_CAMADA);

  const chegou = decodeURIComponent(depois.url) === decodeURIComponent(escolhido.destino);
  saltos.push({
    n,
    de: rotaAtual,
    paraPedido: escolhido.destino,
    paraChegou: depois.url,
    textoDoLink: escolhido.texto,
    chegou,
    documentoNovo: !depois.marcaViva,
    clientSide: depois.marcaViva,
    renderizou: depois.nElementos > 50,
    titulo: depois.titulo,
    ms,
    erroClique,
    camada,
  });
  if (!chegou) break;
  rotaAtual = depois.url;
}

await navegador.close();

const nome = SITE.includes("127.0.0.1") || SITE.includes("localhost") ? "clone" : "original";
writeFileSync(join(SAIDA, `navegacao-${nome}.json`), JSON.stringify({ site: SITE, rotaInicial: ROTA, largura: LARGURA, saltos }, null, 2));

console.log(`\n=== ${nome} (${SITE})`);
for (const s of saltos) {
  if (s.erro) { console.log(`  salto ${s.n}: ⚠️ ${s.erro}`); continue; }
  const modo = s.clientSide ? "CLIENT-SIDE (sem documento novo)" : "DOCUMENTO NOVO (recarregou)";
  console.log(`  salto ${s.n}: ${s.de} -> ${s.paraChegou} ${s.chegou ? "✓" : "✖ NÃO CHEGOU"} · ${modo} · ${s.ms}ms · "${s.textoDoLink}"`);
  if (s.erroClique) console.log(`     ⚠️ clique: ${s.erroClique}`);
  const c = s.camada;
  const vivos = Object.entries(c.runtimes).filter(([, v]) => v).map(([k]) => k);
  console.log(`     camada: ditto-js=${c.dittoJs} laços=${c.lacos} slides=${c.slides} toggle=${c.toggle} rotador=${c.rotador} acordeão=${c.acordeao} · runtimes vivos: ${vivos.join(",") || "nenhum"}`);
}
console.log(`-> ${join(SAIDA, `navegacao-${nome}.json`)}`);
