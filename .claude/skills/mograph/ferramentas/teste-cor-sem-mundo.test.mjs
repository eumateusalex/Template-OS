// A régua `cor` sem imagem do mundo: o plano que declara `ativos` só de captura e efeito (ou vazio) não tem
// o que apagar, e a régua diz "não se aplica" com a razão em vez do aviso que sempre aparece. Com uma foto,
// um vídeo, um gerado, o kit, um material ou um produto, ou sem o campo `ativos`, mede como sempre.
//
//   node --test .claude/skills/mograph/ferramentas/teste-cor-sem-mundo.test.mjs
//
// Pede o ffmpeg do PATH.
// mutação: .claude/skills/mograph/ferramentas/cor.mjs · "const SEM_MUNDO = ['captura', 'efeito'];" → "const SEM_MUNDO = ['captura'];" · pega
// mutação: .claude/skills/mograph/ferramentas/cor.mjs · "if (!Array.isArray(ativos)) return null;" → "if (!Array.isArray(ativos)) return 'x';" · pega
// mutação: .claude/skills/mograph/ferramentas/cor.mjs · "  if (!ativos.every((a) => SEM_MUNDO.includes(a?.origem))) return null;" → "  if (ativos.some((a) => a?.origem && !SEM_MUNDO.includes(a.origem) && a.origem !== 'fto')) return null;" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-direcao.mjs · "      const mp4 = cmd === 'cor' && !arg('mp4') ? pasta : arg('mp4');" → "      const mp4 = cmd === 'cor' ? pasta : arg('mp4');" · pega
// mutação: .claude/skills/mograph/ferramentas/regua-direcao.mjs · "      const planoDaCor = plano || (existsSync(join(dirname(resolve(mp4)), 'plano.json')) ? JSON.parse(readFileSync(join(dirname(resolve(mp4)), 'plano.json'), 'utf8')) : null);" → "      const planoDaCor = (existsSync(join(dirname(resolve(mp4)), 'plano.json')) ? JSON.parse(readFileSync(join(dirname(resolve(mp4)), 'plano.json'), 'utf8')) : null);" · pega
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { semMundo } from './cor.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const tmp = mkdtempSync(join(tmpdir(), 'cor-sem-mundo-'));
const cinza = join(tmp, 'cinza.mp4');

before(() => {
  execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=s=540x960:d=4:r=30', '-vf', 'hue=s=0.03,noise=alls=12:allf=t', '-pix_fmt', 'yuv420p', cinza]);
});

test('semMundo: a razão só quando o plano declara ativos e nenhum é imagem do mundo', () => {
  assert.equal(semMundo(null), null, 'sem plano');
  assert.equal(semMundo(undefined), null, 'sem plano');
  assert.equal(semMundo({ cenas: [] }), null, 'sem o campo ativos');
  assert.match(semMundo({ ativos: [] }), /ativos vazio/);
  assert.match(semMundo({ ativos: [{ arquivo: 'x.png', origem: 'captura' }, { arquivo: 'y.png', origem: 'efeito' }] }), /só captura e efeito/);
  for (const origem of ['foto', 'video', 'gerado', 'kit', 'material', 'produto']) {
    assert.equal(semMundo({ ativos: [{ arquivo: 'x.png', origem: 'captura' }, { arquivo: 'f.png', origem }] }), null, origem);
  }
  // a origem que falta ou que não existe (um erro de digitação) não prova que não há mundo: mede
  assert.equal(semMundo({ ativos: [{ arquivo: 'x.png', origem: 'captura' }, { arquivo: 'f.png' }] }), null, 'sem origem');
  assert.equal(semMundo({ ativos: [{ arquivo: 'x.png', origem: 'captura' }, { arquivo: 'f.png', origem: 'fto' }] }), null, 'origem fora da lista');
});

// o caminho da peça (o `tudo <pasta> --mp4 <render>`, aqui pela régua cor sozinha na mesma forma): o plano na
// pasta e o render numa subpasta sem plano
function reguaPelaPasta(plano) {
  const pasta = mkdtempSync(join(tmp, 'peca-tudo-'));
  mkdirSync(join(pasta, 'render'));
  copyFileSync(cinza, join(pasta, 'render', 'peca.mp4'));
  writeFileSync(join(pasta, 'plano.json'), JSON.stringify(plano));
  const r = spawnSync('node', [join(AQUI, 'regua-direcao.mjs'), 'cor', pasta, '--mp4', join(pasta, 'render', 'peca.mp4')], { encoding: 'utf8' });
  return r.stdout + r.stderr;
}

test('a régua cor pela pasta: o plano da pasta vale para o render da subpasta', () => {
  const s = reguaPelaPasta({ cenas: [], ativos: [{ arquivo: 'x.png', origem: 'captura' }] });
  assert.match(s, /cor: não se aplica \(nenhum ativo é imagem do mundo/);
  assert.doesNotMatch(s, /apagado/);
  // e com uma foto no plano da pasta, mede
  assert.match(reguaPelaPasta({ cenas: [], ativos: [{ arquivo: 'f.jpg', origem: 'foto' }] }), /apagado/);
});

// a régua pela linha de comando, com o plano.json ao lado do mp4
function regua(ativos, comoPlano = (a) => ({ ativos: a })) {
  const pasta = mkdtempSync(join(tmp, 'peca-'));
  copyFileSync(cinza, join(pasta, 'peca.mp4'));
  writeFileSync(join(pasta, 'plano.json'), JSON.stringify(comoPlano(ativos)));
  const r = spawnSync('node', [join(AQUI, 'regua-direcao.mjs'), 'cor', join(pasta, 'peca.mp4')], { encoding: 'utf8' });
  return r.stdout + r.stderr;
}

test('a régua cor: ativos só de captura não se aplica, e não diz apagado', () => {
  const s = regua([{ arquivo: 'x.png', origem: 'captura' }]);
  assert.match(s, /cor: não se aplica \(nenhum ativo é imagem do mundo/);
  assert.doesNotMatch(s, /apagado/);
});

test('a régua cor: ativos vazio não se aplica', () => {
  const s = regua([]);
  assert.match(s, /cor: não se aplica \(o plano não carrega imagem/);
  assert.doesNotMatch(s, /apagado/);
});

test('a régua cor: com uma foto, mede como sempre e avisa o apagado', () => {
  const s = regua([{ arquivo: 'x.png', origem: 'captura' }, { arquivo: 'f.jpg', origem: 'foto' }]);
  assert.match(s, /apagado/);
  assert.doesNotMatch(s, /não se aplica/);
});

test('a régua cor: sem o campo ativos, mede como sempre', () => {
  assert.match(regua(null, () => ({ cenas: [] })), /apagado/);
});

test('a régua cor: sem plano na pasta, mede como sempre', () => {
  const pasta = mkdtempSync(join(tmp, 'sem-plano-'));
  copyFileSync(cinza, join(pasta, 'peca.mp4'));
  const r = spawnSync('node', [join(AQUI, 'regua-direcao.mjs'), 'cor', join(pasta, 'peca.mp4')], { encoding: 'utf8' });
  assert.match(r.stdout, /apagado/);
});
