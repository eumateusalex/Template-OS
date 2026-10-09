// fundação: conferido v1 · o ajuste mora no projeto, nunca aqui
//
// Provas plantadas do conferidor `tela`.
//
// Classe de defeito: o teste de tela que diz "passou" sem ter olhado a tela.
// Três jeitos: nenhum teste rodou, o servidor nem subiu, e a saída mudou de
// formato e ninguém a lê mais. Os três terminam num verde que não mediu nada.
//
// ⚠️ A saída do Playwright é PLANTADA (FUNDACAO_TELA_FALSA e
// FUNDACAO_TELA_SAIU), no formato do repórter `list` do Playwright 1.63, para
// a prova rodar sem navegador.
// mutação: .claude/skills/novo-projeto/esqueleto/kit/conferido/portao/tela.mjs · "const falharam = numero(/^\s*(\d+)\s+failed\b/m)" → "const falharam = 0" · pega em 09/10/2026
// mutação: .claude/skills/novo-projeto/esqueleto/kit/conferido/portao/tela.mjs · "if (!lido.conhecido) {" → "if (false) {" · pega em 09/10/2026
// mutação: .claude/skills/novo-projeto/esqueleto/kit/conferido/portao/tela.mjs · "} else if (lido.rodaram === 0) {" → "} else if (false) {" · pega em 09/10/2026
// mutação: .claude/skills/novo-projeto/esqueleto/kit/conferido/portao/tela.mjs · "} else if (resultado.saiu !== 0) {" → "} else if (false) {" · pega em 09/10/2026

export const conferidor = 'tela'

const env = (raiz, saiu) => () => ({ FUNDACAO_TELA_FALSA: `${raiz}/tela-falsa.txt`, FUNDACAO_TELA_SAIU: String(saiu) })

function caso (nome, espera, cita, saida, saiu) {
  return {
    nome,
    espera,
    cita,
    env: (raiz) => env(raiz, saiu)(),
    planta (raiz, ajuda) { ajuda.escreve('tela-falsa.txt', saida) }
  }
}

export const casos = [
  caso('os testes de tela passando fecham verde, com a contagem', 'verde', /6/,
    'Running 6 tests using 1 worker\n\n  ✓  1 [celular] › tela/vitrine.spec.ts:8:3 › a fonte da marca carregou (1.2s)\n\n  6 passed (14.8s)\n', 0),
  caso('um teste falhando reprova, e diz qual', 'vermelho', /vitrine\.spec\.ts[\s\S]*raio/,
    'Running 6 tests using 1 worker\n\n  ✘  3 [computador] › tela/vitrine.spec.ts:22:3 › o raio do botão é o da casa (2.1s)\n\n  1 failed\n    [computador] › tela/vitrine.spec.ts:22:3 › o raio do botão é o da casa\n  5 passed (15.2s)\n', 1),
  // ⚠️ A régua é a MENSAGEM do conferidor, e não a palavra "zero": o relatório
  // também escreve "zero item varrido", e uma prova que aceitasse os dois
  // deixaria viva a mutação que apaga este ramo.
  caso('zero teste é vermelho: tela que ninguém olhou', 'vermelho', /zero teste de tela/,
    'Running 0 tests using 0 workers\n\n', 0),
  caso('"No tests found" é vermelho', 'vermelho', /zero teste de tela/,
    'Error: No tests found.\nMake sure that arguments are regular expressions matching test files.\n', 1),
  caso('o servidor que não subiu é NÃO MEDIDO, com a última linha dele', 'vermelho', /não medido[\s\S]*webServer/,
    'Error: Timed out waiting 120000ms from config.webServer.\n', 1),
  caso('saída que não se sabe ler é NÃO MEDIDO, nunca verde', 'vermelho', /não medido/,
    'algo que não é o Playwright\n', 0),
  caso('teste instável que passou na segunda conta como rodado, e passa', 'verde', /flaky|instável/,
    'Running 6 tests using 1 worker\n\n  1 flaky\n    [celular] › tela/vitrine.spec.ts:8:3 › a fonte da marca carregou\n  5 passed (16.0s)\n', 0),
  // O Playwright que sai 1 com todos os testes passando (processo morto,
  // servidor que caiu no fim) não pode virar verde.
  caso('o Playwright que sai 1 sem teste falhando é NÃO MEDIDO', 'vermelho', /saiu 1 sem teste falhando/,
    'Running 6 tests using 1 worker\n\n  6 passed (14.8s)\n', 1)
]
