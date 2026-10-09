// Prova que a régua do texto público (copy.js) ainda sabe REPROVAR.
//
// Cada checagem tem DOIS casos: um que reprova e o par que prova que ela fica
// quieta quando não deve falar. Régua que só sabe dizer "ok" não mede nada.
//
//   node scripts/lib/teste-copy.mjs

import { createRequire } from 'node:module';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resumoTap } from './junit.mjs';
const require_ = createRequire(import.meta.url);
const { confereCopy, lerVocabulario, jargaoEm } = require_('./copy.js');
const { lerCaixa, minusculoPedido, minusculizar, lerProibidas } = require_('./caixa.js');

// A memória de mentira: nenhuma prova depende do módulo real do workspace.
const PASTA = mkdtempSync(join(tmpdir(), 'copy-'));
const memoria = (nome, conteudo) => { const arq = join(PASTA, nome); writeFileSync(arq, conteudo); return arq; };
// o formato do módulo do template: a linha de caixa e a lista do vocabulário próprio
const MEM_NORMAL = memoria('normal.md', '# Escrita pública\n\nO vocabulário do seu próprio negócio não é jargão. **Liste aqui as palavras suas\nque esta régua não deve cortar:** *(a definir)*\n\n## Caixa\n\n**Caixa:** normal\n');
const MEM_MINUSCULA = memoria('minuscula.md', '# Escrita pública\n\n## Caixa\n\n**Caixa:** minúscula\n');
const MEM_SEM_LINHA = memoria('sem-linha.md', '# Escrita pública\n\n## Linguagem de balcão\n\nfale com a pessoa.\n');
const MEM_MINUSCULA_VOCAB = memoria('minuscula-vocab.md', '# Escrita pública\n\n**Liste aqui as palavras suas\nque esta régua não deve cortar:** Revit, Pão da Vila\n\n## Caixa\n\n**Caixa:** minúscula\n');
const MEM_VOCABULARIO = memoria('vocabulario.md', '# Escrita pública\n\nO vocabulário do seu próprio negócio não é jargão. **Liste aqui as palavras suas\nque esta régua não deve cortar:** funil, painel; lead\n\n## Caixa\n\n**Caixa:** normal\n');

let passou = 0;
const falhas = [];
const rodar = entrada => confereCopy({ memoria: MEM_NORMAL, ...entrada });

function caso(nome, entrada, esperado) {
  const { erros, avisos } = rodar(entrada);
  const achou = [...erros, ...avisos].some(m => m.includes(esperado.trecho));
  const bate = esperado.reprova ? achou : !achou;
  if (bate) { passou++; console.log(`  ok  ${nome}`); }
  else {
    falhas.push(nome);
    console.log(`  XX  ${nome}`);
    console.log(`      esperava ${esperado.reprova ? 'reprovar' : 'ficar quieta'} em "${esperado.trecho}"`);
    console.log(`      saiu: ${JSON.stringify([...erros, ...avisos], null, 0)}`);
  }
}

/** Separa ERRO de AVISO, que é a diferença entre "não publica" e "olha isso".
 *  Sem esta distinção, uma régua que virasse tudo erro passaria no teste. */
function soAvisa(nome, entrada, trecho) {
  const { erros, avisos } = rodar(entrada);
  const noAviso = avisos.some(m => m.includes(trecho));
  const noErro = erros.some(m => m.includes(trecho));
  if (noAviso && !noErro) { passou++; console.log(`  ok  ${nome}`); }
  else {
    falhas.push(nome);
    console.log(`  XX  ${nome}`);
    console.log(`      esperava "${trecho}" só em AVISO (aviso: ${noAviso}, erro: ${noErro})`);
    console.log(`      saiu: erros=${JSON.stringify(erros)} avisos=${JSON.stringify(avisos)}`);
  }
}

/** O par do de cima: tem que estar em ERRO, e não só em aviso. */
function eErro(nome, entrada, trecho) {
  const { erros, avisos } = rodar(entrada);
  if (erros.some(m => m.includes(trecho))) { passou++; console.log(`  ok  ${nome}`); }
  else {
    falhas.push(nome);
    console.log(`  XX  ${nome}`);
    console.log(`      esperava "${trecho}" em ERRO`);
    console.log(`      saiu: erros=${JSON.stringify(erros)} avisos=${JSON.stringify(avisos)}`);
  }
}

function confere(nome, ok, detalhe) {
  if (ok) { passou++; console.log(`  ok  ${nome}`); }
  else { falhas.push(nome); console.log(`  XX  ${nome}${detalhe ? `\n      ${detalhe}` : ''}`); }
}

// A peça que cumpre a régua inteira: fala com a pessoa, diz a perda, todo número
// com fonte. Uma padaria de bairro, fictícia.
const BOA = {
  slides: [
    'Você perde encomenda enquanto o cliente espera resposta.',
    'Quem responde em 5 minutos fecha 3x mais. Depois de 30 minutos, o cliente já pediu em outro lugar.',
    'Ninguém demora de propósito. A mensagem cai no meio do bom dia do grupo.',
    'Às 7h você abre o celular e já sabe quem pediu bolo para sábado.',
    'A conversa fixada no topo, com a encomenda anotada.',
    'Hoje, fixe a conversa de quem encomendou e responda primeiro a ela.',
  ],
  meta: {
    numeros: [{ valor: '3x', fonte: 'pesquisa de tempo de resposta (o link no legenda.md)' }, { valor: '5 minutos', fonte: 'a mesma pesquisa' }, { valor: '30 minutos', fonte: 'a mesma pesquisa' }, { valor: '7h', fonte: 'exemplo' }],
  },
  legenda: 'Todo dia você perde encomenda sem saber, e o motivo é o relógio.\nQuem responde em cinco minutos fecha antes do concorrente.\nHoje, fixe a conversa de quem encomendou e responda primeiro.',
  tituloCapa: 'Você perde encomenda enquanto o cliente espera',
};

// A capa e a linha 1 como elas costumam sair antes da régua: falam DE um
// assunto, com jargão, sem dizer o que a pessoa perde.
const COMO_ERA = {
  tituloCapa: 'Cinco minutos ou cinco dias',
  legenda: 'Ninguém demora cinco dias pra responder um lead de propósito.\nO lead cai num lugar que ninguém abre: formulário que manda e-mail pra caixa compartilhada.\nResponda hoje quem pediu orçamento ontem.',
};

const com = (mudancas) => ({ ...BOA, ...mudancas, meta: { ...BOA.meta, ...(mudancas.meta || {}) } });
const slide = (i, texto) => { const s = BOA.slides.slice(); s[i] = texto; return s; };

console.log('\n== a peça que cumpre a régua passa limpa ==');
{
  const { erros, avisos } = rodar(BOA);
  confere('peça boa sem erro e sem aviso', erros.length === 0 && avisos.length === 0, JSON.stringify([...erros, ...avisos]));
}
caso('peça sem meta não quebra, e cobra o número sem fonte', { ...BOA, meta: undefined }, { reprova: true, trecho: 'sem fonte declarada' });

console.log('\n== 1 · o que o texto público não diz ==');
caso('reprova "garantido"', com({ slides: slide(3, 'Resultado garantido em dez dias.') }), { reprova: true, trecho: 'garantia' });
caso('reprova jargão de guru "alavancar"', com({ slides: slide(3, 'Você alavanca a padaria inteira.') }), { reprova: true, trecho: 'alavancar' });
caso('reprova "destravar"', com({ slides: slide(3, 'Você destrava as vendas do balcão.') }), { reprova: true, trecho: 'destravar' });
caso('fica quieta na peça boa (proibidas)', BOA, { reprova: false, trecho: 'a memória não deixa' });
eErro('"case" sem cliente real reprova', com({ slides: slide(4, 'Um case de padaria que respondeu primeiro.') }), 'reservada a cliente real');
caso('"case" com cliente real passa', com({ slides: slide(4, 'O case da padaria que respondeu primeiro.'), meta: { clienteReal: true } }), { reprova: false, trecho: 'reservada a cliente real' });
caso('"cases" dentro de outra palavra não conta', com({ slides: slide(4, 'Casesmo não existe, é só teste.') }), { reprova: false, trecho: 'reservada a cliente real' });

console.log('\n== 2 · o que pode não estar medido: avisa com a conta, não reprova ==');
caso('avisa "+37% de receita"', com({ slides: slide(3, 'A padaria teve 37% a mais de receita no mês.') }), { reprova: true, trecho: 'podem não estar medidas' });
caso('avisa "as vendas dobraram"', com({ slides: slide(3, 'As vendas dobraram em duas semanas.') }), { reprova: true, trecho: 'podem não estar medidas' });
caso('avisa depoimento entre aspas com dona', com({ slides: slide(4, '"Nunca mais perdi uma encomenda de bolo", diz a dona da padaria.') }), { reprova: true, trecho: 'podem não estar medidas' });
caso('avisa "24/7"', com({ slides: slide(3, 'O atendimento responde 24/7 e você dorme.') }), { reprova: true, trecho: 'podem não estar medidas' });
caso('avisa "meu cliente"', com({ slides: slide(4, 'Um cliente meu fez isso: meu cliente dobrou a agenda.') }), { reprova: true, trecho: 'podem não estar medidas' });
caso('a contagem sai no aviso', com({ slides: slide(3, 'As vendas dobraram e o atendimento responde 24/7.') }), { reprova: true, trecho: 'afirma 2 coisa(s)' });
soAvisa('nenhuma delas vira ERRO', com({ slides: slide(3, 'As vendas dobraram em duas semanas.') }), 'podem não estar medidas');
caso('aceita cenário com nome e papel, sem aspas', com({ slides: slide(4, 'Carla, da recepção, abre o celular às 7h e vê quem chegou.') }), { reprova: false, trecho: 'podem não estar medidas' });
caso('aceita expressão citada longe do papel de gente', com({ slides: slide(2, 'O direct que só o dono vê. Por isso "responder na hora" nunca virou meta.') }), { reprova: false, trecho: 'podem não estar medidas' });

console.log('\n== 3 · travessão ==');
eErro('reprova travessão no slide', com({ slides: slide(2, 'Só que ninguém demora — de propósito.') }), 'tem travessão');
eErro('o slide com o pedido de seguir seco reprova', com({ slides: slide(5, 'me segue pra mais.') }), 'pede para seguir');
caso('o motivo de seguir, sem a fórmula seca, passa', com({ slides: slide(5, 'toda semana, uma receita nova do balcão.') }), { reprova: false, trecho: 'pede para seguir' });
caso('fica quieta sem travessão', BOA, { reprova: false, trecho: 'travessão' });

console.log('\n== 4 · todo número tem fonte ==');
caso('reprova número sem fonte declarada', com({ slides: slide(1, 'Responder em 5 minutos vale 3x. E 83% das padarias erram.') }), { reprova: true, trecho: 'sem fonte declarada' });
caso('reprova entrada sem fonte', com({ meta: { numeros: [...BOA.meta.numeros, { valor: '12' }] } }), { reprova: true, trecho: 'sem valor ou sem fonte' });
caso('aceita R$ declarado', com({ slides: slide(3, 'O Google te trouxe 6 pedidos e R$ 14 mil.'), meta: { numeros: [...BOA.meta.numeros, { valor: '6', fonte: 'exemplo' }, { valor: 'R$ 14', fonte: 'exemplo' }] } }), { reprova: false, trecho: 'sem fonte declarada' });
caso('fica quieta com todos os números declarados', BOA, { reprova: false, trecho: 'sem fonte' });
// o "2" do passo e o "Dias" do título vizinho chegam separados por DOIS espaços
caso('não cola número de um elemento na unidade do vizinho', com({ slides: slide(4, 'Dez dias.  1  Dia 1 · Eu entro como cliente  2  Dias 2 a 5 · Vejo por dentro') }), { reprova: false, trecho: 'sem fonte declarada' });
caso('mas número e unidade no mesmo texto continuam cobrados', com({ slides: slide(4, 'São 4 dias até a resposta.') }), { reprova: true, trecho: 'sem fonte declarada' });
// o número declarado cobre o mesmo número, nunca outro que começa igual
caso('"9" declarado NÃO cobre "90 dias"', { ...BOA, slides: ['Você perde 90 dias de encomenda.'], meta: { numeros: [{ valor: '9', fonte: 'exemplo' }] } }, { reprova: true, trecho: 'sem fonte declarada' });
caso('"1" declarado NÃO cobre "10 mil" nem "12h"', { ...BOA, slides: ['Você perde 10 mil por mês.', 'Às 12h ninguém responde.'], meta: { numeros: [{ valor: '1', fonte: 'exemplo' }] } }, { reprova: true, trecho: 'sem fonte declarada' });
caso('"9" declarado cobre "9 horas"', { ...BOA, slides: ['Você perde 9 horas por semana.'], meta: { numeros: [{ valor: '9', fonte: 'exemplo' }] } }, { reprova: false, trecho: 'sem fonte declarada' });
caso('"21x" declarado cobre "21 vezes"', { ...BOA, slides: ['Quem responde rápido vende 21 vezes mais.'], meta: { numeros: [{ valor: '21x', fonte: 'exemplo' }] } }, { reprova: false, trecho: 'sem fonte declarada' });
// a unidade curta cobre a por extenso, e só ela
caso('"9h" declarado cobre "9 horas"', { ...BOA, slides: ['Você perde 9 horas por semana.'], meta: { numeros: [{ valor: '9h', fonte: 'exemplo' }] } }, { reprova: false, trecho: 'sem fonte declarada' });
caso('"10 mil" declarado NÃO cobre "10 milhões"', { ...BOA, slides: ['São 10 milhões de pessoas.'], meta: { numeros: [{ valor: '10 mil', fonte: 'exemplo' }] } }, { reprova: true, trecho: 'sem fonte declarada' });
// o começo do achado só cobre quando o declarado é o número inteiro dele
caso('"2" declarado NÃO cobre "26 h"', com({ slides: slide(3, 'Some 26 h por mês no balcão.'), meta: { numeros: [...BOA.meta.numeros, { valor: '2', fonte: 'exemplo' }] } }), { reprova: true, trecho: '"26 h"' });
caso('"1" declarado NÃO cobre "1,5 h"', com({ slides: slide(3, 'Some 1,5 h por dia no balcão.'), meta: { numeros: [...BOA.meta.numeros, { valor: '1', fonte: 'exemplo' }] } }), { reprova: true, trecho: '"1,5 h"' });
caso('"R$ 14" declarado cobre "R$ 14 mil"', com({ slides: slide(3, 'O Google te trouxe R$ 14 mil.'), meta: { numeros: [...BOA.meta.numeros, { valor: 'R$ 14', fonte: 'exemplo' }] } }), { reprova: false, trecho: 'sem fonte declarada' });
caso('"9h" declarado cobre "9 horas"', { ...BOA, slides: ['Você perde 9 horas por semana.'], meta: { numeros: [{ valor: '9h', fonte: 'exemplo' }] } }, { reprova: false, trecho: 'sem fonte declarada' });

console.log('\n== 5 · capa curta (aviso) ==');
soAvisa('avisa capa com 12 palavras', com({ tituloCapa: 'Você perde encomenda toda semana porque a mensagem cai no grupo errado' }), 'a capa tem');
caso('fica quieta com capa de 6', BOA, { reprova: false, trecho: 'a capa tem' });

// A régua PRINCIPAL. O último caso da seção prova isso: a capa como ela costuma
// sair, falando de um assunto, reprova.
console.log('\n== 6 · a linguagem de balcão ==');
eErro('reprova capa que não fala com a pessoa', com({ tituloCapa: 'O cliente esfria em trinta minutos' }), 'a capa não fala COM a pessoa');
caso('fica quieta com "você" na capa', BOA, { reprova: false, trecho: 'a capa não fala COM' });
eErro('reprova linha 1 que não fala com a pessoa', com({ legenda: 'Ninguém demora cinco dias de propósito.\nA venda some no meio do caminho.\nHoje, responda quem pediu ontem.' }), 'a linha 1 da legenda não fala COM a pessoa');
eErro('reprova peça que não diz o que a pessoa perde', com({
  tituloCapa: 'Você responde quando dá',
  legenda: 'Você responde quando dá, e às vezes não dá.\nO seu concorrente responde antes.\nHoje, responda quem pediu ontem.',
}), 'nem a capa nem a linha 1 dizem o que a pessoa perde');
caso('basta a capa dizer a perda', com({ legenda: 'Você responde quando dá, e às vezes não dá.\nO seu concorrente responde antes.\nHoje, responda quem pediu ontem.' }), { reprova: false, trecho: 'dizem o que a pessoa perde' });
// a conjugação inteira: uma lista sem "custar" reprovou "pode te custar caro"
caso('conhece a conjugação inteira do verbo de perda', com({
  tituloCapa: 'Isso pode te custar caro',
  legenda: 'Isso pode te custar caro, e você nem fica sabendo.\nO pedido entrou sem ninguém ver.\nHoje, responda quem pediu ontem.',
}), { reprova: false, trecho: 'dizem o que a pessoa perde' });
caso('o ganho concreto com número basta', com({
  tituloCapa: 'Você entrega o bolo em 2 dias',
  legenda: 'Você entrega o bolo em 2 dias, sem correria na véspera.\nA padaria do lado ainda anota no papel.\nHoje, anote a próxima encomenda na conversa fixada.',
  meta: { numeros: [...BOA.meta.numeros, { valor: '2 dias', fonte: 'exemplo' }] },
}), { reprova: false, trecho: 'dizem o que a pessoa perde' });
eErro('reprova frase longa na capa', com({ tituloCapa: 'Você perde venda toda vez que o cliente manda mensagem e ninguém responde na hora' }), 'a capa tem frase de 15 palavras');
soAvisa('frase longa no miolo só avisa', com({ slides: slide(2, 'Ninguém demora de propósito, e a mensagem que o cliente mandou cai num lugar que ninguém abre nunca.') }), 'acima de 14 palavras');
// no texto visível do slide, DOIS espaços separam elementos (título, item, nota)
caso('não gruda o fim de um elemento no começo do outro', com({ slides: slide(2, 'Quem espera aparece com o relógio  A tela abre a conversa com o negócio do lado  Quanto tempo até a primeira resposta  por conversa, na tela') }), { reprova: false, trecho: 'acima de 14 palavras' });
caso('mas frase longa DENTRO de um elemento continua avisando', com({ slides: slide(2, 'A tela abre a conversa com o negócio do lado e mostra quem está esperando gente desde ontem à tarde.') }), { reprova: true, trecho: 'acima de 14 palavras' });
caso('a capa em partes respeita a fronteira de elemento', com({ capaPartes: ['para quem vende bolo de encomenda pelo WhatsApp toda semana', 'Você perde encomenda enquanto o cliente espera'] }), { reprova: false, trecho: 'a capa tem frase' });
eErro('reprova jargão na capa', com({ tituloCapa: 'Você perde lead no meio do funil' }), 'a capa usa "lead"');
eErro('reprova jargão na linha 1', com({ legenda: 'Você perde lead sem saber, e o motivo é o relógio.\nQuem responde em cinco minutos fecha mais.\nHoje, responda quem pediu ontem.' }), 'a linha 1 da legenda usa "lead"');
soAvisa('jargão no miolo só avisa', com({ slides: slide(4, 'A conversa do CRM com a encomenda anotada.') }), 'usa "CRM"');
caso('"arquitetura" na capa NÃO é jargão (é ofício)', com({ tituloCapa: 'Você perde o cliente de arquitetura no orçamento' }), { reprova: false, trecho: 'usa "arquitetura' });
eErro('"arquitetura de software" na capa continua jargão', com({ tituloCapa: 'Você perde venda com arquitetura de software' }), 'arquitetura de sistema');
{
  const { erros } = rodar(com(COMO_ERA));
  const pegou = erros.filter(e => /não fala COM a pessoa|dizem o que a pessoa perde|usa "lead"/.test(e));
  confere(`a capa que fala DE um assunto reprova (${pegou.length} erros de balcão)`, pegou.length >= 2, JSON.stringify(erros));
}

console.log('\n== 7 · o vocabulário próprio não é jargão (escrita-publica.md) ==');
confere('a lista "(a definir)" vem vazia', lerVocabulario('**Liste aqui as palavras suas\nque esta régua não deve cortar:** *(a definir)*\n').size === 0);
{
  const v = lerVocabulario('**Liste aqui as palavras suas\nque esta régua não deve cortar:** funil, painel; lead\n\n## Caixa\n');
  confere('a lista preenchida vem inteira, até a linha em branco', v.size === 3 && v.has('funil') && v.has('painel') && v.has('lead'), JSON.stringify([...v]));
}
confere('a expressão do vocabulário protege o jargão que está dentro dela',
  jargaoEm('o seu quadro de distribuição pode pegar fogo', new Set(['quadro de distribuição'])).length === 0);
confere('o mesmo jargão fora da expressão continua jargão',
  jargaoEm('a distribuição das tarefas', new Set(['quadro de distribuição'])).join() === 'roteamento');
confere('o vocabulário entre aspas sai sem aspas', [...lerVocabulario('**Palavras suas que esta régua não deve cortar:** "PageSpeed", agenda\n')][0] === 'pagespeed');
confere('sem a frase, nenhum vocabulário', lerVocabulario('# Escrita pública\n\nnada aqui.\n').size === 0);
confere('jargaoEm tira o vocabulário próprio', jargaoEm('o seu funil e o seu CRM', new Set(['funil'])).join() === 'CRM');
caso('com "funil" e "lead" no vocabulário da memória, a capa passa', com({ tituloCapa: 'Você perde lead no meio do funil', memoria: MEM_VOCABULARIO }), { reprova: false, trecho: 'a capa usa' });
eErro('o que não está no vocabulário continua jargão', com({ tituloCapa: 'Você perde venda no seu CRM', memoria: MEM_VOCABULARIO }), 'a capa usa "CRM"');

console.log('\n== 8 · a palavra que a pessoa recusou (escrita-publica.md, "O que evitar") ==');
{
  const MEM_RECUSA = memoria('recusa.md', '# Escrita pública\n\n**Palavras que o texto público não diz:** "milagre", cura definitiva; promoção imperdível\n\n## Caixa\n\n**Caixa:** normal\n');
  confere('a linha da memória vem inteira, sem aspas', JSON.stringify(lerProibidas(require_('node:fs').readFileSync(MEM_RECUSA, 'utf8'))) === '["milagre","cura definitiva","promoção imperdível"]');
  confere('"(a definir)" não vira palavra proibida', lerProibidas('**Palavras que o texto público não diz:** *(a definir)*\n').length === 0);
  confere('a orientação em itálico embaixo da linha não vira palavra proibida',
    lerProibidas('**Palavras que o texto público não diz:** *(a definir)*\n*As palavras que você recusa (ex.: milagre, promoção).*\n').length === 0);
  confere('a lista que quebra em duas linhas vem inteira, e para na orientação',
    JSON.stringify(lerProibidas('**Palavras que o texto público não diz:** milagre,\ncura definitiva\n*ex.: outra coisa*\n')) === '["milagre","cura definitiva"]');
  confere('o molde do template vem sem nenhuma palavra proibida',
    lerProibidas(require_('node:fs').readFileSync(new URL('../../_memoria/escrita-publica.md', import.meta.url), 'utf8')).length === 0);
  const comRecusa = (texto) => com({ slides: slide(3, texto), memoria: MEM_RECUSA });
  eErro('o slide com a palavra recusada reprova', comRecusa('Promoção imperdivel de sessão nesta semana'), 'diz "promoção imperdível"');
  caso('sem a palavra, o mesmo slide passa', comRecusa('Sessão nova nesta semana, com hora marcada'), { reprova: false, trecho: 'diz "promoção' });
}
caso('quem chama passa o vocabulário por cima da memória', com({ tituloCapa: 'Você perde venda no seu CRM', vocabulario: ['CRM'] }), { reprova: false, trecho: 'a capa usa' });

console.log('\n== 8 · a caixa: opção da marca, lida de "**Caixa:**" ==');
confere('lerCaixa: "**Caixa:** minúscula" liga', lerCaixa('## Caixa\n\n**Caixa:** minúscula\n') === 'minuscula');
confere('lerCaixa: sem acento e em maiúscula também liga', lerCaixa('- **caixa:** MINUSCULA') === 'minuscula');
confere('lerCaixa: "**Caixa:** normal" desliga', lerCaixa('## Caixa\n\n**Caixa:** normal\n') === 'normal');
confere('lerCaixa: sem a linha vale normal', lerCaixa('## Caixa\n\nO padrão é a caixa normal.\n') === 'normal');
confere('lerCaixa: a frase que cita `**Caixa:** minúscula` no meio do parágrafo não liga', lerCaixa('troque a linha acima para `**Caixa:** minúscula`: as réguas\n') === 'normal');
confere('minusculoPedido: memória minúscula liga', minusculoPedido({ memoria: MEM_MINUSCULA }) === true);
confere('minusculoPedido: memória normal, sem linha ou ausente desliga', [MEM_NORMAL, MEM_SEM_LINHA, join(PASTA, 'nao-existe.md')].every(m => minusculoPedido({ memoria: m }) === false));
confere('minusculoPedido: quem chama decide por cima', minusculoPedido({ memoria: MEM_MINUSCULA, minusculo: false }) === false && minusculoPedido({ memoria: MEM_NORMAL, minusculo: true }) === true);
{
  const minuscula = BOA.slides.map(s => minusculizar(s));
  caso('memória minúscula reprova o slide que começa com maiúscula', com({ memoria: MEM_MINUSCULA }), { reprova: true, trecho: 'a caixa da marca é minúscula' });
  caso('memória normal não cobra caixa', com({ memoria: MEM_NORMAL }), { reprova: false, trecho: 'a caixa da marca' });
  caso('memória sem a linha não cobra caixa', com({ memoria: MEM_SEM_LINHA }), { reprova: false, trecho: 'a caixa da marca' });
  caso('quem chama desliga por cima da memória (o cliente)', com({ memoria: MEM_MINUSCULA, minusculo: false }), { reprova: false, trecho: 'a caixa da marca' });
  caso('a caixa deixa passar o slide em minúsculo', com({ minusculo: true, slides: minuscula }), { reprova: false, trecho: 'a caixa da marca' });
  caso('a caixa lê o trecho de cada elemento (a notificação embaixo do título)', com({ minusculo: true, slides: minuscula, trechos: minuscula.map((s, i) => i === 1 ? s + '\nEncomenda · bolo da Paula' : s) }), { reprova: true, trecho: 'Encomenda' });
  caso('a caixa deixa passar nome próprio e sigla no começo do trecho', com({ minusculo: true, slides: minuscula, trechos: minuscula.map((s, i) => i === 1 ? s + '\nWhatsApp da Paula\nIA no balcão' : s) }), { reprova: false, trecho: 'a caixa da marca' });
  // o cabeçalho "Pedido" logo abaixo de "...da Carla" não é meio de frase
  // a lista geral só tem marca universal; o nome do ofício e da marca da pessoa vem do vocabulário dela
  caso('nome de ferramenta de ofício não está na lista geral (Revit reprova)', com({ minusculo: true, slides: minuscula.map((s, i) => i === 1 ? 'Revit abre o projeto.' : s) }), { reprova: true, trecho: 'Revit' });
  caso('cidade não está na lista geral (Belo reprova)', com({ minusculo: true, slides: minuscula.map((s, i) => i === 1 ? 'Belo Horizonte encomenda cedo.' : s) }), { reprova: true, trecho: 'Belo' });
  caso('marca universal continua passando (WhatsApp)', com({ minusculo: true, slides: minuscula.map((s, i) => i === 1 ? 'WhatsApp abre o pedido.' : s) }), { reprova: false, trecho: 'a caixa da marca' });
  caso('o vocabulário da memória vale como nome próprio na caixa', com({ memoria: MEM_MINUSCULA_VOCAB, slides: minuscula.map((s, i) => i === 1 ? 'Revit abre o projeto. Pão da Vila abre às 6h.' : s), meta: { numeros: [...BOA.meta.numeros, { valor: '6h', fonte: 'exemplo' }] } }), { reprova: false, trecho: 'a caixa da marca' });
  caso('a caixa não toma o elemento vizinho por meio de frase', com({ minusculo: true, slides: minuscula.map((s, i) => i === 1 ? s + ' encomenda da Carla Pedido Contrato' : s), trechos: minuscula.map((s, i) => i === 1 ? s + '\nencomenda da Carla\nPedido\nContrato' : s) }), { reprova: true, trecho: 'Pedido' });
  // o monograma do contato (a letra no círculo do celular, a inicial do nome) é nome
  // próprio abreviado, e passa; a palavra inteira com maiúscula continua reprovando
  caso('a caixa deixa passar o monograma do contato (a letra sozinha)', com({ minusculo: true, slides: minuscula, trechos: minuscula.map((s, i) => i === 1 ? s + '\nP\nencomenda da Paula ›' : s) }), { reprova: false, trecho: 'a caixa da marca' });
  caso('a caixa ainda reprova a palavra com maiúscula ao lado do monograma', com({ minusculo: true, slides: minuscula, trechos: minuscula.map((s, i) => i === 1 ? s + '\nP\nPedido' : s) }), { reprova: true, trecho: 'Pedido' });
}

console.log('\n== 9 · os nomes que a peça declara em meta.nomes ==');
{
  // a "Carla" da notificação abre a linha e não aparece no meio de frase nenhuma
  const NOTIF = { ...BOA, slides: ['você perde encomenda toda semana.', 'Carla · cliente  ainda tem bolo?'], trechos: ['você perde encomenda toda semana.', 'Carla · cliente\nainda tem bolo?'], minusculo: true };
  caso('o nome declarado em meta.nomes passa na caixa', { ...NOTIF, meta: { ...BOA.meta, nomes: ['Carla'] } }, { reprova: false, trecho: 'maiúscula (Carla)' });
  eErro('o mesmo nome sem a declaração continua reprovando', { ...NOTIF, meta: BOA.meta }, 'maiúscula (Carla)');
  eErro('o nome declarado não abre a porta para outro', { ...NOTIF, slides: ['você perde encomenda toda semana.', 'Rita · cliente  ainda tem bolo?'], trechos: ['você perde encomenda toda semana.', 'Rita · cliente\nainda tem bolo?'], meta: { ...BOA.meta, nomes: ['Carla'] } }, 'maiúscula (Rita)');
}

console.log('\n== 10 · os padrões de IA (padroes-de-ia.js) saem no campo ia ==');
{
  const ia = entrada => rodar(entrada).ia || [];
  confere('a peça boa não tem padrão de IA', ia(BOA).length === 0, JSON.stringify(ia(BOA)));
  const revela = ia(com({ slides: slide(2, 'A verdade é que a mensagem cai no grupo.') }));
  confere('a falsa revelação no slide 3 sai no ia, com o slide', revela.some(h => /slide 3/.test(h.texto) && /falsa revelação/.test(h.texto) && h.julgamento === false), JSON.stringify(revela));
  const contraste = ia(com({ slides: slide(2, 'Não é pressa, é ordem.') }));
  confere('o contraste fabricado sai como de julgamento', contraste.some(h => /contraste fabricado/.test(h.texto) && h.julgamento === true), JSON.stringify(contraste));
  const r = rodar(com({ slides: slide(2, 'A verdade é que a mensagem cai no grupo.') }));
  confere('a falsa revelação reprova a peça (erro)', r.erros.some(m => /falsa revelação/.test(m)), JSON.stringify(r));
  const rc = rodar(com({ slides: slide(2, 'Não é pressa, é ordem.') }));
  confere('o contraste fabricado só avisa, nunca reprova', rc.avisos.some(m => /contraste fabricado/.test(m)) && !rc.erros.some(m => /contraste fabricado/.test(m)), JSON.stringify(rc));
}

rmSync(PASTA, { recursive: true, force: true });

const total = passou + falhas.length;
console.log(`\n${passou}/${total} casos`);
// o resumo que o mutar.mjs da fábrica lê
resumoTap(passou, falhas.length);
if (falhas.length) {
  console.log(`\nreprovados: ${falhas.join(', ')}`);
  process.exit(1);
}
console.log('a régua do texto público ainda sabe reprovar.\n');
