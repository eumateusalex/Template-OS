// fundação: semente v1 · é seu
"use client"

import { useEffect, useRef, useState, type ComponentProps } from "react"

/**
 * Revela o filho quando ele entra na tela. Uma vez só.
 *
 * ⚠️ Sem biblioteca, de propósito: "entrar ao rolar" é IntersectionObserver
 * e transição de CSS, o motor que o kit dá para "entrar uma vez". Motion e
 * GSAP ficam
 * para as cenas de landing, dentro de uma seção.
 *
 * 🚨 QUEM ESCONDE É O CSS (`src/styles/pagina.css`), e só sob a classe `js`
 * que o vigia do layout põe no `<html>`. Este componente marca
 * `data-revelado` e avisa o vigia que chegou. É o que dá as três garantias:
 * · quem pediu menos movimento recebe a página pronta (o CSS só esconde sob
 *   `prefers-reduced-motion: no-preference`)
 * · quem está sem JavaScript recebe a página pronta (a classe `js` nem entra)
 * · se o JavaScript chega e o pedaço dele falha, o vigia tira a classe em
 *   3 s e a página aparece inteira
 *
 * ⚠️ Revela quando o bloco ENCOSTA na tela, sem margem negativa: com -12%, o
 * último bloco de uma página curta nunca cruza a linha no celular e fica
 * invisível.
 *
 * 🚨 Nada acima da dobra se esconde com opacidade: o LCP ignora o que está em
 * `opacity: 0`, e a entrada seguraria a métrica. Para o topo da página,
 * `semDesvanecer`.
 */
export function Revela({
  ordem = 0,
  semDesvanecer = false,
  style,
  ...resto
}: ComponentProps<"div"> & {
  /** A posição entre irmãos: cada um entra um `--stagger` depois do anterior. */
  ordem?: number
  /** Entra deslizando, sem desvanecer. Para o que está acima da dobra. */
  semDesvanecer?: boolean
}) {
  const alvo = useRef<HTMLDivElement>(null)
  const [revelado, setRevelado] = useState(false)

  useEffect(() => {
    // Avisa o vigia do layout que o código chegou: sem isto, em 3 s ele tira
    // a classe `js` e a página aparece sem animação.
    document.documentElement.setAttribute("data-revela-pronto", "")
    const no = alvo.current
    if (!no) return
    const observador = new IntersectionObserver(([entrada]) => {
      if (!entrada.isIntersecting) return
      setRevelado(true)
      observador.disconnect()
    })
    observador.observe(no)
    return () => observador.disconnect()
  }, [])

  return (
    <div
      ref={alvo}
      data-revela={semDesvanecer ? "deslizar" : "entrar"}
      data-revelado={revelado ? "" : undefined}
      style={{ transitionDelay: `calc(var(--stagger) * ${ordem})`, ...style }}
      {...resto}
    />
  )
}
