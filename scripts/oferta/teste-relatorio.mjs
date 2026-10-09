// Prova do gerador do relatório da /oferta (scripts/oferta/relatorio.py).
// Monta um relatorio.json e um acervo de prova, gera o HTML e confere:
// português, as cores lidas dos tokens da marca (e a reserva sem ela), nada de
// fora da página, e que citação ruim (link trocado, link que não é https,
// trecho que não existe, frase que não está no acervo) avisa e reprova.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { montarAcervo, endereco } from './provas/acervo.mjs'

const RELATORIO = join(dirname(fileURLToPath(import.meta.url)), 'relatorio.py')
const PYTHON = process.env.PYTHON || 'python'

const FONTE = { title: 'Preço pelo fechamento', published: '2026-03-12', source: 'precos' }
const ACERVO = [
  { ep: 'precos', titulo: FONTE.title, inicio: 0, texto: 'Se você fecha mais de 80 por cento, o preço está baixo. Essa é a regra de bolso.' },
  { ep: 'precos', titulo: FONTE.title, inicio: 90, texto: 'Entre 30 e 40 por cento, o preço está no lugar.' },
  { ep: 'trava', titulo: 'Ache a sua trava', inicio: 0, texto: 'Descubra como resolver a trava principal.' }
]
const BOA = { ...FONTE, quote: 'Se você fecha mais de 80 por cento, o preço está baixo.', file: 'precos/000000.md', url: endereco('precos', 0), start_seconds: 0 }

function relatorio (evidencias, extra = {}) {
  return {
    meta: { title: 'a trava é a agenda do dono', subject: 'Escritório Prova', date: '2026-10-02', lede: 'O dono vende e entrega sozinho.' },
    verdict: { headline: 'A agenda do dono é o teto.', summary: ['Primeiro parágrafo.'], constraint: 'Capacidade do dono', confidence: 'high' },
    constraints: [
      { rank: 1, title: 'Agenda do dono', note: 'Tudo passa por ele.', target: 'agenda', impact: 90 },
      { rank: 2, title: 'Preço', note: 'Fecha demais.', target: 'preco', impact: 60 },
      { rank: 3, title: 'Retenção', note: 'Sem mensalidade.', target: 'preco', impact: 30 }
    ],
    snapshot: [
      { field: 'Oferta', value: 'R$ 5 mil', status: 'verified' },
      { field: 'Fechamento', value: '70%', status: 'inferred' },
      { field: 'CAC', value: '', status: 'missing' }
    ],
    sections: [
      { id: 'agenda', title: 'A agenda', summary: 'Uma linha.', subsections: [{ title: 'Um gargalo por vez', plain: 'Só a parte estreita importa.', body: ['Parágrafo do acervo.'], evidence: evidencias, synthesis: 'Nossa interpretação.', callout: { type: 'action', text: 'Faça isto.' } }] },
      { id: 'preco', title: 'O preço', subsections: [{ title: 'Fechamento é sinal de preço', body: ['Texto.'] }] }
    ],
    actions: [{ priority: 1, action: 'Subir o preço', why: 'Fecha demais', owner: 'Dono', due: 'Semana 1' }],
    assumptions: ['O fechamento de 70% é de um mês só.'],
    ...extra
  }
}

const RUINS = [
  BOA,
  { ...FONTE, quote: 'Citação com o tempo trocado.', file: 'precos/000090.md', url: 'https://videos.exemplo.com/precos?t=300', start_seconds: 90 },
  { ...FONTE, quote: 'Entre 30 e 40 por cento, o preço está no lugar.', file: 'precos/000090.md', url: 'https://videos.exemplo.com/precos?t=92', start_seconds: 90 },
  { quote: 'Citação inventada.', file: 'inventada/000000.md', url: 'https://exemplo.com/video', title: 'Fonte que não existe', start_seconds: 0 },
  { quote: 'Outra inventada.', file: 'precos/000000.md', url: 'javascript:alert(1)', title: 'Script', start_seconds: 3 },
  { quote: 'Endereço sem https.', file: 'precos/000000.md', url: 'http://exemplo.com/inseguro', title: 'Inseguro', start_seconds: 0 },
  { ...BOA, quote: 'Sempre baixe o preço para ganhar.' }
]

function gerar (dados, { comAcervo = true, tokens = null } = {}) {
  const pasta = mkdtempSync(join(tmpdir(), 'relatorio-'))
  const acervo = montarAcervo(ACERVO)
  const entrada = join(pasta, 'relatorio.json')
  const saida = join(pasta, 'relatorio.html')
  writeFileSync(entrada, JSON.stringify(dados))
  const args = [RELATORIO, entrada, '-o', saida, '--acervo', comAcervo ? acervo : join(tmpdir(), 'acervo-que-nao-existe-080')]
  // tokens: o texto de um tokens.css de prova, ou um caminho que não existe ({ ausente: true }).
  if (tokens !== null) {
    const caminho = join(pasta, 'marca', 'tokens.css')
    if (!tokens.ausente) { mkdirSync(dirname(caminho), { recursive: true }); writeFileSync(caminho, tokens) }
    args.push('--tokens', caminho)
  }
  const r = spawnSync(PYTHON, args, { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } })
  const html = existsSync(saida) ? readFileSync(saida, 'utf8') : ''
  const md = existsSync(join(pasta, 'relatorio.md')) ? readFileSync(join(pasta, 'relatorio.md'), 'utf8') : ''
  rmSync(pasta, { recursive: true, force: true })
  rmSync(acervo, { recursive: true, force: true })
  return { r, html, md }
}

test('relatório limpo: HTML em português, relatorio.md ao lado, a contagem do acervo no chip e saída 0', () => {
  const { r, html, md } = gerar(relatorio([BOA]))
  assert.equal(r.status, 0, r.stderr)
  assert.doesNotMatch(r.stderr, /!/, 'relatório limpo não avisa nada')
  for (const rotulo of ['As três maiores travas', 'Em palavras simples', 'O que o acervo diz', 'Nossa leitura', 'Diagnóstico', 'Trava principal', 'Retrato do negócio', 'Plano de ação', 'Fontes', 'Riscos, suposições e dados que faltam']) {
    assert.ok(html.includes(rotulo), `falta o rótulo "${rotulo}"`)
  }
  for (const ingles of ['Top three constraints', 'Source evidence', 'Our reading', 'Executive diagnosis', 'In plain terms']) {
    assert.ok(!html.includes(ingles), `sobrou o rótulo em inglês "${ingles}"`)
  }
  assert.match(html, /3 trechos &middot; 2 fontes/, 'a contagem do chip vem do acervo lido')
  assert.ok(html.includes(`href="${endereco('precos', 0)}"`), 'a citação conferida não ficou clicável')
  assert.match(html, /acervo: precos\/000000\.md/, 'a citação não diz o arquivo do acervo')
  assert.match(md, /## Diagnóstico/)
  assert.match(md, /\[Preço pelo fechamento · 0:00\]\(https:\/\/videos\.exemplo\.com\/precos\?t=0\) · acervo: `precos\/000000\.md`/)
  assert.match(r.stderr, /1 citações no relatório, 1 conferidas/)
})

test('citação de trecho sem endereço: a fonte é o arquivo, sem link e sem aviso', () => {
  const { r, html, md } = gerar(relatorio([{ quote: 'Descubra como resolver a trava principal.', file: 'trava/000000.md', title: 'Ache a sua trava' }]))
  assert.equal(r.status, 0, r.stderr)
  assert.match(html, /acervo: trava\/000000\.md/)
  assert.match(md, /Ache a sua trava · acervo: `trava\/000000\.md`/)
  assert.doesNotMatch(md, /link descartado/)
})

test('o selo de cada valor sai em português', () => {
  const { html } = gerar(relatorio([BOA]))
  assert.match(html, /class="st st-verified">confirmado</)
  assert.match(html, /class="st st-inferred">deduzido</)
  assert.match(html, /class="st st-missing">faltando</)
})

// Um tokens.css de prova no formato do molde do /carrossel, com o @import de fonte
// que a marca de verdade traz: o painel usa as cores e a família, nunca o @import.
const TOKENS = `@import url('https://fonts.googleapis.com/css2?family=Fonte+Prova&display=swap');
:root{
  --c-dark:        10,20,30;     /* principal */
  --c-light:       250,249,248;  /* fundo claro */
  --c-accent:      200,60,40;    /* acento */
  --f-display: 'Fonte Prova', Arial, sans-serif;
}`

test('a página não pede nada de fora e pinta com os tokens da marca', () => {
  const { r, html } = gerar(relatorio([BOA]), { tokens: TOKENS })
  assert.equal(r.status, 0, r.stderr)
  assert.doesNotMatch(html, /<(script|link|img)[^>]+(src|href)="https?:/i, 'recurso de fora da página')
  assert.doesNotMatch(html, /@import|url\(\s*['"]?https?:|googleapis/i, 'CSS puxando de fora')
  assert.match(html, /--c-dark:10,20,30;/, 'a cor principal não veio dos tokens')
  assert.match(html, /--c-light:250,249,248;/, 'o fundo não veio dos tokens')
  assert.match(html, /--c-accent:200,60,40;/, 'o acento não veio dos tokens')
  assert.match(html, /--f:'Fonte Prova', Arial, sans-serif;/, 'a família não veio dos tokens')
  assert.doesNotMatch(r.stderr, /marca não configurada/, 'marca configurada não avisa')
  assert.doesNotMatch(html, /#008dff|#012894|Inter 4|#5001D6|#2600EF|Antarctican/i, 'sobrou marca fixa no gerador')
  assert.doesNotMatch(html.split('<style>')[1].split('</style>')[0], /#[0-9a-f]{3,6}\b/i, 'cor escrita à mão no CSS')
})

test('a logo ao lado dos tokens entra embutida, sem pedir nada de fora', () => {
  const pasta = mkdtempSync(join(tmpdir(), 'marca-'))
  const acervo = montarAcervo(ACERVO)
  try {
    mkdirSync(join(pasta, 'marca', 'logo'), { recursive: true })
    writeFileSync(join(pasta, 'marca', 'tokens.css'), TOKENS)
    // Um PNG de 1 pixel.
    writeFileSync(join(pasta, 'marca', 'logo', 'logo-escura.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64'))
    writeFileSync(join(pasta, 'relatorio.json'), JSON.stringify(relatorio([BOA])))
    const r = spawnSync(PYTHON, [RELATORIO, join(pasta, 'relatorio.json'), '-o', join(pasta, 'p.html'), '--acervo', acervo, '--tokens', join(pasta, 'marca', 'tokens.css')], { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } })
    assert.equal(r.status, 0, r.stderr)
    assert.match(readFileSync(join(pasta, 'p.html'), 'utf8'), /<img src="data:image\/png;base64,/)
  } finally {
    rmSync(pasta, { recursive: true, force: true })
    rmSync(acervo, { recursive: true, force: true })
  }
})

test('sem -o, o painel vai para a pasta do json com o assunto e a data no nome', () => {
  const pasta = mkdtempSync(join(tmpdir(), 'relatorio-'))
  const acervo = montarAcervo(ACERVO)
  try {
    writeFileSync(join(pasta, 'relatorio.json'), JSON.stringify(relatorio([BOA])))
    const r = spawnSync(PYTHON, [RELATORIO, join(pasta, 'relatorio.json'), '--acervo', acervo], { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } })
    assert.equal(r.status, 0, r.stderr)
    assert.ok(existsSync(join(pasta, 'Escritório Prova · diagnóstico · 2026-10-02.html')), r.stderr)
    assert.ok(existsSync(join(pasta, 'relatorio.md')))
  } finally {
    rmSync(pasta, { recursive: true, force: true })
    rmSync(acervo, { recursive: true, force: true })
  }
})

test('marca em branco: paleta do molde, uma linha de aviso, e não reprova', () => {
  const { r, html } = gerar(relatorio([BOA]), { tokens: '/* ESTADO: nao-configurado */\n:root{ --c-dark: 28,28,32; --c-light: 244,243,240; --c-accent: 214,120,48; }' })
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stderr, /marca não configurada/)
  assert.match(html, /--c-accent:214,120,48;/)
})

test('tokens que não existem: paleta de reserva, aviso, e não reprova', () => {
  const { r, html } = gerar(relatorio([BOA]), { tokens: { ausente: true } })
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stderr, /paleta de reserva/)
  assert.match(html, /--c-accent:70,90,120;/)
})

test('canal fora de 0 a 255 e família com caractere estranho caem na reserva', () => {
  const { r, html } = gerar(relatorio([BOA]), { tokens: ":root{ --c-accent: 300,0,0; --f-display: x}</style><script>alert(1)</script>; }" })
  assert.equal(r.status, 0, r.stderr)
  assert.match(html, /--c-accent:70,90,120;/)
  assert.doesNotMatch(html, /alert\(1\)/)
  assert.match(html, /--f:'Helvetica Neue'/)
})

test('citação ruim avisa, some dos dois formatos e faz sair 3', () => {
  const { r, html, md } = gerar(relatorio(RUINS))
  assert.equal(r.status, 3, 'aviso de citação tem que reprovar a entrega')
  // Um dono só para o link: o acervo. O link tem que ser o do trecho, exato.
  assert.equal((r.stderr.match(/o link não é o do trecho no acervo \(https:\/\/videos\.exemplo\.com\/precos\?t=90\)/g) || []).length, 2, r.stderr)
  assert.match(r.stderr, /inventada\/000000\.md não existe no acervo/)
  assert.match(r.stderr, /link descartado \(não é https\): javascript:alert\(1\)/)
  assert.match(r.stderr, /link descartado \(não é https\): http:\/\/exemplo\.com\/inseguro/)
  assert.match(r.stderr, /a frase não está no trecho do acervo/)
  assert.doesNotMatch(r.stderr, /citação fora do acervo[^\n]*não é https/, 'o link que não é https avisou duas vezes')
  assert.ok(html.length > 0, 'com aviso o painel ainda é gravado')
  assert.match(md, /Fonte que não existe · 0:00 \(link descartado\)/, 'o relatorio.md não foi gravado, ou não marcou o link descartado')
  assert.ok(!html.includes('t=92') && !md.includes('t=92'), 'o link que o acervo reprovou ficou clicável')
  assert.ok(!html.includes('t=300') && !md.includes('t=300'), 'o link que o acervo reprovou ficou clicável')
  for (const [nome, texto] of [['HTML', html], ['relatorio.md', md]]) {
    assert.ok(!texto.includes('https://exemplo.com/video'), `o link inventado ficou no ${nome}`)
    assert.ok(!texto.includes('http://exemplo.com/inseguro'), `o link sem https ficou no ${nome}`)
    assert.ok(!texto.includes('javascript:'), `o javascript: ficou no ${nome}`)
  }
  assert.ok(html.includes(`href="${endereco('precos', 0)}"`), 'a citação boa perdeu o link junto com as ruins')
})

test('relatório sem citação nenhuma reprova, e o apêndice de fontes diz isso', () => {
  const { r, html, md } = gerar(relatorio([]))
  assert.equal(r.status, 3)
  assert.match(r.stderr, /nenhuma citação/)
  assert.match(html, /não tem nenhuma citação do acervo/)
  assert.match(md, /não tem nenhuma citação do acervo/)
})

test('seção que não é objeto não derruba o relatorio.md', () => {
  const dados = relatorio([BOA])
  dados.sections.unshift('texto solto')
  const { r, md } = gerar(dados)
  assert.equal(r.status, 0, r.stderr)
  assert.match(md, /## Diagnóstico/)
})

test('sem acervo para conferir, o relatório sai mas reprova', () => {
  const { r, html } = gerar(relatorio([BOA]), { comAcervo: false })
  assert.equal(r.status, 3)
  assert.match(r.stderr, /não conferi as citações/)
  assert.match(r.stderr, /acervo-que-nao-existe-080/)
  assert.ok(html.length > 0)
  assert.match(html, /acervo não conferido/)
})

test('o rank da trava não abre brecha no HTML', () => {
  const dados = relatorio([BOA])
  dados.constraints[0].rank = '1" autofocus onfocus="document.title=1'
  const { r, html } = gerar(dados)
  assert.equal(r.status, 0, r.stderr)
  assert.doesNotMatch(html, /onfocus/)
})

test('texto com HTML sai escapado, e o markdown leve vira negrito, itálico e código', () => {
  const dados = relatorio([BOA])
  dados.verdict.headline = '<img src=x onerror=alert(1)> **caro** e *lento* com `x<y`'
  const { r, html } = gerar(dados)
  assert.equal(r.status, 0, r.stderr)
  assert.doesNotMatch(html, /<img src=x/)
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt; <strong>caro<\/strong> e <em>lento<\/em> com <code>x&lt;y<\/code>/)
})

test('a trava aponta para a seção do target, e caixa de tipo desconhecido vira cinza', () => {
  const dados = relatorio([BOA])
  dados.sections[0].subsections[0].callout = { type: 'outro', text: 'Sem tipo.' }
  const { r, html } = gerar(dados)
  assert.equal(r.status, 0, r.stderr)
  assert.match(html, /href="#sec-agenda"/)
  assert.match(html, /id="sec-agenda"/)
  assert.match(html, /class="caixa caixa-outra"/)
})

test('json ilegível sai 2 sem gravar nada', () => {
  const pasta = mkdtempSync(join(tmpdir(), 'relatorio-'))
  try {
    writeFileSync(join(pasta, 'relatorio.json'), '{ não é json')
    const r = spawnSync(PYTHON, [RELATORIO, join(pasta, 'relatorio.json'), '-o', join(pasta, 'p.html')], { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } })
    assert.equal(r.status, 2)
    assert.ok(!existsSync(join(pasta, 'p.html')))
  } finally { rmSync(pasta, { recursive: true, force: true }) }
})
