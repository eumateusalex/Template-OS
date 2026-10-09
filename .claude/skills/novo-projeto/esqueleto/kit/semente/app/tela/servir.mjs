// fundação: semente v1 · é seu
// node tela/servir.mjs [porta]
//
// Serve o build de produção do jeito que o Dockerfile serve: o servidor do
// `output: "standalone"`, com `public/` e `.next/static/` ao lado dele.
//
// 🚨 Com `output: "standalone"`, `next start` não é o caminho: o servidor de
// verdade é `.next/standalone/server.js`, e ele só acha CSS, JS e fontes se as
// duas pastas forem copiadas para dentro (medido num projeto real).

import { cpSync, existsSync } from "node:fs"
import { spawn } from "node:child_process"

const porta = process.argv[2] ?? "3117"
const pronto = ".next/standalone/server.js"

if (!existsSync(pronto)) {
  console.error(`✗ não existe ${pronto}: rode "npm run build" antes da tela`)
  process.exit(1)
}
cpSync(".next/static", ".next/standalone/.next/static", { recursive: true })
if (existsSync("public"))
  cpSync("public", ".next/standalone/public", { recursive: true })

const servidor = spawn(process.execPath, [pronto], {
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: porta,
    HOSTNAME: "127.0.0.1",
    NEXT_TELEMETRY_DISABLED: "1",
  },
})
for (const sinal of ["SIGINT", "SIGTERM"])
  process.on(sinal, () => servidor.kill(sinal))
servidor.on("exit", (codigo) => process.exit(codigo ?? 0))
