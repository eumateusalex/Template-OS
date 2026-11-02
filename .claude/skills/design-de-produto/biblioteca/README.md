# Biblioteca · o método de design de produto SaaS e de IA

> O método desmontado peça por peça: o sistema visual, os componentes, o jeito de pensar produto de
> IA, as telas, os produtos de referência, o texto dentro da tela, como apresentar o trabalho e como
> publicá-lo. Cada regra vem com a prova: a tela de referência, a medida no pixel ou a contagem.

## Como ler

Comece pelas **15 verdades** abaixo. Depois vá à seção que resolve o seu problema:

| Se você quer... | Abra |
|---|---|
| vender o trabalho: formato, preço, promessa e funil | [00 · Oferta e venda](00-oferta-e-venda/README.md) |
| as cores, fontes, espaços e raios exatos | [01 · Sistema visual](01-sistema-visual/README.md), começando por [design-system-publicado.md](01-sistema-visual/design-system-publicado.md) |
| montar uma tela e precisar da peça pronta | [02 · Componentes](02-componentes/README.md) (66 componentes) |
| desenhar um produto de IA no método | [03 · Padrões de IA](03-padroes-de-ia/README.md) e o [checklist](03-padroes-de-ia/checklist-produto-de-ia.md) |
| o esqueleto de um tipo de tela (dashboard, fila, detalhe, mobile, landing) | [04 · Tipos de tela](04-tipos-de-tela/README.md) |
| montar o "shot" (a imagem de apresentação) | [05 · Apresentação](05-apresentacao/README.md) e a [receita](05-apresentacao/receita-do-shot.md) |
| ver um produto inteiro como referência | [06 · Produtos](06-produtos/README.md) (50 fichas) |
| escrever o texto que vai dentro da tela | [07 · Microcopy](07-microcopy/README.md) e o [banco de 331 frases](07-microcopy/banco-de-frases.md) |
| publicar o trabalho e crescer com ele | [08 · Conteúdo e crescimento](08-conteudo-e-crescimento/README.md) |
| levar uma tela genérica ao padrão de produto | [09 · Do genérico ao produto](09-do-generico-ao-produto/README.md) |
| achar uma imagem pelo que ela mostra | [galeria/INDICE.md](galeria/INDICE.md) (1165 imagens) |

Nas imagens da galeria, o nome e a foto do usuário logado (a saudação, o bloco de conta, o avatar do
topo), os nomes e e-mails com cara de pessoa real e a assinatura de estúdio no rodapé dos templates
aparecem pixelados. O bloco pixelado é tarja,
não elemento de design: na tela que você desenha, ali vai o nome e o avatar do usuário do cenário, e o
texto cita a tela com `[nome]`.

**Legenda de confiança**, usada em todas as seções:
- **[CONFIRMADO]**: escrito na própria referência (legenda, folha do design system, texto do site).
- **[MEDIDO]**: amostrado no pixel ou contado nos dados.
- **[OBSERVADO]**: visto em N telas.
- **[INFERIDO]**: dedução sem prova direta.

## As 15 verdades do método

**Sistema**

1. **Tudo é variável.** Todo preenchimento, traço, padding e gap do arquivo ligado a variável,
   como manda a folha clara do design system de referência. As
   folhas do painel de licenciamento solar (33 tokens claros) e do painel de pagamentos de agentes (36 escuros) servem de argumento contra o
   produto feito com IA sem sistema.
   → [01](01-sistema-visual/design-system-publicado.md)
2. **Três fontes, cada uma com um papel.** Geist em título e número, Inter no corpo até 16 px,
   Geist Mono em ID, hora, unidade e dinheiro. → [01](01-sistema-visual/tipografia.md)
3. **Profundidade por troca de superfície, quase sem sombra.** A escada é canvas `#EFEEF4` >
   painel `#FFFFFF` > card `#F4F4F8`. *"Panels sit flat on the canvas."*
   → [01](01-sistema-visual/superficie-e-profundidade.md)
4. **O raio é decisão de produto.** No produto leve, 32/24/16 e pílula. No denso, 16 e 8-12. O raio
   interno desce 8 ou 12 por nível, às vezes repete, e nunca segue a fórmula concêntrica.
   → [01](01-sistema-visual/espacamento-e-raio.md)
5. **Estado tem três cores: 500, tint e 700.** O selo é o fundo tint com o texto em 700. No
   escuro, o fundo fica a 14% de alpha e a borda equivale a 40% da cor (a folha a marca
   sólida). O sólido fica só pro mais grave.
   → [02](02-componentes/selos-chips-e-botoes.md)
6. **Um acento por produto, e pouca cor.** A saturação média das imagens cai para um quinto do
   trabalho genérico ao de produto (0,27 para 0,058). Em 9 de 17 produtos, o botão principal é preto.
   → [01](01-sistema-visual/cor.md), [09](09-do-generico-ao-produto/README.md)

**Produto de IA**

7. **Autonomia com limite escrito.** A IA age sozinha até um limite escrito na tela e, passando
   dele, passa a decisão a um humano: no painel de agentes de operação, com nome ("Marina (Purchasing) joined the
   thread"); no [produto], para a fila "Waiting on you · 7 pending", sem nome de pessoa. "Autonomy
   with boundaries" é o texto de amostra da folha de tipografia do painel de pagamentos de agentes, não uma frase de
   método; quem mostra o método é a tela. No painel de pagamentos de agentes, de 892 pagamentos, 78% saem sozinhos, 15%
   vão pra aprovação e 7% são bloqueados pela regra. → [03](03-padroes-de-ia/06-autoridade-escalonamento-handoff.md)
8. **A IA não é chat, é colega com nome dentro do fluxo.** Exemplos: assistente de IA do licenciamento, "Ask
   app de frota", "app de despesas com IA proposes". O único chat solto da amostra (site de automação) rendeu abaixo do típico da
   semana e não voltou; não foi a pior peça do lote.
   → [03](03-padroes-de-ia/11-ia-embutida-no-vertical.md)
9. **Toda afirmação da IA vem com a régua ao lado.** Ela diz a confiança, se foi verificado,
   a idade do dado e o critério usado. E admite o que não sabe: "No signal yet".
   → [03](03-padroes-de-ia/03-confianca-explicita.md)
10. **A fila do humano vem com o recibo da máquina.** "12 decisions need you. App de despesas com IA cleared 148
    on its own today." → [03](03-padroes-de-ia/07-fila-de-revisao-e-recibo.md)

**Tela e texto**

11. **Uma tela, uma pergunta.** O título é frase do usuário ("We found your system", "Good
    morning, Sarah"), e o primeiro bloco responde a ela. → [04](04-tipos-de-tela/README.md)
12. **Dado realista sempre.** Nome de gente, endereço, ID em mono, hora exata, nada de lorem
    ipsum. Todo KPI tem uma linha de contexto, e o "·" organiza todo metadado (205 ocorrências).
    → [07](07-microcopy/README.md)
13. **O gráfico conta coisas reais.** O gauge do app de manutenção predial tem 28 peças para 28 pedidos. A
    hachura marca o vazio ou o "antes". → [02](02-componentes/graficos.md)

**Apresentação e publicação**

14. **Publique séries de produto, não telas soltas.** Cada série tem marca, logo e paleta e dura de
    1 a 3 semanas (a série longa, espalhada por meses, rende menos: painel de gestão de imóveis, 32 peças em sete meses). O
    shot é a tela plana sobre cinza liso, em 4:3 e 4096 px, e a imagem única é a base (78% das peças
    com imagem). Quando há sequência, ela é retrato: uma tela partida em duas metades 4:5 (díptico) ou
    três telas ou cartões inteiros em 4:5, não o zoom de um detalhe da primeira imagem.
    → [05](05-apresentacao/README.md), [06](06-produtos/README.md)
15. **Imagem com gancho vence texto e vence nome de produto.** Dentro da mesma série
    (painel de agentes hospitalares), as peças de legenda provocativa ou genérica se destacam e as que só dizem o
    nome do produto ficam atrás. O mesmo padrão aparece no app de manutenção predial e no painel de auditoria de agentes. O texto longo
    de opinião é o que menos anda. Constância diária, com respostas curtas a designers do nicho,
    sustenta o alcance.
    → [08](08-conteudo-e-crescimento/README.md)

**Duas ressalvas** (ver [08](08-conteudo-e-crescimento/README.md)): na 14, a imagem única deixa de
ser quase tudo, o díptico vira o formato de duas imagens e o vídeo de telas com cursor tende a ser a
peça que mais se destaca; na 15, quando o ritmo sobe muito, nomear o produto deixa de render menos.
Confira as duas no seu perfil.

## O material

**A base que vem com a skill** são as medições e conclusões escritas nesta biblioteca (amostras de
centenas de peças, citadas com o tamanho delas: "medido em 933 registros") e as imagens da galeria.
Não há material bruto da base: os números dela não se recalculam.

As imagens ficam em [`galeria/`](galeria/), separadas por seção, e o
[índice da galeria](galeria/INDICE.md) diz, para cada uma, o que ela mostra e quem a usa.

## Limites, ditos com todas as letras

- **Medidas em px de tela** dos shots de 4096 px usam o fator 2,5 (medido entre 2,4 e 2,6 em
  três produtos, com o método calibrado na folha do design system; ver
  [01 · Escala](01-sistema-visual/README.md#escala-dos-shots-de-4096-px)); os recortes em retrato
  e as folhas usam 3. Os raios pequenos podem errar até 4 px.
- **A folha do design system está cortada na imagem.** Faltam 9 tokens claros e o grupo
  vermelho do escuro. Os valores que faltam foram reconstruídos pela regra do trio e estão marcados
  [INFERIDO].
- **A fonte de alguns produtos** (painel de agentes hospitalares, app da clínica de estética, painel de agentes de operação) parece outra geométrica, não a
  Geist. Ficaram as candidatas.
- **A biblioteca de ícones:** o Hugeicons Pro (traço, arredondado) está confirmado por escrito; o
  Lucide do painel de agentes hospitalares foi deduzido pela forma.
- **Galeria de vitrine:** 30 peças lidas por inteiro; depois disso, a proteção anti-robô da
  plataforma bloqueou.
