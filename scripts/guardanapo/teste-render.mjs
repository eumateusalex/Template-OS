// Prova do render do Guardanapo: os PNGs saem em 2160 × 2700, e o que só o navegador vê (texto que passa da caixa, pintura fora da
// margem, fonte que não carregou) reprova antes da foto.
//
// Rodar: node --test scripts/guardanapo/teste-render.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { renderizar } from './render.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));

const boa = () => ({
  formato: 'carrossel',
  elementos: {
    a: { tipo: 'no', texto: 'pedido chega', x: 120, y: 300, largura: 360 },
    b: { tipo: 'no', texto: 'o dono responde', x: 120, y: 520, largura: 360, tinta: 'solucao' },
    c: { tipo: 'no', texto: 'cliente recebe', x: 600, y: 560, largura: 380 },
    s1: { tipo: 'seta', de: 'a', para: 'b' },
    s2: { tipo: 'seta', de: 'b', para: 'c', rotulo: 'envia' },
    n1: { tipo: 'anotacao', texto: 'aqui o cliente esfria', x: 560, y: 760, aponta: 'c' },
  },
  quadros: [
    { papel: 'capa', titulo: 'Onde o pedido trava', mostrar: ['a', 'b', 'c'] },
    { papel: 'meio', titulo: 'O pedido entra', mostrar: ['a', 'b', 's1'], frase: 'Todo pedido começa igual.' },
    { papel: 'ponto', titulo: 'Aqui ele esfria', mostrar: ['c', 's2', 'n1'], destaque: { tipo: 'sublinhado', alvo: 'titulo', palavra: 'esfria' } },
  ],
});

function pasta(cena) {
  const p = mkdtempSync(join(tmpdir(), 'guardanapo-render-'));
  if (cena) writeFileSync(join(p, 'cena.json'), JSON.stringify(cena));
  return p;
}
const pngs = (p) => readdirSync(p).filter((f) => /^quadro-\d+\.png$/.test(f)).sort();
const dimensao = (arquivo) => {
  const b = readFileSync(arquivo);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};

test('a cena boa sai em um PNG de 2160 × 2700 por quadro, com as medidas', async () => {
  const p = pasta(boa());
  try {
    const r = await renderizar(p);
    assert.deepEqual(r.erros, []);
    assert.deepEqual(pngs(p), ['quadro-01.png', 'quadro-02.png', 'quadro-03.png']);
    for (const f of pngs(p)) assert.deepEqual(dimensao(join(p, f)), [2160, 2700]);
    const m = JSON.parse(readFileSync(join(p, 'medidas.json'), 'utf8'));
    assert.equal(m.quadros.length, 3);
    assert.deepEqual(m.quadros[1].fontes, ['Excalifont']);
    const h = await renderizar(p, { fonte: 'hibrida', saida: 'hibrida' });
    assert.deepEqual(h.erros, []);
    assert.deepEqual(h.medidas.quadros[1].fontes.sort(), ['Excalifont', 'Inter 4']);
  } finally {
    rmSync(p, { recursive: true, force: true });
  }
});

test('o sublinhado do título cai sob a palavra medida no navegador', async () => {
  const p = pasta(boa());
  try {
    const r = await renderizar(p);
    const q = r.medidas.quadros[2];
    assert.ok(q.palavra, 'o render não mediu a palavra do destaque');
    assert.ok(Math.abs(q.destaque.x0 - q.palavra.x0) <= 12, `começo: ${q.destaque.x0} contra ${q.palavra.x0}`);
    assert.ok(Math.abs(q.destaque.x1 - q.palavra.x1) <= 12, `fim: ${q.destaque.x1} contra ${q.palavra.x1}`);
  } finally {
    rmSync(p, { recursive: true, force: true });
  }
});

test('o texto que o navegador desenha mais largo que a caixa reprova, sem PNG', async () => {
  const c = boa();
  c.elementos.a.texto = 'arquitetonicamente';
  c.elementos.a.largura = 240;
  const p = pasta(c);
  try {
    const r = await renderizar(p);
    assert.ok(r.erros.some((x) => /o texto de "a" passa da caixa em \d+ px/.test(x)), r.erros.join('\n'));
    assert.deepEqual(pngs(p), []);
  } finally {
    rmSync(p, { recursive: true, force: true });
  }
});

test('a pintura fora da margem reprova (o círculo que a régua estática não vê)', async () => {
  const c = boa();
  c.elementos.t1 = { tipo: 'texto', texto: 'aqui', x: 920, y: 400 };
  c.quadros[2].mostrar.push('t1');
  c.quadros[2].destaque = { tipo: 'circulo', alvo: 't1' };
  const p = pasta(c);
  try {
    const r = await renderizar(p);
    assert.ok(r.erros.some((x) => /o destaque passa da margem no quadro 3/.test(x)), r.erros.join('\n'));
    assert.deepEqual(pngs(p), []);
  } finally {
    rmSync(p, { recursive: true, force: true });
  }
});

test('a fonte que não carregou reprova antes da foto', async () => {
  const p = pasta(boa());
  try {
    const r = await renderizar(p, { semFonte: 'Excalifont' });
    assert.ok(r.erros.some((x) => /Excalifont não carregou/.test(x)), r.erros.join('\n'));
    assert.deepEqual(pngs(p), []);
  } finally {
    rmSync(p, { recursive: true, force: true });
  }
});

test('a cena que reprova na régua não fotografa, e o PNG velho some', async () => {
  const c = boa();
  c.elementos.a.texto = 'o pedido do cliente chega';
  const p = pasta(c);
  writeFileSync(join(p, 'quadro-09.png'), 'velho');
  try {
    const r = await renderizar(p);
    assert.equal(r.codigo, 1);
    assert.ok(r.erros.some((x) => /5 palavras/.test(x)));
    assert.deepEqual(pngs(p), []);
    assert.ok(!existsSync(join(p, 'quadro-09.png')));
  } finally {
    rmSync(p, { recursive: true, force: true });
  }
});

test('a opção de fonte e a subpasta de saída', async () => {
  const p = pasta(boa());
  try {
    const r = await renderizar(p, { fonte: 'inter', saida: 'inter' });
    assert.deepEqual(r.erros, []);
    assert.deepEqual(pngs(join(p, 'inter')), ['quadro-01.png', 'quadro-02.png', 'quadro-03.png']);
    assert.deepEqual(r.medidas.quadros[1].fontes, ['Inter 4']);
    assert.deepEqual(pngs(p), []);
  } finally {
    rmSync(p, { recursive: true, force: true });
  }
});

test('a CLI: 2 sem cena, 1 com erro de régua', () => {
  const p = pasta();
  const cli = () => spawnSync(process.execPath, [join(AQUI, 'render.mjs'), p], { encoding: 'utf8' });
  try {
    assert.equal(cli().status, 2);
    const c = boa();
    c.elementos.a.texto = 'o pedido do cliente chega';
    writeFileSync(join(p, 'cena.json'), JSON.stringify(c));
    const r = cli();
    assert.equal(r.status, 1, r.stdout + r.stderr);
  } finally {
    rmSync(p, { recursive: true, force: true });
  }
});

test('o texto que cruza uma seta reprova', async () => {
  const c = boa();
  // a anotação no caminho da seta de a (em cima) para uma folha lá embaixo
  c.elementos.d = { tipo: 'folha', texto: 'fim', x: 120, y: 980, largura: 360 };
  c.elementos.s9 = { tipo: 'seta', de: 'b', para: 'd' };
  c.elementos.n2 = { tipo: 'anotacao', texto: 'no caminho', x: 230, y: 800 };
  c.quadros[1].mostrar.push('d', 's9', 'n2');
  const p = pasta(c);
  try {
    const r = await renderizar(p);
    assert.ok(r.erros.some((x) => /o texto de "n2" cruza "s9" no quadro 2/.test(x)), r.erros.join(' | '));
    assert.deepEqual(pngs(p), []);
  } finally {
    rmSync(p, { recursive: true, force: true });
  }
});

test('o destaque que cruza a frase reprova', async () => {
  const c = boa();
  c.elementos.d = { tipo: 'texto', texto: 'fim', x: 200, y: 1122 };
  c.quadros[2].mostrar.push('d');
  c.quadros[2].destaque = { tipo: 'circulo', alvo: 'd' };
  c.quadros[2].frase = 'Uma frase comprida que quebra em duas linhas no rodapé do quadro.';
  const p = pasta(c);
  try {
    const r = await renderizar(p);
    assert.ok(r.erros.some((x) => /o destaque cruza a frase no quadro 3/.test(x)), r.erros.join(' | '));
  } finally {
    rmSync(p, { recursive: true, force: true });
  }
});

test('o título que o navegador quebra em 3 linhas reprova', async () => {
  const c = boa();
  c.tamanhos = { titulo: 96 };
  // medido: a estimativa dá 2 linhas, a Excalifont real dá 3
  c.quadros[1].titulo = 'Quem demora manda o cliente embora';
  // o desenho desce para a régua estática (que estima 2 linhas) deixar passar
  Object.assign(c.elementos.a, { y: 360 });
  Object.assign(c.elementos.b, { y: 560 });
  Object.assign(c.elementos.c, { y: 600 });
  Object.assign(c.elementos.n1, { y: 800 });
  const p = pasta(c);
  try {
    const r = await renderizar(p);
    assert.ok(r.erros.some((x) => /o título do quadro 2 quebra em 3 linhas \(o teto é 2\)/.test(x)), r.erros.join(' | '));
  } finally {
    rmSync(p, { recursive: true, force: true });
  }
});

test('o rótulo que quebra em 3 linhas reprova, com a largura que caberia', async () => {
  const c = boa();
  c.elementos.a.texto = 'planilha de orçamentos';
  c.elementos.a.largura = 240;
  const p = pasta(c);
  try {
    const r = await renderizar(p);
    assert.ok(r.erros.some((x) => /o rótulo de "a" quebra em 3 linhas no quadro 2: alargue o nó para \d+ px/.test(x)), r.erros.join(' | '));
    // o número sugerido tem de bastar: aplicado, o rótulo sai em 2 linhas
    const n = Number(r.erros.join(' ').match(/alargue o nó para (\d+) px/)[1]);
    c.elementos.a.largura = n;
    writeFileSync(join(p, 'cena.json'), JSON.stringify(c));
    const r2 = await renderizar(p);
    assert.deepEqual(r2.erros, []);
    assert.equal(r2.codigo, 0);
  } finally {
    rmSync(p, { recursive: true, force: true });
  }
});

test('a quebra usa a largura real: o título que a estimativa põe em 2 linhas sai em 1', async () => {
  const c = boa();
  // medido: 880 px na Excalifont real, 1000 px na estimativa
  c.quadros[1].titulo = 'Ele liga e fica aflito lá';
  const p = pasta(c);
  try {
    const r = await renderizar(p);
    assert.deepEqual(r.erros, []);
    assert.equal(r.medidas.quadros[1].linhasDoTitulo, 1);
  } finally {
    rmSync(p, { recursive: true, force: true });
  }
});

test('a régua de linha e de área usa a largura real, nos dois sentidos', async () => {
  // medido: a estimativa dá 1 linha, o navegador 2
  const c = boa();
  c.elementos.p = { tipo: 'pessoa', texto: 'cliente', x: 780, y: 254 };
  c.quadros[1].titulo = 'mesmo pedido em quando';
  c.quadros[1].mostrar.push('p');
  const p = pasta(c);
  try {
    const r = await renderizar(p);
    assert.ok(r.erros.some((x) => /"p" encosta no título do quadro 2/.test(x)), r.erros.join(' | '));
    assert.deepEqual(pngs(p), []);
  } finally {
    rmSync(p, { recursive: true, force: true });
  }
  // e o contrário: a estimativa dá 3 linhas, o navegador 2, e a cena passa
  const d = boa();
  d.quadros[1].titulo = 'lista a pedido ilimitado orçamento responda';
  const q = pasta(d);
  try {
    const r = await renderizar(q);
    assert.deepEqual(r.erros, []);
    assert.equal(r.medidas.quadros[1].linhasDoTitulo, 2);
  } finally {
    rmSync(q, { recursive: true, force: true });
  }
});

test('a palavra sozinha na última linha do título reprova', async () => {
  const c = boa();
  c.quadros[1].titulo = 'Responda no mesmo dia';
  const p = pasta(c);
  try {
    const r = await renderizar(p);
    assert.ok(r.erros.some((x) => /o título do quadro 2 deixa "dia" sozinho na última linha/.test(x)), r.erros.join(' | '));
  } finally {
    rmSync(p, { recursive: true, force: true });
  }
});

test('a caixa que não cabe o texto diz a largura que caberia, e ela basta', async () => {
  const c = boa();
  c.elementos.a.texto = 'arquitetonicamente';
  c.elementos.a.largura = 240;
  const p = pasta(c);
  try {
    const r = await renderizar(p);
    const m = r.erros.join(' ').match(/o texto de "a" passa da caixa em \d+ px no quadro 2: alargue a forma para (\d+) px/);
    assert.ok(m, r.erros.join(' | '));
    c.elementos.a.largura = Number(m[1]);
    writeFileSync(join(p, 'cena.json'), JSON.stringify(c));
    const r2 = await renderizar(p);
    assert.deepEqual(r2.erros, []);
    assert.equal(r2.codigo, 0);
  } finally {
    rmSync(p, { recursive: true, force: true });
  }
});

test('o medidas.json velho sai junto com os PNGs velhos', async () => {
  const c = boa();
  c.elementos.a.texto = 'o pedido do cliente chega';
  const p = pasta(c);
  writeFileSync(join(p, 'medidas.json'), '{"velho": true}');
  try {
    const r = await renderizar(p);
    assert.equal(r.codigo, 1);
    assert.ok(!existsSync(join(p, 'medidas.json')));
  } finally {
    rmSync(p, { recursive: true, force: true });
  }
});
