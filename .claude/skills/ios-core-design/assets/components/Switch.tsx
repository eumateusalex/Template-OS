/**
 * Switch — liga/desliga com efeito imediato (o Toggle do iOS, inalterado
 * no Liquid Glass). Controle de CONTEÚDO: opaco, sem vidro e sem sombra;
 * o deslize usa a assinatura padrão (sem bounce — bounce é do vidro).
 * Referência: references/components/switch.md · Valores: assets/tokens.css
 * Medidas nativas: track 51×31, thumb 27, curso 20 (2px de folga por lado).
 */
import { useState } from "react";

export interface SwitchProps {
  /** Estado (controlado). */
  checked?: boolean;
  /** Estado inicial (não controlado). */
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  /** Rótulo acessível quando não há aria-labelledby (o substantivo: "Notificações"). */
  label?: string;
  /** id de um texto visível que rotula o switch (célula de lista). */
  labelledBy?: string;
  disabled?: boolean;
  className?: string;
}

export function Switch({
  checked,
  defaultChecked = false,
  onChange,
  label,
  labelledBy,
  disabled = false,
  className,
}: SwitchProps) {
  const [internal, setInternal] = useState(defaultChecked);
  const isOn = checked ?? internal;

  function toggle() {
    if (disabled) return;
    setInternal(!isOn);
    onChange?.(!isOn);
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={toggle}
      className={[
        /* track 51×31 + área de toque estendida a 44px na vertical (regra 1) */
        "relative inline-flex h-[31px] w-[51px] shrink-0 rounded-ios-pill p-0.5",
        "transition-colors duration-300 ease-ios",
        "after:absolute after:content-[''] after:-inset-y-1.5 after:-inset-x-0",
        isOn ? "bg-ios-green" : "bg-ios-fill",
        "disabled:opacity-40",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Thumb branco opaco nos dois temas, como o nativo — sem sombra (é
          conteúdo, não vidro) e deslize na assinatura padrão, sem bounce */}
      <span
        aria-hidden="true"
        className={[
          "block h-[27px] w-[27px] rounded-ios-pill bg-ios-on-accent",
          "transition-transform duration-300 ease-ios",
          isOn ? "translate-x-5" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}
