// A CAIXA DO TEXTO PÚBLICO: a opção "tudo minúsculo", e a linha da memória que a liga.
//
// A caixa é escolha da marca, e mora numa linha de `_memoria/escrita-publica.md`
// (seção "Caixa"):
//
//   **Caixa:** normal      o padrão: maiúscula no começo da frase e no nome próprio
//   **Caixa:** minúscula   tudo minúsculo, inclusive o começo da frase e o título;
//                          mantêm a forma só o nome próprio e a sigla
//
// Sem a linha, ou sem o arquivo, vale normal: a régua não cobra caixa nenhuma.
// Quem chama pode decidir por cima da memória com `minusculo: true | false`
// (a peça de cliente tem a caixa do cliente, e não a da memória deste workspace).
// Esta é a cópia mecânica única: a régua da copy (copy.js e scripts/copy/conferir.mjs)
// e a da legenda (legenda.js) leem daqui.
//
// O que a régua de minúsculo olha: a primeira palavra de cada trecho (o começo do
// texto, depois de ponto, interrogação, exclamação, reticências, dois-pontos e
// quebra de linha). Maiúscula ali só passa se a palavra for:
//   - sigla: duas letras ou mais, todas maiúsculas (IA, GA4, II)
//   - nome próprio da lista abaixo (marca universal) ou do vocabulário da pessoa
//   - nome próprio do próprio texto: a mesma palavra aparece com maiúscula no
//     meio de uma frase (a "Paula" da cena, o "Censo" do nome do estudo)
//   - nome que quem chama passa em `nomes` (a fonte de uma notícia, a sua marca)
// E o trecho que é uma letra maiúscula sozinha (o monograma do contato) passa.
// No meio da frase ela não olha: ali maiúscula já é nome próprio.

'use strict';

const fs = require('fs');
const path = require('path');

// A memória deste workspace, vista de scripts/lib/.
const MEMORIA_PADRAO = path.join(__dirname, '..', '..', '_memoria', 'escrita-publica.md');

// Só marca universal, que aparece em peça de qualquer ofício. O nome do ofício da
// pessoa (o software dela, a cidade dela, a marca dela) não mora aqui: ela o lista
// no vocabulário de _memoria/escrita-publica.md, e a régua o lê (nomesDoVocabulario).
// Cidade fica fora pela mesma razão; no meio da frase ela já passa como nome do texto.
const NOMES_PROPRIOS = new Set([
  'whatsapp', 'instagram', 'google', 'linkedin', 'x', 'youtube', 'tiktok',
  'facebook', 'chatgpt', 'openai', 'claude', 'anthropic', 'gemini',
  'excel', 'notion', 'canva', 'figma', 'apple', 'iphone', 'mac', 'android',
  'pix', 'pexels', 'unsplash', 'trello', 'hubspot', 'gmail', 'outlook', 'calendly',
  'brasil',
  // meses e dias não entram: em português eles são minúsculos
]);

const MAIUSCULA_INICIAL = /^\p{Lu}/u;
const PALAVRA = /[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu;

const ehSigla = p => p.replace(/[^\p{L}\p{N}]/gu, '').length >= 2 && p === p.toLocaleUpperCase('pt-BR') && /\p{Lu}/u.test(p);
const semAcento = s => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

/**
 * A caixa que um texto de `escrita-publica.md` declara.
 * Lê a primeira linha que abre com `**Caixa:**` (o negrito e o marcador de lista
 * são opcionais). "minúscula" (com ou sem acento, em qualquer caixa) liga a régua;
 * qualquer outro valor, e a falta da linha, valem normal.
 * @param {string} texto  o conteúdo do módulo
 * @returns {'minuscula'|'normal'}
 */
function lerCaixa(texto) {
  const m = String(texto || '').match(/^[ \t]*(?:[-*][ \t]+)?\*{0,2}caixa\*{0,2}[ \t]*:[ \t]*\*{0,2}[ \t]*([^\n]*)$/im);
  return m && semAcento(m[1].replace(/\*/g, '')).startsWith('minuscul') ? 'minuscula' : 'normal';
}

/**
 * O texto de `_memoria/escrita-publica.md`, ou '' quando o arquivo não existe.
 * @param {{memoria?: string|false}} [opcoes]  outro caminho para o módulo (a prova usa), ou false
 */
function textoDaMemoria(opcoes = {}) {
  // `memoria: false` é a peça de cliente: a régua não lê a memória deste workspace
  if (opcoes.memoria === false) return '';
  const arq = opcoes.memoria || MEMORIA_PADRAO;
  try { return fs.readFileSync(arq, 'utf8'); } catch { return ''; }
}

/** A caixa da memória deste workspace (ou do arquivo em `opcoes.memoria`). */
const caixaDaMemoria = (opcoes = {}) => lerCaixa(textoDaMemoria(opcoes));

/**
 * A régua de minúsculo vale aqui? `opcoes.minusculo` booleano decide por cima;
 * sem ele, decide a linha da memória.
 * @param {{minusculo?: boolean, memoria?: string}} [opcoes]
 * @returns {boolean}
 */
function minusculoPedido(opcoes = {}) {
  if (typeof opcoes.minusculo === 'boolean') return opcoes.minusculo;
  return caixaDaMemoria(opcoes) === 'minuscula';
}

/**
 * As palavras que a pessoa listou em escrita-publica.md como vocabulário do
 * próprio negócio ("Liste aqui as palavras suas que esta régua não deve cortar:").
 * O que estiver depois dos dois-pontos, até a linha em branco, separado por
 * vírgula ou ponto e vírgula; "(a definir)" não conta. Vale para o jargão (copy.js)
 * e como nome próprio na caixa minúscula.
 * @param {string} texto  o conteúdo do módulo
 * @returns {Set<string>} em minúsculo
 */
function lerVocabulario(texto) {
  return new Set(listaDaMemoria(texto, /n[ãa]o\s+deve\s+cortar:/i));
}

/**
 * Uma lista da memória: o que vem depois do rótulo, até a linha em branco ou a
 * orientação em itálico logo abaixo (`*As palavras…*`), separado por vírgula ou
 * ponto e vírgula, sem aspas, sem `*(a definir)*`, em minúsculo e sem repetição.
 * @param {string} texto  o conteúdo do módulo
 * @param {RegExp} rotulo  o fim do rótulo, até os dois-pontos
 * @returns {string[]}
 */
function listaDaMemoria(texto, rotulo, { manterCaixa = false } = {}) {
  const re = new RegExp(`${rotulo.source}\\**([^]*?)(?:\\n[ \\t]*\\n|\\n[ \\t]*\\*(?![*(])|$)`, 'i');
  const m = String(texto || '').match(re);
  if (!m) return [];
  const lista = m[1].replace(/[*_"“”']/g, '').replace(/\(a definir\)/gi, '').replace(/\s+/g, ' ');
  const itens = lista.split(/[,;]/).map(p => p.trim().replace(/[.:]+$/, '')).filter(Boolean);
  return [...new Set(manterCaixa ? itens : itens.map(p => p.toLowerCase()))];
}

/** O vocabulário próprio: o que quem chama passa em opcoes.vocabulario, ou o da memória. */
function vocabularioDe(opcoes = {}) {
  if (opcoes.vocabulario instanceof Set) return opcoes.vocabulario;
  if (Array.isArray(opcoes.vocabulario)) return new Set(opcoes.vocabulario.map(p => String(p).toLowerCase()));
  return lerVocabulario(textoDaMemoria(opcoes));
}

/** As palavras do vocabulário que a pessoa escreveu com maiúscula, para valer como
 *  nome próprio na caixa minúscula ("Pão da Vila" deixa passar "Pão" e "Vila" no
 *  começo do trecho; o "da" não, e a palavra do ofício escrita em minúsculo também
 *  não: "quadro de distribuição" não abre a porta para "De noite..."). */
function nomesDoVocabulario(opcoes = {}) {
  const itens = Array.isArray(opcoes.vocabulario) || opcoes.vocabulario instanceof Set
    ? [...opcoes.vocabulario].map(String)
    : listaDaMemoria(textoDaMemoria(opcoes), /n[ãa]o\s+deve\s+cortar:/i, { manterCaixa: true });
  return itens.flatMap(p => p.split(/\s+/)).filter(w => /^\p{Lu}/u.test(w));
}

// a palavra pode manter a maiúscula? sigla, nome da lista, nome do próprio texto
// ou nome que quem chama conhece
function podeMaiuscula(palavra, doTexto, extras) {
  if (ehSigla(palavra)) return true;
  const chave = palavra.toLocaleLowerCase('pt-BR');
  return NOMES_PROPRIOS.has(chave) || doTexto.has(chave) || extras.has(chave);
}

// as palavras com maiúscula no meio da frase: o nome próprio do próprio texto
function nomesDoTexto(t) {
  const doTexto = new Set();
  // o espaço tem que ser da mesma linha: a quebra separa elementos (o cabeçalho
  // "Pedido" logo abaixo de "...da Carla" não é meio de frase, é começo)
  for (const m of t.matchAll(/(?<=[\p{Ll},;][ \t ]+)(\p{Lu}[\p{L}'’-]*)/gu)) doTexto.add(m[1].toLocaleLowerCase('pt-BR'));
  return doTexto;
}

const extrasDe = opcoes => new Set((opcoes.nomes || []).map(n => String(n).toLocaleLowerCase('pt-BR')));

/**
 * As palavras com maiúscula no começo de um trecho que não são sigla nem nome
 * próprio. Só faz sentido com a caixa minúscula ligada: quem chama confere
 * `minusculoPedido` antes.
 * @param {string} texto
 * @param {{nomes?: string[]}} [opcoes]  nomes próprios que quem chama conhece
 * @returns {string[]} as palavras, na ordem, sem repetir
 */
function maiusculasIndevidas(texto, opcoes = {}) {
  const t = String(texto || '');
  const doTexto = nomesDoTexto(t);
  const extras = extrasDe(opcoes);
  const achadas = [];
  // os começos de trecho: o início, depois de . ! ? … : e da quebra de linha
  const trechos = t.split(/(?<=[.!?…:])\s+|\n+/);
  for (const trecho of trechos) {
    // o monograma do contato (a letra sozinha no círculo do celular) é a inicial de um
    // nome próprio, e fica em maiúscula como no aparelho
    if (/^\p{Lu}$/u.test(trecho.trim())) continue;
    const primeira = (trecho.match(PALAVRA) || [])[0];
    if (!primeira || !MAIUSCULA_INICIAL.test(primeira)) continue;
    if (podeMaiuscula(primeira, doTexto, extras)) continue;
    if (!achadas.includes(primeira)) achadas.push(primeira);
  }
  return achadas;
}

/**
 * O texto com o começo de cada trecho em minúsculo, onde a palavra não é sigla
 * nem nome próprio: o conserto determinístico para texto que nasce de um modelo,
 * porque o que não pode falhar não mora no prompt.
 * @param {string} texto
 * @param {{nomes?: string[]}} [opcoes]
 * @returns {string}
 */
function minusculizar(texto, opcoes = {}) {
  const t = String(texto || '');
  const doTexto = nomesDoTexto(t);
  const extras = extrasDe(opcoes);
  return t.replace(/(^|[.!?…:]\s+|\n+)([^\p{L}\p{N}\n]*)(\p{Lu}[\p{L}\p{N}'’-]*)/gu, (tudo, antes, meio, palavra) =>
    podeMaiuscula(palavra, doTexto, extras) ? tudo : antes + meio + palavra[0].toLocaleLowerCase('pt-BR') + palavra.slice(1));
}

/**
 * Os nomes próprios de um conjunto de textos (os slides de uma peça, os blocos
 * de uma copy): a palavra com maiúscula no meio de frase em qualquer um deles.
 * A "Carla" de "reunião com a Carla" num slide vale como nome no slide em que
 * ela abre a frase.
 * @param {string[]} textos
 * @returns {string[]}
 */
function nomesDaPeca(textos) {
  const todos = new Set();
  for (const t of textos) for (const n of nomesDoTexto(String(t || ''))) todos.add(n);
  return [...todos];
}

/**
 * As palavras que a pessoa recusou para o texto público, na linha
 * "**Palavras que o texto público não diz:**" de escrita-publica.md: o que vem
 * depois dos dois-pontos, até a linha em branco, separado por vírgula ou ponto e
 * vírgula, sem aspas; "(a definir)" não conta.
 * @param {string} texto  o conteúdo do módulo
 * @returns {string[]} em minúsculo
 */
function lerProibidas(texto) {
  return listaDaMemoria(texto, /texto\s+p[úu]blico\s+n[ãa]o\s+diz:/i);
}

/**
 * A escolha de emoji da linha "**Emoji:**" de escrita-publica.md, ou null quando ela
 * ainda é o molde. `{ permitidos: [...] }` quando ela listou os que usa ("só ⚡",
 * "nenhum na arte; na legenda, só ⚡"); `{ nenhum: true }` quando não listou nenhum
 * e disse que não usa ("nenhum", "zero", "não uso").
 */
function emojiDaMemoria(opcoes = {}) {
  const m = textoDaMemoria(opcoes).match(/^\*\*Emoji:\*\*[ \t]*(.*)$/m);
  const valor = m ? m[1].trim() : '';
  if (!valor || valor.startsWith('*(')) return null;
  const permitidos = [...new Intl.Segmenter('pt', { granularity: 'grapheme' }).segment(valor)]
    .map(s => s.segment).filter(g => /\p{Extended_Pictographic}/u.test(g));
  if (permitidos.length) return { permitidos };
  return /\b(nenhum|zero|n[ãa]o\s+uso)\b/i.test(semAcento(valor)) ? { nenhum: true } : null;
}

/**
 * As recusas da memória como pares [nome, teste], no formato das listas da régua.
 * O teste recebe o texto e diz se a palavra aparece inteira (não dentro de outra),
 * sem acento e sem caixa: "milagre" pega "Milagre", e "cura definitiva" pega a
 * frase quebrada em duas linhas.
 */
function proibidasDaMemoria(opcoes = {}) {
  const lista = Array.isArray(opcoes.proibidas) ? opcoes.proibidas.map(p => String(p).toLowerCase()) : lerProibidas(textoDaMemoria(opcoes));
  return lista.map(p => {
    const termo = semAcento(p).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    const re = new RegExp(`(?<![\\p{L}\\d])${termo}(?![\\p{L}\\d])`, 'u');
    return [p, { test: texto => re.test(semAcento(texto)) }];
  });
}

module.exports = {
  lerCaixa, textoDaMemoria, caixaDaMemoria, minusculoPedido, MEMORIA_PADRAO,
  lerVocabulario, vocabularioDe, nomesDoVocabulario, lerProibidas, proibidasDaMemoria, emojiDaMemoria,
  maiusculasIndevidas, minusculizar, nomesDaPeca, NOMES_PROPRIOS,
};
