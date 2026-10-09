// confere-pareado.mjs — mede ORIGINAL e CLONE no MESMO instante do ciclo de vida.
//
// 🚨 Existe porque a bateria de cobertura acusou título divergente num clone
// byte a byte IDÊNTICO ao original. A causa não era o clone: o `script.js`
// reescreve `document.title` em runtime, e o original (pela rede) ainda não
// tinha rodado o JS quando foi lido, enquanto o clone (local) já tinha.
// Medição que lê os dois lados em estágios diferentes do carregamento MENTE.
//
// O que ele faz: abre os dois, espera o MESMO critério nos dois (load +
// assentamento fixo), e compara título, contagem de elementos e erros de
// console. Erro que o clone tem e o original não, reprova.
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 LARGURA=1280 \
//   ASSENTA=3000 SAIDA=./pareado node confere-pareado.mjs

import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const ORIGINAL = process.env.ORIGINAL;
const CLONE = process.env.CLONE;
if (!ORIGINAL || !CLONE) { console.error("faltam ORIGINAL e/ou CLONE"); process.exit(1); }
const LARGURA = Number(process.env.LARGURA ?? 1280);
const ALTURA = Number(process.env.ALTURA ?? 900);
const ASSENTA = Number(process.env.ASSENTA ?? 3000);
const SAIDA = resolve(process.env.SAIDA ?? "./pareado");
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
mkdirSync(SAIDA, { recursive: true });

if (!(await import("node:fs")).existsSync(`${DITTO.replace(/\/?$/, "/")}node_modules/playwright/package.json`)) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

async function medir(navegador, url, rotulo) {
  const ctx = await navegador.newContext({ viewport: { width: LARGURA, height: ALTURA } });
  const page = await ctx.newPage();
  const console_ = [];
  const falhas = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") console_.push({ tipo: m.type(), texto: m.text().slice(0, 300) });
  });
  page.on("pageerror", (e) => console_.push({ tipo: "pageerror", texto: String(e).slice(0, 300) }));
  page.on("requestfailed", (r) => falhas.push({ url: r.url().slice(0, 200), erro: r.failure()?.errorText }));

  await page.goto(url, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(ASSENTA);

  const dados = await page.evaluate(() => {
    const imgs = [...document.images];
    return {
      titulo: document.title,
      htmlClass: document.documentElement.className,
      elementos: document.querySelectorAll("*").length,
      comTexto: [...document.querySelectorAll("*")].filter(
        (e) => e.children.length === 0 && e.textContent.trim()
      ).length,
      imagens: imgs.length,
      imagensQuebradas: imgs.filter((i) => i.complete && i.naturalWidth === 0).length,
      alturaDoc: document.documentElement.scrollHeight,
      larguraDoc: document.documentElement.scrollWidth,
      animacoesVivas: document.getAnimations().length,
      svgs: document.querySelectorAll("svg").length,
      fonteCorpo: getComputedStyle(document.body).fontFamily,
      corFundo: getComputedStyle(document.body).backgroundColor,
    };
  });

  await ctx.close();
  return { rotulo, url, ...dados, console: console_, requisicoesFalhas: falhas };
}

const navegador = await chromium.launch();
const o = await medir(navegador, ORIGINAL, "original");
const c = await medir(navegador, CLONE, "clone");
await navegador.close();

// erros que o CLONE tem e o ORIGINAL não
const norm = (t) => t.replace(/https?:\/\/[^\s)]+/g, "<url>").replace(/\d+/g, "#").trim();
const setO = new Set(o.console.map((x) => norm(x.texto)));
const soDoClone = c.console.filter((x) => !setO.has(norm(x.texto)));

const campos = ["titulo","htmlClass","elementos","comTexto","imagens","imagensQuebradas",
                "alturaDoc","larguraDoc","animacoesVivas","svgs","fonteCorpo","corFundo"];
const linhas = campos.map((k) => {
  const a = o[k], b = c[k];
  const igual = String(a) === String(b);
  return `| \`${k}\` | ${String(a).slice(0,80)} | ${String(b).slice(0,80)} | ${igual ? "✅" : "⚠️"} |`;
});

const md = `# Conferência pareada @${LARGURA}px

Original: ${ORIGINAL} · Clone: ${CLONE}
Ambos lidos com \`waitUntil: load\` + ${ASSENTA}ms de assentamento.

| Campo | Original | Clone | Igual |
|---|---|---|---|
${linhas.join("\n")}

## Console

- erros/avisos no original: **${o.console.length}**
- erros/avisos no clone: **${c.console.length}**
- **erros que o clone tem e o original NÃO tem: ${soDoClone.length}**

${soDoClone.length ? soDoClone.map((x) => `- \`${x.tipo}\` ${x.texto}`).join("\n") : "_nenhum — gate de console FECHADO_"}

### Console do original (referência)
${o.console.length ? o.console.map((x) => `- \`${x.tipo}\` ${x.texto}`).join("\n") : "_limpo_"}

### Console do clone
${c.console.length ? c.console.map((x) => `- \`${x.tipo}\` ${x.texto}`).join("\n") : "_limpo_"}

## Requisições que falharam

- original: ${o.requisicoesFalhas.length}
- clone: ${c.requisicoesFalhas.length}
${c.requisicoesFalhas.map((x) => `  - ${x.erro} — ${x.url}`).join("\n")}
`;

writeFileSync(join(SAIDA, `PAREADO-${LARGURA}.md`), md, "utf8");
writeFileSync(join(SAIDA, `pareado-${LARGURA}.json`), JSON.stringify({ original: o, clone: c, soDoClone }, null, 2), "utf8");

console.log(`pareado @${LARGURA} -> ${join(SAIDA, `PAREADO-${LARGURA}.md`)}`);
for (const k of campos) {
  const igual = String(o[k]) === String(c[k]);
  console.log(`  ${igual ? "ok " : "DIF"} ${k}: ${String(o[k]).slice(0,45)} | ${String(c[k]).slice(0,45)}`);
}
console.log(`  erros só do clone: ${soDoClone.length}`);
process.exit(soDoClone.length ? 1 : 0);
