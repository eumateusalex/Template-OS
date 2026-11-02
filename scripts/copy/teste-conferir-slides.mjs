// Prova da régua do texto dos slides (scripts/copy/conferir-slides.mjs).
// Um carrossel de dica de mentira, com capa, índice, passo e fecho: o texto de
// cada slide sai do HTML do jeito que a pessoa lê, o índice não vira uma frase
// só, a moldura (@ e contador) fica de fora, e a régua reprova o que deve.
//
// Rodar: node --test scripts/copy/teste-conferir-slides.mjs
//
// Nenhuma prova lê a memória real do workspace: cada uma aponta, por --memoria,
// para um escrita-publica.md de mentira numa pasta temporária.
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { textoDosSlides, conferirSlides, lerArgumentos } from './conferir-slides.mjs'

const CLI = join(dirname(fileURLToPath(import.meta.url)), 'conferir-slides.mjs')
const PASTA = mkdtempSync(join(tmpdir(), 'slides-'))
after(() => rmSync(PASTA, { recursive: true, force: true }))
const grava = (nome, conteudo) => { const arq = join(PASTA, nome); writeFileSync(arq, conteudo); return arq }
const MEM = grava('memoria.md', '# Escrita pública\n\n**Liste aqui as palavras suas\nque esta régua não deve cortar:** *(a definir)*\n\n## Caixa\n\n**Caixa:** normal\n')

const moldura = n => `<div class="hdr"><span class="handle">@perfil.exemplo</span></div>
  <div class="ftr"><div class="bar"><i></i></div><span class="count">${n}/4</span><span class="chev">›</span></div>`

// O índice tem cinco itens sem pontuação: juntos, dariam uma frase de 40 palavras.
const CARROSSEL = `<!DOCTYPE html><html><head><style>.slide{width:1080px}</style></head><body>
<!-- 1 · capa -->
<div class="slide cover">
  ${moldura(1)}
  <div class="body">
    <div class="kick">Bolo de pote</div>
    <h1>Você perde o bolo de pote <em>na geladeira</em>.</h1>
    <div class="sub">Três cuidados que seguram a venda da semana.</div>
  </div>
</div>
<div class="slide dark">
  ${moldura(2)}
  <div class="kick">O que vem pela frente</div>
  <div class="indice">
    <div class="item"><span class="n">01</span><div><b>Pote de vidro com tampa de rosca</b><span>segura a umidade do recheio</span></div></div>
    <div class="item"><span class="n">02</span><div><b>Geladeira na prateleira do meio</b><span>longe da porta que abre toda hora</span></div></div>
    <div class="item"><span class="n">03</span><div><b>Etiqueta com o dia em que montou</b><span>quem compra vê a data</span></div></div>
    <div class="item"><span class="n">04</span><div><b>Cobertura só na hora de vender</b><span>o chantili não murcha</span></div></div>
    <div class="item"><span class="n">05</span><div><b>Colher junto do pote na entrega</b><span>o cliente come no caminho</span></div></div>
  </div>
</div>
<div class="slide light">
  ${moldura(3)}
  <h2>A porta da geladeira esquenta.</h2>
  <p class="lead">Cada vez que a porta abre o recheio do pote que fica ali na frente perde o ponto e azeda antes do fim de semana chegar.</p>
</div>
<div class="slide cta">
  ${moldura(4)}
  <h2>Hoje, mude os potes para a prateleira do meio.</h2>
</div>
</body></html>`

const HTML = grava('carrossel.html', CARROSSEL)
grava('legenda.txt', 'Você perde venda quando o pote azeda antes do sábado.\nA porta da geladeira é o lugar mais quente dela.\nHoje, mude os potes para a prateleira do meio.\n')

test('cada item do índice é um trecho próprio, e a moldura fica de fora', () => {
  const slides = textoDosSlides(CARROSSEL)
  assert.equal(slides.length, 4)
  const indice = slides[1].trechos
  assert.ok(indice.length >= 11, `esperava o sobretítulo e dois trechos por item, saiu ${JSON.stringify(indice)}`)
  assert.ok(indice.includes('Pote de vidro com tampa de rosca segura a umidade do recheio'), JSON.stringify(indice))
  const tudo = slides.flatMap(s => s.trechos).join(' | ')
  assert.doesNotMatch(tudo, /@perfil|\/4|›|width:1080/, 'o @, o contador, a seta e o CSS não são texto do slide')
})

test('a capa: o título é o h1, sem o espaço que a tag de linha deixa antes do ponto', () => {
  const [capa] = textoDosSlides(CARROSSEL)
  assert.equal(capa.titulo, 'Você perde o bolo de pote na geladeira.')
  assert.deepEqual(capa.trechos, ['Bolo de pote', 'Você perde o bolo de pote na geladeira.', 'Três cuidados que seguram a venda da semana.'])
})

test('o índice não vira frase longa; a frase longa de verdade, num parágrafo, avisa', () => {
  const { erros, avisos } = conferirSlides(CARROSSEL, { memoria: MEM, legenda: 'Você perde venda quando o pote azeda antes do sábado.\nA porta da geladeira é o lugar mais quente.\nHoje, mude os potes.' })
  assert.deepEqual(erros, [])
  assert.ok(!avisos.some(a => a.startsWith('slide 2 ')), `o índice acusou: ${JSON.stringify(avisos)}`)
  assert.ok(avisos.some(a => a.startsWith('slide 3 tem 1 frase(s) acima de 14')), JSON.stringify(avisos))
})

test('a régua reprova no slide: número sem fonte e travessão', () => {
  const ruim = CARROSSEL.replace('A porta da geladeira esquenta.', 'A porta da geladeira esquenta em 3 minutos — sempre.')
  const { erros } = conferirSlides(ruim, { memoria: MEM })
  assert.ok(erros.some(e => e.includes('sem fonte declarada') && e.includes('slide 3: "3 minutos"')), JSON.stringify(erros))
  assert.ok(erros.some(e => e.startsWith('slide 3 tem travessão')), JSON.stringify(erros))
  const declarado = conferirSlides(ruim, { memoria: MEM, meta: { numeros: [{ valor: '3 minutos', fonte: 'exemplo' }] } })
  assert.ok(!declarado.erros.some(e => e.includes('sem fonte declarada')), JSON.stringify(declarado.erros))
})

// mutação: scripts/copy/conferir-slides.mjs · "dmLigada }, 'a arte'))" → "dmLigada }, 'a arte').slice(0, 0))" · pega em 01/11/2026
test('a isca de direct escrita na arte reprova sem a série no meta, e passa com ela', () => {
  const isca = CARROSSEL.replace('A porta da geladeira esquenta.', 'A porta da geladeira esquenta. Comenta BOLO que eu te mando a lista.')
  assert.ok(!conferirSlides(CARROSSEL, { memoria: MEM }).erros.some(e => e.startsWith('a arte promete direct')), 'o carrossel sem isca acusou isca')
  const { erros } = conferirSlides(isca, { memoria: MEM })
  assert.ok(erros.some(e => e.startsWith('a arte promete direct') && e.includes('"serie" no --meta')), JSON.stringify(erros))
  const daSerie = conferirSlides(isca, { memoria: MEM, meta: { serie: 'lista', palavra: 'BOLO' } })
  assert.ok(!daSerie.erros.some(e => e.startsWith('a arte')), JSON.stringify(daSerie.erros))
  const palavraErrada = conferirSlides(isca, { memoria: MEM, meta: { serie: 'lista', palavra: 'POTE' } })
  assert.ok(palavraErrada.erros.some(e => e.startsWith('a arte pede "Comenta BOLO"')), JSON.stringify(palavraErrada.erros))
})

test('a capa que não fala com a pessoa reprova pela capa extraída do HTML', () => {
  const { erros } = conferirSlides(CARROSSEL.replace('Você perde o bolo de pote', 'O bolo de pote estraga'), { memoria: MEM })
  assert.ok(erros.some(e => e.startsWith('a capa não fala COM a pessoa')), JSON.stringify(erros))
})

test('pela linha de comando: lê a legenda ao lado, sai 0 no texto bom e 1 no ruim', () => {
  const bom = spawnSync(process.execPath, [CLI, HTML, '--memoria', MEM], { encoding: 'utf8' })
  assert.equal(bom.status, 0, bom.stdout + bom.stderr)
  assert.match(bom.stdout, /✓ o texto passa · 4 slides e a legenda/)
  const ruim = grava('ruim.html', CARROSSEL.replace('Hoje, mude', 'Segue lá e mude'))
  const r = spawnSync(process.execPath, [CLI, ruim, '--memoria', MEM, '--sem-legenda'], { encoding: 'utf8' })
  assert.equal(r.status, 1, r.stdout + r.stderr)
  assert.match(r.stdout, /slide 4 pede para seguir com "segue lá"/)
  assert.match(r.stdout, /sem legenda/)
})

test('pela linha de comando: uso errado e HTML sem slide saem 2', () => {
  assert.equal(spawnSync(process.execPath, [CLI], { encoding: 'utf8' }).status, 2)
  assert.equal(spawnSync(process.execPath, [CLI, HTML, '--cliente'], { encoding: 'utf8' }).status, 2, '--cliente sem --caixa')
  const vazio = grava('vazio.html', '<html><body><p>sem slide</p></body></html>')
  assert.equal(spawnSync(process.execPath, [CLI, vazio, '--memoria', MEM], { encoding: 'utf8' }).status, 2)
  assert.equal(lerArgumentos([HTML, '--cliente', '--caixa', 'minúscula']).opcoes.memoria, false)
})
