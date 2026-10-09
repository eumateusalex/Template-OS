// Prepara os trechos de navegador de uma captura, ja com a referencia e a janela trocadas.
//
// A referencia e a janela saem de UM lugar: _local/cobertura.json -> referencias.<handle>
// (triado_ate), pela referencia da pasta (referencia.mjs). Nada de handle ou data escrito a mao
// nos trechos.
//
// Uso (da raiz do workspace, que e onde o `filename` do Playwright grava):
//   node <skill>/_local/captura/prepara.mjs --nova --ref <handle> -> cria a pasta, grava o ponteiro e
//                                                                     <pasta>/referencia.json, e segue
//                                                                     como a linha de baixo
//   node <skill>/_local/captura/prepara.mjs <pasta>               -> busca.js, respostas.js, artigos.js
//   node <skill>/_local/captura/prepara.mjs <pasta> --lotes       -> lotes/lote-NN.js (aplica o corte)
//   node <skill>/_local/captura/prepara.mjs <pasta> --artigos a,b -> artigo-<id>.js (texto integral de artigo)
//   node <skill>/_local/captura/prepara.mjs <pasta> --videos     -> lotes/videos-NN.js (quadros de video)
//   node <skill>/_local/captura/prepara.mjs <pasta> --ids a,b,c   -> lotes/ids-NN.js (lista explicita:
//                                                                          refazer falha, recapturar, fase 2)
//
// Os tres primeiros sao para `browser_run_code_unsafe` com `filename` (ele carrega o codigo
// do arquivo; o `browser_evaluate` nao carrega). Cada um navega sozinho, espera a pagina
// hidratar, colhe, guarda o resultado em window.__* e devolve SO a contagem. O despejo em
// disco e um segundo passo: `browser_evaluate` com `filename` (ver atualizar.md, passo 3).
//
// A janela e EXCLUSIVA e por instante: entra o que e estritamente mais novo que triado_ate.
// Comparar texto ISO ("...08.000Z" contra "...08Z") so acertava a fronteira por acaso.
//
// --lotes le enum-busca.json e respostas-lista.json da pasta e aplica o CORTE:
//   - post original: permalink sempre (texto integral, metricas, imagens, fio)
//   - resposta: permalink so se passar de 200 caracteres, tiver imagem ou vier cortada
//     ("mostrar mais") -- e o permalink guarda tambem o post respondido
//   - resposta abaixo de 60 caracteres e sem imagem: nem permalink, nem arquivo de fonte
// Ids que ja tem arquivo em fontes/ sao pulados (no --lotes; o --ids nao pula nada).
// As contagens do --lotes sao so da janela; os numeros do CHANGELOG saem do consolida.mjs.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { origemPermitida } from './imagem.mjs';
import { pastaDaCaptura, novaPasta, PONTEIRO, idsComFonte } from './pasta.mjs';
import { seg, naJanela as naJ } from './janela.mjs';
import { lerCobertura, handleDaCaptura, gravaReferencia, referencia } from './referencia.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const K = path.resolve(AQUI, '..');
const C = lerCobertura(K);

// --nova --ref <handle>: cria a pasta da captura, grava o ponteiro e a referencia (uma vez por
// captura); depois todo script acha a pasta e a referencia sozinho
if (process.argv.includes('--nova')) {
  const r = referencia(C, handleDaCaptura(null));
  const p = novaPasta(r.handle);
  gravaReferencia(p, r.handle);
  console.log(`pasta da captura: ${p} (gravada em ${PONTEIRO})`);
  process.argv.splice(process.argv.indexOf('--nova'), 1);
  if (process.argv.length > 2 && !process.argv[2].startsWith('--')) process.argv.splice(2, 1);
  process.argv.splice(2, 0, p);
}
const pasta = pastaDaCaptura();
fs.mkdirSync(pasta, { recursive: true });
const REF = referencia(C, handleDaCaptura(pasta));
const HANDLE = REF.handle;
const DESDE_ISO = REF.triado_ate;
if (Number.isNaN(Date.parse(DESDE_ISO || ''))) { console.log(`referencias.${HANDLE}.triado_ate no cobertura.json nao e data ISO: escreva o instante a partir do qual capturar`); process.exit(1); }
const DESDE = seg(DESDE_ISO); // segundos inteiros UTC (janela.mjs): a UNICA regra de fronteira
const DESDE_DIA = new Date(DESDE * 1000).toISOString().slice(0, 10); // o operador since: da busca so aceita dia
const naJanela = (dt) => naJ(dt, DESDE);
const troca = (t, extra = {}) => Object.entries({ __HANDLE__: HANDLE, __DESDE__: DESDE_ISO, __DESDE_SEG__: String(DESDE), __DESDE_DIA__: DESDE_DIA, ...extra })
  .reduce((s, [k, v]) => s.split(k).join(v), t);
const modelo = (n) => fs.readFileSync(path.join(AQUI, 'modelos', n), 'utf8');

// embrulha um trecho de pagina (`async () => {...}`) num codigo de run_code que navega antes
const embrulha = (url, fn) => `async (page) => {
  await page.goto(${JSON.stringify(url)}, { waitUntil: 'domcontentloaded', timeout: 45000 });
  try { await page.waitForSelector('article', { timeout: 25000 }); } catch (e) {}
  await page.waitForTimeout(3000);
  return await page.evaluate(${fn.trim()});
}
`;

const URLS = {
  busca: `https://x.com/search?q=from%3A${HANDLE}%20since%3A${DESDE_DIA}&src=typed_query&f=live`,
  respostas: `https://x.com/${HANDLE}/with_replies`,
  artigos: `https://x.com/${HANDLE}/articles`,
};

const iIds = process.argv.indexOf('--ids');
// --artigos a,b: um artigo-<id>.js por artigo novo (o artigos.js devolve os ids), para
// browser_run_code_unsafe + filename; despejo window.__artigo -> artigo-<id>.json
const iArt = process.argv.indexOf('--artigos');
if (iArt > -1) {
  const ids = (process.argv[iArt + 1] || '').split(',').map((s) => s.trim()).filter((s) => /^\d+$/.test(s));
  if (!ids.length) { console.log('--artigos precisa de uma lista de ids separados por virgula'); process.exit(1); }
  for (const id of ids) fs.writeFileSync(path.join(pasta, `artigo-${id}.js`), troca(modelo('artigo-texto.js'), { __ID__: id }));
  console.log(`${ids.length} script(s) artigo-<id>.js em ${pasta} (browser_run_code_unsafe + filename; despejo window.__artigo -> artigo-<id>.json)`);
  process.exit(0);
}
// --videos: le <pasta>/consolidado.json e gera lotes/videos-NN.js (10 videos por lote) para os
// quadros-chave. Rodar depois do consolida.mjs.
if (process.argv.includes('--videos')) {
  const cons = JSON.parse(fs.readFileSync(path.join(pasta, 'consolidado.json'), 'utf8'));
  const ids = cons.filter((x) => (x.videos || []).some((u) => origemPermitida(u))).map((x) => x.id);
  const dirV = path.join(pasta, 'lotes');
  fs.mkdirSync(dirV, { recursive: true });
  let n = 0;
  for (let i = 0; i < ids.length; i += 10) {
    n++;
    fs.writeFileSync(path.join(dirV, `videos-${String(n).padStart(2, '0')}.js`),
      troca(modelo('quadros-video.js'), { __IDS__: JSON.stringify(ids.slice(i, i + 10)) }));
  }
  console.log(`${ids.length} video(s) em ${n} lote(s) em ${dirV} (videos-NN.js); despejo window.__quadros -> quadros-NN.json; depois grava-quadros.mjs`);
  process.exit(0);
}
if (!process.argv.includes('--lotes') && iIds < 0) {
  fs.writeFileSync(path.join(pasta, 'busca.js'), embrulha(URLS.busca, troca(modelo('busca.js'))));
  fs.writeFileSync(path.join(pasta, 'respostas.js'), embrulha(URLS.respostas, troca(modelo('respostas.js'))));
  fs.writeFileSync(path.join(pasta, 'artigos.js'), embrulha(URLS.artigos, troca(modelo('artigos.js'))));
  console.log(`referencia @${HANDLE}, janela: depois de ${DESDE_ISO}`);
  console.log(`gravado ${pasta}/busca.js, respostas.js e artigos.js (rodar com browser_run_code_unsafe + filename)`);
  console.log('despejos: window.__enum -> enum-busca.json | window.__wr -> respostas-lista.json | window.__art -> artigos.json');
  process.exit(0);
}

const dir = path.join(pasta, 'lotes');
fs.mkdirSync(dir, { recursive: true });
const grava = (ids, prefixo) => {
  const T = 20;
  let n = 0;
  for (let i = 0; i < ids.length; i += T) {
    n++;
    fs.writeFileSync(path.join(dir, `${prefixo}-${String(n).padStart(2, '0')}.js`),
      troca(modelo('permalink-lote.js'), { __IDS__: JSON.stringify(ids.slice(i, i + T)), __LOTE__: `${prefixo}-${n}` }));
  }
  return n;
};

if (iIds > -1) {
  const ids = (process.argv[iIds + 1] || '').split(',').map((s) => s.trim()).filter((s) => /^\d+$/.test(s));
  if (!ids.length) { console.log('--ids precisa de uma lista de ids separados por virgula'); process.exit(1); }
  const n = grava(ids, 'ids');
  console.log(`${ids.length} permalink(s) em ${n} lote(s) em ${dir} (ids-NN.js)`);
  process.exit(0);
}

const le = (n) => (fs.existsSync(path.join(pasta, n)) ? JSON.parse(fs.readFileSync(path.join(pasta, n), 'utf8')) : []);
const busca = le('enum-busca.json');
const lista = le('respostas-lista.json');
const jaTem = idsComFonte(path.join(K, 'fontes')); // tolera pasta de fonte ausente (clone limpo)
const originais = new Set(busca.filter((x) => !x.reply).map((x) => x.id));
const porId = new Map();
for (const x of lista) porId.set(x.id, { ...x, corpo: x.corpo || '' });
for (const x of busca) if (!porId.has(x.id)) porId.set(x.id, { id: x.id, dt: x.dt, corpo: (x.corpo || []).join('\n\n'), imgs: x.imgs || [], cortado: false });

const abrir = [], conta = { originais: 0, respostas_longas: 0, respostas_listagem: 0, respostas_cortadas_menos_60: 0, ja_arquivados: 0, fora_da_janela: 0 };
for (const x of porId.values()) {
  if (!naJanela(x.dt)) { conta.fora_da_janela++; continue; }
  if (jaTem.has(x.id)) { conta.ja_arquivados++; continue; }
  if (originais.has(x.id)) { abrir.push(x.id); conta.originais++; continue; }
  const imgs = (x.imgs || []).length;
  if (x.corpo.length > 200 || imgs || x.cortado) { abrir.push(x.id); conta.respostas_longas++; }
  else if (x.corpo.length >= 60) conta.respostas_listagem++;
  else conta.respostas_cortadas_menos_60++;
}
const n = grava(abrir, 'lote');
console.log(conta);
console.log(`${abrir.length} permalink(s) em ${n} lote(s) em ${dir}` + (abrir.length ? '' : ' -- nada a abrir; siga para o consolida.mjs'));
