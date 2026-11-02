// A biblioteca de comportamentos (biblioteca.md).
//
//   node biblioteca.mjs conferir
//   node biblioteca.mjs indice                                  # regrava biblioteca/INDICE.md
//   node biblioteca.mjs recusar <id> --frase "<a frase do usuário>" [--procura "<trecho>,<trecho>"]
//
// conferir: campos, estado, família, id único em kebab, a frase e a data no
// recusado, cada "regra:" existindo como regra ou blueprint no plugin HyperFrames
// instalado e cada "registro:" como bloco ou componente do registro dele (sem o
// plugin, essa parte não é conferida e diz isso). "ativo:" aponta um pacote do
// material do usuário (ferramentas/ativos.py).
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { chamadoDireto } from './principal.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const ARQ = join(AQUI, '..', 'biblioteca', 'catalogo.json');
const INDICE = join(AQUI, '..', 'biblioteca', 'INDICE.md');
const PLUGIN = join(homedir(), '.claude', 'plugins', 'cache', 'hyperframes', 'hyperframes');
const REGRAS = join(AQUI, '..', 'biblioteca', 'hyperframes-regras');
export const ESTADOS = ['visto, sem decisão', 'portado', 'aprovado pelo usuário', 'recusado'];
export const FAMILIAS = ['MICRO', 'STANDARD', 'CAMERA', 'HERO'];
const CAMPOS = ['id', 'comportamento', 'comunica', 'quando', 'quando_nao', 'familia', 'funcao', 'curva', 'motor', 'estado', 'procura', 'prova', 'recusa'];
const PREFIXOS = { hyperframes: ['proprio', 'regra', 'registro', 'ativo'], remotion: ['src'] };

function nomesDoPlugin() {
  if (!existsSync(PLUGIN) || !existsSync(REGRAS)) return null;
  // a versão mais nova pela ordem numérica: como texto, 0.10.0 viria antes de 0.8.96
  const versoes = readdirSync(PLUGIN).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const raiz = join(PLUGIN, versoes[versoes.length - 1]);
  // as regras moram na skill (biblioteca/hyperframes-regras, do instalador): o plugin deixou de trazê-las na 0.8.207
  const nomes = new Set();
  for (const sub of ['rules', 'blueprints']) {
    const d = join(REGRAS, sub);
    if (existsSync(d)) for (const n of readdirSync(d)) if (n.endsWith('.md')) nomes.add(n.replace(/\.md$/, ''));
  }
  // o registro: as pastas de blocks/ e components/ (o que o "npx hyperframes add" instala)
  const registro = new Set();
  for (const sub of ['blocks', 'components']) {
    const d = join(raiz, 'registry', sub);
    if (existsSync(d)) for (const n of readdirSync(d)) registro.add(n);
  }
  nomes.registro = registro;
  return nomes;
}

export function conferirCatalogo(catalogo, { plugin = nomesDoPlugin() } = {}) {
  const erros = [], avisos = [];
  const erro = (msg) => erros.push({ regra: 'biblioteca', msg });
  const ids = new Set();
  for (const e of catalogo.entradas || []) {
    const id = e.id || '(sem id)';
    for (const c of CAMPOS) if (!(c in e)) erro(`${id}: falta o campo ${c}`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id || '')) erro(`${id}: o id é em kebab, sem acento`);
    if (ids.has(e.id)) erro(`${id}: id repetido`);
    ids.add(e.id);
    if (!ESTADOS.includes(e.estado)) erro(`${id}: o estado "${e.estado}" não existe (${ESTADOS.join(' | ')})`);
    if (!FAMILIAS.includes(e.familia)) erro(`${id}: a família "${e.familia}" não existe (${FAMILIAS.join(', ')})`);
    if (e.estado === 'recusado' && (!e.recusa?.frase || !e.recusa?.data)) erro(`${id}: recusado sem a frase do usuário e a data`);
    if (e.estado === 'recusado' && !e.procura?.length) avisos.push({ regra: 'biblioteca', msg: `${id}: recusado sem trecho em "procura"; o plano reprova o uso, mas a régua do código não o vê` });
    if (e.estado === 'aprovado pelo usuário' && !e.prova) erro(`${id}: aprovado pelo usuário sem a peça que prova`);
    for (const [motor, lista] of Object.entries(e.motor || {})) {
      if (!PREFIXOS[motor]) { erro(`${id}: motor "${motor}" não existe`); continue; }
      for (const item of lista) {
        const [pre, nome] = String(item).split(/:(.*)/s);
        if (!PREFIXOS[motor].includes(pre) || !nome) erro(`${id}: "${item}" não tem prefixo de ${motor} (${PREFIXOS[motor].join(', ')})`);
        else if (pre === 'regra' && plugin && !plugin.has(nome)) erro(`${id}: "${nome}" não é regra nem blueprint do HyperFrames instalado`);
        else if (pre === 'registro' && plugin?.registro?.size && !plugin.registro.has(nome)) erro(`${id}: "${nome}" não é bloco nem componente do registro do HyperFrames instalado`);
      }
    }
  }
  if (!plugin) avisos.push({ regra: 'biblioteca', msg: 'o plugin HyperFrames não foi achado: os nomes de "regra:" não foram conferidos' });
  return { erros, avisos };
}

export function recusar(catalogo, id, { frase, procura = [], data = new Date().toISOString().slice(0, 10) }) {
  const e = (catalogo.entradas || []).find((x) => x.id === id);
  if (!e) throw new Error(`a entrada "${id}" não está na biblioteca`);
  if (!frase) throw new Error('a recusa grava a frase do usuário: --frase "..."');
  e.estado = 'recusado';
  e.recusa = { data, frase };
  e.procura = [...new Set([...(e.procura || []), ...procura])];
  return catalogo;
}

export function indice(catalogo) {
  const L = ['# A biblioteca de comportamentos', '',
    '> Gerado por `ferramentas/biblioteca.mjs indice` a partir de `catalogo.json`. Não se edita à mão.', ''];
  const porEstado = (st) => (catalogo.entradas || []).filter((e) => e.estado === st).sort((a, b) => a.comunica.localeCompare(b.comunica, 'pt'));
  for (const st of ESTADOS) {
    const es = porEstado(st);
    if (!es.length) continue;
    L.push(`## ${st[0].toUpperCase() + st.slice(1)}`, '', '| Comunica | Comportamento | Id | Família | Motores |', '|---|---|---|---|---|');
    for (const e of es) {
      const motores = Object.values(e.motor || {}).flat().join(', ') || '—';
      L.push(`| ${e.comunica} | ${e.comportamento} | \`${e.id}\` | ${e.familia} | ${motores} |`);
    }
    L.push('');
  }
  return L.join('\n');
}

if (chamadoDireto(import.meta.url)) {
  const [cmd, id] = process.argv.slice(2);
  const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : null; };
  const catalogo = JSON.parse(readFileSync(ARQ, 'utf8'));
  if (cmd === 'conferir') {
    const { erros, avisos } = conferirCatalogo(catalogo);
    for (const e of erros) console.log(`ERRO  ${e.msg}`);
    for (const a of avisos) console.log(`aviso ${a.msg}`);
    console.log(erros.length ? `\ncatálogo reprovado: ${erros.length} erro(s)` : `\ncatálogo verde: ${catalogo.entradas.length} entradas`);
    process.exitCode = erros.length ? 1 : 0;
  } else if (cmd === 'indice') {
    writeFileSync(INDICE, indice(catalogo) + '\n');
    console.log(`índice: ${INDICE}`);
  } else if (cmd === 'recusar') {
    const procura = (arg('procura') || '').split(',').map((s) => s.trim()).filter(Boolean);
    recusar(catalogo, id, { frase: arg('frase'), procura });
    const { erros } = conferirCatalogo(catalogo);
    if (erros.length) { for (const e of erros) console.log(`ERRO  ${e.msg}`); process.exit(1); }
    writeFileSync(ARQ, JSON.stringify(catalogo, null, 2) + '\n');
    writeFileSync(INDICE, indice(catalogo) + '\n');
    console.log(`recusado: ${id}, com a frase do usuário; o plano e a régua passam a reprovar o uso`);
  } else {
    console.error('uso: biblioteca.mjs conferir | indice | recusar <id> --frase "..." [--procura "a,b"]');
    process.exit(2);
  }
}
