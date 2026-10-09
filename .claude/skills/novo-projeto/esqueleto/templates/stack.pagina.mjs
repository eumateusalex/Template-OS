// fabrica/stack.mjs — os parâmetros DESTE projeto, na trilha página da fundação.
//
// 🚨 Este arquivo é do PROJETO. A trilha página traz só a marca (tokens e
// fontes) e o portão: ainda não há semente de página. Ajuste os comandos ao que
// o projeto tiver.

export const STACK = 'node'

export const COMANDOS = {
  tipos: 'npx astro check',
  lint: 'npx eslint .',
  testar: 'npx vitest run --passWithNoTests --coverage --coverage.reporter=lcov --coverage.reporter=text-summary',
  testarUm: 'npx vitest run {teste} --reporter=default --reporter=json --outputFile.json={relatorio}'
}

export const CODIGO = ['src']
export const TESTES = ['testes/', 'tela/', '.test.', '.spec.']

/**
 * 🚨 Sem camadas declaradas, e com a razão escrita (constituição III): uma
 * página Astro é rota, componente e estilo, sem domínio para separar. Quando
 * nascer lógica de verdade, ela ganha camada aqui.
 */
export const CAMADAS = null
export const SEM_CAMADAS = 'página Astro sem domínio: rotas, componentes e estilo'

export const APELIDOS = { '@/': 'src/' }
export const AREAS_OBRIGATORIAS = []
export const TEXTO_PUBLICO = ['src/pages', 'src/content']
export const DOCUMENTOS_VIVOS = ['CLAUDE.md', 'briefing.md', 'README.md', 'LEIA-ME.md']
export const COBERTURA = { arquivo: 'coverage/lcov.info' }

export const PISOS = {
  cobertura: 0, // [DATA] · projeto novo começa em 0 e só sobe
  camadas: 0, // [DATA] · a medir
  silencio: 0, // [DATA] · a medir
  tamanho: 0, // [DATA] · a medir
  travessao: 0, // [DATA] · a medir
  envelhecimento: 0 // [DATA] · a medir
}

export const TETOS = { linhas: 400, indentacao: 5 }

/**
 * A lista. Roda inteira e reporta todos os vermelhos. As matrizes de provas da
 * fábrica e da fundação ficam de fora: testam o kit, e rodam no workspace.
 */
export const PASSOS = [
  { nome: 'tipos', cmd: COMANDOS.tipos, onde: 'todos' },
  {
    // Verde que não mede é vermelho (constituição VI): sem ESLint na trilha, o
    // passo se pula com a razão impressa, em vez de sair 0 sem olhar nada.
    nome: 'lint',
    cmd: COMANDOS.lint,
    onde: 'todos',
    precisa: 'FABRICA_LINT',
    razao: 'a trilha página v1 não traz ESLint; ligue quando a semente Astro nascer'
  },
  { nome: 'testar', cmd: COMANDOS.testar, onde: 'todos' },
  {
    nome: 'cobertura',
    cmd: 'node fabrica/portao/cobertura.mjs',
    onde: 'todos',
    precisa: 'FABRICA_COBERTURA',
    razao: 'página nova sem teste ainda não gera lcov; ligue quando o primeiro teste nascer'
  },
  { nome: 'camadas', cmd: 'node fabrica/portao/camadas.mjs', onde: 'todos' },
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
  { nome: 'kit', cmd: 'node fabrica/portao/kit.mjs', onde: 'todos' },
  { nome: 'mutacoes', cmd: 'node fabrica/portao/mutacoes.mjs', onde: 'todos' },
  { nome: 'fundacao', cmd: 'node fundacao/portao/fundacao.mjs', onde: 'todos' },
  { nome: 'marca', cmd: 'node fundacao/portao/marca.mjs', onde: 'todos' }
]
