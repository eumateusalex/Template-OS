// A camada que pensa. Ela importa de `compartilhado` e de mais ninguém: é o
// que o conferidor `camadas` cobra neste fixture.

import { somar, comDesconto } from '../compartilhado/centavos.mjs'

export function totalDoPedido (itens, porcentoDeDesconto = 0) {
  const bruto = itens.reduce((soma, item) => somar(soma, item.centavos), 0)
  return comDesconto(bruto, porcentoDeDesconto)
}
