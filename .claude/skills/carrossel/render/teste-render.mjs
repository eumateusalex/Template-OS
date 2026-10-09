#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// teste-render · prova que o render faz o que promete
//
// Precisa do Chromium instalado (render/instalar.md). As provas:
//   1. o modelo do kit sai com um JPEG por slide, cada um em 4:5 e abaixo de
//      3 MB, exit 0
//   2. peça com imagem que não existe: os JPEGs saem, mas exit 1 e a imagem
//      é listada
//   3. tokens com fonte que não existe: nenhum JPEG, exit 1
//   4. imagem fora da pasta da peça: recusada, com o motivo e a dica; o
//      --servir a traz
//   5. o servidor do render não atende fora do 127.0.0.1
//   6. peça fora de projeto (a .claude/ da pasta do usuário não conta): exit 1
//      pedindo --raiz
//   7. porta ocupada: exit 2, que é problema de ambiente
//   8. sem a pasta do usuário no sistema (Windows): exit 2, que é ambiente, com
//      o recado de que o Playwright não carregou, e não o de instalar
//
// Uso:  node render/teste-render.mjs      (ou `npm run testar` dentro de render/)
// Sai 0 se as provas passaram, 1 se alguma falhou, 2 se o ambiente não
// tem o Chromium (aí não é o render que está errado).
// ═══════════════════════════════════════════════════════════════════════════

import { spawnSync, spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { createServer, connect } from 'node:net';
import { tmpdir, networkInterfaces } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SKILL = join(AQUI, '..');
const RENDER = join(AQUI, 'render-carrossel.js');
const TMP = join(AQUI, 'teste-render');

const roda = (...args) => spawnSync(process.execPath, [RENDER, ...args], { encoding: 'utf8' });
let falhas = 0;
const prova = (nome, ok, detalhe = '') => {
  console.log(`${ok ? '✅' : '❌'} ${nome}${ok || !detalhe ? '' : '\n     ' + detalhe}`);
  if (!ok) falhas++;
};

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

// ambiente
const amb = roda('--checar');
if (amb.status === 2) {
  console.log('Chromium não instalado; nada a testar aqui. Ver render/instalar.md');
  process.exit(2);
}

// 1 · o modelo
{
  const saida = join(TMP, 'modelo');
  const r = roda(join(SKILL, 'kit', 'modelo-carrossel.html'), saida);
  const arquivos = r.status === 0 ? readdirSync(saida).filter((a) => a.endsWith('.jpg')) : [];
  prova('modelo do kit renderiza com exit 0', r.status === 0, r.stdout + r.stderr);
  prova('sai um JPEG por slide (9)', arquivos.length === 9, `saíram ${arquivos.length}`);
  const pesados = arquivos.filter((a) => statSync(join(saida, a)).size > 3 * 1024 * 1024);
  prova('todo JPEG abaixo de 3 MB', pesados.length === 0, pesados.join(', '));
  const dims = arquivos.map((a) => dimensoesJpeg(readFileSync(join(saida, a))));
  prova('todo JPEG em 2160×2700', dims.every((d) => d && d.w === 2160 && d.h === 2700), JSON.stringify(dims));
}

// 2 · imagem que não existe
{
  const html = join(TMP, 'sem-imagem.html');
  const modelo = readFileSync(join(SKILL, 'kit', 'modelo-carrossel.html'), 'utf8');
  writeFileSync(html, modelo.replace('<div class="slide cover" data-slide-label="Capa">', '<div class="slide cover" data-slide-label="Capa" style="--img:url(\'/carrosseis/nao-existe/capa.jpg\')">'));
  const r = roda(html, join(TMP, 'sem-imagem'));
  prova('imagem faltando: exit 1 e a imagem listada', r.status === 1 && /nao-existe\/capa\.jpg/.test(r.stdout + r.stderr), (r.stdout + r.stderr).slice(-300));
  prova('imagem faltando: os JPEGs saem mesmo assim', readdirSync(join(TMP, 'sem-imagem')).length === 9);
}

// 3 · fonte que não existe
{
  const tokens = readFileSync(join(SKILL, 'marca', 'tokens.molde.css'), 'utf8')
    .replace(/--f-display:[^;]+;/, "--f-display: 'Fonte Que Nao Existe', Arial, sans-serif;");
  writeFileSync(join(TMP, 'tokens-ruim.css'), tokens);
  const modelo = readFileSync(join(SKILL, 'kit', 'modelo-carrossel.html'), 'utf8')
    .replace(/<link rel="stylesheet" href="\/\.claude\/skills\/carrossel\/marca\/tokens[^"]*">\n?/g, '')
    .replace('<link rel="stylesheet" href="/.claude/skills/carrossel/kit/componentes.css">', '<link rel="stylesheet" href="/.claude/skills/carrossel/render/teste-render/tokens-ruim.css">\n<link rel="stylesheet" href="/.claude/skills/carrossel/kit/componentes.css">');
  const html = join(TMP, 'fonte-ruim.html');
  writeFileSync(html, modelo);
  const r = roda(html, join(TMP, 'fonte-ruim'));
  let n = 0;
  try { n = readdirSync(join(TMP, 'fonte-ruim')).length; } catch {}
  prova('fonte que não carrega: exit 1 e nenhum JPEG', r.status === 1 && n === 0 && /Fonte Que Nao Existe/.test(r.stdout + r.stderr), (r.stdout + r.stderr).slice(-300));
}

// uma PNG de 1×1, para a peça ter imagem de verdade
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
const comCapa = (img) => readFileSync(join(SKILL, 'kit', 'modelo-carrossel.html'), 'utf8')
  .replace('<div class="slide cover" data-slide-label="Capa">', `<div class="slide cover" data-slide-label="Capa" style="--img:url(${img})">`);

// 4 · imagem fora da pasta da peça: recusada, com o motivo e a dica; o --servir a traz
{
  const raiz = mkdtempSync(join(tmpdir(), 'render-servir-'));
  for (const p of ['.claude', 'dados', join('carrosseis', 'p')]) mkdirSync(join(raiz, p), { recursive: true });
  writeFileSync(join(raiz, 'dados', 'foto.png'), PNG);
  const html = join(raiz, 'carrosseis', 'p', 'carrossel.html');
  // um estilo que falta também: o render lista só imagem
  writeFileSync(html, comCapa('/dados/foto.png').replace('</head>', '<link rel="stylesheet" href="/carrosseis/p/nao-existe.css">\n</head>'));
  const fora = roda(html, join(raiz, 'saida-fora'));
  prova('imagem fora da pasta da peça: exit 1, o motivo, as pastas servidas e o --servir na mensagem',
    fora.status === 1 && fora.stderr.includes('/dados/foto.png  (fora das pastas que o render serve)')
      && fora.stderr.includes('O render serve .claude/skills/carrossel/, carrosseis/p/; imagem noutra pasta entra com --servir <pasta>')
      && !fora.stderr.includes('nao-existe.css'),
    fora.stderr.slice(-400));
  // o --servir vem ANTES da pasta de saída: o valor dele não pode virar a pasta
  const saida = join(raiz, 'saida-servida');
  const servida = roda(html, '--servir', 'dados', saida);
  let n = 0;
  try { n = readdirSync(saida).length; } catch {}
  prova('com --servir dados, a mesma imagem vem: exit 0 e os 9 JPEGs na pasta pedida', servida.status === 0 && n === 9, (servida.stdout + servida.stderr).slice(-400));
  rmSync(raiz, { recursive: true, force: true });
}

// 5 · o servidor do render só atende no 127.0.0.1
{
  const lan = Object.values(networkInterfaces()).flat().find((i) => i && i.family === 'IPv4' && !i.internal);
  if (!lan) console.log('﹣ sem interface fora do 127.0.0.1: a escuta só no 127.0.0.1 fica sem prova nesta máquina');
  else {
    const filho = spawn(process.execPath, [RENDER, '--catalogo'], { stdio: ['ignore', 'pipe', 'pipe'] });
    const porta = await new Promise((ok) => {
      let s = '';
      filho.stdout.on('data', (d) => { s += d; const m = s.match(/127\.0\.0\.1:(\d+)/); if (m) ok(Number(m[1])); });
      filho.on('exit', () => ok(0));
      setTimeout(() => ok(0), 15000); // sem a URL em 15 s, a prova reprova em vez de pendurar
    });
    const deFora = porta ? await new Promise((ok) => {
      const c = connect(porta, lan.address);
      c.on('connect', () => { c.destroy(); ok('conectou'); });
      c.on('error', (e) => ok(e.code));
    }) : 'o catálogo não subiu';
    filho.kill();
    prova('o servidor do render não atende fora do 127.0.0.1', deFora === 'ECONNREFUSED', `${lan.address}:${porta} → ${deFora}`);
  }
}

// 6 · peça fora de projeto: a .claude/ da pasta do usuário não faz dela um projeto
{
  const casa = mkdtempSync(join(tmpdir(), 'render-casa-'));
  mkdirSync(join(casa, '.claude'));
  mkdirSync(join(casa, 'Downloads', 'peca'), { recursive: true });
  const html = join(casa, 'Downloads', 'peca', 'carrossel.html');
  writeFileSync(html, comCapa('/Downloads/peca/nao-existe.png'));
  const r = spawnSync(process.execPath, [RENDER, html, join(casa, 'saida')], { encoding: 'utf8', env: { ...process.env, USERPROFILE: casa, HOME: casa } });
  prova('peça fora de projeto: exit 1 pedindo --raiz, sem servir a pasta do usuário',
    r.status === 1 && r.stderr.includes('pasta de usuário não conta') && r.stderr.includes('--raiz') && !r.stdout.includes('raiz do projeto'),
    (r.stdout + r.stderr).slice(-300));
  rmSync(casa, { recursive: true, force: true });
}

// 7 · porta ocupada: problema de ambiente, exit 2
{
  const ocupante = createServer();
  const porta = await new Promise((ok) => ocupante.listen(0, '127.0.0.1', () => ok(ocupante.address().port)));
  // o catálogo que sobe fica no ar: sem o timeout, a prova penduraria em vez de reprovar
  const r = spawnSync(process.execPath, [RENDER, '--catalogo', '--porta', String(porta)], { encoding: 'utf8', timeout: 30000 });
  ocupante.close();
  prova('porta ocupada: exit 2 e a mensagem da porta', r.status === 2 && r.stderr.includes('ocupada'), (r.stdout + r.stderr).slice(-300));
}

// 8 · sem a pasta do usuário no sistema, o próprio Playwright não carrega: é ambiente
// (exit 2), e o recado diz isso em vez de mandar reinstalar
if (process.platform !== 'win32') console.log('﹣ fora do Windows a pasta do usuário vazia não derruba o os.homedir(): a prova fica para o Windows');
else {
  const raiz = mkdtempSync(join(tmpdir(), 'render-semcasa-'));
  mkdirSync(join(raiz, '.claude'));
  mkdirSync(join(raiz, 'carrosseis', 'p'), { recursive: true });
  const html = join(raiz, 'carrosseis', 'p', 'carrossel.html');
  writeFileSync(html, comCapa('/carrosseis/p/nao-existe.png'));
  const semCasa = { ...process.env, USERPROFILE: '', HOME: '' };
  const peca = spawnSync(process.execPath, [RENDER, html, join(raiz, 'saida')], { encoding: 'utf8', env: semCasa, timeout: 60000 });
  const catalogo = spawnSync(process.execPath, [RENDER, '--catalogo'], { encoding: 'utf8', env: semCasa, timeout: 30000 });
  const recado = (r) => r.status === 2 && r.stderr.includes('não carregou') && !r.stderr.includes('não encontrado');
  prova('sem a pasta do usuário no sistema: exit 2, dizendo que o Playwright não carregou (e não que falta instalar)',
    recado(peca) && recado(catalogo), `${peca.status} ${peca.stderr.slice(-160)} · ${catalogo.status} ${catalogo.stderr.slice(-160)}`);
  rmSync(raiz, { recursive: true, force: true });
}

rmSync(TMP, { recursive: true, force: true });
console.log(`\n${falhas ? falhas + ' prova(s) falharam.' : 'render ok.'}`);
process.exit(falhas ? 1 : 0);

/** Lê largura e altura de um JPEG pelo marcador SOF. */
function dimensoesJpeg(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marcador = buf[i + 1];
    const tamanho = buf.readUInt16BE(i + 2);
    if (marcador >= 0xc0 && marcador <= 0xcf && marcador !== 0xc4 && marcador !== 0xc8 && marcador !== 0xcc) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    i += 2 + tamanho;
  }
  return null;
}
