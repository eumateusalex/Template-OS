// O bloco B do teste da fundação: um projeto de verdade, FORA do workspace.
//
// Ele é o que prova as duas promessas que nenhuma suíte de unidade prova:
// que o projeto roda sem a casa e que o portão
// inteiro fecha num projeto recém-criado, com build, lint, formatação, os
// conferidores da fábrica e da fundação, e a tela no navegador.
//
// ⚠️ Precisa de rede (npm ci, e o `shadcn --diff` do `auditar-ui`) e leva de
// 5 a 10 minutos. Sem rede, pula COM a razão; o teste inteiro, que é a régua
// da release, só grava a prova quando este bloco rodou verde.
//
// ⚠️ A fixture `fixtures/app-minimo/` guarda o lockfile, e os dez componentes
// do registry chegam pelo instalador das peças de terceiro, conferidos pela
// impressão do dia em que a versão saiu: `npm ci` precisa de lockfile, e o
// `shadcn add` puxaria a versão do registry de hoje, não a da release. Subiu
// versão de dependência na semente, regenera a fixture no mesmo gesto (a
// receita está no LEIA-ME.md).

import { cpSync, existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawn } from 'node:child_process'

import { criar, apagar } from '../kit/conferido/lib/temporaria.mjs'
import { rodar } from '../kit/conferido/lib/runner.mjs'
import { razao, sobre, rgbDe } from '../../../../../scripts/marca/derivar.mjs'
import { MEDIDAS_NEUTRAS } from './gerar-marca.mjs'

const calado = () => {}
const barra = (p) => p.split('\\').join('/')

/** Todo arquivo de texto do projeto, fora das pastas geradas. */
function textosDo (raiz, rel = '') {
  const achados = []
  for (const item of readdirSync(join(raiz, rel), { withFileTypes: true })) {
    if (['node_modules', '.git', '.next', 'test-results', 'playwright-report', 'coverage'].includes(item.name)) continue
    const r = rel ? `${rel}/${item.name}` : item.name
    if (item.isDirectory()) achados.push(...textosDo(raiz, r))
    else if (!/\.(woff2|png|jpg|ico)$/.test(item.name) && statSync(join(raiz, r)).size < 2_000_000) achados.push(r)
  }
  return achados
}

/** Sobe o build servido como no Docker, roda o trabalho com a URL da vitrine e derruba o servidor. */
async function comVitrine (raiz, trabalho) {
  const porta = '3118'
  const servidor = spawn(process.execPath, ['tela/servir.mjs', porta], { cwd: raiz, stdio: 'ignore' })
  try {
    const url = `http://127.0.0.1:${porta}/vitrine`
    for (let i = 0; i < 60; i += 1) {
      try { if ((await fetch(url)).ok) break } catch { /* silêncio declarado: o servidor ainda está subindo; a volta seguinte tenta de novo */ }
      await new Promise((ok) => setTimeout(ok, 500))
    }
    return await trabalho(url)
  } finally {
    servidor.kill()
  }
}

// O que o navegador calcula na vitrine: o raio do botão, do campo e da área de
// texto, e a fonte de um .destaque e de um <code> postos na página. O script
// mora fora do projeto e carrega o Playwright DELE.
const MEDIR_A_FORMA = `import { createRequire } from 'node:module'
const [raiz, url] = process.argv.slice(2)
const { chromium } = createRequire(raiz + '/package.json')('@playwright/test')
const navegador = await chromium.launch()
try {
  const pagina = await navegador.newPage()
  await pagina.goto(url)
  console.log(JSON.stringify(await pagina.evaluate(() => {
    const raio = (s) => getComputedStyle(document.querySelector(s)).borderTopLeftRadius
    const letra = (tag, classe) => {
      const e = document.createElement(tag)
      if (classe) e.className = classe
      e.textContent = 'prova'
      document.body.append(e)
      const c = getComputedStyle(e)
      return { familia: c.fontFamily, estilo: c.fontStyle }
    }
    return { botao: raio('[data-slot="button"]'), campo: raio('[data-slot="input"]'), area: raio('[data-slot="textarea"]'), destaque: letra('span', 'destaque'), codigo: letra('code') }
  })))
} finally { await navegador.close() }
`

async function medirAForma (raiz) {
  const pasta = mkdtempSync(join(tmpdir(), 'fundacao-forma-'))
  try {
    writeFileSync(join(pasta, 'medir.mjs'), MEDIR_A_FORMA)
    return await comVitrine(raiz, (url) => {
      const r = rodar(`node "${barra(join(pasta, 'medir.mjs'))}" "${barra(raiz)}" ${url}`, { cwd: raiz, tempoMaximo: 120000 })
      if (r.saiu !== 0) return { erro: r.saida.slice(-600) }
      return JSON.parse(r.saida.trim().split('\n').pop())
    })
  } finally { rmSync(pasta, { recursive: true, force: true }) }
}

/** Fotografa a vitrine servida. */
async function fotografar (raiz, destino) {
  return comVitrine(raiz, async (url) => {
    mkdirSync(destino, { recursive: true })
    const fotos = []
    for (const [nome, tamanho] of [['vitrine-1280.png', '1280,900'], ['vitrine-390.png', '390,844']]) {
      const r = rodar(`npx playwright screenshot --full-page --wait-for-timeout=1500 --viewport-size=${tamanho} ${url} "${barra(join(destino, nome))}"`, { cwd: raiz, tempoMaximo: 120000 })
      if (r.saiu !== 0) return `a foto ${nome} falhou:\n${r.saida.slice(-600)}`
      fotos.push(nome)
    }
    if (fotos.length !== 2) return 'faltou foto'
    console.log(`      · as fotos para o olho estão em ${barra(destino)}`)
    return null
  })
}

export async function blocoB ({ caso, pulado, instalar, ESQUELETO, CASA }) {
  console.log('\nB · o projeto de verdade, fora do workspace')
  if (rodar('npm ping', { tempoMaximo: 30000 }).saiu !== 0) {
    pulado('B · o projeto de verdade', 'sem rede: o npm ping falhou, e o bloco precisa do npm ci')
    return
  }

  const raiz = criar('fundacao-b-')
  const inicio = Date.now()
  try {
    writeFileSync(join(raiz, 'CLAUDE.md'), '# Projeto do bloco B\n\nO guia do projeto.\n')
    writeFileSync(join(raiz, 'briefing.md'), '# Briefing\n')
    writeFileSync(join(raiz, '.gitignore'), 'node_modules/\n')
    rodar('git init -q', { cwd: raiz, tempoMaximo: 30000 })

    // A marca do projeto com uma FONTE EM ARQUIVO (a Inter, em fixtures/fontes/,
    // que o instalador baixa): com a do sistema, o teste da fonte pula, e o ramo que
    // carrega a fonte no navegador nunca seria medido.
    const fontes = join(ESQUELETO, 'fixtures', 'fontes')
    const fonte = { tipo: 'arquivo', regular: join(fontes, 'inter-latin-400.woff2'), negrito: join(fontes, 'inter-latin-700.woff2'), nome: 'Fonte da Prova' }
    // 🚨 Uma marca DURA, de propósito: o texto é a própria primária (é o que a
    // marca do workspace dá quando a principal segura texto), então qualquer
    // texto sobre a primária pela metade reprova no axe da tela. Com a marca
    // neutra esse defeito passava. O acento é um laranja abaixo de 4,5:1 sobre
    // o fundo: o site o leva no tom mais perto que passa.
    const cores = { primaria: '#4a5a2a', fundo: '#f3ead6', texto: '#4a5a2a', acento: '#c4622d' }
    await caso('B0 · a marca do bloco B é dura: o texto sobre a primária a 50% fica abaixo de 4,5:1', () => {
      const x = razao(cores.texto, sobre({ ...rgbDe(cores.primaria), a: 0.5 }, cores.fundo))
      return x < 4.5 ? null : `o texto sobre a primária a 50% dá ${x.toFixed(2)}:1: a marca não mede o que promete`
    })
    // O lock vem da INSTALAÇÃO, não de uma cópia aqui: o teste mede o caminho
    // que o projeto de verdade percorre. Daqui só vêm os dez do registry, que
    // no projeto chegam pelo `shadcn add` (rede e registry do dia).
    // A forma da marca também: botão e campo em pílula, o destaque em itálico
    // e a mono, que o B6a mede no navegador.
    const forma = { medidas: { ...MEDIDAS_NEUTRAS, pilula: true }, destaque: { tipo: 'sistema', familia: ['Georgia', 'serif'], estilo: 'italic' }, mono: { tipo: 'sistema', familia: ['Courier New', 'monospace'] } }
    await caso('B1 · instala nas duas partes (fábrica e fundação), com a marca dura, uma fonte em arquivo, a forma da marca e o lock testado, e traz a fixture do registry', () => {
      if (instalar(raiz, { trilha: 'app', cores, fonte, ...forma, aviso: calado }) !== 0) return 'a instalação falhou'
      if (!existsSync(join(raiz, 'package-lock.json'))) return 'a instalação não trouxe o package-lock.json'
      const fixture = join(ESQUELETO, 'fixtures', 'app-minimo')
      cpSync(join(fixture, 'src'), join(raiz, 'src'), { recursive: true })
      return existsSync(join(raiz, 'src/components/ui/field.tsx')) ? null : 'a fixture não trouxe os componentes'
    })

    await caso('B2 · o projeto não aponta para a casa: nenhum caminho da casa, nenhum ../../../', () => {
      const casa = barra(CASA)
      const culpados = textosDo(raiz).filter((rel) => {
        const t = readFileSync(join(raiz, rel), 'utf8')
        return t.includes(casa) || t.includes(CASA) || /\.\.\/\.\.\/\.\.\//.test(t)
      })
      return culpados.length ? `apontam para fora do projeto: ${culpados.join(', ')}` : null
    })

    await caso('B3 · npm ci com o lockfile que a instalação trouxe', () => {
      const r = rodar('npm ci --no-audit --no-fund', { cwd: raiz, tempoMaximo: 600000 })
      return r.saiu === 0 ? null : r.saida.slice(-800)
    })

    // O portão local pula a auditoria (ela é do CI), e foi assim que um Next com aviso
    // crítico passou por baterias verdes: o CI do projeto recém-criado nasce vermelho.
    // Aqui ela roda como no CI, sobre o lock que a semente entrega
    await caso('B3a · a auditoria do CI passa no lock da semente (zero alta ou crítica em produção)', () => {
      const r = rodar('node fabrica/portao/dependencias.mjs --auditar', { cwd: raiz, tempoMaximo: 300000 })
      return r.saiu === 0 ? null : r.saida.split('\n').filter((l) => /auditoria|✗/.test(l)).slice(0, 6).join('\n') || r.saida.slice(-800)
    })

    await caso('B4 · os pisos nascem medidos: tamanho só com o field.tsx do registry, hex e paleta zero', () => {
      const r = rodar(`node "${barra(join(ESQUELETO, 'scripts', 'instalar.mjs'))}" --pisos "${barra(raiz)}"`, { cwd: raiz, tempoMaximo: 600000 })
      if (r.saiu !== 0) return r.saida.slice(-800)
      const m = JSON.parse(readFileSync(join(raiz, 'fundacao', 'fundacao.json'), 'utf8'))
      if (m.pisos.hex !== 0 || m.pisos.paleta !== 0) return `pisos da marca: ${JSON.stringify(m.pisos)}`
      const tamanho = /tamanho:\s*(\d+)/.exec(readFileSync(join(raiz, 'fabrica', 'stack.mjs'), 'utf8'))?.[1]
      return tamanho === '1' ? null : `piso de tamanho ${tamanho}: alguma semente passou do teto de indentação`
    })

    await caso('B5 · o portão inteiro fecha verde, build e tela inclusive', () => {
      rodar('git add -A', { cwd: raiz, tempoMaximo: 60000 })
      const r = rodar('npm run portao', { cwd: raiz, tempoMaximo: 1200000 })
      const fechou = /O portão fechou: (\d+) de (\d+)/.exec(r.saida)
      if (r.saiu !== 0 || !fechou || fechou[1] !== fechou[2]) {
        return r.saida.split('\n').filter((l) => /✗|REPROVOU|MORTO/.test(l)).slice(0, 12).join('\n') || r.saida.slice(-1200)
      }
      if (!/tela: \d+ item/.test(r.saida)) return 'o passo tela não mediu nada'
      // O teste da fonte, sozinho e nos dois tamanhos: com a fonte em arquivo ele
      // não pode pular (o do toque de 44px pula no computador, e é de propósito).
      const f = rodar('node node_modules/@playwright/test/cli.js test -g "a fonte da marca carregou" --reporter=list', { cwd: raiz, tempoMaximo: 300000, env: { ...process.env, PLAYWRIGHT_SKIP_BROWSER_GC: '1' } })
      return /\b2 passed\b/.test(f.saida) && !/skipped/.test(f.saida) ? null : `o teste da fonte não passou nos dois tamanhos:\n${f.saida.slice(-600)}`
    })

    // O tokens.css diz a pílula, o destaque e a mono; aqui é o navegador que
    // diz se a regra venceu o rounded-* do componente e a fonte do Tailwind
    await caso('B6a · no navegador, a forma da marca chega à vitrine: botão e campo em pílula, a área de texto não, o destaque e a mono', async () => {
      const r = await medirAForma(raiz)
      if (r.erro) return `a medição falhou:\n${r.erro}`
      const ruins = []
      if (r.botao !== '9999px' || r.campo !== '9999px') ruins.push(`botão ${r.botao} e campo ${r.campo}, e a marca pede pílula`)
      if (r.area === '9999px') ruins.push('a área de texto virou pílula')
      if (!/Georgia/.test(r.destaque.familia) || r.destaque.estilo !== 'italic') ruins.push(`o .destaque saiu em ${r.destaque.familia} ${r.destaque.estilo}`)
      if (!/Courier New/.test(r.codigo.familia)) ruins.push(`o <code> saiu em ${r.codigo.familia}`)
      return ruins.join(' | ') || null
    })

    // As fotos vão para fora do repositório, e o caminho sai impresso: versionadas, cada rodada
    // do bloco B deixaria a árvore suja com dois PNG novos
    await caso('B6 · as fotos da vitrine a 1280 e 390, para o olho', async () => {
      const destino = join(tmpdir(), 'fundacao-vitrine')
      const erro = await fotografar(raiz, destino)
      if (!erro) console.log(`      · as fotos da vitrine: ${destino}`)
      return erro
    })

    console.log(`      · o bloco B levou ${Math.round((Date.now() - inicio) / 1000)}s`)
  } finally {
    apagar(raiz, { prazoMs: 30000 })
  }
}
