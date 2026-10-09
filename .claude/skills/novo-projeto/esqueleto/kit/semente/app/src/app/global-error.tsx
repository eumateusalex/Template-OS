// fundação: semente v1 · é seu
"use client"

import "./globals.css"
import "@/styles/marca.css"

import { TelaDeErro } from "@/components/tela-de-erro"

import { ESTADOS } from "./(site)/conteudo/estados"

/**
 * O último anteparo: erro no PRÓPRIO layout raiz. Ele substitui o `<html>`
 * inteiro, e por isso traz as duas tags e os CSS de volta.
 */
export default function ErroGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-background font-sans text-foreground">
        <TelaDeErro erro={error} tentarDeNovo={reset} texto={ESTADOS.erro} />
      </body>
    </html>
  )
}
