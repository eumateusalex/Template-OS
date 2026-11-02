// A régua do bordas.mjs. Cada caso planta um defeito e confere que a régua reprova, e que a
// peça boa passa. Vídeos sintéticos pelo ffmpeg (o quadro com grão, como o render com textura), sem rede.
//   node teste-bordas.mjs
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bordas } from './bordas.mjs';

let testes = 0, falhas = 0;
const ok = (cond, msg) => { testes++; console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); if (!cond) falhas++; };
const tmp = mkdtempSync(join(tmpdir(), 'bordas-'));
const ff = (args) => execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-y', ...args]);
// o quadro com matéria: cor clara com grão que troca a cada quadro (a coluna nunca é chapada)
const comGrao = (d, extra = '') => ['-f', 'lavfi', '-i', `color=c=0xd9d2c8:s=1080x1920:d=${d}:r=30`, '-vf', `noise=alls=25:allf=t${extra}`, '-pix_fmt', 'yuv420p'];
const so = (r) => r.erros.map((e) => e.msg).join(' | ') || 'nenhum erro';

// 1 · o quadro inteiro com matéria passa
const limpo = join(tmp, 'limpo.mp4');
ff([...comGrao(3), limpo]);
let r = bordas(limpo);
ok(r.erros.length === 0, `quadro com matéria até as bordas: passa (${so(r)})`);

// 2 · o defeito clássico: 12 px de fundo chapado na borda direita por 1,5 s reprovam
const direita = join(tmp, 'direita.mp4');
ff([...comGrao(4, ",drawbox=x=1068:y=0:w=12:h=1920:color=0xe9e9e9:t=fill:enable='between(t,1,2.5)'"), direita]);
r = bordas(direita);
ok(r.erros.length === 1 && /direita/.test(r.erros[0].msg) && /1[12] px/.test(r.erros[0].msg) && /1,0 a 2,5/.test(r.erros[0].msg), `12 px chapados na direita por 1,5 s reprovam, com o lado, a largura e o tempo (${so(r)})`);

// 3 · a faixa de um quadro só (a costura de 1 quadro de uma transição) não chega a 0,2 s: passa
const relampago = join(tmp, 'relampago.mp4');
ff([...comGrao(3, ",drawbox=x=1068:y=0:w=12:h=1920:color=0xe9e9e9:t=fill:enable='between(t,1.0,1.04)'"), relampago]);
r = bordas(relampago);
ok(r.erros.length === 0, `a faixa de um quadro (abaixo de 0,2 s) passa (${so(r)})`);

// 4 · o quadro todo chapado (o respiro, o flash branco) não é faixa: passa
const chapado = join(tmp, 'chapado.mp4');
ff(['-f', 'lavfi', '-i', 'color=c=white:s=1080x1920:d=2:r=30', '-pix_fmt', 'yuv420p', chapado]);
r = bordas(chapado);
ok(r.erros.length === 0, `o quadro inteiro chapado não é faixa de borda (${so(r)})`);

// 5 · a fresta no alto (a crítica r10: a cena de antes numa faixa de 20 px) reprova pelo alto
const alto = join(tmp, 'alto.mp4');
ff([...comGrao(3, ",drawbox=x=0:y=0:w=1080:h=20:color=0x8a8a8a:t=fill:enable='between(t,0.5,1.5)'"), alto]);
r = bordas(alto);
ok(r.erros.length === 1 && /alto/.test(r.erros[0].msg), `20 px chapados no alto por 1 s reprovam pelo alto (${so(r)})`);

// 6 · a faixa de 2 px (a costura do anti-serrilhado) fica abaixo do mínimo de 3: passa
const fina = join(tmp, 'fina.mp4');
ff([...comGrao(3, ",drawbox=x=1078:y=0:w=2:h=1920:color=0xe9e9e9:t=fill"), fina]);
r = bordas(fina);
ok(r.erros.length === 0, `2 px chapados na borda ficam abaixo do mínimo (${so(r)})`);

// 7 · a parede lisa da gravação (o teto cinza da sala, desvio ~3,5 depois da compressão) é
// matéria, não faixa do modelo: o falso positivo medido numa peça real, com 45 linhas lisas em
// cima e a moldura embaixo. O ruído alls=10 mede ~3,7 depois do codificador, o do teto
const parede = join(tmp, 'parede.mp4');
ff(['-f', 'lavfi', '-i', 'color=c=0xd9d2c8:s=1080x1920:d=2:r=30', '-f', 'lavfi', '-i', 'color=c=0x949494:s=1080x45:d=2:r=30',
  '-filter_complex', '[0]noise=alls=25:allf=t[b];[1]noise=alls=10:allf=t[t];[b][t]overlay=0:0', '-pix_fmt', 'yuv420p', parede]);
r = bordas(parede);
ok(r.erros.length === 0, `a parede lisa com o ruído da câmera passa (${so(r)})`);

// 8 · o arquivo que não abre reprova: não medir não é passar
r = bordas(join(tmp, 'nao-existe.mp4'));
ok(r.erros.length === 1 && /não abriu|nada medido/.test(r.erros[0].msg), `o arquivo que não abre reprova (${so(r)})`);

rmSync(tmp, { recursive: true, force: true });
console.log(`\n# tests ${testes}\n# fail ${falhas}`);
// o processo acaba sozinho: o process.exit forçado, depois das leituras grandes do ffmpeg, pode travar
// no Windows com a conta já impressa
process.exitCode = falhas ? 1 : 0;
