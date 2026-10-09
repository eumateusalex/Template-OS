// node --test .claude/skills/fabrica/kit/testes/teste-temporaria.mjs
//
// Classe de defeito: EPERM ao apagar a pasta de um processo recém-morto no
// Windows: o passo "morto por tempo" do teste do portão deixa o cwd preso, e o
// `rmSync` do `finally` estoura "EPERM, Permission denied".
//
// ⚠️ O teste deste módulo não teve vermelho visto antes do código: a mutação
// abaixo é o que prova que ele mede.
//
// mutação: kit/lib/temporaria.mjs · "if (!existe(caminho)) return true" → "if (!existe(caminho)) return false" · pega

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, writeFileSync, mkdirSync, openSync, closeSync } from 'node:fs'
import { join } from 'node:path'

import { criar, apagar, comPasta } from '../lib/temporaria.mjs'

test('criar faz a pasta, e ela existe', () => {
  const raiz = criar('fabrica-tmp-')
  try {
    assert.ok(existsSync(raiz))
    assert.ok(raiz.includes('fabrica-tmp-'))
  } finally { apagar(raiz) }
})

test('apagar tira a pasta e diz que tirou', () => {
  const raiz = criar('fabrica-tmp-')
  writeFileSync(join(raiz, 'a.txt'), 'x')
  mkdirSync(join(raiz, 'sub'), { recursive: true })
  writeFileSync(join(raiz, 'sub', 'b.txt'), 'y')
  assert.equal(apagar(raiz), true)
  assert.equal(existsSync(raiz), false)
})

test('apagar em pasta que não existe é verdade, sem estourar', () => {
  // 🚨 A pasta-mãe deste caso se apaga no `finally`: sem isso, ele sozinho
  // deixa centenas de pastas `fabrica-*` em %TEMP% (460 de 577, medido).
  const mae = criar('fabrica-tmp-')
  try {
    assert.equal(apagar(join(mae, 'nao-existe')), true)
    assert.equal(apagar(''), true)
    assert.equal(apagar(null), true)
  } finally {
    assert.equal(apagar(mae), true, 'a pasta-mãe do caso vazou')
  }
})

/** Um disco em que a pasta nunca some: a exclusão pendente do Windows, sem depender da sorte. */
const PRESA = { existe: () => true, remover: () => {} }

function ouvindoErros (trabalho) {
  const gritos = []
  const original = console.error
  console.error = (t) => gritos.push(String(t))
  try { return { resultado: trabalho(), gritos } } finally { console.error = original }
}

test('apagar que NÃO drena devolve false e GRITA, com o caminho', () => {
  // ⚠️ Os chamadores ignoram o `false`, e o vazamento só apareceria contando
  // pastas no %TEMP%. Quem não drena avisa na hora.
  // ⚠️ O disco preso é simulado: neste Windows um arquivo aberto não prende a
  // pasta, e o caso de verdade nunca acontece aqui. Um teste que dependesse
  // dele passaria sem medir nada.
  const { resultado, gritos } = ouvindoErros(() => apagar('C:/lugar/preso', { prazoMs: 200, passoMs: 50, ...PRESA }))
  assert.equal(resultado, false)
  assert.ok(gritos.some((g) => g.includes('não drenou') && g.includes('C:/lugar/preso')), `calou: ${gritos.join(' | ')}`)
})

test('apagar calado de propósito não grita', () => {
  const { resultado, gritos } = ouvindoErros(() => apagar('C:/lugar/preso', { prazoMs: 200, passoMs: 50, calado: true, ...PRESA }))
  assert.equal(resultado, false)
  assert.deepEqual(gritos, [])
})

test('apagar NÃO trava para sempre quando o handle não solta', () => {
  const raiz = criar('fabrica-tmp-')
  const alvo = join(raiz, 'preso.txt')
  writeFileSync(alvo, 'x')
  const fd = openSync(alvo, 'r')
  const comecou = Date.now()
  try {
    const foi = apagar(raiz, { prazoMs: 600, passoMs: 80, calado: true })
    const levou = Date.now() - comecou
    assert.ok(levou < 3000, `devia desistir rápido, levou ${levou}ms`)
    assert.equal(typeof foi, 'boolean', 'tem que DIZER se conseguiu, nunca fingir que sim')
  } finally {
    closeSync(fd)
    apagar(raiz)
  }
})

test('apagar depois de o handle fechar consegue de verdade', () => {
  const raiz = criar('fabrica-tmp-')
  const alvo = join(raiz, 'preso.txt')
  writeFileSync(alvo, 'x')
  const fd = openSync(alvo, 'r')
  closeSync(fd)
  assert.equal(apagar(raiz, { prazoMs: 2000 }), true)
  assert.equal(existsSync(raiz), false)
})

test('comPasta devolve o resultado e apaga no fim', () => {
  let guardada = null
  const r = comPasta('fabrica-tmp-', (raiz) => {
    guardada = raiz
    writeFileSync(join(raiz, 'a.txt'), 'x')
    return 42
  })
  assert.equal(r, 42)
  assert.equal(existsSync(guardada), false)
})

test('comPasta apaga mesmo quando o trabalho estoura', () => {
  let guardada = null
  assert.throws(() => {
    comPasta('fabrica-tmp-', (raiz) => {
      guardada = raiz
      throw new Error('quebrou de propósito')
    })
  }, /quebrou de propósito/)
  assert.equal(existsSync(guardada), false)
})
