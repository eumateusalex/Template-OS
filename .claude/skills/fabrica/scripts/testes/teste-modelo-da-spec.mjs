// node --test .claude/skills/fabrica/scripts/testes/teste-modelo-da-spec.mjs
//
// Classe de defeito: a mesma regra escrita em dois lugares, e os dois
// divergindo: a tabela do `spec-modelo.md` diz "sim" a uma seção em G, o
// conferidor `specs` não a cobra, e uma spec G passa sem ela.
//
// A régua: a tabela do modelo é a fonte. Toda seção marcada "sim" num tamanho é
// exatamente o que o `SECOES` do conferidor cobra nesse tamanho, nem mais nem
// menos.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { SECOES } from '../../kit/portao/specs.mjs'

const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const MODELO = join(SKILL, 'templates', 'spec-modelo.md')

/** As seções marcadas "sim" em cada tamanho, lidas da tabela do modelo. */
function exigidasPeloModelo () {
  const linhas = readFileSync(MODELO, 'utf8').split(/\r?\n/)
  const inicio = linhas.findIndex((l) => /^\s*\|\s*Seção\s*\|\s*P\s*\|\s*M\s*\|\s*G\s*\|/.test(l))
  assert.notEqual(inicio, -1, 'a tabela de seções por tamanho sumiu do modelo')
  const exigidas = { P: [], M: [], G: [] }
  for (const linha of linhas.slice(inicio + 2)) {
    if (!/^\s*\|/.test(linha)) break
    const [secao, p, m, g] = linha.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
    if (p === 'sim') exigidas.P.push(secao)
    if (m === 'sim') exigidas.M.push(secao)
    if (g === 'sim') exigidas.G.push(secao)
  }
  return exigidas
}

test('as seções que o conferidor cobra por tamanho são as que a tabela do modelo marca com sim', () => {
  const doModelo = exigidasPeloModelo()
  for (const tamanho of ['P', 'M', 'G']) {
    assert.ok(doModelo[tamanho].length > 0, `a tabela do modelo não marca nenhuma seção em ${tamanho}`)
    assert.deepEqual([...SECOES[tamanho]].sort(), [...doModelo[tamanho]].sort(), `tamanho ${tamanho}`)
  }
})
