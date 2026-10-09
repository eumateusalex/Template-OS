// Andar na árvore do projeto e ler arquivo sem o que está comentado.
//
// Classe de defeito que ele impede: varredor que mede a biblioteca de terceiro
// em vez do projeto, e varredor que acusa o que está dentro de um comentário.
// Numa pasta `scripts/` comum, as centenas de linhas com travessão são quase
// todas comentário de código.
//
// 🚨 `semComentario` PRESERVA o número de linhas, trocando o conteúdo do
// comentário por espaço. Conferidor reporta `arquivo:linha`, e linha que anda
// é achado que não se acha.
//
// Prova: testes/teste-arquivos.mjs

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export const IGNORAR_PADRAO = [
  'node_modules', '.git', '.venv', 'venv', 'env',
  'dist', 'build', 'out', 'coverage', '.next', '.nuxt', '.astro', '.turbo',
  '__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache',
  '.claude', '.medicoes', 'lixeira', 'rascunho'
]

const CERQUILHA = ['.py', '.sh', '.bash', '.yml', '.yaml', '.toml', '.cfg', '.ini', '.conf']
const MARCACAO = ['.md', '.markdown', '.html', '.htm', '.xml', '.svg']

/**
 * Lista os arquivos abaixo de `raiz`, em caminho relativo com barra normal.
 * @param {string} raiz
 * @param {{ extensoes?: string[], ignorar?: string[] }} opcoes
 * @returns {string[]}
 */
export function andar (raiz, { extensoes = [], ignorar = IGNORAR_PADRAO } = {}) {
  const achados = []
  const desce = (dir, prefixo) => {
    let itens
    try {
      itens = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const item of itens) {
      if (ignorar.includes(item.name)) continue
      const rel = prefixo ? `${prefixo}/${item.name}` : item.name
      if (item.isDirectory()) {
        desce(join(dir, item.name), rel)
      } else if (item.isFile()) {
        if (extensoes.length > 0 && !extensoes.some((e) => item.name.toLowerCase().endsWith(e))) continue
        achados.push(rel)
      }
    }
  }
  desce(raiz, '')
  return achados
}

/** Lê o arquivo como texto, devolvendo '' quando não dá para ler. */
export function ler (caminho) {
  try {
    return readFileSync(caminho, 'utf8')
  } catch {
    return ''
  }
}

/** As linhas do texto, sem o `\r` do Windows. */
export function linhasDe (texto) {
  return texto.replace(/\r\n/g, '\n').split('\n')
}

/**
 * Apaga o conteúdo dos comentários, preservando o número de linhas e as
 * colunas. String não é comentário, mesmo quando tem `//` dentro.
 */
export function semComentario (texto, extensao = '.ts') {
  const e = String(extensao).toLowerCase()
  if (MARCACAO.some((x) => e.endsWith(x))) return semMarcacao(texto)
  if (CERQUILHA.some((x) => e.endsWith(x))) return semCerquilha(texto)
  return semBarras(texto)
}

function semBarras (texto) {
  let fora = ''
  let i = 0
  let emString = null
  let emLinha = false
  let emBloco = false
  while (i < texto.length) {
    const c = texto[i]
    const d = texto[i + 1]
    if (emLinha) {
      if (c === '\n') { emLinha = false; fora += c } else { fora += ' ' }
      i += 1
      continue
    }
    if (emBloco) {
      if (c === '*' && d === '/') { emBloco = false; fora += '  '; i += 2; continue }
      fora += c === '\n' ? '\n' : ' '
      i += 1
      continue
    }
    if (emString) {
      if (c === '\\') { fora += c + (d ?? ''); i += 2; continue }
      if (c === emString) emString = null
      fora += c
      i += 1
      continue
    }
    if (c === '/' && d === '/') { emLinha = true; fora += '  '; i += 2; continue }
    if (c === '/' && d === '*') { emBloco = true; fora += '  '; i += 2; continue }
    if (c === "'" || c === '"' || c === '`') { emString = c; fora += c; i += 1; continue }
    fora += c
    i += 1
  }
  return fora
}

function semCerquilha (texto) {
  let fora = ''
  let i = 0
  let emString = null
  let emLinha = false
  while (i < texto.length) {
    const c = texto[i]
    if (emLinha) {
      if (c === '\n') { emLinha = false; fora += c } else { fora += ' ' }
      i += 1
      continue
    }
    if (emString) {
      if (c === '\\') { fora += c + (texto[i + 1] ?? ''); i += 2; continue }
      if (texto.startsWith(emString, i)) { fora += emString; i += emString.length; emString = null; continue }
      fora += c
      i += 1
      continue
    }
    if (texto.startsWith("'''", i) || texto.startsWith('"""', i)) {
      emString = texto.slice(i, i + 3)
      fora += emString
      i += 3
      continue
    }
    if (c === "'" || c === '"') { emString = c; fora += c; i += 1; continue }
    if (c === '#') { emLinha = true; fora += ' '; i += 1; continue }
    fora += c
    i += 1
  }
  return fora
}

function semMarcacao (texto) {
  let fora = ''
  let i = 0
  let emBloco = false
  while (i < texto.length) {
    if (!emBloco && texto.startsWith('<!--', i)) { emBloco = true; fora += '    '; i += 4; continue }
    if (emBloco && texto.startsWith('-->', i)) { emBloco = false; fora += '   '; i += 3; continue }
    const c = texto[i]
    fora += emBloco ? (c === '\n' ? '\n' : ' ') : c
    i += 1
  }
  return fora
}
