/**
 * ModalSheet — sheet com detents (medium 50dvh / large 92dvh), grabber e
 * painel de vidro (.ios-glass, raio só no topo — o vidro traz a sombra).
 * Referência: references/components/modal-sheet.md · Valores: assets/tokens.css
 * <dialog> nativo; tap no grabber alterna detent; arrasto é enhancement.
 */
import { useEffect, useId, useRef, useState, type ReactNode, type PointerEvent } from "react";
import { X } from "@phosphor-icons/react";

export type SheetDetent = "medium" | "large";

export interface ModalSheetProps {
  open: boolean;
  /** Título do header (Headline centrado). */
  title: string;
  /** Detent inicial. */
  detent?: SheetDetent;
  /** Ação do header à direita ("Concluir"); o X de fechar existe sempre. */
  action?: { label: string; onClick: () => void };
  onClose: () => void;
  children: ReactNode;
}

const DETENT_HEIGHT: Record<SheetDetent, string> = {
  medium: "h-[50dvh]",
  large: "h-[92dvh]",
};

/* o painel é UM vidro: sombra, borda de luz e fallback opaco vêm da classe;
   o conteúdo lá dentro segue sólido (vidro não amostra vidro) */
const PANEL = "ios-glass flex flex-col rounded-t-ios-sheet";

export function ModalSheet({ open, title, detent = "medium", action, onClose, children }: ModalSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [current, setCurrent] = useState<SheetDetent>(detent);
  const [dragY, setDragY] = useState(0);
  const drag = useRef<{ startY: number } | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setCurrent(detent);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, detent]);

  function toggleDetent() {
    setCurrent(current === "medium" ? "large" : "medium");
  }

  /* arrasto no grabber/header — enhancement; solta → snap por proximidade */
  function onPointerDown(e: PointerEvent) {
    drag.current = { startY: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: PointerEvent) {
    if (!drag.current) return;
    setDragY(Math.max(0, e.clientY - drag.current.startY)); // só arrasta pra baixo
  }
  function onPointerUp() {
    if (!drag.current) return;
    drag.current = null;
    const threshold = window.innerHeight * 0.15;
    if (dragY > threshold) {
      if (current === "large") setCurrent("medium"); // large desce pra medium…
      else onClose(); // …medium desce e fecha
    }
    setDragY(0);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose(); // véu fecha
      }}
      className="ios-dialog mx-auto mb-0 mt-auto w-full max-w-[640px]"
    >
      <div
        style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
        className={[
          PANEL,
          DETENT_HEIGHT[current],
          dragY ? "" : "transition-[height,transform] duration-500 ease-ios-spring",
          "animate-ios-sheet-up",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* grabber: tap alterna o detent (o caminho de teclado); arrasto é extra */}
        <div
          className="flex shrink-0 cursor-grab justify-center pt-2"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <button
            type="button"
            aria-label="Alternar altura"
            onClick={toggleDetent}
            className="relative h-[5px] w-9 rounded-ios-pill bg-ios-gray3 after:absolute after:content-[''] after:-inset-y-5 after:-inset-x-8"
          />
        </div>
        <header
          className="flex shrink-0 items-center justify-between gap-2 px-4 pb-2 pt-1"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* X de fechar sempre visível — gesto nunca é o único caminho */}
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className={[
              "flex h-8 w-8 items-center justify-center rounded-ios-pill bg-ios-fill",
              "text-ios-label-secondary transition-opacity duration-100 ease-ios active:opacity-70",
            ].join(" ")}
          >
            <X aria-hidden="true" />
          </button>
          <h2 id={titleId} className="min-w-0 truncate text-ios-headline text-ios-label">
            {title}
          </h2>
          {action ? (
            <button
              type="button"
              onClick={action.onClick}
              className={[
                "min-h-ios-touch shrink-0 text-ios-body font-semibold text-ios-blue",
                "transition-opacity duration-100 ease-ios active:opacity-70",
              ].join(" ")}
            >
              {action.label}
            </button>
          ) : (
            <span className="w-8" aria-hidden="true" />
          )}
        </header>
        {/* corpo rolável; a rolagem não vaza pro fundo */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-ios-margin pb-ios-safe-bottom">
          {children}
        </div>
      </div>
    </dialog>
  );
}
