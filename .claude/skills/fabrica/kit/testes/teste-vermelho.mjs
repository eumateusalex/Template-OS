// node --test .claude/skills/fabrica/kit/testes/teste-vermelho.mjs
//
// Classe de defeito: recibo de vermelho que ninguém viu: linhas `vermelho:` do
// provas.md "apontando para vermelho que não foi visto", e uma seção inteira
// escrita à mão só para satisfazer o conferidor. Recibo copiado pelo modelo se
// inventa.
//
// 🚨 Os relatórios em `relatorios/` são SAÍDAS REAIS dos três runners (node 24
// com --test-reporter=junit, vitest 4.1 com
// --reporter=json, pytest 9 com --junit-xml), só com o caminho da máquina
// trocado por C:/projeto. Nenhum foi escrito à mão: relatório inventado mede o
// que eu acho que o runner escreve, não o que ele escreve.
// mutação: kit/vermelho.mjs · "if (lido.falharam === 0) {" → "if (false) {" · pega
// mutação: kit/vermelho.mjs · "if (casos.length === 0 && suite.status === 'failed') {" → "if (false) {" · pega
// mutação: kit/vermelho.mjs · "    if (!molde.includes('{relatorio}')) return" → "    if (false) return" · pega
// mutação: kit/vermelho.mjs · "  for (const { re } of FORMATOS) f = f.replace(new RegExp(re.source, 'g'), '‹segredo removido›')" → "" · pega
// mutação: kit/vermelho.mjs · "    if (segredo) {" → "    if (false) {" · pega
// mutação: kit/portao/segredos.mjs · "  return formatoDa(linha) ?? valorDa(linha, false)" → "  return formatoDa(linha)" · pega
// mutação: kit/vermelho.mjs · "    .replace(/&(quot|apos);/g, (e) => ENTIDADES[e])" → "    .replace(/&(quotx|aposx);/g, (e) => ENTIDADES[e])" · pega
// mutação: kit/vermelho.mjs · "    const f = /<(failure|error)\b((?:[^>"]|"[^"]*")*?)(?:\/>|>([\s\S]*?)<\/\1>)/.exec(caso)" → "    const f = /<(failure|error)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/.exec(caso)" · pega
// mutação: kit/vermelho.mjs · "(erroDaSaida(saida) || mensagem || 'falhou sem mensagem')" → "(erroDaSaida(saida) ?? mensagem ?? 'falhou sem mensagem')" · pega
// mutação: kit/vermelho.mjs · "    .replace(/&(quot|apos);/g, (e) => ENTIDADES[e])" → "    .replace(/&(lt|gt|quot|apos|amp);/g, (e) => ENTIDADES[e])" · pega

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

import { criar, apagar } from '../lib/temporaria.mjs'
import { rodar } from '../lib/runner.mjs'
import {
  lerRelatorio, linhaDoRecibo, gravarNoRecibo, vermelho, segredoNaLinha, RECIBO_DE_VERMELHO, DESFECHO
} from '../vermelho.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const QUANDO = new Date('2026-09-22T15:00:00Z')
const rel = (nome) => readFileSync(join(AQUI, 'relatorios', nome), 'utf8')

test('junit do node: conta os testes e acha a primeira falha', () => {
  const r = lerRelatorio(rel('node-falha.xml'))
  assert.equal(r.formato, 'junit')
  assert.equal(r.rodaram, 2)
  assert.equal(r.falharam, 1)
  assert.equal(r.primeiraFalha, 'Expected values to be strictly equal: 5 !== 6')
})

test('junit do node com o módulo ausente: o "test failed" genérico cai na saída do runner', () => {
  // O junit do node não carrega o erro de carga do arquivo: ele diz só "test
  // failed", e o erro de verdade sai na saída do processo.
  const saida = [
    'node:internal/modules/esm/resolve:271',
    '    throw new ERR_MODULE_NOT_FOUND(',
    '          ^',
    '',
    "Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'C:\\projeto\\src\\total.mjs' imported from C:\\projeto\\testes\\b.test.mjs",
    '    at finalizeResolution (node:internal/modules/esm/resolve:271:11)'
  ].join('\n')
  const r = lerRelatorio(rel('node-sem-modulo.xml'), { saida })
  assert.equal(r.rodaram, 1)
  assert.equal(r.falharam, 1)
  assert.match(r.primeiraFalha, /^Error \[ERR_MODULE_NOT_FOUND\]: Cannot find module/)
})

test('junit do node com aspas: o escape duplo do node se desfaz, e o & e o < continuam certos', () => {
  // Com o node 24, o reporter junit escapa a aspa DUAS vezes (`&amp;quot;`) e
  // o resto uma vez só: sem desfazer, o recibo sai com `&quot;` no meio da
  // mensagem.
  const r = lerRelatorio(rel('node-aspas.xml'))
  assert.equal(r.primeiraFalha, 'veio "x" & <y>')
})

test('um &lt; que a mensagem trazia de verdade continua &lt;: só a aspa se desfaz duas vezes', () => {
  // Trocar a segunda passada por uma que desfaz tudo deixaria o resto da suíte
  // verde: é este caso que a pega.
  const r = lerRelatorio('<testsuites><testcase name="a"><failure message="veio &amp;lt;b&amp;gt; e &amp;quot;c&amp;quot;"></failure></testcase></testsuites>')
  assert.equal(r.primeiraFalha, 'veio &lt;b&gt; e "c"')
})

test('falha com mensagem VAZIA não vira recibo em branco', () => {
  // O `??` só troca null: uma mensagem "" passaria, e a linha do recibo sairia
  // com "vermelho:" e nada depois. XML mínimo escrito aqui de propósito: o que
  // se mede é o texto de reserva, não o formato de um runner.
  const r = lerRelatorio('<testsuites><testcase name="a"><failure message=""></failure></testcase></testsuites>')
  assert.equal(r.falharam, 1)
  assert.equal(r.primeiraFalha, 'falhou sem mensagem')
})

test('junit do node verde: zero falha', () => {
  const r = lerRelatorio(rel('node-verde.xml'))
  assert.equal(r.rodaram, 1)
  assert.equal(r.falharam, 0)
  assert.equal(r.primeiraFalha, null)
})

test('json do vitest: a primeira asserção que falhou', () => {
  const r = lerRelatorio(rel('vitest-falha.json'))
  assert.equal(r.formato, 'vitest')
  assert.equal(r.rodaram, 2)
  assert.equal(r.falharam, 1)
  assert.equal(r.primeiraFalha, 'AssertionError: expected 5 to be 6 // Object.is equality')
})

test('json do vitest com o módulo ausente: a suíte que não carregou CONTA como falha', () => {
  // ⚠️ O vitest diz numTotalTests: 0 quando o arquivo nem carrega. Ler só esse
  // número faria o vermelho mais honesto do começo virar "o runner não mediu".
  const r = lerRelatorio(rel('vitest-sem-modulo.json'))
  assert.equal(r.rodaram, 1)
  assert.equal(r.falharam, 1)
  assert.match(r.primeiraFalha, /^Cannot find module '\.\/nao-existe\.mjs'/)
})

test('json do vitest sem arquivo de teste nenhum: zero rodou, e zero não é vermelho', () => {
  const r = lerRelatorio(rel('vitest-vazio.json'))
  assert.equal(r.rodaram, 0)
})

test('junit do pytest: a falha e o erro de coleta', () => {
  const f = lerRelatorio(rel('pytest-falha.xml'))
  assert.equal(f.rodaram, 2)
  assert.equal(f.falharam, 1)
  assert.equal(f.primeiraFalha, 'assert 5 == 6')

  const s = lerRelatorio(rel('pytest-sem-modulo.xml'))
  assert.equal(s.falharam, 1)
  assert.equal(s.primeiraFalha, "ModuleNotFoundError: No module named 'nao_existe'")

  assert.equal(lerRelatorio(rel('pytest-verde.xml')).falharam, 0)
})

test('relatório que não é de runner nenhum: formato desconhecido, nunca zero', () => {
  const r = lerRelatorio('isto não é relatório')
  assert.equal(r.formato, null)
})

test('a linha do recibo: formato fixo, sem o separador dentro da falha', () => {
  const linha = linhaDoRecibo({
    tarefa: 'T012',
    teste: 'testes/preco.test.mjs',
    falha: 'esperava 6 · veio 0',
    quando: new Date('2026-09-22T15:00:00Z'),
    impressao: 'abcdef0123456789'
  })
  assert.equal(linha, '- T012 · vermelho: esperava 6 - veio 0 · testes/preco.test.mjs · vermelho.mjs 22/09/2026 abcdef01')
  assert.match(linha, RECIBO_DE_VERMELHO)
})

test('a pasta temporária da máquina não entra no recibo', () => {
  const falha = `ENOENT: open '${join(tmpdir(), 'fabrica-x-123', 'a.mjs')}'`
  const linha = linhaDoRecibo({ tarefa: 'T1', teste: 't.mjs', falha, quando: QUANDO, impressao: '00000000' })
  assert.ok(!linha.includes(tmpdir()), linha)
  assert.match(linha, /open 'fabrica-x-123[\\/]a\.mjs'/)
})

test('a data do recibo é a de Brasília, não a de Greenwich', () => {
  const linha = linhaDoRecibo({ tarefa: 'T1', teste: 't.mjs', falha: 'x', quando: new Date('2026-09-23T01:30:00Z'), impressao: '00000000' })
  assert.match(linha, /22\/09\/2026/, '22h30 em Brasília ainda é dia 22')
})

test('gravar no recibo: entra antes da seção de achados', () => {
  const antes = [
    '# Provas · x', '',
    '- T001 · vermelho: velho · testes/a.mjs · vermelho.mjs 20/09/2026 11111111',
    '',
    '## O que esta feature achou, e que não estava previsto', '',
    'nada fora do previsto', ''
  ].join('\n')
  const nova = '- T002 · vermelho: novo · testes/b.mjs · vermelho.mjs 22/09/2026 22222222'
  const depois = gravarNoRecibo(antes, nova)
  const linhas = depois.split('\n')
  assert.ok(linhas.indexOf(nova) < linhas.findIndex((l) => l.startsWith('## O que esta feature achou')))

})

// ───────────────────────────── ponta a ponta, com um node --test de verdade

function projeto () {
  const raiz = criar('fabrica-vermelho-')
  mkdirSync(join(raiz, 'fabrica'), { recursive: true })
  mkdirSync(join(raiz, 'specs', '001-x'), { recursive: true })
  mkdirSync(join(raiz, 'testes'), { recursive: true })
  writeFileSync(join(raiz, 'fabrica', 'stack.mjs'), [
    "export const STACK = 'node'",
    'export const COMANDOS = {',
    "  testarUm: 'node --test --test-reporter=spec --test-reporter-destination=stdout --test-reporter=junit --test-reporter-destination={relatorio} {teste}'",
    '}',
    ''
  ].join('\n'))
  writeFileSync(join(raiz, 'specs', '001-x', 'provas.md'), '# Provas · x\n')
  return raiz
}

test('ponta a ponta: teste vermelho sem o código GRAVA a linha e sai 0', async () => {
  const raiz = projeto()
  try {
    writeFileSync(join(raiz, 'testes', 'total.test.mjs'), [
      "import { test } from 'node:test'",
      "import assert from 'node:assert/strict'",
      "import { total } from '../src/total.mjs'",
      "test('soma', () => { assert.equal(total([1, 2]), 3) })",
      ''
    ].join('\n'))
    const r = await vermelho({ raiz, tarefa: 'T002', teste: 'testes/total.test.mjs', feature: 'specs/001-x', quando: QUANDO })
    assert.equal(r.codigo, DESFECHO.VISTO, r.mensagem)
    const recibo = readFileSync(join(raiz, 'specs', '001-x', 'provas.md'), 'utf8')
    const linha = recibo.split('\n').find((l) => l.startsWith('- T002 '))
    assert.ok(linha, `não gravou: ${recibo}`)
    assert.match(linha, RECIBO_DE_VERMELHO)
    assert.match(linha, /Cannot find module/)
    assert.doesNotMatch(linha, /fabrica-vermelho-/, 'o caminho da máquina não entra no recibo')
    assert.match(linha, /Cannot find module 'src[\\/]total\.mjs'/, 'o caminho fica relativo à raiz, sem a barra da frente')
  } finally { apagar(raiz) }
})

test('ponta a ponta: teste que PASSA sem o código sai 1 e não grava nada', async () => {
  const raiz = projeto()
  try {
    writeFileSync(join(raiz, 'testes', 'oco.test.mjs'), "import { test } from 'node:test'\ntest('oco', () => {})\n")
    const r = await vermelho({ raiz, tarefa: 'T002', teste: 'testes/oco.test.mjs', feature: 'specs/001-x', quando: QUANDO })
    assert.equal(r.codigo, DESFECHO.NAO_MEDE)
    assert.match(r.mensagem, /não mede/)
    assert.doesNotMatch(readFileSync(join(raiz, 'specs', '001-x', 'provas.md'), 'utf8'), /T002/)
  } finally { apagar(raiz) }
})

test('ponta a ponta: teste que não existe é uso errado, e runner sem relatório é NÃO MEDIU', async () => {
  const raiz = projeto()
  try {
    const sumiu = await vermelho({ raiz, tarefa: 'T002', teste: 'testes/nao-existe.test.mjs', feature: 'specs/001-x', quando: QUANDO })
    assert.equal(sumiu.codigo, DESFECHO.USO)

    writeFileSync(join(raiz, 'testes', 'x.test.mjs'), 'qualquer coisa\n')
    writeFileSync(join(raiz, 'fabrica', 'stack.mjs'), "export const COMANDOS = { testarUm: 'node -e \"process.exit(1)\" {teste} {relatorio}' }\n")
    const semRelatorio = await vermelho({ raiz, tarefa: 'T002', teste: 'testes/x.test.mjs', feature: 'specs/001-x', quando: QUANDO })
    assert.equal(semRelatorio.codigo, DESFECHO.NAO_MEDIU, 'runner que caiu sem relatório não prova vermelho nenhum')
  } finally { apagar(raiz) }
})

test('--comando troca o runner: a matriz de um conferidor também grava o vermelho', async () => {
  // ⚠️ A prova de um conferidor não é um `node --test`: é a matriz, que escreve
  // junit com --relatorio. O {teste} é opcional aqui.
  const raiz = projeto()
  try {
    writeFileSync(join(raiz, 'testes', 'prova.mjs'), '// a prova plantada\n')
    writeFileSync(join(raiz, 'matriz.mjs'), [
      "import { writeFileSync } from 'node:fs'",
      "writeFileSync(process.argv[2], '<testsuites><testcase name=\"kit · node · versão velha\"><failure message=\"esperava vermelho, deu verde\"/></testcase></testsuites>')",
      'process.exit(1)',
      ''
    ].join('\n'))
    const r = await vermelho({ raiz, tarefa: 'T051', teste: 'testes/prova.mjs', feature: 'specs/001-x', quando: QUANDO, comando: 'node matriz.mjs {relatorio}' })
    assert.equal(r.codigo, DESFECHO.VISTO, r.mensagem)
    assert.match(r.linha, /T051 · vermelho: esperava vermelho, deu verde · testes\/prova\.mjs · vermelho\.mjs/)
  } finally { apagar(raiz) }
})

test('--comando sem {relatorio} é uso errado: sem relatório não há vermelho de máquina', async () => {
  const raiz = projeto()
  try {
    writeFileSync(join(raiz, 'testes', 'prova.mjs'), 'x\n')
    const r = await vermelho({ raiz, tarefa: 'T051', teste: 'testes/prova.mjs', feature: 'specs/001-x', quando: QUANDO, comando: 'node matriz.mjs' })
    assert.equal(r.codigo, DESFECHO.USO)
    assert.match(r.mensagem, /\{relatorio\}/)
  } finally { apagar(raiz) }
})

test('sem COMANDOS.testarUm no stack.mjs, ele diz o que falta e sai de uso errado', async () => {
  const raiz = projeto()
  try {
    writeFileSync(join(raiz, 'fabrica', 'stack.mjs'), "export const COMANDOS = { testar: 'x' }\n")
    writeFileSync(join(raiz, 'testes', 'x.test.mjs'), 'x\n')
    const r = await vermelho({ raiz, tarefa: 'T002', teste: 'testes/x.test.mjs', feature: 'specs/001-x', quando: QUANDO })
    assert.equal(r.codigo, DESFECHO.USO)
    assert.match(r.mensagem, /testarUm/)
  } finally { apagar(raiz) }
})

test('a linha de comando: sem --tarefa sai de uso errado, dizendo como se chama', () => {
  const cli = join(AQUI, '..', 'vermelho.mjs').split('\\').join('/')
  const r = rodar(`node "${cli}" --teste x.mjs`, { tempoMaximo: 30000 })
  assert.equal(r.saiu, DESFECHO.USO)
  assert.match(r.saida, /uso:/)
  assert.ok(existsSync(cli))
})

// ───────────────────────────── o recibo que não se apaga e o segredo que não entra

test('rodar de novo com OUTRO vermelho da mesma tarefa não apaga o primeiro', () => {
  // Se a mesma tarefa e o mesmo teste substituíssem a linha, o vermelho
  // verdadeiro sumiria debaixo do seguinte.
  const primeira = '- T021 · vermelho: Cannot find module · t.mjs · vermelho.mjs 22/09/2026 11111111'
  const segunda = '- T021 · vermelho: expected 1 · t.mjs · vermelho.mjs 22/09/2026 22222222'
  const depois = gravarNoRecibo(`# Provas\n\n${primeira}\n`, segunda)
  assert.ok(depois.includes(primeira), 'o primeiro vermelho sumiu')
  assert.ok(depois.includes(segunda))
  const igual = gravarNoRecibo(depois, segunda)
  assert.equal(igual.split('\n').filter((l) => l === segunda).length, 1, 'a mesma linha não duplica')
})

test('um segredo na mensagem da falha não entra no recibo', () => {
  // O provas.md é versionado, e uma asserção que
  // compara configuração pode trazer o valor de um token na mensagem.
  const chave = ['sk-', 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6'].join('')
  const linha = linhaDoRecibo({ tarefa: 'T1', teste: 't.mjs', falha: `expected '${chave}' to equal ''`, quando: QUANDO, impressao: '00000000' })
  assert.ok(!linha.includes(chave), linha)
  assert.match(linha, /segredo removido/)
})

// ───────────────────────────── as formas que a limpeza não tira

// Os valores se montam por partes: escritos inteiros, o próprio conferidor
// `segredos` acusaria este arquivo, e com razão.
const CHAVE_SK = ['sk-', 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6'].join('')
const SENHA = ['Zq9x', 'W2vB7nM4kL1p'].join('')
const NOME_DA_SENHA = ['pass', 'word'].join('')

test('as formas que a limpeza não tira são ACUSADAS pelo detector inteiro do segredos', () => {
  // `\n` e `%20` colados na frente
  // escondem o limite de palavra, e `nome: 'valor'` não tem formato.
  const formas = [
    `expected '\\n${CHAVE_SK}' to equal ''`,
    `expected "%20${CHAVE_SK}" to equal ''`,
    `expected { ${NOME_DA_SENHA}: '${SENHA}' } to equal {}`
  ]
  for (const falha of formas) {
    const linha = linhaDoRecibo({ tarefa: 'T1', teste: 't.mjs', falha, quando: QUANDO, impressao: '00000000' })
    assert.ok(segredoNaLinha(linha), `passou calado: ${linha}`)
  }
})

test('a linha limpa pelos formatos não é acusada: a limpeza continua sendo o caminho comum', () => {
  const linha = linhaDoRecibo({ tarefa: 'T1', teste: 't.mjs', falha: `expected '${CHAVE_SK}' to equal ''`, quando: QUANDO, impressao: '00000000' })
  assert.equal(segredoNaLinha(linha), null, linha)
})

test('ponta a ponta: falha com segredo que a limpeza não tira é NÃO MEDIU, e o recibo não é gravado', async () => {
  const raiz = projeto()
  try {
    writeFileSync(join(raiz, 'testes', 'config.test.mjs'), [
      "import { test } from 'node:test'",
      "import assert from 'node:assert/strict'",
      `test('config', () => { assert.fail(${JSON.stringify(`{ ${NOME_DA_SENHA}: '${SENHA}' }`)}) })`,
      ''
    ].join('\n'))
    const r = await vermelho({ raiz, tarefa: 'T002', teste: 'testes/config.test.mjs', feature: 'specs/001-x', quando: QUANDO })
    assert.equal(r.codigo, DESFECHO.NAO_MEDIU, r.mensagem)
    assert.match(r.mensagem, /segredo/)
    assert.doesNotMatch(r.mensagem, new RegExp(SENHA), 'a mensagem também não repete o valor')
    assert.doesNotMatch(readFileSync(join(raiz, 'specs', '001-x', 'provas.md'), 'utf8'), /T002/)
  } finally { apagar(raiz) }
})
