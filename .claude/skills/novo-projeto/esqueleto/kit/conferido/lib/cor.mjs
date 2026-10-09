// fundação: conferido v1 · o ajuste mora no tema do projeto, nunca aqui
//
// A conta de cor da fundação: ler o CSS por bloco, resolver `var()`, ler a cor
// e medir o contraste da WCAG. Só builtins, para rodar no workspace e em todo
// projeto (conferidor `marca`) sem instalar nada.
//
// Classe de defeito que ela impede: par de cor ilegível aprovado por uma conta
// errada. O contraste mora aqui, num lugar só, porque duas contas divergem, e a
// que diverge para o lado otimista aprova texto que ninguém lê.
//
// 🚨 Cor que ela não sabe ler (oklch, color-mix, nome de cor) volta `null`, e
// par com `null` é NÃO MEDIDO, nunca aprovado. Ausência de medida não é
// evidência de conformidade (princípio VI).
//
// Prova: .claude/skills/novo-projeto/esqueleto/testes/teste-cor.mjs

/** Apaga `/* ... *\/`, preservando o resto. */
export function semComentarios (css) {
  return String(css).replace(/\/\*[\s\S]*?\*\//g, ' ')
}

/**
 * Os blocos de topo do CSS: `{ seletor, corpo }`, com o corpo inteiro (inclusive
 * o que estiver aninhado). Declaração solta no topo (`@import x;`) é pulada.
 */
export function blocos (css) {
  const texto = semComentarios(css)
  const achados = []
  let seletor = ''
  let i = 0
  while (i < texto.length) {
    const c = texto[i]
    if (c === ';') { seletor = ''; i += 1; continue }
    if (c === '{') {
      let profundidade = 1
      let j = i + 1
      while (j < texto.length && profundidade > 0) {
        if (texto[j] === '{') profundidade += 1
        else if (texto[j] === '}') profundidade -= 1
        j += 1
      }
      achados.push({ seletor: seletor.trim(), corpo: texto.slice(i + 1, j - 1) })
      seletor = ''
      i = j
      continue
    }
    seletor += c
    i += 1
  }
  return achados
}

/** As declarações `--x: valor` DIRETAS de um corpo, sem as dos blocos aninhados. */
export function declaracoesDe (corpo) {
  const mapa = new Map()
  let atual = ''
  let i = 0
  const texto = semComentarios(corpo)
  const fecha = () => {
    const m = /^\s*(--[\w-]+)\s*:\s*([\s\S]+?)\s*$/.exec(atual)
    if (m) mapa.set(m[1], m[2].replace(/\s+/g, ' '))
    atual = ''
  }
  while (i < texto.length) {
    const c = texto[i]
    if (c === '{') {
      let profundidade = 1
      i += 1
      while (i < texto.length && profundidade > 0) {
        if (texto[i] === '{') profundidade += 1
        else if (texto[i] === '}') profundidade -= 1
        i += 1
      }
      atual = ''
      continue
    }
    if (c === ';') { fecha(); i += 1; continue }
    atual += c
    i += 1
  }
  fecha()
  return mapa
}

/**
 * As declarações do arquivo, separadas por registro: `raiz` junta `:root` e
 * `@theme`, `escuro` é o `.dark`.
 */
export function mapaDoArquivo (css) {
  const raiz = new Map()
  const escuro = new Map()
  for (const b of blocos(css)) {
    const alvo = b.seletor.includes('.dark') ? escuro : (b.seletor.includes(':root') || b.seletor.startsWith('@theme')) ? raiz : null
    if (!alvo) continue
    for (const [k, v] of declaracoesDe(b.corpo)) alvo.set(k, v)
  }
  return { raiz, escuro }
}

/** As declarações diretas dos blocos cujo seletor é EXATAMENTE este. */
export function declaracoesDoSeletor (css, seletor) {
  const mapa = new Map()
  for (const b of blocos(css)) if (b.seletor === seletor) for (const [k, v] of declaracoesDe(b.corpo)) mapa.set(k, v)
  return mapa
}

/**
 * A régua do valor de um papel no tema: canal do kit (`rgb(var(--c-x))`,
 * `rgba(var(--c-x), .5)`), sistema (`var(--mac-x)`), família (`var(--f-x)`)
 * ou raio (`var(--r-x)`). Qualquer outra coisa é cor que não é da marca.
 */
export const VALOR_DO_TEMA = /^(rgba?\(var\(--c-[\w-]+\)(,\s*[\d.]+)?\)|var\(--(mac|f|r)-[\w-]+\))$/

/** Este nome está na lista? Terminado em hífen é prefixo; o resto é exato. */
export function estaNaLista (nome, lista) {
  return lista.some((p) => (p.endsWith('-') ? nome.startsWith(p) : nome === p))
}

/** Todo nome declarado no arquivo, em qualquer bloco de topo. */
export function nomesDeclarados (css) {
  const nomes = new Set()
  for (const b of blocos(css)) for (const k of declaracoesDe(b.corpo).keys()) nomes.add(k)
  return nomes
}

/** Todo `var(--x)` usado no arquivo, fora de comentário. */
export function nomesUsados (css) {
  return new Set([...semComentarios(css).matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]))
}

/** Hex fora de comentário: `[{ hex, linha }]`. */
export function hexForaDeComentario (css) {
  const limpo = semComentarios(css)
  return [...limpo.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((m) => ({ hex: m[0], linha: limpo.slice(0, m.index).split('\n').length }))
}

/** Onde fecha o parêntese que abre em `inicio`. */
function fechaParentese (texto, inicio) {
  let profundidade = 0
  for (let i = inicio; i < texto.length; i += 1) {
    if (texto[i] === '(') profundidade += 1
    else if (texto[i] === ')') {
      profundidade -= 1
      if (profundidade === 0) return i
    }
  }
  return -1
}

/**
 * Troca todo `var(--x)` pelo valor, procurando nos mapas na ordem, com o
 * fallback quando nenhum declara. Devolve `null` quando não resolve (inclusive
 * em ciclo), nunca um texto pela metade.
 * @param {string} valor
 * @param {Map<string,string>[]} mapas
 */
export function resolverTexto (valor, mapas, profundidade = 0) {
  if (valor === null || valor === undefined) return null
  if (profundidade > 12) return null
  let texto = String(valor)
  for (;;) {
    const i = texto.indexOf('var(')
    if (i === -1) return texto.trim()
    const fim = fechaParentese(texto, i + 3)
    if (fim === -1) return null
    const dentro = texto.slice(i + 4, fim)
    const virgula = dentro.indexOf(',')
    const nome = (virgula === -1 ? dentro : dentro.slice(0, virgula)).trim()
    const reserva = virgula === -1 ? null : dentro.slice(virgula + 1).trim()
    const achado = mapas.find((m) => m && m.has(nome))
    const bruto = achado ? achado.get(nome) : reserva
    const resolvido = bruto === null ? null : resolverTexto(bruto, mapas, profundidade + 1)
    if (resolvido === null) return null
    texto = texto.slice(0, i) + resolvido + texto.slice(fim + 1)
  }
}

const numero = (t) => {
  const s = String(t).trim()
  return s.endsWith('%') ? Number(s.slice(0, -1)) / 100 : Number(s)
}

/**
 * A cor de um texto JÁ RESOLVIDO: `{ r, g, b, a }` ou `null`.
 * Lê hex (3, 4, 6, 8), canais soltos (`0,113,227`, o formato do kit), `rgb()`,
 * `rgba()` e a sintaxe com barra. Qualquer outra coisa é `null`.
 */
export function corDe (texto) {
  if (texto === null || texto === undefined) return null
  const t = String(texto).trim().toLowerCase()
  if (t === 'transparent') return { r: 0, g: 0, b: 0, a: 0 }
  let m = /^#([0-9a-f]{3,8})$/.exec(t)
  if (m) {
    let h = m[1]
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('')
    if (h.length !== 6 && h.length !== 8) return null
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
    }
  }
  m = /^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/.exec(t)
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: 1 }
  m = /^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+%?))?\s*\)$/.exec(t)
  if (m) return deOklch(m)
  m = /^rgba?\(\s*([^)]*)\)$/.exec(t)
  if (!m) return null
  const partes = m[1].includes(',')
    ? m[1].split(',').map((p) => p.trim())
    : m[1].replace('/', ' / ').split(/\s+/).filter((p) => p && p !== '/')
  if (partes.length < 3 || partes.length > 4) return null
  const [r, g, b] = partes.slice(0, 3).map(numero)
  const a = partes.length === 4 ? numero(partes[3]) : 1
  if ([r, g, b, a].some((n) => Number.isNaN(n))) return null
  return { r, g, b, a }
}

/**
 * `oklch(L C H [/ a])` em sRGB, pela conversão publicada da OKLab (Björn
 * Ottosson). É o formato do CLI do shadcn e do Tailwind 4: sem lê-lo, papel
 * que ficou na cor do CLI seria "não medido" para sempre.
 * ⚠️ Cor fora do gamut do sRGB é cortada no limite, como o navegador faz.
 */
function deOklch (m) {
  const L = m[1].endsWith('%') ? Number(m[1].slice(0, -1)) / 100 : Number(m[1])
  const C = m[2].endsWith('%') ? (Number(m[2].slice(0, -1)) / 100) * 0.4 : Number(m[2])
  const h = (Number(m[3]) * Math.PI) / 180
  const a = m[4] === undefined ? 1 : numero(m[4])
  const oa = C * Math.cos(h)
  const ob = C * Math.sin(h)
  const l = (L + 0.3963377774 * oa + 0.2158037573 * ob) ** 3
  const mm = (L - 0.1055613458 * oa - 0.0638541728 * ob) ** 3
  const s = (L - 0.0894841775 * oa - 1.2914855480 * ob) ** 3
  const linear = [
    4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * mm + 1.7076147010 * s
  ]
  const [r, g, b] = linear.map((c) => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(c, 0) ** (1 / 2.4) - 0.055
    return Math.round(Math.min(1, Math.max(0, v)) * 255)
  })
  return { r, g, b, a }
}

/** A cor da frente composta sobre o fundo (o fundo é tratado como opaco). */
export function sobre (frente, fundo) {
  const a = frente.a
  const mistura = (x, y) => Math.round(x * a + y * (1 - a))
  return { r: mistura(frente.r, fundo.r), g: mistura(frente.g, fundo.g), b: mistura(frente.b, fundo.b), a: 1 }
}

function luminancia ({ r, g, b }) {
  const f = (c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

/** A razão de contraste da WCAG 2, de 1 a 21. */
export function razao (a, b) {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (claro + 0.05) / (escuro + 0.05)
}

/**
 * Os pares que se leem na tela, no vocabulário do shadcn e da casa.
 * Par cujo texto nenhum dos dois arquivos declara é pulado (o tema não o usa).
 */
export const PARES = [
  ['--foreground', '--background'],
  ['--muted-foreground', '--background'],
  ['--card-foreground', '--card'],
  ['--muted-foreground', '--card'],
  ['--popover-foreground', '--popover'],
  ['--primary-foreground', '--primary'],
  // O `link` do registry pinta o texto com `text-primary` direto no fundo.
  ['--primary', '--background'],
  ['--secondary-foreground', '--secondary'],
  ['--accent-foreground', '--accent'],
  ['--muted-foreground', '--muted'],
  ['--destructive', '--background'],
  ['--destructive', '--card'],
  ['--acento', '--background'],
  ['--acento-fg', '--acento']
]

export const MINIMO = 4.5

/**
 * O contraste de cada par do tema, no claro e no escuro.
 *
 * 🚨 O `cli` (o `globals.css`) entra POR BAIXO do tema, na ordem da cascata:
 * no escuro, `.dark` do tema, `.dark` do CLI, `:root` do tema, `:root` do CLI.
 * Sem ele, um papel que ficou na cor do CLI (por decisão escrita) era medido
 * com a cor herdada do tema, que não é a que aparece na tela.
 * @param {{ tokens: string, tema: string, cli?: string, minimo?: number }} entrada
 * @returns {{ escopo: string, texto: string, fundo: string, razao: number|null, ok: boolean, naoMedido?: boolean }[]}
 */
export function contrasteDoTema ({ tokens, tema, cli = '', minimo = MINIMO }) {
  const doKit = mapaDoArquivo(tokens).raiz
  const t = mapaDoArquivo(tema)
  const c = mapaDoArquivo(cli)
  const escopos = [
    ['claro', [t.raiz, c.raiz, doKit], { r: 255, g: 255, b: 255, a: 1 }],
    ['escuro', [t.escuro, c.escuro, t.raiz, c.raiz, doKit], { r: 0, g: 0, b: 0, a: 1 }]
  ]
  const resultado = []
  for (const [escopo, mapas, base] of escopos) {
    const cor = (nome) => corDe(resolverTexto(`var(${nome})`, mapas))
    const pagina = cor('--background')
    const chao = pagina ? sobre(pagina, base) : base
    for (const [texto, fundo] of PARES) {
      if (!mapas.some((m) => m.has(texto)) || !mapas.some((m) => m.has(fundo))) continue
      const f = cor(fundo)
      const x = cor(texto)
      if (!f || !x) {
        resultado.push({ escopo, texto, fundo, razao: null, ok: false, naoMedido: true })
        continue
      }
      const fundoReal = f.a < 1 ? sobre(f, chao) : f
      const frenteReal = x.a < 1 ? sobre(x, fundoReal) : x
      const r = razao(frenteReal, fundoReal)
      resultado.push({ escopo, texto, fundo, razao: Math.round(r * 100) / 100, ok: r >= minimo })
    }
  }
  return resultado
}
