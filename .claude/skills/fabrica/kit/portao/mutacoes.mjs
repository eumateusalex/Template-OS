#!/usr/bin/env node
// node fabrica/portao/mutacoes.mjs [--raiz <dir>] [--reexecutar]
//
// Classe de defeito: teste que nunca foi visto reprovando, nas quatro classes
// em que o verde mente mais caro. Constituição I.
//
// 🚨 Ele cobra DUAS coisas, e a segunda é a que ninguém lembra: o registro
// existe, E o trecho "de" ainda existe e é único no fonte. Registro que aponta
// para trecho que sumiu é registro velho, e registro velho é verde mentiroso.
// Registro escrito de cabeça cita trecho que nunca existiu, e é este tipo de
// conferência que pega.
//
// ⚠️ Sem `--reexecutar` ele é ESTÁTICO: lê o registro e o fonte, e não roda
// teste nenhum. Rodar as mutações a cada portão custa minutos; por isso a
// reexecução acontece na entrega, não a cada salvamento.
//
// Prova: provas/mutacoes.mjs

import { join, extname } from 'node:path'

import { Relatorio } from '../lib/saida.mjs'
import { andar, ler, linhasDe, semComentario } from '../lib/arquivos.mjs'
import { comoComando, ehTeste, extensoesDe } from '../lib/conferidor.mjs'
import { mutar, DESFECHO } from '../mutar.mjs'

export const RE_REGISTRO = /muta[çc][ãa]o:\s*(.+?)\s*·\s*"(.*)"\s*→\s*"(.*)"\s*·\s*(.*)$/u
const TEM_DATA = /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/

/** Todos os registros de mutação dos testes do projeto. */
export function registrosDo (raiz, stack) {
  const registros = []
  const extensoes = extensoesDe(stack)
  const pastas = new Set([...(stack.CODIGO ?? []), 'testes', 'tests', 'test'])

  for (const pasta of pastas) {
    for (const rel of andar(join(raiz, pasta), { extensoes })) {
      const caminho = `${pasta}/${rel}`
      if (!ehTeste(caminho, stack)) continue
      const linhas = linhasDe(ler(join(raiz, pasta, rel)))
      for (let i = 0; i < linhas.length; i += 1) {
        const m = linhas[i].match(RE_REGISTRO)
        if (m) {
          registros.push({
            teste: caminho,
            linha: i + 1,
            arquivo: m[1].trim(),
            de: m[2],
            para: m[3],
            cauda: m[4] ?? ''
          })
        }
      }
    }
  }
  return registros
}

/**
 * Este arquivo tem comportamento a quebrar? Arquivo vazio, so de comentario,
 * ou que so reexporta nao tem: nao ha mutacao possivel nele.
 */
export function temLogica (caminho, extensao) {
  const limpo = semComentario(ler(caminho), extensao)
  const linhas = linhasDe(limpo)
    .map((l) => l.trim())
    .filter((l) => l !== '')
  if (linhas.length === 0) return false
  const soPassagem = linhas.every((l) =>
    /^(import|from|export\s+\*|export\s*\{|__all__|module\.exports)/.test(l) ||
    /^[}\])];,]*$/.test(l)
  )
  return !soPassagem
}

export function conferir (raiz, stack, { escreve = console.log, reexecutar = false } = {}) {
  const r = new Relatorio('mutacoes', {
    escreve,
    regra: 'constituição I: nas quatro classes, o teste tem que ter sido visto vermelho'
  })

  const areas = stack.AREAS_OBRIGATORIAS ?? []
  if (areas.length === 0) {
    r.nota('nenhuma área obrigatória declarada em stack.mjs')
    r.varreu(1)
    return r.fechar()
  }

  const registros = registrosDo(raiz, stack)
  const extensoes = extensoesDe(stack)
  let olhados = 0

  for (const area of areas) {
    for (const rel of andar(join(raiz, area), { extensoes })) {
      const caminho = `${area}/${rel}`
      if (ehTeste(caminho, stack)) continue

      // ⚠️ Não se muta o que não tem lógica. Um `__init__.py` vazio, um
      // arquivo de barril que só reexporta, um módulo só de comentário: não há
      // comportamento a quebrar ali, e cobrar mutação deles é falso positivo.
      if (!temLogica(join(raiz, caminho), extname(rel))) continue

      olhados += 1

      const meus = registros.filter((x) => x.arquivo === caminho)
      if (meus.length === 0) {
        r.achado(
          caminho,
          'está em área obrigatória e não tem mutação registrada em teste nenhum',
          `rode: node fabrica/mutar.mjs ${caminho} "<de>" "<para>" --comando "<teste>" --registrar <arquivo do teste>`
        )
        continue
      }

      for (const reg of meus) {
        if (!TEM_DATA.test(reg.cauda)) {
          r.achado(
            `${reg.teste}:${reg.linha}`,
            'o registro de mutação não traz data',
            'termine a linha com "· pega em dd/mm/aaaa"'
          )
        }

        const fonte = ler(join(raiz, caminho))
        const pedacos = fonte.split(reg.de)
        if (pedacos.length === 1) {
          r.achado(
            `${reg.teste}:${reg.linha}`,
            `registro velho: o trecho "${reg.de}" não existe mais em ${caminho}`,
            'refaça a mutação contra o código de hoje, e regrave a linha'
          )
        } else if (pedacos.length > 2) {
          r.achado(
            `${reg.teste}:${reg.linha}`,
            `o trecho "${reg.de}" aparece ${pedacos.length - 1} vezes em ${caminho}: a mutação não é única`,
            'escolha um trecho maior, que só exista num lugar'
          )
        } else if (reexecutar) {
          const comando = stack.COMANDOS?.testar
          if (!comando) {
            r.naoMedido('sem COMANDOS.testar em stack.mjs não dá para reexecutar as mutações')
          } else {
            const saiu = mutar({ arquivo: caminho, de: reg.de, para: reg.para, comando, raiz })
            if (saiu.codigo !== DESFECHO.PEGA) {
              r.achado(
                `${reg.teste}:${reg.linha}`,
                `a mutação registrada NÃO foi pega agora: ${saiu.mensagem}`,
                'o teste parou de medir este trecho; conserte o teste'
              )
            }
          }
        }
      }
    }
  }

  if (olhados === 0) {
    r.naoMedido(`as áreas obrigatórias (${areas.join(', ')}) estão vazias: declare as que existem, ou tire da lista`)
  }

  r.varreu(olhados)
  return r.fechar()
}

comoComando(import.meta.url, (raiz, stack, opcoes) =>
  conferir(raiz, stack, { ...opcoes, reexecutar: process.argv.includes('--reexecutar') })
)
