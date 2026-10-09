// Leva as imagens VISTAS e NOMEADAS para a galeria da biblioteca e fecha o elo com a fonte.
//
// Entrada: <pasta>/catalogo.json, escrito depois de olhar cada imagem (passo 4 do atualizar.md):
//   {
//     "imagens":   { "<chave>": { "arquivo": "<secao>/<assunto>-<produto>.jpg", "mostra": "<uma linha>" } },
//     "descartes": { "<chave>": "<descricao em cerca de cinco palavras>" }
//   }
//   <chave> e o nome da captura sem extensao: <id>__<n>, <id>__v1, <id>__v1-q<n>.
//   Imagem que nao mostra tela, componente, padrao, tipo de tela, shot, microcopy ou sistema
//   visual (foto de pessoa, objeto, paisagem, meme, promocao, print social, bastidor) vai em
//   "descartes" e NAO entra na galeria.
// Saida:
//   - biblioteca/galeria/<arquivo> (copia de <pasta>/imagens/<chave>.jpg; mesma imagem em duas
//     chaves vira um arquivo so; arquivo existente com conteudo diferente = erro)
//   - _local/galeria.json: o que a imagem mostra, a data da captura e as fontes dela
//     (dai o indexa-galeria.mjs gera o galeria/INDICE.md)
//   - no arquivo de fonte: `"<chave> -> galeria/<arquivo>"` no campo `imagens` e na lista do
//     corpo; descarte vira `"<chave> -> imagem nao guardada: fora do assunto da skill (<desc>)"`
//
// Uso: node <skill>/_local/captura/cataloga.mjs <pasta> [--escreve]   (sem --escreve, simula)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { extensaoPelaAssinatura, arquivoDaChave } from './imagem.mjs';
import { pastaDaCaptura, arquivosDeFonte } from './pasta.mjs';
import { diaDoPost, fusoDe } from './janela.mjs';
// as seções da galeria moram numa lista só, a do indexa-galeria.mjs
import { SECOES } from '../indexa-galeria.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const K = path.resolve(AQUI, '..');
const GALERIA = path.resolve(K, '..', 'biblioteca', 'galeria');
const ARQ_GALERIA = path.join(K, 'galeria.json');
const pasta = pastaDaCaptura(); // o 1º argumento, ou o ponteiro gravado pelo prepara.mjs --nova
const ESCREVE = process.argv.includes('--escreve');
const C = JSON.parse(fs.readFileSync(path.join(pasta, 'catalogo.json'), 'utf8'));
const imagens = C.imagens || {}, descartes = C.descartes || {};
// imagem repetida (a referência reposta): basta nomear a primeira do grupo de <pasta>/duplicadas.json
// (gerado pelo folhas.py); as outras chaves do grupo herdam o mesmo destino
if (fs.existsSync(path.join(pasta, 'duplicadas.json'))) {
  for (const g of JSON.parse(fs.readFileSync(path.join(pasta, 'duplicadas.json'), 'utf8'))) {
    const base = g.find((k) => imagens[k]) || null, fora = g.find((k) => descartes[k]) || null;
    for (const k of g) {
      if (base && !imagens[k] && !descartes[k]) imagens[k] = { ...imagens[base] };
      else if (!base && fora && !descartes[k]) descartes[k] = descartes[fora];
    }
  }
}
const NOME = /^(0[0-9]|1[0-2])-[a-z0-9-]+\/[a-z0-9]+(?:-[a-z0-9]+)+\.(?:jpg|png)$/;
const erros = [];
const hash = (f) => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex');
// o id da captura (consolida.mjs -> captura.json) é o rótulo da imagem no galeria.json e no índice
const CAP = fs.existsSync(path.join(pasta, 'captura.json')) ? JSON.parse(fs.readFileSync(path.join(pasta, 'captura.json'), 'utf8')) : {};
if (!CAP.id) { console.log('NADA GRAVADO: falta <pasta>/captura.json com o id (rode o consolida.mjs)'); process.exit(1); }
const hoje = CAP.id;
// o dia do post no fuso do dono (cobertura.json -> fuso; janela.mjs decodifica o snowflake)
const FUSO = fusoDe(JSON.parse(fs.readFileSync(path.join(K, 'cobertura.json'), 'utf8')));
const dataPost = (id) => diaDoPost(id, FUSO);

for (const [k, v] of Object.entries(imagens)) {
  if (!NOME.test(v.arquivo) || /\d{6,}|img_|image/i.test(v.arquivo)) erros.push(`nome fora do padrao <secao>/<assunto>-<produto>.jpg: ${v.arquivo}`);
  if (!SECOES[v.arquivo.split('/')[0]]) erros.push(`pasta fora das secoes da galeria: ${v.arquivo}`);
  if (!v.mostra || v.mostra.length < 20) erros.push(`${k}: "mostra" vazio ou curto demais`);
  const orig = arquivoDaChave(fs, path, path.join(pasta, 'imagens'), k);
  if (!orig) erros.push(`${k}: sem arquivo em ${pasta}/imagens`);
  else {
    // a extensão do nome segue a ASSINATURA (imagem.mjs), a mesma regra do download e da régua
    const ext = extensaoPelaAssinatura(fs.readFileSync(orig));
    if (!ext) erros.push(`${k}: o arquivo não é JPEG nem PNG`);
    else if (!v.arquivo.endsWith('.' + ext)) erros.push(`${k}: a imagem é ${ext.toUpperCase()}; nomeie ${v.arquivo.replace(/\.(jpg|png)$/, '.' + ext)}`);
  }
  if (descartes[k]) erros.push(`${k}: esta em imagens E em descartes`);
}
// mesmo arquivo de destino so pode vir da mesma imagem
const porDestino = new Map();
for (const [k, v] of Object.entries(imagens)) {
  const o = arquivoDaChave(fs, path, path.join(pasta, 'imagens'), k);
  const h = o ? hash(o) : null;
  const antes = porDestino.get(v.arquivo);
  if (antes && antes.h !== h) erros.push(`${v.arquivo}: duas imagens diferentes com o mesmo nome (${antes.k} e ${k})`);
  if (!antes) porDestino.set(v.arquivo, { k, h });
  const dest = path.join(GALERIA, v.arquivo);
  if (fs.existsSync(dest) && h && hash(dest) !== h) erros.push(`${v.arquivo}: ja existe na galeria com outro conteudo`);
}
if (erros.length) { console.log('NADA GRAVADO:\n- ' + erros.join('\n- ')); process.exit(1); }

const gal = fs.existsSync(ARQ_GALERIA) ? JSON.parse(fs.readFileSync(ARQ_GALERIA, 'utf8')) : {};
let copiadas = 0, fontesTocadas = 0, trocas = 0;
for (const [arq, { k }] of porDestino) {
  const dest = path.join(GALERIA, arq);
  if (!fs.existsSync(dest)) { copiadas++; if (ESCREVE) { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(arquivoDaChave(fs, path, path.join(pasta, 'imagens'), k), dest); } }
}
for (const [k, v] of Object.entries(imagens)) {
  const id = k.split('__')[0];
  const e = gal[v.arquivo] || (gal[v.arquivo] = { mostra: v.mostra, captura: hoje, posts: [], fontes: [] });
  if (!e.posts.includes(dataPost(id))) e.posts.push(dataPost(id));
  if (!e.fontes.includes(id)) e.fontes.push(id);
  e.posts.sort(); e.fontes.sort();
}
const destino = (k) => imagens[k] ? `galeria/${imagens[k].arquivo}` : descartes[k] ? `imagem não guardada: fora do assunto da skill (${descartes[k]})` : null;
// todas as pastas de fonte (pasta.mjs), tolerando as que não existem
for (const { caminho: p } of arquivosDeFonte(path.join(K, 'fontes'))) {
  const t0 = fs.readFileSync(p, 'utf8');
  const t = t0
    .replace(/^(  - ")(\S+) -> \(a catalogar\)"$/gm, (m, a, k) => { const x = destino(k); if (!x) return m; trocas++; return `${a}${k} -> ${x}"`; })
    .replace(/(\b\d{15,20}__(?:\d+|v\d+(?:-q\d+)?)\b)( \(mídia [^)]*\))? -> \(a catalogar\)/g, (m, k, midia = '') => { const x = destino(k); return x ? `${k}${midia} -> ${x}` : m; });
  if (t !== t0) { fontesTocadas++; if (ESCREVE) fs.writeFileSync(p, t, 'utf8'); }
}
if (ESCREVE) fs.writeFileSync(ARQ_GALERIA, JSON.stringify(Object.fromEntries(Object.entries(gal).sort()), null, 1) + '\n');
console.log(`${copiadas} imagem(ns) nova(s) na galeria, ${Object.keys(descartes).length} descartada(s), ${trocas} elo(s) em ${fontesTocadas} arquivo(s) de fonte`, ESCREVE ? '(gravado)' : '(simulacao)');
console.log('depois: node <skill>/_local/indexa-galeria.mjs --escreve  (regenera o galeria/INDICE.md)');
