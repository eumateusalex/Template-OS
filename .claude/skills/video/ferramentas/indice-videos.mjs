// indice-videos.mjs · o índice das peças de vídeo entregues, para achar rápido. Cada entrega em
// saidas/ leva um registro.json (o modelo do relatório ao lado, modelo-relatorio.md); este script confere os
// registros e gera a tabela.
//
//   node indice-videos.mjs conferir <saidas>         # o registro de cada pasta de vídeo
//   node indice-videos.mjs indice <saidas> [--md <arquivo>]
//
// A pasta da entrega se chama <estilo>-<tema>-<AAAA-MM-DD> (o estilo é o código do mapa de
// estilos, em minúscula: motion, falado-motion, falado, corte, longo, explica, anuncio-meta,
// anuncio-google, bumper, vinheta, laco, comercial, documental). O registro diz o que a máquina mediu
// e o que ele decidiu; o índice sai dele, nunca à mão.
import { readFileSync, readdirSync, existsSync, writeFileSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ESTILOS = ['motion', 'falado-motion', 'falado', 'corte', 'longo', 'explica', 'anuncio-meta', 'anuncio-google', 'bumper', 'vinheta', 'laco', 'comercial', 'documental'];
// os estilos cujo "O que sai" (estilos.md § 3) é só o vídeo: não têm post próprio, então não levam LEGENDA.md
export const SO_O_MP4 = ['vinheta', 'bumper', 'laco'];
export const CAMPOS = ['estilo', 'destino', 'tema', 'data', 'duracao_s', 'legenda', 'skill', 'lufs', 'pico_dbtp', 'reguas', 'critico', 'arquivos'];
const NOME = /^([a-z-]+?)-([a-z0-9-]+)-(\d{4}-\d{2}-\d{2})$/;

export function conferirRegistro(pasta, r) {
  const erros = [];
  const nome = basename(pasta);
  for (const c of CAMPOS) if (r[c] === undefined || r[c] === null) erros.push(`${nome}: falta o campo ${c}`);
  if (r.estilo && !ESTILOS.includes(r.estilo)) erros.push(`${nome}: o estilo "${r.estilo}" não está no mapa (${ESTILOS.join(', ')})`);
  const m = nome.match(NOME);
  const comeca = ESTILOS.filter((e) => nome.startsWith(e + '-')).sort((a, b) => b.length - a.length)[0];
  if (!m || !comeca) erros.push(`${nome}: a pasta não segue <estilo>-<tema>-<AAAA-MM-DD>`);
  else if (r.estilo && comeca !== r.estilo) erros.push(`${nome}: a pasta diz "${comeca}" e o registro diz "${r.estilo}"`);
  if (m && r.data && m[3] !== r.data) erros.push(`${nome}: a data da pasta (${m[3]}) não é a do registro (${r.data})`);
  if (r.legenda && !['L0', 'L1', 'L2', 'L3', 'LF'].includes(r.legenda)) erros.push(`${nome}: legenda "${r.legenda}" fora de L0 a L3 e LF`);
  for (const [k, v] of Object.entries(r.arquivos || {})) if (v && !existsSync(join(pasta, v))) erros.push(`${nome}: o arquivo ${k} (${v}) não está na pasta`);
  // o relatório e a legenda têm um nome só, em maiúscula (estilos.md, "O registro da entrega"): o
  // nome se lê da pasta, porque o disco do Windows acha relatorio.md quando se pede RELATORIO.md
  // a peça P sem post próprio (a vinheta, o bumper, o laço) entrega só o MP4 e o relatório, sem a LEGENDA.md
  const nomes = existsSync(pasta) ? readdirSync(pasta) : [];
  const pede = SO_O_MP4.includes(r.estilo) ? ['RELATORIO.md'] : ['RELATORIO.md', 'LEGENDA.md'];
  for (const n of pede) if (!nomes.includes(n)) erros.push(`${nome}: falta o ${n} na pasta${nomes.some((x) => x.toLowerCase() === n.toLowerCase()) ? ' (há um com outra caixa; o nome é este)' : ''}`);
  if (r.critico && r.critico.veredito === 'APROVA' && (r.critico.notas || []).some((n) => n < 8)) erros.push(`${nome}: o crítico "aprova" com nota abaixo de 8`);
  if (r.reguas && Object.values(r.reguas).some((v) => !['verde', 'reprova', 'nao-se-aplica'].includes(v))) erros.push(`${nome}: régua com estado fora de verde, reprova e nao-se-aplica`);
  return erros;
}

export function lerRegistros(saidas) {
  return readdirSync(saidas).map((n) => join(saidas, n)).filter((p) => statSync(p).isDirectory() && existsSync(join(p, 'registro.json')))
    .map((p) => ({ pasta: p, r: JSON.parse(readFileSync(join(p, 'registro.json'), 'utf8')) }));
}

// A entrega fechada sai de saidas/ e leva o registro: sem entrega em andamento, nada foi
// medido, e o resumo não pode dizer verde (uma régua que não leu nada passaria calada).
export function veredito(n, erros) {
  if (n === 0) return '0 registros: nada a conferir (nenhuma entrega de vídeo em andamento)';
  return `${n} registros: ${erros.length ? 'REPROVA' : 'verde'}`;
}

export function indice(registros) {
  const linhas = registros.slice().sort((a, b) => (b.r.data || '').localeCompare(a.r.data || '') || basename(a.pasta).localeCompare(basename(b.pasta)))
    .map(({ pasta, r }) => {
      const reprova = Object.entries(r.reguas || {}).filter(([, v]) => v === 'reprova').map(([k]) => k);
      return `| ${r.data} | ${r.estilo} | ${r.tema} | ${r.destino} | ${r.duracao_s} s | ${r.legenda} | ${r.lufs} LUFS | ${reprova.length ? 'reprova: ' + reprova.join(', ') : 'verde'} | ${r.critico?.veredito || 'sem crítico'} | \`${basename(pasta)}/\` |`;
    });
  return ['| data | estilo | tema | destino | duração | legenda | volume | réguas | crítico | pasta |', '|---|---|---|---|---|---|---|---|---|---|', ...linhas].join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [cmd, saidas] = process.argv.slice(2);
  if (!['conferir', 'indice'].includes(cmd) || !saidas) { console.error('uso: indice-videos.mjs conferir|indice <saidas> [--md <arquivo>]'); process.exit(2); }
  const regs = lerRegistros(saidas);
  if (cmd === 'conferir') {
    const erros = regs.flatMap(({ pasta, r }) => conferirRegistro(pasta, r));
    erros.forEach((e) => console.log(`ERRO  ${e}`));
    console.log(veredito(regs.length, erros));
    process.exitCode = erros.length ? 1 : 0;
  } else {
    const md = indice(regs);
    const i = process.argv.indexOf('--md');
    if (i > 0) writeFileSync(process.argv[i + 1], md + '\n'); else console.log(md);
  }
}
