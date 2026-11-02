#!/usr/bin/env node
// node fabrica/teste-portao.mjs [--so <conferidor>]
//
// A matriz: para cada conferidor, planta cada defeito numa CÓPIA em
// `os.tmpdir()` e exige o vermelho; e planta o caso limpo e exige o verde.
//
// Classe de defeito que ela impede: régua que deixou de reprovar.
// "Verde que não sabe ficar vermelho não mede nada" é a lição mais cara da
// fábrica, e a matriz é ela em código.
//
// 🚨 A lista de provas vem do DISCO (`readdirSync('provas')`), nunca escrita à
// mão. Guarda com lista à mão fica cego quando nasce o próximo, e o vermelho
// passa a ser do guarda.
//
// Cada caso monta o mundo de que precisa: não depende de fixture externo.

import { readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { criar, apagar } from './lib/temporaria.mjs'
import { rodar } from './lib/runner.mjs'
import { pinta } from './lib/saida.mjs'

const ESTE = fileURLToPath(import.meta.url)
const KIT = dirname(ESTE)

const STACK_PADRAO = {
  node: {
    STACK: 'node',
    COMANDOS: { tipos: 'node -e ""', lint: 'node -e ""', testar: 'node -e ""' },
    CODIGO: ['src'],
    TESTES: ['testes/', '.test.', '.spec.'],
    CAMADAS: null,
    APELIDOS: { '@/': 'src/' },
    AREAS_OBRIGATORIAS: [],
    TEXTO_PUBLICO: [],
    DOCUMENTOS_VIVOS: ['LEIA-ME.md', 'README.md'],
    COBERTURA: { arquivo: 'coverage/lcov.info' },
    PISOS: { cobertura: 0, camadas: 0, silencio: 0, tamanho: 0, travessao: 0, envelhecimento: 0 },
    TETOS: { linhas: 400, indentacao: 5 },
    PASSOS: []
  },
  python: {
    STACK: 'python',
    COMANDOS: { tipos: 'node -e ""', lint: 'node -e ""', testar: 'node -e ""' },
    CODIGO: ['src'],
    TESTES: ['tests/', 'test_', '_test.py'],
    CAMADAS: null,
    APELIDOS: {},
    AREAS_OBRIGATORIAS: [],
    TEXTO_PUBLICO: [],
    DOCUMENTOS_VIVOS: ['LEIA-ME.md', 'README.md'],
    COBERTURA: { arquivo: 'coverage/lcov.info' },
    PISOS: { cobertura: 0, camadas: 0, silencio: 0, tamanho: 0, travessao: 0, envelhecimento: 0 },
    TETOS: { linhas: 400, indentacao: 5 },
    PASSOS: []
  }
}

function comoTexto (valor) {
  return JSON.stringify(valor, null, 2)
}

/** A ajuda que cada caso recebe para montar o mundo dele. */
function ajudaDe (raiz, stack) {
  const usado = { ...STACK_PADRAO[stack] }
  const ajuda = {
    raiz,
    stack,
    escreve (rel, conteudo) {
      const destino = join(raiz, rel)
      mkdirSync(dirname(destino), { recursive: true })
      writeFileSync(destino, conteudo, 'utf8')
      return destino
    },
    ajusta (extra) {
      Object.assign(usado, extra)
    },
    git () {
      rodar('git init -q', { cwd: raiz, tempoMaximo: 20000 })
      rodar('git add -A', { cwd: raiz, tempoMaximo: 20000 })
      rodar('git -c user.name=fabrica -c user.email=f@f commit -q -m fixture --no-verify', { cwd: raiz, tempoMaximo: 20000 })
    },
    gravarStack () {
      const linhas = Object.entries(usado).map(([k, v]) => `export const ${k} = ${comoTexto(v)}`)
      ajuda.escreve('fabrica/stack.mjs', `${linhas.join('\n')}\n`)
    }
  }
  return ajuda
}

/** O XML com o que precisa de escape. */
function xml (texto) {
  return String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * O relatório de MÁQUINA da matriz, em junit: um caso por prova plantada.
 * ⚠️ É o que deixa o `vermelho.mjs` gravar o vermelho de um conferidor: sem
 * ele, a matriz só falaria para a tela.
 */
function escreverJunit (destino, resultados) {
  const casos = resultados.map((r) => r.falha
    ? `\t<testcase name="${xml(r.nome)}"><failure message="${xml(`${r.nome}: ${r.falha}`)}"/></testcase>`
    : `\t<testcase name="${xml(r.nome)}"/>`)
  writeFileSync(destino, ['<?xml version="1.0" encoding="utf-8"?>', '<testsuites>', ...casos, '</testsuites>', ''].join('\n'), 'utf8')
}

async function principal () {
  const args = process.argv.slice(2)
  const iSo = args.indexOf('--so')
  const so = iSo !== -1 ? args[iSo + 1] : null
  const iRel = args.indexOf('--relatorio')
  const relatorio = iRel !== -1 ? args[iRel + 1] : null
  /** Um item por caso, para o relatório de máquina: { nome, falha }. */
  const resultados = []

  const pastaProvas = join(KIT, 'provas')
  if (!existsSync(pastaProvas)) {
    console.log('✗ não existe a pasta provas/: nenhuma régua foi provada.')
    process.exit(1)
    return
  }

  const arquivos = readdirSync(pastaProvas).filter((f) => f.endsWith('.mjs')).sort()
  if (arquivos.length === 0) {
    console.log('✗ nenhuma prova em provas/: guarda sem prova é guarda cego.')
    process.exit(1)
    return
  }

  let total = 0
  let ruins = 0

  for (const arquivo of arquivos) {
    const nome = arquivo.replace(/\.mjs$/, '')
    if (so && so !== nome) continue

    const mod = await import(pathToFileURL(join(pastaProvas, arquivo)).href)
    const casos = mod.casos ?? []
    const alvo = join(KIT, 'portao', `${mod.conferidor ?? nome}.mjs`)
    if (!existsSync(alvo)) {
      console.log(`  ${pinta('✗', 'vermelho')} ${nome}: não existe portao/${mod.conferidor ?? nome}.mjs`)
      resultados.push({ nome, falha: `não existe portao/${mod.conferidor ?? nome}.mjs` })
      ruins += 1
      continue
    }
    if (casos.length === 0) {
      console.log(`  ${pinta('✗', 'vermelho')} ${nome}: nenhum caso plantado`)
      resultados.push({ nome, falha: 'nenhum caso plantado' })
      ruins += 1
      continue
    }

    let vermelhos = 0
    let verdes = 0
    for (const caso of casos) {
      for (const stack of caso.stacks ?? ['node']) {
        total += 1
        const raiz = criar(`fabrica-prova-${nome}-`)
        try {
          const ajuda = ajudaDe(raiz, stack)
          caso.planta(raiz, stack, ajuda)
          ajuda.gravarStack()

          // ⚠️ `args` por caso: o histórico do `segredos` só roda com `--historico`.
          const extra = (caso.args ?? []).map((a) => ` ${a}`).join('')
          const r = rodar(`node "${alvo.split('\\').join('/')}" --raiz "${raiz.split('\\').join('/')}"${extra}`, {
            cwd: KIT,
            tempoMaximo: 60000
          })
          const deu = r.saiu === 0 ? 'verde' : 'vermelho'
          const esperado = caso.espera
          const rotulo = `${nome} · ${stack} · ${caso.nome}`
          let falha = null

          if (deu !== esperado) {
            falha = `esperava ${esperado}, deu ${deu}`
            ruins += 1
            console.log(`  ${pinta('✗', 'vermelho')} ${nome} · ${stack} · ${caso.nome}: esperava ${esperado}, deu ${deu}`)
            console.log(`       ${r.saida.trim().split('\n').slice(-6).join('\n       ')}`)
          } else if (caso.cita && !caso.cita.test(r.saida)) {
            // ⚠️ O caso VERDE também cita: o verde que só AVISA (a nota do S5, a
            // do histórico) passaria calado mesmo sem o aviso, se a citação só
            // se conferisse no vermelho.
            falha = `${deu === 'verde' ? 'passou' : 'reprovou'}, mas não citou ${caso.cita}`
            ruins += 1
            console.log(`  ${pinta('✗', 'vermelho')} ${nome} · ${stack} · ${caso.nome}: ${falha}`)
            console.log(`       ${r.saida.trim().split('\n').slice(-6).join('\n       ')}`)
          }
          resultados.push({ nome: rotulo, falha })
          if (esperado === 'vermelho') vermelhos += 1
          else verdes += 1
        } finally {
          apagar(raiz)
        }
      }
    }

    // 🚨 Uma régua sem caso VERDE só sabe reprovar, e vira falso positivo; uma
    // sem caso VERMELHO não sabe reprovar nada. As duas faltas são defeito.
    if (vermelhos === 0 || verdes === 0) {
      resultados.push({ nome, falha: `precisa de pelo menos um caso vermelho E um verde (tem ${vermelhos} e ${verdes})` })
      ruins += 1
      console.log(`  ${pinta('✗', 'vermelho')} ${nome}: precisa de pelo menos um caso vermelho E um verde (tem ${vermelhos} e ${verdes})`)
    } else {
      console.log(`  ${pinta('✓', 'verde')} ${nome}: ${vermelhos} vermelho(s), ${verdes} verde(s)`)
    }
  }

  console.log('────────────────────────────────────────')
  // ⚠️ A contagem no formato que o `lib/runner.mjs` sabe ler: é o que deixa o
  // `mutar.mjs` medir um conferidor pela matriz. Sem ela, toda mutação de
  // conferidor sairia "o runner não mediu nada".
  console.log(`# tests ${total}`)
  console.log(`# fail ${ruins}`)
  if (relatorio) escreverJunit(relatorio, resultados)
  if (total === 0) {
    console.log('✗ nenhum caso rodou.')
    process.exit(1)
    return
  }
  if (ruins > 0) {
    console.log(`✗ ${ruins} problema(s) em ${total} caso(s).`)
    process.exit(1)
    return
  }
  console.log(`✅ ${total} caso(s) plantado(s), todos com o desfecho esperado.`)
  process.exit(0)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(ESTE)) {
  principal()
}
