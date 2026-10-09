// OS PADRÕES DE IA QUE A MÁQUINA CONSEGUE VER
//
// Texto com cara de IA não sai em nome da marca. A skill `humanizer`
// (`.claude/skills/humanizer/SKILL.md`) nomeia os padrões e reescreve; esta lista é a
// parte que uma expressão consegue ver, e vira trava nas três réguas que a leem: os
// slides (`copy.js`), a legenda (`legenda.js`) e a copy de página
// (`scripts/copy/conferir.mjs`). Uma fonte só: padrão novo entra aqui.
//
// O que fica de fora porque pede julgamento (o fragmento de drama, o dois-pontos de
// efeito, a metáfora ornamental, a pergunta genérica no fim) é da humanizer e do revisor
// de comunicação do estúdio. O contraste ("não é X, é Y") a máquina vê, mas às vezes ele
// é real, e a humanizer manda mantê-lo nesse caso: ele sai marcado como de julgamento.
// A cor: nos slides e na legenda, o padrão certo é erro e o de julgamento é aviso; na copy
// de página, tudo é erro, o contraste inclusive (a /copy não aceita o "não é X, é Y").
//
// A régua nomeia o padrão, nunca acusa a autoria: o achado é prova que o autor confere
// linha por linha, um chute de "foi IA" não é (a humanizer, modo detecção).

// a palavra inteira, também com acento (o \b do JS não vê o "ê" como letra)
const L = '(?<!\\p{L})', R = '(?!\\p{L})';
const re = s => new RegExp(s, 'iu');

const PADROES = [
  { nome: 'contraste fabricado ("não é X, é Y")', julgamento: true, conserto: 'diga só o que é; o contraste fica só quando é real',
    re: re(`${L}não\\s+é${R}[^.!?\\n]{1,60}?[,.;]\\s*(?:é|e\\s+sim)${R}`) },
  { nome: 'contraste fabricado ("não só X, mas Y")', julgamento: true, conserto: 'diga só o que é; o contraste fica só quando é real',
    re: re(`${L}não\\s+(?:é\\s+)?(?:só|apenas|somente)${R}[^.!?\\n]{1,60}?\\s+mas${R}`) },
  { nome: 'falsa revelação', conserto: 'corte a promessa e afirme o fato direto',
    re: re(`${L}(?:o\\s+que\\s+ningu[ée]m\\s+(?:te\\s+)?(?:conta|fala|diz)|o\\s+que\\s+(?:a\\s+maioria|quase\\s+ningu[ée]m)\\s+(?:erra|n[ãa]o\\s+sabe|ignora)|a\\s+verdade\\s+[ée]\\s+que|vou\\s+ser\\s+sincer[oa]|o\\s+segredo\\s+(?:[ée]|est[áa]))${R}`) },
  { nome: 'autoridade vaga', conserto: 'cite a fonte que dá para conferir, ou escreva o fato',
    re: re(`${L}(?:especialistas\\s+(?:dizem|afirmam|apontam|garantem)|estudos\\s+(?:mostram|apontam|comprovam)|pesquisas\\s+(?:mostram|apontam|comprovam)|o\\s+mercado\\s+(?:entende|sabe))${R}`) },
  { nome: 'importância inflada', conserto: 'troque pelo fato que se vê',
    re: re(`${L}(?:fundamental|transformador[as]?|revolucion[áa]ri[oa]s?|revolucionar|jornada|divisor\\s+de\\s+[áa]guas|cen[áa]rio\\s+em\\s+constante\\s+evolu[çc][ãa]o|testemunho\\s+de)${R}`) },
  { nome: 'linguagem corporativa', conserto: 'troque pelo verbo concreto do que acontece',
    re: re(`${L}(?:potencializ\\p{L}*|otimiz\\p{L}*|impulsion\\p{L}*|ecossistema|solu[çc][ãa]o\\s+robusta|entrega\\s+de\\s+valor|agregar\\s+valor)${R}`) },
  { nome: 'frase que comenta a própria frase', conserto: 'corte: o fato já mostra o ponto',
    re: re(`${L}(?:vale\\s+(?:destacar|ressaltar|lembrar)|[ée]\\s+importante\\s+(?:destacar|ressaltar|lembrar)|refor[çc]ando\\s+a\\s+import[âa]ncia|isso\\s+importa\\s+mais\\s+do\\s+que\\s+parece|repara\\s+nesse\\s+detalhe)${R}`) },
  { nome: 'advérbio vazio', conserto: 'corte, se ele não muda o sentido',
    re: re(`${L}(?:literalmente|simplesmente|basicamente|efetivamente|de\\s+fato)${R}`) },
  { nome: 'exclamações empilhadas', conserto: 'uma só, ou nenhuma', re: /!{2,}/ },
];

// O texto que se mede: sem as tags do HTML e sem as entidades de espaço
const semTags = texto => String(texto || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

/** Os padrões achados no texto: o nome, o trecho, o conserto e se é de julgamento. */
const achaPadroes = texto => {
  const t = semTags(texto);
  const achados = [];
  for (const p of PADROES) {
    const m = t.match(p.re);
    if (m) achados.push({ nome: p.nome, trecho: m[0].trim(), conserto: p.conserto, julgamento: !!p.julgamento });
  }
  return achados;
};

/** A mensagem de um achado, a mesma nas três réguas. */
const mensagem = (onde, h) => `${onde}: "${h.trecho}" é ${h.nome} · ${h.conserto} (a humanizer)`;

module.exports = { PADROES, achaPadroes, mensagem };
