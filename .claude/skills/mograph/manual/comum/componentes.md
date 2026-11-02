# Os componentes

O que entra por cima da base com cor e volume: o ícone, o aparelho, a interface, o selo, o cursor,
o elemento que dá causa. A base é a da marca (o fundo e a letra); o charme é o componente. A
interface de iPhone sai dos construtores do `ferramentas/ios.cjs` (pelo `ios-vivo.mjs`), e o CSS
das classes `.ios-*` da marca manda na fonte, no tamanho e no registro deles. O movimento de cada componente segue `comum/movimento.md`; o brilho e a onda do
toque são de `comum/efeito.md`; o objeto 3D e o produto são de `filme/3d-e-gerado.md`.

**No plano**: o componente da cena vai em `componente`; a curva que passa do ponto no cartão, no
selo e no botão leva o motivo em `excecoes` (`comum.movimento.mola-da-interface`).

## O charme

### comum.componentes.charme-premium
- **estado**: firme
- **quando**: todo componente que entra por cima da base. **Não quando**: —
- **regra**: o charme é premium, do lado do sistema do celular: o ícone oficial do app, o vidro do sistema, o aparelho de verdade, o emoji do sistema, a foto real tratada. Nunca o banco de ícones genérico (`comum.componentes.icone-generico`). O emoji e a imagem de clip-art não entram; o objeto, o emoji ou a foto que o kit não tem se gera pelo `/gerar-imagem`, no estilo que a peça pedir, e passa pelo olho de quem dirige antes de entrar
- **parâmetros**: —
- **som**: nenhum
- **realiza**: `mao`

## A interface

### comum.componentes.kit-vivo
- **estado**: proposta
- **quando**: toda interface de celular que aparece em movimento (a conversa, o alerta, a busca, o widget, o menu, o app do sistema). **Não quando**: a interface de terceiro (`comum.componentes.interface-de-produto-real`); a conversa do aplicativo de mensagens verde, que é a `comum.componentes.whatsapp`, nunca o `ios:conversa`
- **regra**: a interface sai dos construtores do `ios.cjs` e anda com os comportamentos da biblioteca. O que o construtor dá entra pelo `fonte/ios.json` (`{ "<id>": { "construtor": "mail", "args": { ... } } }`), que o `ios-vivo.mjs` grava em `ativos/ios.js` como `window.IOS` (o `montar-puro.mjs` o gera de novo antes de embutir) e a página usa por `el.innerHTML = IOS.<id>`; nunca se copia à mão nem se redesenha; a parte do app que o kit não tem (o cabeçalho, a barra de baixo, um ícone) se desenha nas medidas do construtor mais próximo, também com o `motivo_mao`. O espaçamento, a entrelinha e o respiro entre os blocos vêm do construtor, e o tamanho se troca pelo `--ios-pt`, nunca pelas medidas
- **parâmetros**: `--ios-pt` de 2 px no quadro de 1080 (a tela de 390 pt vira 780 px); abaixo de 2, não; `vidro: true` no alerta e no menu (o volume e a chamada de vídeo já saem no vidro)
- **som**: o gesto de cada peça da interface (`notificacao`, `pop`, `tecla`, `clique`)
- **realiza**: `ios:conversa`; `ios:bolha`; `ios:digitando`; `ios:reacoes`; `ios:resposta`; `ios:alerta`; `ios:toast`; `ios:menu`; `ios:busca`; `ios:campo`; `ios:safari`; `ios:ilha`; `ios:hud`; `ios:facetime`; `ios:lembretes`; `ios:notas`; `ios:evento`; `ios:dias`; `ios:mail`; `ios:mailNovo`; `ios:alarmes`; `ios:widget`; `ios:widgets`; `ios:pilha`; `ios:chips`; `ios:automacao`

### comum.componentes.vidro-do-ios
- **estado**: proposta
- **quando**: a notificação, o widget, o alerta e o menu translúcidos sobre a foto, o vídeo ou a câmera. **Não quando**: sobre o fundo chapado (o vidro some, porque não tem o que desfocar)
- **regra**: o vidro do sistema desfoca o que está atrás dele, e só funciona com alguma coisa atrás. O vidro que refrata a letra vale para o título sobre a imagem, uma vez
- **parâmetros**: —
- **som**: nenhum
- **realiza**: `ios:alerta`; `ios:menu`; `ios:hud`; `ios:facetime`; `ios:widget`; `registro:ios26-liquid-glass`; `registro:liquid-glass-widgets`; `registro:vfx-liquid-glass`; `registro:glass-hero`

### comum.componentes.notificacao-de-vidro
- **estado**: proposta
- **quando**: o aviso que chega e prova que algo aconteceu (a mensagem, a reserva, o pagamento). **Não quando**: a notificação que não diz nada da história; sobre o fundo chapado
- **regra**: a notificação chega no vidro do sistema, sobre algo que se desfoca atrás, assenta e é tocada: no verbo da ação ela afunda como sob o dedo, e o toque dispara a próxima coisa. A notificação é a pilha na ordem do tempo (`biblioteca:notificacoes-que-se-acumulam`); não há construtor no `ios.cjs` para ela
- **parâmetros**: —
- **som**: `notificacao`, pico no quadro em que ela pousa
- **realiza**: `biblioteca:notificacao-de-vidro-tocada`; `biblioteca:notificacoes-que-se-acumulam`; `registro:liquid-glass-notification`

### comum.componentes.conversa
- **estado**: proposta
- **quando**: a história que acontece numa troca de mensagens. **Não quando**: a conversa que não conta a história (vira texto para ler); a conversa do WhatsApp (`comum.componentes.whatsapp`)
- **regra**: a conversa acontece na ordem: quem pergunta, quem responde. As mensagens chegam uma a uma e empurram as de cima, como na conversa de verdade, e os três pontos vêm antes da resposta. A foto do contato é neutra (a inicial) ou de quem autorizou
- **parâmetros**: —
- **som**: `pop` em cada bolha, pico no pouso dela; a bolha que é o pico da peça leva o `impacto` no lugar do `pop` (um som por ação, `comum.som.um-por-acao`)
- **realiza**: `ios:conversa`; `ios:bolha`; `ios:digitando`; `ios:reacoes`; `ios:resposta`; `biblioteca:conversa-que-sobe`; `biblioteca:pontinhos-digitando`

### comum.componentes.whatsapp
- **estado**: proposta
- **quando**: a história que acontece no WhatsApp (o cliente que escreve, o atendimento que responde), com a marca na conversa. **Não quando**: a conversa com a IA, que é o iMessage (`comum.componentes.conversa`); a peça cuja força é parecer a conversa de verdade, que é a `comum.componentes.conversa-nas-cores-do-app`
- **regra**: o celular em foto (`comum.componentes.iphone-de-verdade`) com a conversa nas cores da marca, nunca o `ios:conversa`; sem o verde e sem o logo do WhatsApp. A mensagem automática leva um selo que diz que é automática: sem ele a peça promete atendimento pessoal que não existe. A ordem e o som são os da `comum.componentes.conversa`
- **parâmetros**: a moldura e o fundo do celular pelo fundo da cena
- **som**: `pop` em cada bolha, pico no pouso dela; a bolha que é o pico da peça leva o `impacto`
- **realiza**: `mao`; `biblioteca:conversa-que-sobe`; `biblioteca:pontinhos-digitando`

### comum.componentes.conversa-nas-cores-do-app
- **estado**: firme
- **quando**: a peça cuja força é parecer a conversa de verdade (o cliente que escreve às 23 h e é respondido). **Não quando**: a peça que quer a marca na conversa (`comum.componentes.whatsapp`); nunca o logo oficial nem o aparelho com marca à mostra
- **regra**: a conversa com as cores reais do aplicativo de mensagens: o fundo bege com a textura de pontos, a bolha enviada verde-clara com o tique duplo azul, o botão de enviar verde; o ícone do contato é neutro (o balão contornado sobre o verde), nunca o logo. Contra a da marca, ela ganha em verdade e perde em marca
- **parâmetros**: o fundo `#efeae2`; a bolha enviada `#d9fdd3` com o texto `#111b21`; o tique `#53bdeb`; o enviar `#00a884`; o ícone `#25D366`; a bolha com raio de 15 px no celular de 390 pt
- **som**: o da `comum.componentes.conversa`: `tecla` na digitação, `pop` em cada bolha
- **realiza**: `mao`

### comum.componentes.busca
- **estado**: proposta
- **quando**: o gesto de procurar (o cliente procura o negócio, a pergunta vai para a busca). **Não quando**: a busca de um produto de terceiro com a cara dele (`comum.componentes.interface-de-produto-real`)
- **regra**: a barra de busca abre, a palavra se digita nela (`comum.tipografia.digitacao-na-interface`), e o toque na lupa ou no resultado vira a passagem para a cena seguinte (`comum.transicao.efeito-vira-a-cena`)
- **parâmetros**: os da digitação
- **som**: `tecla` em cada letra; `clique` no toque que vira a cena
- **realiza**: `ios:busca`; `ios:safari`; `biblioteca:busca-que-se-digita`; `biblioteca:barra-do-safari-que-carrega`

### comum.componentes.interface-inventada-com-identidade
- **estado**: proposta
- **quando**: a interface que a peça inventa para contar a história (a reserva da padaria, o pedido que chega). **Não quando**: a interface de um produto real
- **regra**: a interface inventada tem identidade: nome, hora e frase específicos, nunca o genérico ("Seu Negócio"). Ela se declara ilustrativa na página de revisão
- **parâmetros**: —
- **som**: nenhum
- **realiza**: `mao`

## O ícone, o emoji e a foto

### comum.componentes.icone-do-app
- **estado**: proposta
- **quando**: o app que é onde a história acontece (onde o cliente procura, onde a mensagem chega). **Não quando**: o ícone que só enfeita; o ícone de banco (`comum.componentes.icone-generico`)
- **regra**: o ícone oficial do app entra como símbolo, com o canto do sistema e a sombra de contato, e pousa: nunca flutua solto. A luz passa nele uma vez (`comum.efeito.varredura-de-luz`). A tela do app continua genérica
- **parâmetros**: até 256 px na tela (o arquivo do ícone tem 512 px)
- **som**: `pop`, pico no pouso
- **realiza**: `biblioteca:icone-3d-que-pousa`

### comum.componentes.emoji-do-sistema
- **estado**: proposta
- **quando**: a reação ou a figurinha que diz o sentimento da cena. **Não quando**: dois na mesma cena; o emoji que repete a palavra que já está na tela
- **regra**: o emoji é o do sistema, no desenho da Apple do material (`material/emoji/`), no tamanho dele, e entra como reação: pousa ao lado da palavra que tem objeto e reage, e sai mais curto que entrou
- **parâmetros**: até 160 px na tela (o PNG tem 160 px: acima disso, amacia); um por cena no máximo
- **som**: `pop`, pico no pouso
- **realiza**: `ios:emoji`; `biblioteca:emoji-que-toca`

### comum.componentes.foto-real-tratada
- **estado**: proposta
- **quando**: a foto do negócio ou do assunto que prova que é de verdade. **Não quando**: a foto chapada, parada e reta (lê como print)
- **regra**: a foto real entra tratada: anda devagar, inclina em perspectiva e ganha a sombra longa
- **parâmetros**: aproximação lenta de 1 → 1,04 no tempo da cena; inclinação em perspectiva de 6 a 10°
- **som**: nenhum
- **realiza**: `curva:reta`; `mao`

## O aparelho

### comum.componentes.iphone-de-verdade
- **estado**: firme
- **quando**: a tela que precisa de um aparelho em volta. **Não quando**: a interface que entra solta, sem aparelho
- **regra**: o aparelho é de verdade: a moldura em foto, com a tela viva dentro. O aparelho desenhado em código é recusado (`comum.componentes.aparelho-em-codigo`)
- **parâmetros**: —
- **som**: nenhum
- **realiza**: `mao`

### comum.componentes.iphone-em-3d
- **estado**: proposta
- **quando**: o aparelho que gira, se inclina ou mostra a lateral. **Não quando**: a moldura de frente basta
- **regra**: o modelo 3D real do aparelho, com a tela viva mapeada nele, no lugar da moldura em foto. Sem o modelo, o aparelho de frente balança em 3D de verdade (a perspectiva do palco, não a escala que finge giro)
- **parâmetros**: o balanço de frente: perspectiva de 1900 px, o giro em Y de ±7° em torno de -14°, devagar e sem parar; na camada em 3D, `font-feature-settings: normal` (o navegador alterna as variantes da letra entre as camadas e a letra troca de desenho no meio do plano)
- **som**: `whoosh-longo` no giro, ou nenhum
- **realiza**: `biblioteca:aparelho-real-em-3d`; `registro:vfx-iphone-device`

### comum.componentes.celular-que-chega-e-revela
- **estado**: proposta
- **quando**: mostrar o produto dentro do aparelho. **Não quando**: o aparelho já está na cena
- **regra**: o celular entra de lado, rápido, gira e pousa revelando a tela ou o cartão dentro dela
- **parâmetros** (30 qps): curva `rapida`, 14 q (o aparelho inteiro atravessando o quadro, até 43 q)
- **som**: `whoosh-curto` na entrada, pico no pouso
- **realiza**: `biblioteca:celular-que-chega-e-pousa`; `curva:rapida`

## O selo, a pílula e o contador

### comum.componentes.selo-com-o-valor
- **estado**: proposta
- **quando**: o número é a oferta real e está preso ao que o causa. **Não quando**: o número decorativo, que nenhuma fala diz (é slide de número)
- **regra**: o selo com o valor pousa ao lado do que o causa, com a mola tarde e um brilho curto
- **parâmetros** (30 qps): curva `molaTarde`, 15 q
- **som**: `registradora` quando é dinheiro, senão `pop`, pico no pouso
- **realiza**: `biblioteca:selo-com-o-valor`; `curva:molaTarde`; `registro:spring-pop`

### comum.componentes.pilula-de-acao
- **estado**: proposta
- **quando**: a chamada final (para onde ir, o que tocar). **Não quando**: no meio da peça
- **regra**: a chamada numa pílula, e a seta chega depois dela
- **parâmetros** (30 qps): a seta 4 q depois da pílula
- **som**: `pop` na pílula, pico no pouso
- **realiza**: `biblioteca:pilula-de-acao`; `registro:cta-close`

### comum.componentes.contador-por-quadro
- **estado**: proposta
- **quando**: o número que sobe até um dado. **Não quando**: o número que só enfeita
- **regra**: o número troca um valor por quadro, em passos que diminuem até o fim, e o valor de dado termina quebrado (nunca redondo de mentira)
- **parâmetros** (30 qps): 1 valor por quadro
- **som**: `contagem` durante a subida; `plim` no valor final
- **realiza**: `biblioteca:contador-por-quadro`; `biblioteca:contador-que-sobe-e-assenta`

### comum.componentes.elemento-que-volta
- **estado**: firme
- **quando**: a peça com partes (três erros, quatro passos). **Não quando**: a peça sem partes; o contador de capítulo ("02 / 04"), proibido na `/video`
- **regra**: um componente só atravessa a peça e mede o avanço: volta a cada parte mudando de estado (o 1, o 2, o 3 enchendo) e muda de papel, de lugar ou de escala, com a mesma forma e a mesma cor. Inteiro e no centro só no fecho: o fim é o começo mudado. Preso na mesma coordenada em três cenas, ele lê como marcador de página
- **parâmetros**: um por peça. O `cromo` avisa o objeto preso (calibragem: a exceção escrita no plano o cala)
- **som**: o mesmo gesto a cada volta, pico na mudança de estado
- **realiza**: `biblioteca:partes-que-enchem`

## O cursor e o agente

### comum.componentes.elemento-vivo
- **estado**: proposta
- **quando**: a peça de interface em que as coisas precisam de causa. **Não quando**: a peça sem interface
- **regra**: um agente único dá causa ao que acontece: toca, liga a chave, desenha a linha, abre a onda (`comum.efeito.onda-do-toque`). Espera parado no fim da legenda, só se move com função, some quando a cena troca e renasce no próximo alvo. Com ele, todo efeito tem um toque
- **parâmetros**: o toque, escala 100 → 70 em 2 q (30 qps) e volta em 0,3 s; some em 0,17 s; viaja em 0,27 a 0,5 s
- **som**: `toque`, pico no quadro do toque
- **realiza**: `biblioteca:elemento-vivo`; `biblioteca:linha-desenhada-pelo-agente`; `biblioteca:clique-que-pula`; `biblioteca:toque-que-dispara`

### comum.componentes.cursor-que-estaciona
- **estado**: proposta
- **quando**: o cursor que clica numa interface de computador. **Não quando**: a interface de celular (aí é o toque, `comum.componentes.elemento-vivo`)
- **regra**: o cursor anda em curva, para antes do alvo, aperta, e o alvo responde logo depois. O cursor é arredondado, preto com contorno branco; a cruz não entra
- **parâmetros** (60 → 30): até a primeira opção, 10 q; entre uma opção e a seguinte, 7 a 8 q; o alvo responde 1 q depois do aperto
- **som**: `clique`, pico no aperto
- **realiza**: `biblioteca:cursor-que-estaciona`

### comum.componentes.lista-que-se-cumpre
- **estado**: proposta
- **quando**: a tarefa que se cumpre, item a item. **Não quando**: a lista que só se lê
- **regra**: os checks marcam em escadinha, cada item com o risco, um depois do outro
- **parâmetros** (60 → 30): de 2,5 a 5 q entre um check e o seguinte (o ritmo do check, medido; a cascata de entrada, de 2 a 4 q, é a da `/video`)
- **som**: `check` em cada item, pico no quadro do check
- **realiza**: `ios:lembretes`; `registro:marker-checklist-card`; `registro:success-check`

## O que não entra

### comum.componentes.icone-generico
- **estado**: recusado
- **quando**: —
- **regra**: o ícone de banco e o clip-art (escudo, troféu, foguete, lâmpada) são o genérico que apaga a peça; fica o ícone do app real e o objeto que é a ideia. A proibição do clip-art mora na `/video` (`regras-de-movimento.md`, Proibidos). O recusado é o ícone que enfeita a ideia por metáfora (a lâmpada da ideia, o foguete do crescimento); o objeto 3D do kit entra quando a frase nomeia a coisa (`comum.efeito.objeto-3d`)
- **parâmetros**: —
- **som**: —
- **realiza**: —

### comum.componentes.aparelho-em-codigo
- **estado**: recusado
- **quando**: —
- **regra**: o aparelho desenhado em código (a moldura em CSS) lê como maquete pobre: o aparelho é a moldura em foto (`comum.componentes.iphone-de-verdade`)
- **parâmetros**: —
- **som**: —
- **realiza**: —

### comum.componentes.interface-de-produto-real
- **estado**: recusado
- **quando**: —
- **regra**: a interface de um produto de terceiro desenhada com a cara dele não entra: a tela de terceiro entra genérica, e o terceiro aparece só pelo ícone oficial (`comum.componentes.icone-do-app`)
- **parâmetros**: —
- **som**: —
- **realiza**: —

### comum.componentes.icone-que-treme-por-filtro
- **estado**: recusado
- **quando**: —
- **regra**: o ícone que treme por um mapa de deslocamento fere o determinismo do render: o `filter` animado por quadro diverge entre renders
- **parâmetros**: —
- **som**: —
- **realiza**: —
