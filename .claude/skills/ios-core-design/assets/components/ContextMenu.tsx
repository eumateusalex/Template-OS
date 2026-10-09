/**
 * ContextMenu — ações secundárias de UM item: clique-direito / long-press / botão visível.
 * Painel de vidro (.ios-glass + rounded-ios-card) — a sombra vem com o material.
 * Referência: references/components/context-menu.md · Valores: assets/tokens.css
 * Rótulo à esquerda + ícone à DIREITA (assinatura iOS); véu leve --ios-scrim-menu, sem zoom-blur.
 */
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";

export interface ContextMenuItem {
  label: string;
  /** Ícone Phosphor — vai à DIREITA do rótulo. */
  icon?: ReactNode;
  destructive?: boolean;
  /** Abre o separador de grupo ANTES deste item. */
  group?: boolean;
  onClick: () => void;
}

export interface ContextMenuProps {
  /** Até ~7 itens; destrutivo por último. */
  items: ContextMenuItem[];
  /** O alvo que recebe clique-direito e long-press. */
  children: (bind: {
    onContextMenu: (e: MouseEvent) => void;
    onPointerDown: (e: PointerEvent) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
    "aria-haspopup": "menu";
    "aria-expanded": boolean;
  }) => ReactNode;
}

const LONG_PRESS_MS = 500;
const GAP = 8;

export function ContextMenu({ items, children }: ContextMenuProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const open = point !== null;

  function openAt(x: number, y: number) {
    setPoint({ x, y });
  }
  function close() {
    setPoint(null);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  /* clamp no viewport depois de medir o painel */
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel || !point) return;
    const rect = panel.getBoundingClientRect();
    const x = Math.min(point.x, window.innerWidth - rect.width - GAP);
    const y = Math.min(point.y, window.innerHeight - rect.height - GAP);
    if (x !== point.x || y !== point.y) setPoint({ x: Math.max(GAP, x), y: Math.max(GAP, y) });
    /* foco no primeiro item (roving focus) */
    panel.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus();
  }, [open, point]);

  /* setas ↑/↓ navegam entre os itens */
  function onMenuKeyDown(e: KeyboardEvent) {
    const delta = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const buttons = Array.from(panelRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? []);
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    buttons[(index + delta + buttons.length) % buttons.length]?.focus();
  }

  const bind = {
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault(); // o menu próprio substitui o do navegador no alvo
      openAt(e.clientX, e.clientY);
    },
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse") return; // mouse usa clique-direito
      timer.current = window.setTimeout(() => openAt(e.clientX, e.clientY), LONG_PRESS_MS);
    },
    onPointerUp: () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    onPointerCancel: () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    "aria-haspopup": "menu" as const,
    "aria-expanded": open,
  };

  return (
    <>
      {children(bind)}
      <dialog
        ref={dialogRef}
        onCancel={close}
        onClose={close}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
        className="ios-dialog ios-dialog--menu m-0"
        style={point ? { position: "fixed", top: point.y, left: point.x } : undefined}
      >
        <div
          ref={panelRef}
          role="menu"
          onKeyDown={onMenuKeyDown}
          /* UM vidro só — os itens são conteúdo do painel, nunca vidro próprio */
          className="ios-glass w-[250px] overflow-hidden rounded-ios-card animate-ios-fade-in"
        >
          {items.slice(0, 7).map((item, i) => (
            <div key={item.label}>
              {/* separador de grupo (mais grosso) ou hairline comum */}
              {i > 0 &&
                (item.group ? (
                  <div aria-hidden="true" className="h-2 bg-ios-fill-quaternary" />
                ) : (
                  <div aria-hidden="true" className="h-px bg-ios-separator" />
                ))}
              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={() => {
                  item.onClick();
                  close();
                }}
                className={[
                  "flex h-ios-touch w-full items-center justify-between gap-3 px-4 text-left",
                  "text-ios-body",
                  item.destructive ? "text-ios-red" : "text-ios-label",
                  "transition-colors duration-100 ease-ios",
                  "focus-visible:bg-ios-gray5 active:opacity-70",
                ].join(" ")}
              >
                {item.label}
                {/* ícone à DIREITA — a assinatura do menu iOS */}
                {item.icon && <span aria-hidden="true">{item.icon}</span>}
              </button>
            </div>
          ))}
        </div>
      </dialog>
    </>
  );
}
