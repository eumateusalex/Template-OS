// A API do ditto sobe numa porta que é dela: sem API no ambiente, a porta livre
// que o sistema der; com API numa porta que tem dono, o script para e o dono
// fica de pé. Nenhum caminho derruba processo alheio.
//
// O dono de prova escuta em cada endereço onde um dono de verdade pode estar: a
// API do ditto sobe sem host (o `::` com IPv4 junto), e outra ferramenta pode
// estar no 0.0.0.0, no 127.0.0.1 ou no ::1. Testar só um deles deixa os outros
// passarem.
//
// Uso:  node --test .claude/skills/clonar-site/scripts/teste-api-local.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { escolherApi, filhoDaApi, portaOcupada, portaLivre } from './api-local.mjs';

/** Um dono de prova escutando no host pedido (sem host: como a API do ditto). */
const dono = (host, porta = 0) => new Promise((ok, falha) => {
  const s = createServer(); // servidor-falso: o dono de prova da porta, que a suíte põe em cada endereço
  s.once('error', falha);
  if (host === undefined) s.listen(porta, () => ok(s));
  else s.listen(porta, host, () => ok(s));
});
const fecha = (s) => new Promise((ok) => s.close(ok));

test('sem API no ambiente, a porta é uma livre que o sistema deu', async () => {
  const { api, porta } = await escolherApi({});
  assert.ok(porta > 0);
  assert.equal(api, `http://127.0.0.1:${porta}`);
  assert.equal(await portaOcupada(porta), false);
});

test('sem API no ambiente, a porta não é fixa: com a 8787 tomada, escolhe outra', async () => {
  const s = await dono(undefined, 8787).catch(() => null);
  try {
    const { porta } = await escolherApi({});
    assert.notEqual(porta, 8787);
    assert.equal(await portaOcupada(porta), false);
  } finally { if (s) await fecha(s); }
});

// um caso por endereço do dono: o que a API do ditto usa (sem host) e os outros três
for (const [nome, host] of [['sem host, como a API do ditto', undefined], ['0.0.0.0', '0.0.0.0'], ['127.0.0.1', '127.0.0.1'], ['::1', '::1']]) {
  test(`com API numa porta que tem dono em ${nome}, para e o dono fica de pé`, async (t) => {
    const s = await dono(host).catch((e) => (e.code === 'EADDRNOTAVAIL' || e.code === 'EAFNOSUPPORT' ? null : Promise.reject(e)));
    if (!s) return t.skip(`a máquina não tem ${nome}`);
    const porta = s.address().port;
    try {
      assert.equal(await portaOcupada(porta), true, `o dono em ${nome} passou despercebido`);
      await assert.rejects(escolherApi({ API: `http://127.0.0.1:${porta}` }), (e) => {
        assert.match(e.message, new RegExp(`porta ${porta} já tem dono`));
        assert.match(e.message, /API=/);
        return true;
      });
      assert.equal(s.listening, true, 'o dono da porta caiu');
    } finally { await fecha(s); }
  });
}

test('com API em https sem porta, confere a 443', async () => {
  // a 443 livre volta como a porta; com dono (ou sem permissão de escutar), a recusa a nomeia
  const porta = await escolherApi({ API: 'https://127.0.0.1' })
    .then((r) => r.porta, (e) => Number(/a porta (\d+) já tem dono/.exec(e.message)?.[1]));
  assert.equal(porta, 443);
});

test('com API numa porta livre, usa essa porta', async () => {
  const s = await dono(undefined);
  const porta = s.address().port;
  await fecha(s);
  const { api, porta: escolhida } = await escolherApi({ API: `http://127.0.0.1:${porta}` });
  assert.equal(escolhida, porta);
  assert.equal(api, `http://127.0.0.1:${porta}`);
});

/** Uma porta que estava livre agora há pouco. */
const portaSolta = async () => { const d = await dono(undefined); const porta = d.address().port; await fecha(d); return porta; };

test('o filho da API recebe a porta pelo PORT, e derrubar mata só ele', async () => {
  const porta = await portaSolta();
  const lancados = [];
  const mortos = [];
  const filho = filhoDaApi(porta, {
    ambiente: { OUTRA: 'fica' },
    lancar: (env) => { lancados.push(env); return { pid: 1000 + lancados.length }; },
    matar: (pid) => mortos.push(pid),
  });
  filho.derrubar();
  assert.deepEqual(mortos, [], 'sem filho, derrubar não mata ninguém');
  await filho.subir();
  assert.deepEqual(lancados[0], { OUTRA: 'fica', PORT: String(porta) });
  await filho.subir();
  assert.deepEqual(mortos, [1001], 'a sessão nova derruba a anterior antes de lançar');
  filho.derrubar();
  filho.derrubar();
  assert.deepEqual(mortos, [1001, 1002], 'cada filho morre uma vez, e só ele');
});

test('entre um filho e outro, espera a porta soltar antes de lançar', async () => {
  const s = await dono(undefined);
  const porta = s.address().port;
  let esperas = 0;
  const filho = filhoDaApi(porta, {
    lancar: () => ({ pid: 1 }),
    matar: () => {},
    esperar: async () => { esperas += 1; if (esperas === 3) await fecha(s); },
  });
  try {
    assert.deepEqual(await filho.subir(), { pid: 1 });
    assert.equal(esperas, 3);
  } finally { if (s.listening) await fecha(s); }
});

test('a porta que segue com dono depois da espera para o script, sem lançar e sem matar', async () => {
  const s = await dono(undefined);
  const porta = s.address().port;
  let esperas = 0;
  let lancou = false;
  const filho = filhoDaApi(porta, {
    lancar: () => { lancou = true; return { pid: 1 }; },
    matar: () => { throw new Error('matou um processo'); },
    esperar: async () => { esperas += 1; },
  });
  try {
    await assert.rejects(filho.subir(), new RegExp(`porta ${porta} ficou com outro dono`));
    assert.equal(esperas, 15);
    assert.equal(lancou, false);
    assert.equal(s.listening, true, 'o dono da porta caiu');
  } finally { await fecha(s); }
});

// O clona-em-lotes de verdade, com um `npm` falso no PATH no lugar da API do ditto.
const LOTES = fileURLToPath(new URL('./clona-em-lotes.mjs', import.meta.url));
function preparaLotes() {
  const pasta = mkdtempSync(join(tmpdir(), 'teste-lotes-'));
  writeFileSync(join(pasta, 'rotas.json'), JSON.stringify({ rotas: [{ rota: '/a', status: 200 }] }));
  const bin = join(pasta, 'bin');
  mkdirSync(bin);
  // o npm falso grava o PORT que recebeu e sai com erro: a API "morre ao subir"
  if (process.platform === 'win32') writeFileSync(join(bin, 'npm.cmd'), '@echo off\r\n>"%MARCA%" echo %PORT%\r\nexit /b 1\r\n');
  else { writeFileSync(join(bin, 'npm'), '#!/bin/sh\necho "$PORT" > "$MARCA"\nexit 1\n'); chmodSync(join(bin, 'npm'), 0o755); }
  const chavePath = Object.keys(process.env).find((k) => k.toUpperCase() === 'PATH') ?? 'PATH';
  const env = {
    ...process.env, [chavePath]: bin + delimiter + (process.env[chavePath] ?? ''),
    SITE: 'http://127.0.0.1:9/', ROTAS: join(pasta, 'rotas.json'), SAIDA: join(pasta, 'saida'), DITTO: pasta, MARCA: join(pasta, 'porta.txt'),
  };
  return { pasta, env };
}
const roda = (env) => new Promise((ok) => {
  const p = spawn(process.execPath, [LOTES], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let saida = '';
  p.stdout.on('data', (d) => { saida += d; });
  p.stderr.on('data', (d) => { saida += d; });
  p.on('close', (codigo) => ok({ codigo, saida }));
});

test('o clona-em-lotes com API numa porta que tem dono para, e o dono fica de pé', async () => {
  const s = await dono(undefined);
  const porta = s.address().port;
  const { pasta, env } = preparaLotes();
  try {
    const r = await roda({ ...env, API: `http://127.0.0.1:${porta}` });
    assert.equal(r.codigo, 1, r.saida);
    assert.match(r.saida, new RegExp(`porta ${porta} já tem dono`));
    assert.equal(existsSync(env.MARCA), false, 'lançou a API mesmo com a porta tomada');
    assert.equal(s.listening, true, 'o dono da porta caiu');
  } finally { await fecha(s); rmSync(pasta, { recursive: true, force: true }); }
});

test('o clona-em-lotes lança a API com a porta escolhida no PORT', async () => {
  const porta = await portaSolta();
  const { pasta, env } = preparaLotes();
  try {
    const r = await roda({ ...env, API: `http://127.0.0.1:${porta}` });
    assert.equal(r.codigo, 1, r.saida);
    assert.match(r.saida, /a API morreu ao subir/);
    assert.equal(readFileSync(env.MARCA, 'utf8').trim(), String(porta));
  } finally { rmSync(pasta, { recursive: true, force: true }); }
});

// o sistema dá a porta por um endereço só: a que já tem dono em outro é recusada, e o laço pede a seguinte
test('a porta que o sistema der e já tem dono em outro endereço é recusada', async () => {
  const s = await dono('127.0.0.1');
  const tomada = s.address().port;
  const d = await dono(undefined); const livre = d.address().port; await fecha(d);
  const fila = [tomada, livre];
  try {
    assert.equal(await portaLivre(async () => fila.shift()), livre);
    assert.equal(s.listening, true, 'o dono da porta caiu');
  } finally { await fecha(s); }
});
