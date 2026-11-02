// As réguas da regua-direcao.mjs que leem a linguagem e o estilo da peça: o estímulo
// conta a frase nova da voz e não conta o efeito inaudível; o ofício não cobra o piso de tipos de
// efeito onde a linguagem ou o estilo o dispensam; a transição aceita o dissolver com causa no
// documental, e a causa cala a ida e volta de sentido.
//   node teste-reguas-linguagem.mjs
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { eventosDaPeca, estimulo, somDaPeca, transicoes, ledgerDoPlano } from './regua-direcao.mjs';
import { perfilDoPlano } from './linguagem.mjs';

let testes = 0, falhas = 0;
const ok = (cond, msg) => { testes++; console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); if (!cond) falhas++; };
const tmp = mkdtempSync(join(tmpdir(), 'reguas-linguagem-'));

// ─── 1 · o estímulo ─────────────────────────────────────────────────────────
// uma peça puro de 16 s com duas cenas: só um efeito, aos 12 s; a voz fala uma frase nova aos 4 e
// aos 8 s (cenas com fala), e um efeito de id "pop-baixo" aos 2 s que a mixagem mede inaudível
const puro = join(tmp, 'puro');
(await import('node:fs')).mkdirSync(puro);
writeFileSync(join(puro, 'index.html'), `<div id="root" data-duration="16">
<audio id="trilha" data-papel="trilha" src="t.wav" data-start="0" data-duration="16"></audio>
<audio id="pop-baixo" src="pop.wav" data-start="2" data-duration="0.3"></audio>
<audio id="impacto-1" src="impacto.wav" data-start="12" data-duration="0.5"></audio>
</div>`);
const plano = { modo: 'puro', duracao: 16, cenas: [
  { id: 'S01', de: 0, ate: 4, fala: 'a primeira frase' },
  { id: 'S02', de: 4, ate: 8, fala: 'a segunda frase' },
  { id: 'S03', de: 8, ate: 12, fala: 'a terceira frase' },
  { id: 'S04', de: 12, ate: 16, fala: '' }] };
// os cortes das cenas já caem a cada 4 s: para isolar a fala, um plano de uma cena só, com as falas
// nos instantes da voz (o campo frases)
const umaCena = { modo: 'puro', duracao: 16, cenas: [{ id: 'S01', de: 0, ate: 16, fala: 'tudo' }], frases: [{ de: 4 }, { de: 8 }] };
let ev = eventosDaPeca(puro, umaCena);
ok(ev.includes(4) && ev.includes(8), `a frase nova da voz (o frases do plano) conta como estímulo: ${ev.join(', ')}`);
let r = estimulo(ev, 16);
ok(!r.erros.length, `com as frases, nenhum vão passa de 5 s (${r.erros.map((e) => e.msg).join(' | ')})`);
ev = eventosDaPeca(puro, { ...umaCena, frases: [] });
ok(!ev.includes(4) && !ev.includes(8), 'sem frase da voz, o 4 e o 8 não aparecem');
ok(estimulo(ev, 16).erros.length > 0, 'e o vão de 2 a 12 s reprova');
ev = eventosDaPeca(puro, plano);
ok(ev.includes(4) && ev.includes(8), 'as cenas com fala contam pelo começo delas');
ev = eventosDaPeca(puro, umaCena, null, { inaudiveis: new Set(['pop-baixo']) });
ok(!ev.includes(2), `o efeito que a mixagem mede inaudível não conta: ${ev.join(', ')}`);
ev = eventosDaPeca(puro, umaCena, null, { inaudiveis: new Set() });
ok(ev.includes(2), 'sem a medida, o efeito conta como hoje');
const msg = estimulo([12], 16).erros[0]?.msg || '';
ok(/frase nova da voz/.test(msg), `a mensagem do estímulo diz que a voz conta: ${msg}`);

// no falado: a frase do corte conta, e o efeito do som.json que a mixagem mede inaudível (efeito-N, na
// ordem do som.json) não conta
const falado = join(tmp, 'falado');
(await import('node:fs')).mkdirSync(falado);
writeFileSync(join(falado, 'som.json'), JSON.stringify({ efeitos: [{ arquivo: 'pop.wav', acerto: 2 }, { arquivo: 'pop.wav', acerto: 9 }] }));
const dados = { frases: [{ frase: 1, t_de: 0 }, { frase: 2, t_de: 6.5 }], cortes: [], troca_min: 1.5 };
const pf = { modo: 'falado', cenas: [{ id: 'S01', frase: 1, de: 0, ate: 13 }] };
ev = eventosDaPeca(falado, pf, dados);
ok(ev.includes(6.5) && ev.includes(2) && ev.includes(9), `no falado, a frase do corte e os efeitos contam: ${ev.join(', ')}`);
ev = eventosDaPeca(falado, pf, dados, { inaudiveis: new Set(['efeito-1']) });
ok(!ev.includes(2) && ev.includes(9), 'no falado, o efeito-1 inaudível sai e o efeito-2 fica');

// ─── 2 · o ofício: o piso de tipos de efeito ────────────────────────────────
const doc = join(tmp, 'doc');
(await import('node:fs')).mkdirSync(doc);
writeFileSync(join(doc, 'index.html'), `<div id="root" data-duration="40">
<audio id="trilha" data-papel="trilha" src="t.wav" data-start="0" data-duration="40"></audio>
<audio id="voz" src="voz.wav" data-start="0" data-duration="38"></audio>
<audio id="tecla-1" src="tecla.wav" data-start="3" data-duration="0.2"></audio>
</div>`);
const base = { modo: 'puro', duracao: 40, cenas: [] };
r = somDaPeca(doc, base);
ok(r.erros.some((e) => /tipo\(s\) de efeito/.test(e.msg)), `no motion de interface, menos de 3 tipos reprova como hoje (${r.erros.map((e) => e.msg).join(' | ')})`);
r = somDaPeca(doc, { ...base, estilo: 'documental' }, { perfil: perfilDoPlano({ estilo: 'documental' }) });
ok(!r.erros.length && !r.avisos.some((a) => /tipos de efeito sonoro/.test(a.msg)), 'no estilo documental, nem o piso nem o "pede 5" cobram');
r = somDaPeca(doc, { ...base, linguagem: 'so-efeitos' }, { perfil: perfilDoPlano({ linguagem: 'so-efeitos' }) });
ok(!r.erros.length, 'na linguagem so-efeitos, o piso não cobra');
r = somDaPeca(doc, { ...base, estilo: { id: 'documental' } });
ok(!r.erros.length, 'sem o perfil passado, o somDaPeca o tira do plano (o estilo como objeto)');
r = somDaPeca(doc, { ...base, linguagem: 'interface-de-marca' });
ok(r.erros.length === 1, 'na interface de marca, o piso cobra');

// ─── 3 · as transições ──────────────────────────────────────────────────────
const cenas = (x = []) => [
  { id: 'S01', de: 0, ate: 4, transicao: 'corte', saida: 'y-', ...x[0] },
  { id: 'S02', de: 4, ate: 8, transicao: 'dissolver', ...x[1] },
  { id: 'S03', de: 8, ate: 12 }];
const doDoc = perfilDoPlano({ estilo: 'documental' });
r = transicoes(ledgerDoPlano({ cenas: cenas([{}, { causa: 'a noite vira manhã' }]) }), { perfil: doDoc });
ok(!r.erros.length, `no documental, o dissolver com causa passa (${r.erros.map((e) => e.msg).join(' | ')})`);
r = transicoes(ledgerDoPlano({ cenas: cenas() }), { perfil: doDoc });
ok(r.erros.some((e) => /dissolver/.test(e.msg) && /causa/.test(e.msg)), 'no documental, o dissolver sem causa reprova e pede a causa');
r = transicoes(ledgerDoPlano({ cenas: cenas([{}, { causa: 'a noite vira manhã' }]) }), { perfil: perfilDoPlano({ linguagem: 'interface-de-marca' }) });
ok(r.erros.some((e) => /dissolver/.test(e.msg)), 'na interface de marca, o dissolver reprova mesmo com causa');
r = transicoes(ledgerDoPlano({ cenas: cenas([{}, { causa: 'x' }]) }));
ok(r.erros.some((e) => /dissolver/.test(e.msg)), 'sem perfil, o dissolver reprova como hoje');
const ida = [{ id: 'S01', de: 0, transicao: 'corte', saida: 'x+' }, { id: 'S02', de: 4, transicao: 'corte', saida: 'x-' }, { id: 'S03', de: 8 }];
r = transicoes(ledgerDoPlano({ cenas: ida }));
ok(r.avisos.some((a) => /ida e volta/.test(a.msg)), 'a ida e volta sem causa avisa');
ida[1].causa = 'a resposta volta para quem perguntou';
r = transicoes(ledgerDoPlano({ cenas: ida }));
ok(!r.avisos.some((a) => /ida e volta/.test(a.msg)), 'a ida e volta com a causa escrita na cena não avisa');
ok(ledgerDoPlano({ cenas: ida }).costuras[1].causa === 'a resposta volta para quem perguntou', 'a costura leva a causa da cena que sai');

rmSync(tmp, { recursive: true, force: true });
console.log(`\n# tests ${testes}\n# fail ${falhas}`);
process.exitCode = falhas ? 1 : 0;
