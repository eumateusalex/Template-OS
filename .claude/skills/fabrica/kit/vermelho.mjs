#!/usr/bin/env node
// node fabrica/vermelho.mjs --tarefa T012 --teste <caminho> --feature specs/NNN-nome [--comando "<cmd com {relatorio}>"] [--raiz <dir>]
//
// Roda o teste da tarefa ANTES de o código existir, lê o relatório de MÁQUINA
// do runner e grava ele mesmo a linha do vermelho no `provas.md` da feature.
//
// Classe de defeito que ele impede: recibo de vermelho que ninguém viu: linhas
// `vermelho:` do provas.md apontando para vermelho que não foi visto, e uma
// seção inteira escrita à mão só para satisfazer o conferidor. Recibo COPIADO
// pelo modelo se inventa.
//
// 🚨 Ele lê o relatório que o runner escreve para máquina (junit do node e do
// pytest, json do vitest), nunca a tela. Raspar texto de tela quebra na versão
// seguinte do runner; o relatório de máquina é o contrato dele.
//
// ⚠️ Forjar a linha continua possível: é texto num arquivo. O que muda é que o
// caminho mais curto passa a ser o honesto, e a linha forjada precisa inventar
// data e impressão digital do teste, que o revisor confere contra o git.
//
// Os desfechos:
//   0  vermelho visto e gravado
//   1  o teste PASSOU sem o código: ele não mede o que diz medir
//   2  uso errado (argumento, teste inexistente, stack sem `testarUm`)
//   4  o runner não mediu (sem relatório, formato desconhecido, zero teste)
//
// Prova: testes/teste-vermelho.mjs

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

import { rodar } from './lib/runner.mjs'
import { criar, apagar } from './lib/temporaria.mjs'
import { impressaoDe } from './lib/impressao.mjs'
import { lerStack, raizDaPastaDoKit, raizDosArgumentos } from './lib/conferidor.mjs'
import { FORMATOS, segredoNaLinha as acusa } from './portao/segredos.mjs'

export const DESFECHO = { VISTO: 0, NAO_MEDE: 1, USO: 2, NAO_MEDIU: 4 }

/**
 * A linha que este script escreve, e a única que o conferidor `specs` (S7)
 * aceita como vermelho visto. A falha nunca traz `·`: ele é o separador.
 */
export const RECIBO_DE_VERMELHO = /^-\s+(T\d+)\s+·\s+vermelho:\s+([^·]+?)\s+·\s+([^·]+?)\s+·\s+vermelho\.mjs\s+(\d{2}\/\d{2}\/\d{4})\s+([0-9a-f]{8})\s*$/

const TETO_DA_FALHA = 160

// ───────────────────────────────────────── o relatório de máquina

const ENTIDADES = { '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&amp;': '&' }

function desfazEntidades (texto) {
  return texto
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&(lt|gt|quot|apos|amp);/g, (e) => ENTIDADES[e])
    // ⚠️ O junit do node 24 escapa a aspa DUAS vezes (`&amp;quot;`), e o resto
    // uma vez só. Só as aspas se desfazem de novo: um
    // `&lt;` que sobrou é texto que a mensagem trazia de verdade.
    .replace(/&(quot|apos);/g, (e) => ENTIDADES[e])
}

/**
 * A mensagem até a pilha, numa linha só. A pilha (`    at ...`) é endereço,
 * não falha: ela muda de máquina para máquina.
 */
function semPilha (mensagem) {
  const linhas = []
  for (const linha of String(mensagem ?? '').split(/\r?\n/)) {
    if (/^\s+at\s/.test(linha)) break
    if (linha.trim()) linhas.push(linha.trim())
  }
  return linhas.join(' ').replace(/\s+/g, ' ').trim()
}

/**
 * A mensagem genérica que o runner escreve quando o ARQUIVO nem carregou:
 * o node diz "test failed", o pytest diz "collection failure". O erro de
 * verdade está no corpo do elemento (pytest) ou na saída do processo (node).
 */
const GENERICA = /^(test failed|collection failure)$/i

/** A primeira linha `Algo Error: ...` de uma saída de processo. */
function erroDaSaida (saida) {
  for (const linha of String(saida ?? '').split(/\r?\n/)) {
    if (/^\s*[A-Za-z]*Error\b[^:]*:\s*\S/.test(linha)) return linha.trim()
  }
  return null
}

function lerJunit (texto, saida) {
  const casos = [...texto.matchAll(/<testcase\b[\s\S]*?(?:\/>|<\/testcase>)/g)].map((m) => m[0])
  let falharam = 0
  let primeiraFalha = null
  for (const caso of casos) {
    // ⚠️ Os atributos se leem respeitando as aspas: o junit do node deixa o `>`
    // sem escape dentro do `message` (`&lt;y>`, XML válido), e cortar no
    // primeiro `>` perderia a mensagem inteira.
    const f = /<(failure|error)\b((?:[^>"]|"[^"]*")*?)(?:\/>|>([\s\S]*?)<\/\1>)/.exec(caso)
    if (!f) continue
    falharam += 1
    if (primeiraFalha !== null) continue
    const mensagem = semPilha(desfazEntidades((/\bmessage="([^"]*)"/.exec(f[2]) ?? [])[1] ?? ''))
    if (mensagem && !GENERICA.test(mensagem)) {
      primeiraFalha = mensagem
      continue
    }
    // pytest: o corpo traz a linha `E   <erro>`
    const corpo = desfazEntidades(f[3] ?? '')
    const linhaE = corpo.split(/\r?\n/).find((l) => /^E\s+\S/.test(l))
    primeiraFalha = linhaE ? linhaE.replace(/^E\s+/, '').trim() : (erroDaSaida(saida) || mensagem || 'falhou sem mensagem')
  }
  return { formato: 'junit', rodaram: casos.length, falharam, primeiraFalha }
}

function lerVitest (dados) {
  let rodaram = 0
  let falharam = 0
  let primeiraFalha = null
  for (const suite of dados.testResults ?? []) {
    const casos = suite.assertionResults ?? []
    // ⚠️ Arquivo que nem carregou é suíte falha SEM asserção. O vitest diz
    // `numTotalTests: 0` nesse caso, e ler só esse número faria o vermelho mais
    // honesto do começo (`Cannot find module`) virar "o runner não mediu".
    if (casos.length === 0 && suite.status === 'failed') {
      rodaram += 1
      falharam += 1
      primeiraFalha ??= semPilha(suite.message) || 'a suíte não carregou'
      continue
    }
    for (const c of casos) {
      rodaram += 1
      if (c.status !== 'failed') continue
      falharam += 1
      primeiraFalha ??= semPilha((c.failureMessages ?? [])[0]) || c.fullName || 'falhou sem mensagem'
    }
  }
  return { formato: 'vitest', rodaram, falharam, primeiraFalha }
}

/**
 * Lê o relatório de máquina de um runner.
 * `formato: null` quer dizer "não sei ler isto", nunca "zero teste".
 * @param {string} texto  o conteúdo do relatório
 * @param {{ saida?: string }} opcoes  a saída do processo, para o erro de carga do node
 */
export function lerRelatorio (texto, { saida = '' } = {}) {
  const t = String(texto ?? '').trim()
  if (t.startsWith('{')) {
    try {
      return lerVitest(JSON.parse(t))
    } catch {
      return { formato: null, rodaram: 0, falharam: 0, primeiraFalha: null }
    }
  }
  if (/<testsuites?\b/.test(t)) return lerJunit(t, saida)
  return { formato: null, rodaram: 0, falharam: 0, primeiraFalha: null }
}

// ───────────────────────────────────────── o recibo

function dataDeBrasilia (quando) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(quando)
}

/** A falha pronta para a linha: sem o separador, sem quebra, com teto. */
function falhaNaLinha (falha, raiz = '') {
  let f = String(falha ?? '')
  // A raiz e a pasta temporária da máquina saem com a barra que vem depois
  // delas: o caminho fica relativo, e o recibo não carrega o nome de ninguém.
  for (const base of [raiz, tmpdir()].filter(Boolean)) {
    for (const forma of [base, base.split('\\').join('/')]) {
      f = f.split(`${forma}\\`).join('').split(`${forma}/`).join('').split(forma).join('')
    }
  }
  // 🚨 Segredo não entra no recibo, que é versionado: a asserção que compara
  // configuração pode trazer um token na mensagem. Os formatos são os do
  // conferidor `segredos`.
  for (const { re } of FORMATOS) f = f.replace(new RegExp(re.source, 'g'), '‹segredo removido›')
  f = f.split('·').join('-').replace(/\s+/g, ' ').trim()
  return f.length > TETO_DA_FALHA ? `${f.slice(0, TETO_DA_FALHA - 1)}…` : f
}

/** O segredo que ficou na linha do recibo depois da limpeza, pelo detector inteiro do `segredos`, ou null. */
export function segredoNaLinha (linha) {
  return acusa(linha)
}

export function linhaDoRecibo ({ tarefa, teste, falha, quando = new Date(), impressao, raiz = '' }) {
  return `- ${tarefa} · vermelho: ${falhaNaLinha(falha, raiz)} · ${teste} · vermelho.mjs ${dataDeBrasilia(quando)} ${String(impressao).slice(0, 8)}`
}

/**
 * Põe a linha no recibo. A MESMA linha não duplica; um vermelho DIFERENTE da
 * mesma tarefa entra ao lado, e o primeiro fica. Linha nova entra antes da seção
 * de achados, que fecha o arquivo; sem ela, vai no fim.
 * ⚠️ Se a mesma tarefa com o mesmo teste SUBSTITUÍSSE a linha, o vermelho
 * verdadeiro de uma tarefa seria apagado por outro, visto depois.
 */
export function gravarNoRecibo (texto, linha) {
  const linhas = String(texto ?? '').split('\n')
  if (linhas.some((l) => l.trim() === linha.trim())) return linhas.join('\n')
  const achados = linhas.findIndex((l) => /^##\s+O que (esta feature|a fase)/i.test(l))
  if (achados !== -1) {
    const antes = achados > 0 && linhas[achados - 1].trim() === '' ? achados - 1 : achados
    linhas.splice(antes, 0, linha)
    return linhas.join('\n')
  }
  const corpo = linhas.join('\n').replace(/\s*$/, '')
  return `${corpo}\n${linha}\n`
}

// ───────────────────────────────────────── rodar

/**
 * @returns {Promise<{ codigo: number, mensagem: string, linha?: string }>}
 */
export async function vermelho ({ raiz, tarefa, teste, feature, quando = new Date(), tempoMaximo = 10 * 60 * 1000, comando = null }) {
  if (!/^T\d+$/.test(tarefa ?? '')) return { codigo: DESFECHO.USO, mensagem: `tarefa "${tarefa}" não é um id de tarefa (T000)` }
  if (!teste || !existsSync(join(raiz, teste))) return { codigo: DESFECHO.USO, mensagem: `o teste ${teste} não existe em ${raiz}` }
  const recibo = join(raiz, feature ?? '', 'provas.md')
  if (!feature || !existsSync(join(raiz, feature))) return { codigo: DESFECHO.USO, mensagem: `a feature ${feature} não existe` }

  // ⚠️ `comando` troca o runner: a prova de um conferidor é a matriz do kit, não
  // um `node --test`, e ela escreve junit com --relatorio. Aí o {teste} é
  // opcional; o {relatorio} nunca é, porque sem ele não há vermelho de máquina.
  let molde = comando
  if (molde) {
    if (!molde.includes('{relatorio}')) return { codigo: DESFECHO.USO, mensagem: 'o --comando precisa de {relatorio}: é onde o runner escreve o relatório de máquina' }
  } else {
    const { stack, erro } = await lerStack(raiz)
    if (erro) return { codigo: DESFECHO.USO, mensagem: erro }
    molde = stack.COMANDOS?.testarUm
    if (!molde || !molde.includes('{teste}') || !molde.includes('{relatorio}')) {
      return {
        codigo: DESFECHO.USO,
        mensagem: 'falta COMANDOS.testarUm no stack.mjs, com {teste} e {relatorio} (ex.: node --test --test-reporter=junit --test-reporter-destination={relatorio} {teste})'
      }
    }
  }

  const pasta = criar('fabrica-vermelho-')
  try {
    const relatorio = join(pasta, 'relatorio').split('\\').join('/')
    // ⚠️ `split/join`, nunca `replace`: `$&` no caminho viraria outra coisa.
    const linhaDeComando = molde.split('{teste}').join(`"${teste}"`).split('{relatorio}').join(`"${relatorio}"`)
    const r = rodar(linhaDeComando, { cwd: raiz, tempoMaximo })

    if (r.mortoPorTempo) return { codigo: DESFECHO.NAO_MEDIU, mensagem: `o runner foi morto por tempo (${tempoMaximo} ms): sem resposta não há vermelho` }
    if (!existsSync(relatorio)) {
      return { codigo: DESFECHO.NAO_MEDIU, mensagem: `o runner não escreveu o relatório de máquina (saiu ${r.saiu}): ${r.saida.trim().split('\n').slice(-3).join(' | ')}` }
    }
    const lido = lerRelatorio(readFileSync(relatorio, 'utf8'), { saida: r.saida })
    if (lido.formato === null) return { codigo: DESFECHO.NAO_MEDIU, mensagem: 'não sei ler o relatório deste runner (nem junit, nem json do vitest)' }
    if (lido.rodaram === 0) return { codigo: DESFECHO.NAO_MEDIU, mensagem: 'o runner não rodou teste nenhum: zero teste não é vermelho' }
    if (lido.falharam === 0) {
      return {
        codigo: DESFECHO.NAO_MEDE,
        mensagem: `o teste PASSOU sem o código (${lido.rodaram} rodaram, 0 falharam): ele não mede o que diz medir`
      }
    }

    const linha = linhaDoRecibo({ tarefa, teste, falha: lido.primeiraFalha, quando, impressao: impressaoDe(join(raiz, teste)), raiz })
    // 🚨 O que a limpeza dos formatos não tirou, o detector inteiro acusa, e o
    // recibo não é gravado: o provas.md é versionado. A mensagem diz o NOME do
    // que achou, nunca o valor.
    const segredo = segredoNaLinha(linha)
    if (segredo) {
      return {
        codigo: DESFECHO.NAO_MEDIU,
        mensagem: `a falha traz um segredo que a limpeza não tira (${segredo}): o recibo é versionado e não foi gravado. Faça a asserção não imprimir o valor e rode de novo`
      }
    }
    const atual = existsSync(recibo) ? readFileSync(recibo, 'utf8') : `# Provas · ${feature.split('/').pop()}\n`
    writeFileSync(recibo, gravarNoRecibo(atual, linha), 'utf8')
    return { codigo: DESFECHO.VISTO, mensagem: `vermelho visto: ${lido.falharam} de ${lido.rodaram} falharam`, linha }
  } finally {
    apagar(pasta)
  }
}

async function principal () {
  const args = process.argv.slice(2)
  const pega = (b) => { const i = args.indexOf(b); return i !== -1 ? args[i + 1] : null }
  const conhecidas = new Set(['--tarefa', '--teste', '--feature', '--raiz', '--comando'])
  const estranha = args.find((a, i) => a.startsWith('--') && !conhecidas.has(a) && !conhecidas.has(args[i - 1]))
  const tarefa = pega('--tarefa')
  const teste = pega('--teste')
  const feature = pega('--feature')
  if (estranha || !tarefa || !teste || !feature) {
    if (estranha) console.error(`✗ não conheço a bandeira ${estranha}`)
    console.error('uso: node fabrica/vermelho.mjs --tarefa T012 --teste <caminho do teste> --feature specs/NNN-nome [--comando "<cmd com {relatorio}>"] [--raiz <dir>]')
    process.exit(DESFECHO.USO)
    return
  }
  const raiz = raizDosArgumentos(args, raizDaPastaDoKit(dirname(fileURLToPath(import.meta.url))))
  const r = await vermelho({
    raiz,
    tarefa,
    teste: teste.split('\\').join('/'),
    feature: feature.split('\\').join('/').replace(/\/$/, ''),
    comando: pega('--comando')
  })
  console.log(r.codigo === DESFECHO.VISTO ? `✓ ${r.mensagem}` : `✗ ${r.mensagem}`)
  if (r.linha) console.log(`  ${r.linha}`)
  process.exit(r.codigo)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  principal()
}
