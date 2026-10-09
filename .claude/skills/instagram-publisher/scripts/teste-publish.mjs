#!/usr/bin/env node
// Testes do publish.js — com foco no que não pode falhar NUNCA:
// publicar na conta errada.
//
// Rodar:  node .claude/skills/instagram-publisher/scripts/teste-publish.mjs
//
// Como funciona: sobe um servidor local que finge ser a API do Instagram e o
// imgBB, e roda o publish.js DE VERDADE contra ele. Não é mock de função solta
// — é a esteira inteira, do parse de argumento ao media_publish, exercitada
// ponta a ponta sem que nada chegue perto de uma conta real.
//
// A prova principal que o servidor grava: EM QUAL ID a publicação foi tentada.
// Um teste que só conferisse mensagem de erro não provaria isso.
//
// ⚠️ Todo fixture é obrigado a começar com "teste-" (ver `fixture()`). Sem essa
// trava, um fixture com o nome de uma conta de verdade sobrescreveria e depois
// apagaria as credenciais REAIS daquela conta. Os arquivos casam com o
// .gitignore (.env.*), então nunca versionam, e são apagados no fim.

import { createServer } from 'node:http';
import { writeFileSync, readFileSync, unlinkSync, existsSync, mkdirSync, rmdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { valorDoEnv, semToken } from './publish.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '..', '..', '..', '..');
const PUBLISH = resolve(AQUI, 'publish.js');
// 🚨 O RASCUNHO DO TESTE VIVE FORA DO ONEDRIVE, e isso não é preferência.
// Dentro de uma pasta sincronizada (OneDrive), a suíte reprova com
// `EPERM: operation not permitted, rename ...publicador.json.tmp-... ->
// publicador.json`. O OneDrive abre o arquivo pra sincronizar no exato
// instante em que o `escreveJsonAtomico` faz o rename, e o rename morre.
// O teste passa no reteste, que é o pior tipo de falha: ensina a ignorar o
// portão. Em `os.tmpdir()` nada sincroniza, e o rename é atômico de verdade.
const TMP = resolve(tmpdir(), 'template-os-teste-publish');

// Contas de mentira. Os NOMES começam com "teste-" de propósito: o publish.js
// exige que o nome do arquivo bata com o INSTAGRAM_CONTA de dentro, então o
// nome do fixture é também o @ que a API falsa devolve.
const SEGUNDA = { id: '27684752681193182', user: 'teste-conta-segunda' };
const PRINCIPAL = { id: '17841400000000000', user: 'teste-conta-principal' };

let servidor, PORTA;
const chamadas = [];
let respostaMe = null;
let derrubarMe = false;
let ecoarMe = false;     // o /me responde 500 ecoando o pedido, token junto
let ecoarMedia = false;  // o /media responde 400 ecoando o pedido, token junto
let modoRefresh = 'ok';    // 'ok' | 'erro' (token novo demais pra renovar) | 'eco' (o erro ecoa a query, com o token)
let containersCriados = 0; // cada /media devolve um id novo
const envenenados = new Set(); // containers que respondem ERROR (já consumidos)
const gastos = new Set();      // FILHOS já consumidos: dizem FINISHED e derrubam o carrossel
// URLs que a Meta se recusa a baixar, com o 9004 real. Serve pra provar a
// CAMADA 2 do publish.js: repetir na mesma url nunca escapa, e o imgBB devolve
// a mesma url pro mesmo conteúdo — só re-hospedar com bytes diferentes sai.
const urlsEnvenenadas = new Set();
let envenenarTudo = false;   // nem re-hospedar salva: prova que ele DESISTE

function sobeServidor() {
  return new Promise(ok => {
    servidor = createServer((req, res) => {
      const url = new URL(req.url, `http://127.0.0.1:${PORTA}`);
      const p = url.pathname;
      chamadas.push({ metodo: req.method, caminho: p, busca: url.search });
      const json = (o, cod = 200) => {
        res.writeHead(cod, { 'content-type': 'application/json' });
        res.end(JSON.stringify(o));
      };
      // 🚨 DEDUPE POR CONTEÚDO, que é o que o imgBB REAL faz. Medido contra a
      // API de produção: o mesmo arquivo enviado duas vezes volta com a MESMA
      // url, inclusive entre execuções separadas por horas. Um servidor falso
      // com url fixa não reproduziria o beco sem saída que isso cria.
      if (p === '/1/upload') {
        const pedacos = [];
        req.on('data', c => pedacos.push(c));
        req.on('end', () => {
          // ⚠️ Hash da IMAGEM, não do corpo cru. O multipart carrega uma
          // fronteira aleatória por processo, então hashear o corpo inteiro
          // deduplicava dentro de uma execução e falhava entre execuções — que
          // é exatamente o caso que precisa ser reproduzido aqui.
          const corpo = Buffer.concat(pedacos).toString('latin1');
          const achou = corpo.match(/name="image"\r?\n\r?\n([\s\S]*?)\r?\n--/);
          const conteudo = achou ? achou[1] : corpo;
          const hash = createHash('sha256').update(conteudo).digest('hex').slice(0, 12);
          json({ success: true, data: { url: `http://127.0.0.1:${PORTA}/img/${hash}.png` } });
        });
        return;
      }
      if (p === '/v23.0/me') {
        if (derrubarMe) { res.writeHead(500); return res.end('servidor caiu'); }
        if (ecoarMe) { res.writeHead(500); return res.end(`erro de fora: ${req.url}`); }
        return json(respostaMe);
      }
      // Cada container criado ganha um id novo. É o que deixa distinguir, no
      // teste do container envenenado, o que veio do estado do que foi recriado.
      if (p.endsWith('/media')) {
        if (ecoarMedia) return json({ error: { message: `erro de fora: ${req.url}` } }, 400);
        // A Meta não consegue baixar esta url específica. `is_transient: false`
        // é como ela mesma reporta o 9004, e é o que engana quem lê o erro.
        const alvoImg = url.searchParams.get('image_url');
        if (alvoImg && (envenenarTudo || urlsEnvenenadas.has(alvoImg))) {
          return json({ error: {
            message: 'Only photo or video can be accepted as media type.',
            type: 'OAuthException', code: 9004, error_subcode: 2207052, is_transient: false,
          } }, 400);
        }
        // ⚠️ O QUE A META FAZ COM FILHO JÁ CONSUMIDO, e este servidor finge:
        // montar um carrossel sobre filho gasto devolve
        // `500 An unexpected error has occurred`, sem dizer o motivo. O filho
        // gasto, perguntado sozinho, continua respondendo FINISHED — ele NÃO
        // avisa que morreu. Sem fingir isso, execuções morrem na produção sem
        // que nenhum teste perceba.
        const filhos = (url.searchParams.get('children') || '').split(',').filter(Boolean);
        if (filhos.some(f => gastos.has(f))) {
          return json({ error: {
            message: 'An unexpected error has occurred. Please retry your request later.',
            type: 'OAuthException', is_transient: true, code: 2,
          } }, 500);
        }
        return json({ id: `container-${++containersCriados}` });
      }
      if (p.endsWith('/media_publish')) return json({ id: 'post-1' });
      if (url.searchParams.get('fields') === 'status_code') {
        // `envenenados` finge o que a Meta faz com container já consumido por
        // uma tentativa anterior: ela responde ERROR, para sempre.
        const alvo = p.replace(/^\/v23\.0\//, '');
        return json({ status_code: envenenados.has(alvo) ? 'ERROR' : 'FINISHED' });
      }
      if (url.searchParams.get('fields') === 'permalink') return json({ permalink: 'http://exemplo/post-1' });
      // Mídia servida de verdade, com o content-type de verdade. É o que o
      // servidor de mídia do Reels devolve — e o que a conferência de URL tem
      // que aceitar. HEAD não leva corpo.
      if (p === '/midia/prova.mp4' || p === '/midia/prova.png') {
        res.writeHead(200, { 'content-type': p.endsWith('.mp4') ? 'video/mp4' : 'image/png' });
        return res.end();
      }
      if (p === '/v23.0/refresh_access_token') {
        // O refresh recusa token com menos de 24h — é o caso de um token recém-gerado
        if (modoRefresh === 'erro') return json({ error: { message: 'token is too new', code: 400 } }, 400);
        if (modoRefresh === 'eco') return json({ error: { message: `bad request ${url.search}`, code: 400 } }, 400);
        return json({ access_token: 'TOKEN_RENOVADO', expires_in: 5184000 });
      }
      return json({ ok: true });
    });
    servidor.listen(0, '127.0.0.1', () => { PORTA = servidor.address().port; ok(); });
  });
}

// O espião: um loopback que a trava da base NÃO aceita (ela só aceita 127.0.0.1,
// localhost e [::1]). Se a recusa virar aviso, é aqui que o pedido com a
// credencial chega, e o caso vê. A porta 1 dos outros casos não vê isso: o
// fetch barra a porta antes de o pedido sair.
const espiao = [];
let servidorEspiao, BASE_ESPIAO;
function sobeEspiao() {
  return new Promise(ok => {
    servidorEspiao = createServer((req, res) => {
      const pedacos = [];
      req.on('data', c => pedacos.push(c));
      req.on('end', () => {
        espiao.push(`${req.method} ${req.url.replace(/access_token=[^&]+/, 'access_token=***')} ${Buffer.concat(pedacos).length}B`);
        res.writeHead(500); res.end();
      });
    });
    servidorEspiao.listen(0, '127.0.0.2', () => { BASE_ESPIAO = `http://127.0.0.2:${servidorEspiao.address().port}`; ok(); });
  });
}

const criados = new Set();

/** Escreve scripts/.env.<nome> apontando pro servidor falso.
 *  `declara` é o INSTAGRAM_CONTA gravado dentro — normalmente igual ao nome do
 *  arquivo; diferente só no teste que prova que o script recusa arquivo mentiroso. */
function fixture(nome, { id, declara = nome }) {
  if (!nome.startsWith('teste-')) {
    throw new Error(`FIXTURE PERIGOSO: "${nome}" não começa com "teste-". `
      + `Isso sobrescreveria um .env de conta real e depois o apagaria.`);
  }
  const caminho = resolve(RAIZ, 'scripts', `.env.${nome}`);
  writeFileSync(caminho,
      `INSTAGRAM_BUSINESS_ID=${id}\n`
    + `INSTAGRAM_ACCESS_TOKEN=TOKEN_FALSO\n`
    + `INSTAGRAM_TOKEN_REFRESHED_AT=${new Date().toISOString().slice(0, 10)}\n`
    + (declara ? `INSTAGRAM_CONTA=${declara}\n` : '')
    + `IMGBB_API_KEY=CHAVE_FALSA\n`
    + `IMGBB_API_BASE=http://127.0.0.1:${PORTA}\n`
    + `META_API_BASE=http://127.0.0.1:${PORTA}\n`
    + `META_API_VERSION=v23.0\n`);
  criados.add(caminho);
  return caminho;
}

const TIMEOUT_RODA_MS = 40_000;
const tempos = [];

function roda(args, envExtra = {}) {
  const t0 = Date.now();
  return new Promise(ok => {
    execFile(process.execPath, [PUBLISH, ...args], {
      cwd: RAIZ, env: { ...process.env, ...envExtra }, timeout: TIMEOUT_RODA_MS,
    }, (err, stdout, stderr) => {
      const ms = Date.now() - t0;
      tempos.push([ms, err?.killed === true, args.join(' ').slice(0, 40)]);
      // 🚨 Mesma armadilha da suíte de vídeo:
      // processo MORTO pelo timeout sai com código não-zero, igual a uma falha
      // legítima, e as asserções de "saiu com código != 0" passam. O defeito
      // reaparece três asserções adiante, disfarçado de outra coisa.
      if (err?.killed === true) {
        console.log(`  🚨 [timeout] o publicador foi MORTO após ${ms}ms (teto ${TIMEOUT_RODA_MS}ms).`);
        console.log('     Nada que ele faria DEPOIS de publicar aconteceu. Qualquer');
        console.log('     reprovação de estado ou limpeza abaixo é consequência disto.');
      }
      ok({ codigo: err?.code ?? 0, morto: err?.killed === true, saida: `${stdout}${stderr}` });
    });
  });
}

/** Ambiente que substitui o scripts/.env real no teste sem --conta.
 *  O loadEnv só grava chave AINDA indefinida, então o que vai aqui vence o
 *  arquivo — o token verdadeiro de quem usa nunca entra em jogo. */
const ambienteLegado = (id, extra = {}) => ({
  INSTAGRAM_BUSINESS_ID: id,
  INSTAGRAM_ACCESS_TOKEN: 'TOKEN_FALSO',
  INSTAGRAM_TOKEN_REFRESHED_AT: new Date().toISOString().slice(0, 10),
  INSTAGRAM_CONTA: '',
  IMGBB_API_KEY: 'CHAVE_FALSA',
  IMGBB_API_BASE: `http://127.0.0.1:${PORTA}`,
  META_API_BASE: `http://127.0.0.1:${PORTA}`,
  META_API_VERSION: 'v23.0',
  ...extra,
});

let passou = 0, falhou = 0;
function confere(nome, condicao, detalhe = '') {
  if (condicao) { passou++; console.log(`  ✅ ${nome}`); }
  else { falhou++; console.log(`  ❌ ${nome}\n     ${String(detalhe).replace(/\n/g, '\n     ')}`); }
}
const contaChamadas = caminho => chamadas.filter(c => c.caminho === caminho).length;
const publicou = () => chamadas.some(c => c.caminho.includes('media_publish'));

(async () => {
  await sobeServidor();
  await sobeEspiao();
  mkdirSync(TMP, { recursive: true });
  const PNG = resolve(TMP, 'slide.png');
  const ESTADO = resolve(TMP, 'publicador.json');
  writeFileSync(PNG, Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));
  const LEG = ['--caption', 'legenda de teste'];

  try {
    console.log('\n━━━ 1. Validação do --conta ━━━');

    let r = await roda(['--conta', '../fora', '--images', PNG, ...LEG]);
    confere('recusa --conta com travessia de caminho', r.codigo !== 0 && /inválido/i.test(r.saida), r.saida.slice(0, 200));

    r = await roda(['--conta', '..', '--images', PNG, ...LEG]);
    confere('recusa --conta ".."', r.codigo !== 0 && /inválido/i.test(r.saida), r.saida.slice(0, 200));

    r = await roda(['--conta', 'nao-existe-mesmo', '--images', PNG, ...LEG]);
    confere('erro claro quando o .env da conta não existe',
      r.codigo !== 0 && /não encontradas/i.test(r.saida), r.saida.slice(0, 200));

    console.log('\n━━━ 2. A trava das três pontas ━━━');

    // (a) o arquivo mente: chama-se X mas declara ser Y
    fixture('teste-arquivo-mentiroso', { id: SEGUNDA.id, declara: PRINCIPAL.user });
    chamadas.length = 0;
    r = await roda(['--conta', 'teste-arquivo-mentiroso', '--images', PNG, ...LEG]);
    confere('para quando o nome do arquivo não bate com o INSTAGRAM_CONTA de dentro',
      r.codigo !== 0 && /CONTA INCOERENTE/.test(r.saida), r.saida.slice(0, 300));
    confere('  └ e nem chegou a perguntar à API', contaChamadas('/v23.0/me') === 0, JSON.stringify(chamadas));

    // (b) o arquivo tem o ID de uma conta e o token é de outra
    fixture('teste-conta-segunda', { id: PRINCIPAL.id });
    respostaMe = { id: SEGUNDA.id, username: SEGUNDA.user };
    chamadas.length = 0;
    r = await roda(['--conta', 'teste-conta-segunda', '--images', PNG, ...LEG]);
    confere('para quando o ID gravado não é o dono do token',
      r.codigo !== 0 && /CONTA INCOERENTE/.test(r.saida), r.saida.slice(0, 400));
    confere('  └ e não subiu NADA pro imgBB antes de parar',
      contaChamadas('/1/upload') === 0, JSON.stringify(chamadas));
    // O conserto aponta para o que existe aqui: o modo conexão desta skill, e
    // não um script de outra operação que não acompanha o motor.
    confere('  └ e manda refazer pelo modo conexão do /instagram-publisher',
      /modo conexão do \/instagram-publisher/.test(r.saida) && /conexao\.md/.test(r.saida), r.saida.slice(0, 400));

    // (c) O caso que mais assusta: o token é o da conta PRINCIPAL
    fixture('teste-conta-segunda', { id: PRINCIPAL.id });
    respostaMe = { id: PRINCIPAL.id, username: PRINCIPAL.user };
    chamadas.length = 0;
    r = await roda(['--conta', 'teste-conta-segunda', '--images', PNG, ...LEG]);
    confere('para quando o token é da conta PRINCIPAL e se esperava a segunda',
      r.codigo !== 0 && /CONTA ERRADA/.test(r.saida), r.saida.slice(0, 400));
    confere('  └ e não publicou nada', !publicou(), JSON.stringify(chamadas));

    console.log('\n━━━ 3. Falha fechada ━━━');

    fixture('teste-conta-segunda', { id: SEGUNDA.id });
    derrubarMe = true;
    chamadas.length = 0;
    r = await roda(['--conta', 'teste-conta-segunda', '--images', PNG, ...LEG]);
    derrubarMe = false;
    confere('API fora do ar → NÃO publica',
      r.codigo !== 0 && /não consegui confirmar/i.test(r.saida), r.saida.slice(0, 400));
    confere('  └ tentou 3 vezes antes de desistir', contaChamadas('/v23.0/me') === 3, `tentativas: ${contaChamadas('/v23.0/me')}`);
    confere('  └ e não publicou nada', !publicou(), JSON.stringify(chamadas));

    console.log('\n━━━ 4. O caminho feliz ━━━');

    fixture('teste-conta-segunda', { id: SEGUNDA.id });
    respostaMe = { id: SEGUNDA.id, username: SEGUNDA.user };
    chamadas.length = 0;
    r = await roda(['--conta', 'teste-conta-segunda', '--images', `${PNG},${PNG}`, ...LEG, '--state-file', ESTADO]);
    confere('publica quando as três pontas concordam',
      r.codigo === 0 && /Publicado com sucesso/.test(r.saida), r.saida.slice(-500));
    confere('  └ anuncia a conta antes de publicar',
      new RegExp(`publicando em @${SEGUNDA.user}`).test(r.saida), r.saida.slice(0, 500));
    const alvos = chamadas.filter(c => c.caminho.endsWith('/media_publish')).map(c => c.caminho);
    confere('  └ publicou NO ID DA CONTA CERTA',
      alvos.length === 1 && alvos[0].includes(SEGUNDA.id) && !alvos[0].includes(PRINCIPAL.id), JSON.stringify(alvos));
    confere('  └ montou carrossel (2 filhos + 1 pai)',
      chamadas.filter(c => c.caminho.endsWith('/media')).length === 3,
      String(chamadas.filter(c => c.caminho.endsWith('/media')).length));
    const estadoSalvo = JSON.parse(readFileSync(ESTADO, 'utf8'));
    confere('  └ preservou URLs, containers e recibo no estado retomável',
      estadoSalvo.status === 'confirmed'
        && estadoSalvo.imageUrls.length === 2
        && estadoSalvo.childIds.length === 2
        && estadoSalvo.postId === 'post-1', JSON.stringify(estadoSalvo));

    writeFileSync(ESTADO, JSON.stringify({
      ...estadoSalvo,
      status: 'ready-for-meta',
      childIds: [],
      carouselId: null,
      postId: null,
      permalink: null,
    }, null, 2));
    chamadas.length = 0;
    r = await roda(['--conta', 'teste-conta-segunda', '--images', `${PNG},${PNG}`, ...LEG, '--state-file', ESTADO]);
    confere('  └ retomada intermediária reutiliza URLs e não repete upload',
      r.codigo === 0 && /Retomando 2\/2 URL/.test(r.saida) && publicou() && contaChamadas('/1/upload') === 0,
      `${r.saida}\n${JSON.stringify(chamadas)}`);

    chamadas.length = 0;
    r = await roda(['--conta', 'teste-conta-segunda', '--images', `${PNG},${PNG}`, ...LEG, '--state-file', ESTADO]);
    confere('  └ segunda execução reconhece o recibo e não republica',
      r.codigo === 0 && /já foi confirmada/i.test(r.saida) && !publicou() && contaChamadas('/1/upload') === 0,
      `${r.saida}\n${JSON.stringify(chamadas)}`);

    // ━━━ o container que a tentativa anterior já gastou ━━━
    //
    // ⚠️ CASO REAL: a Meta devolve 403, o retry retoma o container de
    // carrossel gravado no estado, acha-o em ERROR (já consumido) e morreria
    // ali, sem a tentativa que existe para salvar o post chegar a criar um
    // container novo.
    // ⚠️ O fingerprint tem que ser o REAL, herdado do estado que a execução
    // anterior deixou. Com um fingerprint qualquer, o `carregaEstado` descarta
    // o arquivo e a execução vira uma publicação limpa — o caso passaria verde
    // sem nunca ter exercitado a retomada.
    const anterior = JSON.parse(readFileSync(ESTADO, 'utf8'));
    envenenados.clear();
    envenenados.add('container-envenenado');
    writeFileSync(ESTADO, JSON.stringify({
      schemaVersion: 1,
      fingerprint: anterior.fingerprint,
      status: 'carousel-created',
      imageUrls: anterior.imageUrls,
      childIds: anterior.childIds,
      carouselId: 'container-envenenado',
    }, null, 2));
    chamadas.length = 0;
    r = await roda(['--conta', 'teste-conta-segunda', '--images', `${PNG},${PNG}`, ...LEG, '--state-file', ESTADO]);
    confere('container retomado em ERROR é recriado, não mata a publicação',
      r.codigo === 0 && publicou(), `${r.saida.slice(-700)}`);
    confere('  └ e ele avisa que recriou, em vez de sumir com o motivo',
      /inutiliz[áa]vel/i.test(r.saida) && /Recriando uma vez/i.test(r.saida), r.saida.slice(-700));

    // ── O post publicado e DEPOIS APAGADO ────────────────────────────────
    //
    // ⚠️ ESTE CASO MATA EXECUÇÕES SEGUIDAS EM PRODUÇÃO, e só este teste o vê.
    // O `media_publish` consome o carrossel E os filhos. O carrossel avisa
    // (responde ERROR); os filhos NÃO — respondem FINISHED como se estivessem
    // vivos. Então a recriação montaria um carrossel novo sobre filhos mortos e
    // a Meta devolve 500 sem explicar.
    //
    // Na produção a trava do recibo impede chegar aqui — EXCETO quando o post
    // foi publicado e depois apagado: aí a reconciliação responde, com razão,
    // que ele não está no ar, o retry é liberado, e sem o refazer dos filhos a
    // peça ficaria impossível de republicar para sempre.
    {
      const anterior2 = JSON.parse(readFileSync(ESTADO, 'utf8'));
      envenenados.clear(); gastos.clear();
      envenenados.add('carrossel-gasto');
      for (const f of anterior2.childIds) gastos.add(f);
      writeFileSync(ESTADO, JSON.stringify({
        schemaVersion: 1,
        fingerprint: anterior2.fingerprint,
        status: 'carousel-created',
        imageUrls: anterior2.imageUrls,
        childIds: anterior2.childIds,
        carouselId: 'carrossel-gasto',
      }, null, 2));
      chamadas.length = 0;
      r = await roda(['--conta', 'teste-conta-segunda', '--images', `${PNG},${PNG}`, ...LEG, '--state-file', ESTADO]);
      confere('post publicado e depois APAGADO volta a publicar (filhos gastos são refeitos)',
        r.codigo === 0 && publicou(), r.saida.slice(-800));
      confere('  └ e ele diz que refez os filhos, em vez de morrer num 500 mudo',
        /filhos foram gastos/i.test(r.saida), r.saida.slice(-800));
      const salvo = JSON.parse(readFileSync(ESTADO, 'utf8'));
      confere('  └ e os filhos gravados no estado são os NOVOS',
        salvo.childIds.every(f => !gastos.has(f)), JSON.stringify(salvo.childIds));
      gastos.clear();
    }

    // O contrário, e é o que impede o looping: container RECÉM-CRIADO em ERROR
    // está dizendo que a mídia tem problema. Refazer daria o mesmo erro sempre.
    envenenados.clear();
    if (existsSync(ESTADO)) unlinkSync(ESTADO);
    let proximo = containersCriados + 1;
    envenenados.add(`container-${proximo}`);
    chamadas.length = 0;
    r = await roda(['--conta', 'teste-conta-segunda', '--images', PNG, ...LEG, '--state-file', ESTADO]);
    confere('  └ mas container RECÉM-CRIADO em ERROR PARA (a mídia é que está ruim)',
      r.codigo !== 0 && !publicou(), `${r.saida.slice(-500)}`);
    envenenados.clear();
    if (existsSync(ESTADO)) unlinkSync(ESTADO);

    console.log('\n━━━ 5. A conta principal não pode ter mudado ━━━');

    respostaMe = { id: PRINCIPAL.id, username: PRINCIPAL.user };
    chamadas.length = 0;
    r = await roda(['--images', PNG, ...LEG], ambienteLegado(PRINCIPAL.id));
    confere('sem --conta continua publicando como sempre',
      r.codigo === 0 && /Publicado com sucesso/.test(r.saida), r.saida.slice(-500));
    confere('  └ avisa que a conta não foi declarada', /não declarada/i.test(r.saida), r.saida.slice(0, 500));
    confere('  └ publicou no ID da conta principal',
      chamadas.some(c => c.caminho === `/v23.0/${PRINCIPAL.id}/media_publish`), JSON.stringify(chamadas));

    respostaMe = { id: SEGUNDA.id, username: SEGUNDA.user };
    chamadas.length = 0;
    r = await roda(['--images', PNG, ...LEG], ambienteLegado(PRINCIPAL.id));
    confere('sem --conta, ID incoerente com o token também para',
      r.codigo !== 0 && /CONTA INCOERENTE/.test(r.saida), r.saida.slice(0, 400));
    confere('  └ e não publicou nada', !publicou(), JSON.stringify(chamadas));

    // Com INSTAGRAM_CONTA declarado no ambiente legado, a ponta 1 volta a valer
    respostaMe = { id: PRINCIPAL.id, username: PRINCIPAL.user };
    r = await roda(['--images', PNG, ...LEG], ambienteLegado(PRINCIPAL.id, { INSTAGRAM_CONTA: SEGUNDA.user }));
    confere('sem --conta, INSTAGRAM_CONTA declarado ainda barra a conta errada',
      r.codigo !== 0 && /CONTA ERRADA/.test(r.saida), r.saida.slice(0, 400));

    console.log('\n━━━ 6. O dry-run também confere a conta ━━━');

    fixture('teste-conta-segunda', { id: PRINCIPAL.id });
    respostaMe = { id: PRINCIPAL.id, username: PRINCIPAL.user };
    chamadas.length = 0;
    r = await roda(['--conta', 'teste-conta-segunda', '--images', PNG, ...LEG, '--dry-run']);
    confere('--dry-run com a conta errada PARA (não é ensaio cego)',
      r.codigo !== 0 && /CONTA ERRADA/.test(r.saida), r.saida.slice(0, 400));

    console.log('\n━━━ 7. Isolamento entre as contas ━━━');

    // A renovação de token de uma conta não pode tocar no arquivo da outra.
    fixture('teste-conta-segunda', { id: SEGUNDA.id });
    const arqPrincipal = fixture('teste-conta-principal', { id: PRINCIPAL.id });
    const antes = readFileSync(arqPrincipal, 'utf8');
    respostaMe = { id: SEGUNDA.id, username: SEGUNDA.user };
    // força a renovação: data velha o bastante para passar dos 50 dias
    const arqFut = resolve(RAIZ, 'scripts', '.env.teste-conta-segunda');
    writeFileSync(arqFut, readFileSync(arqFut, 'utf8').replace(/INSTAGRAM_TOKEN_REFRESHED_AT=.*/, 'INSTAGRAM_TOKEN_REFRESHED_AT=2020-01-01'));
    r = await roda(['--conta', 'teste-conta-segunda', '--images', PNG, ...LEG]);
    confere('publicou e renovou o token da segunda conta',
      r.codigo === 0 && /Token renovado/.test(r.saida), r.saida.slice(-400));
    confere('  └ o .env da OUTRA conta ficou intacto',
      readFileSync(arqPrincipal, 'utf8') === antes, 'o arquivo da conta principal foi alterado');
    confere('  └ e o token novo foi gravado no arquivo da conta certa',
      /TOKEN_RENOVADO/.test(readFileSync(arqFut, 'utf8')), 'token novo não foi gravado');

    // A renovação RECUSADA pela Meta (token novo demais) acontece DEPOIS de
    // publicar: o post está no ar, então ela avisa e segue, sem mexer no token.
    modoRefresh = 'erro';
    writeFileSync(arqFut, readFileSync(arqFut, 'utf8').replace(/INSTAGRAM_TOKEN_REFRESHED_AT=.*/, 'INSTAGRAM_TOKEN_REFRESHED_AT=2020-01-01'));
    r = await roda(['--conta', 'teste-conta-segunda', '--images', PNG, ...LEG]);
    modoRefresh = 'ok';
    confere('renovação recusada não derruba o post publicado',
      r.codigo === 0 && /Publicado com sucesso/.test(r.saida) && /Não consegui renovar o token agora/.test(r.saida),
      r.saida.slice(-400));
    confere('  └ e o token gravado continua o mesmo',
      /INSTAGRAM_ACCESS_TOKEN=TOKEN_RENOVADO/.test(readFileSync(arqFut, 'utf8')), 'o token mudou com a renovação recusada');

    console.log('\n━━━ 7b. A renovação sozinha (--so-renovar) ━━━');

    // Quem agenda o --so-renovar só sabe da falha pelo código de saída: a
    // renovação que a Meta recusa não pode sair 0.
    const arqRenova = fixture('teste-renova', { id: SEGUNDA.id });
    respostaMe = { id: SEGUNDA.id, username: 'teste-renova' };
    writeFileSync(arqRenova, readFileSync(arqRenova, 'utf8').replace(/INSTAGRAM_TOKEN_REFRESHED_AT=.*/, 'INSTAGRAM_TOKEN_REFRESHED_AT=2020-01-01'));
    modoRefresh = 'erro';
    r = await roda(['--conta', 'teste-renova', '--so-renovar']);
    confere('--so-renovar com a Meta recusando sai com erro e diz o motivo',
      r.codigo !== 0 && /renova/i.test(r.saida) && /too new/.test(r.saida), r.saida.slice(-400));
    confere('  └ e o token não aparece na saída',
      !/TOKEN_FALSO/.test(r.saida), r.saida.slice(-400));
    // a Meta que ecoa a query no erro: o token sai mascarado, e não só ausente
    modoRefresh = 'eco';
    r = await roda(['--conta', 'teste-renova', '--so-renovar']);
    confere('  └ e o token sai mascarado mesmo quando a Meta o ecoa no erro',
      r.codigo !== 0 && !/TOKEN_FALSO/.test(r.saida) && /access_token=\*\*\*/.test(r.saida), r.saida.slice(-400));
    confere('  └ e o .env da conta ficou como estava',
      /INSTAGRAM_ACCESS_TOKEN=TOKEN_FALSO/.test(readFileSync(arqRenova, 'utf8')), 'o token mudou sem a renovação');
    modoRefresh = 'ok';
    // dentro do prazo: sucesso, sem perguntar nada à Meta
    writeFileSync(arqRenova, readFileSync(arqRenova, 'utf8').replace(/INSTAGRAM_TOKEN_REFRESHED_AT=.*/, `INSTAGRAM_TOKEN_REFRESHED_AT=${new Date().toISOString().slice(0, 10)}`));
    chamadas.length = 0;
    r = await roda(['--conta', 'teste-renova', '--so-renovar']);
    confere('--so-renovar dentro do prazo sai 0 sem chamar a renovação da Meta',
      r.codigo === 0 && !chamadas.some(c => c.caminho.endsWith('/refresh_access_token')), `${r.codigo} ${JSON.stringify(chamadas)}`);
    // a publicação: a renovação do fim continua bônus, e a falha dela não derruba
    // o post. Com a Meta ecoando a query: o aviso do fim não passa pelo catch do
    // main, e a máscara da recusa é a única guarda do token
    writeFileSync(arqRenova, readFileSync(arqRenova, 'utf8').replace(/INSTAGRAM_TOKEN_REFRESHED_AT=.*/, 'INSTAGRAM_TOKEN_REFRESHED_AT=2020-01-01'));
    modoRefresh = 'eco';
    r = await roda(['--conta', 'teste-renova', '--images', PNG, ...LEG]);
    confere('a publicação com a renovação do fim recusada continua valendo (sai 0) e avisa no log',
      r.codigo === 0 && /renovar o token/i.test(r.saida), r.saida.slice(-400));
    confere('  └ e o token sai mascarado no aviso do fim',
      !/TOKEN_FALSO/.test(r.saida) && /access_token=\*\*\*/.test(r.saida), r.saida.slice(-400));
    modoRefresh = 'ok';
    // as seções seguintes publicam na segunda conta: a API falsa volta a ser dela
    respostaMe = { id: SEGUNDA.id, username: SEGUNDA.user };

    console.log('\n━━━ 8. A conferência de URL ━━━');

    // ── A conferência de URL aceita VÍDEO quando o vídeo é o esperado ──────
    //
    // ⚠️ Com `image/` fixo no `confirmaUrlsPublicas`, o publish-reels.js, que o
    // reaproveita com um MP4, reprovaria de 15 em 15 minutos um vídeo que
    // responde `HTTP 200, content-type video/mp4` — a resposta CERTA lida como
    // defeito. O resto da suíte não vê porque em teste ela nem roda: o caminho
    // do carrossel pula a conferência quando `IMGBB_API_BASE` está setado (é API
    // local, não tem propagação). Função que a suíte inteira pula é função sem
    // teste, e este bloco é o dela.
    // Roda em processo FILHO de propósito: abrir socket aqui dentro faz o
    // `process.exit` do fim deste arquivo cair na assertion do libuv no
    // Windows — o mesmo motivo pelo qual o publish.js usa `exitCode`.
    const tentaUrl = (arquivo, esperado) => new Promise(ok => execFile(process.execPath, ['-e', `
      import('file://${PUBLISH.replace(/\\/g, '/')}').then(async m => {
        try {
          await m.confirmaUrlsPublicas(['http://127.0.0.1:${PORTA}/midia/${arquivo}'],
            { tentativas: 1, ${esperado ? `esperado: '${esperado}'` : ''} });
          console.log('PASSOU');
        } catch (e) { console.log('REPROVOU: ' + e.message); }
      });
    `], { timeout: 20_000 }, (err, stdout, stderr) => ok(`${stdout}${stderr}`.trim())));

    confere('conferência de URL: MP4 passa quando se espera vídeo',
      /PASSOU/.test(await tentaUrl('prova.mp4', 'video/')), await tentaUrl('prova.mp4', 'video/'));
    confere('  └ e o PNG continua passando no padrão (imagem)',
      /PASSOU/.test(await tentaUrl('prova.png')), await tentaUrl('prova.png'));
    const trocado = await tentaUrl('prova.mp4');
    confere('  └ MP4 onde se espera imagem REPROVA, dizendo o que esperava',
      /REPROVOU/.test(trocado) && /video\/mp4/.test(trocado) && /esperava image\//.test(trocado), trocado);

    // ── Falha de REDE não é falha de MÍDIA ────────────────────────────────
    //
    // ⚠️ O FALSO ALARME: uma rodada sobe as 10 imagens, espera os 180s, e o
    // HEAD de conferência estoura com `fetch failed` na PRIMEIRA URL — sem
    // resposta HTTP nenhuma. Se o publicador sai com código 1, quem o agenda
    // avisa "a peça de hoje NÃO foi ao ar", e a rodada seguinte publica AS
    // MESMAS URLs sem uma reclamação. A mídia está pública o tempo todo: o que
    // oscila é a rede do servidor.
    //
    // A régua separa as duas: resposta errada reprova, ausência de
    // resposta avisa e segue — porque quem baixa a imagem de verdade é a Meta,
    // e o `criarContainerComRetry` já espera e repete 8× por causa disso.
    const tentaUrlCrua = url => new Promise(ok => execFile(process.execPath, ['-e', `
      import('file://${PUBLISH.replace(/\\/g, '/')}').then(async m => {
        try {
          await m.confirmaUrlsPublicas(['${url}'], { tentativas: 1 });
          console.log('PASSOU');
        } catch (e) { console.log('REPROVOU: ' + e.message); }
      });
    `], { timeout: 20_000 }, (err, stdout, stderr) => ok(`${stdout}${stderr}`.trim())));

    // Uma porta que o SO acabou de liberar: recusa na hora, sem resposta HTTP.
    // (porta fixa baixa não serve — a 1 é 'bad port' pro fetch e nem chega a
    //  tentar conectar, então não exercitaria o caminho de rede sem resposta.)
    const portaMorta = await new Promise(ok => {
      const s = createServer();
      s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); });
    });
    const semRede = await tentaUrlCrua(`http://127.0.0.1:${portaMorta}/imagem.png`);
    confere('URL que não responde AVISA e segue (rede é nossa, mídia não é)',
      /PASSOU/.test(semRede) && !/REPROVOU/.test(semRede), semRede);
    confere('  └ e o aviso nomeia o erro de rede, não só "fetch failed"',
      /ECONNREFUSED/.test(semRede), semRede);

    // O outro lado da moeda: respondeu, e respondeu errado → continua reprovando.
    const respondeErrado = await tentaUrlCrua(`http://127.0.0.1:${PORTA}/nao-e-imagem`);
    confere('  └ mas URL que RESPONDE errado continua reprovando',
      /REPROVOU/.test(respondeErrado) && /esperava image\//.test(respondeErrado), respondeErrado);

    // E o publish-reels.js pede vídeo de fato — a correção acima não vale nada
    // se o chamador continuar aceitando o padrão.
    const fonteReels = readFileSync(resolve(AQUI, 'publish-reels.js'), 'utf8');
    confere('publish-reels.js confere a URL esperando `video/`',
      /confirmaUrlsPublicas\(\[[^\]]+\],\s*\{[^}]*esperado:\s*'video\/'/.test(fonteReels),
      'chamada sem `esperado` volta a reprovar o próprio vídeo');
    const reels = await import(pathToFileURL(resolve(AQUI, 'publish-reels.js')).href);
    const naGrade = (...opcoes) =>
      reels.corpoDoContainer(reels.parse(['node', 'publish-reels.js', '--video', 'v.mp4', ...opcoes]), 'https://u/v.mp4', 't').share_to_feed;
    confere('publish-reels.js manda o Reels à grade por padrão',
      naGrade() === 'true', `share_to_feed sem opção: ${naGrade()}`);
    confere('  └ e --fora-da-grade o tira, em qualquer posição da linha de comando',
      naGrade('--fora-da-grade') === 'false' && naGrade('--fora-da-grade', '--dry-run') === 'false',
      `share_to_feed com a opção: ${naGrade('--fora-da-grade')} / ${naGrade('--fora-da-grade', '--dry-run')}`);



    // ══════════════════════════════════════════════════════════════════
    console.log('\n━━━ 9. URL que a Meta não baixa: a saída pela re-hospedagem ━━━');
    //
    // O caso real: a Meta entra num estado em que não consegue baixar uma das
    // urls do imgBB e responde 9004/2207052. Repetir 8 vezes NA MESMA URL não
    // resolve. Republicar a peça inteira também não, porque o imgBB deduplica
    // por conteúdo e devolve exatamente a mesma url: duas rodadas completas
    // produzem listas de url byte a byte idênticas, e a peça só sai quando o
    // conteúdo dos arquivos muda.
    //
    // Estes casos provam as três metades: que a dedupe existe, que ela sozinha
    // é um beco sem saída, e que a camada de re-hospedagem escapa dele.

    const PNG_B = resolve(TMP, 'slide-b.png');
    writeFileSync(PNG_B, Buffer.concat([readFileSync(PNG), Buffer.from('\n<!--b-->')]));
    const ESTADO9 = resolve(TMP, 'estado-9.json');
    const urlsDaSaida = saida => [...saida.matchAll(/\[\d+\] (http:\S+)/g)].map(m => m[1]);
    const limpaEstado9 = () => { try { unlinkSync(ESTADO9); } catch {} };

    // (a) a dedupe existe, e é ela que fecha a saída
    chamadas.length = 0; urlsEnvenenadas.clear(); envenenarTudo = false; limpaEstado9();
    let r9 = await roda(['--conta', 'teste-conta-segunda', '--images', `${PNG},${PNG}`, ...LEG, '--state-file', ESTADO9]);
    const iguais = urlsDaSaida(r9.saida);
    confere('mesmo arquivo duas vezes → MESMA url (dedupe, como o imgBB real)',
      iguais.length === 2 && iguais[0] === iguais[1], JSON.stringify(iguais));

    chamadas.length = 0; limpaEstado9();
    r9 = await roda(['--conta', 'teste-conta-segunda', '--images', `${PNG},${PNG_B}`, ...LEG, '--state-file', ESTADO9]);
    const diferentes = urlsDaSaida(r9.saida);
    confere('  └ arquivos diferentes → urls diferentes (o conteúdo é a chave)',
      diferentes.length === 2 && diferentes[0] !== diferentes[1], JSON.stringify(diferentes));
    const urlDoPNG = diferentes[0];

    // (b) a url envenenada é justamente a que qualquer upload novo do mesmo
    //     arquivo devolveria. Sem trocar o conteúdo, não há como sair.
    chamadas.length = 0; limpaEstado9();
    urlsEnvenenadas.add(urlDoPNG);
    r9 = await roda(['--conta', 'teste-conta-segunda', '--images', `${PNG},${PNG_B}`, ...LEG, '--state-file', ESTADO9]);
    confere('Meta recusando uma url: ele re-hospeda e PUBLICA, em vez de desistir',
      r9.codigo === 0 && /Publicado com sucesso/.test(r9.saida), r9.saida.slice(-700));
    confere('  └ anunciou a re-hospedagem, não morreu calado',
      /Re-hospedando a imagem num endereço novo/.test(r9.saida), r9.saida.slice(-700));
    confere('  └ subiu de novo só a imagem problemática (2 originais + 1 re-hospedagem)',
      contaChamadas('/1/upload') === 3,
      `uploads=${contaChamadas('/1/upload')}; o servidor falso registrou: ${JSON.stringify(chamadas.map(c => c.caminho))}`);
    const novas = [...r9.saida.matchAll(/url nova: (http:\S+)/g)].map(m => m[1]);
    confere('  └ a url nova é DIFERENTE da envenenada (escapou da dedupe)',
      novas.length === 1 && novas[0] !== urlDoPNG, JSON.stringify([urlDoPNG, ...novas]));
    const estado9 = JSON.parse(readFileSync(ESTADO9, 'utf8'));
    confere('  └ gravou a url BOA no estado (retomada não volta pra url ruim)',
      estado9.status === 'confirmed'
        && !estado9.imageUrls.includes(urlDoPNG)
        && estado9.imageUrls.includes(novas[0]), JSON.stringify(estado9.imageUrls));

    // (c) recuperação não pode virar laço eterno: esgotadas as rodadas, ele para
    //     e não deixa nada publicado pela metade.
    chamadas.length = 0; urlsEnvenenadas.clear(); limpaEstado9();
    envenenarTudo = true;
    r9 = await roda(['--conta', 'teste-conta-segunda', '--images', `${PNG},${PNG_B}`, ...LEG, '--state-file', ESTADO9]);
    envenenarTudo = false;
    confere('url que NUNCA desce: desiste com erro, sem laço eterno',
      r9.codigo !== 0 && /createChildContainer falhou/.test(r9.saida), r9.saida.slice(-400));
    confere('  └ e não publicou nada pela metade',
      !chamadas.some(c => c.caminho.endsWith('/media_publish')),
      JSON.stringify(chamadas.map(c => c.caminho)));
    confere('  └ tentou re-hospedar antes de desistir (usou as rodadas)',
      /Re-hospedando a imagem num endereço novo/.test(r9.saida), r9.saida.slice(-400));

    try { unlinkSync(PNG_B); } catch {}
    limpaEstado9();

    console.log('\n━━━ 10. O token não vaza, e o .env aceita comentário ━━━');

    // Quem preenche o .env costuma deixar um comentário no fim da linha. O valor
    // não pode levar o comentário junto.
    confere('comentário no fim da linha não entra no valor', valorDoEnv('17841400000000000   # o id') === '17841400000000000');
    confere('  └ campo deixado só com o comentário fica vazio', valorDoEnv('# o @ desta conta') === '');
    confere('  └ aspas em volta do valor saem', valorDoEnv('"abc"') === 'abc' && valorDoEnv("'abc'") === 'abc');
    confere('  └ # no meio de um valor sem espaço antes fica', valorDoEnv('abc#def') === 'abc#def');
    confere('a máscara troca o token por ***',
      semToken('x?fields=id&access_token=IGAAsegredo123&y=1') === 'x?fields=id&access_token=***&y=1');

    // Base da API fora da Graph: recusa ANTES de montar a URL, e sem o token.
    // Com a base malformada, o fetch devolvia "Failed to parse URL from ..." com
    // a URL inteira, access_token junto, e a mensagem ia para o terminal e o log.
    respostaMe = { id: PRINCIPAL.id, username: PRINCIPAL.user };
    let r10 = await roda(['--images', PNG, ...LEG], ambienteLegado(PRINCIPAL.id, { META_API_BASE: 'http://exemplo.invalid' }));
    confere('base fora da Graph API é recusada',
      r10.codigo !== 0 && /META_API_BASE aponta para/.test(r10.saida), r10.saida.slice(-400));
    // A lista de hosts: o http://exemplo.invalid cai já no protocolo e nunca a
    // alcança. A porta 1 é "bad port" para o fetch: se a
    // trava regredir, nada sai da máquina.
    r10 = await roda(['--images', PNG, ...LEG], ambienteLegado(PRINCIPAL.id, { META_API_BASE: 'https://exemplo.invalid:1' }));
    confere('  └ https para host fora da Graph também é recusado',
      r10.codigo !== 0 && /META_API_BASE aponta para https:\/\/exemplo\.invalid/.test(r10.saida), r10.saida.slice(-400));
    r10 = await roda(['--images', PNG, ...LEG], ambienteLegado(PRINCIPAL.id, { META_API_BASE: 'http://graph.instagram.com:1' }));
    confere('  └ host da Graph sem https também é recusado',
      r10.codigo !== 0 && /META_API_BASE aponta para http:\/\/graph\.instagram\.com/.test(r10.saida), r10.saida.slice(-400));
    espiao.length = 0;
    r10 = await roda(['--images', PNG, ...LEG], ambienteLegado(PRINCIPAL.id, { META_API_BASE: BASE_ESPIAO }));
    confere('  └ e o pedido com o token não chega ao host recusado',
      r10.codigo !== 0 && /META_API_BASE aponta para http:\/\/127\.0\.0\.2/.test(r10.saida) && espiao.length === 0,
      `${JSON.stringify(espiao)}\n${r10.saida.slice(-300)}`);

    // A base com um caractere de controle no fim, lida do .env: o parser de URL o
    // tira antes de conferir o host; se a trava devolvesse a base crua, o controle
    // cairia no meio da URL montada, e o fetch falharia com a URL inteira, token
    // junto. A base usada tem de ser a que foi conferida.
    const comControle = fixture('teste-base-controle', { id: PRINCIPAL.id });
    writeFileSync(comControle, readFileSync(comControle, 'utf8').replace(/^META_API_BASE=.*$/m, (linha) => `${linha}\x1A`));
    respostaMe = { id: PRINCIPAL.id, username: 'teste-base-controle' };
    chamadas.length = 0;
    r10 = await roda(['--conta', 'teste-base-controle', '--images', PNG, ...LEG]);
    respostaMe = { id: PRINCIPAL.id, username: PRINCIPAL.user };
    confere('base com controle no fim publica no endereço conferido',
      r10.codigo === 0 && chamadas.some(c => c.caminho === `/v23.0/${PRINCIPAL.id}/media_publish`), r10.saida.slice(-400));
    confere('  └ e o token não aparece na saída', !/TOKEN_FALSO/.test(r10.saida), r10.saida.slice(-400));
    r10 = await roda(['--images', PNG, ...LEG], ambienteLegado(PRINCIPAL.id, { META_API_BASE: 'https://graph.instagram.com  # base' }));
    confere('base com comentário colado é recusada sem imprimir o token',
      r10.codigo !== 0 && /não é um endereço válido/.test(r10.saida) && !/TOKEN_FALSO/.test(r10.saida),
      r10.saida.slice(-400));

    // A máscara ligada no fim do main: erro de fora que ecoa o pedido, token junto.
    ecoarMedia = true;
    r10 = await roda(['--images', PNG, ...LEG], ambienteLegado(PRINCIPAL.id));
    ecoarMedia = false;
    confere('erro de fora com o token na mensagem sai mascarado',
      r10.codigo !== 0 && /access_token=\*\*\*/.test(r10.saida) && !/TOKEN_FALSO/.test(r10.saida), r10.saida.slice(-400));

    // O filho que importa o publish.js roda sem credencial nenhuma herdada: só o
    // que o caso põe no ambiente dele.
    const semCredencial = () => Object.fromEntries(Object.entries(process.env)
      .filter(([k]) => !/^(INSTAGRAM_|META_|IMGBB_)/.test(k)));
    const noFilho = (codigo) => new Promise(ok => execFile(process.execPath, ['--input-type=module', '-e', codigo],
      { timeout: 20_000, env: semCredencial() }, (err, stdout, stderr) => ok(`${stdout}${stderr}`.trim())));

    // E no quemSouEu, que reels e story chamam pelo conferirConta.
    ecoarMe = true;
    const erroMe = await noFilho(`
      process.env.META_API_BASE = 'http://127.0.0.1:${PORTA}';
      const m = await import('${pathToFileURL(PUBLISH).href}');
      try { await m.quemSouEu('TOKEN_FALSO', 1, 0); console.log('PASSOU'); }
      catch (e) { console.log('REPROVOU: ' + e.message); }
    `);
    ecoarMe = false;
    confere('  └ e o erro do quemSouEu já sai mascarado',
      /REPROVOU/.test(erroMe) && /access_token=\*\*\*/.test(erroMe) && !/TOKEN_FALSO/.test(erroMe), erroMe);

    // O leitor novo ligado no loadEnv: o .env lido de verdade, com comentário.
    fixture('teste-conta-principal', { id: `${PRINCIPAL.id}   # o id da conta`, declara: '# o @ desta conta' });
    respostaMe = { id: PRINCIPAL.id, username: PRINCIPAL.user };
    chamadas.length = 0;
    r10 = await roda(['--conta', 'teste-conta-principal', '--images', PNG, ...LEG]);
    confere('.env com comentário no fim da linha publica no ID certo',
      r10.codigo === 0 && chamadas.some(c => c.caminho === `/v23.0/${PRINCIPAL.id}/media_publish`), r10.saida.slice(-400));

    // A linha INSTAGRAM_CONTA copiada do modelo, só com o comentário: antes do
    // corte ela era lida como o próprio comentário e parava em CONTA ERRADA. Sem
    // --conta, continua parando, e antes de o token sair.
    fixture('teste-conta-vazia', { id: PRINCIPAL.id, declara: '   # o @ desta conta' });
    chamadas.length = 0;
    const semValor = await noFilho(`
      const m = await import('${pathToFileURL(PUBLISH).href}');
      m.loadEnv('teste-conta-vazia');
      try {
        await m.conferirConta(process.env.INSTAGRAM_BUSINESS_ID, process.env.INSTAGRAM_ACCESS_TOKEN, null, 'scripts/.env.teste-conta-vazia');
        console.log('PASSOU');
      } catch (e) { console.log('REPROVOU: ' + e.message); }
    `);
    confere('INSTAGRAM_CONTA só com o comentário do modelo, sem --conta: recusa',
      /REPROVOU: CONTA SEM VALOR/.test(semValor), semValor);
    confere('  └ antes de perguntar à API de quem é o token', !chamadas.some(c => c.caminho === '/v23.0/me'),
      JSON.stringify(chamadas.map(c => c.caminho)));

    // A chave do imgBB viaja no pedido de upload: a base dela também se confere.
    chamadas.length = 0;
    r10 = await roda(['--images', PNG, ...LEG], ambienteLegado(PRINCIPAL.id, { IMGBB_API_BASE: 'https://exemplo.invalid:1' }));
    confere('base do imgBB fora do imgBB é recusada',
      r10.codigo !== 0 && /IMGBB_API_BASE aponta para https:\/\/exemplo\.invalid/.test(r10.saida), r10.saida.slice(-400));
    espiao.length = 0;
    r10 = await roda(['--images', PNG, ...LEG], ambienteLegado(PRINCIPAL.id, { IMGBB_API_BASE: BASE_ESPIAO }));
    confere('  └ e o pedido com a chave não chega ao host recusado',
      r10.codigo !== 0 && /IMGBB_API_BASE aponta para http:\/\/127\.0\.0\.2/.test(r10.saida) && espiao.length === 0
        && !/CHAVE_FALSA/.test(r10.saida),
      `${JSON.stringify(espiao)}\n${r10.saida.slice(-300)}`);

  } finally {
    for (const c of criados) { try { if (existsSync(c)) unlinkSync(c); } catch {} }
    try { unlinkSync(ESTADO); } catch {}
    try { unlinkSync(PNG); } catch {}
    try { rmdirSync(TMP); } catch {}
    servidor.close();
    servidorEspiao.close();
  }

  console.log(`\n${'─'.repeat(52)}`);
  // ⚠️ Só no vermelho: a suíte pode reprovar casos DENTRO do portão e passar
  // em todos sozinha, e a primeira pergunta da caça é se algo estourou o tempo.
  // O próprio relatório responde isso.
  if (falhou) {
    const piores = [...tempos].sort((a, b) => b[0] - a[0]).slice(0, 6);
    console.log(`[diagnóstico] piores tempos de roda(), contra teto de ${TIMEOUT_RODA_MS}ms:`);
    for (const [ms, morto, arg] of piores) {
      console.log(`   ${ms}ms ${morto ? '<<< MORTO PELO TIMEOUT' : ''} ${arg}`);
    }
  }
  console.log(`${passou} passou, ${falhou} falhou`);
  process.exit(falhou ? 1 : 0);
})();
