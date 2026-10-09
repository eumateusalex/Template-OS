// node --test .claude/skills/fabrica/kit/testes/teste-importacoes.mjs
//
// Classe de defeito: leitor de import que não vê o import multilinha. Um
// `publicar-video.js` que importa o `publicar.js` num import de várias linhas
// escapa do grep de linha, e o publicador de vídeo roda com a versão velha.
//
// A mutação abaixo NÃO cita a regex, de propósito. Citar regex numa linha de
// registro é pedir para o escape morrer no caminho, e o provar-mutacoes acusa
// dizendo "o trecho não existe".
// Trecho de mutação se escolhe simples, sem aspas nem barra.
//
// mutação: kit/lib/importacoes.mjs · "if (!alvo.startsWith('.')) return null" → "if (!alvo.startsWith('.')) return alvo" · pega

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { importacoesDe, resolverAlvo } from '../lib/importacoes.mjs'

const alvos = (texto, ext = '.ts') => importacoesDe(texto, ext).map((x) => x.alvo)

test('import simples', () => {
  assert.deepEqual(alvos("import x from './a.js'\n"), ['./a.js'])
})

test('import com chaves', () => {
  assert.deepEqual(alvos("import { a, b } from '../lib/x.mjs'\n"), ['../lib/x.mjs'])
})

test('import MULTILINHA é visto', () => {
  const texto = "import {\n  alfa,\n  beta\n} from '../modulos/a/index.ts'\n"
  assert.deepEqual(alvos(texto), ['../modulos/a/index.ts'])
})

test('export ... from também é importação', () => {
  assert.deepEqual(alvos("export { a } from './b.ts'\n"), ['./b.ts'])
})

test('import dinâmico', () => {
  assert.deepEqual(alvos("const m = await import('./c.mjs')\n"), ['./c.mjs'])
})

test('require', () => {
  assert.deepEqual(alvos("const p = require('./d.js')\n"), ['./d.js'])
})

test('import sem nome (só efeito) conta', () => {
  assert.deepEqual(alvos("import './estilo.css'\n"), ['./estilo.css'])
})

test('a LINHA de cada import vem junto', () => {
  const texto = "const a = 1\nimport x from './a.js'\n"
  assert.equal(importacoesDe(texto, '.ts')[0].linha, 2)
})

test('import dentro de COMENTÁRIO não conta', () => {
  assert.deepEqual(alvos("// import x from './velho.js'\nconst a = 1\n"), [])
})

test('Python: from a.b import c', () => {
  assert.deepEqual(alvos('from modulos.a import coisa\n', '.py'), ['modulos.a'])
})

test('Python: import a.b', () => {
  assert.deepEqual(alvos('import modulos.a\n', '.py'), ['modulos.a'])
})

test('Python: from ..a import c (relativo)', () => {
  assert.deepEqual(alvos('from ..dominio import x\n', '.py'), ['..dominio'])
})

test('resolverAlvo resolve relativo a partir do arquivo', () => {
  assert.equal(resolverAlvo('../a/x.ts', 'src/modulos/b/index.ts', {}), 'src/modulos/a/x.ts')
  assert.equal(resolverAlvo('./y.ts', 'src/modulos/b/index.ts', {}), 'src/modulos/b/y.ts')
})

test('resolverAlvo resolve apelido', () => {
  assert.equal(resolverAlvo('@/modulos/a', 'src/app/p.ts', { '@/': 'src/' }), 'src/modulos/a')
})

test('resolverAlvo devolve null para pacote de fora', () => {
  assert.equal(resolverAlvo('react', 'src/app/p.ts', { '@/': 'src/' }), null)
  assert.equal(resolverAlvo('node:fs', 'src/app/p.ts', {}), null)
})

test('resolverAlvo resolve import de pacote do Python', () => {
  assert.equal(resolverAlvo('modulos.a', 'src/app/p.py', {}, 'python'), 'modulos/a')
})
