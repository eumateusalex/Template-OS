# Respostas e rede: com quem conversar e como

## O que é

O trabalho fora das próprias peças: responder quem comenta e comentar na peça dos outros. Medido na aba "Respostas" de um perfil de designer de produto: 1.856 itens, sendo **924 respostas do perfil** e 932 posts de outras pessoas (os posts respondidos e os comentários recebidos).

**Limite da base [MEDIDO]:** as respostas cobrem seis meses; a aba não devolve mais que isso. O contador do perfil marca 6.752 publicações no total contra 917 peças próprias na base: a maior parte do que um perfil desses publica na vida são respostas.

## O volume **[MEDIDO]**

| mês | respostas |
|---|---:|
| 1 (só um dia) | 6 |
| 2 | **318** |
| 3 | 59 |
| 4 | 173 |
| 5 | 126 |
| 6 | 130 |
| 7 (22 dias) | 112 |

- 99 dias com pelo menos uma resposta; média de 9,3 respostas por dia ativo.
- Picos de 80 e 74 respostas em dois dias seguidos do mês 2 (uma rodada de comentários em massa) e de 40 num dia do mês 5.
- **O mutirão do mês 2 não fez o perfil crescer.** O mês teve 27 peças e views medianas de 406; o seguinte caiu para 5 peças e 180. O crescimento só vem quando o volume de peças com imagem sobe (os dois últimos meses). Comentar sozinho não basta. **[INFERIDO]** pelo cruzamento com `cadencia.md`.
- Na amostra mais recente de dez dias: 113 respostas a outras pessoas, 109 abaixo de 60 caracteres ("Outstanding", "Thank you", "Great job", "Let's get connected"); os perfis mais respondidos receberam de 2 a 5 respostas cada.

## Para onde vão as respostas **[MEDIDO]**

| destino | respostas | views medianas da resposta |
|---|---:|---:|
| **para fora**: na peça de outra pessoa | 674 (73%) | 33 |
| **para dentro**: respondendo quem comentou na própria peça | 250 (27%) | 15 |

A resposta em si quase não é vista (mediana de 15 a 33 views). O valor está em aparecer para quem publicou e para quem lê a conversa da peça alheia.

### Para fora: em que peça comentar

- 637 peças-alvo identificadas; 614 delas (96%) têm mídia (imagem ou vídeo).
- Views da peça-alvo: quartil de baixo 1.967, mediana **3.814**, quartil de cima 10.088. O comentário vai em peça que já está andando, não em peça parada.
- 290 perfis diferentes; os doze mais frequentes recebem de 9 a 24 respostas cada.
- Quem são esses perfis **[OBSERVADO]** nos textos das peças-alvo: designers de UI/produto que publicam shot de dashboard, card, app e interação ("workflow editor UI 🫠", "AI agent builder UI", "Interactive cards.", "Hiding row borders on hover", "Calendar with shadcn/ui, BaseUI & Motion"). O comentário vai para os pares do mesmo nicho, inclusive perfis maiores (peças de 84.701, 34.002 e 21.842 views).

### Para dentro: como responder quem comenta

Praticamente todo comentário que aparece na base tem resposta (242 de 242). **Cuidado:** a aba de respostas só traz o comentário quando houve resposta, então esse 100% é efeito da coleta, não taxa medida. O que dá para afirmar é que a resposta, quando vem, é rápida e curta.

- Latência mediana entre o comentário e a resposta: **0,5 hora**, cerca de 28 minutos (quartis 0,1 h e 1,5 h; 90% em até 4,2 h; a mais lenta, 45 h). Método: nas 242 respostas cujo campo "em resposta a" aponta para um comentário de outra pessoa feito numa peça do perfil, a diferença entre a data da resposta e a do comentário. Cada comentário tem uma resposta só, então n = 242, sem nenhum intervalo negativo. Contado a partir da peça original, e não do comentário, a mediana sobe para 3,1 h (quartis 1,5 h e 7,1 h, em 240 casos com a peça na base).
- Hora das respostas: pico entre 04h e 05h UTC e de novo às 12h e 15h UTC.

## O tipo de resposta **[MEDIDO]**

Tamanho mediano: **11 caracteres** sem a menção (90% têm até 35).

| tipo | respostas |
|---|---:|
| elogio ("looks good", "amazing work", "love it") | 442 |
| agradecimento ("thank you") | 196 |
| outro (conversa curta, piada, opinião) | 225 |
| só emoji | 38 |
| pergunta | 14 |
| informação (ferramenta, link, "live") | 9 |

As frases mais repetidas, literais: "thank you" (154), "looks good" (44), "amazing work" (22), "looks awesome" (21), "looks really awesome" (21), "love it" (18), "nice work" (18), "cool work" (17), "smooth and premium 🔥" (16), "impressive" (12), "great work" (11), "love the clarity and structure here" (10), "brilliant work" (10), "nicely crafted 🔥" (9), "the motion is so smooth. great job" (9), "brilliant work. keep it up" (9).

O elogio é genérico e repetido, mas cita um atributo do trabalho quando dá ("clarity and structure", "the motion is so smooth", "super intuitive layout 👀"). Na peça dos outros, nada de crítica, aula ou discussão.

Na própria peça, o tom muda um pouco: a dúvida técnica leva uma palavra de resposta, e a conversa sobre IA é segurada.

| comentário recebido | resposta |
|---|---|
| "Which tool you used for design?" | "Figma ❤️" |
| "Live demo link?" | "Not ready yet" |
| "You are rocking these days man, How are you so consistent?" | "Working hard 😓" |
| "Is this before or after" | "This is after" |
| "Do you use AI for design?" | "Of course use for idea and slop. But to get that level of UI you c[an't]..." |
| "Looks good man, just the sidebar looks too slop" | "haha, Tell me, How'd you approach?" |

A resposta longa vale quando defende uma decisão de design com o porquê: a defesa dos ladrilhos coloridos do construtor (*"Hugeicons Pro, stroke and rounded. On the density: those tiles are the type system, not decoration..."*, ver [../01-sistema-visual/iconografia.md](../01-sistema-visual/iconografia.md)) foi a resposta mais vista da amostra recente (851 views). Outras que valem guardar: *"Not a template! Will share the process with a time, for sure."*, *"Agree.. I meant to UX. The calm vibe actually comes when the user gets a better ux."* e *"Every designer should have a good enough knowledge about it."*

## Reciprocidade **[MEDIDO]**

- Dos 290 perfis comentados, 24 também comentaram de volta (na base).
- Dos 30 perfis mais comentados, 6 comentaram de volta.
- Dos 242 comentários recebidos na base, 66 (27%) vieram de alguém que recebe comentário do perfil.

A troca existe mas é assimétrica: o perfil comenta muito mais do que recebe de volta dessas pessoas. **[INFERIDO]** O comentário funciona mais como presença no nicho (ser visto pelos designers de referência e pelos seguidores deles) do que como acordo de troca.

## O que as pessoas comentam **[MEDIDO]**

242 comentários de terceiros na base: 146 com elogio, 12 com pergunta, 2 perguntando a ferramenta, 1 pedindo link. Os mais curtidos: "Is this before or after" (5), "clean work bro" (3), "the images you're sharing... They're pretty much slop, aren't they?" (2), "your own product coming?" (2), "Is it AI generated??" (1).

Quem comenta é, na maioria, outro designer. O fundador que compra aparece pouco em público: o contato chega por fora (ver abaixo).

## O caminho do contato: perfil e mensagem

Nada de link na peça: 0 de 503 peças próprias do último ano tem link externo **[MEDIDO]**. O funil está no perfil **[MEDIDO]**:

- **Bio:** a promessa em uma linha (o que desenha, para quem e o resultado: "negócio fechado") e o que está sendo construído.
- **Link do perfil:** uma agenda de consulta de 15 minutos.
- **Campo "localização":** um link de conversa direta no lugar da cidade.
- **Peça fixada:** "Enjoyable Saas UI that makes UX smoother..." (78.682 views e 865 salvos, a terceira mais vista e a terceira mais salva do ano).
- Selo de verificação pago e categoria profissional "Product Designer".

A peça e a bio contam a mesma história: um mês de produtos de IA e, na bio, o estúdio que está sendo montado em torno disso. **[INFERIDO]** O conteúdo das séries de produto é a vitrine da oferta. Ver [../00-oferta-e-venda/README.md](../00-oferta-e-venda/README.md).

A prova de que o funil funciona vem do próprio perfil, no dia seguinte à primeira peça grande: "Omg! X is unreal. In less then 12 hours: 3 leads and meeting booked after posting this." (citando a peça de 22.467 views).

**Dado que chama atenção [MEDIDO]:** cerca de 6 mil seguidores e mais de 1 milhão de views em 22 dias, com peças de 45 a 90 mil views. Entre duas leituras do mesmo dia, de 4 a 7 horas de distância, os seguidores foram de 6.154 para 6.208 (+54), enquanto só a peça "From vibe-coded chaos..." ganhou 17.559 views: em torno de 3 seguidores novos para cada mil views desse período. **[INFERIDO]** As views vêm da distribuição algorítmica (aba "Para você") e a peça é consumida por quem não segue. O objetivo de publicar é contato e referência salva, não base de seguidores.

## Como reproduzir

1. **Comentar para fora, todo dia, 5 a 15 vezes**, em peça de designer do mesmo nicho que já passou de ~2 mil views e tem imagem. Uma linha, elogio específico a um atributo ("love the clarity and structure here", "the motion is so smooth").
2. **Responder todo comentário na própria peça** em até algumas horas, com uma palavra quando for dúvida técnica, com uma pergunta de volta quando for crítica ("Tell me, how'd you approach?") e com o porquê quando a crítica for a uma decisão de design.
3. **Não ensinar nem discordar** em peça alheia. Discussão fica na própria peça, onde gera resposta.
4. **Funil no perfil, não na peça:** link de agenda curta na bio, conversa direta na localização, a melhor peça fixada. A peça nunca leva link.
5. **Não contar com o mutirão de comentário para crescer:** sem volume de peça com imagem forte, comentar não move o perfil.
