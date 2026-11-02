#!/usr/bin/env node
// node fabrica/portao.mjs [--ci] [--listar] [--so <nome>] [--base <ref>] [--raiz <dir>]
//
// O portão do projeto: a lista de conferidores, na ordem, INTEIRA, com todos os
// vermelhos no fim. Só o `testar` (ou um passo com `para: true`) interrompe,
// porque o que vem depois lê a saída dele. A LISTA é do projeto e mora em
// `fabrica/stack.mjs`; este arquivo é do kit e não se edita no alvo.
//
// Classe de defeito que ele impede: portão que para no meio e sai 0 (o
// `comando | tail` devolve o código do tail), e processo morto por tempo lido
// como reprovação legítima.
//
// ⚠️ `--base <ref>` é para a revisão: com ela, a árvore suja conta só no diff
// da feature contra a base e na pasta do kit (ver `estadoDoGit`).
//
// 🚨 A lista roda IGUAL aqui e no CI: na lista, conferidor novo é uma linha só,
// em `stack.mjs` (o arquivo e a prova são os outros dois lugares, em
// `fabrica/LEIA-ME.md`), e vale aqui e no CI de uma vez. Lista escrita duas
// vezes diverge.
//
// Prova: testes/teste-portao.mjs

import { writeFileSync, mkdirSync, appendFileSync, renameSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { rodar } from './lib/runner.mjs'
import { pinta } from './lib/saida.mjs'
import { raizDaPastaDoKit, pastaDoKit } from './lib/conferidor.mjs'

const ESTE = fileURLToPath(import.meta.url)
export const RAIZ_DO_KIT = dirname(ESTE)

/** O `onde` de cada passo, e o que ele quer dizer. */
export const ONDE = {
  todos: 'roda na máquina e no CI',
  maquina: 'só na máquina (exige razão escrita)',
  pr: 'só em pull request'
}

/** Os arquivos de estado que o próprio kit escreve: nunca sujam a árvore. */
const ESTADO_DO_KIT = /(^|\/)\.ultimo-(portao|teste-fabrica)\.json$/

/** O rastro de uma feature (`specs/NNN-nome/`) muda durante a revisão, e não é o que a lente revisa. */
const RASTRO_DA_FEATURE = /^specs\/\d{3}-[^/]+\//

/** Os caminhos de um `git status --porcelain`, com o destino de um renome. */
function caminhosSujos (saida) {
  return saida.split('\n').filter((l) => l.trim()).map((l) => {
    const caminho = l.slice(3).trim()
    const seta = caminho.indexOf(' -> ')
    return (seta === -1 ? caminho : caminho.slice(seta + 4)).replace(/^"|"$/g, '')
  })
}

/**
 * O estado do git para o revisor: o commit, e se a árvore está suja ONDE
 * IMPORTA.
 *
 * 🚨 Árvore suja é o motivo mais comum de uma lente voltar GATE VERMELHO, e o
 * que suja costuma ser o relatório da rodada anterior ou o trabalho de outra
 * sessão. Com várias sessões no mesmo workspace a árvore inteira nunca fica
 * limpa. Conta só o que a lente revisa: fora o rastro da
 * feature e o estado do kit, sempre; e com `base`, só o diff da feature contra
 * ela mais a pasta do kit.
 */
function estadoDoGit (raiz, base = null) {
  const st = rodar('git status --porcelain -uall', { cwd: raiz, tempoMaximo: 15000 })
  const head = rodar('git rev-parse HEAD', { cwd: raiz, tempoMaximo: 15000 })
  const commit = head.saiu === 0 ? head.saida.trim() : null
  if (st.saiu !== 0) return { gitConhecido: false, arvoreSuja: false, sujos: [], escopo: 'sem git', commit }

  let sujos = caminhosSujos(st.saida).filter((c) => !ESTADO_DO_KIT.test(c) && !RASTRO_DA_FEATURE.test(c))
  let escopo = 'a árvore inteira, fora o rastro das features (specs/NNN-nome/)'
  if (base) {
    const diff = rodar(`git diff --name-only "${base}"...HEAD`, { cwd: raiz, tempoMaximo: 15000 })
    if (diff.saiu !== 0) {
      // ⚠️ Sem saber o diff, a árvore não se dá por limpa: ausência de medida
      // não é evidência de conformidade (princípio VI).
      return { gitConhecido: true, arvoreSuja: true, sujos, escopo: `base "${base}" desconhecida pelo git: não conheço o diff`, commit }
    }
    const daFeature = new Set(diff.saida.split('\n').map((x) => x.trim()).filter(Boolean))
    const kit = pastaDoKit(raiz).pasta ?? 'fabrica'
    sujos = sujos.filter((c) => daFeature.has(c) || c.startsWith(`${kit}/`))
    escopo = `o diff contra a base "${base}" e a pasta ${kit}/`
  }
  return { gitConhecido: true, arvoreSuja: sujos.length > 0, sujos: sujos.slice(0, 20), escopo, commit }
}

function gravarEstado (raiz, dados) {
  try {
    // ⚠️ Na pasta do kit deste alvo: `fabrica/` ou `.claude/fabrica/` (a raiz do workspace).
    const pasta = join(raiz, pastaDoKit(raiz).pasta ?? 'fabrica')
    mkdirSync(pasta, { recursive: true })
    // ⚠️ Escrita atômica: ao lado, e depois troca de nome. O revisor lê este
    // arquivo, e um portão morto no meio da escrita deixava JSON pela metade.
    const destino = join(pasta, '.ultimo-portao.json')
    const provisorio = `${destino}.${process.pid}.tmp`
    writeFileSync(provisorio, `${JSON.stringify(dados, null, 2)}\n`, 'utf8')
    renameSync(provisorio, destino)
  } catch (erro) {
    // o estado é conveniência para o revisor; não derruba o portão, mas avisa
    console.error(`⚠ não consegui gravar o .ultimo-portao.json: ${erro.message}`)
  }
}

/** Segundos com uma casa, à brasileira: 1834 → "1,8 s". */
function segundos (ms) {
  return `${(ms / 1000).toFixed(1).replace('.', ',')} s`
}

function escreverResumo (ambiente, pulados, resultado) {
  const destino = ambiente.GITHUB_STEP_SUMMARY
  if (!destino) return
  const linhas = ['## Portão', '', `Resultado: **${resultado}**`, '']
  if (pulados.length === 0) {
    linhas.push('Nenhum passo pulado.')
  } else {
    linhas.push(`### Passos pulados (${pulados.length})`, '')
    for (const p of pulados) linhas.push(`- **${p.nome}** — ${p.razao}`)
    linhas.push('', 'Passo pulado não é passo verde. Ausência de medida não é evidência de conformidade.')
  }
  try {
    appendFileSync(destino, `${linhas.join('\n')}\n`, 'utf8')
  } catch {
    // resumo é enfeite do CI; nunca derruba o portão
  }
}

/**
 * Imprime a lista de passos. Sai 1 quando um passo `maquina` não traz razão:
 * pulo sem razão é o verde mentiroso que o princípio VI proíbe.
 */
export function listarPassos (passos = [], { escreve = console.log } = {}) {
  let ruim = false
  escreve('PASSO                      ONDE      POR QUÊ')
  for (const p of passos) {
    const nome = String(p?.nome ?? '(sem nome)').padEnd(26)
    const onde = String(p?.onde ?? 'todos').padEnd(9)
    const razao = p?.razao ?? ''
    escreve(`${nome}${onde} ${razao}`)
    if (!p?.nome) {
      escreve(`  ${pinta('✗', 'vermelho')} passo sem nome`)
      ruim = true
    }
    if (p?.onde === 'maquina' && !razao) {
      escreve(`  ${pinta('✗', 'vermelho')} ${p.nome}: passo que não roda no CI precisa de razão escrita`)
      ruim = true
    }
  }
  escreve(`Total: ${passos.length} passo(s).`)
  return ruim ? 1 : 0
}

/**
 * O passo que, vermelho, PARA o portão: o que vem depois lê a saída dele.
 * O `testar` é o caso de sempre (a cobertura lê o lcov que ele escreve); outro
 * passo pede o mesmo com `para: true` no `stack.mjs`.
 */
function paraSeVermelho (passo) {
  return passo.para === true || passo.nome === 'testar'
}

/**
 * Roda a lista inteira, na ordem, e reporta TODOS os vermelhos.
 *
 * 🚨 Parar no primeiro vermelho esconde o resto: uma catraca do `silencio`
 * esconde dez passos, e cada conserto revela o próximo defeito numa rodada
 * nova. Só o passo que os outros leem (`testar`, ou `para: true`)
 * interrompe.
 *
 * @returns {{ codigo: number, executados: object[], pulados: object[], vermelhos: string[], parouEm: string|null, naoRodaram: string[] }}
 */
export function rodarPortao ({
  passos = [],
  raiz = process.cwd(),
  so = null,
  ci = false,
  base = null,
  escreve = console.log,
  ambiente = process.env,
  tempoMaximo = 10 * 60 * 1000
} = {}) {
  const executados = []
  const pulados = []
  const vermelhos = []
  let parouEm = null
  let naoRodaram = []

  const fim = (codigo) => {
    const resultado = codigo === 0 ? 'verde' : 'vermelho'
    const git = estadoDoGit(raiz, base)
    gravarEstado(raiz, {
      quando: new Date().toISOString(),
      resultado,
      vermelhos,
      parouEm,
      naoRodaram,
      pulados: pulados.map((p) => p.nome),
      executados: executados.map((e) => e.nome),
      passos: executados.map((e) => ({ nome: e.nome, saiu: e.saiu, duracaoMs: e.duracaoMs })),
      ...git
    })
    escreverResumo(ambiente, pulados, resultado)
    return { codigo, executados, pulados, vermelhos, parouEm, naoRodaram }
  }

  if (passos.length === 0) {
    escreve(`${pinta('✗', 'vermelho')} nenhum passo na lista: o portão não mede nada.`)
    return fim(1)
  }

  const semNome = passos.filter((p) => !p || typeof p.nome !== 'string' || p.nome.trim() === '')
  if (semNome.length > 0) {
    escreve(`${pinta('✗', 'vermelho')} ${semNome.length} passo(s) sem nome em stack.mjs. Corrija antes de rodar.`)
    return fim(1)
  }

  let lista = passos
  if (so) {
    lista = passos.filter((p) => p.nome === so)
    if (lista.length === 0) {
      escreve(`${pinta('✗', 'vermelho')} não existe passo chamado "${so}". Veja "node fabrica/portao.mjs --listar".`)
      return fim(1)
    }
  }

  for (let i = 0; i < lista.length; i += 1) {
    const p = lista[i]
    const comando = p.cmd ?? `npm run ${p.nome}`

    if (ci && p.onde === 'maquina') {
      const razao = p.razao || '(sem razão declarada, e isso é um defeito)'
      pulados.push({ nome: p.nome, razao })
      escreve(`${pinta('⏭', 'amarelo')} ${p.nome} — pulado: ${razao}`)
      continue
    }
    if (ci && p.onde === 'pr' && ambiente.GITHUB_EVENT_NAME !== 'pull_request') {
      const razao = p.razao || 'só roda em pull request'
      pulados.push({ nome: p.nome, razao })
      escreve(`${pinta('⏭', 'amarelo')} ${p.nome} — pulado: ${razao}`)
      continue
    }
    if (p.precisa && !ambiente[p.precisa]) {
      // ⚠️ A razão impressa é a HUMANA quando ela existe. O nome da variável
      // diz o mecanismo, não o motivo, e quem lê o resumo do CI precisa do
      // motivo (constituição VI: passo pulado imprime a razão).
      const razao = p.razao
        ? `${p.razao} (falta ${p.precisa} no ambiente)`
        : `${p.precisa} não está no ambiente`
      pulados.push({ nome: p.nome, razao })
      escreve(`${pinta('⏭', 'amarelo')} ${p.nome} — pulado: ${razao}`)
      continue
    }

    if (ci) escreve(`::group::${p.nome}`)
    escreve(`== ${p.nome} ==`)

    const comecou = Date.now()
    const r = rodar(comando, {
      cwd: raiz,
      tempoMaximo: p.tempoMaximo ?? tempoMaximo,
      env: { ...process.env, ...ambiente },
      ...(p.maxBuffer ? { maxBuffer: p.maxBuffer } : {})
    })
    const duracaoMs = Date.now() - comecou
    executados.push({ nome: p.nome, saiu: r.saiu, duracaoMs })

    if (r.saiu === 0) {
      for (const linha of r.saida.trim().split('\n').slice(-3)) {
        if (linha.trim()) escreve(`  ${linha}`)
      }
      escreve(`  ${pinta('✓', 'verde')} passou · ${segundos(duracaoMs)}`)
      if (ci) escreve('::endgroup::')
      continue
    }

    for (const linha of r.saida.trim().split('\n').slice(-40)) {
      if (linha.trim()) escreve(`  ${linha}`)
    }
    if (ci) escreve('::endgroup::')

    if (r.estourouBuffer) {
      escreve(`${pinta('✗', 'vermelho')} SAÍDA MAIOR QUE O BUFFER: ${p.nome} falou mais do que o portão guarda, e foi cortado.`)
      escreve('   Isto não é lentidão: é saída demais. Rode o passo sozinho para ver o que ele imprime.')
    } else if (r.mortoPorTempo) {
      escreve(`${pinta('⏱', 'amarelo')} MORTO POR TEMPO: ${p.nome} passou de ${p.tempoMaximo ?? tempoMaximo}ms.`)
      escreve('   Isto não é o passo dizendo que reprovou: é o passo sem resposta. Meça de novo antes de julgar.')
    } else {
      escreve(`${pinta('✗', 'vermelho')} REPROVOU: ${p.nome} · ${segundos(duracaoMs)}`)
    }
    vermelhos.push(p.nome)

    if (paraSeVermelho(p)) {
      parouEm = p.nome
      naoRodaram = lista.slice(i + 1).map((x) => x.nome)
      break
    }
  }

  escreve('════════════════════════════════════════')
  if (vermelhos.length > 0) {
    escreve(`${pinta('🔴', 'vermelho')} VERMELHOS (${vermelhos.length}): ${vermelhos.join(', ')}`)
    if (parouEm) {
      escreve(`PAROU EM: ${parouEm} (os passos seguintes leem a saída dele)`)
      escreve(`NÃO RODARAM (${naoRodaram.length}): ${naoRodaram.join(', ') || '—'}`)
    }
    escreve(`Para repetir só um: node ${pastaDoKit(raiz).pasta ?? 'fabrica'}/portao.mjs --so ${vermelhos[0]}`)
    return fim(1)
  }

  escreve(`${pinta('✅', 'verde')} O portão fechou: ${executados.length} de ${lista.length - pulados.length}`)
  if (pulados.length > 0) {
    escreve(`Pulados (${pulados.length}): ${pulados.map((p) => `${p.nome} (${p.razao})`).join(', ')}`)
    escreve('Ausência de medida não é evidência de conformidade.')
  }
  return fim(0)
}

const USO = 'uso: node fabrica/portao.mjs [--ci] [--listar] [--so <passo>] [--base <ref>] [--raiz <dir>]'

/** As bandeiras que existem, e se levam valor. Bandeira desconhecida sai 2. */
const BANDEIRAS = { '--ci': false, '--listar': false, '--so': true, '--base': true, '--raiz': true }

/** Lê os argumentos, ou devolve `{ erro }` com o que não se conhece. */
export function lerArgumentos (args) {
  const lido = { ci: false, listar: false, so: null, base: null, raiz: null }
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i]
    if (!(a in BANDEIRAS)) return { erro: `não conheço ${a}` }
    if (BANDEIRAS[a]) {
      const valor = args[i + 1]
      if (!valor || valor.startsWith('--')) return { erro: `${a} precisa de um valor` }
      lido[a.slice(2)] = valor
      i += 1
    } else {
      lido[a.slice(2)] = true
    }
  }
  return lido
}

async function principal () {
  const lido = lerArgumentos(process.argv.slice(2))
  if (lido.erro) {
    // ⚠️ Bandeira errada não roda o portão "sem ela": `--raix` rodaria o
    // workspace inteiro e diria verde sobre o lugar errado.
    console.error(`✗ ${lido.erro}`)
    console.error(USO)
    process.exit(2)
    return
  }
  const ci = lido.ci || process.env.CI === 'true'

  // O projeto: o `--raiz` pedido, ou uma pasta acima do kit (duas em `.claude/`).
  const raiz = lido.raiz ? resolve(lido.raiz) : raizDaPastaDoKit(RAIZ_DO_KIT)
  const lugar = pastaDoKit(raiz)
  if (lugar.erro) {
    console.error(`✗ ${lugar.erro}`)
    process.exit(1)
    return
  }
  let stack
  try {
    stack = await import(pathToFileURL(join(raiz, lugar.pasta, 'stack.mjs')).href)
  } catch (erro) {
    console.error(`✗ não consegui carregar ${lugar.pasta}/stack.mjs em ${raiz}: ${erro.message}`)
    process.exit(1)
    return
  }

  const passos = stack.PASSOS ?? []
  if (lido.listar) {
    process.exit(listarPassos(passos))
    return
  }
  const r = rodarPortao({ passos, raiz, so: lido.so, ci, base: lido.base })
  process.exit(r.codigo)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(ESTE)) {
  principal()
}
