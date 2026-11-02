#!/usr/bin/env node
// O conferidor da prospecção à mão: lê a pasta de uma operação da /prospeccao
// (saidas/prospeccao-<operacao>/) e diz o que está quebrado e o que vence hoje.
// Não envia nada, não abre conversa e não mexe em arquivo: só lê.
//
// Reprova (saída 1):
//   - a linha quebrada do envios.csv de cada leva: o cabeçalho diferente do molde
//     da skill, o número de colunas (o ";" dentro do obs), o campo obrigatório
//     vazio, a data inválida, o valor fora da lista (abriu, resposta, sim/nao), o
//     código que o mapa-de-situacoes.md da operação não tem, a ficha que não existe,
//     o pedido de parar que não foi para o nao-contatar.md;
//   - o contato do nao-contatar.md (desta operação e de toda pasta irmã
//     saidas/prospeccao-* com manual) que aparece numa ficha que não é a dele,
//     numa folha do dia ou numa linha de envio depois do pedido, ou numa volta
//     enviada depois dele;
//   - a palavra que o metodo.md da skill proíbe, ou que o manual da operação
//     soma, numa mensagem (todo bloco de citação ">" do manual, do banco, do mapa,
//     das fichas e das folhas), e o valor em dinheiro fora da frase de faixa; a
//     palavra "garantia" e as dela só passam quando o manual declara, na linha
//     "A garantia que se dá de fato", a garantia que a operação dá;
//   - o mesmo contato em duas fichas, e a leva sem calibragem aprovada e inteira
//     (os campos da tabela do modo 1 do estrategista, cada um numa seção
//     "## N. Campo" com conteúdo).
// Lista (sem reprovar): as voltas que vencem hoje ou já venceram, os `quando` de
// hoje ou vencidos, a conversa respondida sem `quando`, e o teto do manual
// estourado hoje.
//
// As palavras proibidas moram num lugar só: as linhas "A régua barra:" do
// metodo.md (e as do manual da operação), cada palavra entre crases. O
// cabeçalho do envios.csv é o do molde da skill.
//
// Uso:   node scripts/prospeccao/conferir.mjs <pasta da operação> [--hoje AAAA-MM-DD]
// Saída: 0 nada reprovado, 1 algo reprovado, 2 uso errado.

import { readFileSync, existsSync, readdirSync, statSync, realpathSync } from 'node:fs'
import { join, resolve, dirname, basename, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const SKILL = resolve(AQUI, '..', '..', '.claude', 'skills', 'prospeccao')
const METODO = join(SKILL, 'metodo.md')
const MOLDE_ENVIOS = join(SKILL, 'modelos', 'envios.csv')
const ESTRATEGISTA = resolve(AQUI, '..', '..', '.claude', 'agents', 'comercial', 'estrategista.md')

const OBRIGATORIOS = ['data', 'quem_enviou', 'contato', 'ficha', 'negocio', 'abriu']
const SIM_NAO = ['pediu_oferta_de_entrada', 'conversa_marcada', 'conversa_feita', 'proposta', 'fechou', 'pediu_parar']
const RESPOSTAS = ['', 'sim', 'nao', 'silencio']
const PEDEM_PARAR = ['descadastro', 'irritado']
const VALOR = /R\$\s*\d|\b\d[\d.,]*\s*(?:mil\s+)?reais\b/i
// no item do metodo.md, as palavras depois desta frase só se barram quando o
// manual da operação não declara a garantia que se dá de fato
const SEM_GARANTIA = 'Sem a garantia declarada no manual'

const ler = (arq) => readFileSync(arq, 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n')
const ehPasta = (p) => existsSync(p) && statSync(p).isDirectory()

// ---------- datas ----------
export function dataValida (s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s))
  if (!m) return false
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3]
}
function somaDias (s, dias) {
  const [a, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10)
}
function hojeLocal () {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ---------- palavras ----------
const normal = (s) => ' ' + String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' '

/**
 * As palavras proibidas de um texto do método ou do manual: as que vêm entre
 * crases depois de "A régua barra", no mesmo item de lista ou parágrafo.
 * @returns {{regra: number|null, termo: string}[]}
 */
export function proibidasDe (texto) {
  const itens = []
  let atual = null
  const fecha = () => { if (atual) itens.push(atual); atual = null }
  for (const l of String(texto).replace(/\r\n/g, '\n').split('\n')) {
    const num = /^(\d+)\.\s/.exec(l)
    if (/^\s*$/.test(l) || /^#/.test(l)) { fecha(); continue }
    if (num || /^[-*]\s/.test(l)) { fecha(); atual = { regra: num ? Number(num[1]) : null, texto: l }; continue }
    if (atual) atual.texto += ' ' + l.trim()
    else atual = { regra: null, texto: l }
  }
  fecha()
  const saida = []
  for (const { regra, texto: t } of itens) {
    const i = t.indexOf('A régua barra')
    if (i < 0) continue
    const resto = t.slice(i)
    const j = resto.indexOf(SEM_GARANTIA)
    for (const m of resto.matchAll(/`([^`]+)`/g)) {
      saida.push({ regra, termo: m[1].trim(), liberaComGarantia: j >= 0 && m.index > j })
    }
  }
  return saida
}

/**
 * A garantia que o manual declara: o texto da linha, ou vazio quando ela está
 * em branco, em colchete de molde, `*(nenhuma)*` ou `*(a definir)*`.
 */
export function garantiaDeclarada (manual) {
  const bruta = (/^\*\*A garantia que se dá de fato:\*\*[ \t]*(.*)$/m.exec(String(manual)) || [])[1] || ''
  const t = bruta.replace(/[*_()]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!t || /^\[/.test(t) || /^(nenhuma|a definir)\b/i.test(t)) return ''
  return t
}

// ---------- a calibragem ----------
/**
 * Os campos da calibragem: as linhas `| N | **Campo** |` da tabela do modo 1 do
 * estrategista, que é quem a escreve.
 * @returns {{numero: number, nome: string}[]}
 */
export function camposDaCalibragem (texto) {
  return [...String(texto).matchAll(/^\|\s*(\d+)\s*\|\s*\*\*([^*|]+)\*\*\s*\|/gm)].map((m) => ({ numero: Number(m[1]), nome: m[2].trim() }))
}

/**
 * Os campos que faltam numa CALIBRAGEM.md: o que não tem a seção `## N. Campo`
 * ou a tem vazia (só comentário, `*(a definir)*` ou linha de molde entre colchetes).
 */
export function faltasDaCalibragem (texto, campos) {
  const corpos = new Map()
  let atual = null
  for (const l of String(texto).replace(/\r\n/g, '\n').split('\n')) {
    if (/^#{1,2}\s/.test(l)) {
      const h = /^##\s+(\d{1,2})\s*[.·:)—-]/.exec(l)
      atual = h ? Number(h[1]) : null
      if (atual !== null && !corpos.has(atual)) corpos.set(atual, '')
      continue
    }
    if (atual !== null) corpos.set(atual, corpos.get(atual) + '\n' + l)
  }
  return campos.filter(({ numero }) => {
    if (!corpos.has(numero)) return true
    const limpo = corpos.get(numero)
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/\*\(a definir[^)]*\)\*/gi, ' ')
      .split('\n').filter((l) => !/^\s*\[[^\]]*\]\s*$/.test(l)).join('\n')
    return limpo.trim() === ''
  })
}

// as mensagens de um arquivo: cada grupo de linhas seguidas que começam com ">"
function mensagensDe (texto) {
  const saida = []
  let atual = null
  texto.split('\n').forEach((l, i) => {
    if (/^\s*>/.test(l)) {
      const t = l.replace(/^\s*>\s?/, '')
      if (atual) atual.texto += ' ' + t
      else atual = { linha: i + 1, texto: t }
    } else if (atual) { saida.push(atual); atual = null }
  })
  if (atual) saida.push(atual)
  return saida
}

// ---------- contatos ----------
const RE_EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g
const telefone = (d) => (d.length >= 12 && d.startsWith('55') ? d.slice(2) : d)

/** O contato na forma de comparar: e-mail e perfil em minúsculas, telefone só dígitos, sem o 55. */
export function contatoNormal (c) {
  const s = String(c).trim()
  if (/^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/.test(s)) return s.toLowerCase()
  if (s.startsWith('@')) return s.toLowerCase()
  const d = s.replace(/\D/g, '')
  return d ? telefone(d) : ''
}

/** Todo contato que aparece num texto: e-mail, @perfil e telefone de 10 a 13 dígitos. */
export function contatosDe (texto) {
  const achados = new Set()
  for (const m of texto.matchAll(RE_EMAIL)) achados.add(m[0].toLowerCase())
  const resto = texto.replace(RE_EMAIL, ' ')
  for (const m of resto.matchAll(/(^|[^\w])@([A-Za-z0-9_.]*[A-Za-z0-9_])/g)) achados.add('@' + m[2].toLowerCase())
  for (const m of resto.matchAll(/\+?\d[\d\s().-]{7,}\d/g)) {
    const d = m[0].replace(/\D/g, '')
    if (d.length >= 10 && d.length <= 13) achados.add(telefone(d))
  }
  return achados
}

// o parágrafo do campo **Contato:** de uma ficha ou de um bloco da folha
function campoContato (texto) {
  const linhas = texto.split('\n')
  const i = linhas.findIndex((l) => /^\*\*Contato:\*\*/.test(l))
  if (i < 0) return ''
  let fim = i + 1
  while (fim < linhas.length && linhas[fim].trim() !== '') fim++
  return linhas.slice(i, fim).join('\n')
}

// ---------- a lista de quem não quer ----------
function lerNaoContatar (arq, origem, reprova) {
  if (!existsSync(arq)) return []
  const entradas = []
  ler(arq).split('\n').forEach((l, i) => {
    if (!/^\s*\|/.test(l)) return
    const celulas = l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
    if (/^data$/i.test(celulas[0]) || celulas.every((c) => /^:?-*:?$/.test(c)) || /^\*/.test(celulas[0])) return
    const onde = `${origem}, linha ${i + 1}`
    if (celulas.length < 5) { reprova?.(`${onde}: linha quebrada, ${celulas.length} colunas (Data | Leva e ficha | Negócio | Contato | O que disse)`); return }
    const [data, levaFicha, negocio, contatoBruto] = celulas
    const contato = contatoNormal(contatoBruto)
    if (!dataValida(data)) { reprova?.(`${onde}: data inválida "${data}" (AAAA-MM-DD)`); return }
    if (!contato) { reprova?.(`${onde}: contato vazio`); return }
    const partes = levaFicha.split('/').map((p) => p.trim()).filter(Boolean)
    const ficha = (/^(\d+)/.exec(partes[partes.length - 1] || '') || [])[1]
    entradas.push({ data, leva: partes[0] || '', ficha: ficha ? String(Number(ficha)) : '', negocio, contato, origem })
  })
  return entradas
}

// ---------- o mapa ----------
function codigosDoMapa (arq) {
  if (!existsSync(arq)) return null
  const texto = ler(arq)
  const situacoes = new Set([...texto.matchAll(/^###\s+(S\d{2})\b/gm)].map((m) => m[1]))
  const secao = (titulo) => {
    const i = texto.search(new RegExp(`^## ${titulo}`, 'm'))
    if (i < 0) return ''
    const resto = texto.slice(i + 3)
    const j = resto.search(/^## /m)
    return j < 0 ? resto : resto.slice(0, j)
  }
  const codigos = (t) => new Set([...t.matchAll(/^-\s+`([^`]+)`/gm)].map((m) => m[1]))
  return { situacoes, motivos: codigos(secao('Os motivos de perda')), tipos: codigos(secao('Os tipos de resposta')) }
}

// ---------- o csv ----------
function lerEnvios (arq, rel, cabecalho, reprova) {
  const colunas = cabecalho.split(';')
  const linhas = ler(arq).split('\n')
  if (linhas[0] !== cabecalho) {
    reprova(`${rel}: o cabeçalho é diferente do molde da skill (modelos/envios.csv); copie o cabeçalho de lá`)
    return []
  }
  const saida = []
  for (let i = 1; i < linhas.length; i++) {
    if (linhas[i].trim() === '') continue
    const celulas = linhas[i].split(';')
    if (celulas.length !== colunas.length) {
      reprova(`${rel}, linha ${i + 1}: ${celulas.length} colunas, o cabeçalho tem ${colunas.length} (um ";" dentro do obs? separe com vírgula)`)
      continue
    }
    const r = Object.fromEntries(colunas.map((c, k) => [c, celulas[k].trim()]))
    saida.push({ ...r, _linha: i + 1 })
  }
  return saida
}

function arquivos (pasta, filtro) {
  return ehPasta(pasta) ? readdirSync(pasta).filter(filtro).sort().map((n) => join(pasta, n)) : []
}

/**
 * Confere a pasta de uma operação.
 * @param {string} pasta
 * @param {{hoje: string}} opcoes
 */
export function conferirOperacao (pasta, { hoje }) {
  const reprovas = []
  const avisos = []
  const voltas = []
  const quandos = []
  const semQuando = []
  const reprova = (m) => reprovas.push(m)
  const rel = (p) => relative(pasta, p).split(sep).join('/')

  const cabecalho = ler(MOLDE_ENVIOS).split('\n')[0]
  const manual = ler(join(pasta, 'MANUAL.md'))
  const faixaBruta = (/^\*\*A frase do .quanto custa.:\*\*[ \t]*(.*)$/m.exec(manual) || [])[1] || ''
  const faixa = /a definir/i.test(faixaBruta) ? '' : faixaBruta.replace(/\s+/g, ' ').trim()
  const teto = Number((/^\*\*Teto de conversas novas por dia[^*]*:\*\*\s*(\d+)/m.exec(manual) || [])[1]) || null
  const garantia = garantiaDeclarada(manual)
  const proibidas = [
    ...proibidasDe(ler(METODO)).filter((p) => !(garantia && p.liberaComGarantia)).map((p) => ({ ...p, de: `regra ${p.regra} do metodo.md` })),
    ...proibidasDe(manual).map((p) => ({ ...p, liberaComGarantia: false, de: 'o que esta operação não diz, no MANUAL.md' })),
  ]

  // a lista de quem não quer: a desta operação, e a de toda operação irmã
  const nossa = lerNaoContatar(join(pasta, 'nao-contatar.md'), 'nao-contatar.md', reprova)
  const irmas = []
  const saidas = dirname(pasta)
  for (const nome of ehPasta(saidas) ? readdirSync(saidas).sort() : []) {
    const outra = join(saidas, nome)
    if (!nome.startsWith('prospeccao-') || resolve(outra) === resolve(pasta)) continue
    if (!existsSync(join(outra, 'MANUAL.md'))) continue
    irmas.push(...lerNaoContatar(join(outra, 'nao-contatar.md'), `${nome}/nao-contatar.md`))
  }
  const todas = [...nossa, ...irmas]
  const bloqueados = new Set(todas.map((e) => e.contato))
  const nossosContatos = new Set(nossa.map((e) => e.contato))

  const mapa = codigosDoMapa(join(pasta, 'mapa-de-situacoes.md'))
  if (!mapa) avisos.push('sem mapa-de-situacoes.md na operação: a situação, o motivo e o tipo de resposta não se conferem')

  // as mensagens
  const conferirMensagens = (arq) => {
    if (!existsSync(arq)) return
    for (const { linha, texto } of mensagensDe(ler(arq))) {
      const onde = `${rel(arq)}, linha ${linha}`
      const n = normal(texto)
      for (const { termo, de } of proibidas) {
        if (n.includes(normal(termo))) reprova(`${onde}: "${termo}" na mensagem (${de})`)
      }
      let semFaixa = texto.replace(/\s+/g, ' ')
      if (faixa) semFaixa = semFaixa.split(faixa).join(' ')
      if (VALOR.test(semFaixa)) reprova(`${onde}: valor em dinheiro fora da frase de faixa do manual (regra 3 do metodo.md)`)
    }
  }
  for (const nome of ['MANUAL.md', 'objecoes.md', 'mapa-de-situacoes.md']) conferirMensagens(join(pasta, nome))

  // as levas
  const levas = arquivos(pasta, (n) => /^leva-/.test(n) && ehPasta(join(pasta, n)))
  if (levas.length) {
    const campos = existsSync(ESTRATEGISTA) ? camposDaCalibragem(ler(ESTRATEGISTA)) : []
    const aprovadas = arquivos(pasta, (n) => /^calibragem-/.test(n))
      .map((p) => join(p, 'CALIBRAGEM.md'))
      .filter((arq) => existsSync(arq) && /^estado:\s*aprovada\b/m.test(ler(arq)))
      .map((arq) => ({ arq, faltas: faltasDaCalibragem(ler(arq), campos) }))
    if (!campos.length) reprova('os campos da calibragem não se leram da tabela do modo 1 de .claude/agents/comercial/estrategista.md: sem eles a calibragem não se confere')
    else if (!aprovadas.length) reprova('nenhuma calibragem aprovada (calibragem-*/CALIBRAGEM.md com "estado: aprovada"): a leva não sai sem ela')
    else if (!aprovadas.some((a) => !a.faltas.length)) {
      for (const { arq, faltas } of aprovadas) {
        const lista = faltas.map((c) => `${c.numero} (${c.nome})`).join(', ')
        reprova(`${rel(arq)}: aprovada, mas sem ${faltas.length} dos ${campos.length} campos preenchidos: ${lista}. Cada campo do estrategista é uma seção "## N. Campo" com o conteúdo embaixo; a leva não sai sem a calibragem inteira`)
      }
    }
  }

  const contatoEmFicha = new Map() // contato -> fichas onde está no campo Contato
  for (const leva of levas) {
    const nomeLeva = basename(leva)
    const fichas = arquivos(join(leva, 'fichas'), (n) => n.endsWith('.md'))
    const numeros = new Set(fichas.map((f) => (/^(\d+)/.exec(basename(f)) || [])[1]).filter(Boolean).map((x) => String(Number(x))))

    for (const ficha of fichas) {
      const texto = ler(ficha)
      const num = String(Number((/^(\d+)/.exec(basename(ficha)) || [])[1]))
      const achados = contatosDe(texto)
      for (const e of todas) {
        if (!achados.has(e.contato)) continue
        const dela = e.origem === 'nao-contatar.md' && e.leva === nomeLeva && e.ficha === num
        if (!dela) reprova(`${rel(ficha)}: o contato ${e.contato} está no ${e.origem} desde ${e.data} e não volta em leva nenhuma`)
      }
      for (const c of contatosDe(campoContato(texto))) {
        if (!contatoEmFicha.has(c)) contatoEmFicha.set(c, new Set())
        contatoEmFicha.get(c).add(rel(ficha))
      }
      conferirMensagens(ficha)
    }

    for (const folha of arquivos(leva, (n) => /^folha-.*\.md$/.test(n))) {
      const data = (/^folha-(.+)\.md$/.exec(basename(folha)) || [])[1]
      if (!dataValida(data)) { reprova(`${rel(folha)}: o nome leva a data da folha, folha-AAAA-MM-DD.md`); continue }
      const achados = contatosDe(ler(folha))
      for (const e of todas) {
        if (achados.has(e.contato) && data > e.data) reprova(`${rel(folha)}: o contato ${e.contato} está no ${e.origem} desde ${e.data} e não recebe mais nada`)
      }
      conferirMensagens(folha)
    }

    const csv = join(leva, 'envios.csv')
    if (!existsSync(csv)) continue
    const relCsv = rel(csv)
    for (const r of lerEnvios(csv, relCsv, cabecalho, reprova)) {
      const onde = `${relCsv}, linha ${r._linha}`
      let ok = true
      const erro = (m) => { reprova(`${onde}: ${m}`); ok = false }
      for (const c of OBRIGATORIOS) if (!r[c]) erro(`o campo ${c} está vazio (obrigatório)`)
      if (r.data && !dataValida(r.data)) erro(`data inválida "${r.data}" (AAAA-MM-DD)`)
      if (r.abriu && !['sim', 'nao'].includes(r.abriu)) erro(`abriu "${r.abriu}" (sim ou nao)`)
      if (!RESPOSTAS.includes(r.resposta)) erro(`resposta "${r.resposta}" (sim, nao, silencio ou vazio)`)
      for (const c of SIM_NAO) if (!['', 'sim', 'nao'].includes(r[c])) erro(`${c} "${r[c]}" (sim, nao ou vazio)`)
      if (r.quando && r.quando !== 'encerrada' && !dataValida(r.quando)) erro(`quando inválido "${r.quando}" (AAAA-MM-DD ou encerrada)`)
      for (const v of ['volta_1', 'volta_2']) {
        if (!r[v]) continue
        if (!dataValida(r[v])) erro(`${v} inválida "${r[v]}" (AAAA-MM-DD)`)
        else if (dataValida(r.data) && r[v] < r.data) erro(`${v} antes do envio (${r[v]} < ${r.data})`)
      }
      if (r.volta_2 && !r.volta_1) erro('volta_2 sem volta_1')
      if (r.volta_1 && r.volta_2 && dataValida(r.volta_1) && dataValida(r.volta_2) && r.volta_2 < r.volta_1) erro('volta_2 antes da volta_1')
      if (mapa) {
        if (r.situacao && !mapa.situacoes.has(r.situacao)) erro(`situacao "${r.situacao}" não existe no mapa-de-situacoes.md`)
        if (r.motivo_perda && !mapa.motivos.has(r.motivo_perda)) erro(`motivo_perda "${r.motivo_perda}" não existe no mapa-de-situacoes.md`)
        if (r.tipo_resposta && !mapa.tipos.has(r.tipo_resposta)) erro(`tipo_resposta "${r.tipo_resposta}" não existe no mapa-de-situacoes.md`)
      }
      if (r.ficha && !numeros.has(String(Number(r.ficha)))) erro(`a ficha ${r.ficha} não existe em ${nomeLeva}/fichas/`)

      const contato = contatoNormal(r.contato)
      if (r.pediu_parar === 'sim' && !nossosContatos.has(contato)) erro('pediu para parar e o contato não está no nao-contatar.md (a linha entra no mesmo dia)')
      if (PEDEM_PARAR.includes(r.tipo_resposta) && r.pediu_parar !== 'sim') erro(`tipo_resposta=${r.tipo_resposta} pede pediu_parar=sim`)
      for (const e of todas) {
        if (e.contato !== contato) continue
        if (dataValida(r.data) && r.data > e.data) erro(`o contato ${contato} está no ${e.origem} desde ${e.data} e recebeu um envio novo em ${r.data}`)
        for (const v of ['volta_1', 'volta_2']) {
          if (dataValida(r[v]) && r[v] > e.data) erro(`${v} em ${r[v]}, depois do pedido de parar (${e.origem}, ${e.data})`)
        }
      }
      if (!ok) continue

      // a agenda
      if (r.abriu !== 'sim') continue
      if (bloqueados.has(contato) || r.pediu_parar === 'sim' || r.quando === 'encerrada' || r.motivo_perda || r.fechou === 'sim') continue
      const quem = `${nomeLeva} · ${r.ficha} · ${r.negocio}`
      if (r.resposta === '' || r.resposta === 'silencio') {
        let vence = null
        let qual = ''
        if (!r.volta_1) { vence = somaDias(r.data, 7); qual = '1ª volta' } else if (!r.volta_2) {
          const d21 = somaDias(r.data, 21)
          const d7 = somaDias(r.volta_1, 7)
          vence = d21 > d7 ? d21 : d7
          qual = '2ª volta (a última)'
        }
        if (vence && vence <= hoje) voltas.push(`${quem} · ${qual} · ${vence === hoje ? 'vence hoje' : `vencida desde ${vence}`}`)
      } else if (r.quando) {
        if (r.quando <= hoje) quandos.push(`${quem} · quando ${r.quando} (${r.quando === hoje ? 'hoje' : 'vencido'})`)
      } else {
        semQuando.push(`${quem} · respondeu, envio de ${r.data}`)
      }
    }

    // o teto do dia
    if (teto) {
      const porQuem = new Map()
      for (const r of existsSync(csv) ? lerEnvios(csv, relCsv, cabecalho, () => {}) : []) {
        if (r.abriu === 'sim' && r.data === hoje) porQuem.set(r.quem_enviou, (porQuem.get(r.quem_enviou) || 0) + 1)
      }
      for (const [quem, n] of porQuem) if (n > teto) avisos.push(`${quem} abriu ${n} conversas novas em ${hoje}, acima do teto de ${teto} do manual (${nomeLeva})`)
    }
  }

  for (const [c, fichas] of contatoEmFicha) {
    if (fichas.size > 1) reprova(`mesmo contato ${c} em ${[...fichas].sort().join(' e ')}: um contato vive numa ficha só`)
  }

  return { reprovas, avisos, voltas, quandos, semQuando }
}

function imprimir (pasta, hoje, r) {
  const linhas = [`Operação: ${pasta}`, `Hoje: ${hoje}`, '']
  if (r.reprovas.length) {
    linhas.push(`Reprovado (${r.reprovas.length}):`)
    for (const m of r.reprovas) linhas.push(`  - ${m}`)
  } else linhas.push('Nada reprovado.')
  linhas.push('')
  const bloco = (titulo, itens) => { if (itens.length) { linhas.push(titulo); for (const i of itens) linhas.push(`  - ${i}`) } }
  if (r.voltas.length || r.quandos.length || r.semQuando.length) {
    linhas.push('A agenda de hoje:')
    bloco('Voltas (antes de cada uma, reconfira o sinal):', r.voltas)
    bloco('`quando` de hoje ou vencido:', r.quandos)
    bloco('Sem `quando` (respondeu e não tem dia marcado):', r.semQuando)
  } else linhas.push('A agenda de hoje: nada vence.')
  if (r.avisos.length) {
    linhas.push('')
    bloco('Avisos:', r.avisos)
  }
  console.log(linhas.join('\n'))
}

function principal (args) {
  const uso = 'Uso: node scripts/prospeccao/conferir.mjs <pasta da operação> [--hoje AAAA-MM-DD]'
  let pasta = null
  let hoje = hojeLocal()
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--hoje') hoje = args[++i]
    else if (args[i] === '--help' || args[i] === '-h') { console.log(uso); return 0 } else if (!pasta) pasta = args[i]
    else { console.error(`argumento a mais: ${args[i]}\n${uso}`); return 2 }
  }
  if (!pasta) { console.error(uso); return 2 }
  if (!dataValida(hoje)) { console.error(`--hoje inválido: "${hoje}" (AAAA-MM-DD)`); return 2 }
  if (!existsSync(join(pasta, 'MANUAL.md'))) { console.error(`${pasta} não é a pasta de uma operação: falta o MANUAL.md (o modo operação da /prospeccao monta)`); return 2 }
  const r = conferirOperacao(resolve(pasta), { hoje })
  imprimir(pasta, hoje, r)
  return r.reprovas.length ? 1 : 0
}

const chamado = process.argv[1] && pathToFileURL(realpathSync(process.argv[1])).href === pathToFileURL(realpathSync(fileURLToPath(import.meta.url))).href
if (chamado) process.exitCode = principal(process.argv.slice(2))
