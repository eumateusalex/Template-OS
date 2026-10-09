#!/usr/bin/env node
// node .claude/skills/novo-projeto/esqueleto/scripts/teste-fundacao.mjs [--sem-build]
//
// O teste da própria fundação, em cinco blocos:
//
//   A · a instalação faz o que promete nas duas trilhas e nas duas marcas (a do
//       projeto, que é o padrão, e a da casa), acrescenta em vez de
//       sobrescrever, e o --atualizar respeita a semente
//   C · a régua fica vermelha e fica QUIETA, e cada mutação registrada
//       no cabeçalho das provas é reexecutada numa cópia e pega
//   D · a coerência: o kit, o manifesto, as libs espelhadas da fábrica, a web
//   M · a troca de marca: outra paleta passa, paleta ruim reprova nomeando o par
//   B · o projeto de verdade, FORA do workspace e sem a casa: npm ci, o portão
//       inteiro da fábrica e a tela (precisa de rede; pula com --sem-build)
//
// 🚨 Tudo acontece em `os.tmpdir()`, fora da pasta do workspace. O bloco D
// confere no fim que nada vazou para o repositório.
//
// mutação: .claude/skills/novo-projeto/esqueleto/scripts/instalar.mjs · "trilha, marca = 'projeto', cores = {}" → "trilha, marca = 'casa', cores = {}" · pega em 09/10/2026 (A5, A15 e M)
// mutação: .claude/skills/novo-projeto/esqueleto/scripts/gerar-manifesto.mjs · " || antes.mudouEm === PROXIMA" → "" · pega em 09/10/2026 (D13)

import { existsSync, readFileSync, writeFileSync, readdirSync, cpSync, mkdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'

import { criar, apagar } from '../kit/conferido/lib/temporaria.mjs'
import { rodar } from '../kit/conferido/lib/runner.mjs'
import { pinta } from '../kit/conferido/lib/saida.mjs'
import { exigirPeca } from '../../../../../scripts/terceiros/peca.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const ESQUELETO = dirname(AQUI)
const KIT = join(ESQUELETO, 'kit')
const CASA = resolve(ESQUELETO, '..', '..', '..', '..')
const FABRICA = join(CASA, '.claude', 'skills', 'fabrica')
// A marca da casa nos testes é a de EXEMPLO das fixtures (neutra): o teste mede o
// mecanismo do `--marca casa`, e não a marca de ninguém.
process.env.FUNDACAO_MARCA_WEB ??= join(ESQUELETO, 'fixtures', 'marca-web')

// As fontes das fixtures e os dez componentes do registry moram fora do git: o
// instalador das peças de terceiro os baixa. Sem eles, o teste para aqui e diz o comando.
const PECAS = ['novo-projeto-fontes', 'novo-projeto-marca-web', ...(process.argv.includes('--sem-build') ? [] : ['novo-projeto-shadcn'])]
for (const id of PECAS) {
  try { exigirPeca(id, { raiz: CASA }) } catch (e) { console.log(`  ✗ ${e.message}`); process.exit(1) }
}

let ok = 0
let ruim = 0
const pulados = []

function certo (nome) { ok += 1; console.log(`  ${pinta('✓', 'verde')} ${nome}`) }
function errado (nome, porque) {
  ruim += 1
  console.log(`  ${pinta('✗', 'vermelho')} ${nome}`)
  for (const linha of String(porque).split('\n').slice(0, 10)) console.log(`      ${linha}`)
}
async function caso (nome, trabalho) {
  try {
    const erro = await trabalho()
    if (erro) errado(nome, erro)
    else certo(nome)
  } catch (e) {
    errado(nome, e.stack ?? e.message)
  }
}
function pulado (nome, razao) { pulados.push({ nome, razao }); console.log(`  ${pinta('⏭', 'amarelo')} ${nome} — pulado: ${razao}`) }
const calado = () => {}
const barra = (p) => p.split('\\').join('/')

const { instalar, atualizar } = await import(pathToFileURL(join(AQUI, 'instalar.mjs')).href)
const { impressaoDoKit } = await import(pathToFileURL(join(AQUI, 'gerar-manifesto.mjs')).href)

/** Um projeto recém-criado pelo /novo-projeto: guia, briefing, .gitignore e git. */
function projetoNovo (prefixo = 'fundacao-teste-') {
  const raiz = criar(prefixo)
  writeFileSync(join(raiz, 'CLAUDE.md'), '# Projeto de teste\n\nO guia do projeto.\n')
  writeFileSync(join(raiz, 'briefing.md'), '# Briefing\n')
  writeFileSync(join(raiz, '.gitignore'), 'node_modules/\ndist/\n')
  rodar('git init -q', { cwd: raiz, tempoMaximo: 30000 })
  return raiz
}

const manifestoDe = (raiz) => JSON.parse(readFileSync(join(raiz, 'fundacao', 'fundacao.json'), 'utf8'))
const le = (raiz, rel) => readFileSync(join(raiz, rel), 'utf8')
const conferidor = (raiz, nome, extra = '') => rodar(`node "${barra(join(raiz, 'fundacao', 'portao', `${nome}.mjs`))}" --raiz "${barra(raiz)}" ${extra}`, { cwd: raiz, tempoMaximo: 120000 })

/** A impressão de uma árvore inteira, para provar que nada mudou. */
function impressaoDaArvore (raiz) {
  const h = createHash('sha256')
  const desce = (dir, rel) => {
    for (const item of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (item.name === '.git') continue
      const r = rel ? `${rel}/${item.name}` : item.name
      if (item.isDirectory()) desce(join(dir, item.name), r)
      else { h.update(r); h.update(readFileSync(join(dir, item.name))) }
    }
  }
  desce(raiz, '')
  return h.digest('hex')
}

// Os valores da marca da casa que um projeto novo nunca recebe sem pedir. Nos
// testes, a marca da casa é a de exemplo das fixtures (fixtures/marca-web e o
// ícone da casa), então é ela que se procura: uma lista com outra marca olharia
// valores que a suíte nunca instala e ficaria verde sem medir. As provas e as
// libs dos conferidores ficam de fora: são dado de teste e comentário de código.
const DA_CASA = ['37,99,235', '202,138,4', "'Inter'", 'inter-latin-400', '#2563eb', 'cubic-bezier(0.2, 0.65, 0.2, 1)']

function valoresDaCasaEm (raiz) {
  const achados = []
  const desce = (dir, rel) => {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const r = rel ? `${rel}/${item.name}` : item.name
      if (['.git', 'node_modules', 'fundacao/provas', 'fundacao/lib'].includes(r)) continue
      if (item.isDirectory()) { desce(join(dir, item.name), r); continue }
      // Canal com ou sem espaço depois da vírgula é o mesmo (o Prettier põe o espaço).
      const texto = readFileSync(join(dir, item.name), 'latin1').replace(/,\s+/g, ',')
      for (const v of DA_CASA) if (texto.includes(v.replace(/,\s+/g, ','))) achados.push(`${r}: ${v}`)
    }
  }
  desce(raiz, '')
  return achados
}

// ───────────────────────────────────────── A · a instalação

async function blocoA () {
  console.log('\nA · a instalação')

  await caso('A1 · trilha app, marca da casa: conferidos por sha, sementes, fábrica, acréscimos', () => {
    const raiz = projetoNovo()
    try {
      if (instalar(raiz, { trilha: 'app', marca: 'casa', aviso: calado }) !== 0) return 'instalar não saiu 0'
      const m = manifestoDe(raiz)
      const conferidos = Object.entries(m.arquivos).filter(([, e]) => e.tipo === 'conferido')
      const sementes = Object.entries(m.arquivos).filter(([, e]) => e.tipo === 'semente')
      if (conferidos.length < 10 || sementes.length < 10) return `manifesto magro: ${conferidos.length} conferidos, ${sementes.length} sementes`
      for (const f of ['fundacao/tokens.css', 'fundacao/tema-shadcn.css', 'fundacao/portao/marca.mjs', 'public/fontes/inter-latin-400.woff2',
        'src/app/globals.css', 'src/styles/marca.css', 'fabrica/stack.mjs', 'fabrica/portao.mjs', '.github/workflows/portao.yml', 'README.md']) {
        if (!existsSync(join(raiz, f))) return `faltou ${f}`
      }
      if (!le(raiz, 'fabrica/stack.mjs').includes('fundacao/portao/marca.mjs')) return 'o stack.mjs não chama o conferidor marca'
      if (!/node_modules\/[\s\S]*\.next\/[\s\S]*\.env\n/.test(le(raiz, '.gitignore'))) return `o .gitignore não ganhou as linhas (e tem que manter as dele):\n${le(raiz, '.gitignore')}`
      if (!le(raiz, '.gitattributes').includes('src/components/ui/*.tsx text eol=lf')) return 'o .gitattributes não protege os componentes do registry'
      if (!le(raiz, 'CLAUDE.md').startsWith('# Projeto de teste') || !le(raiz, 'CLAUDE.md').includes('## Fundação')) return 'o CLAUDE.md perdeu o dele ou não ganhou o trecho'
      if (!/sem spec declarado:/.test(le(raiz, 'README.md'))) return 'o README não declara a ausência de spec'
      if (m.portao !== 'fabrica/stack.mjs') return `portao = ${m.portao}`
      return null
    } finally { apagar(raiz, { prazoMs: 12000 }) }
  })

  await caso('A2 · instalar de novo não muda byte nenhum, e manda usar o --atualizar', () => {
    const raiz = projetoNovo()
    try {
      instalar(raiz, { trilha: 'app', aviso: calado })
      const antes = impressaoDaArvore(raiz)
      const avisos = []
      const codigo = instalar(raiz, { trilha: 'app', aviso: (t) => avisos.push(t) })
      if (codigo !== 0) return `a segunda instalação saiu ${codigo}`
      if (impressaoDaArvore(raiz) !== antes) return 'a segunda instalação mudou arquivos'
      return /--atualizar/.test(avisos.join('\n')) ? null : `não mandou usar o --atualizar: ${avisos.join(' | ')}`
    } finally { apagar(raiz, { prazoMs: 12000 }) }
  })

  await caso('A3 · recusa meio kit: alvo inexistente, trilha e marca inválidas não escrevem nada', () => {
    const raiz = criar('fundacao-teste-recusa-')
    try {
      if (instalar(join(raiz, 'nao-existe'), { trilha: 'app', aviso: calado }) === 0) return 'aceitou alvo inexistente'
      if (instalar(raiz, { trilha: 'foguete', aviso: calado }) === 0) return 'aceitou trilha inválida'
      if (instalar(raiz, { trilha: 'app', marca: 'azul', aviso: calado }) === 0) return 'aceitou marca inválida'
      return readdirSync(raiz).length === 0 ? null : `escreveu mesmo recusando: ${readdirSync(raiz).join(', ')}`
    } finally { apagar(raiz) }
  })

  // Não basta o banco não vir: nada que fica pode apontar para ele. Um
  // next.config.ts que importa src/lib/banco/cookies deixa o projeto sem banco
  // sem compilar.
  await caso('A4 · --sem-banco não traz o banco, e nada que fica aponta para ele', () => {
    const raiz = projetoNovo()
    try {
      instalar(raiz, { trilha: 'app', semBanco: true, aviso: calado })
      for (const f of ['src/lib/banco/servidor.ts', 'src/proxy.ts', 'src/lib/tipos/banco.ts', '.env.example']) if (existsSync(join(raiz, f))) return `trouxe ${f}`
      if (!existsSync(join(raiz, 'src/app/layout.tsx'))) return 'também deixou de trazer o resto'
      const restos = []
      for (const f of ['next.config.ts', 'testes/next-config.test.ts', 'Dockerfile', 'package.json']) {
        const texto = le(raiz, f)
        if (/lib\/banco|configDoBanco|@supabase|SUPABASE|tipos:banco|fundação: banco/.test(texto)) restos.push(f)
      }
      if (restos.length) return `ainda apontam para o banco: ${restos.join(', ')}`
      if (!/export const AREAS_OBRIGATORIAS = \[\]/.test(le(raiz, 'fabrica/stack.mjs'))) return 'o stack.mjs ainda declara a área do banco, que não veio'
      // A origem gravada é a do arquivo SEM o banco: com a da fonte inteira, o
      // --atualizar veria toda semente sem banco como editada.
      const origem = manifestoDe(raiz).arquivos['next.config.ts']?.origem
      const noDisco = createHash('sha256').update(le(raiz, 'next.config.ts').split('\r\n').join('\n'), 'utf8').digest('hex')
      if (origem !== noDisco) return 'a origem do next.config.ts sem banco não é a do arquivo instalado: o --atualizar o trataria como editado'
      return /NEXT_TELEMETRY_DISABLED=1/.test(le(raiz, 'Dockerfile')) ? null : 'o Dockerfile perdeu a telemetria desligada junto com o banco'
    } finally { apagar(raiz, { prazoMs: 12000 }) }
  })

  await caso('A5 · sem --marca, a marca é a do projeto: gerada em src/styles/, e nenhum valor da casa no projeto', () => {
    const raiz = projetoNovo()
    try {
      if (instalar(raiz, { trilha: 'app', aviso: calado }) !== 0) return 'instalar não saiu 0'
      const m = manifestoDe(raiz)
      if (m.marca?.tipo !== 'projeto') return `marca = ${JSON.stringify(m.marca)}`
      for (const f of ['src/styles/tokens.css', 'src/styles/fontes.css', 'src/styles/tema-shadcn.css', 'src/app/icon.svg']) {
        if (!existsSync(join(raiz, f))) return `faltou ${f}`
      }
      for (const f of ['fundacao/tokens.css', 'fundacao/fontes.css', 'fundacao/tema-shadcn.css', 'public/fontes']) {
        if (existsSync(join(raiz, f))) return `trouxe ${f}, que é da marca da casa`
      }
      if (!le(raiz, 'src/styles/marca.css').includes('"./tokens.css"')) return 'o marca.css não aponta para os tokens do projeto'
      const achados = valoresDaCasaEm(raiz)
      return achados.length ? `valor da casa no projeto: ${achados.slice(0, 5).join(' | ')}` : null
    } finally { apagar(raiz, { prazoMs: 12000 }) }
  })

  await caso('A15 · as cores da entrevista chegam aos tokens e ao ícone; cor recusada não deixa meio kit', () => {
    const raiz = projetoNovo()
    const outra = projetoNovo()
    try {
      const cores = { primaria: '#0f766e', fundo: '#ffffff', texto: '#0f172a' }
      if (instalar(raiz, { trilha: 'app', cores, aviso: calado }) !== 0) return 'instalar com as cores dele não saiu 0'
      if (!le(raiz, 'src/styles/tokens.css').includes('--c-primaria: 15, 118, 110;')) return 'a primária dele não chegou aos tokens'
      if (!le(raiz, 'src/app/icon.svg').includes('#0f766e')) return 'o ícone não usa a primária dele'
      const antes = impressaoDaArvore(outra)
      const avisos = []
      if (instalar(outra, { trilha: 'app', cores: { primaria: '#ffd84d', fundo: '#ffffff', texto: '#111111' }, aviso: (t) => avisos.push(t) }) === 0) return 'aceitou amarelo claro sobre branco'
      if (!/prim[áa]ria[\s\S]*#[0-9a-f]{6}/i.test(avisos.join('\n'))) return `a recusa não trouxe a sugestão: ${avisos.join(' | ')}`
      return impressaoDaArvore(outra) === antes ? null : 'a instalação recusada escreveu arquivos'
    } finally {
      apagar(raiz, { prazoMs: 12000 })
      apagar(outra, { prazoMs: 12000 })
    }
  })

  // 🚨 Sem o lock testado, o `npm install` do projeto resolve as dependências
  // indiretas do dia: o `@axe-core/playwright` pode puxar um `playwright-core`
  // mais novo que o do `@playwright/test`, e o `tipos` reprova.
  await caso('A17 · a trilha app traz o lockfile testado da fixture, byte a byte; lock que já existe fica; a página não traz', () => {
    const raiz = projetoNovo()
    const comLock = projetoNovo()
    const pagina = criar('fundacao-teste-pagina-')
    try {
      const fixture = readFileSync(join(ESQUELETO, 'fixtures', 'app-minimo', 'package-lock.json'))
      if (instalar(raiz, { trilha: 'app', aviso: calado }) !== 0) return 'instalar não saiu 0'
      if (!existsSync(join(raiz, 'package-lock.json'))) return 'a trilha app não trouxe o package-lock.json'
      if (!readFileSync(join(raiz, 'package-lock.json')).equals(fixture)) return 'o package-lock.json não é o da fixture'
      writeFileSync(join(comLock, 'package-lock.json'), '{"do":"projeto"}\n')
      if (instalar(comLock, { trilha: 'app', aviso: calado }) !== 0) return 'instalar com lock próprio não saiu 0'
      if (le(comLock, 'package-lock.json') !== '{"do":"projeto"}\n') return 'passou por cima do lock que o projeto já tinha'
      writeFileSync(join(pagina, 'portao.js'), '// o portão próprio do projeto\n')
      if (instalar(pagina, { trilha: 'pagina', marca: 'casa', semFabrica: true, so: ['tokens'], portao: 'portao.js', aviso: calado }) !== 0) return 'a página não saiu 0'
      return existsSync(join(pagina, 'package-lock.json')) ? 'a trilha página trouxe um lock de app' : null
    } finally {
      apagar(raiz, { prazoMs: 12000 })
      apagar(comLock, { prazoMs: 12000 })
      apagar(pagina)
    }
  })

  await caso('A6 · trilha página, sem fábrica, só os tokens: o que o site vai receber', () => {
    const raiz = criar('fundacao-teste-pagina-')
    try {
      writeFileSync(join(raiz, 'portao.js'), '// o portão próprio do projeto\n')
      if (instalar(raiz, { trilha: 'pagina', marca: 'casa', semFabrica: true, so: ['tokens'], portao: 'portao.js', aviso: calado }) !== 0) return 'não saiu 0'
      if (!existsSync(join(raiz, 'fundacao/tokens.css'))) return 'não trouxe os tokens'
      for (const f of ['fundacao/fontes.css', 'public/fontes', 'fabrica', 'src/app/layout.tsx', 'fundacao/portao/tela.mjs', 'fundacao/portao/auditar-ui.mjs']) {
        if (existsSync(join(raiz, f))) return `trouxe ${f}, que a decisão 1 e o --so deixam de fora`
      }
      return manifestoDe(raiz).portao === 'portao.js' ? null : 'o manifesto não aponta o portão do projeto'
    } finally { apagar(raiz) }
  })

  await caso('A7 · --atualizar: conferido editado recusa, --forcar restaura', () => {
    const raiz = projetoNovo()
    try {
      instalar(raiz, { trilha: 'app', marca: 'casa', aviso: calado })
      const original = le(raiz, 'fundacao/tokens.css')
      writeFileSync(join(raiz, 'fundacao/tokens.css'), `${original}/* editado */\n`)
      if (atualizar(raiz, { aviso: calado }) === 0) return 'o --atualizar aceitou conferido editado'
      if (atualizar(raiz, { forcar: true, aviso: calado }) !== 0) return 'o --forcar não restaurou'
      return le(raiz, 'fundacao/tokens.css') === original ? null : 'o conferido não voltou ao original'
    } finally { apagar(raiz, { prazoMs: 12000 }) }
  })

  await caso('A8 · --atualizar numa casa com a fonte nova: semente intocada atualiza, semente editada fica', async () => {
    const casa = criar('fundacao-teste-casa-')
    const raiz = join(casa, 'projetos-pessoais', 'p')
    const salvo = process.env.FUNDACAO_MARCA_WEB
    try {
      for (const rel of ['.claude/skills/novo-projeto/esqueleto', '.claude/skills/fabrica/kit', '.claude/skills/fabrica/templates', '.claude/skills/fabrica/scripts']) {
        cpSync(join(CASA, rel), join(casa, rel), { recursive: true, filter: (f) => !/[\\/](fixtures|node_modules)([\\/]|$)/.test(f) })
      }
      // sem fixtures/ (pesa), menos o lock que a trilha app leva ao projeto
      const lockDaCasa = '.claude/skills/novo-projeto/esqueleto/fixtures/app-minimo/package-lock.json'
      mkdirSync(dirname(join(casa, lockDaCasa)), { recursive: true })
      cpSync(join(CASA, lockDaCasa), join(casa, lockDaCasa))
      // A marca da casa falsa mora onde a de verdade mora, em identidade/web/ da
      // própria casa, e este caso roda SEM o atalho de teste: é o único que passa
      // pelo caminho de produção do --marca casa.
      cpSync(join(ESQUELETO, 'fixtures', 'marca-web'), join(casa, 'identidade', 'web'), { recursive: true })
      delete process.env.FUNDACAO_MARCA_WEB
      mkdirSync(raiz, { recursive: true })
      writeFileSync(join(raiz, 'CLAUDE.md'), '# p\n')
      const outra = await import(`${pathToFileURL(join(casa, '.claude/skills/novo-projeto/esqueleto/scripts/instalar.mjs')).href}?v=${Date.now()}`)
      if (outra.instalar(raiz, { trilha: 'app', marca: 'casa', aviso: calado }) !== 0) return 'a instalação da casa falsa falhou'
      const fonteDosTokens = manifestoDe(raiz).arquivos?.['fundacao/tokens.css']?.fonte
      if (fonteDosTokens !== 'identidade/web/tokens.css') return `a marca não veio de identidade/web/ da própria casa (veio de ${fonteDosTokens})`
      const secao = 'src/app/(site)/secao.tsx'
      const perguntas = 'src/app/(site)/perguntas.tsx'
      writeFileSync(join(raiz, perguntas), '// o projeto reescreveu\n')
      for (const rel of [secao, perguntas]) {
        const fonte = join(casa, '.claude/skills/novo-projeto/esqueleto/kit/semente/app', rel)
        writeFileSync(fonte, `${readFileSync(fonte, 'utf8')}// v1.1\n`)
      }
      const avisos = []
      if (outra.atualizar(raiz, { aviso: (t) => avisos.push(t) }) !== 0) return `o --atualizar falhou: ${avisos.join(' | ')}`
      if (!le(raiz, secao).endsWith('// v1.1\n')) return 'a semente intocada não recebeu a versão nova'
      if (le(raiz, perguntas) !== '// o projeto reescreveu\n') return 'a semente editada foi atropelada'
      return avisos.join('\n').includes('perguntas.tsx') ? null : 'não avisou da semente editada com versão nova'
    } finally {
      if (salvo === undefined) delete process.env.FUNDACAO_MARCA_WEB
      else process.env.FUNDACAO_MARCA_WEB = salvo
      apagar(casa, { prazoMs: 12000 })
    }
  })

  // O estado de todo template recém-copiado: o workspace não tem marca na web.
  await caso('A16 · --marca casa sem a marca do workspace recusa, e antes de escrever qualquer coisa', () => {
    const raiz = projetoNovo()
    const salvo = process.env.FUNDACAO_MARCA_WEB
    process.env.FUNDACAO_MARCA_WEB = join(raiz, 'nao-existe')
    const avisos = []
    try {
      if (instalar(raiz, { trilha: 'app', marca: 'casa', aviso: (t) => avisos.push(t) }) !== 1) return 'aceitou --marca casa sem a marca do workspace'
      if (!/não existe .*: use --marca projeto/.test(avisos.join('\n'))) return `recusou sem dizer o que fazer: ${avisos.join(' | ')}`
      if (existsSync(join(raiz, 'fundacao'))) return 'escreveu no projeto antes de recusar'
      return null
    } finally {
      if (salvo === undefined) delete process.env.FUNDACAO_MARCA_WEB
      else process.env.FUNDACAO_MARCA_WEB = salvo
      apagar(raiz, { prazoMs: 12000 })
    }
  })
}

// ───────────────────────────────────────── C · a régua vermelha e quieta

/**
 * As mutações que moram no kit da fundação, lidas do CABEÇALHO das provas e do
 * teste da conta de cor. É a fonte única: um registro à parte seria a segunda
 * cópia do mesmo fato, e as duas descolariam.
 */
function mutacoesDoKit () {
  const re = /muta[çc][ãa]o:\s*(\S+)\s*·\s*"(.*)"\s*→\s*"(.*)"\s*·\s*(.*)$/u
  const fontes = [
    ...readdirSync(join(KIT, 'conferido', 'provas')).map((f) => join(KIT, 'conferido', 'provas', f)),
    join(ESQUELETO, 'testes', 'teste-cor.mjs'),
    join(ESQUELETO, 'testes', 'teste-marca.mjs'),
    join(ESQUELETO, 'testes', 'teste-dependencias.mjs')
  ]
  return fontes.flatMap((f) => readFileSync(f, 'utf8').split('\n')
    .map((l) => re.exec(l)).filter(Boolean)
    .map((m) => ({ tarefa: f.split(/[\\/]/).pop(), arquivo: m[1], de: m[2], para: m[3] })))
    .filter((m) => m.arquivo.startsWith(`${PREFIXO}/`))
}

const PREFIXO = '.claude/skills/novo-projeto/esqueleto'
/** As suítes que uma mutação do esqueleto tem que derrubar: uma basta. */
const SUITES = ['kit/conferido/teste-portao.mjs', 'testes/teste-cor.mjs', 'testes/teste-marca.mjs', 'testes/teste-dependencias.mjs']

async function blocoC () {
  console.log('\nC · a régua vermelha e quieta')
  // A marca padrão, a do projeto: é a que todo projeto novo recebe.
  const raiz = projetoNovo()
  try {
    instalar(raiz, { trilha: 'app', aviso: calado })

    await caso('C1 · a fundação recém-instalada passa no conferidor fundacao, com a nota de fonte fora de alcance', () => {
      const r = conferidor(raiz, 'fundacao')
      if (r.saiu !== 0) return r.saida
      return /não comparável/.test(r.saida) ? null : 'não imprimiu a nota da fonte fora de alcance'
    })

    await caso('C2 · a marca recém-instalada passa no conferidor marca (hex zero, tema coberto, contraste)', () => {
      const r = conferidor(raiz, 'marca')
      return r.saiu === 0 ? null : r.saida
    })

    await caso('C3 · um byte num conferido: vermelho, citando o caminho', () => {
      const alvo = join(raiz, 'fundacao/base.css')
      const original = readFileSync(alvo)
      try {
        writeFileSync(alvo, Buffer.concat([original, Buffer.from(' ')]))
        const r = conferidor(raiz, 'fundacao')
        return r.saiu === 1 && r.saida.includes('fundacao/base.css') ? null : `saiu ${r.saiu}: ${r.saida}`
      } finally { writeFileSync(alvo, original) }
    })

    await caso('C4 · semente editada: verde, e o caminho dela não aparece na saída', () => {
      writeFileSync(join(raiz, 'src/app/page.tsx'), 'export default function P () { return null }\n')
      const r = conferidor(raiz, 'fundacao')
      return r.saiu === 0 && !r.saida.includes('page.tsx') ? null : `saiu ${r.saiu}: ${r.saida}`
    })

    await caso('C5 · as provas plantadas da fundação, instaladas no projeto', () => {
      const r = rodar('node fundacao/teste-portao.mjs', { cwd: raiz, tempoMaximo: 300000 })
      return r.saiu === 0 ? null : r.saida.split('\n').slice(-8).join('\n')
    })
  } finally { apagar(raiz, { prazoMs: 12000 }) }

  const mutacoes = mutacoesDoKit()
  await caso(`C6 · as ${mutacoes.length} mutações registradas no kit, reexecutadas numa cópia, são todas pegas`, () => {
    if (mutacoes.length === 0) return 'nenhuma mutação do kit no recibo: nada foi medido'
    // toda suíte de testes/ tem que ter a mutação dela lida aqui: sem a linha na
    // lista `fontes` do mutacoesDoKit, a mutação sai do C6 calada
    const semRegistro = SUITES.filter((s) => s.startsWith('testes/') && !mutacoes.some((m) => m.tarefa === s.split('/').pop()))
    if (semRegistro.length) return `suíte sem mutação lida pelo C6: ${semRegistro.join(', ')} (falta na lista fontes do mutacoesDoKit)`
    // O controle: a cópia SEM mutação passa nas três suítes. Sem isso, uma
    // suíte que já falhasse na cópia faria toda mutação parecer pega.
    // a fixtures/ vai junto: a fonte de prova do teste-marca mora nela, e sem ela
    // a cópia mediria a conversão de fonte como PULADO
    const PASTAS_DA_COPIA = ['kit', 'testes', 'scripts', 'templates', 'fixtures']
    const controle = criar('fundacao-mutacao-controle-')
    try {
      for (const pasta of PASTAS_DA_COPIA) cpSync(join(ESQUELETO, pasta), join(controle, pasta), { recursive: true })
      const quebradas = SUITES.filter((s) => rodar(`node "${barra(join(controle, s))}"`, { cwd: controle, tempoMaximo: 300000 }).saiu !== 0)
      if (quebradas.length) return `a cópia sem mutação já falha em ${quebradas.join(', ')}: "pega" não mediria nada`
    } finally { apagar(controle) }
    const soltas = []
    for (const m of mutacoes) {
      const tmp = criar('fundacao-mutacao-')
      try {
        for (const pasta of PASTAS_DA_COPIA) cpSync(join(ESQUELETO, pasta), join(tmp, pasta), { recursive: true })
        const alvo = join(tmp, m.arquivo.replace(`${PREFIXO}/`, ''))
        const texto = readFileSync(alvo, 'utf8')
        if (texto.split(m.de).length !== 2) { soltas.push(`${m.tarefa}: o trecho não é único em ${m.arquivo}`); continue }
        writeFileSync(alvo, texto.split(m.de).join(m.para))
        const derrubou = SUITES.some((s) => rodar(`node "${barra(join(tmp, s))}"`, { cwd: tmp, tempoMaximo: 300000 }).saiu !== 0)
        if (!derrubou) soltas.push(`${m.tarefa}: ${m.arquivo} · "${m.de}" sobreviveu`)
      } finally { apagar(tmp) }
    }
    return soltas.length ? soltas.join('\n') : null
  })
}

// ───────────────────────────────────────── D · a coerência

async function blocoD () {
  console.log('\nD · a coerência')

  await caso('D1 · todo arquivo do kit mora em conferido/ ou em semente/', () => {
    const fora = readdirSync(KIT).filter((n) => !['conferido', 'semente', 'kit.json', 'HISTORICO.md', '.ultima-prova.json'].includes(n))
    return fora.length ? `fora do lugar: ${fora.join(', ')}` : null
  })

  await caso('D2 · as libs espelhadas são byte a byte as da fábrica', () => {
    const diferentes = ['saida', 'arquivos', 'isencao', 'runner', 'temporaria'].filter((n) =>
      readFileSync(join(KIT, 'conferido/lib', `${n}.mjs`), 'utf8') !== readFileSync(join(FABRICA, 'kit/lib', `${n}.mjs`), 'utf8'))
    return diferentes.length ? `divergiram da fábrica: ${diferentes.join(', ')} (copie de .claude/skills/fabrica/kit/lib/)` : null
  })

  await caso('D3 · todo .mjs do kit e dos scripts carrega (import, nunca node --check)', async () => {
    const quebrados = []
    const pastas = [join(KIT, 'conferido', 'lib'), join(KIT, 'conferido', 'portao'), join(KIT, 'conferido', 'provas'), AQUI]
    for (const pasta of pastas) {
      for (const f of readdirSync(pasta).filter((x) => x.endsWith('.mjs'))) {
        if (f === 'teste-fundacao.mjs') continue
        try { await import(pathToFileURL(join(pasta, f)).href) } catch (e) { quebrados.push(`${f}: ${e.message}`) }
      }
    }
    return quebrados.length ? quebrados.join('\n') : null
  })

  await caso('D4 · conferidor e prova andam em par, nos dois sentidos', () => {
    const nomes = (p) => readdirSync(join(KIT, 'conferido', p)).filter((f) => f.endsWith('.mjs')).map((f) => f.replace('.mjs', '')).sort().join(',')
    return nomes('portao') === nomes('provas') ? null : `portao: ${nomes('portao')} · provas: ${nomes('provas')}`
  })

  await caso('D5 · o kit.json está em dia com o disco, e o histórico tem a versão dele', () => {
    const r = rodar(`node "${barra(join(AQUI, 'gerar-manifesto.mjs'))}" --conferir`, { cwd: CASA, tempoMaximo: 60000 })
    if (r.saiu !== 0) return r.saida
    const versao = JSON.parse(readFileSync(join(KIT, 'kit.json'), 'utf8')).versao
    return readFileSync(join(KIT, 'HISTORICO.md'), 'utf8').includes(`## v${versao}`) ? null : `o HISTORICO.md não tem "## v${versao}"`
  })

  await caso('D6 · zero caractere de controle na skill (regex escrita por heredoc corrompe)', async () => {
    const { conferir } = await import(pathToFileURL(join(FABRICA, 'scripts', 'confere-caracteres.mjs')).href)
    const linhas = []
    return conferir(ESQUELETO, { escreve: (t) => linhas.push(t) }) === 0 ? null : linhas.join('\n')
  })

  // O gerador da marca na web é do kit visual do workspace. Workspace que ainda
  // não tem o gerador também não tem `identidade/web/`: aí não há o que conferir,
  // e o caso se pula com a razão.
  const D7 = 'D7 · a marca na web está em dia e no contrato (o gerador e a regra 7)'
  if (!existsSync(join(CASA, 'scripts', 'gerar-tokens-web.mjs'))) {
    pulado(D7, 'o workspace não tem o gerador da marca na web (scripts/gerar-tokens-web.mjs)')
  } else {
    await caso(D7, () => {
      const g = rodar('node scripts/gerar-tokens-web.mjs --conferir', { cwd: CASA, tempoMaximo: 60000 })
      if (g.saiu !== 0) return g.saida
      const k = rodar('node scripts/confere-kit.mjs', { cwd: CASA, tempoMaximo: 60000 })
      return k.saiu === 0 ? null : k.saida.split('\n').filter((l) => /❌/.test(l)).join('\n')
    })
  }

  await caso('D8 · todo caminho citado na skill existe', () => {
    const documentos = [join(ESQUELETO, 'LEIA-ME.md'), join(ESQUELETO, 'referencias', 'decisoes.md'), join(ESQUELETO, 'referencias', 'receitas.md')]
    const faltam = documentos.filter((f) => !existsSync(f))
    if (faltam.length) return `faltam os documentos: ${faltam.map((f) => f.replace(CASA, '')).join(', ')}`
    const quebrados = []
    for (const doc of documentos) {
      for (const m of readFileSync(doc, 'utf8').matchAll(/`([^`\n]+)`/g)) {
        const c = m[1].trim()
        // ⚠️ `projetos-pessoais/` fica de fora: cada projeto é outro repositório,
        // e na cópia limpa ou no CI da casa ele não existe.
        if (!/^(\.claude\/|specs\/|scripts\/|identidade\/)/.test(c) || /[*<>|]/.test(c)) continue
        if (!existsSync(join(CASA, c.split('#')[0]))) quebrados.push(`${doc.split(/[\\/]/).pop()} cita ${c}`)
      }
    }
    return quebrados.length ? quebrados.join('\n') : null
  })

  // A fundação é o esqueleto do /novo-projeto, e não uma skill própria. O
  // rastro das obras (specs/) e a lixeira guardam o caminho antigo e ficam de
  // fora; o resto não pode mandar ninguém para um caminho morto.
  await caso('D12 · nenhum arquivo da casa manda para a skill antiga da fundação nem para o caminho dela', () => {
    const r = rodar('git ls-files -z', { cwd: CASA, tempoMaximo: 60000 })
    const arquivos = r.saida.split('\0').filter((f) => f && !/^(specs|lixeira)\//.test(f) && !/\.(png|jpe?g|woff2?|otf|ttf|mp4|webp|gif|pdf|ico)$/i.test(f))
    if (arquivos.length < 100) return `só ${arquivos.length} arquivos rastreados: a varredura não mediu`
    const velhos = []
    for (const f of arquivos) {
      const caminho = join(CASA, f)
      if (!existsSync(caminho)) continue
      const texto = readFileSync(caminho, 'utf8')
      if (/\.claude\/skills\/fundacao\b|`\/fundacao`|skill \/fundacao/.test(texto)) velhos.push(f)
    }
    return velhos.length ? `citam a skill antiga: ${velhos.join(', ')}` : null
  })

  // O manifesto se regera a cada mudança: carimbar o mexido com a versão de
  // antes faria a release sair com ele no número velho.
  await caso('D13 · arquivo mexido fica em "próxima" até a release, e a release carimba o número', async () => {
    const { montarManifesto, PROXIMA, fontesDaFundacao } = await import(pathToFileURL(join(AQUI, 'gerar-manifesto.mjs')).href)
    const rel = fontesDaFundacao()[0]
    const mexido = { versao: '2.0.0', arquivos: { [rel]: { sha: 'outro', mudouEm: '1.0.0' } } }
    const entre = montarManifesto('2.0.0', mexido).arquivos[rel].mudouEm
    const naRelease = montarManifesto('2.1.0', { ...mexido, arquivos: { [rel]: { sha: 'outro', mudouEm: PROXIMA } } }, { release: true }).arquivos[rel].mudouEm
    if (entre !== PROXIMA || naRelease !== '2.1.0') return `entre releases: ${entre}; na release: ${naRelease}`
    // O caminho de verdade: o kit.json já regerado (o sha é o do disco), o
    // arquivo em "próxima", e só então a release.
    const sha = montarManifesto('2.0.0', null).arquivos[rel].sha
    const regerado = montarManifesto('2.1.0', { versao: '2.0.0', arquivos: { [rel]: { sha, mudouEm: PROXIMA } } }, { release: true }).arquivos[rel].mudouEm
    return regerado === '2.1.0' ? null : `o arquivo já regerado em "próxima" ficou em ${regerado} na release`
  })

  await caso('D11 · o tela instala o navegador SEM apagar os das outras versões do cache da máquina', async () => {
    // Medido: o `playwright install` limpa as versões que ele não usa do cache
    // compartilhado, e o Chromium de outra ferramenta da máquina some, com o
    // teste dela saindo verde sem medir.
    const tela = await import(pathToFileURL(join(KIT, 'conferido', 'portao', 'tela.mjs')).href)
    const env = tela.ambienteDaInstalacao?.({ CAMINHO: 'x' })
    if (!env) return 'o tela.mjs não expõe o ambiente da instalação'
    if (env.PLAYWRIGHT_SKIP_BROWSER_GC !== '1') return `instala sem PLAYWRIGHT_SKIP_BROWSER_GC=1: ${JSON.stringify(env)}`
    return env.CAMINHO === 'x' ? null : 'o ambiente da instalação perdeu as variáveis de fora'
  })

  await caso('D9 · os projetos com a fundação instalada, e em que versão (nota, nunca vermelho)', () => {
    const achados = []
    const base = join(CASA, 'projetos-pessoais')
    if (!existsSync(base)) return null
    for (const nome of readdirSync(base)) {
      for (const sub of ['', 'produto']) {
        const m = join(base, nome, sub, 'fundacao', 'fundacao.json')
        if (!existsSync(m)) continue
        // ⚠️ Só nota: o estado de outro repositório não deixa o portão da casa
        // vermelho. Quem reprova manifesto quebrado ou `fixado` sem razão é o
        // conferidor `fundacao`, no portão do próprio projeto.
        let dados
        try { dados = JSON.parse(readFileSync(m, 'utf8')) } catch (e) { achados.push(`${nome}: fundacao.json ilegível (${e.message})`); continue }
        const semRazao = dados.fixado && String(dados.fixado.razao ?? '').trim().length < 5 ? ', fixado sem razão' : ''
        achados.push(`${nome}${sub ? `/${sub}` : ''} na ${dados.versao}${semRazao}`)
      }
    }
    console.log(`      · ${achados.length ? achados.join(' · ') : 'nenhum projeto com a fundação ainda'}`)
    return null
  })
}

// ───────────────────────────────────────── M · a troca de marca

async function blocoM () {
  console.log('\nM · a troca de marca')
  // Outra paleta da entrevista passa; a mesma marca, com um canal estragado à mão, reprova.
  const PALETA = { primaria: '#c2410c', fundo: '#fffaf5', texto: '#1c1917' }
  for (const [nome, espera, cita] of [['laranja sobre creme', 0, null], ['ruim', 1, /contraste/]]) {
    await caso(`M · a marca do projeto com a paleta "${nome}": ${espera === 0 ? 'passa' : 'reprova nomeando o par'}`, () => {
      const raiz = projetoNovo()
      try {
        instalar(raiz, { trilha: 'app', cores: PALETA, aviso: calado })
        if (nome === 'ruim') {
          const estrago = readFileSync(join(ESQUELETO, 'fixtures', 'marcas', 'ruim.css'), 'utf8')
          writeFileSync(join(raiz, 'src/styles/tokens.css'), `${le(raiz, 'src/styles/tokens.css')}\n${estrago}`)
        }
        const r = conferidor(raiz, 'marca')
        if (r.saiu !== espera) return `saiu ${r.saiu}:\n${r.saida}`
        return !cita || cita.test(r.saida) ? null : `não citou ${cita}:\n${r.saida}`
      } finally { apagar(raiz, { prazoMs: 12000 }) }
    })
  }
}

// ───────────────────────────────────────── fim

async function principal () {
  const vigiado = '.claude/skills/novo-projeto/esqueleto identidade/web'
  const antes = rodar(`git status --porcelain -- ${vigiado}`, { cwd: CASA, tempoMaximo: 30000 }).saida
  const inicio = Date.now()
  console.log('teste da fundação')
  await blocoA()
  await blocoC()
  await blocoD()
  await blocoM()
  if (process.argv.includes('--sem-build')) {
    pulado('B · o projeto de verdade, fora do workspace', 'rodou com --sem-build; o bloco B roda inteiro na release')
  } else {
    const { blocoB } = await import(pathToFileURL(join(AQUI, 'bloco-b.mjs')).href)
    await blocoB({ caso, pulado, instalar, ESQUELETO, CASA })
  }

  await caso('D10 · nada vazou para o repositório', () => {
    const depois = rodar(`git status --porcelain -- ${vigiado}`, { cwd: CASA, tempoMaximo: 30000 }).saida
    return depois === antes ? null : `o estado do git mudou durante o teste:\nantes:\n${antes}\ndepois:\n${depois}`
  })

  console.log('\n────────────────────────────────────────')
  for (const p of pulados) console.log(`⏭ ${p.nome} — ${p.razao}`)
  const segundos = Math.round((Date.now() - inicio) / 1000)
  if (ruim > 0) {
    console.log(`${pinta('✗', 'vermelho')} ${ruim} caso(s) reprovaram, ${ok} passaram (${segundos}s).`)
    process.exit(1)
    return
  }
  if (!process.argv.includes('--sem-build')) {
    writeFileSync(join(KIT, '.ultima-prova.json'), `${JSON.stringify({ quando: new Date().toISOString(), casos: ok, conteudo: impressaoDoKit() }, null, 2)}\n`)
  }
  console.log(`${pinta('✅', 'verde')} a fundação: ${ok} caso(s), todos verdes${pulados.length ? `, ${pulados.length} pulado(s)` : ''} (${segundos}s).`)
  process.exit(0)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  principal()
}
