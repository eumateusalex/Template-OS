// A cor e o som do Reel falado medidos: o `medir_ritmo.py --tomadas <cortes.json>` dá a
// luminância e a saturação de cada tomada e o salto entre vizinhas, contra a tolerância da linguagem;
// o `simula_mix.py --contexto` na pasta do falado mede cada efeito do som.json contra a trilha.
//
//   node --test .claude/skills/video/ferramentas/teste-tomadas-cor.test.mjs
//
// Pede o Python do sistema com numpy, o da mixagem (MIXAGEM_PY) e o ffmpeg do PATH.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const MEDIR = join(AQUI, 'medir_ritmo.py');
const SIMULA = join(AQUI, 'simula_mix.py');
const PY = process.env.VIDEO_PY || 'python';
const PY_MIX = process.env.MIXAGEM_PY || 'python';
const tmp = mkdtempSync(join(tmpdir(), 'tomadas-cor-'));
const ff = (args) => execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-y', ...args]);

// ─── a cor por tomada ───────────────────────────────────────────────────────
// 0 a 2 s e 2 a 4 s: o mesmo cinza médio (duas tomadas que casam); 4 a 6 s: vermelho vivo (a que salta)
const video = join(tmp, 'gravacao.mp4');
const cortes = join(tmp, 'cortes.json');
const linguagens = join(tmp, 'linguagens.json');
before(() => {
  const v = (cor, d) => ['-f', 'lavfi', '-t', String(d), '-i', `color=c=${cor}:s=270x480:r=30,format=yuv420p`];
  ff([...v('0x808080', 2), ...v('0x808080', 2), ...v('0xE01010', 2),
    '-filter_complex', '[0:v][1:v][2:v]concat=n=3:v=1:a=0[v]', '-map', '[v]', '-c:v', 'libx264', '-preset', 'ultrafast', video]);
  // a tomada 1 vem em dois pedaços seguidos (o mesmo take, duas frases): é uma tomada só
  writeFileSync(cortes, JSON.stringify({ fps: 30, END: 6, clipes: [
    { frase: 1, escolhida: 1, t: 0, dur: 1 }, { frase: 2, escolhida: 1, t: 1, dur: 1 },
    { frase: 3, escolhida: 4, t: 2, dur: 2 }, { frase: 4, escolhida: 9, t: 4, dur: 2 }] }));
  writeFileSync(linguagens, JSON.stringify({ versao: 1, linguagens: {
    rosto: { tempo: 'voz', dispensa: [], faixas: {}, referencias: ['ref-x'], provisoria: true, cor_entre_tomadas: { lum: 0.1, sat: 0.1 } },
    solta: { tempo: 'voz', dispensa: [], faixas: {}, referencias: [] },
    'so-saturacao': { tempo: 'voz', dispensa: [], faixas: {}, referencias: ['ref-y'], cor_entre_tomadas: { lum: 0.9, sat: 0.1 } } } }));
});
function mede(...args) {
  const r = spawnSync(PY, ['-I', MEDIR, video, ...args, '--json-saida'], { encoding: 'utf8' });
  let dados = null;
  try { dados = JSON.parse(r.stdout); } catch { /* a saída diz */ }
  return { status: r.status, dados, saida: r.stdout + r.stderr };
}

test('cada tomada sai com a luminância e a saturação, e as peças do mesmo take se juntam', () => {
  const { status, dados, saida } = mede('--tomadas', cortes);
  assert.equal(status, 0, saida);
  const t = dados.tomadas;
  assert.equal(t.length, 3, JSON.stringify(t));
  assert.deepEqual(t.map((x) => [x.de, x.ate]), [[0, 2], [2, 4], [4, 6]]);
  assert.ok(Math.abs(t[0].lum - 0.5) < 0.05 && t[0].sat < 0.05, JSON.stringify(t[0]));
  assert.ok(Math.abs(t[0].lum - t[1].lum) < 0.02, 'as duas cinzas casam');
  assert.ok(t[2].sat > 0.6, `o vermelho é saturado: ${t[2].sat}`);
  assert.ok(dados.salto_sat_max > 0.6 && dados.salto_lum_max > 0.1, `${dados.salto_lum_max} ${dados.salto_sat_max}`);
});

test('com a linguagem, o salto acima da tolerância avisa com as duas tomadas e o instante', () => {
  const { dados, saida } = mede('--tomadas', cortes, '--linguagens', linguagens, '--linguagem', 'rosto');
  const avisos = dados.linguagem.avisos.filter((a) => /tomada/.test(a));
  assert.equal(avisos.length, 1, saida);
  assert.match(avisos[0], /4[.,]0 s/);
  assert.match(avisos[0], /satura/);
  assert.match(avisos[0], /0[.,]1/);
  assert.match(avisos[0], /provisória/);
});

test('o salto só de saturação, com a luminância dentro da tolerância, também avisa', () => {
  const { dados, saida } = mede('--tomadas', cortes, '--linguagens', linguagens, '--linguagem', 'so-saturacao');
  assert.equal(dados.linguagem.avisos.filter((a) => /salta/.test(a)).length, 1, saida);
});

test('sem a tolerância na linguagem, mede e não avisa, e diz que não há tolerância', () => {
  const { dados, saida } = mede('--tomadas', cortes, '--linguagens', linguagens, '--linguagem', 'solta');
  assert.ok(!dados.linguagem.avisos.some((a) => /salta/.test(a)), saida);
  assert.ok(dados.linguagem.avisos.some((a) => /sem tolerância/.test(a)), saida);
});

test('sem o cortes.json, o --tomadas sai com erro e diz o que falta', () => {
  const { status, saida } = mede('--tomadas', join(tmp, 'nao-existe.json'));
  assert.equal(status, 2, saida);
  assert.match(saida, /cortes\.json/);
});

// ─── o som do falado ────────────────────────────────────────────────────────
// a trilha a 0,1 de amplitude; no stem dos efeitos, um pop a 0,05 (−6 dB) aos 1,0 s e um impacto a 0,2
// (+6 dB) aos 3,0 s, pelo pico (o acerto do som.json é o pico, como o som.py posiciona)
function wavs(pasta) {
  const codigo = `import numpy as np, soundfile as sf
sr = 48000
n = 6 * sr
t = np.arange(n) / sr
sf.write(r'${join(pasta, 'stems', 'music.wav')}', np.stack([0.1 * np.sin(2 * np.pi * 220 * t)] * 2, axis=1), sr)
fx = np.zeros(n)
for em, a, hz in ((1.0, 0.05, 880), (3.0, 0.2, 660)):
    i = int((em - 0.04) * sr)
    k = int(0.08 * sr)
    env = np.ones(k)
    r = int(0.015 * sr)
    env[:r] = np.linspace(0, 1, r)
    env[-r:] = np.linspace(1, 0, r)
    fx[i:i + k] = a * env * np.sin(2 * np.pi * hz * np.arange(k) / sr)
sf.write(r'${join(pasta, 'stems', 'sfx.wav')}', np.stack([fx] * 2, axis=1), sr)
sf.write(r'${join(pasta, 'master.wav')}', np.zeros((n, 2)), sr)`;
  const r = spawnSync(PY_MIX, ['-I', '-c', codigo], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
}

test('na pasta do falado, cada efeito do som.json sai com o relevo contra a trilha', () => {
  const pasta = join(tmp, 'falado');
  mkdirSync(join(pasta, 'stems'), { recursive: true });
  wavs(pasta);
  writeFileSync(join(pasta, 'index.html'), '<div id="root" data-duration="6">\n<audio id="master" class="clip" src="master.wav" data-start="0" data-duration="6" data-volume="1"></audio>\n</div>');
  writeFileSync(join(pasta, 'som.json'), JSON.stringify({ musica: { arquivo: 'musica.wav', batida: 0.1 }, efeitos: [{ arquivo: 'pop.wav', acerto: 1.0, db: -10 }, { arquivo: 'impacto-seco.wav', acerto: 3.0, db: -10 }] }));
  const r = spawnSync(PY_MIX, ['-I', SIMULA, pasta, '--contexto', '--json'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const c = JSON.parse(r.stdout).contexto;
  const por = Object.fromEntries(c.efeitos.map((e) => [e.id, e]));
  assert.deepEqual(Object.keys(por), ['efeito-1', 'efeito-2'], r.stdout);
  assert.equal(por['efeito-1'].papel, 'pop');
  assert.equal(por['efeito-2'].papel, 'impacto');
  assert.ok(Math.abs(por['efeito-1'].relevo_db - -6) <= 1, `pop: ${por['efeito-1'].relevo_db}`);
  assert.ok(Math.abs(por['efeito-2'].relevo_db - 6) <= 1, `impacto: ${por['efeito-2'].relevo_db}`);
  assert.ok(Math.abs(por['efeito-1'].em_s - 1.0) <= 0.05, `o instante: ${por['efeito-1'].em_s}`);
  assert.equal(c.avisos.length, 1, JSON.stringify(c.avisos));
  assert.match(c.avisos[0], /efeito-1/);
  assert.ok(c.notas.some((n) => /stems/.test(n)), JSON.stringify(c.notas));
});
