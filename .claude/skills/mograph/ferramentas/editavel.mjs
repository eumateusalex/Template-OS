// O pacote editável do falado: a peça montada, com a câmera e a voz refeitas em trechos da
// gravação ORIGINAL, para abrir no Studio do HyperFrames (`npx hyperframes preview`) e mexer à mão.
//
//   node editavel.mjs <pasta-da-peca> --saida <pasta>
//
// O que muda em relação à peça (o resto, motion, legenda e cenas, é o mesmo index.html):
// - a câmera única (camera.mp4, já cortada) vira um <video> por trecho do corte, todos apontando
//   para a gravação inteira (midia/original.mp4) com o data-media-start no ponto do corte: o que
//   foi cortado continua no arquivo, escondido, e volta puxando a borda do trecho no Studio
// - o quadro congelado do fim vira um vídeo curto do último quadro (a <img> da receita "Freeze /
//   hold" do HyperFrames passava por outra conversão de cor: 35 dB da peça, medido)
// - o master vira três faixas: a voz em trechos da gravação inteira (a mesma janela da câmera,
//   vinculada a ela pelo data-link), os efeitos (sfx + riser) e a trilha, que se apaga ou se baixa sozinha.
//   O master da peça é a soma das stems sem limitador (relatorio-audio.json), então somar as
//   faixas dá o mesmo som; com limitador no master, a ferramenta recusa
// - a legenda ganha a variável legenda_y do painel Variables: desloca o bloco inteiro em px,
//   pelo margin-top do contêiner (medido no Studio: o motor grava no #legendas, inline, o
//   position absolute, o top 0 e o translate none, que vencem a folha; a margem ninguém toca)
// O pacote é autocontido (sem junção): o _vendor e o _marca são copiados de verdade, para abrir e mexer
// no Studio fora do workspace. É uma foto da marca no dia: não acompanha a marca, e quem quer a marca nova
// gera o pacote de novo. As pastas que o Studio cria (.hyperframes, .transcode-cache) e as cópias do
// _vendor e do _marca ficam fora do git.
// Só roda dentro do workspace, como o montar-falado.mjs: depende do cortes.json e das stems da /cortes.
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, cpSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chamadoDireto } from './principal.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..', '..', '..', '..');
const SR = 48000;
const J_CUT = 0.05;   // o mesmo da /cortes (scripts/reel-falado/fala.py): a voz do trecho entra 50 ms antes do corte
const ESTEREO_DB = -3.01;   // a voz mono sobe a estéreo com −3 dB por canal (scripts/reel-falado/som.py)
const r6 = (x) => Math.round(x * 1e6) / 1e6;
const MEIO_MS = 0.0005;   // a folga do media-start sobre o quadro (ver trechos)

// Os trechos da timeline editável, só do cortes.json. Câmera e voz de um trecho têm a MESMA janela,
// porque o Studio só leva junto o clip vinculado (data-link) de janela idêntica (medido: a voz com
// o J-cut à parte ficou parada quando a câmera foi aparada). A janela é a da voz da /cortes: do
// segundo trecho em diante começa 50 ms antes do corte (o J-cut, que guarda o começo da sílaba nos
// cortes no meio da fala) e fecha no começo do trecho seguinte. A imagem não muda: na sobreposição
// de 50 ms o trecho anterior fica por cima (vem depois no HTML), e o corte visível cai no mesmo
// quadro da peça. O último trecho leva o respiro real; o congelado, se houver, vira o vídeo parado.
export function trechos(cortes) {
  const cl = cortes.clipes;
  if (!cl?.length) throw new Error('o cortes.json não tem clipes');
  const n = cl.length;
  const fps = cortes.fps || 30;
  const lista = cl.map((c, i) => {
    // o J-cut em quadros inteiros (os 50 ms viram 2 quadros, 67 ms): com 1,5 quadro, a janela
    // começava no meio de um quadro da timeline e o motor arredondava a câmera para o vizinho
    // (medido: só o trecho 1, sem J-cut, batia com a peça)
    const lead = i ? Math.ceil(J_CUT * fps - 1e-6) / fps : 0;
    // o fim fecha exatamente no começo do seguinte (arredondados à parte, passava 1 µs e o Studio
    // lia mais uma sobreposição)
    const fim = i < n - 1 ? r6(cl[i + 1].t) : r6(c.t + c.dur + (cortes.respiro?.real ?? 0));
    const t = r6(c.t - lead);
    // o ponto no original vai para o quadro que a camera.mp4 usa: o trim do fala.py começa no
    // primeiro quadro a partir do `de` (arredonda para cima), e o motor, lendo pelo media-start,
    // pegava o anterior (medido: o pacote batia 5 dB melhor com a peça um quadro adiante). Mais
    // meio milésimo, para o arredondamento do motor nunca cair no quadro de baixo. A voz vinculada
    // anda junto (no máximo 1 quadro) e fica em sincronia exata com a imagem, como na gravação
    const deQuadro = Math.ceil(c.de * fps - 1e-6) / fps;
    return { n: String(i + 1).padStart(2, '0'), t, de: r6(deQuadro - lead + MEIO_MS), dur: r6(fim - t), corte: r6(c.t), frase: c.frase };
  });
  const ult = lista[n - 1];
  const fimCamera = r6(ult.t + ult.dur);
  const congelado = cortes.END - fimCamera > 1e-3
    ? { t: fimCamera, dur: r6(cortes.END - fimCamera), quadro: r6(ult.de + ult.dur - MEIO_MS - 1 / fps) }
    : null;
  // a fala de cada trecho, pelo tempo das palavras (já no tempo da peça), para o rótulo
  const pal = cortes.palavras ?? [];
  for (const [i, x] of lista.entries()) {
    const ditas = pal.filter((w) => w.inicio >= (i ? x.corte : 0) - 1e-6 && w.inicio < x.t + x.dur - 1e-6).map((w) => w.texto);
    x.rotulo = `${x.n} · ${(ditas.length > 6 ? `${ditas.slice(0, 6).join(' ')}…` : ditas.join(' ')) || 'sem fala'}`;
  }
  return { trechos: lista, congelado, END: cortes.END };
}

// A troca no index.html montado: a câmera, o master e a variável da legenda. Cada troca exige
// achar o alvo uma vez só: index.html de outro modelo é recusa, nunca uma troca pela metade.
export function htmlEditavel(index, t) {
  const uma = (re, nome) => {
    const m = index.match(re);
    if (!m || index.split(m[0]).length !== 2) throw new Error(`o index.html não tem ${nome} uma vez só: o modelo mudou, confira o editavel.mjs`);
    return m[0];
  };
  const cam = uma(/<video id="camera"[^>]*><\/video>/, 'o <video id="camera">');
  const master = uma(/<audio id="master"[^>]*><\/audio>/, 'o <audio id="master">');
  const css = uma(/#camera \{/, 'a regra #camera do CSS');
  const raiz = uma(/<html[^>]*>/, 'a tag <html>');
  const legCss = uma(/<\/style>/, 'o fim do <style>');
  // o data-link junta a câmera e a voz do mesmo trecho: no Studio, aparar ou mover um leva o outro
  // (⌘L desfaz). Os trechos alternam duas faixas (A e B, como o A/B roll): vizinhos se sobrepõem
  // nos 50 ms do J-cut, e na mesma faixa o lint acusa voz duplicada. Na sobreposição o trecho
  // anterior fica por cima pelo z-index, negativo dentro do #quadro isolado para a câmera seguir embaixo da palavra de trás da cabeça (o número da faixa é só exibição, diz a skill de Studio do
  // HyperFrames): o corte visível cai no mesmo quadro da peça. O rótulo (data-timeline-label) é o
  // número e a fala do trecho, para ele achar o pedaço pelo que diz.
  const ab = (c) => (Number(c.n) % 2 ? 0 : 1);
  const n = t.trechos.length;
  const rot = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const v = (c, i) => `        <video id="camera-${c.n}" class="clip camera" src="midia/original.mp4" data-start="${c.t}" data-duration="${c.dur}" data-media-start="${c.de}" data-track-index="${ab(c)}" data-link="trecho-${c.n}" data-timeline-label="${rot(c.rotulo)}" style="z-index:${-(i + 1)}" muted playsinline preload="auto" data-layout-allow-overflow></video>`;
  let cams = t.trechos.map(v).join('\n');
  if (t.congelado) cams += `\n        <video id="camera-congelado" class="clip camera" src="midia/congelado.mp4" data-start="${t.congelado.t}" data-duration="${t.congelado.dur}" data-media-start="0" data-track-index="2" data-timeline-label="quadro congelado do fim" style="z-index:${-(n + 1)}" muted playsinline preload="auto" data-layout-allow-overflow></video>`;
  const a = (c) => `      <audio id="voz-${c.n}" class="clip" src="midia/voz-original.wav" data-start="${c.t}" data-duration="${c.dur}" data-media-start="${c.de}" data-track-index="${10 + ab(c)}" data-link="trecho-${c.n}" data-timeline-label="voz ${rot(c.rotulo)}" data-volume="1"></audio>`;
  const audio = [
    ...t.trechos.map(a),
    `      <audio id="efeitos" class="clip" src="midia/efeitos.wav" data-start="0" data-duration="${t.END}" data-track-index="12" data-timeline-label="efeitos sonoros" data-volume="1"></audio>`,
    `      <audio id="trilha" class="clip" src="midia/trilha.wav" data-start="0" data-duration="${t.END}" data-track-index="13" data-timeline-label="trilha (apague ou baixe o volume aqui)" data-volume="1"></audio>`,
  ].join('\n');
  const vars = JSON.stringify([{ id: 'legenda_y', type: 'number', label: 'Legenda: subir (−) ou descer (+), em px', default: 0, min: -600, max: 600, step: 2, unit: 'px' }]);
  const comHtml = raiz.replace(/^<html/, `<html data-composition-variables='${vars}'`);
  return index
    .replace(raiz, comHtml)
    .replace(css, '.camera {')
    .replace(legCss, '      /* a variável legenda_y (painel Variables do Studio) desloca a legenda inteira */\n      #legendas { margin-top: calc(var(--legenda_y, 0) * 1px); }\n      /* os trechos da câmera se empilham com z-index negativo dentro do quadro isolado */\n      #quadro { isolation: isolate; }\n    </style>')
    .replace(cam, cams)
    .replace(master, audio);
}

function roda(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`${cmd} falhou: ${(r.stderr || '').slice(-600)}`);
  return r;
}

// PCM mono f32 de um trecho, pelo ffmpeg
function pcm(arquivo, de, dur) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-ss', String(de), '-t', String(dur), '-i', arquivo, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`ffmpeg não leu ${arquivo}`);
  return new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length / 4);
}
const rms = (x) => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / Math.max(x.length, 1));

// O ganho que a /cortes aplicou à voz (normalização linear): a razão entre a voz pronta e a
// gravação, no miolo do primeiro trecho, onde não há J-cut nem cauda somados
export function ganhoDaVoz(vozPronta, fonte, c0) {
  const m = 0.1, d = c0.dur - 2 * m;
  if (d < 0.3) throw new Error('o primeiro trecho é curto demais para medir o ganho da voz');
  const a = pcm(vozPronta, c0.t + m, d), b = pcm(fonte, c0.de + m, d);
  const g = rms(a) / Math.max(rms(b), 1e-9);
  if (!(g > 0.01 && g < 100)) throw new Error(`o ganho da voz saiu ${g}: a voz pronta não bate com a gravação`);
  return g;
}

// o limitador da voz da /cortes (scripts/reel-falado/fala.py, normalizar)
const LIMITADOR = 'alimiter=limit=0.891:attack=3:release=50:level=false';
const nivelDb = (arquivo, de, dur, af) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-ss', String(de), '-t', String(dur), '-i', arquivo, '-af', `${af ? `${af},` : ''}astats=measure_overall=RMS_level:measure_perchannel=none`, '-f', 'null', '-'], { encoding: 'utf8' });
  const m = [...(r.stderr || '').matchAll(/RMS level dB: (-?[\d.]+)/g)].pop();
  if (!m) throw new Error(`não mediu o nível de ${arquivo}`);
  return Number(m[1]);
};
// O ganho ANTES do limitador: a razão de RMS (ganhoDaVoz) já vem depois do limitador da /cortes, e
// a gravação com esse ganho ainda passa de 0 dBFS (medido: +5,6 dB), então o limitador de novo
// comia 0,8 dB. Aqui o ganho sobe até o trecho com o limitador bater com a voz pronta (±0,01 dB).
export function calibrarGanho(vozPronta, mono, c0) {
  const m = 0.1, d = c0.dur - 2 * m;
  const alvo = nivelDb(vozPronta, c0.t + m, d);
  let g = ganhoDaVoz(vozPronta, mono, c0);
  for (let i = 0; i < 6; i++) {
    const dif = alvo - nivelDb(mono, c0.de + m, d, `volume=${g.toFixed(6)},${LIMITADOR}`);
    if (Math.abs(dif) < 0.01) return g;
    g *= Math.pow(10, dif / 20);
  }
  throw new Error('o ganho da voz não fechou em 0,01 dB em 6 passos: o limitador da /cortes mudou?');
}

// o GSAP do estúdio e a marca da peça (a junção _marca dela, quando a peça tem; a neutra vem pela rede)
function copiaApoio(pasta, saida) {
  cpSync(join(RAIZ, '.claude', 'video', 'html', '_vendor'), join(saida, '_vendor'), { recursive: true, dereference: true });
  if (existsSync(join(pasta, '_marca'))) cpSync(join(pasta, '_marca'), join(saida, '_marca'), { recursive: true, dereference: true });
}

export function gerarEditavel(pasta, saida) {
  pasta = resolve(pasta); saida = resolve(saida);
  if (!pasta.toLowerCase().startsWith(RAIZ.toLowerCase())) throw new Error('o pacote editável roda só dentro do workspace (a peça do falado mora nele)');
  const cortes = JSON.parse(readFileSync(join(pasta, 'cortes.json'), 'utf8'));
  if (cortes.sincronia) throw new Error('a voz desta peça veio de um microfone à parte (cortes.sincronia): o pacote editável ainda não monta a voz sincronizada');
  const rel = JSON.parse(readFileSync(join(pasta, 'relatorio-audio.json'), 'utf8'));
  if (rel.limitador_no_master) throw new Error('o master desta peça passou pelo limitador: a soma das faixas não daria o mesmo som');
  const fonte = resolve(RAIZ, cortes.fonte);
  if (!existsSync(fonte)) throw new Error(`a gravação original não está mais em ${cortes.fonte}: sem ela não há o que recuperar`);
  const t = trechos(cortes);
  const html = htmlEditavel(readFileSync(join(pasta, 'index.html'), 'utf8'), t);

  if (existsSync(saida)) rmSync(saida, { recursive: true, force: true });
  mkdirSync(join(saida, 'midia'), { recursive: true });
  for (const f of ['curvas.js', 'dados.js']) copyFileSync(join(pasta, f), join(saida, f));
  cpSync(join(pasta, 'ativos'), join(saida, 'ativos'), { recursive: true, dereference: true });
  copiaApoio(pasta, saida);
  // a gravação inteira pelo MESMO caminho da camera.mp4 (scripts/reel-falado/fala.py, cortar_camera:
  // o fps, o recorte 9:16 e o x264 a CRF 17), não a cópia crua (girada por metadado e em Baseline),
  // para o motor ler os mesmos quadros que a peça leu. Não medido sozinho: o que fechou a diferença
  // medida entre o pacote e a peça foi o alinhamento do quadro (trechos, acima)
  const fps = cortes.fps || 30;
  roda('ffmpeg', ['-v', 'error', '-y', '-i', fonte, '-vf', `fps=${fps},crop=w='if(gt(iw,ih),trunc(ih*9/32)*2,iw)':h=ih,setsar=1`, '-an',
    '-c:v', 'libx264', '-crf', '17', '-preset', 'medium', '-g', '15', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', join(saida, 'midia', 'original.mp4')]);
  // o congelado: o último quadro do trecho, tirado da gravação já recodificada e repetido pelo tempo
  // do respiro no mesmo x264 (vídeo, não PNG: o PNG passava por outra conversão de cor e ficava a 35 dB
  // da peça, medido nos 24 quadros do respiro)
  if (t.congelado) roda('ffmpeg', ['-v', 'error', '-y', '-ss', String(t.congelado.quadro), '-i', join(saida, 'midia', 'original.mp4'), '-vf',
    `trim=end_frame=1,tpad=stop_mode=clone:stop_duration=${(t.congelado.dur + 0.2).toFixed(3)}`, '-an', '-c:v', 'libx264', '-crf', '17',
    '-preset', 'medium', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', join(saida, 'midia', 'congelado.mp4')]);
  // a voz: a gravação inteira descida a mono primeiro, e só então o ganho, o limitador e o estéreo
  // da stem. Num comando só, o -ac 1 de saída roda DEPOIS do filtro, e o pan pegava só o canal
  // esquerdo. E o ganho se mede NESTE mono, não na gravação: o -ac 1 do ffmpeg dá 3 dB a mais lido
  // por pipe em float do que gravado em WAV (medido nas duas), e medir num e aplicar no outro errava
  const mono = join(saida, 'midia', '.voz-mono.wav');
  roda('ffmpeg', ['-v', 'error', '-y', '-i', fonte, '-vn', '-ac', '1', '-ar', String(SR), '-c:a', 'pcm_f32le', mono]);
  const g = calibrarGanho(join(pasta, 'voz.wav'), mono, cortes.clipes[0]);
  roda('ffmpeg', ['-v', 'error', '-y', '-i', mono, '-af',
    `volume=${g.toFixed(6)},${LIMITADOR},volume=${Math.pow(10, ESTEREO_DB / 20).toFixed(6)},pan=stereo|c0=c0|c1=c0`,
    join(saida, 'midia', 'voz-original.wav')]);
  rmSync(mono);
  roda('ffmpeg', ['-v', 'error', '-y', '-i', join(pasta, 'stems', 'sfx.wav'), '-i', join(pasta, 'stems', 'riser.wav'),
    '-filter_complex', '[0][1]amix=inputs=2:normalize=0:duration=first', join(saida, 'midia', 'efeitos.wav')]);
  copyFileSync(join(pasta, 'stems', 'music.wav'), join(saida, 'midia', 'trilha.wav'));
  writeFileSync(join(saida, 'index.html'), html);
  writeFileSync(join(saida, 'trechos.json'), JSON.stringify({ ganho_voz: r6(g), ...t }, null, 1));
  return { trechos: t, ganho: g, arquivos: readdirSync(join(saida, 'midia')) };
}

if (chamadoDireto(import.meta.url)) {
  const [pasta, ...resto] = process.argv.slice(2);
  const i = resto.indexOf('--saida');
  if (!pasta || i < 0 || !resto[i + 1]) {
    console.error('uso: node editavel.mjs <pasta-da-peca> --saida <pasta>');
    process.exit(2);
  }
  try {
    const r = gerarEditavel(pasta, resto[i + 1]);
    console.log(`pacote editável: ${r.trechos.trechos.length} trechos (câmera e voz vinculadas)${r.trechos.congelado ? ", o quadro congelado" : ""}; ganho da voz ${r.ganho.toFixed(4)}; mídia: ${r.arquivos.join(", ")}`);
    console.log(`abrir no Studio (o 0.8.181 liga a câmera à voz pelo data-link): npx --yes hyperframes@0.8.207 preview "${resolve(resto[i + 1])}"`);
  } catch (e) {
    console.error(`recusa: ${e.message}`);
    process.exitCode = 1;
  }
}
