#!/usr/bin/env node
// node .claude/skills/novo-projeto/esqueleto/scripts/gerar-marca.mjs --alvo <projeto>
//        [--primaria #hex] [--fundo #hex] [--texto #hex]
//        [--fonte sistema|<arquivo>] [--fonte-negrito <arquivo>] [--nome-da-fonte "<nome>"] [--refazer]
//
// A marca de um projeto novo sai da ENTREVISTA do /novo-projeto, nunca da casa.
// Três cores
// e uma fonte bastam; o resto se deriva: superfície, borda, texto apagado, o
// vermelho de erro e o registro escuro inteiro.
//
// Escreve, no projeto: `src/styles/tokens.css`, `src/styles/fontes.css`,
// `src/app/icon.svg` e, com fonte em arquivo, `public/fontes/*.woff2`.
//
// 🚨 A COR QUE ELE DEU NUNCA SE AJUSTA CALADA. Primária ou texto sem contraste
// de 4,5:1 com o fundo são RECUSADOS, com a cor mais perto que passa como
// sugestão. O que a conta deriva, ela ajusta sozinha até passar.
//
// 🚨 A prova final é a MESMA conta do conferidor `marca` (`contrasteDoTema`),
// sobre os arquivos gerados e o tema do projeto (`templates/tema.projeto.css`).
//
// Sem cor nenhuma, a marca é a NEUTRA (cinzas e a fonte do sistema), e o
// cabeçalho diz que ela está [a definir].
//
// Prova: testes/teste-marca.mjs

import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join, dirname, basename, extname, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { corDe, razao, sobre, contrasteDoTema, MINIMO } from '../kit/conferido/lib/cor.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const TEMA = join(dirname(AQUI), 'templates', 'tema.projeto.css')

export const NEUTRA = { primaria: '#262626', fundo: '#ffffff', texto: '#171717' }
const NOMES = { primaria: 'primária', fundo: 'fundo', texto: 'texto' }
// A folga das cores DERIVADAS: a conta do conferidor arredonda em duas casas.
const FOLGA = 4.6
const BRANCO = { r: 255, g: 255, b: 255, a: 1 }
const PRETO = { r: 0, g: 0, b: 0, a: 1 }
const ERRO_CLARO = { r: 198, g: 40, b: 40, a: 1 }
const ERRO_ESCURO = { r: 239, g: 83, b: 80, a: 1 }
const PILHA_DO_SISTEMA = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

const hexDe = ({ r, g, b }) => `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`
// No formato do Prettier da semente (o passo `formatar` do portão cobra os arquivos gerados).
const canalDe = ({ r, g, b }) => `${r}, ${g}, ${b}`
const mistura = (a, b, t) => ({ r: Math.round(a.r + (b.r - a.r) * t), g: Math.round(a.g + (b.g - a.g) * t), b: Math.round(a.b + (b.b - a.b) * t), a: 1 })
const eClara = (c) => razao(c, PRETO) >= razao(c, BRANCO)
const texto2 = (n) => String(Math.round(n * 100) / 100).replace('.', ',')
const melhorTextoSobre = (c) => (razao(c, BRANCO) >= razao(c, PRETO) ? BRANCO : PRETO)

/** Leva `cor` na direção de `alvo`, o mínimo possível, até passar contra todos os fundos. */
function ajustar (cor, alvo, fundos, minimo = FOLGA) {
  for (let passo = 0; passo <= 50; passo += 1) {
    const c = mistura(cor, alvo, passo / 50)
    if (fundos.every((f) => razao(c, f) >= minimo)) return c
  }
  return null
}

/**
 * O vermelho de erro como os componentes do registry o PINTAM, que é mais que o
 * par do tema: a 100% e a 90% (`text-destructive/90`, no aviso) sobre o fundo, e
 * o texto sobre o próprio vermelho tingido (o botão destrutivo: 10% e 20% no
 * claro, 20% e 30% no escuro). Só com o par do tema, o axe da vitrine reprova
 * a marca neutra.
 */
function ajustarErro (base, alvo, fundos, tintas) {
  const seLe = (c, f) => razao(c, f) >= FOLGA && razao(sobre({ ...c, a: 0.9 }, f), f) >= FOLGA &&
    tintas.every((t) => razao(c, sobre({ ...c, a: t }, f)) >= FOLGA)
  for (let passo = 0; passo <= 50; passo += 1) {
    const c = mistura(base, alvo, passo / 50)
    if (fundos.every((f) => seLe(c, f))) return c
  }
  return null
}

function lerCores (cores, erros) {
  const lidas = {}
  for (const campo of Object.keys(NEUTRA)) {
    const dado = cores[campo] ?? NEUTRA[campo]
    const cor = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(dado).trim()) ? corDe(String(dado).trim()) : null
    if (!cor) erros.push(`a cor ${NOMES[campo]} ("${dado}") não é um hex: escreva como #1e3a8a`)
    else lidas[campo] = cor
  }
  return lidas
}

/** As cores derivadas, no claro e no escuro. Recusa o que ele escolheu e não se lê. */
function derivar ({ primaria, fundo, texto }, erros) {
  const rumo = eClara(fundo) ? PRETO : BRANCO
  const superficie = mistura(fundo, texto, 0.035)
  const superficie2 = mistura(fundo, texto, 0.07)
  if ([fundo, superficie2].some((f) => razao(texto, f) < MINIMO)) {
    const sugestao = ajustar(texto, rumo, [fundo, superficie2])
    erros.push(`o texto ${hexDe(texto)} dá ${texto2(razao(texto, fundo))}:1 sobre o fundo ${hexDe(fundo)}, e o mínimo é 4,5:1 com folga para as superfícies: a mais perto que passa é ${hexDe(sugestao ?? rumo)}`)
  }
  if (razao(primaria, fundo) < MINIMO) {
    const sugestao = ajustar(primaria, rumo, [fundo])
    erros.push(`a primária ${hexDe(primaria)} dá ${texto2(razao(primaria, fundo))}:1 sobre o fundo ${hexDe(fundo)}, e o link e o botão pedem 4,5:1: a mais perto que passa é ${hexDe(sugestao ?? rumo)}`)
  }
  if (erros.length) return null

  const [maisEscura, maisClara] = razao(fundo, PRETO) <= razao(texto, PRETO) ? [fundo, texto] : [texto, fundo]
  const fundoEscuro = razao(maisEscura, PRETO) > 1.3 ? mistura(maisEscura, PRETO, 0.6) : maisEscura
  const claroBase = razao(maisClara, BRANCO) > 1.12 ? mistura(maisClara, BRANCO, 0.7) : maisClara
  const textoEscuro = ajustar(claroBase, BRANCO, [fundoEscuro, sobre({ ...claroBase, a: 0.1 }, fundoEscuro)]) ?? BRANCO
  const cartaoEscuro = sobre({ ...textoEscuro, a: 0.06 }, fundoEscuro)

  return {
    primaria,
    fundo,
    texto,
    'primaria-texto': melhorTextoSobre(primaria),
    superficie,
    'superficie-2': superficie2,
    borda: mistura(fundo, texto, 0.16),
    apagado: ajustar(mistura(fundo, texto, 0.5), texto, [fundo, superficie]) ?? texto,
    erro: ajustarErro(eClara(fundo) ? ERRO_CLARO : ERRO_ESCURO, rumo, [fundo, superficie], eClara(fundo) ? [0.1, 0.2] : [0.2, 0.3]) ?? rumo,
    'fundo-escuro': fundoEscuro,
    'texto-escuro': textoEscuro,
    'apagado-escuro': ajustar(mistura(fundoEscuro, textoEscuro, 0.55), textoEscuro, [fundoEscuro, cartaoEscuro]) ?? textoEscuro,
    'primaria-escuro': ajustar(primaria, BRANCO, [fundoEscuro, cartaoEscuro]) ?? BRANCO,
    'erro-escuro': ajustarErro(ERRO_ESCURO, BRANCO, [fundoEscuro, cartaoEscuro], [0.2, 0.3]) ?? BRANCO
  }
}

/** O nome da fonte vai para dentro de uma string CSS: só letra, número, espaço e hífen. */
function lerFonte (fonte, erros) {
  if (!fonte || fonte.tipo === 'sistema') return { pilha: PILHA_DO_SISTEMA, faces: [] }
  const nome = (fonte.nome ?? basename(fonte.regular, extname(fonte.regular)).replace(/[-_ ]?(regular|normal)$/i, '')).trim()
  if (!/^[\p{L}\p{N} -]{1,60}$/u.test(nome)) {
    erros.push(`o nome da fonte ("${nome}") só pode ter letra, número, espaço e hífen`)
    return null
  }
  const slug = nome.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const faces = [{ de: fonte.regular, para: `${slug}-regular.woff2`, pesos: fonte.negrito ? '100 499' : '100 900' }]
  if (fonte.negrito) faces.push({ de: fonte.negrito, para: `${slug}-negrito.woff2`, pesos: '500 900' })
  for (const f of faces) {
    if (!existsSync(f.de)) erros.push(`o arquivo da fonte não existe: ${f.de}`)
    else if (!['.woff2', '.ttf', '.otf'].includes(extname(f.de).toLowerCase())) erros.push(`a fonte ${basename(f.de)} tem que vir em woff2, ttf ou otf`)
  }
  return { nome, pilha: `"${nome}", ${PILHA_DO_SISTEMA}`, faces }
}

/** Uma declaração CSS quebrada como o Prettier quebra: acima de 80 colunas, nas vírgulas. */
function declaracao (nome, valor) {
  const inteira = `  ${nome}: ${valor};`
  if (inteira.length <= 80) return inteira
  const partes = valor.split(', ')
  const linhas = []
  let atual = ''
  partes.forEach((parte, i) => {
    const pedaco = `${parte}${i === partes.length - 1 ? ';' : ','}`
    const tentativa = atual ? `${atual} ${pedaco}` : `    ${pedaco}`
    if (atual && tentativa.length > 80) { linhas.push(atual); atual = `    ${pedaco}` } else atual = tentativa
  })
  linhas.push(atual)
  return `  ${nome}:\n${linhas.join('\n')}`
}

function tokensDe (d, pilha, cores, neutra) {
  const origem = neutra
    ? 'A MARCA ESTÁ [A DEFINIR]: estes são os cinzas neutros e a fonte do sistema,\n   até a identidade do projeto existir.'
    : `As cores da entrevista: primária ${hexDe(cores.primaria)}, fundo ${hexDe(cores.fundo)},\n   texto ${hexDe(cores.texto)}. O resto foi derivado delas e passa em 4,5:1.`
  const linha = (nome) => `  --c-${nome}: ${canalDe(d[nome])};`
  return `/* novo-projeto: semente · é seu
   A MARCA DESTE PROJETO, gerada pelo gerar-marca.mjs do /novo-projeto.
   ${origem}

   Só canais (rgb(var(--c-x))) e medidas. O PAPEL (fundo, texto, botão) é do
   tema-shadcn.css: a página pede o papel, nunca a cor. Para trocar a marca,
   rode o gerador de novo com --refazer, ou edite aqui: o arquivo é seu. */

:root {
  /* As três cores de base */
${['primaria', 'fundo', 'texto'].map(linha).join('\n')}

  /* Derivadas no claro */
${['primaria-texto', 'superficie', 'superficie-2', 'borda', 'apagado', 'erro'].map(linha).join('\n')}

  /* O registro escuro */
${['fundo-escuro', 'texto-escuro', 'apagado-escuro', 'primaria-escuro', 'erro-escuro'].map(linha).join('\n')}
  --c-primaria-escuro-texto: ${canalDe(melhorTextoSobre(d['primaria-escuro']))};

  /* A fonte */
${declaracao('--f-display', pilha)}

  /* Os três raios: botão e campo, cartão, o maior */
  --r-sm: 6px;
  --r-md: 10px;
  --r-lg: 16px;

  /* O tempo do movimento */
  --ease-brand: cubic-bezier(0.4, 0, 0.2, 1);
  --dur-in: 0.5s;
  --dur-click: 0.15s;
  --dur-hover: 0.25s;
  --stagger: 0.06s;
}
`
}

function fontesDe (fonte) {
  const cabeca = '/* novo-projeto: semente · é seu\n   AS FONTES DA MARCA DESTE PROJETO, gerado pelo gerar-marca.mjs.'
  if (!fonte.faces.length) return `${cabeca}\n   A marca usa a fonte do sistema: não há arquivo para servir. */\n`
  const faces = fonte.faces.map((f) => `@font-face {
  font-family: "${fonte.nome}";
  src: url("/fontes/${f.para}") format("woff2");
  font-weight: ${f.pesos};
  font-style: normal;
  font-display: swap;
}`).join('\n')
  return `${cabeca}\n   Os arquivos moram em public/fontes/. */\n${faces}\n`
}

const CABECALHO_DO_ICONE = '<!-- novo-projeto: semente · é seu. O ícone da aba'
const iconeDe = (primaria) => `<!-- novo-projeto: semente · é seu. O ícone da aba, na primária da marca: sem
     ele, todo carregamento pede /favicon.ico e o console mostra um 404.
     Troque pelo ícone do projeto quando ele existir. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="${hexDe(primaria)}"/>
</svg>
`

/**
 * A marca inteira, sem escrever nada: `{ ok, tokens, fontes, icone, faces }` ou
 * `{ ok: false, erros }`.
 */
export function marcaDe (cores = {}, { fonte = { tipo: 'sistema' }, tema = readFileSync(TEMA, 'utf8') } = {}) {
  const erros = []
  const lidas = lerCores(cores, erros)
  const daFonte = lerFonte(fonte, erros)
  if (erros.length) return { ok: false, erros }
  const d = derivar(lidas, erros)
  if (!d) return { ok: false, erros }
  const neutra = Object.keys(NEUTRA).every((k) => (cores[k] ?? NEUTRA[k]).toLowerCase() === NEUTRA[k])
  const tokens = tokensDe(d, daFonte.pilha, lidas, neutra)
  const pares = contrasteDoTema({ tokens, tema })
  const ruins = pares.filter((p) => !p.ok)
  if (ruins.length) {
    return { ok: false, erros: ruins.map((p) => `a conta derivou um par que não se lê (${p.escopo}: ${p.texto} sobre ${p.fundo}, ${p.razao}:1); é defeito do gerador`) }
  }
  const derivadas = Object.fromEntries(Object.entries(d).filter(([nome]) => !['primaria', 'fundo', 'texto'].includes(nome)).map(([nome, cor]) => [nome, hexDe(cor)]))
  return { ok: true, tokens, fontes: fontesDe(daFonte), icone: iconeDe(d.primaria), faces: daFonte.faces, derivadas, pares }
}

// `recalcTimestamp=False`: sem ele o fontTools regrava a hora no cabeçalho da
// fonte, e a mesma entrada dá outro woff2 a cada conversão (dois sha
// diferentes com 2 s de intervalo).
const PY_WOFF2 = 'import sys\nfrom fontTools.ttLib import TTFont\nf = TTFont(sys.argv[1], recalcTimestamp=False)\nf.flavor = "woff2"\nf.save(sys.argv[2])\n'

/** A fonte em woff2 numa pasta temporária, antes de tocar o projeto. */
function prepararFaces (faces, tmp, erros) {
  for (const f of faces) {
    const saida = join(tmp, f.para)
    if (extname(f.de).toLowerCase() === '.woff2') { copyFileSync(f.de, saida); continue }
    // Sem shell: o caminho que chega da linha de comando vira argumento, nunca texto de comando.
    const r = spawnSync('python', ['-c', PY_WOFF2, f.de, saida], { encoding: 'utf8', timeout: 120000 })
    if (r.status !== 0 || !existsSync(saida)) erros.push(`não consegui converter ${basename(f.de)} para woff2 (precisa do python com fontTools e brotli): ${(r.stderr || r.error?.message || '').trim().split('\n').pop()}`)
  }
}

/** Escreve a marca no projeto. Recusa sem escrever nada quando algo não fecha. */
export function escreverMarca (alvo, { cores = {}, fonte, refazer = false, icone = true, aviso = console.log } = {}) {
  // O projeto que já existe mede contra o tema DELE: o arquivo é do projeto, e
  // pode ter mudado.
  const temaDoProjeto = join(alvo, 'src', 'styles', 'tema-shadcn.css')
  const m = marcaDe(cores, { fonte, ...(existsSync(temaDoProjeto) ? { tema: readFileSync(temaDoProjeto, 'utf8') } : {}) })
  if (!m.ok) { for (const e of m.erros) aviso(`✗ ${e}`); return 1 }
  const destinos = { tokens: join(alvo, 'src', 'styles', 'tokens.css'), fontes: join(alvo, 'src', 'styles', 'fontes.css'), icone: join(alvo, 'src', 'app', 'icon.svg') }
  // O ícone só se escreve quando não existe ou ainda é o gerado: o que o
  // projeto trocou pelo dele fica.
  const iconeDoProjeto = existsSync(destinos.icone) && !readFileSync(destinos.icone, 'utf8').startsWith(CABECALHO_DO_ICONE)
  if (!refazer && (existsSync(destinos.tokens) || existsSync(destinos.fontes))) {
    aviso('✗ a marca já existe neste projeto (src/styles/tokens.css): para trocar, rode de novo com --refazer')
    return 1
  }
  const tmp = mkdtempSync(join(tmpdir(), 'marca-'))
  try {
    const erros = []
    prepararFaces(m.faces, tmp, erros)
    if (erros.length) { for (const e of erros) aviso(`✗ ${e}`); return 1 }
    // O ícone é do Next (src/app/icon.svg): a trilha página não o recebe.
    const escreveIcone = icone && !iconeDoProjeto
    const arquivos = [['tokens', m.tokens], ['fontes', m.fontes], ...(escreveIcone ? [['icone', m.icone]] : [])]
    for (const [chave, conteudo] of arquivos) {
      mkdirSync(dirname(destinos[chave]), { recursive: true })
      writeFileSync(destinos[chave], conteudo, 'utf8')
    }
    for (const f of m.faces) {
      mkdirSync(join(alvo, 'public', 'fontes'), { recursive: true })
      copyFileSync(join(tmp, f.para), join(alvo, 'public', 'fontes', f.para))
    }
    aviso(`  +  marca do projeto: src/styles/tokens.css, src/styles/fontes.css${escreveIcone ? ', src/app/icon.svg' : ''}${m.faces.length ? `, ${m.faces.length} fonte(s) em public/fontes/` : ''}`)
    if (icone && iconeDoProjeto) aviso('  ·  src/app/icon.svg é o do projeto, e ficou')
  } finally { rmSync(tmp, { recursive: true, force: true }) }
  // O que a conta derivou, e o par mais apertado de cada registro: é o que ele
  // confere antes de aceitar a marca.
  aviso(`     derivadas: ${Object.entries(m.derivadas).map(([nome, hex]) => `${nome} ${hex}`).join(', ')}`)
  for (const escopo of ['claro', 'escuro']) {
    const [justo] = m.pares.filter((p) => p.escopo === escopo).sort((a, b) => a.razao - b.razao)
    if (justo) aviso(`     o par mais justo no ${escopo}: ${justo.texto} sobre ${justo.fundo}, ${texto2(justo.razao)}:1`)
  }
  return 0
}

/** Lê as opções da marca na linha de comando (as mesmas do instalar.mjs). */
export function opcoesDaMarca (pega) {
  const cores = {}
  for (const campo of Object.keys(NEUTRA)) if (pega(`--${campo}`)) cores[campo] = pega(`--${campo}`)
  const arquivo = pega('--fonte')
  const fonte = !arquivo || arquivo === 'sistema'
    ? { tipo: 'sistema' }
    : { tipo: 'arquivo', regular: resolve(arquivo), negrito: pega('--fonte-negrito') ? resolve(pega('--fonte-negrito')) : undefined, nome: pega('--nome-da-fonte') ?? undefined }
  return { cores, fonte }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const args = process.argv.slice(2)
  const pega = (b) => { const i = args.indexOf(b); return i !== -1 ? args[i + 1] : null }
  if (!pega('--alvo')) {
    console.error('uso: gerar-marca.mjs --alvo <projeto> [--primaria #hex] [--fundo #hex] [--texto #hex] [--fonte sistema|<arquivo>] [--fonte-negrito <arquivo>] [--nome-da-fonte "<nome>"] [--refazer]')
    process.exit(2)
  }
  process.exit(escreverMarca(resolve(pega('--alvo')), { ...opcoesDaMarca(pega), refazer: args.includes('--refazer') }))
}
