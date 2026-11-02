// As tomadas do Reel falado: a pessoa repete a frase até acertar, e a ÚLTIMA tomada
// completa é a que fica.
//
// O motor sugere os grupos de repetição e a última de cada um; o agente escreve a
// escolha, e a conferência recusa o que fere a régua: segmento que some calado,
// índice que não existe, troca da última sem razão escrita.
//
// As frases dos casos imitam uma gravação de verdade, em que o "terceiro" saiu sete vezes e o "quarto" se alterna com "site que demora".
//
//   node --test scripts/reel-falado/teste-tomadas.mjs

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'

const AQUI = resolve(fileURLToPath(new URL('.', import.meta.url)))
const MOTOR = join(AQUI, 'tomadas.py')
const PY = process.env.PYTHON || 'python' // o Python 3.12; a variável PYTHON aponta outro
const pasta = mkdtempSync(join(tmpdir(), 'teste-tomadas-'))
after(() => rmSync(pasta, { recursive: true, force: true }))

let n = 0
function transcricao(frases) {
  // frases: [[inicio, texto], ...]; cada palavra ocupa 0,3 s
  const segmentos = frases.map(([inicio, texto]) => {
    const ws = texto.split(/\s+/).filter(Boolean)
    const palavras = ws.map((w, i) => ({ texto: w, inicio: inicio + i * 0.3, fim: inicio + i * 0.3 + 0.28 }))
    return { inicio, fim: inicio + ws.length * 0.3, texto, palavras }
  })
  const arq = join(pasta, `palavras-${++n}.json`)
  writeFileSync(arq, JSON.stringify({ arquivo: 'x.mp4', modelo: 't', dispositivo: 'cpu', segmentos }))
  return arq
}

function roda(...args) {
  const r = spawnSync(PY, [MOTOR, ...args], { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } })
  return { codigo: r.status, saida: r.stdout, erro: r.stderr }
}

function sugere(frases) {
  const r = roda('sugerir', transcricao(frases))
  assert.equal(r.codigo, 0, r.erro)
  return JSON.parse(r.saida)
}

function confere(frases, escolha) {
  const arq = join(pasta, `tomadas-${++n}.json`)
  writeFileSync(arq, JSON.stringify(escolha))
  return roda('conferir', transcricao(frases), arq)
}

const GANCHO = [
  [0, 'Aqui vão quatro coisas importantes para você ajustar e verificar antes de colocar seu site no ar.'],
  [7, 'Aqui vão quatro coisas para você verificar e ajustar antes de colocar seu site no ar.'],
  [13, 'Primeiro, adicionar metadados.']
]

test('repetições seguidas viram um grupo, e a sugerida é a última', () => {
  const s = sugere(GANCHO)
  assert.deepEqual(s.grupos.map((g) => g.indices), [[0, 1], [2]])
  assert.deepEqual(s.grupos.map((g) => g.sugerida), [1, 2])
})

test('o mesmo ordinal no começo agrupa a tomada que recomeçou diferente', () => {
  const s = sugere([
    [40, 'Terceiro, adicionar o site.'],
    [45, 'Terceiro, indexar no Google Search Console para poder monitorar a presença de busca.'],
    [54, 'Terceiro, adicionar no Google Search Console para poder monitorar a presença.'],
    [98, 'Terceiro, indexar no Google Search Console para poder monitorar a presença no resultado de busca.']
  ])
  assert.deepEqual(s.grupos.map((g) => g.indices), [[0, 1, 2, 3]])
  assert.equal(s.grupos[0].sugerida, 3)
})

test('duas frases alternadas (A, A, B, A, B) saem em dois grupos, na ordem das últimas', () => {
  const s = sugere([
    [104, 'Quarto e último, adicionar o site no PgSpeed e verificar se está demorando para carregar por sites que demoram bastante.'],
    [117, 'Quarto e último, adicionar o site ao PgSpeed e verificar a velocidade.'],
    [123, 'Site que demora demais espanta cliente.'],
    [127, 'E quarto último, verificar o site dentro do PgSpeed'],
    [131, 'O site que demora para carregar demais, acaba mandando o cliente embora']
  ])
  assert.deepEqual(s.grupos.map((g) => g.indices), [[0, 1, 3], [2, 4]])
  assert.deepEqual(s.grupos.map((g) => g.sugerida), [3, 4])
})

test('a mesma frase a mais de 90 s da anterior não se agrupa (é recurso de fala, não tomada)', () => {
  const s = sugere([
    [0, 'Site que demora demais espanta cliente.'],
    [10, 'Primeiro, adicionar metadados.'],
    [120, 'Site que demora demais espanta cliente.']
  ])
  assert.equal(s.grupos.length, 3)
})

test('a última bem mais curta continua sugerida, marcada como suspeita de incompleta', () => {
  const s = sugere([
    [0, 'O título é a primeira coisa que a pessoa lê antes de decidir se vai clicar no seu site ou não.'],
    [6, 'O título é a primeira coisa que a pessoa lê antes de decidir se vai clicar.'],
    [11, 'O título é a primeira']
  ])
  assert.deepEqual(s.grupos[0].indices, [0, 1, 2])
  assert.equal(s.grupos[0].sugerida, 2)
  assert.deepEqual(s.grupos[0].suspeitas, [2])
})

test('transcrição sem fala recusa', () => {
  const r = roda('sugerir', transcricao([]))
  assert.equal(r.codigo, 1)
  assert.match(r.erro, /sem fala/)
})

test('a conferência aceita a escolha certa e devolve a ordem final', () => {
  const r = confere(GANCHO, { frases: [{ grupo: [0, 1], escolhida: 1 }, { grupo: [2], escolhida: 2 }], descartados: [] })
  assert.equal(r.codigo, 0, r.erro)
  const o = JSON.parse(r.saida)
  assert.deepEqual(o.ordem.map((f) => f.escolhida), [1, 2])
  assert.deepEqual(o.trocas, [])
})

test('segmento que não está em grupo nem descartado recusa, dizendo qual', () => {
  const r = confere(GANCHO, { frases: [{ grupo: [1], escolhida: 1 }, { grupo: [2], escolhida: 2 }], descartados: [] })
  assert.equal(r.codigo, 1)
  assert.match(r.erro, /segmento 0/)
})

test('segmento em dois lugares recusa', () => {
  const r = confere(GANCHO, { frases: [{ grupo: [0, 1], escolhida: 1 }, { grupo: [2], escolhida: 2 }], descartados: [0] })
  assert.equal(r.codigo, 1)
  assert.match(r.erro, /segmento 0/)
})

test('índice que não existe recusa, dizendo qual', () => {
  const r = confere(GANCHO, { frases: [{ grupo: [0, 1], escolhida: 1 }, { grupo: [2, 9], escolhida: 2 }], descartados: [] })
  assert.equal(r.codigo, 1)
  assert.match(r.erro, /9/)
})

test('a escolhida fora do grupo recusa, mesmo com razão de troca (o segmento entraria duas vezes)', () => {
  // com a razão escrita, a regra da troca não recusa: quem tem que recusar é a guarda
  // do grupo
  const r = confere(GANCHO, { frases: [{ grupo: [0, 1], escolhida: 2, troca: 'qualquer razão' }, { grupo: [2], escolhida: 2 }], descartados: [] })
  assert.equal(r.codigo, 1)
  assert.match(r.erro, /frase 1: a escolhida \(2\) não está no grupo/)
})

test('trocar a última sem razão recusa; com a razão escrita, aceita e registra', () => {
  const sem = confere(GANCHO, { frases: [{ grupo: [0, 1], escolhida: 0 }, { grupo: [2], escolhida: 2 }], descartados: [] })
  assert.equal(sem.codigo, 1)
  assert.match(sem.erro, /troca/)
  const com = confere(GANCHO, {
    frases: [{ grupo: [0, 1], escolhida: 0, troca: 'a última gagueja em "verificar"' }, { grupo: [2], escolhida: 2 }],
    descartados: []
  })
  assert.equal(com.codigo, 0, com.erro)
  const o = JSON.parse(com.saida)
  assert.equal(o.trocas.length, 1)
  assert.match(o.trocas[0].razao, /gagueja/)
  assert.match(o.trocas[0].descartada, /quatro coisas para você/)
})

test('a saída é UTF-8 mesmo sem PYTHONIOENCODING (o terminal do Windows grava em cp1252)', () => {
  const { PYTHONIOENCODING, ...semVariavel } = process.env
  const arq = transcricao([[0, 'Terceiro, indexar no Google para ver a presença e a ação.']])
  const r = spawnSync(PY, [MOTOR, 'sugerir', arq], { env: { ...semVariavel, PYTHONUTF8: '0', PYTHONIOENCODING: '' } })
  assert.equal(r.status, 0, r.stderr?.toString())
  const texto = new TextDecoder('utf-8', { fatal: true }).decode(r.stdout)
  assert.match(JSON.parse(texto).grupos[0].tomadas[0].texto, /presença e a ação/)
})

test('regravações com o mesmo começo e fim diferente se agrupam', () => {
  // uma transcrição de gravação: as duas frases do "quarto" alternadas, e a
  // segunda regravada com três finais diferentes
  const s = sugere([
    [104.59, 'E quarto e último, adicionar o site no PG Speed e verificar se está demorando para carregar.'],
    [114.74, 'Sites que demoram bastante.'],
    [117.79, 'E quarto e último, adicionar o site ao PG Speed e verificar a velocidade.'],
    [123.55, 'Sites que demoram demais espanta clientes.'],
    [127.93, 'E quarto e último, verificar o site dentro do PG Speed.'],
    [131.99, 'Sites que demoram para carregar demais acaba mandando o cliente embora.']
  ])
  assert.deepEqual(s.grupos.map((g) => g.indices), [[0, 2, 4], [1, 3, 5]])
  assert.deepEqual(s.grupos.map((g) => g.sugerida), [4, 5])
})

test('o mesmo começo compara pelo radical: "site que demora" e "sites que demoram" são a mesma frase', () => {
  const s = sugere([
    [0, 'Site que demora demais espanta cliente.'],
    [5, 'Sites que demoram para carregar mandam o cliente embora.']
  ])
  assert.deepEqual(s.grupos.map((g) => g.indices), [[0, 1]])
})
