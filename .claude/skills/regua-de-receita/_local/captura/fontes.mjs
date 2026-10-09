// As fontes que a skill acompanha: quem usa escolhe, este script grava no cobertura.json.
//
// Uma fonte e o lugar de onde sai material novo para a skill: um perfil do X, um perfil do
// LinkedIn, um site ou boletim, um arquivo local. Cada uma guarda ate onde ja foi lida e julgada, e a
// proxima captura dela comeca dali. A regra do que e uma fonte valida mora em ../regra-de-fonte.cjs
// (a mesma que o verificar.js cobra).
//
//   node <skill>/_local/captura/fontes.mjs                                         lista as fontes e onde cada uma parou
//   node <skill>/_local/captura/fontes.mjs adiciona x <handle> --desde AAAA-MM-DD   (o primeiro dia que entra)
//   node <skill>/_local/captura/fontes.mjs adiciona linkedin <endereço do perfil> [--desde AAAA-MM-DD]
//   node <skill>/_local/captura/fontes.mjs adiciona web <endereço> [--desde AAAA-MM-DD]
//   node <skill>/_local/captura/fontes.mjs adiciona arquivo <caminho a partir da raiz do workspace>
//   node <skill>/_local/captura/fontes.mjs avanca <nome> <marca>     X: o triado_ate que o consolida.mjs imprimiu;
//                                                                   os outros: AAAA-MM-DD do item mais novo lido
//   node <skill>/_local/captura/fontes.mjs remove <nome>
//
// Nada aqui navega nem baixa: so grava a lista. A marca nunca anda para tras.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { segundosUTC, isoSegundos } from './janela.mjs';

const { TIPOS, nomeDaFonte, errosDaFonte, errosDasFontes } = createRequire(import.meta.url)('../regra-de-fonte.cjs');
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const K = path.resolve(AQUI, '..');
const ARQ = path.join(K, 'cobertura.json');

const le = () => JSON.parse(fs.readFileSync(ARQ, 'utf8'));
const grava = (c) => fs.writeFileSync(ARQ, JSON.stringify(c, null, 2) + '\n', 'utf8');
const para = (msg) => { console.log(msg); process.exit(1); };
const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };

// a marca inicial: X guarda o instante ANTES do primeiro dia (a janela e exclusiva); os outros, o dia
// anterior ao primeiro que entra (lido_ate = ja lido ate ali)
function marcaInicial(tipo, desde) {
  if (desde === null) return tipo === 'x' ? undefined : null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || !Number.isFinite(Date.parse(desde + 'T00:00:00Z'))) para(`--desde ${desde}: use AAAA-MM-DD`);
  const s = segundosUTC(desde + 'T00:00:00Z') - 1;
  return tipo === 'x' ? isoSegundos(s) : isoSegundos(s).slice(0, 10);
}

const cmd = process.argv[2];
const C = le();
C.fontes = C.fontes || [];

if (!cmd) {
  if (!C.fontes.length) { console.log('nenhuma fonte ainda. Adicione com: fontes.mjs adiciona <x | linkedin | web | arquivo> <...>'); process.exit(0); }
  for (const f of C.fontes) {
    const def = TIPOS[f.tipo] || {};
    console.log(`${f.nome}  (${f.tipo}: ${f[def.campo]})  lido até: ${f[def.marca] ?? 'nada ainda'}`);
  }
  const erros = errosDasFontes(C.fontes);
  erros.forEach((e) => console.log('ERRO', e));
  process.exit(erros.length ? 1 : 0);
}

if (cmd === 'adiciona') {
  const tipo = process.argv[3], valor = process.argv[4];
  const def = TIPOS[tipo];
  if (!def || !valor || valor.startsWith('--')) para('uso: fontes.mjs adiciona <x | linkedin | web | arquivo> <handle | perfil | endereço | caminho> [--desde AAAA-MM-DD]');
  const desde = arg('--desde');
  if (tipo === 'x' && !desde) para('fonte do X precisa de --desde AAAA-MM-DD: o primeiro dia que a primeira captura lê');
  const valorLimpo = tipo === 'x' ? valor.replace(/^@/, '') : valor;
  const fonte = { nome: nomeDaFonte(tipo, valorLimpo), tipo, [def.campo]: valorLimpo, [def.marca]: marcaInicial(tipo, desde) };
  const erros = errosDaFonte(fonte);
  if (tipo === 'arquivo' && !erros.length) {
    // o caminho e relativo a raiz do workspace (de onde o roteiro roda)
    if (!fs.existsSync(path.resolve(process.cwd(), valorLimpo))) erros.push(`${fonte.nome}: o arquivo ${valorLimpo} não existe (a partir de ${process.cwd()})`);
  }
  if (C.fontes.some((f) => f.nome === fonte.nome)) erros.push(`já existe uma fonte chamada ${fonte.nome}`);
  if (erros.length) para('RECUSADO: ' + erros.join('; '));
  C.fontes.push(fonte);
  grava(C);
  console.log(`fonte ${fonte.nome} adicionada (${tipo}: ${valorLimpo}); lido até: ${fonte[def.marca] ?? 'nada ainda'}`);
  process.exit(0);
}

if (cmd === 'avanca') {
  const nome = process.argv[3], marca = process.argv[4];
  const f = C.fontes.find((x) => x.nome === nome);
  if (!f || !marca) para(`uso: fontes.mjs avanca <nome> <marca>. Fontes: ${C.fontes.map((x) => x.nome).join(', ') || 'nenhuma'}`);
  const def = TIPOS[f.tipo];
  const nova = { ...f, [def.marca]: marca };
  const erros = errosDaFonte(nova);
  if (erros.length) para('RECUSADO: ' + erros.join('; '));
  const atual = f[def.marca];
  if (atual !== null && atual !== undefined) {
    const antes = f.tipo === 'x' ? segundosUTC(atual) : atual, depois = f.tipo === 'x' ? segundosUTC(marca) : marca;
    if (depois < antes) para(`RECUSADO: ${marca} fica antes de ${atual}; a marca de ${nome} não anda para trás`);
    if (depois === antes) { console.log(`${nome} já está em ${atual}: nada muda`); process.exit(0); }
  }
  C.fontes[C.fontes.indexOf(f)] = nova;
  grava(C);
  console.log(`${nome}: ${def.marca} ${atual ?? 'nada ainda'} -> ${marca}`);
  process.exit(0);
}

if (cmd === 'remove') {
  const nome = process.argv[3];
  if (!C.fontes.some((x) => x.nome === nome)) para(`não existe fonte ${nome}`);
  C.fontes = C.fontes.filter((x) => x.nome !== nome);
  grava(C);
  console.log(`fonte ${nome} removida`);
  process.exit(0);
}

para('uso: fontes.mjs [adiciona <tipo> <valor> [--desde AAAA-MM-DD] | avanca <nome> <marca> | remove <nome>]');
