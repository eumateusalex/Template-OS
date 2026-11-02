// A régua da biblioteca da /design-de-produto. Só lê; sai 1 se alguma verificação falhar.
//
// Confere:
//   1. todo link relativo dos .md resolve, e todo caminho de imagem da galeria citado existe
//   2. todo caminho `_local/...` citado existe
//   3. as contagens declaradas batem com o disco (componentes, fichas, imagens da galeria por
//      seção e no total, frases do banco)
//   4. a galeria: toda imagem está no galeria.json e no INDICE.md, toda entrada existe no disco, o
//      INDICE.md está em dia, imagem que nenhum .md cita aparece no índice com a seção que ilustra,
//      e o nome diz o que mostra em duas palavras ou mais (sem id numérico, sem img_/image, não só número)
//   5. uma imagem, uma pasta (sem conteúdo repetido na galeria); nenhuma imagem dentro de _local/;
//      extensão igual ao conteúdo (PNG × JPEG) em toda imagem da skill
//   6. toda ficha da pasta 06-produtos está num dos índices do README, e todo link do índice aponta
//      uma ficha que existe
//
// Uso: node .claude/skills/design-de-produto/scripts/confere-biblioteca.mjs [--raiz <pasta da skill>]

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const iR = args.indexOf('--raiz');
const SKILL = path.resolve(iR > -1 ? args[iR + 1] : path.join(AQUI, '..'));
const B = path.join(SKILL, 'biblioteca');
const G = path.join(B, 'galeria');
const L = path.join(SKILL, '_local');
const { geraIndice, citacoes, SECOES } = await import(pathToFileURL(path.join(L, 'indexa-galeria.mjs')).href);

// a extensão pelo conteúdo: JPEG começa em FF D8 FF, PNG na assinatura de 8 bytes
const extDe = (p) => {
  const b = fs.readFileSync(p);
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length >= 8 && b.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') return 'png';
  return null;
};

const rel = (p) => path.relative(SKILL, p).split(path.sep).join('/');
const ler = (p) => fs.readFileSync(p, 'utf8');
function arquivos(dir, filtro, pular = []) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const anda = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!pular.includes(e.name)) anda(p); } else if (filtro(e.name)) out.push(p);
  });
  anda(dir);
  return out.sort();
}
const resultados = [];
function confere(nome, falhas) {
  resultados.push({ nome, falhas });
  console.log(`${falhas.length ? 'FALHOU' : 'ok    '}  ${nome}${falhas.length ? '  -> ' + falhas.slice(0, 6).join(' | ') + (falhas.length > 6 ? ` (+${falhas.length - 6})` : '') : ''}`);
}

const MDS = arquivos(SKILL, (n) => n.endsWith('.md'), ['vendor', 'node_modules']);

// 1. links relativos e imagens citadas -------------------------------------------------------
{
  const f = [];
  for (const md of MDS) {
    const t = ler(md).replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, ''); // exemplo em código não é link
    for (const m of t.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      let alvo = m[1];
      if (/^(https?:|mailto:|#|data:)/.test(alvo)) continue;
      alvo = decodeURIComponent(alvo.split('#')[0]);
      if (!alvo) continue;
      if (!fs.existsSync(path.resolve(path.dirname(md), alvo))) f.push(`${rel(md)}: ${m[1]}`);
    }
  }
  confere('todo link relativo dos .md resolve', f);
}
{
  const f = [];
  for (const md of MDS) {
    for (const m of ler(md).matchAll(/galeria\/(\d\d-[a-z0-9-]+\/[^\s)`"'|<>]+\.(?:jpe?g|png|webp|gif))/gi)) {
      if (!fs.existsSync(path.join(G, m[1]))) f.push(`${rel(md)}: galeria/${m[1]}`);
    }
  }
  confere('todo caminho de imagem da galeria citado existe', f);
}

// 2. caminhos _local citados -------------------------------------------------------------------
{
  const f = [];
  const alvo = [...MDS, ...arquivos(path.join(SKILL, 'assets'), (n) => /\.html$/.test(n), ['vendor'])];
  for (const p of alvo) {
    const t = ler(p).replace(/```[\s\S]*?```/g, '');
    for (const m of t.matchAll(/`(_local\/[^`*<>]+)`/g)) if (!fs.existsSync(path.join(SKILL, m[1]))) f.push(`${rel(p)}: ${m[1]}`);
  }
  confere('todo caminho _local citado existe', f);
}

// 3. contagens declaradas ----------------------------------------------------------------------
{
  const f = [];
  const conta = (p, re) => (ler(p).match(re) || []).length;
  const linhasTabela = (p, titulo) => {
    const t = ler(p); const i = t.indexOf(titulo); if (i < 0) return -1;
    const bloco = t.slice(i).split('\n').slice(1);
    let n = 0, dentro = false;
    for (const l of bloco) {
      if (/^\|/.test(l)) { dentro = true; if (!/^\|[\s:-]+\|/.test(l) && !/^\| *(Componente|#|Produto|Arquétipo)/.test(l)) n++; }
      else if (dentro) break;
    }
    return n;
  };
  const comp = linhasTabela(path.join(B, '02-componentes', 'README.md'), '## Índice de componentes');
  const R6 = path.join(B, '06-produtos', 'README.md');
  const fichas = linhasTabela(R6, '## Índice') + Math.max(0, linhasTabela(R6, '## Mais fichas'));
  const arquetipos = linhasTabela(path.join(B, '04-tipos-de-tela', 'README.md'), '## Índice dos arquétipos');
  const frases = conta(path.join(B, '07-microcopy', 'banco-de-frases.md'), /^\| \d+ \|/gm);
  const imgs = arquivos(G, (n) => /\.(jpe?g|png)$/i.test(n)).length;
  const declara = [
    ['README.md', /\((\d+) componentes\)/, comp, 'componentes'],
    ['README.md', /\((\d+) fichas\)/, fichas, 'fichas'],
    ['README.md', /banco de (\d+) frases/, frases, 'frases'],
    ['README.md', /galeria\/INDICE\.md\)[^\n]*?\((\d+) imagens\)/, imgs, 'imagens da galeria'],
    ['07-microcopy/banco-de-frases.md', /\*\*Total: (\d+) exemplos\.\*\*/, frases, 'frases (total do banco)'],
    ['07-microcopy/README.md', /Banco com \*\*(\d+) exemplos\*\*/, frases, 'frases (README da 07)'],
    ['../SKILL.md', /02-componentes\/README\.md` \((\d+), com medida\)/, comp, 'componentes (SKILL.md)'],
    ['../SKILL.md', /04-tipos-de-tela\/` \((\d+) arquétipos/, arquetipos, 'arquétipos (SKILL.md)'],
  ];
  for (const [arq, re, real, oque] of declara) {
    const m = ler(path.join(B, arq)).match(re);
    if (!m) f.push(`${arq}: não achei a contagem de ${oque}`);
    else if (Number(m[1]) !== real) f.push(`${arq}: declara ${m[1]} ${oque}, o disco tem ${real}`);
  }
  // "galeria/<seção>/ ... (N imagens|arquivos)" em qualquer .md da biblioteca
  for (const md of MDS.filter((p) => p.startsWith(B))) {
    for (const m of ler(md).matchAll(/galeria\/(\d\d-[a-z0-9-]+)\/`?\]?(?:\([^)]*\))?\s*\((\d+) (?:imagens|arquivos)\)/g)) {
      const real = arquivos(path.join(G, m[1]), (n) => /\.(jpe?g|png)$/i.test(n)).length;
      if (Number(m[2]) !== real) f.push(`${rel(md)}: galeria/${m[1]} declara ${m[2]}, o disco tem ${real}`);
    }
  }
  confere('as contagens declaradas batem com o disco', f);
}

// 4. galeria ---------------------------------------------------------------------------------
const gal = JSON.parse(ler(path.join(L, 'galeria.json')));
const imgsDisco = arquivos(G, (n) => /\.(jpe?g|png|webp|gif)$/i.test(n)).map((p) => path.relative(G, p).split(path.sep).join('/'));
const indice = fs.existsSync(path.join(G, 'INDICE.md')) ? ler(path.join(G, 'INDICE.md')) : '';
{
  const f = [];
  for (const a of imgsDisco) {
    if (!gal[a]) f.push(`${a}: no disco e fora do galeria.json`);
    if (!indice.includes(`](${a})`)) f.push(`${a}: fora do INDICE.md`);
  }
  for (const a of Object.keys(gal)) if (!fs.existsSync(path.join(G, a))) f.push(`${a}: no galeria.json e não existe no disco`);
  for (const m of indice.matchAll(/\]\((\d\d-[a-z0-9-]+\/[^)]+)\)/g)) if (!fs.existsSync(path.join(G, m[1]))) f.push(`INDICE.md cita ${m[1]}, que não existe`);
  confere('toda imagem da galeria está no índice e toda entrada do índice existe', f);
}
{
  const f = [];
  let gerado = null;
  try { gerado = geraIndice(SKILL); } catch (e) { f.push('não consegui gerar o índice: ' + e.message); }
  if (gerado !== null && gerado !== indice) f.push('galeria/INDICE.md fora de dia (rode _local/indexa-galeria.mjs --escreve)');
  const cit = citacoes(B);
  for (const a of imgsDisco) {
    if (cit[a]) continue;
    const sec = a.split('/')[0];
    const linha = indice.split('\n').find((l) => l.includes(`](${a})`)) || '';
    if (!SECOES[sec] || !linha.includes(`ilustra a seção [${SECOES[sec][0]}]`)) f.push(`${a}: nenhum .md cita e o índice não diz a seção que ela ilustra`);
    if (!gal[a] || !gal[a].mostra || gal[a].mostra.length < 20) f.push(`${a}: sem a linha do que ela mostra`);
  }
  confere('índice em dia; imagem que nenhum .md cita tem a seção que ilustra', f);
}
{
  const f = [];
  for (const a of imgsDisco) {
    const [sec, nome] = a.split('/');
    if (!SECOES[sec]) f.push(`${a}: pasta fora das seções da galeria`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)+\.(?:jpg|png)$/.test(nome || '')) f.push(`${a}: nome fora de <assunto-em-palavras>.jpg`);
    const ext = extDe(path.join(G, a));
    if (!ext) f.push(`${a}: o conteúdo não é JPEG nem PNG`);
    else if (!nome.endsWith('.' + ext)) f.push(`${a}: a extensão não bate com o conteúdo (${ext.toUpperCase()})`);
    if (/\d{6,}/.test(nome) || /(^|[-_])(img|image|imagem)([-_]|\d|$)/i.test(nome) || /^img_/i.test(nome) || /^[\d-]+\.(jpg|png)$/.test(nome)) f.push(`${a}: nome que não diz o que mostra (id, img_, image ou só número)`);
  }
  confere('nome de imagem diz o que ela mostra', f);
}

// 5. uma imagem, uma pasta; imagem só na galeria e com a extensão do conteúdo ----------------------
{
  const f = [];
  const porHash = {};
  for (const a of imgsDisco) (porHash[crypto.createHash('md5').update(fs.readFileSync(path.join(G, a))).digest('hex')] ||= []).push(a);
  for (const g of Object.values(porHash)) if (g.length > 1) f.push(`mesma imagem em ${g.length} arquivos: ${g.join(' = ')}`);
  for (const p of arquivos(L, (n) => /\.(jpe?g|png|webp|gif)$/i.test(n))) f.push(`${rel(p)}: imagem dentro de _local/ (imagem só entra na galeria, vista e nomeada)`);
  for (const p of arquivos(SKILL, (n) => /\.(jpe?g|png)$/i.test(n), ['vendor', 'node_modules'])) {
    const ext = extDe(p);
    if (!ext) f.push(`${rel(p)}: o conteúdo não é JPEG nem PNG`);
    else if (!p.toLowerCase().endsWith('.' + ext) && !(ext === 'jpg' && /\.jpeg$/i.test(p))) f.push(`${rel(p)}: a extensão não bate com o conteúdo (${ext.toUpperCase()})`);
  }
  confere('uma imagem, uma pasta; imagem só na galeria; extensão igual ao conteúdo em toda a skill', f);
}

// 6. toda ficha indexada, e todo link do índice aponta ficha que existe -----------------------------
{
  const f = [];
  const D6 = path.join(B, '06-produtos');
  const readme = ler(path.join(D6, 'README.md'));
  for (const l of readme.split('\n').filter((x) => /^\| \d+ \|/.test(x))) {
    const arq = (l.match(/\]\(([^)]+\.md)\)\s*\|\s*$/) || [])[1];
    if (!arq) f.push(`índice: linha sem link de ficha ("${l.slice(0, 40)}")`);
    else if (!fs.existsSync(path.join(D6, arq))) f.push(`índice: ${l.split('|')[2].trim()} aponta ${arq}, que não existe`);
  }
  for (const n of fs.readdirSync(D6).filter((x) => x.endsWith('.md') && x !== 'README.md')) {
    if (!readme.includes(`](${n})`)) f.push(`${n}: ficha fora dos índices do README`);
  }
  confere('toda ficha está num índice e todo link do índice aponta ficha que existe', f);
}

const falhas = resultados.filter((r) => r.falhas.length).length;
console.log(falhas ? `\nREPROVADO — ${falhas} de ${resultados.length} verificações falharam` : `\nTUDO CERTO — ${resultados.length} verificações`);
process.exit(falhas ? 1 : 0);
