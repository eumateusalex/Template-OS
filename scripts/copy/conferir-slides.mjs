#!/usr/bin/env node
// A régua do texto dos slides: tira do carrossel.html o texto de cada `.slide` e
// passa por `confereCopy` (scripts/lib/copy.js), com a legenda da peça junto. É a
// entrada de máquina da régua de texto da peça com slides: o render do carrossel
// não lê o texto, e sem isto o texto da arte só passaria pelo olho.
//
// O que entra no texto de um slide:
//   - cada elemento de bloco (div, p, h1 a h6, li, figcaption...) é um trecho
//     próprio, e os trechos chegam a `confereCopy` separados por dois espaços, a
//     fronteira de elemento que ela respeita: um item do `.indice` ou de uma
//     lista não se cola no seguinte para virar uma frase de 40 palavras
//   - o elemento de linha (b, em, span, a, strong...) fica dentro da frase dele
//   - o cabeçalho e o rodapé do slide (`.hdr`, `.ftr`, `.handle`, `.count`,
//     `.chev`) ficam de fora: são o @ e o "3/9", iguais em todo slide
//   - a capa é o slide 1: o título é o primeiro h1 (ou h2), e as partes dela
//     (sobretítulo, título, subtítulo) vão como `capaPartes`
//
// Uso:   node scripts/copy/conferir-slides.mjs <carrossel.html> [--legenda <legenda.txt> | --sem-legenda]
//          [--meta <meta.json>] [--caixa minuscula|normal] [--cliente] [--memoria <escrita-publica.md>] [--json]
//        --legenda: sem ela, lê o legenda.txt ao lado do HTML, se existir
//        --meta: o JSON com o que a peça declara, no formato do `meta` de confereCopy
//          ({ "numeros": [{ "valor": "30 dias", "fonte": "o briefing" }], "clienteReal": false, "nomes": [] });
//          sem ele, todo número da arte reprova por falta de fonte; a peça de uma série que
//          responde no direct declara ali "serie" (e "palavra", "dmLigada"), e só então a arte
//          pode pedir "Comenta X"
//        --cliente: peça de cliente (não lê a memória deste workspace); pede --caixa
//        --json: imprime o veredito e o texto extraído de cada slide
// Saída: 0 passa (os avisos saem com "!"), 1 algum erro, 2 uso errado ou HTML sem `.slide`.

import { readFileSync, existsSync, realpathSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { confereCopy } = require('../lib/copy.js')
const { confereIsca } = require('../lib/legenda.js')

// O que não quebra a frase: o resto é bloco, e vira trecho próprio.
const DE_LINHA = new Set(['a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'data', 'dfn', 'em', 'i', 'img', 'kbd', 'mark', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr'])
const VAZIOS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'])
// A moldura do slide, igual em todos: fica fora do texto.
const MOLDURA = new Set(['hdr', 'ftr', 'handle', 'count', 'chev'])

const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', laquo: '«', raquo: '»', hellip: '…', ndash: '–', mdash: '—', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’' }
const decodifica = s => s.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
  return ENTIDADES[e.toLowerCase()] ?? m
})

const classesDe = atributos => {
  const m = /\bclass\s*=\s*("([^"]*)"|'([^']*)')/i.exec(atributos)
  return new Set(m ? (m[2] ?? m[3]).split(/\s+/).filter(Boolean) : [])
}

/**
 * O texto de cada `.slide` do HTML.
 * @param {string} html
 * @returns {{trechos: string[], titulo: string}[]} um item por slide, na ordem; `trechos` é um elemento por item
 */
export function textoDosSlides (html) {
  const limpo = String(html || '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|template|noscript)\b[\s\S]*?<\/\1\s*>/gi, ' ')
  const slides = []
  // a pilha dos elementos abertos dentro do slide atual: { nome, fora }
  let pilha = null
  let atual = null
  let trecho = ''
  const fechaTrecho = () => {
    // o espaço que a tag de linha deixou antes da pontuação ("<em>assunto</em>.") sai
    const t = trecho.replace(/\s+/g, ' ').replace(/ (?=[.,;:!?…)])/g, '').trim()
    if (t) atual.trechos.push(t)
    trecho = ''
  }
  const fora = () => pilha.some(e => e.fora)
  const RE = /<\/?([a-z][\w-]*)([^>]*)>|([^<]+)/gi
  for (const m of limpo.matchAll(RE)) {
    const [bruto, nomeBruto, atributos, texto] = m
    if (texto !== undefined) {
      if (atual && !fora()) trecho += decodifica(texto)
      continue
    }
    const nome = nomeBruto.toLowerCase()
    const fecha = bruto[1] === '/'
    const vazio = VAZIOS.has(nome) || /\/\s*>$/.test(bruto)
    if (!atual) {
      if (!fecha && !vazio && classesDe(atributos).has('slide')) {
        atual = { trechos: [], titulo: '' }
        pilha = [{ nome, fora: false }]
      }
      continue
    }
    if (!DE_LINHA.has(nome)) fechaTrecho()
    else if (!fora()) trecho += ' '
    if (vazio) continue
    if (!fecha) {
      const classes = classesDe(atributos)
      const ehFora = [...classes].some(c => MOLDURA.has(c))
      pilha.push({ nome, fora: ehFora, titulo: !atual.titulo && /^h[12]$/.test(nome), inicio: atual.trechos.length })
      continue
    }
    // fecha o elemento aberto mais perto com esse nome (HTML de mão perdoa tag solta)
    const i = pilha.map(e => e.nome).lastIndexOf(nome)
    if (i < 0) continue
    const [fechado] = pilha.splice(i)
    if (fechado.titulo) atual.titulo = atual.trechos.slice(fechado.inicio).join(' ')
    if (!pilha.length) {
      fechaTrecho()
      slides.push(atual)
      atual = null
      pilha = null
    }
  }
  if (atual) { fechaTrecho(); slides.push(atual) }
  return slides
}

/**
 * A régua da peça: o texto dos slides e a legenda, por `confereCopy`.
 * @param {string} html  o carrossel.html
 * @param {object} [opcoes]  legenda, meta, minusculo, memoria (as de confereCopy)
 * @returns {{erros: string[], avisos: string[], ia: object[], slides: string[][]}}
 */
export function conferirSlides (html, opcoes = {}) {
  const lidos = textoDosSlides(html)
  const capa = lidos[0]
  const entrada = {
    slides: lidos.map(s => s.trechos.join('  ')),
    trechos: lidos.map(s => s.trechos.join('\n')),
    ...(capa && capa.titulo ? { tituloCapa: capa.titulo } : {}),
    ...(capa ? { capaPartes: capa.trechos } : {}),
    ...opcoes,
  }
  const v = confereCopy(entrada)
  // a isca escrita na ARTE queima a conta como a da legenda: a série vem do --meta
  const { serie, palavra, dmLigada } = opcoes.meta || {}
  v.erros.push(...confereIsca(entrada.slides.join('\n'), { serie, palavra, dmLigada }, 'a arte'))
  return { ...v, slides: lidos.map(s => s.trechos) }
}

// Os argumentos. Devolve null no uso errado.
export function lerArgumentos (args) {
  const r = { opcoes: {}, arquivo: null, legenda: undefined, meta: null, json: false, cliente: false }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--caixa') {
      const v = String(args[++i] || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
      if (v !== 'minuscula' && v !== 'normal') return null
      r.opcoes.minusculo = v === 'minuscula'
    } else if (a === '--memoria' || a === '--legenda' || a === '--meta') {
      if (!args[i + 1]) return null
      const v = args[++i]
      if (a === '--memoria') r.opcoes.memoria = v
      else r[a.slice(2)] = v
    } else if (a === '--sem-legenda') r.legenda = null
    else if (a === '--cliente') r.cliente = true
    else if (a === '--json') r.json = true
    else if (a.startsWith('--') || r.arquivo) return null
    else r.arquivo = a
  }
  if (r.cliente) {
    if (r.opcoes.minusculo === undefined) return null
    r.opcoes.memoria = false
  }
  return r
}

const USO = 'node scripts/copy/conferir-slides.mjs <carrossel.html> [--legenda <legenda.txt> | --sem-legenda] [--meta <meta.json>] [--caixa minuscula|normal] [--cliente] [--memoria <escrita-publica.md>] [--json]'

function principal () {
  const r = lerArgumentos(process.argv.slice(2))
  if (!r || !r.arquivo || !existsSync(r.arquivo)) {
    const motivo = !r ? 'opção desconhecida, sem valor ou --cliente sem --caixa' : r.arquivo ? `não achei ${r.arquivo}` : 'falta o carrossel.html'
    console.error(`✗ ${motivo}: ${USO}`)
    return 2
  }
  const caminhoLegenda = r.legenda === undefined ? join(dirname(r.arquivo), 'legenda.txt') : r.legenda
  if (r.legenda && !existsSync(r.legenda)) { console.error(`✗ não achei a legenda ${r.legenda}`); return 2 }
  const opcoes = { ...r.opcoes }
  if (caminhoLegenda && existsSync(caminhoLegenda)) opcoes.legenda = readFileSync(caminhoLegenda, 'utf8').replace(/\r\n/g, '\n')
  if (r.meta) {
    try { opcoes.meta = JSON.parse(readFileSync(r.meta, 'utf8')) } catch (e) { console.error(`✗ o --meta não é um JSON legível: ${e.message}`); return 2 }
  }
  const v = conferirSlides(readFileSync(r.arquivo, 'utf8'), opcoes)
  if (!v.slides.length) { console.error(`✗ nenhum elemento com a classe "slide" em ${r.arquivo}`); return 2 }
  if (r.json) console.log(JSON.stringify({ erros: v.erros, avisos: v.avisos, slides: v.slides, legenda: opcoes.legenda !== undefined }, null, 1))
  else {
    for (const e of v.erros) console.log(`✗ ${e}`)
    for (const a of v.avisos) console.log(`! ${a}`)
    const resumo = `${v.slides.length} slides${opcoes.legenda !== undefined ? ' e a legenda' : ', sem legenda'}`
    console.log(v.erros.length ? `✗ ${v.erros.length} erro(s) e ${v.avisos.length} aviso(s) · ${resumo}` : `✓ o texto passa · ${resumo}, ${v.avisos.length} aviso(s)`)
  }
  return v.erros.length ? 1 : 0
}

// Roda só quando é o arquivo chamado, e não quando outro script o importa.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  process.exitCode = principal()
}
