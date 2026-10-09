// aplica-tipografia-classe.mjs — entrega a tipografia medida COMO CLASSE do
// Tailwind, elemento a elemento.
//
// 🚨 Por que não basta o corrige-tipografia.mjs neste build: `font-size` e
// `line-height` disputam com utilitárias do Tailwind (`text-*`, `leading-*`),
// e regra CSS que disputa com utilitária não entra na cascata aqui — o mesmo
// fenômeno documentado em armadilhas.md para `height`. Medido no framer-4: o
// corrige-tipografia escreveu 699 regras em /expertise e a divergência caiu de
// 325 para 300. Praticamente nada aplicou.
//
// O defeito de origem é o arredondamento do ditto: o original tem
// `line-height: 31.2px` e o clone nasce com `31px`. Meio ponto por linha não
// se vê, mas ele ACUMULA: num artigo, 0,2px por linha viram 34px de deriva
// entre o topo e o fim do texto, e o compara-geometria acusa uma dúzia de
// parágrafos "fora do lugar" sem que nenhum deles seja o culpado.
//
// Medido numa página de artigo: 285 elementos divergentes e apenas 10
// combinações distintas de (tamanho, altura de linha) — o defeito é repetitivo,
// não caótico.
//
// O método:
//   1. lê o tipografia.json do mede-tipografia.mjs (que já mede em várias
//      larguras e só marca o que TRAVA, nunca o que é fluido);
//   2. para cada elemento divergente com data-cid, acrescenta ao className
//      `lg:leading-[<valor original>px]` e, quando o tamanho também diverge,
//      `lg:text-[<valor original>px]`;
//   3. `lg:` porque a medição de referência é 1280px — abaixo de 1024 a
//      captura mobile já estava certa (medido: 84 divergências em 375px contra
//      285 em 1280px).
//
// O que o faz SE CALAR:
//   - elemento sem data-cid                 -> declara, não escreve
//   - className+data-cid não achado no JSX  -> declara, não escreve
//   - a classe já está lá                   -> pula (idempotente)
//   - divergência abaixo de TOL             -> não escreve
//
// Uso:
//   APP=<app> MED=<medicoes>/tipografia.json node aplica-tipografia-classe.mjs
//   ROTA=/x  (opcional: só uma rota do relatório)   ESCREVER=0 simula

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const APP = process.env.APP;
const MED = process.env.MED;
if (!APP || !MED) {
  console.error("faltam APP=<pasta do app> e MED=<caminho do tipografia.json>");
  process.exit(1);
}
const LARGURA = process.env.LARGURA ?? "1280";
const TOL = Number(process.env.TOL ?? 0.05);
const ESCREVER = process.env.ESCREVER !== "0";
const FAIXA = process.env.FAIXA ?? "lg";
const SO_ROTA = process.env.ROTA ?? null;

function pastaDaRota(rota) {
  if (rota !== "/") return join(APP, "src/app", rota.replace(/^\//, ""));
  const grupo = join(APP, "src/app", "(inicio)");
  return existsSync(join(grupo, "page.tsx")) ? grupo : join(APP, "src/app");
}

const num = (v) => Math.round(Number(v) * 1000) / 1000;

const relatorio = JSON.parse(readFileSync(MED, "utf8")).relatorio ?? [];
let total = 0;
const declaradas = [];

for (const r of relatorio) {
  if (SO_ROTA && r.rota !== SO_ROTA) continue;
  const faixa = r.porLargura?.[LARGURA];
  if (!faixa?.divergem?.length) continue;

  const pagePath = join(pastaDaRota(r.rota), "page.tsx");
  if (!existsSync(pagePath)) {
    declaradas.push({ rota: r.rota, motivo: "page.tsx não achado" });
    continue;
  }
  let jsx = readFileSync(pagePath, "utf8");
  let escritas = 0;
  const semCid = [];
  const semClasse = [];

  for (const d of faixa.divergem) {
    if (!d.cid) {
      semCid.push(d.texto?.slice(0, 20));
      continue;
    }
    const classes = [];
    if (Math.abs(num(d.lhOriginal) - num(d.lhClone)) > TOL) classes.push(`${FAIXA}:leading-[${num(d.lhOriginal)}px]`);
    if (Math.abs(num(d.fsOriginal) - num(d.fsClone)) > TOL) classes.push(`${FAIXA}:text-[${num(d.fsOriginal)}px]`);
    if (!classes.length) continue;

    const alvo = new RegExp(`className="([^"]*)"([^>]*?)data-cid="${d.cid}"`);
    const m = jsx.match(alvo);
    if (!m) {
      semClasse.push(d.cid);
      continue;
    }
    const faltando = classes.filter((c) => !m[1].includes(c));
    if (!faltando.length) continue;
    jsx = jsx.replace(m[0], m[0].replace(`className="${m[1]}"`, `className="${faltando.join(" ")} ${m[1]}"`));
    escritas++;
  }

  if (escritas && ESCREVER) writeFileSync(pagePath, jsx, "utf8");
  console.log(`${escritas ? "✅" : "•"} ${r.rota}: ${escritas} elemento(s) com tipografia por classe`);
  if (semCid.length) declaradas.push({ rota: r.rota, motivo: `${semCid.length} elemento(s) sem data-cid` });
  if (semClasse.length) declaradas.push({ rota: r.rota, motivo: `${semClasse.length} sem className+data-cid no JSX (ex.: ${semClasse.slice(0, 3).join(", ")})` });
  total += escritas;
}

console.log(`\n${"=".repeat(70)}`);
console.log(`TOTAL: ${total} elemento(s) ajustado(s)${ESCREVER ? "" : " (simulado)"}`);
if (declaradas.length) {
  console.log(`\n⚠️ ${declaradas.length} declaração(ões):`);
  for (const d of declaradas.slice(0, 20)) console.log(`   ${d.rota}: ${d.motivo}`);
}
console.log("🚨 rebuildar.");
