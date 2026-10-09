/**
 * List / ListSection / ListRow — a UITableView da web (inset grouped e plain).
 * Referência: references/components/list.md · Valores: assets/tokens.css
 * Swipe actions: versão simplificada com Pointer Events + alternativa por foco
 * de teclado (gesto nunca é o único caminho — accessibility.md §4).
 */
import { useRef, useState, type ReactNode, type PointerEvent } from "react";
import { CaretRight } from "@phosphor-icons/react";

/* ---------------------------------------------------------------- List */

export interface ListProps {
  /** inset = flutuante com raio (Ajustes); plain = borda a borda. */
  variant?: "inset" | "plain";
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}

export function List({ variant = "inset", children, className, ...rest }: ListProps) {
  return (
    <ul
      className={[
        "m-0 list-none p-0 bg-ios-bg-grouped-secondary",
        variant === "inset" ? "mx-ios-margin overflow-hidden rounded-ios-card" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </ul>
  );
}

/* --------------------------------------------------------- ListSection */

export interface ListSectionProps {
  /** Cabeçalho da seção (Footnote caixa-alta — o SectionHeader embutido). */
  header?: string;
  /** Rodapé explicativo (Footnote). */
  footer?: string;
  variant?: "inset" | "plain";
  children: ReactNode;
  className?: string;
}

export function ListSection({ header, footer, variant = "inset", children, className }: ListSectionProps) {
  return (
    <section className={["mb-ios-section", className].filter(Boolean).join(" ")}>
      {header && (
        <h3
          className={[
            "mb-2 text-ios-footnote uppercase tracking-ios-caps text-ios-label-secondary",
            variant === "inset" ? "px-8" : "px-4",
          ].join(" ")}
        >
          {header}
        </h3>
      )}
      <List variant={variant}>{children}</List>
      {footer && (
        <p
          className={[
            "mt-2 text-ios-footnote text-ios-label-secondary",
            variant === "inset" ? "px-8" : "px-4",
          ].join(" ")}
        >
          {footer}
        </p>
      )}
    </section>
  );
}

/* ------------------------------------------------------------- ListRow */

const ICON_BG: Record<string, string> = {
  blue: "bg-ios-blue",
  green: "bg-ios-green",
  indigo: "bg-ios-indigo",
  orange: "bg-ios-orange",
  pink: "bg-ios-pink",
  purple: "bg-ios-purple",
  red: "bg-ios-red",
  teal: "bg-ios-teal",
  yellow: "bg-ios-yellow",
  gray: "bg-ios-gray",
};

export interface SwipeAction {
  label: string;
  destructive?: boolean;
  onClick: () => void;
}

export interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Valor à direita, em label secundário ("Casa", "3 itens"). */
  value?: string;
  /** Glifo Phosphor (branco, dentro do quadradinho de acento). */
  icon?: ReactNode;
  /** Cor do quadradinho do ícone — acento de categoria. */
  iconBg?: keyof typeof ICON_BG;
  /** Chevron de navegação (só em célula que navega). */
  chevron?: boolean;
  /** Controle à direita (Switch, Badge…). */
  trailing?: ReactNode;
  /** Torna a célula clicável (fundo gray5 no press — sem scale). */
  onClick?: () => void;
  /** Até 2 ações reveladas por swipe ou por foco de teclado. */
  swipeActions?: SwipeAction[];
  disabled?: boolean;
}

export function ListRow({
  title,
  subtitle,
  value,
  icon,
  iconBg = "blue",
  chevron = false,
  trailing,
  onClick,
  swipeActions,
  disabled = false,
}: ListRowProps) {
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState(false);
  const start = useRef<{ x: number; offset: number } | null>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const actions = (swipeActions ?? []).slice(0, 2); // máximo 2 (list.md)
  const hasSwipe = actions.length > 0;
  const actionsWidth = actions.length * 76; // 76px por ação (60 de conteúdo + respiro)

  function onPointerDown(e: PointerEvent) {
    if (!hasSwipe || disabled) return;
    start.current = { x: e.clientX, offset };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: PointerEvent) {
    if (!start.current) return;
    const delta = e.clientX - start.current.x;
    setOffset(Math.min(0, Math.max(-actionsWidth, start.current.offset + delta)));
  }
  function onPointerUp() {
    if (!start.current) return;
    start.current = null;
    // snap por proximidade: passou da metade, abre; senão fecha
    const shouldOpen = offset < -actionsWidth / 2;
    setOpen(shouldOpen);
    setOffset(shouldOpen ? -actionsWidth : 0);
  }

  const height = subtitle ? "min-h-ios-row-large" : "min-h-ios-row";
  const separatorInset = icon ? "before:left-14" : "before:left-4";

  const content = (
    <>
      {icon && (
        <span
          aria-hidden="true"
          className={[
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ios-on-accent",
            ICON_BG[iconBg],
          ].join(" ")}
        >
          {icon}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-ios-body text-ios-label">{title}</span>
        {subtitle && (
          <span className="truncate text-ios-footnote text-ios-label-secondary">{subtitle}</span>
        )}
      </span>
      {value && <span className="shrink-0 text-ios-body text-ios-label-secondary">{value}</span>}
      {trailing}
      {chevron && <CaretRight aria-hidden="true" className="shrink-0 text-ios-gray2" />}
    </>
  );

  const rowClasses = [
    "relative flex w-full items-center gap-3 px-4 text-left",
    height,
    /* separador hairline alinhado com o texto; some na primeira célula */
    "before:absolute before:top-0 before:right-0 before:h-px before:bg-ios-separator before:content-['']",
    separatorInset,
    "first:before:hidden",
    disabled ? "opacity-40 pointer-events-none" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li className="relative overflow-hidden bg-ios-bg-grouped-secondary group">
      {/* ações de swipe — também reveladas por foco de teclado (focus-within),
          porque gesto nunca é o único caminho (accessibility.md §4) */}
      {hasSwipe && (
        <div
          ref={actionsRef}
          className={[
            "absolute inset-y-0 right-0 flex",
            open || offset < 0
              ? ""
              : "opacity-0 [&:not(:focus-within)]:pointer-events-none focus-within:opacity-100 group-focus-within:opacity-100",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => {
                action.onClick();
                setOpen(false);
                setOffset(0);
              }}
              className={[
                "w-[76px] text-ios-subheadline",
                action.destructive ? "bg-ios-red text-ios-on-accent" : "bg-ios-fill text-ios-label",
              ].join(" ")}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={hasSwipe ? { transform: `translateX(${open ? -actionsWidth : offset}px)` } : undefined}
        className={[
          "relative bg-ios-bg-grouped-secondary",
          start.current ? "" : "transition-transform duration-300 ease-ios",
        ].join(" ")}
      >
        {onClick ? (
          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            /* célula pressionada troca o FUNDO — nunca scale (list.md) */
            className={[rowClasses, "active:bg-ios-gray5 transition-colors duration-100 ease-ios"].join(" ")}
          >
            {content}
          </button>
        ) : (
          <div className={rowClasses}>{content}</div>
        )}
      </div>
    </li>
  );
}
