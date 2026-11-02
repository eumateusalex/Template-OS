// Prova do rascunho da marca (`scripts/marca/rascunho.mjs`).
//
// Por que existe: a proposta lê um rascunho completo, e montá-lo à mão era o
// maior esforço da entrevista (o teste a frio escreveu um script próprio para
// converter o hex, derivar o apoio, o lavado, o raro, o abismo e o ok, e tirar
// a "Demonstração" de cada cor). Na troca, a derivada escrita à mão ficava na
// principal de antes. O rascunho faz a conta, e a refaz quando a principal ou
// o claro mudam.
//
// Uso:  node --test scripts/marca/teste-rascunho.mjs
//
// mutação: rascunho.mjs · "const FOLGA_DO_ABISMO = 7" → "= 2" · pega em 02/11/2026
// mutação: rascunho.mjs · "ok: hexDe(ajustar(rumo(p, BRANCO, 0.3), BRANCO, [abismo], MINIMO) ?? BRANCO)" → "ok: hexDe(rumo(p, BRANCO, 0.3))" · pega em 02/11/2026
// mutação: rascunho.mjs · "rumo(c, p, 0.1)" (lavado) → "rumo(c, p, 0.9)" · pega em 02/11/2026
// mutação: rascunho.mjs · "if (doMolde || dadas.principal || dadas.claro)" → "if (true)" · pega em 02/11/2026
// mutação: rascunho.mjs · "if (doMolde || dadas.principal || dadas.claro)" → "if (doMolde)" · pega em 02/11/2026
// mutação: rascunho.mjs · "if (!dadas[nome]) final[nome] = conta[nome]" → "final[nome] = conta[nome]" · pega em 02/11/2026
// mutação: rascunho.mjs · "delete t.$extensions['template.estado']" → "" · pega em 02/11/2026
// mutação: rascunho.mjs · "t.cor.papel[nome].$description.replace(DEMONSTRACAO, '')" → sem o replace · pega em 02/11/2026
// mutação: rascunho.mjs · "if (alvo && conta[alvo] === 1 && t.cor.primitiva[alvo])" → "if (false)" · pega em 02/11/2026
// mutação: rascunho.mjs · "if (erros.length) return { tokens: null, erros }" → "" · pega em 02/11/2026
// mutação: rascunho.mjs · "process.exit(1)" (hex ruim) → sem a saída · pega em 02/11/2026
// mutação: rascunho.mjs · "base = hoje.configurada ? hoje.tokens : lerMolde(...)" → "base = lerMolde(...)" · pega em 02/11/2026

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { rascunho } from './rascunho.mjs'
import { validar, lerMolde, lerMarca } from './marca.mjs'
import { derivarMarca, razao, MINIMO } from './derivar.mjs'
import { raizCom } from './raiz-de-prova.mjs'

const SCRIPT = fileURLToPath(new URL('./rascunho.mjs', import.meta.url))
const DERIVADAS = ['apoio', 'lavado', 'raro', 'abismo', 'ok']
const papeis = (t) => validar(t).resolvido.cor.papel
const descricoes = (o, fora = []) => { for (const [k, v] of Object.entries(o)) { if (k === '$description') fora.push(v); else if (v && typeof v === 'object' && !Array.isArray(v)) descricoes(v, fora) } return fora }

test('do molde: as três cores entram, as cinco derivadas saem da conta, e o rascunho é marca configurada', () => {
  const { tokens, erros } = rascunho({ base: lerMolde().tokens, cores: { principal: '#0b4f4a', claro: '#f3eee4', acento: '#a84f17' } })
  assert.deepEqual(erros, [])
  const v = validar(tokens)
  assert.deepEqual(v.erros, [])
  const p = v.resolvido.cor.papel
  assert.deepEqual([p.principal, p.claro, p.acento], ['#0b4f4a', '#f3eee4', '#a84f17'])
  const molde = papeis(lerMolde().tokens)
  for (const nome of DERIVADAS) assert.notEqual(p[nome], molde[nome], `${nome} ficou no valor do molde`)
  assert.equal(tokens.$extensions?.['template.estado'], undefined)
  // a cor não diz mais "Demonstração"; o que a pessoa ainda responde (a letra, a forma) segue dizendo
  assert.ok(!descricoes(tokens.cor).some((d) => /Demonstração/.test(d)), 'sobrou "Demonstração" numa cor')
  assert.ok(descricoes(tokens.fonte).some((d) => /Demonstração/.test(d)), 'tirou o aviso da letra, que o rascunho não preencheu')
  // as primitivas levam o nome do papel; nenhuma do molde fica solta
  assert.deepEqual(Object.keys(tokens.cor.primitiva).filter((k) => k !== '$description').sort(), ['abismo', 'acento', 'apoio', 'claro', 'lavado', 'ok', 'principal', 'raro'])
  const r = raizCom(tokens)
  try { assert.equal(lerMarca({ raiz: r.raiz }).configurada, true) } finally { r.fora() }
})

test('as derivadas fazem o papel delas: o claro se lê no abismo com folga, o ok se lê no abismo, o lavado fica entre o claro e a principal', () => {
  const { tokens } = rascunho({ base: lerMolde().tokens, cores: { principal: '#8fd3c8', claro: '#f6f4ef', acento: '#f2c94c' } })
  const p = papeis(tokens)
  assert.ok(razao(p.claro, p.abismo) >= 7, `claro sobre o abismo: ${razao(p.claro, p.abismo)}`)
  assert.ok(razao(p.ok, p.abismo) >= MINIMO, `ok sobre o abismo: ${razao(p.ok, p.abismo)}`)
  assert.ok(razao(p.lavado, p.claro) < razao(p.principal, p.claro), 'o lavado não está entre o claro e a principal')
})

test('em 72 combinações de principal, claro e acento, cada derivada faz o papel dela e nenhuma causa erro (o que reprova é a cor escolhida, nunca a conta)', () => {
  const principais = ['#0b4f4a', '#8fd3c8', '#3b1f5c', '#e8a0b4', '#1e3a8a', '#c0392b', '#f2c94c', '#2e7d32', '#fdf0d5']
  const claros = ['#f3eee4', '#ffffff', '#f6f4ef', '#c8c8c8']
  const acentos = ['#a84f17', '#f2c94c']
  for (const principal of principais) for (const claro of claros) for (const acento of acentos) {
    const { tokens, erros } = rascunho({ base: lerMolde().tokens, cores: { principal, claro, acento } })
    assert.deepEqual(erros, [])
    const d = derivarMarca(papeis(tokens))
    const daConta = d.erros.filter((e) => new RegExp(`\\b(${DERIVADAS.join('|')})\\b`).test(e))
    const p = papeis(tokens)
    const onde = `${principal} ${claro} ${acento}`
    assert.ok(razao(p.claro, p.abismo) >= 7, `${onde}: o claro dá ${razao(p.claro, p.abismo).toFixed(2)}:1 sobre o abismo ${p.abismo}`)
    assert.ok(razao(p.ok, p.abismo) >= MINIMO, `${onde}: o ok dá ${razao(p.ok, p.abismo).toFixed(2)}:1 sobre o abismo`)
    assert.ok(razao(p.lavado, p.claro) < 1.5, `${onde}: o lavado ${p.lavado} se afasta do claro (${razao(p.lavado, p.claro).toFixed(2)}:1)`)
    assert.deepEqual(daConta, [], `${principal} ${claro} ${acento}: ${d.erros.join(' | ')}`)
  }
})

test('a troca da principal refaz as derivadas e guarda o resto; a troca só do acento guarda as derivadas; a derivada dada vence a conta', () => {
  const antes = rascunho({ base: lerMolde().tokens, cores: { principal: '#8fd3c8', claro: '#f6f4ef', acento: '#f2c94c', apoio: '#123456' } }).tokens
  antes.raio.md.$value = { value: 12, unit: 'px' }
  const pa = papeis(antes)
  const nova = rascunho({ base: antes, cores: { principal: '#4f6b4e' } }).tokens
  const pn = papeis(nova)
  assert.equal(pn.principal, '#4f6b4e')
  assert.deepEqual([pn.claro, pn.acento], [pa.claro, pa.acento])
  assert.notEqual(pn.abismo, pa.abismo, 'o abismo ficou na principal de antes')
  assert.deepEqual(nova.raio.md.$value, { value: 12, unit: 'px' })
  const soAcento = papeis(rascunho({ base: antes, cores: { acento: '#a84f17' } }).tokens)
  for (const nome of DERIVADAS) assert.equal(soAcento[nome], pa[nome], `${nome} mudou com a troca só do acento`)
  const comApoio = papeis(rascunho({ base: antes, cores: { principal: '#4f6b4e', apoio: '#123456' } }).tokens)
  assert.equal(comApoio.apoio, '#123456')
})

test('a marca com o nome dela nas primitivas: a troca escreve na primitiva do papel e guarda o nome', () => {
  const base = rascunho({ base: lerMolde().tokens, cores: { principal: '#8fd3c8', claro: '#f6f4ef', acento: '#f2c94c' } }).tokens
  base.cor.primitiva['verde-agua'] = base.cor.primitiva.principal
  delete base.cor.primitiva.principal
  base.cor.papel.principal.$value = '{cor.primitiva.verde-agua}'
  const t = rascunho({ base, cores: { principal: '#4f6b4e' } }).tokens
  assert.equal(t.cor.papel.principal.$value, '{cor.primitiva.verde-agua}')
  assert.equal(papeis(t).principal, '#4f6b4e')
})

test('o hex que não é hex volta com erro, sem rascunho', () => {
  const { tokens, erros } = rascunho({ base: lerMolde().tokens, cores: { principal: 'verde' } })
  assert.equal(tokens, null)
  assert.match(erros[0], /principal.*"verde".*não é um hex/)
})

test('a linha de comando: do molde sem marca, da marca do workspace com ela, grava a saída e diz o comando da proposta', () => {
  const pasta = mkdtempSync(join(tmpdir(), 'rascunho-'))
  const r = raizCom(null)
  try {
    const saida = join(pasta, 'r.tokens.json')
    const ok = spawnSync(process.execPath, [SCRIPT, '--raiz', r.raiz, '--principal', '#0b4f4a', '--claro', '#f3eee4', '--acento', '#a84f17', '--saida', saida], { encoding: 'utf8' })
    assert.equal(ok.status, 0, ok.stdout + ok.stderr)
    assert.equal(papeis(JSON.parse(readFileSync(saida, 'utf8'))).principal, '#0b4f4a')
    assert.match(ok.stdout, /proposta\.mjs --arquivo/)
    const comMarca = raizCom(JSON.parse(readFileSync(saida, 'utf8')))
    try {
      const troca = spawnSync(process.execPath, [SCRIPT, '--raiz', comMarca.raiz, '--acento', '#b0306a', '--saida', saida], { encoding: 'utf8' })
      assert.equal(troca.status, 0, troca.stdout + troca.stderr)
      const p = papeis(JSON.parse(readFileSync(saida, 'utf8')))
      assert.deepEqual([p.principal, p.acento], ['#0b4f4a', '#b0306a'])
    } finally { comMarca.fora() }
    const ruim = spawnSync(process.execPath, [SCRIPT, '--raiz', r.raiz, '--principal', 'xx', '--saida', join(pasta, 'ruim.json')], { encoding: 'utf8' })
    assert.equal(ruim.status, 1)
    assert.ok(!existsSync(join(pasta, 'ruim.json')))
    const semSaida = spawnSync(process.execPath, [SCRIPT, '--principal', '#0b4f4a'], { encoding: 'utf8' })
    assert.equal(semSaida.status, 2)
  } finally { r.fora(); rmSync(pasta, { recursive: true, force: true }) }
})
