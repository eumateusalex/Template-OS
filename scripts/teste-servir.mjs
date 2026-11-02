#!/usr/bin/env node
// Prova que o `servir.mjs` serve só o que recebe e nunca um segredo.
//
// Sobe o servidor de verdade (outro processo) numa pasta falsa com um .env, e
// pede pelo caminho cru: o fetch e o URL resolveriam o `%2e` e o `..` antes de
// mandar, e o que se prova aqui é o que o servidor faz com o que chega.
//
// Uso:  node scripts/teste-servir.mjs
// mutação: scripts/servir.mjs · "  bases = [[basename(pasta), pasta]];" → "  bases = [[basename(pasta), join(pasta, '..')]];" · pega
// mutação: scripts/servir.mjs · "      if (p.split('/').some((s) => !s || s === '..' || s.startsWith('.') || /[\\:\0]/.test(s))) {" → "      if (false) {" · pega
// mutação: scripts/servir.mjs · "  if (pasta.toLowerCase() === absoluto(RAIZ).toLowerCase() || basename(pasta).startsWith('.')) {" → "  if (false) {" · pega

import { spawn, spawnSync } from 'node:child_process';
import { request } from 'node:http';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SERVIR = fileURLToPath(new URL('./servir.mjs', import.meta.url));
let passou = 0, falhou = 0;
const afirma = (nome, cond, extra = '') => {
  if (cond) { passou++; console.log(`  ok   ${nome}`); }
  else { falhou++; console.log(`  FALHOU ${nome}${extra ? ` · ${extra}` : ''}`); }
};

const pede = (porta, caminho, host = `127.0.0.1:${porta}`) => new Promise((ok) => {
  const req = request({ host: '127.0.0.1', port: porta, path: caminho, headers: { host } }, (res) => {
    let corpo = '';
    res.setEncoding('utf8');
    res.on('data', (d) => { corpo += d; });
    res.on('end', () => ok({ status: res.statusCode, corpo }));
  });
  req.on('error', (e) => ok({ status: 0, corpo: e.message }));
  req.end();
});

/** Sobe o servir.mjs e devolve a porta da primeira linha, e o processo. */
const sobe = (args) => new Promise((ok, falha) => {
  const p = spawn(process.execPath, [SERVIR, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
  let saida = '';
  const prazo = setTimeout(() => { p.kill(); falha(new Error(`não subiu em 10 s: ${saida}`)); }, 10000);
  p.stdout.on('data', (d) => {
    saida += d;
    const m = saida.match(/http:\/\/127\.0\.0\.1:(\d+)/);
    if (m) { clearTimeout(prazo); ok({ porta: Number(m[1]), processo: p }); }
  });
  p.stderr.on('data', (d) => { saida += d; });
  p.on('exit', (c) => { clearTimeout(prazo); falha(new Error(`saiu com ${c}: ${saida}`)); });
});

const TMP = mkdtempSync(join(tmpdir(), 'teste-servir-'));
const planta = (rel, conteudo = 'x') => { const p = join(TMP, ...rel.split('/')); mkdirSync(join(p, '..'), { recursive: true }); writeFileSync(p, conteudo); };
const vivos = [];
try {
  planta('peca/estilo.css', 'body{}');
  planta('peca/.env', 'SEGREDO_FALSO=1');
  planta('peca/notas.md', 'notas');
  planta('fora/segredo.css', 'nao');
  planta('.env', 'SEGREDO_FALSO=1');

  console.log('\n--pasta serve a pasta e nada além');
  {
    const { porta, processo } = await sobe(['--pasta', join(TMP, 'peca')]);
    vivos.push(processo);
    const css = await pede(porta, '/peca/estilo.css');
    afirma('serve o arquivo da pasta', css.status === 200 && css.corpo === 'body{}', `${css.status}`);
    for (const c of ['/peca/.env', '/peca/%2eenv', '/peca/%2Eenv', '/peca/../.env', '/peca/..%2f.env', '/.env', '/peca/notas.md', '/peca/../fora/segredo.css', '/fora/segredo.css', '/peca/', '/']) {
      const r = await pede(porta, c);
      afirma(`recusa ${c}`, r.status !== 200 && !/SEGREDO|nao/.test(r.corpo), `${r.status}`);
    }
    const host = await pede(porta, '/peca/estilo.css', 'malicioso.exemplo:80');
    afirma('recusa o Host de fora (403)', host.status === 403, `${host.status}`);
  }

  console.log('\n--raiz e --servir servem cada pasta no seu prefixo');
  {
    const { porta, processo } = await sobe(['--raiz', TMP, '--servir', 'peca']);
    vivos.push(processo);
    afirma('serve /peca/estilo.css', (await pede(porta, '/peca/estilo.css')).status === 200);
    afirma('não serve a pasta irmã', (await pede(porta, '/fora/segredo.css')).status !== 200);
    afirma('não serve o .env da raiz', (await pede(porta, '/.env')).status !== 200);
  }

  console.log('\nentrada ruim sai antes de subir');
  {
    const r = spawnSync(process.execPath, [SERVIR, '--raiz', TMP, '--servir', '.git'], { encoding: 'utf8', timeout: 5000 });
    afirma('a base com ponto no começo sai com 2', r.status === 2, `${r.status} ${r.stderr}`);
    const p = spawnSync(process.execPath, [SERVIR, '--pasta', TMP, '--porta', 'abc'], { encoding: 'utf8', timeout: 5000 });
    afirma('a porta que não é número sai com 2', p.status === 2, `${p.status}`);
    const raiz = spawnSync(process.execPath, [SERVIR, '--pasta', join(SERVIR, '..', '..')], { encoding: 'utf8', timeout: 5000 });
    afirma('a raiz do workspace inteira sai com 2', raiz.status === 2, `${raiz.status}`);
    mkdirSync(join(TMP, '.oculta'), { recursive: true });
    const oculta = spawnSync(process.execPath, [SERVIR, '--pasta', join(TMP, '.oculta')], { encoding: 'utf8', timeout: 5000 });
    afirma('a pasta oculta sai com 2', oculta.status === 2, `${oculta.status}`);
    const n = spawnSync(process.execPath, [SERVIR], { encoding: 'utf8', timeout: 5000 });
    afirma('sem o que servir sai com 2 (nunca a raiz inteira)', n.status === 2, `${n.status}`);
  }
} finally {
  for (const p of vivos) p.kill();
  rmSync(TMP, { recursive: true, force: true });
}

console.log(`\n# tests ${passou + falhou}\n# pass ${passou}\n# fail ${falhou}`);
process.exitCode = falhou ? 1 : 0;
