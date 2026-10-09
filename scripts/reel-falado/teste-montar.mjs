// A montagem do Reel falado: os blocos de legenda que o
// agente escreve à mão viram os dados da peça, e a máquina recusa o que fere a
// régua.
//
// A régua: bloco que fica menos de 8 quadros na tela não se lê; dois destaques seguidos
// apagam o destaque; destaque em "de" ou "a" não destaca nada; a legenda segue a
// caixa da memória (a linha **Caixa:** de _memoria/escrita-publica.md, lida por
// scripts/lib/caixa.js). A peça sai na marca do workspace (a junção _marca da pasta)
// ou na neutra que a peca.json pede; sem nenhuma das duas, recusa. A transcrição erra nome
// ("PgSpeed", "Bill"), e só a correção declarada passa.
//
//   node --test scripts/reel-falado/teste-montar.mjs

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { montar } from './montar.mjs'

const AQUI = resolve(fileURLToPath(new URL('.', import.meta.url)))
const MOTOR = join(AQUI, 'montar.mjs')
const raiz = mkdtempSync(join(tmpdir(), 'teste-montar-'))
after(() => rmSync(raiz, { recursive: true, force: true }))

const FICHA = {
  fonte: 'Inter 4', peso: 700, tamanho: 74, cor: '#ffffff', contorno: 10, contorno_cor: '#000000',
  sombra: '0 2px 12px rgba(0,0,0,.45)', fundo: 'none', caixa: 'minuscula', posicao_y: 1310, largura: 1000,
  max_palavras: 3, entrada: 'sobe',
  destaque: { cor: '#ffffff', italico: false, sublinhado: true, sublinhado_cor: '#008dff', escala: 1 }
}

// a fala de duas frases, no tempo novo, como o fala.py grava
const PALAVRAS = [
  ['quarto', 0.0, 0.2, 1], ['e', 0.22, 0.3, 1], ['último', 0.42, 0.8, 1], ['verificar', 0.9, 1.3, 1],
  ['o', 1.32, 1.4, 1], ['site', 1.42, 1.7, 1], ['no', 1.72, 1.8, 1], ['PG', 1.82, 2.05, 1], ['Speed', 2.07, 2.4, 1],
  ['clique', 2.6, 2.9, 2], ['no', 2.92, 3.0, 2], ['link', 3.02, 3.3, 2], ['da', 3.32, 3.4, 2], ['Bill', 3.42, 3.9, 2]
]
const CORTES = {
  fps: 30, END: 5.0, END_voz: 4.0, respiro: { real: 1.0, congelado: 0 }, avisos: ['a gravação acaba em cima da última palavra: o último quadro congela por 0.27 s'],
  clipes: [{ frase: 1, escolhida: 3, de: 10, ate: 12.5, dur: 2.5, t: 0 }, { frase: 2, escolhida: 7, de: 20, ate: 21.5, dur: 1.5, t: 2.5 }],
  frases: [{ frase: 1, escolhida: 3, grupo: [1, 2, 3], texto: 'Quarto e último, verificar o site no PG Speed', t_de: 0, t_ate: 2.5 },
    { frase: 2, escolhida: 7, grupo: [6, 7], texto: 'clique no link da Bill', t_de: 2.5, t_ate: 4.0 }],
  palavras: PALAVRAS.map(([texto, inicio, fim, frase]) => ({ texto, inicio, fim, frase })),
  trocas: [{ frase: 2, escolhida: 6, ultima: 7, descartada: 'clique no link da bio agora', razao: 'a última gagueja em "agora"' }],
  descartados: [{ i: 0, texto: 'ok, vamos lá' }], sincronia: null, voz: { lufs: -14.1, pico_dbtp: -1.0 }
}
const BLOCOS = ['quarto e último', 'verificar o site', 'no [PageSpeed]', 'clique no link', 'da [bio]']

let n = 0
// a marca de mentira que a junção _marca traria: uma pasta comum, com o tokens.css preenchido
const TOKENS = ':root { --f-display: "Fonte Teste", Arial, sans-serif; --w-display-bold: 800; --accent: rgb(10,20,30); }\n'

function preparar({ blocos = BLOCOS, correcoes = { 'PG Speed': 'PageSpeed', Bill: 'bio' }, ficha = FICHA, peca: extra = {}, arquivos = {}, tokens = TOKENS } = {}) {
  const pasta = join(raiz, `p${++n}`)
  mkdirSync(pasta)
  if (tokens !== null) {
    mkdirSync(join(pasta, '_marca'))
    writeFileSync(join(pasta, '_marca', 'tokens.css'), tokens)
  }
  writeFileSync(join(pasta, 'cortes.json'), JSON.stringify(CORTES))
  writeFileSync(join(pasta, 'ficha.json'), JSON.stringify(ficha))
  writeFileSync(join(pasta, 'legenda.json'), JSON.stringify({ correcoes, blocos }))
  writeFileSync(join(pasta, 'peca.json'), JSON.stringify({ ficha: 'ficha.json', gancho: 'seu site lento\nespanta o cliente', capa: 'quatro ajustes antes do site ir pro ar', fatos: [], ...extra }))
  for (const [nome, conteudo] of Object.entries(arquivos)) writeFileSync(join(pasta, nome), conteudo)
  return pasta
}
function peca({ flags = [], ...resto } = {}) {
  const pasta = preparar(resto)
  const r = spawnSync('node', [MOTOR, pasta, ...flags], { encoding: 'utf8' })
  return { codigo: r.status, erro: r.stderr, pasta }
}
const dados = (pasta) => JSON.parse(readFileSync(join(pasta, 'dados.js'), 'utf8').replace(/^window\.DADOS = /, '').replace(/;\s*$/, ''))

test('o válido grava os dados da peça e o relatório', () => {
  const r = peca()
  assert.equal(r.codigo, 0, r.erro)
  const d = dados(r.pasta)
  assert.equal(d.END, 5.0)
  assert.deepEqual(d.legendas.map((b) => b.tokens.map((t) => (t.d ? `[${t.t}]` : t.t)).join(' ')), BLOCOS)
  assert.equal(d.legendas[0].inicio, 0.017, 'a primeira legenda começa em 17 ms (o quadro 0 limpo)')
  assert.equal(d.legendas.at(-1).fim, 5.0, 'a última legenda (a chamada) fica até o END, pelo respiro')
  assert.equal(d.troca_min, 1.5, 'o punch-in não troca de novo antes de 1,5 s')
  assert.deepEqual(d.cortes, [2.5], 'os cortes de imagem que o modelo cobre com punch-in')
  assert.equal(d.ficha.destaque.sublinhado_cor, '#008dff')
  assert.equal(d.gancho.linhas.length, 2)
  assert.equal(d.gancho.ate, 2.5, 'o gancho escrito fica até o fim da primeira frase')
  const rel = readFileSync(join(r.pasta, 'relatorio.md'), 'utf8')
  assert.match(rel, /sem fatos a conferir/)
  assert.match(rel, /gagueja em "agora"/)
  assert.match(rel, /ok, vamos lá/)
  assert.match(rel, /acaba em cima da última palavra/)
  assert.match(rel, /quarto e último/i)
})

test('bloco que ficaria menos de 8 quadros na tela recusa, dizendo qual', () => {
  const r = peca({ blocos: ['quarto', 'e último', 'verificar o site', 'no [PageSpeed]', 'clique no link', 'da [bio]'] })
  assert.equal(r.codigo, 1)
  assert.match(r.erro, /bloco 1 \("quarto"\)/)
  assert.match(r.erro, /quadros/)
})

test('palavra que não bate com a fala recusa; a correção declarada passa', () => {
  const troca = peca({ blocos: ['quarto e último', 'verificar o site', 'no [PageSpeed]', 'clique no botão', 'da [bio]'] })
  assert.equal(troca.codigo, 1)
  assert.match(troca.erro, /"link"/)
  const semCorrecao = peca({ correcoes: { 'PG Speed': 'PageSpeed' } })
  assert.equal(semCorrecao.codigo, 1)
  assert.match(semCorrecao.erro, /"bill"/i)
})

test('palavra que sobra ou que falta recusa', () => {
  const falta = peca({ blocos: BLOCOS.slice(0, -1) })
  assert.equal(falta.codigo, 1)
  assert.match(falta.erro, /falta/)
  const sobra = peca({ blocos: [...BLOCOS, 'agora'] })
  assert.equal(sobra.codigo, 1)
  assert.match(sobra.erro, /sobra/)
})

test('dois destaques seguidos recusam; o bloco oculto não conta como seguido', () => {
  const r = peca({ blocos: ['quarto e último', 'verificar o site', 'no [PageSpeed]', '[clique] no link', 'da bio'] })
  assert.equal(r.codigo, 1)
  assert.match(r.erro, /dois destaques seguidos/)
  const oculto = peca({ blocos: ['quarto e último', 'verificar o site', 'no [PageSpeed]', '~clique no link', 'da [bio]'] })
  assert.equal(oculto.codigo, 1, 'o oculto some da tela: PageSpeed e bio ficam seguidos')
  const ok = peca({ blocos: ['quarto e último', '[verificar] o site', 'no PageSpeed', '~clique no [link]', 'da [bio]'] })
  assert.equal(ok.codigo, 0, ok.erro)
  assert.equal(dados(ok.pasta).legendas[3].oculta, true)
})

test('destaque só de artigo, preposição ou conjunção recusa', () => {
  const r = peca({ blocos: ['quarto [e] último', 'verificar o site', 'no [PageSpeed]', 'clique no link', 'da [bio]'] })
  assert.equal(r.codigo, 1)
  assert.match(r.erro, /destaque/)
})

test('com a caixa minúscula na memória, maiúscula no começo do bloco recusa; com a normal, passa', () => {
  const blocos = ['Quarto e último', 'verificar o site', 'no [PageSpeed]', 'clique no link', 'da [bio]']
  const minuscula = join(raiz, 'escrita-minuscula.md')
  writeFileSync(minuscula, '## Caixa\n\n**Caixa:** minúscula\n')
  const normal = join(raiz, 'escrita-normal.md')
  writeFileSync(normal, '## Caixa\n\n**Caixa:** normal\n')
  const erros = montar(preparar({ blocos }), { conferir: true, memoria: minuscula })
  assert.equal(erros.length, 1, erros.join('\n'))
  assert.match(erros[0], /Quarto/)
  assert.match(erros[0], /escrita-publica/)
  assert.deepEqual(montar(preparar({ blocos }), { conferir: true, memoria: normal }), [])
  // o nome que a pessoa lista no vocabulário da memória vale como nome próprio
  const vocabulario = join(raiz, 'escrita-vocabulario.md')
  writeFileSync(vocabulario, '**Caixa:** minúscula\n\nque esta régua não deve cortar:** Quarto Crescente\n\n')
  assert.deepEqual(montar(preparar({ blocos }), { conferir: true, memoria: vocabulario }), [])
})

test('sem a marca na pasta, ou com o molde, recusa e diz as duas saídas', () => {
  const sem = peca({ tokens: null })
  assert.equal(sem.codigo, 1)
  assert.match(sem.erro, /a marca não está configurada/)
  assert.match(sem.erro, /\/carrossel configurar/)
  assert.match(sem.erro, /"marca": "neutra"/)
  assert.equal(existsSync(join(sem.pasta, 'index.html')), false, 'nada se grava sem a marca')
  const molde = peca({ tokens: '/* ESTADO: nao-configurado */\n:root { --f-display: Arial; }\n' })
  assert.equal(molde.codigo, 1)
  assert.match(molde.erro, /a marca não está configurada/)
  const conferir = peca({ tokens: null, flags: ['--conferir'] })
  assert.equal(conferir.codigo, 1, 'o --conferir também avisa da marca')
  const outra = peca({ peca: { marca: 'a-minha' } })
  assert.equal(outra.codigo, 1)
  assert.match(outra.erro, /o único valor é "neutra"/)
})

test('com a marca, a peça e a capa leem o _marca/tokens.css e o GSAP do _vendor', () => {
  const r = peca()
  assert.equal(r.codigo, 0, r.erro)
  for (const arq of ['index.html', join('compositions', 'capa.html')]) {
    const t = readFileSync(join(r.pasta, arq), 'utf8')
    assert.ok(t.includes('<link rel="stylesheet" href="_marca/tokens.css" />'), `${arq} sem a marca da pasta`)
    assert.ok(t.includes('<script src="_vendor/gsap.min.js"></script>'), `${arq} sem o GSAP local`)
    assert.ok(!t.includes('fonts.googleapis'), `${arq} puxou a fonte neutra com a marca configurada`)
  }
  assert.match(readFileSync(join(r.pasta, 'relatorio.md'), 'utf8'), /marca: a do workspace/)
})

test('a neutra pedida na peca.json sai na Inter, sem a marca, mesmo sem a pasta _marca', () => {
  const r = peca({ tokens: null, peca: { marca: 'neutra' } })
  assert.equal(r.codigo, 0, r.erro)
  for (const arq of ['index.html', join('compositions', 'capa.html')]) {
    const t = readFileSync(join(r.pasta, arq), 'utf8')
    assert.ok(t.includes('fonts.googleapis.com/css2?family=Inter'), `${arq} sem a Inter`)
    assert.ok(/--f-display: 'Inter'/.test(t) && /--accent:/.test(t), `${arq} sem os tokens que as fichas leem`)
    assert.ok(!t.includes('href="_marca/'), `${arq} aponta a marca que não existe`)
  }
  assert.match(readFileSync(join(r.pasta, 'relatorio.md'), 'utf8'), /marca: neutra/)
})

test('sem ficha na peca.json, vale a ficha padrão, a que lê a marca', () => {
  const pasta = preparar()
  const p = JSON.parse(readFileSync(join(pasta, 'peca.json'), 'utf8'))
  delete p.ficha
  writeFileSync(join(pasta, 'peca.json'), JSON.stringify(p))
  assert.deepEqual(montar(pasta), [])
  const ficha = dados(pasta).ficha
  assert.equal(ficha.nome, 'marca')
  assert.equal(ficha.fonte, 'marca')
  assert.match(readFileSync(join(pasta, 'relatorio.md'), 'utf8'), /ficha de legenda: marca/)
})

test('a ficha sem um campo que o modelo lê recusa, dizendo o campo', () => {
  const { contorno, ...semContorno } = FICHA
  const r = peca({ ficha: semContorno })
  assert.equal(r.codigo, 1)
  assert.match(r.erro, /contorno/)
  const semCor = peca({ ficha: { ...FICHA, destaque: { ...FICHA.destaque, cor: undefined } } })
  assert.equal(semCor.codigo, 1)
  assert.match(semCor.erro, /destaque\.cor/)
})

test('o gancho escrito tem no máximo duas linhas e não repete a fala', () => {
  const tres = peca({ peca: { gancho: 'um\ndois\ntrês' } })
  assert.equal(tres.codigo, 1)
  assert.match(tres.erro, /duas linhas/)
  const igual = peca({ peca: { gancho: 'Quarto e último, verificar o site no PG Speed' } })
  assert.equal(igual.codigo, 1)
  assert.match(igual.erro, /repete a fala/)
})

test('o fato entra na tela só com duas fontes e a captura na pasta', () => {
  const fato = { frase: 1, afirmacao: 'o PageSpeed mede a velocidade', fontes: ['https://a.example', 'https://b.example'], captura: 'fato-1.png' }
  const umaFonte = peca({ peca: { fatos: [{ ...fato, fontes: ['https://a.example'] }] }, arquivos: { 'fato-1.png': 'x' } })
  assert.equal(umaFonte.codigo, 1)
  assert.match(umaFonte.erro, /duas fontes/)
  const semCaptura = peca({ peca: { fatos: [fato] } })
  assert.equal(semCaptura.codigo, 1)
  assert.match(semCaptura.erro, /fato-1\.png/)
  const ok = peca({ peca: { fatos: [fato] }, arquivos: { 'fato-1.png': 'x' } })
  assert.equal(ok.codigo, 0, ok.erro)
  const d = dados(ok.pasta)
  assert.deepEqual([d.fatos[0].inicio, d.fatos[0].fim, d.fatos[0].captura], [0, 2.5, 'fato-1.png'])
  assert.match(readFileSync(join(ok.pasta, 'relatorio.md'), 'utf8'), /https:\/\/b\.example/)
})

test('a correção de várias palavras vira uma, e a recusa para no primeiro desencontro', () => {
  const ok = peca()
  assert.equal(ok.codigo, 0, ok.erro)
  assert.equal(dados(ok.pasta).legendas[2].tokens.map((t) => t.t).join(' '), 'no PageSpeed')
  const errado = peca({ blocos: ['quarto e último', 'verificar o carro', 'no [PageSpeed]', 'clique no link', 'da [bio]'] })
  assert.equal(errado.codigo, 1)
  assert.equal((errado.erro.match(/a fala diz/g) || []).length, 1, `a recusa em cascata: ${errado.erro}`)
})

test('bloco com mais palavras que a ficha deixa recusa; uma a mais só passa quando partir deixaria um bloco curto', () => {
  const cinco = peca({ blocos: ['quarto e último', 'verificar o site no [PageSpeed]', 'clique no link', 'da [bio]'] })
  assert.equal(cinco.codigo, 1)
  assert.match(cinco.erro, /5 palavras/)
  // "verificar o site" + "no": o "no" ficaria 3 quadros na tela
  const quatro = peca({ blocos: ['quarto e último', 'verificar o site no', '[PageSpeed]', 'clique no link', 'da [bio]'] })
  assert.equal(quatro.codigo, 0, quatro.erro)
  // "quarto e último" + "verificar": os dois ficariam 8 quadros ou mais, então o de quatro recusa
  const semMotivo = peca({ blocos: ['quarto e último verificar', 'o site no', '[PageSpeed]', 'clique no link', 'da [bio]'] })
  assert.equal(semMotivo.codigo, 1)
  assert.match(semMotivo.erro, /bloco 1 \("quarto e último verificar"\) tem 4 palavras/)
})

test('bloco que não cabe numa linha recusa: a segunda desce para a faixa do Instagram', () => {
  // 74 px em 960 de largura: "aparecerem de forma mais limpa" (30 letras) quebrava
  const larga = peca({ ficha: { ...FICHA, largura: 300 } })
  assert.equal(larga.codigo, 1)
  assert.match(larga.erro, /não cabe numa linha/)
  const ok = peca({ ficha: { ...FICHA, largura: 960 } })
  assert.equal(ok.codigo, 0, ok.erro)
})

test('o --conferir valida os blocos sem gravar a peça', () => {
  const r = peca({ flags: ['--conferir'] })
  assert.equal(r.codigo, 0, r.erro)
  assert.equal(existsSync(join(r.pasta, 'dados.js')), false)
  const ruim = peca({ blocos: ['quarto', 'e último', 'verificar o site', 'no [PageSpeed]', 'clique no link', 'da [bio]'], flags: ['--conferir'] })
  assert.equal(ruim.codigo, 1)
})

test('o --ficha troca a ficha para comparar estilos, sem reescrever a peça', () => {
  const r = peca({ flags: ['--ficha', 'pilula'] })
  assert.equal(r.codigo, 0, r.erro)
  assert.equal(dados(r.pasta).ficha.fundo, '#ffffff')
  assert.equal(JSON.parse(readFileSync(join(r.pasta, 'peca.json'), 'utf8')).ficha, 'ficha.json')
})

test('o destaque de várias palavras sai num trecho só, e o relatório usa as correções', () => {
  const r = peca({ blocos: ['quarto e último', 'verificar o site', 'no [PageSpeed]', 'clique no', '[link da bio]'] })
  assert.equal(r.codigo, 0, r.erro)
  const d = dados(r.pasta)
  assert.deepEqual(d.legendas[4].trechos, [{ t: 'link da bio', d: true }])
  assert.deepEqual(d.legendas[2].trechos, [{ t: 'no', d: false }, { t: 'PageSpeed', d: true }])
  const rel = readFileSync(join(r.pasta, 'relatorio.md'), 'utf8')
  assert.match(rel, /destaques: PageSpeed, link da bio/)
  assert.match(rel, /\| [^|\n]*no PageSpeed \|/, 'a tabela das frases com a correção aplicada')
  assert.doesNotMatch(rel, /\| [^|\n]*PG Speed[^|\n]* \|/, 'a tabela das frases com o texto cru da transcrição')
  assert.match(rel, /correções da transcrição: PG Speed → PageSpeed/)
})

test('o quadro da capa e o punch pedidos na peca.json vencem o padrão', () => {
  const r = peca({ peca: { capa_quadro: 3.9, punch: 1.04 } })
  assert.equal(r.codigo, 0, r.erro)
  assert.match(readFileSync(join(r.pasta, 'compositions', 'capa.html'), 'utf8'), /data-media-start="3\.9"/)
  assert.equal(dados(r.pasta).punch, 1.04)
})

test('o som mixado para outro corte recusa: a voz sairia fora de sincronia', () => {
  const audio = (END_s) => JSON.stringify({ END_s, medidas: { master: { lufs: -14, pico_dbtp: -1.5 } } })
  const velho = peca({ arquivos: { 'relatorio-audio.json': audio(4.2) } })
  assert.equal(velho.codigo, 1)
  assert.match(velho.erro, /som\.py de novo/)
  const certo = peca({ arquivos: { 'relatorio-audio.json': audio(5.0) } })
  assert.equal(certo.codigo, 0, certo.erro)
  // sem END_s, a comparação daria NaN e passaria calada
  const semEnd = peca({ arquivos: { 'relatorio-audio.json': JSON.stringify({ medidas: {} }) } })
  assert.equal(semEnd.codigo, 1)
  assert.match(semEnd.erro, /som\.py de novo/)
})
