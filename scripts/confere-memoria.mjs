#!/usr/bin/env node
// Confere a `_memoria/` contra o contrato escrito no `_memoria/README.md`.
//
// POR QUE ELE EXISTE: memória degrada por acréscimo. Cada fato novo entra ao lado
// do velho em vez de substituí-lo, e ninguém mede a degradação: ela só aparece
// quando alguém lê todos os arquivos de cabo a rabo. Este verificador mede o que é
// mecânico; o que é julgamento (duplicação semântica, frase que virou passado)
// continua sendo trabalho da skill `/memoria auditar`.
//
// Ele NÃO julga conteúdo. Ele cobra: arquivo declarado no README, sem subpasta,
// cabeçalho padrão, zero termo aposentado, zero marcador de data em texto corrido,
// zero emoji como estrutura, teto de linhas, e todo ponteiro `_memoria/...` do
// workspace resolvendo num arquivo que existe.
//
// Os termos aposentados moram na seção "## Termos aposentados" do próprio
// `_memoria/README.md`, um por item de lista. Quem aposenta um termo pelo
// `/memoria` escreve lá, e a partir daí nenhum outro módulo pode citá-lo.
//
// Uso:  node scripts/confere-memoria.mjs [--raiz <caminho>] [--instalada] [--silencioso]
//        --instalada também cobra o mínimo que o /instalar preenche (nome, tese, gargalo)
// Sai 1 se algo reprovar.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = fileURLToPath(new URL('.', import.meta.url));
const RAIZ_PADRAO = resolve(AQUI, '..');

// ── O contrato ───────────────────────────────────────────────────────────────

// Marcador de data em texto corrido. "medido em AAAA-MM-DD" é a única forma
// permitida, e ela existe porque número (audiência, faturamento) envelhece.
// ⚠️ Todo espaço aqui é `\s+`, nunca um espaço literal. O texto da memória é
// quebrado em ~78 colunas, então "em" cai no fim de uma linha e a data na
// seguinte; com espaço literal a régua fica verde sobre o defeito.
const PADROES_DE_DIARIO = [
  { re: /\bdesde\s+\d{2}\/\d{2}\/\d{4}/gi, nome: 'desde DD/MM/AAAA' },
  { re: /\bem\s+\d{2}\/\d{2}\/\d{4}/gi, nome: 'em DD/MM/AAAA' },
  // Sem `\b` depois de "até": em JS, "é" não é caractere de palavra, então a
  // fronteira nunca casa e a régua ficaria verde sempre.
  { re: /\bera\s+[\s\S]{0,40}?\s+até\W/gi, nome: '"era X até…"' },
  { re: /\bantigamente\b/gi, nome: 'antigamente' },
  { re: /\bfoi\s+decidido\b/gi, nome: 'foi decidido' },
  { re: /\bsaiu\s+de\s+circulação/gi, nome: 'saiu de circulação' },
  { re: /\brevertid[oa]\b/gi, nome: 'revertido' },
  { re: /\batualização\s+de\b/gi, nome: 'atualização de' },
];

// Emoji usado como marcador estrutural. A memória usa negrito para ênfase e
// `[REVIEW]` para o que depende de uma decisão sua.
const EMOJI_ESTRUTURAL = /[\u{1F6A8}\u{26A0}\u{2B50}\u{1F504}\u{1F195}\u{2705}\u{1F6D1}\u{2B1C}]/gu;

const TETO_DE_LINHAS = 250;

const CABECALHO = [
  { re: /^> \*\*Responsabilidade:\*\*/m, nome: 'Responsabilidade' },
  { re: /^> \*\*Não mora aqui:\*\*/m, nome: 'Não mora aqui' },
  // o molde ainda não revisto leva o marcador; o módulo escrito leva a data
  { re: /^> \*\*Revisado em:\*\* (?:\d{4}-\d{2}-\d{2}|\*\(o `\/instalar` preenche\)\*)/m, nome: 'Revisado em (AAAA-MM-DD)' },
];

// ── A instalação (`--instalada`) ─────────────────────────────────────────────
//
// O contrato acima vale para a memória em branco e para a preenchida. Depois do
// `/instalar`, o mínimo que as skills precisam (o modo rápido inclusive) tem de
// ter saído do molde: o nome, o que se vende, o gargalo com a consequência, e a
// data de revisão de quem foi escrito. O resto, se ficou em branco, é pendência
// dita. O molde marca o vazio com `*(a definir)*` (ou `*(a preencher ...)*`).

const VAZIO = /^\*\((?:a definir|a preencher)[^)]*\)\*$/;
const MARCA_DE_VAZIO = /^\s*\*\((?:a definir|a preencher)[^)]*\)\*\s*$/m;

/** O valor de um campo `**Rótulo:** valor`, na mesma linha. '' quando falta o campo. */
function campo(texto, rotulo) {
  const m = texto.match(new RegExp(`^\\*\\*${rotulo}:\\*\\*[ \\t]*(.*)$`, 'm'));
  return m ? m[1].trim() : '';
}
const preenchido = (valor) => Boolean(valor) && !VAZIO.test(valor);

/** O texto de uma seção `## <titulo>`, até a próxima `## ` ou o fim. */
function secao(texto, titulo) {
  const linhas = texto.split('\n');
  const i = linhas.findIndex((l) => new RegExp(`^##\\s+${titulo}`, 'i').test(l));
  if (i < 0) return '';
  const fim = linhas.findIndex((l, k) => k > i && /^##\s/.test(l));
  return linhas.slice(i + 1, fim < 0 ? undefined : fim).join('\n');
}

export function confereInstalacao(raiz = RAIZ_PADRAO) {
  const erros = [];
  const pendentes = [];
  const ler = (nome) => { try { return readFileSync(join(raiz, '_memoria', nome), 'utf8'); } catch { return ''; } };
  const empresa = ler('empresa.md');
  const estrategia = ler('estrategia.md');
  if (!preenchido(campo(empresa, 'Nome'))) erros.push('empresa.md: o Nome ainda está em branco');
  if (!preenchido(campo(empresa, 'O que você vende'))) erros.push('empresa.md: "O que você vende" ainda está em branco');
  if (!preenchido(campo(estrategia, 'O que trava'))) erros.push('estrategia.md: o Gargalo ("O que trava") ainda está em branco');
  if (!preenchido(campo(estrategia, 'Consequência para o sistema'))) erros.push('estrategia.md: o Gargalo não tem a "Consequência para o sistema"');
  // A data entra em todo módulo escrito. "Escrito" é o que já não é igual ao molde do
  // primeiro commit do workspace (o template chega com um commit só); sem Git para
  // comparar, valem os dois módulos que toda instalação escreve.
  const comData = (texto) => /^> \*\*Revisado em:\*\* \d{4}-\d{2}-\d{2}/m.test(texto);
  const modulos = existsSync(join(raiz, '_memoria'))
    ? readdirSync(join(raiz, '_memoria')).filter((n) => n.endsWith('.md') && n !== 'README.md') : [];
  const raizDoGit = moldeDoTemplate(raiz, null);
  for (const arq of modulos) {
    const texto = ler(arq);
    const molde = raizDoGit === null ? null : moldeDoTemplate(raiz, arq);
    const escrito = molde === null ? ['empresa.md', 'estrategia.md'].includes(arq) : texto.replace(/\r\n/g, '\n') !== molde.replace(/\r\n/g, '\n');
    if (escrito && !comData(texto)) erros.push(`${arq}: escrito sem a data no "Revisado em"`);
  }
  if (MARCA_DE_VAZIO.test(secao(ler('escrita-publica.md'), 'A voz'))) pendentes.push('escrita-publica.md: a voz (o Bloco 2 do /instalar)');
  if (MARCA_DE_VAZIO.test(secao(estrategia, 'Próximo passo'))) pendentes.push('estrategia.md: o próximo passo');
  if (MARCA_DE_VAZIO.test(secao(estrategia, 'Fase'))) pendentes.push('estrategia.md: a fase');
  // e a conta de cada módulo: quantos campos ainda estão em branco
  for (const arq of modulos) {
    const vazios = (ler(arq).match(/\*\((?:a definir|a preencher)[^)]*\)\*/g) || []).length;
    if (vazios) pendentes.push(`${arq}: ${vazios} campo(s) ainda em branco`);
  }
  return { erros, pendentes };
}

/**
 * O texto de um módulo no primeiro commit do workspace (o molde do template), ou
 * null quando não há Git, não há commit ou o arquivo não existia nele. Com
 * `arquivo` null, só diz se há um primeiro commit para comparar.
 */
function moldeDoTemplate(raiz, arquivo) {
  const git = (...a) => execFileSync('git', ['-C', raiz, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  try {
    if (!existsSync(join(raiz, '.git'))) return null;
    const primeiro = git('rev-list', '--max-parents=0', 'HEAD').trim().split('\n').pop();
    if (!primeiro) return null;
    return arquivo === null ? primeiro : git('show', `${primeiro}:_memoria/${arquivo}`);
  } catch {
    return null;
  }
}

// Onde um ponteiro para `_memoria/...` precisa resolver. `saidas/` e `lixeira/`
// ficam de fora de propósito: são documento pontual e quarentena, e congelam o
// caminho do dia em que foram escritos.
const ONDE_PROCURAR_PONTEIRO = ['.claude', 'identidade', 'marketing', 'scripts', 'CLAUDE.md', 'README.md'];
const IGNORAR_NO_PONTEIRO = ['node_modules', 'lixeira', 'clientes', 'projetos-pessoais', 'rascunho', '.git', 'conteudo'];

// ── Motor ────────────────────────────────────────────────────────────────────

// Lê os itens da seção "## Termos aposentados" do README. Aceita `- termo` e
// `- \`termo\``; o texto depois de " — " ou " · " é o motivo, e não entra.
const RE_SECAO_TERMOS = /^##\s+Termos aposentados\s*$([\s\S]*?)(?=^##\s|(?![\s\S]))/m;

/**
 * A expressão que acha um termo aposentado, a mesma para os dois conferidores:
 * a palavra inteira (sem letra colada antes nem depois), sem caixa, e com `\s+` no
 * lugar de cada espaço, porque o texto quebra em ~78 colunas e o termo cai em duas
 * linhas.
 */
export function reDoTermo(termo) {
  const corpo = termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`(?<![\\p{L}\\d])${corpo}(?![\\p{L}\\d])`, 'giu');
}

export function termosDoReadme(readme) {
  const secao = readme.match(RE_SECAO_TERMOS);
  if (!secao) return [];
  return [...secao[1].matchAll(/^\s*[-*]\s+(.+?)\s*$/gm)]
    .map((m) => m[1].split(/\s+[—·]\s+/)[0].replace(/^`|`$/g, '').trim())
    .filter((t) => t && !/^\(.*\)$/.test(t));
}

export function confereMemoria(raiz = RAIZ_PADRAO, opcoes = {}) {
  const erros = [];
  const avisos = [];
  const dirMemoria = join(raiz, '_memoria');

  if (!existsSync(dirMemoria)) {
    return { erros: ['a pasta `_memoria/` não existe'], avisos, revisoes: {} };
  }

  // 1. Estrutura plana: nada de subpasta.
  const entradas = readdirSync(dirMemoria, { withFileTypes: true });
  for (const e of entradas) {
    if (e.isDirectory()) erros.push(`_memoria/${e.name}/ é subpasta, e a memória é plana`);
  }

  const arquivos = entradas
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => e.name)
    .sort();

  // 2. O README existe e declara todos os módulos.
  if (!arquivos.includes('README.md')) {
    erros.push('falta `_memoria/README.md`, que é o índice e o contrato');
    return { erros, avisos, revisoes: {} };
  }

  const readme = readFileSync(join(dirMemoria, 'README.md'), 'utf8');
  const modulos = arquivos.filter((a) => a !== 'README.md');
  const termosAposentados = opcoes.termosAposentados ?? termosDoReadme(readme);
  // Sem a seção, a régua de termos lê zero termos e passa verde sem ter medido:
  // título fora do contrato é erro, nunca silêncio.
  if (!opcoes.termosAposentados && !RE_SECAO_TERMOS.test(readme)) {
    erros.push('o README não tem a seção "## Termos aposentados": a régua de termos aposentados não mediu nada');
  }

  for (const m of modulos) {
    if (!readme.includes(`\`${m}\``)) {
      erros.push(`\`${m}\` existe e não está declarado no README: módulo que ninguém anuncia é módulo que ninguém acha`);
    }
  }

  // O caminho inverso: README prometendo arquivo que não existe.
  for (const citado of readme.matchAll(/`([a-zA-Z_]+\.md)`/g)) {
    const nome = citado[1];
    if (nome === 'README.md' || nome === 'CLAUDE.md') continue;
    if (!arquivos.includes(nome)) {
      erros.push(`o README declara \`${nome}\`, que não existe em _memoria/`);
    }
  }

  // 3. Cada módulo, por dentro.
  const revisoes = {};
  for (const nome of arquivos) {
    const texto = readFileSync(join(dirMemoria, nome), 'utf8');
    const linhas = texto.split(/\r?\n/);

    if (nome !== 'README.md') {
      for (const c of CABECALHO) {
        if (!c.re.test(texto)) erros.push(`${nome}: falta a linha "${c.nome}" no cabeçalho`);
      }
    }

    if (linhas.length > TETO_DE_LINHAS) {
      avisos.push(`${nome}: ${linhas.length} linhas, acima do teto de ${TETO_DE_LINHAS}. Ou o domínio pede divisão, ou o texto pede corte`);
    }

    // Citar um termo aposentado é a versão velha voltando. No README, só a
    // própria seção que lista os termos fica de fora; o resto dele é varrido
    // como qualquer módulo.
    const alvo = nome === 'README.md' ? texto.replace(RE_SECAO_TERMOS, '') : texto;
    for (const termo of termosAposentados) {
      const achados = [...alvo.matchAll(reDoTermo(termo))];
      if (achados.length) {
        erros.push(`${nome}: cita "${termo}" ${achados.length}x, e ele está na lista de termos aposentados`);
      }
    }

    for (const p of PADROES_DE_DIARIO) {
      const achados = [...texto.matchAll(p.re)].filter((m) => {
        // "(medido em AAAA-MM-DD)" é a exceção, e é a única.
        const antes = texto.slice(Math.max(0, m.index - 12), m.index + m[0].length + 4);
        return !/medido em/i.test(antes);
      });
      if (achados.length) {
        erros.push(`${nome}: ${achados.length} marcador(es) de diário, do tipo ${p.nome}. Memória é estado: a frase antiga se substitui, não se anota ao lado`);
      }
    }

    const emojis = [...texto.matchAll(EMOJI_ESTRUTURAL)];
    if (emojis.length) {
      erros.push(`${nome}: ${emojis.length} emoji(s) usado(s) como estrutura. Ênfase é negrito; o único marcador é [REVIEW]`);
    }

    // `[REVIEW]` entre crases é a REGRA falando do marcador (é o caso do
    // README), não um item esperando decisão. Contar isso inflaria o número de
    // pendências.
    revisoes[nome] = (texto.replace(/`\[REVIEW\]`/g, '').match(/\[REVIEW\]/g) || []).length;
  }

  // 4. Todo ponteiro `_memoria/...` do workspace resolve.
  for (const alvo of ONDE_PROCURAR_PONTEIRO) {
    const caminho = join(raiz, alvo);
    if (!existsSync(caminho)) continue;
    const arquivosAlvo = statSync(caminho).isDirectory() ? varre(caminho) : [caminho];
    for (const arq of arquivosAlvo) {
      let conteudo;
      try {
        conteudo = readFileSync(arq, 'utf8');
      } catch {
        continue;
      }
      for (const m of conteudo.matchAll(/_memoria\/([A-Za-z0-9_\-./]+\.md)/g)) {
        const apontado = join(dirMemoria, m[1]);
        if (!existsSync(apontado)) {
          erros.push(`${relative(raiz, arq).split(sep).join('/')} aponta para \`_memoria/${m[1]}\`, que não existe`);
        }
      }
    }
  }

  return { erros: [...new Set(erros)], avisos: [...new Set(avisos)], revisoes, termosAposentados };
}

function varre(dir, acumulado = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (IGNORAR_NO_PONTEIRO.includes(e.name)) continue;
    // Arquivo de teste carrega caminho falso de propósito, para plantar o
    // defeito. Varrer isso faz o verificador acusar a própria suíte.
    if (e.isFile() && /^teste-/.test(e.name)) continue;
    const caminho = join(dir, e.name);
    if (e.isDirectory()) varre(caminho, acumulado);
    else if (/\.(md|js|mjs|ts|tsx|sh|json)$/.test(e.name)) acumulado.push(caminho);
  }
  return acumulado;
}

// ── Linha de comando ─────────────────────────────────────────────────────────

const ehPrincipal = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (ehPrincipal) {
  const iRaiz = process.argv.indexOf('--raiz');
  const raiz = iRaiz >= 0 ? resolve(process.argv[iRaiz + 1]) : RAIZ_PADRAO;
  const silencioso = process.argv.includes('--silencioso');

  const { erros, avisos, revisoes, termosAposentados = [] } = confereMemoria(raiz);
  if (process.argv.includes('--instalada')) {
    const instalacao = confereInstalacao(raiz);
    erros.push(...instalacao.erros.map((e) => `instalação: ${e}`));
    avisos.push(...instalacao.pendentes.map((p) => `pendente: ${p}`));
  }

  if (!silencioso) {
    const totalRevisao = Object.values(revisoes).reduce((a, b) => a + b, 0);
    console.log(`memória: ${Object.keys(revisoes).length} arquivo(s), ${totalRevisao} item(ns) [REVIEW] esperando sua decisão`);
    console.log(`termos aposentados lidos do README: ${termosAposentados.length}`);
    for (const [arq, n] of Object.entries(revisoes)) {
      if (n) console.log(`  · ${arq}: ${n}`);
    }
    for (const a of avisos) console.log(`AVISO  ${a}`);
    for (const e of erros) console.log(`FALHOU ${e}`);
    console.log(erros.length ? `\n${erros.length} problema(s).` : '\nOK');
  }

  process.exit(erros.length ? 1 : 0);
}
