// A camada que desenha. Pode importar de dominio, infra e compartilhado.

import { totalDoPedido } from '../dominio/pedido.mjs'

export function linhaDoTotal (itens) {
  const centavos = totalDoPedido(itens, 10)
  return `Total: R$ ${(centavos / 100).toFixed(2)}`
}
