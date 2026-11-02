# A auditoria do construtor (o Director Pass)

Depois do primeiro render inteiro e antes do crítico, quem construiu para de
construir e passa a dirigir. Não toca no código antes de ter a lista. O crítico
recebe a peça já auditada: a auditoria não substitui o crítico, tira dele o
trabalho que a máquina e a pergunta honesta já pegam.

## 1 · As réguas de máquina, antes de olhar

```bash
node .claude/skills/mograph/ferramentas/plano.mjs conferir <pasta>
node .claude/skills/mograph/ferramentas/regua-manual.mjs conferir <pasta>/plano.json   # no falado, --som ou --sem-som
node .claude/skills/mograph/ferramentas/regua-direcao.mjs tudo <pasta> --mp4 <render.mp4>
npx --yes hyperframes@0.8.207 check                       # dentro da pasta, zero erro
node .claude/skills/video/ferramentas/folhas.mjs <render.mp4> <pasta>/folhas --rapidos <cortes>
```

A coluna da direita diz o que a régua acusa. As réguas de calibragem (o `CALIBRAGEM` e a parte
marcada das `MISTAS`, em `ferramentas/excecoes.mjs`: `parado`, `transicoes`, `curvas`, `cromo`,
`estimulo` e as outras da lista) saem como aviso na linha de comando, e a exceção escrita no
plano as cala.

| Régua | O que mede | Erro ou aviso |
|---|---|---|
| `plano.mjs conferir` | ids, tipos, funções, câmera com motivo, cobertura das frases, tempo de leitura do texto da tela, componente recusado, a interface sobre a câmera sem a escolha dele | erro (os de estilo, aviso) |
| `regua-manual.mjs conferir` | o manual e o kit na peça: a cena sem `tecnicas`; o id que não existe, que é do outro formato (o `filme` ou o `reel`, pelo estilo) ou que é recusado; o componente só à mão sem `motivo_mao`; o efeito do `som.json` sem `gesto` do kit, ou com arquivo que não é som do gesto, sem `origem` nem `motivo`; a técnica de digitação sem o gesto `tecla`; a imagem que a página carrega sem `origem` no `ativos`, com origem `codigo` ou fora da lista (`comum.mundo.cenario-pintado-em-codigo`); sem `som.json` e sem `--sem-som`. As propostas citadas, numa linha, e menos de 5 gestos em peça de mais de 10 s (`comum.som.familias`) | erro; a proposta e os gestos, aviso |
| `regua-direcao.mjs zona` | a tinta de cada texto e o traço de cada forma desenhada fora da zona segura do destino, a cada 0,1 s, só o que se vê (o overflow e o clip-path cortam; `data-zona="livre"` tira da conta só o desenho, nunca o texto); e a legenda que encosta num objeto da cena (a imagem, mesmo livre, a forma, o cartão) por 0,3 s ou mais, fora a câmera e o recorte da pessoa | erro |
| `regua-direcao.mjs tela` | a peça contra o plano: texto de cena na tela que o `texto_tela` não declara, frase declarada que não aparece inteira, e frase que fica inteira menos que o tempo de leitura, contado na cena dela (os "·" separam as frases; a legenda da `/cortes` e o `data-texto="objeto"` não contam) | erro |
| `regua-direcao.mjs parado` | o quadro inteiro parado acima de 0,75 s fora da vírgula declarada; o fim parado acima de 1,4 s; mais de uma vírgula sem declarar (10 qps, contra os cinco quadros anteriores, com o grão apagado pela média; `ferramentas/parado.mjs`); e a massa: o quadro inteiro quase parado (a diferença média abaixo de 0,5 a 30 qps) em mais de 60% dos quadros, ou a mediana abaixo de 0,35, o vídeo em que só um detalhe se mexe (o feito por IA dá 78% e 0,28; a refação profissional, 21% e 1,20), na peça e em cada cena de animação do plano (no falado o rosto segura a peça inteira e esconde a tela cheia parada) | erro; a vírgula e a massa, aviso |
| `regua-direcao.mjs cromo` | o rótulo parado no canto da zona por 1 s, o contador "02 / 04", o metadado (BPM, qps, ©) na tela; o rótulo pequeno em cima de um título com o dobro do tamanho; o mesmo texto ou forma no mesmo lugar em 3 cenas, parado 0,3 s em cada (a câmera que passa num quadro não conta; `ferramentas/cromo.mjs`, os tamanhos pela largura) | erro (o kicker e o preso também: ele os tirou do vídeo) |
| `regua-direcao.mjs transicoes` | mais de 3 tipos de transição nas costuras do `plano.json`; dissolver (no estilo `documental`, só o sem `causa`); o sentido espelhado ou faltando no corte na curva e no zoom; a ida e volta de sentido sem `causa` (aviso) | erro |
| `regua-direcao.mjs curvas` | `bounce` ou `elastic` no código; `back.out` sem motivo no roteiro | erro; aviso |
| `regua-direcao.mjs som` | o efeito sonoro descolado da imagem: cada `<audio>` do `index.html` contra os instantes que a peça expõe agora (`window.__instantes`), a mais de 1 quadro, ou faltando, ou sobrando. Pega o tempo mudado depois do som e a peça montada só pelo `montar-puro.mjs`, que não refaz o som (`ferramentas/som-do-puro.mjs`). Sem `fonte/som.json`, não se aplica | erro |
| `regua-direcao.mjs cor` | o vídeo apagado: o p90 da saturação dos quadros (o SATAVG do ffmpeg, a 2 qps) abaixo de 8, isto é, nem os 10% de quadros mais coloridos têm cor (uma peça apagada dá 5,5; referências vivas, de 14 a 58; um filme de ponta com interface preto e branco, 7,3; `ferramentas/cor.mjs`). Por que é aviso: `comum.mundo.cor-do-mundo-viva`, no manual | aviso |
| `regua-direcao.mjs bordas` | a faixa chapada que nasce numa das quatro bordas do quadro, de 3 px ou mais por 0,2 s ou mais: a cena ou o chão que anda sem sangrar até a borda, e o fundo do modelo aparece (o caso medido está no cabeçalho do `ferramentas/bordas.mjs`). Chapado é desvio abaixo de 1,5 nível (o fundo do modelo mede 0, a parede lisa da gravação ~3,5); o quadro todo liso (o respiro, o flash) não é faixa | erro |
| `regua-direcao.mjs estimulo` | o intervalo sem nada novo: nem corte de cena do plano, nem troca de enquadramento da câmera (o punch-in da `/cortes`, no falado), nem frase nova da voz (a cena com `fala` e o `frases` do plano, no puro; as frases do corte, no falado), nem efeito de som que se ouve (o `som.json` no falado, o `<audio>` no puro; o que o `simula_mix.py --contexto` mede abaixo do piso não conta); a legenda contínua é fundo e não conta. "No máximo 3 s sem algo novo" | acima de 3 s, aviso; acima de 5 s, erro |
| `regua-direcao.mjs recusados` | trecho de código de um comportamento recusado na biblioteca | erro |
| `regua-direcao.mjs oficio` | a cena de 1 s ou mais sem matéria (foto, vídeo, ícone 3D, canvas, `data-materia`) com 3% do quadro em metade do tempo; menos de 3 curvas na timeline; metade ou mais das entradas só por fade com subida curta; no puro, menos de 3 tipos de efeito sonoro (não cobra onde a linguagem ou o estilo dispensa: o `documental`, o `so-efeitos`); a mesma curva e duração em mais de 40% dos movimentos (`oficio.md`) | a matéria e a peça sem `<audio>`, erro; as curvas, o fade e o piso de som, aviso (calibragem, a exceção escrita no plano cala); a mesma curva, aviso |
| `simula_mix.py --contexto` da `/video` (antes do render) | o som dentro da música: o relevo de cada efeito sobre a cama, pelo papel (o piso de cada papel mora lá), e os acertos na batida contra o acaso; o efeito enterrado conta como silêncio para quem ouve, e é o que a `estimulo` não vê | aviso (calibragem; `--estrito` reprova) |
| `medir_ritmo.py --linguagem` da `/video` (no render) | o ritmo contra a faixa da linguagem do `brief.md`: a fração de segundos calmos, a janela calma antes do fecho e o fecho quase parado, mais as faixas de som e corte; a massa da `parado` é o piso de toda peça, a faixa da linguagem é a régua do estilo (`.claude/skills/video/linguagens.md`) | aviso (calibragem, o respiro declarado cala) |
| `check` do HyperFrames | o que o render vai cobrar | erro |
| folhas | o vídeo a 2 quadros por segundo e as tiras dos movimentos rápidos | olho |

Os de som e voz são da `/video` (`som.md`, `ferramentas/regua-voz.mjs`). Régua que não
mediu (sem o render, sem a timeline) reprova: não medir não é passar.

## 2 · As perguntas, por bloco

Antes das perguntas, **cada quadro da folha numa frase** (o que se vê, sem
julgar). A frase que começa com "um cartão sobre uma cor chapada" já é um quadro
de slide; três frases iguais com palavras diferentes são o tour de recursos.

Respondidas olhando as folhas, cena por cena, com o ID:

- **narrativa**: a mensagem se entende? Há algo bonito e inútil? Uma cena
  repete a anterior? A prova basta?
- **atenção**: para onde o olho vai em cada quadro? Há dois focos? O principal é
  grande o bastante? O que conta a história se lê a 360 px de largura, o tamanho do feed, e se
  distingue do que está em volta? Algum texto da cena passa por baixo da frase? (As réguas não
  veem a peça correta e pobre: só o olho na folha.)
- **ritmo**: o gancho demora? Alguma cena parou? Dá tempo de ler? Há rápido e
  lento, ou tudo no mesmo passo?
- **movimento**: há movimento sem razão? A mesma curva em tudo? Toda cena
  começa igual? A transição virou a estrela?
- **câmera**: cada movimento tem motivo e para? A escala passa de 1,2 fora do macro?
- **continuidade**: cada corte casa eixo, sentido e velocidade? Há portador? Algo da cena
  seguinte aparece antes do corte?
  Ida e volta de sentido? Algum objeto entra sem parentesco com o anterior (nasce
  do nada, em vez de nascer de dentro ou em volta dele)?
- **marca**: troca o logo e serve a qualquer empresa? Algum tom fora da paleta?
- **ofício** (`oficio.md` § 4 e § 5, e as entradas do manual que a peça cita): o quadro herói chega perto da arte-chave? Cada cena tem imagem (cobrindo o texto, sobra um quadro)? A luz tem fonte e o que pousa tem sombra de contato? O efeito entra no quadro da causa, uma vez? A palavra-chave tem a segunda voz? Cada ação que importa tem o som dela, e há silêncio antes do pico? Aguenta ao lado da referência que o usuário curtiu?
- **texto**: dentro da zona? No tempo de leitura? Acento e cedilha? Até 4
  palavras na tela quando há voz?
- **som**: a voz clara, a música por baixo, o efeito no pico do movimento, o
  começo e o fim limpos? Os sons com altura no tom da faixa? O drop com 4 a 5 dB
  de contraste?
- **no falado**: a legenda sobre a boca ou os olhos? Ela tem as duas vozes, a
  chave segurando a frase, e um lugar só na peça? O cartão da meia tela corta
  o rosto? O rosto volta a tempo?

## 3 · O orçamento das mudanças

A lista sai em ordem, e se resolve nessa ordem:

- **P0**: quebrado, errado de fato, fora da marca, recusa do usuário
- **P1**: a ideia (a cena não conta nada, duas cenas contam o mesmo), depois as
  ligações (a costura), depois clareza, hierarquia e tempo
- **P2**: acabamento (superfície, som)
- **P3**: floreio, só com pedido do usuário

É a mesma escala do crítico da `/video`. Dentro do P1, a ordem vale: consertar o
tempo de uma cena que não devia existir é trabalho jogado fora. Duas a três
passadas honestas; o que ainda reprova depois vai para o usuário.

## 4 · O pedido de mudança é de diretor

Cada item aponta a cena, o quadro e o número, nunca "deixa mais dinâmico":

```text
S04 · empurra do quadro 118 ao 144, escala 0,86 → 1, o botão no centro; corte seco para S05.
```

E segue um caminho só: o pedido, a cena, a intenção, a mudança, o efeito
colateral conferido, a prévia, aceito ou refeito. A mudança que importa vai para
"Decisões" do `roteiro.md` da peça.

## 5 · A saída

`direcao/auditoria.md` na pasta da peça: a lista P0 a P3 **já consertada**, o
que ficou de fora e por quê, as medidas das réguas e as folhas novas. Só então o
crítico (`lente-do-critico.md`).

## 6 · O que nunca vale como aprovação

- a autocrítica de quem construiu
- o `check` verde e as réguas verdes: medem o que medem, não o gosto
- a prévia no navegador: o render quadro a quadro é que vale
- o quadro parado: o movimento só se vê na tira
- a transcrição a 100%: a palavra certa pode estar no lugar errado
- a nota de gosto do crítico marcada "para o usuário decidir": vai para ele
