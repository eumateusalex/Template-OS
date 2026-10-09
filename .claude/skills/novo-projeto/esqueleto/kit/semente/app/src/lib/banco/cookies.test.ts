// fundação: semente v1 · é seu
// mutação: src/lib/banco/cookies.ts · "if (!url || !chave) return null" → "if (!url) return null" · pega em 09/10/2026
// mutação: src/lib/banco/cookies.ts · "secure: !naPropriaMaquina(site)," → "secure: true," · pega em 09/10/2026
// mutação: src/lib/banco/cookies.ts · "if (!ehPublicavel(chave)) {" → "if (false) {" · pega em 09/10/2026
// mutação: src/lib/banco/cookies.ts · "return ["localhost", "127.0.0.1"].includes(new URL(site).hostname)" → "return true" · pega em 09/10/2026
import { afterEach, describe, expect, it, vi } from "vitest"

import { configDoBanco, opcoesDeCookie } from "./cookies"

afterEach(() => vi.unstubAllEnvs())

/** Um JWT de mentira, só com o corpo que importa aqui. */
const jwt = (corpo: object) =>
  ["e30", Buffer.from(JSON.stringify(corpo)).toString("base64url"), "x"].join(
    "."
  )

describe("configDoBanco", () => {
  it("desligado sem o endereço", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x")
    expect(configDoBanco()).toBeNull()
  })
  it("desligado sem a chave", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "")
    expect(configDoBanco()).toBeNull()
  })
  it("ligado com as duas", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x")
    expect(configDoBanco()).toEqual({
      url: "https://x.supabase.co",
      chave: "sb_publishable_x",
    })
  })
  // 🚨 A chave vai para o JavaScript do navegador. A secreta ali passa por cima
  // de toda a RLS: recusa com erro, nunca liga calado.
  it("recusa a chave secreta", () => {
    expect(() =>
      configDoBanco("https://x.supabase.co", "sb_secret_abc")
    ).toThrow(/publicável/)
  })
  it("recusa o JWT antigo de service_role", () => {
    expect(() =>
      configDoBanco("https://x.supabase.co", jwt({ role: "service_role" }))
    ).toThrow(/publicável/)
  })
  it("aceita o JWT antigo de anon", () => {
    expect(
      configDoBanco("https://x.supabase.co", jwt({ role: "anon" }))?.url
    ).toBe("https://x.supabase.co")
  })
})

describe("opcoesDeCookie", () => {
  it("secure em https", () => {
    expect(opcoesDeCookie("https://exemplo.com.br").secure).toBe(true)
  })
  it("sem secure só em http na própria máquina, que é a prova local", () => {
    expect(opcoesDeCookie("http://localhost:3000").secure).toBe(false)
    expect(opcoesDeCookie("http://127.0.0.1:3117").secure).toBe(false)
  })
  it("http com domínio de verdade continua com secure: engano de configuração fecha", () => {
    expect(opcoesDeCookie("http://exemplo.com.br").secure).toBe(true)
  })
  it("sem endereço, assume https", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "")
    expect(opcoesDeCookie()).toEqual({
      path: "/",
      sameSite: "lax",
      secure: true,
    })
  })
})
