// fundação: semente v1 · é seu
// mutação: src/lib/banco/servidor.ts · "if (!config) return null" → "if (false) return null" · pega em 09/10/2026
// mutação: src/lib/banco/servidor.ts · "jarra.set(name, value, options)" → "void jarra" · pega em 09/10/2026
// mutação: src/lib/banco/servidor.ts · "if (!claims?.sub) return null" → "if (!claims) return null" · pega em 09/10/2026
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

type Novo = { name: string; value: string; options: object }
type Opcoes = {
  cookieOptions: { secure: boolean }
  cookies: { getAll: () => unknown; setAll: (novos: Novo[]) => void }
}

const falso = vi.hoisted(() => ({
  jarra: {
    getAll: () => [{ name: "a", value: "1" }],
    set: (() => {}) as (...a: unknown[]) => void,
  },
  getClaims: async (): Promise<unknown> => ({ data: null }),
  chamadas: [] as { chave: string; opcoes: unknown }[],
}))

vi.mock("next/headers", () => ({ cookies: async () => falso.jarra }))
vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url: string, chave: string, opcoes: unknown) => {
    falso.chamadas.push({ chave, opcoes })
    return { auth: { getClaims: () => falso.getClaims() } }
  },
}))

import { bancoServidor, usuarioAtual } from "./servidor"

const opcoesDaChamada = () => falso.chamadas[0].opcoes as Opcoes

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co")
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x")
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://exemplo.com.br")
  falso.chamadas.length = 0
  falso.jarra.set = () => {}
})
afterEach(() => vi.unstubAllEnvs())

describe("bancoServidor", () => {
  it("desligado sem as variáveis, sem tocar na biblioteca", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "")
    expect(await bancoServidor()).toBeNull()
    expect(falso.chamadas).toHaveLength(0)
  })
  it("usa a chave publicável e o cookie com secure", async () => {
    await bancoServidor()
    expect(falso.chamadas[0].chave).toBe("sb_publishable_x")
    expect(opcoesDaChamada().cookieOptions.secure).toBe(true)
  })
  it("lê e escreve na jarra de cookies do Next", async () => {
    const escritos: unknown[] = []
    falso.jarra.set = (...a) => escritos.push(a)
    await bancoServidor()
    expect(opcoesDaChamada().cookies.getAll()).toEqual([
      { name: "a", value: "1" },
    ])
    opcoesDaChamada().cookies.setAll([
      { name: "b", value: "2", options: { path: "/" } },
    ])
    expect(escritos).toEqual([["b", "2", { path: "/" }]])
  })
  it("Server Component não escreve cookie, e isso não derruba a página", async () => {
    falso.jarra.set = () => {
      throw new Error("Cookies can only be modified in a Server Action")
    }
    await bancoServidor()
    expect(() =>
      opcoesDaChamada().cookies.setAll([{ name: "b", value: "2", options: {} }])
    ).not.toThrow()
  })
})

describe("usuarioAtual", () => {
  it("null sem sessão", async () => {
    falso.getClaims = async () => ({ data: null })
    expect(await usuarioAtual()).toBeNull()
  })
  it("null com token sem sub: sem dono não há usuário", async () => {
    falso.getClaims = async () => ({ data: { claims: { email: "a@b.c" } } })
    expect(await usuarioAtual()).toBeNull()
  })
  it("id e email do token conferido", async () => {
    falso.getClaims = async () => ({
      data: { claims: { sub: "u1", email: "a@b.c" } },
    })
    expect(await usuarioAtual()).toEqual({ id: "u1", email: "a@b.c" })
  })
  it("email que não é texto vira null", async () => {
    falso.getClaims = async () => ({
      data: { claims: { sub: "u1", email: 7 } },
    })
    expect(await usuarioAtual()).toEqual({ id: "u1", email: null })
  })
  it("null com o banco desligado", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "")
    expect(await usuarioAtual()).toBeNull()
  })
})
