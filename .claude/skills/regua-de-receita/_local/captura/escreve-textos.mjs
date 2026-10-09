// Converte o consolidado de uma captura do X em um arquivo de texto por post, para a triagem.
//
// Os textos moram na PASTA DA CAPTURA (fora da skill), nunca dentro dela: a skill guarda so o
// principio que sai deles. Quem le um texto para triar e escrever o principio le daqui.
//
// Entrada: <pasta>/consolidado.json (do consolida.mjs) e <pasta>/fonte.json (o retrato da fonte).
//          Campos de cada registro: id, dt, kind (post|quote|reply|self-reply), respondeA, corpo,
//          imgs, quote {perfil,texto}, card, cardLink, metricas (o aria-label do X, que DIZ o nome de
//          cada numero), contexto [{perfil,texto}], fio [{id,dt,corpo,imgs}], integral.
// Saida  : <pasta>/textos/<id>.md   (ou --saida <dir>)
//
// Regras:
// - NUNCA sobrescreve arquivo que ja existe: a triagem (marca-triagem.mjs) e as imagens
//   (guarda-imagens.mjs) gravam dentro dele depois.
// - metricas: o aria-label do grupo de acoes traz "6 respostas, 2 reposts, 70 curtidas,
//   17 items salvos, 3550 visualizações" -- cada numero com o nome colado, entao cada
//   metrica se grava com o nome certo; o X omite contador zerado (ausente vira 0).
// - imagens: nascem como "imagem pendente de triagem (`<id>__<n>`)"; o guarda-imagens.mjs as
//   resolve depois de vistas (assets/<tema>/<o-que-mostra>.<ext>, ou "imagem não guardada").
// - o corte de respostas (abaixo de 60 caracteres sem imagem) ja veio aplicado; aqui so se
//   confere de novo, para que um consolidado feito a mao nao fure a regra.
// - endereco de post no texto vira `post <id>` (a definicao unica: ../endereco-de-post.cjs).
//
// Rodar: node <skill>/_local/captura/escreve-textos.mjs --consolidado <pasta>/consolidado.json [--saida <dir>] [--escreve]
// Sem --escreve ele so mostra o que faria.

import fs from 'node:fs';
import path from 'node:path';
import { argPasta, argFonte } from './pasta.mjs';
import { dataLocal, fusoDaSkill } from './janela.mjs';
import enderecos from '../endereco-de-post.cjs';
const { semEnderecoDePost } = enderecos;

const ESCREVE = process.argv.includes('--escreve');
const iConsol = process.argv.indexOf('--consolidado');
if (iConsol < 0) { console.log('uso: escreve-textos.mjs --consolidado <pasta | @atual>/consolidado.json [--saida <dir>] [--escreve]'); process.exit(1); }
const arq = path.resolve(argPasta(process.argv[iConsol + 1]) || '');   // aceita `@atual/consolidado.json`
const PASTA = path.dirname(arq);
const FONTE = argFonte(PASTA);
const H = FONTE.handle;
// --saida <dir>: grava os textos em outro lugar (ensaio, teste)
const iSaida = process.argv.indexOf('--saida');
const BASE = iSaida > -1 ? path.resolve(process.argv[iSaida + 1]) : path.join(PASTA, 'textos');

const aspas = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
const itens = JSON.parse(fs.readFileSync(arq, 'utf8'));
const hoje = dataLocal(Date.now(), fusoDaSkill()); // no fuso da skill (cobertura.json)
const metrica = (s, ...nomes) => {
  if (!s) return 'null';
  for (const n of nomes) {
    const m = s.match(new RegExp('([\\d.]+)\\s+' + n, 'i'));
    if (m) return m[1].replace(/\./g, '');
  }
  return '0';
};
const conta = { posts: 0, respostas: 0, existentes: 0, cortadas: 0 };
for (const x of itens) {
  const ehResp = x.kind === 'reply';
  if (ehResp && (x.corpo || '').length < 60 && !(x.imgs || []).length) { conta.cortadas++; continue; }
  const destino = path.join(BASE, `${x.id}.md`);
  if (ESCREVE) fs.mkdirSync(BASE, { recursive: true });
  if (fs.existsSync(destino)) { conta.existentes++; continue; }
  // SEM endereco de post: o arquivo guarda `id` e `perfil`, e o endereco se reconstroi deles na
  // hora de abrir o post
  const imgs = x.imgs || [];
  const fioImgs = (x.fio || []).flatMap((f) => (f.imgs || []).map((u, i) => ({ id: f.id, n: i + 1, u })));
  const L = [
    '---',
    `id: ${x.id}`,
    `perfil: ${aspas('@' + H)}`,
    `fonte: ${FONTE.nome}`,
    `created_at: ${aspas(x.dt || '')}`,
    `likes: ${metrica(x.metricas, 'curtidas?', 'likes?')}`,
    `reposts: ${metrica(x.metricas, 'reposts?')}`,
    `replies: ${metrica(x.metricas, 'respostas?', 'replies', 'reply')}`,
    `bookmarks: ${metrica(x.metricas, 'items? salvos?', 'bookmarks?')}`,
    `impressions: ${metrica(x.metricas, 'visualizaç(?:ões|ão)', 'views?')}`,
    `media_count: ${imgs.length || 'null'}`,
    `videos: ${[...(x.videos || []), ...(x.fio || []).flatMap((f) => f.videos || [])].length}`,
    `kind: ${x.kind}`,
    `has_quote: ${!!x.quote}`,
  ];
  if (x.quote) L.push(`quoted_perfil: ${x.quote.perfil ? aspas('@' + x.quote.perfil) : 'null'}`);
  const ctx = (x.contexto || []).filter((c) => c && c.texto && c.perfil && c.perfil.toLowerCase() !== H.toLowerCase());
  if (ehResp) {
    L.push(`in_reply_to: ${aspas('@' + (x.respondeA || '?'))}`);
    L.push(`contexto_de_terceiro: ${ctx.length > 0}`);
    if (!ctx.length) {
      L.push('nota_kind: "Resposta curta (60 a 200 caracteres, sem imagem): pelo corte do atualizar.md o corpo ' +
        'saiu da aba Posts e respostas, sem abrir o permalink, e o post respondido nao foi guardado."');
    }
  }
  L.push('triagem: pendente');
  L.push(`captured_via: ${aspas(x.integral
    ? 'playwright-dom, permalink (texto integral; sem X API; sem token)'
    : 'playwright-dom, aba Posts e respostas (texto inteiro da lista; sem X API; sem token)')}`);
  L.push(`capture_note: ${aspas('Metricas lidas do aria-label do X, que nomeia cada numero. Capturado em ' + hoje + '.')}`);
  L.push('---');
  L.push(`# ${FONTE.nome} · id \`${x.id}\`  ·  ${x.dt || ''}`);
  L.push('');
  if (ctx.length) {
    L.push('## Contexto (de terceiro: só para entender a resposta)');
    L.push('');
    L.push('> O texto abaixo é de outra pessoa e está aqui só para dar sentido à resposta, cortado em 300 caracteres.');
    L.push('');
    for (const c of ctx) { L.push(`**@${c.perfil}:** ${c.texto}`); L.push(''); }
    L.push('## A resposta');
    L.push('');
  }
  L.push(x.corpo || '(sem texto: o post é só a imagem abaixo)');
  L.push('');
  for (const f of x.fio || []) {
    L.push(`## Continuação do fio (${f.dt || ''})`);
    L.push('');
    L.push(f.corpo || '');
    L.push('');
  }
  if (x.quote && x.quote.texto) {
    L.push('## Post citado (de terceiro: só para entender o comentário)');
    L.push('');
    L.push(`**@${x.quote.perfil}:** ${x.quote.texto}`);
    L.push('');
  }
  if (x.card) {
    L.push('## Cartão de link');
    L.push('');
    L.push(x.card);
    L.push('');
  }
  // A imagem nasce PENDENTE: so entra na skill depois de vista, nomeada pelo que mostra e posta na
  // pasta do tema (guarda-imagens.mjs), e so se servir a skill. A chave `<id>__<n>` e o nome do
  // arquivo na pasta da captura, nunca o nome final.
  if (imgs.length || fioImgs.length) {
    L.push('## Imagens do post');
    L.push('');
    const todas = [...imgs.map((u, i) => ({ chave: `${x.id}__${i + 1}`, u })), ...fioImgs.map((f) => ({ chave: `${f.id}__${f.n}`, u: f.u }))];
    todas.forEach((im, i) => L.push(`${i + 1}. imagem pendente de triagem (\`${im.chave}\`) — ${im.u.replace(/name=[a-z0-9x]+/, 'name=orig')}`));
    L.push('');
  }
  // Video nao entra na skill (atualizar.md, passo 4), mas nao some em silencio: cada video do
  // post (e do fio) ganha uma linha, e post com 2+ videos lista todos.
  const videos = [...(x.videos || []), ...(x.fio || []).flatMap((f) => f.videos || [])];
  if (videos.length) {
    L.push('## Vídeos do post');
    L.push('');
    videos.forEach((v, i) => L.push(`${i + 1}. vídeo não guardado: vídeo não entra na skill (pesado e sem valor de leitura)${v && /^https?:\/\/pbs\.twimg\.com\//.test(v) ? ' — capa: ' + v : ''}`));
    L.push('');
  }
  if (x.metricas) { L.push(`> Métricas no dia da captura: ${x.metricas}.`); L.push(''); }
  if (ESCREVE) fs.writeFileSync(destino, semEnderecoDePost(L.join('\n')), 'utf8');
  conta[ehResp ? 'respostas' : 'posts']++;
}
console.log(conta, ESCREVE ? `(gravado em ${path.relative(process.cwd(), BASE).split(path.sep).join('/') || BASE})` : '(simulacao)');
