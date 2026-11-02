// A régua do cromo.mjs, sobre amostras sintéticas no formato do `amostrar` do regua-direcao.mjs.
// Cada caso planta um cromo e confere que a regra certa pega; a peça limpa passa.
//   node teste-cromo.mjs
import { cromoDasAmostras } from './cromo.mjs';

let testes = 0, falhas = 0;
const ok = (cond, msg) => { testes++; console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); if (!cond) falhas++; };
const formato = { largura: 1080, altura: 1920, topo: 220, base: 1540, lateral: 65 };
const plano = { cenas: [{ id: 'S01', de: 0, ate: 2 }, { id: 'S02', de: 2, ate: 4 }, { id: 'S03', de: 4, ate: 6 }] };
const caixa = (top, h, left, w) => ({ top, bottom: top + h, left, right: left + w });
const texto = (txt, r, extra = {}) => ({ tipo: 'texto', txt, op: 1, livre: false, objeto: false, legenda: false, r, ...extra });
const forma = (txt, r) => ({ tipo: 'forma', txt, op: 1, livre: false, objeto: false, legenda: false, r });
// monta 6 s de amostras a 0,1 s; cada função devolve os itens do instante t
const amostras = (...fns) => ({ passo: 0.1, formato, amostras: Array.from({ length: 60 }, (_, i) => { const t = +(i * 0.1).toFixed(1); return { t, itens: fns.flatMap((f) => f(t)) }; }) });
const so = (r) => r.erros.map((e) => e.msg.slice(0, 50)).join(' | ') || 'nenhum';

// a peça limpa: título grande que muda por cena e anda, legenda embaixo, interface desenhada no canto
const titulo = (t) => [texto(['o cliente procura', 'e não te acha', 'e vai embora'][Math.min(2, Math.floor(t / 2))], caixa(700 + Math.round(t * 20), 110, 120 + Math.floor(t / 2) * 40, 840))];
const legenda = (t) => [texto('você perde', caixa(1330, 40, 300, 480), { legenda: true })];
const objeto = (t) => [texto('9:41', caixa(240, 30, 80, 90), { objeto: true })];
let r = cromoDasAmostras(amostras(titulo, legenda, objeto), plano);
ok(r.erros.length === 0 && r.avisos.length === 0, `peça limpa passa (${so(r)}; avisos ${r.avisos.length})`);

// o rótulo parado no canto por 1,5 s reprova; por 0,5 s passa
const canto = (de, ate) => (t) => (t >= de && t < ate ? [texto('Google', caixa(240, 30, 80, 140))] : []);
r = cromoDasAmostras(amostras(titulo, canto(0, 1.5)), plano);
ok(r.erros.length === 1 && /canto/.test(r.erros[0].msg), `rótulo parado no canto por 1,5 s reprova (${so(r)})`);
r = cromoDasAmostras(amostras(titulo, canto(0, 0.5)), plano);
ok(r.erros.length === 0, 'o mesmo rótulo por 0,5 s passa');

// contador de capítulo e metadado de produção
r = cromoDasAmostras(amostras(titulo, (t) => (t < 1 ? [texto('02 / 04', caixa(900, 36, 470, 140))] : [])), plano);
ok(r.erros.length === 1 && /contador/.test(r.erros[0].msg), `"02 / 04" reprova como contador (${so(r)})`);
r = cromoDasAmostras(amostras(titulo, (t) => (t < 1 ? [texto('120 BPM', caixa(900, 36, 470, 140))] : [])), plano);
ok(r.erros.length === 1 && /metadado/.test(r.erros[0].msg), `"120 BPM" reprova como metadado (${so(r)})`);

// o kicker do raio-x: "Google" de ~19 px encostado em cima de um título de ~58 px
const kicker = (t) => (t >= 2 && t < 3 ? [texto('Google', caixa(600, 19, 120, 120)), texto('Não diz se está aberto', caixa(630, 58, 120, 700))] : []);
r = cromoDasAmostras(amostras(kicker), plano);
ok(r.erros.length === 1 && /rótulo acima/.test(r.erros[0].msg) && r.erros[0].recusa === true, `sem a lista da marca, o rótulo acima do título reprova firme (${so(r)})`);

// as recusas da marca: o que ela recusa reprova firme (recusa: true); o que ela permite só avisa
const contador = (t) => (t < 1 ? [texto('02 / 04', caixa(900, 36, 470, 140))] : []);
r = cromoDasAmostras(amostras(kicker), plano, { recusas: ['kicker'] });
ok(r.erros.length === 1 && r.erros[0].recusa === true && /recusa "kicker"/.test(r.erros[0].msg), `a marca que recusa "kicker": o rótulo acima do título reprova firme (${so(r)})`);
r = cromoDasAmostras(amostras(kicker), plano, { recusas: ['contador', 'bounce'] });
ok(r.erros.length === 0 && r.avisos.length === 1 && /permite "kicker"/.test(r.avisos[0].msg), `a marca que permite "kicker": o mesmo rótulo só avisa (${so(r)}; avisos ${r.avisos.map((a) => a.msg.slice(-60)).join(' | ')})`);
r = cromoDasAmostras(amostras(titulo, contador), plano, { recusas: ['contador'] });
ok(r.erros.length === 1 && r.erros[0].recusa === true && /contador/.test(r.erros[0].msg), `a marca que recusa "contador": "02 / 04" reprova firme (${so(r)})`);
r = cromoDasAmostras(amostras(titulo, contador), plano, { recusas: [] });
ok(r.erros.length === 0 && r.avisos.length === 1 && /permite "contador"/.test(r.avisos[0].msg), `a marca sem recusas: "02 / 04" só avisa (${so(r)})`);
r = cromoDasAmostras(amostras(titulo, (t) => (t < 1 ? [texto('120 BPM', caixa(900, 36, 470, 140))] : [])), plano, { recusas: [] });
ok(r.erros.length === 1 && /metadado/.test(r.erros[0].msg), `o metadado não é recusa da marca: reprova com ou sem a lista (${so(r)})`);
const longe = (t) => (t >= 2 && t < 3 ? [texto('Google', caixa(400, 19, 120, 120)), texto('Não diz se está aberto', caixa(630, 58, 120, 700))] : []);
ok(cromoDasAmostras(amostras(longe), plano).erros.length === 0, 'o texto pequeno longe do título (211 px acima) não é kicker');

// o marcador preso: a mesma forma no mesmo lugar nas três cenas
const preso = () => [forma('marcador-partes', caixa(260, 60, 420, 240))];
r = cromoDasAmostras(amostras(titulo, preso), plano);
ok(r.erros.length === 1 && /3 cenas/.test(r.erros[0].msg), `o marcador no mesmo lugar em 3 cenas é reportado (a E10, calibragem) (${so(r)})`);
const muda = (t) => [forma('marcador-partes', caixa(260 + Math.floor(t / 2) * 300, 60 + Math.floor(t / 2) * 20, 420, 240))];
ok(cromoDasAmostras(amostras(titulo, muda), plano).erros.length === 0, 'o marcador que muda de lugar e tamanho a cada cena passa');
ok(cromoDasAmostras(amostras(titulo, preso), plano, { preso: 'aviso' }).erros.length === 0, 'pedido como aviso (peça antiga), o marcador preso só avisa');
// a câmera que passa: o objeto do mundo fica parado só na S03, e nas outras duas cenas a câmera passa
// por aquele enquadramento num quadro amostrado (o raio-X v2: os cubos, aos 8,5 e aos 16,8 s)
const passa = (t) => [forma('cubo', t >= 4 || t === 0.7 || t === 2.6 ? caixa(540, 110, 530, 72) : caixa(540 + Math.round(t * 90), 110, 530, 72))];
r = cromoDasAmostras(amostras(titulo, passa), plano);
ok(r.erros.length === 0, `parado numa cena só, com a câmera passando por ali num quadro de outras duas, não é preso (${so(r)})`);
// e o preso de verdade com 0,3 s em cada cena ainda reprova
const curto = (t) => [forma('marcador-partes', (t >= 0.5 && t < 0.8) || (t >= 2.5 && t < 2.8) || t >= 4 ? caixa(260, 60, 420, 240) : caixa(900, 60, 420, 240))];
r = cromoDasAmostras(amostras(titulo, curto), plano);
ok(r.erros.length === 1 && /3 cenas/.test(r.erros[0].msg), `o marcador que fica 0,3 s no mesmo lugar em cada uma das 3 cenas reprova (${so(r)})`);

console.log(`\n# tests ${testes}\n# fail ${falhas}`);
process.exit(falhas ? 1 : 0);
