// Provas plantadas do conferidor `kit`.
//
// Classe de defeito: kit editado no alvo, e kit velho no alvo. Os dois fazem a
// mesma coisa: o projeto roda uma régua que não é a da fonte, e ninguém
// percebe. É o defeito do servidor que publica com o código VELHO.
// mutação: kit/portao/kit.mjs · "    if (existsSync(join(candidata, 'kit.json'))) return candidata" → "    if (false) return candidata" · pega
// mutação: kit/portao/kit.mjs · "      if (diferentes.length > 0) {" → "      if (false) {" · pega
// mutação: kit/portao/kit.mjs · "    if (daFonte && origem === join(raiz, ...FONTE_RELATIVA)) {" → "    if (false) {" · pega

export const conferidor = 'kit'

const CONTEUDO = 'export const a = 1\n'
// sha256 de CONTEUDO, conferido na construção da prova
const SHA_CERTO = 'a3b135bcfeaabda5d6780642cf256059889ad4649c9ba4f7a4d5d6e83a68b402'

/** Um manifesto do kit com esta versão, e o portao.mjs com o sha certo (ou o que vier). */
const MANIFESTO = (versao, arquivos = { 'portao.mjs': SHA_CERTO }) => JSON.stringify({ versao, data: '2026-09-22', arquivos }, null, 2)

export const casos = [
  {
    nome: 'sem kit.json é NÃO MEDIDO, nunca verde',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /kit\.json/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('fabrica/portao.mjs', CONTEUDO)
    }
  },
  {
    nome: 'arquivo do kit EDITADO no alvo reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /portao\.mjs/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('fabrica/portao.mjs', 'export const a = 2\n')
      ajuda.escreve('fabrica/kit.json', JSON.stringify({
        versao: '1.0.0',
        data: '2026-09-17',
        arquivos: { 'portao.mjs': SHA_CERTO }
      }, null, 2))
    }
  },
  {
    nome: 'arquivo do kit que sumiu reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /sumiu\.mjs/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('fabrica/kit.json', JSON.stringify({
        versao: '1.0.0',
        data: '2026-09-17',
        arquivos: { 'sumiu.mjs': SHA_CERTO }
      }, null, 2))
    }
  },
  {
    nome: 'kit intacto passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('fabrica/portao.mjs', CONTEUDO)
      ajuda.escreve('fabrica/kit.json', JSON.stringify({
        versao: '1.0.0',
        data: '2026-09-17',
        arquivos: { 'portao.mjs': SHA_CERTO }
      }, null, 2))
    }
  },
  {
    nome: 'manifesto sem arquivo nenhum é NÃO MEDIDO',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /nada foi medido/i,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('fabrica/kit.json', JSON.stringify({ versao: '1.0.0', data: '2026-09-17', arquivos: {} }, null, 2))
    }
  },
  {
    nome: 'arquivo a mais dentro de fabrica/ que o manifesto não conhece reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /intruso\.mjs/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('fabrica/portao.mjs', CONTEUDO)
      ajuda.escreve('fabrica/intruso.mjs', CONTEUDO)
      ajuda.escreve('fabrica/kit.json', JSON.stringify({
        versao: '1.0.0',
        data: '2026-09-17',
        arquivos: { 'portao.mjs': SHA_CERTO }
      }, null, 2))
    }
  },
  {
    nome: 'stack.mjs e .ultimo-portao.json NÃO são do kit: são do projeto',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('fabrica/portao.mjs', CONTEUDO)
      ajuda.escreve('fabrica/.ultimo-portao.json', '{}\n')
      ajuda.escreve('fabrica/kit.json', JSON.stringify({
        versao: '1.0.0',
        data: '2026-09-17',
        arquivos: { 'portao.mjs': SHA_CERTO }
      }, null, 2))
    }
  },
  {
    // ⚠️ O estado do teste da fábrica (na fonte do kit) mora na pasta do kit, como o do
    // portão, e é do projeto: sem esta linha o próprio kit o acusaria de intruso.
    nome: '.ultimo-teste-fabrica.json também é do projeto, não intruso',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('fabrica/portao.mjs', CONTEUDO)
      ajuda.escreve('fabrica/.ultimo-teste-fabrica.json', '{}\n')
      ajuda.escreve('fabrica/kit.json', MANIFESTO('1.1.0'))
    }
  },
  {
    // 🚨 Um `origem` gravado aponta para um caminho que deixa de existir, e a
    // comparação de versão para de rodar sem ninguém saber. A fonte se ACHA
    // subindo as pastas.
    nome: 'a fonte achada na pasta com versão NOVA reprova o kit velho',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /1\.0\.0.*1\.1\.0/s,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('fabrica/portao.mjs', CONTEUDO)
      ajuda.escreve('fabrica/kit.json', MANIFESTO('1.0.0'))
      ajuda.escreve('.claude/skills/fabrica/kit/kit.json', MANIFESTO('1.1.0'))
    }
  },
  {
    nome: 'a fonte achada na pasta com a MESMA versão e os mesmos shas passa',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('fabrica/portao.mjs', CONTEUDO)
      ajuda.escreve('fabrica/kit.json', MANIFESTO('1.1.0'))
      ajuda.escreve('.claude/skills/fabrica/kit/kit.json', MANIFESTO('1.1.0'))
      ajuda.escreve('.claude/skills/fabrica/kit/portao.mjs', CONTEUDO)
    }
  },
  {
    // 🚨 A fonte do kit muda e o manifesto dela não, na mesma versão: comparando
    // só manifesto com manifesto, o portão da raiz do workspace fecharia verde.
    // Quando a fonte mora na própria raiz (nível 0), os arquivos dela se
    // conferem contra o manifesto dela.
    nome: 'arquivo da FONTE editado sem refazer o manifesto dela reprova, na raiz do workspace',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /fonte[\s\S]*portao\.mjs/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('fabrica/portao.mjs', CONTEUDO)
      ajuda.escreve('fabrica/kit.json', MANIFESTO('1.1.0'))
      ajuda.escreve('.claude/skills/fabrica/kit/kit.json', MANIFESTO('1.1.0'))
      ajuda.escreve('.claude/skills/fabrica/kit/portao.mjs', 'export const a = 2\n')
    }
  },
  {
    nome: 'mesma versão com o conteúdo diferente da fonte reprova, dizendo o arquivo',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /mesma versão.*portao\.mjs/s,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('fabrica/portao.mjs', CONTEUDO)
      ajuda.escreve('fabrica/kit.json', MANIFESTO('1.1.0'))
      ajuda.escreve('.claude/skills/fabrica/kit/kit.json', MANIFESTO('1.1.0', { 'portao.mjs': 'b'.repeat(64) }))
    }
  },
  {
    nome: 'a origem gravada num caminho morto não derruba nada: a versão fica não comparável',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('fabrica/portao.mjs', CONTEUDO)
      ajuda.escreve('fabrica/kit.json', JSON.stringify({ ...JSON.parse(MANIFESTO('1.0.0')), origem: 'C:/caminho/que/nao/existe/kit' }, null, 2))
    }
  }
]
