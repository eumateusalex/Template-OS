#!/usr/bin/env node
// A régua de copy da marca deste workspace: roda a régua portátil da /copy
// (.claude/skills/copy/regua/conferir.mjs) e soma por cima as regras de escrita
// pública que a memória dá. Nunca roda em copy de cliente: o cliente tem a voz,
// a caixa e as palavras dele. O que a memória proíbe em texto público reprova
// aqui, por máquina; se a copy convence é de quem revisa.
//
// O que é da portátil (o formato, os blocos de cada tipo, a fonte de número e
// fala no rastro, o provisório, o marcador esquecido, a escola no texto, a ação
// do fim) mora lá e só lá. Aqui ficam:
//   - a linguagem de balcão no título da página (você, a perda ou o ganho, 14
//     palavras) e o jargão, menos o vocabulário próprio que a pessoa listou
//     (_memoria/escrita-publica.md, "Linguagem de balcão")
//   - o travessão e o jargão de guru (escrita-publica.md, "O que evitar")
//   - os padrões de IA que a humanizer nomeia e a máquina vê (scripts/lib/padroes-de-ia.js),
//     o "não é X, é Y" entre eles
//   - "garantia" e "case" (prova.md)
//   - o gancho do anúncio em 125 caracteres (escrita-publica.md, "Copy de venda")
//   - a caixa minúscula, SÓ quando a linha `**Caixa:** minúscula` de
//     _memoria/escrita-publica.md a liga (o padrão, `**Caixa:** normal`, não cobra caixa)
// As listas e o teto são os do scripts/lib/copy.js, e a caixa é a do
// scripts/lib/caixa.js: esta régua importa, não copia.
//
// Uso:   node scripts/copy/conferir.mjs <arquivo.md> [--caixa minuscula|normal] [--memoria <escrita-publica.md>]
//        --caixa decide por cima da memória; --memoria lê outro módulo (a prova usa).
// Saída: 0 passa, 1 algum desvio (cada um com o bloco e o motivo), 2 uso errado.

import { readFileSync, existsSync, realpathSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { conferirCopy, lerTexto, lerVariacoes } from '../../.claude/skills/copy/regua/conferir.mjs'

const require = createRequire(import.meta.url)
const { proibidasDe, RE_VOCE, perdaOuGanho, RE_CASE, RE_TRAVESSAO, MAX_PALAVRAS_POR_FRASE, palavrasDe, jargaoEm, vocabularioDe } = require('../lib/copy.js')
const { maiusculasIndevidas, nomesDaPeca, minusculoPedido, nomesDoVocabulario } = require('../lib/caixa.js')

const INICIO = '<!-- texto -->'
const FIM = '<!-- fim do texto -->'

// os padrões de IA da humanizer, da mesma lista dos slides e da legenda; o
// "não é X, é Y" que esta régua cobra é o contraste fabricado dela
const { achaPadroes } = require('../lib/padroes-de-ia.js')
// O gancho do anúncio pago cabe no que a Meta mostra antes do "ver mais".
const MAX_GANCHO = 125

/**
 * @param {string} bruto  o arquivo de copy
 * @param {{minusculo?: boolean, memoria?: string}} [opcoes]
 *   minusculo decide a caixa por cima da memória; memoria é outro caminho para escrita-publica.md
 */
export function conferirMarca (bruto, opcoes = {}) {
  const texto = String(bruto || '').replace(/\r\n/g, '\n')
  const base = conferirCopy(texto)
  if (!base.medidas) return base
  const desvios = [...base.desvios]
  const falhou = (onde, motivo) => desvios.push(`${onde}: ${motivo}`)
  const minusculo = minusculoPedido(opcoes)
  const vocabulario = vocabularioDe(opcoes)
  const proibidas = proibidasDe(opcoes)

  const blocos = lerTexto(texto.slice(texto.indexOf(INICIO) + INICIO.length, texto.indexOf(FIM)))
  const variacoes = lerVariacoes(texto.slice(texto.indexOf(FIM) + FIM.length))
  // o nome próprio do texto e o que a pessoa escreveu com maiúscula no vocabulário
  const nomes = [...nomesDaPeca(blocos.flatMap(b => b.linhas.map(l => l.texto))), ...nomesDoVocabulario(opcoes)]

  for (const bloco of variacoes ? [...blocos, variacoes] : blocos) {
    const onde = bloco.nome
    const corpo = bloco.linhas.map(l => l.texto).join('\n')
    if (minusculo) {
      for (const p of maiusculasIndevidas(corpo, { nomes })) falhou(onde, `maiúscula fora de sigla e nome próprio: "${p}" (a caixa da marca é minúscula: _memoria/escrita-publica.md, "Caixa")`)
    }
    for (const { texto: t } of bloco.linhas) {
      if (RE_TRAVESSAO.test(t)) falhou(onde, `travessão em "${t}"`)
      for (const [nome, re] of proibidas) if (re.test(t)) falhou(onde, `"${nome}" é palavra que a memória tira do texto público (_memoria/prova.md e escrita-publica.md, "O que evitar")`)
      if (RE_CASE.test(t)) falhou(onde, '"case" fica reservada para cliente real (_memoria/prova.md)')
      for (const nome of jargaoEm(t, vocabulario)) falhou(onde, `jargão "${nome}" em "${t}" (se é palavra do seu negócio, liste em _memoria/escrita-publica.md)`)
      // na página de venda, o contraste fabricado também reprova: a /copy não o aceita
      for (const h of achaPadroes(t)) falhou(onde, `${h.nome} em "${t}": ${h.conserto} (a humanizer)`)
    }
  }

  // O título de balcão é regra de página.
  const topo = base.medidas.modulo === 'pagina' && blocos.find(b => b.nome === 'topo')
  const titulo = topo && (topo.linhas.find(l => l.rotulo === 'titulo') || topo.linhas[0])
  if (titulo) {
    const t = titulo.texto
    if (palavrasDe(t) > MAX_PALAVRAS_POR_FRASE) falhou('topo', `o título tem ${palavrasDe(t)} palavras; o teto é ${MAX_PALAVRAS_POR_FRASE}`)
    if (!RE_VOCE.test(t)) falhou('topo', 'o título não fala com a pessoa: falta "você" ou "seu"')
    if (!perdaOuGanho(t)) falhou('topo', 'o título não diz a perda nem um ganho concreto (cliente, venda, horário, perde, custa, ou o número do ganho)')
  }

  // No anúncio, o gancho cabe no que a Meta mostra antes do "ver mais".
  const gancho = base.medidas.tipo === 'anuncio' && blocos.find(b => b.nome === 'gancho')
  const primeira = gancho && gancho.linhas[0]
  if (primeira && primeira.texto.length > MAX_GANCHO) {
    falhou('gancho', `o gancho tem ${primeira.texto.length} caracteres; o que aparece antes do "ver mais" são ${MAX_GANCHO} (_memoria/escrita-publica.md, "Copy de venda")`)
  }

  return { desvios, medidas: { ...base.medidas, caixa: minusculo ? 'minúscula' : 'normal' } }
}

// Os argumentos: o arquivo, e as opções --caixa e --memoria. Devolve null no uso errado.
export function lerArgumentos (args) {
  const opcoes = {}
  let arquivo = null
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--caixa') {
      const v = String(args[++i] || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
      if (v !== 'minuscula' && v !== 'normal') return null
      opcoes.minusculo = v === 'minuscula'
    } else if (a === '--memoria') {
      if (!args[i + 1]) return null
      opcoes.memoria = args[++i]
    } else if (a.startsWith('--') || arquivo) return null
    else arquivo = a
  }
  return { arquivo, opcoes }
}

function principal () {
  const lidos = lerArgumentos(process.argv.slice(2))
  const arquivo = lidos && lidos.arquivo
  if (!lidos || !arquivo || !existsSync(arquivo)) {
    const motivo = !lidos ? 'opção desconhecida ou sem valor' : arquivo ? `não achei ${arquivo}` : 'falta o arquivo'
    console.error(`✗ ${motivo}: node scripts/copy/conferir.mjs <copy.md> [--caixa minuscula|normal] [--memoria <escrita-publica.md>]`)
    return 2
  }
  const { desvios, medidas } = conferirMarca(readFileSync(arquivo, 'utf8'), lidos.opcoes)
  for (const d of desvios) console.log(`✗ ${d}`)
  if (desvios.length) { console.log(`✗ ${desvios.length} desvio(s)`); return 1 }
  console.log(`✓ a copy passa · ${medidas.blocos} ${medidas.blocos === 1 ? 'bloco' : 'blocos'}, ${medidas.frases} frases, ${medidas.numeros} ${medidas.numeros === 1 ? 'número' : 'números'} com fonte · caixa ${medidas.caixa}`)
  return 0
}

// Roda só quando é o arquivo chamado, e não quando outra régua o importa.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  process.exitCode = principal()
}
