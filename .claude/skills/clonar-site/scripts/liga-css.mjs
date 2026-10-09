// liga-css.mjs — garante que cada rota IMPORTE as folhas da camada.
//
// 🚨 Escrever o CSS não o liga. O Next só inclui no bundle da rota o que a
// `page.tsx` daquela rota importa — arquivo solto na pasta não entra em lugar
// nenhum, e a camada some sem erro nenhum em lugar nenhum.
//
// ⚠️ E o import só pode existir se o arquivo existir: import de arquivo
// ausente derruba o build inteiro. Por isso, quando falta, este instrumento
// cria um arquivo vazio com um comentário dizendo por quê.
//
// 💡 O CSS ser importado POR ROTA é o que resolve a colisão de `data-cid`: o
// contador do ditto reinicia em cada rota, então `n61` existe nas 21 páginas
// apontando para elementos diferentes. Uma folha global aplicaria a regra da
// home nas outras 20. Como cada rota importa a SUA, o Next gera um bundle de
// CSS por rota e a colisão nunca acontece.
//
// Uso:
//   APP=/caminho/app FOLHAS=geometria.css,scroll.css,entrada.css node liga-css.mjs
//   APP=... ESCREVER=0 node liga-css.mjs

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve, relative, dirname } from "node:path";

const APP = process.env.APP;
if (!APP) {
  console.error("falta APP");
  process.exit(1);
}
const FOLHAS = (process.env.FOLHAS ?? "geometria.css,scroll.css,entrada.css,hover.css")
  .split(",").map((s) => s.trim()).filter(Boolean);
const ESCREVER = process.env.ESCREVER !== "0";
const RAIZ = resolve(APP, "src", "app");

function paginas(dir) {
  const saida = [];
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) saida.push(...paginas(p));
    else if (nome === "page.tsx") saida.push(p);
  }
  return saida;
}

let criados = 0;
let ligados = 0;
let jaOk = 0;

for (const pg of paginas(RAIZ)) {
  const pasta = dirname(pg);
  let texto = readFileSync(pg, "utf8");
  const original = texto;
  const novos = [];

  for (const folha of FOLHAS) {
    const alvo = join(pasta, folha);
    if (!existsSync(alvo)) {
      if (ESCREVER) {
        writeFileSync(
          alvo,
          `/* ${folha} — vazio de propósito.\n   O import existe na page.tsx desta rota, e import de arquivo ausente\n   derruba o build. Quando o instrumento correspondente rodar nesta rota,\n   ele sobrescreve este arquivo. */\n`,
          "utf8"
        );
      }
      criados++;
    }
    if (texto.includes(`"./${folha}"`)) {
      jaOk++;
      continue;
    }
    novos.push(`import "./${folha}";`);
  }

  if (novos.length) {
    // Entra DEPOIS do último import de CSS já existente, para a ordem de
    // cascata continuar previsível: ditto.css primeiro, camada por cima.
    const linhas = texto.split("\n");
    let ultimo = -1;
    for (let i = 0; i < linhas.length; i++) if (/^import ".*\.css";$/.test(linhas[i].trim())) ultimo = i;
    linhas.splice(ultimo + 1, 0, ...novos);
    texto = linhas.join("\n");
    ligados += novos.length;
    if (ESCREVER) writeFileSync(pg, texto, "utf8");
  }
  if (texto !== original && !ESCREVER) console.log(`   (simulação) ${relative(APP, pg)}: + ${novos.join(" ")}`);
}

console.log(`\n${ESCREVER ? "✅" : "(simulação)"} folhas: ${FOLHAS.join(", ")}`);
console.log(`   imports acrescentados: ${ligados}`);
console.log(`   arquivos vazios criados para o import não quebrar: ${criados}`);
console.log(`   imports que já existiam: ${jaOk}`);
