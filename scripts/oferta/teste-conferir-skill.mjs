// Prova do conferidor da skill /oferta (scripts/oferta/conferir-skill.mjs).
// Monta uma skill de prova no molde, e um acervo de prova, e quebra uma regra
// por vez: cada desvio tem que reprovar dizendo o arquivo e o motivo.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { montarAcervo, BONS } from './provas/acervo.mjs'

const CONFERIR = join(dirname(fileURLToPath(import.meta.url)), 'conferir-skill.mjs')

const SKILL = `---
name: oferta
description: Audita oferta, aquisição e venda com a fonte do acervo. Use para auditoria, conselho, começo de algo novo ou relatório.
---

# /oferta

A oferta: [metodo/oferta.md](metodo/oferta.md). A aquisição: [metodo/aquisicao.md](metodo/aquisicao.md).
A monetização: [metodo/monetizacao.md](metodo/monetizacao.md). Os números: [metodo/numeros.md](metodo/numeros.md).
`

const modulo = titulo => `# ${titulo}

> O que resolve: ${titulo.toLowerCase()}.

## Conteúdo

- o mapa

## O mapa

- A equação de valor.

## As réguas

- régua

## Na prática

- prática

## Sinais de alerta

- sinal

## Perguntas para auditar ou montar

1. pergunta
`

const METODO = `# Números e a trava

> O que resolve: a trava.

## Conteúdo

- índice

## As réguas

- Fechamento acima de 40%: o preço está baixo.

## Sinais de alerta

- sinal

## Perguntas para auditar ou montar

1. pergunta
`

const OFERTA = modulo('Oferta')
const EVALS = JSON.stringify({ skill_name: 'oferta', evals: [1, 2, 3].map(id => ({ id, prompt: `p${id}`, expected_output: `e${id}` })) })

// O SKILL.md de prova com o corpo (o que vem depois do frontmatter) em n linhas.
const corpo = n => SKILL + 'linha\n'.repeat(n - SKILL.split('\n---\n')[1].replace(/\n$/, '').split('\n').length)

function montarSkill (troca = {}) {
  const raiz = mkdtempSync(join(tmpdir(), 'skill-'))
  const arquivos = {
    'SKILL.md': SKILL,
    'metodo/oferta.md': OFERTA,
    'metodo/aquisicao.md': modulo('Aquisição'),
    'metodo/monetizacao.md': modulo('Monetização'),
    'metodo/numeros.md': METODO,
    'evals/evals.json': EVALS,
    ...troca
  }
  for (const [caminho, texto] of Object.entries(arquivos)) {
    if (texto === null) continue
    mkdirSync(dirname(join(raiz, caminho)), { recursive: true })
    writeFileSync(join(raiz, caminho), texto)
  }
  return raiz
}

function conferir (troca, { semAcervo = false, extra = [], trechos = BONS } = {}) {
  const skill = montarSkill(troca)
  const acervo = montarAcervo(trechos)
  const { NODE_TEST_CONTEXT, ...env } = process.env
  const r = spawnSync(process.execPath, [CONFERIR, '--skill', skill, '--acervo', semAcervo ? join(tmpdir(), 'acervo-que-nao-existe-081') : acervo, ...extra], { encoding: 'utf8', env })
  rmSync(skill, { recursive: true, force: true })
  rmSync(acervo, { recursive: true, force: true })
  return { status: r.status, saida: r.stdout + r.stderr }
}

test('a skill no molde passa e diz quanto conferiu', () => {
  const { status, saida } = conferir()
  assert.equal(status, 0, saida)
  assert.match(saida, /4 arquivos do método/)
  assert.match(saida, /6 arquivos varridos/)
  assert.match(saida, /acervo com 3 trechos de 3 fontes/)
})

const REPROVA = [
  ['falta um título do molde', { 'metodo/oferta.md': OFERTA.replace('## Sinais de alerta', '## Sinais') }, /oferta\.md.*Sinais de alerta/],
  ['módulo de base sem o mapa', { 'metodo/aquisicao.md': modulo('Aquisição').replace('## O mapa', '## Mapa') }, /aquisicao\.md.*"## O mapa"/],
  ['módulo de base sem a prática', { 'metodo/monetizacao.md': modulo('Monetização').replace('## Na prática', '## Prática') }, /monetizacao\.md.*"## Na prática"/],
  ['título fora da ordem', { 'metodo/numeros.md': METODO.replace('## As réguas\n\n- Fechamento', '## Sinais de alerta\n\n- x\n\n## As réguas\n\n- Fechamento').replace(/## Sinais de alerta\n\n- sinal\n\n/, '') }, /numeros\.md.*ordem/],
  ['falta a linha do que resolve', { 'metodo/numeros.md': METODO.replace('> O que resolve: a trava.', '') }, /numeros\.md.*O que resolve/],
  ['título do molde vazio', { 'metodo/numeros.md': METODO.replace('- Fechamento acima de 40%: o preço está baixo.', '') }, /numeros\.md.*"## As réguas" está vazio/],
  ['skill sem arquivo do método', { 'metodo/oferta.md': null, 'metodo/aquisicao.md': null, 'metodo/monetizacao.md': null, 'metodo/numeros.md': null, 'SKILL.md': '---\nname: oferta\ndescription: x\n---\n\n# /oferta\n' }, /metodo.*nenhum arquivo/],
  ['falta um módulo de base', { 'metodo/monetizacao.md': null, 'SKILL.md': SKILL.replace(' [metodo/monetizacao.md](metodo/monetizacao.md)', ' x') }, /monetizacao\.md.*módulo de base/],
  ['endereço fixo num arquivo do método', { 'metodo/numeros.md': METODO.replace('o preço está baixo.', 'o preço está baixo ([fonte](https://exemplo.com/video?t=90)).') }, /numeros\.md.*endereço fixo.*exemplo\.com/],
  ['endereço fixo num arquivo da raiz', { 'exemplos.md': 'Ver http://exemplo.com/aula.' }, /exemplos\.md.*endereço fixo/],
  ['endereço fixo num .md de subpasta da skill', { 'referencias/notas.md': 'Ver [x](https://exemplo.com/x).' }, /referencias\/notas\.md.*endereço fixo/],
  ['endereço fixo nas avaliações', { 'evals/evals.json': EVALS.replace('"e1"', '"veja https://exemplo.com/x"') }, /evals\/evals\.json.*endereço fixo/],
  ['arquivo do método órfão', { 'metodo/retencao.md': METODO }, /retencao\.md.*SKILL\.md/],
  ['link do SKILL.md para arquivo que não existe', { 'SKILL.md': SKILL + '\nVer [metodo/venda.md](metodo/venda.md).\n' }, /venda\.md.*não existe/],
  ['menos de três avaliações', { 'evals/evals.json': JSON.stringify({ evals: [{ id: 1, prompt: 'p', expected_output: 'e' }] }) }, /evals\.json.*3/],
  ['nome fora da régua', { 'SKILL.md': SKILL.replace('name: oferta', 'name: Oferta_Skill') }, /name/],
  ['nome acima de 64 caracteres', { 'SKILL.md': SKILL.replace('name: oferta', 'name: ' + 'a'.repeat(65)) }, /SKILL\.md.*name/],
  ['descrição vazia', { 'SKILL.md': SKILL.replace(/description: .*/, 'description:') }, /SKILL\.md.*description está vazia/],
  ['descrição longa demais', { 'SKILL.md': SKILL.replace(/description: .*/, 'description: ' + 'a'.repeat(1025)) }, /1\.?024/],
  ['descrição em bloco acima de 1.024', { 'SKILL.md': SKILL.replace(/description: .*/, 'description: >\n  ' + 'a'.repeat(1025)) }, /1\.?024/],
  ['descrição em bloco com parágrafo acima de 1.024', { 'SKILL.md': SKILL.replace(/description: .*/, 'description: >\n  ' + 'a'.repeat(600) + '\n\n  ' + 'a'.repeat(600)) }, /1\.?024/],
  ['descrição em bloco com recuo declarado acima de 1.024', { 'SKILL.md': SKILL.replace(/description: .*/, 'description: |2\n  ' + 'a'.repeat(1025)) }, /1\.?024/],
  ['sem a linha description', { 'SKILL.md': SKILL.replace(/description: .*\n/, '') }, /SKILL\.md.*description está vazia/],
  ['corpo com 500 linhas', { 'SKILL.md': corpo(500) }, /500 linhas/],
  ['caminho com barra invertida', { 'SKILL.md': SKILL + '\nO acervo mora em `C:\\dev\\acervo-oferta`.\n' }, /barra invertida/],
  ['caminho relativo com barra invertida', { 'SKILL.md': SKILL + '\nVer `metodo\\oferta.md`.\n' }, /barra invertida/]
]

for (const [nome, troca, motivo] of REPROVA) {
  test(`reprova: ${nome}`, () => {
    const { status, saida } = conferir(troca)
    assert.equal(status, 1, `aprovou: ${saida}`)
    assert.match(saida, motivo)
  })
}

test('reprova: acervo com endereço que não é https', () => {
  const { status, saida } = conferir({}, { trechos: [...BONS, { ep: 'eee', titulo: 'Inseguro', inicio: 0, texto: 'x', url: 'http://exemplo.com/eee' }] })
  assert.equal(status, 1, saida)
  assert.match(saida, /acervo eee\/000000\.md.*não é https/)
})

test('reprova: acervo vazio', () => {
  const { status, saida } = conferir({}, { trechos: [] })
  assert.equal(status, 1, saida)
  assert.match(saida, /acervo está vazio/)
})

test('nome com 64 e descrição com 1.024 passam', () => {
  const { status, saida } = conferir({ 'SKILL.md': SKILL.replace('name: oferta', 'name: ' + 'a'.repeat(64)).replace(/description: .*/, 'description: ' + 'a'.repeat(1024)) })
  assert.equal(status, 0, saida)
})

test('escape de markdown não é caminho', () => {
  const { status, saida } = conferir({ 'SKILL.md': SKILL + '\nO nome\\_do\\_arquivo, e 2026\\.\n' })
  assert.equal(status, 0, saida)
})

test('corpo com 499 linhas passa', () => {
  const { status, saida } = conferir({ 'SKILL.md': corpo(499) })
  assert.equal(status, 0, saida)
})

test('a citação de exemplo, sem endereço, passa', () => {
  const { status, saida } = conferir({ 'exemplos.md': 'O que o acervo diz: o fechamento diz o preço (acervo: precos/000090.md).' })
  assert.equal(status, 0, saida)
})

test('sem acervo para conferir, reprova e diz como montar', () => {
  const { status, saida } = conferir({}, { semAcervo: true })
  assert.equal(status, 1)
  assert.match(saida, /não achei o acervo/)
  assert.match(saida, /Para montar/)
  assert.match(saida, /--sem-acervo/)
})

// --- sem o acervo, o "só a forma" tem que ser pedido e dito na saída

const SO_FORMA = { semAcervo: true, extra: ['--sem-acervo'] }

test('--sem-acervo: a skill no molde passa, e a saída diz que o acervo não foi conferido', () => {
  const { status, saida } = conferir({}, SO_FORMA)
  assert.equal(status, 0, saida)
  assert.match(saida, /só a forma/)
  assert.match(saida, /o acervo não foi conferido/)
  assert.match(saida, /4 arquivos do método/)
})

const REPROVA_SEM_ACERVO = [
  ['endereço fixo', { 'exemplos.md': 'Ver https://exemplo.com/aula?t=90.' }, /exemplos\.md.*endereço fixo/],
  ['título do molde vazio', { 'metodo/numeros.md': METODO.replace('- Fechamento acima de 40%: o preço está baixo.', '') }, /numeros\.md.*está vazio/],
  ['falta um título do molde', { 'metodo/oferta.md': OFERTA.replace('## Sinais de alerta', '## Sinais') }, /oferta\.md.*Sinais de alerta/],
  ['falta um módulo de base', { 'metodo/aquisicao.md': null, 'SKILL.md': SKILL.replace(' [metodo/aquisicao.md](metodo/aquisicao.md)', ' x') }, /aquisicao\.md.*módulo de base/],
  ['menos de três avaliações', { 'evals/evals.json': JSON.stringify({ evals: [] }) }, /evals\.json.*3/]
]

for (const [nome, troca, motivo] of REPROVA_SEM_ACERVO) {
  test(`--sem-acervo ainda reprova: ${nome}`, () => {
    const { status, saida } = conferir(troca, SO_FORMA)
    assert.equal(status, 1, `aprovou: ${saida}`)
    assert.match(saida, motivo)
    assert.match(saida, /só a forma/)
  })
}
