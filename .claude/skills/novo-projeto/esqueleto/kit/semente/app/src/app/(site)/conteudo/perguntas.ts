// fundação: semente v1 · é seu
// As perguntas que travam a decisão. Este arquivo é a ÚNICA fonte: a tela e o
// dado estruturado (FAQPage, para o Google) leem daqui. Dado estruturado que
// repete o texto por cópia envelhece torto: o Google mostra uma resposta que a
// página não diz mais.
//
// ⚠️ Só as que travam. FAQ comprida é onde a objeção verdadeira se esconde no
// meio de pergunta decorativa. As três abaixo são exemplo: troque pelas do
// projeto.

export type Pergunta = { pergunta: string; resposta: string }

export const PERGUNTAS: readonly Pergunta[] = [
  {
    pergunta: "Preciso instalar alguma coisa?",
    resposta: "Não. Tudo funciona no navegador, no computador ou no celular.",
  },
  {
    pergunta: "Meus dados ficam com quem?",
    resposta:
      "Com você. Nada é vendido nem compartilhado, e você pode pedir para apagar a qualquer momento.",
  },
  {
    pergunta: "E se eu travar no meio?",
    resposta: "Você fala com uma pessoa, não com um robô de atendimento.",
  },
]
