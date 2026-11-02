// Os pacotes de material do usuário pelo índice, em qualquer máquina: os pacotes se declaram no
// material.local.json (a raiz, a pasta de cada tipo, a licença e se ela é clara), o índice grava
// caminho relativo e a licença, e a raiz errada não apaga o índice que existe.
//
//   node --test .claude/skills/mograph/ferramentas/teste-ativos.test.mjs
//
// Pede o Python do sistema com numpy e o ffmpeg do PATH.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const ATIVOS = join(AQUI, 'ativos.py');
const PY = process.env.VIDEO_PY || 'python';
const tmp = mkdtempSync(join(tmpdir(), 'ativos-'));
const material = join(tmp, 'material');
const indices = join(tmp, 'indices');
const conf = join(tmp, 'material.local.json');

const som = (arq, hz) => {
  mkdirSync(dirname(arq), { recursive: true });
  execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-y', '-f', 'lavfi', '-i', `sine=f=${hz}:d=0.3`, arq]);
};

const PACOTES = {
  // o pacote misto, com os nomes de pasta em maiúscula, espaço e acento, contra o disco em minúscula e hífen
  misto: { raiz: 'misto/preset', pastas: { som: 'EFEITOS SONOROS', '3d': 'Animações 3D' }, licenca: 'pacote misto, uso pessoal', clara: false },
  efeitos: { raiz: 'efeitos/sfx', pastas: { som: '.' }, licenca: 'licença comercial do pacote efeitos', clara: true },
  musicas: { raiz: 'musicas', pastas: { musica: '.' }, licenca: 'licença comercial do pacote musicas', clara: true },
};
const escreveConf = (pacotes = PACOTES, raiz = material) => writeFileSync(conf, JSON.stringify({ raiz, pacotes }));

before(() => {
  som(join(material, 'misto', 'preset', 'efeitos-sonoros', 'woosh', 'whoosh-longo.wav'), 440);
  mkdirSync(join(material, 'misto', 'preset', 'animacoes-3d'), { recursive: true });
  execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=red:s=64x64:d=0.2', join(material, 'misto', 'preset', 'animacoes-3d', 'globo.mp4')]);
  som(join(material, 'efeitos', 'sfx', 'transicao', 'woosh-grave.wav'), 220);
  som(join(material, 'efeitos', 'sfx', 'botao', 'clique-1.wav'), 1200);
  mkdirSync(indices, { recursive: true });
  escreveConf();
});

function py(args, env = {}) {
  return spawnSync(PY, ['-I', ATIVOS, ...args, '--indices', indices], {
    encoding: 'utf8', env: { ...process.env, VIDEO_MATERIAL: '', VIDEO_MATERIAL_CONFIG: conf, ...env },
  });
}

test('sem pacote declarado, a busca não acha nada e não quebra', () => {
  const r = py(['buscar', 'woosh'], { VIDEO_MATERIAL_CONFIG: join(tmp, 'nao-existe.json') });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), '');
  const o = spawnSync(PY, ['-I', ATIVOS, 'onde'], { encoding: 'utf8', env: { ...process.env, VIDEO_MATERIAL: '', VIDEO_MATERIAL_CONFIG: join(tmp, 'nao-existe.json') } });
  assert.deepEqual(JSON.parse(o.stdout).pacotes, {});
});

test('o índice do pacote grava o caminho relativo e a licença do material.local.json', () => {
  const r = py(['indice', '--pacote', 'efeitos']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const dados = JSON.parse(readFileSync(join(indices, 'efeitos.json'), 'utf8'));
  assert.equal(dados.pacote, 'efeitos');
  assert.equal(dados.licenca, 'licença comercial do pacote efeitos');
  assert.equal(dados.clara, true);
  assert.deepEqual(dados.itens.map((i) => i.caminho).sort(), ['botao/clique-1.wav', 'transicao/woosh-grave.wav']);
  assert.ok(dados.itens.every((i) => i.tipo === 'som' && typeof i.pico_s === 'number'));
  // a origem do som sem banco no nome é o próprio pacote
  assert.deepEqual([...new Set(dados.itens.map((i) => i.origem))], ['efeitos']);
});

test('a pasta do tipo se acha sem diferença de caixa, acento ou espaço', () => {
  const r = py(['indice', '--pacote', 'misto']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const dados = JSON.parse(readFileSync(join(indices, 'misto.json'), 'utf8'));
  assert.deepEqual(dados.itens.map((i) => i.caminho).sort(), ['animacoes-3d/globo.mp4', 'efeitos-sonoros/woosh/whoosh-longo.wav']);
});

test('a música do pacote entra como música', () => {
  som(join(material, 'musicas', 'SUAVES', 'faixa-calma.wav'), 330);
  const r = py(['indice', '--pacote', 'musicas']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const dados = JSON.parse(readFileSync(join(indices, 'musicas.json'), 'utf8'));
  assert.deepEqual(dados.itens.map((i) => [i.tipo, i.caminho, i.fora ?? null]), [['musica', 'SUAVES/faixa-calma.wav', null]]);
});

test('a raiz errada não grava e não apaga o índice que existe', () => {
  const antes = readFileSync(join(indices, 'efeitos.json'), 'utf8');
  const vazio = join(tmp, 'vazio');
  mkdirSync(join(vazio, 'efeitos', 'sfx'), { recursive: true });
  const r = py(['indice', '--pacote', 'efeitos'], { VIDEO_MATERIAL: vazio });
  assert.notEqual(r.status, 0, r.stdout);
  assert.match(r.stdout + r.stderr, /vazio|nenhum/);
  assert.equal(readFileSync(join(indices, 'efeitos.json'), 'utf8'), antes);
});

test('a busca junta os pacotes e diz a licença de cada um', () => {
  const r = py(['buscar', 'woosh']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /efeitos\s.*transicao\/woosh-grave\.wav.*\[licença clara: licença comercial do pacote efeitos/);
  assert.match(r.stdout, /misto\s.*whoosh-longo\.wav.*\[só no orgânico: pacote misto/);
});

test('a busca acha o índice gravado mesmo sem o pacote declarado nesta máquina', () => {
  const r = py(['buscar', 'woosh'], { VIDEO_MATERIAL_CONFIG: join(tmp, 'nao-existe.json') });
  assert.match(r.stdout, /efeitos\s.*woosh-grave\.wav.*\[licença clara/);
});

test('o anotar regrava a licença do pacote pela fonte única', () => {
  const arq = join(indices, 'efeitos.json');
  const dados = JSON.parse(readFileSync(arq, 'utf8'));
  dados.licenca = 'velha'; dados.clara = false;
  writeFileSync(arq, JSON.stringify(dados));
  const r = py(['anotar']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const depois = JSON.parse(readFileSync(arq, 'utf8'));
  assert.equal(depois.licenca, 'licença comercial do pacote efeitos');
  assert.equal(depois.clara, true);
});

test('o trazer no anúncio avisa o pacote sem licença clara e cala o de licença clara', () => {
  const peca = join(tmp, 'peca-anuncio');
  const turvo = py(['trazer', 'misto:efeitos-sonoros/woosh/whoosh-longo.wav', peca, '--uso', 'anuncio']);
  assert.equal(turvo.status, 0, turvo.stdout + turvo.stderr);
  assert.match(turvo.stderr, /aviso: .*misto/);
  const claro = py(['trazer', 'efeitos:botao/clique-1.wav', peca, '--uso', 'anuncio']);
  assert.equal(claro.status, 0, claro.stdout + claro.stderr);
  assert.doesNotMatch(claro.stdout + claro.stderr, /aviso/);
});

test('o trazer de pacote não declarado diz como configurar', () => {
  const peca = join(tmp, 'peca');
  const r = py(['trazer', 'outro:transicao/woosh-grave.wav', peca]);
  assert.notEqual(r.status, 0);
  assert.match(r.stdout + r.stderr, /material\.local\.json/);
  assert.ok(!existsSync(join(peca, 'ativos', 'woosh-grave.wav')));
});

test('o trazer sem o pacote no nome reprova', () => {
  const r = py(['trazer', 'transicao/woosh-grave.wav', join(tmp, 'peca3')]);
  assert.notEqual(r.status, 0);
  assert.match(r.stdout + r.stderr, /pacote/);
});

test('o trazer com a pasta copia o som da peça em WAV', () => {
  const peca = join(tmp, 'peca2');
  const r = py(['trazer', 'efeitos:transicao/woosh-grave.wav', peca]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(existsSync(join(peca, 'ativos', 'woosh-grave.wav')));
  assert.match(r.stdout, /"pacote": "efeitos"/);
});

test('o onde lista os pacotes declarados e se a pasta de cada um existe', () => {
  const r = spawnSync(PY, ['-I', ATIVOS, 'onde'], { encoding: 'utf8', env: { ...process.env, VIDEO_MATERIAL: '', VIDEO_MATERIAL_CONFIG: conf } });
  const onde = JSON.parse(r.stdout);
  assert.equal(onde.existe, true);
  assert.deepEqual(Object.keys(onde.pacotes).sort(), ['efeitos', 'misto', 'musicas']);
  assert.ok(Object.values(onde.pacotes).every((p) => p.existe));
});

// o pacote com emoji, imagem e 3D, para a trava do clip-art (o nome decide, no índice e fora dele)
test('o clip-art fica fora no emoji e na imagem, e o 3D entra inteiro, até com nome de clip-art', () => {
  const vis = join(material, 'visual');
  mkdirSync(join(vis, 'Emojis'), { recursive: true });
  mkdirSync(join(vis, 'Imagens'), { recursive: true });
  mkdirSync(join(vis, 'Animações 3D'), { recursive: true });
  for (const arq of ['Emojis/foguete.png', 'Emojis/sorriso.png', 'Imagens/trofeu.png', 'Imagens/nuvem.png']) writeFileSync(join(vis, arq), 'png');
  execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=red:s=64x64:d=0.2', join(vis, 'Animações 3D', 'Shield_In.mov')]);
  escreveConf({ ...PACOTES, visual: { raiz: 'visual', pastas: { emoji: 'Emojis', imagem: 'Imagens', '3d': 'Animações 3D' }, licenca: 'pacote visual, uso pessoal', clara: false } });
  try {
    const r = py(['indice', '--pacote', 'visual']);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const itens = Object.fromEntries(JSON.parse(readFileSync(join(indices, 'visual.json'), 'utf8')).itens.map((i) => [i.caminho, i.fora ?? null]));
    assert.match(itens['Emojis/foguete.png'], /clip-art/);
    assert.match(itens['Imagens/trofeu.png'], /clip-art/);
    assert.equal(itens['Imagens/nuvem.png'], null);
    assert.equal(itens['Animações 3D/Shield_In.mov'], null);
    // o trazer reprova o clip-art, e o 3D com nome de escudo passa
    const peca = join(tmp, 'peca-visual');
    const fora = py(['trazer', 'visual:Imagens/trofeu.png', peca]);
    assert.notEqual(fora.status, 0);
    assert.match(fora.stdout + fora.stderr, /clip-art/);
    const d3 = py(['trazer', 'visual:Animações 3D/Shield_In.mov', peca, '--uso', 'anuncio']);
    assert.equal(d3.status, 0, d3.stdout + d3.stderr);
    assert.ok(existsSync(join(peca, 'ativos', 'shield_in.webm')));
    // o 3D de licença turva no anúncio ganha o aviso, como o som
    assert.match(d3.stderr, /aviso: .*visual.*o som e o 3D, fica no orgânico/);
  } finally { escreveConf(); }
});

test('o emoji fora do índice também passa pela trava do clip-art no trazer', () => {
  const vis = join(material, 'visual');
  writeFileSync(join(vis, 'Emojis', 'lampada-nova.png'), 'png');
  escreveConf({ ...PACOTES, visual: { raiz: 'visual', pastas: { emoji: 'Emojis', imagem: 'Imagens' }, licenca: 'pacote visual', clara: false } });
  try {
    const r = py(['trazer', 'visual:Emojis/lampada-nova.png', join(tmp, 'peca-lampada')], { });
    assert.notEqual(r.status, 0);
    assert.match(r.stdout + r.stderr, /clip-art/);
  } finally { escreveConf(); }
});

test('o kit é pacote embutido: trazer kit: lê do material da skill, de licença clara, sem declarar nada', () => {
  const mat = join(tmp, 'material-do-kit');
  som(join(mat, 'som', 'tecla-1.wav'), 900);
  const peca = join(tmp, 'peca-kit');
  const r = py(['trazer', 'kit:tecla-1.wav', peca, '--uso', 'cliente'], { MOGRAPH_MATERIAL: mat, VIDEO_MATERIAL_CONFIG: join(tmp, 'nao-existe.json') });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.doesNotMatch(r.stderr, /aviso/);
  assert.ok(existsSync(join(peca, 'ativos', 'tecla-1.wav')));
  assert.match(r.stdout, /"pacote": "kit"/);
  const o = JSON.parse(spawnSync(PY, ['-I', ATIVOS, 'onde'], { encoding: 'utf8', env: { ...process.env, VIDEO_MATERIAL: '', VIDEO_MATERIAL_CONFIG: conf, MOGRAPH_MATERIAL: mat } }).stdout);
  assert.deepEqual(o.kit, { pasta: mat, existe: true });
  assert.ok(!('kit' in o.pacotes), 'o kit não conta como pacote da pessoa');
});

test('sem o material do kit instalado, o trazer kit: manda rodar o /instalar', () => {
  const r = py(['trazer', 'kit:tecla-1.wav', join(tmp, 'peca-sem-kit')], { MOGRAPH_MATERIAL: join(tmp, 'sem-material') });
  assert.notEqual(r.status, 0);
  assert.match(r.stdout + r.stderr, /o material do kit não está instalado.*rode \/instalar/);
});
