#!/usr/bin/env node
// node .claude/skills/novo-projeto/esqueleto/scripts/instalar.mjs --alvo <dir> --trilha app|pagina [--marca projeto|casa]
//        [--primaria #hex] [--fundo #hex] [--texto #hex] [--fonte sistema|<arquivo>] [--fonte-negrito <arquivo>] [--nome-da-fonte <nome>]
//        [--sem-banco] [--sem-fabrica --portao <arquivo>] [--so tokens,fontes,tema] [--com-base]
// node .claude/skills/novo-projeto/esqueleto/scripts/instalar.mjs --conferir <dir>
// node .claude/skills/novo-projeto/esqueleto/scripts/instalar.mjs --atualizar <dir> [--forcar]
// node .claude/skills/novo-projeto/esqueleto/scripts/instalar.mjs --pisos <dir>
//
// A fundação entra no projeto por CÓPIA, com um manifesto (`fundacao/fundacao.json`)
// que diz de cada arquivo se ele é CONFERIDO (da casa, não se edita, sha) ou
// SEMENTE (do projeto desde o dia da cópia; o manifesto guarda só a origem).
//
// 🚨 O projeto roda sem a casa. Tudo que ele
// precisa vai para dentro dele; nada aponta para `../../../`.
//
// 🚨 Semente nunca se sobrescreve. Nem na instalação (arquivo que já existe
// fica), nem no --atualizar (semente editada só ganha aviso), nem com --forcar.
// `.gitignore`, `.gitattributes` e `CLAUDE.md` ganham LINHAS, nunca cópia por
// cima: o /novo-projeto já os escreveu.
//
// ⚠️ Quem chama é o /novo-projeto, DEPOIS do `git init`: sem `.git`
// próprio o instalador da fábrica acha o repositório da casa acima e não
// escreve o workflow do CI.

import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { join, dirname, resolve, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { impressao, lerManifesto } from '../kit/conferido/lib/casca.mjs'
import { rodar } from '../kit/conferido/lib/runner.mjs'
import { DEZ } from '../kit/conferido/portao/auditar-ui.mjs'
import { instalar as instalarFabrica } from '../../../fabrica/scripts/instalar.mjs'
import { hoje, lerKit } from './gerar-manifesto.mjs'
import { marcaDe, escreverMarca, opcoesDaMarca } from './gerar-marca.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const ESQUELETO = dirname(AQUI)
const CASA = resolve(ESQUELETO, '..', '..', '..', '..')
const KIT = join(ESQUELETO, 'kit')
const TEMPLATES = join(ESQUELETO, 'templates')
// O lock que o teste da fundação usa: a trilha app o leva ao projeto.
const LOCK = join(ESQUELETO, 'fixtures', 'app-minimo', 'package-lock.json')
// A marca do workspace na web (tokens, fontes, tema do shadcn), montada à mão
// em `identidade/web/` no formato de `fixtures/marca-web/`. Sem a pasta,
// `--marca casa` recusa. FUNDACAO_MARCA_WEB aponta outra pasta: os testes usam
// a marca de exemplo das fixtures.
export const webDaCasa = () => process.env.FUNDACAO_MARCA_WEB ?? join(CASA, 'identidade', 'web')

export const TRILHAS = ['app', 'pagina']
// 🚨 A marca padrão é a DO PROJETO, gerada das cores da entrevista. A do
// workspace só entra com `--marca casa`, e só se `identidade/web/` existir.
export const MARCAS = ['projeto', 'casa']
export const PARTES = ['tokens', 'fontes', 'tema']
// A lista dos dez tem um dono só: o conferidor que os audita.
export { DEZ }
const SO_DO_APP = ['auditar-ui', 'tela']
const DO_BANCO = (rel) => rel.startsWith('src/lib/banco/') || ['src/proxy.ts', 'src/lib/tipos/banco.ts', '.env.example'].includes(rel)
const AREA_DO_BANCO = ` * mutação registrada. A sessão do banco é segurança e dado de terceiro.
 */
export const AREAS_OBRIGATORIAS = ['src/lib/banco']`
const SEM_AREA = ` * mutação registrada. Sem banco, nenhuma ainda: a primeira que nascer entra aqui.
 */
export const AREAS_OBRIGATORIAS = []`
const BANCO_ABRE = 'fundação: banco (início)'
const BANCO_FECHA = 'fundação: banco (fim)'

/**
 * A semente sem o banco, para `--sem-banco`: sai o trecho entre as marcas
 * `fundação: banco (início)` e `(fim)`, e no `package.json` saem o Supabase e
 * o script dos tipos. Sem isso, o `next.config.ts` importaria um arquivo que
 * não veio, e o projeto sem banco nem compilaria.
 */
export function semOBanco (rel, texto) {
  if (rel === 'package.json') {
    const pacote = JSON.parse(texto)
    delete pacote.scripts?.['tipos:banco']
    for (const grupo of ['dependencies', 'devDependencies']) {
      for (const nome of Object.keys(pacote[grupo] ?? {})) if (nome.startsWith('@supabase/')) delete pacote[grupo][nome]
    }
    return `${JSON.stringify(pacote, null, 2)}\n`
  }
  const linhas = texto.split('\n')
  const fora = []
  let dentro = false
  for (const linha of linhas) {
    if (linha.includes(BANCO_ABRE)) { dentro = true; continue }
    if (linha.includes(BANCO_FECHA)) { dentro = false; continue }
    if (!dentro) fora.push(linha)
  }
  return fora.join('\n').replace(/\n{3,}/g, '\n\n')
}

const casaRel = (abs) => relative(CASA, abs).split('\\').join('/')

function arquivosDe (pasta, prefixo = '') {
  const achados = []
  if (!existsSync(pasta)) return achados
  for (const item of readdirSync(pasta, { withFileTypes: true })) {
    const rel = prefixo ? `${prefixo}/${item.name}` : item.name
    if (item.isDirectory()) achados.push(...arquivosDe(join(pasta, item.name), rel))
    else if (item.isFile()) achados.push(rel)
  }
  return achados.sort()
}

/**
 * O que se instala, de onde, e de que tipo, para estas opções.
 * @returns {{ destino: string, fonte: string, tipo: 'conferido'|'semente' }[]}
 */
export function planoDe ({ trilha, marca = 'projeto', semBanco = false, so = null, comBase = false, temComponentsJson = false }) {
  const plano = []
  const poe = (destino, fonte, tipo) => plano.push({ destino, fonte, tipo })

  for (const rel of arquivosDe(join(KIT, 'conferido'))) {
    const nome = rel.split('/').pop().replace(/\.mjs$/, '')
    if (trilha === 'pagina' && /^(portao|provas)\//.test(rel) && SO_DO_APP.includes(nome)) continue
    if (trilha === 'pagina' && rel === 'base.css' && !comBase) continue
    poe(`fundacao/${rel}`, join(KIT, 'conferido', rel), 'conferido')
  }

  const comTema = trilha === 'app' || temComponentsJson
  if (marca === 'casa') {
    // A marca da casa, conferida: o projeto não a edita, e ela chega pelo --atualizar.
    const WEB = webDaCasa()
    const partes = so ?? ['tokens', 'fontes', ...(comTema ? ['tema'] : [])]
    if (partes.includes('tokens')) poe('fundacao/tokens.css', join(WEB, 'tokens.css'), 'conferido')
    if (partes.includes('fontes')) {
      poe('fundacao/fontes.css', join(WEB, 'fontes.css'), 'conferido')
      for (const f of arquivosDe(join(WEB, 'fontes')).filter((x) => x !== 'origem.json')) poe(`public/fontes/${f}`, join(WEB, 'fontes', f), 'conferido')
    }
    if (partes.includes('tema')) poe('fundacao/tema-shadcn.css', join(WEB, 'tema-shadcn.css'), 'conferido')
  } else if (comTema) {
    // A marca do projeto: tokens, fontes e ícone são GERADOS (gerar-marca.mjs);
    // daqui só vem o mapa dos papéis do shadcn, que é dele desde o primeiro dia.
    poe('src/styles/tema-shadcn.css', join(TEMPLATES, 'tema.projeto.css'), 'semente')
  }

  if (trilha === 'app') {
    for (const rel of arquivosDe(join(KIT, 'semente', 'app'))) {
      if (semBanco && DO_BANCO(rel)) continue
      poe(rel, join(KIT, 'semente', 'app', rel), 'semente')
    }
    poe('src/styles/marca.css', join(TEMPLATES, `marca.${marca}.css`), 'semente')
    if (marca === 'casa') poe('src/app/icon.svg', join(TEMPLATES, 'icone.casa.svg'), 'semente')
  }
  return plano
}

/** Acrescenta um bloco a um arquivo, uma vez só, identificado pela primeira linha dele. */
function acrescentar (caminho, bloco, aviso, nome) {
  const marcaDoBloco = bloco.trim().split('\n')[0]
  const atual = existsSync(caminho) ? readFileSync(caminho, 'utf8') : ''
  if (atual.includes(marcaDoBloco)) return
  const separador = atual === '' || atual.endsWith('\n\n') ? '' : atual.endsWith('\n') ? '\n' : '\n\n'
  writeFileSync(caminho, `${atual}${separador}${bloco.trimEnd()}\n`, 'utf8')
  aviso(`  +  ${nome}: ganhou o bloco da fundação`)
}

/** O que um item instala: o arquivo da fonte, ou a semente sem o banco. */
function conteudoDe (item, semBanco) {
  const bytes = readFileSync(item.fonte)
  if (!semBanco || item.tipo !== 'semente') return bytes
  const texto = bytes.toString('utf8')
  if (item.destino !== 'package.json' && !texto.includes(BANCO_ABRE)) return bytes
  return Buffer.from(semOBanco(item.destino, texto), 'utf8')
}

/** A impressão do que o item instala, pela mesma régua do `impressao` da casca. */
function impressaoDe (item, semBanco) {
  const bytes = conteudoDe(item, semBanco)
  const normal = bytes.subarray(0, 8000).includes(0) ? bytes : Buffer.from(bytes.toString('utf8').split('\r\n').join('\n'), 'utf8')
  return createHash('sha256').update(normal).digest('hex')
}

function copiar (item, destinoAbs, semBanco) {
  mkdirSync(dirname(destinoAbs), { recursive: true })
  writeFileSync(destinoAbs, conteudoDe(item, semBanco))
}

function entradaDe (item, alvo, versao, semBanco) {
  const fonte = casaRel(item.fonte)
  if (item.tipo === 'conferido') return { tipo: 'conferido', sha: impressao(join(alvo, item.destino)), fonte }
  return { tipo: 'semente', origem: impressaoDe(item, semBanco), versaoOrigem: versao, fonte }
}

export function instalar (alvo, opcoes = {}) {
  const {
    trilha, marca = 'projeto', cores = {}, fonte = { tipo: 'sistema' }, semBanco = false, semFabrica = false,
    so = null, comBase = false, portao: portaoPedido = null, aviso = console.log
  } = opcoes
  if (!existsSync(alvo)) { aviso(`✗ o alvo ${alvo} não existe`); return 1 }
  if (!TRILHAS.includes(trilha)) { aviso(`✗ --trilha tem que ser ${TRILHAS.join(' ou ')}, e veio ${trilha}`); return 1 }
  if (!MARCAS.includes(marca)) { aviso(`✗ --marca tem que ser ${MARCAS.join(' ou ')}, e veio ${marca}`); return 1 }
  if (so && so.some((p) => !PARTES.includes(p))) { aviso(`✗ --so aceita ${PARTES.join(', ')}`); return 1 }
  if (marca === 'casa' && !existsSync(webDaCasa())) { aviso(`✗ --marca casa pede a marca de web do workspace em ${webDaCasa()}, e ela não existe (o template não a traz; o formato está em fixtures/marca-web/): use --marca projeto`); return 1 }
  if (existsSync(join(alvo, 'fundacao', 'fundacao.json'))) {
    aviso('  ·  a fundação já está instalada aqui. Para trazer a versão da casa, use --atualizar.')
    return 0
  }
  const portao = semFabrica ? portaoPedido : 'fabrica/stack.mjs'
  if (semFabrica && !portao) { aviso('✗ --sem-fabrica precisa de --portao <o arquivo do portão do projeto>, onde os conferidores vão entrar'); return 1 }
  if (semFabrica && !existsSync(join(alvo, portao))) { aviso(`✗ não achei ${portao}, o portão do projeto`); return 1 }

  const kit = lerKit()
  if (!kit) { aviso('✗ não achei o kit.json da fundação: rode o gerar-manifesto.mjs no workspace'); return 1 }
  const plano = planoDe({ trilha, marca, semBanco, so, comBase, temComponentsJson: existsSync(join(alvo, 'components.json')) })
  const faltam = plano.filter((i) => !existsSync(i.fonte)).map((i) => i.fonte)
  if (trilha === 'app' && !existsSync(LOCK)) faltam.push(LOCK)
  if (faltam.length) { aviso(`✗ a fonte da fundação está incompleta: ${faltam.map(casaRel).join(', ')}`); return 1 }
  // A marca do projeto se confere ANTES de qualquer arquivo: cor recusada não deixa meio kit.
  if (marca === 'projeto') {
    const conferida = marcaDe(cores, { fonte })
    if (!conferida.ok) { for (const e of conferida.erros) aviso(`✗ ${e}`); return 1 }
  }

  // 1 · os arquivos: conferido sempre, semente só onde o projeto ainda não tem
  let conferidos = 0
  let sementes = 0
  for (const item of plano) {
    const destino = join(alvo, item.destino)
    if (item.tipo === 'semente' && existsSync(destino)) continue
    copiar(item, destino, semBanco)
    if (item.tipo === 'conferido') conferidos += 1
    else sementes += 1
  }
  // 🚨 O lock que o teste da fundação usa vai junto: sem ele, o `npm install`
  // resolve as dependências indiretas do dia, e o projeto novo não é o que se
  // testou (o `@axe-core/playwright` pode puxar um `playwright-core` mais novo
  // que o do `@playwright/test`, e o `tipos` e o `build` reprovam). Não entra no
  // manifesto: é derivado do package.json, e o `npm install` o reescreve.
  const lock = join(alvo, 'package-lock.json')
  if (trilha === 'app' && !existsSync(lock)) writeFileSync(lock, readFileSync(LOCK))
  if (marca === 'projeto') {
    if (existsSync(join(alvo, 'src', 'styles', 'tokens.css'))) aviso('  ·  src/styles/tokens.css já existe: a marca do projeto ficou como estava')
    else if (escreverMarca(alvo, { cores, fonte, icone: trilha === 'app', aviso }) !== 0) return 1
  }

  // 2 · a fábrica, com o stack.mjs da trilha escrito ANTES (ela o respeita)
  if (!semFabrica) {
    const stack = join(alvo, 'fabrica', 'stack.mjs')
    if (!existsSync(stack)) {
      mkdirSync(dirname(stack), { recursive: true })
      const data = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date())
      let texto = readFileSync(join(TEMPLATES, `stack.${trilha}.mjs`), 'utf8').split('[DATA]').join(data)
      // Sem banco, a área que ele trazia não existe: declarada vazia, a fábrica
      // anota e segue; declarada, ela acusa "área vazia".
      if (semBanco) texto = texto.split(AREA_DO_BANCO).join(SEM_AREA)
      writeFileSync(stack, texto, 'utf8')
    }
    const codigo = instalarFabrica(alvo, { stack: 'node', aviso })
    if (codigo !== 0) return codigo
    acrescentar(join(alvo, '.gitignore'), readFileSync(join(TEMPLATES, 'gitignore.txt'), 'utf8'), aviso, '.gitignore')
    if (trilha === 'app') acrescentar(join(alvo, '.gitattributes'), readFileSync(join(TEMPLATES, 'gitattributes.txt'), 'utf8'), aviso, '.gitattributes')
    acrescentar(join(alvo, 'CLAUDE.md'), readFileSync(join(TEMPLATES, 'claude-trecho.md'), 'utf8'), aviso, 'CLAUDE.md')
  }

  // 3 · o manifesto, que é do projeto
  const arquivos = {}
  for (const item of plano) if (existsSync(join(alvo, item.destino))) arquivos[item.destino] = entradaDe(item, alvo, kit.versao, semBanco)
  const manifesto = {
    versao: kit.versao,
    data: hoje(),
    trilha,
    // `identidade`: o arquivo da identidade do projeto, quando ela existir fora
    // de src/styles/; o conferidor `marca` compara os canais com ele.
    marca: marca === 'projeto' ? { tipo: 'projeto', identidade: null } : { tipo: 'casa' },
    origem: { caminho: '.claude/skills/novo-projeto/esqueleto', tag: `fundacao-v${kit.versao}` },
    portao,
    // Onde o conferidor `marca` varre. Anda junto com o `CODIGO` do
    // `fabrica/stack.mjs`: pasta nova de código entra nos dois. Escrito aqui,
    // e não escondido no conferidor.
    codigo: ['src'],
    pisos: { hex: 0, paleta: 0 },
    pisosEm: hoje(),
    fixado: null,
    // As cores e a fonte não voltam aqui: moram em src/styles/, e são do projeto.
    opcoes: { trilha, marca, semBanco, semFabrica, so, comBase },
    arquivos
  }
  writeFileSync(join(alvo, 'fundacao', 'fundacao.json'), `${JSON.stringify(manifesto, null, 2)}\n`, 'utf8')

  aviso(`  +  fundação ${kit.versao}: ${conferidos} arquivo(s) conferido(s), ${sementes} semente(s), trilha ${trilha}, marca ${marca}`)
  if (trilha === 'app') {
    // Os mesmos comandos do SKILL.md, pelo caminho e sem `cd` (regra da casa).
    // Relativo quando o projeto está abaixo da pasta atual; senão, o caminho inteiro.
    const relativo = relative(process.cwd(), alvo).split('\\').join('/') || '.'
    const p = relativo.startsWith('..') ? `"${alvo.split('\\').join('/')}"` : relativo
    aviso('')
    aviso('  Próximos passos, com rede:')
    aviso(`    npm --prefix ${p} install`)
    aviso(`    npm --prefix ${p} exec -- shadcn add --yes --cwd ${p} ${DEZ.join(' ')}`)
    aviso(`    node .claude/skills/novo-projeto/esqueleto/scripts/instalar.mjs --pisos ${p}`)
    aviso(`    git -C ${p} add -A`)
    aviso(`    npm --prefix ${p} run portao`)
  }
  return 0
}

export function atualizar (alvo, { forcar = false, aviso = console.log } = {}) {
  const { manifesto, erro } = lerManifesto(alvo)
  if (erro) { aviso(`✗ ${erro}`); return 1 }
  const kit = lerKit()
  const plano = planoDe({ ...manifesto.opcoes, temComponentsJson: existsSync(join(alvo, 'components.json')) })
  const velhos = manifesto.arquivos ?? {}
  const semBanco = Boolean(manifesto.opcoes?.semBanco)

  const editados = plano.filter((i) => i.tipo === 'conferido' && velhos[i.destino] && existsSync(join(alvo, i.destino)) && impressao(join(alvo, i.destino)) !== velhos[i.destino].sha)
  if (editados.length && !forcar) {
    aviso('✗ arquivos conferidos foram EDITADOS neste projeto, e o --atualizar não passa por cima calado:')
    for (const i of editados) aviso(`    ${i.destino}`)
    aviso('  o ajuste do projeto mora fora de fundacao/; para restaurar mesmo assim: --forcar')
    return 1
  }

  const arquivos = {}
  for (const item of plano) {
    const destino = join(alvo, item.destino)
    const velho = velhos[item.destino]
    if (item.tipo === 'conferido') {
      copiar(item, destino, semBanco)
      arquivos[item.destino] = entradaDe(item, alvo, kit.versao, semBanco)
      continue
    }
    const origemNova = impressaoDe(item, semBanco)
    if (!existsSync(destino)) {
      if (velho) { aviso(`  ·  ${item.destino}: a semente saiu do projeto, e fica de fora`); continue }
      copiar(item, destino, semBanco)
      arquivos[item.destino] = entradaDe(item, alvo, kit.versao, semBanco)
      aviso(`  +  ${item.destino}: semente nova nesta versão`)
      continue
    }
    if (!velho) { arquivos[item.destino] = entradaDe(item, alvo, kit.versao, semBanco); continue }
    if (origemNova === velho.origem) { arquivos[item.destino] = velho; continue }
    if (impressao(destino) === velho.origem) {
      copiar(item, destino, semBanco)
      arquivos[item.destino] = entradaDe(item, alvo, kit.versao, semBanco)
      aviso(`  ↻  ${item.destino}: semente intocada, trazida para a ${kit.versao}`)
    } else {
      arquivos[item.destino] = velho
      aviso(`  !  ${item.destino}: a semente é sua e foi editada, e a fonte mudou (a sua é da ${velho.versaoOrigem}). Nada foi tocado. Compare:`)
      aviso(`       git -C "${CASA}" diff fundacao-v${velho.versaoOrigem} -- ${casaRel(item.fonte)}`)
    }
  }
  for (const rel of Object.keys(velhos)) {
    if (!plano.some((i) => i.destino === rel)) aviso(`  ·  ${rel}: saiu da fundação nesta versão; apague se não for usar`)
  }
  writeFileSync(join(alvo, 'fundacao', 'fundacao.json'), `${JSON.stringify({ ...manifesto, versao: kit.versao, data: hoje(), arquivos }, null, 2)}\n`, 'utf8')
  aviso(`✅ fundação atualizada para a ${kit.versao}`)
  return 0
}

/**
 * Mede os pisos das catracas com os PRÓPRIOS conferidores e grava: os da
 * fábrica no `fabrica/stack.mjs`, os da marca no `fundacao.json`. Proxy não é
 * medida.
 */
export async function medirPisos (alvo, { aviso = console.log } = {}) {
  const data = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(new Date())
  const stack = join(alvo, 'fabrica', 'stack.mjs')
  if (existsSync(stack)) {
    const r = rodar('node fabrica/medir-pisos.mjs', { cwd: alvo, tempoMaximo: 300000 })
    if (r.saiu !== 0) { aviso(`✗ o medir-pisos da fábrica falhou:\n${r.saida}`); return 1 }
    let texto = readFileSync(stack, 'utf8')
    for (const m of r.saida.matchAll(/^\s+(\w+):\s*(\d+),/gm)) {
      texto = texto.replace(new RegExp(`(\\n\\s+${m[1]}:\\s*)\\d+(,?)\\s*//[^\\n]*`), (_x, antes, virgula) => `${antes}${m[2]}${virgula} // ${data} · medido por instalar.mjs --pisos`)
      aviso(`  ·  piso ${m[1]}: ${m[2]}`)
    }
    writeFileSync(stack, texto, 'utf8')
  }
  const { manifesto, erro } = lerManifesto(alvo)
  if (erro) { aviso(`✗ ${erro}`); return 1 }
  const marca = await import(`${pathToFileURL(join(alvo, 'fundacao', 'portao', 'marca.mjs')).href}?v=${Date.now()}`)
  const linhas = []
  marca.conferir(alvo, { manifesto: { ...manifesto, pisos: { hex: 0, paleta: 0 } } }, { escreve: (t) => linhas.push(String(t)) })
  const lido = (rotulo) => Number((linhas.join('\n').match(new RegExp(`${rotulo}[^\\n]*piorou:\\s*(\\d+)`)) ?? [0, 0])[1])
  manifesto.pisos = { hex: lido('hex fora dos tokens'), paleta: lido('classe da paleta') }
  manifesto.pisosEm = hoje()
  writeFileSync(join(alvo, 'fundacao', 'fundacao.json'), `${JSON.stringify(manifesto, null, 2)}\n`, 'utf8')
  aviso(`  ·  pisos da marca: hex ${manifesto.pisos.hex}, paleta ${manifesto.pisos.paleta} (${manifesto.pisosEm})`)
  return 0
}

async function principal () {
  const args = process.argv.slice(2)
  const pega = (b) => { const i = args.indexOf(b); return i !== -1 ? args[i + 1] : null }
  const tem = (b) => args.includes(b)

  if (pega('--conferir')) {
    const alvo = resolve(pega('--conferir'))
    // Sem shell: o caminho que chega pela linha de comando não vira texto de
    // comando.
    const r = spawnSync(process.execPath, [join(alvo, 'fundacao', 'portao', 'fundacao.mjs'), '--raiz', alvo, '--fonte', CASA], { cwd: alvo, encoding: 'utf8', timeout: 120000 })
    process.stdout.write(`${r.stdout ?? ''}${r.stderr ?? ''}`)
    process.exit(r.status ?? 1)
    return
  }
  if (pega('--atualizar')) { process.exit(atualizar(resolve(pega('--atualizar')), { forcar: tem('--forcar') })); return }
  if (pega('--pisos')) { process.exit(await medirPisos(resolve(pega('--pisos')))); return }

  const alvo = pega('--alvo')
  if (!alvo) {
    console.error('uso: instalar.mjs --alvo <dir> --trilha app|pagina [--marca projeto|casa] [--primaria #hex --fundo #hex --texto #hex] [--fonte sistema|<arquivo>] [--sem-banco] [--sem-fabrica --portao <arquivo>] [--so tokens,fontes,tema] [--com-base]')
    console.error('     instalar.mjs --conferir <dir> | --atualizar <dir> [--forcar] | --pisos <dir>')
    process.exit(2)
    return
  }
  process.exit(instalar(resolve(alvo), {
    trilha: pega('--trilha'),
    marca: pega('--marca') ?? 'projeto',
    ...opcoesDaMarca(pega),
    semBanco: tem('--sem-banco'),
    semFabrica: tem('--sem-fabrica'),
    so: pega('--so') ? pega('--so').split(',') : null,
    comBase: tem('--com-base'),
    portao: pega('--portao')
  }))
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  principal()
}
