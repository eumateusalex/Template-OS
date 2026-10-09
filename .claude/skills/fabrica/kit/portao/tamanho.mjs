#!/usr/bin/env node
// node fabrica/portao/tamanho.mjs [--raiz <dir>]
//
// Classe de defeito: arquivo que cresce até nem a IA entender mais. Princípio X.
//
// 🚨 CATRACA, nunca teto seco. Projeto que já existe nasce com o número
// medido no dia, e o conferidor só reprova quando PIORA. Um `scripts/` que já
// existe costuma ter vários arquivos acima de 400 linhas. Teto seco ali
// seria vermelho no dia um, e vermelho no dia um é conferidor desligado.
//
// ⚠️ Teste não entra na conta: arquivo de teste é longo por natureza, e
// quebrá-lo esconde o caso em vez de simplificar o código.
//
// Prova: provas/tamanho.mjs

import { join, extname } from 'node:path'

import { Relatorio } from '../lib/saida.mjs'
import { andar, ler, linhasDe } from '../lib/arquivos.mjs'
import { isento } from '../lib/isencao.mjs'
import { comoComando, ehCodigo, extensoesDe } from '../lib/conferidor.mjs'

const MARCA = 'tamanho declarado'

/**
 * Quantos espaços valem um nível, pela linguagem do arquivo.
 *
 * 🚨 Python recua 4 (PEP 8, e é o que o `ruff format` escreve); JS e TS recuam
 * 2. Contando o nível a cada 2 espaços em qualquer arquivo, um `raise` com
 * continuação dentro de `try`/`except` numa função Python, três níveis de
 * verdade, sairia "6 níveis".
 */
const RECUO = { '.py': 4 }

function profundidade (linha, unidade) {
  const recuo = linha.match(/^[\t ]*/)[0].replace(/\t/g, ' '.repeat(unidade))
  return Math.floor(recuo.length / unidade)
}

export function conferir (raiz, stack, { escreve = console.log } = {}) {
  const tetos = stack.TETOS ?? { linhas: 400, indentacao: 5 }
  const r = new Relatorio('tamanho', {
    escreve,
    regra: `constituição X: teto de ${tetos.linhas} linhas e ${tetos.indentacao} níveis, com isenção declarada`
  })

  const extensoes = extensoesDe(stack)
  let olhados = 0
  let acima = 0

  for (const pasta of stack.CODIGO ?? []) {
    for (const rel of andar(join(raiz, pasta), { extensoes })) {
      const caminho = `${pasta}/${rel}`
      if (!ehCodigo(caminho, stack)) continue
      const texto = ler(join(raiz, pasta, rel))
      if (!texto) continue
      olhados += 1

      const linhas = linhasDe(texto)
      // A isenção é do ARQUIVO inteiro, então vale em qualquer linha dele.
      const dispensado = linhas.some((_, i) => isento(linhas, i, MARCA).isento)
      if (dispensado) continue

      const quantas = linhas.length
      if (quantas > tetos.linhas) {
        acima += 1
        r.nota(`${caminho}: ${quantas} linhas (teto ${tetos.linhas})`)
        continue
      }

      const unidade = RECUO[extname(rel)] ?? 2
      let maisFundo = 0
      let ondeFundo = 0
      for (let i = 0; i < linhas.length; i += 1) {
        if (linhas[i].trim() === '') continue
        const p = profundidade(linhas[i], unidade)
        if (p > maisFundo) { maisFundo = p; ondeFundo = i + 1 }
      }
      if (maisFundo > tetos.indentacao) {
        acima += 1
        r.nota(`${caminho}:${ondeFundo}: ${maisFundo} níveis de indentação (teto ${tetos.indentacao})`)
      }
    }
  }

  r.varreu(olhados)
  r.catraca('arquivos acima do teto', acima, stack.PISOS?.tamanho)
  return r.fechar()
}

comoComando(import.meta.url, (raiz, stack, opcoes) => conferir(raiz, stack, opcoes))
