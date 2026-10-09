#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// linha-do-tempo · reescreve o rodapé de todo slide a partir da contagem
//
// Uso:
//   node .claude/skills/carrossel/render/linha-do-tempo.mjs carrosseis/<peça>/carrossel.html
//   node .claude/skills/carrossel/render/linha-do-tempo.mjs <html> --conferir
//
// Conta os `.slide` do arquivo (ignorando os que estão dentro de comentário
// HTML) e escreve, em cada um, o `.ftr` certo: um traço por slide, `.feito`
// nos que passaram, `.agora` no atual, o contador N/T, e a seta `.chev` em
// todos menos o último. Slide sem `.ftr` ganha um.
//
// Por que existe: escrever a linha à mão erra em silêncio. Traço a mais, aceso
// na posição errada, contador dizendo outra coisa: nada disso o olho pega
// conferindo JPEG. Quem monta gera; quem confere cobra (scripts/confere.mjs).
//
// `--conferir` não grava: sai 0 se o arquivo já está certo, 1 se precisaria
// mudar.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const conferir = args.includes('--conferir');
const arquivo = args.find((a) => !a.startsWith('--'));
if (!arquivo) {
  console.error('uso: node linha-do-tempo.mjs <carrossel.html> [--conferir]');
  process.exit(1);
}
const ABS = resolve(arquivo);
if (!existsSync(ABS)) {
  console.error(`arquivo não encontrado: ${ABS}`);
  process.exit(1);
}

const original = readFileSync(ABS, 'utf8');

// ─── comentários: o que está dentro deles não conta ────────────────────────

const comentarios = [...original.matchAll(/<!--[\s\S]*?-->/g)].map((m) => [m.index, m.index + m[0].length]);
const emComentario = (i) => comentarios.some(([a, b]) => i >= a && i < b);

// ─── os slides e o fechamento de cada um ───────────────────────────────────

const inicios = [...original.matchAll(/<div\s+class="slide\b[^"]*"/g)]
  .map((m) => m.index)
  .filter((i) => !emComentario(i));

if (!inicios.length) {
  console.error('nenhum .slide encontrado fora de comentário');
  process.exit(1);
}

/** Acha o índice do `</div>` que fecha o div aberto em `ini`, ignorando comentários. */
function fechamento(ini) {
  const re = /<div\b|<\/div>/g;
  re.lastIndex = ini + 1;
  let nivel = 1;
  let m;
  while ((m = re.exec(original)) !== null) {
    if (emComentario(m.index)) continue;
    nivel += m[0] === '<div' ? 1 : -1;
    if (nivel === 0) return m.index;
  }
  return -1;
}

function ftrDe(n, total) {
  const tracos = Array.from({ length: total }, (_, j) => `<i${j < n - 1 ? ' class="feito"' : j === n - 1 ? ' class="agora"' : ''}></i>`).join('');
  return `<div class="ftr"><div class="bar">${tracos}</div><span class="count">${n}/${total}</span>${n < total ? '<span class="chev">›</span>' : ''}</div>`;
}

const total = inicios.length;
const trocas = []; // [inicio, fim, textoNovo]

inicios.forEach((ini, idx) => {
  const fim = fechamento(ini);
  if (fim < 0) {
    console.error(`slide ${idx + 1}: não achei o </div> que fecha ele`);
    process.exit(1);
  }
  const bloco = original.slice(ini, fim);
  const novo = ftrDe(idx + 1, total);
  // o .ftr existente: <div class="ftr"> ... até o </div> que o fecha
  const reFtr = /<div\s+class="ftr">/g;
  let achou = null;
  let m;
  while ((m = reFtr.exec(bloco)) !== null) {
    const abs = ini + m.index;
    if (emComentario(abs)) continue;
    const fecha = fechamento(abs);
    if (fecha > 0) achou = [abs, fecha + '</div>'.length];
    break;
  }
  if (achou) trocas.push([achou[0], achou[1], novo]);
  else trocas.push([fim, fim, `  ${novo}\n`]); // sem .ftr: entra antes do fechamento
});

let texto = original;
for (const [a, b, novo] of trocas.sort((x, y) => y[0] - x[0])) {
  texto = texto.slice(0, a) + novo + texto.slice(b);
}

const mudou = texto !== original;
if (conferir) {
  console.log(mudou ? `${total} slide(s); a linha do tempo precisa ser reescrita` : `${total} slide(s); a linha do tempo está certa`);
  process.exit(mudou ? 1 : 0);
}
if (mudou) writeFileSync(ABS, texto);
console.log(`${total} slide(s); linha do tempo ${mudou ? 'reescrita' : 'já estava certa'} em ${arquivo}`);
