// Prova da regra única de derivação (`scripts/marca/derivar.mjs`).
//
// Por que existe: o contraste da marca se decide num lugar só, e todas as
// superfícies leem dele. A regra aceita toda saída que a entrevista oferece
// (o texto usa o papel que passa; o acento cai na cor de texto do fundo onde
// não se lê) e só reprova o que nenhum papel resolve, com o hex mais perto que
// passa. Uma regra errada aqui pinta texto ilegível em toda peça.
//
//   2. contraste: cada caminho da regra, e os papéis de interface passam em
//      4,5:1 numa grade de cores
//
// Uso:  node --test scripts/marca/teste-derivar.mjs
//
// mutação: scripts/marca/derivar.mjs · "if (acentoEscuro !== p.claro && razao(acentoEscuro, fundoEscuro) < FOTO) {" → "if (false) {" · pega em 01/01/2000
// mutação: scripts/marca/derivar.mjs · "export const FOTO = 7" → "export const FOTO = 3" · pega em 01/01/2000
// mutação: scripts/marca/derivar.mjs · ":1 sobre o fundo e ${texto2(razao(ajustado, fundos[1]))}:1 sobre a superfície)" → ":1)" · pega em 01/01/2000
// mutação: scripts/marca/derivar.mjs · "  while (c < 100 && !passa(c / 100)) c++" → "  while (false) c++" · pega em 02/11/2026
// mutação: scripts/marca/derivar.mjs · "${opacidade(desenho)} → ${opacidade(r.alfa)}" → "X" · pega em 02/11/2026
// mutação: scripts/marca/derivar.mjs · "escuro ? [fundoEscuro, p.abismo] : [p.claro, p.lavado]" → "escuro ? [fundoEscuro] : [p.claro]" · pega em 02/11/2026

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { derivarMarca, derivarInterface, derivarAcento, razao, sobre, MINIMO, GRANDE, hexDe, rgbDe, TEXTO_TRANSLUCIDO } from './derivar.mjs'
import { lerMolde } from './marca.mjs'
import { conferir } from './conferir.mjs'
import { MARCA_A, tokensDe, raizCom } from './raiz-de-prova.mjs'

const BASE = Object.freeze({ ...lerMolde().resolvido.cor.papel })
const com = (troca) => derivarMarca({ ...BASE, ...troca })
const sugestaoDe = (erro) => /(?:a|o) (?:principal|acento|abismo) mais perto que passa(?: no claro)? é (#[0-9a-f]{6})/.exec(erro)?.[1]

test('o molde passa sem erro: o texto sobre o claro é a principal', () => {
  const d = com({})
  assert.deepEqual(d.erros, [])
  assert.equal(d.carrossel.textoClaro, BASE.principal)
  assert.equal(d.carrossel.fundoEscuro, BASE.principal)
})

test('principal clara: o texto sobre o claro usa o abismo, com aviso, sem reprovar', () => {
  const d = com({ principal: '#8fd3c8' })
  assert.deepEqual(d.erros, [])
  assert.equal(d.carrossel.textoClaro, BASE.abismo)
  assert.equal(d.carrossel.fundoEscuro, BASE.abismo)
  assert.ok(d.avisos.some((a) => /usa o abismo/.test(a)), d.avisos.join(' | '))
})

test('nenhum papel passa sobre o claro: reprova, e o hex sugerido passa de verdade', () => {
  const d = com({ principal: '#8fd3c8', abismo: '#9aa0a0' })
  assert.ok(d.erros.length >= 1, 'não reprovou')
  assert.match(d.erros[0], /sobre o claro/)
  const hex = sugestaoDe(d.erros[0])
  assert.ok(hex, `o erro não diz o hex mais perto: ${d.erros[0]}`)
  assert.ok(razao(hex, BASE.claro) >= MINIMO, `a sugestão ${hex} não passa sobre o claro`)
  assert.match(d.erros[0], /\d,\d+:1|4,5:1/)
})

test('acento que só se lê no escuro: no claro o destaque cai na cor do texto', () => {
  const d = com({ acento: '#f2c94c' })
  assert.deepEqual(d.erros, [])
  assert.equal(d.carrossel.acentoClaro, d.carrossel.textoClaro)
  assert.equal(d.carrossel.acentoEscuro, '#f2c94c')
  assert.equal(d.guardanapo.destaque, d.carrossel.textoClaro)
})

test('acento que não se lê em fundo nenhum: reprova, com a sugestão que passa 3:1 no claro', () => {
  const d = com({ acento: '#909090', principal: '#5a5a5a', abismo: '#1a1a1a' })
  const erro = d.erros.find((e) => /o acento/.test(e))
  assert.ok(erro, d.erros.join(' | ') || 'não reprovou')
  const hex = sugestaoDe(erro)
  assert.ok(hex && razao(hex, BASE.claro) >= GRANDE, `a sugestão ${hex} não passa 3:1`)
})

test('claro que não se lê no abismo: reprova', () => {
  const d = com({ abismo: '#c8c8c8', principal: '#1c1c20' })
  assert.ok(d.erros.some((e) => /abismo/.test(e)), d.erros.join(' | ') || 'não reprovou')
})

test('papel que falta é erro, nunca preto calado', () => {
  const { acento, ...sem } = BASE
  assert.ok(derivarMarca(sem).erros.some((e) => /acento/.test(e)))
})

test('os papéis de interface passam em 4,5:1 sobre o fundo e a superfície, numa grade de cores', () => {
  const fundos = ['#ffffff', '#f7f3ea', '#eef4f8']
  let medidas = 0
  for (let h = 0; h < 360; h += 30) {
    for (const fundo of fundos) {
      const primaria = hexDe(hsl(h, 70, 26))
      const r = derivarInterface({ primaria, fundo, texto: '#18181b' })
      assert.ok(r.ok, `${primaria} sobre ${fundo}: ${r.erros?.join(' | ')}`)
      const c = Object.fromEntries(Object.entries(r.cores).map(([k, v]) => [k, hexDe(v)]))
      for (const [frente, atras] of [['texto', 'fundo'], ['texto', 'superficie'], ['apagado', 'fundo'], ['apagado', 'superficie'], ['erro', 'fundo'], ['primaria', 'fundo'], ['texto-escuro', 'fundo-escuro'], ['apagado-escuro', 'fundo-escuro'], ['primaria-escuro', 'fundo-escuro']]) {
        assert.ok(razao(c[frente], c[atras]) >= MINIMO, `${frente} sobre ${atras} = ${razao(c[frente], c[atras]).toFixed(2)} com a primária ${primaria} e o fundo ${fundo}`)
        medidas += 1
      }
    }
  }
  assert.ok(medidas >= 300, `só ${medidas} pares medidos`)
})

test('a régua da marca reprova o contraste que nenhum papel resolve, e deixa passar a marca que fecha', () => {
  const boa = raizCom(tokensDe(MARCA_A))
  const t = tokensDe(MARCA_A)
  t.cor.papel.principal = { $value: '#8fd3c8' }
  t.cor.papel.abismo = { $value: '#9aa0a0' }
  const ruim = raizCom(t)
  try {
    assert.deepEqual(conferir({ raiz: boa.raiz }).erros.filter((e) => /contraste/.test(e)), [])
    assert.ok(conferir({ raiz: ruim.raiz }).erros.some((e) => /^contraste \(a marca\)/.test(e)))
  } finally { boa.fora(); ruim.fora() }
})

function hsl (h, s, l) {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100)
  const f = (n) => { const k = (n + h / 30) % 12; return Math.round((l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255) }
  return { r: f(0), g: f(8), b: f(4), a: 1 }
}

test('o acento que troca de tom no site diz as duas medidas, a folga e quanto o tom novo dá, e o tom novo passa', () => {
  const cores = derivarInterface({ primaria: '#1f3a5f', fundo: '#f6f1e9', texto: '#1f3a5f' }).cores
  // 4,51:1 no fundo passa os 4,5:1, mas não a folga nem a superfície: o aviso não pode dizer "o mais perto que passa 4,5:1"
  const { acento, avisos } = derivarAcento(cores, '#b5502a')
  assert.equal(avisos.length, 1)
  const [aviso] = avisos
  assert.match(aviso, /dá 4,51:1 sobre o fundo #f6f1e9 e [\d,]+:1 sobre a superfície #[0-9a-f]{6}/)
  assert.match(aviso, /folga de 4,6:1/)
  const novo = /usa (#[0-9a-f]{6})[^(]*\(([\d,]+):1 sobre o fundo e ([\d,]+):1 sobre a superfície\)/.exec(aviso)
  assert.ok(novo, aviso)
  assert.equal(novo[1], hexDe(acento))
  const fundos = [cores.fundo, cores.superficie].map(rgbDe)
  const duas = (n) => String(Math.round(n * 100) / 100).replace('.', ',')
  assert.ok(Math.min(...fundos.map((f) => razao(acento, f))) >= 4.6, 'o tom novo não passa a folga')
  assert.deepEqual([novo[2], novo[3]], fundos.map((f) => duas(razao(acento, f))))
})

test('o texto translúcido da demonstração não muda: no molde o texto corrido já passa na opacidade do kit', () => {
  const d = com({})
  for (const [t, [desenho, minimo]] of Object.entries(TEXTO_TRANSLUCIDO)) {
    if (minimo === MINIMO) assert.equal(d.carrossel.alfas[t], desenho, `--${t} mudou no molde`)
    else assert.ok(d.carrossel.alfas[t] >= desenho, `--${t} desceu no molde`)
  }
})

test('o texto translúcido que não passa sobe só o necessário, e diz no aviso', () => {
  const d = com({ principal: '#4f6b4e', claro: '#f6f3ec', acento: '#b5643c' })
  assert.deepEqual(d.erros, [])
  const a = d.carrossel.alfas['on-light-72']
  assert.ok(a > 0.72 && a < 1, `on-light-72 foi a ${a}`)
  const passa = (x) => [d.papeis.claro, d.papeis.lavado].every((f) => razao(sobre({ ...rgbDe(d.carrossel.textoClaro), a: x }, f), f) >= MINIMO)
  assert.ok(passa(a), 'a opacidade nova não passa')
  assert.ok(!passa(Math.round(a * 100 - 1) / 100), 'a opacidade subiu mais do que o necessário')
  assert.ok(d.avisos.some((x) => /opacidade/.test(x) && /on-light-72 \.72 → \.\d\d/.test(x)), d.avisos.join(' | '))
})

test('o acento que passa no escuro chapado mas não se lê sobre foto: na capa, na foto e na imagem cheia o destaque é o claro', () => {
  // a marca da conferência a frio: o acento dá 3,09:1 sobre o fundo escuro, e sobre a foto clara da capa, 1,31:1
  const d = com({ principal: '#2b2d42', claro: '#f4f1ea', acento: '#d1495b' })
  assert.deepEqual(d.erros, [])
  assert.equal(d.carrossel.acentoEscuro, '#d1495b', 'no escuro chapado o acento passa 3:1 e fica')
  assert.equal(d.carrossel.acentoFoto, '#f4f1ea')
  assert.ok(d.avisos.some((a) => /abaixo dos 7:1 que a foto pede/.test(a) && /usa o claro #f4f1ea/.test(a)), d.avisos.join(' | '))
  // e o acento claro (como o amarelo) passa os 7:1 e fica na foto
  const amarelo = com({ acento: '#f2c94c' })
  assert.ok(razao(amarelo.carrossel.acentoEscuro, amarelo.carrossel.fundoEscuro) >= 7)
  assert.equal(amarelo.carrossel.acentoFoto, '#f2c94c')
})
