// A isenção declarada: `// <marca>: <razão>` na linha, ou na de cima.
//
// Classe de defeito que ela impede: isenção virar carimbo. A isenção mora ao
// lado da linha, e não em lista apartada, porque lista de exceção envelhece
// sozinha. A razão é obrigatória: sem ela, a marca não isenta nada.
//
// Prova: testes/teste-isencao.mjs

export const MARCAS = [
  'camada declarada',
  'silêncio declarado',
  'tamanho declarado',
  'sem teste declarado',
  'sem spec declarado',
  'número vivo',
  'segredo de exemplo',
  'vermelho não visto'
]

export const RAZAO_MINIMA = 5

const ACENTOS = {
  á: 'a', à: 'a', â: 'a', ã: 'a', ä: 'a',
  é: 'e', è: 'e', ê: 'e', ë: 'e',
  í: 'i', ì: 'i', î: 'i', ï: 'i',
  ó: 'o', ò: 'o', ô: 'o', õ: 'o', ö: 'o',
  ú: 'u', ù: 'u', û: 'u', ü: 'u',
  ç: 'c', ñ: 'n'
}

/**
 * Tira o acento SEM mudar o comprimento da string, para o índice continuar
 * valendo na linha original. `normalize('NFD')` não serve: ele muda o tamanho.
 */
function plano (texto) {
  return texto.toLowerCase().replace(/[áàâãäéèêëíìîïóòôõöúùûüçñ]/g, (c) => ACENTOS[c] ?? c)
}

function leMarca (linha, marca) {
  const alvo = `${plano(marca)}:`
  const pos = plano(linha).indexOf(alvo)
  if (pos === -1) return null

  const razao = linha
    .slice(pos + alvo.length)
    .replace(/-->\s*$/, '')
    .replace(/\*\/\s*$/, '')
    .trim()

  if (razao.length < RAZAO_MINIMA) {
    return {
      isento: false,
      razao,
      porque: `a marca "${marca}" está sem razão escrita (mínimo ${RAZAO_MINIMA} caracteres)`
    }
  }
  return { isento: true, razao, porque: '' }
}

/**
 * Esta linha está isenta desta marca?
 * @param {string[]} linhas  o arquivo inteiro, linha a linha
 * @param {number} i  o índice da linha em questão
 * @param {string} marca  uma das MARCAS
 * @returns {{ isento: boolean, razao: string, porque: string }}
 */
export function isento (linhas, i, marca) {
  for (const j of [i, i - 1]) {
    if (j < 0 || j >= linhas.length) continue
    const r = leMarca(linhas[j] ?? '', marca)
    if (r) return r
  }
  return {
    isento: false,
    razao: '',
    porque: `sem "${marca}: <razão>" nesta linha nem na de cima`
  }
}

/** Uma linha de item de lista (`- [x] T001 …`, `* algo`, `1. algo`). */
const ITEM = /^\s*(?:[-*+]\s|\d+[.)]\s)/

/**
 * A mesma pergunta, mas para uma linha de LISTA: olha a própria linha e as
 * continuações indentadas dela, NUNCA a de cima.
 *
 * 🚨 Ela existe porque o `isento` genérico vaza para baixo numa lista de
 * tarefas: `T141` passaria sem recibo porque `T140`, a linha acima, termina
 * com `sem teste declarado: <razão>`. Em código a linha de cima é o
 * comentário da linha; numa lista, a linha de cima é OUTRO ITEM, e cada item
 * dispensado dispensaria o seguinte de graça.
 *
 * ⚠️ A continuação indentada continua valendo, porque tarefa com razão longa
 * se escreve com a razão na linha seguinte. Sem isso, rastro que já existe
 * quebraria.
 *
 * @param {string[]} linhas  o arquivo inteiro, linha a linha
 * @param {number} i  o índice da linha do item
 * @param {string} marca  uma das MARCAS
 */
export function isentoNoItem (linhas, i, marca) {
  for (let j = i; j < linhas.length; j += 1) {
    if (j > i && (ITEM.test(linhas[j]) || !/^\s+\S/.test(linhas[j]))) break
    const r = leMarca(linhas[j] ?? '', marca)
    if (r) return r
  }
  return {
    isento: false,
    razao: '',
    porque: `sem "${marca}: <razão>" neste item nem na continuação dele`
  }
}
