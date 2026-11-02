// Prova da régua da marca (`scripts/marca/conferir.mjs`).
//
// Por que existe: o contrato das superfícies é "nenhuma cor ou curva à mão no
// molde". Um hex plantado num molde quebra a troca num lugar só, calado: a
// marca muda e aquela peça fica na cor velha.
//
//   3. valor à mão: um hex, um rgb ou um cubic-bezier plantado num molde de
//      superfície reprova com o arquivo e a linha; o marcador `tecnico` na
//      linha isenta; hoje nenhum molde do workspace tem valor à mão; as
//      superfícies do vídeo reprovam como as outras, e a curva espalhada do
//      MOVIMENTO (Easing.bezier(...)) não é valor à mão
//   6. projeto velho: o site que foi gerado na marca do workspace e ficou nas
//      cores ou na forma (raios, pílula, destaque, mono) de antes da troca
//      avisa com o comando; o em dia e o de marca própria ficam calados
//   e a marca contra as próprias recusas (curva que quica com bounce
//   recusado, pílula permitida e recusada ao mesmo tempo)
//
// Uso:  node --test scripts/marca/teste-conferir.mjs
// mutação: scripts/marca/conferir.mjs · "      if (MARCADOR.test(l)) return" → "      return" · pega em 01/01/2000
// mutação: scripts/marca/conferir.mjs · a linha do modelo.html sai de SUPERFICIES · pega em 01/01/2000
// mutação: scripts/marca/conferir.mjs · a linha do falado-extra.mjs sai de SUPERFICIES · pega em 01/01/2000
// mutação: scripts/marca/conferir.mjs · "Easing\.bezier\(\s*-?\.?\d" → "Easing\.bezier\(\s*[-.\d]" · pega em 01/01/2000
// mutação: scripts/marca/conferir.mjs · "if (nome === 'o molde' && m.configurada) continue" → "if (false) continue" · pega em 01/01/2000
// mutação: scripts/marca/conferir.mjs · "      if (Object.keys(antes).some(" → "      if (false && Object.keys(antes).some(" · pega em 02/11/2026
// mutação: scripts/marca/conferir.mjs · "const CABECALHO_DO_PROJETO = /da marca do workspace" → "const CABECALHO_DO_PROJETO = /" · pega em 02/11/2026
// mutação: scripts/marca/conferir.mjs · "const daForma = Boolean(formaDeHoje && forma && forma !== formaDeHoje)" → "const daForma = false" · pega em 02/11/2026

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { conferir, valoresAMao, contraRecusas, SUPERFICIES } from './conferir.mjs'
import { escrever } from './gerar.mjs'
import { RAIZ, validar, lerMolde } from './marca.mjs'
import { derivarMarca } from './derivar.mjs'
import { MARCA_A, MARCA_B, tokensDe, raizCom } from './raiz-de-prova.mjs'
import { escreverMarca, marcaDoWorkspace } from '../../.claude/skills/novo-projeto/esqueleto/scripts/gerar-marca.mjs'

const MOLDES = [
  '.claude/skills/carrossel/kit/componentes.css',
  '.claude/skills/novo-projeto/esqueleto/scripts/gerar-marca.mjs',
  'scripts/guardanapo/tokens.mjs'
]

/** Uma raiz com a marca A escrita e cópias dos moldes reais. */
function raizComMoldes () {
  const r = raizCom(tokensDe(MARCA_A))
  for (const rel of MOLDES) {
    mkdirSync(dirname(join(r.raiz, rel)), { recursive: true })
    copyFileSync(join(RAIZ, rel), join(r.raiz, rel))
  }
  escrever({ raiz: r.raiz })
  return r
}
const plantar = (raiz, rel, linha) => writeFileSync(join(raiz, rel), readFileSync(join(raiz, rel), 'utf8') + `\n${linha}\n`)
const linhas = (raiz, rel) => readFileSync(join(raiz, rel), 'utf8').split('\n').length

// As opções da marca do workspace com as fontes pelo nome, sem baixar do
// Google Fonts: a forma (que diz o nome e o estilo) é a mesma.
function opcoesSemRede (raiz) {
  const ws = marcaDoWorkspace({ raiz })
  const peloNome = (f) => ({ tipo: 'sistema', familia: [f.nome ?? f.familia[0]], estilo: f.estilo })
  return { ...ws, fonte: { tipo: 'sistema' }, destaque: peloNome(ws.destaque), mono: peloNome(ws.mono), daMarca: true, aviso: () => {} }
}

test('6 · o projeto que foi gerado na marca do workspace e ficou na cor de antes: aviso com o comando que leva a troca; o em dia e o de marca própria, calados', () => {
  const r = raizComMoldes()
  try {
    const site = join(r.raiz, 'projetos-pessoais', 'site')
    const proprio = join(r.raiz, 'projetos-pessoais', 'proprio')
    assert.equal(escreverMarca(site, opcoesSemRede(r.raiz)), 0)
    assert.equal(escreverMarca(proprio, { cores: { primaria: '#1d3557', fundo: '#ffffff', texto: '#111111' }, fonte: { tipo: 'sistema' }, aviso: () => {} }), 0)
    const dosProjetos = () => conferir({ raiz: r.raiz }).avisos.filter((a) => a.includes('projetos-pessoais/'))
    assert.deepEqual(dosProjetos(), [], 'o site em dia e o de marca própria não avisam')
    writeFileSync(join(r.raiz, 'identidade', 'marca.tokens.json'), JSON.stringify(tokensDe(MARCA_B)))
    escrever({ raiz: r.raiz })
    const avisos = dosProjetos()
    assert.equal(avisos.length, 1, avisos.join(' | '))
    assert.match(avisos[0], /projetos-pessoais\/site\b/)
    assert.match(avisos[0], /gerar-marca\.mjs --alvo projetos-pessoais\/site --refazer/)
    assert.match(avisos[0], new RegExp(marcaDoWorkspace({ raiz: r.raiz }).cores.primaria))
  } finally { r.fora() }
})

test('6 · a troca só da forma (o botão em pílula, o destaque) também avisa o projeto que ficou para trás, dizendo a forma de antes e a de hoje', () => {
  const r = raizComMoldes()
  try {
    const site = join(r.raiz, 'projetos-pessoais', 'site')
    assert.equal(escreverMarca(site, opcoesSemRede(r.raiz)), 0)
    const dosProjetos = () => conferir({ raiz: r.raiz }).avisos.filter((a) => a.includes('projetos-pessoais/'))
    assert.deepEqual(dosProjetos(), [])
    const t = tokensDe(MARCA_A)
    t.raio.pilula.$value = true
    t.recusas.$value = t.recusas.$value.filter((x) => x !== 'pilula')
    writeFileSync(join(r.raiz, 'identidade', 'marca.tokens.json'), JSON.stringify(t))
    escrever({ raiz: r.raiz })
    const avisos = dosProjetos()
    assert.equal(avisos.length, 1, avisos.join(' | '))
    assert.match(avisos[0], /ficou na forma "[^"]*no raio do componente[^"]*" \(hoje "[^"]*em pílula[^"]*"\)/)
    assert.match(avisos[0], /--alvo projetos-pessoais\/site --refazer/)
    // e o --refazer leva a troca: o aviso some
    assert.equal(escreverMarca(site, { ...opcoesSemRede(r.raiz), refazer: true }), 0)
    assert.deepEqual(dosProjetos(), [])
  } finally { r.fora() }
})

test('3 · hoje nenhum molde de superfície do workspace tem cor ou curva à mão', () => {
  assert.deepEqual(valoresAMao(RAIZ, SUPERFICIES), [])
})

test('3 · os moldes copiados e a marca escrita: a régua passa', () => {
  const r = raizComMoldes()
  try {
    assert.deepEqual(conferir({ raiz: r.raiz }).erros, [])
  } finally { r.fora() }
})

test('2 · com a marca configurada, o aviso de contraste do molde não sobe (ele existe no molde de hoje)', () => {
  const r = raizComMoldes()
  try {
    assert.ok(derivarMarca(lerMolde().resolvido.cor.papel).avisos.length > 0, 'o molde de hoje precisa ter aviso, ou o caso não prova nada')
    const { avisos } = conferir({ raiz: r.raiz })
    assert.deepEqual(avisos.filter((a) => a.includes('(o molde)')), [])
  } finally { r.fora() }
})

test('3 · um hex plantado num molde reprova com o arquivo e a linha', () => {
  const r = raizComMoldes()
  try {
    const rel = MOLDES[0]
    plantar(r.raiz, rel, '.x { color: #ff3366; }')
    const n = linhas(r.raiz, rel) - 1
    const erros = conferir({ raiz: r.raiz }).erros
    assert.ok(erros.some((e) => e.includes(`${rel}:${n}`) && /cor hex \(#ff3366\)/.test(e)), erros.join(' | '))
  } finally { r.fora() }
})

test('3 · rgb e cubic-bezier plantados também reprovam; o marcador tecnico isenta a linha', () => {
  const r = raizComMoldes()
  try {
    plantar(r.raiz, MOLDES[1], "const curva = 'cubic-bezier(0.1, 0.7, 0.2, 1)'")
    plantar(r.raiz, MOLDES[2], "const borda = 'rgb(10, 20, 30)'")
    plantar(r.raiz, MOLDES[0], '.y { color: #000000; } /* tecnico: contorno de legenda */')
    const achados = valoresAMao(r.raiz, MOLDES)
    assert.deepEqual(achados.map((a) => [a.arquivo, a.tipo]).sort(), [[MOLDES[1], 'curva cubic-bezier'], [MOLDES[2], 'cor rgb']].sort())
  } finally { r.fora() }
})

const VIDEO = [
  '.claude/skills/video/ferramentas/modelo.html',
  '.claude/skills/video/ferramentas/capa.mjs',
  '.claude/video/src/molde/',
  '.claude/skills/mograph/ferramentas/falado.js',
  '.claude/skills/mograph/ferramentas/falado-extra.mjs'
]

test('3 · as superfícies do vídeo reprovam como as outras (não ficam em aviso)', () => {
  for (const s of VIDEO) assert.ok(SUPERFICIES.includes(s), `${s} fora de SUPERFICIES`)
})

test('3 · um hex plantado no falado-extra reprova; a curva espalhada do MOVIMENTO passa e a numérica reprova', () => {
  const r = raizComMoldes()
  try {
    const extra = '.claude/skills/mograph/ferramentas/falado-extra.mjs'
    const molde = '.claude/video/src/molde/Molde.tsx'
    for (const rel of [extra, molde]) {
      mkdirSync(dirname(join(r.raiz, rel)), { recursive: true })
      copyFileSync(join(RAIZ, rel), join(r.raiz, rel))
    }
    assert.deepEqual(conferir({ raiz: r.raiz }).erros, [], 'as cópias de hoje passam')
    plantar(r.raiz, extra, "const tinta = '#1a1a1a'")
    plantar(r.raiz, molde, 'const certa = Easing.bezier(...MOVIMENTO.curva.principal)')
    plantar(r.raiz, molde, 'const errada = Easing.bezier(0.2, 0.65, 0.2, 1)')
    const erros = conferir({ raiz: r.raiz }).erros
    assert.ok(erros.some((e) => e.includes(`${extra}:`) && /cor hex \(#1a1a1a\)/.test(e)), erros.join(' | '))
    const doMolde = erros.filter((e) => e.includes(`${molde}:`))
    assert.equal(doMolde.length, 1, doMolde.join(' | '))
    assert.match(doMolde[0], new RegExp(`${molde}:${linhas(r.raiz, molde) - 1} `))
  } finally { r.fora() }
})

test('a curva que passa do destino reprova com bounce ou elastic recusado, e passa sem a recusa', () => {
  const t = tokensDe({ ...MARCA_A, curva: [0.34, 1.56, 0.64, 1] })
  const { resolvido } = validar(t)
  assert.ok(contraRecusas({ ...resolvido, recusas: ['bounce'] }).some((e) => /quica|passa do destino/.test(e)))
  assert.deepEqual(contraRecusas({ ...resolvido, recusas: [] }), [])
})

test('pílula permitida e recusada ao mesmo tempo é esquema quebrado', () => {
  const t = tokensDe(MARCA_A)
  t.raio.pilula.$value = true
  t.recusas.$value = ['pilula']
  assert.ok(validar(t).erros.some((e) => /pilula/.test(e)))
})
