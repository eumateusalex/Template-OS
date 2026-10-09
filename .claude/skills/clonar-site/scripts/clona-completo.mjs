// clona-completo.mjs — clone com TODAS as rotas, pelo plano explícito.
//
// Por que existe: o `--mode=multi` da CLI colapsa coleção (3+ itens viram a
// listagem mais UM representante) e não há flag que desligue. Medido no
// site-exemplo: 25 descobertas, 12 selecionadas, 4 delas página de erro.
//
// O contorno é oficial e está em docs/EXPERIMENTAL_ION_CMS_HANDOFF.md: quando
// um `experimentalClonePlan` é fornecido, ele SUBSTITUI o crawl inteiro
// (compiler/src/site/plannedClone.ts), então o colapso nunca roda. Um plano
// "all-static" lista cada página em `staticRoutes` e captura todas.
//
// ⚠️ Esse caminho NÃO existe na CLI (o cli.ts não expõe o plano). Só pela API
// REST local. Não precisa de Docker: o backend em memória resolve o reuso de
// captura, desde que o servidor fique de pé entre as duas chamadas.
//
// Fluxo obrigatório de dois passos (o serviço rejeita qualquer atalho):
//   1. clone modo single  -> guarda o jobId
//   2. clone modo multi + flag + plano + aquele jobId
//
// Uso:
//   1) em outro terminal:  cd C:\dev\ditto && npm run dev:api:stable
//   2) SITE=<url> ROTAS=<rotas.json> SAIDA=<pasta> node clona-completo.mjs
//
// Variáveis:
//   SITE   URL do original (obrigatória)
//   ROTAS  rotas.json do levanta-rotas.mjs (obrigatória)
//   SAIDA  pasta onde gravar o resultado JSON (obrigatória)
//   API    base da API local (padrão: http://127.0.0.1:8787)
//   PULAR  rotas a excluir do plano, separadas por vírgula (ex.: /404)

import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";

const SITE = process.env.SITE;
const ROTAS = process.env.ROTAS;
const SAIDA = process.env.SAIDA;
if (!SITE || !ROTAS || !SAIDA) {
  console.error("faltam SITE, ROTAS e/ou SAIDA");
  process.exit(1);
}
const API = process.env.API ?? "http://127.0.0.1:8787";
const PULAR = new Set((process.env.PULAR ?? "").split(",").map((s) => s.trim()).filter(Boolean));
mkdirSync(resolve(SAIDA), { recursive: true });

const entrada = new URL(SITE).pathname.replace(/\/+$/, "") || "/";

const lista = JSON.parse(readFileSync(ROTAS, "utf8"));
// Só rota que o ORIGINAL serve de verdade entra no plano. Rota fantasma
// (o original responde 404) não é conteúdo, é ruído do crawler.
const reais = lista.rotas
  .filter((r) => r.status === 200 || r.status === null)
  .map((r) => r.rota)
  .filter((r) => r !== entrada && !PULAR.has(r));

console.log(`plano all-static: entrada ${entrada} + ${reais.length} rotas`);

/** 🚨 A API é ASSÍNCRONA: o POST devolve `queued` e volta na hora. Disparar o
 *  passo 2 direto bate no guard "BUSY: another clone is already running" e
 *  perde o passo 1 inteiro. E o reuso de captura exige `status === succeeded`.
 *  Portanto: esperar o job terminar, sempre. */
async function esperarJob(jobId, rotulo) {
  let ultimo = "";
  for (let i = 0; i < 3600; i++) {
    const r = await fetch(`${API}/v1/clones/${jobId}`);
    if (!r.ok) throw new Error(`não consegui ler o job ${jobId}: HTTP ${r.status}`);
    const j = await r.json();
    if (j.status !== ultimo) {
      ultimo = j.status;
      console.log(`  [${rotulo}] ${j.status}`);
    }
    if (j.status === "succeeded") return j;
    if (j.status === "failed" || j.status === "cancelled") {
      throw new Error(`job ${jobId} terminou como ${j.status}: ${JSON.stringify(j.error ?? j).slice(0, 400)}`);
    }
    await new Promise((r2) => setTimeout(r2, 5000));
  }
  throw new Error(`job ${jobId} não terminou no tempo limite`);
}

async function chamar(caminho, corpo) {
  const r = await fetch(API + caminho, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const texto = await r.text();
  let json;
  try {
    json = JSON.parse(texto);
  } catch {
    throw new Error(`resposta não-JSON de ${caminho} (HTTP ${r.status}): ${texto.slice(0, 400)}`);
  }
  if (!r.ok) throw new Error(`HTTP ${r.status} em ${caminho}: ${JSON.stringify(json).slice(0, 600)}`);
  return json;
}

// A API só responde depois que o clone termina; clone grande leva minutos.
try {
  const saude = await fetch(API + "/health").catch(() => null);
  if (!saude) {
    console.error(`API não responde em ${API}`);
    console.error("suba antes:  cd C:\\dev\\ditto && npm run dev:api:stable");
    process.exit(1);
  }
} catch {
  /* alguns builds não expõem /health; seguimos e deixamos a 1ª chamada falhar */
}

let jobId = process.env.JOBID ?? null;
if (jobId) {
  console.log(`\npasso 1/2 — reusando job single já existente: ${jobId}`);
  await esperarJob(jobId, "single");
} else {
  console.log("\npasso 1/2 — clone single (a captura de entrada que o plano reusa)");
  const single = await chamar("/v1/clones", { url: SITE, options: { mode: "single" } });
  jobId = single.jobId;
  if (!jobId) throw new Error("passo 1 não devolveu jobId: " + JSON.stringify(single).slice(0, 400));
  console.log(`  jobId: ${jobId}  status inicial: ${single.status}`);
  writeFileSync(join(resolve(SAIDA), "passo1-single.json"), JSON.stringify(single, null, 2), "utf8");
  await esperarJob(jobId, "single");
}

const plano = {
  version: "ion-clone-plan-v1",
  entryRoute: entrada,
  staticRoutes: reais,
  manifests: [],
  renderers: [],
  // "a disposition for every in-scope route" — o plano all-static marca todas
  // como `static`, que é o que faz cada uma virar captura própria.
  dispositions: reais.map((path) => ({ path, kind: "static" })),
};
writeFileSync(join(resolve(SAIDA), "plano.json"), JSON.stringify(plano, null, 2), "utf8");

console.log(`\npasso 2/2 — clone multi com plano de ${reais.length + 1} rotas (demora)`);
const completo = await chamar("/v1/clones", {
  url: SITE,
  options: {
    mode: "multi",
    framework: "next",
    experimentalContentHandoff: "ion-cms-v1",
    experimentalReuseCaptureJobId: jobId,
    experimentalClonePlan: plano,
  },
});
console.log(`  jobId: ${completo.jobId}  status inicial: ${completo.status}`);
await esperarJob(completo.jobId, "multi");

// O resultado só existe depois do job fechar — buscar o mapa de arquivos.
const rRes = await fetch(`${API}/v1/clones/${completo.jobId}/result`);
if (!rRes.ok) throw new Error(`não consegui ler o resultado: HTTP ${rRes.status}`);
const resultado = await rRes.json();

const destino = join(resolve(SAIDA), "clone.json");
writeFileSync(destino, JSON.stringify(resultado, null, 2), "utf8");

const arquivos = resultado.files ? Object.keys(resultado.files) : [];
const paginas = arquivos.filter((p) => /(^|\/)page\.tsx$/.test(p));
console.log(`  arquivos: ${arquivos.length}  ·  páginas geradas: ${paginas.length}`);
for (const p of paginas.sort()) console.log(`    ${p.replace(/^src\/app/, "").replace(/\/page\.tsx$/, "") || "/"}`);
console.log(`\nresultado -> ${destino}`);
console.log(`desempacotar com:\n  cd C:\\dev\\ditto && npm run unpack -- "${destino}" "<pasta-do-app>"`);
