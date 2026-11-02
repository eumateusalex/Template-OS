#!/usr/bin/env node
// node fabrica/portao/cobertura.mjs [--raiz <dir>]
//
// Classe de defeito: afirmar cobertura sem ter medido. Mesmo com skill, regra
// e TDD, o agente às vezes decide não fazer o teste, e por isso a cobertura se
// mede sempre. O agente não obedece: o número obedece.
//
// 🚨 Cobertura prova que o teste PASSOU por ali. Só a mutação prova que ele
// MEDE. As duas juntas dizem alguma coisa; nenhuma delas sozinha diz.
//
// ⚠️ CATRACA: o piso nasce do medido no dia, e só sobe. Meta de cobertura vira
// teste escrito para o número, e isso é pior que não medir.
//
// Prova: provas/cobertura.mjs

import { join } from 'node:path'
import { existsSync } from 'node:fs'

import { Relatorio } from '../lib/saida.mjs'
import { ler } from '../lib/arquivos.mjs'
import { lerLcov } from '../lib/lcov.mjs'
import { comoComando } from '../lib/conferidor.mjs'

export function conferir (raiz, stack, { escreve = console.log } = {}) {
  const r = new Relatorio('cobertura', {
    escreve,
    regra: 'constituição I e VI: cobertura medida, com catraca; zero medido é vermelho'
  })

  const arquivo = stack.COBERTURA?.arquivo ?? 'coverage/lcov.info'
  const caminho = join(raiz, arquivo)

  if (!existsSync(caminho)) {
    r.naoMedido(
      `não achei ${arquivo}. O passo "testar" precisa gerar lcov ` +
      '(vitest: --coverage.reporter=lcov · node: --experimental-test-coverage --test-reporter=lcov · python: coverage lcov)'
    )
    return r.fechar()
  }

  const dados = lerLcov(ler(caminho))

  if (dados.vazio) {
    r.achado(
      arquivo,
      'zero linha medida: o relatório existe e não mede nada',
      'confira se o runner rodou os testes e se a cobertura está apontada para o código, não para os testes'
    )
    r.varreu(dados.arquivos.length)
    return r.fechar()
  }

  r.nota(`${dados.porcentagem}% de linhas cobertas (${dados.cobertas} de ${dados.linhas}, em ${dados.arquivos.length} arquivo(s))`)

  // A catraca da cobertura é ao contrário das outras: aqui o número tem que
  // SUBIR, então o "piorou" é ficar abaixo do piso.
  const piso = stack.PISOS?.cobertura
  if (piso === undefined || piso === null || Number.isNaN(Number(piso))) {
    r.naoMedido(
      `cobertura: sem linha de base. Medi ${dados.porcentagem}% agora; ` +
      'declare PISOS.cobertura em fabrica/stack.mjs, com a data ao lado.'
    )
  } else if (dados.porcentagem < piso) {
    r.achado(
      'cobertura',
      `caiu: ${dados.porcentagem}% agora, e o piso é ${piso}%`,
      'cubra o que entrou sem teste, ou baixe o piso com a razão escrita e a data'
    )
  } else if (dados.porcentagem >= piso + 2) {
    r.nota(`a catraca pode subir para ${Math.floor(dados.porcentagem)}% (o piso é ${piso}%)`)
  }

  r.varreu(dados.arquivos.length)
  return r.fechar()
}

comoComando(import.meta.url, (raiz, stack, opcoes) => conferir(raiz, stack, opcoes))
