#!/usr/bin/env node
// Prova do instalador das peças de terceiro.
//
// Parte 1, sem internet: um manifesto de mentira servido por um servidor local
// prova a repetição da rede (falha que passa, falha que fica, 404), a recusa
// de impressão errada e de caminho que sai do destino, a idempotência, o
// `--conferir` acusando arquivo faltando e divergente, o `--listar` e que nada
// se grava fora do destino. O leitor de .tgz se prova com um pacote montado aqui.
//
// Parte 2, com internet (pula com --sem-rede): instala o manifesto de verdade
// numa pasta temporária, confere tudo pelo `--conferir`, estraga um arquivo e
// apaga outro e vê o `--conferir` acusar e a reinstalação consertar. Com
// `--antes <pasta>` (uma cópia do workspace de quando as peças moravam no git),
// compara byte a byte cada arquivo instalado com o de lá, e cada diferença
// conhecida é provada pelo que ela é (a lista DIFERENCAS, abaixo).
//
// Uso:  node scripts/terceiros/teste-instalar.mjs [--sem-rede] [--antes <pasta>]
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, relative, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { AQUI, RAIZ, lerManifesto, contratoDe, exigirPeca } from './peca.mjs';
import { lerTar } from './instalar.mjs';

const INSTALADOR = join(AQUI, 'instalar.mjs');
const argv = process.argv.slice(2);
const SEM_REDE = argv.includes('--sem-rede');
const ANTES = argv.includes('--antes') ? argv[argv.indexOf('--antes') + 1] : null;
// a pasta que mudou de nome desde o antes: o antes a tem com o nome velho
const RENOMEADAS = [['design-de-produto', 'design-nizam']];

let passou = 0;
let falhou = 0;
function afirma(nome, condicao, detalhe = '') {
  if (condicao) { passou++; console.log(`  ok    ${nome}`); } else { falhou++; console.log(`  FALHOU ${nome}${detalhe ? ` · ${String(detalhe).slice(0, 600)}` : ''}`); }
}

const pastas = [];
const temporaria = (prefixo) => { const p = mkdtempSync(join(tmpdir(), prefixo)); pastas.push(p); return p; };

/** Roda o instalador num processo à parte, sem travar o servidor local deste. */
function instalador(args, env = {}) {
  return new Promise((ok) => {
    const filho = spawn(process.execPath, [INSTALADOR, ...args], { env: { ...process.env, TERCEIROS_ESPERAS_MS: '20,20,20', ...env } });
    let saida = '';
    filho.stdout.on('data', (d) => { saida += d; });
    filho.stderr.on('data', (d) => { saida += d; });
    filho.on('close', (codigo) => ok({ codigo, saida }));
  });
}

function git(args, entrada = '') {
  return new Promise((ok) => {
    const filho = spawn('git', ['-C', RAIZ, ...args]);
    let saida = '';
    filho.stdout.on('data', (d) => { saida += d; });
    filho.on('error', () => ok({ codigo: 127, saida: '' }));
    filho.on('close', (codigo) => ok({ codigo, saida: saida.replace(/\r/g, '') }));
    filho.stdin.end(entrada);
  });
}

function arquivosEm(pasta) {
  const lista = [];
  const andar = (p) => { for (const e of readdirSync(p, { withFileTypes: true })) { const c = join(p, e.name); if (e.isDirectory()) andar(c); else lista.push(relative(pasta, c).split(sep).join('/')); } };
  if (existsSync(pasta)) andar(pasta);
  return lista.sort();
}

/** Um .tgz mínimo, como o do npm: a pasta `package/`, e um nome longo pelo cabeçalho pax. */
function tgz(arquivos) {
  const blocos = [];
  const cabecalho = (nome, tamanho, tipo) => {
    const h = Buffer.alloc(512);
    h.write(nome.slice(0, 99), 0);
    h.write('0000644\0', 100); h.write('0000000\0', 108); h.write('0000000\0', 116);
    h.write(`${tamanho.toString(8).padStart(11, '0')}\0`, 124);
    h.write('00000000000\0', 136);
    h.write(tipo, 156);
    h.write('ustar\0', 257); h.write('00', 263);
    return h;
  };
  const corpo = (buf) => Buffer.concat([buf, Buffer.alloc((512 - (buf.length % 512)) % 512)]);
  for (const [nome, texto] of Object.entries(arquivos)) {
    const buf = Buffer.from(texto);
    if (nome.length > 99) {
      // o registro pax diz o próprio tamanho, contando os dígitos dele
      const reg = ` path=${nome}\n`;
      let tam = Buffer.byteLength(reg) + 1;
      while (String(tam).length + Buffer.byteLength(reg) !== tam) tam++;
      const pax = Buffer.from(`${tam}${reg}`);
      blocos.push(cabecalho('PaxHeader', pax.length, 'x'), corpo(pax));
    }
    blocos.push(cabecalho(nome, buf.length, '0'), corpo(buf));
  }
  blocos.push(Buffer.alloc(1024));
  return gzipSync(Buffer.concat(blocos));
}

// ── parte 1 · sem internet ────────────────────────────────────────────────

console.log('o leitor de .tgz');
{
  const longo = `package/${'pasta-de-nome-comprido/'.repeat(5)}arquivo.md`;
  const conteudo = lerTar(tgz({ 'package/LICENSE': 'texto da licença\n', 'package/dist/a.js': 'a()', [longo]: 'longo' }));
  afirma('tira a pasta package/ do caminho', conteudo.get('LICENSE')?.toString() === 'texto da licença\n' && conteudo.get('dist/a.js')?.toString() === 'a()', [...conteudo.keys()].join(', '));
  afirma('o nome longo do cabeçalho pax chega inteiro', conteudo.get(longo.slice('package/'.length))?.toString() === 'longo', [...conteudo.keys()].join(', '));
}

// o servidor de mentira: cada caminho tem um roteiro de respostas
const roteiro = new Map();
const pedidos = [];
const servidor = createServer((req, res) => {
  pedidos.push(req.url);
  const fila = roteiro.get(req.url);
  const resposta = fila?.length > 1 ? fila.shift() : fila?.[0];
  if (!resposta) { res.writeHead(404); res.end('não há'); return; }
  res.writeHead(resposta.status ?? 200); res.end(resposta.corpo ?? '');
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
const BASE = `http://127.0.0.1:${servidor.address().port}/`;

const raizFalsa = temporaria('terceiros-raiz-');
const pastaManifesto = temporaria('terceiros-manifesto-');
const M = join(pastaManifesto, 'manifesto.json');
const plugin = { $schema: 'https://exemplo/schema.json', name: 'teste', displayName: 'Teste', version: '9.9.9', author: { name: 'Autor', email: 'a@exemplo', url: 'https://exemplo' }, homepage: 'https://exemplo/home', license: 'X' };
const ARQUIVOS = {
  '/texto.txt': 'cabeça\ncopyright: o trecho\nfica até aqui\nlicenseURL: fora\n',
  '/registro.json': JSON.stringify({ files: [{ content: 'import { cn } from "cn"\nclasse cn-font-heading\n' }] }),
  '/plugin.json': JSON.stringify(plugin),
};
const manifestoFalso = (extra = {}) => ({
  python: { fonttools: '0', brotli: '0' },
  pecas: [{
    id: 'peca-teste', descricao: 'uma peça de mentira', destino: 'pasta/da-peca', inteira: true,
    fontes: { local: { url: BASE } },
    arquivos: [
      { para: 'trecho.txt', de: 'texto.txt', trecho: ['copyright:', 'licenseURL:'] },
      { para: 'sub/componente.tsx', de: 'registro.json', json: 'files.0.content', trocas: [['cn-font-heading', 'font-heading']] },
      { para: 'plugin.json', molde: 'remotion/plugin.json', dados: 'plugin.json' },
    ],
    ...extra,
  }],
});
const servir = () => { for (const [url, corpo] of Object.entries(ARQUIVOS)) roteiro.set(url, [{ corpo }]); };
const gravarManifesto = (m) => writeFileSync(M, JSON.stringify(m, null, 2));

console.log('as impressões e a instalação');
{
  servir();
  gravarManifesto(manifestoFalso());
  const imp = await instalador(['--manifesto', M, '--impressoes']);
  const m = JSON.parse(readFileSync(M, 'utf8'));
  afirma('--impressoes grava a impressão de cada arquivo e não grava destino', imp.codigo === 0 && m.pecas[0].arquivos.every((a) => /^[0-9a-f]{64}$/.test(a.sha256)) && arquivosEm(raizFalsa).length === 0, imp.saida);
  const r = await instalador(['--manifesto', M, '--em', raizFalsa]);
  const da = (p) => readFileSync(join(raizFalsa, 'pasta/da-peca', p), 'utf8');
  afirma('instala e sai 0', r.codigo === 0 && /✓ peca-teste: 3 arquivo/.test(r.saida), r.saida);
  afirma('o trecho vai do início ao fim pedido', da('trecho.txt') === 'copyright: o trecho\nfica até aqui\n', da('trecho.txt'));
  afirma('o campo do JSON sai e a troca se aplica', da('sub/componente.tsx') === 'import { cn } from "cn"\nclasse font-heading\n');
  const pj = da('plugin.json');
  afirma('o molde se preenche com os campos da fonte', pj.includes('"version": "9.9.9"') && pj.includes('"email": "a@exemplo"') && !pj.includes('{{'), pj);
  afirma('nada se grava fora do destino', arquivosEm(raizFalsa).every((p) => p.startsWith('pasta/da-peca/')), arquivosEm(raizFalsa).join(', '));
  pedidos.length = 0;
  const de2 = await instalador(['--manifesto', M, '--em', raizFalsa]);
  afirma('instalar de novo não baixa nada (idempotente)', de2.codigo === 0 && /já instalada/.test(de2.saida) && pedidos.length === 0, `${pedidos.length} pedido(s)\n${de2.saida}`);
}

console.log('o --conferir');
{
  const c0 = await instalador(['--manifesto', M, '--em', raizFalsa, '--conferir']);
  afirma('com tudo no lugar, sai 0', c0.codigo === 0 && /✓ peca-teste/.test(c0.saida), c0.saida);
  rmSync(join(raizFalsa, 'pasta/da-peca/trecho.txt'));
  writeFileSync(join(raizFalsa, 'pasta/da-peca/sub/componente.tsx'), 'editado à mão\n');
  pedidos.length = 0;
  const c1 = await instalador(['--manifesto', M, '--em', raizFalsa, '--conferir']);
  afirma('acusa o arquivo que falta', c1.codigo === 1 && /falta\s+trecho\.txt/.test(c1.saida), c1.saida);
  afirma('acusa o arquivo que diverge', /diverge\s+sub\/componente\.tsx/.test(c1.saida), c1.saida);
  afirma('e não baixa nada', pedidos.length === 0, pedidos.join(', '));
  afirma('e diz o comando que conserta', /node scripts\/terceiros\/instalar\.mjs/.test(c1.saida), c1.saida);
  const conserto = await instalador(['--manifesto', M, '--em', raizFalsa]);
  const c2 = await instalador(['--manifesto', M, '--em', raizFalsa, '--conferir']);
  afirma('a reinstalação devolve só os dois, e o --conferir volta a 0', /2 arquivo/.test(conserto.saida) && c2.codigo === 0, conserto.saida + c2.saida);
}

console.log('a rede');
{
  const raiz = temporaria('terceiros-rede-');
  servir();
  roteiro.set('/texto.txt', [{ status: 503 }, { status: 503 }, { corpo: ARQUIVOS['/texto.txt'] }]);
  pedidos.length = 0;
  const r = await instalador(['--manifesto', M, '--em', raiz]);
  afirma('falha passageira repete com intervalo e instala', r.codigo === 0 && pedidos.filter((p) => p === '/texto.txt').length === 3 && /tento de novo/.test(r.saida), r.saida);

  const raiz2 = temporaria('terceiros-rede-');
  roteiro.set('/texto.txt', [{ status: 503 }]);
  pedidos.length = 0;
  const f = await instalador(['--manifesto', M, '--em', raiz2]);
  afirma('falha que fica: para depois de 4 tentativas', f.codigo === 1 && pedidos.filter((p) => p === '/texto.txt').length === 4, f.saida);
  afirma('e diz o que fazer, com a peça', /O que fazer: .*--so peca-teste/.test(f.saida), f.saida);
  afirma('e não grava meia peça', arquivosEm(raiz2).length === 0, arquivosEm(raiz2).join(', '));

  roteiro.set('/texto.txt', []);
  pedidos.length = 0;
  const n = await instalador(['--manifesto', M, '--em', temporaria('terceiros-rede-')]);
  afirma('404 não repete e diz que a versão sumiu', n.codigo === 1 && pedidos.filter((p) => p === '/texto.txt').length === 1 && /404/.test(n.saida), n.saida);
}

console.log('as recusas');
{
  servir();
  const m = JSON.parse(readFileSync(M, 'utf8'));
  m.pecas[0].arquivos[0].sha256 = '0'.repeat(64);
  gravarManifesto(m);
  const raiz = temporaria('terceiros-recusa-');
  const r = await instalador(['--manifesto', M, '--em', raiz]);
  afirma('arquivo com a impressão errada não se grava, nem o resto da peça', r.codigo === 1 && /não é o arquivo esperado/.test(r.saida) && arquivosEm(raiz).length === 0, r.saida);

  for (const [nome, troca] of [
    ['arquivo que sai do destino', (x) => { x.pecas[0].arquivos[0].para = '../fora.txt'; }],
    ['destino que sai da raiz', (x) => { x.pecas[0].destino = '../fora'; }],
    ['caminho absoluto', (x) => { x.pecas[0].arquivos[0].para = 'C:/Windows/x.txt'; }],
    ['peça dentro de outra', (x) => { x.pecas.push({ ...x.pecas[0], id: 'outra', destino: 'pasta/da-peca/dentro' }); }],
  ]) {
    const x = manifestoFalso();
    troca(x);
    gravarManifesto(x);
    const raizR = temporaria('terceiros-recusa-');
    const s = await instalador(['--manifesto', M, '--em', raizR]);
    afirma(`recusa ${nome} antes de gravar qualquer coisa`, s.codigo !== 0 && /manifesto inválido/.test(s.saida) && arquivosEm(raizR).length === 0, s.saida);
  }
  const op = await instalador(['--manifesto', M, '--peca', 'x']);
  afirma('opção desconhecida sai 2 e diz qual', op.codigo === 2 && /--peca/.test(op.saida), op.saida);
}

console.log('o --listar e o exigirPeca');
{
  const l = await instalador(['--listar']);
  const m = lerManifesto();
  afirma('o --listar mostra cada peça, o destino e a fonte', l.codigo === 0 && m.pecas.every((p) => l.saida.includes(`${p.id} · `) && l.saida.includes(`para ${p.destino}/`)) && /de npm gsap@3\.14\.2/.test(l.saida), l.saida);
  afirma('o --listar avisa do link que a pessoa cria', /link em ~\/\.claude\/skills\/remotion/.test(l.saida), l.saida);
  let erro = '';
  try { exigirPeca('gsap-biblioteca', { raiz: temporaria('terceiros-vazia-') }); } catch (e) { erro = e.message; }
  afirma('a peça que falta para quem depende dela com o comando que instala', /rode `node scripts\/terceiros\/instalar\.mjs`/i.test(erro) && /--so gsap-biblioteca/.test(erro), erro);
  const contrato = contratoDe(RAIZ);
  afirma('o contrato lê o manifesto: pastas inteiras e cada arquivo', contrato.pastas.includes('.claude/skills/remotion') && contrato.arquivos.has('.claude/skills/gsap/referencias/gsap-core.md') && !contrato.pastas.includes('.claude/skills/ios-core-design/assets'));
}

console.log('o git');
if ((await git(['rev-parse', '--git-dir'])).codigo !== 0) {
  console.log('  (fora de um repositório git: pulado)');
} else {
  // o .gitignore da raiz cobre cada arquivo instalado, e nenhum molde
  const todos = lerManifesto().pecas.flatMap((p) => p.arquivos.map((a) => `${p.destino}/${a.para}`));
  const ignorados = await git(['check-ignore', '--no-index', '--stdin'], todos.join('\n'));
  const fora = todos.filter((c) => !ignorados.saida.split('\n').includes(c));
  afirma('o .gitignore ignora cada arquivo que o instalador grava', fora.length === 0, fora.slice(0, 5).join(', '));
  const moldes = arquivosEm(join(AQUI, 'moldes')).map((p) => `scripts/terceiros/moldes/${p}`);
  const moldeIgnorado = await git(['check-ignore', '--no-index', '--stdin'], moldes.join('\n'));
  afirma('e nenhum molde', moldes.length > 0 && moldeIgnorado.saida.trim() === '', moldeIgnorado.saida);
  const rastreados = await git(['ls-files', '--', ...lerManifesto().pecas.map((p) => p.destino)]);
  const instaladosRastreados = rastreados.saida.split('\n').filter((c) => todos.includes(c));
  afirma('nada instalado está no índice do git', rastreados.codigo !== 0 || instaladosRastreados.length === 0, instaladosRastreados.slice(0, 5).join(', '));
}

servidor.close();

// ── parte 2 · com internet ────────────────────────────────────────────────

// O que muda de propósito entre o antes e a instalação, e a prova de cada um.
const linhas = (t) => t.split('\n');
const DIFERENCAS = {
  // os arquivos de organização saem do molde, reescritos sem relato de origem
  '.claude/skills/gsap/SKILL.md': { porque: 'roteador reescrito do molde', prova: (_, novo, a) => novo.equals(readFileSync(join(AQUI, 'moldes', a.molde))) },
  '.claude/skills/remotion/CATALOGO.md': { porque: 'mapa reescrito do molde', prova: (_, novo, a) => novo.equals(readFileSync(join(AQUI, 'moldes', a.molde))) },
  '.claude/skills/remotion/README.md': { porque: 'README reescrito do molde, com a versão da fonte', prova: (_, novo) => novo.toString().includes('Versão **4.0.516**') },
  '.claude/skills/design-de-produto/assets/vendor/LEIA-ME.md': { porque: 'LEIA-ME reescrito do molde', prova: (_, novo, a) => novo.equals(readFileSync(join(AQUI, 'moldes', a.molde))) },
  // o antes tinha a licença com um cabeçalho escrito à mão; agora vem só o texto da fonte
  '.claude/skills/guardanapo/fontes/OFL.txt': { porque: 'só o texto da fonte, sem as 8 linhas de cabeçalho escritas à mão', prova: (antes, novo) => linhas(antes.toString()).slice(8).join('\n') === novo.toString() },
  '.claude/skills/ios-core-design/assets/LICENSE-phosphor.txt': { porque: 'o LICENSE do pacote como ele vem (fim de linha CRLF), sem as 3 linhas escritas à mão', prova: (antes, novo) => linhas(antes.toString()).slice(3).join('\n') === novo.toString().replace(/\r\n/g, '\n') },
  '.claude/skills/ios-core-design/assets/phosphor-sprite.svg': {
    porque: 'o comentário do topo reescrito; os 20 símbolos, byte a byte',
    prova: (antes, novo) => { const corte = (b) => b.toString().slice(b.toString().indexOf('<svg style="display:none" aria-hidden="true"><defs>\n<symbol')); return corte(antes) === corte(novo) && corte(novo).length > 6000; },
  },
  // o antes estava corrompido: uma troca automática de arroba apagou o nome de duas variantes do Tailwind e uma tag do comentário do Lucide
  '.claude/skills/design-de-produto/assets/vendor/tailwind-browser.js': { porque: 'o antes tinha "@max" e "@min" trocados por "@usuario" (as variantes @max-* e @min-* quebradas); vem o arquivo da fonte', prova: (antes, novo) => novo.toString().replaceAll('"@max"', '"@usuario"').replaceAll('"@min"', '"@usuario"') === antes.toString() },
  '.claude/skills/design-de-produto/assets/vendor/lucide.min.js': { porque: 'o antes tinha "@license" trocado por "@usuario" no comentário do topo; vem o arquivo da fonte', prova: (antes, novo) => novo.toString().replace('@license lucide', '@usuario lucide') === antes.toString() },
  // a versão fixada traz a frase que a própria regra dela traz
  '.claude/skills/react-best-practices/AGENTS.md': {
    porque: 'uma frase difere: a da versão fixada, igual à de rules/advanced-effect-event-deps.md',
    prova: (antes, novo, _, raiz) => {
      const a = linhas(antes.toString()); const n = linhas(novo.toString());
      const dif = n.map((l, i) => (l !== a[i] ? l : null)).filter((l) => l !== null);
      return a.length === n.length && dif.length === 1 && readFileSync(join(raiz, '.claude/skills/react-best-practices/rules/advanced-effect-event-deps.md'), 'utf8').includes(dif[0]);
    },
  },
};
// o que o antes tinha e a fonte não traz
const SAEM = { '.claude/skills/react-best-practices/LICENSE': 'texto escrito à mão (a fonte não publica arquivo de licença; o README dela declara a licença)' };

if (SEM_REDE) {
  console.log('\nparte 2 · pulada (--sem-rede)');
} else {
  console.log('\nparte 2 · o manifesto de verdade, numa pasta temporária');
  const raiz = temporaria('terceiros-real-');
  const r = await instalador(['--em', raiz], { TERCEIROS_ESPERAS_MS: '2000,5000,10000' });
  afirma('instala todas as peças e sai 0', r.codigo === 0, r.saida);
  const m = lerManifesto();
  const c = await instalador(['--em', raiz, '--conferir']);
  afirma('o --conferir confere cada impressão e sai 0', c.codigo === 0 && m.pecas.every((p) => c.saida.includes(`✓ ${p.id}`)), c.saida);
  const esperados = new Set(m.pecas.flatMap((p) => p.arquivos.map((a) => `${p.destino}/${a.para}`)));
  afirma('nada se grava fora dos arquivos do manifesto', arquivosEm(raiz).every((p) => esperados.has(p)) && arquivosEm(raiz).length === esperados.size, arquivosEm(raiz).filter((p) => !esperados.has(p)).join(', '));

  if (ANTES) {
    console.log(`\no byte a byte contra ${ANTES}`);
    const antesDe = (p) => RENOMEADAS.reduce((c, [novo, velho]) => c.replace(`/${novo}/`, `/${velho}/`), p);
    let iguais = 0;
    const naoExplicados = [];
    for (const p of m.pecas) {
      for (const a of p.arquivos) {
        const caminho = `${p.destino}/${a.para}`;
        const velho = join(ANTES, antesDe(caminho));
        const novo = readFileSync(join(raiz, caminho));
        if (!existsSync(velho)) { naoExplicados.push(`${caminho}: não existe no antes`); continue; }
        const antes = readFileSync(velho);
        if (antes.equals(novo)) { iguais++; continue; }
        const d = DIFERENCAS[caminho];
        if (!d) { naoExplicados.push(`${caminho}: difere sem explicação`); continue; }
        afirma(`${caminho} · ${d.porque}`, d.prova(antes, novo, a, raiz));
      }
    }
    afirma(`os outros ${iguais} arquivos são byte a byte os do antes`, naoExplicados.length === 0 && iguais === esperados.size - Object.keys(DIFERENCAS).length, naoExplicados.join('\n'));
    // cada arquivo do antes, nas pastas que agora se instalam inteiras, ou volta ou está em SAEM
    const sobra = [];
    for (const p of m.pecas.filter((x) => x.inteira)) {
      for (const f of arquivosEm(join(ANTES, antesDe(p.destino)))) if (!esperados.has(`${p.destino}/${f}`) && !SAEM[`${p.destino}/${f}`]) sobra.push(`${p.destino}/${f}`);
    }
    afirma('todo arquivo do antes volta, menos os listados em SAEM', sobra.length === 0, sobra.join(', '));
    for (const [c, porque] of Object.entries(SAEM)) console.log(`        sai: ${c} · ${porque}`);
  } else {
    console.log('\n  (sem --antes: o byte a byte contra o antes não roda)');
  }

  console.log('\no --conferir sobre a instalação de verdade');
  rmSync(join(raiz, '.claude/video/html/_vendor/gsap.min.js'));
  writeFileSync(join(raiz, '.claude/skills/guardanapo/fontes/excalifont-latin.woff2'), 'não é fonte');
  const c1 = await instalador(['--em', raiz, '--conferir']);
  afirma('acusa o arquivo apagado e o estragado, cada um na peça dele', c1.codigo === 1 && /✗ gsap-biblioteca[\s\S]*falta\s+gsap\.min\.js/.test(c1.saida) && /✗ guardanapo-fontes[\s\S]*diverge\s+excalifont-latin\.woff2/.test(c1.saida), c1.saida);
  const de2 = await instalador(['--em', raiz]);
  const c2 = await instalador(['--em', raiz, '--conferir']);
  afirma('a reinstalação devolve os dois e deixa o resto como estava', de2.codigo === 0 && c2.codigo === 0 && (de2.saida.match(/já instalada/g) ?? []).length === m.pecas.length - 2, de2.saida);
}

for (const p of pastas) rmSync(p, { recursive: true, force: true });
console.log(`\n# tests ${passou + falhou}\n# pass ${passou}\n# fail ${falhou}`);
if (falhou) process.exit(1);
