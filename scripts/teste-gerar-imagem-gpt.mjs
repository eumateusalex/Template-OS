#!/usr/bin/env node
/**
 * Prova que o motor GPT do `gerar-imagem.js` monta o pedido certo, sobe e desce
 * o proxy sozinho e sabe RECUSAR.
 *
 * Rodar depois de mexer no motor:
 *   node scripts/teste-gerar-imagem-gpt.mjs
 *
 * 🚨 NÃO FALA COM TERCEIRO. O proxy é um servidor falso desta suíte, numa porta
 * livre; o CLI que sobe e desce o proxy é um falso que só anota o que pediram;
 * o `auth.json` do Codex é de mentira, numa pasta da bancada (o gerador o acha
 * pelo `CODEX_HOME`). O seu token nunca é lido, o seu limite de imagem nunca é
 * gasto, e a suíte roda sem `codex login` e sem o `openai-oauth` instalado.
 *
 * Por que existe: o servidor de imagem do plano ChatGPT IGNORA `size` e
 * `quality` (medido) e obedece a proporção escrita no texto. Se a
 * frase da proporção sumir do pedido, sai imagem no formato errado sem erro
 * nenhum. E o proxy carrega a sua conta: subir e esquecer no ar é o defeito
 * que ninguém vê.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { escreveRelatorio, resumoTap } from './lib/junit.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(RAIZ, 'scripts', 'gerar-imagem.js');

let ok = 0;
let mau = 0;
const casos = [];

function checa(nome, condicao, detalhe = '') {
  casos.push({ nome, falha: condicao ? null : `falhou${detalhe ? `: ${detalhe}` : ''}` });
  if (condicao) {
    console.log(`  OK    ${nome}`);
    ok++;
  } else {
    console.log(`  FALHA ${nome}${detalhe ? `\n        ${detalhe}` : ''}`);
    mau++;
  }
}

// ── Bancada ───────────────────────────────────────────────────

const BANCADA = fs.mkdtempSync(path.join(os.tmpdir(), 'teste-gerar-imagem-gpt-'));
const REFS = path.join(BANCADA, 'refs');
fs.mkdirSync(REFS);
const PNG_MAGICO = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
for (let i = 1; i <= 6; i += 1) {
  fs.writeFileSync(path.join(REFS, `r${i}.png`), Buffer.concat([PNG_MAGICO, Buffer.from(`ref-${i}`)]));
}
fs.writeFileSync(path.join(REFS, 'foto.webp'), Buffer.from('RIFF-webp-falso'));
fs.writeFileSync(path.join(REFS, 'foto.heic'), Buffer.from('heic-falso'));
const ref = nome => path.join(REFS, nome);
const SAIDA = path.join(BANCADA, 'saida.png');

// o que o servidor falso devolve como imagem: bytes que o teste reconhece
const IMAGEM_FALSA = Buffer.concat([PNG_MAGICO, Buffer.from('imagem-gerada-pelo-falso')]);

// o login de mentira: a isca aqui dentro nunca pode aparecer na tela
const ISCA_DO_LOGIN = 'isca-do-login-falso-da-bancada';
const CODEX_COM_LOGIN = path.join(BANCADA, 'codex-com-login');
fs.mkdirSync(CODEX_COM_LOGIN);
fs.writeFileSync(path.join(CODEX_COM_LOGIN, 'auth.json'), JSON.stringify({ tokens: { access_token: ISCA_DO_LOGIN } }));
const CODEX_SEM_LOGIN = path.join(BANCADA, 'codex-sem-login');
fs.mkdirSync(CODEX_SEM_LOGIN);

// um personagem de mentira, só para o --personagem passar do parseArgs e chegar
// à recusa do motor GPT
const PERSONAGEM = path.join(BANCADA, 'personagem');
fs.mkdirSync(path.join(PERSONAGEM, 'referencias'), { recursive: true });
fs.writeFileSync(path.join(PERSONAGEM, 'prompt-base.md'), 'CHARACTER: a round orange mascot.');
fs.writeFileSync(path.join(PERSONAGEM, 'referencias', '01-frente.png'), Buffer.concat([PNG_MAGICO, Buffer.from('frente')]));

// O CLI falso do proxy: anota cada chamada numa linha. Quem o "obedece" é o
// próprio teste, que vigia o arquivo e liga ou desliga o servidor falso.
const CLI_LOG = path.join(BANCADA, 'cli-chamadas.txt');
const CLI_FALSO = path.join(BANCADA, 'cli-falso.mjs');
// o `status` do falso diz "rodando" (sai 0) quando o arquivo de estado diz 1
const CLI_ESTADO = path.join(BANCADA, 'cli-estado.txt');
fs.writeFileSync(CLI_FALSO, [
  "import fs from 'node:fs';",
  `fs.appendFileSync(${JSON.stringify(CLI_LOG)}, process.argv.slice(2).join(' ') + '\\n');`,
  `if (process.argv[2] === 'status') process.exit(fs.existsSync(${JSON.stringify(CLI_ESTADO)}) && fs.readFileSync(${JSON.stringify(CLI_ESTADO)}, 'utf8') === '1' ? 0 : 1);`,
  // o stop de verdade só volta quando o proxy saiu do registro: o falso também
  `if (process.argv[2] === 'stop') fs.writeFileSync(${JSON.stringify(CLI_ESTADO)}, '0');`,
].join('\n'));
const marcaRodando = sim => fs.writeFileSync(CLI_ESTADO, sim ? '1' : '0');
const chamadasCli = () => (fs.existsSync(CLI_LOG) ? fs.readFileSync(CLI_LOG, 'utf8').trim().split('\n').filter(Boolean) : []);
// quantas linhas do log o teste já obedeceu: zera junto com o log
let processadas = 0;
const limpaCli = () => {
  fs.rmSync(CLI_LOG, { force: true });
  processadas = 0;
};
// o que o script MANDOU o CLI fazer, sem as consultas de status
const acoesCli = () => chamadasCli().filter(c => c !== 'status');

// ── O proxy falso ─────────────────────────────────────────────

let modo = 'ok'; // ok | recusa | vazio | limite | estranho | lista-502 | lento | redireciona | redireciona-lista
let resetaEm = 7200;
const pedidos = [];

const servidor = http.createServer((req, res) => { // servidor-falso: o proxy de mentira da suíte, em 127.0.0.1, que nunca serve arquivo
  const pedacos = [];
  req.on('data', p => pedacos.push(p));
  req.on('end', () => {
    const corpo = Buffer.concat(pedacos);
    pedidos.push({ metodo: req.method, url: req.url, tipo: req.headers['content-type'] || '', corpo });
    const responde = (status, json) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(json));
    };
    if (req.url === '/v1/models' && modo === 'lista-502') return responde(502, { error: { message: 'upstream timeout' } });
    if (req.url === '/v1/models' && modo === 'redireciona-lista') {
      res.writeHead(307, { location: `http://127.0.0.1:${PORTA_HOSTIL}/v1/models` });
      return res.end();
    }
    if (req.url === '/v1/models') {
      return responde(200, { data: modo === 'estranho' ? [{ id: 'outra-coisa' }] : [{ id: 'gpt-6-luna' }, { id: 'gpt-image-2' }] });
    }
    if (modo === 'limite') {
      return responde(429, { error: { type: 'usage_limit_reached', message: 'The usage limit has been reached', resets_in_seconds: resetaEm } });
    }
    if (modo === 'lento' && req.url.startsWith('/v1/images/')) return setTimeout(() => responde(200, { data: [{ b64_json: IMAGEM_FALSA.toString('base64') }] }), 8000);
    if (modo === 'redireciona' && req.url.startsWith('/v1/images/')) {
      res.writeHead(307, { location: `http://127.0.0.1:${PORTA_HOSTIL}${req.url}` });
      return res.end();
    }
    if (modo === 'vazio') return responde(200, { data: [] });
    if (modo === 'recusa') {
      return responde(400, { error: { message: 'Your request was rejected by the safety system.' } });
    }
    return responde(200, { data: [{ b64_json: IMAGEM_FALSA.toString('base64') }], size: '1122x1402', quality: 'low' });
  });
});

// uma porta livre, que o servidor ocupa e desocupa conforme o caso
const PORTA = await new Promise(resolve => {
  const s = http.createServer().listen(0, '127.0.0.1', () => { // servidor-falso: só reserva uma porta livre e fecha na hora
    const { port } = s.address();
    s.close(() => resolve(port));
  });
});
// a porta em que o falso escutou da última vez: com a porta efêmera, é a que o
// gerador mandou o CLI usar
let portaAtual = null;
const liga = async (porta = PORTA) => {
  // no ar em outra porta (o proxy efêmero do caso anterior) não serve: troca
  if (servidor.listening && portaAtual !== porta) {
    servidor.closeAllConnections?.();
    await new Promise(resolve => servidor.close(() => resolve()));
  }
  marcaRodando(true);
  if (servidor.listening) return;
  portaAtual = porta;
  await new Promise(resolve => servidor.listen(porta, '127.0.0.1', resolve));
};

// o processo hostil: se o POST com o prompt e as imagens chegar aqui, vazou
const pedidosHostis = [];
const hostil = http.createServer((req, res) => { // servidor-falso: o destino do redirecionamento, que só anota o que recebeu
  const pedacos = [];
  req.on('data', p => pedacos.push(p));
  req.on('end', () => {
    pedidosHostis.push({ url: req.url, corpo: Buffer.concat(pedacos) });
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ data: [{ b64_json: IMAGEM_FALSA.toString('base64') }] }));
  });
});
const PORTA_HOSTIL = await new Promise(resolve => hostil.listen(0, '127.0.0.1', () => resolve(hostil.address().port)));
const desliga = () => new Promise(resolve => {
  marcaRodando(false);
  if (!servidor.listening) return resolve();
  servidor.closeAllConnections?.();
  servidor.close(() => resolve());
});

// o teste obedece o CLI falso, linha por linha e na ordem: "--detach" liga o
// servidor na porta pedida, "stop" desliga (um "stop" seguido de "--detach"
// entre duas voltas da vigia não pode virar só o último)
let obedecer = true;
let ocupada = false;
const vigia = setInterval(async () => {
  if (ocupada) return;
  ocupada = true;
  try {
    const todas = chamadasCli();
    while (processadas < todas.length) {
      const linha = todas[processadas++];
      if (!obedecer) continue;
      if (linha.startsWith('stop') && servidor.listening) await desliga();
      if (linha.startsWith('--detach') && !servidor.listening) await liga(Number(linha.split(' ').at(-1)));
    }
  } finally {
    ocupada = false;
  }
}, 50);

// ── Rodar o gerador ───────────────────────────────────────────

// a pasta temporária do gerador é da bancada: o arquivo de controle do proxy
// mora no os.tmpdir(), e o da sua máquina nunca é tocado
const TEMP_DO_GERADOR = path.join(BANCADA, 'tmp');
fs.mkdirSync(TEMP_DO_GERADOR);
const CONTROLE = path.join(TEMP_DO_GERADOR, 'gerar-imagem-gpt-proxy.json');
const AMBIENTE = {
  ...process.env,
  GPT_PROXY_URL: `http://127.0.0.1:${PORTA}`,
  GPT_PROXY_CLI: CLI_FALSO,
  GPT_PROXY_ESPERA_MS: '4000',
  CODEX_HOME: CODEX_COM_LOGIN,
  TEMP: TEMP_DO_GERADOR,
  TMP: TEMP_DO_GERADOR,
  TMPDIR: TEMP_DO_GERADOR,
};
// sem porta pedida: o caminho padrão, com a porta efêmera
const SEM_PORTA = { GPT_PROXY_URL: '' };

function rodar(extras, env = {}) {
  return new Promise(resolve => {
    execFile(process.execPath, [SCRIPT, '--motor', 'gpt', '--saida', SAIDA, ...extras], { env: { ...AMBIENTE, ...env }, timeout: 60000 }, (erro, stdout, stderr) => {
      resolve({ code: erro ? (erro.code ?? 1) : 0, saida: `${stdout}${stderr}` });
    });
  });
}
// a vigia termina o que o caso anterior mandou antes do log zerar: senão uma
// volta em andamento obedeceria, no caso novo, um "stop" do caso velho
const drena = async () => {
  const prazo = Date.now() + 3000;
  while ((ocupada || processadas < chamadasCli().length) && Date.now() < prazo) await new Promise(r => setTimeout(r, 20));
};
const prepara = async ({ noAr, novoModo = 'ok' }) => {
  await drena();
  modo = novoModo;
  pedidos.length = 0;
  limpaCli();
  fs.rmSync(SAIDA, { force: true });
  fs.rmSync(CONTROLE, { force: true });
  pedidosHostis.length = 0;
  if (noAr) await liga(); else await desliga();
};
const pedidosDeImagem = () => pedidos.filter(p => p.url.startsWith('/v1/images/'));

// ── H1 · gerar a partir de texto ──────────────────────────────

console.log('H1 · gerar a partir de texto');

await prepara({ noAr: true });
const seco = await rodar(['--prompt', 'uma xícara', '--dry-run']);
checa('--motor gpt --dry-run sai 0', seco.code === 0, seco.saida.slice(0, 300));
checa('o dry-run diz que não há custo por imagem', /sem custo por imagem/i.test(seco.saida), seco.saida.slice(0, 300));
checa('a tela avisa que o proxy é não oficial e aponta o motor nano', /NÃO OFICIAL/.test(seco.saida) && /motor nano/.test(seco.saida), seco.saida.slice(0, 400));
checa('o dry-run não fala com o proxy nem o sobe, mesmo com ele no ar', pedidos.length === 0 && chamadasCli().length === 0, pedidos.map(p => p.url).concat(chamadasCli()).join(' | '));

await prepara({ noAr: true });
const gerou = await rodar(['--prompt', 'a white ceramic cup on an oak desk']);
const img = pedidosDeImagem();
checa('gera saindo 0 com o proxy no ar', gerou.code === 0, gerou.saida.slice(0, 400));
checa('o pedido de texto vai ao /v1/images/generations', img.length === 1 && img[0].url === '/v1/images/generations' && img[0].metodo === 'POST');
let enviado = {};
try { enviado = JSON.parse(img[0]?.corpo.toString('utf8') || '{}'); } catch { enviado = {}; }
checa('o modelo é o gpt-image-2', enviado.model === 'gpt-image-2', JSON.stringify(enviado).slice(0, 200));
checa('a proporção padrão (4:5) vem escrita na frente do prompt', enviado.prompt === 'Aspect ratio 4:5. a white ceramic cup on an oak desk', String(enviado.prompt));
checa('não manda size nem quality, que o servidor ignora', !('size' in enviado) && !('quality' in enviado));
checa('o PNG que volta é gravado byte a byte na --saida', fs.existsSync(SAIDA) && fs.readFileSync(SAIDA).equals(IMAGEM_FALSA));
checa('a tela diz o tamanho que o servidor devolveu', gerou.saida.includes('1122x1402'), gerou.saida.slice(0, 400));
checa('com o proxy já no ar, o CLI não sobe nem desce', acoesCli().length === 0, chamadasCli().join(' | '));
checa('o token do login nunca aparece na tela', !gerou.saida.includes(ISCA_DO_LOGIN) && !seco.saida.includes(ISCA_DO_LOGIN));

await prepara({ noAr: true });
await rodar(['--prompt', 'story', '--formato', '9:16']);
let story = {};
try { story = JSON.parse(pedidosDeImagem()[0]?.corpo.toString('utf8') || '{}'); } catch { story = {}; }
checa('--formato 9:16 vira "Aspect ratio 9:16." no prompt', String(story.prompt).startsWith('Aspect ratio 9:16. '), String(story.prompt));

await prepara({ noAr: true, novoModo: 'recusa' });
const recusada = await rodar(['--prompt', 'algo']);
checa('servidor recusa (4xx): sai diferente de 0', recusada.code !== 0);
checa('servidor recusa (4xx): repassa a mensagem dele', recusada.saida.includes('rejected by the safety system'), recusada.saida.slice(0, 300));
checa('servidor recusa (4xx): nenhum arquivo gravado', !fs.existsSync(SAIDA));
checa('erro 4xx não se repete', pedidosDeImagem().length === 1, String(pedidosDeImagem().length));

await prepara({ noAr: true, novoModo: 'vazio' });
const vazio = await rodar(['--prompt', 'algo']);
checa('200 sem imagem: sai diferente de 0 e diz que não veio imagem', vazio.code !== 0 && /não devolveu imagem/.test(vazio.saida), vazio.saida.slice(0, 300));
checa('200 sem imagem: não repete nem grava', pedidosDeImagem().length === 1 && !fs.existsSync(SAIDA), String(pedidosDeImagem().length));

await prepara({ noAr: false });
const recusas = [
  ['--modelo pro com o GPT é recusado', ['--prompt', 'x', '--modelo', 'pro', '--dry-run']],
  ['--tamanho 4K com o GPT é recusado', ['--prompt', 'x', '--tamanho', '4K', '--dry-run']],
  ['--via gemini com o GPT é recusado', ['--prompt', 'x', '--via', 'gemini', '--dry-run']],
  ['--formato fora da lista é recusado', ['--prompt', 'x', '--formato', '7:3', '--dry-run']],
];
for (const [nome, extras] of recusas) {
  const r = await rodar(extras);
  checa(nome, r.code !== 0 && /gpt/i.test(r.saida), r.saida.slice(0, 200));
}
const comPersonagem = await rodar(['--prompt', 'SCENE: it waves.', '--personagem', PERSONAGEM, '--dry-run']);
checa('--personagem com o GPT é recusado, dizendo que o método é do Nano', comPersonagem.code !== 0 && /personagem/i.test(comPersonagem.saida) && /nano/i.test(comPersonagem.saida), comPersonagem.saida.slice(0, 300));
for (const url of ['http://exemplo.com:10531', 'https://127.0.0.1:10531', 'http://192.168.0.10:10531']) {
  const fora = await rodar(['--prompt', 'x', '--dry-run'], { GPT_PROXY_URL: url });
  checa(`endereço do proxy fora do PC é recusado (${url})`, fora.code !== 0 && /127\.0\.0\.1/.test(fora.saida), fora.saida.slice(0, 200));
}
const heic = await rodar(['--prompt', 'x', '--dry-run', '--ref', ref('foto.heic')]);
checa('referência .heic é recusada no GPT, que só leva png, jpg e webp', heic.code !== 0 && /heic/i.test(heic.saida), heic.saida.slice(0, 200));
for (const url of ['http://localhost:10531', 'http://[::1]:10531']) {
  const dentro = await rodar(['--prompt', 'x', '--dry-run'], { GPT_PROXY_URL: url });
  checa(`endereço do proxy no PC passa (${url})`, dentro.code === 0, dentro.saida.slice(0, 200));
}
fs.writeFileSync(ref('FOTO.JPG'), Buffer.from('jpg-falso'));
const maiuscula = await rodar(['--prompt', 'x', '--dry-run', '--ref', ref('FOTO.JPG')]);
checa('referência .JPG (maiúscula, a do celular) passa no GPT', maiuscula.code === 0, maiuscula.saida.slice(0, 200));
const motorRuim = await rodar(['--prompt', 'x', '--motor', 'dalle', '--dry-run']);
checa('--motor desconhecido é recusado', motorRuim.code !== 0 && /--motor/.test(motorRuim.saida), motorRuim.saida.slice(0, 200));

// o padrão continua o Nano: lido pelo parseArgs, sem rodar nada que fale com o Google
const sonda = path.join(BANCADA, 'sonda.cjs');
fs.writeFileSync(sonda, fs.readFileSync(SCRIPT, 'utf8')
  .replace("const RAIZ = path.resolve(__dirname, '..');", `const RAIZ = ${JSON.stringify(RAIZ)};`)
  .replace(/main\(\)\.catch[\s\S]*$/, 'module.exports = { parseArgs };'));
const { parseArgs } = createRequire(import.meta.url)(sonda);
checa('sem --motor, o motor é o Nano Banana', parseArgs(['node', SCRIPT, '--prompt', 'x', '--saida', SAIDA]).motor === 'nano');

// ── H2 · editar a partir de referências ───────────────────────

console.log('\nH2 · referências');

await prepara({ noAr: true });
const editou = await rodar(['--prompt', 'the cup of image 1 on the table of image 2', '--ref', ref('r1.png'), '--ref', ref('foto.webp')]);
const ed = pedidosDeImagem();
checa('edição sai 0', editou.code === 0, editou.saida.slice(0, 300));
checa('com --ref o pedido vai ao /v1/images/edits em multipart', ed.length === 1 && ed[0].url === '/v1/images/edits' && ed[0].tipo.startsWith('multipart/form-data'), ed[0] && `${ed[0].url} ${ed[0].tipo}`);
let form = null;
try { form = ed[0] ? await new Response(ed[0].corpo, { headers: { 'content-type': ed[0].tipo } }).formData() : null; } catch { form = null; }
const imagens = form ? form.getAll('image') : [];
const bytes = async arquivo => Buffer.from(await arquivo.arrayBuffer());
checa('duas imagens no pedido', imagens.length === 2, String(imagens.length));
checa('ORDEM: a 1ª é a 1ª da linha', imagens[0] && (await bytes(imagens[0])).equals(fs.readFileSync(ref('r1.png'))));
checa('ORDEM: a 2ª é a 2ª da linha', imagens[1] && (await bytes(imagens[1])).equals(fs.readFileSync(ref('foto.webp'))));
checa('o mime de cada uma é o da extensão', imagens[0]?.type === 'image/png' && imagens[1]?.type === 'image/webp', `${imagens[0]?.type} ${imagens[1]?.type}`);
checa('o prompt da edição leva a proporção na frente', form?.get('prompt') === 'Aspect ratio 4:5. the cup of image 1 on the table of image 2', String(form?.get('prompt')));
checa('o modelo da edição é o gpt-image-2', form?.get('model') === 'gpt-image-2');
checa('a edição grava o PNG', fs.existsSync(SAIDA) && fs.readFileSync(SAIDA).equals(IMAGEM_FALSA));

await prepara({ noAr: false });
const refs = n => Array.from({ length: n }, (_, i) => ['--ref', ref(`r${i + 1}.png`)]).flat();
const cinco = await rodar(['--prompt', 'x', '--dry-run', ...refs(5)]);
checa('5 referências passam (o teto do proxy)', cinco.code === 0, cinco.saida.slice(0, 300));
const seis = await rodar(['--prompt', 'x', '--dry-run', ...refs(6)]);
checa('6 referências são recusadas antes de sair da máquina', seis.code !== 0 && pedidos.length === 0);
checa('a recusa diz o número e o teto', /6/.test(seis.saida) && /5/.test(seis.saida), seis.saida.slice(0, 200));

// ── H3 · o proxy sobe e desce sozinho ─────────────────────────

console.log('\nH3 · o proxy');

await prepara({ noAr: false });
const semLogin = await rodar(['--prompt', 'x', '--dry-run'], { CODEX_HOME: CODEX_SEM_LOGIN });
checa('sem o auth.json do Codex, recusa já no dry-run', semLogin.code !== 0);
checa('e diz para rodar codex login', /codex login/.test(semLogin.saida), semLogin.saida.slice(0, 300));
checa('e diz o caminho de não usar: o motor nano', /Nano Banana gera|motor nano/.test(semLogin.saida), semLogin.saida.slice(0, 400));
await prepara({ noAr: true });
const semLoginReal = await rodar(['--prompt', 'x'], { CODEX_HOME: CODEX_SEM_LOGIN });
checa('sem login, nem o teste de vida sai', semLoginReal.code !== 0 && pedidos.length === 0 && chamadasCli().length === 0, pedidos.map(p => p.url).concat(chamadasCli()).join(' | '));

await prepara({ noAr: false });
const subiu = await rodar(['--prompt', 'x']);
const cli = acoesCli();
checa('proxy fora do ar: gera e sai 0', subiu.code === 0, subiu.saida.slice(0, 400));
checa('no fim, o arquivo de controle sai junto com o proxy', !fs.existsSync(CONTROLE));
checa('o CLI foi chamado para subir, na porta do proxy', cli[0] === `--detach --port ${PORTA}`, cli.join(' | '));
checa('e para descer, no fim', cli.at(-1) === 'stop' && cli.length === 2, cli.join(' | '));
checa('a imagem saiu entre subir e descer', pedidosDeImagem().length === 1 && fs.existsSync(SAIDA));

await prepara({ noAr: true, novoModo: 'limite' });
const limite = await rodar(['--prompt', 'x']);
checa('limite do plano esgotado: sai diferente de 0', limite.code !== 0);
checa('limite esgotado não se repete', pedidosDeImagem().length === 1, String(pedidosDeImagem().length));
checa('e diz que o limite acabou e quando volta', /limite/i.test(limite.saida) && limite.saida.includes('Volta em 2h00'), limite.saida.slice(0, 300));
for (const [segundos, esperado] of [[7199, '2h00'], [5400, '1h30']]) {
  resetaEm = segundos;
  await prepara({ noAr: true, novoModo: 'limite' });
  const r = await rodar(['--prompt', 'x']);
  checa(`limite em ${segundos} s diz "Volta em ${esperado}"`, r.saida.includes(`Volta em ${esperado}`) && !/h60/.test(r.saida), r.saida.slice(0, 300));
}
resetaEm = 7200;

// a lista de modelos depende do backend da OpenAI e pode dar 502 com o proxy no
// ar: quem decide se o proxy roda é o status do CLI, e um proxy alheio não cai
await prepara({ noAr: true, novoModo: 'lista-502' });
const alheio = await rodar(['--prompt', 'x']);
checa('proxy no ar com a lista de modelos em 502: gera mesmo assim', alheio.code === 0, alheio.saida.slice(0, 300));
checa('e não sobe nem derruba o proxy que não subiu', acoesCli().length === 0, chamadasCli().join(' | '));

await prepara({ noAr: true });
marcaRodando(false); // o status do CLI não o vê, a lista vê
const aMao = await rodar(['--prompt', 'x']);
checa('proxy que o status não vê e a lista vê: gera sem subir nem derrubar', aMao.code === 0 && acoesCli().length === 0, chamadasCli().join(' | '));

await prepara({ noAr: false });
obedecer = false;
const morto = await rodar(['--prompt', 'x'], { GPT_PROXY_ESPERA_MS: '1200' });
checa('proxy que não sobe: desiste, sai diferente de 0', morto.code !== 0);
checa('e diz que o proxy não respondeu', /proxy/i.test(morto.saida) && /respond/i.test(morto.saida), morto.saida.slice(0, 300));
checa('e desce o que tentou subir', acoesCli().at(-1) === 'stop', chamadasCli().join(' | '));
obedecer = true;

await prepara({ noAr: true, novoModo: 'estranho' });
marcaRodando(false); // o que está na porta não é o proxy do CLI
obedecer = false;
const estranho = await rodar(['--prompt', 'x'], { GPT_PROXY_ESPERA_MS: '1200' });
checa('outra coisa na porta (sem gpt-image-2) não conta como proxy no ar', acoesCli()[0]?.startsWith('--detach') && estranho.code !== 0, chamadasCli().join(' | '));
obedecer = true;

// o Ctrl+C no meio da geração desce o proxy que o script subiu, senão a conta
// fica servindo no PC. No Windows o sinal não se manda a outro
// processo sem matá-lo, então a sonda chama o motor e emite o SIGINT nela mesma
const SONDA_SINAL = path.join(BANCADA, 'sonda-sinal.cjs');
fs.writeFileSync(SONDA_SINAL, [
  `const { rodarGpt } = require(${JSON.stringify(path.join(RAIZ, 'scripts', 'lib', 'motor-gpt.js'))});`,
  "setTimeout(() => process.emit('SIGINT'), 2500);",
  `rodarGpt({ prompt: 'x', formato: '4:5', refs: [], saida: ${JSON.stringify(SAIDA)}, dryRun: false }, { mimePorExt: {}, paraTela: s => s });`,
].join('\n'));
await prepara({ noAr: false, novoModo: 'lento' });
const ctrlC = await new Promise(resolve => execFile(process.execPath, [SONDA_SINAL], { env: AMBIENTE, timeout: 20000 }, (erro, stdout, stderr) => resolve({ code: erro ? (erro.code ?? 1) : 0, saida: `${stdout}${stderr}` })));
checa('Ctrl+C no meio da geração: desce o proxy que subiu e sai 130', ctrlC.code === 130 && acoesCli().at(-1) === 'stop' && acoesCli().length === 2 && !fs.existsSync(SAIDA), `${ctrlC.code} · ${chamadasCli().join(' | ')}`);
checa('Ctrl+C: o arquivo de controle sai junto', !fs.existsSync(CONTROLE));

// ── H4 · o proxy sem autenticação: porta efêmera, controle, redirecionamento ──
//
// O openai-oauth não confere Origin nem Host: enquanto está no ar, quem alcança
// a porta usa a conta. Por isso a porta muda a cada execução, o proxy vive só
// durante a geração, o órfão de uma execução morta é derrubado, e o POST com o
// prompt e as imagens não segue redirecionamento.

console.log('\nH4 · porta efêmera, controle e redirecionamento');

const portaDoDetach = () => Number((acoesCli().find(c => c.startsWith('--detach')) || '').split(' ').at(-1));

await prepara({ noAr: false });
const efemera1 = await rodar(['--prompt', 'x'], SEM_PORTA);
const p1 = portaDoDetach();
const imagemNaPorta = portaAtual === p1 && pedidosDeImagem().length === 1;
checa('sem GPT_PROXY_URL: gera e sai 0', efemera1.code === 0, efemera1.saida.slice(0, 400));
checa('sem GPT_PROXY_URL: o proxy sobe numa porta efêmera, nem a 10531 do pacote nem a da variável', p1 > 0 && p1 !== 10531 && p1 !== PORTA, acoesCli().join(' | '));
checa('e o pedido de imagem foi a essa porta', imagemNaPorta, `${portaAtual} · ${p1}`);
checa('e o proxy desce no fim, e o controle sai', acoesCli().at(-1) === 'stop' && !fs.existsSync(CONTROLE), acoesCli().join(' | '));
await prepara({ noAr: false });
await rodar(['--prompt', 'x'], SEM_PORTA);
const p2 = portaDoDetach();
checa('a porta é escolhida a cada execução (duas execuções, duas portas)', p2 > 0 && p2 !== p1, `${p1} · ${p2}`);

// durante a geração, o arquivo de controle diz quem subiu e em que porta
await prepara({ noAr: false, novoModo: 'lento' });
const lenta = rodar(['--prompt', 'x'], SEM_PORTA);
const prazoLento = Date.now() + 15000;
while (!pedidosDeImagem().length && Date.now() < prazoLento) await new Promise(r => setTimeout(r, 100));
let durante = null;
try { durante = JSON.parse(fs.readFileSync(CONTROLE, 'utf8')); } catch { durante = null; }
await lenta;
checa('durante a geração, o controle guarda o PID de quem subiu e a porta', Number.isInteger(durante?.pid) && durante.pid !== process.pid && Number(durante?.porta) === portaDoDetach(), JSON.stringify(durante));
checa('e sai quando a geração acaba', !fs.existsSync(CONTROLE));

// o órfão: o controle aponta um PID morto, e o proxy dele ainda está no ar
const pidMorto = await new Promise(resolve => {
  const filho = execFile(process.execPath, ['-e', ''], () => resolve(filho.pid));
});
await prepara({ noAr: true });
fs.writeFileSync(CONTROLE, JSON.stringify({ pid: pidMorto, porta: PORTA }));
const orfao = await rodar(['--prompt', 'x'], SEM_PORTA);
checa('controle com PID morto e proxy no ar: desce o órfão ANTES de subir o seu', acoesCli()[0] === 'stop' && acoesCli()[1]?.startsWith('--detach'), acoesCli().join(' | '));
checa('e gera, e diz que desceu o que ficou no ar', orfao.code === 0 && /deixou no ar/.test(orfao.saida), orfao.saida.slice(0, 400));
checa('e não reaproveita o órfão: a imagem foi ao proxy novo', portaAtual === portaDoDetach() && portaAtual !== PORTA && !fs.existsSync(CONTROLE), `${portaAtual}`);

// outra geração viva: não mexe no proxy dela
await prepara({ noAr: true });
fs.writeFileSync(CONTROLE, JSON.stringify({ pid: process.pid, porta: PORTA }));
const viva = await rodar(['--prompt', 'x'], SEM_PORTA);
checa('controle com PID vivo: recusa dizendo que outra geração está em andamento', viva.code !== 0 && /em andamento/.test(viva.saida), viva.saida.slice(0, 300));
checa('e não sobe, não desce, não pede imagem, e deixa o controle da outra', acoesCli().length === 0 && pedidosDeImagem().length === 0 && fs.existsSync(CONTROLE), acoesCli().join(' | '));

// proxy de outra origem, sem a pessoa ter pedido a porta dele
await prepara({ noAr: true });
const alheioSemPorta = await rodar(['--prompt', 'x'], SEM_PORTA);
checa('proxy no ar subido fora do script, sem GPT_PROXY_URL: recusa e aponta GPT_PROXY_URL', alheioSemPorta.code !== 0 && /GPT_PROXY_URL/.test(alheioSemPorta.saida), alheioSemPorta.saida.slice(0, 300));
checa('e não usa, não sobe e não derruba esse proxy', acoesCli().length === 0 && pedidos.length === 0, acoesCli().concat(pedidos.map(p => p.url)).join(' | '));

// o node morre sem passar pelo finally: o controle fica, e a próxima execução
// derruba o órfão (a sonda gera devagar e sai à força no meio)
const SONDA_MORTE = path.join(BANCADA, 'sonda-morte.cjs');
fs.writeFileSync(SONDA_MORTE, [
  `const { rodarGpt } = require(${JSON.stringify(path.join(RAIZ, 'scripts', 'lib', 'motor-gpt.js'))});`,
  "setTimeout(() => (process.reallyExit ? process.reallyExit(9) : process.kill(process.pid, 'SIGKILL')), 2500);",
  `rodarGpt({ prompt: 'x', formato: '4:5', refs: [], saida: ${JSON.stringify(SAIDA)}, dryRun: false }, { mimePorExt: {}, paraTela: s => s });`,
].join('\n'));
await prepara({ noAr: false, novoModo: 'lento' });
await new Promise(resolve => execFile(process.execPath, [SONDA_MORTE], { env: { ...AMBIENTE, ...SEM_PORTA }, timeout: 20000 }, () => resolve()));
const deixou = fs.existsSync(CONTROLE) && acoesCli().length === 1 && acoesCli()[0].startsWith('--detach');
checa('morte sem finally: o controle fica e o proxy fica no ar (o defeito que o controle cobre)', deixou && servidor.listening, `${fs.existsSync(CONTROLE)} · ${acoesCli().join(' | ')}`);
const portaOrfa = portaAtual;
await drena();
modo = 'ok';
pedidos.length = 0;
limpaCli();
const depoisDaMorte = await rodar(['--prompt', 'x'], SEM_PORTA);
checa('a execução seguinte desce o órfão, sobe o seu numa porta nova e gera', depoisDaMorte.code === 0 && acoesCli()[0] === 'stop' && portaDoDetach() !== portaOrfa && acoesCli().at(-1) === 'stop' && !fs.existsSync(CONTROLE), `${depoisDaMorte.code} · ${acoesCli().join(' | ')}`);

// redirecionamento: o POST com o prompt e as imagens nunca segue para outro lugar
await prepara({ noAr: true, novoModo: 'redireciona' });
// sem --ref: o corpo JSON é o que o fetch consegue reenviar num 307, então é o
// caso em que seguir o redirecionamento vazaria de fato
const redir = await rodar(['--prompt', 'segredo do prompt']);
checa('o proxy responde 307 no pedido de imagem: nada chega ao destino do redirecionamento', pedidosHostis.length === 0, pedidosHostis.map(p => p.url).join(' | '));
checa('e sai diferente de 0 dizendo que recusou o redirecionamento, sem repetir', redir.code !== 0 && /redirecionamento/.test(redir.saida) && pedidosDeImagem().length === 1, `${pedidosDeImagem().length} · ${redir.saida.slice(-500)}`);
await prepara({ noAr: true, novoModo: 'redireciona-lista' });
marcaRodando(false); // o status não o vê: quem decide é a lista de modelos
obedecer = false;
await rodar(['--prompt', 'x'], { GPT_PROXY_ESPERA_MS: '1200' });
obedecer = true;
checa('a lista de modelos redirecionada também não segue', pedidosHostis.length === 0, pedidosHostis.map(p => p.url).join(' | '));

// ── H5 · a pasta do registro do proxy, nos três sistemas ──────
//
// A mensagem de "o proxy não respondeu" manda olhar o registro dele. O critério
// é o do próprio openai-oauth (resolveRuntimeDirectory, dist/cli.js 2.0.0); aqui
// cada ramo roda trocando o process.platform só neste processo.

console.log('\nH5 · a pasta do registro');
checa('a mensagem de proxy que não sobe cita a pasta do registro', /openai-oauth/.test(morto.saida), morto.saida.slice(-300));
const { pastaDoRegistro } = createRequire(import.meta.url)(path.join(RAIZ, 'scripts', 'lib', 'motor-gpt.js'));
const plataformaReal = Object.getOwnPropertyDescriptor(process, 'platform');
const envAntes = { ...process.env };
const comPlataforma = (plataforma, env) => {
  Object.defineProperty(process, 'platform', { value: plataforma });
  for (const chave of ['OPENAI_OAUTH_INTERNAL_RUNTIME_DIR', 'XDG_STATE_HOME', 'LOCALAPPDATA']) delete process.env[chave];
  Object.assign(process.env, env);
  try { return pastaDoRegistro(); } finally {
    Object.defineProperty(process, 'platform', plataformaReal);
    for (const chave of ['OPENAI_OAUTH_INTERNAL_RUNTIME_DIR', 'XDG_STATE_HOME', 'LOCALAPPDATA']) {
      if (envAntes[chave] === undefined) delete process.env[chave]; else process.env[chave] = envAntes[chave];
    }
  }
};
const casa = os.homedir();
checa('macOS: ~/Library/Application Support/openai-oauth', comPlataforma('darwin', {}) === path.join(casa, 'Library', 'Application Support', 'openai-oauth'));
checa('Linux com XDG_STATE_HOME: $XDG_STATE_HOME/openai-oauth', comPlataforma('linux', { XDG_STATE_HOME: path.join(BANCADA, 'xdg') }) === path.join(BANCADA, 'xdg', 'openai-oauth'));
checa('Linux sem XDG_STATE_HOME: ~/.local/state/openai-oauth', comPlataforma('linux', {}) === path.join(casa, '.local', 'state', 'openai-oauth'));
checa('Windows: %LOCALAPPDATA%\\openai-oauth', comPlataforma('win32', { LOCALAPPDATA: path.join(BANCADA, 'lad') }) === path.join(BANCADA, 'lad', 'openai-oauth'));
checa('Windows sem LOCALAPPDATA: ~/AppData/Local/openai-oauth', comPlataforma('win32', {}) === path.join(casa, 'AppData', 'Local', 'openai-oauth'));
checa('a variável interna do pacote manda sobre todos', comPlataforma('darwin', { OPENAI_OAUTH_INTERNAL_RUNTIME_DIR: path.join(BANCADA, 'interno') }) === path.join(BANCADA, 'interno'));

// ── Fecho ─────────────────────────────────────────────────────

clearInterval(vigia);
await desliga();
fs.rmSync(BANCADA, { recursive: true, force: true });

console.log(`\n${ok + mau} casos · ${ok} passaram · ${mau} reprovaram`);
escreveRelatorio(process.argv, 'gerar-imagem-gpt', casos, { passou: ok, falhou: mau });
resumoTap(ok, mau);
process.exit(mau ? 1 : 0);
