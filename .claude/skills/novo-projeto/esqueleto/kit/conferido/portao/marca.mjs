#!/usr/bin/env node
// fundação: conferido v1 · o ajuste mora no fundacao.json (pisos) e nos tokens da marca
//
// node fundacao/portao/marca.mjs [--raiz <dir>]
//
// Classe de defeito: cor fora da marca chegando à tela. Quatro portas, e as
// quatro são reais: hex escrito na página, classe da paleta do
// Tailwind no lugar do papel, papel do shadcn que o tema esqueceu (e a cor do
// CLI aparece), e par de texto que não se lê. A pior delas, medida num projeto real:
// duas fontes de token no mesmo projeto, divergindo em silêncio.
//
// ⚠️ Hex e paleta são CATRACA: o piso mora no `fundacao.json`, medido no dia
// da instalação (zero num projeto novo; o que já havia num projeto que adota),
// e só desce. Conferidor que nasce vermelho em projeto existente é conferidor
// que alguém desliga.
//
// Prova: provas/marca.mjs

import { join, extname } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'

import { Relatorio } from '../lib/saida.mjs'
import { andar, semComentario, linhasDe } from '../lib/arquivos.mjs'
import { isento } from '../lib/isencao.mjs'
import { comoComando } from '../lib/casca.mjs'
import {
  declaracoesDoSeletor, nomesDeclarados, mapaDoArquivo, contrasteDoTema, VALOR_DO_TEMA
} from '../lib/cor.mjs'

const EXTENSOES = ['.css', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.astro']

// 🚨 Escrita como LITERAL, nunca montada por template string: num `new RegExp`
// o `\b` vira backspace e a régua passa a casar com nada. É a régua do `auditar-shadcn.mjs` dele, mais branco e preto.
const PALETA = /\b(?:bg|text|border|ring|fill|stroke|from|to|via|decoration|outline|shadow|accent|caret|divide|placeholder)-(?:(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|mauve|olive)-(?:50|[1-9]00|950)|white|black)\b/g
const HEX = /#[0-9a-f]{3,8}\b/gi
const ACENTO = 'src/lib/acento.ts'
const MARCA_DO_CLI = 'cor do CLI'

/**
 * As linhas (primeira e última) do bloco de topo de um seletor no CSS. A
 * isenção "cor do CLI" vale só dentro do bloco que ela marca: escrita no
 * `:root`, ela não isenta o mesmo papel esquecido no `.dark`.
 */
function faixaDoBloco (linhas, seletor) {
  const inicio = linhas.findIndex((l) => l.trim().startsWith(`${seletor} {`) || l.trim() === `${seletor}{`)
  if (inicio === -1) return [0, -1]
  let profundidade = 0
  for (let j = inicio; j < linhas.length; j += 1) {
    profundidade += (linhas[j].match(/\{/g) ?? []).length - (linhas[j].match(/\}/g) ?? []).length
    if (profundidade <= 0 && j > inicio) return [inicio, j]
  }
  return [inicio, linhas.length - 1]
}

/** Os arquivos da marca: os do projeto em src/styles/, ou os da casa em fundacao/. */
function arquivosDaMarca (manifesto) {
  const doProjeto = manifesto.marca?.tipo !== 'casa'
  const pasta = doProjeto ? 'src/styles' : 'fundacao'
  return { doProjeto, tokens: `${pasta}/tokens.css`, tema: `${pasta}/tema-shadcn.css` }
}

export function conferir (raiz, { manifesto }, { escreve = console.log } = {}) {
  const r = new Relatorio('marca', {
    escreve,
    regra: 'a página pede o papel, nunca a cor; o tema cobre o CLI; todo par se lê em 4,5:1'
  })
  const marca = arquivosDaMarca(manifesto)
  const pisos = manifesto.pisos ?? {}
  let olhados = 0

  const caminhoTokens = join(raiz, marca.tokens)
  if (!existsSync(caminhoTokens)) {
    r.naoMedido(`não achei ${marca.tokens}: sem os tokens da marca não há contra o que medir`)
    return r.fechar()
  }
  const tokens = readFileSync(caminhoTokens, 'utf8')
  const dosTokens = new Set([marca.tokens, marca.tema])

  // 1 e 2 · hex e classe da paleta no código, em catraca
  let hexes = 0
  let paletas = 0
  for (const pasta of manifesto.codigo ?? ['src']) {
    for (const rel of andar(join(raiz, pasta), { extensoes: EXTENSOES }).map((x) => `${pasta}/${x}`)) {
      if (dosTokens.has(rel)) continue
      olhados += 1
      const linhas = linhasDe(semComentario(readFileSync(join(raiz, rel), 'utf8'), extname(rel)))
      linhas.forEach((linha, i) => {
        if (/--mac-/.test(linha)) return
        for (const m of linha.matchAll(HEX)) {
          hexes += 1
          r.nota(`${rel}:${i + 1}: ${m[0]} escrito à mão (a cor vem do papel: var(--primary), var(--acento)...)`)
        }
        if (rel === ACENTO || rel.includes('components/ui/')) return
        for (const m of linha.matchAll(PALETA)) {
          paletas += 1
          r.nota(`${rel}:${i + 1}: ${m[0]} é classe da paleta do Tailwind (use o papel, ou mova para ${ACENTO})`)
        }
      })
    }
  }
  r.catraca('hex fora dos tokens', hexes, pisos.hex)
  r.catraca('classe da paleta fora do acento.ts', paletas, pisos.paleta)

  // 3 · o tema cobre o CLI, com valor da marca, sem colisão de nome
  const caminhoTema = join(raiz, marca.tema)
  const caminhoGlobals = join(raiz, manifesto.globals ?? 'src/app/globals.css')
  if (!existsSync(caminhoTema)) {
    r.nota(`sem tema (${marca.tema}): o contraste desta página é medido na tela, pelo projeto`)
  } else {
    olhados += 1
    const tema = readFileSync(caminhoTema, 'utf8')
    const globals = existsSync(caminhoGlobals) ? readFileSync(caminhoGlobals, 'utf8') : ''
    if (globals) {
      const linhasGlobals = linhasDe(globals)
      const doCli = nomesDeclarados(globals)
      for (const [seletor, escopo] of [[':root', 'claro'], ['.dark', 'escuro']]) {
        const doTema = declaracoesDoSeletor(tema, seletor)
        for (const nome of declaracoesDoSeletor(globals, seletor).keys()) {
          if (doTema.has(nome)) continue
          const [de, ate] = faixaDoBloco(linhasGlobals, seletor)
          let i = -1
          for (let j = de; j <= ate && i === -1; j += 1) {
            if (linhasGlobals[j].includes(`${nome}:`) && isento(linhasGlobals, j, MARCA_DO_CLI).isento) i = j
          }
          if (i !== -1) { r.nota(`${nome} (${escopo}) fica na cor do CLI, com razão escrita no globals.css`); continue }
          r.achado(marca.tema, `o tema não redefine ${nome} no ${escopo}, e a cor do CLI chega à tela`, `declare ${nome} no ${seletor} do tema, ou escreve "${MARCA_DO_CLI}: <razão>" na linha dele no globals.css`)
        }
        for (const [nome, valor] of doTema) {
          if (!nome.startsWith('--acento') && !doCli.has(nome)) r.achado(marca.tema, `o tema declara ${nome}, que o CLI não conhece`, 'tire, ou confira o nome no globals.css')
          if (!VALOR_DO_TEMA.test(valor.trim())) r.achado(marca.tema, `${nome} (${escopo}) com valor fora da régua: ${valor}`, 'só canal da marca (rgb(var(--c-x))), --mac-*, --f-* ou --r-*')
        }
      }
      const outros = [['globals.css', doCli], [marca.tema, nomesDeclarados(tema)]]
      for (const extra of ['node_modules/tailwindcss/theme.css', 'node_modules/shadcn/dist/tailwind.css']) {
        if (existsSync(join(raiz, extra))) outros.push([extra, nomesDeclarados(readFileSync(join(raiz, extra), 'utf8'))])
      }
      for (const nome of nomesDeclarados(tokens)) {
        for (const [onde, nomes] of outros) {
          if (nomes.has(nome)) r.achado(marca.tokens, `${nome} está declarado em dois arquivos, ${marca.tokens} e ${onde}: o que carrega depois vence sem erro`, 'renomeie o token da marca; o papel é do tema')
        }
      }
    }

    // 4 · o contraste de cada par de texto
    for (const p of contrasteDoTema({ tokens, tema, cli: globals })) {
      if (p.naoMedido) r.naoMedido(`contraste no ${p.escopo}: ${p.texto} sobre ${p.fundo} tem cor que a conta não lê`)
      else if (!p.ok) r.achado(marca.tema, `contraste de ${String(p.razao).replace('.', ',')}:1 no ${p.escopo}, ${p.texto} sobre ${p.fundo}, abaixo de 4,5:1`, 'escureça o texto ou clareie o fundo, pelo canal da marca')
    }
  }

  // 5 · a marca do projeto contra a identidade dela, quando ela mora noutro arquivo
  if (marca.doProjeto) {
    const fonte = manifesto.marca?.identidade
    if (!fonte) {
      r.nota('a marca do projeto mora em src/styles/, sem identidade à parte para comparar (quando houver, preencha "marca.identidade" no fundacao.json)')
    } else if (!existsSync(join(raiz, fonte))) {
      r.naoMedido(`a identidade da marca (${fonte}) não existe`)
    } else {
      const daFonte = mapaDoArquivo(readFileSync(join(raiz, fonte), 'utf8')).raiz
      const doProjeto = mapaDoArquivo(tokens).raiz
      for (const [nome, valor] of daFonte) {
        if (!nome.startsWith('--c-')) continue
        if (doProjeto.get(nome) !== valor) r.achado(marca.tokens, `${nome} diverge da identidade do projeto: ${doProjeto.get(nome) ?? 'ausente'} aqui, ${valor} em ${fonte}`, 'copie o canal da identidade; a marca mora nela')
      }
    }
  }

  r.varreu(olhados)
  return r.fechar()
}

comoComando(import.meta.url, (raiz, contexto, opcoes) => conferir(raiz, contexto, opcoes))
