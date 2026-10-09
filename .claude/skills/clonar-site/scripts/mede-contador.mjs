// mede-contador.mjs — o número que SOBE quando a seção entra na tela.
//
// Existe porque a captura fotografa a página num instante e o contador está no
// meio da contagem quando o obturador dispara. O clone nasce com um número
// QUALQUER, e ninguém percebe: rotas, metadata, cobertura e até geometria
// passam, porque o elemento está lá, do tamanho certo. Só o texto está errado —
// e "errado" aqui não é diferença de estilo, é o número do negócio.
//
// 🚨 O sintoma que denuncia sem medir nada: o site responsivo emite DUAS
// variantes do mesmo bloco (uma por breakpoint) e elas vêm com números
// DIFERENTES entre si (medido no framer-4: 83/1/12/4 na 2xl contra 80/0/10/3
// na menor). Dois valores para o mesmo dado só acontecem se o valor estava
// mudando durante a captura.
//
// O que faz: acha os candidatos (folha cujo texto é só dígito), arma um coletor
// por rAF, ROLA até a seção e grava a série texto(t) de cada um. Da série saem:
//   - valorInicial (de onde a contagem parte)
//   - valorFinal   (o valor de REPOUSO — é este que vai para o JSX)
//   - duracaoMs    (do primeiro movimento ao último)
//   - curva[]      normalizada 0→1 em 25 amostras, pronta para o runtime
//   - gatilho      quanto da seção estava visível quando o número saiu do lugar
//   - caixaFinal   largura/altura do elemento e do pai NO REPOUSO (o Framer
//                  congela largura em px derivada do dígito: 83 e 8 não medem
//                  igual, e a classe copiada do instante errado aperta a caixa)
//
// 🚨 O guard: candidato que não mudar de texto durante toda a amostragem é
// declarado ESTÁTICO e sai com a nota "não é contador" — o instrumento nunca
// inventa animação para número que só está escrito na página.
//
// Uso:
//   SITE=https://exemplo.com/ SAIDA=./contador node mede-contador.mjs
//
// Variáveis:
//   SITE      URL a medir (obrigatória)
//   ROTA      rota (padrão /)
//   SAIDA     pasta de saída (padrão ./contador)
//   LARGURA   viewport (padrão 1280) — medir nas DUAS larguras que o site troca
//   ALTURA    viewport (padrão 900)
//   AMOSTRA   ms de amostragem depois de rolar (padrão 6000)
//   MIN_DIG   mínimo de dígitos para virar candidato (padrão 1)
//   DITTO     raiz do ditto (padrão C:/dev/ditto)

import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const SITE = process.env.SITE;
if (!SITE) {
  console.error("falta SITE=<url>");
  process.exit(1);
}
const ROTA = process.env.ROTA ?? "/";
const SAIDA = resolve(process.env.SAIDA ?? "./contador");
const LARGURA = Number(process.env.LARGURA ?? 1280);
const ALTURA = Number(process.env.ALTURA ?? 900);
const AMOSTRA = Number(process.env.AMOSTRA ?? 6000);
const MIN_DIG = Number(process.env.MIN_DIG ?? 1);
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
mkdirSync(SAIDA, { recursive: true });

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

const url = new URL(ROTA, SITE).href;
const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: LARGURA, height: ALTURA } });
await pagina.goto(url, { waitUntil: "load", timeout: 60000 });
await pagina.waitForTimeout(2000);

// ---------------------------------------------------------------------------
// 1. Candidatos: folha (sem filho elemento) cujo texto inteiro é numérico.
//    Carimbo data-mct para identidade estável — índice mente se o DOM reordena.
// ---------------------------------------------------------------------------
const candidatos = await pagina.evaluate((minDig) => {
  const eNumero = (t) => new RegExp(`^\\d{${minDig},}(?:[.,]\\d+)*$`).test(t.trim());
  let i = 0;
  const achados = [];
  for (const el of document.querySelectorAll("body *")) {
    if (el.children.length) continue;
    const t = (el.textContent || "").trim();
    if (!t || !eNumero(t)) continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    el.setAttribute("data-mct", String(i));
    achados.push({
      id: String(i),
      tag: el.tagName,
      textoNaCaptura: t,
      docY: Math.round(r.top + scrollY),
      x: Math.round(r.left * 10) / 10,
      fonte: `${cs.fontSize} / ${cs.lineHeight} ${cs.fontFamily.split(",")[0]}`,
      // o vizinho de texto (sufixo "+" / "%" mora fora do span do dígito)
      irmaoDepois: el.nextElementSibling ? (el.nextElementSibling.textContent || "").trim().slice(0, 8) : null,
      // rótulo: a folha de texto não-numérica mais próxima abaixo, dentro do avô
      rotulo: (() => {
        const avo = el.parentElement?.parentElement;
        if (!avo) return null;
        for (const c of avo.querySelectorAll("*")) {
          if (c.children.length) continue;
          const tc = (c.textContent || "").trim();
          if (tc && !/^\d/.test(tc) && tc.length > 2) return tc.slice(0, 48);
        }
        return null;
      })(),
    });
    i++;
  }
  return achados;
}, MIN_DIG);

if (candidatos.length === 0) {
  console.log("nenhum elemento numérico visível — nada a medir.");
  writeFileSync(join(SAIDA, "contador.json"), JSON.stringify({ site: url, largura: LARGURA, contadores: [], candidatos: 0 }, null, 2));
  await navegador.close();
  process.exit(0);
}

console.log(`candidatos numéricos: ${candidatos.length} · largura=${LARGURA}`);

// ---------------------------------------------------------------------------
// 2. Agrupar por seção (docY próximo) e medir um grupo por vez: recarrega,
//    arma o coletor ANTES de rolar, rola, e grava texto(t) por quadro.
//    Recarregar é obrigatório: contador dispara UMA vez, e o primeiro grupo
//    medido já queimou o gatilho dos que estavam na mesma tela.
// ---------------------------------------------------------------------------
const grupos = [];
for (const c of candidatos) {
  const g = grupos.find((g) => Math.abs(g.docY - c.docY) < 400);
  if (g) g.ids.push(c.id);
  else grupos.push({ docY: c.docY, ids: [c.id] });
}
console.log(`grupos (seções distintas): ${grupos.length}`);

const medidos = [];
for (const grupo of grupos) {
  await pagina.goto(url, { waitUntil: "load", timeout: 60000 });
  await pagina.waitForTimeout(2000);
  // recarimbar: o DOM é novo depois do reload
  await pagina.evaluate((minDig) => {
    const eNumero = (t) => new RegExp(`^\\d{${minDig},}(?:[.,]\\d+)*$`).test(t.trim());
    let i = 0;
    for (const el of document.querySelectorAll("body *")) {
      if (el.children.length) continue;
      const t = (el.textContent || "").trim();
      if (!t || !eNumero(t)) continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none") continue;
      el.setAttribute("data-mct", String(i++));
    }
  }, MIN_DIG);

  const serie = await pagina.evaluate(
    ({ ids, ms, alvoY }) =>
      new Promise((fim) => {
        const els = ids.map((id) => document.querySelector(`[data-mct="${id}"]`));
        const pontos = [];
        const t0 = performance.now();
        // fração da seção visível no instante t — para saber QUANDO dispara
        const visivel = () => {
          const el = els.find(Boolean);
          if (!el) return 0;
          const r = el.getBoundingClientRect();
          const dentro = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
          return Math.round(Math.max(0, Math.min(1, dentro / Math.max(1, r.height))) * 100) / 100;
        };
        // rola no quadro seguinte ao início da coleta: assim a série contém o
        // estado ANTES do gatilho, que é o valorInicial verdadeiro.
        let rolou = false;
        function tick(t) {
          const dt = Math.round((t - t0) * 10) / 10;
          pontos.push([dt, els.map((el) => (el ? (el.textContent || "").trim() : null)), visivel()]);
          if (!rolou && dt > 120) {
            scrollTo(0, Math.max(0, alvoY - innerHeight * 0.55));
            rolou = true;
          }
          if (dt < ms) requestAnimationFrame(tick);
          else fim(pontos);
        }
        requestAnimationFrame(tick);
      }),
    { ids: grupo.ids, ms: AMOSTRA, alvoY: grupo.docY }
  );

  // caixa no REPOUSO, depois que tudo parou
  await pagina.waitForTimeout(600);
  const caixas = await pagina.evaluate((ids) =>
    ids.map((id) => {
      const el = document.querySelector(`[data-mct="${id}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const p = el.parentElement?.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const csp = el.parentElement ? getComputedStyle(el.parentElement) : null;
      return {
        texto: (el.textContent || "").trim(),
        w: Math.round(r.width * 100) / 100,
        h: Math.round(r.height * 100) / 100,
        paiW: p ? Math.round(p.width * 100) / 100 : null,
        paiH: p ? Math.round(p.height * 100) / 100 : null,
        paiLarguraDeclarada: csp ? csp.width : null,
        larguraDeclarada: cs.width,
        display: cs.display,
      };
    })
  , grupo.ids);

  // --- análise por candidato -----------------------------------------------
  grupo.ids.forEach((id, k) => {
    const base = candidatos.find((c) => c.id === id);
    const valores = serie.map((p) => p[1][k]).filter((v) => v !== null);
    if (valores.length === 0) return;
    const num = (s) => Number(String(s).replace(/[^\d]/g, ""));
    const distintos = [...new Set(valores)];

    if (distintos.length <= 1) {
      medidos.push({ ...base, ...(caixas[k] ?? {}), estatico: true, nota: "texto nunca mudou — não é contador", amostras: valores.length });
      return;
    }

    // índices do primeiro e do último movimento
    let iIni = 0;
    for (let i = 1; i < serie.length; i++) {
      if (serie[i][1][k] !== serie[0][1][k]) { iIni = i - 1; break; }
    }
    let iFim = serie.length - 1;
    for (let i = serie.length - 1; i > 0; i--) {
      if (serie[i][1][k] !== serie[serie.length - 1][1][k]) { iFim = i + 1 < serie.length ? i + 1 : i; break; }
    }
    const vIni = num(serie[iIni][1][k]);
    const vFim = num(serie[serie.length - 1][1][k]);
    const t0 = serie[iIni][0];
    const dur = serie[iFim][0] - t0;
    const amplitude = vFim - vIni;

    const curva = Array.from({ length: 25 }, (_, j) => {
      const alvoT = t0 + (dur * j) / 24;
      let p = serie[iIni];
      for (const q of serie) { if (q[0] <= alvoT) p = q; else break; }
      return amplitude === 0 ? 1 : Math.round(((num(p[1][k]) - vIni) / amplitude) * 1000) / 1000;
    });

    medidos.push({
      ...base,
      ...(caixas[k] ?? {}),
      estatico: false,
      valorInicial: vIni,
      valorFinal: vFim,
      // o formato importa: "07" e "7" não são o mesmo texto na tela
      textoFinal: serie[serie.length - 1][1][k],
      digitos: String(serie[serie.length - 1][1][k]).length,
      duracaoMs: Math.round(dur),
      visivelNoGatilho: serie[iIni][2],
      passos: distintos.length,
      curva,
      amostras: valores.length,
    });
  });
}

// ---------------------------------------------------------------------------
const contadores = medidos.filter((m) => !m.estatico);
const estaticos = medidos.filter((m) => m.estatico);

for (const m of contadores) {
  console.log(
    `  [${m.id}] ${m.rotulo ?? "(sem rótulo)"} : ${m.valorInicial} → ${m.valorFinal}` +
      `${m.irmaoDepois ? ` (sufixo "${m.irmaoDepois}")` : ""} · ${m.duracaoMs}ms · ${m.passos} passos` +
      ` · caixa ${m.w}x${m.h} (pai ${m.paiW}) · captura pegou "${m.textoNaCaptura}"` +
      (m.textoNaCaptura !== m.textoFinal ? `  🚨 CAPTURA NO MEIO DA CONTAGEM` : "")
  );
}
if (estaticos.length) {
  console.log(`\n${estaticos.length} número(s) estático(s) — declarados, não são contador:`);
  for (const m of estaticos.slice(0, 12)) console.log(`  [${m.id}] "${m.textoNaCaptura}" ${m.rotulo ? `(${m.rotulo})` : ""}`);
}

const resultado = { site: url, rota: ROTA, largura: LARGURA, altura: ALTURA, amostraMs: AMOSTRA, candidatos: candidatos.length, contadores, estaticos };
writeFileSync(join(SAIDA, "contador.json"), JSON.stringify(resultado, null, 2));
console.log(`\n-> ${join(SAIDA, "contador.json")}  (${contadores.length} contador(es), ${estaticos.length} estático(s))`);
await navegador.close();
