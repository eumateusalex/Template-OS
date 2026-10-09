// Prova do desenho do Guardanapo: a cena vira um SVG por quadro no traço à
// mão, com as cores da marca (ou da neutra) pelo papel e o estado de cada
// elemento no quadro (novo, já mostrado, estrutura, capa).
//
// Rodar: node --test scripts/guardanapo/teste-desenhar.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { desenhar } from './desenhar.mjs';
import { T } from './tokens.mjs';

const cena = () => ({
  formato: 'carrossel',
  elementos: {
    eixo: { tipo: 'linha', estrutura: true, pontos: [[100, 1000], [980, 1000]] },
    a: { tipo: 'no', texto: 'pedido chega', x: 100, y: 360, largura: 360 },
    b: { tipo: 'no', texto: 'o dono responde', x: 100, y: 600, largura: 360, tinta: 'solucao' },
    c: { tipo: 'no', texto: 'cliente <recebe> & some', x: 600, y: 600, largura: 380 },
    p: { tipo: 'pessoa', texto: 'dono', x: 700, y: 300 },
    g: { tipo: 'grupo', texto: 'o escritório', contem: ['a', 'b'] },
    s1: { tipo: 'seta', de: 'a', para: 'b' },
    s2: { tipo: 'seta', de: 'b', para: 'c', curva: 0.2, rotulo: 'envia' },
    s3: { tipo: 'seta', de: 'c', saida: true, ate: [980, 900], rotulo: 'desiste' },
    n1: { tipo: 'anotacao', texto: 'aqui o cliente esfria', x: 600, y: 820, aponta: 'c' },
  },
  quadros: [
    { papel: 'capa', titulo: 'Onde o orçamento trava', mostrar: ['eixo', 'a', 'b', 'c'] },
    { papel: 'meio', titulo: 'O pedido entra', mostrar: ['a', 'b', 's1', 'g', 'p'], frase: 'Todo pedido começa igual.' },
    { papel: 'ponto', titulo: 'Aqui ele esfria', mostrar: ['c', 's2', 'n1'], destaque: { tipo: 'circulo', alvo: 'c' } },
    { papel: 'fecho', titulo: 'Responda antes', mostrar: ['s3'] },
  ],
});

// o <g> de um elemento, e as cores de traço dos paths dele
const grupo = (svg, id) => {
  const m = svg.match(new RegExp(`<g data-id="${id}"[^>]*>([\\s\\S]*?)</g>`));
  return m ? m[0] : null;
};
const tracos = (g) => [...g.matchAll(/<path[^>]* stroke="(#[0-9a-f]{6})"/g)].map((m) => m[1]);
const primeiroD = (g) => g.match(/ d="([^"]+)"/)[1];

test('um SVG de 1080 × 1350 por quadro', () => {
  const q = desenhar(cena());
  assert.equal(q.length, 4);
  for (const svg of q) {
    assert.match(svg, /^<svg [^>]*width="1080" height="1350"/);
    assert.match(svg, /viewBox="0 0 1080 1350"/);
  }
});

test('a mesma cena desenha igual duas vezes (semente fixa)', () => {
  assert.deepEqual(desenhar(cena()), desenhar(cena()));
});

test('o mesmo elemento tem a mesma geometria em todo quadro, só a cor muda', () => {
  const q = desenhar(cena());
  const c3 = grupo(q[2], 'c');
  const c4 = grupo(q[3], 'c');
  assert.equal(primeiroD(c3), primeiroD(c4));
  assert.deepEqual(new Set(tracos(c3)), new Set([T.cor.problema]));
  assert.deepEqual(new Set(tracos(c4)), new Set([T.cor.contexto]));
});

test('o novo sai na tinta dele, o já mostrado sai em cinza', () => {
  const q = desenhar(cena());
  assert.deepEqual(new Set(tracos(grupo(q[1], 'a'))), new Set([T.cor.problema]));
  assert.deepEqual(new Set(tracos(grupo(q[1], 'b'))), new Set([T.cor.solucao]));
  assert.deepEqual(new Set(tracos(grupo(q[2], 'a'))), new Set([T.cor.contexto]));
  assert.deepEqual(new Set(tracos(grupo(q[2], 'b'))), new Set([T.cor.contexto]));
});

test('a estrutura é preta na capa e cinza depois', () => {
  const q = desenhar(cena());
  assert.deepEqual(new Set(tracos(grupo(q[0], 'eixo'))), new Set([T.cor.problema]));
  assert.deepEqual(new Set(tracos(grupo(q[1], 'eixo'))), new Set([T.cor.contexto]));
  assert.deepEqual(new Set(tracos(grupo(q[3], 'eixo'))), new Set([T.cor.contexto]));
});

test('a capa mostra as formas sem rótulo, e não conta como já mostrado', () => {
  const q = desenhar(cena());
  assert.ok(grupo(q[0], 'a'));
  assert.doesNotMatch(grupo(q[0], 'a'), /<text/);
  assert.match(grupo(q[1], 'a'), /pedido chega/);
  // o c da capa não vira "já mostrado" no quadro 2: ele só volta no quadro 3, novo
  assert.equal(grupo(q[1], 'c'), null);
});

test('a anotação só aparece no quadro dela', () => {
  const q = desenhar(cena());
  assert.ok(grupo(q[2], 'n1'));
  assert.equal(grupo(q[3], 'n1'), null);
});

test('a cor de destaque só aparece no quadro que tem destaque, e sai no seguinte', () => {
  const q = desenhar(cena());
  assert.match(q[2], new RegExp(`stroke="${T.cor.destaque}"`));
  for (const i of [0, 1, 3]) assert.doesNotMatch(q[i], new RegExp(T.cor.destaque));
});

test('nenhuma cor fora da paleta aparece no SVG', () => {
  for (const fonte of ['hibrida', 'mao', 'inter']) {
    for (const svg of desenhar({ ...cena(), fonte })) {
      const valores = [...svg.matchAll(/(?:stroke|fill)="([^"]+)"/g)].map((m) => m[1].toLowerCase());
      assert.ok(valores.length >= 5, 'o SVG não tem traço nenhum para medir');
      for (const v of valores) assert.ok(v === 'none' || T.paleta.includes(v), `cor fora da paleta: ${v}`);
    }
  }
});

test('sem a opção, a peça sai só na letra de mão', () => {
  const svg = desenhar(cena())[1];
  assert.match(svg.match(/<text data-papel="frase"[^>]*>/)[0], /font-family="'Excalifont'"/);
});

test('a fonte pela opção: híbrida, só mão e só Inter', () => {
  const titulo = (svg) => svg.match(/<text data-papel="titulo"[^>]*>/)[0];
  const frase = (svg) => svg.match(/<text data-papel="frase"[^>]*>/)[0];
  const rotulo = (svg) => grupo(svg, 'a').match(/<text[^>]*>/)[0];
  const [hib, mao, inter] = ['hibrida', 'mao', 'inter'].map((fonte) => desenhar({ ...cena(), fonte })[1]);
  assert.match(titulo(hib), /font-family="'Excalifont'"/);
  assert.match(titulo(hib), /font-size="80"/);
  assert.match(rotulo(hib), /font-family="'Excalifont'"[^>]*font-size="40"|font-size="40"[^>]*font-family="'Excalifont'"/);
  assert.match(frase(hib), /font-family="'Inter 4'"/);
  assert.match(frase(hib), /font-size="32"/);
  assert.match(frase(mao), /font-family="'Excalifont'"/);
  assert.match(titulo(inter), /font-family="'Inter 4'"/);
  assert.match(titulo(inter), /font-weight="700"/);
  assert.match(rotulo(inter), /font-family="'Inter 4'"/);
});

test('a seta começa e termina na borda dos nós, com a ponta só no destino', () => {
  const svg = desenhar(cena())[1];
  const s1 = grupo(svg, 's1');
  const [x0, y0] = s1.match(/data-inicio="([\d.]+),([\d.]+)"/).slice(1).map(Number);
  const [x1, y1] = s1.match(/data-fim="([\d.]+),([\d.]+)"/).slice(1).map(Number);
  // a (100..460 × 360..496) em cima de b (100..460 × 600..736): a seta desce
  assert.ok(y0 > 496 && y0 < 496 + 16, `início fora da borda de baixo de a: ${y0}`);
  assert.ok(y1 < 600 && y1 > 600 - 16, `fim fora da borda de cima de b: ${y1}`);
  assert.ok(x0 > 100 && x0 < 460 && x1 > 100 && x1 < 460);
  assert.equal((s1.match(/data-ponta/g) || []).length, 1);
});

test('a saída do fluxo termina no ponto livre', () => {
  const s3 = grupo(desenhar(cena())[3], 's3');
  assert.match(s3, /data-fim="980,900"/);
});

test('o texto vai escapado para o SVG', () => {
  const c = grupo(desenhar(cena())[2], 'c');
  assert.match(c, /&lt;recebe&gt; &amp; some/);
  assert.doesNotMatch(c, /<recebe>/);
});

test('o nó tem a altura do guia: 136 px com uma linha', () => {
  const a = grupo(desenhar(cena())[1], 'a');
  assert.match(a, /data-caixa="100,360,460,496"/);
});

test('o rótulo da seta vai no lado pedido', () => {
  const c = cena();
  c.elementos.s2.curva = 0;
  const y = (svg) => Number(grupo(svg, 's2').match(/<tspan x="[\d.]+" y="([\d.]+)">envia</)[1]);
  const [, y0] = grupo(desenhar(c)[2], 's2').match(/data-inicio="([\d.]+),([\d.]+)"/).slice(1).map(Number);
  const acima = y(desenhar(c)[2]);
  c.elementos.s2.lado = 'abaixo';
  const abaixo = y(desenhar(c)[2]);
  assert.ok(acima < y0, `acima: ${acima} devia ficar acima da seta (${y0})`);
  assert.ok(abaixo > y0, `abaixo: ${abaixo} devia ficar abaixo da seta (${y0})`);
});

test('o nome do elemento vai escapado: aspas não abrem tag (nó, seta e linha)', () => {
  const renomear = (c, de, para) => {
    c.elementos[para] = c.elementos[de];
    delete c.elementos[de];
    for (const q of c.quadros) q.mostrar = q.mostrar.map((id) => (id === de ? para : id));
    for (const el of Object.values(c.elementos)) {
      if (el.de === de) el.de = para;
      if (el.para === de) el.para = para;
      if (el.aponta === de) el.aponta = para;
      if (el.contem) el.contem = el.contem.map((id) => (id === de ? para : id));
    }
  };
  const c = cena();
  for (const id of ['a', 's1', 'eixo']) renomear(c, id, `${id}"><script>x=1</script><g data-z="`);
  for (const svg of desenhar(c)) assert.ok(!svg.includes('<script'), 'o nome do elemento abriu uma tag no SVG');
});
