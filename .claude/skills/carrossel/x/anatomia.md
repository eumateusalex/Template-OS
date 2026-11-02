# Anatomia do carrossel estilo X

A régua deste formato, em texto. O `render/conferir-x.js` cobra o que tem
número; o resto é julgamento, e está aqui.

---

## Por que este formato não usa o kit

O carrossel estilo X funciona porque a pessoa lê como conteúdo que alguém
compartilhou, não como peça publicitária, e baixa a guarda. Cor da marca,
linha do tempo, tipografia do kit ou componente quebram isso: vira peça da
marca com cara de post, que não tem a força de nenhum dos dois.

Isso vale só aqui, porque a imitação é o produto. Em qualquer outra peça vale o
kit e o `marca/`.

| Regra do kit | Aqui | Por quê |
|---|---|---|
| Nunca CSS na peça | o CSS mora no `x/modelo.html` | nenhum componente do kit desenha a interface de um post |
| Linha do tempo em todo slide | sem linha do tempo | post não tem rodapé |
| Nada de emoji na arte | emoji liberado, com figura | post de verdade tem emoji; sem ele o print denuncia a montagem |
| Fecho em cor cheia | o fecho é mais um post, branco | slide escuro no fim quebra a sequência |
| Nunca três slides de texto seguidos | não vale | o formato é texto por natureza |

---

## As formas, e quanta imagem cada uma leva

A forma se anuncia antes de montar, em uma linha, com o porquê e a contagem de
imagens. É ela que decide quanta imagem a peça leva, não o gosto.

| Forma | O que é | Imagens a cada 10 slides |
|---|---|---|
| **Caso único** | uma empresa, pessoa ou situação, do começo ao fim | 6 a 8 |
| **Refrão + galeria** | a mesma frase em todo slide, mudando só a foto | todos |
| **Explicação ou tese** | explica um assunto ou defende uma ideia, sem numerar | 4 a 6 |
| **Lista de método** | um item por slide, numerado | 1 a 2 |
| **Passo a passo** | `PASSO 1:`, `PASSO 2:` | 2 |
| **Anáfora** | todo slide abre com a mesma construção | 1 |

**Quantidade de slides:** de 7 a 12, na profundidade do tema. Nunca esmagar dois
itens desenvolvidos num slide para encurtar.

---

## A régua de imagem

### Não existe intervalo: quem decide é o sujeito do slide

> Existe um registro real do que esta frase afirma?

"Existe uma foto que combina com o clima" é decoração, e decoração é o jeito
de perder este formato.

- **Na peça de caso, a imagem é o padrão**: o slide sem imagem é que precisa de
  motivo. Ficam sem os de lição abstrata, os que falam com o leitor e o fecho de
  comentário.
- **Na lista de método, a imagem é a exceção**: método não tem rosto, e enfiar
  foto denuncia a montagem.
- Quer mais imagem? Troque a carga para casos reais; nunca decore a lista.

### Conte os slides de texto no fim

Os tipos que ficam sem imagem são três (lição, fala com o leitor, fecho). Quatro
slides seguidos sem imagem no fim quer dizer que dois são o mesmo tipo e a peça
está se explicando duas vezes. **O conserto é fundir, nunca decorar.**

### As duas pontas

- **Capa:** leva imagem. A exceção é a anáfora pura, que abre com a lista no
  próprio slide.
- **Último:** pode levar, quando o fecho oferece algo que tem cara (o cartaz do
  evento, a tela do que se vende). Fecho que só pede comentário é texto curto e
  centralizado.

### O que a imagem é

| | |
|---|---|
| **É** | registro real do sujeito: fachada, foto de quem a história fala, produto na mão, print de uso real |
| **Não é** | banco de imagem. Gente sorrindo de braços cruzados mata o formato |
| **Foto antiga, preto e branco, qualidade baixa** | funciona: reforça que é registro, não produção |
| **Print de tela** | é imagem legítima, desde que de uso real (a página inicial de um produto é quase banco de imagem) |

**Capa dupla**: duas imagens lado a lado, em duas composições (rosto e símbolo,
ou antes e depois). No miolo a imagem é quase sempre única; dupla no meio só
quando o slide compara duas coisas.

### As medidas da imagem

| Proporção | Altura no slide | Cabe |
|---|---|---|
| 16:9 | 556 px | 3 blocos curtos, no limite |
| **2:1** | **494 px** | **3 blocos confortáveis** |
| retrato ou quadrada | 988 px ou mais | não cabe |

- **Imagem única: sempre 2:1 (1976×988), inteira no quadro, nunca cortada.**
  Num slide de feed a imagem cortada na borda lê como erro de montagem.
- **Retrato nunca vai sozinho.** Ou se recorta em 2:1, ou vai para a dupla, que
  força quadrado (mínimo 800×800).
- **Muito texto e imagem no mesmo slide não existe.** Passou de 3 blocos e
  precisa de foto: dois slides, um com o texto e outro com a imagem e uma frase.
  **Nunca diminuir a letra.**
- Imagem de fundo claro se funde no branco; a moldura de 1 px ajuda, e o
  conferidor avisa.

---

## As medidas do slide

| Elemento | Medida |
|---|---|
| Slide | 1080×1350 (4:5), sai a 2160×2700 |
| Respiro lateral | 46 px |
| Avatar | 112 px, circular: a foto de perfil de verdade |
| Nome | 38 px, peso 700 |
| @ | 36 px, peso 400, `#536471` |
| Corpo | 41 px, entrelinha 1,34 |
| Espaço entre blocos | uma linha inteira |
| Tinta | `#0F1419`, não preto puro |
| Fundo | `#FFFFFF` |
| Canto da mídia | 24 px |
| Moldura da mídia | 1 px `#CFD9DE` |

A fonte é a Inter, a livre mais próxima da interface original; a diferença some
no tamanho em que a peça é lida. O emoji sai pela Noto Color Emoji, para não
cair no desenho do sistema de quem renderiza.

**Alinhamento:** slide curto fica centralizado; slide cheio encosta no topo
(classe `.topo`). É o que um post de verdade faz.

---

## A estrutura do texto

- **De 2 a 6 blocos por slide.** A variação dá o ritmo: respiro com 2, virada
  com 5. Um bloco por parágrafo, separados por linha em branco.
- **Não existe fecho fixo de item** ("use isso para..."): soa a fórmula.
- **Uma ideia por slide.** O slide fecha o pensamento, não o assunto.
- **Frase curta isolada como bloco** pesa mais que dentro do parágrafo.
- **Enumeração rápida cabe num slide**; item desenvolvido não.
- **Nenhum slide de credencial** (tempo de carreira, formação, "por que me
  ouvir").

### A capa

1. A promessa, com o que a pessoa perde (a capa se entende sozinha,
   [metodo.md](../referencias/metodo.md), seção 4).
2. O número exato, quando é lista ("aqui estão 7"), nunca "várias".
3. O convite ao swipe, com 👉, ou o comando de salvar.

### A numeração

Três convenções valem: `1 - título.`, `1. "TÍTULO EM CAIXA ALTA."` e
`PASSO 2: TÍTULO`. Uma por peça; o conferidor confere a ordem, não a convenção.

### O último slide

1. **Continuidade**: marca o próximo passo sem pedir nada.
2. **Oferta com imagem**: o slide é cheio e leva a foto do que se oferece.
3. **Chamada de comentário colada no tema** ("comenta aí qual você cortaria"),
   nunca a mesma frase em toda peça.
4. **Palavra-gatilho em caixa alta** ("comenta QUERO"): só quando alguém
   responde o direct com o que ela promete. Prometer e não entregar queima a
   conta; o conferidor avisa, e o CTA segue "O CTA" de
   `_memoria/escrita-publica.md`.

Carrossel sem fecho comercial também existe: quando a peça já entregou o que
prometeu, o fecho é opcional.

---

## Emoji

- Pode entrar em qualquer slide, **um ou dois no máximo**; acima disso vira
  bullet decorado.
- **Ganha o lugar** onde o slide tem um momento: abertura de notícia, convite ao
  swipe, a virada, a ação que o leitor faz, a chamada de comentário.
- **Não ganha** em slide de argumento, citação ou dado: lê como esforço de
  animar o texto.
- **Só emoji com figura** (gente, mão, objeto, bicho, cara). Símbolo de
  interface (setas em quadrado, engrenagem, cronômetro, corrente) lê como botão
  quebrado no meio do texto; o conferidor avisa, mas o PNG é que mostra.
- **Ponto antes do emoji final**: `comenta aí a primeira que veio. 👇`. Frase
  terminando só no emoji lê como pensamento inacabado.

---

## Recursos de escrita que valem

- Caixa alta curta (`UM CLIQUE`) ou o título inteiro em caixa alta como espinha
  da peça; nunca caixa alta espalhada no parágrafo.
- Pergunta como virada ("e se a gente fizesse o contrário?").
- Mini-lista com hífen dentro do slide.
- Reticências para emendar no bloco seguinte.

## O que não fazer

- Hashtag, link ou @ de terceiro dentro da arte.
- Número de curtida, data ou botão de engajamento desenhado: o print é do texto,
  não da tela inteira.
- Travessão (o conferidor reprova).
- Selo de verificado em conta que não é verificada.
- Imagem de banco, imagem cortada, letra diminuída para caber.
