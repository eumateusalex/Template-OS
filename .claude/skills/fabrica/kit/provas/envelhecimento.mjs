// Provas plantadas do conferidor `envelhecimento`.
//
// Classe de defeito: documento vivo que afirma um número no presente e não
// diz quando mediu. Constituição V. É o `CLAUDE.md` que afirma "547 casos" com
// o número já dois atrás.
//
// 🚨 A régua tem que ser ESTREITA. Um conferidor que acusa todo número de todo
// documento é um conferidor que ninguém roda duas vezes.

export const conferidor = 'envelhecimento'

export const casos = [
  {
    nome: 'contagem no presente sem data reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /LEIA-ME\.md/,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ DOCUMENTOS_VIVOS: ['LEIA-ME.md'], PISOS: { envelhecimento: 0 } })
      ajuda.escreve('LEIA-ME.md', 'O portão roda 34 conferidores.\n')
    }
  },
  {
    nome: 'a mesma frase COM data passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ DOCUMENTOS_VIVOS: ['LEIA-ME.md'], PISOS: { envelhecimento: 0 } })
      ajuda.escreve('LEIA-ME.md', 'O portão roda 34 conferidores (medido em 17/09/2026).\n')
    }
  },
  {
    nome: 'isenção "número vivo" com razão passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ DOCUMENTOS_VIVOS: ['LEIA-ME.md'], PISOS: { envelhecimento: 0 } })
      ajuda.escreve('LEIA-ME.md', 'O portão roda 34 conferidores. <!-- número vivo: quem responde é o --listar -->\n')
    }
  },
  {
    nome: 'versão não é contagem',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ DOCUMENTOS_VIVOS: ['LEIA-ME.md'], PISOS: { envelhecimento: 0 } })
      ajuda.escreve('LEIA-ME.md', 'Node 24 e kit v1.2.3 aqui.\nVersão 2.0.0 do contrato.\n')
    }
  },
  {
    nome: 'número dentro de código inline não conta',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ DOCUMENTOS_VIVOS: ['LEIA-ME.md'], PISOS: { envelhecimento: 0 } })
      ajuda.escreve('LEIA-ME.md', 'Rode `node --test 12 arquivos` quando precisar.\n')
    }
  },
  {
    nome: 'número dentro de bloco de código não conta',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ DOCUMENTOS_VIVOS: ['LEIA-ME.md'], PISOS: { envelhecimento: 0 } })
      ajuda.escreve('LEIA-ME.md', 'Assim:\n\n```\nsão 34 conferidores rodando\n```\n\nFim.\n')
    }
  },
  {
    nome: 'catraca: dentro do piso declarado, passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ DOCUMENTOS_VIVOS: ['LEIA-ME.md'], PISOS: { envelhecimento: 1 } })
      ajuda.escreve('LEIA-ME.md', 'O portão roda 34 conferidores.\n')
    }
  },
  {
    nome: 'documento fora da lista não é varrido',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ DOCUMENTOS_VIVOS: ['LEIA-ME.md'], PISOS: { envelhecimento: 0 } })
      ajuda.escreve('LEIA-ME.md', 'Nada de números aqui.\n')
      ajuda.escreve('outro.md', 'O portão roda 34 conferidores.\n')
    }
  },
  {
    nome: 'lista de documentos vazia é NÃO MEDIDO',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /nada foi medido/i,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ DOCUMENTOS_VIVOS: [], PISOS: { envelhecimento: 0 } })
      ajuda.escreve('LEIA-ME.md', 'O portão roda 34 conferidores.\n')
    }
  }
]
