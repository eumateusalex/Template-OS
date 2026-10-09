#!/usr/bin/env node
// Confere o contexto operacional: o CLAUDE.md, a memória, as skills e seus
// apoios, e os agentes. Cobra o que é mecânico; duplicação e regra defasada
// continuam exigindo leitura (o check-up da /sanitizacao).
//
// As réguas (documento operacional é o CLAUDE.md, o SKILL.md e os módulos de
// primeiro nível de cada skill, e os agentes):
//   teto      o `CLAUDE.md` passou do teto de caracteres
//   diario    marcador de diário em todo `.md` e em todo comentário de código de
//             `scripts/`, `.claude/`, `identidade/`, `.github/`, `docs/` e
//             `templates/` (fora o que é dado: fixture, acervo, material de
//             terceiro), e no `CLAUDE.md` e no `README.md` da raiz:
//             a história mora no `git log`. A `_memoria/` tem a régua de diário
//             dela, no `confere-memoria.mjs`
//   caminho   caminho citado entre crases que não existe (nos documentos
//             operacionais e na `_memoria/`)
//   descricao descrição de skill acima do teto da lista da sessão
//   termo     termo aposentado (a seção "Termos aposentados" do
//             `_memoria/README.md`) em documento operacional
// E a que impede o verde medindo zero:
//   leitura   o `CLAUDE.md`, a `_memoria/`, os `SKILL.md`, os agentes ou o código
//             não foram lidos
//
// As peças de terceiro (o `scripts/terceiros/manifesto.json`) existem por
// contrato: o caminho que o instalador grava conta como existente mesmo antes
// da instalação, o que ele grava fica fora do diário, e o arquivo que sai de um
// molde se lê no molde, no lugar onde vai ser instalado.
//
// Caminho que não existe de propósito (a saída que a skill grava no primeiro
// uso, a pasta que nasce no uso) leva na PRÓPRIA linha `caminho futuro: <razão>`:
// numa lista, a linha de cima é outro item, e a marca de um isentaria o seguinte.
// Um termo aposentado citado de propósito (a lista do que não se escreve) leva
// `termo aposentado: <razão>` na linha ou na de cima.
//
// Uso:  node scripts/confere-contexto.mjs [--raiz <caminho>] [--teto <n>]
// Sai 1 se algo reprovar.

import { readFileSync, readdirSync, existsSync, lstatSync } from 'node:fs';
import { join, resolve, dirname, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { termosDoReadme, reDoTermo } from './confere-memoria.mjs';
import { contratoDe } from './terceiros/peca.mjs';

const AQUI = fileURLToPath(new URL('.', import.meta.url));
const RAIZ_PADRAO = resolve(AQUI, '..');

export const TETO_PADRAO = 25000;
export const TETO_DESCRICAO = 450;

const MARCA = 'caminho futuro';
const MARCA_TERMO = 'termo aposentado';

/** A marca vale com uma razão depois dos dois-pontos, na linha dada ou na de cima. */
function isento(linhas, i, marca, { naDeCima = true } = {}) {
  const re = new RegExp(`${marca}:\\s*\\S`);
  return re.test(linhas[i] ?? '') || (naDeCima && re.test(linhas[i - 1] ?? ''));
}

// Módulo de skill: o `.md` no primeiro nível da pasta dela, que a porta manda
// ler como se fosse o SKILL.md. A subpasta é apoio.
const ehModulo = (n) => /^\.claude\/skills\/[^/]+\/[^/]+\.md$/.test(n);

// Todo espaço é `\s+`: o texto quebra em ~78 colunas, e o marcador pode ter a
// quebra no meio. Sem `\b` depois de letra acentuada: em JS "é" não é caractere
// de palavra, e a fronteira nunca casaria.
const DIARIO = [
  { re: /\bera\s+(?:\S+\s+){0,10}?até\W/gi, nome: '"era … até"' },
  { re: /\bdesde\s+\d{2}\/\d{2}\/\d{4}/gi, nome: 'desde DD/MM/AAAA' },
  { re: /\bem\s+\d{2}\/\d{2}\/\d{4}/gi, nome: 'em DD/MM/AAAA' },
  { re: /\bnasceu\s+(?:em|de|depois|quando|no|na)\s/gi, nome: 'nasceu em/de/depois' },
  { re: /\bobra\s+\d{3}\b/gi, nome: 'obra NNN' },
  { re: /\brodada\s+\d+\s+d[ao]s?\s+lentes?\b/gi, nome: 'rodada N das lentes' },
  { re: /🔄/g, nome: '🔄' },
];

// Fora do CLAUDE.md, a data solta não entra: em comentário e em documento ela
// costuma ser dado (a medição, a fonte citada, a fixture, o prazo de fora).
const NARRATIVA = DIARIO.filter(({ nome }) => nome !== 'em DD/MM/AAAA' && nome !== '🔄');

// Onde o diário se procura: o código e os documentos. O que é dado (fixture,
// acervo, biblioteca capturada) fica fora, e a peça de terceiro também, pelo
// contrato do instalador (a pasta e o arquivo que ele grava), não pelo nome.
const RAIZES_DO_DIARIO = ['scripts', '.claude', 'identidade', '.github', 'docs', 'templates'];
const FORA_DO_DIARIO = new Set([
  'node_modules', '.git', 'fixtures', 'biblioteca', '_local', '_bruto', 'curso',
  'estudos', 'vendor', '_vendor', 'playwright',
]);
const CODIGO_DO_DIARIO = /\.(m?js|cjs|tsx?|jsx|py|sh|css|ya?ml|html|json)$/;
const LINHA_DE_COMENTARIO = /^\s*(\/\/|#|\*|\/\*|<!--)/;

/** `instalado(caminho)` diz se o caminho absoluto é pasta ou arquivo que o instalador grava. */
function arquivosDoDiario(pasta, lista, instalado) {
  if (!existsSync(pasta)) return;
  for (const item of readdirSync(pasta, { withFileTypes: true })) {
    const caminho = join(pasta, item.name);
    if (instalado(caminho)) continue;
    // a junção e o link não são pasta nem arquivo para o readdir: o laço não os segue
    if (item.isDirectory()) {
      if (!FORA_DO_DIARIO.has(item.name)) arquivosDoDiario(caminho, lista, instalado);
    } else if (item.isFile() && !item.name.endsWith('-lock.json') &&
      (item.name.endsWith('.md') || CODIGO_DO_DIARIO.test(item.name))) {
      lista.push(caminho);
    }
  }
}

/** O texto em que cada marcador se procura: no código, só as linhas de comentário. */
function textoDoDiario(texto, codigo) {
  if (!codigo) return texto;
  return texto.split('\n').map((linha) => (LINHA_DE_COMENTARIO.test(linha) ? linha : '')).join('\n');
}

// Só se confere o que começa por uma pasta da casa (ou por `~/`); o resto entre
// crases é código, comando ou nome.
const PASTAS = /^(~\/|\.claude\/|_memoria\/|identidade\/|marketing\/|saidas\/|dados\/|scripts\/|docs\/|templates\/|lixeira\/|projetos-pessoais\/|clientes\/|rascunho\/|carrosseis\/|referencias\/)/;
// Molde, não endereço.
const MOLDE = /[<>*{}$|]|AAAA|NNN|\.\.\./;
// O que cada pessoa cria na própria máquina e o Git ignora de propósito (as
// chaves, a lista de nomes da /seguranca, o ajuste local de permissão): não
// existe no template, e citar não é defeito.
const PESSOAL = /^(scripts\/\.env(\.[\w.-]+)?|\.claude\/skills\/seguranca\/nomes\.local\.json|\.claude\/settings\.local\.json)$/;
// As pastas que nascem no projeto que a skill está construindo (o /grill grava a
// decisão, a /fabrica grava a spec), relativas à raiz DELE, não a esta.
const DO_PROJETO = /^docs\/(adr|decisoes|spec)(\/|$)/;

function ehJuncao(p) {
  try { return lstatSync(p).isSymbolicLink(); } catch { return false; }
}

const APOIO_IGNORADO = new Set(['curso', 'estudos', 'node_modules', '_bruto', 'dados', 'vendor', '_vendor', '.git']);

function markdowns(pasta, docs, instalado) {
  if (!existsSync(pasta)) return;
  for (const item of readdirSync(pasta, { withFileTypes: true })) {
    const caminho = join(pasta, item.name);
    if (item.isSymbolicLink() || instalado(caminho)) continue;
    if (item.isDirectory()) {
      if (!APOIO_IGNORADO.has(item.name)) markdowns(caminho, docs, instalado);
    } else if (item.isFile() && item.name.endsWith('.md')) {
      docs.push(caminho);
    }
  }
}

/**
 * O contrato do instalador visto daqui: o que ele grava (pasta inteira ou
 * arquivo), as pastas que o caminho de um arquivo dele atravessa, e o molde de
 * cada arquivo que sai de molde, pelo lugar onde vai ser instalado.
 */
function lerContrato(raiz) {
  const c = contratoDe(raiz);
  const abs = (p) => resolve(raiz, p);
  const gravados = new Set([...(c?.pastas ?? []), ...(c?.arquivos ?? [])].map(abs));
  const atravessadas = new Set();
  for (const arq of c?.arquivos ?? []) {
    const partes = arq.split('/');
    for (let i = 1; i < partes.length; i++) atravessadas.add(abs(partes.slice(0, i).join('/')));
  }
  return {
    instalado: (caminho) => gravados.has(resolve(caminho)),
    existe: (caminho) => gravados.has(resolve(caminho)) || atravessadas.has(resolve(caminho)),
    moldes: new Map((c?.moldes ?? []).map(({ instalado, molde }) => [abs(instalado), molde])),
  };
}

function documentos(raiz, contrato) {
  const docs = [];
  const claude = join(raiz, 'CLAUDE.md');
  if (existsSync(claude)) docs.push(claude);
  const memoria = join(raiz, '_memoria');
  if (existsSync(memoria)) {
    for (const n of readdirSync(memoria)) if (n.endsWith('.md')) docs.push(join(memoria, n));
  }
  const skills = join(raiz, '.claude', 'skills');
  if (existsSync(skills)) {
    for (const s of readdirSync(skills)) {
      const pasta = join(skills, s);
      if (ehJuncao(pasta)) continue; // de outro projeto: quem responde é ele
      if (contrato.instalado(pasta)) continue; // o instalado é da fonte; o que é daqui está no molde
      markdowns(pasta, docs, contrato.instalado);
    }
  }
  // o documento que sai de molde se confere no molde, no lugar onde vai morar
  for (const instalado of contrato.moldes.keys()) {
    const n = relative(raiz, instalado).split(sep);
    if (n[0] === '.claude' && n[1] === 'skills' && instalado.endsWith('.md') && !n.some((p) => APOIO_IGNORADO.has(p))) docs.push(instalado);
  }
  const agentes = join(raiz, '.claude', 'agents');
  if (existsSync(agentes)) {
    for (const d of readdirSync(agentes)) {
      const pasta = join(agentes, d);
      if (ehJuncao(pasta) || !lstatSync(pasta).isDirectory()) continue;
      for (const n of readdirSync(pasta)) if (n.endsWith('.md')) docs.push(join(pasta, n));
    }
  }
  return docs;
}

function linhaDe(texto, indice) {
  return texto.slice(0, indice).split('\n').length;
}

function descricaoDaSkill(texto) {
  const frente = texto.replace(/\r\n/g, '\n').match(/^---\s*\n([\s\S]*?)\n---/)?.[1];
  if (!frente) return '';
  const linhas = frente.split('\n');
  const i = linhas.findIndex((linha) => linha.startsWith('description:'));
  if (i < 0) return '';
  const valor = linhas[i].slice('description:'.length).trim();
  if (valor && !['|', '>', '|-', '>-'].includes(valor)) return valor;
  const bloco = [];
  for (const linha of linhas.slice(i + 1)) {
    if (!/^\s+/.test(linha)) break;
    bloco.push(linha.trim());
  }
  return bloco.join(' ');
}

/** true, false, ou null quando não há como medir (`~/` numa máquina sem `~/.claude`). */
function existe(caminho, doc, raiz, casaDoUsuario, contrato) {
  if (caminho.startsWith('~/')) {
    if (!existsSync(join(casaDoUsuario, '.claude'))) return null;
    return existsSync(join(casaDoUsuario, caminho.slice(2)));
  }
  return [join(raiz, caminho), join(dirname(doc), caminho)].some((c) => existsSync(c) || contrato.existe(c));
}

/**
 * @param {string} [raiz]
 * @param {{ teto?: number, casaDoUsuario?: string }} [opcoes]
 */
export function confereContexto(raiz = RAIZ_PADRAO, { teto = TETO_PADRAO, casaDoUsuario = homedir() } = {}) {
  const achados = [];
  const contrato = lerContrato(raiz);
  const docs = documentos(raiz, contrato);
  const ler = (doc) => readFileSync(contrato.moldes.get(doc) ?? doc, 'utf8');
  const nome = (f) => relative(raiz, f).split(sep).join('/');
  const claude = join(raiz, 'CLAUDE.md');
  const readme = join(raiz, '_memoria', 'README.md');
  const termos = existsSync(readme)
    ? termosDoReadme(readFileSync(readme, 'utf8')).map((termo) => ({
      termo,
      re: reDoTermo(termo),
    }))
    : [];

  if (!existsSync(claude)) achados.push({ regra: 'leitura', arquivo: 'CLAUDE.md', linha: 0, msg: 'o CLAUDE.md da raiz não existe: não há o que medir' });
  // verde medindo zero é vermelho: cada conjunto tem que ter sido lido
  const conjuntos = [
    ['_memoria', '_memoria/', 'nenhum arquivo da _memoria lido'],
    ['.claude/skills', '/SKILL.md', 'nenhum SKILL.md lido'],
    ['.claude/agents', '.claude/agents/', 'nenhum agente lido'],
  ];
  for (const [arquivo, trecho, msg] of conjuntos) {
    if (!docs.some((d) => nome(d).includes(trecho))) {
      achados.push({ regra: 'leitura', arquivo, linha: 0, msg: `${msg}: verde medindo zero é vermelho` });
    }
  }
  const naoConferidos = [];

  if (existsSync(claude)) {
    const tamanho = [...readFileSync(claude, 'utf8')].length;
    if (tamanho > teto) {
      achados.push({ regra: 'teto', arquivo: 'CLAUDE.md', linha: 0, msg: `${tamanho} caracteres, acima do teto de ${teto}: regra nova substitui a velha, e a história fica no git log` });
    }
  }

  // o que a sessão carrega como regra: o CLAUDE.md, a porta e os módulos da skill, os agentes
  const operacional = (doc, n) => doc === claude || n.endsWith('/SKILL.md') || ehModulo(n) || n.startsWith('.claude/agents/');

  for (const doc of docs) {
    const texto = ler(doc);
    const n = nome(doc);
    if (doc.endsWith(`${sep}SKILL.md`)) {
      const descricao = descricaoDaSkill(texto);
      if ([...descricao].length > TETO_DESCRICAO) {
        achados.push({ regra: 'descricao', arquivo: n, linha: 1, msg: `${[...descricao].length} caracteres, acima do teto de ${TETO_DESCRICAO}` });
      }
    }
    // a _memoria/ fica de fora: o confere-memoria a mede, e o README de lá lista os termos para proibi-los
    if (operacional(doc, n)) {
      const linhas = texto.split('\n');
      for (const { termo, re } of termos) {
        re.lastIndex = 0;
        for (const m of texto.matchAll(re)) {
          const i = linhaDe(texto, m.index) - 1;
          if (isento(linhas, i, MARCA_TERMO)) continue;
          achados.push({ regra: 'termo', arquivo: n, linha: i + 1, msg: `cita "${termo}", que está nos termos aposentados (se é a lista do que não se escreve: "${MARCA_TERMO}: <razão>" na linha ou na de cima)` });
        }
      }
    }
  }

  for (const doc of docs) {
    const n = nome(doc);
    if (!operacional(doc, n) && !n.startsWith('_memoria/')) continue;
    const linhas = ler(doc).split('\n');
    linhas.forEach((linha, i) => {
      for (const m of linha.matchAll(/`([^`\s]+)`/g)) {
        const caminho = m[1].replace(/[),.;]+$/, '').replace(/#.*$/, '').replace(/:\d+(-\d+)?$/, '');
        if (!PASTAS.test(caminho) || MOLDE.test(caminho) || PESSOAL.test(caminho) || DO_PROJETO.test(caminho)) continue;
        const ha = existe(caminho, doc, raiz, casaDoUsuario, contrato);
        if (ha === null) { naoConferidos.push(caminho); continue; }
        if (ha) continue;
        if (isento(linhas, i, MARCA, { naDeCima: false })) continue; // só a própria linha
        achados.push({ regra: 'caminho', arquivo: n, linha: i + 1, msg: `cita \`${caminho}\`, que não existe (se é de propósito: "${MARCA}: <razão>" na linha)` });
      }
    });
  }

  // ── o diário: no código, no comentário e no documento ──────────────────
  const doDiario = [];
  for (const r of RAIZES_DO_DIARIO) arquivosDoDiario(join(raiz, r), doDiario, contrato.instalado);
  for (const n of ['CLAUDE.md', 'README.md']) if (existsSync(join(raiz, n))) doDiario.push(join(raiz, n));
  let codigoLido = 0;
  for (const arq of doDiario) {
    const texto = readFileSync(arq, 'utf8');
    const n = nome(arq);
    const codigo = CODIGO_DO_DIARIO.test(arq);
    if (codigo) codigoLido++;
    const alvo = textoDoDiario(texto, codigo);
    for (const { re, nome: marcador } of arq === claude ? DIARIO : NARRATIVA) {
      re.lastIndex = 0;
      for (const m of alvo.matchAll(re)) {
        achados.push({ regra: 'diario', arquivo: n, linha: linhaDe(alvo, m.index), msg: `marcador de diário ${marcador}: "${m[0].replace(/\s+/g, ' ')}" (a história mora no git log)` });
      }
    }
  }
  if (!codigoLido) {
    achados.push({ regra: 'leitura', arquivo: RAIZES_DO_DIARIO.join(', '), linha: 0, msg: 'nenhum arquivo de código lido para o diário: verde medindo zero é vermelho' });
  }

  return { achados, lidos: docs.length, lidosDiario: doDiario.length, naoConferidos };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : undefined; };
  const raiz = arg('--raiz') ? resolve(arg('--raiz')) : RAIZ_PADRAO;
  const teto = arg('--teto') ? Number(arg('--teto')) : TETO_PADRAO;
  const { achados, lidos, lidosDiario, naoConferidos } = confereContexto(raiz, { teto });
  console.log(`contexto: ${lidos} documento(s) lido(s), ${lidosDiario} arquivo(s) varrido(s) para o diário`);
  if (naoConferidos.length) console.log(`  · ${naoConferidos.length} caminho(s) em ~/ não conferido(s): esta máquina não tem ~/.claude`);
  for (const a of achados) console.log(`  ✗ [${a.regra}] ${a.arquivo}${a.linha ? `:${a.linha}` : ''} · ${a.msg}`);
  console.log(achados.length ? `\n${achados.length} achado(s)` : '\nOK');
  if (achados.length) process.exit(1);
}
