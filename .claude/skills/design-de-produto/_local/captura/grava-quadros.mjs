// Grava os quadros-chave de video colhidos pelo lotes/videos-NN.js na PASTA DA CAPTURA (nunca na
// skill: o quadro ainda nao foi visto; quem leva para a galeria e o cataloga.mjs).
//
// Entrada: <pasta>/quadros-*.json (despejo de window.__quadros), um registro por post com
//          `videos: [{ n, duracao, largura, altura, quadros: [{ t, dados }] }]` (todos os videos do
//          post, na ordem). Aceita tambem o formato antigo de um video so (`quadros` no registro).
// Saida  : <pasta>/imagens/<id>__v<n>-q<1..3>.jpg (15%, 50% e 85% da duracao de cada video n) e
//          <pasta>/quadros-resumo.json (id, n, duracao, largura, altura, tempos) -- sem os dados.
// Arquivo que ja existe nao e regravado.
//
// Uso: node <skill>/_local/captura/grava-quadros.mjs <pasta> [--saida <dir fora da skill>]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extensaoPelaAssinatura } from './imagem.mjs';
import { pastaDaCaptura } from './pasta.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const pasta = pastaDaCaptura(); // o 1º argumento, ou o ponteiro gravado pelo prepara.mjs --nova
const iS = process.argv.indexOf('--saida');
const DEST = iS > -1 ? path.resolve(process.argv[iS + 1]) : path.resolve(pasta, 'imagens');
const SKILL = path.resolve(AQUI, '..', '..');
if ((DEST + path.sep).startsWith(SKILL + path.sep)) { console.log(`RECUSADO: ${DEST} fica dentro da skill; quadro nao visto nao entra na skill`); process.exit(1); }
fs.mkdirSync(DEST, { recursive: true });
const resumo = [];
let novos = 0, ja = 0; const falhas = [];
for (const f of fs.readdirSync(pasta).filter((f) => /^quadros-\d+\.json$/.test(f))) {
  for (const r of JSON.parse(fs.readFileSync(path.join(pasta, f), 'utf8'))) {
    const videos = r.videos || (r.quadros ? [{ n: 1, duracao: r.duracao, largura: r.largura, altura: r.altura, quadros: r.quadros }] : []);
    if (r.erro || !videos.length) { falhas.push(r.id + ':' + (r.erro || 'sem video')); continue; }
    for (const v of videos) {
      if (!(v.quadros || []).length) { falhas.push(`${r.id} video ${v.n}: sem quadro`); continue; }
      v.quadros.forEach((q, i) => {
        const destino = path.join(DEST, `${r.id}__v${v.n}-q${i + 1}.jpg`);
        if (fs.existsSync(destino)) { ja++; return; }
        const buf = Buffer.from(q.dados.replace(/^data:image\/jpeg;base64,/, ''), 'base64');
        if (extensaoPelaAssinatura(buf) !== 'jpg') { falhas.push(`${r.id} video ${v.n} quadro ${i + 1}: nao e JPEG`); return; }
        fs.writeFileSync(destino, buf);
        novos++;
      });
      resumo.push({ id: r.id, n: v.n, duracao: v.duracao, largura: v.largura, altura: v.altura, tempos: v.quadros.map((q) => q.t) });
    }
  }
}
fs.writeFileSync(path.join(pasta, 'quadros-resumo.json'), JSON.stringify(resumo, null, 1));
console.log(`${novos} quadro(s) novo(s), ${ja} ja gravado(s), ${resumo.length} video(s) em ${DEST}` + (falhas.length ? `; falhas: ${falhas.join(', ')}` : ''));
process.exit(falhas.length ? 1 : 0);
