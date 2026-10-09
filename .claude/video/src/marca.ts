// GERADO por .claude/skills/video/ferramentas/marca-remotion.mjs a partir de
// .claude/skills/carrossel/marca/tokens.css. Não edite à mão: mude o tokens.css
// (o /carrossel configurar é o dono dele) e rode o gerador de novo.

import { cancelRender, continueRender, delayRender } from "remotion";

export const MARCA_CONFIGURADA: boolean = false;

/** As 8 cores da marca, pelo papel (o mesmo do tokens.css). */
export const COR = {
  principal: "", // --c-dark
  clara: "", // --c-light
  acento: "", // --c-accent
  apoio1: "", // --c-support-1
  apoio2: "", // --c-support-2
  rara: "", // --c-rare
  abismo: "", // --c-abyss
  ok: "", // --c-ok
} as const;

/** As três famílias, com a pilha de reserva do tokens.css. */
export const FONTE = {
  display: "",
  serif: "",
  mono: "",
} as const;

export const PESO = {
  displayForte: 700,
  displayMedio: 500,
  monoMedio: 500,
} as const;

const FOLHAS_DE_FONTE: string[] = [];
const FAMILIAS: string[] = [];

export const FPS = 30;

// As fontes chegam pela mesma folha que o tokens.css importa, e o render espera
// por elas: sem isso o primeiro quadro sai na fonte do sistema.
if (typeof document !== "undefined" && FOLHAS_DE_FONTE.length > 0) {
  const espera = delayRender("as fontes da marca");
  Promise.all(
    FOLHAS_DE_FONTE.map(
      (href) =>
        new Promise<void>((pronto, falha) => {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = href;
          link.onload = () => pronto();
          link.onerror = () => falha(new Error("a folha de fonte da marca não carregou: " + href));
          document.head.appendChild(link);
        }),
    ),
  )
    .then(() => Promise.all(FAMILIAS.map((f) => document.fonts.load(PESO.displayForte + ' 64px "' + f + '"'))))
    .then(() => continueRender(espera))
    .catch((e) => cancelRender(e));
}

/** Toda composição chama isto primeiro: sem marca fechada, o vídeo não sai. */
export function exigeMarca(): void {
  if (!MARCA_CONFIGURADA) {
    throw new Error(
      "A marca deste workspace ainda não está fechada. Rode /carrossel configurar e depois node .claude/skills/video/ferramentas/marca-remotion.mjs",
    );
  }
}
