// A transcrição local: roda com o PyAV bloqueado, usa a placa de vídeo quando
// ela existe, cai para a CPU quando não existe ou falha no meio, e diz em uma
// frase o que falta na máquina.
//
// Por quê: o Smart App Control do Windows pode bloquear a DLL do PyAV, que o
// faster-whisper importa na entrada, e aí a transcrição para até no processador.
// O motor `scripts/lib/motor_whisper.py` lê o áudio pelo ffmpeg e deixa o PyAV
// de fora.
//
// Roda sem internet, sem modelo baixado e sem placa: o faster-whisper, o
// ctranslate2 e o av são dublês no PYTHONPATH (o av falha no import, como a DLL
// bloqueada; o ctranslate2 diz quantas placas há; o faster-whisper devolve um
// texto fixo e registra onde rodou). Precisa do Python 3.12 com o numpy (vem
// com o requirements.txt) e do ffmpeg no PATH. O Python é o `python` do PATH,
// ou o da variável PYTHON.
//
// O que os dublês não medem: o modelo de verdade transcrevendo fala, e a placa
// de verdade. Isso se confere à mão, uma vez, com o modelo tiny:
//   python scripts/transcrever.py <um áudio com fala> --modelo tiny --saida rascunho/t.md
//
//   node --test scripts/teste-transcrever.mjs

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join, resolve } from 'node:path'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)))
const PY = process.env.PYTHON || 'python'
const pasta = mkdtempSync(join(tmpdir(), 'teste-transcrever-'))
after(() => rmSync(pasta, { recursive: true, force: true }))
const AUDIO = join(pasta, 'tom.wav')

// os dublês, cada um numa pasta, para o teste escolher quais entram
const dubles = join(pasta, 'dubles')
const instalado = join(pasta, 'sem-faster-whisper')
const escreve = (base, arquivo, texto) => {
  mkdirSync(join(base, arquivo, '..'), { recursive: true })
  writeFileSync(join(base, arquivo), texto)
}

before(() => {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=2', '-ar', '16000', '-ac', '1', AUDIO])
  assert.equal(r.status, 0, 'o ffmpeg não gerou o áudio do teste: ele está no PATH?')
  // o av que falha no import, como a DLL bloqueada pelo Windows
  escreve(dubles, 'av/__init__.py', 'raise ImportError("DLL load failed while importing stream: Uma política de Controle de Aplicativo bloqueou este arquivo.")\n')
  escreve(dubles, 'ctranslate2/__init__.py', 'import os\ndef get_cuda_device_count():\n    return int(os.environ.get("DUBLE_PLACAS", "0"))\n')
  // o faster-whisper importa o av na entrada, como o de verdade
  escreve(dubles, 'faster_whisper/__init__.py', `import os
import av  # noqa: F401  (o de verdade faz isso; o motor tem que ter tirado o av do caminho)
class _Palavra:
    def __init__(s, texto, inicio, fim): s.word, s.start, s.end = texto, inicio, fim
class _Seg:
    def __init__(s, palavras):
        s.start, s.end = 0.0, 1.5
        s.text = " o orçamento chegou hoje"
        s.words = palavras
class _Info:
    language, language_probability, duration = "pt", 0.99, 2.0
class WhisperModel:
    def __init__(s, modelo, device="cpu", compute_type="int8", cpu_threads=1):
        s.device = device
    def transcribe(s, audio, language=None, word_timestamps=False, **opcoes):
        assert len(audio) > 16000, "o audio nao chegou como array"
        def gerar():
            if s.device == "cuda" and os.environ.get("DUBLE_FALHA") == "1":
                raise RuntimeError("Library cublas64_12.dll is not found or cannot be loaded")
            palavras = [_Palavra(" o", 0.0, 0.2), _Palavra(" orçamento", 0.2, 0.8), _Palavra(" chegou", 0.8, 1.1), _Palavra(" hoje", 1.1, 1.5)] if word_timestamps else []
            yield _Seg(palavras)
        return gerar(), _Info()
`)
  // o faster-whisper que não está instalado
  escreve(instalado, 'faster_whisper/__init__.py', 'raise ModuleNotFoundError("No module named \'faster_whisper\'")\n')
})

const ambiente = (extra = {}, pastas = [dubles]) => ({
  ...process.env,
  PYTHONPATH: [...pastas, process.env.PYTHONPATH].filter(Boolean).join(delimiter),
  PYTHONIOENCODING: 'utf-8',
  ...extra,
})
const transcrever = (args, env) =>
  spawnSync(PY, ['scripts/transcrever.py', AUDIO, ...args], { cwd: RAIZ, env, encoding: 'utf-8', timeout: 120_000 })

test('o Python tem o numpy (sem ele o motor não carrega)', () => {
  const r = spawnSync(PY, ['-c', 'import numpy'], { encoding: 'utf-8' })
  assert.equal(r.status, 0, `sem numpy no ${PY}: rode python -m pip install -r scripts/requirements.txt\n${r.stderr}`)
})

test('sem placa de vídeo, com o PyAV bloqueado, transcreve na CPU e grava as palavras', () => {
  const md = join(pasta, 'cpu.md')
  const js = join(pasta, 'cpu.json')
  const r = transcrever(['--saida', md, '--json', js, '--modelo', 'tiny'], ambiente({ DUBLE_PLACAS: '0' }))
  assert.equal(r.status, 0, `saiu ${r.status}:\n${r.stderr}`)
  const texto = readFileSync(md, 'utf-8')
  assert.match(texto, /em `cpu` \(int8\)/)
  assert.match(texto, /o orçamento chegou hoje/)
  assert.doesNotMatch(texto, /caiu pra CPU/)
  const d = JSON.parse(readFileSync(js, 'utf-8'))
  assert.equal(d.dispositivo, 'cpu')
  const palavras = d.segmentos.flatMap((s) => s.palavras)
  assert.deepEqual(palavras.map((p) => p.texto), ['o', 'orçamento', 'chegou', 'hoje'])
  for (const p of palavras) assert.ok(p.fim >= p.inicio, JSON.stringify(p))
})

test('com placa de vídeo, roda nela em float16 e não cai', () => {
  const md = join(pasta, 'placa.md')
  const r = transcrever(['--saida', md, '--modelo', 'tiny'], ambiente({ DUBLE_PLACAS: '1' }))
  assert.equal(r.status, 0, r.stderr)
  const texto = readFileSync(md, 'utf-8')
  assert.match(texto, /em `cuda` \(float16\)/)
  assert.doesNotMatch(texto, /caiu pra CPU/)
})

test('--dispositivo cpu com placa presente: fica na CPU e não consulta a placa', () => {
  // a flag existe para quando a placa está lá mas quebrada (DLL faltando): pedir CPU não pode tentar a placa
  const md = join(pasta, 'forca-cpu.md')
  const r = transcrever(['--saida', md, '--modelo', 'tiny', '--dispositivo', 'cpu'], ambiente({ DUBLE_PLACAS: '1' }))
  assert.equal(r.status, 0, r.stderr)
  assert.match(readFileSync(md, 'utf-8'), /em `cpu` \(int8\)/)
  assert.doesNotMatch(r.stderr, /Placa/)
})

test('placa pedida sem placa na máquina: avisa e segue na CPU', () => {
  const md = join(pasta, 'pedida.md')
  const r = transcrever(['--saida', md, '--modelo', 'tiny', '--dispositivo', 'cuda'], ambiente({ DUBLE_PLACAS: '0' }))
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stderr, /Placa pedida mas indisponivel: seguindo na CPU/)
  assert.match(readFileSync(md, 'utf-8'), /em `cpu`/)
})

test('se a placa falha no meio, a transcrição termina na CPU e diz que caiu', () => {
  const md = join(pasta, 'queda.md')
  const r = transcrever(['--saida', md, '--modelo', 'tiny'], ambiente({ DUBLE_PLACAS: '1', DUBLE_FALHA: '1' }))
  assert.equal(r.status, 0, r.stderr)
  const texto = readFileSync(md, 'utf-8')
  assert.match(texto, /em `cpu` \(int8\) \(a placa falhou e caiu pra CPU: .*cublas/)
  assert.match(texto, /o orçamento chegou hoje/)
  assert.match(r.stderr, /A placa falhou/)
})

test('sem o faster-whisper instalado, diz em uma frase o que rodar', () => {
  const md = join(pasta, 'sem-fw.md')
  const r = transcrever(['--saida', md, '--modelo', 'tiny'], ambiente({ DUBLE_PLACAS: '0' }, [instalado, dubles]))
  assert.equal(r.status, 1, r.stdout + r.stderr)
  assert.match(r.stderr, /faster-whisper nao esta instalado.*pip install -r scripts\/requirements\.txt/)
  assert.doesNotMatch(r.stderr, /Traceback/)
  assert.equal(existsSync(md), false)
})

test('sem o ffmpeg no PATH, diz em uma frase como instalar', () => {
  const exe = spawnSync(PY, ['-c', 'import sys; print(sys.executable)'], { encoding: 'utf-8' }).stdout.trim()
  const semFfmpeg = (process.env.PATH ?? process.env.Path ?? '').split(delimiter)
    .filter((d) => d && !existsSync(join(d, 'ffmpeg.exe')) && !existsSync(join(d, 'ffmpeg')))
    .join(delimiter)
  const env = ambiente({ DUBLE_PLACAS: '0' })
  delete env.Path
  env.PATH = semFfmpeg
  const r = spawnSync(exe, ['scripts/transcrever.py', AUDIO, '--saida', join(pasta, 'sem-ffmpeg.md'), '--modelo', 'tiny'], { cwd: RAIZ, env, encoding: 'utf-8', timeout: 120_000 })
  assert.equal(r.status, 1, r.stdout + r.stderr)
  assert.match(r.stderr, /o ffmpeg nao esta no PATH/)
  assert.doesNotMatch(r.stderr, /Traceback/)
})
