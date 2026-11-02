#!/usr/bin/env node
// node .claude/skills/novo-projeto/esqueleto/scripts/gerar-marca.mjs --alvo <projeto>
//        [--primaria #hex] [--fundo #hex] [--texto #hex]
//        [--fonte sistema|<arquivo>] [--fonte-negrito <arquivo>] [--nome-da-fonte "<nome>"]
//        [--neutra] [--refazer]
//
// Com a marca do workspace configurada (`identidade/marca.tokens.json`), o
// projeto nasce nela: as cores da interface e o acento, as fontes do texto, do
// destaque e da mono (o arquivo de `identidade/fontes/`, ou o woff2 baixado do
// Google Fonts pela `marca.url`, no estilo da marca), o raio, o botão e o campo
// em pílula quando a marca pede (`raio.pilula`) e o movimento. As cores da
// linha de comando, ou `--neutra`, trocam a marca inteira; `--fonte` troca só a
// fonte do texto.
// Três cores e uma fonte bastam; o resto se deriva pela regra única
// (`scripts/marca/derivar.mjs`): superfície, borda, texto apagado, o vermelho de
// erro e o registro escuro inteiro.
//
// Escreve, no projeto: `src/styles/tokens.css`, `src/styles/fontes.css`,
// `src/app/icon.svg` e, com fonte em arquivo, `public/fontes/*.woff2`.
//
// 🚨 A COR QUE ELE DEU NUNCA SE AJUSTA CALADA. Primária ou texto sem contraste
// de 4,5:1 com o fundo são RECUSADOS, com a cor mais perto que passa como
// sugestão. O que a conta deriva, ela ajusta sozinha até passar. O acento
// que não se lê sobre o fundo vira, no site, o tom mais perto que passa, com
// aviso (a marca do workspace não muda).
//
// 🚨 A prova final é a MESMA conta do conferidor `marca` (`contrasteDoTema`),
// sobre os arquivos gerados e o tema do projeto (`templates/tema.projeto.css`).
//
// Sem marca do workspace e sem cor nenhuma, a marca é a NEUTRA (cinzas e a
// fonte do sistema), e o cabeçalho diz que ela está [a definir].
//
// Prova: testes/teste-marca.mjs

import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join, dirname, basename, extname, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

import { corDe, contrasteDoTema } from '../kit/conferido/lib/cor.mjs'
import { derivarInterface, derivarAcento, derivarMarca, melhorTextoSobre } from '../../../../../scripts/marca/derivar.mjs'
import { lerMarca, raizPadrao, paradaDe, ARQUIVO } from '../../../../../scripts/marca/marca.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const TEMA = join(dirname(AQUI), 'templates', 'tema.projeto.css')

export const NEUTRA = { primaria: '#262626', fundo: '#ffffff', texto: '#171717' } // tecnico: a marca [a definir], sem marca nenhuma
const NOMES = { primaria: 'primária', fundo: 'fundo', texto: 'texto', acento: 'acento' }
// As medidas sem marca: raio de botão, cartão e o maior, e o movimento neutro.
export const MEDIDAS_NEUTRAS = { raio: { sm: 6, md: 10, lg: 16 }, pilula: false, curva: [0.4, 0, 0.2, 1], duracao: { entrada: 500, clique: 150, hover: 250 }, cascata: 60 }
const PILHA_DO_SISTEMA = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
const PILHA_MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'
// A pilha de cada papel sem arquivo nem família: o destaque cai na letra do texto.
const RESERVA = { display: PILHA_DO_SISTEMA, destaque: 'var(--f-display)', mono: PILHA_MONO }
const NOME_DE_FONTE = /^[\p{L}\p{N} -]{1,60}$/u
const pilhaDe = (familias) => familias.map((f) => (/^[a-z-]+$/i.test(f) ? f : `"${f}"`)).join(', ')

const hexDe = ({ r, g, b }) => `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`
// No formato do Prettier da semente (o passo `formatar` do portão cobra os arquivos gerados).
const canalDe = ({ r, g, b }) => `${r}, ${g}, ${b}`
const texto2 = (n) => String(Math.round(n * 100) / 100).replace('.', ',')
const segundos = (ms) => `${Math.round(ms) / 1000}s`

function lerCores (cores, erros) {
  const lidas = {}
  // O acento é opcional: sem ele, o acento do site é a primária.
  for (const campo of [...Object.keys(NEUTRA), ...(cores.acento ? ['acento'] : [])]) {
    const dado = cores[campo] ?? NEUTRA[campo]
    const cor = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(dado).trim()) ? corDe(String(dado).trim()) : null
    if (!cor) erros.push(`a cor ${NOMES[campo]} ("${dado}") não é um hex: escreva como #1e3a8a`) // tecnico: exemplo de formato
    else lidas[campo] = cor
  }
  return lidas
}

/**
 * As cores derivadas, no claro e no escuro, pela regra única, com o acento.
 * Recusa o que ele escolheu e não se lê; o acento que não se lê troca, com aviso.
 */
function derivar (lidas, erros, avisos) {
  const r = derivarInterface(lidas)
  if (!r.ok) { erros.push(...r.erros); return null }
  const { avisos: doAcento, ...acento } = derivarAcento(r.cores, lidas.acento)
  avisos.push(...doAcento)
  return { ...r.cores, ...acento }
}

/**
 * A fonte de um papel (`display`, `destaque` ou `mono`): a pilha, o estilo e
 * as faces a servir. O nome vai para dentro de uma string CSS: só letra,
 * número, espaço e hífen. Sem arquivo, o papel pede a família da marca pelo
 * nome (quem a tem instalada vê) e a reserva dela.
 */
function lerFonte (fonte, erros, papel = 'display') {
  const estilo = fonte?.estilo === 'italic' ? 'italic' : 'normal'
  if (!fonte || fonte.tipo === 'sistema') {
    const familia = fonte?.familia ?? []
    const ruim = familia.find((f) => !NOME_DE_FONTE.test(f))
    if (ruim) { erros.push(`o nome da fonte ("${ruim}") só pode ter letra, número, espaço e hífen`); return null }
    return familia.length ? { pilha: pilhaDe(familia), estilo, faces: [] } : { pilha: RESERVA[papel], estilo: 'normal', faces: [] }
  }
  if (fonte.tipo === 'google') {
    erros.push(`a fonte ${fonte.nome} do Google Fonts ainda não foi baixada (comFonteBaixada, antes de gerar)`)
    return null
  }
  const nome = (fonte.nome ?? basename(fonte.regular, extname(fonte.regular)).replace(/[-_ ]?(regular|normal)$/i, '')).trim()
  if (!NOME_DE_FONTE.test(nome) || (fonte.reserva ?? []).some((f) => !NOME_DE_FONTE.test(f))) {
    erros.push(`o nome da fonte ("${nome}") só pode ter letra, número, espaço e hífen`)
    return null
  }
  const slug = nome.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const prefixo = papel === 'display' ? slug : `${slug}-${papel}`
  // A face pode ser a normal de uma família sem itálico: o navegador a inclina.
  const daFace = fonte.estiloDaFace ?? estilo
  const faces = [{ de: fonte.regular, para: `${prefixo}-regular.woff2`, pesos: fonte.negrito ? '100 499' : '100 900', nome, estilo: daFace }]
  if (fonte.negrito) faces.push({ de: fonte.negrito, para: `${prefixo}-negrito.woff2`, pesos: '500 900', nome, estilo: daFace })
  for (const f of faces) {
    if (!existsSync(f.de)) erros.push(`o arquivo da fonte não existe: ${f.de}`)
    else if (!['.woff2', '.ttf', '.otf'].includes(extname(f.de).toLowerCase())) erros.push(`a fonte ${basename(f.de)} tem que vir em woff2, ttf ou otf`)
  }
  const reserva = fonte.reserva?.length ? pilhaDe(fonte.reserva) : RESERVA[papel]
  return { nome, pilha: `"${nome}", ${reserva}`, estilo, faces }
}

const nomeDe = (f) => (f && f.tipo !== 'sistema' ? f.nome : f?.familia?.[0])

/**
 * A forma da marca numa linha, no cabeçalho do tokens.css: raios, pílula e as
 * fontes de destaque e mono. O conferidor da marca do workspace a compara com
 * a marca de hoje para avisar o projeto que ficou para trás.
 */
export function formaDe ({ medidas = MEDIDAS_NEUTRAS, destaque, mono } = {}) {
  const { raio, pilula } = medidas
  const doDestaque = nomeDe(destaque) ? `${nomeDe(destaque)} ${destaque.estilo === 'italic' ? 'itálico' : 'normal'}` : 'na letra do texto'
  return `raios ${raio.sm}/${raio.md}/${raio.lg} px, botão ${pilula ? 'em pílula' : 'no raio do componente'}, destaque ${doDestaque}, mono ${nomeDe(mono) ?? 'do sistema'}`
}

// O destaque e a mono chegam à página por regra, fora de camada: vencem a
// classe do Tailwind sem depender de ordem, e o --refazer as leva junto.
const REGRAS_DE_FONTE = `
/* A letra de destaque (a classe .destaque) e a mono do código. Fora de
   camada, as regras vencem a classe do Tailwind. */
.destaque {
  font-family: var(--f-destaque);
  font-style: var(--f-destaque-estilo);
}

code,
kbd,
samp,
pre,
.font-mono {
  font-family: var(--f-mono);
}
`
const REGRA_DA_PILULA = `
/* A marca põe botão e campo em pílula (raio.pilula): o raio total vence o
   rounded-* do componente. */
[data-slot="button"],
[data-slot="input"] {
  border-radius: 9999px;
}
`

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

function tokensDe (d, fontes, cores, neutra, medidas = MEDIDAS_NEUTRAS, daMarca = false, forma = formaDe()) {
  const origem = neutra
    ? 'A MARCA ESTÁ [A DEFINIR]: estes são os cinzas neutros e a fonte do sistema,\n   até a identidade do projeto existir.'
    : `As cores ${daMarca ? 'da marca do workspace (identidade/marca.tokens.json)' : 'da entrevista'}: primária ${hexDe(cores.primaria)}, fundo ${hexDe(cores.fundo)},\n   texto ${hexDe(cores.texto)}. O resto foi derivado delas e passa em 4,5:1.`
  const { raio, pilula, curva, duracao, cascata } = medidas
  const linha = (nome) => `  --c-${nome}: ${canalDe(d[nome])};`
  return `/* novo-projeto: semente · é seu
   A MARCA DESTE PROJETO, gerada pelo gerar-marca.mjs do /novo-projeto.
   ${origem}
   A forma: ${forma}.

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

  /* O acento: a palavra, o link, o traço (a primária quando não há acento) */
${['acento', 'acento-texto', 'acento-escuro', 'acento-escuro-texto'].map(linha).join('\n')}

  /* As fontes: o texto, o destaque (a classe .destaque) e a mono */
${declaracao('--f-display', fontes.display.pilha)}
${declaracao('--f-destaque', fontes.destaque.pilha)}
  --f-destaque-estilo: ${fontes.destaque.estilo};
${declaracao('--f-mono', fontes.mono.pilha)}

  /* Os três raios: botão e campo, cartão, o maior */
  --r-sm: ${raio.sm}px;
  --r-md: ${raio.md}px;
  --r-lg: ${raio.lg}px;
  /* 1 quando a marca põe botão e campo em pílula: a tela da vitrine lê */
  --forma-pilula: ${pilula ? 1 : 0};

  /* O tempo do movimento */
  --ease-brand: cubic-bezier(${curva.join(', ')});
  --dur-in: ${segundos(duracao.entrada)};
  --dur-click: ${segundos(duracao.clique)};
  --dur-hover: ${segundos(duracao.hover)};
  --stagger: ${segundos(cascata)};
}
${REGRAS_DE_FONTE}${pilula ? REGRA_DA_PILULA : ''}`
}

function fontesDe (lista) {
  const cabeca = '/* novo-projeto: semente · é seu\n   AS FONTES DA MARCA DESTE PROJETO, gerado pelo gerar-marca.mjs.'
  if (!lista.length) return `${cabeca}\n   A marca usa a fonte do sistema: não há arquivo para servir. */\n`
  const faces = lista.map((f) => `@font-face {
  font-family: "${f.nome}";
  src: url("/fontes/${f.para}") format("woff2");
  font-weight: ${f.pesos};
  font-style: ${f.estilo};
  font-display: swap;
}`).join('\n')
  return `${cabeca}\n   Os arquivos moram em public/fontes/. */\n${faces}\n`
}

const CABECALHO_DO_ICONE = '<!-- novo-projeto: semente · é seu. O ícone da aba'
// O canto do ícone acompanha o raio do cartão, na escala do ícone de 32 px.
export const raioDoIcone = (raio = MEDIDAS_NEUTRAS.raio) => Math.min(16, Math.max(2, Math.round(raio.md * 0.7)))
const iconeDe = (primaria, raio) => `<!-- novo-projeto: semente · é seu. O ícone da aba, na primária da marca: sem
     ele, todo carregamento pede /favicon.ico e o console mostra um 404.
     Troque pelo ícone do projeto quando ele existir. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="${raioDoIcone(raio)}" fill="${hexDe(primaria)}"/>
</svg>
`

/**
 * A marca inteira, sem escrever nada: `{ ok, tokens, fontes, icone, faces }` ou
 * `{ ok: false, erros }`.
 */
export function marcaDe (cores = {}, { fonte = { tipo: 'sistema' }, destaque, mono, tema = readFileSync(TEMA, 'utf8'), medidas = MEDIDAS_NEUTRAS, daMarca = false } = {}) {
  const erros = []
  const avisos = []
  const lidas = lerCores(cores, erros)
  const fontes = { display: lerFonte(fonte, erros), destaque: lerFonte(destaque, erros, 'destaque'), mono: lerFonte(mono, erros, 'mono') }
  if (erros.length) return { ok: false, erros }
  const d = derivar(lidas, erros, avisos)
  if (!d) return { ok: false, erros }
  const neutra = Object.keys(NEUTRA).every((k) => (cores[k] ?? NEUTRA[k]).toLowerCase() === NEUTRA[k])
  const tokens = tokensDe(d, fontes, lidas, neutra, medidas, daMarca, formaDe({ medidas, destaque, mono }))
  const pares = contrasteDoTema({ tokens, tema })
  const ruins = pares.filter((p) => !p.ok)
  if (ruins.length) {
    return { ok: false, erros: ruins.map((p) => `a conta derivou um par que não se lê (${p.escopo}: ${p.texto} sobre ${p.fundo}, ${p.razao}:1); é defeito do gerador`) }
  }
  const derivadas = Object.fromEntries(Object.entries(d).filter(([nome]) => !['primaria', 'fundo', 'texto'].includes(nome)).map(([nome, cor]) => [nome, hexDe(cor)]))
  const faces = Object.values(fontes).flatMap((f) => f.faces)
  return { ok: true, tokens, fontes: fontesDe(faces), icone: iconeDe(d.primaria, medidas.raio), faces, derivadas, pares, avisos }
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
export function escreverMarca (alvo, { cores = {}, fonte, destaque, mono, medidas, daMarca = false, avisos = [], refazer = false, icone = true, aviso = console.log } = {}) {
  // O projeto que já existe mede contra o tema DELE: o arquivo é do projeto, e
  // pode ter mudado.
  const temaDoProjeto = join(alvo, 'src', 'styles', 'tema-shadcn.css')
  const m = marcaDe(cores, { fonte, destaque, mono, medidas, daMarca, ...(existsSync(temaDoProjeto) ? { tema: readFileSync(temaDoProjeto, 'utf8') } : {}) })
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
    for (const a of [...avisos, ...m.avisos]) aviso(`  ⚠  ${a}`)
    aviso(`  +  marca do projeto${daMarca ? ' (a do workspace)' : ''}: src/styles/tokens.css, src/styles/fontes.css${escreveIcone ? ', src/app/icon.svg' : ''}${m.faces.length ? `, ${m.faces.length} fonte(s) em public/fontes/` : ''}`)
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

/**
 * A marca do workspace para o projeto: `{ cores, fonte, destaque, mono, medidas,
 * avisos }`, ou
 * `null` quando o workspace não tem marca (o projeto nasce neutro). O arquivo
 * que existe e não fecha (ainda o molde, esquema quebrado, contraste) para com
 * a frase única: neutra calada esconderia a marca quebrada. O projeto serve a
 * fonte dele, offline: com arquivo local, é ele; só com o Google Fonts, a fonte
 * volta como `{ tipo: 'google' }`, e o `comFonteBaixada` baixa o woff2 antes de
 * gerar.
 */
export function marcaDoWorkspace ({ raiz = raizPadrao() } = {}) {
  const m = lerMarca({ raiz })
  if (!m.configurada && !existsSync(join(raiz, ARQUIVO))) return null
  if (!m.configurada) throw new Error(paradaDe(m.motivo))
  const r = m.resolvido
  const d = derivarMarca(r.cor.papel)
  if (d.erros.length) throw new Error(paradaDe(`contraste: ${d.erros.join('; ')}`))
  const i = d.interface
  const avisos = []
  const f = r.fonte.display
  let fonte = { tipo: 'sistema' }
  if (f.arquivo) fonte = { tipo: 'arquivo', regular: join(raiz, 'identidade', f.arquivo), nome: f.familia[0] }
  else if (f.url) fonte = { tipo: 'google', url: f.url, nome: f.familia[0] }
  else avisos.push(`a fonte ${f.familia[0]} da marca não tem arquivo local em identidade/fontes/ nem endereço do Google Fonts: o projeto usa a do sistema (passe --fonte <arquivo> para servir a da marca)`)
  // O destaque e a mono levam o estilo e a reserva da marca; sem arquivo nem
  // Google Fonts, o site os pede pelo nome.
  const [destaque, mono] = ['destaque', 'mono'].map((papel) => {
    const p = r.fonte[papel]
    const base = { nome: p.familia[0], estilo: p.estilo, reserva: p.familia.slice(1) }
    if (p.arquivo) return { ...base, tipo: 'arquivo', regular: join(raiz, 'identidade', p.arquivo) }
    if (p.url) return { ...base, tipo: 'google', url: p.url }
    avisos.push(`a fonte ${p.familia[0]} (${papel}) da marca não tem arquivo local em identidade/fontes/ nem endereço do Google Fonts: o site a pede pelo nome, e quem não a tem instalada vê ${p.familia.slice(1).join(', ') || 'a reserva do navegador'}`)
    return { tipo: 'sistema', familia: p.familia, estilo: p.estilo }
  })
  const mv = r.movimento
  const medidas = {
    raio: { sm: r.raio.sm, md: r.raio.md, lg: r.raio.lg },
    pilula: r.raio.pilula === true,
    curva: mv.curva.principal,
    duracao: { entrada: mv.duracao.media, clique: mv.duracao.rapida, hover: mv.duracao.rapida },
    cascata: mv.cascata
  }
  return { cores: { primaria: i.primaria, fundo: i.fundo, texto: i.texto, acento: d.papeis.acento }, fonte, destaque, mono, medidas, avisos }
}

// O navegador moderno que o Google Fonts atende com woff2 (sem ele, a API
// devolve ttf).
const NAVEGADOR = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const DO_GOOGLE = /^https:\/\/fonts\.gstatic\.com\/[\w./-]+\.woff2$/

/**
 * Os `@font-face` do subconjunto latino de uma folha do Google Fonts:
 * `[{ peso: [de, ate], url }]`, só o estilo pedido (normal ou italic).
 */
export function facesDoGoogle (css, estilo = 'normal') {
  const faces = []
  for (const m of String(css).matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)) {
    if (m[1] !== 'latin') continue
    const corpo = m[2]
    if ((/font-style:\s*(\w+)/.exec(corpo)?.[1] ?? 'normal') !== estilo) continue
    const url = /src:\s*url\(([^)]+)\)\s*format\(['"]woff2['"]\)/.exec(corpo)?.[1]
    const peso = /font-weight:\s*(\d+)(?:\s+(\d+))?/.exec(corpo)
    if (!url || !peso) continue
    faces.push({ peso: [Number(peso[1]), Number(peso[2] ?? peso[1])], url })
  }
  return faces
}

/**
 * Baixa do Google Fonts a fonte da marca (a `marca.url` do
 * `identidade/marca.tokens.json`) para `pasta`, em woff2, e devolve a fonte em
 * arquivo que o gerador serve de `public/fontes/`: o projeto roda offline e sem
 * pedir nada a terceiro. O regular é a face que cobre o peso 400; o negrito, a
 * que cobre o 700, quando é outro arquivo (a fonte variável é um arquivo só).
 * Falha com a frase do conserto; o sha256 de cada arquivo vai no aviso.
 * `buscar` é o `fetch` (os testes passam um de mentira, sem rede).
 */
export async function baixarFonteDoGoogle (fonte, pasta, { buscar = fetch } = {}) {
  const conserto = `ponha o woff2 em identidade/fontes/ e marque "marca.arquivo" na fonte.display do identidade/marca.tokens.json, ou passe --fonte <arquivo> (ou --fonte sistema)`
  const pega = async (url, tipo) => {
    let r
    try { r = await buscar(url, { headers: { 'user-agent': NAVEGADOR } }) } catch (e) { throw new Error(`não consegui baixar a fonte ${fonte.nome} do Google Fonts (${e.cause?.code ?? e.message}): ${conserto}`) }
    if (!r.ok) throw new Error(`o Google Fonts respondeu ${r.status} para a fonte ${fonte.nome} (${url}): ${conserto}`)
    return tipo === 'texto' ? r.text() : Buffer.from(await r.arrayBuffer())
  }
  const css = await pega(fonte.url, 'texto')
  const estilo = fonte.estilo === 'italic' ? 'italic' : 'normal'
  const avisos = []
  let faces = facesDoGoogle(css, estilo)
  let estiloDaFace = estilo
  // A família sem itálico no Google: serve a normal, e o navegador a inclina.
  if (!faces.length && estilo === 'italic') {
    faces = facesDoGoogle(css)
    estiloDaFace = 'normal'
    if (faces.length) avisos.push(`a fonte ${fonte.nome} não tem itálico no Google Fonts (${fonte.url}): o site serve a normal, e o navegador a inclina`)
  }
  const cobre = (p) => faces.find((f) => f.peso[0] <= p && p <= f.peso[1])
  const regular = cobre(400) ?? faces[0]
  if (!regular) throw new Error(`a folha do Google Fonts para ${fonte.nome} não trouxe face latina em woff2 (${fonte.url}): ${conserto}`)
  const negrito = cobre(700)
  const lista = [['regular', regular], ...(negrito && negrito.url !== regular.url ? [['negrito', negrito]] : [])]
  const saida = { tipo: 'arquivo', nome: fonte.nome, estilo, estiloDaFace, reserva: fonte.reserva }
  for (const [papel, face] of lista) {
    if (!DO_GOOGLE.test(face.url)) throw new Error(`a folha do Google Fonts apontou a fonte para fora de fonts.gstatic.com (${face.url}): ${conserto}`)
    const bytes = await pega(face.url, 'bytes')
    if (bytes.subarray(0, 4).toString('latin1') !== 'wOF2') throw new Error(`o arquivo baixado para ${fonte.nome} (${face.url}) não é woff2: ${conserto}`)
    const destino = join(pasta, `${papel}.woff2`)
    writeFileSync(destino, bytes)
    saida[papel] = destino
    avisos.push(`a fonte ${fonte.nome} (${papel}) veio do Google Fonts: ${face.url}, sha256 ${createHash('sha256').update(bytes).digest('hex')}`)
  }
  return { fonte: saida, avisos }
}

/**
 * As opções com as fontes do Google já baixadas (a do texto, a de destaque e a
 * mono, as que são do Google), numa pasta temporária que `limpar()` apaga
 * depois de escrever a marca.
 */
export async function comFonteBaixada (opcoes, { buscar } = {}) {
  const papeis = ['fonte', 'destaque', 'mono'].filter((p) => opcoes[p]?.tipo === 'google')
  if (!papeis.length) return { opcoes, limpar: () => {} }
  const pasta = mkdtempSync(join(tmpdir(), 'fonte-google-'))
  const limpar = () => rmSync(pasta, { recursive: true, force: true })
  try {
    const prontas = { ...opcoes, avisos: [...(opcoes.avisos ?? [])] }
    for (const p of papeis) {
      mkdirSync(join(pasta, p))
      const { fonte, avisos } = await baixarFonteDoGoogle(opcoes[p], join(pasta, p), { buscar })
      prontas[p] = fonte
      prontas.avisos.push(...avisos)
    }
    return { opcoes: prontas, limpar }
  } catch (e) { limpar(); throw e }
}

/**
 * Lê as opções da marca na linha de comando (as mesmas do instalar.mjs). Sem
 * cor na linha e sem `--neutra` (lido da linha de comando, o que vale também no
 * instalar.mjs), vale a marca do workspace, quando configurada, com a fonte da
 * linha quando ela vem.
 */
export function opcoesDaMarca (pega, { raiz = raizPadrao(), neutra = process.argv.includes('--neutra') } = {}) {
  const cores = {}
  for (const campo of Object.keys(NEUTRA)) if (pega(`--${campo}`)) cores[campo] = pega(`--${campo}`)
  const arquivo = pega('--fonte')
  const fonte = !arquivo || arquivo === 'sistema'
    ? { tipo: 'sistema' }
    : { tipo: 'arquivo', regular: resolve(arquivo), negrito: pega('--fonte-negrito') ? resolve(pega('--fonte-negrito')) : undefined, nome: pega('--nome-da-fonte') ?? undefined }
  // A cor da linha troca a marca inteira; a fonte da linha troca só a fonte.
  const ws = !Object.keys(cores).length && !neutra ? marcaDoWorkspace({ raiz }) : null
  // O aviso da fonte do texto sai; o do destaque e o da mono, que dizem o papel entre parênteses, ficam.
  if (ws && arquivo) return { ...ws, fonte, avisos: ws.avisos.filter((a) => !/^a fonte [^(]* da marca/.test(a)), daMarca: true }
  if (ws) return { ...ws, daMarca: true }
  return { cores, fonte }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const args = process.argv.slice(2)
  const pega = (b) => { const i = args.indexOf(b); return i !== -1 ? args[i + 1] : null }
  if (!pega('--alvo')) {
    console.error('uso: gerar-marca.mjs --alvo <projeto> [--primaria #hex] [--fundo #hex] [--texto #hex] [--fonte sistema|<arquivo>] [--fonte-negrito <arquivo>] [--nome-da-fonte "<nome>"] [--neutra] [--refazer]')
    process.exit(2)
  }
  let opcoes
  try { opcoes = opcoesDaMarca(pega) } catch (e) { console.error(`✗ ${e.message}; para o projeto nascer neutro, --neutra`); process.exit(1) }
  let pronta
  try { pronta = await comFonteBaixada(opcoes) } catch (e) { console.error(`✗ ${e.message}`); process.exit(1) }
  try {
    process.exitCode = escreverMarca(resolve(pega('--alvo')), { ...pronta.opcoes, refazer: args.includes('--refazer') })
  } finally { pronta.limpar() }
}
