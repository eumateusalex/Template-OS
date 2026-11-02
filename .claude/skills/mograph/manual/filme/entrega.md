# A entrega

O que sai do filme: o 16:9 e o 9:16 da mesma linha do tempo, e as variações da mesma peça. O que
cada estilo entrega (os arquivos, a capa, a página de revisão) é do `estilos.md` da `/video` (§ 3);
aqui fica como se faz.

## Os formatos

### filme.entrega.dois-formatos
- **estado**: proposta
- **quando**: a peça que sai nos dois formatos (o `comercial`, o `documental`, o `anuncio-google` com o 9:16). **Não quando**: a peça de um formato só
- **regra**: o 9:16 é uma cópia da composição do 16:9 com a mesma linha do tempo (as mesmas cenas, nos mesmos quadros, sobre o mesmo áudio), e cada elemento se reposiciona em px, cena a cena, para o novo quadro: o arranjo muda de eixo, nunca se espreme, se estica nem se corta. O que anda preso a outro objeto vai preso a ele na cópia, para acompanhar a escala
- **parâmetros**: 1920 × 1080 e 1080 × 1920; a zona de cada um no `formatos.json` da `/video` (`yt-16x9` no 16:9, a do destino no 9:16); o ajuste de cada cena se escreve em px ("o texto 30 px acima")
- **som**: nenhum
- **realiza**: `mao`

## A variação

### filme.entrega.variacao
- **estado**: proposta
- **quando**: a mesma peça noutra língua, noutro tema dentro da marca (o claro e o escuro) ou noutro formato. **Não quando**: a mudança é de ideia (aí é outra peça)
- **regra**: a variação sai da mesma linha do tempo, trocando o texto, a variável do tema ou o quadro, e se renderiza de novo; a peça nunca se refaz. Outra língua pede outra narração e o tempo de leitura conferido de novo, porque o texto muda de tamanho
- **parâmetros**: —
- **som**: nenhum
- **realiza**: `mao`
