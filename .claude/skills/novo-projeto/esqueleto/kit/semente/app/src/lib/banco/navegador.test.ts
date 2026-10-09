// fundação: semente v1 · é seu
// mutação: src/lib/banco/navegador.ts · "if (cliente) return cliente" → "if (false) return cliente" · pega em 09/10/2026
// mutação: src/lib/banco/navegador.ts · "if (!config) return null" → "if (false) return null" · pega em 09/10/2026
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const falso = vi.hoisted(() => ({ chamadas: [] as unknown[] }))
vi.mock("@supabase/ssr", () => ({
  createBrowserClient: (_url: string, _chave: string, opcoes: unknown) => {
    falso.chamadas.push(opcoes)
    return { numero: falso.chamadas.length }
  },
}))

async function modulo() {
  vi.resetModules()
  return import("./navegador")
}

function ligar() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co")
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x")
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://exemplo.com.br")
}

beforeEach(() => {
  falso.chamadas.length = 0
})
afterEach(() => vi.unstubAllEnvs())

describe("bancoNavegador", () => {
  it("desligado sem as variáveis", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "")
    const { bancoNavegador } = await modulo()
    expect(bancoNavegador()).toBeNull()
  })
  it("um cliente só, por mais que se peça", async () => {
    ligar()
    const { bancoNavegador } = await modulo()
    expect(bancoNavegador()).toBe(bancoNavegador())
    expect(falso.chamadas).toHaveLength(1)
  })
  it("com as mesmas marcas de cookie do servidor", async () => {
    ligar()
    const { bancoNavegador } = await modulo()
    bancoNavegador()
    expect(falso.chamadas[0]).toEqual({
      cookieOptions: { path: "/", sameSite: "lax", secure: true },
    })
  })
})
