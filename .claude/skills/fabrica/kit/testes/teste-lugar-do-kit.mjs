// node --test .claude/skills/fabrica/kit/testes/teste-lugar-do-kit.mjs
//
// Classe de defeito: o kit que só se acha num lugar. Na raiz do workspace a
// cópia do kit é bagunça na pasta onde se navega, e ela mora fora de vista, em
// `.claude/fabrica/`. Os projetos usam `fabrica/`. O kit acha qual dos dois existe, e os
// dois ao mesmo tempo é erro: duas cópias descolam.
//
// mutação: kit/lib/conferidor.mjs · "if (achados.length > 1) {" → "if (false) {" · pega
// mutação: kit/lib/conferidor.mjs · "return basename(acima) === '.claude' ? dirname(acima) : acima" → "return acima" · pega

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { criar, apagar } from '../lib/temporaria.mjs'
import { pastaDoKit, raizDaPastaDoKit, lerStack, LUGARES_DO_KIT } from '../lib/conferidor.mjs'

function comKit (raiz, pasta) {
  mkdirSync(join(raiz, pasta), { recursive: true })
  writeFileSync(join(raiz, pasta, 'stack.mjs'), "export const STACK = 'node'\n")
}

test('os dois lugares do kit: o padrão e o fora de vista', () => {
  assert.deepEqual(LUGARES_DO_KIT, ['fabrica', '.claude/fabrica'])
})

test('kit em fabrica/: é ali que ele mora, e o stack se lê dali', async () => {
  const raiz = criar('fabrica-lugar-')
  try {
    comKit(raiz, 'fabrica')
    assert.deepEqual(pastaDoKit(raiz), { pasta: 'fabrica' })
    assert.equal((await lerStack(raiz)).stack.STACK, 'node')
  } finally { apagar(raiz) }
})

test('kit em .claude/fabrica/: fora de vista, e o stack se lê dali', async () => {
  const raiz = criar('fabrica-lugar-')
  try {
    comKit(raiz, '.claude/fabrica')
    assert.deepEqual(pastaDoKit(raiz), { pasta: '.claude/fabrica' })
    assert.equal((await lerStack(raiz)).stack.STACK, 'node')
  } finally { apagar(raiz) }
})

test('kit nos DOIS lugares é erro, e diz quais', async () => {
  const raiz = criar('fabrica-lugar-')
  try {
    comKit(raiz, 'fabrica')
    comKit(raiz, '.claude/fabrica')
    assert.match(pastaDoKit(raiz).erro, /fabrica[\s\S]*\.claude\/fabrica/)
    assert.match((await lerStack(raiz)).erro, /dois lugares/)
  } finally { apagar(raiz) }
})

test('sem kit nenhum, o erro diz onde procurou', async () => {
  const raiz = criar('fabrica-lugar-')
  try {
    assert.match(pastaDoKit(raiz).erro, /fabrica[\s\S]*\.claude\/fabrica/)
    assert.ok((await lerStack(raiz)).erro)
  } finally { apagar(raiz) }
})

test('a raiz do projeto: uma pasta acima do kit, ou duas se ele mora em .claude/', () => {
  assert.equal(raizDaPastaDoKit(join('C:', 'proj', 'fabrica')), join('C:', 'proj'))
  assert.equal(raizDaPastaDoKit(join('C:', 'workspace', '.claude', 'fabrica')), join('C:', 'workspace'))
  assert.equal(raizDaPastaDoKit(join('C:', 'projeto', 'python', 'fabrica')), join('C:', 'projeto', 'python'))
})
