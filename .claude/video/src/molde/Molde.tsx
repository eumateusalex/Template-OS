// O molde de uma peça Remotion: a menor composição que prova que o estúdio
// roda e mostra o caminho (a marca pelo marca.ts, a curva, a máscara do título,
// as faixas livres do Instagram). Não é exemplo de linguagem: a sua peça nasce
// copiando esta pasta para src/<sua-peca>/ e registrando no Root.tsx.
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

import { COR, FONTE, PESO, exigeMarca } from "../marca";

export const DURACAO = 90; // quadros, a 30 fps

// sai rápido, assenta devagar (regras-de-movimento.md, na skill /video)
const curva = Easing.bezier(0.2, 0.65, 0.2, 1);

export const Molde: React.FC = () => {
  exigeMarca();
  const quadro = useCurrentFrame();
  // o título sobe de dentro da própria máscara, sem fade
  const y = interpolate(quadro, [0, 18], [110, 0], {
    easing: curva,
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ backgroundColor: COR.clara }}>
      {/* Instagram cobre ~220 px em cima e ~380 px embaixo: o texto mora entre 240 e 1540 */}
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 240,
          width: 888,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            transform: `translateY(${y}%)`,
            fontFamily: FONTE.display,
            fontWeight: PESO.displayForte,
            fontSize: 78,
            lineHeight: 1.08,
            letterSpacing: "-0.035em",
            color: COR.principal,
          }}
        >
          A primeira frase da sua peça.
        </div>
      </div>
    </AbsoluteFill>
  );
};
