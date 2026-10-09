// censo-trilhos.mjs — quantos itens o trilho tem no ORIGINAL, e quantos no CLONE?
//
// 🚨 Existe porque NENHUM gate acusa slide faltando. O trilho de um carrossel
// é fotografado num instante: o que estava fora do quadro não entra no DOM, e
// o que entra fica congelado no `transform` daquele milissegundo. Rotas,
// metadata, cobertura e geometria passam — o elemento ausente não desloca
// ninguém, e o presente está do tamanho certo.
//
// Medido no framer-6: o trilho de depoimentos da home mostra 2
// cópias de cada texto no original (é assim que marquee emenda o laço) e 1 no
// clone. O `compara-conteudo` vê "12 textos ausentes" e o diagnóstico à mão
// custa três sondas. Este instrumento responde de uma vez, em todas as rotas.
//
// ── O que ele mede, e por que assim ─────────────────────────────────────────
//
// Candidato a trilho: elemento com 2+ filhos ELEMENTO cujos filhos têm largura
// parecida (o desvio de largura entre irmãos é pequeno) OU cujos filhos
// declaram `aria-setsize` — que é um presente quando existe, porque é o
// próprio site dizendo quantos itens o conjunto deveria ter.
//
// 🚨 O `aria-setsize` é a régua mais forte e a mais traiçoeira: ele diz o
// tamanho do CONJUNTO, e o marquee duplica o conjunto para emendar. Um trilho
// com `setsize=4` e 8 filhos não está errado: tem 4 itens e 4 clones de laço.
// Por isso o censo reporta os três números separados — filhos, setsize e
// clones (filhos com `aria-hidden=true`) — e nunca conclui por um só.
//
// ⚠️ VARIANTE DE BREAKPOINT. Site responsivo emite o MESMO componente duas
// vezes, uma por faixa de largura, e esconde uma com `display:none`. Contar
// sem olhar visibilidade dá o dobro do número real e casa a árvore errada.
// O censo mede na LARGURA pedida e marca cada trilho como visível ou oculto.
// Medir nas duas larguras que o site troca é obrigação, não zelo.
//
// Casamento original↔clone: pelo TEXTO do primeiro filho com texto (identidade
// forte — o texto de um depoimento não se repete por acaso). Sem casar, o
// trilho é DECLARADO, nunca adivinhado.
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 ROTA=/ \
//   SAIDA=<med>/trilhos node censo-trilhos.mjs
//
// Variáveis:
//   ORIGINAL  URL base do original (obrigatória)
//   CLONE     URL base do clone servido (obrigatória)
//   ROTA      rota única (padrão /), OU ROTAS=rotas.json/lista
//   LARGURA   viewport (padrão 1280)
//   MIN_FILHOS  mínimo de filhos para virar candidato (padrão 2)
//   SAIDA     pasta de saída (padrão ./trilhos)
//   DITTO     raiz do ditto (padrão C:/dev/ditto)

import { createRequire } from "node:module";
import { writeFileSync, mkdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const ORIGINAL = process.env.ORIGINAL;
const CLONE = process.env.CLONE;
if (!ORIGINAL || !CLONE) {
  console.error("faltam ORIGINAL e/ou CLONE");
  process.exit(1);
}
const LARGURA = Number(process.env.LARGURA ?? 1280);
const ALTURA = Number(process.env.ALTURA ?? 900);
const MIN_FILHOS = Number(process.env.MIN_FILHOS ?? 2);
const SAIDA = resolve(process.env.SAIDA ?? "./trilhos");
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
mkdirSync(SAIDA, { recursive: true });

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

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

const COLHER = (minFilhos) => {
  const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();
  const visivelDe = (el) => {
    for (let p = el; p; p = p.parentElement) {
      const c = getComputedStyle(p);
      if (c.display === "none") return false;
      if (c.visibility === "hidden") return false;
    }
    return true;
  };
  const trilhos = [];
  let id = 0;
  for (const el of document.querySelectorAll("ul,ol,div,section,nav")) {
    const filhos = [...el.children];
    if (filhos.length < minFilhos) continue;

    const caixas = filhos.map((f) => f.getBoundingClientRect());
    const larguras = caixas.map((b) => b.width).filter((w) => w > 0);
    if (larguras.length < minFilhos) continue;
    const media = larguras.reduce((a, b) => a + b, 0) / larguras.length;
    if (media < 20) continue;
    const desvio = Math.max(...larguras.map((w) => Math.abs(w - media))) / media;
    const temSetsize = filhos.some((f) => f.hasAttribute("aria-setsize"));

    // Trilho de verdade tem os filhos em FILEIRA (mesma faixa de y) ou é um
    // marquee que ESTOURA a largura do pai. Coluna empilhada não interessa.
    const ys = caixas.map((b) => Math.round(b.top));
    const emFileira = Math.max(...ys) - Math.min(...ys) < Math.max(20, media * 0.5);
    const estoura = el.scrollWidth > el.clientWidth + 4;
    if (!emFileira && !estoura) continue;

    // ⚠️ Irmão de largura muito desigual costuma ser layout, não trilho — mas
    // esse filtro sozinho é CEGO a marquee de logotipo, que é justamente uma
    // fileira de itens de larguras diferentes. Medido no framer-6: o ticker de
    // logos da home (8 itens, de 393px a 159px) não aparecia no censo.
    // Duas provas absolvem o desigual: o site declarar o conjunto
    // (`aria-setsize`) ou o conteúdo estourar o contêiner (assinatura de
    // marquee, que existe para transbordar).
    if (!temSetsize && !estoura && desvio > 0.35) continue;

    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const textoDe = (f) => {
      const t = norm(f.textContent);
      return t ? t.slice(0, 60) : null;
    };
    const comTexto = filhos.map(textoDe).filter(Boolean);

    trilhos.push({
      id: id++,
      cid: el.getAttribute("data-cid") ?? null,
      tag: el.tagName,
      nome: el.getAttribute("data-framer-name") ?? null,
      docY: Math.round(r.top + scrollY),
      w: Math.round(r.width),
      h: Math.round(r.height),
      visivel: visivelDe(el),
      transform: cs.transform === "none" ? null : cs.transform,
      overflow: cs.overflow,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      filhos: filhos.length,
      // 🚨 o que o próprio site declara sobre o conjunto
      setsize: (() => {
        const v = filhos.map((f) => f.getAttribute("aria-setsize")).find(Boolean);
        return v ? Number(v) : null;
      })(),
      clonesDeLaco: filhos.filter((f) => f.getAttribute("aria-hidden") === "true").length,
      filhosVisiveis: filhos.filter((f, i) => caixas[i].width > 0 && caixas[i].height > 0 && visivelDe(f)).length,
      larguraMediaFilho: Math.round(media),
      // assinatura para casar os dois lados
      assinatura: comTexto[0] ?? null,
      textos: comTexto.slice(0, 12),
      // posição de cada filho: denuncia trilho congelado fora da janela
      xs: caixas.map((b) => Math.round(b.left)),
      transformsFilhos: filhos.map((f) => {
        const t = getComputedStyle(f).transform;
        return t === "none" ? null : t;
      }).filter(Boolean).length,
    });
  }
  return trilhos;
};

const ASSENTAR = async () => {
  const passo = Math.max(200, innerHeight * 0.8);
  for (let y = 0; y < document.body.scrollHeight + innerHeight; y += passo) {
    scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 90));
  }
  scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 400));
};

const rotas = carregarRotas();
const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: LARGURA, height: ALTURA } });
const page = await ctx.newPage();

const relatorio = [];
let totalDivergentes = 0;

for (const rota of rotas) {
  const lado = {};
  for (const [nome, base] of [["original", ORIGINAL], ["clone", CLONE]]) {
    const url = new URL(rota, base).href + (nome === "clone" ? `?_v=${Date.now()}` : "");
    await page.goto(url, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(1500);
    await page.evaluate(ASSENTAR);
    lado[nome] = await page.evaluate(COLHER, MIN_FILHOS);
  }

  // casa por assinatura (texto do 1º filho com texto), só entre VISÍVEIS
  const oVis = lado.original.filter((t) => t.visivel && t.assinatura);
  const cVis = lado.clone.filter((t) => t.visivel && t.assinatura);
  const usados = new Set();
  const pares = [];
  const semCasar = [];
  for (const o of oVis) {
    const chave = o.assinatura.slice(0, 40);
    const i = cVis.findIndex((c, idx) => !usados.has(idx) && c.assinatura.slice(0, 40) === chave);
    if (i === -1) { semCasar.push(o); continue; }
    usados.add(i);
    pares.push({ o, c: cVis[i] });
  }

  const linhas = pares.map(({ o, c }) => ({
    assinatura: o.assinatura,
    cid: c.cid,
    docY: o.docY,
    origFilhos: o.filhos,
    cloneFilhos: c.filhos,
    origVisiveis: o.filhosVisiveis,
    cloneVisiveis: c.filhosVisiveis,
    origSetsize: o.setsize,
    cloneSetsize: c.setsize,
    origClonesDeLaco: o.clonesDeLaco,
    cloneClonesDeLaco: c.clonesDeLaco,
    faltamFilhos: o.filhos - c.filhos,
    cloneTransform: c.transform,
    origTransform: o.transform,
    // 🚨 congelado: trilho do clone com transform de translação e nenhuma
    // animação para movê-lo. Aqui só se REGISTRA; quem anima é o gera-marquee.
    cloneCongelado: !!(c.transform && /matrix\(1, 0, 0, 1, (-?\d)/.test(c.transform) && !/matrix\(1, 0, 0, 1, 0, 0\)/.test(c.transform)),
    filhosForaDaJanela: c.xs.filter((x) => x < -10 || x > LARGURA + 10).length,
  }));

  const problemas = linhas.filter((l) => l.faltamFilhos !== 0 || l.cloneCongelado || l.origVisiveis !== l.cloneVisiveis);
  totalDivergentes += problemas.length;

  relatorio.push({ rota, largura: LARGURA, trilhosOriginal: oVis.length, trilhosClone: cVis.length, pares: linhas, semCasar: semCasar.map((o) => ({ assinatura: o.assinatura, docY: o.docY, filhos: o.filhos })) });

  console.log(`\n${problemas.length === 0 ? "✅" : "🚨"} ${rota}  trilhos visíveis: original ${oVis.length} · clone ${cVis.length} · casados ${linhas.length}`);
  for (const l of linhas) {
    const mau = l.faltamFilhos !== 0 || l.cloneCongelado || l.origVisiveis !== l.cloneVisiveis;
    console.log(
      `   ${mau ? "🚨" : "  "} ${String(l.cid ?? "-").padEnd(7)} y=${String(l.docY).padStart(6)}  filhos ${l.cloneFilhos}/${l.origFilhos}` +
        `  visíveis ${l.cloneVisiveis}/${l.origVisiveis}` +
        (l.origSetsize ? `  setsize=${l.origSetsize}` : "") +
        (l.origClonesDeLaco || l.cloneClonesDeLaco ? `  laço ${l.cloneClonesDeLaco}/${l.origClonesDeLaco}` : "") +
        (l.cloneCongelado ? `  CONGELADO ${l.cloneTransform}` : "") +
        (l.filhosForaDaJanela ? `  ${l.filhosForaDaJanela} fora da janela` : "") +
        `  "${String(l.assinatura).slice(0, 34)}"`
    );
  }
  for (const s of semCasar) console.log(`   ⚠️ só no original: y=${s.docY} ${s.filhos} filhos "${String(s.assinatura).slice(0, 40)}"`);
}

await navegador.close();
writeFileSync(join(SAIDA, `trilhos-${LARGURA}.json`), JSON.stringify({ largura: LARGURA, gerado: new Date().toISOString(), relatorio }, null, 2));

console.log(`\n${"=".repeat(72)}`);
console.log(`trilhos com divergência: ${totalDivergentes}`);
console.log(`saída: ${join(SAIDA, `trilhos-${LARGURA}.json`)}`);
process.exit(totalDivergentes === 0 ? 0 : 2);
