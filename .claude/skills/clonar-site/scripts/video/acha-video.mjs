// acha-video.mjs — onde está o vídeo de um shot (Dribbble, Behance, página qualquer)?
//
// Abre a página no navegador (o Dribbble não entrega o vídeo ao curl: a página
// depende de JavaScript), lê o vídeo pelo JSON-LD (`contentUrl`) e pelas tags
// <video>, junta o título, o autor e os links que saem da página, e baixa o
// maior vídeo para DESTINO.
//
// 🚨 Antes de reconstruir, ler `links` na saída: se o autor apontar o site no
// ar (Framer, Webflow, domínio próprio), o caminho é o clone normal, não o vídeo.
//
// Uso:
//   URL=https://dribbble.com/shots/123-nome DESTINO=./referencia node acha-video.mjs
//
// Variáveis:
//   URL      a página do shot (obrigatória)
//   DESTINO  pasta onde o vídeo e o achado.json caem (padrão: ./referencia)
//   DITTO    raiz do ditto (padrão: ~/dev/ditto)
//
// Saída: DESTINO/original.mp4 e DESTINO/achado.json; sai 0. As imagens paradas do
// shot vão para DESTINO/imagens/: leem texto miúdo, nunca medem.
// Shot só de imagem: DESTINO/original.png e sai 2 (o layout se refaz, o movimento não).
// Nada achado: sai 1. Se a página for para outro endereço, avisa.

import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";

const URL_ = process.env.URL;
if (!URL_) {
  console.error("falta URL");
  process.exit(1);
}
const DESTINO = resolve(process.env.DESTINO ?? "./referencia");
const DITTO = process.env.DITTO ?? (process.env.USERPROFILE ?? process.env.HOME) + "/dev/ditto";
mkdirSync(DESTINO, { recursive: true });

const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 900 } });
await pagina.goto(URL_, { waitUntil: "domcontentloaded", timeout: 60000 });
await pagina.waitForTimeout(4000);

const achado = await pagina.evaluate(() => {
  const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap((s) => {
    try {
      const j = JSON.parse(s.textContent);
      return Array.isArray(j) ? j : [j];
    } catch {
      return [];
    }
  });
  // contentUrl serve a vídeo E a imagem: o tipo decide (VideoObject ou extensão de vídeo)
  const ehVideo = (o) => o["@type"] === "VideoObject" || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(o.contentUrl);
  const doLd = ld.filter((o) => o && o.contentUrl && ehVideo(o)).map((o) => ({ url: o.contentUrl, autor: o.creator?.name ?? null, data: o.uploadDate ?? null }));
  const imagens = ld.filter((o) => o && o.contentUrl && !ehVideo(o)).map((o) => o.contentUrl);
  const dasTags = [...document.querySelectorAll("video, video source")]
    .map((v) => ({ url: v.currentSrc || v.src, largura: v.videoWidth || null, altura: v.videoHeight || null, duracao: v.duration || null }))
    .filter((v) => v.url && !v.url.startsWith("blob:"));
  const origem = location.hostname.replace(/^www\./, "");
  const links = [...new Set([...document.querySelectorAll("a[href]")].map((a) => a.href))].filter(
    (h) => /^https?:/.test(h) && !h.includes(origem) && !/(instagram|facebook|pinterest|youtube|threads|x)\.com|twitter\.com|linkedin\.com/.test(h)
  );
  return { titulo: document.title, endereco: location.href, descricao: document.querySelector('meta[name="description"]')?.content ?? null, videos: [...doLd, ...dasTags], imagens, links };
});
await navegador.close();

// 🚨 O Dribbble decide o shot pelo NÚMERO e ignora o resto do endereço: um
// endereço com número errado abre outro shot, sem erro. Conferir o título.
const pedido = new URL(URL_), chegou = new URL(achado.endereco);
if (pedido.pathname.replace(/\/$/, "") !== chegou.pathname.replace(/\/$/, "")) {
  console.log(`atenção: a página foi para ${achado.endereco}. Conferir se é o shot pedido.`);
}

// Baixa cada candidato e fica com o maior (o vídeo cheio, não a prévia; a imagem maior).
const baixaMaior = async (lista) => {
  let maior = null;
  for (const url of new Set(lista)) {
    const r = await fetch(url, { headers: { Referer: URL_, "User-Agent": "Mozilla/5.0" } }).catch(() => null);
    if (!r?.ok) continue;
    const corpo = Buffer.from(await r.arrayBuffer());
    if (!maior || corpo.length > maior.corpo.length) maior = { url, corpo };
  }
  return maior;
};

// O código de saída vai por exitCode: process.exit logo depois de um fetch
// derruba o Node no Windows (UV_HANDLE_CLOSING) e a saída vira 127.
const video = await baixaMaior(achado.videos.map((v) => v.url));
const imagem = video ? null : await baixaMaior(achado.imagens);

// Com vídeo, as imagens paradas do shot descem para DESTINO/imagens/: são mais
// nítidas que o quadro e servem para LER texto miúdo. 🚨 Não servem para medir:
// medido num shot real, a imagem tinha o título 10 px à direita e uma faixa 26 px
// mais alta que o vídeo. É outro estado do desenho. A medida é sempre do quadro.
let extras = 0;
if (video) {
  for (const url of new Set(achado.imagens)) {
    const r = await fetch(url, { headers: { Referer: URL_, "User-Agent": "Mozilla/5.0" } }).catch(() => null);
    if (!r?.ok) continue;
    mkdirSync(join(DESTINO, "imagens"), { recursive: true });
    writeFileSync(join(DESTINO, "imagens", `imagem-${++extras}${url.match(/\.(png|jpe?g|webp)/i)?.[0] ?? ".png"}`), Buffer.from(await r.arrayBuffer()));
  }
}
const arquivo = video ? "original.mp4" : imagem ? "original.png" : null;
if (arquivo) {
  const b = video ?? imagem;
  writeFileSync(join(DESTINO, arquivo), b.corpo);
  achado.baixado = { url: b.url, bytes: b.corpo.length };
}
writeFileSync(join(DESTINO, "achado.json"), JSON.stringify(achado, null, 2));

console.log(`titulo: ${achado.titulo}`);
if (video) {
  console.log(`video: ${video.url} (${(video.corpo.length / 1e6).toFixed(1)} MB) -> ${join(DESTINO, arquivo)}`);
  if (extras) console.log(`imagens do shot: ${extras} em ${join(DESTINO, "imagens")} (só para LER texto; a medida é do quadro do vídeo)`);
} else if (imagem) {
  console.log(`sem vídeo: só imagem parada -> ${join(DESTINO, arquivo)}. Layout sim, movimento não.`);
} else {
  console.log("nenhum vídeo nem imagem que baixasse: ver achado.json");
}
console.log(`links para fora: ${achado.links.length ? achado.links.join(" | ") : "nenhum"}`);
process.exitCode = video ? 0 : imagem ? 2 : 1;
