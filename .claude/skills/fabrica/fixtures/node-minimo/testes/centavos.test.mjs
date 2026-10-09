// node --test
//
// mutação: src/compartilhado/centavos.mjs · "Math.round((centavos * porcento) / 100)" → "Math.floor((centavos * porcento) / 100)" · pega em 09/10/2026

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { somar, comDesconto } from '../src/compartilhado/centavos.mjs'

test('somar junta centavos', () => {
  assert.equal(somar(1050, 299), 1349)
})

test('comDesconto arredonda para o centavo mais próximo', () => {
  assert.equal(comDesconto(1005, 10), 904)
  assert.equal(comDesconto(100, 50), 50)
})
