/**
 * DisclosureGroup — detalhe recolhível com chevron que gira 90° ao abrir.
 * Referência: references/components/disclosure-group.md · Valores: assets/tokens.css
 * A revelação usa grid-template-rows 0fr→1fr — a única animação de layout
 * tolerada pelo sistema (motion.md §3).
 */
import { useId, useState, type ReactNode } from "react";
import { CaretRight } from "@phosphor-icons/react";

export interface DisclosureGroupProps {
  /** Título do cabeçalho — nomeia o que será revelado ("Opções Avançadas"). */
  title: string;
  /** Aberto inicialmente (não controlado). */
  defaultOpen?: boolean;
  /** Estado aberto (controlado). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

export function DisclosureGroup({
  title,
  defaultOpen = false,
  open,
  onOpenChange,
  disabled = false,
  children,
  className,
}: DisclosureGroupProps) {
  const [internal, setInternal] = useState(defaultOpen);
  const isOpen = open ?? internal;
  const contentId = useId();

  function toggle() {
    if (disabled) return;
    setInternal(!isOpen);
    onOpenChange?.(!isOpen);
  }

  return (
    <div className={[disabled ? "opacity-40 pointer-events-none" : "", className].filter(Boolean).join(" ")}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={toggle}
        className={[
          "flex min-h-ios-row w-full items-center justify-between gap-3 px-4 text-left",
          "text-ios-body text-ios-label",
          "transition-colors duration-100 ease-ios active:bg-ios-gray5",
        ].join(" ")}
      >
        {title}
        {/* fechado aponta pra direita (iOS); aberto gira 90° pra baixo */}
        <CaretRight
          aria-hidden="true"
          className={[
            "shrink-0 text-ios-gray2 transition-transform duration-300 ease-ios",
            isOpen ? "rotate-90" : "rotate-0",
          ].join(" ")}
        />
      </button>
      {/* grid-rows 0fr→1fr anima a revelação sem medir altura */}
      <div
        className={[
          "grid transition-[grid-template-rows] duration-300 ease-ios",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        ].join(" ")}
      >
        <div
          id={contentId}
          /* inert tira o conteúdo fechado do Tab e do leitor — não só da vista */
          inert={!isOpen}
          className="overflow-hidden"
        >
          <div className="px-4 pb-3 text-ios-subheadline text-ios-label-secondary">{children}</div>
        </div>
      </div>
    </div>
  );
}
