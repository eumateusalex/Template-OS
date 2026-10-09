// Prova da régua de copy da marca (scripts/copy/conferir.mjs).
// Ela roda a régua portátil da /copy por baixo e soma as regras de escrita
// pública da memória: o travessão, as palavras proibidas, o "case", o jargão
// (menos o vocabulário próprio), os padrões de IA (o "não é X, é Y" entre eles),
// o título de balcão na página,
// o gancho do anúncio e, só quando a memória escolhe, a caixa minúscula. Monta
// uma copy de prova dentro das regras e quebra uma por vez: cada desvio tem que
// reprovar dizendo o bloco e o motivo. O que é da portátil (blocos, rastro,
// marcador, escola, ação) tem a prova dele em .claude/skills/copy/regua/teste-conferir.mjs.
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

const CONFERIR = join(dirname(fileURLToPath(import.meta.url)), 'conferir.mjs')

const MEMORIAS = mkdtempSync(join(tmpdir(), 'copy-memoria-'))
after(() => rmSync(MEMORIAS, { recursive: true, force: true }))
const memoria = (nome, conteudo) => { const arq = join(MEMORIAS, nome); writeFileSync(arq, conteudo); return arq }
const MEM_NORMAL = memoria('normal.md', '# Escrita pública\n\n**Liste aqui as palavras suas\nque esta régua não deve cortar:** *(a definir)*\n\n## Caixa\n\n**Caixa:** normal\n')
const MEM_MINUSCULA = memoria('minuscula.md', '# Escrita pública\n\n## Caixa\n\n**Caixa:** minúscula\n')
const MEM_SEM_LINHA = memoria('sem-linha.md', '# Escrita pública\n\n## Linguagem de balcão\n\nfale com a pessoa.\n')
const MEM_VOCABULARIO = memoria('vocabulario.md', '# Escrita pública\n\n**Liste aqui as palavras suas\nque esta régua não deve cortar:** funil\n\n## Caixa\n\n**Caixa:** normal\n')

// Em minúsculo de propósito: passa com a caixa normal e com a minúscula.
const COPY = `# copy · página da avaliação da padaria

> nota para o design: os rótulos dizem a função do bloco.

módulo: pagina
tipo: servico

<!-- texto -->

## topo

**título:** a sua padaria perde encomenda entre a primeira mensagem e o pedido fechado.

**subtítulo:** eu acho pelo menos 7 pontos onde isso acontece, pra você pôr em prática em 30 dias.

**ação:** quero a avaliação de graça, pra saber onde perco encomenda

→ princípio: a primeira tela decide.

## oferta

- a avaliação sai de graça.
- no fim você escolhe: faz sozinho, passa pra quem já te atende, ou eu faço com você.

## prova

a Ana, dona de padaria em Curitiba, respondia encomenda no dia seguinte.

"eu perdia o pedido antes de mandar o orçamento", contou a Ana.

## objeções

**pergunta:** e se eu não tiver tempo?

**resposta:** a primeira conversa leva meia hora, no seu horário.

## ação

**ação:** quero a avaliação de graça, pra saber onde perco encomenda

<!-- fim do texto -->

## rastro

- 7 pontos: a avaliação tem sete módulos
- 30 dias: o prazo da promessa
- "eu perdia o pedido antes de mandar o orçamento": exemplo
`

const EMAIL = `módulo: resposta-direta
tipo: email

<!-- texto -->
## assunto
**assunto:** o erro que faz a padaria perder encomenda
## abertura
você baixou a lista dos 7 erros.
## corpo
o quarto pesa mais que os outros.
## acao
**ação:** quero saber qual é
<!-- fim do texto -->

## rastro
- 7 erros: a isca que ele baixou
`

// Sem --memoria explícita, a de caixa normal: a prova não depende do módulo real.
function conferir (texto, { args, extra = [] } = {}) {
  const pasta = mkdtempSync(join(tmpdir(), 'copy-'))
  const arquivo = join(pasta, 'copy.md')
  if (texto !== null) writeFileSync(arquivo, texto)
  const { NODE_TEST_CONTEXT, ...env } = process.env
  const argv = args || [arquivo, ...(extra.includes('--memoria') ? [] : ['--memoria', MEM_NORMAL]), ...extra]
  const r = spawnSync(process.execPath, [CONFERIR, ...argv], { encoding: 'utf8', env })
  rmSync(pasta, { recursive: true, force: true })
  return { status: r.status, saida: r.stdout + r.stderr }
}

const troca = (de, para, base = COPY) => {
  assert.ok(base.includes(de), `a copy de prova não tem: ${de}`)
  return base.split(de).join(para)
}

// Uma maiúscula no começo de frase: a caixa normal aceita, a minúscula reprova.
const COM_MAIUSCULA = troca('- a avaliação sai de graça.', '- A avaliação sai de graça.')

// O que passa

test('a página passa e diz quanto conferiu, e qual caixa aplicou', () => {
  const { status, saida } = conferir(COPY)
  assert.equal(status, 0, saida)
  assert.match(saida, /5 blocos, 10 frases, 2 números com fonte · caixa normal/)
  // a portátil é importada, não executada: uma linha de resultado só
  assert.equal(saida.trim().split('\n').length, 1, saida)
})

test('a palavra que a pessoa recusou na memória reprova a página, e sem a recusa passa', () => {
  const MEM_RECUSA = memoria('recusa.md', '# Escrita pública\n\n**Palavras que o texto público não diz:** de graça\n\n## Caixa\n\n**Caixa:** normal\n')
  const comRecusa = conferir(COPY, { extra: ['--memoria', MEM_RECUSA] })
  assert.equal(comRecusa.status, 1, comRecusa.saida)
  assert.match(comRecusa.saida, /"de graça" é palavra que a memória tira do texto público/)
  assert.equal(conferir(COPY).status, 0)
})

test('o título é a linha do rótulo título, mesmo fora do começo do topo', () => {
  const { status, saida } = conferir(troca('**título:**', '**sobretítulo:** pra padaria.\n\n**título:**'))
  assert.equal(status, 0, saida)
})

test('a anotação, o rótulo e o rastro não contam como texto público', () => {
  // travessão fora do texto, na anotação e no rótulo, não reprova
  const { status, saida } = conferir(troca('> nota para o design', '> Nota para o design — a função')
    .replace('→ princípio: a primeira tela decide.', '→ Princípio — a primeira tela decide.\n\n> Nota — o rótulo some.')
    .replace('**título:**', '**Título — topo:**'), { extra: ['--memoria', MEM_MINUSCULA] })
  assert.equal(status, 0, saida)
})

test('o título com 14 palavras passa, com 15 reprova', () => {
  const de = 'a sua padaria perde encomenda entre a primeira mensagem e o pedido fechado.'
  const t14 = troca(de, 'a sua padaria perde encomenda entre a primeira mensagem e o pedido fechado hoje.')
  assert.equal(t14.match(/\*\*título:\*\* (.*)/)[1].trim().split(/\s+/).length, 14, 'a frase da borda tem 14 palavras')
  assert.equal(conferir(t14).status, 0, conferir(t14).saida)
  const r = conferir(troca(de, 'a sua padaria perde encomenda entre a primeira mensagem da pessoa e o pedido fechado.'))
  assert.equal(r.status, 1, r.saida)
  assert.match(r.saida, /topo: o título tem 15 palavras; o teto é 14/)
})

test('fora da página, um bloco topo não pede título de balcão', () => {
  const comTopo = troca('## assunto', '## topo\n**título:** oi, tudo certo por aí\n## assunto', EMAIL)
  const { status, saida } = conferir(comTopo)
  assert.equal(status, 0, saida)
  assert.match(saida, /5 blocos/)
})

// A caixa: opção da marca, lida da linha "**Caixa:**" da memória

test('caixa normal na memória: a maiúscula do começo de frase passa', () => {
  const { status, saida } = conferir(COM_MAIUSCULA)
  assert.equal(status, 0, saida)
  assert.match(saida, /caixa normal/)
})

test('memória sem a linha de caixa vale normal', () => {
  const { status, saida } = conferir(COM_MAIUSCULA, { extra: ['--memoria', MEM_SEM_LINHA] })
  assert.equal(status, 0, saida)
  assert.match(saida, /caixa normal/)
})

test('memória que não existe vale normal', () => {
  const { status, saida } = conferir(COM_MAIUSCULA, { extra: ['--memoria', join(MEMORIAS, 'nao-existe.md')] })
  assert.equal(status, 0, saida)
})

test('caixa minúscula na memória: a maiúscula fora de sigla e nome reprova', () => {
  const r = conferir(COM_MAIUSCULA, { extra: ['--memoria', MEM_MINUSCULA] })
  assert.equal(r.status, 1, `aprovou: ${r.saida}`)
  assert.match(r.saida, /oferta: maiúscula fora de sigla e nome próprio: "A"/)
  // e o texto em minúsculo, com nome próprio (Ana, Curitiba), passa
  const ok = conferir(COPY, { extra: ['--memoria', MEM_MINUSCULA] })
  assert.equal(ok.status, 0, ok.saida)
  assert.match(ok.saida, /caixa minúscula/)
})

test('--caixa decide por cima da memória, nos dois sentidos', () => {
  const liga = conferir(COM_MAIUSCULA, { extra: ['--caixa', 'minuscula'] })
  assert.equal(liga.status, 1, `aprovou: ${liga.saida}`)
  assert.match(liga.saida, /maiúscula/)
  const desliga = conferir(COM_MAIUSCULA, { extra: ['--memoria', MEM_MINUSCULA, '--caixa', 'normal'] })
  assert.equal(desliga.status, 0, desliga.saida)
  // com acento também
  assert.equal(conferir(COM_MAIUSCULA, { extra: ['--caixa', 'minúscula'] }).status, 1)
})

test('na caixa minúscula, o nome listado no vocabulário da memória passa, e sem a lista reprova', () => {
  const memVocab = memoria('minuscula-vocab.md', '# Escrita pública\n\n**Liste aqui as palavras suas\nque esta régua não deve cortar:** Pão da Vila\n\n## Caixa\n\n**Caixa:** minúscula\n')
  const comMarca = troca('- a avaliação sai de graça.', '- Pão da Vila faz a avaliação de graça.')
  const ok = conferir(comMarca, { extra: ['--memoria', memVocab] })
  assert.equal(ok.status, 0, ok.saida)
  const r = conferir(comMarca, { extra: ['--memoria', MEM_MINUSCULA] })
  assert.equal(r.status, 1, `aprovou: ${r.saida}`)
  assert.match(r.saida, /maiúscula fora de sigla e nome próprio: "Pão"/)
})

test('na caixa minúscula, a palavra do ofício escrita em minúsculo no vocabulário não vira nome próprio', () => {
  const memOficio = memoria('minuscula-oficio.md', '# Escrita pública\n\n**Liste aqui as palavras suas\nque esta régua não deve cortar:** quadro de distribuição\n\n## Caixa\n\n**Caixa:** minúscula\n')
  const comDe = troca('- a avaliação sai de graça.', '- De noite eu respondo a encomenda de graça.')
  const r = conferir(comDe, { extra: ['--memoria', memOficio] })
  assert.equal(r.status, 1, `aprovou: ${r.saida}`)
  assert.match(r.saida, /maiúscula fora de sigla e nome próprio: "De"/)
})

test('as variações para teste passam pela caixa minúscula', () => {
  const r = conferir(COPY + '\n## variações para teste\n- A sua padaria perde encomenda antes do pedido.\n', { extra: ['--memoria', MEM_MINUSCULA] })
  assert.equal(r.status, 1, `aprovou: ${r.saida}`)
  assert.match(r.saida, /variacoes: maiúscula/)
})

// As regras da memória

const REPROVA = [
  ['travessão', troca('a avaliação sai de graça.', 'a avaliação sai de graça — sem custo.'), /oferta.*travessão/],
  ['a palavra garantia', troca('a avaliação sai de graça.', 'a avaliação tem garantia.'), /oferta.*garantia/],
  ['jargão de guru', troca('a avaliação sai de graça.', 'a avaliação alavanca as suas vendas.'), /oferta.*alavancar/],
  ['a palavra case', troca('a Ana, dona', 'o case da Ana, dona'), /prova.*case/],
  ['jargão', troca('quem já te atende', 'quem já cuida do seu funil'), /oferta.*funil/],
  ['não é X, é Y', troca('a avaliação sai de graça.', 'não é consultoria, é implantação.'), /oferta.*não é X, é Y/],
  // os padrões de IA da humanizer, da mesma lista dos slides e da legenda
  ['a falsa revelação', troca('a avaliação sai de graça.', 'a verdade é que a avaliação sai de graça.'), /oferta.*falsa revelação/],
  ['o advérbio vazio', troca('a avaliação sai de graça.', 'a avaliação sai literalmente de graça.'), /oferta.*advérbio vazio/],
  ['título com mais de 14 palavras', troca('a sua padaria perde encomenda entre a primeira mensagem e o pedido fechado.', 'a sua padaria perde encomenda toda semana entre a primeira mensagem do WhatsApp e o pedido fechado no balcão.'), /topo.*título.*14/],
  ['título que não fala com a pessoa', troca('a sua padaria perde encomenda', 'a padaria perde encomenda'), /topo.*título.*você/],
  ['título sem a perda', troca('a sua padaria perde encomenda entre a primeira mensagem e o pedido fechado.', 'a sua padaria merece uma rotina mais organizada.'), /topo.*título.*perda/]
]

for (const [nome, texto, motivo] of REPROVA) {
  test(`reprova: ${nome}`, () => {
    const { status, saida } = conferir(texto)
    assert.equal(status, 1, `aprovou: ${saida}`)
    assert.match(saida, motivo)
  })
}

test('o vocabulário próprio listado na memória não é jargão', () => {
  const t = troca('quem já te atende', 'quem já cuida do seu funil')
  const r = conferir(t, { extra: ['--memoria', MEM_VOCABULARIO] })
  assert.equal(r.status, 0, r.saida)
  // o que não está na lista continua jargão
  const r2 = conferir(troca('quem já te atende', 'quem já cuida do seu CRM'), { extra: ['--memoria', MEM_VOCABULARIO] })
  assert.equal(r2.status, 1, `aprovou: ${r2.saida}`)
  assert.match(r2.saida, /jargão "CRM"/)
})

test('fora da página, as regras da memória continuam valendo', () => {
  for (const [de, para, motivo] of [
    ['o quarto pesa mais', 'o quarto pesa mais — bem mais', /travessão/],
    ['o quarto pesa mais', 'com garantia, o quarto pesa mais', /garantia/]
  ]) {
    const r = conferir(troca(de, para, EMAIL))
    assert.equal(r.status, 1, `aprovou: ${r.saida}`)
    assert.match(r.saida, motivo)
  }
  const r = conferir(troca('o quarto pesa', 'O quarto pesa', EMAIL), { extra: ['--caixa', 'minuscula'] })
  assert.equal(r.status, 1, `aprovou: ${r.saida}`)
  assert.match(r.saida, /maiúscula/)
})

// A portátil por baixo

test('a régua portátil roda por baixo: o desvio dela reprova aqui também', () => {
  for (const [texto, motivo] of [
    [troca('leva meia hora', 'leva 40 minutos'), /objecoes: o número "40 minutos" não está no rastro/],
    [troca('a primeira conversa leva meia hora', 'como ensina a escola de oferta, a primeira conversa leva meia hora'), /cita a escola de oferta/],
    [troca('## objeções', '## dúvidas'), /objecoes: falta este bloco/],
    [troca('módulo: resposta-direta', 'módulo: folheto', EMAIL), /módulo: "folheto"/],
    [COPY.replace('<!-- texto -->', ''), /não achei os marcadores/]
  ]) {
    const r = conferir(texto)
    assert.equal(r.status, 1, `aprovou: ${r.saida}`)
    assert.match(r.saida, motivo)
  }
})

test('o título com ganho concreto, só com número, passa', () => {
  const t = troca('a sua padaria perde encomenda entre a primeira mensagem e o pedido fechado.', 'o seu bolo de encomenda entregue em 2 dias.')
  const { status, saida } = conferir(troca('- 30 dias:', '- 2 dias: o prazo de entrega\n- 30 dias:', t))
  assert.equal(status, 0, saida)
})

const ANUNCIO = `módulo: resposta-direta
tipo: anuncio

<!-- texto -->
## gancho
**gancho:** você manda o orçamento do bolo, o cliente some, e ninguém sabe onde ele desistiu.
## corpo
eu acho onde a sua padaria perde encomenda.
## acao
**ação:** quero saber onde perco encomenda
<!-- fim do texto -->

## rastro
- nenhum número
`

test('o gancho do anúncio cabe em 125 caracteres', () => {
  const r = conferir(ANUNCIO)
  assert.equal(r.status, 0, r.saida)
  const longo = troca('e ninguém sabe onde ele desistiu.', 'e ninguém na padaria sabe em que ponto da conversa ele desistiu de fechar a encomenda com você.', ANUNCIO)
  const r2 = conferir(longo)
  assert.equal(r2.status, 1, `aprovou: ${r2.saida}`)
  assert.match(r2.saida, /gancho: o gancho tem \d+ caracteres; o que aparece antes do "ver mais" são 125/)
  // na VSL o gancho é falado: os 125 caracteres são só do anúncio
  const vsl = troca('tipo: anuncio', 'tipo: vsl', longo)
    .replace('## corpo', '## abertura\nvocê está no lugar certo.\n## prova\na medição de 9 padarias.\n## oferta\nde graça.\n## corpo')
  const r3 = conferir(troca('- nenhum número', '- 9 padarias: a calibragem', vsl))
  assert.doesNotMatch(r3.saida, /gancho: o gancho tem/, r3.saida)
})

test('as variações para teste passam pelas regras da memória', () => {
  const limpa = COPY + '\n## variações para teste\n- a sua padaria perde encomenda antes do pedido.\n'
  assert.equal(conferir(limpa).status, 0, conferir(limpa).saida)
  const r = conferir(COPY + '\n## variações para teste\n- a sua padaria perde encomenda — antes do pedido.\n')
  assert.equal(r.status, 1, `aprovou: ${r.saida}`)
  assert.match(r.saida, /variacoes: travessão/)
})

test('sem arquivo, com arquivo que não existe, ou com opção errada, sai 2', () => {
  assert.equal(conferir(COPY, { args: [] }).status, 2)
  assert.equal(conferir(null).status, 2)
  assert.equal(conferir(COPY, { extra: ['--caixa', 'gritando'] }).status, 2)
  assert.equal(conferir(COPY, { extra: ['--caixa'] }).status, 2)
  assert.equal(conferir(COPY, { extra: ['--nao-existe'] }).status, 2)
})
