/**
 * ProgressBar — progresso MENSURÁVEL em track de 4px (o UIProgressView).
 * Referência: references/components/progress-bar.md · Valores: assets/tokens.css
 * Avança por scaleX (nunca width). Indeterminado não existe aqui: é o spinner.
 */
import { useId } from "react";

export interface ProgressBarProps {
  /** 0 a 100. */
  value: number;
  /** O que está progredindo ("Enviando vídeo"). */
  label: string;
  /** Mostra o rótulo e a % como texto acima da barra. */
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ value, label, showLabel = false, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const labelId = useId();

  return (
    <div className={["flex flex-col gap-1", className].filter(Boolean).join(" ")}>
      {showLabel && (
        <div className="flex items-baseline justify-between gap-4">
          <span id={labelId} className="text-ios-footnote text-ios-label">
            {label}
          </span>
          <span className="text-ios-footnote text-ios-label-secondary">{Math.round(clamped)}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={showLabel ? undefined : label}
        aria-labelledby={showLabel ? labelId : undefined}
        className="h-1 overflow-hidden rounded-ios-pill bg-ios-fill"
      >
        {/* scaleX com origem à esquerda — transform, nunca width (motion.md §3) */}
        <div
          style={{ transform: `scaleX(${clamped / 100})` }}
          className="h-full w-full origin-left rounded-ios-pill bg-ios-blue transition-transform duration-300 ease-ios"
        />
      </div>
    </div>
  );
}
