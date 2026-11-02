// fundação: semente v1 · é seu
"use client"

import { createBrowserClient } from "@supabase/ssr"

import type { Database } from "@/lib/tipos/banco"

import { configDoBanco, opcoesDeCookie } from "./cookies"

/**
 * O cliente do Supabase para o NAVEGADOR: tempo real e o que precisar de
 * JavaScript do lado de lá. Leitura e escrita de dado moram no servidor.
 *
 * 🚨 Um cliente só, guardado no módulo: cada `createBrowserClient` abre uma
 * conexão, e criar um por renderização abriria uma por renderização.
 * ⚠️ As mesmas marcas de cookie do servidor, ou a renovação feita daqui
 * desfaria o `secure` que o servidor pôs.
 */
let cliente: ReturnType<typeof createBrowserClient<Database>> | null = null

export function bancoNavegador() {
  if (cliente) return cliente
  const config = configDoBanco()
  if (!config) return null
  cliente = createBrowserClient<Database>(config.url, config.chave, {
    cookieOptions: opcoesDeCookie(),
  })
  return cliente
}
