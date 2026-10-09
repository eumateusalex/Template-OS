---
name: gsap
description: Roteador das skills do GSAP (core, timeline, ScrollTrigger, plugins, utils, React/Next, Vue/Svelte, performance). Use para animação em site ou interface com GSAP, animação no scroll, parallax, seção fixa, transição, texto ou SVG animado, ou quando citarem GSAP, ScrollTrigger ou useGSAP.
---

# GSAP · o roteador

As 8 skills do GSAP moram numa skill só: cada uma é um módulo em
`referencias/`, **sem edição**, e este arquivo diz qual abrir.

## Como usar

**Não leia os 8.** Identifique o que a tarefa pede na tabela abaixo e leia
apenas o(s) módulo(s) correspondente(s). A maioria das tarefas resolve com
`gsap-core` mais um módulo específico.

| Módulo | Arquivo | Quando abrir |
|---|---|---|
| `gsap-core` | `referencias/gsap-core.md` | Base de tudo: `gsap.to()`, `from()`, `fromTo()`, ease, duration, stagger, defaults, transforms, `autoAlpha`, `gsap.matchMedia()` (responsivo e `prefers-reduced-motion`) |
| `gsap-timeline` | `referencias/gsap-timeline.md` | Sequenciar vários passos: `gsap.timeline()`, position parameter, labels, aninhamento, controle de playback |
| `gsap-scrolltrigger` | `referencias/gsap-scrolltrigger.md` | Qualquer coisa ligada ao scroll: gatilho por posição, `pin`, `scrub`, parallax, `refresh`, cleanup |
| `gsap-plugins` | `referencias/gsap-plugins.md` | Plugins: Flip, Draggable, Observer, Inertia, ScrollSmoother, ScrollTo, SplitText, ScrambleText, DrawSVG, MorphSVG, MotionPath, CustomEase, CustomWiggle, CustomBounce, GSDevTools, `registerPlugin` |
| `gsap-utils` | `referencias/gsap-utils.md` | `gsap.utils`: clamp, mapRange, normalize, interpolate, random, snap, toArray, wrap, pipe |
| `gsap-react` | `referencias/gsap-react.md` | React e Next.js: hook `useGSAP`, refs, `gsap.context()`, cleanup no unmount, SSR |
| `gsap-frameworks` | `referencias/gsap-frameworks.md` | Vue, Nuxt, Svelte, SvelteKit: lifecycle, escopo de seletor, cleanup |
| `gsap-performance` | `referencias/gsap-performance.md` | Otimizar: 60fps, jank, layout thrashing, `will-change`, batching |

`referencias/_indice-oficial.txt` é o índice das skills, com a lista completa
de palavras-gatilho de cada módulo. Consulte quando a tabela acima não deixar
claro qual abrir.

## Referências cruzadas dentro dos módulos

Os módulos citam uns aos outros pelo nome de skill (ex.: "for React use
**gsap-react**"). Aqui esses nomes **não são skills**, são arquivos: traduza
`<nome>` para `referencias/<nome>.md` usando a tabela acima.

## Contexto deste workspace

Regras do workspace que valem quando a animação for para uma peça da sua marca:

- **Movimento a serviço da peça.** Animação conduz o olho, não chama atenção
  para si: duração curta, ease discreto, um movimento por elemento, a não ser
  que a sua marca peça outra coisa (`identidade/design-guide.md`).
- **`prefers-reduced-motion` não é opcional.** Envolver as animações em
  `gsap.matchMedia()` e entregar o estado final sem movimento para quem
  desativou animação. O padrão está em `gsap-core`.
- **Landing page é a entrega mais forte.** É onde esta skill costuma entrar.
  Antes de decidir o visual, `identidade/design-guide.md`; o movimento vem
  depois da peça estar certa parada.
- Em `clientes/<nome>/`, quem manda é o `CLAUDE.md` do cliente — as regras
  acima são da sua marca, e não se aplicam automaticamente lá.

## Instalar o GSAP no projeto

Tudo vem do pacote público, plugins inclusive (SplitText, MorphSVG, DrawSVG e
os demais): `npm install gsap`. **Não** existe token de autenticação, `.npmrc`
privado nem registry restrito; se algum código ou tutorial pedir isso, está
desatualizado.

## Como esta pasta chega

O `node scripts/terceiros/instalar.mjs --so gsap` a monta: os 8 módulos e o
índice vêm da fonte, na versão que o `scripts/terceiros/manifesto.json` fixa, e
este roteador sai de `scripts/terceiros/moldes/gsap/SKILL.md`. Mudança neste
arquivo se faz no molde, nunca aqui: a próxima instalação reescreve a pasta.
Trocar de versão segue o `scripts/terceiros/README.md`.
