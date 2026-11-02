// Prova do gerador da marca do projeto (`scripts/gerar-marca.mjs`).
//
// Por que existe: a marca de um projeto novo sai da marca do workspace ou da
// entrevista (três cores e uma fonte). O gerador deriva o resto
// (superfície, borda, texto apagado, o registro escuro, o erro), e uma conta
// errada aqui entrega um projeto com texto que não se lê já no primeiro dia.
// A régua do contraste é a MESMA do conferidor `marca` (`contrasteDoTema`).
//
// Uso:  node .claude/skills/novo-projeto/esqueleto/testes/teste-marca.mjs
// mutação: scripts/marca/derivar.mjs · "if (razao(primaria, fundo) < MINIMO) {" → "if (false) {" · pega em 01/01/2000
// mutação: scripts/marca/derivar.mjs · "if (fundos.every((f) => razao(c, f) >= minimo)) return c" → "return c" · pega em 01/01/2000
// mutação: scripts/marca/derivar.mjs · "tintas.every((t) => razao(c, sobre({ ...c, a: t }, f)) >= FOLGA)" → "true" · pega em 01/01/2000
// mutação: .claude/skills/novo-projeto/esqueleto/scripts/gerar-marca.mjs · "const iconeDoProjeto = existsSync(destinos.icone) && !readFileSync(destinos.icone, 'utf8').startsWith(CABECALHO_DO_ICONE)" → "const iconeDoProjeto = existsSync(destinos.icone)" · pega em 01/01/2000
// mutação: .claude/skills/novo-projeto/esqueleto/scripts/gerar-marca.mjs · ".sort((a, b) => a.razao - b.razao)" → ".sort((a, b) => b.razao - a.razao)" · pega em 01/01/2000
// mutação: .claude/skills/novo-projeto/esqueleto/scripts/gerar-marca.mjs · "${REGRAS_DE_FONTE}${pilula ? REGRA_DA_PILULA : ''}" → "${REGRAS_DE_FONTE}" · pega em 02/11/2026
// mutação: .claude/skills/novo-projeto/esqueleto/scripts/gerar-marca.mjs · "--forma-pilula: ${pilula ? 1 : 0};" → "--forma-pilula: 0;" · pega em 02/11/2026
// mutação: .claude/skills/novo-projeto/esqueleto/scripts/gerar-marca.mjs · "const daFace = fonte.estiloDaFace ?? estilo" → "const daFace = estilo" · pega em 02/11/2026
// mutação: .claude/skills/novo-projeto/esqueleto/scripts/gerar-marca.mjs · "const papeis = ['fonte', 'destaque', 'mono'].filter(" → "const papeis = ['fonte'].filter(" · pega em 02/11/2026
// mutação: .claude/skills/novo-projeto/esqueleto/scripts/gerar-marca.mjs · "  --f-destaque-estilo: ${fontes.destaque.estilo};" → "  --f-destaque-estilo: normal;" · pega em 02/11/2026
// mutação: .claude/skills/novo-projeto/esqueleto/scripts/gerar-marca.mjs · "    pilula: r.raio.pilula === true," → "    pilula: false," · pega em 02/11/2026
//
// ⚠️ A exigência do texto de erro a 90% (o aviso) também não tem mutação: na
// matriz e na grade, a do fundo tingido (o botão) é sempre mais dura e decide
// antes. Ela fica porque é o contexto em que o aviso é pintado (medido: a
// mutação que a tira sobrevive).
//
// ⚠️ A rede final do gerador (o `contrasteDoTema` sobre o que ele acabou de
// derivar) não tem mutação registrada, e é de propósito: nenhuma das 180
// paletas da grade a alcança, porque a derivação já passa sozinha. Ela existe
// para a cor que ninguém testou, e a mutação que a tira sobrevive (medido).

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

import { marcaDe, escreverMarca, NEUTRA, opcoesDaMarca, marcaDoWorkspace, comFonteBaixada } from '../scripts/gerar-marca.mjs'
import { lerMolde } from '../../../../../scripts/marca/marca.mjs'
import { contrasteDoTema, hexForaDeComentario, mapaDoArquivo, corDe, razao, sobre, resolverTexto } from '../kit/conferido/lib/cor.mjs'
import { hexDe } from '../../../../../scripts/marca/derivar.mjs'
import { criar, apagar } from '../kit/conferido/lib/temporaria.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const ESQUELETO = dirname(AQUI)
const TEMA = readFileSync(join(ESQUELETO, 'templates', 'tema.projeto.css'), 'utf8')
const CASA = resolve(ESQUELETO, '..', '..', '..', '..')
// A fonte de prova do .otf mora nas fixtures do esqueleto (o instalador das
// peças de terceiro a baixa): apontada para fora dele, esta prova viraria
// PULADO calada numa cópia do esqueleto
const SEM_FONTE = `a fonte de prova não está instalada (fixtures/fontes/): rode \`node scripts/terceiros/instalar.mjs --so novo-projeto-fontes\` na raiz do workspace`
const OTF_DE_PROVA = join(ESQUELETO, 'fixtures', 'fontes', 'texgyreheros-regular.otf')

let ok = 0
let falhou = 0
let pulou = 0

function caso (nome, trabalho) {
  let erro
  try { erro = trabalho() } catch (e) { erro = `explodiu: ${e.stack}` }
  if (erro === 'PULADO') { console.log(`  ⏭ ${nome}`); pulou += 1; return }
  if (erro) { console.log(`  ❌ ${nome}\n     ${erro}`); falhou += 1 } else { console.log(`  ✅ ${nome}`); ok += 1 }
}

async function casoAssincrono (nome, trabalho) {
  let erro
  try { erro = await trabalho() } catch (e) { erro = `explodiu: ${e.stack}` }
  if (erro) { console.log(`  ❌ ${nome}\n     ${erro}`); falhou += 1 } else { console.log(`  ✅ ${nome}`); ok += 1 }
}

/** Os pares que não passam, lidos pela conta do conferidor `marca`. */
function paresRuins (tokens) {
  const pares = contrasteDoTema({ tokens, tema: TEMA })
  if (pares.length < 20) return [`só ${pares.length} pares medidos: a conta não leu o tema`]
  return pares.filter((p) => !p.ok).map((p) => `${p.escopo}: ${p.texto} sobre ${p.fundo} = ${p.razao ?? 'não medido'}`)
}

const canal = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')

/** HSL em hex, para varrer o círculo de cores. */
function hexDeHsl (h, s, l) {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100)
  const f = (n) => {
    const k = (n + h / 30) % 12
    const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(c * 255).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

// Os valores da marca do workspace que um projeto novo nunca recebe sem pedir.
// Nos testes, a marca do workspace é a de exemplo das fixtures
// (fixtures/marca-web), a mesma lista do `teste-fundacao.mjs`.
const DA_CASA = ['37,99,235', '202,138,4', "'Inter'", 'inter-latin-400', '#2563eb', 'cubic-bezier(0.2, 0.65, 0.2, 1)']

// Canal com ou sem espaço depois da vírgula é o mesmo canal (o Prettier põe o espaço).
const semEspaco = (s) => s.replace(/,\s+/g, ',')

console.log('\n  teste da marca do projeto')

caso('a marca neutra passa em todo par, no claro e no escuro, sem valor nenhum da casa', () => {
  const m = marcaDe()
  if (!m.ok) return m.erros.join(' | ')
  const ruins = paresRuins(m.tokens)
  if (ruins.length) return ruins.join(' | ')
  const texto = semEspaco(`${m.tokens}\n${m.fontes}\n${m.icone}`)
  const achados = DA_CASA.filter((v) => texto.includes(semEspaco(v)))
  return achados.length ? `a marca neutra traz valor da casa: ${achados.join(', ')}` : null
})

const MATRIZ = [
  ['laranja sobre creme', { primaria: '#c2410c', fundo: '#fffaf5', texto: '#1c1917' }],
  ['petróleo sobre branco', { primaria: '#0f766e', fundo: '#ffffff', texto: '#0f172a' }],
  ['limão sobre preto', { primaria: '#a3e635', fundo: '#0a0a0a', texto: '#fafafa' }],
  ['vinho sobre papel', { primaria: '#7c2d12', fundo: '#f5f0e6', texto: '#292524' }],
  ['roxo sobre branco', { primaria: '#6d28d9', fundo: '#ffffff', texto: '#111827' }],
  ['azul-marinho sobre gelo', { primaria: '#1e3a8a', fundo: '#f8fafc', texto: '#020617' }]
]
for (const [nome, cores] of MATRIZ) {
  caso(`a paleta "${nome}": todo par em 4,5:1, e a primária é a dele, sem ajuste`, () => {
    const m = marcaDe(cores)
    if (!m.ok) return m.erros.join(' | ')
    const ruins = paresRuins(m.tokens)
    if (ruins.length) return ruins.join(' | ')
    const raiz = mapaDoArquivo(m.tokens).raiz
    if (raiz.get('--c-primaria') !== canal(cores.primaria)) return `a primária virou ${raiz.get('--c-primaria')}, e ele deu ${canal(cores.primaria)}`
    if (raiz.get('--c-fundo') !== canal(cores.fundo)) return `o fundo virou ${raiz.get('--c-fundo')}`
    const hexes = hexForaDeComentario(m.tokens)
    return hexes.length ? `hex nos tokens: ${hexes.map((h) => h.hex).join(', ')}` : null
  })
}

caso('a grade de 180 paletas: ou passa em todo par, ou recusa a cor DELE, nunca um par derivado', () => {
  const fundos = ['#ffffff', '#fafaf9', '#fef3c7', '#0a0a0a', '#1e1e1e']
  const problemas = []
  let passaram = 0
  for (const fundo of fundos) {
    const texto = ['#0a0a0a', '#1e1e1e'].includes(fundo) ? '#f5f5f5' : '#111111'
    for (let h = 0; h < 360; h += 30) {
      for (const l of [30, 50, 70]) {
        const primaria = hexDeHsl(h, 70, l)
        const m = marcaDe({ primaria, fundo, texto })
        if (!m.ok) {
          if (m.erros.some((e) => /defeito do gerador/.test(e))) problemas.push(`${primaria} sobre ${fundo}: ${m.erros[0]}`)
          continue
        }
        passaram += 1
        const ruins = [...paresRuins(m.tokens), ...erroQueNaoSeLe(m.tokens)]
        if (ruins.length) problemas.push(`${primaria} sobre ${fundo}: ${ruins[0]}`)
      }
    }
  }
  if (passaram < 60) return `só ${passaram} das 180 passaram: a grade não mediu o bastante`
  return problemas.length ? problemas.slice(0, 4).join(' | ') : null
})

/**
 * O vermelho de erro como os componentes do registry o PINTAM, que não é o par
 * do tema: o aviso usa `text-destructive/90` sobre o cartão, e o botão
 * destrutivo põe o texto vermelho sobre o próprio vermelho a 10% e 20% (no
 * escuro, 20% e 30%). O axe da vitrine reprova o par que não se lê.
 */
function erroQueNaoSeLe (tokens) {
  const r = mapaDoArquivo(tokens).raiz
  const c = (n) => corDe(r.get(n))
  const ruins = []
  const cenarios = [
    ['claro', c('--c-erro'), [c('--c-fundo'), c('--c-superficie')], [0.1, 0.2]],
    ['escuro', c('--c-erro-escuro'), [c('--c-fundo-escuro'), sobre({ ...c('--c-texto-escuro'), a: 0.06 }, c('--c-fundo-escuro'))], [0.2, 0.3]]
  ]
  for (const [escopo, erro, fundos, tintas] of cenarios) {
    for (const f of fundos) {
      const pares = [
        ['o texto', erro, f],
        ['o texto a 90%', sobre({ ...erro, a: 0.9 }, f), f],
        ...tintas.map((t) => [`o texto sobre o vermelho a ${t * 100}%`, erro, sobre({ ...erro, a: t }, f)])
      ]
      for (const [nome, frente, fundo] of pares) {
        const x = razao(frente, fundo)
        if (x < 4.5) ruins.push(`${escopo}: ${nome} dá ${x.toFixed(2)}:1`)
      }
    }
  }
  return ruins
}

caso('o vermelho de erro se lê do jeito que o registry o pinta, em toda paleta da matriz e na neutra', () => {
  const ruins = []
  for (const [nome, cores] of [['neutra', NEUTRA], ...MATRIZ]) {
    const m = marcaDe(cores)
    if (!m.ok) { ruins.push(`${nome}: ${m.erros[0]}`); continue }
    for (const r of erroQueNaoSeLe(m.tokens)) ruins.push(`${nome} · ${r}`)
  }
  return ruins.length ? ruins.slice(0, 5).join(' | ') : null
})

caso('a primária sem contraste com o fundo é recusada, com a sugestão mais perto que passa', () => {
  const m = marcaDe({ primaria: '#ffd84d', fundo: '#ffffff', texto: '#111111' })
  if (m.ok) return 'aceitou amarelo claro sobre branco'
  const erro = m.erros.join(' | ')
  if (!/prim[áa]ria/i.test(erro) || !/4,5/.test(erro)) return `a recusa não nomeia o par: ${erro}`
  const sugestao = (erro.match(/#[0-9a-f]{6}/gi) ?? []).find((h) => h.toLowerCase() !== '#ffd84d' && h.toLowerCase() !== '#ffffff')
  if (!sugestao) return `a recusa não trouxe sugestão: ${erro}`
  const outra = marcaDe({ primaria: sugestao, fundo: '#ffffff', texto: '#111111' })
  if (!outra.ok) return `a sugestão ${sugestao} também é recusada: ${outra.erros.join(' | ')}`
  // "A mais perto": o preto também passaria, e não é o que ele pediu.
  const r = razao(corDe(sugestao), corDe('#ffffff'))
  return r > 5 ? `a sugestão ${sugestao} dá ${r.toFixed(2)}:1: passa, mas não é a mais perto` : null
})

caso('escrever a marca mostra o que derivou e o par mais justo de cada registro', () => {
  const raiz = criar('marca-mostra-')
  try {
    const avisos = []
    if (escreverMarca(raiz, { cores: MATRIZ[0][1], aviso: (t) => avisos.push(t) }) !== 0) return avisos.join(' | ')
    const texto = avisos.join('\n')
    if (!/derivadas:[\s\S]*apagado #[0-9a-f]{6}/.test(texto)) return `não mostrou as derivadas: ${texto}`
    if (!/par mais justo no claro[\s\S]*par mais justo no escuro/.test(texto)) return `não mostrou o par mais justo: ${texto}`
    // E o par impresso é o MAIS justo, não um qualquer.
    const menor = Math.min(...marcaDe(MATRIZ[0][1]).pares.filter((p) => p.escopo === 'claro').map((p) => p.razao))
    const impresso = /par mais justo no claro: .*, ([\d,]+):1/.exec(texto)?.[1]
    return impresso === String(Math.round(menor * 100) / 100).replace('.', ',') ? null : `o par impresso (${impresso}) não é o mais justo (${menor})`
  } finally { apagar(raiz) }
})

caso('refazer mede contra o tema DO PROJETO, e não passa por cima do ícone que ele trocou', () => {
  const raiz = criar('marca-refazer-tema-')
  try {
    if (escreverMarca(raiz, { cores: MATRIZ[1][1], aviso: () => {} }) !== 0) return 'a primeira escrita falhou'
    writeFileSync(join(raiz, 'src', 'app', 'icon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><!-- o dele --></svg>\n')
    // O tema do projeto pinta o texto apagado com a borda: não se lê.
    mkdirSync(join(raiz, 'src', 'styles'), { recursive: true })
    writeFileSync(join(raiz, 'src', 'styles', 'tema-shadcn.css'), TEMA.split('--muted-foreground: rgb(var(--c-apagado));').join('--muted-foreground: rgb(var(--c-borda));'))
    if (escreverMarca(raiz, { cores: MATRIZ[0][1], refazer: true, aviso: () => {} }) === 0) return 'refez medindo o tema da casa, e não o do projeto'
    writeFileSync(join(raiz, 'src', 'styles', 'tema-shadcn.css'), TEMA)
    if (escreverMarca(raiz, { cores: MATRIZ[0][1], refazer: true, aviso: () => {} }) !== 0) return 'com o tema certo, o refazer falhou'
    return readFileSync(join(raiz, 'src', 'app', 'icon.svg'), 'utf8').includes('o dele') ? null : 'o refazer passou por cima do ícone do projeto'
  } finally { apagar(raiz) }
})

caso('refazer troca o ícone que ainda é o gerado', () => {
  const raiz = criar('marca-refazer-icone-')
  try {
    if (escreverMarca(raiz, { cores: MATRIZ[1][1], aviso: () => {} }) !== 0) return 'a primeira escrita falhou'
    if (escreverMarca(raiz, { cores: MATRIZ[0][1], refazer: true, aviso: () => {} }) !== 0) return 'o refazer falhou'
    return readFileSync(join(raiz, 'src', 'app', 'icon.svg'), 'utf8').includes('#c2410c') ? null : 'o refazer deixou o ícone gerado com a primária antiga'
  } finally { apagar(raiz) }
})

caso('a mesma fonte em .otf dá o mesmo woff2 duas vezes (sem a hora dentro)', () => {
  const otf = OTF_DE_PROVA
  const temPython = spawnSync('python', ['-c', 'import fontTools, brotli'], { encoding: 'utf8' }).status === 0
  // a fonte de prova vem do instalador: faltar é "não consegui medir", e não ambiente
  if (!existsSync(otf)) return SEM_FONTE
  if (!temPython) return 'PULADO'
  const bytes = []
  for (const nome of ['marca-woff2-a-', 'marca-woff2-b-']) {
    const raiz = criar(nome)
    try {
      if (escreverMarca(raiz, { cores: NEUTRA, fonte: { tipo: 'arquivo', regular: otf, nome: 'Fonte do Teste' }, aviso: () => {} }) !== 0) return 'a conversão falhou'
      bytes.push(readFileSync(join(raiz, 'public', 'fontes', 'fonte-do-teste-regular.woff2')))
      spawnSync('python', ['-c', 'import time; time.sleep(1.2)'])
    } finally { apagar(raiz) }
  }
  return bytes[0].equals(bytes[1]) ? null : 'duas conversões da mesma fonte deram arquivos diferentes'
})

caso('o texto sem contraste com o fundo é recusado', () => {
  const m = marcaDe({ primaria: '#0f766e', fundo: '#ffffff', texto: '#a3a3a3' })
  return m.ok ? 'aceitou texto cinza-claro sobre branco' : (/texto/i.test(m.erros.join(' ')) ? null : m.erros.join(' | '))
})

caso('cor que não é hex é recusada, nomeando o campo', () => {
  const m = marcaDe({ primaria: 'azul' })
  return m.ok ? 'aceitou "azul"' : (/prim[áa]ria/i.test(m.erros.join(' ')) ? null : m.erros.join(' | '))
})

caso('as mesmas cores dão os mesmos bytes', () => {
  const a = marcaDe(MATRIZ[0][1])
  const b = marcaDe(MATRIZ[0][1])
  return a.tokens === b.tokens && a.fontes === b.fontes && a.icone === b.icone ? null : 'duas gerações deram arquivos diferentes'
})

caso('fonte do sistema: nenhum @font-face, e a pilha começa em system-ui', () => {
  const m = marcaDe(NEUTRA)
  if (/@font-face/.test(m.fontes)) return 'a fonte do sistema declarou @font-face'
  const pilha = mapaDoArquivo(m.tokens).raiz.get('--f-display') ?? ''
  return pilha.startsWith('system-ui') ? null : `a pilha é ${pilha}`
})

caso('o ícone da aba é pintado com a primária do projeto', () => {
  const m = marcaDe(MATRIZ[1][1])
  return m.icone.includes('#0f766e') ? null : `o ícone não usa a primária: ${m.icone}`
})

caso('fonte em woff2: o arquivo vai para public/fontes e o @font-face aponta para ele', () => {
  const raiz = criar('marca-fonte-')
  try {
    const regular = join(raiz, 'entrada', 'Minha Fonte-Regular.woff2')
    mkdirSync(dirname(regular), { recursive: true })
    writeFileSync(regular, Buffer.from('wOF2 falso para o teste'))
    const avisos = []
    const codigo = escreverMarca(raiz, { cores: MATRIZ[1][1], fonte: { tipo: 'arquivo', regular, nome: 'Minha Fonte' }, aviso: (t) => avisos.push(t) })
    if (codigo !== 0) return `saiu ${codigo}: ${avisos.join(' | ')}`
    const destino = join(raiz, 'public', 'fontes', 'minha-fonte-regular.woff2')
    if (!existsSync(destino)) return 'o woff2 não chegou a public/fontes'
    const fontes = readFileSync(join(raiz, 'src', 'styles', 'fontes.css'), 'utf8')
    if (!fontes.includes('font-family: "Minha Fonte"') || !fontes.includes('url("/fontes/minha-fonte-regular.woff2")')) return `o @font-face não aponta o arquivo:\n${fontes}`
    const pilha = mapaDoArquivo(readFileSync(join(raiz, 'src', 'styles', 'tokens.css'), 'utf8')).raiz.get('--f-display') ?? ''
    return pilha.startsWith('"Minha Fonte"') ? null : `a pilha não começa na fonte dele: ${pilha}`
  } finally { apagar(raiz) }
})

caso('fonte em .otf vira woff2 (pelo fontTools)', () => {
  const otf = OTF_DE_PROVA
  const temPython = spawnSync('python', ['-c', 'import fontTools, brotli'], { encoding: 'utf8' }).status === 0
  // a fonte de prova vem do instalador: faltar é "não consegui medir", e não ambiente
  if (!existsSync(otf)) return SEM_FONTE
  if (!temPython) return 'PULADO'
  const raiz = criar('marca-otf-')
  try {
    const avisos = []
    const codigo = escreverMarca(raiz, { cores: NEUTRA, fonte: { tipo: 'arquivo', regular: otf, nome: 'Fonte do Teste' }, aviso: (t) => avisos.push(t) })
    if (codigo !== 0) return `saiu ${codigo}: ${avisos.join(' | ')}`
    const destino = join(raiz, 'public', 'fontes', 'fonte-do-teste-regular.woff2')
    if (!existsSync(destino)) return 'o woff2 não foi gerado'
    return readFileSync(destino).subarray(0, 4).toString('latin1') === 'wOF2' ? null : 'o arquivo não é woff2'
  } finally { apagar(raiz) }
})

caso('escrever de novo não passa por cima da marca que já existe, sem --refazer', () => {
  const raiz = criar('marca-refazer-')
  try {
    if (escreverMarca(raiz, { cores: MATRIZ[0][1], aviso: () => {} }) !== 0) return 'a primeira escrita falhou'
    const antes = readFileSync(join(raiz, 'src', 'styles', 'tokens.css'), 'utf8')
    if (escreverMarca(raiz, { cores: MATRIZ[1][1], aviso: () => {} }) === 0) return 'escreveu por cima sem --refazer'
    if (readFileSync(join(raiz, 'src', 'styles', 'tokens.css'), 'utf8') !== antes) return 'mudou o arquivo mesmo recusando'
    if (escreverMarca(raiz, { cores: MATRIZ[1][1], refazer: true, aviso: () => {} }) !== 0) return 'o --refazer não escreveu'
    return readFileSync(join(raiz, 'src', 'styles', 'tokens.css'), 'utf8').includes(canal('#0f766e')) ? null : 'o --refazer não trouxe a cor nova'
  } finally { apagar(raiz) }
})

caso('a marca recusada não escreve nada', () => {
  const raiz = criar('marca-recusa-')
  try {
    if (escreverMarca(raiz, { cores: { primaria: '#ffd84d', fundo: '#ffffff', texto: '#111111' }, aviso: () => {} }) === 0) return 'aceitou'
    return existsSync(join(raiz, 'src')) || existsSync(join(raiz, 'public')) ? 'escreveu mesmo recusando' : null
  } finally { apagar(raiz) }
})

// Uma marca do workspace configurada numa raiz de mentira: o molde sem o
// estado, com a principal, o raio e a curva trocados.
function raizComMarca () {
  const raiz = criar('marca-workspace-')
  const t = structuredClone(lerMolde().tokens)
  delete t.$extensions
  t.cor.papel.principal = { $value: '#0b4f4a' }
  t.raio.sm = { $value: { value: 12, unit: 'px' } }
  t.raio.md = { $value: { value: 20, unit: 'px' } }
  t.raio.lg = { $value: { value: 28, unit: 'px' } }
  t.movimento.curva.principal = { $value: [0.3, 0.1, 0.3, 1] }
  t.movimento.duracao.media = { $value: { value: 600, unit: 'ms' } }
  mkdirSync(join(raiz, 'identidade'), { recursive: true })
  writeFileSync(join(raiz, 'identidade', 'marca.tokens.json'), JSON.stringify(t))
  return raiz
}
const pegaDe = (args) => (b) => { const i = args.indexOf(b); return i !== -1 ? args[i + 1] : null }

caso('com a marca do workspace configurada, o projeto nasce nela: cor, raio, curva e ícone', () => {
  const raiz = raizComMarca()
  try {
    const o = opcoesDaMarca(pegaDe([]), { raiz })
    if (!o.daMarca) return 'a marca configurada não virou o padrão'
    if (o.cores.primaria.toLowerCase() !== '#0b4f4a') return `a primária veio ${o.cores.primaria}, e a marca diz #0b4f4a`
    if (o.fonte.tipo !== 'google' || !o.fonte.url.startsWith('https://fonts.googleapis.com/css2?')) return `a fonte só do Google Fonts não virou fonte a baixar: ${JSON.stringify(o.fonte)}`
    if (o.avisos.some((a) => /do sistema/.test(a))) return 'a fonte do Google Fonts ainda cai na do sistema'
    if (marcaDe(o.cores, { fonte: o.fonte }).ok) return 'gerou a marca com a fonte do Google sem baixar'
    const m = marcaDe(o.cores, { medidas: o.medidas, daMarca: true })
    if (!m.ok) return m.erros.join(' | ')
    const faltam = ['--r-sm: 12px;', '--r-md: 20px;', '--r-lg: 28px;', '--ease-brand: cubic-bezier(0.3, 0.1, 0.3, 1);', '--dur-in: 0.6s;', canal('#0b4f4a'), 'marca do workspace'].filter((v) => !m.tokens.includes(v))
    if (faltam.length) return `o tokens.css não trouxe da marca: ${faltam.join(', ')}`
    if (!m.icone.includes('rx="14"')) return 'o canto do ícone não acompanhou o raio da marca'
    // O acento da marca chega ao site: o dele, ou o tom mais perto que passa, nunca a primária.
    const r = mapaDoArquivo(m.tokens).raiz
    if (!o.cores.acento || r.get('--c-acento') === r.get('--c-primaria')) return `o acento da marca (${o.cores.acento}) não chegou aos tokens: --c-acento ${r.get('--c-acento')}`
    if (r.get('--c-acento') !== canal(o.cores.acento) && !m.avisos.some((a) => a.includes(o.cores.acento))) return 'o acento trocou de tom sem aviso'
    return paresRuins(m.tokens).join(' | ') || null
  } finally { apagar(raiz) }
})

const LARANJA = '#c4622d' // 3,42:1 sobre o creme: passa em título, não em texto
const MUSGO = { primaria: '#4a5a2a', fundo: '#f3ead6', texto: '#4a5a2a' }

caso('o acento que se lê sobre o fundo chega ao site como veio, nos dois registros', () => {
  const m = marcaDe({ ...MATRIZ[1][1], acento: '#9a3412' })
  if (!m.ok) return m.erros.join(' | ')
  const r = mapaDoArquivo(m.tokens).raiz
  if (r.get('--c-acento') !== canal('#9a3412')) return `o acento virou ${r.get('--c-acento')}`
  if (r.get('--c-acento-escuro') === r.get('--c-primaria-escuro')) return 'o acento do escuro é a primária'
  if (m.avisos.length) return `avisou sem motivo: ${m.avisos.join(' | ')}`
  return paresRuins(m.tokens).join(' | ') || null
})

caso('o acento abaixo de 4,5:1 vira o tom mais perto que passa, com aviso, e não a primária', () => {
  const m = marcaDe({ ...MUSGO, acento: LARANJA })
  if (!m.ok) return m.erros.join(' | ')
  const r = mapaDoArquivo(m.tokens).raiz
  const acento = corDe(r.get('--c-acento'))
  if (r.get('--c-acento') === r.get('--c-primaria')) return 'o laranja sumiu: o acento virou a primária'
  if (r.get('--c-acento') === canal(LARANJA)) return 'o laranja ficou como veio, abaixo de 4,5:1'
  const x = razao(acento, corDe(MUSGO.fundo))
  if (x < 4.5 || x > 5.2) return `o tom ajustado dá ${x.toFixed(2)}:1: passa longe do mais perto`
  if (!m.avisos.some((a) => a.includes(LARANJA) && /folga de 4,6:1/.test(a))) return `não avisou a troca: ${m.avisos.join(' | ')}`
  // E o tema leva o --acento do site ao canal do acento, nos dois registros.
  const tema = mapaDoArquivo(TEMA)
  for (const [escopo, mapas, canalDoAcento] of [['claro', [tema.raiz, r], '--c-acento'], ['escuro', [tema.escuro, tema.raiz, r], '--c-acento-escuro']]) {
    const pintado = corDe(resolverTexto('var(--acento)', mapas))
    if (!pintado || canal(hexDe(pintado)) !== r.get(canalDoAcento)) return `no ${escopo}, o --acento do tema não é o ${canalDoAcento}`
  }
  return paresRuins(m.tokens).join(' | ') || null
})

caso('sem acento, o acento do site é a primária (o projeto de antes não muda de cor)', () => {
  const m = marcaDe(MATRIZ[0][1])
  const r = mapaDoArquivo(m.tokens).raiz
  if (r.get('--c-acento') !== r.get('--c-primaria') || r.get('--c-acento-escuro') !== r.get('--c-primaria-escuro')) return `acento ${r.get('--c-acento')}, primária ${r.get('--c-primaria')}`
  return r.get('--c-acento-texto') === r.get('--c-primaria-texto') ? null : 'o texto sobre o acento mudou'
})

caso('a grade de acentos: todo acento, sobre fundo claro e escuro, sai com todo par em 4,5:1', () => {
  const problemas = []
  let medidos = 0
  for (const base of [MATRIZ[0][1], MATRIZ[2][1], MATRIZ[3][1], MUSGO]) {
    for (let h = 0; h < 360; h += 30) {
      for (const l of [25, 50, 75]) {
        const m = marcaDe({ ...base, acento: hexDeHsl(h, 80, l) })
        if (!m.ok) { problemas.push(`${hexDeHsl(h, 80, l)}: ${m.erros[0]}`); continue }
        medidos += 1
        const ruins = paresRuins(m.tokens)
        if (ruins.length) problemas.push(`${hexDeHsl(h, 80, l)} sobre ${base.fundo}: ${ruins[0]}`)
      }
    }
  }
  if (medidos < 140) return `só ${medidos} acentos medidos`
  return problemas.length ? problemas.slice(0, 4).join(' | ') : null
})

caso('--fonte na linha troca só a fonte: as cores e o acento seguem os da marca do workspace', () => {
  const raiz = raizComMarca()
  try {
    const o = opcoesDaMarca(pegaDe(['--fonte', 'sistema']), { raiz })
    if (!o.daMarca || o.cores.primaria.toLowerCase() !== '#0b4f4a') return 'a fonte da linha derrubou a marca do workspace'
    return o.fonte.tipo === 'sistema' ? null : `a fonte da linha não venceu: ${JSON.stringify(o.fonte)}`
  } finally { apagar(raiz) }
})

// O Google Fonts de mentira: a folha com o subconjunto latino e o cirílico, e
// o woff2 de cada endereço. Nenhuma rede.
const WOFF2 = (marca) => Buffer.concat([Buffer.from('wOF2'), Buffer.from(marca)])
function googleDeMentira (css, arquivos) {
  const pedidos = []
  const buscar = async (url, opcoes) => {
    pedidos.push({ url, agente: opcoes?.headers?.['user-agent'] ?? '' })
    if (url.startsWith('https://fonts.googleapis.com/')) return { ok: true, status: 200, text: async () => css }
    if (arquivos[url]) return { ok: true, status: 200, arrayBuffer: async () => arquivos[url] }
    return { ok: false, status: 404 }
  }
  return { buscar, pedidos }
}
const FOLHA = (faces) => faces.map(([sub, peso, url]) => `/* ${sub} */\n@font-face {\n  font-family: 'Lora';\n  font-style: normal;\n  font-weight: ${peso};\n  font-display: swap;\n  src: url(${url}) format('woff2');\n  unicode-range: U+0000-00FF;\n}\n`).join('')
const GOOGLE = { tipo: 'google', url: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;700&display=swap', nome: 'Lora' }
const G = 'https://fonts.gstatic.com/s/lora/v1/'

await casoAssincrono('a fonte do Google Fonts: baixa o woff2 latino, o regular e o negrito, e o projeto serve os dois', async () => {
  const css = FOLHA([['cyrillic', 400, `${G}cir.woff2`], ['latin', 400, `${G}reg.woff2`], ['cyrillic', 700, `${G}cir7.woff2`], ['latin', 700, `${G}neg.woff2`]])
  const { buscar, pedidos } = googleDeMentira(css, { [`${G}reg.woff2`]: WOFF2('regular'), [`${G}neg.woff2`]: WOFF2('negrito') })
  const raiz = criar('marca-google-')
  try {
    const { opcoes, limpar } = await comFonteBaixada({ cores: MATRIZ[1][1], fonte: GOOGLE, avisos: [] }, { buscar })
    try {
      if (opcoes.fonte.tipo !== 'arquivo' || !opcoes.fonte.negrito) return `a fonte baixada: ${JSON.stringify(opcoes.fonte)}`
      if (!/Chrome/.test(pedidos[0].agente)) return 'pediu a folha sem o agente de navegador (o Google devolve ttf)'
      if (pedidos.some((p) => p.url.includes('cir'))) return 'baixou o subconjunto cirílico'
      if (!opcoes.avisos.some((a) => /sha256 [0-9a-f]{64}/.test(a))) return `o aviso não traz o sha256: ${opcoes.avisos.join(' | ')}`
      if (escreverMarca(raiz, { ...opcoes, aviso: () => {} }) !== 0) return 'a marca com a fonte baixada não se escreveu'
    } finally { limpar() }
    const fontes = readFileSync(join(raiz, 'src', 'styles', 'fontes.css'), 'utf8')
    if (!fontes.includes('url("/fontes/lora-regular.woff2")') || !fontes.includes('url("/fontes/lora-negrito.woff2")')) return `o @font-face não serve a Lora:\n${fontes}`
    if (!readFileSync(join(raiz, 'public', 'fontes', 'lora-negrito.woff2')).equals(WOFF2('negrito'))) return 'o negrito servido não é o baixado'
    const pilha = mapaDoArquivo(readFileSync(join(raiz, 'src', 'styles', 'tokens.css'), 'utf8')).raiz.get('--f-display') ?? ''
    return pilha.startsWith('"Lora"') ? null : `a pilha não começa na Lora: ${pilha}`
  } finally { apagar(raiz) }
})

await casoAssincrono('a fonte variável do Google (um arquivo para todos os pesos) vira um woff2 só', async () => {
  const css = FOLHA([['latin', '400 700', `${G}var.woff2`]])
  const { buscar } = googleDeMentira(css, { [`${G}var.woff2`]: WOFF2('variavel') })
  const { opcoes, limpar } = await comFonteBaixada({ fonte: GOOGLE }, { buscar })
  try {
    return opcoes.fonte.regular && !opcoes.fonte.negrito ? null : `a variável virou: ${JSON.stringify(opcoes.fonte)}`
  } finally { limpar() }
})

await casoAssincrono('sem rede, endereço fora do gstatic ou arquivo que não é woff2: para com a frase do conserto', async () => {
  const esperar = async (buscar, padrao) => {
    try { await comFonteBaixada({ fonte: GOOGLE }, { buscar }); return 'seguiu' } catch (e) {
      if (!padrao.test(e.message) || !/identidade\/fontes\//.test(e.message)) return `frase sem o conserto: ${e.message}`
      return null
    }
  }
  const semRede = async () => { throw Object.assign(new Error('fetch failed'), { cause: { code: 'ENOTFOUND' } }) }
  const fora = googleDeMentira(FOLHA([['latin', 400, 'https://exemplo.invalid/x.woff2']]), {}).buscar
  const naoWoff2 = googleDeMentira(FOLHA([['latin', 400, `${G}r.woff2`]]), { [`${G}r.woff2`]: Buffer.from('<html>') }).buscar
  const semLatino = googleDeMentira(FOLHA([['cyrillic', 400, `${G}c.woff2`]]), {}).buscar
  for (const [buscar, padrao] of [[semRede, /ENOTFOUND/], [fora, /fonts\.gstatic\.com/], [naoWoff2, /não é woff2/], [semLatino, /latina/]]) {
    const erro = await esperar(buscar, padrao)
    if (erro) return erro
  }
  return null
})

caso('cor na linha de comando ou --neutra passam por cima da marca do workspace; sem marca, a neutra', () => {
  const raiz = raizComMarca()
  const vazia = criar('marca-sem-workspace-')
  try {
    const daLinha = opcoesDaMarca(pegaDe(['--primaria', '#c2410c']), { raiz })
    if (daLinha.daMarca || daLinha.cores.primaria !== '#c2410c') return 'a cor da linha não venceu a marca do workspace'
    if (opcoesDaMarca(pegaDe([]), { raiz, neutra: true }).daMarca) return 'o --neutra não tirou a marca do workspace'
    const sem = opcoesDaMarca(pegaDe([]), { raiz: vazia })
    if (sem.daMarca || Object.keys(sem.cores).length) return 'sem marca configurada, inventou cor'
    return marcaDoWorkspace({ raiz: vazia }) === null ? null : 'a raiz sem marca devolveu marca'
  } finally { apagar(raiz); apagar(vazia) }
})

caso('a marca do workspace que existe e não fecha (ainda o molde) para com a frase única, em vez de nascer neutra calada', () => {
  const raiz = criar('marca-workspace-molde-')
  try {
    mkdirSync(join(raiz, 'identidade'), { recursive: true })
    writeFileSync(join(raiz, 'identidade', 'marca.tokens.json'), JSON.stringify(lerMolde().tokens))
    try { opcoesDaMarca(pegaDe([]), { raiz }); return 'seguiu com o molde como marca' } catch (e) {
      if (!/a marca não está configurada: rode \/marca \(.*ainda é o molde/.test(e.message)) return `parou com outra frase: ${e.message}`
    }
    return opcoesDaMarca(pegaDe([]), { raiz, neutra: true }).daMarca ? 'o --neutra não passou por cima' : null
  } finally { apagar(raiz) }
})

// A marca do workspace com a forma escolhida: botão em pílula, o destaque numa
// serifada itálica e a mono, as duas em arquivo de identidade/fontes/.
function raizComForma () {
  const raiz = raizComMarca()
  const arq = join(raiz, 'identidade', 'marca.tokens.json')
  const t = JSON.parse(readFileSync(arq, 'utf8'))
  t.raio.pilula.$value = true
  t.recusas.$value = t.recusas.$value.filter((r) => r !== 'pilula')
  Object.assign(t.fonte.destaque, { $value: ['Lora', 'Georgia', 'serif'], $extensions: { 'marca.arquivo': 'fontes/lora-italico.woff2', 'marca.estilo': 'italic' } })
  Object.assign(t.fonte.mono, { $value: ['Fira Code', 'Consolas', 'monospace'], $extensions: { 'marca.arquivo': 'fontes/fira-code.woff2' } })
  writeFileSync(arq, JSON.stringify(t))
  mkdirSync(join(raiz, 'identidade', 'fontes'), { recursive: true })
  writeFileSync(join(raiz, 'identidade', 'fontes', 'lora-italico.woff2'), WOFF2('lora-italico'))
  writeFileSync(join(raiz, 'identidade', 'fontes', 'fira-code.woff2'), WOFF2('fira-code'))
  return raiz
}
const PILULA = /\[data-slot="button"\],\s*\[data-slot="input"\]\s*\{\s*border-radius:\s*9999px;\s*\}/
const DESTAQUE = /\.destaque\s*\{\s*font-family:\s*var\(--f-destaque\);\s*font-style:\s*var\(--f-destaque-estilo\);\s*\}/
const MONO = /code,\s*kbd,\s*samp,\s*pre,\s*\.font-mono\s*\{\s*font-family:\s*var\(--f-mono\);\s*\}/
const tokensDoProjeto = (raiz) => readFileSync(join(raiz, 'src', 'styles', 'tokens.css'), 'utf8')

caso('a forma da marca do workspace chega ao site: pílula no botão e no campo, o destaque na fonte e no estilo dela, a mono', () => {
  const raiz = raizComForma()
  const projeto = criar('marca-forma-')
  try {
    const o = opcoesDaMarca(pegaDe([]), { raiz })
    if (o.medidas.pilula !== true) return `a pílula da marca não chegou às medidas: ${JSON.stringify(o.medidas)}`
    if (o.destaque?.tipo !== 'arquivo' || o.destaque.estilo !== 'italic') return `o destaque da marca: ${JSON.stringify(o.destaque)}`
    if (o.mono?.tipo !== 'arquivo') return `a mono da marca: ${JSON.stringify(o.mono)}`
    if (escreverMarca(projeto, { ...o, fonte: { tipo: 'sistema' }, aviso: () => {} }) !== 0) return 'a marca com a forma não se escreveu'
    const tokens = tokensDoProjeto(projeto)
    const r = mapaDoArquivo(tokens).raiz
    if (!(r.get('--f-destaque') ?? '').startsWith('"Lora"')) return `o --f-destaque não é a Lora: ${r.get('--f-destaque')}`
    if (r.get('--forma-pilula') !== '1') return `o --forma-pilula (que a tela do projeto lê) não diz a pílula: ${r.get('--forma-pilula')}`
    if (r.get('--f-destaque-estilo') !== 'italic') return `o estilo do destaque:${r.get('--f-destaque-estilo')}`
    if (!(r.get('--f-mono') ?? '').startsWith('"Fira Code"')) return `o --f-mono não é a Fira Code: ${r.get('--f-mono')}`
    for (const [nome, regra] of [['a pílula no botão e no campo', PILULA], ['a classe .destaque', DESTAQUE], ['a mono no código', MONO]]) {
      if (!regra.test(tokens)) return `o tokens.css não traz ${nome}:\n${tokens}`
    }
    const fontes = readFileSync(join(projeto, 'src', 'styles', 'fontes.css'), 'utf8')
    const face = (familia) => [...fontes.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]).find((c) => c.includes(`font-family: "${familia}"`))
    if (!/font-style: italic;/.test(face('Lora') ?? '')) return `a Lora não é servida em itálico:\n${fontes}`
    if (!/font-style: normal;/.test(face('Fira Code') ?? '')) return `a Fira Code não é servida:\n${fontes}`
    for (const [familia, bytes] of [['Lora', 'lora-italico'], ['Fira Code', 'fira-code']]) {
      const url = /url\("\/fontes\/([\w.-]+)"\)/.exec(face(familia))?.[1]
      if (!url || !readFileSync(join(projeto, 'public', 'fontes', url)).equals(WOFF2(bytes))) return `o arquivo servido da ${familia} não é o da marca (${url})`
    }
    return paresRuins(tokens).join(' | ') || null
  } finally { apagar(raiz); apagar(projeto) }
})

caso('trocar a forma na marca troca o site com o --refazer: sem pílula, o destaque normal, outra mono, e o cabeçalho diz a forma', () => {
  const raiz = raizComForma()
  const projeto = criar('marca-forma-troca-')
  try {
    if (escreverMarca(projeto, { ...opcoesDaMarca(pegaDe([]), { raiz }), fonte: { tipo: 'sistema' }, aviso: () => {} }) !== 0) return 'a primeira marca não se escreveu'
    const antes = tokensDoProjeto(projeto)
    const arq = join(raiz, 'identidade', 'marca.tokens.json')
    const t = JSON.parse(readFileSync(arq, 'utf8'))
    t.raio.pilula.$value = false
    Object.assign(t.fonte.destaque, { $value: ['Georgia', 'serif'], $extensions: {} })
    Object.assign(t.fonte.mono, { $value: ['Courier New', 'monospace'], $extensions: {} })
    writeFileSync(arq, JSON.stringify(t))
    const avisos = []
    const o = opcoesDaMarca(pegaDe([]), { raiz })
    if (escreverMarca(projeto, { ...o, fonte: { tipo: 'sistema' }, refazer: true, aviso: (a) => avisos.push(a) }) !== 0) return 'o --refazer não escreveu'
    const depois = tokensDoProjeto(projeto)
    const r = mapaDoArquivo(depois).raiz
    if (PILULA.test(depois) || /data-slot/.test(depois)) return 'a pílula ficou depois da marca a recusar'
    if (r.get('--forma-pilula') !== '0') return `o --forma-pilula ficou ${r.get('--forma-pilula')} depois da marca recusar a pílula`
    if (r.get('--f-destaque-estilo') !== 'normal') return `o estilo do destaque ficou${r.get('--f-destaque-estilo')}`
    if (r.get('--f-destaque') !== 'Georgia, serif') return `o --f-destaque: ${r.get('--f-destaque')}`
    if (r.get('--f-mono') !== '"Courier New", monospace') return `o --f-mono: ${r.get('--f-mono')}`
    if (/Lora|Fira/.test(readFileSync(join(projeto, 'src', 'styles', 'fontes.css'), 'utf8') + depois)) return 'a fonte da marca de antes ficou no site'
    const forma = (css) => /A forma: ([^\n]+)/.exec(css)?.[1]
    if (!forma(antes) || forma(antes) === forma(depois)) return `o cabeçalho não diz a forma, ou não mudou: "${forma(antes)}" → "${forma(depois)}"`
    if (!avisos.some((a) => /Georgia/.test(a) && /não tem arquivo/.test(a))) return `a fonte de destaque sem arquivo não avisou: ${avisos.join(' | ')}`
    return null
  } finally { apagar(raiz); apagar(projeto) }
})

caso('sem marca, o destaque é a fonte do texto em estilo normal, a mono é a do sistema e o botão segue o raio do componente', () => {
  const m = marcaDe(MATRIZ[1][1])
  if (!m.ok) return m.erros.join(' | ')
  const r = mapaDoArquivo(m.tokens).raiz
  if (r.get('--f-destaque') !== 'var(--f-display)' || r.get('--f-destaque-estilo') !== 'normal') return `o destaque neutro: ${r.get('--f-destaque')} ${r.get('--f-destaque-estilo')}`
  if (!(r.get('--f-mono') ?? '').startsWith('ui-monospace')) return `a mono neutra: ${r.get('--f-mono')}`
  if (/data-slot/.test(m.tokens) || r.get('--forma-pilula') !== '0') return `a marca neutra pôs o botão em pílula (--forma-pilula: ${r.get('--forma-pilula')})`
  return DESTAQUE.test(m.tokens) && MONO.test(m.tokens) ? null : 'as regras do destaque e da mono não estão no tokens.css'
})

const FOLHA_ESTILOS = (faces) => faces.map(([estilo, url]) => `/* latin */\n@font-face {\n  font-family: 'Lora';\n  font-style: ${estilo};\n  font-weight: 400;\n  font-display: swap;\n  src: url(${url}) format('woff2');\n  unicode-range: U+0000-00FF;\n}\n`).join('')

await casoAssincrono('o destaque itálico do Google Fonts: baixa a face itálica; a família sem itálico serve a normal, com aviso', async () => {
  const destaque = { tipo: 'google', url: 'https://fonts.googleapis.com/css2?family=Lora:ital@0;1&display=swap', nome: 'Lora', estilo: 'italic', reserva: ['Georgia', 'serif'] }
  const com = googleDeMentira(FOLHA_ESTILOS([['normal', `${G}n.woff2`], ['italic', `${G}i.woff2`]]), { [`${G}n.woff2`]: WOFF2('normal'), [`${G}i.woff2`]: WOFF2('italico') })
  const projeto = criar('marca-google-italico-')
  try {
    const { opcoes, limpar } = await comFonteBaixada({ cores: MATRIZ[1][1], destaque, avisos: [] }, { buscar: com.buscar })
    try {
      if (opcoes.destaque.tipo !== 'arquivo' || opcoes.destaque.estilo !== 'italic') return `o destaque baixado: ${JSON.stringify(opcoes.destaque)}`
      if (!readFileSync(opcoes.destaque.regular).equals(WOFF2('italico'))) return 'baixou a face normal no lugar da itálica'
      if (escreverMarca(projeto, { ...opcoes, aviso: () => {} }) !== 0) return 'a marca com o destaque baixado não se escreveu'
    } finally { limpar() }
    const fontes = readFileSync(join(projeto, 'src', 'styles', 'fontes.css'), 'utf8')
    if (!/font-family: "Lora";[^}]*font-style: italic;/.test(fontes)) return `o @font-face do destaque não é itálico:\n${fontes}`
    const sem = googleDeMentira(FOLHA_ESTILOS([['normal', `${G}n.woff2`]]), { [`${G}n.woff2`]: WOFF2('normal') })
    const { opcoes: o2, limpar: l2 } = await comFonteBaixada({ cores: MATRIZ[1][1], destaque, avisos: [] }, { buscar: sem.buscar })
    const outro = criar('marca-google-sem-italico-')
    try {
      if (!o2.avisos.some((a) => /Lora/.test(a) && /itálico/.test(a))) return `a falta do itálico não avisou: ${o2.avisos.join(' | ')}`
      if (escreverMarca(outro, { ...o2, aviso: () => {} }) !== 0) return 'a marca com o destaque sem itálico não se escreveu'
      // a face se declara normal (o navegador a inclina), e o destaque segue itálico
      const f2 = readFileSync(join(outro, 'src', 'styles', 'fontes.css'), 'utf8')
      if (!/font-family: "Lora";[^}]*font-style: normal;/.test(f2)) return `sem itálico no Google, a face servida devia ser a normal:\n${f2}`
      if (mapaDoArquivo(tokensDoProjeto(outro)).raiz.get('--f-destaque-estilo') !== 'italic') return 'o destaque deixou de ser itálico'
    } finally { l2(); apagar(outro) }
    return null
  } finally { apagar(projeto) }
})

console.log(`\n  ${ok} passaram, ${falhou} falharam${pulou ? `, ${pulou} pulado(s) (sem o Python com fontTools e brotli)` : ''}\n`)
process.exit(falhou ? 1 : 0)
