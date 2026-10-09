#!/usr/bin/env node
// Instala as peças de terceiro, baixadas da fonte oficial, no caminho que o
// workspace cita.
//
// O que cada peça é, de onde vem (com versão fixa), para onde vai e a impressão
// sha256 de cada arquivo final mora no `manifesto.json` desta pasta. O que é da
// fonte vem baixado; o que organiza a peça aqui (o roteador de uma skill, um
// README) sai de um molde em `moldes/`. Nada disto entra no git: o `.gitignore`
// da raiz ignora cada destino.
//
// Uso:
//   node scripts/terceiros/instalar.mjs              instala o que falta ou diverge
//   node scripts/terceiros/instalar.mjs --so <peça>  só uma peça (vírgula para várias)
//   node scripts/terceiros/instalar.mjs --listar     o que será instalado e de onde
//   node scripts/terceiros/instalar.mjs --conferir   o que falta ou diverge, sem baixar
//   --em <pasta>          outra raiz (a prova instala numa pasta temporária)
//   --manifesto <arq>     outro manifesto (a prova usa um de mentira)
//   --impressoes          baixa e regrava no manifesto a impressão de cada arquivo,
//                         sem gravar nos destinos: é o passo de quem troca a versão
//
// Idempotente: arquivo com a impressão certa não se baixa de novo. Falha de rede
// repete com intervalo; se continuar, a peça fica como estava e a saída diz o
// que fazer. Grava só dentro do destino de cada peça. Sai 1 se algo faltar.
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, rmSync, mkdtempSync, lstatSync, realpathSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { join, resolve, dirname, basename, relative } from 'node:path';
import { tmpdir, homedir, platform } from 'node:os';
import { pathToFileURL } from 'node:url';
import { AQUI, RAIZ, MANIFESTO, COMANDO, lerManifesto, caminhoDe, conferirPeca, sha256, serializar } from './peca.mjs';

const MOLDES = join(AQUI, 'moldes');
// as esperas entre tentativas (ms); a prova as encurta pela variável
const ESPERAS = (process.env.TERCEIROS_ESPERAS_MS ?? '2000,5000,10000').split(',').map(Number);
const PRAZO_MS = Number(process.env.TERCEIROS_PRAZO_MS ?? 120000);
const EM_PARALELO = 8;

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// ── a rede ────────────────────────────────────────────────────────────────

class Fatal extends Error {}

/** Baixa com repetição: erro de rede e 5xx repetem, 404 é a versão que sumiu. */
export async function baixar(url, { aviso = () => {} } = {}) {
  let ultimo;
  for (let i = 0; i <= ESPERAS.length; i++) {
    try {
      const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(PRAZO_MS) });
      if (r.status === 404) throw new Fatal(`${url} respondeu 404: a versão fixada no manifesto não está mais nessa fonte`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) {
      if (e instanceof Fatal) throw e;
      ultimo = e;
      if (i < ESPERAS.length) {
        aviso(`  … ${url}: ${e.cause?.code ?? e.message}; tento de novo em ${ESPERAS[i] / 1000} s`);
        await espera(ESPERAS[i]);
      }
    }
  }
  throw new Error(`não consegui baixar ${url} (${ultimo?.cause?.code ?? ultimo?.message}) em ${ESPERAS.length + 1} tentativas`);
}

/** O conteúdo de um .tgz do npm, sem a primeira pasta (`package/`). */
export function lerTar(tgz) {
  const tar = gunzipSync(tgz);
  const arquivos = new Map();
  const texto = (ini, fim) => tar.subarray(ini, fim).toString('utf8').replace(/\0.*$/s, '');
  let i = 0;
  let nomeLongo = null;
  while (i + 512 <= tar.length) {
    const cabeca = tar.subarray(i, i + 512);
    if (cabeca.every((b) => b === 0)) break;
    let nome = texto(i, i + 100);
    const prefixo = texto(i + 345, i + 500);
    if (prefixo) nome = `${prefixo}/${nome}`;
    const tamanho = parseInt(texto(i + 124, i + 136).trim() || '0', 8);
    const tipo = String.fromCharCode(cabeca[156] || 48);
    const corpo = tar.subarray(i + 512, i + 512 + tamanho);
    i += 512 + Math.ceil(tamanho / 512) * 512;
    if (tipo === 'L') { nomeLongo = corpo.toString('utf8').replace(/\0.*$/s, ''); continue; }
    if (tipo === 'x') {
      const caminho = corpo.toString('utf8').match(/^\d+ path=(.*)$/m);
      if (caminho) nomeLongo = caminho[1];
      continue;
    }
    if (nomeLongo) { nome = nomeLongo; nomeLongo = null; }
    if (tipo === '0' || tipo === '\0') arquivos.set(nome.split('/').slice(1).join('/'), Buffer.from(corpo));
  }
  return arquivos;
}

const nomeNpm = (pacote) => pacote.split('/').pop();
const urlPorPartes = (caminho) => caminho.split('/').map(encodeURIComponent).join('/');

/** Descreve a fonte em uma linha, para o --listar e para os erros. */
export function descreverFonte(f) {
  if (f.npm) return `npm ${f.npm}@${f.versao}`;
  if (f.github) return `github ${f.github} @ ${f.ref.length === 40 ? f.ref.slice(0, 12) : f.ref}`;
  return f.url;
}

/** Busca os bytes de `de` numa fonte, guardando o pacote inteiro do npm entre arquivos. */
function criarBuscador(aviso) {
  const pacotes = new Map();
  return async (fonte, de) => {
    if (fonte.npm) {
      const url = `https://registry.npmjs.org/${fonte.npm}/-/${nomeNpm(fonte.npm)}-${fonte.versao}.tgz`;
      if (!pacotes.has(url)) pacotes.set(url, baixar(url, { aviso }).then(lerTar));
      const conteudo = await pacotes.get(url);
      if (!conteudo.has(de)) throw new Fatal(`${descreverFonte(fonte)} não tem ${de}`);
      return conteudo.get(de);
    }
    if (fonte.github) return baixar(`https://raw.githubusercontent.com/${fonte.github}/${fonte.ref}/${urlPorPartes(de)}`, { aviso });
    return baixar(`${fonte.url}${urlPorPartes(de)}`, { aviso });
  };
}

// ── o arquivo final ─────────────────────────────────────────────────────

const pegar = (obj, caminho) => caminho.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

function preencher(texto, dados, origem) {
  return texto.replace(/\{\{([\w$.]+)\}\}/g, (_, chave) => {
    const v = pegar(dados, chave);
    if (v === undefined) throw new Fatal(`${origem}: o molde pede {{${chave}}}, e a fonte não tem esse campo`);
    return String(v);
  });
}

/** O Python com o fontTools na versão que o manifesto fixa (o subconjunto de fonte depende dela). */
function pythonDoSubconjunto(versoes) {
  const pede = `fonttools==${versoes.fonttools} brotli==${versoes.brotli}`;
  let achado = null;
  for (const exe of ['python', 'python3', 'py']) {
    const r = spawnSync(exe, ['-I', '-c', 'import fontTools, brotli; print(fontTools.version, brotli.__version__)'], { encoding: 'utf8' });
    if (r.status !== 0) continue;
    const [ft, br] = r.stdout.trim().split(/\s+/);
    if (ft === versoes.fonttools && br === versoes.brotli) return exe;
    achado ??= `${exe} tem fonttools ${ft} e brotli ${br}`;
  }
  throw new Fatal(`o subconjunto da fonte pede o Python com ${pede}${achado ? ` (${achado})` : ''}: rode \`python -m pip install ${pede}\` e repita`);
}

function subconjunto(fonte, { unicodes, opcoes = [] }, versoes) {
  const exe = pythonDoSubconjunto(versoes);
  const pasta = mkdtempSync(join(tmpdir(), 'terceiros-fonte-'));
  try {
    const entrada = join(pasta, 'entrada.woff2');
    const saida = join(pasta, 'saida.woff2');
    writeFileSync(entrada, fonte);
    const r = spawnSync(exe, ['-I', '-m', 'fontTools.subset', entrada, `--unicodes=${unicodes}`, '--flavor=woff2', `--output-file=${saida}`, ...opcoes], { encoding: 'utf8' });
    if (r.status !== 0) throw new Fatal(`o fontTools não fez o subconjunto: ${(r.stderr || r.stdout).trim().split('\n').pop()}`);
    return readFileSync(saida);
  } finally { rmSync(pasta, { recursive: true, force: true }); }
}

/** Os bytes finais de um arquivo da peça: baixado, recortado, trocado ou montado do molde. */
async function montar(peca, a, buscar, manifesto, cache) {
  const fonte = peca.fontes[a.fonte ?? Object.keys(peca.fontes)[0]];
  const chave = (x) => `${JSON.stringify(fonte)}|${x}`;
  const de = async (caminho) => {
    if (!cache.has(chave(caminho))) cache.set(chave(caminho), buscar(fonte, caminho));
    return cache.get(chave(caminho));
  };
  let buf;
  if (a.molde) {
    let texto = readFileSync(join(MOLDES, a.molde), 'utf8');
    if (a.dados) texto = preencher(texto, JSON.parse((await de(a.dados)).toString('utf8')), a.molde);
    if (a.simbolos) {
      const { prefixo, icones } = a.simbolos;
      const linhas = [];
      for (const caminho of icones) {
        const svg = (await de(caminho)).toString('utf8');
        const m = svg.match(/^<svg[^>]*\sviewBox="([^"]+)"[^>]*>([\s\S]*)<\/svg>\s*$/);
        if (!m) throw new Fatal(`${caminho} não é um SVG de um elemento só`);
        linhas.push(`<symbol id="${prefixo}${basename(caminho, '.svg')}" viewBox="${m[1]}">${m[2]}</symbol>`);
      }
      texto = texto.replace('{{simbolos}}', linhas.join('\n'));
    }
    buf = Buffer.from(texto, 'utf8');
  } else {
    buf = await de(a.de);
    if (a.json) buf = Buffer.from(String(pegar(JSON.parse(buf.toString('utf8')), a.json)), 'utf8');
    if (a.trecho) {
      const t = buf.toString('utf8');
      const ini = t.indexOf(a.trecho[0]);
      const fim = t.indexOf(a.trecho[1], ini);
      if (ini < 0 || fim < 0) throw new Fatal(`${a.de} não tem o trecho entre "${a.trecho[0]}" e "${a.trecho[1]}"`);
      buf = Buffer.from(t.slice(ini, fim), 'utf8');
    }
    if (a.subconjunto) {
      const k = chave(`${a.de}#${JSON.stringify(a.subconjunto)}`);
      if (!cache.has(k)) cache.set(k, Promise.resolve().then(() => subconjunto(buf, a.subconjunto, manifesto.python)));
      buf = await cache.get(k);
    }
  }
  if (a.trocas) {
    let t = buf.toString('utf8');
    for (const [antes, depois] of a.trocas) t = t.split(antes).join(depois);
    buf = Buffer.from(t, 'utf8');
  }
  return buf;
}

/** Roda as tarefas com no máximo `n` ao mesmo tempo. */
async function emLotes(itens, n, tarefa) {
  const fila = [...itens];
  const saidas = [];
  await Promise.all(Array.from({ length: Math.min(n, fila.length) }, async () => {
    while (fila.length) { const item = fila.shift(); saidas.push(await tarefa(item)); }
  }));
  return saidas;
}

// ── a peça ──────────────────────────────────────────────────────────────

/**
 * Instala uma peça: só baixa o que falta ou diverge, monta tudo na memória e
 * só então grava. Se um arquivo falhar, nenhum arquivo da peça muda.
 */
async function instalarPeca(peca, { raiz, manifesto, buscar, cache, impressoes }) {
  const { faltando, divergentes } = impressoes ? { faltando: peca.arquivos.map((a) => a.para), divergentes: [] } : conferirPeca(peca, raiz);
  const precisa = new Set([...faltando, ...divergentes.map((d) => d.para)]);
  if (!precisa.size) return { gravados: 0 };
  const alvo = peca.arquivos.filter((a) => precisa.has(a.para));
  const prontos = await emLotes(alvo, EM_PARALELO, async (a) => {
    const buf = await montar(peca, a, buscar, manifesto, cache);
    if (!impressoes && sha256(buf) !== a.sha256) {
      throw new Fatal(`${peca.destino}/${a.para}: o que veio de ${descreverFonte(peca.fontes[a.fonte ?? Object.keys(peca.fontes)[0]])} não é o arquivo esperado (impressão ${sha256(buf).slice(0, 12)}…, o manifesto pede ${String(a.sha256).slice(0, 12)}…)`);
    }
    return { a, buf };
  });
  if (impressoes) {
    for (const { a, buf } of prontos) { a.sha256 = sha256(buf); a.bytes = buf.length; }
    return { gravados: 0 };
  }
  for (const { a, buf } of prontos) {
    const destino = caminhoDe(raiz, peca, a.para);
    mkdirSync(dirname(destino), { recursive: true });
    const provisorio = `${destino}.baixando`;
    writeFileSync(provisorio, buf);
    renameSync(provisorio, destino);
  }
  return { gravados: prontos.length };
}

// ── a junção que a peça pede (o plugin que o Claude Code lê de ~/.claude) ─

/** O estado do link da peça em ~/: null quando a peça não pede link. */
export function estadoDaJuncao(peca, raiz, casa = homedir()) {
  if (!peca.juncao) return null;
  const link = join(casa, ...peca.juncao.replace(/^~\//, '').split('/'));
  const alvo = resolve(raiz, peca.destino);
  let estado = 'falta';
  try {
    lstatSync(link);
    estado = realpathSync(link) === realpathSync(alvo) ? 'ok' : 'aponta para outro lugar';
  } catch { /* não existe */ }
  const windows = platform() === 'win32';
  // o link que aponta para outro lugar sai antes: o rmdir e o rm sem -r tiram
  // só o link, e recusam pasta de verdade (nunca `rm -rf`, que atravessa a junção)
  const tirar = estado === 'falta' ? '' : windows ? `cmd /c rmdir "${link}"; ` : `rm "${link}" && `;
  const comando = windows
    ? `${tirar}New-Item -ItemType Directory -Force "${dirname(link)}" | Out-Null; New-Item -ItemType Junction -Path "${link}" -Target "${alvo}"`
    : `${tirar}mkdir -p "${dirname(link)}" && ln -s "${alvo}" "${link}"`;
  return { link, alvo, estado, comando, onde: windows ? 'no PowerShell, sem administrador' : 'no terminal' };
}

// ── a linha de comando ──────────────────────────────────────────────────

function lerArgs(argv) {
  const valor = (n) => { const i = argv.indexOf(n); return i > -1 ? argv[i + 1] : undefined; };
  const conhecidos = new Set(['--so', '--em', '--manifesto', '--listar', '--conferir', '--impressoes']);
  for (const [i, a] of argv.entries()) {
    if (a.startsWith('--') && !conhecidos.has(a)) throw new Error(`opção desconhecida: ${a}`);
    if (['--so', '--em', '--manifesto'].includes(a) && (argv[i + 1] === undefined || argv[i + 1].startsWith('--'))) throw new Error(`${a} pede um valor`);
  }
  return {
    so: valor('--so')?.split(',').map((s) => s.trim()).filter(Boolean),
    raiz: valor('--em') ? resolve(valor('--em')) : RAIZ,
    manifesto: valor('--manifesto') ? resolve(valor('--manifesto')) : MANIFESTO,
    listar: argv.includes('--listar'),
    conferir: argv.includes('--conferir'),
    impressoes: argv.includes('--impressoes'),
  };
}

const kb = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1).replace('.', ',')} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export async function principal(argv, { log = console.log } = {}) {
  let args;
  try { args = lerArgs(argv); } catch (e) { log(`✗ ${e.message}`); return 2; }
  const manifesto = lerManifesto(args.manifesto);
  const pecas = args.so ? args.so.map((id) => manifesto.pecas.find((p) => p.id === id) ?? id) : manifesto.pecas;
  const desconhecidas = pecas.filter((p) => typeof p === 'string');
  if (desconhecidas.length) {
    log(`✗ não há peça ${desconhecidas.map((p) => `"${p}"`).join(', ')} no manifesto (há: ${manifesto.pecas.map((p) => p.id).join(', ')})`);
    return 2;
  }

  if (args.listar) {
    const total = pecas.reduce((s, p) => s + p.arquivos.reduce((t, a) => t + (a.bytes ?? 0), 0), 0);
    log(`peças de terceiro: ${pecas.length}, ${pecas.reduce((s, p) => s + p.arquivos.length, 0)} arquivos, ${kb(total)} no disco\n`);
    for (const p of pecas) {
      log(`${p.id} · ${p.descricao}`);
      log(`  para ${p.destino}/ (${p.arquivos.length} arquivo${p.arquivos.length > 1 ? 's' : ''}, ${kb(p.arquivos.reduce((t, a) => t + (a.bytes ?? 0), 0))})`);
      const usadas = new Set(p.arquivos.filter((a) => !a.molde || a.dados || a.simbolos).map((a) => a.fonte ?? Object.keys(p.fontes)[0]));
      for (const nome of usadas) log(`  de ${descreverFonte(p.fontes[nome])}`);
      if (p.arquivos.some((a) => a.subconjunto)) log(`  o subconjunto da fonte se faz aqui, pelo Python com fonttools ${manifesto.python.fonttools}`);
      if (p.juncao) log(`  e um link em ${p.juncao}, que você cria uma vez (o --conferir diz o comando)`);
    }
    return 0;
  }

  if (args.conferir) {
    let ruim = 0;
    for (const p of pecas) {
      const { faltando, divergentes, ok } = conferirPeca(p, args.raiz);
      if (ok) log(`✓ ${p.id}`);
      else {
        ruim++;
        log(`✗ ${p.id} · ${p.destino}/`);
        for (const f of faltando.slice(0, 5)) log(`    falta     ${f}`);
        if (faltando.length > 5) log(`    falta     … e mais ${faltando.length - 5}`);
        for (const d of divergentes.slice(0, 5)) log(`    diverge   ${d.para} (impressão ${d.veio.slice(0, 12)}…, o manifesto pede ${d.esperado.slice(0, 12)}…)`);
        if (divergentes.length > 5) log(`    diverge   … e mais ${divergentes.length - 5}`);
      }
      const j = estadoDaJuncao(p, args.raiz);
      if (j && j.estado !== 'ok') log(`  · o link ${j.link} ${j.estado}; crie-o ${j.onde}:\n      ${j.comando}`);
    }
    if (ruim) log(`\n${ruim} peça(s) incompleta(s): rode \`${COMANDO}\`${ruim < pecas.length ? ` --so ${pecas.filter((p) => !conferirPeca(p, args.raiz).ok).map((p) => p.id).join(',')}` : ''}`);
    else log('\nOK');
    return ruim ? 1 : 0;
  }

  const buscar = criarBuscador(log);
  const cache = new Map();
  const falhas = [];
  for (const p of pecas) {
    try {
      const { gravados } = await instalarPeca(p, { raiz: args.raiz, manifesto, buscar, cache, impressoes: args.impressoes });
      if (args.impressoes) log(`· ${p.id}: impressões lidas`);
      else log(gravados ? `✓ ${p.id}: ${gravados} arquivo(s) em ${p.destino}/` : `✓ ${p.id}: já instalada`);
      const j = args.impressoes ? null : estadoDaJuncao(p, args.raiz);
      if (j && j.estado !== 'ok') log(`  · falta um passo seu: o link ${j.link} ${j.estado}. Crie-o ${j.onde} e reinicie o Claude Code:\n      ${j.comando}`);
    } catch (e) {
      falhas.push(p.id);
      log(`✗ ${p.id}: ${e.message}`);
    }
  }
  if (args.impressoes) {
    if (!falhas.length) { writeFileSync(args.manifesto, serializar(manifesto)); log(`\nimpressões gravadas em ${relative(process.cwd(), args.manifesto) || args.manifesto}`); }
    return falhas.length ? 1 : 0;
  }
  if (falhas.length) {
    log(`\n${falhas.length} peça(s) sem instalar: ${falhas.join(', ')}. O que já estava instalado ficou como estava.`);
    log(`O que fazer: confira a internet (ou o que a mensagem acima pede) e rode de novo \`${COMANDO} --so ${falhas.join(',')}\`.`);
    return 1;
  }
  log('\nOK');
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  principal(process.argv.slice(2)).then((codigo) => { process.exitCode = codigo; }, (e) => { console.error(`✗ ${e.message}`); process.exitCode = 1; });
}
