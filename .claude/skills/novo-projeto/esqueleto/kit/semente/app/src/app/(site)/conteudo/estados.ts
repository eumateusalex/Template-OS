// fundação: semente v1 · é seu
// O texto das telas de estado (erro, não encontrada). É texto que o público
// lê: mora aqui, onde o conferidor de travessão cobra.
//
// 🚨 Não existe `loading.tsx` na raiz, de propósito: ele embrulha TODA página numa fronteira de Suspense, e o
// HTML de uma página estática sai com o esqueleto visível e o conteúdo num
// `<div hidden>`, revelado depois por script. Sem JavaScript a pessoa só vê o
// esqueleto, e o LCP espera a revelação. O `loading.tsx` mora na pasta da
// rota que busca dado, nunca na raiz.

export const ESTADOS = {
  erro: {
    titulo: "Alguma coisa quebrou aqui do nosso lado",
    descricao:
      "Não foi você. Na maioria das vezes tentar de novo já resolve. Se insistir, o problema é nosso.",
    tentarDeNovo: "Tentar de novo",
    voltar: "Voltar ao início",
    codigo: "Código deste erro:",
  },
  naoEncontrada: {
    titulo: "Não encontramos esta página",
    descricao:
      "O endereço pode estar errado, ou a página pode ter mudado de lugar.",
    voltar: "Voltar ao início",
  },
} as const
