#!/usr/bin/env node
/**
 * raspar.js — site de terceiro vira markdown limpo, via API do Firecrawl.
 *
 * O motor da skill /raspar. A skill decide O QUE raspar e onde salvar; este
 * arquivo só executa e devolve JSON no stdout.
 *
 * Configuração lida de scripts/.env:
 *   FIRECRAWL=fc-...   (chave da API, plano free = 1000 créditos/mês)
 *
 * Comandos:
 *   node scripts/raspar.js creditos
 *   node scripts/raspar.js pagina <url> [--saida arquivo.md] [--completo]
 *   node scripts/raspar.js mapa   <url> [--limite N]
 *   node scripts/raspar.js site   <url> [--limite N] [--saida pasta/]
 *   node scripts/raspar.js extrair <url> --pedido "o que extrair"
 *   node scripts/raspar.js buscar "consulta" [--limite N]
 *
 * Custo em créditos por chamada (o que a API cobra, não estimativa):
 *   creditos  0  |  pagina 1  |  mapa 1
 *   extrair   5  ← a extração com IA custa 5x uma página, não 1
 *   site      1 por página raspada
 *   buscar    varia com o número de resultados (3 resultados custaram 2)
 *
 * ⚠️ Dois comandos gastam em escala, e por motivos diferentes:
 *   - `site`, porque multiplica pelo número de páginas. Limite padrão 10, e
 *     acima de LIMITE_ALERTA exige --confirmo.
 *   - `extrair`, porque cada chamada já sai por 5. Extrair 20 páginas custa
 *     100 créditos, 10% do ciclo mensal do plano free.
 * Ver a armadilha 1 no SKILL.md.
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const API = 'https://api.firecrawl.dev/v2';

const LIMITE_PADRAO = 10;   // páginas, no comando `site`
const LIMITE_ALERTA = 30;   // acima disso, exige --confirmo
const TENTATIVAS = 4;
const ESPERA_MS = 3000;
const CRAWL_TIMEOUT_MS = 10 * 60 * 1000;

// ── Carregamento do .env (scripts/.env do workspace) ──────────
// Mesmo formato de nome do gerar-imagem.js: [A-Z][A-Z0-9_]*, porque regra só
// com letras descarta em silêncio linhas como META_API_V2=.

function carregarEnv() {
  const envPath = path.join(RAIZ, 'scripts', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const linha of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

function chave() {
  carregarEnv();
  // FIRECRAWL é o nome deste workspace no .env. FIRECRAWL_API_KEY é o nome
  // que a documentação oficial usa, e vale como alternativa pra quem copiar
  // um exemplo de fora e colar aqui.
  const k = (process.env.FIRECRAWL || process.env.FIRECRAWL_API_KEY || '')
    .trim().replace(/^["']|["']$/g, '');
  if (!k) {
    throw new Error(
      'Chave não encontrada. Adicione a linha FIRECRAWL=fc-... em scripts/.env ' +
      '(pegue em firecrawl.dev → Dashboard → API Keys).'
    );
  }
  return k;
}

// ── Chamada à API, com repetição ──────────────────────────────
// A regra do workspace manda tentar 3+ vezes em serviço externo antes de
// desistir. 402 (sem crédito) e 401 (chave inválida) não se repetem: repetir
// não muda o resultado e só queima tempo.

const NAO_REPETE = new Set([400, 401, 402, 403, 404]);

async function chamar(rota, corpo, metodo = 'POST') {
  // Aceita rota relativa ("/scrape") ou URL absoluta, porque o campo `next`
  // da paginação do crawl vem como URL inteira.
  const url = /^https?:\/\//.test(rota) ? rota : `${API}${rota}`;
  const opcoes = {
    method: metodo,
    headers: {
      Authorization: `Bearer ${chave()}`,
      'Content-Type': 'application/json',
    },
  };
  if (corpo) opcoes.body = JSON.stringify(corpo);

  let ultimoErro;
  for (let i = 1; i <= TENTATIVAS; i++) {
    try {
      const r = await fetch(url, opcoes);
      const texto = await r.text();
      let dados;
      try {
        dados = JSON.parse(texto);
      } catch {
        throw new Error(`Resposta não é JSON (HTTP ${r.status}): ${texto.slice(0, 200)}`);
      }
      if (!r.ok) {
        const msg = dados.error || dados.message || `HTTP ${r.status}`;
        if (NAO_REPETE.has(r.status)) {
          if (r.status === 402) {
            throw new Error(`Sem créditos no plano. Veja com: node scripts/raspar.js creditos`);
          }
          if (r.status === 401) throw new Error('Chave rejeitada (401). Confira FIRECRAWL em scripts/.env.');
          throw new Error(`${msg} (HTTP ${r.status}, não se repete)`);
        }
        throw new Error(`${msg} (HTTP ${r.status})`);
      }
      return dados;
    } catch (e) {
      ultimoErro = e;
      if (/não se repete|Sem créditos|Chave rejeitada|Chave não encontrada/.test(e.message)) throw e;
      if (i < TENTATIVAS) {
        console.error(`  tentativa ${i}/${TENTATIVAS} falhou (${e.message}). Repetindo...`);
        await new Promise(r => setTimeout(r, ESPERA_MS * i));
      }
    }
  }
  throw new Error(
    `Falhou ${TENTATIVAS} vezes: ${ultimoErro.message}. ` +
    'Pergunte ao usuário como proceder em vez de improvisar outro caminho.'
  );
}

// ── Utilidades ────────────────────────────────────────────────

// Nome de arquivo a partir da URL. O corte em 80 caracteres não é estética:
// slug de blog passa fácil de 150 e o Windows para em 260 no caminho inteiro,
// então URL longa quebraria a gravação com ENAMETOOLONG. O índice numérico que
// o `site` põe na frente é quem garante a unicidade, não este nome.
const APELIDO_MAX = 80;

function apelido(url) {
  try {
    const u = new URL(url);
    const caminho = u.pathname.replace(/\/+$/, '').replace(/^\/+/, '').replace(/[^\w.-]+/g, '-');
    const base = u.hostname.replace(/^www\./, '').replace(/[^\w.-]+/g, '-');
    const nome = caminho ? `${base}--${caminho}` : base;
    return nome.length > APELIDO_MAX ? nome.slice(0, APELIDO_MAX).replace(/-+$/, '') : nome;
  } catch {
    return 'pagina';
  }
}

function salvar(destino, conteudo) {
  const abs = path.isAbsolute(destino) ? destino : path.join(RAIZ, destino);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, conteudo, 'utf8');
  return path.relative(RAIZ, abs).replace(/\\/g, '/');
}

function cabecalho(meta, url) {
  return [
    '---',
    // Aspas nos dois: URL tem `:` e título tem de tudo. Sem isso o YAML quebra
    // na hora de alguém ler o arquivo de volta.
    `fonte: ${JSON.stringify(url)}`,
    `titulo: ${JSON.stringify(meta?.title || '')}`,
    `raspado_em: ${new Date().toISOString()}`,
    '---',
    '',
  ].join('\n');
}

function saida(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

// ── Comandos ──────────────────────────────────────────────────

async function cmdCreditos() {
  const r = await chamar('/team/credit-usage', null, 'GET');
  const d = r.data || {};
  saida({
    ok: true,
    creditos_restantes: d.remainingCredits,
    creditos_do_plano: d.planCredits,
    ciclo_termina_em: d.billingPeriodEnd,
  });
}

async function cmdPagina(url, opts) {
  const r = await chamar('/scrape', {
    url,
    formats: ['markdown'],
    onlyMainContent: !opts.completo,
  });
  const d = r.data || {};
  const md = d.markdown || '';
  const destino = opts.saida || `dados/raspado/${apelido(url)}.md`;
  const arquivo = salvar(destino, cabecalho(d.metadata, url) + md);
  saida({
    ok: true,
    arquivo,
    titulo: d.metadata?.title || null,
    status_http: d.metadata?.statusCode ?? null,
    caracteres: md.length,
    creditos_usados: d.metadata?.creditsUsed ?? 1,
  });
}

async function cmdMapa(url, opts) {
  const corpo = { url };
  if (opts.limite) corpo.limit = opts.limite;
  const r = await chamar('/map', corpo);
  const links = (r.links || []).map(l => (typeof l === 'string' ? { url: l } : l));
  saida({
    ok: true,
    total: links.length,
    rotas: links.map(l => l.url),
    creditos_usados: 1,
  });
}

async function cmdSite(url, opts) {
  const limite = opts.limite || LIMITE_PADRAO;
  if (limite > LIMITE_ALERTA && !opts.confirmo) {
    throw new Error(
      `Limite de ${limite} páginas gasta até ${limite} créditos. ` +
      `Acima de ${LIMITE_ALERTA} exige --confirmo. Rode antes: node scripts/raspar.js mapa ${url}`
    );
  }

  const inicio = await chamar('/crawl', {
    url,
    limit: limite,
    scrapeOptions: { formats: ['markdown'], onlyMainContent: true },
  });
  const id = inicio.id;
  if (!id) throw new Error(`A API não devolveu id de crawl: ${JSON.stringify(inicio).slice(0, 200)}`);

  console.error(`  crawl ${id} iniciado, aguardando (limite ${limite} páginas)...`);
  const prazo = Date.now() + CRAWL_TIMEOUT_MS;
  let r;
  while (true) {
    await new Promise(s => setTimeout(s, 5000));
    r = await chamar(`/crawl/${id}`, null, 'GET');
    if (r.status === 'completed' || r.status === 'failed' || r.status === 'cancelled') break;
    console.error(`  ...${r.status}: ${r.completed ?? 0}/${r.total ?? '?'} páginas`);
    if (Date.now() > prazo) {
      throw new Error(`Crawl passou de ${CRAWL_TIMEOUT_MS / 60000} min sem terminar (id ${id}).`);
    }
  }
  if (r.status !== 'completed') throw new Error(`Crawl terminou como "${r.status}".`);

  // ⚠️ A resposta pagina a cada 10MB e avisa pelo campo `next`. Ignorar isso
  // salva só a primeira fatia e mente o total, sem erro nenhum. Seguir o
  // `next` até acabar.
  const paginas = [...(r.data || [])];
  let proxima = r.next;
  let fatias = 1;
  while (proxima) {
    fatias++;
    console.error(`  ...baixando fatia ${fatias} (resposta passou de 10MB)`);
    const p = await chamar(proxima, null, 'GET');
    paginas.push(...(p.data || []));
    proxima = p.next;
    if (fatias > 200) throw new Error('Paginação do crawl passou de 200 fatias. Algo está errado.');
  }

  // `total` é quantas páginas o crawl processou. Se o que salvamos não bate,
  // é melhor falhar alto do que entregar site pela metade dizendo que é inteiro.
  if (typeof r.total === 'number' && r.total > 0 && paginas.length < r.total) {
    console.error(
      `  AVISO: a API contou ${r.total} páginas e só ${paginas.length} vieram no corpo. ` +
      'Entregando o que veio, mas o site NÃO está inteiro.'
    );
  }

  const pasta = (opts.saida || `dados/raspado/${apelido(url)}`).replace(/\/+$/, '');
  const arquivos = paginas.map((p, i) => {
    const fonte = p.metadata?.sourceURL || p.metadata?.url || `${url}#${i}`;
    const nome = `${String(i + 1).padStart(2, '0')}-${apelido(fonte)}.md`;
    return salvar(path.join(pasta, nome), cabecalho(p.metadata, fonte) + (p.markdown || ''));
  });

  const indice = [
    `# ${apelido(url)}`,
    '',
    `Raspado em ${new Date().toISOString()} · ${arquivos.length} páginas.`,
    '',
    ...paginas.map((p, i) => `- [${p.metadata?.title || arquivos[i]}](${path.basename(arquivos[i])}) — ${p.metadata?.sourceURL || ''}`),
    '',
  ].join('\n');
  const idx = salvar(path.join(pasta, 'INDICE.md'), indice);

  saida({
    ok: true,
    // path.dirname do índice já é a pasta certa, relativa à raiz e com barra
    // normal. Montar de novo com path.join(RAIZ, pasta) quebra quando --saida
    // vem absoluto.
    pasta: path.dirname(idx),
    indice: idx,
    paginas: arquivos.length,
    paginas_contadas_pela_api: r.total ?? null,
    creditos_usados: arquivos.length,
  });
}

async function cmdExtrair(url, opts) {
  if (!opts.pedido) throw new Error('extrair exige --pedido "o que você quer tirar da página".');
  const r = await chamar('/scrape', {
    url,
    formats: [{ type: 'json', prompt: opts.pedido }],
  });
  const d = r.data || {};
  const resultado = { ok: true, fonte: url, pedido: opts.pedido, dados: d.json ?? null, creditos_usados: d.metadata?.creditsUsed ?? 1 };
  if (opts.saida) resultado.arquivo = salvar(opts.saida, JSON.stringify(d.json ?? {}, null, 2));
  saida(resultado);
}

async function cmdBuscar(consulta, opts) {
  const r = await chamar('/search', { query: consulta, limit: opts.limite || 5 });
  const web = r.data?.web || r.data || [];
  saida({
    ok: true,
    consulta,
    resultados: (Array.isArray(web) ? web : []).map(x => ({
      titulo: x.title, url: x.url, resumo: x.description,
    })),
  });
}

// ── Linha de comando ──────────────────────────────────────────

function lerArgs(argv) {
  const soltos = [];
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--completo') opts.completo = true;
    else if (a === '--confirmo') opts.confirmo = true;
    // `--limite abc` virava NaN e caía calado no padrão 10. Num comando que
    // gasta crédito por página, errar o limite em silêncio é caro.
    else if (a === '--limite') {
      const n = parseInt(argv[++i], 10);
      if (!Number.isFinite(n) || n < 1) throw new Error(`--limite precisa de um número inteiro maior que 0.`);
      opts.limite = n;
    }
    // Mesma lógica do --limite: opção sem valor virava `undefined` e caía
    // calada no padrão. `--saida` vazio salvava no lugar errado em silêncio.
    else if (a === '--saida') opts.saida = valorDe(argv, ++i, '--saida');
    else if (a === '--pedido') opts.pedido = valorDe(argv, ++i, '--pedido');
    else if (a.startsWith('--')) throw new Error(`Opção desconhecida: ${a}`);
    else soltos.push(a);
  }
  return { soltos, opts };
}

function valorDe(argv, i, nome) {
  const v = argv[i];
  if (v === undefined || v.startsWith('--')) throw new Error(`${nome} precisa de um valor logo depois.`);
  return v;
}

const AJUDA = `
raspar.js — site vira markdown limpo (Firecrawl)

  creditos                                   quanto sobrou no ciclo   (0)
  pagina  <url> [--saida f.md] [--completo]  uma página               (1)
  mapa    <url> [--limite N]                 lista as rotas           (1)
  site    <url> [--limite N] [--saida p/]    site inteiro   (1 por página)
  extrair <url> --pedido "..."               dado estruturado         (5)
  buscar  "consulta" [--limite N]            busca na web         (varia)

Saída padrão: dados/raspado/. Chave: FIRECRAWL em scripts/.env.
`;

async function main() {
  const [comando, ...resto] = process.argv.slice(2);
  if (!comando || comando === '--help' || comando === '-h') {
    console.log(AJUDA.trim());
    return;
  }
  const { soltos, opts } = lerArgs(resto);

  // URL é um argumento só; consulta de busca são várias palavras. Sem esta
  // distinção, `buscar implantacao de IA` sem aspas buscava só "implantacao" e
  // jogava o resto fora sem avisar.
  const precisaUrl = () => {
    if (!soltos.length) throw new Error(`O comando "${comando}" precisa de uma URL. Veja --help.`);
    if (soltos.length > 1) {
      throw new Error(`"${comando}" recebe uma URL só, e vieram ${soltos.length}: ${soltos.join(' ')}`);
    }
    return soltos[0];
  };
  const precisaConsulta = () => {
    if (!soltos.length) throw new Error('buscar precisa de uma consulta. Veja --help.');
    return soltos.join(' ');
  };

  switch (comando) {
    case 'creditos': return cmdCreditos();
    case 'pagina':   return cmdPagina(precisaUrl(), opts);
    case 'mapa':     return cmdMapa(precisaUrl(), opts);
    case 'site':     return cmdSite(precisaUrl(), opts);
    case 'extrair':  return cmdExtrair(precisaUrl(), opts);
    case 'buscar':   return cmdBuscar(precisaConsulta(), opts);
    default:
      throw new Error(`Comando desconhecido: "${comando}". Veja --help.`);
  }
}

main().catch(e => {
  console.error(`ERRO: ${e.message}`);
  process.exit(1);
});
