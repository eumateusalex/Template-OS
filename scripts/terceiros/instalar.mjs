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
import { AQUI, RAIZ, MANIFESTO, COMANDO, lerManifesto, caminhoDe, caminhoDoMarcador, conferirPeca, sha256, serializar } from './peca.mjs';

const MOLDES = join(AQUI, 'moldes');
// as esperas entre tentativas (ms); a prova as encurta pela variável
const ESPERAS = (process.env.TERCEIROS_ESPERAS_MS ?? '2000,5000,10000').split(',').map(Number);
const PRAZO_MS = Number(process.env.TERCEIROS_PRAZO_MS ?? 120000);
// o pacote grande não tem prazo total: cai só se passar tanto tempo sem chegar um byte
const INATIVIDADE_MS = Number(process.env.TERCEIROS_INATIVIDADE_MS ?? 30000);
const EM_PARALELO = 8;

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// ── a rede ────────────────────────────────────────────────────────────────

class Fatal extends Error {}
// o material que não está na Release (ou cuja Release não se achou): o resto da instalação segue sem ele
class SemRelease extends Fatal {}

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

/**
 * Baixa um pacote grande, com repetição, e com prazo por inatividade: a
 * requisição só cai se passar `inatividadeMs` sem chegar nenhum byte (cada
 * pedaço que chega zera o relógio), de modo que um pacote de dezenas de MB em
 * internet lenta termina, e uma conexão que travou não prende a instalação.
 */
export async function baixarPacote(url, { aviso = () => {}, inatividadeMs = INATIVIDADE_MS } = {}) {
  let ultimo;
  for (let i = 0; i <= ESPERAS.length; i++) {
    const controle = new AbortController();
    let relogio;
    const armar = () => {
      clearTimeout(relogio);
      relogio = setTimeout(() => controle.abort(new Error(`nenhum byte chegou em ${inatividadeMs / 1000} s`)), inatividadeMs);
    };
    try {
      armar();
      const r = await fetch(url, { redirect: 'follow', signal: controle.signal });
      if (r.status === 404) throw new SemRelease(`${url} respondeu 404: o pacote não está nessa Release (a versão fixada no manifesto não foi publicada)`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const partes = [];
      let recebidos = 0;
      for await (const parte of r.body) { armar(); partes.push(parte); recebidos += parte.length; }
      const esperado = Number(r.headers.get('content-length'));
      if (esperado && !r.headers.get('content-encoding') && recebidos !== esperado) throw new Error(`a resposta veio com ${recebidos} de ${esperado} bytes`);
      return Buffer.concat(partes);
    } catch (e) {
      if (e instanceof Fatal) throw e;
      ultimo = e;
      if (i < ESPERAS.length) {
        aviso(`  … ${url}: ${e.cause?.code ?? e.message}; tento de novo em ${ESPERAS[i] / 1000} s`);
        await espera(ESPERAS[i]);
      }
    } finally { clearTimeout(relogio); }
  }
  throw new Error(`não consegui baixar ${url} (${ultimo?.cause?.code ?? ultimo?.message}) em ${ESPERAS.length + 1} tentativas`);
}

/**
 * O conteúdo de um .tgz, sem a primeira pasta (`package/` no npm). Com
 * `estrito` (o pacote do material), recusa o que escapa do destino ou não é
 * arquivo comum: nome absoluto, com `..`, com unidade (`C:`) ou com barra
 * invertida, link simbólico ou físico, dispositivo, arquivo na raiz do pacote,
 * mais de uma pasta de topo, nome repetido e arquivo cortado. Nada grava aqui:
 * quem decide o caminho de gravação é o manifesto, e este leitor só prova que o
 * pacote não pede outra coisa.
 */
export function lerTar(tgz, { estrito = false } = {}) {
  const tar = gunzipSync(tgz);
  const arquivos = new Map();
  const texto = (ini, fim) => tar.subarray(ini, fim).toString('utf8').replace(/\0.*$/s, '');
  const recusa = (nome, porque) => { throw new Error(`entrada "${nome}" recusada: ${porque}`); };
  const confere = (nome) => {
    if (nome.startsWith('/') || nome.startsWith('\\')) recusa(nome, 'caminho absoluto');
    if (/^[a-zA-Z]:/.test(nome)) recusa(nome, 'caminho com unidade');
    if (nome.includes('\\')) recusa(nome, 'barra invertida no nome');
    const partes = nome.replace(/\/$/, '').split('/');
    if (partes.some((s) => s === '' || s === '.' || s === '..')) recusa(nome, 'sai da pasta de destino ou tem segmento vazio');
  };
  let topo = null;
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
    if (estrito && (!Number.isSafeInteger(tamanho) || tamanho < 0 || i + 512 + tamanho > tar.length)) recusa(nome, 'tamanho inválido ou arquivo cortado');
    const corpo = tar.subarray(i + 512, i + 512 + tamanho);
    i += 512 + Math.ceil(tamanho / 512) * 512;
    if (tipo === 'L') { nomeLongo = corpo.toString('utf8').replace(/\0.*$/s, ''); continue; }
    if (tipo === 'x') {
      const caminho = corpo.toString('utf8').match(/^\d+ path=(.*)$/m);
      if (caminho) nomeLongo = caminho[1];
      continue;
    }
    if (nomeLongo) { nome = nomeLongo; nomeLongo = null; }
    if (estrito) {
      if (!['0', '5'].includes(tipo)) recusa(nome, tipo === '1' ? 'link físico' : tipo === '2' ? 'link simbólico' : `tipo ${JSON.stringify(tipo)}, que não é arquivo nem pasta`);
      confere(nome);
      const [primeira, ...resto] = nome.replace(/\/$/, '').split('/');
      if (topo === null) topo = primeira;
      else if (primeira !== topo) recusa(nome, `fora da pasta de topo "${topo}"`);
      if (tipo === '0') {
        if (!resto.length) recusa(nome, 'arquivo na raiz do pacote, fora da pasta de topo');
        if (arquivos.has(resto.join('/'))) recusa(nome, 'repetida no pacote');
        arquivos.set(resto.join('/'), corpo);
      }
      continue;
    }
    if (tipo === '0' || tipo === '\0') arquivos.set(nome.split('/').slice(1).join('/'), Buffer.from(corpo));
  }
  return arquivos;
}

const nomeNpm = (pacote) => pacote.split('/').pop();
const urlPorPartes = (caminho) => caminho.split('/').map(encodeURIComponent).join('/');

/** Descreve a fonte em uma linha, para o --listar e para os erros. */
export function descreverFonte(f) {
  if (f.release) {
    try {
      const r = lerRelease();
      return `a Release ${r.repositorio ? `${r.repositorio} @ ${r.tag}` : r.base}`;
    } catch {
      return 'a Release do repositório de onde o workspace foi clonado (sem origin do GitHub aqui)';
    }
  }
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

// ── o material da Release: pacotes .tar.gz do próprio repositório ───────────

/** O `dono/nome` de um endereço de repositório do GitHub (https ou ssh); null quando não é do GitHub. */
export function repositorioDoEndereco(url) {
  const m = /^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(String(url ?? '').trim());
  return m ? `${m[1]}/${m[2]}` : null;
}

/** O endereço do `origin` deste workspace, ou null quando não há git ou origin. */
function origemDoClone() {
  const r = spawnSync('git', ['-C', RAIZ, 'remote', 'get-url', 'origin'], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

export const RELEASE_JSON = join(AQUI, 'release.json');
// os endereços do GitHub; a prova os troca por um servidor local (e aí o gh, que só fala com o de verdade, fica de fora)
const GITHUB = process.env.TERCEIROS_GITHUB ?? 'https://github.com';
const API_GITHUB = process.env.TERCEIROS_API_GITHUB ?? 'https://api.github.com';
const REPOSITORIO = /^[\w.-]+\/[\w.-]+$/;

/**
 * Onde moram os pacotes. O template sai só com a tag no `release.json`, sem nome
 * de dono: na primeira instalação, a Release é a do repositório de onde o
 * workspace foi clonado (o `origin`, subindo à origem dele se for fork ou
 * "Use this template"). Depois do primeiro pacote baixado, o `release.json` da
 * pessoa passa a lembrar esse repositório (`repositorio`), e o lembrado vale
 * acima do origin: com o origin já trocado para o repositório dela, o material
 * continua se achando. Para teste, `TERCEIROS_RELEASE_URL` aponta a pasta que
 * serve os assets. Devolve a base da URL, que termina em barra.
 */
export function lerRelease(env = process.env, origem = origemDoClone, arquivo = RELEASE_JSON) {
  if (env.TERCEIROS_RELEASE_URL) {
    const base = env.TERCEIROS_RELEASE_URL.endsWith('/') ? env.TERCEIROS_RELEASE_URL : `${env.TERCEIROS_RELEASE_URL}/`;
    return { base };
  }
  const { tag, repositorio: lembrado } = JSON.parse(readFileSync(arquivo, 'utf8'));
  if (!/^[\w.-]+$/.test(tag ?? '')) throw new Fatal('release.json inválido: pede a "tag" da Release do material');
  if (lembrado !== undefined) {
    if (!REPOSITORIO.test(lembrado)) throw new Fatal(`release.json inválido: o "repositorio" tem de ser dono/nome, e veio ${JSON.stringify(lembrado)}`);
    return { repositorio: lembrado, tag, base: `${GITHUB}/${lembrado}/releases/download/${tag}/`, lembrado: true };
  }
  const endereco = typeof origem === 'function' ? origem() : origem;
  const repositorio = repositorioDoEndereco(endereco);
  if (!repositorio) {
    throw new SemRelease(`o material vem da Release do repositório de onde este workspace foi clonado, e ${endereco ? `o origin (${endereco}) não é do GitHub` : 'este workspace não tem o origin do git (veio por zip?)'}. Clone o template pelo git, ponha "repositorio": "dono/nome" do template em scripts/terceiros/release.json, ou aponte TERCEIROS_RELEASE_URL para a pasta com os pacotes`);
  }
  return { repositorio, tag, base: `${GITHUB}/${repositorio}/releases/download/${tag}/`, lembrado: false };
}

/** Grava no `release.json` o repositório de onde o material veio, uma vez; a tag fica. */
export function lembrarRepositorio(repositorio, arquivo = RELEASE_JSON) {
  if (!REPOSITORIO.test(repositorio ?? '')) return false;
  const atual = JSON.parse(readFileSync(arquivo, 'utf8'));
  if (atual.repositorio) return false;
  writeFileSync(arquivo, `${JSON.stringify({ ...atual, repositorio }, null, 2)}\n`);
  return true;
}

/**
 * Fork e repositório criado por "Use this template" não herdam a Release: a API
 * do GitHub diz de onde ele veio (`source`, `template_repository`), e o material
 * se busca lá, subindo até 3 degraus. Sem resposta da API, fica o próprio origin.
 */
export async function subirAteAOrigem(repositorio, buscarJson = buscarJsonDoGitHub) {
  let atual = repositorio;
  for (let i = 0; i < 3; i++) {
    let j;
    try { j = await buscarJson(`${API_GITHUB}/repos/${atual}`); } catch { return atual; }
    const acima = j?.source?.full_name ?? j?.parent?.full_name ?? j?.template_repository?.full_name ?? null;
    if (!acima || acima === atual) return atual;
    atual = acima;
  }
  return atual;
}

// o repositório privado não responde à API sem login: o `gh`, quando a pessoa o
// tem logado, enxerga o dela e diz de onde ele veio
async function buscarJsonDoGitHub(url) {
  try {
    const r = await fetch(url, { headers: { accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(10000) });
    if (r.ok) return r.json();
  } catch { /* sem rede ou sem resposta: tenta o gh */ }
  if (process.env.TERCEIROS_API_GITHUB) throw new Error(`${url} não respondeu`);
  const g = spawnSync('gh', ['api', url.replace(`${API_GITHUB}/`, '')], { encoding: 'utf8', timeout: 15000 });
  if (g.status === 0) return JSON.parse(g.stdout);
  throw new Error(`${url} não respondeu`);
}

let releaseResolvida = null;
/** A Release, resolvida uma vez por execução: a lembrada, ou o origin e a origem dele. */
function releaseDoMaterial() {
  releaseResolvida ??= (async () => {
    const r = lerRelease();
    if (!r.repositorio || r.lembrado) return r;
    const de = await subirAteAOrigem(r.repositorio);
    return { ...r, repositorio: de, base: `${GITHUB}/${de}/releases/download/${r.tag}/` };
  })();
  return releaseResolvida;
}

/**
 * Instala uma peça de material: um pacote por vez. Cada pacote é baixado, tem o
 * sha256 conferido ANTES de abrir, é aberto pelo leitor estrito (que recusa o
 * que escapa do destino), tem cada arquivo conferido contra o manifesto e só
 * então grava, cada arquivo por `.baixando` e `rename`. O marcador sai por
 * último: pacote sem ele (ou com outro sha256) não conta como instalado.
 * Falha em qualquer ponto antes da gravação não deixa nada gravado.
 */
async function instalarPacotes(peca, { raiz, aviso }) {
  let gravados = 0;
  for (const pc of peca.pacotes) {
    const meus = peca.arquivos.filter((a) => a.pacote === pc.asset);
    if (conferirPeca({ ...peca, arquivos: meus, pacotes: [pc] }, raiz).ok) continue;
    const release = await releaseDoMaterial();
    const url = `${release.base}${pc.asset}`;
    aviso(`  ↓ ${pc.asset} (${kb(pc.bytes)})`);
    const pronto = await baixarPacote(url, { aviso }).then((buf) => {
      if (sha256(buf) !== pc.sha256) throw new Fatal(`${pc.asset}: o pacote baixado não é o esperado (impressão ${sha256(buf).slice(0, 12)}…, o manifesto pede ${pc.sha256.slice(0, 12)}…); nada foi gravado. Download cortado no meio se resolve repetindo; se repetir der a mesma impressão, o pacote da Release não é o desta versão do template: atualize o template (git pull) ou avise quem publicou a Release`);
      let lidos;
      try { lidos = lerTar(buf, { estrito: true }); } catch (e) { throw new Fatal(`${pc.asset}: pacote recusado (${e.message}); nada foi gravado`); }
      const esperados = new Set(meus.map((a) => a.para));
      const sobra = [...lidos.keys()].filter((k) => !esperados.has(k));
      const falta = [...esperados].filter((k) => !lidos.has(k));
      if (sobra.length || falta.length) throw new Fatal(`${pc.asset}: o conteúdo não bate com o manifesto (sobra ${sobra.slice(0, 3).join(', ') || '-'}; falta ${falta.slice(0, 3).join(', ') || '-'}); nada foi gravado`);
      for (const a of meus) {
        const conteudo = lidos.get(a.para);
        if (sha256(conteudo) !== a.sha256) throw new Fatal(`${pc.asset}: ${a.para} dentro do pacote não é o arquivo esperado (impressão ${sha256(conteudo).slice(0, 12)}…, o manifesto pede ${a.sha256.slice(0, 12)}…); nada foi gravado`);
      }
      return lidos;
    });
    for (const a of meus) {
      const destino = caminhoDe(raiz, peca, a.para);
      mkdirSync(dirname(destino), { recursive: true });
      const provisorio = `${destino}.baixando`;
      writeFileSync(provisorio, pronto.get(a.para));
      renameSync(provisorio, destino);
    }
    const marcador = caminhoDoMarcador(raiz, peca, pc.asset);
    writeFileSync(`${marcador}.baixando`, `${JSON.stringify({ asset: pc.asset, sha256: pc.sha256, arquivos: meus.length })}\n`);
    renameSync(`${marcador}.baixando`, marcador);
    gravados += meus.length;
    if (release.repositorio && !release.lembrado && lembrarRepositorio(release.repositorio)) {
      aviso(`  · o scripts/terceiros/release.json agora lembra que o material vem de ${release.repositorio}: ele entra no commit da instalação, e o material continua se achando depois que o origin virar o seu repositório`);
      release.lembrado = true;
    }
  }
  return { gravados };
}

// ── a junção que a peça pede (o plugin que o Claude Code lê de ~/.claude) ─

/** O estado do link da peça em ~/: null quando a peça não pede link. */
export function estadoDaJuncao(peca, raiz, casa = homedir()) {
  if (!peca.juncao) return null;
  const link = join(casa, ...peca.juncao.replace(/^~\//, '').split('/'));
  const alvo = resolve(raiz, peca.destino);
  let estado = 'falta';
  let servindo = null;
  let existe = true;
  try { lstatSync(link); } catch { existe = false; }
  if (existe) {
    // o alvo pode ainda não ter baixado: compara com o caminho que ele terá
    const real = (p) => { try { return realpathSync(p); } catch { return null; } };
    servindo = real(link);
    const daqui = real(alvo) ?? alvo;
    estado = servindo === null ? 'aponta para um lugar que não existe mais'
      : servindo.toLowerCase() === daqui.toLowerCase() ? 'ok' : 'aponta para outro lugar';
  }
  const windows = platform() === 'win32';
  // o link que aponta para outro lugar sai antes: o rmdir e o rm sem -r tiram
  // só o link, e recusam pasta de verdade (nunca `rm -rf`, que atravessa a junção)
  const tirar = estado === 'falta' ? '' : windows ? `cmd /c rmdir "${link}"; ` : `rm "${link}" && `;
  const comando = windows
    ? `${tirar}New-Item -ItemType Directory -Force "${dirname(link)}" | Out-Null; New-Item -ItemType Junction -Path "${link}" -Target "${alvo}"`
    : `${tirar}mkdir -p "${dirname(link)}" && ln -s "${alvo}" "${link}"`;
  // o link de pé em outra cópia do workspace: recriá-lo aqui tira o motor de lá
  const aviso = estado === 'aponta para outro lugar'
    ? `hoje ele serve ${servindo}; recriá-lo aqui tira o Remotion de lá. Só rode com o sim de quem usa aquela cópia:`
    : null;
  return { link, alvo, estado, servindo, aviso, comando, onde: windows ? 'no PowerShell, sem administrador' : 'no terminal' };
}

/** A linha que diz o passo do link, com o aviso quando ele serve outra cópia. */
function linhaDaJuncao(j, inicio) {
  return `  · ${inicio}o link ${j.link} ${j.estado}. ${j.aviso ?? `Crie-o ${j.onde} e reinicie o Claude Code:`}\n      ${j.comando}`;
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
    log(`peças de terceiro: ${pecas.length}, ${pecas.reduce((s, p) => s + p.arquivos.length, 0)} arquivos, ${kb(total)} no disco`);
    const pacotes = pecas.flatMap((p) => p.pacotes ?? []);
    if (pacotes.length) log(`o material pesado vem de ${pacotes.length} pacotes da Release do repositório: ${kb(pacotes.reduce((t, x) => t + x.bytes, 0))} para baixar`);
    log('');
    for (const p of pecas) {
      log(`${p.id} · ${p.descricao}`);
      log(`  para ${p.destino}/ (${p.arquivos.length} arquivo${p.arquivos.length > 1 ? 's' : ''}, ${kb(p.arquivos.reduce((t, a) => t + (a.bytes ?? 0), 0))})`);
      const usadas = new Set(p.arquivos.filter((a) => !a.molde || a.dados || a.simbolos).map((a) => a.fonte ?? Object.keys(p.fontes)[0]));
      for (const nome of usadas) log(`  de ${descreverFonte(p.fontes[nome])}`);
      if (p.pacotes) log(`  baixa ${p.pacotes.length} pacote${p.pacotes.length > 1 ? 's' : ''} (${kb(p.pacotes.reduce((t, x) => t + x.bytes, 0))}): ${p.pacotes.map((x) => x.asset).join(', ')}`);
      if (p.arquivos.some((a) => a.subconjunto)) log(`  o subconjunto da fonte se faz aqui, pelo Python com fonttools ${manifesto.python.fonttools}`);
      if (p.juncao) log(`  e um link em ${p.juncao}, que você cria uma vez (o --conferir diz o comando)`);
    }
    return 0;
  }

  if (args.conferir) {
    let ruim = 0;
    let linkPendente = false;
    for (const p of pecas) {
      const { faltando, divergentes, semMarcador, ok } = conferirPeca(p, args.raiz);
      if (ok) log(`✓ ${p.id}`);
      else {
        ruim++;
        log(`✗ ${p.id} · ${p.destino}/`);
        for (const f of faltando.slice(0, 5)) log(`    falta     ${f}`);
        if (faltando.length > 5) log(`    falta     … e mais ${faltando.length - 5}`);
        for (const d of divergentes.slice(0, 5)) log(`    diverge   ${d.para} (impressão ${d.veio.slice(0, 12)}…, o manifesto pede ${d.esperado.slice(0, 12)}…)`);
        if (divergentes.length > 5) log(`    diverge   … e mais ${divergentes.length - 5}`);
        if (!faltando.length && !divergentes.length) for (const a of semMarcador) log(`    pacote    ${a} sem marcador de instalação (ou de outra versão)`);
      }
      const j = estadoDaJuncao(p, args.raiz);
      if (j && j.estado !== 'ok') { linkPendente = true; log(linhaDaJuncao(j, '')); }
    }
    if (ruim) log(`\n${ruim} peça(s) incompleta(s): rode \`${COMANDO}\`${ruim < pecas.length ? ` --so ${pecas.filter((p) => !conferirPeca(p, args.raiz).ok).map((p) => p.id).join(',')}` : ''}`);
    else log(linkPendente ? '\nOK nas peças; o link acima ainda falta (só pede quem vai fazer vídeo animado em código)' : '\nOK');
    return ruim ? 1 : 0;
  }

  const buscar = criarBuscador(log);
  const cache = new Map();
  const falhas = [];
  const semRelease = [];
  for (const p of pecas) {
    try {
      if (args.impressoes && p.pacotes) { log(`· ${p.id}: as impressões do material vêm do empacotador, não se regravam aqui`); continue; }
      const { gravados } = p.pacotes ? await instalarPacotes(p, { raiz: args.raiz, aviso: log }) : await instalarPeca(p, { raiz: args.raiz, manifesto, buscar, cache, impressoes: args.impressoes });
      if (args.impressoes) log(`· ${p.id}: impressões lidas`);
      else log(gravados ? `✓ ${p.id}: ${gravados} arquivo(s) em ${p.destino}/` : `✓ ${p.id}: já instalada`);
      const j = args.impressoes ? null : estadoDaJuncao(p, args.raiz);
      if (j && j.estado !== 'ok') log(linhaDaJuncao(j, 'falta um passo seu: '));
    } catch (e) {
      falhas.push(p.id);
      if (e instanceof SemRelease) semRelease.push(p.id);
      log(`✗ ${p.id}: ${e.message}`);
    }
  }
  if (args.impressoes) {
    if (!falhas.length) { writeFileSync(args.manifesto, serializar(manifesto)); log(`\nimpressões gravadas em ${relative(process.cwd(), args.manifesto) || args.manifesto}`); }
    return falhas.length ? 1 : 0;
  }
  if (falhas.length) {
    log(`\n${falhas.length} peça(s) sem instalar: ${falhas.join(', ')}. O que já estava instalado ficou como estava.`);
    // repetir não resolve um 404: o material de vídeo se diz à parte, e o resto segue sem ele
    if (semRelease.length) log(`O material de vídeo (${semRelease.join(', ')}) não está publicado na Release, ou ela não se achou: repetir não resolve. O resto funciona sem ele; só o vídeo em motion o usa. Quando a Release existir (ou com "repositorio": "dono/nome" do template em scripts/terceiros/release.json), rode \`${COMANDO} --so ${semRelease.join(',')}\`.`);
    const outras = falhas.filter((id) => !semRelease.includes(id));
    if (outras.length) log(`O que fazer: confira a internet (ou o que a mensagem acima pede) e rode de novo \`${COMANDO} --so ${outras.join(',')}\`.`);
    return 1;
  }
  log('\nOK');
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  principal(process.argv.slice(2)).then((codigo) => { process.exitCode = codigo; }, (e) => { console.error(`✗ ${e.message}`); process.exitCode = 1; });
}
