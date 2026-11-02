// Pasta temporária que some de verdade, inclusive no Windows.
//
// Classe de defeito que ela impede: teste que deixa lixo, e teste que quebra
// com EPERM ao apagar a pasta de um processo que acabou de ser morto.
//
// 🚨 No Windows, apagar arquivo que ainda tem HANDLE ABERTO marca a exclusão
// como PENDENTE: o `rmSync` estoura com EPERM, ou retorna com sucesso e o
// arquivo continua aparecendo no `readdir`. No Linux o `unlink` tira a entrada
// na hora. Aqui ele reaparece sozinho sempre que um passo é morto por tempo
// com o cwd dentro da pasta, e parece outra coisa.
//
// A cura é ESPERAR a pasta drenar, com prazo. Se não drenar, é vazamento de
// verdade, e aí quem chama decide.
//
// Prova: testes/teste-temporaria.mjs

import { mkdtempSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export function criar (prefixo = 'fabrica-') {
  return mkdtempSync(join(tmpdir(), prefixo))
}

/**
 * Apaga a pasta, esperando o Windows soltar os handles.
 *
 * 🚨 Quando não drena, GRITA no stderr com o caminho: os chamadores ignoram o
 * `false`, e as pastas `fabrica-*` se acumulam em %TEMP% (577 medidas) sem
 * nenhuma linha de aviso. `calado: true` é para quem espera o não drenar.
 *
 * `existe` e `remover` existem para o teste simular o disco preso.
 * @returns {boolean} true quando a pasta realmente sumiu
 */
export function apagar (caminho, {
  prazoMs = 4000, passoMs = 120, calado = false, existe = existsSync, remover = rmSync
} = {}) {
  if (!caminho || !existe(caminho)) return true
  const limite = Date.now() + prazoMs
  let ultimoErro = null

  while (Date.now() < limite) {
    try {
      remover(caminho, { recursive: true, force: true, maxRetries: 4, retryDelay: passoMs })
      if (!existe(caminho)) return true
    } catch (erro) {
      ultimoErro = erro
    }
    esperar(passoMs)
  }

  const sumiu = !existe(caminho)
  if (!sumiu && !calado) {
    console.error(`⚠ a pasta ${caminho} não drenou em ${prazoMs}ms (${ultimoErro?.code ?? 'sem erro'}): ela vazou`)
  }
  return sumiu
}

/** Espera sem async, porque quem chama está num finally síncrono. */
function esperar (ms) {
  const fim = Date.now() + ms
  while (Date.now() < fim) {
    // ocupado de propósito: o finally de um teste não pode ser assíncrono
  }
}

/** Roda a função com uma pasta temporária, e apaga no fim dê no que der. */
export function comPasta (prefixo, trabalho) {
  const raiz = criar(prefixo)
  try {
    return trabalho(raiz)
  } finally {
    apagar(raiz)
  }
}
