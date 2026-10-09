// Prova que a régua da legenda ainda sabe REPROVAR.
//
// Cada regra tem DOIS casos: um que reprova e o par que prova que ela fica
// quieta quando não deve falar. Régua que só sabe dizer "ok" não mede nada.
//
//   node scripts/lib/teste-legenda.mjs

import { createRequire } from 'node:module';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resumoTap } from './junit.mjs';
const require_ = createRequire(import.meta.url);
const { confereLegenda, TETO } = require_('./legenda.js');

let passou = 0;
const falhas = [];

function caso(nome, texto, esperado, opcoes = {}) {
  // sem memoria explícita, a de caixa normal: a prova não depende do módulo real
  const { erros, avisos } = confereLegenda(texto, { memoria: MEM_NORMAL, ...opcoes });
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

// O que tem de sair como ERRO (a cor decide publicar ou não), não só como aviso.
function eErro(nome, texto, trecho, opcoes = {}) {
  const { erros } = confereLegenda(texto, { memoria: MEM_NORMAL, ...opcoes });
  if (erros.some(m => m.includes(trecho))) { passou++; console.log(`  ok  ${nome}`); }
  else { falhas.push(nome); console.log(`  XX  ${nome}`); console.log(`      esperava erro com "${trecho}"; erros: ${JSON.stringify(erros)}`); }
}

// A memória de mentira: cada prova de caixa aponta para um escrita-publica.md
// próprio, e nenhuma depende do módulo real do workspace.
const PASTA = mkdtempSync(join(tmpdir(), 'legenda-'));
const memoria = (nome, conteudo) => { const arq = join(PASTA, nome); writeFileSync(arq, conteudo); return arq; };
const MEM_MINUSCULA = memoria('minuscula.md', '# Escrita pública\n\n## Caixa\n\n**Caixa:** minúscula\n');
const MEM_NORMAL = memoria('normal.md', '# Escrita pública\n\n## Caixa\n\n**Caixa:** normal\n');
const MEM_SEM_LINHA = memoria('sem-linha.md', '# Escrita pública\n\n## Linguagem de balcão\n\nfale com a pessoa.\n');
const MEM_MINUSCULA_VOCAB = memoria('minuscula-vocab.md', '# Escrita pública\n\n**Liste aqui as palavras suas\nque esta régua não deve cortar:** Pão da Vila\n\n## Caixa\n\n**Caixa:** minúscula\n');
const MEM_NAO_EXISTE = join(PASTA, 'nao-existe.md');

// A legenda que cumpre a regra inteira.
const BOA = [
  'Quase todo evento que dá errado já tinha dado errado três semanas antes.',
  'O problema nunca é o dia. É o que ninguém fechou no contrato.',
  'Me manda a data que você tá pensando e eu te digo o que já teria que estar resolvido.',
].join('\n');

console.log('\n== a legenda que cumpre a regra passa limpa ==');
{
  const { erros, avisos } = confereLegenda(BOA, { memoria: MEM_NORMAL });
  if (erros.length === 0 && avisos.length === 0) { passou++; console.log('  ok  legenda boa sem erro e sem aviso'); }
  else { falhas.push('legenda boa'); console.log(`  XX  legenda boa acusou: ${JSON.stringify([...erros, ...avisos])}`); }
}

console.log('\n== a caixa: tudo minúsculo, menos nome próprio e sigla, só quando a marca escolhe ==');
const MINUSCULA = [
  'cada proposta que ninguém retoma leva junto as horas que você gastou nela.',
  'na pesquisa do IBGE, 51% das padarias que responderam têm até 5 pessoas. a Paula some, e o WhatsApp fica parado.',
  'hoje, mande mensagem pra quem recebeu proposta e sumiu.',
  'fonte do 51%: II Pesquisa Anual de Serviços, 2020 · foto: Unsplash',
].join('\n');
caso('a caixa reprova frase começando com maiúscula', BOA, { reprova: true, trecho: 'minúscula' }, { minusculo: true });
caso('a caixa reprova a maiúscula depois do ponto', 'cada proposta parada custa a tarde. Ninguém retoma.\nhoje, retome uma.\nme conta qual ficou parada.', { reprova: true, trecho: 'Ninguém' }, { minusculo: true });
caso('a caixa reprova a linha de crédito com maiúscula', MINUSCULA.replace('fonte do 51%', 'Fonte do 51%'), { reprova: true, trecho: 'Fonte' }, { minusculo: true });
caso('a caixa deixa passar o minúsculo com nome próprio e sigla', MINUSCULA, { reprova: false, trecho: 'minúscula' }, { minusculo: true });
// a linha da memória decide quando quem chama não decide
caso('memória com "**Caixa:** minúscula" liga a caixa', BOA, { reprova: true, trecho: 'a caixa da marca é minúscula' }, { memoria: MEM_MINUSCULA });
caso('memória com "**Caixa:** normal" deixa a caixa desligada', BOA, { reprova: false, trecho: 'a caixa da marca' }, { memoria: MEM_NORMAL });
caso('memória sem a linha de caixa vale normal', BOA, { reprova: false, trecho: 'a caixa da marca' }, { memoria: MEM_SEM_LINHA });
caso('memória que não existe vale normal', BOA, { reprova: false, trecho: 'a caixa da marca' }, { memoria: MEM_NAO_EXISTE });
caso('quem chama desliga por cima da memória (a peça de cliente)', BOA, { reprova: false, trecho: 'a caixa da marca' }, { memoria: MEM_MINUSCULA, minusculo: false });
caso('o nome da marca listado no vocabulário passa na caixa minúscula', MINUSCULA.replace('hoje, mande', 'Pão da Vila, hoje, mande'), { reprova: false, trecho: 'a caixa da marca' }, { memoria: MEM_MINUSCULA_VOCAB });
caso('sem estar no vocabulário, o mesmo nome reprova', MINUSCULA.replace('hoje, mande', 'Pão da Vila, hoje, mande'), { reprova: true, trecho: 'Pão' }, { memoria: MEM_MINUSCULA });
caso('memória minúscula deixa passar o texto em minúsculo', MINUSCULA, { reprova: false, trecho: 'a caixa da marca' }, { memoria: MEM_MINUSCULA });

console.log('\n== 1 · hashtag ==');
caso('reprova hashtag no fim', BOA + '\n#eventos #buffet', { reprova: true, trecho: 'hashtag' });
caso('reprova hashtag no meio da frase', 'O contrato é o que ninguém leu antes de assinar.\nE o #erro sai caro depois.\nMe manda o teu que eu aponto o buraco.', { reprova: true, trecho: 'hashtag' });
caso('não confunde numero com hashtag', 'O contrato tinha 12 cláusulas e a #3 era a que ia doer.\nNinguém leu essa, e ela decide quem paga o extra.\nMe manda o teu contrato que eu aponto qual é a tua.', { reprova: false, trecho: 'hashtag' });
caso('fica quieta sem hashtag', BOA, { reprova: false, trecho: 'hashtag' });

console.log('\n== as três linhas com um ponto ==');
caso('reprova os três pontos órfãos', 'A data não é o problema do teu evento.\nO contrato é.\n.\n.\n.\nMe manda o teu.', { reprova: true, trecho: 'três linhas com um ponto' });
caso('fica quieta sem os três pontos', BOA, { reprova: false, trecho: 'três linhas com um ponto' });

console.log('\n== 2 · emoji ==');
caso('reprova 4 emoji', '✨ O evento que dá errado já tinha dado errado antes. 🎉\nO contrato é onde mora o problema. 💡\nMe manda a data que eu te digo o que falta. 👇', { reprova: true, trecho: 'emoji' });
caso('deixa passar 1 emoji', 'O evento que dá errado já tinha dado errado três semanas antes.\nO problema mora no contrato, não no dia.\nMe manda a data que eu te digo o que falta. 👊', { reprova: false, trecho: 'emoji' });
caso('deixa passar zero emoji', BOA, { reprova: false, trecho: 'emoji' });
// um emoji é o que a pessoa vê como um: tom de pele, bandeira e família contam um
const ANTES_DO_EMOJI = 'O evento que dá errado já tinha dado errado três semanas antes.\nO problema mora no contrato, não no dia.\nMe manda a data que eu te digo o que falta. ';
caso('emoji com tom de pele conta um', ANTES_DO_EMOJI + '👍🏽', { reprova: false, trecho: 'emoji' });
caso('bandeira conta um', ANTES_DO_EMOJI + '🇧🇷', { reprova: false, trecho: 'emoji' });
caso('família (emoji unido) conta um', ANTES_DO_EMOJI + '👨‍👩‍👧', { reprova: false, trecho: 'emoji' });
caso('coração com seletor de variação conta um', ANTES_DO_EMOJI + '❤️', { reprova: false, trecho: 'emoji' });
caso('dois emoji com tom de pele reprovam', ANTES_DO_EMOJI + '👍🏽 👊🏿', { reprova: true, trecho: '2 emoji' });

console.log('\n== 3 · teto de 400 caracteres ==');
caso('reprova legenda longa', 'A'.repeat(150) + '\n' + 'B'.repeat(150) + '\n' + 'C'.repeat(150), { reprova: true, trecho: `o teto é ${TETO}` });
caso('fica quieta dentro do teto', BOA, { reprova: false, trecho: `o teto é ${TETO}` });
// a borda dos dois lados: 400 exatos passam, 401 reprovam
caso('400 caracteres exatos passam', ['A'.repeat(133), 'B'.repeat(133), 'C'.repeat(132)].join('\n'), { reprova: false, trecho: 'o teto é' });
caso('401 caracteres reprovam', ['A'.repeat(133), 'B'.repeat(133), 'C'.repeat(133)].join('\n'), { reprova: true, trecho: 'legenda com 401 caracteres' });

console.log('\n== tamanho em linhas (3 a 5) ==');
caso('reprova 2 linhas', 'O evento que dá errado já tinha dado errado três semanas antes.\nMe manda a data que eu te digo o que falta.', { reprova: true, trecho: 'linha(s)' });
caso('reprova 6 linhas', ['O evento que dá errado já tinha dado errado antes.', 'Uma.', 'Duas.', 'Três.', 'Quatro.', 'Me manda a data.'].join('\n'), { reprova: true, trecho: 'linha(s)' });
caso('aceita 5 linhas', ['O evento que dá errado já tinha dado errado três semanas antes.', 'O problema nunca é o dia.', 'É o que ninguém fechou no contrato.', 'Isso custa caro e ninguém avisa.', 'Me manda a data que eu te digo o que falta.'].join('\n'), { reprova: false, trecho: 'linha(s)' });

console.log('\n== 4 · a linha 1 sozinha ==');
caso('avisa linha 1 curta', 'Deu ruim.\nO contrato é onde mora o problema do teu evento.\nMe manda a data que eu te digo o que falta.', { reprova: true, trecho: 'curta demais' });
caso('avisa pergunta de abertura', 'Você já parou pra pensar no teu contrato?\nO contrato é onde mora o problema do evento.\nMe manda a data que eu te digo o que falta.', { reprova: true, trecho: 'é uma pergunta' });
caso('avisa abertura com conectivo', 'E foi aí que o contrato do evento virou o problema todo.\nNinguém leu a cláusula que decide quem paga o extra.\nMe manda a data que eu te digo o que falta.', { reprova: true, trecho: 'conectivo' });
caso('fica quieta com linha 1 boa', BOA, { reprova: false, trecho: 'linha 1' });

console.log('\n== 5 · repetir os cards ==');
caso('avisa quando o miolo repete o card', BOA, { reprova: true, trecho: 'repete um trecho dos cards' }, { textoDosCards: 'O problema nunca é o dia. É o que ninguém fechou no contrato do evento.' });
caso('fica quieta quando o miolo traz coisa nova', BOA, { reprova: false, trecho: 'repete um trecho dos cards' }, { textoDosCards: 'Cinco erros de quem contrata buffet pela primeira vez na vida.' });

console.log('\n== 6 · CTA genérico ==');
caso('reprova "salva esse post"', 'O evento que dá errado já tinha dado errado três semanas antes.\nO contrato é onde mora o problema.\nSalva esse post pra não esquecer.', { reprova: true, trecho: 'CTA genérico' });
caso('reprova "marca alguém"', 'O evento que dá errado já tinha dado errado três semanas antes.\nO contrato é onde mora o problema.\nMarca alguém que precisa ver isso.', { reprova: true, trecho: 'CTA genérico' });
caso('reprova "link na bio"', 'O evento que dá errado já tinha dado errado três semanas antes.\nO contrato é onde mora o problema.\nLink na bio pra saber mais.', { reprova: true, trecho: 'CTA genérico' });
caso('fica quieta com CTA amarrado ao tema', BOA, { reprova: false, trecho: 'CTA genérico' });

console.log('\n== 6b · CTA que manda resolver com um terceiro ==');
// O fecho mostra o valor de quem assina no problema da peça, e não passa tarefa
// para a pessoa cumprir com outro.
const TEMA = 'O WhatsApp tocando não quer dizer que o anúncio sabe quem te chamou.\nQuando o clique não é contado, o anúncio só enxerga visita.\n';
caso('reprova "peça a quem cuida do anúncio"', TEMA + 'Se você anuncia, peça a quem cuida dele pra conferir se esse clique conta.', { reprova: true, trecho: 'terceiro' });
caso('reprova "pergunte a quem cuida"', TEMA + 'Pergunte a quem cuida do anúncio se o clique no WhatsApp conta.', { reprova: true, trecho: 'terceiro' });
caso('reprova "pergunta pra sua agência"', TEMA + 'Pergunta pra sua agência se ela mede esse clique.', { reprova: true, trecho: 'terceiro' });
caso('reprova "confira com o seu gestor"', TEMA + 'Confira com o seu gestor de tráfego se esse clique aparece.', { reprova: true, trecho: 'terceiro' });
caso('fica quieta quando o valor é de quem assina', TEMA + 'Eu acho esse furo e te mostro qual anúncio traz cliente pro seu negócio.', { reprova: false, trecho: 'terceiro' });
caso('fica quieta com "quem cuida" narrando, sem mandar', TEMA + 'Quem cuida do anúncio quase nunca olha esse clique, e eu te mostro onde ele some.', { reprova: false, trecho: 'terceiro' });

console.log('\n== bullet, travessão e markdown ==');
caso('reprova bullet list', 'O evento que dá errado já tinha dado errado antes.\n- contrato\n- fornecedor\nMe manda a data.', { reprova: true, trecho: 'bullet list' });
eErro('reprova travessão', 'O evento que dá errado — e quase todo dá — já tinha dado errado antes.\nO contrato é onde mora o problema.\nMe manda a data que eu te digo o que falta.', 'travessão');
caso('reprova markdown', 'O evento que dá errado já tinha dado **errado** três semanas antes.\nO contrato é onde mora o problema.\nMe manda a data que eu te digo o que falta.', { reprova: true, trecho: 'markdown' });
caso('fica quieta sem bullet nem markdown', BOA, { reprova: false, trecho: 'bullet list' });
caso('avisa a negação partida (o contraste fabricado), também em minúsculo', 'o evento que dá errado já tinha dado errado antes.\nnão é o dia. é o contrato que ninguém fechou.\nme manda a data que eu te digo o que falta.', { reprova: true, trecho: 'contraste fabricado' });

console.log('\n== os padrões de IA (padroes-de-ia.js), a mesma lista dos slides e da copy ==');
const LEGENDA_IA = corpo => `${corpo}\nhoje, retome uma.\nme conta qual ficou parada.`;
caso('a falsa revelação acusa o padrão de IA', LEGENDA_IA('a verdade é que a encomenda parada custa a tarde.'), { reprova: true, trecho: 'falsa revelação' });
caso('a autoridade vaga acusa o padrão de IA', LEGENDA_IA('estudos mostram que a encomenda parada custa a tarde.'), { reprova: true, trecho: 'autoridade vaga' });
caso('o contraste fabricado acusa o padrão de IA', LEGENDA_IA('não é o forno, é a fila.'), { reprova: true, trecho: 'contraste fabricado' });
caso('a legenda direta fica quieta nos padrões de IA', LEGENDA_IA('a encomenda parada custa a tarde.'), { reprova: false, trecho: 'humanizer' });
{
  const r = confereLegenda(LEGENDA_IA('a verdade é que a encomenda parada custa a tarde.'), { memoria: MEM_NORMAL });
  const ok = Array.isArray(r.ia) && r.ia.some(h => /falsa revelação/.test(h.texto) && h.julgamento === false) && r.erros.some(m => /falsa revelação/.test(m));
  if (ok) { passou++; console.log('  ok  a falsa revelação sai no campo ia e reprova (erro)'); }
  else { falhas.push('o campo ia'); console.log(`  XX  o campo ia: ${JSON.stringify(r)}`); }
  const rc = confereLegenda(LEGENDA_IA('não é o forno, é a fila.'), { memoria: MEM_NORMAL });
  const okc = rc.avisos.some(m => /contraste fabricado/.test(m)) && !rc.erros.some(m => /contraste fabricado/.test(m));
  if (okc) { passou++; console.log('  ok  o contraste fabricado só avisa, nunca reprova'); }
  else { falhas.push('o contraste como aviso'); console.log(`  XX  o contraste como aviso: ${JSON.stringify(rc)}`); }
}

console.log('\n== 6a · o pedido de seguir seco ==');
eErro('reprova o "segue lá"', LEGENDA_IA('a encomenda parada custa a tarde. segue lá.'), 'a legenda pede para seguir com "segue lá"');
caso('reprova o "me sigam" pela mesma lista', LEGENDA_IA('a encomenda parada custa a tarde. me sigam.'), { reprova: true, trecho: 'a legenda pede para seguir com "me sigam"' });
caso('fica quieta no "prossegue lá" (a palavra inteira)', LEGENDA_IA('a obra prossegue lá na sexta.'), { reprova: false, trecho: 'pede para seguir' });
caso('fica quieta com o motivo de seguir, sem a fórmula', LEGENDA_IA('toda semana, uma receita nova do balcão aqui no perfil.'), { reprova: false, trecho: 'pede para seguir' });

console.log('\n== isca de DM ==');
const COM_ISCA = 'O evento que dá errado já tinha dado errado três semanas antes.\nO contrato é onde mora o problema, e ninguém lê a cláusula certa.\nComenta LISTA aqui que eu te mando no direct o checklist.';
caso('reprova isca em peça fora de série', COM_ISCA, { reprova: true, trecho: 'não é de uma série' });
caso('reprova isca em série com a DM desligada', COM_ISCA, { reprova: true, trecho: 'DESLIGADA' }, { serie: 'checklist', dmLigada: false });
caso('aceita isca em série com a DM ligada', COM_ISCA, { reprova: false, trecho: 'queima a conta' }, { serie: 'checklist', dmLigada: true });
// qualquer série declarada libera a isca, e a palavra da legenda tem que ser a da série
const COM_AGENDA = 'Quem responde a encomenda em cinco minutos fecha antes do concorrente.\nO pedido cai num lugar que ninguém abre.\nComenta AGENDA que eu te mando no direct o modelo de resposta.';
caso('aceita isca na série agenda com a DM ligada', COM_AGENDA, { reprova: false, trecho: 'queima a conta' }, { serie: 'agenda', palavra: 'AGENDA', dmLigada: true });
caso('reprova palavra errada pra série (LISTA numa série AGENDA)', COM_ISCA, { reprova: true, trecho: 'palavra errada' }, { serie: 'agenda', palavra: 'AGENDA', dmLigada: true });
caso('sem palavra declarada, não cobra a palavra', COM_ISCA, { reprova: false, trecho: 'palavra errada' }, { serie: 'agenda', dmLigada: true });
caso('série agenda com a DM desligada continua reprovando', COM_AGENDA, { reprova: true, trecho: 'DESLIGADA' }, { serie: 'agenda', palavra: 'AGENDA', dmLigada: false });
// a palavra acentuada inteira: o \b do JavaScript não vê o "Ê" como letra e cortaria em "VOC"
const COM_ACENTO = 'O evento que dá errado já tinha dado errado três semanas antes.\nO contrato é onde mora o problema, e ninguém lê a cláusula certa.\nComenta ORÇAMENTO que eu te mando no direct o modelo.';
caso('palavra acentuada da série é lida inteira', COM_ACENTO, { reprova: false, trecho: 'palavra errada' }, { serie: 'orcamento', palavra: 'ORÇAMENTO', dmLigada: true });
caso('palavra terminada em acento é lida inteira', COM_ACENTO.replace('ORÇAMENTO', 'VOCÊ'), { reprova: false, trecho: 'palavra errada' }, { serie: 'voce', palavra: 'VOCÊ', dmLigada: true });
caso('e a palavra errada continua reprovando, com o nome inteiro', COM_ACENTO.replace('ORÇAMENTO', 'VOCÊ'), { reprova: true, trecho: '"Comenta VOCÊ"' }, { serie: 'agenda', palavra: 'AGENDA', dmLigada: true });

console.log('\n== o crédito do fim não conta no teto ==');
{
  // Atribuição de licença longa (CC BY-SA e afins) é obrigação: contar ela junto
  // tornaria imagem licenciada inutilizável.
  const CREDITO_LONGO = 'Imagens do acervo do Wikimedia Commons: registros de época (domínio público), um computador de 1983 por um fotógrafo do acervo (CC BY-SA 2.0), outro por um segundo autor (CC BY 3.0), um terceiro por outro autor (CC BY 2.0) e um quarto por mais um autor (CC BY-SA 4.0).';
  caso('crédito longo não estoura o teto', BOA + '\n' + CREDITO_LONGO, { reprova: false, trecho: `o teto é ${TETO}` });
  caso('crédito longo não conta como linha', BOA + '\n' + CREDITO_LONGO, { reprova: false, trecho: 'linha(s) de texto' });
  caso('mas o CORPO acima do teto continua reprovando', 'A'.repeat(150) + '\n' + 'B'.repeat(150) + '\n' + 'C'.repeat(150) + '\nVídeo: OpenAI', { reprova: true, trecho: `o teto é ${TETO}` });
  caso('hashtag DENTRO do crédito continua reprovando', BOA + '\nVídeo: @openai #ia', { reprova: true, trecho: 'hashtag' });
  caso('crédito no MEIO do texto conta como corpo', 'Vídeo: OpenAI' + '\n' + 'D'.repeat(420) + '\nMe manda a data que eu te digo o que falta.', { reprova: true, trecho: `o teto é ${TETO}` });
}

console.log('\n== legenda vazia ==');
caso('reprova legenda vazia', '   ', { reprova: true, trecho: 'vazia' });

// == O APERTO POR CONTA ==
//
// 🚨 Cada número do aperto tem o PAR que prova os DOIS lados: o que a régua
// apertada reprova, e o que a padrão continua deixando passar. Sem o par, um
// `regua` ignorado em silêncio passaria despercebido.
console.log('\n== o aperto por conta (teto 300, até 4 linhas) ==');
{
  const APERTO = { teto: 300, minLinhas: 3, maxLinhas: 4 };

  // 338 caracteres em 3 linhas: passa nos 400 do padrão, estoura os 300.
  const DE_338 = ['A'.repeat(110), 'B'.repeat(110), 'C'.repeat(116)].join('\n');
  caso('reprova 338 caracteres na régua apertada', DE_338, { reprova: true, trecho: 'o teto é 300' }, { regua: APERTO });
  caso('e os mesmos 338 passam na régua padrão', DE_338, { reprova: false, trecho: 'o teto é' });

  // 5 linhas: o padrão aceita, o aperto para em 4.
  const DE_5_LINHAS = ['Primeira linha que prende sozinha antes do ver mais.',
    'Segunda linha.', 'Terceira linha.', 'Quarta linha.', 'Quinta linha.'].join('\n');
  caso('reprova 5 linhas na régua apertada', DE_5_LINHAS, { reprova: true, trecho: 'de 3 a 4' }, { regua: APERTO });
  caso('e as mesmas 5 linhas passam na régua padrão', DE_5_LINHAS, { reprova: false, trecho: 'linha(s) de texto' });

  // O aperto não afrouxa NADA: as outras checagens continuam valendo iguais.
  caso('hashtag continua reprovando na régua apertada', BOA + '\n#padaria', { reprova: true, trecho: 'hashtag' }, { regua: APERTO });

  const CURTA_BOA = [
    'A sua encomenda de bolo some no meio das conversas do WhatsApp.',
    'O pedido de sexta fica embaixo de vinte mensagens de bom dia.',
    'Hoje, fixe a conversa de quem encomendou e responda primeiro a ela.',
  ].join('\n');
  caso('legenda curta e boa passa no aperto', CURTA_BOA, { reprova: false, trecho: 'o teto é' }, { regua: APERTO });
}

{
  // a palavra que a pessoa recusou, lida da linha da memória
  const MEM_RECUSA = memoria('recusa.md', '# Escrita pública\n\n**Palavras que o texto público não diz:** milagre, cura definitiva\n\n## Caixa\n\n**Caixa:** normal\n');
  const COM_RECUSA = 'Essa sessão é um milagre pra sua lombar.\nCura   definitiva em 3 dias, sem dor.\nMarque a avaliação postural pelo direct da clínica.';
  eErro('a palavra recusada na memória reprova a legenda', COM_RECUSA, 'diz "milagre"', { memoria: MEM_RECUSA });
  caso('a recusa de duas palavras pega com espaço a mais', COM_RECUSA, { reprova: true, trecho: 'diz "cura definitiva"' }, { memoria: MEM_RECUSA });
  caso('sem a linha na memória, a mesma legenda não acusa recusa', COM_RECUSA, { reprova: false, trecho: 'recusou para o texto público' });
  caso('palavra dentro de outra não conta', 'O milagreiro da esquina vende pão.\nA clínica abre às 7.\nMarque a avaliação pelo direct.', { reprova: false, trecho: 'recusou para o texto público' }, { memoria: MEM_RECUSA });
}

{
  // na caixa minúscula, só o que a pessoa escreveu com maiúscula no vocabulário vale como nome
  const MEM_OFICIO = memoria('oficio.md', '# Escrita pública\n\n**Liste aqui as palavras suas\nque esta régua não deve cortar:** quadro de distribuição, DR, Rafael Elétrica, Campinas\n\n## Caixa\n\n**Caixa:** minúscula\n');
  caso('o nome escrito com maiúscula no vocabulário passa no começo', 'Rafael Elétrica atende Campinas.\na luz piscando custa o seu sossego.\nme chama no zap que eu passo aí.', { reprova: false, trecho: 'maiúscula' }, { memoria: MEM_OFICIO });
  eErro('o "de" da palavra do ofício não vira nome próprio', 'De noite eu respondo você no zap.\na luz piscando custa o seu sossego.\nme chama no zap que eu passo aí.', 'maiúscula (De)', { memoria: MEM_OFICIO });
}

{
  // a escolha de emoji da memória aperta a régua
  const MEM_SO_RAIO = memoria('so-raio.md', '# Escrita pública\n\n**Emoji:** quase nunca, só ⚡\n\n## Caixa\n\n**Caixa:** normal\n');
  const MEM_NENHUM = memoria('nenhum.md', '# Escrita pública\n\n**Emoji:** nenhum\n\n## Caixa\n\n**Caixa:** normal\n');
  const MEM_MOLDE = memoria('molde-emoji.md', '# Escrita pública\n\n**Emoji:** *(a definir: onde entra e quantos. Na legenda, zero é um bom padrão)*\n\n## Caixa\n\n**Caixa:** normal\n');
  const COM = e => `A luz piscando custa o seu sossego ${e}\nO disjuntor desarma por um motivo.\nMe chama no zap que eu passo aí.`;
  eErro('o emoji que a pessoa não usa reprova', COM('🔥'), 'emoji que você não usa', { memoria: MEM_SO_RAIO });
  caso('o emoji que a pessoa usa passa', COM('⚡'), { reprova: false, trecho: 'emoji que você não usa' }, { memoria: MEM_SO_RAIO });
  eErro('com "nenhum", qualquer emoji reprova', COM('⚡'), 'você escolheu não usar emoji', { memoria: MEM_NENHUM });
  caso('o molde ainda em branco não aperta a régua (o "zero" da orientação não conta)', COM('⚡'), { reprova: false, trecho: 'você escolheu' }, { memoria: MEM_MOLDE });
  // o emoji listado vale mesmo quando a frase tem "nenhum" ou "não uso" em outro lugar
  const MEM_ARTE = memoria('nenhum-na-arte.md', '# Escrita pública\n\n**Emoji:** nenhum na arte; na legenda, só ⚡\n\n## Caixa\n\n**Caixa:** normal\n');
  const MEM_NAO_USO = memoria('nao-uso-muito.md', '# Escrita pública\n\n**Emoji:** não uso muito, só ⚡\n\n## Caixa\n\n**Caixa:** normal\n');
  caso('"nenhum na arte; na legenda, só ⚡": o ⚡ passa', COM('⚡'), { reprova: false, trecho: 'você escolheu' }, { memoria: MEM_ARTE });
  eErro('"nenhum na arte; na legenda, só ⚡": outro emoji reprova', COM('🔥'), 'emoji que você não usa', { memoria: MEM_ARTE });
  caso('"não uso muito, só ⚡": o ⚡ passa', COM('⚡'), { reprova: false, trecho: 'você escolheu' }, { memoria: MEM_NAO_USO });
}

{
  // a peça de cliente passa `memoria: false`: nada da memória deste workspace a julga
  const { textoDaMemoria } = require_('./caixa.js');
  const doWorkspace = textoDaMemoria({});
  const doCliente = textoDaMemoria({ memoria: false });
  if (doWorkspace.length > 0 && doCliente === '') { passou++; console.log('  ok  com memoria: false, a régua não lê a memória deste workspace'); }
  else { falhas.push('memoria: false'); console.log(`  XX  memoria: false leu ${doCliente.length} caractere(s); a do workspace tem ${doWorkspace.length}`); }
  // e a caixa que o cliente escolheu continua valendo
  eErro('com memoria: false, o minusculo do cliente decide a caixa', 'A luz piscando custa o seu sossego.\nO disjuntor desarma por um motivo.\nMe chama no zap que eu passo aí.', 'maiúscula', { memoria: false, minusculo: true });
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
console.log('a régua da legenda ainda sabe reprovar.\n');
