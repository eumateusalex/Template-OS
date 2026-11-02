#!/usr/bin/env node
// node fabrica/portao/silencio.mjs [--raiz <dir>]
//
// Classe de defeito: erro engolido. Constituição VIII. O `catch` vazio é o
// defeito que some do log e reaparece no telefone de quem usa.
// Script que cresceu sem régua costuma ter `catch` vazio sem razão escrita.
//
// ⚠️ Teste NÃO entra na conta: teste engole exceção de propósito o tempo todo,
// e acusar isso é o falso positivo que ensina a ignorar o vermelho.
//
// Prova: provas/silencio.mjs

import { join, extname } from 'node:path'

import { Relatorio } from '../lib/saida.mjs'
import { andar, ler, linhasDe, semComentario } from '../lib/arquivos.mjs'
import { isento } from '../lib/isencao.mjs'
import { comoComando, ehCodigo, extensoesDe } from '../lib/conferidor.mjs'

const MARCA = 'silêncio declarado'

/** Existe a marca em alguma linha do trecho? A razão pode estar DENTRO do bloco. */
function isentoNoTrecho (linhas, inicio, fim) {
  for (let j = inicio; j <= fim && j < linhas.length; j += 1) {
    if (isento(linhas, j, MARCA).isento) return true
  }
  return false
}

function linhaDe (texto, indice) {
  return texto.slice(0, indice).split('\n').length
}

/** Acha `catch (...) { ... }` e `.catch(() => {})` com corpo vazio. */
function silenciosJs (limpo) {
  const achados = []

  const reCatch = /\bcatch\s*(?:\([^)]*\))?\s*\{/g
  let m
  while ((m = reCatch.exec(limpo)) !== null) {
    const abre = m.index + m[0].length - 1
    let nivel = 0
    let fecha = -1
    for (let i = abre; i < limpo.length; i += 1) {
      if (limpo[i] === '{') nivel += 1
      else if (limpo[i] === '}') {
        nivel -= 1
        if (nivel === 0) { fecha = i; break }
      }
    }
    if (fecha === -1) continue
    const corpo = limpo.slice(abre + 1, fecha)
    if (corpo.trim() === '') {
      achados.push({ linha: linhaDe(limpo, m.index), ate: linhaDe(limpo, fecha), o: 'catch com corpo vazio' })
    }
  }

  const reCatchSeta = /\.catch\s*\(\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*\{\s*\}\s*\)/g
  while ((m = reCatchSeta.exec(limpo)) !== null) {
    achados.push({ linha: linhaDe(limpo, m.index), ate: linhaDe(limpo, m.index + m[0].length), o: '.catch que não faz nada' })
  }

  const reCatchFn = /\.catch\s*\(\s*function\s*\([^)]*\)\s*\{\s*\}\s*\)/g
  while ((m = reCatchFn.exec(limpo)) !== null) {
    achados.push({ linha: linhaDe(limpo, m.index), ate: linhaDe(limpo, m.index + m[0].length), o: '.catch que não faz nada' })
  }

  return achados
}

/** Acha `except ...:` seguido só de `pass`. */
function silenciosPython (limpo) {
  const achados = []
  const linhas = limpo.split('\n')
  for (let i = 0; i < linhas.length; i += 1) {
    if (!/^\s*except\b.*:\s*$/.test(linhas[i])) continue
    const recuoExcept = linhas[i].match(/^\s*/)[0].length
    const corpo = []
    for (let j = i + 1; j < linhas.length; j += 1) {
      if (linhas[j].trim() === '') continue
      const recuo = linhas[j].match(/^\s*/)[0].length
      if (recuo <= recuoExcept) break
      corpo.push({ i: j, texto: linhas[j].trim() })
    }
    if (corpo.length > 0 && corpo.every((l) => l.texto === 'pass' || l.texto === '...')) {
      achados.push({ linha: i + 1, ate: corpo[corpo.length - 1].i + 1, o: 'except que só passa adiante' })
    }
  }
  return achados
}

export function conferir (raiz, stack, { escreve = console.log } = {}) {
  const r = new Relatorio('silencio', {
    escreve,
    regra: 'constituição VIII: erro não se engole; declare a razão na linha'
  })

  const extensoes = extensoesDe(stack)
  let olhados = 0
  let engolidos = 0

  for (const pasta of stack.CODIGO ?? []) {
    for (const rel of andar(join(raiz, pasta), { extensoes })) {
      const caminho = `${pasta}/${rel}`
      if (!ehCodigo(caminho, stack)) continue
      const texto = ler(join(raiz, pasta, rel))
      if (!texto) continue
      olhados += 1

      const ext = extname(rel)
      const limpo = semComentario(texto, ext)
      const linhas = linhasDe(texto)
      const achados = ext === '.py' ? silenciosPython(limpo) : silenciosJs(limpo)

      for (const a of achados) {
        if (isentoNoTrecho(linhas, a.linha - 2, a.ate)) continue
        engolidos += 1
        r.nota(`${caminho}:${a.linha}: ${a.o}`)
      }
    }
  }

  r.varreu(olhados)
  // 🚨 CATRACA, como os outros que CONTAM: um workspace que já existe pode ter
  // dezenas de erros engolidos, e um conferidor que reprova dezenas de vezes no dia um é um
  // conferidor que alguém desliga. O número nasce medido, e daqui em diante só desce.
  r.catraca('erros engolidos sem razão declarada', engolidos, stack.PISOS?.silencio)
  return r.fechar()
}

comoComando(import.meta.url, (raiz, stack, opcoes) => conferir(raiz, stack, opcoes))
