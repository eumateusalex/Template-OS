// Prova do conferidor da prospecção (scripts/prospeccao/conferir.mjs).
//
// Monta numa pasta temporária uma operação de prova que passa (o manual, a lista
// de quem não quer, o banco, o mapa copiado do molde, a calibragem aprovada, uma
// leva com fichas, envios e folha) e planta um defeito por vez: cada um tem que
// reprovar dizendo onde e por quê. O cabeçalho do envios.csv vem do molde da
// skill, e as palavras proibidas vêm do metodo.md real: a matriz das palavras é
// gerada dele, então palavra nova no método ganha caso sozinha.
//
// A agenda (voltas e `quando`) se prova com --hoje, para a data não depender do
// relógio da máquina.
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { proibidasDe, garantiaDeclarada, camposDaCalibragem } from './conferir.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const CONFERIR = join(AQUI, 'conferir.mjs')
const SKILL = resolve(AQUI, '..', '..', '.claude', 'skills', 'prospeccao')
const METODO = readFileSync(join(SKILL, 'metodo.md'), 'utf8')
const CABECALHO = readFileSync(join(SKILL, 'modelos', 'envios.csv'), 'utf8').split(/\r?\n/)[0]
const COLUNAS = CABECALHO.split(';')

const BASE = mkdtempSync(join(tmpdir(), 'prospeccao-conferir-'))
after(() => rmSync(BASE, { recursive: true, force: true }))

const linha = (campos) => COLUNAS.map((c) => campos[c] ?? '').join(';')

const L01 = { data: '2026-11-01', quem_enviou: '5511900001111', contato: '5511977776666', ficha: '01', negocio: 'Padaria Um', segmento: 'padaria', variante: 'A', abriu: 'sim', resposta: 'silencio' }
const L02 = { data: '2026-11-01', quem_enviou: '5511900001111', contato: '5511988887777', ficha: '02', negocio: 'Padaria Dois', segmento: 'padaria', variante: 'B', abriu: 'sim', resposta: 'sim', tipo_resposta: 'descadastro', situacao: 'S35', pediu_parar: 'sim', quando: 'encerrada' }
const L03 = { data: '2026-11-03', quem_enviou: '5511900001111', contato: 'contato@padariatres.exemplo', ficha: '03', negocio: 'Padaria Três', segmento: 'padaria', variante: 'A', abriu: 'sim', resposta: 'sim', tipo_resposta: 'objecao', situacao: 'S17', quando: '2026-11-08' }

const FAIXA = 'O trabalho fica entre R$ 800 e R$ 1.200, conforme o tamanho.'

// a calibragem de prova: os campos lidos da tabela do estrategista, cada um preenchido
const CAMPOS = camposDaCalibragem(readFileSync(resolve(AQUI, '..', '..', '.claude', 'agents', 'comercial', 'estrategista.md'), 'utf8'))
const calibragem = (pular = [], corpo = (c) => `O que se leu para ${c.nome.toLowerCase()}, com a fonte.`) =>
  'estado: aprovada\n\n# Calibragem\n\n' + CAMPOS.filter((c) => !pular.includes(c.numero)).map((c) => `## ${c.numero}. ${c.nome}\n\n${corpo(c)}\n`).join('\n')

function arquivosBase () {
  return {
    'MANUAL.md': `# Manual da operação\n\n**A frase do "quanto custa":** ${FAIXA}\n\n**Teto de conversas novas por dia, por número ou conta:** 2\n\n## O que esta operação não diz\n\nA régua barra: \`imperdível\`, \`última chance\`.\n`,
    'nao-contatar.md': '# Não contatar\n\n| Data | Leva e ficha | Negócio | Contato | O que disse |\n|---|---|---|---|---|\n| 2026-11-02 | leva-1-padarias/02 | Padaria Dois | 5511988887777 | "não quero" |\n',
    'mapa-de-situacoes.md': readFileSync(join(SKILL, 'modelos', 'mapa-de-situacoes.md'), 'utf8'),
    'objecoes.md': `# Objeções\n\n### "Quanto custa?"\n\n> ${FAIXA}\n\n> Posso te mostrar o que entra?\n`,
    'calibragem-padarias-2026-10-30/CALIBRAGEM.md': calibragem(),
    'leva-1-padarias/LEIA.md': '# Leva 1\n',
    'leva-1-padarias/fichas/01-padaria-um.md': '# 01 · Padaria Um\n\n**Contato:** (11) 97777-6666\n\n## A mensagem\n\n> Oi, aqui é a Ana. Vi que o link do cardápio no seu perfil não abre.\n\n> Posso te mandar o print?\n',
    'leva-1-padarias/fichas/02-padaria-dois.md': '# 02 · Padaria Dois\n\n**Contato:** 11 98888-7777\n\n## A mensagem\n\n> Oi, aqui é a Ana. Vi que o seu perfil está sem o horário.\n',
    'leva-1-padarias/fichas/03-padaria-tres.md': '# 03 · Padaria Três\n\n**Contato:** contato@padariatres.exemplo\n\n## A mensagem\n\n> Oi, aqui é a Ana. O formulário de encomenda do seu site não envia.\n',
    'leva-1-padarias/envios.csv': [CABECALHO, linha(L01), linha(L02), linha(L03)].join('\n') + '\n',
    'leva-1-padarias/folha-2026-11-03.md': '# Folha · 2026-11-03\n\n## 03 · Padaria Três\n\n**Contato:** contato@padariatres.exemplo\n\n> Oi, aqui é a Ana. O formulário de encomenda do seu site não envia.\n',
  }
}

let n = 0
// monta a operação em <BASE>/<caso>/saidas/prospeccao-padarias, com as trocas
function operacao (trocas = {}, extras = {}) {
  const raiz = join(BASE, `caso-${++n}`)
  const pasta = join(raiz, 'saidas', 'prospeccao-padarias')
  const arquivos = { ...arquivosBase(), ...trocas }
  for (const [rel, conteudo] of Object.entries(arquivos)) {
    if (conteudo === null) continue
    const arq = join(pasta, rel)
    mkdirSync(dirname(arq), { recursive: true })
    writeFileSync(arq, conteudo)
  }
  for (const [rel, conteudo] of Object.entries(extras)) {
    const arq = join(raiz, 'saidas', rel)
    mkdirSync(dirname(arq), { recursive: true })
    writeFileSync(arq, conteudo)
  }
  return pasta
}

function rodar (pasta, hoje = '2026-11-05', ...mais) {
  const r = spawnSync(process.execPath, [CONFERIR, pasta, '--hoje', hoje, ...mais], { encoding: 'utf8' })
  return { codigo: r.status, saida: r.stdout + r.stderr }
}

const envios = (...linhas) => [CABECALHO, ...linhas].join('\n') + '\n'

function reprova (nome, trocas, padrao, extras = {}) {
  test(`reprova: ${nome}`, () => {
    const { codigo, saida } = rodar(operacao(trocas, extras))
    assert.equal(codigo, 1, saida)
    assert.match(saida, padrao)
  })
}

test('a operação de prova passa', () => {
  const { codigo, saida } = rodar(operacao())
  assert.equal(codigo, 0, saida)
  assert.match(saida, /Nada reprovado/)
})

// o envios.csv
reprova('";" dentro do obs empurra as colunas', { 'leva-1-padarias/envios.csv': envios(linha({ ...L01, obs: 'respondeu à noite; voltar' }), linha(L02), linha(L03)) }, /envios\.csv, linha 2: \d+ colunas/)
reprova('campo obrigatório vazio', { 'leva-1-padarias/envios.csv': envios(linha({ ...L01, contato: '' }), linha(L02), linha(L03)) }, /linha 2: .*contato.*vazio/)
reprova('data que não existe', { 'leva-1-padarias/envios.csv': envios(linha({ ...L01, data: '2026-02-30' }), linha(L02), linha(L03)) }, /linha 2: data inválida/)
reprova('data fora do formato', { 'leva-1-padarias/envios.csv': envios(linha({ ...L01, data: '01/11/2026' }), linha(L02), linha(L03)) }, /linha 2: data inválida/)
reprova('quando que não é data nem "encerrada"', { 'leva-1-padarias/envios.csv': envios(linha(L01), linha(L02), linha({ ...L03, quando: 'amanhã' })) }, /linha 4: quando inválido/)
reprova('volta antes do envio', { 'leva-1-padarias/envios.csv': envios(linha({ ...L01, volta_1: '2026-10-20' }), linha(L02), linha(L03)) }, /linha 2: volta_1 antes/)
reprova('abriu fora de sim ou nao', { 'leva-1-padarias/envios.csv': envios(linha({ ...L01, abriu: 'talvez' }), linha(L02), linha(L03)) }, /linha 2: abriu/)
reprova('situação que o mapa não tem', { 'leva-1-padarias/envios.csv': envios(linha(L01), linha(L02), linha({ ...L03, situacao: 'S99' })) }, /linha 4: situacao "S99"/)
reprova('motivo de perda que o mapa não tem', { 'leva-1-padarias/envios.csv': envios(linha(L01), linha(L02), linha({ ...L03, motivo_perda: 'M77' })) }, /linha 4: motivo_perda "M77"/)
reprova('tipo de resposta que o mapa não tem', { 'leva-1-padarias/envios.csv': envios(linha(L01), linha(L02), linha({ ...L03, tipo_resposta: 'animado' })) }, /linha 4: tipo_resposta "animado"/)
reprova('cabeçalho diferente do molde', { 'leva-1-padarias/envios.csv': envios(linha(L01)).replace('quem_enviou', 'numero') }, /cabeçalho/)
reprova('ficha que não existe na leva', { 'leva-1-padarias/envios.csv': envios(linha(L01), linha(L02), linha({ ...L03, ficha: '09' })) }, /linha 4: a ficha 09 não existe/)
reprova('pediu para parar e não está no nao-contatar.md', { 'leva-1-padarias/envios.csv': envios(linha({ ...L01, pediu_parar: 'sim', resposta: 'sim', tipo_resposta: 'descadastro', situacao: 'S35' }), linha(L02), linha(L03)) }, /linha 2: pediu para parar.*nao-contatar\.md/)
reprova('descadastro sem pediu_parar', { 'leva-1-padarias/envios.csv': envios(linha(L01), linha({ ...L02, pediu_parar: '' }), linha(L03)) }, /linha 3: .*descadastro.*pediu_parar=sim/)

// a lista de quem não quer
reprova('contato da lista numa ficha nova', { 'leva-1-padarias/fichas/04-padaria-quatro.md': '# 04 · Padaria Quatro\n\n**Contato:** +55 (11) 98888-7777\n' }, /fichas\/04-padaria-quatro\.md: .*nao-contatar\.md/)
reprova('contato da lista no resto da ficha, fora do campo Contato', { 'leva-1-padarias/fichas/01-padaria-um.md': '# 01 · Padaria Um\n\n**Contato:** (11) 97777-6666\n\nNa bio do perfil aparece 11988887777.\n' }, /fichas\/01-padaria-um\.md: .*nao-contatar\.md/)
reprova('contato da lista numa linha de envio nova', { 'leva-1-padarias/envios.csv': envios(linha(L01), linha(L02), linha(L03), linha({ ...L02, data: '2026-11-04', pediu_parar: '', tipo_resposta: '', situacao: '', quando: '', resposta: 'silencio' })) }, /linha 5: .*nao-contatar\.md/)
reprova('volta enviada depois do pedido de parar', { 'leva-1-padarias/envios.csv': envios(linha(L01), linha({ ...L02, volta_1: '2026-11-08' }), linha(L03)) }, /linha 3: .*volta.*nao-contatar\.md/)
reprova('contato da lista numa folha depois do pedido', { 'leva-1-padarias/folha-2026-11-04.md': '# Folha · 2026-11-04\n\n## 02 · Padaria Dois\n\n**Contato:** 11 98888-7777\n\n> Oi de novo.\n' }, /folha-2026-11-04\.md: .*nao-contatar\.md/)
reprova('e-mail da lista numa ficha de outra leva', { 'nao-contatar.md': arquivosBase()['nao-contatar.md'] + '| 2026-11-04 | leva-1-padarias/03 | Padaria Três | Contato@PadariaTres.exemplo | "não" |\n', 'leva-2-confeitarias/fichas/01-doce.md': '# 01 · Doce\n\n**Contato:** contato@padariatres.exemplo\n' }, /leva-2-confeitarias\/fichas\/01-doce\.md: .*nao-contatar\.md/)
reprova('linha da lista com data quebrada', { 'nao-contatar.md': arquivosBase()['nao-contatar.md'] + '| ontem | leva-1-padarias/01 | Padaria Um | 5511977776666 | "não" |\n' }, /nao-contatar\.md, linha \d+: data inválida/)
reprova('quem pediu para parar a outra operação', {}, /fichas\/01-padaria-um\.md: .*prospeccao-doces\/nao-contatar\.md/, {
  'prospeccao-doces/MANUAL.md': '# Manual\n',
  'prospeccao-doces/nao-contatar.md': '| Data | Leva e ficha | Negócio | Contato | O que disse |\n|---|---|---|---|---|\n| 2026-10-01 | leva-1-doces/05 | Padaria Um | 11977776666 | "para" |\n',
})

// as mensagens
reprova('palavra do manual da operação numa folha', { 'leva-1-padarias/folha-2026-11-03.md': '# Folha\n\n## 03 · Padaria Três\n\n**Contato:** contato@padariatres.exemplo\n\n> Condição imperdível pra sua padaria.\n' }, /folha-2026-11-03\.md, linha \d+: .*"imperdível"/)
reprova('valor fora da frase de faixa', { 'leva-1-padarias/folha-2026-11-03.md': '# Folha\n\n## 03 · Padaria Três\n\n**Contato:** contato@padariatres.exemplo\n\n> Fica R$ 500 o pacote.\n' }, /folha-2026-11-03\.md, linha \d+: valor em dinheiro fora da frase de faixa/)
reprova('valor somado à frase de faixa', { 'objecoes.md': `# Objeções\n\n> ${FAIXA} Pra você sai por R$ 600.\n` }, /objecoes\.md, linha \d+: valor em dinheiro fora/)
reprova('valor em reais por extenso', { 'objecoes.md': '# Objeções\n\n> Sai por 700 reais.\n' }, /objecoes\.md, linha \d+: valor em dinheiro fora/)
reprova('valor sem frase de faixa decidida', { 'MANUAL.md': '# Manual\n\n**A frase do "quanto custa":** *(a definir)*\n' }, /objecoes\.md, linha \d+: valor em dinheiro fora/)
reprova('mensagem em várias linhas de citação', { 'leva-1-padarias/fichas/01-padaria-um.md': '# 01 · Padaria Um\n\n**Contato:** (11) 97777-6666\n\n> Oi, aqui é a Ana, e esta mensagem não é\n> de robô nenhum.\n' }, /fichas\/01-padaria-um\.md, linha 5: .*"robô"/)

// a leva sem calibragem aprovada
reprova('leva sem calibragem aprovada', { 'calibragem-padarias-2026-10-30/CALIBRAGEM.md': 'estado: proposta\n' }, /calibragem aprovada/)
reprova('calibragem aprovada só com a linha do estado', { 'calibragem-padarias-2026-10-30/CALIBRAGEM.md': 'estado: aprovada\n\nCalibragem simulada.\n' }, /CALIBRAGEM\.md: aprovada, mas sem 13 dos 13 campos/)
reprova('calibragem aprovada com um campo faltando', { 'calibragem-padarias-2026-10-30/CALIBRAGEM.md': calibragem([6]) }, /sem 1 dos 13 campos preenchidos: 6 \(Sinais de dor que dá para ver de fora\)/)
reprova('calibragem aprovada com um campo vazio', { 'calibragem-padarias-2026-10-30/CALIBRAGEM.md': calibragem([], (c) => (c.numero === 10 ? '' : 'Lido, com a fonte.')) }, /sem 1 dos 13 campos preenchidos: 10 \(Gancho-mestre\)/)
reprova('calibragem aprovada com campo do molde em branco', { 'calibragem-padarias-2026-10-30/CALIBRAGEM.md': calibragem([], (c) => (c.numero === 2 ? '*(a definir)*\n\n<!-- preencher -->\n\n[o que troca tempo por dinheiro]' : 'Lido, com a fonte.')) }, /sem 1 dos 13 campos preenchidos: 2 \(Métrica de perfil\)/)
test('os campos da calibragem se leem do estrategista: 13, em ordem', () => {
  assert.equal(CAMPOS.length, 13)
  assert.deepEqual(CAMPOS.map((c) => c.numero), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])
  assert.equal(CAMPOS[12].nome, 'O que não foi confirmado')
})
test('uma calibragem inteira basta, mesmo com outra aprovada incompleta ao lado', () => {
  const { codigo, saida } = rodar(operacao({ 'calibragem-padarias-2026-11-01/CALIBRAGEM.md': 'estado: aprovada\n' }))
  assert.equal(codigo, 0, saida)
})
reprova('mesmo contato em duas levas', { 'leva-2-confeitarias/fichas/01-doce.md': '# 01 · Doce\n\n**Contato:** 11 97777-6666\n' }, /mesmo contato.*leva-1-padarias\/fichas\/01-padaria-um\.md.*leva-2-confeitarias\/fichas\/01-doce\.md/)

// a matriz das palavras do método, gerada do metodo.md
const PALAVRAS = proibidasDe(METODO)
test('o método traz a lista de palavras, com as regras numeradas', () => {
  const termos = PALAVRAS.map((p) => p.termo)
  for (const t of ['case', 'garantia', 'desconto', 'concorrente', 'registro.br', 'OAB', 'negócio local', 'robô', 'sem pressa', 'últimas vagas']) {
    assert.ok(termos.includes(t), `falta "${t}" na lista lida do metodo.md`)
  }
  assert.ok(PALAVRAS.every((p) => Number.isInteger(p.regra)), 'toda palavra traz o número da regra')
  assert.ok(!termos.includes('R$'), 'o valor em dinheiro é regra de código, não palavra')
})
for (const { termo, regra } of PALAVRAS) {
  test(`reprova a palavra do método: "${termo}" (regra ${regra})`, () => {
    const ficha = `# 01 · Padaria Um\n\n**Contato:** (11) 97777-6666\n\n> Oi, aqui é a Ana. Vi uma coisa ${termo.toUpperCase()} no seu perfil.\n`
    const { codigo, saida } = rodar(operacao({ 'leva-1-padarias/fichas/01-padaria-um.md': ficha }))
    assert.equal(codigo, 1, saida)
    assert.match(saida, new RegExp(`regra ${regra}`))
  })
}
test('palavra proibida só reprova inteira: "casement" e "bota" passam', () => {
  const ficha = '# 01 · Padaria Um\n\n**Contato:** (11) 97777-6666\n\n> Oi, aqui é a Ana. Vi a foto da bota e do casement no seu perfil.\n'
  const { codigo, saida } = rodar(operacao({ 'leva-1-padarias/fichas/01-padaria-um.md': ficha }))
  assert.equal(codigo, 0, saida)
})
// a garantia: a palavra segue a memória, pela linha que o manual declara
const GARANTIDAS = PALAVRAS.filter((p) => p.liberaComGarantia).map((p) => p.termo)
const FICHA_GARANTIA = '# 01 · Padaria Um\n\n**Contato:** (11) 97777-6666\n\n> Todo serviço daqui tem garantia de 90 dias na peça e na mão de obra.\n'
const comGarantia = (linha) => arquivosBase()['MANUAL.md'] + `\n**A garantia que se dá de fato:** ${linha}\n`
test('o método marca as palavras da garantia, e só elas', () => {
  assert.deepEqual(GARANTIDAS.sort(), ['garantia', 'garantido', 'garantimos', 'garanto'])
  assert.ok(PALAVRAS.filter((p) => p.liberaComGarantia).every((p) => p.regra === 2))
})
test('garantia: sem a linha no manual, a palavra reprova', () => {
  const { codigo, saida } = rodar(operacao({ 'leva-1-padarias/fichas/01-padaria-um.md': FICHA_GARANTIA }))
  assert.equal(codigo, 1, saida)
  assert.match(saida, /"garantia" na mensagem \(regra 2/)
})
for (const vazia of ['*(nenhuma)*', '*(a definir)*', '[o prazo e o que cobre]', '']) {
  test(`garantia: a linha "${vazia}" não declara, e a palavra reprova`, () => {
    const { codigo, saida } = rodar(operacao({ 'MANUAL.md': comGarantia(vazia), 'leva-1-padarias/fichas/01-padaria-um.md': FICHA_GARANTIA }))
    assert.equal(codigo, 1, saida)
    assert.match(saida, /"garantia" na mensagem/)
  })
}
test('garantia: declarada no manual, a palavra passa', () => {
  const { codigo, saida } = rodar(operacao({ 'MANUAL.md': comGarantia('90 dias no serviço e na peça trocada'), 'leva-1-padarias/fichas/01-padaria-um.md': FICHA_GARANTIA }))
  assert.equal(codigo, 0, saida)
})
test('garantia: declarada, a promessa de posição segue reprovada', () => {
  const ficha = '# 01 · Padaria Um\n\n**Contato:** (11) 97777-6666\n\n> Garanto o primeiro lugar no Google.\n'
  const { codigo, saida } = rodar(operacao({ 'MANUAL.md': comGarantia('90 dias no serviço'), 'leva-1-padarias/fichas/01-padaria-um.md': ficha }))
  assert.equal(codigo, 1, saida)
  assert.match(saida, /"primeiro lugar no google"/)
  assert.doesNotMatch(saida, /"garanto"/)
})
test('garantia: declarada, a palavra que o próprio manual barra segue barrada', () => {
  const manual = comGarantia('90 dias no serviço').replace('A régua barra: `imperdível`', 'A régua barra: `garantia`, `imperdível`')
  const { codigo, saida } = rodar(operacao({ 'MANUAL.md': manual, 'leva-1-padarias/fichas/01-padaria-um.md': FICHA_GARANTIA }))
  assert.equal(codigo, 1, saida)
  assert.match(saida, /"garantia" na mensagem \(o que esta operação não diz/)
})
test('o molde do manual vem sem garantia declarada', () => {
  assert.equal(garantiaDeclarada(readFileSync(join(SKILL, 'modelos', 'MANUAL.md'), 'utf8')), '')
})

test('instrução fora da citação não é mensagem: a palavra passa', () => {
  const ficha = '# 01 · Padaria Um\n\n**Contato:** (11) 97777-6666\n\nNão diga garantia nem robô aqui.\n\n> Oi, aqui é a Ana.\n'
  const { codigo, saida } = rodar(operacao({ 'leva-1-padarias/fichas/01-padaria-um.md': ficha }))
  assert.equal(codigo, 0, saida)
})

// a agenda
test('agenda: a primeira volta aparece no dia 7, e não antes', () => {
  const pasta = operacao()
  assert.doesNotMatch(rodar(pasta, '2026-11-07').saida, /01 · Padaria Um · 1ª volta/)
  const { codigo, saida } = rodar(pasta, '2026-11-08')
  assert.equal(codigo, 0, saida)
  assert.match(saida, /leva-1-padarias · 01 · Padaria Um · 1ª volta · vence hoje/)
})
test('agenda: volta atrasada diz desde quando', () => {
  assert.match(rodar(operacao(), '2026-11-10').saida, /01 · Padaria Um · 1ª volta · vencida desde 2026-11-08/)
})
test('agenda: a segunda volta no dia 21 e a 7 dias da primeira', () => {
  const pasta = operacao({ 'leva-1-padarias/envios.csv': envios(linha({ ...L01, volta_1: '2026-11-18' }), linha(L02), linha(L03)) })
  assert.doesNotMatch(rodar(pasta, '2026-11-24').saida, /2ª volta/)
  assert.match(rodar(pasta, '2026-11-25').saida, /01 · Padaria Um · 2ª volta \(a última\) · vence hoje/)
})
test('agenda: depois da segunda volta, nenhuma volta', () => {
  const pasta = operacao({ 'leva-1-padarias/envios.csv': envios(linha({ ...L01, volta_1: '2026-11-08', volta_2: '2026-11-22' }), linha(L02), linha(L03)) })
  assert.doesNotMatch(rodar(pasta, '2026-12-01').saida, /Padaria Um · \dª volta/)
})
test('agenda: o quando de hoje e o vencido aparecem', () => {
  assert.doesNotMatch(rodar(operacao(), '2026-11-07').saida, /03 · Padaria Três · quando/)
  assert.match(rodar(operacao(), '2026-11-08').saida, /leva-1-padarias · 03 · Padaria Três · quando 2026-11-08 \(hoje\)/)
  assert.match(rodar(operacao(), '2026-11-09').saida, /03 · Padaria Três · quando 2026-11-08 \(vencido\)/)
})
test('agenda: conversa respondida sem quando aparece', () => {
  const pasta = operacao({ 'leva-1-padarias/envios.csv': envios(linha(L01), linha(L02), linha({ ...L03, quando: '' })) })
  assert.match(rodar(pasta).saida, /Sem `quando`[\s\S]*03 · Padaria Três/)
})
test('agenda: quem está na lista de quem não quer não volta na agenda', () => {
  const pasta = operacao({ 'nao-contatar.md': arquivosBase()['nao-contatar.md'] + '| 2026-11-04 | leva-1-padarias/01 | Padaria Um | 5511977776666 | "para" |\n' })
  const { codigo, saida } = rodar(pasta, '2026-11-08')
  assert.equal(codigo, 0, saida)
  assert.doesNotMatch(saida, /Padaria Um · 1ª volta/)
})
test('agenda: o encerrado e o perdido não voltam', () => {
  const pasta = operacao({ 'leva-1-padarias/envios.csv': envios(linha({ ...L01, motivo_perda: 'M02' }), linha(L02), linha({ ...L03, quando: 'encerrada' })) })
  const { saida } = rodar(pasta, '2026-11-09')
  assert.doesNotMatch(saida, /Padaria Um · 1ª volta/)
  assert.doesNotMatch(saida, /Padaria Três · quando/)
})
test('agenda: o teto do manual estourado hoje vira aviso', () => {
  const novo = (f, c) => linha({ ...L01, data: '2026-11-05', ficha: f, contato: c, negocio: `Padaria ${f}` })
  const fichas = { 'leva-1-padarias/fichas/05-a.md': '# 05\n\n**Contato:** 11 95555-0005\n', 'leva-1-padarias/fichas/06-b.md': '# 06\n\n**Contato:** 11 95555-0006\n', 'leva-1-padarias/fichas/07-c.md': '# 07\n\n**Contato:** 11 95555-0007\n' }
  const pasta = operacao({ ...fichas, 'leva-1-padarias/envios.csv': envios(linha(L01), linha(L02), linha(L03), novo('05', '5511955550005'), novo('06', '5511955550006'), novo('07', '5511955550007')) })
  const { codigo, saida } = rodar(pasta, '2026-11-05')
  assert.equal(codigo, 0, saida)
  assert.match(saida, /5511900001111 abriu 3 conversas novas em 2026-11-05, acima do teto de 2/)
})

// o uso
test('uso: --hoje inválido sai com 2', () => {
  assert.equal(rodar(operacao(), '2026-13-01').codigo, 2)
})
test('uso: pasta sem MANUAL.md sai com 2', () => {
  const pasta = operacao({ 'MANUAL.md': null })
  assert.equal(rodar(pasta).codigo, 2)
})
