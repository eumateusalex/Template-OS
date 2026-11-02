// grava.mjs — grava a entrada da página em quadros, para o curva.py medir como mede o vídeo.
//
// As animações da página rodam 4x mais devagar (Animation.setPlaybackRate do Chrome, que
// pega a WAAPI que o Motion usa em opacidade, transform e filtro) e cada quadro sai com o
// tempo REAL no nome (q_<ms>.png, já dividido pela câmera lenta). Assim uma foto que leva
// 80 ms vira um quadro a cada 20 ms de animação.
//
// Uso: node "$S/grava.mjs" <url> <pasta> <segundos de animação> [rolagem]   (LENTA=12 para mais quadros)
//   [rolagem] em px: a página rola até lá antes de gravar (a entrada que dispara ao entrar).
// 🚨 Animação que o Motion roda em JavaScript (um animate() num MotionValue) NÃO desacelera:
// ela sai com o tempo errado. Serve para as entradas por WAAPI (palavras, pílulas, Surge).
// 🚨 A taxa às vezes não segura (uma passada em quatro): grave três vezes
// e só confie no número que se repete.
import { createRequire } from "node:module";
import { mkdirSync, rmSync } from "node:fs";
const require = createRequire((process.env.DITTO ?? (process.env.USERPROFILE ?? process.env.HOME) + "/dev/ditto").replace(/\/?$/, "/"));
const { chromium } = require("playwright");
const [url, pasta, segundos = "2.5", rolagem] = process.argv.slice(2);
const LENTA = Number(process.env.LENTA ?? 4);
rmSync(pasta, { recursive: true, force: true });
mkdirSync(pasta, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 764 } });
const cdp = await p.context().newCDPSession(p);
await cdp.send("Animation.enable");
await cdp.send("Animation.setPlaybackRate", { playbackRate: 1 / LENTA });
await p.goto(url, { waitUntil: rolagem ? "load" : "commit" });
if (rolagem) {
  await p.evaluate((y) => scrollTo(0, Number(y)), rolagem);
}
const t0 = Date.now();
while ((Date.now() - t0) / LENTA < Number(segundos) * 1000) {
  const t = Math.round((Date.now() - t0) / LENTA);
  await p.screenshot({ path: `${pasta}/q_${String(t).padStart(5, "0")}.png` });
}
await b.close();
console.log("ok");
