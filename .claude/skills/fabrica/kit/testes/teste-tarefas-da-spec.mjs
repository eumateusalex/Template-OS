// node --test .claude/skills/fabrica/kit/testes/teste-tarefas-da-spec.mjs
//
// Classe de defeito: leitor de `tasks.md` que confunde fase, marca ou caminho.
// Ele é a base do conferidor `specs`, e conferidor que lê errado acusa a coisa
// errada, que é o defeito do guarda cego.
//
// mutação: kit/lib/tarefas-da-spec.mjs · "fase: faseAtual" → "fase: 'sempre a mesma'" · pega

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { lerTarefas, caminhosDe } from '../lib/tarefas-da-spec.mjs'

const EXEMPLO = [
  '# Tasks: exemplo',
  '',
  '## Phase 1: Começo',
  '',
  '- [x] T001 teste: `testes/a.test.ts` cobre o caso',
  '- [x] T002 código: `src/a.ts`',
  '',
  '## Phase 2: Miolo',
  '',
  '- [ ] T010 [M] [P] teste: `testes/b.test.ts`',
  '- [ ] T011 [M] código: `src/seguranca/b.ts`',
  '- [ ] T012 bloqueado: espera gesto de outra sessão',
  ''
].join('\n')

test('lerTarefas acha todas as tarefas, na ordem', () => {
  const t = lerTarefas(EXEMPLO)
  assert.equal(t.length, 5)
  assert.deepEqual(t.map((x) => x.id), ['T001', 'T002', 'T010', 'T011', 'T012'])
})

test('lerTarefas sabe o que está feito e o que está aberto', () => {
  const t = lerTarefas(EXEMPLO)
  assert.equal(t[0].feito, true)
  assert.equal(t[2].feito, false)
})

test('lerTarefas guarda a FASE de cada tarefa', () => {
  const t = lerTarefas(EXEMPLO)
  assert.equal(t[0].fase, 'Phase 1: Começo')
  assert.equal(t[3].fase, 'Phase 2: Miolo')
  assert.notEqual(t[0].fase, t[3].fase, 'fases diferentes não podem virar a mesma')
})

test('lerTarefas lê as marcas [M] e [P]', () => {
  const t = lerTarefas(EXEMPLO)
  assert.equal(t[0].mutacao, false)
  assert.equal(t[3].mutacao, true)
  assert.equal(t[2].paralela, true)
  assert.equal(t[3].paralela, false)
})

test('lerTarefas guarda a linha, para o achado ter endereço', () => {
  const t = lerTarefas(EXEMPLO)
  assert.equal(t[0].linha, 5)
})

test('caminhosDe pega o que está entre crases', () => {
  assert.deepEqual(caminhosDe('teste: `testes/a.test.ts` cobre o caso'), ['testes/a.test.ts'])
  assert.deepEqual(caminhosDe('mexe em `src/a.ts` e `src/b.ts`'), ['src/a.ts', 'src/b.ts'])
})

test('caminhosDe ignora crase que não é caminho', () => {
  assert.deepEqual(caminhosDe('roda `npm run portao` antes'), [])
})

test('caminhosDe devolve vazio quando não há caminho', () => {
  assert.deepEqual(caminhosDe('só prosa aqui'), [])
})

test('tarefa sem id não entra', () => {
  const t = lerTarefas('## Phase 1: x\n\n- [ ] sem id nenhum\n')
  assert.equal(t.length, 0)
})

test('texto sem fase declarada devolve fase vazia, nunca inventada', () => {
  const t = lerTarefas('- [ ] T001 código: `src/a.ts`\n')
  assert.equal(t.length, 1)
  assert.equal(t[0].fase, '')
})
