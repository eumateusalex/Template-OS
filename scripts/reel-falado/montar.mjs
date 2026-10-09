// A montagem do Reel falado: os blocos de legenda escritos à mão, a
// ficha de estilo e a peça viram o `dados.js` que o modelo lê, a peça gerada do
// modelo e o `relatorio.md`.
//
//   node scripts/reel-falado/montar.mjs <pasta> [--conferir] [--ficha <nome ou arquivo>]
//
// Na pasta: `cortes.json` (do fala.py), `legenda.json` ({correcoes, blocos}),
// `peca.json` ({ficha, gancho, capa, capa_quadro, punch, troca_min, fatos, marca}) e, se já houver,
// `relatorio-audio.json`. Nos blocos, [colchetes] marcam o destaque e ~ no começo
// marca o bloco que não vai para a tela (a captura de um fato já carrega a frase).
// As correções trocam palavras da transcrição, uma ou várias ("PG Speed": "PageSpeed").
//
// A marca: a peça lê o `_marca/tokens.css` da pasta (a junção que o
// `nova-peca.mjs --com-marca` cria para a marca do workspace). Sem ela, ou com o
// molde (`ESTADO: nao-configurado`), a montagem recusa, a não ser que a `peca.json`
// peça `"marca": "neutra"`: a Inter do Google Fonts e um acento amarelo, sem a marca.
//
// A régua: palavras na ordem da fala (a recusa para no primeiro desencontro, que
// o resto é cascata dele), bloco com 8 quadros ou mais na tela, no máximo
// `max_palavras` da ficha (uma a mais só quando partir o bloco nas primeiras
// `max_palavras` e na última deixaria um bloco com menos de 8 quadros), nunca
// dois destaques seguidos, destaque nunca só em palavra de ligação, a caixa da
// memória (a linha `**Caixa:**` de `_memoria/escrita-publica.md`, lida por
// `scripts/lib/caixa.js`), gancho com até duas linhas que não repete a fala, fato
// com duas fontes.
//
// `--conferir` valida e não grava nada (o passo 5 do modo); `--ficha` troca a
// ficha sem reescrever a `peca.json` (comparar estilos de legenda).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { maiusculasIndevidas, minusculoPedido, nomesDaPeca, nomesDoVocabulario } = require('../lib/caixa.js')

const RAIZ = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const MODELO = join(RAIZ, '.claude', 'skills', 'cortes', 'reel')
const FICHAS = join(MODELO, 'legendas')
export const FICHA_PADRAO = 'marca'
const INTER = 'https://fonts.googleapis.com/css2?family=Inter:wght@700;800&display=swap'
// o que entra no <head> da peça e da capa no lugar de {{MARCA}}
export const MARCA_NEUTRA = `<link rel="stylesheet" href="${INTER}" />\n    ` +
  "<style>:root { --f-display: 'Inter', Arial, sans-serif; --w-display-bold: 700; --accent: #facc15; }</style>"
export const MARCA_DA_PASTA = '<link rel="stylesheet" href="_marca/tokens.css" />'
const QUADROS_MIN = 8
const PRIMEIRA = 0.017 // o quadro 0 fica limpo
const PUNCH = 1.08 // 1,12 empurra o queixo para a faixa da legenda
const TROCA_MIN = 1.5 // o enquadramento não troca de novo antes disso: o corte vira corte seco
const LIGACAO = new Set(['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
  'com', 'sem', 'por', 'para', 'pra', 'pelo', 'pela', 'que', 'e', 'ou', 'mas', 'se', 'ao', 'à', 'é'])
export const CAMPOS_DA_FICHA = ['fonte', 'peso', 'tamanho', 'cor', 'contorno', 'contorno_cor', 'sombra', 'fundo', 'caixa',
  'posicao_y', 'largura', 'max_palavras', 'entrada', 'destaque']
export const CAMPOS_DO_DESTAQUE = ['cor', 'italico', 'sublinhado', 'sublinhado_cor', 'escala']

const ler = (arq) => JSON.parse(readFileSync(arq, 'utf8'))
const norma = (w) => String(w).toLocaleLowerCase('pt-BR').replace(/[^\p{L}\p{N}%]/gu, '')
const tem = (o, k) => o && Object.hasOwn(o, k) && o[k] !== null && o[k] !== undefined

function arquivoDaFicha(pasta, ficha) {
  const nome = String(ficha || FICHA_PADRAO)
  return nome.endsWith('.json') ? resolve(pasta, nome) : join(FICHAS, `${nome}.json`)
}

// a marca da peça: a do workspace pela junção _marca, ou a neutra quando a peca.json pede
function resolverMarca(pasta, peca, erros) {
  if (peca.marca === 'neutra') return { nome: 'neutra (a Inter, sem a marca)', head: MARCA_NEUTRA }
  if (peca.marca !== undefined) erros.push(`a peca.json pede "marca": "${peca.marca}"; o único valor é "neutra" (sem o campo, vale a marca do workspace)`)
  const tokens = join(pasta, '_marca', 'tokens.css')
  if (!existsSync(tokens) || /ESTADO:\s*nao-configurado/.test(readFileSync(tokens, 'utf8'))) {
    erros.push('a marca não está configurada (a pasta não tem _marca/tokens.css, ou ele ainda é o molde): ' +
      'rode /carrossel configurar e crie a peça com o nova-peca.mjs --com-marca, ou ponha "marca": "neutra" na peca.json para sair na Inter, sem a marca')
    return null
  }
  return { nome: 'a do workspace (_marca/tokens.css)', head: MARCA_DA_PASTA }
}

function conferirFicha(ficha, nome, erros) {
  for (const k of CAMPOS_DA_FICHA) if (!tem(ficha, k)) erros.push(`a ficha ${nome} não tem o campo ${k}`)
  for (const k of CAMPOS_DO_DESTAQUE) if (!tem(ficha.destaque, k)) erros.push(`a ficha ${nome} não tem o campo destaque.${k}`)
}

function lerBlocos(blocos) {
  return blocos.map((texto) => {
    const oculta = texto.startsWith('~')
    let dentro = false
    const tokens = texto.replace(/^~/, '').split(/\s+/).filter(Boolean).map((tok) => {
      const d = dentro || tok.startsWith('[')
      dentro = d && !tok.endsWith(']')
      return { t: tok.replace(/[[\]]/g, ''), d }
    })
    const trechos = []
    for (const tok of tokens) {
      if (trechos.at(-1)?.d === tok.d) trechos.at(-1).t += ` ${tok.t}`
      else trechos.push({ ...tok })
    }
    return { texto, oculta, tokens, trechos }
  })
}

// a fala como a legenda deve escrevê-la: a transcrição com as correções aplicadas,
// de uma ou várias palavras para uma ou várias
function falaCorrigida(palavras, correcoes) {
  const regras = Object.entries(correcoes || {})
    .map(([de, para]) => ({ de: de.split(/\s+/).map(norma).filter(Boolean), para: String(para).split(/\s+/).filter(Boolean) }))
    .sort((a, b) => b.de.length - a.de.length)
  const saida = []
  for (let i = 0; i < palavras.length;) {
    const r = regras.find((x) => x.de.length && x.de.every((w, k) => palavras[i + k] && norma(palavras[i + k].texto) === w))
    const trecho = palavras.slice(i, i + (r ? r.de.length : 1))
    const fala = trecho.map((w) => w.texto).join(' ')
    for (const texto of r ? r.para : [palavras[i].texto]) {
      saida.push({ texto, inicio: trecho[0].inicio, fim: trecho.at(-1).fim, frase: trecho[0].frase, fala })
    }
    i += trecho.length
  }
  return saida
}

function casar(blocos, fala, erros) {
  let i = 0
  for (const [k, b] of blocos.entries()) {
    b.ws = []
    for (const tok of b.tokens) {
      const w = fala[i]
      if (!w) {
        erros.push(`o bloco ${k + 1} ("${b.texto}") sobra: a fala já acabou em "${fala.at(-1)?.texto}"`)
        return false
      }
      if (norma(tok.t) !== norma(w.texto)) {
        erros.push(`bloco ${k + 1} ("${b.texto}"): a fala diz "${norma(w.fala)}" (em ${w.inicio.toFixed(2)} s) e o bloco diz "${tok.t}"; ` +
          'se a transcrição errou, declare a correção em "correcoes" (o resto não foi conferido)')
        return false
      }
      b.ws.push(w)
      i += 1
    }
  }
  if (i < fala.length) {
    erros.push(`falta legenda para o fim da fala: "${fala.slice(i).map((w) => w.texto).join(' ')}"`)
    return false
  }
  return true
}

// A largura de um bloco numa linha, sem navegador: uma sem serifa em peso 700, como a Inter,
// tem em média 0,5 em por letra minúscula e 0,25 em por espaço ("debaixo do link do Google",
// 25 letras, cabe em 960 px a 74 px; "aparecerem de forma mais limpa", 30, quebra). Fonte de
// marca mais larga que isso escapa da conta: o quadro parado (passo 8 do modo) é quem confere.
// Bloco que quebra desce para a faixa do Instagram.
const EM_POR_LETRA = 0.5
const EM_POR_ESPACO = 0.25
function cabeNumaLinha(texto, ficha) {
  const letras = texto.replace(/\s/g, '').length
  const espacos = (texto.match(/\s+/g) || []).length
  return (letras * EM_POR_LETRA + espacos * EM_POR_ESPACO) * ficha.tamanho <= ficha.largura
}

// Quando o bloco sai da tela: na mesma frase, quando entra o próximo; entre frases, 0,25 s
// depois da última palavra (ou antes, se o próximo entrar antes); nunca mais de 0,6 s depois
// dela. Sem próximo, o bloco (a chamada) fica pelo respiro até o END.
function fimDoBloco(ws, prox, END) {
  if (!prox) return END
  const ultima = ws.at(-1)
  const fim = prox.frase === ws[0].frase ? prox.inicio : Math.min(prox.inicio, ultima.fim + 0.25)
  return Math.min(fim, ultima.fim + 0.6)
}

const quadrosNaTela = (ws, fim, fps) => (fim - Math.max(PRIMEIRA, ws[0].inicio)) * fps

// A alternativa ao bloco de `max_palavras` + 1: as primeiras `max_palavras` num bloco e a
// última palavra noutro, que sai da tela quando o bloco inteiro sairia. Ela é bloco curto
// quando um dos dois fica menos de QUADROS_MIN na tela.
function partirDeixaCurto(ws, maxPalavras, fim, fps) {
  const comeco = ws.slice(0, maxPalavras)
  const resto = ws.slice(maxPalavras)
  return quadrosNaTela(comeco, fimDoBloco(comeco, resto[0], fim), fps) < QUADROS_MIN - 1e-6 ||
    quadrosNaTela(resto, fim, fps) < QUADROS_MIN - 1e-6
}

function cronometrar(blocos, END, fps, maxPalavras, erros) {
  blocos.forEach((b, k) => {
    const fim = fimDoBloco(b.ws, blocos[k + 1]?.ws?.[0], END)
    b.inicio = Math.max(PRIMEIRA, b.ws[0].inicio)
    b.fim = fim
    if (b.oculta) return
    const quadros = (fim - b.inicio) * fps
    if (quadros < QUADROS_MIN - 1e-6) {
      erros.push(`bloco ${k + 1} ("${b.texto}") fica ${quadros.toFixed(1)} quadros na tela; o mínimo é ${QUADROS_MIN}: junte com o vizinho`)
    }
    const n = b.tokens.length
    if (n > maxPalavras + 1 || (n === maxPalavras + 1 && !partirDeixaCurto(b.ws, maxPalavras, fim, fps))) {
      erros.push(`bloco ${k + 1} ("${b.texto}") tem ${n} palavras; o máximo é ${maxPalavras} ` +
        `(${maxPalavras + 1} só quando partir em ${maxPalavras} e 1 deixaria um bloco com menos de ${QUADROS_MIN} quadros)`)
    }
  })
}

// a caixa minúscula só se cobra quando a memória a liga (`**Caixa:** minúscula`); `memoria`
// aponta outro escrita-publica.md (a prova usa)
function conferirTexto(blocos, correcoes, erros, memoria) {
  const textos = blocos.map((b) => b.tokens.map((t) => t.t).join(' '))
  const minusculo = minusculoPedido(memoria ? { memoria } : {})
  const nomes = [...nomesDaPeca(textos), ...nomesDoVocabulario(memoria ? { memoria } : {}),
    ...Object.values(correcoes || {}).flatMap((v) => String(v).split(/\s+/))]
  let anterior = null
  blocos.forEach((b, k) => {
    const destaque = b.tokens.filter((t) => t.d)
    if (destaque.length && destaque.every((t) => LIGACAO.has(norma(t.t)))) {
      erros.push(`bloco ${k + 1} ("${b.texto}"): o destaque cai só em "${destaque.map((t) => t.t).join(' ')}", palavra de ligação`)
    }
    const indevidas = minusculo ? maiusculasIndevidas(textos[k], { nomes }) : []
    if (indevidas.length) {
      erros.push(`bloco ${k + 1} ("${b.texto}"): maiúscula fora da caixa minúscula da memória (_memoria/escrita-publica.md) em ${indevidas.join(', ')}`)
    }
    if (b.oculta) return
    if (destaque.length && anterior) erros.push(`blocos ${anterior} e ${k + 1}: dois destaques seguidos na tela`)
    anterior = destaque.length ? k + 1 : null
  })
}

function conferirGancho(peca, primeira, erros) {
  const linhas = String(peca.gancho || '').split('\n').filter((l) => l.trim())
  if (linhas.length > 2) erros.push(`o gancho escrito tem ${linhas.length} linhas; o máximo é duas linhas`)
  const g = linhas.join(' ').split(/\s+/).map(norma).filter(Boolean)
  const f = new Set(String(primeira?.texto || '').split(/\s+/).map(norma))
  if (g.length >= 3 && g.filter((w) => f.has(w)).length / g.length >= 0.8) {
    erros.push('o gancho escrito repete a fala da primeira frase; ele complementa a fala, não repete')
  }
  return { linhas, ate: peca.gancho_ate ?? primeira?.t_ate ?? 0 }
}

function conferirFatos(peca, frases, pasta, erros) {
  return (peca.fatos || []).map((f, k) => {
    if ((f.fontes || []).length < 2) erros.push(`o fato ${k + 1} tem ${(f.fontes || []).length} fonte(s); a régua pede duas fontes`)
    if (!f.captura || !existsSync(join(pasta, f.captura))) erros.push(`o fato ${k + 1}: a captura ${f.captura} não está na pasta`)
    const fr = frases.find((x) => x.frase === f.frase) || {}
    return { inicio: f.de ?? fr.t_de, fim: f.ate ?? fr.t_ate, captura: f.captura, afirmacao: f.afirmacao, fontes: f.fontes || [] }
  })
}

function relatorio(pasta, c, blocos, fala, fatos, correcoes, marca, nomeDaFicha) {
  const s = (x) => Number(x).toFixed(2)
  const audio = existsSync(join(pasta, 'relatorio-audio.json')) ? ler(join(pasta, 'relatorio-audio.json')) : null
  const textoDa = (f) => fala.filter((w) => w.frase === f.frase).map((w) => w.texto).join(' ') || f.texto
  const visiveis = blocos.filter((b) => !b.oculta)
  const L = [`# Relatório · ${basename(pasta)}`, '',
    `- duração: ${s(c.END)} s (a voz acaba em ${s(c.END_voz)} s; respiro com imagem real ${s(c.respiro.real)} s, congelado ${s(c.respiro.congelado)} s)`,
    `- marca: ${marca.nome}; ficha de legenda: ${nomeDaFicha}`,
    `- voz: ${c.voz.lufs} LUFS, pico ${c.voz.pico_dbtp} dBTP (medida em mono, antes da mixagem)`,
    `- microfone: ${c.sincronia ? `sincronizado em ${c.sincronia.deslocamento} s (correlação ${c.sincronia.correlacao})` : 'o áudio da câmera'}`,
    '', '## Avisos', '', ...(c.avisos.length ? c.avisos.map((a) => `- ${a}`) : ['- nenhum']),
    '', '## As frases', '', '| Tempo | Frase | Tomada | Tomadas gravadas |', '|---|---|---|---|',
    ...c.frases.map((f) => `| ${s(f.t_de)} a ${s(f.t_ate)} | ${textoDa(f)} | ${f.escolhida} | ${f.grupo.length} |`),
    '', '## Trocas da última tomada', '',
    ...(c.trocas.length ? c.trocas.map((t) => `- frase ${t.frase}: ficou a ${t.escolhida} no lugar da ${t.ultima} ("${t.descartada}"), porque ${t.razao}`)
      : ['- nenhuma: toda frase usa a última tomada']),
    '', '## Descartados', '', ...(c.descartados.length ? c.descartados.map((d) => `- ${d.i}: "${d.texto}"`) : ['- nenhum']),
    '', '## Legenda', '', `- ${visiveis.length} blocos na tela, ${blocos.length - visiveis.length} ocultos`,
    `- destaques: ${visiveis.flatMap((b) => b.trechos.filter((t) => t.d).map((t) => t.t)).join(', ') || 'nenhum'}`,
    `- correções da transcrição: ${Object.entries(correcoes || {}).map(([a, b]) => `${a} → ${b}`).join(', ') || 'nenhuma'}`,
    '', '## Fatos', '', ...(fatos.length ? fatos.map((f) => `- "${f.afirmacao}" de ${s(f.inicio)} a ${s(f.fim)} s, conferido em ${f.fontes.join(' e ')}`)
      : ['- sem fatos a conferir: a fala não cita número, data, estudo nem notícia']),
    '', '## Som', '', ...(audio ? Object.entries(audio.medidas).map(([k, v]) => `- ${k}: ${v.lufs} LUFS, pico ${v.pico_dbtp} dBTP`) : ['- ainda não mixado'])]
  writeFileSync(join(pasta, 'relatorio.md'), L.join('\n') + '\n')
}

// A peça sai do modelo com o END e o quadro da capa escritos na mídia: o HyperFrames
// descobre vídeo e áudio lendo o HTML, e o que o script põe depois ele não vê.
// A capa é servida da raiz da peça (o HyperFrames serve a composição com a raiz como base), e
// por isso os dois arquivos levam o mesmo <head> da marca.
function gerarPeca(pasta, END, quadroDaCapa, marca) {
  const molde = (arq) => readFileSync(join(MODELO, arq), 'utf8').replaceAll('{{MARCA}}', marca.head)
  writeFileSync(join(pasta, 'index.html'), molde('index.html').replaceAll('{{END}}', String(END)))
  mkdirSync(join(pasta, 'compositions'), { recursive: true })
  writeFileSync(join(pasta, 'compositions', 'capa.html'),
    molde(join('compositions', 'capa.html')).replaceAll('{{CAPA_QUADRO}}', String(+quadroDaCapa.toFixed(3))))
}

export function montar(pasta, { conferir = false, ficha: outraFicha = null, memoria = null } = {}) {
  const c = ler(join(pasta, 'cortes.json'))
  const legenda = ler(join(pasta, 'legenda.json'))
  const peca = ler(join(pasta, 'peca.json'))
  const erros = []
  const marca = resolverMarca(pasta, peca, erros)
  const arqFicha = arquivoDaFicha(pasta, outraFicha ?? peca.ficha)
  const ficha = existsSync(arqFicha) ? ler(arqFicha) : {}
  if (!existsSync(arqFicha)) erros.push(`a ficha de estilo ${arqFicha} não existe`)
  conferirFicha(ficha, basename(arqFicha), erros)
  const blocos = lerBlocos(legenda.blocos || [])
  const fala = falaCorrigida(c.palavras, legenda.correcoes)
  if (casar(blocos, fala, erros)) {
    cronometrar(blocos, c.END, c.fps, ficha.max_palavras ?? 3, erros)
    if (tem(ficha, 'tamanho') && tem(ficha, 'largura')) {
      for (const [k, b] of blocos.entries()) {
        const t = b.tokens.map((x) => x.t).join(' ')
        if (!b.oculta && !cabeNumaLinha(t, ficha)) erros.push(`bloco ${k + 1} ("${b.texto}") não cabe numa linha a ${ficha.tamanho} px em ${ficha.largura}: a segunda linha desce para a faixa do Instagram; parta o bloco`)
      }
    }
    conferirTexto(blocos, legenda.correcoes, erros, memoria)
  }
  // o som sai do END do cortes.json; mixado para outro corte, a voz sairia fora de
  // sincronia com a câmera num render que passa na contagem de quadros
  const arqAudio = join(pasta, 'relatorio-audio.json')
  const endDoSom = existsSync(arqAudio) ? ler(arqAudio).END_s : c.END
  // sem END_s, a diferença dá NaN e passaria calada: não medir não é passar
  if (!Number.isFinite(endDoSom) || Math.abs(endDoSom - c.END) > 1e-3) {
    erros.push(`o som foi mixado para outro corte (END ${endDoSom} s; o corte de agora tem ${c.END} s): rode o som.py de novo`)
  }
  const gancho = conferirGancho(peca, c.frases[0], erros)
  const fatos = conferirFatos(peca, c.frases, pasta, erros)
  if (erros.length || conferir) return erros
  const primeira = c.frases[0]
  const quadroDaCapa = peca.capa_quadro ?? (primeira.t_de + primeira.t_ate) / 2
  const dados = {
    END: c.END, END_voz: c.END_voz, fps: c.fps, respiro: c.respiro, punch: peca.punch ?? PUNCH, troca_min: peca.troca_min ?? TROCA_MIN,
    cortes: c.clipes.slice(1).map((p) => p.t), frases: c.frases.map(({ frase, texto, t_de, t_ate }) => ({ frase, texto, t_de, t_ate })),
    legendas: blocos.map((b) => ({ inicio: +b.inicio.toFixed(3), fim: +b.fim.toFixed(3), frase: b.ws[0].frase, tokens: b.tokens, trechos: b.trechos, oculta: b.oculta })),
    ficha, gancho, fatos: fatos.map(({ inicio, fim, captura }) => ({ inicio, fim, captura })),
    capa: { texto: String(peca.capa || '').replace(/\n/g, ' '), linhas: String(peca.capa || '').split('\n').filter((l) => l.trim()) }
  }
  writeFileSync(join(pasta, 'dados.js'), `window.DADOS = ${JSON.stringify(dados)};\n`)
  gerarPeca(pasta, c.END, quadroDaCapa, marca)
  relatorio(pasta, c, blocos, fala, fatos, legenda.correcoes, marca, basename(arqFicha, '.json'))
  return []
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const pasta = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--ficha')
  if (!pasta) {
    console.error('uso: node scripts/reel-falado/montar.mjs <pasta da peça> [--conferir] [--ficha <nome ou arquivo>]')
    process.exit(2)
  }
  const conferir = args.includes('--conferir')
  const i = args.indexOf('--ficha')
  const erros = montar(resolve(pasta), { conferir, ficha: i >= 0 ? args[i + 1] : null })
  if (erros.length) {
    console.error(erros.join('\n'))
    process.exit(1)
  }
  console.log(conferir ? 'conferido: os blocos, a ficha, o gancho e os fatos batem com a régua' : `montado: ${join(pasta, 'dados.js')}, a peça e o relatorio.md`)
}
