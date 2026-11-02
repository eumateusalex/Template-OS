// sonda-transicao-pagina.mjs — a TROCA de página pelo clique tem, no clone, a mesma transição do original?
//
// 🚨 Por que existe: o Framer troca de página
// por document.startViewTransition, com um CSS que ele injeta só durante a troca (<style id="view-transition-styles">):
// a página velha sobe e some, a nova é revelada por máscara. Um clone que troca de uma vez passa em toda régua de página
// assentada. Esta clica e olha o caminho.
//
// Por percurso "origem|texto do link", nos dois lados: quantas vezes startViewTransition foi chamada, as animações dos
// pseudo-elementos ::view-transition-* (nome, duração, curva, quadros de opacidade e transform), se havia máscara, e o
// tempo até a transição começar (ready) e acabar (finished). Sai com código 1 se o clone não tem a transição que o
// original tem, ou se duração, curva ou quadros diferem.
// Uso: ORIGINAL=<url> CLONE=<url> PERCURSOS="/|Blog;/blog|Primeiro post" [L=1280] [DITTO=…] node sonda-transicao-pagina.mjs
import { createRequire } from "node:module";
const require = createRequire((process.env.DITTO ?? (process.env.USERPROFILE ?? process.env.HOME) + "/dev/ditto").replace(/\/?$/, "/"));
{
  const pastaDitto = (process.env.DITTO ?? (process.env.USERPROFILE ?? process.env.HOME) + "/dev/ditto").replace(/\/?$/, "/");
  if (!(await import("node:fs")).existsSync(`${pastaDitto}node_modules/playwright/package.json`)) {
    console.error(`o Playwright do ditto não está em ${pastaDitto}: aponte DITTO=<pasta do ditto>`);
    process.exit(1);
  }
}
const { chromium } = require("playwright");
const { ORIGINAL, CLONE } = process.env;
if (!ORIGINAL || !CLONE || !process.env.PERCURSOS) { console.error("ORIGINAL, CLONE e PERCURSOS são obrigatórias"); process.exit(2); }
const L = Number(process.env.L ?? 1280);
const PERCURSOS = process.env.PERCURSOS.split(";").map((p) => p.split("|"));
const ESPIA = () => {
  window.__vt = { chamadas: 0, css: "", an: [] };
  new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.id === "view-transition-styles") window.__vt.css = n.textContent; }).observe(document.head, { childList: true });
  const o = document.startViewTransition && document.startViewTransition.bind(document);
  if (!o) return;
  document.startViewTransition = (cb) => {
    window.__vt.chamadas++; const t0 = performance.now(); const vt = o(cb);
    vt.ready.then(() => {
      window.__vt.ready = Math.round(performance.now() - t0);
      window.__vt.an = document.getAnimations().filter((a) => a.effect.pseudoElement && !/-ua-/.test(a.animationName || "")).map((a) => { const t = a.effect.getTiming(); const kf = a.effect.getKeyframes(); return { pseudo: a.effect.pseudoElement, dur: t.duration, curva: (kf[0] && kf[0].easing) || t.easing, de: `${kf[0]?.opacity}/${kf[0]?.transform}`, ate: `${kf.at(-1)?.opacity}/${kf.at(-1)?.transform}` }; }).sort((x, y) => x.pseudo.localeCompare(y.pseudo));
      window.__vt.mascara = /mask-image/.test(window.__vt.css);
    }).catch(() => {});
    vt.finished.then(() => { window.__vt.fim = Math.round(performance.now() - t0); }).catch(() => {});
    return vt;
  };
};
const b = await chromium.launch(); let ruins = 0;
for (const [origem, link] of PERCURSOS) {
  const res = {};
  for (const [nome, base] of [["original", ORIGINAL], ["clone", CLONE]]) {
    const p = await (await b.newContext({ viewport: { width: L, height: 900 } })).newPage();
    await p.goto(base.replace(/\/$/, "") + origem, { waitUntil: "load" }); await p.waitForTimeout(3000);
    await p.evaluate(ESPIA);
    await p.locator("a", { hasText: link }).filter({ visible: true }).first().click();
    await p.waitForTimeout(3500);
    res[nome] = await p.evaluate(() => ({ ...window.__vt, rota: location.pathname }));
    await p.context().close();
  }
  const { original: o, clone: c } = res;
  const desc = (x) => x.an.map((a) => `${a.pseudo} ${a.dur}ms ${a.curva} ${a.de}→${a.ate}`).join(" · ") || "sem animação";
  const igual = o.chamadas === c.chamadas && desc(o) === desc(c) && !!o.mascara === !!c.mascara;
  if (!igual) ruins++;
  console.log(`${igual ? "  " : "🚨"} ${origem} → «${link}» (${o.rota} | ${c.rota})`);
  console.log(`      original: ${o.chamadas} transição(ões) · ${desc(o)} · máscara ${!!o.mascara} · começa ${o.ready ?? "-"}ms · acaba ${o.fim ?? "-"}ms`);
  console.log(`      clone:    ${c.chamadas} transição(ões) · ${desc(c)} · máscara ${!!c.mascara} · começa ${c.ready ?? "-"}ms · acaba ${c.fim ?? "-"}ms`);
}
await b.close();
console.log(`\n${ruins ? `🚨 ${ruins} percurso(s) com transição diferente` : "a transição é a mesma em todos os percursos"} (o tempo até começar depende da rede: só informa)`);
process.exitCode = ruins ? 1 : 0;
