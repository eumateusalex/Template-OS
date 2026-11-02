# A tipografia

O texto que entra na tela: quantas vozes ele tem, que tamanho se lê, como a linha chega e quando a
palavra é digitada. A legenda corrida da fala e a palavra que acende no lugar são do `reel/`;
aqui fica o texto da cena. A curva do texto é a da marca, na `/video`
(`.claude/skills/video/regras-de-movimento.md`); o brilho da chave é `comum.efeito.brilho-na-chave`;
o som da digitação é `comum.som.digitacao`.

**No plano**: o texto da cena vai em `texto_tela`. O texto que é parte de um objeto desenhado (a
interface genérica, o painel ao fundo) vai sob `data-texto="objeto"`, e as réguas de leitura não o
contam.

## As vozes

### comum.tipografia.duas-vozes
- **estado**: firme
- **quando**: a frase que tem uma palavra que importa mais que as outras. **Não quando**: a frase em que tudo pesa igual (o nome, o endereço); a chave que se repete em toda frase
- **regra**: duas vozes na mesma frase, na mesma família da marca: a palavra-chave grande e pesada, o resto pequeno e leve. Os dois encostados, o apoio de antes em cima e o de depois embaixo. A chave na cor de destaque da marca, uma por frase, e ela segura a frase inteira enquanto o apoio troca
- **parâmetros**: a chave tem 2,0 a 3,6 vezes o apoio (mediana 2,5; o 4× é a exceção do título-bomba); a chave em peso 800 e entreletra −0,03 em; o apoio em peso 400 a 500; centro a centro ~80 px (1080 de largura); a chave fica ~4 s
- **som**: nenhum (o brilho e o som da chave são de `comum.efeito.brilho-na-chave` e `comum.som.destaque-e-final`)
- **realiza**: `biblioteca:palavra-em-duas-vozes`; `registro:caption-editorial-emphasis`; `registro:caption-weight-shift`

### comum.tipografia.chave-em-serifa
- **estado**: proposta
- **quando**: a peça cujo estilo pede uma segunda voz em serifa, e ela é a voz de toda chave da peça. **Não quando**: uma palavra serifada solta numa linha sem serifa (é o tique que os modelos fazem); como padrão (a serifa é opção do estilo da peça, na `/video`)
- **regra**: a segunda voz em serifa é escolha da peça inteira: toda chave nela, ou nenhuma. A serifa é livre (a de licença aberta), nunca a que não se redistribui
- **parâmetros**: —
- **som**: nenhum
- **realiza**: `biblioteca:chave-em-serifa`

## O tamanho

### comum.tipografia.medidas
- **estado**: proposta
- **quando**: todo texto que se lê na cena. **Não quando**: o texto do objeto desenhado (a interface genérica, a tela ao fundo), que é textura
- **regra**: o título é grande no quadro e o texto que se precisa ler passa do piso; abaixo do piso, o texto é textura e vai sob `data-texto="objeto"`. O texto que se lê contrasta com o fundo: o cinza claro sobre branco é o amador. O plano escreve o tamanho, o peso e a entreletra de cada texto da cena, e a largura do cartão sai da composição, não do texto que cabe
- **parâmetros**: o título ocupa 60 a 80% da largura do quadro; o texto que se lê tem 40 px ou mais (≈ 4% da largura, em 1080); o corpo de 28 a 39 px só como textura; o cartão de texto no 16:9, perto de 800 de 1920 de largura
- **som**: nenhum
- **realiza**: `mao`

## A cor na letra

### comum.tipografia.luz-dentro-da-letra
- **estado**: proposta
- **quando**: a palavra grande do fecho ou do pico, em peso médio, sobre fundo claro. **Não quando**: o texto corrido e a legenda; o degradê de duas matizes (o arco-íris na letra)
- **regra**: a luz mora dentro da letra: um degradê suave na diagonal, da cor de destaque a um tom mais claro dela, recortado no desenho da letra; a frase de apoio leva o mesmo degradê no cinza-azulado, mais forte em cima e mais leve embaixo. A letra fica premium pelo peso médio e pelo aperto, não pelo negrito
- **parâmetros**: degradê a 135°, a cor plena até 30% e o tom claro em 100%; a palavra de 196 px em peso 540 com o tamanho óptico fixo e o aperto de -0,03 em; o apoio em 72 px, do cinza a 0,88 ao cinza a 0,50 de opacidade; folga de 0,06 em embaixo para o recorte não comer a perna da letra
- **som**: nenhum
- **realiza**: `mao` (o degradê recortado pela letra, no CSS)

## A entrada do texto

### comum.tipografia.linha-no-lugar-final
- **estado**: proposta
- **quando**: toda frase que entra palavra a palavra: a legenda corrida, o fecho, o título. **Não quando**: —
- **regra**: a linha não reflui: ela se compõe inteira antes, na largura final, e cada palavra só acende no lugar dela. A palavra que entra nunca empurra a vizinha nem recentraliza a linha
- **parâmetros**: a linha inteira medida e posta no quadro 0 da entrada, com as palavras ainda invisíveis; só a opacidade, o desfoque e a subida curta animam
- **som**: nenhum
- **realiza**: `mao`

### comum.tipografia.sobe-da-linha
- **estado**: proposta
- **quando**: o título de uma parte, o gancho escrito, a frase que fecha. **Não quando**: a frase longa, de mais de duas linhas
- **regra**: a linha sobe de dentro de uma janela invisível e assenta, linha a linha ou palavra a palavra, com folga em cima e embaixo para não cortar acento e cedilha
- **parâmetros**: `yPercent` 110 → 0; cascata de 0,06 a 0,1 s entre linhas (entre palavras, a cascata da `/video`); curva `pouso` ou a da marca; folga de 0,2 em em cima e embaixo
- **som**: nenhum
- **realiza**: `biblioteca:frase-que-sobe-da-linha`; `registro:line-by-line-slide`; `registro:per-word-rise`; `curva:pouso`

### comum.tipografia.batida-tipografica
- **estado**: proposta
- **quando**: a sequência de frases curtas sobre uma trilha com batida marcada. **Não quando**: a peça em que a voz manda no tempo; a frase longa
- **regra**: as frases curtas batem uma a uma numa grade única de tempo (a batida da trilha), cada uma com uma entrada própria, sem repetir a mesma entrada duas vezes seguidas
- **parâmetros**: a entrada de maior (escala 1,5 → 1 com desfoque de 16 px → 0); a lateral (320 px → 0); a subida com 6° de giro; o ataque de 0,35 a 0,6 s
- **som**: o tempo da trilha; `impacto` só na frase do pico
- **realiza**: `mao`

### comum.tipografia.palavra-que-vira-objeto
- **estado**: proposta
- **quando**: a palavra é a ideia da peça, e virar objeto diz algo. **Não quando**: em toda peça (vira o tique mais gasto: a letra que vira a lente, o ponto que vira o logo)
- **regra**: a palavra muda de forma e vira o objeto que ela nomeia, uma vez na peça
- **parâmetros**: uma vez por peça
- **som**: `whoosh-curto` ou `golpe-tonal`, pico no meio da troca
- **realiza**: `motor:transicao=morph`

## A digitação

### comum.tipografia.digitacao-na-interface
- **estado**: firme
- **quando**: a palavra que se escreve dentro de uma interface (o campo de busca, a mensagem, o nome no campo). **Não quando**: o título solto (`comum.tipografia.letra-por-letra`)
- **regra**: a interface viva se prova pela digitação: a letra entra no campo uma a uma, o cursor pisca antes e some quando a interface responde
- **parâmetros** (30 qps): uma letra a cada 2 q; o cursor pisca antes da primeira letra e some quando a interface responde
- **som**: `tecla`, pico no quadro de cada letra (`comum.som.digitacao`)
- **realiza**: `biblioteca:busca-que-se-digita`; `ios:campo`; `registro:typed-prompt`

## O que não entra

### comum.tipografia.letra-por-letra
- **estado**: recusado
- **quando**: —
- **regra**: o título, o nome do fecho ou qualquer texto solto entrando letra a letra, ou digitado com cursor fora de um campo, é o amador. Digitar só no campo da interface (`comum.tipografia.digitacao-na-interface`); a palavra entra inteira. A proibição mora na `/video` (Proibidos)
- **parâmetros**: —
- **som**: —
- **realiza**: —
