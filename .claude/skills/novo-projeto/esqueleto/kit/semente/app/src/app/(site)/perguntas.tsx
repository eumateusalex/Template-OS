// fundação: semente v1 · é seu
import { PERGUNTAS, type Pergunta } from "./conteudo/perguntas"
import { dadoEstruturado, jsonParaScript } from "./perguntas-dado"

/**
 * As perguntas frequentes, com `<details>`: abre e fecha sem JavaScript, com
 * teclado e com leitor de tela, e o Google lê a resposta mesmo fechada.
 * O dado estruturado sai da mesma lista (ver `perguntas-dado.ts`).
 */
export function Perguntas({
  perguntas = PERGUNTAS,
}: {
  perguntas?: readonly Pergunta[]
}) {
  const dado = jsonParaScript(dadoEstruturado(perguntas))
  // ⚠️ O <script> fica FORA da lista: dentro do `divide-y`, ele seria o último
  // filho e daria ao último item uma segunda linha.
  return (
    <>
      <div className="divide-y divide-border border-y border-border">
        {perguntas.map((p) => (
          <Item key={p.pergunta} {...p} />
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: dado }}
      />
    </>
  )
}

function Item({ pergunta, resposta }: Pergunta) {
  return (
    <details className="group py-4">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-bold">
        {pergunta}
        <Sinal />
      </summary>
      <p className="max-w-(--measure) pt-2 text-muted-foreground">{resposta}</p>
    </details>
  )
}

function Sinal() {
  return (
    <span
      aria-hidden
      className="text-(--acento) transition-transform group-open:rotate-45"
    >
      +
    </span>
  )
}
