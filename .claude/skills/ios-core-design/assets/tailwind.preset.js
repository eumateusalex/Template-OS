/* ios-core-design v1.0 — GERADO, não editar à mão */
/*
 * tailwind.preset.js — preset para Tailwind v3.
 * As lavagens de estado são tokens (bg-ios-tint-red/orange/green).
 * box-sizing, color-scheme e o host fix do select vêm do tokens.css, que
 * este preset PRESSUPÕE importado (regra abaixo).
 *
 * Como usar (o install.sh faz isso sozinho):
 *   // tailwind.config.js do projeto
 *   module.exports = {
 *     presets: [require('./ios.tailwind.preset.js')],
 *     ...
 *   }
 *
 * Regras:
 *  - TUDO que tem token aponta pra CSS var do tokens.css (var(--ios-*)):
 *    cores, raios, medidas, sombra, curvas, tipografia. Valor literal aqui
 *    seria uma segunda cópia que não acompanha o tokens.css.
 *  - Pressupõe o tokens.css importado no CSS global do projeto.
 *  - O VIDRO não tem utilitária Tailwind de propósito: material se aplica com
 *    a classe .ios-glass do tokens.css (references/materials.md). Aqui só vive
 *    a parte externa da sombra (shadow-ios-glass) pra composição custom.
 *  - Projeto Tailwind v4 não usa este arquivo: usa o tailwind-v4.css
 *    (@theme), que gera as MESMAS utilitárias.
 */
module.exports = {
  theme: {
    extend: {
      /* --- Cores — bg-ios-blue, text-ios-label, border-ios-separator... --- */
      colors: {
        "ios-blue": "var(--ios-blue)",
        "ios-green": "var(--ios-green)",
        "ios-indigo": "var(--ios-indigo)",
        "ios-orange": "var(--ios-orange)",
        "ios-pink": "var(--ios-pink)",
        "ios-purple": "var(--ios-purple)",
        "ios-red": "var(--ios-red)",
        "ios-teal": "var(--ios-teal)",
        "ios-yellow": "var(--ios-yellow)",
        "ios-gray": "var(--ios-gray)",
        "ios-gray2": "var(--ios-gray2)",
        "ios-gray3": "var(--ios-gray3)",
        "ios-gray4": "var(--ios-gray4)",
        "ios-gray5": "var(--ios-gray5)",
        "ios-gray6": "var(--ios-gray6)",
        "ios-bg": "var(--ios-bg)",
        "ios-bg-secondary": "var(--ios-bg-secondary)",
        "ios-bg-tertiary": "var(--ios-bg-tertiary)",
        "ios-bg-grouped": "var(--ios-bg-grouped)",
        "ios-bg-grouped-secondary": "var(--ios-bg-grouped-secondary)",
        "ios-label": "var(--ios-label)",
        "ios-label-secondary": "var(--ios-label-secondary)",
        "ios-label-tertiary": "var(--ios-label-tertiary)",
        "ios-label-quaternary": "var(--ios-label-quaternary)",
        "ios-separator": "var(--ios-separator)",
        "ios-separator-opaque": "var(--ios-separator-opaque)",
        "ios-fill": "var(--ios-fill)",
        "ios-fill-secondary": "var(--ios-fill-secondary)",
        "ios-fill-tertiary": "var(--ios-fill-tertiary)",
        "ios-fill-quaternary": "var(--ios-fill-quaternary)",
        "ios-blue-tint": "var(--ios-blue-tint)",
        "ios-tint-red": "var(--ios-tint-red)",
        "ios-tint-orange": "var(--ios-tint-orange)",
        "ios-tint-green": "var(--ios-tint-green)",
        "ios-segment": "var(--ios-segment)",
        "ios-on-accent": "var(--ios-on-accent)",
        "ios-scrim": "var(--ios-scrim)",
        "ios-scrim-menu": "var(--ios-scrim-menu)",
        "ios-glass-dim": "var(--ios-glass-dim)",
        "ios-glass-solid": "var(--ios-glass-solid)",
      },

      /* --- Fonte — font-ios --- */
      fontFamily: {
        ios: [
          "-apple-system",
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Inter"',
          "system-ui",
          "sans-serif",
        ],
      },

      /* --- Escala Dynamic Type (Large) — text-ios-body, text-ios-title1... ---
         Tracking: ≥20px → -0.4px; peso embutido no estilo (não repetir font-bold). */
      fontSize: {
        "ios-large-title": ["var(--ios-text-large-title-size)", { lineHeight: "var(--ios-text-large-title-leading)", letterSpacing: "var(--ios-text-large-title-tracking)", fontWeight: "var(--ios-text-large-title-weight)" }],
        "ios-title1": ["var(--ios-text-title1-size)", { lineHeight: "var(--ios-text-title1-leading)", letterSpacing: "var(--ios-text-title1-tracking)", fontWeight: "var(--ios-text-title1-weight)" }],
        "ios-title2": ["var(--ios-text-title2-size)", { lineHeight: "var(--ios-text-title2-leading)", letterSpacing: "var(--ios-text-title2-tracking)", fontWeight: "var(--ios-text-title2-weight)" }],
        "ios-title3": ["var(--ios-text-title3-size)", { lineHeight: "var(--ios-text-title3-leading)", letterSpacing: "var(--ios-text-title3-tracking)", fontWeight: "var(--ios-text-title3-weight)" }],
        "ios-headline": ["var(--ios-text-headline-size)", { lineHeight: "var(--ios-text-headline-leading)", letterSpacing: "var(--ios-text-headline-tracking)", fontWeight: "var(--ios-text-headline-weight)" }],
        "ios-body": ["var(--ios-text-body-size)", { lineHeight: "var(--ios-text-body-leading)", letterSpacing: "var(--ios-text-body-tracking)", fontWeight: "var(--ios-text-body-weight)" }],
        "ios-callout": ["var(--ios-text-callout-size)", { lineHeight: "var(--ios-text-callout-leading)", letterSpacing: "var(--ios-text-callout-tracking)", fontWeight: "var(--ios-text-callout-weight)" }],
        "ios-subheadline": ["var(--ios-text-subheadline-size)", { lineHeight: "var(--ios-text-subheadline-leading)", letterSpacing: "var(--ios-text-subheadline-tracking)", fontWeight: "var(--ios-text-subheadline-weight)" }],
        "ios-footnote": ["var(--ios-text-footnote-size)", { lineHeight: "var(--ios-text-footnote-leading)", letterSpacing: "var(--ios-text-footnote-tracking)", fontWeight: "var(--ios-text-footnote-weight)" }],
        "ios-caption1": ["var(--ios-text-caption1-size)", { lineHeight: "var(--ios-text-caption1-leading)", letterSpacing: "var(--ios-text-caption1-tracking)", fontWeight: "var(--ios-text-caption1-weight)" }],
        "ios-caption2": ["var(--ios-text-caption2-size)", { lineHeight: "var(--ios-text-caption2-leading)", letterSpacing: "var(--ios-text-caption2-tracking)", fontWeight: "var(--ios-text-caption2-weight)" }],
      },

      /* --- Tracking de cabeçalho uppercase — tracking-ios-caps --- */
      letterSpacing: {
        "ios-caps": "var(--ios-tracking-caps)",
      },

      /* --- Raios — rounded-ios-button (cápsula), rounded-ios-card... --- */
      borderRadius: {
        "ios-button": "var(--ios-radius-button)", /* cápsula, sem escape */
        "ios-card": "var(--ios-radius-card)",
        "ios-input": "var(--ios-radius-input)",
        "ios-badge": "var(--ios-radius-badge)",
        "ios-alert": "var(--ios-radius-alert)",
        "ios-sheet": "var(--ios-radius-sheet)", /* só no topo (rounded-t-ios-sheet) */
        "ios-pill": "var(--ios-radius-pill)",
      },

      /* --- Medidas — h-ios-navbar, min-h-ios-touch, px-ios-margin, pb-ios-safe-bottom... --- */
      spacing: {
        "ios-touch": "var(--ios-touch-min)",
        "ios-navbar": "var(--ios-h-navbar)",
        "ios-navbar-large": "var(--ios-h-navbar-large)",
        "ios-tabbar": "var(--ios-h-tabbar)",
        "ios-bar-inset": "var(--ios-bar-inset)",
        "ios-row": "var(--ios-h-row)",
        "ios-row-large": "var(--ios-h-row-large)",
        "ios-button": "var(--ios-h-button)",
        "ios-margin": "var(--ios-margin)",
        "ios-margin-wide": "var(--ios-margin-wide)",
        "ios-section": "var(--ios-section-gap)",
        "ios-card": "var(--ios-card-padding)",
        "ios-safe-bottom": "var(--ios-safe-bottom)",
      },

      /* --- Sombra de flutuação do vidro — shadow-ios-glass (parte EXTERNA;
             o vidro completo, com glint e stroke, é a classe .ios-glass) --- */
      boxShadow: {
        "ios-glass": "var(--ios-glass-shadow)",
      },

      /* --- Movimento — ease-ios, ease-ios-spring, ease-ios-bounce (durações:
             usar as nativas duration-300 / duration-100 / duration-150 / duration-500) --- */
      transitionTimingFunction: {
        ios: "var(--ios-ease)",
        "ios-spring": "var(--ios-ease-spring)",
        "ios-bounce": "var(--ios-ease-bounce)",
      },

      /* --- Animações prontas — animate-ios-spin, animate-ios-sheet-up...
             (exclusivas desta camada: durações/curvas ficam literais aqui) --- */
      keyframes: {
        "ios-spin-steps": {
          to: { transform: "rotate(360deg)" },
        },
        "ios-sheet-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "ios-fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "ios-toast-in": {
          from: { transform: "translateY(calc(-100% - 8px))", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        /* alerta entra assentando de 1.1 pra 1 (decisão registrada — nativo não documentado) */
        "ios-alert-in": {
          from: { transform: "scale(1.1)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        /* 0.8s steps(8) — calibrado no PREVIEW */
        "ios-spin": "ios-spin-steps 0.8s steps(8, end) infinite",
        "ios-sheet-up": "ios-sheet-up 0.5s cubic-bezier(0.32, 0.72, 0, 1)",
        "ios-fade-in": "ios-fade-in 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)",
        "ios-toast-in": "ios-toast-in 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)",
        "ios-alert-in": "ios-alert-in 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)",
      },
    },
  },
};
