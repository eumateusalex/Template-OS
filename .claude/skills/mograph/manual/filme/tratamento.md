# O tratamento

O acabamento do filme: a cor do que entra gerado ou filmado, o look e o fundo de tela. O que é
desenhado em código já nasce na cor da marca e não passa pela correção; o como fazer no motor (o
`data-color-grading`, a correção antes da gradação) é da `/video`, em `.claude/skills/video/cor.md`.
As recusas de cor (a noite, o véu, o mundo dessaturado) moram em `comum/mundo.md`.

## A cor do material

### filme.tratamento.correcao-do-gerado
- **estado**: proposta
- **quando**: o vídeo gerado que sai escuro ou chapado. **Não quando**: o desenhado em código
- **regra**: o gerado entra corrigido (exposição, contraste, realces, sombras, a curva) e igual aos vizinhos, antes de qualquer look
- **parâmetros**: no exemplo medido (o efeito do editor, num quadro): exposição +1,3, contraste +14,6, realces −10,4, sombras −43,8; no produto branco, mais realce e mais branco
- **som**: nenhum
- **realiza**: `gerado`; `mao`

### filme.tratamento.acabamento-do-gerado
- **estado**: proposta
- **quando**: todo vídeo gerado que entra no filme. **Não quando**: o desenhado em código (o grão dele é o `comum.efeito.grao`)
- **regra**: o gerado se baixa na resolução em que nasceu (a versão maior do gerador é a mesma ampliada), sobe de escala na composição e leva nitidez e ruído só nele, para tirar a cara de render
- **parâmetros**: 720p a 150% num quadro de 1080 de largura; nitidez ~20; ruído de 20 a 25% (na unidade do efeito do editor: medir na primeira geração antes de virar número da peça)
- **som**: nenhum
- **realiza**: `gerado`; `mao`

### filme.tratamento.lut
- **estado**: proposta
- **quando**: o look do filme sobre o material filmado e gerado. **Não quando**: o desenhado em código; a tomada ainda sem a correção
- **regra**: uma LUT do kit dá o look, depois da correção, a mesma em todo o material do filme, para o banco de imagem ter a cor do vídeo principal. Entra dosada e só na camada da matéria (a foto, o vídeo, o gerado), nunca na letra nem na cor da marca: as 40 do kit tiram metade a dois terços da cor medida, e o mundo lavado é a recusa de `comum.mundo.cor-do-mundo-viva`, que manda sobre esta
- **parâmetros**: a LUT por `lut3d` do ffmpeg na camada da matéria; a intensidade dosada (no exemplo medido, o preset a 72%), com a régua `cor` conferindo o quadro; a saturação e a pele medidas de cada uma em `kit/lut.json`
- **som**: nenhum
- **realiza**: `kit:lut`

## O estilo

### filme.tratamento.preto-e-branco-absoluto
- **estado**: proposta
- **quando**: o minimalista de texto curto, na marca que é preto e branco. **Não quando**: a imagem do mundo (fica com a cor dela: `comum.mundo.cor-do-mundo-viva`)
- **regra**: a base, a letra e o componente em preto e branco de contraste absoluto, e o volume (a luz e o 3D) prende o olho. Outra paleta só a da marca (`comum.mundo.cor-da-marca`)
- **parâmetros**: —
- **som**: nenhum
- **realiza**: `mao`

### filme.tratamento.tema-escuro
- **estado**: proposta
- **quando**: a prova de interface viva: o interruptor ligado na cena. **Não quando**: o filme inteiro no escuro (`comum.mundo.noite`)
- **regra**: o interruptor liga e a composição inteira inverte para o escuro: o fundo vai ao preto, as linhas da grade ao branco e o cartão ao preto com cinza
- **parâmetros**: —
- **som**: `clique` no interruptor
- **realiza**: `mao`

### filme.tratamento.grade-de-fundo
- **estado**: proposta
- **quando**: a textura do chão de uma cena de tela ou interface. **Não quando**: como o chão inteiro; fora de cena de tela
- **regra**: uma grade fina e parada, que aparece no meio do quadro e some nas bordas; é textura do chão (`comum.mundo.chao-com-materia`), nunca o chão
- **parâmetros**: linhas de 2 px a 4–5% de opacidade; a máscara radial apaga nas bordas
- **som**: nenhum
- **realiza**: `mao`
