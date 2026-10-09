#!/usr/bin/env node
// node fabrica/portao/envelhecimento.mjs [--raiz <dir>]
//
// Classe de defeito: documento vivo que afirma um número no presente e não diz
// quando mediu. Constituição V. É o `CLAUDE.md` que diz "547 casos" com o
// número já dois atrás.
//
// 🚨 A régua é ESTREITA de propósito. Ela só acusa NÚMERO CONTANDO COISA
// ("34 conferidores"), fora de código, sem data na mesma linha. Versão, ano,
// caminho, código em crase e bloco de código ficam de fora. Conferidor que
// acusa todo número de todo documento é conferidor que ninguém roda duas
// vezes, e falso positivo ensina a ignorar o vermelho.
//
// ⚠️ É CATRACA: documento que já existe nasce com o número medido no dia.
//
// Prova: provas/envelhecimento.mjs

import { join } from 'node:path'
import { existsSync } from 'node:fs'

import { Relatorio } from '../lib/saida.mjs'
import { ler, linhasDe } from '../lib/arquivos.mjs'
import { isento } from '../lib/isencao.mjs'
import { comoComando } from '../lib/conferidor.mjs'

const MARCA = 'número vivo'

// dd/mm/aaaa · dd/mm · aaaa-mm-dd · "de setembro"
const TEM_DATA = /\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b|\b\d{4}-\d{2}-\d{2}\b|\b(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/i

/** Tira o que não é prosa: código em crase, links, versões, caminhos. */
function soAProsa (linha) {
  return linha
    .replace(/`[^`]*`/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\bv?\d+\.\d+(\.\d+)?\b/g, ' ')
    .replace(/\b\d{4}\b/g, ' ')
    .replace(/[\w./-]*\/[\w./-]+/g, ' ')
    .replace(/^\s*[-*+]\s+/, ' ')
    .replace(/^\s*\d+\.\s+/, ' ')
    .replace(/^#{1,6}\s+/, ' ')
}

/** Um número contando alguma coisa: "34 conferidores". */
const CONTAGEM = /\b(\d{2,})\s+([a-zà-ú][a-zà-ú-]{2,})/i

export function conferir (raiz, stack, { escreve = console.log } = {}) {
  const r = new Relatorio('envelhecimento', {
    escreve,
    regra: 'constituição V: documento vivo carrega o comando, ou o número com a data'
  })

  const documentos = stack.DOCUMENTOS_VIVOS ?? []
  let olhados = 0
  let vencidos = 0

  for (const doc of documentos) {
    const caminho = join(raiz, doc)
    if (!existsSync(caminho)) continue
    const texto = ler(caminho)
    if (!texto) continue
    olhados += 1

    const linhas = linhasDe(texto)
    let emCodigo = false

    for (let i = 0; i < linhas.length; i += 1) {
      const linha = linhas[i]
      if (/^\s*```/.test(linha)) { emCodigo = !emCodigo; continue }
      if (emCodigo) continue
      if (TEM_DATA.test(linha)) continue
      if (isento(linhas, i, MARCA).isento) continue

      const m = soAProsa(linha).match(CONTAGEM)
      if (!m) continue

      vencidos += 1
      r.nota(`${doc}:${i + 1}: "${m[1]} ${m[2]}" sem data`)
    }
  }

  r.varreu(olhados)
  r.catraca('números vivos sem data', vencidos, stack.PISOS?.envelhecimento)
  return r.fechar()
}

comoComando(import.meta.url, (raiz, stack, opcoes) => conferir(raiz, stack, opcoes))
