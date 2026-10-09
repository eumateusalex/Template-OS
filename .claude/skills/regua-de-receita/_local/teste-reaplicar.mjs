// Prova que reaplicar.mjs aplica as entradas locais e as reconstroi a partir do zero.
//
// O teste de idempotencia (--check numa skill ja reaplicada) e barato e nao prova nada
// sozinho: ele passa igual se o motor nao souber fazer NADA. O que prova de verdade e o
// caminho inverso -- destruir a adicao local e exigir que o motor a devolva byte a byte.
//
// A skill pode ter zero entradas locais (references/ e a base inteira), entao a suite PLANTA as
// suas numa copia: dois principios novos no mesmo tema e um enriquecimento de um bloco de outro
// tema. Nada aqui toca a skill de verdade.
//
// Rodar: node _local/teste-reaplicar.mjs

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.resolve(AQUI, '..');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'regua-reap-'));
const C = path.join(TMP, 'skill');

// assets/ vira so a ASSINATURA de cada imagem (o verificador confere existencia e assinatura;
// copiar os megabytes nao prova nada a mais)
const ASSINATURA = {
  '.jpg': Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
  '.png': Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  '.webp': Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP')]),
};
function copia(de, para, { assinatura = false } = {}) {
  fs.mkdirSync(para, { recursive: true });
  for (const e of fs.readdirSync(de, { withFileTypes: true })) {
    const o = path.join(de, e.name), d = path.join(para, e.name);
    if (e.isDirectory()) copia(o, d, { assinatura });
    else if (assinatura && ASSINATURA[path.extname(e.name).toLowerCase()]) fs.writeFileSync(d, ASSINATURA[path.extname(e.name).toLowerCase()]);
    else fs.copyFileSync(o, d);
  }
}
for (const item of ['references', '_local']) copia(path.join(SKILL, item), path.join(C, item));
copia(path.join(SKILL, 'assets'), path.join(C, 'assets'), { assinatura: true });
for (const f of ['SKILL.md', 'README.md', 'INDEX.md', 'IMAGENS.md', 'atualizar.md']) fs.copyFileSync(path.join(SKILL, f), path.join(C, f));

const p = (...x) => path.join(C, ...x);
const le = (f) => fs.readFileSync(f, 'utf8');
const node = (script, ...args) => {
  try { return { rc: 0, out: execFileSync(process.execPath, [p('_local', script), ...args], { encoding: 'utf8', stdio: 'pipe' }) }; }
  catch (e) { return { rc: e.status ?? 1, out: String(e.stdout || '') + String(e.stderr || '') }; }
};

let passou = 0, falhou = 0;
const checa = (cond, msg, extra = '') => {
  if (cond) { passou++; console.log('  ok      ' + msg + (extra ? `  (${extra})` : '')); }
  else { falhou++; console.log('  FALHOU  ' + msg + (extra ? `  -> ${extra}` : '')); }
};
const blocos = (t) => t.split(/\n(?=## )/).filter((b) => b.startsWith('## '));
const titulo = (b) => b.split('\n')[0].slice(3).trim();

// a copia intacta TEM que passar no verificador, senao a suite nao mede nada
const intacta = node('verificar.js');
if (intacta.rc !== 0) {
  console.log('ABORTADO: a cópia intacta já reprova no verificador. A suíte não teria sentido.');
  console.log(intacta.out.split('\n').filter((l) => /FALHOU/.test(l)).join('\n'));
  fs.rmSync(TMP, { recursive: true, force: true });
  process.exit(1);
}

// --- planta as entradas: dois principios novos no tema A e um enriquecimento no tema B ---
const temas = fs.readdirSync(p('references')).filter((f) => f.endsWith('.md')).map((f) => f.replace('.md', '')).sort();
const A = temas[0];
const B = temas.find((t) => t !== A && blocos(le(p('references', t + '.md'))).some((b) => !b.includes('**Evidence.**')));
const alvoB = titulo(blocos(le(p('references', B + '.md'))).find((b) => !b.includes('**Evidence.**')));
const original = new Map(fs.readdirSync(p('references')).map((f) => [f, le(p('references', f))]));
fs.mkdirSync(p('_local', 'entradas'), { recursive: true });
const novo = (t) => `## ${t}\n**Principle.** A planted principle that only this suite writes.\n**Apply when.** The reapply engine is being proved.\n**The move.** Insert it at the end of the theme, once.\n**In one line.** "Planted to be rebuilt."\n`;
fs.writeFileSync(p('_local', 'entradas', `9001-${A}.md`), novo('A first principle planted by the reapply suite'));
fs.writeFileSync(p('_local', 'entradas', `9002-${A}.md`), novo('A second principle planted by the reapply suite'));
fs.writeFileSync(p('_local', 'entradas', `9003-${B}.md`), `<!-- alvo: ${alvoB} | tema: ${B} -->\n**Evidence.** A planted evidence line that only this suite writes.\n`);

console.log('\n=== aplicando as entradas plantadas ===');
checa(node('gera-manifesto.mjs', '--escreve').rc === 0, 'gera-manifesto.mjs lista as 3 entradas plantadas');
const M = JSON.parse(le(p('_local', 'manifesto.json')));
const plantadas = M.entradas.filter((e) => /^900[123]-/.test(e.arquivo));
checa(plantadas.length === 3 && plantadas.filter((e) => e.modo === 'novo').length === 2 && plantadas.some((e) => e.modo === 'enriquecer' && e.alvo === alvoB),
  'o manifesto traz 2 princípios novos e 1 enriquecimento pelo título do alvo', `${plantadas.length} entradas plantadas`);
const ap = node('reaplicar.mjs', '--escreve');
checa(ap.rc === 0 && (ap.out.match(/^\s+- /gm) || []).length === 3, 'o motor relatou as 3 mudanças', (ap.out.match(/^\s+- /gm) || []).length + ' mudanças');
const blA = blocos(le(p('references', A + '.md')));
checa(titulo(blA[blA.length - 2]) === 'A first principle planted by the reapply suite' && titulo(blA[blA.length - 1]) === 'A second principle planted by the reapply suite',
  `os dois princípios novos entram no fim de ${A}, na ordem das entradas`);
const blB = blocos(le(p('references', B + '.md'))).find((b) => titulo(b) === alvoB);
const ordem = blB.split('\n').filter((l) => /^\*\*[A-Z][A-Za-z ]*\.\*\*/.test(l)).map((l) => l.match(/^\*\*([A-Za-z ]+)\.\*\*/)[1]);
checa(ordem.indexOf('Evidence') === ordem.indexOf('The move') + 1, `o enriquecimento entra em "${alvoB.slice(0, 40)}" na posição canônica (logo depois de The move)`, ordem.join(' > '));
for (const s of ['numeros.mjs', 'catalogo.mjs', 'indexar.mjs']) node(s, '--escreve');
const aplicada = node('verificar.js');
checa(aplicada.rc === 0, 'com as entradas aplicadas e os índices regenerados, o verificador aprova',
  aplicada.out.split('\n').filter((l) => /FALHOU/.test(l)).slice(0, 2).join(' | '));

// o gabarito: como references/ esta AGORA, com a adicao local aplicada
const gabarito = new Map(fs.readdirSync(p('references')).map((f) => [f, le(p('references', f))]));

console.log('\n=== simulando references/ restaurado de uma cópia sem a adição local ===');
for (const [f, t] of original) fs.writeFileSync(p('references', f), t, 'utf8');
for (const s of ['indexar.mjs']) node(s, '--escreve');   // o quick index volta ao da cópia
const destruida = node('verificar.js');
checa(destruida.rc !== 0 && /princípios \(base/.test(destruida.out.split('\n').filter((l) => /FALHOU/.test(l)).join('\n')),
  'o verificador REPROVA a skill sem a adição local (pela contagem de princípios)');

console.log('\n=== reaplicando ===');
const re = node('reaplicar.mjs', '--escreve');
checa(re.rc === 0 && (re.out.match(/^\s+- /gm) || []).length === 3, 'o motor relatou o que fez', (re.out.match(/^\s+- /gm) || []).length + ' mudanças');
node('indexar.mjs', '--escreve');

console.log('\n=== o resultado bate com o gabarito? ===');
const diferentes = [...gabarito].filter(([f, t]) => le(p('references', f)) !== t).map(([f]) => f);
checa(diferentes.length === 0, `os ${gabarito.size} arquivos de tema voltaram byte a byte`, diferentes.join(', ') || `${gabarito.size} idênticos`);

console.log('\n=== rodar de novo não muda mais nada (idempotência) ===');
checa(node('reaplicar.mjs', '--check').rc === 0, 'segunda passada reporta zero mudança');

console.log('\n=== sem as entradas plantadas, o motor não mexe em nada ===');
for (const f of fs.readdirSync(p('_local', 'entradas')).filter((f) => /^900[123]-/.test(f))) fs.rmSync(p('_local', 'entradas', f));
for (const [f, t] of original) fs.writeFileSync(p('references', f), t, 'utf8');
node('gera-manifesto.mjs', '--escreve');
const vazio = node('reaplicar.mjs', '--check');
checa(vazio.rc === 0 && [...original].every(([f, t]) => le(p('references', f)) === t), 'só as entradas da skill: zero mudança e references/ intacto');

console.log('\n' + '='.repeat(60));
console.log(falhou === 0 ? `TUDO CERTO — ${passou} conferências, 0 falha`
  : `REPROVADO — ${falhou} falha(s) em ${passou + falhou}`);
fs.rmSync(TMP, { recursive: true, force: true });
process.exit(falhou === 0 ? 0 : 1);
