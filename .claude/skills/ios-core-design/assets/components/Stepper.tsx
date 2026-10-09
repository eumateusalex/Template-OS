/**
 * Stepper — ajuste fino de unidade em unidade (o UIStepper).
 * Referência: references/components/stepper.md · Valores: assets/tokens.css
 * Corpo em cápsula (forma padrão de controle no Liquid Glass); fundo fill.
 * O valor visível mora na célula ao lado; aqui dentro só o aria-live pro leitor.
 */
import { useState } from "react";
import { Minus, Plus } from "@phosphor-icons/react";

export interface StepperProps {
  min?: number;
  max?: number;
  step?: number;
  /** Valor (controlado). */
  value?: number;
  /** Valor inicial (não controlado). */
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** Rótulo do grupo ("Cópias", "Pessoas"). */
  label: string;
  disabled?: boolean;
  className?: string;
}

export function Stepper({
  min = 0,
  max = 99,
  step = 1,
  value,
  defaultValue = 0,
  onChange,
  label,
  disabled = false,
  className,
}: StepperProps) {
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;

  function change(delta: number) {
    const next = Math.min(max, Math.max(min, current + delta));
    if (next === current) return;
    setInternal(next);
    onChange?.(next);
  }

  const buttonClasses =
    "relative flex h-8 w-[47px] items-center justify-center text-ios-label " +
    "transition-opacity duration-100 ease-ios active:opacity-70 " +
    "disabled:opacity-40 " +
    /* área de toque estendida a 44px na vertical (regra 1) */
    "after:absolute after:content-[''] after:-inset-y-1.5 after:inset-x-0";

  return (
    <div
      role="group"
      aria-label={label}
      className={[
        /* cápsula: a forma padrão de controle no Liquid Glass (foundations.md §3).
           Conteúdo, não cromo — fundo fill sólido, sem vidro e sem sombra */
        "inline-flex overflow-hidden rounded-ios-pill bg-ios-fill-secondary select-none",
        disabled ? "opacity-40 pointer-events-none" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        aria-label="Diminuir"
        disabled={disabled || current <= min}
        onClick={() => change(-step)}
        className={buttonClasses}
      >
        <Minus aria-hidden="true" />
      </button>
      {/* divisor vertical hairline */}
      <span aria-hidden="true" className="my-1.5 w-px bg-ios-separator" />
      <button
        type="button"
        aria-label="Aumentar"
        disabled={disabled || current >= max}
        onClick={() => change(step)}
        className={buttonClasses}
      >
        <Plus aria-hidden="true" />
      </button>
      {/* valor anunciado pro leitor de tela; o número visível mora na célula ao lado */}
      <span aria-live="polite" className="sr-only">
        {current}
      </span>
    </div>
  );
}
