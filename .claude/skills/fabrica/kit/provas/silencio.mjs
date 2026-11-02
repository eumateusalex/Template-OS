// Provas plantadas do conferidor `silencio`.
//
// Classe de defeito: erro engolido. Constituição VIII, "observável por
// construção". O `catch` vazio é o defeito que some do log e aparece no
// telefone do cliente.

export const conferidor = 'silencio'

export const casos = [
  {
    nome: 'catch vazio',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /src\/a\.ts/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', 'try {\n  faz()\n} catch {\n}\n')
    }
  },
  {
    nome: 'catch com variável e corpo vazio',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /src\/a\.ts/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', 'try {\n  faz()\n} catch (erro) {}\n')
    }
  },
  {
    nome: 'promessa com .catch vazio',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /src\/a\.ts/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', 'faz().catch(() => {})\n')
    }
  },
  {
    nome: 'except: pass do Python',
    stacks: ['python'],
    espera: 'vermelho',
    cita: /src\/a\.py/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.py', 'try:\n    faz()\nexcept Exception:\n    pass\n')
    }
  },
  {
    nome: 'catch que trata passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', 'try {\n  faz()\n} catch (erro) {\n  avisa(erro)\n  throw erro\n}\n')
    }
  },
  {
    nome: 'except que trata passa',
    stacks: ['python'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.py', 'try:\n    faz()\nexcept Exception as erro:\n    avisa(erro)\n    raise\n')
    }
  },
  {
    nome: 'silêncio declarado com razão passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', 'try {\n  faz()\n} catch {\n  // silêncio declarado: o arquivo é enfeite e a ausência dele não muda nada\n}\n')
    }
  },
  {
    nome: 'silêncio declarado SEM razão não passa',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /src\/a\.ts/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', 'try {\n  faz()\n} catch {\n  // silêncio declarado:\n}\n')
    }
  },
  {
    nome: 'catch vazio em TESTE não conta: teste engole de propósito',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', 'export const a = 1\n')
      ajuda.escreve('testes/a.test.ts', 'try { faz() } catch {}\n')
    }
  },
  {
    // Um workspace que já existe pode ter dezenas de erros engolidos. Sem catraca, o conferidor nasceria
    // reprovando dezenas de vezes, e seria desligado antes de medir qualquer coisa nova.
    nome: 'catraca: dentro do piso declarado, passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ PISOS: { silencio: 2 } })
      ajuda.escreve('src/a.ts', 'try {\n  faz()\n} catch {\n}\n')
      ajuda.escreve('src/b.ts', 'try {\n  faz()\n} catch {\n}\n')
    }
  },
  {
    nome: 'catraca: um a mais que o piso reprova, citando os dois números',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /3.*2|2.*3/s,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ PISOS: { silencio: 2 } })
      for (const nome of ['a', 'b', 'c']) {
        ajuda.escreve(`src/${nome}.ts`, 'try {\n  faz()\n} catch {\n}\n')
      }
    }
  },
  {
    nome: 'piso ausente é NÃO MEDIDO, nunca verde',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /linha de base/i,
    planta (raiz, stack, ajuda) {
      ajuda.ajusta({ PISOS: {} })
      ajuda.escreve('src/a.ts', 'export const a = 1\n')
    }
  }
]
