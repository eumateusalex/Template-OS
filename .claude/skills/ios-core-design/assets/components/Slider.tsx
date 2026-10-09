/**
 * Slider — valor contínuo num intervalo (o UISlider, anatomia iOS 26).
 * Referência: references/components/slider.md · Valores: assets/tokens.css
 * Base: <input type="range"> nativo estilizado — teclado e leitor de tela de graça.
 * ticks desenha marcas equidistantes no track; centered preenche a partir do
 * meio (valor bipolar). Trecho e ticks: gradiente inline em runtime com as vars.
 */
import { useState, type ChangeEvent, type InputHTMLAttributes } from "react";

export interface SliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "value" | "defaultValue" | "size"> {
  min?: number;
  max?: number;
  step?: number;
  /** Valor (controlado). */
  value?: number;
  /** Valor inicial (não controlado). */
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** Rótulo acessível ("Volume", "Brilho"). */
  label: string;
  /** Nº de tick marks equidistantes no track (contando as pontas; mínimo 2). */
  ticks?: number;
  /** Preenche a partir do CENTRO do track — valor bipolar (balanço, EQ, ±). */
  centered?: boolean;
}

export function Slider({
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue = 50,
  onChange,
  label,
  ticks,
  centered = false,
  disabled,
  className,
  ...rest
}: SliderProps) {
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;
  const percent = ((current - min) / (max - min)) * 100;

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const next = Number(e.target.value);
    setInternal(next);
    onChange?.(next);
  }

  /* Trecho percorrido: do início ao valor — ou, com centered, do MEIO ao valor */
  const lo = centered ? Math.min(50, percent) : 0;
  const hi = centered ? Math.max(50, percent) : percent;
  const track = `linear-gradient(to right, var(--ios-fill) ${lo}%, var(--ios-blue) ${lo}% ${hi}%, var(--ios-fill) ${hi}%)`;
  /* Ticks: pontos de 2px no MESMO token do track (slider.md: tradução calibrada).
     Camada listada antes fica POR CIMA do trecho; o thumb (pseudo-elemento do
     input) cobre a marca sob ele, como no nativo. */
  const tickLayers =
    ticks && ticks >= 2
      ? Array.from(
          { length: ticks },
          (_, i) =>
            `radial-gradient(circle at ${(i / (ticks - 1)) * 100}% 50%, var(--ios-fill) 0 1px, transparent 1px)`,
        )
      : [];

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={current}
      onChange={handleChange}
      aria-label={label}
      disabled={disabled}
      style={{ background: [...tickLayers, track].join(", ") }}
      className={[
        /* área de toque de 44px; o track de 4px é o próprio input */
        "h-1 w-full appearance-none rounded-ios-pill outline-offset-8 py-0 my-5",
        "disabled:opacity-40",
        /* thumb WebKit: 28px, branco nos dois temas, borda hairline — sem sombra
           (regra 5: sombra é assinatura do vidro; controle é conteúdo) */
        "[&::-webkit-slider-thumb]:appearance-none",
        "[&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7",
        "[&::-webkit-slider-thumb]:rounded-ios-pill",
        "[&::-webkit-slider-thumb]:bg-ios-on-accent",
        "[&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-ios-separator",
        /* thumb Firefox */
        "[&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7",
        "[&::-moz-range-thumb]:rounded-ios-pill",
        "[&::-moz-range-thumb]:bg-ios-on-accent",
        "[&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-ios-separator",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}
