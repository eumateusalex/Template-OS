// fundação: semente v1 · é seu
import type { NextRequest } from "next/server"

import { renovarSessao } from "@/lib/banco/sessao"

/**
 * No Next 16 a convenção se chama `proxy`, não mais `middleware`. Ele é fino
 * de propósito: a lógica (e o teste dela) mora em `src/lib/banco/sessao.ts`.
 */
export async function proxy(requisicao: NextRequest) {
  return renovarSessao(requisicao)
}

export const config = {
  // Tudo, menos o que não tem sessão para renovar: estáticos e imagens.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|fontes/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2)$).*)",
  ],
}
