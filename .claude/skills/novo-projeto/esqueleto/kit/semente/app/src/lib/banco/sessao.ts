// fundação: semente v1 · é seu
import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

import { configDoBanco, opcoesDeCookie } from "./cookies"

let avisou = false

/**
 * Renova a sessão a cada navegação. Quem chama é o `src/proxy.ts`.
 *
 * 🚨 O proxy é o único lugar que pode escrever o cookie renovado: Server
 * Component não escreve cookie. Sem isto o token vence durante o uso e a
 * pessoa cai no meio do trabalho.
 *
 * ⚠️ A lógica mora aqui, e não no `proxy.ts`, porque `src/lib/banco/` é área
 * obrigatória da fábrica (teste com mutação) e um arquivo solto como
 * `src/proxy.ts` não é pasta: a varredura o ignoraria em silêncio.
 *
 * ⚠️ Sem as variáveis do banco, a requisição segue sem sessão e o aviso sai
 * UMA vez por processo, não uma por requisição.
 */
export async function renovarSessao(
  requisicao: NextRequest
): Promise<NextResponse> {
  let resposta = NextResponse.next({ request: requisicao })

  const config = configDoBanco()
  if (!config) {
    if (!avisou) {
      avisou = true
      console.warn(
        "[sessao] banco desligado: faltam NEXT_PUBLIC_SUPABASE_URL e a chave publicável"
      )
    }
    return resposta
  }

  const banco = createServerClient(config.url, config.chave, {
    cookieOptions: opcoesDeCookie(),
    cookies: {
      getAll() {
        return requisicao.cookies.getAll()
      },
      setAll(novos, cabecalhos) {
        for (const { name, value } of novos) requisicao.cookies.set(name, value)
        resposta = NextResponse.next({ request: requisicao })
        for (const { name, value, options } of novos)
          resposta.cookies.set(name, value, options)
        // 🚨 Os cabeçalhos anticache que a biblioteca manda junto: sem eles,
        // um CDN guarda a resposta com o token de uma pessoa e a entrega a
        // outra.
        for (const [nome, valor] of Object.entries(cabecalhos ?? {}))
          resposta.headers.set(nome, valor)
      },
    },
  })

  // 🚨 Não remover, e não trocar por getSession(): é esta chamada que valida o
  // token e dispara a renovação do cookie quando ele venceu.
  await banco.auth.getClaims()
  return resposta
}
