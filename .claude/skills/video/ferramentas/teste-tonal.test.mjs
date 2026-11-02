// O gerador tonal (`tonal.py`): o drone e o golpe nos números do § 3 do som-cinematografico.md, no tom
// pedido ou no da trilha medida pelo tom.py. Cada som sai e se mede de volta: as notas mais fortes, a
// banda, os LUFS, a entrada e a cauda; o pedido errado sai 1 sem gravar.
//
//   node --test .claude/skills/video/ferramentas/teste-tonal.test.mjs
//
// Pede o Python da mixagem (MIXAGEM_PY: numpy, scipy, soundfile, pyloudnorm) e o ffmpeg do PATH.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const TONAL = join(AQUI, 'tonal.py');
const PY = process.env.MIXAGEM_PY || 'python';
const tmp = mkdtempSync(join(tmpdir(), 'tonal-'));
const NOTA = ['Dó', 'Dó#', 'Ré', 'Ré#', 'Mi', 'Fá', 'Fá#', 'Sol', 'Sol#', 'Lá', 'Lá#', 'Si'];

const tonal = (...args) => {
  const r = spawnSync(PY, ['-I', TONAL, ...args], { encoding: 'utf8' });
  return { codigo: r.status, saida: r.stdout + r.stderr, json: (() => { try { return JSON.parse(r.stdout.trim().split('\n').pop()); } catch { return null; } })() };
};

// a medida de volta, no mesmo Python: os LUFS, as classes de nota mais fortes (55 Hz a 2 kHz), a
// energia fora da banda contra a de dentro, o nível por janela e o formato do arquivo
function mede(arquivo, { banda, janelas = [] }) {
  const codigo = `import json, numpy as np, soundfile as sf, pyloudnorm as pyln
x, sr = sf.read(r'${arquivo}', always_2d=True)
info = sf.info(r'${arquivo}')
m = x.mean(axis=1)
spec = np.abs(np.fft.rfft(m)) ** 2
f = np.fft.rfftfreq(len(m), 1 / sr)
lo, hi = ${banda[0]}, ${banda[1]}
dentro = spec[(f >= lo) & (f <= hi)].sum()
db = lambda a: float(10 * np.log10(a / dentro + 1e-30))
croma = np.zeros(12)
sel = (f >= 55) & (f <= 2000)
classe = np.round(12 * np.log2(f[sel] / 440.0)).astype(int) % 12
np.add.at(croma, (classe + 9) % 12, spec[sel])
rms = lambda a, b: float(20 * np.log10(np.sqrt(np.mean(m[int(a * sr):int(b * sr)] ** 2)) + 1e-12))
print(json.dumps({"lufs": float(pyln.Meter(sr).integrated_loudness(x)), "sr": sr, "canais": x.shape[1], "dur": len(m) / sr,
  "subtipo": info.subtype, "abaixo_db": db(spec[f < lo * 0.8].sum()), "acima_db": db(spec[f > hi * 1.25].sum()),
  "classes": [int(i) for i in np.argsort(croma)[::-1][:3]], "janelas": [rms(a, b) for a, b in ${JSON.stringify(janelas)}]}))`;
  const r = spawnSync(PY, ['-I', '-c', codigo], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}

// a trilha sintética em Ré menor (a escala natural, com a tônica e a tríade pesando), e a mesma
// 40 cents acima, para o "troque de faixa"
function trilha(nome, cents) {
  const codigo = `import numpy as np, soundfile as sf
sr = 48000; t = np.arange(12 * sr) / sr; x = np.zeros_like(t)
pesos = {2: 3.0, 5: 1.6, 9: 2.0, 4: 0.8, 7: 0.9, 0: 0.7, 10: 0.7}
for classe, p in pesos.items():
    for oit in (3, 4):
        f = 440 * 2 ** ((classe - 9) / 12 + (oit - 4) + ${cents} / 1200)
        x += p * np.sin(2 * np.pi * f * t)
sf.write(r'${join(tmp, nome)}', 0.2 * x / np.abs(x).max(), sr)`;
  const r = spawnSync(PY, ['-I', '-c', codigo], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return join(tmp, nome);
}

let drone, golpe, acento;
before(() => {
  drone = join(tmp, 'drone.wav'); golpe = join(tmp, 'golpe.wav'); acento = join(tmp, 'acento.wav');
  for (const [args, arq] of [[['drone', drone, '--tom', 'Lá menor', '--dur', '10'], drone], [['golpe', golpe, '--tom', 'Lá menor'], golpe], [['golpe', acento, '--tom', 'Lá menor', '--acento'], acento]]) {
    const r = tonal(...args);
    assert.equal(r.codigo, 0, `${args.join(' ')}: ${r.saida}`);
    assert.ok(existsSync(arq));
  }
});

test('o drone: a tônica e a quinta mais fortes, na banda de 90 Hz a 2,5 kHz, a −26 LUFS', () => {
  const m = mede(drone, { banda: [90, 2500] });
  assert.equal(m.sr, 48000); assert.equal(m.canais, 2); assert.equal(m.subtipo, 'PCM_24');
  assert.ok(Math.abs(m.dur - 10) < 0.05, `duração ${m.dur}`);
  assert.deepEqual(new Set(m.classes.slice(0, 2)), new Set([9, 4]), `as duas mais fortes: ${m.classes.map((c) => NOTA[c])}`);
  assert.ok(m.abaixo_db < -24, `abaixo de 90 Hz: ${m.abaixo_db.toFixed(1)} dB`);
  assert.ok(m.acima_db < -24, `acima de 2,5 kHz: ${m.acima_db.toFixed(1)} dB`);
  assert.ok(Math.abs(m.lufs + 26) <= 0.5, `LUFS ${m.lufs.toFixed(2)}`);
});

test('o drone entra em fade de 4 s: o primeiro meio segundo 20 dB abaixo do trecho cheio', () => {
  const [comeco, meio, cheio] = mede(drone, { banda: [90, 2500], janelas: [[0, 0.5], [1.75, 2.25], [5, 8]] }).janelas;
  assert.ok(cheio - comeco > 20, `começo ${comeco.toFixed(1)} dB, cheio ${cheio.toFixed(1)} dB`);
  assert.ok(meio < cheio - 2 && meio > comeco + 6, `no meio do fade (${meio.toFixed(1)} dB) o nível está subindo`);
});

test('o golpe: a tônica mais forte, sem sub abaixo de 150 Hz, a cauda longa e −21 LUFS', () => {
  const m = mede(golpe, { banda: [150, 2200], janelas: [[0, 0.3], [4, 4.5]] });
  assert.equal(m.classes[0], 9, `a mais forte: ${NOTA[m.classes[0]]}`);
  assert.ok(m.abaixo_db < -24, `abaixo de 150 Hz: ${m.abaixo_db.toFixed(1)} dB`);
  assert.ok(m.acima_db < -24, `acima de 2,2 kHz: ${m.acima_db.toFixed(1)} dB`);
  const [ataque, cauda] = m.janelas;
  assert.ok(cauda > ataque - 40, `4 s depois a cauda ainda soa (ataque ${ataque.toFixed(1)}, cauda ${cauda.toFixed(1)} dB)`);
  assert.ok(Math.abs(m.lufs + 21) <= 0.5, `LUFS ${m.lufs.toFixed(2)}`);
  assert.ok(Math.abs(mede(acento, { banda: [150, 2200] }).lufs + 25) <= 0.5, 'o acento a −25 LUFS');
});

// todo efeito se posiciona pelo pico (data-start = o acerto − o pico): o golpe que floresce no reverb
// e passa o ataque entraria adiantado no drop (o primeiro golpe da peça de prova tinha o pico aos 0,85 s)
test('o pico do golpe é o ataque: o máximo cai nos primeiros 60 ms, e a cauda segue longa', () => {
  const codigo = `import json, numpy as np, soundfile as sf
x, sr = sf.read(r'${golpe}', always_2d=True)
m = np.abs(x).max(axis=1)
print(json.dumps({"pico_s": float(np.argmax(m) / sr)}))`;
  const r = spawnSync(PY, ['-I', '-c', codigo], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const { pico_s } = JSON.parse(r.stdout);
  assert.ok(pico_s < 0.06, `o pico do golpe aos ${pico_s.toFixed(3)} s`);
});

test('o golpe soma a tônica em duas oitavas acima de 150 Hz', () => {
  const r = tonal('golpe', join(tmp, 'g2.wav'), '--tom', 'Lá menor');
  assert.equal(r.codigo, 0, r.saida);
  const hz = r.json.hz;
  assert.ok(hz >= 150 && hz < 300, `a tônica do golpe em ${hz} Hz`);
  assert.ok(r.json.camadas.some((c) => Math.abs(c.hz - 2 * hz) < 0.5 && c.ganho === 0.6), `a oitava a 0,6: ${JSON.stringify(r.json.camadas)}`);
  // e no arquivo, não só no que o tonal.py diz de si: com a camada da oitava, a energia em 2f fica perto da
  // tônica (o 2º harmônico dela soma com a camada); sem a camada, só o harmônico, uns 9 dB abaixo
  const o = spawnSync(PY, ['-I', '-c', `import numpy as np, soundfile as sf
x, sr = sf.read(r'${join(tmp, 'g2.wav')}', always_2d=True); m = x.mean(axis=1)
s = np.abs(np.fft.rfft(m)) ** 2; f = np.fft.rfftfreq(len(m), 1 / sr)
e = lambda c: s[(f > c * 0.98) & (f < c * 1.02)].sum()
print(10 * np.log10(e(${2 * hz}) / e(${hz})))`], { encoding: 'utf8' });
  assert.ok(Number(o.stdout) > -4 && Number(o.stdout) < 3, `a oitava ${o.stdout.trim()} dB contra a tônica`);
});

test('pela trilha: o tom sai do tom.py e a saída diz qual foi', () => {
  const saida = join(tmp, 'drone-re.wav');
  const r = tonal('drone', saida, '--trilha', trilha('re-menor.wav', 0), '--dur', '8');
  assert.equal(r.codigo, 0, r.saida);
  assert.equal(r.json.tom, 'Ré menor');
  assert.equal(r.json.de, 'trilha');
  assert.deepEqual(new Set(mede(saida, { banda: [90, 2500] }).classes.slice(0, 2)), new Set([2, 9]), 'Ré e Lá');
});

test('a trilha desafinada sai 1 sem gravar, com o troque de faixa', () => {
  const saida = join(tmp, 'drone-desafinado.wav');
  const r = tonal('drone', saida, '--trilha', trilha('trilha-desafinada.wav', 40), '--dur', '8');
  assert.equal(r.codigo, 1, r.saida);
  assert.match(r.saida, /troque de faixa/);
  assert.ok(!existsSync(saida));
});

test('o pedido errado sai 1 sem gravar e diz o que aceita', () => {
  for (const [args, motivo] of [
    [['--tom', 'Lá dórico', '--dur', '8'], /menor|maior/],
    [['--tom', 'H menor', '--dur', '8'], /Dó/],
    [['--dur', '8'], /--tom|--trilha/],
    [['--tom', 'Lá menor', '--dur', '3'], /4 s/],
  ]) {
    const saida = join(tmp, `errado-${args.join('').replace(/\W/g, '')}.wav`);
    const r = tonal('drone', saida, ...args);
    assert.equal(r.codigo, 1, `${args.join(' ')}: ${r.saida}`);
    assert.match(r.saida, motivo);
    assert.ok(!existsSync(saida), `${args.join(' ')} gravou`);
  }
});

test('a saída que existe não se sobrescreve sem --sobrescrever', () => {
  const saida = join(tmp, 'existe.wav');
  writeFileSync(saida, 'não é áudio');
  const r = tonal('golpe', saida, '--tom', 'Lá menor');
  assert.equal(r.codigo, 1, r.saida);
  assert.match(r.saida, /sobrescrever/);
  assert.equal(tonal('golpe', saida, '--tom', 'Lá menor', '--sobrescrever').codigo, 0);
  assert.equal(readFileSync(saida).toString('ascii', 0, 4), 'RIFF', 'o --sobrescrever regravou o arquivo como WAV');
});
