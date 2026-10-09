/**
 * DatePicker — data/hora no estilo compacto do iOS 14+ (valor em campo cinza).
 * Referência: references/components/date-picker.md · Valores: assets/tokens.css
 * Base: <input type="date|time|datetime-local"> nativo — o calendário é do sistema.
 * Campo é conteúdo: fundo fill sólido, raio de input — sem vidro, sem sombra.
 */
import { useId, useRef, type InputHTMLAttributes } from "react";

export interface DatePickerProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** Rótulo da linha ("Vencimento"). */
  label: string;
  /** Tipo de valor: data, hora, ou os dois. */
  mode?: "date" | "time" | "datetime-local";
  error?: string;
}

export function DatePicker({
  label,
  mode = "date",
  error,
  id,
  className,
  disabled,
  ...rest
}: DatePickerProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);

  /* No desktop o alvo de abrir é minúsculo; showPicker() abre o calendário
     no clique em qualquer ponto do campo, quando o navegador suportar. */
  function openPicker() {
    try {
      inputRef.current?.showPicker?.();
    } catch {
      /* navegador sem showPicker (ou fora de gesto do usuário): o foco nativo resolve */
    }
  }

  return (
    <div className={["flex flex-col gap-1", className].filter(Boolean).join(" ")}>
      {/* linha de 44px: rótulo à esquerda, campo compacto de valor à direita */}
      <div className="flex h-ios-row items-center justify-between gap-4">
        <label htmlFor={inputId} className="text-ios-body text-ios-label">
          {label}
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type={mode}
          disabled={disabled}
          onClick={openPicker}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={[
            /* o campo compacto: fundo fill, raio de input, formato do locale */
            "rounded-ios-input bg-ios-fill-tertiary px-3 py-1.5",
            "text-ios-body text-ios-label",
            "disabled:opacity-40",
            error ? "border border-ios-red" : "border-0",
          ].join(" ")}
          {...rest}
        />
      </div>
      {error && (
        <p id={errorId} className="text-ios-footnote text-ios-red">
          {error}
        </p>
      )}
    </div>
  );
}
