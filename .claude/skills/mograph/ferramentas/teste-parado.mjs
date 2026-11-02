// A régua do parado.mjs. Cada caso planta um defeito e confere que a régua reprova, e que a
// peça boa passa. Vídeos sintéticos pelo ffmpeg, sem rede.
//   node teste-parado.mjs [<render real.mp4> reprova|passa]
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { parado, massa, massaDasDiferencas, julgarMassa, MASSA_FATIA_MAX } from './parado.mjs';

let testes = 0, falhas = 0;
const ok = (cond, msg) => { testes++; console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); if (!cond) falhas++; };
const tmp = mkdtempSync(join(tmpdir(), 'parado-'));
const ff = (args) => execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-y', ...args]);
const fundo = (d) => ['-f', 'lavfi', '-i', `color=c=0xf5f5f7:s=1080x1920:d=${d}:r=30`, '-f', 'lavfi', '-i', `color=c=0x0071e3:s=300x300:d=${d}:r=30`];
const so = (r) => r.erros.map((e) => e.msg).join(' | ') || 'nenhum erro';

// 1 · o cartão que anda o tempo todo passa
const anda = join(tmp, 'anda.mp4');
ff([...fundo(6), '-filter_complex', "[0][1]overlay=x='390+200*sin(t*2)':y=800", '-pix_fmt', 'yuv420p', anda]);
let r = parado(anda);
ok(r.erros.length === 0 && r.trechos.length === 0, `anda o tempo todo: passa (${so(r)})`);

// 2 · o defeito típico: 2 s parados no meio reprovam (a régua troca de 3 s deixava passar)
const meio = join(tmp, 'meio.mp4');
ff([...fundo(6), '-filter_complex', "[0][1]overlay=x='390+200*sin(min(t,2)*2)+200*sin(max(t-4,0)*2)':y=800", '-pix_fmt', 'yuv420p', meio]);
r = parado(meio);
ok(r.erros.length === 1 && r.trechos.some((t) => Math.abs(t.dur - 2) <= 0.25), `2 s parados no meio reprovam (${r.trechos.map((t) => t.dur).join(', ')} s; ${so(r)})`);

// 3 · o grão não salva o quadro parado: grão forte trocando a cada quadro sobre a imagem parada
const grao = join(tmp, 'grao.mp4');
ff([...fundo(5), '-filter_complex', "[0][1]overlay=x='390+200*sin(min(t,1.5)*2)':y=800,noise=alls=30:allf=t", '-pix_fmt', 'yuv420p', grao]);
r = parado(grao);
ok(r.erros.length >= 1 && r.trechos.some((t) => t.dur >= 3), `grão forte sobre 3,5 s parados não engana a régua (${r.trechos.map((t) => t.dur).join(', ')} s)`);

// 4 · a câmera que empurra 4% em 6 s (o mínimo de comum.camera-e-luz.camera-que-respira, no manual) não é quadro parado
const empurra = join(tmp, 'empurra.mp4');
ff([...fundo(6), '-filter_complex', "[0][1]overlay=x=390:y=800,scale=w='trunc(1080*(1+0.04*t/6)/2)*2':h='trunc(1920*(1+0.04*t/6)/2)*2':eval=frame,crop=1080:1920", '-pix_fmt', 'yuv420p', empurra]);
r = parado(empurra);
ok(r.erros.length === 0, `câmera empurrando 4% em 6 s passa (${r.trechos.map((t) => t.dur).join(', ') || 'nenhum'} parado)`);

// 5 · o fim parado: 4,6 s parados no fim reprovam (o caso típico segura 4,57 s)
const fim = join(tmp, 'fim.mp4');
ff([...fundo(8), '-filter_complex', "[0][1]overlay=x='390+200*sin(min(t,3.4)*2)':y=800", '-pix_fmt', 'yuv420p', fim]);
r = parado(fim);
ok(r.erros.length === 1 && /fim/.test(r.erros[0].msg), `4,6 s parados no fim reprovam pelo fim (${so(r)})`);

// 6 · o fim resolvido curto passa: 1 s parado no fim
const fimOk = join(tmp, 'fim-ok.mp4');
ff([...fundo(5), '-filter_complex', "[0][1]overlay=x='390+200*sin(min(t,4)*2)':y=800", '-pix_fmt', 'yuv420p', fimOk]);
r = parado(fimOk);
ok(r.erros.length === 0, `1 s parado no fim passa (${so(r)})`);

// 7 · a vírgula de 0,7 s antes do pico passa; duas vírgulas sem declarar avisam; declarada, não
const virg = join(tmp, 'virgula.mp4');
ff([...fundo(8), '-filter_complex', "[0][1]overlay=x='390+200*sin((t-between(t,2,2.7)*(t-2)-gt(t,2.7)*0.7-between(t,5,5.7)*(t-5)-gt(t,5.7)*0.7)*2)':y=800", '-pix_fmt', 'yuv420p', virg]);
// as paradas e a massa avisam separadas: aqui conta só o aviso das vírgulas (regra parado)
const dasParadas = (x) => x.avisos.filter((a) => a.regra === 'parado');
r = parado(virg);
ok(r.erros.length === 0 && dasParadas(r).length === 1, `duas vírgulas de 0,7 s: nenhum erro, um aviso (${r.trechos.map((t) => t.dur).join(', ')} s; avisos ${dasParadas(r).length})`);
r = parado(virg, { virgulas: [2.3] });
ok(r.erros.length === 0 && dasParadas(r).length === 0, 'a vírgula declarada no plano tira o aviso');

// 8 · arquivo que não abre reprova: não medir não é passar
r = parado(join(tmp, 'nao-existe.mp4'));
ok(r.erros.length === 1 && /nada medido/.test(r.erros[0].msg), `arquivo que não existe reprova com erro, sem derrubar a régua (${so(r).slice(-70)})`);

// 9 · a massa: o defeito do vídeo feito por IA. O fundo e o cartão parados, só um cursor que pisca
// e anda, do tamanho de um número ou de uma palavra digitada (o pixel que mais mudou sempre muda): a régua das paradas passa, a massa avisa
const cursor = join(tmp, 'cursor.mp4');
ff(['-f', 'lavfi', '-i', 'color=c=0xf5f5f7:s=1080x1920:d=5:r=30', '-f', 'lavfi', '-i', 'color=c=0x0a0a0a:s=28x120:d=5:r=30',
  '-filter_complex', "[0]drawbox=x=140:y=760:w=800:h=400:color=white:t=fill[f];[f][1]overlay=x='200+mod(n,60)*8':y=880:enable='lt(mod(n,6),3)'", '-pix_fmt', 'yuv420p', cursor]);
r = parado(cursor);
const mc = r.avisos.filter((a) => a.regra === 'massa');
ok(r.erros.length === 0 && mc.length === 2, `só o cursor andando: as paradas passam e a massa avisa duas vezes (mediana ${r.massa?.mediana}, ${r.massa?.fatia}%; ${mc.length} avisos)`);

// 10 · o quadro inteiro andando (a câmera que atravessa o padrão de teste) não avisa a massa
const pan = join(tmp, 'pan.mp4');
ff(['-f', 'lavfi', '-i', 'testsrc=s=2160x1920:d=4:r=30', '-vf', "crop=1080:1920:'min(t*200,1080)':0", '-pix_fmt', 'yuv420p', pan]);
const mp = massa(pan);
ok(julgarMassa(mp).length === 0 && mp.mediana >= 0.35, `o quadro inteiro andando não avisa (mediana ${mp.mediana}, ${mp.fatia}%)`);

// 11 · a conta pura: a mediana e a fatia abaixo de 0,5; acima de ${MASSA_FATIA_MAX}% avisa
const conta = massaDasDiferencas([0.1, 0.2, 0.3, 2, 3]);
ok(conta.mediana === 0.3 && conta.fatia === 60 && julgarMassa(conta).length === 1, `a conta da massa (mediana ${conta.mediana}, fatia ${conta.fatia}%: 60% não passa do teto, a mediana avisa)`);
ok(julgarMassa(null).length === 1, 'a massa que não mediu avisa, não passa calada');

// 12 · a massa por cena: a cena A anda inteira, a B só tem o cursor; o aviso cai só na B, com o nome
const duas = join(tmp, 'duas.mp4');
ff(['-i', pan, '-i', cursor, '-filter_complex', '[0]trim=0:2,setpts=PTS-STARTPTS,fps=30,format=yuv420p[a];[1]trim=0:2,setpts=PTS-STARTPTS,fps=30,format=yuv420p[b];[a][b]concat=n=2:v=1:a=0', '-pix_fmt', 'yuv420p', duas]);
r = parado(duas, { cenas: [{ id: 'A', de: 0, ate: 2 }, { id: 'B', de: 2, ate: 4 }] });
const porA = r.avisos.filter((x) => x.regra === 'massa' && x.msg.startsWith('A: ')), porB = r.avisos.filter((x) => x.regra === 'massa' && x.msg.startsWith('B: '));
ok(porA.length === 0 && porB.length >= 1, `a massa por cena avisa só a cena parada (A ${porA.length}, B ${porB.length}; ${(r.porCena || []).map((c) => c.id + ' ' + c.mediana + '/' + c.fatia + '%').join(', ')})`);

// 12 · o render real, se vier, com o que se espera dele: a peça parada reprova (o
// freezedetect acha os trechos); a peça com a pessoa falando passa
const real = process.argv[2], espera = process.argv[3] || 'reprova';
if (real) {
  r = parado(real);
  const longos = r.trechos.filter((t) => t.dur > 0.75);
  ok(espera === 'reprova' ? r.erros.length >= 1 : r.erros.length === 0, `render real (espera ${espera}) ${basename(real)}: ${r.erros.length} erros, ${longos.length} trechos acima de 0,75 s somando ${longos.reduce((s, t) => s + t.dur, 0).toFixed(1)} s`);
  for (const t of r.trechos) console.log(`      parado ${t.de.toFixed(1)}–${t.ate.toFixed(1)} s (${t.dur.toFixed(1)} s)`);
}

rmSync(tmp, { recursive: true, force: true });
console.log(`\n# tests ${testes}\n# fail ${falhas}`);
process.exit(falhas ? 1 : 0);
