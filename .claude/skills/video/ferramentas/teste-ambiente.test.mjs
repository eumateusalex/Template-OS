// A conferência do ambiente das skills de vídeo: num computador novo, o `ambiente.mjs` diz o que falta
// (programa, biblioteca Python, material do usuário, Playwright) e como resolver cada um.
//
//   node --test .claude/skills/video/ferramentas/teste-ambiente.test.mjs
//
// O caso "tudo presente" pede a máquina pronta: ffmpeg, o Python da mixagem (o MIXAGEM_PY, ou o python
// do PATH) e o npm ci de scripts/. Sem ela, ele pula dizendo o que falta, nunca passa em falso.
//
// mutação: .claude/skills/video/ferramentas/ambiente.mjs · "  for (const n of pastas.reverse()) {" → "  for (const n of pastas) {" · pega em 02/11/2026
// mutação: .claude/skills/video/ferramentas/ambiente.mjs · "    else if (dado) falta(`o navegador" → "    else if (dado) aviso(`o navegador" · pega em 02/11/2026
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODULOS_MIX, pacotesFixados, situacaoPython, remedioPython } from './ambiente.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const AMBIENTE = join(AQUI, 'ambiente.mjs');
const tmp = mkdtempSync(join(tmpdir(), 'ambiente-'));

// um material com um pacote declarado e a pasta dele
const material = join(tmp, 'material');
mkdirSync(join(material, 'efeitos'), { recursive: true });
const conf = join(tmp, 'material.local.json');
writeFileSync(conf, JSON.stringify({ raiz: material, pacotes: { efeitos: { raiz: 'efeitos', pastas: { som: '.' }, licenca: 'x', clara: true } } }));
const semConf = join(tmp, 'nada.json');

function roda(env = {}) {
  const r = spawnSync(process.execPath, [AMBIENTE], {
    encoding: 'utf8', env: { ...process.env, VIDEO_MATERIAL: '', VIDEO_MATERIAL_CONFIG: conf, ...env },
  });
  return { status: r.status, saida: r.stdout + r.stderr };
}

test('tudo presente sai 0 e diz que está pronto', (t) => {
  const { status, saida } = roda();
  const faltas = saida.split(/\r?\n/).filter((l) => l.startsWith('FALTA'));
  if (faltas.length) { t.skip(`a máquina não está pronta, o caso não rodou: ${faltas.join('; ')}`); return; }
  assert.equal(status, 0, saida);
  assert.match(saida, /pronto/i);
  assert.match(saida, /^ok o pacote efeitos/m);
});

test('o programa que falta sai com o comando de instalar e código 1', () => {
  const vazio = mkdtempSync(join(tmpdir(), 'sem-path-'));
  const { status, saida } = roda({ PATH: vazio, Path: vazio });
  assert.equal(status, 1, saida);
  assert.match(saida, /^FALTA ffmpeg/m);
  assert.match(saida, /winget install/);
  // sem o python, o material não se confere, e isso se diz (não medir não é passar)
  assert.match(saida, /^FALTA o material do usuário/m);
});

test('sem material declarado é aviso, não falta', () => {
  const { saida } = roda({ VIDEO_MATERIAL_CONFIG: semConf });
  assert.match(saida, /^aviso sem material próprio declarado/m);
  assert.match(saida, /material\.exemplo\.json/);
  assert.doesNotMatch(saida, /^FALTA .*material/m);
});

test('a raiz declarada que não existe nesta máquina sai com o passo de configurar', () => {
  const { status, saida } = roda({ VIDEO_MATERIAL: join(tmp, 'nao-existe') });
  assert.equal(status, 1, saida);
  assert.match(saida, /^FALTA a raiz de material/m);
  assert.match(saida, /material\.local\.json/);
});

test('o pacote que falta dentro da raiz é dito pelo nome, sem reprovar a máquina', () => {
  const so = join(tmp, 'so-raiz');
  mkdirSync(so, { recursive: true });
  const { saida } = roda({ VIDEO_MATERIAL: so });
  assert.match(saida, /^aviso o pacote efeitos não está em /m);
  assert.doesNotMatch(saida, /^FALTA .*efeitos/m);
});

// no Windows o Chrome que o HyperFrames baixa pode ser barrado, e o check falha com spawn UNKNOWN: o
// navegador do render é o headless shell do Playwright, pelo HYPERFRAMES_BROWSER_PATH (hyperframes.md)
test('no Windows, o navegador do render: sem a variável é aviso com o caminho exato a gravar; apontando para o que não existe, falta; para o que existe, ok', (t) => {
  if (process.platform !== 'win32') { t.skip('o caso é do Windows'); return; }
  const lpa = join(tmp, 'localappdata');
  const exeDe = (n) => {
    const p = join(lpa, 'ms-playwright', `chromium_headless_shell-${n}`, 'chrome-headless-shell-win64');
    mkdirSync(p, { recursive: true });
    writeFileSync(join(p, 'chrome-headless-shell.exe'), '');
    return join(p, 'chrome-headless-shell.exe');
  };
  exeDe(999);
  const novo = exeDe(1200);
  const sem = roda({ HYPERFRAMES_BROWSER_PATH: '', LOCALAPPDATA: lpa });
  assert.match(sem.saida, /^aviso o navegador do render/m);
  assert.ok(sem.saida.includes(`"HYPERFRAMES_BROWSER_PATH": "${novo.split('\\').join('/')}"`), `o mais novo (1200, não 999) com barra normal: ${sem.saida}`);
  assert.match(sem.saida, /"env" do \.claude\/settings\.local\.json/);
  const errado = roda({ HYPERFRAMES_BROWSER_PATH: join(tmp, 'nao-existe.exe'), LOCALAPPDATA: lpa });
  assert.equal(errado.status, 1, errado.saida);
  assert.match(errado.saida, /^FALTA o navegador do render/m);
  assert.match(roda({ HYPERFRAMES_BROWSER_PATH: novo, LOCALAPPDATA: lpa }).saida, /^ok o navegador do render/m);
  const nada = roda({ HYPERFRAMES_BROWSER_PATH: '', LOCALAPPDATA: join(tmp, 'lpa-vazio') });
  assert.match(nada.saida, /^aviso o navegador do render/m);
  assert.match(nada.saida, /playwright install chromium-headless-shell/);
});

// as réguas de tela da /mograph abrem o Chromium pelo Playwright de scripts/: num computador novo, sem
// o npm ci, elas quebram no meio; o ambiente diz antes
test('sem o Playwright de scripts/ sai com o comando de instalar e código 1', () => {
  const { status, saida } = roda({ VIDEO_SCRIPTS: join(tmp, 'scripts-vazio') });
  assert.equal(status, 1, saida);
  assert.match(saida, /^FALTA o Playwright de scripts/m);
  assert.match(saida, /npm --prefix ".*scripts-vazio" ci/);
});

test('o Python da mixagem que falta sai com os cinco pacotes fixados, não com o requirements inteiro', () => {
  const { status, saida } = roda({ MIXAGEM_PY: join(tmp, 'python-que-nao-existe') });
  assert.equal(status, 1, saida);
  assert.match(saida, /^FALTA o Python da mixagem/m);
  const linha = saida.split(/\r?\n/).find((l, i, ls) => ls[i - 1]?.startsWith('FALTA o Python da mixagem'));
  for (const p of MODULOS_MIX) assert.match(linha, new RegExp(`\\b${p}==\\d`), `${p} com versão fixada: ${linha}`);
  assert.doesNotMatch(linha, /-r scripts\/requirements\.txt/);
  assert.doesNotMatch(linha, /faster-whisper|nvidia/);
});

// o remédio roda no shell do Claude Code (o Git Bash) e no PowerShell, e a variável vale em todo comando
// seguinte: o caminho absoluto com barra normal, sem o & nem o $HOME que só um dos dois entende, e o
// MIXAGEM_PY gravado no "env" do .claude/settings.local.json (o export some no shell seguinte)
test('o remédio do Python da mixagem roda nos dois shells e grava o MIXAGEM_PY onde ele dura', () => {
  const py = `${homedir().split('\\').join('/')}/.mixagem/Scripts/python.exe`;
  for (const s of ['site-do-usuario', 'falta']) {
    const r = remedioPython(s, 'python', MODULOS_MIX);
    assert.doesNotMatch(r, /& "|\$HOME/, r);
    assert.ok(r.includes(`python -m venv "${py.replace('/Scripts/python.exe', '')}"`), r);
    assert.ok(r.includes(`"${py}" -m pip install`), r);
    assert.match(r, /"MIXAGEM_PY": "[^"]+python\.exe"/, r);
    assert.match(r, /"env" do \.claude\/settings\.local\.json/, r);
  }
});

// as versões vêm do requirements, não de uma cópia: a conta lê o arquivo
test('os pacotes da mixagem leem a versão do requirements', () => {
  const req = join(tmp, 'req.txt');
  writeFileSync(req, '# x\nnumpy==9.9.9\nscipy==1.0.0  # comentário\nfaster-whisper==1.0\n');
  assert.deepEqual(pacotesFixados(['numpy', 'scipy', 'soxr'], req), ['numpy==9.9.9', 'scipy==1.0.0', 'soxr']);
});

// as ferramentas rodam com -I; a conferência importa igual, e o pacote que só está no site do usuário
// (o -I não o enxerga, o pip diz "already satisfied") ganha um diagnóstico próprio
test('a conferência importa com -I, como as ferramentas', () => {
  const chamadas = [];
  const soSemI = (py, args) => { chamadas.push(args); return { status: args.includes('-I') ? 1 : 0 }; };
  assert.equal(situacaoPython('python', MODULOS_MIX, soSemI), 'site-do-usuario');
  assert.ok(chamadas[0].includes('-I'), 'a primeira importação é com -I');
  assert.equal(situacaoPython('python', MODULOS_MIX, () => ({ status: 0 })), 'ok');
  assert.equal(situacaoPython('python', MODULOS_MIX, (py, a) => ({ status: a[0] === '--version' ? 0 : 1 })), 'falta');
  assert.equal(situacaoPython('python', MODULOS_MIX, () => ({ status: 1 })), 'sem-python');
  const r = remedioPython('site-do-usuario', 'python', MODULOS_MIX);
  assert.match(r, /site-packages do usuário/);
  assert.match(r, /MIXAGEM_PY/);
  assert.doesNotMatch(r, /requirements\.txt/);
  for (const s of ['falta', 'sem-python']) {
    const f = remedioPython(s, 'python', MODULOS_MIX);
    assert.match(f, /pip install numpy==\d\S* scipy==\d\S* soundfile==\d\S* soxr==\d\S* pyloudnorm==\d/, f);
    assert.doesNotMatch(f, /-r scripts\/requirements\.txt/, f);
  }
});
