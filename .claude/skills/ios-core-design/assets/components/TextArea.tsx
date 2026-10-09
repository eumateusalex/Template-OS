/**
 * TextArea — texto livre multilinha, estilo inset dos formulários iOS.
 * Referência: references/components/text-area.md · Valores: assets/tokens.css
 */
import { useId, type TextareaHTMLAttributes } from "react";

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Rótulo visível acima do campo ("Descrição"). */
  label: string;
  error?: string;
  /** Limite de caracteres com contador visível. */
  maxLength?: number;
  /** Valor atual (necessário pro contador em modo controlado). */
  value?: string;
}

export function TextArea({
  label,
  error,
  maxLength,
  value,
  id,
  className,
  rows = 3,
  disabled,
  ...rest
}: TextAreaProps) {
  const autoId = useId();
  const areaId = id ?? autoId;
  const errorId = `${areaId}-error`;
  const countId = `${areaId}-count`;
  const length = value?.length ?? 0;
  const over = maxLength !== undefined && length > maxLength;

  const describedBy =
    [error ? errorId : null, maxLength !== undefined ? countId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={["flex flex-col gap-1", className].filter(Boolean).join(" ")}>
      <label htmlFor={areaId} className="text-ios-subheadline text-ios-label-secondary">
        {label}
      </label>
      <textarea
        id={areaId}
        rows={rows}
        value={value}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={[
          /* resize é do sistema, não do usuário; mínimo de 3 linhas dá a affordance */
          "resize-none rounded-ios-input bg-ios-fill-tertiary px-4 py-3",
          "text-ios-body text-ios-label placeholder:text-ios-label-tertiary",
          "disabled:opacity-40",
          error ? "border border-ios-red" : "border-0",
        ].join(" ")}
        {...rest}
      />
      <div className="flex justify-between gap-4">
        {error ? (
          <p id={errorId} className="text-ios-footnote text-ios-red">
            {error}
          </p>
        ) : (
          <span />
        )}
        {maxLength !== undefined && (
          <p
            id={countId}
            className={["text-ios-caption1", over ? "text-ios-red" : "text-ios-label-tertiary"].join(" ")}
          >
            {length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}
