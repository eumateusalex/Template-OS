// Prova da régua portátil da /copy (conferir.mjs, nesta pasta).
// Os exemplos da skill passam; uma copy de prova dentro das regras é quebrada
// uma regra por vez, e cada desvio tem que reprovar dizendo o bloco e o motivo.
// Só usa o Node: a régua e a prova viajam juntas com a pasta da skill.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const CONFERIR = join(AQUI, 'conferir.mjs')
const EXEMPLOS = join(AQUI, '..', 'exemplos')

const COPY = `módulo: pagina
tipo: servico

> nota para quem desenha: o rótulo diz a função.

<!-- texto -->
## topo
**título:** Descubra por que a sua dor nas costas sempre volta
**subtítulo:** Avaliação em 50 minutos, com 3 exercícios para casa.
**ação:** Quero marcar a avaliação
→ princípio: o título promete o ganho; 99 ideias aqui não pedem fonte.

## oferta
Se você não sair sabendo o motivo da dor, a avaliação não é cobrada.

## prova
"Na avaliação descobri que era o jeito de levantar da cadeira", contou a Carla.

## objecoes
**Já fiz fisioterapia.** A avaliação procura o movimento que causa a dor.

## acao
**ação:** Quero marcar a avaliação e saber por que a dor volta
<!-- fim do texto -->

## rastro
- "50 minutos": a duração da avaliação (o briefing)
- "3 exercícios": o plano padrão (o briefing)
- "Na avaliação descobri que era o jeito de levantar da cadeira": provisório, depoimento genérico

## trocar antes de publicar
- "Na avaliação descobri que era o jeito de levantar da cadeira": trocar pelo depoimento real
`

function conferir (texto, { args } = {}) {
  const pasta = mkdtempSync(join(tmpdir(), 'copy-'))
  const arquivo = join(pasta, 'copy.md')
  if (texto !== null) writeFileSync(arquivo, texto)
  const { NODE_TEST_CONTEXT, ...env } = process.env
  const r = spawnSync(process.execPath, [CONFERIR, ...(args || [arquivo])], { encoding: 'utf8', env })
  rmSync(pasta, { recursive: true, force: true })
  return { status: r.status, saida: r.stdout + r.stderr }
}

const troca = (de, para, base = COPY) => {
  assert.ok(base.includes(de), `a copy de prova não tem: ${de}`)
  return base.split(de).join(para)
}

const reprova = (texto, ...esperados) => {
  const { status, saida } = conferir(texto)
  assert.equal(status, 1, saida)
  for (const e of esperados) assert.match(saida, e)
}

// Os exemplos da skill

test('o exemplo de página passa e diz quanto conferiu', () => {
  const { status, saida } = conferir(null, { args: [join(EXEMPLOS, 'pagina.md')] })
  assert.equal(status, 0, saida)
  assert.match(saida, /pagina\/servico/)
  assert.match(saida, /7 blocos/)
  assert.match(saida, /6 números com fonte/)
  assert.match(saida, /2 variações conferidas/)
  assert.match(saida, /3 provisórios na lista de troca/)
})

test('o exemplo de resposta direta passa e diz quanto conferiu', () => {
  const { status, saida } = conferir(null, { args: [join(EXEMPLOS, 'resposta-direta.md')] })
  assert.equal(status, 0, saida)
  assert.match(saida, /resposta-direta\/email/)
  assert.match(saida, /5 blocos/)
  assert.match(saida, /6 números com fonte/)
  assert.match(saida, /1 provisório na lista de troca/)
})

test('o exemplo de marca passa e diz quanto conferiu', () => {
  const { status, saida } = conferir(null, { args: [join(EXEMPLOS, 'marca.md')] })
  assert.equal(status, 0, saida)
  assert.match(saida, /marca\/slogan/)
  assert.match(saida, /1 bloco,/)
  assert.match(saida, /0 números com fonte/)
})

// A copy de prova

test('a copy de prova dentro das regras passa', () => {
  const { status, saida } = conferir(COPY)
  assert.equal(status, 0, saida)
  assert.match(saida, /5 blocos, 8 frases, 2 números com fonte, 1 provisório na lista de troca/)
})

test('o tipo com acento e o módulo com espaço valem', () => {
  const t = troca('módulo: pagina\ntipo: servico', 'modulo: página\ntipo: serviço')
  const { status, saida } = conferir(t)
  assert.equal(status, 0, saida)
  const voz = 'módulo: marca\ntipo: guia de voz\n\n<!-- texto -->\n## personalidade\nDireta.\n## tom\nCalmo.\n## faz e não faz\nFala curto.\n## vocabulário\nconserto.\n## exemplos\nVolta hoje.\n<!-- fim do texto -->\n'
  const r = conferir(voz)
  assert.equal(r.status, 0, r.saida)
  const rd = troca('módulo: pagina\ntipo: servico', 'módulo: resposta direta\ntipo: anuncio',
    COPY.replace(/## topo[\s\S]*?(?=<!-- fim do texto -->)/, '## gancho\nA dor volta.\n## corpo\nA avaliação acha o motivo.\n## acao\n**ação:** Quero marcar\n'))
  const r2 = conferir(rd)
  assert.equal(r2.status, 0, r2.saida)
})

test('a anotação, a citação e o rótulo não são texto público', () => {
  // o 99 da linha "→ princípio" e o 42 da linha ">" dentro do topo não pedem fonte
  const t = troca('**ação:** Quero marcar a avaliação\n', '**ação:** Quero marcar a avaliação\n> citação de apoio: 42 versões depois.\n')
  const { status, saida } = conferir(t)
  assert.equal(status, 0, saida)
})

// A forma

test('sem os marcadores do texto, reprova', () => {
  reprova(COPY.replace('<!-- texto -->', ''), /arquivo/, /<!-- texto -->/)
  reprova(COPY.replace('<!-- fim do texto -->', ''), /arquivo/, /<!-- fim do texto -->/)
})

test('sem texto entre os marcadores, reprova', () => {
  reprova(COPY.replace(/<!-- texto -->[\s\S]*<!-- fim do texto -->/, '<!-- texto -->\n<!-- fim do texto -->'), /sem texto/)
})

test('sem módulo, ou com módulo desconhecido, reprova', () => {
  reprova(troca('módulo: pagina\n', ''), /módulo/, /falta a linha/)
  reprova(troca('módulo: pagina', 'módulo: folheto'), /módulo/, /folheto/)
})

test('sem tipo, ou com tipo que o módulo não tem, reprova', () => {
  reprova(troca('tipo: servico\n', ''), /tipo/, /falta a linha/)
  reprova(troca('tipo: servico', 'tipo: email'), /tipo/, /email/, /pagina/)
})

test('falta um bloco que o tipo pede, reprova com o nome do bloco', () => {
  reprova(COPY.replace(/## objecoes\n.*\n\n/, ''), /objecoes/, /falta este bloco/)
  reprova(troca('## prova', '## depoimentos'), /prova/, /falta este bloco/)
})

test('cada tipo cobra os próprios blocos', () => {
  const casca = (modulo, tipo, blocos) => `módulo: ${modulo}\ntipo: ${tipo}\n\n<!-- texto -->\n${blocos.map(b => `## ${b}\nTexto do bloco.`).join('\n')}\n<!-- fim do texto -->\n`
  const TIPOS = {
    'pagina/venda': ['topo', 'oferta', 'prova', 'objecoes', 'acao'],
    'pagina/captura': ['topo', 'oferta', 'prova', 'acao'],
    'pagina/institucional': ['topo', 'prova', 'acao'],
    'resposta-direta/anuncio': ['gancho', 'corpo', 'acao'],
    'resposta-direta/email': ['assunto', 'abertura', 'corpo', 'acao'],
    'resposta-direta/vsl': ['gancho', 'abertura', 'prova', 'oferta', 'acao'],
    'resposta-direta/carta': ['titulo', 'abertura', 'prova', 'oferta', 'acao'],
    'marca/manifesto': ['o mundo', 'a tensao', 'a crenca', 'o que faz', 'assinatura'],
    'marca/slogan': ['opcoes'],
    'marca/guia-de-voz': ['personalidade', 'tom', 'faz e nao faz', 'vocabulario', 'exemplos'],
    'marca/campanha': ['big idea', 'peca principal', 'desdobramentos', 'slogan']
  }
  for (const [chave, blocos] of Object.entries(TIPOS)) {
    const [modulo, tipo] = chave.split('/')
    const inteira = conferir(casca(modulo, tipo, blocos))
    assert.equal(inteira.status, 0, `${chave}: ${inteira.saida}`)
    for (const falta of blocos) {
      const r = conferir(casca(modulo, tipo, blocos.filter(b => b !== falta)))
      assert.equal(r.status, 1, `${chave} sem ${falta} passou: ${r.saida}`)
      // o tipo de um bloco só fica sem texto nenhum quando ele falta
      assert.match(r.saida, blocos.length === 1 ? /sem texto/ : new RegExp(`${falta}: falta este bloco`), chave)
    }
  }
})

// O rastro

test('número sem fonte no rastro reprova', () => {
  reprova(troca('Se você não sair', 'Em 2 semanas, se você não sair'), /oferta/, /"2 semanas"/, /rastro/)
})

test('número que é só pedaço de outro no rastro reprova', () => {
  // o "5" sozinho não tem fonte porque o rastro dá a de "50 minutos"
  reprova(troca('Avaliação em 50 minutos,', 'Avaliação em 5,'), /topo/, /"5"/)
  // nem o "0 minutos", que é o fim de "50 minutos"
  reprova(troca('Avaliação em 50 minutos,', 'Avaliação em 0 minutos,'), /topo/, /"0 minutos"/)
})

test('o número com a unidade colada é um número só', () => {
  const t = troca('Se você não sair', 'A agenda vai até as 21h. Se você não sair')
  const linha = '- "3 exercícios": o plano padrão (o briefing)\n'
  const comFonte = conferir(troca(linha, linha + '- "21h": o horário da clínica (o briefing)\n', t))
  assert.equal(comFonte.status, 0, comFonte.saida)
  reprova(troca(linha, linha + '- "21 dias": outro número\n', t), /oferta/, /"21h"/)
})

test('o nome de escola ou o jargão do método no texto público reprova', () => {
  for (const [frase, motivo] of [
    ['Como ensina a escola de oferta,', /cita a escola de oferta/],
    ['Como ensina a escola da oferta,', /cita a escola de oferta/],
    ['Como ensina a escola de consciência,', /cita a escola de consciência/],
    ['Como ensina a Escola Clássica,', /cita a escola clássica/],
    ['Pela copy-lp,', /cita a escola copy-lp/],
    ['Quem está no nível 4 de consciência sabe:', /cita o jargão do método \(nível de consciência\)/],
    ['Quem está na consciência, nível 4, sabe:', /cita o jargão do método \(nível de consciência\)/],
    ['No estágio 3 de sofisticação,', /cita o jargão do método \(estágio de sofisticação\)/]
  ]) {
    reprova(troca('A avaliação procura o movimento', `${frase} a avaliação procura o movimento`), /objecoes/, motivo)
  }
})

test('a palavra comum que dá nome a uma escola não reprova sozinha', () => {
  // oferta, consciência, clássica e escola são palavras de todo dia: só o nome da escola e o jargão reprovam
  const t = troca('A avaliação procura o movimento', 'A oferta vale para a escola de dança clássica, com consciência corporal: a avaliação procura o movimento')
  const { status, saida } = conferir(t)
  assert.equal(status, 0, saida)
})

test('número que só bate pelo algarismo com outra linha do rastro reprova', () => {
  reprova(troca('com 3 exercícios', 'com 3 vídeos'), /topo/, /"3 vídeos"/)
})

test('fala entre aspas sem fonte no rastro reprova', () => {
  reprova(troca('- "Na avaliação descobri que era o jeito de levantar da cadeira": provisório, depoimento genérico\n', ''), /prova/, /fala entre aspas/)
})

test('provisório fora da lista de troca reprova', () => {
  reprova(COPY.replace(/## trocar antes de publicar\n.*\n/, ''), /provisório/, /trocar antes de publicar/)
  reprova(troca('- "50 minutos": a duração da avaliação (o briefing)', '- "50 minutos": provisório, a confirmar'), /"50 minutos"/, /trocar antes de publicar/)
})

test('o provisório só conta na lista de troca com a mesma chave', () => {
  const t = troca('- "50 minutos": a duração da avaliação (o briefing)', '- "50 minutos": provisório, a confirmar')
  reprova(t + '- "50 sessões": trocar pelo número real\n', /"50 minutos"/, /trocar antes de publicar/)
})

test('o rótulo da linha não é texto público', () => {
  // "passo 1" é rótulo: o 1 não pede fonte
  const t = troca('**Já fiz fisioterapia.**', '**passo 1:** Já fiz fisioterapia.')
  const { status, saida } = conferir(t)
  assert.equal(status, 0, saida)
})

// O marcador esquecido

test('marcador esquecido no texto reprova', () => {
  for (const marcador of ['[prova aqui]', 'TODO', 'lorem ipsum', '{{nome}}', '<nome do cliente>', 'XXX']) {
    reprova(troca('A avaliação procura o movimento', `${marcador} A avaliação procura o movimento`), /objecoes/, /marcador/)
  }
})

test('link de markdown não é marcador', () => {
  const t = troca('A avaliação procura o movimento', 'A [avaliação](https://exemplo.com) procura o movimento')
  const { status, saida } = conferir(t)
  assert.equal(status, 0, saida)
})

// Uma ação

test('na página, a ação do fim que não repete a do topo reprova', () => {
  reprova(troca('**ação:** Quero marcar a avaliação e saber', '**ação:** Fale com a gente e saiba'), /ação/, /não repete a do topo/)
})

test('fora da página, a ação do topo não precisa voltar no fim', () => {
  const email = 'módulo: resposta-direta\ntipo: email\n\n<!-- texto -->\n## topo\n**ação:** Responder hoje\n## assunto\nA dor volta.\n## abertura\nOi.\n## corpo\nA avaliação acha o motivo.\n## acao\n**ação:** Quero marcar\n<!-- fim do texto -->\n'
  const { status, saida } = conferir(email)
  assert.equal(status, 0, saida)
})

test('as variações para teste são texto público: marcador, escola e rastro valem nelas', () => {
  // a anotação (→) entre as variações não é variação nem pede fonte
  const limpa = COPY + '\n## variações para teste\n- Por que a sua dor nas costas volta toda semana\n→ por que: 99 testes mostraram o gancho de pergunta\n- Para quem trabalha sentado: o motivo da dor, em uma consulta\n'
  const r = conferir(limpa)
  assert.equal(r.status, 0, r.saida)
  assert.match(r.saida, /2 variações conferidas/)
  reprova(COPY + '\n## variações para teste\n- [título aqui]\n', /variacoes/, /marcador/)
  reprova(COPY + '\n## variações para teste\n- Como ensina a escola de oferta, a dor volta\n', /variacoes/, /cita a escola de oferta/)
  reprova(COPY + '\n## variações para teste\n- A dor some em 2 semanas\n', /variacoes/, /"2 semanas"/)
})

// O uso

test('sem arquivo, ou com arquivo que não existe, sai 2', () => {
  assert.equal(conferir(null, { args: [] }).status, 2)
  assert.equal(conferir(null, { args: [join(tmpdir(), 'nao-existe-copy.md')] }).status, 2)
})
