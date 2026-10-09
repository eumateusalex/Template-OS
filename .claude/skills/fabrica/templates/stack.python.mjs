// fabrica/stack.mjs — os parâmetros DESTE projeto (trilha Python).
//
// 🚨 Este arquivo é do PROJETO. Tudo o mais em `fabrica/` é do kit e não se
// edita: o conferidor `kit` compara byte a byte contra o manifesto.
//
// 🚨 **O kit é Node, mesmo num projeto Python.** Os conferidores leem texto, e
// só os três comandos de stack mudam. Escrever tudo duas vezes dobraria a
// manutenção por uma pureza que ninguém pediu.
//
// ⚠️ **Todo comando passa por `python -m`**, nunca pelo `.exe` do launcher.
// Medido num `.venv` de verdade: `python -m ruff`, `python -m
// mypy`, `python -m coverage` e `python -m pytest` funcionam, e o `ruff.exe`
// também funciona (a Política de Controle de Aplicativos do Windows NÃO o
// bloqueia; o bloqueio conhecido é do `specify.exe` do `uv tool install`).
// A convenção fica no `python -m` mesmo assim, porque ela não depende do PATH
// nem de qual `.venv` está ativo.
//
// Ferramentas, medidas juntas: ruff 0.16.8, pytest 9.1.1,
// coverage 7.16.1, mypy 2.3.1. Instale com:
//   python -m venv .venv
//   .venv/Scripts/python -m pip install -r requirements-dev.txt

export const STACK = 'python'

/** O interpretador do .venv deste projeto. */
export const PYTHON = process.platform === 'win32' ? '.venv/Scripts/python.exe' : '.venv/bin/python'

/**
 * 🚨 O caminho do interpretador vai ENTRE ASPAS, sempre: sem aspas, o
 * `cmd.exe` lê a barra normal como início de opção e responde
 *   '.venv' não é reconhecido como um comando interno ou externo
 * e o portão para no primeiro passo. O fixture `python-minimo` tem as aspas no
 * arquivo esperado dele, e por isso um caso do teste da fábrica roda o
 * `PYTHON` do template de verdade: medindo só o fixture, a régua passaria verde
 * por cima de um template quebrado.
 */
/**
 * 🚨 SEM `-q`, e isso NÃO é gosto: o `-q` suprime a faixa `===== N passed =====`, que é justamente o que o
 * `lib/runner.mjs` lê para saber quantos testes rodaram. Com ele, o `mutar.mjs`
 * devolve "o runner não mediu nada" em TODA mutação, e nenhuma pode ser
 * reexecutada. Medido nos dois sentidos:
 *   COM -q  → {"rodaram":0,  "conhecido":false}
 *   SEM -q  → {"rodaram":41, "conhecido":true}
 * O portão fica verde porque ele não reexecuta mutação; quem reexecuta é o
 * `--reexecutar`, na entrega, e ali o silêncio aparece como falha de todas.
 *
 * 🚨 E `-B` em todos, que é pior de achar: sem ele, o Python reusa o `.pyc`.
 * Reproduzido duas vezes — uma troca do MESMO comprimento, no MESMO
 * segundo, mantém o carimbo (mtime + tamanho) do bytecode válido, e o
 * interpretador roda o `.pyc` MUTADO depois de o fonte já ter sido restaurado.
 * A direção que quebra o rastro é a inversa: uma mutação julgada contra o
 * bytecode do original é reportada como "PASSOU" sem nunca ter rodado.
 */
export const COMANDOS = {
  tipos: `"${PYTHON}" -B -m mypy --strict src`,
  lint: `"${PYTHON}" -B -m ruff check . && "${PYTHON}" -B -m ruff format --check .`,
  testar: `"${PYTHON}" -B -m coverage run -m pytest && "${PYTHON}" -B -m coverage lcov -o coverage/lcov.info`,
  // Um teste só, com o relatório de máquina (junit): é o que o
  // `fabrica/vermelho.mjs` roda antes de o código existir. Conferido com o
  // pytest 9, inclusive no erro de coleta (módulo ausente).
  testarUm: `"${PYTHON}" -B -m pytest -p no:cacheprovider --junit-xml={relatorio} {teste}`
}

export const CODIGO = ['src']

/**
 * O que é teste. Bate ANTES de CODIGO: `src/x_test.py` é teste, não código.
 */
export const TESTES = ['tests/', 'test/', 'test_', '_test.py', 'conftest.py']

/**
 * As camadas, e a direção em que a importação pode andar.
 * `null` só com `SEM_CAMADAS: '<razão>'` (constituição III).
 */
export const CAMADAS = [
  { nome: 'api', raiz: 'src/api', importa: ['dominio', 'infra', 'compartilhado'] },
  { nome: 'dominio', raiz: 'src/dominio', importa: ['compartilhado'] },
  { nome: 'infra', raiz: 'src/infra', importa: ['dominio', 'compartilhado'] },
  { nome: 'compartilhado', raiz: 'src/compartilhado', importa: [] }
]

/** O Python resolve pacote por nome, não por apelido de caminho. */
export const APELIDOS = {}

export const AREAS_OBRIGATORIAS = [
  'src/seguranca',
  'src/dinheiro',
  'src/terceiros'
]

export const TEXTO_PUBLICO = []

export const DOCUMENTOS_VIVOS = ['LEIA-ME.md', 'README.md']

/** `coverage lcov` escreve aqui. O caminho vem com barra invertida, e o kit normaliza. */
export const COBERTURA = { arquivo: 'coverage/lcov.info' }

/**
 * 🚨 CATRACA, não meta. Cada piso nasce do medido no dia em que o conferidor
 * entrou, com a data ao lado. Piso ausente é reprovação.
 */
export const PISOS = {
  cobertura: 0, // [DATA]
  camadas: 0, // [DATA]
  silencio: 0, // [DATA]
  tamanho: 0, // [DATA]
  travessao: 0, // [DATA]
  envelhecimento: 0 // [DATA]
}

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
