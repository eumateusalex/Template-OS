// Baixa as imagens de uma captura para a PASTA DA CAPTURA, em tamanho original. Nunca para a skill:
// imagem baixada ainda nao foi vista; quem leva para a galeria e o cataloga.mjs, depois de vista e
// nomeada pelo que mostra.
//
// Entrada: <pasta>/imagens.tsv (id, n, url), gerado pelo consolida.mjs.
// Saida  : <pasta>/imagens/<id>__<n>.<jpg|png> (padrao) -- a chave que o mapa `imagens:` do arquivo de
//          fonte usa; a extensao sai da assinatura dos bytes. Arquivo que ja existe nao e baixado de novo.
// Regras : so baixa da lista fechada de origens de imagem.mjs (pbs.twimg.com/media/ e miniaturas de
//          video, media.licdn.com), com redirecionamento proibido; o que nao for JPEG nem PNG e recusado.
//
// pbs.twimg.com nao e assinado nem expira: trocar `name=<qualquer>` por `name=orig` da o
// original, sem login. (O CDN do LinkedIn e o contrario: expira em semanas, baixar na hora.)
//
// Uso: node <skill>/_local/captura/baixa-imagens.mjs <pasta> [--saida <dir>]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pastaDaCaptura } from './pasta.mjs';
import { baixar, arquivoDaChave } from './imagem.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const pasta = pastaDaCaptura(); // o 1º argumento, ou o ponteiro gravado pelo prepara.mjs --nova
// --saida <dir>: outro lugar, desde que FORA da skill
const iS = process.argv.indexOf('--saida');
const COFRE = iS > -1 ? path.resolve(process.argv[iS + 1]) : path.resolve(pasta, 'imagens');
const SKILL = path.resolve(AQUI, '..', '..');
if ((COFRE + path.sep).startsWith(SKILL + path.sep)) { console.log(`RECUSADO: ${COFRE} fica dentro da skill; imagem nao vista nao entra na skill (o cataloga.mjs leva a galeria)`); process.exit(1); }
fs.mkdirSync(COFRE, { recursive: true });
const linhas = fs.readFileSync(path.join(pasta, 'imagens.tsv'), 'utf8').split('\n').filter(Boolean);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36';
let novas = 0, ja = 0, falhas = 0, bytes = 0;
for (const l of linhas) {
  const [id, n, url] = l.split('	');
  const chave = `${id}__${n}`;
  if (arquivoDaChave(fs, path, COFRE, chave)) { ja++; continue; }
  const orig = url.replace(/name=[a-z0-9x]+/, 'name=orig');
  // lista fechada de origens, sem redirecionamento, extensão pela assinatura (imagem.mjs)
  let r = { ok: false, motivo: '' };
  for (let t = 0; t < 3 && !r.ok; t++) {
    r = await baixar(orig, { ua: UA });
    if (!r.ok && /origem fora da lista|assinatura/.test(r.motivo)) break; // erro que não se resolve tentando de novo
    if (!r.ok) await new Promise((ok) => setTimeout(ok, 2000 * (t + 1)));
  }
  if (r.ok) { fs.writeFileSync(path.join(COFRE, `${chave}.${r.ext}`), r.buf); bytes += r.buf.length; novas++; }
  else { falhas++; console.log('FALHOU', chave, r.motivo); }
}
console.log(`${novas} nova(s), ${ja} ja baixada(s), ${falhas} falha(s), ${(bytes / 1048576).toFixed(1)} MB em ${COFRE}`);
process.exit(falhas ? 1 : 0);
