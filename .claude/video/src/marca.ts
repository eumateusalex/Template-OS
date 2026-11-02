// GERADO por scripts/marca/gerar.mjs a partir de identidade/marca.tokens.json: não edite
// ESTADO: nao-configurado. a marca não está configurada: rode /marca.

import { cancelRender, continueRender, delayRender } from "remotion";

export const MARCA_CONFIGURADA: boolean = false;

/** As 8 cores da marca, pelo papel. */
export const COR = {
  principal: "",
  clara: "",
  acento: "",
  apoio1: "",
  apoio2: "",
  rara: "",
  abismo: "",
  ok: "",
} as const;

/** As três famílias, com a pilha de reserva. */
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

/** A curva (Easing.bezier(...MOVIMENTO.curva.principal)) e as durações da marca, em ms. */
export const MOVIMENTO = {
  curva: {"principal":[0,0,1,1],"entrada":[0,0,1,1],"saida":[0,0,1,1]} as Record<"principal" | "entrada" | "saida", [number, number, number, number]>,
  duracaoMs: {"rapida":0,"media":0,"lenta":0},
  cascataMs: 0,
} as const;

export const RAIO = { sm: 0, md: 0, lg: 0, cartao: 0, pilula: false } as const;

const FOLHAS_DE_FONTE: string[] = [];
const FAMILIAS: string[] = [];

export const FPS = 30;

// As fontes chegam pela folha do Google Fonts, e o render espera por elas.
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

/** Toda composição chama isto primeiro: sem marca, o vídeo não sai. */
export function exigeMarca(): void {
  if (!MARCA_CONFIGURADA) throw new Error("a marca não está configurada: rode /marca");
}
