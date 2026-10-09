#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// confere · o verificador da skill /carrossel
//
// Reprova a skill quando algo está errado: arquivo obrigatório que falta,
// link quebrado, cor escrita à mão no lugar de variável, paleta gravada em hex
// ou com contraste baixo, linha do tempo fora do lugar, caminho de uma máquina
// específica, data solta, palavra que sobrou de outro projeto.
//
// Uso:  node scripts/confere.mjs
//       node scripts/confere.mjs --raiz <pasta>          confere outra cópia
//       node scripts/confere.mjs --proibidas <arquivo>   palavras extras a
//                                 reprovar, uma expressão regular por linha
//                                 (quem entrega uma cópia do workspace a outra
//                                 pessoa usa isto pra garantir que nada da
//                                 própria marca vazou)
//
// Sai 0 limpo, 1 reprovado. Cada achado diz arquivo, linha e o conserto.
// Duas faixas: G (gate, reprova) e A (aviso, não mexe na saída). Gate que vive
// vermelho ninguém lê, por isso aviso não reprova.
//
// A pasta marca/ é da pessoa que usa o workspace: G1 e G6 não olham pra ela, e
// A3 avisa que ela está ali, para quem vai entregar uma cópia a outra pessoa.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve, extname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const iRaiz = process.argv.indexOf('--raiz');
const RAIZ = iRaiz > -1 && process.argv[iRaiz + 1]
  ? resolve(process.argv[iRaiz + 1])
  : resolve(dirname(fileURLToPath(import.meta.url)), '..');

const gates = [];
const avisos = [];
const gate = (cod, arquivo, linha, msg) => gates.push({ cod, arquivo, linha, msg });
const aviso = (cod, arquivo, linha, msg) => avisos.push({ cod, arquivo, linha, msg });

// ─── o disco ───────────────────────────────────────────────────────────────

const PULAR = new Set(['node_modules', '.git']);
const TEXTO = new Set(['.md', '.txt', '.css', '.html', '.js', '.mjs', '.json', '.gitignore', '.gitattributes', '.gitkeep']);

/** Lista todo arquivo da skill, caminho relativo com barra normal. */
function arquivos(dir = RAIZ, acc = []) {
  let itens;
  try { itens = readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const it of itens) {
    if (PULAR.has(it.name)) continue;
    const abs = join(dir, it.name);
    if (it.isDirectory()) arquivos(abs, acc);
    else acc.push(posix.join(...abs.slice(RAIZ.length + 1).split(/[\\/]/)));
  }
  return acc;
}

const ehTexto = (rel) => TEXTO.has(extname(rel));
const ler = (rel) => readFileSync(join(RAIZ, rel), 'utf8');
const linhaDe = (t, idx) => t.slice(0, idx).split('\n').length;

/** Troca o trecho casado por quebras de linha na mesma quantidade: a numeração sobrevive. */
function apaga(texto, regex) {
  return texto.replace(regex, (m) => m.replace(/[^\n]/g, ''));
}

const TODOS = arquivos();
const TEXTOS = TODOS.filter(ehTexto);

// Os dois arquivos do verificador carregam os padrões que ele caça. Não se
// conferem a si mesmos.
const PROPRIOS = new Set(['scripts/confere.mjs', 'scripts/teste-confere.mjs']);
// O que a pessoa gravou é dela: nome, tom, frase literal. G1 e G6 não julgam.
// G8 (caminho de máquina) vale ali também: um @font-face copiado com C:\ quebra
// em qualquer outra máquina.
const DA_PESSOA = (f) => f.startsWith('marca/');

// ─── G1 · o que não pertence ao produto ────────────────────────────────────
// Data solta no formato dd/mm/aaaa é registro de decisão de alguém, não regra.
// A lista extra vem de --proibidas: quem entrega uma cópia do workspace passa
// ali o nome da própria marca, das cores dela, dos projetos vizinhos.

const PROIBIDAS = [/\b\d{2}\/\d{2}\/\d{4}\b/];
const iProib = process.argv.indexOf('--proibidas');
if (iProib > -1 && process.argv[iProib + 1]) {
  const linhas = readFileSync(resolve(process.argv[iProib + 1]), 'utf8').split('\n');
  for (const l of linhas) {
    const t = l.trim();
    if (t && !t.startsWith('#')) PROIBIDAS.push(new RegExp(t, 'i'));
  }
}

for (const f of TEXTOS) {
  if (PROPRIOS.has(f) || DA_PESSOA(f)) continue;
  const t = ler(f);
  for (const p of PROIBIDAS) {
    const m = new RegExp(p.source, p.flags.includes('g') ? p.flags : p.flags + 'g').exec(t);
    if (m) gate('G1', f, linhaDe(t, m.index), `"${m[0]}" não pertence ao produto. Tire, ou deixe em branco pra pessoa preencher`);
  }
}

// ─── G2 · a estrutura ──────────────────────────────────────────────────────

const OBRIGATORIOS = [
  'SKILL.md', 'README.md', '.gitignore',
  'marca/marca.molde.md', 'marca/tokens.molde.css', 'marca/logo/.gitkeep', 'marca/fontes/.gitkeep',
  'kit/componentes.css', 'kit/modelo-carrossel.html', 'kit/catalogo.html',
  'referencias/metodo.md', 'referencias/composicao.md', 'referencias/trocar-de-marca.md', 'referencias/entrevista.md',
  'render/render-carrossel.js', 'render/servidor.js', 'render/linha-do-tempo.mjs', 'render/teste-render.mjs', 'render/teste-servidor.mjs',
  'render/package.json', 'render/package-lock.json', 'render/instalar.md',
  'scripts/confere.mjs', 'scripts/teste-confere.mjs',
];

for (const o of OBRIGATORIOS) {
  if (!existsSync(join(RAIZ, o))) gate('G2', o, 0, 'arquivo obrigatório não existe');
}

// Nome genérico não entra: cada arquivo diz o que é pelo nome. `teste-confere`
// diz; `teste.mjs` não.
for (const f of TODOS) {
  if (/(^|\/)(novo|teste|final|v\d+|copia|copy|temp|tmp)(\.[a-z]+)?$/i.test(f)) {
    gate('G2', f, 0, 'nome genérico; o arquivo tem que dizer o que é');
  }
}

// ─── A3 · a marca da pessoa dentro da skill ────────────────────────────────
// Quem configurou tem marca/tokens.css e marca/marca.md, e isso é o esperado.
// Uma cópia do workspace entregue a OUTRA pessoa não leva os dois: são de uma
// marca só. Aviso, não gate, porque no workspace de quem usa eles estão certos.

for (const f of ['marca/tokens.css', 'marca/marca.md']) {
  if (existsSync(join(RAIZ, f))) aviso('A3', f, 0, 'é a marca de quem configurou; não vai numa cópia entregue a outra pessoa');
}

// ─── G3 · ponteiro que aponta pro nada ─────────────────────────────────────
// Caminho começando em /.claude/skills/carrossel/ é a própria pasta da skill,
// visto de dentro do projeto da pessoa. Qualquer outro caminho absoluto é do
// projeto dela (ou placeholder) e não se confere aqui.

const PREFIXO_SKILL = '/.claude/skills/carrossel/';

function resolveAlvo(f, alvo) {
  if (/^(https?:|mailto:|tel:|data:|#|javascript:)/.test(alvo)) return null;
  if (alvo.includes('var(') || alvo.includes('<') || alvo.includes('{')) return null;
  const limpo = alvo.split('#')[0].split('?')[0];
  if (!limpo) return null;
  if (limpo.startsWith(PREFIXO_SKILL)) return limpo.slice(PREFIXO_SKILL.length);
  if (limpo.startsWith('/')) return null;
  return posix.normalize(posix.join(posix.dirname(f), limpo));
}

function confereAlvo(f, alvo, linha) {
  const rel = resolveAlvo(f, alvo);
  if (rel === null) return;
  // marca/tokens.css e marca/marca.md são da pessoa e podem ainda não existir
  if (rel === 'marca/tokens.css' || rel === 'marca/marca.md') return;
  if (!existsSync(join(RAIZ, rel))) gate('G3', f, linha, `aponta pra "${alvo}", que não existe`);
}

for (const f of TEXTOS) {
  if (PROPRIOS.has(f)) continue;
  const ext = extname(f);
  let t = ler(f);
  if (ext === '.md') {
    t = apaga(t, /```[\s\S]*?```/g);
    t = apaga(t, /`[^`\n]*`/g);
    for (const m of t.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) confereAlvo(f, m[1], linhaDe(t, m.index));
  }
  if (ext === '.html') {
    t = apaga(t, /<!--[\s\S]*?-->/g);
    t = apaga(t, /<pre\b[\s\S]*?<\/pre>/gi);
    t = apaga(t, /<code\b[\s\S]*?<\/code>/gi);
    for (const m of t.matchAll(/\b(?:href|src)="([^"]+)"/g)) confereAlvo(f, m[1], linhaDe(t, m.index));
  }
  if (ext === '.html' || ext === '.css') {
    for (const m of t.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) confereAlvo(f, m[1], linhaDe(t, m.index));
  }
}

// ─── G4 · cor escrita à mão no componentes.css ─────────────────────────────
// O contrato do kit: o componentes.css é 100% variável. Cor solta ali escapa da
// troca de marca e a peça da pessoa sai com a cor de outra.

{
  const f = 'kit/componentes.css';
  if (existsSync(join(RAIZ, f))) {
    const t = apaga(ler(f), /\/\*[\s\S]*?\*\//g);
    for (const m of t.matchAll(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g)) {
      gate('G4', f, linhaDe(t, m.index), `"${m[0]}" é cor fixa; vira token em marca/tokens.css`);
    }
  }
}

// ─── G5 · a paleta gravada ─────────────────────────────────────────────────

const CANAIS = ['--c-dark', '--c-light', '--c-accent', '--c-support-1', '--c-support-2', '--c-rare', '--c-abyss', '--c-ok'];

function luminancia([r, g, b]) {
  const c = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contraste(a, b) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

function confereTokens(f) {
  if (!existsSync(join(RAIZ, f))) return;
  const t = ler(f);
  if (/ESTADO:\s*nao-configurado/.test(t)) return; // molde em branco: nada a medir
  const semComentario = apaga(t, /\/\*[\s\S]*?\*\//g);
  const valores = {};
  for (const c of CANAIS) {
    const m = new RegExp(`${c}\\s*:\\s*([^;]+);`).exec(semComentario);
    if (!m) { gate('G5', f, 0, `falta o canal ${c}`); continue; }
    const v = m[1].trim();
    const rgb = /^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/.exec(v);
    if (!rgb) {
      gate('G5', f, linhaDe(semComentario, m.index), `${c} está como "${v}"; tem que ser canais RGB (ex.: 0,74,173), senão todo rgba() quebra`);
      continue;
    }
    valores[c] = [+rgb[1], +rgb[2], +rgb[3]];
  }
  if (valores['--c-dark'] && valores['--c-light']) {
    const r = contraste(valores['--c-dark'], valores['--c-light']);
    if (r < 4.5) gate('G5', f, 0, `contraste da cor principal sobre o fundo claro é ${r.toFixed(2)}:1; o mínimo é 4,5:1`);
  }
  // O acento é cor de TEXTO (o trecho em serifada, o kicker, o rótulo) sobre os
  // dois fundos. Mínimo 3:1 (texto grande); abaixo de 4,5:1 é aviso, porque o
  // kicker de 20px já sofre.
  if (valores['--c-accent']) {
    for (const [fundo, nome] of [['--c-dark', 'a cor principal'], ['--c-light', 'o fundo claro']]) {
      if (!valores[fundo]) continue;
      const r = contraste(valores['--c-accent'], valores[fundo]);
      if (r < 3) gate('G5', f, 0, `contraste do acento sobre ${nome} é ${r.toFixed(2)}:1; o acento é cor de texto e o mínimo é 3:1`);
      else if (r < 4.5) aviso('A2', f, 0, `contraste do acento sobre ${nome} é ${r.toFixed(2)}:1; passa pra título, mas o kicker (20px) fica no limite`);
    }
  }
  if (!/@import\s+url\(\s*['"]?https:\/\/fonts\.googleapis\.com/.test(semComentario)) {
    gate('G5', f, 0, 'sem @import do Google Fonts; o render vai cair na fonte de sistema');
  }
}
confereTokens('marca/tokens.molde.css');
confereTokens('marca/tokens.css');

// ─── G6 · travessão em texto que a pessoa lê ───────────────────────────────

const TRAVESSAO = /[—–]/g;
for (const f of TEXTOS) {
  const ext = extname(f);
  if (PROPRIOS.has(f) || DA_PESSOA(f)) continue;
  let t;
  if (ext === '.md' || ext === '.txt') t = ler(f);
  else if (ext === '.html') {
    t = ler(f);
    t = apaga(t, /<!--[\s\S]*?-->/g);
    t = apaga(t, /<(script|style|pre|code)\b[\s\S]*?<\/\1>/gi);
  } else continue;
  const m = TRAVESSAO.exec(t);
  TRAVESSAO.lastIndex = 0;
  if (m) gate('G6', f, linhaDe(t, m.index), 'travessão; troque por ponto, vírgula, dois-pontos ou parênteses');
}

// ─── G7 · a linha do tempo em todo slide, com o número junto ───────────────

function confereLinhaDoTempo(html) {
  const erros = [];
  const t = apaga(html, /<!--[\s\S]*?-->/g);
  const inicios = [...t.matchAll(/<div\s+class="slide\b[^"]*"/g)].map((m) => m.index);
  if (!inicios.length) return [{ linha: 0, msg: 'nenhum .slide encontrado' }];
  const total = inicios.length;
  inicios.forEach((ini, i) => {
    const fim = inicios[i + 1] ?? t.length;
    const bloco = t.slice(ini, fim);
    const n = i + 1;
    const linha = linhaDe(t, ini);
    const bar = /<div\s+class="bar">([\s\S]*?)<\/div>/.exec(bloco);
    if (!bar) { erros.push({ linha, msg: `slide ${n}: sem <div class="bar">` }); return; }
    const tracos = [...bar[1].matchAll(/<i\b([^>]*)>/g)].map((m) => m[1]);
    if (tracos.length !== total) erros.push({ linha, msg: `slide ${n}: ${tracos.length} traço(s) na barra, a peça tem ${total} slides` });
    tracos.forEach((attrs, j) => {
      const esperado = j < i ? 'feito' : j === i ? 'agora' : '';
      const real = /class="([^"]*)"/.exec(attrs)?.[1].trim() ?? '';
      if (real !== esperado) erros.push({ linha, msg: `slide ${n}: traço ${j + 1} está "${real || 'vazio'}", devia ser "${esperado || 'vazio'}"` });
    });
    const count = /<span\s+class="count">\s*(\d+)\s*\/\s*(\d+)\s*<\/span>/.exec(bloco);
    if (!count) erros.push({ linha, msg: `slide ${n}: sem <span class="count">` });
    else if (+count[1] !== n || +count[2] !== total) erros.push({ linha, msg: `slide ${n}: contador diz ${count[1]}/${count[2]}, devia ser ${n}/${total}` });
    const chev = /<span\s+class="chev">/.test(bloco);
    if (n === total && chev) erros.push({ linha, msg: `slide ${n}: o último slide não leva a seta (.chev)` });
    if (n !== total && !chev) erros.push({ linha, msg: `slide ${n}: falta a seta (.chev)` });
  });
  return erros;
}

for (const f of ['kit/modelo-carrossel.html', ...TODOS.filter((a) => a !== 'kit/modelo-carrossel.html' && a.endsWith('carrossel.html'))]) {
  if (!existsSync(join(RAIZ, f))) continue;
  for (const e of confereLinhaDoTempo(ler(f))) gate('G7', f, e.linha, e.msg);
}

// ─── G8 · caminho de uma máquina específica ────────────────────────────────

const MAQUINA = [/[A-Za-z]:\\/, /[A-Za-z]:\/Users/, /\/Users\//, /\/home\//];
for (const f of TEXTOS) {
  if (PROPRIOS.has(f)) continue;
  const t = ler(f);
  for (const p of MAQUINA) {
    const m = p.exec(t);
    if (m) gate('G8', f, linhaDe(t, m.index), `"${m[0]}" é caminho de uma máquina; a skill só conhece a pasta do projeto`);
  }
}

// ─── A1 · SKILL.md pesado ──────────────────────────────────────────────────
// O SKILL.md carrega em todo uso. Regra fica nele; explicação desce pra
// referencias/. Estimativa: 3,5 caracteres por token em português.

{
  const f = 'SKILL.md';
  if (existsSync(join(RAIZ, f))) {
    const tokens = Math.round(ler(f).length / 3.5);
    if (tokens > 2500) aviso('A1', f, 0, `~${tokens} tokens; o teto é 2.500. O que explica desce pra referencias/`);
  }
}

// ─── saída ─────────────────────────────────────────────────────────────────

const traco = '─'.repeat(74);
console.log(`\n${traco}`);
console.log('confere · o verificador da skill /carrossel');
console.log(traco);
console.log(`\npasta: ${RAIZ}`);
console.log(`arquivos varridos: ${TODOS.length} (${TEXTOS.length} de texto)\n`);

const mostra = (a) => `   ${a.cod} · ${a.arquivo}${a.linha ? ':' + a.linha : ''}  ${a.msg}`;
for (const a of gates) console.log(mostra(a));
if (avisos.length) {
  console.log(gates.length ? '' : '', 'avisos (não reprovam):');
  for (const a of avisos) console.log(mostra(a));
}

console.log(`\n${traco}`);
console.log('G = reprova · A = aviso · o número depois do arquivo é a linha');
if (!gates.length) {
  console.log(`RESULTADO: a skill está limpa. ✅${avisos.length ? ` (${avisos.length} aviso(s) acima)` : ''}`);
  console.log(`${traco}\n`);
  process.exit(0);
}
console.log(`RESULTADO: ${gates.length} problema(s). Cada linha acima diz o conserto.`);
console.log(`${traco}\n`);
process.exit(1);
