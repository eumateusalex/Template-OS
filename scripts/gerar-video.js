#!/usr/bin/env node
/**
 * Gera vídeo via Veo na Vertex AI.
 *
 * Irmão do `gerar-imagem.js`: mesma conta, mesmo projeto, mesma autenticação
 * pelo gcloud (sem chave de API). Serve para gerar Reels pelo mesmo motor da
 * imagem, em vez de uma ferramenta de fora: os cinco modelos Veo respondem pela
 * Vertex AI, no mesmo projeto.
 *
 * Uso:
 *   node scripts/gerar-video.js --prompt "..." --saida previa/plano-1.mp4 --dry-run
 *   node scripts/gerar-video.js --prompt-file plano.txt --saida x.mp4 --confirmo
 *   node scripts/gerar-video.js --prompt "..." --ref quadro.png --saida y.mp4 --confirmo
 *
 * 🚨 GASTA DINHEIRO DE VERDADE, e muito mais que imagem: um plano de 8s no
 * modelo bom custa mais que vinte imagens. Por isso o script EXIGE `--dry-run`
 * ou `--confirmo`. Sem uma das duas ele se recusa a rodar — não existe caminho
 * em que uma linha de comando distraída queime crédito.
 *
 * O padrão é 9:16 (Reels) e o modelo `fast`. Mude para `--modelo bom` só quando
 * o plano já estiver fechado no barato: a variação entre gerações é grande, e
 * escolher no caro é jogar dinheiro fora.
 *
 * Configuração lida de scripts/.env:
 *   GOOGLE_CLOUD_PROJECT — projeto usado na Vertex AI
 *   GCLOUD_PATH          — opcional, se o gcloud não estiver nos lugares padrão
 *
 * A receita da autenticação (por que Vertex e não AI Studio) está em
 * `scripts/guia-geracao-imagem-vertex-ai.md`. Vale igual aqui.
 */

const path = require('path');
const fs = require('fs');
// o gcloud e o token efêmero vêm da fonte única do workspace, que monta a lista
// na hora de achar o gcloud, depois do scripts/.env
const { tokenVertex } = require('./lib/vertex.js');

const RAIZ = path.resolve(__dirname, '..');

// Veo NÃO atende em `global` como os modelos de imagem: é endpoint regional.
const REGIAO = 'us-central1';
const VERTEX_BASE = `https://${REGIAO}-aiplatform.googleapis.com/v1`;

// 🚨 Os nomes saem da LISTA do próprio Vertex, não da documentação: os
// `veo-3.1-*-preview` da doc devolvem 404, e os que existem de verdade
// terminam em `-001`. Para reconferir um dia:
//   GET {REGIAO}-aiplatform.googleapis.com/v1beta1/publishers/google/models
const MODELOS = {
  lite: 'veo-3.1-lite-generate-001',
  fast: 'veo-3.1-fast-generate-001',
  bom: 'veo-3.1-generate-001',
  'fast-3.0': 'veo-3.0-fast-generate-001',
  'bom-3.0': 'veo-3.0-generate-001',
  legacy: 'veo-2.0-generate-001',
};

// USD por SEGUNDO de vídeo (tabela pública de ago/2026). Servem para avisar
// antes de gastar, nunca para conciliar fatura — confira na tabela quando o
// valor importar de verdade.
const CUSTO_POR_SEGUNDO = {
  lite: 0.10,
  fast: 0.15,
  bom: 0.40,
  'fast-3.0': 0.15,
  'bom-3.0': 0.40,
  legacy: 0.50,
};

// Veo demora. Um plano de 8s leva de 1 a 4 minutos, e o `bom` demora mais.
const ESPERA_ENTRE_CONSULTAS_MS = 10000;
const LIMITE_DE_ESPERA_MS = 10 * 60 * 1000;

// ── .env, idêntico ao do gerar-imagem.js ──────────────────────

function carregarEnv() {
  const envPath = path.join(RAIZ, 'scripts', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const linha of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

// ── Montagem do pedido ────────────────────────────────────────

function montarCorpo(args) {
  const instancia = { prompt: args.prompt };

  // Imagem de referência vira o PRIMEIRO QUADRO do plano. É assim que se
  // encadeia um plano no outro sem corte: o último quadro de um entra aqui.
  if (args.ref) {
    const ext = path.extname(args.ref).toLowerCase();
    const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
    instancia.image = {
      bytesBase64Encoded: fs.readFileSync(args.ref).toString('base64'),
      mimeType: mime,
    };
  }

  const parametros = {
    aspectRatio: args.proporcao,
    durationSeconds: args.duracao,
    sampleCount: 1,
    resolution: args.resolucao,
    generateAudio: args.audio,
    // allow_adult libera pessoa adulta em cena (mão, silhueta). Sem isso o
    // modelo recusa planos com gente, e metade das nossas cenas tem uma mão.
    personGeneration: 'allow_adult',
  };
  if (args.negativo) parametros.negativePrompt = args.negativo;

  return { instances: [instancia], parameters: parametros };
}

// ── Chamada e espera ──────────────────────────────────────────

async function pedir(url, token, corpo) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });
  const texto = await res.text();
  let json;
  try {
    json = JSON.parse(texto);
  } catch {
    throw new Error(`resposta não-JSON [${res.status}]: ${texto.slice(0, 300)}`);
  }
  if (json.error) throw new Error(`[${json.error.code}] ${json.error.message}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${texto.slice(0, 300)}`);
  return json;
}

const espera = ms => new Promise(r => setTimeout(r, ms));

async function esperarOperacao(modelo, nomeOperacao, token) {
  const url = `${VERTEX_BASE}/${modelo}:fetchPredictOperation`;
  const comecou = Date.now();
  let voltas = 0;
  while (Date.now() - comecou < LIMITE_DE_ESPERA_MS) {
    await espera(ESPERA_ENTRE_CONSULTAS_MS);
    voltas++;
    const r = await pedir(url, token, { operationName: nomeOperacao });
    if (r.done) {
      if (r.error) throw new Error(`a geração falhou: ${r.error.message}`);
      return r.response;
    }
    const seg = Math.round((Date.now() - comecou) / 1000);
    process.stdout.write(`\r   gerando... ${seg}s (consulta ${voltas})   `);
  }
  throw new Error(
    `passou de ${LIMITE_DE_ESPERA_MS / 60000} min sem terminar. A operação continua viva do lado ` +
    `do Google: ${nomeOperacao}`
  );
}

// ── Resposta → arquivo ────────────────────────────────────────

function gravarVideo(resposta, saida) {
  const videos = resposta?.videos || resposta?.predictions || [];
  if (!videos.length) {
    const campos = Object.keys(resposta || {}).join(', ') || 'nenhum';
    throw new Error(`a resposta não trouxe vídeo. Campos recebidos: ${campos}`);
  }
  const v = videos[0];
  const b64 = v.bytesBase64Encoded || v.video?.bytesBase64Encoded;
  if (!b64) {
    // Com storageUri o Veo grava no GCS em vez de devolver bytes. Não usamos,
    // mas se alguém passar um dia, a mensagem tem que dizer onde o arquivo foi.
    const uri = v.gcsUri || v.video?.gcsUri;
    if (uri) throw new Error(`o vídeo foi para o Cloud Storage, não para cá: ${uri}`);
    throw new Error('a resposta veio sem bytes e sem URI — nada para gravar.');
  }
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  fs.writeFileSync(saida, Buffer.from(b64, 'base64'));
  return fs.statSync(saida).size;
}

// ── Argumentos ────────────────────────────────────────────────

function lerArgs(argv) {
  const args = {
    prompt: null, saida: null, ref: null, negativo: null,
    modelo: 'fast', duracao: 8, proporcao: '9:16', resolucao: '1080p',
    audio: true, dryRun: false, confirmo: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const flag = argv[i];
    const val = () => (i + 1 < argv.length ? argv[++i] : null);
    if (flag === '--prompt') args.prompt = val();
    else if (flag === '--prompt-file') args.prompt = fs.readFileSync(path.resolve(val()), 'utf8').trim();
    else if (flag === '--negativo') args.negativo = val();
    else if (flag === '--negativo-file') args.negativo = fs.readFileSync(path.resolve(val()), 'utf8').trim();
    else if (flag === '--saida') args.saida = path.resolve(val());
    else if (flag === '--ref') args.ref = path.resolve(val());
    else if (flag === '--modelo') args.modelo = val();
    else if (flag === '--duracao') args.duracao = Number(val());
    else if (flag === '--proporcao') args.proporcao = val();
    else if (flag === '--resolucao') args.resolucao = val();
    else if (flag === '--sem-audio') args.audio = false;
    else if (flag === '--dry-run') args.dryRun = true;
    else if (flag === '--confirmo') args.confirmo = true;
    else throw new Error(`flag desconhecida: ${flag}`);
  }

  if (!args.prompt) throw new Error('faltou --prompt ou --prompt-file');
  if (!args.saida) throw new Error('faltou --saida');
  if (!MODELOS[args.modelo]) {
    throw new Error(`--modelo inválido: ${args.modelo}. Use: ${Object.keys(MODELOS).join(', ')}`);
  }
  if (!Number.isFinite(args.duracao) || args.duracao < 1 || args.duracao > 60) {
    throw new Error(`--duracao fora do razoável: ${args.duracao}. Veo trabalha em planos curtos (4 a 8s).`);
  }
  if (args.ref && !fs.existsSync(args.ref)) throw new Error(`--ref não encontrado: ${args.ref}`);

  // A trava do dinheiro. Nenhum dos dois: não roda. Os dois: não roda também,
  // porque quem pede ensaio e confirmação ao mesmo tempo não sabe qual quer.
  if (args.dryRun === args.confirmo) {
    throw new Error(
      'passe --dry-run (não gasta nada) OU --confirmo (gasta de verdade).\n' +
      '   Isso existe porque um plano de 8s custa mais que vinte imagens.'
    );
  }
  return args;
}

// ── Principal ─────────────────────────────────────────────────

async function main() {
  carregarEnv();
  const args = lerArgs(process.argv);

  const projeto = process.env.GOOGLE_CLOUD_PROJECT;
  if (!projeto) throw new Error('GOOGLE_CLOUD_PROJECT ausente no scripts/.env');

  const modelo = `projects/${projeto}/locations/${REGIAO}/publishers/google/models/${MODELOS[args.modelo]}`;
  const corpo = montarCorpo(args);
  const custo = (CUSTO_POR_SEGUNDO[args.modelo] * args.duracao).toFixed(2);
  const resumo = args.prompt.slice(0, 160).replace(/\s+/g, ' ');

  console.log(`Modelo ....... ${MODELOS[args.modelo]} (${args.modelo})`);
  console.log(`Formato ...... ${args.proporcao}, ${args.resolucao}, ${args.duracao}s, audio ${args.audio ? 'sim' : 'nao'}`);
  console.log(`Primeiro qd .. ${args.ref ? path.basename(args.ref) : 'gerado do zero'}`);
  console.log(`Saida ........ ${args.saida}`);
  console.log(`Custo estim .. ~USD ${custo}  (estimativa de aviso, nao e fatura)`);
  console.log(`Prompt ....... ${resumo}${args.prompt.length > 160 ? '...' : ''}`);

  if (args.dryRun) {
    console.log('\nDRY RUN — nao chamei o Veo, nao gastei nada.');
    console.log(`   Corpo do pedido: ${JSON.stringify(corpo).length} bytes`);
    console.log('   Para gerar de verdade, troque --dry-run por --confirmo.');
    return;
  }

  const token = tokenVertex();
  console.log('\nPedindo a geracao...');
  const op = await pedir(`${VERTEX_BASE}/${modelo}:predictLongRunning`, token, corpo);
  if (!op.name) throw new Error(`a Vertex nao devolveu operacao: ${JSON.stringify(op).slice(0, 300)}`);
  console.log(`   operacao: ${op.name.split('/').pop()}`);

  const resposta = await esperarOperacao(modelo, op.name, token);
  process.stdout.write('\r'.padEnd(60) + '\r');

  const bytes = gravarVideo(resposta, args.saida);
  console.log(`\nPronto: ${args.saida}`);
  console.log(`   ${(bytes / 1024 / 1024).toFixed(1)} MB`);
}

main().catch(err => {
  console.error(`\n${err.message}`);
  process.exitCode = 1;
});
