// Prova da proposta da marca (`scripts/marca/proposta.mjs`).
//
// Por que existe: a cor que a pessoa escolhe pode não segurar texto, e a
// regra única troca o papel calada (o texto vai para o abismo, o destaque cai
// na cor do texto). Sem mostrar onde cada cor cai, a pessoa pede "mais
// escuro" e vê o texto clarear, sem entender por quê. A proposta mostra o
// lugar de cada cor com a medida, propõe o tom mais perto que passa ao lado do
// escolhido e compara com a marca de hoje dizendo o que clareou e o que
// escureceu.
//
// Uso:  node --test scripts/marca/teste-proposta.mjs
//
// mutação: proposta.mjs · "if (rp < FOLGA) {" → "if (false) {" · pega em 02/11/2026
// mutação: proposta.mjs · "if (ra < GRANDE) {" → "if (false) {" · pega em 02/11/2026
// mutação: proposta.mjs · "d < a ? 'mais escura' : d > a ? 'mais clara'" → "d > a ? 'mais escura' : d < a ? 'mais clara'" · pega em 02/11/2026
// mutação: proposta.mjs · "if (a !== d) mudou.push" → "if (true) mudou.push" · pega em 02/11/2026
// mutação: proposta.mjs · "if (!a || a.cor === l.cor) continue" → "if (!a) continue" · pega em 02/11/2026
// mutação: proposta.mjs · "maisPertoQuePassa(cor, 'principal', alvo, FOLGA)" → "... alvo, 7)" · pega em 02/11/2026
// mutação: proposta.mjs · "if (razao(tom, cor.claro) >= minimo && !derivarMarca({ ...cor, [nome]: tom }).erros.length)" → "if (razao(tom, cor.claro) >= minimo)" · pega em 02/11/2026
// mutação: proposta.mjs · "if (v.erros.length) return { ...vazio, erros: v.erros }" → "" · pega em 02/11/2026
// mutação: proposta.mjs · "process.exit(p.erros.length ? 1 : 0)" → "process.exit(0)" · pega em 02/11/2026
// mutação: proposta.mjs · "c.textoClaro, p.claro)" (texto-no-claro) → "p.principal, p.claro)" · pega em 02/11/2026
// mutação: proposta.mjs · "const papel = c.papelAntes && c.papelAntes !== c.papelDepois ?" → "const papel = false ?" · pega em 02/11/2026
// mutação: proposta.mjs · "amostra(x.tom, `a mais perto que passa" → "amostra(x.escolhida, `a mais perto que passa" · pega em 02/11/2026
// mutação: proposta.mjs · "if (molde.length) avisos.push" → "if (false) avisos.push" · pega em 02/11/2026
// mutação: proposta.mjs · "if (k === '$description' && /Demonstração:/.test(v))" → "if (k === '$description')" · pega em 02/11/2026
// mutação: proposta.mjs · "if (comparacao.some((c) => c.id === 'abismo') && !lugares.some(...))" → "if (false)" · pega em 02/11/2026
// mutação: proposta.mjs · "&& !lugares.some((l) => l.papel === 'abismo'))" → ")" · pega em 02/11/2026

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { proposta, textoDa, htmlDa } from './proposta.mjs'
import { razao, MINIMO, GRANDE } from './derivar.mjs'
import { lerMolde } from './marca.mjs'
import { MARCA_A, tokensDe, raizCom } from './raiz-de-prova.mjs'

const SCRIPT = fileURLToPath(new URL('./proposta.mjs', import.meta.url))
const com = (troca) => { const t = tokensDe(MARCA_A); for (const [k, v] of Object.entries(troca)) t.cor.papel[k] = { $value: v }; return t }
const lugar = (p, id) => { const l = p.lugares.find((x) => x.id === id); assert.ok(l, `sem o lugar ${id}: ${p.lugares.map((x) => x.id).join(', ')}`); return l }

test('a marca que fecha: a principal cai no texto, no fundo escuro e no botão do site, com a medida, e nada a propor para ela', () => {
  const p = proposta({ tokens: com({}) })
  assert.deepEqual(p.erros, [])
  for (const id of ['texto-no-claro', 'fundo-escuro', 'botao-do-site']) {
    const l = lugar(p, id)
    assert.equal(l.papel, 'principal', `${id} usa ${l.papel}`)
    assert.equal(l.cor, MARCA_A.principal)
    assert.ok(l.razao >= MINIMO, `${id}: ${l.razao}`)
  }
  assert.equal(p.propostas.filter((x) => x.papel === 'principal').length, 0)
  assert.match(textoDa(p), new RegExp(`${MARCA_A.principal}.*\\d,\\d+:1`))
})

test('a principal que não segura texto: diz que ela não entra em peça nenhuma, e propõe o tom mais perto que passa, ao lado', () => {
  const p = proposta({ tokens: com({ principal: '#8fd3c8' }) })
  assert.deepEqual(p.erros, [])
  for (const id of ['texto-no-claro', 'fundo-escuro', 'botao-do-site']) assert.notEqual(lugar(p, id).papel, 'principal')
  const pr = p.propostas.find((x) => x.papel === 'principal')
  assert.ok(pr, 'não propôs tom para a principal')
  assert.equal(pr.escolhida, '#8fd3c8')
  const claro = MARCA_A.claro
  const r = razao(pr.tom, claro)
  assert.ok(r >= 4.6 && r < 5.2, `o tom proposto ${pr.tom} dá ${r.toFixed(2)}:1 sobre o claro: não passa, ou passa longe do mais perto`)
  const texto = textoDa(p)
  assert.match(texto, /#8fd3c8 não entra em peça nenhuma/)
  assert.ok(texto.includes(pr.tom), 'o texto não diz o tom proposto')
  const html = htmlDa(p)
  assert.ok(html.includes('#8fd3c8') && html.includes(pr.tom), 'o HTML não põe a escolhida e o tom proposto lado a lado')
  assert.match(html, /a sua[\s\S]*a mais perto que passa/i)
})

test('o tom proposto passa de verdade: devolvido à marca, a regra inteira o aceita e não sobra proposta (o claro #f6f4ef, onde só contra o claro ele reprovava na superfície do site)', () => {
  for (const troca of [{ principal: '#8fd3c8', claro: '#f6f4ef', acento: '#f2c94c' }, { principal: '#8fd3c8' }, { acento: '#f2c94c' }, { principal: '#e8a0b4', claro: '#fbf7f2' }]) {
    const p = proposta({ tokens: com(troca) })
    assert.deepEqual(p.erros, [], JSON.stringify(troca))
    assert.ok(p.propostas.length, `${JSON.stringify(troca)}: nada proposto`)
    const aceito = Object.fromEntries(p.propostas.map((x) => [x.papel, x.tom]))
    const depois = proposta({ tokens: com({ ...troca, ...aceito }) })
    assert.deepEqual(depois.erros, [], `${JSON.stringify(troca)} com ${JSON.stringify(aceito)}: ${depois.erros.join(' | ')}`)
    assert.deepEqual(depois.propostas, [], `${JSON.stringify(troca)} com ${JSON.stringify(aceito)}: ainda propõe ${JSON.stringify(depois.propostas)}`)
  }
})

test('o acento que não se lê no claro: o destaque no claro cai na cor do texto, e o tom de acento mais perto que passa 3:1 vem ao lado', () => {
  const p = proposta({ tokens: com({ acento: '#f2c94c' }) })
  assert.deepEqual(p.erros, [])
  const l = lugar(p, 'destaque-no-claro')
  assert.notEqual(l.papel, 'acento')
  assert.equal(lugar(p, 'destaque-no-escuro').papel, 'acento')
  const pr = p.propostas.find((x) => x.papel === 'acento')
  assert.ok(pr, 'não propôs tom para o acento')
  const r = razao(pr.tom, MARCA_A.claro)
  assert.ok(r >= GRANDE && r < 3.5, `o tom proposto ${pr.tom} dá ${r.toFixed(2)}:1 sobre o claro`)
})

test('mais escura e o texto clareou: a comparação com a marca de hoje diz a direção de cada cor e por que o texto mudou de papel', () => {
  const atual = com({ principal: '#8fd3c8' })
  const nova = com({ principal: '#4f6b4e' })
  const p = proposta({ tokens: nova, atual })
  const mudou = (id) => p.comparacao.find((c) => c.id === id)
  const principal = mudou('principal')
  assert.ok(principal, 'a comparação não traz a principal')
  assert.equal(principal.direcao, 'mais escura')
  const texto = mudou('texto-no-claro')
  assert.ok(texto, 'a comparação não traz o texto sobre o claro')
  assert.equal(texto.direcao, 'mais clara')
  assert.deepEqual([texto.papelAntes, texto.papelDepois], ['abismo', 'principal'])
  const frase = textoDa(p)
  assert.match(frase, /principal: #8fd3c8 → #4f6b4e, mais escura/)
  assert.match(frase, /o texto sobre o claro: #[0-9a-f]{6} → #4f6b4e, mais clara/)
  assert.match(frase, /antes o abismo, agora a principal/)
  // o que não mudou não aparece
  assert.ok(!p.comparacao.some((c) => c.id === 'claro'), 'o claro não mudou e entrou na comparação')
  assert.ok(!p.comparacao.some((c) => c.id === 'fundo-claro'), 'o fundo claro não mudou e entrou na comparação')
})

test('o que nenhum papel resolve: a proposta reprova com o hex mais perto que passa (a mesma frase do conferir)', () => {
  const p = proposta({ tokens: com({ principal: '#8fd3c8', abismo: '#9aa0a0' }) })
  assert.ok(p.erros.length >= 1)
  assert.match(p.erros[0], /mais perto que passa é #[0-9a-f]{6}/)
  assert.match(textoDa(p), /mais perto que passa é #[0-9a-f]{6}/)
})

test('o esquema quebrado para com o erro do esquema, sem medir', () => {
  const t = com({})
  t.raio.pilula.$value = 'sim'
  const p = proposta({ tokens: t })
  assert.ok(p.erros.some((e) => /pilula/.test(e)), p.erros.join(' | '))
  assert.deepEqual(p.lugares, [])
})

test('a linha de comando: lê o rascunho, compara com a marca do workspace, grava o HTML e sai 0; com erro, sai 1', () => {
  const r = raizCom(com({ principal: '#8fd3c8' }))
  const pasta = mkdtempSync(join(tmpdir(), 'proposta-'))
  try {
    const rascunho = join(pasta, 'rascunho.tokens.json')
    const html = join(pasta, 'proposta.html')
    writeFileSync(rascunho, JSON.stringify(com({ principal: '#4f6b4e' })))
    const ok = spawnSync(process.execPath, [SCRIPT, '--arquivo', rascunho, '--raiz', r.raiz, '--html', html], { encoding: 'utf8' })
    assert.equal(ok.status, 0, ok.stdout + ok.stderr)
    assert.match(ok.stdout, /mais escura/)
    assert.ok(existsSync(html) && readFileSync(html, 'utf8').includes('#4f6b4e'), 'não gravou o HTML')
    assert.ok(ok.stdout.includes('proposta.html'), 'não disse onde está o HTML')
    writeFileSync(rascunho, JSON.stringify(com({ principal: '#8fd3c8', abismo: '#9aa0a0' })))
    const ruim = spawnSync(process.execPath, [SCRIPT, '--arquivo', rascunho, '--raiz', r.raiz, '--html', html], { encoding: 'utf8' })
    assert.equal(ruim.status, 1, ruim.stdout + ruim.stderr)
  } finally { r.fora(); rmSync(pasta, { recursive: true, force: true }) }
})

test('o molde (a demonstração) também se mostra: sem marca de hoje, sem comparação', () => {
  const p = proposta({ tokens: lerMolde().tokens })
  assert.deepEqual(p.erros, [])
  assert.deepEqual(p.comparacao, [])
  assert.ok(p.lugares.length >= 7, `só ${p.lugares.length} lugares`)
})

test('o que ainda é demonstração do molde (a letra que a pessoa não respondeu) sai num aviso, com o caminho de cada token', () => {
  const t = com({})
  const p = proposta({ tokens: t })
  const aviso = p.avisos.find((a) => /Demonstração/.test(a))
  assert.ok(aviso, `sem aviso: ${p.avisos.join(' | ')}`)
  assert.match(aviso, /fonte\.display/)
  for (const no of [t.fonte.display, t.fonte.destaque, t.fonte.mono, t.fonte.peso.forte, t.fonte.peso.medio, t.fonte.peso.mono, t.cor.primitiva, ...Object.values(t.cor.papel)]) {
    if (no && typeof no === 'object' && no.$description) no.$description = no.$description.replace(/\s*Demonstração:.*$/, '')
  }
  t.cor.papel.$description = t.cor.papel.$description ?? ''
  assert.ok(!proposta({ tokens: t }).avisos.some((a) => /Demonstração/.test(a)), 'avisou sem nada de demonstração')
})

test('o abismo trocado que nenhum lugar usa: a proposta avisa, em vez de mostrar a troca como se tivesse efeito', () => {
  const atual = com({})
  const p = proposta({ tokens: com({ abismo: '#2b1020' }), atual })
  assert.ok(p.comparacao.some((c) => c.id === 'abismo'), 'a troca do abismo não entrou na comparação')
  const aviso = p.avisos.find((a) => /abismo/.test(a) && /nenhum/.test(a))
  assert.ok(aviso, `sem aviso: ${p.avisos.join(' | ')}`)
  assert.match(aviso, /principal/)
  // quando o abismo está em uso (a principal não segura texto), não avisa
  const emUso = proposta({ tokens: com({ principal: '#8fd3c8', abismo: '#2b1020' }), atual: com({ principal: '#8fd3c8' }) })
  assert.ok(!emUso.avisos.some((a) => /abismo/.test(a) && /nenhum/.test(a)), emUso.avisos.join(' | '))
})
