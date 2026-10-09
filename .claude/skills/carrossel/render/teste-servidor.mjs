#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// teste-servidor · prova que o servidor do render serve a peça e nunca um segredo
//
// Sem Chromium e sem rede: sobe o servidor.js numa raiz de mentira, com um
// scripts/.env plantado, e pede o segredo por cada caminho que já abriu um
// servidor destes (o nome, o %2e, o "..", a barra invertida, o nome curto do
// Windows, a junção, o link, a extensão trocada, o Host de fora, o pedido de
// outro site). Quem prova que o RENDER usa este servidor é o teste-render.mjs.
//
// Uso:  node --test render/teste-servidor.mjs   (ou `npm run testar` dentro de render/)
// ═══════════════════════════════════════════════════════════════════════════

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, readdirSync, symlinkSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, basename, parse } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import http from 'node:http';

const AQUI = dirname(fileURLToPath(import.meta.url));
const { resolve, achaRaiz, basesDaPeca, sobeServidor } = createRequire(import.meta.url)('./servidor.js');

const SEGREDO = `SEGREDO-PLANTADO-${process.pid}`;
let RAIZ;
let SKILL;
let P1;
let HTML;
let BASES;
let servidor;
let porta;
const faltas = [];

before(async () => {
  RAIZ = mkdtempSync(join(tmpdir(), 'srv-'));
  SKILL = join(RAIZ, '.claude', 'skills', 'carrossel');
  P1 = join(RAIZ, 'carrosseis', 'p1');
  HTML = join(P1, 'carrossel.html');
  const escreve = (rel, conteudo) => {
    const f = join(RAIZ, ...rel.split('/'));
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, conteudo);
  };
  escreve('.claude/skills/carrossel/kit/estilo.css', 'body{}');
  escreve('.claude/settings.json', SEGREDO);
  escreve('carrosseis/p1/carrossel.html', '<p>peça</p>');
  escreve('carrosseis/p1/capa.jpg', 'JPEG-DA-CAPA');
  escreve('carrosseis/p1/fotos/f.png', 'PNG-DA-FOTO');
  escreve('carrosseis/p1/nota.md', SEGREDO);
  escreve('carrosseis/p1/dados.json', SEGREDO);
  escreve('carrosseis/p1/.env', SEGREDO);
  escreve('carrosseis/p1/.oculto.png', SEGREDO);
  escreve('carrosseis/p1/.escondida/x.png', SEGREDO);
  escreve('carrosseis/p1/segredo.cssbak', SEGREDO);
  escreve('carrosseis/p1/album.png/dentro.png', 'PNG-DENTRO');
  escreve('carrosseis/p2/outra.png', 'PNG-DE-OUTRA-PECA');
  escreve('carrosseis/.oculta/x.png', SEGREDO);
  escreve('identidade/logo.png', 'PNG-DA-LOGO');
  escreve('marketing/doc/pagina.html', '<p>documento</p>');
  escreve('clientes/a/carrossel/carrossel.html', '<p>peça do cliente a</p>');
  escreve('clientes/a/carrossel/capa.jpg', 'JPEG-DO-CLIENTE-A');
  escreve('clientes/b/site/config.js', SEGREDO);
  escreve('dados/cliente.png', 'PNG-DO-CLIENTE');
  escreve('scripts/.env', SEGREDO);
  escreve('scripts/segredo.png', SEGREDO);
  // duas junções dentro da peça: uma leva para fora dela, outra para uma pasta de ponto dela
  symlinkSync(join(RAIZ, 'scripts'), join(P1, 'atalho'), 'junction');
  symlinkSync(join(P1, '.escondida'), join(P1, 'para-escondida'), 'junction');
  BASES = basesDaPeca({ skill: SKILL, raiz: RAIZ, html: HTML });
  ({ servidor, porta } = await sobeServidor({ bases: BASES, aoFaltar: (caminho, r) => faltas.push([caminho, r.status, r.motivo]) }));
});

after(() => {
  servidor?.close();
  // as junções apontam para dentro desta mesma pasta temporária
  if (RAIZ) rmSync(RAIZ, { recursive: true, force: true });
});

/** Um pedido CRU: o caminho sai como está (com "..", barra invertida), e o Host e os cabeçalhos são os que se passar. */
function pede(caminho, { host = `127.0.0.1:${porta}`, metodo = 'GET', versao = '1.1', cabecalhos = {}, alvo = porta } = {}) {
  return new Promise((ok, falha) => {
    const s = net.connect(alvo, '127.0.0.1');
    const partes = [];
    s.on('data', (d) => partes.push(d));
    s.on('error', falha);
    s.on('end', () => {
      const bruto = Buffer.concat(partes);
      const fim = bruto.indexOf('\r\n\r\n');
      const linhas = bruto.subarray(0, fim).toString('latin1').split('\r\n');
      const cab = {};
      for (const l of linhas.slice(1)) { const i = l.indexOf(':'); cab[l.slice(0, i).toLowerCase()] = l.slice(i + 1).trim(); }
      ok({ status: Number(linhas[0].split(' ')[1]), cabecalhos: cab, corpo: bruto.subarray(fim + 4).toString('latin1') });
    });
    const extras = Object.entries(cabecalhos).map(([k, v]) => `${k}: ${v}\r\n`).join('');
    s.write(`${metodo} ${caminho} HTTP/${versao}\r\n${host === null ? '' : `Host: ${host}\r\n`}${extras}Connection: close\r\n\r\n`);
  });
}

/** Um pedido comum, pelo cliente do Node, para ler o corpo inteiro. */
function baixa(caminho) {
  return new Promise((ok, falha) => {
    http.get({ host: '127.0.0.1', port: porta, path: caminho }, (res) => {
      const b = [];
      res.on('data', (d) => b.push(d));
      res.on('end', () => ok({ status: res.statusCode, cabecalhos: res.headers, corpo: Buffer.concat(b).toString() }));
    }).on('error', falha);
  });
}

/** O nome curto (8.3) de um arquivo, ou null quando o disco não gera. */
function nomeCurto(arquivo) {
  if (process.platform !== 'win32') return null;
  const saida = execFileSync('cmd', ['/d', '/s', '/c', `"for %I in ("${arquivo}") do @echo %~snxI"`], { encoding: 'utf8', windowsVerbatimArguments: true }).trim();
  return saida && saida.toLowerCase() !== basename(arquivo).toLowerCase() ? saida : null;
}

test('serve a peça e o kit, com o tipo certo, sem cache e só para a mesma origem', async () => {
  const capa = await baixa('/carrosseis/p1/capa.jpg');
  assert.equal(capa.status, 200);
  assert.equal(capa.corpo, 'JPEG-DA-CAPA');
  assert.equal(capa.cabecalhos['content-type'], 'image/jpeg');
  assert.equal(capa.cabecalhos['x-content-type-options'], 'nosniff');
  assert.equal(capa.cabecalhos['cross-origin-resource-policy'], 'same-origin');
  assert.equal(capa.cabecalhos['cache-control'], 'no-store');
  assert.equal((await baixa('/carrosseis/p1/fotos/f.png')).corpo, 'PNG-DA-FOTO');
  assert.equal((await baixa('/.claude/skills/carrossel/kit/estilo.css')).corpo, 'body{}');
  assert.equal((await baixa('/carrosseis/p1/carrossel.html?v=2')).status, 200);
});

test('o segredo não sai por nenhum caminho', async () => {
  const tentativas = [
    '/scripts/.env', '/scripts/%2eenv', '//scripts/.env',
    '/carrosseis/../scripts/.env', '/carrosseis/%2e%2e/scripts/.env', '/carrosseis/p1/..%2f..%2fscripts%2f.env',
    '/carrosseis/p1\\..\\..\\scripts\\.env', '/carrosseis/p1%5c..%5c..%5cscripts%5c.env',
    '/carrosseis/p1/.env', '/carrosseis/p1/%2eenv', '/carrosseis/p1/ENV~1',
    '/carrosseis/p1/atalho/.env', '/carrosseis/p1/atalho/segredo.png', '/carrosseis/p1/para-escondida/x.png',
    '/.claude/settings.json', '/.claude/skills/carrossel/../../settings.json',
    '/carrosseis/p1/nota.md', '/carrosseis/p1/dados.json', '/carrosseis/p1/segredo.cssbak',
    '/carrosseis/p1/.oculto.png', '/carrosseis/.oculta/x.png', '/carrosseis/p1/capa.jpg::$DATA',
    '/clientes/b/site/config.js',
  ];
  for (const t of tentativas) {
    const r = await pede(t);
    assert.ok(r.status >= 400, `${t} respondeu ${r.status}`);
    assert.ok(!r.corpo.includes(SEGREDO), `${t} vazou o segredo`);
  }
});

test('uma peça não alcança outra pasta da raiz: nem outra peça, nem outro cliente', () => {
  assert.deepEqual(resolve(BASES, '/carrosseis/p2/outra.png'), { status: 404, motivo: 'fora' });
  assert.deepEqual(resolve(BASES, '/identidade/logo.png'), { status: 404, motivo: 'fora' });
  const doCliente = basesDaPeca({ skill: SKILL, raiz: RAIZ, html: join(RAIZ, 'clientes', 'a', 'carrossel', 'carrossel.html') });
  assert.equal(resolve(doCliente, '/clientes/a/carrossel/capa.jpg').status, 200);
  assert.deepEqual(resolve(doCliente, '/clientes/b/site/config.js'), { status: 404, motivo: 'fora' });
});

test('cada recusa diz o motivo, também antes de olhar o disco', () => {
  const r = (c) => resolve(BASES, c);
  assert.deepEqual(r('/scripts/.env'), { status: 404, motivo: 'fora' });
  assert.deepEqual(r('/carrosseis/p1/.nao-existe.png'), { status: 404, motivo: 'recusado' });
  assert.deepEqual(r('/carrosseis/p1/fotos\\nao-existe.png'), { status: 404, motivo: 'recusado' });
  assert.deepEqual(r('/carrosseis/p1/capa.jpg:zona.png'), { status: 404, motivo: 'recusado' });
  assert.deepEqual(r('/carrosseis/p1/a%00.png'), { status: 404, motivo: 'recusado' });
  assert.deepEqual(r('/carrosseis/p1'), { status: 404, motivo: 'recusado' });
  assert.deepEqual(r('/carrosseis/p1//capa.jpg'), { status: 404, motivo: 'recusado' });
  assert.deepEqual(r('/carrosseis/p1/nao-existe.md'), { status: 404, motivo: 'extensao' });
  assert.deepEqual(r('/carrosseis/p1/nao-existe.png'), { status: 404 });
  assert.deepEqual(r('/carrosseis/p1/atalho/segredo.png'), { status: 404, motivo: 'real' });
  assert.deepEqual(r('/carrosseis/p1/album.png'), { status: 404 });
  assert.deepEqual(r('/carrosseis/%E0%A4%A'), { status: 400, motivo: 'pedido' });
  assert.deepEqual(r('carrosseis/p1/capa.jpg'), { status: 400, motivo: 'pedido' });
  assert.equal(r('/carrosseis/p1/capa.jpg').status, 200);
});

test('o caminho real decide também sem nome curto: a junção para uma pasta de ponto', () => {
  assert.deepEqual(resolve(BASES, '/carrosseis/p1/para-escondida/x.png'), { status: 404, motivo: 'real' });
});

test('a extensão real decide também sem nome curto: o link de arquivo', (t) => {
  try { symlinkSync(join(P1, 'nota.md'), join(P1, 'nota-link.png'), 'file'); } catch (e) {
    if (e.code !== 'EPERM') throw e;
    t.skip('sem permissão de link de arquivo (Windows sem o modo de desenvolvedor): a extensão real fica só com o caso do nome curto');
    return;
  }
  assert.deepEqual(resolve(BASES, '/carrosseis/p1/nota-link.png'), { status: 404, motivo: 'extensao' });
});

test('o nome curto do Windows não abre o que o nome longo recusa', (t) => {
  const oculto = nomeCurto(join(P1, '.oculto.png'));
  const cssbak = nomeCurto(join(P1, 'segredo.cssbak'));
  if (!oculto || !cssbak) { t.skip('este disco não gera nome curto: o ponto e a extensão do caminho REAL ficam só com os casos da junção e do link'); return; }
  // o nome curto de .oculto.png não começa com ponto: é o caminho REAL que recusa
  assert.deepEqual(resolve(BASES, `/carrosseis/p1/${oculto}`), { status: 404, motivo: 'real' });
  // o de segredo.cssbak termina em .CSS: é a extensão REAL que recusa
  assert.deepEqual(resolve(BASES, `/carrosseis/p1/${cssbak}`), { status: 404, motivo: 'extensao' });
});

test('a raiz alcançada por uma junção ainda serve a peça: as duas pontas pelo caminho real', () => {
  const link = `${RAIZ}-juncao`;
  symlinkSync(RAIZ, link, 'junction');
  try {
    const bases = basesDaPeca({ skill: join(link, '.claude', 'skills', 'carrossel'), raiz: link, html: join(link, 'carrosseis', 'p1', 'carrossel.html') });
    assert.equal(resolve(bases, '/carrosseis/p1/capa.jpg').status, 200);
  } finally {
    rmSync(link, { recursive: true, force: true });
  }
});

test('Host de fora é recusado, mesmo no caminho que se serve', async () => {
  assert.equal((await pede('/carrosseis/p1/capa.jpg', { host: `localhost:${porta}` })).status, 200);
  assert.equal((await pede('/carrosseis/p1/capa.jpg', { host: `evil.example:${porta}` })).status, 403);
  assert.equal((await pede('/carrosseis/p1/capa.jpg', { host: `127.0.0.1:${porta + 1}` })).status, 403);
  // no HTTP/1.1 o próprio Node recusa o pedido sem Host; no 1.0 ele chega a quem atende
  assert.equal((await pede('/carrosseis/p1/capa.jpg', { host: null, versao: '1.0' })).status, 403);
});

test('o pedido que o navegador marca como de outro site é recusado', async () => {
  const com = (site) => pede('/carrosseis/p1/capa.jpg', { cabecalhos: { 'Sec-Fetch-Site': site } });
  assert.equal((await com('cross-site')).status, 403);
  assert.equal((await com('same-site')).status, 403);
  assert.equal((await com('same-origin')).status, 200);
  assert.equal((await com('none')).status, 200);
});

test('só GET e HEAD, e o HEAD sem corpo', async () => {
  const post = await pede('/carrosseis/p1/capa.jpg', { metodo: 'POST' });
  assert.equal(post.status, 405);
  assert.equal(post.cabecalhos.allow, 'GET, HEAD');
  const head = await pede('/carrosseis/p1/capa.jpg', { metodo: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(head.corpo, '');
});

test('quem sobe o servidor sabe o que faltou na página, cada caminho uma vez', async () => {
  faltas.length = 0;
  const daPagina = { cabecalhos: { 'Sec-Fetch-Site': 'same-origin' } };
  await pede('/dados/cliente.png', daPagina);
  await pede('/carrosseis/p1/nao-existe.jpg', daPagina);
  await pede('/dados/cliente.png', daPagina);
  await pede('/carrosseis/p1/outro.jpg');
  await pede('/carrosseis/p1/outro.jpg', { cabecalhos: { 'Sec-Fetch-Site': 'cross-site' } });
  await pede('/carrosseis/p1/de-outro-host.jpg', { ...daPagina, host: 'evil.example' });
  await pede('/carrosseis/p1/nao.jpg', { ...daPagina, metodo: 'POST' });
  assert.deepEqual(faltas, [['/dados/cliente.png', 404, 'fora'], ['/carrosseis/p1/nao-existe.jpg', 404, undefined]]);
});

/** Sobe um servidor à parte, pede cada caminho como se fosse a página, e devolve o que ele contou. */
async function contaFaltas(caminhos, opcoes = {}) {
  const vistas = [];
  const { servidor: s, porta: p } = await sobeServidor({ bases: BASES, aoFaltar: (c) => vistas.push(c), ...opcoes });
  try {
    for (const c of caminhos) await pede(c, { alvo: p, host: `127.0.0.1:${p}`, cabecalhos: { 'Sec-Fetch-Site': 'same-origin' } });
  } finally {
    s.close();
  }
  return vistas;
}

test('o que faltou para de contar no limite declarado', async () => {
  const vistas = await contaFaltas([1, 2, 3, 4].map((n) => `/carrosseis/p1/falta-${n}.png`), { limite: 2 });
  assert.deepEqual(vistas, ['/carrosseis/p1/falta-1.png', '/carrosseis/p1/falta-2.png']);
});

test('sem limite declarado (o render não declara), o que faltou para de contar em 50', async () => {
  const vistas = await contaFaltas(Array.from({ length: 51 }, (_, n) => `/carrosseis/p1/falta-${n + 1}.png`));
  assert.equal(vistas.length, 50);
});

test('o que o render não conta não gasta o limite', async () => {
  const soImagem = (c) => c.endsWith('.png');
  const vistas = await contaFaltas(['/carrosseis/p1/a.css', '/carrosseis/p1/b.css', '/carrosseis/p1/a.png', '/carrosseis/p1/b.png'], { limite: 2, quais: soImagem });
  assert.deepEqual(vistas, ['/carrosseis/p1/a.png', '/carrosseis/p1/b.png']);
});

test('o arquivo trancado por outro processo dá 404, e o servidor segue de pé', { skip: process.platform !== 'win32' && 'fora do Windows o arquivo não se tranca assim' }, async () => {
  const trancado = join(P1, 'trancado.png');
  writeFileSync(trancado, 'PNG-TRANCADO');
  // o caminho vai por variável de ambiente, e não dentro do comando: um apóstrofo nele fecharia a string
  const ps = spawn('powershell.exe', ['-NoProfile', '-Command', "$f=[IO.File]::Open($env:ALVO,'Open','Read','None'); 'trancado'; Start-Sleep 30; $f.Close()"],
    { stdio: ['ignore', 'pipe', 'ignore'], env: { ...process.env, ALVO: trancado } });
  const saiu = new Promise((ok) => ps.on('exit', ok));
  await new Promise((ok) => { ps.stdout.on('data', (d) => { if (/trancado/.test(d)) ok(); }); ps.on('exit', ok); });
  try {
    assert.equal((await pede('/carrosseis/p1/trancado.png')).status, 404);
    assert.equal((await pede('/carrosseis/p1/capa.jpg')).status, 200);
  } finally {
    ps.kill();
    await saiu;
  }
});

test('o servidor escuta só no 127.0.0.1, e a porta ocupada vira erro de quem sobe', async () => {
  assert.equal(servidor.address().address, '127.0.0.1');
  await assert.rejects(sobeServidor({ bases: BASES, porta }), { code: 'EADDRINUSE' });
});

test('as pastas da peça: o kit, a pasta do HTML e as do --servir', () => {
  const prefixos = (extra) => basesDaPeca({ skill: SKILL, raiz: RAIZ, html: HTML, ...extra }).map(([p]) => p);
  assert.deepEqual(prefixos({}), ['.claude/skills/carrossel', 'carrosseis/p1']);
  assert.deepEqual(prefixos({ html: join(RAIZ, 'marketing', 'doc', 'pagina.html') }), ['.claude/skills/carrossel', 'marketing/doc']);
  assert.deepEqual(prefixos({ html: join(SKILL, 'kit', 'catalogo.html') }), ['.claude/skills/carrossel']);
  assert.deepEqual(prefixos({ html: join(SKILL, 'kit', 'catalogo.html'), raiz: null }), ['.claude/skills/carrossel']);
  assert.deepEqual(prefixos({ servir: ['dados', 'dados\\fotos\\', 'carrosseis/p1'] }), ['.claude/skills/carrossel', 'carrosseis/p1', 'dados', 'dados/fotos']);
  const comDados = basesDaPeca({ skill: SKILL, raiz: RAIZ, html: HTML, servir: ['dados'] });
  assert.equal(resolve(comDados, '/dados/cliente.png').status, 200);
});

test('pasta com ponto ou "..", peça solta na raiz, HTML fora da raiz e --servir sem raiz não viram pasta servida', () => {
  assert.throws(() => basesDaPeca({ skill: SKILL, raiz: RAIZ, html: HTML, servir: ['.git'] }), /trecho que o render não serve/);
  assert.throws(() => basesDaPeca({ skill: SKILL, raiz: RAIZ, html: HTML, servir: ['/'] }), /trecho que o render não serve/);
  assert.throws(() => basesDaPeca({ skill: SKILL, raiz: RAIZ, html: HTML, servir: ['dados/../scripts'] }), /trecho que o render não serve/);
  assert.throws(() => basesDaPeca({ skill: SKILL, raiz: RAIZ, html: join(RAIZ, '.claude', 'video', 'x.html') }), /trecho que o render não serve/);
  assert.throws(() => basesDaPeca({ skill: SKILL, raiz: RAIZ, html: join(RAIZ, 'solta.html') }), /solto na raiz/);
  assert.throws(() => basesDaPeca({ skill: SKILL, raiz: P1, html: join(RAIZ, 'marketing', 'doc', 'pagina.html') }), /dentro da raiz do projeto/);
  assert.throws(() => basesDaPeca({ skill: SKILL, raiz: null, html: HTML }), /dentro da raiz do projeto/);
  assert.throws(() => basesDaPeca({ skill: SKILL, raiz: null, html: join(SKILL, 'kit', 'catalogo.html'), servir: ['dados'] }), /precisa da raiz/);
});

test('a raiz do projeto é a pasta com .claude/ acima do HTML, e nunca a pasta do usuário', () => {
  assert.equal(achaRaiz(P1), RAIZ);
  const casa = mkdtempSync(join(tmpdir(), 'casa-'));
  try {
    mkdirSync(join(casa, '.claude'));
    mkdirSync(join(casa, 'carrosseis', 'p'), { recursive: true });
    mkdirSync(join(casa, 'projetos', 'x', '.claude'), { recursive: true });
    mkdirSync(join(casa, 'projetos', 'x', 'carrosseis', 'p'), { recursive: true });
    assert.equal(achaRaiz(join(casa, 'carrosseis', 'p'), casa), null);
    assert.equal(achaRaiz(join(casa, 'projetos', 'x', 'carrosseis', 'p'), casa), join(casa, 'projetos', 'x'));
    if (process.platform === 'win32') assert.equal(achaRaiz(join(casa, 'carrosseis', 'p'), casa.toUpperCase()), null);
    // a pasta do usuário alcançada por uma junção é a mesma pasta
    const apelido = `${casa}-apelido`;
    symlinkSync(casa, apelido, 'junction');
    try {
      assert.equal(achaRaiz(join(apelido, 'carrosseis', 'p'), casa), null);
    } finally {
      rmSync(apelido, { recursive: true, force: true });
    }
  } finally {
    rmSync(casa, { recursive: true, force: true });
  }
});

test('sem projeto até a raiz do disco, e fora da pasta do usuário, a subida para: null', (t) => {
  const disco = parse(tmpdir()).root;
  if (existsSync(join(disco, '.claude'))) { t.skip(`${disco} tem .claude/: a parada na raiz do disco fica sem prova nesta máquina`); return; }
  // num processo à parte: sem a parada, o laço não termina, e só o timeout o encerra
  const codigo = `process.stdout.write(String(require(${JSON.stringify(join(AQUI, 'servidor.js'))}).achaRaiz(${JSON.stringify(disco)}, ${JSON.stringify(join(disco, 'nenhum-usuario'))})))`;
  const r = spawnSync(process.execPath, ['-e', codigo], { encoding: 'utf8', timeout: 10000 });
  assert.equal(r.stdout, 'null', r.error ? `a subida não parou (${r.error.code})` : r.stderr);
});

test('no render, só o servidor.js sobe servidor', () => {
  const doRender = readdirSync(AQUI).filter((f) => /\.(c?js|mjs)$/.test(f) && f !== 'servidor.js' && !f.startsWith('teste-'));
  for (const f of doRender) assert.doesNotMatch(readFileSync(join(AQUI, f), 'utf8'), /createServer\s*\(|\.listen\s*\(/, `${f} sobe um servidor próprio`);
});
