// Provas plantadas do conferidor `tamanho`.
//
// Classe de defeito: arquivo que cresce até nem a IA entender. É a etapa de
// "regras de qualidade" do roadmap, e o princípio X da constituição.
//
// 🚨 Ele é CATRACA, não teto seco: projeto que já existe nasce com o número
// medido, e o conferidor só reprova quando PIORA. Teto seco num projeto de
// verdade é vermelho no dia um, e conferidor vermelho no dia um é conferidor
// que alguém desliga.

export const conferidor = 'tamanho'

function arquivoLongo (linhas) {
  return `${Array.from({ length: linhas }, (_, i) => `const linha${i} = ${i}`).join('\n')}\n`
}

export const casos = [
  {
    nome: 'arquivo acima do teto, com piso 0, reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /src\/grande\.ts/,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ TETOS: { linhas: 50, indentacao: 5 }, PISOS: { tamanho: 0 } })
      ajuda.escreve('src/grande.ts', arquivoLongo(80))
    }
  },
  {
    nome: 'arquivo abaixo do teto passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ TETOS: { linhas: 50, indentacao: 5 }, PISOS: { tamanho: 0 } })
      ajuda.escreve('src/pequeno.ts', arquivoLongo(10))
    }
  },
  {
    nome: 'catraca: dentro do piso declarado, passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ TETOS: { linhas: 50, indentacao: 5 }, PISOS: { tamanho: 1 } })
      ajuda.escreve('src/grande.ts', arquivoLongo(80))
    }
  },
  {
    nome: 'catraca: piorou acima do piso, reprova citando os dois números',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /2.*1|1.*2/s,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ TETOS: { linhas: 50, indentacao: 5 }, PISOS: { tamanho: 1 } })
      ajuda.escreve('src/a.ts', arquivoLongo(80))
      ajuda.escreve('src/b.ts', arquivoLongo(80))
    }
  },
  {
    nome: 'catraca: melhorou, passa e sugere descer',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ TETOS: { linhas: 50, indentacao: 5 }, PISOS: { tamanho: 3 } })
      ajuda.escreve('src/a.ts', arquivoLongo(80))
    }
  },
  {
    nome: 'piso ausente é NÃO MEDIDO, nunca verde',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /linha de base/i,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ TETOS: { linhas: 50, indentacao: 5 }, PISOS: {} })
      ajuda.escreve('src/a.ts', arquivoLongo(10))
    }
  },
  {
    nome: 'tamanho declarado com razão sai da conta',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ TETOS: { linhas: 50, indentacao: 5 }, PISOS: { tamanho: 0 } })
      ajuda.escreve('src/grande.ts', `// tamanho declarado: tabela gerada, quebrar em dois só esconderia o tamanho\n${arquivoLongo(80)}`)
    }
  },
  {
    nome: 'indentação funda demais reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /src\/fundo\.ts/,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ TETOS: { linhas: 400, indentacao: 3 }, PISOS: { tamanho: 0 } })
      ajuda.escreve('src/fundo.ts', 'if (a) {\n  if (b) {\n    if (c) {\n      if (d) {\n        faz()\n      }\n    }\n  }\n}\n')
    }
  },
  {
    // 🚨 Python recua 4 (PEP 8). Contando o nível a cada 2 espaços em qualquer
    // linguagem, um `raise` com continuação dentro de `try`/`except` numa
    // função, três níveis de verdade, sairia "6 níveis" e reprovaria.
    nome: 'Python conta o nível a cada 4 espaços: três níveis reais passam no teto 3',
    stacks: ['python'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ TETOS: { linhas: 400, indentacao: 3 }, PISOS: { tamanho: 0 } })
      ajuda.escreve('src/raso.py', 'def f():\n    try:\n        g()\n    except OSError as erro:\n        raise RuntimeError(\n            "x"\n        ) from erro\n')
    }
  },
  {
    nome: 'Python com quatro níveis reais reprova no teto 3',
    stacks: ['python'],
    espera: 'vermelho',
    cita: /src\/fundo\.py/,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ TETOS: { linhas: 400, indentacao: 3 }, PISOS: { tamanho: 0 } })
      // ⚠️ EXATAMENTE quatro níveis, um acima do teto: com a unidade errada (5)
      // dá três e passa, e é isso que prende a unidade em 4. Com cinco níveis
      // plantados, a unidade 5 também reprovaria.
      ajuda.escreve('src/fundo.py', 'def f():\n    if a:\n        if b:\n            if c:\n                g()\n')
    }
  },
  {
    nome: 'teste não entra na conta de tamanho',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ TETOS: { linhas: 50, indentacao: 5 }, PISOS: { tamanho: 0 } })
      ajuda.escreve('src/a.ts', arquivoLongo(5))
      ajuda.escreve('testes/a.test.ts', arquivoLongo(300))
    }
  },
  {
    nome: 'projeto sem código nenhum é NÃO MEDIDO',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /nada foi medido/i,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ TETOS: { linhas: 50, indentacao: 5 }, PISOS: { tamanho: 0 } })
      ajuda.escreve('LEIA-ME.md', 'sem código aqui\n')
    }
  }
]
