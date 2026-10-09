#!/usr/bin/env node
/**
 * perfil.js — detecta as superfícies de segurança de um projeto.
 *
 * É o que torna a skill ativa: em vez de carregar o catálogo inteiro, descobre
 * o que o sistema alvo tem e devolve só as famílias que se aplicam.
 *
 * REGRAS DE SEGURANÇA DO PRÓPRIO DETECTOR (não relaxar):
 *   1. Somente leitura. Não escreve, não move, não apaga nada.
 *   2. Não executa nada do projeto alvo. Não faz require de código dele.
 *   3. Não envia nada para fora. Sem rede.
 *   4. NUNCA imprime valor de variável de ambiente. Só nome e prefixo.
 *   5. Ignora node_modules, .git, dist, build e afins.
 *
 * Uso:
 *   node perfil.js [caminho]            # texto legível
 *   node perfil.js [caminho] --json     # JSON puro
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Mapa superfície → famílias. Cobre as 34 famílias da arquitetura; as que ainda
// não têm requisito escrito aparecem assim mesmo, marcadas pelo requisitos.js.
// (o total sai de NOMES_FAMILIA — se entrar família nova, o rodapé do relatório
// acompanha sozinho; um número fixo aqui divergiria calado)
// ---------------------------------------------------------------------------
const FAMILIAS_POR_SUPERFICIE = {
  // 'sempre' carrega as famílias que independem de superfície técnica: processo,
  // governança e verificação valem para qualquer projeto que exista.
  sempre:         ['SEC', 'SUP', 'ENV', 'NET', 'PHY', 'GOV', 'RSK', 'AST',
                   'SDL', 'VER', 'VUL', 'MET'],
  auth:           ['IDN', 'SES', 'ACC', 'VAL', 'OUT', 'LOG', 'PPL', 'THR'],
  banco:          ['DAT', 'INT', 'CRY', 'ARQ'],
  banco_exposto:  ['DAT', 'INT', 'ARQ'],
  multitenant:    ['ACC', 'DAT', 'THR'],
  admin:          ['ACC', 'LOG', 'IDN', 'PPL'],
  upload:         ['FIL', 'VAL'],
  pagamento:      ['BIZ', 'CRY', 'LOG', 'RES', 'THR'],
  ia:             ['AIA', 'RES', 'TPR'],
  publico:        ['SEC', 'OUT'],
  pii:            ['CMP', 'CRY', 'DAT', 'LOG', 'BCP', 'TPR'],
  cliente_nativo: ['CLI'],
  servidor:       ['RES', 'MON', 'IRP', 'BCP', 'ARQ', 'THR'],
};

const NOMES_FAMILIA = {
  GOV: 'Governança', RSK: 'Gestão de risco', AST: 'Ativos e classificação',
  CMP: 'Conformidade', TPR: 'Terceiros', PPL: 'Pessoas', PHY: 'Segurança física',
  SDL: 'Ciclo seguro', THR: 'Modelagem de ameaça', ARQ: 'Arquitetura',
  NET: 'Rede e borda', IDN: 'Identidade', SES: 'Sessão', ACC: 'Autorização',
  VAL: 'Validação de entrada', BIZ: 'Lógica de negócio', DAT: 'Dado: acesso',
  INT: 'Dado: integridade', FIL: 'Arquivos', OUT: 'Saída e erro',
  LOG: 'Registro e trilha', SEC: 'Segredos', CRY: 'Criptografia',
  SUP: 'Cadeia de suprimento', ENV: 'Ambientes', RES: 'Resiliência',
  AIA: 'IA e agentes', CLI: 'Superfícies cliente', VER: 'Verificação',
  VUL: 'Vulnerabilidade', MON: 'Monitoramento', IRP: 'Incidente',
  BCP: 'Continuidade', MET: 'Métricas',
};

const IGNORAR = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.astro', '.nuxt', '.svelte-kit',
  'out', 'coverage', 'vendor', '__pycache__', '.venv', 'venv', 'target',
  '.cache', 'tmp', 'temp', '.turbo', '.vercel', '.output',
]);

// Sinais por superfície. Dependência é o sinal mais confiável; caminho e
// conteúdo entram como reforço.
const SINAIS = {
  auth: {
    deps: [/next-auth/, /@auth\//, /passport/, /lucia/, /@clerk\//, /auth0/,
           /firebase\/auth/, /jsonwebtoken/, /jose$/, /bcrypt/, /argon2/, /scrypt/,
           /better-auth/, /supertokens/, /@supabase\/auth/, /iron-session/,
           /express-session/, /flask-login/, /django\.contrib\.auth/, /devise/],
    caminhos: [/(^|\/)(login|signin|sign-in|entrar|auth|autenticacao)(\/|\.|$)/i,
               /(^|\/)middleware\.(t|j)s$/],
    conteudo: [/\bsignIn\b/, /\bgetSession\b/, /\bhashPassword\b/, /\bbcrypt\./],
  },
  banco: {
    deps: [/^pg$/, /^mysql2?$/, /better-sqlite3/, /^sqlite3$/, /mongodb/, /mongoose/,
           /prisma/, /drizzle-orm/, /typeorm/, /sequelize/, /^knex$/, /kysely/,
           /sqlalchemy/i, /psycopg/, /django/, /activerecord/],
    caminhos: [/(^|\/)(migrations?|prisma|schema)(\/|$)/i, /\.sql$/i,
               /(^|\/)schema\.(prisma|sql|ts)$/i],
    conteudo: [],
  },
  banco_exposto: {
    deps: [/@supabase\/supabase-js/, /^firebase$/, /firebase\/firestore/,
           /pocketbase/, /appwrite/, /nhost/],
    caminhos: [/(^|\/)supabase(\/|$)/i],
    conteudo: [/createClient\s*\(/],
  },
  multitenant: {
    deps: [],
    caminhos: [],
    conteudo: [/\btenant_?id\b/i, /\borganization_?id\b/i, /\borg_?id\b/i,
               /\bworkspace_?id\b/i, /\baccount_?id\b/i, /\bempresa_?id\b/i],
  },
  admin: {
    deps: [],
    caminhos: [/(^|\/)(admin|painel|backoffice|gestao|internal|dashboard\/admin)(\/|\.|$)/i],
    conteudo: [/["'`]admin["'`]/, /\bisAdmin\b/, /\brole\s*[:=]/],
  },
  upload: {
    deps: [/^multer$/, /formidable/, /busboy/, /@aws-sdk\/client-s3/, /^sharp$/,
           /cloudinary/, /uploadthing/, /@vercel\/blob/, /minio/],
    caminhos: [/(^|\/)(uploads?|storage|arquivos|media)(\/|$)/i],
    conteudo: [/multipart\/form-data/, /\.storage\.from\(/],
  },
  pagamento: {
    deps: [/^stripe$/, /mercadopago/, /pagarme/, /paypal/, /asaas/, /iugu/,
           /@stripe\//, /gerencianet/, /efipay/, /juno/, /cielo/],
    caminhos: [/(^|\/)(webhooks?|pagamento|checkout|billing|assinatura)(\/|\.|$)/i],
    conteudo: [/x-signature/i, /stripe-signature/i, /\bwebhook\b/i],
  },
  ia: {
    deps: [/^openai$/, /@anthropic-ai\//, /langchain/, /@google\/generative-ai/,
           /^ollama$/, /groq-sdk/, /^ai$/, /@ai-sdk\//, /llamaindex/, /cohere/],
    caminhos: [/(^|\/)(agents?|agentes?|prompts?)(\/|$)/i],
    conteudo: [/chat\.completions/, /messages\.create/, /system\s*prompt/i],
  },
  cliente_nativo: {
    deps: [/^electron$/, /react-native/, /^expo$/, /@tauri-apps\//, /capacitor/],
    caminhos: [/(^|\/)(android|ios)(\/|$)/, /pubspec\.yaml$/],
    conteudo: [],
  },
};

// Palavras que indicam dado pessoal no esquema. Só nomes de campo, nunca valores.
const SINAIS_PII = [
  /\bcpf\b/i, /\bcnpj\b/i, /\brg\b/i, /\bpassport/i, /\bssn\b/i,
  /\btelefone\b/i, /\bphone\b/i, /\bcelular\b/i, /\bwhatsapp\b/i,
  /\bendereco\b/i, /\baddress\b/i, /\bcep\b/i, /\bbirth/i, /\bnascimento\b/i,
  /\bemail\b/i, /\be_mail\b/i,
];

// ---------------------------------------------------------------------------
// Varredura
// ---------------------------------------------------------------------------

function listarArquivos(raiz, limite = 4000) {
  const encontrados = [];
  const fila = [raiz];
  while (fila.length && encontrados.length < limite) {
    const dir = fila.shift();
    let entradas;
    try { entradas = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entradas) {
      if (IGNORAR.has(e.name)) continue;
      const completo = path.join(dir, e.name);
      if (e.isDirectory()) fila.push(completo);
      else if (e.isFile()) encontrados.push(path.relative(raiz, completo).replace(/\\/g, '/'));
      if (encontrados.length >= limite) break;
    }
  }
  return encontrados;
}

function lerJson(arquivo) {
  try { return JSON.parse(fs.readFileSync(arquivo, 'utf8')); } catch { return null; }
}

function lerTexto(arquivo, maxBytes = 200_000) {
  try {
    const st = fs.statSync(arquivo);
    if (st.size > maxBytes) return '';
    return fs.readFileSync(arquivo, 'utf8');
  } catch { return ''; }
}

function coletarDependencias(raiz) {
  const deps = new Set();
  const pkg = lerJson(path.join(raiz, 'package.json'));
  if (pkg) {
    for (const campo of ['dependencies', 'devDependencies', 'peerDependencies']) {
      Object.keys(pkg[campo] || {}).forEach(d => deps.add(d));
    }
  }
  const composer = lerJson(path.join(raiz, 'composer.json'));
  if (composer) {
    Object.keys(composer.require || {}).forEach(d => deps.add(d));
    Object.keys(composer['require-dev'] || {}).forEach(d => deps.add(d));
  }
  for (const nome of ['requirements.txt', 'Gemfile', 'go.mod', 'pyproject.toml']) {
    const txt = lerTexto(path.join(raiz, nome));
    txt.split(/\r?\n/).forEach(l => {
      const m = l.match(/^\s*["']?([A-Za-z0-9_.\-/@]+)/);
      if (m && m[1]) deps.add(m[1]);
    });
  }
  return [...deps];
}

function detectarStack(raiz, deps) {
  const tem = n => deps.some(d => d === n || d.startsWith(n + '/'));
  const stacks = [];
  if (tem('next')) stacks.push('next');
  if (tem('astro')) stacks.push('astro');
  if (tem('nuxt')) stacks.push('nuxt');
  if (tem('@sveltejs/kit')) stacks.push('sveltekit');
  if (tem('vite') && !stacks.length) stacks.push('vite');
  if (tem('react') && !stacks.length) stacks.push('react');
  if (tem('vue') && !stacks.length) stacks.push('vue');
  if (tem('express') || tem('fastify') || tem('@nestjs/core') || tem('hono')) stacks.push('node-servidor');
  if (tem('@supabase/supabase-js')) stacks.push('supabase');
  if (deps.some(d => /^laravel\//.test(d))) stacks.push('laravel');
  if (deps.some(d => /^django/i.test(d))) stacks.push('django');
  if (deps.some(d => /^frappe/i.test(d)) || fs.existsSync(path.join(raiz, 'apps', 'frappe'))) stacks.push('frappe');
  if (fs.existsSync(path.join(raiz, 'astro.config.mjs')) && !stacks.includes('astro')) stacks.push('astro');
  return stacks.length ? stacks : ['indefinido'];
}

/**
 * Força da prova. Dependência declarada e caminho de rota são sinais fortes:
 * alguém instalou ou criou aquilo de propósito. Menção em conteúdo é sinal
 * fraco — a palavra "webhook" num comentário não prova que existe pagamento.
 *
 * Superfície sustentada só por sinal fraco entra como "possível" e a família é
 * ativada assim mesmo (errar para o lado de verificar é mais barato que deixar
 * passar), mas a incerteza aparece no relatório para o operador confirmar.
 */
function baterSinais(superficie, deps, arquivos, amostraConteudo) {
  const s = SINAIS[superficie];
  const provas = [];
  for (const re of s.deps) {
    const achou = deps.find(d => re.test(d));
    if (achou) provas.push({ tipo: 'dependência', valor: achou, forca: 'forte' });
  }
  for (const re of s.caminhos) {
    const achou = arquivos.find(a => re.test(a));
    if (achou) provas.push({ tipo: 'caminho', valor: achou, forca: 'forte' });
  }
  for (const re of s.conteudo) {
    const achou = amostraConteudo.find(({ texto }) => re.test(texto));
    if (achou) provas.push({ tipo: 'menção', valor: achou.arquivo, forca: 'fraca' });
  }
  if (!provas.length) return null;
  const temForte = provas.some(p => p.forca === 'forte');
  return {
    confirmada: temForte,
    provas: [...provas.filter(p => p.forca === 'forte'), ...provas.filter(p => p.forca === 'fraca')].slice(0, 3),
  };
}

function analisarEnv(raiz, arquivos) {
  // Só nomes e prefixos. NUNCA valores.
  const publicos = [];
  const privados = [];
  const arquivosEnv = arquivos.filter(a => /(^|\/)\.env($|\.)/.test(a));
  for (const rel of arquivosEnv) {
    const texto = lerTexto(path.join(raiz, rel), 50_000);
    for (const linha of texto.split(/\r?\n/)) {
      const m = linha.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=/);
      if (!m) continue;
      const nome = m[1];
      if (/^(NEXT_PUBLIC_|VITE_|PUBLIC_|REACT_APP_|GATSBY_|EXPO_PUBLIC_|NUXT_PUBLIC_)/.test(nome)) {
        publicos.push({ nome, arquivo: rel });
      } else {
        privados.push({ nome, arquivo: rel });
      }
    }
  }
  return { arquivosEnv, publicos, privados };
}

// Duas grafias de campo circulam em arquivo real: a canônica em maiúscula
// interna (id, revisarEm) e a de sublinhado (requisito, revisar_em). Ler só uma
// delas é o defeito mais perigoso desta skill inteira, e não é hipótese: a
// exceção some sem erro, `vencida` fica falso para sempre, e a auditoria
// reporta como falha o que alguém já decidiu conscientemente — que é o que a
// regra 7 do SKILL.md diz que destrói a credibilidade do relatório inteiro.
//
// Por isso aqui se lê as duas, e TODO desencontro vira aviso visível. Silêncio
// neste ponto é o defeito, não a elegância.
const CAMPOS_EXCECAO = {
  id:          ['id', 'requisito'],
  motivo:      ['motivo'],
  revisarEm:   ['revisarEm', 'revisar_em'],
  decididoEm:  ['decididoEm', 'aceito_em', 'decidido_em'],
  decididoPor: ['decididoPor', 'dono', 'decidido_por'],
  riscoAceito: ['riscoAceito', 'risco_aceito', 'severidade_original'],
};

function primeiroPresente(objeto, nomes) {
  for (const n of nomes) {
    if (objeto[n] !== undefined && objeto[n] !== null && objeto[n] !== '') return objeto[n];
  }
  return undefined;
}

function lerExcecoes(raiz) {
  const caminho = path.join(raiz, '.seguranca-excecoes.json');
  if (!fs.existsSync(caminho)) return { existe: false, itens: [], avisos: [] };
  const dados = lerJson(caminho);
  // `excecoes` é o nome do contrato; `itens` aparece em arquivo escrito à mão.
  const lista = dados && (Array.isArray(dados.excecoes) ? dados.excecoes
              : Array.isArray(dados.itens) ? dados.itens : null);
  if (!lista) {
    return { existe: true, invalido: true, itens: [], avisos: [] };
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const avisos = [];
  let usouGrafiaAlternativa = false;

  const itens = lista.map((e, i) => {
    const norm = {};
    for (const [canonico, nomes] of Object.entries(CAMPOS_EXCECAO)) {
      const valor = primeiroPresente(e, nomes);
      if (valor !== undefined) {
        norm[canonico] = valor;
        // Achou pelo nome alternativo: o arquivo funciona, mas pede correção.
        if (e[nomes[0]] === undefined) usouGrafiaAlternativa = true;
      }
    }
    const onde = norm.id || `posição ${i + 1}`;
    if (!norm.id) {
      avisos.push(`exceção sem identificador de requisito (${onde}): ela NÃO será reconhecida, e o controle vira achado`);
    }
    if (!norm.revisarEm) {
      avisos.push(`exceção ${onde} sem data de revisão: ela nunca vence, e decisão sem prazo é esquecimento com nome bonito`);
    }
    return {
      ...e,
      ...norm,
      vencida: norm.revisarEm ? norm.revisarEm < hoje : false,
      semPrazo: !norm.revisarEm,
    };
  });

  if (usouGrafiaAlternativa) {
    avisos.push('o arquivo usa nomes de campo fora do contrato (requisito/revisar_em/aceito_em). Funciona, mas o modelo em referencias/exemplo-excecoes.json usa id/revisarEm/decididoEm');
  }
  return { existe: true, itens, avisos };
}

// ---------------------------------------------------------------------------
// Principal
// ---------------------------------------------------------------------------

function perfilar(raiz) {
  const arquivos = listarArquivos(raiz);
  const deps = coletarDependencias(raiz);

  // Amostra de conteúdo: só arquivos de código e esquema, limitados.
  const candidatos = arquivos.filter(a =>
    /\.(ts|tsx|js|jsx|mjs|cjs|py|php|rb|go|sql|prisma|astro|vue|svelte|json|ya?ml)$/i.test(a)
  ).slice(0, 300);
  const amostraConteudo = candidatos.map(a => ({
    arquivo: a,
    texto: lerTexto(path.join(raiz, a)),
  }));

  const superficies = {};
  for (const nome of Object.keys(SINAIS)) {
    const r = baterSinais(nome, deps, arquivos, amostraConteudo);
    if (r) superficies[nome] = r;
  }

  const env = analisarEnv(raiz, arquivos);
  if (env.publicos.length) {
    superficies.publico = superficies.publico || { confirmada: true, provas: [] };
    superficies.publico.confirmada = true;
    superficies.publico.provas.push({
      tipo: 'variável pública', valor: `${env.publicos.length} declarada(s)`, forca: 'forte',
    });
  }

  // Dado pessoal: nomes de campo em esquema e migração.
  const arqEsquema = amostraConteudo.filter(({ arquivo }) =>
    /(migrations?|schema|prisma|models?|entities|\.sql)/i.test(arquivo));
  const provasPii = [];
  for (const re of SINAIS_PII) {
    const achou = arqEsquema.find(({ texto }) => re.test(texto));
    if (achou && provasPii.length < 3) {
      provasPii.push({ tipo: 'campo em esquema', valor: `${re.source} em ${achou.arquivo}`, forca: 'forte' });
    }
  }
  if (provasPii.length) superficies.pii = { confirmada: true, provas: provasPii };

  // Servidor: há código que roda fora do navegador?
  const rotaServidor = arquivos.find(a => /(^|\/)(api|server|routes?|controllers?|functions)(\/|$)/i.test(a));
  const temServidor = !!(superficies.banco || superficies.pagamento || superficies.ia || rotaServidor);
  if (temServidor) {
    superficies.servidor = {
      confirmada: !!rotaServidor,
      provas: [{
        tipo: rotaServidor ? 'caminho' : 'inferência',
        valor: rotaServidor || 'derivado de banco, pagamento ou modelo',
        forca: rotaServidor ? 'forte' : 'fraca',
      }],
    };
  }

  const stacks = detectarStack(raiz, deps);

  // Projeto sem conteúdo analisável não é "site estático": é ausência de dado.
  // Concluir N1 a partir de um diretório vazio seria dar por seguro o que não
  // foi examinado, que é o oposto do que a skill faz.
  const vazio = arquivos.length === 0;

  // Estático puro: sem servidor, sem banco, sem autenticação.
  const estatico = !vazio && !temServidor && !superficies.banco && !superficies.auth;
  if (estatico) {
    superficies.publico = superficies.publico ||
      { confirmada: true, provas: [{ tipo: 'inferência', valor: 'site estático', forca: 'forte' }] };
  }

  // Famílias ativas
  const ativas = new Set(FAMILIAS_POR_SUPERFICIE.sempre);
  for (const s of Object.keys(superficies)) {
    (FAMILIAS_POR_SUPERFICIE[s] || []).forEach(f => ativas.add(f));
  }

  const todas = Object.keys(NOMES_FAMILIA);
  const inativas = todas.filter(f => !ativas.has(f));

  // Nível sugerido
  let nivel = 'N1';
  let porqueNivel = 'Sem autenticação e sem dado pessoal detectado.';
  if (superficies.auth || superficies.pii) {
    nivel = 'N2';
    porqueNivel = 'Há autenticação ou dado pessoal de terceiro.';
  }
  if (superficies.pagamento || superficies.multitenant) {
    nivel = 'N3';
    porqueNivel = superficies.pagamento
      ? 'Há processamento de pagamento.'
      : 'Há mais de uma organização na mesma base.';
  }
  if (vazio) {
    nivel = 'indeterminado';
    porqueNivel = 'Nenhum arquivo analisável encontrado. Confirmar o caminho, ou informar as superfícies manualmente.';
  }

  return {
    projeto: path.resolve(raiz),
    analisadoEm: new Date().toISOString().slice(0, 10),
    vazio,
    stacks,
    arquivosVarridos: arquivos.length,
    dependenciasLidas: deps.length,
    nivelSugerido: nivel,
    porqueNivel,
    superficies,
    familiasAtivas: [...ativas].sort(),
    familiasInativas: inativas.sort(),
    variaveisAmbiente: {
      arquivos: env.arquivosEnv,
      publicas: env.publicos.map(p => p.nome),
      privadasContagem: env.privados.length,
      aviso: 'Somente nomes. Nenhum valor foi lido nem registrado.',
    },
    excecoes: lerExcecoes(raiz),
  };
}

function imprimirTexto(p) {
  const L = [];
  L.push(`PERFIL DE SEGURANÇA — ${p.projeto}`);
  L.push(`Analisado em ${p.analisadoEm} · ${p.arquivosVarridos} arquivos · ${p.dependenciasLidas} dependências`);
  L.push('');
  if (p.vazio) {
    L.push('NENHUM ARQUIVO ANALISÁVEL ENCONTRADO.');
    L.push('');
    L.push('Isto não significa que o projeto é simples ou seguro: significa que');
    L.push('não houve o que examinar. Antes de seguir:');
    L.push('  · confirmar se o caminho está correto');
    L.push('  · verificar se o conteúdo está em subdiretório ignorado pela varredura');
    L.push('  · se o sistema existe mas o código não está aqui, levantar as');
    L.push('    superfícies com o responsável, em vez de inferir do vazio');
    return L.join('\n');
  }
  L.push(`Stack: ${p.stacks.join(', ')}`);
  L.push(`Nível sugerido: ${p.nivelSugerido} — ${p.porqueNivel}`);
  L.push('');
  const chaves = Object.keys(p.superficies);
  const confirmadas = chaves.filter(s => p.superficies[s].confirmada);
  const possiveis = chaves.filter(s => !p.superficies[s].confirmada);

  L.push('SUPERFÍCIES CONFIRMADAS');
  if (!confirmadas.length) L.push('  (nenhuma além do universal)');
  for (const s of confirmadas) {
    const provas = p.superficies[s].provas.map(x => `${x.tipo}: ${x.valor}`).join(' · ');
    L.push(`  ${s.padEnd(16)} ${provas}`);
  }
  if (possiveis.length) {
    L.push('');
    L.push('POSSÍVEIS — só menção em conteúdo, confirmar antes de tratar como certo');
    for (const s of possiveis) {
      const provas = p.superficies[s].provas.map(x => `${x.tipo}: ${x.valor}`).join(' · ');
      L.push(`  ${s.padEnd(16)} ${provas}`);
    }
  }
  L.push('');
  L.push(`FAMÍLIAS ATIVAS (${p.familiasAtivas.length} de ${Object.keys(NOMES_FAMILIA).length})`);
  L.push('  ' + p.familiasAtivas.map(f => `${f} ${NOMES_FAMILIA[f] || ''}`).join(' · '));
  L.push('');
  L.push(`NÃO SE APLICA (${p.familiasInativas.length}) — é o que a skill não vai carregar`);
  L.push('  ' + p.familiasInativas.join(' · '));
  L.push('');
  if (p.variaveisAmbiente.arquivos.length) {
    L.push('VARIÁVEIS DE AMBIENTE (só nomes)');
    L.push(`  Arquivos: ${p.variaveisAmbiente.arquivos.join(', ')}`);
    L.push(`  Públicas (${p.variaveisAmbiente.publicas.length}): ${p.variaveisAmbiente.publicas.join(', ') || '—'}`);
    L.push(`  Privadas: ${p.variaveisAmbiente.privadasContagem} declarada(s)`);
    L.push('');
  }
  if (p.excecoes.existe) {
    if (p.excecoes.invalido) {
      L.push('EXCEÇÕES: arquivo presente mas em formato inválido.');
    } else {
      L.push(`EXCEÇÕES REGISTRADAS (${p.excecoes.itens.length})`);
      for (const e of p.excecoes.itens) {
        let marca = '';
        if (e.vencida) marca = '  [VENCIDA, revisar]';
        else if (e.semPrazo) marca = '  [SEM PRAZO: nunca vence]';
        L.push(`  ${e.id || '[SEM IDENTIFICADOR]'} — ${e.motivo || 'sem motivo declarado'}${marca}`);
      }
      if (p.excecoes.avisos && p.excecoes.avisos.length) {
        L.push('');
        L.push('  ⚠️ AVISOS SOBRE O ARQUIVO DE EXCEÇÕES');
        for (const a of p.excecoes.avisos) L.push(`     · ${a}`);
      }
    }
  } else {
    L.push('EXCEÇÕES: nenhum .seguranca-excecoes.json neste projeto.');
    L.push('  Sem ele, decisão consciente de não implementar um controle vira achado.');
  }
  return L.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const alvo = args.find(a => !a.startsWith('--')) || process.cwd();
  if (!fs.existsSync(alvo)) {
    console.error(`Caminho não encontrado: ${alvo}`);
    process.exit(1);
  }
  const p = perfilar(alvo);
  console.log(json ? JSON.stringify(p, null, 2) : imprimirTexto(p));
}

if (require.main === module) main();
module.exports = { perfilar, FAMILIAS_POR_SUPERFICIE, NOMES_FAMILIA };
