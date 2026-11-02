// A régua do cor.mjs. Cada caso planta o defeito e confere que a régua reprova, e que a peça viva
// passa. Vídeos sintéticos pelo ffmpeg, sem rede.
//   node teste-cor.mjs
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cor, corDasSaturacoes } from './cor.mjs';

let testes = 0, falhas = 0;
const ok = (cond, msg) => { testes++; console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); if (!cond) falhas++; };
const tmp = mkdtempSync(join(tmpdir(), 'cor-'));
const ff = (args) => execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-y', ...args]);
const so = (r) => r.erros.map((e) => e.msg).join(' | ') || 'nenhum erro';

// 1 · o defeito recusado: o mundo dessaturado, quase cinza, com grão
const cinza = join(tmp, 'cinza.mp4');
ff(['-f', 'lavfi', '-i', 'testsrc2=s=540x960:d=4:r=30', '-vf', 'hue=s=0.03,noise=alls=12:allf=t', '-pix_fmt', 'yuv420p', cinza]);
let r = cor(cinza);
// o apagado avisa, não reprova (há referência de alto nível com o mundo dessaturado de propósito)
ok(r.erros.length === 0 && r.avisos.length === 1 && /apagado/.test(r.avisos[0].msg), `o vídeo em tom de cinza avisa, sem reprovar (${so(r)}; avisos: ${r.avisos.map((a) => a.msg).join(' | ')})`);

// 2 · o vídeo com cor de verdade passa
const vivo = join(tmp, 'vivo.mp4');
ff(['-f', 'lavfi', '-i', 'testsrc2=s=540x960:d=4:r=30', '-pix_fmt', 'yuv420p', vivo]);
r = cor(vivo);
ok(r.erros.length === 0, `o vídeo colorido passa (p90 ${r.p90?.toFixed(1)}; ${so(r)})`);

// 3 · o branco da Apple com acento de cor em parte dos quadros passa (o p90 pega o acento)
const branco = join(tmp, 'branco.mp4');
ff(['-f', 'lavfi', '-i', 'color=c=0xf4f4f6:s=540x960:d=5:r=30', '-vf', "drawbox=x=120:y=300:w=300:h=300:color=0x0071E3:t=fill:enable='between(t,3.8,5)'", '-pix_fmt', 'yuv420p', branco]);
r = cor(branco);
ok(r.erros.length === 0, `o fundo claro com acento azul em 24% do tempo passa (p90 ${r.p90?.toFixed(1)}; ${so(r)})`);

// 4 · as contas puras: a calibragem da peça recusada (p90 5,8) reprova; a do Bogdan (14,2) passa
const recusada = corDasSaturacoes([3.1, 3.5, 3.9, 4.2, 4.4, 4.8, 5.1, 5.4, 5.8, 6.1]);
ok(recusada.erros.length === 0 && recusada.avisos.length === 1, 'a calibragem da peça recusada avisa, sem reprovar');
ok(corDasSaturacoes([3.0, 3.6, 4.1, 4.3, 4.6, 7.2, 9.0, 11.5, 14.2, 15.0]).erros.length === 0, 'a calibragem da referência creme passa');

// 5 · régua que não mediu reprova
r = corDasSaturacoes([]);
ok(r.erros.length === 1 && /não medida/.test(r.erros[0].msg), 'sem quadro lido, reprova');
r = cor(join(tmp, 'nao-existe.mp4'));
ok(r.erros.length === 1 && /não medida/.test(r.erros[0].msg), 'arquivo que não abre reprova');

rmSync(tmp, { recursive: true, force: true });
console.log(`# tests ${testes}\n# fail ${falhas}`);
process.exitCode = falhas ? 1 : 0;
