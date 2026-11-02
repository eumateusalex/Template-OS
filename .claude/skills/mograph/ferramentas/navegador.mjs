// O Chromium do Playwright do workspace, sem perfil (a régua não precisa de login e
// nunca usa um perfil logado). O Playwright mora em scripts/node_modules.
import { createRequire } from 'node:module';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

// a mensagem do que falta, ou null: a régua confere antes de abrir caso nenhum
export function faltaPlaywright(raiz = RAIZ) {
  try {
    createRequire(join(raiz, 'scripts', 'package.json')).resolve('playwright');
    return null;
  } catch {
    return '✗ falta o Playwright do workspace, que a régua usa no navegador: rode "npm --prefix scripts install" na raiz e repita';
  }
}

export async function abrirNavegador() {
  let chromium;
  try {
    ({ chromium } = createRequire(join(RAIZ, 'scripts', 'package.json'))('playwright'));
  } catch {
    throw new Error(`o Playwright não foi achado em ${join(RAIZ, 'scripts', 'node_modules')}: rode "npm --prefix scripts install" na raiz do workspace`);
  }
  return chromium.launch({ headless: true });
}
