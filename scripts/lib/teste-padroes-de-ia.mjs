// Prova que a lista dos padrões de IA (scripts/lib/padroes-de-ia.js) ainda sabe ACHAR.
//
// O que a humanizer nomeia e a máquina consegue ver é trava nas três réguas (os
// slides, a legenda e a copy de página). Cada padrão tem DOIS casos: o que acha e o
// par que prova que a régua fica quieta quando não deve falar.
//
//   node scripts/lib/teste-padroes-de-ia.mjs

import { createRequire } from 'node:module';
import { escreveRelatorio, resumoTap } from './junit.mjs';
const require_ = createRequire(import.meta.url);

let achaPadroes = () => [], PADROES = [];
try { ({ achaPadroes, PADROES } = require_('./padroes-de-ia.js')); } catch { /* o módulo não carregou: os casos reprovam */ }

let passou = 0, falhou = 0;
const casos = [];
const ok = (nome, cond, extra = '') => {
  casos.push({ nome, falha: cond ? null : String(extra || 'falhou').slice(0, 240) });
  if (cond) { console.log(`  ok   ${nome}`); passou++; }
  else { console.log(`  FALHA ${nome}${extra ? ` · ${extra}` : ''}`); falhou++; }
};
const nomes = t => achaPadroes(t).map(h => h.nome);

console.log('os padrões de IA\n');

// cada padrão: o texto que o denuncia, o padrão esperado, e o par parecido que fica quieto
const PARES = [
  ['contraste fabricado', 'não é sorte, é método.', 'a sorte ajuda, e o método segura.'],
  ['contraste fabricado', 'Não é sorte. É método.', 'não deu sorte. deu trabalho.'],
  ['contraste fabricado', 'não só o pão, mas o café também.', 'o pão e o café saem juntos.'],
  ['falsa revelação', 'o que ninguém te conta sobre a fila da padaria.', 'o que a fila da padaria custa.'],
  ['falsa revelação', 'a verdade é que você perde a manhã.', 'você perde a manhã na fila.'],
  ['falsa revelação', 'vou ser sincero: a planilha atrasa.', 'a planilha atrasa a encomenda.'],
  ['falsa revelação', 'o segredo é responder no mesmo dia.', 'responda no mesmo dia.'],
  ['autoridade vaga', 'estudos mostram que o cliente desiste.', 'o IBGE mediu: 31% compram pelo celular.'],
  ['autoridade vaga', 'especialistas dizem que a encomenda mudou.', 'a encomenda chega pelo celular.'],
  ['importância inflada', 'uma jornada de atendimento na sua padaria.', 'o atendimento na sua padaria.'],
  ['importância inflada', 'uma mudança transformadora na semana.', 'uma mudança na semana.'],
  ['linguagem corporativa', 'para potencializar o seu negócio.', 'para o seu negócio vender mais.'],
  ['linguagem corporativa', 'o sistema otimiza o processo.', 'o sistema faz o rascunho.'],
  ['frase que comenta a própria frase', 'vale destacar que a planilha erra.', 'a planilha erra, e você revisa.'],
  ['advérbio vazio', 'o caderno literalmente guarda a encomenda.', 'o caderno guarda a encomenda.'],
  ['advérbio vazio', 'é basicamente uma planilha.', 'é uma planilha.'],
  ['exclamações empilhadas', 'funciona!!', 'funciona!'],
];
for (const [padrao, com, sem] of PARES) {
  ok(`"${com}" acha o ${padrao}`, nomes(com).some(n => n.startsWith(padrao)), JSON.stringify(achaPadroes(com)));
  ok(`"${sem}" fica quieto`, nomes(sem).length === 0, JSON.stringify(achaPadroes(sem)));
}

// o achado traz o trecho e o conserto, e o contraste é o único de julgamento
const h = achaPadroes('a verdade é que você perde a manhã.')[0] || {};
ok('o achado traz o trecho e o conserto', /a verdade é que/i.test(h.trecho || '') && typeof h.conserto === 'string' && h.conserto.length > 5, JSON.stringify(h));
ok('o contraste fabricado é de julgamento (o contraste real fica, a humanizer diz)', (achaPadroes('não é sorte, é método.')[0] || {}).julgamento === true, JSON.stringify(achaPadroes('não é sorte, é método.')));
ok('os outros padrões não são de julgamento', PADROES.filter(p => !/contraste/.test(p.nome)).every(p => !p.julgamento) && PADROES.length >= 8, `${PADROES.length} padrões`);

// o HTML do slide: as tags saem antes de medir, e o texto direto fica quieto
ok('o padrão dentro do HTML do slide é achado', nomes('<h2>a verdade é <b>que</b> você perde</h2>').length === 1, JSON.stringify(achaPadroes('<h2>a verdade é <b>que</b> você perde</h2>')));
const DIRETO = [
  'sua encomenda sai no caderno. pesquisa com padarias: 31% das ouvidas recebem pedido pelo celular.',
  'cole as anotações e peça a mensagem: quem busca o quê, até quando.',
  'o sistema faz o rascunho, e você decide o que sai.',
  'o cliente chama às 22h, e você responde. o atendente automático pode fazer isso por você.',
];
for (const t of DIRETO) ok(`o texto direto fica quieto: "${t.slice(0, 40)}…"`, nomes(t).length === 0, JSON.stringify(achaPadroes(t)));

escreveRelatorio(process.argv, 'padroes-de-ia', casos, { passou, falhou });
console.log(`\n${passou} passou${falhou ? ` · ${falhou} FALHOU` : ''}`);
resumoTap(passou, falhou);
process.exitCode = falhou ? 1 : 0;
