// Quem importa quem: a base do conferidor de camadas.
//
// Classe de defeito que ele impede: leitor de import que não vê o import
// MULTILINHA: um import de várias linhas escapa do grep de linha, e a esteira
// roda com o publicador velho. Grep de linha não serve aqui.
//
// ⚠️ Import montado com string (`import(caminho)`) não se resolve, e o
// conferidor declara isso como "não medido" em vez de fingir que não existe.
//
// Prova: testes/teste-importacoes.mjs

import { semComentario, linhasDe } from './arquivos.mjs'

// `from '...'` cobre import, export-from e import multilinha: o que importa é
// o `from`, e ele vem depois das chaves, na mesma expressão.
const RE_DE = /\bfrom\s+['"`]([^'"`\n]+)['"`]/g
const RE_EFEITO = /(?:^|[\n;])\s*import\s+['"`]([^'"`\n]+)['"`]/g
const RE_DINAMICO = /\bimport\s*\(\s*['"`]([^'"`\n]+)['"`]\s*\)/g
const RE_REQUIRE = /\brequire\s*\(\s*['"`]([^'"`\n]+)['"`]\s*\)/g

const RE_PY_DE = /(?:^|\n)\s*from\s+([.\w]+)\s+import\b/g
const RE_PY_IMPORT = /(?:^|\n)\s*import\s+([.\w]+)/g

const EXTERNO = /^(node:|bun:|https?:)/

function linhaDe (texto, indice) {
  return texto.slice(0, indice).split('\n').length
}

/**
 * @returns {{ alvo: string, linha: number }[]}
 */
export function importacoesDe (texto, extensao = '.ts') {
  const limpo = semComentario(texto, extensao)
  const achados = []
  const vistos = new Set()

  const regras = String(extensao).toLowerCase().endsWith('.py')
    ? [RE_PY_DE, RE_PY_IMPORT]
    : [RE_DE, RE_EFEITO, RE_DINAMICO, RE_REQUIRE]

  for (const re of regras) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(limpo)) !== null) {
      const chave = `${m.index}:${m[1]}`
      if (vistos.has(chave)) continue
      vistos.add(chave)
      achados.push({ alvo: m[1], linha: linhaDe(limpo, m.index) })
    }
  }

  return achados.sort((a, b) => a.linha - b.linha)
}

function normalizar (caminho) {
  const partes = []
  for (const parte of caminho.split('/')) {
    if (parte === '' || parte === '.') continue
    if (parte === '..') partes.pop()
    else partes.push(parte)
  }
  return partes.join('/')
}

/**
 * Onde este import cai, em caminho relativo à raiz do projeto.
 * @returns {string|null} null quando é pacote de fora
 */
export function resolverAlvo (alvo, arquivo, apelidos = {}, stack = 'node') {
  if (!alvo) return null
  if (EXTERNO.test(alvo)) return null

  if (stack === 'python') {
    if (alvo.startsWith('.')) {
      const subidas = alvo.match(/^\.+/)[0].length
      const resto = alvo.slice(subidas).replace(/\./g, '/')
      const base = arquivo.split('/').slice(0, -subidas).join('/')
      return normalizar(`${base}/${resto}`)
    }
    return alvo.replace(/\./g, '/')
  }

  for (const [apelido, destino] of Object.entries(apelidos)) {
    if (alvo.startsWith(apelido)) {
      return normalizar(destino + alvo.slice(apelido.length))
    }
  }

  if (!alvo.startsWith('.')) return null

  const base = arquivo.split('/').slice(0, -1).join('/')
  return normalizar(`${base}/${alvo}`)
}

/** As importações de um arquivo, já resolvidas. */
export function grafoDe (texto, arquivo, { extensao = '.ts', apelidos = {}, stack = 'node' } = {}) {
  return importacoesDe(texto, extensao).map((imp) => ({
    ...imp,
    destino: resolverAlvo(imp.alvo, arquivo, apelidos, stack)
  }))
}

export { linhasDe }
