// fundação: conferido v1 · o ajuste mora no projeto, nunca aqui
//
// Provas plantadas do conferidor `fundacao`.
//
// Classe de defeito: o projeto rodando uma fundação que não é a da casa (o
// conferido editado ou apagado), a fundação atropelando o trabalho do projeto
// (a semente editada acusada), e o conferidor que existe e nunca roda.
// mutação: .claude/skills/novo-projeto/esqueleto/kit/conferido/portao/fundacao.mjs · "if (impressao(caminho) !== entrada.sha) {" → "if (false) {" · pega em 09/10/2026
// mutação: .claude/skills/novo-projeto/esqueleto/kit/conferido/portao/fundacao.mjs · "if (entrada.tipo === 'semente') {" → "if (false) {" · pega em 09/10/2026
// mutação: .claude/skills/novo-projeto/esqueleto/kit/conferido/lib/casca.mjs · "const binario = amostra.includes(0)" → "const binario = true" · pega em 09/10/2026
// mutação: .claude/skills/novo-projeto/esqueleto/kit/conferido/portao/fundacao.mjs · "if (!conferidores.includes(nome)) r.achado" → "if (false) r.achado" · pega em 09/10/2026
// mutação: .claude/skills/novo-projeto/esqueleto/kit/conferido/portao/fundacao.mjs · "r.naoMedido(`não consegui ler ${KIT_NA_CASA}" → "r.nota(`não consegui ler ${KIT_NA_CASA}" · pega em 09/10/2026
// mutação: .claude/skills/novo-projeto/esqueleto/kit/conferido/portao/fundacao.mjs · "if (!casa && apontada) {" → "if (false) {" · pega em 09/10/2026

export const conferidor = 'fundacao'

const PORTAO = "export const PASSOS = [\n  { nome: 'x', cmd: 'node fundacao/portao/x.mjs' }\n]\n"

/** O mundo mínimo que passa: um conferidor, a prova dele e a linha no portão. */
function base (ajuda) {
  ajuda.escreve('fabrica/stack.mjs', PORTAO)
  ajuda.conferido('fundacao/portao/x.mjs', 'export const x = 1\n', '.claude/skills/novo-projeto/esqueleto/kit/conferido/portao/x.mjs')
  ajuda.conferido('fundacao/provas/x.mjs', 'export const casos = []\n', '.claude/skills/novo-projeto/esqueleto/kit/conferido/provas/x.mjs')
  ajuda.conferido('fundacao/tokens.css', ':root { --c-ink: 0,0,0; }\n')
}

/** Uma casa falsa, para o conferidor ter onde comparar a versão. */
function casaFalsa (ajuda, { versao = '1.0.0', semente = 'original\n' } = {}) {
  ajuda.escreve('_casa/.claude/skills/novo-projeto/esqueleto/kit/kit.json', JSON.stringify({ versao, data: '2026-09-22', arquivos: {} }))
  ajuda.escreve('_casa/.claude/skills/novo-projeto/esqueleto/kit/semente/app/src/app/page.tsx', semente)
}

export const casos = [
  {
    nome: 'sem o fundacao.json é vermelho, e diz qual arquivo falta',
    espera: 'vermelho',
    cita: /fundacao\.json/,
    planta (raiz, ajuda) { ajuda.semManifesto = true }
  },
  {
    nome: 'a fundação intacta passa',
    espera: 'verde',
    planta (raiz, ajuda) { base(ajuda) }
  },
  {
    nome: 'conferido EDITADO no projeto reprova, e diz onde mora o ajuste',
    espera: 'vermelho',
    cita: /fundacao\/tokens\.css[\s\S]*ajuste/,
    planta (raiz, ajuda) {
      base(ajuda)
      ajuda.escreve('fundacao/tokens.css', ':root { --c-ink: 9,9,9; }\n')
    }
  },
  {
    nome: 'conferido que sumiu reprova',
    espera: 'vermelho',
    cita: /sumiu\.css/,
    planta (raiz, ajuda) {
      base(ajuda)
      ajuda.declara('fundacao/sumiu.css', { tipo: 'conferido', sha: '0'.repeat(64), fonte: 'x' })
    }
  },
  {
    nome: 'arquivo a mais dentro de fundacao/ que o manifesto não conhece reprova',
    espera: 'vermelho',
    cita: /intruso\.mjs/,
    planta (raiz, ajuda) {
      base(ajuda)
      ajuda.escreve('fundacao/intruso.mjs', 'export const i = 1\n')
    }
  },
  {
    nome: 'conferido reescrito com CRLF continua o mesmo arquivo',
    espera: 'verde',
    planta (raiz, ajuda) {
      base(ajuda)
      ajuda.escreve('fundacao/tokens.css', ':root { --c-ink: 0,0,0; }\r\n')
    }
  },
  {
    nome: 'semente EDITADA passa calada: o arquivo é do projeto',
    espera: 'verde',
    naoCita: /page\.tsx/,
    planta (raiz, ajuda) {
      base(ajuda)
      ajuda.semente('src/app/page.tsx', 'a home que o projeto escreveu\n', 'a vitrine original\n')
    }
  },
  {
    nome: 'fonte fora de alcance é nota impressa, nunca silêncio',
    espera: 'verde',
    cita: /não comparável/,
    planta (raiz, ajuda) { base(ajuda) }
  },
  {
    nome: 'com a casa ao alcance, semente com versão nova na fonte vira nota',
    espera: 'verde',
    cita: /page\.tsx[\s\S]*versão nova|versão nova[\s\S]*page\.tsx/,
    args: (raiz) => ['--fonte', `${raiz}/_casa`],
    planta (raiz, ajuda) {
      base(ajuda)
      casaFalsa(ajuda, { semente: 'a vitrine da v1.1\n' })
      ajuda.semente('src/app/page.tsx', 'a vitrine original\n')
    }
  },
  {
    nome: 'com a casa ao alcance em versão mais nova, vira nota com as duas versões',
    espera: 'verde',
    cita: /1\.0\.0[\s\S]*1\.1\.0/,
    args: (raiz) => ['--fonte', `${raiz}/_casa`],
    planta (raiz, ajuda) {
      base(ajuda)
      casaFalsa(ajuda, { versao: '1.1.0' })
    }
  },
  {
    nome: 'fixado sem razão reprova: pulo de versão precisa de motivo escrito',
    espera: 'vermelho',
    cita: /fixado/,
    planta (raiz, ajuda) {
      base(ajuda)
      ajuda.ajusta({ fixado: { versao: '1.0.0', razao: '', data: '2026-09-22' } })
    }
  },
  {
    nome: 'fixado com razão passa, e o pulo é impresso',
    espera: 'verde',
    cita: /fixado/,
    planta (raiz, ajuda) {
      base(ajuda)
      ajuda.ajusta({ fixado: { versao: '1.0.0', razao: 'o projeto está em produção e a v1.1 muda o tema', data: '2026-09-22' } })
    }
  },
  {
    nome: 'conferidor sem linha no portão reprova: ele nunca rodaria',
    espera: 'vermelho',
    cita: /y\.mjs/,
    planta (raiz, ajuda) {
      base(ajuda)
      ajuda.conferido('fundacao/portao/y.mjs', 'export const y = 1\n')
      ajuda.conferido('fundacao/provas/y.mjs', 'export const casos = []\n')
    }
  },
  {
    nome: 'conferidor sem prova plantada reprova',
    espera: 'vermelho',
    cita: /prova/,
    planta (raiz, ajuda) {
      base(ajuda)
      ajuda.escreve('fabrica/stack.mjs', "export const PASSOS = [\n  { cmd: 'node fundacao/portao/x.mjs' },\n  { cmd: 'node fundacao/portao/z.mjs' }\n]\n")
      ajuda.conferido('fundacao/portao/z.mjs', 'export const z = 1\n')
    }
  },
  {
    nome: 'o arquivo do portão declarado e ausente é NÃO MEDIDO',
    espera: 'vermelho',
    cita: /não medido[\s\S]*nao-existe\.mjs/,
    planta (raiz, ajuda) {
      base(ajuda)
      ajuda.ajusta({ portao: 'fabrica/nao-existe.mjs' })
    }
  },
  {
    nome: 'manifesto sem arquivo nenhum é vermelho: nada foi medido',
    espera: 'vermelho',
    cita: /nada foi medido/i,
    planta (raiz, ajuda) { ajuda.escreve('fabrica/stack.mjs', PORTAO) }
  },
  {
    nome: 'prova de um conferidor que não existe reprova',
    espera: 'vermelho',
    cita: /w\.mjs[\s\S]*não existe/,
    planta (raiz, ajuda) {
      base(ajuda)
      ajuda.conferido('fundacao/provas/w.mjs', 'export const casos = []\n')
    }
  },
  {
    // A fonte do kit pode mudar de pasta: a casa APONTADA sem o kit no lugar
    // é o sinal de que o projeto ficou para trás, e virar nota o calaria.
    nome: 'casa apontada sem o kit no lugar é NÃO MEDIDO, e manda atualizar',
    espera: 'vermelho',
    cita: /não medido[\s\S]*--atualizar/,
    args: (raiz) => ['--fonte', `${raiz}/_casa`],
    planta (raiz, ajuda) {
      base(ajuda)
      // O endereço antigo do kit, montado em partes: é o DADO deste caso, e o
      // D12 da casa acusa quem ainda manda para ele.
      ajuda.escreve(['_casa', '.claude', 'skills', 'fundacao', 'kit', 'kit.json'].join('/'), JSON.stringify({ versao: '1.0.0', arquivos: {} }))
    }
  },
  {
    nome: 'kit.json da casa ilegível é NÃO MEDIDO',
    espera: 'vermelho',
    cita: /não medido[\s\S]*kit\.json/,
    args: (raiz) => ['--fonte', `${raiz}/_casa`],
    planta (raiz, ajuda) {
      base(ajuda)
      ajuda.escreve('_casa/.claude/skills/novo-projeto/esqueleto/kit/kit.json', '{ quebrado')
    }
  }
]
