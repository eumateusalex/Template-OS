// fundação: semente v1 · é seu
// fundação: banco (início)
// mutação: next.config.ts · "configDoBanco()" → "void configDoBanco" · pega em 09/10/2026
// fundação: banco (fim)
import { afterEach, expect, it, vi } from "vitest"

afterEach(() => vi.unstubAllEnvs())

async function carregarConfig() {
  vi.resetModules()
  return import("../next.config")
}

// fundação: banco (início)
it("o build recusa a chave secreta antes de escrever o JavaScript do navegador", async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co")
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_secret_x")
  await expect(carregarConfig()).rejects.toThrow(/publicável/)
})

it("com a chave publicável, o config carrega", async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co")
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x")
  await expect(carregarConfig()).resolves.toBeDefined()
})

it("sem o banco ligado, o config carrega", async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "")
  await expect(carregarConfig()).resolves.toBeDefined()
})
// fundação: banco (fim)

it("o config carrega e declara os cabeçalhos de segurança em toda rota", async () => {
  const { default: config } = await carregarConfig()
  const regras = await config.headers?.()
  const toda = regras?.find((r) => r.source === "/:caminho*")
  expect(toda?.headers.map((h) => h.key)).toEqual(
    expect.arrayContaining([
      "X-Content-Type-Options",
      "Referrer-Policy",
      "Permissions-Policy",
      "X-Frame-Options",
    ])
  )
})
