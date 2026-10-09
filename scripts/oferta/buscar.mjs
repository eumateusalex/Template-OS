#!/usr/bin/env node
// Busca no acervo da skill /oferta: as transcrições que você junta (aula,
// palestra, podcast, reunião gravada), um arquivo por trecho ou por gravação.
// É o que dá fonte à skill: ela só afirma "o acervo diz" com um trecho que
// saiu daqui, citado pelo arquivo e, quando o trecho traz, pelo endereço.
//
// O acervo mora fora do git, por padrão em C:/dev/acervo-oferta (~/dev no
// macOS e no Linux), ou onde a variável OFERTA_ACERVO apontar. A busca é BM25
// em Node, sem dependência, e por palavra: a pergunta vai na língua do
// acervo. Sem acervo, a busca sai 1 e diz como montar; a skill segue só com
// o método.
//
// O formato de um trecho (.md ou .txt, em qualquer subpasta): um frontmatter
// opcional entre --- com title, published, start_seconds, url e source, e o
// texto. Sem frontmatter, o título é o primeiro "# " do arquivo ou o nome dele.
//
// Uso:
//   node scripts/oferta/buscar.mjs "fechamento preço" [--limite 8] [--json]
//   node scripts/oferta/buscar.mjs --conferir
//   node scripts/oferta/buscar.mjs --conferir-citacoes <relatorio.json ou texto.md> [--json]
//   [--acervo <pasta>]  (padrão: $OFERTA_ACERVO ou C:/dev/acervo-oferta)
//
// Saída: 0 achou (ou tudo confere), 1 acervo ausente ou vazio, trecho com
// endereço ruim ou citação que não confere, 2 pergunta vazia ou bandeira
// desconhecida.

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join, relative, basename, extname, dirname } from 'node:path'
import { homedir } from 'node:os'

// A pasta padrão do acervo, fora do workspace: C:/dev no Windows, ~/dev no resto.
const PASTA_PADRAO = process.platform === 'win32' ? 'C:/dev/acervo-oferta' : join(homedir(), 'dev', 'acervo-oferta')
export const ACERVO_PADRAO = process.env.OFERTA_ACERVO || PASTA_PADRAO
export const COMO_MONTAR = 'ponha as transcrições numa pasta (um .md ou .txt por trecho ou por gravação, o molde em "Montar o acervo" no SKILL.md da /oferta)'

const EXTENSOES = new Set(['.md', '.txt'])
// Pastas que não são acervo, mesmo dentro dele (o clone de um repositório, por exemplo).
const FORA = new Set(['.git', 'node_modules', '.github'])

// Palavras que aparecem em quase todo trecho e não separam um do outro, em
// português e em inglês (sem acento: a comparação tira o acento antes).
const VAZIAS = new Set((
  'a an the and or but if of to in on at for with by from as is are was were be been ' +
  'it its this that these those i you he she we they me my your our their him her them us so do does did ' +
  'have has had not no yes just like um uh yeah okay right gonna wanna got get can will would could should ' +
  'what which who how when where why there here then than also very really about into out up down all some ' +
  'any more most much many one two ' +
  'o os as um uma uns umas de do da dos das no na nos nas em por para pra com sem que se e ou mas ' +
  'ao aos pelo pela pelos pelas eu tu ele ela nos eles elas voce voces meu minha seu sua isso isto esse essa ' +
  'este esta aquele aquela ja nao sim tem ter ser estar foi era sao esta estao vai vou muito mais menos ' +
  'tambem como quando onde porque entao tipo ne ai la aqui'
).split(' '))

const K1 = 1.2
const B = 0.75

export function semAcento (texto) {
  return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function palavras (texto) {
  return semAcento(texto).toLowerCase().replace(/[’']/g, '').split(/[^a-z0-9]+/).filter(p => p.length > 1 && !VAZIAS.has(p))
}

export function carimbo (segundos) {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = String(segundos % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

// Um arquivo de trecho: o frontmatter opcional, os títulos e o texto.
// `arquivo` é o caminho dentro do acervo, com barra normal: é a identidade do trecho.
export function lerTrecho (bruto, arquivo) {
  // Arquivo gravado no Windows traz \r\n, e o \r grudado no fim da linha quebra o frontmatter.
  let conteudo = bruto.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const meta = {}
  if (conteudo.startsWith('---\n')) {
    const fim = conteudo.indexOf('\n---', 3)
    if (fim > 0) {
      for (const linha of conteudo.slice(4, fim).split('\n')) {
        const m = linha.match(/^(\w+):\s*(.*)$/)
        if (m) meta[m[1]] = m[2].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1').replace(/\\"/g, '"')
      }
      conteudo = conteudo.slice(fim + 4).replace(/^[^\n]*\n?/, '')
    }
  }
  const linhas = conteudo.split('\n')
  const titulo = linhas.find(l => /^#{1,6} /.test(l))
  const corpo = linhas
    .filter(l => !/^#{1,6} /.test(l) && !/^(Source|Fonte): /.test(l))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
  const inicio = meta.start_seconds !== undefined && meta.start_seconds !== '' && Number.isFinite(Number(meta.start_seconds))
    ? Number(meta.start_seconds)
    : null
  const pasta = dirname(arquivo)
  return {
    file: arquivo,
    // O que agrupa trechos da mesma gravação: o source do frontmatter, a pasta, ou o próprio arquivo.
    source: meta.source || meta.episode_id || (pasta && pasta !== '.' ? pasta : basename(arquivo, extname(arquivo))),
    title: meta.title || (titulo ? titulo.replace(/^#{1,6} /, '').trim() : basename(arquivo, extname(arquivo))),
    published: meta.published || meta.date || null,
    start_seconds: inicio,
    url: meta.url || meta.timestamp_url || null,
    quote: corpo
  }
}

export function lerAcervo (acervo) {
  const trechos = []
  const andar = pasta => {
    for (const item of readdirSync(pasta, { withFileTypes: true })) {
      const caminho = join(pasta, item.name)
      if (item.isDirectory()) { if (!FORA.has(item.name)) andar(caminho) }
      else if (item.isFile() && EXTENSOES.has(extname(item.name).toLowerCase())) {
        const arquivo = relative(acervo, caminho).split(/[\\/]/).join('/')
        trechos.push(lerTrecho(readFileSync(caminho, 'utf8'), arquivo))
      }
    }
  }
  andar(acervo)
  // A ordem das pastas não decide nada, mas fica estável entre sistemas.
  return trechos.sort((a, b) => a.file.localeCompare(b.file))
}

export function acervoExiste (acervo) {
  try { return statSync(acervo).isDirectory() } catch { return false }
}

export function buscar (trechos, pergunta, limite = 8) {
  const termos = [...new Set(palavras(pergunta))]
  if (!termos.length) return []
  // O título entra duas vezes: ele resume a gravação melhor que o trecho solto.
  const docs = trechos.map(t => palavras(`${t.title} ${t.title} ${t.quote}`))
  const media = docs.reduce((s, d) => s + d.length, 0) / (docs.length || 1)
  const df = Object.fromEntries(termos.map(t => [t, docs.filter(d => d.includes(t)).length]))
  const pontuados = []
  docs.forEach((doc, i) => {
    let pontos = 0
    for (const termo of termos) {
      const tf = doc.filter(p => p === termo).length
      if (!tf) continue
      const idf = Math.log(1 + (docs.length - df[termo] + 0.5) / (df[termo] + 0.5))
      pontos += idf * (tf * (K1 + 1)) / (tf + K1 * (1 - B + B * doc.length / media))
    }
    if (pontos > 0) pontuados.push({ ...trechos[i], score: Number(pontos.toFixed(3)) })
  })
  // O mesmo texto em dois arquivos aparece uma vez, para não ocupar o limite
  // nem contar como "duas fontes" na mesma regra.
  const vistos = new Set()
  return pontuados
    .sort((a, b) => b.score - a.score || a.file.localeCompare(b.file))
    .filter(t => {
      const chave = normalizar(t.quote).slice(0, 300)
      if (vistos.has(chave)) return false
      vistos.add(chave)
      return true
    })
    .slice(0, limite)
    .map(t => (t.start_seconds === null ? t : { ...t, stamp: carimbo(t.start_seconds) }))
}

export function normalizar (texto) {
  return String(texto || '').normalize('NFC').toLowerCase().replace(/[’']/g, "'").replace(/[“”"…]/g, '').replace(/\s+/g, ' ').trim()
}

export const ehHttps = url => /^https:\/\/[^\s"'<>`]+$/.test(String(url || ''))

// O endereço de um trecho do acervo vale quando é https e, se traz o t=, o t=
// bate com o início do trecho. Trecho sem endereço é válido: a fonte é o arquivo.
export function enderecoRuim (t) {
  if (!t.url) return null
  if (!ehHttps(t.url)) return 'o endereço não é https'
  const m = String(t.url).match(/[?&#]t=(\d+)s?(?:&|$)/)
  if (m && t.start_seconds !== null && t.start_seconds !== undefined && Number(m[1]) !== Number(t.start_seconds)) {
    return `o t= do endereço (${m[1]} s) diverge do início (${t.start_seconds} s)`
  }
  return null
}

// O integro do acervo: endereço https com o t= do início, e trecho com texto.
export function conferirAcervo (trechos) {
  const ruins = []
  for (const t of trechos) {
    const motivo = enderecoRuim(t)
    if (motivo) ruins.push({ file: t.file, motivo })
    if (!t.quote) ruins.push({ file: t.file, motivo: 'o trecho não tem texto' })
  }
  return ruins
}

// Uma citação num texto em Markdown: o arquivo do acervo entre parênteses,
// com o link do endereço logo antes quando o trecho traz endereço.
//   [título · 1:30](https://...) (acervo: pasta/000090.md)
//   (acervo: pasta/transcricao.md)
const CITACAO = /(?:\[[^\]\n]*\]\(([^)\s]+)\)\s*)?\(acervo: ([^)\s]+)\)/g
const LINK = /https?:\/\/[^\s)\]"'>]+/g
const ARQUIVO_VALIDO = /^(?!\/)(?!.*\.\.)[^\s\\:]+\.(?:md|txt)$/i

// As citações de um relatorio.json (cada evidência) ou de um texto em Markdown
// conferidas contra o acervo: é a máquina, e não a instrução ao modelo, que
// recusa citação inventada.
// soFormato: sem acervo à mão, confere só a forma das citações de um texto em
// Markdown; quem chama diz em voz alta que a existência não foi conferida.
export function conferirCitacoes (trechos, arquivo, conteudo, { soFormato = false } = {}) {
  const porArquivo = new Map(trechos.map(t => [t.file, t]))
  const falhas = []
  let conferidas = 0

  if (arquivo.toLowerCase().endsWith('.json')) {
    // Percorre na mesma ordem e com o mesmo filtro do relatorio.py (seção e
    // subseção que são objeto, evidência objeto com frase, arquivo ou link):
    // o `indice` da falha aponta a mesma evidência lá.
    const relatorio = JSON.parse(conteudo.replace(/^\uFEFF/, ''))
    const objeto = x => x && typeof x === 'object' && !Array.isArray(x)
    let indice = -1
    for (const sec of (objeto(relatorio) && Array.isArray(relatorio.sections) ? relatorio.sections : []).filter(objeto)) {
      for (const sub of (Array.isArray(sec.subsections) ? sec.subsections : []).filter(objeto)) {
        for (const ev of (Array.isArray(sub.evidence) ? sub.evidence : []).filter(objeto)) {
          if (!ev.quote && !ev.file && !ev.url) continue
          indice++
          conferidas++
          const onde = `${sec.title || '?'} › ${sub.title || '?'} › ${ev.title || ev.file || '?'}`
          const falhar = motivo => falhas.push({ indice, onde, motivo })
          if (!ev.file) { falhar('a citação não diz o arquivo do acervo (file)'); continue }
          const fonte = porArquivo.get(String(ev.file))
          if (!fonte) { falhar(`o trecho ${ev.file} não existe no acervo`); continue }
          if (ev.url) {
            if (!ehHttps(ev.url)) { falhar('o endereço não é https'); continue }
            if (!fonte.url) { falhar('o acervo não traz endereço para este trecho'); continue }
            if (ev.url !== fonte.url) { falhar(`o link não é o do trecho no acervo (${fonte.url})`); continue }
          }
          if (ev.quote && !normalizar(fonte.quote).includes(normalizar(ev.quote))) falhar('a frase não está no trecho do acervo')
        }
      }
    }
  } else {
    // Todo link conta: o que não está ao lado de um arquivo do acervo reprova
    // em vez de passar calado.
    for (const m of conteudo.matchAll(CITACAO)) {
      conferidas++
      const [, url, arq] = m
      const onde = `(acervo: ${arq})`
      if (!ARQUIVO_VALIDO.test(arq)) { falhas.push({ onde, motivo: 'o arquivo não está na forma do acervo (caminho relativo com barra normal, .md ou .txt)' }); continue }
      if (url && !ehHttps(url)) { falhas.push({ onde, motivo: `o endereço não é https: ${url}` }); continue }
      if (soFormato) continue
      const fonte = porArquivo.get(arq)
      if (!fonte) { falhas.push({ onde, motivo: `o trecho ${arq} não existe no acervo` }); continue }
      if (url && url !== fonte.url) falhas.push({ onde, motivo: fonte.url ? `o link não é o do trecho no acervo (${fonte.url})` : 'o acervo não traz endereço para este trecho' })
    }
    // Os links que sobraram, fora de uma citação.
    const semCitacao = conteudo.replace(CITACAO, s => ' '.repeat(s.length))
    for (const m of semCitacao.matchAll(LINK)) {
      conferidas++
      falhas.push({ onde: m[0], motivo: 'link sem o arquivo do acervo ao lado: [título](endereço) (acervo: <arquivo>)' })
    }
  }
  // Verde medindo zero é vermelho: arquivo sem citação não aprova.
  // semCitacao deixa quem chama tirar só esta falha sem depender do texto dela.
  if (!conferidas) falhas.push({ onde: arquivo, motivo: 'nenhuma citação para conferir', semCitacao: true })
  return { conferidas, falhas }
}

function argumentos (argv) {
  const opcoes = { limite: 8, json: false, conferir: false, citacoes: null, acervo: ACERVO_PADRAO, pergunta: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--json') opcoes.json = true
    else if (a === '--conferir') opcoes.conferir = true
    else if (a === '--conferir-citacoes') opcoes.citacoes = argv[++i]
    else if (a === '--limite') opcoes.limite = Number(argv[++i])
    else if (a === '--acervo') opcoes.acervo = argv[++i]
    else if (a.startsWith('--')) return { erro: `não conheço a bandeira ${a}` }
    else opcoes.pergunta.push(a)
  }
  opcoes.pergunta = opcoes.pergunta.join(' ').trim()
  return opcoes
}

function principal () {
  const o = argumentos(process.argv.slice(2))
  if (o.erro) { console.error(`✗ ${o.erro}`); return 2 }
  if (!o.conferir && !o.citacoes && !o.pergunta) {
    console.error('✗ falta a pergunta: node scripts/oferta/buscar.mjs "fechamento preço" [--limite 8] [--json]')
    return 2
  }
  if (!acervoExiste(o.acervo)) {
    console.error(`✗ não achei o acervo em ${o.acervo}.`)
    console.error(`  Para montar: ${COMO_MONTAR}.`)
    console.error('  Ou aponte outro lugar com --acervo <pasta> ou a variável OFERTA_ACERVO.')
    return 1
  }
  const trechos = lerAcervo(o.acervo)
  // Verde medindo zero é vermelho: acervo sem trecho não aprova nem busca nada.
  if (!trechos.length) {
    console.error(`✗ o acervo em ${o.acervo} está vazio (nenhum .md ou .txt).`)
    console.error(`  Para montar: ${COMO_MONTAR}.`)
    return 1
  }
  const fontes = new Set(trechos.map(t => t.source)).size

  if (o.citacoes) {
    if (!existsSync(o.citacoes)) { console.error(`✗ não achei ${o.citacoes}`); return 2 }
    const { conferidas, falhas } = conferirCitacoes(trechos, o.citacoes, readFileSync(o.citacoes, 'utf8'))
    if (o.json) {
      console.log(JSON.stringify({ trechos: trechos.length, fontes, conferidas, falhas }, null, 2))
    } else {
      for (const f of falhas) console.log(`✗ ${f.onde}: ${f.motivo}`)
      console.log(`${falhas.length ? '✗' : '✓'} ${conferidas} citações conferidas contra ${trechos.length} trechos, ${falhas.length} com problema`)
    }
    return falhas.length ? 1 : 0
  }

  if (o.conferir) {
    const ruins = conferirAcervo(trechos)
    for (const r of ruins) console.log(`✗ ${r.file}: ${r.motivo}`)
    if (ruins.length) { console.log(`✗ ${ruins.length} problema(s) em ${trechos.length} trechos`); return 1 }
    console.log(`✓ acervo íntegro: ${trechos.length} trechos de ${fontes} fontes, todo endereço em https com o t= do início`)
    return 0
  }

  const achados = buscar(trechos, o.pergunta, o.limite)
  if (o.json) { console.log(JSON.stringify(achados, null, 2)); return 0 }
  if (!achados.length) { console.log('nenhum trecho com os termos da pergunta. Tente outros termos, na língua do acervo.'); return 0 }
  achados.forEach((a, i) => {
    console.log(`\n${i + 1}. ${[a.title, a.stamp, a.published].filter(Boolean).join(' · ')}`)
    console.log(`   acervo: ${a.file}${a.url ? ` · ${a.url}` : ''}`)
    console.log(`   ${a.quote.length > 600 ? a.quote.slice(0, 600) + '…' : a.quote}`)
  })
  return 0
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  process.exitCode = principal()
}
