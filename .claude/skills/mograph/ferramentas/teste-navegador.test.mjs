// A conferência do Playwright do workspace (navegador.mjs): a raiz sem ele devolve a mensagem com o
// comando que instala, e a raiz com ele devolve nada. A suíte teste.mjs chama isto no começo e sai 2,
// sem caso nenhum, em vez de cair no meio com um erro de módulo.
//
//   node --test .claude/skills/mograph/ferramentas/teste-navegador.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { faltaPlaywright } from './navegador.mjs';

test('T032 a raiz sem o Playwright devolve a mensagem com o comando que instala', () => {
  const raiz = mkdtempSync(join(tmpdir(), 'navegador-'));
  const msg = faltaPlaywright(raiz);
  assert.equal(typeof msg, 'string');
  assert.match(msg, /npm --prefix scripts install/);
  assert.match(msg, /Playwright/);
});

test('T032 a raiz de verdade, onde o Playwright está instalado, devolve nada', () => {
  assert.equal(faltaPlaywright(), null);
});
