/**
 * Alert — decisão obrigatória em painel de vidro de 270px (.ios-glass +
 * rounded-ios-alert; o UIAlertController.alert do Liquid Glass).
 * Referência: references/components/alert.md · Valores: assets/tokens.css
 * <dialog role="alertdialog"> nativo: foco preso, Esc cancela, fundo inerte.
 */
import { useEffect, useId, useRef } from "react";

export interface AlertAction {
  label: string;
  /** cancel = semibold e recebe o Esc; destructive = vermelho. */
  style?: "default" | "cancel" | "destructive";
  onClick: () => void;
}

export interface AlertProps {
  open: boolean;
  /** Título curto afirmativo ou pergunta direta ("Apagar esta conversa?"). */
  title: string;
  /** UMA frase com a consequência. */
  message?: string;
  /** 2 a 3 ações; 2 ficam lado a lado, 3+ empilham. */
  actions: AlertAction[];
  /** Chamado no Esc/cancelamento — normalmente o mesmo onClick do cancel. */
  onClose: () => void;
}

/* o painel é UM vidro (raio 26, sombra e borda de luz na classe);
   os botões são conteúdo dele, separados por hairline */
const PANEL = "ios-glass w-[270px] overflow-hidden rounded-ios-alert animate-ios-alert-in";
const BUTTON = "h-ios-touch text-ios-body transition-opacity duration-100 ease-ios active:opacity-70";

export function Alert({ open, title, message, actions, onClose }: AlertProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const sideBySide = actions.length === 2;

  return (
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={message ? messageId : undefined}
      onCancel={onClose}
      onClose={onClose}
      className="ios-dialog m-auto"
    >
      <div className={PANEL}>
        <div className="px-4 py-5 text-center">
          <h2 id={titleId} className="text-ios-headline text-ios-label">
            {title}
          </h2>
          {message && (
            <p id={messageId} className="mt-1 text-ios-footnote text-ios-label">
              {message}
            </p>
          )}
        </div>
        {/* botões separados por hairline; 2 lado a lado, 3+ empilhados */}
        <div
          className={[
            "border-t border-ios-separator",
            sideBySide ? "grid grid-cols-2 divide-x divide-ios-separator" : "grid divide-y divide-ios-separator",
          ].join(" ")}
        >
          {actions.map((action, i) => (
            <button
              key={action.label}
              type="button"
              /* o foco inicial cai no primeiro botão NÃO destrutivo */
              autoFocus={i === actions.findIndex((a) => a.style !== "destructive")}
              onClick={action.onClick}
              className={[
                BUTTON,
                action.style === "destructive" ? "text-ios-red" : "text-ios-blue",
                action.style === "cancel" ? "font-semibold" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </dialog>
  );
}
