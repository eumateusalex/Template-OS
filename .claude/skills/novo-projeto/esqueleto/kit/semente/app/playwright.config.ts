// fundação: semente v1 · é seu
import { defineConfig, devices } from "@playwright/test"

/**
 * A tela, nos dois tamanhos que a casa mede: o celular (Pixel 7, 412 de
 * largura) e o computador (1280 × 900).
 *
 * 🚨 O build NÃO roda aqui dentro. Ele é o passo `build` do portão, antes do
 * `tela`: dentro do `webServer` ele estoura o prazo. Aqui só se serve o que já foi buildado, do jeito que a imagem
 * do Docker serve (`output: "standalone"`), na porta 3117, que não briga com o
 * `next dev` de ninguém.
 */
const PORTA = 3117

export default defineConfig({
  testDir: "tela",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: { baseURL: `http://127.0.0.1:${PORTA}` },
  projects: [
    { name: "celular", use: { ...devices["Pixel 7"] } },
    {
      name: "computador",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 },
      },
    },
  ],
  webServer: {
    command: `node tela/servir.mjs ${PORTA}`,
    url: `http://127.0.0.1:${PORTA}/vitrine`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
