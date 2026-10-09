/**
 * Toast — cápsula de vidro que desce do topo e some sozinha.
 * .ios-glass + rounded-ios-pill: a sombra de flutuação vem com o material.
 * Referência: references/components/toast.md · Valores: assets/tokens.css
 * Fila de UM: a montagem/provider fica pro app; aqui é a cápsula + timer.
 */
import { useEffect, useState, type ReactNode } from "react";

export interface ToastProps {
  open: boolean;
  /** 1 a 3 palavras ("Salvo", "Link copiado"). */
  message: string;
  /** Ícone Phosphor opcional (CheckCircle verde, WarningCircle vermelho…). */
  icon?: ReactNode;
  /** Erro leve → anuncia assertivo no leitor de tela. */
  error?: boolean;
  /** ms até sumir sozinha. */
  duration?: number;
  onClose: () => void;
}

export function Toast({ open, message, icon, error = false, duration = 3000, onClose }: ToastProps) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLeaving(false);
    const hide = window.setTimeout(() => setLeaving(true), duration);
    const remove = window.setTimeout(onClose, duration + 300); // 300ms do fade de saída
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(remove);
    };
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live={error ? "assertive" : "polite"}
      className="pointer-events-none fixed inset-x-0 top-[calc(8px+env(safe-area-inset-top,0px))] z-20 flex justify-center"
    >
      <div
        className={[
          /* cápsula de vidro — a sombra vem com o material; sem interação, nunca rouba foco */
          "ios-glass flex items-center gap-2 rounded-ios-pill px-4 py-2.5",
          leaving ? "opacity-0 transition-opacity duration-300 ease-ios" : "animate-ios-toast-in",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {icon && <span aria-hidden="true">{icon}</span>}
        <span className="text-ios-subheadline text-ios-label">{message}</span>
      </div>
    </div>
  );
}
