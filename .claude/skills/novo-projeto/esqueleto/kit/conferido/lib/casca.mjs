// fundação: conferido v1 · o ajuste mora no fundacao.json do projeto, nunca aqui
//
// A casca de todo conferidor da fundação: lê o `fundacao/fundacao.json`, aceita
// `--raiz <dir>` e chama a função `conferir`.
//
// 🚨 Ela NÃO depende da fábrica. A casca da fábrica lê o `fabrica/stack.mjs` e
// sai 1 sem ele, e a
// fundação também se instala em projeto que já tem portão próprio (o site),
// onde não há fábrica nenhuma. O que o conferidor precisa saber do projeto
// mora no manifesto dele.
//
// Prova: provas/fundacao.mjs (a casca é o primeiro caso: sem o manifesto,
// vermelho dizendo qual arquivo falta)

import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

export const MANIFESTO = 'fundacao/fundacao.json'
export const KIT_NA_CASA = '.claude/skills/novo-projeto/esqueleto/kit/kit.json'

/**
 * O sha256 de um arquivo, com a quebra de linha normalizada quando ele é
 * texto. Texto se decide pelo CONTEÚDO (sem byte nulo), e não pela extensão:
 * a semente tem `Dockerfile`, `.prettierrc`, `.env.example` e `.mts`, que uma
 * lista de extensões esqueceria, e esquecer é acusar deriva falsa em todo
 * checkout com `autocrlf` (num CI de projeto real, seriam 12 de 50
 * arquivos).
 */
export function impressao (caminho) {
  const bytes = readFileSync(caminho)
  const amostra = bytes.subarray(0, 8000)
  const binario = amostra.includes(0)
  const normal = binario ? bytes : Buffer.from(bytes.toString('utf8').split('\r\n').join('\n'), 'utf8')
  return createHash('sha256').update(normal).digest('hex')
}

/** O valor depois de `--nome` nos argumentos, ou `null`. */
export function argumento (argv, nome) {
  const i = argv.indexOf(nome)
  return i !== -1 && argv[i + 1] ? argv[i + 1] : null
}

/** O manifesto do projeto: `{ manifesto }` ou `{ erro }`. */
export function lerManifesto (raiz) {
  const caminho = join(raiz, MANIFESTO)
  if (!existsSync(caminho)) {
    return { erro: `não achei ${MANIFESTO} em ${raiz}. A fundação está instalada neste projeto?` }
  }
  try {
    return { manifesto: JSON.parse(readFileSync(caminho, 'utf8')) }
  } catch (erro) {
    return { erro: `${MANIFESTO} ilegível: ${erro.message}` }
  }
}

/**
 * Onde está a casa (a fonte da fundação), ou `null`. Em ordem: `--fonte`, a
 * variável `FUNDACAO_FONTE`, e subir de pasta a partir do projeto.
 * 🚨 Nunca um caminho gravado no manifesto: a casa pode mudar de pasta, e o
 * kit que guarda o endereço fica apontando para o velho.
 */
export function acharCasa (raiz, { fonte = null, env = process.env } = {}) {
  for (const candidata of [fonte, env.FUNDACAO_FONTE]) {
    if (candidata) return existsSync(join(candidata, KIT_NA_CASA)) ? resolve(candidata) : null
  }
  for (let d = resolve(raiz); ; d = dirname(d)) {
    if (existsSync(join(d, KIT_NA_CASA))) return d
    if (dirname(d) === d) return null
  }
}

/** A casca de linha de comando, igual para todo conferidor da fundação. */
export async function comoComando (metaUrl, conferir) {
  const este = fileURLToPath(metaUrl)
  if (!process.argv[1] || resolve(process.argv[1]) !== resolve(este)) return

  // <projeto>/fundacao/portao/x.mjs → <projeto>
  const raizPadrao = dirname(dirname(dirname(este)))
  const argv = process.argv.slice(2)
  const raiz = argumento(argv, '--raiz') ? resolve(argumento(argv, '--raiz')) : raizPadrao

  const { manifesto, erro } = lerManifesto(raiz)
  if (erro) {
    console.log(`  ✗ ${erro}`)
    process.exit(1)
    return
  }
  process.exit(await conferir(raiz, { manifesto, argv, env: process.env }, { escreve: console.log }))
}
