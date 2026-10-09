// node --test .claude/skills/fabrica/kit/testes/teste-fundir-revisoes.mjs
//
// Classe de defeito: a fusão das lentes que nunca roda. Relatório real vem com
// `Veredito: X` com prefixo, `Não verificado:` em lista e `Lido:` ausente (5
// de 6, medido); uma fusão que rejeita isso não lê nenhum achado, ninguém a
// roda, e o teto de duas rodadas passa a ser contado de cabeça.
//
// ⚠️ Os relatórios daqui imitam o formato REAL das lentes, sem copiar o
// conteúdo de projeto nenhum: o kit vai para projetos de cliente.
// mutação: kit/fundir-revisoes.mjs · "  if (veredito === 'GATE VERMELHO') {" → "  if (false) {" · pega
// mutação: kit/fundir-revisoes.mjs · "const teto = veredito === 'AJUSTAR ANTES' && rodada >= TETO" → "const teto = false" · pega
// mutação: kit/fundir-revisoes.mjs · "let daRodada = relatorios.filter((r) => (r.rodada ?? 1) === rodada)" → "let daRodada = relatorios" · pega
// mutação: kit/fundir-revisoes.mjs · "      if (rodada > 1 && prontaAntes(relatorios, l, rodada, arquivosDoDiff)) { mantidas.push(l); continue }" → "      if (false) { mantidas.push(l); continue }" · pega
// mutação: kit/fundir-revisoes.mjs · "  return r.ok && r.veredito === 'PRONTA PRA ENTREGA'" → "  return true" · pega
// mutação: kit/fundir-revisoes.mjs · "!aceitou(aceito, a.local)" → "!aceito.includes(a.local)" · pega

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { criar, apagar } from '../lib/temporaria.mjs'
import { rodar } from '../lib/runner.mjs'
import { conferirRelatorio, fundir, rodadaDe, cobertos } from '../fundir-revisoes.mjs'

const DIFF = ['src/a.ts', 'src/modulos/conteudo/b.ts', 'testes/a.test.ts']

/** O formato do contrato: achado entre colchetes, Lido, Não verificado e o veredito sozinho. */
const CONTRATO = [
  '[src/a.ts:12] o erro é engolido — constituição VIII — relance depois de avisar',
  '',
  'Lido: src/a.ts, src/modulos/conteudo/b.ts, testes/a.test.ts',
  '',
  'Não verificado: o comportamento com o banco real, porque não subi o serviço',
  '',
  'AJUSTAR ANTES'
].join('\n')

/** O formato que as lentes escreveram de verdade: lista numerada, gravidade, e o veredito com prefixo. */
const REAL = [
  '# Revisão de arquitetura · bloco 1 · rodada 1',
  '',
  'Portão: verde, commit abc1234 igual ao HEAD, árvore limpa.',
  '',
  '1. **ALTO · [src/a.ts:83-85, :113-116]** Uma publicação que não pode sair trava a fila das outras contas.',
  '   - O conserto: a fila não pega a publicação devolvida antes de um tempo mínimo.',
  '',
  '2. **BAIXO · [src/modulos/conteudo/b.ts:21]** A tela não diz de onde vem a IA.',
  '',
  'Não verificado:',
  '- O achado 1 foi deduzido do código, não reproduzido contra o banco.',
  '- Nenhuma mutação foi rodada.',
  '',
  'Veredito: AJUSTAR ANTES'
].join('\n')

/** Outro formato real: o achado com "Gravidade N" no fim, e o Lido por pasta e padrão. */
const REAL_SEGURANCA = [
  '# Revisão de segurança · rodada 1',
  '',
  '1. **[src/modulos/conteudo/b.ts:122] O nome real do cliente vai para a IA sem passar pelo filtro.** Gravidade 1.',
  '   - Conserto: ler as duas colunas e mandar as duas para o filtro.',
  '',
  'Lido: `src/modulos/conteudo/*`; `testes/`',
  '',
  'Não verificado:',
  '- Nada rodou contra o banco.',
  '',
  'Veredito: PRONTA PRA ENTREGA'
].join('\n')

test('o formato do contrato continua aceito', () => {
  const r = conferirRelatorio(CONTRATO, DIFF)
  assert.equal(r.ok, true, r.problemas.join(' · '))
  assert.equal(r.veredito, 'AJUSTAR ANTES')
  assert.equal(r.achados.length, 1)
})

test('o formato REAL é aceito: "Veredito:" com prefixo e "Não verificado:" em lista', () => {
  const r = conferirRelatorio(REAL, DIFF)
  assert.equal(r.ok, true, r.problemas.join(' · '))
  assert.equal(r.veredito, 'AJUSTAR ANTES')
  assert.match(r.naoVerificado, /deduzido do código/)
  assert.match(r.naoVerificado, /Nenhuma mutação/)
})

test('os achados numerados são lidos, com o local e a gravidade', () => {
  const r = conferirRelatorio(REAL, DIFF)
  assert.equal(r.achados.length, 2)
  assert.equal(r.achados[0].local, 'src/a.ts:83-85, :113-116')
  assert.equal(r.achados[0].gravidade, 1)
  assert.equal(r.achados[1].gravidade, 3)
  const s = conferirRelatorio(REAL_SEGURANCA, DIFF)
  assert.equal(s.achados.length, 1)
  assert.equal(s.achados[0].gravidade, 1, '"Gravidade 1" no fim da linha também conta')
})

test('sem "Lido:" a lente NÃO é rejeitada: o diff inteiro sai como não citado', () => {
  // 🚨 O diff de uma rodada real chega a 147 arquivos, e 5 de 6 relatórios não
  // escrevem a linha (medido). Rejeitar custaria uma rodada de
  // lente inteira; o que não foi citado fica visível na fusão e na entrega.
  const r = conferirRelatorio(REAL, DIFF)
  assert.equal(r.ok, true)
  assert.deepEqual(r.naoCitados, DIFF)
})

test('o "Lido:" aceita pasta e padrão, e só o que ficou fora sai como não citado', () => {
  const r = conferirRelatorio(REAL_SEGURANCA, DIFF)
  assert.deepEqual(r.naoCitados, ['src/a.ts'])
  assert.deepEqual(cobertos(['src/**'], ['src/x/y.ts', 'lib/z.ts']), ['src/x/y.ts'])
  assert.deepEqual(cobertos(['*.md'], ['README.md', 'docs/a.md']), ['README.md'])
})

test('relatório sem "Não verificado" é rejeitado', () => {
  const r = conferirRelatorio(REAL.replace(/Não verificado:[\s\S]*?\n\n/, ''), DIFF)
  assert.equal(r.ok, false)
  assert.match(r.problemas.join(' '), /não verificado/i)
})

test('relatório sem veredito é rejeitado', () => {
  const r = conferirRelatorio(REAL.replace('Veredito: AJUSTAR ANTES', 'acho que está bom'), DIFF)
  assert.equal(r.ok, false)
  assert.match(r.problemas.join(' '), /veredito/i)
})

test('GATE VERMELHO é veredito: a lente é rejeitada com a razão, e força AJUSTAR ANTES', () => {
  const gate = 'GATE VERMELHO\n\nNão verificado: tudo; o portão não estava verde\n'
  const r = fundir([
    { lente: 'codigo', rodada: 1, texto: gate },
    { lente: 'arquitetura', rodada: 1, texto: REAL.replace('Veredito: AJUSTAR ANTES', 'Veredito: PRONTA PRA ENTREGA') }
  ], DIFF)
  assert.equal(r.veredito, 'AJUSTAR ANTES')
  assert.equal(r.rejeitados.length, 1)
  assert.match(r.rejeitados[0].problemas.join(' '), /portão não estava verde/)
})

test('o mesmo defeito em duas lentes vira UM achado, com as duas anotadas', () => {
  const r = fundir([
    { lente: 'arquitetura', rodada: 1, texto: CONTRATO },
    { lente: 'codigo', rodada: 1, texto: CONTRATO }
  ], DIFF)
  assert.equal(r.achados.length, 1)
  assert.deepEqual(r.achados[0].lentes.sort(), ['arquitetura', 'codigo'])
})

test('com --lentes, a lente esperada que não entregou relatório é rejeitada', () => {
  const r = fundir([{ lente: 'codigo', rodada: 1, texto: REAL }], DIFF, { lentes: ['codigo', 'seguranca'] })
  assert.equal(r.veredito, 'AJUSTAR ANTES')
  assert.ok(r.rejeitados.some((x) => x.lente === 'seguranca' && /não entregou/.test(x.problemas.join(' '))))
})

test('com --lentes, relatório de lente que não foi pedida não conta', () => {
  const pronto = REAL.replace('Veredito: AJUSTAR ANTES', 'Veredito: PRONTA PRA ENTREGA')
  const r = fundir([
    { lente: 'codigo', rodada: 1, texto: pronto },
    { lente: 'seguranca', rodada: 1, texto: pronto },
    { lente: 'arquitetura', rodada: 1, texto: REAL }
  ], DIFF, { lentes: ['codigo', 'seguranca'] })
  assert.equal(r.veredito, 'PRONTA PRA ENTREGA', 'a lente de arquitetura não foi pedida para este tamanho')
})

test('só a rodada ATUAL conta: o relatório da rodada 1 não se funde com o da 2', () => {
  const pronto = REAL.replace('Veredito: AJUSTAR ANTES', 'Veredito: PRONTA PRA ENTREGA')
  const r = fundir([
    { lente: 'codigo', rodada: 1, texto: REAL },
    { lente: 'codigo', rodada: 2, texto: pronto }
  ], DIFF)
  assert.equal(r.rodada, 2)
  assert.equal(r.veredito, 'PRONTA PRA ENTREGA')
})

test('rodada 2 com AJUSTAR ANTES bate no TETO, e os achados 1 e 2 ficam abertos', () => {
  const r = fundir([{ lente: 'arquitetura', rodada: 2, texto: REAL }], DIFF)
  assert.equal(r.teto, true)
  assert.deepEqual(r.abertos.map((a) => a.gravidade), [1], 'o de gravidade 3 não é aberto')
})

test('rodada 1 com AJUSTAR ANTES não é teto', () => {
  assert.equal(fundir([{ lente: 'arquitetura', rodada: 1, texto: REAL }], DIFF).teto, false)
})

test('zero relatório é AJUSTAR ANTES, nunca PRONTA', () => {
  const r = fundir([], DIFF)
  assert.equal(r.veredito, 'AJUSTAR ANTES')
  assert.match(r.problemas.join(' '), /nenhum relatório/i)
})

test('o que está no ACEITO.md sai do relatório', () => {
  const r = fundir([{ lente: 'arquitetura', rodada: 1, texto: CONTRATO }], DIFF, {
    aceito: 'O erro engolido em src/a.ts:12 é de propósito, o arquivo é enfeite.'
  })
  assert.equal(r.achados.length, 0)
})

test('a rodada vem do nome do arquivo', () => {
  assert.deepEqual(rodadaDe('codigo.md'), { lente: 'codigo', rodada: 1 })
  assert.deepEqual(rodadaDe('seguranca-rodada-2.md'), { lente: 'seguranca', rodada: 2 })
  assert.equal(rodadaDe('fusao.json'), null)
})

// ───────────────────────────── a linha de comando, num repositório de verdade

function feature () {
  const raiz = criar('fabrica-fundir-')
  mkdirSync(join(raiz, 'src'), { recursive: true })
  writeFileSync(join(raiz, 'src', 'a.ts'), 'export const a = 1\n')
  rodar('git init -q', { cwd: raiz, tempoMaximo: 20000 })
  rodar('git add -A', { cwd: raiz, tempoMaximo: 20000 })
  rodar('git -c user.name=f -c user.email=f@f commit -qm base --no-verify', { cwd: raiz, tempoMaximo: 20000 })
  rodar('git branch base', { cwd: raiz, tempoMaximo: 20000 })
  writeFileSync(join(raiz, 'src', 'a.ts'), 'export const a = 2\n')
  rodar('git -c user.name=f -c user.email=f@f commit -qam feature --no-verify', { cwd: raiz, tempoMaximo: 20000 })
  mkdirSync(join(raiz, 'specs', '001-x', 'revisoes'), { recursive: true })
  return raiz
}

const CLI = join(dirname(fileURLToPath(import.meta.url)), '..', 'fundir-revisoes.mjs').split('\\').join('/')
const chamar = (raiz, resto) => rodar(`node "${CLI}" --raiz "${raiz.split('\\').join('/')}" ${resto}`, { tempoMaximo: 60000 })

test('CLI: base que o git não conhece REPROVA, em vez de fundir contra um diff vazio', () => {
  const raiz = feature()
  try {
    writeFileSync(join(raiz, 'specs', '001-x', 'revisoes', 'codigo.md'), REAL)
    const r = chamar(raiz, '--feature specs/001-x --base nao-existe')
    assert.equal(r.saiu, 1, r.saida)
    assert.match(r.saida, /nao-existe/)
  } finally { apagar(raiz) }
})

test('CLI: escreve revisoes/fusao.json com o head, a rodada e o veredito', () => {
  const raiz = feature()
  try {
    writeFileSync(join(raiz, 'specs', '001-x', 'revisoes', 'codigo.md'), REAL.replace('Veredito: AJUSTAR ANTES', 'Veredito: PRONTA PRA ENTREGA'))
    const r = chamar(raiz, '--feature specs/001-x --base base --lentes codigo')
    assert.equal(r.saiu, 0, r.saida)
    const fusao = JSON.parse(readFileSync(join(raiz, 'specs', '001-x', 'revisoes', 'fusao.json'), 'utf8'))
    assert.equal(fusao.veredito, 'PRONTA PRA ENTREGA')
    assert.equal(fusao.rodada, 1)
    assert.match(fusao.head, /^[0-9a-f]{40}$/)
    assert.deepEqual(fusao.naoCitados.codigo, ['src/a.ts'])
  } finally { apagar(raiz) }
})

test('CLI: rodada 2 com AJUSTAR ANTES sai 3 (o teto) e grava teto: true', () => {
  const raiz = feature()
  try {
    writeFileSync(join(raiz, 'specs', '001-x', 'revisoes', 'codigo.md'), REAL)
    writeFileSync(join(raiz, 'specs', '001-x', 'revisoes', 'codigo-rodada-2.md'), REAL)
    const r = chamar(raiz, '--feature specs/001-x --base base')
    assert.equal(r.saiu, 3, r.saida)
    assert.match(r.saida, /TETO/)
    const fusao = JSON.parse(readFileSync(join(raiz, 'specs', '001-x', 'revisoes', 'fusao.json'), 'utf8'))
    assert.equal(fusao.teto, true)
  } finally { apagar(raiz) }
})

test('CLI: rodada 3 só existe com --alem-do-teto e a razão, que fica gravada', () => {
  const raiz = feature()
  try {
    const pasta = join(raiz, 'specs', '001-x', 'revisoes')
    writeFileSync(join(pasta, 'codigo-rodada-3.md'), REAL.replace('Veredito: AJUSTAR ANTES', 'Veredito: PRONTA PRA ENTREGA'))
    const sem = chamar(raiz, '--feature specs/001-x --base base')
    assert.equal(sem.saiu, 3, sem.saida)
    assert.match(sem.saida, /--alem-do-teto/)

    const com = chamar(raiz, '--feature specs/001-x --base base --alem-do-teto "ele pediu mais uma rodada depois de ver o achado de gravidade 1"')
    assert.equal(com.saiu, 0, com.saida)
    const fusao = JSON.parse(readFileSync(join(pasta, 'fusao.json'), 'utf8'))
    assert.match(fusao.alemDoTeto, /ele pediu/)
    assert.ok(existsSync(join(pasta, 'fusao.json')))
  } finally { apagar(raiz) }
})

// ───────────────────────────── as lentes pedidas, o ACEITO por linha e o rótulo

test('com --lentes de TRÊS, a terceira que faltou também é rejeitada', () => {
  // Um laço que cobra só as duas primeiras lentes passaria sem este caso.
  const pronto = REAL.replace('Veredito: AJUSTAR ANTES', 'Veredito: PRONTA PRA ENTREGA')
  const r = fundir([
    { lente: 'codigo', rodada: 1, texto: pronto },
    { lente: 'seguranca', rodada: 1, texto: pronto }
  ], DIFF, { lentes: ['codigo', 'seguranca', 'arquitetura'] })
  assert.equal(r.veredito, 'AJUSTAR ANTES')
  assert.ok(r.rejeitados.some((x) => x.lente === 'arquitetura'))
})

test('ACEITO de OUTRA linha do mesmo arquivo não apaga o achado', () => {
  const texto = '[src/a.ts:40] o valor total fica errado — c — d\n\nNão verificado: x\n\nAJUSTAR ANTES'
  const r = fundir([{ lente: 'codigo', rodada: 1, texto }], DIFF, { aceito: 'src/a.ts:12 aceito: o valor do rótulo é provisório' })
  assert.equal(r.achados.length, 1)
})

test('a gravidade vem do RÓTULO quando ele existe, e não de uma palavra do texto', () => {
  const r = conferirRelatorio('1. **BAIXO · [a.ts:1]** a taxa alta não aparece no rótulo.\n\nNão verificado: x\n\nPRONTA PRA ENTREGA', ['a.ts'])
  assert.equal(r.achados[0].gravidade, 3)
})

test('o mesmo "Não verificado" de duas lentes aparece uma vez por lente, sem guarda morta', () => {
  const r = fundir([
    { lente: 'codigo', rodada: 1, texto: CONTRATO },
    { lente: 'seguranca', rodada: 1, texto: CONTRATO }
  ], DIFF)
  assert.deepEqual(r.naoVerificado.map((n) => n.split(':')[0]), ['codigo', 'seguranca'])
})

test('CLI: --alem-do-teto com razão CURTA não abre a rodada 3', () => {
  const raiz = feature()
  try {
    writeFileSync(join(raiz, 'specs', '001-x', 'revisoes', 'codigo-rodada-3.md'), REAL.replace('Veredito: AJUSTAR ANTES', 'Veredito: PRONTA PRA ENTREGA'))
    const curta = chamar(raiz, '--feature specs/001-x --base base --alem-do-teto "porque sim"')
    assert.equal(curta.saiu, 3, curta.saida)
  } finally { apagar(raiz) }
})

// ───────────────────────────── a rodada 2 parcial e o local exato do ACEITO

test('rodada 2 parcial: a lente que deu PRONTA na rodada 1 fica valendo, mesmo com --lentes das três', () => {
  // O SKILL manda rechamar só as lentes que acharam algo: cobrando relatório
  // de toda lente da lista na rodada atual, uma rodada 2 limpa sairia 3, no
  // teto.
  const pronto = REAL.replace('Veredito: AJUSTAR ANTES', 'Veredito: PRONTA PRA ENTREGA')
  const r = fundir([
    { lente: 'arquitetura', rodada: 1, texto: REAL },
    { lente: 'codigo', rodada: 1, texto: REAL },
    { lente: 'seguranca', rodada: 1, texto: pronto },
    { lente: 'arquitetura', rodada: 2, texto: pronto },
    { lente: 'codigo', rodada: 2, texto: pronto }
  ], DIFF, { lentes: ['arquitetura', 'codigo', 'seguranca'] })
  assert.deepEqual(r.rejeitados, [])
  assert.equal(r.veredito, 'PRONTA PRA ENTREGA')
  assert.equal(r.teto, false)
})

test('rodada 2 parcial: a lente que deu AJUSTAR na rodada 1 e não voltou é rejeitada', () => {
  const pronto = REAL.replace('Veredito: AJUSTAR ANTES', 'Veredito: PRONTA PRA ENTREGA')
  const r = fundir([
    { lente: 'codigo', rodada: 1, texto: pronto },
    { lente: 'seguranca', rodada: 1, texto: REAL },
    { lente: 'codigo', rodada: 2, texto: pronto }
  ], DIFF, { lentes: ['codigo', 'seguranca'] })
  assert.equal(r.veredito, 'AJUSTAR ANTES')
  assert.ok(r.rejeitados.some((x) => x.lente === 'seguranca' && /rodada 2/.test(x.problemas.join(' '))))
})

test('rodada 2 parcial: a lente REJEITADA na rodada 1 e que não voltou continua rejeitada', () => {
  const pronto = REAL.replace('Veredito: AJUSTAR ANTES', 'Veredito: PRONTA PRA ENTREGA')
  const r = fundir([
    { lente: 'codigo', rodada: 1, texto: REAL },
    { lente: 'seguranca', rodada: 1, texto: 'sem veredito nenhum\n\nNão verificado: x\n' },
    { lente: 'codigo', rodada: 2, texto: pronto }
  ], DIFF, { lentes: ['codigo', 'seguranca'] })
  assert.equal(r.veredito, 'AJUSTAR ANTES')
  assert.ok(r.rejeitados.some((x) => x.lente === 'seguranca'))
})

test('ACEITO da linha 12 não apaga o achado da linha 1', () => {
  // O local casa inteiro, nunca por pedaço de texto.
  const texto = '[src/a.ts:1] o valor total fica errado — c — d\n\nNão verificado: x\n\nAJUSTAR ANTES'
  const r = fundir([{ lente: 'codigo', rodada: 1, texto }], DIFF, { aceito: 'src/a.ts:12 aceito: o valor do rótulo é provisório' })
  assert.equal(r.achados.length, 1)
})

test('ACEITO de src/a.ts:12 não apaga o achado [a.ts:12] de outro arquivo', () => {
  const texto = '[a.ts:12] o valor total fica errado — c — d\n\nNão verificado: x\n\nAJUSTAR ANTES'
  const r = fundir([{ lente: 'codigo', rodada: 1, texto }], DIFF, { aceito: 'src/a.ts:12 aceito: provisório' })
  assert.equal(r.achados.length, 1)
})

test('o ACEITO entre crases, colchetes ou no fim da frase continua valendo', () => {
  for (const aceito of ['`src/a.ts:12` aceito', '[src/a.ts:12] aceito', 'aceito o de src/a.ts:12.', 'src/a.ts:12, aceito']) {
    const r = fundir([{ lente: 'codigo', rodada: 1, texto: CONTRATO }], DIFF, { aceito })
    assert.equal(r.achados.length, 0, aceito)
  }
})
