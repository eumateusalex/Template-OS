#!/usr/bin/env node
// node fabrica/medir-pisos.mjs [--raiz <dir>]
//
// Mede os pisos deste projeto com os PRÓPRIOS conferidores, e imprime o bloco
// `PISOS` pronto para colar no `stack.mjs`.
//
// 🚨 Ele existe porque medir por grep dá errado. Um `grep -l` de `catch {}`
// pode dizer 3 onde o conferidor acha 16; um `wc -l` pode dizer 16 arquivos
// grandes onde o conferidor acha 18, porque o grep não conta indentação funda.
// **Proxy não é medida.**
//
// ⚠️ O piso nasce do dia da adoção, com a data ao lado, e daqui em diante só
// desce. Ele não é meta: é a linha que não pode piorar.

import { join, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { existsSync } from 'node:fs'

import { raizDosArgumentos, lerStack, raizDaPastaDoKit } from './lib/conferidor.mjs'

const ESTE = fileURLToPath(import.meta.url)
const KIT = dirname(ESTE)

/** Os conferidores que CONTAM, e a chave de piso de cada um. */
export const QUE_CONTAM = ['silencio', 'tamanho', 'travessao', 'camadas', 'envelhecimento']

const HOJE = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date())

async function principal () {
  const raiz = raizDosArgumentos(process.argv.slice(2), raizDaPastaDoKit(KIT))
  const { stack, erro } = await lerStack(raiz)
  if (erro) {
    console.error(`✗ ${erro}`)
    process.exit(1)
    return
  }

  const medidos = {}
  const naoMedidos = []

  for (const nome of QUE_CONTAM) {
    const caminho = join(KIT, 'portao', `${nome}.mjs`)
    if (!existsSync(caminho)) continue

    const mod = await import(pathToFileURL(caminho).href)
    if (typeof mod.conferir !== 'function') continue

    // Piso 0 força a catraca a imprimir "piorou: N agora"; é N que queremos.
    const comPisoZero = { ...stack, PISOS: { ...(stack.PISOS ?? {}), [nome]: 0 } }
    const linhas = []
    mod.conferir(raiz, comPisoZero, { escreve: (t) => linhas.push(String(t)) })

    const texto = linhas.join('\n')
    const piorou = texto.match(/piorou:\s*(\d+)\s*agora/)
    const semBase = /sem linha de base/i.test(texto)

    if (piorou) medidos[nome] = Number(piorou[1])
    else if (semBase) naoMedidos.push(`${nome}: o conferidor não mediu nada aqui`)
    else medidos[nome] = 0
  }

  if (Object.keys(medidos).length === 0) {
    console.log('✗ nenhum conferidor de contagem respondeu: nada foi medido.')
    process.exit(1)
    return
  }

  console.log('Medido agora, com os próprios conferidores:\n')
  console.log('export const PISOS = {')
  for (const [nome, valor] of Object.entries(medidos)) {
    console.log(`  ${nome}: ${valor}, // ${HOJE} · medido por node fabrica/medir-pisos.mjs`)
  }
  if (stack.PISOS?.cobertura !== undefined) {
    console.log(`  cobertura: ${stack.PISOS.cobertura} // a cobertura se mede rodando os testes, não aqui`)
  }
  console.log('}\n')

  for (const n of naoMedidos) console.log(`⚠ ${n}`)
  console.log('Cole no fabrica/stack.mjs. Daqui em diante, o número só desce.')
  process.exit(0)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(ESTE)) {
  principal()
}
