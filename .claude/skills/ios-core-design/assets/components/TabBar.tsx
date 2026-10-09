/**
 * TabBar — navegação de primeiro nível: cápsula de vidro flutuante,
 * 49px de conteúdo + --ios-bar-inset + safe area, ícone 24 + Caption 2.
 * Referência: references/components/tab-bar.md · Valores: assets/tokens.css
 * Ativo = azul + weight fill + aria-current; inativo = cinza + regular.
 * collapsible: encolhe pro item ativo ao rolar pra baixo (estado discreto,
 * sem animar largura; respeita prefers-reduced-motion).
 */
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export interface TabBarItem {
  /** Rótulo de UMA palavra, sempre visível. */
  label: string;
  /** Render do ícone — recebe o peso certo pro estado (regular/fill). */
  icon: (props: { weight: "regular" | "fill"; size: number }) => ReactNode;
  href: string;
  /** Badge numérico opcional (ver badge.md). */
  badge?: number;
}

export interface TabBarProps {
  /** 2 a 5 itens. */
  items: TabBarItem[];
  /** href do item ativo. */
  current: string;
  /** Navegação SPA opcional; sem ela, o <a> navega normal. */
  onNavigate?: (href: string) => void;
  /** Encolher pro item ativo ao rolar pra baixo (fiel ao nativo). */
  collapsible?: boolean;
  className?: string;
}

export function TabBar({ items, current, onNavigate, collapsible = false, className }: TabBarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    if (!collapsible) return;
    const onScroll = () => {
      const y = window.scrollY;
      /* limiar de 8px separa rolagem de ruído; subir sempre expande */
      if (y > lastY.current + 8 && y > 64) setCollapsed(true);
      else if (y < lastY.current - 8) setCollapsed(false);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [collapsible]);

  return (
    <nav
      aria-label="Principal"
      /* a cápsula flutua: inset lateral + (inset + safe area) embaixo */
      className={[
        "pointer-events-none fixed inset-x-0 bottom-0 z-10 flex justify-center",
        "px-ios-bar-inset pb-[calc(var(--ios-bar-inset)+var(--ios-safe-bottom))]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ul
        className={[
          /* UM vidro só — os itens são conteúdo da cápsula, nunca vidro próprio */
          "ios-glass pointer-events-auto m-0 flex h-ios-tabbar w-full list-none",
          "items-stretch justify-center rounded-ios-pill p-0 px-2 sm:w-auto",
        ].join(" ")}
      >
        {items.slice(0, 5).map((item) => {
          const active = item.href === current;
          const hidden = collapsed && !active;
          return (
            <li key={item.href} className={hidden ? "hidden" : "min-w-0 flex-1 sm:flex-none"}>
              <a
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={
                  onNavigate
                    ? (e) => {
                        e.preventDefault();
                        onNavigate(item.href);
                      }
                    : undefined
                }
                className={[
                  "flex h-full min-w-16 flex-col items-center justify-center gap-0.5 px-3",
                  "transition-opacity duration-100 ease-ios active:opacity-70",
                  active ? "text-ios-blue" : "text-ios-gray",
                ].join(" ")}
              >
                <span className="relative leading-none">
                  {/* 24px: derivado da grade (glifo nativo ~25pt); fill marca o ativo */}
                  {item.icon({ weight: active ? "fill" : "regular", size: 24 })}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={[
                        "absolute -right-2.5 -top-1 flex h-4 min-w-4 items-center justify-center",
                        "rounded-ios-pill bg-ios-red px-1 text-ios-caption2 text-ios-on-accent",
                      ].join(" ")}
                      aria-label={`${item.badge} não lidas`}
                    >
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </span>
                <span className="truncate text-ios-caption2">{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
