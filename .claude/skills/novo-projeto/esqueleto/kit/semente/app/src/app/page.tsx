// fundação: semente v1 · é seu
// A home do projeto: é sua desde o dia um. A /vitrine é que fica fixa, porque
// é ela que o teste de tela mede.
import { SITE } from "./(site)/conteudo/site"
import { Secao } from "./(site)/secao"

export default function Inicio() {
  return (
    <main>
      <Secao>
        <h1 className="text-(length:--text-h1) leading-none font-bold tracking-[-0.045em] text-balance">
          {SITE.nome}
        </h1>
        <p className="mt-6 max-w-(--measure) text-(length:--text-lead) text-muted-foreground">
          {SITE.descricao}
        </p>
      </Secao>
    </main>
  )
}
