// ajusta-fonte.mjs — que fonte é essa, e em que tamanho cada texto está?
//
// O vídeo não diz a fonte, e número nenhum a escolhe sozinho. Medido num clone por vídeo:
// - pela largura e altura da tinta, 12 grotescas deram o MESMO desvio de
//   espaçamento (0,014); a "melhor" saiu a Onest. Tamanho e aperto, qualquer uma acerta;
// - pelo formato pixel a pixel (IoU), a nota variou de 0,35 a 0,68 na MESMA
//   fonte entre um texto e outro: letra de 20px borrada pelo vídeo não aguenta
//   um pixel de desvio. A "melhor" saiu a Geist, por ruído.
// Quem separa fonte é o olho, nas letras que mudam de uma para outra (a, g, y,
// t, R, $, 1). Este instrumento prepara a prova para o olho e depois dá o tamanho.
//
// MODO=prova (padrão): para cada texto com "original" e "caixa", uma imagem com
// o recorte do vídeo em cima e, embaixo, o mesmo texto em cada fonte candidata,
// no tamanho e no espaçamento que fazem a tinta ocupar a mesma caixa. Grava em
// SAIDA/prova-NN.png e imprime o espaçamento que cada fonte pediu.
//
// MODO=tamanho: com a fonte e o espaçamento escolhidos (FONTE, ESPACO), devolve
// o tamanho de cada texto só pela LARGURA, em px e em rem.
//
// Uso:
//   QUADROS=./referencia/stills TEXTOS=./textos.json SAIDA=./prova node ajusta-fonte.mjs
//   MODO=tamanho FONTE=Inter ESPACO=-0.06 TEXTOS=./textos.json node ajusta-fonte.mjs
//
// textos.json: [{"texto": "Build for your next", "largura": 441, "altura": 58,
//                "peso": 400, "original": "s_5.0.png", "caixa": [30, 350, 500, 420]}]
//   - largura e altura são as da caixa de tinta (tinta.py medir), em px do quadro.
//   - "altura" só vale em linha com letra que sobe (maiúscula, b, d, l) E letra
//     que desce (g, p, y). A prova usa os textos com altura, original e caixa;
//     prefira os GRANDES (título): letra pequena borrada não mostra formato.
//   - texto em UMA linha só: a tinta de duas linhas não é a de uma.
//
// 🚨 Antes de rodar, olhe o quadro: o texto é sem-serifa, serifado ou mono? A
// prova só compara o que entra na lista: doze sem-serifa contra um título
// serifado "escolhem" uma delas mesmo assim. Título e corpo costumam ser de
// famílias diferentes: uma prova para cada.
//
// Variáveis:
//   FAMILIA sem (padrão), serifa ou mono: a lista de candidatas do Google Fonts
//   FONTES  a sua lista, separada por vírgula (vale mais que FAMILIA)
//   PESOS   na prova, desenha cada fonte em cada peso (ex.: PESOS=400,500,600).
//           A largura fecha no espaçamento com qualquer peso: só o desenho ao
//           lado do original mostra qual é. Rode com as 2 ou 3 finalistas.
//   BASE    px de 1rem na largura medida (padrão: 16)
//   DITTO   raiz do ditto (padrão: ~/dev/ditto)

import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const TEXTOS = process.env.TEXTOS;
if (!TEXTOS) {
  console.error("falta TEXTOS");
  process.exit(1);
}
const MODO = process.env.MODO ?? "prova";
const BASE = Number(process.env.BASE ?? 16);
const DITTO = process.env.DITTO ?? (process.env.USERPROFILE ?? process.env.HOME) + "/dev/ditto";
const textos = JSON.parse(readFileSync(TEXTOS, "utf-8"));
const FAMILIAS = {
  sem: "Inter,Inter Tight,Geist,DM Sans,Manrope,Instrument Sans,Figtree,Albert Sans,Host Grotesk,Hanken Grotesk,Schibsted Grotesk,Onest",
  serifa: "Newsreader,Libre Caslon Text,Instrument Serif,Playfair Display,Fraunces,Lora,Source Serif 4,EB Garamond,Cormorant Garamond,DM Serif Display,Crimson Pro,Literata",
  mono: "IBM Plex Mono,JetBrains Mono,Geist Mono,Space Mono,DM Mono,Roboto Mono,Source Code Pro,Fira Code",
};
const FAMILIA = process.env.FAMILIA ?? "sem";
if (!FAMILIAS[FAMILIA]) {
  console.error(`FAMILIA desconhecida: ${FAMILIA} (sem, serifa ou mono)`);
  process.exit(1);
}
const FONTES = MODO === "tamanho"
  ? [process.env.FONTE ?? "Inter"]
  : (process.env.FONTES ?? FAMILIAS[FAMILIA]).split(",").map((f) => f.trim());
const PESOS = (process.env.PESOS ?? "").split(",").map((p) => Number(p.trim())).filter(Boolean);

const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");
const navegador = await chromium.launch();
const pagina = await navegador.newPage();
const familias = FONTES.map((f) => "family=" + f.replace(/ /g, "+") + ":wght@300;400;500;600;700").join("&");
await pagina.setContent(`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${familias}&display=swap">`);
await pagina.waitForTimeout(1500);

// Tinta de cada texto a 100px, por fonte: largura e altura naturais.
const medidas = await pagina.evaluate(async ({ FONTES, textos, PESOS }) => {
  const c = document.createElement("canvas").getContext("2d");
  const out = {};
  for (const f of FONTES) {
    await Promise.all([300, 400, 500, 600, 700].map((p) => document.fonts.load(`${p} 100px "${f}"`)));
    out[f] = {
      carregou: document.fonts.check(`400 100px "${f}"`),
      itens: textos.map(({ texto, peso = 400 }) => {
        const mede = (p) => {
          c.font = `${p} 100px "${f}"`;
          const m = c.measureText(texto);
          return { largura: m.actualBoundingBoxLeft + m.actualBoundingBoxRight, altura: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent };
        };
        return { ...mede(peso), porPeso: Object.fromEntries(PESOS.map((p) => [p, mede(p)])) };
      }),
    };
  }
  return out;
}, { FONTES, textos, PESOS });

if (MODO === "tamanho") {
  await navegador.close();
  const f = FONTES[0];
  const espaco = Number(process.env.ESPACO ?? -0.06);
  if (!medidas[f].carregou) console.error(`atenção: "${f}" não carregou do Google Fonts; a medida é da fonte reserva`);
  console.log(`fonte ${f}, espaçamento ${espaco}em, 1rem = ${BASE}px`);
  textos.forEach((t, i) => {
    const porPx = medidas[f].itens[i].largura / 100;
    const px = t.largura / (porPx + espaco * (t.texto.length - 1));
    console.log(`${t.texto.slice(0, 44).padEnd(46)} ${px.toFixed(1).padStart(6)}px  ${(px / BASE).toFixed(3)}rem`);
  });
  process.exit(0);
}

const QUADROS = process.env.QUADROS;
const SAIDA = resolve(process.env.SAIDA ?? "./prova");
const daProva = textos
  .map((t, i) => ({ ...t, i }))
  .filter((t) => t.altura && t.original && t.caixa && QUADROS && existsSync(join(QUADROS, t.original)));
if (!daProva.length) {
  console.error('a prova precisa de QUADROS e de textos com "altura", "original" e "caixa"');
  process.exit(1);
}
mkdirSync(SAIDA, { recursive: true });
const carregadas = FONTES.filter((f) => medidas[f].carregou);
for (const f of FONTES) if (!medidas[f].carregou) console.log(`${f}: não carregou do Google Fonts, fora da prova`);

// Para cada fonte e texto: tamanho pela altura, espaçamento pela largura.
const ajuste = (f, t, peso) => {
  const m = peso ? medidas[f].itens[t.i].porPeso[peso] : medidas[f].itens[t.i];
  const px = t.altura / (m.altura / 100);
  return { px, em: (t.largura - (m.largura * px) / 100) / (t.texto.length - 1) / px };
};

console.log("espaçamento que cada fonte pede, por texto (em):");
for (const f of carregadas) console.log(`  ${f.padEnd(20)} ${daProva.map((t) => ajuste(f, t).em.toFixed(3)).join("  ")}`);

// Peso que a fonte não tem o navegador imita com o vizinho: a largura sai igual.
if (PESOS.length > 1) {
  for (const f of carregadas) {
    const larguras = PESOS.map((p) => medidas[f].itens[daProva[0].i].porPeso[p].largura.toFixed(2));
    const repetidos = PESOS.filter((p, k) => k && larguras[k] === larguras[k - 1]);
    if (repetidos.length) console.log(`atenção: ${f} não tem o peso ${repetidos.join(", ")} (sai igual ao vizinho na prova)`);
  }
}

for (const [n, t] of daProva.entries()) {
  const recorte = "data:image/png;base64," + readFileSync(join(QUADROS, t.original)).toString("base64");
  const linhas = PESOS.length
    ? carregadas.flatMap((f) => PESOS.map((peso) => ({ f, peso, ...ajuste(f, t, peso) })))
    : carregadas.map((f) => ({ f, peso: t.peso ?? 400, ...ajuste(f, t) }));
  const png = await pagina.evaluate(async ({ recorte, t, linhas }) => {
    const im = await new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = recorte; });
    const [x0, y0, x1, y1] = t.caixa;
    const w = x1 - x0, h = y1 - y0, rotulo = 210, escala = Math.max(1, Math.min(3, 1400 / w));
    const c = document.createElement("canvas");
    c.width = Math.round((w + rotulo) * escala);
    c.height = Math.round(h * escala * (linhas.length + 1));
    const g = c.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
    g.scale(escala, escala);
    g.font = "600 13px system-ui"; g.fillStyle = "#c00"; g.fillText("ORIGINAL", 6, h / 2 + 4);
    g.drawImage(im, x0, y0, w, h, rotulo, 0, w, h);
    // a mesma posição horizontal da tinta original, para comparar letra com letra
    const fundo = (() => { const s = document.createElement("canvas"); s.width = w; s.height = h; const sg = s.getContext("2d"); sg.drawImage(im, x0, y0, w, h, 0, 0, w, h); return sg.getImageData(0, 0, w, h).data; })();
    let inicio = 0;
    achou: for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
      const k = (y * w + x) * 4;
      if (Math.abs(fundo[k] - fundo[8]) + Math.abs(fundo[k + 1] - fundo[9]) + Math.abs(fundo[k + 2] - fundo[10]) > 150) { inicio = x; break achou; }
    }
    linhas.forEach(({ f, peso, px, em }, k) => {
      const topo = h * (k + 1);
      g.fillStyle = k % 2 ? "#f4f4f4" : "#fff"; g.fillRect(0, topo, w + rotulo, h);
      g.letterSpacing = "0px";
      g.font = "12px system-ui"; g.fillStyle = "#555"; g.fillText(`${f} ${peso} ${em.toFixed(3)}em`, 6, topo + h / 2 + 4);
      g.font = `${peso} ${px}px "${f}"`;
      g.letterSpacing = `${em * px}px`;
      g.fillStyle = "#111";
      const m = g.measureText(t.texto);
      g.fillText(t.texto, rotulo + inicio + m.actualBoundingBoxLeft, topo + (h + m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
    });
    return c.toDataURL("image/png");
  }, { recorte, t, linhas });
  const arquivo = join(SAIDA, `prova-${String(n + 1).padStart(2, "0")}.png`);
  writeFileSync(arquivo, Buffer.from(png.split(",")[1], "base64"));
  console.log(`prova: ${arquivo}  (${t.texto.slice(0, 40)})`);
}
await navegador.close();
console.log('\nAbrir as provas e escolher no olho. Depois: MODO=tamanho FONTE="<a escolhida>" ESPACO=<o espaçamento dela>');
