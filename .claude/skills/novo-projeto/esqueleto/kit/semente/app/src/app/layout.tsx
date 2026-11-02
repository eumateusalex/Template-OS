// fundação: semente v1 · é seu
import type { Metadata } from "next"

import "./globals.css"
import "@/styles/marca.css"
import "@/styles/escala.css"
import "@/styles/pagina.css"

import { SITE } from "./(site)/conteudo/site"

export const metadata: Metadata = {
  title: { default: SITE.nome, template: `%s · ${SITE.nome}` },
  description: SITE.descricao,
}

/**
 * ⚠️ A ordem dos CSS importa: o do CLI primeiro, a marca por cima (é ela que
 * redefine os papéis do shadcn), a escala e a composição da página por último.
 *
 * 🚨 O VIGIA do movimento (regra 1 do `16-movimento.md` do kit): ele põe a
 * classe `js` no `<html>`, e só sob ela o CSS esconde o que o `Revela` vai
 * revelar. Se o código do `Revela` não avisar que chegou em 3 s (o pedaço do
 * JavaScript falhou), o vigia tira a classe e a página aparece inteira. Sem
 * JavaScript nenhum, a classe nunca entra, e nada se esconde.
 * ⚠️ `suppressHydrationWarning` no `<html>`: a classe entra antes do React, e
 * sem isso ele acusaria a diferença no console.
 */
const VIGIA = `document.documentElement.classList.add("js");setTimeout(function(){if(!document.documentElement.hasAttribute("data-revela-pronto"))document.documentElement.classList.remove("js")},3000)`

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: VIGIA }} />
      </head>
      <body className="bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
