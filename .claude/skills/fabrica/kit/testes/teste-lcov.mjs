// node --test .claude/skills/fabrica/kit/testes/teste-lcov.mjs
//
// Classe de defeito: relatório de cobertura lido errado. Um parser só serve as
// três trilhas (node:test, vitest e coverage.py), porque as três sabem
// escrever lcov. Ler errado aqui é afirmar um número que ninguém mediu.
//
// mutação: kit/lib/lcov.mjs · "atual.linhas += Number(valor)" → "atual.linhas += 0" · pega

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { lerLcov } from '../lib/lcov.mjs'

const LCOV = [
  'TN:',
  'SF:src/a.ts',
  'DA:1,1',
  'LF:10',
  'LH:8',
  'end_of_record',
  'SF:src/b.ts',
  'LF:10',
  'LH:2',
  'end_of_record',
  ''
].join('\n')

test('lê os arquivos e soma as linhas', () => {
  const r = lerLcov(LCOV)
  assert.equal(r.arquivos.length, 2)
  assert.equal(r.linhas, 20)
  assert.equal(r.cobertas, 10)
})

test('calcula a porcentagem', () => {
  assert.equal(lerLcov(LCOV).porcentagem, 50)
})

test('guarda o caminho de cada arquivo, com barra normal', () => {
  const r = lerLcov('SF:src\\a.ts\nLF:4\nLH:2\nend_of_record\n')
  assert.equal(r.arquivos[0].caminho, 'src/a.ts')
})

test('lcov vazio devolve zero, e diz que está vazio', () => {
  const r = lerLcov('')
  assert.equal(r.linhas, 0)
  assert.equal(r.cobertas, 0)
  assert.equal(r.porcentagem, 0)
  assert.equal(r.vazio, true)
})

test('lcov sem LF nenhum é vazio, mesmo tendo SF', () => {
  const r = lerLcov('SF:src/a.ts\nend_of_record\n')
  assert.equal(r.vazio, true, 'arquivo listado sem linha medida não é cobertura')
})

test('não inventa 100% quando não há linha a cobrir', () => {
  const r = lerLcov('SF:src/a.ts\nLF:0\nLH:0\nend_of_record\n')
  assert.equal(r.porcentagem, 0, 'zero de zero não é cem por cento')
  assert.equal(r.vazio, true)
})

test('porcentagem com casa decimal', () => {
  const r = lerLcov('SF:src/a.ts\nLF:3\nLH:1\nend_of_record\n')
  assert.equal(r.porcentagem, 33.3)
})

test('linha solta que o parser não conhece não estraga a conta', () => {
  const r = lerLcov('SF:src/a.ts\nBRDA:1,0,0,1\nLF:4\nLH:4\nFNF:2\nend_of_record\n')
  assert.equal(r.linhas, 4)
  assert.equal(r.cobertas, 4)
  assert.equal(r.porcentagem, 100)
})
