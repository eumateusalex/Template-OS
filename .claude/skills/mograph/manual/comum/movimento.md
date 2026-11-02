# O movimento

Como um elemento anda dentro da cena: a curva de cada papel, de onde ele vem, o que o prende ao
resto e o que dá causa a ele. A duração de um movimento, as famílias de duração, a saída de ~75%
da entrada, o intervalo da cascata, o borrão de 8 subquadros, a curva da marca e as curvas
proibidas moram na `/video` (`.claude/skills/video/regras-de-movimento.md`); as entradas daqui
apontam para lá e não repetem o número.

**No plano**: as curvas vêm de `ferramentas/curvas.js`, carregado antes das cenas. A curva que
passa do ponto (a mola, o `back.out`) leva o motivo em `excecoes` (`{ "curva": "back.out", "onde":
"S03", "motivo": "o cartão pousa" }`). O `regua-direcao.mjs curvas` reprova a curva proibida
(`bounce`, `elastic`) e avisa a mola sem motivo; o `oficio` avisa a peça com menos de 3 curvas e a
entrada só por opacidade. Os avisos são calibragem: a exceção escrita no plano os cala.

## A curva

### comum.movimento.curva-por-papel
- **estado**: proposta
- **quando**: todo movimento da peça. **Não quando**: o texto e o painel da marca, que usam a curva da marca (`--ease-marca` no `tokens.css`, a curva `marca` do `movimento.js`, na `/video`)
- **regra**: cada papel tem a sua curva, e elementos parecidos dividem a curva e a duração. A curva que passa do ponto (`batida`, `molaTarde`, `quique`, `cartao`) só vai onde `comum.movimento.mola-da-interface` deixa: no cartão, no selo e no botão de interface, nunca na palavra, no ícone solto nem no objeto que cai (este é a `queda`)
- **parâmetros** (30 qps): texto e painel que chegam, `pouso`, 12 q; o protagonista que entra, `heroi` (54% do caminho no primeiro décimo), 11 q; a câmera que anda muito e o chicote, `chicote`, 7 q; o movimento médio, `deslize`, 10 q; o cartão, o selo ou o botão de interface que bate no lugar, `batida` (passa 18% e volta), 10 q; o selo e o botão que pousam, `molaTarde` (passa 8%, tarde), 15 q; a opacidade e o desfoque, `esse`, 9 q; a deriva, o contador e a luz que sobe, `reta`, o tempo da cena; quem sai, `saida`, 13 q; o mergulho para dentro do corte, `mergulho`, 17 q; o aparelho grande que entra e o que volta para a tela, `rapida` (metade do caminho em 16% do tempo), 14 q (o aparelho inteiro, até 43); reenquadrar o aparelho e o push de tela, `camera` (quase parada nas pontas, 9,6× a velocidade média no meio), 14 a 20 q; o cartão que voa até o lugar dele, `voo`, 18 q; o que cai com peso, `queda` (acelera até o fim), 8 q; o cartão, o selo e o botão que saem do aparelho, `cartao`, 15 q
- **som**: nenhum
- **realiza**: `curva:pouso`; `curva:heroi`; `curva:chicote`; `curva:deslize`; `curva:batida`; `curva:molaTarde`; `curva:esse`; `curva:reta`; `curva:saida`; `curva:mergulho`; `curva:rapida`; `curva:camera`; `curva:voo`; `curva:queda`; `curva:cartao`

### comum.movimento.variedade
- **estado**: proposta
- **quando**: toda peça. **Não quando**: —
- **regra**: a peça mistura curvas e durações: a mesma curva com a mesma duração em tudo é o movimento de máquina. Dentro da cena, pouca repetição; entre as cenas, uma lenta e uma rápida
- **parâmetros**: pelo menos 3 curvas por peça; no máximo 2 movimentos com a mesma curva e a mesma duração por cena; a cena mais lenta dura 3× a mais rápida. O `oficio` avisa abaixo de 3 curvas (calibragem)
- **som**: nenhum
- **realiza**: `mao`

### comum.movimento.mola-da-interface
- **estado**: firme
- **quando**: o cartão, o selo e o botão que saem do aparelho ou pousam numa interface. **Não quando**: texto, câmera, push de tela ou saída (a mola ali é proibida na `/video`)
- **regra**: a mola é da interface. Uma mola visível por peça; o `quique` só com motivo escrito; passar do ponto em menos de 1 de cada 10 movimentos, e tarde. Na peça de interface, o cartão, o selo e o botão chegam com a `cartao`, escrita em `excecoes` do plano
- **parâmetros** (30 qps): a `cartao` passa 17% aos 4,8 quadros e assenta aos 11,7 (15 q no total); a `molaTarde` passa 8% perto de 72% do tempo; o `quique` passa 48%; menos de 1 overshoot a cada 10 movimentos
- **som**: `pop`, pico no ponto em que passa do lugar
- **realiza**: `curva:cartao`; `curva:molaTarde`; `curva:quique`; `motor:excecoes`

## A entrada

### comum.movimento.entra-por-movimento
- **estado**: proposta
- **quando**: todo elemento que entra. **Não quando**: a palavra da legenda (é do `reel/`)
- **regra**: nada nasce do zero e nada só aparece: o elemento entra por movimento, vindo de maior ou de fora. A opacidade sozinha é o padrão de quem não escolheu (proibido na `/video`)
- **parâmetros** (30 qps): de maior, escala de 1,15 a 1,6 → 1; a mediana de um movimento, ~10 q
- **som**: o gesto do elemento que entra, pico no pouso
- **realiza**: `mao`

### comum.movimento.antecipacao
- **estado**: proposta
- **quando**: o golpe, o pulo, o objeto que vai sair com força. **Não quando**: texto de leitura; o movimento que só desliza
- **regra**: antes do golpe, o objeto recua um pouco no sentido contrário, e o golpe sai dali
- **parâmetros** (30 qps): 4 a 6 q de recuo; o objeto recua 4 a 8%
- **som**: `riser` curto no recuo, ou nenhum
- **realiza**: `mao`

### comum.movimento.continuacao
- **estado**: proposta
- **quando**: o que está preso ao principal (a sombra, o sublinhado, o ícone). **Não quando**: o elemento solto, que tem a cascata dele
- **regra**: o que está preso chega depois do principal e assenta sozinho, como se fosse arrastado. Assenta com a curva do principal; com a `molaTarde`, só quando o principal é cartão, selo ou botão de interface
- **parâmetros** (30 qps): 2 a 4 q depois do principal
- **som**: nenhum
- **realiza**: `curva:pouso`; `curva:molaTarde`

### comum.movimento.achatar-e-esticar
- **estado**: proposta
- **quando**: objeto que anda rápido e pousa (o ícone, a bola, o selo). **Não quando**: texto de leitura; aparelho; foto
- **regra**: o objeto estica no pico da velocidade e achata no pouso, e volta à forma logo depois
- **parâmetros** (30 qps): 1,08 × 0,94 no pico de velocidade; 0,92 × 1,06 no pouso; de volta em 3 a 5 q
- **som**: `pop` ou `impacto`, pico no pouso
- **realiza**: `mao`

## A cascata e a saída

### comum.movimento.cascata-pela-importancia
- **estado**: proposta
- **quando**: um grupo de irmãos que entra junto. **Não quando**: um elemento só
- **regra**: os irmãos entram um depois do outro, na ordem da importância (não a do código), e cada cena tem a sua cascata. O intervalo e o teto do grupo são os da `/video`
- **parâmetros**: os da `/video` (cascata entre irmãos)
- **som**: o gesto de cada elemento, um por elemento, pico no pouso de cada um
- **realiza**: `mao`

### comum.movimento.saida-em-cascata
- **estado**: proposta
- **quando**: o grupo que sai antes da troca de cena. **Não quando**: a cena que sai pelo corte invisível, com o grupo andando junto
- **regra**: a saída também cascateia: o primeiro que entrou sai primeiro, e cada um contrai um pouco enquanto sai. Sem desfoque em toda saída (`comum.movimento.desfoque-em-toda-saida`)
- **parâmetros** (30 qps): 2 q entre os elementos; cada um contrai 4 a 7%; a duração da saída é a da `/video`
- **som**: nenhum, ou um `whoosh-curto` só no grupo
- **realiza**: `curva:saida`

## O borrão

### comum.movimento.gramatica-do-borrao
- **estado**: proposta
- **quando**: toda peça com movimento rápido. **Não quando**: —
- **regra**: a peça escolhe uma gramática de borrão e fica nela: o obturador integrado, **ou** o borrão direcional no eixo do movimento (pico na velocidade máxima, zero no pouso), **ou** passos secos. Nunca os dois borrões juntos. Onde o borrão é obrigatório (a velocidade por quadro), quem diz é a `/video`
- **parâmetros**: o obturador de 180° é o borrão de meio quadro; os subquadros são os da `/video`
- **som**: nenhum
- **realiza**: `biblioteca:borrao-de-obturador`; `registro:motion-blur`

## A cena e a causa

### comum.movimento.tres-fases
- **estado**: proposta
- **quando**: toda cena. **Não quando**: a cena de um corte só, mais curta que 1 s
- **regra**: a cena constrói, respira e resolve. Na respiração fica um movimento ambiente só, com destino (a deriva lenta, a luz que sobe), nunca em laço (`comum.estrutura.balanco-em-laco`). Cada elemento tem a entrada, o tempo parado e a saída dele
- **parâmetros**: constrói de 0 a 30% da cena; respira de 30 a 70%; resolve de 70 a 100%
- **som**: nenhum
- **realiza**: `curva:reta`

### comum.movimento.causa
- **estado**: proposta
- **quando**: todo efeito e toda reação que tem algo que a dispara. **Não quando**: —
- **regra**: a reação começa no quadro da causa, nunca logo depois: o dedo toca e o botão afunda no mesmo quadro, e o toque dispara a próxima coisa. A reação pesa pela massa: o grande volta devagar, o pequeno estala. Quando o efeito é brilho, partícula ou luz, a regra é `comum.efeito.evento`
- **parâmetros** (30 qps): atraso de 0 q entre a causa e o começo da reação
- **som**: o gesto da causa (`toque`, `clique`), pico no quadro da causa
- **realiza**: `biblioteca:toque-que-dispara`

## O que não entra

### comum.movimento.bounce-e-elastic
- **estado**: recusado
- **quando**: —
- **regra**: as curvas `bounce` e `elastic` são proibidas, em qualquer elemento; a mola tem lugar e número em `comum.movimento.mola-da-interface`. A proibição mora na `/video` (Proibidos)
- **parâmetros**: —
- **som**: —
- **realiza**: —

### comum.movimento.desfoque-em-toda-saida
- **estado**: recusado
- **quando**: —
- **regra**: o desfoque animado em toda entrada e toda saída: o `filter` que anda em posição fracionária diverge entre renders, e com ele em tudo o par idêntico do render vira sorte. O borrão entra só onde há velocidade de verdade (`comum.movimento.gramatica-do-borrao`), com `snap: 'x,y'` e `filter: 'none'` no fim; a saída cascateia e contrai, sem ele
- **parâmetros**: —
- **som**: —
- **realiza**: —
