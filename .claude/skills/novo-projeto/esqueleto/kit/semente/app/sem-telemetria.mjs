// fundação: semente v1 · é seu
// node sem-telemetria.mjs <dev|build|start>
//
// A telemetria do Next nasce DESLIGADA (constituição IV: o que fala com
// terceiro nasce desligado). O Next a liga antes de ler o next.config.ts, e o
// `node --env-file` quebra os workers do build (ERR_WORKER_INVALID_EXEC_ARGV):
// o caminho que funciona é pôr a variável no processo e só então carregar o
// Next. Medido com `next telemetry status`: "Enabled" sem este
// arquivo, "Disabled" com ele. ⚠️ O NEXT_TELEMETRY_DEBUG não serve de régua:
// ele imprime os eventos mesmo com a telemetria desligada.
process.env.NEXT_TELEMETRY_DISABLED = "1"
await import("next/dist/bin/next")
