#!/usr/bin/env node
// node .claude/skills/fabrica/scripts/instalar.mjs --alvo <dir> [--stack node|python] [--pasta .claude/fabrica]
// node .claude/skills/fabrica/scripts/instalar.mjs --conferir <dir>
// node .claude/skills/fabrica/scripts/instalar.mjs --atualizar <dir>
//
// Instalar é COPIAR A PASTA. Remover é apagar a pasta. Conferir deriva é
// comparar a pasta com a fonte. Um gesto para cada coisa, e nenhum deles
// precisa de um instalador esperto.
//
// 🚨 Nunca instala MEIO KIT. Se a trilha Python está sem ferramenta, ele
// recusa ANTES de copiar o primeiro arquivo: meio kit instalado é pior que
// nenhum, porque o portão passa a mentir sobre o que mede.
//
// ⚠️ `fabrica/stack.mjs` é do PROJETO: nasce do modelo na primeira instalação
// e nunca é sobrescrito depois. É o único arquivo de `fabrica/` que é seu.

import {
  existsSync, readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync, statSync, rmSync
} from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { impressaoDe } from '../kit/lib/impressao.mjs'
import { LUGARES_DO_KIT, pastaDoKit } from '../kit/lib/conferidor.mjs'

import { montarManifesto, arquivosDoKit, FORA } from './gerar-manifesto.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const SKILL = dirname(AQUI)
const KIT = join(SKILL, 'kit')
const TEMPLATES = join(SKILL, 'templates')

/**
 * Onde o kit mora neste alvo: o lugar pedido, ou onde ele já está, ou
 * `fabrica/`. Devolve `{ lugar }` ou `{ erro }`.
 * 🚨 Na raiz do workspace a cópia do kit fica fora de vista, em
 * `.claude/fabrica/` (`--pasta`). Os projetos usam `fabrica/`.
 */
export function lugarDoKit (alvo, pedido = null) {
  if (pedido) {
    return LUGARES_DO_KIT.includes(pedido)
      ? { lugar: pedido }
      : { erro: `--pasta aceita só ${LUGARES_DO_KIT.join(' ou ')}, e veio ${pedido}` }
  }
  const achado = pastaDoKit(alvo)
  if (achado.pasta) return { lugar: achado.pasta }
  if (/dois lugares/.test(achado.erro)) return { erro: achado.erro }
  return { lugar: 'fabrica' }
}

/**
 * O texto dos modelos (CI, .gitignore, .gitattributes) com o lugar certo.
 * ⚠️ Só `fabrica/` no começo de um caminho: `.claude/skills/fabrica/` fica.
 */
function noLugar (texto, lugar) {
  return lugar === 'fabrica' ? texto : texto.replace(/(?<![\w./-])fabrica\//g, `${lugar}/`)
}

const NUCLEO = [
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

const FERRAMENTAS_PYTHON = ['pytest', 'coverage', 'mypy', 'ruff']

/**
 * Existe um repositório git ACIMA deste alvo? Ou seja: ele é subpasta de um
 * repositório, em vez de ser a raiz de um (ou de nenhum).
 *
 * 🚨 Só isso decide se o workflow vale a pena, porque o GitHub Actions lê
 * `.github/workflows/` da RAIZ e de mais lugar nenhum.
 * @param {string} alvo caminho absoluto
 */
export function raizDeRepoAcima (alvo) {
  let aqui = resolve(alvo)
  // 🚨 Alvo com `.git` PRÓPRIO é raiz de repositório, mesmo morando dentro de
  // outro. É o caso de um projeto com Git e CI próprios dentro do workspace:
  // sem esta linha o instalador o chamaria de subpasta e mandaria pôr um job no
  // workflow do workspace, que nunca roda o código do projeto.
  if (existsSync(join(aqui, '.git'))) return null
  for (;;) {
    const pai = dirname(aqui)
    if (pai === aqui) return null
    if (existsSync(join(pai, '.git'))) return pai
    aqui = pai
  }
}

/**
 * Os workflows que o alvo já tem, pelo nome do arquivo.
 * @param {string} alvo
 */
function workflowsDe (alvo) {
  const pasta = join(alvo, '.github', 'workflows')
  if (!existsSync(pasta)) return []
  return readdirSync(pasta).filter((nome) => /\.ya?ml$/.test(nome)).sort()
}

// 🚨 A comparação de deriva usa `impressaoDe`, NUNCA um sha cru: um sha cru
// aqui compararia CRLF com LF e acusaria deriva onde não há.

export function detectarStack (alvo, lugar = lugarDoKit(alvo).lugar ?? 'fabrica') {
  // 🚨 Se o kit JÁ está instalado, quem sabe a stack é o `stack.mjs` dele, não
  // a adivinhação por arquivo. A raiz de um workspace não costuma ter
  // `package.json`, e o `--atualizar` recusaria por "não sei qual é a stack" num alvo onde a stack
  // está escrita a três linhas de distância.
  const declarada = join(alvo, lugar, 'stack.mjs')
  if (existsSync(declarada)) {
    const m = readFileSync(declarada, 'utf8').match(/export\s+const\s+STACK\s*=\s*['"](\w+)['"]/)
    if (m) return m[1]
  }
  if (existsSync(join(alvo, 'pyproject.toml')) || existsSync(join(alvo, 'requirements.txt'))) return 'python'
  if (existsSync(join(alvo, 'package.json'))) return 'node'
  return null
}

function pythonDo (alvo) {
  const candidatos = [
    join(alvo, '.venv', 'Scripts', 'python.exe'),
    join(alvo, '.venv', 'bin', 'python')
  ]
  return candidatos.find((c) => existsSync(c)) ?? null
}

/** A trilha Python só instala com as ferramentas na mão. */
function conferirPython (alvo, aviso) {
  const py = pythonDo(alvo)
  if (!py) {
    aviso(`✗ não achei o .venv em ${alvo}.`)
    aviso('  crie com: python -m venv .venv')
    aviso(`  e instale: .venv/Scripts/python -m pip install ${FERRAMENTAS_PYTHON.join(' ')}`)
    return false
  }
  let lista = ''
  try {
    lista = execFileSync(py, ['-m', 'pip', 'list'], { encoding: 'utf8', timeout: 60000 })
  } catch (erro) {
    aviso(`✗ não consegui listar os pacotes do .venv: ${erro.message}`)
    return false
  }
  const faltam = FERRAMENTAS_PYTHON.filter((f) => !new RegExp(`^${f}\\b`, 'im').test(lista))
  if (faltam.length > 0) {
    aviso(`✗ o kit Python exige ${FERRAMENTAS_PYTHON.join(', ')}; falta: ${faltam.join(', ')}`)
    aviso(`  instale com: ${py} -m pip install ${faltam.join(' ')}`)
    aviso('  nada foi copiado: meio kit instalado é pior que nenhum')
    return false
  }
  return true
}

/** Uma constituição que já existe precisa ter o núcleo, ou a instalação para. */
function conferirConstituicao (alvo, aviso) {
  const caminho = join(alvo, 'specs', 'constitution.md')
  if (!existsSync(caminho)) return true
  const texto = readFileSync(caminho, 'utf8')
  const faltam = NUCLEO.filter((p) => !texto.includes(p))
  if (faltam.length > 0) {
    aviso(`✗ ${alvo}/specs/constitution.md já existe e não tem o núcleo do kit.`)
    for (const f of faltam) aviso(`    falta: ${f}`)
    aviso('  o arquivo NÃO foi tocado. Acrescente os princípios, ou tire o arquivo do caminho.')
    return false
  }
  return true
}

/** O que está no alvo e difere da fonte, fora o que é do projeto. */
export function derivaDe (alvo, lugar = lugarDoKit(alvo).lugar ?? 'fabrica') {
  const pasta = join(alvo, lugar)
  const diferentes = []
  const faltando = []
  const intrusos = []

  for (const rel of arquivosDoKit()) {
    const la = join(pasta, rel)
    if (!existsSync(la)) { faltando.push(rel); continue }
    if (impressaoDe(la) !== impressaoDe(join(KIT, rel))) diferentes.push(rel)
  }

  const listar = (raiz, prefixo = '') => {
    if (!existsSync(raiz)) return []
    const achados = []
    for (const item of readdirSync(raiz, { withFileTypes: true })) {
      const rel = prefixo ? `${prefixo}/${item.name}` : item.name
      if (FORA.has(rel)) continue
      if (item.isDirectory()) achados.push(...listar(join(raiz, item.name), rel))
      else achados.push(rel)
    }
    return achados
  }
  const doKit = new Set(arquivosDoKit())
  for (const rel of listar(pasta)) {
    if (!doKit.has(rel)) intrusos.push(rel)
  }

  return { diferentes, faltando, intrusos, limpo: diferentes.length + faltando.length + intrusos.length === 0 }
}

function copiarKit (alvo, versao, lugar) {
  const destino = join(alvo, lugar)
  mkdirSync(destino, { recursive: true })
  for (const rel of arquivosDoKit()) {
    const de = join(KIT, rel)
    const para = join(destino, rel)
    mkdirSync(dirname(para), { recursive: true })
    cpSync(de, para)
  }
  const manifesto = montarManifesto(versao)
  writeFileSync(join(destino, 'kit.json'), `${JSON.stringify(manifesto, null, 2)}\n`, 'utf8')
  return Object.keys(manifesto.arquivos).length
}

function escreverSeFaltar (caminho, conteudo, aviso, oQue, escrever = true, modelo = null) {
  if (existsSync(caminho)) {
    aviso(`  ·  ${oQue} já existe, e não foi tocado`)
    return false
  }
  if (!escrever) { // criar arquivo fora do kit: só na instalação nova
    // ⚠️ O conselho aponta o ARQUIVO do modelo, e só ele. "Rode sem
    // --atualizar" não cria nada (o kit já está atual), e o --forcar escreve no
    // .gitignore e no package.json, fora da pasta do kit.
    aviso(`  !  ${oQue} não existe, e o --atualizar não cria nada fora da pasta do kit: crie à mão a partir de ${modelo ?? TEMPLATES}`)
    return false
  }
  mkdirSync(dirname(caminho), { recursive: true })
  writeFileSync(caminho, conteudo, 'utf8')
  aviso(`  +  ${oQue}`)
  return true
}

/**
 * O que falta fora da pasta do kit, dito com a linha exata. Na atualização o
 * instalador não escreve ali: o combinado é tocar só na pasta do kit, nunca no
 * .gitignore nem no package.json do projeto.
 */
function avisarFalta (aviso, arquivo, faltam, lugar, repetir = []) {
  // A linha que o projeto já tem e precisa ser escrita DE NOVO (a negação do
  // .gitignore) vem numa segunda frase, com o porquê: contada como "faltando",
  // quem a visse no arquivo a pularia.
  const deNovo = repetir.length > 0 ? `; e escreva de novo, depois delas, porque no .gitignore a última regra vence: ${repetir.join(' · ')}` : ''
  aviso(`  !  ${arquivo}: faltam ${faltam.length} linha(s) que o kit usa, e o --atualizar não mexe fora de ${lugar}/. Acrescente à mão: ${faltam.join(' · ')}${deNovo}`)
}

/**
 * 🚨 O kit se guarda em LF. Sem isto, o git com `core.autocrlf=true` escreve
 * CRLF no disco do Windows, e o manifesto por conteúdo acusa todo checkout
 * noutro sistema, com o conteúdo idêntico.
 */
function acrescentarGitattributes (alvo, aviso, lugar, escrever = true) {
  const caminho = join(alvo, '.gitattributes')
  const modelo = noLugar(readFileSync(join(TEMPLATES, 'gitattributes.txt'), 'utf8'), lugar)
  const linhas = modelo.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
  const atual = existsSync(caminho) ? readFileSync(caminho, 'utf8') : ''
  const jaTem = atual.split('\n').map((x) => x.trim())
  const faltam = linhas.filter((l) => !jaTem.includes(l))
  if (faltam.length === 0) {
    aviso('  ·  .gitattributes já guarda o kit em LF')
    return
  }
  if (!escrever) return avisarFalta(aviso, '.gitattributes', faltam, lugar)
  const abre = atual === '' || atual.endsWith('\n') ? '' : '\n'
  const bloco = `${abre}# o kit da fábrica se guarda em LF, sempre\n${faltam.join('\n')}\n`
  writeFileSync(caminho, atual + bloco, 'utf8')
  aviso(`  +  .gitattributes: ${faltam.length} linha(s)`)
}

function acrescentarGitignore (alvo, aviso, lugar, escrever = true) {
  const caminho = join(alvo, '.gitignore')
  const modelo = noLugar(readFileSync(join(TEMPLATES, 'gitignore.txt'), 'utf8'), lugar)
  // Cada linha do modelo com o bloco dela: linha em branco ou comentário
  // separa um bloco do seguinte.
  const entradas = []
  let doBloco = 0
  for (const bruta of modelo.split('\n')) {
    const l = bruta.trim()
    if (!l || l.startsWith('#')) {
      if (entradas.length > 0 && entradas[entradas.length - 1].bloco === doBloco) doBloco += 1
      continue
    }
    entradas.push({ linha: l, bloco: doBloco })
  }
  const atual = existsSync(caminho) ? readFileSync(caminho, 'utf8') : ''
  const jaTem = atual.split('\n').map((x) => x.trim())
  const faltam = entradas.filter((e) => !jaTem.includes(e.linha))
  if (faltam.length === 0) {
    aviso('  ·  .gitignore já cobre o que o kit precisa')
    return
  }
  // 🚨 No .gitignore a ÚLTIMA regra vence. Uma negação do modelo (`!x`) que o
  // projeto já tinha, e que no MESMO BLOCO do modelo vem depois de uma linha que
  // falta, é escrita de novo depois dela, ou a linha nova a anula: o `.env.*`
  // entraria depois do `!.env*.example`. Só no bloco dela: reescrever por causa
  // de um `coverage/` que falta desfaria um ignore que o projeto escreveu depois.
  const novas = entradas.filter((e, i) => faltam.includes(e) || (e.linha.startsWith('!') && faltam.some((f) => f.bloco === e.bloco && entradas.indexOf(f) < i))).map((e) => e.linha)
  // O aviso traz as MESMAS linhas que a instalação nova escreveria: quem o
  // segue ao pé da letra não pode trazer o defeito de volta.
  if (!escrever) { // o .gitignore do projeto: na atualização, só o aviso
    const faltando = faltam.map((e) => e.linha)
    return avisarFalta(aviso, '.gitignore', faltando, lugar, novas.filter((l) => !faltando.includes(l)))
  }
  // ⚠️ UM bloco só: se o cabeçalho já existe, as linhas novas entram sem outro,
  // ou o alvo teria dois `# kit da fábrica`, um da trilha Node e outro da Python.
  const cabecalho = atual.includes('# kit da fábrica') ? '' : '\n# kit da fábrica\n'
  const bloco = `${atual.endsWith('\n') || atual === '' ? '' : '\n'}${cabecalho}${novas.join('\n')}\n`
  writeFileSync(caminho, atual + bloco, 'utf8')
  aviso(`  +  .gitignore: ${novas.length} linha(s)`)
}

function acrescentarScripts (alvo, aviso, lugar, escrever = true) {
  const caminho = join(alvo, 'package.json')
  if (!existsSync(caminho)) return
  let pkg
  try { pkg = JSON.parse(readFileSync(caminho, 'utf8')) } catch { return }
  pkg.scripts = pkg.scripts ?? {}
  const faltam = [['portao', `node ${lugar}/portao.mjs`], ['mutar', `node ${lugar}/mutar.mjs`]].filter(([nome]) => !pkg.scripts[nome])
  if (faltam.length > 0 && !escrever) return avisarFalta(aviso, 'package.json', faltam.map(([nome, cmd]) => `"${nome}": "${cmd}"`), lugar)
  let mudou = false
  for (const [nome, cmd] of faltam) { pkg.scripts[nome] = cmd; mudou = true }
  if (mudou) {
    writeFileSync(caminho, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8')
    aviso('  +  package.json: scripts "portao" e "mutar"')
  }
}

export function instalar (alvo, { stack = null, forcar = false, atualizar = false, pasta: pedida = null, aviso = console.log } = {}) {
  if (!existsSync(alvo)) {
    aviso(`✗ o alvo ${alvo} não existe`)
    return 1
  }
  const { lugar, erro } = lugarDoKit(alvo, pedida)
  if (erro) {
    aviso(`✗ ${erro}`)
    return 1
  }

  const escolhida = stack ?? detectarStack(alvo, lugar)
  if (!escolhida) {
    aviso(`✗ não sei qual é a stack de ${alvo}: não achei package.json nem pyproject.toml/requirements.txt`)
    aviso('  passe --stack node ou --stack python')
    return 1
  }

  // As recusas vêm ANTES de qualquer cópia.
  if (escolhida === 'python' && !conferirPython(alvo, aviso)) return 1
  if (!conferirConstituicao(alvo, aviso)) return 1

  const pasta = join(alvo, lugar)
  if (existsSync(pasta) && !atualizar && !forcar) {
    const d = derivaDe(alvo, lugar)
    if (d.limpo) {
      aviso('  ·  o kit já está atual aqui, byte a byte. Nada a fazer.')
      return 0
    }
    if (d.diferentes.length > 0 && !forcar) {
      aviso('✗ o kit deste alvo foi EDITADO à mão:')
      for (const f of d.diferentes) aviso(`    ${f}`)
      aviso(`  o ajuste do projeto mora em ${lugar}/stack.mjs.`)
      aviso('  para sobrescrever mesmo assim: --forcar')
      return 1
    }
  }

  const versaoFonte = (() => {
    try { return JSON.parse(readFileSync(join(KIT, 'kit.json'), 'utf8')).versao } catch { return '1.0.0' }
  })()

  const quantos = copiarKit(alvo, versaoFonte, lugar)
  aviso(`  +  ${lugar}/: ${quantos} arquivo(s) do kit, versão ${versaoFonte}`)

  // A data dos pisos e da constituição é a da instalação: o piso é medido no dia.
  const hoje = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date())
  const modeloStack = readFileSync(join(TEMPLATES, `stack.${escolhida}.mjs`), 'utf8').split('[DATA]').join(hoje)
  escreverSeFaltar(join(pasta, 'stack.mjs'), noLugar(modeloStack, lugar), aviso, `${lugar}/stack.mjs`)

  const modeloConst = readFileSync(join(TEMPLATES, 'constituicao-modelo.md'), 'utf8')
    .split('[DATA]').join(hoje)
    .split('[PROJETO]').join(alvo.split(/[\\/]/).filter(Boolean).pop())
  // ⚠️ Na atualização, nada fora da pasta do kit se escreve: o que faltar vira
  // aviso.
  const escrever = !atualizar
  escreverSeFaltar(join(alvo, 'specs', 'constitution.md'), modeloConst, aviso, 'specs/constitution.md', escrever, join(TEMPLATES, 'constituicao-modelo.md'))

  // 🚨 O GitHub Actions só lê `.github/workflows/` da RAIZ do repositório.
  // Instalado numa SUBPASTA, o arquivo fica lá parecendo CI e não roda nunca. Verde por
  // ausência é o que o princípio VI proíbe, e um workflow que ninguém roda é
  // pior que nenhum, porque ele parece cobertura.
  // ⚠️ A pergunta NÃO é "o alvo tem .git?": alvo sem repositório nenhum é
  // legítimo (o fixture do teste da fábrica é assim, e um projeto novo também).
  // A pergunta é se existe um repositório ACIMA dele, porque aí o alvo é
  // subpasta e o workflow ficaria fora do alcance do Actions. E alvo com `.git`
  // PRÓPRIO dentro de outro repositório é raiz dele (ver `raizDeRepoAcima`).
  const ciProprio = workflowsDe(alvo).filter((nome) => nome !== 'portao.yml')
  if (ciProprio.length > 0) {
    // ⚠️ Repositório que já tem CI não ganha um segundo: o portão do projeto
    // chama o do kit como UM passo, e dois workflows rodariam a mesma coisa
    // duas vezes (ou pior, divergiriam).
    aviso([
      `este repositório já tem CI próprio (${ciProprio.join(', ')}), então o workflow do kit não foi escrito.`,
      `Ponha \`node ${lugar}/portao.mjs\` como um passo do portão que esse CI já roda.`
    ].join(' '))
  } else if (!raizDeRepoAcima(alvo)) {
    const modeloCi = noLugar(readFileSync(join(TEMPLATES, 'workflow.yml'), 'utf8'), lugar)
    escreverSeFaltar(join(alvo, '.github', 'workflows', 'portao.yml'), modeloCi, aviso, '.github/workflows/portao.yml', escrever, join(TEMPLATES, 'workflow.yml'))
  } else {
    aviso([
      'este alvo é SUBPASTA de um repositório git, então o workflow não foi escrito.',
      'O GitHub Actions só lê .github/workflows/ da raiz, e um arquivo aqui não rodaria nunca.',
      'Acrescente um JOB ao workflow da raiz, com `defaults.run.working-directory` apontando para cá.',
      `O modelo está em ${join(TEMPLATES, 'workflow.yml')}.`
    ].join(' '))
  }

  acrescentarGitattributes(alvo, aviso, lugar, escrever)
  acrescentarGitignore(alvo, aviso, lugar, escrever)
  if (escolhida === 'node') acrescentarScripts(alvo, aviso, lugar, escrever)

  aviso('')
  aviso(`✅ kit instalado em ${alvo} (stack ${escolhida}).`)
  aviso(`   confira com: node ${lugar}/portao.mjs --listar`)
  return 0
}

function principal () {
  const args = process.argv.slice(2)
  const pega = (bandeira) => {
    const i = args.indexOf(bandeira)
    return i !== -1 ? args[i + 1] : null
  }

  const conferir = pega('--conferir')
  if (conferir) {
    const d = derivaDe(resolve(conferir))
    for (const f of d.diferentes) console.log(`  ✗ ${f}: difere da fonte`)
    for (const f of d.faltando) console.log(`  ✗ ${f}: faltando no alvo`)
    for (const f of d.intrusos) console.log(`  ✗ ${f}: está no alvo e não é do kit`)
    console.log(d.limpo ? '✅ sem deriva: o kit do alvo é o da fonte.' : '✗ o kit do alvo divergiu da fonte.')
    process.exit(d.limpo ? 0 : 1)
    return
  }

  const atualizar = pega('--atualizar')
  const alvo = pega('--alvo') ?? atualizar
  if (!alvo) {
    console.error('uso: instalar.mjs --alvo <dir> [--stack node|python] [--pasta .claude/fabrica] [--forcar]')
    console.error('     instalar.mjs --conferir <dir>')
    console.error('     instalar.mjs --atualizar <dir>')
    process.exit(2)
    return
  }

  process.exit(instalar(resolve(alvo), {
    stack: pega('--stack'),
    forcar: args.includes('--forcar'),
    atualizar: Boolean(atualizar),
    pasta: pega('--pasta')
  }))
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  principal()
}
