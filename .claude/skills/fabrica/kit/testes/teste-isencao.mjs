// node --test .claude/skills/fabrica/kit/testes/teste-isencao.mjs
//
// Classe de defeito: isenção virar válvula de escape. A isenção é declarada
// AO LADO da linha, com razão escrita, porque "lista de exceção envelhece". Sem razão obrigatória, a marca vira um
// carimbo que qualquer um cola.
//
// mutação: kit/lib/isencao.mjs · "razao.length < RAZAO_MINIMA" → "razao.length < 0" · pega
// mutação: kit/lib/isencao.mjs · "if (j > i && (ITEM.test(linhas[j]) || !/^\s+\S/.test(linhas[j]))) break" → "if (j > i) break" · pega

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { isento, isentoNoItem, MARCAS } from '../lib/isencao.mjs'

test('isenção na MESMA linha, com razão, isenta', () => {
  const linhas = ['import { x } from "../a" // camada declarada: o contrato vive lá']
  const r = isento(linhas, 0, 'camada declarada')
  assert.equal(r.isento, true)
  assert.match(r.razao, /contrato vive lá/)
})

test('isenção na linha DE CIMA, com razão, isenta', () => {
  const linhas = ['// camada declarada: o contrato vive lá', 'import { x } from "../a"']
  assert.equal(isento(linhas, 1, 'camada declarada').isento, true)
})

test('isenção duas linhas acima NÃO isenta', () => {
  const linhas = ['// camada declarada: razão boa', '', 'import { x } from "../a"']
  assert.equal(isento(linhas, 2, 'camada declarada').isento, false)
})

test('isenção sem razão NÃO isenta', () => {
  const linhas = ['import { x } from "../a" // camada declarada:']
  const r = isento(linhas, 0, 'camada declarada')
  assert.equal(r.isento, false)
  assert.match(r.porque, /razão/i)
})

test('isenção com razão curta NÃO isenta', () => {
  const linhas = ['import { x } from "../a" // camada declarada: ok']
  assert.equal(isento(linhas, 0, 'camada declarada').isento, false)
})

test('marca diferente não isenta', () => {
  const linhas = ['x = 1 // silêncio declarado: razão boa aqui']
  assert.equal(isento(linhas, 0, 'camada declarada').isento, false)
})

test('funciona com # do Python', () => {
  const linhas = ['from a import x  # camada declarada: o contrato vive lá']
  assert.equal(isento(linhas, 0, 'camada declarada').isento, true)
})

test('funciona com <!-- --> do markdown', () => {
  const linhas = ['Hoje são 34 conferidores <!-- número vivo: o portao --listar responde -->']
  assert.equal(isento(linhas, 0, 'número vivo').isento, true)
})

test('aceita a marca sem acento, porque teclado erra', () => {
  const linhas = ['x = 1 // silencio declarado: a falha é esperada aqui']
  assert.equal(isento(linhas, 0, 'silêncio declarado').isento, true)
})

test('MARCAS traz as marcas do kit, e todas em minúscula', () => {
  for (const m of ['camada declarada', 'silêncio declarado', 'tamanho declarado', 'sem teste declarado', 'número vivo']) {
    assert.ok(MARCAS.includes(m), `faltou a marca ${m}`)
  }
  for (const m of MARCAS) assert.equal(m, m.toLowerCase())
})

test('isentoNoItem NÃO deixa a isenção do item de cima vazar para o de baixo', () => {
  // 🚨 `T141` passaria sem recibo porque `T140`, a linha acima, termina com
  // `sem teste declarado: <razão>`. Em código a linha de cima é o comentário da
  // linha; numa LISTA, a linha de cima é outro item, e cada tarefa dispensada
  // dispensaria a seguinte de graça.
  const linhas = [
    '- [x] T140 código: `a.mjs` · sem teste declarado: é parâmetro do projeto',
    '- [x] T141 código: `b.mjs`'
  ]
  assert.equal(isentoNoItem(linhas, 1, 'sem teste declarado').isento, false)
  // ⚠️ O par: o `isento` genérico continua vazando, e isso é CERTO para código.
  assert.equal(isento(linhas, 1, 'sem teste declarado').isento, true)
})

test('isentoNoItem aceita a isenção no PRÓPRIO item', () => {
  const linhas = ['- [x] T141 código: `b.mjs` · sem teste declarado: documento, sem lógica']
  assert.equal(isentoNoItem(linhas, 0, 'sem teste declarado').isento, true)
})

test('isentoNoItem aceita a isenção na continuação INDENTADA do item', () => {
  // Sem isto o conserto quebraria rastro que já existe: tarefa com razão longa
  // leva a razão na linha seguinte.
  const linhas = [
    '- [ ] T150 bloqueado: gancho nas duas skills',
    '      sem teste declarado: bloqueado por gesto de outra sessão; nada foi escrito',
    '- [x] T151 código: `c.mjs`'
  ]
  assert.equal(isentoNoItem(linhas, 0, 'sem teste declarado').isento, true)
  assert.equal(isentoNoItem(linhas, 2, 'sem teste declarado').isento, false)
})

test('isentoNoItem para na linha em branco, e não atravessa a lista inteira', () => {
  const linhas = [
    '- [x] T160 código: `d.mjs`',
    '',
    '      sem teste declarado: isto aqui é de outra seção, e não isenta nada'
  ]
  assert.equal(isentoNoItem(linhas, 0, 'sem teste declarado').isento, false)
})

test('isentoNoItem exige razão, igual ao isento', () => {
  const linhas = ['- [x] T141 código: `b.mjs` · sem teste declarado:']
  const r = isentoNoItem(linhas, 0, 'sem teste declarado')
  assert.equal(r.isento, false)
  assert.match(r.porque, /sem razão escrita/)
})

test('"vermelho não visto" é marca do kit, e exige razão como as outras', () => {
  // A declaração honesta de que o vermelho de uma tarefa não foi visto: ela
  // fica contável no provas.md, em vez de virar linha forjada.
  assert.ok(MARCAS.includes('vermelho não visto'))
  const linhas = ['- T002 · vermelho não visto: o teste é de banco e a bancada não sobe aqui']
  assert.equal(isentoNoItem(linhas, 0, 'vermelho não visto').isento, true)
  assert.equal(isentoNoItem(['- T002 · vermelho não visto:'], 0, 'vermelho não visto').isento, false)
})
