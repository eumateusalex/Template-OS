// O corte da fala do Reel falado: a escolha das tomadas
// vira câmera e voz cortadas como um editor cortaria.
//
// A gravação do teste é sintética, com resposta conhecida: "palavras" são
// rajadas de 1 kHz a −9 dB sobre um chão de ruído a −50 dB, e a transcrição erra
// do jeito que o Whisper erra (marca o começo 0,3 s antes do som e o fim 0,3 s
// depois). Um "ok" descartado, em 300 Hz, fica colado na tomada escolhida para
// provar que a cauda não o invade.
//
// Os números: 40 ms antes da palavra, janela de 10 ms a −35 dB, corrida de 150 ms abaixo de
// −32 dB, silêncio acima de 300 ms vira 120 ms, pedaço mínimo de 1,5 s (abaixo
// disso, punch-in a cada 1 a 1,5 s), J cut de
// 50 ms, cauda de 170 ms, respiro de 0,8 s com até 0,3 s de imagem real (depois disso
// quem grava se mexe para desligar a câmera), voz em −14 LUFS com pico até −1 dBTP.
//
//   node --test scripts/reel-falado/teste-fala.mjs

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'

const AQUI = resolve(fileURLToPath(new URL('.', import.meta.url)))
const MOTOR = join(AQUI, 'fala.py')
const pasta = mkdtempSync(join(tmpdir(), 'teste-fala-'))
after(() => rmSync(pasta, { recursive: true, force: true }))
const ENV = { ...process.env, PYTHONIOENCODING: 'utf-8' }
const PY = process.env.PYTHON || 'python' // o Python 3.12 com numpy e scipy; a variável PYTHON aponta outro
const FPS = 30

function py(codigo, ...args) {
  const r = spawnSync(PY, ['-c', codigo, ...args], { encoding: 'utf8', env: ENV })
  assert.equal(r.status, 0, r.stderr)
  return r.stdout
}
function ff(...args) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...args], { encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
}
function sonda(arq, campos) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-count_frames', '-show_entries', campos, '-of', 'json', arq], { encoding: 'utf8' })
  return JSON.parse(r.stdout)
}

// o áudio sintético: rajadas [inicio, fim, hz] sobre ruído, 48 kHz mono
const GERA_AUDIO = `
import sys, json, numpy as np
from scipy.io import wavfile
sr = 48000
rajadas, dur, saida, atraso = json.loads(sys.argv[1]), float(sys.argv[2]), sys.argv[3], float(sys.argv[4])
t = np.arange(int(dur * sr)) / sr
rng = np.random.default_rng(1)
x = 0.003 * rng.standard_normal(len(t))
for a, b, hz in rajadas:
    m = (t >= a) & (t < b)
    env = np.minimum(1, np.minimum((t[m] - a) / 0.005, (b - t[m]) / 0.005))
    x[m] += 0.5 * np.sin(2 * np.pi * hz * t[m]) * env
if atraso:
    x = np.concatenate([0.003 * rng.standard_normal(int(atraso * sr)), 0.6 * x])
wavfile.write(saida, sr, (np.clip(x, -1, 1) * 32767).astype(np.int16))
`

function grava(nome, rajadas, dur, { tamanho = '576x1024', atraso = 0 } = {}) {
  const wav = join(pasta, `${nome}.wav`)
  py(GERA_AUDIO, JSON.stringify(rajadas), String(dur), wav, String(atraso))
  if (atraso) return wav
  const mp4 = join(pasta, `${nome}.mp4`)
  ff('-f', 'lavfi', '-i', `testsrc2=s=${tamanho}:r=${FPS}:d=${dur}`, '-i', wav, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', mp4)
  return mp4
}

// a transcrição com os erros do Whisper: [inicio, fim, [[palavra, ini, fim], ...]]
function transcricao(nome, segs) {
  const arq = join(pasta, `${nome}-palavras.json`)
  writeFileSync(arq, JSON.stringify({
    arquivo: 'x', modelo: 't', dispositivo: 'cpu',
    segmentos: segs.map(([inicio, fim, ws]) => ({
      inicio, fim, texto: ws.map((w) => w[0]).join(' '),
      palavras: ws.map(([texto, a, b]) => ({ texto, inicio: a, fim: b }))
    }))
  }))
  return arq
}
function escolha(nome, frases, descartados = []) {
  const arq = join(pasta, `${nome}-tomadas.json`)
  writeFileSync(arq, JSON.stringify({ frases: frases.map((i) => ({ grupo: [i], escolhida: i })), descartados }))
  return arq
}
function corta(fonte, palavras, tomadas, saida, ...extra) {
  const r = spawnSync(PY, [MOTOR, fonte, palavras, tomadas, '--saida', join(pasta, saida), ...extra], { encoding: 'utf8', env: ENV })
  return { codigo: r.status, erro: r.stderr, cortes: r.status === 0 ? JSON.parse(readFileSync(join(pasta, saida, 'cortes.json'), 'utf8')) : null }
}

// a gravação principal: três tomadas escolhidas e um "ok" descartado
const RAJADAS = [
  [1.0, 1.4, 1000], [1.5, 2.5, 1000], [3.2, 3.7, 1000], [3.8, 4.8, 1000], // tomada 0: pausa de 0,7 s no meio
  [4.92, 5.2, 300], // o "ok" descartado, colado no fim da tomada 0
  [6.0, 6.4, 1000], [6.5, 7.0, 1000], // tomada 2: a transcrição marca 5,7 a 7,3
  [8.0, 8.9, 1000], [9.3, 10.0, 1000] // tomada 3: pausa de 0,4 s que geraria pedaço de 1 s
]
const SEGS = [
  [1.0, 4.8, [['a', 1.0, 1.4], ['b', 1.5, 2.5], ['c', 3.2, 3.7], ['d', 3.8, 4.8]]],
  [4.92, 5.2, [['ok', 4.92, 5.2]]],
  [5.7, 7.3, [['e', 5.7, 6.4], ['f', 6.5, 7.3]]],
  [8.0, 10.0, [['g', 8.0, 8.9], ['h', 9.3, 10.0]]]
]
let P // o corte principal

before(() => {
  const fonte = grava('principal', RAJADAS, 11.5)
  P = corta(fonte, transcricao('principal', SEGS), escolha('principal', [0, 2, 3], [1]), 'principal')
  assert.equal(P.codigo, 0, P.erro)
})

const perto = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} longe de ${b} (tolerância ${tol})`)
const palavra = (c, w) => c.palavras.find((p) => p.texto === w)

test('o começo é o som real, com 40 ms de folga, e não a marca da transcrição', () => {
  const clipe = P.cortes.clipes.find((c) => c.escolhida === 2)
  perto(clipe.de, 5.96, 0.015, 'o clipe da tomada 2 começa')
})

test('o fim é o som real, e não a marca atrasada da transcrição', () => {
  const clipe = P.cortes.clipes.find((c) => c.escolhida === 2)
  perto(clipe.ate, 7.0, 0.04, 'o clipe da tomada 2 acaba')
})

test('o silêncio longo dentro da tomada vira 120 ms; a pausa curta fica', () => {
  const c = P.cortes
  perto(palavra(c, 'c').inicio - palavra(c, 'b').fim, 0.12, 0.04, 'o silêncio de 0,7 s entre b e c')
  perto(palavra(c, 'b').inicio - palavra(c, 'a').fim, 0.1, 0.04, 'a pausa de 0,1 s entre a e b')
  assert.equal(c.clipes.filter((x) => x.escolhida === 0).length, 2, 'a tomada 0 vira dois pedaços')
})

test('a pausa de 0,4 s que deixaria pedaço de 1 s fica', () => {
  const c = P.cortes
  assert.equal(c.clipes.filter((x) => x.escolhida === 3).length, 1)
  perto(palavra(c, 'h').inicio - palavra(c, 'g').fim, 0.4, 0.04, 'a pausa de 0,4 s entre g e h')
  // a régua vale para o pedaço que nasce de cortar silêncio dentro da tomada; a frase inteira
  // curta (a tomada 2 tem 1,04 s) não é pedaço de corte
  const partidas = c.clipes.filter((x) => c.clipes.filter((y) => y.escolhida === x.escolhida).length > 1)
  assert.ok(partidas.length >= 2, 'o fixture tem tomada partida')
  assert.ok(partidas.every((x) => x.dur >= 1.5 - 1e-6), 'nenhum pedaço de tomada partida abaixo de 1,5 s')
})

test('o pedaço de 1,44 s não se corta: o mínimo é 1,5 s', () => {
  // a tomada 3 só mede o limite perto de 1 s; este fixa o 1,5 s
  const fonte = grava('limite', [[1.0, 1.4, 1000], [1.5, 2.34, 1000], [2.84, 3.4, 1000], [3.5, 4.6, 1000]], 5.5)
  const r = corta(fonte, transcricao('limite', [[1.0, 4.6, [['a', 1.0, 1.4], ['b', 1.5, 2.34], ['c', 2.84, 3.4], ['d', 3.5, 4.6]]]]), escolha('limite', [0]), 'limite')
  assert.equal(r.codigo, 0, r.erro)
  assert.equal(r.cortes.clipes.length, 1, 'a pausa de 0,5 s fica: cortá-la deixaria um pedaço de 1,44 s')
})

test('a pausa longa (acima de 0,6 s) se corta mesmo deixando pedaço curto: é ar morto', () => {
  // 0,72 s de silêncio no meio da frase deixariam um pedaço abaixo de 1,5 s; o enquadramento
  // não troca (o modelo segura), o corte fica seco
  const fonte = grava('longa', [[1.0, 1.4, 1000], [1.5, 2.1, 1000], [2.82, 3.4, 1000], [3.5, 4.6, 1000]], 5.5)
  const r = corta(fonte, transcricao('longa', [[1.0, 4.6, [['a', 1.0, 1.4], ['b', 1.5, 2.1], ['c', 2.82, 3.4], ['d', 3.5, 4.6]]]]), escolha('longa', [0]), 'longa')
  assert.equal(r.codigo, 0, r.erro)
  assert.equal(r.cortes.clipes.length, 2, 'a pausa de 0,72 s vira 120 ms')
  const p = r.cortes.palavras
  perto(p.find((w) => w.texto === 'c').inicio - p.find((w) => w.texto === 'b').fim, 0.12, 0.04, 'a pausa longa')
})

test('o silêncio de 0,28 s não se corta: só acima de 0,30 s', () => {
  const fonte = grava('pausa', [[1.0, 2.6, 1000], [2.88, 4.5, 1000]], 5.5)
  const r = corta(fonte, transcricao('pausa', [[1.0, 4.5, [['a', 1.0, 2.6], ['b', 2.88, 4.5]]]]), escolha('pausa', [0]), 'pausa')
  assert.equal(r.codigo, 0, r.erro)
  assert.equal(r.cortes.clipes.length, 1, 'a pausa de 0,28 s é respiração da fala')
})

test('tomadas vizinhas na gravação não se sobrepõem, e a segunda começa no som dela', () => {
  // a frase que começa 0,11 s antes do fim da anterior (acontece quando a pessoa emenda a frase): a busca do começo
  // pegaria a cauda da palavra de antes, que a transcrição marca cedo
  const fonte = grava('vizinhas', [[1.0, 2.4, 1000], [2.52, 4.0, 1000]], 5.0)
  const r = corta(fonte, transcricao('vizinhas', [[1.0, 2.45, [['x', 1.0, 2.45]]], [2.3, 4.0, [['y', 2.3, 4.0]]]]), escolha('vizinhas', [0, 1]), 'vizinhas')
  assert.equal(r.codigo, 0, r.erro)
  const [a, b] = r.cortes.clipes
  assert.ok(b.de >= a.ate - 1e-6, `a segunda começa em ${b.de}, antes do fim da primeira em ${a.ate}`)
  perto(a.ate, 2.4, 0.02, 'a primeira acaba no fim do som dela')
  perto(b.de, 2.48, 0.015, 'a segunda começa 40 ms antes do som dela')
})

test('a tomada colada sem silêncio na de antes não toca o mesmo trecho duas vezes', () => {
  // sem silêncio entre as falas, a busca do começo não tem onde parar: é a trava de
  // sobreposição que segura (com 0,12 s de silêncio, o caso de cima não chega nela)
  const fonte = grava('colada', [[1.0, 2.5, 1000], [2.5, 4.0, 1000]], 5.0)
  const r = corta(fonte, transcricao('colada', [[1.0, 2.5, [['x', 1.0, 2.5]]], [2.5, 4.0, [['y', 2.5, 4.0]]]]), escolha('colada', [0, 1]), 'colada')
  assert.equal(r.codigo, 0, r.erro)
  const [a, b] = r.cortes.clipes
  assert.ok(b.de >= a.ate - 1e-6, `a segunda começa em ${b.de}, antes do fim da primeira em ${a.ate}`)
})

const MEDE = `
import sys, json, numpy as np
from scipy.io import wavfile
sr, x = wavfile.read(sys.argv[1]); x = x.astype(float) / 32768
if x.ndim > 1: x = x.mean(axis=1)
pedido = json.loads(sys.argv[2])
n = int(0.01 * sr); w = len(x) // n
db = 20 * np.log10(np.maximum(np.sqrt((x[: w * n].reshape(w, n) ** 2).mean(axis=1)), 1e-9))
def corrida(t):
    i = int(t / 0.01); a = b = i
    while a > 0 and db[a - 1] < -35: a -= 1
    while b < w and db[b] < -35: b += 1
    return (b - a) * 0.01
f = np.abs(np.fft.rfft(x)); hz = np.fft.rfftfreq(len(x), 1 / sr)
banda = lambda c: f[(hz > c - 20) & (hz < c + 20)].sum()
print(json.dumps({'juncoes': [corrida(t) for t in pedido], 'r300': float(banda(300) / banda(1000)), 'dur': len(x) / sr}))
`

test('nas junções entre tomadas não há silêncio acima de 150 ms, e a cauda não traz o "ok" descartado', () => {
  const juncoes = P.cortes.clipes.slice(1).filter((c, i) => c.escolhida !== P.cortes.clipes[i].escolhida).map((c) => c.t)
  assert.equal(juncoes.length, 2)
  const m = JSON.parse(py(MEDE, join(pasta, 'principal', 'voz.wav'), JSON.stringify(juncoes)))
  for (const s of m.juncoes) assert.ok(s <= 0.15 + 0.011, `silêncio de ${s} s numa junção`)
  assert.ok(m.r300 < 0.02, `o "ok" em 300 Hz vazou para a voz (razão ${m.r300})`)
})

test('o respiro de 0,8 s congela o quadro do fim da última palavra (depois dele, quem grava olha para baixo e desliga)', () => {
  // os 0,3 s de imagem real terminam com a pessoa de olhos baixos:
  // o quadro que congela é o do fim da fala, ainda olhando a lente
  const c = P.cortes
  perto(c.respiro.real, 0, 0.001, 'respiro real')
  perto(c.respiro.congelado, 0.8, 0.001, 'respiro congelado')
  perto(c.END - c.END_voz, 0.8, 0.034, 'o END depois da voz')
  assert.deepEqual(c.avisos, [])
})

test('câmera e voz têm o mesmo END, em quadros inteiros', () => {
  const c = P.cortes
  assert.ok(Math.abs(c.END * FPS - Math.round(c.END * FPS)) < 1e-6, 'END em quadros inteiros')
  const v = sonda(join(pasta, 'principal', 'camera.mp4'), 'stream=nb_read_frames,width,height,codec_type')
  const video = v.streams.find((s) => s.codec_type === 'video')
  assert.equal(Number(video.nb_read_frames), Math.round(c.END * FPS))
  assert.equal(v.streams.filter((s) => s.codec_type === 'audio').length, 0, 'a câmera sai sem áudio')
  const m = JSON.parse(py(MEDE, join(pasta, 'principal', 'voz.wav'), '[]'))
  perto(m.dur, c.END, 0.002, 'a duração da voz')
})

test('a voz sai em −14 LUFS com pico até −1 dBTP', () => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-i', join(pasta, 'principal', 'voz.wav'), '-af', 'ebur128=peak=true:framelog=quiet', '-f', 'null', '-'], { encoding: 'utf8' })
  const I = Number(/I:\s+(-?[\d.]+) LUFS/.exec(r.stderr)[1])
  const pico = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(r.stderr)[1])
  perto(I, -14, 1.0, 'loudness integrada')
  assert.ok(pico <= -0.9, `pico em ${pico} dBTP`)
})

test('a fonte que acaba em cima da última palavra congela o último quadro e avisa', () => {
  const fonte = grava('curta', [[1.0, 1.5, 1000], [2.0, 2.97, 1000]], 3.0)
  const r = corta(fonte, transcricao('curta', [[1.0, 2.97, [['x', 1.0, 1.5], ['y', 2.0, 2.97]]]]), escolha('curta', [0]), 'curta')
  assert.equal(r.codigo, 0, r.erro)
  assert.ok(r.cortes.respiro.congelado > 0.7, `congelado ${r.cortes.respiro.congelado}`)
  assert.match(r.cortes.avisos.join(' '), /acaba em cima da última palavra/)
  const v = sonda(join(pasta, 'curta', 'camera.mp4'), 'stream=nb_read_frames')
  assert.equal(Number(v.streams[0].nb_read_frames), Math.round(r.cortes.END * FPS))
})

test('a fonte deitada sai recortada em 9:16; a girada pelo celular sai em pé inteira', () => {
  const plano = [[1.0, 1.6, 1000]]
  const segs = [[1.0, 1.6, [['x', 1.0, 1.6]]]]
  const deitada = corta(grava('deitada', plano, 3, { tamanho: '1024x576' }), transcricao('deitada', segs), escolha('deitada', [0]), 'deitada')
  assert.equal(deitada.codigo, 0, deitada.erro)
  const d = sonda(join(pasta, 'deitada', 'camera.mp4'), 'stream=width,height').streams[0]
  perto(d.width / d.height, 9 / 16, 0.01, 'a proporção da deitada')
  const girada = join(pasta, 'girada.mp4')
  ff('-display_rotation', '90', '-i', grava('pre-girada', plano, 3, { tamanho: '1024x576' }), '-c', 'copy', girada)
  const g = corta(girada, transcricao('girada', segs), escolha('girada', [0]), 'girada')
  assert.equal(g.codigo, 0, g.erro)
  const s = sonda(join(pasta, 'girada', 'camera.mp4'), 'stream=width,height').streams[0]
  assert.deepEqual([s.width, s.height], [576, 1024])
})

test('o microfone separado sincroniza por correlação e vira a voz', () => {
  const mic = grava('mic', RAJADAS, 11.5, { atraso: 0.37 })
  const r = corta(join(pasta, 'principal.mp4'), transcricao('mic', SEGS), escolha('mic', [0, 2, 3], [1]), 'mic', '--audio', mic)
  assert.equal(r.codigo, 0, r.erro)
  perto(r.cortes.sincronia.deslocamento, 0.37, 0.005, 'o deslocamento')
  perto(r.cortes.END, P.cortes.END, 0.001, 'o mesmo END do corte sem microfone')
})

test('o microfone que não bate com a câmera recusa em vez de sincronizar errado', () => {
  const ruido = grava('ruido', [], 11.5, { atraso: 0.01 })
  const r = corta(join(pasta, 'principal.mp4'), transcricao('ruido', SEGS), escolha('ruido', [0, 2, 3], [1]), 'ruido', '--audio', ruido)
  assert.equal(r.codigo, 1)
  assert.match(r.erro, /correlação fraca/)
})

test('a medida de loudness que não sai, ou sai infinita, recusa em vez de seguir para a conta', () => {
  const semAudio = join(pasta, 'sem-audio.mp4')
  ff('-f', 'lavfi', '-i', 'color=c=black:s=64x64:d=0.5', '-an', '-c:v', 'libx264', semAudio)
  const silencio = join(pasta, 'silencio.wav')
  ff('-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', '1', silencio) // o ebur128 dá pico −inf
  const saida = py(`
import sys
sys.path.insert(0, sys.argv[1])
import fala
for arq in sys.argv[2:]:
    try:
        print('passou', fala.medir(arq))
    except fala.Recusa as e:
        print('recusa', str(e).splitlines()[0])
    except Exception as e:
        print('erro cru', type(e).__name__)
`, AQUI, semAudio, silencio).trim().split(/\r?\n/)
  assert.equal(saida.length, 2, saida.join('\n'))
  for (const linha of saida) assert.match(linha, /^recusa .*não mediu/, linha)
})

test('a escolha que não confere recusa antes de cortar, e a gravação sem fala também', () => {
  const fonte = join(pasta, 'principal.mp4')
  const ruim = corta(fonte, transcricao('ruim', SEGS), escolha('ruim', [0, 2, 3]), 'ruim')
  assert.equal(ruim.codigo, 1)
  assert.match(ruim.erro, /segmento 1/)
  const muda = corta(fonte, transcricao('muda', []), escolha('muda', []), 'muda')
  assert.equal(muda.codigo, 1)
  assert.match(muda.erro, /sem fala/)
})
