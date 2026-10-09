/**
 * NavigationBar — nav bar de vidro com large title colapsável (44px fixa +
 * 52px que rolam). A barra é `.ios-glass` de largura total, com hairline de
 * scroll-edge: a borda de luz da classe some sobre fundo claro — o
 * separator é a âncora entre a barra e o conteúdo que rola por baixo.
 * Referência: references/components/navigation-bar.md · Valores: assets/tokens.css
 * Colapso por IntersectionObserver em dois estados discretos — sem scroll listener.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CaretLeft } from "@phosphor-icons/react";

export interface NavigationBarProps {
  /** Título da tela — substantivo curto ("Ajustes"). Vira o <h1>. */
  title: string;
  /** Large title na raiz da seção; telas de detalhe usam false. */
  large?: boolean;
  /** Botão de voltar: rótulo da tela anterior (ou "" pra só o chevron). */
  backLabel?: string;
  onBack?: () => void;
  /** Ações à direita (plain buttons / ícones com aria-label). */
  trailing?: ReactNode;
  className?: string;
}

/* barra compacta: vidro Regular — o conteúdo rola por baixo; hairline de
   scroll-edge por baixo do vidro (ver navigation-bar.md) */
const barClasses = "ios-glass sticky top-0 z-10 border-b border-ios-separator";

const backClasses = [
  "flex min-h-ios-touch min-w-ios-touch items-center gap-0.5 px-2",
  "text-ios-body text-ios-blue",
  "transition-opacity duration-100 ease-ios active:opacity-70",
].join(" ");

export function NavigationBar({
  title,
  large = true,
  backLabel,
  onBack,
  trailing,
  className,
}: NavigationBarProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  /* colapsada = large title fora da viewport (ou large desligado) */
  const [collapsed, setCollapsed] = useState(!large);

  useEffect(() => {
    if (!large) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCollapsed(!entry.isIntersecting),
      { rootMargin: "-44px 0px 0px 0px" } // o large conta como "fora" ao passar sob a barra
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [large]);

  return (
    <>
      <header className={[barClasses, className].filter(Boolean).join(" ")}>
        <nav className="mx-auto flex h-ios-navbar items-center justify-between gap-2 px-2">
          <div className="flex min-w-0 flex-1 justify-start">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label={backLabel ? undefined : "Voltar"}
                className={backClasses}
              >
                <CaretLeft aria-hidden="true" />
                {backLabel && <span className="truncate">{backLabel}</span>}
              </button>
            )}
          </div>
          {/* título central: só no estado colapsado; o <h1> real fica abaixo */}
          <span
            aria-hidden="true"
            className={[
              "min-w-0 truncate text-ios-headline text-ios-label",
              "transition-opacity duration-300 ease-ios",
              collapsed ? "opacity-100" : "opacity-0",
            ].join(" ")}
          >
            {title}
          </span>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-1">{trailing}</div>
        </nav>
      </header>

      {large ? (
        <>
          {/* sentinela do observer — 1px, invisível, antes do large title */}
          <div ref={sentinelRef} aria-hidden="true" className="h-px" />
          {/* large title: 52px que ROLAM com o conteúdo (96 total com a barra) */}
          <div className="flex h-[52px] items-end px-ios-margin pb-1">
            <h1 className="truncate text-ios-large-title text-ios-label">{title}</h1>
          </div>
        </>
      ) : (
        /* sem large title, o h1 existe invisível pro leitor de tela */
        <h1 className="sr-only">{title}</h1>
      )}
    </>
  );
}
