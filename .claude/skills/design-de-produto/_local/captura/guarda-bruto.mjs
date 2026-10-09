// Guarda a captura consolidada na skill, com o nome da captura e sem endereço de post.
//
// Entrada: <pasta>/captura.json (o id, escrito pelo consolida.mjs), <pasta>/consolidado.json e
//          <pasta>/descartadas-menos-60.json.
// Saída  : _local/fontes/_bruto/consolidado-<id>.json e descartadas-menos-60-<id>.json
//          (ex.: consolidado-2026-10-03T030001Z.json), com todo endereço de post do texto trocado
//          por "(link de post)" pela regra única de endereco.mjs (handle, i/web/, i/, statuses,
//          twitter.com, a forma encurtada que o X mostra no texto e post do LinkedIn).
// Regras : NUNCA sobrescreve (duas capturas nunca têm o mesmo id: ver janela.mjs); recusa captura
//          sem nada novo; recusa se sobrar endereço de post depois da troca.
//
// Uso: node <skill>/_local/captura/guarda-bruto.mjs <pasta> [--saida <dir>]   (--saida: ensaio)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pastaDaCaptura } from './pasta.mjs';
import { RE_ID_CAPTURA } from './janela.mjs';
import { semEnderecoDePost, enderecosDePost } from './endereco.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const pasta = pastaDaCaptura(); // o 1º argumento, ou o ponteiro gravado pelo prepara.mjs --nova
const iS = process.argv.indexOf('--saida');
const DEST = iS > -1 ? path.resolve(process.argv[iS + 1]) : path.resolve(AQUI, '..', 'fontes', '_bruto');
const cap = JSON.parse(fs.readFileSync(path.join(pasta, 'captura.json'), 'utf8'));
if (cap.nada_novo || !cap.id) { console.log('RECUSADO: captura sem nada novo na janela; não há bruto a guardar'); process.exit(1); }
if (!RE_ID_CAPTURA.test(cap.id)) { console.log(`RECUSADO: id de captura fora do padrão: ${cap.id}`); process.exit(1); }
fs.mkdirSync(DEST, { recursive: true });
const pares = [['consolidado.json', `consolidado-${cap.id}.json`], ['descartadas-menos-60.json', `descartadas-menos-60-${cap.id}.json`]];
for (const [, d] of pares) if (fs.existsSync(path.join(DEST, d))) { console.log(`RECUSADO: ${d} já existe; nada foi gravado`); process.exit(1); }
let trocas = 0;
for (const [o, d] of pares) {
  // a regra única de endereço de post (endereco.mjs), a mesma que a régua confere
  const { texto: t, trocas: n } = semEnderecoDePost(fs.readFileSync(path.join(pasta, o), 'utf8'));
  trocas += n;
  if (enderecosDePost(t).length) { console.log(`RECUSADO: sobrou endereço de post em ${o}`); process.exit(1); }
  fs.writeFileSync(path.join(DEST, d), t, 'utf8');
}
console.log(`gravado ${pares.map((p) => p[1]).join(' e ')} em ${DEST}; ${trocas} endereço(s) de post trocado(s) por "(link de post)"`);
