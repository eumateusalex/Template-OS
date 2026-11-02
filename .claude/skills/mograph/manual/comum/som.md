# O som

Que gesto soa em qual ação, quando e quanto. A peça é desenhada no tempo do som: a cama de fundo
por baixo de tudo e um som por coisa que se vê agir, com o pico no quadro da ação. O resto do som
mora na `/video` e se lê lá, não aqui: achar, medir e a licença por destino, o efeito posicionado
pelo pico, a trilha que cai e o esvaziar antes do drop (`.claude/skills/video/som.md`); os tonais,
o arranjo, a voz na frente, os níveis e a janela do master (`.claude/skills/video/som-cinematografico.md`);
o relevo de cada efeito sobre a cama e o piso de cada papel (o `simula_mix.py --contexto` da `/video`).

**No plano**: no puro, o `som.json` da peça lista a trilha e os efeitos (cada um com `id`, `gesto`, `arquivo`,
`em`, `mais` e `vol`, e a `origem` ou o `motivo` quando o nome não diz o som do kit; a digitação pelo
`letras`), e o `ferramentas/som-do-puro.mjs` escreve os
`<audio>` pelo pico, no instante que a própria peça expõe. A régua `som` do `regua-direcao.mjs`
reprova o efeito a mais de 1 quadro da imagem e a peça sem a trilha ou sem a aprovação dela; a
`oficio` reprova a peça sem `<audio>` e conta os tipos de efeito; a `estimulo` conta cada efeito que
se ouve. No falado, o som é da `/cortes`.

## As regras de todo som

### comum.som.vem-primeiro
- **estado**: proposta
- **quando**: toda peça com trilha. **Não quando**: a linguagem em que a voz manda no tempo (aí o acerto cai na frase)
- **regra**: a trilha se mede antes do plano e a peça se desenha no tempo dela: o pico da peça cai no drop, e cada corte e cada acerto cai numa batida ou um pouco antes. Mapear os momentos da faixa, sem cortar mecanicamente em toda batida
- **parâmetros** (30 qps): o acerto na batida ou até 2 quadros antes (o mesmo número do corte, `comum.transicao.corte-seco`)
- **som**: nenhum (é a trilha que manda)
- **realiza**: `mao`

### comum.som.cama
- **estado**: proposta
- **quando**: toda peça: o ar do mundo entre os efeitos. **Não quando**: a trilha no tom já tem o drone (aí o drone é a cama)
- **regra**: o ar do mundo entra no quadro 0, bem baixo, e segura o vão entre os efeitos. Não substitui a trilha: a peça sem trilha, só com os sons dos componentes, soa vazia, e a trilha entra com a aprovação da pessoa, ouvindo (a regra e a régua moram na `/video`, `som.md`)
- **parâmetros**: —
- **som**: `cama`, ou `drone` com a trilha no tom
- **realiza**: `kit:som`

### comum.som.um-por-acao
- **estado**: firme
- **quando**: cada coisa que se vê entrar, andar ou bater. **Não quando**: o que não entra (o brilho que decai, a deriva da câmera): fica sem som
- **regra**: um som por elemento que entra, no gesto dele: o clique em cada clique do cursor, no quadro exato do clique; o `check` em cada tarefa cumprida; o `whoosh` em cada movimento e em cada transição; o `pop` no que nasce; a `contagem` no número que sobe; a `registradora` no valor. A mesma família varia entre 2 e 3 amostras, para não soar repetida
- **parâmetros**: 2 a 3 amostras por família
- **som**: o gesto de cada ação (o vocabulário dos gestos, § 4 do `README.md` do manual)
- **realiza**: `kit:som`

### comum.som.familias
- **estado**: firme
- **quando**: a peça em motion puro de 10 s ou mais. **Não quando**: o falado (o som é da `/cortes`); o estilo `documental` e a linguagem `so-efeitos`, que dispensam o piso
- **regra**: de 5 a 7 famílias de efeito por peça; de 10 s em diante, menos de 5 avisa. Acima de 8, o som em toda microanimação atrapalha
- **parâmetros**: 5 a 7 famílias; acima de 8 avisa. Hoje a régua `oficio` (o `somDaPeca`) avisa de 3 a 4 e abaixo de 3 (calibragem: a exceção escrita no plano cala); a régua do manual (`ferramentas/regua-manual.mjs`) avisa abaixo de 5 gestos a partir de 10 s, sem reprovar (padrão com exceção)
- **som**: as famílias são os gestos
- **realiza**: `mao`

### comum.som.pico-no-acerto
- **estado**: firme
- **quando**: todo efeito. **Não quando**: —
- **regra**: o pico do som cai no quadro da ação (o corte, o pouso, o clique, o toque); o ataque chega antes da entrada visual, e o whoosh começa antes e tem o pico no corte ou no pouso. A voz nunca se acelera para caber o som
- **parâmetros** (30 qps): o ataque 1 a 3 quadros antes da entrada visual; o pico a até 1 quadro do instante da peça (a régua `som` reprova acima disso); o whoosh curto, com o grave abaixo de 35% (o `ativos.py` mede o `grave_pct`)
- **som**: todos os gestos com pico
- **realiza**: `mao`

### comum.som.cascata
- **estado**: firme
- **quando**: o que entra em sequência (os balões, os pop-ups seguidos, a lista). **Não quando**: o elemento único
- **regra**: o que entra em cascata soa baixo, e os sons colados um no outro baixam mais
- **parâmetros**: volume de 0,14 a 0,22 na cascata; sons a menos de 0,15 s um do outro × 0,6. Quando o `em` do efeito é uma lista de instantes, o `som-do-puro.mjs` baixa 8% a cada item
- **som**: `pop` ou `clique`, um por item
- **realiza**: `kit:som`

### comum.som.impacto
- **estado**: firme
- **quando**: o pouso da ideia, de 1 a 3 vezes por peça. **Não quando**: em todo pouso
- **regra**: o impacto cai no quadro do acerto e é o som mais forte da peça; o golpe forte se gasta de 1 a 3 vezes
- **parâmetros**: 1 a 3 por peça; até 6 dB acima do pico local da trilha (8 no golpe-assinatura). O piso dele sobre a cama e o passa-altas junto do bumbo são da `/video` (`simula_mix.py --contexto`; `som-cinematografico.md` § 3)
- **som**: `impacto`, pico no quadro do acerto
- **realiza**: `kit:som`

### comum.som.silencio-antes-do-pico
- **estado**: proposta
- **quando**: logo antes do pico (o impacto, o drop, a revelação). **Não quando**: em toda virada
- **regra**: tirar o som por um instante antes do pico faz o pico bater mais; o riser pode parar seco antes do pico e deixar o silêncio bater
- **parâmetros** (30 qps): 3 a 8 quadros de silêncio; o riser que para seco, 2 a 4 quadros antes do pico. O silêncio não é efeito do `som.json`: no falado, é o `musica.cai` (o `som.md` da `/video`, "Montar"); no puro, a trilha é um clipe só, e o silêncio se corta no arquivo dela antes de ela entrar na peça
- **som**: `silencio`; `riser` que para seco
- **realiza**: `mao`

### comum.som.no-tom
- **estado**: proposta
- **quando**: todo som com altura (o plim, o golpe, o riser, o drone). **Não quando**: o som sem nota (a tecla, o clique, o whoosh)
- **regra**: o som com altura fica no tom da faixa ou no relativo dela; nunca o modo oposto na mesma tônica
- **parâmetros**: a nota medida de cada som contra o tom da trilha (`medir_audio.py nota` e `tom`, da `/video`)
- **som**: `plim`; `golpe-tonal`; `riser`; `drone`
- **realiza**: `kit:som`

### comum.som.riser
- **estado**: proposta
- **quando**: a tensão antes do pico, a surpresa, o final. **Não quando**: em todo corte; antes de um pico que não vem
- **regra**: o riser acaba no quadro do pico, ou para seco antes dele e deixa o silêncio bater (`comum.som.silencio-antes-do-pico`)
- **parâmetros**: dois risers na peça, com subidas de ~5,1 e ~3,7 s
- **som**: `riser`, pico no quadro do pico
- **realiza**: `kit:som`

### comum.som.do-kit
- **estado**: proposta
- **quando**: todo efeito. **Não quando**: —
- **regra**: cada gesto toca um arquivo do kit de som, que se conhece de ouvido; som fora do kit pede o `motivo` escrito no efeito do `som.json`, e sem ele reprova
- **parâmetros**: 3 a 5 arquivos por gesto no kit (`kit/som.json`), medidos e com o pico. A régua do manual confere o arquivo de cada efeito contra o gesto do kit (pelo nome que o `ativos.py trazer` grava, ou pela `origem`), e o `kit.mjs conferir` confere que todo arquivo do kit existe; o som certo para a cena segue sendo o ouvido de quem dirige e o olho do crítico
- **som**: todos
- **realiza**: `kit:som`

## As ações com som próprio

### comum.som.digitacao
- **estado**: firme
- **quando**: a cena de digitação dentro da interface (o campo de busca, a mensagem que se escreve). **Não quando**: o título solto digitado (é o amador)
- **regra**: cada letra digitada soa uma tecla, alternando dois cliques; o espaço não soa. A cena de digitação sem a tecla por caractere reprova. O que separa a refação profissional do vídeo feito por IA é esse som (e a câmera), não a digitação
- **parâmetros** (30 qps): uma tecla a cada 2 quadros, junto com a letra; dois cliques cortados de uma gravação, de 80 ms, com o pico nos primeiros 10 ms; de 20 a 22 dB abaixo da voz. Hoje o `som-do-puro.mjs` faz pelo `letras` do efeito (alterna `tecla-1.wav` e `tecla-2.wav`, o espaço mudo); a régua do manual reprova a peça que cita a digitação sem o efeito com `letras`
- **som**: `tecla`, pico no quadro de cada letra
- **realiza**: `biblioteca:busca-que-se-digita`

### comum.som.destaque-e-final
- **estado**: proposta
- **quando**: o destaque, a logo, a surpresa e o fim da peça. **Não quando**: —
- **regra**: o destaque e a logo soam como interface; a surpresa e o final são um riser com o pico no fim; o fecho pode levar um `plim`
- **parâmetros**: —
- **som**: `pop` ou `plim` no destaque e na logo; `riser`, pico no quadro do fim
- **realiza**: `mao`

### comum.som.efeito-empilhado
- **estado**: proposta
- **quando**: o kit não tem o som que a ação pede (a transição tecnológica). **Não quando**: o kit tem
- **regra**: dois ou três efeitos em sequência curta fazem um efeito novo (a onda, o glitch e o som de tecnologia fazem a transição tecnológica)
- **parâmetros**: até 3 efeitos
- **som**: os gestos empilhados, com o pico do último no quadro da ação
- **realiza**: `mao`

### comum.som.final-da-faixa
- **estado**: proposta
- **quando**: a peça com trilha que fecha na logo ou no fim. **Não quando**: a trilha que segue por baixo de outra peça (a vinheta)
- **regra**: o fim da peça usa o final da faixa: o recorte se monta para a última batida cair no fecho; a abertura pode vir de outro pedaço da mesma faixa, emendado com um fade curto
- **parâmetros**: —
- **som**: nenhum (é a trilha)
- **realiza**: `mao`
