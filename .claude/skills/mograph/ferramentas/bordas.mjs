// bordas.mjs · a faixa chapada na borda do quadro, medida no render (a régua bordas do regua-direcao.mjs).
//
//   node bordas.mjs <render.mp4> [--json]
//
// O defeito: o chão ou a cena anda e a caixa dela não sangra até a borda, e o fundo do modelo aparece
// numa faixa chapada de alto a baixo (12 px na direita por 8 s, que doze rodadas de
// crítica não viram porque as bordas se mediam só no alto e no pé).
// O que mede: a peça a 10 qps, só as faixas de 80 px de cada lado, em cinza. Em cada borda conta as
// linhas (ou colunas) chapadas a partir dela, o desvio no meio de 80% do comprimento abaixo de 1,5 nível (o
// fundo do modelo mede 0; a parede lisa da gravação, ~3,5, pelo ruído da câmera e da compressão),
// até a primeira que tem matéria. Faixa de 3 px ou mais por 0,2 s ou mais (dois quadros amostrados
// seguidos) reprova. A banda inteira chapada (o quadro todo liso, o respiro, o flash) não é faixa.
// Régua que não mediu reprova.
import { execFileSync } from 'node:child_process';
import { chamadoDireto } from './principal.mjs';

export const PASSO = 0.1, BANDA = 80, DESVIO = 1.5, LARGURA_MIN = 3, DURA_MIN = 0.2;
const L = 1080, A = 1920;
const LADOS = ['esquerda', 'direita', 'alto', 'pé'];

// as quatro bandas de cada amostra: as verticais (80 x 1920) e as horizontais (1080 x 80)
function bandas(mp4) {
  const ler = (filtro, w, h) => {
    const buf = execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-i', mp4, '-filter_complex', filtro, '-f', 'rawvideo', '-'], { maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'pipe'] });
    const n = Math.floor(buf.length / (w * h));
    return Array.from({ length: n }, (_, i) => buf.subarray(i * w * h, (i + 1) * w * h));
  };
  const base = `fps=${1 / PASSO},scale=${L}:${A},format=gray,split[a][b]`;
  const v = ler(`[0:v]${base};[a]crop=${BANDA}:${A}:0:0[e];[b]crop=${BANDA}:${A}:${L - BANDA}:0[d];[e][d]hstack`, 2 * BANDA, A);
  const h = ler(`[0:v]${base};[a]crop=${L}:${BANDA}:0:0[t];[b]crop=${L}:${BANDA}:0:${A - BANDA}[p];[t][p]vstack`, L, 2 * BANDA);
  return { v, h };
}

function chapada(valores) {
  let s = 0, s2 = 0;
  for (const x of valores) { s += x; s2 += x * x; }
  const m = s / valores.length;
  return Math.sqrt(Math.max(0, s2 / valores.length - m * m)) < DESVIO;
}

// a largura da faixa chapada que nasce na borda, ou 0; a banda inteira chapada devolve 0
export function largura(pega, comprimento) {
  const de = Math.floor(comprimento * 0.1), ate = Math.ceil(comprimento * 0.9);
  let w = 0;
  for (let k = 0; k < BANDA; k++) {
    const vals = [];
    for (let i = de; i < ate; i += 2) vals.push(pega(k, i));
    if (!chapada(vals)) break;
    w++;
  }
  return w >= BANDA ? 0 : w;
}

function larguras(q) {
  const out = [];
  for (let t = 0; t < q.v.length && t < q.h.length; t++) {
    const v = q.v[t], h = q.h[t], W = 2 * BANDA;
    out.push([
      largura((k, i) => v[i * W + k], A),
      largura((k, i) => v[i * W + (W - 1 - k)], A),
      largura((k, i) => h[k * L + i], L),
      largura((k, i) => h[(2 * BANDA - 1 - k) * L + i], L),
    ]);
  }
  return out;
}

export function julgar(lista) {
  const erros = [], trechos = [];
  const br = (x) => x.toFixed(1).replace('.', ',');
  LADOS.forEach((lado, j) => {
    let ini = null, maior = 0;
    for (let t = 0; t <= lista.length; t++) {
      const w = t < lista.length ? lista[t][j] : 0;
      if (w >= LARGURA_MIN) { if (ini === null) ini = t; maior = Math.max(maior, w); continue; }
      if (ini !== null) {
        const de = ini * PASSO, ate = t * PASSO;
        if (ate - de >= DURA_MIN - 1e-9) {
          trechos.push({ lado, de: +de.toFixed(2), ate: +ate.toFixed(2), largura: maior });
          erros.push({ regra: 'bordas', msg: `faixa chapada de ${maior} px na borda ${lado === 'pé' ? 'do pé' : lado === 'alto' ? 'do alto' : lado}, de ${br(de)} a ${br(ate)} s: a cena ou o chão não sangra até a borda (o fundo do modelo aparece)` });
        }
        ini = null; maior = 0;
      }
    }
  });
  return { erros, trechos };
}

export function bordas(mp4) {
  let q;
  try { q = bandas(mp4); } catch (e) {
    return { erros: [{ regra: 'bordas', msg: `${mp4}: não abriu (${String(e.stderr || e.message).trim().split(/\r?\n/).pop()}); nada medido` }], avisos: [], trechos: [] };
  }
  if (!q.v.length) return { erros: [{ regra: 'bordas', msg: `${mp4}: nenhuma amostra; nada medido` }], avisos: [], trechos: [] };
  const r = julgar(larguras(q));
  return { erros: r.erros, avisos: [], trechos: r.trechos };
}

if (chamadoDireto(import.meta.url)) {
  const mp4 = process.argv[2];
  if (!mp4) { console.error('uso: bordas.mjs <render.mp4> [--json]'); process.exit(2); }
  const r = bordas(mp4);
  if (process.argv.includes('--json')) console.log(JSON.stringify(r));
  else {
    for (const e of r.erros) console.log(`ERRO  [${e.regra}] ${e.msg}`);
    console.log(`bordas: ${r.erros.length ? 'REPROVA' : 'verde'}`);
  }
  process.exitCode = r.erros.length ? 1 : 0;
}
