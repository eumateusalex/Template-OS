#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// teste-x · prova que o conferidor e o montador do estilo X reprovam o que
// prometem reprovar, e que a peça boa sai inteira
//
// Precisa do Chromium (render/instalar.md) e da rede para o Google Fonts (a
// Inter e a fonte de emoji do modelo). Cada caso monta uma peça num projeto
// de mentira, numa pasta temporária, a partir do modelo de verdade.
//
// Uso:  node --test render/teste-x.mjs     (ou `npm run testar` dentro de render/)
// ═══════════════════════════════════════════════════════════════════════════

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { deflateSync } from 'node:zlib';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SKILL = join(AQUI, '..');
const MODELO = join(SKILL, 'x', 'modelo.html');
const MONTAR = join(AQUI, 'montar-x.mjs');
const require = createRequire(import.meta.url);

// ─── ambiente ──────────────────────────────────────────────────────────────

const checar = spawnSync(process.execPath, [join(AQUI, 'render-carrossel.js'), '--checar'], { encoding: 'utf8' });
const SEM_CHROMIUM = checar.status === 2;

// ─── as peças de mentira ───────────────────────────────────────────────────

let RAIZ;
before(() => {
  RAIZ = mkdtempSync(join(tmpdir(), 'teste-x-'));
  mkdirSync(join(RAIZ, '.claude'));
  mkdirSync(join(RAIZ, 'carrosseis'));
});
after(() => { if (RAIZ) rmSync(RAIZ, { recursive: true, force: true }); });

/** PNG de uma cor só, sem dependência: o cabeçalho, um IDAT e o fim. */
function pngSolido(w, h, [r, g, b]) {
  const crcTab = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => { let c = 0xffffffff; for (const x of buf) c = crcTab[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const bloco = (tipo, dados) => {
    const t = Buffer.from(tipo, 'ascii');
    const len = Buffer.alloc(4); len.writeUInt32BE(dados.length);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(Buffer.concat([t, dados])));
    return Buffer.concat([len, t, dados, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const linha = Buffer.alloc(1 + w * 3);
  for (let x = 0; x < w; x++) { linha[1 + x * 3] = r; linha[2 + x * 3] = g; linha[3 + x * 3] = b; }
  const cru = Buffer.concat(Array.from({ length: h }, () => linha));
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco('IHDR', ihdr), bloco('IDAT', deflateSync(cru)), bloco('IEND', Buffer.alloc(0))]);
}

const head = () => readFileSync(MODELO, 'utf8').split('</head>')[0];

/** O slide como o gerar.js o escreve. */
function slide({ nome = 'Ana Exemplo', handle = '@ana.exemplo', avatar, blocos, media = '' }) {
  return `<section class="slide">
  <div class="tw-head">
    <div class="tw-avatar" style="background-image:url('${avatar}')"></div>
    <div class="tw-nome"><b class="sem-selo">${nome}<span class="selo"></span></b><span>${handle}</span></div>
  </div>
  <div class="tw-body">${blocos.map((b) => `<p>${b}</p>`).join('')}</div>${media}
</section>`;
}

const LEGENDA = [
  'você responde o cliente no dia seguinte e acha que está tudo bem.',
  'quem pergunta à noite fecha com quem respondeu primeiro, e isso tem conta.',
  'separe dez minutos amanhã cedo para olhar as conversas sem resposta da semana.',
].join('\n');

let n = 0;
/**
 * Cria a pasta de uma peça. `slides` recebe o caminho web da pasta e devolve a
 * lista de slides; `cabeca` troca o <head> (para o CSS defasado).
 */
function peca({ slides, cabeca = head(), legenda = LEGENDA, gerar = true, imagens = {} }) {
  const nome = `peca-${++n}`;
  const pasta = join(RAIZ, 'carrosseis', nome);
  mkdirSync(pasta, { recursive: true });
  const web = `/carrosseis/${nome}`;
  writeFileSync(join(pasta, 'avatar.png'), pngSolido(120, 120, [40, 60, 90]));
  for (const [arq, buf] of Object.entries(imagens)) writeFileSync(join(pasta, arq), buf);
  const html = cabeca + '</head>\n<body>\n' + slides(web).join('\n') + '\n</body>\n</html>\n';
  if (gerar) {
    writeFileSync(join(pasta, 'gerar.js'),
      `require('fs').writeFileSync(require('path').join(__dirname, 'carrossel.html'), ${JSON.stringify(html)});\nconsole.log('carrossel.html gerado');\n`);
  } else {
    writeFileSync(join(pasta, 'carrossel.html'), html);
  }
  if (legenda !== null) writeFileSync(join(pasta, 'legenda.txt'), legenda);
  return { pasta, html: join(pasta, 'carrossel.html'), web };
}

const boa = (web) => [
  slide({ avatar: `${web}/avatar.png`, blocos: ['você responde o cliente no dia seguinte.', 'aqui estão 3 jeitos de parar de perder venda à noite.'] }),
  slide({ avatar: `${web}/avatar.png`, blocos: ['1. responda a primeira mensagem em minutos', 'a primeira resposta segura a conversa, mesmo curta.'] }),
  slide({ avatar: `${web}/avatar.png`, blocos: ['2. deixe a pergunta mais comum respondida', 'o preço e o horário numa mensagem pronta.'] }),
  slide({ avatar: `${web}/avatar.png`, blocos: ['comenta aí qual desses você já faz.'] }),
];

/** Gera o HTML (roda o gerar.js) e confere. */
async function conferePeca(p, opcoes = {}) {
  if (existsSync(join(p.pasta, 'gerar.js'))) spawnSync(process.execPath, [join(p.pasta, 'gerar.js')]);
  const { conferir } = require('./conferir-x.js');
  return conferir(p.html, { raiz: RAIZ, ...opcoes });
}

const temErro = (r, re) => r.erros.some((e) => re.test(e));
const temAviso = (r, re) => r.avisos.some((e) => re.test(e));
const opc = { skip: SEM_CHROMIUM && 'Chromium não instalado (render/instalar.md)', timeout: 120000 };

// ─── o conferidor ──────────────────────────────────────────────────────────

test('peça boa: nenhum erro', opc, async () => {
  const r = await conferePeca(peca({ slides: boa }));
  assert.deepEqual(r.erros, []);
  assert.equal(r.slides, 4);
});

test('texto que estoura a caixa reprova', opc, async () => {
  const longo = 'uma frase comprida que ocupa espaço no slide e não acaba nunca. '.repeat(8);
  const r = await conferePeca(peca({ slides: (web) => [slide({ avatar: `${web}/avatar.png`, blocos: [longo, longo, longo] })] }));
  assert.ok(temErro(r, /cortado|maior que a caixa|vaza/i), JSON.stringify(r.erros));
});

test('o @ de exemplo do modelo reprova', opc, async () => {
  const r = await conferePeca(peca({ slides: (web) => [slide({ avatar: `${web}/avatar.png`, handle: '@SEU_PERFIL', blocos: ['um texto qualquer.'] })] }));
  assert.ok(temErro(r, /@SEU_PERFIL/), JSON.stringify(r.erros));
});

test('o nome de exemplo do modelo reprova', opc, async () => {
  const r = await conferePeca(peca({ slides: (web) => [slide({ avatar: `${web}/avatar.png`, nome: 'SEU NOME', blocos: ['um texto qualquer.'] })] }));
  assert.ok(temErro(r, /SEU NOME/), JSON.stringify(r.erros));
});

test('@ diferente entre slides reprova', opc, async () => {
  const r = await conferePeca(peca({ slides: (web) => [
    slide({ avatar: `${web}/avatar.png`, blocos: ['primeiro.'] }),
    slide({ avatar: `${web}/avatar.png`, handle: '@outra.conta', blocos: ['segundo.'] }),
  ] }));
  assert.ok(temErro(r, /@outra\.conta/), JSON.stringify(r.erros));
});

test('@ diferente do pedido em --handle reprova', opc, async () => {
  const r = await conferePeca(peca({ slides: boa }), { handle: '@conta.certa' });
  assert.ok(temErro(r, /@conta\.certa/), JSON.stringify(r.erros));
});

test('avatar que não carrega reprova', opc, async () => {
  const r = await conferePeca(peca({ slides: (web) => [slide({ avatar: `${web}/nao-existe.png`, blocos: ['um texto.'] })] }));
  assert.ok(temErro(r, /não carregou|avatar/i), JSON.stringify(r.erros));
});

test('travessão no texto reprova', opc, async () => {
  const r = await conferePeca(peca({ slides: (web) => [slide({ avatar: `${web}/avatar.png`, blocos: ['isso — aquilo.'] })] }));
  assert.ok(temErro(r, /travessão/), JSON.stringify(r.erros));
});

test('slide sem texto reprova', opc, async () => {
  const r = await conferePeca(peca({ slides: (web) => [slide({ avatar: `${web}/avatar.png`, blocos: [] })] }));
  assert.ok(temErro(r, /sem texto/), JSON.stringify(r.erros));
});

test('CSS defasado do modelo reprova', opc, async () => {
  const velho = head().replace('--corpo:   41px;', '--corpo:   36px;');
  assert.notEqual(velho, head(), 'a troca do CSS não aplicou: o teste não mediria nada');
  const r = await conferePeca(peca({ slides: boa, cabeca: velho }));
  assert.ok(temErro(r, /defasado/i), JSON.stringify(r.erros));
});

test('imagem comida pela caixa reprova', opc, async () => {
  const media = (web) => `<div class="tw-media"><img src="${web}/alta.png" alt=""></div>`;
  const r = await conferePeca(peca({
    imagens: { 'alta.png': pngSolido(400, 800, [30, 30, 30]) },
    slides: (web) => [slide({ avatar: `${web}/avatar.png`, blocos: ['um bloco.', 'outro bloco com mais texto para ocupar.'], media: media(web) })],
  }));
  assert.ok(temErro(r, /imagem foi cortada|maior que a caixa|vaza/i), JSON.stringify(r.erros));
});

test('imagem corrompida servida com 200 reprova', opc, async () => {
  const r = await conferePeca(peca({
    imagens: { 'quebrada.jpg': Buffer.from('isto não é uma imagem') },
    slides: (web) => [slide({ avatar: `${web}/avatar.png`, blocos: ['um bloco.'], media: `<div class="tw-media"><img src="${web}/quebrada.jpg" alt=""></div>` })],
  }));
  assert.ok(temErro(r, /não decodifica/), JSON.stringify(r.erros));
});

test('imagem de fundo claro avisa', opc, async () => {
  const r = await conferePeca(peca({
    imagens: { 'clara.png': pngSolido(1976, 988, [250, 250, 250]) },
    slides: (web) => [slide({ avatar: `${web}/avatar.png`, blocos: ['um bloco.'], media: `<div class="tw-media"><img src="${web}/clara.png" alt=""></div>` })],
  }));
  assert.ok(temAviso(r, /fundo claro/), JSON.stringify(r.avisos));
});

test('numeração fora de ordem avisa', opc, async () => {
  const r = await conferePeca(peca({ slides: (web) => [
    slide({ avatar: `${web}/avatar.png`, blocos: ['1. primeiro'] }),
    slide({ avatar: `${web}/avatar.png`, blocos: ['3. terceiro'] }),
  ] }));
  assert.ok(temAviso(r, /esperava 2/), JSON.stringify(r.avisos));
});

test('palavra-gatilho em caixa alta no comentário avisa', opc, async () => {
  const r = await conferePeca(peca({ slides: (web) => [slide({ avatar: `${web}/avatar.png`, blocos: ['comenta QUERO que eu te mando.'] })] }));
  assert.ok(temAviso(r, /QUERO/), JSON.stringify(r.avisos));
});

test('o molde do gerar.js gera a peça e o conferidor cobra o perfil de exemplo', opc, async () => {
  const pasta = join(RAIZ, 'carrosseis', 'fundo', 'molde');
  mkdirSync(pasta, { recursive: true });
  // o molde acha a raiz subindo até .claude/skills/carrossel
  mkdirSync(join(RAIZ, '.claude', 'skills', 'carrossel', 'x'), { recursive: true });
  writeFileSync(join(RAIZ, '.claude', 'skills', 'carrossel', 'x', 'modelo.html'), readFileSync(MODELO, 'utf8'));
  writeFileSync(join(pasta, 'gerar.js'), readFileSync(join(SKILL, 'x', 'modelo-gerar.js'), 'utf8'));
  writeFileSync(join(pasta, 'avatar.jpg'), pngSolido(120, 120, [40, 60, 90]));
  const g = spawnSync(process.execPath, [join(pasta, 'gerar.js')], { encoding: 'utf8' });
  assert.equal(g.status, 0, g.stderr);
  const { conferir } = require('./conferir-x.js');
  const r = await conferir(join(pasta, 'carrossel.html'), { raiz: RAIZ });
  assert.equal(r.slides, 4);
  assert.ok(temErro(r, /SEU NOME/) && temErro(r, /@SEU_PERFIL/), JSON.stringify(r.erros));
  assert.ok(!temErro(r, /defasado|avatar/i), JSON.stringify(r.erros));
});

// ─── o montador ────────────────────────────────────────────────────────────

/** Roda o montador sem bloquear (o processo filho sobe servidor e Chromium). */
const monta = (pasta) => new Promise((ok) => {
  const p = spawn(process.execPath, [MONTAR, pasta, '--raiz', RAIZ]);
  let saida = '';
  p.stdout.on('data', (d) => { saida += d; });
  p.stderr.on('data', (d) => { saida += d; });
  p.on('close', (code) => ok({ code, saida }));
});

function dimensoesJpeg(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) return null;
    const m = buf[i + 1];
    const t = buf.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    i += 2 + t;
  }
  return null;
}

test('montador: a peça boa sai com um JPEG por slide, em 2160×2700, e o JPEG velho some', opc, async () => {
  const p = peca({ slides: boa });
  mkdirSync(join(p.pasta, 'instagram'));
  writeFileSync(join(p.pasta, 'instagram', 'slide-09.jpg'), 'velho');
  const r = await monta(p.pasta);
  assert.equal(r.code, 0, r.saida);
  const jpgs = readdirSync(join(p.pasta, 'instagram')).filter((a) => a.endsWith('.jpg')).sort();
  assert.deepEqual(jpgs, ['slide-01.jpg', 'slide-02.jpg', 'slide-03.jpg', 'slide-04.jpg']);
  for (const j of jpgs) assert.deepEqual(dimensoesJpeg(readFileSync(join(p.pasta, 'instagram', j))), { w: 2160, h: 2700 });
});

test('montador: peça sem gerar.js reprova', opc, async () => {
  const r = await monta(peca({ slides: boa, gerar: false }).pasta);
  assert.equal(r.code, 1);
  assert.match(r.saida, /gerar\.js/);
});

test('montador: peça sem legenda.txt reprova', opc, async () => {
  const r = await monta(peca({ slides: boa, legenda: null }).pasta);
  assert.equal(r.code, 1);
  assert.match(r.saida, /legenda\.txt/);
});

test('montador: legenda fora da régua reprova', opc, async () => {
  const r = await monta(peca({ slides: boa, legenda: 'uma linha só #hashtag' }).pasta);
  assert.equal(r.code, 1, r.saida);
  assert.match(r.saida, /legenda/i);
});

test('montador: gate vermelho não renderiza', opc, async () => {
  const p = peca({ slides: (web) => [slide({ avatar: `${web}/avatar.png`, handle: '@SEU_PERFIL', blocos: ['um texto.'] })] });
  const r = await monta(p.pasta);
  assert.equal(r.code, 1);
  assert.match(r.saida, /não renderizei/i);
  assert.ok(!existsSync(join(p.pasta, 'instagram')) || !readdirSync(join(p.pasta, 'instagram')).some((a) => a.endsWith('.jpg')));
});
