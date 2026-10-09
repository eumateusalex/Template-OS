# 05 · Como apresentar o trabalho (o "shot")

O quadro em volta da interface: proporção, fundo, ar, moldura, mockup, quantas imagens por peça e como se encaixam, e como animar. É o que transforma uma tela de produto numa peça que para o polegar no feed. A interface em si (cor, tipo, componentes) está nas outras seções; aqui está a embalagem.

## Base

- 900 imagens e 24 vídeos de peças publicadas, medidos um a um (o material bruto não acompanha a skill; os tamanhos e as medidas ficam aqui).
- Medições em Python sobre o pixel original: cor e uniformidade das quatro bordas, caixa do conteúdo (margem), ajuste de círculo no canto (raio), queda de luminância fora da moldura (sombra), e diferença entre quadros a 10 por segundo nos vídeos.
- Conferência visual de folhas de miniaturas por tipo e dos originais em tamanho real.
- Desempenho pelo **índice relativo** (views ou salvos da peça divididos pela mediana das peças com mídia do mesmo perfil nos 7 dias em volta), explicado em `../08-conteudo-e-crescimento/README.md`.

## O shot em uma frase

**Uma tela de produto em 4:3, sobre cinza liso (`#DDDDDD` a `#EEEEEE`), com ~5% de ar nos lados, a casca do app mais clara que o fundo e com raio grande, sem sombra, sem cena, sem texto por cima; e, quando a peça tem mais de uma imagem, a mesma lógica em retrato (4:5) partida em duas ou três imagens.**

![shot típico](../galeria/05-apresentacao/shot-4x3-cinza-cartao-inteiro-fixtrack.jpg)

## As 10 descobertas

1. **4:3 é o padrão.** 75% das imagens da fase de transição e 54% das de produto. Tamanhos: 4096×3072 (o shot ampliado) e 1200×900, 1600×1200, 1024×768 (o formato de vitrine). **[MEDIDO]**
2. **O cinza claro liso vence.** No trabalho genérico o fundo mais comum era escuro e havia muita cor; nas peças de produto, 67% dos fundos lisos são cinza claro. Plano cinza: índice de views 1,30 e de salvos 1,81 (102 peças). **[MEDIDO]**
3. **Cena e notebook perdem.** Mockup em cena (notebook, mão, pedra, planta): índice 0,66 de views e 0,40 de salvos em 37 peças. A cena cai de 23% das peças para 12% de um mês para o outro. **[MEDIDO]**
4. **O ar é fino nos lados e maior em cima:** 5,1% à esquerda, 5,2% à direita, 8,6% em cima, 8,5% embaixo (mediana de 70 imagens 4:3 com moldura inteira). Quando a tela não cabe, a casca sai pela borda de baixo em vez de encolher. **[MEDIDO]**
5. **Sem sombra.** Em 29 de 30 shots de 4096 px medidos, a borda da moldura não escurece o fundo mais que 2,7 níveis em 255. A separação é por tom. **[MEDIDO]**
6. **O shot ampliado rende mais que o formato de vitrine:** índice de salvos 2,96 contra 1,77 (plano cinza, uma imagem). Raio da casca: 76 a 112 px em 4096 (~30 a 45 no Figma, com o fator 2,5 de [01 · Escala](../01-sistema-visual/README.md#escala-dos-shots-de-4096-px)). **[MEDIDO]**
7. **O iPhone não é um aparelho:** é a tela de 393×852 exportada a 3x (1179 px de largura), raio de ~55 pt, ilha dinâmica desenhada, sem corpo, sem sombra, centralizado em cinza. **[MEDIDO]**
8. **Retrato só em sequência, e a sequência decide:** díptico (uma tela partida em duas metades 4:5 que se encaixam) chegou a índice 10,8 e 19,7; trio retrato 2,51; tiras altas 1,47; duas a quatro telas 4:3 diferentes 0,53. **[MEDIDO]**
9. **"Antes e depois" é da legenda, não da imagem.** As duas peças "AI slop" e "vibe-coded" (62.896 e 81.873 views) só mostram o depois. As comparações lado a lado rendem índice 0,24 e 0,25. **[OBSERVADO]** e **[MEDIDO]**
10. **Vídeo: 8 segundos, 4:3, sem som, cursor clicando entre telas.** "Ai Agent for hospital governance." (90.913 views): 5 telas em 8 s, dissolves de ~0,5 s. Os passeios com zoom que segue o cursor (comportamento de ferramenta de gravação de tela com zoom automático, **[INFERIDO]**) vêm em segundo. Vídeo alcança como imagem, mas salva menos (índice de salvos 0,57). **[MEDIDO]**

**A folha do design system como peça:** "Does your vibe-coded product maintain a proper design system?", 3 pranchas 4:5 de cor, espaço/raio/elevação e tipo. Com poucas horas de vida: 2.032 views e 2,41% de salvos por view, uma das maiores taxas da amostra. As pranchas documentam o sistema por escrito ("Panels 32, cards 24, tiles 16 and 20, pills full"; "Geist for display and numbers, Inter for body at 16 and below, Geist Mono for ids, times and units"). Ver `sequencia-do-post.md`, C4.

## Arquivos

| arquivo | o que responde |
|---|---|
| `formato-e-enquadramento.md` | proporção, fundo, margem, moldura, raio, sombra, iPhone, cena, perspectiva, com números e desempenho |
| `sequencia-do-post.md` | 1, 2, 3 ou 4 imagens: díptico, trio, tiras, folha de design system, A/B, antes e depois, ordem |
| `video-e-movimento.md` | os vídeos de produto: duração, tipo, ritmo, câmera, transições, fundo |
| `receita-do-shot.md` | o passo a passo no Figma: frame, fundo, ar, raio, sombra, exportação, para as quatro montagens principais |

Recortes em `../galeria/05-apresentacao/` (128 arquivos): `shot-*` são peças inteiras por tipo de enquadramento, `seq-*` são as imagens de uma peça postas lado a lado, `video-*` são quadros de vídeo (em grade, ou `video-<assunto>-<produto>-capa` e `-quadro-1..3`, um arquivo por quadro), `detalhe-*` são recortes em tamanho real, `diptico-*` são as duas metades de um díptico e `recorte-*` são recortes ampliados publicados assim.

## O que ficou incerto

- **Fator de escala do shot ampliado.** A exportação a 3x está provada nos iPhones (1179 px = 393 × 3) e nas folhas do design system. No shot de 4096 × 3072 o fator medido é **~2,5** (faixa 2,4 a 2,6), pela maiúscula do texto e pela linha de 1 px em três produtos; ver [01 · Escala](../01-sistema-visual/README.md#escala-dos-shots-de-4096-px). O ~2,94 que sai de casar o raio de 94 px com o "Panels 32" vale para o díptico do Permitly (2466 × 3051 por metade), que é outro formato. Os valores em "px do Figma" da receita são conversões com esses fatores, e erram até ±4%.
- **Como o feed corta sequências.** A explicação do díptico (duas células lado a lado formando uma tela larga) e do ar grande no trio (sobreviver ao corte central) é inferência sobre o layout do feed do X, não medição do app.
- **Ferramenta de vídeo.** O zoom que segue o cursor tem o comportamento de uma ferramenta de gravação de tela com zoom automático, sem confirmação de qual.
- **Peças com poucas horas de vida** (dípticos CollectAI e AgentPay, folha do design system) tinham de 2 a 13 horas na leitura; os índices delas ainda subiriam.
- **Recorte de componente como 2ª ou 3ª imagem da peça** quase não existe nas peças de produto: as sequências mostram telas ou cartões inteiros, não zoom de um detalhe da primeira imagem. O zoom de detalhe aparece nos vídeos, não nas imagens.
