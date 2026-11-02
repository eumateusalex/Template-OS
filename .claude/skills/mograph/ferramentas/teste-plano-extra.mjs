// A régua do plano-extra.mjs: o plano bom passa; cada defeito plantado reprova só a regra dele.
//   node teste-plano-extra.mjs
import { conferirExtra, eventosDoPlano } from './plano-extra.mjs';

let testes = 0, falhas = 0;
const ok = (cond, msg) => { testes++; console.log(`${cond ? 'ok  ' : 'FALHA'} ${msg}`); if (!cond) falhas++; };
const so = (r) => [...new Set(r.erros.map((e) => e.regra))].sort().join(',');
const formatos = { reel: {}, 'anuncio-reels': {}, shorts: {} };

const bom = () => ({
  modo: 'puro', duracao: 30, legenda: 'L1', formato: 'reel', virgula: { em: 19.2 },
  cenas: [
    { id: 'S01', de: 0, ate: 4, funcao: 'HOOK', importancia: 2, transicao: 'corte', tempo_forte: 'acento' },
    { id: 'S02', de: 4, ate: 10, funcao: 'PROBLEM', importancia: 1, transicao: 'morph' },
    { id: 'S03', de: 10, ate: 20, funcao: 'PROOF', importancia: 1, transicao: 'corte' },
    { id: 'S04', de: 20, ate: 26, funcao: 'REVEAL', importancia: 3, transicao: 'corte', tempo_forte: 'revela' },
    { id: 'S05', de: 26, ate: 30, funcao: 'CTA', importancia: 2 },
  ],
});

let r = conferirExtra(bom(), { formatos });
ok(r.erros.length === 0 && r.avisos.length === 0, `plano bom passa sem aviso (${so(r) || 'nenhum'}; avisos ${r.avisos.map((a) => a.regra).join(',') || 'nenhum'})`);

let p = bom(); p.cenas[0].importancia = 3; p.cenas[2].importancia = 3;
r = conferirExtra(p, { formatos });
ok(so(r) === 'importancia', `3 cenas de 5 em importância 3 reprovam só a importância (${so(r)})`);

p = bom(); p.cenas[4].de = 20; p.cenas[3].ate = 20; p.cenas[3].de = 18; p.cenas[2].ate = 18;
p.cenas[4].ate = 30; p.cenas[3].funcao = 'CTA'; p.cenas[3].importancia = 2; p.cenas[1].importancia = 3; p.virgula = null;
r = conferirExtra(p, { formatos });
ok(so(r) === 'cta', `CTA de 12 s em 30 s reprova só o CTA (${so(r)})`);

p = bom(); p.cenas[2].transicao = 'morph';
r = conferirExtra(p, { formatos });
ok(so(r) === 'morph', `a segunda transformação sem motivo reprova só o morph (${so(r)})`);
p.excecoes = [{ transicao: 'morph', motivo: 'o botão vira a conversa e a conversa vira a agenda: é o produto' }];
ok(conferirExtra(p, { formatos }).erros.length === 0, 'com o motivo escrito, a segunda transformação passa');

p = bom(); p.virgula = { em: 40 };
ok(so(conferirExtra(p, { formatos })) === 'virgula', 'a vírgula fora da peça reprova');
p.virgula = { em: 12 };
r = conferirExtra(p, { formatos });
ok(r.erros.length === 0 && r.avisos.some((a) => a.regra === 'virgula'), 'a vírgula longe do pico avisa');

p = bom(); p.modo = 'falado'; p.cenas[1].legenda = 'L0';
ok(so(conferirExtra(p, { formatos })) === 'legenda', 'falado com uma cena em L0 reprova a legenda');
p = bom(); p.legenda = 'L9';
ok(so(conferirExtra(p, { formatos })) === 'legenda', 'modo de legenda que não existe reprova');
p = bom(); p.legenda = 'L3';
r = conferirExtra(p, { formatos });
ok(r.erros.length === 0 && r.avisos.some((a) => a.regra === 'legenda'), 'L3 avisa (só com a referência dele)');

// com a pessoa na tela, a fala inteira; na tela cheia, só a palavra forte
const falado = () => { const f = bom(); f.modo = 'falado'; f.legenda = 'L2'; f.cenas.forEach((c) => { c.tipo = 'legenda'; c.transicao = 'corte'; }); f.cenas[3].tipo = 'tela-cheia'; f.cenas[3].legenda = 'L1'; return f; };
r = conferirExtra(falado(), { formatos });
ok(r.erros.length === 0 && !r.avisos.some((a) => a.regra === 'legenda'), `falado: L2 com ele, L1 na tela cheia passa (${r.avisos.map((a) => a.msg).join(' | ') || 'nenhum aviso'})`);
p = falado(); p.cenas[3].legenda = 'L2';
r = conferirExtra(p, { formatos });
ok(r.erros.length === 0 && r.avisos.some((a) => a.regra === 'legenda' && /S04/.test(a.msg) && /L1/.test(a.msg)), 'falado: a tela cheia com a frase inteira avisa');
p = falado(); p.cenas[0].legenda = 'L1';
r = conferirExtra(p, { formatos });
ok(r.erros.length === 0 && r.avisos.some((a) => a.regra === 'legenda' && /S01/.test(a.msg) && /L2/.test(a.msg)), 'falado: ele na tela com só a palavra forte avisa');

p = bom(); p.cenas[3].tempo_forte = 'acento';
r = conferirExtra(p, { formatos });
ok(r.erros.length === 0 && r.avisos.some((a) => a.regra === 'tempo_forte'), 'o pico num acento avisa');
p.cenas[3].tempo_forte = 'bum';
ok(so(conferirExtra(p, { formatos })) === 'tempo_forte', 'tempo forte que não existe reprova');

p = bom(); p.formato = 'tiktok';
ok(so(conferirExtra(p, { formatos })) === 'formato', 'formato fora do formatos.json reprova');

p = bom(); p.cenas.forEach((c) => delete c.importancia); p.virgula = null;
r = conferirExtra(p, { formatos });
ok(r.erros.length === 0 && r.avisos.some((a) => a.regra === 'importancia'), 'plano sem importância nenhuma avisa: o pico não está escrito');

const ev = eventosDoPlano(bom());
ok(ev.length === 4 && ev[0].t === 4 && ev[0].type === 'cut' && ev[3].label === 'S05', `eventos: um corte por costura, no "de" da cena que entra (${JSON.stringify(ev[0])})`);

console.log(`\n# tests ${testes}\n# fail ${falhas}`);
process.exit(falhas ? 1 : 0);
