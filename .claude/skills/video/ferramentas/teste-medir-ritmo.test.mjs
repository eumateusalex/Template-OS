// O medidor de ritmo, som e cor e a régua da linguagem: `medir_ritmo.py` sobre um vídeo sintético com
// cortes, bipes e um fecho parado plantados.
//
//   node --test .claude/skills/video/ferramentas/teste-medir-ritmo.test.mjs
//
// Pede o Python do sistema com numpy e o ffmpeg do PATH.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const MEDIR = join(AQUI, 'medir_ritmo.py');
const PY = process.env.VIDEO_PY || 'python';
const tmp = mkdtempSync(join(tmpdir(), 'ritmo-'));
const comSom = join(tmp, 'com-som.mp4');
const semSom = join(tmp, 'sem-som.mp4');
const linguagens = join(tmp, 'linguagens.json');

const ff = (args) => execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-y', ...args]);

// 0 a 4 s: o padrão de teste que anda; corte em 4 s para o mandelbrot que anda devagar; corte em 8 s para o
// amarelo parado até 12 s (o fecho parado de 4 s). Bipes de 50 ms em 1, 2 e 3 s, silêncio no resto.
before(() => {
  const v = (src, d) => ['-f', 'lavfi', '-t', String(d), '-i', `${src},scale=270:480,fps=30,format=yuv420p`];
  ff([...v('testsrc2=s=270x480:r=30', 4), ...v('mandelbrot=s=270x480:r=30', 4), ...v('color=c=yellow:s=270x480:r=30', 4),
    '-f', 'lavfi', '-t', '12', '-i', "aevalsrc='0.6*sin(2*PI*880*t)*(lt(mod(t,1),0.05))*between(t,0.9,3.2)':s=48000",
    '-filter_complex', '[0:v][1:v][2:v]concat=n=3:v=1:a=0[v]', '-map', '[v]', '-map', '3:a',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', comSom]);
  ff(['-i', comSom, '-an', '-c:v', 'copy', semSom]);
  writeFileSync(linguagens, JSON.stringify({
    versao: 1,
    linguagens: {
      teste: { nome: 'teste', faixas: { movimento_mediano: [0.02, 1], segundos_calmos_fracao: [0, 0.1], eventos_por_s: [2, 6] }, fecho_parado_max_s: 1.4, calmo_abaixo: 0.004, referencias: ['ref-a', 'ref-b'], provisoria: true },
      firme: { nome: 'firme', faixas: { eventos_por_s: [2, 6] }, referencias: ['ref-c'], provisoria: false },
    },
  }));
});

function mede(...args) {
  const r = spawnSync(PY, ['-I', MEDIR, ...args, '--json-saida'], { encoding: 'utf8' });
  let dados = null;
  try { dados = JSON.parse(r.stdout); } catch { /* o teste diz a saída */ }
  return { status: r.status, dados, saida: r.stdout + r.stderr };
}

test('acha os cortes, os bipes e o trecho calmo nos instantes plantados', () => {
  const { status, dados, saida } = mede(comSom);
  assert.equal(status, 0, saida);
  assert.ok(dados, saida);
  const perto = (lista, alvo, tol) => lista.some((t) => Math.abs(t - alvo) <= tol);
  assert.ok(perto(dados.cortes, 4.0, 0.1) && perto(dados.cortes, 8.0, 0.1), `cortes: ${dados.cortes}`);
  for (const b of [1, 2, 3]) assert.ok(perto(dados.onsets, b, 0.05), `onset em ${b}: ${dados.onsets}`);
  assert.ok(dados.movimento_por_s.slice(9, 12).every((m) => m < 0.004), `o fim parado: ${dados.movimento_por_s}`);
  assert.ok(dados.movimento_por_s.slice(0, 3).every((m) => m > 0.004), `o começo andando: ${dados.movimento_por_s}`);
  assert.ok(Math.abs(dados.fecho_parado_s - 4) <= 0.6, `fecho parado: ${dados.fecho_parado_s}`);
});

test('a linguagem aponta o que sai da faixa, com o valor e a faixa', () => {
  const { dados, saida } = mede(comSom, '--linguagens', linguagens, '--linguagem', 'teste');
  assert.ok(dados && dados.linguagem, saida);
  const avisos = dados.linguagem.avisos.join('\n');
  const esc = (n) => String(n).replace('.', '\\.');
  assert.match(avisos, new RegExp(`segundos_calmos_fracao = ${esc(dados.segundos_calmos_fracao)} fora da faixa \\[0, 0\\.1\\]`));
  assert.match(avisos, new RegExp(`eventos_por_s = ${esc(dados.eventos_por_s)} fora da faixa \\[2, 6\\]`));
  assert.match(avisos, /fecho parado/);
  // a faixa diz de onde veio, e a provisória se diz provisória
  assert.match(avisos, /ref-a/);
  assert.match(avisos, /provisória/);
  // o fecho e a janela calma também dizem de onde vem o teto
  assert.match(dados.linguagem.avisos.find((a) => a.startsWith('fecho parado')) || '', /provisória, de 2 referência/);
  assert.match(dados.linguagem.avisos.find((a) => a.startsWith('janela calma')) || '', /provisória, de 2 referência/);
});

test('a faixa firme não se diz provisória', () => {
  const { dados, saida } = mede(comSom, '--linguagens', linguagens, '--linguagem', 'firme');
  assert.ok(dados && dados.linguagem, saida);
  const avisos = dados.linguagem.avisos.join('\n');
  assert.match(avisos, /eventos_por_s = [\d.]+ fora da faixa \[2, 6\] da linguagem firme \(faixa, de 1 referência\(s\): ref-c\)/);
  assert.doesNotMatch(avisos, /provisória/);
  assert.ok(dados.linguagem.janela_calma.de >= 7.5, `a janela calma: ${JSON.stringify(dados.linguagem.janela_calma)}`);
  assert.match(avisos, /janela calma/);
});

test('o respiro declarado cala a janela calma', () => {
  const { dados, saida } = mede(comSom, '--linguagens', linguagens, '--linguagem', 'teste', '--respiro', '8-12');
  assert.ok(dados && dados.linguagem, saida);
  assert.doesNotMatch(dados.linguagem.avisos.join('\n'), /janela calma/);
  assert.ok(dados.linguagem.janela_calma.de < 8 || dados.linguagem.janela_calma === null || dados.linguagem.janela_calma.movimento >= 0.004,
    JSON.stringify(dados.linguagem.janela_calma));
});

test('linguagem que não existe sai com erro e a lista das que existem', () => {
  const r = spawnSync(PY, ['-I', MEDIR, comSom, '--linguagens', linguagens, '--linguagem', 'nada'], { encoding: 'utf8' });
  assert.equal(r.status, 2, r.stdout + r.stderr);
  assert.match(r.stdout + r.stderr, /teste/);
});

test('vídeo sem áudio sai sem os campos de som, e a linguagem avisa que não mediu o som', () => {
  const { dados, saida } = mede(semSom, '--linguagens', linguagens, '--linguagem', 'teste');
  assert.ok(dados, saida);
  assert.equal(dados.tem_audio, false);
  assert.equal(dados.eventos_por_s, undefined);
  assert.match(dados.linguagem.avisos.join('\n'), /sem áudio/);
});

test('a linguagens.json da skill abre e cada linguagem tem faixas', () => {
  const real = JSON.parse(execFileSync(PY, ['-I', '-c', `import json;print(json.dumps(json.load(open(r'${join(AQUI, 'linguagens.json')}', encoding='utf-8'))))`], { encoding: 'utf8' }));
  const ids = Object.keys(real.linguagens);
  assert.ok(ids.length >= 4, `linguagens: ${ids}`);
  for (const id of ids) {
    const l = real.linguagens[id];
    assert.ok(l.faixas && Object.keys(l.faixas).length >= 2, `${id} sem faixas`);
    assert.ok(Number.isInteger(l.n_referencias) && l.n_referencias >= 1, `${id} sem referência medida`);
    assert.equal(l.referencias, undefined, `${id}: a faixa leva só quantas referências a mediram, sem nome`);
  }
});
