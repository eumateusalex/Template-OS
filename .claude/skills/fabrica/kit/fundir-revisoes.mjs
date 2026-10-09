#!/usr/bin/env node
// node fabrica/fundir-revisoes.mjs --feature specs/NNN-nome --base <ref> [--lentes a,b,c] [--alem-do-teto "<razão>"] [--raiz <dir>]
//
// Junta os relatórios das lentes da rodada ATUAL num só, com UM veredito, conta
// o teto das rodadas e grava `revisoes/fusao.json`.
//
// Classe de defeito: a fusão que nunca roda. Relatório real vem com o veredito
// com prefixo, o "Não verificado" em lista e o "Lido" ausente; a fusão que
// rejeita isso não lê nenhum achado, ninguém a roda, e o teto de duas rodadas
// passa a ser contado de cabeça (e uma "rodada 3" escapa).
//
// 🚨 O que REJEITA uma lente: não ter veredito, não dizer o que deixou de
// verificar, ou devolver GATE VERMELHO (o portão não estava verde). O `Lido:`
// NÃO rejeita: um diff real chega a 147 arquivos. Ele é lido como lista de
// arquivos, pastas e padrões, e o que ficou fora sai como "não citado" na fusão
// e na entrega, à vista.
//
// Os desfechos:
//   0  PRONTA PRA ENTREGA
//   1  AJUSTAR ANTES (volta à construção), ou a fusão não pôde ser feita
//   2  uso errado
//   3  o TETO: rodada 2 com AJUSTAR ANTES, ou rodada 3 sem --alem-do-teto
//
// ⚠️ O que está no `ACEITO.md` da feature sai do relatório: o que ele já viu e
// aceitou não volta em rodada nova.
//
// Prova: testes/teste-fundir-revisoes.mjs

import { join, resolve } from 'node:path'
import { existsSync, readdirSync, writeFileSync, renameSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { ler, linhasDe } from './lib/arquivos.mjs'
import { rodar } from './lib/runner.mjs'

const VEREDITOS = ['AJUSTAR ANTES', 'PRONTA PRA ENTREGA', 'GATE VERMELHO']
const TETO = 2

/** `[local] defeito — regra — conserto`: o formato do contrato das lentes. */
const RE_ACHADO_CONTRATO = /^\s*\[([^\]]+)\]\s*(.+?)\s+—\s+(.+?)\s+—\s+(.+?)\s*$/
/** `1. **ALTO · [local]** texto` ou `1. **[local] texto.** Gravidade 1.`: o formato que elas escrevem. */
const RE_ACHADO_NUMERADO = /^\s*\d+\.\s+\*\*(?:([^*[\]]+?)\s*·\s*)?\[([^\]]+)\]\s*\**\s*(.*)$/

function limpo (texto) {
  return String(texto ?? '').replace(/\*\*/g, '').trim()
}

/** A gravidade de um achado: 1 alta, 2 média, 3 baixa, ou null quando a lente não disse. */
function gravidadeDe (texto) {
  const t = limpo(texto).normalize('NFD').replace(/[^\x20-\x7e]/g, '').toLowerCase()
  const n = /gravidade\s*([123])/.exec(t)
  if (n) return Number(n[1])
  if (/\b(alto|alta|grave|critico|critica)\b/.test(t)) return 1
  if (/\b(medio|media)\b/.test(t)) return 2
  if (/\b(baixo|baixa)\b/.test(t)) return 3
  return null
}

/** Uma seção que pode ser inline (`Rótulo: texto`) ou lista logo abaixo (`Rótulo:` e `- item`). */
function secao (linhas, rotulo) {
  const re = new RegExp(`^\\s*\\**${rotulo}\\**\\s*:\\s*(.*)$`, 'i')
  for (let i = 0; i < linhas.length; i += 1) {
    const m = re.exec(linhas[i])
    if (!m) continue
    const itens = []
    if (m[1].trim()) itens.push(m[1].trim())
    for (let j = i + 1; j < linhas.length; j += 1) {
      const item = /^\s*[-*]\s+(.*)$/.exec(linhas[j])
      if (item) { itens.push(item[1].trim()); continue }
      if (linhas[j].trim() === '' && itens.length <= (m[1].trim() ? 1 : 0)) continue
      break
    }
    return itens
  }
  return null
}

/** Um padrão de `Lido:` (arquivo, pasta ou glob) como função. */
function casador (item) {
  const p = item.replace(/`/g, '').trim().replace(/\\/g, '/').replace(/^\.\//, '')
  if (!p) return () => false
  if (p.includes('*')) {
    const re = new RegExp(`^${p.split('**').map((pedaco) => pedaco.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*')).join('.*')}$`)
    return (f) => re.test(f)
  }
  if (p.endsWith('/')) return (f) => f.startsWith(p)
  return (f) => f === p || f.endsWith(`/${p}`) || p.endsWith(`/${f}`) || f.startsWith(`${p}/`)
}

/** Os arquivos do diff que algum item do `Lido:` cobre. */
export function cobertos (itens, arquivos) {
  const casadores = itens.map(casador)
  return arquivos.filter((f) => casadores.some((c) => c(f)))
}

/** O nome do relatório diz a lente e a rodada: `codigo.md` é 1, `codigo-rodada-2.md` é 2. */
export function rodadaDe (nome) {
  const m = /^(.+?)(?:-rodada-(\d+))?\.md$/.exec(nome)
  return m ? { lente: m[1], rodada: m[2] ? Number(m[2]) : 1 } : null
}

export function conferirRelatorio (texto, arquivosDoDiff = []) {
  const problemas = []
  const achados = []
  const linhas = linhasDe(texto)
  let veredito = null

  for (const linha of linhas) {
    const c = linha.match(RE_ACHADO_CONTRATO)
    if (c) {
      achados.push({ local: c[1].trim(), defeito: c[2].trim(), regra: c[3].trim(), conserto: c[4].trim(), gravidade: gravidadeDe(linha) })
      continue
    }
    const n = linha.match(RE_ACHADO_NUMERADO)
    if (n) {
      // ⚠️ O rótulo (`BAIXO ·`) manda; o texto só decide quando não há rótulo.
      achados.push({ local: n[2].trim(), defeito: limpo(n[3]), regra: '', conserto: '', gravidade: gravidadeDe(n[1] ?? '') ?? gravidadeDe(n[3]) })
      continue
    }
    const v = limpo(linha).replace(/^veredito\s*:\s*/i, '').trim()
    if (VEREDITOS.includes(v)) veredito = v
  }

  const lido = secao(linhas, 'Lido')
  const itensLidos = (lido ?? []).flatMap((x) => x.split(/[,;]/)).map((x) => x.trim()).filter(Boolean)
  const vistos = new Set(cobertos(itensLidos, arquivosDoDiff))
  const naoCitados = arquivosDoDiff.filter((f) => !vistos.has(f))

  const nv = secao(linhas, 'Não verificado') ?? secao(linhas, 'Nao verificado')
  const naoVerificado = nv && nv.length > 0 ? nv.join(' · ') : null

  if (veredito === 'GATE VERMELHO') {
    problemas.push('devolveu GATE VERMELHO: o portão não estava verde quando a lente olhou')
  } else if (!veredito) {
    problemas.push(`sem linha de veredito (${VEREDITOS.slice(0, 2).join(' ou ')})`)
  }
  if (veredito !== 'GATE VERMELHO' && !naoVerificado) {
    problemas.push('sem a seção "Não verificado:": não medir não é o mesmo que estar certo')
  }

  return { ok: problemas.length === 0, problemas, achados, lido: itensLidos, naoCitados, naoVerificado, veredito }
}

/**
 * Duas lentes apontando o mesmo local com o mesmo defeito é um achado só.
 * ⚠️ O separador é VISÍVEL de propósito: caractere invisível some numa limpeza
 * de bytes e leva a deduplicação junto, sem erro nenhum.
 */
function chaveDe (a) {
  return `${a.local} :: ${a.defeito.toLowerCase()}`
}


/**
 * @param {{ lente: string, rodada?: number, texto: string }[]} relatorios
 * @param {string[]} arquivosDoDiff
 * @param {{ aceito?: string, lentes?: string[] | null }} opcoes
 */
export function fundir (relatorios = [], arquivosDoDiff = [], { aceito = '', lentes = null } = {}) {
  const problemas = []
  const rejeitados = []
  const porChave = new Map()
  const naoVerificado = []
  const naoCitados = {}
  let algumAjustar = false

  // Só a rodada ATUAL conta: a anterior já foi consertada, ou não.
  const rodada = relatorios.reduce((max, r) => Math.max(max, r.rodada ?? 1), 1)
  let daRodada = relatorios.filter((r) => (r.rodada ?? 1) === rodada)
  const mantidas = []
  if (lentes) {
    daRodada = daRodada.filter((r) => lentes.includes(r.lente))
    for (const l of lentes) {
      if (daRodada.some((r) => r.lente === l)) continue
      // 🚨 Na rodada 2 só volta a lente que achou algo. A que já deu PRONTA na
      // última rodada em que olhou fica valendo: sem isto, uma rodada 2 limpa
      // sairia no teto.
      if (rodada > 1 && prontaAntes(relatorios, l, rodada, arquivosDoDiff)) { mantidas.push(l); continue }
      rejeitados.push({ lente: l, problemas: [`não entregou relatório na rodada ${rodada}, e não tinha dado PRONTA PRA ENTREGA na rodada anterior`] })
    }
  }

  if (daRodada.length === 0) problemas.push('nenhum relatório de revisão: sem lente, não há veredito')

  for (const rel of daRodada) {
    const r = conferirRelatorio(rel.texto, arquivosDoDiff)
    naoCitados[rel.lente] = r.naoCitados
    if (!r.ok) {
      rejeitados.push({ lente: rel.lente, problemas: r.problemas })
      continue
    }
    if (r.veredito === 'AJUSTAR ANTES') algumAjustar = true
    if (r.naoVerificado) naoVerificado.push(`${rel.lente}: ${r.naoVerificado}`)
    for (const a of r.achados) {
      const chave = chaveDe(a)
      if (porChave.has(chave)) porChave.get(chave).lentes.push(rel.lente)
      else porChave.set(chave, { ...a, lentes: [rel.lente] })
    }
  }

  // O que ele já aceitou não volta: o LOCAL inteiro, com a linha, tem que estar
  // no ACEITO.md. ⚠️ Com o arquivo e uma palavra do defeito, um aceite da linha
  // 12 apagaria o achado da linha 40; casando por pedaço de texto,
  // `src/a.ts:12` apagaria `src/a.ts:1`.
  const achados = [...porChave.values()].filter((a) => !aceito || !aceitou(aceito, a.local))

  // 🚨 O veredito é das LENTES, não da contagem de achados. Um reparo pequeno
  // convive com PRONTA PRA ENTREGA, e quem julga a gravidade é quem olhou.
  const veredito = (algumAjustar || rejeitados.length > 0 || daRodada.length === 0) ? 'AJUSTAR ANTES' : 'PRONTA PRA ENTREGA'
  const teto = veredito === 'AJUSTAR ANTES' && rodada >= TETO
  const abertos = teto ? achados.filter((a) => a.gravidade === 1 || a.gravidade === 2) : []

  return { veredito, rodada, teto, abertos, achados, naoVerificado, naoCitados, rejeitados, mantidas, problemas }
}

/** A lente deu PRONTA PRA ENTREGA, num relatório aceito, na última rodada antes desta em que ela olhou. */
function prontaAntes (relatorios, lente, rodada, arquivosDoDiff) {
  const anteriores = relatorios.filter((r) => r.lente === lente && (r.rodada ?? 1) < rodada)
  if (anteriores.length === 0) return false
  const ultima = anteriores.reduce((a, b) => ((b.rodada ?? 1) > (a.rodada ?? 1) ? b : a))
  const r = conferirRelatorio(ultima.texto, arquivosDoDiff)
  return r.ok && r.veredito === 'PRONTA PRA ENTREGA'
}

/**
 * O local aparece no ACEITO com limite dos dois lados: começo, espaço, crase,
 * colchete ou parêntese antes; fim, espaço, crase, colchete, parêntese, vírgula,
 * ponto e vírgula, ou ponto e dois-pontos de fim de frase depois.
 */
function aceitou (aceito, local) {
  const escapado = local.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(?:^|[\\s\`[(])${escapado}(?=$|[\\s\`\\]),;]|[.:](?:\\s|$))`, 'm')
  return re.test(aceito)
}

function gravarFusao (pasta, dados) {
  const destino = join(pasta, 'fusao.json')
  const provisorio = `${destino}.${process.pid}.tmp`
  writeFileSync(provisorio, `${JSON.stringify(dados, null, 2)}\n`, 'utf8')
  renameSync(provisorio, destino)
}

function principal () {
  const args = process.argv.slice(2)
  const pega = (b) => { const i = args.indexOf(b); return i !== -1 ? args[i + 1] : null }
  const feature = pega('--feature')
  const base = pega('--base')
  const raiz = resolve(pega('--raiz') ?? process.cwd())
  const lentes = pega('--lentes') ? pega('--lentes').split(',').map((x) => x.trim()).filter(Boolean) : null
  const alemDoTeto = pega('--alem-do-teto')

  if (!feature || !base) {
    console.error('uso: node fabrica/fundir-revisoes.mjs --feature specs/NNN-nome --base <ref> [--lentes a,b,c] [--alem-do-teto "<razão>"] [--raiz <dir>]')
    process.exit(2)
    return
  }

  const pasta = join(raiz, feature, 'revisoes')
  if (!existsSync(pasta)) {
    console.log(`✗ não achei ${feature}/revisoes: nenhuma lente escreveu relatório.`)
    process.exit(1)
    return
  }

  // 🚨 Base que o git não conhece REPROVA. Avisar e fundir contra um diff
  // vazio deixaria nenhum arquivo "não citado".
  const diff = rodar(`git diff --name-only "${base}"...HEAD`, { cwd: raiz, tempoMaximo: 30000 })
  if (diff.saiu !== 0) {
    console.log(`✗ não consegui ler o diff contra "${base}": ${diff.saida.trim().split('\n').pop()}`)
    process.exit(1)
    return
  }
  const arquivos = diff.saida.split('\n').map((x) => x.trim()).filter(Boolean)
  const head = rodar('git rev-parse HEAD', { cwd: raiz, tempoMaximo: 15000 }).saida.trim()

  const relatorios = readdirSync(pasta)
    .map((f) => ({ f, id: rodadaDe(f) }))
    .filter((x) => x.id)
    .map((x) => ({ lente: x.id.lente, rodada: x.id.rodada, texto: ler(join(pasta, x.f)) }))

  const aceitoCaminho = join(raiz, feature, 'ACEITO.md')
  const aceito = existsSync(aceitoCaminho) ? ler(aceitoCaminho) : ''
  const r = fundir(relatorios, arquivos, { aceito, lentes })

  const alemSemRazao = r.rodada > TETO && (!alemDoTeto || alemDoTeto.trim().length < 20)

  for (const p of r.problemas) console.log(`  ✗ ${p}`)
  for (const l of r.mantidas) console.log(`  · lente "${l}" mantida: deu PRONTA PRA ENTREGA na rodada anterior e não precisou voltar`)
  for (const rej of r.rejeitados) {
    console.log(`  ✗ lente "${rej.lente}" REJEITADA: ${rej.problemas.join(' · ')}`)
  }
  for (const a of r.achados) {
    const g = a.gravidade ? `G${a.gravidade} ` : ''
    console.log(`  ${g}[${a.local}] ${a.defeito}${a.regra ? ` — ${a.regra}` : ''}${a.conserto ? ` — ${a.conserto}` : ''}   (${a.lentes.join(', ')})`)
  }
  if (r.naoVerificado.length > 0) {
    console.log('\nNão verificado:')
    for (const n of r.naoVerificado) console.log(`  · ${n}`)
  }
  for (const [lente, lista] of Object.entries(r.naoCitados)) {
    if (lista.length > 0) console.log(`  · ${lente} não citou ${lista.length} de ${arquivos.length} arquivo(s) do diff no "Lido:"`)
  }

  gravarFusao(pasta, {
    quando: new Date().toISOString(),
    head,
    base,
    rodada: r.rodada,
    lentes: lentes ?? [...new Set(relatorios.filter((x) => x.rodada === r.rodada).map((x) => x.lente))],
    veredito: r.veredito,
    teto: r.teto || alemSemRazao,
    alemDoTeto: r.rodada > TETO ? (alemDoTeto ?? null) : null,
    abertos: r.abertos,
    achados: r.achados,
    rejeitados: r.rejeitados,
    mantidas: r.mantidas,
    naoVerificado: r.naoVerificado,
    naoCitados: r.naoCitados
  })

  console.log(`\nRodada ${r.rodada} · ${r.veredito}`)
  if (alemSemRazao) {
    console.log(`🛑 TETO: a rodada ${r.rodada} passa do teto de ${TETO}. Ela só existe com --alem-do-teto "<razão>", e a razão fica gravada na fusão.`)
    process.exit(3)
    return
  }
  if (r.teto) {
    console.log(`🛑 TETO: rodada ${r.rodada} ainda com AJUSTAR ANTES. Não há rodada ${r.rodada + 1}: o que sobrou vai na entrega (${r.abertos.length} achado(s) de gravidade 1 ou 2 abertos).`)
    process.exit(3)
    return
  }
  process.exit(r.veredito === 'PRONTA PRA ENTREGA' ? 0 : 1)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  principal()
}
