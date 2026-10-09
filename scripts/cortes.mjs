// Os cortes do vídeo longo: cada trecho escolhido vira Reel 1080x1920 com o
// gancho na fonte da sua marca, a duração medida pelo ffprobe e um quadro para olhar.
//
//   node scripts/cortes.mjs <fonte.mp4> <destaques.json> --saida <pasta> --forma faixa|cheio [--crop-x 0.5] [--marca neutra|<tokens.css>]
//
// destaques.json: [{ n, inicio, fim, gancho }] (segundos). Quem escolhe o trecho
// e escreve o gancho é a skill /cortes; este motor só confere, corta e mede.
//
// Pré-requisitos: ffmpeg e ffprobe no PATH, e o Playwright com o Chromium em
// scripts/ (npm install e npx playwright install chromium, uma vez).
//
// As duas formas:
//   faixa  o vídeo inteiro no meio de um fundo preto, o gancho em branco em cima
//          (serve ao vídeo deitado de 720p, que ampliado no vertical fica borrado)
//   cheio  o vertical recortado do vídeo, com um véu escuro no topo e o gancho em
//          branco (o véu dá contraste sem tarja nem caixa atrás do texto). --crop-x
//          escolhe o centro do recorte, de 0 a 1: o recorte no meio decepa a
//          gravação de tela com o rosto no canto
//
// A fonte do gancho é a primeira família do --f-display da sua marca, lida de
// .claude/skills/carrossel/marca/tokens.css (o /carrossel configurar é quem grava).
// Marca não configurada para o corte, dizendo isso: --marca neutra é a saída
// explícita (Inter, do Google Fonts), e --marca <arquivo.css> aponta outro tokens.
//
// Por que o gancho é PNG: nem todo ffmpeg traz o drawtext, e a fonte da marca não
// entra por ele. O navegador desenha com o tokens.css da marca.
// Por que recodificar sempre: o -c copy começa no quadro-chave e erra o início.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)))
const TOKENS_DA_MARCA = '.claude/skills/carrossel/marca/tokens.css'
const INTER = 'https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap'
const TOLERANCIA = 0.25

/** O render trunca às vezes e fecha curto: a duração medida vale se ficar a até 0,25 s da pedida. */
export function duracaoCerta(pedido, real) {
  return Math.abs(real - pedido) <= TOLERANCIA
}
const GANCHO_SEGUNDOS = 3.5

const semAcento = (s) => s.normalize('NFD').replace(/\p{M}/gu, '')

/** O que está fora da régua do destaque; lista vazia é "pode cortar". */
export function conferirDestaque(d) {
  const motivos = []
  // quem escreve o destaque é um subagente lendo transcrição de terceiro: o n vira
  // nome de arquivo, e o tempo vira argumento do ffmpeg
  if (!Number.isInteger(d.n) || d.n < 1) motivos.push(`n "${d.n}": o número do corte é inteiro a partir de 1`)
  if (!Number.isFinite(d.inicio) || !Number.isFinite(d.fim)) {
    motivos.push('início e fim são números, em segundos')
    return motivos
  }
  const dur = d.fim - d.inicio
  if (!(d.fim > d.inicio)) motivos.push('fim antes do início')
  else if (dur < 15 || dur > 60) motivos.push(`dura ${dur.toFixed(1)} s: o corte vai de 15 a 60 s`)
  const g = String(d.gancho ?? '').trim()
  if (!g) motivos.push('sem gancho')
  if (g.split(/\s+/).filter(Boolean).length > 7) motivos.push('gancho com mais de 7 palavras')
  if (g.includes('?')) motivos.push('gancho em pergunta')
  if (/[—–]/.test(g)) motivos.push('gancho com travessão')
  // sem \b: no JavaScript ele não conta o "é" como letra
  if (/(^|[^\p{L}])não é([^\p{L}]|$)/iu.test(g)) motivos.push('gancho com "não é X, é Y"')
  if (/\p{Extended_Pictographic}/u.test(g)) motivos.push('gancho com emoji')
  if (/\p{L}/u.test(g) && g === g.toUpperCase()) motivos.push('gancho em caixa alta')
  return motivos
}

/** O filtro do ffmpeg: a entrada 0 é o vídeo, a 1 é o PNG do gancho. */
export function filtro({ forma, dur, cropX = 0.5 }) {
  if (!(cropX >= 0 && cropX <= 1)) throw new Error(`crop-x ${cropX}: vai de 0 a 1`)
  const gancho = `overlay=0:0:enable='lt(t,${GANCHO_SEGUNDOS})'`
  if (forma === 'cheio')
    return `[0:v]crop=ih*9/16:ih:(iw-ih*9/16)*${cropX}:0,scale=1080:1920,setsar=1[v];[v][1:v]${gancho}[o]`
  if (forma === 'faixa')
    return `color=c=black:s=1080x1920:d=${dur}[bg];[0:v]scale=1080:-2,setsar=1[v];[bg][v]overlay=0:(H-h)/2:shortest=1[b];[b][1:v]${gancho}[o]`
  throw new Error(`forma "${forma}": use faixa ou cheio`)
}

export function nomeDe(n, gancho) {
  const slug = semAcento(gancho).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50)
  return `${String(n).padStart(2, '0')}-${slug || 'corte'}`
}

/**
 * De onde sai a fonte do gancho. Devolve { nome, head } (o que entra no <head>
 * da página do gancho) ou lança dizendo o que fazer.
 *
 *   pedido ausente   o tokens.css da marca; ausente ou com ESTADO: nao-configurado, para
 *   'neutra'         Inter do Google Fonts, sem marca: só quando o usuário escolheu assim
 *   <arquivo.css>    outro tokens, com o mesmo --f-display
 */
export function resolverMarca(pedido, raiz = RAIZ) {
  if (pedido === 'neutra')
    return { nome: 'neutra', head: `<link href="${INTER}" rel="stylesheet"><style>:root{--f-display:'Inter',Arial,sans-serif;--w-display-bold:700}</style>` }
  const arquivo = pedido ? resolve(pedido) : join(raiz, TOKENS_DA_MARCA)
  const naoConfigurada = !existsSync(arquivo) || /ESTADO:\s*nao-configurado/.test(readFileSync(arquivo, 'utf8'))
  if (naoConfigurada) {
    throw new Error(pedido
      ? `a marca em ${arquivo} não está configurada (o arquivo não existe ou ainda tem ESTADO: nao-configurado)`
      : `a marca não está configurada (${TOKENS_DA_MARCA} não existe ou ainda tem ESTADO: nao-configurado): rode /carrossel configurar, ou passe --marca neutra para o gancho sair na Inter, sem a marca`)
  }
  return { nome: arquivo, head: `<link rel="stylesheet" href="${pathToFileURL(arquivo).href}">` }
}

// O que roda DENTRO da página: o gancho saiu na fonte da marca, ou no fallback?
// Três perguntas, porque cada uma sozinha já aprovou página errada:
//   1. o --f-display chegou? (o <link> do tokens.css pode falhar calado)
//   2. o gancho usa a primeira família dele? (um erro no CSS do .g cai na fonte padrão)
//   3. essa família desenha? Face carregada, ou fonte instalada na máquina.
//      document.fonts.check() não serve: responde sim para família nunca declarada,
//      e é assim que a folha do Google que não chegou passa por fonte certa.
async function checaGancho() {
  const limpa = (s) => s.split(',')[0].trim().replace(/^["']|["']$/g, '')
  const primeira = limpa(getComputedStyle(document.documentElement).getPropertyValue('--f-display'))
  if (!primeira) return { ok: false, motivo: 'o --f-display não chegou: o tokens.css falhou ou não define a fonte' }
  const usada = limpa(getComputedStyle(document.querySelector('.g')).fontFamily)
  if (usada !== primeira) return { ok: false, usada, motivo: `o gancho usa "${usada}", e a fonte da marca é "${primeira}"` }
  await Promise.allSettled([...document.fonts].map((f) => f.load()))
  await document.fonts.ready
  const minhas = [...document.fonts].filter((f) => limpa(String(f.family)) === primeira)
  if (minhas.some((f) => f.status === 'loaded')) return { ok: true, usada }
  if (minhas.length) return { ok: false, usada, motivo: `${primeira}: declarada, mas nenhuma face carregou (o arquivo da fonte falhou)` }
  // sem @font-face: só passa se a fonte estiver instalada na máquina. A largura do
  // texto muda contra as duas genéricas quando a família existe de verdade
  const ctx = document.createElement('canvas').getContext('2d')
  const largura = (familia) => { ctx.font = `700 72px ${familia}`; return ctx.measureText('o gancho que prende 0123').width }
  const instalada = ['monospace', 'serif'].some((g) => largura(`"${primeira}", ${g}`) !== largura(g))
  if (instalada) return { ok: true, usada }
  return { ok: false, usada, motivo: `${primeira}: nem declarada nem instalada (se ela vem do Google Fonts, a folha não chegou: confira a internet)` }
}

const escapa = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// 🚨 A página do gancho é um ARQUIVO, aberto pelo endereço file://: montada com
// setContent ela nasce em about:blank, o navegador não carrega o tokens.css do
// disco, e o gancho sai calado na fonte padrão. Por isso também a conferência da
// fonte no fim, que para o corte se ela faltar.
async function desenharGancho(pagina, { gancho, forma, arquivo, marca }) {
  const topo = forma === 'faixa' ? 360 : 240
  const veu = forma === 'cheio' ? '<div class="veu"></div>' : ''
  const html = `${arquivo}.html`
  writeFileSync(html, `<!doctype html><meta charset="utf-8">${marca.head}<style>
html,body{margin:0;background:transparent}
.veu{position:absolute;inset:0 0 auto 0;height:900px;background:linear-gradient(rgba(0,0,0,.82),rgba(0,0,0,0))}
.g{position:absolute;left:90px;right:90px;top:${topo}px;color:#fff;font-family:var(--f-display);font-weight:var(--w-display-bold,700);
letter-spacing:-.02em;line-height:1.06;font-size:88px}
</style>${veu}<div class="g">${escapa(gancho)}</div>`)
  try {
    await pagina.goto(pathToFileURL(html).href, { waitUntil: 'networkidle' })
    let fonte = await pagina.evaluate(checaGancho)
    if (!fonte.ok) {
      // uma segunda chance: rede que oscilou num instante costuma responder na recarga
      await pagina.reload({ waitUntil: 'networkidle' })
      fonte = await pagina.evaluate(checaGancho)
    }
    if (!fonte.ok) throw new Error(`o gancho não saiu na fonte da marca: ${fonte.motivo}`)
    await pagina.screenshot({ path: arquivo, omitBackground: true })
    return fonte.usada
  } finally {
    rmSync(html, { force: true })
  }
}

const duracao = (arquivo) =>
  Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', arquivo]).toString())

export async function cortar({ fonte, destaques, saida, forma, cropX = 0.5, marca, raiz = RAIZ }) {
  // lista vazia não é sucesso: verde medindo zero é vermelho
  if (!Array.isArray(destaques) || !destaques.length) throw new Error('nenhum destaque para cortar: o destaques.json está vazio')
  // a régua inteira antes de cortar o primeiro: nada sai pela metade
  for (const d of destaques) {
    const m = conferirDestaque(d)
    if (m.length) throw new Error(`destaque ${d.n}: ${m.join('; ')}`)
  }
  filtro({ forma, dur: 1, cropX })
  const daMarca = resolverMarca(marca, raiz)
  mkdirSync(saida, { recursive: true })
  const require = createRequire(join(RAIZ, 'scripts', 'package.json'))
  const { chromium } = require('playwright')
  const nav = await chromium.launch()
  const resultados = []
  try {
    const pagina = await nav.newPage({ viewport: { width: 1080, height: 1920 } })
    for (const d of destaques) {
      const nome = nomeDe(d.n, d.gancho)
      const png = join(saida, `${nome}.gancho.png`)
      const letra = await desenharGancho(pagina, { gancho: d.gancho, forma, arquivo: png, marca: daMarca })
      const pedido = Number((d.fim - d.inicio).toFixed(2))
      const mp4 = join(saida, `${nome}.mp4`)
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(d.inicio), '-to', String(d.fim), '-i', fonte, '-i', png,
        '-filter_complex', filtro({ forma, dur: pedido, cropX }), '-map', '[o]', '-map', '0:a?',
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', mp4])
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', '1', '-i', mp4, '-frames:v', '1', '-vf', 'scale=540:-1', join(saida, `${nome}.jpg`)])
      const real = Number(duracao(mp4).toFixed(2))
      resultados.push({ n: d.n, arquivo: `${nome}.mp4`, gancho: d.gancho, inicio: d.inicio, fim: d.fim, pedido, real, fonte: letra, ok: duracaoCerta(pedido, real) })
    }
  } finally {
    await nav.close()
  }
  writeFileSync(join(saida, 'cortes.json'), JSON.stringify({ fonte, forma, cropX, marca: daMarca.nome, cortes: resultados }, null, 2))
  return resultados
}

async function principal(argv) {
  const [fonte, arquivoDestaques] = argv
  const opcao = (nome, padrao) => (argv.includes(nome) ? argv[argv.indexOf(nome) + 1] : padrao)
  const saida = opcao('--saida')
  const forma = opcao('--forma')
  const cropX = Number(opcao('--crop-x', 0.5))
  const marca = opcao('--marca')
  if (!fonte || !arquivoDestaques || !saida || !forma) {
    console.error('uso: node scripts/cortes.mjs <fonte.mp4> <destaques.json> --saida <pasta> --forma faixa|cheio [--crop-x 0.5] [--marca neutra|<tokens.css>]')
    return 2
  }
  const destaques = JSON.parse(readFileSync(arquivoDestaques, 'utf8'))
  let r
  try {
    r = await cortar({ fonte, destaques, saida, forma, cropX, marca })
  } catch (erro) {
    console.error(erro.message)
    return 1
  }
  for (const c of r) console.log(`${c.ok ? 'ok ' : 'ERRO'} ${c.arquivo}: pedido ${c.pedido} s, saiu ${c.real} s`)
  const ruins = r.filter((c) => !c.ok)
  if (ruins.length) console.error(`${ruins.length} corte(s) com a duração fora de ${TOLERANCIA} s: o render truncou`)
  return ruins.length ? 1 : 0
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  process.exitCode = await principal(process.argv.slice(2))
}
