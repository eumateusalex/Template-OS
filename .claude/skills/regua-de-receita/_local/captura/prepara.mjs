// Prepara os trechos de navegador da captura de uma fonte do X, ja com o perfil e a janela trocados.
//
// O perfil e a janela saem de UM lugar: o fonte.json da pasta da captura (o retrato da fonte que o
// `pasta.mjs nova <fonte>` gravou: handle e desde). Nada de handle ou data escrito a mao nos trechos.
//
// Uso (da raiz do workspace, que e onde o `filename` do Playwright grava):
//   node <skill>/_local/captura/prepara.mjs <pasta>               -> busca.js, respostas.js, artigos.js
//   node <skill>/_local/captura/prepara.mjs <pasta> --lotes       -> lotes/lote-NN.js (aplica o corte)
//   node <skill>/_local/captura/prepara.mjs <pasta> --ids a,b,c   -> lotes/ids-NN.js (lista explicita:
//                                                                          refazer falha, recapturar)
//
// Os tres primeiros sao para `browser_run_code_unsafe` com `filename` (ele carrega o codigo
// do arquivo; o `browser_evaluate` nao carrega). Cada um navega sozinho, espera a pagina
// hidratar, colhe, guarda o resultado em window.__* e devolve SO a contagem. O despejo em
// disco e um segundo passo: `browser_evaluate` com `filename` (ver atualizar.md, passo 3).
//
// A janela e EXCLUSIVA: entra o que e estritamente mais novo que o `desde` (o triado_ate da fonte
// quando a captura nasceu), em segundos inteiros
// UTC comparados como numero (captura/janela.mjs). Texto ISO ou milissegundos so acertam por acaso.
//
// --lotes le enum-busca.json e respostas-lista.json da pasta e aplica o CORTE:
//   - post original: permalink sempre (texto integral, metricas, imagens, fio)
//   - resposta: permalink so se passar de 200 caracteres, tiver imagem ou vier cortada
//     ("mostrar mais") -- e o permalink guarda tambem o post respondido
//   - resposta abaixo de 60 caracteres e sem imagem: nem permalink, nem arquivo de texto
// As contagens do --lotes sao so da janela; os numeros do relatorio saem do consolida.mjs.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { argPasta, argFonte } from './pasta.mjs';
import { naJanela as dentroDaJanela, segundosUTC } from './janela.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));

const pasta = argPasta(process.argv[2]);   // `@atual` = a captura do ponteiro (pasta.mjs)
if (!pasta) { console.log('uso: prepara.mjs <pasta | @atual> [--lotes | --ids a,b,c | --artigos a,b]'); process.exit(1); }
const FONTE = argFonte(pasta);
if (FONTE.tipo !== 'x') { console.log(`a captura é da fonte ${FONTE.nome} (${FONTE.tipo}): o prepara.mjs serve só a fonte do X. Siga o passo 3 do atualizar.md para o tipo ${FONTE.tipo}.`); process.exit(1); }
const HANDLE = FONTE.handle;
const DESDE_ISO = FONTE.desde;
const DESDE_MS = Date.parse(DESDE_ISO);
const DESDE_DIA = new Date(DESDE_MS).toISOString().slice(0, 10); // o operador since: da busca so aceita dia
// a regra unica da fronteira mora em janela.mjs: segundos inteiros em UTC, comparados como numero
const DESDE_S = segundosUTC(DESDE_ISO);
const naJanela = (dt) => dentroDaJanela(dt, DESDE_ISO);

fs.mkdirSync(pasta, { recursive: true });
// caminhos impressos relativos a raiz do workspace (de onde o roteiro roda), com barra: e o que vai no
// `filename` das ferramentas do navegador
const mostra = (p) => path.relative(process.cwd(), p).split(path.sep).join('/') || '.';
const troca = (t, extra = {}) => Object.entries({ __HANDLE__: HANDLE, __DESDE__: DESDE_ISO, __DESDE_S__: String(DESDE_S), __DESDE_DIA__: DESDE_DIA, ...extra })
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

// --artigos a,b: um script por artigo longo, ja com o id trocado e navegando ate o post. Rodar com
// browser_run_code_unsafe + filename (o browser_evaluate nao carrega arquivo; colar codigo a mao
// e trocar <id> era o passo que falhava). Despejo: window.__artigo -> <pasta>/artigo-<id>.json
const iArt = process.argv.indexOf('--artigos');
if (iArt > -1) {
  const ids = (process.argv[iArt + 1] || '').split(',').map((s) => s.trim()).filter((s) => /^\d+$/.test(s));
  if (!ids.length) { console.log('--artigos precisa de uma lista de ids separados por virgula'); process.exit(1); }
  const dirA = path.join(pasta, 'artigos');
  fs.mkdirSync(dirA, { recursive: true });
  for (const id of ids) fs.writeFileSync(path.join(dirA, `artigo-${id}.js`), embrulha(`https://x.com/${HANDLE}/status/${id}`, troca(modelo('artigo-texto.js'), { __ID__: id })));
  console.log(`${ids.length} artigo(s): ${mostra(dirA)}/artigo-<id>.js (browser_run_code_unsafe + filename); despejo window.__artigo -> ${mostra(pasta)}/artigo-<id>.json`);
  process.exit(0);
}
if (!process.argv.includes('--lotes') && iIds < 0) {
  fs.writeFileSync(path.join(pasta, 'busca.js'), embrulha(URLS.busca, troca(modelo('busca.js'))));
  fs.writeFileSync(path.join(pasta, 'respostas.js'), embrulha(URLS.respostas, troca(modelo('respostas.js'))));
  fs.writeFileSync(path.join(pasta, 'artigos.js'), embrulha(URLS.artigos, troca(modelo('artigos.js'))));
  console.log(`fonte ${FONTE.nome} (perfil ${HANDLE} no X), janela: depois de ${DESDE_ISO}`);
  console.log(`gravado ${mostra(pasta)}/busca.js, respostas.js e artigos.js (rodar com browser_run_code_unsafe + filename)`);
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
      troca(modelo('permalink-lote.js'), { __IDS__: JSON.stringify(ids.slice(i, i + T)), __LOTE__: `${prefixo}-${String(n).padStart(2, '0')}` }));
  }
  return n;
};

if (iIds > -1) {
  const ids = (process.argv[iIds + 1] || '').split(',').map((s) => s.trim()).filter((s) => /^\d+$/.test(s));
  if (!ids.length) { console.log('--ids precisa de uma lista de ids separados por virgula'); process.exit(1); }
  const n = grava(ids, 'ids');
  console.log(`${ids.length} permalink(s) em ${n} lote(s) em ${mostra(dir)} (ids-NN.js)`);
  process.exit(0);
}

const le = (n) => (fs.existsSync(path.join(pasta, n)) ? JSON.parse(fs.readFileSync(path.join(pasta, n), 'utf8')) : []);
const busca = le('enum-busca.json');
const lista = le('respostas-lista.json');
const originais = new Set(busca.filter((x) => !x.reply).map((x) => x.id));
const porId = new Map();
for (const x of lista) porId.set(x.id, { ...x, corpo: x.corpo || '' });
for (const x of busca) if (!porId.has(x.id)) porId.set(x.id, { id: x.id, dt: x.dt, corpo: (x.corpo || []).join('\n\n'), imgs: x.imgs || [], cortado: false });

const abrir = [], conta = { originais: 0, respostas_longas: 0, respostas_listagem: 0, respostas_cortadas_menos_60: 0, fora_da_janela: 0 };
for (const x of porId.values()) {
  if (!naJanela(x.dt)) { conta.fora_da_janela++; continue; }
  if (originais.has(x.id)) { abrir.push(x.id); conta.originais++; continue; }
  const imgs = (x.imgs || []).length;
  if (x.corpo.length > 200 || imgs || x.cortado) { abrir.push(x.id); conta.respostas_longas++; }
  else if (x.corpo.length >= 60) conta.respostas_listagem++;
  else conta.respostas_cortadas_menos_60++;
}
const n = grava(abrir, 'lote');
console.log(conta);
console.log(`${abrir.length} permalink(s) em ${n} lote(s) em ${mostra(dir)}` + (abrir.length ? '' : ' -- nada a abrir; siga para o consolida.mjs'));
