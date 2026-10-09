// fundação: semente v1 · é seu
// mutação: src/lib/formato.ts · "}).format(centavos / 100)" → "}).format(centavos / 10)" · pega em 09/10/2026
import { afterEach, describe, expect, it, vi } from "vitest"

import { dataBrasilia, emReais, telefone } from "./formato"

const NBSP = "\u00a0"

afterEach(() => vi.unstubAllEnvs())

describe("emReais", () => {
  it("recebe centavos e usa vírgula, ponto de milhar e o espaço que não quebra", () => {
    expect(emReais(123450)).toBe(`R$${NBSP}1.234,50`)
  })
  it("sem centavos quando pedido", () => {
    expect(emReais(199000, 0)).toBe(`R$${NBSP}1.990`)
  })
  it("recusa o que não é centavo inteiro: dinheiro não mora em ponto flutuante", () => {
    expect(() => emReais(1234.5)).toThrow(RangeError)
    expect(() => emReais(Number.NaN)).toThrow(RangeError)
  })
})

describe("telefone", () => {
  it("celular com o 55 e pontuação", () => {
    expect(telefone("+55 (11) 98765-4321")).toBe("(11) 98765-4321")
  })
  it("fixo", () => {
    expect(telefone("1134567890")).toBe("(11) 3456-7890")
  })
  it("o que não é telefone vira null", () => {
    expect(telefone("123")).toBeNull()
  })
})

describe("dataBrasilia", () => {
  it("às 23h de Brasília ainda é o mesmo dia, mesmo com o UTC no dia seguinte", () => {
    // O relógio da máquina em UTC, como no CI: numa máquina em Brasília, a
    // função SEM o fuso também passaria.
    vi.stubEnv("TZ", "UTC")
    expect(dataBrasilia(new Date("2026-09-23T02:00:00Z"))).toBe("22/09/2026")
  })
})
