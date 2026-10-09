#!/usr/bin/env node
// Publica UM REELS no Instagram.
//
// Terceiro modo de mídia do motor, depois do carrossel (`publish.js`) e do story
// (`publish-story.js`), e pelo mesmo motivo dos outros dois serem arquivos
// separados: o `publish.js` é o caminho mais usado, e pode estar rodando por
// automação sem ninguém olhando. Enfiar um terceiro modo lá dentro poria este
// caminho em cima do que já funciona.
//
// ⚠️ O MIOLO CONTINUA SENDO O MESMO. Ler o .env, conferir de quem é a conta,
// esperar o container, publicar, pegar o permalink e renovar o token vêm
// IMPORTADOS do `publish.js`. Em especial a **trava das três pontas**: copiá-la
// seria fabricar o bug que se corrige numa cópia e sobrevive na outra.
//
// Uso:
//   node publish-reels.js --video caminho.mp4 --caption-file legenda.md \
//     --conta <username> [--state-file publicador-reels.json] [--fora-da-grade] [--dry-run]
//
// ── POR QUE ISTO PRECISA DE UM SERVIDOR, E O OUTRO NÃO ───────────────────
// A imagem do carrossel sobe pro imgBB. **O imgBB não hospeda vídeo**, e a API
// do Instagram não recebe arquivo neste fluxo: ela exige `video_url` e vai
// BUSCAR o vídeo.
//
// ⚠️ E O ATALHO SEM SERVIDOR FOI TESTADO E NÃO EXISTE AQUI. A Meta documenta
// `upload_type=resumable` (binário direto pra `rupload.facebook.com`). Sondado
// nas duas pontas:
//
//   graph.instagram.com  →  400 "The parameter video_url is required"
//   graph.facebook.com   →  400 "Cannot parse access token"
//
// O resumable pertence ao **Login do Facebook para Empresas**; este motor usa
// **Login do Instagram**, que publica em conta própria sem análise do app pela
// Meta. Trocar de fluxo para economizar o servidor custaria uma
// revisão de app.
//
// A hospedagem é uma pasta de passagem servida por um endereço público SEU
// (um servidor, uma VPS, um bucket). Ela se declara em duas variáveis:
//
//   REELS_MIDIA_DIR   a pasta local que o servidor serve
//   REELS_MIDIA_BASE  a URL pública correspondente
//
// ⚠️ O ARQUIVO É DE PASSAGEM, com nome sorteado, e sai assim que a Meta termina
// de processar. Não é arquivo público permanente: peça agendada e ainda não
// publicada não pode ficar legível por quem adivinhar a URL.
//
// ⚠️ SEM AS DUAS VARIÁVEIS ELE PARA. Rodar da máquina do usuário não publica
// Reels, porque não há de onde a Meta baixar — e falhar claro aqui é melhor que
// um erro genérico vindo da API dez segundos depois.

import { existsSync, copyFileSync, rmSync, statSync, readFileSync, mkdirSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  loadEnv, conferirConta, confirmaUrlsPublicas, criarContainerComRetry,
  publishMedia, getPermalink, renovaNoFim, igBase,
} from './publish.js';

// ⚠️ CINCO MINUTOS, e não os 60s que o `pollUntilFinished` do carrossel usa.
// Aquele default foi calibrado para IMAGEM, que a Meta processa quase na hora;
// vídeo passa por transcodificação. Na sondagem da Meta o MP4 de 18s
// levou cerca de 40s para sair de `IN_PROGRESS`. A própria Meta recomenda
// perguntar uma vez por minuto por até cinco minutos.
const ESPERA_MAXIMA_MS = 5 * 60_000;
const INTERVALO_MS = 10_000;

function parse(argv) {
  const args = { video: null, caption: '', conta: null, dryRun: false, stateFile: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--video') args.video = argv[++i];
    else if (argv[i] === '--conta') args.conta = argv[++i];
    else if (argv[i] === '--caption') args.caption = argv[++i];
    else if (argv[i] === '--caption-file') args.caption = readFileSync(resolve(argv[++i]), 'utf8').trim();
    else if (argv[i] === '--state-file') args.stateFile = resolve(argv[++i]);
    else if (argv[i] === '--dry-run') args.dryRun = true;
    else if (argv[i] === '--fora-da-grade') args.foraDaGrade = true;
  }
  return args;
}

/** Os campos do pedido que cria o container do Reels.
 *
 *  O Reels vai também para a grade, como no aplicativo. Com `--fora-da-grade`
 *  ele vive só na aba de Reels: é para quem publica o Reels junto com um
 *  carrossel da mesma peça, que já ocupa a grade. Sem a opção, cada peça
 *  aparece duas vezes ali: a capa 4:5 e o primeiro quadro do vídeo,
 *  recortado do 9:16. */
function corpoDoContainer(args, videoUrl, token) {
  return {
    media_type: 'REELS',
    video_url: videoUrl,
    caption: args.caption,
    share_to_feed: args.foraDaGrade ? 'false' : 'true',
    access_token: token,
  };
}

/** Põe o MP4 na pasta de passagem e devolve `{ url, arquivo }`.
 *
 *  O nome é sorteado com 16 bytes de aleatoriedade real: nome previsível numa
 *  pasta pública deixaria alguém adivinhar a peça de amanhã. */
function hospeda(caminho) {
  const dir = process.env.REELS_MIDIA_DIR;
  const base = process.env.REELS_MIDIA_BASE;
  if (!dir || !base) {
    throw new Error(
      'REELS_MIDIA_DIR e REELS_MIDIA_BASE não estão definidas.\n'
      + '   Reels só publica de onde existe a hospedagem: uma pasta servida por um\n'
      + '   endereço público seu (REELS_MIDIA_DIR = a pasta, REELS_MIDIA_BASE = a URL dela),\n'
      + '   gravadas no scripts/.env. Ver "O Reels exige hospedagem própria" no SKILL.md.',
    );
  }
  mkdirSync(dir, { recursive: true });
  const nome = `${randomBytes(16).toString('hex')}${extname(caminho) || '.mp4'}`;
  const destino = join(dir, nome);
  copyFileSync(caminho, destino);
  return { url: `${base.replace(/\/$/, '')}/${nome}`, arquivo: destino };
}

/** Espera o vídeo processar. Igual ao do carrossel, com o relógio do vídeo. */
async function esperaVideoPronto(containerId, token) {
  const limite = Date.now() + ESPERA_MAXIMA_MS;
  let ultimo = '';
  while (Date.now() < limite) {
    const p = new URLSearchParams({ fields: 'status_code', access_token: token });
    const res = await fetch(`${igBase()}/${containerId}?${p}`);
    if (!res.ok) throw new Error(`status do container falhou [${res.status}]: ${await res.text()}`);
    ultimo = (await res.json()).status_code;
    if (ultimo === 'FINISHED') return;
    // ⚠️ A META NÃO DIZ O PORQUÊ do ERROR: devolve `status_code: ERROR` e nada
    // mais, sem campo de motivo.
    //
    // ⚠️ E A MENSAGEM NÃO PODE MANDAR CONSERTAR O MP4. Uma mensagem que diz
    // "quase sempre é especificação" e lista bitrate, GOP e fps manda pro lugar
    // errado: o mesmo arquivo é ACEITO, RECUSADO e ACEITO de novo em menos de
    // uma hora, sem uma linha de diferença entre os envios.
    //
    // Então a ordem certa é: primeiro repetir, e só investigar spec se o mesmo
    // arquivo for recusado várias vezes seguidas. Quem repete sozinho é o cron
    // do `publicar-reels`, de 15 em 15 minutos.
    if (ultimo === 'ERROR') {
      throw new Error(
        'a Meta recusou o vídeo (status ERROR, e ela não informa o motivo).\n'
        + '   ISTO COSTUMA SER TRANSITÓRIO: o mesmo arquivo já foi aceito, recusado\n'
        + '   e aceito de novo em 40 minutos. A primeira resposta é REPETIR — o cron\n'
        + '   do publicar-reels tenta de novo em até 15 min.\n'
        + '   Só investigue o arquivo se ele for recusado VÁRIAS vezes seguidas; aí\n'
        + '   confira áudio acima de 128 kbps, GOP aberto, fps fora de 23-60 ou\n'
        + '   duração fora de 3s-15min, e regere com o ferramentas/gerar-reels.sh.',
      );
    }
    await new Promise(r => setTimeout(r, INTERVALO_MS));
  }
  throw new Error(`o vídeo não ficou pronto em ${ESPERA_MAXIMA_MS / 60_000} min (último estado: ${ultimo})`);
}

async function main() {
  const args = parse(process.argv);
  if (!args.video) throw new Error('falta --video caminho.mp4');

  const caminho = resolve(args.video);
  if (!existsSync(caminho)) throw new Error(`vídeo não encontrado: ${caminho}`);

  const envPath = loadEnv(args.conta);
  const { INSTAGRAM_BUSINESS_ID, INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_CONTA } = process.env;
  if (!INSTAGRAM_BUSINESS_ID || !INSTAGRAM_ACCESS_TOKEN) {
    throw new Error(`credenciais incompletas em ${envPath}`);
  }

  // A trava das três pontas, antes de qualquer coisa sair daqui.
  console.log('🔎 conferindo de quem é a conta...');
  await conferirConta(
    INSTAGRAM_BUSINESS_ID, INSTAGRAM_ACCESS_TOKEN,
    args.conta || INSTAGRAM_CONTA || null, envPath,
  );

  const tamanho = (statSync(caminho).size / 1024 / 1024).toFixed(2);

  // ⚠️ O `--dry-run` VAI ATÉ O CONTÊINER FICAR PRONTO, e só depois para. Parar
  // AQUI, antes de hospedar, o tornaria inútil justamente para o que ele existe:
  // o que quebra mora depois desta linha (a conferência de URL do próprio vídeo
  // e a recusa sem motivo da Meta). Um ensaio que para antes da parte que
  // quebra não ensaia nada.
  //
  // O que ele faz é a sondagem inteira — hospeda, cria o contêiner, espera
  // a Meta processar — e para no último passo, o `media_publish`. É o único
  // ponto sem volta, e é o único que ele pula.

  let hospedado = null;
  try {
    console.log(`☁️  hospedando o vídeo (${tamanho} MB)...`);
    hospedado = hospeda(caminho);

    // A Meta busca pela URL. Conferir antes evita o erro genérico que ela
    // devolve quando a URL não responde — a mesma lição do carrossel.
    console.log('🔗 conferindo que a URL já responde...');
    await confirmaUrlsPublicas([hospedado.url], { esperado: 'video/', onde: 'no servidor de mídia' });

    console.log('📦 criando o container do Reels...');
    const params = new URLSearchParams(corpoDoContainer(args, hospedado.url, INSTAGRAM_ACCESS_TOKEN));
    const containerId = await criarContainerComRetry(
      `${igBase()}/${INSTAGRAM_BUSINESS_ID}/media?${params}`, 'createReelsContainer');

    console.log('⏱️  esperando a Meta processar o vídeo...');
    await esperaVideoPronto(containerId, INSTAGRAM_ACCESS_TOKEN);

    if (args.dryRun) {
      console.log('\n🧪 --dry-run: a Meta ACEITOU o vídeo e o container está pronto.');
      console.log(`   container ${containerId} · ${tamanho} MB · conta ${INSTAGRAM_BUSINESS_ID}`);
      console.log('   Parei antes do media_publish, que é o passo sem volta.');
      return;   // o `finally` abaixo limpa o arquivo hospedado
    }

    console.log('🚀 publicando o Reels...');
    const reelsId = await publishMedia(INSTAGRAM_BUSINESS_ID, containerId, INSTAGRAM_ACCESS_TOKEN);
    const permalink = await getPermalink(reelsId, INSTAGRAM_ACCESS_TOKEN);

    if (args.stateFile) {
      const { writeFileSync } = await import('node:fs');
      writeFileSync(args.stateFile, `${JSON.stringify({
        status: 'confirmed', containerId, postId: reelsId, permalink,
        confirmedAt: new Date().toISOString(),
      }, null, 2)}\n`);
    }

    console.log('\n✅ Reels publicado.');
    console.log(`   ID: ${reelsId}`);
    if (permalink) console.log(`   URL: ${permalink}`);

    await renovaNoFim(INSTAGRAM_ACCESS_TOKEN, envPath);
  } finally {
    // ⚠️ SAI SEMPRE, inclusive quando deu errado. O arquivo é de passagem: uma
    // falha no meio não pode deixar MP4 público acumulando numa pasta que
    // ninguém revisa. Depois do FINISHED a Meta já tem o vídeo do lado dela, e
    // a URL não serve mais para nada.
    if (hospedado) {
      try { rmSync(hospedado.arquivo, { force: true }); }
      catch (e) { console.error(`   ⚠ não consegui apagar ${hospedado.arquivo}: ${e.message}`); }
    }
  }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch(err => {
    console.error(`\n❌ ${err.message}`);
    process.exitCode = 1;
  });
}

export { parse, corpoDoContainer, hospeda, esperaVideoPronto };
