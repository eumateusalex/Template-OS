"use client";

// Modelo do modo vídeo da /clonar-site: as peças de movimento que uma landing de
// conceito costuma ter. Copiar para components/movimento.tsx do projeto e
// ajustar a CURVA, as durações e os atrasos ao que o vídeo mostra.
// Texto que entra palavra por palavra saindo do borrão (Palavras), cartão que
// cresce de baixo para cima (Cresce), entrada simples (Surge), número que sobe
// (useContagem + Numero) e trilho em laço que para fora da tela (Trilho).
// Precisa do pacote motion e, no globals.css, da animação marquee:
//   @theme { --animate-marquee: marquee 30s linear infinite;
//     @keyframes marquee { from { transform: translateX(0) }
//       to { transform: translateX(calc(-100% - var(--vao, 1rem))) } } }

import {
  animate,
  motion,
  MotionConfig,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

export const CURVA = [0.22, 1, 0.36, 1] as const;

export function cn(...partes: (string | false | null | undefined)[]) {
  return partes.filter(Boolean).join(" ");
}

export function Movimento({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

type Parte = { t: string; c?: string };

const etiquetas = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  span: motion.span,
  div: motion.div,
} as const;

type PalavrasProps = {
  texto: string | Parte[];
  como?: keyof typeof etiquetas;
  className?: string;
  atraso?: number;
  passo?: number;
  // true: anima ao montar (o hero); false: anima ao entrar na tela
  aoMontar?: boolean;
  // a quebra de linha do texto ("\n") só vale a partir do desktop
  quebra?: boolean;
};

export function Palavras({
  texto,
  como = "p",
  className,
  atraso = 0,
  passo = 0.06,
  aoMontar = false,
  quebra = true,
}: PalavrasProps) {
  const Etiqueta = etiquetas[como];
  const partes: Parte[] = typeof texto === "string" ? [{ t: texto }] : texto;
  const inteiro = partes.map((p) => p.t).join("").replace(/\n/g, " ");

  // linhas → palavras, cada palavra com a classe da parte de onde veio
  const linhas: { palavra: string; c?: string }[][] = [[]];
  for (const parte of partes) {
    parte.t.split("\n").forEach((trecho, i) => {
      if (i > 0) linhas.push([]);
      for (const palavra of trecho.split(" ")) {
        if (palavra) linhas[linhas.length - 1].push({ palavra, c: parte.c });
      }
    });
  }

  return (
    <Etiqueta
      className={className}
      aria-label={inteiro}
      initial="some"
      {...(aoMontar
        ? { animate: "aparece" }
        : { whileInView: "aparece", viewport: { once: true, amount: 0.5 } })}
      variants={{
        some: {},
        aparece: { transition: { staggerChildren: passo, delayChildren: atraso } },
      }}
    >
      {linhas.map((linha, i) => (
        <span key={i} aria-hidden className={quebra ? "lg:block" : undefined}>
          {linha.map(({ palavra, c }, j) => (
            <motion.span
              key={j}
              className={cn("inline-block whitespace-pre", c)}
              variants={{
                some: { opacity: 0, filter: "blur(10px)" },
                aparece: {
                  opacity: 1,
                  filter: "blur(0px)",
                  transition: { duration: 0.7, ease: CURVA },
                },
              }}
            >
              {palavra + " "}
            </motion.span>
          ))}
        </span>
      ))}
    </Etiqueta>
  );
}

type CresceProps = {
  children: ReactNode;
  className?: string;
  atraso?: number;
  raio?: string;
  aoMontar?: boolean;
  // quanto do cartão começa escondido, de 0 a 100
  corte?: number;
};

// O cartão nasce baixo e curto e cresce para cima até o tamanho final.
export function Cresce({
  children,
  className,
  atraso = 0,
  raio = "1.75rem",
  aoMontar = false,
  corte = 70,
}: CresceProps) {
  const fim = { clipPath: `inset(0% 0% 0% 0% round ${raio})`, y: 0, opacity: 1 };
  return (
    <motion.div
      className={className}
      initial={{ clipPath: `inset(${corte}% 0% 0% 0% round ${raio})`, y: 40, opacity: 0 }}
      {...(aoMontar
        ? { animate: fim }
        : { whileInView: fim, viewport: { once: true, amount: 0.2 } })}
      transition={{
        duration: 0.9,
        delay: atraso,
        ease: CURVA,
        opacity: { duration: 0.25, delay: atraso },
      }}
    >
      {children}
    </motion.div>
  );
}

type SurgeProps = {
  children: ReactNode;
  className?: string;
  atraso?: number;
  aoMontar?: boolean;
  de?: { x?: number; y?: number; scale?: number };
};

export function Surge({ children, className, atraso = 0, aoMontar = false, de = { y: 14 } }: SurgeProps) {
  const fim = { opacity: 1, x: 0, y: 0, scale: 1 };
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...de }}
      {...(aoMontar
        ? { animate: fim }
        : { whileInView: fim, viewport: { once: true, amount: 0.4 } })}
      transition={{ duration: 0.7, delay: atraso, ease: CURVA }}
    >
      {children}
    </motion.div>
  );
}

// O número sobe de `de` até `ate` quando entra na tela. Devolve o valor vivo,
// para o trilho da calculadora andar junto com ele.
export function useContagem(ate: number, { de = 0, duracao = 1.8, atraso = 0 } = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const valor = useMotionValue(de);
  const naTela = useInView(ref, { once: true, amount: 0.6 });
  const semMovimento = useReducedMotion();

  useEffect(() => {
    if (!naTela) return;
    if (semMovimento) {
      valor.set(ate);
      return;
    }
    const controle = animate(valor, ate, { duration: duracao, delay: atraso, ease: CURVA });
    return () => controle.stop();
  }, [naTela, semMovimento, valor, ate, duracao, atraso]);

  return { ref, valor, naTela };
}

export function Numero({ valor, prefixo = "$", className }: { valor: MotionValue<number>; prefixo?: string; className?: string }) {
  const texto = useTransform(valor, (v) => prefixo + v.toFixed(2));
  return <motion.span className={className}>{texto}</motion.span>;
}

type TrilhoProps = {
  children: ReactNode;
  className?: string;
  aoContrario?: boolean;
  repete?: number;
  // segundos de uma volta
  duracao?: number;
  vao?: string;
};

export function Trilho({ children, className, aoContrario = false, repete = 4, duracao = 30, vao = "1rem" }: TrilhoProps) {
  // fora da tela o trilho para: animação que ninguém vê não gasta quadro
  const ref = useRef<HTMLDivElement>(null);
  const naTela = useInView(ref, { margin: "120px" });
  return (
    <div
      ref={ref}
      className={cn("flex overflow-hidden", className)}
      style={{ gap: vao, ["--vao" as string]: vao }}
    >
      {Array.from({ length: repete }, (_, i) => (
        <div
          key={i}
          aria-hidden={i > 0}
          className={cn("trilho flex shrink-0 items-center animate-marquee", aoContrario && "[animation-direction:reverse]")}
          style={{
            gap: vao,
            animationDuration: `${duracao}s`,
            ...(naTela ? null : { animationPlayState: "paused" }),
          }}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
