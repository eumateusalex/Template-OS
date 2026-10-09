#!/usr/bin/env node
// node fabrica/portao/travessao.mjs [--raiz <dir>]
//
// Classe de defeito: travessão em texto que o público lê, que denuncia texto
// escrito por IA.
//
// 🚨 Ele nasce DESLIGADO: sem `TEXTO_PUBLICO` declarado em stack.mjs, ele fica
// quieto. É o princípio IV aplicado a conferidor. Um `scripts/` comum tem
// centenas de linhas com travessão, quase todas em comentário de código.
// Ligado por padrão, ele daria vermelho no dia um em
// qualquer projeto que já existe, e vermelho no dia um é conferidor desligado.
//
// ⚠️ Comentário não conta: o público não lê comentário de código.
//
// Prova: provas/travessao.mjs

import { join, extname } from 'node:path'

import { Relatorio } from '../lib/saida.mjs'
import { andar, ler, linhasDe, semComentario } from '../lib/arquivos.mjs'
import { comoComando, extensoesDe } from '../lib/conferidor.mjs'

const PROIBIDOS = [
  { sinal: '—', nome: 'travessão' },
  { sinal: '–', nome: 'meia-risca' },
  { sinal: '«', nome: 'aspas angulares' },
  { sinal: '»', nome: 'aspas angulares' }
]

export function conferir (raiz, stack, { escreve = console.log } = {}) {
  const r = new Relatorio('travessao', {
    escreve,
    regra: 'zero travessão em texto que o público vê'
  })

  const pastas = stack.TEXTO_PUBLICO ?? []
  if (pastas.length === 0) {
    r.nota('TEXTO_PUBLICO vazio: este projeto não declarou texto de público, e o conferidor fica quieto')
    r.varreu(1)
    return r.fechar()
  }

  const extensoes = [...extensoesDe(stack), '.md', '.html', '.json', '.txt']
  let olhados = 0
  let quantos = 0

  for (const pasta of pastas) {
    for (const rel of andar(join(raiz, pasta), { extensoes })) {
      const caminho = `${pasta}/${rel}`
      const texto = ler(join(raiz, pasta, rel))
      if (!texto) continue
      olhados += 1

      const limpo = semComentario(texto, extname(rel))
      const linhas = linhasDe(limpo)
      for (let i = 0; i < linhas.length; i += 1) {
        for (const p of PROIBIDOS) {
          if (!linhas[i].includes(p.sinal)) continue
          quantos += 1
          r.nota(`${caminho}:${i + 1}: ${p.nome} "${p.sinal}" em texto público`)
          break
        }
      }
    }
  }

  r.varreu(olhados)
  r.catraca('travessões em texto público', quantos, stack.PISOS?.travessao)
  return r.fechar()
}

comoComando(import.meta.url, (raiz, stack, opcoes) => conferir(raiz, stack, opcoes))
