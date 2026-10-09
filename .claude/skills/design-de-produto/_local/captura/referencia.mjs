// A referência de uma captura: o perfil público do X que a pessoa escolheu acompanhar. Cada uma tem
// uma entrada em _local/cobertura.json -> referencias, pela chave do @ sem a arroba:
//
//   "referencias": { "<handle>": { "nome": "<como chamar>", "triado_ate": "<ISO>", "ate": "<ISO>" | null } }
//
// `prepara.mjs --nova --ref <handle>` grava o handle em <pasta>/referencia.json; daí em diante todo
// script da captura acha a referência pela pasta (ou por --ref <handle>, no ensaio e no teste). O
// handle dos trechos de navegador, a janela e o cabeçalho das fontes saem daqui, e de nenhum outro
// lugar: nenhum script tem handle escrito à mão.

import fs from 'node:fs';
import path from 'node:path';

export const ARQ_REF = 'referencia.json';
export const RE_HANDLE = /^[A-Za-z0-9_]{1,15}$/;

// o cobertura.json da pasta _local/ dada
export const lerCobertura = (dirLocal) => JSON.parse(fs.readFileSync(path.join(dirLocal, 'cobertura.json'), 'utf8'));

// o handle da captura: --ref <handle> no argv; senão o <pasta>/referencia.json; senão null
export function handleDaCaptura(pasta, argv = process.argv) {
  const i = argv.indexOf('--ref');
  if (i > -1) return argv[i + 1] || null;
  const p = pasta ? path.join(pasta, ARQ_REF) : null;
  if (p && fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')).handle || null;
  return null;
}

// grava a referência na pasta da captura (prepara.mjs --nova)
export const gravaReferencia = (pasta, handle) => fs.writeFileSync(path.join(pasta, ARQ_REF), JSON.stringify({ handle }, null, 1) + '\n');

// a entrada da referência no cobertura.json, com o handle na grafia de lá; sem ela, sai 1 dizendo o que fazer
export function referencia(cobertura, handle) {
  const refs = (cobertura && cobertura.referencias) || {};
  if (!handle) { console.log('falta a referência: rode `prepara.mjs --nova --ref <handle>` (ou passe --ref <handle>)'); process.exit(1); }
  const chave = Object.keys(refs).find((k) => k.toLowerCase() === String(handle).replace(/^@/, '').toLowerCase());
  if (!chave) { console.log(`@${handle} não está em _local/cobertura.json -> referencias: acrescente a entrada antes de capturar (atualizar.md, passo 2)`); process.exit(1); }
  return { handle: chave, ...refs[chave] };
}
