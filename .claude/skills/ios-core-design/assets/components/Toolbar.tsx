/**
 * Toolbar — ações da tela atual. placement="top": vidro de largura total sob
 * a nav bar; placement="bottom": ilha flutuante (cápsula .ios-glass + inset).
 * Referência: references/components/toolbar.md · Valores: assets/tokens.css
 * Diferença pra TabBar: toolbar AGE na tela; tab bar NAVEGA entre seções.
 */
import type { ReactNode } from "react";

export interface ToolbarProps {
  /** Rótulo do conjunto ("Ações da mensagem"). */
  label: string;
  /** ToolbarButtons (ícone com aria-label, ou texto azul). Máximo ~4. */
  children: ReactNode;
  /** top = vidro de largura total sob a nav bar; bottom = ilha flutuante no rodapé. */
  placement?: "top" | "bottom";
  className?: string;
}

/* topo: vidro Regular de largura total — conteúdo rola por baixo. Hairline
   de scroll-edge POR BAIXO do vidro: a borda de luz da classe é
   branca e some sobre fundo claro — a âncora é o separator (toolbar.md) */
const topClasses = "ios-glass sticky top-ios-navbar z-10 border-b border-ios-separator";
const topRowClasses = "flex h-ios-navbar items-center justify-between px-2";

/* rodapé: o wrapper só posiciona (inset lateral + inset e safe area embaixo)
   e não captura toque — quem é vidro é a cápsula */
const bottomWrapClasses = [
  "pointer-events-none fixed inset-x-0 bottom-0 z-10 flex justify-center",
  "px-ios-bar-inset pb-[calc(var(--ios-bar-inset)+var(--ios-safe-bottom))]",
].join(" ");
/* a cápsula é UM vidro só — os ToolbarButtons são conteúdo dela, nunca vidro próprio */
const capsuleClasses = [
  "ios-glass pointer-events-auto flex h-ios-navbar w-full items-center",
  "justify-between rounded-ios-pill px-2 sm:w-auto sm:justify-center sm:gap-1",
].join(" ");

export function Toolbar({ label, children, placement = "top", className }: ToolbarProps) {
  if (placement === "bottom") {
    return (
      <div className={[bottomWrapClasses, className].filter(Boolean).join(" ")}>
        <div role="toolbar" aria-label={label} className={capsuleClasses}>
          {children}
        </div>
      </div>
    );
  }
  return (
    <div
      role="toolbar"
      aria-label={label}
      className={[topClasses, className].filter(Boolean).join(" ")}
    >
      <div className={topRowClasses}>{children}</div>
    </div>
  );
}

/** Botão de toolbar — plain azul com alvo de 44 (ícone Phosphor ou texto). */
export interface ToolbarButtonProps {
  /** aria-label obrigatório quando o conteúdo é só ícone. */
  label?: string;
  destructive?: boolean;
  /** Ação primária em semibold ("Concluir"). */
  emphasized?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

export function ToolbarButton({
  label,
  destructive = false,
  emphasized = false,
  disabled = false,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={[
        "flex min-h-ios-touch min-w-ios-touch items-center justify-center px-2",
        "text-ios-body",
        destructive ? "text-ios-red" : "text-ios-blue",
        emphasized ? "font-semibold" : "",
        "transition-opacity duration-100 ease-ios active:opacity-70",
        "disabled:opacity-40",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}
