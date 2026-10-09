// O `stack.mjs` que o teste da fábrica escreve por cima do modelo, para este
// fixture rodar SEM instalar nada.
//
// 🚨 Os três comandos de stack são do PROJETO, e este projeto não tem
// TypeScript nem eslint nem vitest: ele usa o que o Node 24 já traz. O
// `testar` roda com DOIS repórteres, e isso é de propósito:
//
//   spec  → stdout, para o `mutar.mjs` conseguir contar os testes
//   lcov  → arquivo, para o conferidor `cobertura` ter o que ler
//
// ⚠️ Com só o repórter lcov, o stdout fica VAZIO, e aí
// `lerTestes` devolve "não sei ler" e a mutação vira desfecho 4. E o Node
// **não cria a pasta do destino**: sem `coverage/`, ele sai com código 7.

export const STACK = 'node'

const CRIA_PASTA = 'node -e "require(\'node:fs\').mkdirSync(\'coverage\',{recursive:true})"'
const RODA_TESTES = [
  'node --test --experimental-test-coverage',
  '--test-reporter=spec --test-reporter-destination=stdout',
  '--test-reporter=lcov --test-reporter-destination=coverage/lcov.info'
].join(' ')

export const COMANDOS = {
  tipos: 'node -e "process.exit(0)"',
  lint: 'node -e "process.exit(0)"',
  testar: `${CRIA_PASTA} && ${RODA_TESTES}`,
  // O teste de uma tarefa, com o relatório de máquina: o que o vermelho.mjs roda.
  testarUm: 'node --test --test-reporter=spec --test-reporter-destination=stdout --test-reporter=junit --test-reporter-destination={relatorio} {teste}'
}

export const CODIGO = ['src']
export const TESTES = ['testes/', '.test.', '.spec.']

export const CAMADAS = [
  { nome: 'app', raiz: 'src/app', importa: ['dominio', 'infra', 'compartilhado'] },
  { nome: 'dominio', raiz: 'src/dominio', importa: ['compartilhado'] },
  { nome: 'infra', raiz: 'src/infra', importa: ['dominio', 'compartilhado'] },
  { nome: 'compartilhado', raiz: 'src/compartilhado', importa: [] }
]

export const APELIDOS = {}
export const AREAS_OBRIGATORIAS = ['src/compartilhado']
export const TEXTO_PUBLICO = []
export const DOCUMENTOS_VIVOS = ['LEIA-ME.md']
export const COBERTURA = { arquivo: 'coverage/lcov.info' }

export const PISOS = {
  cobertura: 60, // 17/09/2026, medido neste fixture
  camadas: 0, // 17/09/2026
  silencio: 0, // 17/09/2026
  tamanho: 0, // 17/09/2026
  travessao: 0, // 17/09/2026
  envelhecimento: 0 // 17/09/2026
}

export const TETOS = { linhas: 400, indentacao: 5 }

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
  { nome: 'segredos-historico', cmd: 'node fabrica/portao/segredos.mjs --historico', onde: 'todos', precisa: 'CI', razao: 'o histórico é do CI' },
  { nome: 'dependencias', cmd: 'node fabrica/portao/dependencias.mjs', onde: 'todos' },
  { nome: 'auditoria', cmd: 'node fabrica/portao/dependencias.mjs --auditar', onde: 'todos', precisa: 'CI', razao: 'precisa de rede; roda no CI' },
  { nome: 'specs', cmd: 'node fabrica/portao/specs.mjs', onde: 'todos' },
  { nome: 'envelhecimento', cmd: 'node fabrica/portao/envelhecimento.mjs', onde: 'todos' },
  { nome: 'estrutura', cmd: 'node fabrica/portao/estrutura.mjs', onde: 'todos' },
  { nome: 'kit', cmd: 'node fabrica/portao/kit.mjs', onde: 'todos' }
]
