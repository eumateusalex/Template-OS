#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// render-carrossel · cada .slide de um carrossel.html vira um JPEG 2160×2700
//
// Uso:
//   node .claude/skills/carrossel/render/render-carrossel.js carrosseis/<peça>/carrossel.html
//   node .claude/skills/carrossel/render/render-carrossel.js <html> <pasta-de-saida>
//   node .claude/skills/carrossel/render/render-carrossel.js --catalogo
//
// Opções:
//   --raiz <pasta>   a raiz do projeto (por padrão, a pasta que contém `.claude/`,
//                    achada subindo a partir do HTML)
//   --catalogo       só serve o catálogo do kit e mostra a URL, sem tirar JPEG
//   --checar         só confere se o Playwright e o Chromium abrem (sai 0 ou 2)
//   --porta <n>      porta fixa do servidor (por padrão, a primeira livre)
//   --servir <pasta> mais uma pasta da raiz que a peça pode pedir (repetível)
//
// É .js (CommonJS) e não .mjs porque o Playwright se instala nesta pasta e o
// package.json daqui declara "commonjs"; os outros scripts da skill são .mjs
// e não dependem de nada.
//
// Como funciona: o script sobe um servidor HTTP próprio (servidor.js), na porta
// que estiver livre, só no 127.0.0.1. Ele serve o caminho absoluto da peça
// (`/carrosseis/<peça>/capa.jpg`) na pasta do HTML (com as subpastas dela) e nas
// do `--servir`; o prefixo `/.claude/skills/carrossel/` é mapeado pra pasta desta
// skill onde quer que ela esteja. O resto da raiz não sai, e o `scripts/.env`
// nunca: o servidor recusa trecho que começa com ponto, extensão que a peça não
// pede, pasta, pedido de outro site e Host de fora. A raiz do projeto é a pasta
// com `.claude/` acima do HTML, menos a sua pasta de usuário (a `.claude/` do
// Claude Code mora nela em toda máquina): fora de projeto, passe --raiz.
//
// Sai 0 com os JPEGs gravados. Sai 1 quando o problema é a PEÇA: fonte que não
// carregou (nada é gravado), imagem que não veio, JPEG acima de 3 MB, HTML fora
// de projeto. Sai 2 quando o problema é o AMBIENTE: Playwright ou Chromium
// ausentes, porta ocupada.
//
// JPEG e não PNG: a API de publicação do Instagram só aceita JPEG (até 8 MB
// na documentação da Meta). Qualidade 92 fica visualmente igual e cabe.
// ═══════════════════════════════════════════════════════════════════════════

const fs = require('node:fs');
const path = require('node:path');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (e) {
  // ausente é uma coisa; presente que não carrega é outra (sem a pasta do usuário
  // no sistema, o próprio Playwright cai ao carregar), e o recado de instalar
  // mandaria reinstalar à toa
  console.error(e.code === 'MODULE_NOT_FOUND'
    ? 'Playwright não encontrado. Rode `npm run instalar` dentro de render/ (render/instalar.md)'
    : `O Playwright está instalado mas não carregou (${e.code || e.message.split('\n')[0]}): confira o ambiente, como a pasta do usuário no sistema`);
  process.exit(2);
}

const PESO_MAXIMO = 3 * 1024 * 1024; // folga sobre o teto de 8 MB da API do Instagram

// ─── argumentos ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const pega = (flag) => { const i = args.indexOf(flag); return i > -1 ? args[i + 1] : null; };
const soCatalogo = args.includes('--catalogo');
const soChecar = args.includes('--checar');

if (soChecar) {
  chromium.launch().then(async (b) => {
    await b.close();
    console.log('Playwright e Chromium no lugar.');
    process.exit(0);
  }).catch((e) => {
    console.error(`O Chromium não abriu: ${e.message.split('\n')[0]}`);
    console.error('Rode `npm run instalar` dentro de render/ (render/instalar.md)');
    process.exit(2);
  });
}
const COM_VALOR = ['--raiz', '--porta', '--servir'];
const posicionais = args.filter((a, i) => !a.startsWith('--') && !COM_VALOR.includes(args[i - 1]));
const servir = args.flatMap((a, i) => (a === '--servir' && args[i + 1] ? [args[i + 1]] : []));

// A raiz, as pastas que a peça pode pedir e o que o servidor recusa: servidor.js.
const { PREFIXO_DA_SKILL, TIPOS, MOTIVOS, dentro, achaRaiz, basesDaPeca, sobeServidor } = require('./servidor.js');

const SKILL = path.resolve(__dirname, '..');
const PREFIXO = `/${PREFIXO_DA_SKILL}/`;

const htmlArg = soCatalogo ? path.join(SKILL, 'kit', 'catalogo.html') : posicionais[0];
if (soChecar) {
  // nada abaixo roda; o --checar responde sozinho lá em cima
} else if (!htmlArg) {
  console.error('uso: node render-carrossel.js <carrossel.html> [pasta-de-saida] [--raiz <pasta>]');
  process.exit(1);
}
const HTML = soChecar ? __filename : path.resolve(htmlArg);
if (!fs.existsSync(HTML)) {
  console.error(`arquivo não encontrado: ${HTML}`);
  process.exit(1);
}

const raizArg = pega('--raiz');
let RAIZ = raizArg ? path.resolve(raizArg) : null; // sem --raiz, procurada abaixo, só quando a peça precisa

/** O caminho da peça como URL: pelo prefixo da skill se ela mora na skill, senão pela raiz. */
function urlDoHtml() {
  if (dentro(HTML, SKILL)) return PREFIXO + path.relative(SKILL, HTML).split(path.sep).join('/');
  return '/' + path.relative(RAIZ, HTML).split(path.sep).join('/');
}

const SAIDA = path.resolve(posicionais[1] || path.join(path.dirname(HTML), 'instagram'));

// ─── servidor ──────────────────────────────────────────────────────────────

const ehImagem = (caminho) => (TIPOS[path.extname(caminho).toLowerCase()] || '').startsWith('image/');
const faltando = new Map(); // o caminho pedido → o motivo da recusa ('' quando só não existe)

let BASES = [];
if (!soChecar) {
  // a raiz só faz falta à peça de fora da skill e ao --servir: o catálogo e o
  // modelo rodam sem ela
  if (!RAIZ && (!dentro(HTML, SKILL) || servir.length)) {
    try {
      RAIZ = achaRaiz(path.dirname(HTML));
    } catch (e) {
      // rede de segurança: com o Playwright de hoje, a falta da pasta do usuário
      // para o render antes, no require lá em cima
      console.error(`não deu para saber a sua pasta de usuário (${e.code || e.message}): passe --raiz <pasta do projeto>`);
      process.exit(2);
    }
    if (!RAIZ) {
      console.error('nenhuma pasta de projeto (com .claude/) acima do HTML, e a da sua pasta de usuário não conta: passe --raiz <pasta do projeto>');
      process.exit(1);
    }
  }
  try {
    BASES = basesDaPeca({ skill: SKILL, raiz: RAIZ, html: HTML, servir });
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
let servidor; // sobe no render, abaixo; quem sai no meio o derruba

// ─── render ────────────────────────────────────────────────────────────────

if (!soChecar) (async () => {
  const porta = Number(pega('--porta')) || 0;
  try {
    ({ servidor } = await sobeServidor({
      bases: BASES,
      porta,
      // o catálogo fica no ar e não lista imagem: ele não conta o que faltou
      aoFaltar: soCatalogo ? undefined : (caminho, r) => { faltando.set(caminho, r.motivo || ''); },
      quais: ehImagem,
    }));
  } catch (e) {
    console.error(e.code === 'EADDRINUSE'
      ? `a porta ${porta} está ocupada: rode sem --porta (o render pega uma livre) ou com outra`
      : `o servidor do render não subiu: ${e.message}`);
    process.exit(2);
  }
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const url = base + urlDoHtml();

  if (soCatalogo) {
    console.log(`catálogo servido em ${url}\n(Ctrl+C pra encerrar)`);
    return; // o servidor fica no ar
  }

  if (RAIZ) console.log(`raiz do projeto: ${RAIZ}`);
  console.log(`peça: ${url}`);

  fs.mkdirSync(SAIDA, { recursive: true });

  let browser;
  try {
    browser = await chromium.launch();
  } catch (e) {
    console.error(`O Chromium não abriu: ${e.message.split('\n')[0]}`);
    console.error('Rode `npm run instalar` dentro de render/ (render/instalar.md)');
    servidor.close();
    process.exit(2);
  }
  const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1080, height: 1350 } });

  const fontesQueFalharam = new Set();
  const ehFonte = (u) => /\.(woff2?|ttf|otf)(\?|$)/i.test(u);
  page.on('response', (r) => { if (ehFonte(r.url()) && r.status() >= 400) fontesQueFalharam.add(r.url()); });
  page.on('requestfailed', (r) => { if (ehFonte(r.url())) fontesQueFalharam.add(r.url()); });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);

  // `document.fonts.ready` resolve mesmo quando a fonte não veio, e
  // `document.fonts.check()` responde "sim" pra qualquer família que não tenha
  // @font-face declarado. Nenhum dos dois serve. O que serve é pedir pra
  // carregar cada família declarada nos tokens: `document.fonts.load()` devolve
  // lista vazia quando não existe @font-face pra ela (o @import não veio) e
  // rejeita quando o arquivo da fonte falhou. Nos dois casos a peça sairia na
  // fonte de sistema.
  const faltam = async () => page.evaluate(async () => {
    const css = getComputedStyle(document.documentElement);
    const primarias = ['--f-display', '--f-serif', '--f-mono']
      .map((v) => css.getPropertyValue(v).split(',')[0].trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean);
    const sem = [];
    for (const fam of primarias) {
      try {
        const faces = await document.fonts.load(`16px "${fam}"`, 'Aáçãêõ 0123');
        if (!faces.length) sem.push(fam);
      } catch { sem.push(fam); }
    }
    return sem;
  });

  if (fontesQueFalharam.size) console.warn(`  (aviso) ${fontesQueFalharam.size} arquivo(s) de fonte não vieram; em geral é subset não usado`);
  let sem = await faltam();
  if (sem.length) {
    console.warn(`  fonte não carregou (${sem.join(', ')}); tentando de novo`);
    await page.reload({ waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(800);
    sem = await faltam();
    if (sem.length) {
      console.error(`  ERRO: a peça renderizaria na fonte de sistema (não carregou: ${sem.join(', ')}). Nenhum JPEG gravado.`);
      console.error('  Confira o @import no marca/tokens.css e a conexão com fonts.googleapis.com');
      await browser.close();
      servidor.close();
      process.exit(1);
    }
    console.warn('  ok na segunda tentativa');
  }

  const slides = await page.$$('.slide');
  console.log(`slides encontrados: ${slides.length}`);
  const pesados = [];
  const foraDe45 = [];
  let i = 0;
  for (const s of slides) {
    i++;
    const nome = `slide-${String(i).padStart(2, '0')}.jpg`;
    const caixa = await s.boundingBox();
    if (!caixa || Math.abs(caixa.width / caixa.height - 0.8) > 0.005) foraDe45.push(`${nome} (${Math.round(caixa?.width)}×${Math.round(caixa?.height)})`);
    const arquivo = path.join(SAIDA, nome);
    await s.screenshot({ path: arquivo, type: 'jpeg', quality: 92 });
    if (fs.statSync(arquivo).size > PESO_MAXIMO) pesados.push(`${nome} (${(fs.statSync(arquivo).size / 1024 / 1024).toFixed(1)} MB)`);
    const rel = path.relative(process.cwd(), arquivo);
    console.log(`  ${rel.startsWith('..') ? arquivo : rel}`);
  }
  await browser.close();
  servidor.close();

  if (!slides.length) {
    console.error('nenhum .slide encontrado; confira o arquivo de entrada');
    process.exit(1);
  }
  let erro = false;
  if (faltando.size) {
    erro = true;
    console.error(`\nERRO: ${faltando.size} imagem(ns) da peça não vieram (o slide saiu sem ela):`);
    for (const [f, motivo] of faltando) console.error(`  ${f}${motivo ? `  (${MOTIVOS[motivo]})` : ''}`);
    console.error('Caminho de imagem é absoluto a partir da raiz do projeto, ex.: /carrosseis/<peça>/capa.jpg');
    if ([...faltando.values()].includes('fora')) {
      console.error(`O render serve ${BASES.map(([p]) => `${p}/`).join(', ')}; imagem noutra pasta entra com --servir <pasta>`);
    }
  }
  if (pesados.length) {
    erro = true;
    console.error(`\nERRO: JPEG acima de 3 MB, a API do Instagram recusa: ${pesados.join(', ')}. Reduza a imagem de origem.`);
  }
  if (foraDe45.length) {
    erro = true;
    console.error(`\nERRO: slide fora da proporção 4:5: ${foraDe45.join(', ')}. Algum estilo mexeu no tamanho do .slide.`);
  }
  if (erro) process.exit(1);
  console.log(`\n${slides.length} slide(s) em ${SAIDA}, todos em 4:5 e abaixo de 3 MB.`);
})().catch((e) => {
  console.error(e);
  if (servidor) servidor.close();
  process.exit(1);
});
