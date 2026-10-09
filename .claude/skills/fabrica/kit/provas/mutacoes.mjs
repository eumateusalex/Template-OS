// Provas plantadas do conferidor `mutacoes`.
//
// Classe de defeito: teste que nunca foi visto reprovando, nas quatro classes
// em que o verde mente mais caro (conferidor, segurança, dinheiro, dado de
// terceiro). Constituição I.
//
// 🚨 Ele cobra DUAS coisas, e a segunda é a que ninguém lembra: o registro
// existe, E o trecho "de" ainda existe no fonte. Registro que aponta para um
// trecho que sumiu é registro velho, e registro velho é verde mentiroso.
// Registro escrito de cabeça cita trecho que nunca existiu (quatro de seis
// cabeçalhos, medido).

export const conferidor = 'mutacoes'

const FONTE = 'export function cobra (centavos) {\n  return Math.round(centavos)\n}\n'
const REGISTRO_BOM = '// mutação: src/dinheiro/preco.ts · "Math.round" → "Math.floor" · pega em 09/10/2026'

export const casos = [
  {
    nome: 'área obrigatória com registro certo passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ AREAS_OBRIGATORIAS: ['src/dinheiro'] })
      ajuda.escreve('src/dinheiro/preco.ts', FONTE)
      ajuda.escreve('testes/preco.test.ts', `${REGISTRO_BOM}\nimport './x.mjs'\n`)
    }
  },
  {
    nome: 'área obrigatória SEM registro nenhum reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /preco\.ts/,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ AREAS_OBRIGATORIAS: ['src/dinheiro'] })
      ajuda.escreve('src/dinheiro/preco.ts', FONTE)
      ajuda.escreve('testes/preco.test.ts', 'import "./x.mjs"\n')
    }
  },
  {
    nome: 'registro VELHO (o trecho sumiu do fonte) reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /Math\.round|velho|não existe/i,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ AREAS_OBRIGATORIAS: ['src/dinheiro'] })
      ajuda.escreve('src/dinheiro/preco.ts', 'export function cobra (c) {\n  return Math.trunc(c)\n}\n')
      ajuda.escreve('testes/preco.test.ts', `${REGISTRO_BOM}\n`)
    }
  },
  {
    nome: 'registro cujo trecho aparece DUAS vezes reprova: mutação ambígua',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /2 vezes|único/i,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ AREAS_OBRIGATORIAS: ['src/dinheiro'] })
      ajuda.escreve('src/dinheiro/preco.ts', 'const a = Math.round(1)\nconst b = Math.round(2)\n')
      ajuda.escreve('testes/preco.test.ts', `${REGISTRO_BOM}\n`)
    }
  },
  {
    nome: 'registro sem data reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /data/i,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ AREAS_OBRIGATORIAS: ['src/dinheiro'] })
      ajuda.escreve('src/dinheiro/preco.ts', FONTE)
      ajuda.escreve('testes/preco.test.ts', '// mutação: src/dinheiro/preco.ts · "Math.round" → "Math.floor" · pega\n')
    }
  },
  {
    // Um `__init__.py` vazio cai na area obrigatoria e seria cobrado como se
    // tivesse logica. Nao se muta o que nao tem comportamento.
    nome: 'arquivo sem logica (so import, ou vazio) nao precisa de mutacao',
    stacks: ['python', 'node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ AREAS_OBRIGATORIAS: ['src/dinheiro'] })
      if (stack === 'python') {
        ajuda.escreve('src/dinheiro/__init__.py', '')
        ajuda.escreve('src/dinheiro/preco.py', 'def cobra(c):\n    return round(c)\n')
        ajuda.escreve(
          'tests/test_preco.py',
          '# mutação: src/dinheiro/preco.py · "round(c)" → "int(c)" · pega em 09/10/2026\n'
        )
      } else {
        ajuda.escreve('src/dinheiro/index.mjs', "export { cobra } from './preco.mjs'\n")
        ajuda.escreve('src/dinheiro/preco.mjs', 'export const cobra = (c) => Math.round(c)\n')
        ajuda.escreve(
          'testes/preco.test.mjs',
          '// mutação: src/dinheiro/preco.mjs · "Math.round" → "Math.floor" · pega em 09/10/2026\n'
        )
      }
    }
  },
  {
    nome: 'fora das áreas obrigatórias, não se cobra mutação',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ AREAS_OBRIGATORIAS: ['src/dinheiro'] })
      ajuda.escreve('src/dinheiro/preco.ts', FONTE)
      ajuda.escreve('testes/preco.test.ts', `${REGISTRO_BOM}\n`)
      ajuda.escreve('src/enfeite/cor.ts', 'export const cor = "azul"\n')
    }
  },
  {
    nome: 'área obrigatória declarada e vazia é NÃO MEDIDO',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /nada foi medido|vazia/i,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ AREAS_OBRIGATORIAS: ['src/dinheiro'] })
      ajuda.escreve('src/enfeite/cor.ts', 'export const cor = "azul"\n')
    }
  },
  {
    nome: 'registro em Python, com #, também vale',
    stacks: ['python'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ AREAS_OBRIGATORIAS: ['src/dinheiro'] })
      ajuda.escreve('src/dinheiro/preco.py', 'def cobra(centavos):\n    return round(centavos)\n')
      ajuda.escreve('tests/test_preco.py', '# mutação: src/dinheiro/preco.py · "round(centavos)" → "int(centavos)" · pega em 09/10/2026\n')
    }
  }
]
