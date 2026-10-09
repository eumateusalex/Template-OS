// Relatório de conferidor: a única forma de um conferidor do kit falar.
//
// Classe de defeito que ele impede: conferidor que aprova sem ter medido nada.
// É o auditor que anuncia "tudo conforme" com o CLI falhando por inteiro, e o
// `montar-peca.js --todas` que imprime "0 peça(s) montada(s)" e sai com
// código 0.
//
// É o princípio VI da constituição, em código: verde medindo zero é vermelho,
// e "não consegui medir" é reprovação.
//
// Prova: testes/teste-saida.mjs

const TEM_COR = process.env.NO_COLOR === undefined && process.env.TERM !== 'dumb'

const COR = {
  vermelho: '[31m',
  verde: '[32m',
  amarelo: '[33m',
  cinza: '[90m',
  fim: '[0m'
}

export function pinta (texto, nome) {
  if (!TEM_COR || !COR[nome]) return texto
  return `${COR[nome]}${texto}${COR.fim}`
}

export class Relatorio {
  /**
   * @param {string} nome  o nome do passo, como aparece no portão
   * @param {{ escreve?: (linha: string) => void, regra?: string }} opcoes
   */
  constructor (nome, { escreve = console.log, regra = '' } = {}) {
    this.nome = nome
    this.escreve = escreve
    this.regra = regra
    this.achados = []
    this.naoMedidos = []
    this.notas = []
    this.varridos = null
  }

  /** Quantos arquivos (ou linhas, ou o que for a unidade) foram olhados. */
  varreu (quantos) {
    this.varridos = (this.varridos ?? 0) + Number(quantos || 0)
    return this
  }

  /** Um defeito, com onde, o quê e o conserto concreto. */
  achado (local, defeito, conserto = '') {
    this.achados.push({ local, defeito, conserto })
    return this
  }

  /** O que este conferidor não conseguiu medir. Reprova, nunca passa calado. */
  naoMedido (razao) {
    this.naoMedidos.push(razao)
    return this
  }

  /** Uma observação que não reprova. */
  nota (texto) {
    this.notas.push(texto)
    return this
  }

  /**
   * Catraca: o número não pode piorar. Piso ausente é reprovação, porque sem
   * linha de base não se mede nada.
   * @returns {boolean} true quando está dentro da catraca
   */
  catraca (oQue, atual, piso) {
    if (piso === undefined || piso === null || Number.isNaN(Number(piso))) {
      this.naoMedido(
        `${oQue}: sem linha de base. Medi ${atual} agora; declare o piso em ` +
        'fabrica/stack.mjs, com a data ao lado.'
      )
      return false
    }
    if (atual > piso) {
      this.achado(
        oQue,
        `piorou: ${atual} agora, e o piso é ${piso}`,
        `conserte o que entrou, ou suba o piso em fabrica/stack.mjs com a razão e a data`
      )
      return false
    }
    if (atual < piso) {
      this.nota(`${oQue}: a catraca pode descer para ${atual} (o piso é ${piso})`)
    }
    return true
  }

  /**
   * Imprime e devolve o código de saída: 0 verde, 1 vermelho.
   * Quem chama é quem passa isso para o `process.exit`.
   */
  fechar () {
    let ruim = false

    for (const a of this.achados) {
      const conserto = a.conserto ? ` — ${a.conserto}` : ''
      this.escreve(`  ${pinta('✗', 'vermelho')} ${a.local} — ${a.defeito}${conserto}`)
      ruim = true
    }

    for (const n of this.naoMedidos) {
      this.escreve(`  ${pinta('⚠', 'amarelo')} não medido: ${n}`)
      ruim = true
    }

    if (this.varridos === null || this.varridos === 0) {
      this.escreve(
        `  ${pinta('✗', 'vermelho')} nada foi medido: ` +
        `${this.varridos === null ? 'o conferidor não chegou a varrer' : 'zero item varrido'}. ` +
        'Ausência de medida não é evidência de conformidade.'
      )
      ruim = true
    }

    for (const n of this.notas) this.escreve(`  ${pinta('·', 'cinza')} ${n}`)

    if (!ruim) {
      this.escreve(`  ${pinta('✓', 'verde')} ${this.nome}: ${this.varridos} item(ns) medido(s), nada a apontar`)
    } else if (this.regra) {
      this.escreve(`  ${pinta('·', 'cinza')} a régua: ${this.regra}`)
    }

    return ruim ? 1 : 0
  }
}
