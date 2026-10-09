// propaga-comportamento.mjs — roda a reconstrução em TODAS as rotas.
//
// 🚨 A ORDEM E O NÚMERO DE BUILDS NÃO SÃO DETALHE.
//
// Cada instrumento mede o clone SERVIDO. Se a rota ainda não foi buildada com
// a camada anterior, o instrumento mede o estado velho e conclui errado. Mas
// buildar depois de cada rota custa ~15s × 20 rotas × 2 fases = 10 minutos só
// de build.
//
// A saída é fazer em PASSADAS, não rota a rota:
//
//   FASE 1 — scroll + entrada em todas as rotas   → 1 build
//   FASE 2 — geometria estática em todas as rotas → 1 build
//   FASE 3 — medir todas as rotas
//
// Funciona porque scroll e entrada só dependem do clone CRU (o que a captura
// entregou), e a geometria estática depende do clone COM comportamento. Duas
// dependências, duas passadas, dois builds.
//
// ⚠️ Salva progresso a cada rota: interromper não custa o trabalho inteiro.
// Rodar de novo pula o que já foi feito, a menos que REFAZER=1.
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 \
//   APP=<app> ROTAS=<med>/rotas.json MED=<med> FASE=1 node propaga-comportamento.mjs
//
// Variáveis:
//   FASE      1 (scroll+entrada), 2 (geometria) ou "tudo"
//   SO        lista de rotas separadas por vírgula, para rodar um subconjunto
//   PULAR     lista de rotas a pular (padrão: nenhuma)
//   REFAZER   1 ignora o progresso salvo

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const ORIGINAL = process.env.ORIGINAL;
const CLONE = process.env.CLONE;
const APP = process.env.APP;
const MED = resolve(process.env.MED ?? "./medicoes");
if (!ORIGINAL || !CLONE || !APP) {
  console.error("faltam ORIGINAL, CLONE e/ou APP");
  process.exit(1);
}
const FASE = String(process.env.FASE ?? "1");
const REFAZER = process.env.REFAZER === "1";
const LARGURA = process.env.LARGURA ?? "1280";
mkdirSync(MED, { recursive: true });

function carregarRotas() {
  const r = process.env.ROTAS;
  if (!r) return ["/"];
  if (existsSync(r) && statSync(r).isFile()) {
    const j = JSON.parse(readFileSync(r, "utf8"));
    return j.rotas.filter((x) => x.status === 200 || x.status === null).map((x) => x.rota);
  }
  return r.split(",").map((s) => s.trim()).filter(Boolean);
}

const SO = (process.env.SO ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const PULAR = new Set((process.env.PULAR ?? "").split(",").map((s) => s.trim()).filter(Boolean));
let rotas = carregarRotas().filter((r) => !PULAR.has(r));
if (SO.length) rotas = rotas.filter((r) => SO.includes(r));

const arqProgresso = join(MED, `progresso-fase${FASE}.json`);
let feito = {};
if (!REFAZER && existsSync(arqProgresso)) {
  try {
    feito = JSON.parse(readFileSync(arqProgresso, "utf8"));
  } catch {
    feito = {};
  }
}

const nomeRota = (r) => (r === "/" ? "home" : r.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, ""));

function rodar(script, env, rotulo) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [join(AQUI, script)], {
    env: { ...process.env, ...env },
    encoding: "utf8",
    timeout: 15 * 60 * 1000,
  });
  const seg = Math.round((Date.now() - t0) / 1000);
  const saida = (r.stdout ?? "") + (r.stderr ?? "");
  const ok = r.status === 0;
  const resumo = saida.split("\n").filter((l) => /✅|⚠️|🚨|casad|escrit|aplicaram|→/.test(l)).slice(-4);
  console.log(`      ${ok ? "✓" : "✗"} ${rotulo} (${seg}s)${ok ? "" : ` status=${r.status}`}`);
  for (const l of resumo) console.log(`         ${l.trim().slice(0, 120)}`);
  return { ok, status: r.status, seg, saida };
}

console.log(`\n${"═".repeat(70)}`);
console.log(`FASE ${FASE} — ${rotas.length} rota(s)`);
console.log(`${"═".repeat(70)}`);

const base = { ORIGINAL, CLONE, APP, LARGURA, DITTO: process.env.DITTO ?? "C:/dev/ditto" };
let i = 0;
for (const rota of rotas) {
  i++;
  const chave = nomeRota(rota);
  if (feito[chave]?.ok) {
    console.log(`\n[${i}/${rotas.length}] ${rota} — já feito, pulando (REFAZER=1 força)`);
    continue;
  }
  console.log(`\n[${i}/${rotas.length}] ${rota}`);
  const passos = {};

  if (FASE === "1" || FASE === "tudo") {
    passos.scroll = rodar(
      "gera-scroll.mjs",
      { ...base, ROTA: rota, SAIDA: join(MED, "scroll-todas"), ESCREVER: "1" },
      "scroll"
    );
    const movDir = join(MED, "mov-orig", chave);
    passos.movimento = rodar(
      "inventario-movimento.mjs",
      { ...base, SITE: new URL(rota, ORIGINAL).href, SAIDA: movDir },
      "inventário de movimento"
    );
    if (passos.movimento.ok) {
      passos.entrada = rodar(
        "gera-entrada.mjs",
        { ...base, ROTA: rota, MOV: join(movDir, "movimento.json") },
        "entrada"
      );
    }
  }

  if (FASE === "2" || FASE === "tudo") {
    passos.geometria = rodar(
      "corrige-geometria.mjs",
      { ...base, ROTA: rota, SAIDA: join(MED, "geo-estatica"), ESCREVER: "1", TOL: "4" },
      "geometria estática"
    );
  }

  if (FASE === "3" || FASE === "tudo") {
    // 🚨 Hover e acordeão custam caro: exigem medir INTERAÇÃO no original,
    // alvo por alvo, com evento real de navegador. Por isso são fase própria —
    // quem só quer o visual fechado não paga por elas.
    const dirInt = join(MED, "interacao-orig", chave);
    // ⚠️ SITE é a BASE e ROTA é o caminho: o instrumento faz `new URL(ROTA,
    // SITE)`. Passar a URL já completa em SITE e a rota de novo em ROTA mede
    // a home achando que mediu a rota.
    passos.medeInteracao = rodar(
      "mede-interacao.mjs",
      { ...base, SITE: ORIGINAL, ROTA: rota, SAIDA: dirInt },
      "medir interação no original"
    );
    const arqInt = join(dirInt, "interacao.json");
    if (passos.medeInteracao.ok && existsSync(arqInt)) {
      passos.hover = rodar("gera-interacao.mjs", { ...base, ROTA: rota, MED: arqInt, TOL: "40" }, "hover");
      passos.acordeao = rodar("gera-acordeao.mjs", { ...base, ROTA: rota, MED: arqInt }, "acordeão");
    }
  }

  // 🚨 "ok" aqui é "rodou sem estourar", NÃO "ficou idêntico". Quem diz se
  // ficou idêntico é a fase 3, medindo. Confundir os dois reporta sucesso
  // com metade das rotas fora do lugar.
  const falhou = Object.entries(passos).filter(([, v]) => v && !v.ok);
  feito[chave] = {
    rota,
    ok: falhou.length === 0,
    quandoSeg: Object.values(passos).reduce((s, v) => s + (v?.seg ?? 0), 0),
    falhas: falhou.map(([k, v]) => `${k}: status ${v.status}`),
  };
  writeFileSync(arqProgresso, JSON.stringify(feito, null, 2), "utf8");
}

const okN = Object.values(feito).filter((v) => v.ok).length;
const total = Object.keys(feito).length;
console.log(`\n${"═".repeat(70)}`);
console.log(`FASE ${FASE} terminada: ${okN}/${total} rotas sem erro de execução`);
for (const [k, v] of Object.entries(feito)) {
  if (!v.ok) console.log(`   ✗ ${v.rota}: ${v.falhas.join(", ")}`);
}
console.log(`\n🚨 "sem erro de execução" NÃO é "idêntico". Buildar e medir agora:`);
console.log(`   npm run build && node compara-geometria.mjs (com ROTAS=)`);
console.log(`progresso: ${arqProgresso}`);
