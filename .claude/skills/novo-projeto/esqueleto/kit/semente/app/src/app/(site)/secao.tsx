// fundação: semente v1 · é seu
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/**
 * A casca de toda seção da página: o registro (claro ou escuro), o respiro
 * vertical e a largura do conteúdo. O pai decide o registro; o que está
 * dentro só pede papéis (`text-muted-foreground`, `bg-card`, `border`).
 *
 * 🚨 `escuro` põe a classe `dark` na PRÓPRIA seção. O tema da marca redefine os
 * papéis em `.dark`, e o `dark:` dos componentes do registry vale para os
 * descendentes: botão, cartão e texto de apoio trocam juntos, sem prop
 * nenhuma nos filhos. É o que evita o cinza do claro sumindo sobre o preto.
 *
 */
export function Secao({
  escuro = false,
  className,
  children,
  ...resto
}: ComponentProps<"section"> & {
  /** Preto no lugar do branco, com todos os papéis do escuro. */
  escuro?: boolean
}) {
  return (
    <section
      data-registro={escuro ? "escuro" : "claro"}
      className={cn(
        "bg-background py-(--pad-secao) text-foreground",
        escuro && "dark",
        className
      )}
      {...resto}
    >
      <div className="mx-auto w-full max-w-(--container) px-(--pad-x)">
        {children}
      </div>
    </section>
  )
}

/** O título de seção, com a medida de leitura curta. */
export function TituloDaSecao({ className, ...resto }: ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "max-w-(--measure-curta) text-(length:--text-h2) leading-[1.1] font-bold tracking-[-0.035em] text-balance",
        className
      )}
      {...resto}
    />
  )
}
