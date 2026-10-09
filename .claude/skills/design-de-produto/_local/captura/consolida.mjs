// Junta a captura numa linha por id, classifica e aplica o corte das respostas.
//
// Entrada (na <pasta>): enum-busca.json, respostas-lista.json, perma-*.json
// (opcional: linha-do-tempo.json, um {posts:[{id}]} da aba Posts, que tambem marca original).
// Saida : <pasta>/consolidado.json  (entrada do `escreve-fontes.mjs --consolidado`)
//         <pasta>/descartadas-menos-60.json
//         <pasta>/imagens.tsv       (id, n, url -- entrada do baixa-imagens.mjs)
//         <pasta>/captura.json      { id, referencia, de, triado_ate, nada_novo } -- o id da captura
//                                   (janela.mjs) e a referencia, que guarda-bruto.mjs, cataloga.mjs e
//                                   escreve-fontes.mjs leem
//
// Uso: node <skill>/_local/captura/consolida.mjs <pasta> [--ref <handle>] [--desde <ISO>]
// (a referencia vem de <pasta>/referencia.json, gravado pelo prepara.mjs --nova; --ref a troca)
//
// Tres regras do X:
// - ORIGINAL e so o que a busca listou como post (bateu 100% com a aba Posts). Na aba
//   "Posts e respostas" a resposta NAO mostra "Em resposta a" (o post respondido aparece
//   em cima, emendado), entao todo o resto dessa aba e resposta.
// - Resposta com menos de 60 caracteres e sem imagem nao vira arquivo (mediana das
//   respostas: 61 caracteres; 49% abaixo de 60).
// - A janela comeca em cobertura.json -> referencias.<handle>.triado_ate; o que ja tem arquivo em
//   fontes/ sai.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { origemPermitida } from './imagem.mjs';
import { pastaDaCaptura, idsComFonte } from './pasta.mjs';
import { seg, isoSeg, idCaptura } from './janela.mjs';
import { lerCobertura, handleDaCaptura, referencia } from './referencia.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const K = path.resolve(AQUI, '..');
const pasta = pastaDaCaptura(); // o 1º argumento, ou o ponteiro gravado pelo prepara.mjs --nova
const H0 = handleDaCaptura(pasta);
// janela EXCLUSIVA, em segundos inteiros UTC comparados como numero (janela.mjs)
// --desde <ISO>: outra janela (recaptura, fase 2, ou conferir uma captura antiga); com ela, a
// referencia so precisa do handle (da pasta ou de --ref), nao da entrada no cobertura.json
const iD = process.argv.indexOf('--desde');
const REF = iD < 0 || !H0 ? referencia(lerCobertura(K), H0) : null;
const HANDLE_REF = REF ? REF.handle : H0;
const HANDLE = HANDLE_REF.toLowerCase();
const DESDE = seg(iD > -1 ? process.argv[iD + 1] : REF.triado_ate);
if (Number.isNaN(DESDE)) { console.log(`a janela nao tem inicio: referencias.${HANDLE_REF}.triado_ate no cobertura.json (ou --desde) tem de ser data ISO`); process.exit(1); }
const le = (n) => (fs.existsSync(path.join(pasta, n)) ? JSON.parse(fs.readFileSync(path.join(pasta, n), 'utf8')) : null);

const jaTem = idsComFonte(path.join(K, 'fontes')); // tolera pasta de fonte ausente (clone limpo)
const perma = new Map();
for (const f of fs.readdirSync(pasta).filter((f) => /^perma-.*\.json$/.test(f)))
  for (const r of JSON.parse(fs.readFileSync(path.join(pasta, f), 'utf8'))) if (r && !r.erro && r.focal) perma.set(r.id, r);
const lista = new Map((le('respostas-lista.json') || []).map((v) => [v.id, v]));
const busca = new Map((le('enum-busca.json') || []).map((x) => [x.id, x]));
const tl = new Set(((le('linha-do-tempo.json') || {}).posts || []).map((p) => p.id));

// O permalink pega como "fio" todo post da referencia logo abaixo do focal, e o X poe ali tambem
// post solto recomendado (o mesmo post pode aparecer como continuacao de varios outros,
// inclusive de posts mais novos que ele). Continuacao de verdade
// e auto-resposta: se o item tem permalink, o focal tem de estar no contexto dele; sem
// permalink, ele nao pode ser post original da busca.
const fioValido = (f, focalId) => {
  const pf = perma.get(f.id);
  if (pf) return pf.contexto.some((c) => c.id === focalId);
  const bf = busca.get(f.id);
  return !(bf && !bf.reply);
};
const out = [], descartadas = [];
let maisNovo = null; // o triado_ate a gravar no fim: o item mais novo ENUMERADO na janela, qualquer destino
const est = { na_janela: 0, antes_da_janela: 0, ja_arquivado: 0, posts: 0, respostas_ficam: 0, respostas_com_permalink: 0, respostas_so_listagem: 0, respostas_descartadas_menos_60: 0, imagens: 0, permalinks_com_erro: 0 };
for (const id of new Set([...perma.keys(), ...lista.keys(), ...busca.keys()])) {
  const p = perma.get(id), l = lista.get(id), b = busca.get(id);
  const dt = (p && p.focal.dt) || (l && l.dt) || (b && b.dt) || '';
  if (!dt || seg(dt) <= DESDE) { est.antes_da_janela++; continue; }
  if (maisNovo === null || seg(dt) > maisNovo) maisNovo = seg(dt); // descartadas e ja arquivadas contam
  if (jaTem.has(id)) { est.ja_arquivado++; continue; }
  est.na_janela++;
  // A busca nem sempre mostra "Em resposta a" (resposta listada como post). Se o permalink
  // trouxe post de TERCEIRO acima do focal, e resposta.
  const ctxTerceiro = !!(p && p.contexto.some((c) => c.perfil && c.perfil.toLowerCase() !== HANDLE));
  const original = (!!(b && !b.reply) || tl.has(id)) && !ctxTerceiro;
  const ctxUlt = p && p.contexto.length ? p.contexto[p.contexto.length - 1].perfil : null;
  const respondeA = (b && b.respondeA) || (l && l.respondeA) || (p && p.focal.respondeA) || ctxUlt || null;
  const aSiMesmo = !original && respondeA && respondeA.toLowerCase() === HANDLE;
  const ehResposta = !original && !aSiMesmo;
  const corpo = p ? p.focal.corpo : l ? l.corpo : ((b && b.corpo) || []).join('\n\n');
  const imgs = (p ? p.focal.imgs : l ? l.imgs : b && b.imgs) || [];
  const rec = {
    id, dt, kind: ehResposta ? 'reply' : aSiMesmo ? 'self-reply' : p && p.focal.quote ? 'quote' : 'post', respondeA,
    corpo, imgs, videos: p ? p.focal.videos : [], quote: p ? p.focal.quote : null,
    card: p ? p.focal.card : null, cardLink: p ? p.focal.cardLink : null,
    metricas: (p && p.focal.metricas) || (l && l.metricas) || null,
    contexto: ehResposta && p ? p.contexto.filter((c) => c.perfil && c.perfil.toLowerCase() !== HANDLE) : [],
    fio: p ? p.fio.filter((f) => fioValido(f, id)).map((f) => ({ id: f.id, dt: f.dt, corpo: f.corpo, imgs: f.imgs })) : [],
    integral: !!p,
    lang: p ? p.focal.lang || null : null,
    traduzido: p ? !!p.focal.traduzido : !!((l && l.traduzido) || (b && b.traduzido)),
  };
  if (original && !p) est.permalinks_com_erro++;
  if (ehResposta) {
    if (corpo.length < 60 && !imgs.length) { est.respostas_descartadas_menos_60++; descartadas.push(id); continue; }
    est.respostas_ficam++;
    if (p) est.respostas_com_permalink++; else est.respostas_so_listagem++;
  } else est.posts++;
  out.push(rec);
}
out.sort((a, b) => (a.dt < b.dt ? 1 : -1));
const tsv = [];
for (const r of out) {
  r.imgs.forEach((u, i) => tsv.push([r.id, i + 1, u].join('\t')));
  // video: so a miniatura entra aqui (<id>__v<n>.jpg); os quadros-chave saem do quadros-video.js
  (r.videos || []).filter((u) => origemPermitida(u)).forEach((u, i) => tsv.push([r.id, 'v' + (i + 1), u].join('\t')));
  r.fio.forEach((f) => (f.imgs || []).forEach((u, i) => tsv.push([f.id, i + 1, u].join('\t'))));
}
est.imagens = tsv.length;
fs.writeFileSync(path.join(pasta, 'consolidado.json'), JSON.stringify(out, null, 1));
fs.writeFileSync(path.join(pasta, 'descartadas-menos-60.json'), JSON.stringify(descartadas));
fs.writeFileSync(path.join(pasta, 'imagens.tsv'), tsv.join('\n') + (tsv.length ? '\n' : ''));
console.log(est);
const cap = maisNovo === null
  ? { id: null, referencia: HANDLE_REF, de: isoSeg(DESDE), triado_ate: isoSeg(DESDE), nada_novo: true }
  : { id: idCaptura(maisNovo), referencia: HANDLE_REF, de: isoSeg(DESDE), triado_ate: isoSeg(maisNovo), nada_novo: false };
fs.writeFileSync(path.join(pasta, 'captura.json'), JSON.stringify(cap, null, 1));
if (cap.nada_novo) console.log('nada novo na janela: NAO mexer no cobertura.json (triado_ate e ate da referencia ficam como estao), nao gravar fonte, imagem, bruto nem CHANGELOG; so relatar.');
else console.log(`id da captura: ${cap.id}
triado_ate a gravar em referencias.${HANDLE_REF} no cobertura.json ao fechar: ${cap.triado_ate}`);
if (est.permalinks_com_erro) console.log(`AVISO: ${est.permalinks_com_erro} post(s) original(is) sem permalink: rode o lote de novo antes de seguir`);
