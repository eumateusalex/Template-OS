// node --test .claude/skills/fabrica/scripts/testes/teste-provar-mutacoes.mjs
//
// Classe de defeito: a prova das mutações que estoura o teto de quem a chama e
// segue viva, mutando a fonte: o runner mata o shell, o `provar-mutacoes`
// órfão continua (meia hora, medido), e no meio dele os outros casos rodam
// contra uma fonte mutada.
//
// A régua: com `--prazo`, o provador para ENTRE uma mutação e outra, antes de
// começar uma que não caberia, e sai 1 dizendo quantas mediu. Matar a árvore de
// processos no estouro seria pior: o provador morto no meio de uma mutação
// deixa a fonte mutada de vez.
//
// 🚨 O provador roda numa CÓPIA da skill, com git próprio. Na fonte, com o
// `--prazo` ignorado, o provador sairia mutando, o teto do teste o mataria no
// meio de uma mutação, e conferidores ficariam mutados na árvore.
// mutação: scripts/provar-mutacoes.mjs · "  return prazoMs === null || gastoMs + maiorMs < prazoMs" → "  return prazoMs === null || gastoMs < prazoMs" · pega
// mutação: scripts/provar-mutacoes.mjs · "  if (!/^\d+$/.test(valor ?? '')) return { erro:" → "  if (false) return { erro:" · pega
// mutação: scripts/provar-mutacoes.mjs · "      if (!cabeMaisUma({ prazoMs, gastoMs: Date.now() - inicio, maiorMs })) {" → "      if (false) {" · pega

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync } from 'node:fs'
import { join, dirname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { criar, apagar } from '../../kit/lib/temporaria.mjs'
import { cabeMaisUma, lerPrazo } from '../provar-mutacoes.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const SKILL = resolve(AQUI, '..', '..')

/** Uma cópia da skill em `<tmp>/.claude/skills/fabrica`, commitada, que é a posição que o provador espera. */
function copiaDaSkill () {
  const raiz = criar('fabrica-provador-')
  const destino = join(raiz, '.claude', 'skills', 'fabrica')
  cpSync(SKILL, destino, { recursive: true, filter: (origem) => !origem.split(sep).includes('node_modules') })
  const git = (...args) => spawnSync('git', ['-c', 'user.name=fabrica', '-c', 'user.email=f@f', ...args], { cwd: raiz, encoding: 'utf8' })
  git('init', '-q')
  git('add', '-A')
  git('commit', '-q', '-m', 'copia', '--no-verify')
  return { raiz, provador: join(destino, 'scripts', 'provar-mutacoes.mjs'), estado: () => git('status', '--porcelain').stdout }
}

test('a conta do prazo: a próxima só começa se o gasto mais a MAIOR duração já vista cabem', () => {
  assert.equal(cabeMaisUma({ prazoMs: null, gastoMs: 10 ** 9, maiorMs: 10 ** 9 }), true, 'sem prazo, sempre cabe')
  assert.equal(cabeMaisUma({ prazoMs: 10000, gastoMs: 4000, maiorMs: 5000 }), true)
  assert.equal(cabeMaisUma({ prazoMs: 10000, gastoMs: 6000, maiorMs: 5000 }), false, 'a próxima passaria do prazo')
  assert.equal(cabeMaisUma({ prazoMs: 0, gastoMs: 0, maiorMs: 0 }), false, 'prazo zero não começa nenhuma')
  assert.deepEqual(lerPrazo(['--prazo', '30']), { prazoMs: 30000 })
  assert.deepEqual(lerPrazo([]), { prazoMs: null })
})

test('prazo zero para antes da primeira mutação, sai 1 com a contagem, e a fonte fica como estava', () => {
  const copia = copiaDaSkill()
  try {
    const r = spawnSync(process.execPath, [copia.provador, '--prazo', '0'], { encoding: 'utf8', timeout: 120000 })
    const saida = `${r.stdout}${r.stderr}`
    assert.equal(r.status, 1, saida.slice(-600))
    assert.match(saida, /parou no prazo de 0 s: 0 de (\d+) mutações medidas/, saida.slice(-600))
    assert.doesNotMatch(saida, /mutação pega/, 'rodou mutação com prazo zero')
    assert.equal(copia.estado(), '', 'o provador mexeu na fonte')
  } finally { apagar(copia.raiz) }
})

test('prazo que não é número inteiro de segundos sai 2, com o uso', () => {
  const copia = copiaDaSkill()
  try {
    for (const args of [['--prazo', 'abc'], ['--prazo', '-5'], ['--prazo', '1.5'], ['--prazo']]) {
      const r = spawnSync(process.execPath, [copia.provador, ...args], { encoding: 'utf8', timeout: 120000 })
      assert.equal(r.status, 2, `${args.join(' ')}: ${`${r.stdout}${r.stderr}`.slice(-400)}`)
      assert.match(`${r.stdout}${r.stderr}`, /uso:/)
    }
    assert.equal(copia.estado(), '', 'o provador mexeu na fonte')
  } finally { apagar(copia.raiz) }
})
