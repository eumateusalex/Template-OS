// junta-lotes.mjs — funde as pastas app-lote-* do clona-em-lotes num app só.
//
// Cada lote é um projeto Next COMPLETO: mesma base (layout, css, public,
// configs, home) e só as rotas do seu pedaço. Juntar é: pegar a base de um
// lote e acrescentar, de todos os outros, o que ainda não existe.
//
// 🚨 A fusão é ARQUIVO A ARQUIVO, nunca pasta a pasta. As rotas de uma mesma
// seção caem em lotes diferentes (o /blog do site-next cai partido entre os
// lotes 1 e 2): copiar `src/app/blog` do lote 1 e pular a do lote 2 porque "a
// pasta já existe" perderia metade das rotas, calado.
//
// Regra de conflito: PRIMEIRO QUE ESCREVE GANHA, e todo conflito de conteúdo é
// contado e declarado. O primeiro é o lote 1 por construção — a base inteira
// vem dele, então layout, css global e home saem todos da mesma captura.
//
// Uso:
//   LOTES=<pasta com app-lote-*> DESTINO=<pasta do app> node junta-lotes.mjs
//
// Variáveis:
//   LOTES    pasta que contém as app-lote-* (obrigatória)
//   DESTINO  pasta do app final (obrigatória) — apagada e refeita
//   MANTER   "1" para não apagar o destino antes (padrão: apaga)

import { readdirSync, statSync, mkdirSync, copyFileSync, existsSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve, relative } from "node:path";

const LOTES = process.env.LOTES;
const DESTINO = process.env.DESTINO;
if (!LOTES || !DESTINO) {
  console.error("faltam LOTES e/ou DESTINO");
  process.exit(1);
}
const raizLotes = resolve(LOTES);
const destino = resolve(DESTINO);

const pastas = readdirSync(raizLotes)
  .filter((n) => /^app-lote-\d+$/.test(n))
  .sort()
  .map((n) => join(raizLotes, n))
  .filter((p) => existsSync(join(p, "package.json")));

if (!pastas.length) {
  console.error(`nenhuma app-lote-* válida em ${raizLotes}`);
  process.exit(1);
}
console.log(`juntando ${pastas.length} lote(s) -> ${destino}`);

if (existsSync(destino) && process.env.MANTER !== "1") rmSync(destino, { recursive: true, force: true });
mkdirSync(destino, { recursive: true });

/** Caminhos relativos de todo arquivo sob `raiz`. */
function listar(raiz, prefixo = "") {
  const saida = [];
  for (const nome of readdirSync(join(raiz, prefixo))) {
    const rel = prefixo ? join(prefixo, nome) : nome;
    const abs = join(raiz, rel);
    if (statSync(abs).isDirectory()) saida.push(...listar(raiz, rel));
    else saida.push(rel);
  }
  return saida;
}

const dono = new Map(); // caminho relativo -> lote que o escreveu
let copiados = 0;
let conflitosIguais = 0;
const conflitosDiferentes = [];

for (const pasta of pastas) {
  const rotulo = pasta.split(/[\\/]/).pop();
  let novosDoLote = 0;
  for (const rel of listar(pasta)) {
    const origem = join(pasta, rel);
    const alvo = join(destino, rel);
    if (dono.has(rel)) {
      // já veio de outro lote: comparar antes de descartar, nunca supor
      const a = readFileSync(origem);
      const b = readFileSync(alvo);
      if (a.equals(b)) conflitosIguais++;
      else conflitosDiferentes.push({ arquivo: rel, ficou: dono.get(rel), ignorado: rotulo, bytes: [b.length, a.length] });
      continue;
    }
    mkdirSync(join(alvo, ".."), { recursive: true });
    copyFileSync(origem, alvo);
    dono.set(rel, rotulo);
    copiados++;
    novosDoLote++;
  }
  console.log(`  ${rotulo}: +${novosDoLote} arquivo(s) novo(s)`);
}

const rotas = [...dono.keys()]
  .filter((p) => /^src[\\/]app[\\/].*page\.tsx$/.test(p) || p === join("src", "app", "page.tsx"))
  .map((p) => "/" + relative(join("src", "app"), p).replace(/[\\/]page\.tsx$/, "").replace(/\\/g, "/"))
  .map((r) => (r === "/." || r === "/" ? "/" : r))
  .sort();

const relatorio = {
  geradoPor: "junta-lotes.mjs",
  lotes: pastas.map((p) => p.split(/[\\/]/).pop()),
  arquivos: copiados,
  conflitosIdenticos: conflitosIguais,
  conflitosDivergentes: conflitosDiferentes,
  rotas: rotas.length,
  listaRotas: rotas,
};
writeFileSync(join(destino, ".ion", "juncao.json"), JSON.stringify(relatorio, null, 2), "utf8");

console.log(`\narquivos: ${copiados}  ·  páginas: ${rotas.length}`);
console.log(`conflitos idênticos (esperado — a base se repete em todo lote): ${conflitosIguais}`);
if (conflitosDiferentes.length) {
  console.log(`⚠️ ${conflitosDiferentes.length} arquivo(s) com MESMO caminho e conteúdo DIFERENTE (ficou o do primeiro lote):`);
  for (const c of conflitosDiferentes.slice(0, 20))
    console.log(`   ${c.arquivo}  (ficou ${c.ficou} com ${c.bytes[0]}B, ignorado ${c.ignorado} com ${c.bytes[1]}B)`);
  if (conflitosDiferentes.length > 20) console.log(`   … e mais ${conflitosDiferentes.length - 20}`);
}
console.log(`\nrelatório -> ${join(destino, ".ion", "juncao.json")}`);
