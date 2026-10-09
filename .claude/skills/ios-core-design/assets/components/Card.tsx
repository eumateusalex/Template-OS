/**
 * Card — superfície de CONTEÚDO: sólida, elevada por COR (vidro é cromo —
 * card não flutua, é o que passa por baixo do vidro; nunca .ios-glass aqui).
 * Raio 16 via rounded-ios-card; aninhados são concêntricos (16 − padding).
 * Referência: references/components/card.md · Valores: assets/tokens.css
 */
import type { ReactNode } from "react";

export interface CardProps {
  /** Rótulo pequeno em caixa-alta acima do título ("DESTAQUE"). */
  kicker?: string;
  /** Título em Headline. */
  title?: string;
  /** Nível de heading real do título na hierarquia da página. */
  as?: "h2" | "h3" | "h4";
  /** Mídia no topo, sangrando o padding (imagem já dimensionada). */
  media?: ReactNode;
  /** Card inteiro clicável (vira <button> — sem interativo aninhado dentro). */
  onClick?: () => void;
  children?: ReactNode;
  className?: string;
}

/* superfície sólida: elevação é o contraste com o fundo da tela — sem sombra */
const surfaceClasses = "rounded-ios-card bg-ios-bg-grouped-secondary p-4 text-left";

export function Card({ kicker, title, as: Heading = "h3", media, onClick, children, className }: CardProps) {
  const inner = (
    <>
      {/* mídia sangra o padding: distância zero da borda → mesmo raio do card */}
      {media && <div className="-mx-4 -mt-4 mb-3 overflow-hidden rounded-t-ios-card">{media}</div>}
      {kicker && (
        <p className="mb-1 text-ios-footnote uppercase tracking-ios-caps text-ios-label-secondary">
          {kicker}
        </p>
      )}
      {title && <Heading className="text-ios-headline text-ios-label">{title}</Heading>}
      {children && <div className="mt-1 text-ios-subheadline text-ios-label-secondary">{children}</div>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={[
          surfaceClasses,
          "block w-full cursor-pointer select-none",
          "transition-[transform,opacity] duration-100 ease-ios",
          "active:scale-[0.97] active:opacity-70",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {inner}
      </button>
    );
  }

  return <article className={[surfaceClasses, className].filter(Boolean).join(" ")}>{inner}</article>;
}
