// fundação: semente v1 · é seu
import "server-only"

import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

import type { Database } from "@/lib/tipos/banco"

import { configDoBanco, opcoesDeCookie } from "./cookies"

/**
 * O cliente do Supabase para Server Component, Server Action e Route Handler,
 * com a chave PUBLICÁVEL: ele respeita a RLS, e tudo que lê já vem filtrado
 * pela conta de quem está logado. `null` quando o banco não está ligado.
 */
export async function bancoServidor() {
  const config = configDoBanco()
  if (!config) return null
  const jarra = await cookies()

  return createServerClient<Database>(config.url, config.chave, {
    cookieOptions: opcoesDeCookie(),
    cookies: {
      getAll: () => jarra.getAll(),
      setAll: (novos) => escreverNaJarra(jarra, novos),
    },
  })
}

type Jarra = Awaited<ReturnType<typeof cookies>>
type Novo = { name: string; value: string; options: CookieOptions }

function escreverNaJarra(jarra: Jarra, novos: Novo[]) {
  try {
    for (const { name, value, options } of novos)
      jarra.set(name, value, options)
  } catch {
    // silêncio declarado: Server Component não escreve cookie, e quem renova a sessão é o proxy; um log aqui sairia em toda renderização
  }
}

/**
 * Quem está logado, ou `null`.
 *
 * ⚠️ `getClaims`, não `getSession`: ele confere a ASSINATURA do token (contra
 * as chaves públicas do projeto, em cache), e o `getSession` só lê o cookie,
 * que qualquer um escreve.
 */
export async function usuarioAtual(): Promise<{
  id: string
  email: string | null
} | null> {
  const banco = await bancoServidor()
  if (!banco) return null
  const { data } = await banco.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub) return null
  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
  }
}
