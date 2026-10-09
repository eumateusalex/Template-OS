// ═══════════════════════════════════════════════════════════════════════════
// servidor · o servidor local do render: serve a peça e o kit, e nunca um segredo
//
// O render fotografa a peça num Chromium, e a peça pede os arquivos dela por
// caminho absoluto (`/carrosseis/<peça>/capa.jpg`). Ele nunca serve a raiz do
// projeto inteira: lá mora o `scripts/.env` com as chaves, e bloquear só o `..`
// deixaria esse arquivo sair pelo nome, pelo `%2eenv` e, no Windows, pelo nome
// curto (`ENV~1`), enquanto um render roda.
//
// O que ele serve: só as BASES que recebe, cada uma um par de prefixo e pasta. As
// de uma peça (`basesDaPeca`) são o kit desta skill, a pasta do HTML (com as
// subpastas dela) e as que o `--servir` acrescenta. Outra pasta da raiz não sai:
// uma peça em `clientes/a/` não alcança `clientes/b/`.
//
// O que ele recusa, e por quê:
//   · trecho que começa com ponto (o .env, o .git), com dois-pontos (o fluxo
//     alternativo do NTFS), barra invertida ou byte nulo, o `..` e o trecho
//     vazio: 404
//   · extensão que a peça não pede (o .json, o .md, a chave .pem): 404. Ela se
//     confere no nome pedido e no nome REAL, porque o nome curto de um
//     `segredo.cssbak` termina em `.CSS`
//   · o caminho REAL fora da pasta da base, ou com trecho que começa com ponto:
//     o nome curto do Windows não começa com ponto, e uma junção leva para fora
//   · pasta: 404, sem listagem
//   · Host que não é o 127.0.0.1 nem o localhost da porta dele: 403. Ele escuta só
//     no 127.0.0.1, mas uma página de fora que religa o próprio nome ao 127.0.0.1
//     (DNS rebinding) chegaria aqui com o nome dela no Host
//   · pedido que o navegador marca como de outro site (`Sec-Fetch-Site`
//     cross-site ou same-site): 403. E toda resposta 200 leva o
//     `Cross-Origin-Resource-Policy: same-origin`, para uma página de fora não
//     incluir um .js daqui por uma tag script
//   · método que não é GET nem HEAD: 405
//
// ⚠️ O caminho é lido CRU, e não pelo `new URL`: o URL resolve o `..` e troca a
// barra invertida pela normal antes de a guarda ver, e a guarda tem de ver o que
// chegou.
// ═══════════════════════════════════════════════════════════════════════════

const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

/** O prefixo pelo qual a peça pede o kit desta skill, onde quer que ela esteja. */
const PREFIXO_DA_SKILL = '.claude/skills/carrossel';

// Só as extensões que uma peça pede: o resto dá 404. O segredo sem ponto no nome
// (o credentials.json, a chave .pem) e o documento de cliente (o .md, o .pdf)
// ficam de fora.
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.avif': 'image/avif',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.mp4': 'video/mp4', '.webm': 'video/webm',
};

/** O trecho de caminho que nunca se serve, antes de olhar o disco. */
const segmentoRuim = (s) => !s || s === '..' || s.startsWith('.') || /[\\:\0]/.test(s);

/** O caminho relativo que sai da pasta, ou que passa por um trecho que começa com ponto. */
const foraDa = (rel) => !rel || rel.startsWith('..') || path.isAbsolute(rel) || rel.split(/[\\/]/).some((p) => p.startsWith('.'));

/** O arquivo mora dentro da pasta? */
const dentro = (arquivo, pasta) => {
  const rel = path.relative(pasta, arquivo);
  return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel);
};

/** Por que um caminho não se serve, para a mensagem de quem o pediu. */
const MOTIVOS = {
  fora: 'fora das pastas que o render serve',
  pedido: 'pedido malformado (codificação quebrada ou sem a barra do começo)',
  recusado: 'trecho recusado (vazio, como na barra dobrada; começa com ponto; é ".."; ou tem dois-pontos, barra invertida ou byte nulo)',
  real: 'o caminho real (por junção, link ou nome curto) sai da pasta ou passa por um trecho que começa com ponto',
  extensao: 'extensão que o render não serve',
};

/**
 * Onde um caminho pedido cai: `{ status }`, com o `arquivo` quando é 200 e o
 * `motivo` (uma chave de MOTIVOS) quando a recusa não é só "não existe".
 * @param {[string, string][]} bases pares de prefixo e pasta
 * @param {string} bruto o `req.url`, cru
 */
function resolve(bases, bruto) {
  let caminho;
  try { caminho = decodeURIComponent(String(bruto).split(/[?#]/)[0]); } catch { return { status: 400, motivo: 'pedido' }; }
  if (!caminho.startsWith('/')) return { status: 400, motivo: 'pedido' };
  const segs = caminho.slice(1).split('/');
  for (const [prefixo, pasta] of bases) {
    const pre = prefixo.split('/');
    if (pre.some((p, i) => segs[i] !== p)) continue;
    const resto = segs.slice(pre.length);
    if (!resto.length || resto.some(segmentoRuim)) return { status: 404, motivo: 'recusado' };
    if (!TIPOS[path.extname(resto[resto.length - 1]).toLowerCase()]) return { status: 404, motivo: 'extensao' };
    let real;
    let raizReal;
    let st;
    try {
      real = fs.realpathSync.native(path.join(pasta, ...resto));
      raizReal = fs.realpathSync.native(pasta);
      st = fs.statSync(real);
    } catch {
      return { status: 404 };
    }
    if (foraDa(path.relative(raizReal, real))) return { status: 404, motivo: 'real' };
    if (!st.isFile()) return { status: 404 };
    if (!TIPOS[path.extname(real).toLowerCase()]) return { status: 404, motivo: 'extensao' };
    return { status: 200, arquivo: real };
  }
  return { status: 404, motivo: 'fora' };
}

/**
 * A raiz do projeto: a primeira pasta com `.claude/`, subindo a partir de `dir`,
 * e parando na pasta do usuário, que não conta: o Claude Code guarda nela o
 * `.claude/` dele, em toda máquina, e servir a partir dela é servir a pasta
 * pessoal inteira. Sem projeto, null. A comparação é pelo caminho real: a
 * pasta do usuário por outra caixa de letra, por uma junção ou pelo nome curto
 * do Windows é a mesma pasta, e para a subida do mesmo jeito.
 * @param {string} dir de onde começar a subir
 * @param {string} [usuario] a pasta do usuário (por padrão, a do sistema; lança quando o sistema não sabe qual é)
 */
function achaRaiz(dir, usuario = os.homedir()) {
  const real = (p) => { try { return fs.realpathSync.native(p); } catch { return path.resolve(p); } };
  const casa = real(usuario);
  for (let atual = path.resolve(dir); real(atual) !== casa; atual = path.dirname(atual)) {
    if (fs.existsSync(path.join(atual, '.claude'))) return atual;
    if (path.dirname(atual) === atual) return null;
  }
  return null;
}

/**
 * As bases de uma peça: o kit desta skill, a pasta do HTML (quando ele mora na
 * raiz, e não na skill) e as do `--servir`. Pasta com trecho que começa com
 * ponto não entra: é onde mora o segredo.
 * @param {{ skill: string, raiz: string | null, html: string, servir?: string[] }} peca
 * @returns {[string, string][]} pares de prefixo e pasta
 */
function basesDaPeca({ skill, raiz, html, servir = [] }) {
  const pastas = [];
  if (!dentro(html, skill)) {
    if (!raiz || !dentro(html, raiz)) throw new Error(`o HTML precisa estar dentro da raiz do projeto ou dentro da skill (${skill}): passe --raiz <pasta do projeto>`);
    const partes = path.relative(raiz, html).split(path.sep);
    if (partes.length < 2) throw new Error(`o HTML está solto na raiz do projeto (${html}): ponha a peça numa pasta, ex.: carrosseis/<peça>/`);
    pastas.push(partes.slice(0, -1).join('/'));
  }
  for (const p of servir) {
    if (!raiz) throw new Error('o --servir precisa da raiz do projeto: passe --raiz <pasta do projeto>');
    pastas.push(String(p).replace(/\\/g, '/').replace(/^\/+|\/+$/g, ''));
  }
  const bases = [[PREFIXO_DA_SKILL, skill]];
  for (const p of pastas) {
    if (p.split('/').some(segmentoRuim)) {
      throw new Error(`a pasta "${p}" tem um trecho que o render não serve (vazio, o ponto no começo, o "..", os dois-pontos ou a barra invertida)`);
    }
    if (!bases.some(([b]) => b === p)) bases.push([p, path.join(raiz, ...p.split('/'))]);
  }
  return bases;
}

/**
 * Sobe o servidor, só no 127.0.0.1.
 * @param {{ bases: [string, string][], porta?: number, aoFaltar?: (caminho: string, r: { status: number, motivo?: string }) => void, quais?: (caminho: string) => boolean, limite?: number }} opcoes
 *   `aoFaltar` recebe o pedido da própria página (o navegador o marca com
 *   `Sec-Fetch-Site: same-origin`) que não deu 200 e que `quais` aceita (o
 *   render conta só imagem), cada caminho uma vez, até `limite` caminhos: o
 *   pedido de outro programa não entra na conta da peça
 * @returns {Promise<{ servidor: import('node:http').Server, porta: number }>} rejeita com o erro do listen (a porta ocupada)
 */
function sobeServidor({ bases, porta = 0, aoFaltar, quais = () => true, limite = 50 }) {
  const avisados = new Set();
  const atende = (req, res) => {
    const aberta = servidor.address().port;
    if (![`127.0.0.1:${aberta}`, `localhost:${aberta}`].includes(String(req.headers.host || '').toLowerCase())) { res.writeHead(403).end(); return; }
    const site = req.headers['sec-fetch-site'];
    if (site === 'cross-site' || site === 'same-site') { res.writeHead(403).end(); return; }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { allow: 'GET, HEAD' }).end(); return; }
    const pedido = String(req.url).split(/[?#]/)[0];
    const falta = (r) => {
      if (!aoFaltar || site !== 'same-origin' || !quais(pedido)) return;
      if (avisados.has(pedido) || avisados.size >= limite) return;
      avisados.add(pedido);
      aoFaltar(pedido, r);
    };
    const r = resolve(bases, req.url);
    if (r.status !== 200) { falta(r); res.writeHead(r.status).end(); return; }
    // o arquivo se abre ANTES do 200: o que some, ou que outro processo trancou,
    // dá 404, e não um 200 com a conexão cortada
    let fd;
    try { fd = fs.openSync(r.arquivo, 'r'); } catch { falta({ status: 404 }); res.writeHead(404).end(); return; }
    res.writeHead(200, {
      'content-type': TIPOS[path.extname(r.arquivo).toLowerCase()],
      'x-content-type-options': 'nosniff',
      'cross-origin-resource-policy': 'same-origin',
      'cache-control': 'no-store',
    });
    if (req.method === 'HEAD') { fs.closeSync(fd); res.end(); return; }
    // rede de segurança: com o arquivo já aberto, nenhum pedido HTTP chega a um
    // erro de leitura; se chegar, a conexão cai e o servidor segue
    fs.createReadStream(r.arquivo, { fd }).on('error', () => res.destroy()).pipe(res);
  };
  // rede de segurança: nenhum pedido HTTP chega aqui. O que escapar vira 500, e
  // não derruba o render no meio da peça
  const servidor = http.createServer((req, res) => {
    try { atende(req, res); } catch { if (!res.headersSent) res.writeHead(500); res.end(); }
  });
  return new Promise((ok, falha) => {
    servidor.once('error', falha);
    servidor.listen(porta, '127.0.0.1', () => ok({ servidor, porta: servidor.address().port }));
  });
}

module.exports = { PREFIXO_DA_SKILL, TIPOS, MOTIVOS, dentro, resolve, achaRaiz, basesDaPeca, sobeServidor };
