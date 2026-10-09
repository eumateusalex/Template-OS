/**
 * Badge — contagem em pílula (vermelho = notificação, cinza = neutro) ou dot.
 * Referência: references/components/badge.md · Valores: assets/tokens.css
 * O contexto acessível mora no PAI (aria-label na célula/tab); aqui é visual.
 */

export interface BadgeProps {
  /** Número a exibir; 0 ou menos esconde o badge. Ausente com dot=false também esconde. */
  count?: number;
  /** red = notificação/não lido · gray = contagem neutra. */
  variant?: "red" | "gray";
  /** Só o pontinho de novidade (8px), sem número. */
  dot?: boolean;
  className?: string;
}

export function Badge({ count, variant = "red", dot = false, className }: BadgeProps) {
  if (dot) {
    return (
      <span
        aria-hidden="true"
        className={["inline-block h-2 w-2 rounded-ios-pill bg-ios-red", className].filter(Boolean).join(" ")}
      />
    );
  }

  if (!count || count <= 0) return null; // zero esconde — nunca badge "0"

  return (
    <span
      aria-hidden="true"
      className={[
        "inline-flex h-5 min-w-5 items-center justify-center rounded-ios-pill px-1.5 text-ios-caption1",
        variant === "red" ? "bg-ios-red text-ios-on-accent" : "bg-ios-fill-secondary text-ios-label-secondary",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
