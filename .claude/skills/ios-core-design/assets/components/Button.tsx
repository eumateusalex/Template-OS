/**
 * Button — botão Liquid Glass: cápsula sempre, sem prop de escape.
 * filled / tinted / gray / plain servem área de conteúdo; glass é o cromo
 * que flutua sobre o conteúdo (nunca dentro de outro vidro).
 * Referência: references/components/button.md · Valores: assets/tokens.css
 * Press: conteúdo escurece (scale + opacity); glass ilumina (motion.md §2).
 */
import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variante visual. Uma tela tem no máximo UM filled; glass é cromo — nunca dentro de outro vidro. */
  variant?: "filled" | "tinted" | "gray" | "plain" | "glass";
  size?: "small" | "medium" | "large";
  /** Troca o azul pelo vermelho do sistema (apagar, remover). */
  destructive?: boolean;
  /** Ícone Phosphor (peso regular). Fica à esquerda do texto, 1em. */
  icon?: ReactNode;
  children?: ReactNode;
}

/* Cápsula via token (--ios-radius-button → pill) — não existe outra forma */
const BASE =
  "inline-flex items-center justify-center gap-1 rounded-ios-button " +
  "font-ios select-none cursor-pointer " +
  /* 0.4 é aproximação — o valor do desabilitado nativo não é documentado */
  "disabled:opacity-40 disabled:pointer-events-none";

/* Press de conteúdo: scale 0.97 + opacity 0.7 em 0.1s (motion.md §2) */
const PRESS_CONTENT =
  "transition-[transform,opacity] duration-100 ease-ios " +
  "active:scale-[0.97] active:opacity-70";

/* Press de vidro: o vidro ILUMINA, não escurece — sem opacity. A iluminação
 * inteira (frosted no press + scale + volta em bounce) mora na classe
 * .ios-glass--interactive do tokens.css, porque o background de .ios-glass
 * é CSS sem camada e utilitária Tailwind não o vence com garantia. */
const PRESS_GLASS = "ios-glass--interactive";

const VARIANT: Record<string, string> = {
  filled: "bg-ios-blue text-ios-on-accent font-semibold",
  tinted: "bg-ios-blue-tint text-ios-blue font-semibold",
  gray: "bg-ios-fill-secondary text-ios-blue font-semibold",
  plain: "bg-transparent text-ios-blue",
  /* cromo flutuante: o material inteiro (corpo, lensing, sombra) é a classe */
  glass: "ios-glass text-ios-label font-semibold",
};

const VARIANT_DESTRUCTIVE: Record<string, string> = {
  filled: "bg-ios-red text-ios-on-accent font-semibold",
  tinted: "bg-ios-fill-secondary text-ios-red font-semibold",
  gray: "bg-ios-fill-secondary text-ios-red font-semibold",
  plain: "bg-transparent text-ios-red",
  glass: "ios-glass text-ios-red font-semibold",
};

const SIZE: Record<string, string> = {
  /* small: 32px visuais + área de toque estendida a 44px (regra inviolável 1) */
  small:
    "relative h-8 px-3 text-ios-subheadline " +
    "after:absolute after:content-[''] after:-inset-y-1.5 after:inset-x-0",
  medium: "h-ios-touch px-4 text-ios-body",
  large: "h-ios-button px-5 text-ios-body",
};

export function Button({
  variant = "filled",
  size = "medium",
  destructive = false,
  icon,
  children,
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  const variantClasses = destructive ? VARIANT_DESTRUCTIVE[variant] : VARIANT[variant];
  const pressClasses = variant === "glass" ? PRESS_GLASS : PRESS_CONTENT;
  return (
    <button
      type={type}
      className={[BASE, pressClasses, variantClasses, SIZE[size], className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
