#!/usr/bin/env node
// node fabrica/portao/estrutura.mjs [--raiz <dir>]
//
// Classe de defeito: guarda com lista à mão. Conferidor que existe e não está
// em PASSOS nunca roda; linha em PASSOS sem arquivo atrás quebra o portão;
// conferidor sem prova não sabe reprovar.
//
// 🚨 É ele que impede a fábrica de ficar cega para o próximo conferidor. Com a
// lista escrita à mão, o próximo conferidor chega e o guarda acusa a coisa
// errada. Aqui as três listas (portao/, PASSOS,
// provas/) se conferem entre si, e nenhuma delas é digitada duas vezes.
//
// Prova: provas/estrutura.mjs

import { join } from 'node:path'
import { existsSync, readdirSync, statSync } from 'node:fs'

import { Relatorio } from '../lib/saida.mjs'
import { ler, linhasDe } from '../lib/arquivos.mjs'
import { comoComando, pastaDoKit } from '../lib/conferidor.mjs'

const NOME_DE_SPEC = /^\d{3}-[a-z0-9-]+$/

function listar (caminho) {
  try {
    return readdirSync(caminho)
  } catch {
    return []
  }
}

export function conferir (raiz, stack, { escreve = console.log } = {}) {
  const r = new Relatorio('estrutura', {
    escreve,
    regra: 'conferidor, linha em PASSOS e prova: os três, ou nenhum'
  })

  let olhados = 0

  // 1 · portao/ ↔ PASSOS ↔ provas/
  // ⚠️ Onde o kit mora neste alvo: `fabrica/` ou `.claude/fabrica/`.
  const kit = pastaDoKit(raiz).pasta ?? 'fabrica'
  const pastaPortao = join(raiz, kit, 'portao')
  const pastaProvas = join(raiz, kit, 'provas')
  const conferidores = listar(pastaPortao).filter((f) => f.endsWith('.mjs')).map((f) => f.replace(/\.mjs$/, ''))
  const provas = new Set(listar(pastaProvas).filter((f) => f.endsWith('.mjs')).map((f) => f.replace(/\.mjs$/, '')))

  const naLista = new Set()
  for (const passo of stack.PASSOS ?? []) {
    olhados += 1
    const cmd = passo.cmd ?? ''
    const m = cmd.match(/fabrica\/portao\/([a-z0-9-]+)\.mjs/)
    if (!m) continue
    naLista.add(m[1])
    if (!existsSync(join(pastaPortao, `${m[1]}.mjs`))) {
      r.achado(
        `stack.mjs · PASSOS · ${passo.nome}`,
        `a linha chama fabrica/portao/${m[1]}.mjs, e esse arquivo não existe`,
        'crie o conferidor, ou tire a linha'
      )
    }
  }

  for (const nome of conferidores) {
    olhados += 1
    if (!naLista.has(nome)) {
      r.achado(
        `fabrica/portao/${nome}.mjs`,
        'o conferidor existe e NÃO está em PASSOS: ele nunca roda',
        `acrescente { nome: '${nome}', cmd: 'node fabrica/portao/${nome}.mjs', onde: 'todos' } em stack.mjs`
      )
    }
    if (!provas.has(nome)) {
      r.achado(
        `fabrica/portao/${nome}.mjs`,
        'o conferidor não tem prova plantada: ninguém o viu reprovar',
        `escreva fabrica/provas/${nome}.mjs, com pelo menos um caso vermelho e um verde`
      )
    }
    const texto = ler(join(pastaPortao, `${nome}.mjs`))
    if (!/^\/\/\s*node\s+fabrica\/portao\//m.test(texto) || !/Prova:\s*provas\//.test(texto)) {
      r.achado(
        `fabrica/portao/${nome}.mjs`,
        'cabeçalho incompleto: falta a linha de uso ou a linha "Prova: provas/<nome>.mjs"',
        'todo conferidor diz como se chama e onde está a prova dele'
      )
    }
  }

  for (const nome of provas) {
    olhados += 1
    if (!conferidores.includes(nome)) {
      r.achado(
        `fabrica/provas/${nome}.mjs`,
        'a prova existe e o conferidor não',
        'crie o conferidor, ou tire a prova'
      )
    }
  }

  // 2 · specs/NNN-nome/spec.md
  const pastaSpecs = join(raiz, 'specs')
  for (const nome of listar(pastaSpecs)) {
    const caminho = join(pastaSpecs, nome)
    let ehPasta = false
    try { ehPasta = statSync(caminho).isDirectory() } catch { ehPasta = false }
    if (!ehPasta) continue
    olhados += 1
    if (!NOME_DE_SPEC.test(nome)) {
      r.achado(`specs/${nome}`, 'fora do padrão NNN-nome-curto', 'renomeie para três dígitos e um nome em minúsculas com hífen')
      continue
    }
    if (!existsSync(join(caminho, 'spec.md'))) {
      r.achado(`specs/${nome}`, 'não tem spec.md', 'escreva o spec.md (a /fabrica tem o modelo), ou apague a pasta')
    }
  }

  // 3 · links de markdown que não resolvem
  for (const doc of stack.DOCUMENTOS_VIVOS ?? []) {
    const caminho = join(raiz, doc)
    if (!existsSync(caminho)) continue
    olhados += 1
    const linhas = linhasDe(ler(caminho))
    for (let i = 0; i < linhas.length; i += 1) {
      for (const m of linhas[i].matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
        const destino = m[1].split('#')[0].trim()
        if (!destino || /^(https?:|mailto:|#)/.test(destino)) continue
        if (!existsSync(join(raiz, destino))) {
          r.achado(`${doc}:${i + 1}`, `o link aponta para ${destino}, que não existe`, 'conserte o caminho ou tire o link')
        }
      }
    }
  }

  r.varreu(olhados)
  return r.fechar()
}

comoComando(import.meta.url, (raiz, stack, opcoes) => conferir(raiz, stack, opcoes))
