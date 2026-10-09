#!/usr/bin/env node
// node fabrica/portao/specs.mjs [--raiz <dir>]
//
// As regras do rastro, S0 a S7. É aqui que a fábrica cobra POR SCRIPT o que
// o texto da skill só pede: teste antes, o vermelho visto, a mutação das
// tarefas [M], e o plano que responde a constituição.
//
// 🚨 O vermelho que vale é o GERADO pelo `vermelho.mjs`, ou a declaração
// `vermelho não visto: <razão>`. Linha `vermelho:` escrita à mão aponta para
// vermelho que ninguém viu, e uma seção inteira do provas.md se escreve à mão
// para agradar o conferidor. O recibo copiado se inventa; o gerado, não.
//
// ⚠️ A mutação de uma tarefa [M] se prova pelo CABEÇALHO do teste, que é onde
// o `mutar.mjs --registrar` escreve. Uma linha no provas.md seria um segundo
// registro do mesmo fato, e os dois descolariam.
//
// ⚠️ `SPECS = { desde: 'NNN' }` no stack.mjs é catraca de rastro: abaixo do
// número, só o S1. É o caso do projeto com dezenas de rastros escritos antes
// do kit.
//
// ⚠️ A partir de `SPECS.modeloDesde`: o S9 (a forma da spec no modelo da
// /fabrica) e o S3 por par (um teste para cada tarefa de código).
// Sem a chave, nenhum dos dois vale, e a nota diz.
//
// Prova: provas/specs.mjs

import { join } from 'node:path'
import { existsSync, readdirSync, statSync } from 'node:fs'

import { Relatorio } from '../lib/saida.mjs'
import { ler, linhasDe, andar } from '../lib/arquivos.mjs'
import { isento, isentoNoItem } from '../lib/isencao.mjs'
import { comoComando, ehTeste, extensoesDe, pastaDoKit } from '../lib/conferidor.mjs'
import { lerTarefas, caminhosDe } from '../lib/tarefas-da-spec.mjs'
import { RECIBO_DE_VERMELHO } from '../vermelho.mjs'
import { RE_REGISTRO, registrosDo } from './mutacoes.mjs'

const NUCLEO = [
  'I. Teste antes, sempre',
  'II. Regra que importa vira código, não prompt',
  'III. Monolito modular',
  'IV. Nada nasce ligado',
  'V. O estado mora num lugar só',
  'VI. Conferidor que aprova sabe por que aprovou',
  'VII. Decisão de engenharia se escreve antes do código',
  'VIII. Observável por construção',
  'IX. Segurança é fronteira',
  'X. Simplicidade'
]

/** O catálogo de decisões de engenharia, na ordem da skill. Faltar item AVISA; não reprova. */
const CATALOGO = [
  'cache', 'idempotência', 'retentativa e fila morta', 'fila ou síncrono', 'CQRS', 'tempo real',
  'paginação', 'concorrência', 'migração', 'fuso e horário', 'dinheiro', 'autenticação e autorização',
  'limite de taxa', 'observabilidade', 'backup e restauração', 'desligado por padrão', 'dependência nova'
]

/**
 * O acento que o NFD separa da letra.
 * ⚠️ Montada com new RegExp e barra dobrada: escrita direto na literal, a
 * ferramenta de arquivo grava os caracteres combinantes crus.
 */
const ACENTO_COMBINANTE = new RegExp('[\\u0300-\\u036f]', 'g')

const NOME_DE_SPEC = /^\d{3}-[a-z0-9-]+$/
const ESTADO = /^(cumpre|n[ãa]o se aplica|viola)\b\s*(?:[:·—–-]\s*)?(.*)$/i
const COMO_ESCREVER_A_SPEC = 'escreva specs/NNN-nome/spec.md (a /fabrica tem o modelo)'

function pastasDeSpec (raiz) {
  const base = join(raiz, 'specs')
  try {
    return readdirSync(base).filter((n) => {
      try { return statSync(join(base, n)).isDirectory() } catch { return false }
    })
  } catch {
    return []
  }
}

/** Minúscula, sem acento, sem a marcação do markdown. */
function normal (texto) {
  return String(texto ?? '').replace(/[*_`]/g, '').normalize('NFD').replace(ACENTO_COMBINANTE, '').toLowerCase().trim()
}

/** Os títulos `### ` da constituição, na ordem. */
function principiosDa (texto) {
  return linhasDe(texto)
    .filter((l) => l.startsWith('### '))
    .map((l) => l.slice(4).trim())
}

/**
 * A tabela markdown de uma seção, com o cabeçalho separado das linhas.
 * @returns {null | { cabecalho: string[], linhas: string[][] }}
 */
function tabelaDa (texto, titulo) {
  const linhas = linhasDe(texto)
  const i = linhas.findIndex((l) => normal(l) === normal(`## ${titulo}`))
  if (i === -1) return null
  const corpo = []
  for (let j = i + 1; j < linhas.length; j += 1) {
    if (linhas[j].startsWith('## ')) break
    if (/^\s*\|/.test(linhas[j])) corpo.push(linhas[j])
  }
  const celulas = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
  const semSeparador = corpo.filter((l) => !/^\s*\|[\s|:-]+\|\s*$/.test(l))
  if (semSeparador.length === 0) return { cabecalho: [], linhas: [] }
  return { cabecalho: celulas(semSeparador[0]), linhas: semSeparador.slice(1).map(celulas) }
}

/**
 * Onde estão o número, o princípio e o estado, pelo CABEÇALHO.
 * 🚨 Plano real tem `| # | Princípio | Estado |`, e uma régua de posição fixa
 * leria o nome do princípio como estado (um terço dos achados de um plano
 * real).
 */
function colunasDoCheck (cabecalho) {
  const acha = (re) => cabecalho.findIndex((c) => re.test(normal(c)))
  const iEstado = acha(/^estado/)
  const iPrincipio = acha(/^princ/)
  const iNumero = acha(/^(#|n[o.º°]*|num)$/)
  return {
    iNumero,
    iPrincipio: iPrincipio === -1 ? 0 : iPrincipio,
    iEstado: iEstado === -1 ? 1 : iEstado
  }
}

/** O número romano do princípio de uma linha: da coluna `#`, ou do começo do nome. */
function idDaLinha (linha, { iNumero, iPrincipio }) {
  if (iNumero !== -1) {
    const n = normal(linha[iNumero]).toUpperCase()
    if (/^[IVXLC]+$/.test(n)) return n
  }
  const m = /^([IVXLC]+)\./.exec(String(linha[iPrincipio] ?? '').replace(/[*_`]/g, '').trim())
  return m ? m[1] : null
}

/** O estado vale? `cumpre`; ou `não se aplica`/`viola` COM razão, em `:` ou `·`. */
function estadoValido (celula) {
  const m = ESTADO.exec(String(celula ?? '').replace(/[*_`]/g, '').trim())
  if (!m) return false
  if (normal(m[1]) === 'cumpre') return true
  return m[2].trim().length > 0
}

/** Os registros de mutação no cabeçalho de UM arquivo de teste. */
function registrosDoArquivo (raiz, caminho) {
  const alvo = join(raiz, caminho)
  if (!existsSync(alvo)) return []
  try {
    if (!statSync(alvo).isFile()) return []
  } catch {
    return []
  }
  return linhasDe(ler(alvo))
    .map((l) => RE_REGISTRO.exec(l))
    .filter(Boolean)
    .map((m) => ({ teste: caminho, arquivo: m[1].trim() }))
}

/** Dois caminhos são o mesmo arquivo? Um pode vir a partir de outra raiz (`kit/x.mjs`). */
function mesmoArquivo (a, b) {
  return a === b || a.endsWith(`/${b}`) || b.endsWith(`/${a}`)
}

/** S4 · o Constitution Check em tabela, uma linha por princípio do núcleo. */
function conferirCheck (r, pasta, plano) {
  const t = tabelaDa(plano, 'Constitution Check')
  const onde = `specs/${pasta}/plan.md`
  if (t === null) {
    r.achado(onde, 'sem a seção "## Constitution Check"', 'o gate do plano é essa tabela')
    return
  }
  if (t.linhas.length === 0) {
    r.achado(onde, 'Constitution Check em prosa: falta a TABELA', 'uma linha por princípio, com cumpre / não se aplica: razão / viola: razão')
    return
  }
  const colunas = colunasDoCheck(t.cabecalho)
  const ids = t.linhas.map((l) => idDaLinha(l, colunas))
  for (const p of NUCLEO) {
    const romano = p.split('.')[0]
    if (!ids.includes(romano)) {
      r.achado(onde, `o Constitution Check não tem linha para o princípio ${romano}`, 'toda linha do núcleo precisa de estado declarado')
    }
  }
  t.linhas.forEach((linha, i) => {
    if (linha.length < 2) return
    const estado = linha[colunas.iEstado] ?? ''
    if (!estadoValido(estado)) {
      r.achado(onde, `estado "${estado}" em "${ids[i] ?? linha[colunas.iPrincipio]}" não é válido`, 'só vale: cumpre · não se aplica: <razão> · viola: <razão>')
    }
  })
}

/** S5 · as decisões de engenharia respondidas. Faltar item do catálogo avisa. */
function conferirDecisoes (r, pasta, plano) {
  const t = tabelaDa(plano, 'Decisões de engenharia')
  const onde = `specs/${pasta}/plan.md`
  if (t === null) {
    r.achado(onde, 'sem a seção "## Decisões de engenharia"', 'a IA não decide cache, idempotência nem fila morta sozinha: o plano responde item a item')
    return
  }
  if (t.linhas.length === 0) {
    r.achado(onde, 'a seção de decisões de engenharia está vazia', 'responda cada item, e "não se aplica: <razão>" vale')
    return
  }
  const iResposta = Math.max(1, t.cabecalho.findIndex((c) => /^resposta/.test(normal(c))))
  for (const linha of t.linhas) {
    if (linha.length >= 2 && String(linha[iResposta] ?? '').trim() === '') {
      r.achado(onde, `a decisão "${linha[0]}" ficou sem resposta`, '"não se aplica: <razão>" é resposta')
    }
  }
  const respondidas = new Set(t.linhas.map((l) => normal(l[0])))
  const faltam = CATALOGO.filter((c) => !respondidas.has(normal(c)))
  if (faltam.length > 0) r.nota(`${onde}: o plano não responde ${faltam.length} item(ns) do catálogo (${faltam.join(', ')})`)
}

/**
 * As seções que cada tamanho pede, pelo começo do título sem acento. O rótulo é
 * o que o achado cita.
 * ⚠️ A fonte é a tabela do `spec-modelo.md` da /fabrica: seção marcada "sim"
 * num tamanho está aqui, e só ela. O `scripts/testes/teste-modelo-da-spec.mjs`
 * reprova quando os dois divergem.
 */
export const SECOES = {
  P: ['O quê', 'Aceite', 'Fica de fora', 'Os pedidos do dono'],
  M: ['O quê', 'Histórias', 'Casos de borda', 'Suposições', 'Fica de fora', 'Os pedidos do dono'],
  G: ['O quê', 'Histórias', 'Casos de borda', 'Dados', 'Sucesso medido', 'Suposições', 'Fica de fora', 'Os pedidos do dono']
}

const TAMANHO = /^\s*>?\s*Tamanho:\s*\**\s*([PMG])\b(?![a-zà-ú])/im
const PARADA = /^\s*>?\s*Parada 1:\s*(.*)$/im
const DATA = /\b\d{2}\/\d{2}\/\d{4}\b/

/**
 * O texto do modelo que sobrou, a partir do que o modelo da /fabrica escreve:
 * colchete que não é link com palavra minúscula (`[título]`), com duas palavras
 * (`[o caso]`) ou em caixa alta (`[FEATURE]`); e ângulo com mais de uma palavra
 * (`<o que ele disse>`) que não é marcação HTML com atributo nem autofechada.
 * `[x]`, `[ ]`, `[M]`, `[texto](url)`, `<br>`, `<br />` e `<a href="…">` não
 * contam, e o código entre crases sai antes.
 * ⚠️ As expressões não deixam o colchete e o ângulo se repetirem dentro: com
 * repetição o custo é cúbico, e uma linha de 16 mil caracteres com `<a `
 * repetido leva 111 s.
 */
function sobrasDoModelo (linha) {
  const sobras = []
  for (const m of linha.matchAll(/\[([^[\]\n]+)\](?!\()/g)) {
    const c = m[1].trim()
    const minuscula = c.length >= 2 && /^[a-zà-ú]/.test(c)
    const frase = /\s/.test(c) && /[A-Za-zÀ-ú]{2}/.test(c)
    if (minuscula || frase || /^[A-ZÀ-Ú]{3,}$/.test(c)) sobras.push(m[0])
  }
  for (const m of linha.matchAll(/<([A-Za-zÀ-ú][^<>\n]*)>/g)) {
    const marcacao = /^[a-z][a-z0-9-]*\s+[a-z-]+\s*=/.test(m[1]) || /^[a-z][a-z0-9-]*\s*\/$/.test(m[1])
    if (/\s/.test(m[1]) && !marcacao) sobras.push(m[0])
  }
  return sobras
}

/** O estado da Parada 1 para o achado: a linha pode trazer um parágrafo. */
const curto = (texto) => {
  const t = String(texto).trim()
  return t.length > 60 ? `${t.slice(0, 60)}…` : t
}

/** A linha sem o código entre crases, que pode ter `<razão>` de propósito. */
const semCodigo = (linha) => linha.replace(/`[^`]*`/g, '')

/**
 * O ângulo do modelo que abre numa linha e fecha noutra vira uma linha só, na
 * linha onde ele abre; as do meio ficam vazias. Para na linha em branco, e
 * olha no máximo dez linhas adiante.
 * 🚨 O texto do "O quê" do modelo ocupa três linhas, e passaria como conteúdo.
 */
function juntarAngulosQuebrados (saida) {
  for (let i = 0; i < saida.length; i += 1) {
    if (!/<[A-Za-zÀ-ú][^<>]*$/.test(saida[i].l)) continue
    for (let j = i + 1; j < saida.length && j <= i + 10; j += 1) {
      const l = saida[j].l
      if (l.trim() === '') break
      const fecha = l.indexOf('>')
      const abre = l.indexOf('<')
      if (abre !== -1 && (fecha === -1 || abre < fecha)) break
      if (fecha === -1) continue
      saida[i].l = [saida[i].l, ...saida.slice(i + 1, j).map((x) => x.l), l.slice(0, fecha + 1)].join(' ')
      for (let k = i + 1; k < j; k += 1) saida[k].l = ''
      saida[j].l = l.slice(fecha + 1)
      i = j - 1
      break
    }
  }
  return saida
}

/**
 * As linhas da spec sem os comentários HTML, que podem ocupar várias linhas, e
 * sem os blocos de código cercados por três crases.
 * Cada linha guarda o número dela no arquivo, para o achado citar.
 */
function linhasSemComentario (texto) {
  const saida = []
  let dentro = false
  let cercado = false
  linhasDe(texto).forEach((original, i) => {
    // ⚠️ Sem isto, `Map<string, number>` num bloco de código cercado viraria
    // "texto do modelo sobrando".
    if (!dentro && /^\s*```/.test(original)) {
      cercado = !cercado
      saida.push({ n: i + 1, l: '' })
      return
    }
    if (cercado) {
      saida.push({ n: i + 1, l: '' })
      return
    }
    let linha = ''
    let resto = original
    while (resto.length > 0) {
      if (dentro) {
        const fim = resto.indexOf('-->')
        if (fim === -1) { resto = ''; break }
        dentro = false
        resto = resto.slice(fim + 3)
      } else {
        const ini = resto.indexOf('<!--')
        if (ini === -1) { linha += resto; resto = ''; break }
        linha += resto.slice(0, ini)
        dentro = true
        resto = resto.slice(ini + 4)
      }
    }
    saida.push({ n: i + 1, l: linha })
  })
  return juntarAngulosQuebrados(saida)
}

/** A linha diz alguma coisa? Não é vazia, separador, título, nem só texto do modelo. */
function temConteudo (linha) {
  let l = semCodigo(linha)
  for (const s of sobrasDoModelo(l)) l = l.split(s).join('')
  if (/^\s*#/.test(linha)) return false
  if (/^\s*\|[\s|:-]+\|\s*$/.test(linha)) return false
  return /[A-Za-zÀ-ú0-9]/.test(l.replace(/[*_>|:.,;·\-–—()]/g, ''))
}

/**
 * S9 · a forma da spec, para as features dentro do alcance de `modeloDesde`.
 * 🚨 O modelo da fábrica é a única régua da spec, e sem isto uma spec de uma
 * linha passaria.
 * @returns {{ tamanho: string|null, pendente: boolean }}
 */
function conferirForma (r, pasta, texto) {
  const onde = `specs/${pasta}/spec.md`
  const linhas = linhasSemComentario(texto)
  const corpo = linhas.map((x) => x.l).join('\n')

  const tamanho = TAMANHO.exec(corpo)?.[1]?.toUpperCase() ?? null
  if (tamanho === null) {
    r.achado(onde, 'a spec não declara o tamanho', 'escreva "> Tamanho: P", "M" ou "G" no cabeçalho, como no modelo da /fabrica')
  }

  const parada = PARADA.exec(corpo)
  const estado = normal(parada?.[1] ?? '')
  const pendente = estado.startsWith('pendente')
  if (!parada) {
    r.achado(onde, 'a spec não tem a linha da Parada 1', 'escreva "> Parada 1: pendente · N perguntas", "fechado · <data>", "sem decisão dele" ou "grill · <data>"')
  } else if (!/^(pendente|fechado|sem decisao dele|grill)\b/.test(estado)) {
    r.achado(onde, `a Parada 1 "${curto(parada[1])}" não é um estado que vale`, 'só vale: pendente · N perguntas · fechado · <data> · sem decisão dele · grill · <data>')
  } else if (/^(fechado|grill)/.test(estado) && !DATA.test(parada[1])) {
    r.achado(onde, `a Parada 1 "${curto(parada[1])}" não tem a data`, 'escreva a data em que ele respondeu: dd/mm/aaaa')
  }

  // As seções, e o conteúdo de cada uma. Cabeçalho de tabela não é conteúdo:
  // é a linha logo antes do separador.
  const secoes = new Map()
  let atual = null
  linhas.forEach((x, i) => {
    if (/^##\s/.test(x.l) && !/^###/.test(x.l)) {
      atual = normal(x.l.replace(/^##\s+/, ''))
      secoes.set(atual, secoes.get(atual) ?? false)
      return
    }
    if (atual === null) return
    const cabecalhoDeTabela = /^\s*\|[\s|:-]+\|\s*$/.test(linhas[i + 1]?.l ?? '')
    if (!cabecalhoDeTabela && temConteudo(x.l)) secoes.set(atual, true)
  })
  for (const rotulo of SECOES[tamanho] ?? []) {
    const chave = normal(rotulo)
    const achada = [...secoes.keys()].find((s) => s.startsWith(chave))
    if (achada === undefined) {
      r.achado(onde, `falta a seção "## ${rotulo}", que o tamanho ${tamanho} pede`, 'o modelo da /fabrica diz o que vai nela')
    } else if (!secoes.get(achada)) {
      r.achado(onde, `a seção "## ${rotulo}" está vazia ou só tem o texto do modelo`, 'escreva o que vale para esta feature')
    }
  }

  for (const x of linhas) {
    const sobra = sobrasDoModelo(semCodigo(x.l))
    if (sobra.length > 0) r.achado(`${onde}:${x.n}`, `texto do modelo sobrando: ${sobra.join(' ')}`, 'troque pelo que vale para esta feature')
    const espera = /\(espera (P\d+)\)/i.exec(semCodigo(x.l))
    if (espera && parada && !pendente) {
      r.achado(`${onde}:${x.n}`, `a Parada 1 diz "${curto(parada[1])}" e ainda há "(espera ${espera[1]})"`, 'com a resposta dele, a marca sai e o texto vira o que ele decidiu')
    }
  }

  return { tamanho, pendente }
}

/** S7 · a linha do vermelho de uma tarefa de código feita. */
function conferirVermelho (r, pasta, t, linhasRecibo, kit) {
  const doId = new RegExp(`\\b${t.id}\\b`)
  const minhas = linhasRecibo.map((l, i) => ({ l: l.trim(), i })).filter((x) => doId.test(x.l))
  const gerada = minhas.some((x) => (RECIBO_DE_VERMELHO.exec(x.l) ?? [])[1] === t.id)
  if (gerada) return

  const declaracoes = minhas.map((x) => isentoNoItem(linhasRecibo, x.i, 'vermelho não visto'))
  if (declaracoes.some((d) => d.isento)) return

  const onde = `specs/${pasta}/provas.md`
  const conserto = `rode node ${kit}/vermelho.mjs --tarefa ${t.id} --teste <teste> --feature specs/${pasta} antes do código, ou escreva - ${t.id} · vermelho não visto: <razão>`
  const semRazao = declaracoes.find((d) => /sem razão escrita/.test(d.porque))
  if (semRazao) {
    r.achado(onde, `${t.id}: "vermelho não visto" sem razão escrita`, conserto)
  } else if (minhas.some((x) => /vermelho/i.test(x.l))) {
    r.achado(onde, `${t.id}: a linha do vermelho não é a gerada pelo vermelho.mjs (escrita à mão não vale)`, conserto)
  } else {
    r.achado(onde, `${t.id} está feita e não tem a linha do vermelho`, conserto)
  }
}

export function conferir (raiz, stack, { escreve = console.log } = {}) {
  const kit = pastaDoKit(raiz).pasta ?? 'fabrica'
  const r = new Relatorio('specs', {
    escreve,
    regra: 'constituição I, V e VII: teste antes, estado num lugar só, decisão escrita antes'
  })

  let olhados = 0

  const desde = stack.SPECS?.desde
  if (desde !== undefined && !/^\d{3}$/.test(String(desde))) {
    r.naoMedido(`SPECS.desde é "${desde}", e só vale um número de três dígitos (a primeira feature cobrada inteira)`)
  }
  const cobradaInteira = (pasta) => desde === undefined || !/^\d{3}$/.test(String(desde)) || pasta.slice(0, 3) >= String(desde)

  // S9 · a forma da spec vale a partir de `modeloDesde`. Sem a chave, não vale,
  // e a nota diz: é a marca que separa as specs de antes do modelo.
  const modeloDesde = stack.SPECS?.modeloDesde
  const marcaValida = /^\d{3}$/.test(String(modeloDesde ?? ''))
  if (modeloDesde === undefined) {
    r.nota('SPECS.modeloDesde não declarado: a forma da spec (tamanho, Parada 1, seções) não é cobrada neste projeto')
  } else if (!marcaValida) {
    r.naoMedido(`SPECS.modeloDesde é "${modeloDesde}", e só vale um número de três dígitos (a primeira feature no modelo da spec)`)
  }
  const noModelo = (pasta) => marcaValida && pasta.slice(0, 3) >= String(modeloDesde)

  // S6 · a constituição carrega o núcleo, na ordem
  const caminhoConst = join(raiz, 'specs', 'constitution.md')
  if (existsSync(caminhoConst)) {
    olhados += 1
    const principios = principiosDa(ler(caminhoConst))
    const doNucleo = principios.filter((p) => NUCLEO.includes(p))
    for (const esperado of NUCLEO) {
      if (!principios.includes(esperado)) {
        r.achado('specs/constitution.md', `falta o princípio do núcleo "${esperado}"`, 'o núcleo I a X não se remove: MAJOR só redefine, nunca apaga')
      }
    }
    for (let i = 0; i < doNucleo.length; i += 1) {
      if (doNucleo[i] !== NUCLEO[i]) {
        r.achado('specs/constitution.md', `o núcleo está fora de ordem: esperava "${NUCLEO[i]}" e veio "${doNucleo[i]}"`, 'mantenha I a X na ordem')
        break
      }
    }
  }

  const pastas = pastasDeSpec(raiz)

  // 🚨 S0 · CÓDIGO SEM SPEC NENHUMA: módulos de produção fazendo aritmética de
  // dinheiro e `specs/` só com a constituição. Sem isto, o laço abaixo roda
  // ZERO vezes, e o conferidor fecha verde.
  // ⚠️ Projeto sem código nenhum não cai aqui, e projeto que é fixture ou
  // espelho declara a razão: `sem spec declarado: <razão>` no LEIA-ME ou no
  // README da raiz.
  if (pastas.length === 0) {
    const temCodigo = (stack.CODIGO ?? []).some((pasta) => {
      const raizDaPasta = join(raiz, pasta)
      return existsSync(raizDaPasta) && [...andar(raizDaPasta, { extensoes: extensoesDe(stack) })]
        .some((rel) => !ehTeste(`${pasta}/${rel}`, stack))
    })
    if (temCodigo) {
      olhados += 1
      const onde = ['README.md', 'LEIA-ME.md'].map((n) => join(raiz, n)).filter((p) => existsSync(p))
      const dispensado = onde.some((p) => {
        const linhas = linhasDe(ler(p))
        return linhas.some((_, i) => isento(linhas, i, 'sem spec declarado').isento)
      })
      if (!dispensado) {
        r.achado('specs/', 'este projeto tem código de produção e NENHUMA pasta de feature em specs/', `${COMO_ESCREVER_A_SPEC}, ou escreva "sem spec declarado: <razão>" no README da raiz`)
      }
    }
  }

  let registrosDoProjeto = null
  let abaixo = 0
  let foraDoModelo = 0

  for (const pasta of pastas) {
    const base = join(raiz, 'specs', pasta)

    // S1 · nome e spec.md
    olhados += 1
    if (!NOME_DE_SPEC.test(pasta)) {
      r.achado(`specs/${pasta}`, 'fora do padrão NNN-nome-curto', 'três dígitos e minúsculas com hífen')
      continue
    }
    if (!existsSync(join(base, 'spec.md'))) {
      r.achado(`specs/${pasta}`, 'sem spec.md', COMO_ESCREVER_A_SPEC)
      continue
    }
    if (!cobradaInteira(pasta)) {
      abaixo += 1
      continue
    }

    const forma = noModelo(pasta) ? conferirForma(r, pasta, ler(join(base, 'spec.md'))) : null
    if (forma === null && marcaValida) foraDoModelo += 1

    const plano = existsSync(join(base, 'plan.md')) ? ler(join(base, 'plan.md')) : null
    if (plano !== null) {
      olhados += 1
      conferirCheck(r, pasta, plano)
      conferirDecisoes(r, pasta, plano)
    }

    // S2, S3, S7 · as tarefas
    const caminhoTarefas = join(base, 'tasks.md')
    if (!existsSync(caminhoTarefas)) continue
    olhados += 1

    if (plano === null && (forma?.tamanho === 'M' || forma?.tamanho === 'G')) {
      r.achado(`specs/${pasta}`, `tamanho ${forma.tamanho} com tasks.md e sem plan.md`, 'o plano vem antes das tarefas em M e G; só o P dispensa')
    }

    const textoTarefas = ler(caminhoTarefas)
    const tarefas = lerTarefas(textoTarefas)
    const linhasTarefas = linhasDe(textoTarefas)

    if (tarefas.length === 0) {
      r.achado(`specs/${pasta}/tasks.md`, 'nenhuma tarefa: verde medindo zero', 'escreva as tarefas, ou apague o arquivo')
      continue
    }

    const recibo = existsSync(join(base, 'provas.md')) ? ler(join(base, 'provas.md')) : ''
    const linhasRecibo = linhasDe(recibo)

    const creditos = new Map()
    for (let i = 0; i < tarefas.length; i += 1) {
      const t = tarefas[i]
      const caminhos = caminhosDe(t.texto)
      const tocaCodigo = caminhos.some((c) => !ehTeste(c, stack))
      const tocaTeste = caminhos.some((c) => ehTeste(c, stack))

      // A dispensa vale para as DUAS regras: tarefa sem teste declarado não
      // tem vermelho a registrar.
      // 🚨 `isentoNoItem`, nunca `isento`: numa lista, a linha de cima é OUTRA
      // TAREFA, e a isenção dela vazaria para esta.
      const dispensada = isentoNoItem(linhasTarefas, t.linha - 1, 'sem teste declarado').isento

      // S3 · teste antes, na mesma fase
      const testesAntes = tarefas.slice(0, i).filter((x) => x.fase === t.fase)
        .flatMap((x) => caminhosDe(x.texto)).filter((c) => ehTeste(c, stack))
      if (tocaCodigo && !tocaTeste && !dispensada && testesAntes.length === 0) {
        r.achado(
          `specs/${pasta}/tasks.md:${t.linha}`,
          `${t.id} toca código e não tem tarefa de teste antes dela, na mesma fase`,
          'ponha a tarefa de teste antes, ou escreva "sem teste declarado: <razão>" na linha'
        )
      }

      // S3 · um teste por tarefa de código, dentro do alcance da forma.
      // 🚨 Um teste na fase não libera todas as tarefas de código dela. Cada
      // tarefa de teste puro é um crédito, e cada tarefa de código
      // puro consome um; a que toca os dois é o par dela mesma.
      if (tocaTeste && !tocaCodigo) creditos.set(t.fase, (creditos.get(t.fase) ?? 0) + 1)
      if (forma !== null && tocaCodigo && !tocaTeste && !dispensada && testesAntes.length > 0) {
        const credito = creditos.get(t.fase) ?? 0
        if (credito > 0) {
          creditos.set(t.fase, credito - 1)
        } else {
          r.achado(
            `specs/${pasta}/tasks.md:${t.linha}`,
            `${t.id} toca código e o teste de antes, na mesma fase, já é de outra tarefa`,
            'um teste por tarefa de código: ponha a tarefa de teste dela antes, ou escreva "sem teste declarado: <razão>" na linha'
          )
        }
      }

      // S9 · com a Parada 1 pendente, nenhuma tarefa de código fica feita, nem a
      // dispensada de teste: a dispensa é do teste, não da decisão dele.
      if (t.feito && tocaCodigo && forma?.pendente) {
        r.achado(`specs/${pasta}/tasks.md:${t.linha}`, `${t.id} está feita com a Parada 1 pendente`, 'as perguntas para o dono se respondem antes do código')
      }

      if (!t.feito || dispensada) continue

      // S7 · o vermelho, gerado ou declarado
      if (tocaCodigo) conferirVermelho(r, pasta, t, linhasRecibo, kit)

      // S7 · a mutação da tarefa [M], no cabeçalho de um teste
      if (t.mutacao) {
        registrosDoProjeto ??= registrosDo(raiz, stack)
        const testesDaTarefa = [...testesAntes, ...caminhos.filter((c) => ehTeste(c, stack))]
        const registros = [...registrosDoProjeto, ...testesDaTarefa.flatMap((c) => registrosDoArquivo(raiz, c))]
        const codigo = caminhos.filter((c) => !ehTeste(c, stack))
        const provada = codigo.length > 0
          ? registros.some((x) => codigo.some((c) => mesmoArquivo(x.arquivo, c)))
          : registros.some((x) => testesDaTarefa.includes(x.teste))
        if (!provada) {
          r.achado(
            `specs/${pasta}/tasks.md:${t.linha}`,
            `${t.id} é [M] e nenhum teste registra a mutação ${codigo.length > 0 ? `de ${codigo.join(', ')}` : 'no cabeçalho'}`,
            `rode node ${kit}/mutar.mjs <arquivo> "<de>" "<para>" --comando "<teste>" --registrar <teste>`
          )
        }
      }
    }
  }

  if (foraDoModelo > 0) r.nota(`${foraDoModelo} feature(s) abaixo de SPECS.modeloDesde (${modeloDesde}): a forma da spec não é cobrada nelas`)
  if (abaixo > 0) r.nota(`${abaixo} feature(s) abaixo de SPECS.desde (${desde}): delas só se cobra o nome e o spec.md`)
  r.varreu(olhados)
  return r.fechar()
}

comoComando(import.meta.url, (raiz, stack, opcoes) => conferir(raiz, stack, opcoes))
