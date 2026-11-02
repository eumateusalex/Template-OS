// cor.mjs · o vídeo apagado, em tom de cinza, medido no render (a régua cor do regua-direcao.mjs).
//
//   node cor.mjs <render.mp4> [--json]
//
// O vídeo em tom de cinza lê como melancólico: a peça que dessatura as fotos e os vídeos para casar
// com uma marca preto e branco apaga tudo. A marca preto e branco vale para a letra, a base e o
// componente; a imagem do mundo fica com a cor dela.
// O que mede: a saturação média de cada quadro (o SATAVG do signalstats do ffmpeg, 8 bits) a 2 qps, e
// o p90 da peça (os 10% de quadros mais coloridos). Calibragem: uma peça apagada deu p90 5,8 (o máximo
// 6,1); referências vivas, de 14,2 a 57,8, e um vídeo branco com acento de cor, 18,4. Abaixo de 8 no
// p90, nem o momento mais colorido do vídeo tem cor: avisa. Régua que não mediu reprova.
import { spawnSync } from 'node:child_process';
import { chamadoDireto } from './principal.mjs';

export const QPS = 2, P90_MIN = 8;

// o metadata=print do ffmpeg escreve no stderr
export function saturacoes(mp4) {
  const r = spawnSync('ffmpeg', ['-nostdin', '-i', mp4, '-vf', `fps=${QPS},signalstats,metadata=print:key=lavfi.signalstats.SATAVG`, '-f', 'null', '-'],
    { maxBuffer: 1 << 26, encoding: 'utf8' });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`o ffmpeg não abriu ${mp4}`);
  return [...String(r.stderr).matchAll(/SATAVG=([\d.]+)/g)].map((m) => +m[1]);
}

// a mesma conta para quem já tem a lista (o teste)
export function corDasSaturacoes(lista) {
  if (!lista.length) return { erros: [{ regra: 'cor', msg: 'não medida: nenhum quadro lido' }], avisos: [], p90: null };
  const o = [...lista].sort((a, b) => a - b);
  const p90 = o[Math.min(o.length - 1, Math.floor(o.length * 0.9))];
  const media = lista.reduce((s, v) => s + v, 0) / lista.length;
  // aviso, não erro: filme de ponta com interface preto e branco fica abaixo do piso (p90 7,3). O
  // crítico confere se a foto do mundo saiu dessaturada
  const avisos = [];
  if (p90 < P90_MIN) avisos.push({ regra: 'cor', msg: `o vídeo pode estar apagado: nem os 10% de quadros mais coloridos passam de saturação ${p90.toFixed(1)} (o piso é ${P90_MIN}; a média é ${media.toFixed(1)}). A marca preto e branco é a letra e a base; a imagem do mundo fica com a cor dela. Confira a foto do mundo: dessaturada, conserte; interface de marca em preto e branco, siga` });
  return { erros: [], avisos, p90, media };
}

// A imagem do mundo é a que tem cor própria para apagar: toda origem da lista do plano (roteiro.md, `ativos`) menos a
// captura de tela e o efeito. Só o plano em que todo ativo é captura ou efeito (ou nenhum) não tem o que a régua
// mede; a origem que falta ou que não existe não prova nada, e a régua mede.
const SEM_MUNDO = ['captura', 'efeito'];
export function semMundo(plano) {
  const ativos = plano?.ativos;
  if (!Array.isArray(ativos)) return null;
  if (!ativos.every((a) => SEM_MUNDO.includes(a?.origem))) return null;
  return ativos.length ? 'nenhum ativo é imagem do mundo (só captura e efeito)' : 'o plano não carrega imagem (ativos vazio)';
}

export function cor(mp4) {
  let lista;
  try { lista = saturacoes(mp4); } catch (e) { return { erros: [{ regra: 'cor', msg: `não medida: ${e.message.split('\n')[0]}` }], avisos: [] }; }
  return corDasSaturacoes(lista);
}

if (chamadoDireto(import.meta.url)) {
  const mp4 = process.argv[2];
  if (!mp4) { console.error('uso: cor.mjs <render.mp4> [--json]'); process.exit(2); }
  const r = cor(mp4);
  if (process.argv.includes('--json')) console.log(JSON.stringify(r, null, 1));
  else {
    for (const e of r.erros) console.log(`ERRO  [cor] ${e.msg}`);
    console.log(r.erros.length ? 'cor: REPROVA' : `cor: verde (p90 ${r.p90.toFixed(1)}, média ${r.media.toFixed(1)})`);
  }
  process.exitCode = r.erros.length ? 1 : 0;
}
