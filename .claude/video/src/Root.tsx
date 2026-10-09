import "./index.css";
import { Composition } from "remotion";

import { FPS } from "./marca";
import { DURACAO as MOLDE_DUR, Molde } from "./molde/Molde";

const REEL = { fps: FPS, width: 1080, height: 1920 } as const;

// Uma pasta por peça em src/<peca>/, registrada aqui. Nunca um projeto Remotion
// novo: o node_modules é um só, o deste estúdio.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* O molde: prova que o estúdio roda (npm run still -- Molde previa/molde.png)
          e é o ponto de partida da primeira peça. Pode sair quando houver outra. */}
      <Composition
        id="Molde"
        component={Molde}
        durationInFrames={MOLDE_DUR}
        {...REEL}
      />
    </>
  );
};
