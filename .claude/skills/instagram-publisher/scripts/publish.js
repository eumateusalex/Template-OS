#!/usr/bin/env node
// Publicador de posts do Instagram — o MOTOR, compartilhado por todas as contas.
// Hospeda as imagens no imgBB e publica via API do Instagram (Login do Instagram).
//
// Uso:
//   node .claude/skills/instagram-publisher/scripts/publish.js \
//     --images "slide-01.png,slide-02.png" --caption-file legenda.md \
//     [--conta <nome>] [--state-file publicador.json] [--dry-run] [--at HH:MM]
//   (ou --caption "texto" no lugar de --caption-file, pra legendas curtas)
//
// 1 imagem      → post simples
// 2-10 imagens  → carrossel
//
// ┌─ MÚLTIPLAS CONTAS ──────────────────────────────────────────────────────┐
// │ --conta <nome>  → credenciais de scripts/.env.<nome>                    │
// │ sem --conta     → scripts/.env, exatamente como sempre foi              │
// │                                                                          │
// │ Por que UM motor e não uma cópia por conta: das 24 funções deste         │
// │ arquivo, 23 são motor (retry, polling, renovação de token, agendamento)  │
// │ e só o loadEnv é específico da conta. Copiar 613 linhas pra trocar uma   │
// │ função é fabricar o bug que se corrige numa cópia e sobrevive na outra.  │
// │ O que diverge por conta é o PROCEDIMENTO, e isso mora nas skills.        │
// │                                                                          │
// │ ⚠️ A TRAVA DAS TRÊS PONTAS. Publicar é irreversível, e uma segunda       │
// │ conta vive na MESMA Central de Contas da principal — errar de conta é    │
// │ plausível, não teórico. Antes de subir qualquer imagem, o script exige   │
// │ que TRÊS coisas concordem:                                               │
// │    1. o --conta que você passou (ou o INSTAGRAM_CONTA do .env)           │
// │    2. o INSTAGRAM_BUSINESS_ID gravado no arquivo                         │
// │    3. o que a API do Instagram responde AO VIVO para esse token          │
// │ Discordou em qualquer ponto, ele para antes de tocar no imgBB.           │
// │ Falha de rede na conferência também PARA (falha fechada): não saber em   │
// │ qual conta se está publicando é motivo de não publicar.                  │
// └──────────────────────────────────────────────────────────────────────────┘
//
// Agendamento (--at): segura a publicação até o horário indicado (mesmo dia, ou
// "YYYY-MM-DD HH:MM" para outra data). NÃO é agendamento na nuvem — o processo fica
// rodando e publica quando a hora chega, então o PC precisa ficar ligado e o terminal aberto.
//
// Credenciais lidas do .env da conta:
//   INSTAGRAM_BUSINESS_ID         — ID da conta Instagram (Login do Instagram)
//   INSTAGRAM_ACCESS_TOKEN        — token de longa duração (renova sozinho, trava de ~50 dias)
//   INSTAGRAM_TOKEN_REFRESHED_AT  — data da última renovação (o script mantém sozinho)
//   INSTAGRAM_CONTA               — o @ esperado, SEM arroba. É a 1ª ponta da trava
//   IMGBB_API_KEY                 — chave da hospedagem imgBB (https://api.imgbb.com/)
//   IMGBB_PROPAGATION_WAIT_MS     — espera antes de entregar URLs novas à Meta (default 180000)
//   META_API_BASE                 — opcional (default https://graph.instagram.com)
//   META_API_VERSION              — opcional (default v23.0)

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomBytes } from 'node:crypto';
import { setDefaultResultOrder } from 'node:dns';

// IPv4 antes de IPv6 em toda resolução de nome deste processo.
//
// ⚠️ Servidor com rota IPv6 padrão configurada e que NÃO funciona é comum em
// VPS barata. Do Node 17 em diante vale
// a ordem que o DNS devolveu, e o `fetch` não tenta o endereço seguinte quando
// o primeiro falha — então tudo que resolve IPv6 primeiro morre com
// "fetch failed". Aqui isso significaria não conseguir subir a imagem nem falar
// com a Graph API, no meio de uma publicação que não tem desfazer.
//
// A linha vive aqui, e não no projeto de uma das contas, porque este
// arquivo é o motor de TODAS as contas e não pode depender de nenhuma delas.
if (typeof setDefaultResultOrder === 'function') setDefaultResultOrder('ipv4first');

// ── Carregamento do .env (scripts/.env do workspace) ──────────

function loadEnv(conta = null) {
  // Resolve a partir DESTE arquivo, não do cwd: rodar o script de dentro da
  // pasta de um carrossel (onde os PNGs estão) fazia o .env não ser achado e
  // o erro apontava pro lugar errado ("token ausente"). Este arquivo mora em
  // .claude/skills/instagram-publisher/scripts/ → a raiz fica 4 níveis acima.
  const raiz = resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..', '..');
  const envPath = resolve(raiz, conta ? `scripts/.env.${conta}` : 'scripts/.env');

  // Com --conta, arquivo ausente é ERRO. Sem isso, um nome digitado errado cairia
  // silenciosamente no process.env do shell — que pode estar com a OUTRA conta.
  if (conta && !existsSync(envPath)) {
    throw new Error(
      `credenciais da conta "${conta}" não encontradas em scripts/.env.${conta}\n`
      + `   Gere as credenciais desta conta pelo modo conexão do /instagram-publisher (conexao.md).`
    );
  }

  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
      if (!m || process.env[m[1]] !== undefined) continue;
      const valor = valorDoEnv(m[2]);
      if (valor) process.env[m[1]] = valor;
      else DECLARADAS_SEM_VALOR.add(m[1]);
    }
  }
  return envPath;
}

// As chaves que o .env declara só com o comentário do modelo (`CHAVE=   # o que
// é`). A trava de conta precisa saber disso: sem o corte, `INSTAGRAM_CONTA`
// copiada do modelo seria lida como o próprio comentário e pararia em CONTA
// ERRADA; com o corte ela viraria "não declarada" e a publicação seguiria.
const DECLARADAS_SEM_VALOR = new Set();

// ⚠️ Quem preenche o `.env` costuma deixar um comentário no fim da linha
// (`CHAVE=valor   # o que é`). Sem este corte, o comentário entraria no valor:
// o ID da conta levaria o texto junto, e um campo deixado vazio viraria o
// próprio comentário. Corta ` #...` (o `#` precedido de espaço), trata como
// vazio o valor que começa com `#`, e tira aspas em volta.
export function valorDoEnv (bruto) {
  let v = String(bruto).trim();
  if (v.startsWith('#')) return '';
  v = v.replace(/\s+#.*$/, '').trim();
  const aspas = v.match(/^(["'])(.*)\1$/);
  return aspas ? aspas[2] : v;
}

// ── Parsing de argumentos ─────────────────────────────────────

// 🚨 AS DUAS TRAVAS DESTA FUNÇÃO SÃO DE SEGURANÇA, e as duas fecham furos
// MEDIDOS:
//
// 1. VALOR FALTANDO NÃO PODE SER IGNORADO EM SILÊNCIO. Com um
//    `if (i + 1 < argv.length)` que simplesmente não entra, `--conta` pendurado
//    no fim da linha deixa `args.conta = null` — que é o mesmo que NÃO passar
//    `--conta`, ou seja, cai no `scripts/.env` e publica na conta PRINCIPAL. A trava das três pontas não
//    salva: ela confere se as três concordam, e depois do parsing elas
//    concordam perfeitamente, na conta errada. Conteúdo de uma conta no perfil
//    da outra é o erro que não tem desfazer.
//
// 2. ARGUMENTO DESCONHECIDO NÃO PODE SER IGNORADO. Medido: sem a trava,
//    `--dryrun` (sem o hífen do meio) e `-dry-run` (um traço só) passam batido
//    e a saída PUBLICA DE VERDADE, sem uma linha de aviso. O ensaio inteiro que
//    esta skill prescreve depende de uma flag que, errada por um caractere,
//    vira publicação irreversível. Por isso quem publica recusa sobra de
//    argumento.
//
// Falha fechada nos dois casos: sem valor, ou com nome que não existe, o
// processo para ANTES de qualquer rede.
function parseArgs(argv) {
  const args = { images: [], caption: '', dryRun: false, at: null, conta: null, stateFile: null, soRenovar: false };
  const valorDe = (i, nome) => {
    const v = argv[i + 1];
    if (v === undefined || (typeof v === 'string' && v.startsWith('--'))) {
      throw new Error(`${nome} exige um valor logo depois (recebi ${v === undefined ? 'nada' : `"${v}"`}).`);
    }
    return v;
  };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--conta') {
      const nome = valorDe(i, '--conta').trim().replace(/^@/, ''); i++;
      // O nome vira caminho de arquivo — não pode conter separador nem "..".
      if (!/^[a-z0-9._-]+$/i.test(nome) || nome.includes('..')) {
        throw new Error(`--conta inválido: "${nome}". Use só letras, números, ponto, hífen e sublinhado.`);
      }
      args.conta = nome;
    } else if (argv[i] === '--images') {
      args.images = valorDe(i, '--images').split(',').map(s => s.trim()).filter(Boolean); i++;
    } else if (argv[i] === '--caption') {
      args.caption = valorDe(i, '--caption'); i++;
    } else if (argv[i] === '--caption-file') {
      const arquivo = resolve(valorDe(i, '--caption-file')); i++;
      if (!existsSync(arquivo)) throw new Error(`--caption-file não encontrado: ${arquivo}`);
      args.caption = readFileSync(arquivo, 'utf8').trim();
    } else if (argv[i] === '--at') {
      args.at = valorDe(i, '--at'); i++;
    } else if (argv[i] === '--state-file') {
      args.stateFile = resolve(valorDe(i, '--state-file')); i++;
    } else if (argv[i] === '--dry-run') {
      args.dryRun = true;
    } else if (argv[i] === '--so-renovar') {
      args.soRenovar = true;
    } else {
      throw new Error(
        `argumento desconhecido: "${argv[i]}".\n`
        + '   Se era pra ser um ensaio, o nome exato é --dry-run (dois hífens, hífen no meio).\n'
        + '   Prefiro parar aqui a publicar de verdade achando que era ensaio.',
      );
    }
  }
  return args;
}

// ── Estado retomável da publicação ────────────────────────────

function fingerprintPublicacao(images, caption, businessId, dryRun) {
  const hash = createHash('sha256');
  hash.update(JSON.stringify({ businessId: String(businessId), caption, dryRun }));
  for (const image of images) {
    hash.update(resolve(image));
    hash.update(readFileSync(resolve(image)));
  }
  return `sha256:${hash.digest('hex')}`;
}

function carregaEstado(stateFile, fingerprint) {
  const novo = { schemaVersion: 1, fingerprint, status: 'new', imageUrls: [], childIds: [] };
  if (!stateFile || !existsSync(stateFile)) return novo;
  try {
    const salvo = JSON.parse(readFileSync(stateFile, 'utf8'));
    return salvo.fingerprint === fingerprint ? salvo : novo;
  } catch {
    throw new Error(`estado de publicação inválido: ${stateFile}`);
  }
}

function salvaEstado(stateFile, estado) {
  if (!stateFile) return;
  mkdirSync(dirname(stateFile), { recursive: true });
  const temporario = `${stateFile}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(temporario, JSON.stringify({ ...estado, updatedAt: new Date().toISOString() }, null, 2) + '\n');
  renameSync(temporario, stateFile);
}

/** O `fetch` do Node esconde o motivo real dentro de `err.cause`: a mensagem de
 *  cima é sempre "fetch failed", que não diagnostica nada nem depois, no log.
 *  Esta função traz o código de rede (ENOTFOUND, ECONNRESET, ECONNREFUSED,
 *  UND_ERR_CONNECT_TIMEOUT...) pro texto que se lê. */
function detalheDeRede(erro) {
  const causa = erro && erro.cause;
  const codigo = causa && (causa.code || causa.errno);
  const detalhe = causa && causa.message && causa.message !== erro.message ? causa.message : null;
  return [erro && erro.message ? erro.message : String(erro), codigo, detalhe].filter(Boolean).join(' | ');
}

/** A URL já responde, e responde com a mídia certa?
 *
 *  ⚠️ O `esperado` NÃO É ENFEITE. Com `image/` fixo, o `publish-reels.js`, que
 *  reaproveita esta função passando um MP4, reprovaria a cada 15 minutos um
 *  vídeo perfeitamente no ar — `HTTP 200, content-type video/mp4`, a resposta
 *  CERTA tratada como defeito. Quem reaproveita conferência de mídia tem que
 *  dizer qual mídia espera.
 *
 *  ⚠️ E SÃO DUAS FALHAS DIFERENTES AQUI DENTRO — só uma delas é motivo de não
 *  publicar:
 *
 *  - A URL RESPONDEU e a resposta está errada (404, 403, content-type que não é
 *    o esperado): a mídia não está pública. Isso reprova, e reprova alto.
 *  - O `fetch` NEM CHEGOU A TER RESPOSTA (DNS, conexão recusada, socket cortado,
 *    TLS): quem falhou foi a REDE DAQUI, e isso não diz nada sobre a mídia.
 *
 *  Uma rodada pode morrer do segundo jeito — `fetch failed` na PRIMEIRA URL,
 *  sem resposta nenhuma — e a rodada seguinte publicar EXATAMENTE as mesmas
 *  URLs sem reclamar: a mídia estava pública o tempo todo, o que oscilou foi a
 *  rede do servidor. Reprovar aí avisa "a peça de hoje NÃO foi ao ar" e, vinte
 *  minutos depois, o post sai.
 *
 *  Quem julga a mídia de verdade é o `criarContainerComRetry`, logo abaixo: é a
 *  META que baixa a imagem, de outra rede, e ele já espera e repete 8× lendo os
 *  códigos dela (2207052/9004). Esta conferência aqui é cortesia — adianta o
 *  diagnóstico, não decide o dia. Então falha de transporte AVISA E SEGUE; o
 *  gate real vem três linhas depois. */
// 🚨 EM PARALELO E COM PRAZO GLOBAL, e isso não é otimização: é o que impede a
// etapa de comer a janela inteira de publicação.
//
// Em SÉRIE seriam 4 tentativas × (20s de timeout + 10s de espera) POR URL. Com
// 10 slides o pior caso passaria de 18 minutos — e uma automação que chame o
// publicador com prazo (25 minutos, por exemplo) o mataria antes, com
// propagação do imgBB e reconciliação ainda por cima. Num dia de rede ruim o
// processo morreria antes de criar o primeiro container, e a rodada seguinte
// encontraria a tranca de pé.
//
// Por isso as URLs são conferidas ao mesmo tempo e a etapa inteira tem um teto
// (`prazoTotalMs`). Estourou o prazo, ela se comporta como "não respondeu":
// avisa e segue, porque quem julga a mídia de verdade é a Meta no container.
//
// A SEMÂNTICA DE VEREDITO é intocável:
//   · respondeu errado (404, content-type torto) → REPROVA
//   · não respondeu nada (DNS, socket, prazo)    → avisa e SEGUE
// `fetch failed` daqui reprova mídia que está pública o tempo todo.
async function confirmaUrlsPublicas(urls, {
  tentativas = 4, intervaloMs = 10_000, esperado = 'image/', onde = 'no imgBB',
  prazoTotalMs = 90_000,
} = {}) {
  const fim = Date.now() + prazoTotalMs;

  const resultados = await Promise.all(urls.map(async url => {
    let respostaRuim = null;   // ela respondeu, e respondeu errado → reprova
    let semResposta = null;    // não houve resposta → avisa e segue
    for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
      if (Date.now() >= fim) {
        if (!respostaRuim) semResposta = semResposta || new Error(`prazo de ${prazoTotalMs / 1000}s da conferência esgotado`);
        break;
      }
      let resposta;
      try {
        // O timeout de cada tentativa nunca passa do que resta do prazo global.
        const resta = Math.max(1_000, Math.min(20_000, fim - Date.now()));
        resposta = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(resta) });
      } catch (erro) {
        respostaRuim = null;
        semResposta = erro;
        if (tentativa < tentativas && Date.now() < fim) {
          await new Promise(r => setTimeout(r, Math.min(intervaloMs, Math.max(0, fim - Date.now()))));
        }
        continue;
      }
      const tipo = resposta.headers.get('content-type') || '';
      if (resposta.ok && tipo.toLowerCase().startsWith(esperado)) return { url, ruim: null, mudo: null };
      respostaRuim = new Error(`HTTP ${resposta.status}, content-type ${tipo || '(ausente)'} (esperava ${esperado}*)`);
      semResposta = null;
      if (tentativa < tentativas && Date.now() < fim) {
        await new Promise(r => setTimeout(r, Math.min(intervaloMs, Math.max(0, fim - Date.now()))));
      }
    }
    return { url, ruim: respostaRuim, mudo: semResposta };
  }));

  // Reprova primeiro, e reprova pela PRIMEIRA URL ruim na ordem original — a
  // mensagem tem que ser estável, não depender de quem terminou antes.
  const ruim = resultados.find(r => r.ruim);
  if (ruim) throw new Error(`a mídia ainda não está pública ${onde} (${ruim.url}): ${ruim.ruim.message}`);

  for (const r of resultados.filter(x => x.mudo)) {
    console.log(`   ⚠ não consegui CONFERIR a URL daqui (${r.url}): ${detalheDeRede(r.mudo)}`);
    console.log('     Falhou a rede desta máquina, não a mídia — sigo, e quem decide é a Meta no container.');
  }
}

// ── Hospedagem (imgBB) ────────────────────────────────────────

/**
 * Sobe uma imagem pro imgBB e devolve a url pública.
 *
 * 🚨 `rehospedar: true` força uma URL NOVA, e existe por um motivo medido.
 * **O imgBB deduplica por conteúdo:** subir o mesmo arquivo devolve exatamente
 * a mesma url, pra sempre. Medido contra a API real: o mesmo PNG enviado duas
 * vezes voltou como `i.ibb.co/XkfNQSn9/3003092b640d.png` nas duas, e era a
 * mesma url de uma rodada anterior, horas antes.
 *
 * A consequência: quando a Meta entra num estado em que não consegue baixar uma
 * url, **repetir não escapa**, e republicar a peça inteira também não, porque o
 * upload devolve a mesma url. Duas rodadas produzem listas de url byte a byte
 * idênticas.
 *
 * A saída é mudar o conteúdo. Alguns bytes no fim do arquivo bastam: PNG ignora
 * o que vem depois do IEND e JPEG ignora o que vem depois do EOI, então a imagem
 * decodifica igual. Conferido ida e volta pelo imgBB: o arquivo com padding
 * voltou como PNG 2160x2700 válido, e com url nova.
 *
 * ⚠️ **TROCAR DE HOST NÃO RESOLVE, e o catbox.moe já foi medido e reprovado.**
 * Ele é o candidato óbvio (grátis, sem conta, sem chave de API) e a hipótese
 * era que não deduplicasse. Medido
 * contra a API real, com PNG descartável de 8x8:
 *
 *   · mesmos bytes, 3 envios separados  → SEMPRE `files.catbox.moe/wg6c37.png`
 *   · 1 byte diferente na imagem        → url nova (`gxj6ht.png`)
 *   · mesma imagem + 1 byte de padding  → url nova (`16b57o.png`), e volta
 *                                         como PNG válido no download
 *
 * Ou seja: **o catbox deduplica por conteúdo exatamente como o imgBB**, e a
 * técnica de padding daqui é o que escapa nos dois. Trocar de host mudaria o
 * fornecedor sem mudar o defeito. Não refazer esse teste.
 */
async function uploadToImgBB(imagePath, apiKey, { rehospedar = false } = {}) {
  const absolutePath = resolve(imagePath);
  let fileBuffer = readFileSync(absolutePath);
  if (rehospedar) {
    // Aleatório, não sequencial: um contador repetiria os mesmos bytes numa
    // retomada e cairia de novo na dedupe, que é justamente o que se está fugindo.
    const marca = `\n<!--rehost ${Date.now()}-${randomBytes(6).toString('hex')}-->`;
    fileBuffer = Buffer.concat([fileBuffer, Buffer.from(marca, 'utf8')]);
  }
  const base64Image = fileBuffer.toString('base64');
  const form = new FormData();
  form.append('key', apiKey);
  form.append('image', base64Image);
  // Base configurável só para o teste automatizado apontar num servidor local —
  // sem isso não dá pra exercitar o fluxo inteiro sem publicar de verdade. A
  // chave viaja no pedido, então a base se confere antes.
  const base = baseConferida('IMGBB_API_BASE', 'https://api.imgbb.com', HOSTS_DO_IMGBB, 'a chave');
  const res = await fetch(`${base}/1/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Upload imgBB falhou [${res.status}]: ${await res.text()}`);
  const json = await res.json();
  if (!json.success) throw new Error(`Upload imgBB falhou: ${JSON.stringify(json)}`);
  return json.data.url;
}

/** Tenta o upload várias vezes antes de desistir (falha em serviço externo → retry). */
async function uploadComRetry(imagePath, apiKey, tentativas = 4, intervaloMs = 3000, opcoes = {}) {
  let ultimoErro;
  for (let t = 1; t <= tentativas; t++) {
    try {
      return await uploadToImgBB(imagePath, apiKey, opcoes);
    } catch (err) {
      ultimoErro = err;
      if (t < tentativas) {
        console.log(`   ⚠ tentativa ${t}/${tentativas} falhou (${imagePath}); repetindo...`);
        await new Promise(r => setTimeout(r, intervaloMs));
      }
    }
  }
  throw ultimoErro;
}

// ── API do Instagram (Login do Instagram) ─────────────────────

// Arrow chamada a cada uso (não uma string congelada no import) porque o .env
// só é carregado dentro de main() — o valor precisa ser lido no momento da chamada.
//
// 🚨 A BASE SE VALIDA ANTES DE LEVAR O TOKEN. O `access_token` viaja na URL, e
// uma base torta (um comentário colado no valor, um host digitado errado) faz o
// `fetch` falhar com "Failed to parse URL from <base>...&access_token=<TOKEN>",
// e essa mensagem subiria inteira para o terminal, o log e a conversa. Só passa
// https para os hosts da Graph API, ou loopback (a suíte de testes sobe um
// servidor falso em 127.0.0.1). Reels e story montam a URL por esta função, e
// herdam a trava.
const HOSTS_DA_GRAPH = new Set(['graph.instagram.com', 'graph.facebook.com']);
const HOSTS_DO_IMGBB = new Set(['api.imgbb.com']);
const LOOPBACK = new Set(['127.0.0.1', 'localhost', '[::1]']);

/**
 * A base de uma API, conferida antes de levar credencial para ela: só https para
 * os hosts dela, ou loopback. Um dono só para a Graph API e para o imgBB.
 */
function baseConferida (variavel, padrao, hosts, credencial) {
  const base = process.env[variavel] || padrao;
  let url;
  try { url = new URL(base); } catch {
    throw new Error(`${variavel} não é um endereço válido ("${base.slice(0, 60)}"). Deixe vazio para usar ${padrao}`);
  }
  const permitido = LOOPBACK.has(url.hostname)
    ? ['http:', 'https:'].includes(url.protocol)
    : url.protocol === 'https:' && hosts.has(url.hostname);
  if (!permitido) {
    const destinos = [...hosts].map((h) => `https://${h}`).join(' ou ');
    throw new Error(`${variavel} aponta para ${url.protocol}//${url.hostname}, e ${credencial} só vai para ${destinos}. Deixe ${variavel} vazio para usar ${padrao}`);
  }
  // A base usada é a que o parser conferiu, nunca a string crua: o `new URL` tira
  // espaço e caractere de controle das pontas antes de conferir o host, e a crua
  // os levaria para o meio da URL montada. A forma
  // conferida também deixa de fora credencial, busca e fragmento da base.
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
}

const igBase = () => `${baseConferida('META_API_BASE', 'https://graph.instagram.com', HOSTS_DA_GRAPH, 'o token')}/${process.env.META_API_VERSION || 'v23.0'}`;

/** Mascara o token em qualquer texto que vá ser impresso. */
export const semToken = (texto) => String(texto).replace(/access_token=[^&\s"']+/g, 'access_token=***');

/**
 * Cria um container de mídia com retry. A Meta baixa a `image_url` na hora; logo após o
 * upload, o CDN do imgBB às vezes ainda não propagou a imagem pra todos os edges e a Meta
 * responde "não consegui baixar" (code 9004 / subcode 2207052 — reportado como não-transitório,
 * mas some sozinho em segundos). Repetimos com intervalo pra dar tempo de propagar.
 */
async function criarContainerComRetry(construirUrl, rotulo, {
  tentativas = 8, intervaloMs = null, reHospedar = null, rodadas = 3, imageUrl = null,
} = {}) {
  // Mesmo desenho da espera de propagação: em produção 6s, e zero quando o teste
  // aponta a Meta pra uma API local — senão a suíte gastaria 48s por imagem só
  // esperando um relógio que ali não significa nada.
  if (intervaloMs === null) {
    const padrao = process.env.IMGBB_API_BASE ? 0 : 6000;
    intervaloMs = Number(process.env.META_RETRY_INTERVAL_MS ?? padrao);
    if (!Number.isFinite(intervaloMs) || intervaloMs < 0) {
      throw new Error('META_RETRY_INTERVAL_MS precisa ser um número maior ou igual a zero');
    }
  }
  // Aceita os dois formatos de propósito. Quem hospeda no imgBB passa uma
  // FUNÇÃO, porque a url pode mudar no meio (camada 2). Quem hospeda a própria
  // mídia, como um publicador de vídeo servido por um nginx próprio, passa a url
  // pronta: ali não existe dedupe de terceiro pra escapar, e obrigar aquele
  // arquivo a fabricar um construtor seria cerimônia sem ganho.
  const montarUrl = typeof construirUrl === 'function' ? construirUrl : () => construirUrl;
  let ultimoErro;
  let urlAtual = imageUrl;

  for (let rodada = 1; rodada <= rodadas; rodada++) {
    for (let t = 1; t <= tentativas; t++) {
      const res = await fetch(montarUrl(urlAtual), { method: 'POST' });
      const texto = await res.text();
      if (res.ok) return JSON.parse(texto).id;
      ultimoErro = new Error(`${rotulo} falhou [${res.status}]: ${texto}`);
      // Meta não conseguiu baixar a imagem (propagação do host) → vale esperar e repetir.
      const metaNaoBaixou = /2207052|2207003|2207020|"code":9004|"code":1\b/.test(texto);
      if (!metaNaoBaixou) throw ultimoErro;      // erro de outra natureza: não insistir
      if (t < tentativas) {
        console.log(`   ⚠ Meta ainda não baixou a imagem (rodada ${rodada}, tentativa ${t}/${tentativas}); aguardando ${intervaloMs / 1000}s p/ o imgBB propagar...`);
        await new Promise(r => setTimeout(r, intervaloMs));
      }
    }

    // CAMADA 2. Esgotou a espera nesta url e ela continua não descendo pra Meta.
    // Insistir nela é perda de tempo garantida, e REPUBLICAR A PEÇA TAMBÉM: o
    // imgBB deduplica por conteúdo, então o upload devolveria exatamente esta
    // mesma url, e a peça falharia de novo com a lista de url idêntica. A única
    // saída é trocar a url.
    if (!reHospedar || rodada === rodadas) break;
    console.log(`   ↻ ${tentativas} tentativas sem sucesso nesta url. Re-hospedando a imagem num endereço novo (rodada ${rodada + 1}/${rodadas})...`);
    const nova = await reHospedar();
    if (!nova || nova === urlAtual) {
      console.log('   ⚠ a re-hospedagem não produziu url nova — não há como escapar da dedupe.');
      break;
    }
    console.log(`   ↻ url nova: ${nova}`);
    urlAtual = nova;
  }
  throw ultimoErro;
}

async function createChildContainer(userId, imageUrl, accessToken, reHospedar = null) {
  return criarContainerComRetry(
    url => `${igBase()}/${userId}/media?${new URLSearchParams({ image_url: url, is_carousel_item: 'true', access_token: accessToken })}`,
    'createChildContainer', { imageUrl, reHospedar },
  );
}

async function createSingleContainer(userId, imageUrl, caption, accessToken, reHospedar = null) {
  return criarContainerComRetry(
    url => `${igBase()}/${userId}/media?${new URLSearchParams({ image_url: url, caption, access_token: accessToken })}`,
    'createSingleContainer', { imageUrl, reHospedar },
  );
}

async function getContainerStatus(containerId, accessToken) {
  const params = new URLSearchParams({ fields: 'status_code', access_token: accessToken });
  const res = await fetch(`${igBase()}/${containerId}?${params}`);
  if (!res.ok) throw new Error(`getContainerStatus falhou [${res.status}]: ${await res.text()}`);
  return (await res.json()).status_code;
}

async function pollUntilFinished(containerId, accessToken, timeoutMs = 60_000, intervalMs = 3_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const status = await getContainerStatus(containerId, accessToken);
    if (status === 'FINISHED') return;
    if (status === 'ERROR') throw new Error(`Container ${containerId} entrou em estado ERROR`);
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error(`Container ${containerId} estourou o tempo limite (${timeoutMs}ms)`);
}

/** Espera um container ficar pronto — e, se ele veio de uma tentativa ANTERIOR
 *  e está inutilizável, refaz uma vez em vez de morrer.
 *
 *  ⚠️ SEM ISTO O RETRY SE PERDE INTEIRO. Quando a Meta devolve 403 na primeira
 *  tentativa, o retry retoma o container de carrossel gravado no estado, acha-o
 *  em `ERROR` (ele já foi consumido) e **morreria ali**: a tentativa que existe
 *  para salvar o post não chegaria nem a criar um container novo.
 *
 *  ⚠️ SÓ REFAZ O QUE VEIO DO ESTADO, e nunca o que acabou de ser criado.
 *  Container recém-criado que entra em ERROR está dizendo que a MÍDIA tem
 *  problema — refazer daria o mesmo erro em looping. Container retomado em
 *  ERROR está dizendo outra coisa: que a sessão anterior já o gastou.
 *
 *  ⚠️ E refaz UMA vez. Se o novo também falhar, o erro sobe: aqui o desfecho
 *  ruim é insistir para sempre numa mídia que a Meta recusa. */
async function esperaOuRefaz({ id, veioDoEstado, recria, accessToken, rotulo, timeoutMs }) {
  try {
    await pollUntilFinished(id, accessToken, ...(timeoutMs ? [timeoutMs] : []));
    return id;
  } catch (err) {
    if (!veioDoEstado) throw err;
    console.log(`   ⚠ ${rotulo} ${id} veio da tentativa anterior e está inutilizável (${semToken(err.message)}).`);
    console.log('     Recriando uma vez — o container antigo já tinha sido gasto.');
    const novo = await recria();
    await pollUntilFinished(novo, accessToken, ...(timeoutMs ? [timeoutMs] : []));
    return novo;
  }
}

async function createCarouselContainer(userId, childIds, caption, accessToken) {
  const params = new URLSearchParams({
    media_type: 'CAROUSEL', children: childIds.join(','), caption, access_token: accessToken,
  });
  const res = await fetch(`${igBase()}/${userId}/media?${params}`, { method: 'POST' });
  if (!res.ok) throw new Error(`createCarouselContainer falhou [${res.status}]: ${await res.text()}`);
  return (await res.json()).id;
}

async function publishMedia(userId, containerId, accessToken, tentativas = 5, intervaloMs = 12_000) {
  const params = new URLSearchParams({ creation_id: containerId, access_token: accessToken });
  let ultimoErro;
  for (let t = 1; t <= tentativas; t++) {
    const res = await fetch(`${igBase()}/${userId}/media_publish?${params}`, { method: 'POST' });
    const texto = await res.text();
    if (res.ok) return JSON.parse(texto).id;
    // 9007 / subcode 2207027: mídia "ainda não está pronta" — transitório em carrossel, vale retry
    const transitorio = /"code":9007|2207027/.test(texto);
    ultimoErro = new Error(`publishMedia falhou [${res.status}]: ${texto}`);
    if (transitorio && t < tentativas) {
      console.log(`   ⚠ mídia ainda processando (tentativa ${t}/${tentativas}); aguardando ${intervaloMs / 1000}s...`);
      await new Promise(r => setTimeout(r, intervaloMs));
    } else {
      throw ultimoErro;
    }
  }
  throw ultimoErro;
}

async function getPermalink(mediaId, accessToken) {
  const params = new URLSearchParams({ fields: 'permalink', access_token: accessToken });
  const res = await fetch(`${igBase()}/${mediaId}?${params}`);
  if (!res.ok) return null; // não-fatal — só deixa de exibir a URL
  return (await res.json()).permalink ?? null;
}

// ── A trava das três pontas ───────────────────────────────────

/** Pergunta à API de quem é este token. Só ERRO DE REDE repete — erro de
 *  configuração não melhora com insistência. */
async function quemSouEu(accessToken, tentativas = 3, intervaloMs = 3000) {
  let ultimoErro;
  for (let t = 1; t <= tentativas; t++) {
    try {
      const params = new URLSearchParams({ fields: 'id,username', access_token: accessToken });
      const res = await fetch(`${igBase()}/me?${params}`);
      const texto = await res.text();
      if (!res.ok) throw new Error(`[${res.status}] ${texto}`);
      const json = JSON.parse(texto);
      if (!json.id || !json.username) throw new Error(`resposta sem id/username: ${texto}`);
      return json;
    } catch (err) {
      ultimoErro = err;
      if (t < tentativas) {
        console.log(`   ⚠ tentativa ${t}/${tentativas} de identificar a conta falhou; repetindo...`);
        await new Promise(r => setTimeout(r, intervaloMs));
      }
    }
  }
  // Falha FECHADA: não saber em qual conta se publicaria é motivo de não publicar.
  throw new Error(
    `não consegui confirmar em qual conta iria publicar: ${semToken(ultimoErro.message)}\n`
    + `   Parei de propósito. Publicar sem saber a conta é o erro que não tem desfazer.`
  );
}

/**
 * Exige que as três pontas concordem antes de qualquer coisa ir pro ar:
 *   1. `esperado`   — o --conta que veio na linha de comando (ou INSTAGRAM_CONTA)
 *   2. `idDoArquivo`— o INSTAGRAM_BUSINESS_ID gravado no .env
 *   3. a API        — de quem o token realmente é, agora
 * Duas pontas não bastam: se o .env tivesse o ID de uma conta e o token de
 * outra, uma conferência só entre arquivo e bandeira passaria batido.
 */
async function conferirConta(idDoArquivo, accessToken, esperado, envPath) {
  // A linha INSTAGRAM_CONTA existe, mas só com o comentário do modelo: quem
  // copiou o .env.example não disse a conta. Para antes de o token sair.
  if (!esperado && DECLARADAS_SEM_VALOR.has('INSTAGRAM_CONTA')) {
    throw new Error(
      `CONTA SEM VALOR — não publiquei nada.\n`
      + `   ${envPath} tem a linha INSTAGRAM_CONTA, mas só com o comentário do modelo.\n`
      + `   Escreva nela o @ da conta, sem arroba, ou passe --conta.`
    );
  }
  const eu = await quemSouEu(accessToken);

  if (String(eu.id) !== String(idDoArquivo)) {
    throw new Error(
      `CONTA INCOERENTE — não publiquei nada.\n`
      + `   ${envPath}\n`
      + `   INSTAGRAM_BUSINESS_ID diz ....... ${idDoArquivo}\n`
      + `   mas o token é da conta .......... ${eu.id} (@${eu.username})\n`
      + `   O arquivo tem o ID de uma conta e o token de outra. Refaça as credenciais pelo modo conexão do /instagram-publisher (conexao.md).`
    );
  }

  if (esperado && eu.username.toLowerCase() !== esperado.toLowerCase()) {
    throw new Error(
      `CONTA ERRADA — não publiquei nada.\n`
      + `   esperava publicar em .... @${esperado}\n`
      + `   mas o token é de ........ @${eu.username}\n`
      + `   As contas vivem na mesma Central de Contas: dá pra ter gerado o token da errada.`
    );
  }

  if (!esperado) {
    // .env antigo, sem INSTAGRAM_CONTA declarado. As pontas 2 e 3 já bateram,
    // então não há incoerência — mas sem a ponta 1 ninguém declarou a intenção.
    console.log(`⚠️  Conta não declarada (sem --conta nem INSTAGRAM_CONTA em ${envPath}).`);
    console.log(`   Vou publicar em @${eu.username}. Declare INSTAGRAM_CONTA=${eu.username} pra travar isso.`);
  }
  return eu;
}

/** Grava (ou cria) uma chave KEY=valor no conteúdo do .env, preservando o resto. */
function setEnvKey(conteudo, key, valor) {
  const re = new RegExp(`^${key}\\s*=.*$`, 'm');
  if (re.test(conteudo)) return conteudo.replace(re, `${key}=${valor}`);
  return conteudo.replace(/\n?$/, `\n${key}=${valor}\n`);
}

// O token vale ~60 dias e cada renovação zera esse prazo. Renovar a cada publicação
// polui o histórico da Meta (ex.: 4 posts/dia = 4 renovações), então só renovamos
// quando o token está ficando velho — mantém vivo com o mínimo de renovações.
const RENOVAR_APOS_DIAS = 50;

/** Renova o token de longa duração só se já passou RENOVAR_APOS_DIAS da última vez. Best-effort. */
// Devolve o que aconteceu, em vez de engolir: quem chama decide se a falha é
// bônus que não veio (a publicação) ou o erro do dia (o --so-renovar do cron).
async function refreshToken(accessToken, envPath) {
  try {
    const desde = process.env.INSTAGRAM_TOKEN_REFRESHED_AT;
    if (desde) {
      const dias = (Date.now() - new Date(desde).getTime()) / 86_400_000;
      if (Number.isFinite(dias) && dias < RENOVAR_APOS_DIAS) {
        console.log(`   🔑 Token renovado há ${Math.floor(dias)} dia(s) — dentro do prazo (renova só após ${RENOVAR_APOS_DIAS}).`);
        return { renovou: false, motivo: null };
      }
    }
    const params = new URLSearchParams({ grant_type: 'ig_refresh_token', access_token: accessToken });
    const res = await fetch(`${igBase()}/refresh_access_token?${params}`, { method: 'GET' });
    if (!res.ok) {
      const corpo = await res.text().catch(() => '');
      return { renovou: false, motivo: semToken(`a Meta recusou a renovação (HTTP ${res.status}): ${corpo.slice(0, 300)}`) };
    }
    const json = await res.json();
    if (!json.access_token) return { renovou: false, motivo: 'a Meta respondeu sem o token novo' };
    if (!existsSync(envPath)) return { renovou: false, motivo: `o arquivo de credencial não existe: ${envPath}` };
    let conteudo = readFileSync(envPath, 'utf8');
    conteudo = setEnvKey(conteudo, 'INSTAGRAM_ACCESS_TOKEN', json.access_token);
    conteudo = setEnvKey(conteudo, 'INSTAGRAM_TOKEN_REFRESHED_AT', new Date().toISOString().slice(0, 10));
    // 🚨 TEMPORÁRIO E RENOMEIA, nunca escrita direta. Este é o arquivo mais
    // crítico do workspace: token do Instagram, chave do imgBB e o que mais
    // estiver guardado ali. Todo o resto do projeto grava assim
    // (`escreveJsonAtomico`, `salvaEstado`); só esta linha não gravava.
    //
    // O risco não é teórico: a renovação roda no FIM de uma publicação, que é
    // exatamente quando o teto de tempo da automação estoura e o processo leva
    // SIGKILL. Morrer no meio de um `writeFileSync` deixa o `.env` truncado, e
    // aí param de uma vez a publicação, o que mais lê o mesmo `.env` e a
    // própria renovação. Recuperação só à mão.
    const temporario = `${envPath}.tmp-${process.pid}`;
    writeFileSync(temporario, conteudo, { mode: 0o600 });
    renameSync(temporario, envPath);
    // Sempre o arquivo DA CONTA — com --conta o envPath já é o .env.<nome>, então
    // a renovação de uma conta nunca reescreve o token da outra.
    console.log(`   🔑 Token renovado (prazo de ~60 dias reiniciado) e salvo em ${envPath}.`);
    return { renovou: true, motivo: null };
  } catch (e) {
    return { renovou: false, motivo: semToken(`a renovação falhou: ${e.message}`) };
  }
}

const SE_FALHAR = 'Se as próximas publicações falharem, rode o modo conexão do /instagram-publisher.';

// A renovação depois de publicar: bônus. A falha fica no log, e o post vale.
async function renovaNoFim(accessToken, envPath) {
  const { motivo } = await refreshToken(accessToken, envPath);
  if (motivo) console.log(`   ⚠ Não consegui renovar o token agora (o post foi publicado): ${motivo}. ${SE_FALHAR}`);
}

// ── Agendamento (--at) ────────────────────────────────────────
//
// Agendamento LOCAL: não há agendamento de verdade na API do Instagram. O que fazemos é
// segurar o processo rodando até o horário e só então publicar. Por isso exige o PC ligado
// e o terminal aberto até lá. Tudo é validado ANTES da espera (arquivos, legenda, credenciais)
// e o upload/publicação só acontece quando a hora chega — nada é enviado durante a espera.

/** Converte "HH:MM" (hoje) ou "YYYY-MM-DD HH:MM" num Date futuro. Erra se for inválido ou já passou. */
function parseAtToDate(at, agora = new Date()) {
  const m = String(at).trim().match(/^(?:(\d{4})-(\d{2})-(\d{2})[ T])?(\d{1,2}):(\d{2})$/);
  if (!m) throw new Error(`--at inválido: "${at}". Use HH:MM (hoje) ou "YYYY-MM-DD HH:MM".`);
  const [, ano, mes, dia, hh, mm] = m;
  const hora = Number(hh), minuto = Number(mm);
  if (hora > 23 || minuto > 59) throw new Error(`--at com horário inválido: ${hh}:${mm}`);
  const alvo = ano
    ? new Date(Number(ano), Number(mes) - 1, Number(dia), hora, minuto, 0, 0)
    : new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), hora, minuto, 0, 0);
  if (Number.isNaN(alvo.getTime())) throw new Error(`--at inválido: "${at}"`);
  // Pega data impossível (ex.: 2026-13-40) — o Date "rola" em silêncio; conferimos que bate.
  if (ano && (alvo.getMonth() !== Number(mes) - 1 || alvo.getDate() !== Number(dia))) {
    throw new Error(`--at com data inexistente: ${ano}-${mes}-${dia}`);
  }
  if (alvo.getTime() <= agora.getTime()) {
    throw new Error(`--at ${at} já passou (agora: ${agora.toLocaleString()}). Escolha um horário futuro${ano ? '' : ' — ou use "YYYY-MM-DD HH:MM" para outro dia'}.`);
  }
  return alvo;
}

/** Espera até o horário-alvo, dormindo em blocos curtos com aviso periódico. */
async function esperarAte(alvo) {
  const alvoMs = alvo.getTime();
  console.log(`🕒 Agendado para ${alvo.toLocaleString()}. Mantenha o PC ligado e este terminal aberto.`);
  let ultimoAviso = 0;
  while (Date.now() < alvoMs) {
    if (Date.now() - ultimoAviso >= 600_000 || ultimoAviso === 0) {
      console.log(`   ⏳ faltam ~${Math.ceil((alvoMs - Date.now()) / 60_000)} min...`);
      ultimoAviso = Date.now();
    }
    await new Promise(r => setTimeout(r, Math.min(30_000, alvoMs - Date.now())));
  }
  console.log('   ✅ Chegou a hora — publicando agora.');
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  // parseArgs ANTES do loadEnv: é o --conta que decide qual .env carregar.
  const { images, caption, dryRun, at, conta, stateFile, soRenovar } = parseArgs(process.argv);
  const envPath = loadEnv(conta);
  const rotuloEnv = conta ? `scripts/.env.${conta}` : 'scripts/.env';

  // ── MANUTENÇÃO DO TOKEN, sem publicar nada ──────────────────────────────
  //
  // 🚨 A RENOVAÇÃO NÃO PODE MORAR SÓ DENTRO DO FLUXO DE PUBLICAÇÃO: o token só
  // rejuvenesceria em dia de post. Enquanto se publica todo dia isso não
  // aparece; no dia em que as publicações param, nada mais chama o publicador
  // e o token NUNCA MAIS renova. O token vale ~60 dias: ele morreria sozinho,
  // em silêncio, e a descoberta seria a próxima tentativa de publicar dando
  // OAuthException.
  //
  // Este modo (`--so-renovar`) protege a renovação por fora do caminho de
  // publicar: pode rodar num agendador todo dia, não pede imagem nem legenda, e
  // a trava dos 50 dias continua valendo, então não polui o histórico da Meta.
  if (soRenovar) {
    const { INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_BUSINESS_ID, INSTAGRAM_CONTA } = process.env;
    if (!INSTAGRAM_ACCESS_TOKEN) throw new Error(`INSTAGRAM_ACCESS_TOKEN ausente no ${rotuloEnv}`);
    if (!INSTAGRAM_BUSINESS_ID) throw new Error(`INSTAGRAM_BUSINESS_ID ausente no ${rotuloEnv}`);
    // A MESMA trava de conta da publicação: renovar o token da conta errada
    // gravaria credencial no arquivo errado, que é o pior estrago possível aqui.
    const esperadoR = conta || (INSTAGRAM_CONTA ? INSTAGRAM_CONTA.replace(/^@/, '') : null);
    console.log(`🔒 Conferindo a conta (${rotuloEnv})...`);
    const euR = await conferirConta(INSTAGRAM_BUSINESS_ID, INSTAGRAM_ACCESS_TOKEN, esperadoR, rotuloEnv);
    console.log(`   ✅ manutenção de token da @${euR.username} (id ${euR.id})`);
    // aqui a renovação é o trabalho inteiro: a falha sai com erro, que o cron vê
    const { motivo } = await refreshToken(INSTAGRAM_ACCESS_TOKEN, envPath);
    if (motivo) throw new Error(`não renovei o token da @${euR.username}: ${motivo}. ${SE_FALHAR}`);
    return;
  }

  if (!images.length) throw new Error('--images é obrigatório (ex.: --images "slide-01.png,slide-02.png")');
  if (!caption) throw new Error('legenda vazia — passe --caption-file <arquivo.md> ou --caption "texto"');
  if (images.length > 10) throw new Error(`Instagram aceita no máximo 10 imagens por post (recebi ${images.length})`);
  if (caption.length > 2200) throw new Error(`Legenda excede o limite de 2200 caracteres do Instagram (recebi ${caption.length})`);

  // Valida o horário de agendamento já no topo (erro na hora se for inválido/passado).
  const agendarPara = at ? parseAtToDate(at) : null;

  const { INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_BUSINESS_ID, IMGBB_API_KEY, INSTAGRAM_CONTA } = process.env;
  if (!INSTAGRAM_ACCESS_TOKEN) throw new Error(`INSTAGRAM_ACCESS_TOKEN ausente no ${rotuloEnv}`);
  if (!INSTAGRAM_BUSINESS_ID) throw new Error(`INSTAGRAM_BUSINESS_ID ausente no ${rotuloEnv}`);
  if (!IMGBB_API_KEY) throw new Error(`IMGBB_API_KEY ausente no ${rotuloEnv} — pegue a sua em https://api.imgbb.com/`);

  // Ponta 1 da trava. O --conta manda; sem ele, vale o que o arquivo declarar.
  // Se os dois vierem e discordarem, para: alguém está enganado sobre onde publica.
  const esperado = conta || (INSTAGRAM_CONTA ? INSTAGRAM_CONTA.replace(/^@/, '') : null);
  if (conta && INSTAGRAM_CONTA && conta.toLowerCase() !== INSTAGRAM_CONTA.replace(/^@/, '').toLowerCase()) {
    throw new Error(
      `CONTA INCOERENTE — não publiquei nada.\n`
      + `   --conta pede ............. @${conta}\n`
      + `   mas ${rotuloEnv} declara .. @${INSTAGRAM_CONTA.replace(/^@/, '')}`
    );
  }

  // Falha cedo e claro se algum caminho estiver errado (senão o retry de upload gastaria 4× à toa).
  for (const p of images) {
    if (!existsSync(resolve(p))) throw new Error(`Imagem não encontrada: ${p}`);
  }

  // ⚠️ A TRAVA, antes de QUALQUER coisa sair da máquina. Vale também no --dry-run:
  // conferir a conta é justamente o que um ensaio precisa provar.
  console.log(`🔒 Conferindo a conta (${rotuloEnv})...`);
  const eu = await conferirConta(INSTAGRAM_BUSINESS_ID, INSTAGRAM_ACCESS_TOKEN, esperado, rotuloEnv);
  console.log(`   ✅ publicando em @${eu.username} (id ${eu.id})`);

  const single = images.length === 1;
  const fingerprint = fingerprintPublicacao(images, caption, INSTAGRAM_BUSINESS_ID, dryRun);
  let estado = carregaEstado(stateFile, fingerprint);
  const avanca = atualizacao => {
    estado = { ...estado, ...atualizacao };
    salvaEstado(stateFile, estado);
  };
  if (estado.status === 'confirmed' && estado.postId) {
    console.log(`✅ Esta publicação já foi confirmada no estado local (${estado.postId}) — nada a fazer.`);
    if (estado.permalink) console.log(`   URL: ${estado.permalink}`);
    return;
  }

  // Tudo validado — se agendado, espera o horário. Só depois começa a subir e publicar.
  if (agendarPara) await esperarAte(agendarPara);

  const imageUrls = Array.isArray(estado.imageUrls) ? estado.imageUrls.slice(0, images.length) : [];
  if (imageUrls.length) {
    console.log(`📸 Retomando ${imageUrls.length}/${images.length} URL(s) já hospedada(s) no imgBB...`);
  } else {
    console.log(`📸 Hospedando ${images.length} imagem(ns) no imgBB...`);
  }
  for (let i = imageUrls.length; i < images.length; i++) {
    const url = await uploadComRetry(images[i], IMGBB_API_KEY);
    imageUrls.push(url);
    console.log(`   [${imageUrls.length}] ${url}`);
    avanca({ status: 'hosting', imageUrls: [...imageUrls] });
  }
  if (!estado.uploadedAt) avanca({ status: 'propagating', imageUrls: [...imageUrls], uploadedAt: new Date().toISOString() });

  // O imgBB pode responder 200 no upload antes de o arquivo alcançar todos os
  // edges. A Meta baixa as imagens de outra rede e, nesse intervalo, devolve
  // 9004/2207052 mesmo que a URL já abra no servidor. Em produção aguardamos a
  // propagação antes de criar qualquer container; nos testes com API local a
  // espera padrão é zero.
  const esperaPadrao = process.env.IMGBB_API_BASE ? 0 : 180_000;
  const propagacaoMs = Number(process.env.IMGBB_PROPAGATION_WAIT_MS ?? esperaPadrao);
  if (!Number.isFinite(propagacaoMs) || propagacaoMs < 0) {
    throw new Error('IMGBB_PROPAGATION_WAIT_MS precisa ser um número maior ou igual a zero');
  }
  const decorridoMs = Date.now() - Date.parse(estado.uploadedAt);
  const restanteMs = Math.max(0, propagacaoMs - (Number.isFinite(decorridoMs) ? decorridoMs : 0));
  if (restanteMs > 0) {
    console.log(`\n⏳ Aguardando ${Math.ceil(restanteMs / 1000)}s para o imgBB propagar as imagens...`);
    await new Promise(resolve => setTimeout(resolve, restanteMs));
  }
  if (!process.env.IMGBB_API_BASE) {
    console.log('   Conferindo se todas as URLs já respondem como imagem...');
    await confirmaUrlsPublicas(imageUrls);
  }
  avanca({ status: 'ready-for-meta', imageUrls: [...imageUrls] });

  // Devolve a função que tira a imagem `i` de uma url que a Meta não consegue
  // baixar e a põe num endereço novo, persistindo a troca no estado — senão uma
  // retomada voltaria a usar a url ruim, que é o mesmo beco.
  const reHospedarImagem = i => async () => {
    const nova = await uploadComRetry(images[i], IMGBB_API_KEY, 4, 3000, { rehospedar: true });
    imageUrls[i] = nova;
    avanca({ imageUrls: [...imageUrls] });
    return nova;
  };

  let carouselId = estado.carouselId || null;
  // Quantos containers vieram do estado anterior: é o que separa "recém-criado"
  // (ERROR = a mídia tem problema) de "retomado" (ERROR = a sessão anterior já
  // gastou este container). Ver `esperaOuRefaz`.
  const carrosselRetomado = Boolean(estado.carouselId);
  const filhosRetomados = Array.isArray(estado.childIds) ? estado.childIds.length : 0;

  if (single) {
    if (!carouselId) {
      console.log('\n📦 Criando container de imagem única...');
      carouselId = await createSingleContainer(INSTAGRAM_BUSINESS_ID, imageUrls[0], caption, INSTAGRAM_ACCESS_TOKEN, reHospedarImagem(0));
      avanca({ status: 'container-created', carouselId });
    } else {
      console.log(`\n📦 Retomando container de imagem única: ${carouselId}`);
    }
    carouselId = await esperaOuRefaz({
      id: carouselId, veioDoEstado: carrosselRetomado, rotulo: 'o container de imagem única',
      accessToken: INSTAGRAM_ACCESS_TOKEN,
      recria: async () => {
        const novo = await createSingleContainer(INSTAGRAM_BUSINESS_ID, imageUrls[0], caption, INSTAGRAM_ACCESS_TOKEN, reHospedarImagem(0));
        avanca({ status: 'container-created', carouselId: novo });
        return novo;
      },
    });
    console.log(`   Container: ${carouselId}`);
  } else {
    console.log('\n📦 Criando containers de mídia...');
    const childIds = Array.isArray(estado.childIds) ? [...estado.childIds] : [];
    for (let i = childIds.length; i < imageUrls.length; i++) {
      childIds.push(await createChildContainer(INSTAGRAM_BUSINESS_ID, imageUrls[i], INSTAGRAM_ACCESS_TOKEN, reHospedarImagem(i)));
      avanca({ status: 'children-creating', childIds: [...childIds] });
    }
    console.log(`   Filhos: ${childIds.join(', ')}`);

    console.log('\n⏳ Aguardando processamento dos containers...');
    for (let i = 0; i < childIds.length; i++) {
      childIds[i] = await esperaOuRefaz({
        id: childIds[i], veioDoEstado: i < filhosRetomados, rotulo: `o slide ${i + 1}`,
        accessToken: INSTAGRAM_ACCESS_TOKEN,
        recria: async () => {
          const novo = await createChildContainer(INSTAGRAM_BUSINESS_ID, imageUrls[i], INSTAGRAM_ACCESS_TOKEN);
          childIds[i] = novo;
          avanca({ status: 'children-creating', childIds: [...childIds] });
          return novo;
        },
      });
    }
    console.log('   Todos prontos.');

    if (!carouselId) {
      console.log('\n🎠 Criando container do carrossel...');
      carouselId = await createCarouselContainer(INSTAGRAM_BUSINESS_ID, childIds, caption, INSTAGRAM_ACCESS_TOKEN);
      avanca({ status: 'carousel-created', childIds: [...childIds], carouselId });
    } else {
      console.log(`\n🎠 Retomando container do carrossel: ${carouselId}`);
    }
    carouselId = await esperaOuRefaz({
      id: carouselId, veioDoEstado: carrosselRetomado, rotulo: 'o container do carrossel',
      accessToken: INSTAGRAM_ACCESS_TOKEN,
      // ⚠️ OS FILHOS VÃO JUNTO. Recriar só o carrossel não basta: um container
      // FILHO já consumido continua respondendo `FINISHED` — ele não avisa que
      // foi gasto, ao contrário do carrossel, que responde `ERROR`. Então a
      // recriação montaria um carrossel novo sobre filhos mortos, e a Meta
      // devolve `500 An unexpected error has occurred`, que não diz nada.
      //
      // Se o carrossel foi gasto, os filhos dele foram no mesmo `media_publish`.
      // Não há como perguntar isso à Meta — dá para deduzir, e é o que se faz.
      //
      // ⚠️ O CASO REAL É "post publicado e depois APAGADO": a reconciliação
      // responde com honestidade que ele não está no ar, o retry é liberado, e
      // sem isto a peça ficava impossível de republicar para sempre. As URLs do
      // imgBB continuam valendo, então refazer os filhos não custa upload.
      recria: async () => {
        console.log(`   Os filhos foram gastos no mesmo envio — refazendo os ${imageUrls.length} antes.`);
        for (let i = 0; i < imageUrls.length; i++) {
          childIds[i] = await createChildContainer(INSTAGRAM_BUSINESS_ID, imageUrls[i], INSTAGRAM_ACCESS_TOKEN);
        }
        avanca({ status: 'children-creating', childIds: [...childIds] });
        for (let i = 0; i < childIds.length; i++) {
          await pollUntilFinished(childIds[i], INSTAGRAM_ACCESS_TOKEN);
        }
        const novo = await createCarouselContainer(INSTAGRAM_BUSINESS_ID, childIds, caption, INSTAGRAM_ACCESS_TOKEN);
        avanca({ status: 'carousel-created', childIds: [...childIds], carouselId: novo });
        return novo;
      },
    });
    console.log(`   Carrossel: ${carouselId}`);
  }

  if (dryRun) {
    avanca({ status: 'dry-run-complete', carouselId });
    console.log('\n✅ DRY RUN concluído — pulei a publicação final.');
    console.log(`   Container pronto: ${carouselId}`);
    return;
  }

  console.log('\n🚀 Publicando no Instagram...');
  const postId = await publishMedia(INSTAGRAM_BUSINESS_ID, carouselId, INSTAGRAM_ACCESS_TOKEN);

  // 🚨 A PARTIR DAQUI O POST ESTÁ NO AR E NADA PODE DERRUBAR O PROCESSO.
  //
  // O `publishMedia` acima é irreversível. Tudo o que vem depois é
  // CONTABILIDADE: permalink, estado em disco, token. Erro em contabilidade é
  // problema de registro, e reportá-lo como falha faz quem chamou tratar um
  // sucesso como fracasso — ele vê código 1, pergunta ao Instagram pela MESMA
  // rede que acabou de falhar, não obtém resposta, e dispara
  // "🚨 NÃO foi ao ar" para um post publicado.
  //
  // Não é hipótese: um publicador pode quebrar gravando o arquivo de estado, um
  // instante depois de publicar, e sair com código 1 tendo publicado. Aqui o
  // risco mora no `getPermalink`, que trata `!res.ok` mas deixaria a falha de
  // TRANSPORTE (o `fetch failed` de uma rede instável) subir e matar tudo.
  //
  // O ID sai no log ANTES de qualquer coisa falível: se o resto do mundo cair,
  // o número que identifica o post já está escrito.
  // ⚠️ A frase "Publicado com sucesso" é CONTRATO: a suíte de testes casa por
  // ela, e o log do cron é lido por ela. O ID vem junto, na mesma linha, porque
  // ele é a única coisa que identifica o post se tudo abaixo falhar.
  console.log(`\n✅ Publicado com sucesso! Post ID: ${postId}`);

  let permalink = null;
  try {
    permalink = await getPermalink(postId, INSTAGRAM_ACCESS_TOKEN);
    if (permalink) console.log(`   URL: ${permalink}`);
  } catch (e) {
    console.error(`   ⚠ publiquei, mas não consegui buscar o permalink: ${semToken(e.message)}`);
  }

  try {
    avanca({ status: 'confirmed', carouselId, postId, permalink, confirmedAt: new Date().toISOString() });
  } catch (e) {
    console.error(`   ⚠ publiquei, mas não consegui gravar o estado: ${semToken(e.message)}`);
    console.error('     O post ESTÁ no ar, com o ID acima. O estado local não foi gravado: confira o perfil antes de rodar de novo com este arquivo de estado.');
  }

  await renovaNoFim(INSTAGRAM_ACCESS_TOKEN, envPath);
}

// ⚠️ EXPORTS — para o publicador de STORY.
//
// Story usa `media_type: STORIES`, que este motor não faz: ele publica
// carrossel. Mas tudo o que vem ANTES de publicar é idêntico — ler o .env,
// conferir de quem é a conta, subir a imagem, esperar o container ficar pronto,
// publicar, pegar o permalink e renovar o token.
//
// Duplicar isso num segundo arquivo repetiria a **trava das três pontas**, que
// é justamente a proteção contra publicar na conta errada. O CLAUDE.md já
// registra o preço dessa escolha em outro lugar do projeto: *"copiar o arquivo
// por conta seria fabricar o bug que se corrige numa cópia e sobrevive na
// outra"*. Então o story importa daqui em vez de copiar.
//
// Nada abaixo muda o fluxo do carrossel: exportar não executa nada.
export {
  loadEnv, parseArgs, conferirConta, quemSouEu,
  uploadComRetry, confirmaUrlsPublicas, criarContainerComRetry,
  pollUntilFinished, publishMedia, getPermalink, refreshToken, renovaNoFim, igBase,
};

// Só roda main() quando o arquivo é executado direto, não se for importado.
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch(err => {
    console.error(`\n❌ ${semToken(err.message)}`);
    // exitCode em vez de process.exit(): matar o processo com conexão ainda
    // aberta faz o libuv do Windows cuspir "Assertion failed: UV_HANDLE_CLOSING"
    // logo abaixo da mensagem de erro — ruído bem na hora em que o erro precisa
    // ser lido. Assim o Node encerra sozinho, com o mesmo código de saída.
    process.exitCode = 1;
  });
}
