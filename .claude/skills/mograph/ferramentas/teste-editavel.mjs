// A régua do editavel.mjs: os trechos (câmera e voz com a mesma janela, o J-cut, o fim que fecha no
// começo do seguinte, o respiro e o congelado) e a troca no index.html (um vídeo e uma voz por
// trecho, vinculados, o anterior por cima, o master e a câmera única fora, a variável da legenda).
// Planta o defeito de cada uma e confere que reprova. Sem rede e sem render: a prova de que o pacote
// renderiza igual à peça e de que o Studio leva a voz junto é da entrega (relatório da peça).
//   node teste-editavel.mjs
import { trechos, htmlEditavel } from './editavel.mjs';

let testes = 0, falhas = 0;
const ok = (cond, msg) => { testes++; console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); if (!cond) falhas++; };
const copia = (x) => JSON.parse(JSON.stringify(x));
const erro = (f) => { try { f(); return ''; } catch (e) { return e.message; } };

// três trechos: o 1 e o 2 da mesma frase, o 3 de outra; 1 µs de arredondamento entre o 1 e o 2
// (o caso medido que jogava o trecho noutra linha do Studio)
const CORTES = {
  fps: 30, END: 7.0, respiro: { real: 0.1, congelado: 0.8 },
  clipes: [
    { frase: 1, de: 10.0, ate: 12.0, dur: 2.000001, t: 0 },
    { frase: 1, de: 13.5, ate: 15.0, dur: 1.5, t: 2.000001 },
    { frase: 2, de: 20.01, ate: 22.61, dur: 2.6, t: 3.5 },
  ],
  palavras: [
    { texto: 'um', inicio: 0.1, frase: 1 }, { texto: 'dois', inicio: 2.1, frase: 1 },
    { texto: 'três', inicio: 3.6, frase: 2 }, { texto: 'quatro', inicio: 4.0, frase: 2 },
  ],
};

// ─── 1 · os trechos ──────────────────────────────────────────────────────────
const t = trechos(CORTES);
const [a, b, c] = t.trechos;
ok(a.t === 0 && Math.abs(a.de - 10.0005) < 1e-9 && Math.abs(a.t + a.dur - 2.000001) < 1e-9, 'o primeiro trecho começa no corte, sem J-cut, e fecha no começo do segundo');
ok(Math.abs(b.t - (2.000001 - 2 / 30)) < 1e-6 && Math.abs(b.de - (13.5 - 2 / 30 + 0.0005)) < 1e-6, 'do segundo em diante a janela começa antes do corte (J-cut) no tempo e no original');
ok(Math.abs((b.corte - b.t) * 30 - 2) < 1e-4, `o J-cut é de quadros inteiros: os 50 ms viram 2 quadros (${((b.corte - b.t) * 30).toFixed(3)})`);
ok(Math.abs(b.t + b.dur - 3.5) < 1e-9, 'o fim de cada trecho fecha exatamente no começo do corte seguinte');
ok(Math.abs(c.t + c.dur - (3.5 + 2.6 + 0.1)) < 1e-9, 'o último trecho leva o respiro real');
ok(t.congelado && Math.abs(t.congelado.t - 6.2) < 1e-6 && Math.abs(t.congelado.dur - 0.8) < 1e-6, 'o congelado ocupa do fim da câmera ao END');
// o ponto fora da grade (20,01 s = quadro 600,3) vai para o quadro que a camera.mp4 usa, o 601, com a folga
ok(Math.abs(c.de - (601 / 30 - 2 / 30 + 0.0005)) < 1e-6, `o ponto no original vai para o quadro de cima, como o trim da /cortes (${c.de})`);
ok(Math.abs(t.congelado.quadro - (601 / 30 + 2.6 + 0.1 - 1 / 30)) < 1e-6, `o quadro congelado é o último do trecho no original (${t.congelado.quadro})`);
ok(a.rotulo === '01 · um' && b.rotulo === '02 · dois' && c.rotulo === '03 · três quatro', `o rótulo é o número e a fala do trecho (${a.rotulo} | ${b.rotulo} | ${c.rotulo})`);
const semRespiro = trechos({ ...copia(CORTES), END: 6.1, respiro: { real: 0.0, congelado: 0 } });
ok(semRespiro.congelado === null, 'sem congelado, não há imagem parada');
ok(/clipes/.test(erro(() => trechos({ ...CORTES, clipes: [] }))), 'cortes sem clipes reprova');

// ─── 2 · a troca no index.html ───────────────────────────────────────────────
const INDEX = `<!doctype html>
<html lang="pt-BR">
<head><style>
  #camera { position: absolute; }
</style></head>
<body><div id="root" data-composition-id="main">
<audio id="master" class="clip" src="master.wav" data-start="0" data-duration="7"></audio>
<div id="quadro"><video id="camera" class="clip" src="camera.mp4" data-start="0" data-duration="7" muted></video></div>
<div id="legendas"></div>
</div></body></html>`;
const h = htmlEditavel(INDEX, t);
const tags = (re) => [...h.matchAll(re)].map((m) => m[0]);
const vids = tags(/<video id="camera-\d+"[^>]*>/g), vozes = tags(/<audio id="voz-\d+"[^>]*>/g);
const at = (s, k) => (s.match(new RegExp(`${k}="([^"]*)"`)) || [])[1];
ok(vids.length === 3 && vozes.length === 3, `um vídeo e uma voz por trecho (${vids.length} e ${vozes.length})`);
ok(vids.every((v) => at(v, 'src') === 'midia/original.mp4') && vozes.every((v) => at(v, 'src') === 'midia/voz-original.wav'), 'todos os trechos leem a gravação inteira, não a câmera cortada');
const par = (n) => [vids.find((v) => v.includes(`camera-${n}"`)), vozes.find((v) => v.includes(`voz-${n}"`))];
ok(['01', '02', '03'].every((n) => { const [v, a2] = par(n); return ['data-start', 'data-duration', 'data-media-start', 'data-link'].every((k) => at(v, k) === at(a2, k)); }),
  'câmera e voz do mesmo trecho têm a mesma janela e o mesmo data-link (o Studio só leva junto o vinculado idêntico)');
ok(new Set(vids.map((v) => at(v, 'data-link'))).size === 3, 'cada trecho tem o seu vínculo');
const z = vids.map((v) => Number((v.match(/z-index:(-?\d+)/) || [])[1]));
ok(z.every((x) => x < 0) && z[0] > z[1] && z[1] > z[2], `o anterior fica por cima na sobreposição do J-cut, e a câmera abaixo do resto do quadro (z ${z.join(', ')})`);
ok(h.includes('#quadro { isolation: isolate; }'), 'o quadro isola o empilhamento negativo da câmera');
const faixas = (lista) => lista.map((v) => at(v, 'data-track-index'));
ok(faixas(vids).join() === '0,1,0' && faixas(vozes).join() === '10,11,10', 'os trechos alternam as faixas A e B (vizinhos se sobrepõem no J-cut)');
ok(!/id="master"/.test(h) && !/id="camera"[ >]/.test(h) && !/#camera \{/.test(h), 'o master, a câmera única e a regra #camera saem');
ok(/id="efeitos"[^>]*src="midia\/efeitos.wav"/.test(h) && /id="trilha"[^>]*src="midia\/trilha.wav"/.test(h), 'os efeitos e a trilha viram faixas próprias');
ok(/<video id="camera-congelado"[^>]*src="midia\/congelado.mp4"[^>]*data-start="6.2"/.test(h), 'o congelado vira o vídeo parado no fim (não PNG: outra conversão de cor)');
ok(/data-composition-variables='\[\{"id":"legenda_y"/.test(h) && h.includes('#legendas { margin-top: calc(var(--legenda_y, 0) * 1px); }'), 'a variável legenda_y move a legenda pela margem (o motor grava top e translate inline)');
ok(/<html data-composition-variables=[^>]* lang="pt-BR">/.test(h), 'a variável entra na tag <html> sem perder os atributos dela');
// os defeitos plantados: o index de outro modelo é recusa, nunca troca pela metade
ok(/camera/.test(erro(() => htmlEditavel(INDEX.replace(/<video id="camera"[^>]*><\/video>/, ''), t))), 'index sem a câmera reprova');
ok(/master/.test(erro(() => htmlEditavel(INDEX.replace(/<audio id="master"[^>]*><\/audio>/, ''), t))), 'index sem o master reprova');
const dupla = INDEX.replace('</div></body>', '<audio id="master" class="clip" src="master.wav" data-start="0" data-duration="7"></audio></div></body>');
ok(/uma vez só/.test(erro(() => htmlEditavel(dupla, t))), 'master duplicado reprova');
ok(/data-timeline-label="diz &quot;oi&quot; &lt;b>"/.test(htmlEditavel(INDEX, { ...t, trechos: t.trechos.map((x) => ({ ...x, rotulo: 'diz "oi" <b>' })) })), 'aspas e < no rótulo saem escapados');

console.log(`\n# tests ${testes}\n# fail ${falhas}`);
process.exit(falhas ? 1 : 0);
