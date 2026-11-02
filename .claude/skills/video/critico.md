# O crítico

Quem construiu a peça não a julga. O crítico é um subagente novo
(`general-purpose`), que recebe o roteiro, o código e as folhas, e começa
reprovando. O comum é ele reprovar mais de uma vez, com consertos precisos
(prova escondida pelo contador, 8 s no mesmo plano, celular atravessando o
painel), e as notas subirem de 4 a 6 para 8 ou mais. Quando a `/video` já roda
dentro de um subagente, ele não lança outro: vale "Quando a skill roda num
subagente", abaixo.

## As folhas

```bash
node .claude/skills/video/ferramentas/folhas.mjs <mp4> <pasta> --rapidos <t1,t2,...>
```

- `folha-2fps.png`: o vídeo inteiro, 8 colunas, meio segundo por quadro
- `tira-<t>s.png`: 12 quadros em 2 s a partir de cada movimento rápido (toque, drop, morph, saída)
- `celular-<t>s.png`: 8 quadros a 360 px, a largura do Reel no celular (o 0 e o último entram)

E as duas folhas de número, que vão junto (`linguagens.md`, "Medir"): a de som, `simula_mix.py
<peça> --contexto --grade <bpm>,<primeira batida>` (o relevo e a batida), e a de ritmo,
`medir_ritmo.py <mp4> --linguagem <id> --respiro <de>-<ate>`. O crítico não ouve: sem a folha de som,
ele dá nota de som às cegas, e efeitos 19 dB abaixo da trilha passam como "ok".

O `/watch` (plugin opcional) não substitui as folhas: ele escolhe quadro pelo
codificador, e num motion de 21,5 s o modo leve pega só 4 quadros. O lugar dele
é a referência que chega por link.

## O prompt

Antes de enviar, troque `<quem assina>` pelo nome do usuário ou do produto (de
`_memoria/empresa.md`) e `<linguagem>` pelo campo "Linguagem" do roteiro, com as
recusas da marca (o `recusas` do `identidade/marca.tokens.json` e as recusas <!-- caminho futuro: o arquivo da marca nasce no /marca configurar -->
visuais do `identidade/marca.md`). <!-- caminho futuro: os dois nascem no /marca configurar -->

> Você é um diretor de motion exigente e NÃO construiu esta peça. Comece
> reprovando. Leia o roteiro (`roteiro.md`), o código (`index.html`) e abra
> todas as imagens das folhas. Antes de qualquer nota, descreva cada quadro da
> folha de 2 qps em uma frase, sem julgar: a frase que começa com "um cartão
> sobre uma cor chapada" é um quadro de slide. Dê nota de 1 a 10, com uma linha de motivo, para:
> gancho nos 2 primeiros segundos; leitura no tamanho do celular (acento e
> cedilha certos; a palavra que importa maior e na cor, o resto pequeno; com
> fala, a legenda em duas vozes); qualidade do movimento (chegada rápida e macia, nenhum
> quadro parado acima de 0,75 s fora da vírgula, o fim parado até 1,4 s, nenhum
> movimento rápido seguido de parada seca, um movimento principal por vez, cada
> objeto nascendo de dentro ou em volta do anterior, nenhum sem parentesco com o
> que veio antes); variedade e ritmo; composição e hierarquia
> (um foco por quadro, as faixas do Instagram livres: a zona do destino está
> em `ferramentas/formatos.json`); clareza da história; marca (a base nas cores da marca, a cor e o
> volume nos componentes; brilho, degradê, partícula e 3D só como evento com causa, nunca como
> papel de parede, e nada com cara genérica de IA); acabamento premium (tem camadas,
> profundidade e edição, ou parece cru: fundo chapado com um objeto no meio);
> som (um som por coisa que entra, os sons com nota no tom da faixa, o arranjo
> que esvazia antes do pico e o drop com 4 a 5 dB de contraste; você não ouve, então a nota de som
> sai da folha de som que acompanha as folhas: o relevo de cada efeito sobre a cama e os acertos na
> batida contra o acaso, do `simula_mix.py --contexto`; sem a folha de som, a nota de som não se dá
> e vai para pendências);
> ritmo pela linguagem (a linguagem do plano, `linguagens.md`: a fração de segundos calmos, a janela
> calma antes do fecho e o fecho parado do `medir_ritmo.py --linguagem`, ao lado dos mesmos números
> da referência da linguagem);
> valor no fecho (a última frase liga o tema ao que <quem assina> resolve, sem frase
> de posicionamento solta e sem mandar a pessoa resolver com um terceiro).
> A direção visual da peça é a escolhida na prancha (no `brief.md`, quando a peça
> veio da `/mograph`) ou, sem prancha, a do `roteiro.md`: <linguagem>; peça fora
> dela, ou com uma recusa visual do `marca.md`, reprova direto. Depois, os 3 a 5 maiores
> problemas, em ordem (P0 quebrado ou factual, P1 clareza e tempo, P2
> acabamento), cada um com o quadro, o que está errado e o conserto concreto.
> O conserto começa pela ideia e pelo mundo da cena, antes do tempo e da curva.
> Não invente o que não dá para ver nas imagens. Última linha: "VEREDITO:
> APROVA" só com todas as notas em 8 ou mais; senão, "VEREDITO: REPROVA".

## Quando a skill roda num subagente

Subagente não lança subagente. Quem está num subagente aplica ele mesmo o
prompt acima, com as mesmas folhas, como lista de conferência (as notas, os
problemas em ordem e o veredito), conserta o que achar, escreve no roteiro e no
`RELATORIO.md` que **o crítico independente está pendente** (no `registro.json`,
o `critico` leva as notas da autocrítica e o veredito `PENDENTE`), e devolve
dizendo isso no relato. A sessão principal roda o crítico antes
de a peça ir para o usuário. A autocrítica nunca vale como aprovação.

## A peça dirigida pela /mograph

O crítico recebe também o `plano.json`, o `brief.md`, os `SPEC` das referências
e a auditoria do construtor, e soma ao prompt os critérios e as linhas de
`.claude/skills/mograph/lente-do-critico.md`.

## A rodada seguinte

A peça consertada volta ao **mesmo** crítico (SendMessage para ele), com a
lista do que mudou e as folhas novas: ele compara com o que viu. **Teto de três
rodadas**: se na terceira a peça ainda reprova, o conserto para e o usuário
recebe as notas, o que cada uma pede e as opções, com a sua recomendação
(`_memoria/preferencias.md`, "Superfície sem fim chega a você cedo"). Nota de gosto
que ele marca "para o usuário decidir" vai na entrega como decisão do usuário,
não vira conserto calado.

Em tamanho M e G, o agente `revisor-de-comunicacao` roda em paralelo com o texto
da tela e a base de cada afirmação. As reescritas dele entram antes da rodada
seguinte do crítico.
