// node --test .claude/skills/fabrica/kit/testes/teste-runner.mjs
//
// Classe de defeito: ler código de saída como se fosse prova. "Código de saída
// não é prova": o instala-cron imprime "instalado" por cima do erro, e processo
// morto por tempo sai não-zero igual a falha legítima. O pytest fecha o caso:
// sai 5 quando não rodou teste nenhum, e 5 não é "passou".
//
// mutação: kit/lib/runner.mjs · "rodaram: 0, falharam: 0, conhecido: false" → "rodaram: 1, falharam: 0, conhecido: true" · pega
// mutação: kit/lib/runner.mjs · "if (passou + falhou === 0) continue" → "if (passou + falhou === -1) continue" · pega
// mutação: kit/lib/runner.mjs · "for (let i = linhas.length - 1; i >= 0; i -= 1) {" → "for (let i = 0; i < linhas.length; i += 1) {" · pega
// mutação: kit/lib/runner.mjs · "const estourouBuffer = r.error?.code === 'ENOBUFS'" → "const estourouBuffer = false" · pega

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { rodar, lerTestes, limparAmbiente } from '../lib/runner.mjs'

test('rodar devolve o código de saída e a saída', () => {
  const r = rodar('node -e "console.log(\'oi\'); process.exit(0)"', { cwd: process.cwd() })
  assert.equal(r.saiu, 0)
  assert.equal(r.mortoPorTempo, false)
  assert.match(r.saida, /oi/)
})

test('rodar marca mortoPorTempo quando estoura o prazo, e NÃO confunde com reprovação', () => {
  const r = rodar('node -e "setTimeout(()=>{}, 5000)"', { cwd: process.cwd(), tempoMaximo: 400 })
  assert.equal(r.mortoPorTempo, true, 'tinha que saber que matou o processo')
  assert.notEqual(r.saiu, 0)
})

test('rodar não estoura quando o comando não existe: devolve vermelho com a razão', () => {
  const r = rodar('este-comando-nao-existe-mesmo --x', { cwd: process.cwd() })
  assert.notEqual(r.saiu, 0)
  assert.equal(r.mortoPorTempo, false)
})

test('lerTestes entende o TAP do node:test', () => {
  const t = lerTestes('# tests 9\n# suites 0\n# pass 9\n# fail 0\n')
  assert.equal(t.conhecido, true)
  assert.equal(t.rodaram, 9)
  assert.equal(t.falharam, 0)
})

test('lerTestes entende falha no TAP', () => {
  const t = lerTestes('# tests 9\n# pass 7\n# fail 2\n')
  assert.equal(t.rodaram, 9)
  assert.equal(t.falharam, 2)
})

test('lerTestes entende o vitest', () => {
  const t = lerTestes('\n Test Files  3 passed (3)\n      Tests  41 passed (41)\n')
  assert.equal(t.conhecido, true)
  assert.equal(t.rodaram, 41)
  assert.equal(t.falharam, 0)
})

test('lerTestes entende o vitest com falha', () => {
  const t = lerTestes('      Tests  2 failed | 39 passed (41)\n')
  assert.equal(t.rodaram, 41)
  assert.equal(t.falharam, 2)
})

test('lerTestes entende o pytest', () => {
  const t = lerTestes('===== 12 passed in 0.31s =====\n')
  assert.equal(t.conhecido, true)
  assert.equal(t.rodaram, 12)
  assert.equal(t.falharam, 0)
})

test('lerTestes entende o pytest com falha', () => {
  const t = lerTestes('===== 2 failed, 10 passed in 0.44s =====\n')
  assert.equal(t.rodaram, 12)
  assert.equal(t.falharam, 2)
})

test('pytest "no tests ran" é ZERO, e zero não é sucesso', () => {
  const t = lerTestes('===== no tests ran in 0.01s =====\n')
  assert.equal(t.conhecido, true)
  assert.equal(t.rodaram, 0, 'zero teste rodado tem que ser zero, nunca desconhecido')
})

test('saída que o runner não conhece devolve conhecido: false, nunca um número inventado', () => {
  const t = lerTestes('tudo certo por aqui\n')
  assert.equal(t.conhecido, false)
  assert.equal(t.rodaram, 0)
})

test('rodar junta a leitura de testes na resposta', () => {
  const r = rodar('node -e "console.log(\'# tests 3\'); console.log(\'# pass 3\'); console.log(\'# fail 0\')"', { cwd: process.cwd() })
  assert.equal(r.testes.rodaram, 3)
  assert.equal(r.testes.conhecido, true)
})

test('limparAmbiente TIRA o NODE_TEST_CONTEXT, que envenena o runner filho', () => {
  const limpo = limparAmbiente({ CAMINHO: 'x', NODE_TEST_CONTEXT: 'child-v8', NODE_TEST_WORKER_ID: '1' })
  assert.equal(limpo.NODE_TEST_CONTEXT, undefined)
  assert.equal(limpo.NODE_TEST_WORKER_ID, undefined)
  assert.equal(limpo.CAMINHO, 'x', 'o resto do ambiente tem que sobrar inteiro')
})

test('limparAmbiente não estraga o ambiente de quem chamou', () => {
  const original = { NODE_TEST_CONTEXT: 'child-v8' }
  limparAmbiente(original)
  assert.equal(original.NODE_TEST_CONTEXT, 'child-v8', 'a limpeza é numa cópia')
})

test('um node --test filho MEDE de verdade, mesmo rodando dentro de um node --test', () => {
  // Sem a limpeza, o filho herda NODE_TEST_CONTEXT, emite stdout VAZIO e sai 0.
  // Seria "passou" onde ninguém rodou teste nenhum.
  const r = rodar('node -e "console.log(\'# tests 2\'); console.log(\'# pass 2\'); console.log(\'# fail 0\')"', { cwd: process.cwd() })
  assert.equal(r.testes.conhecido, true, 'o filho tem que produzir saída legível')
  assert.equal(r.testes.rodaram, 2)
})

test('o resumo do pytest com FAILURES no meio NÃO vira "0 teste rodou"', () => {
  // 🚨 Este é o defeito que cega a trilha Python inteira. Um regex sobre a
  // saída toda erra, porque `\s` casa `\n`: ele atravessa as três linhas
  // abaixo, casando os `=` da primeira, a palavra FAILED da segunda (o `i` a
  // torna `failed`) e os `=` da terceira. A captura vira "FAILED tests/..." —
  // sem número nenhum — e o runner AFIRMA `rodaram: 0` com `conhecido: true`.
  // Toda mutação reprova com "o runner não mediu nada", e nenhuma pode ser
  // reexecutada.
  const saida = [
    '=========================== short test summary info ===========================',
    'FAILED tests/test_conversao.py::test_converter_recusa_cotacao_invalida - Fail...',
    '======================== 1 failed, 40 passed in 0.18s ========================',
    ''
  ].join('\n')
  const t = lerTestes(saida)
  assert.equal(t.conhecido, true)
  assert.equal(t.rodaram, 41, 'o resumo diz 1 failed e 40 passed: são 41')
  assert.equal(t.falharam, 1)
})

test('a saída INTEIRA do pytest, do cabeçalho ao resumo, é lida pelo fim', () => {
  const saida = [
    '============================= test session starts =============================',
    'platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0',
    'collected 41 items',
    '',
    'tests\test_cambio.py ...........                                        [ 26%]',
    'tests\test_conversao.py ......F                                         [100%]',
    '',
    '================================== FAILURES ===================================',
    '____________________ test_converter_recusa_cotacao_invalida ___________________',
    'E       Failed: DID NOT RAISE ValueError',
    '=========================== short test summary info ===========================',
    'FAILED tests/test_conversao.py::test_converter_recusa_cotacao_invalida - Fail...',
    '======================== 1 failed, 40 passed in 0.18s ========================',
    ''
  ].join('\n')
  const t = lerTestes(saida)
  assert.equal(t.rodaram, 41)
  assert.equal(t.falharam, 1)
})

test('com DOIS resumos numéricos, vale o ÚLTIMO', () => {
  // ⚠️ O teste da saída inteira, acima, não mede a ORDEM da leitura: nenhuma
  // linha anterior da carga tem número, então ler de frente para trás dá o
  // mesmo resultado (virando o laço, 18/18 verdes). Aqui, ler do começo dá a
  // resposta errada.
  const saida = [
    '============================== 3 passed in 0.01s ==============================',
    '======================== 1 failed, 40 passed in 0.18s ========================',
    ''
  ].join('\n')
  const t = lerTestes(saida)
  assert.equal(t.rodaram, 41)
  assert.equal(t.falharam, 1)
})

test('linha com = em volta, casando o padrão e SEM número nenhum, não é medida', () => {
  // ⚠️ O par que impede o conserto de repetir o defeito com outra roupa: dizer
  // `rodaram: 0, conhecido: true` sobre ruído é afirmar que nada rodou.
  //
  // 🚨 A carga precisa CASAR o regex, ou o teste não mede o trecho que existe
  // para medir. Com `===== FAILURES =====` o regex nem casa (a palavra é
  // FAILURES, não FAILED), o caminho cai no "não conheço" por outro motivo, e a
  // mutação do `continue` passaria verde. A carga abaixo
  // tem `ERROR`, que casa `error`, e nenhum dígito.
  const t = lerTestes('==================== ERROR collecting tests ====================\n')
  assert.equal(t.conhecido, false, 'ruído com = em volta não é resumo, e não se finge que é')
  assert.equal(t.rodaram, 0)
})

test('saída maior que o buffer é ESTOUROU BUFFER, nunca morto por tempo', () => {
  // 🚨 Com a saída acima do `maxBuffer`, o Node mata o filho e devolve
  // `status: null` com `SIGTERM`, a mesma cara do processo morto por prazo. O
  // portão imprimiria "MORTO POR TEMPO" para um passo que falou demais em dois
  // segundos, e mandaria medir de novo.
  const r = rodar('node -e "process.stdout.write(String(1).repeat(50000))"', { cwd: process.cwd(), maxBuffer: 1000 })
  assert.equal(r.estourouBuffer, true)
  assert.equal(r.mortoPorTempo, false, 'estourar o buffer não é passar do prazo')
  assert.equal(r.saiu, 126)
})

test('saída que cabe no buffer não é estouro', () => {
  const r = rodar('node -e "process.stdout.write(String(1).repeat(500))"', { cwd: process.cwd(), maxBuffer: 1000 })
  assert.equal(r.estourouBuffer, false)
  assert.equal(r.saiu, 0)
})
