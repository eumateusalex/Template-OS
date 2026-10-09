/**
 * Popover — balão de vidro ancorado num botão (iPad/desktop); no mobile vira sheet.
 * Painel .ios-glass + rounded-ios-card — a sombra vem com o material;
 * a seta pinta só o corpo do vidro (aproximação, ver o .md).
 * Referência: references/components/popover.md · Valores: assets/tokens.css
 * <dialog> nativo posicionado pela âncora, com clamp no viewport e seta.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";

export interface PopoverProps {
  open: boolean;
  /** Ref do botão-âncora (que deve ter aria-expanded + aria-haspopup="dialog"). */
  anchorRef: RefObject<HTMLElement | null>;
  /** Nome acessível do popover. */
  label: string;
  onClose: () => void;
  children: ReactNode;
}

const GAP = 8; // folga da âncora e das bordas do viewport
const ARROW = 12;

export function Popover({ open, anchorRef, label, onClose, children }: PopoverProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const [pos, setPos] = useState<{ top: number; left: number; below: boolean; arrowLeft: number } | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) {
      dialog.close();
      setPos(null);
    }
  }, [open]);

  /* posiciona a partir da âncora: abaixo por padrão, acima sem espaço; clamp lateral */
  useLayoutEffect(() => {
    if (!open) return;
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;

    const a = anchor.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const below = a.bottom + GAP + ARROW + p.height <= window.innerHeight || a.top - GAP - ARROW - p.height < 0;

    const top = below ? a.bottom + GAP + ARROW / 2 : a.top - GAP - ARROW / 2 - p.height;
    let left = a.left + a.width / 2 - p.width / 2;
    left = Math.max(GAP, Math.min(left, window.innerWidth - p.width - GAP));
    const arrowLeft = Math.max(16, Math.min(a.left + a.width / 2 - left, p.width - 16));

    setPos({ top, left, below, arrowLeft });
  }, [open, anchorRef]);

  /* fecha ao rolar — comportamento nativo do iPad (não persegue a âncora) */
  useEffect(() => {
    if (!open) return;
    const close = () => onClose();
    window.addEventListener("scroll", close, { capture: true, passive: true });
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, { capture: true } as EventListenerOptions);
      window.removeEventListener("resize", close);
    };
  }, [open, onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelId}
      onCancel={onClose}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose(); // clique fora fecha
      }}
      className="ios-dialog ios-dialog--menu m-0"
      style={pos ? { position: "fixed", top: pos.top, left: pos.left } : undefined}
    >
      <div
        ref={panelRef}
        className={[
          /* UM vidro só — o conteúdo dentro do painel é superfície comum */
          "ios-glass relative w-[280px] rounded-ios-card p-4 animate-ios-fade-in",
          pos ? "" : "invisible", // mede antes de aparecer
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* seta: quadrado rotacionado pintado com o CORPO do vidro — ela não
           herda o backdrop do painel (aproximação; ver o .md, Web: limites) */}
        {pos && (
          <span
            aria-hidden="true"
            style={{ left: pos.arrowLeft }}
            className={[
              "absolute h-3 w-3 -translate-x-1/2 rotate-45 bg-[var(--ios-glass-bg)]",
              pos.below ? "-top-1.5" : "-bottom-1.5",
            ].join(" ")}
          />
        )}
        <span id={labelId} className="sr-only">
          {label}
        </span>
        {children}
      </div>
    </dialog>
  );
}
