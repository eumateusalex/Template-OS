// Prova de que o servidor de um projeto novo não carrega ferramenta de desenvolvimento.
//
// Por que existe: o passo `auditoria` do portão do projeto roda
// `npm audit --omit=dev`, e conta só o que vai para o runtime. O CLI `shadcn`
// traz 6 altas, todas do `braces` 3.0.3 (pelo `fast-glob` e o `ts-morph` dele).
// O CLI só roda na mão (`shadcn add`) e o `shadcn/tailwind.css` só o build lê:
// declarado em `dependencies`, todo projeto novo nasceria com o CI vermelho.
//
// O lockfile da fixture do bloco B tem que concordar com a semente na raiz:
// sem isso, o `npm ci` do bloco B quebra, e a quebra só aparece na release.
//
// Uso:  node .claude/skills/novo-projeto/esqueleto/testes/teste-dependencias.mjs
// mutação: .claude/skills/novo-projeto/esqueleto/kit/semente/app/package.json · ""server-only": "0.0.1"," → ""server-only": "0.0.1", "shadcn": "4.21.0"," · pega em 09/10/2026
//
// ⚠️ A mutação se reexecuta numa cópia, no C6 do `teste-fundacao.mjs`, e não
// pelo `mutar.mjs` da fábrica: ele recusa arquivo já modificado na árvore, e a
// cópia não depende do estado da semente.

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ESQUELETO = dirname(dirname(fileURLToPath(import.meta.url)))
const SEMENTE = join(ESQUELETO, 'kit', 'semente', 'app', 'package.json')
const FIXTURE = join(ESQUELETO, 'fixtures', 'app-minimo', 'package-lock.json')

let ok = 0
let falhou = 0

function caso (nome, trabalho) {
  let erro
  try { erro = trabalho() } catch (e) { erro = `explodiu: ${e.stack}` }
  if (erro) { console.log(`  ❌ ${nome}\n     ${erro}`); falhou += 1 } else { console.log(`  ✅ ${nome}`); ok += 1 }
}

const json = (f) => JSON.parse(readFileSync(f, 'utf8'))
const ordenado = (o = {}) => JSON.stringify(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)))

/** O que o `npm audit --omit=dev` lê: todo pacote do lockfile que não é só de desenvolvimento. */
function runtimeDo (lock) {
  return new Set(Object.entries(lock.packages)
    .filter(([caminho, p]) => caminho !== '' && !p.dev)
    .map(([caminho]) => caminho.split('node_modules/').pop()))
}

console.log('\n  teste das dependências da semente')

caso('o CLI do shadcn é de desenvolvimento na semente, com a versão fixa', () => {
  const p = json(SEMENTE)
  if (p.dependencies?.shadcn) return `o shadcn está em dependencies (${p.dependencies.shadcn}): o npm audit --omit=dev do projeto conta o CLI inteiro`
  const v = p.devDependencies?.shadcn
  if (!v) return 'o shadcn sumiu da semente: o globals.css importa shadcn/tailwind.css e o build quebra'
  return /^\d+\.\d+\.\d+$/.test(v) ? null : `versão sem fixar: ${v}`
})

caso('o lockfile da fixture declara na raiz o mesmo que a semente (o npm ci do bloco B)', () => {
  const p = json(SEMENTE)
  const raiz = json(FIXTURE).packages['']
  const erros = []
  if (ordenado(raiz.dependencies) !== ordenado(p.dependencies)) erros.push('dependencies diferem')
  if (ordenado(raiz.devDependencies) !== ordenado(p.devDependencies)) erros.push('devDependencies diferem')
  return erros.length ? `${erros.join(' e ')}: regenere o lockfile da fixture` : null
})

caso('o runtime da fixture não leva o CLI do shadcn', () => {
  const runtime = runtimeDo(json(FIXTURE))
  if (!runtime.has('next')) return 'o runtime não tem o next: a leitura do lockfile está errada'
  return runtime.has('shadcn') ? 'o shadcn está no runtime do lockfile da fixture' : null
})

console.log(`\n  ${ok} passaram, ${falhou} falharam\n`)
process.exit(falhou ? 1 : 0)
