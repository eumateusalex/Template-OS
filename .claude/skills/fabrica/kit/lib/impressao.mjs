// A impressão digital de um arquivo do kit.
//
// 🚨 Ela ignora a QUEBRA DE LINHA, e isso não é frouxidão: é a única forma de o
// manifesto atravessar sistema operacional.
//
// Sem ela, arquivos do kit acusam "difere do sha256 registrado" no runner Linux
// com o conteúdo idêntico (12 de 50 num CI real). A causa
// é o git: com `core.autocrlf=true` (o padrão de quem instala no Windows) ele
// guarda LF no repositório e escreve CRLF no disco. O manifesto calculado sobre
// CRLF não bate com o LF que o runner lê.
//
// Sem isto, o conferidor `kit` acusaria TODO alvo que passa por um checkout
// noutro sistema, que é justamente o caso do CI. Um guarda que acusa o inocente
// é um guarda que alguém desliga.
//
// ⚠️ A normalização vale só para TEXTO. Arquivo binário se lê como está: trocar
// bytes 0D 0A dentro de um PNG estragaria a impressão de propósito.
//
// Prova: testes/teste-impressao.mjs

import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

// ⚠️ `xml`, `svg` e `csv` também: os relatórios de runner que o kit carrega
// como fixture são `.xml`, e gravados com CRLF no Windows e lidos com LF no
// Linux acusariam "alguém editou o kit".
const TEXTO = /\.(mjs|js|cjs|ts|tsx|md|json|ya?ml|txt|py|sh|toml|cfg|ini|html|css|xml|svg|csv)$/i

/** Troca CRLF por LF, sem tocar em mais nada. */
export function semCarrinho (bytes) {
  const texto = bytes.toString('utf8')
  if (!texto.includes('\r\n')) return bytes
  return Buffer.from(texto.split('\r\n').join('\n'), 'utf8')
}

export function ehTexto (caminho) {
  return TEXTO.test(caminho)
}

/**
 * O sha256 do arquivo, com a quebra de linha normalizada quando ele é texto.
 * @param {string} caminho
 */
export function impressaoDe (caminho) {
  const bytes = readFileSync(caminho)
  const normalizado = ehTexto(caminho) ? semCarrinho(bytes) : bytes
  return createHash('sha256').update(normalizado).digest('hex')
}
