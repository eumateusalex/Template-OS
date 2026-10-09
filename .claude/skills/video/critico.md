# O crítico

Quem construiu a peça não a julga. O crítico é um subagente novo
(`general-purpose`), que recebe o roteiro, o código e as folhas, e começa
reprovando. O comum é ele reprovar mais de uma vez, com consertos precisos
(prova escondida pelo contador, 8 s no mesmo plano, celular atravessando o
painel), e as notas subirem de 4 a 6 para 8 ou mais.

## As folhas

```bash
node .claude/skills/video/ferramentas/folhas.mjs <mp4> <pasta> --rapidos <t1,t2,...>
```

- `folha-2fps.png`: o vídeo inteiro, 8 colunas, meio segundo por quadro
- `tira-<t>s.png`: 12 quadros em 2 s a partir de cada movimento rápido (toque, drop, morph, saída)
- `celular-<t>s.png`: 8 quadros a 360 px, a largura do Reel no celular (o 0 e o último entram)

O `/watch` (plugin opcional) não substitui as folhas: ele escolhe quadro pelo
codificador, e num motion de 21,5 s o modo leve pega só 4 quadros. O lugar dele
é a referência que chega por link.

## O prompt

Antes de enviar, troque `<quem assina>` pelo nome do usuário ou do produto (de
`_memoria/empresa.md`) e `<linguagem>` pelo campo "Linguagem" do roteiro, com as
recusas do `marca/marca.md`. <!-- caminho futuro: nasce no /carrossel configurar -->

> Você é um diretor de motion exigente e NÃO construiu esta peça. Comece
> reprovando. Leia o roteiro (`roteiro.md`), o código (`index.html`) e abra
> todas as imagens das folhas. Dê nota de 1 a 10, com uma linha de motivo, para:
> gancho nos 2 primeiros segundos; leitura no tamanho do celular (acento e
> cedilha certos); qualidade do movimento (chegada rápida e macia, nenhuma
> pausa morta acima de ~3 s, nenhum movimento rápido seguido de parada seca,
> um movimento principal por vez); variedade e ritmo; composição e hierarquia
> (um foco por quadro, faixas do Instagram livres: ~220 px em cima e ~380 px
> embaixo); clareza da história; marca (só as cores da marca, sem brilho,
> degradê, partícula ou cara genérica de IA); acabamento premium (tem camadas,
> profundidade e edição, ou parece cru: fundo chapado com um objeto no meio);
> valor no fecho (a última frase liga o tema ao que <quem assina> resolve, sem
> frase de posicionamento solta e sem mandar a pessoa resolver com um terceiro).
> A linguagem aprovada é: <linguagem>; peça fora dela reprova direto. Depois, os
> 3 a 5 maiores problemas, em ordem (P0 quebrado ou factual, P1 clareza e tempo,
> P2 acabamento), cada um com o quadro, o que está errado e o conserto concreto.
> Não invente o que não dá para ver nas imagens. Última linha: "VEREDITO:
> APROVA" só com todas as notas em 8 ou mais; senão, "VEREDITO: REPROVA".

## Quando a skill roda num subagente

Subagente não lança subagente. Quem está num subagente faz a autocrítica com
o mesmo prompt e as mesmas folhas, escreve no roteiro que **o crítico
independente está pendente**, e devolve. A sessão principal roda o crítico antes
de a peça ir para o usuário. A autocrítica nunca vale como aprovação.

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
