// Provas plantadas do conferidor `camadas`.
//
// Classe de defeito: monolito que vira macarrão. Constituição III.

export const conferidor = 'camadas'

const TRES = [
  { nome: 'app', raiz: 'src/app', importa: ['dominio', 'infra', 'compartilhado'] },
  { nome: 'dominio', raiz: 'src/dominio', importa: ['compartilhado'] },
  { nome: 'infra', raiz: 'src/infra', importa: ['dominio', 'compartilhado'] },
  { nome: 'compartilhado', raiz: 'src/compartilhado', importa: [] }
]

export const casos = [
  {
    nome: 'aresta permitida passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ CAMADAS: TRES, PISOS: { camadas: 0 } })
      ajuda.escreve('src/app/tela.ts', "import { x } from '../dominio/regra.ts'\n")
      ajuda.escreve('src/dominio/regra.ts', 'export const x = 1\n')
    }
  },
  {
    nome: 'aresta PROIBIDA reprova, dizendo a direção',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /dominio.*app|app.*dominio/,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ CAMADAS: TRES, PISOS: { camadas: 0 } })
      ajuda.escreve('src/dominio/regra.ts', "import { t } from '../app/tela.ts'\n")
      ajuda.escreve('src/app/tela.ts', 'export const t = 1\n')
    }
  },
  {
    nome: 'aresta proibida por APELIDO também reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /dominio/,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ CAMADAS: TRES, PISOS: { camadas: 0 }, APELIDOS: { '@/': 'src/' } })
      ajuda.escreve('src/dominio/regra.ts', "import { t } from '@/app/tela.ts'\n")
      ajuda.escreve('src/app/tela.ts', 'export const t = 1\n')
    }
  },
  {
    nome: 'aresta proibida em import MULTILINHA reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /dominio/,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ CAMADAS: TRES, PISOS: { camadas: 0 } })
      ajuda.escreve('src/dominio/regra.ts', "import {\n  alfa,\n  beta\n} from '../app/tela.ts'\n")
      ajuda.escreve('src/app/tela.ts', 'export const alfa = 1\nexport const beta = 2\n')
    }
  },
  {
    nome: 'ciclo entre camadas reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /ciclo/i,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({
        CAMADAS: [
          { nome: 'a', raiz: 'src/a', importa: ['b'] },
          { nome: 'b', raiz: 'src/b', importa: ['a'] }
        ],
        PISOS: { camadas: 0 }
      })
      ajuda.escreve('src/a/x.ts', "import { y } from '../b/y.ts'\n")
      ajuda.escreve('src/b/y.ts', "import { x } from '../a/x.ts'\n")
    }
  },
  {
    // 🚨 A isenção tira o import do ERRO, e o põe na CATRACA. Se ela saísse da
    // conta inteira, a dívida cresceria de graça: bastaria escrever uma razão
    // em cada import novo. Com piso 0, a primeira isenção reprova, e o achado
    // fala da catraca, não da arquitetura.
    nome: 'isenção com razão sai do erro de arquitetura, mas ENTRA na catraca',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /cruzamentos isentos/,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ CAMADAS: TRES, PISOS: { camadas: 0 } })
      ajuda.escreve('src/dominio/regra.ts', "import { t } from '../app/tela.ts' // camada declarada: o contrato mora na tela e a mudança está marcada\n")
      ajuda.escreve('src/app/tela.ts', 'export const t = 1\n')
    }
  },
  {
    nome: 'isenção SEM razão não sai da conta',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /dominio/,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ CAMADAS: TRES, PISOS: { camadas: 0 } })
      ajuda.escreve('src/dominio/regra.ts', "import { t } from '../app/tela.ts' // camada declarada:\n")
      ajuda.escreve('src/app/tela.ts', 'export const t = 1\n')
    }
  },
  {
    nome: 'pacote de fora não é aresta de camada',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ CAMADAS: TRES, PISOS: { camadas: 0 } })
      ajuda.escreve('src/dominio/regra.ts', "import { readFileSync } from 'node:fs'\nimport React from 'react'\n")
    }
  },
  {
    nome: 'CAMADAS null SEM razão declarada reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /sem camadas|CAMADAS/i,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ CAMADAS: null, PISOS: { camadas: 0 } })
      ajuda.escreve('src/a.ts', 'export const a = 1\n')
    }
  },
  {
    nome: 'CAMADAS null COM razão declarada passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ CAMADAS: null, SEM_CAMADAS: 'utilitários soltos, sem aplicação em camadas', PISOS: { camadas: 0 } })
      ajuda.escreve('src/a.ts', 'export const a = 1\n')
    }
  },
  {
    nome: 'Python: aresta proibida reprova',
    stacks: ['python'],
    espera: 'vermelho',
    cita: /dominio/,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({
        CAMADAS: [
          { nome: 'api', raiz: 'src/api', importa: ['dominio'] },
          { nome: 'dominio', raiz: 'src/dominio', importa: [] }
        ],
        PISOS: { camadas: 0 }
      })
      ajuda.escreve('src/dominio/regra.py', 'from ..api.rota import handler\n')
      ajuda.escreve('src/api/rota.py', 'handler = 1\n')
    }
  },
  {
    nome: 'catraca: cruzamento isento dentro do piso passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ CAMADAS: TRES, PISOS: { camadas: 1 } })
      ajuda.escreve('src/dominio/regra.ts', "import { t } from '../app/tela.ts' // camada declarada: dívida conhecida, sai no bloco seguinte\n")
      ajuda.escreve('src/app/tela.ts', 'export const t = 1\n')
    }
  }
]
