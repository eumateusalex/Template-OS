# O 3D e o gerado

A matéria que o código não faz bem: o objeto 3D, o produto, o vídeo e a imagem gerados por IA. O
custo de cada geração se diz antes (`.claude/skills/video/SKILL.md`, Material); o personagem e a
imagem parada são da `/gerar-imagem`. A regra de toda matéria gerada, em qualquer formato (a letra,
o logo, a interface e o número entram em código por cima), é `comum.mundo.marca-em-codigo-por-cima`;
aqui fica como a matéria entra no filme.

## A matéria gerada

### filme.3d-e-gerado.referencia-por-objeto
- **estado**: proposta
- **quando**: o objeto que precisa ser o mesmo em várias gerações (o produto, a embalagem, o personagem). **Não quando**: —
- **regra**: uma referência limpa por objeto (só ele, em fundo neutro); o gerador a usa como referência e não como primeiro quadro, e a cena nasce do prompt com o objeto preso a ela
- **parâmetros**: uma imagem por objeto
- **som**: nenhum
- **realiza**: `gerado`

### filme.3d-e-gerado.prompt-por-cena
- **estado**: proposta
- **quando**: o prompt de cada geração. **Não quando**: —
- **regra**: o prompt diz a cena inteira de uma vez, sem jargão: o tempo de cada trecho ("de 0 a 2 s"), como cada elemento entra, o que acontece e como sai, mais a câmera, a luz e a lente. O pensamento vai inteiro num prompt, não em partes
- **parâmetros**: trechos de cerca de 2 s
- **som**: nenhum
- **realiza**: `gerado`

### filme.3d-e-gerado.prompt-sem-marca
- **estado**: proposta
- **quando**: todo prompt de vídeo ou imagem gerada. **Não quando**: —
- **regra**: o prompt não leva nome de marca nem de pessoa (o gerador barra) e descreve a forma ("um retângulo de vidro", e não o nome do aparelho). O que não se quer se escreve por extenso (sem plástico, sem reflexo, sem texto, sem logo), e o que sobra se tira do prompt em vez de pedir ajuste
- **parâmetros**: —
- **som**: nenhum
- **realiza**: `gerado`

### filme.3d-e-gerado.blocos-de-10-s
- **estado**: proposta
- **quando**: a matéria gerada que ocupa mais de uma cena. **Não quando**: a cena feita em código
- **regra**: uma geração carrega várias cenas curtas, e o ritmo se mantém dentro dela; a peça mais longa sai em blocos que reaproveitam o prompt de estrutura, e não numa geração esticada
- **parâmetros**: até 10 s por geração; cerca de cinco cenas de 2 s (de três a seis)
- **som**: nenhum
- **realiza**: `gerado`

### filme.3d-e-gerado.gerar-de-novo
- **estado**: proposta
- **quando**: o gerado saiu errado. **Não quando**: o erro está no que vai por cima em código (aí se corrige o código)
- **regra**: refazer a geração com o prompt corrigido em vez de editar o vídeo dentro do gerador: cada ajuste custa crédito e comprime a imagem
- **parâmetros**: quatro ajustes seguidos já estragam o plano
- **som**: nenhum
- **realiza**: `gerado`

## O objeto 3D

### filme.3d-e-gerado.produto-na-luz
- **estado**: proposta
- **quando**: o produto que é o herói (a embalagem, o frasco, o objeto físico). **Não quando**: a gente fotorreal (o realismo humano lê como IA); o 3D em duas batidas seguidas
- **regra**: o produto gira devagar numa luz de estúdio com fonte clara e pousa no quadro herói; um evento por peça. A matéria 3D vai para o produto, não para a pessoa
- **parâmetros**: —
- **som**: `whoosh-longo` no giro, pico no pouso
- **realiza**: `biblioteca:objeto-3d-na-luz`; `registro:product-turntable`; `curva:deslize`; `curva:heroi`; `gerado`
