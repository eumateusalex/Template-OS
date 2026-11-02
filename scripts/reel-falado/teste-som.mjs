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
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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

// a trilha que cai na frase de impacto: corta seco
// no começo do trecho e volta no fim dele no mesmo ponto da faixa e no mesmo nível, como se a
// trilha seguisse tocando por baixo
const TRECHO = "import sys, json, numpy as np\nfrom scipy.io import wavfile\n_, a = wavfile.read(sys.argv[1]); _, b = wavfile.read(sys.argv[2])\na = a.astype(float) / 32768; b = b.astype(float) / 32768\nsr = 48000\nfaixa = lambda x, de, ate: x[int(de * sr):int(ate * sr)]\nprint(json.dumps({'dentro': float(np.abs(faixa(a, 2.02, 3.48)).max()), 'antes': float(np.abs(faixa(a, 0.5, 1.98) - faixa(b, 0.5, 1.98)).max()), 'depois': float(np.abs(faixa(a, 3.52, 4.6) - faixa(b, 3.52, 4.6)).max()), 'ref': float(np.abs(faixa(b, 2.02, 3.48)).max())}))"

test('a trilha cai no trecho pedido e volta no mesmo ponto da faixa e no mesmo nível', () => {
  const r = mixa({ som: { ...SOM, musica: { ...SOM.musica, cai: [{ de: 2.0, ate: 3.5 }] } } })
  assert.equal(r.codigo, 0, r.erro)
  const m = JSON.parse(py(TRECHO, join(r.pasta, 'stems', 'music.wav'), join(C.pasta, 'stems', 'music.wav')))
  assert.ok(m.ref > 0.01, `a trilha de referência toca no trecho (${m.ref})`)
  assert.ok(m.dentro < 1e-4, `a trilha não caiu no trecho: ${m.dentro}`)
  assert.ok(m.antes < 1e-4, `antes do trecho a trilha mudou: ${m.antes}`)
  assert.ok(m.depois < 1e-4, `depois do trecho a trilha não voltou no mesmo ponto e nível: ${m.depois}`)
})

test('o trecho sem trilha ao contrário ou depois do END recusa', () => {
  for (const cai of [[{ de: 3.5, ate: 2.0 }], [{ de: 5.0, ate: 6.5 }]]) {
    const r = mixa({ som: { ...SOM, musica: { ...SOM.musica, cai } } })
    assert.equal(r.codigo, 1, JSON.stringify(cai))
    assert.match(r.erro, /trecho sem trilha/)
  }
})

// o reverb: a voz segue seca fora do trecho pedido, e a sala corre depois dele, no silêncio
const SALA = `
import sys, json, numpy as np
from scipy.io import wavfile
def ler(a):
    sr, x = wavfile.read(a); x = x.astype(float) / 32768
    return x if x.ndim == 1 else x.mean(axis=1)
com, sem = ler(sys.argv[1]), ler(sys.argv[2])
sr = 48000
f = lambda a, b: slice(int(a * sr), int(b * sr))
rms = lambda x: float(np.sqrt((x ** 2).mean()))
de, ate, fim = float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])
print(json.dumps({'antes': float(np.abs(com[f(0, de)] - sem[f(0, de)]).max()),
                  'cauda': rms(com[f(ate + 0.02, fim)]), 'cauda_seca': rms(sem[f(ate + 0.02, fim)]),
                  'cauda_tarde': rms(com[f(fim - 0.1, fim)]), 'cauda_cedo': rms(com[f(ate + 0.02, ate + 0.12)])}))
`

test('o reverb_voz soma a sala só no trecho pedido, e a cauda corre no silêncio depois dele', () => {
  const r = mixa({ som: { ...SOM, reverb_voz: [{ de: 2.8, ate: 3.6, mix: 0.4, cauda: 1.0 }] } })
  assert.equal(r.codigo, 0, r.erro)
  const m = JSON.parse(py(SALA, join(r.pasta, 'stems', 'voice.wav'), join(C.pasta, 'stems', 'voice.wav'), '2.8', '3.6', '3.98'))
  assert.ok(m.antes < 1e-4, `antes do trecho a voz mudou: ${m.antes}`)
  assert.ok(m.cauda > 20 * Math.max(m.cauda_seca, 1e-5), `a cauda (${m.cauda}) não aparece contra a voz seca (${m.cauda_seca})`)
  assert.ok(m.cauda_tarde < m.cauda_cedo, `a cauda não cai: ${m.cauda_cedo} → ${m.cauda_tarde}`)
  const rel = JSON.parse(readFileSync(join(r.pasta, 'relatorio-audio.json'), 'utf8'))
  assert.equal(rel.reverb_voz.length, 1)
  assert.ok(rel.medidas.master.pico_dbtp <= -1.0, `o master passou de −1 dBTP: ${rel.medidas.master.pico_dbtp}`)
})

test('o reverb do efeito deixa a cauda depois dele; sem o pedido, o efeito sai seco', () => {
  const r = mixa({ som: { ...SOM, efeitos: [{ ...SOM.efeitos[0], reverb: { mix: 0.5, cauda: 1.2 } }] } })
  assert.equal(r.codigo, 0, r.erro)
  const m = JSON.parse(py(SALA, join(r.pasta, 'stems', 'sfx.wav'), join(C.pasta, 'stems', 'sfx.wav'), '2.85', '3.3', '4.2'))
  assert.ok(m.antes < 1e-4, `antes do efeito o som mudou: ${m.antes}`)
  assert.ok(m.cauda > 20 * Math.max(m.cauda_seca, 1e-5), `o efeito não ganhou cauda: ${m.cauda} contra ${m.cauda_seca}`)
})

test('o reverb fora da medida ou fora do vídeo recusa', () => {
  const casos = [
    { reverb_voz: [{ de: 2.8, ate: 3.6, mix: 1.5, cauda: 1.0 }] },
    { reverb_voz: [{ de: 2.8, ate: 3.6, mix: 0.3, cauda: 9 }] },
    { reverb_voz: [{ de: 3.6, ate: 2.8, mix: 0.3, cauda: 1 }] },
    { reverb_voz: [{ de: 4.0, ate: 9.0, mix: 0.3, cauda: 1 }] },
    { efeitos: [{ ...SOM.efeitos[0], reverb: { mix: 0 } }] }
  ]
  for (const extra of casos) {
    const r = mixa({ som: { ...SOM, ...extra } })
    assert.equal(r.codigo, 1, JSON.stringify(extra))
    assert.match(r.erro, /reverb/)
  }
})

// a rampa da volta da trilha: a volta sobe em `rampa` s em vez dos 5 ms, e depois dela a trilha é a mesma
const RAMPA = "import sys, json, numpy as np\nfrom scipy.io import wavfile\n_, a = wavfile.read(sys.argv[1]); _, b = wavfile.read(sys.argv[2])\na = a.astype(float) / 32768; b = b.astype(float) / 32768\nsr = 48000\nrms = lambda x, de, ate: float(np.sqrt((x[int(de * sr):int(ate * sr)] ** 2).mean()))\nprint(json.dumps({'cedo': rms(a, 3.5, 3.53) / rms(b, 3.5, 3.53), 'meio': rms(a, 3.53, 3.58) / rms(b, 3.53, 3.58), 'depois': float(np.abs(a[int(3.62 * sr):int(4.6 * sr)] - b[int(3.62 * sr):int(4.6 * sr)]).max())}))"

test('a rampa da volta da trilha sobe devagar e depois devolve a trilha igual', () => {
  const r = mixa({ som: { ...SOM, musica: { ...SOM.musica, cai: [{ de: 2.0, ate: 3.5, rampa: 0.1 }] } } })
  assert.equal(r.codigo, 0, r.erro)
  const m = JSON.parse(py(RAMPA, join(r.pasta, 'stems', 'music.wav'), join(C.pasta, 'stems', 'music.wav')))
  assert.ok(m.cedo < 0.35, `os primeiros 30 ms da volta não sobem devagar: ${m.cedo}`)
  assert.ok(m.meio > m.cedo && m.meio < 0.9, `a volta não está no meio da rampa: ${m.meio}`)
  assert.ok(m.depois < 1e-4, `depois da rampa a trilha mudou: ${m.depois}`)
})

test('a rampa da volta fora de 5 ms a 1 s recusa', () => {
  for (const rampa of [0, 1.5, 'x']) {
    const r = mixa({ som: { ...SOM, musica: { ...SOM.musica, cai: [{ de: 2.0, ate: 3.5, rampa }] } } })
    assert.equal(r.codigo, 1, String(rampa))
    assert.match(r.erro, /rampa/)
  }
})
