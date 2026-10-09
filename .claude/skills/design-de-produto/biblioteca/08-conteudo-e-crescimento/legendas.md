# Legendas: as fórmulas, com o que cada uma rende

## O que é

O texto que acompanha a imagem. No X, a legenda que funciona para design de produto é quase sempre uma linha curta: a imagem carrega a peça, e o texto só dá o nome da coisa ou provoca uma reação.

Base: 483 peças próprias com mídia do último ano de um perfil de designer de produto (226 delas nos dois meses das séries de produto; só registros do perfil). As peças mais novas tinham poucas horas de vida na leitura, então seus números ainda subiam. Cada legenda foi classificada por expressão regular em famílias (uma peça pode cair em mais de uma), e cada família foi medida de dois jeitos:

- **views e salvos medianos** (número bruto);
- **índice relativo**: views da peça divididas pela mediana das peças com mídia do perfil na janela de 7 dias em volta. 1,0 é a peça típica daquela semana. Isso tira o efeito "o mês teve mais views porque o perfil cresceu". O mesmo para salvos.

A medição foi feita em Python (legenda sem o link encurtado, classificação por palavras-chave, mediana e índice por família). **[MEDIDO]** vale para toda tabela desta página.

## Anatomia da legenda típica (séries de produto) **[MEDIDO]**

| traço | valor |
|---|---|
| comprimento mediano | 44 caracteres, 6 palavras |
| com quebra de linha | 27 de 226 (12%) |
| com ponto de interrogação | 14 de 226 (6%) |
| com emoji | 10 de 226 (4%) |
| com hashtag, menção ou link | 0 de 226 |
| idioma | inglês, com erro de digitação solto ("less then", "agencys", "thik") que não atrapalha |

A mudança em relação à fase genérica é grande: nela, 38% das legendas tinham pergunta e 33% tinham emoji. Nas séries de produto, 6% e 4%. A legenda que pede reação dá lugar à legenda que nomeia o produto no mesmo momento em que o perfil decola.

Comprimento contra desempenho, séries de produto:

| caracteres | peças | views medianas | salvos medianos |
|---|---:|---:|---:|
| vazia | 5 | 1.091 | 2 |
| 1 a 19 | 15 | 2.204 | 12 |
| 20 a 39 | 64 | 1.175 | 7,5 |
| 40 a 69 | 124 | 1.566 | 15 |
| 70 a 119 | 13 | 4.166 | 74 |
| 120 ou mais | 3 | 7.377 | 173 |

A faixa de 70 a 119 caracteres (uma frase de benefício completa) é a que mais salva, com amostra pequena (13). **[INFERIDO]** que o salvo vem da frase dizer o que o produto resolve, não do tamanho em si.

## As famílias

### 1. Série de projeto: "Nome, AI Powered <categoria> Product"

**Fórmula:** `<Nome do produto>, <AI Powered | AI-Powered> <o que ele faz> <Product | Platform | Mobile App>`

Exemplos reais:
- "Vero, AI Powered Revenue Intelligence Product" (5.553 views, 101 salvos)
- "Rillo AI Powered Expense & Receipt Intelligence Product" (5.907 views, 129 salvos)
- "OrchestrateIQ , AI Agent Management Product" (31.458 views, 79 salvos)
- "Torin, Subscription & Money Management Mobile App" (5.635 views)
- "FixTrack, Property Maintenance, Simplified" (8.239 views, 142 salvos)

| período | peças | views med. | salvos med. | salvos/views | índice views | índice salvos |
|---|---:|---:|---:|---:|---:|---:|
| último ano | 99 | 1.333 | 10 | 0,89% | 0,86 | 0,86 |
| séries de produto | 89 | 1.536 | 12 | 0,94% | 0,92 | 0,88 |

É a família mais usada nas séries de produto (39% das peças) e empata com a frase de benefício na maior taxa de salvos por view (0,94%). O mesmo projeto volta dezenas de vezes, cada vez com uma tela ou um recorte diferente, e a legenda muda só na pontuação (vírgula, espaço antes da vírgula, com e sem hífen em "AI-Powered").

Critério desta tabela: conta só as peças cuja **legenda cita o nome** do projeto. A seção 06 conta a série pelo **logo na imagem** (mapa peça → produto), por isso lá o Vero tem 30 peças, o Rillo 27 e o OrchestrateIQ 17.

| projeto | peças | duração | views medianas | maior |
|---|---:|---|---:|---:|
| Vero | 28 | 18 dias | 1.328 | 5.553 |
| Rillo | 25 | 26 dias | 2.091 | 5.907 |
| OrchestrateIQ | 7 | 7 dias | 2.353 | 31.458 |
| Mongi | 4 | 6 dias | 1.985 | 4.212 |

Repetir não desgasta: nas séries com 5 ou mais peças, o índice mediano das peças 1 a 5 é 0,81 e o das peças 21 a 25 é 1,32. **[MEDIDO]** A série é o motor do volume: um projeto bem desenhado rende um mês de peças.

**Quando usar:** todo dia, como base. É legenda de catálogo: não pede nada, só nomeia. O salvo vem porque quem salva quer a tela como referência e o nome ajuda a achar de novo.

### 2. Frase de benefício

**Fórmula:** uma frase sobre o que a pessoa sente ou consegue ao usar o produto, sem nome de marca na frente. Às vezes com reticências no fim.

- "Enjoyable Saas UI that makes UX smoother..." (78.682 views, 865 salvos, peça fixada)
- "So many things on one screen, still seamless Experience." (46.261 views, 110 salvos)
- "Organized information that helps to take action without cognitive load. Although they are small cards." (17.374 views, 252 salvos)
- "Track your fleet! AI-powered fleet management app." (13.342 views, 265 salvos, 1,99% de salvos)
- "Run your company smoothly..." (12.863 views, 119 salvos)
- "Imagine customer support your team actually enjoys using. Fun, Peach, and enjoyable UI." (9.648 views, 267 salvos, 2,77%, a maior taxa de salvos da base entre peças com mais de mil views)
- "What if fintech UI didn't look like traditional flashy fintech? CollectAI! Less noise. Better hierarchy." (7.377 views, 173 salvos, 2,35%)

| período | peças | views med. | salvos med. | salvos/views | índice views | índice salvos |
|---|---:|---:|---:|---:|---:|---:|
| último ano | 32 | 620 | 5 | 0,70% | 1,26 | **1,86** |
| séries de produto | 14 | 4.776 | 65 | 0,94% | 1,67 | **3,06** |

É a família que mais salva acima do esperado: nas séries de produto, três vezes o salvo típico da semana. Entre as peças com mais de mil views, três das cinco maiores taxas de salvo por view são frases que dizem o benefício ("Imagine customer support...", "PriorAuth gives clinics one workspace for the whole prior authorization process.", "What if fintech UI...").

**Quando usar:** no melhor shot da semana. A frase fala com o fundador (quem compra), não com o designer.

### 3. Antes e depois declarado ("AI slop", "vibe-coded")

**Fórmula:** afirma a transformação de um produto feito por IA ou "no vibe" em produto pronto.

- "From vibe-coded chaos to polished product. I revamped and designed the UI to its full potential." (81.873 views, 1.438 salvos, 43 respostas, a peça com mais salvos da amostra)
- "Turn your UI AI slop into production-ready design!" (62.896 views, 973 salvos, 52 respostas)
- "Another masterpiece. Redesigned it." (46.208 views, 321 salvos)
- "Turn your shitty AI slop into production-ready design." (29.225 views, 294 salvos)
- "I turn shitty AI design into this grade interface. Rate this, guys. How seamless is it?" (vídeo, 11.704 views, 171 salvos)
- "Turned an AI slop into this design. Did I cook?" (4.896 views, 39 salvos)
- "Does your vibe-coded product maintain a proper design system?" (3 imagens com a folha do design system, 2.032 views e 49 salvos com poucas horas de vida: 2,41% de salvos por view)

| período | peças | views med. | salvos med. | índice views | índice salvos |
|---|---:|---:|---:|---:|---:|
| último ano | 20 | 1.546 | 6 | 1,06 | 1,13 |
| séries de produto | 12 | 3.584 | 44 | 1,07 | 1,13 |

O índice mediano é só um pouco acima de 1, mas a família concentra três das seis maiores peças do ano e as duas que mais geraram resposta (52 e 43). É uma aposta de cauda: a maioria rende o normal, e algumas explodem.

**Detalhe que importa [OBSERVADO]:** nas peças "Turn your UI AI slop..." (3 imagens) e "From vibe-coded chaos..." (2 imagens), nenhuma imagem mostra o "antes". Todas são a tela polida. A legenda afirma a transformação e a imagem mostra só o resultado. A comparação lado a lado de verdade aparece em outras peças ("Before, After, A Smarter Task Board Experience", 1.064 views, e "Interface Before & After, A Cleaner Mobile UI", 1.057 views) e rende **menos** (índice 0,25 e 0,24). A promessa na legenda funciona melhor que a prova na imagem. Ver `../05-apresentacao/sequencia-do-post.md`.

**Por que funciona [INFERIDO]:** fala direto com a dor do fundador (tem um produto feito com IA e acha feio) e provoca designers ("é slop mesmo?"), que respondem. A resposta "the images you're sharing... They're pretty much slop, aren't they?" é o tipo de atrito que a peça recebe, e responder alimenta a conversa.

### 4. Pergunta ao público

**Fórmulas:**
- escolha: "which UI Design is better A or B?", "Which one is better ?🤔", "Light or Dark?...", "Clean or cluttered? What's your take?", "Decision time! Which one is better?", "Cooked or not?"
- nota: "Rate the UI", "Rate this 1-10.", "Rate the UI Bro! No fancy graphics, just functionality."
- opinião: "What do you think?", "How is it?", "Did we cooked?🍳", "Tell me whats wrong here?", "Criticise this design...", "Do you want to see the full screen?"

| família | período | peças | views med. | salvos med. | respostas med. | salvos/views | índice views | índice salvos |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| escolha A/B | último ano | 35 | 657 | 1 | **11** | 0,17% | 1,18 | 0,75 |
| nota | último ano | 33 | 649 | 2 | 7 | 0,34% | 1,03 | 1,00 |
| opinião | último ano | 60 | 662 | 3 | 10 | 0,41% | 1,32 | 1,25 |
| opinião | séries de produto | 6 | 5.678 | 46 | 9 | 0,80% | 1,91 | 1,54 |

A escolha A/B dá a maior contagem de respostas e a menor taxa de salvos da base. O recorde é "which UI Design is better A or B?" (36.242 views, 375 respostas, 122 salvos): o maior índice relativo do ano (50,8 vezes a semana), mas feito de gente votando, não guardando. Nas séries de produto o A/B quase some (1 peça, índice 0,13).

A pergunta de opinião colada numa tela forte ainda funciona: "Do you want to see the full screen?" (11.836 views, 133 salvos, 3 imagens, a terceira é a tela inteira) e "Tell me whats wrong here?" (6.461 views, 4 imagens).

**Quando usar:** A/B para puxar respostas quando o perfil está parado; pergunta de opinião como segunda linha de uma legenda que já nomeia o produto. Não usar A/B quando o objetivo é salvo ou lead.

### 5. Curta de clima ("Enjoy...", "Yoo🫡", emoji, vazia)

- "Enjoy..." (35.004 views, 416 salvos)
- "Yoo🫡" (17.553 views, 145 salvos, 3 imagens)
- "Enjoy the hierarchy!" (8.127 views, 138 salvos)
- legenda vazia (9.329 views)
- "👀", "😎", "🚧👀" (fase genérica, 127 a 228 views)

| período | peças | views med. | salvos med. | índice views | índice salvos |
|---|---:|---:|---:|---:|---:|
| último ano | 33 | 445 | 2 | 0,83 | 0,38 |
| séries de produto | 15 | 2.204 | 18 | 1,07 | 1,00 |

Rende conforme a imagem. Com um shot forte, "Enjoy..." deixa a tela falar e passa de 35 mil views. Com imagem fraca, some. **[INFERIDO]**

### 6. Tipo de tela ("Dashboard design", "Landing page design")

"Report/analytic page for an AI-powered hospital management platform." (19.015 views) é o melhor caso. No geral, índice 0,86 (último ano) e 0,84 (séries de produto), salvos 0,50 a 0,56. É a legenda de portfólio genérico: diz o gênero, não o benefício.

Na amostra recente, porém, a descrição seca virou o rótulo mais usado e rendeu bem: "UI design", "mobile app design", "page design" em mais da metade das peças, com o texto longo reservado para quando há história (o cliente, o redesenho, o design system). Ver o quadro "Numa amostra mais recente", abaixo.

### 7. Bastidor de cliente ("live now", "rejected", "approved")

- "Footer design for salesask. This one was rejected." (2.376 views)
- "The footer client approved and is live now." (1.231 views)
- "High-converting hero design. Live now." (2.547 views)
- "Going to be live soon! - Enjoy!" (8.059 views, só 13 salvos)

Índice de views 0,88 e de salvos **0,30**, o mais baixo entre as famílias com imagem. Serve para prova social ("tenho cliente real"), não para alcance nem salvo. **A exceção** é o bastidor que conta uma história de cliente sobre um produto de verdade: *"Client came with a vibe-coded mess and asked for a revamp. I explored 2 directions. This one got rejected. But still proud of this design."* (vídeo, 116.856 views, 2.355 salvos, a peça mais vista da amostra recente). Na mesma linha: "Wow, This one was rejected! But I love this design more!", "Saas Product redesign for Bolton!", "Redesigned the bench!".

### 8. Tese de UX em texto longo, com imagem

"Nobody quits a product because it has too much data. They quit because they can't figure out what to do with it." (286 views), "Most websites don't have a design problem. They have a clarity problem..." (272 views), "Hot take: A beautiful UI can still be difficult to use..." (471 views).

Índice 0,70 (último ano) e 0,52 (séries de produto). O texto compete com a imagem e perde, e sai de uso nas séries de produto.

### 9. Texto puro, sem imagem

Ver `o-que-performa.md`. Índice mediano **0,30** no último ano e **0,27** nas séries de produto, salvo mediano **zero**. Os melhores textos puros ("Are designer roles going to be dead?", 2.640 views, 14 respostas; "Omg! X is unreal. In less then 12 hours: 3 leads and meeting booked after posting this.", 1.896 views) ficam na faixa de uma peça de imagem mediana.

## Resumo das famílias, ordenado pelo índice de salvos (último ano) **[MEDIDO]**

| família | peças | índice views | índice salvos | uso recomendado |
|---|---:|---:|---:|---|
| frase de benefício | 32 | 1,26 | **1,86** | o shot forte da semana |
| pergunta de opinião | 60 | 1,32 | 1,25 | segunda linha, com tela forte |
| antes e depois declarado | 20 | 1,06 | 1,13 | aposta de alcance e respostas |
| pedido de nota | 33 | 1,03 | 1,00 | eventual |
| série de projeto | 99 | 0,86 | 0,86 | base diária, volume |
| escolha A/B | 35 | 1,18 | 0,75 | respostas, nunca salvo |
| tipo de tela | 66 | 0,86 | 0,50 | evitar como padrão |
| curta de clima | 33 | 0,83 | 0,38 | só com shot muito forte |
| tese longa | 6 | 0,70 | 0,33 | não usar com imagem |
| bastidor de cliente | 11 | 0,88 | 0,30 | prova social; com história de cliente, alcance |
| texto puro | 20 | 0,30 | 0,00 | conversa, não alcance |

## Numa amostra mais recente **[MEDIDO]**

154 peças em dez dias, com as legendas em três famílias:

| família | peças | views (mediana) | salvos (mediana) | exemplos |
|---|---:|---:|---:|---|
| cita o nome do produto | 21 | 4.321 | 52 | "Just designed saas platform for Clawback.", "Cool, clean SaaS UI Design for Leasflow." |
| pergunta ou isca de avaliação, sem nome | 31 | 3.348 | 44 | "Did I cook?", "Rate this UI ! 10 / ?", "Killing it, right?", "Do you like dark or light more?" |
| descreve a tela, sem nome nem pergunta | 102 | 4.090 | 52 | "Notification page UI design.", "Mobile app design", "Popup design!" |

- **Nomear o produto deixa de render menos** (diferente da série OrchestrateIQ, em que as peças nomeadas renderam bem abaixo); a pergunta-isca rende um pouco menos que a descrição seca.
- **A legenda vira rótulo curto e repetível**, e o texto longo fica para quando há história.
- **O bastidor do cliente** vira legenda ("This one got rejected") e faz a peça mais vista.

## Como reproduzir

Molde de legenda, em ordem de uso:

1. **Dia comum (60% das peças):** `Nome, AI Powered <o que faz> Product`, ou a descrição seca da tela ("Notification page UI design."). Até 60 caracteres, sem emoji, sem pergunta, sem hashtag.
2. **Melhor shot do dia (20%):** uma frase de benefício de 40 a 110 caracteres, escrita para o dono do produto: `<Verbo ou sensação> + <o que fica fácil>`. Ex.: "Track your fleet! AI-powered fleet management app.", "So many things on one screen, still seamless Experience."
3. **Uma ou duas vezes por semana:** a promessa de transformação ("Turn your AI slop into production-ready design.", "From vibe-coded chaos to polished product.") ou o bastidor com história de cliente.
4. **Segunda linha opcional:** uma pergunta curta que convida a resposta sem pedir voto: "Did I cook?", "Do you want to see the full screen?", "Tell me what's wrong here?"
5. **Nunca:** hashtag, link na peça, texto longo explicando a tela, A/B quando o objetivo é salvo.

Em português, para o dono, a mesma estrutura vale com a régua de clareza: nome + o que o produto faz, ou a frase de benefício dita pelo dono. A fórmula 3 ("slop") é gíria do nicho de designers no X; traduzida literalmente, perde o sentido. **[INFERIDO]**
