// entrega-inline.mjs — põe as folhas geradas DENTRO da página, num <style>.
//
// 🚨 Existe porque importar o CSS como arquivo falhou de um jeito que não se
// explicou neste build. Medido no clone do site-landing:
//
//   a regra estava no bundle SERVIDO, com !important, dentro de uma
//   @media comprovadamente ativa (matchMedia deu true), numa folha carregada
//   e não desabilitada, com o seletor casando (el.matches deu true) — e não
//   aplicava. Tirando a classe do Tailwind do elemento, o valor caía para o
//   herdado, provando que a regra não estava perdendo disputa de cascata:
//   simplesmente não entrava nela.
//
//   O MESMO texto CSS, injetado num <style> em tempo de execução, aplicava na
//   hora. Por isso a entrega é por <style>, que é determinístico.
//
// Cada rota ganha um `layout.tsx` próprio, e não se encosta no `page.tsx`
// gerado (centenas de KB de JSX de máquina). O layout de rota é obrigatório
// ser por rota: os `data-cid` COLIDEM entre rotas — o n5 de /links não é o n5
// de /ai-first — então uma folha global aplicaria o valor de uma rota na
// outra.
//
// 🚨 A ORDEM DAS FOLHAS É A ORDEM DE FOLHAS=, e é ela que decide quem ganha
// quando duas escrevem a mesma propriedade. Por isso cada instrumento tem que
// ser dono de um conjunto de propriedades (regra 4), e a ordem aqui é só
// desempate de última instância.
//
// O que o faz SE CALAR:
//   - nenhuma folha com conteúdo na rota -> não escreve, e REMOVE o layout
//     que ele mesmo tinha gerado (senão sobra <style> vazio fingindo trabalho)
//   - layout.tsx existente que NÃO foi gerado por ele -> não sobrescreve
//
// Uso:
//   APP=<app> ROTAS=<med>/rotas.json FOLHAS=tipografia.css,caixa.css \
//   node entrega-inline.mjs

import { writeFileSync, readFileSync, existsSync, rmSync, mkdirSync, renameSync } from "node:fs";
import { join } from "node:path";

const APP = process.env.APP;
if (!APP) {
  console.error("falta APP=<pasta do app>");
  process.exit(1);
}
const FOLHAS = (process.env.FOLHAS ?? "tipografia.css,caixa.css")
  .split(",").map((s) => s.trim()).filter(Boolean);
const ESCREVER = process.env.ESCREVER !== "0";

const MARCA = "// GERADO por scripts/entrega-inline.mjs";

function rotas() {
  const arq = process.env.ROTAS;
  if (arq && existsSync(arq)) {
    const j = JSON.parse(readFileSync(arq, "utf8"));
    const lista = j.rotas ?? j;
    return (Array.isArray(lista) ? lista : Object.keys(lista))
      .map((r) => (typeof r === "string" ? r : r.rota ?? r.path))
      .filter(Boolean);
  }
  if (arq) return arq.split(",").map((s) => s.trim()).filter(Boolean);
  return [process.env.ROTA ?? "/"];
}

/** Conta regras de verdade, não linhas: comentário não é trabalho. */
const contaRegras = (css) => (css.match(/\{[^{}]*[a-z-]+\s*:/g) || []).length;

let totalRotas = 0;
let totalRegras = 0;

/** 🚨 A HOME não tem layout próprio: o layout de `src/app` é o layout RAIZ,
 *  que vale para todas as rotas. Embutir o CSS dela ali vazaria os valores da
 *  home para as outras — e `data-cid` COLIDE entre rotas, então n92 da home
 *  viraria n92 de /studio.
 *
 *  A saída do App Router é o GRUPO DE ROTAS: `src/app/(inicio)/` serve `/`
 *  sem mudar a URL e aceita um `layout.tsx` só dela. Aqui a `page.tsx` da raiz
 *  e as folhas da home mudam para dentro do grupo, uma vez só; nas rodadas
 *  seguintes o grupo já existe e nada se move.
 *
 *  Medido no framer-4: sem isso, a regra de altura do hero (96vh congelado em
 *  800px) ficava no bundle, na @media certa, com !important — e não entrava na
 *  cascata. O mesmo texto num <style> aplicava na hora. */
const GRUPO_HOME = "(inicio)";

function pastaDaHome(FOLHAS) {
  const raiz = join(APP, "src/app");
  const grupo = join(raiz, GRUPO_HOME);
  const layRaiz = join(raiz, "layout.tsx");

  // Se o layout da raiz é MEU, o clone não tem layout raiz de verdade: usa a raiz.
  if (existsSync(layRaiz) && readFileSync(layRaiz, "utf8").startsWith(MARCA)) return raiz;
  if (existsSync(join(grupo, "page.tsx"))) return grupo;
  if (!existsSync(join(raiz, "page.tsx"))) return raiz; // nada a mover

  if (!ESCREVER) {
    console.log(`  /                    (simulado) criaria o grupo ${GRUPO_HOME} e moveria page.tsx + folhas`);
    return raiz;
  }

  mkdirSync(grupo, { recursive: true });
  const mover = ["page.tsx", ...FOLHAS, "ditto.css"];
  const movidos = [];
  for (const nome of mover) {
    const de = join(raiz, nome);
    if (!existsSync(de)) continue;
    renameSync(de, join(grupo, nome));
    movidos.push(nome);
  }
  console.log(`  /                    grupo ${GRUPO_HOME} criado; movidos: ${movidos.join(", ")}`);
  return grupo;
}

for (const rota of rotas()) {
  const dir = rota === "/" ? pastaDaHome(FOLHAS) : join(APP, "src/app", rota.replace(/^\//, ""));
  const lay = join(dir, "layout.tsx");

  const partes = [];
  let regras = 0;
  for (const nome of FOLHAS) {
    const f = join(dir, nome);
    if (!existsSync(f)) continue;
    const css = readFileSync(f, "utf8").trim();
    const n = contaRegras(css);
    if (!n) continue;
    partes.push(`/* ===== ${nome} (${n} regras) ===== */\n${css}`);
    regras += n;
  }

  if (!partes.length) {
    // 🚨 nada a entregar: se sobrou um layout MEU de rodada anterior, ele sai.
    // Deixar <style> vazio é pior que não ter: parece camada aplicada.
    if (existsSync(lay) && readFileSync(lay, "utf8").startsWith(MARCA)) {
      if (ESCREVER) rmSync(lay);
      console.log(`  ${rota.padEnd(20)} sem folha com conteúdo — layout removido`);
    } else {
      console.log(`  ${rota.padEnd(20)} sem folha com conteúdo`);
    }
    continue;
  }

  if (existsSync(lay) && !readFileSync(lay, "utf8").startsWith(MARCA)) {
    console.log(`  ${rota.padEnd(20)} ⛔ já existe layout.tsx que não é meu — NÃO sobrescrevi`);
    continue;
  }

  const css = partes.join("\n\n");
  const corpo =
    `${MARCA} — não editar à mão.\n` +
    `// Folhas embutidas, nesta ordem: ${FOLHAS.join(", ")}\n` +
    `// Vai inline porque o mesmo CSS importado como arquivo não entrava na\n` +
    `// cascata neste build (ver o cabeçalho do instrumento, e armadilhas.md).\n` +
    `const CSS = ${JSON.stringify(css)};\n\n` +
    `export default function Layout({ children }: { children: React.ReactNode }) {\n` +
    `  return (\n` +
    `    <>\n` +
    `      <style dangerouslySetInnerHTML={{ __html: CSS }} />\n` +
    `      {children}\n` +
    `    </>\n` +
    `  );\n` +
    `}\n`;

  if (ESCREVER) writeFileSync(lay, corpo);
  totalRotas++;
  totalRegras += regras;
  console.log(`  ${rota.padEnd(20)} ${partes.length} folha(s), ${regras} regras -> ${ESCREVER ? "layout.tsx" : "(simulado)"}`);
}

console.log(`\n✅ ${totalRotas} rota(s) com <style> inline, ${totalRegras} regras no total`);
console.log("🚨 rebuildar agora — gerar o layout não é aplicar.");
