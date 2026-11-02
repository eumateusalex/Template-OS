// A prancha de direções (oficio.md, "A prancha"): monta a página em que ele
// escolhe, vendo, a direção de uma peça.
//
//   node prancha.mjs <pasta-da-peça>/direcoes
//
// Cada direção é uma subpasta com a letra (A, B, C…), com o meta.json
// { nome, texto, critica, recomendada } e os quadros em PNG ou JPG, na ordem do
// nome (1-gancho.png, 2-prova.png, 3-fecho.png). De 3 a 5 direções, uma só
// recomendada. Sai direcoes/index.html, que abre no Chrome.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chamadoDireto } from './principal.mjs';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function montarPrancha(dir, { titulo = 'As direções' } = {}) {
  const letras = readdirSync(dir).filter((n) => /^[A-Z]$/.test(n) && statSync(join(dir, n)).isDirectory()).sort();
  if (letras.length < 3 || letras.length > 5) throw new Error(`a prancha tem ${letras.length} direções; são 3 a 5`);
  const dirs = letras.map((l) => {
    const arq = join(dir, l, 'meta.json');
    if (!existsSync(arq)) throw new Error(`a direção ${l} não tem meta.json`);
    const m = JSON.parse(readFileSync(arq, 'utf8'));
    for (const c of ['nome', 'texto', 'critica']) if (!String(m[c] || '').trim()) throw new Error(`a direção ${l} não tem "${c}" no meta.json`);
    const quadros = readdirSync(join(dir, l)).filter((n) => /\.(png|jpe?g)$/i.test(n)).sort();
    if (!quadros.length) throw new Error(`a direção ${l} não tem quadro renderizado`);
    return { letra: l, ...m, quadros };
  });
  const rec = dirs.filter((d) => d.recomendada === true);
  if (rec.length !== 1) throw new Error(`a prancha precisa de uma recomendada, e tem ${rec.length}`);
  const cartoes = dirs.map((d) => `
  <article class="direcao${d.recomendada ? ' rec' : ''}">
    <header><span class="letra">${esc(d.letra)}</span><h2>${esc(d.nome)}</h2>${d.recomendada ? '<span class="selo">recomendada</span>' : ''}</header>
    <div class="quadros">${d.quadros.map((q) => `<figure><img src="${esc(d.letra)}/${esc(q)}" alt="${esc(d.nome)}, ${esc(q)}"><figcaption>${esc(q.replace(/\.\w+$/, '').replace(/^\d+-/, ''))}</figcaption></figure>`).join('')}</div>
    <p>${esc(d.texto)}</p>
    <p class="critica"><b>minha crítica:</b> ${esc(d.critica)}</p>
  </article>`).join('\n');
  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titulo)}</title>
<style>
  * { box-sizing:border-box } body { margin:0; background:#fff; color:#111; font:15px/1.45 -apple-system, "Inter", system-ui, sans-serif }
  main { max-width:1400px; margin:0 auto; padding:24px 16px 64px } h1 { font-size:22px; margin:0 0 4px } .sub { color:#6e6e73; margin:0 0 24px }
  .grade { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 380px), 1fr)); gap:24px }
  .direcao { border:1px solid #e5e5e5; border-radius:18px; padding:16px; min-width:0 } .direcao.rec { border:2px solid #0071e3 }
  .direcao header { display:flex; align-items:center; gap:10px } .letra { font-weight:700; font-size:20px } h2 { font-size:17px; margin:0 }
  .selo { margin-left:auto; background:#0071e3; color:#fff; border-radius:980px; padding:3px 10px; font-size:12px }
  .quadros { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:8px; margin:12px 0 }
  figure { margin:0; min-width:0 } img { width:100%; aspect-ratio:9/16; object-fit:cover; border-radius:10px; background:#f5f5f7; display:block }
  figcaption { color:#6e6e73; font-size:12px; margin-top:4px } .critica { color:#3a3a3c }
</style></head><body><main>
<h1>${esc(titulo)}</h1><p class="sub">${dirs.length} direções para a mesma peça, nos mesmos instantes. Escolha a letra; pode misturar.</p>
<div class="grade">${cartoes}</div></main></body></html>
`;
  writeFileSync(join(dir, 'index.html'), html);
  return { direcoes: dirs.length, recomendada: rec[0].letra };
}

if (chamadoDireto(import.meta.url)) {
  const dir = process.argv[2];
  if (!dir) { console.error('uso: prancha.mjs <pasta-da-peça>/direcoes [--titulo "..."]'); process.exit(2); }
  const i = process.argv.indexOf('--titulo');
  try {
    const r = montarPrancha(resolve(dir), i > 0 ? { titulo: process.argv[i + 1] } : {});
    console.log(`prancha: ${join(resolve(dir), 'index.html')} (${r.direcoes} direções, recomendada ${r.recomendada})`);
  } catch (e) { console.error(`prancha recusada: ${e.message}`); process.exit(1); }
}
