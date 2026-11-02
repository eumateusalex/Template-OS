// O kit vivo (ios-vivo.mjs): a peça declara em fonte/ios.json cada pedaço de interface do celular, e a
// ferramenta grava ativos/ios.js com window.IOS = { id: html }, o que o ios.cjs do Node devolve. O montar-puro
// gera de novo antes de embutir. Tudo numa pasta temporária de mentira, com um material de emoji de
// mentira (o MOGRAPH_MATERIAL): nada do material de verdade é tocado.
//
//   node --test .claude/skills/mograph/ferramentas/teste-ios-vivo.test.mjs
// mutação: .claude/skills/mograph/ferramentas/ios-vivo.mjs · "html[id] = html[id].split(IOS.EMOJI_WEB).join(EMOJI_NA_PAGINA)" → "html[id] = html[id]" · pega
// mutação: .claude/skills/mograph/ferramentas/ios-vivo.mjs · "if (AJUDANTES.has(nome)) throw" → "if (false) throw" · pega
// mutação: .claude/skills/mograph/ferramentas/ios-vivo.mjs · "if (typeof v.construtor === 'string') return montar(v, onde);" → "if (false) return montar(v, onde);" · pega
// mutação: .claude/skills/mograph/ferramentas/ios-vivo.mjs · "return solta ?" → "return html; solta ?" · pega
// mutação: .claude/skills/mograph/ferramentas/ios-vivo.mjs · " && !classes.includes('ios');" → " && true;" · pega
// mutação: .claude/skills/mograph/ferramentas/montar-puro.mjs · "if (existsSync(join(pasta, 'fonte', 'ios.json'))) createRequire" → "if (false) createRequire" · pega
// mutação: .claude/skills/mograph/ferramentas/ios-vivo.mjs · "if (!KEBAB.test(id)) throw" → "if (false) throw" · pega
// mutação: .claude/skills/mograph/ferramentas/ios-vivo.mjs · "    html[id] = montar(entrada, id)" → "    mkdirSync(join(pasta, 'ativos'), { recursive: true }); writeFileSync(join(pasta, 'ativos', 'ios.js'), '// meio'); html[id] = montar(entrada, id)" · pega
// mutação: .claude/skills/mograph/ferramentas/ios-vivo.mjs · "    if (e instanceof ErroComLugar) throw e;" → "    if (false) throw e;" · pega
// mutação: .claude/skills/mograph/ferramentas/ios-vivo.mjs · "    throw new ErroComLugar(`${onde}: ${e.message}`);" → "    return '';" · pega
// mutação: .claude/skills/mograph/ferramentas/ios-vivo.mjs · "  if (!Object.hasOwn(IOS, nome) || typeof IOS[nome] !== 'function')" → "  if (typeof IOS[nome] !== 'function')" · pega
// mutação: .claude/skills/mograph/ferramentas/ios-vivo.mjs · "  if (Array.isArray(v)) return v.map((x, i) => dentro(x, `${onde}[${i}]`));" → "  if (Array.isArray(v)) return v.map((x, i) => dentro(x, `${onde}.args[${i}]`));" · pega
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';

const raiz = mkdtempSync(join(tmpdir(), 'ios-vivo-'));
// o material de emoji de mentira: o 🎉 (1f389) e nada mais. Vale para este processo e para os filhos
const EMOJIS = join(raiz, 'material', 'emoji');
mkdirSync(EMOJIS, { recursive: true });
writeFileSync(join(EMOJIS, '1f389.png'), 'png de mentira');
process.env.MOGRAPH_MATERIAL = join(raiz, 'material');

const { montarPuro } = await import('./montar-puro.mjs');
const AQUI = dirname(fileURLToPath(import.meta.url));
const FERRAMENTA = join(AQUI, 'ios-vivo.mjs');
const S = { ios: createRequire(import.meta.url)('./ios.cjs') };
const WEB_DO_NODE = S.ios.EMOJI_WEB;
const WEB_DA_PAGINA = 'ativos/emoji';

after(() => rmSync(raiz, { recursive: true, force: true }));
let n = 0;
// uma peça de mentira: a pasta com fonte/ios.json (objeto vira JSON, texto vai cru)
const peca = (ios, pagina) => {
  const pasta = join(raiz, `peca-${++n}`);
  mkdirSync(join(pasta, 'fonte'), { recursive: true });
  if (ios !== undefined) writeFileSync(join(pasta, 'fonte', 'ios.json'), typeof ios === 'string' ? ios : JSON.stringify(ios));
  if (pagina) writeFileSync(join(pasta, 'fonte', 'pagina.html'), pagina);
  return pasta;
};
const roda = (pasta) => spawnSync(process.execPath, [FERRAMENTA, pasta], { encoding: 'utf8' });
const saida = (pasta) => join(pasta, 'ativos', 'ios.js');
// a página de mentira: o window e o document que guarda o <style> que o ios.js põe no head
const pagina = (pasta) => {
  const window = {};
  const estilos = [];
  const document = { getElementById: (id) => estilos.find((s) => s.id === id) || null, createElement: () => ({}), head: { appendChild: (s) => estilos.push(s) } };
  const codigo = readFileSync(saida(pasta), 'utf8');
  runInNewContext(codigo, { window, document });
  runInNewContext(codigo, { window, document });
  return { window, estilos };
};
const le = (pasta) => pagina(pasta).window.IOS;
const SEM_ARQUIVO = (pasta) => assert.equal(existsSync(join(pasta, 'ativos')) ? readdirSync(join(pasta, 'ativos')).length : 0, 0, 'nada se grava');

const MAIL = { de: 'Marina', assunto: 'Proposta de segunda', previa: 'Segue o que combinamos', hora: '09:24' };

test('o mail do ios.json sai igual, byte a byte, ao S.ios.mail do Node', () => {
  const pasta = peca({ caixa: { construtor: 'mail', args: MAIL } });
  const r = roda(pasta);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(le(pasta).caixa, S.ios.mail(MAIL));
});

test('vários ids saem juntos, cada um do seu construtor', () => {
  const pasta = peca({ caixa: { construtor: 'mail', args: MAIL }, bolha: { construtor: 'bolha', args: { texto: 'oi', de: 'env' } } });
  assert.equal(roda(pasta).status, 0);
  const ios = le(pasta);
  assert.deepEqual(Object.keys(ios), ['caixa', 'bolha']);
  assert.equal(ios.bolha, `<div class="ios">${S.ios.bolha({ texto: 'oi', de: 'env' })}</div>`);
});

test('a peça solta sem a classe ios (a bolha, o digitando) ganha o invólucro .ios; a que já tem fica igual', () => {
  const pasta = peca({
    bolha: { construtor: 'bolha', args: { texto: 'oi' } },
    digitando: { construtor: 'digitando', args: {} },
    caixa: { construtor: 'mail', args: MAIL },
    secao: { construtor: 'secao', args: { texto: 'Hoje' } }
  });
  assert.equal(roda(pasta).status, 0);
  const ios = le(pasta);
  assert.equal(ios.bolha, `<div class="ios">${S.ios.bolha({ texto: 'oi' })}</div>`);
  assert.equal(ios.digitando, `<div class="ios">${S.ios.digitando({})}</div>`);
  assert.equal(ios.caixa, S.ios.mail(MAIL), 'o mail já vem com .ios e não ganha outro');
  assert.equal(ios.secao, S.ios.secao({ texto: 'Hoje' }));
  // a classe que só começa com "ios" (ios-bolha) não conta como a classe ios
  assert.doesNotMatch(S.ios.bolha({ texto: 'oi' }), /class="(?:[^"]*\s)?ios(?:\s|")/);
});

test('o widgets monta primeiro as peças de dentro que trazem construtor', () => {
  const pecas = [{ rotulo: 'Bateria', grande: '82%' }, { rotulo: 'Tempo', texto: 'sol' }];
  const pasta = peca({ painel: { construtor: 'widgets', args: { pecas: pecas.map((args) => ({ construtor: 'widget', args })) } } });
  const r = roda(pasta);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(le(pasta).painel, S.ios.widgets({ pecas: pecas.map((p) => S.ios.widget(p)) }));
});

test('o aninhado também se monta dentro de lista e de objeto, e o erro dele diz o id', () => {
  const pasta = peca({ painel: { construtor: 'widgets', args: { pecas: [{ construtor: 'widget', args: { grande: '1' } }, { construtor: 'widget', args: { rotulo: 'b' } }] } } });
  const r = roda(pasta);
  assert.equal(r.status, 1);
  // o caminho certo até o widget que falhou, sem o prefixo repetido
  assert.match(r.stderr, /^painel\.pecas\[0\]: ios\.widget\(\): falta "rotulo"$/m);
  SEM_ARQUIVO(pasta);
});

test('o emoji vai do material para ativos/emoji da peça, e o HTML aponta para lá', () => {
  const args = { para: 'Ana', assunto: 'oi', texto: 'fechado 🎉' };
  const pasta = peca({ novo: { construtor: 'mailNovo', args } });
  assert.equal(roda(pasta).status, 0);
  const html = le(pasta).novo;
  assert.ok(!html.includes(WEB_DO_NODE), 'sobrou o caminho do Node');
  assert.equal(html, S.ios.mailNovo(args).split(WEB_DO_NODE).join(WEB_DA_PAGINA));
  const srcs = [...html.matchAll(/<img src="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(srcs.length > 0, 'o emoji não saiu como imagem');
  for (const src of srcs) {
    assert.ok(src.startsWith(`${WEB_DA_PAGINA}/`), src);
    assert.ok(existsSync(join(pasta, src)), `não existe a partir da peça: ${src}`);
  }
});

test('o emoji que falta no material sai 1 dizendo o comando que o baixa, sem gravar', () => {
  const pasta = peca({ novo: { construtor: 'dica', args: { texto: 'pronto 🚀' } } });
  const r = roda(pasta);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /^novo: .*🚀.*emoji\.mjs --baixar 🚀/m);
  SEM_ARQUIVO(pasta);
});

test('o S.ios.emoji direto também sai reescrito', () => {
  const pasta = peca({ e: { construtor: 'emoji', args: '🎉' } });
  assert.equal(roda(pasta).status, 0);
  assert.equal(le(pasta).e, S.ios.emoji('🎉').split(WEB_DO_NODE).join(WEB_DA_PAGINA));
});

test('construtor que não existe sai 1 com o id, o nome e os que existem, sem gravar', () => {
  const pasta = peca({ caixa: { construtor: 'maile', args: MAIL } });
  const r = roda(pasta);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /caixa/);
  assert.match(r.stderr, /maile/);
  assert.match(r.stderr, /mail\b.*widgets|widgets\b.*mail\b/s);
  SEM_ARQUIVO(pasta);
});

for (const ajudante of ['naFaixa', 'nomeNoAcervo', 'nomesDoArquivo']) {
  test(`o ajudante ${ajudante} não é construtor: sai 1 sem gravar`, () => {
    const pasta = peca({ 'ajudante-x': { construtor: ajudante, args: {} } });
    const r = roda(pasta);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /^ajudante-x: /m);
    assert.match(r.stderr, new RegExp(ajudante));
    assert.match(r.stderr, /construtores que existem: [^\n]*\bmail\b[^\n]*\bwidgets\b/);
    assert.ok(!new RegExp(`construtores[^\\n]*\\b${ajudante}\\b`).test(r.stderr), 'o ajudante entrou na lista dos construtores');
    SEM_ARQUIVO(pasta);
  });
}

test('o que não é função do ios.js (a constante) também não é construtor', () => {
  const pasta = peca({ x: { construtor: 'EMOJI_WEB', args: {} } });
  const r = roda(pasta);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /^x: /m);
  assert.match(r.stderr, /EMOJI_WEB/);
  SEM_ARQUIVO(pasta);
});

for (const herdado of ['constructor', 'hasOwnProperty', 'toString']) {
  test(`o ${herdado}, que todo objeto herda, não é construtor do ios.js`, () => {
    const pasta = peca({ x: { construtor: herdado, args: {} } });
    const r = roda(pasta);
    assert.equal(r.status, 1);
    assert.match(r.stderr, new RegExp(`^x: o construtor "${herdado}" não existe no ios\\.js`, 'm'));
    SEM_ARQUIVO(pasta);
  });
}

test('o argumento que o construtor recusa sai 1 com o id e a mensagem dele, sem gravar', () => {
  const pasta = peca({ ok: { construtor: 'bolha', args: { texto: 'oi' } }, caixa: { construtor: 'mail', args: { de: 'Marina' } } });
  const r = roda(pasta);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /caixa/);
  assert.match(r.stderr, /ios\.mail\(\): falta "assunto"/);
  SEM_ARQUIVO(pasta);
});

test('o erro não apaga nem troca o ios.js que já existia', () => {
  const pasta = peca({ caixa: { construtor: 'mail', args: { de: 'Marina' } } });
  mkdirSync(join(pasta, 'ativos'));
  writeFileSync(saida(pasta), '// velho\n');
  assert.equal(roda(pasta).status, 1);
  assert.equal(readFileSync(saida(pasta), 'utf8'), '// velho\n');
  assert.deepEqual(readdirSync(join(pasta, 'ativos')), ['ios.js'], 'sobrou temporário');
});

test('ios.json que não é JSON sai 1 dizendo onde', () => {
  const pasta = peca('{ "caixa": ');
  const r = roda(pasta);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /ios\.json/);
  SEM_ARQUIVO(pasta);
});

test('id fora do kebab sai 1 com o id', () => {
  for (const id of ['Caixa', 'caixa_de_entrada', '-caixa', 'caixa-', 'caixa--um', 'caixa 1']) {
    const pasta = peca({ [id]: { construtor: 'mail', args: MAIL } });
    const r = roda(pasta);
    assert.equal(r.status, 1, id);
    assert.ok(r.stderr.includes(id), `a mensagem não diz o id "${id}": ${r.stderr}`);
    SEM_ARQUIVO(pasta);
  }
  const bom = peca({ 'caixa-de-entrada-2': { construtor: 'mail', args: MAIL } });
  assert.equal(roda(bom).status, 0);
});

test('entrada sem construtor, ou o ios.json que não é objeto, sai 1', () => {
  for (const ios of [{ 'sem-construtor': { args: MAIL } }, { 'sem-construtor': 'mail' }, []]) {
    const pasta = peca(ios);
    const r = roda(pasta);
    assert.equal(r.status, 1, JSON.stringify(ios));
    assert.match(r.stderr, Array.isArray(ios) ? /ios\.json/ : /sem-construtor/);
    SEM_ARQUIVO(pasta);
  }
});

test('sem fonte/ios.json a ferramenta sai 1 e não grava', () => {
  const pasta = peca(undefined);
  const r = roda(pasta);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /ios\.json/);
  SEM_ARQUIVO(pasta);
});

test('o ios.js leva o estilo das classes .ios-* uma vez só, mesmo carregado duas vezes', () => {
  const pasta = peca({ caixa: { construtor: 'mail', args: MAIL } });
  assert.equal(roda(pasta).status, 0);
  const { estilos } = pagina(pasta);
  assert.equal(estilos.length, 1, 'um <style> só');
  assert.equal(estilos[0].id, 'ios-css');
  assert.equal(estilos[0].textContent, readFileSync(join(dirname(FERRAMENTA), 'ios.css'), 'utf8'));
  assert.match(estilos[0].textContent, /\.ios-bolha\{/);
});

test('a primeira linha do ios.js diz que é gerado e não se edita à mão', () => {
  const pasta = peca({ caixa: { construtor: 'mail', args: MAIL } });
  assert.equal(roda(pasta).status, 0);
  const primeira = readFileSync(saida(pasta), 'utf8').split('\n')[0];
  assert.ok(primeira.startsWith('//'), primeira);
  assert.match(primeira, /gerado/);
  assert.match(primeira, /ios-vivo\.mjs/);
  assert.match(primeira, /fonte\/ios\.json/);
  assert.match(primeira, /não se edita à mão/);
});

test('rodar de novo dá o mesmo arquivo (determinístico) e não deixa temporário', () => {
  const pasta = peca({ caixa: { construtor: 'mail', args: MAIL } });
  roda(pasta);
  const um = readFileSync(saida(pasta), 'utf8');
  roda(pasta);
  assert.equal(readFileSync(saida(pasta), 'utf8'), um);
  assert.deepEqual(readdirSync(join(pasta, 'ativos')), ['ios.js']);
});

const PAGINA = '<html><body><script src="ativos/ios.js"></script></body></html>';
const embutido = (pasta) => readFileSync(join(pasta, 'index.html'), 'utf8');

test('o montar-puro gera o ios.js de novo antes de embutir: o index.html leva o ios.json de agora', () => {
  const pasta = peca({ caixa: { construtor: 'mail', args: MAIL } }, PAGINA);
  montarPuro(pasta);
  assert.ok(embutido(pasta).includes('window.IOS'));
  assert.ok(embutido(pasta).includes('Proposta de segunda'));
  // o ios.json muda, o ios.js velho fica no disco: a montagem não pode levar o velho
  writeFileSync(join(pasta, 'fonte', 'ios.json'), JSON.stringify({ caixa: { construtor: 'mail', args: { ...MAIL, assunto: 'Assunto novo' } } }));
  montarPuro(pasta);
  assert.ok(embutido(pasta).includes('Assunto novo'));
  assert.ok(!embutido(pasta).includes('Proposta de segunda'), 'levou a saída velha');
  assert.ok(readFileSync(saida(pasta), 'utf8').includes('Assunto novo'));
});

test('o montar-puro com ios.json quebrado falha e não embute a saída velha', () => {
  const pasta = peca({ caixa: { construtor: 'mail', args: MAIL } }, PAGINA);
  montarPuro(pasta);
  rmSync(join(pasta, 'index.html'));
  writeFileSync(join(pasta, 'fonte', 'ios.json'), JSON.stringify({ caixa: { construtor: 'mail', args: { de: 'x' } } }));
  assert.throws(() => montarPuro(pasta), /caixa/);
  assert.ok(!existsSync(join(pasta, 'index.html')));
});

test('sem fonte/ios.json o montar-puro monta como sempre, com o ios.js que a peça tem', () => {
  const pasta = peca(undefined, PAGINA);
  mkdirSync(join(pasta, 'ativos'));
  writeFileSync(saida(pasta), 'window.IOS = { "a": "feito à mão" };\n');
  montarPuro(pasta);
  assert.ok(embutido(pasta).includes('feito à mão'));
  assert.equal(readFileSync(saida(pasta), 'utf8'), 'window.IOS = { "a": "feito à mão" };\n', 'sem ios.json o arquivo não se toca');
});
