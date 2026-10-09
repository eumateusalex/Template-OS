#!/usr/bin/env node
/**
 * Gera imagem via Nano Banana (modelos Gemini de imagem).
 *
 * Uso:
 *   node scripts/gerar-imagem.js --prompt "..." --saida caminho/imagem.png
 *   node scripts/gerar-imagem.js --prompt-file roteiro.md --saida foto.png --modelo pro
 *   node scripts/gerar-imagem.js --prompt "..." --ref referencia.png --saida saida.png
 *   node scripts/gerar-imagem.js --prompt "..." --ref rosto.png --ref cenario.jpg --saida x.png
 *   node scripts/gerar-imagem.js --prompt "..." --saida x.png --dry-run
 *   node scripts/gerar-imagem.js --personagem pasta/do/personagem --prompt-file cena.md --saida pose.png
 *   node scripts/gerar-imagem.js --motor gpt --prompt "..." --saida x.png
 *
 * DOIS MOTORES. O padrão é o Nano Banana, descrito abaixo. O `--motor gpt`
 * (OPCIONAL) gera pelo gpt-image-2 do seu plano ChatGPT, sem custo por imagem,
 * por um proxy NÃO OFICIAL sobre o login do Codex, e mora em `lib/motor-gpt.js`.
 * Lá o servidor escolhe tamanho e qualidade, e por isso `--modelo`, `--tamanho`,
 * `--via` e `--personagem` são recusados. O risco do proxy está na skill
 * `/gerar-imagem`, seção "O motor GPT".
 *
 * O PERSONAGEM: `--personagem <pasta>` mantém um personagem recorrente (mascote,
 * ilustração da marca) igual entre gerações. Põe as imagens de
 * `<pasta>/referencias/` na frente, em ORDEM DE NOME (a ordem é a hierarquia:
 * numere 01-, 02-, 03-), e antepõe o `<pasta>/prompt-base.md` à cena do
 * --prompt. O prompt base cita "image 1, 2, 3" nessa ordem.
 *
 * REFERÊNCIA É REPETÍVEL: um --ref por imagem, e a ordem da linha de comando é
 * a ordem em que o modelo vê. Use isso para citar cada uma no prompt ("a pessoa
 * da imagem 1, no cenário da imagem 2"). Teto por modelo em MAX_REFS.
 *
 * DOIS CAMINHOS, e o padrão é a Vertex AI:
 *
 *   --via vertex  (padrão) Vertex AI, autenticada pelo gcloud (sem chave de API).
 *                 É o caminho que aceita crédito de Cloud Billing (os créditos
 *                 do Google Developer Program, por exemplo, valem aqui). Exige
 *                 `gcloud auth login` feito uma vez na máquina.
 *   --via gemini  API do AI Studio, com GEMINI_API_KEY. Mantido como alternativa:
 *                 aquela API cobra por saldo PRÉ-PAGO próprio, que crédito de
 *                 Cloud não abastece, e sem esse saldo responde 429
 *                 "prepayment credits are depleted".
 *
 * O formato padrão é 4:5 — o mesmo dos carrosséis. Para peça de capa ou fundo
 * de slide isso evita recorte depois. O render do /carrossel sai em 2160×2700,
 * então gerar em 2K já entrega pixel suficiente.
 *
 * A imagem de IA é COMPLEMENTO, não a peça: texto, tipografia e layout do
 * carrossel continuam vindo do HTML renderizado pelo /carrossel, na marca do
 * workspace. Modelo de imagem erra letra — não use
 * para gerar slide com texto.
 *
 * Configuração lida de scripts/.env:
 *   GOOGLE_CLOUD_PROJECT — projeto usado na Vertex AI
 *   GEMINI_API_KEY       — só para --via gemini
 *
 * CUSTO: cada geração é cobrada na conta Google (abatida dos créditos, quando
 * houver). O script mostra a estimativa antes; use --dry-run para conferir o
 * que será enviado sem gastar.
 *
 * A receita completa (por que Vertex e não AI Studio, erros e conserto) está
 * em `scripts/guia-geracao-imagem-vertex-ai.md`.
 */

const path = require('path');
const fs = require('fs');

const RAIZ = path.resolve(__dirname, '..');

const VERTEX_BASE = 'https://aiplatform.googleapis.com/v1';
const VERTEX_LOCAL = 'global';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Nano Banana 2 é o padrão: rápido e barato. O Pro só quando a imagem precisar
// de texto legível ou diagrama — é ~2x o preço.
const MODELOS = {
  flash: 'gemini-3.1-flash-image',
  pro: 'gemini-3-pro-image',
  legacy: 'gemini-2.5-flash-image',
};

// Estimativas em USD por imagem (tabela pública de ago/2026) — servem para
// avisar antes de gastar, não para conciliar fatura.
const CUSTO_ESTIMADO = {
  flash: { '1K': 0.045, '2K': 0.067, '4K': 0.151 },
  pro: { '1K': 0.134, '2K': 0.134, '4K': 0.24 },
  legacy: { '1K': 0.039, '2K': 0.039, '4K': 0.039 },
};

// Teto de imagens de referência por modelo.
//
// Os 14 de flash e pro estão na página oficial de geração de imagem do Gemini,
// conferida em 08/09/2026. Ela detalha a composição desses 14: no flash, até 10
// de objeto em alta fidelidade e até 4 de personagem; no pro, até 6 de objeto,
// até 5 de personagem e até 3 de estilo.
//
// O `legacy` (gemini-2.5-flash-image) NÃO aparece mais nessa página, então não
// há teto oficial vigente para ele. O 3 aqui é escolha conservadora: sem
// documentação, mandar mais é apostar. Quem precisa de muitas referências usa
// flash ou pro, que é onde o número está escrito.
const MAX_REFS = { flash: 14, pro: 14, legacy: 3 };

// Tipos que a API aceita como imagem de entrada. O mapa existe para NÃO chutar:
// rotular como image/png tudo que não é .jpg faz um .webp subir mentindo o mime,
// e o erro volta sem explicar por quê.
const MIME_POR_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
};

const TENTATIVAS = 4;
const ESPERA_MS = 3000;

// Caminho para a tela: relativo quando está dentro do workspace, absoluto
// quando não está. `path.relative` puro devolve escadas de "..\..\.." para
// arquivo de fora, que ocupa a linha inteira e não diz onde o arquivo está.
function paraTela(alvo) {
  const rel = path.relative(RAIZ, alvo);
  return rel.startsWith('..') || path.isAbsolute(rel) ? alvo : rel;
}

// ── Carregamento do .env (scripts/.env do workspace) ──────────

// O nome da chave aceita dígito ([A-Z0-9_]): só com letras, linhas como
// META_API_V2= se descartariam em silêncio.
function carregarEnv() {
  const envPath = path.join(RAIZ, 'scripts', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const linha of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

// ── Autenticação da Vertex (token efêmero via gcloud) ─────────

// o gcloud e o token vêm da fonte única do workspace (scripts/lib/vertex.js),
// carregada só na hora do pedido, como o motor GPT
const vertex = () => require(path.join(RAIZ, 'scripts', 'lib', 'vertex.js'));

// ── Montagem do pedido ────────────────────────────────────────

function montarCorpo(args) {
  // As referências entram ANTES do texto, e NA ORDEM em que ele passou: o
  // modelo trata as partes em sequência, e a instrução precisa poder se referir
  // ao que já viu ("a pessoa da primeira imagem, no cenário da segunda").
  // Por isso o map vem antes do prompt em vez de um unshift por imagem, que
  // inverteria a ordem a cada nova referência.
  const parts = [
    ...args.refs.map(arquivo => ({
      inlineData: {
        mimeType: MIME_POR_EXT[path.extname(arquivo).toLowerCase()],
        data: fs.readFileSync(arquivo).toString('base64'),
      },
    })),
    { text: args.prompt },
  ];

  return {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: { aspectRatio: args.formato, imageSize: args.tamanho },
    },
  };
}

function destino(args) {
  const modelo = MODELOS[args.modelo];
  if (args.via === 'vertex') {
    const projeto = process.env.GOOGLE_CLOUD_PROJECT;
    if (!projeto) {
      throw new Error('GOOGLE_CLOUD_PROJECT não definido no scripts/.env (necessário para --via vertex).');
    }
    return {
      url: `${VERTEX_BASE}/projects/${projeto}/locations/${VERTEX_LOCAL}/publishers/google/models/${modelo}:generateContent`,
      headers: { Authorization: `Bearer ${vertex().tokenVertex()}`, 'Content-Type': 'application/json' },
      descricao: `Vertex AI · projeto ${projeto}`,
    };
  }
  const chave = process.env.GEMINI_API_KEY;
  if (!chave) throw new Error('GEMINI_API_KEY não definida no scripts/.env (necessária para --via gemini).');
  return {
    url: `${GEMINI_BASE}/${modelo}:generateContent`,
    headers: { 'x-goog-api-key': chave, 'Content-Type': 'application/json' },
    descricao: 'Gemini API (AI Studio)',
  };
}

// ── Parsing de argumentos ─────────────────────────────────────

function parseArgs(argv) {
  const args = {
    prompt: '',
    saida: '',
    modelo: 'flash',
    via: 'vertex',
    formato: '4:5',
    tamanho: '2K',
    refs: [],
    dryRun: false,
    motor: 'nano',
    personagem: '',
    // as flags que a pessoa escreveu: o motor GPT recusa as que não tem
    definidas: [],
  };
  for (let i = 2; i < argv.length; i++) {
    const flag = argv[i];
    args.definidas.push(flag);
    if (flag === '--motor') {
      if (i + 1 < argv.length) args.motor = argv[++i];
    } else if (flag === '--prompt') {
      if (i + 1 < argv.length) args.prompt = argv[++i];
    } else if (flag === '--prompt-file') {
      if (i + 1 < argv.length) {
        const arquivo = path.resolve(argv[++i]);
        if (!fs.existsSync(arquivo)) throw new Error(`--prompt-file não encontrado: ${arquivo}`);
        args.prompt = fs.readFileSync(arquivo, 'utf8').trim();
      }
    } else if (flag === '--saida') {
      if (i + 1 < argv.length) args.saida = path.resolve(argv[++i]);
    } else if (flag === '--modelo') {
      if (i + 1 < argv.length) args.modelo = argv[++i];
    } else if (flag === '--via') {
      if (i + 1 < argv.length) args.via = argv[++i];
    } else if (flag === '--formato') {
      if (i + 1 < argv.length) args.formato = argv[++i];
    } else if (flag === '--tamanho') {
      if (i + 1 < argv.length) args.tamanho = argv[++i].toUpperCase();
    } else if (flag === '--ref') {
      // Repetível: um --ref por imagem, e a ordem da linha de comando é a ordem
      // em que o modelo vê. Aceita também "--ref a.png,b.png" porque é o erro
      // natural de quem já usou outra ferramenta, e falhar aqui não ajuda.
      if (i + 1 < argv.length) {
        for (const bruto of argv[++i].split(',')) {
          const nome = bruto.trim();
          if (!nome) continue;
          const arquivo = path.resolve(nome);
          if (!fs.existsSync(arquivo)) throw new Error(`--ref não encontrado: ${arquivo}`);
          const ext = path.extname(arquivo).toLowerCase();
          if (!MIME_POR_EXT[ext]) {
            throw new Error(
              `--ref com extensão não aceita: ${ext || '(sem extensão)'} em ${arquivo}. ` +
              `Use: ${Object.keys(MIME_POR_EXT).join(', ')}`
            );
          }
          args.refs.push(arquivo);
        }
      }
    } else if (flag === '--dry-run') {
      args.dryRun = true;
    } else if (flag === '--personagem') {
      // a pasta é obrigatória: sem ela, o próximo argumento (uma flag) viraria pasta
      if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) {
        throw new Error('--personagem pede a pasta do personagem: --personagem <pasta>, com prompt-base.md e referencias/ dentro.');
      }
      args.personagem = path.resolve(argv[++i]);
    } else {
      throw new Error(`Argumento desconhecido: ${flag}`);
    }
  }
  if (args.personagem) aplicarPersonagem(args);
  return args;
}

// Depois do laço, e não na flag: o --prompt e as --ref podem vir antes ou
// depois do --personagem, e o resultado tem que ser o mesmo
function aplicarPersonagem(args) {
  const pasta = args.personagem;
  const base = path.join(pasta, 'prompt-base.md');
  const dirRefs = path.join(pasta, 'referencias');
  if (!fs.existsSync(pasta)) throw new Error(`--personagem: a pasta não existe: ${paraTela(pasta)}`);
  if (!fs.existsSync(base)) throw new Error(`--personagem: falta ${paraTela(base)} (a identidade do personagem, em inglês).`);
  // ordem de NOME, e não a do sistema de arquivos: a ordem é a hierarquia, e o
  // prompt base cita "image 1, 2, 3" nela
  const canonicas = fs.existsSync(dirRefs)
    ? fs.readdirSync(dirRefs)
      .filter(nome => MIME_POR_EXT[path.extname(nome).toLowerCase()])
      .sort()
      .map(nome => path.join(dirRefs, nome))
    : [];
  if (!canonicas.length) {
    throw new Error(`--personagem: falta imagem em ${paraTela(dirRefs)} (${Object.keys(MIME_POR_EXT).join(', ')}).`);
  }
  // sem a cena, o prompt vira só a base e a geração gastaria sem pedir nada
  if (!args.prompt) throw new Error('--personagem: faltou a cena, no --prompt ou no --prompt-file.');
  args.refs = [...canonicas, ...args.refs];
  args.prompt = `${fs.readFileSync(base, 'utf8').trim()}\n\n${args.prompt}`;
}

// O motor GPT entra só aqui: quem usa o Nano não carrega o módulo, e a cópia do
// gerador que a suíte do Nano roda na bancada não tem a pasta lib
const motorGpt = () => require(path.join(RAIZ, 'scripts', 'lib', 'motor-gpt.js'));

function validar(args) {
  if (!args.prompt) throw new Error('Faltou --prompt (ou --prompt-file).');
  if (!args.saida) throw new Error('Faltou --saida (caminho do PNG de saída).');
  if (args.motor === 'gpt') return motorGpt().validarGpt(args);
  if (args.motor !== 'nano') throw new Error(`--motor inválido: ${args.motor}. Use: nano (o padrão) ou gpt.`);
  if (!MODELOS[args.modelo]) {
    throw new Error(`--modelo inválido: ${args.modelo}. Use: ${Object.keys(MODELOS).join(', ')}`);
  }
  if (args.via !== 'vertex' && args.via !== 'gemini') {
    throw new Error(`--via inválido: ${args.via}. Use: vertex ou gemini.`);
  }
  if (!CUSTO_ESTIMADO[args.modelo][args.tamanho]) {
    throw new Error(`--tamanho inválido: ${args.tamanho}. Use: 1K, 2K ou 4K.`);
  }
  const teto = MAX_REFS[args.modelo];
  if (args.refs.length > teto) {
    throw new Error(
      `${args.refs.length} referências para --modelo ${args.modelo}, e o teto é ${teto}. ` +
      `Tire as que sobram ou troque de modelo (flash e pro aceitam ${MAX_REFS.flash}).`
    );
  }
}

// ── Chamada da API ────────────────────────────────────────────

function extrairImagem(resposta) {
  const partes = resposta?.candidates?.[0]?.content?.parts ?? [];
  for (const parte of partes) {
    const dados = parte.inlineData ?? parte.inline_data;
    if (dados?.data) return Buffer.from(dados.data, 'base64');
  }
  // Sem imagem na resposta costuma ser bloqueio de política ou prompt recusado —
  // o motivo vem em finishReason/promptFeedback, então repasse em vez de sumir.
  const motivo =
    resposta?.candidates?.[0]?.finishReason ??
    resposta?.promptFeedback?.blockReason ??
    'motivo não informado';
  const texto = partes.map(p => p.text).filter(Boolean).join(' ').trim();
  throw new Error(`A API não devolveu imagem (${motivo})${texto ? `: ${texto}` : ''}`);
}

const dormir = ms => new Promise(r => setTimeout(r, ms));

async function gerar(args, alvo) {
  const corpo = JSON.stringify(montarCorpo(args));
  let ultimoErro;

  for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
    try {
      const res = await fetch(alvo.url, { method: 'POST', headers: alvo.headers, body: corpo });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = json?.error?.message ?? `HTTP ${res.status}`;
        // 4xx que não seja limite de taxa é erro de pedido: repetir não conserta.
        if (res.status !== 429 && res.status >= 400 && res.status < 500) {
          throw new Error(`${msg} (HTTP ${res.status})`);
        }
        throw Object.assign(new Error(`${msg} (HTTP ${res.status})`), { retentavel: true });
      }
      return extrairImagem(json);
    } catch (erro) {
      ultimoErro = erro;
      const podeRepetir = erro.retentavel || erro.name === 'TypeError';
      if (!podeRepetir || tentativa === TENTATIVAS) break;
      console.log(`  tentativa ${tentativa}/${TENTATIVAS} falhou (${erro.message}) — repetindo...`);
      await dormir(ESPERA_MS * tentativa);
    }
  }
  throw ultimoErro;
}

// ── Execução ──────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);
  validar(args);
  if (args.motor === 'gpt') return motorGpt().rodarGpt(args, { mimePorExt: MIME_POR_EXT, paraTela });
  carregarEnv();

  const custo = CUSTO_ESTIMADO[args.modelo][args.tamanho];
  console.log(`Modelo:  ${MODELOS[args.modelo]} (${args.modelo})`);
  console.log(`Formato: ${args.formato} @ ${args.tamanho}`);
  args.refs.forEach((arquivo, i) => {
    const rotulo = i === 0 ? 'Refs:   ' : '        ';
    console.log(`${rotulo} ${i + 1}. ${paraTela(arquivo)}`);
  });
  console.log(`Saída:   ${paraTela(args.saida)}`);
  // A estimativa é do custo de SAÍDA. Cada referência entra como token de
  // entrada e cobra por cima disso — pouco perto da imagem gerada, mas não
  // zero, e o aviso existe para o número na tela não virar promessa.
  const n = args.refs.length;
  const notaRefs = n ? ` + entrada de ${n} ${n === 1 ? 'ref' : 'refs'}` : '';
  console.log(`Custo:   ~US$ ${custo.toFixed(3)} (estimativa da saída${notaRefs})`);
  console.log(`Prompt:  ${args.prompt.slice(0, 160)}${args.prompt.length > 160 ? '…' : ''}`);

  if (args.dryRun) {
    // Resolver o alvo mesmo no dry-run valida projeto, chave e login do gcloud
    // — é o momento barato de descobrir que falta configuração.
    console.log(`Via:     ${destino(args).descricao}`);
    console.log('\n--dry-run: nada foi gerado e nada foi cobrado.');
    return;
  }

  const alvo = destino(args);
  console.log(`Via:     ${alvo.descricao}`);
  console.log('\nGerando...');
  const imagem = await gerar(args, alvo);

  fs.mkdirSync(path.dirname(args.saida), { recursive: true });
  fs.writeFileSync(args.saida, imagem);
  const kb = (imagem.length / 1024).toFixed(0);
  console.log(`OK — ${paraTela(args.saida)} (${kb} KB)`);
}

main().catch(erro => {
  console.error(`\nERRO: ${erro.message}`);
  process.exitCode = 1;
});
