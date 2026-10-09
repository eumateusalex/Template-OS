// mede-transicao-pagina.mjs — o que acontece VISUALMENTE entre uma rota e a
// próxima. A dimensão 7 media só o MECANISMO da navegação; isto mede a cara.
//
// 🚨 Por que existe. O `mede-navegacao.mjs` clica e espera 2600ms antes de ler
// qualquer coisa — qualquer fade, slide ou cortina do original já terminou
// quando ele olha. E o `inventario-movimento.mjs` nunca navega: as três fontes
// dele são todas intra-página. Resultado: a transição entre páginas era um
// ponto cego COMPLETO da skill, e um clone podia trocar de rota com um corte
// seco onde o original dissolve, sem nenhum instrumento acusar.
//
// Como sobrevive à troca. Em navegação client-side o documento PERSISTE, então
// um `evaluate` iniciado antes do clique continua rodando durante a troca — é
// nele que a amostragem mora. O `addInitScript` planta uma marca de documento
// e um espião no history: se a marca sumir, houve documento novo (recarga), e
// aí não existe curva para medir, existe FLASH — que é declarado como tal, não
// inventado.
//
// ⚠️ Não se guarda referência de nó: na troca de rota o React DESTRÓI a árvore
// antiga e monta outra. A cada quadro os filhos são reidentificados por uma
// marca incremental posta neles (`el.__tp`). O quadro em que uma marca some e
// outra nasce é o SWAP: a série da marca que morre é o fade de SAÍDA, a da que
// nasce é o de ENTRADA. Casar por índice aqui daria a curva de um nó com a do
// outro — o erro clássico de comparar duas fotos da mesma página por posição.
//
// Uso:
//   SITE=https://site.com ROTA=/ SALTOS=3 SAIDA=./transicao \
//   node mede-transicao-pagina.mjs
//
// Variáveis: SITE ROTA SALTOS LARGURA SAIDA TETO_MS ESTAVEL_MS DITTO

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { createRequire } from "node:module";

const SITE = process.env.SITE;
if (!SITE) {
  console.error("falta SITE=<url>");
  process.exit(1);
}
const ROTA = process.env.ROTA ?? "/";
const SALTOS = Number(process.env.SALTOS ?? 3);
const LARGURA = Number(process.env.LARGURA ?? 1280);
const SAIDA = resolve(process.env.SAIDA ?? "./transicao");
const TETO_MS = Number(process.env.TETO_MS ?? 3500);
const ESTAVEL_MS = Number(process.env.ESTAVEL_MS ?? 250);
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
mkdirSync(SAIDA, { recursive: true });

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

const PLANTIO = () => {
  window.__tpMarcaDoc = Math.random().toString(36).slice(2);
  window.__tpHistorico = [];
  for (const nome of ["pushState", "replaceState"]) {
    const orig = history[nome].bind(history);
    history[nome] = function (...args) {
      try {
        window.__tpHistorico.push({ tipo: nome, t: performance.now(), url: String(args[2] ?? "") });
      } catch {}
      return orig(...args);
    };
  }
};

const COLETOR = ({ tetoMs, estavelMs }) =>
  new Promise((resolve) => {
    const inicio = performance.now();
    const urlInicial = location.pathname;
    let n = 0;
    const marcar = (el) => {
      if (!el.__tp) el.__tp = ++n;
      return el.__tp;
    };
    const quadros = [];

    const ler = () => {
      const alvos = [];
      for (const f of Array.from(document.body.children)) {
        if (f.tagName === "SCRIPT" || f.tagName === "STYLE" || f.tagName === "LINK") continue;
        const r = f.getBoundingClientRect();
        if (r.width <= 0 && r.height <= 0) continue;
        const cs = getComputedStyle(f);
        alvos.push({
          m: marcar(f),
          tag: f.tagName,
          op: cs.opacity,
          tf: cs.transform,
          fi: cs.filter,
          h: Math.round(r.height),
          nivel: 1,
        });
        for (const g of Array.from(f.children)) {
          if (g.tagName === "SCRIPT" || g.tagName === "STYLE") continue;
          const rg = g.getBoundingClientRect();
          if (rg.width <= 0 && rg.height <= 0) continue;
          const csg = getComputedStyle(g);
          alvos.push({
            m: marcar(g),
            tag: g.tagName,
            op: csg.opacity,
            tf: csg.transform,
            fi: csg.filter,
            h: Math.round(rg.height),
            nivel: 2,
          });
        }
      }
      const b = getComputedStyle(document.body);
      return {
        t: performance.now() - inicio,
        url: location.pathname,
        body: { op: b.opacity, tf: b.transform, fi: b.filter },
        alvos,
      };
    };

    let urlMudouEm = null;
    let ultimaMudanca = 0;
    let anterior = JSON.stringify(ler().alvos.map((a) => [a.m, a.op, a.tf, a.fi]));
    quadros.push(ler());

    const passo = () => {
      const q = ler();
      quadros.push(q);
      const agora = JSON.stringify(q.alvos.map((a) => [a.m, a.op, a.tf, a.fi]));
      if (agora !== anterior) {
        ultimaMudanca = q.t;
        anterior = agora;
      }
      if (urlMudouEm === null && q.url !== urlInicial) urlMudouEm = q.t;
      const assentou = urlMudouEm !== null && q.t - ultimaMudanca >= estavelMs;
      if (assentou || q.t >= tetoMs) {
        return resolve({
          quadros,
          urlInicial,
          urlMudouEm,
          marcaDoc: window.__tpMarcaDoc ?? null,
          historico: window.__tpHistorico ?? [],
          estourouTeto: q.t >= tetoMs && !assentou,
        });
      }
      requestAnimationFrame(passo);
    };
    requestAnimationFrame(passo);
  });

const num = (s) => (String(s).match(/-?\d+\.?\d*/g) || []).map(Number);

/** Série de uma marca ao longo dos quadros, e a curva que ela desenha. */
function serie(quadros, marca, campo) {
  const pts = [];
  for (const q of quadros) {
    const a = q.alvos.find((x) => x.m === marca);
    if (a) pts.push({ t: q.t, v: a[campo] });
  }
  return pts;
}

function analisarSerie(pts) {
  if (pts.length < 3) return null;
  const v0 = num(pts[0].v);
  const vf = num(pts[pts.length - 1].v);
  if (!v0.length || v0.length !== vf.length) return null;
  let exc = 0;
  for (let i = 0; i < v0.length; i++) exc += (vf[i] - v0[i]) ** 2;
  exc = Math.sqrt(exc);
  if (exc < 0.01) return null; // não mexeu

  let iPrim = -1, iUlt = -1;
  for (let k = 1; k < pts.length; k++) {
    if (pts[k].v !== pts[k - 1].v) {
      if (iPrim < 0) iPrim = k;
      iUlt = k;
    }
  }
  if (iPrim < 0) return null;
  const tIni = pts[iPrim - 1].t;
  const tFim = pts[iUlt].t;

  const prog = (v) => {
    const a = num(v);
    if (a.length !== v0.length) return null;
    let s = 0;
    for (let i = 0; i < a.length; i++) s += (a[i] - v0[i]) * (vf[i] - v0[i]);
    return s / (exc * exc);
  };
  const N = 25;
  const curva = [];
  for (let k = 0; k < N; k++) {
    const alvo = tIni + ((tFim - tIni) * k) / (N - 1);
    let j = Math.max(0, iPrim - 1);
    while (j < pts.length - 1 && pts[j + 1].t < alvo) j++;
    const A = pts[j], B = pts[Math.min(j + 1, pts.length - 1)];
    const pa = prog(A.v), pb = prog(B.v);
    if (pa === null || pb === null) { curva.push(k / (N - 1)); continue; }
    const f = B.t === A.t ? 0 : (alvo - A.t) / (B.t - A.t);
    curva.push(Math.max(0, Math.min(1, pa + (pb - pa) * f)));
  }
  curva[0] = 0;
  curva[N - 1] = 1;
  return {
    de: pts[0].v,
    para: pts[pts.length - 1].v,
    inicioMs: Math.round(tIni),
    fimMs: Math.round(tFim),
    duracaoMs: Math.round(tFim - tIni),
    curva: curva.map((x) => Math.round(x * 1e4) / 1e4),
    curvaLinear: "linear(" + curva.map((x) => Math.round(x * 1e4) / 1e4).join(", ") + ")",
  };
}

function analisar(coleta) {
  const { quadros } = coleta;
  const primeiras = new Set(quadros[0].alvos.map((a) => a.m));
  const ultimas = new Set(quadros[quadros.length - 1].alvos.map((a) => a.m));
  const morreram = [...primeiras].filter((m) => !ultimas.has(m));
  const nasceram = [...ultimas].filter((m) => !primeiras.has(m));

  const melhor = (marcas) => {
    let top = null;
    for (const m of marcas) {
      for (const campo of ["op", "tf", "fi"]) {
        const a = analisarSerie(serie(quadros, m, campo));
        if (!a) continue;
        const cand = { marca: m, prop: campo === "op" ? "opacity" : campo === "tf" ? "transform" : "filter", ...a };
        if (!top || cand.duracaoMs > top.duracaoMs) top = cand;
      }
    }
    return top;
  };

  const saida = melhor(morreram);
  const entrada = melhor(nasceram);
  const corpo = (() => {
    for (const campo of ["op", "tf", "fi"]) {
      const pts = quadros.map((q) => ({ t: q.t, v: q.body[campo] }));
      const a = analisarSerie(pts);
      if (a) return { prop: campo === "op" ? "opacity" : campo === "tf" ? "transform" : "filter", ...a };
    }
    return null;
  })();

  return {
    saida: saida ? { houve: true, ...saida } : { houve: false },
    entrada: entrada ? { houve: true, ...entrada } : { houve: false },
    body: corpo ? { houve: true, ...corpo } : { houve: false },
    sobreposicao:
      saida && entrada ? entrada.inicioMs < saida.fimMs : false,
    nQuadros: quadros.length,
    marcasQueMorreram: morreram.length,
    marcasQueNasceram: nasceram.length,
  };
}

// ---------- execução ----------

const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: LARGURA, height: 900 } });
await ctx.addInitScript(PLANTIO);
const page = await ctx.newPage();

const saltos = [];
let atual = ROTA;

for (let n = 1; n <= SALTOS; n++) {
  await page.goto(new URL(atual, SITE).href + (SITE.includes("127.0.0.1") ? "?_v=" + Date.now() : ""), {
    waitUntil: "load",
    timeout: 60000,
  });
  await page.waitForTimeout(2200);

  const marcaAntes = await page.evaluate(() => window.__tpMarcaDoc ?? null);

  const escolha = await page.evaluate((atual) => {
    const limpar = (h) => {
      try {
        return new URL(h, location.href).pathname.replace(/\/$/, "") || "/";
      } catch {
        return null;
      }
    };
    for (const a of Array.from(document.querySelectorAll("a[href]"))) {
      const href = a.getAttribute("href") || "";
      if (/^(https?:)?\/\//.test(href) && !href.includes(location.host)) continue;
      if (/^(mailto:|tel:|#)/.test(href)) continue;
      const p = limpar(href);
      if (!p || p === (atual.replace(/\/$/, "") || "/")) continue;
      const r = a.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      a.setAttribute("data-tp-alvo", "1");
      return { destino: p, texto: (a.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40) };
    }
    return null;
  }, atual);

  if (!escolha) {
    saltos.push({ n, de: atual, erro: "nenhum link interno visível para outra rota" });
    break;
  }

  // coletor PRIMEIRO, clique depois: a curva começa antes do primeiro quadro
  const coleta = page.evaluate(COLETOR, { tetoMs: TETO_MS, estavelMs: ESTAVEL_MS });
  let erroClique = null;
  try {
    await page.locator("[data-tp-alvo]").first().click({ timeout: 5000 });
  } catch (e) {
    erroClique = String(e).slice(0, 80);
  }
  const c = await coleta;

  const marcaDepois = c.marcaDoc;
  const documentoNovo = marcaAntes !== marcaDepois || marcaDepois === null;
  const a = analisar(c);

  saltos.push({
    n,
    de: atual,
    para: escolha.destino,
    texto: escolha.texto,
    erroClique,
    clientSide: !documentoNovo,
    documentoNovo,
    urlMudouEmMs: c.urlMudouEm === null ? null : Math.round(c.urlMudouEm),
    pushState: (c.historico || []).length,
    estourouTeto: c.estourouTeto,
    ...a,
  });

  const r = saltos[saltos.length - 1];
  console.log(
    `salto ${n}: ${r.de} → ${r.para}  clientSide=${r.clientSide}  url=${r.urlMudouEmMs}ms  ` +
      `saída=${r.saida.houve ? r.saida.prop + " " + r.saida.duracaoMs + "ms" : "não"}  ` +
      `entrada=${r.entrada.houve ? r.entrada.prop + " " + r.entrada.duracaoMs + "ms" : "não"}  ` +
      `sobrepõe=${r.sobreposicao}`
  );
  atual = escolha.destino;
}

await navegador.close();

const nome = SITE.includes("127.0.0.1") || SITE.includes("localhost") ? "transicao-clone.json" : "transicao-original.json";
const arq = join(SAIDA, nome);
writeFileSync(arq, JSON.stringify({ site: SITE, rota: ROTA, largura: LARGURA, saltos }, null, 2), "utf8");

const comTransicao = saltos.filter((s) => s.saida?.houve || s.entrada?.houve).length;
console.log(`\n${saltos.length} salto(s); ${comTransicao} com transição visual → ${arq}`);
if (!comTransicao && saltos.length) {
  console.log("⚠️ nenhuma transição medida: a troca é seca. Reproduzir isso no clone é NÃO escrever transição nenhuma.");
}
