// Provas plantadas do conferidor `specs`, as regras S0 a S9, o `SPECS.desde` e o `SPECS.modeloDesde`.
//
// Classe de defeito: o rastro que diz uma coisa e o código que faz outra. É
// aqui que a fábrica cobra POR SCRIPT o que o texto da skill só pede (princípio
// II): teste antes, o vermelho que alguém viu, a mutação das tarefas [M].
//
// As mutações abaixo são medidas pela matriz: `node kit/teste-portao.mjs --so specs`.
//
// mutação: kit/portao/specs.mjs · "  if (gerada) return" → "  if (true) return" · pega
// mutação: kit/portao/specs.mjs · "  const iNumero = acha(/^(#|n[o.º°]*|num)$/)" → "  const iNumero = -1" · pega
// mutação: kit/portao/specs.mjs · "    if (!cobradaInteira(pasta)) {" → "    if (false) {" · pega
// mutação: kit/portao/specs.mjs · "  if (tamanho === null) {" → "  if (false) {" · pega
// mutação: kit/portao/specs.mjs · "  } else if (!/^(pendente|fechado|sem decisao dele|grill)\b/.test(estado)) {" → "  } else if (false) {" · pega
// mutação: kit/portao/specs.mjs · "  } else if (/^(fechado|grill)/.test(estado) && !DATA.test(parada[1])) {" → "  } else if (false) {" · pega
// mutação: kit/portao/specs.mjs · "    } else if (!secoes.get(achada)) {" → "    } else if (false) {" · pega
// mutação: kit/portao/specs.mjs · "    if (sobra.length > 0) r.achado" → "    if (false) r.achado" · pega
// mutação: kit/portao/specs.mjs · "    if (espera && parada && !pendente) {" → "    if (false) {" · pega
// mutação: kit/portao/specs.mjs · "i.exec(semCodigo(x.l))" → "i.exec(x.l)" · pega
// mutação: kit/portao/specs.mjs · "    if (plano === null && (forma?.tamanho === 'M' || forma?.tamanho === 'G')) {" → "    if (false) {" · pega
// mutação: kit/portao/specs.mjs · "  const noModelo = (pasta) => marcaValida && pasta.slice(0, 3) >= String(modeloDesde)" → "  const noModelo = (pasta) => marcaValida" · pega
// mutação: kit/portao/specs.mjs · "  if (modeloDesde === undefined) {" → "  if (false) {" · pega
// mutação: kit/portao/specs.mjs · "    if (!cabecalhoDeTabela && temConteudo(x.l)) secoes.set(atual, true)" → "    if (temConteudo(x.l)) secoes.set(atual, true)" · pega
// mutação: kit/portao/specs.mjs · "    const minuscula = c.length >= 2 && /^[a-zà-ú]/.test(c)" → "    const minuscula = /^[a-zà-ú]/.test(c)" · pega
// mutação: kit/portao/specs.mjs · "      if (tocaTeste && !tocaCodigo) creditos.set(" → "      if (tocaTeste) creditos.set(" · pega
// mutação: kit/portao/specs.mjs · "        if (credito > 0) {" → "        if (true) {" · pega
// mutação: kit/portao/specs.mjs · "      if (forma !== null && tocaCodigo && !tocaTeste && !dispensada && testesAntes.length > 0) {" → "      if (forma !== null && tocaCodigo && !tocaTeste && testesAntes.length > 0) {" · pega
// mutação: kit/portao/specs.mjs · "          creditos.set(t.fase, credito - 1)" → "          creditos.set(t.fase, credito)" · pega
// mutação: kit/portao/specs.mjs · "      if (t.feito && tocaCodigo && forma?.pendente) {" → "      if (false) {" · pega
// mutação: kit/portao/specs.mjs · "    const marcacao = /^[a-z][a-z0-9-]*\s+[a-z-]+\s*=/.test(m[1]) || /^[a-z][a-z0-9-]*\s*\/$/.test(m[1])" → "    const marcacao = false" · pega
// mutação: kit/portao/specs.mjs · "  return juntarAngulosQuebrados(saida)" → "  return saida" · pega
// mutação: kit/portao/specs.mjs · "    if (!dentro && /^\s*```/.test(original)) {" → "    if (false) {" · pega

import { rmSync } from 'node:fs'
import { join } from 'node:path'

export const conferidor = 'specs'

const CONSTITUICAO_BOA = [
  '# Constituição', '',
  '### I. Teste antes, sempre', '- MUST', '**Razão:** medido em 17/09/2026', '',
  '### II. Regra que importa vira código, não prompt', '- MUST', '**Razão:** medido em 17/09/2026', '',
  '### III. Monolito modular', '- MUST', '**Razão:** medido em 17/09/2026', '',
  '### IV. Nada nasce ligado', '- MUST', '**Razão:** medido em 17/09/2026', '',
  '### V. O estado mora num lugar só', '- MUST', '**Razão:** medido em 17/09/2026', '',
  '### VI. Conferidor que aprova sabe por que aprovou', '- MUST', '**Razão:** medido em 17/09/2026', '',
  '### VII. Decisão de engenharia se escreve antes do código', '- MUST', '**Razão:** medido em 17/09/2026', '',
  '### VIII. Observável por construção', '- MUST', '**Razão:** medido em 17/09/2026', '',
  '### IX. Segurança é fronteira', '- MUST', '**Razão:** medido em 17/09/2026', '',
  '### X. Simplicidade', '- MUST', '**Razão:** medido em 17/09/2026', ''
].join('\n')

const PLANO_BOM = [
  '# Implementation Plan: exemplo', '',
  '## Constitution Check', '',
  '| Princípio | Estado | Como |',
  '|---|---|---|',
  '| I. Teste antes, sempre | cumpre | teste antes de cada tarefa |',
  '| II. Regra que importa vira código, não prompt | cumpre | conferidor |',
  '| III. Monolito modular | não se aplica: projeto de um módulo só | — |',
  '| IV. Nada nasce ligado | cumpre | nada fala com fora |',
  '| V. O estado mora num lugar só | cumpre | tasks.md |',
  '| VI. Conferidor que aprova sabe por que aprovou | cumpre | relatório |',
  '| VII. Decisão de engenharia se escreve antes do código | cumpre | seção abaixo |',
  '| VIII. Observável por construção | cumpre | erro não se engole |',
  '| IX. Segurança é fronteira | cumpre | entrada validada |',
  '| X. Simplicidade | cumpre | zero dependência |',
  '',
  '## Decisões de engenharia', '',
  '| Decisão | Resposta | Razão |',
  '|---|---|---|',
  '| cache | não se aplica: sem leitura repetida | — |',
  '| idempotência | chave por pedido | evita cobrança dupla |',
  '| dinheiro | centavos inteiros | float erra |',
  ''
].join('\n')

const TAREFAS_BOAS = [
  '# Tasks: exemplo', '',
  '## Phase 1: Começo', '',
  '- [x] T001 teste: `testes/a.test.ts`',
  '- [x] T002 código: `src/a.ts`',
  ''
].join('\n')

/** A linha que o `vermelho.mjs` escreve: a única forma de vermelho visto que o S7 aceita. */
const VERMELHO_T002 = "- T002 · vermelho: Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'src/a.ts' · testes/a.test.ts · vermelho.mjs 22/09/2026 abcdef01"
const PROVAS_BOAS = `# Provas\n\n${VERMELHO_T002}\n`

/** O Constitution Check como um plano real escreve: coluna `#`, e o estado com negrito e explicação. */
const PLANO_COM_NUMERO = PLANO_BOM.split('## Constitution Check')[0] + [
  '## Constitution Check', '',
  '| # | Princípio | Estado |',
  '|---|---|---|',
  '| I | Teste antes, sempre | **cumpre** · teste antes de cada tarefa |',
  '| II | Regra que importa vira código, não prompt | **cumpre** · conferidor |',
  '| III | Monolito modular | **não se aplica** · projeto de um módulo só |',
  '| IV | Nada nasce ligado | **cumpre** |',
  '| V | O estado mora num lugar só | **cumpre** |',
  '| VI | Conferidor que aprova sabe por que aprovou | **cumpre** |',
  '| VII | Decisão de engenharia se escreve antes do código | **cumpre** · seção abaixo |',
  '| VIII | Observável por construção | **cumpre** |',
  '| IX | Segurança é fronteira | **cumpre** |',
  '| X | Simplicidade | **cumpre** |',
  '| XI | Migration aditiva | **cumpre** · princípio do projeto |',
  '',
  '## Decisões de engenharia',
  PLANO_BOM.split('## Decisões de engenharia')[1]
].join('\n')

function mundoBom (ajuda) {
  ajuda.escreve('specs/constitution.md', CONSTITUICAO_BOA)
  ajuda.escreve('specs/001-exemplo/spec.md', '# Feature Specification: exemplo\n')
  ajuda.escreve('specs/001-exemplo/plan.md', PLANO_BOM)
  ajuda.escreve('specs/001-exemplo/tasks.md', TAREFAS_BOAS)
  ajuda.escreve('specs/001-exemplo/provas.md', PROVAS_BOAS)
}

/** A linha do vermelho gerado, para qualquer tarefa. */
const vermelhoDe = (id) => VERMELHO_T002.replace('T002', id)

/** O cabeçalho da spec no modelo da fábrica. */
const cabecalho = (tamanho, parada = 'sem decisão dele') => [
  '# Spec · exemplo', '',
  `> Tamanho: ${tamanho} · Modo: esteira · 23/09/2026`, '>',
  `> Parada 1: ${parada}`, ''
]

/** As seções comuns aos três tamanhos, preenchidas. */
const FICA_E_PEDIDOS = [
  '## Fica de fora', '',
  '- Somar mais de dois números: ninguém pediu.', '',
  '## Os pedidos do dono, um a um', '',
  '| Pedido | Onde entrou |',
  '|---|---|',
  '| somar dois números | H1 |', ''
]

/** Uma spec P inteira, como o modelo pede. */
const SPEC_P = [
  ...cabecalho('P'),
  '## O quê', '',
  'Um script que soma dois números para o relatório do mês.', '',
  '## Aceite', '',
  '- `node src/a.ts 2 3` imprime 5.', '',
  ...FICA_E_PEDIDOS
].join('\n')

/** O miolo de uma spec M, sem o cabeçalho. */
const MIOLO_M = [
  '## O quê', '',
  'Um script que soma dois números para o relatório do mês.', '',
  '## Histórias, por prioridade', '',
  '| # | História | Por que nesta ordem |',
  '|---|---|---|',
  '| H1 | Somar | é a única |', '',
  '**Entrega mínima:** H1.', '',
  '### H1 · Somar', '',
  '**Aceite:**',
  '- Dado 2 e 3, quando o script roda, então imprime 5.', '',
  '## Casos de borda', '',
  '- **Número com vírgula:** o script recusa e diz o formato.', '',
  '## Suposições', '',
  '- Os números cabem num inteiro do JavaScript.', '',
  ...FICA_E_PEDIDOS
]
const SPEC_M = [...cabecalho('M'), ...MIOLO_M].join('\n')

/** Uma spec G: a M mais os dados e o sucesso medido. */
const SPEC_G = [
  ...cabecalho('G'), ...MIOLO_M,
  '## Dados', '',
  '| O que se guarda | O que tem dentro | Dado pessoal? | Liga com | Quem pode ver e mudar |',
  '|---|---|---|---|---|',
  '| o total do mês | um número | não | nada | o dono |', '',
  '## Sucesso medido', '',
  '- O total bate com a planilha: base, o primeiro mês.', ''
].join('\n')

/** O mundo bom com a spec no modelo, e a forma cobrada desde a 001. */
function mundoDaForma (ajuda, spec, { desde = '001', plano = true } = {}) {
  mundoBom(ajuda)
  ajuda.escreve('specs/001-exemplo/spec.md', spec)
  if (!plano) rmSync(join(ajuda.raiz, 'specs/001-exemplo/plan.md'))
  ajuda.ajusta({ SPECS: { modeloDesde: desde } })
}

/** As tarefas de uma fase só, na ordem dada, todas feitas, com os vermelhos das de código. */
function tarefasFeitas (ajuda, linhas) {
  ajuda.escreve('specs/001-exemplo/tasks.md', ['# Tasks', '', '## Phase 1: Começo', '', ...linhas, ''].join('\n'))
  const codigo = linhas.filter((l) => /código/.test(l)).map((l) => /T\d+/.exec(l)[0])
  ajuda.escreve('specs/001-exemplo/provas.md', `# Provas\n\n${codigo.map(vermelhoDe).join('\n')}\n`)
}

export const casos = [
  {
    nome: 'mundo inteiro certo passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) { mundoBom(ajuda) }
  },
  {
    nome: 'S2: tasks.md sem tarefa nenhuma reprova (verde medindo zero)',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /tarefa/i,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/tasks.md', '# Tasks: exemplo\n\n## Phase 1: Começo\n\nnada aqui\n')
    }
  },
  {
    nome: 'S3: código sem teste antes, na mesma fase, reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /T002/,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/tasks.md', '# Tasks\n\n## Phase 1: Começo\n\n- [x] T002 código: `src/a.ts`\n')
    }
  },
  {
    nome: 'S3: teste em OUTRA fase não vale como teste antes',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /T002/,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/tasks.md', [
        '# Tasks', '', '## Phase 1: Antes', '', '- [x] T001 teste: `testes/a.test.ts`', '',
        '## Phase 2: Depois', '', '- [x] T002 código: `src/a.ts`', ''
      ].join('\n'))
    }
  },
  {
    nome: 'S3: "sem teste declarado" COM razão passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/tasks.md', [
        '# Tasks', '', '## Phase 1: Começo', '',
        '- [x] T002 código: `src/a.ts` · sem teste declarado: arquivo de configuração sem lógica',
        ''
      ].join('\n'))
      ajuda.escreve('specs/001-exemplo/provas.md', '# Provas\n')
    }
  },
  {
    nome: 'S3: "sem teste declarado" SEM razão reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /T002/,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/tasks.md', [
        '# Tasks', '', '## Phase 1: Começo', '',
        '- [x] T002 código: `src/a.ts` · sem teste declarado:', ''
      ].join('\n'))
    }
  },
  {
    // 🚨 Módulos de produção fazendo aritmética de dinheiro e uma chamada
    // autenticada a terceiro, e `specs/` só com a constituição: sem o S0, o laço
    // das pastas roda ZERO vezes e o conferidor fecha verde. Verde medindo zero
    // é o que o princípio VI proíbe, e a régua violaria a si mesma.
    nome: 'S0: código de produção e NENHUMA pasta de feature reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /NENHUMA pasta de feature/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('specs/constitution.md', CONSTITUICAO_BOA)
      ajuda.escreve('src/dinheiro.ts', 'export const taxa = (v: number) => Math.round(v * 1.02)\n')
    }
  },
  {
    nome: 'S0: projeto SEM código de produção nenhum não é cobrado',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      // ⚠️ O par que impede a régua de virar cerimônia: repositório que só tem
      // documento, ou que só tem teste, não deve spec a ninguém.
      ajuda.escreve('specs/constitution.md', CONSTITUICAO_BOA)
      ajuda.escreve('testes/a.test.ts', 'test("x", () => {})\n')
    }
  },
  {
    nome: 'S0: "sem spec declarado" no README COM razão dispensa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('specs/constitution.md', CONSTITUICAO_BOA)
      ajuda.escreve('src/dinheiro.ts', 'export const taxa = (v: number) => Math.round(v * 1.02)\n')
      ajuda.escreve('README.md', '# espelho\n\nsem spec declarado: este projeto espelha outro, e a spec mora la\n')
    }
  },
  {
    nome: 'S0: "sem spec declarado" SEM razão não dispensa',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /NENHUMA pasta de feature/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('specs/constitution.md', CONSTITUICAO_BOA)
      ajuda.escreve('src/dinheiro.ts', 'export const taxa = (v: number) => Math.round(v * 1.02)\n')
      ajuda.escreve('README.md', '# espelho\n\nsem spec declarado:\n')
    }
  },
  {
    // 🚨 Uma tarefa de rastro passaria sem recibo porque a tarefa ACIMA dela
    // termina com `sem teste declarado: <razão>`, e o `isento` genérico olha a
    // linha e a de cima. Isso é certo para código (o comentário vem acima da
    // linha) e é errado numa LISTA, onde a linha de cima é outra tarefa. A
    // isenção vazaria para baixo, e cada tarefa dispensada dispensaria a
    // seguinte de graça.
    nome: 'S3/S7: a isenção da tarefa DE CIMA não vaza para a de baixo',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /T003/,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/tasks.md', [
        '# Tasks', '', '## Phase 1: Começo', '',
        '- [x] T002 código: `src/a.ts` · sem teste declarado: arquivo de configuração sem lógica',
        '- [x] T003 código: `src/b.ts`',
        ''
      ].join('\n'))
      ajuda.escreve('specs/001-exemplo/provas.md', '# Provas\n')
    }
  },
  {
    nome: 'S3/S7: a isenção DA PRÓPRIA tarefa continua valendo',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/tasks.md', [
        '# Tasks', '', '## Phase 1: Começo', '',
        '- [x] T002 código: `src/a.ts` · sem teste declarado: arquivo de configuração sem lógica',
        '- [x] T003 código: `src/b.ts` · sem teste declarado: idem, só constante nomeada',
        ''
      ].join('\n'))
      ajuda.escreve('specs/001-exemplo/provas.md', '# Provas\n')
    }
  },
  {
    nome: 'S3/S7: a isenção na CONTINUAÇÃO indentada da tarefa vale',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      // ⚠️ O par que impede o conserto de virar rigidez: tarefa com razão longa
      // se escreve com a razão na linha seguinte, indentada.
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/tasks.md', [
        '# Tasks', '', '## Phase 1: Começo', '',
        '- [x] T002 código: `src/a.ts`',
        '      sem teste declarado: arquivo de configuração sem lógica nenhuma dentro',
        ''
      ].join('\n'))
      ajuda.escreve('specs/001-exemplo/provas.md', '# Provas\n')
    }
  },
  {
    nome: 'S4: Constitution Check em prosa, sem tabela, reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /Constitution Check/i,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/plan.md', '# Plano\n\n## Constitution Check\n\nTudo certo, conferi.\n\n## Decisões de engenharia\n\n| Decisão | Resposta | Razão |\n|---|---|---|\n| cache | não se aplica: sem leitura repetida | — |\n')
    }
  },
  {
    nome: 'S4: tabela faltando um princípio reprova, dizendo qual',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /VII/,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/plan.md', PLANO_BOM.replace('| VII. Decisão de engenharia se escreve antes do código | cumpre | seção abaixo |\n', ''))
    }
  },
  {
    nome: 'S4: estado que não é cumpre/não se aplica/viola reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /talvez|estado/i,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/plan.md', PLANO_BOM.replace('| I. Teste antes, sempre | cumpre |', '| I. Teste antes, sempre | talvez |'))
    }
  },
  {
    nome: 'S5: plano sem a seção de decisões de engenharia reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /Decisões de engenharia/i,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/plan.md', PLANO_BOM.split('## Decisões de engenharia')[0])
    }
  },
  {
    nome: 'S6: constituição sem um dos dez títulos do núcleo reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /IX|núcleo/i,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/constitution.md', CONSTITUICAO_BOA.replace('### IX. Segurança é fronteira', '### IX. Outra coisa qualquer'))
    }
  },
  {
    nome: 'S6: constituição fora de ordem reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /ordem/i,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      const trocado = CONSTITUICAO_BOA
        .replace('### I. Teste antes, sempre', '### TEMP')
        .replace('### II. Regra que importa vira código, não prompt', '### I. Teste antes, sempre')
        .replace('### TEMP', '### II. Regra que importa vira código, não prompt')
      ajuda.escreve('specs/constitution.md', trocado)
    }
  },
  {
    nome: 'S7: tarefa de código FEITA sem linha de vermelho em provas.md reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /T002/,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/provas.md', '# Provas\n\nnenhum recibo aqui\n')
    }
  },
  {
    nome: 'S7: tarefa ABERTA não precisa de recibo ainda',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/tasks.md', TAREFAS_BOAS.replace('- [x] T002', '- [ ] T002'))
      ajuda.escreve('specs/001-exemplo/provas.md', '# Provas\n')
    }
  },
  {
    // 🚨 A mutação de uma tarefa [M] mora num lugar só: o cabeçalho do teste,
    // que é onde o `mutar.mjs --registrar` escreve e onde o conferidor
    // `mutacoes` lê. Uma linha no provas.md seria o segundo registro do mesmo
    // fato, e os dois descolariam.
    nome: 'S7: tarefa [M] feita SEM registro no cabeçalho do teste reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /T002.*mutação/s,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/tasks.md', TAREFAS_BOAS.replace('- [x] T002 código:', '- [x] T002 [M] código:'))
      ajuda.escreve('testes/a.test.ts', 'test("a", () => {})\n')
    }
  },
  {
    nome: 'S7: tarefa [M] feita COM registro no cabeçalho do teste passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/tasks.md', TAREFAS_BOAS.replace('- [x] T002 código:', '- [x] T002 [M] código:'))
      ajuda.escreve('src/a.ts', 'export const valor = 1\n')
      ajuda.escreve('testes/a.test.ts', '// mutação: src/a.ts · "const valor = 1" → "const valor = 2" · pega em 09/10/2026\ntest("a", () => {})\n')
    }
  },
  {
    nome: 'S7: o registro no cabeçalho tem que ser do ARQUIVO da tarefa [M]',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /T002.*mutação/s,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/tasks.md', TAREFAS_BOAS.replace('- [x] T002 código:', '- [x] T002 [M] código:'))
      ajuda.escreve('src/outro.ts', 'export const valor = 1\n')
      ajuda.escreve('testes/a.test.ts', '// mutação: src/outro.ts · "const valor = 1" → "const valor = 2" · pega em 09/10/2026\ntest("a", () => {})\n')
    }
  },
  {
    nome: 'S7: a linha de mutação velha no provas.md não é mais cobrada nem conta',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /T002.*mutação/s,
    planta (raiz, stack, ajuda) {
      // ⚠️ O registro no provas.md não prova a mutação [M]: o que prova é o
      // cabeçalho do teste. Sem ele, a tarefa [M] reprova mesmo com a linha aqui.
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/tasks.md', TAREFAS_BOAS.replace('- [x] T002 código:', '- [x] T002 [M] código:'))
      ajuda.escreve('src/a.ts', 'export const valor = 1\n')
      ajuda.escreve('specs/001-exemplo/provas.md', `${PROVAS_BOAS}- T002 · mutação: src/a.ts · "const valor = 1" → "const valor = 2" · pega\n`)
    }
  },
  {
    // 🚨 Linha `vermelho:` escrita à mão aponta para vermelho que ninguém viu, e
    // não vale: vale a que o `vermelho.mjs` gera, ou a declaração honesta de que
    // não houve.
    nome: 'S7: vermelho escrito à mão, fora do formato gerado, reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /T002.*vermelho\.mjs/s,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/provas.md', '# Provas\n\n- T002 · vermelho: `Cannot find module src/a.ts`\n')
    }
  },
  {
    nome: 'S7: "vermelho não visto" COM razão passa, e fica contável',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/provas.md', '# Provas\n\n- T002 · vermelho não visto: o teste é de banco e a bancada não sobe nesta máquina\n')
    }
  },
  {
    nome: 'S7: "vermelho não visto" SEM razão reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /T002/,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/provas.md', '# Provas\n\n- T002 · vermelho não visto:\n')
    }
  },
  {
    nome: 'S7: o vermelho gerado de OUTRA tarefa não vale para esta',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /T002/,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/provas.md', `# Provas\n\n${VERMELHO_T002.replace('T002', 'T009')}\n`)
    }
  },
  {
    // 🚨 Plano real tem uma coluna `#` antes do princípio e escreve o estado
    // com negrito e explicação, e o S4 de posição fixa leria a coluna errada
    // (um terço dos achados de um plano real). A régua acha as colunas pelo
    // cabeçalho.
    nome: 'S4: a tabela com coluna #, negrito e explicação no estado passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/plan.md', PLANO_COM_NUMERO)
    }
  },
  {
    nome: 'S4: na tabela com coluna #, estado inválido continua reprovando',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /talvez/,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/plan.md', PLANO_COM_NUMERO.replace('| **cumpre** · conferidor |', '| **talvez** · conferidor |'))
    }
  },
  {
    nome: 'S4: na tabela com coluna #, "não se aplica" sem razão reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /III/,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/plan.md', PLANO_COM_NUMERO.replace('| **não se aplica** · projeto de um módulo só |', '| **não se aplica** |'))
    }
  },
  {
    nome: 'S4: na tabela com coluna #, faltar um princípio reprova dizendo qual',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /VIII/,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/plan.md', PLANO_COM_NUMERO.replace('| VIII | Observável por construção | **cumpre** |\n', ''))
    }
  },
  {
    // ⚠️ `SPECS.desde` é catraca de rastro: um projeto pode ter uma centena de
    // rastros escritos antes do kit, e cobrar todos de uma vez é o conferidor
    // que alguém desliga.
    // Abaixo do número vale só o S1 (nome e spec.md).
    nome: 'desde: feature ABAIXO do número só responde pelo S1',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.ajusta({ SPECS: { desde: '002' } })
      ajuda.escreve('specs/001-exemplo/plan.md', '# Plano\n\nsem tabela nenhuma\n')
      ajuda.escreve('specs/001-exemplo/provas.md', '# Provas\n')
    }
  },
  {
    nome: 'desde: feature NO número ou acima responde por tudo',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /002-nova/,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.ajusta({ SPECS: { desde: '002' } })
      ajuda.escreve('specs/002-nova/spec.md', '# Spec\n')
      ajuda.escreve('specs/002-nova/tasks.md', TAREFAS_BOAS)
      ajuda.escreve('specs/002-nova/provas.md', '# Provas\n')
    }
  },
  {
    nome: 'desde: abaixo do número, a pasta sem spec.md continua reprovando',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /001-velha.*spec\.md/s,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.ajusta({ SPECS: { desde: '005' } })
      ajuda.escreve('specs/001-velha/tasks.md', TAREFAS_BOAS)
    }
  },
  {
    nome: 'desde: valor que não é número de três dígitos é não medido',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /desde/,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.ajusta({ SPECS: { desde: 'dois' } })
    }
  },
  {
    // ⚠️ S5 avisa, e não reprova, quando faltam itens do catálogo: a lista é
    // de dezessete, e projeto de um script não responde CQRS. O que reprova
    // continua sendo a seção ausente e a resposta em branco.
    nome: 'S5: plano com poucos itens do catálogo AVISA e passa',
    stacks: ['node'],
    espera: 'verde',
    cita: /não responde \d+ item\(ns\) do catálogo/,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
    }
  },
  {
    nome: 'S5: decisão com a resposta em branco reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /cache/,
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      ajuda.escreve('specs/001-exemplo/plan.md', PLANO_BOM.replace('| cache | não se aplica: sem leitura repetida | — |', '| cache |  | — |'))
    }
  },
  {
    nome: 'S1: sem specs/ nenhuma é NÃO MEDIDO',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /nada foi medido|specs/i,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('LEIA-ME.md', 'projeto sem spec\n')
    }
  },

  // ── S9 · a forma da spec ───────────────────────────────────────────────────
  // 🚨 O modelo da fábrica é a única régua da spec, e sem o S9 uma spec de uma
  // linha passaria. A forma vale só a partir de `SPECS.modeloDesde`, porque as
  // specs de antes não têm o modelo.
  {
    nome: 'S9: spec P inteira passa, sem histórias e sem plano',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) { mundoDaForma(ajuda, SPEC_P, { plano: false }) }
  },
  {
    nome: 'S9: spec M inteira passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) { mundoDaForma(ajuda, SPEC_M) }
  },
  {
    nome: 'S9: spec G inteira passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) { mundoDaForma(ajuda, SPEC_G) }
  },
  {
    nome: 'S9: spec só com o título reprova pelo tamanho',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /não declara o tamanho/,
    planta (raiz, stack, ajuda) { mundoDaForma(ajuda, '# Spec · exemplo\n') }
  },
  {
    nome: 'S9: tamanho que não é P, M ou G reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /não declara o tamanho/,
    planta (raiz, stack, ajuda) { mundoDaForma(ajuda, SPEC_P.replace('Tamanho: P', 'Tamanho: pequeno')) }
  },
  {
    nome: 'S9: sem a linha da Parada 1 reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /linha da Parada 1/,
    planta (raiz, stack, ajuda) { mundoDaForma(ajuda, SPEC_P.replace('> Parada 1: sem decisão dele', '>')) }
  },
  {
    nome: 'S9: Parada 1 num estado que não vale reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /Parada 1 "ok"/,
    planta (raiz, stack, ajuda) { mundoDaForma(ajuda, SPEC_P.replace('Parada 1: sem decisão dele', 'Parada 1: ok')) }
  },
  {
    nome: 'S9: Parada 1 fechada sem a data reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /Parada 1 "fechado" não tem a data/,
    planta (raiz, stack, ajuda) { mundoDaForma(ajuda, SPEC_P.replace('Parada 1: sem decisão dele', 'Parada 1: fechado')) }
  },
  {
    nome: 'S9: Parada 1 fechada com a data, e grill com a data, passam',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      mundoDaForma(ajuda, SPEC_P.replace('Parada 1: sem decisão dele', 'Parada 1: fechado · 23/09/2026'))
      ajuda.escreve('specs/002-outra/spec.md', SPEC_P.replace('Parada 1: sem decisão dele', 'Parada 1: grill · 22/09/2026'))
    }
  },
  {
    nome: 'S9: spec M sem os casos de borda reprova, citando a seção',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /Casos de borda/,
    planta (raiz, stack, ajuda) {
      mundoDaForma(ajuda, SPEC_M.replace('## Casos de borda\n\n- **Número com vírgula:** o script recusa e diz o formato.\n\n', ''))
    }
  },
  {
    nome: 'S9: spec G sem os dados reprova, e a mesma seção na M não é cobrada',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /^(?=[\s\S]*001-exemplo[^\n]*Dados)(?![\s\S]*002-outra[^\n]*Dados)/,
    planta (raiz, stack, ajuda) {
      mundoDaForma(ajuda, SPEC_G.split('## Dados')[0])
      ajuda.escreve('specs/002-outra/spec.md', SPEC_M)
    }
  },
  {
    nome: 'S9: spec P sem o aceite reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /Aceite/,
    planta (raiz, stack, ajuda) { mundoDaForma(ajuda, SPEC_P.replace('## Aceite\n\n- `node src/a.ts 2 3` imprime 5.\n\n', '')) }
  },
  {
    nome: 'S9: seção só com o texto do modelo reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /Fica de fora/,
    planta (raiz, stack, ajuda) {
      mundoDaForma(ajuda, SPEC_P.replace('- Somar mais de dois números: ninguém pediu.', '- <o que não entra nesta feature, e por quê>'))
    }
  },
  {
    nome: 'S9: seção só com comentário reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /O quê/,
    planta (raiz, stack, ajuda) {
      mundoDaForma(ajuda, SPEC_P.replace('Um script que soma dois números para o relatório do mês.', '<!-- o que o dono pediu -->'))
    }
  },
  {
    nome: 'S9: tabela só com o cabeçalho do modelo reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /Os pedidos do dono/,
    planta (raiz, stack, ajuda) { mundoDaForma(ajuda, SPEC_P.replace('| somar dois números | H1 |', '')) }
  },
  {
    nome: 'S9: texto do modelo sobrando numa seção preenchida reprova, com a linha',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /spec\.md:\d+[^\n]*\[título\]/,
    planta (raiz, stack, ajuda) { mundoDaForma(ajuda, SPEC_M.replace('### H1 · Somar', '### H1 · [título]')) }
  },
  {
    nome: 'S9: colchete e ângulo legítimos não são texto do modelo',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      mundoDaForma(ajuda, SPEC_P.replace('- Somar mais de dois números: ninguém pediu.', [
        '- Somar mais de dois números: ninguém pediu ([a conversa](https://exemplo.com/a b)).',
        '- A tarefa [M] e a marca [x] ficam; `vermelho não visto: <razão>` é código; <br> e <a href="x"> não são modelo; [ ] também não.',
        '- A marca `(espera P9)` entre crases é citação, não pendência.',
        // O bloco cercado e a quebra autofechada não podem dar falso positivo.
        '```ts', 'const m: Map<string, number> = new Map() // [ver abaixo]', '```',
        '- Uma quebra na tabela: a<br />b.'
      ].join('\n')))
    }
  },
  {
    nome: 'S9: título com acento, negrito e texto depois casa pelo começo',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      mundoDaForma(ajuda, SPEC_M.replace('## Casos de borda', '## **Casos de Borda** (o que dá errado)').replace('## Suposições', '## Suposicoes'))
    }
  },
  {
    nome: 'S9: spec M com tasks.md e sem plan.md reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /plan\.md/,
    planta (raiz, stack, ajuda) { mundoDaForma(ajuda, SPEC_M, { plano: false }) }
  },
  {
    nome: 'S9: Parada 1 pendente com tarefa de código feita reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /T002[^\n]*pendente/,
    planta (raiz, stack, ajuda) { mundoDaForma(ajuda, SPEC_P.replace('Parada 1: sem decisão dele', 'Parada 1: pendente · 1 pergunta')) }
  },
  {
    nome: 'S9: Parada 1 pendente com o código por fazer passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      mundoDaForma(ajuda, SPEC_P.replace('Parada 1: sem decisão dele', 'Parada 1: pendente · 1 pergunta') + '\nO total mensal (espera P1).\n')
      ajuda.escreve('specs/001-exemplo/tasks.md', TAREFAS_BOAS.split('[x]').join('[ ]'))
    }
  },
  {
    nome: 'S9: "(espera P2)" sobrando numa spec que se diz fechada reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /espera P2/,
    planta (raiz, stack, ajuda) {
      mundoDaForma(ajuda, SPEC_P.replace('imprime 5.', 'imprime 5 (espera P2).').replace('Parada 1: sem decisão dele', 'Parada 1: fechado · 23/09/2026'))
    }
  },
  {
    nome: 'S9: feature abaixo de modeloDesde não é cobrada, e a nota diz',
    stacks: ['node'],
    espera: 'verde',
    cita: /abaixo de SPECS\.modeloDesde/,
    planta (raiz, stack, ajuda) { mundoDaForma(ajuda, '# Spec · exemplo\n', { desde: '002' }) }
  },
  {
    nome: 'S9: sem modeloDesde a forma não é cobrada, e a nota diz',
    stacks: ['node'],
    espera: 'verde',
    cita: /modeloDesde não declarado/,
    planta (raiz, stack, ajuda) { mundoBom(ajuda) }
  },
  {
    nome: 'S9: modeloDesde que não é número de três dígitos é não medido',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /SPECS\.modeloDesde é "um"/,
    planta (raiz, stack, ajuda) { mundoDaForma(ajuda, SPEC_P, { desde: 'um' }) }
  },
  {
    // 🚨 O texto do "O quê" do modelo ocupa três linhas, e o ângulo que abre
    // numa linha e fecha noutra passaria como conteúdo. É a seção que todo tamanho pede.
    nome: 'S9: a seção com o texto do modelo quebrado em várias linhas reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /seção "## O quê" está vazia/,
    planta (raiz, stack, ajuda) {
      mundoDaForma(ajuda, SPEC_P.replace('Um script que soma dois números para o relatório do mês.', [
        '<O que o dono pediu, com as palavras dele quando der. Duas a seis frases: quem usa,',
        'o que muda na vida dessa pessoa, por que agora, e o que alguém precisa PASSAR A',
        'FAZER para o sistema funcionar (ex.: o professor marcar a presença todo dia).>'
      ].join('\n')))
    }
  },
  {
    // 🚨 A dispensa de teste não dispensa a Parada 1: com a checagem depois do
    // `continue` das dispensadas, dispensaria.
    nome: 'S9: Parada 1 pendente com tarefa de código dispensada e feita também reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /T002[^\n]*Parada 1 pendente/,
    planta (raiz, stack, ajuda) {
      mundoDaForma(ajuda, SPEC_P.replace('Parada 1: sem decisão dele', 'Parada 1: pendente · 1 pergunta'))
      tarefasFeitas(ajuda, ['- [ ] T001 teste: `testes/a.test.ts`', '- [x] T002 código: `src/config.ts` · sem teste declarado: só constante lida no arranque'])
    }
  },
  {
    // ⚠️ A expressão dos ângulos com repetição dentro tem custo cúbico, e uma
    // linha de 16 mil caracteres com `<a ` repetido leva 111 s.
    // O caso tem o teto de tempo da matriz: a versão cúbica estoura.
    nome: 'S9: linha longa de ângulos e colchetes abertos se lê rápido',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      mundoDaForma(ajuda, SPEC_P.replace('- Somar mais de dois números: ninguém pediu.', `- Somar mais de dois números: ninguém pediu. ${'<a '.repeat(6000)} ${'[a '.repeat(6000)}`))
    }
  },

  // ── S3 · um teste por tarefa de código, dentro do alcance da forma ─────────
  // 🚨 Um teste na fase não libera todas as tarefas de código dela: T010
  // teste, T011 código e T012 código deixaria a T012 sem teste nenhum antes. Dentro do alcance de `modeloDesde`, cada tarefa de
  // código consome o teste de uma tarefa de teste anterior.
  {
    nome: 'S3: duas tarefas de código com um teste só reprova, citando a segunda',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /T003[^\n]*outra tarefa/,
    planta (raiz, stack, ajuda) {
      mundoDaForma(ajuda, SPEC_P)
      tarefasFeitas(ajuda, ['- [x] T001 teste: `testes/a.test.ts`', '- [x] T002 código: `src/a.ts`', '- [x] T003 código: `src/b.ts`'])
    }
  },
  {
    nome: 'S3: a mesma sequência fora do alcance da forma passa, como antes',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      mundoBom(ajuda)
      tarefasFeitas(ajuda, ['- [x] T001 teste: `testes/a.test.ts`', '- [x] T002 código: `src/a.ts`', '- [x] T003 código: `src/b.ts`'])
    }
  },
  {
    nome: 'S3: teste e código alternados passam',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      mundoDaForma(ajuda, SPEC_P)
      tarefasFeitas(ajuda, [
        '- [x] T001 teste: `testes/a.test.ts`', '- [x] T002 código: `src/a.ts`',
        '- [x] T003 teste: `testes/b.test.ts`', '- [x] T004 código: `src/b.ts`'
      ])
    }
  },
  {
    nome: 'S3: dois testes antes de dois códigos passam',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      mundoDaForma(ajuda, SPEC_P)
      tarefasFeitas(ajuda, [
        '- [x] T001 teste: `testes/a.test.ts`', '- [x] T002 teste: `testes/b.test.ts`',
        '- [x] T003 código: `src/a.ts`', '- [x] T004 código: `src/b.ts`'
      ])
    }
  },
  {
    nome: 'S3: tarefa com teste e código na mesma linha não empresta o teste a outra',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /T002[^\n]*outra tarefa/,
    planta (raiz, stack, ajuda) {
      mundoDaForma(ajuda, SPEC_P)
      tarefasFeitas(ajuda, ['- [x] T001 código: `testes/a.test.ts` `src/a.ts`', '- [x] T002 código: `src/b.ts`'])
    }
  },
  {
    nome: 'S3: tarefa dispensada não consome o teste de ninguém',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      mundoDaForma(ajuda, SPEC_P)
      tarefasFeitas(ajuda, [
        '- [x] T001 teste: `testes/a.test.ts`',
        '- [x] T002 código: `src/config.ts` · sem teste declarado: só constante, lida pelo teste da T003',
        '- [x] T003 código: `src/a.ts`'
      ])
    }
  }
]
