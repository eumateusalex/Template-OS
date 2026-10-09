// A camada que fala com fora. Aqui ela só guarda na memória, porque o fixture
// não pode depender de banco nenhum.

import { somar } from '../compartilhado/centavos.mjs'

const guardados = new Map()

export function guardar (chave, centavos) {
  guardados.set(chave, somar(guardados.get(chave) ?? 0, centavos))
  return guardados.get(chave)
}

export function esquecerTudo () {
  guardados.clear()
}
