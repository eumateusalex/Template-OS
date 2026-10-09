// Provas plantadas do conferidor `dependencias`.
//
// Classe de defeito: dependência de runtime com licença que contamina, e
// vulnerabilidade conhecida em produção. Constituição IX e X.
//
// 🚨 A licença se mede OFFLINE, lendo o que já está instalado. A auditoria
// precisa de rede, e sem rede ela vira "não medido", que reprova. Não se
// inventa verde por falta de rede.
//
// ⚠️ O caso do AGPL é real: dependência troca de licença debaixo do projeto,
// como o `ua-parser-js` 2.0.
// mutação: kit/portao/dependencias.mjs · "    } else if (graves > 0) {" → "    } else if (false) {" · pega
// mutação: kit/portao/dependencias.mjs · "    if (graves === null) {" → "    if (false) {" · pega
// mutação: kit/portao/dependencias.mjs · "  if (auditar && !temRuntime(raiz, stack)) {" → "  if (false) {" · pega

export const conferidor = 'dependencias'

function pacote (ajuda, nome, licenca) {
  ajuda.escreve(`node_modules/${nome}/package.json`, JSON.stringify({ name: nome, version: '1.0.0', license: licenca }, null, 2))
}

/** Um projeto com UMA dependência de runtime, instalada e com licença boa: há o que auditar. */
function comRuntime (ajuda) {
  ajuda.escreve('package.json', JSON.stringify({ name: 'alvo', dependencies: { 'coisa-boa': '^1.0.0' } }, null, 2))
  pacote(ajuda, 'coisa-boa', 'MIT')
}

export const casos = [
  {
    nome: 'dependência de runtime com AGPL reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /contamina|AGPL/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('package.json', JSON.stringify({ name: 'alvo', dependencies: { 'coisa-agpl': '^1.0.0' } }, null, 2))
      pacote(ajuda, 'coisa-agpl', 'AGPL-3.0')
    }
  },
  {
    nome: 'a MESMA licença em devDependency não reprova',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('package.json', JSON.stringify({
        name: 'alvo',
        dependencies: { 'coisa-boa': '^1.0.0' },
        devDependencies: { 'coisa-agpl': '^1.0.0' }
      }, null, 2))
      pacote(ajuda, 'coisa-agpl', 'AGPL-3.0')
      pacote(ajuda, 'coisa-boa', 'MIT')
    }
  },
  {
    nome: 'SSPL também contamina',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /SSPL|contamina/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('package.json', JSON.stringify({ name: 'alvo', dependencies: { banco: '^1.0.0' } }, null, 2))
      pacote(ajuda, 'banco', 'SSPL-1.0')
    }
  },
  {
    nome: 'licenças permissivas passam',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('package.json', JSON.stringify({
        name: 'alvo',
        dependencies: { a: '^1.0.0', b: '^1.0.0', c: '^1.0.0' }
      }, null, 2))
      pacote(ajuda, 'a', 'MIT')
      pacote(ajuda, 'b', 'Apache-2.0')
      pacote(ajuda, 'c', 'ISC')
    }
  },
  {
    nome: 'dependência declarada e NÃO instalada é não medida, e reprova',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /não medido|não instalad/i,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('package.json', JSON.stringify({ name: 'alvo', dependencies: { sumida: '^1.0.0' } }, null, 2))
    }
  },
  {
    nome: 'dependência SEM campo de licença reprova: licença desconhecida não é licença boa',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /sem licen|desconhecid/i,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('package.json', JSON.stringify({ name: 'alvo', dependencies: { muda: '^1.0.0' } }, null, 2))
      ajuda.escreve('node_modules/muda/package.json', JSON.stringify({ name: 'muda', version: '1.0.0' }, null, 2))
    }
  },
  {
    nome: 'projeto Node sem dependência nenhuma passa, e diz que não há o que auditar',
    stacks: ['node'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('package.json', JSON.stringify({ name: 'alvo' }, null, 2))
    }
  },
  {
    nome: 'projeto Node SEM package.json é NÃO MEDIDO',
    stacks: ['node'],
    espera: 'vermelho',
    cita: /package\.json|não medido/i,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('src/a.ts', 'export const a = 1\n')
    }
  },
  {
    nome: 'Python: dist-info com AGPL reprova',
    stacks: ['python'],
    espera: 'vermelho',
    cita: /AGPL|contamina/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('requirements.txt', 'coisa-agpl==1.0.0\n')
      ajuda.escreve('.venv/Lib/site-packages/coisa_agpl-1.0.0.dist-info/METADATA', 'Name: coisa-agpl\nVersion: 1.0.0\nLicense: AGPL-3.0\n')
    }
  },
  {
    nome: 'Python: dist-info com MIT passa',
    stacks: ['python'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('requirements.txt', 'coisa-boa==1.0.0\n')
      ajuda.escreve('.venv/Lib/site-packages/coisa_boa-1.0.0.dist-info/METADATA', 'Name: coisa-boa\nVersion: 1.0.0\nLicense: MIT\n')
    }
  },
  {
    // 🚨 O caminho do LINUX tem a versão do Python no meio, e o do Windows não.
    // Procurando só `.venv/Lib/site-packages` e `.venv/lib/site-packages`, o
    // conferidor não acha nada e reprova com "não achei o .venv" num runner que
    // acabou de instalar quatro pacotes nele. Prova que só planta no caminho do
    // Windows deixa a máquina Windows verde e o CI vermelho, e é o CI que
    // está certo.
    nome: 'Python: o .venv do LINUX (com a versão no caminho) é encontrado',
    stacks: ['python'],
    espera: 'vermelho',
    cita: /AGPL|contamina/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('requirements.txt', 'coisa-agpl==1.0.0\n')
      ajuda.escreve(
        '.venv/lib/python3.12/site-packages/coisa_agpl-1.0.0.dist-info/METADATA',
        'Name: coisa-agpl\nVersion: 1.0.0\nLicense: AGPL-3.0\n'
      )
    }
  },
  {
    nome: 'Python: o .venv do LINUX com licença boa passa, e MEDE (não fica "não medido")',
    stacks: ['python'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      // ⚠️ O par importa mais que o de cima: o defeito NÃO é acusar errado, é
      // não medir nada. "Não achei o .venv" reprova, e reprovar por não ter
      // medido esconde que a régua está olhando o lugar errado.
      ajuda.escreve('requirements.txt', 'coisa-boa==1.0.0\n')
      ajuda.escreve(
        '.venv/lib/python3.12/site-packages/coisa_boa-1.0.0.dist-info/METADATA',
        'Name: coisa-boa\nVersion: 1.0.0\nLicense: MIT\n'
      )
    }
  },
  {
    // Pytest, ruff e typing_extensions declaram `License-Expression`, não
    // `License`. Lendo só o campo antigo, o conferidor chamaria os três de "sem
    // licença" e reprovaria o mundo.
    nome: 'Python: License-Expression é lida como licença',
    stacks: ['python'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('requirements.txt', 'moderna==1.0.0\n')
      ajuda.escreve('.venv/Lib/site-packages/moderna-1.0.0.dist-info/METADATA', 'Name: moderna\nVersion: 1.0.0\nLicense-Expression: MIT\nLicense-File: LICENSE\n')
    }
  },
  {
    nome: 'Python: License-Expression contaminante também reprova',
    stacks: ['python'],
    espera: 'vermelho',
    cita: /AGPL|contamina/,
    planta (raiz, stack, ajuda) {
      ajuda.escreve('requirements.txt', 'moderna==1.0.0\n')
      ajuda.escreve('.venv/Lib/site-packages/moderna-1.0.0.dist-info/METADATA', 'Name: moderna\nVersion: 1.0.0\nLicense-Expression: AGPL-3.0-only\n')
    }
  },
  {
    // ⚠️ O `.venv` mistura runtime e desenvolvimento, e só o runtime contamina
    // o que vai para o cliente. Sem esta separação, o conferidor reprovaria por
    // causa do pytest, que nunca chega perto do produto.
    nome: 'Python: dependência SÓ de desenvolvimento não entra na conta',
    stacks: ['python'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('requirements.txt', 'coisa-boa==1.0.0\n')
      ajuda.escreve('requirements-dev.txt', 'coisa-agpl==1.0.0\n')
      ajuda.escreve('.venv/Lib/site-packages/coisa_boa-1.0.0.dist-info/METADATA', 'Name: coisa-boa\nVersion: 1.0.0\nLicense-Expression: MIT\n')
      ajuda.escreve('.venv/Lib/site-packages/coisa_agpl-1.0.0.dist-info/METADATA', 'Name: coisa-agpl\nVersion: 1.0.0\nLicense-Expression: AGPL-3.0\n')
    }
  },
  {
    nome: 'Python: só ferramentas de desenvolvimento, sem runtime declarado, passa',
    stacks: ['python'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('requirements-dev.txt', 'pytest==9.1.1\n')
      ajuda.escreve('.venv/Lib/site-packages/pytest-9.1.1.dist-info/METADATA', 'Name: pytest\nVersion: 9.1.1\nLicense-Expression: MIT\n')
    }
  },
  {
    // 🚨 Um `--auditar` que ninguém passa deixa vulnerabilidade alta que nenhum
    // portão vê. A auditoria tem catraca: `PISOS.auditoria` é o teto aceito,
    // com data e razão.
    // O comando é trocado por um falso aqui, porque a prova não pode depender de rede.
    nome: 'auditoria: altas acima do piso reprovam',
    stacks: ['node'],
    args: ['--auditar'],
    espera: 'vermelho',
    cita: /auditoria.*3.*2/s,
    planta (raiz, stack, ajuda) {
      comRuntime(ajuda)
      ajuda.escreve('auditoria-falsa.mjs', "console.log(JSON.stringify({ metadata: { vulnerabilities: { high: 3, critical: 0 } } }))\n")
      ajuda.ajusta({ COMANDOS: { auditar: 'node auditoria-falsa.mjs' }, PISOS: { auditoria: 2 } })
    }
  },
  {
    nome: 'auditoria: altas dentro do piso passam',
    stacks: ['node'],
    args: ['--auditar'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      comRuntime(ajuda)
      ajuda.escreve('auditoria-falsa.mjs', "console.log(JSON.stringify({ metadata: { vulnerabilities: { high: 2, critical: 0 } } }))\n")
      ajuda.ajusta({ COMANDOS: { auditar: 'node auditoria-falsa.mjs' }, PISOS: { auditoria: 2 } })
    }
  },
  {
    nome: 'auditoria: crítica conta junto com as altas',
    stacks: ['node'],
    args: ['--auditar'],
    espera: 'vermelho',
    cita: /auditoria/,
    planta (raiz, stack, ajuda) {
      comRuntime(ajuda)
      ajuda.escreve('auditoria-falsa.mjs', "console.log(JSON.stringify({ metadata: { vulnerabilities: { high: 2, critical: 1 } } }))\n")
      ajuda.ajusta({ COMANDOS: { auditar: 'node auditoria-falsa.mjs' }, PISOS: { auditoria: 2 } })
    }
  },
  {
    nome: 'auditoria: sem piso declarado, qualquer alta reprova',
    stacks: ['node'],
    args: ['--auditar'],
    espera: 'vermelho',
    cita: /auditoria/,
    planta (raiz, stack, ajuda) {
      comRuntime(ajuda)
      ajuda.escreve('auditoria-falsa.mjs', "console.log(JSON.stringify({ metadata: { vulnerabilities: { high: 1, critical: 0 } } }))\n")
      ajuda.ajusta({ COMANDOS: { auditar: 'node auditoria-falsa.mjs' } })
    }
  },
  {
    nome: 'auditoria: resposta que não é JSON (sem rede) é NÃO MEDIDO, nunca verde',
    stacks: ['node'],
    args: ['--auditar'],
    espera: 'vermelho',
    cita: /não medido/,
    planta (raiz, stack, ajuda) {
      comRuntime(ajuda)
      ajuda.escreve('auditoria-falsa.mjs', "console.error('npm error code ENOTFOUND'); process.exit(1)\n")
      ajuda.ajusta({ COMANDOS: { auditar: 'node auditoria-falsa.mjs' }, PISOS: { auditoria: 2 } })
    }
  },
  {
    // ⚠️ Zero dependência de runtime vem sem package-lock. O `npm audit` sem
    // lockfile falha, e o passo de
    // auditoria daria vermelho no CI de um projeto que não tem o que auditar.
    // O comando falso aqui FALHA de propósito: se ele rodar, o caso reprova.
    nome: 'auditoria: projeto Node sem dependência de runtime não é auditado, e passa',
    stacks: ['node'],
    args: ['--auditar'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('package.json', JSON.stringify({ name: 'alvo', devDependencies: { vitest: '^4.0.0' } }, null, 2))
      ajuda.escreve('auditoria-falsa.mjs', "console.error('não era para rodar'); process.exit(1)\n")
      ajuda.ajusta({ COMANDOS: { auditar: 'node auditoria-falsa.mjs' } })
    }
  },
  {
    nome: 'auditoria: projeto Python sem dependência de runtime não é auditado, e passa',
    stacks: ['python'],
    args: ['--auditar'],
    espera: 'verde',
    planta (raiz, stack, ajuda) {
      ajuda.escreve('requirements-dev.txt', 'pytest==9.1.1\n')
      ajuda.escreve('.venv/Lib/site-packages/pytest-9.1.1.dist-info/METADATA', 'Name: pytest\nVersion: 9.1.1\nLicense-Expression: MIT\n')
      ajuda.escreve('auditoria-falsa.mjs', "console.error('não era para rodar'); process.exit(1)\n")
      ajuda.ajusta({ COMANDOS: { auditar: 'node auditoria-falsa.mjs' } })
    }
  }
]
