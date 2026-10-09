#!/usr/bin/env node
// node .claude/skills/fabrica/scripts/teste-fabrica.mjs [--sem-python] [--se-mudou] [--com-mutacoes]
//
// O teste da própria fábrica, em quatro blocos:
//
//   A · a instalação faz o que promete, e RECUSA antes de copiar meio kit
//   B · o portão inteiro fecha num projeto de verdade, com cobertura de verdade
//   C · a matriz de provas plantadas: cada régua ainda sabe reprovar
//   D · a coerência do kit, dos agentes e da skill
//
// 🚨 Tudo acontece em `os.tmpdir()`. O bloco D confere no fim que nada vazou
// para o repositório: um teste que suja o projeto é um teste que ninguém roda
// duas vezes.
//
// ⚠️ A trilha Python precisa de rede na primeira vez (pip). Sem rede, o bloco
// se PULA COM A RAZÃO IMPRESSA, e o teste só sai 0 se o resto passou inteiro.
// Pulo silencioso não existe aqui (constituição VI).

import { existsSync, readFileSync, writeFileSync, readdirSync, cpSync, mkdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { criar, apagar } from '../kit/lib/temporaria.mjs'
import { rodar } from '../kit/lib/runner.mjs'
import { pinta } from '../kit/lib/saida.mjs'
import { arquivosDoKit } from './gerar-manifesto.mjs'
import { instalar, derivaDe } from './instalar.mjs'
import { conferir as confereCaracteres } from './confere-caracteres.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const SKILL = dirname(AQUI)
const KIT = join(SKILL, 'kit')
const RAIZ = dirname(dirname(dirname(SKILL)))
const FIXTURES = join(SKILL, 'fixtures')

let ok = 0
let ruim = 0
const pulados = []

function certo (nome) {
  ok += 1
  console.log(`  ${pinta('✓', 'verde')} ${nome}`)
}

function errado (nome, porque) {
  ruim += 1
  console.log(`  ${pinta('✗', 'vermelho')} ${nome}`)
  for (const linha of String(porque).split('\n').slice(0, 8)) console.log(`      ${linha}`)
}

function caso (nome, trabalho) {
  try {
    const erro = trabalho()
    if (erro) errado(nome, erro)
    else certo(nome)
  } catch (e) {
    errado(nome, e.stack ?? e.message)
  }
}

function pulado (nome, razao) {
  pulados.push({ nome, razao })
  console.log(`  ${pinta('⏭', 'amarelo')} ${nome} — pulado: ${razao}`)
}

function calado () {
  return () => {}
}

function alvoNode (comKit = true) {
  const raiz = criar('fabrica-teste-node-')
  cpSync(join(FIXTURES, 'node-minimo'), raiz, { recursive: true })
  if (comKit) {
    instalar(raiz, { aviso: calado() })
    cpSync(join(raiz, 'fabrica-stack-esperado.mjs'), join(raiz, 'fabrica', 'stack.mjs'))
  }
  return raiz
}

/** Esta árvore é um worktree PRÓPRIO (o `git-dir` não é o comum)? Aí ninguém mais usa a fonte. */
function emWorktree () {
  const dir = rodar('git rev-parse --git-dir', { cwd: RAIZ, tempoMaximo: 15000 }).saida.trim()
  const comum = rodar('git rev-parse --git-common-dir', { cwd: RAIZ, tempoMaximo: 15000 }).saida.trim()
  return Boolean(dir) && Boolean(comum) && resolve(RAIZ, dir) !== resolve(RAIZ, comum)
}

/** As pastas cujo conteúdo decide se o kit mudou. */
const DO_KIT = ['.claude/skills/fabrica', '.claude/agents/fabrica', '.claude/fabrica']
const ESTADO = join(RAIZ, '.claude', 'fabrica', '.ultimo-teste-fabrica.json')

/**
 * A impressão do kit no HEAD, ou `null` quando há mudança não comitada nele
 * (aí não há o que comparar: roda).
 */
function impressaoDoKit () {
  const sujo = rodar(`git status --porcelain -- ${DO_KIT.join(' ')}`, { cwd: RAIZ, tempoMaximo: 30000 })
  if (sujo.saiu !== 0 || sujo.saida.trim()) return null
  const partes = DO_KIT.map((p) => rodar(`git rev-parse HEAD:${p}`, { cwd: RAIZ, tempoMaximo: 15000 }))
  if (partes.some((p) => p.saiu !== 0)) return null
  return partes.map((p) => p.saida.trim()).join(':')
}

function comGit (raiz) {
  rodar('git init -q', { cwd: raiz, tempoMaximo: 30000 })
  rodar('git add -A', { cwd: raiz, tempoMaximo: 30000 })
  rodar('git -c user.name=fabrica -c user.email=f@f commit -q -m fixture --no-verify', { cwd: raiz, tempoMaximo: 30000 })
}

// ───────────────────────────────────────── A · a instalação

function blocoA () {
  console.log('\nA · a instalação')

  caso('A1 · instala em alvo Node, e todo arquivo do manifesto bate por sha', () => {
    const raiz = alvoNode(false)
    try {
      const codigo = instalar(raiz, { aviso: calado() })
      if (codigo !== 0) return `instalar saiu ${codigo}`
      const d = derivaDe(raiz)
      if (!d.limpo) return `deriva logo depois de instalar: ${JSON.stringify(d)}`
      if (!existsSync(join(raiz, 'fabrica', 'stack.mjs'))) return 'não escreveu fabrica/stack.mjs'
      if (!existsSync(join(raiz, 'specs', 'constitution.md'))) return 'não escreveu specs/constitution.md'
      if (!existsSync(join(raiz, '.github', 'workflows', 'portao.yml'))) return 'não escreveu o workflow'
      const pkg = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8'))
      if (!pkg.scripts?.portao) return 'não acrescentou o script "portao"'
      return null
    } finally { apagar(raiz) }
  })

  caso('A8 · instala FORA DE VISTA em .claude/fabrica, e o portão roda de lá', () => {
    // Na raiz do workspace, a cópia do kit fica fora de vista. Com --pasta,
    // nada de `fabrica/` nasce na raiz.
    const raiz = alvoNode(false)
    try {
      const codigo = instalar(raiz, { pasta: '.claude/fabrica', aviso: calado() })
      if (codigo !== 0) return `instalar saiu ${codigo}`
      if (existsSync(join(raiz, 'fabrica'))) return 'criou fabrica/ na raiz'
      if (!existsSync(join(raiz, '.claude', 'fabrica', 'stack.mjs'))) return 'não escreveu .claude/fabrica/stack.mjs'
      if (!derivaDe(raiz).limpo) return `deriva logo depois de instalar: ${JSON.stringify(derivaDe(raiz))}`
      const ci = readFileSync(join(raiz, '.github', 'workflows', 'portao.yml'), 'utf8')
      if (!ci.includes('node .claude/fabrica/portao.mjs')) return 'o CI não chama o portão do lugar novo'
      if (!readFileSync(join(raiz, '.gitignore'), 'utf8').includes('.claude/fabrica/.ultimo-portao.json')) return 'o .gitignore não cobre o estado do lugar novo'
      const r = rodar('node .claude/fabrica/portao.mjs --listar', { cwd: raiz, tempoMaximo: 60000 })
      if (r.saiu !== 0) return `o portão não lista do lugar novo: ${r.saida.slice(-300)}`
      const segunda = instalar(raiz, { aviso: calado() })
      if (segunda !== 0 || existsSync(join(raiz, 'fabrica'))) return 'a segunda instalação não achou o kit onde ele mora'
      return null
    } finally { apagar(raiz) }
  })

  caso('A9 · o .gitignore ganha UM bloco do kit, mesmo acrescentado em duas vezes', () => {
    const raiz = alvoNode(false)
    try {
      writeFileSync(join(raiz, '.gitignore'), 'node_modules/\n\n# kit da fábrica\ncoverage/\n')
      instalar(raiz, { aviso: calado() })
      const blocos = readFileSync(join(raiz, '.gitignore'), 'utf8').split('# kit da fábrica').length - 1
      return blocos === 1 ? null : `${blocos} blocos "# kit da fábrica" no .gitignore`
    } finally { apagar(raiz) }
  })

  caso('A10 · repositório ANINHADO (com .git próprio) é raiz, e ganha o workflow', () => {
    // Um projeto com Git próprio dentro do workspace: sem isto, o instalador o
    // chamaria de subpasta do workspace e mandaria pôr um job no workflow dele,
    // que nunca roda o código do projeto.
    const externo = criar('fabrica-teste-externo-')
    try {
      rodar('git init -q', { cwd: externo, tempoMaximo: 30000 })
      const alvo = join(externo, 'projeto')
      cpSync(join(FIXTURES, 'node-minimo'), alvo, { recursive: true })
      rodar('git init -q', { cwd: alvo, tempoMaximo: 30000 })
      const linhas = []
      if (instalar(alvo, { aviso: (t) => linhas.push(t) }) !== 0) return 'instalar não saiu 0'
      if (linhas.join('\n').includes('SUBPASTA')) return 'chamou de subpasta um repositório com .git próprio'
      if (!existsSync(join(alvo, '.github', 'workflows', 'portao.yml'))) return 'não escreveu o workflow da raiz'
      return null
    } finally { apagar(externo) }
  })

  caso('A12 · repositório com CI PRÓPRIO não ganha um segundo workflow', () => {
    // O portão do projeto chama o do kit como UM passo; dois workflows
    // rodariam a mesma coisa duas vezes, ou divergiriam.
    const externo = criar('fabrica-teste-externo-')
    try {
      const alvo = join(externo, 'projeto')
      cpSync(join(FIXTURES, 'node-minimo'), alvo, { recursive: true })
      rodar('git init -q', { cwd: alvo, tempoMaximo: 30000 })
      mkdirSync(join(alvo, '.github', 'workflows'), { recursive: true })
      writeFileSync(join(alvo, '.github', 'workflows', 'verificar.yml'), 'on: push\n')
      const linhas = []
      if (instalar(alvo, { aviso: (t) => linhas.push(t) }) !== 0) return 'instalar não saiu 0'
      const disse = linhas.join('\n')
      if (!disse.includes('CI próprio (verificar.yml)')) return `não avisou do CI próprio: ${disse.slice(0, 300)}`
      if (existsSync(join(alvo, '.github', 'workflows', 'portao.yml'))) return 'escreveu um segundo workflow'
      return null
    } finally { apagar(externo) }
  })

  caso('A11 · SUBPASTA de verdade (sem .git próprio) continua avisada, sem workflow', () => {
    const externo = criar('fabrica-teste-externo-')
    try {
      rodar('git init -q', { cwd: externo, tempoMaximo: 30000 })
      const alvo = join(externo, 'sub')
      cpSync(join(FIXTURES, 'node-minimo'), alvo, { recursive: true })
      const linhas = []
      if (instalar(alvo, { aviso: (t) => linhas.push(t) }) !== 0) return 'instalar não saiu 0'
      if (!linhas.join('\n').includes('SUBPASTA')) return 'não avisou que é subpasta'
      if (existsSync(join(alvo, '.github', 'workflows', 'portao.yml'))) return 'escreveu workflow que nunca roda'
      return null
    } finally { apagar(externo) }
  })

  caso('A3 · instalar duas vezes não muda byte nenhum', () => {
    const raiz = alvoNode(false)
    try {
      instalar(raiz, { aviso: calado() })
      const antes = readFileSync(join(raiz, 'fabrica', 'portao.mjs'), 'utf8')
      const linhas = []
      const codigo = instalar(raiz, { aviso: (t) => linhas.push(t) })
      if (codigo !== 0) return `segunda instalação saiu ${codigo}`
      if (!linhas.join('\n').includes('já está atual')) return `não disse que já estava atual: ${linhas.join(' | ')}`
      if (readFileSync(join(raiz, 'fabrica', 'portao.mjs'), 'utf8') !== antes) return 'o arquivo mudou'
      return null
    } finally { apagar(raiz) }
  })

  caso('A4 · kit EDITADO à mão recusa, e só --forcar sobrescreve', () => {
    const raiz = alvoNode(false)
    try {
      instalar(raiz, { aviso: calado() })
      const alvo = join(raiz, 'fabrica', 'portao', 'segredos.mjs')
      writeFileSync(alvo, `${readFileSync(alvo, 'utf8')}\n// mexido à mão\n`, 'utf8')

      const linhas = []
      if (instalar(raiz, { aviso: (t) => linhas.push(t) }) === 0) return 'aceitou kit editado'
      if (!linhas.join('\n').includes('EDITADO')) return `não disse que foi editado: ${linhas.join(' | ')}`

      if (instalar(raiz, { forcar: true, aviso: calado() }) !== 0) return '--forcar não conseguiu sobrescrever'
      if (!derivaDe(raiz).limpo) return '--forcar não restaurou o kit'
      return null
    } finally { apagar(raiz) }
  })

  caso('A5 · alvo Python sem as ferramentas RECUSA antes de copiar qualquer coisa', () => {
    const raiz = criar('fabrica-teste-py-vazio-')
    try {
      writeFileSync(join(raiz, 'pyproject.toml'), '[project]\nname = "x"\n', 'utf8')
      const linhas = []
      const codigo = instalar(raiz, { aviso: (t) => linhas.push(t) })
      if (codigo === 0) return 'instalou sem as ferramentas do Python'
      if (existsSync(join(raiz, 'fabrica'))) return 'copiou MEIO KIT antes de recusar'
      if (!/venv|pytest|coverage|mypy|ruff/i.test(linhas.join('\n'))) return `não disse o que falta: ${linhas.join(' | ')}`
      return null
    } finally { apagar(raiz) }
  })

  caso('A6 · constituição existente SEM o núcleo recusa, sem tocar no arquivo', () => {
    const raiz = alvoNode(false)
    try {
      mkdirSync(join(raiz, 'specs'), { recursive: true })
      const caminho = join(raiz, 'specs', 'constitution.md')
      const original = '# Constituição de outro projeto\n\n### I. Alguma outra coisa\n'
      writeFileSync(caminho, original, 'utf8')

      const linhas = []
      if (instalar(raiz, { aviso: (t) => linhas.push(t) }) === 0) return 'aceitou constituição sem o núcleo'
      if (readFileSync(caminho, 'utf8') !== original) return 'TOCOU no arquivo que disse que não tocaria'
      if (!linhas.join('\n').includes('Teste antes')) return `não listou o que falta: ${linhas.join(' | ')}`
      if (existsSync(join(raiz, 'fabrica'))) return 'copiou o kit antes de recusar'
      return null
    } finally { apagar(raiz) }
  })

  caso('A13 · a instalação NÃO grava origem no kit.json: caminho gravado envelhece', () => {
    // Caminho gravado aponta para uma pasta que deixa de existir. O conferidor
    // `kit` acha a fonte subindo as pastas.
    const raiz = alvoNode(false)
    try {
      instalar(raiz, { aviso: calado() })
      const dados = JSON.parse(readFileSync(join(raiz, 'fabrica', 'kit.json'), 'utf8'))
      return 'origem' in dados ? `gravou origem: ${dados.origem}` : null
    } finally { apagar(raiz) }
  })

  caso('A7 · alvo sem package.json nem pyproject.toml recusa, e pede --stack', () => {
    const raiz = criar('fabrica-teste-sem-stack-')
    try {
      const linhas = []
      if (instalar(raiz, { aviso: (t) => linhas.push(t) }) === 0) return 'adivinhou a stack'
      if (!linhas.join('\n').includes('--stack')) return 'não disse como resolver'
      return null
    } finally { apagar(raiz) }
  })

  caso('A14 · o .gitignore do alvo ignora .env e deixa o .env.example', () => {
    // Projeto que lê a chave do ambiente precisa do `.env` ignorado desde a
    // instalação. O `segredos` pega a chave
    // DEPOIS do commit; o ignore impede que ela entre.
    const raiz = alvoNode(false)
    try {
      instalar(raiz, { aviso: calado() })
      const linhas = readFileSync(join(raiz, '.gitignore'), 'utf8').split(/\r?\n/).map((l) => l.trim())
      for (const esperada of ['.env', '.env.*', '!.env*.example']) {
        if (!linhas.includes(esperada)) return `o .gitignore instalado não tem a linha ${esperada}`
      }
      return null
    } finally { apagar(raiz) }
  })

  caso('A15 · o stack.mjs recém-instalado declara documento vivo, e o envelhecimento mede', () => {
    // Sem DOCUMENTOS_VIVOS no modelo, o conferidor `envelhecimento` de um
    // projeto novo olharia ZERO documento e reprovaria por "nada foi medido". O
    // fixture não pega isso, porque o stack.mjs dele é outro, copiado por cima.
    const raiz = alvoNode(false)
    try {
      instalar(raiz, { aviso: calado() })
      const r = rodar('node fabrica/portao/envelhecimento.mjs', { cwd: raiz, tempoMaximo: 60000 })
      if (r.saiu !== 0) return `o envelhecimento reprovou num projeto recém-instalado:\n${r.saida.slice(-400)}`
      return null
    } finally { apagar(raiz) }
  })
}

// ───────────────────────────────────────── B · o portão de verdade

function blocoB () {
  console.log('\nB · o portão num projeto de verdade')

  caso('B1 · o portão inteiro FECHA no fixture Node, com cobertura medida', () => {
    const raiz = alvoNode()
    try {
      comGit(raiz)
      const r = rodar('node fabrica/portao.mjs', { cwd: raiz, tempoMaximo: 300000 })
      if (r.saiu !== 0) return `o portão reprovou:\n${r.saida.split('\n').slice(-25).join('\n')}`
      if (!/O portão fechou: \d+ de \d+/.test(r.saida)) return 'não imprimiu o fecho'

      const lcov = join(raiz, 'coverage', 'lcov.info')
      if (!existsSync(lcov)) return 'o passo testar não deixou lcov'
      if (!readFileSync(lcov, 'utf8').includes('SF:')) return 'o lcov não tem arquivo nenhum'
      return null
    } finally { apagar(raiz) }
  })

  caso('B2 · --listar responde, e todo passo `maquina` traz razão', () => {
    const raiz = alvoNode()
    try {
      const r = rodar('node fabrica/portao.mjs --listar', { cwd: raiz, tempoMaximo: 60000 })
      if (r.saiu !== 0) return `--listar reprovou:\n${r.saida}`
      if (!/Total: \d+ passo/.test(r.saida)) return 'não disse o total'
      return null
    } finally { apagar(raiz) }
  })

  caso('B3 · sem teste nenhum, o portão fica VERMELHO (verde medindo zero)', () => {
    const raiz = alvoNode()
    try {
      comGit(raiz)
      for (const f of readdirSync(join(raiz, 'testes'))) {
        writeFileSync(join(raiz, 'testes', f), '// vazio de propósito\n', 'utf8')
      }
      const r = rodar('node fabrica/portao.mjs --so cobertura', { cwd: raiz, tempoMaximo: 120000 })
      if (r.saiu === 0) return 'ficou verde sem teste nenhum'
      return null
    } finally { apagar(raiz) }
  })

  caso('B5 · o stack que o INSTALADOR escreve lista, carrega, e não traz a matriz', () => {
    // 🚨 O B1 troca o stack pelo esperado do fixture (o do modelo manda `npx tsc`
    // e o fixture não tem node_modules). Sem este caso, o modelo seria o único
    // arquivo do kit que nunca passa por teste nenhum.
    const raiz = alvoNode(false)
    try {
      if (instalar(raiz, { aviso: calado() }) !== 0) return 'instalar não saiu 0'
      const lista = rodar('node fabrica/portao.mjs --listar', { cwd: raiz, tempoMaximo: 60000 })
      if (lista.saiu !== 0) return `o stack do instalador não lista:\n${lista.saida.slice(-300)}`
      const ler = rodar('node -e "import(\'./fabrica/stack.mjs\').then(s=>console.log(JSON.stringify({p:s.PASSOS.map(x=>x.nome),u:s.COMANDOS.testarUm,d:s.DOCUMENTOS_VIVOS,a:s.AREAS_OBRIGATORIAS})))"', { cwd: raiz, tempoMaximo: 60000 })
      if (ler.saiu !== 0) return `o stack do instalador não carrega:\n${ler.saida.slice(-300)}`
      const s = JSON.parse(ler.saida.trim().split('\n').pop())
      if (s.p.includes('provas')) return 'o modelo ainda põe a matriz de provas no portão do projeto'
      if (!s.p.includes('segredos-historico') || !s.p.includes('auditoria')) return `faltam os passos do CI: ${s.p.join(', ')}`
      if (!/\{teste\}/.test(s.u ?? '') || !/\{relatorio\}/.test(s.u ?? '')) return `COMANDOS.testarUm sem {teste} e {relatorio}: ${s.u}`
      if (!Array.isArray(s.d)) return 'o modelo não declara DOCUMENTOS_VIVOS'
      if (s.a.some((x) => x.includes('fabrica/'))) return 'o modelo põe a pasta do kit em AREAS_OBRIGATORIAS'
      return null
    } finally { apagar(raiz) }
  })

  caso('B4 · defeito plantado no código REPROVA o portão', () => {
    const raiz = alvoNode()
    try {
      comGit(raiz)
      writeFileSync(
        join(raiz, 'src', 'dominio', 'quebra.mjs'),
        "import { linhaDoTotal } from '../app/tela.mjs'\nexport const x = linhaDoTotal\n",
        'utf8'
      )
      const r = rodar('node fabrica/portao.mjs --so camadas', { cwd: raiz, tempoMaximo: 120000 })
      if (r.saiu === 0) return 'não viu a camada dominio importando de app'
      if (!r.saida.includes('dominio')) return `reprovou sem citar a camada:\n${r.saida.slice(-400)}`
      return null
    } finally { apagar(raiz) }
  })
}

// ───────────────────────────────────────── C · a matriz

function blocoC () {
  console.log('\nC · a matriz de provas plantadas')

  caso('C1 · toda régua do kit ainda sabe reprovar, e o relatório de máquina bate com a tela', () => {
    const pasta = criar('fabrica-teste-matriz-')
    try {
      const relatorio = join(pasta, 'matriz.xml')
      const r = rodar(`node "${join(KIT, 'teste-portao.mjs').split('\\').join('/')}" --relatorio "${relatorio.split('\\').join('/')}"`, {
        cwd: KIT,
        tempoMaximo: 600000
      })
      if (r.saiu !== 0) return r.saida.split('\n').slice(-20).join('\n')
      const m = r.saida.match(/(\d+) caso\(s\) plantado/)
      if (!m || Number(m[1]) < 50) return `poucos casos plantados: ${m?.[1] ?? 'nenhum'}`
      // ⚠️ O junit é o que o `vermelho.mjs` lê para gravar o vermelho de um
      // conferidor: ele tem que contar o mesmo que a tela conta.
      const casos = (readFileSync(relatorio, 'utf8').match(/<testcase\b/g) ?? []).length
      if (casos !== Number(m[1])) return `o junit tem ${casos} casos e a tela diz ${m[1]}`
      console.log(`      ${m[1]} casos plantados, e o junit com os mesmos ${casos}`)
      return null
    } finally { apagar(pasta) }
  })

  // 🚨 O C2 MUTA A FONTE do kit, no lugar, e restaura. Numa árvore que várias
  // sessões usam ao mesmo tempo, isso dá vermelho falso em quem rodar as
  // suítes no meio. Ele roda onde ninguém mais está:
  // no CI, num worktree próprio, ou com --com-mutacoes pedido à mão.
  const soEu = process.env.CI === 'true' || emWorktree() || process.argv.includes('--com-mutacoes')
  if (!soEu) {
    pulado('C2 · toda mutação registrada no kit ainda é pega', 'a árvore é compartilhada com outras sessões e o C2 muta a fonte no lugar; roda no CI, num worktree, ou com --com-mutacoes')
  } else {
    caso('C2 · toda mutação registrada no kit ainda é pega', () => {
      // 🚨 O provador recebe um PRAZO menor que o teto deste caso, e para entre
      // uma mutação e outra: com o teto matando só o shell, o provador órfão
      // seguiria mutando a fonte por meia hora. A folga de 5 min cobre a
      // mutação mais lenta, que é a da matriz do `segredos`. Uma centena de
      // mutações leva uns 25 min no Windows; no CI, em Linux, uns 5 min.
      const TETO_MIN = 45
      const prazoS = TETO_MIN * 60 - 5 * 60
      const r = rodar(`node "${join(AQUI, 'provar-mutacoes.mjs').split('\\').join('/')}" --prazo ${prazoS}`, {
        cwd: RAIZ,
        tempoMaximo: TETO_MIN * 60 * 1000
      })
      // Morto por tempo não é mutação escapada: diz isso com todas as letras. Com
      // o prazo acima isso só acontece se uma mutação sozinha passar dos 5 min
      // de folga, e aí o arquivo que estava mutado pode ficar assim até o
      // processo filho morrer.
      if (r.mortoPorTempo) {
        const ultima = r.saida.split('\n').filter((l) => l.trim()).pop() ?? ''
        return `o provador passou do teto de ${TETO_MIN} min e foi MORTO no meio de uma mutação: nada foi reprovado, e nada foi provado. Rode de novo com a máquina livre, e confira o git status (um arquivo pode ter ficado mutado).\núltima linha: ${ultima}`
      }
      // ⚠️ Na falha, o que NÃO foi pego vem primeiro. O fim da saída é só de
      // mutações pegas, e a C2 reprovaria sem mostrar qual: a lista inteira tem
      // mais de 60 linhas.
      if (r.saiu !== 0) {
        const linhas = r.saida.split('\n')
        const ruins = linhas.flatMap((l, i) => (/^\s*✗/.test(l) ? linhas.slice(i, i + 4) : []))
        return [...ruins, linhas.filter((l) => l.trim()).pop()].join('\n')
      }
      const m = r.saida.match(/(\d+) de (\d+) mutações pegas/)
      if (!m) return 'não disse quantas mutações'
      console.log(`      ${m[0]}`)
      return null
    })
  }

  caso('C3 · os testes de unidade do kit passam', () => {
    const arquivos = readdirSync(join(KIT, 'testes'))
      .filter((f) => f.startsWith('teste-') && f.endsWith('.mjs'))
      .map((f) => `"${join(KIT, 'testes', f).split('\\').join('/')}"`)
    if (arquivos.length === 0) return 'nenhum teste de unidade: nada foi medido'
    const r = rodar(`node --test ${arquivos.join(' ')}`, { cwd: RAIZ, tempoMaximo: 300000 })
    if (r.saiu !== 0) return r.saida.split('\n').slice(-20).join('\n')
    if (!r.testes.conhecido || r.testes.rodaram === 0) return 'o runner não mediu nada'
    console.log(`      ${r.testes.rodaram} casos de unidade`)
    return null
  })

  // A bancada offline é script da skill, fora do kit: os testes
  // dela moram em scripts/testes/, e zero teste lá é "nada foi medido".
  caso('C4 · os testes dos scripts da skill passam (a bancada)', () => {
    const pasta = join(AQUI, 'testes')
    const arquivos = existsSync(pasta)
      ? readdirSync(pasta).filter((f) => f.startsWith('teste-') && f.endsWith('.mjs')).map((f) => `"${join(pasta, f).split('\\').join('/')}"`)
      : []
    if (arquivos.length === 0) return 'nenhum teste em scripts/testes: nada foi medido'
    const r = rodar(`node --test ${arquivos.join(' ')}`, { cwd: RAIZ, tempoMaximo: 600000 })
    if (r.saiu !== 0) return r.saida.split('\n').slice(-20).join('\n')
    if (!r.testes.conhecido || r.testes.rodaram === 0) return 'o runner não mediu nada'
    console.log(`      ${r.testes.rodaram} casos dos scripts`)
    return null
  })
}

// ───────────────────────────────────────── D · a coerência

function blocoD () {
  console.log('\nD · a coerência do kit, dos agentes e da skill')

  caso('D1 · o workflow tem UMA linha `run` de portão, e nenhuma lista própria', () => {
    const texto = readFileSync(join(SKILL, 'templates', 'workflow.yml'), 'utf8')
    const chamadas = (texto.match(/run:\s*node fabrica\/portao\.mjs/g) ?? []).length
    if (chamadas !== 1) return `${chamadas} chamadas ao portão (tem que ser 1)`
    if (/run:\s*node fabrica\/portao\//.test(texto)) return 'o workflow chama conferidor direto: lista dupla'
    if (!texto.includes('GITHUB_STEP_SUMMARY')) return 'não escreve o que foi pulado no resumo'
    // 🚨 Sem o histórico inteiro, o gitleaks e o `segredos --historico` do CI
    // olham um commit só; e sem o sha256, o binário baixado é confiança cega.
    if (!/fetch-depth:\s*0/.test(texto)) return 'o checkout não traz o histórico inteiro (fetch-depth: 0)'
    if (!/timeout-minutes:\s*\d+/.test(texto)) return 'o job não tem teto de tempo'
    if (!/sha256sum -c/.test(texto) || !/gitleaks"?\s+git\b/.test(texto)) return 'o gitleaks não está no CI, ou entra sem o sha256 conferido'
    return null
  })

  caso('D2 · os três revisores existem e têm as seis seções do contrato', () => {
    const pasta = join(RAIZ, '.claude', 'agents', 'fabrica')
    if (!existsSync(pasta)) return 'ainda não existe .claude/agents/fabrica/'
    const r = rodar(`node "${join(AQUI, 'conferir-agentes.mjs').split('\\').join('/')}"`, {
      cwd: RAIZ,
      tempoMaximo: 60000
    })
    if (r.saiu !== 0) return r.saida.split('\n').slice(-12).join('\n')
    return null
  })

  caso('D3 · todo caminho citado na skill existe', () => {
    const faltando = []
    const arquivos = [
      join(SKILL, 'SKILL.md'),
      ...readdirSync(join(SKILL, 'referencias')).map((f) => join(SKILL, 'referencias', f))
    ].filter((f) => existsSync(f) && f.endsWith('.md'))

    if (arquivos.length === 0) return 'nenhum documento da skill para conferir'

    for (const arquivo of arquivos) {
      for (const m of readFileSync(arquivo, 'utf8').matchAll(/`([^`\n]+)`/g)) {
        const bruto = m[1].trim()
        if (!/^(\.claude\/|specs\/|scripts\/|fabrica\/|identidade\/|_memoria\/)/.test(bruto)) continue
        if (/[*?<>|]/.test(bruto)) continue
        const semAncora = bruto.split('#')[0]
        // ⚠️ `fabrica/X` na skill é "o kit num alvo": na raiz do workspace ele
        // pode morar em `.claude/fabrica/`, e é lá que também se procura.
        const candidatos = [join(RAIZ, semAncora), join(RAIZ, '.claude', semAncora), join(SKILL, semAncora.replace(/^fabrica\//, 'kit/'))]
        if (!candidatos.some((c) => existsSync(c))) {
          faltando.push(`${arquivo.split(/[\\/]/).pop()} cita ${bruto}`)
        }
      }
    }
    return faltando.length > 0 ? faltando.join('\n') : null
  })

  caso('D4 · todo conferidor tem cabeçalho com uso e a linha Prova:', () => {
    const problemas = []
    for (const f of readdirSync(join(KIT, 'portao')).filter((x) => x.endsWith('.mjs'))) {
      const texto = readFileSync(join(KIT, 'portao', f), 'utf8')
      if (!/^\/\/\s*node\s+fabrica\/portao\//m.test(texto)) problemas.push(`${f}: sem a linha de uso`)
      const prova = texto.match(/Prova:\s*provas\/([a-z0-9-]+\.mjs)/)
      if (!prova) problemas.push(`${f}: sem a linha "Prova: provas/<nome>.mjs"`)
      else if (!existsSync(join(KIT, 'provas', prova[1]))) problemas.push(`${f}: aponta para provas/${prova[1]}, que não existe`)
    }
    return problemas.length > 0 ? problemas.join('\n') : null
  })

  caso('D5 · portao/ e provas/ se cobrem nos DOIS sentidos', () => {
    const conferidores = readdirSync(join(KIT, 'portao')).filter((f) => f.endsWith('.mjs')).map((f) => f.replace(/\.mjs$/, ''))
    const provas = readdirSync(join(KIT, 'provas')).filter((f) => f.endsWith('.mjs')).map((f) => f.replace(/\.mjs$/, ''))
    const semProva = conferidores.filter((c) => !provas.includes(c))
    const semConferidor = provas.filter((p) => !conferidores.includes(p))
    if (semProva.length > 0) return `conferidor sem prova: ${semProva.join(', ')}`
    if (semConferidor.length > 0) return `prova sem conferidor: ${semConferidor.join(', ')}`
    if (conferidores.length === 0) return 'nenhum conferidor: nada foi medido'
    console.log(`      ${conferidores.length} conferidores, ${provas.length} provas`)
    return null
  })

  caso('D6 · a constituição modelo traz os dez do núcleo, com MUST e Razão', () => {
    const texto = readFileSync(join(SKILL, 'templates', 'constituicao-modelo.md'), 'utf8')
    const titulos = texto.split('\n').filter((l) => l.startsWith('### ')).map((l) => l.slice(4).trim())
    const nucleo = [
      'I. Teste antes, sempre',
      'II. Regra que importa vira código, não prompt',
      'III. Monolito modular',
      'IV. Nada nasce ligado',
      'V. O estado mora num lugar só',
      'VI. Conferidor que aprova sabe por que aprovou',
      'VII. Decisão de engenharia se escreve antes do código',
      'VIII. Observável por construção',
      'IX. Segurança é fronteira',
      'X. Simplicidade'
    ]
    const faltam = nucleo.filter((p) => !titulos.includes(p))
    if (faltam.length > 0) return `falta no modelo: ${faltam.join(' · ')}`

    // Cada bloco vai até o próximo título: o X não pode pegar emprestada a
    // Razão que aparece nas seções `## ` de depois dele.
    const blocos = texto.split(/^### /m).slice(1).map((b) => b.split(/^## /m)[0])
    const semRazao = blocos
      .filter((b) => nucleo.some((n) => b.startsWith(n)))
      .filter((b) => !b.includes('MUST') || !/\*\*Razão:\*\*\s*\S/.test(b))
      .map((b) => b.split('\n')[0])
    return semRazao.length > 0 ? `sem MUST ou sem Razão: ${semRazao.join(' · ')}` : null
  })

  caso('D8 · o manifesto e o disco se cobrem nos dois sentidos', () => {
    const manifesto = JSON.parse(readFileSync(join(KIT, 'kit.json'), 'utf8'))
    const noDisco = new Set(arquivosDoKit())
    const declarados = new Set(Object.keys(manifesto.arquivos))
    const soNoDisco = [...noDisco].filter((f) => !declarados.has(f))
    const soNoManifesto = [...declarados].filter((f) => !noDisco.has(f))
    if (soNoDisco.length > 0) return `no disco e fora do manifesto: ${soNoDisco.join(', ')}`
    if (soNoManifesto.length > 0) return `no manifesto e fora do disco: ${soNoManifesto.join(', ')}`
    if (declarados.size === 0) return 'manifesto vazio: nada foi medido'
    console.log(`      ${declarados.size} arquivos no kit`)
    return null
  })

  caso('D9 · nenhum caractere de controle invisível no kit', () => {
    const linhas = []
    const codigo = confereCaracteres(SKILL, { escreve: (t) => linhas.push(t) })
    return codigo === 0 ? null : linhas.join('\n')
  })

  // ⚠️ Só a VERSÃO, e isso é de propósito: o conteúdo de cada cópia é do
  // conferidor `kit` DAQUELE projeto, que acha a fonte sozinho. Mapa de sha das
  // cópias aqui acoplaria o portão do workspace ao disco de repositório alheio.
  // 🚨 A cópia da RAIZ entra na conta: sem ela, no CI (onde projetos-pessoais/
  // não vem no clone) o caso mediria zero cópia e passaria.
  // Workspace recém-criado não tem cópia nenhuma (o kit vem dentro da skill, e
  // só se instala quando um projeto pede): aí o caso se PULA COM A RAZÃO, em vez
  // de passar medindo zero.
  const D10 = 'D10 · nenhum kit instalado no workspace está atrás da fonte'
  const manifesto = JSON.parse(readFileSync(join(KIT, 'kit.json'), 'utf8'))
  const copias = [
    { nome: 'a raiz (.claude/fabrica)', caminho: join(RAIZ, '.claude', 'fabrica', 'kit.json') },
    { nome: 'a raiz (fabrica)', caminho: join(RAIZ, 'fabrica', 'kit.json') }
  ]
  for (const familia of ['projetos-pessoais', 'clientes']) {
    const base = join(RAIZ, familia)
    if (!existsSync(base)) continue
    for (const projeto of readdirSync(base)) {
      // `produto/` é onde o /novo-projeto instala a fábrica junto com a fundação.
      for (const sub of ['', 'python', 'produto']) {
        const caminho = join(base, projeto, sub, 'fabrica', 'kit.json')
        if (existsSync(caminho)) copias.push({ nome: [familia, projeto, sub].filter(Boolean).join('/'), caminho })
      }
    }
  }
  const achadas = copias.filter((c) => existsSync(c.caminho))
  if (achadas.length === 0) {
    pulado(D10, 'nenhuma cópia do kit em .claude/fabrica/, fabrica/ nem em projetos-pessoais|clientes/<projeto>/{.,python,produto}/fabrica: não há o que comparar com a fonte')
  } else {
    caso(D10, () => {
      const atrasados = []
      for (const c of achadas) {
        try {
          const dele = JSON.parse(readFileSync(c.caminho, 'utf8'))
          if (dele.versao !== manifesto.versao) atrasados.push(`${c.nome}: versão ${dele.versao}, e a fonte está em ${manifesto.versao}`)
        } catch {
          atrasados.push(`${c.nome}: kit.json ilegível`)
        }
      }
      console.log(`      ${achadas.length} cópia(s) do kit conferida(s)`)
      return atrasados.length > 0 ? atrasados.join('\n') : null
    })
  }
}

/**
 * 🚨 `node --check` NÃO valida módulo ES: um publicador quebrado passa no
 * `--check` dos dois lados e só falha ao rodar.
 * A única conferência que vale é CARREGAR o módulo.
 */
async function blocoD7 () {
  const problemas = []
  const todos = arquivosDoKit().filter((f) => f.endsWith('.mjs'))
  if (todos.length === 0) {
    errado('D7 · todo .mjs do kit CARREGA', 'nenhum .mjs no kit: nada foi medido')
    return
  }
  for (const rel of todos) {
    try {
      await import(pathToFileURL(join(KIT, rel)).href)
    } catch (erro) {
      problemas.push(`${rel}: ${erro.message}`)
    }
  }
  if (problemas.length > 0) errado('D7 · todo .mjs do kit CARREGA', problemas.join('\n'))
  else certo(`D7 · todo .mjs do kit CARREGA (${todos.length} módulos)`)
}

// ───────────────────────────────────────── Python

function blocoPython () {
  console.log('\nP · a trilha Python')

  // O Python 3.12 do Windows mora, por padrão, no LOCALAPPDATA de quem instalou;
  // FABRICA_PYTHON aponta outro. Fora do Windows, é o python3 do PATH.
  const py = process.env.FABRICA_PYTHON ?? (process.platform === 'win32'
    ? join(process.env.LOCALAPPDATA ?? '', 'Programs', 'Python', 'Python312', 'python.exe').split('\\').join('/')
    : 'python3')

  if (!existsSync(py) && process.platform === 'win32') {
    pulado('P1 · o portão fecha no fixture Python', `não achei o Python em ${py}`)
    return
  }

  const raiz = criar('fabrica-teste-py-')
  try {
    cpSync(join(FIXTURES, 'python-minimo'), raiz, { recursive: true })

    const venv = rodar(`"${py}" -m venv .venv`, { cwd: raiz, tempoMaximo: 180000 })
    if (venv.saiu !== 0) {
      pulado('P1 · o portão fecha no fixture Python', `não consegui criar o .venv: ${venv.saida.slice(-200)}`)
      return
    }

    // 🚨 O caminho do interpretador vai ENTRE ASPAS, sempre: o `cmd` do
    // Windows recusa `.venv/Scripts/python.exe` sem
    // aspas ("não é reconhecido como um comando interno"), e recusa também com
    // barra invertida sem aspas. Só a forma com aspas funciona, e a barra pode
    // ser normal dentro delas.
    const pyVenv = process.platform === 'win32' ? '.venv/Scripts/python.exe' : '.venv/bin/python'
    const pip = rodar(`"${pyVenv}" -m pip install -q --disable-pip-version-check -r requirements-dev.txt`, {
      cwd: raiz,
      tempoMaximo: 600000
    })
    if (pip.saiu !== 0) {
      pulado(
        'P1 · o portão fecha no fixture Python',
        `o pip não instalou as ferramentas: ${pip.saida.trim().split('\n').slice(-2).join(' ').slice(0, 180)}`
      )
      return
    }

    caso('P1 · o kit instala no alvo Python, com as ferramentas na mão', () => {
      const codigo = instalar(raiz, { aviso: calado() })
      if (codigo !== 0) return `instalar saiu ${codigo}`
      return null
    })

    caso('P1b · o COMANDO do stack que o INSTALADOR escreveu roda de verdade', () => {
      // 🚨 A lacuna que este caso fecha é grave: o P1c troca o `stack.mjs`
      // recém-instalado pelo esperado do fixture, e o P2 mede o FIXTURE, não o
      // que o instalador escreve. Um template quebrado no Windows — sem aspas
      // no caminho, o `cmd.exe` lê a barra normal como opção e responde
      // "'.venv' não é reconhecido como um comando interno ou externo" —
      // passaria com os dois casos verdes por cima. Régua verde medindo o lugar
      // errado.
      const r = rodar('node -e "import(\'./fabrica/stack.mjs\').then(s=>console.log(s.COMANDOS.tipos))"', {
        cwd: raiz, tempoMaximo: 60000
      })
      if (r.saiu !== 0) return `não consegui ler o stack.mjs instalado: ${r.saida.slice(-200)}`
      const comando = r.saida.trim().split('\n').pop().trim()
      const t = rodar(comando, { cwd: raiz, tempoMaximo: 300000 })
      if (/não é reconhecido|is not recognized|cannot find/i.test(t.saida)) {
        return `o interpretador do template não foi encontrado pelo shell:\n${t.saida.slice(0, 300)}`
      }
      if (t.saiu !== 0) return `o comando de tipos do template reprovou:\n${t.saida.slice(-300)}`
      return null
    })

    caso('P1c · o fixture troca o stack só DEPOIS de o do instalador ser medido', () => {
      // ⚠️ A troca existe porque o fixture precisa das áreas obrigatórias
      // dele. O que importa é a ORDEM: ela não pode acontecer antes de alguém
      // ter olhado o que o instalador escreveu.
      cpSync(join(raiz, 'fabrica-stack-esperado.mjs'), join(raiz, 'fabrica', 'stack.mjs'))
      return existsSync(join(raiz, 'fabrica', 'stack.mjs')) ? null : 'o stack do fixture não ficou no lugar'
    })

    caso('P2 · o portão inteiro FECHA no fixture Python', () => {
      comGit(raiz)
      const r = rodar('node fabrica/portao.mjs', { cwd: raiz, tempoMaximo: 600000 })
      if (r.saiu !== 0) return `o portão reprovou:\n${r.saida.split('\n').slice(-25).join('\n')}`
      const lcov = join(raiz, 'coverage', 'lcov.info')
      if (!existsSync(lcov)) return 'o coverage não deixou lcov'
      return null
    })
  } finally {
    apagar(raiz, { prazoMs: 12000 })
  }
}

// ───────────────────────────────────────── fim

async function principal () {
  // ⚠️ `--se-mudou`: um portão que roda todas as suítes chama este teste a cada
  // vez, e ele leva minuto e meio, mesmo com o kit parado. Sem mudança no kit nem
  // nos revisores desde o último verde, ele diz isso e sai 0.
  const impressao = impressaoDoKit()
  if (process.argv.includes('--se-mudou') && impressao) {
    let ultimo = null
    try { ultimo = JSON.parse(readFileSync(ESTADO, 'utf8')) } catch { ultimo = null }
    if (ultimo?.impressao === impressao) {
      console.log(`⏭ teste da fábrica pulado: o kit e os revisores não mudaram desde o último verde (${ultimo.quando}, ${impressao.slice(0, 12)})`)
      process.exit(0)
      return
    }
  }

  const antes = rodar('git status --porcelain -- .claude/skills/fabrica .claude/fabrica specs', {
    cwd: RAIZ,
    tempoMaximo: 30000
  }).saida

  console.log('teste da fábrica')
  blocoA()
  blocoB()
  blocoC()
  blocoD()
  await blocoD7()
  if (!process.argv.includes('--sem-python')) blocoPython()

  caso('D11 · nada vazou para o repositório', () => {
    const depois = rodar('git status --porcelain -- .claude/skills/fabrica .claude/fabrica specs', {
      cwd: RAIZ,
      tempoMaximo: 30000
    }).saida
    if (depois !== antes) {
      return `o estado do git mudou durante o teste:\nantes:\n${antes}\ndepois:\n${depois}`
    }
    return null
  })

  console.log('\n────────────────────────────────────────')
  for (const p of pulados) console.log(`⏭ ${p.nome} — ${p.razao}`)
  if (pulados.length > 0) console.log('Ausência de medida não é evidência de conformidade.')

  if (ruim > 0) {
    console.log(`${pinta('✗', 'vermelho')} ${ruim} caso(s) reprovaram, ${ok} passaram.`)
    process.exit(1)
    return
  }
  console.log(`${pinta('✅', 'verde')} a fábrica: ${ok} caso(s), todos verdes${pulados.length ? `, ${pulados.length} pulado(s)` : ''}.`)
  // O último verde, para o --se-mudou. Só com a árvore do kit limpa: verde de
  // um kit não comitado não vale para o HEAD de ninguém.
  if (impressao && existsSync(dirname(ESTADO))) {
    writeFileSync(ESTADO, `${JSON.stringify({ quando: new Date().toISOString(), impressao, casos: ok, pulados: pulados.map((p) => p.nome) }, null, 2)}\n`, 'utf8')
  }
  process.exit(0)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  principal()
}
