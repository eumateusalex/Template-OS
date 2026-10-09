// fundação: semente v1 · é seu
// mutação: src/lib/banco/sessao.ts · "resposta.headers.set(nome, valor)" → "void valor" · pega em 09/10/2026
// mutação: src/lib/banco/sessao.ts · "requisicao.cookies.set(name, value)" → "void name" · pega em 09/10/2026
// mutação: src/lib/banco/sessao.ts · "if (!avisou) {" → "if (true) {" · pega em 09/10/2026
// mutação: src/lib/banco/sessao.ts · "await banco.auth.getClaims()" → "void banco" · pega em 09/10/2026
// mutação: src/lib/banco/sessao.ts · "resposta.cookies.set(name, value, options)" → "void options" · pega em 09/10/2026
import { NextRequest } from "next/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

type Novo = { name: string; value: string; options: object }
type Opcoes = {
  cookieOptions: object
  cookies: {
    getAll: () => unknown
    setAll: (novos: Novo[], cabecalhos?: Record<string, string>) => void
  }
}

const falso = vi.hoisted(() => ({
  opcoes: null as unknown,
  validacoes: 0,
  aoValidar: () => {},
}))

vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url: string, _chave: string, opcoes: unknown) => {
    falso.opcoes = opcoes
    return {
      auth: {
        getClaims: async () => {
          falso.validacoes += 1
          falso.aoValidar()
          return { data: null }
        },
      },
    }
  },
}))

async function modulo() {
  vi.resetModules()
  return import("./sessao")
}

const opcoes = () => falso.opcoes as Opcoes | null
const requisicao = () =>
  new NextRequest("https://exemplo.com.br/conta", {
    headers: { cookie: "sb-a=1" },
  })

function ligar() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co")
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x")
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://exemplo.com.br")
}

beforeEach(() => {
  falso.opcoes = null
  falso.validacoes = 0
  falso.aoValidar = () => {}
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe("renovarSessao", () => {
  it("banco desligado: a requisição segue, e o aviso sai uma vez só", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "")
    const aviso = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { renovarSessao } = await modulo()
    const resposta = await renovarSessao(requisicao())
    await renovarSessao(requisicao())
    expect(resposta.headers.get("x-middleware-next")).toBe("1")
    expect(aviso).toHaveBeenCalledTimes(1)
    expect(opcoes()).toBeNull()
  })
  it("banco ligado: valida o token a cada navegação", async () => {
    ligar()
    const { renovarSessao } = await modulo()
    await renovarSessao(requisicao())
    await renovarSessao(requisicao())
    expect(falso.validacoes).toBe(2)
  })
  it("lê os cookies da requisição", async () => {
    ligar()
    const { renovarSessao } = await modulo()
    await renovarSessao(requisicao())
    expect(opcoes()?.cookies.getAll()).toEqual([{ name: "sb-a", value: "1" }])
  })
  it("o cookie renovado sai na resposta, com as marcas de segurança", async () => {
    ligar()
    falso.aoValidar = () =>
      opcoes()?.cookies.setAll([
        { name: "sb-a", value: "2", options: { path: "/", secure: true } },
      ])
    const { renovarSessao } = await modulo()
    const resposta = await renovarSessao(requisicao())
    expect(resposta.cookies.get("sb-a")?.value).toBe("2")
    expect(resposta.cookies.get("sb-a")?.secure).toBe(true)
    // O cookie volta também para a REQUISIÇÃO: é o que faz o Server Component
    // da mesma navegação enxergar o token novo.
    expect(resposta.headers.get("x-middleware-request-cookie")).toBe("sb-a=2")
    expect(opcoes()?.cookieOptions).toEqual({
      path: "/",
      sameSite: "lax",
      secure: true,
    })
  })
  it("a resposta que renova a sessão não vai para cache compartilhado", async () => {
    // Sem estes cabeçalhos, um CDN ou proxy guarda a resposta com o Set-Cookie
    // do token, e o token de uma pessoa chega a outra (a 0.12.7 do
    // @supabase/ssr os manda pelo segundo parâmetro do setAll).
    ligar()
    falso.aoValidar = () =>
      opcoes()?.cookies.setAll(
        [{ name: "sb-a", value: "2", options: { path: "/" } }],
        {
          "Cache-Control":
            "private, no-cache, no-store, must-revalidate, max-age=0",
          Expires: "0",
          Pragma: "no-cache",
        }
      )
    const { renovarSessao } = await modulo()
    const resposta = await renovarSessao(requisicao())
    expect(resposta.headers.get("cache-control")).toContain("no-store")
    expect(resposta.headers.get("pragma")).toBe("no-cache")
  })
})
