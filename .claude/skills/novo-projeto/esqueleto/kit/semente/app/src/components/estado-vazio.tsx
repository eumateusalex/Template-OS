// fundação: semente v1 · é seu
import type { ReactNode } from "react"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

type Estado = {
  icone: ReactNode
  titulo: string
  descricao: string
  children?: ReactNode
  className?: string
}

/** O `Empty` do registry montado de uma vez: ícone, título, descrição e ações. */
export function EstadoVazio({
  icone,
  titulo,
  descricao,
  children,
  className,
}: Estado) {
  return (
    <Empty className={className}>
      <EmptyHeader>
        <EmptyMedia variant="icon">{icone}</EmptyMedia>
        <EmptyTitle>{titulo}</EmptyTitle>
        <EmptyDescription>{descricao}</EmptyDescription>
      </EmptyHeader>
      {children ? <EmptyContent>{children}</EmptyContent> : null}
    </Empty>
  )
}

/** A tela inteira de um estado (erro, página não encontrada), centrada. */
export function TelaDeEstado({ className, ...estado }: Estado) {
  return (
    <main
      className={cn(
        "flex min-h-svh items-center justify-center p-6",
        className
      )}
    >
      <EstadoVazio {...estado} />
    </main>
  )
}
