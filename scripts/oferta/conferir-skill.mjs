#!/usr/bin/env node
// O conferidor da skill /oferta: garante no portão que a skill continua no
// molde, que ela não carrega endereço fixo (a fonte mora no acervo de quem
// usa), que o acervo apontado está íntegro, e que o SKILL.md segue as réguas
// oficiais de autoria de skill (nome, descrição, corpo, caminhos, avaliações).
//
// Uso:
//   node scripts/oferta/conferir-skill.mjs [--skill <pasta da skill>] [--acervo <pasta>] [--sem-acervo]
//
// --sem-acervo: num computador sem o acervo, confere só a skill (o molde, os
// links, as réguas do SKILL.md, as avaliações) e diz na saída que o acervo não
// foi conferido. Sem a bandeira, acervo ausente reprova: não medir não é estar
// certo, e o "só a forma" tem que ser pedido, nunca um verde por omissão.
//
// Saída: 0 tudo confere, 1 algum desvio (cada um com o arquivo e o motivo),
// 2 bandeira desconhecida.

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { lerAcervo, acervoExiste, conferirAcervo, ACERVO_PADRAO, COMO_MONTAR } from './buscar.mjs'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

// Os três módulos de base do método: existem sempre e têm o molde longo.
export const BASE = ['oferta.md', 'aquisicao.md', 'monetizacao.md']

// O molde: os títulos, nesta ordem, de cada arquivo de metodo/.
const MOLDE_BASE = ['## Conteúdo', '## O mapa', '## As réguas', '## Na prática', '## Sinais de alerta', '## Perguntas para auditar ou montar']
const MOLDE = ['## Conteúdo', '## As réguas', '## Sinais de alerta', '## Perguntas para auditar ou montar']

// As réguas oficiais do SKILL.md.
const NOME = /^[a-z0-9-]{1,64}$/
const DESCRICAO_MAX = 1024
const CORPO_MAX = 500
const AVALIACOES_MIN = 3

// Endereço fixo: a skill é método; a fonte com endereço é a do acervo de quem usa.
const ENDERECO = /\bhttps?:\/\/[^\s)\]"'>`]+/g

function argumentos (argv) {
  const o = { skill: join(RAIZ, '.claude', 'skills', 'oferta'), acervo: ACERVO_PADRAO, semAcervo: false }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--skill') o.skill = argv[++i]
    else if (argv[i] === '--acervo') o.acervo = argv[++i]
    else if (argv[i] === '--sem-acervo') o.semAcervo = true
    else return { erro: `não conheço a bandeira ${argv[i]}` }
  }
  return o
}

function ler (caminho) {
  return readFileSync(caminho, 'utf8').replace(/\r\n/g, '\n')
}

export function conferirSkillMd (texto) {
  const desvios = []
  const m = texto.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!m) return ['o SKILL.md não abre com o frontmatter entre ---']
  const nome = (m[1].match(/^name:\s*(.*)$/m) || [])[1]?.trim() || ''
  const descricao = campoYaml(m[1], 'description')
  if (!NOME.test(nome)) desvios.push(`o name "${nome}" tem que ter só minúsculas, números e hífen, até 64 caracteres`)
  if (!descricao) desvios.push('a description está vazia')
  if (descricao.length > DESCRICAO_MAX) desvios.push(`a description tem ${descricao.length} caracteres; o teto é 1.024`)
  // A quebra do fim do arquivo não é uma linha.
  const linhas = m[2].replace(/\n$/, '').split('\n').length
  if (linhas >= CORPO_MAX) desvios.push(`o corpo tem ${linhas} linhas; tem que ficar abaixo de 500 linhas`)
  // Com letra de unidade (C:\dev) ou relativo (metodo\oferta.md); o escape de
  // markdown (nome\_do\_arquivo, 2026\.) não é caminho.
  for (const caminho of texto.match(/(?:[A-Za-z]:\\|[\w.-]+\\(?=[A-Za-z0-9]))[^\s`'")]*/g) || []) desvios.push(`caminho com barra invertida: ${caminho} (use barra normal)`)
  return desvios
}

// O valor de um campo do frontmatter, na linha (description: x) ou em bloco
// (description: >, |, >-, |2 com as linhas recuadas embaixo, parágrafos inclusive).
function campoYaml (frontmatter, campo) {
  const linhas = frontmatter.split('\n')
  const i = linhas.findIndex(l => l.startsWith(`${campo}:`))
  if (i < 0) return ''
  const valor = linhas[i].slice(campo.length + 1).trim()
  if (!/^[>|](?:[1-9]?[+-]?|[+-][1-9])$/.test(valor)) return valor
  const bloco = []
  for (const l of linhas.slice(i + 1)) {
    // A linha em branco separa parágrafos dentro do bloco; o bloco acaba no próximo campo.
    if (l.trim() && !/^\s/.test(l)) break
    if (l.trim()) bloco.push(l.trim())
  }
  return bloco.join(' ').trim()
}

export function conferirMolde (texto, molde) {
  const desvios = []
  if (!/^> O que resolve: \S/m.test(texto)) desvios.push('falta a linha "> O que resolve: ..." logo abaixo do título')
  const linhas = texto.split('\n')
  const posicoes = molde.map(t => ({ t, i: linhas.indexOf(t) }))
  for (const { t, i } of posicoes) if (i < 0) desvios.push(`falta o título "${t}"`)
  const achadas = posicoes.filter(p => p.i >= 0).map(p => p.i)
  if (achadas.some((i, k) => k > 0 && i < achadas[k - 1])) desvios.push(`os títulos estão fora da ordem do molde: ${molde.join(' · ')}`)
  // Título do molde sem nada embaixo é régua prometida e não escrita.
  for (const { t, i } of posicoes.filter(p => p.i >= 0)) {
    const proximo = linhas.findIndex((l, k) => k > i && /^## /.test(l))
    const corpo = linhas.slice(i + 1, proximo < 0 ? undefined : proximo).join('\n').trim()
    if (!corpo) desvios.push(`o título "${t}" está vazio`)
  }
  return desvios
}

export function conferirEnderecos (texto) {
  return [...texto.matchAll(ENDERECO)].map(m => `endereço fixo na skill: ${m[0]} (a fonte com endereço mora no acervo de quem usa)`)
}

function principal () {
  const o = argumentos(process.argv.slice(2))
  if (o.erro) { console.error(`✗ ${o.erro}`); return 2 }
  if (!o.semAcervo && !acervoExiste(o.acervo)) {
    console.error(`✗ não achei o acervo em ${o.acervo}: sem ele a skill não tem fonte para citar, e não medir não é estar certo.`)
    console.error(`  Para montar: ${COMO_MONTAR}.`)
    console.error('  Ou aponte outro lugar com --acervo <pasta> ou a variável OFERTA_ACERVO.')
    console.error('  Ou confira só a skill, dizendo isso: --sem-acervo')
    return 1
  }
  const desvios = []
  const falhou = (arquivo, motivo) => desvios.push(`${arquivo}: ${motivo}`)

  const skillMd = ler(join(o.skill, 'SKILL.md'))
  for (const d of conferirSkillMd(skillMd)) falhou('SKILL.md', d)

  // Todo link relativo do SKILL.md aponta para arquivo que existe (referência a um nível só).
  const ligados = new Set()
  for (const m of skillMd.matchAll(/\]\(([^)#\s]+\.(?:md|json))\)/g)) {
    if (/^https?:/.test(m[1])) continue
    ligados.add(m[1])
    if (!existsSync(join(o.skill, m[1]))) falhou('SKILL.md', `o link para ${m[1]} aponta para arquivo que não existe`)
  }

  const pasta = join(o.skill, 'metodo')
  const nomes = existsSync(pasta) ? readdirSync(pasta).filter(n => n.endsWith('.md')).sort() : []
  // Verde medindo zero é vermelho: método sem arquivo não aprova.
  if (!nomes.length) falhou('metodo/', 'nenhum arquivo do método nesta pasta')
  else for (const base of BASE) if (!nomes.includes(base)) falhou(`metodo/${base}`, `falta o módulo de base (os três são ${BASE.join(', ')})`)
  for (const nome of nomes) {
    const relativo = `metodo/${nome}`
    if (!ligados.has(relativo)) falhou(relativo, 'o SKILL.md não liga este arquivo (arquivo órfão não é lido)')
    for (const d of conferirMolde(ler(join(pasta, nome)), BASE.includes(nome) ? MOLDE_BASE : MOLDE)) falhou(relativo, d)
  }

  // Todo .md da skill, na raiz, no método ou em subpasta: nenhum endereço fixo.
  const todos = readdirSync(o.skill, { recursive: true })
    .map(n => String(n).replace(/\\/g, '/'))
    .filter(n => n.endsWith('.md') || n.endsWith('.json'))
    .sort()
  for (const nome of todos) for (const d of conferirEnderecos(ler(join(o.skill, nome)))) falhou(nome, d)

  const caminhoEvals = join(o.skill, 'evals', 'evals.json')
  if (!existsSync(caminhoEvals)) falhou('evals/evals.json', 'não existe; a régua oficial pede pelo menos 3 avaliações')
  else {
    let avaliacoes = []
    try { avaliacoes = JSON.parse(ler(caminhoEvals)).evals || [] } catch (e) { falhou('evals/evals.json', `JSON inválido: ${e.message}`) }
    const completas = avaliacoes.filter(a => a && a.prompt && a.expected_output)
    if (completas.length < AVALIACOES_MIN) falhou('evals/evals.json', `${completas.length} avaliação(ões) com prompt e expected_output; o mínimo é 3`)
  }

  // O acervo que a skill cita: lido, com trecho, e íntegro.
  let resumoAcervo = 'o acervo não foi conferido'
  if (!o.semAcervo) {
    const trechos = lerAcervo(o.acervo)
    if (!trechos.length) falhou(o.acervo, 'o acervo está vazio (nenhum .md ou .txt)')
    for (const r of conferirAcervo(trechos)) falhou(`acervo ${r.file}`, r.motivo)
    resumoAcervo = `acervo com ${trechos.length} trechos de ${new Set(trechos.map(t => t.source)).size} fontes`
  }

  for (const d of desvios) console.log(`✗ ${d}`)
  const resumo = `${nomes.length} arquivos do método, ${todos.length} arquivos varridos atrás de endereço fixo, ${resumoAcervo}`
  // Sem acervo, o verde diz o que não mediu: a skill passou, o acervo não foi visto.
  const ressalva = o.semAcervo ? ' (só a forma: sem o acervo)' : ''
  if (desvios.length) { console.log(`✗ ${desvios.length} desvio(s) · conferidos ${resumo}${ressalva}`); return 1 }
  console.log(`✓ a skill está no molde · conferidos ${resumo}${ressalva}`)
  return 0
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  process.exitCode = principal()
}
