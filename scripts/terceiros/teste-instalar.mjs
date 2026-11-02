#!/usr/bin/env node
// Prova do instalador das peças de terceiro.
//
// Parte 1, sem internet: um manifesto de mentira servido por um servidor local
// prova a repetição da rede (falha que passa, falha que fica, 404), a recusa
// de impressão errada e de caminho que sai do destino, a idempotência, o
// `--conferir` acusando arquivo faltando e divergente, o `--listar` e que nada
// se grava fora do destino. O leitor de .tgz se prova com um pacote montado aqui.
//
// Parte 2, com internet (pula com --sem-rede): instala o manifesto de verdade
// numa pasta temporária, confere tudo pelo `--conferir`, estraga um arquivo e
// apaga outro e vê o `--conferir` acusar e a reinstalação consertar. Com
// `--antes <pasta>` (uma cópia do workspace de quando as peças moravam no git),
// compara byte a byte cada arquivo instalado com o de lá, e cada diferença
// conhecida é provada pelo que ela é (a lista DIFERENCAS, abaixo).
//
// Uso:  node scripts/terceiros/teste-instalar.mjs [--sem-rede] [--antes <pasta>]
import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, cpSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, mkdirSync, symlinkSync, realpathSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { randomBytes } from 'node:crypto';
import { join, relative, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { AQUI, RAIZ, lerManifesto, contratoDe, exigirPeca, sha256, caminhoDoMarcador } from './peca.mjs';
import { lerTar, estadoDaJuncao, lerRelease, subirAteAOrigem, lembrarRepositorio } from './instalar.mjs';

const INSTALADOR = join(AQUI, 'instalar.mjs');
const argv = process.argv.slice(2);
const SEM_REDE = argv.includes('--sem-rede');
const ANTES = argv.includes('--antes') ? argv[argv.indexOf('--antes') + 1] : null;
// a pasta que mudou de nome desde o antes, como [nome novo, nome velho]: o antes a tem com o nome velho
const RENOMEADAS = [];

let passou = 0;
let falhou = 0;
function afirma(nome, condicao, detalhe = '') {
  if (condicao) { passou++; console.log(`  ok    ${nome}`); } else { falhou++; console.log(`  FALHOU ${nome}${detalhe ? ` · ${String(detalhe).slice(0, 600)}` : ''}`); }
}

const pastas = [];
const temporaria = (prefixo) => { const p = mkdtempSync(join(tmpdir(), prefixo)); pastas.push(p); return p; };

/** Roda o instalador num processo à parte, sem travar o servidor local deste. */
function instalador(args, env = {}) {
  return new Promise((ok) => {
    const filho = spawn(process.execPath, [INSTALADOR, ...args], { env: { ...process.env, TERCEIROS_ESPERAS_MS: '20,20,20', ...env } });
    let saida = '';
    filho.stdout.on('data', (d) => { saida += d; });
    filho.stderr.on('data', (d) => { saida += d; });
    filho.on('close', (codigo) => ok({ codigo, saida }));
  });
}

function git(args, entrada = '') {
  return new Promise((ok) => {
    const filho = spawn('git', ['-C', RAIZ, ...args]);
    let saida = '';
    filho.stdout.on('data', (d) => { saida += d; });
    filho.on('error', () => ok({ codigo: 127, saida: '' }));
    filho.on('close', (codigo) => ok({ codigo, saida: saida.replace(/\r/g, '') }));
    filho.stdin.end(entrada);
  });
}

function arquivosEm(pasta) {
  const lista = [];
  const andar = (p) => { for (const e of readdirSync(p, { withFileTypes: true })) { const c = join(p, e.name); if (e.isDirectory()) andar(c); else lista.push(relative(pasta, c).split(sep).join('/')); } };
  if (existsSync(pasta)) andar(pasta);
  return lista.sort();
}

/** Um .tgz mínimo, como o do npm: a pasta `package/`, e um nome longo pelo cabeçalho pax. */
function tgz(arquivos) {
  const blocos = [];
  const cabecalho = (nome, tamanho, tipo) => {
    const h = Buffer.alloc(512);
    h.write(nome.slice(0, 99), 0);
    h.write('0000644\0', 100); h.write('0000000\0', 108); h.write('0000000\0', 116);
    h.write(`${tamanho.toString(8).padStart(11, '0')}\0`, 124);
    h.write('00000000000\0', 136);
    h.write(tipo, 156);
    h.write('ustar\0', 257); h.write('00', 263);
    return h;
  };
  const corpo = (buf) => Buffer.concat([buf, Buffer.alloc((512 - (buf.length % 512)) % 512)]);
  for (const [nome, texto] of Object.entries(arquivos)) {
    const buf = Buffer.from(texto);
    if (nome.length > 99) {
      // o registro pax diz o próprio tamanho, contando os dígitos dele
      const reg = ` path=${nome}\n`;
      let tam = Buffer.byteLength(reg) + 1;
      while (String(tam).length + Buffer.byteLength(reg) !== tam) tam++;
      const pax = Buffer.from(`${tam}${reg}`);
      blocos.push(cabecalho('PaxHeader', pax.length, 'x'), corpo(pax));
    }
    blocos.push(cabecalho(nome, buf.length, '0'), corpo(buf));
  }
  blocos.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(blocos));
}

// ── parte 1 · sem internet ────────────────────────────────────────────────

console.log('o leitor de .tgz');
{
  const longo = `package/${'pasta-de-nome-comprido/'.repeat(5)}arquivo.md`;
  const conteudo = lerTar(tgz({ 'package/LICENSE': 'texto da licença\n', 'package/dist/a.js': 'a()', [longo]: 'longo' }));
  afirma('tira a pasta package/ do caminho', conteudo.get('LICENSE')?.toString() === 'texto da licença\n' && conteudo.get('dist/a.js')?.toString() === 'a()', [...conteudo.keys()].join(', '));
  afirma('o nome longo do cabeçalho pax chega inteiro', conteudo.get(longo.slice('package/'.length))?.toString() === 'longo', [...conteudo.keys()].join(', '));
}

// o servidor de mentira: cada caminho tem um roteiro de respostas
const roteiro = new Map();
const pedidos = [];
const servidor = createServer((req, res) => {
  pedidos.push(req.url);
  const fila = roteiro.get(req.url);
  const resposta = fila?.length > 1 ? fila.shift() : fila?.[0];
  if (!resposta) { res.writeHead(404); res.end('não há'); return; }
  res.writeHead(resposta.status ?? 200); res.end(resposta.corpo ?? '');
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
const BASE = `http://127.0.0.1:${servidor.address().port}/`;

const raizFalsa = temporaria('terceiros-raiz-');
const pastaManifesto = temporaria('terceiros-manifesto-');
const M = join(pastaManifesto, 'manifesto.json');
const plugin = { $schema: 'https://exemplo/schema.json', name: 'teste', displayName: 'Teste', version: '9.9.9', author: { name: 'Autor', email: 'a@exemplo', url: 'https://exemplo' }, homepage: 'https://exemplo/home', license: 'X' };
const ARQUIVOS = {
  '/texto.txt': 'cabeça\ncopyright: o trecho\nfica até aqui\nlicenseURL: fora\n',
  '/registro.json': JSON.stringify({ files: [{ content: 'import { cn } from "cn"\nclasse cn-font-heading\n' }] }),
  '/plugin.json': JSON.stringify(plugin),
};
const manifestoFalso = (extra = {}) => ({
  python: { fonttools: '0', brotli: '0' },
  pecas: [{
    id: 'peca-teste', descricao: 'uma peça de mentira', destino: 'pasta/da-peca', inteira: true,
    fontes: { local: { url: BASE } },
    arquivos: [
      { para: 'trecho.txt', de: 'texto.txt', trecho: ['copyright:', 'licenseURL:'] },
      { para: 'sub/componente.tsx', de: 'registro.json', json: 'files.0.content', trocas: [['cn-font-heading', 'font-heading']] },
      { para: 'plugin.json', molde: 'remotion/plugin.json', dados: 'plugin.json' },
    ],
    ...extra,
  }],
});
const servir = () => { for (const [url, corpo] of Object.entries(ARQUIVOS)) roteiro.set(url, [{ corpo }]); };
const gravarManifesto = (m) => writeFileSync(M, JSON.stringify(m, null, 2));

console.log('as impressões e a instalação');
{
  servir();
  gravarManifesto(manifestoFalso());
  const imp = await instalador(['--manifesto', M, '--impressoes']);
  const m = JSON.parse(readFileSync(M, 'utf8'));
  afirma('--impressoes grava a impressão de cada arquivo e não grava destino', imp.codigo === 0 && m.pecas[0].arquivos.every((a) => /^[0-9a-f]{64}$/.test(a.sha256)) && arquivosEm(raizFalsa).length === 0, imp.saida);
  const r = await instalador(['--manifesto', M, '--em', raizFalsa]);
  const da = (p) => readFileSync(join(raizFalsa, 'pasta/da-peca', p), 'utf8');
  afirma('instala e sai 0', r.codigo === 0 && /✓ peca-teste: 3 arquivo/.test(r.saida), r.saida);
  afirma('o trecho vai do início ao fim pedido', da('trecho.txt') === 'copyright: o trecho\nfica até aqui\n', da('trecho.txt'));
  afirma('o campo do JSON sai e a troca se aplica', da('sub/componente.tsx') === 'import { cn } from "cn"\nclasse font-heading\n');
  const pj = da('plugin.json');
  afirma('o molde se preenche com os campos da fonte', pj.includes('"version": "9.9.9"') && pj.includes('"email": "a@exemplo"') && !pj.includes('{{'), pj);
  afirma('nada se grava fora do destino', arquivosEm(raizFalsa).every((p) => p.startsWith('pasta/da-peca/')), arquivosEm(raizFalsa).join(', '));
  pedidos.length = 0;
  const de2 = await instalador(['--manifesto', M, '--em', raizFalsa]);
  afirma('instalar de novo não baixa nada (idempotente)', de2.codigo === 0 && /já instalada/.test(de2.saida) && pedidos.length === 0, `${pedidos.length} pedido(s)\n${de2.saida}`);
}

console.log('o --conferir');
{
  const c0 = await instalador(['--manifesto', M, '--em', raizFalsa, '--conferir']);
  afirma('com tudo no lugar, sai 0', c0.codigo === 0 && /✓ peca-teste/.test(c0.saida), c0.saida);
  rmSync(join(raizFalsa, 'pasta/da-peca/trecho.txt'));
  writeFileSync(join(raizFalsa, 'pasta/da-peca/sub/componente.tsx'), 'editado à mão\n');
  pedidos.length = 0;
  const c1 = await instalador(['--manifesto', M, '--em', raizFalsa, '--conferir']);
  afirma('acusa o arquivo que falta', c1.codigo === 1 && /falta\s+trecho\.txt/.test(c1.saida), c1.saida);
  afirma('acusa o arquivo que diverge', /diverge\s+sub\/componente\.tsx/.test(c1.saida), c1.saida);
  afirma('e não baixa nada', pedidos.length === 0, pedidos.join(', '));
  afirma('e diz o comando que conserta', /node scripts\/terceiros\/instalar\.mjs/.test(c1.saida), c1.saida);
  const conserto = await instalador(['--manifesto', M, '--em', raizFalsa]);
  const c2 = await instalador(['--manifesto', M, '--em', raizFalsa, '--conferir']);
  afirma('a reinstalação devolve só os dois, e o --conferir volta a 0', /2 arquivo/.test(conserto.saida) && c2.codigo === 0, conserto.saida + c2.saida);
}

console.log('a rede');
{
  const raiz = temporaria('terceiros-rede-');
  servir();
  roteiro.set('/texto.txt', [{ status: 503 }, { status: 503 }, { corpo: ARQUIVOS['/texto.txt'] }]);
  pedidos.length = 0;
  const r = await instalador(['--manifesto', M, '--em', raiz]);
  afirma('falha passageira repete com intervalo e instala', r.codigo === 0 && pedidos.filter((p) => p === '/texto.txt').length === 3 && /tento de novo/.test(r.saida), r.saida);

  const raiz2 = temporaria('terceiros-rede-');
  roteiro.set('/texto.txt', [{ status: 503 }]);
  pedidos.length = 0;
  const f = await instalador(['--manifesto', M, '--em', raiz2]);
  afirma('falha que fica: para depois de 4 tentativas', f.codigo === 1 && pedidos.filter((p) => p === '/texto.txt').length === 4, f.saida);
  afirma('e diz o que fazer, com a peça', /O que fazer: .*--so peca-teste/.test(f.saida), f.saida);
  afirma('e não grava meia peça', arquivosEm(raiz2).length === 0, arquivosEm(raiz2).join(', '));

  roteiro.set('/texto.txt', []);
  pedidos.length = 0;
  const n = await instalador(['--manifesto', M, '--em', temporaria('terceiros-rede-')]);
  afirma('404 não repete e diz que a versão sumiu', n.codigo === 1 && pedidos.filter((p) => p === '/texto.txt').length === 1 && /404/.test(n.saida), n.saida);
}

console.log('as recusas');
{
  servir();
  const m = JSON.parse(readFileSync(M, 'utf8'));
  m.pecas[0].arquivos[0].sha256 = '0'.repeat(64);
  gravarManifesto(m);
  const raiz = temporaria('terceiros-recusa-');
  const r = await instalador(['--manifesto', M, '--em', raiz]);
  afirma('arquivo com a impressão errada não se grava, nem o resto da peça', r.codigo === 1 && /não é o arquivo esperado/.test(r.saida) && arquivosEm(raiz).length === 0, r.saida);

  for (const [nome, troca] of [
    ['arquivo que sai do destino', (x) => { x.pecas[0].arquivos[0].para = '../fora.txt'; }],
    ['destino que sai da raiz', (x) => { x.pecas[0].destino = '../fora'; }],
    ['caminho absoluto', (x) => { x.pecas[0].arquivos[0].para = 'C:/Windows/x.txt'; }],
    ['peça dentro de outra', (x) => { x.pecas.push({ ...x.pecas[0], id: 'outra', destino: 'pasta/da-peca/dentro' }); }],
  ]) {
    const x = manifestoFalso();
    troca(x);
    gravarManifesto(x);
    const raizR = temporaria('terceiros-recusa-');
    const s = await instalador(['--manifesto', M, '--em', raizR]);
    afirma(`recusa ${nome} antes de gravar qualquer coisa`, s.codigo !== 0 && /manifesto inválido/.test(s.saida) && arquivosEm(raizR).length === 0, s.saida);
  }
  const op = await instalador(['--manifesto', M, '--peca', 'x']);
  afirma('opção desconhecida sai 2 e diz qual', op.codigo === 2 && /--peca/.test(op.saida), op.saida);
}

// ── o material da Release (pacotes .tar.gz de um servidor local) ─────────────

/** Um tar com as entradas como vierem (inclusive as hostis): { nome, corpo, tipo, link }. */
function tarBruto(entradas) {
  const blocos = [];
  for (const { nome, corpo = '', tipo = '0', link = '' } of entradas) {
    const buf = Buffer.from(corpo);
    const h = Buffer.alloc(512);
    h.write(nome.slice(0, 99), 0);
    h.write('0000644\0', 100); h.write('0000000\0', 108); h.write('0000000\0', 116);
    h.write(`${buf.length.toString(8).padStart(11, '0')}\0`, 124);
    h.write('00000000000\0', 136);
    h.write(tipo, 156); h.write(link, 157);
    h.write('ustar\0', 257); h.write('00', 263);
    blocos.push(h, buf, Buffer.alloc((512 - (buf.length % 512)) % 512));
  }
  blocos.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(blocos));
}
const BONS = { 'um.txt': 'conteúdo um\n', 'sub/dois.bin': randomBytes(400000) };
const ASSET = 'mograph-teste-v1.tar.gz';
const boas = (topo = 'dados', extras = []) => [...Object.entries(BONS).map(([nome, corpo]) => ({ nome: `${topo}/${nome}`, corpo })), ...extras];
/** O manifesto de uma peça de material cujo pacote é `pacote` (os arquivos são sempre os BONS). */
function manifestoMaterial(pacote, asset = ASSET) {
  return {
    python: { fonttools: '0', brotli: '0' },
    pecas: [{
      id: 'material-teste', descricao: 'material de mentira', destino: 'pasta/material',
      fontes: { release: { release: true } },
      pacotes: [{ asset, sha256: sha256(pacote), bytes: pacote.length, arquivos: Object.keys(BONS).length }],
      arquivos: Object.entries(BONS).map(([para, c]) => ({ para, pacote: asset, sha256: sha256(Buffer.from(c)), bytes: Buffer.byteLength(c) })),
    }],
  };
}

console.log('o leitor estrito do pacote');
{
  const estranho = (entradas) => { try { lerTar(tarBruto(entradas), { estrito: true }); return null; } catch (e) { return e.message; } };
  const ok = lerTar(tarBruto(boas()), { estrito: true });
  afirma('lê o pacote bom, sem a pasta de topo', ok.size === 2 && ok.get('um.txt')?.toString() === 'conteúdo um\n' && ok.get('sub/dois.bin')?.equals(BONS['sub/dois.bin']), [...ok.keys()].join(', '));
  for (const [nome, entradas, trecho] of [
    ['segmento ..', boas('dados', [{ nome: 'dados/../fora.txt', corpo: 'x' }]), /sai da pasta/],
    ['.. logo na raiz', [{ nome: '../fora.txt', corpo: 'x' }], /sai da pasta/],
    ['caminho absoluto', [{ nome: '/etc/fora.txt', corpo: 'x' }], /absoluto/],
    ['unidade C:', [{ nome: 'C:x', corpo: 'x' }], /unidade/],
    ['barra invertida', boas('dados', [{ nome: 'dados\\fora.txt', corpo: 'x' }]), /barra invertida/],
    ['link simbólico', boas('dados', [{ nome: 'dados/atalho', tipo: '2', link: '../../fora' }]), /link simbólico/],
    ['link físico', boas('dados', [{ nome: 'dados/duro', tipo: '1', link: 'dados/um.txt' }]), /link físico/],
    ['arquivo na raiz do pacote', [{ nome: 'solto.txt', corpo: 'x' }], /raiz do pacote/],
    ['duas pastas de topo', boas('dados', [{ nome: 'outra/x.txt', corpo: 'x' }]), /fora da pasta de topo/],
    ['nome repetido', boas('dados', [{ nome: 'dados/um.txt', corpo: 'outro' }]), /repetida/],
  ]) {
    const erro = estranho(entradas);
    afirma(`recusa ${nome}`, erro !== null && trecho.test(erro), erro);
  }
  const cortado = gzipSync(gunzipSync(tarBruto(boas())).subarray(0, 3000));
  let erroCorte = null;
  try { lerTar(cortado, { estrito: true }); } catch (e) { erroCorte = e.message; }
  afirma('recusa o pacote cortado no meio de um arquivo', /cortado/.test(erroCorte ?? ''), erroCorte);
}

console.log('o material da Release');
{
  const assets = new Map(); // '/asset' → { corpo, modo }
  const pedidosM = [];
  const servidorM = createServer((req, res) => {
    pedidosM.push(req.url);
    const a = assets.get(req.url);
    if (!a) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-length': a.corpo.length, 'content-type': 'application/gzip' });
    if (a.modo === 'corta') { res.write(a.corpo.subarray(0, Math.floor(a.corpo.length / 2))); setTimeout(() => res.socket.destroy(), 20); return; }
    if (a.modo === 'trava') { res.write(a.corpo.subarray(0, 1000)); return; } // para de mandar e nunca termina
    if (a.modo === 'lento') {
      // chega em pedaços, um a cada 150 ms: o total passa de 1 s, mas nunca fica 400 ms sem byte
      const passo = Math.ceil(a.corpo.length / 8);
      let i = 0;
      const mandar = () => { if (i >= a.corpo.length) { res.end(); return; } res.write(a.corpo.subarray(i, i + passo)); i += passo; setTimeout(mandar, 150); };
      mandar();
      return;
    }
    res.end(a.corpo);
  });
  await new Promise((ok) => servidorM.listen(0, '127.0.0.1', ok));
  const ENV = { TERCEIROS_RELEASE_URL: `http://127.0.0.1:${servidorM.address().port}/`, TERCEIROS_INATIVIDADE_MS: '400' };
  const MM = join(temporaria('terceiros-material-manifesto-'), 'manifesto.json');
  const bom = tarBruto(boas());
  const servirM = (pacote, modo = 'normal') => assets.set(`/${ASSET}`, { corpo: pacote, modo });
  const gravarM = (m) => writeFileSync(MM, JSON.stringify(m, null, 2));
  const pacotes = (r) => pedidosM.filter((p) => p === `/${ASSET}`).length;
  const arquivosDe = (raiz) => arquivosEm(raiz).filter((p) => !/\/\.pacote-[^/]+\.json$/.test(p));

  // instalar e não baixar de novo
  servirM(bom);
  gravarM(manifestoMaterial(bom));
  const raiz = temporaria('terceiros-material-');
  pedidosM.length = 0;
  const r1 = await instalador(['--manifesto', MM, '--em', raiz], ENV);
  afirma('baixa do servidor e instala os arquivos do pacote, byte a byte', r1.codigo === 0 && /✓ material-teste: 2 arquivo/.test(r1.saida) && readFileSync(join(raiz, 'pasta/material/um.txt'), 'utf8') === 'conteúdo um\n' && readFileSync(join(raiz, 'pasta/material/sub/dois.bin')).equals(BONS['sub/dois.bin']), r1.saida);
  afirma('grava só o que o manifesto diz, mais o marcador, e nenhum .baixando', arquivosEm(raiz).sort().join(',') === ['pasta/material/.pacote-mograph-teste-v1.tar.gz.json', 'pasta/material/sub/dois.bin', 'pasta/material/um.txt'].join(','), arquivosEm(raiz).join(', '));
  afirma('o marcador leva o sha256 do pacote', JSON.parse(readFileSync(join(raiz, `pasta/material/.pacote-${ASSET}.json`), 'utf8')).sha256 === sha256(bom));
  const cf = await instalador(['--manifesto', MM, '--em', raiz, '--conferir'], ENV);
  afirma('o --conferir sai 0 com o material no lugar', cf.codigo === 0 && /✓ material-teste/.test(cf.saida), cf.saida);
  pedidosM.length = 0;
  const r2 = await instalador(['--manifesto', MM, '--em', raiz], ENV);
  afirma('a segunda rodada não baixa nada', r2.codigo === 0 && /já instalada/.test(r2.saida) && pedidosM.length === 0, `${pedidosM.length} pedido(s)\n${r2.saida}`);

  // o marcador e a conferência dos arquivos, os dois, decidem se baixa de novo
  rmSync(join(raiz, `pasta/material/.pacote-${ASSET}.json`));
  const cm = await instalador(['--manifesto', MM, '--em', raiz, '--conferir'], ENV);
  afirma('sem o marcador o --conferir acusa o pacote', cm.codigo === 1 && /pacote\s+mograph-teste-v1\.tar\.gz sem marcador/.test(cm.saida), cm.saida);
  pedidosM.length = 0;
  const r3 = await instalador(['--manifesto', MM, '--em', raiz], ENV);
  afirma('e a instalação baixa o pacote e refaz o marcador', r3.codigo === 0 && pacotes() === 1 && existsSync(join(raiz, `pasta/material/.pacote-${ASSET}.json`)), r3.saida);
  rmSync(join(raiz, 'pasta/material/um.txt'));
  writeFileSync(join(raiz, 'pasta/material/sub/dois.bin'), 'editado à mão');
  const c4 = await instalador(['--manifesto', MM, '--em', raiz, '--conferir'], ENV);
  afirma('arquivo apagado ou editado: o --conferir acusa os dois', c4.codigo === 1 && /falta\s+um\.txt/.test(c4.saida) && /diverge\s+sub\/dois\.bin/.test(c4.saida), c4.saida);
  pedidosM.length = 0;
  const r4 = await instalador(['--manifesto', MM, '--em', raiz], ENV);
  afirma('e a instalação devolve os dois (peça interrompida retoma)', r4.codigo === 0 && pacotes() === 1 && readFileSync(join(raiz, 'pasta/material/um.txt'), 'utf8') === 'conteúdo um\n' && readFileSync(join(raiz, 'pasta/material/sub/dois.bin')).equals(BONS['sub/dois.bin']), r4.saida);

  // o pacote adulterado reprova sem gravar nada
  const adulterado = Buffer.from(bom); adulterado[adulterado.length - 30] ^= 0xff;
  servirM(adulterado);
  const raizA = temporaria('terceiros-material-');
  const ra = await instalador(['--manifesto', MM, '--em', raizA], ENV);
  afirma('pacote com o sha256 diferente do manifesto reprova sem gravar nada', ra.codigo === 1 && /o pacote baixado não é o esperado/.test(ra.saida) && /nada foi gravado/.test(ra.saida) && /a mesma impressão, o pacote da Release não é o desta versão/.test(ra.saida) && arquivosEm(raizA).length === 0, ra.saida + arquivosEm(raizA).join(', '));

  // o arquivo adulterado dentro de um pacote cujo sha256 bate
  const trocado = tarBruto([{ nome: 'dados/um.txt', corpo: 'conteúdo TROCADO\n' }, { nome: 'dados/sub/dois.bin', corpo: BONS['sub/dois.bin'] }]);
  servirM(trocado);
  gravarM(manifestoMaterial(trocado)); // o sha256 do pacote bate; o dos arquivos é o dos BONS
  const raizB = temporaria('terceiros-material-');
  const rb = await instalador(['--manifesto', MM, '--em', raizB], ENV);
  afirma('arquivo adulterado dentro do pacote reprova sem gravar nada, nem o que estava bom', rb.codigo === 1 && /um\.txt dentro do pacote não é o arquivo esperado/.test(rb.saida) && arquivosEm(raizB).length === 0, rb.saida + arquivosEm(raizB).join(', '));

  // arquivo a mais ou a menos no pacote
  for (const [nome, entradas] of [
    ['com um arquivo que o manifesto não lista', boas('dados', [{ nome: 'dados/extra.txt', corpo: 'x' }])],
    ['sem um arquivo que o manifesto lista', [{ nome: 'dados/um.txt', corpo: BONS['um.txt'] }]],
  ]) {
    const p = tarBruto(entradas);
    servirM(p);
    const m = manifestoMaterial(p); // mesmo sha256 do pacote; os arquivos são os BONS
    gravarM(m);
    const raizC = temporaria('terceiros-material-');
    const rc = await instalador(['--manifesto', MM, '--em', raizC], ENV);
    afirma(`pacote ${nome} reprova sem gravar`, rc.codigo === 1 && /não bate com o manifesto/.test(rc.saida) && arquivosEm(raizC).length === 0, rc.saida);
  }

  // a entrada que escapa do destino nunca grava, nem fora nem dentro
  const fora = temporaria('terceiros-fora-');
  const foraNorm = fora.replace(/\\/g, '/');
  for (const [nome, extras] of [
    ['../fora.txt', [{ nome: 'dados/../fora.txt', corpo: 'ESCAPOU' }]],
    ['../../fora.txt', [{ nome: 'dados/../../fora.txt', corpo: 'ESCAPOU' }]],
    ['caminho absoluto', [{ nome: `${foraNorm}/fora.txt`, corpo: 'ESCAPOU' }, { nome: '/fora.txt', corpo: 'ESCAPOU' }]],
    ['unidade C:x', [{ nome: 'C:x', corpo: 'ESCAPOU' }]],
    ['link simbólico', [{ nome: 'dados/atalho', tipo: '2', link: foraNorm }]],
    ['link físico', [{ nome: 'dados/duro', tipo: '1', link: 'dados/um.txt' }]],
  ]) {
    const p = tarBruto(boas('dados', extras));
    servirM(p);
    gravarM(manifestoMaterial(p));
    const raizD = temporaria('terceiros-material-');
    const rd = await instalador(['--manifesto', MM, '--em', raizD], ENV);
    afirma(`entrada ${nome} reprova sem gravar nada, dentro nem fora do destino`, rd.codigo === 1 && /recusada/.test(rd.saida) && arquivosEm(raizD).length === 0 && arquivosEm(fora).length === 0, rd.saida + arquivosEm(raizD).join(', ') + arquivosEm(fora).join(', '));
  }

  // rodada interrompida no meio do download
  gravarM(manifestoMaterial(bom));
  servirM(bom, 'corta');
  const raizI = temporaria('terceiros-material-');
  pedidosM.length = 0;
  const ri = await instalador(['--manifesto', MM, '--em', raizI], ENV);
  afirma('servidor que corta no meio: repete, sai 1 e não deixa arquivo nenhum (nem .baixando)', ri.codigo === 1 && pacotes() === 4 && arquivosEm(raizI).length === 0 && /O que fazer/.test(ri.saida), `${pacotes()} pedido(s)\n${ri.saida}${arquivosEm(raizI).join(', ')}`);
  servirM(bom);
  const rj = await instalador(['--manifesto', MM, '--em', raizI], ENV);
  afirma('e a rodada seguinte completa', rj.codigo === 0 && arquivosDe(raizI).length === 2 && (await instalador(['--manifesto', MM, '--em', raizI, '--conferir'], ENV)).codigo === 0, rj.saida);

  // o prazo é por inatividade
  servirM(bom, 'trava');
  const raizT = temporaria('terceiros-material-');
  const t0 = Date.now();
  const rt = await instalador(['--manifesto', MM, '--em', raizT], ENV);
  afirma('servidor que para de mandar: o prazo por inatividade dispara, repete e sai 1 sem gravar', rt.codigo === 1 && /nenhum byte chegou em 0.4 s/.test(rt.saida) && arquivosEm(raizT).length === 0 && Date.now() - t0 < 15000, rt.saida);
  servirM(bom, 'lento');
  const raizL = temporaria('terceiros-material-');
  const t1 = Date.now();
  const rl = await instalador(['--manifesto', MM, '--em', raizL], ENV);
  afirma('servidor lento que não para: o total passa do prazo e a instalação termina', rl.codigo === 0 && Date.now() - t1 > 1000 && arquivosDe(raizL).length === 2, `${Date.now() - t1} ms\n${rl.saida}`);

  // o pacote que não está na Release
  assets.clear();
  pedidosM.length = 0;
  const r404 = await instalador(['--manifesto', MM, '--em', temporaria('terceiros-material-')], ENV);
  afirma('pacote que não está na Release: 404 não repete e diz que não foi publicado', r404.codigo === 1 && pacotes() === 1 && /404/.test(r404.saida) && /não está nessa Release/.test(r404.saida), r404.saida);
  afirma('e o fecho diz que repetir não resolve e que o resto funciona sem o material, sem mandar conferir a internet', /repetir não resolve/.test(r404.saida) && /O resto funciona sem ele/.test(r404.saida) && !/confira a internet/.test(r404.saida), r404.saida);

  // o --listar, o endereço e o manifesto de verdade
  const lm = await instalador(['--manifesto', MM, '--listar'], ENV);
  afirma('o --listar diz de onde vem, os pacotes e o tamanho a baixar', lm.codigo === 0 && /de a Release http:\/\/127\.0\.0\.1:\d+\//.test(lm.saida) && new RegExp(`baixa 1 pacote .*${ASSET}`).test(lm.saida) && /para baixar/.test(lm.saida), lm.saida);
  // o caminho inteiro sem TERCEIROS_RELEASE_URL: um workspace clonado de um fork acha a Release na
  // origem dele, lembra o repositório no release.json, e o acha de novo com o origin já trocado
  {
    const ws = temporaria('terceiros-origem-');
    cpSync(AQUI, join(ws, 'scripts', 'terceiros'), { recursive: true });
    const git = (...a) => spawnSync('git', ['-C', ws, ...a], { encoding: 'utf8' });
    git('init', '-q');
    git('remote', 'add', 'origin', 'https://github.com/voce/fork.git');
    const tag = JSON.parse(readFileSync(join(ws, 'scripts/terceiros/release.json'), 'utf8')).tag;
    const porta = servidorM.address().port;
    const ENV_GH = { TERCEIROS_GITHUB: `http://127.0.0.1:${porta}`, TERCEIROS_API_GITHUB: `http://127.0.0.1:${porta}/api`, TERCEIROS_INATIVIDADE_MS: '400', TERCEIROS_RELEASE_URL: '' };
    assets.clear();
    assets.set('/api/repos/voce/fork', { corpo: Buffer.from(JSON.stringify({ fork: true, source: { full_name: 'raiz/template' } })), modo: 'normal' });
    assets.set('/api/repos/raiz/template', { corpo: Buffer.from('{}'), modo: 'normal' });
    assets.set(`/raiz/template/releases/download/${tag}/${ASSET}`, { corpo: bom, modo: 'normal' });
    const rodarCopia = (args) => new Promise((ok) => {
      const filho = spawn(process.execPath, [join(ws, 'scripts/terceiros/instalar.mjs'), ...args], { env: { ...process.env, TERCEIROS_ESPERAS_MS: '20,20,20', ...ENV_GH } });
      let saida = '';
      filho.stdout.on('data', (d) => { saida += d; });
      filho.stderr.on('data', (d) => { saida += d; });
      filho.on('close', (codigo) => ok({ codigo, saida }));
    });
    const r1 = await rodarCopia(['--manifesto', MM, '--em', temporaria('terceiros-origem-raiz-')]);
    const lembrado = JSON.parse(readFileSync(join(ws, 'scripts/terceiros/release.json'), 'utf8'));
    afirma('do fork, sobe à origem pela API, instala de lá e o release.json passa a lembrar o repositório', r1.codigo === 0 && lembrado.repositorio === 'raiz/template' && lembrado.tag === tag && /agora lembra que o material vem de raiz\/template/.test(r1.saida), r1.saida);
    git('remote', 'set-url', 'origin', 'https://github.com/voce/privado.git');
    pedidosM.length = 0;
    const r2 = await rodarCopia(['--manifesto', MM, '--em', temporaria('terceiros-origem-raiz-')]);
    afirma('com o origin trocado para o repositório da pessoa, o lembrado acha o material sem perguntar à API', r2.codigo === 0 && !pedidosM.some((p) => p.startsWith('/api/')) && pedidosM.includes(`/raiz/template/releases/download/${tag}/${ASSET}`), `${pedidosM.join(' ')}\n${r2.saida}`);
  }

  servidorM.closeAllConnections();
  servidorM.close();

  const real = lerManifesto();
  const material = real.pecas.filter((p) => p.pacotes);
  afirma('o manifesto de verdade tem o material (som, 3D, LUT), com cada pacote do tamanho que diz', material.length >= 3 && material.every((p) => p.pacotes.every((pc) => p.arquivos.filter((a) => a.pacote === pc.asset).length === pc.arquivos && pc.bytes < 100 * 1000 * 1000)), material.map((p) => p.id).join(', '));
  afirma('o material de verdade tem os 284 arquivos do kit (mais os emoji, se já entraram)', material.reduce((s, p) => s + p.arquivos.length, 0) >= 284);
  afirma('o release.json guarda só a tag, sem nome de dono', JSON.stringify(Object.keys(JSON.parse(readFileSync(join(AQUI, 'release.json'), 'utf8')))) === '["tag"]');
  afirma('o repositório vem do origin, em https ou ssh', lerRelease({}, 'https://github.com/dono/repo.git').base === `https://github.com/dono/repo/releases/download/${JSON.parse(readFileSync(join(AQUI, 'release.json'), 'utf8')).tag}/` && lerRelease({}, 'git@github.com:dono/repo.git').repositorio === 'dono/repo' && lerRelease({}, 'https://github.com/dono/repo').repositorio === 'dono/repo');
  afirma('sem origin do GitHub, recusa e diz o que fazer', [null, 'C:/pasta/local', 'https://gitlab.com/dono/repo.git'].every((o) => { try { lerRelease({}, o); return false; } catch (e) { return /clonado/.test(e.message) && /TERCEIROS_RELEASE_URL/.test(e.message); } }));
  afirma('TERCEIROS_RELEASE_URL passa por cima do origin', lerRelease({ TERCEIROS_RELEASE_URL: 'http://x/y' }, null).base === 'http://x/y/');
  // o workspace da pessoa lembra de onde veio o material: o origin dela já não é o do template
  const pastaR = temporaria('terceiros-release-');
  const arqR = join(pastaR, 'release.json');
  writeFileSync(arqR, '{\n  "tag": "material-v9"\n}\n');
  afirma('lembrar grava o repositório uma vez e guarda a tag', lembrarRepositorio('raiz/template', arqR) === true && JSON.stringify(JSON.parse(readFileSync(arqR, 'utf8'))) === '{"tag":"material-v9","repositorio":"raiz/template"}');
  afirma('lembrar não troca o que já foi lembrado, nem grava nome inválido', lembrarRepositorio('outro/repo', arqR) === false && JSON.parse(readFileSync(arqR, 'utf8')).repositorio === 'raiz/template' && lembrarRepositorio('nao é repo', join(pastaR, 'nao-usado.json')) === false);
  afirma('o lembrado vale acima do origin (o origin já é o repositório da pessoa)', lerRelease({}, 'https://github.com/voce/privado.git', arqR).base === 'https://github.com/raiz/template/releases/download/material-v9/' && lerRelease({}, null, arqR).lembrado === true);
  writeFileSync(arqR, '{ "tag": "material-v9", "repositorio": "sem barra" }');
  afirma('o lembrado inválido recusa, dizendo o formato', (() => { try { lerRelease({}, null, arqR); return false; } catch (e) { return /dono\/nome/.test(e.message); } })());
  const apiFalsa = (mapa) => async (url) => { const k = url.replace('https://api.github.com/repos/', ''); if (!(k in mapa)) throw new Error('404'); return mapa[k]; };
  afirma('fork sobe ao source, e o "Use this template" ao template_repository', await subirAteAOrigem('voce/fork', apiFalsa({ 'voce/fork': { fork: true, source: { full_name: 'raiz/template' } }, 'raiz/template': {} })) === 'raiz/template' && await subirAteAOrigem('voce/novo', apiFalsa({ 'voce/novo': { template_repository: { full_name: 'raiz/template' } }, 'raiz/template': {} })) === 'raiz/template');
  afirma('o clone direto fica nele, e sem resposta da API também', await subirAteAOrigem('raiz/template', apiFalsa({ 'raiz/template': { fork: false } })) === 'raiz/template' && await subirAteAOrigem('raiz/template', apiFalsa({})) === 'raiz/template');
  afirma('para em 3 degraus, mesmo num ciclo', await subirAteAOrigem('a/a', apiFalsa({ 'a/a': { parent: { full_name: 'b/b' } }, 'b/b': { parent: { full_name: 'a/a' } } })) !== undefined);
}

console.log('o --listar e o exigirPeca');
{
  const l = await instalador(['--listar']);
  const m = lerManifesto();
  afirma('o --listar mostra cada peça, o destino e a fonte', l.codigo === 0 && m.pecas.every((p) => l.saida.includes(`${p.id} · `) && l.saida.includes(`para ${p.destino}/`)) && /de npm gsap@3\.14\.2/.test(l.saida), l.saida);
  afirma('o --listar avisa do link que a pessoa cria', /link em ~\/\.claude\/skills\/remotion/.test(l.saida), l.saida);
  let erro = '';
  try { exigirPeca('gsap-biblioteca', { raiz: temporaria('terceiros-vazia-') }); } catch (e) { erro = e.message; }
  afirma('a peça que falta para quem depende dela com o comando que instala', /rode `node scripts\/terceiros\/instalar\.mjs`/i.test(erro) && /--so gsap-biblioteca/.test(erro), erro);
  const contrato = contratoDe(RAIZ);
  afirma('o contrato lê o manifesto: pastas inteiras e cada arquivo', contrato.pastas.includes('.claude/skills/remotion') && contrato.arquivos.has('.claude/skills/gsap/referencias/gsap-core.md') && contrato.pastas.length === m.pecas.filter((p) => p.inteira).length);
}

console.log('o git');
if ((await git(['rev-parse', '--git-dir'])).codigo !== 0) {
  console.log('  (fora de um repositório git: pulado)');
} else {
  // o .gitignore da raiz cobre cada arquivo instalado, e nenhum molde
  const todos = lerManifesto().pecas.flatMap((p) => p.arquivos.map((a) => `${p.destino}/${a.para}`));
  const ignorados = await git(['check-ignore', '--no-index', '--stdin'], todos.join('\n'));
  const fora = todos.filter((c) => !ignorados.saida.split('\n').includes(c));
  afirma('o .gitignore ignora cada arquivo que o instalador grava', fora.length === 0, fora.slice(0, 5).join(', '));
  const moldes = arquivosEm(join(AQUI, 'moldes')).map((p) => `scripts/terceiros/moldes/${p}`);
  const moldeIgnorado = await git(['check-ignore', '--no-index', '--stdin'], moldes.join('\n'));
  afirma('e nenhum molde', moldes.length > 0 && moldeIgnorado.saida.trim() === '', moldeIgnorado.saida);
  const rastreados = await git(['ls-files', '--', ...lerManifesto().pecas.map((p) => p.destino)]);
  const instaladosRastreados = rastreados.saida.split('\n').filter((c) => todos.includes(c));
  afirma('nada instalado está no índice do git', rastreados.codigo !== 0 || instaladosRastreados.length === 0, instaladosRastreados.slice(0, 5).join(', '));
}

servidor.close();

// ── parte 2 · com internet ────────────────────────────────────────────────

// O que muda de propósito entre o antes e a instalação, e a prova de cada um.
const linhas = (t) => t.split('\n');
const DIFERENCAS = {
  // os arquivos de organização saem do molde, reescritos sem relato de origem
  '.claude/skills/gsap/SKILL.md': { porque: 'roteador reescrito do molde', prova: (_, novo, a) => novo.equals(readFileSync(join(AQUI, 'moldes', a.molde))) },
  '.claude/skills/remotion/CATALOGO.md': { porque: 'mapa reescrito do molde', prova: (_, novo, a) => novo.equals(readFileSync(join(AQUI, 'moldes', a.molde))) },
  '.claude/skills/remotion/README.md': { porque: 'README reescrito do molde, com a versão da fonte', prova: (_, novo) => novo.toString().includes('Versão **4.0.516**') },
  '.claude/skills/design-de-produto/assets/vendor/LEIA-ME.md': { porque: 'LEIA-ME reescrito do molde', prova: (_, novo, a) => novo.equals(readFileSync(join(AQUI, 'moldes', a.molde))) },
  // o antes tinha a licença com um cabeçalho escrito à mão; agora vem só o texto da fonte
  '.claude/skills/guardanapo/fontes/OFL.txt': { porque: 'só o texto da fonte, sem as 8 linhas de cabeçalho escritas à mão', prova: (antes, novo) => linhas(antes.toString()).slice(8).join('\n') === novo.toString() },
  // o antes estava corrompido: uma troca automática de arroba apagou o nome de duas variantes do Tailwind e uma tag do comentário do Lucide
  '.claude/skills/design-de-produto/assets/vendor/tailwind-browser.js': { porque: 'o antes tinha "@max" e "@min" trocados por "@usuario" (as variantes @max-* e @min-* quebradas); vem o arquivo da fonte', prova: (antes, novo) => novo.toString().replaceAll('"@max"', '"@usuario"').replaceAll('"@min"', '"@usuario"') === antes.toString() },
  '.claude/skills/design-de-produto/assets/vendor/lucide.min.js': { porque: 'o antes tinha "@license" trocado por "@usuario" no comentário do topo; vem o arquivo da fonte', prova: (antes, novo) => novo.toString().replace('@license lucide', '@usuario lucide') === antes.toString() },
  // a versão fixada traz a frase que a própria regra dela traz
  '.claude/skills/react-best-practices/AGENTS.md': {
    porque: 'uma frase difere: a da versão fixada, igual à de rules/advanced-effect-event-deps.md',
    prova: (antes, novo, _, raiz) => {
      const a = linhas(antes.toString()); const n = linhas(novo.toString());
      const dif = n.map((l, i) => (l !== a[i] ? l : null)).filter((l) => l !== null);
      return a.length === n.length && dif.length === 1 && readFileSync(join(raiz, '.claude/skills/react-best-practices/rules/advanced-effect-event-deps.md'), 'utf8').includes(dif[0]);
    },
  },
};
// o que o antes tinha e a fonte não traz
const SAEM = { '.claude/skills/react-best-practices/LICENSE': 'texto escrito à mão (a fonte não publica arquivo de licença; o README dela declara a licença)' };

if (SEM_REDE) {
  console.log('\nparte 2 · pulada (--sem-rede)');
} else {
  console.log('\nparte 2 · o manifesto de verdade, numa pasta temporária');
  const raiz = temporaria('terceiros-real-');
  const r = await instalador(['--em', raiz], { TERCEIROS_ESPERAS_MS: '2000,5000,10000' });
  afirma('instala todas as peças e sai 0', r.codigo === 0, r.saida);
  const m = lerManifesto();
  const c = await instalador(['--em', raiz, '--conferir']);
  afirma('o --conferir confere cada impressão e sai 0', c.codigo === 0 && m.pecas.every((p) => c.saida.includes(`✓ ${p.id}`)), c.saida);
  const esperados = new Set(m.pecas.flatMap((p) => p.arquivos.map((a) => `${p.destino}/${a.para}`)));
  // o material grava, além dos arquivos, um marcador por pacote (é o que deixa a instalação retomar)
  const marcadores = new Set(m.pecas.flatMap((p) => (p.pacotes ?? []).map((pc) => relative(raiz, caminhoDoMarcador(raiz, p, pc.asset)).split(sep).join('/'))));
  const gravou = arquivosEm(raiz);
  afirma('nada se grava fora dos arquivos do manifesto e do marcador de cada pacote', gravou.every((p) => esperados.has(p) || marcadores.has(p)) && gravou.length === esperados.size + marcadores.size, gravou.filter((p) => !esperados.has(p) && !marcadores.has(p)).join(', '));

  if (ANTES) {
    console.log(`\no byte a byte contra ${ANTES}`);
    const antesDe = (p) => RENOMEADAS.reduce((c, [novo, velho]) => c.replace(`/${novo}/`, `/${velho}/`), p);
    let iguais = 0;
    const naoExplicados = [];
    for (const p of m.pecas) {
      for (const a of p.arquivos) {
        const caminho = `${p.destino}/${a.para}`;
        const velho = join(ANTES, antesDe(caminho));
        const novo = readFileSync(join(raiz, caminho));
        if (!existsSync(velho)) { naoExplicados.push(`${caminho}: não existe no antes`); continue; }
        const antes = readFileSync(velho);
        if (antes.equals(novo)) { iguais++; continue; }
        const d = DIFERENCAS[caminho];
        if (!d) { naoExplicados.push(`${caminho}: difere sem explicação`); continue; }
        afirma(`${caminho} · ${d.porque}`, d.prova(antes, novo, a, raiz));
      }
    }
    afirma(`os outros ${iguais} arquivos são byte a byte os do antes`, naoExplicados.length === 0 && iguais === esperados.size - Object.keys(DIFERENCAS).length, naoExplicados.join('\n'));
    // cada arquivo do antes, nas pastas que agora se instalam inteiras, ou volta ou está em SAEM
    const sobra = [];
    for (const p of m.pecas.filter((x) => x.inteira)) {
      for (const f of arquivosEm(join(ANTES, antesDe(p.destino)))) if (!esperados.has(`${p.destino}/${f}`) && !SAEM[`${p.destino}/${f}`]) sobra.push(`${p.destino}/${f}`);
    }
    afirma('todo arquivo do antes volta, menos os listados em SAEM', sobra.length === 0, sobra.join(', '));
    for (const [c, porque] of Object.entries(SAEM)) console.log(`        sai: ${c} · ${porque}`);
  } else {
    console.log('\n  (sem --antes: o byte a byte contra o antes não roda)');
  }

  console.log('\no --conferir sobre a instalação de verdade');
  rmSync(join(raiz, '.claude/video/html/_vendor/gsap.min.js'));
  writeFileSync(join(raiz, '.claude/skills/guardanapo/fontes/excalifont-latin.woff2'), 'não é fonte');
  const c1 = await instalador(['--em', raiz, '--conferir']);
  afirma('acusa o arquivo apagado e o estragado, cada um na peça dele', c1.codigo === 1 && /✗ gsap-biblioteca[\s\S]*falta\s+gsap\.min\.js/.test(c1.saida) && /✗ guardanapo-fontes[\s\S]*diverge\s+excalifont-latin\.woff2/.test(c1.saida), c1.saida);
  const de2 = await instalador(['--em', raiz]);
  const c2 = await instalador(['--em', raiz, '--conferir']);
  afirma('a reinstalação devolve os dois e deixa o resto como estava', de2.codigo === 0 && c2.codigo === 0 && (de2.saida.match(/já instalada/g) ?? []).length === m.pecas.length - 2, de2.saida);
}

console.log('\no estado do link em ~/ (casa falsa, link de verdade)');
{
  const casaFalsa = mkdtempSync(join(tmpdir(), 'casa-'));
  const raizA = mkdtempSync(join(tmpdir(), 'ws-a-'));
  const outra = mkdtempSync(join(tmpdir(), 'ws-b-'));
  const peca = { juncao: '~/.claude/skills/remotion', destino: '.claude/skills/remotion' };
  const link = join(casaFalsa, '.claude', 'skills', 'remotion');
  const ligar = (alvo) => { rmSync(link, { force: true, recursive: false }); mkdirSync(join(casaFalsa, '.claude', 'skills'), { recursive: true }); symlinkSync(alvo, link, 'junction'); };
  try {
    afirma('sem link, diz que falta', estadoDaJuncao(peca, raizA, casaFalsa).estado === 'falta');
    // o link de pé noutra cópia, antes de a peça baixar aqui: não é "falta"
    mkdirSync(join(outra, '.claude', 'skills', 'remotion'), { recursive: true });
    ligar(join(outra, '.claude', 'skills', 'remotion'));
    const j1 = estadoDaJuncao(peca, raizA, casaFalsa);
    afirma('o link noutra cópia, com a peça ainda por baixar, é "outro lugar" e avisa quem perde', j1.estado === 'aponta para outro lugar' && j1.aviso.includes(realpathSync(join(outra, '.claude', 'skills', 'remotion'))), JSON.stringify(j1));
    mkdirSync(join(raizA, '.claude', 'skills', 'remotion'), { recursive: true });
    ligar(join(raizA, '.claude', 'skills', 'remotion'));
    const j2 = estadoDaJuncao(peca, raizA, casaFalsa);
    afirma('o link para esta cópia está ok, sem aviso', j2.estado === 'ok' && j2.aviso === null, JSON.stringify(j2));
    ligar(join(outra, '.claude', 'skills', 'remotion'));
    rmSync(join(outra, '.claude'), { recursive: true, force: true });
    afirma('o link para pasta apagada diz que o lugar não existe', estadoDaJuncao(peca, raizA, casaFalsa).estado === 'aponta para um lugar que não existe mais');
  } finally {
    rmSync(link, { force: true });
    for (const p of [casaFalsa, raizA, outra]) rmSync(p, { recursive: true, force: true });
  }
}

for (const p of pastas) rmSync(p, { recursive: true, force: true });
console.log(`\n# tests ${passou + falhou}\n# pass ${passou}\n# fail ${falhou}`);
if (falhou) process.exit(1);
