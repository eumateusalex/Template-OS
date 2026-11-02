// Provas plantadas do conferidor `estrutura`.
//
// Classe de defeito: guarda com lista à mão. Conferidor que existe e não está
// na lista do portão nunca roda; linha na lista sem arquivo atrás quebra o
// portão; conferidor sem prova não sabe reprovar.
//
// 🚨 É o conferidor que fecha o laço: ele é o que impede a fábrica de ficar
// cega para o próximo conferidor, o defeito do guarda com lista à mão.

export const conferidor = 'estrutura'

const CONFERIDOR_FALSO = '// node fabrica/portao/exemplo.mjs\n// Prova: provas/exemplo.mjs\nexport const a = 1\n'

export const casos = [
  {
    nome: 'conferidor sem linha em PASSOS reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /exemplo/,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ PASSOS: [] })
      ajuda.escreve('fabrica/portao/exemplo.mjs', CONFERIDOR_FALSO)
      ajuda.escreve('fabrica/provas/exemplo.mjs', 'export const conferidor = "exemplo"\nexport const casos = []\n')
    }
  },
  {
    nome: 'linha em PASSOS sem conferidor atrás reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /sumido/,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ PASSOS: [{ nome: 'sumido', cmd: 'node fabrica/portao/sumido.mjs', onde: 'todos' }] })
    }
  },
  {
    nome: 'conferidor SEM prova reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /prova/i,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ PASSOS: [{ nome: 'exemplo', cmd: 'node fabrica/portao/exemplo.mjs', onde: 'todos' }] })
      ajuda.escreve('fabrica/portao/exemplo.mjs', CONFERIDOR_FALSO)
    }
  },
  {
    nome: 'conferidor sem cabeçalho de prova reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /cabeçalho|Prova:/i,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ PASSOS: [{ nome: 'exemplo', cmd: 'node fabrica/portao/exemplo.mjs', onde: 'todos' }] })
      ajuda.escreve('fabrica/portao/exemplo.mjs', 'export const a = 1\n')
      ajuda.escreve('fabrica/provas/exemplo.mjs', 'export const conferidor = "exemplo"\nexport const casos = []\n')
    }
  },
  {
    nome: 'conferidor, linha e prova nos três lugares passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ PASSOS: [{ nome: 'exemplo', cmd: 'node fabrica/portao/exemplo.mjs', onde: 'todos' }] })
      ajuda.escreve('fabrica/portao/exemplo.mjs', CONFERIDOR_FALSO)
      ajuda.escreve('fabrica/provas/exemplo.mjs', 'export const conferidor = "exemplo"\nexport const casos = []\n')
    }
  },
  {
    nome: 'pasta de spec sem spec.md reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /001-sem-spec/,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ PASSOS: [] })
      ajuda.escreve('specs/001-sem-spec/plan.md', '# plano\n')
    }
  },
  {
    nome: 'pasta de spec fora do padrão NNN-nome reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /minha-feature/,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ PASSOS: [] })
      ajuda.escreve('specs/minha-feature/spec.md', '# spec\n')
    }
  },
  {
    nome: 'spec bem formada passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ PASSOS: [] })
      ajuda.escreve('specs/001-boa/spec.md', '# spec\n')
    }
  },
  {
    nome: 'link de markdown quebrado reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /nao-existe\.md/,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ PASSOS: [], DOCUMENTOS_VIVOS: ['LEIA-ME.md'] })
      ajuda.escreve('LEIA-ME.md', 'Veja o [outro](docs/nao-existe.md).\n')
    }
  },
  {
    nome: 'link de markdown que resolve passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ PASSOS: [], DOCUMENTOS_VIVOS: ['LEIA-ME.md'] })
      ajuda.escreve('docs/existe.md', '# existe\n')
      ajuda.escreve('LEIA-ME.md', 'Veja o [outro](docs/existe.md) e o [site](https://exemplo.com).\n')
    }
  }
]
