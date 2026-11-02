// node --test .claude/skills/fabrica/scripts/testes/teste-bancada.mjs
//
// Classe de defeito: o ensaio do kit que bate na bancada de outra sessão.
// Ensaiar um kit novo no próprio projeto é ensaiar na árvore onde outra sessão
// pode estar trabalhando e rodando testes de banco, com o CI do GitHub de única
// prova fora dela.
//
// A bancada clona a casa e os projetos a partir do COMMIT, tira o remoto de
// todas as cópias, instala o kit, roda os portões e escreve o relatório. Nada
// escreve no projeto real, e nada sai para a rede.
//
// ⚠️ Os casos montam uma casa falsa com a própria skill e um projeto de
// fixture dentro dela, na mesma posição relativa (`projetos-pessoais/x`), que é
// o que deixa o conferidor `kit` achar a fonte subindo as pastas.
// mutação: scripts/bancada.mjs · "      monta(`tirar o remoto de ${alvo.posicao}`, git(copia, 'remote', 'remove', 'origin'))" → "      monta(`tirar o remoto de ${alvo.posicao}`, git(copia, 'remote'))" · pega
// mutação: scripts/bancada.mjs · "    monta('tirar o remoto da casa', git(copiaCasa, 'remote', 'remove', 'origin'))" → "    monta('tirar o remoto da casa', git(copiaCasa, 'remote'))" · pega
// mutação: scripts/bancada.mjs · "  if (existsSync(destino)) return uso(" → "  if (false) return uso(" · pega
// mutação: scripts/bancada.mjs · "  if (dentro(destino, casa) || dentro(destino, origem)) return uso(" → "  if (false) return uso(" · pega
// mutação: scripts/bancada.mjs · "    if (!dono) return uso(" → "    if (false) return uso(" · pega
// mutação: scripts/bancada.mjs · "      const inst = executar('node', [join(copiaCasa, '.claude', 'skills', 'fabrica', 'scripts', 'instalar.mjs'), '--atualizar', pasta], { cwd: pasta })" → "      const inst = { saiu: 0, saida: '' }" · pega
// mutação: scripts/bancada.mjs · "    .split('\n').map((l) => l.trim()).filter((l) => l && l.split('/').length <= 2)" → "    .split('\n').map((l) => l.trim()).filter((l) => l && l.split('/').length <= 1)" · pega
// mutação: scripts/bancada.mjs · "  return limpa.split('/').some((p) => p === '..' || p === '') ? null : limpa" → "  return limpa.split('/').some((p) => p === '') ? null : limpa" · pega
// mutação: scripts/bancada.mjs · "    if (comKit.length === 0) {" → "    if (false) {" · pega
// mutação: scripts/bancada.mjs · "  if (dados.stacksSemPouso.length > 0) dados.resultado = 'vermelho'" → "  if (false) dados.resultado = 'vermelho'" · pega
// mutação: scripts/bancada.mjs · "    const posicao = posicaoValida(bruta)" → "    const posicao = bruta" · pega
// mutação: scripts/bancada.mjs · "        cpSync(resolve(stack), join(pasta, lugar, 'stack.mjs'))" → "        void 0" · pega
// mutação: scripts/bancada.mjs · "  const remotosDe = (pasta) => git(pasta, 'remote').saida.trim()" → "  const remotosDe = (pasta) => ''" · pega
// mutação: scripts/bancada.mjs · "    if (stacks[posicao]) return uso(" → "    if (false) return uso(" · pega
// mutação: scripts/bancada.mjs · "    if (posicao.split('/').some((p) => p.toLowerCase() === '.git')) return uso(" → "    if (posicao.split('/').some((p) => p === '.git')) return uso(" · pega
// mutação: scripts/bancada.mjs · "      const avisosDoInstalador = inst.saida.split('\n').filter((l) => /^\s*!\s/.test(l)).map((l) => l.trim().replace(/^!\s*/, ''))" → "      const avisosDoInstalador = []" · pega

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { criar, apagar } from '../../kit/lib/temporaria.mjs'
import { rodar } from '../../kit/lib/runner.mjs'
import { instalar } from '../instalar.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const SKILL = resolve(AQUI, '..', '..')
const BANCADA = join(SKILL, 'scripts', 'bancada.mjs').split('\\').join('/')
const barra = (c) => c.split('\\').join('/')

function git (cwd, args) {
  return rodar(`git -c user.name=fabrica -c user.email=f@f ${args}`, { cwd, tempoMaximo: 60000 })
}

function comGit (raiz) {
  git(raiz, 'init -q')
  git(raiz, 'add -A')
  git(raiz, 'commit -q -m fixture --no-verify')
}

/** Uma casa falsa com a skill da fábrica, e um projeto de fixture dentro dela, os dois commitados. */
function montar () {
  const base = criar('fabrica-bancada-')
  const casa = join(base, 'casa')
  mkdirSync(join(casa, '.claude', 'skills'), { recursive: true })
  cpSync(SKILL, join(casa, '.claude', 'skills', 'fabrica'), { recursive: true })
  writeFileSync(join(casa, '.gitignore'), 'projetos-pessoais/\nclientes/\n')
  comGit(casa)

  const alvo = join(casa, 'projetos-pessoais', 'x')
  cpSync(join(SKILL, 'fixtures', 'node-minimo'), alvo, { recursive: true })
  instalar(alvo, { aviso: () => {} })
  cpSync(join(alvo, 'fabrica-stack-esperado.mjs'), join(alvo, 'fabrica', 'stack.mjs'))
  comGit(alvo)
  return { base, casa, alvo, destino: join(base, 'bancada') }
}

function bancada (m, resto = '') {
  return rodar(`node "${BANCADA}" --casa "${barra(m.casa)}" --destino "${barra(m.destino)}" ${resto}`, { tempoMaximo: 600000 })
}

const relatorio = (m) => JSON.parse(readFileSync(join(m.destino, 'bancada.json'), 'utf8'))

test('ensaio verde: clona do commit, sem remoto, instala o kit, o portão fecha, e o projeto real não muda', () => {
  const m = montar()
  try {
    // O projeto real está num kit velho: a cópia tem de sair na versão da casa.
    const manifesto = join(m.alvo, 'fabrica', 'kit.json')
    writeFileSync(manifesto, readFileSync(manifesto, 'utf8').replace(/"versao": "[^"]+"/, '"versao": "0.9.0"'))
    git(m.alvo, 'commit -qam "kit velho" --no-verify')
    const daCasa = JSON.parse(readFileSync(join(SKILL, 'kit', 'kit.json'), 'utf8')).versao

    // Mudança não commitada no projeto real: a bancada ensaia o commit, não ela.
    writeFileSync(join(m.alvo, 'sujo.txt'), 'não commitado\n')
    mkdirSync(join(m.alvo, 'coverage'), { recursive: true })
    writeFileSync(join(m.alvo, 'coverage', 'trazido.txt'), 'artefato\n')
    const antes = { status: git(m.alvo, 'status --porcelain --untracked-files=all').saida, kit: readFileSync(join(m.alvo, 'fabrica', 'kit.json'), 'utf8'), head: git(m.alvo, 'rev-parse HEAD').saida }

    const r = bancada(m, '--alvo projetos-pessoais/x --trazer projetos-pessoais/x/coverage/trazido.txt')
    assert.equal(r.saiu, 0, r.saida)

    const copia = join(m.destino, 'casa', 'projetos-pessoais', 'x')
    assert.equal(JSON.parse(readFileSync(join(copia, 'fabrica', 'kit.json'), 'utf8')).versao, daCasa, 'a cópia não foi atualizada para o kit da casa')
    assert.ok(!existsSync(join(copia, 'sujo.txt')), 'a cópia levou o que não estava commitado')
    assert.ok(existsSync(join(copia, 'coverage', 'trazido.txt')), 'o --trazer não copiou o artefato')
    assert.equal(git(copia, 'remote').saida.trim(), '', 'a cópia do projeto ficou com remoto')
    assert.equal(git(join(m.destino, 'casa'), 'remote').saida.trim(), '', 'a cópia da casa ficou com remoto')

    const j = relatorio(m)
    const x = j.alvos.find((a) => a.posicao === 'projetos-pessoais/x')
    assert.equal(x.portao, 'verde', JSON.stringify(x))
    assert.equal(x.naoCommitado, true, 'o relatório não disse que a árvore real tinha mudança fora do commit')
    assert.match(readFileSync(join(m.destino, 'BANCADA.md'), 'utf8'), /projetos-pessoais\/x/)

    const depois = { status: git(m.alvo, 'status --porcelain --untracked-files=all').saida, kit: readFileSync(join(m.alvo, 'fabrica', 'kit.json'), 'utf8'), head: git(m.alvo, 'rev-parse HEAD').saida }
    assert.deepEqual(depois, antes, 'o projeto real mudou')
  } finally { apagar(m.base) }
})

test('o stack ensaiado entra na cópia: um passo que falha deixa a bancada vermelha, com o nome dele', () => {
  const m = montar()
  try {
    const esperado = readFileSync(join(m.alvo, 'fabrica', 'stack.mjs'), 'utf8')
    const plantado = esperado.replace('export const PASSOS = [', "export const PASSOS = [\n  { nome: 'plantado', cmd: 'node -e \"process.exit(1)\"', onde: 'todos' },")
    assert.notEqual(plantado, esperado, 'o fixture mudou: a âncora do PASSOS sumiu')
    const arquivo = join(m.base, 'stack-ensaiado.mjs')
    writeFileSync(arquivo, plantado)

    const r = bancada(m, `--alvo projetos-pessoais/x --stack "projetos-pessoais/x=${barra(arquivo)}"`)
    assert.equal(r.saiu, 1, r.saida)
    const x = relatorio(m).alvos.find((a) => a.posicao === 'projetos-pessoais/x')
    assert.equal(x.portao, 'vermelho')
    assert.ok(x.vermelhos.includes('plantado'), JSON.stringify(x))
    assert.equal(readFileSync(join(m.alvo, 'fabrica', 'stack.mjs'), 'utf8'), esperado, 'o stack do projeto real mudou')
  } finally { apagar(m.base) }
})

// 🚨 Instalando e rodando o portão pasta por pasta, o portão da trilha Node roda
// com a pasta `python/` ainda no kit velho: o `segredos` novo acusa a chave
// falsa literal das provas velhas de lá, e a bancada dá vermelho onde o pouso
// real (as duas trilhas no mesmo commit) daria verde. A ordem certa é a do
// cabeçalho dela: instala em todas, e só depois roda os portões.
test('com kit na raiz e numa subpasta, os dois são atualizados antes de o primeiro portão rodar', () => {
  const m = montar()
  try {
    const sub = join(m.alvo, 'sub')
    cpSync(join(SKILL, 'fixtures', 'node-minimo'), sub, { recursive: true })
    instalar(sub, { aviso: () => {} })
    cpSync(join(sub, 'fabrica-stack-esperado.mjs'), join(sub, 'fabrica', 'stack.mjs'))
    const manifesto = join(sub, 'fabrica', 'kit.json')
    writeFileSync(manifesto, readFileSync(manifesto, 'utf8').replace(/"versao": "[^"]+"/, '"versao": "0.9.0"'))
    git(m.alvo, 'add -A')
    git(m.alvo, 'commit -qm "kit na subpasta, velho" --no-verify')

    // O portão da RAIZ confere a versão do kit da SUBPASTA: só passa se a
    // subpasta já foi atualizada quando ele roda.
    const daCasa = JSON.parse(readFileSync(join(SKILL, 'kit', 'kit.json'), 'utf8')).versao
    const esperado = readFileSync(join(m.alvo, 'fabrica', 'stack.mjs'), 'utf8')
    const confere = `node -e "process.exit(require('./sub/fabrica/kit.json').versao === '${daCasa}' ? 0 : 1)"`
    const plantado = esperado.replace('export const PASSOS = [', `export const PASSOS = [\n  { nome: 'sub-atualizada', cmd: ${JSON.stringify(confere)}, onde: 'todos' },`)
    assert.notEqual(plantado, esperado, 'o fixture mudou: a âncora do PASSOS sumiu')
    const arquivo = join(m.base, 'stack-raiz.mjs')
    writeFileSync(arquivo, plantado)

    const r = bancada(m, `--alvo projetos-pessoais/x --stack "projetos-pessoais/x=${barra(arquivo)}"`)
    const x = relatorio(m).alvos.find((a) => a.posicao === 'projetos-pessoais/x')
    assert.ok(!x.vermelhos.includes('sub-atualizada'), `o portão da raiz rodou com a subpasta no kit velho: ${JSON.stringify(x)}`)
    assert.equal(r.saiu, 0, r.saida)
  } finally { apagar(m.base) }
})

test('as dependências se instalam offline também um nível abaixo da raiz (o scripts/ da casa)', () => {
  // A casa tem o lock em scripts/, não na raiz: sem instalar lá, o conferidor
  // `dependencias` da cópia da casa diria "nada foi medido".
  const m = montar()
  try {
    mkdirSync(join(m.alvo, 'ferramenta'))
    writeFileSync(join(m.alvo, 'ferramenta', 'package.json'), '{ "name": "ferramenta", "version": "1.0.0", "private": true }\n')
    writeFileSync(join(m.alvo, 'ferramenta', 'package-lock.json'), '{ "name": "ferramenta", "version": "1.0.0", "lockfileVersion": 3, "requires": true, "packages": { "": { "name": "ferramenta", "version": "1.0.0" } } }\n')
    git(m.alvo, 'add -A')
    git(m.alvo, 'commit -qm ferramenta --no-verify')

    const r = bancada(m, '--alvo projetos-pessoais/x')
    assert.equal(r.saiu, 0, r.saida)
    const x = relatorio(m).alvos.find((a) => a.posicao === 'projetos-pessoais/x')
    assert.match(String(x.dependencias), /ferramenta: npm ci offline: ok/, JSON.stringify(x))
  } finally { apagar(m.base) }
})

// ───────────────────────────── o alvo fora da casa, o alvo sem kit e o --stack

test('alvo com .. que É repositório continua sendo uso errado, e nada é escrito', () => {
  // Com a pasta de fora inexistente, a recusa viria do existsSync e o caso
  // passaria sem a guarda: aqui ela existe e é repositório.
  const m = montar()
  try {
    mkdirSync(join(m.base, 'fora'))
    writeFileSync(join(m.base, 'fora', 'a.txt'), 'x')
    comGit(join(m.base, 'fora'))
    const r = bancada(m, '--alvo ../fora')
    assert.equal(r.saiu, 2, r.saida)
    assert.match(r.saida, /alvo fora da casa/)
    assert.ok(!existsSync(m.destino), 'a bancada escreveu no destino')
  } finally { apagar(m.base) }
})

test('alvo sem kit não é verde: ele aparece no relatório como "sem kit", e a bancada sai 1', () => {
  // O alvo sem kit não pode sumir do relatório, ou a bancada sairia verde sem
  // ter rodado portão nenhum.
  const m = montar()
  try {
    const s = join(m.casa, 'projetos-pessoais', 'semkit')
    mkdirSync(s)
    writeFileSync(join(s, 'a.txt'), 'x')
    comGit(s)
    const r = bancada(m, '--alvo projetos-pessoais/semkit')
    assert.equal(r.saiu, 1, r.saida)
    const j = relatorio(m)
    const semkit = j.alvos.find((a) => a.posicao === 'projetos-pessoais/semkit')
    assert.equal(semkit?.portao, 'sem kit', JSON.stringify(j.alvos))
    assert.equal(j.resultado, 'vermelho')
  } finally { apagar(m.base) }
})

test('--stack que não pousa em pasta de kit é vermelho, e a chave com barra no fim pousa', () => {
  const m = montar()
  try {
    const esperado = readFileSync(join(m.alvo, 'fabrica', 'stack.mjs'), 'utf8')
    const plantado = esperado.replace('export const PASSOS = [', "export const PASSOS = [\n  { nome: 'plantado', cmd: 'node -e \"process.exit(1)\"', onde: 'todos' },")
    const arquivo = join(m.base, 'stack-ensaiado.mjs')
    writeFileSync(arquivo, plantado)

    // barra no fim: a chave se normaliza e o stack pousa (o passo plantado reprova)
    const r = bancada(m, `--alvo projetos-pessoais/x --stack "projetos-pessoais/x/=${barra(arquivo)}"`)
    assert.equal(r.saiu, 1, r.saida)
    assert.ok(relatorio(m).alvos.find((a) => a.posicao === 'projetos-pessoais/x').vermelhos.includes('plantado'))

    // subpasta sem kit: o stack não pousa, e isso é vermelho com a posição
    const m2 = { ...m, destino: join(m.base, 'bancada2') }
    const r2 = bancada(m2, `--alvo projetos-pessoais/x --stack "projetos-pessoais/x/python=${barra(arquivo)}"`)
    assert.equal(r2.saiu, 1, r2.saida)
    assert.match(JSON.stringify(relatorio(m2).stacksSemPouso), /projetos-pessoais\/x\/python/)
  } finally { apagar(m.base) }
})

test('--trazer de dentro do .git é uso errado: ele traria o remoto de volta à cópia', () => {
  const m = montar()
  try {
    const r = bancada(m, '--alvo projetos-pessoais/x --trazer projetos-pessoais/x/.git/config')
    assert.equal(r.saiu, 2, r.saida)
    assert.ok(!existsSync(m.destino))
  } finally { apagar(m.base) }
})

test('o "sem remoto" do relatório é medido em cada cópia, não escrito', () => {
  const m = montar()
  try {
    assert.equal(bancada(m, '--alvo projetos-pessoais/x').saiu, 0)
    const j = relatorio(m)
    assert.equal(j.casa.remotos, '', 'a cópia da casa não teve o remoto medido')
    assert.equal(j.alvos.find((a) => a.posicao === 'projetos-pessoais/x').remotos, '', 'a cópia do alvo não teve o remoto medido')
  } finally { apagar(m.base) }
})

// ───────────────────────────── o remoto que sobra, o --stack duplo e o .GIT

test('um remoto que sobra numa cópia é medido e deixa a bancada vermelha', () => {
  // Um caso que escreve o remoto à mão como '' passaria sem medir nada. Aqui
  // um remoto sobra de verdade (pela config do ambiente, que o git
  // aplica em toda cópia), e o relatório tem de dizer.
  const m = montar()
  try {
    const env = { ...process.env, GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'remote.vazado.url', GIT_CONFIG_VALUE_0: 'https://exemplo.invalid/x.git' }
    const r = rodar(`node "${BANCADA}" --casa "${barra(m.casa)}" --destino "${barra(m.destino)}" --alvo projetos-pessoais/x`, { tempoMaximo: 600000, env })
    assert.equal(r.saiu, 1, r.saida)
    const j = relatorio(m)
    assert.equal(j.casa.remotos, 'vazado')
    assert.equal(j.alvos.find((a) => a.posicao === 'projetos-pessoais/x').remotos, 'vazado')
    assert.match(readFileSync(join(m.destino, 'BANCADA.md'), 'utf8'), /REMOTO: vazado/)
  } finally { apagar(m.base) }
})

test('dois --stack para a mesma pasta são uso errado: um deles sumiria sem aviso', () => {
  // "x" e "x/" viram a mesma posição, e o primeiro arquivo seria descartado em
  // silêncio.
  const m = montar()
  try {
    const a = join(m.base, 'a.mjs')
    const b = join(m.base, 'b.mjs')
    writeFileSync(a, 'x')
    writeFileSync(b, 'x')
    const r = bancada(m, `--alvo projetos-pessoais/x --stack "projetos-pessoais/x=${barra(a)}" --stack "projetos-pessoais/x/=${barra(b)}"`)
    assert.equal(r.saiu, 2, r.saida)
    assert.match(r.saida, /mais de um --stack/)
    assert.ok(!existsSync(m.destino))
  } finally { apagar(m.base) }
})

test('--trazer de dentro do .GIT, em maiúsculas, também é recusado (o disco do Windows não diferencia)', () => {
  const m = montar()
  try {
    const r = bancada(m, '--alvo projetos-pessoais/x --trazer projetos-pessoais/x/.GIT/config')
    assert.equal(r.saiu, 2, r.saida)
    // ⚠️ A razão exata, e não só a saída 2: no Linux o `.GIT` nem existe, e sem
    // a guarda a recusa viria de "não existe", também com 2, e a mutação desta
    // guarda passaria no CI.
    assert.match(r.saida, /não copia nada de dentro do \.git/)
    assert.ok(!existsSync(m.destino))
  } finally { apagar(m.base) }
})

test('o que o instalador avisa que falta fora do kit aparece no relatório da bancada', () => {
  // O --atualizar só avisa o que falta no .gitignore do projeto, e a bancada
  // não pode jogar a saída dele fora.
  const m = montar()
  try {
    writeFileSync(join(m.alvo, '.gitignore'), 'node_modules/\n')
    git(m.alvo, 'commit -qam "gitignore sem o kit" --no-verify')
    const r = bancada(m, '--alvo projetos-pessoais/x')
    assert.equal(r.saiu, 0, r.saida)
    const x = relatorio(m).alvos.find((a) => a.posicao === 'projetos-pessoais/x')
    assert.ok((x.avisosDoInstalador ?? []).some((a) => a.includes('.gitignore')), JSON.stringify(x))
    assert.match(readFileSync(join(m.destino, 'BANCADA.md'), 'utf8'), /o instalador avisou[^\n]*\.gitignore/)
  } finally { apagar(m.base) }
})

test('destino que já existe é uso errado, e nada é escrito nele', () => {
  const m = montar()
  try {
    mkdirSync(m.destino)
    writeFileSync(join(m.destino, 'meu.txt'), 'x')
    const r = bancada(m, '--alvo projetos-pessoais/x')
    assert.equal(r.saiu, 2, r.saida)
    assert.match(r.saida, /já existe/)
    assert.ok(!existsSync(join(m.destino, 'casa')))
  } finally { apagar(m.base) }
})

test('destino dentro da casa é uso errado: a bancada fica fora da árvore de trabalho', () => {
  const m = montar()
  try {
    const r = rodar(`node "${BANCADA}" --casa "${barra(m.casa)}" --destino "${barra(join(m.casa, 'rascunho', 'b'))}" --alvo projetos-pessoais/x`, { tempoMaximo: 60000 })
    assert.equal(r.saiu, 2, r.saida)
    assert.match(r.saida, /fora/)
  } finally { apagar(m.base) }
})

test('alvo que não é repositório, ou que sobe para fora da casa, é uso errado', () => {
  const m = montar()
  try {
    mkdirSync(join(m.casa, 'projetos-pessoais', 'solto'))
    assert.equal(bancada(m, '--alvo projetos-pessoais/solto').saiu, 2)
    assert.equal(bancada(m, '--alvo ../fora').saiu, 2)
  } finally { apagar(m.base) }
})

test('--trazer fora de um alvo é uso errado: a bancada só copia artefato de projeto ensaiado', () => {
  const m = montar()
  try {
    const r = bancada(m, '--alvo projetos-pessoais/x --trazer .gitignore')
    assert.equal(r.saiu, 2, r.saida)
  } finally { apagar(m.base) }
})
