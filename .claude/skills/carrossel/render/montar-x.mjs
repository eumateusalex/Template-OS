#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// montar-x · monta uma peça estilo X inteira, na ordem certa, num comando só
//
//   1. a pasta tem gerar.js e legenda.txt
//   2. roda o gerar.js (que lê o <head> do x/modelo.html na hora)
//   3. confere a peça (render/conferir-x.js); erro para aqui, sem render
//   4. confere a legenda pela régua de scripts/lib/legenda.js
//   5. apaga os JPEGs velhos e renderiza (render/render-carrossel.js)
//   6. confere que saiu um JPEG por slide, em 2160×2700
//
// Uso:  node .claude/skills/carrossel/render/montar-x.mjs <pasta da peça> [--raiz <pasta>] [--handle @conta]
// Sai 0 pronto, 1 com problema na peça, 2 com problema de ambiente.
// A prova: render/teste-x.mjs.
// ═══════════════════════════════════════════════════════════════════════════

import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const AQUI = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { conferir } = require('./conferir-x.js');
const { achaRaiz } = require('./servidor.js');

const args = process.argv.slice(2);
const pega = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const posicional = args.find((a, i) => !a.startsWith('--') && !['--raiz', '--handle'].includes(args[i - 1]));

const falha = (msg, codigo = 1) => { console.error(`ERRO: ${msg}`); process.exit(codigo); };

if (!posicional) falha('uso: node render/montar-x.mjs <pasta da peça> [--raiz <pasta>] [--handle @conta]');
const PASTA = resolve(posicional);
if (!existsSync(PASTA)) falha(`a pasta não existe: ${PASTA}`);
const RAIZ = pega('--raiz') ? resolve(pega('--raiz')) : achaRaiz(PASTA);
if (!RAIZ) falha('nenhuma pasta de projeto (com .claude/) acima da peça: passe --raiz');

const GERAR = join(PASTA, 'gerar.js');
const LEGENDA = join(PASTA, 'legenda.txt');
const HTML = join(PASTA, 'carrossel.html');
const SAIDA = join(PASTA, 'instagram');

/** Roda um script node sem travar o laço (o render sobe servidor e navegador). */
const roda = (arquivo, argumentos) => new Promise((ok) => {
  const p = spawn(process.execPath, [arquivo, ...argumentos], { cwd: PASTA, stdio: 'inherit' });
  p.on('close', (code) => ok(code));
});

/** A régua da legenda: a do projeto, ou a que mora acima desta skill. */
function achaLegendaJs() {
  for (let d of [RAIZ, AQUI]) {
    for (;;) {
      const f = join(d, 'scripts', 'lib', 'legenda.js');
      if (existsSync(f)) return f;
      const acima = dirname(d);
      if (acima === d) break;
      d = acima;
    }
  }
  return null;
}

function dimensoesJpeg(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) return null;
    const m = buf[i + 1];
    const t = buf.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    i += 2 + t;
  }
  return null;
}

// 1 · o que a peça precisa ter
if (!existsSync(GERAR)) falha('a peça não tem gerar.js: copie o molde de x/modelo-gerar.js para a pasta e escreva os slides nele');
if (!existsSync(LEGENDA)) falha('a peça não tem legenda.txt: a pasta não está pronta sem a legenda');

// 2 · gerar
console.log('· gerar.js');
if (await roda(GERAR, []) !== 0) falha('o gerar.js falhou; a mensagem dele está acima');
if (!existsSync(HTML)) falha('o gerar.js não escreveu carrossel.html na pasta da peça');

// 3 · conferir a peça
console.log('· conferir');
let r;
try {
  r = await conferir(HTML, { raiz: RAIZ, handle: pega('--handle') });
} catch (e) {
  falha(e.message, e.codigo || 2);
}
for (const a of r.avisos) console.log(`  aviso  ${a}`);
for (const e of r.erros) console.log(`  ERRO   ${e}`);
if (r.erros.length) falha(`${r.erros.length} erro(s) na peça: não renderizei`);

// 4 · conferir a legenda
console.log('· legenda');
const legendaJs = achaLegendaJs();
if (!legendaJs) falha('não achei scripts/lib/legenda.js, a régua da legenda', 2);
const { confereLegenda } = require(legendaJs);
const leg = confereLegenda(readFileSync(LEGENDA, 'utf8'), { textoDosCards: r.textos.join('\n') });
for (const a of leg.avisos) console.log(`  aviso  legenda: ${a}`);
for (const e of leg.erros) console.log(`  ERRO   legenda: ${e}`);
if (leg.erros.length) falha(`${leg.erros.length} erro(s) na legenda: não renderizei`);

// 5 · renderizar, sem JPEG velho de uma versão mais longa da peça
if (existsSync(SAIDA)) {
  for (const a of readdirSync(SAIDA)) if (/^slide-\d+\.jpg$/.test(a)) rmSync(join(SAIDA, a));
}
console.log('· render');
const codigo = await roda(join(AQUI, 'render-carrossel.js'), [HTML, '--raiz', RAIZ]);
if (codigo !== 0) falha('o render falhou; a mensagem dele está acima', codigo === 2 ? 2 : 1);

// 6 · um JPEG por slide, no tamanho certo
const jpgs = existsSync(SAIDA) ? readdirSync(SAIDA).filter((a) => /^slide-\d+\.jpg$/.test(a)).sort() : [];
if (jpgs.length !== r.slides) falha(`saíram ${jpgs.length} JPEG(s) para ${r.slides} slide(s)`);
for (const j of jpgs) {
  const d = dimensoesJpeg(readFileSync(join(SAIDA, j)));
  if (!d || d.w !== 2160 || d.h !== 2700) falha(`${j} saiu em ${d ? `${d.w}×${d.h}` : 'tamanho ilegível'}, e o feed pede 2160×2700`);
}

console.log(`\npronto: ${jpgs.length} slide(s) em ${SAIDA}. Abra cada JPEG em tamanho real antes de mostrar.`);
