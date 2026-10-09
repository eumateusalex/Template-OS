// Prova da conferência do Guardanapo: cada regra do guia
// reprova a cena que a quebra, com a mensagem que diz o que consertar, e a
// cena boa aprova dizendo o que mediu.
//
// Rodar: node --test scripts/guardanapo/teste-conferir.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { conferir, reguaEmTexto } from './conferir.mjs';
import { areaLivre } from './geometria.mjs';
import { T } from './tokens.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));

const boa = () => ({
  formato: 'carrossel',
  elementos: {
    eixo: { tipo: 'linha', estrutura: true, pontos: [[120, 960], [960, 960]] },
    a: { tipo: 'no', texto: 'pedido chega', x: 120, y: 300, largura: 360 },
    b: { tipo: 'no', texto: 'o dono responde', x: 120, y: 520, largura: 360, tinta: 'solucao' },
    c: { tipo: 'no', texto: 'cliente recebe', x: 600, y: 560, largura: 380 },
    p: { tipo: 'pessoa', texto: 'dono', x: 780, y: 260 },
    g: { tipo: 'grupo', texto: 'o escritório', contem: ['a', 'b'] },
    s1: { tipo: 'seta', de: 'a', para: 'b' },
    s2: { tipo: 'seta', de: 'b', para: 'c', rotulo: 'envia' },
    n1: { tipo: 'anotacao', texto: 'aqui o cliente esfria', x: 560, y: 740, aponta: 'c' },
  },
  quadros: [
    { papel: 'capa', titulo: 'Onde o orçamento trava', mostrar: ['eixo', 'a', 'b', 'c'] },
    { papel: 'meio', titulo: 'O pedido entra', mostrar: ['a', 'b', 's1', 'g', 'p'], frase: 'Todo pedido começa igual.' },
    { papel: 'ponto', titulo: 'Aqui ele esfria', mostrar: ['c', 's2', 'n1'], destaque: { tipo: 'foco', alvo: 'c' } },
    { papel: 'fecho', titulo: 'Responda antes', mostrar: [] },
  ],
});

const erros = (cena) => conferir(cena).erros;
const reprova = (cena, re) => {
  const e = erros(cena);
  assert.ok(e.some((x) => re.test(x)), `esperava erro ${re}, veio:\n  ${e.join('\n  ') || '(nenhum)'}`);
};

test('a cena boa aprova e diz o que mediu', () => {
  const r = conferir(boa());
  assert.deepEqual(r.erros, []);
  assert.equal(r.medidas.quadros, 4);
  assert.deepEqual(r.medidas.nos, [3, 3, 4, 4]);
  assert.deepEqual(r.medidas.niveis, { titulo: 80, rotulo: 40, frase: 32 });
});

test('o teto de nós do formato: pessoa conta, grupo e estrutura não', () => {
  const c = boa();
  for (const [i, x] of [[1, 120], [2, 600]]) c.elementos[`x${i}`] = { tipo: 'folha', texto: 'x', x, y: 820, largura: 200 };
  c.quadros[2].mostrar.push('x1', 'x2', 'x3');
  c.elementos.x3 = { tipo: 'elipse', texto: 'x', x: 360, y: 820, largura: 200 };
  reprova(c, /quadro 3.*7 nós.*teto do carrossel é 6/);
  const post = boa();
  post.formato = 'post';
  post.quadros = [{ titulo: 'Onde trava', mostrar: ['a', 'b', 'c', 'p', 's1', 'g'] }];
  assert.deepEqual(erros(post), []);
  post.elementos.y = { tipo: 'folha', texto: 'y', x: 600, y: 820, largura: 300 };
  post.elementos.z = { tipo: 'losango', texto: 'z', x: 120, y: 760, largura: 300 };
  post.quadros[0].mostrar.push('y', 'z');
  reprova(post, /6 nós.*teto do post é 5/);
});

test('a borda exata do teto de nós passa: carrossel 6, post 5, slide 8 (e 9 reprova)', () => {
  const c = boa();
  for (const [i, x] of [[1, 120], [2, 600]]) c.elementos[`x${i}`] = { tipo: 'folha', texto: 'x', x, y: 820, largura: 200 };
  c.quadros[2].mostrar.push('x1', 'x2');
  const r = conferir(c);
  assert.deepEqual(r.erros, []);
  assert.equal(r.medidas.nos[2], T.teto.carrossel);
  const post = boa();
  post.formato = 'post';
  post.elementos.y = { tipo: 'folha', texto: 'y', x: 600, y: 820, largura: 300 };
  post.quadros = [{ titulo: 'Onde trava', mostrar: ['a', 'b', 'c', 'p', 's1', 'g', 'y'] }];
  const rp = conferir(post);
  assert.deepEqual(rp.erros, []);
  assert.equal(rp.medidas.nos[0], T.teto.post);
  // a grade 3 × 3 de folhas: 8 é o teto do slide, a nona reprova
  const grade = {};
  [120, 400, 680].forEach((x, i) => [300, 500, 700].forEach((y, j) => { grade[`f${i}${j}`] = { tipo: 'folha', texto: 'x', x, y, largura: 200 }; }));
  const nomes = Object.keys(grade);
  const slide = { formato: 'slide', elementos: grade, quadros: [{ titulo: 'Um', mostrar: nomes.slice(0, 8) }] };
  const rs = conferir(slide);
  assert.deepEqual(rs.erros, []);
  assert.equal(rs.medidas.nos[0], T.teto.slide);
  slide.quadros[0].mostrar = nomes;
  reprova(slide, /9 nós, e o teto do slide é 8/);
});

test('a borda exata das palavras passa: rótulo 4, anotação 10, título 6', () => {
  const c = boa();
  c.elementos.a.texto = 'o pedido chega cedo';
  c.elementos.s2.rotulo = 'envia a proposta hoje';
  c.elementos.n1.texto = 'um dois três quatro cinco seis sete oito nove dez';
  c.quadros[3].titulo = 'Um dia só e já foi';
  assert.deepEqual(erros(c), []);
});

test('as palavras por papel: rótulo 4, anotação 10, título 6', () => {
  const c = boa();
  c.elementos.a.texto = 'o pedido do cliente chega';
  reprova(c, /rótulo de "a" tem 5 palavras/);
  const d = boa();
  d.elementos.n1.texto = 'um dois três quatro cinco seis sete oito nove dez onze';
  reprova(d, /anotação "n1" tem 11 palavras/);
  const e = boa();
  e.quadros[1].titulo = 'um dois três quatro cinco seis sete';
  reprova(e, /título do quadro 2 tem 7 palavras/);
  const s = boa();
  s.elementos.s2.rotulo = 'envia a proposta pronta hoje';
  reprova(s, /rótulo de "s2" tem 5 palavras/);
});

test('o tamanho de cada nível fica na faixa', () => {
  const c = boa();
  c.tamanhos = { rotulo: 30, titulo: 100 };
  reprova(c, /nível rotulo em 30 px.*36 a 44/);
  reprova(c, /nível titulo em 100 px.*72 a 96/);
});

test('o destaque: um quadro ponto, destaque só no ponto e no fecho', () => {
  const c = boa();
  c.quadros[1].destaque = { tipo: 'sublinhado', alvo: 'titulo', palavra: 'pedido' };
  reprova(c, /quadro 2 \(meio\) tem destaque/);
  const d = boa();
  d.quadros[1].papel = 'ponto';
  reprova(d, /2 quadros ponto/);
  const e = boa();
  e.quadros[2].papel = 'meio';
  delete e.quadros[2].destaque;
  reprova(e, /nenhum quadro ponto/);
});

test('a capa não tem destaque nem frase, e todo quadro tem título', () => {
  const c = boa();
  c.quadros[0].frase = 'uma frase';
  c.quadros[0].destaque = { tipo: 'circulo', alvo: 'a' };
  reprova(c, /capa tem frase/);
  reprova(c, /capa tem destaque/);
  const d = boa();
  delete d.quadros[3].titulo;
  reprova(d, /quadro 4 sem título/);
});

test('cor e tracejado não se escolhem na cena', () => {
  const c = boa();
  c.elementos.a.cor = '#ff0000';
  reprova(c, /"a" tem o campo "cor"/);
  const d = boa();
  d.elementos.a.tracejado = true;
  reprova(d, /"a" tem o campo "tracejado".*opcional/);
});

test('hachura só em forma sem texto', () => {
  const c = boa();
  c.elementos.a.preenchimento = 'hachura';
  reprova(c, /"a" tem hachura com texto/);
});

test('nome citado que não existe', () => {
  const c = boa();
  c.elementos.s1.para = 'fantasma';
  reprova(c, /"s1" aponta para "fantasma", que não existe/);
  const d = boa();
  d.quadros[1].mostrar.push('sumido');
  reprova(d, /quadro 2 mostra "sumido", que não existe/);
  const e = boa();
  e.elementos.s3 = { tipo: 'seta', de: 'c' };
  e.quadros[3].mostrar.push('s3');
  reprova(e, /"s3" não tem destino: "para", ou "saida" com "ate"/);
});

test('travessão e número-prova na letra de mão', () => {
  const c = boa();
  c.quadros[1].titulo = 'O pedido — entra';
  reprova(c, /travessão no título do quadro 2/);
  const d = boa();
  d.elementos.a.texto = '74% chegam';
  reprova(d, /número-prova "74%" na letra de mão em "a"/);
  const f = boa();
  f.fonte = 'inter';
  f.elementos.a.texto = '74% chegam';
  assert.ok(!erros(f).some((x) => /número-prova/.test(x)), 'na fonte só Inter o número-prova pode ir no rótulo');
});

test('a fonte padrão é só letra de mão', () => {
  assert.equal(T.fontePadrao, 'mao');
  assert.match(reguaEmTexto(), /fonte mao/);
  const e = boa();
  e.quadros[1].frase = 'Em 74% dos casos, o pedido esfria.';
  reprova(e, /número-prova "74%" na letra de mão na frase do quadro 2: .*"fonte": "hibrida"/);
  e.fonte = 'hibrida';
  assert.deepEqual(erros(e), []);
});

test('nós que se sobrepõem, e desenho fora da margem ou em cima do título', () => {
  const c = boa();
  c.elementos.c.x = 300;
  reprova(c, /"b" e "c" se sobrepõem no quadro 3/);
  const d = boa();
  d.elementos.c.x = 700;
  reprova(d, /"c" passa da margem/);
  const e = boa();
  e.elementos.p.y = 120;
  reprova(e, /"p" encosta no título do quadro 2/);
});

test('a CLI: 0 aprovada, 1 com erro, 2 sem cena ou com JSON quebrado', () => {
  const pasta = mkdtempSync(join(tmpdir(), 'guardanapo-conferir-'));
  const cli = () => spawnSync(process.execPath, [join(AQUI, 'conferir.mjs'), pasta], { encoding: 'utf8' });
  try {
    assert.equal(cli().status, 2);
    writeFileSync(join(pasta, 'cena.json'), '{ quebrado');
    assert.equal(cli().status, 2);
    const ruim = boa();
    ruim.elementos.a.texto = 'o pedido do cliente chega';
    writeFileSync(join(pasta, 'cena.json'), JSON.stringify(ruim));
    const r1 = cli();
    assert.equal(r1.status, 1);
    assert.match(r1.stdout + r1.stderr, /5 palavras/);
    writeFileSync(join(pasta, 'cena.json'), JSON.stringify(boa()));
    const r0 = cli();
    assert.equal(r0.status, 0, r0.stdout + r0.stderr);
    assert.match(r0.stdout, /aprovada: 4 quadros/);
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
});

test('a CLI diz de onde vem a cor: a marca configurada ou a neutra, e avisa o acento ilegível', () => {
  const pasta = mkdtempSync(join(tmpdir(), 'guardanapo-conferir-'));
  const cli = (marca) => {
    const env = { ...process.env, GUARDANAPO_MARCA: marca };
    delete env.NODE_TEST_CONTEXT;
    return spawnSync(process.execPath, [join(AQUI, 'conferir.mjs'), pasta], { encoding: 'utf8', env });
  };
  try {
    writeFileSync(join(pasta, 'cena.json'), JSON.stringify(boa()));
    const n = cli('neutra');
    assert.equal(n.status, 0, n.stdout + n.stderr);
    assert.match(n.stdout, /paleta neutra.*\/carrossel configurar/);
    const marca = join(pasta, 'tokens.css');
    writeFileSync(marca, ':root{--c-dark:20,60,40;--c-light:250,248,242;--c-accent:250,220,60;--c-support-1:30,90,140;--c-support-2:236,232,222;}');
    const m = cli(marca);
    assert.equal(m.status, 0, m.stdout + m.stderr);
    assert.ok(m.stdout.includes(`cores da marca: ${marca}`), m.stdout);
    assert.match(m.stdout, /⚠️ a tinta "destaque" \(#fadc3c\)/);
    assert.doesNotMatch(n.stdout, /⚠️ a tinta/);
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
});

test('a CLI reprova só o que é certo: a linha e a área estimadas saem como aviso', () => {
  const pasta = mkdtempSync(join(tmpdir(), 'guardanapo-conferir-'));
  try {
    const c = boa();
    c.quadros[1].titulo = 'lista a pedido ilimitado orçamento responda';
    assert.ok(erros(c).some((x) => /o título do quadro 2 quebra em 3 linhas/.test(x)), 'a estimativa devia quebrar em 3');
    writeFileSync(join(pasta, 'cena.json'), JSON.stringify(c));
    const r = spawnSync(process.execPath, [join(AQUI, 'conferir.mjs'), pasta], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /aviso.*o render decide com a largura real/);
    assert.match(r.stdout, /o título do quadro 2 quebra em 3 linhas/);
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
});

test('a conferência nunca lança: a cena malformada vira linha', () => {
  const casos = [
    (c) => { c.quadros[1].titulo = ['O pedido', 'entra']; },
    (c) => { c.quadros[1].frase = { texto: 'x' }; },
    (c) => { c.quadros[1].mostrar = { a: 1 }; },
    (c) => { c.quadros[1].mostrar = ['constructor']; },
    (c) => { c.quadros[1].mostrar = [7]; },
    (c) => { c.elementos.g.contem = { a: 1 }; },
    (c) => { c.elementos.a.tipo = 'constructor'; },
    (c) => { c.elementos.s1.de = 'toString'; },
    (c) => { c.quadros[2].destaque.alvo = 'constructor'; },
    (c) => { c.quadros[2].destaque = 'foco'; },
    (c) => { c.quadros[1] = null; },
    (c) => { c.formato = 'constructor'; },
    (c) => { c.tamanhos = 'grande'; },
    (c) => { c.elementos.a = null; },
  ];
  casos.forEach((estraga, i) => {
    const c = boa();
    estraga(c);
    let r;
    assert.doesNotThrow(() => { r = conferir(c); }, `o caso ${i} lançou`);
    assert.ok(r.erros.length > 0, `o caso ${i} passou sem erro`);
  });
});

test('a régua impressa e a conferência leem a área da mesma função', () => {
  assert.equal(Math.ceil(areaLivre(1, 0, boa()).piso), 196);
  assert.equal(Math.floor(areaLivre(0, 1, boa()).teto), 1214);
  // a entrelinha é a da fonte de cada papel: a frase na mão, o título na Inter
  const { quadro, margem, nivel, entrelinha, respiroDaArea } = T;
  assert.equal(areaLivre(0, 1, { fonte: 'mao' }).teto, quadro.altura - margem - nivel.frase.padrao * entrelinha.mao - respiroDaArea);
  assert.equal(areaLivre(1, 0, { fonte: 'inter' }).piso, margem + nivel.titulo.padrao * entrelinha.inter + respiroDaArea);
  for (const fonte of [undefined, 'mao', 'inter']) {
    const s = reguaEmTexto({ fonte });
    for (const n of [1, 2]) {
      assert.ok(s.includes(String(Math.ceil(areaLivre(n, 0, { fonte }).piso))), `${fonte}: falta o começo com ${n} linha(s)`);
      assert.ok(s.includes(String(Math.floor(areaLivre(0, n, { fonte }).teto))), `${fonte}: falta o fim com ${n} linha(s)`);
    }
  }
  const mao = spawnSync(process.execPath, [join(AQUI, 'conferir.mjs'), '--regua', '--fonte', 'mao'], { encoding: 'utf8' });
  assert.equal(mao.status, 0, mao.stderr);
  assert.ok(mao.stdout.includes(String(Math.floor(areaLivre(0, 1, { fonte: 'mao' }).teto))), 'a régua com --fonte mao não usa a entrelinha da mão na frase');
});

test('o lado do rótulo da seta é um dos quatro', () => {
  const c = boa();
  c.elementos.s2.lado = 'meio';
  reprova(c, /"s2" tem o lado "meio"/);
  const d = boa();
  d.elementos.s2.lado = 'abaixo';
  assert.deepEqual(erros(d), []);
});

test('o post não tem capa, e o encostar diz os números', () => {
  const post = boa();
  post.formato = 'post';
  post.quadros = [{ papel: 'capa', titulo: 'Onde trava', mostrar: ['a', 'b', 'c'] }];
  reprova(post, /o post não tem capa/);
  const e = boa();
  e.elementos.p.y = 120;
  reprova(e, /"p" encosta no título do quadro 2: o desenho começa em 63 e a área livre começa em 196/);
});

test('círculo é para palavra ou número; nó focal é foco', () => {
  const c = boa();
  c.quadros[2].destaque = { tipo: 'circulo', alvo: 'c' };
  reprova(c, /o círculo do quadro 3 está em volta do nó "c"/);
  assert.deepEqual(erros(boa()), []);
});

test('as reprovações que ainda não tinham prova', () => {
  const f = boa(); f.elementos.b.y = 1100;
  reprova(f, /"b" encosta na frase do quadro 2: o desenho termina em 1248 e a área livre termina em 1214/);
  const g = boa(); g.quadros[2].destaque = { tipo: 'sublinhado', alvo: 'titulo', palavra: 'nada' };
  reprova(g, /o destaque do quadro 3 aponta a palavra "nada", que não está no título/);
  const j = boa(); j.quadros[2].destaque = { tipo: 'foco', alvo: 'sumido' };
  reprova(j, /o destaque do quadro 3 aponta "sumido", que não existe/);
  const h = boa(); h.elementos.a.texto = 'pedido — chega';
  reprova(h, /travessão em "a"/);
  const k = boa(); k.formato = 'post'; k.quadros = [{ titulo: 'Um', mostrar: ['a'] }, { titulo: 'Dois', mostrar: ['b'] }];
  reprova(k, /o post tem 2 quadros: é um só/);
  const l = boa(); l.elementos.a.tinta = 'azul';
  reprova(l, /"a" tem a tinta "azul"/);
  const i = boa(); i.elementos.z = { tipo: 'retangulo', x: 1, y: 1 };
  reprova(i, /"z" tem o tipo "retangulo", que não existe/);
  const m = boa(); m.elementos.a.preenchimento = 'listrado';
  reprova(m, /"a" tem o preenchimento "listrado"/);
  const n = boa(); n.elementos.s3 = { tipo: 'seta', para: 'c' }; n.quadros[3].mostrar.push('s3');
  reprova(n, /"s3" não tem origem/);
  const o = boa(); o.elementos.s3 = { tipo: 'seta', de: 'c', saida: true }; o.quadros[3].mostrar.push('s3');
  reprova(o, /"s3" é saída sem o ponto "ate"/);
  const q = boa(); q.elementos.l2 = { tipo: 'linha', pontos: [[1, 1]] };
  reprova(q, /"l2" é linha sem dois "pontos"/);
  const r = boa(); delete r.elementos.a.x;
  reprova(r, /"a" sem posição "x" e "y"/);
  const s = boa(); s.quadros[1].papel = 'miolo';
  reprova(s, /quadro 2 tem o papel "miolo"/);
  const u = boa(); u.quadros[2].destaque = { tipo: 'brilho', alvo: 'c' };
  reprova(u, /o destaque do quadro 3 tem o tipo "brilho"/);
  const v = boa(); v.quadros[2].destaque = { tipo: 'seta', alvo: 'c' };
  reprova(v, /o destaque seta do quadro 3 precisa do ponto "de"/);
  const w = boa(); w.formato = 'revista';
  reprova(w, /o formato "revista" não existe/);
  const x = boa(); x.fonte = 'gotica';
  reprova(x, /a fonte "gotica" não existe/);
  reprova({ formato: 'carrossel', quadros: [] }, /a cena não tem "elementos"/);
  reprova({ formato: 'carrossel', elementos: {} }, /a cena não tem quadros/);
});

test('a borda: nome de elemento e número que chegam de fora', () => {
  const c = boa();
  c.elementos['a"><script>x=1</script><g data-z="'] = { tipo: 'no', texto: 'x', x: 120, y: 820, largura: 200 };
  reprova(c, /o nome "a"><script>x=1<\/script><g data-z="" tem caractere fora de letras, números, _ e -/);
  const d = boa(); d.tamanhos = { titulo: '80"/><script>' };
  reprova(d, /o tamanho titulo não é número/);
  const e = boa(); e.elementos.eixo.pontos = [[120, '960"/><script>'], [960, 960]];
  reprova(e, /"eixo" tem ponto que não é número/);
  const f = boa(); f.elementos.a.largura = '360"';
  reprova(f, /"a" tem "largura" que não é número/);
  const g = boa(); g.elementos.s2.curva = 'muito';
  reprova(g, /"s2" tem "curva" que não é número/);
  const h = boa(); h.elementos.s3 = { tipo: 'seta', de: 'c', saida: true, ate: [980, 'x'] }; h.quadros[3].mostrar.push('s3');
  reprova(h, /"s3" tem "ate" que não é ponto/);
  const i = boa(); i.quadros[2].destaque = { tipo: 'seta', alvo: 'c', de: ['a', 1] };
  reprova(i, /o destaque seta do quadro 3 precisa do ponto "de"/);
  const j = boa(); j.elementos.a.x = '120';
  reprova(j, /"a" sem posição "x" e "y"/);
});

test('sem a medida, a régua deixa a linha e a área para o render', () => {
  const c = boa();
  c.elementos.p.y = 120;
  assert.ok(conferir(c).erros.some((x) => /encosta no título/.test(x)));
  assert.deepEqual(conferir(c, { semMedida: true }).erros, []);
});

test('a CLI imprime a régua a partir do tokens.mjs', () => {
  const r = spawnSync(process.execPath, [join(AQUI, 'conferir.mjs'), '--regua'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const s = r.stdout;
  for (const n of [T.teto.carrossel, T.teto.post, T.nivel.titulo.padrao, T.nivel.rotulo.min, T.nivel.frase.max, T.nivel.titulo.palavras, T.anotacaoPalavras, T.margem]) {
    assert.match(s, new RegExp(`(^|\\D)${n}(\\D|$)`, 'm'), `a régua impressa não traz ${n}`);
  }
  assert.match(s, new RegExp(`carrossel.*${T.teto.carrossel}`));
  const corpo = reguaEmTexto.toString();
  for (const n of [T.nivel.titulo.padrao, T.nivel.titulo.min, T.nivel.titulo.max, T.nivel.rotulo.min, T.nivel.rotulo.max, T.nivel.frase.min, T.anotacaoPalavras, T.margem, T.respiroDaArea, T.quadro.largura, T.quadro.altura]) {
    assert.doesNotMatch(corpo, new RegExp(`(^|[^0-9])${n}([^0-9]|$)`), `o número ${n} está copiado na reguaEmTexto`);
  }
});
