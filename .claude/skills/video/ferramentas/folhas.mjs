// As folhas que o crítico lê: o vídeo inteiro a 2 quadros por segundo (o quadro exato de cada meio
// segundo), tiras de 12 quadros nos movimentos rápidos, e quadros no tamanho do celular.
//
//   node .claude/skills/video/ferramentas/folhas.mjs <video.mp4> <pasta-saida> [--rapidos 4.9,8.8,17.8]
//
// --rapidos: o segundo em que cada movimento rápido começa (toque, drop, morph).
// A tira cobre 2 s a partir dali, a 6 quadros por segundo.
// Sem --rapidos, só a folha e os quadros de celular.
//
// Por que 360 px: é a largura em que o Reel aparece no celular. Texto que não
// se lê ali não se lê na vida real, por mais nítido que o quadro de 1080 esteja.
import { execFileSync } from 'node:child_process';
import { mkdirSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: ['ignore', 'ignore', 'pipe'] });

/** Os quadros por segundo do vídeo (o r_frame_rate do ffprobe, "30/1" vira 30). */
export function quadrosPorSegundo(video) {
  const [a, b] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', video]).toString().trim().split('/').map(Number);
  return b ? a / b : a;
}

export function duracao(video) {
  return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video]).toString().trim());
}

export function folhas(video, saida, { rapidos = [] } = {}) {
  mkdirSync(saida, { recursive: true });
  const d = duracao(video);
  const linhas = Math.ceil((d * 2) / 8);
  const feitos = [];
  const folha = join(saida, 'folha-2fps.png');
  // o quadro exato de cada meio segundo (o 0, o 15, o 30...): o fps=2 pega um quadro ~0,23 s depois do
  // rótulo, e o crítico leria na célula de 23,5 s o que acontece em 23,7 (medido)
  const passo = Math.max(1, Math.round(quadrosPorSegundo(video) / 2));
  ff(['-i', video, '-vf', `select='not(mod(n\,${passo}))',scale=270:-1,tile=8x${linhas}`, '-fps_mode', 'passthrough', '-frames:v', '1', folha]);
  feitos.push(folha);
  for (const t of rapidos) {
    const tira = join(saida, `tira-${t}s.png`);
    const passoTira = Math.max(1, Math.round(quadrosPorSegundo(video) / 6));
    ff(['-ss', String(t), '-t', '2', '-i', video, '-vf', `select='not(mod(n\,${passoTira}))',scale=300:-1,tile=6x2`, '-fps_mode', 'passthrough', '-frames:v', '1', tira]);
    feitos.push(tira);
  }
  // 8 quadros de celular: o 0 (a capa), o último, e 6 no meio
  const tempos = [0, ...Array.from({ length: 6 }, (_, i) => +((d * (i + 1)) / 7).toFixed(1)), +(d - 0.1).toFixed(1)];
  for (const t of tempos) {
    const f = join(saida, `celular-${t}s.png`);
    ff(['-ss', String(t), '-i', video, '-frames:v', '1', '-vf', 'scale=360:-1', f]);
    feitos.push(f);
  }
  return feitos;
}

// realpath: chamado por um link, o caminho digitado não é o real, e sem isto o
// script saía calado sem fazer nada
if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  const [video, saida] = process.argv.slice(2);
  const i = process.argv.indexOf('--rapidos');
  const rapidos = i > 0 ? process.argv[i + 1].split(',').map(Number) : [];
  if (!video || !saida) { console.error('uso: node folhas.mjs <video.mp4> <pasta-saida> [--rapidos 4.9,8.8]'); process.exit(2); }
  for (const f of folhas(resolve(video), resolve(saida), { rapidos })) console.log(f);
}
