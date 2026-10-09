// gate-vazamento.mjs — o clone fala com servidor de terceiro?
//
// 🚨 Existe porque o site clonado dispara lead num CRM alheio
// (api.crm-terceiro.com.br) e um evento no Meta Pixel de terceiro. Nenhum dos
// gates da skill pega isso: rotas, metadata, geometria, conteudo e ate o gate
// de link interno passam limpos, porque a requisicao so acontece EM RUNTIME,
// depois de um formulario preenchido ate o fim. O defeito nao esta no HTML,
// esta no comportamento.
//
// O que faz: abre o clone, intercepta TODA requisicao (incluindo as que
// falham e as abortadas), percorre o formulario inteiro ate o envio, e lista
// todo host tocado. Reprova se qualquer host proibido aparecer.
//
// Saida: 0 = percorreu ate o envio e nada vazou · 1 = vazou · 2 = NAO chegou
// ao envio, entao nao mediu o que importa. Sem o caso 2, a saida seria 0 e o
// relatorio diria "percorrido ate o envio" sem ter percorrido (medido com uma
// pagina sem formulario).
//
// Uso:
//   CLONE=http://127.0.0.1:8082 PROIBIDOS=dominio-do-original,crm-terceiro,facebook \
//   SAIDA=./rede node gate-vazamento.mjs
//
// O caminhador do formulário se ajusta ao alvo por quatro variáveis, todas com
// um padrão genérico:
//   FORM_SELETOR   o formulário inteiro (padrão: form)
//   FORM_CAMPOS    onde ficam os campos visíveis (padrão: o próprio formulário)
//   FORM_OPCAO     o botão de opção, num formulário de uma pergunta por tela
//                  (padrão: [role=radio], button[data-opcao])
//   FORM_CHEGADA   o texto que aparece depois do envio, como expressão regular
//                  (padrão: obrigad|recebid|enviad)
// Seletor que não casa com o alvo faz o percurso não chegar ao envio, e o gate
// declara a cobertura PARCIAL em vez de aprovar.

import { createRequire } from "node:module";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const CLONE = process.env.CLONE;
const FORM = process.env.FORM_SELETOR || "form";
const CAMPOS = process.env.FORM_CAMPOS || FORM;
const OPCAO = process.env.FORM_OPCAO || "[role=radio], button[data-opcao]";
const CHEGADA = new RegExp(process.env.FORM_CHEGADA || "obrigad|recebid|enviad", "i");
if (!CLONE) { console.error("falta CLONE=<url>"); process.exit(1); }
// Os domínios proibidos são do alvo (o do site original, o do CRM dele): sem eles
// o gate só olharia o Facebook, e diria que conferiu o resto. Então são exigidos,
// como o CLONE; o Facebook entra sempre junto.
if (!process.env.PROIBIDOS) {
  console.error("falta PROIBIDOS=<domínio do original>,<CRM>: sem eles o gate só olharia o Facebook");
  process.exit(1);
}
const PROIBIDOS = [...new Set([...process.env.PROIBIDOS.split(","), "facebook", "fbcdn"]
  .map((s) => s.trim().toLowerCase()).filter(Boolean))];
const SAIDA = resolve(process.env.SAIDA ?? "./rede");
const DITTO = process.env.DITTO ?? "C:/dev/ditto";

// Sem o Playwright do ditto no lugar, a resolução do Node subiria para
// C:\dev\node_modules e C:\node_modules, onde outro usuário da máquina poderia
// ter plantado um pacote com esse nome. Então: existe, ou para aqui, antes de
// escrever qualquer coisa no disco.
if (!existsSync(join(DITTO, "node_modules", "playwright", "package.json"))) {
  console.error(`o Playwright do ditto não está em ${DITTO}: aponte DITTO=<pasta do ditto>`);
  process.exit(1);
}
mkdirSync(SAIDA, { recursive: true });
const require = createRequire(DITTO.replace(/\/?$/, "/"));
const { chromium } = require("playwright");

const navegador = await chromium.launch();
const ctx = await navegador.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

const requisicoes = [];
// `request` pega TUDO que o navegador tenta, inclusive o que falha depois
page.on("request", (r) => {
  let host = "(invalido)";
  try { host = new URL(r.url()).host; } catch (e) {}
  requisicoes.push({ host, metodo: r.method(), tipo: r.resourceType(), url: r.url().slice(0, 200) });
});
const erros = [];
page.on("pageerror", (e) => erros.push(String(e).slice(0, 200)));

const passos = [];
const passo = (t) => { passos.push(t); console.log("  · " + t); };

await page.goto(CLONE, { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(2500);
passo("carregou a home (formulario abre sozinho)");

// ── percorre o formulario ate o fim ────────────────────────────────────
// O formulario aceita teclado completo: Enter avanca, A/B/C escolhem opcao.
// Usar o teclado evita disputar com o card em transicao (dois cards coexistem
// por alguns ms, e clicar "no primeiro" acerta o card que esta SAINDO).
const chegou = async () => {
  // timeout curto: sem ele, formulario ausente custava 30s por volta (13 min no total)
  const t = await page.locator(FORM).first().innerText({ timeout: 2000 }).catch(() => "");
  return CHEGADA.test(t);
};

// O texto de chegada que já aparece ANTES do primeiro passo não distingue o fim
// ("Obrigado pelo interesse" no topo do formulário): o percurso acabaria ali,
// sem envio. Nesse caso o gate não mede, e pede um FORM_CHEGADA próprio.
const chegadaAntes = await chegou();
if (chegadaAntes) passo("o texto de chegada já aparece ANTES do envio: o padrão não distingue o fim (ajuste FORM_CHEGADA)");
const antesDoPercurso = requisicoes.length;

let chegouAoFim = false;
for (let i = 0; i < 25 && !chegouAoFim && !chegadaAntes; i++) {
  const campo = page.locator(`${CAMPOS} input:visible`).last();
  const temCampo = (await campo.count()) > 0;

  if (temCampo) {
    const tipo = await campo.getAttribute("type").catch(() => null);
    const valor = tipo === "tel" ? "11987654321" : "Teste Clone " + i;
    await campo.fill(valor).catch(() => {});
    await page.waitForTimeout(250);
    await page.keyboard.press("Enter");
    passo("campo de texto preenchido e avancado (" + (tipo ?? "text") + ")");
  } else {
    const opts = await page.locator(`${CAMPOS} :is(${OPCAO}):visible`).count();
    if (opts > 0) {
      await page.keyboard.press("a");           // escolhe a 1a opcao
      passo("escolha unica: opcao A (" + opts + " opcoes na tela)");
    } else {
      await page.keyboard.press("Enter");        // welcome / final
      passo("tela sem campo nem opcao: Enter");
    }
  }
  await page.waitForTimeout(900);
  chegouAoFim = await chegou();
}
await page.waitForTimeout(3500);

// Chegar ao texto final sem nenhum envio (POST, PUT) não é envio: o formulário
// pode só ter trocado de tela. O gate só fecha com os dois sinais.
const enviou = requisicoes.slice(antesDoPercurso).some((r) => !["GET", "HEAD", "OPTIONS"].includes(r.metodo));
if (chegouAoFim && !enviou) passo("o texto de chegada apareceu, mas nenhuma requisição de envio saiu: não conta como envio");
chegouAoFim = chegouAoFim && enviou;

passo(chegouAoFim ? "formulario percorrido ATE O ENVIO do lead" : "NAO chegou ao envio — cobertura PARCIAL, gate nao fecha");

await navegador.close();

// ── veredito ───────────────────────────────────────────────────────────
const hosts = [...new Set(requisicoes.map((r) => r.host))].sort();
const vazamentos = requisicoes.filter((r) => PROIBIDOS.some((p) => r.host.toLowerCase().includes(p)));

const contagem = {};
for (const r of requisicoes) contagem[r.host] = (contagem[r.host] ?? 0) + 1;

const md = `# Gate de vazamento de rede

Clone medido: ${CLONE}
Hosts proibidos: ${PROIBIDOS.map((p) => "`" + p + "`").join(", ")}

## Percurso executado

${passos.map((p) => "1. " + p).join("\n")}

Chegou ao envio do lead: **${chegouAoFim ? "SIM" : "NÃO"}**

## Hosts tocados (${hosts.length})

| Host | Requisições |
|---|---|
${hosts.map((h) => "| `" + h + "` | " + contagem[h] + " |").join("\n")}

## Veredito

**Requisições para host proibido: ${vazamentos.length}**

${vazamentos.length
  ? vazamentos.map((v) => "- ❌ `" + v.metodo + " " + v.url + "`").join("\n")
  : chegouAoFim
    ? "✅ **ZERO.** Nenhuma requisição saiu para " + PROIBIDOS.join(", ") + ", com o formulário percorrido até o envio."
    : "⚠️ **NÃO FECHA.** O formulário não chegou ao envio: zero vazamento no trecho percorrido não prova nada. Ajuste FORM_SELETOR, FORM_CAMPOS, FORM_OPCAO e FORM_CHEGADA ao formulário do alvo (cabeçalho deste arquivo) e rode de novo."}

## Erros de página durante o percurso

${erros.length ? erros.map((e) => "- `" + e + "`").join("\n") : "_nenhum_"}
`;

writeFileSync(join(SAIDA, "REDE.md"), md, "utf8");
writeFileSync(join(SAIDA, "requisicoes.json"), JSON.stringify(requisicoes, null, 2), "utf8");

console.log("\nhosts tocados: " + hosts.join(", "));
console.log("requisicoes para host proibido: " + vazamentos.length);
console.log("chegou ao envio: " + (chegouAoFim ? "SIM" : "NAO"));
console.log("-> " + join(SAIDA, "REDE.md"));
// 1 = vazou; 2 = não mediu até o fim (o percurso parou antes do envio); 0 = limpo.
process.exit(vazamentos.length ? 1 : chegouAoFim ? 0 : 2);
