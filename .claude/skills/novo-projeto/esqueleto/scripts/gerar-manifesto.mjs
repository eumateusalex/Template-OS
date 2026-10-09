#!/usr/bin/env node
// node .claude/skills/novo-projeto/esqueleto/scripts/gerar-manifesto.mjs [--versao X] [--conferir]
//
// Escreve `kit/kit.json` a partir do DISCO: o sha de cada arquivo que a
// fundação instala, e a versão em que ele mudou pela última vez (`mudouEm`).
//
// 🚨 A lista vem do disco, nunca da mão. As fontes são três: o kit da skill
// (`kit/conferido/` e `kit/semente/`), a marca na web (`identidade/web/`,
// quando o workspace a tem) e as duas entradas de marca dos modelos.
//
// ⚠️ Subir a versão é release, e release tem catraca: `--versao X` recusa sem
// uma entrada `## vX` no `kit/HISTORICO.md`, e sem um `.ultima-prova.json`
// verde (o `teste-fundacao.mjs` inteiro, com o bloco B) sobre o conteúdo de
// agora. Release é "o teste inteiro passou NESTE conteúdo", não lembrança.
//
// ⚠️ `--conferir` sai 1 quando o kit.json não bate com o disco: mexeu no kit,
// rode este script sem argumento.

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

import { impressao } from '../kit/conferido/lib/casca.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const ESQUELETO = dirname(AQUI)
export const CASA = resolve(ESQUELETO, '..', '..', '..', '..')
export const KIT = join(ESQUELETO, 'kit')
// A marca do workspace na web, quando ela existe (é o que `--marca casa` instala).
const WEB = join(CASA, 'identidade', 'web')
const FORA = new Set(['kit.json', 'HISTORICO.md', '.ultima-prova.json'])

const casaRel = (abs) => relative(CASA, abs).split('\\').join('/')

function andarTudo (pasta) {
  const achados = []
  if (!existsSync(pasta)) return achados
  for (const item of readdirSync(pasta, { withFileTypes: true })) {
    const abs = join(pasta, item.name)
    if (item.isDirectory()) achados.push(...andarTudo(abs))
    else if (item.isFile()) achados.push(abs)
  }
  return achados
}

/** Todo arquivo que a fundação pode instalar, em caminho relativo à casa. */
export function fontesDaFundacao () {
  const todas = [
    ...andarTudo(join(KIT, 'conferido')),
    ...andarTudo(join(KIT, 'semente')),
    ...['tokens.css', 'fontes.css', 'tema-shadcn.css'].map((f) => join(WEB, f)).filter((f) => existsSync(f)),
    ...andarTudo(join(WEB, 'fontes')).filter((f) => !f.endsWith('origem.json')),
    ...['marca.casa.css', 'marca.projeto.css', 'tema.projeto.css', 'icone.casa.svg'].map((f) => join(ESQUELETO, 'templates', f))
  ]
  return todas.filter((f) => !FORA.has(f.split(/[\\/]/).pop())).map(casaRel).sort()
}

/** A data de hoje em Brasília, AAAA-MM-DD (UTC erra depois das 21h daqui). */
export function hoje (quando = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(quando)
}

/** A impressão do conteúdo do kit, para a release saber que a prova é deste kit. */
export function impressaoDoKit () {
  const h = createHash('sha256')
  for (const rel of fontesDaFundacao()) {
    h.update(rel)
    h.update(impressao(join(CASA, rel)))
  }
  return h.digest('hex')
}

export function lerKit () {
  try { return JSON.parse(readFileSync(join(KIT, 'kit.json'), 'utf8')) } catch { return null }
}

/** O arquivo que mudou depois da última release, até a próxima dizer o número. */
export const PROXIMA = 'próxima'

/**
 * O manifesto do disco. 🚨 Entre uma release e outra ele se regera a cada
 * mudança (o D5 cobra o kit.json em dia), e carimbar o arquivo mexido com a
 * versão de AGORA mente: a release seguinte sairia com o arquivo mexido
 * carimbado na versão anterior. O mexido fica em `próxima`, e a release troca
 * pelo número.
 */
export function montarManifesto (versao, anterior = lerKit(), { release = false } = {}) {
  const arquivos = {}
  for (const rel of fontesDaFundacao()) {
    const sha = impressao(join(CASA, rel))
    const antes = anterior?.arquivos?.[rel]
    const mudou = !antes || antes.sha !== sha || antes.mudouEm === PROXIMA
    arquivos[rel] = { sha, mudouEm: !mudou ? antes.mudouEm : release ? versao : PROXIMA }
  }
  return { versao, data: hoje(), arquivos }
}

function principal () {
  const args = process.argv.slice(2)
  const anterior = lerKit()
  const i = args.indexOf('--versao')
  const pedida = i !== -1 ? args[i + 1] : null
  const versao = pedida ?? anterior?.versao ?? '1.0.0'

  if (args.includes('--conferir')) {
    const agora = montarManifesto(versao, anterior)
    const antes = anterior?.arquivos ?? {}
    const difere = [...new Set([...Object.keys(antes), ...Object.keys(agora.arquivos)])]
      .filter((rel) => antes[rel]?.sha !== agora.arquivos[rel]?.sha)
    if (difere.length) {
      console.log(`  ✗ o kit.json não bate com o disco em ${difere.length} arquivo(s):`)
      for (const rel of difere.slice(0, 12)) console.log(`     ${rel}`)
      console.log('     Rode: node .claude/skills/novo-projeto/esqueleto/scripts/gerar-manifesto.mjs')
      process.exit(1)
    }
    console.log(`  ✅ kit.json em dia: ${Object.keys(agora.arquivos).length} arquivo(s), versão ${versao}`)
    process.exit(0)
  }

  if (pedida && pedida !== anterior?.versao) {
    if (!readFileSync(join(KIT, 'HISTORICO.md'), 'utf8').includes(`## v${pedida}`)) {
      console.log(`  ✗ o HISTORICO.md não tem a entrada "## v${pedida}": versão nova diz o que mudou`)
      process.exit(1)
    }
    const prova = (() => { try { return JSON.parse(readFileSync(join(KIT, '.ultima-prova.json'), 'utf8')) } catch { return null } })()
    if (!prova || prova.conteudo !== impressaoDoKit()) {
      console.log('  ✗ release sem prova: rode o teste-fundacao.mjs INTEIRO (com o bloco B) sobre este conteúdo antes de subir a versão')
      process.exit(1)
    }
  }

  const manifesto = montarManifesto(versao, anterior, { release: Boolean(pedida) && pedida !== anterior?.versao })
  writeFileSync(join(KIT, 'kit.json'), `${JSON.stringify(manifesto, null, 2)}\n`, 'utf8')
  const mudaram = Object.values(manifesto.arquivos).filter((a) => a.mudouEm === versao).length
  console.log(`  ✅ kit.json escrito: versão ${versao}, ${Object.keys(manifesto.arquivos).length} arquivo(s), ${mudaram} mudaram nesta versão`)
  process.exit(0)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  principal()
}
