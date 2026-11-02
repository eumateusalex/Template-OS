// Ler cobertura em lcov. Um parser só para as três trilhas.
//
// node --test --experimental-test-coverage --test-reporter=lcov
// npx vitest run --coverage --coverage.reporter=lcov
// python -m coverage lcov
//
// Classe de defeito que ele impede: afirmar 100% quando não havia linha a
// cobrir. Zero de zero não é cem por cento: é "não medi nada", e o princípio VI
// manda tratar isso como vermelho.
//
// Prova: testes/teste-lcov.mjs

/**
 * @returns {{ arquivos: {caminho: string, linhas: number, cobertas: number}[],
 *             linhas: number, cobertas: number, porcentagem: number, vazio: boolean }}
 */
export function lerLcov (texto = '') {
  const arquivos = []
  let atual = null

  for (const bruta of String(texto).replace(/\r\n/g, '\n').split('\n')) {
    const linha = bruta.trim()
    if (linha === '') continue

    const dois = linha.indexOf(':')
    if (dois === -1) continue
    const chave = linha.slice(0, dois)
    const valor = linha.slice(dois + 1)

    if (chave === 'SF') {
      atual = { caminho: valor.split('\\').join('/'), linhas: 0, cobertas: 0 }
      arquivos.push(atual)
      continue
    }
    if (!atual) continue
    if (chave === 'LF') atual.linhas += Number(valor) || 0
    else if (chave === 'LH') atual.cobertas += Number(valor) || 0
    else if (chave === 'end_of_record') atual = null
  }

  const linhas = arquivos.reduce((s, a) => s + a.linhas, 0)
  const cobertas = arquivos.reduce((s, a) => s + a.cobertas, 0)
  const vazio = linhas === 0
  const porcentagem = vazio ? 0 : Math.round((cobertas / linhas) * 1000) / 10

  return { arquivos, linhas, cobertas, porcentagem, vazio }
}
