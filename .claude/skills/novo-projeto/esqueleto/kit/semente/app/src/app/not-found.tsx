// fundação: semente v1 · é seu
import Link from "next/link"
import { CompassIcon } from "lucide-react"

import { TelaDeEstado } from "@/components/estado-vazio"
import { Button } from "@/components/ui/button"

import { ESTADOS } from "./(site)/conteudo/estados"

export const metadata = { title: ESTADOS.naoEncontrada.titulo }

/**
 * O 404. ⚠️ A mensagem é genérica de propósito: o mesmo 404 responde a
 * endereço inventado e a recurso de outra pessoa, e dizer "sem acesso"
 * confirmaria que o recurso existe.
 */
export default function NaoEncontrada() {
  const texto = ESTADOS.naoEncontrada
  return (
    <TelaDeEstado
      icone={<CompassIcon />}
      titulo={texto.titulo}
      descricao={texto.descricao}
    >
      <Button nativeButton={false} render={<Link href="/" />}>
        {texto.voltar}
      </Button>
    </TelaDeEstado>
  )
}
