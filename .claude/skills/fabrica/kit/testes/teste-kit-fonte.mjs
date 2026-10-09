// node --test .claude/skills/fabrica/kit/testes/teste-kit-fonte.mjs
//
// Classe de defeito: o portão de um projeto acoplado ao disco do workspace. O
// conferidor `kit` confere os arquivos da FONTE contra o manifesto dela só
// quando a fonte mora na própria raiz (o nível 0, a raiz do workspace). Num
// projeto, a fonte achada subindo as pastas só serve para comparar versão: se
// ela também cobrasse os arquivos da fonte, um conserto em andamento no kit deixaria
// vermelho o portão de todo projeto abaixo dela.
//
// Trocar a condição do nível 0 por `if (daFonte)` passa em todos os casos da
// matriz, porque todo caso planta a fonte dentro da própria raiz: só este
// teste a pega.
// mutação: kit/portao/kit.mjs · "    if (daFonte && origem === join(raiz, ...FONTE_RELATIVA)) {" → "    if (daFonte) {" · pega

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'

import { criar, apagar } from '../lib/temporaria.mjs'
import { conferir } from '../portao/kit.mjs'

const CONTEUDO = 'export const a = 1\n'
const SHA_CERTO = 'a3b135bcfeaabda5d6780642cf256059889ad4649c9ba4f7a4d5d6e83a68b402'
const MANIFESTO = JSON.stringify({ versao: '1.1.0', data: '2026-09-22', arquivos: { 'portao.mjs': SHA_CERTO } }, null, 2)

function escreve (raiz, rel, texto) {
  const caminho = join(raiz, rel)
  mkdirSync(dirname(caminho), { recursive: true })
  writeFileSync(caminho, texto)
}

/** Um projeto com o kit intacto, e uma fonte com o mesmo manifesto e o portao.mjs editado. */
function montar (fonteDentro) {
  const raiz = criar('fabrica-kit-fonte-')
  escreve(raiz, 'projeto/fabrica/portao.mjs', CONTEUDO)
  escreve(raiz, 'projeto/fabrica/kit.json', MANIFESTO)
  const fonte = fonteDentro ? join(raiz, 'projeto', '.claude', 'skills', 'fabrica', 'kit') : join(raiz, 'workspace', 'kit')
  escreve(fonte, 'kit.json', MANIFESTO)
  escreve(fonte, 'portao.mjs', 'export const a = 2\n')
  return { raiz, projeto: join(raiz, 'projeto'), fonte }
}

function saidaDe (projeto, fonte) {
  const linhas = []
  const r = conferir(projeto, {}, { escreve: (l) => linhas.push(String(l)), fonte })
  return { r, texto: linhas.join('\n') }
}

test('fonte FORA da raiz (um projeto): o arquivo editado da fonte não reprova o projeto', () => {
  const { raiz, projeto, fonte } = montar(false)
  try {
    const { texto } = saidaDe(projeto, fonte)
    assert.doesNotMatch(texto, /a fonte do kit mudou/, texto)
  } finally { apagar(raiz) }
})

test('fonte DENTRO da raiz (a raiz do workspace): o mesmo arquivo editado reprova', () => {
  const { raiz, projeto, fonte } = montar(true)
  try {
    const { texto } = saidaDe(projeto, fonte)
    assert.match(texto, /a fonte do kit mudou/, texto)
  } finally { apagar(raiz) }
})
