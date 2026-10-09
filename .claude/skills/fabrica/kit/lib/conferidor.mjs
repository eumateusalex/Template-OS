// O contrato de todo conferidor do portão: uma função pura, e uma casca de
// linha de comando igual para todos.
//
// 🚨 Todo conferidor aceita `--raiz <dir>`. É isso que permite plantar o
// defeito numa CÓPIA, em `os.tmpdir()`, e nunca no repositório de verdade.
// Sem `--raiz`, provar que a régua reprova exigiria sujar o projeto, e
// "mutação que não aplicou" pareceria teste fraco.
//
// Prova: cada conferidor tem o seu arquivo em `provas/`, e o
// `estrutura.mjs` reprova conferidor sem prova.

import { resolve, join, dirname, basename } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { existsSync } from 'node:fs'

/**
 * Os dois lugares onde o kit mora num alvo: `fabrica/`, o padrão dos
 * projetos, e `.claude/fabrica/`, fora de vista.
 * 🚨 Na raiz do workspace a cópia do kit em `fabrica/` é bagunça na pasta onde
 * se navega, e por isso lá ela mora em `.claude/fabrica/`.
 */
export const LUGARES_DO_KIT = ['fabrica', '.claude/fabrica']

/**
 * Onde o kit mora neste alvo: `{ pasta }` relativa à raiz, ou `{ erro }`.
 * ⚠️ Os dois lugares ao mesmo tempo é erro, e não escolha: duas cópias do kit
 * no mesmo projeto descolam, e ninguém sabe qual o portão está usando.
 */
export function pastaDoKit (raiz) {
  const achados = LUGARES_DO_KIT.filter((p) => existsSync(join(raiz, p, 'stack.mjs')) || existsSync(join(raiz, p, 'kit.json')))
  if (achados.length > 1) {
    return { erro: `o kit está em dois lugares ao mesmo tempo (${achados.join(' e ')}): fique com um só` }
  }
  if (achados.length === 0) {
    return { erro: `não achei o kit em ${raiz} (procurei em ${LUGARES_DO_KIT.join(' e ')}). O kit está instalado neste alvo?` }
  }
  return { pasta: achados[0] }
}

/** A raiz do projeto a partir da pasta do kit: uma acima, ou duas se ele mora em `.claude/`. */
export function raizDaPastaDoKit (pastaDoKitAbsoluta) {
  const acima = dirname(pastaDoKitAbsoluta)
  return basename(acima) === '.claude' ? dirname(acima) : acima
}

/** Lê `--raiz <dir>` dos argumentos; o padrão é a raiz do projeto do kit. */
export function raizDosArgumentos (argv = process.argv.slice(2), raizPadrao = null) {
  const i = argv.indexOf('--raiz')
  if (i !== -1 && argv[i + 1]) return resolve(argv[i + 1])
  return raizPadrao ?? process.cwd()
}

/** Carrega o `stack.mjs` do kit do alvo, esteja ele onde estiver. */
export async function lerStack (raiz) {
  const lugar = pastaDoKit(raiz)
  if (lugar.erro) return { erro: lugar.erro }
  const caminho = join(raiz, lugar.pasta, 'stack.mjs')
  if (!existsSync(caminho)) {
    return { erro: `não achei ${caminho}. O kit está instalado neste alvo?` }
  }
  try {
    // `?v=` derruba o cache do carregador entre alvos diferentes na mesma execução
    const mod = await import(`${pathToFileURL(caminho).href}?v=${Date.now()}`)
    return { stack: mod }
  } catch (erro) {
    return { erro: `não consegui carregar ${caminho}: ${erro.message}` }
  }
}

/**
 * A casca de todo conferidor. Quem chama passa a função `conferir(raiz, stack,
 * { escreve })`, que devolve 0 ou 1.
 */
export async function comoComando (metaUrl, conferir) {
  const este = fileURLToPath(metaUrl)
  if (!process.argv[1] || resolve(process.argv[1]) !== resolve(este)) return

  // <projeto>/fabrica/portao/x.mjs → <projeto>, e <workspace>/.claude/fabrica/portao/x.mjs → <workspace>
  const raizPadrao = raizDaPastaDoKit(dirname(dirname(este)))
  const raiz = raizDosArgumentos(process.argv.slice(2), raizPadrao)

  const { stack, erro } = await lerStack(raiz)
  if (erro) {
    console.log(`  ✗ ${erro}`)
    process.exit(1)
    return
  }
  process.exit(await conferir(raiz, stack, { escreve: console.log }))
}

/** Um arquivo é teste? TESTES bate antes de CODIGO, de propósito. */
export function ehTeste (caminho, stack) {
  const padroes = stack?.TESTES ?? []
  return padroes.some((p) => caminho.includes(p))
}

/** Um arquivo é código do projeto? */
export function ehCodigo (caminho, stack) {
  if (ehTeste(caminho, stack)) return false
  const pastas = stack?.CODIGO ?? []
  return pastas.some((p) => caminho === p || caminho.startsWith(`${p}/`))
}

/** As extensões de fonte da stack do alvo. */
export function extensoesDe (stack) {
  return stack?.STACK === 'python'
    ? ['.py']
    : ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']
}
