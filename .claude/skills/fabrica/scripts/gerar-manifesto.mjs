#!/usr/bin/env node
// node .claude/skills/fabrica/scripts/gerar-manifesto.mjs [--versao 1.0.0]
//
// Escreve `kit/kit.json` a partir do DISCO: um sha256 por arquivo do kit.
//
// 🚨 A lista vem do disco, nunca da mão. Guarda com lista à mão fica cego
// quando nasce o próximo arquivo.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { impressaoDe } from '../kit/lib/impressao.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
export const KIT = join(dirname(AQUI), 'kit')

/** O que mora em `fabrica/` no alvo e pertence ao projeto, não ao kit. */
export const FORA = new Set(['kit.json', 'stack.mjs', '.ultimo-portao.json', '.ultimo-teste-fabrica.json'])

export function arquivosDoKit (raiz = KIT, prefixo = '') {
  const achados = []
  for (const item of readdirSync(raiz, { withFileTypes: true })) {
    const rel = prefixo ? `${prefixo}/${item.name}` : item.name
    if (FORA.has(rel)) continue
    if (item.isDirectory()) achados.push(...arquivosDoKit(join(raiz, item.name), rel))
    else if (item.isFile()) achados.push(rel)
  }
  return achados.sort()
}

/**
 * A data de hoje em Brasília, em AAAA-MM-DD.
 * ⚠️ `toISOString()` devolve UTC, e depois das 21h aqui isso já é o dia
 * seguinte lá. Manifesto com a data errada é o primeiro número a envelhecer.
 */
export function hoje (quando = new Date()) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(quando)
  return partes
}

export function montarManifesto (versao = '1.0.0', raiz = KIT) {
  const arquivos = {}
  for (const rel of arquivosDoKit(raiz)) {
    arquivos[rel] = impressaoDe(join(raiz, rel))
  }
  return { versao, data: hoje(), arquivos }
}

function principal () {
  const args = process.argv.slice(2)
  const i = args.indexOf('--versao')
  const anterior = (() => {
    try { return JSON.parse(readFileSync(join(KIT, 'kit.json'), 'utf8')) } catch { return null }
  })()
  const versao = i !== -1 ? args[i + 1] : (anterior?.versao ?? '1.0.0')

  const manifesto = montarManifesto(versao)
  writeFileSync(join(KIT, 'kit.json'), `${JSON.stringify(manifesto, null, 2)}\n`, 'utf8')

  const quantos = Object.keys(manifesto.arquivos).length
  console.log(`✅ kit.json escrito: versão ${manifesto.versao}, ${quantos} arquivo(s), em ${manifesto.data}`)
  if (anterior) {
    const antes = new Set(Object.keys(anterior.arquivos ?? {}))
    const agora = new Set(Object.keys(manifesto.arquivos))
    const novos = [...agora].filter((x) => !antes.has(x))
    const foram = [...antes].filter((x) => !agora.has(x))
    const mudaram = [...agora].filter((x) => antes.has(x) && anterior.arquivos[x] !== manifesto.arquivos[x])
    if (novos.length) console.log(`   novos: ${novos.join(', ')}`)
    if (foram.length) console.log(`   saíram: ${foram.join(', ')}`)
    if (mudaram.length) console.log(`   mudaram: ${mudaram.length} arquivo(s)`)
  }
  process.exit(0)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  principal()
}
