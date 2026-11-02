// fundação: semente v1 · é seu
import { fileURLToPath } from "node:url"

import { defineConfig } from "vitest/config"

/**
 * ⚠️ O `@/` tem que casar com o `paths` do tsconfig: divergindo, o teste passa
 * e o build quebra, ou o contrário.
 *
 * 🚨 `server-only` vira um módulo vazio aqui. No Next ele trava a importação
 * pelo navegador; no Vitest ele só lançaria erro e mataria o teste do
 * `servidor.ts` antes da primeira asserção.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./testes/vazio.ts", import.meta.url)
      ),
    },
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "testes/**/*.test.ts"],
    exclude: [
      "node_modules/**",
      ".next/**",
      "tela/**",
      "fabrica/**",
      "fundacao/**",
    ],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.*", "src/components/ui/**", "src/lib/tipos/**"],
    },
  },
})
