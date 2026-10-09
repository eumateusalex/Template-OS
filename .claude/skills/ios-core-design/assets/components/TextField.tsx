/**
 * TextField — entrada de texto de uma linha, estilo inset dos formulários iOS.
 * Referência: references/components/text-field.md · Valores: assets/tokens.css
 * Campo 44px, raio de input (12, concêntrico com card 16 — foundations.md §3),
 * fundo fill. Campo é conteúdo: sólido, sem vidro e sem sombra.
 */
import { useId, type InputHTMLAttributes } from "react";

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Rótulo visível acima do campo ("Email"). */
  label: string;
  /** Mensagem de erro: o que houve + a saída ("Senha incorreta. Tente de novo."). */
  error?: string;
}

export function TextField({ label, error, id, className, disabled, ...rest }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div className={["flex flex-col gap-1", className].filter(Boolean).join(" ")}>
      <label htmlFor={inputId} className="text-ios-subheadline text-ios-label-secondary">
        {label}
      </label>
      <input
        id={inputId}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={[
          /* 44px de altura, fundo fill SEM borda — borda só no estado de erro */
          "h-ios-touch rounded-ios-input bg-ios-fill-tertiary px-4",
          "text-ios-body text-ios-label placeholder:text-ios-label-tertiary",
          "disabled:opacity-40",
          error ? "border border-ios-red" : "border-0",
        ].join(" ")}
        {...rest}
      />
      {error && (
        <p id={errorId} className="text-ios-footnote text-ios-red">
          {error}
        </p>
      )}
    </div>
  );
}
