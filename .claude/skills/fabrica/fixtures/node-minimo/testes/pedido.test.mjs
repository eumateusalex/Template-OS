import { test } from 'node:test'
import assert from 'node:assert/strict'

import { totalDoPedido } from '../src/dominio/pedido.mjs'
import { linhaDoTotal } from '../src/app/tela.mjs'
import { guardar, esquecerTudo } from '../src/infra/memoria.mjs'

test('totalDoPedido soma e aplica desconto', () => {
  assert.equal(totalDoPedido([{ centavos: 1000 }, { centavos: 500 }], 10), 1350)
})

test('linhaDoTotal escreve em reais', () => {
  assert.equal(linhaDoTotal([{ centavos: 1000 }]), 'Total: R$ 9.00')
})

test('guardar acumula', () => {
  esquecerTudo()
  assert.equal(guardar('a', 100), 100)
  assert.equal(guardar('a', 50), 150)
})
