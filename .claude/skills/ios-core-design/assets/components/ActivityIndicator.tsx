/**
 * ActivityIndicator — o spinner de 8 raios com giro em passos (steps(8)).
 * Referência: references/components/activity-indicator.md · Valores: assets/tokens.css
 * Indeterminado = spinner; determinado = ProgressBar (a divisão do iOS).
 */

export interface ActivityIndicatorProps {
  /** sm 20px (medium nativo) · lg 36px (large nativo ~37, à grade). */
  size?: "sm" | "lg";
  /** Nome acessível do que está acontecendo. */
  label?: string;
  className?: string;
}

const SIZE_PX: Record<string, number> = { sm: 20, lg: 36 };

export function ActivityIndicator({ size = "sm", label = "Carregando", className }: ActivityIndicatorProps) {
  const px = SIZE_PX[size];
  return (
    <span
      role="status"
      aria-label={label}
      className={["inline-flex text-ios-label-tertiary", className].filter(Boolean).join(" ")}
    >
      {/* 8 raios, opacidade decrescente; o giro é do container (steps dá o tique) */}
      <svg
        aria-hidden="true"
        width={px}
        height={px}
        viewBox="0 0 32 32"
        className="animate-ios-spin"
        fill="currentColor"
      >
        {Array.from({ length: 8 }, (_, i) => (
          <rect
            key={i}
            x="14.5"
            y="2"
            width="3"
            height="9"
            rx="1.5"
            opacity={(i + 1) / 8}
            transform={`rotate(${i * 45} 16 16)`}
          />
        ))}
      </svg>
    </span>
  );
}
