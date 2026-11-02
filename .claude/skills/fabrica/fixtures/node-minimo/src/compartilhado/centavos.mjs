// Dinheiro em inteiro, nunca em float. É a decisão do catálogo, e é a razão
// de este arquivo existir no fixture: ele dá ao conferidor `mutacoes` uma área
// obrigatória de verdade para cobrar.

/** Soma dois valores em centavos. */
export function somar (a, b) {
  return a + b
}

/** Aplica uma porcentagem, arredondando para o centavo mais próximo. */
export function comDesconto (centavos, porcento) {
  return centavos - Math.round((centavos * porcento) / 100)
}
