// O som dentro da música: o `simula_mix.py --contexto` mede o relevo de cada efeito sobre a cama e a
// distância até a batida, numa peça sintética de resposta conhecida.
//
//   node --test .claude/skills/video/ferramentas/teste-contexto.test.mjs
//
// O Python é o da mixagem (numpy, soundfile, soxr, pyloudnorm), pelo MIXAGEM_PY.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const PY = process.env.MIXAGEM_PY || 'python';
const SIMULA = join(AQUI, 'simula_mix.py');

// um seno de amplitude conhecida: o RMS é amplitude / √2, então o relevo entre dois senos é 20·log10(a/b).
// O efeito curto (80 ms) sobe em 15 ms, fica 50 ms cheio e desce em 15 ms: a janela de 50 ms mais
// forte é o miolo, e o instante do efeito é o centro dele, 40 ms depois do data-start.
function wav(pasta, nome, segundos, amplitude, hz) {
  const codigo = `import numpy as np, soundfile as sf
n = int(round(${segundos} * 48000))
t = np.arange(n) / 48000
env = np.ones(n)
if ${segundos} < 1:
    r = int(0.015 * 48000)
    env[:r] = np.linspace(0, 1, r)
    env[-r:] = np.linspace(1, 0, r)
sf.write(r'${join(pasta, nome)}', ${amplitude} * env * np.sin(2 * np.pi * ${hz} * t), 48000)`;
  const r = spawnSync(PY, ['-I', '-c', codigo], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
}

function peca(pasta, audios, dur = 6) {
  const tags = audios.map((a) => `<audio id="${a.id}" src="${a.src}" data-start="${a.em}" data-duration="${a.dur}" data-volume="${a.vol ?? 1}"></audio>`).join('\n');
  writeFileSync(join(pasta, 'index.html'), `<div id="root" data-duration="${dur}">\n${tags}\n</div>`);
}

function roda(pasta, ...extra) {
  const r = spawnSync(PY, ['-I', SIMULA, pasta, '--contexto', '--json', ...extra], { encoding: 'utf8' });
  let dados = null;
  try { dados = JSON.parse(r.stdout); } catch { /* a saída não é JSON: o teste diz qual era */ }
  return { status: r.status, dados, saida: r.stdout + r.stderr };
}

const montada = () => {
  const pasta = mkdtempSync(join(tmpdir(), 'contexto-'));
  wav(pasta, 'cama.wav', 6, 0.1, 220);
  wav(pasta, 'golpe.wav', 0.08, 0.05, 880);
  wav(pasta, 'zum.wav', 0.08, 0.2, 660);
  wav(pasta, 'tique.wav', 0.08, 0.03, 1320);
  return pasta;
};

test('o Python da mixagem tem as bibliotecas', () => {
  const r = spawnSync(PY, ['-I', '-c', 'import numpy, scipy, soundfile, soxr, pyloudnorm'], { encoding: 'utf8' });
  assert.ok(!r.error && r.status === 0, `o Python da mixagem (${PY}) não tem numpy, scipy, soundfile, soxr e pyloudnorm (com -I): node .claude/skills/video/ferramentas/ambiente.mjs diz o conserto`);
});

test('o relevo de cada efeito sobre a cama sai no valor plantado, com o papel pelo id', () => {
  const pasta = montada();
  peca(pasta, [
    { id: 'trilha', src: 'cama.wav', em: 0, dur: 6 },
    { id: 'impacto-1', src: 'golpe.wav', em: 1.0, dur: 0.08 },
    { id: 'woosh-1', src: 'zum.wav', em: 2.0, dur: 0.08 },
    { id: 'clique-1', src: 'tique.wav', em: 3.0, dur: 0.08 },
  ]);
  const { dados, saida } = roda(pasta);
  assert.ok(dados && dados.contexto, `sem o bloco contexto: ${saida}`);
  const por = Object.fromEntries(dados.contexto.efeitos.map((e) => [e.id, e]));
  assert.deepEqual(Object.keys(por).sort(), ['clique-1', 'impacto-1', 'woosh-1']);
  assert.ok(Math.abs(por['impacto-1'].relevo_db - -6.0) <= 1, `impacto: ${por['impacto-1'].relevo_db}`);
  assert.ok(Math.abs(por['woosh-1'].relevo_db - 6.0) <= 1, `woosh: ${por['woosh-1'].relevo_db}`);
  assert.ok(Math.abs(por['clique-1'].relevo_db - -10.5) <= 1, `clique: ${por['clique-1'].relevo_db}`);
  assert.equal(por['impacto-1'].papel, 'impacto');
  assert.equal(por['woosh-1'].papel, 'woosh');
  assert.equal(por['clique-1'].papel, 'clique');
  assert.equal(dados.contexto.camas.join(), 'trilha');
});

test('o efeito abaixo do piso do papel avisa, e o modo estrito sai 1', () => {
  const pasta = montada();
  peca(pasta, [
    { id: 'trilha', src: 'cama.wav', em: 0, dur: 6 },
    { id: 'impacto-1', src: 'golpe.wav', em: 1.0, dur: 0.08 },
    { id: 'woosh-1', src: 'zum.wav', em: 2.0, dur: 0.08 },
  ]);
  const normal = roda(pasta);
  assert.equal(normal.status, 0, normal.saida);
  const avisos = normal.dados.contexto.avisos;
  assert.equal(avisos.length, 1, JSON.stringify(avisos));
  assert.match(avisos[0], /impacto-1/);
  assert.match(avisos[0], /-6[.,]\d/);
  // o aviso diz que o piso é calibragem e qual é o ponto de partida
  assert.match(avisos[0], /calibragem/);
  assert.match(avisos[0], /ponto de partida/);
  const estrito = roda(pasta, '--estrito');
  assert.equal(estrito.status, 1, estrito.saida);
});

test('a grade dada acha o efeito na batida e o fora dela, e diz o acaso', () => {
  const pasta = montada();
  // 120 BPM com a primeira batida em 0,5 s: batidas em 0,5, 1,0, 1,5...; a meia batida em 1,25
  peca(pasta, [
    { id: 'trilha', src: 'cama.wav', em: 0, dur: 6 },
    { id: 'impacto-na', src: 'golpe.wav', em: 0.96, dur: 0.08 },
    { id: 'woosh-meia', src: 'zum.wav', em: 1.21, dur: 0.08 },
    { id: 'impacto-fora', src: 'golpe.wav', em: 2.33, dur: 0.08 },
  ]);
  const { dados, saida } = roda(pasta, '--grade', '120,0.5');
  assert.ok(dados && dados.contexto, saida);
  const por = Object.fromEntries(dados.contexto.efeitos.map((e) => [e.id, e]));
  assert.ok(Math.abs(por['impacto-na'].batida_q) <= 1, `na batida: ${por['impacto-na'].batida_q}`);
  assert.ok(Math.abs(por['woosh-meia'].grade_q) <= 1 && Math.abs(por['woosh-meia'].batida_q) > 2, JSON.stringify(por['woosh-meia']));
  assert.ok(Math.abs(por['impacto-fora'].grade_q) > 2, JSON.stringify(por['impacto-fora']));
  const c = dados.contexto;
  assert.ok(Math.abs(c.na_batida - 1 / 3) < 0.01, `na batida: ${c.na_batida}`);
  assert.ok(Math.abs(c.na_grade - 2 / 3) < 0.01, `na grade: ${c.na_grade}`);
  // tolerância de 2 quadros a 30 qps dos dois lados, sobre a batida de 0,5 s e a meia de 0,25 s
  assert.ok(Math.abs(c.acaso_batida - (4 / 30) / 0.5) < 0.01, `acaso da batida: ${c.acaso_batida}`);
  assert.ok(Math.abs(c.acaso_grade - (4 / 30) / 0.25) < 0.01, `acaso da grade: ${c.acaso_grade}`);
});

test('a tecla da digitação tem papel e piso próprios, abaixo do clique', () => {
  const pasta = montada();
  peca(pasta, [
    { id: 'trilha', src: 'cama.wav', em: 0, dur: 6 },
    { id: 'tecla-1', src: 'tique.wav', em: 1.0, dur: 0.08 },
    { id: 'clique-1', src: 'tique.wav', em: 2.0, dur: 0.08 },
  ]);
  const { dados, saida } = roda(pasta);
  assert.ok(dados && dados.contexto, saida);
  const por = Object.fromEntries(dados.contexto.efeitos.map((e) => [e.id, e]));
  assert.equal(por['tecla-1'].papel, 'tecla');
  assert.ok(por['tecla-1'].piso_db < por['clique-1'].piso_db, JSON.stringify(por));
  // o mesmo som a -10,5 dB: abaixo do piso do clique, acima do da tecla
  assert.deepEqual(dados.contexto.avisos.map((a) => a.split(' ')[0]), ['clique-1']);
});

test('sem --grade, a grade sai da cama com nome de música, no tempo da peça', () => {
  const pasta = montada();
  // a trilha: um clique a cada 0,5 s (120 BPM) com a primeira batida em 0,25 s do arquivo; ela entra
  // aos 0,5 s da peça e lê o arquivo a partir de 0,1 s, então as batidas caem em 0,65, 1,15, 1,65... da peça
  const codigo = `import numpy as np, soundfile as sf
sr = 48000; n = 8 * sr; x = 0.02 * np.sin(2 * np.pi * 110 * np.arange(n) / sr)
for k in range(16):
    i = int((0.25 + 0.5 * k) * sr); x[i:i + 480] += 0.6 * np.exp(-np.arange(480) / 60)
sf.write(r'${join(pasta, 'batida.wav')}', x, sr)`;
  const g = spawnSync(PY, ['-I', '-c', codigo], { encoding: 'utf8' });
  assert.equal(g.status, 0, g.stderr);
  // a trilha entra aos 0,6 s (fora do múltiplo da batida) e lê o arquivo a partir de 0,1 s: batidas em
  // 0,75, 1,25, 1,75, 2,25... da peça; a "ambiente-1" é mais longa que ela, e a grade é a da trilha, pelo nome
  writeFileSync(join(pasta, 'index.html'), `<div id="root" data-duration="6">
<audio id="ambiente-1" src="cama.wav" data-start="0" data-duration="6"></audio>
<audio id="trilha" src="batida.wav" data-start="0.6" data-duration="5.4" data-media-start="0.1"></audio>
<audio id="impacto-na" src="golpe.wav" data-start="2.21" data-duration="0.08"></audio>
<audio id="impacto-fora" src="golpe.wav" data-start="2.47" data-duration="0.08"></audio>
</div>`);
  const { dados, saida } = roda(pasta);
  assert.ok(dados && dados.contexto, saida);
  const por = Object.fromEntries(dados.contexto.efeitos.map((e) => [e.id, e]));
  assert.equal(typeof por['impacto-na'].batida_q, 'number', JSON.stringify(por['impacto-na']));
  assert.ok(Math.abs(por['impacto-na'].batida_q) <= 1, `na batida (2,25 s): ${JSON.stringify(por['impacto-na'])}`);
  assert.ok(Math.abs(por['impacto-fora'].batida_q) > 2, `fora (2,51 s): ${JSON.stringify(por['impacto-fora'])}`);
  // a nota diz de qual clipe a grade saiu
  assert.match(dados.contexto.notas.join(' '), /grade medida da trilha "trilha": 1(19|20)\.\d BPM/);
});

test('o período da grade sai do batida_s, não do bpm arredondado', () => {
  // o medir_audio é trocado por um que devolve a medida de uma trilha de 70 BPM: o que se mede é a conta do grade_da_trilha
  const codigo = `import sys, types, json
m = types.ModuleType('medir_audio')
m.mede_musica = lambda p: {'bpm': 70.0, 'batida_s': 0.8571, 'primeira_batida_s': 0.2}
sys.modules['medir_audio'] = m
sys.path.insert(0, r'${AQUI}')
import simula_mix
print(json.dumps(simula_mix.grade_da_trilha('.', [{'id': 'trilha', 'src': 'x.wav', 'dur': 180, 'inicio': 1.0, 'media': 0.0}])))`;
  const r = spawnSync(PY, ['-I', '-c', codigo], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const [bpm, primeira, id] = JSON.parse(r.stdout);
  assert.ok(Math.abs(60 / bpm - 0.8571) < 1e-9, `o período: ${60 / bpm}`);
  assert.ok(Math.abs(primeira - 1.2) < 1e-9, `a primeira batida: ${primeira}`);
  assert.equal(id, 'trilha');
});

test('sem cama com nome de música, a grade sai da cama mais longa', () => {
  const pasta = montada();
  const codigo = `import numpy as np, soundfile as sf
sr = 48000; n = 8 * sr; x = 0.02 * np.sin(2 * np.pi * 110 * np.arange(n) / sr)
for k in range(16):
    i = int((0.25 + 0.5 * k) * sr); x[i:i + 480] += 0.6 * np.exp(-np.arange(480) / 60)
sf.write(r'${join(pasta, 'fundo.wav')}', x, sr)`;
  const g = spawnSync(PY, ['-I', '-c', codigo], { encoding: 'utf8' });
  assert.equal(g.status, 0, g.stderr);
  // o drone (sem batida) é curto; o "fundo-b" (com batida, sem nome de música) é o mais longo
  writeFileSync(join(pasta, 'index.html'), `<div id="root" data-duration="6">
<audio id="drone-1" src="cama.wav" data-start="0" data-duration="4.5"></audio>
<audio id="fundo-b" src="fundo.wav" data-start="0.6" data-duration="5.4" data-media-start="0.1"></audio>
<audio id="impacto-na" src="golpe.wav" data-start="2.21" data-duration="0.08"></audio>
</div>`);
  const { dados, saida } = roda(pasta);
  assert.ok(dados && dados.contexto, saida);
  assert.match(dados.contexto.notas.join(' '), /grade medida da trilha "fundo-b"/);
  const e = dados.contexto.efeitos.find((x) => x.id === 'impacto-na');
  assert.equal(typeof e.batida_q, 'number', JSON.stringify(e));
  assert.ok(Math.abs(e.batida_q) <= 1, JSON.stringify(e));
});

test('a peça sem cama mede o efeito sozinho e diz que a batida não se mede', () => {
  const pasta = montada();
  peca(pasta, [{ id: 'impacto-1', src: 'golpe.wav', em: 1.0, dur: 0.08 }], 3);
  const { dados, saida } = roda(pasta, '--grade', '120,0.5');
  assert.ok(dados && dados.contexto, saida);
  assert.deepEqual(dados.contexto.camas, []);
  assert.equal(dados.contexto.na_batida, null);
  assert.match(dados.contexto.notas.join(' '), /sem cama/);
});

test('o clipe longo conta como cama, mesmo sem o nome', () => {
  const pasta = montada();
  // nem o id nem o arquivo dizem cama: só a duração (5 s, acima dos 4 s) a faz cama
  wav(pasta, 'fundo.wav', 5, 0.1, 220);
  peca(pasta, [
    { id: 'fundo-a', src: 'fundo.wav', em: 0, dur: 5 },
    { id: 'impacto-1', src: 'golpe.wav', em: 1.0, dur: 0.08 },
  ]);
  const { dados, saida } = roda(pasta);
  assert.ok(dados && dados.contexto, saida);
  assert.deepEqual(dados.contexto.camas, ['fundo-a']);
  assert.deepEqual(dados.contexto.efeitos.map((e) => e.id), ['impacto-1']);
});

test('o clipe curto de id ambiente conta como cama, pelo nome', () => {
  const pasta = montada();
  // 3 s, abaixo dos 4 s: só o id faz dele cama
  wav(pasta, 'fundo.wav', 3, 0.1, 220);
  peca(pasta, [
    { id: 'ambiente-1', src: 'fundo.wav', em: 0, dur: 3 },
    { id: 'impacto-1', src: 'golpe.wav', em: 1.0, dur: 0.08 },
  ], 3);
  const { dados, saida } = roda(pasta);
  assert.ok(dados && dados.contexto, saida);
  assert.deepEqual(dados.contexto.camas, ['ambiente-1']);
  assert.deepEqual(dados.contexto.efeitos.map((e) => e.id), ['impacto-1']);
});

test('sem a flag, a saída de hoje não muda', () => {
  const pasta = montada();
  peca(pasta, [{ id: 'trilha', src: 'cama.wav', em: 0, dur: 6 }]);
  const r = spawnSync(PY, ['-I', SIMULA, pasta], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^pico verdadeiro .* dBTP aos .* s; o render baixaria .* dB; o integrado sairia .* LUFS/);
  assert.doesNotMatch(r.stdout, /relevo/);
});
