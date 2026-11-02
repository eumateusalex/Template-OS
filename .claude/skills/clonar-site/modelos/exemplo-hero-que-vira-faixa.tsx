"use client";

// EXEMPLO, não peça genérica: o hero de uma landing de suporte com IA (corte de
// 1682 px), fechado na régua do modo vídeo. Serve para ler COMO se constrói um
// elemento que atravessa duas seções: os imports e as medidas são daquela
// landing. O que levar daqui:
//  - um componente só, com o progresso da rolagem (0 a 1) dirigindo tudo;
//  - o cartão NÃO muda de altura (seria layout a cada quadro): desce por transform
//    e é cortado por clip-path, que dá o mesmo desenho e passa no motionscore;
//  - o que some leva `visibility: hidden` no estado apagado (senão o botão
//    invisível recebe foco, e o confere-pagina reprova como texto preso);
//  - o estilo leva SEMPRE as mesmas chaves: tirar uma deixa o último valor preso;
//  - no celular a transição se desliga (matchMedia) e o hero é um cartão parado.
// No vídeo de origem essa transição é por TEMPO; aqui ficou ligada à rolagem, e
// isso foi declarado como diferença.

// O hero e a faixa: o mesmo cartão. Ao rolar, ele fica parado no topo e encolhe pela base
// (de 73,06rem para 26,56rem, em 46,5rem de rolagem), a grama e o painel ficam onde estão,
// se apagam e são cortados pela base (no vídeo o céu fica preso no topo e nada sobe), o título do hero se apaga e o título da faixa acende no lugar.
// O cartão não muda de altura (seria layout a cada quadro): ele desce junto com a rolagem
// (transform) e é cortado por baixo (clip-path), o que dá o mesmo desenho.

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { hero, marca, recursos } from "@/lib/conteudo";
import { CURVA, cn } from "../movimento";
import { BotaoEscuro, Carregando, Confere, Icone, Marca } from "../pecas";

const CHEIO = 73.0625; // rem: altura do hero no quadro de 2,5 s (1169px a 1682px)
const FAIXA = 26.5625; // rem: altura da faixa no quadro de 6,667 s (425px)

export function Hero() {
  const { scrollY } = useScroll();
  const remPx = useRef(16);
  const parado = useReducedMotion();
  // com movimento reduzido a faixa só acende: sem borrão e sem subir. O estilo leva sempre as
  // três chaves: tirar uma chave do style deixa o último valor dela preso no elemento.
  const paradoRef = useRef(false);
  paradoRef.current = !!parado;
  // o cartão que encolhe é do desktop; no celular o hero é um cartão parado
  const [desktop, setDesktop] = useState(true);
  useEffect(() => {
    const mede = () => {
      remPx.current = parseFloat(getComputedStyle(document.documentElement).fontSize);
      setDesktop(matchMedia("(min-width: 1024px)").matches);
    };
    mede();
    addEventListener("resize", mede);
    return () => removeEventListener("resize", mede);
  }, []);
  const desktopRef = useRef(true);
  desktopRef.current = desktop;
  const p = useTransform(scrollY, (v) => (desktopRef.current ? Math.min(1, Math.max(0, v / ((CHEIO - FAIXA) * remPx.current))) : 0));
  const desce = useTransform(p, (v) => v * (CHEIO - FAIXA) * remPx.current);
  const corte = useTransform(desce, (d) => `inset(0px 0px ${d.toFixed(1)}px 0px round 2.5rem)`);
  const someHero = useTransform(p, [0, 0.3], [1, 0]);
  const borraHero = useTransform(p, [0, 0.3], ["blur(0px)", "blur(8px)"]);
  const someBase = useTransform(p, [0, 0.3], [1, 0]);
  const acendeFaixa = useTransform(p, [0.72, 1], [0, 1]);
  // o que se apagou sai de verdade (visibility): invisível não pode ficar clicável nem no leitor de tela
  const escondeHero = useTransform(p, (v) => (v >= 0.3 ? "hidden" : "visible"));
  const escondeBase = useTransform(p, (v) => (v >= 0.3 ? "hidden" : "visible"));
  const escondeFaixa = useTransform(p, (v) => (v <= 0.72 ? "hidden" : "visible"));
  const borraFaixa = useTransform(p, (v) => (paradoRef.current ? "blur(0px)" : `blur(${(10 * (1 - Math.min(1, Math.max(0, (v - 0.72) / 0.28)))).toFixed(2)}px)`));
  const sobeFaixa = useTransform(p, (v) => (paradoRef.current ? 0 : 14 * (1 - Math.min(1, Math.max(0, (v - 0.72) / 0.28)))));

  return (
    <div className="relative max-lg:!h-[41rem]" style={{ height: `${CHEIO}rem` }}>
      <motion.div className="h-full" style={{ y: desce, clipPath: corte }}>
      <motion.header
        className="relative h-full overflow-hidden rounded-[2.5rem] bg-ceu max-lg:rounded-[1.75rem]"
        initial={{ clipPath: "inset(0% 0% 100% 0% round 2.5rem)" }}
        animate={{ clipPath: "inset(0% 0% 0% 0% round 2.5rem)" }}
        transition={{ duration: 0.7, ease: CURVA }}
      >
        {/* o céu fica preso no topo do cartão: a faixa mostra o alto da mesma foto */}
        <img src={hero.fotoCeu} alt="" className="pointer-events-none absolute inset-x-0 top-0 h-[73.0625rem] w-full object-cover object-top max-lg:h-full" />

        <Navegacao />

        {/* conteúdo do hero, que se apaga ao rolar */}
        <motion.div className="absolute inset-x-0 top-0" style={{ opacity: someHero, filter: borraHero, visibility: escondeHero }}>
          <motion.div
            className="absolute left-1/2 top-[12.9375rem] -translate-x-1/2 max-lg:top-[6.5rem]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: CURVA }}
          >
            <Selo />
          </motion.div>
          <h1 className="serifa absolute inset-x-0 top-[17.125rem] -translate-x-[1.0625rem] text-center text-[5.72rem] font-medium leading-[5.8125rem] text-tinta max-lg:top-[9.75rem] max-lg:translate-x-0 max-lg:px-4 max-lg:text-[2.25rem] max-lg:leading-[2.4rem]" aria-label={hero.titulo.join(" ")}>
            {hero.titulo.map((linha, i) => (
              <motion.span
                key={linha}
                aria-hidden
                className="block"
                initial={{ opacity: 0, filter: "blur(12px)", y: 10 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 + i * 0.2, ease: CURVA }}
              >
                {linha}
              </motion.span>
            ))}
          </h1>
          <motion.div
            className="absolute left-1/2 top-[36.25rem] -translate-x-1/2 max-lg:top-[19.5rem]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.4, ease: CURVA }}
          >
            <BotaoEscuro className="h-[4.25rem] w-[10.625rem]">{hero.botao}</BotaoEscuro>
          </motion.div>
        </motion.div>

        {/* a base (painel e grama) se apaga no lugar e é cortada pela borda de baixo do cartão */}
        <motion.div className="pointer-events-none absolute inset-x-0 bottom-0 h-[73.0625rem] max-lg:h-full" style={{ opacity: someBase, visibility: escondeBase }}>
          <motion.div
            className="absolute left-1/2 top-[45.9375rem] -ml-[25.3125rem] max-lg:top-[26.5rem] max-lg:origin-top max-lg:scale-[0.42]"
            initial={{ opacity: 0, y: 90 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.8, ease: CURVA, opacity: { duration: 0.4, delay: 0.8 } }}
          >
            <Painel />
          </motion.div>
          <img src={hero.fotoGrama} alt="" className="absolute inset-x-0 bottom-0 w-full max-lg:h-[7rem] max-lg:object-cover max-lg:object-right-top" />
        </motion.div>

        {/* título da faixa, que acende quando o cartão termina de encolher */}
        <motion.h2
          className="serifa absolute inset-x-0 top-[12.25rem] text-center text-[3.92rem] font-medium leading-[3.75rem] text-tinta max-lg:hidden"
          style={{ opacity: acendeFaixa, filter: borraFaixa, y: sobeFaixa, visibility: escondeFaixa }}
        >
          {recursos.titulo.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </motion.h2>
      </motion.header>
      </motion.div>
    </div>
  );
}

function Navegacao() {
  return (
    <motion.nav
      className="absolute inset-x-0 top-0 z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      aria-label="Principal"
    >
      <a href="#" className="absolute left-[3.1875rem] top-[3.0625rem] max-lg:left-[1.25rem] max-lg:top-[1.5rem] max-lg:origin-left max-lg:scale-90" aria-label={marca.nome}>
        <Marca nome={marca.nome} />
      </a>
      <ul className="absolute left-1/2 top-[1.875rem] flex h-[4.1875rem] -translate-x-1/2 items-center gap-[0.3125rem] rounded-[1rem] bg-white px-[0.375rem] max-lg:hidden">
        {marca.links.map((l, i) => (
          <li key={l.rotulo}>
            <a
              href={l.href}
              aria-label={l.rotulo}
              className={cn(
                "grid size-[3.375rem] place-items-center rounded-[0.75rem] transition-colors",
                i === 0 ? "bg-botao text-white" : i === marca.links.length - 1 ? "bg-claro text-tinta" : "text-tinta hover:bg-claro",
              )}
            >
              <Icone nome={l.icone} className="size-[1.4375rem]" />
            </a>
          </li>
        ))}
      </ul>
      <a
        href="#"
        className="absolute right-[2.8125rem] top-[2.1875rem] grid h-[3.5rem] w-[9.125rem] place-items-center rounded-[0.5rem] bg-white text-[0.861rem] text-tinta transition-colors hover:bg-claro max-lg:right-[1rem] max-lg:top-[1rem] max-lg:h-[2.75rem] max-lg:w-[8rem]"
      >
        {marca.chamada}
      </a>
    </motion.nav>
  );
}

function Selo() {
  return (
    <span className="flex h-[2.125rem] w-[9.875rem] items-center justify-center gap-[0.5rem] rounded-[0.25rem] bg-white text-[0.742rem] text-tinta">
      {hero.selo.antes}
      <span className="flex items-center gap-[0.3rem]">
        <span className="grid size-[0.95rem] place-items-center bg-[#1B2238] text-[0.6rem] leading-none text-white">Y</span>
        <span className="font-mono text-[0.72rem] tracking-normal text-[#3a3a3a]">{hero.selo.marca}</span>
      </span>
    </span>
  );
}

const tons = { verde: "text-verde", tinta: "text-tinta", vinho: "text-vinho" } as const;

function Painel() {
  const d = hero.painel;
  return (
    <div className="relative h-[22rem] w-[50.125rem] rounded-[1.75rem] bg-[#F4F5F5]/95 shadow-[0_0_0_1px_rgba(255,255,255,.5)]">
      <div className="absolute left-[1.9375rem] top-[1.8125rem] flex h-[3rem] w-[10.5625rem] items-center gap-[0.5rem] rounded-full bg-white pl-[0.5625rem]">
        <img src={d.espaco.foto} alt="" className="size-[1.875rem] rounded-full" />
        <span className="leading-tight">
          <span className="block text-[0.69rem] font-semibold">{d.espaco.nome}</span>
          <span className="block text-[0.62rem] text-apagado">{d.espaco.sub}</span>
        </span>
      </div>
      <div className="absolute right-[3.1875rem] top-[3rem] flex items-center gap-[0.5rem] text-[1.8rem] leading-none">
        <span>
          <span className="text-cinza">{d.quadro.rotulo}</span>
          {d.quadro.nome}
        </span>
        <span className="grid size-[0.85rem] place-items-center rounded-full border border-tinta text-[0.5rem]">+</span>
      </div>

      <div className="absolute left-[2rem] top-[7.125rem] h-[7.125rem] w-[17.1875rem] rounded-[0.875rem] bg-white">
        <span className="absolute left-[0.75rem] top-[0.75rem] text-[0.875rem] text-cinza">{d.leads.titulo}</span>
        <span className="absolute right-[0.75rem] top-[0.75rem] text-[0.875rem] text-cinza">{d.leads.total}</span>
        {d.leads.numeros.map((n, i) => (
          <span key={n.rotulo} className={cn("absolute top-[3.49rem] leading-none", tons[n.tom])} style={{ left: `${[0.875, 6.8, 11.9][i]}rem` }}>
            <span className="block text-[2.25rem]">{n.valor}</span>
            <span className="block pt-[0.03rem] text-[0.66rem]">{n.rotulo}</span>
          </span>
        ))}
      </div>
      <div className="absolute left-[2rem] top-[14.625rem] h-[7.5rem] w-[17.1875rem] rounded-[0.875rem] bg-white">
        <span className="absolute left-[0.75rem] top-[0.75rem] text-[0.875rem] text-cinza">{d.clientes.titulo}</span>
        <span className="absolute right-[0.75rem] top-[0.75rem] text-[0.875rem] text-cinza">{d.clientes.total}</span>
        <span className="absolute left-[0.75rem] top-[4.1rem] text-[2.15rem] font-light leading-none text-verde">{d.clientes.valor}</span>
      </div>

      <div className="absolute left-[20.25rem] top-[7.125rem] flex h-[14rem] w-[4.1875rem] flex-col items-center gap-[0.875rem] rounded-[0.875rem] bg-white pt-[1.25rem]">
        {d.avatares.map((a) => (
          <img key={a} src={a} alt="" className="size-[1.875rem] rounded-full" />
        ))}
      </div>

      <div className="absolute left-[25.1875rem] top-[7.125rem] h-[14rem] w-[21.8125rem] rounded-[0.875rem] bg-white">
        <div className="absolute left-[1rem] top-[1.125rem] h-[3.375rem] w-[19.5625rem] rounded-[0.625rem] bg-[#F6F6F6] px-[0.75rem] pt-[0.36rem] text-[0.74rem]">
          <span className="font-semibold">{d.conversa.nome}</span> <span className="pl-[0.45rem] text-[0.55rem] text-ticket">{d.conversa.ticket}</span>
          <Icone nome="messenger" className="absolute right-[0.75rem] top-[0.6rem] size-[0.85rem]" />
          <span className="mt-[0.19rem] block text-texto">{d.conversa.mensagem}</span>
        </div>
        <span className="absolute right-[1.375rem] top-[5.3rem] flex items-center gap-[0.25rem] rounded-full bg-white px-[0.5rem] py-[0.2rem] text-[0.6rem] text-verde shadow-[0_0_0_1px_#f0f0f0]">
          <Carregando className="size-[0.6rem]" />
          {d.conversa.acao}
        </span>
        <span className="absolute left-[4.9rem] top-[7.6rem] flex items-center gap-[0.25rem] text-[0.74rem] text-apagado">
          {d.conversa.resposta} <Confere className="size-[0.7rem]" />
        </span>
      </div>
    </div>
  );
}
