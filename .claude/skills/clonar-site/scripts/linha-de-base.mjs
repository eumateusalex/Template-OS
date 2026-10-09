// linha-de-base.mjs — desliga TUDO que a skill escreveu e mede o clone puro.
//
// ══════════════════════════════════════════════════════════════════════════
// 🚨 O EXPERIMENTO MAIS VALIOSO DESTA SKILL, E O MAIS FÁCIL DE NÃO FAZER
//
// Depois de escrever camada de scroll, de entrada, de acordeão e de hover, a
// pergunta que ninguém faz é: **isso melhorou ou piorou?**
//
// Medido no site-exemplo, na mesma home, no mesmo instante:
//
//   clone COM a camada da skill ....... 45 elementos fora do lugar
//   clone PURO, camada desligada ...... 29 elementos fora do lugar
//   ou seja, a camada ACRESCENTA ...... 16 defeitos
//
// De quatro tipos: uma regra de scroll que empurra a nav 158,8px; um acordeão
// que força a altura do original por cima de uma altura que a captura já
// acertou, encolhendo cinco itens; uma animação de entrada cujo
// `transform: none` final apaga o posicionamento de base; e uma barra de
// contato que fica 3,6px PIOR do que não fazer nada.
//
// Sem este experimento, os 16 ficam, e o esforço seguinte se gasta
// perseguindo defeitos da camada achando que são da captura.
//
// 🚨 A REGRA QUE SAI DAQUI: a linha de base se mede ANTES de investigar
// qualquer divergência. Ela responde "de quem é a culpa" com número, e sem
// isso toda a investigação seguinte parte do lugar errado.
//
// ══════════════════════════════════════════════════════════════════════════
// ✅ VALIDADO POR SOMA DE VERIFICAÇÃO
//
// Este instrumento sobrescreve 89 arquivos de uma vez. Um bug aqui apaga a
// camada inteira, e por isso ele se prova por md5, não por leitura:
//
//   1. md5 dos 89 arquivos ............... registrado
//   2. MODO=desligar ..................... 89 viraram placeholder, as 89 somas
//                                          divergiram (prova de que desligou)
//   3. MODO=desligar de novo ............. RECUSOU, como deve
//   4. a cópia guardou o conteúdo real ... 258 regras no scroll.css guardado
//   5. MODO=religar ...................... 89 de 89 somas voltaram a bater
//   6. a cópia foi removida .............. sim
//
// 💡 A prática que fica: instrumento que mexe em dezenas de arquivos se valida
// com soma de verificação antes e depois, nunca com leitura de código.
// ══════════════════════════════════════════════════════════════════════════
//
// Uso:
//   APP=<app> MED=<medicoes> MODO=desligar  node linha-de-base.mjs
//   APP=<app> MED=<medicoes> MODO=religar   node linha-de-base.mjs
//   APP=<app> MED=<medicoes> MODO=listar    node linha-de-base.mjs
//
// O ciclo completo do experimento:
//   1. MODO=desligar
//   2. npm run build
//   3. compara-geometria.mjs  → este é o número da BASE
//   4. MODO=religar
//   5. npm run build
//   6. compara-geometria.mjs  → este é o número COM a camada
//   7. se (6) for maior que (3), a camada está piorando o clone.
//
// Variáveis:
//   APP    raiz do projeto Next do clone (obrigatória)
//   MED    pasta de medições, onde a cópia de segurança mora (obrigatória)
//   NOME   nome da cópia (padrão "camada-guardada")

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, rmSync } from "node:fs";
import { join, resolve, relative, dirname } from "node:path";

const APP = process.env.APP;
const MED = process.env.MED;
const MODO = process.env.MODO ?? "listar";
const NOME = process.env.NOME ?? "camada-guardada";
if (!APP || !MED) {
  console.error("faltam APP e/ou MED");
  process.exit(1);
}
const GUARDA = resolve(MED, NOME);

// 🚨 A lista do que É a camada. Manter em sincronia com quem escreve:
// gera-scroll, gera-entrada, gera-interacao, gera-acordeao,
// corrige-interacao, corrige-geometria e captura-estado.
//
// ⚠️ `NavegacaoClient.tsx` NÃO entra: ele é código de estrutura, não camada
// medida, e desligá-lo derruba o build (o layout o importa).
// 🚨 Lista INCOMPLETA desliga METADE da camada e a medição MENTE — o número
// que volta não é o do clone cru, é o de um híbrido. Medido no framer-5: sem
// `tipografia.css` (1695 regras escritas em 20 rotas), `estrutura.css` (os
// consertos medidos de largura/altura e os marcadores de runtime) e QUATRO
// dos seis runtimes do public/, a lista mente. Quem acrescenta gerador
// acrescenta aqui, no mesmo commit.
const CSS_DA_CAMADA = new Set([
  "scroll.css",
  "entrada.css",
  "hover.css",
  "acordeao.css",
  "interacao.css",
  "geometria.css",
  "tipografia.css",
  "estrutura.css",
  "transicao.css",
  "rotacao.css",
]);
const JS_DA_CAMADA =
  /^(scroll|acordeao|drawer|ticker|servicos|contador|menu|marquee|carrossel|rotacao|transicao|estado-.*)\.js$/;

function varrer(dir, filtro, achados = []) {
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) {
      if (nome === "node_modules" || nome === ".next" || nome === "out") continue;
      varrer(p, filtro, achados);
    } else if (filtro(nome)) {
      achados.push(p);
    }
  }
  return achados;
}

function arquivosDaCamada() {
  const css = varrer(join(APP, "src", "app"), (n) => CSS_DA_CAMADA.has(n));
  const pub = join(APP, "public");
  const js = existsSync(pub)
    ? readdirSync(pub).filter((n) => JS_DA_CAMADA.test(n)).map((n) => join(pub, n))
    : [];
  return [...css, ...js];
}

const PLACEHOLDER_CSS = `/* DESLIGADO pelo linha-de-base.mjs para medir o clone puro do ditto.
   O original está guardado em ${NOME}/. Religar com MODO=religar.

   🚨 NÃO apagar este arquivo: a page.tsx da rota o importa, e import de
   arquivo ausente derruba o build inteiro. */
`;
const PLACEHOLDER_JS = `/* DESLIGADO pelo linha-de-base.mjs. Religar com MODO=religar. */\n`;

const arquivos = arquivosDaCamada();

if (MODO === "listar") {
  console.log(`\n📋 a camada desta skill, no clone: ${arquivos.length} arquivos`);
  let vivos = 0;
  for (const a of arquivos) {
    const conteudo = readFileSync(a, "utf8");
    const desligado = conteudo.includes("DESLIGADO pelo linha-de-base");
    const regras = (conteudo.match(/data-cid=/g) ?? []).length;
    if (!desligado) vivos++;
    console.log(`   ${desligado ? "⭘ desligado" : "● ligado   "}  ${String(regras).padStart(4)} regras  ${relative(APP, a)}`);
  }
  console.log(`\n   ${vivos} ligados, ${arquivos.length - vivos} desligados`);
  console.log(`   cópia de segurança: ${existsSync(GUARDA) ? GUARDA : "não existe"}`);
  process.exit(0);
}

if (MODO === "desligar") {
  // 🚨 Guard que impede o pior acidente possível aqui: rodar `desligar` duas
  // vezes gravaria os PLACEHOLDERS por cima da cópia de segurança, e a camada
  // de verdade sumiria sem aviso. Se já existe cópia, exige decisão humana.
  if (existsSync(GUARDA)) {
    console.error(`\n🚨 já existe cópia em ${GUARDA}.`);
    console.error(`   Desligar de novo gravaria placeholder POR CIMA dela e a camada`);
    console.error(`   de verdade sumiria. Rode MODO=religar antes, ou mude NOME=.`);
    process.exit(1);
  }
  mkdirSync(GUARDA, { recursive: true });
  let n = 0;
  for (const a of arquivos) {
    const rel = relative(APP, a);
    const destino = join(GUARDA, rel);
    mkdirSync(dirname(destino), { recursive: true });
    writeFileSync(destino, readFileSync(a));
    writeFileSync(a, a.endsWith(".css") ? PLACEHOLDER_CSS : PLACEHOLDER_JS, "utf8");
    n++;
  }
  writeFileSync(join(GUARDA, "_manifesto.json"), JSON.stringify({ app: APP, arquivos: arquivos.map((a) => relative(APP, a)) }, null, 2));
  console.log(`\n⭘ camada DESLIGADA: ${n} arquivos guardados em ${GUARDA}`);
  console.log(`\n   agora: npm run build  e  compara-geometria.mjs`);
  console.log(`   o número que sair é a LINHA DE BASE — o que a captura do ditto`);
  console.log(`   entrega sozinha. Compare com o número da camada ligada.`);
  process.exit(0);
}

if (MODO === "religar") {
  if (!existsSync(GUARDA)) {
    console.error(`\n❌ não existe cópia em ${GUARDA}. Nada a religar.`);
    process.exit(1);
  }
  const manifesto = JSON.parse(readFileSync(join(GUARDA, "_manifesto.json"), "utf8"));
  let n = 0;
  for (const rel of manifesto.arquivos) {
    const origem = join(GUARDA, rel);
    if (!existsSync(origem)) {
      console.log(`   ⚠️ sumiu da cópia: ${rel}`);
      continue;
    }
    const destino = join(APP, rel);
    mkdirSync(dirname(destino), { recursive: true });
    writeFileSync(destino, readFileSync(origem));
    n++;
  }
  rmSync(GUARDA, { recursive: true, force: true });
  console.log(`\n● camada RELIGADA: ${n} arquivos restaurados, cópia removida`);
  console.log(`   agora: npm run build`);
  process.exit(0);
}

console.error(`MODO desconhecido: ${MODO}. Use listar, desligar ou religar.`);
process.exit(1);
