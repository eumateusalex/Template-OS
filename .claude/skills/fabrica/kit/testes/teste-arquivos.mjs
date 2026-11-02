// node --test .claude/skills/fabrica/kit/testes/teste-arquivos.mjs
//
// Classe de defeito: varredor que lê comentário como se fosse código, e
// varredor que entra em node_modules e mede a biblioteca de terceiro em vez do
// projeto. Numa pasta `scripts/` comum, as centenas de linhas com travessão
// são quase todas comentário.
//
// mutação: kit/lib/arquivos.mjs · "if (c === '/' && d === '/') { emLinha = true" → "if (c === '/' && d === '/') { emLinha = false" · pega

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { andar, semComentario, IGNORAR_PADRAO } from '../lib/arquivos.mjs'

function projetoFalso () {
  const raiz = mkdtempSync(join(tmpdir(), 'fabrica-arquivos-'))
  mkdirSync(join(raiz, 'src'), { recursive: true })
  mkdirSync(join(raiz, 'node_modules', 'pacote'), { recursive: true })
  mkdirSync(join(raiz, '.git'), { recursive: true })
  writeFileSync(join(raiz, 'src', 'a.ts'), 'const a = 1\n')
  writeFileSync(join(raiz, 'src', 'b.py'), 'b = 2\n')
  writeFileSync(join(raiz, 'src', 'c.md'), '# titulo\n')
  writeFileSync(join(raiz, 'node_modules', 'pacote', 'z.ts'), 'const z = 9\n')
  writeFileSync(join(raiz, '.git', 'config'), 'x\n')
  return raiz
}

test('andar acha os arquivos e ignora node_modules e .git', () => {
  const raiz = projetoFalso()
  try {
    const achados = andar(raiz).sort()
    assert.ok(achados.includes('src/a.ts'), 'tinha que achar src/a.ts')
    assert.ok(achados.includes('src/b.py'))
    assert.ok(!achados.some((f) => f.includes('node_modules')), 'não pode entrar em node_modules')
    assert.ok(!achados.some((f) => f.includes('.git')), 'não pode entrar em .git')
  } finally { rmSync(raiz, { recursive: true, force: true }) }
})

test('andar filtra por extensão', () => {
  const raiz = projetoFalso()
  try {
    const achados = andar(raiz, { extensoes: ['.ts'] })
    assert.deepEqual(achados, ['src/a.ts'])
  } finally { rmSync(raiz, { recursive: true, force: true }) }
})

test('andar devolve caminho relativo com barra normal, mesmo no Windows', () => {
  const raiz = projetoFalso()
  try {
    for (const f of andar(raiz)) {
      assert.ok(!f.includes('\\'), `caminho com barra invertida: ${f}`)
      assert.ok(!f.startsWith('/'), `caminho absoluto: ${f}`)
    }
  } finally { rmSync(raiz, { recursive: true, force: true }) }
})

test('IGNORAR_PADRAO cobre as pastas que não são do projeto', () => {
  for (const p of ['node_modules', '.git', '.venv', 'dist', 'coverage']) {
    assert.ok(IGNORAR_PADRAO.includes(p), `faltou ${p}`)
  }
})

test('semComentario apaga // mas PRESERVA o número de linhas', () => {
  const texto = 'const a = 1\n// segredo aqui\nconst b = 2\n'
  const limpo = semComentario(texto, '.ts')
  assert.equal(limpo.split('\n').length, texto.split('\n').length, 'linha tem que continuar sendo a mesma')
  assert.ok(!limpo.includes('segredo'), 'o conteúdo do comentário tem que sumir')
  assert.ok(limpo.includes('const a = 1'))
  assert.ok(limpo.includes('const b = 2'))
})

test('semComentario apaga bloco /* */ preservando as linhas', () => {
  const texto = 'const a = 1\n/* linha um\nlinha dois */\nconst b = 2\n'
  const limpo = semComentario(texto, '.ts')
  assert.equal(limpo.split('\n').length, texto.split('\n').length)
  assert.ok(!limpo.includes('linha um'))
  assert.ok(limpo.includes('const b = 2'))
})

test('semComentario NÃO apaga // dentro de string', () => {
  const texto = 'const url = "https://exemplo.com/a"\n'
  const limpo = semComentario(texto, '.ts')
  assert.ok(limpo.includes('exemplo.com'), '// dentro de string não é comentário')
})

test('semComentario entende # do Python e preserva linhas', () => {
  const texto = 'a = 1\n# segredo aqui\nb = 2\n'
  const limpo = semComentario(texto, '.py')
  assert.equal(limpo.split('\n').length, texto.split('\n').length)
  assert.ok(!limpo.includes('segredo'))
  assert.ok(limpo.includes('b = 2'))
})

test('semComentario entende <!-- --> do markdown', () => {
  const texto = 'titulo\n<!-- número vivo: razão -->\ntexto\n'
  const limpo = semComentario(texto, '.md')
  assert.equal(limpo.split('\n').length, texto.split('\n').length)
  assert.ok(!limpo.includes('número vivo'))
})
