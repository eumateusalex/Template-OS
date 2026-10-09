// Gera o IMAGENS.md da raiz da skill: o catalogo de toda imagem guardada.
//
// Fonte de verdade, nesta ordem:
//   - _local/imagens.json (o que cada imagem mostra e, para a que nenhum principio cita, por que fica)
//   - as linhas **Visual.** dos principios (quem usa cada imagem)
//   - o disco: assets/<tema>/ (onde a imagem existe)
//
// O nome do arquivo diz o que a imagem mostra e a pasta e o tema.
//
// Rodar: node _local/catalogo.mjs [--escreve|--check]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerCatalogo } from './captura/imagens.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const S = path.resolve(AQUI, '..');
const DESTINO = path.join(S, 'IMAGENS.md');

const lista = (dir) => {
  const r = [];
  const anda = (d, pre) => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) anda(path.join(d, e.name), pre + e.name + '/'); else r.push(pre + e.name); } };
  anda(dir, '');
  return r;
};
const emAssets = new Set(lista(path.join(S, 'assets')));

// quem usa: principio -> imagem
const usos = new Map();
for (const f of fs.readdirSync(path.join(S, 'references')).filter((x) => x.endsWith('.md'))) {
  const tema = f.replace('.md', '');
  for (const b of fs.readFileSync(path.join(S, 'references', f), 'utf8').split(/\n(?=## )/).filter((x) => x.startsWith('## '))) {
    const titulo = b.split('\n')[0].slice(3).trim();
    for (const m of b.matchAll(/\.\.\/assets\/([a-z0-9-]+\/[a-z0-9-]+\.(?:jpg|png|webp))/g)) {
      if (!usos.has(m[1])) usos.set(m[1], []);
      if (!usos.get(m[1]).some((u) => u.titulo === titulo)) usos.get(m[1]).push({ tema, titulo });
    }
  }
}

// o que o catalogo de metadados diz de cada imagem, mais as que estao no disco sem entrada nele
// (aparecem com **no description**, e o verificador reprova)
const meta = lerCatalogo(AQUI);
const imgs = new Map([...new Set([...Object.keys(meta), ...emAssets])].sort().map((f) => [f, meta[f] || {}]));

const esc = (s) => String(s).replace(/\|/g, '\\|');
const porTema = new Map();
for (const [file, d] of imgs) {
  const tema = file.split('/')[0];
  if (!porTema.has(tema)) porTema.set(tema, []);
  porTema.get(tema).push([file, d]);
}

const L = [
  '# Image catalogue',
  '',
  '<!-- gerado por _local/catalogo.mjs a partir de _local/imagens.json e das linhas **Visual.**; não editar à mão -->',
  '',
  'Every image this skill keeps, one row each. The file name says what the image shows and the folder',
  'is the theme. Files live in `assets/<theme>/`.',
  '',
  '**Used by** names the principles whose `**Visual.**` line cites the image. An image no principle',
  'cites stays only with a reason, shown as *Illustrates*: treat those as an extra library of concrete',
  'examples.',
  '',
  `${imgs.size} images · ${[...imgs.keys()].filter((f) => usos.has(f)).length} cited by a principle`,
  '',
];
for (const [tema, linhas] of porTema) {
  L.push(`## ${tema} (${linhas.length})`, '', '| File | What it shows | Used by |', '|---|---|---|');
  for (const [file, d] of linhas) {
    const onde = emAssets.has(file) ? `[open](assets/${file})` : '**missing**';
    const uso = usos.has(file) ? usos.get(file).map((u) => `${u.titulo} (\`${u.tema}\`)`).join('<br>') : `*Illustrates \`${tema}\`:* ${d.why || '**no reason given**'}`;
    L.push(`| \`${file}\`<br>${onde} | ${esc(d.shows || '**no description**')} | ${esc(uso)} |`);
  }
  L.push('');
}
const novo = L.join('\n');

const atual = fs.existsSync(DESTINO) ? fs.readFileSync(DESTINO, 'utf8') : '';
if (process.argv.includes('--check')) {
  if (atual === novo) { console.log('IMAGENS.md em dia'); process.exit(0); }
  console.log('IMAGENS.md DEFASADO. Rode: node _local/catalogo.mjs --escreve'); process.exit(1);
}
console.log(`${imgs.size} imagens no catálogo`);
if (process.argv.includes('--escreve')) { fs.writeFileSync(DESTINO, novo, 'utf8'); console.log('gravado IMAGENS.md'); }
else console.log('simulacao. Rode com --escreve para gravar.');
