// Prova da busca no acervo da /oferta (scripts/oferta/buscar.mjs).
// Roda num acervo de prova (scripts/oferta/provas/acervo.mjs), no formato que a
// skill lê.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { montarAcervo, BONS, endereco } from './provas/acervo.mjs'

const BUSCAR = join(dirname(fileURLToPath(import.meta.url)), 'buscar.mjs')

function rodar (args, env = {}) {
  const { NODE_TEST_CONTEXT, ...base } = process.env
  return spawnSync(process.execPath, [BUSCAR, ...args], { encoding: 'utf8', env: { ...base, ...env } })
}

function comAcervo (trechos, fn, opcoes) {
  const acervo = montarAcervo(trechos, opcoes)
  try { fn(acervo) } finally { rmSync(acervo, { recursive: true, force: true }) }
}

test('ordena pelo trecho mais relevante e devolve o arquivo, o endereço e o carimbo', () => comAcervo(BONS, acervo => {
  const r = rodar(['fechamento preço', '--acervo', acervo, '--json'])
  assert.equal(r.status, 0, r.stderr)
  const achados = JSON.parse(r.stdout)
  assert.equal(achados[0].file, 'aaa/000090.md')
  assert.equal(achados[0].source, 'aaa')
  assert.equal(achados[0].start_seconds, 90)
  assert.equal(achados[0].url, endereco('aaa', 90))
  assert.equal(achados[0].stamp, '1:30')
  assert.equal(achados[0].title, 'Preço pelo fechamento')
  assert.match(achados[0].quote, /preço está baixo/)
  assert.doesNotMatch(achados[0].quote, /^# /, 'o título do arquivo não entra no texto')
  assert.ok(!achados.some(a => a.source === 'bbb'), 'trecho sem termo nenhum da pergunta não entra')
}))

test('a pergunta acha o termo com ou sem acento', () => comAcervo(BONS, acervo => {
  const [primeiro] = JSON.parse(rodar(['preco fechamento', '--acervo', acervo, '--json']).stdout)
  assert.equal(primeiro.file, 'aaa/000090.md')
}))

test('a ordem vem da pontuação, não da ordem das pastas', () => comAcervo([{ ...BONS[2], ep: 'aaa' }, { ...BONS[0], ep: 'zzz' }], acervo => {
  const r = rodar(['fechamento preço', '--acervo', acervo, '--json'])
  assert.deepEqual(JSON.parse(r.stdout).map(a => a.source), ['zzz', 'aaa'])
}))

test('o mesmo texto em dois arquivos aparece uma vez só', () => comAcervo([...BONS, { ...BONS[0], ep: 'aab' }], acervo => {
  const achados = JSON.parse(rodar(['fechamento preço', '--acervo', acervo, '--json']).stdout)
  assert.equal(achados.filter(a => /preço está baixo/.test(a.quote)).length, 1)
}))

test('lê o acervo com fim de linha do Windows', () => comAcervo(BONS, acervo => {
  const r = rodar(['fechamento preço', '--acervo', acervo, '--json'])
  assert.equal(r.status, 0, r.stderr)
  const [primeiro] = JSON.parse(r.stdout)
  assert.equal(primeiro.title, 'Preço pelo fechamento')
  assert.equal(primeiro.url, endereco('aaa', 90))
  assert.equal(rodar(['--conferir', '--acervo', acervo]).status, 0)
}, { crlf: true }))

test('título com aspas escapadas no frontmatter sai limpo', () => comAcervo([{ ep: 'fff', titulo: '\\"Como subir o LTV\\"', inicio: 0, texto: 'o valor do cliente cresce com a retenção' }], acervo => {
  const [primeiro] = JSON.parse(rodar(['retenção', '--acervo', acervo, '--json']).stdout)
  assert.equal(primeiro.title, '"Como subir o LTV"')
}))

test('transcrição solta, sem frontmatter: título do "# " ou do nome, sem endereço e sem carimbo', () => comAcervo([], acervo => {
  const achados = JSON.parse(rodar(['garantia', '--acervo', acervo, '--json']).stdout)
  const porArquivo = Object.fromEntries(achados.map(a => [a.file, a]))
  assert.equal(porArquivo['palestras/garantia.md'].title, 'A garantia que vende')
  assert.equal(porArquivo['palestras/garantia.md'].source, 'palestras')
  assert.equal(porArquivo['reuniao-garantia.txt'].title, 'reuniao-garantia')
  assert.equal(porArquivo['reuniao-garantia.txt'].source, 'reuniao-garantia')
  for (const a of achados) {
    assert.equal(a.url, null)
    assert.equal(a.start_seconds, null)
    assert.equal(a.stamp, undefined)
  }
}, { soltos: { 'palestras/garantia.md': '# A garantia que vende\n\nGarantia sem consequência não tira o risco.', 'reuniao-garantia.txt': 'A garantia condicional pede a parte do cliente.' } }))

test('pasta do .git dentro do acervo não entra', () => comAcervo(BONS, acervo => {
  const r = rodar(['--conferir', '--acervo', acervo])
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assert.match(r.stdout, /3 trechos/)
}, { soltos: { '.git/notas.md': 'nada' } }))

test('corta no limite pedido', () => comAcervo(BONS, acervo => {
  const r = rodar(['fechamento', '--acervo', acervo, '--json', '--limite', '1'])
  assert.equal(r.status, 0, r.stderr)
  assert.equal(JSON.parse(r.stdout).length, 1)
}))

test('a saída de texto traz título, carimbo, arquivo e endereço de cada trecho', () => comAcervo(BONS, acervo => {
  const r = rodar(['isca', '--acervo', acervo])
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stdout, /Iscas que funcionam · 0:00/)
  assert.match(r.stdout, /acervo: bbb\/000000\.md · https:\/\/videos\.exemplo\.com\/bbb\?t=0/)
}))

test('a variável OFERTA_ACERVO aponta o acervo', () => comAcervo(BONS, acervo => {
  const r = rodar(['--conferir'], { OFERTA_ACERVO: acervo })
  assert.equal(r.status, 0, r.stdout + r.stderr)
}))

test('sem acervo no caminho sai 1 e diz onde procurou e como montar', () => {
  const r = rodar(['fechamento', '--acervo', join(tmpdir(), 'acervo-que-nao-existe-080')])
  assert.equal(r.status, 1)
  assert.match(r.stderr, /acervo-que-nao-existe-080/)
  assert.match(r.stderr, /Para montar/)
  assert.match(r.stderr, /OFERTA_ACERVO/)
})

test('acervo vazio reprova a busca e o --conferir: verde medindo zero é vermelho', () => comAcervo([], acervo => {
  for (const args of [['fechamento'], ['--conferir']]) {
    const r = rodar([...args, '--acervo', acervo])
    assert.equal(r.status, 1, `${args.join(' ')} aprovou um acervo vazio`)
    assert.match(r.stderr, /vazio/)
  }
}))

test('pergunta vazia sai 2', () => {
  assert.equal(rodar(['   ']).status, 2)
})

test('--conferir sai 0 com o acervo íntegro e diz quantos trechos leu', () => comAcervo(BONS, acervo => {
  const r = rodar(['--conferir', '--acervo', acervo])
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stdout, /3 trechos de 3 fontes/)
}))

test('--conferir aceita trecho sem endereço: a fonte é o arquivo', () => comAcervo([...BONS, { ep: 'sem', titulo: 'Sem endereço', inicio: 0, texto: 'x', url: null }], acervo => {
  assert.equal(rodar(['--conferir', '--acervo', acervo]).status, 0)
}))

test('--conferir sai 1 quando o t= do endereço diverge do início, e diz qual', () => comAcervo([...BONS, { ep: 'ddd', titulo: 'Tempo trocado', inicio: 90, texto: 'x', url: 'https://videos.exemplo.com/ddd?t=300' }], acervo => {
  const r = rodar(['--conferir', '--acervo', acervo])
  assert.equal(r.status, 1)
  assert.match(r.stdout, /ddd\/000090\.md.*t= do endereço \(300 s\) diverge do início \(90 s\)/)
}))

test('--conferir sai 1 com endereço que não é https', () => comAcervo([...BONS, { ep: 'eee', titulo: 'Endereço inseguro', inicio: 0, texto: 'x', url: 'http://exemplo.com/eee' }], acervo => {
  const r = rodar(['--conferir', '--acervo', acervo])
  assert.equal(r.status, 1)
  assert.match(r.stdout, /eee.*não é https/)
}))

test('--conferir sai 1 com trecho sem texto', () => comAcervo([...BONS, { ep: 'ggg', titulo: 'Vazio', inicio: 0, texto: '' }], acervo => {
  const r = rodar(['--conferir', '--acervo', acervo])
  assert.equal(r.status, 1)
  assert.match(r.stdout, /ggg.*não tem texto/)
}))

// --- a conferência das citações de um relatório ou de um texto de resposta

function relatorioCom (evidencias) {
  const caminho = join(tmpdir(), `relatorio-${process.pid}-${Math.random().toString(36).slice(2)}.json`)
  writeFileSync(caminho, JSON.stringify({ sections: [{ title: 'S', subsections: [{ title: 'T', evidence: evidencias }] }] }))
  return caminho
}

function textoCom (conteudo) {
  const caminho = join(tmpdir(), `texto-${process.pid}-${Math.random().toString(36).slice(2)}.md`)
  writeFileSync(caminho, conteudo)
  return caminho
}

const CERTA = { quote: 'O fechamento diz o preço.', file: 'aaa/000090.md', url: endereco('aaa', 90), start_seconds: 90 }

test('--conferir-citacoes aprova a citação que está no trecho, e conta o acervo', () => comAcervo(BONS, acervo => {
  const json = relatorioCom([CERTA, { ...CERTA, quote: 'o   FECHAMENTO diz o preço…' }, { quote: 'A isca resolve um problema estreito', file: 'bbb/000000.md' }])
  try {
    const r = rodar(['--conferir-citacoes', json, '--acervo', acervo, '--json'])
    assert.equal(r.status, 0, r.stdout + r.stderr)
    const res = JSON.parse(r.stdout)
    assert.deepEqual([res.trechos, res.fontes, res.conferidas, res.falhas.length], [3, 3, 3, 0])
  } finally { rmSync(json, { force: true }) }
}))

test('--conferir-citacoes reprova a frase fora do trecho, o trecho que não existe, o link trocado e a citação sem arquivo', () => comAcervo(BONS, acervo => {
  const json = relatorioCom([
    { ...CERTA, quote: 'Sempre baixe o preço para ganhar.' },
    { ...CERTA, file: 'aaa/000900.md' },
    { ...CERTA, url: 'https://videos.exemplo.com/aaa?t=300' },
    { ...CERTA, url: 'javascript:alert(1)' },
    { quote: 'O fechamento diz o preço.', url: endereco('aaa', 90) }
  ])
  try {
    const r = rodar(['--conferir-citacoes', json, '--acervo', acervo, '--json'])
    assert.equal(r.status, 1)
    const motivos = JSON.parse(r.stdout).falhas.map(f => f.motivo).join(' | ')
    assert.match(motivos, /a frase não está no trecho/)
    assert.match(motivos, /aaa\/000900\.md não existe no acervo/)
    assert.match(motivos, /o link não é o do trecho no acervo/)
    assert.match(motivos, /não é https/)
    assert.match(motivos, /não diz o arquivo do acervo/)
  } finally { rmSync(json, { force: true }) }
}))

test('--conferir-citacoes reprova link numa citação de trecho que não tem endereço', () => comAcervo([{ ep: 'sem', titulo: 'Sem endereço', inicio: 0, texto: 'O preço muda o comportamento.', url: null }], acervo => {
  const json = relatorioCom([{ quote: 'O preço muda o comportamento.', file: 'sem/000000.md', url: 'https://videos.exemplo.com/sem?t=0' }])
  const certo = relatorioCom([{ quote: 'O preço muda o comportamento.', file: 'sem/000000.md' }])
  try {
    const r = rodar(['--conferir-citacoes', json, '--acervo', acervo, '--json'])
    assert.equal(r.status, 1)
    assert.match(JSON.parse(r.stdout).falhas[0].motivo, /não traz endereço/)
    assert.equal(rodar(['--conferir-citacoes', certo, '--acervo', acervo]).status, 0)
  } finally { rmSync(json, { force: true }); rmSync(certo, { force: true }) }
}))

test('--conferir-citacoes sem citação nenhuma reprova: verde medindo zero é vermelho', () => comAcervo(BONS, acervo => {
  const md = textoCom('texto sem citação nenhuma')
  const json = relatorioCom([])
  try {
    assert.equal(rodar(['--conferir-citacoes', md, '--acervo', acervo]).status, 1, 'o .md sem citação aprovou')
    assert.equal(rodar(['--conferir-citacoes', json, '--acervo', acervo]).status, 1, 'o json sem evidência aprovou')
  } finally { rmSync(md, { force: true }); rmSync(json, { force: true }) }
}))

test('--conferir-citacoes diz a posição de cada evidência que falhou', () => comAcervo(BONS, acervo => {
  const json = relatorioCom([CERTA, { ...CERTA, quote: 'Sempre baixe o preço para ganhar.' }])
  try {
    const { falhas } = JSON.parse(rodar(['--conferir-citacoes', json, '--acervo', acervo, '--json']).stdout)
    assert.deepEqual(falhas.map(f => f.indice), [1])
  } finally { rmSync(json, { force: true }) }
}))

test('--conferir-citacoes confere as citações de um texto de resposta', () => comAcervo(BONS, acervo => {
  const md = textoCom(`Bom: [Preço · 1:30](${endereco('aaa', 90)}) (acervo: aaa/000090.md). Sem endereço: (acervo: bbb/000000.md). Ruim: (acervo: zzz/000000.md).`)
  try {
    const r = rodar(['--conferir-citacoes', md, '--acervo', acervo])
    assert.equal(r.status, 1)
    assert.match(r.stdout, /zzz/)
    assert.doesNotMatch(r.stdout, /✗[^\n]*aaa/)
    assert.doesNotMatch(r.stdout, /✗[^\n]*bbb/)
    assert.match(r.stdout, /3 citações conferidas/)
  } finally { rmSync(md, { force: true }) }
}))

test('--conferir-citacoes reprova link solto, link trocado ao lado do arquivo e arquivo fora da forma', () => comAcervo(BONS, acervo => {
  const md = textoCom([
    `[a](${endereco('aaa', 90)}) (acervo: aaa/000090.md)`,
    'Solto: https://videos.exemplo.com/aaa?t=90',
    '[b](https://videos.exemplo.com/aaa?t=300) (acervo: aaa/000090.md)',
    '[c](http://videos.exemplo.com/aaa?t=90) (acervo: aaa/000090.md)',
    '(acervo: C:\\acervo\\aaa.md)'
  ].join('\n'))
  try {
    const r = rodar(['--conferir-citacoes', md, '--acervo', acervo, '--json'])
    assert.equal(r.status, 1)
    const res = JSON.parse(r.stdout)
    assert.equal(res.conferidas, 5)
    const motivos = res.falhas.map(f => f.motivo)
    assert.equal(motivos.length, 4, JSON.stringify(res.falhas))
    assert.ok(motivos.some(m => /link sem o arquivo do acervo ao lado/.test(m)))
    assert.ok(motivos.some(m => /o link não é o do trecho/.test(m)))
    assert.ok(motivos.some(m => /não é https/.test(m)))
    assert.ok(motivos.some(m => /forma do acervo/.test(m)))
  } finally { rmSync(md, { force: true }) }
}))
