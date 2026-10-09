/**
 * SearchField — busca em coleção: campo-cápsula de 36px (assinatura do
 * iOS 26) em faixa de 44, lupa + limpar + Cancelar. O campo é FILL, não
 * vidro — mesmo dentro de uma barra .ios-glass, ele fica fill sobre o vidro.
 * Referência: references/components/search-field.md · Valores: assets/tokens.css
 */
import { useRef, useState, type FormEvent } from "react";
import { MagnifyingGlass, XCircle } from "@phosphor-icons/react";

export interface SearchFieldProps {
  /** Rótulo acessível e placeholder ("Buscar", "Buscar em Notas"). */
  placeholder?: string;
  /** Valor (controlado). */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  /** Mostra o botão Cancelar no foco (padrão iOS em listas). */
  cancelable?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SearchField({
  placeholder = "Buscar",
  value,
  defaultValue = "",
  onChange,
  onSubmit,
  cancelable = false,
  disabled = false,
  className,
}: SearchFieldProps) {
  const [internal, setInternal] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const current = value ?? internal;
  const showCancel = cancelable && (focused || current.length > 0);

  function setValue(next: string) {
    setInternal(next);
    onChange?.(next);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit?.(current);
  }

  function clear() {
    setValue("");
    inputRef.current?.focus();
  }

  return (
    /* m-0 é OBRIGATÓRIO: <form> tem margem inferior de UA (~17px) que engorda
       a barra que o contiver e enfia o conteúdo por baixo do vidro */
    <form
      role="search"
      onSubmit={handleSubmit}
      className={["m-0 flex min-h-ios-touch items-center gap-2 px-ios-margin", className]
        .filter(Boolean)
        .join(" ")}
    >
      {/* o campo nativo tem 36px DENTRO da faixa de 44 — e a faixa REPASSA o
          clique (senão o alvo de 44 é promessa: regra 1 conta a área clicável) */}
      <div
        className="relative flex min-h-ios-touch flex-1 cursor-text items-center"
        onClick={() => inputRef.current?.focus()}
      >
        <MagnifyingGlass
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 text-ios-label-secondary"
        />
        <input
          ref={inputRef}
          type="search"
          value={current}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && current) {
              e.preventDefault();
              clear();
            }
          }}
          className={[
            /* cápsula (iOS 26) + fill — campo em área de conteúdo não é vidro */
            "h-9 w-full rounded-ios-pill border-0 bg-ios-fill-tertiary pl-9 pr-9",
            "text-ios-body text-ios-label placeholder:text-ios-label-tertiary",
            "disabled:opacity-40",
            /* remove o X nativo do WebKit — o botão próprio é o acessível */
            "[&::-webkit-search-cancel-button]:appearance-none",
          ].join(" ")}
        />
        {current.length > 0 && (
          <button
            type="button"
            aria-label="Limpar busca"
            onClick={clear}
            className={[
              "absolute right-0 flex h-9 w-9 items-center justify-center",
              "text-ios-gray2 transition-opacity duration-100 ease-ios active:opacity-70",
            ].join(" ")}
          >
            <XCircle weight="fill" aria-hidden="true" />
          </button>
        )}
      </div>
      {showCancel && (
        <button
          type="button"
          onClick={() => {
            clear();
            inputRef.current?.blur();
            setFocused(false);
          }}
          className={[
            "min-h-ios-touch shrink-0 text-ios-body text-ios-blue",
            "transition-opacity duration-100 ease-ios active:opacity-70",
          ].join(" ")}
        >
          Cancelar
        </button>
      )}
    </form>
  );
}
