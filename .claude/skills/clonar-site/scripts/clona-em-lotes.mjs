// clona-em-lotes.mjs — o clona-completo para site GRANDE em máquina com pouca RAM.
//
// Por que existe: a API do ditto roda in-memory, e um job multi guarda TODAS as
// capturas na memória do processo até o fim. Medido no site-next (máquina com
// 15,9 GB e ~0,6 GB livres): um job de 231 rotas derruba a API ~25 min depois
// de `running`, sem stack — morte por pressão de memória. O site-exemplo
// (21 rotas) não sofre isso: o problema é escala, não código.
//
// O contorno: fatiar o plano all-static em LOTES. Cada lote é uma sessão nova
// da API (memória zerada), com o fluxo obrigatório single → multi daquele
// pedaço, resultado salvo em disco e API derrubada em seguida. Lote que já tem
// clone-lote-N.json no disco é pulado — o script é retomável por construção.
//
// A saída são N arquivos clone-lote-*.json E N pastas app-lote-* já
// desempacotadas. 🚨 O unpack RODA DENTRO DA SESSÃO do lote, antes de derrubar
// a API: os assets binários são URLs relativas servidas pela API in-memory —
// derrubou a sessão, perdeu as imagens daquele job. Quem junta as pastas num
// app só é o junta-lotes.mjs (lote 1 inteiro + rotas novas dos seguintes).
//
// Uso:
//   SITE=<url> ROTAS=<rotas.json> SAIDA=<pasta> node clona-em-lotes.mjs
//
// Variáveis:
//   SITE   URL do original (obrigatória)
//   ROTAS  rotas.json do levanta-rotas.mjs (obrigatória)
//   SAIDA  pasta onde gravar os resultados (obrigatória)
//   LOTE   rotas por lote (padrão: 30)
//   API    base da API local (padrão: uma porta livre que o sistema der; a API
//          sobe nela pelo PORT, e a porta que tem dono faz o script parar)
//   DITTO  raiz da instalação do ditto (padrão: C:/dev/ditto)
//   PULAR  rotas a excluir do plano, separadas por vírgula
//   HEAP   --max-old-space-size da API em MB (padrão: 5120)

import { writeFileSync, mkdirSync, readFileSync, existsSync, appendFileSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawn, execSync } from "node:child_process";
import { escolherApi, filhoDaApi } from "./api-local.mjs";

const SITE = process.env.SITE;
const ROTAS = process.env.ROTAS;
const SAIDA = process.env.SAIDA;
if (!SITE || !ROTAS || !SAIDA) {
  console.error("faltam SITE, ROTAS e/ou SAIDA");
  process.exit(1);
}
const { api: API, porta: PORTA } = await escolherApi(process.env).catch((e) => { console.error(e.message); process.exit(1); });
const DITTO = process.env.DITTO ?? "C:/dev/ditto";
const LOTE = Number(process.env.LOTE ?? 30);
const HEAP = Number(process.env.HEAP ?? 5120);
const PULAR = new Set((process.env.PULAR ?? "").split(",").map((s) => s.trim()).filter(Boolean));
mkdirSync(resolve(SAIDA), { recursive: true });
const logApi = join(resolve(SAIDA), "api.log");

const entrada = new URL(SITE).pathname.replace(/\/+$/, "") || "/";
const lista = JSON.parse(readFileSync(ROTAS, "utf8").replace(/^\uFEFF/, ""));
const reais = lista.rotas
  .filter((r) => r.status === 200 || r.status === null)
  .map((r) => r.rota)
  .filter((r) => r !== entrada && !PULAR.has(r));

const lotes = [];
for (let i = 0; i < reais.length; i += LOTE) lotes.push(reais.slice(i, i + LOTE));
console.log(`plano all-static em lotes: entrada ${entrada} + ${reais.length} rotas em ${lotes.length} lote(s) de até ${LOTE}`);

const filho = filhoDaApi(PORTA, {
  ambiente: { ...process.env, NODE_OPTIONS: `--max-old-space-size=${HEAP}` },
  lancar: (env) => {
    appendFileSync(logApi, `\n===== nova sessão ${new Date().toISOString()} =====\n`);
    return spawn("npm", ["run", "start", "--workspace", "@cloner/api"], {
      cwd: DITTO,
      shell: true,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
  },
});
const derrubarApi = filho.derrubar;
process.on("exit", derrubarApi);
process.on("SIGINT", () => { derrubarApi(); process.exit(130); });

async function apiResponde() {
  try {
    const r = await fetch(API + "/health").catch(() => fetch(API));
    return !!r;
  } catch {
    return false;
  }
}

// A API alheia não se reusa (a sobrevivente de outra tentativa devolve 404 para
// o job novo ou BUSY para o clone) e não se derruba: a porta é deste script, e
// quem estiver nela quando ele vai subir a sessão nova faz ele parar.
async function subirApi() {
  const filhoApi = await filho.subir();
  filhoApi.stdout.on("data", (d) => appendFileSync(logApi, d));
  filhoApi.stderr.on("data", (d) => appendFileSync(logApi, d));
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    if (await apiResponde()) {
      console.log("  api: de pé");
      return true;
    }
    if (filhoApi.exitCode !== null) throw new Error(`a API morreu ao subir (exit ${filhoApi.exitCode}) — ver ${logApi}`);
  }
  throw new Error("a API não respondeu em 120s");
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

async function esperarJob(jobId, rotulo) {
  let ultimo = "";
  for (let i = 0; i < 3600; i++) {
    let j;
    try {
      const r = await fetch(`${API}/v1/clones/${jobId}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      j = await r.json();
    } catch (e) {
      throw new Error(`perdi a API no meio do job ${jobId} (${rotulo}): ${e.message} — ver ${logApi}`);
    }
    if (j.status !== ultimo) {
      ultimo = j.status;
      console.log(`  [${rotulo}] ${j.status}`);
    }
    if (j.status === "succeeded") return j;
    if (j.status === "failed" || j.status === "cancelled")
      throw new Error(`job ${jobId} terminou como ${j.status}: ${JSON.stringify(j.error ?? j).slice(0, 400)}`);
    await new Promise((r2) => setTimeout(r2, 5000));
  }
  throw new Error(`job ${jobId} não terminou no tempo limite`);
}

for (let n = 0; n < lotes.length; n++) {
  const destino = join(resolve(SAIDA), `clone-lote-${String(n + 1).padStart(2, "0")}.json`);
  const pastaApp = join(resolve(SAIDA), `app-lote-${String(n + 1).padStart(2, "0")}`);
  // ⚠️ Retomada exige o PAR completo: o JSON sem a pasta é lote perdido (os
  // assets moravam na API da sessão que morreu) — refaz do zero.
  if (existsSync(destino) && existsSync(join(pastaApp, "package.json"))) {
    console.log(`\nlote ${n + 1}/${lotes.length}: já existe (json + app) — pulando`);
    continue;
  }
  const rotasDoLote = lotes[n];
  console.log(`\nlote ${n + 1}/${lotes.length}: ${rotasDoLote.length} rotas (${rotasDoLote[0]} … ${rotasDoLote[rotasDoLote.length - 1]})`);

  let tentativa = 0;
  const MAX_TENTATIVAS = 3;
  tentar: while (true) {
    tentativa++;
  const minha = await subirApi();
  try {
    console.log("  passo 1/2 — clone single");
    const single = await chamar("/v1/clones", { url: SITE, options: { mode: "single" } });
    console.log(`  jobId single: ${single.jobId}`);
    await esperarJob(single.jobId, "single");

    const plano = {
      version: "ion-clone-plan-v1",
      entryRoute: entrada,
      staticRoutes: rotasDoLote,
      manifests: [],
      renderers: [],
      dispositions: rotasDoLote.map((path) => ({ path, kind: "static" })),
    };

    console.log(`  passo 2/2 — clone multi do lote`);
    const completo = await chamar("/v1/clones", {
      url: SITE,
      options: {
        mode: "multi",
        framework: "next",
        experimentalContentHandoff: "ion-cms-v1",
        experimentalReuseCaptureJobId: single.jobId,
        experimentalClonePlan: plano,
      },
    });
    console.log(`  jobId multi: ${completo.jobId}`);
    await esperarJob(completo.jobId, "multi");

    const rRes = await fetch(`${API}/v1/clones/${completo.jobId}/result`);
    if (!rRes.ok) throw new Error(`não consegui ler o resultado: HTTP ${rRes.status}`);
    const resultado = await rRes.json();
    writeFileSync(destino, JSON.stringify(resultado, null, 2), "utf8");

    const arquivos = resultado.files ? Object.keys(resultado.files) : [];
    const paginas = arquivos.filter((p) => /(^|\/)page\.tsx$/.test(p));
    console.log(`  lote ${n + 1} salvo: ${arquivos.length} arquivos, ${paginas.length} páginas -> ${destino}`);

    // 🚨 unpack DENTRO da sessão — assets relativos só existem enquanto a API vive
    console.log(`  unpack -> ${pastaApp}`);
    execSync(`npm run unpack -- "${destino}" "${pastaApp}"`, {
      cwd: DITTO,
      env: { ...process.env, DITTO_API_URL: API },
      stdio: ["ignore", "pipe", "pipe"],
    });
    console.log(`  lote ${n + 1} desempacotado`);
    break tentar;
  } catch (e) {
    console.log(`  ⚠️ lote ${n + 1}, tentativa ${tentativa}/${MAX_TENTATIVAS} falhou: ${String(e.message).slice(0, 200)}`);
    // JSON sem app é lote perdido (assets morreram com a sessão) — limpar e refazer
    try { rmSync(destino, { force: true }); } catch { /* segue */ }
    try { rmSync(pastaApp, { recursive: true, force: true }); } catch { /* segue */ }
    if (tentativa >= MAX_TENTATIVAS) throw e;
    await new Promise((r) => setTimeout(r, 15000));
  } finally {
    // memória zerada entre lotes — é o motivo deste script existir
    if (minha) derrubarApi();
  }
  }
}

console.log(`\ntodos os lotes prontos em ${resolve(SAIDA)}`);
console.log(`juntar com o desempacota-lotes.mjs`);
