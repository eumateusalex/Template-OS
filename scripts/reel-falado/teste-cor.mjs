// A cor da câmera do Reel falado: a correção da peca.json, e a gradação da linguagem quando a peça
// pede ("gradacao": true), entram no data-color-grading do <video id="camera">, nas duas montagens (a
// da /cortes e a da /mograph, que regrava o index.html sobre o modelo); no falado com motion, a
// linguagem é a do plano.json. Chave fora da família correction do HyperFrames, ou valor fora da
// faixa, reprova a montagem.
//
//   node --test scripts/reel-falado/teste-cor.mjs
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { after, test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { corDaCamera, comCor } from './cor.mjs'

const AQUI = resolve(fileURLToPath(new URL('.', import.meta.url)))
const CASA = resolve(AQUI, '..', '..')
const MOTOR = join(AQUI, 'montar.mjs')
// a montagem da /mograph só roda com a peça dentro do workspace: a pasta de teste mora no rascunho/
mkdirSync(join(CASA, 'rascunho'), { recursive: true })
const raiz = mkdtempSync(join(CASA, 'rascunho', '.teste-cor-'))
after(() => rmSync(raiz, { recursive: true, force: true }))

const LINGUAGENS = { linguagens: {
  'falado-com-motion': { tempo: 'voz', dispensa: [], gradacao: { wheels: { shadows: { hue: 205, amount: 0.06, level: 0 }, highlights: { hue: 35, amount: 0.05, level: 0 } } } },
  'sem-gradacao': { tempo: 'voz', dispensa: [] },
  // o look que ele escolheu vendo (a H de 27/10): entra sozinho na peça nova, com a temperatura somada à correção
  'aprovada': { tempo: 'voz', dispensa: [], gradacao_aprovada: true,
    gradacao: { adjust: { temperature: 0.068 }, wheels: { midtones: { hue: 35, amount: 0.08, level: 0 } } } } } }

// ─── a conta ────────────────────────────────────────────────────────────────
const RODAS = LINGUAGENS.linguagens['falado-com-motion'].gradacao.wheels

test('a correção da peça entra sozinha; a gradação da linguagem só com o pedido (cor.gradacao: true)', () => {
  const r = corDaCamera({ cor: { correcao: { exposure: 0.1, temperature: -0.05 } } }, { linguagens: LINGUAGENS })
  assert.deepEqual(r.erros, [])
  assert.deepEqual(r.payload, { intensity: 1, adjust: { exposure: 0.1, temperature: -0.05 } })
  assert.equal(r.avisos.length, 1)
  assert.match(r.avisos[0], /gradação/)
  assert.match(r.avisos[0], /antes e depois/)
  const pedida = corDaCamera({ cor: { correcao: { exposure: 0.1 }, gradacao: true } }, { linguagens: LINGUAGENS })
  assert.deepEqual(pedida.payload, { intensity: 1, adjust: { exposure: 0.1 }, wheels: RODAS })
  assert.deepEqual(pedida.avisos, [])
})

test('sem cor na peça, nada entra na câmera e a montagem avisa a correção e a gradação', () => {
  const r = corDaCamera({}, { linguagens: LINGUAGENS })
  assert.equal(r.payload, null)
  assert.equal(r.avisos.length, 2)
  assert.match(r.avisos[0], /correção/)
  assert.match(r.avisos[0], /media-treatment --analyze/)
  assert.match(r.avisos[1], /gradação/)
})

test('a gradação da peça troca a da linguagem, e o false a desliga sem aviso', () => {
  const propria = { wheels: { midtones: { hue: 30, amount: 0.04, level: 0 } } }
  assert.deepEqual(corDaCamera({ cor: { correcao: { contrast: 0.05 }, gradacao: propria } }, { linguagens: LINGUAGENS }).payload.wheels, propria.wheels)
  const sem = corDaCamera({ cor: { correcao: { contrast: 0.05 }, gradacao: false } }, { linguagens: LINGUAGENS })
  assert.deepEqual(sem.payload, { intensity: 1, adjust: { contrast: 0.05 } })
  assert.deepEqual(sem.avisos, [])
})

test('a linguagem da peça escolhe a gradação; a que não existe reprova', () => {
  assert.equal(corDaCamera({ linguagem: 'sem-gradacao', cor: { correcao: { exposure: 0 }, gradacao: true } }, { linguagens: LINGUAGENS }).payload.wheels, undefined)
  const r = corDaCamera({ linguagem: 'nao-existe' }, { linguagens: LINGUAGENS })
  assert.match(r.erros.join(), /nao-existe/)
})

test('no falado com motion, a linguagem do plano vale quando a peça não diz, e as duas que divergem reprovam', () => {
  const doPlano = corDaCamera({ cor: { correcao: { exposure: 0 }, gradacao: true } }, { linguagens: LINGUAGENS, linguagemDoPlano: 'sem-gradacao' })
  assert.deepEqual(doPlano.erros, [])
  assert.equal(doPlano.payload.wheels, undefined, 'a linguagem do plano, sem gradação, manda')
  const iguais = corDaCamera({ linguagem: 'sem-gradacao', cor: { correcao: { exposure: 0 } } }, { linguagens: LINGUAGENS, linguagemDoPlano: 'sem-gradacao' })
  assert.deepEqual(iguais.erros, [])
  const divergem = corDaCamera({ linguagem: 'falado-com-motion' }, { linguagens: LINGUAGENS, linguagemDoPlano: 'sem-gradacao' })
  assert.match(divergem.erros.join(), /falado-com-motion/)
  assert.match(divergem.erros.join(), /plano\.json/)
})

test('chave fora da família correction ou valor fora da faixa reprova, com a faixa', () => {
  let r = corDaCamera({ cor: { correcao: { brilho: 0.2 } } }, { linguagens: LINGUAGENS })
  assert.match(r.erros.join(), /brilho/)
  assert.match(r.erros.join(), /exposure/)
  r = corDaCamera({ cor: { correcao: { exposure: 3 } } }, { linguagens: LINGUAGENS })
  assert.match(r.erros.join(), /exposure/)
  assert.match(r.erros.join(), /-2 a 2/)
  r = corDaCamera({ cor: { correcao: { saturation: 'muito' } } }, { linguagens: LINGUAGENS })
  assert.match(r.erros.join(), /saturation/)
  r = corDaCamera({ cor: { gradacao: { wheels: { shadows: { hue: 400, amount: 2 } } } } }, { linguagens: LINGUAGENS })
  assert.match(r.erros.join(), /hue/)
  assert.match(r.erros.join(), /amount/)
  r = corDaCamera({ cor: { gradacao: { lut: 'x.cube' } } }, { linguagens: LINGUAGENS })
  assert.match(r.erros.join(), /lut/)
})

test('o look aprovado entra sozinho na peça com a cor medida, sem aviso; o false desliga; a peça sem cor fica como está', () => {
  const r = corDaCamera({ linguagem: 'aprovada', cor: { correcao: { exposure: 0.1 } } }, { linguagens: LINGUAGENS })
  assert.deepEqual(r.erros, [])
  assert.deepEqual(r.payload.wheels, LINGUAGENS.linguagens.aprovada.gradacao.wheels)
  assert.deepEqual(r.avisos, [])
  const desligado = corDaCamera({ linguagem: 'aprovada', cor: { correcao: { exposure: 0.1 }, gradacao: false } }, { linguagens: LINGUAGENS })
  assert.deepEqual(desligado.payload, { intensity: 1, adjust: { exposure: 0.1 } })
  const antiga = corDaCamera({ linguagem: 'aprovada' }, { linguagens: LINGUAGENS })
  assert.equal(antiga.payload, null, 'a peça antiga montada de novo não muda de cor')
  assert.match(antiga.avisos.join(), /correção/)
})

test('o adjust do look soma com a correção, chave a chave, dentro da faixa; chave fora da família reprova', () => {
  const r = corDaCamera({ linguagem: 'aprovada', cor: { correcao: { exposure: 0.1, temperature: -0.028 } } }, { linguagens: LINGUAGENS })
  assert.deepEqual(r.payload.adjust, { exposure: 0.1, temperature: 0.04 })
  const no_teto = corDaCamera({ linguagem: 'aprovada', cor: { correcao: { temperature: 0.98 } } }, { linguagens: LINGUAGENS })
  assert.equal(no_teto.payload.adjust.temperature, 1, 'a soma fica na faixa do motor')
  const so_look = corDaCamera({ linguagem: 'aprovada', cor: { correcao: { exposure: 0 } } }, { linguagens: LINGUAGENS })
  assert.deepEqual(so_look.payload.adjust, { exposure: 0, temperature: 0.068 })
  const errada = corDaCamera({ cor: { correcao: { exposure: 0 }, gradacao: { adjust: { brilho: 0.1 } } } }, { linguagens: LINGUAGENS })
  assert.match(errada.erros.join(), /brilho/)
  const fora = corDaCamera({ cor: { correcao: { exposure: 0 }, gradacao: { adjust: { temperature: 3 } } } }, { linguagens: LINGUAGENS })
  assert.match(fora.erros.join(), /temperature/)
})

test('o comCor põe o atributo no <video id="camera"> e troca o que já havia', () => {
  const html = '<div><video id="camera" class="clip" src="camera.mp4" muted></video></div>'
  const um = comCor(html, { intensity: 1, adjust: { exposure: 0.1 } })
  assert.match(um, /<video id="camera" data-color-grading='\{"intensity":1,"adjust":\{"exposure":0\.1\}\}' class="clip"/)
  const dois = comCor(um, { intensity: 1 })
  assert.equal((dois.match(/data-color-grading/g) || []).length, 1)
  assert.equal(comCor(html, null), html)
  assert.throws(() => comCor('<div></div>', { intensity: 1 }), /camera/)
})

test('a linguagem falado-com-motion do linguagens.json traz o look sugerido, sem aprovação: sem o pedido avisa, e pedido passa na régua', () => {
  const solta = corDaCamera({ cor: { correcao: { exposure: 0, temperature: -0.028 } } })
  assert.deepEqual(solta.erros, [])
  assert.ok(solta.avisos.some((a) => /gradação da linguagem falado-com-motion/.test(a)), solta.avisos.join(' | '))
  assert.equal(solta.payload.wheels, undefined, 'sem a aprovação do usuário, o look não entra sozinho')
  const r = corDaCamera({ cor: { correcao: { exposure: 0, temperature: -0.028 }, gradacao: true } })
  assert.deepEqual(r.erros, [])
  assert.deepEqual(r.avisos, [])
  assert.deepEqual(Object.keys(r.payload.wheels).sort(), ['highlights', 'midtones', 'shadows'])
  assert.ok(Object.values(r.payload.wheels).every((w) => w.hue >= 25 && w.hue <= 45), `as três rodas no quente: ${JSON.stringify(r.payload.wheels)}`)
  assert.equal(r.payload.adjust.temperature, 0.04, 'a temperatura do look somada à da correção')
})

// ─── as duas montagens ──────────────────────────────────────────────────────
const FICHA = {
  fonte: 'Inter 4', peso: 700, tamanho: 74, cor: '#ffffff', contorno: 10, contorno_cor: '#000000',
  sombra: '0 2px 12px rgba(0,0,0,.45)', fundo: 'none', caixa: 'minuscula', posicao_y: 1310, largura: 1000,
  max_palavras: 3, entrada: 'sobe',
  destaque: { cor: '#ffffff', italico: false, sublinhado: true, sublinhado_cor: '#008dff', escala: 1 }
}
const PALAVRAS = [['o', 0.0, 0.2, 1], ['site', 0.22, 0.6, 1], ['lento', 0.62, 1.2, 1], ['espanta', 2.6, 3.0, 2], ['o', 3.02, 3.1, 2], ['cliente', 3.12, 3.8, 2]]
const CORTES = {
  fps: 30, END: 5.0, END_voz: 4.0, respiro: { real: 1.0, congelado: 0 }, avisos: [],
  clipes: [{ frase: 1, escolhida: 1, de: 10, ate: 12.5, dur: 2.5, t: 0 }, { frase: 2, escolhida: 2, de: 20, ate: 21.5, dur: 1.5, t: 2.5 }],
  frases: [{ frase: 1, escolhida: 1, grupo: [1], texto: 'o site lento', t_de: 0, t_ate: 2.5 }, { frase: 2, escolhida: 2, grupo: [2], texto: 'espanta o cliente', t_de: 2.5, t_ate: 4.0 }],
  palavras: PALAVRAS.map(([texto, inicio, fim, frase]) => ({ texto, inicio, fim, frase })),
  trocas: [], descartados: [], sincronia: null, voz: { lufs: -14, pico_dbtp: -1 }
}
let n = 0
function pasta(extra = {}) {
  const p = join(raiz, `p${++n}`)
  mkdirSync(p)
  writeFileSync(join(p, 'cortes.json'), JSON.stringify(CORTES))
  writeFileSync(join(p, 'ficha.json'), JSON.stringify(FICHA))
  writeFileSync(join(p, 'legenda.json'), JSON.stringify({ correcoes: {}, blocos: ['o site', '[lento]', 'espanta o', '[cliente]'] }))
  writeFileSync(join(p, 'peca.json'), JSON.stringify({ ficha: 'ficha.json', marca: 'neutra', gancho: 'seu site lento\nespanta o cliente', capa: 'o site lento', fatos: [], ...extra }))
  return p
}
const grading = (p) => {
  const m = readFileSync(join(p, 'index.html'), 'utf8').match(/<video id="camera"[^>]*data-color-grading='([^']*)'/)
  return m ? JSON.parse(m[1]) : null
}

test('a montagem da /cortes grava a câmera com a correção e a gradação pedida', () => {
  const p = pasta({ cor: { correcao: { exposure: 0.12, temperature: 0.03 }, gradacao: true } })
  const r = spawnSync('node', [MOTOR, p], { encoding: 'utf8' })
  assert.equal(r.status, 0, r.stdout + r.stderr)
  const g = grading(p)
  assert.deepEqual(g.adjust, { exposure: 0.12, temperature: 0.098 }, 'a temperatura da correção somada à do look')
  assert.ok(g.wheels, JSON.stringify(g))
})

test('a montagem da /cortes sem cor avisa, não muda a câmera, e com a chave errada recusa', () => {
  const p = pasta()
  const r = spawnSync('node', [MOTOR, p], { encoding: 'utf8' })
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assert.match(r.stdout, /aviso: .*correção/)
  assert.match(r.stdout, /aviso: .*gradação/)
  assert.equal(grading(p), null, 'a peça antiga montada de novo não muda de cor')
  assert.match(readFileSync(join(p, 'RELATORIO.md'), 'utf8'), /correção/)
  const q = pasta({ cor: { correcao: { brilho: 1 } } })
  const s = spawnSync('node', [MOTOR, q], { encoding: 'utf8' })
  assert.equal(s.status, 1, s.stdout + s.stderr)
  assert.match(s.stdout + s.stderr, /brilho/)
})

test('a montagem da /mograph (falado) mantém a cor da câmera no index.html que ela regrava', async () => {
  const p = pasta({ cor: { correcao: { exposure: 0.08 } } })
  writeFileSync(join(p, 'plano.json'), JSON.stringify({
    nome: 'teste-cor', modo: 'falado', destino: 'organico', legenda: 'L2', fps: 30, filme: 'x', interface_aprovada: false,
    cenas: [{ id: 'S01', frase: 1, tipo: 'legenda', funcao: 'HOOK', camera: 'PARADA', importancia: 2 },
      { id: 'S02', frase: 2, tipo: 'legenda', funcao: 'PROOF', camera: 'PARADA', importancia: 1 }] }))
  const { montarFalado } = await import(pathToFileURL(join(CASA, '.claude', 'skills', 'mograph', 'ferramentas', 'montar-falado.mjs')).href)
  const catalogo = JSON.parse(readFileSync(join(CASA, '.claude', 'skills', 'mograph', 'biblioteca', 'catalogo.json'), 'utf8'))
  await montarFalado(p, { catalogo })
  const g = grading(p)
  assert.ok(g, readFileSync(join(p, 'index.html'), 'utf8').slice(0, 400))
  // o look da linguagem ainda não foi aprovado: a câmera leva só a correção medida
  assert.deepEqual(g.adjust, { exposure: 0.08 })
  assert.equal(g.wheels, undefined, JSON.stringify(g))
})

test('a montagem da /cortes chamada pelo falado avisa com a linguagem do plano', async () => {
  const { montar } = await import(pathToFileURL(MOTOR).href)
  const p = pasta({ cor: { correcao: { exposure: 0.05 } } })
  const r = montar(p, { linguagemDoPlano: 'spec-ad-locucao' })
  assert.equal(r.length, 0, r.join('; '))
  assert.ok(r.avisos.some((a) => /gradação da linguagem spec-ad-locucao/.test(a)), r.avisos.join(' | '))
  assert.ok(!r.avisos.some((a) => /falado-com-motion/.test(a)), r.avisos.join(' | '))
})

test('a montagem da /mograph (falado) passa a linguagem do plano à /cortes, e o aviso de cor fala dela', async () => {
  const p = pasta({ cor: { correcao: { exposure: 0.05 } } })
  writeFileSync(join(p, 'plano.json'), JSON.stringify({
    nome: 'teste-cor', modo: 'falado', destino: 'organico', legenda: 'L2', fps: 30, filme: 'x', interface_aprovada: false, linguagem: 'spec-ad-locucao',
    cenas: [{ id: 'S01', frase: 1, tipo: 'legenda', funcao: 'HOOK', camera: 'PARADA', importancia: 2 },
      { id: 'S02', frase: 2, tipo: 'legenda', funcao: 'PROOF', camera: 'PARADA', importancia: 1 }] }))
  const { montarFalado } = await import(pathToFileURL(join(CASA, '.claude', 'skills', 'mograph', 'ferramentas', 'montar-falado.mjs')).href)
  const catalogo = JSON.parse(readFileSync(join(CASA, '.claude', 'skills', 'mograph', 'biblioteca', 'catalogo.json'), 'utf8'))
  const linhas = []
  const log = console.log
  console.log = (...a) => linhas.push(a.join(' '))
  try { await montarFalado(p, { catalogo }) } finally { console.log = log }
  const cor = linhas.filter((l) => /gradação da linguagem/.test(l))
  assert.equal(cor.length, 1, linhas.join(' | '))
  assert.match(cor[0], /spec-ad-locucao/)
})

test('a montagem da /mograph (falado) recusa a linguagem da peca.json que diverge da do plano.json', async () => {
  const p = pasta({ linguagem: 'falado-com-motion', cor: { correcao: { exposure: 0.08 } } })
  writeFileSync(join(p, 'plano.json'), JSON.stringify({
    nome: 'teste-cor', modo: 'falado', destino: 'organico', legenda: 'L2', fps: 30, filme: 'x', interface_aprovada: false, linguagem: 'spec-ad-locucao',
    cenas: [{ id: 'S01', frase: 1, tipo: 'legenda', funcao: 'HOOK', camera: 'PARADA', importancia: 2 },
      { id: 'S02', frase: 2, tipo: 'legenda', funcao: 'PROOF', camera: 'PARADA', importancia: 1 }] }))
  const { montarFalado } = await import(pathToFileURL(join(CASA, '.claude', 'skills', 'mograph', 'ferramentas', 'montar-falado.mjs')).href)
  const catalogo = JSON.parse(readFileSync(join(CASA, '.claude', 'skills', 'mograph', 'biblioteca', 'catalogo.json'), 'utf8'))
  await assert.rejects(montarFalado(p, { catalogo }), /spec-ad-locucao/)
})
