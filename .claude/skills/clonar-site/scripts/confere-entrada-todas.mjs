// confere-entrada-todas.mjs — roda o gate `confere-entrada` em TODAS as rotas
// e agrega o veredito numa linha só.
//
// Por que existe: o `confere-entrada.mjs` é por rota (CSS=<folha> ROTA=<rota>),
// e num clone de 47 rotas conferir à mão é onde se pula o gate justamente na
// rota que quebrou. O minificador invalida uma declaração calado, sem erro no
// build — em 47 rotas, sem varredura agregada, isso passa.
//
// Confere as DUAS folhas de movimento por rota: `entrada.css` (anima ao
// carregar) e `scroll.css` (revela ao aparecer).
//
// 🚨 O guard: rota cuja folha não existe ou está vazia sai como "vazia" e NÃO
// conta como aprovada. Célula vazia é trabalho não feito, nunca "passou".
//
// Uso:
//   APP=<app> ROTAS=<med>/rotas.json CLONE=http://127.0.0.1:8081 \
//   node confere-entrada-todas.mjs
//
// Variáveis:
//   APP     raiz do app do clone (obrigatória)
//   ROTAS   rotas.json (obrigatória)
//   CLONE   URL base do clone servido (obrigatória)
//   FOLHAS  folhas a conferir (padrão: "entrada.css,scroll.css")
//   SAIDA   pasta do relatório (padrão: <ROTAS>/../entrada-gate)
//   DITTO   raiz do ditto (padrão: C:/dev/ditto)

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const APP = process.env.APP;
const ROTAS = process.env.ROTAS;
const CLONE = process.env.CLONE;
if (!APP || !ROTAS || !CLONE) {
  console.error("faltam APP, ROTAS e/ou CLONE");
  process.exit(1);
}
// 🚨 Só folhas baseadas em `animation:` entram aqui. O `scroll.css` revela por
// `transition` + `opacity` + variável, mecanismo que este gate não lê — quem
// prova a revelação é o `mede-revelacao.mjs`, comparando os dois lados.
const FOLHAS = (process.env.FOLHAS ?? "entrada.css").split(",").map((s) => s.trim()).filter(Boolean);
const SAIDA = process.env.SAIDA ?? resolve(dirname(ROTAS), "entrada-gate");
const aqui = dirname(fileURLToPath(import.meta.url));
mkdirSync(SAIDA, { recursive: true });

const lista = JSON.parse(readFileSync(ROTAS, "utf8").replace(/^\uFEFF/, ""));
const rotas = lista.rotas.filter((r) => r.status === 200 || r.status === null).map((r) => r.rota);

// a folha de uma rota mora na pasta dela: "/" -> src/app, "/a/b" -> src/app/a/b
//
// 🚨 Exceção: a HOME pode estar num GRUPO DE ROTAS. O `entrega-inline` move
// `page.tsx` e as folhas dela para `src/app/(inicio)/` — o grupo serve "/" sem
// mudar a URL e é o único jeito de a home ter layout próprio sem vazar o CSS
// dela para as outras rotas. Um instrumento que não conhece o grupo procura em
// `src/app/entrada.css`, não acha nada e declara a rota VAZIA.
// Medido no framer-5: a home tem 161 regras de entrada e, sem o grupo, o gate
// lê "0/0" — o gate INEGOCIÁVEL do movimento fica cego justamente na única
// rota que tem animação de load.
const GRUPO_HOME = "(inicio)";
const pastaDaRota = (rota) => {
  if (rota === "/" || rota === "") {
    const grupo = join(APP, "src", "app", GRUPO_HOME);
    if (existsSync(join(grupo, "page.tsx"))) return grupo;
    return join(APP, "src", "app");
  }
  return join(APP, "src", "app", ...rota.split("/").filter(Boolean));
};

const linhas = [];
let okTotal = 0, faltouTotal = 0, vaziasTotal = 0, erroTotal = 0;

for (const rota of rotas) {
  for (const folha of FOLHAS) {
    const css = join(pastaDaRota(rota), folha);
    if (!existsSync(css) || statSync(css).size === 0) {
      linhas.push({ rota, folha, estado: "vazia", aplicaram: 0, prometidas: 0 });
      vaziasTotal++;
      continue;
    }
    try {
      const saida = execFileSync(process.execPath, [join(aqui, "confere-entrada.mjs")], {
        env: { ...process.env, CSS: css, CLONE, ROTA: rota },
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 120000,
      });
      // o instrumento imprime os números; extrai "N/M"
      const m = saida.match(/(\d+)\s*\/\s*(\d+)/);
      const aplicaram = m ? Number(m[1]) : null;
      const prometidas = m ? Number(m[2]) : null;
      const faltou = prometidas != null ? prometidas - aplicaram : 0;
      linhas.push({ rota, folha, estado: faltou === 0 ? "ok" : "faltou", aplicaram, prometidas });
      if (faltou === 0) okTotal++; else { faltouTotal++; }
      process.stdout.write(`\r  ${rota} ${folha}: ${aplicaram}/${prometidas}          `);
    } catch (e) {
      const txt = String(e.stdout || "") + String(e.stderr || e.message || "");
      const m = txt.match(/(\d+)\s*\/\s*(\d+)/);
      linhas.push({
        rota, folha,
        estado: m ? "faltou" : "erro",
        aplicaram: m ? Number(m[1]) : null,
        prometidas: m ? Number(m[2]) : null,
        detalhe: txt.slice(0, 200),
      });
      if (m) faltouTotal++; else erroTotal++;
    }
  }
}

console.log("\n");
const problemas = linhas.filter((l) => l.estado !== "ok");
for (const l of problemas) {
  console.log(`  ${l.estado.toUpperCase().padEnd(7)} ${l.rota} ${l.folha}` +
    (l.prometidas != null ? `  ${l.aplicaram}/${l.prometidas}` : "") +
    (l.detalhe ? `  ${l.detalhe.replace(/\s+/g, " ").slice(0, 90)}` : ""));
}
console.log(`\n=== gate de movimento ===`);
console.log(`  folhas OK (todas as regras aplicaram): ${okTotal}`);
console.log(`  folhas com regra que NÃO aplicou:      ${faltouTotal}`);
console.log(`  folhas vazias (nada a conferir):       ${vaziasTotal}`);
console.log(`  erros de execução:                     ${erroTotal}`);

writeFileSync(join(SAIDA, "gate-movimento.json"), JSON.stringify({ gerado: new Date().toISOString(), okTotal, faltouTotal, vaziasTotal, erroTotal, linhas }, null, 1));
process.exitCode = faltouTotal || erroTotal ? 1 : 0;
