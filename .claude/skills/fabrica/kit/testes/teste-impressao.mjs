// node --test .claude/skills/fabrica/kit/testes/teste-impressao.mjs
//
// Classe de defeito: manifesto byte a byte que acusa o inocente ao atravessar
// sistema operacional: arquivos do kit acusam "difere do sha256" no runner
// Linux com o conteúdo idêntico (12 de 50 num CI real).
// A causa é o `core.autocrlf` do git.
//
// mutação: kit/lib/impressao.mjs · "texto.split('\r\n').join('\n')" → "texto" · pega
//
// ⚠️ O trecho vai LITERAL, do jeito que está no fonte: comentário não interpreta
// escape, e um registro escrito com barra dupla (`\\r\\n`) aponta para trecho que
// não existe. O conferidor `mutacoes` acusa, e é para isso que ele confere se o
// "de" ainda existe.
// mutação: kit/lib/impressao.mjs · "|css|xml|svg|csv)$/i" → "|css)$/i" · pega

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { criar, apagar } from '../lib/temporaria.mjs'
import { impressaoDe, semCarrinho, ehTexto } from '../lib/impressao.mjs'

test('o MESMO texto com CRLF e com LF tem a mesma impressão', () => {
  const raiz = criar('fabrica-impressao-')
  try {
    const comLf = join(raiz, 'a.mjs')
    const comCrlf = join(raiz, 'b.mjs')
    writeFileSync(comLf, 'const a = 1\nconst b = 2\n')
    writeFileSync(comCrlf, 'const a = 1\r\nconst b = 2\r\n')
    assert.equal(impressaoDe(comLf), impressaoDe(comCrlf))
  } finally { apagar(raiz) }
})

test('texto DIFERENTE continua tendo impressão diferente', () => {
  const raiz = criar('fabrica-impressao-')
  try {
    const um = join(raiz, 'a.mjs')
    const outro = join(raiz, 'b.mjs')
    writeFileSync(um, 'const a = 1\n')
    writeFileSync(outro, 'const a = 2\n')
    assert.notEqual(impressaoDe(um), impressaoDe(outro))
  } finally { apagar(raiz) }
})

test('um byte a mais no fim muda a impressão', () => {
  const raiz = criar('fabrica-impressao-')
  try {
    const um = join(raiz, 'a.mjs')
    const outro = join(raiz, 'b.mjs')
    writeFileSync(um, 'const a = 1\n')
    writeFileSync(outro, 'const a = 1\n\n')
    assert.notEqual(impressaoDe(um), impressaoDe(outro))
  } finally { apagar(raiz) }
})

test('TODA extensão de texto do kit é normalizada: xml incluído', () => {
  // 🚨 Os relatórios de runner que o kit carrega como fixture (`.xml` do junit)
  // se gravam com CRLF no Windows. Com o `.xml` fora da lista, o Linux do CI lê
  // LF, e o conferidor `kit` acusa "alguém editou o kit" num arquivo que
  // ninguém tocou.
  for (const ext of ['xml', 'json', 'md', 'mjs', 'yml', 'txt']) {
    assert.equal(ehTexto(`a.${ext}`), true, `.${ext} é texto e tem que ser normalizado`)
  }
  const raiz = criar('fabrica-impressao-')
  try {
    writeFileSync(join(raiz, 'crlf.xml'), '<a>\r\n<b/>\r\n</a>\r\n')
    writeFileSync(join(raiz, 'lf.xml'), '<a>\n<b/>\n</a>\n')
    assert.equal(impressaoDe(join(raiz, 'crlf.xml')), impressaoDe(join(raiz, 'lf.xml')))
  } finally { apagar(raiz) }
})

test('arquivo BINÁRIO não é normalizado', () => {
  const raiz = criar('fabrica-impressao-')
  try {
    const png = join(raiz, 'a.png')
    const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    writeFileSync(png, bytes)
    assert.equal(ehTexto(png), false, 'png não é texto')
    // a impressão é a dos bytes crus, sem troca de 0D 0A
    assert.equal(impressaoDe(png).length, 64)
  } finally { apagar(raiz) }
})

test('semCarrinho devolve o MESMO buffer quando não há CRLF', () => {
  const bytes = Buffer.from('sem carrinho aqui\n', 'utf8')
  assert.equal(semCarrinho(bytes), bytes, 'sem CRLF, nada a fazer')
})

test('semCarrinho troca todos os CRLF, não só o primeiro', () => {
  const r = semCarrinho(Buffer.from('a\r\nb\r\nc\r\n', 'utf8')).toString('utf8')
  assert.equal(r, 'a\nb\nc\n')
  assert.ok(!r.includes('\r'))
})

test('semCarrinho não mexe em CR sozinho', () => {
  const r = semCarrinho(Buffer.from('a\rb\r\nc', 'utf8')).toString('utf8')
  assert.equal(r, 'a\rb\nc')
})

test('ehTexto conhece as extensões do kit, e recusa o resto', () => {
  for (const f of ['a.mjs', 'b.md', 'c.json', 'd.yml', 'e.py', 'f.txt']) {
    assert.equal(ehTexto(f), true, `${f} devia ser texto`)
  }
  for (const f of ['a.png', 'b.woff2', 'c.zip', 'd']) {
    assert.equal(ehTexto(f), false, `${f} não devia ser texto`)
  }
})
