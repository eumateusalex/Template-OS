// Junta a captura de uma fonte do X numa linha por id, classifica e aplica o corte das respostas.
//
// Entrada (na <pasta>): fonte.json, enum-busca.json, respostas-lista.json, perma-*.json
// (opcional: linha-do-tempo.json, um {posts:[{id}]} da aba Posts, que tambem marca original).
// Saida : <pasta>/consolidado.json  (entrada do `escreve-textos.mjs --consolidado`)
//         <pasta>/descartadas-menos-60.json
//         <pasta>/imagens.tsv       (id, n, url -- entrada do baixa-imagens.mjs)
//
// Uso: node <skill>/_local/captura/consolida.mjs <pasta> [--desde <ISO>]
//
// Tres regras:
// - ORIGINAL e so o que a busca listou como post (bate com a aba Posts). Na aba
//   "Posts e respostas" a resposta NAO mostra "Em resposta a" (o post respondido aparece
//   em cima, emendado), entao todo o resto dessa aba e resposta.
// - Resposta com menos de 60 caracteres e sem imagem nao vira texto (respostas curtas sao, na
//   maioria, "valeu", "boa", "concordo").
// - A janela comeca no `desde` do fonte.json (o triado_ate da fonte quando a captura nasceu).

import fs from 'node:fs';
import path from 'node:path';
import { argPasta, argFonte } from './pasta.mjs';
import { segundosUTC, isoSegundos } from './janela.mjs';

const pasta = argPasta(process.argv[2]);   // `@atual` = a captura do ponteiro (pasta.mjs)
if (!pasta) { console.log('uso: consolida.mjs <pasta | @atual> [--desde <ISO>]'); process.exit(1); }
const FONTE = argFonte(pasta);
if (FONTE.tipo !== 'x') { console.log(`a captura é da fonte ${FONTE.nome} (${FONTE.tipo}): o consolida.mjs serve só a fonte do X.`); process.exit(1); }
const HANDLE = FONTE.handle.toLowerCase();
// janela EXCLUSIVA, pela regra unica de janela.mjs: segundos inteiros UTC comparados como numero
// --desde <ISO>: outra janela (recaptura, ou conferir uma captura ja fechada)
const iD = process.argv.indexOf('--desde');
const DESDE_S = segundosUTC(iD > -1 ? process.argv[iD + 1] : FONTE.desde);
const le = (n) => (fs.existsSync(path.join(pasta, n)) ? JSON.parse(fs.readFileSync(path.join(pasta, n), 'utf8')) : null);

const perma = new Map();
for (const f of fs.readdirSync(pasta).filter((f) => /^perma-.*\.json$/.test(f)))
  for (const r of JSON.parse(fs.readFileSync(path.join(pasta, f), 'utf8'))) if (r && !r.erro && r.focal) perma.set(r.id, r);
const lista = new Map((le('respostas-lista.json') || []).map((v) => [v.id, v]));
const busca = new Map((le('enum-busca.json') || []).map((x) => [x.id, x]));
const tl = new Set(((le('linha-do-tempo.json') || {}).posts || []).map((p) => p.id));

const out = [], descartadas = [];
let maisNovo = null; // o triado_ate a gravar no fim: o item mais novo ENUMERADO na janela, qualquer destino
const est = { na_janela: 0, antes_da_janela: 0, posts: 0, respostas_ficam: 0, respostas_com_permalink: 0, respostas_so_listagem: 0, respostas_descartadas_menos_60: 0, imagens: 0, permalinks_com_erro: 0 };
for (const id of new Set([...perma.keys(), ...lista.keys(), ...busca.keys()])) {
  const p = perma.get(id), l = lista.get(id), b = busca.get(id);
  const dt = (p && p.focal.dt) || (l && l.dt) || (b && b.dt) || '';
  if (!dt || segundosUTC(dt) <= DESDE_S) { est.antes_da_janela++; continue; }
  if (maisNovo === null || segundosUTC(dt) > maisNovo) maisNovo = segundosUTC(dt); // descartadas contam
  est.na_janela++;
  const original = !!(b && !b.reply) || tl.has(id);
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
    fio: p ? p.fio.map((f) => ({ id: f.id, dt: f.dt, corpo: f.corpo, imgs: f.imgs, videos: f.videos || [] })) : [],
    integral: !!p,
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
  r.fio.forEach((f) => (f.imgs || []).forEach((u, i) => tsv.push([f.id, i + 1, u].join('\t'))));
}
est.imagens = tsv.length;
fs.writeFileSync(path.join(pasta, 'consolidado.json'), JSON.stringify(out, null, 1));
fs.writeFileSync(path.join(pasta, 'descartadas-menos-60.json'), JSON.stringify(descartadas));
fs.writeFileSync(path.join(pasta, 'imagens.tsv'), tsv.join('\n') + (tsv.length ? '\n' : ''));
console.log(est);
// A MESMA frase do atualizar.md, passo 7: com item na janela, o triado_ate vira o item mais novo
// enumerado; sem item nenhum, ele NAO muda (avancar para "agora" sem post de fronteira deixaria a
// proxima captura sem ancora).
console.log(maisNovo !== null
  ? `triado_ate a gravar ao fechar: ${isoSegundos(maisNovo)}  (fontes.mjs avanca ${FONTE.nome} ${isoSegundos(maisNovo)})`
  : 'nada novo na janela: o triado_ate não muda');
if (est.permalinks_com_erro) console.log(`AVISO: ${est.permalinks_com_erro} post(s) original(is) sem permalink: rode o lote de novo antes de seguir`);
