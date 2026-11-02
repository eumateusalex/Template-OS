# Landing page / site de marketing

## O que é

Sites de marketing mostrados no formato **nome do site, página inteira e a pergunta
do que acharam**: a página inteira cortada em duas colunas lado a lado dentro de uma
moldura de tela arredondada, sobre fundo da cor da marca. São templates de site
(rodapé com a assinatura de quem fez e "Powered by Webflow"). Os cinco de referência:
Site de consultoria, site de gestão de vendas, site de evento, site de vendas, site de energia solar.

![](../galeria/05-apresentacao/shot-full-page.jpg)

## Anatomia: a ordem das seções

Ordem medida nas 5 páginas completas **[OBSERVADO]**:

| # | Seção | Site de consultoria | Site de energia solar | Site de evento | Site de gestão de vendas | Site de vendas |
|---|---|---|---|---|---|---|
| 1 | Nav | links esq. + logo centro + links e botão preto dir. | pílula translúcida sobre a foto | logo esq., links centro, "Contact us" + círculo ↗ | pílula escura translúcida | logo, links, botão contorno |
| 2 | Hero | texto esq. + retrato recortado dir. sobre amarelo | foto full-bleed, título branco embaixo à esq. | "CONNECT. INSPIRE. TRANSFORM." + foto em máscara de forma + selo-estrela | título centralizado + mockup do produto com luz por baixo | título centralizado + 2 cartões de número flutuando inclinados |
| 3 | Prova logo após o hero | foto full-width com frase sobreposta | cartão "2.3M+" com avatares no próprio hero | foto de plateia full-width | faixa "Trusted by" com 6 logos | faixa "Trusted by Results-Driven Teams" |
| 4 | Quem somos | "● WHO WE ARE" + parágrafo grande de 5 linhas + avatares | "ABOUT [produto]" + parágrafo grande centralizado, metade em cinza | "Event overview" + parágrafo centralizado | (não tem) | (não tem) |
| 5 | Serviços / features | 2×2 cartões, o 1º em amarelo | 4 cartões em linha | ingresso com contagem regressiva | features alternando texto e imagem | 4 cartões + laptop no centro |
| 6 | Prova de resultado | número "5+ Years of experience" sobre foto escura | "Our impact by the numbers" | speakers em linhas | "Real Results, Real Clients" | "What you can do" |
| 7 | Depoimento | 1 cartão foto + citação, setas ‹ › | carrossel de 6 cartões | galeria em formas | 1 cartão foto + citação | carrossel de 6 cartões |
| 8 | Conteúdo | Blog, 3 cartões | FAQ em acordeão | Blog, 3 cartões pretos | Integrações em hub radial | Dashboard preview |
| 9 | CTA final | faixa amarela com 2 retratos nas laterais | bloco preto "Ready to harness the power of the sun?" | "Our proud partners" (grade de logos) | faixa índigo com feixe de luz | (dentro do footer) |
| 10 | Footer | logo, redes, 3 colunas de links, **wordmark gigante cortado** | preto com **wordmark "[produto]" gigante em lime** | preto com **"[produto] 2025" gigante em degradê** | logo, redes, 3 colunas | logo, redes, 3 colunas |

Padrão: **hero → prova imediata → quem somos → o que fazemos → prova → depoimento
→ conteúdo → CTA → footer com wordmark gigante**. O wordmark que sangra no pé da
página aparece em site de consultoria, site de energia solar, site de evento e site de agência. **[OBSERVADO]**

## Hero

| Medida (site de consultoria, tela 1440) | Valor | Como medi |
|---|---|---|
| Altura do hero | ≈720 px | 444 px de 886 px de moldura na imagem reduzida |
| Título | 3 linhas, corpo ≈74 px, entrelinha ≈80 px (≈1,08) | linhas de texto em 544-611, 649-736, 750-821 px na imagem de 3.882 px, fator 1,26 **[MEDIDO]** |
| Subtítulo | 3 linhas de ≈14 px, cinza escuro, largura ≈400 px | **[OBSERVADO]** |
| Botão | contorno fino, raio ≈6 px, "Get Started" | **[OBSERVADO]** |

Tipos de hero:

1. **Texto à esquerda + retrato recortado à direita** sobre cor chapada (site de consultoria,
   site de coach, portfólio pessoal).
2. **Foto de paisagem full-bleed** com título branco no canto inferior esquerdo e
   um cartão de prova no canto inferior direito (site de energia solar, site de transporte marítimo, site de energia limpa).
3. **Centralizado com mockup do produto** abaixo do título, iluminado por baixo
   (site de gestão de vendas, site de chatbot de IA, site de agente de IA, site de geração de imagem, site de vendas, site de RH, site de gestão de projetos).
4. **Tipográfico condensado** com foto em máscara e selo em estrela (site de evento).

![hero](../galeria/04-tipos-de-tela/hero-serifa.jpg)
![hero](../galeria/04-tipos-de-tela/hero-serifa-2.jpg)

## A serifa itálica misturada

Em 2 de cada 3 sites o título mistura **grotesca romana** com **uma
ou duas palavras em serifa itálica**, sempre a palavra de valor:

| Site | Título |
|---|---|
| Site de consultoria | "Lead with *strategy*, scale with *confidence*." / "Your growth *partner*" / "What our *clients say*" / "Tailored solutions, *measurable impact*" |
| Site de gestão de vendas | "Easy way to manage *your business*" / "Explore our amazing *features*" / "Real Results, Real *Clients*" / "Connect with your *favorite tools*" / "Ready to take control of *your sales*" |
| Site de finanças de startup | "Simple, transparent pricing for *every bu[siness]*" / "The story behind our *company*" / "Powerful finance features. all in *one place*." |
| Site de chatbot de IA | "Talk smarter. Scale *faster*." / "Smart features. Smarter *conversa[tions]*" |
| Site de geração de imagem | "Turn words into stunning images *in seconds*" |
| Site de coach | "helping people unlock *clarity and growth*." |

Regras **[OBSERVADO]**:
- A itálica vem **na segunda metade da frase**, nunca na primeira palavra.
- Mesmo corpo e mesma cor da romana; a serifa parece um pouco menor no olho
  porque tem altura-x menor.
- Só em títulos de seção e hero. Nunca em botão, nav ou corpo.
- **Nunca dentro do produto** (dashboards usam só grotesca).

Fonte: **não dá para afirmar**. Candidatas: *Instrument Serif Italic* e *PP
Editorial New Italic*. O traço que decidiria é o "g" e a terminação do "y" em
"strategy", que no recorte disponível não têm resolução suficiente. Na romana,
grotesca neutra (candidatas Geist, Inter; a tipografia dos produtos está em
[../01-sistema-visual/tipografia.md](../01-sistema-visual/tipografia.md)).

Site de evento é a exceção: condensada em caixa alta (candidatas Oswald, Bebas Neue) +
grotesca redonda no corpo, sem serifa.

## Prova social

- **Faixa de logos** logo abaixo do hero, 6 logos fictícios **sempre os mesmos**
  entre sites: vision, Greenish, Glossy, Ebooks, Proline, Flash (site de vendas, site de gestão de vendas,
  site de evento). **[OBSERVADO]** É um kit de logos de template; troque por logos reais
  quando houver.
- **Depoimento** em dois formatos: (a) um cartão por vez com foto grande à
  esquerda, citação à direita, "[produto] · 1/5" e setas ‹ › (site de consultoria, site de gestão de vendas);
  (b) carrossel horizontal de 5-6 cartões com aspas grandes cinza e avatar no
  canto (site de energia solar, site de vendas).
- **Número em cartão** com avatares empilhados ("2.3M+ Eco-friendly solar
  solutions", "5+ Years of experience").

## Rótulo de seção

Pílula ou ponto antes do título em caixa alta pequena: "● WHO WE ARE",
"● TESTIMONIAL" (site de consultoria, site de gestão de vendas), pílula de borda "ABOUT [produto]", "OUR FEATURES"
(site de energia solar), pílula azul inclinada "Speakers", "Gallery" (site de evento).

## Quando usar

Para mostrar site de marketing, não tela de produto. Na vitrine, a página inteira
vem primeiro; depois o site aparece em mockup de laptop/iPad em perspectiva e em
recortes (hero, pricing, footer). Quando o trabalho vira produto, as séries de
produto tomam o lugar dos sites. **[OBSERVADO]** ver
[../06-produtos/outros-produtos.md](../06-produtos/outros-produtos.md) e
[../09-do-generico-ao-produto/README.md](../09-do-generico-ao-produto/README.md).

## Exemplos

![](../galeria/04-tipos-de-tela/landing-tela-2.jpg)
![](../galeria/04-tipos-de-tela/landing-tela-3.jpg)
![](../galeria/04-tipos-de-tela/landing-tela-5.jpg)
![](../galeria/04-tipos-de-tela/landing-tela.jpg)
![](../galeria/04-tipos-de-tela/landing-tela-4.jpg)
![](../galeria/04-tipos-de-tela/landing-tela-6.jpg)

## Como reproduzir

```css
.hero h1 { font: 400 74px/80px "Geist", sans-serif; letter-spacing: -0.02em; }
.hero h1 em { font-family: "Instrument Serif", serif; font-style: italic; letter-spacing: 0; }
.section-label { font: 500 11px/1 "Geist"; text-transform: uppercase; letter-spacing: .06em; }
.section-label::before { content: "●"; margin-right: 6px; }
.footer-wordmark { font-size: 22vw; line-height: .8; margin-bottom: -4vw; overflow: hidden; }
```

Ordem mínima: nav, hero com uma palavra itálica, faixa de 6 logos, parágrafo "quem
somos" grande, 4 cartões de serviço (1 na cor da marca), depoimento, CTA na cor da
marca, footer com wordmark gigante.
