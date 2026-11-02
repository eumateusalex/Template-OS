// A régua tela (telaDasAmostras do regua-direcao.mjs), sobre amostras sintéticas no formato do
// `amostrar`. Cada caso planta um defeito e confere que reprova; a peça limpa passa.
//   node teste-tela.mjs
import { telaDasAmostras } from './regua-direcao.mjs';

let testes = 0, falhas = 0;
const ok = (cond, msg) => { testes++; console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); if (!cond) falhas++; };
const texto = (txt) => ({ tipo: 'texto', txt, op: 1, legenda: false, objeto: false });
// 1 s de leitura por frase: a régua só compara, a conta do tempo é do plano.mjs
const umSegundo = () => 1;
// 6 s a 0,1 s; cada função devolve os textos do instante t
const amostras = (...fns) => ({ passo: 0.1, amostras: Array.from({ length: 60 }, (_, i) => { const t = +(i * 0.1).toFixed(1); return { t, itens: fns.flatMap((f) => f(t)) }; }) });
const so = (r) => r.erros.map((e) => e.msg.slice(0, 70)).join(' | ') || 'nenhum';
const plano = { cenas: [
  { id: 'S01', de: 0, ate: 3, texto_tela: 'O Diagnóstico mostra onde o cliente para.' },
  { id: 'S02', de: 3, ate: 6, texto_tela: 'Veja onde o seu cliente para.' }
] };
const s01 = (t) => (t < 2.8 ? [texto('O Diagnóstico'), texto('mostra onde o cliente para.')] : []);

// a peça limpa: cada frase na sua cena, inteira por mais de 1 s
const limpa = (t) => (t >= 3.2 && t < 5.8 ? [texto('Veja onde o seu'), texto('cliente para.')] : []);
let r = telaDasAmostras(amostras(s01, limpa), plano, umSegundo);
ok(r.erros.length === 0, `peça limpa passa (${so(r)})`);

// o pedaço de outra cena que cabe dentro da frase ("cliente para." da S02 está em "...o cliente para."
// da S01): o tempo curto dele, na S02, não é o tempo da S01
const curtaDepois = (t) => (t >= 3.2 && t < 4.0 ? [texto('Veja onde o seu'), texto('cliente para.')] : []);
r = telaDasAmostras(amostras(s01, curtaDepois), plano, umSegundo);
ok(!r.erros.some((e) => e.msg.startsWith('S01')), `o pedaço igual de outra cena não encurta a frase da S01 (${so(r)})`);
ok(r.erros.some((e) => e.msg.startsWith('S02')), `e a S02, que fica 0,8 s, reprova (${so(r)})`);

// o tempo curto de verdade, na própria cena, ainda reprova
const s01curta = (t) => (t < 0.6 ? [texto('O Diagnóstico'), texto('mostra onde o cliente para.')] : []);
r = telaDasAmostras(amostras(s01curta, limpa), plano, umSegundo);
ok(r.erros.length === 1 && r.erros[0].msg.startsWith('S01'), `a frase que fica 0,6 s na própria cena reprova (${so(r)})`);

// a frase que nunca aparece inteira reprova
r = telaDasAmostras(amostras((t) => (t < 2.8 ? [texto('O Diagnóstico')] : []), limpa), plano, umSegundo);
ok(r.erros.some((e) => /não aparece inteiro/.test(e.msg)), `a frase partida pela metade reprova (${so(r)})`);

console.log(`\n# tests ${testes}\n# fail ${falhas}`);
process.exitCode = falhas ? 1 : 0;
