// Sincroniza os numeros do SKILL.md e do README.md com o estado real de references/.
//
// Grava sempre LF (nunca CRLF, nem no Windows) e roda no mesmo runtime do resto do kit.
//
// Rodar: node _local/numeros.mjs [--escreve|--check]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.resolve(AQUI, '..');
const REFS = path.join(SKILL, 'references');

const ESCREVE = process.argv.includes('--escreve');
const CHECK = process.argv.includes('--check');

const refs = fs.readdirSync(REFS).filter((f) => f.endsWith('.md'))
  .map((f) => ({ slug: f.replace('.md', ''), txt: fs.readFileSync(path.join(REFS, f), 'utf8') }));

const principios = refs.reduce((s, r) => s + (r.txt.match(/^## /gm) || []).length, 0);
const temas = refs.length;

const trocas = {
  'README.md': [
    [/\*\*\d+ princípios\*\*/g, `**${principios} princípios**`],
    [/^\d+ princípios numa linha cada/m, `${principios} princípios numa linha cada`],
  ],
  'SKILL.md': [
    [/\*\*\d+ princípios\*\*/g, `**${principios} princípios**`],
  ],
};

// a coluna numerica da tabela de temas do README, um slug por vez
for (const r of refs) {
  const n = (r.txt.match(/^## /gm) || []).length;
  trocas['README.md'].push([
    new RegExp(`(\\(references/${r.slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.md\\)[^|\\n]*\\|[ \\t]*)\\d+`),
    `$1${n}`,
  ]);
}

let mudou = 0;
const relatorio = [];
for (const [arq, lista] of Object.entries(trocas)) {
  const caminho = path.join(SKILL, arq);
  const antes = fs.readFileSync(caminho, 'utf8');
  // LF sempre, mesmo que o arquivo chegue com CRLF.
  const base = antes.replace(/\r\n/g, '\n');
  let depois = base;
  for (const [pat, sub] of lista) depois = depois.replace(pat, sub);
  if (depois !== antes) { mudou++; relatorio.push(arq); if (ESCREVE) fs.writeFileSync(caminho, depois, 'utf8'); }
}

console.log(`${principios} princípios, ${temas} temas`);

if (CHECK) {
  if (mudou === 0) { console.log('números em dia'); process.exit(0); }
  console.log(`DEFASADO em ${relatorio.join(', ')}. Rode: node _local/numeros.mjs --escreve`);
  process.exit(1);
}
if (ESCREVE) console.log(mudou ? `atualizado: ${relatorio.join(', ')}` : 'nada a mudar');
else console.log(mudou ? `mudaria: ${relatorio.join(', ')}` : 'nada a mudar');
