// Prova da conta de cor da fundação (`kit/conferido/lib/cor.mjs`).
//
// Por que existe: o contraste do tema é medido por ESTA conta, na marca do
// workspace e em todo projeto (conferidor `marca`). Uma conta
// errada aprova par ilegível em todos os lugares de uma vez, e em silêncio.
// Cada caso abaixo tem o número que se confere à mão numa calculadora de
// contraste da WCAG.
//
// Uso:  node .claude/skills/novo-projeto/esqueleto/testes/teste-cor.mjs
// mutação: .claude/skills/novo-projeto/esqueleto/kit/conferido/lib/cor.mjs · "return (claro + 0.05) / (escuro + 0.05)" → "return (claro + 0.05) / (escuro + 0.02)" · pega em 09/10/2026
// mutação: .claude/skills/novo-projeto/esqueleto/kit/conferido/lib/cor.mjs · "const l = (L + 0.3963377774 * oa + 0.2158037573 * ob) ** 3" → "const l = (L + 0.3963377774 * oa + 0.2158037573 * ob) ** 2" · pega em 09/10/2026

import {
  blocos, declaracoesDe, mapaDoArquivo, resolverTexto, corDe, sobre, razao, contrasteDoTema
} from '../kit/conferido/lib/cor.mjs'

let ok = 0
let falhou = 0

function caso (nome, trabalho) {
  let erro
  try { erro = trabalho() } catch (e) { erro = `explodiu: ${e.stack}` }
  if (erro) { console.log(`  ❌ ${nome}\n     ${erro}`); falhou += 1 } else { console.log(`  ✅ ${nome}`); ok += 1 }
}

const perto = (a, b, tol = 0.01) => Math.abs(a - b) <= tol

console.log('\n  teste da conta de cor')

caso('lê os blocos de topo, com @layer e @theme aninhados sem se perder', () => {
  const css = '/* x { } */ @theme inline { --a: 1; } :root { --b: 2; } @layer base { * { color: red; } body { x: y; } } .dark { --c: 3; }'
  const nomes = blocos(css).map((b) => b.seletor).join(' | ')
  return nomes === '@theme inline | :root | @layer base | .dark' ? null : `leu: ${nomes}`
})

caso('as declarações diretas de um bloco, sem as dos blocos aninhados', () => {
  const d = declaracoesDe('--a: 1; x { --dentro: 2; } --b: rgba(var(--c), .5);')
  return [...d.keys()].join(',') === '--a,--b' ? null : `leu: ${[...d.keys()]}`
})

caso('o mapa separa o claro (:root e @theme) do escuro (.dark)', () => {
  const m = mapaDoArquivo(':root { --x: 1; } @theme inline { --y: 2; } .dark { --x: 9; }')
  return m.raiz.get('--x') === '1' && m.raiz.get('--y') === '2' && m.escuro.get('--x') === '9' ? null : JSON.stringify([...m.raiz, ...m.escuro])
})

caso('resolve var() aninhado, com fallback, e para em ciclo sem travar', () => {
  const mapa = new Map([['--c-ink', '0,0,0'], ['--fg', 'rgb(var(--c-ink))'], ['--ciclo', 'var(--ciclo)']])
  if (resolverTexto('var(--fg)', [mapa]) !== 'rgb(0,0,0)') return `veio ${resolverTexto('var(--fg)', [mapa])}`
  if (resolverTexto('var(--nao, #fff)', [mapa]) !== '#fff') return 'fallback não funcionou'
  return resolverTexto('var(--ciclo)', [mapa]) === null ? null : 'o ciclo não devolveu null'
})

caso('lê hex de 3, 6 e 8 dígitos, rgb(), rgba() e a sintaxe com barra', () => {
  const casos = [['#fff', [255, 255, 255, 1]], ['#0071e3', [0, 113, 227, 1]], ['#00000080', [0, 0, 0, 128 / 255]],
    ['rgb(0,113,227)', [0, 113, 227, 1]], ['rgba(255, 255, 255, .06)', [255, 255, 255, 0.06]], ['rgb(0 0 0 / 50%)', [0, 0, 0, 0.5]]]
  for (const [t, [r, g, b, a]] of casos) {
    const c = corDe(t)
    if (!c || c.r !== r || c.g !== g || c.b !== b || !perto(c.a, a)) return `${t} veio ${JSON.stringify(c)}`
  }
  return corDe('color-mix(in oklab, red 50%, blue)') === null ? null : 'color-mix não pode ser lido como cor conhecida'
})

caso('lê oklch, o formato do CLI do shadcn e do Tailwind 4', () => {
  // o vermelho do shadcn (e o red-600 do Tailwind 4) é oklch(0.577 0.245 27.325) = #e7000b
  const casos = [['oklch(1 0 0)', [255, 255, 255]], ['oklch(0 0 0)', [0, 0, 0]], ['oklch(0.577 0.245 27.325)', [231, 0, 11]], ['oklch(57.7% 0.245 27.325)', [231, 0, 11]]]
  for (const [t, [r, g, b]] of casos) {
    const c = corDe(t)
    if (!c || Math.abs(c.r - r) > 2 || Math.abs(c.g - g) > 2 || Math.abs(c.b - b) > 2) return `${t} veio ${JSON.stringify(c)}, esperava ${r},${g},${b}`
  }
  const a = corDe('oklch(1 0 0 / 10%)')
  return a && perto(a.a, 0.1) ? null : `a transparência do oklch veio ${JSON.stringify(a)}`
})

caso('o contraste enxerga o CLI por baixo do tema: papel que ficou na cor do CLI é medido', () => {
  const tokens = ':root { --c-ink: 0,0,0; --c-light: 255,255,255; }'
  const tema = ':root { --background: rgb(var(--c-light)); --foreground: rgb(var(--c-ink)); } .dark { --background: rgb(var(--c-ink)); }'
  const cli = ':root { --background: oklch(1 0 0); --foreground: oklch(0.145 0 0); } .dark { --background: oklch(0.145 0 0); --foreground: oklch(0.985 0 0); }'
  const par = contrasteDoTema({ tokens, tema, cli }).find((p) => p.escopo === 'escuro' && p.texto === '--foreground')
  return par && par.ok && par.razao > 15 ? null : `o texto do escuro veio ${JSON.stringify(par)} (devia ser o quase-branco do CLI sobre o preto do tema)`
})

caso('compõe transparência sobre o fundo: branco a 6% sobre preto é #0f0f0f', () => {
  const c = sobre(corDe('rgba(255,255,255,.06)'), corDe('#000'))
  return c.r === 15 && c.g === 15 && c.b === 15 ? null : JSON.stringify(c)
})

caso('as razões da WCAG que se conferem à mão', () => {
  const pares = [['#000', '#fff', 21], ['#0071e3', '#fff', 4.70], ['#6e6e73', '#fff', 5.07], ['#d70015', '#fff', 5.38], ['#ff5f57', '#fff', 2.99]]
  for (const [a, b, esperado] of pares) {
    const r = razao(corDe(a), corDe(b))
    if (!perto(r, esperado, 0.01)) return `${a} sobre ${b} deu ${r.toFixed(2)}, esperava ${esperado}`
  }
  return null
})

caso('o contraste do tema: aprova o par bom e reprova o par ruim, no claro e no escuro', () => {
  const tokens = ':root { --c-ink: 0,0,0; --c-light: 255,255,255; --c-cinza: 200,200,200; }'
  const tema = ':root { --background: rgb(var(--c-light)); --foreground: rgb(var(--c-ink)); --muted-foreground: rgb(var(--c-cinza)); } .dark { --background: rgb(var(--c-ink)); --foreground: rgb(var(--c-light)); --muted-foreground: rgb(var(--c-cinza)); }'
  const r = contrasteDoTema({ tokens, tema })
  const ruim = r.filter((p) => !p.ok).map((p) => `${p.escopo}:${p.texto}/${p.fundo}`)
  if (ruim.join(',') !== 'claro:--muted-foreground/--background') return `reprovados: ${ruim.join(',') || 'nenhum'}`
  return r.filter((p) => p.ok).length >= 3 ? null : 'mediu par de menos'
})

caso('a primária também é TEXTO sobre o fundo (o botão link do registry), e o par se mede', () => {
  // O `link` do shadcn pinta o texto com `text-primary`, e o azul #0071e3 sobre
  // o preto dá 4,47:1 (o axe reprova na vitrine). Uma régua que medisse só o
  // texto DO botão sobre a primária aprovaria.
  const tokens = ':root { --c-ink: 0,0,0; --c-light: 255,255,255; --c-azul: 0,113,227; }'
  const tema = ':root { --background: rgb(var(--c-light)); --primary: rgb(var(--c-azul)); --primary-foreground: rgb(var(--c-light)); } .dark { --background: rgb(var(--c-ink)); }'
  const r = contrasteDoTema({ tokens, tema })
  const par = r.find((p) => p.escopo === 'escuro' && p.texto === '--primary' && p.fundo === '--background')
  if (!par) return 'o par --primary sobre --background nem foi medido'
  return !par.ok && perto(par.razao, 4.47, 0.02) ? null : JSON.stringify(par)
})

caso('par que não se consegue resolver aparece como não medido, nunca como aprovado', () => {
  const r = contrasteDoTema({ tokens: ':root{}', tema: ':root { --background: color-mix(in oklab, white 50%, black); --foreground: rgb(0,0,0); }' })
  const par = r.find((p) => p.texto === '--foreground' && p.escopo === 'claro')
  return par && par.naoMedido && !par.ok ? null : JSON.stringify(par)
})

console.log(`\n  ${falhou ? '❌' : '✅'} ${ok} passaram, ${falhou} falharam\n`)
process.exit(falhou ? 1 : 0)
