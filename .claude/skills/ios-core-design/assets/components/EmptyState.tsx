/**
 * EmptyState — a tela de "nada aqui ainda": ícone discreto, título, apoio, uma ação.
 * Referência: references/components/empty-state.md · Valores: assets/tokens.css
 */
import type { ReactNode } from "react";

export interface EmptyStateProps {
  /** Ícone Phosphor — renderizado a 48px, cinza discreto, decorativo. */
  icon?: ReactNode;
  /** Nomeia o que estaria ali ("Nenhuma conversa ainda"). */
  title: string;
  /** O primeiro passo ("Toque em Compor pra começar"). 1–2 linhas. */
  description?: string;
  /** Nível de heading real na hierarquia da página. */
  as?: "h2" | "h3";
  /** UMA ação — a que resolve o vazio (um Button tinted já pronto). */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  as: Heading = "h2",
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center px-ios-margin py-ios-section text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon && (
        <span aria-hidden="true" className="mb-2 text-ios-label-tertiary [&>svg]:h-12 [&>svg]:w-12">
          {icon}
        </span>
      )}
      <Heading className="text-ios-headline text-ios-label">{title}</Heading>
      {description && (
        <p className="mt-1 max-w-[280px] text-ios-subheadline text-ios-label-secondary">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
