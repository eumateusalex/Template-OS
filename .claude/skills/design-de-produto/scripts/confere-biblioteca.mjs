// A régua da biblioteca da /design-de-produto. Só lê; sai 1 se alguma verificação falhar.
//
// Confere:
//   1. todo link relativo dos .md resolve, e todo caminho de imagem da galeria citado existe
//   2. nenhum endereço de post em arquivo nenhum da skill, fontes incluídas, pela regra única de
//      _local/captura/endereco.mjs (a mesma que o guarda-bruto e o escreve-fontes aplicam)
//   3. toda referência local de fonte resolve: id de post citado na biblioteca tem arquivo em
//      _local/fontes/, caminho `_local/...` citado existe, e o mapa de imagens de cada
//      fonte aponta para arquivo da galeria (ou para o registro de "imagem não guardada")
//   4. as contagens declaradas batem com o disco (componentes, fichas, imagens da galeria por
//      seção e no total, frases do banco)
//   5. o cobertura.json é coerente com as fontes, referência por referência (toda fonte é de uma
//      referência do mapa; ate = post mais novo dela que entrou na biblioteca, ou null; triado_ate >=
//      post mais novo dela capturado; fuso no formato ±HH:MM)
//   6. a galeria: toda imagem está no galeria.json e no INDICE.md, toda entrada existe no disco, o
//      INDICE.md está em dia, imagem que nenhum .md cita aparece no índice com a seção que ilustra,
//      e o nome segue <assunto>-<produto>.jpg (sem id numérico, sem img_/image, não só número)
//   7. uma imagem, uma pasta (sem conteúdo repetido na galeria); nenhuma imagem dentro de _local/;
//      extensão igual ao conteúdo (PNG × JPEG) em toda imagem da skill
//   8. toda captura tem nome único pelo id (janela.mjs): seções "Captura <id>", janelas/<id>.md,
//      _bruto/<tipo>-<id>.json, entradas do CHANGELOG, rótulo do galeria.json (o id, ou "base" na
//      imagem que vem com a skill) e campo captura das fontes
//   9. a linha de cada ficha no índice do 06-produtos/README.md = soma das tabelas <!--T:Nome--> da ficha;
//      a 1ª coluna dessas tabelas é a ordem do post na série (1 a N, sem repetir), nunca a data
//  10. nenhuma data de calendário AAAA-MM-DD na biblioteca (o id da captura, com o T, continua valendo)
//
// Uso: node .claude/skills/design-de-produto/scripts/confere-biblioteca.mjs [--raiz <pasta da skill>]

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const iR = process.argv.indexOf('--raiz');
const SKILL = path.resolve(iR > -1 ? process.argv[iR + 1] : path.join(AQUI, '..'));
const B = path.join(SKILL, 'biblioteca');
const G = path.join(B, 'galeria');
const L = path.join(SKILL, '_local');
const { geraIndice, citacoes, SECOES, BASE } = await import(pathToFileURL(path.join(L, 'indexa-galeria.mjs')).href);
// a MESMA regra de assinatura do download e do catalogador
const { extensaoPelaAssinatura } = await import(pathToFileURL(path.join(L, 'captura', 'imagem.mjs')).href);
const extDe = (p) => extensaoPelaAssinatura(fs.readFileSync(p));
// a MESMA regra de endereço de post do guarda-bruto e do escreve-fontes, as mesmas pastas de fonte e o mesmo fuso
const { enderecosDePost } = await import(pathToFileURL(path.join(L, 'captura', 'endereco.mjs')).href);
const { arquivosDeFonte, PASTAS_DE_FONTE } = await import(pathToFileURL(path.join(L, 'captura', 'pasta.mjs')).href);
const PASTA_DE_FONTE = new RegExp(`^_local/fontes/(?:(?:${[...PASTAS_DE_FONTE, '_bruto'].join('|')})/)?$`);
const { minutosDoFuso } = await import(pathToFileURL(path.join(L, 'captura', 'janela.mjs')).href);
const { RE_HANDLE } = await import(pathToFileURL(path.join(L, 'captura', 'referencia.mjs')).href);

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

const MDS = arquivos(SKILL, (n) => n.endsWith('.md'), ['fontes', 'vendor', 'node_modules']);
const FONTES = arquivosDeFonte(path.join(L, 'fontes')).map((x) => x.caminho);
const TEXTO = arquivos(SKILL, (n) => /\.(md|json|js|mjs|cjs|html|css|txt|tsv|yml|yaml)$/.test(n), ['vendor', 'node_modules']);

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
  for (const md of [...MDS, ...FONTES]) {
    const t = ler(md);
    for (const m of t.matchAll(/galeria\/(\d\d-[a-z0-9-]+\/[^\s)`"'|<>]+\.(?:jpe?g|png|webp|gif))/gi)) {
      if (!fs.existsSync(path.join(G, m[1]))) f.push(`${rel(md)}: galeria/${m[1]}`);
    }
  }
  confere('todo caminho de imagem da galeria citado existe', f);
}

// 2. nenhum endereço de post -----------------------------------------------------------------
{
  // endereco.mjs: handle, i/web/, i/, status ou statuses, x.com ou twitter.com, a forma encurtada e o LinkedIn
  const f = [];
  for (const p of TEXTO) {
    const t = ler(p);
    for (const m of enderecosDePost(t)) f.push(`${rel(p)}: ${m.slice(0, 60)}`);
  }
  confere('nenhum endereço de post em arquivo nenhum da skill', f);
}

// 3. referências locais de fonte -------------------------------------------------------------
const idsComFonte = new Set(FONTES.map((p) => path.basename(p, '.md')));
{
  const f = [];
  const alvoTexto = [...MDS.filter((p) => !p.startsWith(L + path.sep) || /atualizar|README|CHANGELOG/.test(p)), ...arquivos(path.join(SKILL, 'assets'), (n) => /\.html$/.test(n), ['vendor']), ...arquivos(B, (n) => /\.html$/.test(n))];
  for (const p of alvoTexto) {
    const t = ler(p).replace(/```[\s\S]*?```/g, '');
    for (const m of t.matchAll(/(?<![\w/.-])([12]\d{17,19})(?![\w])/g)) if (!idsComFonte.has(m[1])) f.push(`${rel(p)}: id ${m[1]} sem arquivo em _local/fontes/`);
    for (const m of t.matchAll(/`(_local\/[^`*<>]+)`/g)) {
      if (m[1].includes('<')) continue;
      // a pasta de fonte (e cada subpasta dela) nasce na primeira captura: citar a pasta vale sem ela existir
      if (PASTA_DE_FONTE.test(m[1])) continue;
      if (!fs.existsSync(path.join(SKILL, m[1]))) f.push(`${rel(p)}: ${m[1]}`);
    }
  }
  confere('toda referência local de fonte resolve para um arquivo', f);
}
{
  const f = [];
  for (const p of FONTES) {
    const t = ler(p);
    if (/^url:/m.test(t)) f.push(`${rel(p)}: campo url no cabeçalho`);
    if (/\(a catalogar\)/.test(t)) f.push(`${rel(p)}: imagem "(a catalogar)" (capturada e não vista)`);
    if (/ainda sem triagem/.test(t)) f.push(`${rel(p)}: fonte sem veredito de triagem`);
    const rod = t.match(/\*\*Na biblioteca em:\*\* (.*)$/m);
    if (rod) for (const m of rod[1].matchAll(/`(biblioteca\/[^`]+)`/g)) if (!fs.existsSync(path.join(SKILL, m[1]))) f.push(`${rel(p)}: rodapé aponta ${m[1]}, que não existe`);
    if (/^use_in_skill: true$/m.test(t) && !rod) f.push(`${rel(p)}: use_in_skill true sem o rodapé "Na biblioteca em"`);
    for (const m of t.matchAll(/^  - "(\S+) -> (.+)"$/gm)) {
      const alvo = m[2];
      if (alvo.startsWith('galeria/')) { if (!fs.existsSync(path.join(B, alvo))) f.push(`${rel(p)}: ${m[1]} -> ${alvo} (não existe)`); }
      else if (!/^imagem não guardada: fora do assunto da skill \(.{5,}\)$/.test(alvo)) f.push(`${rel(p)}: ${m[1]} -> destino inválido`);
    }
  }
  confere('o mapa de imagens de cada fonte aponta para a galeria ou para o registro de descarte', f);
}

// 4. contagens declaradas ----------------------------------------------------------------------
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
  const fichas = linhasTabela(path.join(B, '06-produtos', 'README.md'), '## Índice');
  const arquetipos = linhasTabela(path.join(B, '04-tipos-de-tela', 'README.md'), '## Índice dos arquétipos');
  const frases = conta(path.join(B, '07-microcopy', 'banco-de-frases.md'), /^\| \d+ \|/gm);
  const imgs = arquivos(G, (n) => /\.(jpe?g|png)$/i.test(n)).length;
  const declara = [
    ['README.md', /\((\d+) componentes\)/, comp, 'componentes'],
    ['README.md', /\((\d+) fichas\)/, fichas, 'fichas'],
    ['README.md', /banco de (\d+) frases/, frases, 'frases'],
    ['README.md', /galeria\/INDICE\.md\)[^\n]*?\((\d+) imagens\)/, imgs, 'imagens da galeria'],
    ['07-microcopy/banco-de-frases.md', /\*\*Total: (\d+) exemplos\.\*\*/, frases, 'frases (total do banco)'],
    ['07-microcopy/README.md', /Banco com \*\*(\d+) exemplos reais\*\*/, frases, 'frases (README da 07)'],
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

// 5. cobertura.json --------------------------------------------------------------------------
{
  const f = [];
  const C = JSON.parse(ler(path.join(L, 'cobertura.json')));
  const ms = (s) => Date.parse(s);
  // as referências que a pessoa escolheu acompanhar (pode ser nenhuma: {}), pela chave do @
  const refs = C.referencias && typeof C.referencias === 'object' && !Array.isArray(C.referencias) ? C.referencias : null;
  if (!refs) f.push('cobertura.json sem o mapa referencias (sem referência nenhuma, ele é {})');
  const chaveDe = (h) => Object.keys(refs || {}).find((k) => k.toLowerCase() === String(h).toLowerCase());
  const porRef = {};
  for (const p of FONTES) {
    const t = ler(p);
    const dt = (t.match(/^created_at: "([^"]+)"/m) || [])[1];
    if (!dt) { f.push(`${rel(p)}: sem created_at`); continue; }
    const h = (t.match(/^perfil: @(\S+)$/m) || [])[1];
    const k = h && chaveDe(h);
    if (!k) { f.push(`${rel(p)}: perfil ${h ? '@' + h : '(sem o campo)'} fora das referências do cobertura.json`); continue; }
    const r = (porRef[k] ||= { maisNovo: null, incluido: null });
    if (!r.maisNovo || ms(dt) > ms(r.maisNovo)) r.maisNovo = dt;
    if (/^use_in_skill: true$/m.test(t) && (!r.incluido || ms(dt) > ms(r.incluido))) r.incluido = dt;
  }
  for (const [h, e] of Object.entries(refs || {})) {
    const r = porRef[h] || {};
    if (!RE_HANDLE.test(h)) f.push(`referencias: a chave "${h}" não é um @ do X (sem a arroba)`);
    if (!e || Number.isNaN(ms(e.triado_ate))) { f.push(`referencias.${h}: triado_ate não é data ISO`); continue; }
    const temAte = e.ate !== null && e.ate !== undefined;
    if (temAte && Number.isNaN(ms(e.ate))) f.push(`referencias.${h}: ate não é data ISO nem null`);
    if (r.maisNovo && ms(e.triado_ate) < ms(r.maisNovo)) f.push(`referencias.${h}: triado_ate ${e.triado_ate} é anterior ao post mais novo capturado (${r.maisNovo})`);
    if (r.incluido ? !temAte || ms(e.ate) !== ms(r.incluido) : temAte) f.push(`referencias.${h}: ate ${e.ate} difere do post mais novo que entrou na biblioteca (${r.incluido || 'nenhum: ate é null'})`);
    if (temAte && ms(e.ate) > ms(e.triado_ate)) f.push(`referencias.${h}: ate depois de triado_ate`);
  }
  // o fuso das datas de calendário (janela.mjs): ±HH:MM; sem o campo vale -03:00
  if (C.fuso !== undefined) { try { minutosDoFuso(C.fuso); } catch (e) { f.push(e.message); } }
  confere('cobertura.json coerente com o post mais novo em fontes/', f);
}

// 6. galeria ---------------------------------------------------------------------------------
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
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)+\.(?:jpg|png)$/.test(nome || '')) f.push(`${a}: nome fora de <assunto>-<produto>.jpg`);
    const ext = extDe(path.join(G, a));
    if (!ext) f.push(`${a}: o conteúdo não é JPEG nem PNG`);
    else if (!nome.endsWith('.' + ext)) f.push(`${a}: a extensão não bate com o conteúdo (${ext.toUpperCase()})`);
    if (/\d{6,}/.test(nome) || /(^|[-_])(img|image|imagem)([-_]|\d|$)/i.test(nome) || /^img_/i.test(nome) || /^[\d-]+\.(jpg|png)$/.test(nome)) f.push(`${a}: nome que não diz o que mostra (id, img_, image ou só número)`);
  }
  confere('nome de imagem diz o que ela mostra', f);
}

// 7. uma imagem, uma pasta; imagem só na galeria e com a extensão do conteúdo ----------------------
{
  const f = [];
  const porHash = {};
  for (const a of imgsDisco) (porHash[crypto.createHash('md5').update(fs.readFileSync(path.join(G, a))).digest('hex')] ||= []).push(a);
  for (const g of Object.values(porHash)) if (g.length > 1) f.push(`mesma imagem em ${g.length} arquivos: ${g.join(' = ')}`);
  for (const p of arquivos(L, (n) => /\.(jpe?g|png|webp|gif)$/i.test(n))) f.push(`${rel(p)}: imagem dentro de _local/ (imagem só entra na galeria, vista e nomeada)`);
  if (fs.existsSync(path.join(L, 'imagens'))) f.push('_local/imagens/ existe: o download vai para a pasta da captura, fora da skill');
  for (const p of arquivos(SKILL, (n) => /\.(jpe?g|png)$/i.test(n), ['vendor', 'node_modules'])) {
    const ext = extDe(p);
    if (!ext) f.push(`${rel(p)}: o conteúdo não é JPEG nem PNG`);
    else if (!p.toLowerCase().endsWith('.' + ext) && !(ext === 'jpg' && /\.jpeg$/i.test(p))) f.push(`${rel(p)}: a extensão não bate com o conteúdo (${ext.toUpperCase()})`);
  }
  confere('uma imagem, uma pasta; imagem só na galeria; extensão igual ao conteúdo em toda a skill', f);
}

// 8. capturas com nome único (id da captura, ver _local/captura/janela.mjs) ----------------
{
  const f = [];
  const RE_ID = /\d{4}-\d{2}-\d{2}T\d{6}Z/;
  for (const md of MDS) {
    const vistos = new Set();
    for (const l of ler(md).split('\n').filter((x) => /^#/.test(x) && /captura/i.test(x))) {
      if (/captura de \d{2}\/\d{2}\/\d{4}/i.test(l) || (/\d{2}\/\d{2}\/\d{4}/.test(l) && !RE_ID.test(l) && /^#+ *(Exemplos da )?captura/i.test(l))) f.push(`${rel(md)}: seção de captura sem o id ("${l.slice(0, 60)}")`);
      if (vistos.has(l)) f.push(`${rel(md)}: seção repetida ("${l.slice(0, 60)}")`);
      vistos.add(l);
    }
  }
  const J = path.join(B, '08-conteudo-e-crescimento', 'janelas');
  if (fs.existsSync(J)) for (const n of fs.readdirSync(J)) if (!/^\d{4}-\d{2}-\d{2}T\d{6}Z\.md$/.test(n)) f.push(`janelas/${n}: arquivo de janela fora do padrão <id>.md`);
  const BR = path.join(L, 'fontes', '_bruto');
  if (fs.existsSync(BR)) for (const n of fs.readdirSync(BR)) if (!/^(consolidado|descartadas-menos-60)-\d{4}-\d{2}-\d{2}T\d{6}Z\.json$/.test(n)) f.push(`_bruto/${n}: nome fora do padrão <tipo>-<id>.json`);
  const cl = fs.existsSync(path.join(SKILL, 'CHANGELOG.md')) ? ler(path.join(SKILL, 'CHANGELOG.md')).split('\n').filter((l) => /^## /.test(l)) : [];
  const cab = new Set();
  for (const l of cl) { const k = l.split(' — ')[0]; if (cab.has(k)) f.push(`CHANGELOG: entrada repetida ${k}`); cab.add(k); if (!RE_ID.test(k)) f.push(`CHANGELOG: entrada sem o id da captura (${k})`); }
  for (const [a, e] of Object.entries(gal)) if (e.captura !== BASE && !RE_ID.test(e.captura || '')) f.push(`galeria.json ${a}: captura "${e.captura}" sem o id (nem "${BASE}")`);
  for (const p of FONTES) { const c = (ler(p).match(/^captura: "([^"]*)"/m) || [])[1]; if (!c || !RE_ID.test(c)) f.push(`${rel(p)}: sem o campo captura com o id`); }
  confere('toda captura tem nome único (bruto, seções, janela, CHANGELOG, índice, fontes)', f);
}

// 9. índice das fichas = soma das tabelas de posts da ficha ---------------------------------------
{
  const f = [];
  const D6 = path.join(B, '06-produtos');
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
  const num = (s) => Number(String(s).replace(/\*|\./g, '').replace(',', '.')) || 0;
  const linhasIdx = ler(path.join(D6, 'README.md')).split('\n').filter((l) => /^\| \d+ \|/.test(l));
  for (const l of linhasIdx) {
    const c = l.split('|').map((x) => x.trim());
    const arq = (l.match(/\]\(([^)]+\.md)\)\s*\|\s*$/) || [])[1];
    if (!arq || arq === 'outros-produtos.md') continue;
    if (!fs.existsSync(path.join(D6, arq))) { f.push(`índice: ${c[2]} aponta ${arq}, que não existe`); continue; }
    const blocos = {};
    for (const m of ler(path.join(D6, arq)).matchAll(/<!--T:([^>]+)-->([\s\S]*?)<!--\/T-->/g)) {
      const linhas = m[2].split('\n').filter((x) => x.startsWith('|'));
      // a 1ª coluna é a ordem de publicação na série (1 = a primeira), nunca a data do post
      for (const x of linhas) if (!/^\| \d+ \|/.test(x) && !/^\| # \|/.test(x) && !/^\|[-: |]+\|$/.test(x) && !/^\| \*\*total\*\* \|/.test(x)) f.push(`${arq}: linha da tabela ${m[1]} fora do padrão "| <ordem> | views | ..." ("${x.slice(0, 40)}")`);
      (blocos[m[1]] ||= []).push(...linhas.filter((x) => /^\| \d+ \|/.test(x)));
    }
    const chave = Object.keys(blocos).find((k) => norm(c[2]).includes(norm(k)));
    if (!chave) { f.push(`índice: ${c[2]} sem tabela <!--T:Nome--> na ficha ${arq}`); continue; }
    const L2 = blocos[chave];
    const ordens = L2.map((x) => Number(x.split('|')[1])).sort((a, b) => a - b);
    if (ordens.some((o, i) => o !== i + 1)) f.push(`${arq}: a ordem dos posts de ${chave} não vai de 1 a ${ordens.length} sem repetir (${ordens.join(',')})`);
    const v = L2.reduce((s, x) => s + num(x.split('|')[2]), 0), sv = L2.reduce((s, x) => s + num(x.split('|')[3]), 0);
    if (num(c[4].split(' ')[0]) !== L2.length || num(c[5]) !== v || num(c[6]) !== sv) f.push(`índice: ${c[2]} declara ${c[4]}/${c[5]}/${c[6]}, a ficha soma ${L2.length}/${v}/${sv}`);
  }
  confere('o índice das fichas soma as tabelas de posts de cada ficha', f);
}

// 10. a biblioteca não guarda data de calendário (a ordem diz "antes" e "depois") -------------------
{
  const f = [];
  // data solta AAAA-MM-DD; o id da captura (AAAA-MM-DDTHHMMSSZ) e o instante ISO seguem permitidos
  const RE_DATA = /\b\d{4}-\d{2}-\d{2}\b(?!T\d)/;
  for (const md of MDS.filter((p) => p.startsWith(B + path.sep))) ler(md).split('\n').forEach((l, i) => { if (RE_DATA.test(l)) f.push(`${rel(md)}:${i + 1}: data de calendário ("${l.trim().slice(0, 50)}")`); });
  confere('nenhuma data de calendário na biblioteca (só a ordem e o id da captura)', f);
}

const falhas = resultados.filter((r) => r.falhas.length).length;
console.log(falhas ? `\nREPROVADO — ${falhas} de ${resultados.length} verificações falharam` : `\nTUDO CERTO — ${resultados.length} verificações`);
process.exit(falhas ? 1 : 0);
