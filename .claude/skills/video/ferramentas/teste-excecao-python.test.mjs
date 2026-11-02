// A exceção escrita no plano.json cala o aviso das duas réguas Python, pelo excecoes.mjs da /mograph:
// o relevo do `simula_mix.py --contexto` e as faixas do `medir_ritmo.py`, que também
// tira a linguagem e o respiro do plano.
//
//   node --test .claude/skills/video/ferramentas/teste-excecao-python.test.mjs
//
// Pede o Python da mixagem (MIXAGEM_PY), o Python do sistema com numpy, o ffmpeg e o node do PATH.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const EXCECOES = join(AQUI, '..', '..', 'mograph', 'ferramentas', 'excecoes.mjs');
const SIMULA = join(AQUI, 'simula_mix.py');
const MEDIR = join(AQUI, 'medir_ritmo.py');
const PY_MIX = process.env.MIXAGEM_PY || 'python';
const PY = process.env.VIDEO_PY || 'python';
const tmp = mkdtempSync(join(tmpdir(), 'excecao-python-'));
const ff = (args) => execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-y', ...args]);

// ─── a peça de som: a cama e um impacto 6 dB abaixo dela (abaixo do piso de +3) aos 1,0 s ──────
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
  const r = spawnSync(PY_MIX, ['-I', '-c', codigo], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
}
const CENAS = [{ id: 'S01', de: 0, ate: 3 }, { id: 'S02', de: 3, ate: 6 }];
function pecaDeSom(plano) {
  const pasta = mkdtempSync(join(tmp, 'som-'));
  wav(pasta, 'cama.wav', 6, 0.1, 220);
  wav(pasta, 'golpe.wav', 0.08, 0.05, 880);
  writeFileSync(join(pasta, 'index.html'), `<div id="root" data-duration="6">
<audio id="trilha" src="cama.wav" data-start="0" data-duration="6"></audio>
<audio id="impacto-1" src="golpe.wav" data-start="1.0" data-duration="0.08"></audio>
<audio id="impacto-2" src="golpe.wav" data-start="4.0" data-duration="0.08"></audio>
</div>`);
  if (plano) writeFileSync(join(pasta, 'plano.json'), JSON.stringify(plano));
  return pasta;
}
function contexto(pasta, ...extra) {
  const r = spawnSync(PY_MIX, ['-I', SIMULA, pasta, '--contexto', '--json', ...extra], { encoding: 'utf8' });
  let dados = null;
  try { dados = JSON.parse(r.stdout).contexto; } catch { /* a saída diz */ }
  return { status: r.status, dados, saida: r.stdout + r.stderr };
}

test('o excecoes.mjs calibra pela linha de comando: a exceção da cena vira aceita', () => {
  const plano = join(tmp, 'plano-cli.json');
  writeFileSync(plano, JSON.stringify({ excecoes: [{ regra: 'relevo', cena: 'S01', motivo: 'o golpe é textura sob a voz' }] }));
  const entrada = JSON.stringify({ erros: [], avisos: [{ regra: 'relevo', cena: 'S01', msg: 'impacto-1 baixo' }, { regra: 'relevo', cena: 'S02', msg: 'impacto-2 baixo' }] });
  const r = spawnSync(process.execPath, [EXCECOES, 'calibrar', plano], { input: entrada, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const c = JSON.parse(r.stdout);
  assert.equal(c.aceitos.length, 1, r.stdout);
  assert.equal(c.aceitos[0].motivo, 'o golpe é textura sob a voz');
  assert.equal(c.avisos.length, 1);
  assert.match(c.avisos[0].msg, /impacto-2/);
});

test('o relevo, a batida e as faixas aceitam exceção escrita (são calibragem)', () => {
  const plano = join(tmp, 'plano-conf.json');
  writeFileSync(plano, JSON.stringify({ excecoes: ['relevo', 'batida', 'faixas'].map((regra) => ({ regra, motivo: 'm' })) }));
  const r = spawnSync(process.execPath, [EXCECOES, 'conferir', plano], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('o --contexto com o plano na pasta cala o relevo da cena com exceção, e o --estrito sai 0', () => {
  const pasta = pecaDeSom({ cenas: CENAS, excecoes: [{ regra: 'relevo', motivo: 'o golpe fica sob a cama de propósito', fonte: 'a peça' }] });
  const { status, dados, saida } = contexto(pasta, '--estrito');
  assert.equal(status, 0, saida);
  assert.equal(dados.avisos.length, 0, saida);
  assert.equal(dados.aceitos.length, 2, saida);
  assert.equal(dados.aceitos[0].motivo, 'o golpe fica sob a cama de propósito');
});

test('a exceção de uma cena só cala aquela cena; a outra segue avisando e o --estrito sai 1', () => {
  const pasta = pecaDeSom({ cenas: CENAS, excecoes: [{ regra: 'relevo', cena: 'S02', motivo: 'só a segunda' }] });
  const { status, dados, saida } = contexto(pasta, '--estrito');
  assert.equal(status, 1, saida);
  assert.equal(dados.aceitos.length, 1, saida);
  assert.equal(dados.avisos.length, 1, saida);
  assert.match(dados.avisos[0], /impacto-1/);
});

test('sem plano, avisa como antes', () => {
  const pasta = pecaDeSom(null);
  const { status, dados, saida } = contexto(pasta, '--estrito');
  assert.equal(status, 1, saida);
  assert.equal(dados.avisos.length, 2, saida);
});

test('o --plano aponta o plano de outra pasta', () => {
  const pasta = pecaDeSom(null);
  const plano = join(tmp, 'plano-fora.json');
  writeFileSync(plano, JSON.stringify({ cenas: CENAS, excecoes: [{ regra: 'relevo', motivo: 'de fora' }] }));
  const { status, dados, saida } = contexto(pasta, '--estrito', '--plano', plano);
  assert.equal(status, 0, saida);
  assert.equal(dados.aceitos.length, 2, saida);
});

test('na linguagem em que a voz manda, a batida não se cobra e a nota diz por quê', () => {
  const pasta = pecaDeSom({ linguagem: 'spec-ad-locucao', cenas: CENAS });
  const { dados, saida } = contexto(pasta, '--grade', '120,0');
  assert.equal(dados.na_batida, null, saida);
  assert.ok(dados.notas.some((n) => /voz manda/.test(n) && /spec-ad-locucao/.test(n)), saida);
  const musica = pecaDeSom({ linguagem: 'interface-de-marca', cenas: CENAS });
  assert.notEqual(contexto(musica, '--grade', '120,0').dados.na_batida, null, 'onde a música manda, a batida se mede');
  const ev = contexto(pecaDeSom({ linguagem: 'so-efeitos', cenas: CENAS }), '--grade', '120,0');
  assert.equal(ev.dados.na_batida, null, ev.saida);
  assert.ok(ev.dados.notas.some((n) => /cada evento manda/.test(n) && /so-efeitos/.test(n)), ev.saida);
});

test('o estímulo da /mograph tira o efeito que o --contexto mede abaixo do piso, e diz quando não mediu', async () => {
  const { inaudiveisDaPeca } = await import(pathToFileURL(join(AQUI, '..', '..', 'mograph', 'ferramentas', 'regua-direcao.mjs')).href);
  const r = inaudiveisDaPeca(pecaDeSom(null));
  assert.equal(r.medido, true, r.motivo);
  assert.deepEqual([...r.ids].sort(), ['impacto-1', 'impacto-2']);
  // o efeito que se ouve (6 dB acima da cama, acima do piso de +3 do impacto) fica fora do conjunto
  const alto = pecaDeSom(null);
  writeFileSync(join(alto, 'index.html'), `<div id="root" data-duration="6">
<audio id="trilha" src="cama.wav" data-start="0" data-duration="6"></audio>
<audio id="impacto-1" src="golpe.wav" data-start="1.0" data-duration="0.08" data-volume="4"></audio>
</div>`);
  const a = inaudiveisDaPeca(alto);
  assert.equal(a.medido, true, a.motivo);
  assert.equal(a.ids.size, 0, 'o impacto 6 dB acima da cama se ouve');
  const antes = process.env.MIXAGEM_PY;
  process.env.MIXAGEM_PY = join(tmp, 'nao-existe', 'python.exe');
  try {
    const s = inaudiveisDaPeca(pecaDeSom(null));
    assert.equal(s.medido, false);
    assert.equal(s.ids.size, 0);
    assert.match(s.motivo, /MIXAGEM_PY/);
  } finally {
    if (antes === undefined) delete process.env.MIXAGEM_PY; else process.env.MIXAGEM_PY = antes;
  }
});

// ─── o vídeo: o medidor de ritmo pelo plano ─────────────────────────────────
// 0 a 4 s o padrão que anda, 4 a 8 o mandelbrot devagar, 8 a 12 o amarelo parado (o fecho de 4 s)
const video = join(tmp, 'ritmo.mp4');
const linguagens = join(tmp, 'linguagens.json');
before(() => {
  const v = (src, d) => ['-f', 'lavfi', '-t', String(d), '-i', `${src},scale=270:480,fps=30,format=yuv420p`];
  ff([...v('testsrc2=s=270x480:r=30', 4), ...v('mandelbrot=s=270x480:r=30', 4), ...v('color=c=yellow:s=270x480:r=30', 4),
    '-filter_complex', '[0:v][1:v][2:v]concat=n=3:v=1:a=0[v]', '-map', '[v]', '-c:v', 'libx264', '-preset', 'ultrafast', video]);
  writeFileSync(linguagens, JSON.stringify({ versao: 1, linguagens: {
    teste: { nome: 'teste', tempo: 'musica', dispensa: [], faixas: {}, fecho_parado_max_s: 1.4, calmo_abaixo: 0.004, referencias: ['ref-a'], provisoria: false } } }));
});
function ritmo(...args) {
  const r = spawnSync(PY, ['-I', MEDIR, video, '--linguagens', linguagens, ...args, '--json-saida'], { encoding: 'utf8' });
  let dados = null;
  try { dados = JSON.parse(r.stdout); } catch { /* a saída diz */ }
  return { status: r.status, dados, saida: r.stdout + r.stderr };
}

test('o --plano dá a linguagem sem o --linguagem', () => {
  const plano = join(tmp, 'plano-ritmo.json');
  writeFileSync(plano, JSON.stringify({ linguagem: 'teste', cenas: [] }));
  const { dados, saida } = ritmo('--plano', plano);
  assert.equal(dados?.linguagem?.id, 'teste', saida);
  assert.ok(dados.linguagem.avisos.some((a) => a.startsWith('fecho parado')), saida);
});

test('o respiro do plano cala a janela calma dentro dele', () => {
  const sem = join(tmp, 'plano-sem-respiro.json');
  writeFileSync(sem, JSON.stringify({ linguagem: 'teste', cenas: [] }));
  assert.ok(ritmo('--plano', sem).dados.linguagem.avisos.some((a) => a.startsWith('janela calma')), 'sem o respiro, a janela calma avisa');
  const com = join(tmp, 'plano-respiro.json');
  writeFileSync(com, JSON.stringify({ linguagem: 'teste', cenas: [], respiro: [{ de: 7.5, ate: 12, motivo: 'o número assenta' }] }));
  const { dados, saida } = ritmo('--plano', com);
  assert.ok(!dados.linguagem.avisos.some((a) => a.startsWith('janela calma')), saida);
});

test('a exceção de faixas no plano cala o fecho parado e fica como aceita', () => {
  const plano = join(tmp, 'plano-excecao.json');
  writeFileSync(plano, JSON.stringify({ linguagem: 'teste', cenas: [], respiro: [{ de: 7.5, ate: 12, motivo: 'r' }],
    excecoes: [{ regra: 'faixas', trecho: 'fecho parado', motivo: 'o logo assenta mais, pedido do cliente' }] }));
  const { dados, saida } = ritmo('--plano', plano);
  assert.ok(!dados.linguagem.avisos.some((a) => a.startsWith('fecho parado')), saida);
  assert.equal(dados.linguagem.aceitos.length, 1, saida);
  assert.equal(dados.linguagem.aceitos[0].motivo, 'o logo assenta mais, pedido do cliente');
});

test('na saída de texto, o aceito sai com a regra, o motivo e a fonte, como nas outras réguas', () => {
  const plano = join(tmp, 'plano-texto.json');
  writeFileSync(plano, JSON.stringify({ linguagem: 'teste', cenas: [], respiro: [{ de: 7.5, ate: 12, motivo: 'r' }],
    excecoes: [{ regra: 'faixas', trecho: 'fecho parado', motivo: 'o logo assenta mais', fonte: 'o cliente' }] }));
  const r = spawnSync(PY, ['-I', MEDIR, video, '--linguagens', linguagens, '--plano', plano], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /aceito \[faixas\] fecho parado .* · a exceção do plano: o logo assenta mais \(o cliente\)/);
});

test('o --linguagem da linha de comando manda sobre o do plano', () => {
  const plano = join(tmp, 'plano-outra.json');
  writeFileSync(plano, JSON.stringify({ linguagem: 'nao-existe', cenas: [] }));
  const { dados, saida } = ritmo('--plano', plano, '--linguagem', 'teste');
  assert.equal(dados?.linguagem?.id, 'teste', saida);
});
