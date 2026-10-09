#!/usr/bin/env node
// node fabrica/portao/camadas.mjs [--raiz <dir>]
//
// Classe de defeito: monolito que vira macarrão. Constituição III: monolito
// modular é essencial para desenvolvimento assistido por IA.
//
// 🚨 O que faz isto funcionar é a direção declarada, não a boa intenção. Sem
// ela, a arquitetura se perde um `if` de cada vez, e o agente deixa de
// entender o projeto quando ele não cabe mais no contexto.
//
// ⚠️ `CAMADAS = null` exige `SEM_CAMADAS: '<razão>'`. Projeto sem camada é
// decisão legítima (um workspace de scripts soltos é uma), e decisão legítima
// se escreve.
//
// Prova: provas/camadas.mjs

import { join, extname } from 'node:path'

import { Relatorio } from '../lib/saida.mjs'
import { andar, ler, linhasDe } from '../lib/arquivos.mjs'
import { isento } from '../lib/isencao.mjs'
import { importacoesDe, resolverAlvo } from '../lib/importacoes.mjs'
import { comoComando, ehTeste, extensoesDe } from '../lib/conferidor.mjs'

const MARCA = 'camada declarada'

function camadaDe (caminho, camadas) {
  let melhor = null
  for (const c of camadas) {
    if (caminho === c.raiz || caminho.startsWith(`${c.raiz}/`)) {
      if (!melhor || c.raiz.length > melhor.raiz.length) melhor = c
    }
  }
  return melhor
}

/** Busca em profundidade: existe ciclo no grafo de camadas? */
function achaCiclo (arestas) {
  const vizinhos = new Map()
  for (const [de, para] of arestas) {
    if (!vizinhos.has(de)) vizinhos.set(de, new Set())
    vizinhos.get(de).add(para)
  }
  const cor = new Map()
  const caminho = []
  let ciclo = null

  const desce = (no) => {
    if (ciclo) return
    cor.set(no, 'andando')
    caminho.push(no)
    for (const proximo of vizinhos.get(no) ?? []) {
      if (cor.get(proximo) === 'andando') {
        ciclo = [...caminho.slice(caminho.indexOf(proximo)), proximo]
        return
      }
      if (!cor.has(proximo)) desce(proximo)
      if (ciclo) return
    }
    caminho.pop()
    cor.set(no, 'pronto')
  }

  for (const no of vizinhos.keys()) {
    if (!cor.has(no)) desce(no)
    if (ciclo) break
  }
  return ciclo
}

export function conferir (raiz, stack, { escreve = console.log } = {}) {
  const r = new Relatorio('camadas', {
    escreve,
    regra: 'constituição III: a importação anda só na direção declarada em stack.mjs'
  })

  const camadas = stack.CAMADAS
  if (!camadas) {
    if (!stack.SEM_CAMADAS || String(stack.SEM_CAMADAS).trim().length < 5) {
      r.achado(
        'fabrica/stack.mjs',
        'CAMADAS é null e não há razão declarada',
        'declare as camadas, ou escreva SEM_CAMADAS: "<razão>" em stack.mjs'
      )
      r.varreu(1)
      return r.fechar()
    }
    r.nota(`sem camadas, por declaração: ${stack.SEM_CAMADAS}`)
    r.varreu(1)
    return r.fechar()
  }

  const extensoes = extensoesDe(stack)
  const ehPython = stack.STACK === 'python'
  const arestas = new Set()
  let olhados = 0
  let isentos = 0

  for (const pasta of stack.CODIGO ?? []) {
    for (const rel of andar(join(raiz, pasta), { extensoes })) {
      const caminho = `${pasta}/${rel}`
      if (ehTeste(caminho, stack)) continue
      const minha = camadaDe(caminho, camadas)
      if (!minha) continue
      olhados += 1

      const texto = ler(join(raiz, pasta, rel))
      const linhas = linhasDe(texto)

      for (const imp of importacoesDe(texto, extname(rel))) {
        const destino = resolverAlvo(imp.alvo, caminho, stack.APELIDOS ?? {}, ehPython ? 'python' : 'node')
        if (!destino) continue
        const dele = camadaDe(destino, camadas)
        if (!dele || dele.nome === minha.nome) continue

        // ⚠️ O separador é VISÍVEL de propósito. Um caractere invisível aqui
        // some numa limpeza de bytes e leva o grafo junto, sem erro nenhum.
        arestas.add(`${minha.nome} -> ${dele.nome}`)

        if ((minha.importa ?? []).includes(dele.nome)) continue

        if (isento(linhas, imp.linha - 1, MARCA).isento) {
          isentos += 1
          continue
        }

        r.achado(
          `${caminho}:${imp.linha}`,
          `a camada ${minha.nome} importa de ${dele.nome}, e ${minha.nome} só pode importar de [${(minha.importa ?? []).join(', ') || 'nada'}]`,
          `mova o que é comum para uma camada que as duas podem importar, ou escreva "${MARCA}: <razão>" na linha`
        )
      }
    }
  }

  const ciclo = achaCiclo([...arestas].map((a) => a.split(' -> ')))
  if (ciclo) {
    r.achado(
      'fabrica/stack.mjs · CAMADAS',
      `ciclo entre camadas: ${ciclo.join(' → ')}`,
      'ciclo não se isenta: quebre a dependência numa das pontas'
    )
  }

  r.varreu(olhados)
  r.catraca('cruzamentos isentos', isentos, stack.PISOS?.camadas)
  return r.fechar()
}

comoComando(import.meta.url, (raiz, stack, opcoes) => conferir(raiz, stack, opcoes))
