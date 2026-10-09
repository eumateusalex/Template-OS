#!/usr/bin/env node
// fundação: conferido v1 · o que se mede na tela mora em tela/*.spec.ts, que é do projeto
//
// node fundacao/portao/tela.mjs [--raiz <dir>]
//
// Roda os testes de tela do projeto (Playwright, celular e computador) e lê o
// que eles MEDIRAM, não só se o processo gritou.
//
// Classe de defeito: o teste de tela que diz "passou" sem ter olhado a tela.
// Nenhum teste rodou, o servidor nem subiu, a saída mudou de formato: os três
// terminam num código de saída que não prova nada. É o princípio VI da
// constituição, o do montador que imprime "0 peça(s) montada(s)" e sai 0.
//
// ⚠️ O navegador se instala na hora (`npx playwright install chromium`, e com
// `--with-deps` no CI): a documentação do Playwright 1.63 desaconselha cachear
// o binário no CI, porque restaurar leva o mesmo tempo que baixar.
//
// Prova: provas/tela.mjs

import { readFileSync } from 'node:fs'

import { Relatorio } from '../lib/saida.mjs'
import { rodar } from '../lib/runner.mjs'
import { comoComando } from '../lib/casca.mjs'

/** O que o repórter `list` do Playwright diz no fim: passaram, falharam, instáveis, pularam. */
export function lerPlaywright (saida) {
  const texto = String(saida)
  const numero = (re) => Number((texto.match(re) ?? [0, 0])[1])
  const passaram = numero(/^\s*(\d+)\s+passed\b/m)
  const falharam = numero(/^\s*(\d+)\s+failed\b/m)
  const instaveis = numero(/^\s*(\d+)\s+flaky\b/m)
  // Pulado não reprova (a fonte do sistema pula o teste da fonte, com razão),
  // mas se diz: quem lê o portão sabe o que não foi medido.
  const pularam = numero(/^\s*(\d+)\s+skipped\b/m)
  const rodando = texto.match(/Running\s+(\d+)\s+tests?/)
  const semTeste = /No tests found/i.test(texto) || (rodando && Number(rodando[1]) === 0)
  const conhecido = passaram + falharam + instaveis > 0 || Boolean(semTeste)
  const quais = texto.split('\n').filter((l) => /^\s+\[[^\]]+\]\s+›/.test(l)).map((l) => l.trim())
  return { passaram, falharam, instaveis, pularam, rodaram: passaram + falharam + instaveis, conhecido, quais }
}

/**
 * O ambiente da instalação do navegador.
 *
 * 🚨 `PLAYWRIGHT_SKIP_BROWSER_GC=1`: sem ele, o `playwright install` APAGA do
 * cache da máquina as versões que este projeto não usa, e o cache é
 * compartilhado. Medido: o projeto de prova apaga o Chromium de outra
 * versão que outra ferramenta da máquina usa, e o teste dela sai verde sem
 * abrir navegador.
 */
export function ambienteDaInstalacao (env) {
  return { ...env, PLAYWRIGHT_SKIP_BROWSER_GC: '1' }
}

function rodarATela (raiz, env) {
  if (env.FUNDACAO_TELA_FALSA) {
    return { saiu: Number(env.FUNDACAO_TELA_SAIU ?? 0), saida: readFileSync(env.FUNDACAO_TELA_FALSA, 'utf8') }
  }
  const navegador = rodar(`npx playwright install ${env.CI ? '--with-deps ' : ''}chromium`, { cwd: raiz, tempoMaximo: 10 * 60 * 1000, env: ambienteDaInstalacao(env) })
  if (navegador.saiu !== 0) return { saiu: navegador.saiu, saida: navegador.saida, semNavegador: true }
  return rodar('npx playwright test --reporter=list', { cwd: raiz, tempoMaximo: 15 * 60 * 1000 })
}

export function conferir (raiz, { env = process.env }, { escreve = console.log } = {}) {
  const r = new Relatorio('tela', {
    escreve,
    regra: 'tela que nenhum teste olhou não passou: zero teste, servidor que não subiu e saída ilegível reprovam'
  })
  const resultado = rodarATela(raiz, env)
  if (resultado.semNavegador) {
    r.naoMedido(`não consegui instalar o Chromium: ${resultado.saida.trim().split('\n').slice(-1)[0]}`)
    return r.fechar()
  }
  const lido = lerPlaywright(resultado.saida)
  const ultima = resultado.saida.trim().split('\n').slice(-1)[0] ?? ''

  if (!lido.conhecido) {
    r.naoMedido(`não consegui ler o resultado do Playwright (saiu ${resultado.saiu}): ${ultima}`)
  } else if (lido.rodaram === 0) {
    r.achado('tela/', 'zero teste de tela rodou: ninguém olhou a página', 'escreva o teste em tela/*.spec.ts (a vitrine da fundação é o ponto de partida)')
  } else {
    if (lido.falharam > 0) {
      for (const q of lido.quais.slice(0, 10)) r.achado('tela', `falhou: ${q}`, 'rode npx playwright test --ui para ver na tela')
      if (lido.quais.length === 0) r.achado('tela', `${lido.falharam} teste(s) de tela falharam`, 'rode npx playwright test --ui para ver na tela')
    } else if (resultado.saiu !== 0) {
      r.naoMedido(`o Playwright saiu ${resultado.saiu} sem teste falhando: ${ultima}`)
    }
    if (lido.instaveis > 0) r.nota(`${lido.instaveis} teste(s) instável(is) (flaky): passaram na segunda tentativa, e merecem olhar`)
    r.nota(`${lido.passaram} passaram, ${lido.falharam} falharam, ${lido.instaveis} instáveis, ${lido.pularam} pularam`)
  }

  r.varreu(lido.rodaram)
  return r.fechar()
}

comoComando(import.meta.url, (raiz, contexto, opcoes) => conferir(raiz, contexto, opcoes))
