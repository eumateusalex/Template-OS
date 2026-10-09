// gera-slides.mjs — devolve ao clone os irmãos-slide que a captura perdeu.
//
// 🚨 Classe de defeito medida no clone do framer-3.
// O ditto fotografa UM instante, e carrossel/fileira só tem NA
// FOTO os slides visíveis: dos 4 depoimentos da home sobra 1, dos 8 cards do
// time do /about sobram os que cabem em 1280px. Nenhuma medição de rota,
// metadata ou altura acusa — o slide que falta não desloca ninguém.
//
// O que faz:
//   1. No ORIGINAL: acha o slide-âncora pelo texto, sobe até o trilho (pai
//      com 2+ filhos do mesmo tamanho), e colhe de CADA slide: assinatura
//      estrutural, textos em ordem, srcs de imagem e diffs de estilo
//      computado em relação ao slide-âncora.
//   2. No CLONE servido: acha o mesmo trilho, identifica quais slides FALTAM
//      (pelo primeiro texto de cada um).
//   3. Baixa as imagens dos slides que faltam para public/assets/cloned/extra/
//      (3 tentativas cada — falha vira declaração, nunca silêncio).
//   4. Escreve public/slides-<rota>.js: runtime idempotente que clona o
//      slide-modelo DO PRÓPRIO CLONE (as classes utilitárias certas já estão
//      nele), devolve textos/imagens/diffs, e injeta na posição certa.
//      Expõe window.__dittoSlides, com guard de rota e de já-aplicado.
//
// O que o faz SE CALAR:
//   - âncora não achada em um dos lados          -> declara, não escreve
//   - trilho não identificado subindo            -> declara, não escreve
//   - nenhum slide faltando                      -> declara, não escreve
//   - assinatura do slide ≠ assinatura do modelo -> declara ESSE slide, segue
//   - contagem de textos/imagens não bate        -> declara ESSE slide, segue
//   - imagem não baixou em 3 tentativas          -> declara ESSE slide, segue
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 APP=<app> ROTA=/ \
//   ANCORA="Atlas Labs" SAIDA=<med>/slides node gera-slides.mjs
//
// Variáveis:
//   ANCORA   texto que identifica UM slide presente nos DOIS lados (obrigatória)
//   NIVEIS   força subir N níveis a partir da âncora em vez da heurística
//   LARGURA  viewport (padrão 1280); ALTURA viewport (padrão 900)
//   ESCREVER 0 simula

import { createRequire } from "node:module";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";

const ORIGINAL = process.env.ORIGINAL;
const CLONE = process.env.CLONE;
const APP = process.env.APP;
const ANCORA = process.env.ANCORA;
if (!ORIGINAL || !CLONE || !APP || !ANCORA) {
  console.error("faltam ORIGINAL, CLONE, APP e/ou ANCORA");
  process.exit(1);
}
const ROTA = process.env.ROTA ?? "/";
const NIVEIS = process.env.NIVEIS ? Number(process.env.NIVEIS) : null;
const LARGURA = Number(process.env.LARGURA ?? 1280);
const ALTURA = Number(process.env.ALTURA ?? 900);
const ESCREVER = process.env.ESCREVER !== "0";
const SAIDA = resolve(process.env.SAIDA ?? "./slides");
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
mkdirSync(SAIDA, { recursive: true });

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

// Colhe o trilho e os slides a partir da âncora. Roda nos DOIS lados.
const COLHER = ({ ancora, niveis, querCid, subidasForcadas }) => {
  const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();
  // 🚨 âncora só com CAIXA VIVA: o ditto emite o trilho em variantes por
  // breakpoint como IRMÃOS (na home o gêmeo `hidden 2xl:*` vem primeiro no
  // documento), e a primeira âncora em ordem de documento pode ser a do
  // trilho invisível — a injeção inteira foi parar num display:none.
  const alvo = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6,p,strong,span,em")]
    .find((e) => {
      if (!norm(e.textContent).includes(ancora) || e.children.length !== 0) return false;
      const b = e.getBoundingClientRect();
      return b.width > 0 && b.height > 0;
    });
  if (!alvo) return { erro: "âncora não achada (com caixa viva)" };

  let slide = alvo;
  let trilho = null;
  let subidas = 0;
  if (subidasForcadas != null) {
    // 🚨 lado do CLONE: o trilho pode ter UM filho só (é o defeito que este
    // instrumento conserta), então irmão nenhum se exige — sobe-se o número
    // de níveis MEDIDO no original.
    for (let i = 0; i < subidasForcadas && slide.parentElement; i++) slide = slide.parentElement;
    trilho = slide.parentElement;
    subidas = subidasForcadas;
  } else if (niveis != null) {
    for (let i = 0; i < niveis && slide.parentElement; i++) slide = slide.parentElement;
    trilho = slide.parentElement;
    subidas = niveis;
  } else {
    // lado do ORIGINAL: fica com o nível MAIS ALTO que ainda parece trilho —
    // parar no primeiro casou par nome/cargo em vez do card inteiro. O teto de
    // 85% do viewport impede de "casar" as seções da própria página.
    let candidato = null;
    let candidatoSubidas = 0;
    let el = alvo;
    for (let up = 0; up < 12 && el.parentElement; up++) {
      const pai = el.parentElement;
      const irmaos = [...pai.children];
      if (irmaos.length >= 2) {
        const cx = el.getBoundingClientRect();
        const parecidos = irmaos.filter((i) => {
          const b = i.getBoundingClientRect();
          return Math.abs(b.width - cx.width) < 8 && Math.abs(b.height - cx.height) < 80;
        });
        if (parecidos.length >= 2 && cx.width > 150 && cx.width < window.innerWidth * 0.85) {
          candidato = pai;
          candidatoSubidas = up;
        }
      }
      el = pai;
    }
    trilho = candidato;
    subidas = candidatoSubidas;
  }
  if (!trilho) return { erro: "trilho não identificado subindo" };

  const PROPS_DIFF = ["background-color", "color", "border-color"];
  const lerSlide = (s, modelo) => {
    const assinatura = [];
    const textos = [];
    const imgs = [];
    const diffs = [];
    let idx = 0;
    const anda = (el, prof, elModelo) => {
      assinatura.push(prof + ":" + el.tagName.toLowerCase());
      if (el.tagName === "IMG") imgs.push(el.currentSrc || el.src || "");
      let proprio = "";
      for (const n of el.childNodes) if (n.nodeType === 3) proprio += n.nodeValue;
      proprio = norm(proprio);
      if (proprio) textos.push(proprio);
      if (modelo && elModelo) {
        const a = getComputedStyle(el);
        const b = getComputedStyle(elModelo);
        const d = {};
        for (const p of PROPS_DIFF) if (a.getPropertyValue(p) !== b.getPropertyValue(p)) d[p] = a.getPropertyValue(p);
        if (Object.keys(d).length) diffs.push({ idx, d });
      }
      idx++;
      const filhos = [...el.children];
      const filhosM = elModelo ? [...elModelo.children] : [];
      filhos.forEach((c, i) => anda(c, prof + 1, filhosM[i] ?? null));
    };
    anda(s, 0, modelo ?? null);
    return { assinatura: assinatura.join("|"), textos, imgs, diffs, nNos: assinatura.length };
  };

  const filhos = [...trilho.children];
  const modelo = filhos.find((f) => norm(f.textContent).includes(ancora));
  const bt = trilho.getBoundingClientRect();
  return {
    subidas,
    trilho: {
      cid: querCid ? trilho.getAttribute("data-cid") : null,
      tag: trilho.tagName.toLowerCase(),
      w: Math.round(bt.width), h: Math.round(bt.height),
      display: getComputedStyle(trilho).display,
      nFilhos: filhos.length,
    },
    modeloIdx: filhos.indexOf(modelo),
    slides: filhos.map((f) => lerSlide(f, modelo === f ? null : modelo)),
  };
};

async function abrir(nav, url) {
  const page = await nav.newPage();
  await page.setViewportSize({ width: LARGURA, height: ALTURA });
  // BLOQUEIA="slides-": ao REGERAR, o clone servido já injeta os slides da
  // geração anterior — sem bloquear o runtime antigo, o censo diria "nada
  // faltando" e a regeração nunca aconteceria.
  const bloqueia = (process.env.BLOQUEIA ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (bloqueia.length) {
    await page.route("**/*", (route) => {
      const u = route.request().url();
      if (bloqueia.some((b) => u.includes(b))) return route.abort();
      return route.continue();
    });
  }
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(600);
  return page;
}

const nav = await chromium.launch();
const pagO = await abrir(nav, new URL(ROTA, ORIGINAL).href);
const orig = await pagO.evaluate(COLHER, { ancora: ANCORA, niveis: NIVEIS, querCid: false });
if (orig.erro) { console.error(`ORIGINAL: ${orig.erro}`); await nav.close(); process.exit(2); }

const pagC = await abrir(nav, new URL(ROTA, CLONE).href);
const clone = await pagC.evaluate(COLHER, { ancora: ANCORA, niveis: NIVEIS, querCid: true, subidasForcadas: orig.subidas });
if (clone.erro) { console.error(`CLONE: ${clone.erro}`); await nav.close(); process.exit(2); }
if (!clone.trilho.cid) { console.error("CLONE: trilho sem data-cid — sem alvo estável pro runtime"); await nav.close(); process.exit(2); }

console.log(`original: trilho <${orig.trilho.tag}> ${orig.trilho.w}x${orig.trilho.h} com ${orig.trilho.nFilhos} slide(s)`);
console.log(`clone:    trilho <${clone.trilho.tag}> cid=${clone.trilho.cid} com ${clone.trilho.nFilhos} slide(s)`);

// quais slides do original faltam no clone? (pelo primeiro texto)
const chave = (s) => (s.textos[0] ?? "") + "‖" + (s.textos[1] ?? "");
const noClone = new Set(clone.slides.map(chave));
const modelo = clone.slides[clone.modeloIdx];
const modeloOrig = orig.slides[orig.modeloIdx];

const faltando = [];
const declarados = [];
// slide presente mas INCOMPLETO (capturado no meio da troca: menos folhas de
// texto que o modelo) conta como faltando, com ordem de SUBSTITUIR. Medido no
// home-alt-2: o Northway veio só com a citação, sem o painel de stats.
const incompletos = new Set();
for (const sc of clone.slides) {
  if (sc === clone.slides[clone.modeloIdx]) continue;
  if (sc.textos.length && sc.textos.length < clone.slides[clone.modeloIdx].textos.length) {
    incompletos.add(chave(sc));
    declarados.push(`slide do clone "${sc.textos[0] ?? "?"}": INCOMPLETO (${sc.textos.length} folhas vs ${clone.slides[clone.modeloIdx].textos.length} do modelo) — será substituído`);
  }
}
orig.slides.forEach((s, i) => {
  const substituir = incompletos.has(chave(s));
  if (noClone.has(chave(s)) && !substituir) return;
  if (s.nNos !== modeloOrig.nNos || s.assinatura !== modeloOrig.assinatura) {
    declarados.push(`slide ${i} ("${s.textos[0] ?? "?"}"): assinatura difere do modelo (${s.nNos} vs ${modeloOrig.nNos} nós) — NÃO injetado`);
    return;
  }
  // O clone pode ter o slide DUPLICADO por breakpoint (o ditto emite as
  // variantes lado a lado, em BLOCO ou INTERCALADAS, e pode até reordenar).
  // Medido no framer-3: home-alt com 16/2 onde o original tem 8/1 (k=2), e o
  // mapa por módulo do índice troca "Emily Carter" por "$200–350k" — a
  // duplicação é intercalada. O mapa certo se constrói pelo PRÓPRIO
  // texto: posição i do modelo-clone -> índice j do modelo-original cujo
  // texto casa (consumindo multiplicidade). Vale para qualquer padrão.
  const kT = modelo.textos.length / s.textos.length;
  const kI = s.imgs.length ? modelo.imgs.length / s.imgs.length : kT;
  if (!Number.isInteger(kT) || kT < 1 || kT !== kI) {
    declarados.push(`slide ${i} ("${s.textos[0] ?? "?"}"): contagem texto/img não bate com o modelo do clone (${s.textos.length}/${s.imgs.length} vs ${modelo.textos.length}/${modelo.imgs.length}) — NÃO injetado`);
    return;
  }
  const usados = modeloOrig.textos.map(() => 0);
  const mapa = [];
  let falhouMapa = false;
  for (const txt of modelo.textos) {
    let j = -1;
    for (let cand = 0; cand < modeloOrig.textos.length; cand++) {
      if (modeloOrig.textos[cand] === txt && usados[cand] < kT) { j = cand; usados[cand]++; break; }
    }
    if (j === -1) { falhouMapa = true; break; }
    mapa.push(j);
  }
  if (falhouMapa) {
    declarados.push(`slide ${i} ("${s.textos[0] ?? "?"}"): texto do modelo-clone não casa com o modelo-original — mapa impossível, NÃO injetado`);
    return;
  }
  // imagens: segue o padrão do mapa de textos (bloco = primeiro índice mapeado
  // da metade; intercalado = i % k). Detecta pelo próprio mapa.
  const padraoBloco = mapa.length >= 2 && mapa[0] === 0 && mapa[1] === 1;
  const mapaImg = [];
  for (let im = 0; im < modelo.imgs.length; im++) {
    mapaImg.push(padraoBloco ? im % s.imgs.length : Math.floor(im / kT));
  }
  if (kT > 1) {
    declarados.push(`slide ${i} ("${s.textos[0] ?? "?"}"): modelo duplicado por breakpoint (k=${kT}) — mapa por texto aplicado, diffs de estilo NÃO aplicados`);
    s = { ...s, diffs: [] };
  }
  faltando.push({ i, ...s, mapa, mapaImg, substituir });
});

if (!faltando.length) {
  console.log("✅ nenhum slide faltando — nada a escrever");
  for (const d of declarados) console.log(`⚠️ ${d}`);
  await nav.close();
  process.exit(0);
}
console.log(`faltando no clone: ${faltando.length} slide(s): ${faltando.map((f) => `"${f.textos[0] ?? "?"}"`).join(", ")}`);

// baixa as imagens dos slides faltantes
const dirImgs = join(APP, "public", "assets", "cloned", "extra");
mkdirSync(dirImgs, { recursive: true });
for (const f of faltando) {
  f.imgsLocais = [];
  for (const src of f.imgs) {
    if (!src) { f.imgsLocais.push(""); continue; }
    let ok = false;
    for (let t = 1; t <= 3 && !ok; t++) {
      try {
        const resp = await pagO.request.get(src, { timeout: 30000 });
        if (!resp.ok()) throw new Error(`HTTP ${resp.status()}`);
        const buf = await resp.body();
        const tipo = resp.headers()["content-type"] ?? "";
        const ext = tipo.includes("png") ? "png" : tipo.includes("webp") ? "webp" : tipo.includes("svg") ? "svg" : "jpg";
        const nome = createHash("md5").update(src).digest("hex").slice(0, 12) + "." + ext;
        writeFileSync(join(dirImgs, nome), buf);
        f.imgsLocais.push("/assets/cloned/extra/" + nome);
        ok = true;
      } catch (e) {
        if (t === 3) declarados.push(`slide ${f.i}: imagem não baixou em 3 tentativas (${src.slice(0, 80)}): ${e.message}`);
        else await new Promise((r) => setTimeout(r, 1500 * t));
      }
    }
    if (!ok) f.imgsLocais.push(null); // marca falha
  }
}
const injetaveis = faltando.filter((f) => !f.imgsLocais.includes(null));
for (const f of faltando) if (f.imgsLocais.includes(null)) declarados.push(`slide ${f.i} ("${f.textos[0]}"): fora da injeção por imagem faltando`);

if (!injetaveis.length) {
  console.log("⛔ nenhum slide injetável depois das imagens — nada escrito");
  for (const d of declarados) console.log(`⚠️ ${d}`);
  await nav.close();
  process.exit(2);
}

// escreve o runtime
const slug = ROTA === "/" ? "home" : ROTA.replace(/^\//, "").replace(/[^a-z0-9-]+/gi, "-");
const arqRuntime = join(APP, "public", `slides-${slug}.js`);
const dados = {
  rota: ROTA,
  cid: clone.trilho.cid,
  modeloChave: chave(modelo),
  slides: injetaveis.map((f) => ({ pos: f.i, textos: f.textos, imgs: f.imgsLocais, diffs: f.diffs, mapa: f.mapa, mapaImg: f.mapaImg, substituir: !!f.substituir })),
};

const runtime = `// slides-${slug}.js — devolve os irmãos-slide que a captura de um instante
// perdeu. Gerado por scripts/gera-slides.mjs a partir de MEDIÇÃO do original
// (${new URL(ROTA, ORIGINAL).href}) — nenhum texto ou imagem digitado à mão.
// Clona o slide-modelo do PRÓPRIO clone (classes certas já estão nele) e
// devolve textos, imagens locais e diffs de estilo medidos.
(function () {
  var DADOS = ${JSON.stringify(dados)};

  function rotaCerta() {
    var p = location.pathname;
    return p === DADOS.rota || p === DADOS.rota + "/" ||
      decodeURIComponent(p) === DADOS.rota || decodeURIComponent(p) === DADOS.rota + "/";
  }
  function norm(s) { return String(s || "").replace(/\\s+/g, " ").trim(); }

  function ligar() {
    if (!rotaCerta()) return;
    var trilho = document.querySelector('[data-cid="' + DADOS.cid + '"]');
    if (!trilho || trilho.dataset.dittoSlides === "1") return;
    var filhos = Array.prototype.slice.call(trilho.children);
    if (!filhos.length) return;
    // o modelo é o filho cujo texto contém a chave
    var chaveModelo = DADOS.modeloChave.split("\\u2016")[0];
    var modelo = null;
    for (var i = 0; i < filhos.length; i++) {
      if (norm(filhos[i].textContent).indexOf(chaveModelo.slice(0, 30)) !== -1) { modelo = filhos[i]; break; }
    }
    if (!modelo) return; // declara-se pelo silêncio do gate, nunca inventa
    trilho.dataset.dittoSlides = "1";

    // (o vigia anti-hidratação é ÚNICO, no body — ver vigiar() lá embaixo:
    //  observer preso no trilho morre quando a hidratação troca um ancestral)

    DADOS.slides.forEach(function (s) {
      var posRef = null;
      if (s.substituir) {
        // slide capturado INCOMPLETO: acha o irmão com o mesmo primeiro texto
        // e menos conteúdo que o modelo, remove, e injeta no lugar dele.
        var filhosAtuais = Array.prototype.slice.call(trilho.children);
        for (var f = 0; f < filhosAtuais.length; f++) {
          var tf = norm(filhosAtuais[f].textContent);
          if (tf.indexOf(s.textos[0].slice(0, 30)) === 0 &&
              tf.length < norm(modelo.textContent).length * 0.8 &&
              filhosAtuais[f].dataset.dittoSlideNovo !== "1") {
            posRef = f;
            trilho.removeChild(filhosAtuais[f]);
            break;
          }
        }
        if (posRef === null) return; // nada incompleto achado: não mexe
      } else {
        // idempotência: se o primeiro texto do slide já existe no trilho, pula
        if (norm(trilho.textContent).indexOf(s.textos[0].slice(0, 30)) !== -1) return;
      }
      var novo = modelo.cloneNode(true);
      novo.dataset.dittoSlideNovo = "1";
      // devolve textos na ordem dos nós com texto próprio
      var iTexto = 0, iImg = 0, iNo = 0;
      var anda = function (el) {
        var temTexto = false;
        for (var k = 0; k < el.childNodes.length; k++) {
          var n = el.childNodes[k];
          if (n.nodeType === 3 && norm(n.nodeValue)) temTexto = true;
        }
        if (temTexto && s.textos.length) {
          for (var k2 = el.childNodes.length - 1; k2 >= 0; k2--) {
            if (el.childNodes[k2].nodeType === 3) el.removeChild(el.childNodes[k2]);
          }
          // o mapa posição->índice foi construído pelo texto do modelo, e
          // sobrevive a duplicação em bloco, intercalada ou reordenada
          var idxT = s.mapa && s.mapa[iTexto] != null ? s.mapa[iTexto] : (iTexto % s.textos.length);
          el.appendChild(document.createTextNode(s.textos[idxT]));
          iTexto++;
        }
        if (el.tagName === "IMG" && s.imgs.length) {
          var idxI = s.mapaImg && s.mapaImg[iImg] != null ? s.mapaImg[iImg] : (iImg % s.imgs.length);
          var img = s.imgs[idxI];
          if (img) { el.src = img; el.removeAttribute("srcset"); }
          iImg++;
        }
        for (var d = 0; d < s.diffs.length; d++) {
          if (s.diffs[d].idx === iNo) {
            var dd = s.diffs[d].d;
            for (var p in dd) el.style.setProperty(p, dd[p]);
          }
        }
        iNo++;
        for (var c = 0; c < el.children.length; c++) anda(el.children[c]);
      };
      anda(novo);
      // injeta na posição do original (pos é o índice no trilho original);
      // substituição entra onde o incompleto estava
      var idxRef = posRef !== null ? posRef : Math.min(s.pos, trilho.children.length);
      var ref = trilho.children[idxRef];
      trilho.insertBefore(novo, ref || null);
    });
  }

  // 🚨 O vigia anti-hidratação: a hidratação do React, ao achar o DOM mutado
  // (erro 418), re-renderiza e APAGA a injeção — e quando ela troca um
  // ANCESTRAL do trilho, observer preso no trilho morre junto (medido: a home
  // perdia os slides mesmo com observer no trilho + pai). O body nunca é
  // trocado: UM observer nele, com subtree, debounced por rAF, religa sempre.
  function vigiar() {
    // flag POR ARQUIVO (rota+cid): com flag global, só o primeiro runtime
    // carregado instalaria vigia — vigiando a rota errada.
    var chaveVigia = "__dittoSlidesVigia_" + DADOS.rota + "_" + DADOS.cid;
    if (window[chaveVigia]) return;
    window[chaveVigia] = true;
    var pendente = false;
    var obs = new MutationObserver(function () {
      if (pendente) return;
      pendente = true;
      requestAnimationFrame(function () {
        pendente = false;
        if (!rotaCerta()) return;
        var trilho = document.querySelector('[data-cid="' + DADOS.cid + '"]');
        if (!trilho) return;
        for (var q = 0; q < DADOS.slides.length; q++) {
          if (norm(trilho.textContent).indexOf(DADOS.slides[q].textos[0].slice(0, 30)) === -1) {
            delete trilho.dataset.dittoSlides;
            ligar();
            return;
          }
        }
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function agendar() {
    ligar();
    vigiar();
    [120, 400, 1000, 2500, 4200].forEach(function (ms) { setTimeout(ligar, ms); });
  }
  if (!window.__dittoSlidesFns) {
    window.__dittoSlidesFns = [];
    window.__dittoSlides = function () { window.__dittoSlidesFns.forEach(function (f) { try { f(); } catch (e) {} }); };
  }
  window.__dittoSlidesFns.push(ligar);
  if (document.readyState === "complete") agendar();
  else window.addEventListener("load", agendar);
})();
`;

if (ESCREVER) {
  writeFileSync(arqRuntime, runtime);
  console.log(`✅ runtime -> ${arqRuntime}`);
  console.log(`   ligar no layout: <script src="/slides-${slug}.js" defer />`);
} else {
  console.log(`(ESCREVER=0) runtime seria escrito em ${arqRuntime}`);
}
writeFileSync(join(SAIDA, `slides-${slug}.json`), JSON.stringify({ orig, clone, faltando: faltando.map((f) => f.textos[0]), declarados }, null, 2));
for (const d of declarados) console.log(`⚠️ ${d}`);
console.log(`slides injetáveis: ${injetaveis.length} de ${faltando.length} faltando`);
await nav.close();
