// Provas plantadas do conferidor `cobertura`.
//
// Classe de defeito: afirmar cobertura sem ter medido. Cobertura prova que o
// teste PASSOU por ali; só a mutação prova que ele MEDE. As duas juntas é que
// dizem alguma coisa, e nenhuma delas vale com o arquivo de lcov ausente.

export const conferidor = 'cobertura'

function lcov (arquivos) {
  return arquivos.map(([caminho, lf, lh]) => `SF:${caminho}\nLF:${lf}\nLH:${lh}\nend_of_record`).join('\n') + '\n'
}

export const casos = [
  {
    nome: 'acima do piso passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ PISOS: { cobertura: 50 } })
      ajuda.escreve('coverage/lcov.info', lcov([['src/a.ts', 10, 8]]))
    }
  },
  {
    nome: 'abaixo do piso reprova, citando os dois números',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /20.*50|50.*20/s,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ PISOS: { cobertura: 50 } })
      ajuda.escreve('coverage/lcov.info', lcov([['src/a.ts', 10, 2]]))
    }
  },
  {
    nome: 'exatamente no piso passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ PISOS: { cobertura: 80 } })
      ajuda.escreve('coverage/lcov.info', lcov([['src/a.ts', 10, 8]]))
    }
  },
  {
    nome: 'melhorou: passa e sugere subir a catraca',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ PISOS: { cobertura: 40 } })
      ajuda.escreve('coverage/lcov.info', lcov([['src/a.ts', 10, 9]]))
    }
  },
  {
    nome: 'lcov AUSENTE é NÃO MEDIDO, nunca verde',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /lcov|não medido/i,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ PISOS: { cobertura: 0 } })
      ajuda.escreve('src/a.ts', 'export const a = 1\n')
    }
  },
  {
    nome: 'lcov com ZERO linha medida é vermelho, mesmo com piso 0',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /zero|nada foi medido|vazi/i,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ PISOS: { cobertura: 0 } })
      ajuda.escreve('coverage/lcov.info', 'SF:src/a.ts\nLF:0\nLH:0\nend_of_record\n')
    }
  },
  {
    nome: 'piso ausente é NÃO MEDIDO',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /linha de base/i,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ PISOS: {} })
      ajuda.escreve('coverage/lcov.info', lcov([['src/a.ts', 10, 8]]))
    }
  },
  {
    nome: 'lcov do Python, no mesmo formato, funciona igual',
    stacks: ['python'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ PISOS: { cobertura: 60 } })
      ajuda.escreve('coverage/lcov.info', lcov([['src/a.py', 5, 4]]))
    }
  }
]
