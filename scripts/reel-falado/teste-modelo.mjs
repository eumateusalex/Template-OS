// O modelo de peça do Reel falado: o HTML que o
// HyperFrames renderiza, gerado pela montagem a partir de
// .claude/skills/cortes/reel/, e o modo gravação do /cortes que liga tudo.
//
// O que se cobra aqui:
//   - o modelo lê só o que a montagem escreve (chave do dados.js e campo da ficha):
//     campo que ninguém escreve é legenda que some calada no render
//   - toda ficha de estilo tem os campos que o modelo lê: copiar o estilo de um
//     vídeo de referência é escrever uma ficha nova, sem mexer em código
//   - a peça gerada tem o END escrito na mídia (o HyperFrames lê a duração no HTML)
//   - a forma do modelo vira trava: nada de recorte de fundo nem cartão de
//     câmera sobreposto
//   - a marca é a da pessoa: o modelo não traz cor, fonte nem caminho de marca
//     fixos (a montagem escreve o <head> da marca), e a ficha padrão lê os tokens
//   - o modo cita só caminhos que existem
//   - a entrada não é corte e a saída cruza: no Chromium, a peça montada (o modo bloco e as duas
//     vozes sobre a fala sintética, fixtures/fala-sintetica.json) está meio visível
//     e desfocada no meio da entrada, nítida no fim dela, e a chave segura a frase e some em 5 q
//
//   node --test scripts/reel-falado/teste-modelo.mjs

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, before, test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { CAMPOS_DA_FICHA, CAMPOS_DO_DESTAQUE } from './montar.mjs'
import { MARCA_A, tokensDe, raizCom } from '../marca/raiz-de-prova.mjs'

const RAIZ = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const MODELO = join(RAIZ, '.claude', 'skills', 'cortes', 'reel')
const MODO = join(RAIZ, '.claude', 'skills', 'cortes', 'gravacao.md')
const SKILL = join(RAIZ, '.claude', 'skills', 'cortes', 'SKILL.md')
const pasta = mkdtempSync(join(tmpdir(), 'teste-modelo-'))
after(() => rmSync(pasta, { recursive: true, force: true }))
// a marca do workspace configurada numa raiz de mentira (a montagem lê o estado pela lerMarca)
const raizDaMarca = raizCom(tokensDe(MARCA_A))
process.env.MARCA_RAIZ = raizDaMarca.raiz
after(() => raizDaMarca.fora())

const END = 1106 / 30
let dados, html, capa

before(() => {
  const palavras = [['clique', 0.5, 0.8, 1], ['no', 0.82, 0.9, 1], ['link', 0.92, 1.2, 1], ['da', 1.22, 1.3, 1], ['bio', 1.32, 1.8, 1]]
  writeFileSync(join(pasta, 'cortes.json'), JSON.stringify({
    fps: 30, END, END_voz: END - 1, respiro: { real: 1, congelado: 0 }, avisos: [],
    clipes: [{ frase: 1, escolhida: 0, de: 0, ate: 1, dur: 1, t: 0 }, { frase: 1, escolhida: 0, de: 2, ate: 3, dur: 1, t: 1 }],
    frases: [{ frase: 1, escolhida: 0, grupo: [0], texto: 'clique no link da bio', t_de: 0, t_ate: 2 }],
    palavras: palavras.map(([texto, inicio, fim, frase]) => ({ texto, inicio, fim, frase })),
    trocas: [], descartados: [], sincronia: null, voz: { lufs: -14, pico_dbtp: -1 }
  }))
  writeFileSync(join(pasta, 'legenda.json'), JSON.stringify({ correcoes: {}, blocos: ['clique no link', 'da [bio]'] }))
  // a junção _marca de mentira, e a peca.json sem ficha: vale a padrão
  mkdirSync(join(pasta, '_marca'))
  writeFileSync(join(pasta, '_marca', 'tokens.css'), ':root { --f-display: Arial; --w-display-bold: 700; --accent: rgb(1,2,3); }\n')
  writeFileSync(join(pasta, 'peca.json'), JSON.stringify({ gancho: 'seu site lento\nespanta cliente', capa: 'quatro ajustes\nno seu site', fatos: [] }))
  const r = spawnSync('node', [join(RAIZ, 'scripts', 'reel-falado', 'montar.mjs'), pasta], { encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
  dados = JSON.parse(readFileSync(join(pasta, 'dados.js'), 'utf8').replace(/^window\.DADOS = /, '').replace(/;\s*$/, ''))
  html = readFileSync(join(pasta, 'index.html'), 'utf8')
  capa = readFileSync(join(pasta, 'compositions', 'capa.html'), 'utf8')
})

// assert.ok(regex.test(pagina)) em vez de assert.match(pagina, regex): a falha do match despeja a
// página inteira, e o leitor junit do vermelho.mjs perde a falha quando ela traz "/>"
const usos = (texto, objeto) => [...new Set([...texto.matchAll(new RegExp(`\\b${objeto}\\.(\\w+)`, 'g'))].map((m) => m[1]))]

test('a peça gerada tem o END escrito na mídia e nenhuma marca do modelo sobrando', () => {
  for (const [nome, t] of [['index.html', html], ['capa.html', capa]]) assert.ok(!/\{\{/.test(t), `${nome} ficou com marca do modelo`)
  for (const id of ['camera', 'master']) {
    const m = new RegExp(`<(?:video|audio)[^>]*id="${id}"[^>]*data-duration="([\\d.]+)"`).exec(html)
    assert.ok(m, `a mídia ${id} não tem data-duration`)
    assert.ok(Math.abs(Number(m[1]) - END) < 1e-6, `a mídia ${id} dura ${m[1]} e o END é ${END}`)
  }
})

test('o modelo lê só chaves que a montagem escreve, e só campos da ficha', () => {
  for (const [nome, t] of [['index.html', html], ['capa.html', capa]]) {
    for (const k of usos(t, 'D')) assert.ok(Object.hasOwn(dados, k), `${nome} lê D.${k}, que a montagem não escreve`)
    for (const k of usos(t, 'F')) assert.ok(CAMPOS_DA_FICHA.includes(k), `${nome} lê F.${k}, que a ficha não tem`)
    for (const k of usos(t, 'DESTAQUE')) assert.ok(CAMPOS_DO_DESTAQUE.includes(k), `${nome} lê DESTAQUE.${k}, que a ficha não tem`)
  }
  assert.ok(usos(html, 'D').includes('legendas') && usos(html, 'D').includes('cortes'), 'o modelo não lê a legenda ou os cortes')
})

test('toda ficha de estilo tem os campos que o modelo lê', () => {
  const fichas = readdirSync(join(MODELO, 'legendas')).filter((f) => f.endsWith('.json'))
  assert.ok(fichas.includes('marca.json'), 'falta a ficha padrão, a marca.json')
  for (const f of fichas) {
    const ficha = JSON.parse(readFileSync(join(MODELO, 'legendas', f), 'utf8'))
    for (const k of CAMPOS_DA_FICHA) assert.ok(ficha[k] !== undefined && ficha[k] !== null, `${f} sem ${k}`)
    for (const k of CAMPOS_DO_DESTAQUE) assert.ok(ficha.destaque[k] !== undefined && ficha.destaque[k] !== null, `${f} sem destaque.${k}`)
  }
})

test('as fichas que vêm com o modo leem a marca: a fonte é a da marca, e o destaque colorido é o acento', () => {
  const fichas = readdirSync(join(MODELO, 'legendas')).filter((f) => f.endsWith('.json'))
  for (const f of fichas) {
    const ficha = JSON.parse(readFileSync(join(MODELO, 'legendas', f), 'utf8'))
    assert.equal(ficha.fonte, 'marca', `${f} fixa a fonte ${ficha.fonte}`)
    // o peso vem de um token de peso da marca (o apoio das duas vozes é o médio, com a reserva)
    assert.ok(/^var\(--w-display-[a-z]+(, *\d{3})?\)$/.test(String(ficha.peso)), `${f} fixa o peso ${ficha.peso}`)
    assert.equal(ficha.destaque.sublinhado_cor, 'var(--accent)', `${f} fixa a cor do sublinhado`)
    // o destaque que muda de cor muda para o acento; branco e preto são a cor do texto, não de marca
    assert.ok(['var(--accent)', ficha.cor].includes(ficha.destaque.cor), `${f} pinta o destaque de ${ficha.destaque.cor}`)
  }
  assert.equal(dados.ficha.nome, 'marca', 'a peça sem ficha na peca.json usa a marca.json')
})

test('a fonte "marca" desenha no --f-display, e a fonte nomeada vem antes dele', async () => {
  const { runInNewContext } = await import('node:vm')
  const script = /<script>([\s\S]*)<\/script>/.exec(html)[1]
  const desenha = (fonte) => {
    const els = {}
    const el = (id) => (els[id] = els[id] || { style: {}, appendChild() {}, setAttribute() {} })
    runInNewContext(script, {
      window: { DADOS: { ...dados, ficha: { ...dados.ficha, fonte }, legendas: [], fatos: [], cortes: [] } },
      document: { getElementById: el, createElement: () => ({ style: {}, appendChild() {}, setAttribute() {} }), createTextNode: () => ({}) },
      gsap: { timeline: () => ({ set() {}, to() {} }), set() {} }, Math
    })
    return els.gancho.style.fontFamily
  }
  assert.equal(desenha('marca'), 'var(--f-display), sans-serif')
  assert.equal(desenha('Roboto'), "'Roboto', var(--f-display), sans-serif")
})

test('o modelo não fixa a marca: o <head> sai da montagem, e o GSAP do _vendor local', () => {
  for (const arq of ['index.html', join('compositions', 'capa.html')]) {
    const t = readFileSync(join(MODELO, arq), 'utf8')
    assert.ok(t.includes('{{MARCA}}'), `${arq} sem o lugar da marca`)
    assert.ok(t.includes('<script src="_vendor/gsap.min.js"></script>'), `${arq} sem o GSAP local`)
    assert.ok(!/href="[^"]*tokens\.css"/.test(t), `${arq} fixa um tokens.css`)
    assert.ok(!/#[0-9a-f]{3,6}\b/i.test(t.replace(/background: #(000|fff)\b/gi, '')), `${arq} fixa uma cor além do preto e branco do fundo`)
  }
  assert.ok(html.includes('href="_marca/tokens.css"'), 'a peça gerada não lê a marca da pasta')
})

test('o modelo não recorta o fundo nem sobrepõe cartão à câmera', () => {
  const proibidos = [/remove-background/i, /cabeca/i, /cartao-cam/i, /mask-image/i, /alphamerge/i]
  for (const arq of ['index.html', join('compositions', 'capa.html')]) {
    const t = readFileSync(join(MODELO, arq), 'utf8')
    for (const p of proibidos) assert.ok(!p.test(t), `${arq} tem ${p}`)
  }
  assert.match(html, /<video[^>]*id="camera"/, 'a câmera em tela cheia')
})

test('o modo existe, o /cortes aponta para ele, e todo caminho que ele cita existe', () => {
  assert.ok(existsSync(MODO), 'falta o gravacao.md')
  // o caminho inteiro, na tabela dos modos: um "o gravacao.md" solto no texto não leva ninguém lá
  assert.ok(readFileSync(SKILL, 'utf8').includes('`.claude/skills/cortes/gravacao.md`'), 'o SKILL.md do /cortes não aponta o modo gravação')
  // o passo 5 (a legenda, o gancho e a capa) mora no legenda.md ao lado, e o modo aponta para ele
  const LEGENDA = join(dirname(MODO), 'legenda.md')
  assert.ok(existsSync(LEGENDA) && /legenda\.md/.test(readFileSync(MODO, 'utf8')), 'o modo aponta o legenda.md, que existe')
  // a linha com <!-- caminho futuro --> cita o que nasce no uso (a pasta da peça, a marca configurada)
  const texto = (readFileSync(MODO, 'utf8') + readFileSync(LEGENDA, 'utf8')).split('\n').filter((l) => !l.includes('caminho futuro')).join('\n')
  const caminhos = [...texto.matchAll(/`([^`\s]+\/[^`\s]*)`/g)].map((m) => m[1])
    .filter((c) => !/[<>{}*]|^https?:|^\$|^~/.test(c) && !c.startsWith('-'))
  assert.ok(caminhos.length >= 5, `o modo cita só ${caminhos.length} caminhos`)
  for (const c of caminhos) assert.ok(existsSync(join(RAIZ, c)), `o modo cita ${c}, que não existe`)
})

test('o enquadramento não troca de novo antes do intervalo mínimo (a regra rodando, não o texto)', async () => {
  // sem `ultimaTroca = c;` um teste por texto fica verde:
  // este roda o script do modelo com gsap e document de mentira e olha as trocas
  const { runInNewContext } = await import('node:vm')
  const script = /<script>([\s\S]*)<\/script>/.exec(html)[1]
  const el = () => ({ style: {}, appendChild() {}, setAttribute() {} })
  const trocas = []
  const tl = { set(alvo, v, t) { if (alvo === '#quadro') trocas.push([t, v.scale]) }, to() {} }
  runInNewContext(script, {
    window: { DADOS: { ...dados, cortes: [1.0, 2.0, 3.0, 4.6], troca_min: 1.5, punch: 1.08, legendas: [], fatos: [] } },
    document: { getElementById: el, createElement: el, createTextNode: () => ({}) },
    gsap: { timeline: () => tl, set() {} }, Math
  })
  assert.deepEqual(trocas, [[1.0, 1.08], [3.0, 1], [4.6, 1.08]], 'o corte em 2,0 s cai 1,0 s depois da troca: fica seco')
})

test('a capa usa um quadro do meio da primeira frase (ou o pedido) e quebra a linha pedida', () => {
  assert.ok(/<video[^>]*id="camera-capa"[^>]*data-media-start="1"/.test(capa), 'o quadro da capa: o meio da primeira frase, de 0 a 2 s')
  assert.deepEqual(dados.capa.linhas, ['quatro ajustes', 'no seu site'])
  assert.ok(usos(capa, 'D').includes('capa'))
})

test('o punch-in sai dos dados, e o destaque desenha por trecho e cresce sem colar na vizinha', () => {
  assert.equal(dados.punch, 1.08)
  assert.ok(/D\.punch/.test(html))
  // a regra, não o nome: um comentário com o nome passaria sem a regra
  assert.ok(/if \(c - ultimaTroca < D\.troca_min\) return;/.test(html), 'o modelo não troca o enquadramento antes do intervalo mínimo')
  assert.ok(/\.trechos\b/.test(html), 'o modelo desenha a legenda pelos trechos (o destaque de várias palavras num sublinhado só)')
  assert.ok(/fontSize[^;\n]*DESTAQUE\.escala/.test(html), 'a escala do destaque pelo tamanho da letra, que reserva espaço')
  assert.ok(!/scale\(' \+ DESTAQUE\.escala/.test(html))
})

// ─── no Chromium: a entrada não é corte, a saída cruza, e as duas vozes executam o plano ───
// a fala sintética (as 13 primeiras palavras), em três frases, montada pela
// montagem de verdade com a ficha duas-vozes; o GSAP é o do _vendor do estúdio (.claude/video/html/_vendor)
const GSAP = join(RAIZ, '.claude', 'video', 'html', '_vendor', 'gsap.min.js')
const FALA = JSON.parse(readFileSync(new URL('./fixtures/fala-sintetica.json', import.meta.url), 'utf8')).segmentos[0].palavras
const FRASES_FALA = [[0, 3], [3, 8], [8, 13]]
const frasePasta = join(pasta, 'duas-vozes')
let nav, pgBloco, pgFrase, planoFrase
const errosDaPagina = []

function cortesDaFala(END) {
  const palavras = FRASES_FALA.flatMap(([a, b], f) => FALA.slice(a, b).map((w) => ({ ...w, frase: f + 1 })))
  const frases = FRASES_FALA.map(([a, b], f) => ({ frase: f + 1, escolhida: f, grupo: [f], texto: FALA.slice(a, b).map((w) => w.texto).join(' '), t_de: FALA[a].inicio, t_ate: FALA[b - 1].fim }))
  return { fps: 30, END, END_voz: END - 0.8, respiro: { real: 0.8, congelado: 0 }, avisos: [], clipes: frases.map((f) => ({ frase: f.frase, escolhida: f.escolhida, t: f.t_de })),
    frases, palavras, trocas: [], descartados: [], sincronia: null, voz: { lufs: -14, pico_dbtp: -1 } }
}

async function abrir(dir) {
  mkdirSync(join(dir, '_vendor'), { recursive: true })
  copyFileSync(GSAP, join(dir, '_vendor', 'gsap.min.js'))
  const pg = await nav.newPage({ viewport: { width: 1080, height: 1920 } })
  pg.on('pageerror', (e) => errosDaPagina.push(e.message))
  await pg.goto(pathToFileURL(join(dir, 'index.html')).href)
  await pg.waitForFunction(() => !!(window.__timelines && window.__timelines.main), null, { timeout: 10000 })
  return pg
}

// o estado de um trecho de texto num instante: a opacidade efetiva (a do trecho vezes a da linha), o
// desfoque, o brilho, o tamanho e o topo da linha
const estado = (pg, txt, t) => pg.evaluate(({ txt, t }) => {
  window.__timelines.main.seek(Math.max(0, t), false)
  const s = [...document.querySelectorAll('#legendas span.p')].find((e) => e.textContent === txt)
  if (!s) return null
  const linha = s.closest('.texto')
  const cs = getComputedStyle(s)
  const desfoque = (el) => parseFloat((getComputedStyle(el).filter.match(/blur\(([\d.]+)px\)/) || [0, 0])[1])
  return { op: +cs.opacity * +getComputedStyle(linha).opacity, blur: desfoque(s) + desfoque(linha), brilho: parseFloat(s.style.getPropertyValue('--brilho') || 0),
    px: parseFloat(getComputedStyle(linha).fontSize), top: linha.getBoundingClientRect().top }
}, { txt, t })

before(async () => {
  const { chromium } = createRequire(join(RAIZ, 'scripts', 'package.json'))('playwright')
  mkdirSync(frasePasta)
  writeFileSync(join(frasePasta, 'cortes.json'), JSON.stringify(cortesDaFala(4.0)))
  writeFileSync(join(frasePasta, 'legenda.json'), JSON.stringify({ correcoes: {}, frases: ['você está [perdendo]', 'o [site] sobre 3 %', 'e acha que está [protegido]'] }))
  mkdirSync(join(frasePasta, '_marca'))
  writeFileSync(join(frasePasta, '_marca', 'tokens.css'), ':root { --f-display: Arial; --w-display-bold: 700; --accent: rgb(1,2,3); }\n')
  writeFileSync(join(frasePasta, 'peca.json'), JSON.stringify({ ficha: 'duas-vozes', rosto: { cabelo_y: 260, queixo_y: 700 }, gancho: 'o site não protege\na sua contabilidade', capa: 'o erro do site', fatos: [] }))
  const r = spawnSync('node', [join(RAIZ, 'scripts', 'reel-falado', 'montar.mjs'), frasePasta], { encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
  planoFrase = JSON.parse(readFileSync(join(frasePasta, 'dados.js'), 'utf8').replace(/^window\.DADOS = /, '').replace(/;\s*$/, '')).duasVozes
  nav = await chromium.launch({ headless: true })
  pgBloco = await abrir(pasta)
  pgFrase = await abrir(frasePasta)
})
after(async () => { if (nav) await nav.close() })

test('a peça das duas vozes leva as curvas e roda sem erro de script', () => {
  assert.ok(existsSync(join(frasePasta, 'curvas.js')) && existsSync(join(pasta, 'curvas.js')), 'a montagem copia o curvas.js da /mograph para a pasta da peça')
  assert.ok(/<script src="curvas\.js"><\/script>/.test(html), 'o modelo carrega o curvas.js')
  assert.deepEqual(errosDaPagina, [])
  assert.equal(dados.duasVozes, null, 'o modo bloco não grava duas vozes')
})

test('modo bloco: a entrada "sobe" leva 8 quadros e limpa o desfoque, e a saída cruza em 5 quadros', async () => {
  const b = dados.legendas[0]
  const meio = await estado(pgBloco, 'clique no link', b.inicio + 4 / 30)
  const fim = await estado(pgBloco, 'clique no link', b.inicio + 9 / 30)
  assert.ok(meio.op > 0.2 && meio.op < 0.95 && meio.blur > 0.5, `no meio da entrada o bloco está meio visível e desfocado: ${JSON.stringify(meio)}`)
  assert.ok(fim.op > 0.98 && fim.blur < 0.1, `no fim da entrada, nítido: ${JSON.stringify(fim)}`)
  const saindo = await estado(pgBloco, 'clique no link', b.fim + 2 / 30)
  const foi = await estado(pgBloco, 'clique no link', b.fim + 6 / 30)
  assert.ok(saindo.op > 0.05 && saindo.op < 0.98, `2 quadros depois do fim o bloco ainda sai (não é corte seco): ${saindo.op}`)
  assert.ok(foi.op < 0.05, `5 quadros depois do fim, saiu: ${foi.op}`)
})

test('duas vozes: a chave entra no quadro da palavra, meio visível e desfocada no meio da entrada', async () => {
  const ch = planoFrase.itens.find((i) => i.txt === 'perdendo')
  assert.equal(ch.voz, 'chave')
  const antes = await estado(pgFrase, 'perdendo', ch.entra - 2 / 30)
  const meio = await estado(pgFrase, 'perdendo', ch.entra + 4 / 30)
  const fim = await estado(pgFrase, 'perdendo', ch.entra + 9 / 30)
  assert.ok(antes.op < 0.05, `antes da entrada, a chave não aparece (${antes.op})`)
  assert.ok(meio.op > 0.2 && meio.op < 0.95 && meio.blur > 0.5, `no meio da entrada (4 q) não é corte: ${JSON.stringify(meio)}`)
  assert.ok(fim.op > 0.98 && fim.blur < 0.1, `no fim da entrada (9 q), nítida: ${JSON.stringify(fim)}`)
  assert.ok(meio.brilho > fim.brilho && fim.brilho < 0.3, `o brilho decai (de ${meio.brilho} para ${fim.brilho})`)
  assert.ok(Math.abs(fim.px - ch.px) < 1 && ch.px === 135, `a chave tem o tamanho planejado, 2,5x os 54 do apoio (${fim.px} px)`)
})

test('duas vozes: a chave segura a frase e some 5 quadros depois do "sai"; o apoio fica em cima', async () => {
  const ch = planoFrase.itens.find((i) => i.txt === 'perdendo')
  const segura = await estado(pgFrase, 'perdendo', ch.sai - 2 / 30)
  const foi = await estado(pgFrase, 'perdendo', ch.sai + 6 / 30)
  assert.ok(segura.op > 0.98, `a chave segura até perto do fim da frase (${segura.op})`)
  assert.ok(foi.op < 0.05, `5 quadros depois do "sai", a frase saiu (${foi.op})`)
  const ap = planoFrase.itens.find((i) => i.txt === 'você')
  const apFim = await estado(pgFrase, 'você', ap.entra + 9 / 30)
  const chFim = await estado(pgFrase, 'perdendo', ch.entra + 9 / 30)
  assert.ok(apFim.op > 0.98 && apFim.top < chFim.top, `o apoio entra e fica em cima da chave (topo ${apFim.top} contra ${chFim.top})`)
  const ultima = planoFrase.itens.filter((i) => i.frase === 3)
  assert.ok(ultima.every((i) => i.sai === 4.0), 'a última frase fica até o END (a chamada, pelo respiro)')
  assert.ok(planoFrase.itens.every((i) => i.entra >= 0.017), 'nada entra no quadro 0')
})

test('duas vozes: cada linha diz a frase e a voz dela (a /mograph esconde o apoio e a frase de trás da cabeça por elas)', async () => {
  const marcas = await pgFrase.evaluate(() => [...document.querySelectorAll('#legendas .texto')].map((l) => ({ frase: l.getAttribute('data-frase'), voz: l.getAttribute('data-voz'), txt: l.textContent.trim() })))
  const ch = marcas.find((m) => m.txt === 'perdendo')
  const ap = marcas.find((m) => m.txt.startsWith('você'))
  assert.ok(ch && ch.voz === 'chave' && ch.frase === '1', `a linha da chave marcada: ${JSON.stringify(ch)}`)
  assert.ok(ap && ap.voz === 'apoio' && ap.frase === '1', `a linha do apoio marcada: ${JSON.stringify(ap)}`)
  assert.ok(marcas.length > 0 && marcas.every((m) => m.frase && m.voz), `toda linha das duas vozes tem as duas marcas: ${JSON.stringify(marcas)}`)
})
