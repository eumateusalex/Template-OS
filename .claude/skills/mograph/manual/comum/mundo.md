# O mundo

O que está atrás, em volta e por baixo do que a cena mostra: o chão, as camadas, a composição e a
cor. O defeito que este arquivo mata é o cartão sobre a cor chapada: a peça correta e pobre, sem
imagem nenhuma quando se tapa a letra. O mundo é cheio e uma coisa só fica acesa.

## As camadas

### comum.mundo.seis-camadas
- **estado**: proposta
- **quando**: todo quadro. **Não quando**: o respiro de menos de 1 s
- **regra**: todo quadro tem seis camadas (um cartão sobre cor chapada tem uma): o **chão** (o que está atrás de tudo), a **luz** (de onde vem e o que faz: `comum.camera-e-luz.luz-com-direcao`), a **profundidade** (o que está perto e longe: `comum.camera-e-luz.tres-planos`), a **textura** (papel, vidro, metal e o grão, `comum.efeito.grao`; nunca o "overlay" decorativo), a **matéria** (do que as coisas são feitas: o ícone 3D, o vidro, o papel, a interface com moldura real) e o **som** (`comum/som.md`). O fundo não se escolhe pronto: se constrói por cima da cor de base da marca, com o chão, a luz com fonte e a profundidade
- **parâmetros**: no exemplo de fundo em camadas: a base na cor da marca; um degradê radial claro, do centro a transparente em 60%, como luz (nunca o orbe parado: `comum.mundo.papel-de-parede`); o grão por cima (`comum.efeito.grao`)
- **som**: nenhum
- **realiza**: `mao`

### comum.mundo.chao-com-materia
- **estado**: firme
- **quando**: toda cena de 1 s ou mais. **Não quando**: o respiro de menos de 1 s; a cena que é o próprio objeto
- **regra**: o chão tem matéria: a foto do negócio, a interface real recortada pela câmera, uma superfície fotografada ou gerada, uma textura com motivo, a placa de fundo, ou o fundo limpo e desfocado que deixa o objeto ser a imagem. O teste: tapando a letra, cada quadro ainda mostra uma imagem (superfície, luz, objeto); se sobra cor chapada, a cena não tem imagem. A superfície e o objeto pintados por script imitando foto não são matéria: são `comum.mundo.cenario-pintado-em-codigo`, recusado
- **parâmetros**: a régua `oficio` (`ferramentas/regua-direcao.mjs`): cada cena de 1 s ou mais tem matéria (foto, vídeo, canvas, ícone 3D, o marcado `data-materia`) com 3% do quadro ou mais em metade do tempo dela, ou reprova; a régua `manual` cobra a origem de cada imagem da página (`comum.mundo.cenario-pintado-em-codigo`)
- **som**: nenhum
- **realiza**: `mao`

### comum.mundo.cenario-pintado-em-codigo
- **estado**: recusado
- **quando**: nunca. **Não quando**: sempre
- **regra**: o cenário fotográfico pintado em código (a bancada de madeira, a caneca, o objeto desenhado por script imitando foto) lê como maquete e não entra: o olho reconhece o falso na hora. O chão é foto, vídeo, imagem gerada, render de produto ou o fundo limpo e desfocado; a camada sem figura feita em código (a luz, o grão, a máscara) é `efeito`, com o motivo
- **parâmetros**: o `plano.json` declara em `ativos` cada imagem e vídeo que o `index.html` carrega, com a `origem`: `foto`, `video`, `gerado`, `kit`, `material`, `produto`, `captura` ou `efeito` (este com `motivo`); a imagem sem origem, com `codigo` ou fora da lista reprova na régua `manual`. O que vem de `_marca/` e de `_vendor/` não se declara
- **som**: nenhum
- **realiza**: `mao`

### comum.mundo.placa-que-trabalha
- **estado**: proposta
- **quando**: a superfície que a marca não tem em foto (o chão, a textura, o ambiente). **Não quando**: há foto real do negócio
- **regra**: a superfície vem gerada como placa de fundo e trabalha: revelada, atravessada pela câmera ou iluminada; nunca uma imagem parada atrás de um título. Cada cena reenquadra a placa (escala, x e y), e o chão que repete o recorte, a escala e o desfoque da cena anterior é a placa parada de vídeo feito por IA
- **parâmetros**: —
- **som**: nenhum
- **realiza**: `gerado`

### comum.mundo.placa-reserva-a-legenda
- **estado**: firme
- **quando**: a placa de fundo de uma cena com legenda. **Não quando**: a cena sem legenda
- **regra**: a placa nasce com a faixa da legenda calma, clara e sem objeto escuro, e o reenquadramento de cada cena não leva o objeto para dentro dela. O contraste da palavra-chave contra a placa se mede no quadro, nunca no olho. O conserto é a placa refeita, nunca o véu sobre a foto (`comum.mundo.foto-com-veu`)
- **parâmetros**: a faixa nas telas cheias do falado vai de 12 a 32% da altura; medido: a placa com a faixa ocupada deu contraste de 1,5 a 2,0, e a refeita, de 3,2 a 4,2
- **som**: nenhum
- **realiza**: `gerado`

### comum.mundo.marca-em-codigo-por-cima
- **estado**: proposta
- **quando**: a cena que pede o que o código não faz bem (o 3D fotorreal, a gente, o fluido, a matéria). **Não quando**: o texto, o logo, a interface e o número; a peça inteira gerada (o gerado entra em cenas específicas)
- **regra**: o vídeo gerado faz a matéria, e o texto, o logo, a interface e o número entram em código por cima, nítidos e na fonte da marca. Logo gerado nunca entra
- **parâmetros**: —
- **som**: nenhum
- **realiza**: `gerado`

## A composição

### comum.mundo.tres-objetos
- **estado**: firme
- **quando**: toda cena de animação (tela cheia, meia tela, motion puro). **Não quando**: —
- **regra**: três camadas por cena: o **principal**, no centro, uma coisa só e acesa (a hierarquia vem da luz e da escala, depois da cor); o **apoio**, nas bordas, o que explica o principal (a etiqueta, o número, a seta), menor e sem disputar o olho; a **profundidade**, em volta (menor, fora de foco, mais clara), parada ou em parallax mais lento. Cena com dois principais é duas cenas
- **parâmetros**: —
- **som**: nenhum
- **realiza**: `mao`

### comum.mundo.escala-e-hierarquia
- **estado**: proposta
- **quando**: o principal de cada cena. **Não quando**: o respiro
- **regra**: a escala é hierarquia: o principal é grande, quase sangrando; tudo do mesmo tamanho no centro é o quadro amador
- **parâmetros**: o principal ocupa de 60 a 85% da largura
- **som**: nenhum
- **realiza**: `mao`

## A cor

### comum.mundo.cor-da-marca
- **estado**: firme
- **quando**: toda peça. **Não quando**: —
- **regra**: a cor é da marca da peça (num projeto, a do projeto) e não se inventa: a base fica na marca, e o charme é dos componentes. A lição de que a cor apagada parece mais cara que a pura vale dentro da paleta que a marca já tem; tom novo vai para a pessoa como pergunta, nunca entra calado
- **parâmetros**: —
- **som**: nenhum
- **realiza**: `mao`

### comum.mundo.cor-do-mundo-viva
- **estado**: firme
- **quando**: toda foto, vídeo ou 3D na peça. **Não quando**: —
- **regra**: a imagem do mundo entra com a cor dela, mesmo numa marca preto e branco: a marca vale para a letra, a base e o componente. Dessaturar o mundo para casar com a marca apaga a peça (`comum.estrutura.arco-de-cinza`)
- **parâmetros**: a régua `cor` (`ferramentas/cor.mjs`): o p90 da saturação dos quadros abaixo de 8 avisa (aviso, não erro)
- **som**: nenhum
- **realiza**: `mao`

## O que não entra

### comum.mundo.papel-de-parede
- **estado**: recusado
- **quando**: —
- **regra**: o efeito como papel de parede no fundo (`comum.efeito.evento`): o orbe atrás da marca, o degradê de duas cores parado, a mancha colorida atrás do objeto
- **parâmetros**: —
- **som**: —
- **realiza**: —

### comum.mundo.noite
- **estado**: recusado
- **quando**: —
- **regra**: a noite (o preto com marinho) como mundo da peça: pesa, esconde o chão e afunda a cor da marca
- **parâmetros**: —
- **som**: —
- **realiza**: —

### comum.mundo.foto-com-veu
- **estado**: recusado
- **quando**: —
- **regra**: a foto escurecida ou clareada por um véu para o texto ler por cima: o véu apaga a foto que devia provar. O contraste se resolve na placa (`comum.mundo.placa-reserva-a-legenda`)
- **parâmetros**: —
- **som**: —
- **realiza**: —

### comum.mundo.paleta-pronta
- **estado**: recusado
- **quando**: —
- **regra**: as paletas prontas do plugin de vídeo: a peça tem marca, e cor de fora é cor inventada. Os componentes e os efeitos do plugin entram, na cor da marca
- **parâmetros**: —
- **som**: —
- **realiza**: —
