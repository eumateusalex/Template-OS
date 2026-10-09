/**
 * Picker — escolha de UM valor numa lista fechada (estilo menu do iOS 14+).
 * Referência: references/components/picker.md · Valores: assets/tokens.css
 * Base: <select> nativo — o menu aberto é da plataforma, e no iOS é a UI real.
 * Campo é conteúdo: fundo fill sólido, raio de input — sem vidro, sem sombra.
 */
import { useId, type SelectHTMLAttributes } from "react";
import { CaretDown } from "@phosphor-icons/react";

export interface PickerOption {
  value: string;
  label: string;
}

export interface PickerProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  /** Rótulo visível acima do campo ("País"). */
  label: string;
  options: PickerOption[];
  /** Texto da opção vazia inicial; some depois da escolha. */
  placeholder?: string;
  error?: string;
}

export function Picker({
  label,
  options,
  placeholder,
  error,
  id,
  className,
  disabled,
  defaultValue,
  ...rest
}: PickerProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const errorId = `${selectId}-error`;

  return (
    <div className={["flex flex-col gap-1", className].filter(Boolean).join(" ")}>
      <label htmlFor={selectId} className="text-ios-subheadline text-ios-label-secondary">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          defaultValue={placeholder && defaultValue === undefined ? "" : defaultValue}
          className={[
            /* mesmo corpo do TextField; padding direito abre espaço pro caret */
            "h-ios-touch w-full appearance-none rounded-ios-input bg-ios-fill-tertiary pl-4 pr-10",
            "text-ios-body text-ios-label",
            "disabled:opacity-40",
            error ? "border border-ios-red" : "border-0",
          ].join(" ")}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {/* o menu aberto é do host: <option> não herda as vars com data-theme
              forçado — a correção global de uma linha está em color.md §7 */}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <CaretDown
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ios-label-secondary"
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
