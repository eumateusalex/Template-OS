// O acesso à Vertex AI (scripts/lib/vertex.js): achar o gcloud e pedir o token em
// memória, com o erro dizendo o conserto.
//
// Nenhum teste fala com o Google: o gcloud e a busca no disco são falsos.
//
//   node --test scripts/lib/teste-vertex.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const V = require('./vertex.js');

// Isca: parece token da Vertex de propósito. Não é credencial.
const TOKEN = 'ya29.isca-de-teste-nao-e-credencial'; // gitleaks:allow

test('o GCLOUD_PATH vem primeiro na busca do gcloud', () => {
  const lista = V.gcloudCandidatos({ GCLOUD_PATH: 'C:\\falso\\gcloud.cmd', LOCALAPPDATA: 'C:\\x', PATH: '' }, 'win32');
  assert.equal(lista[0], 'C:\\falso\\gcloud.cmd');
});

test('no Windows, a pasta da instalação entra depois do PATH; fora dele, não entra', () => {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'teste-vertex-'));
  try {
    const gcloud = path.join(pasta, 'gcloud.cmd');
    fs.writeFileSync(gcloud, '');
    const win = V.gcloudCandidatos({ LOCALAPPDATA: 'C:\\x', PATH: pasta }, 'win32');
    assert.equal(win[0], gcloud);
    assert.ok(win.findIndex(p => /Cloud SDK/.test(p)) > 0);
  } finally {
    fs.rmSync(pasta, { recursive: true, force: true });
  }
  assert.deepEqual(V.gcloudCandidatos({ PATH: '' }, 'linux'), []);
});

test('o gcloud do PATH, com o nome que o sistema executa', () => {
  const pasta = path.join('pasta', 'bin');
  const achado = V.gcloudNoPath({ PATH: `outra${path.delimiter}${pasta}` }, 'win32', p => p === path.join(pasta, 'gcloud.cmd'));
  assert.equal(achado, path.join(pasta, 'gcloud.cmd'));
  assert.equal(V.gcloudNoPath({ PATH: pasta }, 'linux', p => p === path.join(pasta, 'gcloud.cmd')), null);
});

test('sem gcloud, o erro diz onde procurou e como instalar', () => {
  assert.throws(() => V.acharGcloud(['C:\\nao\\existe.cmd'], () => false), /GCLOUD_PATH.*PATH.*cloud\.google\.com\/sdk/s);
});

test('o token vem do gcloud, sem espaço sobrando', () => {
  assert.equal(V.tokenVertex({ gcloud: 'C:\\g.cmd', executar: () => `${TOKEN}\r\n` }), TOKEN);
});

test('gcloud que falha: o erro diz o comando de login', () => {
  const executar = () => { throw new Error('ERROR: (gcloud.auth.print-access-token) Reauthentication required.'); };
  assert.throws(() => V.tokenVertex({ gcloud: 'C:\\g.cmd', executar }), /auth login/);
});

test('gcloud que devolve vazio é erro, não token vazio', () => {
  assert.throws(() => V.tokenVertex({ gcloud: 'C:\\g.cmd', executar: () => '  \n' }), /token vazio.*auth login/);
});
