// checkup.mjs — a matriz: uma linha por rota, uma coluna por dimensão.
//
// 🚨 CÉLULA VAZIA É TRABALHO NÃO FEITO, NUNCA "PASSOU".
//
// Este instrumento não mede nada por conta própria: ele CHAMA os instrumentos
// que medem e junta o resultado. É de propósito — número que aparece aqui é o
// mesmo que aparece lá, e não há uma segunda implementação para divergir da
// primeira.
//
// O que ele decide é só uma coisa, e é a que importa: **o que não foi medido
// sai como pendência**, não como aprovação. O silêncio de um relatório faz o
// modo padrão do ditto parecer completo entregando 8 de 21 rotas.
//
// ── As decisões, e por quê ──────────────────────────────────────────────────
//
// 1) 🚨 PENDENTE NUNCA É MUDO. Todo subprocesso registra status e motivo, e o
//    motivo é IMPRESSO: subprocesso morto por timeout, guard disparado e crash
//    de evaluate não podem virar só "— PENDENTE". Medido no framer-6: 94
//    células PENDENTES de geometria com o `geometria.json` completo no disco,
//    ao lado, medido por fora. Pendência que não sabe explicar por que é
//    pendência manda consertar o instrumento errado.
//
// 2) INGESTÃO. Medição de geometria de 47 rotas não cabe nos 15 min do
//    `spawnSync`, e re-medir o que já foi medido há 10 minutos faz a matriz
//    nunca fechar. Com `REUSAR=1` o checkup INGERE os artefatos que já
//    existem na pasta dele; com `GEO_JSON=`/`COB_JSON=`/`CONT_JSON=` ingere de
//    onde você apontar. Ele é o renderizador da matriz sobre artefatos, com os
//    medidores pesados rodando por fora quando convém.
//
// 3) DIMENSÕES 5 E 7 ESTÃO NA MATRIZ (`mede-interacao.mjs`,
//    `mede-navegacao.mjs`). Dimensão de fora da matriz é dimensão que ninguém
//    cobra.
//
// 4) d6 usa `confere-entrada-todas.mjs`: uma chamada para todas as rotas, no
//    lugar de 47 `spawnSync` do `confere-entrada.mjs`.
//
// ── Representantes: por que 5 e 7 não rodam em toda rota ────────────────────
// Interação e navegação se medem por TEMPLATE, não por rota: as 9 rotas de
// /blog/* são o mesmo template com outro texto, e medi-las uma a uma custa
// horas para repetir o mesmo número. A família de uma rota com 2+ segmentos é
// o primeiro segmento (`/blog/*`); rota de 1 segmento é o próprio template. O
// primeiro membro de cada família é o REPRESENTANTE, e é nele que se mede.
// 🚨 O membro não medido NÃO sai como pendência nem como aprovação: sai como
// `≡ <representante>` — que é a verdade (a prova é a do template), e é
// auditável, porque diz de quem ela veio.
//
// Uso:
//   ORIGINAL=https://site.com CLONE=http://127.0.0.1:8081 APP=<app> \
//   ROTAS=<med>/rotas.json MED=<med> node checkup.mjs
//
// Variáveis:
//   LARGURA   viewport (padrão 1280)
//   TOL       px de tolerância de geometria (padrão 4)
//   SO        subconjunto de rotas, separado por vírgula
//   REUSAR    1 ingere os artefatos que já existirem em <MED>/checkup/
//   GEO_JSON  geometria.json a ingerir (vence REUSAR)
//   COB_JSON  cobertura.json a ingerir
//   CONT_JSON conteudo.json a ingerir
//   PULAR     dimensões a não medir, ex "d5,d7" — saem PENDENTES, de propósito
//   SALTOS    saltos de navegação por representante (padrão 3)
//   MAX_INT   alvos de interação por rota (padrão 40)
//   MINUTOS   timeout de cada subprocesso (padrão 15)

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// 🚨 A rota vem PERCENT-ENCODED (é assim que ela existe no original), mas a
// pasta no disco tem o caractere literal. Sem decodificar, toda rota com
// acento ou unicode aponta para pasta inexistente. Medido no framer-7:
// /blog/...director%E2%80%99s-... derrubou dois instrumentos em silêncio.
const decodificarSegmento = (s) => {
  try { return decodeURIComponent(s); } catch { return s; }
};


const AQUI = dirname(fileURLToPath(import.meta.url));
const ORIGINAL = process.env.ORIGINAL;
const CLONE = process.env.CLONE;
const APP = process.env.APP;
if (!ORIGINAL || !CLONE || !APP) {
  console.error("faltam ORIGINAL, CLONE e/ou APP");
  process.exit(1);
}
const MED = resolve(process.env.MED ?? "./medicoes");
const LARGURA = process.env.LARGURA ?? "1280";
const TOL = process.env.TOL ?? "4";
const REUSAR = process.env.REUSAR === "1";
const PULAR = (process.env.PULAR ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const SALTOS = process.env.SALTOS ?? "3";
const MAX_INT = process.env.MAX_INT ?? "40";
const MINUTOS = Number(process.env.MINUTOS ?? 15);
const SAIDA = join(MED, "checkup");
mkdirSync(SAIDA, { recursive: true });

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
let rotas = carregarRotas();
if (SO.length) rotas = rotas.filter((r) => SO.includes(r));

const nomeRota = (r) => (r === "/" ? "home" : r.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, ""));

// ── família e representante (ver cabeçalho) ─────────────────────────────────
const familia = (rota) => {
  const segs = rota.split("/").filter(Boolean);
  return segs.length >= 2 ? `/${segs[0]}/*` : rota;
};
const representantes = new Map();
for (const r of rotas) {
  const f = familia(r);
  if (!representantes.has(f)) representantes.set(f, r);
}
const ehRepresentante = (r) => representantes.get(familia(r)) === r;
const meuRepresentante = (r) => representantes.get(familia(r));

// ── execução de subprocesso, com o motivo preservado ────────────────────────
const problemas = [];
function rodar(script, env, rotulo) {
  const r = spawnSync(process.execPath, [join(AQUI, script)], {
    env: { ...process.env, ...env },
    encoding: "utf8",
    timeout: MINUTOS * 60 * 1000,
  });
  const saida = (r.stdout ?? "") + (r.stderr ?? "");
  // 🚨 `signal` preenchido = morto pelo timeout. `status` não-zero = guard ou
  // crash. Os dois viram motivo escrito, nunca silêncio.
  let motivo = null;
  if (r.error) motivo = `${r.error.code ?? r.error.name}: ${r.error.message}`.slice(0, 200);
  else if (r.signal) motivo = `morto por ${r.signal} (timeout de ${MINUTOS} min)`;
  else if (r.status !== 0) motivo = `saiu com status ${r.status}`;
  if (motivo) problemas.push({ etapa: rotulo ?? script, motivo, cauda: saida.trim().split("\n").slice(-4).join(" | ").slice(0, 300) });
  return { status: r.status, signal: r.signal, saida, motivo };
}

// Lê um JSON e explica a falha em vez de engolir. Devolve `{json, motivo}`.
function ler(caminho, rotulo) {
  try {
    return { json: JSON.parse(readFileSync(caminho, "utf8").replace(/^\uFEFF/, "")), motivo: null };
  } catch (e) {
    const motivo = existsSync(caminho) ? `JSON ilegível: ${String(e.message).slice(0, 120)}` : "arquivo não foi escrito";
    problemas.push({ etapa: rotulo, motivo, cauda: caminho });
    return { json: null, motivo };
  }
}

// Ingere de ENV, ou de <SAIDA> quando REUSAR=1, senão manda medir.
function obter({ env, arquivo, script, envScript, rotulo }) {
  const apontado = process.env[env];
  if (apontado) {
    console.log(`   ↩︎ ingerindo ${rotulo} de ${apontado}`);
    return ler(apontado, rotulo).json;
  }
  if (REUSAR && existsSync(arquivo)) {
    console.log(`   ↩︎ REUSAR: ingerindo ${rotulo} de ${arquivo} (${statSync(arquivo).mtime.toISOString()})`);
    return ler(arquivo, rotulo).json;
  }
  rodar(script, envScript, rotulo);
  return ler(arquivo, rotulo).json;
}

const base = { ORIGINAL, CLONE, APP, LARGURA, DITTO: process.env.DITTO ?? "C:/dev/ditto" };

// ── 1 e 2: cobertura e metadata, uma vez para todas as rotas ────────────────
console.log(`\n📋 dimensões 1 e 2 — cobertura e metadata (${rotas.length} rotas)`);
const cobJson = obter({
  env: "COB_JSON",
  arquivo: join(SAIDA, "cobertura", "cobertura.json"),
  script: "bateria-cobertura.mjs",
  envScript: { ...base, ROTAS: process.env.ROTAS, SAIDA: join(SAIDA, "cobertura"), SHOTS: "0" },
  rotulo: "cobertura",
});

// ── 3: geometria, elemento a elemento, todas as rotas ───────────────────────
console.log(`📐 dimensão 3 — geometria elemento a elemento`);
const geoJson = obter({
  env: "GEO_JSON",
  arquivo: join(SAIDA, "geometria", "geometria.json"),
  script: "compara-geometria.mjs",
  envScript: { ...base, ROTAS: process.env.ROTAS, TOL, TOPO: "0", SHOTS: "0", SAIDA: join(SAIDA, "geometria") },
  rotulo: "geometria",
});
if (geoJson?.parcial) {
  problemas.push({ etapa: "geometria", motivo: `medição PARCIAL: ${geoJson.rotasMedidas} de ${geoJson.rotasPedidas} rotas`, cauda: "as rotas não medidas saem PENDENTES" });
}

// ── 4: conteúdo ─────────────────────────────────────────────────────────────
console.log(`📝 dimensão 4 — conteúdo`);
const contJson = obter({
  env: "CONT_JSON",
  arquivo: join(SAIDA, "conteudo", "conteudo.json"),
  script: "compara-conteudo.mjs",
  envScript: { ...base, ROTAS: process.env.ROTAS, SAIDA: join(SAIDA, "conteudo") },
  rotulo: "conteudo",
});

// ── 5: interação, nos representantes, nos DOIS lados ────────────────────────
// A pergunta é de PARIDADE: o alvo que responde no original responde no clone?
// Contagem de alvo que responde a hover, a clique, e que revela conteúdo.
const interPorRota = {};
if (PULAR.includes("d5")) {
  console.log(`🖱️  dimensão 5 — PULADA por PULAR=d5 (sai pendente, de propósito)`);
} else {
  console.log(`🖱️  dimensão 5 — interação nos ${representantes.size} representantes (2 lados)`);
  for (const rota of representantes.values()) {
    const pasta = join(SAIDA, "interacao", nomeRota(rota));
    const lados = {};
    for (const [lado, site] of [["original", ORIGINAL], ["clone", CLONE]]) {
      const arq = join(pasta, lado, "interacao.json");
      if (REUSAR && existsSync(arq)) { lados[lado] = ler(arq, `interacao ${lado} ${rota}`).json; continue; }
      rodar("mede-interacao.mjs", { ...base, SITE: site, ROTA: rota, MAX: MAX_INT, SAIDA: join(pasta, lado) }, `interacao ${lado} ${rota}`);
      lados[lado] = ler(arq, `interacao ${lado} ${rota}`).json;
    }
    const conta = (j) => {
      if (!j?.medidos) return null;
      const m = j.medidos;
      return {
        alvos: m.length,
        hover: m.filter((x) => Object.keys(x.hover ?? {}).length > 0).length,
        clique: m.filter((x) => Object.keys(x.clique?.mudanca ?? {}).length > 0).length,
        revela: m.filter((x) => x.clique?.revelouConteudo).length,
        mortos: m.filter((x) => x.morto).length,
        naoMedidos: m.filter((x) => x.pulado || x.erro).length,
      };
    };
    interPorRota[rota] = { original: conta(lados.original), clone: conta(lados.clone) };
    process.stdout.write(`\r   ${rota} medida                              `);
  }
  console.log("");
}

// ── 6: movimento — o gate de entrada, todas as rotas de uma vez ─────────────
console.log(`🎞️  dimensão 6 — animação de entrada aplicada no build`);
const entradaPorRota = {};
{
  const arq = join(SAIDA, "entrada", "gate-movimento.json");
  let gate = null;
  if (REUSAR && existsSync(arq)) gate = ler(arq, "gate de entrada").json;
  else {
    rodar("confere-entrada-todas.mjs", { ...base, ROTAS: process.env.ROTAS, SAIDA: join(SAIDA, "entrada") }, "gate de entrada");
    gate = ler(arq, "gate de entrada").json;
  }
  for (const rota of rotas) {
    const l = (gate?.linhas ?? []).find((x) => x.rota === rota && x.folha === "entrada.css");
    if (!l) {
      // Fallback honesto: o cabeçalho do próprio CSS carrega os dois números.
      const dirRota = rota === "/" ? join(APP, "src", "app") : join(APP, "src", "app", ...rota.split("/").filter(Boolean).map(decodificarSegmento));
      const css = join(dirRota, "entrada.css");
      if (!existsSync(css)) { entradaPorRota[rota] = { promete: 0, aplicou: 0, nota: "sem entrada.css" }; continue; }
      const cabec = readFileSync(css, "utf8").match(/(\d+)\s+elementos medidos,\s*(\d+)\s+escritos/);
      entradaPorRota[rota] = cabec ? { aplicou: 0, promete: 0, nota: `0 de ${cabec[1]} casaram` } : { promete: null, aplicou: null, nota: "não consegui ler o gate" };
      continue;
    }
    if (l.estado === "vazia") { entradaPorRota[rota] = { promete: 0, aplicou: 0, nota: "folha vazia" }; continue; }
    if (l.estado === "erro") { entradaPorRota[rota] = { promete: null, aplicou: null, nota: "erro no gate" }; continue; }
    entradaPorRota[rota] = { aplicou: l.aplicaram, promete: l.prometidas };
  }
}

// ── 7: navegação client-side, a partir de cada representante ────────────────
// Só no CLONE, de propósito: o contrato não é "igual ao original", é "não
// recarrega o documento E a camada de comportamento continua viva no 2º e no
// 3º salto". Runtime que morre na troca de rota é o defeito clássico daqui.
const navPorRota = {};
if (PULAR.includes("d7")) {
  console.log(`🧭 dimensão 7 — PULADA por PULAR=d7 (sai pendente, de propósito)`);
} else {
  console.log(`🧭 dimensão 7 — navegação client-side a partir dos ${representantes.size} representantes`);
  for (const rota of representantes.values()) {
    const pasta = join(SAIDA, "navegacao", nomeRota(rota));
    const arq = join(pasta, "navegacao-clone.json");
    if (!(REUSAR && existsSync(arq))) {
      rodar("mede-navegacao.mjs", { ...base, SITE: CLONE, ROTA: rota, SALTOS, SAIDA: pasta }, `navegacao ${rota}`);
    }
    const j = ler(arq, `navegacao ${rota}`).json;
    if (!j?.saltos?.length) { navPorRota[rota] = null; continue; }
    const s = j.saltos;
    navPorRota[rota] = {
      saltos: s.length,
      chegou: s.filter((x) => x.chegou).length,
      clientSide: s.filter((x) => x.clientSide).length,
      // do 2º salto em diante é onde o runtime morre quando não é religado
      camadaViva: s.slice(1).every((x) => Object.values(x.camada?.runtimes ?? {}).some(Boolean)),
    };
    process.stdout.write(`\r   ${rota} medida                              `);
  }
  console.log("");
}

// ── montar a matriz ─────────────────────────────────────────────────────────
const acharRota = (lista, rota) => (lista ?? []).find((x) => x.rota === rota) ?? null;
const linhas = rotas.map((rota) => {
  const c = acharRota(cobJson?.linhas, rota);
  const g = acharRota(geoJson?.relatorio, rota);
  const t = acharRota(contJson?.linhas, rota);
  const e = entradaPorRota[rota];
  // ⚠️ Cada campo vira `null` quando NaO foi medido, e `null` imprime
  // "PENDENTE". Nunca 0, nunca "ok": zero medido e zero por falta de medicao
  // sao coisas diferentes, e confundi-las e exatamente como um relatorio
  // anterior fez metade das rotas parecerem aprovadas.
  const contOk =
    t && !t.erro
      ? t.textoFaltando.length + t.textoDivergente.length + t.imagensQuebradas + t.linksFaltando.length
      : null;

  // d5: no representante, o veredito de paridade; nos demais, de quem herdou.
  let d5 = null;
  if (ehRepresentante(rota)) {
    const p = interPorRota[rota];
    if (p?.original && p?.clone) {
      const o = p.original, k = p.clone;
      const bate = o.hover === k.hover && o.clique === k.clique && o.revela === k.revela;
      d5 = bate ? `ok ${k.hover}h/${k.clique}c` : `DIFF ${k.hover}/${o.hover}h ${k.clique}/${o.clique}c`;
    }
  } else {
    const rep = meuRepresentante(rota);
    // herda só se o representante REALMENTE fechou — herdar pendência é
    // espalhar pendência com cara de aprovação.
    const p = interPorRota[rep];
    if (p?.original && p?.clone) d5 = `≡ ${rep}`;
  }

  // d7: idem.
  let d7 = null;
  if (ehRepresentante(rota)) {
    const n = navPorRota[rota];
    if (n) d7 = n.chegou === n.saltos && n.clientSide === n.saltos && n.camadaViva ? `ok ${n.chegou}/${n.saltos}` : `DIFF ${n.chegou}/${n.saltos}cs${n.clientSide}${n.camadaViva ? "" : " camada✖"}`;
  } else {
    const rep = meuRepresentante(rota);
    if (navPorRota[rep]) d7 = `≡ ${rep}`;
  }

  return {
    rota,
    d1_responde: c && c.status != null ? String(c.status) : null,
    d2_titulo: c ? (c.tituloBate === true ? "ok" : c.tituloBate === false ? "DIFF" : null) : null,
    d3_foraDoLugar: g ? g.fora : null,
    d3_soNoOriginal: g ? g.soNoOriginal : null,
    d4_conteudo: contOk,
    d5_interacao: d5,
    d6_entrada: e && e.promete ? `${e.aplicou}/${e.promete}` : (e?.nota ?? null),
    d7_navegacao: d7,
  };
});

const cel = (v) => (v === null || v === undefined ? "— PENDENTE" : String(v));
console.log(`\n${"═".repeat(132)}`);
console.log(`CHECK-UP — ${rotas.length} rotas @${LARGURA}px · tolerância ${TOL}px · ${representantes.size} templates`);
console.log(`${"═".repeat(132)}`);
console.log(
  `${"rota".padEnd(44)} ${"1:resp".padStart(7)} ${"2:tít".padStart(6)} ${"3:fora".padStart(7)} ${"3:falta".padStart(8)} ${"4:cont".padStart(7)} ${"5:interação".padStart(18)} ${"6:entrada".padStart(10)} ${"7:nav".padStart(14)}`
);
console.log("─".repeat(132));
for (const l of linhas) {
  console.log(
    `${l.rota.slice(0, 44).padEnd(44)} ${cel(l.d1_responde).padStart(7)} ${cel(l.d2_titulo).padStart(6)} ${cel(l.d3_foraDoLugar).padStart(7)} ${cel(l.d3_soNoOriginal).padStart(8)} ${cel(l.d4_conteudo).padStart(7)} ${cel(l.d5_interacao).padStart(18)} ${cel(l.d6_entrada).padStart(10)} ${cel(l.d7_navegacao).padStart(14)}`
  );
}

const vazias = linhas.flatMap((l) =>
  Object.entries(l).filter(([k, v]) => k !== "rota" && (v === null || v === undefined)).map(([k]) => `${l.rota} ${k}`)
);
const fora = linhas.reduce((s, l) => s + (l.d3_foraDoLugar ?? 0), 0);
const diffs = linhas.filter((l) => String(l.d5_interacao ?? "").startsWith("DIFF") || String(l.d7_navegacao ?? "").startsWith("DIFF") || l.d2_titulo === "DIFF");
console.log("─".repeat(132));
console.log(`elementos fora do lugar, somados: ${fora}`);
console.log(`conteúdo divergente, somado:      ${linhas.reduce((s, l) => s + (l.d4_conteudo ?? 0), 0)}`);
console.log(`rotas com DIFF em 2, 5 ou 7:      ${diffs.length}`);
console.log(`células PENDENTES (não medidas):  ${vazias.length}`);
for (const v of vazias.slice(0, 20)) console.log(`   — ${v}`);
if (vazias.length > 20) console.log(`   ... e mais ${vazias.length - 20}`);

// 🚨 O motivo de cada pendência, escrito. Sem isto, o leitor conserta o
// instrumento errado — ou pior, conclui que a dimensão "não dá para medir".
if (problemas.length) {
  console.log(`\n🚨 ${problemas.length} etapa(s) com problema — é ISTO que explica as pendências acima:`);
  for (const p of problemas.slice(0, 25)) console.log(`   ✖ ${p.etapa}: ${p.motivo}\n     └ ${p.cauda}`);
  if (problemas.length > 25) console.log(`   ... e mais ${problemas.length - 25}`);
}

writeFileSync(
  join(SAIDA, "checkup.json"),
  JSON.stringify({ gerado: new Date().toISOString(), largura: LARGURA, tol: TOL, templates: [...representantes.entries()], linhas, pendentes: vazias, problemas, interacao: interPorRota, navegacao: navPorRota }, null, 2)
);
console.log(`\nsaída: ${join(SAIDA, "checkup.json")}`);
process.exit(vazias.length === 0 && fora === 0 && diffs.length === 0 ? 0 : 2);
