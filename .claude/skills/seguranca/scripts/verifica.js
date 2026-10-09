#!/usr/bin/env node
/**
 * verifica.js — o auto-teste da skill.
 *
 * POR QUE EXISTE: sem critério de pronto escrito, cada revisão aplica uma lente
 * diferente e encontra uma classe nova de defeito. Isso é retrabalho garantido.
 * Este arquivo é o critério, em código: se ele passa, está pronto; se falha,
 * ele diz o quê e onde.
 *
 * É a skill aplicando em si mesma o que ela exige dos outros: VER-02
 * (verificação automatizada a cada mudança) e SDL-02 (critério que bloqueia).
 *
 * REGRA DE MANUTENÇÃO: se aparecer um defeito que este script não pegou, a
 * correção é acrescentar a verificação aqui — não fazer outra passada manual.
 *
 * Uso:
 *   node verifica.js                 todas as dimensões
 *   node verifica.js --dimensao 4    só uma
 *   node verifica.js --silencioso    só o veredito, para automação
 *
 * Sai com código 1 se qualquer dimensão falhar.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// ---------------------------------------------------------------------------
// Nomes próprios que NÃO podem vazar para dentro desta skill. A skill serve a
// qualquer organização, então citar o dono do workspace, um cliente ou um
// agente aqui quebra a genericidade dela.
//
// A lista mora em `nomes.local.json`, ao lado do SKILL.md desta skill, e NÃO
// neste arquivo: ela é ignorada pelo git, porque nome de cliente é dado de
// terceiro e não vai para o repositório. Preencha com os nomes do SEU contexto
// (o seu, o da sua empresa, o dos seus clientes); o `/instalar` cria o arquivo
// na primeira execução.
//
//   Exemplo de nomes.local.json:  ["acme", "joana silva", "construtora norte"]
//
// Maiúscula não importa; acento importa: liste as duas grafias de um nome
// acentuado ('joão', 'joao'). Lista vazia não aprova calada: o veredito diz que
// esta dimensão não mediu nome próprio.
const NOMES_LOCAIS = path.join(__dirname, '..', 'nomes.local.json');
let ERRO_NOMES = null;
const NOMES = (() => {
  if (!fs.existsSync(NOMES_LOCAIS)) return [];
  try {
    const lista = JSON.parse(fs.readFileSync(NOMES_LOCAIS, 'utf8'));
    if (!Array.isArray(lista)) { ERRO_NOMES = 'nomes.local.json não é uma lista JSON: nenhum nome foi lido'; return []; }
    return lista.map((n) => String(n).trim()).filter(Boolean);
  } catch (e) {
    ERRO_NOMES = `nomes.local.json ilegível (${e.message}): nenhum nome foi lido`;
    return [];
  }
})();
// ⚠️ A fronteira é um lookaround Unicode, e não \b: numa string comum, '\b' vira
// o caractere de backspace e a régua não casa nada; e \b não enxerga letra
// acentuada (um nome começado por "Ó" passaria).
const escapa = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Entre as palavras de um nome vai `\s+`, e não espaço literal: o texto quebra em
// ~80 colunas, e "Padaria Pão" no fim de uma linha com "da Vila" na seguinte
// passaria.
const NOMES_PROPRIOS = NOMES.length
  ? new RegExp('(?<![\\p{L}\\p{N}])(' + NOMES.map((n) => escapa(n).replace(/\s+/g, '\\s+')).join('|') + ')(?![\\p{L}\\p{N}])', 'iu')
  : /(?!)/;   // regex que nunca casa, quando a lista está vazia

const RAIZ = path.join(__dirname, '..');
const p = (...x) => path.join(RAIZ, ...x);

// ---------------------------------------------------------------------------
// Vocabulário esperado. Mudou o esquema? Muda aqui, e o teste acompanha.
// ---------------------------------------------------------------------------
const CAMPOS_OBRIGATORIOS = [
  'id', 'titulo', 'declaracao', 'propriedade', 'nivel', 'tipo', 'natureza',
  'nivelVerificacao', 'detectores', 'porque', 'comoQuebra', 'implementacao',
  'teste', 'evidencia', 'mapeamento', 'dependeDe', 'armadilhas',
  'severidadeSeAusente',
];
// Os nomes que um container de itens de âncora pode ter em ancoras.json.
// Estava duplicado aqui e em requisitos.js, e a duplicação era perigosa: âncora
// que usasse um sétimo nome virava objeto vazio e passava MUDA — não aparecia
// no --cobertura e não reprovava em lugar nenhum. Hoje a lista mora em
// requisitos.js (que é quem lê o catálogo) e a D9 cobra que ninguém saia dela.
const { CONTAINERES_DE_ANCORA, itensDaAncora, familiasDoItem } = require('./requisitos.js');

// Onde cada chave de `mapeamento` vai buscar os valores válidos. Sem isto,
// `mapeamento` era campo obrigatório que ninguém conferia: A11 ou um assunto
// de ASVS inventado passavam batido.
const MAPEAMENTO_PARA_ANCORA = {
  top10_2021: 'top10_2021',
  top10_2025: 'top10_2025',
  top10_api: 'top10_api',
  csf: 'csf_2_0',
  ssdf: 'ssdf',
  asvs_assunto: 'asvs',
  iso_tema: 'iso_27001_2022',
};

// Âncoras cuja cobertura é por família e que por isso NÃO exigem uma chave de
// mapeamento em cada requisito. Declarar isto evita o oposto do problema:
// obrigar 193 requisitos a apontar para tudo.
const ANCORAS_SEM_MAPEAMENTO = ['samm', 'top10_llm'];

const ENUMS = {
  nivel: ['N1', 'N2', 'N3'],
  tipo: ['preventivo', 'detectivo', 'corretivo'],
  natureza: ['tecnico', 'administrativo', 'fisico'],
  severidadeSeAusente: ['critica', 'alta', 'media', 'baixa'],
  nivelVerificacao: ['A', 'B', 'C', 'D'],
};
const PROPRIEDADES = [
  'confidencialidade', 'integridade', 'disponibilidade',
  'autenticidade', 'não-repúdio',
];

/**
 * Dimensão 4 · genericidade. A lista é heurística e assume o que costuma
 * aparecer quando conteúdo de um repositório pessoal vaza para material que
 * deveria servir a qualquer organização.
 *
 * Exceções declaradas: `stacks.md` e o campo `implementacao` do catálogo
 * existem justamente para nomear tecnologia, e por isso são poupados da regra
 * de nome de produto — mas não da de caminho nem da de nome próprio.
 */
const PADROES_ESPECIFICOS = [
  { re: NOMES_PROPRIOS, o: 'nome próprio de pessoa, agente ou empresa' },
  // Fornecedor nomeado é vazamento em texto de método, e é FUNÇÃO em stacks.md
  // (que traduz por tecnologia) e nos scripts (que precisam reconhecer pastas e
  // dependências pelo nome para detectar superfície).
  { re: /\b(hostinger|coolify|vercel|netlify)\b/i, o: 'fornecedor de hospedagem nomeado',
    sóFora: ['stacks.md', 'perfil.js', 'requisitos.js'] },
  { re: /[a-z0-9-]+\.(com|com\.br|dev|io)\b/i, o: 'domínio concreto' },
  { re: /\b(projetos-pessoais|identidade-visual|site-kit)\b/, o: 'pasta de workspace' },
  { re: /(^|[^a-z])(saidas|lixeira|rascunho|clientes|_memoria)\//i, o: 'caminho de workspace' },
  { re: /\bleis\.mjs\b|\bhooks\//, o: 'arquivo de automação de ferramenta' },
  { re: /\/(sanitizacao|limpeza|salvar|prospeccao|carrossel|abrir)\b/, o: 'comando de outra skill' },
  { re: /\bCLAUDE\.md\b/, o: 'arquivo de instrução específico de uma ferramenta' },
  { re: /\b(teus?|tuas?)\b/i, o: 'segunda pessoa dirigida a alguém específico' },
];

// ---------------------------------------------------------------------------
// Infra
// ---------------------------------------------------------------------------
const falhas = [];
function falha(dim, msg, onde) {
  falhas.push({ dim, msg, onde });
}
function lerJson(rel) {
  try { return JSON.parse(fs.readFileSync(p(rel), 'utf8')); }
  catch (e) { return { __erro: e.message }; }
}
function arquivosMd() {
  return fs.readdirSync(p('referencias'))
    .filter(f => f.endsWith('.md'))
    .map(f => 'referencias/' + f)
    .concat(['SKILL.md']);
}
function rodar(script, args) {
  try {
    return { ok: true, saida: execFileSync(process.execPath, [p('scripts', script), ...args],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) };
  } catch (e) {
    return { ok: false, saida: (e.stdout || '') + (e.stderr || ''), codigo: e.status };
  }
}

// ---------------------------------------------------------------------------
// D1 · Integridade estrutural
// ---------------------------------------------------------------------------
function d1() {
  for (const j of ['dados/requisitos.json', 'dados/ancoras.json', 'referencias/exemplo-excecoes.json']) {
    const d = lerJson(j);
    if (d.__erro) return falha(1, 'JSON inválido: ' + d.__erro, j);
  }
  for (const s of ['perfil.js', 'requisitos.js', 'verifica.js']) {
    try { execFileSync(process.execPath, ['--check', p('scripts', s)], { stdio: 'pipe' }); }
    catch (e) { falha(1, 'erro de sintaxe', 'scripts/' + s); }
  }

  const c = lerJson('dados/requisitos.json');
  const vistos = new Set();
  for (const r of c.requisitos) {
    if (vistos.has(r.id)) falha(1, 'ID duplicado', r.id);
    vistos.add(r.id);

    for (const campo of CAMPOS_OBRIGATORIOS) {
      if (r[campo] === undefined || r[campo] === null) {
        falha(1, 'campo obrigatório ausente: ' + campo, r.id);
      }
    }
    // A ficha é fechada (Regra 4 de arquitetura.md): campo fora do esquema é
    // erro de grafia ou campo que ninguém lê, e os dois envelhecem calados.
    for (const campo of Object.keys(r)) {
      if (!CAMPOS_OBRIGATORIOS.includes(campo)) {
        falha(1, 'campo fora do esquema da ficha: ' + campo, r.id);
      }
    }
    for (const [campo, valores] of Object.entries(ENUMS)) {
      if (r[campo] !== undefined && !valores.includes(r[campo])) {
        falha(1, `valor inválido em ${campo}: "${r[campo]}"`, r.id);
      }
    }
    (r.propriedade || []).forEach(prop => {
      if (!PROPRIEDADES.includes(prop)) falha(1, 'propriedade desconhecida: ' + prop, r.id);
    });
    if (!Array.isArray(r.detectores) || !r.detectores.length) {
      falha(1, 'sem detector: o requisito nunca seria selecionado', r.id);
    }
  }
}

// ---------------------------------------------------------------------------
// D2 · Coerência interna
// ---------------------------------------------------------------------------
function d2() {
  const c = lerJson('dados/requisitos.json');
  const ids = new Set(c.requisitos.map(r => r.id));

  c.requisitos.forEach(r => (r.dependeDe || []).forEach(d => {
    if (!ids.has(d)) falha(2, 'depende de ID inexistente: ' + d, r.id);
  }));

  const skill = fs.readFileSync(p('SKILL.md'), 'utf8');
  for (const f of arquivosMd()) {
    const txt = fs.readFileSync(p(f), 'utf8');
    [...new Set([...txt.matchAll(/\b[A-Z]{3}-\d{2}\b/g)].map(m => m[0]))]
      .filter(i => !ids.has(i))
      .forEach(i => falha(2, 'cita ID que não existe no catálogo: ' + i, f));
  }

  [...new Set([...skill.matchAll(/referencias\/[a-z-]+\.(md|json)/g)].map(m => m[0]))]
    .forEach(r => { if (!fs.existsSync(p(r))) falha(2, 'SKILL.md cita arquivo inexistente: ' + r, 'SKILL.md'); });

  arquivosMd().filter(f => f.startsWith('referencias/')).forEach(f => {
    if (!skill.includes(f)) falha(2, 'arquivo órfão: existe e não é citado no SKILL.md', f);
  });

  const { NOMES_FAMILIA, FAMILIAS_POR_SUPERFICIE } = require(p('scripts', 'perfil.js'));
  const noCat = new Set(c.requisitos.map(r => r.id.split('-')[0]));
  const noDet = new Set(Object.keys(NOMES_FAMILIA));
  [...noCat].filter(f => !noDet.has(f)).forEach(f => falha(2, 'família no catálogo e ausente no detector: ' + f, 'scripts/perfil.js'));
  [...noDet].filter(f => !noCat.has(f)).forEach(f => falha(2, 'família no detector e sem requisito: ' + f, 'dados/requisitos.json'));

  const ativaveis = new Set(Object.values(FAMILIAS_POR_SUPERFICIE).flat());
  [...noCat].filter(f => !ativaveis.has(f))
    .forEach(f => falha(2, 'família inalcançável: nenhuma superfície a ativa, então seus requisitos nunca aparecem', f));

  // O vocabulário de detectores tem três donos — o catálogo que usa, o meta que
  // declara e o perfil que produz — e precisa ser a mesma lista nos três. A
  // divergência é MUDA: requisito com detector que o perfil nunca emite
  // simplesmente nunca aparece, e nada reclama (dois detectores usados por 42
  // requisitos e ausentes do meta já passaram assim).
  const detUsados = new Set(c.requisitos.flatMap(r => r.detectores || []));
  const detDeclarados = new Set(Object.keys(c.meta.detectores || {}));
  const detDoPerfil = new Set(Object.keys(FAMILIAS_POR_SUPERFICIE));
  [...detUsados].filter(d => !detDeclarados.has(d)).sort()
    .forEach(d => falha(2, 'detector usado e não declarado em meta.detectores: ' + d, 'dados/requisitos.json'));
  [...detDeclarados].filter(d => !detUsados.has(d)).sort()
    .forEach(d => falha(2, 'detector declarado em meta.detectores e sem nenhum requisito: ' + d, 'dados/requisitos.json'));
  [...detUsados].filter(d => !detDoPerfil.has(d)).sort()
    .forEach(d => falha(2, 'detector que o perfil nunca produz: os requisitos dele nunca seriam selecionados: ' + d, 'scripts/perfil.js'));

  // meta.familias é lista de apoio e envelhece calada, porque nada no fluxo de
  // operação a lê. Mesmo motivo do bloco acima.
  const famDeclaradas = new Set(c.meta.familias || []);
  [...noCat].filter(f => !famDeclaradas.has(f)).sort()
    .forEach(f => falha(2, 'família com requisito e ausente em meta.familias: ' + f, 'dados/requisitos.json'));
  [...famDeclaradas].filter(f => !noCat.has(f)).sort()
    .forEach(f => falha(2, 'família em meta.familias e sem nenhum requisito: ' + f, 'dados/requisitos.json'));

  // Toda propriedade declarada precisa ter ao menos uma família que a proteja
  const protegidas = new Set(c.requisitos.flatMap(r => r.propriedade));
  PROPRIEDADES.filter(x => !protegidas.has(x))
    .forEach(x => falha(2, 'propriedade sem nenhum requisito que a proteja: ' + x, 'dados/requisitos.json'));

  // O mapa de eixos do SKILL.md é a única lista de famílias escrita à mão que
  // sobrou, e existe porque agrupar por eixo é julgamento, não dado. Lista
  // manual envelhece calada: família nova entra no catálogo, o detector aceita,
  // o verificador aprova, e o índice que a pessoa lê primeiro fica incompleto.
  const secao = skill.split('## O que esta skill cobre')[1];
  if (!secao) {
    falha(2, 'o SKILL.md perdeu a seção "O que esta skill cobre", que é o índice das famílias', 'SKILL.md');
  } else {
    const eixos = secao.split(/\n## /)[0];
    [...noCat].sort().filter(f => !new RegExp('`' + f + '`').test(eixos))
      .forEach(f => falha(2, 'família ausente do mapa de eixos do SKILL.md: ' + f, 'SKILL.md'));
  }
}

// ---------------------------------------------------------------------------
// D3 · Números conferem com a realidade
// ---------------------------------------------------------------------------
function d3() {
  const c = lerJson('dados/requisitos.json');
  const reqReal = c.requisitos.length;
  const famReal = new Set(c.requisitos.map(r => r.id.split('-')[0])).size;

  for (const f of arquivosMd()) {
    const linhas = fs.readFileSync(p(f), 'utf8').split(/\r?\n/);
    linhas.forEach((linha, i) => {
      // Ignora linha marcada como registro histórico do processo de decisão
      if (/\[hist\]/.test(linha)) return;
      let m;
      const reReq = /(\d+)\s+requisitos/g;
      while ((m = reReq.exec(linha))) {
        const n = Number(m[1]);
        // Números pequenos são contagens locais (por família, por perfil), não o total
        if (n > 120 && n !== reqReal) {
          falha(3, `diz "${n} requisitos"; o real é ${reqReal}`, `${f}:${i + 1}`);
        }
      }
      const reFam = /(\d+)\s+fam[íi]lias/g;
      while ((m = reFam.exec(linha))) {
        const n = Number(m[1]);
        if (n > 25 && n !== famReal) {
          falha(3, `diz "${n} famílias"; o real é ${famReal}`, `${f}:${i + 1}`);
        }
      }
    });
  }

  if (c.meta.total !== undefined && c.meta.total !== reqReal) {
    falha(3, `meta.total diz ${c.meta.total}; o real é ${reqReal}`, 'dados/requisitos.json');
  }
}

// ---------------------------------------------------------------------------
// D4 · Genericidade
// ---------------------------------------------------------------------------
function d4() {
  // A régua de nome próprio não pode passar calada: lista ilegível reprova, lista
  // vazia avisa, e a regex montada tem de casar o próprio primeiro nome.
  if (ERRO_NOMES) falha(4, ERRO_NOMES, 'nomes.local.json');
  if (!NOMES.length) console.log('  nota    D4 · nomes.local.json vazio ou ausente: nome próprio NÃO foi verificado');
  else if (!NOMES_PROPRIOS.test(` ${NOMES[0].toUpperCase()} `)) {
    falha(4, 'a régua de nomes não casa o primeiro nome da própria lista: a regex está quebrada', 'scripts/verifica.js');
  }
  const alvos = arquivosMd().concat(['scripts/perfil.js', 'scripts/requisitos.js']);
  for (const f of alvos) {
    const base = path.basename(f);
    const linhas = fs.readFileSync(p(f), 'utf8').split(/\r?\n/);
    linhas.forEach((linha, i) => {
      if (/\[permitido\]/.test(linha)) return;
      for (const pad of PADROES_ESPECIFICOS) {
        if (pad.sóFora && pad.sóFora.includes(base)) continue;
        const m = linha.match(pad.re);
        if (m) falha(4, `${pad.o}: "${m[0]}"`, `${f}:${i + 1}`);
      }
    });
    // Linha a linha, um nome quebrado entre duas linhas nunca casa. Esta passada
    // olha o texto inteiro e acusa só as ocorrências que atravessam a quebra.
    if (NOMES.length) {
      const inteiro = linhas.join('\n');
      for (const m of inteiro.matchAll(new RegExp(NOMES_PROPRIOS.source, 'giu'))) {
        if (!m[0].includes('\n')) continue;
        const linha = inteiro.slice(0, m.index).split('\n').length;
        falha(4, `nome próprio quebrado entre duas linhas: "${m[0].replace(/\s+/g, ' ')}"`, `${f}:${linha}`);
      }
    }
  }

  // O catálogo: nome de tecnologia só é permitido dentro de `implementacao`
  const c = lerJson('dados/requisitos.json');
  c.requisitos.forEach(r => {
    const semImpl = { ...r }; delete semImpl.implementacao;
    const txt = JSON.stringify(semImpl);
    for (const pad of PADROES_ESPECIFICOS) {
      const m = txt.match(pad.re);
      if (m) falha(4, `${pad.o} fora do campo implementacao: "${m[0]}"`, r.id);
    }
  });
}

// ---------------------------------------------------------------------------
// D5 · Completude normativa
// ---------------------------------------------------------------------------
function d5() {
  const r = rodar('requisitos.js', ['--cobertura']);
  if (!r.ok) return falha(5, 'o comando --cobertura falhou', 'scripts/requisitos.js');
  if (!/Nenhum item de âncora sem cobertura/.test(r.saida)) {
    const m = r.saida.match(/ITENS DE ÂNCORA SEM NENHUMA FAMÍLIA COBERTA \((\d+)\)/);
    falha(5, `há ${m ? m[1] : '?'} itens de âncora sem cobertura`, 'dados/requisitos.json');
  }

  // Verificação estrita. A checagem acima é generosa: um item de âncora que
  // prevê cinco famílias continua "coberto" com apenas uma, e remover uma
  // família inteira passaria despercebido. Aqui, toda família prevista em
  // qualquer âncora precisa ter ao menos um requisito.
  const a = lerJson('dados/ancoras.json');
  const c = lerJson('dados/requisitos.json');
  const comRequisito = new Set(c.requisitos.map(x => x.id.split('-')[0]));
  const previstas = new Set();
  for (const [padrao, dados] of Object.entries(a)) {
    if (padrao === 'meta') continue;
    for (const valor of Object.values(itensDaAncora(dados))) {
      familiasDoItem(valor).forEach(f => previstas.add(f));
    }
  }
  [...previstas].filter(f => !comRequisito.has(f)).sort()
    .forEach(f => falha(5, `família prevista nas âncoras e sem nenhum requisito: ${f}`, 'dados/requisitos.json'));

  if (!Array.isArray(a.meta?.pendencias_de_verificacao) || !a.meta.pendencias_de_verificacao.length) {
    falha(5, 'as pendências de verificação sumiram: o que não foi conferido precisa continuar declarado', 'dados/ancoras.json');
  }
}

// ---------------------------------------------------------------------------
// D6 · Qualidade do conteúdo
// ---------------------------------------------------------------------------
function d6() {
  const c = lerJson('dados/requisitos.json');
  // Lista ampla de propósito: o teste precisa começar com uma ação executável.
  // Ampliada quando o verificador acusou falso positivo em testes que estavam
  // corretos — a heurística estava estreita, não o conteúdo.
  const VERBOS = /\b(conferir|confirmar|verificar|listar|buscar|procurar|tentar|enviar|abrir|rodar|executar|medir|comparar|inspecionar|chamar|requisitar|criar|usar|analisar|percorrer|decodificar|reenviar|disparar|aplicar|simular|forçar|obter|substituir|errar|ler|desligar|escolher|inserir|solicitar|interceptar|concluir|emitir|remover|restaurar|revogar|capturar|registrar|mapear|apontar|repetir|acessar|baixar|gerar|autenticar|marcar|rebaixar|promover|instalar|montar|entrar|sair|imprimir|extrair|perguntar)\b/i;
  const GENERICAS = /^(resultado|saída|o resultado|a saída)( dos| das| do| da)?( testes| tentativas| cenários| dois| três)?\.?$/i;

  c.requisitos.forEach(r => {
    if (!r.teste || r.teste.trim().length < 25) {
      falha(6, 'teste ausente ou curto demais para ser executável', r.id);
    } else if (!VERBOS.test(r.teste)) {
      falha(6, 'teste sem verbo de ação: não diz o que fazer', r.id);
    }
    if (!r.evidencia || r.evidencia.trim().length < 30 || GENERICAS.test(r.evidencia.trim())) {
      falha(6, 'evidência genérica: não diz o que guardar como prova', r.id);
    }
    if (r.severidadeSeAusente === 'critica' && (!r.armadilhas || !r.armadilhas.length)) {
      falha(6, 'requisito crítico sem armadilha declarada', r.id);
    }
    ['titulo', 'declaracao', 'porque', 'comoQuebra'].forEach(k => {
      if (!r[k] || !String(r[k]).trim()) falha(6, 'campo vazio: ' + k, r.id);
    });
    if (!r.implementacao || !Object.keys(r.implementacao).length) {
      falha(6, 'sem orientação de implementação', r.id);
    }
  });
}

// ---------------------------------------------------------------------------
// D7 · Comportamento funcional
// ---------------------------------------------------------------------------
function d7() {
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'verif-seg-'));
  const limpar = [];
  try {
    // (a) projeto rico
    const rico = path.join(tmp, 'rico');
    fs.mkdirSync(rico, { recursive: true });
    fs.writeFileSync(path.join(rico, 'package.json'), JSON.stringify({
      dependencies: { next: '15', 'next-auth': '5', '@supabase/supabase-js': '2', stripe: '17' },
    }));
    fs.writeFileSync(path.join(rico, '.env.example'), 'NEXT_PUBLIC_URL=\nSECRET_KEY=\n');
    fs.writeFileSync(path.join(rico, '.seguranca-excecoes.json'), JSON.stringify({
      excecoes: [
        { id: 'DAT-01', motivo: 'x', revisarEm: '2099-01-01' },
        { id: 'SEC-06', motivo: 'y', revisarEm: '2000-01-01' },
      ],
    }));
    // (a2) projeto com exceções na OUTRA grafia de campo, e uma sem prazo.
    // Defeito real: arquivo com requisito/revisar_em e leitor procurando
    // id/revisarEm fazem as exceções sumirem sem erro nenhum — a auditoria
    // voltaria a reportar o que já tinha sido decidido.
    const alt = path.join(tmp, 'grafia-alternativa');
    fs.mkdirSync(alt, { recursive: true });
    fs.writeFileSync(path.join(alt, 'package.json'), JSON.stringify({
      dependencies: { next: '15', 'next-auth': '5', pg: '8' },
    }));
    fs.writeFileSync(path.join(alt, '.seguranca-excecoes.json'), JSON.stringify({
      excecoes: [
        { requisito: 'DAT-01', motivo: 'x', revisar_em: '2000-01-01', dono: 'z' },
        { requisito: 'SEC-06', motivo: 'y' },
      ],
    }));

    // (b) estático
    const est = path.join(tmp, 'estatico');
    fs.mkdirSync(est, { recursive: true });
    fs.writeFileSync(path.join(est, 'index.html'), '<h1>ok</h1>');
    // (c) vazio
    const vazio = path.join(tmp, 'vazio');
    fs.mkdirSync(vazio, { recursive: true });

    const pRico = rodar('perfil.js', [rico, '--json']);
    const pEst = rodar('perfil.js', [est, '--json']);
    const pVazio = rodar('perfil.js', [vazio]);
    const pInex = rodar('perfil.js', [path.join(tmp, 'nao-existe')]);

    if (!pRico.ok) falha(7, 'perfil.js falhou em projeto rico', 'scripts/perfil.js');
    if (!pEst.ok) falha(7, 'perfil.js falhou em projeto estático', 'scripts/perfil.js');
    if (pInex.ok) falha(7, 'perfil.js deveria recusar caminho inexistente', 'scripts/perfil.js');
    if (!/NENHUM ARQUIVO ANALISÁVEL/.test(pVazio.saida)) {
      falha(7, 'projeto vazio deveria avisar que não houve o que examinar, não inferir nível', 'scripts/perfil.js');
    }

    if (pRico.ok && pEst.ok) {
      const jr = path.join(tmp, 'pr.json'); fs.writeFileSync(jr, pRico.saida); limpar.push(jr);
      const je = path.join(tmp, 'pe.json'); fs.writeFileSync(je, pEst.saida); limpar.push(je);

      const nRico = JSON.parse(rodar('requisitos.js', ['--perfil', jr, '--json']).saida).length;
      const nEst = JSON.parse(rodar('requisitos.js', ['--perfil', je, '--json']).saida).length;
      if (!(nRico > nEst)) {
        falha(7, `economia não acontece: rico=${nRico}, estático=${nEst}. O detector não está filtrando`, 'scripts/perfil.js');
      }

      const comExc = rodar('requisitos.js', ['--perfil', jr]).saida;
      if (!/DAT-01.*\[exceção aceita\]/.test(comExc)) {
        falha(7, 'exceção válida não foi marcada como aceita', 'scripts/requisitos.js');
      }
      if (!/SEC-06.*\[EXCEÇÃO VENCIDA\]/.test(comExc)) {
        falha(7, 'exceção vencida não voltou a ser achado', 'scripts/requisitos.js');
      }
    }

    // A grafia alternativa precisa ser reconhecida, e o que falta precisa
    // aparecer. As três checagens abaixo são o defeito real virado teste.
    const pAlt = rodar('perfil.js', [alt]);
    if (!/DAT-01/.test(pAlt.saida)) {
      falha(7, 'exceção escrita com `requisito` em vez de `id` não foi reconhecida: ela sumiria da auditoria sem erro', 'scripts/perfil.js');
    }
    if (!/DAT-01.*\[VENCIDA/.test(pAlt.saida)) {
      falha(7, 'exceção com `revisar_em` vencido não foi marcada: a trava de prazo não dispara nessa grafia', 'scripts/perfil.js');
    }
    if (!/SEC-06.*\[SEM PRAZO/.test(pAlt.saida)) {
      falha(7, 'exceção sem data de revisão passou calada: decisão sem prazo nunca vence', 'scripts/perfil.js');
    }
    if (!/AVISOS SOBRE O ARQUIVO DE EXCEÇÕES/.test(pAlt.saida)) {
      falha(7, 'o perfil não avisou que o arquivo de exceções usa nomes fora do contrato', 'scripts/perfil.js');
    }
    const pAltJson = rodar('perfil.js', [alt, '--json']);
    if (pAltJson.ok) {
      const jAlt = path.join(tmp, 'palt.json'); fs.writeFileSync(jAlt, pAltJson.saida); limpar.push(jAlt);
      const rAlt = rodar('requisitos.js', ['--perfil', jAlt]).saida;
      if (!/DAT-01.*\[EXCEÇÃO VENCIDA\]/.test(rAlt)) {
        falha(7, 'a exceção da grafia alternativa não chegou ao catálogo: perfil e consulta discordam', 'scripts/requisitos.js');
      }
    }

    const semPerfil = rodar('requisitos.js', ['--plano']);
    if (!/depende do perfil/.test(semPerfil.saida)) {
      falha(7, '--plano sem perfil deveria recusar e orientar', 'scripts/requisitos.js');
    }
    const idMau = rodar('requisitos.js', ['--id', 'ZZZ-99']);
    if (idMau.ok) falha(7, '--id inexistente deveria sair com erro', 'scripts/requisitos.js');
    for (const args of [['--resumo'], ['--familias'], ['--familia', 'ACC'],
                        ['--severidade', 'critica'], ['--verificacao', 'A']]) {
      if (!rodar('requisitos.js', args).ok) falha(7, 'filtro falhou: ' + args.join(' '), 'scripts/requisitos.js');
    }

    // O mapa é a resposta para "o que esta skill cobre". Ele existe justamente
    // para não haver lista escrita à mão, então precisa sair completo: família
    // que some do mapa some da resposta, e ninguém repara.
    const mapa = rodar('requisitos.js', ['--familias']);
    if (mapa.ok) {
      const cat = lerJson('dados/requisitos.json');
      const fams = [...new Set(cat.requisitos.map(r => r.id.split('-')[0]))].sort();
      fams.filter(f => !new RegExp('^' + f + '\\s', 'm').test(mapa.saida))
        .forEach(f => falha(7, 'família ausente do mapa de --familias: ' + f, 'scripts/requisitos.js'));
      if (!/ATIVA POR/.test(mapa.saida)) {
        falha(7, 'o mapa perdeu a coluna que diz qual superfície ativa cada família', 'scripts/requisitos.js');
      }
    }
  } finally {
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
  }
}

// ---------------------------------------------------------------------------
// D8 · Segurança da própria skill
// ---------------------------------------------------------------------------
// Duas classes de script, e cada uma tem o seu contrato:
//
//   CONSULTA (perfil.js, requisitos.js) — leem e imprimem. Não escrevem, não
//   executam processo, não acessam rede. Escrita aqui seria efeito colateral
//   num script que a skill roda contra projeto de terceiro.
//
//   SAÍDA (relatorio.js) — escreve, e é a função dele. Continua proibido de
//   executar processo e de acessar rede, e só pode gravar no caminho recebido.
//
// Sem a distinção, o gerador de relatório ficaria sem vigilância nenhuma, com a
// D8 olhando só os dois de consulta.
function d8() {
  const proibido = [
    { re: /\bfs\.(writeFile|appendFile|mkdir|rm|unlink|rename|copyFile)/, o: 'escrita no sistema de arquivos' },
    { re: /\b(exec|execSync|spawn|spawnSync|execFile)\s*\(/, o: 'execução de processo' },
    { re: /\b(fetch|https?\.(get|request)|XMLHttpRequest)\s*\(/, o: 'chamada de rede' },
  ];

  // --- classe SAÍDA ---
  const saida = 'relatorio.js';
  if (!fs.existsSync(p('scripts', saida))) {
    falha(8, 'o gerador de relatório sumiu: a skill perdeu a etapa de entregar', 'scripts/' + saida);
  } else {
    const linhas = fs.readFileSync(p('scripts', saida), 'utf8').split(/\r?\n/);
    const proibidoNaSaida = proibido.filter(x => !/escrita no sistema/.test(x.o));
    linhas.forEach((linha, i) => {
      if (/^\s*(\/\/|\*)/.test(linha)) return;
      proibidoNaSaida.forEach(x => {
        if (x.re.test(linha)) falha(8, `${x.o} num script de saída, que só pode escrever`, `scripts/${saida}:${i + 1}`);
      });
    });
    const src = fs.readFileSync(p('scripts', saida), 'utf8');
    // A trava de segredo é a razão de o script existir com opinião própria.
    // Se ela sair, o relatório volta a poder transcrever credencial.
    if (!/PADROES_DE_SEGREDO/.test(src) || !/varrerSegredo/.test(src)) {
      falha(8, 'o gerador perdeu a varredura de segredo: o relatório voltaria a poder transcrever credencial', 'scripts/' + saida);
    }
    if (!/Nada foi gravado|nada foi gravado/.test(src)) {
      falha(8, 'o gerador não declara mais que aborta sem gravar ao encontrar credencial', 'scripts/' + saida);
    }
    // Escrita: só a do destino calculado. Duas ocorrências de writeFileSync
    // seria sinal de que algo mais está sendo gravado por fora.
    const escritas = (src.match(/fs\.writeFileSync\s*\(/g) || []).length;
    if (escritas !== 1) {
      falha(8, `o gerador grava em ${escritas} lugar(es); deve gravar só no caminho recebido`, 'scripts/' + saida);
    }
  }

  // --- classe CONSULTA ---
  for (const s of ['perfil.js', 'requisitos.js']) {
    const linhas = fs.readFileSync(p('scripts', s), 'utf8').split(/\r?\n/);
    linhas.forEach((linha, i) => {
      if (/^\s*(\/\/|\*)/.test(linha)) return;
      proibido.forEach(x => {
        if (x.re.test(linha)) falha(8, `${x.o} num script que deve ser somente leitura`, `scripts/${s}:${i + 1}`);
      });
    });
  }
  const perfilSrc = fs.readFileSync(p('scripts', 'perfil.js'), 'utf8');
  if (!/nome e prefixo|Somente nomes|NUNCA imprime valor/i.test(perfilSrc)) {
    falha(8, 'perfil.js não declara a regra de nunca imprimir valor de variável de ambiente', 'scripts/perfil.js');
  }
  if (/publicos\.push\([^)]*valor/.test(perfilSrc)) {
    falha(8, 'perfil.js parece registrar valor de variável de ambiente', 'scripts/perfil.js');
  }
}

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// D9 · Âncoras e mapeamento
// ---------------------------------------------------------------------------
// Pega três defeitos que convivem em silêncio, todos do mesmo tipo — o que
// ninguém confere, envelhece calado:
//   1. o texto diz uma contagem de âncoras e existem outras tantas
//   2. `mapeamento` é campo obrigatório: sem validar, valor inventado passa
//      batido, e âncora fica sem chave em requisito nenhum
//   3. âncora com container de nome errado vira {} e não reprova
function d9() {
  const a = lerJson('dados/ancoras.json');
  const c = lerJson('dados/requisitos.json');
  if (a.__erro || c.__erro) return;

  const nomes = Object.keys(a).filter(k => k !== 'meta');
  const nAncoras = nomes.length;

  // (a) Container reconhecido. Sem isto, âncora nova pode entrar e não valer
  // nada, sem uma linha de aviso.
  for (const nome of nomes) {
    const usados = CONTAINERES_DE_ANCORA.filter(k => a[nome][k]);
    if (!usados.length) {
      falha(9, `âncora sem container de itens reconhecido (esperado um de: ${CONTAINERES_DE_ANCORA.join(', ')}): ela seria ignorada em silêncio`, `dados/ancoras.json:${nome}`);
    } else if (usados.length > 1) {
      falha(9, `âncora com mais de um container (${usados.join(', ')}): só o primeiro seria lido`, `dados/ancoras.json:${nome}`);
    }
    if (!Object.keys(itensDaAncora(a[nome])).length) {
      falha(9, 'âncora sem nenhum item', `dados/ancoras.json:${nome}`);
    }
  }

  // (b) Contagem de âncoras citada em texto confere com a realidade. É a mesma
  // ideia da D3, aplicada à régua que ela não cobria.
  const CARDINAL = {
    dois: 2, tres: 3, três: 3, quatro: 4, cinco: 5, seis: 6, sete: 7,
    oito: 8, nove: 9, dez: 10, onze: 11, doze: 12,
  };
  // Pega as três formas em que a contagem aparece no texto: "sete âncoras",
  // "Sete padrões." e "7 padrões normativos". A terceira é a que mais escapa:
  // cada arquivo a escreve com uma redação diferente.
  const reAncora = new RegExp(`\\b(\\d+|${Object.keys(CARDINAL).join('|')})\\s+(âncoras?|ancoras?|padrões|padroes)\\b`, 'gi');
  for (const f of arquivosMd()) {
    const linhas = fs.readFileSync(p(f), 'utf8').split(/\r?\n/);
    linhas.forEach((linha, i) => {
      if (/\[hist\]/.test(linha)) return;
      let m;
      while ((m = reAncora.exec(linha))) {
        const bruto = m[1].toLowerCase();
        const n = CARDINAL[bruto] !== undefined ? CARDINAL[bruto] : Number(bruto);
        if (n !== nAncoras) {
          falha(9, `diz "${m[0]}"; existem ${nAncoras} em ancoras.json`, `${f}:${i + 1}`);
        }
      }
    });
  }

  // (c) O campo `mapeamento`: chave declarada, e valor existente na âncora.
  const validos = {};
  for (const [chave, ancora] of Object.entries(MAPEAMENTO_PARA_ANCORA)) {
    if (a[ancora]) validos[chave] = new Set(Object.keys(itensDaAncora(a[ancora])));
  }
  const chavesVistas = new Set();
  c.requisitos.forEach(r => {
    for (const [chave, valor] of Object.entries(r.mapeamento || {})) {
      chavesVistas.add(chave);
      if (!MAPEAMENTO_PARA_ANCORA[chave]) {
        falha(9, `chave de mapeamento não declarada: ${chave}`, r.id);
        continue;
      }
      if (!validos[chave]) {
        falha(9, `mapeamento aponta para âncora que não existe: ${chave} -> ${MAPEAMENTO_PARA_ANCORA[chave]}`, r.id);
        continue;
      }
      if (!validos[chave].has(String(valor))) {
        falha(9, `valor de mapeamento inexistente na âncora: ${chave}=${valor}`, r.id);
      }
    }
  });

  // (d) Toda âncora ou é mapeada por item, ou é declarada como cobertura por
  // família. O que não é nem um nem outro é âncora esquecida.
  const mapeadas = new Set(Object.values(MAPEAMENTO_PARA_ANCORA));
  for (const nome of nomes) {
    if (!mapeadas.has(nome) && !ANCORAS_SEM_MAPEAMENTO.includes(nome)) {
      falha(9, `âncora sem chave de mapeamento e não declarada em ANCORAS_SEM_MAPEAMENTO: ninguém sabe se foi esquecida`, `dados/ancoras.json:${nome}`);
    }
  }
  for (const chave of Object.keys(MAPEAMENTO_PARA_ANCORA)) {
    if (a[MAPEAMENTO_PARA_ANCORA[chave]] && !chavesVistas.has(chave)) {
      falha(9, `chave de mapeamento declarada e nunca usada por nenhum requisito: ${chave}`, 'dados/requisitos.json');
    }
  }
}

// ---------------------------------------------------------------------------
// D10 · A régua interna: os dez princípios
// ---------------------------------------------------------------------------
// Sem esta dimensão, um princípio pode ficar implementado pela metade — prometer
// "quando quebra, fecha" sem um requisito só cobrando isso — e passar
// despercebido: medindo só as cinco propriedades e as âncoras, os dez
// princípios ficariam de fora, apesar de serem a régua mais funda das três.
function d10() {
  const pr = lerJson('dados/principios.json');
  const c = lerJson('dados/requisitos.json');
  if (pr.__erro || c.__erro) return falha(10, 'não foi possível ler principios.json', 'dados/principios.json');

  const existentes = new Set(c.requisitos.map(r => r.id));
  const decl = pr.principios || {};
  const nomes = Object.keys(decl);

  // (a) A contagem confere com a fundação, que é onde os princípios moram.
  const fund = fs.readFileSync(p('referencias', 'fundacao.md'), 'utf8');
  const mTitulo = fund.match(/##\s*2\s*·\s*Os\s+(\w+)\s+princípios/i);
  const CARDINAL = { oito: 8, nove: 9, dez: 10, onze: 11, doze: 12 };
  if (mTitulo) {
    const esperado = CARDINAL[mTitulo[1].toLowerCase()] || Number(mTitulo[1]);
    if (esperado && esperado !== nomes.length) {
      falha(10, `a fundação declara ${esperado} princípios e principios.json tem ${nomes.length}`, 'dados/principios.json');
    }
  }
  // Cada linha numerada da tabela DOS PRINCÍPIOS precisa ter par no arquivo.
  // A contagem se faz só dentro daquela seção: a fundação tem outras tabelas
  // numeradas, e varrer o arquivo inteiro soma o que não é princípio.
  const secao = fund.split(/##\s*2\s*·\s*Os\s+\w+\s+princípios/i)[1];
  if (!secao) {
    falha(10, 'a fundação perdeu a seção dos princípios: a régua interna ficou sem fonte', 'referencias/fundacao.md');
  } else {
    const naFundacao = (secao.split(/\n##\s/)[0].match(/^\|\s*\*\*(\d+)\*\*\s*\|/gm) || []).length;
    if (naFundacao && naFundacao !== nomes.length) {
      falha(10, `a tabela dos princípios lista ${naFundacao} e principios.json tem ${nomes.length}`, 'referencias/fundacao.md');
    }
  }

  // (b) Nenhum princípio órfão. É a checagem que apanha um princípio
  // implementado pela metade no dia em que ele é escrito.
  for (const [chave, dados] of Object.entries(decl)) {
    const ids = dados.requisitos || [];
    if (!ids.length) {
      falha(10, `princípio declarado e sem nenhum requisito que o sustente: ${chave}`, 'dados/principios.json');
    }
    ids.forEach(id => {
      if (!existentes.has(id)) {
        falha(10, `princípio ${chave} aponta para requisito inexistente: ${id}`, 'dados/principios.json');
      }
    });
    const repetidos = ids.filter((x, i) => ids.indexOf(x) !== i);
    if (repetidos.length) {
      falha(10, `princípio ${chave} repete requisito: ${[...new Set(repetidos)].join(', ')}`, 'dados/principios.json');
    }
  }

  // (c) O arquivo precisa continuar declarando POR QUE existe. Sem isso, a
  // próxima pessoa lê como taxonomia e o transforma em burocracia.
  if (!pr.meta || !pr.meta.por_que_existe) {
    falha(10, 'principios.json perdeu a declaração de por que existe: sem ela, a régua vira classificação', 'dados/principios.json');
  }
}

const DIMENSOES = [
  [1, 'Integridade estrutural', d1],
  [2, 'Coerência interna', d2],
  [3, 'Números conferem com a realidade', d3],
  [4, 'Genericidade', d4],
  [5, 'Completude normativa', d5],
  [6, 'Qualidade do conteúdo', d6],
  [7, 'Comportamento funcional', d7],
  [8, 'Segurança da própria skill', d8],
  [9, 'Âncoras e mapeamento', d9],
  [10, 'A régua interna: os dez princípios', d10],
];

function main() {
  const args = process.argv.slice(2);
  const silencioso = args.includes('--silencioso');
  const i = args.indexOf('--dimensao');
  const so = i >= 0 ? Number(args[i + 1]) : null;
  const rodarAgora = DIMENSOES.filter(([n]) => !so || n === so);

  if (!silencioso) {
    console.log('VERIFICAÇÃO DA SKILL DE SEGURANÇA');
    console.log('='.repeat(64));
  }

  for (const [n, nome, fn] of rodarAgora) {
    const antes = falhas.length;
    try { fn(); } catch (e) { falha(n, 'a verificação quebrou: ' + e.message, 'verifica.js'); }
    const dessa = falhas.length - antes;
    if (!silencioso) {
      console.log(`${dessa ? '  FALHOU ' : '  ok     '} D${n} · ${nome}${dessa ? `  (${dessa})` : ''}`);
    }
  }

  if (falhas.length && !silencioso) {
    console.log('');
    console.log('FALHAS');
    console.log('-'.repeat(64));
    for (const [n] of DIMENSOES) {
      const dela = falhas.filter(f => f.dim === n);
      if (!dela.length) continue;
      console.log(`\nD${n}:`);
      dela.slice(0, 40).forEach(f => console.log(`  ${String(f.onde).padEnd(34)} ${f.msg}`));
      if (dela.length > 40) console.log(`  ... e mais ${dela.length - 40}`);
    }
  }

  if (!silencioso) {
    console.log('');
    console.log('='.repeat(64));
  }
  console.log(falhas.length
    ? `REPROVADO — ${falhas.length} falha(s) em ${new Set(falhas.map(f => f.dim)).size} dimensão(ões)`
    : `APROVADO — ${rodarAgora.length} dimensão(ões) sem falha`
      + (rodarAgora.some(([n]) => n === 4) && !NOMES.length ? ' (nome próprio não verificado: nomes.local.json vazio)' : ''));

  process.exit(falhas.length ? 1 : 0);
}

if (require.main === module) main();
