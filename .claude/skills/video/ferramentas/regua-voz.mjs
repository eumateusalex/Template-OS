// A régua da voz: o que se mede na narração gerada, antes de qualquer render. Pega os três defeitos
// que fazem um anúncio narrado voltar: o anúncio que não diz o que vende, a voz falando de uma coisa
// enquanto a tela mostra outra, e o intervalo longo entre as falas (quem assiste acelera ou sai).
//
//   node .claude/skills/video/ferramentas/regua-voz.mjs <pasta da peça>
//
// Lê o roteiro/narracao.json da peça e o tempo de cada palavra que o falar.mjs grava ao lado do
// áudio (ativos/<fala>.palavras.json, quando a fala foi gerada com --saida ativos/<fala>.wav), e
// imprime o laudo; sai com 1 se alguma linha reprovar. O narracao.json:
//
//   { "duracao": 25.7,                       a duração do vídeo, em segundos
//     "falas": [ { "id": "f1", "em": 3, "texto": "..." } ],   "em" é o quadro (30 fps) em que a fala entra
//     "regua": { ... } }                     só no anúncio (abaixo)
//
// Toda peça com voz: a voz começa até 0,5 s, a pausa entre duas falas fica abaixo de 0,6 s, nenhum
// silêncio de 1,5 s entre a primeira e a última palavra, e a tela final fica de 0,8 a 1,5 s depois da
// última palavra (nenhuma janela de 1,5 s sem voz nem texto novo). Com "regua" (anúncio), também:
//   "produto": [fala, palavra]  a palavra do que se vende, dita até os 3 s
//   "oferta":  [fala, palavra]  a oferta com número, dita até os 8 s
//   "chamada": [fala, palavra]  a chamada ("clica em saiba mais"), dita nos últimos 5 s
//   o ritmo de 130 a 170 palavras por minuto de vídeo, e a duração de 25 a 35 s.
// A palavra se acha pelo começo, sem acento, sem caixa e sem pontuação ("site" acha "site,"); um
// terceiro item escolhe a ocorrência ([fala, "site", 2]).
//
// A coerência entre a voz e a tela não se mede aqui: ela mora na peça, que põe cada palavra-chave na
// tela pelo tempo da palavra que a voz diz (os mesmos .palavras.json) e quebra se a palavra não
// estiver na fala (voz.md, "A narração").
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEM_ACENTO = new RegExp('[\\u0300-\\u036f]', 'g');
const norma = (s) => String(s).toLowerCase().normalize('NFD').replace(SEM_ACENTO, '').replace(/[^a-z0-9.]/g, '');
const umaCasa = (n) => n.toFixed(2).replace('.', ',');

/** O instante (segundos do vídeo) em que a voz começa a n-ésima palavra da fala que começa com `palavra`. */
export function instante(tempos, [id, palavra, n = 1]) {
  const lista = tempos[id];
  if (!lista) throw new Error(`a fala ${id} não está no roteiro`);
  let k = 0;
  for (const [p, ini] of lista) if (norma(p).startsWith(norma(palavra)) && ++k === n) return ini;
  throw new Error(`a palavra "${palavra}" (${n}ª) não está na fala ${id}`);
}

/** O laudo da voz. `palavras` é { fala: [{ palavra, inicio, fim }] }, em segundos contados do começo
 *  do áudio da fala; `narracao` é o narracao.json, com "em" em quadros; `duracoes` ({ fala: segundos })
 *  dá onde o som de cada fala acaba. Com ela, a pausa entre duas falas se mede do fim do som, e não do
 *  fim da última palavra: a ElevenLabs estica o fim do último caractere além do som, e a pausa medida
 *  pela palavra sairia menor que a real. */
export function reguaVoz({ narracao, palavras, duracoes = {}, fps = 30 }) {
  const falas = [...narracao.falas].sort((a, b) => a.em - b.em);
  const tempos = {};
  for (const f of falas) {
    const lista = palavras[f.id];
    if (!lista || !lista.length) throw new Error(`sem o tempo das palavras da fala ${f.id}: gere a fala pelo falar.mjs com --saida ativos/${f.id}.wav`);
    tempos[f.id] = lista.map((p) => [p.palavra, f.em / fps + p.inicio, f.em / fps + p.fim]);
  }
  // onde o som de cada fala acaba: o fim do áudio medido, ou o fim da última palavra
  const fimDoSom = (f) => (Number.isFinite(duracoes[f.id]) ? f.em / fps + duracoes[f.id] : tempos[f.id][tempos[f.id].length - 1][2]);
  const todas = falas.flatMap((f) => tempos[f.id]);
  const dur = Number(narracao.duracao);
  const linhas = [];
  const linha = (nome, valor, limite, ok, nota = '') => linhas.push({ nome, valor, limite, ok, nota });

  linha('abertura', todas[0][1], 'até 0,5 s', todas[0][1] <= 0.5, `"${todas[0][0]}"`);
  let pausa = { s: 0, nota: '' };
  for (let i = 1; i < falas.length; i++) {
    const s = tempos[falas[i].id][0][1] - fimDoSom(falas[i - 1]);
    if (s > pausa.s) pausa = { s, nota: `${falas[i - 1].id} → ${falas[i].id}` };
  }
  linha('pausa entre falas', pausa.s, 'abaixo de 0,6 s', pausa.s < 0.6, pausa.nota);
  // o silêncio dentro de cada fala, de uma palavra à outra; entre as falas vale a pausa, medida pelo som
  let silencio = { s: pausa.s, nota: pausa.nota };
  for (const f of falas) {
    const l = tempos[f.id];
    for (let i = 1; i < l.length; i++) {
      const s = l[i][1] - l[i - 1][2];
      if (s > silencio.s) silencio = { s, nota: `depois de "${l[i - 1][0]}"` };
    }
  }
  linha('maior silêncio', silencio.s, 'abaixo de 1,5 s', silencio.s < 1.5, silencio.nota);
  const cauda = dur - fimDoSom(falas[falas.length - 1]);
  // nenhuma janela de 1,5 s sem voz nem texto novo: a tela final é a janela do fim
  linha('tela final depois da voz', cauda, 'de 0,8 a 1,5 s', cauda >= 0.8 && cauda <= 1.5);

  const r = narracao.regua;
  if (r) {
    for (const [chave, nome, ok, limite] of [
      ['produto', 'o produto dito', (t) => t <= 3, 'até 3 s'],
      ['oferta', 'a oferta com número dita', (t) => t <= 8, 'até 8 s'],
      ['chamada', 'a chamada dita', (t) => t >= dur - 5, `nos últimos 5 s (desde ${umaCasa(dur - 5)} s)`],
    ]) {
      if (!r[chave]) { linha(nome, NaN, limite, false, `falta "${chave}" na "regua" do narracao.json`); continue; }
      const t = instante(tempos, r[chave]);
      linha(nome, t, limite, ok(t), `"${r[chave][1]}"`);
    }
    const n = falas.reduce((s, f) => s + f.texto.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length, 0);
    const ppm = n / (dur / 60);
    linha('ritmo', ppm, '130 a 170 palavras por minuto', ppm >= 130 && ppm <= 170, `${n} palavras em ${umaCasa(dur)} s`);
    linha('duração', dur, 'de 25 a 35 s', dur >= 25 && dur <= 35);
  }
  return { linhas, ok: linhas.every((l) => l.ok), tempos };
}

const duracaoDe = (wav) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', wav]).toString().trim());

/** O laudo lido da pasta da peça: as palavras e o áudio de cada fala em ativos/<fala>.*. */
export function reguaDaPeca(pasta) {
  const narracao = JSON.parse(readFileSync(join(pasta, 'roteiro', 'narracao.json'), 'utf8'));
  const palavras = {}, duracoes = {};
  for (const f of narracao.falas) {
    const arq = join(pasta, 'ativos', `${f.id}.palavras.json`);
    if (existsSync(arq)) palavras[f.id] = JSON.parse(readFileSync(arq, 'utf8'));
    const wav = join(pasta, 'ativos', `${f.id}.wav`);
    if (existsSync(wav)) duracoes[f.id] = duracaoDe(wav);
  }
  return reguaVoz({ narracao, palavras, duracoes });
}

export function imprime({ linhas, ok }) {
  for (const l of linhas) {
    const valor = Number.isFinite(l.valor) ? (l.nome === 'ritmo' ? `${Math.round(l.valor)}` : `${umaCasa(l.valor)} s`) : '?';
    console.log(`${l.ok ? 'ok   ' : 'FALHA'} ${l.nome.padEnd(26)} ${valor.padStart(7)}   ${l.limite}${l.nota ? `   (${l.nota})` : ''}`);
  }
  console.log(ok ? 'a voz passa na régua' : 'a voz reprova: encurte ou junte as falas no narracao.json, gere de novo e reposicione o "em" de cada fala');
}

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  const [pasta] = process.argv.slice(2);
  if (!pasta) { console.error('uso: node regua-voz.mjs <pasta da peça>'); process.exit(2); }
  try {
    const laudo = reguaDaPeca(resolve(pasta));
    console.log('a régua da voz');
    imprime(laudo);
    process.exit(laudo.ok ? 0 : 1);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
