# Composição e ritmo

O que este arquivo é: como os componentes se sucedem numa peça, a anatomia dos 9 slides, a linha do tempo, as imagens e a figura recortada. Ler no passo de montar o HTML. O catálogo ao vivo de cada componente é `kit/catalogo.html`.

Ter os componentes certos não basta. O que separa uma peça boa de uma peça confusa é **como eles se sucedem**.

---

## A regra-mãe

> **Nunca três slides de texto seguidos.** É ali que o dedo desliza.

Fora dessa regra a ordem é livre. Não é alternância obrigatória imagem/texto e não é "dois textos por imagem": é só o teto de dois textos em sequência. Texto-imagem-texto-imagem vale. Imagem-imagem-texto vale. Texto-texto-imagem vale. A variação é o que dá ritmo; a camisa de força não.

Slide de texto que ficaria seco ganha um componente (card tracejado, nota lateral, palavra grande) ou uma figura recortada. É a correção mais frequente de todas.

---

## Variedade de componente

- **Mínimo dois componentes diferentes** por peça
- **Nunca o mesmo componente em slides seguidos**
- **Não repetir o mesmo molde de layout entre peças** diferentes
- **Um único trecho em serifada por título**

O erro clássico é montar tudo com título em cima e parágrafo embaixo, variando só o texto. Um slide precisa de um **componente que justifique a existência dele**: uma comparação, etapas, um card ilustrado, uma janela. Título + parágrafo é o esqueleto, não o slide.

### Tabela de limites por peça

| Componente | Limite |
|---|---|
| Terminal `.term` | 1 |
| Janela do Mac `.mac` | 1 |
| Decoração (`.ring` / `.glow` / `.grid` / `.marcadagua` / `.numeral`; o `.star` é acessório do `.ring` e não conta sozinho) | 1 |
| Nota lateral `.aside` | 1 |
| Alerta `.alert` (o acento raro) | 1 |
| Imagem cheia `.slide.full` | 1 |
| Ênfase serifada `<em>` | 1 por título |
| Cards ilustrados `.imgcard` | 2 por slide |
| Itens de lista `ul.list` | 4 |
| Etapas `.steps` | 3 a 5 |
| Nós no fluxo `.flow` | 3 a 5 |
| Figura recortada | 1 por slide |
| Tratamento de texto (`.sublinhado` / `.marcatexto` / `.circulado`) | 1 por slide, nunca no mesmo título que o `<em>` |
| Gráfico de barras `.grafico` | 1 (a barra `.alerta` vai no acento raro sobre o claro e no acento sobre o escuro, e consome o `.alert`) |
| Índice `.indice` | 1, com 3 a 6 itens |
| Pilha `.pilha` | 1, nunca no mesmo slide que `.cards` |
| Selo `.selo` | 1 por slide, 2 por peça |
| Foto de meio slide `.fotomeia` | 1 (conta como slide de imagem) |

---

## Densidade

**O componente é grande e preenche o quadro.** Card que ocupa 55 a 65% da altura, borda de acento, respiro generoso por dentro. Card pequeno boiando no meio de espaço vazio parece rascunho. O respiro fica **em volta** do componente, não espalhado pelo slide inteiro.

**Contrapeso:** se o slide está cheio, tira conteúdo, não diminui a margem. As margens laterais são **idênticas na sequência inteira** (`--pad-x`). Margem que muda de slide pra slide destrói a sensação de peça única.

---

## Alternância de registro

Claro e escuro se revezam **com intenção**, não mecanicamente. Um ritmo que funciona:

```
claro · escuro · claro · imagem · claro · escuro · claro · fecho
```

A troca de registro **acompanha uma troca de assunto**. Trocar a cor de fundo no meio de um raciocínio confunde; trocar quando o assunto vira dá respiro.

**Regra dura:** a cor de acento nunca domina o fundo de um slide. Em fundo inteiro, vira outra marca. O acento raro (`--c-rare`) entra em no máximo ~8% da peça: na prática, **um `.alert` por peça**, e só. Nunca como fundo, nunca como texto corrido.

---

## Quantidade de slides

**Segue o conteúdo, não o número.** O modelo tem 9 porque é o que cabe bem num tema de profundidade média. Tema raso pede 6 ou 7. "10 coisas" pede 11 ou 12, um item por slide. Esmagar dez itens em cinco páginas faz a promessa da capa não bater com a entrega, e a peça inteira perde a confiança.

**O raciocínio fecha no penúltimo, não no último.** O último é o fecho, e fecho que também precisa concluir não converte. Quando a pessoa chega no CTA, ela já tem que estar convencida.

---

## A anatomia dos 9

```
1  IMAGEM   capa
2  texto    a tese
3  IMAGEM   cards ilustrados
4  texto    comparação
5  IMAGEM   quadro inteiro
6  texto    processo
7  IMAGEM   janela do Mac
8  texto    conclusão
9  fecho
```

**Não é lei, é ponto de partida.** A lei é uma só: nunca três textos seguidos. O esqueleto pronto é `kit/modelo-carrossel.html`, com comentário explicando cada slide.

1. **Capa** (`.slide.cover`): imagem sangrando + véu subindo + conteúdo ancorado embaixo. Promessa clara ("dez detalhes", "o que muda", "o número"). Capa enxuta comunica mais que lista de tópicos. **Capa é foto**: sem foto ainda, fica o slot; não se monta capa "enquanto isso" com outra coisa, porque a peça é aprovada olhando o JPEG.
2. **Tese** (`.slide.light`): o único lugar em que ler três ou quatro linhas seguidas vale a pena. `.lead` + `.dashed` + `.alert`. Entrega valor cedo: é o slide que segura a retenção.
3. **Cards ilustrados** (`.slide.dark`, `.imgcards.alta`): o `.alta` sobe a foto pra 500px e faz a imagem mandar. Sem ele o slide vira "mais um slide de texto".
4. **Comparação** (`.slide.light`, `.cards` com um `.hero`): o `.dashed` no fim entrega o gancho do slide seguinte.
5. **Imagem cheia** (`.slide.full`): foto no quadro todo, sem véu. Vem sempre logo depois do slide que ela ilustra. Uma por peça.
6. **Processo** (`.slide.light`, `.steps` com 3 a 5 etapas): componente que não se repete na peça.
7. **Janela do Mac** (`.slide.dark`, `.mac`): "o que dá pra ver com os olhos". Print, frame, arte.
8. **Conclusão** (`.slide.light`, `.lead` + `.aside` + `.dashed`): onde o raciocínio fecha. O `.aside` carrega a frase que a pessoa printaria.
9. **Fecho** (`.slide.cta` ou `.slide.cta.abismo`): ver abaixo.

### O fecho

- **Cor cheia, uma só.** A principal (`.slide.cta`) ou a mais fechada (`.slide.cta.abismo`). Nunca as duas no mesmo slide. "Mesclar" é variar de peça pra peça: esta fecha na principal, a próxima no abismo.
- **Conteúdo centralizado.** É o único slide da peça no eixo: não há leitura pra guiar, há uma ação só.
- **Duas formas:** a palavra-gatilho (`.word`), só quando existe material real pra entregar; ou as quatro ações (`.acts`), pra alcance. A linha de seguir (`.follow`) vai nas duas.
- **A logo assina o fecho**, se existir. Sem logo, fica só o @.
- **Sem crédito de fonte na arte:** vai na `legenda.txt`. A única exceção é arte de terceiro, que leva `arte: Nome` no `.ct`, ancorado no pé do fecho, e aí é obrigatório. Sem figura recortada: o fecho é chamada e assinatura.
- Último traço da linha do tempo aceso, sem seta.

### A logo

Capa **ou** fecho, nunca os dois. No fecho ela já entra por padrão. Faixa de 120 a 200px de largura numa logo horizontal (52px de altura no `.follow`). Uma variante clara pra fundo escuro, uma escura pra fundo claro. Nunca distorcer, nunca aplicar sombra, nunca recolorir por `filter`.

---

## A linha do tempo, no rodapé de todo slide

Um traço por slide, dentro do `.ftr`, ao lado do contador. O traço do slide atual é mais alto e mais largo; os que ficaram pra trás seguem acesos; os que faltam ficam no tom apagado do trilho. Quem bate o olho vê **em qual slide está**, e quem vê que falta pouco, termina.

```html
<div class="ftr">
  <div class="bar"><i class="feito"></i><i class="agora"></i><i></i><i></i><i></i></div>
  <span class="count">2/5</span>
  <span class="chev">›</span>
</div>
```

Três estados, e só: `feito`, `agora`, e o traço sem classe. O "onde estou" é **tamanho, não opacidade**: acento translúcido sobre a cor principal desatura, e o traço cumprido some. A linha é ornamento e não fala; quem sinaliza arraste é o `.chev`, uma vez, e o último slide não tem.

**Quem escreve a linha é o script, nunca a mão:**

```
node .claude/skills/carrossel/render/linha-do-tempo.mjs carrosseis/<peça>/carrossel.html
```

Escrever à mão erra em silêncio: traço a mais, aceso na posição errada, contador dizendo outra coisa. Nada disso o olho pega conferindo JPEG.

---

## Imagens

### A regra que manda em tudo

> **A pessoa da marca traz as imagens.** A skill não busca na web.

A estrutura nasce com o lugar reservado marcado, dizendo o que vai ali e o tamanho mínimo, e tudo fica listado no `IMAGENS.md` da peça. A pessoa escolhe melhor que qualquer busca, e a peça pode ser aprovada inteira antes de existir uma foto.

### O método do slot

Enquanto a foto não chegou:

```html
<div class="ph">
  <div class="slot">
    <b>IMG 03-A</b>
    <span>o que precisa aparecer nessa imagem, em uma frase</span>
    <i>mín. 900×1000 · em pé</i>
  </div>
</div>
```

Quando chegou:

```html
<div class="ph">
  <img src="/carrosseis/<peça>/03a.jpg" alt="">
</div>
```

**Nada muda de posição**: o buraco já tem a medida certa.

### O IMAGENS.md

Uma seção por imagem, sempre com: onde entra, nome do arquivo, o que precisa mostrar, resolução mínima e orientação. A descrição vai num **bloco de código isolado**, curta (uma ou duas linhas: assunto, enquadramento, clima), pra pessoa copiar e levar pra uma busca ou pra um gerador de imagem. As restrições gerais (sem texto na imagem, sem emoji, capa em pé) ficam uma vez no rodapé do arquivo.

E a descrição também vai no chat, pronta pra copiar. Não basta o arquivo existir.

Um `IMAGENS.md` de uma peça fica assim:

```markdown
# Imagens da peça

## capa.jpg · slide 1 · mín. 1080×1350, em pé

    Mãos de ceramista modelando uma caneca num torno, close, luz de janela lateral, terço de baixo mais escuro e sem detalhe.

## 03a.jpg · slide 3, card da esquerda · mín. 900×1000, em pé

    Caneca de barro recém torneada numa bancada de madeira, close, luz natural.

Vale pra todas: sem texto, letra ou logo dentro da imagem; sem rosto reconhecível; capa e imagem cheia em pé.
```

### Os tratamentos

| Tratamento | Classe | Véu | Quando |
|---|---|---|---|
| Capa | `.slide.cover` | degradê subindo | slide 1, sempre |
| Imagem cheia | `.slide.full` | nenhum | a imagem é o conteúdo; ilustra o slide anterior |
| Foto com véu | `.slide.photo` | chapado | slide interno em que o texto domina |
| Card ilustrado | `.imgcards.alta` | nenhum | imagem no miolo, uma ou duas |
| Foto de meio slide | `.fotomeia` + `.comfotomeia` | nenhum | texto de um lado, foto do outro; a foto sangra por três bordas |
| Janela do Mac | `.mac` | nenhum | print, frame, prova |
| Frame de mídia | `.frame` | escuro | quando não se tem o frame real |

Como escolher: a imagem **é** o conteúdo, `.full`; **ilustra** o texto, `.photo` ou `.imgcards.alta`; **prova** algo, `.mac`; é o slide 1, `.cover`.

### Resolução

O render é 2×: 1080×1350 vira 2160×2700. Imagem que parece boa na tela pode sair borrada no JPEG.

| Uso | Mínimo | Orientação |
|---|---|---|
| Capa e imagem cheia | 1080×1350 (ideal 2160×2700) | em pé ou quase |
| Card ilustrado `.alta` | 900×1000 | em pé |
| Foto de meio slide | 1080×1350 | em pé (meia coluna, altura inteira) |
| Janela do Mac | 1600×800 | deitada |

**Imagem deitada não vira imagem em pé.** O kit corta sozinho (`object-fit: cover`), então não precisa acertar o enquadramento, mas ele não inventa pixel: fonte pequena esticada borra. Conferir a altura do arquivo antes de renderizar; se veio pequeno, dizer com os números na mão em vez de renderizar calado.

### A armadilha do `--img`

```html
<!-- ERRADO: a imagem some, sem erro nenhum -->
<div class="slide cover" style="--img:url('capa.jpg')">

<!-- CERTO -->
<div class="slide cover" style="--img:url('/carrosseis/<peça>/capa.jpg')">
```

`--img` é custom property, e um `url()` dentro dela resolve relativo ao arquivo CSS, não ao HTML. Como o CSS é central, o caminho relativo procura a imagem dentro da pasta do kit e falha em silêncio. Vale pro `.cover`, `.full` e `.photo`. Tags `<img>` normais não têm esse problema. O render acusa toda imagem que não existe, então o erro não passa calado.

### Direitos e crédito

Toda peça credita a fonte da informação na `legenda.txt`, não na arte. Nunca assinar a arte com o nome da própria marca. O `arte:` só aparece quando a arte é de terceiro, e aí é obrigatório.

---

## Figura recortada

Uma pessoa ou personagem em PNG com fundo transparente: a foto da pessoa da marca recortada, uma ilustração própria, um mascote. O kit não traz nenhuma; a pessoa traz a dela. Dois jeitos de entrar:

- **`.figura`** (corpo inteiro), no slide com a classe `.comfigura`. A classe não é opcional: é ela que encolhe a coluna de texto pros 545px que sobram, senão o texto passa por baixo da imagem. Tamanhos `.p` (470px), padrão (600px), `.g` (660px, o teto), `.larga` (figura com cenário). `.esq` joga pra esquerda; `.comfigura.textodir` alinha o texto à direita.
- **`.busto`** (meio corpo), dentro de uma caixa com a classe `.combusto`, apoiado no topo dela como detalhe. Tamanhos `.p` (140px), padrão (180px), `.g` (240px). Numa caixa única, `.meio` centraliza; numa dupla de cards, `.c1` e `.c2` centralizam sobre cada card (o `.meio` cairia no vão e a base ficaria exposta). O busto fica atrás da caixa, e a caixa esconde onde a imagem acaba. Nunca dentro de `.imgcard`, que tem `overflow:hidden` e corta o busto.

**Dosagem:** uma figura por slide, uma pose não se repete na mesma peça, um conjunto (o mesmo personagem, a mesma roupa) por peça. Entra bem no slide de texto que ficaria seco e no slide de comparação, aí como busto apoiado nos cards. Na capa não entra, a não ser que a pessoa peça. No fecho nunca.

**Resolução:** o render sai em 2×. Uma figura de 600px de altura precisa de PNG com pelo menos 1200px de altura. Ilustração de contorno grosso aguenta um pouco de upscale; foto recortada não aguenta nenhum.

---

## Grade do feed

Olhando o perfil de longe, as capas formam um padrão. Sequência que funciona: claro, foto/escuro, acento, claro. Nunca duas capas iguais seguidas. E o fecho alterna de peça pra peça.

---

## As ampliações da 1.1

Oito adições que ampliam o vocabulário sem mexer na contenção. Cada uma entra numa cota que já existia (a tabela de limites acima diz qual). O catálogo, seção 19, mostra todas ao vivo.

- **Tratamento de texto** (`.sublinhado`, `.marcatexto`, `.circulado`): uma palavra ou expressão curta num `<span>`, nunca a frase inteira. Um por slide, e nunca no mesmo título que o `<em>` serifado. A grifa inverte sozinha sobre fundo escuro (faixa cheia, palavra na cor do fundo), porque translúcida ela desatura e a palavra destacada vira a menos legível.
- **Grafismo tipográfico** (`.marcadagua`, `.numeral`): a palavra do slide gigante e quase invisível, ou o número do slide em contorno, cortados por uma borda. Fundo, nunca informação. Contam como decoração.
- **Gráfico de barras** (`.grafico`): 3 a 6 categorias, sempre horizontal, série única numa cor só. A escala começa no zero. Magnitude independente: o maior valor enche o trilho. Fração de um todo: o trilho é o todo e cada barra ocupa a fração real. O valor vai ao lado, em mono.
- **Índice** (`.indice`): o sumário do slide 2 ou a recapitulação do penúltimo. 3 a 6 itens.
- **Pilha** (`.pilha`): dois cards em diagonal, "o que era" embaixo e "o que virou" em cima. É a comparação dita de outro jeito: não vai junto com `.cards`.
- **Selo** (`.selo`): badge circular de acento com texto mono curtíssimo. Em fluxo, nunca solto.
- **Foto de meio slide** (`.fotomeia`, no slide com `.comfotomeia`): a foto ocupa metade do quadro de cima a baixo e o texto fica na outra metade. Conta como slide de imagem no ritmo.
- **Âncora do corpo** (`.body.alto`, `.body.base`): o corpo sobe pro topo ou desce pro rodapé. Escolha por slide, não sistema de posições; a margem lateral não muda.

---

## Estilo, em cinco linhas

- **Cantos arredondados** em tudo (os raios estão nos tokens); nada de canto vivo, nada de pílula.
- **Respiro é o elemento principal.** Se está cheio, tira conteúdo.
- **Profundidade sutil:** duas sombras difusas, nunca sombra dura nem contorno preto.
- **Hierarquia por peso e tamanho**, não por cor. A cor entra pouco, e por isso pesa: o acento marca palavra, não parágrafo.
- **Ícones** em traço fino, SVG inline (render offline), um por ideia, sempre em acento. Nunca emoji na arte, nunca mascote emprestado de outra marca.

---

## Checklist antes de renderizar

- [ ] Nenhuma sequência de três slides de texto
- [ ] Dois componentes diferentes, sem repetir em slides seguidos
- [ ] Máx. um terminal, uma janela do Mac e um elemento decorativo
- [ ] Um destaque serifado por título
- [ ] Linha do tempo gerada pelo script
- [ ] Margens laterais idênticas em todos os slides
- [ ] Cor de acento em detalhe, nunca em fundo dominante
- [ ] Acento raro em um `.alert`, no máximo
- [ ] Imagens pedidas no `IMAGENS.md`, não buscadas na web
- [ ] Fecho em cor cheia, uma só
- [ ] Caminhos de `--img` absolutos a partir da raiz do projeto
- [ ] Proporção 4:5 conferida nos JPEGs
