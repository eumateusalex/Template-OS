// node --test .claude/skills/fabrica/scripts/testes/teste-instalar.mjs
//
// Classe de defeito: o instalador que escreve no projeto fora da pasta do kit:
// o `--atualizar` que acrescenta `.env` e `.env.*` ao `.gitignore` e um script
// `mutar` ao `package.json`, quando o combinado com o projeto é tocar só em
// `fabrica/`. E o `.env.*` que entra DEPOIS do
// `!.env*.example` que já está no arquivo: no .gitignore a última regra vence,
// e o arquivo de exemplo, que é versionado, passaria a ser ignorado.
//
// A régua: o `--atualizar` troca só a pasta do kit, e o que faltar fora dela
// vira aviso com a linha exata. Na instalação nova, uma negação do modelo que
// vem depois de uma linha que faltava é reescrita no fim, e o `git
// check-ignore` é quem mede.
// mutação: scripts/instalar.mjs · "  const escrever = !atualizar" → "  const escrever = true" · pega
// mutação: scripts/instalar.mjs · "  if (faltam.length > 0 && !escrever) return avisarFalta(" → "  if (false) return avisarFalta(" · pega
// mutação: scripts/instalar.mjs · "  if (!escrever) return avisarFalta(aviso, '.gitattributes', faltam, lugar)" → "  if (false) return avisarFalta(aviso, '.gitattributes', faltam, lugar)" · pega
// mutação: scripts/instalar.mjs · "faltam.some((f) => f.bloco === e.bloco && entradas.indexOf(f) < i)" → "faltam.some((f) => entradas.indexOf(f) < i)" · pega
// mutação: scripts/instalar.mjs · "    return avisarFalta(aviso, '.gitignore', faltando, lugar, novas.filter((l) => !faltando.includes(l)))" → "    return avisarFalta(aviso, '.gitignore', novas, lugar)" · pega
// mutação: scripts/instalar.mjs · "crie à mão a partir de ${modelo ?? TEMPLATES}" → "crie à mão a partir do modelo em ${TEMPLATES}, ou rode a instalação com --forcar" · pega
// mutação: scripts/instalar.mjs · "  if (!escrever) { // criar arquivo fora do kit: só na instalação nova" → "  if (false) {" · pega
// mutação: scripts/instalar.mjs · "  if (!escrever) { // o .gitignore do projeto: na atualização, só o aviso" → "  if (false) {" · pega
// mutação: scripts/instalar.mjs · "mjs`), 'utf8').split('[DATA]').join(hoje)" → "mjs`), 'utf8')" · pega

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { appendFileSync, cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'

import { criar, apagar } from '../../kit/lib/temporaria.mjs'
import { instalar } from '../instalar.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const SKILL = resolve(AQUI, '..', '..')

/** Um projeto Node com o kit já instalado e um .gitignore e um package.json próprios, sem as linhas do kit. */
function projetoComKit () {
  const raiz = criar('fabrica-instalar-')
  cpSync(join(SKILL, 'fixtures', 'node-minimo'), raiz, { recursive: true })
  instalar(raiz, { aviso: () => {} })
  writeFileSync(join(raiz, '.gitignore'), 'node_modules/\n')
  writeFileSync(join(raiz, 'package.json'), '{ "name": "x", "version": "1.0.0", "scripts": { "test": "node --test" } }\n')
  return raiz
}

test('--atualizar não escreve no .gitignore, no package.json nem no .gitattributes, e diz o que falta', () => {
  const raiz = projetoComKit()
  try {
    const antes = {
      gitignore: readFileSync(join(raiz, '.gitignore'), 'utf8'),
      pkg: readFileSync(join(raiz, 'package.json'), 'utf8')
    }
    writeFileSync(join(raiz, '.gitattributes'), '')
    const avisos = []
    const saiu = instalar(raiz, { atualizar: true, aviso: (l) => avisos.push(String(l)) })
    assert.equal(saiu, 0, avisos.join('\n'))
    assert.equal(readFileSync(join(raiz, '.gitignore'), 'utf8'), antes.gitignore, 'o --atualizar escreveu no .gitignore')
    assert.equal(readFileSync(join(raiz, 'package.json'), 'utf8'), antes.pkg, 'o --atualizar escreveu no package.json')
    assert.equal(readFileSync(join(raiz, '.gitattributes'), 'utf8'), '', 'o --atualizar escreveu no .gitattributes')
    const texto = avisos.join('\n')
    assert.match(texto, /\.gitignore[^\n]*\.env\.\*/, 'o aviso não disse a linha que falta no .gitignore')
    assert.match(texto, /package\.json[^\n]*mutar/, 'o aviso não disse o script que falta')
    // O aviso do .gitattributes também se mede.
    assert.match(texto, /\.gitattributes[^\n]*fabrica\/\*\* text eol=lf/, 'o aviso não disse a linha que falta no .gitattributes')
  } finally { apagar(raiz) }
})

test('--atualizar não cria a constituição nem o workflow que o projeto não tem, e avisa', () => {
  const raiz = projetoComKit()
  try {
    const constituicao = join(raiz, 'specs', 'constitution.md')
    const workflow = join(raiz, '.github', 'workflows', 'portao.yml')
    // um projeto que apagou os dois, de propósito ou não
    rmSync(constituicao, { force: true })
    rmSync(workflow, { force: true })
    assert.ok(!existsSync(constituicao) && !existsSync(workflow), 'a montagem do caso não apagou os dois')
    const avisos = []
    instalar(raiz, { atualizar: true, aviso: (l) => avisos.push(String(l)) })
    assert.ok(!existsSync(constituicao), 'o --atualizar criou a constituição')
    assert.ok(!existsSync(workflow), 'o --atualizar criou o workflow')
    // "Rode sem --atualizar" não cria nada, porque o kit já está atual. O
    // aviso tem de apontar o caminho que funciona.
    const texto = avisos.join('\n')
    assert.match(texto, /constitution\.md não existe[^\n]*constituicao-modelo\.md/)
    assert.match(texto, /portao\.yml não existe[^\n]*workflow\.yml/)
    // O --forcar escreve fora do kit, e seguir esse conselho traria de volta
    // o defeito deste arquivo.
    assert.doesNotMatch(texto, /com --forcar/)
  } finally { apagar(raiz) }
})

test('instalação nova: a negação do modelo volta depois da linha que faltava, e o git concorda', () => {
  // O `!.env*.example` já está no .gitignore, e o `.env.*` entraria depois
  // dele. Quem decide o que o git ignora é o próprio git.
  const raiz = criar('fabrica-instalar-')
  try {
    cpSync(join(SKILL, 'fixtures', 'node-minimo'), raiz, { recursive: true })
    writeFileSync(join(raiz, '.gitignore'), 'node_modules/\n!.env*.example\n')
    instalar(raiz, { aviso: () => {} })
    spawnSync('git', ['init', '-q'], { cwd: raiz })
    const ignora = (arquivo) => spawnSync('git', ['check-ignore', '-q', arquivo], { cwd: raiz }).status === 0
    assert.equal(ignora('.env.example'), false, `o .env.example ficou ignorado:\n${readFileSync(join(raiz, '.gitignore'), 'utf8')}`)
    assert.equal(ignora('.env.local'), true, 'o .env.local não ficou ignorado')
    assert.equal(ignora('.env'), true, 'o .env não ficou ignorado')
  } finally { apagar(raiz) }
})

// ───────────────────────────── o aviso que se segue ao pé da letra, e o bloco da negação

test('--atualizar: seguir o aviso do .gitignore ao pé da letra não ignora o .env.example', () => {
  // Com a negação já presente e o .env.* não, um aviso que pede só
  // ".env · .env.*" faria quem o seguisse ignorar o exemplo.
  const raiz = projetoComKit()
  try {
    writeFileSync(join(raiz, '.gitignore'), 'node_modules/\n!.env*.example\n')
    const avisos = []
    instalar(raiz, { atualizar: true, aviso: (l) => avisos.push(String(l)) })
    const linha = avisos.find((l) => l.includes('.gitignore:'))
    assert.ok(linha, avisos.join('\n'))
    // A negação que o projeto já tem vem numa segunda frase, dizendo por que se repete, e não conta como "faltando".
    assert.match(linha, /de novo[^\n]*última regra vence[^\n]*!\.env\*\.example/, linha)
    const [faltando, repetir] = linha.split('Acrescente à mão: ')[1].split('; e escreva de novo, depois delas, porque no .gitignore a última regra vence: ')
    assert.ok(!faltando.split(' · ').includes('!.env*.example'), `a negação que o projeto já tem contou como faltando: ${linha}`)
    assert.match(linha, new RegExp(`faltam ${faltando.split(' · ').length} linha`), linha)
    const pedidas = [...faltando.split(' · '), ...(repetir ?? '').split(' · ').filter(Boolean)]
    appendFileSync(join(raiz, '.gitignore'), `${pedidas.join('\n')}\n`)
    spawnSync('git', ['init', '-q'], { cwd: raiz })
    const ignora = (a) => spawnSync('git', ['check-ignore', '-q', a], { cwd: raiz }).status === 0
    assert.equal(ignora('.env.example'), false, `seguir o aviso ignorou o .env.example: ${pedidas.join(' · ')}`)
    assert.equal(ignora('.env.local'), true)
  } finally { apagar(raiz) }
})

test('instalação nova: a negação só volta quando falta linha do bloco DELA, e o *.example que o projeto ignorou continua ignorado', () => {
  // Faltando só o `coverage/`, a negação não pode ir para o fim: desfaria o
  // ignore que o projeto escreveu depois dela.
  const raiz = criar('fabrica-instalar-')
  try {
    cpSync(join(SKILL, 'fixtures', 'node-minimo'), raiz, { recursive: true })
    writeFileSync(join(raiz, '.gitignore'), '.env\n.env.*\n!.env*.example\n.env.prod.example\n')
    instalar(raiz, { aviso: () => {} })
    spawnSync('git', ['init', '-q'], { cwd: raiz })
    const ignora = (a) => spawnSync('git', ['check-ignore', '-q', a], { cwd: raiz }).status === 0
    assert.equal(ignora('.env.prod.example'), true, `o *.example que o projeto ignorou passou a ser versionado:\n${readFileSync(join(raiz, '.gitignore'), 'utf8')}`)
    assert.equal(ignora('.env.example'), false)
    assert.equal(ignora('.env'), true)
  } finally { apagar(raiz) }
})

// A forma da spec é cobrada a partir de `SPECS.modeloDesde`, e
// projeto novo não tem spec de antes do modelo: nasce cobrado desde a 001.
// ⚠️ O Python se lê no modelo: instalar a trilha Python pede um `.venv`, e
// quem prova essa instalação é o P1b do teste do kit.
test('instalação nova: o stack.mjs nasce com SPECS.modeloDesde 001, e o modelo Python também', async () => {
  const raiz = criar('fabrica-instalar-')
  try {
    cpSync(join(SKILL, 'fixtures', 'node-minimo'), raiz, { recursive: true })
    assert.equal(instalar(raiz, { aviso: () => {} }), 0)
    const node = await import(pathToFileURL(join(raiz, 'fabrica', 'stack.mjs')).href)
    assert.equal(node.SPECS?.modeloDesde, '001', `node: SPECS = ${JSON.stringify(node.SPECS)}`)
  } finally { apagar(raiz) }
  const python = await import(pathToFileURL(join(SKILL, 'templates', 'stack.python.mjs')).href)
  assert.equal(python.SPECS?.modeloDesde, '001', `python: SPECS = ${JSON.stringify(python.SPECS)}`)
})

// O piso é medido no dia: o stack.mjs recém-instalado traz a data da
// instalação ao lado de cada piso, nunca o marcador do modelo.
test('instalação nova: os pisos do stack.mjs levam a data da instalação', () => {
  const raiz = criar('fabrica-instalar-')
  try {
    cpSync(join(SKILL, 'fixtures', 'node-minimo'), raiz, { recursive: true })
    assert.equal(instalar(raiz, { aviso: () => {} }), 0)
    const stack = readFileSync(join(raiz, 'fabrica', 'stack.mjs'), 'utf8')
    const hoje = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date())
    assert.ok(!stack.includes('[DATA]'), 'o stack.mjs ficou com o marcador [DATA]')
    assert.ok(stack.includes(`cobertura: 0, // ${hoje}`), `o piso de cobertura não traz a data de hoje (${hoje})`)
  } finally { apagar(raiz) }
})

test('instalação nova continua escrevendo o .gitignore e os scripts', () => {
  const raiz = criar('fabrica-instalar-')
  try {
    cpSync(join(SKILL, 'fixtures', 'node-minimo'), raiz, { recursive: true })
    instalar(raiz, { aviso: () => {} })
    assert.match(readFileSync(join(raiz, '.gitignore'), 'utf8'), /^\.env\.\*$/m)
    assert.equal(JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8')).scripts.mutar, 'node fabrica/mutar.mjs')
  } finally { apagar(raiz) }
})
