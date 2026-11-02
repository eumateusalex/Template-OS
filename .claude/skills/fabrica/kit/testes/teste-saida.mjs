// node --test .claude/skills/fabrica/kit/testes/teste-saida.mjs
//
// Classe de defeito: relatório que aprova sem ter medido nada. É o princípio VI
// da constituição, e o defeito real de um `npm run auditar` que anuncia "tudo
// conforme" com o CLI falhando por inteiro.
//
// mutação: kit/lib/saida.mjs · "this.varridos === 0" → "false" · pega

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { Relatorio } from '../lib/saida.mjs'

function mudo () {
  const linhas = []
  return { linhas, escreve: (t) => linhas.push(t) }
}

test('sem achado e com arquivo varrido: fecha verde', () => {
  const s = mudo()
  const r = new Relatorio('teste', { escreve: s.escreve })
  r.varreu(3)
  assert.equal(r.fechar(), 0)
  assert.match(s.linhas.join('\n'), /3/)
})

test('com achado: fecha vermelho e imprime local, defeito e conserto', () => {
  const s = mudo()
  const r = new Relatorio('teste', { escreve: s.escreve })
  r.varreu(3)
  r.achado('src/a.ts:12', 'segredo em arquivo versionado', 'mover para o ambiente')
  assert.equal(r.fechar(), 1)
  const texto = s.linhas.join('\n')
  assert.match(texto, /src\/a\.ts:12/)
  assert.match(texto, /segredo em arquivo versionado/)
  assert.match(texto, /mover para o ambiente/)
})

test('zero arquivo varrido é VERMELHO, mesmo sem achado', () => {
  const s = mudo()
  const r = new Relatorio('teste', { escreve: s.escreve })
  r.varreu(0)
  assert.equal(r.fechar(), 1, 'verde medindo zero tem que ser vermelho')
  assert.match(s.linhas.join('\n'), /nada foi medido/i)
})

test('nunca ter chamado varreu também é VERMELHO', () => {
  const s = mudo()
  const r = new Relatorio('teste', { escreve: s.escreve })
  assert.equal(r.fechar(), 1, 'ausência de medida não é conformidade')
})

test('não medido é reprovação, com a razão impressa', () => {
  const s = mudo()
  const r = new Relatorio('teste', { escreve: s.escreve })
  r.varreu(10)
  r.naoMedido('o tsconfig.json não tem paths; alias não resolvido')
  assert.equal(r.fechar(), 1)
  assert.match(s.linhas.join('\n'), /não medido/i)
  assert.match(s.linhas.join('\n'), /alias não resolvido/)
})

test('catraca: piorou reprova, citando os dois números', () => {
  const s = mudo()
  const r = new Relatorio('teste', { escreve: s.escreve })
  r.varreu(5)
  const piorou = r.catraca('arquivos grandes', 17, 16)
  assert.equal(piorou, false)
  assert.equal(r.fechar(), 1)
  assert.match(s.linhas.join('\n'), /17/)
  assert.match(s.linhas.join('\n'), /16/)
})

test('catraca: igual passa, sem sugerir nada', () => {
  const s = mudo()
  const r = new Relatorio('teste', { escreve: s.escreve })
  r.varreu(5)
  assert.equal(r.catraca('arquivos grandes', 16, 16), true)
  assert.equal(r.fechar(), 0)
  assert.doesNotMatch(s.linhas.join('\n'), /pode descer/)
})

test('catraca: melhorou passa e sugere o piso novo', () => {
  const s = mudo()
  const r = new Relatorio('teste', { escreve: s.escreve })
  r.varreu(5)
  assert.equal(r.catraca('arquivos grandes', 12, 16), true)
  assert.equal(r.fechar(), 0)
  assert.match(s.linhas.join('\n'), /pode descer para 12/)
})

test('catraca sem piso declarado é VERMELHO: sem linha de base não se mede', () => {
  const s = mudo()
  const r = new Relatorio('teste', { escreve: s.escreve })
  r.varreu(5)
  assert.equal(r.catraca('arquivos grandes', 12, undefined), false)
  assert.equal(r.fechar(), 1)
  assert.match(s.linhas.join('\n'), /sem linha de base/i)
})
