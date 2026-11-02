// node --test .claude/skills/fabrica/kit/testes/teste-portao.mjs
//
// Classe de defeito: portão que para no meio e sai 0, e portão que confunde
// processo morto por tempo com reprovação legítima: o portão que para e
// reporta exit 0 com dez passos não executados, pelo `comando | tail`, e o
// filho morto por timeout que sai não-zero, sem o `finally` rodar, com o
// defeito reaparecendo disfarçado.
//
// mutação: kit/portao.mjs · "if (r.saiu === 0) {" → "if (true) {" · pega
// mutação: kit/portao.mjs · "  return passo.para === true || passo.nome === 'testar'" → "  return true" · pega
// mutação: kit/portao.mjs · "sujos = sujos.filter((c) => daFeature.has(c) || c.startsWith(`${kit}/`))" → "sujos = sujos.filter(() => true)" · pega

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { criar, apagar } from '../lib/temporaria.mjs'
import { rodar } from '../lib/runner.mjs'

import { rodarPortao, listarPassos } from '../portao.mjs'

function comGit (raiz) {
  rodar('git init -q', { cwd: raiz, tempoMaximo: 20000 })
  rodar('git add -A', { cwd: raiz, tempoMaximo: 20000 })
  rodar('git -c user.name=f -c user.email=f@f commit -qm base --no-verify', { cwd: raiz, tempoMaximo: 20000 })
}

const VERDE = 'node -e "process.exit(0)"'
const VERMELHO = 'node -e "console.error(\'quebrou aqui\'); process.exit(1)"'

function papel () {
  const linhas = []
  return { linhas, escreve: (t) => linhas.push(String(t)), texto: () => linhas.join('\n') }
}

function pasta () {
  return criar('fabrica-portao-')
}

test('todos verdes: fecha 0 e diz quantos de quantos', () => {
  const raiz = pasta(); const s = papel()
  try {
    const r = rodarPortao({
      passos: [
        { nome: 'um', cmd: VERDE, onde: 'todos' },
        { nome: 'dois', cmd: VERDE, onde: 'todos' }
      ],
      raiz,
      escreve: s.escreve
    })
    assert.equal(r.codigo, 0)
    assert.equal(r.executados.length, 2)
    assert.match(s.texto(), /fechou: 2 de 2/)
  } finally { apagar(raiz) }
})

test('vermelho no meio: SEGUE, sai 1 e reporta TODOS os vermelhos', () => {
  // 🚨 Parar no primeiro vermelho deixa uma catraca do `silencio` esconder dez
  // passos, e cada conserto revela o próximo defeito numa rodada nova. O
  // portão roda tudo e diz o conjunto.
  const raiz = pasta(); const s = papel()
  try {
    const r = rodarPortao({
      passos: [
        { nome: 'um', cmd: VERDE, onde: 'todos' },
        { nome: 'dois', cmd: VERMELHO, onde: 'todos' },
        { nome: 'tres', cmd: VERDE, onde: 'todos' },
        { nome: 'quatro', cmd: VERMELHO, onde: 'todos' }
      ],
      raiz,
      escreve: s.escreve
    })
    assert.equal(r.codigo, 1)
    assert.deepEqual(r.vermelhos, ['dois', 'quatro'])
    assert.deepEqual(r.executados.map((e) => e.nome), ['um', 'dois', 'tres', 'quatro'])
    assert.equal(r.parouEm, null, 'nada parou: todos rodaram')
    assert.deepEqual(r.naoRodaram, [])
    assert.match(s.texto(), /VERMELHOS \(2\): dois, quatro/)
    assert.match(s.texto(), /quebrou aqui/, 'a saída do passo que quebrou tem que aparecer')
    assert.match(s.texto(), /portao\.mjs --so dois/, 'tem que dizer como repetir só ele')
  } finally { apagar(raiz) }
})

test('vermelho no `testar` PARA ali: o que vem depois lê a saída dele', () => {
  const raiz = pasta(); const s = papel()
  try {
    const r = rodarPortao({
      passos: [
        { nome: 'testar', cmd: VERMELHO, onde: 'todos' },
        { nome: 'cobertura', cmd: VERDE, onde: 'todos' },
        { nome: 'outro', cmd: VERDE, onde: 'todos' }
      ],
      raiz,
      escreve: s.escreve
    })
    assert.equal(r.codigo, 1)
    assert.equal(r.parouEm, 'testar')
    assert.deepEqual(r.naoRodaram, ['cobertura', 'outro'])
    assert.match(s.texto(), /PAROU EM: testar/)
    assert.match(s.texto(), /NÃO RODARAM \(2\)/)
  } finally { apagar(raiz) }
})

test('passo com `para: true` também para quando fica vermelho', () => {
  const raiz = pasta(); const s = papel()
  try {
    const r = rodarPortao({
      passos: [
        { nome: 'base', cmd: VERMELHO, onde: 'todos', para: true },
        { nome: 'depois', cmd: VERDE, onde: 'todos' }
      ],
      raiz,
      escreve: s.escreve
    })
    assert.equal(r.parouEm, 'base')
    assert.deepEqual(r.naoRodaram, ['depois'])
  } finally { apagar(raiz) }
})

test('cada passo tem a duração medida, na saída e no .ultimo-portao.json', () => {
  const raiz = pasta(); const s = papel()
  try {
    const r = rodarPortao({
      passos: [
        { nome: 'um', cmd: 'node -e "setTimeout(()=>{}, 150)"', onde: 'todos' },
        { nome: 'dois', cmd: VERMELHO, onde: 'todos' }
      ],
      raiz,
      escreve: s.escreve
    })
    assert.ok(r.executados[0].duracaoMs >= 100, `mediu ${r.executados[0].duracaoMs}ms num passo de 150ms`)
    assert.match(s.texto(), /✓.*passou · \d+,\d s/)
    const estado = JSON.parse(readFileSync(join(raiz, 'fabrica', '.ultimo-portao.json'), 'utf8'))
    assert.deepEqual(estado.passos.map((p) => p.nome), ['um', 'dois'])
    assert.equal(typeof estado.passos[0].duracaoMs, 'number')
    assert.equal(estado.passos[1].saiu, 1)
    assert.deepEqual(estado.vermelhos, ['dois'])
  } finally { apagar(raiz) }
})

test('o .ultimo-portao.json nasce inteiro: nada de meio arquivo, nada de sobra', () => {
  // ⚠️ Escrita atômica: o revisor lê este arquivo, e um portão morto no meio
  // da escrita deixaria JSON pela metade. Escreve-se ao lado e troca-se o nome.
  const raiz = pasta()
  try {
    rodarPortao({ passos: [{ nome: 'um', cmd: VERDE, onde: 'todos' }], raiz, escreve: () => {} })
    const pastaDoEstado = join(raiz, 'fabrica')
    const sobras = readdirSync(pastaDoEstado).filter((f) => f !== '.ultimo-portao.json')
    assert.deepEqual(sobras, [], `sobrou arquivo temporário: ${sobras.join(', ')}`)
    assert.doesNotThrow(() => JSON.parse(readFileSync(join(pastaDoEstado, '.ultimo-portao.json'), 'utf8')))
  } finally { apagar(raiz) }
})

test('morto por tempo NÃO é reprovado: é outra linha, e a pasta dele drena', () => {
  // 🚨 A pasta deste caso vazaria a cada execução (114 em %TEMP%, medido): no
  // Windows o `cmd` morre e o `node` neto segue vivo com o cwd dentro dela. O
  // neto dorme menos que o prazo de `apagar`, e a volta é conferida.
  const raiz = pasta(); const s = papel()
  try {
    const r = rodarPortao({
      passos: [{ nome: 'dorminhoco', cmd: 'node -e "setTimeout(()=>{}, 1500)"', onde: 'todos', tempoMaximo: 400 }],
      raiz,
      escreve: s.escreve
    })
    assert.equal(r.codigo, 1)
    assert.match(s.texto(), /MORTO POR TEMPO/)
    assert.doesNotMatch(s.texto(), /REPROVOU/, 'morto por tempo não pode ser lido como reprovação')
  } finally {
    assert.equal(apagar(raiz, { prazoMs: 8000 }), true, 'a pasta do passo morto por tempo não drenou: vazou')
  }
})

test('saída maior que o buffer diz isso, e não "morto por tempo"', () => {
  const raiz = pasta(); const s = papel()
  try {
    const r = rodarPortao({
      passos: [{ nome: 'falador', cmd: 'node -e "process.stdout.write(String(1).repeat(50000))"', onde: 'todos', maxBuffer: 1000 }],
      raiz,
      escreve: s.escreve
    })
    assert.equal(r.codigo, 1)
    assert.match(s.texto(), /SAÍDA MAIOR QUE O BUFFER/)
    assert.doesNotMatch(s.texto(), /MORTO POR TEMPO/)
  } finally { apagar(raiz) }
})

test('árvore suja por ESCOPO: specs/<NNN>/ não suja, o código sim', () => {
  // 🚨 Rodada de revisor volta GATE VERMELHO por árvore suja, e o que suja
  // costuma ser o rastro da própria revisão (o relatório da rodada 1)
  // ou trabalho de outra sessão. Só conta o que a lente revisa.
  const raiz = pasta()
  try {
    mkdirSync(join(raiz, 'src'), { recursive: true })
    mkdirSync(join(raiz, 'specs', '001-x', 'revisoes'), { recursive: true })
    writeFileSync(join(raiz, 'src', 'a.mjs'), 'export const a = 1\n')
    comGit(raiz)

    writeFileSync(join(raiz, 'specs', '001-x', 'revisoes', 'codigo.md'), 'relatório\n')
    rodarPortao({ passos: [{ nome: 'um', cmd: VERDE, onde: 'todos' }], raiz, escreve: () => {} })
    let estado = JSON.parse(readFileSync(join(raiz, 'fabrica', '.ultimo-portao.json'), 'utf8'))
    assert.equal(estado.arvoreSuja, false, `o rastro da feature sujou a árvore: ${estado.sujos}`)

    writeFileSync(join(raiz, 'src', 'a.mjs'), 'export const a = 2\n')
    rodarPortao({ passos: [{ nome: 'um', cmd: VERDE, onde: 'todos' }], raiz, escreve: () => {} })
    estado = JSON.parse(readFileSync(join(raiz, 'fabrica', '.ultimo-portao.json'), 'utf8'))
    assert.equal(estado.arvoreSuja, true)
    assert.deepEqual(estado.sujos, ['src/a.mjs'])
  } finally { apagar(raiz) }
})

test('árvore suja com --base: só o diff da feature e a pasta do kit contam', () => {
  const raiz = pasta()
  try {
    mkdirSync(join(raiz, 'src'), { recursive: true })
    writeFileSync(join(raiz, 'src', 'da-feature.mjs'), 'export const a = 1\n')
    writeFileSync(join(raiz, 'src', 'de-outra-sessao.mjs'), 'export const b = 1\n')
    comGit(raiz)
    rodar('git branch base', { cwd: raiz, tempoMaximo: 20000 })
    writeFileSync(join(raiz, 'src', 'da-feature.mjs'), 'export const a = 2\n')
    rodar('git -c user.name=f -c user.email=f@f commit -qam feature --no-verify', { cwd: raiz, tempoMaximo: 20000 })

    // outra sessão suja um arquivo que a feature não tocou
    writeFileSync(join(raiz, 'src', 'de-outra-sessao.mjs'), 'export const b = 9\n')
    rodarPortao({ passos: [{ nome: 'um', cmd: VERDE, onde: 'todos' }], raiz, base: 'base', escreve: () => {} })
    let estado = JSON.parse(readFileSync(join(raiz, 'fabrica', '.ultimo-portao.json'), 'utf8'))
    assert.equal(estado.arvoreSuja, false, 'sujeira fora do diff da feature não é da lente')
    assert.match(estado.escopo, /base/)

    // a feature suja o próprio arquivo: aí conta
    writeFileSync(join(raiz, 'src', 'da-feature.mjs'), 'export const a = 3\n')
    rodarPortao({ passos: [{ nome: 'um', cmd: VERDE, onde: 'todos' }], raiz, base: 'base', escreve: () => {} })
    estado = JSON.parse(readFileSync(join(raiz, 'fabrica', '.ultimo-portao.json'), 'utf8'))
    assert.equal(estado.arvoreSuja, true)
    assert.deepEqual(estado.sujos, ['src/da-feature.mjs'])
  } finally { apagar(raiz) }
})

test('--base que o git não conhece não vira árvore limpa: é não medido', () => {
  const raiz = pasta()
  try {
    writeFileSync(join(raiz, 'a.txt'), 'x\n')
    comGit(raiz)
    rodarPortao({ passos: [{ nome: 'um', cmd: VERDE, onde: 'todos' }], raiz, base: 'nao-existe', escreve: () => {} })
    const estado = JSON.parse(readFileSync(join(raiz, 'fabrica', '.ultimo-portao.json'), 'utf8'))
    assert.equal(estado.arvoreSuja, true, 'sem saber o diff, a árvore não pode ser dada por limpa')
    assert.match(estado.escopo, /não conheço|desconhecida/)
  } finally { apagar(raiz) }
})

test('a linha de comando: bandeira desconhecida sai 2, e --raiz é aceito', () => {
  const kit = join(dirname(fileURLToPath(import.meta.url)), '..', 'portao.mjs').split('\\').join('/')
  const errada = rodar(`node "${kit}" --raix /tmp`, { tempoMaximo: 30000 })
  assert.equal(errada.saiu, 2, `saiu ${errada.saiu}: ${errada.saida}`)
  assert.match(errada.saida, /--raix/)

  const raiz = pasta()
  try {
    mkdirSync(join(raiz, 'fabrica'), { recursive: true })
    writeFileSync(join(raiz, 'fabrica', 'stack.mjs'), `export const PASSOS = [{ nome: 'so-este', cmd: ${JSON.stringify(VERDE)}, onde: 'todos' }]\n`)
    const certa = rodar(`node "${kit}" --raiz "${raiz.split('\\').join('/')}" --listar`, { tempoMaximo: 30000 })
    assert.equal(certa.saiu, 0, certa.saida)
    assert.match(certa.saida, /so-este/, 'o --raiz tem que ler o stack.mjs DAQUELA raiz')
  } finally { apagar(raiz) }
})

test('--so roda um passo só', () => {
  const raiz = pasta(); const s = papel()
  try {
    const r = rodarPortao({
      passos: [
        { nome: 'um', cmd: VERMELHO, onde: 'todos' },
        { nome: 'dois', cmd: VERDE, onde: 'todos' }
      ],
      raiz,
      so: 'dois',
      escreve: s.escreve
    })
    assert.equal(r.codigo, 0)
    assert.deepEqual(r.executados.map((e) => e.nome), ['dois'])
  } finally { apagar(raiz) }
})

test('--so com nome que não existe é VERMELHO, nunca um verde vazio', () => {
  const raiz = pasta(); const s = papel()
  try {
    const r = rodarPortao({ passos: [{ nome: 'um', cmd: VERDE, onde: 'todos' }], raiz, so: 'inexistente', escreve: s.escreve })
    assert.equal(r.codigo, 1)
    assert.match(s.texto(), /inexistente/)
  } finally { apagar(raiz) }
})

test('no CI, passo `maquina` é pulado COM a razão impressa', () => {
  const raiz = pasta(); const s = papel()
  try {
    const r = rodarPortao({
      passos: [
        { nome: 'local', cmd: VERMELHO, onde: 'maquina', razao: 'fala com o banco de produção' },
        { nome: 'sempre', cmd: VERDE, onde: 'todos' }
      ],
      raiz,
      ci: true,
      escreve: s.escreve
    })
    assert.equal(r.codigo, 0)
    assert.deepEqual(r.pulados.map((p) => p.nome), ['local'])
    assert.match(s.texto(), /fala com o banco de produção/)
  } finally { apagar(raiz) }
})

test('fora do CI, passo `maquina` RODA', () => {
  const raiz = pasta(); const s = papel()
  try {
    const r = rodarPortao({
      passos: [{ nome: 'local', cmd: VERMELHO, onde: 'maquina', razao: 'fala com o banco' }],
      raiz,
      ci: false,
      escreve: s.escreve
    })
    assert.equal(r.codigo, 1, 'na máquina ele tem que rodar, e reprovar')
  } finally { apagar(raiz) }
})

test('passo com `precisa` pula quando a variável não existe, e roda quando existe', () => {
  const raiz = pasta()
  try {
    const a = papel()
    const r1 = rodarPortao({
      passos: [{ nome: 'banco', cmd: VERMELHO, onde: 'todos', precisa: 'VAR_QUE_NAO_EXISTE_AQUI' }],
      raiz, ci: true, escreve: a.escreve, ambiente: {}
    })
    assert.equal(r1.codigo, 0)
    assert.match(a.texto(), /VAR_QUE_NAO_EXISTE_AQUI/)

    const b = papel()
    const r2 = rodarPortao({
      passos: [{ nome: 'banco', cmd: VERMELHO, onde: 'todos', precisa: 'TEM_BANCO' }],
      raiz, ci: true, escreve: b.escreve, ambiente: { TEM_BANCO: 'sim' }
    })
    assert.equal(r2.codigo, 1, 'com a variável, o passo roda')
  } finally { apagar(raiz) }
})

test('escreve o resumo do GitHub quando GITHUB_STEP_SUMMARY existe', () => {
  const raiz = pasta()
  const resumo = join(raiz, 'resumo.md')
  try {
    rodarPortao({
      passos: [
        { nome: 'pulado', cmd: VERDE, onde: 'maquina', razao: 'precisa do disco local' },
        { nome: 'ok', cmd: VERDE, onde: 'todos' }
      ],
      raiz, ci: true, escreve: () => {}, ambiente: { GITHUB_STEP_SUMMARY: resumo }
    })
    assert.ok(existsSync(resumo), 'o resumo tem que existir')
    const texto = readFileSync(resumo, 'utf8')
    assert.match(texto, /pulado/)
    assert.match(texto, /precisa do disco local/, 'pulado no CI tem que ser VISÍVEL, com a razão')
  } finally { apagar(raiz) }
})

test('escreve .ultimo-portao.json com o que o revisor precisa saber', () => {
  const raiz = pasta()
  try {
    rodarPortao({ passos: [{ nome: 'um', cmd: VERDE, onde: 'todos' }], raiz, escreve: () => {} })
    const arquivo = join(raiz, 'fabrica', '.ultimo-portao.json')
    assert.ok(existsSync(arquivo))
    const estado = JSON.parse(readFileSync(arquivo, 'utf8'))
    assert.equal(estado.resultado, 'verde')
    assert.ok(estado.quando)
    assert.ok(Array.isArray(estado.pulados))
    assert.equal(typeof estado.arvoreSuja, 'boolean')
  } finally { apagar(raiz) }
})

test('.ultimo-portao.json diz vermelho, e quais', () => {
  const raiz = pasta()
  try {
    rodarPortao({ passos: [{ nome: 'um', cmd: VERMELHO, onde: 'todos' }], raiz, escreve: () => {} })
    const estado = JSON.parse(readFileSync(join(raiz, 'fabrica', '.ultimo-portao.json'), 'utf8'))
    assert.equal(estado.resultado, 'vermelho')
    assert.deepEqual(estado.vermelhos, ['um'])
  } finally { apagar(raiz) }
})

test('listarPassos: passo `maquina` SEM razão reprova a lista', () => {
  const s = papel()
  const codigo = listarPassos([
    { nome: 'um', cmd: VERDE, onde: 'todos' },
    { nome: 'dois', cmd: VERDE, onde: 'maquina' }
  ], { escreve: s.escreve })
  assert.equal(codigo, 1)
  assert.match(s.texto(), /dois/)
  assert.match(s.texto(), /razão/i)
})

test('listarPassos: com razão em todo `maquina`, sai 0 e mostra o `onde` de cada um', () => {
  const s = papel()
  const codigo = listarPassos([
    { nome: 'um', cmd: VERDE, onde: 'todos' },
    { nome: 'dois', cmd: VERDE, onde: 'maquina', razao: 'precisa do disco local' }
  ], { escreve: s.escreve })
  assert.equal(codigo, 0)
  assert.match(s.texto(), /todos/)
  assert.match(s.texto(), /maquina/)
})

test('lista vazia é VERMELHO: portão sem passo não mede nada', () => {
  const raiz = pasta(); const s = papel()
  try {
    const r = rodarPortao({ passos: [], raiz, escreve: s.escreve })
    assert.equal(r.codigo, 1)
    assert.match(s.texto(), /nenhum passo/i)
  } finally { apagar(raiz) }
})

test('passo sem nome ou sem comando reprova antes de rodar qualquer coisa', () => {
  const raiz = pasta(); const s = papel()
  try {
    const r = rodarPortao({ passos: [{ cmd: VERDE, onde: 'todos' }], raiz, escreve: s.escreve })
    assert.equal(r.codigo, 1)
    assert.equal(r.executados.length, 0)
  } finally { apagar(raiz) }
})
