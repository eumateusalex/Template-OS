#!/usr/bin/env node
// A régua portátil da /copy: confere o arquivo de copy de qualquer módulo antes
// de ele chegar a quem pediu. Só usa o Node, para viajar com a pasta da skill;
// a regra do projeto (a caixa, a palavra proibida, o preço) é de outra régua,
// a do projeto, que roda por cima desta.
//
// O formato do arquivo está no SKILL.md, "O arquivo": `módulo:` e `tipo:` antes
// do texto, o texto entre `<!-- texto -->` e `<!-- fim do texto -->`, um bloco
// por `## <função>`, as linhas que abrem com → ou > como anotação, e depois do
// texto o `## rastro` (a fonte de cada número e fala) e o `## trocar antes de
// publicar` (cada provisório do rastro).
//
// Uso:   node conferir.mjs <arquivo.md>
// Saída: 0 passa, dizendo quanto conferiu; 1 algum desvio (cada um com o bloco
// e o motivo); 2 uso errado.
//
// ⚠️ Limite conhecido: a linha do rastro se parte no primeiro ": ", então uma
// fala entre aspas que tem ": " dentro nunca acha a fonte dela, e reprova mesmo
// estando no rastro. Enquanto o `lerSecao` não ler a chave entre aspas inteira,
// a saída é escrever a fala sem dois-pontos (costuma ficar mais clara).

import { readFileSync, existsSync, realpathSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const INICIO = '<!-- texto -->'
const FIM = '<!-- fim do texto -->'

// Os blocos que cada tipo pede, sem acento (os arquivos de modulos/ explicam).
export const OBRIGATORIOS = {
  pagina: {
    venda: ['topo', 'oferta', 'prova', 'objecoes', 'acao'],
    servico: ['topo', 'oferta', 'prova', 'objecoes', 'acao'],
    captura: ['topo', 'oferta', 'prova', 'acao'],
    institucional: ['topo', 'prova', 'acao']
  },
  'resposta-direta': {
    anuncio: ['gancho', 'corpo', 'acao'],
    email: ['assunto', 'abertura', 'corpo', 'acao'],
    vsl: ['gancho', 'abertura', 'prova', 'oferta', 'acao'],
    carta: ['titulo', 'abertura', 'prova', 'oferta', 'acao']
  },
  marca: {
    manifesto: ['o mundo', 'a tensao', 'a crenca', 'o que faz', 'assinatura'],
    slogan: ['opcoes'],
    'guia-de-voz': ['personalidade', 'tom', 'faz e nao faz', 'vocabulario', 'exemplos'],
    campanha: ['big idea', 'peca principal', 'desdobramentos', 'slogan']
  }
}

// O número leva a palavra que o segue: "7 pontos" e "7 dias" são fontes
// diferentes. Com a unidade colada ("21h", "250g"), a unidade já basta.
const RE_NUMERO = /\d+(?:[.,]\d+)*(?:\p{L}+|(?:\s?%)?(?:\s+\p{L}+)?)/gu
const RE_ASPAS = /["“]([^"”\n]{20,})["”]/g
// O que ficou de rascunho: colchete que não é link, as marcas de pendência,
// o texto de enchimento, a variável de modelo e o espaço entre sinais de menor e maior.
const MARCADORES = [
  ['colchete', /\[[^\]\n]+\](?!\()/],
  ['pendência', /(?<!\p{L})(?:TODO|FIXME|XXX|TBD)(?!\p{L})/u],
  ['texto de enchimento', /lorem ipsum/i],
  ['variável de modelo', /\{\{[^}]*\}\}/],
  ['espaço a preencher', /<[^<>\n]+>/]
]

// O texto público não diz de onde o método veio (SKILL.md, regra 3): nem o nome
// das escolas da skill, nem o jargão do diagnóstico, que só faz sentido dentro dela.
const ESCOLAS = [
  ['a escola copy-lp', /copy-lp/i],
  ['a escola de oferta', /escola\s+(?:d[aeo]\s+)?oferta/i],
  ['a escola de consciência', /escola\s+(?:d[aeo]\s+)?consci[eê]ncia/i],
  ['a escola clássica', /escola\s+cl[aá]ssica/i],
  ['o jargão do método (nível de consciência)', /n[ií]vel\s+\d\s+(?:de\s+)?consci[eê]ncia|consci[eê]ncia\s*,?\s*n[ií]vel\s+\d/i],
  ['o jargão do método (estágio de sofisticação)', /est[aá]gio\s+\d\s+(?:de\s+)?sofistica[cç][aã]o|sofistica[cç][aã]o\s*,?\s*est[aá]gio\s+\d/i]
]

const escapar = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// O número inteiro, com a palavra que o segue: o "7" não está em "79" nem o
// "4 da" em "4 dados".
const temNumero = (linha, numero) =>
  new RegExp(`(?<![\\p{L}\\p{N}])${escapar(numero)}(?![\\p{L}\\p{N}]|[.,]\\p{N})`, 'u').test(linha)

const semAcento = s => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
const normal = s => semAcento(s).replace(/\s+/g, ' ')
const chave = s => normal(s).replace(/\s+/g, '-')
const frasesDe = t => t.split(/(?<=[.!?])\s+/).filter(f => /\p{L}/u.test(f))

// O texto, bloco a bloco: sem o título do bloco, sem anotação, sem rótulo e sem
// a marca de lista.
export function lerTexto (texto) {
  const blocos = []
  let atual = null
  for (const bruta of texto.split('\n')) {
    const linha = bruta.trim()
    const titulo = linha.match(/^##\s+(.+)$/)
    if (titulo) { atual = { nome: normal(titulo[1]), linhas: [] }; blocos.push(atual); continue }
    if (!linha || /^[→>]/.test(linha) || !atual) continue
    const rotulo = linha.match(/^(?:[-*]\s+|\d+\.\s+)?\*\*([^*]+):\*\*\s*/)
    const limpo = linha.replace(/^(?:[-*]\s+|\d+\.\s+)?(?:\*\*[^*]+:\*\*\s*)?/, '').replace(/\*\*/g, '').trim()
    if (limpo) atual.linhas.push({ rotulo: rotulo ? normal(rotulo[1]) : null, texto: limpo })
  }
  return blocos
}

// As linhas "- <chave>: <valor>" de uma seção depois do texto.
function lerSecao (resto, nome) {
  const partes = resto.split(/^##\s+/m)
  const secao = partes.find(p => normal(p.split('\n')[0]) === nome)
  if (!secao) return []
  return secao.split('\n').slice(1)
    .map(l => l.match(/^\s*[-*]\s+(.+?):\s+(\S.*)$/))
    .filter(Boolean)
    .map(m => ({ bruta: m[1].trim(), chave: normal(m[1]), valor: normal(m[2]) }))
}

// As variações para teste (títulos, ganchos) também são texto público: viram um
// bloco a mais na conferência, com uma linha por variação.
export function lerVariacoes (resto) {
  const secao = resto.split(/^##\s+/m).find(p => normal(p.split('\n')[0]) === 'variacoes para teste')
  if (!secao) return null
  const linhas = secao.split('\n').slice(1)
    .map(l => l.trim().replace(/^(?:[-*]\s+|\d+\.\s+)/, '').trim())
    .filter(l => l && !/^[→>]/.test(l))
    .map(texto => ({ rotulo: null, texto }))
  return { nome: 'variacoes', linhas }
}

export function conferirCopy (bruto) {
  const texto = String(bruto || '').replace(/\r\n/g, '\n')
  const desvios = []
  const falhou = (onde, motivo) => desvios.push(`${onde}: ${motivo}`)

  const i = texto.indexOf(INICIO)
  const f = texto.indexOf(FIM)
  if (i < 0 || f < i) return { desvios: [`arquivo: não achei os marcadores ${INICIO} e ${FIM}, que cercam o texto público`], medidas: null }

  const antes = texto.slice(0, i)
  const modulo = (antes.match(/^m[oó]dulo:\s*(.+?)\s*$/mi) || [])[1]
  const tipo = (antes.match(/^tipo:\s*(.+?)\s*$/mi) || [])[1]
  const modulos = Object.keys(OBRIGATORIOS)
  let tipos = null
  if (!modulo) falhou('módulo', `falta a linha "módulo:" antes do texto (${modulos.join(', ')})`)
  else if (!OBRIGATORIOS[chave(modulo)]) falhou('módulo', `"${modulo}" não é um dos três: ${modulos.join(', ')}`)
  else tipos = OBRIGATORIOS[chave(modulo)]
  if (!tipo) falhou('tipo', 'falta a linha "tipo:" antes do texto')
  else if (tipos && !tipos[chave(tipo)]) falhou('tipo', `"${tipo}" não é tipo do módulo ${chave(modulo)}: ${Object.keys(tipos).join(', ')}`)

  const blocos = lerTexto(texto.slice(i + INICIO.length, f))
  const linhas = blocos.flatMap(b => b.linhas)
  if (!linhas.length) return { desvios: [...desvios, 'texto: sem texto entre os marcadores; nenhum bloco para conferir'], medidas: null }

  const resto = texto.slice(f + FIM.length)
  const rastro = lerSecao(resto, 'rastro')
  const troca = lerSecao(resto, 'trocar antes de publicar')
  const variacoes = lerVariacoes(resto)

  let numeros = 0
  for (const bloco of variacoes ? [...blocos, variacoes] : blocos) {
    for (const { texto: t } of bloco.linhas) {
      for (const [nome, re] of MARCADORES) {
        if (re.test(t)) falhou(bloco.nome, `marcador esquecido (${nome}) em "${t}": o que falta vai no rastro ou na lista de troca, nunca no texto`)
      }
      for (const [nome, re] of ESCOLAS) {
        if (re.test(t)) falhou(bloco.nome, `cita ${nome} em "${t}": o texto público não diz de onde o método veio`)
      }
      for (const m of t.matchAll(RE_NUMERO)) {
        if (rastro.some(r => temNumero(r.chave, normal(m[0])))) numeros++
        else falhou(bloco.nome, `o número "${m[0].trim()}" não está no rastro com a fonte`)
      }
      for (const m of t.matchAll(RE_ASPAS)) {
        if (!rastro.some(r => r.chave.includes(normal(m[1])))) falhou(bloco.nome, `a fala entre aspas "${m[1]}" não está no rastro com a fonte`)
      }
    }
  }

  // Todo provisório do rastro tem a linha dele na lista de troca.
  const provisorios = rastro.filter(r => /provisorio/.test(r.valor))
  for (const p of provisorios) {
    if (!troca.some(t => t.chave === p.chave)) falhou('rastro', `o provisório ${p.bruta} não está em "trocar antes de publicar"`)
  }

  // Na página, a ação do fim repete a do topo (pode somar o motivo).
  if (chave(modulo || '') === 'pagina') {
    const acaoDe = nome => {
      const b = blocos.find(x => x.nome === nome)
      return b && b.linhas.find(l => l.rotulo === 'acao')
    }
    const topo = acaoDe('topo')
    const fim = acaoDe('acao')
    if (topo && fim && !normal(fim.texto).includes(normal(topo.texto))) {
      falhou('ação', `a ação do fim não repete a do topo ("${fim.texto}" contra "${topo.texto}"): uma página, uma ação`)
    }
  }

  const presentes = new Set(blocos.map(b => b.nome))
  const pedidos = (tipos && tipo && tipos[chave(tipo)]) || []
  for (const nome of pedidos) {
    if (!presentes.has(nome)) falhou(nome, `falta este bloco, que o tipo ${chave(tipo)} pede`)
  }

  const frases = linhas.reduce((s, l) => s + frasesDe(l.texto).length, 0)
  return {
    desvios,
    medidas: { modulo: chave(modulo || ''), tipo: chave(tipo || ''), blocos: blocos.length, frases, numeros, provisorios: provisorios.length, variacoes: variacoes ? variacoes.linhas.length : 0 }
  }
}

function principal () {
  const arquivo = process.argv[2]
  if (!arquivo || !existsSync(arquivo)) {
    console.error(`✗ ${arquivo ? `não achei ${arquivo}` : 'falta o arquivo'}: node conferir.mjs <copy.md>`)
    return 2
  }
  const { desvios, medidas } = conferirCopy(readFileSync(arquivo, 'utf8'))
  for (const d of desvios) console.log(`✗ ${d}`)
  if (desvios.length) { console.log(`✗ ${desvios.length} desvio(s)`); return 1 }
  const m = medidas
  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`
  console.log(`✓ a copy passa · ${m.modulo}/${m.tipo} · ${plural(m.blocos, 'bloco', 'blocos')}, ${m.frases} frases, ` +
    `${plural(m.numeros, 'número', 'números')} com fonte, ${plural(m.provisorios, 'provisório', 'provisórios')} na lista de troca` +
    (m.variacoes ? `, ${plural(m.variacoes, 'variação conferida', 'variações conferidas')}` : ''))
  return 0
}

// Roda só quando é o arquivo chamado, e não quando outra régua o importa.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  process.exitCode = principal()
}
