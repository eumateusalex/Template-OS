// Prova que o confere-biblioteca.mjs sabe reprovar: copia a skill para uma pasta temporária, confere
// que a cópia limpa passa, planta um defeito por vez, confere que a verificação CERTA falhou e desfaz.
//
// Uso: node .claude/skills/design-de-produto/scripts/teste-confere-biblioteca.mjs

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.resolve(AQUI, '..');
const COPIA = fs.mkdtempSync(path.join(os.tmpdir(), 'confere-biblioteca-'));
fs.cpSync(SKILL, COPIA, { recursive: true });
const C = (...p) => path.join(COPIA, ...p);

const CONFERE = path.join(AQUI, 'confere-biblioteca.mjs');
const roda = () => {
  const env = { ...process.env }; delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, [CONFERE, '--raiz', COPIA], { encoding: 'utf8', env });
  return { codigo: r.status, saida: r.stdout + r.stderr };
};

// guarda e desfaz
const guardados = new Map(); const criados = [];
const edita = (rel, fn) => { const p = C(rel); if (!guardados.has(p)) guardados.set(p, fs.readFileSync(p)); fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8'))); };
const cria = (rel, conteudo) => {
  const p = C(rel);
  // pasta que não existia também sai no desfaz (senão contamina o caso seguinte)
  let d = path.dirname(p); const novas = [];
  while (!fs.existsSync(d)) { novas.push(d); d = path.dirname(d); }
  fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, conteudo);
  criados.push(...novas.reverse(), p);
};
const apaga = (rel) => { const p = C(rel); guardados.set(p, fs.readFileSync(p)); fs.rmSync(p); };
const desfaz = () => { for (const [p, b] of guardados) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, b); } guardados.clear(); while (criados.length) fs.rmSync(criados.pop(), { force: true, recursive: true }); };

const umaImagem = () => { const g = JSON.parse(fs.readFileSync(C('_local', 'galeria.json'), 'utf8')); return Object.keys(g).find((k) => k.startsWith('06-produtos/') && k.endsWith('.jpg')); };
const JPG = fs.readFileSync(C('biblioteca', 'galeria', umaImagem()));
const PNG = Buffer.from('89504e470d0a1a0a', 'hex');
const FICHAS = 'toda ficha está num índice e todo link do índice aponta ficha que existe';
const UMA = 'uma imagem, uma pasta; imagem só na galeria; extensão igual ao conteúdo em toda a skill';

const casos = [
  ['link relativo quebrado', 'todo link relativo dos .md resolve', () => edita('biblioteca/README.md', (t) => t + '\n[sumiu](09-do-generico-ao-produto/nao-existe.md)\n')],
  ['imagem citada que não existe', 'todo caminho de imagem da galeria citado existe', () => edita('biblioteca/06-produtos/recuperacao-de-garantia.md', (t) => t + '\n![x](../galeria/06-produtos/tela-que-nao-existe.jpg)\n')],
  ['caminho _local que não existe', 'todo caminho _local citado existe', () => edita('biblioteca/06-produtos/contratacao-de-tecnicos.md', (t) => t + '\n`_local/pasta-que-nao-existe.md`\n')],
  ['contagem de fichas errada', 'as contagens declaradas batem com o disco', () => edita('biblioteca/README.md', (t) => t.replace(/\((\d+) fichas\)/, (m, n) => `(${Number(n) + 1} fichas)`))],
  ['total do banco de frases errado', 'as contagens declaradas batem com o disco', () => edita('biblioteca/07-microcopy/banco-de-frases.md', (t) => t.replace(/\*\*Total: (\d+) exemplos\.\*\*/, (m, n) => `**Total: ${Number(n) - 1} exemplos.**`))],
  ['contagem de imagens da galeria errada', 'as contagens declaradas batem com o disco', () => edita('biblioteca/README.md', (t) => t.replace(/\((\d+) imagens\)/, (m, n) => `(${Number(n) + 3} imagens)`))],
  ['arquétipos errados no SKILL.md', 'as contagens declaradas batem com o disco', () => edita('SKILL.md', (t) => t.replace(/\((\d+) arquétipos/, '(10 arquétipos'))],
  ['imagem na galeria fora do índice', 'toda imagem da galeria está no índice e toda entrada do índice existe', () => cria('biblioteca/galeria/06-produtos/tela-sem-indice-produto.jpg', JPG)],
  ['entrada do índice sem arquivo', 'toda imagem da galeria está no índice e toda entrada do índice existe', () => apaga(path.join('biblioteca', 'galeria', umaImagem()))],
  ['INDICE.md editado à mão', 'índice em dia; imagem que nenhum .md cita tem a seção que ilustra', () => edita('biblioteca/galeria/INDICE.md', (t) => t.replace('| Arquivo | O que mostra |', '| Arquivo | O que aparece |'))],
  ['imagem que ninguém cita sem a seção', 'índice em dia; imagem que nenhum .md cita tem a seção que ilustra', () => {
    cria('biblioteca/galeria/07-microcopy/frase-solta-produto.jpg', JPG);
    edita('_local/galeria.json', (t) => t.replace(/^\{/, '{\n "07-microcopy/frase-solta-produto.jpg": {"mostra": "uma frase solta que ninguém cita em lugar nenhum"},'));
    edita('biblioteca/galeria/INDICE.md', (t) => t + '\n| [`frase-solta-produto.jpg`](07-microcopy/frase-solta-produto.jpg) | uma frase solta | ninguém |\n');
  }],
  ['nome com id numérico', 'nome de imagem diz o que ela mostra', () => { cria('biblioteca/galeria/06-produtos/tela-1234567890.jpg', JPG); }],
  ['nome img_', 'nome de imagem diz o que ela mostra', () => { cria('biblioteca/galeria/06-produtos/img_0042.jpg', JPG); }],
  ['nome só número', 'nome de imagem diz o que ela mostra', () => { cria('biblioteca/galeria/06-produtos/0042-1.jpg', JPG); }],
  ['PNG com extensão .jpg', 'nome de imagem diz o que ela mostra', () => { cria('biblioteca/galeria/06-produtos/tela-falsa-produto.jpg', Buffer.concat([PNG, Buffer.alloc(32)])); }],
  ['a mesma imagem em duas pastas', UMA, () => {
    const a = umaImagem(); const b = '04-tipos-de-tela/' + path.basename(a);
    cria('biblioteca/galeria/' + b, fs.readFileSync(C('biblioteca', 'galeria', a)));
    edita('_local/galeria.json', (t) => t.replace(/^\{/, `{\n "${b}": {"mostra": "cópia da mesma imagem em outra pasta da galeria"},`));
    edita('biblioteca/04-tipos-de-tela/README.md', (t) => t + `\n![copia](../galeria/${b})\n`);
  }],
  ['imagem dentro de _local', UMA, () => cria('_local/tela-solta.jpg', JPG)],
  ['PNG com .jpg fora da galeria', UMA, () => cria('biblioteca/exemplo-de-tela/print-falso.jpg', Buffer.concat([PNG, Buffer.alloc(32)]))],
  ['índice que aponta ficha que não existe', FICHAS, () => edita('biblioteca/06-produtos/README.md', (t) => t.replace(/^(\| 9 \|[^\n]*\]\()[a-z0-9-]+\.md(\) \|)$/m, '$1ficha-que-sumiu.md$2'))],
  ['linha do índice sem link de ficha', FICHAS, () => edita('biblioteca/06-produtos/README.md', (t) => t.replace(/^(\| 9 \|[^\n]*\| )\[[^\]]+\]\([a-z0-9-]+\.md\) \|$/m, '$1— |'))],
  ['ficha fora dos índices', FICHAS, () => cria('biblioteca/06-produtos/ficha-orfa.md', '# Ficha órfã\n')],
];

let ok = 0; const falhas = [];
const base = roda();
if (base.codigo !== 0) { console.log('A CÓPIA LIMPA NÃO PASSA:\n' + base.saida); fs.rmSync(COPIA, { recursive: true, force: true }); process.exit(1); }
for (const [nome, verificacao, planta] of casos) {
  planta();
  const r = roda();
  const linha = r.saida.split('\n').find((l) => l.includes(verificacao)) || '';
  const pegou = r.codigo === 1 && linha.startsWith('FALHOU');
  console.log(`${pegou ? 'reprovou' : 'PASSOU  '}  ${nome}  ->  ${pegou ? linha.replace(/\s+/g, ' ').slice(0, 170) : '(a verificação "' + verificacao + '" não falhou)'}`);
  if (pegou) ok++; else falhas.push(nome);
  desfaz();
}
const depois = roda();
fs.rmSync(COPIA, { recursive: true, force: true });
if (depois.codigo !== 0) { console.log('A CÓPIA NÃO VOLTOU AO LIMPO depois dos casos'); process.exit(1); }
console.log(falhas.length ? `\nFALHOU — ${falhas.length} defeito(s) passaram: ${falhas.join(', ')}` : `\nTUDO CERTO — ${casos.length} defeitos plantados, ${ok} reprovados pelo motivo certo`);
console.log(`# tests ${casos.length}\n# fail ${falhas.length}`);
process.exit(falhas.length ? 1 : 0);
