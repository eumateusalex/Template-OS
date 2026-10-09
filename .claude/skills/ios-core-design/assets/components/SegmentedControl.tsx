/**
 * SegmentedControl — 2 a 5 opções exclusivas, todas visíveis: track-cápsula
 * de fill com thumb de VIDRO (.ios-glass) deslizante. O track não é vidro,
 * então não há vidro sobre vidro — o thumb é o único material do controle.
 * Referência: references/components/segmented-control.md · Valores: assets/tokens.css
 */
import { useId, useRef, useState, type KeyboardEvent } from "react";

export interface SegmentedControlProps {
  /** Rótulos dos segmentos, na ordem (2 a 5). */
  segments: string[];
  /** Índice selecionado (controlado). */
  value?: number;
  /** Seleção inicial (não controlado). */
  defaultValue?: number;
  onChange?: (index: number) => void;
  /** Rótulo do grupo pra leitor de tela ("Período", "Modo de exibição"). */
  label: string;
  disabled?: boolean;
  className?: string;
}

export function SegmentedControl({
  segments,
  value,
  defaultValue = 0,
  onChange,
  label,
  disabled = false,
  className,
}: SegmentedControlProps) {
  const [internal, setInternal] = useState(defaultValue);
  const selected = value ?? internal;
  const groupId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function select(index: number) {
    if (disabled) return;
    setInternal(index);
    onChange?.(index);
  }

  /* Setas ←/→ movem a seleção — radiogroup é 1 tabstop (accessibility.md §4) */
  function onKeyDown(e: KeyboardEvent) {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (selected + delta + segments.length) % segments.length;
    select(next);
    refs.current[next]?.focus();
  }

  const width = 100 / segments.length;

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={[
        /* track-cápsula de FILL (não vidro), 32px nativos + toque estendido a 44 (regra 1) */
        "relative flex h-8 rounded-ios-pill bg-ios-fill-secondary p-0.5 select-none",
        "after:absolute after:content-[''] after:-inset-y-1.5 after:inset-x-0",
        disabled ? "opacity-40 pointer-events-none" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Thumb: pílula de VIDRO — a sombra e a borda de luz vêm do material.
          Desliza na transição padrão do sistema (0.3s, sem bounce). */}
      <span
        aria-hidden="true"
        className="ios-glass absolute top-0.5 bottom-0.5 rounded-ios-pill transition-[left] duration-300 ease-ios"
        style={{ width: `calc(${width}% - 4px)`, left: `calc(${selected * width}% + 2px)` }}
      />
      {segments.map((segment, i) => (
        <button
          key={`${groupId}-${i}`}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={i === selected}
          tabIndex={i === selected ? 0 : -1}
          onClick={() => select(i)}
          className={[
            "relative z-[1] flex-1 rounded-ios-pill text-ios-subheadline text-ios-label",
            "transition-opacity duration-100 ease-ios active:opacity-70",
            i === selected ? "font-semibold" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {segment}
        </button>
      ))}
    </div>
  );
}
