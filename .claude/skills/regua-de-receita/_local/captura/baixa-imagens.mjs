// Baixa as imagens de uma captura para a PASTA DA CAPTURA, em tamanho original, para serem vistas.
//
// Nada vai direto para a skill: a imagem so entra em assets/ depois de vista, nomeada pelo que
// mostra e posta na pasta do tema (guarda-imagens.mjs). E so se baixa imagem de post que virou
// principio: rode depois da triagem, com --ids dos posts de destino `principio`; post fora do
// assunto nao tem imagem baixada.
//
// Entrada: <pasta>/imagens.tsv (id, n, url), gerado pelo consolida.mjs.
// Saida  : <pasta>/imagens/<id>__<n>.<ext>  -- nome de trabalho, so dentro da pasta da captura;
//          <ext> (jpg, png, webp) lida da assinatura do arquivo baixado, nunca da URL.
//
// pbs.twimg.com nao e assinado nem expira: trocar `name=<qualquer>` por `name=orig` da o
// original, sem login. (O CDN do LinkedIn e o contrario: expira em semanas, baixar na hora.)
//
// Uso: node <skill>/_local/captura/baixa-imagens.mjs <pasta> --ids <id1,id2,...> [--saida <dir>]
//      (--ids e obrigatorio: e ele que impede baixar imagem de post fora do assunto)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { argPasta } from './pasta.mjs';
import { baixarImagem } from './imagens.mjs';

const pasta = argPasta(process.argv[2]);   // `@atual` = a captura do ponteiro (pasta.mjs)
const iIds = process.argv.indexOf('--ids');
if (!pasta || iIds < 0) {
  console.log('uso: baixa-imagens.mjs <pasta | @atual> --ids <ids dos posts que viraram princípio, separados por vírgula>');
  process.exit(1);
}
const dentro = new Set((process.argv[iIds + 1] || '').split(',').map((s) => s.trim()).filter(Boolean));
const iS = process.argv.indexOf('--saida');
const DESTINO = path.resolve(iS > -1 ? argPasta(process.argv[iS + 1]) : path.join(pasta, 'imagens'));
// Nunca grava dentro da skill: imagem nao vista nao entra em assets/. Quem escreve la e so o
// guarda-imagens.mjs, que exige a imagem vista, o tema e o nome.
const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const rel = path.relative(SKILL, DESTINO);
if (!rel.startsWith('..') && !path.isAbsolute(rel)) {
  console.log(`RECUSADO: ${DESTINO} fica dentro da skill. Baixe para a pasta da captura (padrão: <pasta>/imagens).`);
  process.exit(1);
}
fs.mkdirSync(DESTINO, { recursive: true });
const tsv = path.join(pasta, 'imagens.tsv');
const linhas = (fs.existsSync(tsv) ? fs.readFileSync(tsv, 'utf8') : '').split('\n').filter(Boolean);
// --linkedin <arquivo>: o despejo do linkedin.js ({ posts: [{ urn, imgs }] }); as imagens dele
// passam pelo MESMO portao (lista de hosts, sem redirecionamento, assinatura). Nunca curl.
const iLi = process.argv.indexOf('--linkedin');
if (iLi > -1) {
  const li = JSON.parse(fs.readFileSync(argPasta(process.argv[iLi + 1]), 'utf8'));
  for (const p of li.posts || []) {
    const id = (String(p.urn || '').match(/(\d{15,})/) || [])[1];
    if (id) (p.imgs || []).forEach((u, i) => linhas.push([id, i + 1, u].join('\t')));
  }
}
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36';
let novas = 0, ja = 0, falhas = 0, fora = 0, recusadas = 0, bytes = 0;
for (const l of linhas) {
  const [id, n, url] = l.split('\t');
  if (!dentro.has(id)) { fora++; continue; }
  const chave = `${id}__${n}`;
  if (fs.readdirSync(DESTINO).some((f) => f.startsWith(chave + '.') && fs.statSync(path.join(DESTINO, f)).size > 0)) { ja++; continue; }
  const orig = url.startsWith('https://pbs.twimg.com/media/') ? url.replace(/name=[a-z0-9x]+/, 'name=orig') : url;
  let res = null;
  // so tenta de novo falha de rede; host fora da lista, redirecionamento e assinatura errada nao
  for (let t = 0; t < 3; t++) {
    res = await baixarImagem(orig, { headers: { 'User-Agent': UA } });
    if (res.ok || !res.rede) break;
    await new Promise((r) => setTimeout(r, 2000 * (t + 1)));
  }
  if (res.ok) {
    // a extensao sai da assinatura do arquivo, nunca da URL (o X serve PNG com format=jpg)
    fs.writeFileSync(path.join(DESTINO, `${chave}.${res.ext}`), res.buf); bytes += res.buf.length; novas++;
  } else if (res.rede) { falhas++; console.log('FALHOU', chave, res.motivo); }
  else { recusadas++; console.log('RECUSADA', chave, res.motivo); }
}
console.log(`${novas} nova(s) em ${DESTINO}, ${ja} já baixada(s), ${fora} de post fora da lista (não baixadas), ${recusadas} recusada(s) pelo portão (host, redirecionamento ou assinatura), ${falhas} falha(s) de rede, ${(bytes / 1048576).toFixed(1)} MB`);
console.log('Agora: abra cada uma, decida e descreva em <pasta>/imagens.json, e rode guarda-imagens.mjs <pasta>.');
process.exit(falhas || recusadas ? 1 : 0);
