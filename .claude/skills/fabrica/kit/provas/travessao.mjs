// Provas plantadas do conferidor `travessao`.
//
// Classe de defeito: travessão em texto que o público lê, que denuncia texto
// escrito por IA.
//
// 🚨 Ele nasce DESLIGADO (TEXTO_PUBLICO vazio), e isso é o princípio IV.
// Um `scripts/` comum tem centenas de linhas com travessão, quase
// todas em comentário de código. Ligado por padrão, ele seria vermelho no dia
// um em qualquer projeto que já existe.

export const conferidor = 'travessao'

export const casos = [
  {
    nome: 'sem TEXTO_PUBLICO declarado, ele fica quieto',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ TEXTO_PUBLICO: [], PISOS: { travessao: 0 } })
      ajuda.escreve('src/a.ts', 'const t = "isto — aqui"\n')
    }
  },
  {
    nome: 'travessão em texto público reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /publico\/copy\.ts/,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ TEXTO_PUBLICO: ['publico'], PISOS: { travessao: 0 } })
      ajuda.escreve('publico/copy.ts', 'export const t = "o dono — e só ele"\n')
    }
  },
  {
    nome: 'meia-risca e aspas angulares também reprovam',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /publico\/copy\.ts/,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ TEXTO_PUBLICO: ['publico'], PISOS: { travessao: 0 } })
      ajuda.escreve('publico/copy.ts', 'export const t = "de 1 – 2"\n')
    }
  },
  {
    nome: 'texto público sem travessão passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ TEXTO_PUBLICO: ['publico'], PISOS: { travessao: 0 } })
      ajuda.escreve('publico/copy.ts', 'export const t = "o dono, e só ele"\n')
    }
  },
  {
    nome: 'travessão em COMENTÁRIO dentro de texto público não conta',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ TEXTO_PUBLICO: ['publico'], PISOS: { travessao: 0 } })
      ajuda.escreve('publico/copy.ts', '// nota interna — só para quem lê o código\nexport const t = "limpo"\n')
    }
  },
  {
    nome: 'travessão fora das pastas públicas não conta',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ TEXTO_PUBLICO: ['publico'], PISOS: { travessao: 0 } })
      ajuda.escreve('publico/copy.ts', 'export const t = "limpo"\n')
      ajuda.escreve('src/interno.ts', 'const x = "isto — aqui"\n')
    }
  },
  {
    nome: 'catraca: dentro do piso declarado, passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ TEXTO_PUBLICO: ['publico'], PISOS: { travessao: 1 } })
      ajuda.escreve('publico/copy.ts', 'export const t = "o dono — e só ele"\n')
    }
  },
  {
    nome: 'pasta pública declarada e vazia é NÃO MEDIDO',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /nada foi medido/i,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ TEXTO_PUBLICO: ['publico'], PISOS: { travessao: 0 } })
      ajuda.escreve('src/a.ts', 'export const a = 1\n')
    }
  }
]
