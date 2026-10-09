// Converte a captura consolidada em arquivos de fonte: o texto integral de cada post da referencia,
// guardado na skill, sem endereco de post.
//
// Entrada: <pasta>/consolidado.json, gerado pelo captura/consolida.mjs (um registro por id, ja
// classificado e com o corte das respostas aplicado).
// Saida  : fontes/posts-x/<id>.md      post, citacao, fio, auto-resposta
//          fontes/respostas-x/<id>.md  resposta da referencia na conversa de outra pessoa
//
// Regras:
// - NUNCA sobrescreve arquivo que ja existe: o arquivo de fonte e permanente, e o veredito da
//   triagem (marca-triagem.mjs) vive dentro do arquivo.
// - ZERO endereco de post. O cabecalho traz o id e o perfil; o endereco se reconstroi deles
//   (x.com/<handle>/status/<id>) so na hora de abrir no navegador, nunca escrito aqui. Imagem
//   fica pelo arquivo do cofre e pela chave da midia no CDN (sem a URL).
// - Metricas lidas do aria-label do X, que nomeia cada numero. Contador zerado o X omite: vira 0.
// - A referencia sai do captura.json da pasta (consolida.mjs) e o nome e o fuso do cobertura.json,
//   nao do codigo. A skill e um pacote independente: vai inteira para outro workspace, sem depender
//   de outra skill, entao nada deste arquivo e compartilhado.
//
// Uso (da raiz do workspace):
//   node <skill>/_local/escreve-fontes.mjs --consolidado <pasta>/consolidado.json            (simula)
//   node <skill>/_local/escreve-fontes.mjs --consolidado <pasta>/consolidado.json --escreve
//   ... --saida <dir>   grava a arvore fontes/ em outro lugar (ensaio sem tocar a skill)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { origemPermitida } from './captura/imagem.mjs';
import { pastaDaCaptura } from './captura/pasta.mjs';
import { diaNoFuso, fusoDe } from './captura/janela.mjs';
import { semEnderecoDePost } from './captura/endereco.mjs';
import { referencia } from './captura/referencia.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ESCREVE = process.argv.includes('--escreve');
// o consolidado: --consolidado <arquivo>, ou <pasta da captura>/consolidado.json (ponteiro do prepara.mjs --nova)
const iC0 = process.argv.indexOf('--consolidado');
const ARQ_CONS = iC0 > -1 ? process.argv[iC0 + 1] : path.join(pastaDaCaptura(['', '', '--']), 'consolidado.json');
const iS = process.argv.indexOf('--saida');
const BASE = iS > -1 ? path.resolve(process.argv[iS + 1]) : path.join(AQUI, 'fontes');
const COB = JSON.parse(fs.readFileSync(path.join(AQUI, 'cobertura.json'), 'utf8'));
const itens = JSON.parse(fs.readFileSync(path.resolve(ARQ_CONS), 'utf8'));
// o id da captura (consolida.mjs -> captura.json, na mesma pasta do consolidado) vai no campo `captura:`
const ARQ_CAP = path.join(path.dirname(path.resolve(ARQ_CONS)), 'captura.json');
const CAP = fs.existsSync(ARQ_CAP) ? JSON.parse(fs.readFileSync(ARQ_CAP, 'utf8')) : {};
const ID_CAP = CAP.id || null;
if (!ID_CAP) { console.log('falta captura.json com o id ao lado do consolidado (rode o consolida.mjs)'); process.exit(1); }
// a referencia da captura (consolida.mjs -> captura.json) e o nome dela no cobertura.json
const REF = referencia(COB, CAP.referencia);
const H = REF.handle, NOME = REF.nome || REF.handle;
const hoje = diaNoFuso(Date.now(), fusoDe(COB)); // o dia no fuso do dono (cobertura.json -> fuso)
const aspas = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
const metrica = (s, ...nomes) => {
  if (!s) return 'null';
  for (const n of nomes) {
    const m = s.match(new RegExp('([\\d.]+)\\s+' + n, 'i'));
    if (m) return m[1].replace(/\./g, '');
  }
  return '0';
};
// chave da midia no CDN (ex.: HTqACxeXcAAGZsY), sem a URL
const chave = (u) => ((u || '').match(/\/media\/([A-Za-z0-9_-]+)/) || (u || '').match(/thumb\/(\d+)\//) || [])[1] || '?';
// o texto nao pode carregar endereco de post: link de post colado no corpo vira "(link de post)"
// pela regra unica de endereco.mjs (a mesma do guarda-bruto e da regua)
const semLinkDePost = (s) => semEnderecoDePost(s || '').texto;

const conta = { 'posts-x': 0, 'respostas-x': 0, existentes: 0, cortadas: 0 };
for (const x of itens) {
  const ehResp = x.kind === 'reply';
  if (ehResp && (x.corpo || '').length < 60 && !(x.imgs || []).length) { conta.cortadas++; continue; }
  const pasta = ehResp ? 'respostas-x' : 'posts-x';
  const destino = path.join(BASE, pasta, `${x.id}.md`);
  if (fs.existsSync(destino)) { conta.existentes++; continue; }
  const imgs = x.imgs || [];
  const vids = (x.videos || []).filter((u) => origemPermitida(u));
  const fioImgs = (x.fio || []).flatMap((f) => (f.imgs || []).map((u, i) => ({ id: f.id, n: i + 1, u })));
  const ctx = (x.contexto || []).filter((c) => c && c.texto && c.perfil && c.perfil.toLowerCase() !== H.toLowerCase());
  const L = [
    '---',
    `id: ${x.id}`,
    `perfil: @${H}`,
    `perfil_nome: ${aspas(NOME)}`,
    `created_at: ${aspas(x.dt || '')}`,
    `lang: ${x.lang || 'null'}`,
    `likes: ${metrica(x.metricas, 'curtidas?', 'likes?')}`,
    `reposts: ${metrica(x.metricas, 'reposts?')}`,
    `replies: ${metrica(x.metricas, 'respostas?', 'replies', 'reply')}`,
    'quotes: null',
    `bookmarks: ${metrica(x.metricas, 'items? salvos?', 'bookmarks?')}`,
    `impressions: ${metrica(x.metricas, 'visualizaç(?:ões|ão)', 'views?')}`,
    `media_count: ${imgs.length}`,
    `video_count: ${vids.length}`,
    `kind: ${x.kind}`,
    `has_quote: ${!!x.quote}`,
  ];
  if (x.quote) L.push(`perfil_citado: ${x.quote.perfil ? aspas('@' + x.quote.perfil) : 'null'}`);
  if (ehResp) {
    L.push(`em_resposta_a: ${aspas('@' + (x.respondeA || '?'))}`);
    L.push(`contexto_de_terceiro: ${ctx.length > 0}`);
    if (!ctx.length) L.push('nota_kind: "Resposta curta (60 a 200 caracteres, sem imagem): pelo corte do atualizar.md o corpo veio da aba Posts e respostas, sem abrir o permalink, e o post respondido nao foi guardado."');
  }
  // mapa imagem -> galeria: cada imagem capturada, pela chave da captura (<id>__<n>, <id>__v1,
  // <id>__v1-q<n>). Nasce "(a catalogar)"; o captura/cataloga.mjs troca pelo arquivo da galeria
  // depois que a imagem foi vista e nomeada pelo que mostra. A rastreabilidade nao depende do nome.
  const chaves = [
    ...imgs.map((u, i) => `${x.id}__${i + 1}`),
    ...fioImgs.map((f) => `${f.id}__${f.n}`),
    ...vids.flatMap((u, i) => [`${x.id}__v${i + 1}`, ...[1, 2, 3].map((q) => `${x.id}__v${i + 1}-q${q}`)]),
  ];
  if (chaves.length) { L.push('imagens:'); chaves.forEach((c) => L.push(`  - "${c} -> (a catalogar)"`)); }
  else L.push('imagens: []');
  L.push('themes: []');
  L.push('use_in_skill: false');
  L.push(`captura: ${aspas(ID_CAP)}`);
  L.push(`captured_via: ${aspas(x.integral
    ? 'playwright-dom, permalink (texto integral; sem X API; sem token)'
    : 'playwright-dom, aba Posts e respostas (texto inteiro da lista; sem X API; sem token)')}`);
  L.push(`capture_note: ${aspas('Metricas lidas do aria-label do X, que nomeia cada numero. Texto original (a traducao automatica da conta foi desfeita). Capturado em ' + hoje + '.')}`);
  L.push('---');
  L.push(`# @${H} — ${NOME}`);
  L.push('');
  L.push(`Publicação \`${x.id}\`  ·  ${x.dt || ''}`);
  L.push('');
  if (ctx.length) {
    L.push('## Contexto (de terceiro — não destilar)');
    L.push('');
    L.push(`> O texto abaixo é de outra pessoa e está aqui só para dar sentido à resposta, cortado em 300 caracteres.`);
    L.push('');
    for (const c of ctx) { L.push(`**@${c.perfil}:** ${semLinkDePost(c.texto)}`); L.push(''); }
    L.push(`## Resposta de @${H}`);
    L.push('');
  }
  L.push(semLinkDePost(x.corpo) || '(sem texto: a publicação é só a mídia abaixo)');
  L.push('');
  for (const f of x.fio || []) {
    L.push(`## Continuação do fio (\`${f.id}\`, ${f.dt || ''})`);
    L.push('');
    L.push(semLinkDePost(f.corpo) || '(só mídia)');
    L.push('');
  }
  if (x.quote && (x.quote.texto || (x.quote.imgs || []).length)) {
    L.push('## Post citado (de terceiro — não destilar)');
    L.push('');
    L.push(`**@${x.quote.perfil}:** ${semLinkDePost(x.quote.texto) || '(só mídia)'}`);
    L.push('');
    L.push('> A conta logada traduz a citação para o português e o X não oferece "Mostrar original" dentro dela: o texto acima pode estar traduzido. O original é o do post citado (quando é da referência e está na janela, tem arquivo próprio aqui).');
    L.push('');
  }
  if (x.card) {
    L.push('## Cartão de link');
    L.push('');
    L.push(semLinkDePost(x.card));
    L.push('');
  }
  if (imgs.length || fioImgs.length) {
    L.push('## Imagens do post');
    L.push('');
    imgs.forEach((u, i) => L.push(`${i + 1}. ${x.id}__${i + 1} (mídia ${chave(u)}) -> (a catalogar)`));
    fioImgs.forEach((f) => L.push(`- do fio: ${f.id}__${f.n} (mídia ${chave(f.u)}) -> (a catalogar)`));
    L.push('');
    L.push('> Tamanho original, guardada na galeria da biblioteca com o nome do que mostra (mapa no cabeçalho, campo `imagens`).');
    L.push('');
  }
  if (vids.length) {
    L.push('## Vídeo do post');
    L.push('');
    vids.forEach((u, i) => {
      L.push(`- vídeo ${i + 1}, miniatura: ${x.id}__v${i + 1} (mídia ${chave(u)}) -> (a catalogar)`);
      [1, 2, 3].forEach((q) => L.push(`- vídeo ${i + 1}, quadro ${q} (15%, 50% e 85% da duração): ${x.id}__v${i + 1}-q${q} -> (a catalogar)`));
    });
    L.push('');
    L.push('> O MP4 não é baixado (pesado); ficam a miniatura e os quadros-chave.');
    L.push('');
  }
  if (x.metricas) { L.push(`> Métricas no dia da captura: ${x.metricas}.`); L.push(''); }
  L.push('---');
  L.push('');
  L.push(`**Nao destilado.** Capturado em ${hoje}, ainda sem triagem (ver atualizar.md, passo 5).`);
  L.push('');
  if (ESCREVE) { fs.mkdirSync(path.dirname(destino), { recursive: true }); fs.writeFileSync(destino, L.join('\n'), 'utf8'); }
  conta[pasta]++;
}
console.log(conta, ESCREVE ? '(gravado)' : '(simulacao)');
