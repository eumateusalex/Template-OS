#!/usr/bin/env node
// node fabrica/portao/kit.mjs [--raiz <dir>] [--fonte <dir do kit na skill>]
//
// Classe de defeito: o alvo rodando uma régua que não é a da fonte. Acontece de
// dois jeitos, e os dois são silenciosos: alguém editou o kit aqui dentro, ou
// o kit daqui ficou para trás do da fonte (a skill `/fabrica` do workspace).
//
// 🚨 É o defeito do servidor que publica com o código VELHO: o conserto
// existe, está commitado e ninguém o mandou para lá. Defasagem é invisível por
// construção, a não ser que alguém pergunte.
//
// ⚠️ `stack.mjs`, `.ultimo-portao.json` e `.ultimo-teste-fabrica.json` são do PROJETO: ficam de
// fora da conta, senão o projeto não poderia declarar os parâmetros dele.
//
// Prova: provas/kit.mjs

import { join, dirname } from 'node:path'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { impressaoDe } from '../lib/impressao.mjs'

import { Relatorio } from '../lib/saida.mjs'
import { comoComando, pastaDoKit } from '../lib/conferidor.mjs'

/** O que mora em `fabrica/` e pertence ao projeto, não ao kit. */
export const DO_PROJETO = new Set(['stack.mjs', '.ultimo-portao.json', '.ultimo-teste-fabrica.json', 'kit.json'])

/** Onde a fonte do kit mora, a partir da raiz do workspace. */
const FONTE_RELATIVA = ['.claude', 'skills', 'fabrica', 'kit']

/**
 * A fonte do kit, achada SUBINDO as pastas a partir da raiz do alvo: a raiz do
 * workspace (0), um projeto em `projetos-pessoais/<nome>` (2), a pasta
 * `python/` dele (3). Até 4 níveis.
 *
 * 🚨 Um `origem` gravado no kit.json aponta para um caminho que deixa de
 * existir quando o workspace muda de pasta. A comparação de versão para de
 * rodar, e ninguém sabe: a nota diz "não comparável" e o conferidor fecha
 * verde. Caminho gravado envelhece; a posição relativa ao workspace, não.
 */
export function fonteDoKit (raiz) {
  let aqui = raiz
  for (let nivel = 0; nivel <= 4; nivel += 1) {
    const candidata = join(aqui, ...FONTE_RELATIVA)
    if (existsSync(join(candidata, 'kit.json'))) return candidata
    const acima = dirname(aqui)
    if (acima === aqui) break
    aqui = acima
  }
  return null
}

export const sha = impressaoDe

function todosOsArquivos (raiz, prefixo = '') {
  const achados = []
  let itens = []
  try { itens = readdirSync(raiz, { withFileTypes: true }) } catch { return achados }
  for (const item of itens) {
    const rel = prefixo ? `${prefixo}/${item.name}` : item.name
    if (item.isDirectory()) achados.push(...todosOsArquivos(join(raiz, item.name), rel))
    else if (item.isFile()) achados.push(rel)
  }
  return achados
}

export function conferir (raiz, stack, { escreve = console.log, fonte = null } = {}) {
  const r = new Relatorio('kit', {
    escreve,
    regra: 'o kit do alvo é cópia byte a byte da fonte; o que se ajusta é o stack.mjs'
  })

  // ⚠️ Onde o kit mora neste alvo: `fabrica/` ou `.claude/fabrica/` (a raiz do workspace).
  const lugar = pastaDoKit(raiz).pasta ?? 'fabrica'
  const pasta = join(raiz, lugar)
  const manifesto = join(pasta, 'kit.json')

  if (!existsSync(manifesto)) {
    r.naoMedido(`não achei ${lugar}/kit.json: sem manifesto não dá para saber se o kit é o da fonte`)
    return r.fechar()
  }

  let dados
  try {
    dados = JSON.parse(readFileSync(manifesto, 'utf8'))
  } catch (erro) {
    r.naoMedido(`${lugar}/kit.json ilegível: ${erro.message}`)
    return r.fechar()
  }

  const declarados = dados.arquivos ?? {}
  let olhados = 0

  for (const [rel, esperado] of Object.entries(declarados)) {
    olhados += 1
    const caminho = join(pasta, rel)
    if (!existsSync(caminho)) {
      r.achado(`${lugar}/${rel}`, 'o manifesto declara este arquivo, e ele não está aqui', 'rode a instalação de novo')
      continue
    }
    const real = sha(caminho)
    if (real !== esperado) {
      r.achado(
        `${lugar}/${rel}`,
        'difere do sha256 registrado: alguém editou o kit neste alvo',
        `o ajuste do projeto mora em ${lugar}/stack.mjs; restaure o kit pela instalação`
      )
    }
  }

  // Arquivo a mais dentro de fabrica/ que o manifesto não conhece
  for (const rel of todosOsArquivos(pasta)) {
    if (DO_PROJETO.has(rel)) continue
    if (declarados[rel] !== undefined) continue
    olhados += 1
    r.achado(
      `${lugar}/${rel}`,
      `está dentro de ${lugar}/ e o manifesto não o conhece`,
      `o que é do projeto mora fora de ${lugar}/; o que é do kit entra pelo manifesto`
    )
  }

  // Versão e conteúdo contra a fonte, quando ela está ao alcance. O `origem`
  // gravado no kit.json é ignorado: ele envelhece (ver `fonteDoKit`).
  const origem = fonte ?? fonteDoKit(raiz)
  if (origem && existsSync(join(origem, 'kit.json'))) {
    let daFonte = null
    try {
      daFonte = JSON.parse(readFileSync(join(origem, 'kit.json'), 'utf8'))
    } catch {
      r.naoMedido('não consegui ler o kit.json da fonte para comparar a versão')
    }
    if (daFonte && daFonte.versao !== dados.versao) {
      r.achado(
        `${lugar}/kit.json`,
        `versão ${dados.versao} aqui, e a fonte está em ${daFonte.versao}`,
        'rode a instalação com --atualizar'
      )
    } else if (daFonte) {
      // ⚠️ Mesma versão com conteúdo diferente: a fonte mudou sem subir a
      // versão, ou este kit veio de outra cópia. Os dois são o kit velho com
      // cara de novo.
      const diferentes = Object.keys({ ...declarados, ...(daFonte.arquivos ?? {}) })
        .filter((rel) => declarados[rel] !== (daFonte.arquivos ?? {})[rel])
      if (diferentes.length > 0) {
        r.achado(
          `${lugar}/kit.json`,
          `mesma versão ${dados.versao} da fonte, e o conteúdo difere em ${diferentes.length} arquivo(s): ${diferentes.slice(0, 5).join(', ')}`,
          'suba a versão na fonte (gerar-manifesto --versao) e reinstale com --atualizar'
        )
      }
    }
    // 🚨 Na raiz do workspace (a fonte mora nesta mesma raiz), os arquivos da
    // fonte se conferem contra o manifesto dela: com a fonte mudada e o
    // manifesto não, o portão fecharia verde comparando manifesto com
    // manifesto. ⚠️ Só no nível 0, de propósito: num projeto, isso acoplaria o
    // portão dele ao disco do workspace.
    if (daFonte && origem === join(raiz, ...FONTE_RELATIVA)) {
      const velhos = Object.entries(daFonte.arquivos ?? {})
        .filter(([rel, esperado]) => !existsSync(join(origem, rel)) || sha(join(origem, rel)) !== esperado)
        .map(([rel]) => rel)
      if (velhos.length > 0) {
        r.achado(
          '.claude/skills/fabrica/kit/kit.json',
          `a fonte do kit mudou e o manifesto dela não: ${velhos.length} arquivo(s), ${velhos.slice(0, 5).join(', ')}`,
          'rode gerar-manifesto.mjs (subindo a versão se o kit mudou de comportamento) e reinstale com --atualizar'
        )
      }
    }
  } else {
    r.nota('versão não comparável aqui: a fonte do kit não está ao alcance deste alvo')
  }

  r.varreu(olhados)
  return r.fechar()
}

comoComando(import.meta.url, (raiz, stack, opcoes) => {
  const i = process.argv.indexOf('--fonte')
  const fonte = i !== -1 ? process.argv[i + 1] : null
  return conferir(raiz, stack, { ...opcoes, fonte })
})
