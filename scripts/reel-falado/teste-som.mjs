// O som do Reel falado: voz, efeitos, riser e música em
// quatro faixas separadas e medidas, e o master na régua.
//
// A régua: o efeito se posiciona pelo
// PICO, N dB abaixo do pico da voz; a trilha num nível só, em −24 LUFS, com a
// primeira batida no quadro 1, 5 ms de entrada e 800 ms de saída; o riser acaba
// na junção do gancho; o master em −14 LUFS com pico até −1 dBTP.
//
// Tudo sintético, com resposta conhecida: a "voz" são rajadas de 220 Hz já em
// −14 LUFS, a trilha tem um clique a cada 0,5 s a partir de 0,25 s, e o efeito
// tem o pico em 0,1 s.
//
//   node --test scripts/reel-falado/teste-som.mjs

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'

const AQUI = resolve(fileURLToPath(new URL('.', import.meta.url)))
const MOTOR = join(AQUI, 'som.py')
const raiz = mkdtempSync(join(tmpdir(), 'teste-som-'))
after(() => rmSync(raiz, { recursive: true, force: true }))
const ENV = { ...process.env, PYTHONIOENCODING: 'utf-8' }
const PY = process.env.PYTHON || 'python' // o Python 3.12 com numpy e scipy; a variável PYTHON aponta outro
const SR = 48000
const END = 6.0

function py(codigo, ...args) {
  const r = spawnSync(PY, ['-c', codigo, ...args], { encoding: 'utf8', env: ENV })
  assert.equal(r.status, 0, r.stderr)
  return r.stdout
}

const GERA = `
import sys, numpy as np
from scipy.io import wavfile
sr = 48000
base = sys.argv[1]
t = np.arange(int(5.0 * sr)) / sr
voz = np.zeros_like(t)
for a in (0.3, 1.5, 2.8, 4.0):
    m = (t >= a) & (t < a + 0.8)
    voz[m] = 0.4 * np.sin(2 * np.pi * 220 * t[m])
wavfile.write(base + '/voz-crua.wav', sr, (voz * 32767).astype(np.int16))
tm = np.arange(int(20 * sr)) / sr
mus = 0.3 * np.sin(2 * np.pi * 80 * tm)  # grave alto: sem a entrada de 5 ms, o primeiro instante estala
for k in range(40):
    c = 0.25 + 0.5 * k
    m = (tm >= c) & (tm < c + 0.01)
    mus[m] += 0.6 * np.sin(2 * np.pi * 1000 * (tm[m] - c)) * np.exp(-200 * (tm[m] - c))
st = np.stack([mus, mus], axis=1)
wavfile.write(base + '/musica.wav', sr, (st * 32767).astype(np.int16))
te = np.arange(int(0.4 * sr)) / sr
fx = np.sin(2 * np.pi * 900 * te) * np.exp(-60 * np.abs(te - 0.1))
wavfile.write(base + '/pop.wav', sr, (fx * 0.9 * 32767).astype(np.int16))
`

const MEDE = `
import sys, json, numpy as np
from scipy.io import wavfile
def ler(a):
    sr, x = wavfile.read(a); x = x.astype(float) / 32768
    return x if x.ndim == 1 else x.mean(axis=1), len(x) / sr
voz, dv = ler(sys.argv[1] + '/stems/voice.wav')
fx, df = ler(sys.argv[1] + '/stems/sfx.wav')
ri, dr = ler(sys.argv[1] + '/stems/riser.wav')
mu, dm = ler(sys.argv[1] + '/stems/music.wav')
db = lambda v: 20 * np.log10(max(v, 1e-9))
i = int(np.argmax(np.abs(fx)))
sr = 48000
audivel = np.nonzero(np.abs(ri) > 1e-3)[0]
cliques = np.nonzero(np.abs(mu) > 0.5 * np.abs(mu).max())[0] if np.abs(mu).max() > 0 else [0]
print(json.dumps({
  'duracoes': [dv, df, dr, dm],
  'pico_voz_db': db(np.abs(voz).max()), 'pico_fx_db': db(np.abs(fx).max()), 'pico_fx_s': i / sr,
  'pico_riser_db': db(np.abs(ri).max()), 'fim_riser_s': (audivel[-1] / sr) if len(audivel) else -1,
  'musica_max': float(np.abs(mu).max()), 'primeira_batida_s': float(cliques[0] / sr),
  'musica_inicio': float(np.abs(mu[:24]).max()), 'musica_meio': float(np.abs(mu[480:960]).max()),
  'musica_fim': float(np.abs(mu[-int(0.02 * sr):]).max())
}))
`

function ebur(arq) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-i', arq, '-af', 'ebur128=peak=true:framelog=quiet', '-f', 'null', '-'], { encoding: 'utf8' })
  return { I: Number(/I:\s+(-?[\d.]+) LUFS/.exec(r.stderr)[1]), pico: Number(/Peak:\s+(-?[\d.inf]+) dBFS/.exec(r.stderr)[1]) }
}

let fonte
before(() => {
  fonte = join(raiz, 'fonte')
  mkdirSync(fonte)
  py(GERA, fonte)
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', join(fonte, 'voz-crua.wav'), '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11,apad', '-t', String(END), '-ar', String(SR), '-ac', '1', join(fonte, 'voz.wav')], { encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
})

let n = 0
function mixa({ som, flags = [] }) {
  const pasta = join(raiz, `p${++n}`)
  mkdirSync(pasta)
  for (const a of ['voz.wav', 'musica.wav', 'pop.wav']) copyFileSync(join(fonte, a), join(pasta, a))
  writeFileSync(join(pasta, 'cortes.json'), JSON.stringify({ fps: 30, END, END_voz: 5.0, frases: [{ frase: 1, t_de: 0, t_ate: 2.0 }] }))
  writeFileSync(join(pasta, 'som.json'), JSON.stringify(som))
  const r = spawnSync(PY, [MOTOR, pasta, ...flags], { encoding: 'utf8', env: ENV })
  return { codigo: r.status, erro: r.stderr, pasta, m: r.status === 0 ? JSON.parse(py(MEDE, pasta)) : null }
}

const SOM = {
  musica: { arquivo: 'musica.wav', batida: 0.25 },
  efeitos: [{ arquivo: 'pop.wav', acerto: 3.0, db: -10 }],
  riser: { fim: 2.0, dur: 1.5, db: -14 }
}
let C
before(() => {
  C = mixa({ som: SOM })
  assert.equal(C.codigo, 0, C.erro)
})

test('as quatro faixas saem com a duração exata do END', () => {
  for (const d of C.m.duracoes) assert.ok(Math.abs(d - END) < 1 / SR + 1e-9, `faixa com ${d} s`)
})

test('o pico do efeito cai no instante pedido, 10 dB abaixo do pico da voz', () => {
  assert.ok(Math.abs(C.m.pico_fx_s - 3.0) <= 0.002, `pico em ${C.m.pico_fx_s} s`)
  assert.ok(Math.abs(C.m.pico_fx_db - (C.m.pico_voz_db - 10)) <= 0.5, `${C.m.pico_fx_db} contra ${C.m.pico_voz_db - 10}`)
})

test('o riser acaba na junção pedida, 14 dB abaixo do pico da voz', () => {
  assert.ok(Math.abs(C.m.fim_riser_s - 2.0) <= 0.025, `o riser acaba em ${C.m.fim_riser_s} s`)
  assert.ok(Math.abs(C.m.pico_riser_db - (C.m.pico_voz_db - 14)) <= 0.5, `${C.m.pico_riser_db}`)
})

test('a trilha fica em −24 LUFS, com a primeira batida no quadro 1, 5 ms de entrada e 800 ms de saída', () => {
  const { I } = ebur(join(C.pasta, 'stems', 'music.wav'))
  assert.ok(Math.abs(I - -24) <= 0.5, `trilha em ${I} LUFS`)
  assert.ok(Math.abs(C.m.primeira_batida_s - 1 / 30) <= 0.005, `primeira batida em ${C.m.primeira_batida_s} s`)
  assert.ok(C.m.musica_inicio < 0.15 * C.m.musica_meio, 'sem entrada gradual de 5 ms, o primeiro instante estala')
  assert.ok(C.m.musica_fim < 0.05 * C.m.musica_max, 'a saída de 800 ms não chegou a zero no fim')
})

test('o master mede −14 LUFS (±1) com pico até −1 dBTP, e as medidas vão para o relatório', () => {
  const { I, pico } = ebur(join(C.pasta, 'master.wav'))
  assert.ok(Math.abs(I - -14) <= 1, `master em ${I} LUFS`)
  assert.ok(pico <= -0.9, `pico em ${pico}`)
  const rel = JSON.parse(py("import sys;print(open(sys.argv[1],encoding='utf-8').read())", join(C.pasta, 'relatorio-audio.json')))
  assert.deepEqual(Object.keys(rel.medidas).sort(), ['master', 'music', 'riser', 'sfx', 'voice'])
  assert.equal(rel.efeitos[0].acerto_s, 3.0)
})

test('sem música, a faixa da trilha sai em silêncio e o master é voz e efeitos', () => {
  const r = mixa({ som: SOM, flags: ['--sem-musica'] })
  assert.equal(r.codigo, 0, r.erro)
  assert.equal(r.m.musica_max, 0)
  const { I } = ebur(join(r.pasta, 'master.wav'))
  assert.ok(Math.abs(I - -14) <= 1, `master sem música em ${I}`)
})

test('efeito depois do END recusa', () => {
  const r = mixa({ som: { ...SOM, efeitos: [{ arquivo: 'pop.wav', acerto: 6.5, db: -10 }] } })
  assert.equal(r.codigo, 1)
  assert.match(r.erro, /depois do END/)
})

test('o riser sem fim acaba no fim da primeira frase do cortes.json (o dono do tempo)', () => {
  const r = mixa({ som: { ...SOM, riser: { dur: 1.5, db: -14 } } })
  assert.equal(r.codigo, 0, r.erro)
  assert.ok(Math.abs(r.m.fim_riser_s - 2.0) <= 0.025, `o riser acaba em ${r.m.fim_riser_s} s`)
})

test('a medida que não sai reprova, nunca passa', () => {
  const muda = join(raiz, 'trilha-muda.wav')
  py("import sys, numpy as np\nfrom scipy.io import wavfile\nwavfile.write(sys.argv[1], 48000, np.zeros((48000 * 20, 2), dtype=np.int16))", muda)
  const pasta = join(raiz, 'muda')
  mkdirSync(pasta)
  for (const a of ['voz.wav', 'pop.wav']) copyFileSync(join(fonte, a), join(pasta, a))
  copyFileSync(muda, join(pasta, 'musica.wav'))
  writeFileSync(join(pasta, 'cortes.json'), JSON.stringify({ fps: 30, END, END_voz: 5.0, frases: [{ frase: 1, t_de: 0, t_ate: 2.0 }] }))
  writeFileSync(join(pasta, 'som.json'), JSON.stringify(SOM))
  const r = spawnSync(PY, [MOTOR, pasta], { encoding: 'utf8', env: ENV })
  assert.equal(r.status, 1)
  assert.match(r.stderr, /não mediu/)
})

test('com trilha, sai também o master sem trilha, para a versão de fala pura sem outro render', () => {
  const sem = ebur(join(C.pasta, 'master-sem-trilha.wav'))
  const r = mixa({ som: SOM, flags: ['--sem-musica'] })
  const ref = ebur(join(r.pasta, 'master.wav'))
  assert.ok(Math.abs(sem.I - ref.I) <= 0.3, `o master sem trilha em ${sem.I}, o de --sem-musica em ${ref.I}`)
  // a loudness não pega a trilha a −24 vazando: a amostra pega
  const DIFERE = "import sys, numpy as np\nfrom scipy.io import wavfile\n_, a = wavfile.read(sys.argv[1]); _, b = wavfile.read(sys.argv[2])\nprint(float(np.abs(a.astype(float) - b.astype(float)).max() / 32768))"
  const dif = Number(py(DIFERE, join(C.pasta, 'master-sem-trilha.wav'), join(r.pasta, 'master.wav')))
  assert.ok(dif < 1e-3, `o master sem trilha difere do de --sem-musica em ${dif}: a trilha vazou`)
})
