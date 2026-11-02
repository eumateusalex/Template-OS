// Prova do gerador da marca (`scripts/marca/gerar.mjs`).
//
// Por que existe: a promessa da marca é "troca num lugar, muda tudo". Se uma
// saída não acompanha a troca, ou carrega valor de outra marca, a peça sai
// metade numa identidade e metade na outra, e ninguém percebe no olho.
//
//   1. cópia velha: cada saída escrita bate com o que o gerador escreveria
//      agora; editar uma saída ou trocar a marca a deixa velha, e o
//      conferirSaidas aponta
//   4. troca num lugar muda tudo: com a marca A e com a marca B, o CSS do
//      carrossel, o marca.css da web, o marca.json, o movimento.js e .json, o
//      marca.ts do Remotion, o prompt de imagem e o ícone mudam todos, e
//      nenhum carrega valor da outra marca
//
// Uso:  node --test scripts/marca/teste-gerar.mjs
// mutação: scripts/marca/gerar.mjs · "s.set(DESTINOS.tokens, cssDoCarrossel(r ?? demo, { configurada: Boolean(r) }))" → "s.set(DESTINOS.tokens, cssDoCarrossel(demo, { configurada: Boolean(r) }))" · pega em 01/01/2000
// mutação: scripts/marca/gerar.mjs · ".slide.dark, .slide.cta {" → ".slide.dark {" · pega em 01/01/2000
// mutação: scripts/marca/gerar.mjs · ".slide.cover, .slide.photo, .slide.full { --accent: rgb(var(--c-accent-photo)); }" → ".slide.cover, .slide.photo { --accent: rgb(var(--c-accent-photo)); }" · pega em 01/01/2000

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { saidas, escrever, conferirSaidas, DESTINOS } from './gerar.mjs'
import { MARCA_A, MARCA_B, tokensDe, raizCom, marcasDe, semEspaco } from './raiz-de-prova.mjs'
import { RAIZ } from './marca.mjs'
import { TEXTO_TRANSLUCIDO, razao, sobre, hexDe } from './derivar.mjs'

// O que cada saída tem que carregar da marca: a cor, a curva ou o estilo.
const O_QUE_CADA_UMA_LEVA = {
  tokens: ['cor'],
  css: ['cor', 'curva'],
  json: ['cor', 'curva', 'estilo'],
  movimentoJs: ['curva'],
  movimentoJson: ['curva'],
  movimentoMarca: ['curva'],
  remotion: ['cor', 'curva'],
  prompt: ['cor', 'estilo'],
  icone: []
}
const marcaPorTipo = (m) => { const [hex, canais, curva, estilo] = marcasDe(m); return { cor: [hex, canais], curva: [curva], estilo: [estilo] } }

test('toda saída tem a lista do que leva da marca (saída nova entra aqui)', () => {
  assert.deepEqual(Object.keys(O_QUE_CADA_UMA_LEVA).sort(), Object.keys(DESTINOS).sort())
})

test('4 · troca num lugar muda tudo: A e B dão saídas diferentes, cada uma só com valor da sua marca', () => {
  const a = raizCom(tokensDe(MARCA_A))
  const b = raizCom(tokensDe(MARCA_B))
  try {
    const sa = saidas({ raiz: a.raiz })
    const sb = saidas({ raiz: b.raiz })
    for (const [chave, rel] of Object.entries(DESTINOS)) {
      const ta = semEspaco(sa.get(rel))
      const tb = semEspaco(sb.get(rel))
      assert.notEqual(ta, tb, `${rel} não mudou de A para B`)
      for (const [nome, de, outra, texto] of [['A', MARCA_A, MARCA_B, ta], ['B', MARCA_B, MARCA_A, tb]]) {
        const minha = marcaPorTipo(de)
        for (const tipo of O_QUE_CADA_UMA_LEVA[chave]) {
          assert.ok(minha[tipo].some((v) => texto.includes(v)), `${rel} da marca ${nome} não traz a ${tipo} dela (${minha[tipo].join(' ou ')})`)
        }
        const vazou = marcasDe(outra).filter((v) => texto.includes(v))
        assert.deepEqual(vazou, [], `${rel} da marca ${nome} carrega valor da outra marca`)
      }
    }
  } finally { a.fora(); b.fora() }
})

test('toda superfície de texto claro do kit do carrossel (cor --on-dark) troca o acento: a de foto pelo da foto, as outras pelo do fundo escuro', () => {
  // a lista vem do kit, não daqui: superfície nova de fundo escuro, ou de foto, entra sozinha
  const kit = readFileSync(join(RAIZ, '.claude/skills/carrossel/kit/componentes.css'), 'utf8')
  const blocos = [...kit.matchAll(/^\.slide\.([a-z]+)\s*\{([^}]*)\}/gm)].filter((m) => /\bcolor:\s*var\(--on-dark\)/.test(m[2]))
  const foto = blocos.filter((m) => /var\(--img\)/.test(m[2])).map((m) => m[1])
  const escuras = blocos.filter((m) => !/var\(--img\)/.test(m[2])).map((m) => m[1])
  assert.ok(foto.length >= 3 && escuras.length >= 2, `o kit tem ${foto.join(', ')} sobre foto e ${escuras.join(', ')} no escuro: a leitura do kit quebrou`)
  const a = raizCom(tokensDe(MARCA_A))
  try {
    const tokens = saidas({ raiz: a.raiz }).get(DESTINOS.tokens)
    const seletoresDe = (papel) => {
      const troca = new RegExp(`^([^{\\n]+)\\{\\s*--accent:\\s*rgb\\(var\\(--c-accent-${papel}\\)\\);?\\s*\\}`, 'm').exec(tokens)
      assert.ok(troca, `o tokens.css não troca o acento pelo --c-accent-${papel}`)
      return troca[1].split(',').map((s) => s.trim())
    }
    const noEscuro = seletoresDe('dark')
    const naFoto = seletoresDe('photo')
    for (const c of escuras) assert.ok(noEscuro.includes(`.slide.${c}`), `.slide.${c} tem texto claro e fica com o acento do fundo claro`)
    for (const c of foto) assert.ok(naFoto.includes(`.slide.${c}`) && !noEscuro.includes(`.slide.${c}`), `.slide.${c} tem foto atrás e não usa o acento da foto`)
  } finally { a.fora() }
})

test('todo texto translúcido do kit do carrossel passa o contraste no tokens.css gerado, sobre cada fundo onde aparece', () => {
  // a lista vem do kit: token translúcido novo usado em texto entra sozinho e tem de estar na regra
  const kit = readFileSync(join(RAIZ, '.claude/skills/carrossel/kit/componentes.css'), 'utf8')
  const usados = [...new Set([...kit.matchAll(/(?:^|[;{\s])(?:color|--mac-title):\s*var\(--(on-(?:dark|light)-\d+)\)/gm)].map((m) => m[1]))]
  assert.ok(usados.length >= 10, `o kit usa ${usados.join(', ')}: a leitura do kit quebrou`)
  for (const t of usados) assert.ok(TEXTO_TRANSLUCIDO[t], `o kit usa --${t} em texto e a regra (TEXTO_TRANSLUCIDO) não o mede`)
  // a marca da conferência a frio depois do "verde mais escuro": o texto corrido opaco passa
  // (5,34:1), e na opacidade do kit cai a 3,05:1
  const clara = raizCom(tokensDe({ ...MARCA_A, principal: '#4f6b4e', claro: '#f6f3ec', acento: '#b5643c' }))
  try {
    const css = saidas({ raiz: clara.raiz }).get(DESTINOS.tokens)
    const canais = (nome) => {
      const m = new RegExp(`--${nome}:\\s*(\\d+),(\\d+),(\\d+);`).exec(css)
      assert.ok(m, `o tokens.css não tem --${nome}`)
      return { r: +m[1], g: +m[2], b: +m[3], a: 1 }
    }
    const fundos = { dark: [canais('c-bg-dark'), canais('c-abyss')], light: [canais('c-light'), canais('c-support-2')] }
    const frente = { dark: canais('c-light'), light: canais('c-on-light') }
    let subiu = 0
    for (const t of usados) {
      const lado = t.startsWith('on-dark') ? 'dark' : 'light'
      const m = new RegExp(`--${t}:\\s*rgba\\(var\\(--c-${lado === 'dark' ? 'light' : 'on-light'}\\),\\s*([\\d.]+)\\);`).exec(css)
      assert.ok(m, `o tokens.css não escreve --${t} na cor de texto do fundo`)
      const alfa = Number(m[1])
      const [desenho, minimo] = TEXTO_TRANSLUCIDO[t]
      if (alfa > desenho) subiu++
      for (const f of fundos[lado]) {
        const r = razao(sobre({ ...frente[lado], a: alfa }, f), f)
        assert.ok(r >= minimo, `--${t} (${alfa}) dá ${r.toFixed(2)}:1 sobre ${hexDe(f)}, e o mínimo é ${minimo}:1`)
      }
    }
    assert.ok(subiu > 0, 'nenhuma opacidade subiu nesta marca: o caso não prova nada')
  } finally { clara.fora() }
})

test('4 · o raio da marca chega ao CSS da web e ao ícone', () => {
  const a = raizCom(tokensDe(MARCA_A))
  try {
    const s = saidas({ raiz: a.raiz })
    assert.match(s.get(DESTINOS.css), /--r-md: 20px;/)
    assert.match(s.get(DESTINOS.icone), /rx="14"/)
  } finally { a.fora() }
})

test('1 · cópia velha: escrita, em dia; uma saída editada à mão ou a marca trocada, velha', () => {
  const a = raizCom(tokensDe(MARCA_A))
  try {
    escrever({ raiz: a.raiz })
    assert.deepEqual(conferirSaidas({ raiz: a.raiz }), [])

    const css = join(a.raiz, DESTINOS.css)
    const original = readFileSync(css, 'utf8')
    writeFileSync(css, original.replace('--r-md: 20px;', '--r-md: 21px;'))
    assert.deepEqual(conferirSaidas({ raiz: a.raiz }).map((v) => v.caminho), [DESTINOS.css])
    writeFileSync(css, original)

    writeFileSync(join(a.raiz, 'identidade', 'marca.tokens.json'), JSON.stringify(tokensDe(MARCA_B)))
    const velhas = conferirSaidas({ raiz: a.raiz }).map((v) => v.caminho)
    for (const rel of Object.values(DESTINOS)) assert.ok(velhas.includes(rel), `${rel} não ficou velha com a marca trocada`)
  } finally { a.fora() }
})

test('o marca.ts do Remotion tem os mesmos nomes com e sem marca, e sem marca para com a frase única', () => {
  const nomes = (ts) => [...ts.matchAll(/^export (?:const|function) (\w+)/gm)].map((m) => m[1]).sort()
  const a = raizCom(tokensDe(MARCA_A))
  const sem = raizCom(null)
  try {
    const com = saidas({ raiz: a.raiz }).get(DESTINOS.remotion)
    const vazio = saidas({ raiz: sem.raiz }).get(DESTINOS.remotion)
    assert.deepEqual(nomes(vazio), nomes(com))
    assert.ok(nomes(com).includes('MOVIMENTO'), 'o marca.ts não exporta a curva da marca')
    assert.match(vazio, /MARCA_CONFIGURADA: boolean = false/)
    assert.ok(vazio.includes('a marca não está configurada: rode /marca'), 'o marca.ts sem marca não diz a frase única')
    assert.ok(!/carrossel configurar/.test(vazio + com))
  } finally { a.fora(); sem.fora() }
})

test('o movimento da junção _marca (HyperFrames) é o mesmo de identidade/gerado/movimento.js', () => {
  const a = raizCom(tokensDe(MARCA_A))
  try {
    const s = saidas({ raiz: a.raiz })
    assert.equal(s.get(DESTINOS.movimentoMarca), s.get(DESTINOS.movimentoJs))
    assert.ok(DESTINOS.movimentoMarca.startsWith('.claude/skills/carrossel/marca/'))
  } finally { a.fora() }
})
