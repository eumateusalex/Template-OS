// fundação: semente v1 · é seu
"use client"

import { TelaDeErro } from "@/components/tela-de-erro"

import { ESTADOS } from "./(site)/conteudo/estados"

/** O limite de erro de tudo que estourar abaixo do layout raiz. */
export default function Erro({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <TelaDeErro erro={error} tentarDeNovo={reset} texto={ESTADOS.erro} />
}
