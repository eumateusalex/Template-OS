/**
 * ActionSheet — ações contextuais flutuando sobre a borda: dois blocos de
 * vidro (.ios-glass) com Cancelar apartado, margem --ios-bar-inset + safe area.
 * Referência: references/components/action-sheet.md · Valores: assets/tokens.css
 */
import { useEffect, useId, useRef } from "react";

export interface ActionSheetAction {
  label: string;
  destructive?: boolean;
  onClick: () => void;
}

export interface ActionSheetProps {
  open: boolean;
  /** Contexto opcional em Footnote ("O que fazer com esta foto?"). */
  title?: string;
  /** 2 a 6 ações-verbo; a destrutiva por último. */
  actions: ActionSheetAction[];
  onClose: () => void;
}

/* cada bloco é UM vidro; os botões dentro são conteúdo, nunca vidro próprio */
const BLOCK = "ios-glass overflow-hidden rounded-ios-sheet";
const CELL = "h-14 w-full text-ios-body transition-opacity duration-100 ease-ios active:opacity-70";

export function ActionSheet({ open, title, actions, onClose }: ActionSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : "Ações"}
      onCancel={onClose}
      onClose={onClose}
      /* clique no véu (o próprio dialog) cancela */
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="ios-dialog mx-auto mb-0 mt-auto w-full max-w-[500px]"
    >
      {/* flutua: --ios-bar-inset nas laterais e embaixo + safe area; spring na entrada */}
      <div
        className={[
          "flex flex-col gap-2 px-ios-bar-inset",
          "pb-[calc(var(--ios-bar-inset)+var(--ios-safe-bottom))]",
          "animate-ios-sheet-up",
        ].join(" ")}
      >
        <div className={[BLOCK, "divide-y divide-ios-separator"].join(" ")}>
          {title && (
            <p id={titleId} className="px-4 py-3 text-center text-ios-footnote text-ios-label-secondary">
              {title}
            </p>
          )}
          {actions.map((action, i) => (
            <button
              key={action.label}
              type="button"
              autoFocus={i === actions.findIndex((a) => !a.destructive)}
              onClick={action.onClick}
              className={[CELL, action.destructive ? "text-ios-red" : "text-ios-blue"].join(" ")}
            >
              {action.label}
            </button>
          ))}
        </div>
        {/* Cancelar apartado — o afastamento protege do toque errado */}
        <div className={BLOCK}>
          <button type="button" onClick={onClose} className={[CELL, "font-semibold text-ios-blue"].join(" ")}>
            Cancelar
          </button>
        </div>
      </div>
    </dialog>
  );
}
