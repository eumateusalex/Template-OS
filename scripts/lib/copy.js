// A RÉGUA DO TEXTO PÚBLICO: o que a máquina consegue cobrar da escrita pública.
//
// A regra escrita mora na memória: `_memoria/escrita-publica.md` (a linguagem de
// balcão, a caixa, a clareza e "O que evitar": o jargão de guru, o travessão, a
// negação partida) e `_memoria/prova.md` (o que se pode afirmar). Aqui mora só a parte mecânica, e numa cópia só: a régua da copy
// (`scripts/copy/conferir.mjs`) importa estas listas, e `confereCopy` confere uma
// peça com slides (carrossel, vídeo com texto na tela) e a legenda dela. No
// carrossel, quem tira o texto do HTML e chama `confereCopy` é
// `scripts/copy/conferir-slides.mjs`.
//
// ⚠️ Esta régua mede o MECÂNICO. Ela não julga se a dor é a dor certa, se a
// promessa dá vontade, nem se a prova convence: isso é revisão de gente (o agente
// `revisor-de-comunicacao` e quem pediu). O que ela garante é que a capa e a
// primeira linha falam COM a pessoa e dizem o que ela perde ou ganha, que todo
// número tem fonte declarada, e que nada do que a memória proíbe passou.
//
// Como a peça declara o que a régua confere (todos os campos são opcionais):
//
//   confereCopy({
//     slides: ['texto do slide 1', ...],     o texto visível de cada slide
//     legenda: 'linha 1\nlinha 2\n...',       o legenda.txt
//     tituloCapa: 'o título da capa',
//     meta: { numeros: [{ valor: '30 dias', fonte: 'o briefing' }], clienteReal: false, nomes: ['Carla'] },
//   })
//
// O retorno é `{ erros, avisos, ia }`: `ia` traz os padrões de IA achados nos slides
// (`padroes-de-ia.js`), cada um com o texto e se é de julgamento.

'use strict';

const { maiusculasIndevidas, nomesDaPeca, minusculoPedido, lerVocabulario, vocabularioDe, nomesDoVocabulario, proibidasDaMemoria } = require('./caixa');

// os padrões de IA que a humanizer nomeia e a máquina vê: a régua devolve os achados
// no campo `ia`, e quem a chama decide a cor (o contraste, de julgamento, fica aviso)
const { achaPadroes, mensagem: mensagemDoPadrao } = require('./padroes-de-ia');
// o pedido de seguir seco, o tamanho da frase e da capa: uma cópia só, em legenda.js
const { pedeSeguirSemMotivo, confereFrasesDaLegenda, MAX_PALAVRAS_POR_FRASE, MAX_PALAVRAS_CAPA, palavrasDe, frasesDe } = require('./legenda');
const padroesDosSlides = slides => slides.flatMap((s, i) => achaPadroes(s).map(h => ({ texto: mensagemDoPadrao(`slide ${i + 1}`, h), julgamento: h.julgamento })));

// ── o que o texto público não diz ────────────────────────────────────────────
//
// O padrão do template: "garantia" (`prova.md`: só com garantia de fato, e então
// quem chama a régua diz isso) e o jargão de marketing vazio da lista "O que
// evitar" de `escrita-publica.md`. Mudou a lista lá, muda aqui.
const PROIBIDAS = [
  ['garantia', /\bgarant(?:id[oa]s?|ias?)\b/i],
  ['alavancar', /\balavanc/i],
  ['sinergia', /\bsinergi/i],
  ['disruptivo', /\bdisruptiv/i],
  ['game changer', /game\s*changer/i],
  ['mindset', /\bmindset\b/i],
  ['destravar', /\bdestrav/i],
];

// As de cima mais as que a pessoa recusou, na linha "Palavras que o texto público
// não diz" de `escrita-publica.md` (ou em opcoes.proibidas, por cima da memória).
const proibidasDe = (opcoes = {}) => [...PROIBIDAS, ...proibidasDaMemoria(opcoes)];

// "Case" é palavra reservada a cliente real (`_memoria/prova.md`). A peça com
// cena inventada não chama nada de case, por mais completa que seja.
const RE_CASE = /(?<!\p{L})cases?(?!\p{L})/iu;

// O que soa medido e talvez não esteja. Não reprova: conta, para quem decide ver
// o número de afirmações não medidas que a peça carrega (`prova.md`: em conteúdo,
// cena ilustrativa pode entrar; em venda direta, só o que está medido).
const INVENTADAS = [
  ['24/7', /\b24\s*\/\s*7\b/],
  ['100%', /\b100\s*%/],
  ['clientes atendidos', /clientes\s+atendid[oa]s/i],
  ['empresas que confiam', /empresas\s+que\s+confiam/i],
  ['meu/nosso cliente', /\b(?:meus?|nossos?)\s+clientes?\b/i],
];

// Resultado de cliente afirmado: número de receita ou venda, ou verbo de
// crescimento colado a receita.
const RE_RESULTADO = [
  /\d+(?:[.,]\d+)?\s*(?:%|x\b|vezes)\s*(?:a\s+)?(?:mais\s+|de\s+|em\s+|no\s+|na\s+)*(?:receita|faturamento|vendas?|lucro)/i,
  /(?:receita|faturamento|vendas?|lucro)\s+(?:subiu|subiram|aumentou|aumentaram|cresceu|cresceram|dobrou|dobraram|triplicou|triplicaram)/i,
  /\bR\$\s*[\d.]+(?:\s*(?:mil|milh(?:ão|ões)))?\s+(?:a\s+mais|de\s+lucro|de\s+receita|de\s+faturamento)/i,
];

// Depoimento atribuído: aspas com fala de alguém E um papel de gente COLADO nela
// (até 40 caracteres antes ou depois). Só "aspas + dono em qualquer lugar do
// slide" acusaria expressão citada ("responder mais rápido") num slide que fala
// do dono: falso positivo.
const PAPEL = '(?:don[oa]|s[óo]ci[oa]|gerente|recep[çc][ãa]o|recepcionista|CEO|fundador[a]?|propriet[áa]ri[oa])';
const RE_DEPOIMENTO = new RegExp(`["“][^"”\\n]{20,}["”][^.!?\\n]{0,40}\\b${PAPEL}\\b|\\b${PAPEL}\\b[^.!?\\n]{0,40}["“][^"”\\n]{20,}["”]`, 'i');

// Todo número que aparece na arte. O que casa aqui precisa estar declarado em
// `meta.numeros`, com fonte (ou marcado como `exemplo`, que é escolha consciente
// de cenário, nunca esquecimento).
// ⚠️ NO MÁXIMO UM espaço entre o número e a unidade. O texto visível troca cada
// tag por um espaço, então número e palavra de elementos DIFERENTES chegam
// separados por dois: com mais espaço, o "2" de um passo cola no "Dias" do
// título ao lado e vira "2 dias".
const RE_NUMERO = /(?:R\$|US\$) ?\d+(?:[.,]\d+)*|\b\d+(?:[.,]\d+)* ?(?:%|x\b|vezes|mil\b|milh(?:ão|ões)|bilh(?:ão|ões)|horas?\b|h\b|dias?\b|min(?:utos?)?\b|segundos?\b|centavos?\b|reais\b)/gi;

const RE_TRAVESSAO = /[—–]/;

// ── A LINGUAGEM DE BALCÃO (`_memoria/escrita-publica.md`) ───────────────────
//
// O defeito que esta régua pega NÃO é vocabulário técnico: é a peça falar DE um
// assunto em vez de falar COM a pessoa sobre o que ela perde. Numa amostra de 30
// peças publicadas, 5 capas falavam com a pessoa, 3 diziam o que ela perde, e só 3
// tinham jargão. Uma régua centrada em jargão daria verde no defeito real; por isso
// o jargão é a régua SECUNDÁRIA.
//
// 🚨 FRONTEIRA UNICODE, NÃO `\b`. O `\b` do JavaScript é a fronteira entre `\w`
// e não-`\w`, e `ê` NÃO é `\w`: `/\bvocê\b/` nunca casa "você" seguido de espaço,
// e a régua ficaria verde em toda peça. Toda palavra acentuada usa esta forma.
const RE_VOCE = /(?<!\p{L})(?:voc[êe]s?|seu|sua|seus|suas|te|ti|contigo|lhe)(?!\p{L})/iu;

// O que a pessoa perde ou ganha, na palavra dela. ⚠️ A CONJUGAÇÃO INTEIRA: uma
// lista sem "custar" reprova "pode te custar caro", que está certo, e régua
// que manda reescrever texto bom é o jeito mais rápido de alguém desligá-la.
const RE_PERDA = /\b(?:perde|perdem|perdendo|perdeu|perder|deixa\s+de|deixam\s+de|some|somem|sumiu|sumiram|sumir|custa|custam|custou|custar|custando|gasta|gastam|gastou|gastar|paga|pagam|pagou|pagar|pagando|ganha|ganham|ganhou|ganhar|fecha|fecham|fechou|fechar|vende|vendem|vendeu|vender|venda|vendas|cliente|clientes|receita|caixa|hor[áa]rio|hor[áa]rios|marca[çc][ãa]o|marca[çc][õo]es|or[çc]amento|or[çc]amentos|dinheiro)\b/i;

// O ganho de serviço que não é dinheiro: o que a pessoa passa a saber, o que
// se resolve, o que ela para de sofrer ou volta a fazer, e o prazo por extenso.
// ⚠️ Cada forma pede o complemento ("saber POR QUE", "parar DE", "voltar A",
// "sem DOR"): o verbo solto ("cuidamos", "entendemos você") é a promessa vaga
// que esta trava existe para barrar. Fronteira Unicode, pelo mesmo motivo do
// RE_VOCE: "não", "três" e "mês" têm acento.
const RE_GANHO_SERVICO = new RegExp([
  // saber, entender ou descobrir o motivo, com até quatro palavras no meio
  // ("descubra na primeira visita por que")
  '(?:sab(?:e|er|endo|erá|ia)|entend(?:e|er|endo|a)|desc(?:o|u)br(?:e|ir|indo|a|o))(?:\\s+\\S+){0,4}?\\s+(?:por\\s*que|porqu[eê]|o\\s+motivo|a\\s+causa|o\\s+que\\s+(?:causa|trava|impede))',
  // resolver o problema
  'resolv(?:e|em|er|ido|ida|idos|idas|a|am|endo)',
  // parar de sofrer, voltar a fazer
  'p(?:ara|arar|are|arou|aram)\\s+de',
  'volt(?:a|ar|e|ou|am|ando)\\s+a',
  // o incômodo que sai
  'sem\\s+(?:dor|dores|fila|espera|medo|retrabalho)',
  'livre\\s+d[aoe]s?',
  // o prazo por extenso ("em uma semana", "em dois dias")
  'em\\s+(?:um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|quinze|trinta)\\s+(?:dias?|semanas?|m[eê]s|meses|horas?)',
].map((forma) => `(?<!\\p{L})(?:${forma})(?!\\p{L})`).join('|'), 'iu');

// O ganho concreto também serve ("a perda ou o ganho"): além da palavra da
// lista, o ganho de serviço acima e o número que diz quanto ou em quanto
// tempo ("aprovado em 30 dias").
const perdaOuGanho = (texto) => RE_PERDA.test(texto) || RE_GANHO_SERVICO.test(texto) || /\d/.test(texto);

// Jargão de quem montou o sistema. Erro nas superfícies de decisão (capa e linha
// 1), aviso no resto: no miolo a palavra técnica pode entrar DEPOIS da palavra da
// rua. O vocabulário do próprio negócio não é jargão: as palavras que a pessoa
// lista em `escrita-publica.md` ("não deve cortar") ficam de fora (`jargaoEm`).
const JARGAO = [
  ['lead', /\bleads?\b/i],
  ['follow-up', /\bfollow[\s-]?ups?\b/i],
  ['CRM', /\bCRM\b/],
  ['funil', /\bfunil\b|\bpipeline\b/i],
  ['roteamento', /\broteamento\b|\bdistribui[çc][ãa]o\b/i],
  // "arquitetura" sozinha é ofício de cliente; jargão é a de sistema
  ['arquitetura de sistema', /\barquitetura\s+(?:de\s+)?(?:software|sistemas?|dados|informa[çc][ãa]o|microsservi[çc]os?)\b/i],
  ['painel', /\bpain[ée]l\b|\bdashboard\b|\banalytics\b/i],
  ['rastreio', /\brastreio\b|\brastrear\b|\btagueamento\b/i],
  ['evento de conversão', /\bevento[s]?\s+(?:de\s+)?(?:convers[ãa]o|clique|venda)\b|\bdispara(?:r)?\s+evento\b/i],
  ['API/token', /\bAPI\b|\btoken\b|\bwebhook\b|\bcontainer\b/i],
  ['conversão', /\bconvers[ãa]o\b|\bqualificar\b|\bqualifica[çc][ãa]o\b/i],
];

// Uma ideia por frase: o teto (MAX_PALAVRAS_POR_FRASE) e o da capa
// (MAX_PALAVRAS_CAPA) moram em legenda.js, a fonte única dos números.
const normaliza = s => String(s || '').toLowerCase().replace(/\s+/g, '').replace(/,/g, '.');

// 🚨 NO TEXTO VISÍVEL DE UM SLIDE, DOIS ESPAÇOS SÃO FRONTEIRA DE ELEMENTO. O gate
// troca cada tag por UM espaço, então dois seguidos querem dizer que ali terminou
// um elemento (título, item, nota) e começou outro. Contar frase por cima dessa
// fronteira acusa "frase de 30 palavras" numa peça cujo maior texto tem 12.
const frasesDoSlide = s => String(s || '').split(/ {2,}/).flatMap(frasesDe);

// O vocabulário próprio (a lista "não deve cortar" de `escrita-publica.md`) é lido
// em caixa.js, porque vale também como nome próprio na caixa minúscula.

/**
 * Os jargões de um texto, menos o vocabulário próprio da pessoa.
 * @param {string} texto
 * @param {Set<string>} [vocabulario]
 * @returns {string[]} o nome de cada jargão achado
 */
function jargaoEm(texto, vocabulario = new Set()) {
  const achados = [];
  // a expressão do vocabulário que aparece inteira no texto sai antes da busca: o
  // jargão dentro dela ("distribuição" em "quadro de distribuição") é do ofício
  let resto = String(texto || '');
  for (const v of vocabulario) {
    if (!/\s/.test(v)) continue;
    const corpo = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    resto = resto.replace(new RegExp(`(?<![\\p{L}\\d])${corpo}(?![\\p{L}\\d])`, 'giu'), ' ');
  }
  for (const [nome, re] of JARGAO) {
    const todas = resto.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')) || [];
    if (todas.some(p => !vocabulario.has(p.toLowerCase()))) achados.push(nome);
  }
  return achados;
}

/**
 * A régua da peça com slides e legenda.
 * @param {object} p
 *   @param {string[]} [p.slides]       o texto visível de cada slide, na ordem
 *   @param {object}   [p.meta]         `numeros` (valor e fonte de cada número), `clienteReal` e `nomes` (os nomes próprios que a peça declara)
 *   @param {string}   [p.legenda]      o legenda.txt
 *   @param {string}   [p.tituloCapa]   o título da capa
 *   @param {string[]} [p.capaPartes]   a capa em partes (sobretítulo, título, subtítulo), cada uma um elemento
 *   @param {string[]} [p.trechos]      o texto de cada slide com um elemento do HTML por linha (a caixa)
 *   @param {boolean}  [p.minusculo]    decide a caixa por cima da memória (o cliente tem a dele)
 *   @param {string|false} [p.memoria] outro caminho para `escrita-publica.md`; false na peça de cliente
 *   @param {string[]} [p.vocabulario]  o vocabulário próprio, por cima do da memória
 * @returns {{erros: string[], avisos: string[], ia: {texto: string, julgamento: boolean}[]}}
 */
function confereCopy(p = {}) {
  const erros = [];
  const avisos = [];
  const slides = Array.isArray(p.slides) ? p.slides.map(s => String(s || '')) : [];
  const meta = p.meta && typeof p.meta === 'object' ? p.meta : {};
  const vocabulario = vocabularioDe(p);

  const inventadas = [];
  const proibidas = proibidasDe(p);
  slides.forEach((s, i) => {
    for (const [nome, re] of proibidas) {
      if (re.test(s)) erros.push(`slide ${i + 1} diz "${nome}" · a memória não deixa (_memoria/prova.md e escrita-publica.md, "O que evitar")`);
    }
    if (RE_CASE.test(s) && meta.clienteReal !== true) {
      erros.push(`slide ${i + 1} diz "case" · a palavra é reservada a cliente real (_memoria/prova.md); cena inventada mostra cena, mecanismo e método`);
    }
    for (const [nome, re] of INVENTADAS) {
      if (re.test(s)) inventadas.push(`"${nome}" no slide ${i + 1}`);
    }
    for (const re of RE_RESULTADO) {
      if (re.test(s)) { inventadas.push(`resultado de venda no slide ${i + 1}`); break; }
    }
    if (RE_DEPOIMENTO.test(s)) inventadas.push(`depoimento no slide ${i + 1}`);
    if (RE_TRAVESSAO.test(s)) erros.push(`slide ${i + 1} tem travessão · zero em texto que o público vê`);
    const seco = pedeSeguirSemMotivo(s);
    if (seco) erros.push(`slide ${i + 1} pede para seguir com "${seco}" · troque o pedido pelo motivo de seguir`);
  });

  // Um aviso só, com a conta: o que interessa é quanto a peça afirma sem medir.
  if (inventadas.length) {
    avisos.push(`a peça afirma ${inventadas.length} coisa(s) que podem não estar medidas (${inventadas.join(', ')}) · em conteúdo, só como cena ilustrativa; em venda direta, só o que está em _memoria/prova.md`);
  }

  confereNumeros(slides, meta, erros);
  confereCapaCurta(p, avisos);
  confereBalcao(p, slides, vocabulario, erros, avisos);
  confereCaixa(p, slides, erros);
  // o padrão de IA que a máquina vê com certeza reprova; o de julgamento (o contraste) avisa
  const ia = padroesDosSlides(slides);
  for (const h of ia) (h.julgamento ? avisos : erros).push(h.texto);
  return { erros, avisos, ia };
}

/** Todo número da arte tem fonte declarada em `meta.numeros`. */
function confereNumeros(slides, meta, erros) {
  const lista = Array.isArray(meta.numeros) ? meta.numeros : [];
  const declarados = new Set(lista.map(n => normaliza(n && n.valor)));
  const semFonte = [];
  slides.forEach((s, i) => {
    for (const m of s.matchAll(RE_NUMERO)) {
      const achado = m[0].trim();
      const chave = normaliza(achado);
      // "21x" declarado cobre "21 x", "21x" e "21 vezes"; "9" cobre "9 horas"; e a
      // unidade curta cobre a por extenso: "9h" cobre "9 horas", "30d" cobre "30 dias".
      // Só a unidade curta: "10 mil" não cobre "10 milhões", e "9" não cobre "90 dias"
      const numero = normaliza((achado.match(/\d+(?:[.,]\d+)*/) || [''])[0]);
      const comeca = d => /\d(?:h|min|d)$/.test(d) && chave.startsWith(d) && /^\p{L}/u.test(chave.slice(d.length));
      const coberto = [...declarados].some(d => d === chave || d === numero || comeca(d) || d.startsWith(numero + 'x') && /vezes|x/.test(chave));
      if (!coberto) semFonte.push(`slide ${i + 1}: "${achado}"`);
    }
  });
  if (semFonte.length) erros.push(`número na arte sem fonte declarada em meta.numeros: ${semFonte.join(' · ')} · número sem fonte não se publica`);
  for (const n of lista) {
    if (!n || !n.valor || !n.fonte) erros.push(`meta.numeros tem entrada sem valor ou sem fonte: ${JSON.stringify(n)}`);
  }
}

/** A capa curta (aviso): o título até MAX_PALAVRAS_CAPA palavras. */
function confereCapaCurta(p, avisos) {
  if (p.tituloCapa && palavrasDe(p.tituloCapa) > MAX_PALAVRAS_CAPA) {
    avisos.push(`a capa tem ${palavrasDe(p.tituloCapa)} palavras · o título da capa vai até ${MAX_PALAVRAS_CAPA} (_memoria/escrita-publica.md, "Linguagem de balcão")`);
  }
}

/** A linguagem de balcão: erro na capa e na linha 1 da legenda, aviso no miolo. */
function confereBalcao(p, slides, vocabulario, erros, avisos) {
  // As DUAS superfícies onde a pessoa decide se continua: a capa, que ela vê no
  // feed, e a linha 1 da legenda, que é o que aparece antes do "ver mais".
  // O tamanho da frase da legenda é o de confereFrasesDaLegenda (legenda.js),
  // para as duas réguas darem o mesmo veredito na mesma legenda.
  const superficies = [
    // a capa em partes chega com a fronteira de elemento (dois espaços)
    ['a capa', Array.isArray(p.capaPartes) ? p.capaPartes.map(String).join('  ') : String(p.tituloCapa || ''), frasesDoSlide],
    ['a linha 1 da legenda', String(p.legenda || '').split('\n')[0].trim(), () => []],
  ].filter(([, t]) => t);

  for (const [onde, t, frases] of superficies) {
    if (!RE_VOCE.test(t)) {
      erros.push(`${onde} não fala COM a pessoa · falta "você" ou "seu" (_memoria/escrita-publica.md, "Linguagem de balcão")`);
    }
    for (const nome of jargaoEm(t, vocabulario)) {
      erros.push(`${onde} usa "${nome}" · na capa e na linha 1 entra a palavra da rua; o termo técnico só depois dela`);
    }
    for (const f of frases(t)) {
      if (palavrasDe(f) > MAX_PALAVRAS_POR_FRASE) {
        erros.push(`${onde} tem frase de ${palavrasDe(f)} palavras · o teto é ${MAX_PALAVRAS_POR_FRASE}, uma ideia por frase`);
      }
    }
  }

  // A perda dita, não sugerida: basta UMA das duas superfícies dizer o que a
  // pessoa perde ou ganha.
  if (superficies.length && !superficies.some(([, t]) => perdaOuGanho(t))) {
    erros.push('nem a capa nem a linha 1 dizem o que a pessoa perde ou ganha · venda, cliente, horário, perde, custa, some; saber por que, resolver, parar de, voltar a, sem dor; ou o número do ganho');
  }

  // No miolo, as mesmas regras AVISAM. A capa (slide 1) já foi cobrada acima.
  slides.forEach((s, i) => {
    if (i === 0) return;
    for (const nome of jargaoEm(s, vocabulario)) {
      avisos.push(`slide ${i + 1} usa "${nome}" · confira se a palavra da rua aparece antes dele`);
    }
    const longas = frasesDoSlide(s).filter(f => palavrasDe(f) > MAX_PALAVRAS_POR_FRASE);
    if (longas.length) {
      avisos.push(`slide ${i + 1} tem ${longas.length} frase(s) acima de ${MAX_PALAVRAS_POR_FRASE} palavras (a maior tem ${Math.max(...longas.map(palavrasDe))})`);
    }
  });

  // A legenda, pela mesma conta da régua da legenda: erro na linha 1, aviso no
  // miolo, o fecho e o crédito de fora.
  const frasesDaLegenda = confereFrasesDaLegenda(p.legenda);
  erros.push(...frasesDaLegenda.erros);
  avisos.push(...frasesDaLegenda.avisos);
}

/** A caixa minúscula, quando a memória (ou quem chama) a liga. */
function confereCaixa(p, slides, erros) {
  if (!minusculoPedido(p)) return;
  // o nome próprio vale na peça inteira; com um elemento por linha (p.trechos),
  // dois elementos vizinhos não parecem meio de frase. Somam-se os nomes que a peça
  // declara em meta.nomes (a "Carla" que abre a notificação e não aparece no meio de
  // frase nenhuma) e o vocabulário da memória
  const declarados = p.meta && Array.isArray(p.meta.nomes) ? p.meta.nomes.map(String) : [];
  const nomes = [...nomesDaPeca(Array.isArray(p.trechos) ? p.trechos : slides), ...declarados, ...nomesDoVocabulario(p)];
  slides.forEach((s, i) => {
    const m = maiusculasIndevidas(Array.isArray(p.trechos) && p.trechos[i] !== undefined ? p.trechos[i] : s, { nomes });
    if (m.length) erros.push(`slide ${i + 1} começa trecho com maiúscula (${m.join(', ')}) · a caixa da marca é minúscula, menos nome próprio e sigla (_memoria/escrita-publica.md, "Caixa")`);
  });
}

module.exports = {
  confereCopy, lerVocabulario, vocabularioDe, jargaoEm,
  PROIBIDAS, proibidasDe, INVENTADAS, JARGAO, RE_NUMERO, MAX_PALAVRAS_POR_FRASE, MAX_PALAVRAS_CAPA,
  RE_VOCE, RE_PERDA, perdaOuGanho, RE_RESULTADO, RE_DEPOIMENTO, RE_CASE, RE_TRAVESSAO, palavrasDe, frasesDe,
};
