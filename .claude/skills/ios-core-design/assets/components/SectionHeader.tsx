/**
 * SectionHeader — cabeçalho de seção em Footnote caixa-alta (o header do UITableView).
 * Referência: references/components/section-header.md · Valores: assets/tokens.css
 */
import type { ReactNode } from "react";

export interface SectionHeaderProps {
  children: ReactNode;
  /** Nível de heading REAL conforme a hierarquia da página (sem pular nível). */
  as?: "h2" | "h3" | "h4";
  /** Ação opcional à direita ("Ver Tudo"). */
  action?: { label: string; onClick: () => void };
  /** true quando o header abre lista inset (alinha com o texto das células). */
  inset?: boolean;
  className?: string;
}

export function SectionHeader({
  children,
  as: Heading = "h2",
  action,
  inset = true,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={[
        "mb-2 flex items-baseline justify-between gap-4",
        inset ? "px-8" : "px-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* caixa-alta via CSS — texto digitado normal (leitores de tela soletram maiúsculas) */}
      <Heading className="text-ios-footnote font-normal uppercase tracking-ios-caps text-ios-label-secondary">
        {children}
      </Heading>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={[
            "relative text-ios-subheadline text-ios-blue",
            "transition-opacity duration-100 ease-ios active:opacity-70",
            /* área de toque estendida (regra 1) */
            "after:absolute after:content-[''] after:-inset-y-3 after:-inset-x-2",
          ].join(" ")}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
