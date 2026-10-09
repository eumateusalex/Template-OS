// fabrica/stack.mjs — os parâmetros DESTE projeto, na trilha app da fundação.
//
// 🚨 Este arquivo é do PROJETO. Tudo o mais em `fabrica/` é do kit da fábrica,
// e tudo em `fundacao/` é da fundação: os dois se conferem por sha.
//
// Vem do modelo `.claude/skills/novo-projeto/esqueleto/templates/stack.app.mjs` do workspace.
// Mude à vontade: a estrutura é ponto de partida, não molde.

/** 'node' ou 'python'. Decide os comandos e como se lê import. */
export const STACK = 'node'

/**
 * Os comandos de stack. Trocar aqui, nunca no portão.
 * `testarUm` é o que o `fabrica/vermelho.mjs` roda antes de o código existir:
 * um teste só, com o relatório de máquina em {relatorio}.
 */
export const COMANDOS = {
  tipos: 'npx tsc --noEmit',
  lint: 'npx eslint .',
  testar: 'npx vitest run --coverage --coverage.reporter=lcov --coverage.reporter=text-summary',
  testarUm: 'npx vitest run {teste} --reporter=default --reporter=json --outputFile.json={relatorio}'
}

/**
 * Onde mora o código que conta como código.
 * ⚠️ `fundacao/` fica de fora de propósito: é conferido, o projeto não pode
 * editá-lo, e conferidor que acusa o que o projeto não conserta é conferidor
 * que alguém desliga.
 */
export const CODIGO = ['src']

/** O que é teste. Bate ANTES de CODIGO: `src/x.test.ts` é teste, não código. */
export const TESTES = ['testes/', 'tela/', '.test.', '.spec.']

/**
 * As camadas do Next, e a direção em que a importação pode andar.
 * `src/proxy.ts` é da camada `app`: é o Next que o chama, a cada requisição.
 */
export const CAMADAS = [
  { nome: 'app', raiz: 'src/app', importa: ['componentes', 'dominio', 'lib'] },
  { nome: 'app', raiz: 'src/proxy.ts', importa: ['componentes', 'dominio', 'lib'] },
  { nome: 'componentes', raiz: 'src/components', importa: ['lib'] },
  { nome: 'dominio', raiz: 'src/dominio', importa: ['lib'] },
  { nome: 'lib', raiz: 'src/lib', importa: [] }
]

/** Os apelidos de caminho, os mesmos do tsconfig. */
export const APELIDOS = { '@/': 'src/' }

/**
 * As áreas em que o verde pode mentir, e onde toda lógica precisa de teste com
 * mutação registrada. A sessão do banco é segurança e dado de terceiro.
 */
export const AREAS_OBRIGATORIAS = ['src/lib/banco']

/** O texto que o público lê: o travessão é proibido aqui (a régua de escrita pública do workspace). */
export const TEXTO_PUBLICO = ['src/app/(site)/conteudo']

/**
 * Os documentos que afirmam o estado do projeto: o `envelhecimento` lê neles
 * número sem data, e o `estrutura` confere os links.
 */
export const DOCUMENTOS_VIVOS = ['CLAUDE.md', 'briefing.md', 'README.md', 'LEIA-ME.md']

/** Onde o runner deixa a cobertura, em lcov. */
export const COBERTURA = { arquivo: 'coverage/lcov.info' }

/**
 * 🚨 Os pisos são CATRACA, não meta. A fundação os mede depois de instalar
 * (`instalar.mjs --pisos`), com os próprios conferidores, e escreve aqui com a
 * data. Daqui em diante, o número só desce.
 */
export const PISOS = {
  cobertura: 0, // [DATA] · projeto novo começa em 0 e só sobe
  camadas: 0, // [DATA] · a medir
  silencio: 0, // [DATA] · a medir
  tamanho: 0, // [DATA] · a medir
  travessao: 0, // [DATA] · a medir
  envelhecimento: 0 // [DATA] · a medir
}

/** O teto de tamanho, e a profundidade de indentação. */
export const TETOS = { linhas: 400, indentacao: 5 }

/**
 * A lista. Roda na ordem INTEIRA e reporta todos os vermelhos; só o `testar`
 * (ou um passo com `para: true`) interrompe.
 * ⚠️ `build` vem antes de `tela`, e fora do servidor do Playwright: o build
 * dentro do `webServer` estoura o prazo dele.
 * ⚠️ As matrizes de provas dos dois kits (`fabrica/teste-portao.mjs` e
 * `fundacao/teste-portao.mjs`) NÃO estão aqui: elas testam o kit, não o
 * projeto, e quem as roda é o teste de cada kit, no workspace (a regra da fábrica,
 * que a fundação segue).
 */
export const PASSOS = [
  { nome: 'tipos', cmd: COMANDOS.tipos, onde: 'todos' },
  { nome: 'lint', cmd: COMANDOS.lint, onde: 'todos' },
  { nome: 'formatar', cmd: 'npx prettier --check .', onde: 'todos' },
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
  { nome: 'kit', cmd: 'node fabrica/portao/kit.mjs', onde: 'todos' },
  { nome: 'fundacao', cmd: 'node fundacao/portao/fundacao.mjs', onde: 'todos' },
  { nome: 'marca', cmd: 'node fundacao/portao/marca.mjs', onde: 'todos' },
  { nome: 'auditar-ui', cmd: 'node fundacao/portao/auditar-ui.mjs', onde: 'todos' },
  { nome: 'build', cmd: 'npm run build', onde: 'todos' },
  { nome: 'tela', cmd: 'node fundacao/portao/tela.mjs', onde: 'todos' }
]
