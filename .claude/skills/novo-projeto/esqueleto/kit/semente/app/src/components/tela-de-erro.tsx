// fundação: semente v1 · é seu
"use client"

import { useEffect } from "react"
import Link from "next/link"
import { RotateCcwIcon, TriangleAlertIcon } from "lucide-react"

import { TelaDeEstado } from "@/components/estado-vazio"
import { Button } from "@/components/ui/button"

export type TextoDeErro = {
  titulo: string
  descricao: string
  tentarDeNovo: string
  voltar: string
  codigo: string
}

/**
 * A tela de erro, compartilhada pelo `error.tsx` e pelo `global-error.tsx`.
 *
 * ⚠️ O `reset()` é o que separa um soluço de uma parede: sem o botão, a pessoa
 * só tem o F5. ⚠️ O `digest` é o único detalhe técnico que aparece: ele liga o
 * que a pessoa viu ao log do servidor. A mensagem original nunca vai para a
 * tela, porque costuma vir em inglês e com nome de tabela dentro.
 * ⚠️ O texto chega por propriedade: componente não importa da camada `app`,
 * e o texto mora em `src/app/(site)/conteudo/estados.ts`.
 */
export function TelaDeErro({
  erro,
  tentarDeNovo,
  texto,
}: {
  erro: Error & { digest?: string }
  tentarDeNovo: () => void
  texto: TextoDeErro
}) {
  useEffect(() => {
    console.error("[tela de erro]", erro)
  }, [erro])

  return (
    <TelaDeEstado
      icone={<TriangleAlertIcon />}
      titulo={texto.titulo}
      descricao={texto.descricao}
    >
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={tentarDeNovo}>
          <RotateCcwIcon />
          {texto.tentarDeNovo}
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/" />}
        >
          {texto.voltar}
        </Button>
      </div>
      <Codigo rotulo={texto.codigo} digest={erro.digest} />
    </TelaDeEstado>
  )
}

function Codigo({ rotulo, digest }: { rotulo: string; digest?: string }) {
  if (!digest) return null
  return (
    <p className="mt-4 text-xs text-muted-foreground">
      {rotulo} <span className="font-mono">{digest}</span>
    </p>
  )
}
