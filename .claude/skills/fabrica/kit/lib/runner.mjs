// Rodar um comando e saber o que ele mediu, não só se ele gritou.
//
// Classe de defeito que ele impede: ler código de saída como se fosse prova.
// Um script imprime "instalado" por cima do erro do crontab, e processo morto
// por tempo sai não-zero igual a falha legítima, sem o `finally` rodar. O
// pytest fecha o caso: ele sai 5 quando não rodou teste nenhum, e 5 não é
// "passou".
//
// 🚨 `spawnSync` com STRING ÚNICA e `shell: true`, porque npm, npx e python
// são `.cmd` no Windows. E lê `error`/`signal` ANTES de `status`.
//
// Prova: testes/teste-runner.mjs

import { spawnSync } from 'node:child_process'

const VAZIO = { rodaram: 0, falharam: 0, conhecido: false }

/**
 * Lê a saída de um runner de teste e diz quantos testes rodaram e quantos
 * falharam. `conhecido: false` quer dizer "não sei ler isto", nunca zero.
 */
export function lerTestes (saida = '') {
  if (!saida) return { ...VAZIO }

  // node:test, em TAP ou no resumo com ℹ
  const tapTotal = saida.match(/^\s*[#ℹ]\s*tests\s+(\d+)/m)
  if (tapTotal) {
    const tapFalha = saida.match(/^\s*[#ℹ]\s*fail\s+(\d+)/m)
    return {
      rodaram: Number(tapTotal[1]),
      falharam: tapFalha ? Number(tapFalha[1]) : 0,
      conhecido: true
    }
  }

  // vitest
  const vitest = saida.match(/^\s*Tests\s+(.+)$/m)
  if (vitest) {
    const linha = vitest[1]
    const passou = Number((linha.match(/(\d+)\s+passed/) ?? [0, 0])[1])
    const falhou = Number((linha.match(/(\d+)\s+failed/) ?? [0, 0])[1])
    const total = Number((linha.match(/\((\d+)\)/) ?? [0, passou + falhou])[1])
    return { rodaram: total || passou + falhou, falharam: falhou, conhecido: true }
  }

  // pytest: zero teste é ZERO, e zero é reprovação de quem chama
  if (/no tests ran/i.test(saida)) return { rodaram: 0, falharam: 0, conhecido: true }

  // 🚨 LINHA A LINHA, e de TRÁS para frente. Um regex sobre a saída inteira
  // erra, porque `\s` casa `\n`: ele atravessa três linhas do resumo do pytest
  //
  //   =========================== short test summary info ===========================
  //   FAILED tests/test_conversao.py::test_x - Failed: DID NOT RAISE
  //   ======================== 1 failed, 40 passed in 0.18s ========================
  //
  // casando os `=` da primeira, a palavra FAILED da segunda (o `i` a torna
  // `failed`) e os `=` da terceira. A captura vira "FAILED tests/..." — sem
  // nenhum número — e o runner devolve `rodaram: 0, conhecido: true`.
  //
  // ⚠️ O estrago é o pior possível: `rodaram: 0` com `conhecido: true` é o
  // runner AFIRMANDO que nenhum teste rodou. Toda mutação da trilha Python
  // reprova com "o runner não mediu nada", e nenhuma pode ser reexecutada.
  //
  // ⚠️ E de trás para frente porque a linha que interessa é a ÚLTIMA: o pytest
  // pode imprimir um resumo por sessão quando há `-p` ou plugins.
  const linhas = saida.split(/\r?\n/)
  for (let i = linhas.length - 1; i >= 0; i -= 1) {
    const pytest = linhas[i].match(/^=+\s*(.*(?:passed|failed|error).*?)\s*=+$/i)
    if (!pytest) continue
    const linha = pytest[1]
    const passou = Number((linha.match(/(\d+)\s+passed/) ?? [0, 0])[1])
    const falhou = Number((linha.match(/(\d+)\s+(?:failed|error)/) ?? [0, 0])[1])
    // ⚠️ Linha de resumo SEM número nenhum não é medida: é ruído com `=` em
    // volta. Dizer `rodaram: 0, conhecido: true` sobre ela seria repetir o
    // defeito com outra roupa.
    if (passou + falhou === 0) continue
    return { rodaram: passou + falhou, falharam: falhou, conhecido: true }
  }

  return { ...VAZIO }
}

/**
 * Roda o comando e devolve o que aconteceu.
 * @returns {{ saiu: number, sinal: string|null, mortoPorTempo: boolean, saida: string, testes: ReturnType<typeof lerTestes> }}
 */
/**
 * Variáveis que o runner do Node põe no ambiente e que ENVENENAM um
 * `node --test` filho: com `NODE_TEST_CONTEXT` herdado, o filho acha que está
 * reportando para um pai e emite **stdout vazio com status 0**.
 *
 * 🚨 É exatamente o verde que mente: sem tirar isto,
 * "rodou zero teste" chegaria aqui como "passou". Um portão chamado de dentro
 * de um teste cairia no mesmo buraco.
 */
const ENVENENAM = ['NODE_TEST_CONTEXT', 'NODE_TEST_WORKER_ID']

export function limparAmbiente (env) {
  const limpo = { ...env }
  for (const chave of ENVENENAM) delete limpo[chave]
  return limpo
}

export function rodar (comando, { cwd = process.cwd(), tempoMaximo = 10 * 60 * 1000, env = process.env, maxBuffer = 64 * 1024 * 1024 } = {}) {
  const r = spawnSync(comando, {
    cwd,
    env: limparAmbiente(env),
    shell: true,
    encoding: 'utf8',
    timeout: tempoMaximo,
    maxBuffer
  })

  const saida = `${r.stdout ?? ''}${r.stderr ?? ''}`
  // 🚨 O estouro do buffer chega com `status: null` e `SIGTERM`, a mesma cara
  // da morte por prazo. Ele se lê ANTES, pelo código do erro: sem isto, um
  // passo que falou demais apareceria como "MORTO POR TEMPO".
  const estourouBuffer = r.error?.code === 'ENOBUFS'
  const mortoPorTempo = !estourouBuffer && (
    r.error?.code === 'ETIMEDOUT' ||
    (r.status === null && r.signal != null)
  )

  let saiu
  if (estourouBuffer) saiu = 126
  else if (typeof r.status === 'number') saiu = r.status
  else if (mortoPorTempo) saiu = 124
  else saiu = 127

  return { saiu, sinal: r.signal ?? null, mortoPorTempo, estourouBuffer, saida, testes: lerTestes(saida) }
}
