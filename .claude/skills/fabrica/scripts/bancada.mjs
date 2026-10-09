#!/usr/bin/env node
// node .claude/skills/fabrica/scripts/bancada.mjs --destino <dir> --alvo <posição>... [--casa <dir>] [--origem <dir>] [--ref <ref>]
//        [--stack <posição>=<arquivo>]... [--trazer <posição do arquivo ou pasta>]...
//
// O ensaio do kit num lugar separado e offline, antes de ele pousar nos
// projetos de verdade. No próprio projeto, outra sessão pode estar rodando
// testes contra a bancada de banco, e o ensaio bateria nela.
//
// O que ela faz, nesta ordem:
//   1. clona a casa (`--casa`, padrão: o repositório desta skill) no `--ref`,
//      numa pasta NOVA fora dela, e tira o remoto
//   2. clona cada `--alvo` (a posição dele na casa, como `projetos-pessoais/x`,
//      lida em `--origem`, padrão: a casa) na MESMA posição dentro da cópia, a
//      partir do commit, e tira o remoto. A mesma posição é o que deixa o
//      conferidor `kit` achar a fonte subindo as pastas
//   3. copia os `--trazer`: o artefato que a suíte não pode gerar ali (o lcov de
//      uma suíte que usa banco, o `.venv` de uma trilha Python)
//   4. `npm ci --offline` em cada `package-lock.json` versionado na raiz ou um
//      nível abaixo (o `scripts/` da casa), onde ainda não há `node_modules`
//   5. instala o kit da cópia da casa em cada pasta com kit (`--atualizar`) e
//      põe o `--stack` ensaiado no lugar do `stack.mjs`
//   6. roda o portão de cada uma, e o da casa se ela tiver kit, sem `CI`
//   7. escreve `BANCADA.md` e `bancada.json` no destino
//
// 🚨 Ela NUNCA apaga nada e NUNCA escreve no projeto real: destino que já existe
// é recusado, e quem apaga a pasta é quem a pediu.
//
// Os desfechos:
//   0  todos os portões verdes
//   1  algum portão vermelho
//   2  uso errado
//   4  não consegui montar a bancada (clone, instalação)
//
// Prova: scripts/testes/teste-bancada.mjs

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, isAbsolute, sep } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DESFECHO = { VERDE: 0, VERMELHO: 1, USO: 2, NAO_MONTOU: 4 }
const LUGARES = ['fabrica', join('.claude', 'fabrica')]
const barra = (c) => c.split(sep).join('/')

/** Um comando SEM shell: o caminho com espaço (como "Meus Projetos") não se quebra. */
function executar (programa, args, { cwd, env = process.env, tempoMaximo = 600000, shell = false } = {}) {
  const r = spawnSync(programa, args, { cwd, env, encoding: 'utf8', timeout: tempoMaximo, shell, maxBuffer: 64 * 1024 * 1024 })
  return { saiu: r.status ?? 1, saida: `${r.stdout ?? ''}${r.stderr ?? ''}${r.error ? String(r.error.message) : ''}` }
}

// ⚠️ Sem lock opcional: por padrão o `git status` pega o `index.lock` e regrava
// o `.git/index` da árvore real para atualizar os dados de arquivo, e a árvore
// real é a da outra sessão.
const git = (cwd, ...args) => executar('git', args, { cwd, tempoMaximo: 300000, env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } })

/** `a` está dentro de `b` (ou é ela)? */
function dentro (a, b) {
  const rel = relative(resolve(b), resolve(a))
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
}

/** A posição relativa à casa, sem sair dela. Devolve null se sair. */
function posicaoValida (posicao) {
  if (!posicao || isAbsolute(posicao)) return null
  const limpa = barra(posicao).replace(/\/+$/, '')
  return limpa.split('/').some((p) => p === '..' || p === '') ? null : limpa
}

function lerArgs (argv) {
  const a = { alvos: [], stacks: [], trazer: [], casa: null, origem: null, destino: null, ref: 'HEAD' }
  const conhecidas = new Set(['--destino', '--alvo', '--casa', '--origem', '--ref', '--stack', '--trazer'])
  for (let i = 0; i < argv.length; i += 1) {
    const b = argv[i]
    const v = argv[i + 1]
    if (!conhecidas.has(b) || v === undefined) return { erro: `argumento desconhecido ou sem valor: ${b}` }
    i += 1
    if (b === '--destino') a.destino = v
    else if (b === '--casa') a.casa = v
    else if (b === '--origem') a.origem = v
    else if (b === '--ref') a.ref = v
    else if (b === '--alvo') a.alvos.push(v)
    else if (b === '--trazer') a.trazer.push(v)
    else if (b === '--stack') {
      const igual = v.indexOf('=')
      if (igual < 1) return { erro: `--stack pede <posição>=<arquivo>, e veio ${v}` }
      a.stacks.push([v.slice(0, igual), v.slice(igual + 1)])
    }
  }
  return a
}

/** As pastas com kit dentro de uma cópia: a raiz e um nível abaixo (um `python/`, por exemplo). */
function pastasComKit (raiz) {
  const achadas = []
  const candidatas = [raiz]
  try {
    for (const d of spawnSync('git', ['ls-files'], { cwd: raiz, encoding: 'utf8' }).stdout.split('\n')) {
      const partes = d.split('/')
      if (partes.length === 3 && partes[1] === 'fabrica' && partes[2] === 'kit.json') candidatas.push(join(raiz, partes[0]))
    }
  } catch { /* sem git na cópia: fica só a raiz, e a falta de kit aparece no relatório */ }
  for (const c of candidatas) {
    const lugar = LUGARES.find((l) => existsSync(join(c, l, 'kit.json')))
    if (lugar) achadas.push({ pasta: c, lugar })
  }
  return achadas
}

/**
 * `npm ci --offline` em cada lock versionado na raiz ou um nível abaixo (o
 * `scripts/` da casa), onde ainda não há `node_modules`. Mais fundo não: o
 * `.claude/video/` da casa é o Remotion, pesado, e nenhum portão o lê.
 * Sem rede: o que não estiver no cache do npm falha, e a falha vai para o
 * relatório, nunca some.
 */
function instalarDependencias (copia) {
  const locks = spawnSync('git', ['ls-files', '*package-lock.json'], { cwd: copia, encoding: 'utf8' }).stdout
    .split('\n').map((l) => l.trim()).filter((l) => l && l.split('/').length <= 2)
  const feitos = []
  for (const lock of locks) {
    const pasta = join(copia, dirname(lock))
    if (existsSync(join(pasta, 'node_modules'))) continue
    const npm = executar('npm', ['ci', '--offline', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: pasta, shell: process.platform === 'win32' })
    const onde = dirname(lock) === '.' ? 'raiz' : dirname(lock)
    feitos.push(npm.saiu === 0 ? `${onde}: npm ci offline: ok` : `${onde}: npm ci offline FALHOU (${npm.saida.trim().split('\n').pop()})`)
  }
  return feitos.length > 0 ? feitos.join('; ') : null
}

function lerRecibo (pasta, lugar) {
  try {
    return JSON.parse(readFileSync(join(pasta, lugar, '.ultimo-portao.json'), 'utf8'))
  } catch {
    return null
  }
}

function rodarPortao (pasta, lugar) {
  const env = { ...process.env, npm_config_offline: 'true' }
  delete env.CI
  delete env.GITHUB_ACTIONS
  const r = executar('node', [join(pasta, lugar, 'portao.mjs'), '--raiz', pasta], { cwd: pasta, env })
  const recibo = lerRecibo(pasta, lugar)
  return {
    portao: r.saiu === 0 ? 'verde' : 'vermelho',
    saiu: r.saiu,
    vermelhos: [...(recibo?.vermelhos ?? []), ...(recibo?.naoRodaram ?? [])],
    pulados: recibo?.pulados ?? [],
    fecho: r.saida.split('\n').filter((l) => /O portão fechou|VERMELHOS|REPROVOU|não existe passo/.test(l)).map((l) => l.replace(/\x1b\[[0-9;]*m/g, '').trim()),
    kit: (() => { try { return JSON.parse(readFileSync(join(pasta, lugar, 'kit.json'), 'utf8')).versao } catch { return null } })()
  }
}

function escreverRelatorio (destino, dados) {
  writeFileSync(join(destino, 'bancada.json'), `${JSON.stringify(dados, null, 2)}\n`, 'utf8')
  const linhas = [
    '# Bancada do kit',
    '',
    `Montada em ${dados.quando}. A casa veio do commit ${dados.casa.commit.slice(0, 7)}. ${[dados.casa.remotos, ...dados.alvos.map((x) => x.remotos ?? '')].every((r) => r === '') ? 'Remoto medido em cada cópia: nenhum.' : '🚨 ALGUMA CÓPIA FICOU COM REMOTO: veja a coluna Observação.'}`,
    '',
    '| Posição | Commit | Kit | Portão | Vermelhos | Pulados | Observação |',
    '|---|---|---|---|---|---|---|'
  ]
  for (const a of dados.alvos) {
    const obs = [a.remotos ? `REMOTO: ${a.remotos}` : '', a.naoCommitado ? 'a árvore real tinha mudança fora do commit, que não entrou' : '', a.dependencias ?? '', ...(a.trazidos ?? []).map((t) => `trouxe ${t}`), a.stack ? 'stack ensaiado' : '', ...(a.avisosDoInstalador ?? []).map((x) => `o instalador avisou: ${x}`)].filter(Boolean).join('; ')
    linhas.push(`| \`${a.posicao}\` | ${(a.commit ?? '').slice(0, 7)} | ${a.kit ?? '?'} | ${a.portao} | ${(a.vermelhos ?? []).join(', ')} | ${(a.pulados ?? []).join(', ')} | ${obs} |`)
  }
  for (const p of dados.stacksSemPouso ?? []) linhas.push('', `🚨 O \`--stack\` de \`${p}\` não pousou em pasta de kit nenhuma: o ensaio dele não aconteceu.`)
  linhas.push('', `Resultado: **${dados.resultado}**.`, '')
  writeFileSync(join(destino, 'BANCADA.md'), linhas.join('\n'), 'utf8')
}

export function bancada (argv) {
  const a = lerArgs(argv)
  const uso = (msg) => ({ codigo: DESFECHO.USO, mensagem: msg })
  if (a.erro) return uso(a.erro)
  if (!a.destino || a.alvos.length === 0) return uso('uso: bancada.mjs --destino <dir> --alvo <posição>... [--casa <dir>] [--origem <dir>] [--ref <ref>] [--stack <posição>=<arquivo>] [--trazer <posição>]')

  const casa = resolve(a.casa ?? resolve(SKILL, '..', '..', '..'))
  const origem = resolve(a.origem ?? casa)
  const destino = resolve(a.destino)
  if (existsSync(destino)) return uso(`o destino ${destino} já existe: a bancada não reaproveita pasta nem apaga nada; escolha outra`)
  if (dentro(destino, casa) || dentro(destino, origem)) return uso(`o destino tem de ficar fora da casa e da origem (${destino})`)

  const alvos = []
  for (const bruto of a.alvos) {
    const posicao = posicaoValida(bruto)
    if (!posicao) return uso(`alvo fora da casa: ${bruto}`)
    const real = join(origem, posicao)
    const topo = git(real, 'rev-parse', '--show-toplevel')
    if (!existsSync(real) || topo.saiu !== 0 || resolve(topo.saida.trim()) !== resolve(real)) return uso(`o alvo ${posicao} não é a raiz de um repositório git em ${origem}`)
    alvos.push({ posicao, real })
  }
  const trazer = []
  for (const bruto of a.trazer) {
    const posicao = posicaoValida(bruto)
    const dono = posicao && alvos.find((x) => posicao.startsWith(`${x.posicao}/`))
    if (!dono) return uso(`--trazer só copia de dentro de um alvo, e ${bruto} não está em nenhum`)
    // O `.git` da cópia é da bancada: trazer o do projeto real traria o remoto de volta.
    if (posicao.split('/').some((p) => p.toLowerCase() === '.git')) return uso(`--trazer não copia nada de dentro do .git (${posicao}): isso traria o remoto de volta à cópia`)
    if (!existsSync(join(origem, posicao))) return uso(`--trazer: ${posicao} não existe em ${origem}`)
    trazer.push({ posicao, dono })
  }
  // A chave do --stack passa pela mesma régua de posição: `x/` e `x` são a mesma
  // pasta.
  const stacks = {}
  for (const [bruta, arquivo] of a.stacks) {
    const posicao = posicaoValida(bruta)
    if (!posicao) return uso(`--stack: posição fora da casa: ${bruta}`)
    // Dois --stack para a mesma pasta: um deles sumiria sem aviso.
    if (stacks[posicao]) return uso(`mais de um --stack para ${posicao}: escolha um arquivo só`)
    if (!existsSync(resolve(arquivo))) return uso(`--stack: o arquivo ${arquivo} não existe`)
    if (!alvos.some((x) => posicao === x.posicao || posicao.startsWith(`${x.posicao}/`))) return uso(`--stack: ${posicao} não está em nenhum alvo`)
    stacks[posicao] = arquivo
  }
  const stacksPousados = new Set()

  const sha = git(casa, 'rev-parse', a.ref)
  if (sha.saiu !== 0) return uso(`a casa não conhece o ref ${a.ref}`)

  // 1 · a casa, do commit, sem remoto
  mkdirSync(destino, { recursive: true })
  const copiaCasa = join(destino, 'casa')
  const monta = (passo, r) => (r.saiu === 0 ? null : { codigo: DESFECHO.NAO_MONTOU, mensagem: `${passo}: ${r.saida.trim().split('\n').slice(-3).join(' | ')}` })
  const falhaCasa = monta('clonar a casa', git(destino, 'clone', '--quiet', '--no-checkout', casa, copiaCasa)) ??
    monta('pôr a casa no commit', git(copiaCasa, 'checkout', '--quiet', '--detach', sha.saida.trim())) ??
    monta('tirar o remoto da casa', git(copiaCasa, 'remote', 'remove', 'origin'))
  if (falhaCasa) return falhaCasa

  // O "sem remoto" do relatório é MEDIDO em cada cópia, nunca escrito.
  const remotosDe = (pasta) => git(pasta, 'remote').saida.trim()
  const dados = { quando: new Date().toISOString(), casa: { origem: barra(casa), commit: sha.saida.trim(), remotos: remotosDe(copiaCasa) }, alvos: [], stacksSemPouso: [], resultado: 'verde' }
  if (dados.casa.remotos !== '') dados.resultado = 'vermelho'

  // 2 a 5 · cada alvo
  for (const alvo of alvos) {
    const copia = join(copiaCasa, alvo.posicao)
    mkdirSync(dirname(copia), { recursive: true })
    const head = git(alvo.real, 'rev-parse', 'HEAD').saida.trim()
    const naoCommitado = git(alvo.real, 'status', '--porcelain').saida.trim() !== ''
    const falha = monta(`clonar ${alvo.posicao}`, git(dirname(copia), 'clone', '--quiet', alvo.real, copia)) ??
      monta(`tirar o remoto de ${alvo.posicao}`, git(copia, 'remote', 'remove', 'origin'))
    if (falha) return falha

    const trazidos = trazer.filter((t) => t.dono === alvo).map((t) => t.posicao)
    for (const t of trazidos) cpSync(join(origem, t), join(copiaCasa, t), { recursive: true })

    const dependencias = instalarDependencias(copia)
    const remotos = remotosDe(copia)
    if (remotos !== '') dados.resultado = 'vermelho'

    // 🚨 Alvo sem kit não some do relatório: ele vira uma linha "sem kit" e deixa
    // a bancada vermelha. Verde medindo zero é vermelho (constituição VI).
    const comKit = pastasComKit(copia)
    if (comKit.length === 0) {
      dados.alvos.push({ posicao: alvo.posicao, commit: head, naoCommitado, trazidos, dependencias, remotos, stack: false, portao: 'sem kit', vermelhos: [], pulados: [], kit: null })
      dados.resultado = 'vermelho'
    }
    // 🚨 Instala em TODAS as pastas do alvo antes de rodar o primeiro portão.
    // Pasta por pasta, o portão da trilha Node de um projeto roda com o
    // `python/` dele ainda no kit velho, e dá vermelho onde o pouso real (as
    // duas trilhas no mesmo commit) dá verde.
    const instalados = []
    for (const { pasta, lugar } of comKit) {
      const inst = executar('node', [join(copiaCasa, '.claude', 'skills', 'fabrica', 'scripts', 'instalar.mjs'), '--atualizar', pasta], { cwd: pasta })
      if (inst.saiu !== 0) return { codigo: DESFECHO.NAO_MONTOU, mensagem: `instalar o kit em ${barra(relative(copiaCasa, pasta))}: ${inst.saida.trim().split('\n').slice(-3).join(' | ')}` }
      const posicao = barra(relative(copiaCasa, pasta))
      const stack = stacks[posicao]
      if (stack) {
        cpSync(resolve(stack), join(pasta, lugar, 'stack.mjs'))
        stacksPousados.add(posicao)
      }
      instalados.push({ pasta, lugar, inst, posicao, stack })
    }
    for (const { pasta, lugar, inst, posicao, stack } of instalados) {
      const r = rodarPortao(pasta, lugar)
      // O que o instalador avisa que falta fora da pasta do kit (o .gitignore, os
      // scripts) vai para o relatório: o --atualizar não escreve ali, e sem isto
      // o aviso morreria aqui.
      const avisosDoInstalador = inst.saida.split('\n').filter((l) => /^\s*!\s/.test(l)).map((l) => l.trim().replace(/^!\s*/, ''))
      dados.alvos.push({ posicao, commit: head, naoCommitado, trazidos, dependencias, remotos, stack: Boolean(stack), avisosDoInstalador, ...r })
      if (r.portao !== 'verde') dados.resultado = 'vermelho'
    }
  }

  // Um --stack pedido que não pousou em pasta de kit nenhuma é ensaio que não
  // aconteceu: vermelho, com a posição.
  dados.stacksSemPouso = Object.keys(stacks).filter((p) => !stacksPousados.has(p))
  if (dados.stacksSemPouso.length > 0) dados.resultado = 'vermelho'

  // 6 · a casa, se tiver kit
  const kitDaCasa = LUGARES.find((l) => existsSync(join(copiaCasa, l, 'kit.json')))
  if (kitDaCasa) {
    const dependencias = instalarDependencias(copiaCasa)
    const r = rodarPortao(copiaCasa, kitDaCasa)
    dados.alvos.push({ posicao: '.', commit: sha.saida.trim(), naoCommitado: false, dependencias, remotos: dados.casa.remotos, ...r })
    if (r.portao !== 'verde') dados.resultado = 'vermelho'
  }

  escreverRelatorio(destino, dados)
  return {
    codigo: dados.resultado === 'verde' ? DESFECHO.VERDE : DESFECHO.VERMELHO,
    mensagem: `bancada ${dados.resultado}: ${dados.alvos.map((x) => `${x.posicao} ${x.portao}`).join(' · ')}\nrelatório em ${join(destino, 'BANCADA.md')}`
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const r = bancada(process.argv.slice(2))
  console.log(r.codigo === DESFECHO.USO || r.codigo === DESFECHO.NAO_MONTOU ? `✗ ${r.mensagem}` : r.mensagem)
  process.exit(r.codigo)
}
