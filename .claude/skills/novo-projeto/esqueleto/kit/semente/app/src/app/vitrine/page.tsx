// fundação: semente v1 · é seu
import type { Metadata } from "next"

import { Revela } from "@/components/revela"

import { VITRINE } from "../(site)/conteudo/vitrine"
import { Perguntas } from "../(site)/perguntas"
import { Secao, TituloDaSecao } from "../(site)/secao"
import { Pecas } from "./pecas"

/**
 * A vitrine: rota FIXA, fora da busca, que o teste de tela mede. Ela não é a
 * home de propósito: quando o projeto trocar a home, o teste continua medindo
 * a mesma coisa.
 */
export const metadata: Metadata = {
  title: VITRINE.titulo,
  robots: { index: false, follow: false },
}

export default function Vitrine() {
  return (
    <main>
      <Secao>
        <h1 className="text-(length:--text-h1) leading-none font-bold tracking-[-0.045em]">
          {VITRINE.titulo}
        </h1>
        <p className="mt-4 max-w-(--measure) text-muted-foreground">
          {VITRINE.descricao}
        </p>
      </Secao>
      <Secao aria-labelledby="registro-claro">
        <TituloDaSecao id="registro-claro" className="mb-10">
          {VITRINE.registros.claro}
        </TituloDaSecao>
        <Pecas sufixo="claro" />
      </Secao>
      <Secao escuro aria-labelledby="registro-escuro">
        <TituloDaSecao id="registro-escuro" className="mb-10">
          {VITRINE.registros.escuro}
        </TituloDaSecao>
        <Pecas sufixo="escuro" />
      </Secao>
      <Secao aria-labelledby="perguntas">
        <TituloDaSecao id="perguntas" className="mb-8">
          {VITRINE.perguntas}
        </TituloDaSecao>
        <Perguntas />
        <Revela className="mt-12 text-muted-foreground">
          {VITRINE.revela}
        </Revela>
      </Secao>
    </main>
  )
}
