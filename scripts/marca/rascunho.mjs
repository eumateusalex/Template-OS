#!/usr/bin/env node
// O rascunho da marca: `node scripts/marca/rascunho.mjs --saida <rascunho.tokens.json> [--principal <hex>] [--claro <hex>] [--acento <hex>] [--apoio|--lavado|--raro|--abismo|--ok <hex>] [--de <tokens>] [--raiz <pasta>]`.
//
// Monta os tokens que a proposta lê, sem tocar em `identidade/`. A base é o
// `--de`, senão a marca do workspace, senão o molde. As cores dadas entram; as
// cinco derivadas (apoio, lavado, raro, abismo, ok) saem da conta abaixo, e se
// refazem quando a principal ou o claro mudam (na troca só do acento, ficam).
// A derivada dada vence a conta. A letra, a forma, o movimento, a imagem e o
// som ficam como na base, para a pessoa responder no rascunho.
//
// Prova: scripts/marca/teste-rascunho.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { lerMarca, lerMolde, raizPadrao } from './marca.mjs'
import { rgbDe, hexDe, rumo, ajustar, BRANCO, PRETO, MINIMO, PAPEIS } from './derivar.mjs'

const DERIVADAS = ['apoio', 'lavado', 'raro', 'abismo', 'ok']
const NEUTRO = { r: 90, g: 90, b: 90, a: 1 }
// O abismo é a mais fechada: o claro se lê nele com folga (7:1), no fecho e no terminal.
const FOLGA_DO_ABISMO = 7
const DEMONSTRACAO = /\s*Demonstração: troque na entrevista do \/marca\./

/**
 * As cinco derivadas a partir da principal e do claro, pela conta da entrevista:
 * o apoio é a principal clareada; o lavado, a principal a 10% sobre o claro; o
 * raro, um neutro médio com um traço da principal; o abismo, a principal
 * escurecida até o claro se ler nele com folga; o ok, a principal clareada até
 * se ler sobre o abismo.
 */
export function derivadas (principal, claro) {
  const p = rgbDe(principal)
  const c = rgbDe(claro)
  const abismo = ajustar(rumo(p, PRETO, 0.75), PRETO, [c], FOLGA_DO_ABISMO) ?? PRETO
  return {
    apoio: hexDe(rumo(p, BRANCO, 0.35)),
    lavado: hexDe(rumo(c, p, 0.1)),
    raro: hexDe(rumo(NEUTRO, p, 0.1)),
    abismo: hexDe(abismo),
    ok: hexDe(ajustar(rumo(p, BRANCO, 0.3), BRANCO, [abismo], MINIMO) ?? BRANCO)
  }
}

const corDtcg = (hex) => ({ colorSpace: 'srgb', components: [1, 3, 5].map((i) => Math.round((parseInt(hex.slice(i, i + 2), 16) / 255) * 10000) / 10000), hex })
const aliasDe = (v) => (typeof v === 'string' ? /^\{cor\.primitiva\.([^}]+)\}$/.exec(v)?.[1] : undefined)

/** Quantas vezes cada primitiva é apontada em todo o arquivo. */
function apontadas (tokens) {
  const conta = {}
  for (const m of JSON.stringify(tokens).matchAll(/\{cor\.primitiva\.([^}]+)\}/g)) conta[m[1]] = (conta[m[1]] ?? 0) + 1
  return conta
}

/** O valor de um papel em hex, resolvendo o alias da primitiva. */
function hexDoPapel (tokens, nome) {
  const v = tokens.cor.papel[nome]?.$value
  const alvo = aliasDe(v)
  const cru = alvo ? tokens.cor.primitiva[alvo]?.$value : v
  return typeof cru === 'string' ? cru.toLowerCase() : cru?.hex?.toLowerCase()
}

/**
 * O rascunho a partir de `base` (tokens) com as `cores` dadas (papel → hex).
 * Devolve `{ tokens, erros }`; com erro, `tokens` vem `null`.
 */
export function rascunho ({ base, cores }) {
  const erros = []
  const dadas = {}
  for (const [nome, v] of Object.entries(cores)) {
    if (v === undefined) continue
    if (!PAPEIS.includes(nome)) erros.push(`"${nome}" não é papel de cor (os papéis: ${PAPEIS.join(', ')})`)
    else if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(v).trim())) erros.push(`a cor ${nome} ("${v}") não é um hex: escreva como #1e3a8a`) // tecnico: exemplo de formato
    else dadas[nome] = hexDe(rgbDe(String(v).trim()))
  }
  if (erros.length) return { tokens: null, erros }

  const t = structuredClone(base)
  const doMolde = t.$extensions?.['template.estado'] === 'nao-configurado'
  if (t.$extensions) {
    delete t.$extensions['template.estado']
    if (!Object.keys(t.$extensions).length) delete t.$extensions
  }

  const final = Object.fromEntries(PAPEIS.map((nome) => [nome, hexDoPapel(t, nome)]))
  Object.assign(final, dadas)
  if (doMolde || dadas.principal || dadas.claro) {
    const conta = derivadas(final.principal, final.claro)
    for (const nome of DERIVADAS) if (!dadas[nome]) final[nome] = conta[nome]
  }

  if (doMolde) {
    // o molde troca as primitivas de demonstração pelas da marca, com o nome do papel
    const descricao = t.cor.primitiva.$description?.replace(DEMONSTRACAO, '')
    t.cor.primitiva = { ...(descricao ? { $description: descricao } : {}), ...Object.fromEntries(PAPEIS.map((nome) => [nome, { $value: corDtcg(final[nome]) }])) }
    for (const nome of PAPEIS) {
      t.cor.papel[nome].$value = `{cor.primitiva.${nome}}`
      if (t.cor.papel[nome].$description) t.cor.papel[nome].$description = t.cor.papel[nome].$description.replace(DEMONSTRACAO, '')
    }
  } else {
    // a marca guarda o nome das primitivas: o papel que aponta sozinho para uma escreve nela
    const conta = apontadas(t)
    for (const nome of PAPEIS) {
      if (final[nome] === hexDoPapel(t, nome)) continue
      const alvo = aliasDe(t.cor.papel[nome].$value)
      if (alvo && conta[alvo] === 1 && t.cor.primitiva[alvo]) t.cor.primitiva[alvo].$value = corDtcg(final[nome])
      else t.cor.papel[nome].$value = final[nome]
    }
  }
  return { tokens: t, erros: [] }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const arg = (nome) => { const i = process.argv.indexOf(nome); return i > -1 ? process.argv[i + 1] : undefined }
  const saida = arg('--saida')
  if (!saida || process.argv.includes('--help')) {
    console.log('uso: node scripts/marca/rascunho.mjs --saida <rascunho.tokens.json> [--principal <hex>] [--claro <hex>] [--acento <hex>] [--apoio|--lavado|--raro|--abismo|--ok <hex>] [--de <tokens>] [--raiz <pasta>]')
    process.exit(process.argv.includes('--help') ? 0 : 2)
  }
  const raiz = arg('--raiz') ? resolve(arg('--raiz')) : raizPadrao()
  let base
  if (arg('--de')) base = JSON.parse(readFileSync(resolve(arg('--de')), 'utf8'))
  else {
    const hoje = lerMarca({ raiz })
    base = hoje.configurada ? hoje.tokens : lerMolde({ raiz }).tokens
  }
  const { tokens, erros } = rascunho({ base, cores: Object.fromEntries(PAPEIS.map((nome) => [nome, arg(`--${nome}`)])) })
  if (erros.length) {
    for (const e of erros) console.log(`✗ ${e}`)
    process.exit(1)
  }
  writeFileSync(resolve(saida), JSON.stringify(tokens, null, 2) + '\n')
  console.log(`rascunho gravado em ${resolve(saida)}`)
  console.log(`a letra, a forma, o movimento, a imagem e o som estão como na base: edite-os no rascunho`)
  console.log(`antes de gravar: node scripts/marca/proposta.mjs --arquivo ${saida}`)
}
