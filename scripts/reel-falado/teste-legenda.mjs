// O planejador da legenda em duas vozes (legenda-duas-vozes.mjs), sobre a fala real de um Reel
// sintética (as 30 palavras em fixtures/fala-sintetica.json). Cada caso planta o
// defeito que a régua existe para pegar. Entra no portão pelo teste-montar.mjs, que o importa.
//
//   node --test scripts/reel-falado/teste-legenda.mjs

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import { lerFrase, planejarLegenda, Q } from './legenda-duas-vozes.mjs'

const fala = JSON.parse(readFileSync(new URL('./fixtures/fala-sintetica.json', import.meta.url), 'utf8'))
const reel = { largura: 1080, altura: 1920, topo: 220, base: 1540, lateral: 65 }
const anuncio = { largura: 1080, altura: 1920, topo: 270, base: 1248, lateral: 65 }
const planoMedio = { cabelo_y: 260, queixo_y: 700 } // a cabeça no terço de cima
const perto = { cabelo_y: 560, queixo_y: 1418 } // a gravação de perto, queixo a 1418 depois do punch
const FRASES = ['você está [perdendo]', 'o [site] sobre 3 %', 'e acha que está [protegido]', 'em relação à sua contabilidade', '[atenção]']
const erroDe = (fn) => { try { fn(); return '' } catch (e) { return e.message } }

const r = planejarLegenda(FRASES, fala, { rosto: planoMedio, formato: reel })
const de = (txt, plano = r) => plano.itens.find((i) => i.txt === txt)

test('a chave entra no quadro em que é dita ("perdendo" aos 0,4 s)', () => {
  assert.equal(de('perdendo').voz, 'chave')
  assert.ok(Math.abs(de('perdendo').entra - 0.4) < Q / 2, `entra aos ${de('perdendo').entra} s`)
})

test('o apoio entra 1 quadro antes da palavra', () => {
  assert.ok(Math.abs(de('você').entra - (0 - Q)) < 1e-3, `"você" aos ${de('você').entra} s`)
  assert.ok(Math.abs(de('acha').entra - (2.34 - Q)) < 1e-3, `"acha" aos ${de('acha').entra} s`)
})

test('a chave segura até o fim da frase; dita perto da próxima, fica 4 quadros nítida', () => {
  const g = de('protegido')
  // dita aos 2,78 s com a próxima aos 3,22 s: o quadro da próxima (3,12 s) daria só 3 quadros nítida,
  // então vale o piso de 8 q de entrada + 4 q nítida (2,78 + 12 q = 3,18 s)
  assert.ok(Math.abs(g.sai - Math.max(3.22 - 3 * Q, 2.78 + 12 * Q)) < 1e-3, `"protegido", dita aos 2,78 s, sai aos ${g.sai} s`)
})

test('a frase sai inteira: apoio e chave no mesmo quadro', () => {
  assert.ok(r.itens.filter((i) => i.frase === 3).every((i) => i.sai === de('protegido').sai))
})

test('a chave tem 2,5x o apoio (a faixa medida: 2,0 a 3,6, mediana 2,5)', () => {
  assert.equal(de('protegido').px / de('acha').px, 2.5)
})

test('o colchete: o apoio de antes fica em cima da chave', () => {
  assert.ok(de('acha').y < de('protegido').y)
})

test('no plano médio, tudo abaixo do queixo e dentro da zona do Reel', () => {
  assert.ok(r.itens.every((i) => i.y >= planoMedio.queixo_y && i.onde === 'peito'), `topo ${Math.min(...r.itens.map((i) => i.y))} px`)
  assert.ok(r.itens.every((i) => i.y + i.px <= reel.base))
})

test('no anúncio com plano médio, o bloco cabe até 1248', () => {
  const ra = planejarLegenda(FRASES, fala, { rosto: planoMedio, formato: anuncio })
  assert.ok(ra.itens.every((i) => i.y + i.px * 1.25 <= anuncio.base + 1 && i.onde === 'peito'), `fundo ${Math.max(...ra.itens.map((i) => i.y + i.px))} px`)
})

test('rosto de perto: a legenda sobe para acima da cabeça, nunca entre o cabelo e o queixo', () => {
  const rp = planejarLegenda(FRASES, fala, { rosto: perto, formato: reel })
  assert.ok(rp.itens.every((i) => i.onde === 'cabeca' && i.y + i.px <= perto.cabelo_y), `fundo ${Math.max(...rp.itens.map((i) => i.y + i.px))} px, cabelo em 560`)
  assert.ok(rp.itens.every((i) => i.y >= reel.topo), 'nem acima da faixa do Instagram')
})

test('sem lugar acima nem abaixo, reprova em vez de cobrir o rosto', () => {
  assert.match(erroDe(() => planejarLegenda(FRASES, fala, { rosto: { cabelo_y: 330, queixo_y: 1418 }, formato: reel })), /não cabe abaixo do queixo/)
})

test('o lugar é um só na peça', () => {
  const rp = planejarLegenda(FRASES, fala, { rosto: perto, formato: reel })
  assert.equal(new Set(r.itens.map((i) => i.onde)).size, 1)
  assert.equal(new Set(rp.itens.map((i) => i.onde)).size, 1)
})

test('sem a faixa do rosto ou sem a zona do destino, reprova', () => {
  assert.match(erroDe(() => planejarLegenda(FRASES, fala, { formato: reel })), /rosto/)
  assert.match(erroDe(() => planejarLegenda(FRASES, fala, { rosto: planoMedio })), /zona do destino/)
})

test('a chave longa encolhe até caber; a que não cabe nem a 2x reprova', () => {
  const longa = planejarLegenda(['você está [perdendo]', 'o site sobre 3 %', 'e acha que está protegido', 'em relação à sua [contabilidade]'], fala, { rosto: planoMedio, formato: reel })
  const ap = de('contabilidade', longa)
  assert.ok(ap.razao < 2.5 && ap.razao >= 2.0, `"contabilidade" a ${ap.razao}x`)
  assert.match(erroDe(() => planejarLegenda(['você está [perdendo o site sobre 3 %]'], fala, { rosto: planoMedio, formato: reel })), /não cabe em 900/)
})

test('a fala manda: palavra que não bate, duas chaves e apoio longo reprovam', () => {
  assert.match(erroDe(() => planejarLegenda(['você tá [perdendo]'], fala, { rosto: planoMedio, formato: reel })), /não bate/)
  assert.match(erroDe(() => planejarLegenda(['você [está] [perdendo]'], fala, { rosto: planoMedio, formato: reel })), /2 chaves/)
  assert.match(erroDe(() => planejarLegenda(['você está perdendo o site sobre 3 % e [acha]'], fala, { rosto: planoMedio, formato: reel })), /parta a frase/)
})

// no lugar único, a frase que sai por baixo da que entra embaralha as duas (o render
// mostrou "demoram" sobre "para carregar" em 4 de 36 quadros): a saída acaba antes da entrada
test('a frase termina de sair no quadro em que a próxima entra; na fala rápida, a chave fica nítida 4 quadros antes', () => {
  const ch = de('perdendo')
  const s1 = ch.sai
  const e2 = de('o').entra
  const piso = ch.entra + 12 * Q
  assert.ok(s1 >= piso - 1e-3, `a chave fica nítida 4 quadros depois de entrar (sai ${s1}, piso ${piso.toFixed(3)})`)
  assert.ok(Math.abs(s1 - Math.max(e2 - 2 * Q, piso)) < 1e-3, `sai ${s1} s: ou no quadro da próxima (${(e2 - 2 * Q).toFixed(3)}), ou no piso da chave`)
  const g = de('protegido')
  const ultimaSai = r.itens.filter((i) => i.frase === 2).map((i) => i.sai)[0]
  const proxEntra = Math.min(...r.itens.filter((i) => i.frase === 3).map((i) => i.entra))
  assert.ok(g && ultimaSai + 2 * Q <= proxEntra + 1e-3, `com tempo, nada cruza: a frase 2 acaba ${(ultimaSai + 2 * Q).toFixed(3)} s, a 3 entra ${proxEntra} s`)
})

test('o plano diz quantas palavras da fala a legenda cobriu', () => {
  assert.equal(r.usadas, 19, 'as cinco frases cobrem até "atenção", a 19ª palavra')
})

test('a pontuação depois do colchete fica com a chave, e o colchete some (o "bio].")', () => {
  const f = lerFrase('clique no link da [bio].')
  assert.deepEqual(f.palavras.map((p) => [p.txt, p.chave]), [['clique', false], ['no', false], ['link', false], ['da', false], ['bio.', true]])
  const g = lerFrase('limpa e [profissional]. depois')
  assert.deepEqual(g.palavras.map((p) => [p.txt, p.chave]), [['limpa', false], ['e', false], ['profissional.', true], ['depois', false]], 'a chave fecha no colchete com ponto, e a palavra seguinte é apoio')
})

test('o apoio de baixo começa depois da linha inteira da chave (o line-height 1,12 do modelo), sem entrar nela', () => {
  const p = planejarLegenda(['[resolver] isso tudo'], { segmentos: [{ palavras: [{ texto: 'resolver', inicio: 1, fim: 1.4 }, { texto: 'isso', inicio: 1.5, fim: 1.7 }, { texto: 'tudo', inicio: 1.8, fim: 2 }] }] },
    { rosto: planoMedio, formato: reel })
  const ch = p.itens.find((i) => i.voz === 'chave')
  const ap = p.itens.find((i) => i.txt === 'isso')
  assert.ok(ap.y - ch.y >= Math.round(ch.px * 1.12), `o apoio em ${ap.y}, a chave em ${ch.y} com ${ch.px} px (linha de ${Math.round(ch.px * 1.12)})`)
})

// o lugar é um só: em nenhuma troca a frase que entra aparece antes de a anterior acabar de sair;
// quando a chave precisa de tempo, a próxima espera, e o atraso fica medido (até 10 quadros)
test('nunca duas frases no lugar ao mesmo tempo, e o atraso da fala rápida tem teto', () => {
  const porFrase = {}
  for (const i of r.itens) (porFrase[i.frase] = porFrase[i.frase] || []).push(i)
  const ks = Object.keys(porFrase).map(Number).sort((a, b) => a - b)
  for (let k = 0; k < ks.length - 1; k++) {
    const acaba = Math.max(...porFrase[ks[k]].map((i) => i.sai)) + r.saida.quadros * Q
    const entra = Math.min(...porFrase[ks[k + 1]].map((i) => i.entra))
    assert.ok(acaba <= entra + 1e-3, `a frase ${ks[k]} acaba aos ${acaba.toFixed(3)} s e a ${ks[k + 1]} entra aos ${entra} s`)
  }
  assert.ok(typeof r.atraso_max === 'number' && r.atraso_max <= 10 * Q + 1e-3, `atraso máximo ${r.atraso_max} s`)
})

// a faixa ocupada por outro elemento (a palavra atrás da cabeça): a legenda que cairia nela espera
// o fim; a frase que esse elemento esconde (oculta) não ocupa o lugar nem empurra as seguintes
test('a legenda espera a faixa ocupada acabar, e a frase oculta não empurra ninguém', () => {
  const base = planejarLegenda(FRASES, fala, { rosto: planoMedio, formato: reel })
  const e2 = Math.min(...base.itens.filter((i) => i.frase === 2).map((i) => i.entra))
  const ocupado = [[e2 - 0.05, e2 + 0.2]]
  const p = planejarLegenda(FRASES, fala, { rosto: planoMedio, formato: reel, ocupado })
  const e2b = Math.min(...p.itens.filter((i) => i.frase === 2).map((i) => i.entra))
  assert.ok(Math.abs(e2b - (e2 + 0.2)) < 1e-3, `a frase 2 entrava aos ${e2} s e passa a entrar no fim da faixa (${e2b} s)`)
  const po = planejarLegenda(FRASES, fala, { rosto: planoMedio, formato: reel, ocupado, ocultas: [2] })
  const e3 = Math.min(...base.itens.filter((i) => i.frase === 3).map((i) => i.entra))
  const e3o = Math.min(...po.itens.filter((i) => i.frase === 3).map((i) => i.entra))
  assert.ok(Math.abs(e3o - e3) < 1e-3, `com a frase 2 oculta, a 3 entra no tempo dela (${e3o} contra ${e3})`)
})

// a chave segura a frase : "+" continua a chave da anterior, e o apoio troca na
// linha de baixo; a chave só sai no fim da cadeia, e nada se cruza na linha de baixo
test('a chave segura a cadeia: a continuação troca embaixo, e a chave sai no fim', () => {
  const cadeia = ['você está [perdendo]', '+ o site sobre 3 %', 'e acha que está [protegido]']
  const p = planejarLegenda(cadeia, fala, { rosto: planoMedio, formato: reel })
  const ch = p.itens.find((i) => i.txt === 'perdendo')
  const cont = p.itens.filter((i) => i.frase === 2)
  const e3 = Math.min(...p.itens.filter((i) => i.frase === 3).map((i) => i.entra))
  assert.ok(cont.length > 0 && cont.every((i) => i.linha === 'baixo' && i.y > ch.y && i.continua === 1), `a continuação mora embaixo da chave: ${JSON.stringify(cont.map((i) => [i.txt, i.y]))} contra ${ch.y}`)
  assert.ok(Math.abs(ch.sai - Math.max(...cont.map((i) => i.sai))) < 1e-3, `a chave sai com o fim da cadeia (${ch.sai}), não com a primeira frase`)
  assert.ok(ch.sai + p.saida.quadros * Q <= e3 + 1e-3, `a próxima cadeia só entra depois (acaba ${ch.sai}, entra ${e3})`)
  const baixo1 = p.itens.filter((i) => i.frase === 1 && i.linha === 'baixo')
  if (baixo1.length) assert.ok(Math.max(...baixo1.map((i) => i.sai)) + 2 * Q <= Math.min(...cont.map((i) => i.entra)) + 1e-3, 'a linha de baixo nunca tem duas frases')
  assert.throws(() => planejarLegenda(['+ você está perdendo'], fala, { rosto: planoMedio, formato: reel }), /primeira frase/)
  assert.throws(() => planejarLegenda(['você está perdendo', '+ o site'], fala, { rosto: planoMedio, formato: reel }), /não tem chave/)
})

// sem espaço para três andares (207 px acima da cabeça), a legenda usa dois: o apoio
// numa linha só em cima da chave; a continuação troca nessa linha, e a chave fica parada
test('sem espaço para três andares, dois: o apoio em uma linha em cima da chave', () => {
  const apertado = { cabelo_y: 510, queixo_y: 1500 }
  const cadeia = ['você está [perdendo]', '+ o site sobre 3 %', 'e acha que está [protegido]']
  const p = planejarLegenda(cadeia, fala, { rosto: apertado, formato: reel })
  const ch = p.itens.find((i) => i.txt === 'perdendo')
  const voce = p.itens.find((i) => i.txt === 'você')
  const cont = p.itens.filter((i) => i.frase === 2)
  assert.equal(p.andares, 2)
  assert.ok(cont.every((i) => i.y === voce.y && i.linha === 'cima') && voce.y < ch.y, `a continuação troca na linha do apoio (${voce.y}), em cima da chave (${ch.y})`)
  assert.ok(Math.max(...p.itens.map((i) => i.y)) + 160 <= apertado.cabelo_y, 'o bloco cabe acima do cabelo')
  assert.ok(voce.sai + 2 * Q <= Math.min(...cont.map((i) => i.entra)) + 1e-3, 'a linha de cima nunca tem duas frases')
  assert.equal(planejarLegenda(cadeia, fala, { rosto: planoMedio, formato: reel }).andares, 3)
})
