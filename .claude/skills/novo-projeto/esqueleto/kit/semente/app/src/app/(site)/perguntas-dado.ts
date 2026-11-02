// fundação: semente v1 · é seu
import type { Pergunta } from "./conteudo/perguntas"

/** O FAQPage do schema.org, gerado da MESMA lista que a tela mostra. */
export function dadoEstruturado(perguntas: readonly Pergunta[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: perguntas.map((p) => ({
      "@type": "Question",
      name: p.pergunta,
      acceptedAnswer: { "@type": "Answer", text: p.resposta },
    })),
  }
}

/**
 * O JSON pronto para ir dentro de `<script type="application/ld+json">`.
 *
 * 🚨 Todo `<` vira `<`, que no JSON é o mesmo caractere: quem lê o dado
 * recebe o texto intacto, e um `</script>` no texto não fecha a tag (o que
 * transformaria o resto em HTML executável).
 */
export function jsonParaScript(dado: unknown): string {
  return JSON.stringify(dado).replace(/</g, "\\u003c")
}
