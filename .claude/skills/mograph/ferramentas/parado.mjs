// parado.mjs · o quadro que parou, medido no render inteiro (a régua parado do regua-direcao.mjs).
//
//   node parado.mjs <render.mp4> [--virgula 12.3] [--json]
//
// Resolução: 0,1 s (uma pausa de 0,6 s pode medir 0,5).
// O que mede: a peça amostrada a 10 qps, reduzida a 270x480 por média de área e desfocada
// (o grão de 3 a 6% some na média, a forma que anda não). Cada amostra se compara com as
// cinco anteriores (0,1 a 0,5 s), pelo pixel que mais mudou (o percentil 99,9, para um pixel
// de ruído não salvar o quadro). Abaixo do limiar contra as cinco, nada andou em meio
// segundo: é quadro parado. Comparar só com a de 0,5 s antes chamava de parado o objeto que
// vai e volta ao mesmo lugar (medido no teste). Só entram trechos de 0,6 s ou mais.
//   parado    trecho acima de 0,75 s reprova (manual, comum.estrutura.virgula: a vírgula vai de 0,3 a 0,75 s e
//             é a única parada total)
//   vírgulas  trecho de 0,3 a 0,75 s fora do instante declarado em --virgula: mais de um avisa
//   fim       o trecho parado que encosta no fim passa de 1,4 s: reprova
// Uma régua de 3 s amostrada a 2 qps deixa passar trechos parados. Régua que não mediu reprova.
import { execFileSync } from 'node:child_process';
import { chamadoDireto } from './principal.mjs';

export const PASSO = 0.1, JANELA = 5, LIMIAR = 12, PARADO_MAX = 0.75, VIRGULA_MIN = 0.3, FIM_MAX = 1.4;
const L = 270, A = 480;

export function quadros(mp4) {
  const buf = execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-i', mp4, '-vf',
    `fps=${1 / PASSO},scale=${L}:${A}:flags=area,gblur=sigma=1,format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'pipe'] });
  const n = Math.floor(buf.length / (L * A));
  return Array.from({ length: n }, (_, i) => buf.subarray(i * L * A, (i + 1) * L * A));
}

// o quanto o quadro b mudou contra o a: o percentil 99,9 da diferença absoluta
export function mudanca(a, b) {
  const hist = new Uint32Array(256);
  for (let i = 0; i < a.length; i++) hist[Math.abs(a[i] - b[i])]++;
  let corte = a.length * 0.999, soma = 0;
  for (let v = 0; v < 256; v++) { soma += hist[v]; if (soma >= corte) return v; }
  return 255;
}

// os trechos parados, em segundos, a partir da lista de mudanças por amostra
export function trechos(mud, { limiar = LIMIAR } = {}) {
  const out = [];
  let ini = null;
  for (let i = JANELA; i <= mud.length; i++) {
    const p = i < mud.length && mud[i] < limiar;
    if (p && ini === null) ini = i;
    if (!p && ini !== null) {
      // de ini-JANELA até i-1 a imagem não andou: a duração conta a janela
      const de = (ini - JANELA) * PASSO, ate = (i - 1) * PASSO;
      if (ate - de >= 0.6 - 1e-9) out.push({ de: +de.toFixed(2), ate: +ate.toFixed(2), dur: +(ate - de).toFixed(2) });
      ini = null;
    }
  }
  return out;
}

export function julgar(lista, duracao, { virgulas = [] } = {}) {
  const erros = [], avisos = [];
  const fim = lista.find((t) => duracao - t.ate <= PASSO * 1.5);
  for (const t of lista) {
    if (t === fim) continue;
    if (t.dur > PARADO_MAX + PASSO / 2) erros.push({ regra: 'parado', msg: `${t.dur.toFixed(1)} s parado de ${t.de.toFixed(1)} a ${t.ate.toFixed(1)} s; a única parada total é a vírgula de 0,3 a 0,75 s (manual: comum.estrutura.virgula)` });
  }
  const soltas = lista.filter((t) => t !== fim && t.dur >= VIRGULA_MIN && t.dur <= PARADO_MAX + PASSO / 2 && !virgulas.some((v) => v >= t.de - PASSO && v <= t.ate + PASSO));
  if (soltas.length > 1) avisos.push({ regra: 'parado', msg: `${soltas.length} vírgulas sem declarar (${soltas.map((t) => t.de.toFixed(1) + ' s').join(', ')}); uma por peça, no plano` });
  if (fim && fim.dur > FIM_MAX + PASSO / 2) erros.push({ regra: 'parado', msg: `o fim fica ${fim.dur.toFixed(1)} s parado (de ${fim.de.toFixed(1)} s); até ${FIM_MAX} s: o CTA se constrói andando e só o resolvido para` });
  return { erros, avisos };
}

// A massa parada: a régua acima olha o pixel que mais mudou, e o vídeo feito por IA passa nela
// (o cursor e o número sempre mexem um pixel, e o quadro inteiro fica parado). A massa olha o
// quadro inteiro: a diferença média entre quadros seguidos, a 30 qps, em 320 px de cinza.
// Medido em oito vídeos: o feito por IA dá mediana 0,28 e 78% de quadros quase parados (abaixo de
// 0,5); uma refação profissional do mesmo vídeo, 1,20 e 21%; filmes de estúdio de ponta, 0,35 a 2,9
// e 4 a 57%. O limiar vem de poucos vídeos, então avisa, não reprova.
export const MASSA_QUASE = 0.5, MASSA_FATIA_MAX = 60, MASSA_MEDIANA_MIN = 0.35;

export function massaDasDiferencas(d) {
  if (!d.length) return null;
  const ord = [...d].sort((a, b) => a - b);
  const meio = ord.length >> 1;
  const mediana = ord.length % 2 ? ord[meio] : (ord[meio - 1] + ord[meio]) / 2;
  return { mediana: +mediana.toFixed(2), fatia: +(100 * d.filter((x) => x < MASSA_QUASE).length / d.length).toFixed(1), n: d.length };
}

export function massa(mp4) {
  const w = 320;
  const [W, H] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', mp4], { encoding: 'utf8' }).trim().split(',').map(Number);
  const h = Math.round(H * w / W / 2) * 2;
  const buf = execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-i', mp4, '-vf', `fps=30,scale=${w}:${h},format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'pipe'] });
  const t = w * h, n = Math.floor(buf.length / t), d = [];
  for (let i = 1; i < n; i++) {
    let s = 0;
    for (let k = 0; k < t; k++) s += Math.abs(buf[i * t + k] - buf[(i - 1) * t + k]);
    d.push(s / t);
  }
  return { ...massaDasDiferencas(d), d };
}

// a massa de um trecho (a cena de animação do plano): a diferença i é a do quadro i+1, em (i+1)/30 s.
// A peça inteira esconde a tela cheia parada atrás do rosto que se mexe (a crítica r4: a peça dava
// 1,6 e 28%, e as telas cheias da S03 e da S04, 0,29 e 0,18)
export function massaDoTrecho(d, de, ate) {
  return massaDasDiferencas(d.filter((_, i) => (i + 1) / 30 >= de && (i + 1) / 30 < ate));
}

export function julgarMassa(m, onde = '') {
  if (!m) return [{ regra: 'massa', msg: `${onde}a massa não mediu: nenhum par de quadros` }];
  const avisos = [];
  if (m.fatia > MASSA_FATIA_MAX) avisos.push({ regra: 'massa', msg: `${onde}${m.fatia}% dos quadros com o quadro inteiro quase parado (acima de ${MASSA_FATIA_MAX}%; o vídeo feito por IA tem 78%, a refação profissional 21%): a câmera e o fundo também andam (manual: comum.camera-e-luz.camera-que-respira)` });
  if (m.mediana < MASSA_MEDIANA_MIN) avisos.push({ regra: 'massa', msg: `${onde}a mediana da diferença do quadro inteiro é ${m.mediana} (abaixo de ${MASSA_MEDIANA_MIN}; a refação profissional dá 1,20): só um detalhe se mexe por vez` });
  return avisos;
}

export function parado(mp4, opcoes = {}) {
  // o arquivo que não abre devolve o erro, sem derrubar a régua tudo: não medir não é passar
  let q;
  try { q = quadros(mp4); } catch (e) {
    return { erros: [{ regra: 'parado', msg: `${mp4}: não abriu (${String(e.stderr || e.message).trim().split(/\r?\n/).pop()}); nada medido` }], avisos: [], trechos: [], mudancas: [] };
  }
  if (q.length <= JANELA) return { erros: [{ regra: 'parado', msg: `${mp4}: ${q.length} amostras; nada medido` }], avisos: [], trechos: [], mudancas: [] };
  const mud = q.map((f, i) => {
    if (i < JANELA) return 255;
    let m = 0;
    for (let j = 1; j <= JANELA && m < LIMIAR; j++) m = Math.max(m, mudanca(q[i - j], f));
    return m;
  });
  const lista = trechos(mud, opcoes);
  const duracao = q.length * PASSO;
  const j = julgar(lista, duracao, opcoes);
  // a massa do quadro inteiro, em aviso (acima); opcoes.massa === false a pula (o teste das paradas)
  const m = opcoes.massa === false ? null : massa(mp4);
  const avisos = [...j.avisos];
  let porCena = [];
  if (opcoes.massa !== false) {
    avisos.push(...julgarMassa(m));
    // as cenas de animação (opcoes.cenas, do plano): cada uma com a massa dela
    porCena = (opcoes.cenas || []).map((c) => ({ id: c.id, ...(m ? massaDoTrecho(m.d, c.de, c.ate) : {}) }));
    for (const c of porCena) avisos.push(...julgarMassa(c.n ? c : null, `${c.id}: `));
  }
  return { erros: j.erros, avisos, trechos: lista, mudancas: mud, duracao, massa: m && { mediana: m.mediana, fatia: m.fatia, n: m.n }, porCena };
}

if (chamadoDireto(import.meta.url)) {
  const mp4 = process.argv[2];
  if (!mp4) { console.error('uso: parado.mjs <render.mp4> [--virgula s,s]'); process.exit(2); }
  const i = process.argv.indexOf('--virgula');
  const virgulas = i > 0 ? process.argv[i + 1].split(',').map(Number) : [];
  const r = parado(mp4, { virgulas });
  if (process.argv.includes('--json')) { console.log(JSON.stringify({ trechos: r.trechos, erros: r.erros, avisos: r.avisos })); }
  else {
    for (const t of r.trechos) console.log(`  parado ${t.de.toFixed(1)}–${t.ate.toFixed(1)} s (${t.dur.toFixed(1)} s)`);
    if (r.massa) console.log(`  massa: mediana ${r.massa.mediana}, ${r.massa.fatia}% de quadros quase parados`);
    for (const c of r.porCena || []) console.log(`  massa ${c.id}: mediana ${c.mediana}, ${c.fatia}%`);
    for (const e of r.erros) console.log(`ERRO  [${e.regra}] ${e.msg}`);
    for (const a of r.avisos) console.log(`aviso [${a.regra}] ${a.msg}`);
    console.log(`parado: ${r.erros.length ? 'REPROVA' : 'verde'} (${r.trechos.length} trechos de 0,6 s ou mais medidos)`);
  }
  process.exitCode = r.erros.length ? 1 : 0;
}
