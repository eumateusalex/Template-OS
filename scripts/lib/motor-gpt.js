/**
 * O motor GPT do `gerar-imagem.js` (OPCIONAL): gera e edita imagem pelo
 * gpt-image-2 do seu plano ChatGPT, sem chave de API e sem custo por imagem,
 * pelo proxy local `openai-oauth` fixado em `scripts/package.json`.
 *
 * 🚨 NÃO OFICIAL. O proxy usa o login do Codex (`codex login`) fora do Codex. A
 * OpenAI não oferece esse caminho como produto: o backend pode mudar e quebrar
 * o motor sem aviso, e o uso recai sobre a sua conta do ChatGPT. O motor padrão,
 * o Nano Banana pela Vertex AI, não depende de nada disso. O aviso completo está
 * na skill `/gerar-imagem`, seção "O motor GPT".
 *
 * Medido num plano ChatGPT Plus:
 *   - o servidor IGNORA `size` e `quality` e obedece a proporção escrita no
 *     texto (4:5 saiu 1122x1402, 9:16 saiu 941x1672). Por isso o prompt sai
 *     com "Aspect ratio X." na frente, e o pedido não manda o que é ignorado
 *   - 18 a 28 s por imagem; a saída fica perto de 1,5 megapixel
 *   - o endpoint de imagem respondeu mesmo com o limite semanal de TEXTO do
 *     Codex esgotado: é por isso que o motor não usa `codex exec "$imagegen"`
 *   - edição aceita até 5 referências (o proxy recusa a sexta)
 *
 * 🚨 O proxy carrega a sua conta e NÃO TEM AUTENTICAÇÃO: qualquer processo do
 * PC que alcance a porta dele gera imagem na sua conta enquanto ele está no ar
 * (o `openai-oauth` não confere Origin nem Host). Por isso:
 *   - ele vive só durante a geração: quem o subiu o desce no fim, também quando
 *     a geração falha ou é interrompida por Ctrl+C
 *   - a porta é EFÊMERA, uma livre escolhida a cada execução, e não a 10531 do
 *     pacote, que é previsível. Porta fixa só se você definir GPT_PROXY_URL no
 *     terminal, e aí o proxy que já estiver nela é seu e fica no ar
 *   - um ARQUIVO DE CONTROLE na pasta temporária do sistema guarda o PID de quem
 *     subiu o proxy. Se esse processo morrer sem passar pelo `finally` (janela
 *     fechada, processo morto), a execução seguinte acha o arquivo com o PID
 *     morto e desce o proxy órfão, em vez de reaproveitá-lo
 *   - todo pedido ao proxy vai com `redirect: 'error'`: um processo hostil na
 *     porta não consegue desviar o POST com o seu prompt e as suas imagens
 * O token mora no `auth.json` do Codex, que só o proxy lê: este módulo confere
 * que o arquivo existe e nunca o abre.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const net = require('net');
const { execFileSync } = require('child_process');

const MODELO_GPT = 'gpt-image-2';
const MAX_REFS_GPT = 5;
const FORMATOS_GPT = ['1:1', '4:5', '5:4', '3:4', '4:3', '2:3', '3:2', '9:16', '16:9'];
// o que a doc de imagem da OpenAI lista como entrada; .heic e .heif, que o Nano
// aceita, não foram medidos aqui
const EXTENSOES_GPT = ['.png', '.jpg', '.jpeg', '.webp'];
// o pedido leva o prompt e as suas imagens: só sai para o proxy no próprio PC
const HOSTS_LOCAIS = ['127.0.0.1', 'localhost', '[::1]'];
const HOST_EFEMERO = '127.0.0.1';
const TENTATIVAS = 3;
const ESPERA_REDE_MS = 3000;

const AVISO_NAO_OFICIAL = 'proxy NÃO OFICIAL sobre o seu login do ChatGPT: pode quebrar sem aviso, e o risco é da sua conta. O padrão seguro é o motor nano.';

// a porta fixa existe só quando a pessoa a pede, pela variável do terminal
const proxyFixo = () => (process.env.GPT_PROXY_URL ? process.env.GPT_PROXY_URL.replace(/\/+$/, '') : null);
const cliProxy = () => process.env.GPT_PROXY_CLI || path.join(__dirname, '..', 'node_modules', 'openai-oauth', 'dist', 'cli.js');
const esperaProxyMs = () => Number(process.env.GPT_PROXY_ESPERA_MS) || 30000;
const authCodex = () => path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'auth.json');
// na pasta temporária do sistema, fora de qualquer repositório
const arquivoControle = () => path.join(os.tmpdir(), 'gerar-imagem-gpt-proxy.json');

const dormir = ms => new Promise(r => setTimeout(r, ms));

// ── Validação (antes de qualquer coisa sair da máquina) ───────

// `definidas` são as flags que a pessoa escreveu: o GPT não tem modelo, tamanho
// nem via, e aceitar calado faria a tela prometer o que o servidor não faz
function validarGpt(args) {
  const semEscolha = ['--modelo', '--tamanho', '--via'].filter(f => args.definidas.includes(f));
  if (semEscolha.length) {
    throw new Error(`${semEscolha.join(', ')} não existe no --motor gpt: o servidor do GPT escolhe sozinho. Tire a flag ou use o motor nano.`);
  }
  if (args.personagem) {
    throw new Error('--personagem não roda no --motor gpt: o GPT redesenha o rosto entre gerações, e a consistência do personagem foi medida no Nano Banana. Use o motor nano.');
  }
  if (!FORMATOS_GPT.includes(args.formato)) {
    throw new Error(`--formato ${args.formato} não existe no --motor gpt. Use: ${FORMATOS_GPT.join(', ')}`);
  }
  if (args.refs.length > MAX_REFS_GPT) {
    throw new Error(`${args.refs.length} referências para o --motor gpt, e o teto é ${MAX_REFS_GPT}. Tire as que sobram ou use o motor nano.`);
  }
  const fora = args.refs.find(a => !EXTENSOES_GPT.includes(path.extname(a).toLowerCase()));
  if (fora) throw new Error(`--ref ${path.basename(fora)}: o --motor gpt só leva ${EXTENSOES_GPT.join(', ')}. Converta ou use o motor nano.`);
  const fixo = proxyFixo();
  if (fixo) {
    let base;
    try { base = new URL(fixo); } catch { base = null; }
    if (!base || base.protocol !== 'http:' || !HOSTS_LOCAIS.includes(base.hostname)) {
      throw new Error(`GPT_PROXY_URL=${fixo} não é o proxy no próprio PC: use http://127.0.0.1:<porta>.`);
    }
  }
}

// Sem o login do Codex o motor não roda, nem no --dry-run: é a única porta para
// a conta, e ela é aberta pela pessoa, nunca por este script
function exigirLogin() {
  const arquivo = authCodex();
  if (!fs.existsSync(arquivo)) {
    throw new Error(
      `Sem o login do Codex (${arquivo} não existe). O motor GPT é opcional: para usá-lo, instale o Codex CLI ` +
      '(npm install -g @openai/codex) e rode "codex login" uma vez, entrando com a sua conta do ChatGPT. ' +
      'Para não usá-lo, tire o --motor gpt e o Nano Banana gera.'
    );
  }
}

// ── O pedido ──────────────────────────────────────────────────

const textoGpt = args => `Aspect ratio ${args.formato}. ${args.prompt}`;

// Sem referência, JSON no generations; com referência, multipart no edits, um
// campo `image` por arquivo NA ORDEM da linha de comando (o prompt cita "a
// imagem 1, a imagem 2"), com o mime do mapa do gerador
function montarPedidoGpt(args, mimePorExt) {
  if (!args.refs.length) {
    return {
      caminho: '/v1/images/generations',
      opcoes: { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: MODELO_GPT, prompt: textoGpt(args) }) },
    };
  }
  const form = new FormData();
  form.append('model', MODELO_GPT);
  form.append('prompt', textoGpt(args));
  for (const arquivo of args.refs) {
    const tipo = mimePorExt[path.extname(arquivo).toLowerCase()];
    form.append('image', new Blob([fs.readFileSync(arquivo)], { type: tipo }), path.basename(arquivo));
  }
  return { caminho: '/v1/images/edits', opcoes: { body: form } };
}

// ── O proxy ───────────────────────────────────────────────────

// No ar é responder a lista de modelos COM o gpt-image-2: outra coisa na
// porta não conta, senão o pedido de imagem iria para quem não é o proxy
async function proxyNoAr(base) {
  try {
    const res = await fetch(`${base}/v1/models`, { redirect: 'error', signal: AbortSignal.timeout(3000) });
    if (!res.ok) return false;
    const json = await res.json();
    return Array.isArray(json?.data) && json.data.some(m => m?.id === MODELO_GPT);
  } catch {
    return false;
  }
}

const rodarCli = (...argv) => execFileSync(process.execPath, [cliProxy(), ...argv], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });

// O `status` do CLI responde pela porta de controle local, sem rede, e diz se
// existe um proxy do pacote no ar (o pacote só deixa existir um por vez)
function statusRodando() {
  try {
    rodarCli('status');
    return true;
  } catch {
    return false;
  }
}

// Com a porta fixa pedida pela pessoa: quem decide se o proxy já roda é o
// `status`, porque a lista de modelos vai ao backend da OpenAI a cada pedido e
// pode dar 502 com o proxy no ar. A lista fica para o proxy de OUTRA versão do
// pacote, cujo registro o `status` desta versão não reconhece
async function proxyRodando(base) {
  return statusRodando() || proxyNoAr(base);
}

// uma porta livre agora; o proxy a ocupa logo em seguida
const portaLivre = () => new Promise((resolve, reject) => {
  const s = net.createServer();
  s.once('error', reject);
  s.listen(0, HOST_EFEMERO, () => {
    const { port } = s.address();
    s.close(() => resolve(port));
  });
});

async function subirProxy(base) {
  const porta = new URL(base).port || '10531';
  rodarCli('--detach', '--port', porta);
  const prazo = Date.now() + esperaProxyMs();
  while (Date.now() < prazo) {
    if (await proxyNoAr(base)) return;
    await dormir(300);
  }
  throw new Error(`O proxy do GPT não respondeu em ${esperaProxyMs() / 1000} s em ${base}. O registro dele fica em ${pastaDoRegistro()}.`);
}

// Onde o `openai-oauth` guarda o registro e o log (server.log). O critério é o
// do próprio pacote (`resolveRuntimeDirectory`, no dist/cli.js da 2.0.0): a
// variável interna dele, depois um ramo por sistema
function pastaDoRegistro() {
  if (process.env.OPENAI_OAUTH_INTERNAL_RUNTIME_DIR) return process.env.OPENAI_OAUTH_INTERNAL_RUNTIME_DIR;
  if (process.platform === 'darwin') return path.join(os.homedir(), 'Library', 'Application Support', 'openai-oauth');
  if (process.platform === 'win32') return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'openai-oauth');
  return path.join(process.env.XDG_STATE_HOME || path.join(os.homedir(), '.local', 'state'), 'openai-oauth');
}

function descerProxy() {
  try {
    rodarCli('stop');
  } catch (erro) {
    console.error(`  aviso: não consegui descer o proxy (${erro.message.split('\n')[0]}). Desça com: node "${cliProxy()}" stop`);
  }
}

// ── O arquivo de controle (quem subiu o proxy, e se ainda está vivo) ──

function lerControle() {
  try {
    const dado = JSON.parse(fs.readFileSync(arquivoControle(), 'utf8'));
    return Number.isInteger(dado?.pid) ? dado : null;
  } catch {
    return null;
  }
}
const gravarControle = porta => fs.writeFileSync(arquivoControle(), JSON.stringify({ pid: process.pid, porta, desde: new Date().toISOString() }), { mode: 0o600 });
const apagarControle = () => fs.rmSync(arquivoControle(), { force: true });

function processoVivo(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (erro) {
    return erro.code === 'EPERM';
  }
}

// Antes de tudo: um arquivo de controle com PID morto é um proxy que ficou no
// ar porque quem o subiu morreu sem descê-lo. Desce, e não reaproveita. Com o
// PID vivo, outra geração está em andamento, e o pacote só deixa um proxy
function tratarControleAnterior() {
  const anterior = lerControle();
  if (!anterior || anterior.pid === process.pid) return;
  if (processoVivo(anterior.pid)) {
    throw new Error(`Outra geração pelo motor GPT está em andamento (PID ${anterior.pid}). Espere ela terminar: o proxy é um só por vez.`);
  }
  const orfaoNoAr = statusRodando();
  if (orfaoNoAr) {
    console.log(`Proxy:   descendo o proxy que uma execução anterior deixou no ar (o PID ${anterior.pid} morreu sem descê-lo)`);
    descerProxy();
  }
  apagarControle();
}

// ── A chamada ─────────────────────────────────────────────────

function erroDeLimite(json) {
  const segundos = Number(json?.error?.resets_in_seconds);
  if (!Number.isFinite(segundos)) return new Error('O limite de imagem do plano ChatGPT acabou (o servidor não disse quando volta).');
  const volta = new Date(Date.now() + segundos * 1000).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  // o minuto se arredonda ANTES de separar a hora: 7199 s é 2h00, e não 1h60
  const total = Math.ceil(segundos / 60);
  const h = Math.floor(total / 60);
  const min = total % 60;
  return new Error(`O limite de imagem do plano ChatGPT acabou. Volta em ${h}h${String(min).padStart(2, '0')} (${volta}). Até lá, use o motor nano.`);
}

// redirect: 'error' faz o fetch falhar com TypeError, que na regra abaixo seria
// erro de rede e se repetiria: redirecionamento não é rede, é recusa
const ehRedirecionamento = erro => erro?.name === 'TypeError' && /redirect/i.test(String(erro?.cause?.message ?? ''));

// A política do motor Nano: rede e 5xx repetem, 4xx não; limite esgotado
// também não, porque repetir só gasta tempo até ele voltar
async function pedir(base, args, mimePorExt) {
  const { caminho, opcoes } = montarPedidoGpt(args, mimePorExt);
  let ultimoErro;
  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    try {
      const res = await fetch(`${base}${caminho}`, { method: 'POST', ...opcoes, redirect: 'error', signal: AbortSignal.timeout(300000) });
      const json = await res.json().catch(() => ({}));
      if (res.status === 429 && json?.error?.type === 'usage_limit_reached') throw erroDeLimite(json);
      if (!res.ok) {
        const erro = new Error(`${json?.error?.message ?? 'sem mensagem'} (HTTP ${res.status})`);
        if (res.status >= 500 || res.status === 429) erro.retentavel = true;
        throw erro;
      }
      const b64 = json?.data?.[0]?.b64_json;
      if (!b64) throw new Error(`O servidor do GPT não devolveu imagem: ${JSON.stringify(json).slice(0, 300)}`);
      return { imagem: Buffer.from(b64, 'base64'), tamanho: json.size, qualidade: json.quality };
    } catch (erro) {
      if (ehRedirecionamento(erro)) {
        throw new Error(`O proxy em ${base} respondeu com um redirecionamento, e o pedido foi recusado: ele leva o seu prompt e as suas imagens, e só vai ao proxy no próprio PC. Confira o que está escutando nessa porta.`);
      }
      ultimoErro = erro;
      const podeRepetir = erro.retentavel || erro.name === 'TypeError';
      if (!podeRepetir || tentativa === TENTATIVAS) break;
      console.log(`  tentativa ${tentativa}/${TENTATIVAS} falhou (${erro.message}), repetindo...`);
      await dormir(ESPERA_REDE_MS * tentativa);
    }
  }
  throw ultimoErro;
}

// ── A porta que o gerador chama ───────────────────────────────

async function rodarGpt(args, { mimePorExt, paraTela }) {
  exigirLogin();
  console.log(`Motor:   GPT (${MODELO_GPT}, plano ChatGPT pelo proxy local)`);
  console.log(`Aviso:   ${AVISO_NAO_OFICIAL}`);
  console.log(`Formato: ${args.formato}, escrito no prompt (o servidor escolhe tamanho e qualidade)`);
  args.refs.forEach((arquivo, i) => console.log(`${i === 0 ? 'Refs:   ' : '        '} ${i + 1}. ${paraTela(arquivo)}`));
  console.log(`Saída:   ${paraTela(args.saida)}`);
  console.log('Custo:   sem custo por imagem: gasta o limite de imagem do plano ChatGPT');
  console.log(`Prompt:  ${args.prompt.slice(0, 160)}${args.prompt.length > 160 ? '…' : ''}`);

  if (args.dryRun) {
    if (!fs.existsSync(cliProxy())) throw new Error(`Proxy não instalado (${cliProxy()}). Rode: npm ci --prefix scripts`);
    console.log('\n--dry-run: nada foi gerado e nada saiu da máquina.');
    return;
  }

  tratarControleAnterior();
  const fixo = proxyFixo();
  let base;
  let subiAqui;
  if (fixo) {
    base = fixo;
    subiAqui = !(await proxyRodando(base));
  } else {
    // sem porta pedida, um proxy no ar foi subido fora deste script: não é
    // nosso para usar nem para derrubar
    if (statusRodando()) {
      throw new Error(`Já há um proxy openai-oauth no ar, subido fora deste script. Desça-o (node "${cliProxy()}" stop) ou, se ele é seu e deve ser usado, defina GPT_PROXY_URL no terminal com o endereço dele.`);
    }
    base = `http://${HOST_EFEMERO}:${await portaLivre()}`;
    subiAqui = true;
  }

  // Ctrl+C no meio da geração pularia o finally e deixaria a sua conta servindo
  // no PC
  const descerTudo = () => {
    descerProxy();
    apagarControle();
  };
  const interrompido = () => {
    descerTudo();
    process.exit(130);
  };
  const sinais = ['SIGINT', 'SIGTERM', 'SIGHUP'];
  try {
    if (subiAqui) {
      sinais.forEach(sinal => process.once(sinal, interrompido));
      // o controle vai ANTES de subir: morrer entre os dois ainda deixa rastro
      gravarControle(new URL(base).port);
      console.log('Proxy:   subindo, só durante esta geração...');
      await subirProxy(base);
    }
    console.log('\nGerando (leva uns 20 a 30 s)...');
    const { imagem, tamanho, qualidade } = await pedir(base, args, mimePorExt);
    fs.mkdirSync(path.dirname(args.saida), { recursive: true });
    fs.writeFileSync(args.saida, imagem);
    console.log(`OK, ${paraTela(args.saida)} (${(imagem.length / 1024).toFixed(0)} KB, ${tamanho ?? '?'}, qualidade ${qualidade ?? '?'})`);
  } finally {
    sinais.forEach(sinal => process.off(sinal, interrompido));
    if (subiAqui) descerTudo();
  }
}

module.exports = { rodarGpt, validarGpt, montarPedidoGpt, pastaDoRegistro, MAX_REFS_GPT, FORMATOS_GPT, MODELO_GPT };
