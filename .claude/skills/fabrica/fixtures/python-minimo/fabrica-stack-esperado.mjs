// O `stack.mjs` do fixture Python, escrito pelo teste da fábrica por cima do
// modelo, com o caminho do `.venv` que o teste acabou de montar.
//
// ⚠️ Todo comando passa por `python -m`. O `ruff.exe`
// também funciona (a política do Windows não o bloqueia), mas `python -m` não
// depende do PATH nem de qual `.venv` está ativo.

export const STACK = 'python'

// O teste da fábrica troca esta linha pelo caminho absoluto do python do .venv.
export const PYTHON = '.venv/Scripts/python.exe'

// ⚠️ `-B` em todos e SEM `-q`, como no modelo: o `-q` some com a faixa que o
// runner conta, e sem o `-B` o Python reusa o .pyc mutado.
export const COMANDOS = {
  tipos: `"${PYTHON}" -B -m mypy --strict src`,
  lint: `"${PYTHON}" -B -m ruff check .`,
  testar: `"${PYTHON}" -B -m coverage run -m pytest && "${PYTHON}" -B -m coverage lcov -o coverage/lcov.info`,
  testarUm: `"${PYTHON}" -B -m pytest -p no:cacheprovider --junit-xml={relatorio} {teste}`
}

export const CODIGO = ['src']
export const TESTES = ['tests/', 'test_', '_test.py', 'conftest.py']

export const CAMADAS = [
  { nome: 'api', raiz: 'src/api', importa: ['dominio', 'infra', 'compartilhado'] },
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
