// A voz sintética da peça, pela API da ElevenLabs, sem shell no caminho.
//
//   node .claude/skills/video/ferramentas/falar.mjs --texto-de <fala.txt> --peca <pasta> --voz <id>              mostra o custo e para
//   node .claude/skills/video/ferramentas/falar.mjs --texto-de <fala.txt> --peca <pasta> --voz <id> --confirmo   gera <pasta>/ativos/voz.wav
//
// Ao lado do WAV sai o <nome>.palavras.json: o começo e o fim de cada palavra, que a peça usa para a
// palavra-chave entrar com a palavra dita e a regua-voz.mjs usa para medir a narração.
//
// Opções: --saida <relativo à peça> (padrão ativos/voz.wav), --janela <segundos>
// (recusa a fala que passar dela), --modelo (padrão eleven_v4), --idioma (padrão pt).
//
// Por que um script e não um `curl` na linha de comando:
// - a chave mora no `scripts/.env`, junto com as outras do workspace. Um
//   `source`/`cat` do arquivo põe TODAS no contexto da conversa. Aqui só uma
//   linha é lida (ELEVENLABS), e a chave nunca é impressa: nem no sucesso, nem
//   no erro (a resposta da API passa por uma máscara);
// - a fala vem de um arquivo e vai num JSON montado pelo Node: apóstrofo e
//   aspas, que quebram um `-d '...'` do shell, passam inteiros;
// - o áudio só se grava dentro da pasta da peça;
// - a API cobra crédito por caractere: sem `--confirmo`, o script mostra a
//   conta e não chama nada;
// - o tempo da fala se mede aqui, antes do render: com `--janela`, a fala que
//   não couber na batida dela é recusada (voz.md, "A narração").
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync, realpathSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve, relative, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
export const API = 'https://api.elevenlabs.io';
const LIMITE_DE_CARACTERES = 2500; // uma narração de Reel cabe com folga; texto maior é engano (dividir em falas)

export const PASSO_A_PASSO = [
  'falar: falta ELEVENLABS no scripts/.env. Para usar a ElevenLabs:',
  '  1. crie a conta em https://elevenlabs.io (o plano gratuito basta para testar)',
  '  2. gere a chave de API no painel e cole em scripts/.env como ELEVENLABS=...',
  '  3. escolha a voz de ouvido, entre as que a API do seu plano libera, e passe o id com --voz',
  'No plano gratuito a voz só serve ao que não se publica (voz.md). Sem a chave, a peça sai sem voz ou com a voz gravada do usuário.',
].join('\n');

/** Lê do .env SÓ as chaves pedidas; as outras linhas nem viram valor guardado. */
export function lerChaves(arquivo, nomes = ['ELEVENLABS']) {
  const achadas = {};
  if (!existsSync(arquivo)) return achadas;
  for (const linha of readFileSync(arquivo, 'utf8').split(/\r?\n/)) {
    const m = linha.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || !nomes.includes(m[1])) continue;
    achadas[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return achadas;
}

/** Tira a chave de qualquer texto antes de ele ir para a tela. */
export const mascara = (texto, chave) => (chave ? String(texto).split(chave).join('***') : String(texto));

/** O destino tem que ficar dentro da pasta da peça. */
export function destinoNaPeca(peca, saida = 'ativos/voz.wav') {
  if (!peca || !existsSync(peca) || !statSync(peca).isDirectory()) throw new Error(`falar: a pasta da peça não existe: ${peca}`);
  const base = realpathSync(resolve(peca));
  const alvo = resolve(base, saida);
  const rel = relative(base, alvo);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) throw new Error(`falar: recuso gravar fora da pasta da peça (${saida})`);
  if (!/\.wav$/i.test(alvo)) throw new Error('falar: a saída é um .wav');
  return alvo;
}

/** A API só pode ser trocada por um endereço local (o dublê do teste): a chave nunca vai para outro servidor. */
export function apiPermitida(url) {
  if (url === API) return url;
  const u = new URL(url);
  if (u.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(u.hostname)) return url.replace(/\/$/, '');
  throw new Error('falar: --api só aceita endereço local (127.0.0.1), para o teste');
}

/** As palavras com o começo e o fim, em segundos contados do começo do WAV (que começa no primeiro
 *  som, porque o silêncio das pontas sai). O tempo vem só das letras e dos números: a vírgula e o
 *  ponto ganham da ElevenLabs a pausa que vem depois deles, e o fim de "site," cairia depois do som.
 *  O zero é a primeira letra; nenhum fim passa da duração do WAV. É com elas que a peça faz a
 *  palavra-chave entrar junto da palavra dita, e que a regua-voz.mjs mede a narração. */
export function palavrasDoAlinhamento(a, duracaoWav) {
  const letra = /[\p{L}\p{N}]/u;
  const zero = a.character_start_times_seconds.find((t, i) => letra.test(a.characters[i])) ?? 0;
  const palavras = [];
  let atual = null;
  a.characters.forEach((c, i) => {
    if (/\s/.test(c)) { if (atual) { palavras.push(atual); atual = null; } return; }
    if (!atual) atual = { palavra: '', inicio: null, fim: null };
    atual.palavra += c;
    if (!letra.test(c)) return;
    if (atual.inicio === null) atual.inicio = a.character_start_times_seconds[i] - zero;
    atual.fim = a.character_end_times_seconds[i] - zero;
  });
  if (atual) palavras.push(atual);
  const arred = (x) => Math.round(Math.min(duracaoWav, Math.max(0, x)) * 1000) / 1000;
  return palavras.filter((p) => p.inicio !== null).map((p) => ({ palavra: p.palavra, inicio: arred(p.inicio), fim: arred(p.fim) }));
}

const duracao = (arq) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', arq]).toString().trim());

export async function falar({ textoDe, peca, voz, saida, janela, confirmo = false, modelo = 'eleven_v4', idioma = 'pt', envArq = join(RAIZ, 'scripts', '.env'), api = API, fetchImpl = fetch, log = console.log }) {
  if (!textoDe || !existsSync(textoDe)) throw new Error('falar: diga o arquivo da fala com --texto-de <arquivo> (a fala vai num arquivo, não na linha de comando)');
  if (!voz || !/^[A-Za-z0-9]{8,40}$/.test(voz)) throw new Error('falar: diga a voz com --voz <id> (letras e números, o id da voz na ElevenLabs)');
  const destino = destinoNaPeca(peca, saida);
  const texto = readFileSync(textoDe, 'utf8').trim();
  if (!texto) throw new Error('falar: o arquivo da fala está vazio');
  const caracteres = [...texto].length;
  if (caracteres > LIMITE_DE_CARACTERES) throw new Error(`falar: ${caracteres} caracteres passa do limite de ${LIMITE_DE_CARACTERES}; divida em falas`);
  log(`fala: ${caracteres} caracteres = ${caracteres} créditos (um por caractere; o plano gratuito traz 10 mil por mês: confirme na página do serviço)`);
  if (janela) log(`janela: ${janela} s; a ~14 caracteres por segundo esta fala pede ~${(caracteres / 14).toFixed(1)} s`);
  if (!confirmo) { log('nada foi chamado. Para gerar, rode de novo com --confirmo'); return { chamou: false, destino }; }
  const { ELEVENLABS: chave } = lerChaves(envArq);
  if (!chave) throw new Error(PASSO_A_PASSO);
  let resp;
  try {
    resp = await fetchImpl(`${apiPermitida(api)}/v1/text-to-speech/${voz}/with-timestamps?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': chave, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: texto, model_id: modelo, language_code: idioma }),
    });
  } catch (e) {
    throw new Error(mascara(`falar: a chamada à ElevenLabs falhou: ${e.message}`, chave));
  }
  if (!resp.ok) {
    const detalhe = (await resp.text().catch(() => '')).slice(0, 300);
    throw new Error(mascara(`falar: a ElevenLabs respondeu ${resp.status}: ${detalhe}`, chave));
  }
  // o endpoint "with-timestamps" devolve o áudio em base64 e o tempo de cada caractere
  let corpo;
  try { corpo = await resp.json(); } catch { throw new Error('falar: a ElevenLabs respondeu algo que não é o JSON do with-timestamps'); }
  const alinhamento = corpo && (corpo.alignment || corpo.normalized_alignment);
  if (!corpo || typeof corpo.audio_base64 !== 'string' || !alinhamento) throw new Error('falar: a resposta veio sem o áudio ou sem o tempo dos caracteres');
  mkdirSync(dirname(destino), { recursive: true });
  const mp3 = destino.replace(/\.wav$/i, '.mp3');
  writeFileSync(mp3, Buffer.from(corpo.audio_base64, 'base64'));
  // o MP3 carrega atraso de codificador no começo: vira WAV de 48 kHz, e o
  // silêncio das pontas sai (o tempo medido é o da fala, não o do arquivo)
  try {
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', mp3, '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse', '-ar', '48000', '-ac', '2', destino], { stdio: ['ignore', 'ignore', 'pipe'] });
  } finally {
    rmSync(mp3, { force: true });
  }
  const segundos = Math.round(duracao(destino) * 1000) / 1000;
  const arqPalavras = destino.replace(/\.wav$/i, '.palavras.json');
  writeFileSync(arqPalavras, JSON.stringify(palavrasDoAlinhamento(alinhamento, segundos), null, 1) + '\n', 'utf8');
  log(`voz gravada: ${destino} (${segundos} s), e o tempo de cada palavra em ${arqPalavras}. A régua da pronúncia é o ouvido: ouça antes de seguir`);
  if (janela && segundos > Number(janela)) {
    const e = new Error(`falar: a fala tem ${segundos} s e a janela é de ${janela} s: encurte o texto ou abra a janela das batidas vizinhas`);
    e.naoCabe = true;
    throw e;
  }
  return { chamou: true, destino, segundos };
}

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  const args = process.argv.slice(2);
  const valor = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  falar({
    textoDe: valor('--texto-de'), peca: valor('--peca'), voz: valor('--voz'), saida: valor('--saida') || undefined,
    janela: valor('--janela') ? Number(valor('--janela')) : undefined,
    modelo: valor('--modelo') || undefined, idioma: valor('--idioma') || undefined, confirmo: args.includes('--confirmo'),
    api: valor('--api') || API, envArq: valor('--env') || undefined,
  }).catch((e) => { console.error(e.message); process.exit(1); });
}
