// fundação: semente v1 · é seu
import { describe, expect, it } from "vitest"

import { PERGUNTAS } from "./conteudo/perguntas"
import { dadoEstruturado, jsonParaScript } from "./perguntas-dado"

describe("o dado estruturado do FAQ", () => {
  const dado = dadoEstruturado(PERGUNTAS)

  it("é um FAQPage do schema.org", () => {
    expect(dado["@context"]).toBe("https://schema.org")
    expect(dado["@type"]).toBe("FAQPage")
  })
  it("tem exatamente as perguntas da tela, na mesma ordem e com o mesmo texto", () => {
    expect(dado.mainEntity.map((q) => q.name)).toEqual(
      PERGUNTAS.map((p) => p.pergunta)
    )
    expect(dado.mainEntity.map((q) => q.acceptedAnswer.text)).toEqual(
      PERGUNTAS.map((p) => p.resposta)
    )
  })
  it("cada pergunta é Question com Answer", () => {
    for (const q of dado.mainEntity) {
      expect(q["@type"]).toBe("Question")
      expect(q.acceptedAnswer["@type"]).toBe("Answer")
    }
  })
  it("o texto não fecha a tag de script, e quem lê o dado recebe o texto intacto", () => {
    const texto = "a</script><script>alert(1)"
    const escrito = jsonParaScript(
      dadoEstruturado([{ pergunta: texto, resposta: "b" }])
    )
    expect(escrito).not.toContain("<")
    expect(JSON.parse(escrito).mainEntity[0].name).toBe(texto)
  })
})
