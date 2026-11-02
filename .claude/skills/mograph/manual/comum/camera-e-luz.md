# A câmera e a luz

O que a câmera faz e por quê, a distância entre as coisas e de onde vem a luz. O quadro é uma
câmera virtual que anda por cima de camadas em planos diferentes, e a luz é do mundo da peça, não da
paleta. A câmera parada é a vírgula; a que anda tem motivo.

**No plano**: cada cena diz a câmera (`camera`: `PARADA`, `EMPURRA`, `RECUA`, `DESCE`, `SOBE`,
`ACOMPANHA`, `REENQUADRA`, `MACRO`) e, quando ela não é `PARADA`, o `motivo` em até 6 palavras. O
`ferramentas/plano.mjs` confere o vocabulário e o motivo; quem constrói o movimento é a cena.

## A câmera

### comum.camera-e-luz.camera-virtual
- **estado**: proposta
- **quando**: toda cena com câmera que anda. **Não quando**: —
- **regra**: o quadro é uma câmera virtual: um invólucro em volta de todas as camadas, que escala e anda, com um escritor só do transform dele. O grupo que sai ou dá zoom junto vai num contêiner (o objeto nulo), que leva tudo de uma vez
- **parâmetros**: —
- **som**: nenhum
- **realiza**: `mao`

### comum.camera-e-luz.compensar-o-deslocamento
- **estado**: proposta
- **quando**: toda escala da câmera. **Não quando**: —
- **regra**: nunca escalar sem compensar o deslocamento: o centro do que se quer ver fica parado na tela enquanto o resto cresce em volta dele
- **parâmetros**: a conta em `.claude/skills/mograph/biblioteca/hyperframes-regras/rules/viewport-change.md`
- **som**: nenhum
- **realiza**: `mao`

### comum.camera-e-luz.camera-com-motivo
- **estado**: firme
- **quando**: toda cena. **Não quando**: —
- **regra**: a câmera é um dos sete movimentos desta seção, e cada um diz uma coisa só; todo movimento tem o motivo escrito; sem motivo, a câmera é `PARADA`. A câmera não se move o tempo todo
- **parâmetros**: o motivo em até 6 palavras (mais avisa); a câmera fora do vocabulário, ou sem motivo, reprova (`ferramentas/plano.mjs`)
- **som**: nenhum
- **realiza**: `mao`

### comum.camera-e-luz.parada
- **estado**: proposta
- **quando**: a vírgula: o que vem a seguir importa. **Não quando**: a cena inteira sem mais nada que ande
- **regra**: a câmera não faz movimento com sentido; o quadro continua vivo pela respiração da câmera e pelo mundo (`comum.camera-e-luz.camera-que-respira`), menos na vírgula, a única parada total
- **parâmetros**: —
- **som**: nenhum, ou `silencio` na vírgula
- **realiza**: `mao`

### comum.camera-e-luz.empurra
- **estado**: proposta
- **quando**: importância: olhe isto; o ganho, a solução, o ponto da frase. **Não quando**: o problema, o que não importa (aí é `recua`)
- **regra**: a câmera avança sobre o que importa; o sentido do zoom diz o que a frase vale, e o motivo escreve o porquê
- **parâmetros** (30 qps): 20 a 45 quadros; escala até 1,2× (`comum.camera-e-luz.escala-da-camera`)
- **som**: `whoosh-longo` baixo, ou nenhum
- **realiza**: `curva:camera`; `biblioteca:camera-que-empurra-em-camadas`

### comum.camera-e-luz.recua
- **estado**: proposta
- **quando**: consequência, ou algo maior chegando; o problema, o que não importa, mostrar onde a coisa mora. **Não quando**: o ganho ou o ponto da frase (aí é `empurra`)
- **regra**: a câmera se afasta e o contexto entra no quadro; o motivo escreve o porquê
- **parâmetros** (30 qps): 20 a 45 quadros
- **som**: `whoosh-longo` baixo, ou nenhum
- **realiza**: `curva:camera`

### comum.camera-e-luz.desce-e-sobe
- **estado**: proposta
- **quando**: progressão: o próximo item, o passo seguinte; a lista que se cumpre (é o pan natural do vertical). **Não quando**: a ideia muda (aí é corte)
- **regra**: a câmera desce ou sobe para o próximo; numa lista com cursor, ela sobe um passo a cada clique, e os itens só andam em posição, sem escala
- **parâmetros**: pan suave de 2 a 6 s, rápido de 0,5 a 2 s; na lista do exemplo (quadro de 1080 de altura), 200 px por passo
- **som**: `whoosh-longo` baixo no suave; `whoosh-curto` no rápido
- **realiza**: `registro:pan-stations`; `curva:camera`

### comum.camera-e-luz.acompanha
- **estado**: proposta
- **quando**: o olho segue uma coisa que anda: o cursor, o sinal pelo fio, a mensagem subindo. **Não quando**: a coisa para (aí a câmera para junto)
- **regra**: a câmera segue o que anda e para onde ele para (o cursor estaciona no canto do cartão e a câmera para ali); no clique que fecha, volta ao enquadramento de antes
- **parâmetros**: o tempo da coisa
- **som**: nenhum (o som é o da coisa que anda)
- **realiza**: `registro:cursor-zoom-follow`; `curva:camera`

### comum.camera-e-luz.reenquadra
- **estado**: proposta
- **quando**: mudança de contexto sem corte. **Não quando**: a ideia nova não nasce do que está na tela (aí é corte)
- **regra**: o elemento cresce ao centro e o resto sai do quadro
- **parâmetros** (30 qps): 20 a 45 quadros
- **som**: `whoosh-curto`
- **realiza**: `curva:camera`; `mao`

### comum.camera-e-luz.macro
- **estado**: proposta
- **quando**: descoberta: o detalhe que prova (o número, o erro). **Não quando**: o detalhe não é a prova
- **regra**: a câmera chega perto do detalhe e segura nele; é o único movimento que passa de 1,2×
- **parâmetros**: 0,8 a 3 s; escala até 3×
- **som**: `whoosh-longo` baixo, ou nenhum
- **realiza**: `curva:camera`; `mao`

### comum.camera-e-luz.escala-da-camera
- **estado**: proposta
- **quando**: toda câmera que escala. **Não quando**: —
- **regra**: a câmera vai até 1,2× fora do `macro`. O zoom de ênfase por significado (empurra e segura na palavra que importa) vai além, com o motivo escrito em `excecoes`
- **parâmetros**: padrão até 1,2×; `macro` até 3×; a ênfase de 1,5 a 1,8×; no zoom do falado, o `ferramentas/plano.mjs` avisa acima de 1,2× (a exceção escrita aceita) e reprova acima de 2×
- **som**: nenhum
- **realiza**: `curva:camera`; `mao`

### comum.camera-e-luz.camera-que-respira
- **estado**: proposta
- **quando**: todo plano, inclusive o de câmera `PARADA`. **Não quando**: a vírgula
- **regra**: a câmera nunca morre: um empurrão lento ou uma deriva leve mantém o quadro vivo. A respiração não é movimento com motivo e não conta como `empurra`. As duas frequências da deriva nunca são iguais (iguais dão diagonal mecânica). Quem vive pode ser o mundo: o objeto segura parado enquanto a luz, o fundo ou a câmera andam (os balões que pousaram continuam subindo devagar); o que conta é o quadro inteiro, não o objeto, e o grão sozinho não basta
- **parâmetros**: escala de 1 a 1,04–1,08 em 3 a 6 s (`reta` ou `esse`), ou deriva de 6 a 14 px em X e Y; na espera que não é a vírgula, a câmera anda 2 a 5% numa direção só, nunca em laço (`comum.estrutura.balanco-em-laco`); com as frequências na razão ~1,3; no exemplo medido, o objeto segura até 11 s com o fundo andando; a régua `parado` (`ferramentas/parado.mjs`) mede o quadro inteiro e apaga o grão pela média
- **som**: nenhum
- **realiza**: `curva:reta`; `curva:esse`; `mao`

### comum.camera-e-luz.giro-em-volta
- **estado**: proposta
- **quando**: em volta de um objeto 3D cuja forma é a ideia (o ícone do app, o aparelho, a marca em volume), uma vez por peça. **Não quando**: em volta de um objeto plano; duas vezes na peça
- **regra**: a câmera gira em volta do objeto herói; o 3D é evento, não estilo
- **parâmetros**: uma por peça
- **som**: `whoosh-longo`
- **realiza**: `kit:3d`; `biblioteca:objeto-3d-na-luz`; `biblioteca:aparelho-real-em-3d`

## A profundidade

### comum.camera-e-luz.tres-planos
- **estado**: proposta
- **quando**: toda cena de animação. **Não quando**: —
- **regra**: duas camadas ou mais em toda cena; com a câmera andando, três planos em parallax: a frente desfocada, o principal nítido, o fundo mais quieto. Camadas na mesma velocidade parecem chapadas
- **parâmetros**: o parallax a 1,5×, 1× e 0,5× da velocidade da câmera (frente, meio, fundo); a frente desfocada de 6 a 14 px, com opacidade de 0,5 a 0,8
- **som**: nenhum
- **realiza**: `biblioteca:camera-que-empurra-em-camadas`; `registro:camera-rig-depth-stack`

### comum.camera-e-luz.foco-simulado
- **estado**: proposta
- **quando**: mostrar onde olhar. **Não quando**: o texto que se precisa ler
- **regra**: o desfoque separa o que importa do resto; o texto que se lê nunca fica borrado, e 20 px em texto lê como defeito
- **parâmetros**: pico de 10 px em texto e de 18 a 20 px em superfície cheia
- **som**: nenhum
- **realiza**: `mao`

### comum.camera-e-luz.eixo-z
- **estado**: proposta
- **quando**: a profundidade com causa: o texto que chega da câmera, o cartão que vem do fundo. **Não quando**: sem causa na cena
- **regra**: o objeto anda no Z com perspectiva: o texto sai da câmera (entra grande e diminui até caber inteiro); o cartão entra do fundo girando no próprio eixo e para no centro
- **parâmetros**: —
- **som**: `whoosh-curto`
- **realiza**: `mao`

## A luz

### comum.camera-e-luz.luz-com-direcao
- **estado**: proposta
- **quando**: todo quadro. **Não quando**: —
- **regra**: a luz se escreve como numa foto: uma luz principal com direção, um contorno que separa o objeto do fundo, a queda para a sombra e a sombra de contato em todo objeto que pousa. A luz é do mundo, não da paleta, e a cor da marca vira luz mais do que tinta
- **parâmetros**: a sombra de contato é uma elipse achatada sob o objeto (no exemplo medido, 300 × 40 px a 18%); a luz feita em código fica atrás do texto e da interface na pilha (por cima, ela tapa a letra e o `check` acusa a oclusão)
- **som**: nenhum
- **realiza**: `mao`

### comum.camera-e-luz.luz-de-janela
- **estado**: proposta
- **quando**: a peça pede um lugar. **Não quando**: a cena é o próprio objeto sobre o chão da marca
- **regra**: uma luz quente de janela num canto e a sombra de persiana andando devagar, bem fracas, como parte do cenário: é luz do mundo, ligada a peça inteira como o grão (`comum.efeito.grao`), e não efeito. A mancha colorida atrás do objeto continua fora (`comum.mundo.papel-de-parede`)
- **parâmetros**: a elipse de 1500 × 1300 px, desfoque de 190 px, opacidade de 0,75, derivando 40 × 24 px em frequências de 0,35 e 0,27 rad/s; a persiana em listras de 30 px a cada 75 px, giradas 24°, desfoque de 14 px, andando 4,2 px/s, a no máximo 8% de opacidade
- **som**: nenhum
- **realiza**: `mao`

## O que não entra

### comum.camera-e-luz.camera-inclinada
- **estado**: recusado
- **quando**: —
- **regra**: a câmera inclinada (dutch) está fora do vocabulário de câmera da skill, e o `ferramentas/plano.mjs` reprova a câmera que não é dele
- **parâmetros**: —
- **som**: —
- **realiza**: —
