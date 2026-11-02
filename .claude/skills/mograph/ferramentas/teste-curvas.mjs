// A régua das curvas novas (curvas.js). Planta o defeito de cada uma e confere que a régua
// pega: a curva que não começa em 0, a que passa do ponto sem ser mola, e a bezier que não
// bate com o tempo medido (50% e 90% do caminho).
//   node teste-curvas.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const C = require('./curvas.js');

let testes = 0, falhas = 0;
const ok = (cond, msg) => { testes++; console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); if (!cond) falhas++; };

const nomes = Object.keys(C).filter((k) => typeof C[k] === 'function');
ok(nomes.length === 17 && nomes.every((k) => C[k](0) === 0 && Math.abs(C[k](1) - 1) < 1e-9), `curvas: as 17 vão de 0 a 1 (${nomes.length})`);
ok(nomes.every((k) => C.quadros[k] > 0), 'curvas: toda curva tem os quadros típicos');

// o instante em que a curva cobre a fração p do caminho (a medida do estudo, por bisseção)
const quando = (f, p) => { let lo = 0, hi = 1; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (f(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; };
const medido = { rapida: [0.16, 0.53], voo: [0.46, 0.65], camera: [0.47, 0.63], queda: [0.83, 0.99] };
for (const [k, [m50, m90]] of Object.entries(medido)) {
  const a = quando(C[k], 0.5), b = quando(C[k], 0.9);
  ok(Math.abs(a - m50) <= 0.02 && Math.abs(b - m90) <= 0.02, `curvas: ${k} cobre 50% em ${(a * 100).toFixed(1)}% e 90% em ${(b * 100).toFixed(1)}% do tempo (medido ${m50 * 100}% e ${m90 * 100}%)`);
}
const novas = ['rapida', 'voo', 'camera', 'queda'];
ok(novas.every((k) => Array.from({ length: 400 }, (_, i) => C[k]((i + 1) / 400) >= C[k](i / 400) - 1e-12).every(Boolean)), 'curvas: as 4 de interface nunca voltam (não são mola)');
// a câmera: velocidade máxima ~9,6x a média
const vmax = Math.max(...Array.from({ length: 1000 }, (_, i) => (C.camera((i + 1) / 1000) - C.camera(i / 1000)) * 1000));
ok(Math.abs(vmax - 9.6) < 0.6, `curvas: a câmera chega a ${vmax.toFixed(1)}x a velocidade média no meio (medido 9,6x)`);

// a mola do cartão (mola só no cartão de interface): passa 17,4% aos 0,159 s e
// assenta a 2% aos 0,39 s, nos 15 quadros dela
const passo = 0.5 / 1000, am = Array.from({ length: 1001 }, (_, i) => C.cartao(i / 1000));
const pk = Math.max(...am), tpk = am.indexOf(pk) * passo;
const assenta = (am.length - 1 - [...am].reverse().findIndex((v) => Math.abs(v - 1) > 0.02)) * passo;
ok(C.quadros.cartao === 15 && Math.abs(pk - 1.174) < 0.01 && Math.abs(tpk - 0.159) < 0.01 && Math.abs(assenta - 0.39) < 0.02,
  `curvas: o cartão passa ${((pk - 1) * 100).toFixed(1)}% aos ${tpk.toFixed(3)} s e assenta a 2% aos ${assenta.toFixed(2)} s (medido 17,4%, 0,159 s, 0,39 s)`);

// o defeito plantado: uma bezier com o x1 trocado não bate com o medido, e a régua acusa
const errada = (t) => { let lo = 0, hi = 1, s = t; const b = (s, p1, p2) => { const u = 1 - s; return 3 * u * u * s * p1 + 3 * u * s * s * p2 + s ** 3; };
  for (let i = 0; i < 40; i++) { s = (lo + hi) / 2; if (b(s, 0.45, 0) < t) lo = s; else hi = s; } return b(s, 0, 1); };
ok(Math.abs(quando(errada, 0.5) - 0.16) > 0.02, `régua: a "rápida" com x1 0,45 no lugar de 0,10 não passa (50% em ${(quando(errada, 0.5) * 100).toFixed(1)}%)`);
// e a pureza: chamar duas vezes no mesmo t dá o mesmo valor (o render busca quadro a quadro)
ok(novas.every((k) => C[k](0.37) === C[k](0.37)), 'curvas: puras de t (o mesmo t, o mesmo valor)');

console.log(`\n# tests ${testes}\n# fail ${falhas}`);
process.exit(falhas ? 1 : 0);
