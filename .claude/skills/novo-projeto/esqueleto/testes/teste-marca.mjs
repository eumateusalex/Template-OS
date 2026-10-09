// Prova do gerador da marca do projeto (`scripts/gerar-marca.mjs`).
//
// Por que existe: a marca de um projeto novo sai da entrevista (três cores e
// uma fonte), nunca da casa. O gerador deriva o resto
// (superfície, borda, texto apagado, o registro escuro, o erro), e uma conta
// errada aqui entrega um projeto com texto que não se lê já no primeiro dia.
// A régua do contraste é a MESMA do conferidor `marca` (`contrasteDoTema`).
//
// Uso:  node .claude/skills/novo-projeto/esqueleto/testes/teste-marca.mjs
// mutação: .claude/skills/novo-projeto/esqueleto/scripts/gerar-marca.mjs · "if (razao(primaria, fundo) < MINIMO) {" → "if (false) {" · pega em 09/10/2026
// mutação: .claude/skills/novo-projeto/esqueleto/scripts/gerar-marca.mjs · "if (fundos.every((f) => razao(c, f) >= minimo)) return c" → "return c" · pega em 09/10/2026
// mutação: .claude/skills/novo-projeto/esqueleto/scripts/gerar-marca.mjs · "tintas.every((t) => razao(c, sobre({ ...c, a: t }, f)) >= FOLGA)" → "true" · pega em 09/10/2026
// mutação: .claude/skills/novo-projeto/esqueleto/scripts/gerar-marca.mjs · "const iconeDoProjeto = existsSync(destinos.icone) && !readFileSync(destinos.icone, 'utf8').startsWith(CABECALHO_DO_ICONE)" → "const iconeDoProjeto = existsSync(destinos.icone)" · pega em 09/10/2026
// mutação: .claude/skills/novo-projeto/esqueleto/scripts/gerar-marca.mjs · ".sort((a, b) => a.razao - b.razao)" → ".sort((a, b) => b.razao - a.razao)" · pega em 09/10/2026
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

import { marcaDe, escreverMarca, NEUTRA } from '../scripts/gerar-marca.mjs'
import { contrasteDoTema, hexForaDeComentario, mapaDoArquivo, corDe, razao, sobre } from '../kit/conferido/lib/cor.mjs'
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

console.log(`\n  ${ok} passaram, ${falhou} falharam${pulou ? `, ${pulou} pulado(s) (sem o Python com fontTools e brotli)` : ''}\n`)
process.exit(falhou ? 1 : 0)
