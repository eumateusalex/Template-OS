// compara-geometria.mjs — CADA elemento está no lugar certo?
//
// 🚨 Este instrumento existe porque o `compara-visual.mjs` deu 42/42 com
// Δaltura 0px enquanto a página estava VISIVELMENTE desmontada por dentro.
// Altura de página, marcos e fontes são agregados: um elemento deslocado
// 120px para o lado não muda nenhum dos três. O olho vê, o agregado não.
//
// O que ele faz: colhe todo elemento com texto próprio e toda imagem nos DOIS
// lados, casa por texto normalizado com desempate por posição, e reporta o
// deslocamento de cada um em x, y, largura e altura.
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 ROTA=/ \
//   LARGURA=1280 SAIDA=./geo node compara-geometria.mjs
//
// Variáveis:
//   ORIGINAL  URL base do original (obrigatória)
//   CLONE     URL base do clone servido (obrigatória)
//   ROTA      rota única (padrão /), OU ROTAS=arquivo/lista para varrer várias
//   LARGURA   viewport (padrão 1280)
//   TOL       px de tolerância para considerar "no lugar" (padrão 4)
//   TOPO      quantos piores listar por rota (padrão 25)
//   SAIDA     pasta de saída (padrão ./geometria)
//   SHOTS     1 para gravar screenshot dos dois lados
//   ASSENTAR  1 (padrão) rola a página toda antes de medir

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
const TOL = Number(process.env.TOL ?? 4);
const TOPO = Number(process.env.TOPO ?? 25);
const SAIDA = resolve(process.env.SAIDA ?? "./geometria");
const SHOTS = process.env.SHOTS === "1";
const ASSENTAR = process.env.ASSENTAR !== "0";
const DERIVA_MS = Number(process.env.DERIVA_MS ?? 1600);
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

function carregarRotas() {
  const r = process.env.ROTAS;
  if (r) {
    // ⚠️ Tem que ser ARQUIVO, não só "existe": "/" é um caminho que EXISTE
    // (a raiz do disco) e o readFileSync estoura com EISDIR.
    if (existsSync(r) && statSync(r).isFile()) {
      const j = JSON.parse(readFileSync(r, "utf8"));
      return j.rotas.filter((x) => x.status === 200 || x.status === null).map((x) => x.rota);
    }
    return r.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [process.env.ROTA ?? "/"];
}

// Colhe, na ordem do documento, todo elemento que tem texto PRÓPRIO (nó de
// texto filho direto) e toda imagem. Contêiner sem texto próprio fica de fora
// de propósito: o texto dele é o dos filhos, e casá-lo infla o resultado com
// duplicata do mesmo deslocamento.
const COLHER = () => {
  const norm = (s) => s.replace(/\s+/g, " ").trim();
  const saida = [];
  const todos = document.querySelectorAll("body *");
  let i = 0;
  for (const el of todos) {
    i++;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    const dx = window.scrollX;
    const dy = window.scrollY;
    const base = {
      ordem: i,
      tag: el.tagName.toLowerCase(),
      cid: el.getAttribute("data-cid") || null,
      x: Math.round((r.left + dx) * 10) / 10,
      y: Math.round((r.top + dy) * 10) / 10,
      w: Math.round(r.width * 10) / 10,
      h: Math.round(r.height * 10) / 10,
      transform: cs.transform === "none" ? null : cs.transform,
      opacity: Number(cs.opacity),
    };
    let proprio = "";
    for (const n of el.childNodes) if (n.nodeType === 3) proprio += n.nodeValue;
    proprio = norm(proprio);
    if (proprio) saida.push({ ...base, tipo: "texto", texto: proprio.slice(0, 60) });
    if (el.tagName === "IMG") {
      // 🚨 NÃO casar imagem por nome de arquivo. O ditto rebatiza todo binário
      // para /assets/cloned/images/<hash>.jpg, então o nome NUNCA bate e o
      // instrumento acusa "imagem faltando" para imagem que está lá (31 falsos
      // positivos numa rodada).
      // A identidade da imagem aqui é a CAIXA dela, com o src guardado à parte
      // para conferência.
      const src = String(el.currentSrc || el.src || "").split("/").pop().split("?")[0];
      saida.push({
        ...base,
        tipo: "img",
        texto: `${Math.round(base.w)}x${Math.round(base.h)}`,
        src: src.slice(0, 60),
        alt: (el.getAttribute("alt") || "").slice(0, 40),
      });
    }
  }
  return { itens: saida, alturaPagina: document.documentElement.scrollHeight };
};

/** Percorre a página inteira e volta ao topo.
 *
 *  🚨 O tempo de assentamento no fim NÃO é enfeite. Com 400ms, a nav do
 *  site-exemplo ainda estava colapsada no original e já expandida no clone, e a
 *  medição acusou 158.8px de desvio em 6 elementos que estavam certos. O
 *  estado que se quer é "página já percorrida, de volta ao topo, PARADA" —
 *  e ele leva mais de um segundo para existir. */
async function assentar(page) {
  await page.evaluate(async () => {
    const passo = Math.max(200, window.innerHeight * 0.75);
    const fim = document.documentElement.scrollHeight;
    for (let y = 0; y < fim + window.innerHeight; y += passo) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 110));
    }
    // 🚨 VOLTAR EM DEGRAUS, nunca de um salto.
    //
    // O original decide reexpandir a nav observando a DIREÇÃO do scroll. Um
    // `scrollTo(0)` vindo do rodapé é um evento só, e o framework não o lê
    // como "subiu ao topo": a nav ficava colapsada no original e expandida no
    // clone, e a medição culpava 6 elementos que estavam certos por 158.8px.
    for (let y = window.scrollY; y > 0; y -= passo) {
      window.scrollTo({ top: Math.max(0, y - passo), behavior: "instant" });
      await new Promise((r) => setTimeout(r, 110));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    await new Promise((r) => setTimeout(r, 1800));
  });
}

async function medir(page, url, tag, rota) {
  await page.goto(url, { waitUntil: ESPERA, timeout: 60000 }).catch(() => {});
      if (ASSENTA) await page.waitForTimeout(ASSENTA);
  // 🚨 Esperar a animação de ENTRADA terminar. Medir durante ela mede o estado
  // intermediário e acusa deslocamento que não existe.
  await page.waitForTimeout(3000);
  if (ASSENTAR) await assentar(page);
  // 🚨 Rolar a página inteira DISPARA coisa que leva tempo para terminar:
  // entrada, revelação e, sobretudo, contador numérico. Fotografar no quadro
  // seguinte pega tudo isso no meio, e no meio os dois lados nunca estão na
  // mesma fase — o texto do contador nem casa, porque o texto É o número
  // (medido no framer-4: o original mostrava 87, 15 e 6 enquanto o clone
  // mostrava outros três, e os seis viraram "só no original"/"só no clone").
  // O maior contador medido leva 1,7s; 2,2s cobre com folga.
  await page.waitForTimeout(Number(process.env.ESPERA_POS_ASSENTO ?? 2200));
  const r = await page.evaluate(COLHER);

  // 🚨 CONTROLE DE DERIVA POR TEMPO.
  //
  // O que anima em LAÇO está numa posição diferente a cada instante, e
  // comparar dois lados em instantes distintos acusa deslocamento que não
  // existe. Medido no site-exemplo: as palavras "design / build / create" de um
  // rotador aparecem ora alinhadas, ora 130,9px fora — na mesma rota, no
  // mesmo build, em duas rodadas seguidas. Isso polui a contagem do site
  // inteiro e faz um conserto real parecer regressão.
  //
  // O teste é barato: sem tocar em nada, tirar uma segunda foto depois de um
  // tempo. O que mudou de lugar sozinho é laço, e sai da conta — declarado à
  // parte, nunca escondido.
  // 🚨 ...e o laço que PAUSA fora da janela não deriva se as duas fotos saírem
  // do mesmo lugar. O Framer pausa todo trilho fora da tela (medido no
  // framer-4: 3 marquees, todos parados com a seção fora do enquadramento), e
  // o detector então os declarava ESTÁTICOS — jogando os 45 logos na conta de
  // "fora do lugar" com a fase de um instante que ninguém controla.
  // A visita dá tempo de tela a cada faixa da página; a volta ao MESMO y
  // devolve o parallax ao lugar, para que só o que depende do TEMPO tenha se
  // movido entre as duas fotos.
  {
    const y0 = await page.evaluate(() => scrollY);
    const altura = await page.evaluate(() => document.body.scrollHeight);
    const passo = Math.max(500, Math.round(altura / 10));
    const paradas = Math.max(1, Math.ceil(altura / passo));
    const fatia = Math.max(60, Math.floor((DERIVA_MS * 0.75) / paradas));
    for (let y = 0; y < altura; y += passo) {
      await page.evaluate((v) => scrollTo(0, v), y);
      await page.waitForTimeout(fatia);
    }
    await page.evaluate((v) => scrollTo(0, v), y0);
    await page.waitForTimeout(Math.max(400, DERIVA_MS * 0.25));
  }
  const r2 = await page.evaluate(COLHER);
  const antes = new Map(r.itens.map((i) => [`${i.tipo}|${i.texto}|${i.ordem}`, i]));
  const emLaco = new Set();
  for (const b of r2.itens) {
    const a = antes.get(`${b.tipo}|${b.texto}|${b.ordem}`);
    if (!a) continue;
    if (Math.abs(a.x - b.x) > 2 || Math.abs(a.y - b.y) > 2 || Math.abs(a.w - b.w) > 2 || Math.abs(a.h - b.h) > 2) {
      emLaco.add(`${b.tipo}|${b.texto}`);
    }
  }
  r.emLaco = [...emLaco];

  // 🚨 TEXTO QUE MUDA COM O TEMPO — o contador numérico.
  //
  // Aqui o texto não é só conteúdo: é a IDENTIDADE com que este comparador
  // casa os elementos. Um número que sobe não tem par estável — aparece como
  // "só no original" num instante, some no seguinte, e pior: rouba o par de
  // outro elemento que por acaso tenha o mesmo texto. Medido no framer-4: o
  // "3" da lista "Our Process" foi casado com um contador a 5295px dali, e o
  // desvio de 5295px não era de ninguém.
  //
  // Aumentar a espera não resolve: com 5s o original ainda mostrava 88 e 6.
  // Quem verifica contador é o mede-contador.mjs, rodado nos DOIS lados, que
  // compara partida, chegada, duração e curva — prova mais forte que uma foto.
  // Aqui eles saem da conta e ficam DECLARADOS, nunca em silêncio.
  const soTexto = (l) => new Set(l.filter((i) => i.tipo === "texto").map((i) => i.texto));
  const t1 = soTexto(r.itens), t2 = soTexto(r2.itens);
  r.textoInstavel = [...new Set([...[...t1].filter((t) => !t2.has(t)), ...[...t2].filter((t) => !t1.has(t))])];

  // ...e por POSIÇÃO, porque o conjunto de textos não basta: o contador que
  // congelou em "3" tem um homônimo legítimo na página (o item 3 da lista "Our
  // Process"), então "3" existe nas duas fotos e nunca aparece como texto
  // instável. Quem denuncia é o LUGAR: o mesmo elemento, na mesma posição, com
  // outro texto entre uma foto e outra.
  const porOrdem2 = new Map(r2.itens.map((i) => [i.ordem, i]));
  r.posicaoInstavel = r.itens
    .filter((i) => i.tipo === "texto" && porOrdem2.has(i.ordem) && porOrdem2.get(i.ordem).tipo === "texto" && porOrdem2.get(i.ordem).texto !== i.texto)
    .map((i) => ({ x: i.x, y: i.y, w: i.w }));

  if (SHOTS) {
    const base = rota === "/" ? "home" : rota.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
    await page.screenshot({ path: join(SAIDA, `${base}-${tag}.png`), fullPage: true }).catch(() => {});
  }
  return r;
}

/** Texto casa por texto; imagem casa por POSIÇÃO.
 *
 *  Texto: entre repetições do mesmo texto, escolhe a de posição mais próxima.
 *  Casar por índice cru quebra assim que um lado tem um elemento a mais, e daí
 *  em diante TUDO vira "deslocado" — ruído, não medição.
 *
 *  Imagem: nome de arquivo não serve (o ditto rebatiza), e tamanho também não
 *  (casar por tamanho zera justamente o `dw`/`dh` que se quer medir). Sobra a
 *  posição, casada pelo par mais próximo primeiro, com teto de distância. */
const TETO_IMG = 400;
// teto para o casamento por PROXIMIDADE de texto repetido (ver o comentário no
// ponto de uso). Generoso de propósito: um bloco legitimamente deslocado ainda
// precisa achar o seu par para ser acusado.
const TETO_TXT = Number(process.env.TETO_TXT ?? 900);

function alinhar(a, b) {
  const pares = [];
  const soA = [];
  const soB = [];
  const usadosB = new Set();
  const usadosA = new Set();

  // --- texto, por conteúdo ---
  const mapaA = new Map();
  const mapaB = new Map();
  a.forEach((o, i) => {
    if (o.tipo !== "texto") return;
    if (!mapaA.has(o.texto)) mapaA.set(o.texto, []);
    mapaA.get(o.texto).push(i);
  });
  b.forEach((o, i) => {
    if (o.tipo !== "texto") return;
    if (!mapaB.has(o.texto)) mapaB.set(o.texto, []);
    mapaB.get(o.texto).push(i);
  });

  // 🚨 Quando o MESMO texto aparece N vezes dos DOIS lados, casar pela ORDEM
  // do DOM, não pela posição mais próxima.
  //
  // Medido no framer-4, no bloco de texto revelado do /expertise: 294 letras
  // soltas em `div` de um caractere. O bloco inteiro estava 48px acima do
  // lugar, e o casamento por proximidade emparelhou cada "e" com um "e" de
  // OUTRA linha — 482 elementos "fora do lugar" com dx/dy espalhados, sem
  // padrão, sem culpado. Casando por ordem, o mesmo bloco deu 0/294 fora do
  // lugar e o defeito verdadeiro (a seção 96px mais curta) apareceu sozinho.
  //
  // O guard: só vale quando as contagens BATEM. Se um lado tem uma ocorrência
  // a mais, a ordem escorrega e volta a mentir — aí cai no vizinho mais
  // próximo, que é o comportamento antigo.
  const porOrdem = new Set();
  for (const [texto, ia] of mapaA) {
    const ib = mapaB.get(texto);
    if (ib && ib.length === ia.length && ia.length > 1) porOrdem.add(texto);
  }
  const filaB = new Map();
  for (const t of porOrdem) filaB.set(t, [...mapaB.get(t)]);

  a.forEach((oa, ia) => {
    if (oa.tipo !== "texto") return;
    usadosA.add(ia);

    if (porOrdem.has(oa.texto)) {
      const fila = filaB.get(oa.texto);
      const i = fila.shift();
      usadosB.add(i);
      pares.push({ o: oa, c: b[i] });
      return;
    }

    const cands = (mapaB.get(oa.texto) || []).filter((i) => !usadosB.has(i));
    if (!cands.length) {
      soA.push(oa);
      return;
    }
    let melhor = cands[0];
    let erro = Infinity;
    for (const i of cands) {
      const e = Math.hypot(b[i].x - oa.x, b[i].y - oa.y);
      if (e < erro) {
        erro = e;
        melhor = i;
      }
    }
    // 🚨 TETO DE DISTÂNCIA — imagem sempre teve um (TETO_IMG); texto não tinha
    // nenhum, e um par a meia página de distância não é um par.
    //
    // Medido no framer-4: o contador do original congela num valor qualquer
    // quando a rolagem o tira da tela no meio da contagem, e um deles parou
    // exatamente em "3". A página tem outro "3" — o item 3 da lista "Our
    // Process", 5295px abaixo. Com as contagens diferentes (dois "3" de um
    // lado, um do outro), o casamento por proximidade uniu os dois e reportou
    // um desvio de 5295px que não era de ninguém: o item da lista estava no
    // lugar certo, e o contador não tinha par nenhum.
    if (erro > TETO_TXT) {
      soA.push(oa);
      return;
    }
    usadosB.add(melhor);
    pares.push({ o: oa, c: b[melhor] });
  });

  // --- imagem, por posição: par mais próximo primeiro ---
  const imgsA = a.map((o, i) => ({ o, i })).filter((x) => x.o.tipo === "img");
  const imgsB = b.map((o, i) => ({ o, i })).filter((x) => x.o.tipo === "img");
  const cands = [];
  for (const xa of imgsA) {
    for (const xb of imgsB) {
      const d = Math.hypot(xb.o.x - xa.o.x, xb.o.y - xa.o.y);
      if (d <= TETO_IMG) cands.push({ ia: xa.i, ib: xb.i, d });
    }
  }
  cands.sort((p, q) => p.d - q.d);
  for (const c of cands) {
    if (usadosA.has(c.ia) || usadosB.has(c.ib)) continue;
    usadosA.add(c.ia);
    usadosB.add(c.ib);
    pares.push({ o: a[c.ia], c: b[c.ib] });
  }
  for (const xa of imgsA) if (!usadosA.has(xa.i)) soA.push(xa.o);

  b.forEach((o, i) => {
    if (!usadosB.has(i)) soB.push(o);
  });
  return { pares, soA, soB };
}

(async () => {
  const rotas = carregarRotas();
  const navegador = await chromium.launch();
  const ctx = await navegador.newContext({ viewport: { width: LARGURA, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const relatorio = [];
  let totalFora = 0;
  let totalPares = 0;

  // 🚨 Grava o que JÁ mediu, a cada rota. Gravando só depois do loop inteiro,
  // um timeout (o `checkup.mjs` mata em 15 min) ou um Ctrl+C na rota 40 de 47
  // joga fora as 39 medições boas e a coluna d3 da matriz sai PENDENTE nas
  // 47 — "não medido" por acidente de processo, não por falta de medida.
  // Medido no framer-6: 94 células PENDENTES com o
  // `geo-camada/geometria.json` completo no disco ao lado.
  // O arquivo parcial é honesto: quem o lê sabe quantas rotas tem dentro.
  const gravar = () =>
    writeFileSync(
      join(SAIDA, "geometria.json"),
      JSON.stringify({ largura: LARGURA, tol: TOL, rotasPedidas: rotas.length, rotasMedidas: relatorio.length, parcial: relatorio.length < rotas.length, relatorio }, null, 2)
    );

  for (const rota of rotas) {
    const o = await medir(page, new URL(rota, ORIGINAL).href, "orig", rota);
    const c = await medir(page, new URL(rota, CLONE).href, "clone", rota);
    // texto que muda com o tempo sai da conta dos DOIS lados (ver o bloco em
    // medir()): sem isso ele não só fica sem par como rouba o par alheio
    const instavel = new Set([...(o.textoInstavel ?? []), ...(c.textoInstavel ?? [])]);
    const lugares = [...(o.posicaoInstavel ?? []), ...(c.posicaoInstavel ?? [])];
    // no mesmo lugar (é o próprio contador), ou LOGO DEPOIS dele na mesma
    // linha: o sufixo "+" começa onde o número termina, e o número muda de
    // largura enquanto conta — 80 e 120 não medem igual. O vizinho não tem
    // defeito nenhum, só está atrás de um elemento que muda de tamanho.
    const noLugarInstavel = (i) =>
      lugares.some(
        (q) =>
          (Math.abs(q.x - i.x) < 8 && Math.abs(q.y - i.y) < 8) ||
          (Math.abs(q.y - i.y) < 20 && i.x >= q.x && i.x - (q.x + (q.w ?? 0)) < 40)
      );
    const semInstavel = (l) => l.filter((i) => !(i.tipo === "texto" && (instavel.has(i.texto) || noLugarInstavel(i))));
    const itensO = semInstavel(o.itens), itensC = semInstavel(c.itens);
    const forasDeTexto = o.itens.length - itensO.length + (c.itens.length - itensC.length);
    const { pares, soA, soB } = alinhar(itensO, itensC);

    const desvios = pares
      .map(({ o: a, c: b }) => {
        const d = {
          texto: a.tipo === "img" ? `img ${a.texto} ${a.alt || a.src || ""}`.trim() : a.texto,
          // 🚨 a chave do laço é o texto CRU do item, do jeito que o detector de
          // deriva o registrou. O `texto` acima é enfeitado para o relatório
          // ("img 122x36 <arquivo>") e NUNCA casava com a chave do detector,
          // que guarda só "122x36" — o controle de laço funcionava para texto
          // e era letra morta para imagem desde sempre. Medido no framer-4: 45
          // logos de um marquee reconstruído e rodando entravam inteiros na
          // conta de "fora do lugar", um por um.
          chaveLaco: a.texto,
          tag: a.tag,
          cid: b.cid,
          srcOriginal: a.src ?? null,
          srcClone: b.src ?? null,
          ox: a.x, oy: a.y, ow: a.w, oh: a.h,
          cx: b.x, cy: b.y, cw: b.w, ch: b.h,
          dx: Math.round((b.x - a.x) * 10) / 10,
          dy: Math.round((b.y - a.y) * 10) / 10,
          dw: Math.round((b.w - a.w) * 10) / 10,
          dh: Math.round((b.h - a.h) * 10) / 10,
          dop: Math.round((b.opacity - a.opacity) * 100) / 100,
          tro: a.transform,
          trc: b.transform,
        };
        d.pior = Math.max(Math.abs(d.dx), Math.abs(d.dy), Math.abs(d.dw), Math.abs(d.dh));
        return d;
      });

    // O que anima em laco em QUALQUER um dos dois lados.
    const laco = new Set([...(o.emLaco ?? []), ...(c.emLaco ?? [])].map((k) => k.split("|").slice(1).join("|")));
    const ehLaco = (d) => laco.has(d.chaveLaco);

    // 🚨 FASE DO LAÇO: descontada, nunca perdoada em bloco.
    //
    // Um trilho em laço está numa fase diferente a cada instante, e os dois
    // lados nunca são fotografados na mesma. Tirar os itens da conta (o que se
    // fazia antes) esconde defeito: um logo trocado de lugar DENTRO do trilho
    // sairia impune junto com a fase.
    //
    // O desconto separa as duas coisas. Se o trilho inteiro está deslocado pelo
    // mesmo tanto, isso é FASE (medido no framer-4: 15 logos com dx entre
    // -18,6 e -18,2 — o arranjo estava perfeito, só o relógio diferia). O que
    // sobra depois de tirar a mediana do grupo é desalinhamento de verdade, e
    // esse continua contando como fora do lugar.
    //
    // Agrupa por faixa de y: uma página pode ter vários trilhos (a home tem o
    // de logos e o de texto gigante), cada um com a sua fase.
    const mediana = (v) => { const s = [...v].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
    const grupos = new Map();
    for (const d of desvios) if (ehLaco(d)) {
      const g = Math.round(d.oy / 120);
      if (!grupos.has(g)) grupos.set(g, []);
      grupos.get(g).push(d);
    }
    const fases = [];
    for (const [g, itens] of grupos) {
      const fx = Math.round(mediana(itens.map((d) => d.dx)) * 10) / 10;
      const fy = Math.round(mediana(itens.map((d) => d.dy)) * 10) / 10;
      for (const d of itens) {
        d.faseDx = fx; d.faseDy = fy;
        d.dxSemFase = Math.round((d.dx - fx) * 10) / 10;
        d.dySemFase = Math.round((d.dy - fy) * 10) / 10;
        d.pior = Math.max(Math.abs(d.dxSemFase), Math.abs(d.dySemFase), Math.abs(d.dw), Math.abs(d.dh));
      }
      if (Math.abs(fx) > TOL || Math.abs(fy) > TOL) fases.push({ y: g * 120, itens: itens.length, faseDx: fx, faseDy: fy });
    }

    const fora = desvios.filter((d) => d.pior > TOL).sort((x, y) => y.pior - x.pior);
    const emLaco = desvios.filter((d) => ehLaco(d) && (Math.abs(d.faseDx) > TOL || Math.abs(d.faseDy) > TOL));
    const invisivel = desvios.filter((d) => d.dop <= -0.5);
    totalFora += fora.length;
    totalPares += pares.length;

    relatorio.push({
      rota,
      alturaOriginal: o.alturaPagina,
      alturaClone: c.alturaPagina,
      pares: pares.length,
      fora: fora.length,
      soNoOriginal: soA.length,
      soNoClone: soB.length,
      invisiveisNoClone: invisivel.length,
      animacaoEmLaco: emLaco.length,
      textoInstavel: [...instavel],
      elementosDeTextoInstavel: forasDeTexto,
      fasesDeLaco: fases,
      emLaco: emLaco.map((d) => ({ texto: d.texto, cid: d.cid, dx: d.dx, dy: d.dy, dxSemFase: d.dxSemFase, dySemFase: d.dySemFase })),
      desvios: fora.slice(0, 200),
      faltando: soA.slice(0, 60),
      // 🚨 o lado do CLONE também se detalha. Era só contado, e "só no clone: 1"
      // não diz se é um elemento a mais inofensivo ou um pedaço inteiro que o
      // gerador inventou — as duas coisas somam 1.
      sobrando: soB.slice(0, 60),
    });
    gravar();

    const ok = fora.length === 0 && soA.length === 0;
    console.log(
      `\n${ok ? "✅" : "❌"} ${rota}  casados=${pares.length}  fora do lugar=${fora.length}  só no original=${soA.length}  só no clone=${soB.length}  invisíveis no clone=${invisivel.length}`
    );
    console.log(`   altura  original=${o.alturaPagina}  clone=${c.alturaPagina}  Δ=${c.alturaPagina - o.alturaPagina}`);
    if (instavel.size) {
      console.log(
        `   🔢 ${forasDeTexto} elemento(s) de TEXTO INSTÁVEL fora da conta (o texto muda com o tempo — contador):` +
          ` ${[...instavel].slice(0, 10).map((t) => JSON.stringify(t.slice(0, 10))).join(", ")}` +
          `${instavel.size > 10 ? ` e mais ${instavel.size - 10}` : ""}.` +
          ` Quem os verifica é o mede-contador.mjs, nos dois lados.`
      );
    }
    for (const f of fases) {
      console.log(
        `   ⏱️  trilho em laço y≈${f.y}: ${f.itens} itens, FASE de ${f.faseDx}px em x${Math.abs(f.faseDy) > TOL ? ` e ${f.faseDy}px em y` : ""} — descontada.` +
          ` O que sobra depois do desconto CONTINUA na conta (arranjo dentro do trilho).`
      );
    }
    for (const d of fora.slice(0, TOPO)) {
      console.log(
        `   ${String(d.pior).padStart(7)}px  dx=${String(d.dx).padStart(8)} dy=${String(d.dy).padStart(8)} dw=${String(d.dw).padStart(7)} dh=${String(d.dh).padStart(7)}  ${d.cid ?? "-"}  ${d.tag} "${d.texto.slice(0, 34)}"`
      );
    }
    if (fora.length > TOPO) console.log(`   ... e mais ${fora.length - TOPO}`);
    for (const f of soA.slice(0, 8)) {
      console.log(`   ⚠️ só no original: ${f.tag} "${f.texto.slice(0, 40)}" @${f.x},${f.y}`);
    }
    for (const s of soB.slice(0, 8)) {
      console.log(`   ⚠️ só no CLONE:    ${s.tag} "${s.texto.slice(0, 40)}" @${s.x},${s.y}${s.cid ? ` (${s.cid})` : ""}`);
    }
  }

  await navegador.close();
  gravar();
  console.log(`\n${"=".repeat(70)}`);
  console.log(`TOTAL: ${totalFora} elementos fora do lugar em ${totalPares} casados, ${rotas.length} rota(s)`);
  console.log(`saída: ${SAIDA}`);

  // 🚨 GUARD: rota em que NADA casou não é rota idêntica, é rota não medida.
  // Sem isto, um servidor de clone que caiu no meio faz toda rota medir
  // `casados=0`, `fora=0` — e "0 fora do lugar em 0 casados" SAI COM EXIT 0.
  // Com o clone servindo a página de erro (altura 900), todas as rotas passariam
  // medindo nada. Célula vazia é trabalho não feito.
  const mudas = relatorio.filter((r) => r.pares === 0);
  if (mudas.length) {
    console.log(
      `\n🚨 ${mudas.length} rota(s) com ZERO elemento casado — medição inválida, não aprovação:`,
    );
    for (const r of mudas) {
      console.log(`   ${r.rota}  (original tinha ${r.soNoOriginal} elementos; altura do clone=${r.alturaClone})`);
    }
    console.log("   Conferir se o clone está mesmo sendo servido em " + CLONE);
    process.exit(3);
  }

  process.exit(totalFora === 0 ? 0 : 2);
})();
