// Prova da leitura da marca (`scripts/marca/marca.mjs`) e do estado único.
//
// Por que existe: "a marca está configurada?" tem uma resposta só, e toda
// superfície que lê a marca para com a mesma frase quando a resposta é não.
// Leitura duplicada descola: uma superfície acha que há marca e pinta no
// molde, outra para.
//
//   5. estado único: marca ausente, molde copiado como marca e marca com
//      esquema quebrado dão a mesma parada em cada leitor (a leitura, o
//      gerador, o guardanapo, o render do carrossel, o /novo-projeto, a peça
//      de vídeo, o Remotion e o corte); a marca configurada passa em todos
//
// Uso:  node --test scripts/marca/teste-marca.mjs

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { lerMarca, exigirMarca, paradaDe, MENSAGEM, RAIZ, validar } from './marca.mjs'
import { saidas, escrever, DESTINOS } from './gerar.mjs'
import { exigirMarcaDaPeca } from '../../.claude/skills/video/ferramentas/nova-peca.mjs'
import { escreverMarcaTs } from '../../.claude/skills/video/ferramentas/marca-remotion.mjs'
import { resolverMarca as marcaDoCorte } from '../cortes.mjs'
import { lerPaleta, exigirMarca as exigirNoGuardanapo } from '../guardanapo/tokens.mjs'
import { marcaDoWorkspace } from '../../.claude/skills/novo-projeto/esqueleto/scripts/gerar-marca.mjs'
import { MARCA_A, tokensDe, raizCom, moldeComoMarca } from './raiz-de-prova.mjs'

const RENDER = join(RAIZ, '.claude/skills/carrossel/render/render-carrossel.js')
const MODELO = join(RAIZ, '.claude/skills/carrossel/kit/modelo-carrossel.html')

const quebrada = () => { const t = tokensDe(MARCA_A); delete t.cor.papel.acento; return t }
const ESTADOS = [
  ['ausente', () => null, /falta identidade\/marca\.tokens\.json/],
  ['o molde copiado como marca', moldeComoMarca, /ainda é o molde/],
  ['esquema quebrado', quebrada, /esquema quebrado/],
  ['JSON inválido', () => '{ "cor": ', /não é JSON válido|esquema quebrado/]
]

/** Cada leitor, devolvendo a mensagem de parada ou `null` quando seguiu. */
const LEITORES = {
  'a leitura (exigirMarca)': (raiz) => { try { exigirMarca({ raiz }); return null } catch (e) { return e.message } },
  'o gerador (movimento.js e marca.css)': (raiz) => {
    const s = saidas({ raiz })
    const mov = s.get(DESTINOS.movimentoJs)
    if (!/"configurada": false/.test(mov)) return null
    return [mov.includes(MENSAGEM) ? MENSAGEM : 'movimento.js sem a frase', /ESTADO: nao-configurado/.test(s.get(DESTINOS.css)) ? '' : 'marca.css sem o estado'].join(' ')
  },
  'o guardanapo': (raiz) => { try { exigirNoGuardanapo(lerPaleta(raiz)); return null } catch (e) { return e.message } },
  'o /novo-projeto': (raiz) => { try { return marcaDoWorkspace({ raiz }) ? null : 'devolveu null (neutra)' } catch (e) { return e.message } },
  // as saídas escritas antes, como o /marca deixa: a parada tem de vir da marca, não da saída que falta
  'a peça de vídeo (nova-peca)': (raiz) => { try { escrever({ raiz }); exigirMarcaDaPeca(raiz); return null } catch (e) { return e.message } },
  'o Remotion (marca-remotion)': (raiz) => { try { escreverMarcaTs({ raiz }); return null } catch (e) { return e.message } },
  'o corte (cortes.mjs)': (raiz) => { try { escrever({ raiz }); marcaDoCorte(undefined, raiz); return null } catch (e) { return e.message } }
}

for (const [estado, tokens, motivo] of ESTADOS) {
  test(`5 · ${estado}: a mesma parada em todo leitor`, () => {
    const r = raizCom(tokens())
    try {
      const m = lerMarca({ raiz: r.raiz })
      assert.equal(m.configurada, false)
      assert.match(m.motivo, motivo)
      for (const [nome, ler] of Object.entries(LEITORES)) {
        const parada = ler(r.raiz)
        if (estado === 'ausente' && nome === 'o /novo-projeto') {
          // sem marca nenhuma, o projeto nasce neutro de propósito
          assert.equal(parada, 'devolveu null (neutra)')
          continue
        }
        assert.ok(parada, `${nome} seguiu sem marca`)
        assert.ok(parada.includes(MENSAGEM), `${nome} parou com outra frase: ${parada}`)
        if (nome !== 'o gerador (movimento.js e marca.css)') assert.ok(parada.includes(paradaDe(m.motivo)), `${nome} não disse o motivo: ${parada}`)
      }
    } finally { r.fora() }
  })
}

test('5 · a marca configurada passa em todo leitor', () => {
  const r = raizCom(tokensDe(MARCA_A))
  try {
    assert.equal(lerMarca({ raiz: r.raiz }).configurada, true)
    for (const [nome, ler] of Object.entries(LEITORES)) assert.equal(ler(r.raiz), null, `${nome} parou com a marca configurada`)
  } finally { r.fora() }
})

test('5 · o render do carrossel para com a mesma frase (e só renderiza no molde com --demo)', (t) => {
  if (!existsSync(join(RAIZ, '.claude/skills/carrossel/render/node_modules/playwright'))) return t.skip('sem o Playwright do render instalado (npm ci em .claude/skills/carrossel/render)')
  for (const [estado, tokens] of ESTADOS) {
    const r = raizCom(tokens())
    try {
      const m = lerMarca({ raiz: r.raiz })
      const p = spawnSync(process.execPath, [RENDER, MODELO, join(r.raiz, 'saida')], { encoding: 'utf8', env: { ...process.env, MARCA_RAIZ: r.raiz } })
      assert.equal(p.status, 1, `${estado}: saiu ${p.status} (${(p.stdout + p.stderr).slice(-200)})`)
      assert.ok(p.stderr.includes(paradaDe(m.motivo)), `${estado}: ${p.stderr.slice(-300)}`)
    } finally { r.fora() }
  }
})

test('o esquema: o molde passa, e cada erro diz onde', () => {
  assert.deepEqual(validar(tokensDe(MARCA_A)).erros, [])
  const t = tokensDe(MARCA_A)
  t.raio.md = { $value: { value: 'dez', unit: 'px' } }
  assert.ok(validar(t).erros.some((e) => e.startsWith('raio.md')), validar(t).erros.join(' | '))
})
