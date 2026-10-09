#!/usr/bin/env node
// Publica UM STORY no Instagram.
//
// Por que é um arquivo à parte e não um `--story` no publish.js: o motor
// publica **carrossel**, e pode estar rodando por automação sem ninguém olhando.
// Enfiar um segundo modo lá dentro poria o caminho do story em cima do caminho
// que já funciona, e um erro aqui derrubaria a publicação automática junto.
//
// ⚠️ MAS O MIOLO É O MESMO, E DE PROPÓSITO. Tudo o que vem antes de publicar —
// ler o .env, conferir de quem é a conta, subir a imagem, esperar o container —
// é IMPORTADO do publish.js. Duplicar repetiria a trava das três pontas, que é
// a proteção contra publicar na conta errada; e o CLAUDE.md já registra o preço
// disso: *"copiar o arquivo por conta seria fabricar o bug que se corrige numa
// cópia e sobrevive na outra"*.
//
// Uso:
//   node publish-story.js --image caminho.jpg --conta <username>
//   node publish-story.js --image caminho.jpg --conta <username> --dry-run
//
// ⚠️ STORY NÃO TEM LEGENDA. O texto tem que estar na arte. Sticker de enquete,
// link e menção também não são publicáveis por API — decisão registrada no
// briefing do projeto.

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadEnv, conferirConta, uploadComRetry, confirmaUrlsPublicas,
  criarContainerComRetry, pollUntilFinished, publishMedia, getPermalink,
  renovaNoFim, igBase,
} from './publish.js';

function parse(argv) {
  const args = { image: null, conta: null, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--image') args.image = argv[++i];
    else if (argv[i] === '--conta') args.conta = argv[++i];
    else if (argv[i] === '--dry-run') args.dryRun = true;
  }
  return args;
}

async function main() {
  const args = parse(process.argv);
  if (!args.image) throw new Error('falta --image caminho.jpg');

  const caminho = resolve(args.image);
  if (!existsSync(caminho)) throw new Error(`imagem não encontrada: ${caminho}`);

  const envPath = loadEnv(args.conta);
  const {
    INSTAGRAM_BUSINESS_ID, INSTAGRAM_ACCESS_TOKEN, IMGBB_API_KEY, INSTAGRAM_CONTA,
  } = process.env;

  if (!INSTAGRAM_BUSINESS_ID || !INSTAGRAM_ACCESS_TOKEN) {
    throw new Error(`credenciais incompletas em ${envPath}`);
  }
  if (!IMGBB_API_KEY) throw new Error(`falta IMGBB_API_KEY em ${envPath}`);

  // A trava das três pontas: o --conta pedido, o ID gravado no arquivo e o que
  // a API responde ao vivo têm que concordar. É a MESMA função do carrossel.
  console.log('🔎 conferindo de quem é a conta...');
  await conferirConta(
    INSTAGRAM_BUSINESS_ID, INSTAGRAM_ACCESS_TOKEN,
    args.conta || INSTAGRAM_CONTA || null, envPath,
  );

  // ⚠️ O `--dry-run` NÃO PARA AQUI, e a razão é a mesma do publish-reels:
  // tudo que pode dar errado — o upload, a URL que a Meta busca, o
  // container — mora depois desta linha. Ensaio que para antes da parte que
  // quebra não ensaia nada. Ele vai até o container ficar pronto e para no
  // `media_publish`, o único passo sem volta.

  console.log('☁️  subindo a imagem...');
  const url = await uploadComRetry(caminho, IMGBB_API_KEY);

  // A Meta busca a imagem pela URL. Se ela ainda não propagou, o container
  // falha com um erro genérico que não diz isso — daí a conferência antes.
  console.log('🔗 conferindo que a URL já responde...');
  await confirmaUrlsPublicas([url]);

  const espera = Number(process.env.IMGBB_PROPAGATION_WAIT_MS || 0);
  if (espera > 0) {
    console.log(`⏳ esperando ${Math.round(espera / 1000)}s de propagação...`);
    await new Promise(r => setTimeout(r, espera));
  }

  console.log('📦 criando o container do story...');
  const params = new URLSearchParams({
    image_url: url,
    media_type: 'STORIES',   // ← a única diferença real para o carrossel
    access_token: INSTAGRAM_ACCESS_TOKEN,
  });
  const containerId = await criarContainerComRetry(
    `${igBase()}/${INSTAGRAM_BUSINESS_ID}/media?${params}`, 'createStoryContainer');

  console.log('⏱️  esperando o container ficar pronto...');
  await pollUntilFinished(containerId, INSTAGRAM_ACCESS_TOKEN);

  if (args.dryRun) {
    console.log('\n🧪 --dry-run: a Meta ACEITOU a imagem e o container está pronto.');
    console.log(`   container ${containerId} · conta ${INSTAGRAM_BUSINESS_ID}`);
    console.log('   Parei antes do media_publish, que é o passo sem volta.');
    return;
  }

  console.log('🚀 publicando o story...');
  const storyId = await publishMedia(INSTAGRAM_BUSINESS_ID, containerId, INSTAGRAM_ACCESS_TOKEN);
  const permalink = await getPermalink(storyId, INSTAGRAM_ACCESS_TOKEN);

  console.log('\n✅ Story publicado.');
  console.log(`   ID: ${storyId}`);
  if (permalink) console.log(`   URL: ${permalink}`);
  console.log('   ⏳ sai do ar em 24h.');

  await renovaNoFim(INSTAGRAM_ACCESS_TOKEN, envPath);
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch(err => {
    console.error(`\n❌ ${err.message}`);
    process.exitCode = 1;
  });
}

export { parse };
