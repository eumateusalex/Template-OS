// fabrica/stack.mjs — os parâmetros DESTE projeto.
//
// 🚨 Este arquivo é do PROJETO. Tudo o mais em `fabrica/` é do kit e não se
// edita: o conferidor `kit` compara byte a byte contra o manifesto.
//
// Conferidor novo entra em três lugares: o arquivo em `fabrica/portao/`, a
// prova em `fabrica/provas/` e a linha em PASSOS aqui (`fabrica/LEIA-ME.md`,
// "Como acrescentar um conferidor"). O conferidor `estrutura` reprova se faltar
// qualquer um, e o CI roda esta mesma lista.

/** 'node' ou 'python'. Decide os comandos e como se lê import. */
export const STACK = 'node'

/**
 * Os comandos de stack. Trocar aqui, nunca no portão.
 * `testarUm` é o que o `fabrica/vermelho.mjs` roda antes de o código existir:
 * um teste só, com o relatório de máquina em {relatorio} (conferido com o
 * vitest 4.1: dois repórteres, a tela e o json).
 */
export const COMANDOS = {
  tipos: 'npx tsc --noEmit',
  lint: 'npx eslint .',
  testar: 'npx vitest run --coverage --coverage.reporter=lcov --coverage.reporter=text-summary',
  testarUm: 'npx vitest run {teste} --reporter=default --reporter=json --outputFile.json={relatorio}'
}

/** Onde mora o código que conta como código. */
export const CODIGO = ['src']

/**
 * O que é teste. Bate ANTES de CODIGO: um arquivo em `src/x.test.ts` é teste,
 * não código, e é isso que faz a regra "teste antes" não se morder.
 */
export const TESTES = ['testes/', 'test/', 'tests/', '.test.', '.spec.']

/**
 * As camadas, e a direção em que a importação pode andar.
 * `null` só com razão escrita: projeto sem camada declarada é projeto que
 * perde a arquitetura um `if` de cada vez (constituição, princípio III).
 */
export const CAMADAS = [
  { nome: 'app', raiz: 'src/app', importa: ['dominio', 'infra', 'compartilhado'] },
  { nome: 'dominio', raiz: 'src/dominio', importa: ['compartilhado'] },
  { nome: 'infra', raiz: 'src/infra', importa: ['dominio', 'compartilhado'] },
  { nome: 'compartilhado', raiz: 'src/compartilhado', importa: [] }
]

/** Os apelidos de caminho, lidos do tsconfig quando houver. */
export const APELIDOS = { '@/': 'src/' }

/**
 * As quatro classes em que o verde pode mentir. Todo arquivo aqui embaixo
 * precisa de teste com mutação registrada no cabeçalho.
 */
export const AREAS_OBRIGATORIAS = [
  'src/seguranca',
  'src/dinheiro',
  'src/terceiros'
]

/**
 * As pastas cujo texto o PÚBLICO lê. Vazio desliga o conferidor `travessao`:
 * travessão em comentário de código não é defeito.
 */
export const TEXTO_PUBLICO = []

/**
 * Os documentos que afirmam o estado do projeto: o conferidor `envelhecimento`
 * lê neles número sem data, e o `estrutura` confere os links. Documento que não
 * existe é pulado, então a lista cobre o que um projeto costuma ter.
 * 🚨 Sem esta linha, num projeto novo o `envelhecimento` olharia ZERO
 * documento e reprovaria por "nada foi medido".
 */
export const DOCUMENTOS_VIVOS = ['CLAUDE.md', 'briefing.md', 'README.md', 'LEIA-ME.md']

/** Onde o runner deixa a cobertura, em lcov. */
export const COBERTURA = { arquivo: 'coverage/lcov.info' }

/**
 * 🚨 Os pisos são CATRACA, não meta: o número não pode piorar, e quando
 * melhora o conferidor sugere descer. Cada um nasce do que foi medido no dia
 * em que o conferidor entrou, com a data ao lado. Piso ausente é reprovação:
 * sem linha de base não se mede nada.
 */
export const PISOS = {
  cobertura: 0, // [DATA] · projeto novo começa em 0 e só sobe
  camadas: 0, // [DATA] · cruzamentos isentos
  silencio: 0, // [DATA] · erros engolidos sem razão declarada
  tamanho: 0, // [DATA] · arquivos acima do teto
  travessao: 0, // [DATA] · travessões em texto público
  envelhecimento: 0 // [DATA] · números vivos sem data
}

/** O teto de tamanho, e a profundidade de indentação. */
export const TETOS = { linhas: 400, indentacao: 5 }

/**
 * O rastro das features.
 * `modeloDesde`: a primeira feature cuja spec segue o modelo da /fabrica
 * (tamanho, Parada 1, as seções do tamanho) e cujas tarefas de código têm um
 * teste cada. Projeto novo nasce cobrado desde a 001.
 * ⚠️ Num projeto que JÁ TEM rastro escrito antes do kit, acrescente `desde`: a
 * primeira feature cobrada inteira (`desde: '012'`, com data e razão ao lado).
 * Abaixo dela, o conferidor `specs` só cobra o nome e o spec.md.
 */
export const SPECS = { modeloDesde: '001' }

/**
 * A lista. Roda na ordem INTEIRA e reporta todos os vermelhos; só o `testar`
 * (ou um passo com `para: true`) interrompe.
 * `onde`: 'todos' | 'maquina' (exige `razao`) | 'pr'
 * `precisa`: nome da variável de ambiente sem a qual o passo se pula
 *
 * ⚠️ A matriz de provas do kit (`fabrica/teste-portao.mjs`) NÃO está aqui: ela
 * testa o kit, não o projeto, leva 43 s por portão e nunca reprovou em uso
 * real. Quem a roda é o teste da fábrica, na fonte do kit.
 */
export const PASSOS = [
  { nome: 'tipos', cmd: COMANDOS.tipos, onde: 'todos' },
  { nome: 'lint', cmd: COMANDOS.lint, onde: 'todos' },
  { nome: 'testar', cmd: COMANDOS.testar, onde: 'todos' },
  { nome: 'cobertura', cmd: 'node fabrica/portao/cobertura.mjs', onde: 'todos' },
  { nome: 'camadas', cmd: 'node fabrica/portao/camadas.mjs', onde: 'todos' },
  { nome: 'mutacoes', cmd: 'node fabrica/portao/mutacoes.mjs', onde: 'todos' },
  { nome: 'silencio', cmd: 'node fabrica/portao/silencio.mjs', onde: 'todos' },
  { nome: 'tamanho', cmd: 'node fabrica/portao/tamanho.mjs', onde: 'todos' },
  { nome: 'travessao', cmd: 'node fabrica/portao/travessao.mjs', onde: 'todos' },
  { nome: 'segredos', cmd: 'node fabrica/portao/segredos.mjs', onde: 'todos' },
  {
    nome: 'segredos-historico',
    cmd: 'node fabrica/portao/segredos.mjs --historico',
    onde: 'todos',
    precisa: 'CI',
    razao: 'o histórico é do CI, onde o checkout traz tudo (fetch-depth: 0) e o gitleaks também varre'
  },
  { nome: 'dependencias', cmd: 'node fabrica/portao/dependencias.mjs', onde: 'todos' },
  {
    nome: 'auditoria',
    cmd: 'node fabrica/portao/dependencias.mjs --auditar',
    onde: 'todos',
    precisa: 'CI',
    razao: 'a auditoria de vulnerabilidade precisa de rede; roda no CI'
  },
  { nome: 'specs', cmd: 'node fabrica/portao/specs.mjs', onde: 'todos' },
  { nome: 'envelhecimento', cmd: 'node fabrica/portao/envelhecimento.mjs', onde: 'todos' },
  { nome: 'estrutura', cmd: 'node fabrica/portao/estrutura.mjs', onde: 'todos' },
  { nome: 'kit', cmd: 'node fabrica/portao/kit.mjs', onde: 'todos' }
]
