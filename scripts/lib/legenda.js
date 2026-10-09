// A RÉGUA DA LEGENDA: a única cópia do workspace.
//
// O que a legenda é, nesta régua: a MOLDURA da peça, não a repetição dela. O
// conteúdo mora nos cards (ou no vídeo). A legenda atrai na primeira linha,
// retém no miolo com o que os cards NÃO dizem, e converte no fecho com uma ação
// concreta, amarrada ao tema daquele post.
//
// O padrão (curta, sem hashtag, até 1 emoji, sem CTA genérico) vem de medição: a
// legenda longa com hashtags no fim repete os cards e não converte. Quem quer outro tamanho passa `regua` (o teto e as
// linhas); as outras checagens são as mesmas para todo mundo. Se um comentário,
// uma skill ou um gate pedir hashtag, três linhas com um ponto ou 2.200
// caracteres, eles falam de outra régua: esta não pede.
//
// ⚠️ Esta régua mede o MECÂNICO. Ela não julga se a linha 1 prende de verdade,
// se o miolo traz mesmo informação nova, nem se o fecho é específico o bastante.
// Isso é revisão de gente, e as checagens 4, 5 e 7 saem daqui como AVISO por isso.
//
// A caixa (normal ou tudo minúsculo) é a da linha `**Caixa:**` de
// `_memoria/escrita-publica.md`, lida por `caixa.js`; quem chama decide por cima
// com `minusculo: true | false` (a peça de cliente tem a caixa do cliente).

'use strict';

const { maiusculasIndevidas, minusculoPedido, nomesDoVocabulario, proibidasDaMemoria, emojiDaMemoria } = require('./caixa');
const { achaPadroes, mensagem } = require('./padroes-de-ia');

const TETO = 400;          // caracteres, contados sem espaço em branco nas pontas
const MIN_LINHAS = 3;
const MAX_LINHAS = 5;
const MAX_EMOJI = 1;       // e zero é a escolha padrão

/**
 * O APERTO POR CONTA é PARÂMETRO, e não cópia da régua. Duas contas que escrevem
 * na mesma régua, uma delas mais curta, diferem em DOIS números; as checagens são
 * as mesmas. Uma cópia com dois números trocados envelhece torto: a próxima regra
 * entra numa e não na outra, e ninguém percebe até uma peça sair errada.
 * Quem chama sem `regua` recebe o padrão.
 */
const REGUA_PADRAO = { teto: TETO, minLinhas: MIN_LINHAS, maxLinhas: MAX_LINHAS };

// Hashtag de verdade: # colado numa letra. Não pega "#1" nem "C#" solto.
const RE_HASHTAG = /(^|\s)#[\p{L}][\p{L}\p{N}_]*/gu;

const RE_EMOJI = /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F2FF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F1E6}-\u{1F1FF}]/gu;

// Os emoji como a pessoa os vê: um por grafema. O tom de pele (👍🏽), a bandeira
// (dois indicadores regionais), a família unida por ZWJ e o seletor de variação
// são um emoji só; contar código por código acusaria "2 emoji" num 👍🏽.
const SEGMENTOS = new Intl.Segmenter('pt-BR', { granularity: 'grapheme' });
const RE_UM_EMOJI = new RegExp(RE_EMOJI.source, 'u');
const emojisDe = t => [...SEGMENTOS.segment(t)].map(s => s.segment).filter(g => RE_UM_EMOJI.test(g));

// As três linhas com um ponto cada. Só servem pra empurrar as hashtags pra
// baixo do "mais". Sem hashtag, elas não têm função nenhuma.
const RE_TRES_PONTOS = /\n\s*\.\s*\n\s*\.\s*\n\s*\./;

// CTA que serviria em qualquer outro post.
const CTA_GENERICO = [
  'salva esse post', 'salva aí', 'salve esse post', 'salvar esse post',
  'comenta aqui', 'comenta aí', 'comente aqui', 'comenta abaixo',
  'marca alguém', 'marca alguem', 'marque alguém', 'marca um amigo',
  'compartilha com quem precisa', 'compartilhe com quem precisa',
  'manda pra alguém', 'manda pra quem precisa', 'envia pra alguém',
  // o pedido de seguir seco não entra aqui: mora no PEDIDO_DE_SEGUIR_SECO, abaixo
  'link na bio', 'arrasta pro lado', 'arrasta pra ver',
];

// O PEDIDO DE SEGUIR SECO. Dizer por que seguir traz mais seguidor do que pedir:
// a fórmula seca reprova, mesmo com o motivo ao lado; o motivo sem a fórmula passa.
// Uma lista só: a legenda lê aqui, e quem confere os slides lê a mesma.
const PEDIDO_DE_SEGUIR_SECO = /(?<![\p{L}])(me sigam|me siga|me segue|siga o perfil|siga a página|segue o perfil|segue a página|segue pra mais|segue lá)(?![\p{L}])/iu;
/** A fórmula seca de seguir no texto, ou null. */
const pedeSeguirSemMotivo = texto => {
  const m = PEDIDO_DE_SEGUIR_SECO.exec(String(texto || ''));
  return m ? m[1].toLowerCase() : null;
};

// Abertura que não prende: pergunta retórica ou frase de efeito solta.
const RE_PERGUNTA_ABERTURA = /^[^\n]{0,120}\?\s*$/;

// 🚨 O CRÉDITO NÃO CONTA NO TETO, e isso não é frouxidão: crédito é OBRIGAÇÃO,
// não texto editorial. Uma imagem de acervo sob CC BY-SA pode pedir uma
// atribuição que sozinha passa de 300 caracteres; contar ela junto tornaria
// imagem licenciada inutilizável.
// ⚠️ O crédito continua medido pelo resto da régua (hashtag, emoji, travessão e
// markdown valem nele igual). E ele tem que ficar no FIM: no meio é ruído.
const RE_CREDITO = /^\s*(v[ií]deo|imagens?|fotos?|fontes?|cr[ée]ditos?|arte|ilustra[çc][ãa]o)\b[^\n]*:/i;

/** Separa o corpo editorial do bloco de crédito do fim. */
function separaCredito(t) {
  const linhas = t.split('\n');
  let corte = linhas.length;
  for (let i = linhas.length - 1; i >= 0; i--) {
    const l = linhas[i].trim();
    if (!l) continue;
    if (RE_CREDITO.test(l)) { corte = i; continue; }
    break;
  }
  return {
    corpo: linhas.slice(0, corte).join('\n').trim(),
    credito: linhas.slice(corte).join('\n').trim(),
  };
}

/**
 * @param {string} texto  o conteúdo do legenda.txt
 * @param {object} opcoes
 *   @param {string}  [opcoes.serie]         o nome da série que tem quem responda no direct; libera a isca
 *   @param {string}  [opcoes.palavra]       a palavra-gatilho da série; a legenda que promete tem que pedir ESSA
 *   @param {boolean} [opcoes.dmLigada]      false => nem série pode prometer direct
 *   @param {string}  [opcoes.textoDosCards] pra medir repetição (checagem 5)
 *   @param {boolean} [opcoes.minusculo]     decide a caixa por cima da memória
 *   @param {string|false} [opcoes.memoria] outro caminho para `escrita-publica.md`; false na peça de cliente
 *   @param {string[]} [opcoes.nomes]        nomes próprios que quem chama conhece (a fonte da notícia)
 *   @param {{teto?: number, minLinhas?: number, maxLinhas?: number}} [opcoes.regua] o aperto por conta
 * @returns {{erros: string[], avisos: string[], ia: {texto: string, julgamento: boolean}[]}}
 *   `ia`: os padrões de IA achados, que também saem em `avisos`
 */
function confereLegenda(texto, opcoes = {}) {
  const erros = [];
  const avisos = [];
  const t = String(texto || '').trim();
  const regua = { ...REGUA_PADRAO, ...(opcoes.regua || {}) };

  if (!t) return { erros: ['legenda.txt vazia'], avisos };

  // ── 0 · a caixa: só quando a marca escolheu tudo minúsculo ───
  if (minusculoPedido(opcoes)) {
    // o nome que quem chama conhece e o vocabulário que a pessoa listou na memória
    const m = maiusculasIndevidas(t, { nomes: [...(opcoes.nomes || []), ...nomesDoVocabulario(opcoes)] });
    if (m.length) erros.push(`a legenda começa trecho com maiúscula (${m.join(', ')}) · a caixa da marca é minúscula, menos nome próprio e sigla (_memoria/escrita-publica.md, "Caixa")`);
  }

  // ── 1 · hashtag: nenhuma, em lugar nenhum ────────────────────
  const tags = t.match(RE_HASHTAG);
  if (tags) {
    erros.push(`${tags.length} hashtag(s) na legenda (${tags.map(s => s.trim()).join(' ')}) · esta régua não usa hashtag`);
  }
  if (RE_TRES_PONTOS.test(t)) {
    erros.push('as três linhas com um ponto continuam na legenda · elas empurravam as hashtags pra baixo do "mais", e não há hashtag');
  }

  // ── 2 · emoji: no máximo 1, e só se substituir uma palavra ───
  const emojis = emojisDe(t);
  // a escolha da pessoa, na linha "Emoji" da memória, aperta a régua
  const escolha = emojiDaMemoria(opcoes);
  if (escolha?.nenhum && emojis.length) {
    erros.push(`emoji na legenda (${[...new Set(emojis)].join(' ')}) · você escolheu não usar emoji (_memoria/escrita-publica.md, "Emoji")`);
  }
  const fora = escolha?.permitidos ? [...new Set(emojis)].filter(e => !escolha.permitidos.includes(e)) : [];
  if (fora.length) {
    erros.push(`emoji que você não usa na legenda (${fora.join(' ')}) · os seus são ${escolha.permitidos.join(' ')} (_memoria/escrita-publica.md, "Emoji")`);
  }
  if (emojis.length > MAX_EMOJI) {
    erros.push(`${emojis.length} emoji na legenda (${[...new Set(emojis)].join(' ')}) · o teto é ${MAX_EMOJI}, e zero é o padrão`);
  }

  // ── 3 · teto de caracteres (o crédito do fim não conta) ──────
  const { corpo, credito } = separaCredito(t);
  if (corpo.length > regua.teto) {
    const extra = credito ? `, sem contar o crédito de ${credito.length}` : '';
    erros.push(`legenda com ${corpo.length} caracteres${extra} · o teto é ${regua.teto}`);
  }

  // ── tamanho em linhas ────────────────────────────────────────
  const linhas = corpo.split('\n').map(s => s.trim()).filter(Boolean);
  if (linhas.length < regua.minLinhas || linhas.length > regua.maxLinhas) {
    erros.push(`legenda com ${linhas.length} linha(s) de texto · a regra pede de ${regua.minLinhas} a ${regua.maxLinhas}`);
  }

  // ── 4 · a linha 1 precisa funcionar sozinha ──────────────────
  // É o que aparece antes do "ver mais".
  const l1 = linhas[0] || '';
  if (l1.length < 25) {
    avisos.push(`a linha 1 tem ${l1.length} caracteres · curta demais pra prender sozinha antes do "ver mais"`);
  }
  if (RE_PERGUNTA_ABERTURA.test(l1)) {
    avisos.push('a linha 1 é uma pergunta · pergunta retórica não abre texto público');
  }
  if (/^(e |mas |então |por isso|ou seja|afinal)/i.test(l1)) {
    avisos.push('a linha 1 começa com conectivo · ela precisa fazer sentido fora de contexto');
  }

  // ── 5 · o miolo não repete o que já está nos cards ───────────
  if (opcoes.textoDosCards) {
    const normal = s => s.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim();
    const cards = normal(opcoes.textoDosCards);
    const alvo = normal(t);
    for (let i = 0; i + 40 <= alvo.length; i += 15) {
      if (cards.includes(alvo.slice(i, i + 40))) {
        avisos.push('a legenda repete um trecho dos cards · o miolo existe pra trazer o que os cards NÃO dizem');
        break;
      }
    }
  }

  // ── 6 · CTA genérico ─────────────────────────────────────────
  const baixo = t.toLowerCase();
  for (const cta of CTA_GENERICO) {
    if (baixo.includes(cta)) {
      erros.push(`CTA genérico na legenda: "${cta}" · o fecho tem que ser uma ação amarrada ao tema deste post`);
    }
  }

  // ── 6a · o pedido de seguir seco ─────────────────────────────
  const seco = pedeSeguirSemMotivo(t);
  if (seco) erros.push(`a legenda pede para seguir com "${seco}" · troque o pedido pelo motivo de seguir, como "toda semana, uma receita nova do balcão"`);

  // ── 6b · CTA que manda resolver com um terceiro ──────────────
  // O fecho mostra o valor de quem assina no problema do post ("eu acho esse furo
  // e te mostro..."), nunca passa tarefa para a pessoa cumprir com outro ("peça a
  // quem cuida do anúncio"): confunde e entrega o valor a outro
  // (_memoria/escrita-publica.md, "Clareza acima de enigma").
  const RE_TERCEIRO = /\b(pergunt[ae]|pe[çc]a|pede|confira|confere|cheque|consulte|cobre)\s+(?:a|à|ao|pra|pro|para|com)\s+(?:(?:o|a|os|as|seu|sua|seus|suas)\s+){0,2}(quem\s+(?:cuida|faz|roda|gerencia|toca|mexe)|ag[êe]ncia|gestor|equipe|t[ée]cnico|programador|designer|social\s*media)/i;
  const terceiro = t.match(RE_TERCEIRO);
  if (terceiro) {
    erros.push(`CTA que manda resolver com um terceiro: "${terceiro[0]}" · o fecho mostra o valor de quem assina no problema do post`);
  }

  // ── bullet list ──────────────────────────────────────────────
  if (/^\s*[-•*]\s+/m.test(t)) {
    erros.push('bullet list na legenda · a regra proíbe');
  }

  // ── o que vale em todo texto público ─────────────────────────
  if (/[—–]/.test(t)) {
    erros.push('travessão na legenda · zero em texto que o público vê');
  }
  for (const [nome, re] of proibidasDaMemoria(opcoes)) {
    if (re.test(t)) erros.push(`a legenda diz "${nome}" · é palavra que você recusou para o texto público (_memoria/escrita-publica.md, "O que evitar")`);
  }
  if (/(\*\*|^#{1,6}\s|`)/m.test(t)) {
    erros.push('markdown na legenda · o Instagram mostra os asteriscos crus');
  }
  // os padrões de IA da humanizer, da mesma lista dos slides e da copy de página
  // (padroes-de-ia.js); a negação partida é o contraste fabricado dela
  const ia = achaPadroes(t).map(h => ({ texto: mensagem('legenda', h), julgamento: h.julgamento }));
  // o que a máquina vê com certeza reprova; o de julgamento (o contraste) avisa
  for (const h of ia) (h.julgamento ? avisos : erros).push(h.texto);

  // ── isca de DM: depende de haver quem responda ───────────────
  // Prometer "comenta X que eu te mando no direct" sem ninguém (nem automação)
  // respondendo queima a conta. Só a série que tem quem responda libera a isca.
  const RE_ISCA_DIRECT = /\b(mando|mandar|envio|enviar|respondo|responder)\b[^.!?\n]{0,30}\bno\s+(direct|dm)\b/i;
  // 🚨 O fim da palavra NÃO é `\b`: o `\b` do JavaScript não vê o "Ê" como letra,
  // e "Comenta VOCÊ" seria lido como "VOC". A fronteira é a da letra maiúscula.
  const RE_ISCA_PALAVRA = /\b[Cc]oment[ae]\w*\s+["'«]?[A-ZÀ-Ü]{3,}(?![A-ZÀ-Ü0-9_])/;
  const temIsca = RE_ISCA_DIRECT.test(t) || RE_ISCA_PALAVRA.test(t);
  if (temIsca) {
    if (!opcoes.serie) {
      erros.push('a legenda promete direct, e esta peça não é de uma série com quem responda no direct · prometer sem quem responda queima a conta');
    } else if (opcoes.dmLigada === false) {
      erros.push('a legenda promete direct e a resposta no direct está DESLIGADA · promessa sem quem atenda queima a conta');
    } else if (opcoes.palavra) {
      const pedida = (RE_ISCA_PALAVRA.exec(t) || [])[0];
      const palavraNaLegenda = pedida ? pedida.replace(/^[Cc]oment\w*\s+["'«]?/, '') : null;
      if (palavraNaLegenda && palavraNaLegenda !== opcoes.palavra) {
        erros.push(`a legenda pede "Comenta ${palavraNaLegenda}" e a série ${opcoes.serie} responde a ${opcoes.palavra} · campanha aberta com a palavra errada não atende ninguém`);
      }
    }
  }

  return { erros, avisos, ia };
}

/**
 * O tamanho que a régua mede: o corpo editorial, SEM o bloco de crédito do fim.
 * Quem publica precisa desta função, e não de `texto.length`: medir cru reprova a
 * peça com atribuição de licença longa.
 */
const tamanhoDoCorpo = texto => separaCredito(String(texto || '').trim()).corpo.length;

module.exports = {
  confereLegenda, separaCredito, tamanhoDoCorpo, PEDIDO_DE_SEGUIR_SECO, pedeSeguirSemMotivo,
  TETO, MIN_LINHAS, MAX_LINHAS, MAX_EMOJI, REGUA_PADRAO,
  CTA_GENERICO, RE_HASHTAG, RE_EMOJI, RE_TRES_PONTOS, RE_CREDITO,
};
