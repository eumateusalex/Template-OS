# A lente de direção do crítico

O crítico é o da `/video` (`.claude/skills/video/critico.md`): subagente novo,
que não construiu, com as folhas, o roteiro e o código, notas de 1 a 10 e
"VEREDITO: APROVA" só com todas em 8 ou mais. Na peça da `/mograph` ele recebe
também o `plano.json`, o `brief.md`, os `SPEC` das referências e a
`direcao/auditoria.md`, e soma ao prompt dele os critérios e as linhas abaixo.
O prompt leva também as recusas (o `SKILL.md`, regra 2, e os proibidos de
`.claude/skills/video/regras-de-movimento.md`): conserto que cai numa recusa não
se pede, e o que só ela resolveria vai marcado "para ele decidir".

**No falado**, o prompt base é o do crítico da `/cortes`
(`.claude/skills/cortes/gravacao.md`, passo 9), que já sabe de emenda, rosto e
legenda, mais estes critérios.

## Os critérios somados

Cada um com o que dá 8:

1. **câmera com intenção**: todo movimento de câmera nomeado, com motivo e com
   parada; nenhuma câmera constante; escala até 1,2 fora do macro
2. **profundidade**: 2 camadas ou mais em cada cena de animação, parallax
   distinto quando a câmera anda; o principal grande; nenhuma cena chapada com
   um objeto no meio
3. **continuidade entre cenas**: cada corte casa eixo, sentido e velocidade e
   corta no meio do movimento; um portador por corte; nenhuma ida e volta;
   nenhum objeto entra sem parentesco com o anterior (nasce de dentro, em volta,
   ou é carregado); cada cena reenquadra o mundo: o chão que repete o recorte, a
   escala e o desfoque da cena anterior é a placa de fundo do vídeo feito por IA
4. **ritmo de corte**: corte na batida; até 3 tipos de transição; informação
   nova a cada 1,5 a 3 s; uma vírgula dramática antes do pico; o quadro nunca
   parado acima de 0,75 s fora da vírgula, e o fim parado até 1,4 s
5. **voz e tela juntas**: a coisa que a voz nomeia está na tela no mesmo
   segundo; a tela traz até 4 palavras; nada na cena fora da frase do momento;
   só o que é dito se mexe; o texto que explica um elemento fica encostado nele
6. **fiel à direção e à referência**: a direção que ele escolheu na prancha se
   reconhece em toda cena; os KEEP do `SPEC` cumpridos, nenhum NEVER COPY
7. **no falado, a escolha de cena**: a tela cheia na frase que mostra, o rosto
   no gancho, o rosto de volta a tempo, nenhuma cena de animação cobrindo uma
   frase que só conecta
8. **o ofício** (`oficio.md` § 5, com a entrada do manual de cada sintoma): o quadro herói ao lado da arte-chave chega
   perto; cada cena tem imagem (componente com volume ou matéria); o artefato do
   assunto (a captura, o dado, a página) ganha do desenhado, e o inventado leva o
   rótulo de ilustrativo (a pergunta: trocando o assunto, a cena serve a outro? se
   serve, é genérica); a luz tem
   fonte e o que pousa tem sombra; cada papel com a sua curva; o efeito no
   quadro da causa, uma vez; a palavra-chave com a segunda voz; o som em cada
   ação, no tom da faixa, e o silêncio antes do pico; o drop com 4 a 5 dB de
   contraste (a medida vai no relatório)
9. **a legenda** (no falado e no puro com voz): a palavra que importa está maior
   e na cor, e o resto pequeno; a chave segura a frase; a legenda tem um lugar só
   e nunca toca a boca nem os olhos; o apoio entra no tempo da fala
10. **energia**: o vídeo prende ou se arrasta? Cor viva no
   mundo, animação e transição no ritmo da trilha, nada de câmera lenta sobre foto parada
   nem clima triste; dá 8 só se aguenta ao lado das referências que o usuário guardou.
   Réguas verdes com vídeo melancólico reprovam esta nota
11. **ao lado da referência**: o quadro herói da peça ao lado do quadro
   equivalente da referência que ele curtiu (no `SPEC` ou no `brief.md`); dá 8
   só se aguenta lado a lado. **Correto e pobre reprova**: a peça que cumpre
   todas as regras e não segura o olho tem esta nota abaixo de 8. Quando a
   referência é um vídeo, a folha é pareada: o mesmo instante das duas, na mesma
   escala, e o crítico diz o que as separa em matéria (o vidro, a luz na letra, a
   sombra, o peso), com o número: a folha pareada acha o "artificial" que as
   notas soltas não veem
12. **ideia própria**: a referência dá o nível, não a peça. Para cada cena, a pergunta é se o autor da
   referência a reconheceria como dele (o mesmo mundo, a mesma mecânica, o mesmo arranjo com outra
   cor). Se reconheceria, a nota fica abaixo de 8, mesmo que a cena esteja bonita

## As linhas que entram no prompt

> Não presuma que nada está certo: toda nota começa em reprova e sobe só com o
> quadro da folha que prova. Antes de qualquer nota, descreva cada quadro da
> folha em uma frase, sem julgar; a frase que começa com "um cartão sobre uma
> cor chapada" é um quadro de slide, e três frases iguais com palavras
> diferentes são um tour de recursos. Compare cada cena com a referência decomposta no
> `SPEC` (o KEEP e o ADAPT) e com a direção escolhida no `brief.md`, e diga onde
> a peça ficou abaixo delas. Ponha o quadro herói ao lado da arte-chave e do
> quadro da referência: se um diretor de motion sênior olharia e chamaria de
> básico, a nota de ofício fica abaixo de 8, mesmo com todas as regras
> cumpridas. Os consertos vêm em ordem: primeiro a ideia (a cena que não conta
> nada, duas cenas que contam o mesmo), depois as ligações, depois a hierarquia,
> o tempo, a superfície e o som. O conserto vem com o ID da cena, o quadro e o número. O que não
> deu para ver nas folhas vai em "Pendências", nunca em nota. Gosto seu vai
> marcado "para o usuário decidir".

## Na ideia

O estado 4b do `SKILL.md`: o crítico lê a ideia antes de alguém construir, para o
que é de direção não virar retrabalho de peça pronta (o teto de uma superfície
vetorial chapada já se vê no quadro parado da prancha). Ele recebe o `brief.md`, o roteiro com o plano, as
três ideias e a prancha (um a três quadros parados por direção, a arte-chave e o
quadro da referência), e nada de render da peça. Dá nota só aos critérios que a
direção decide: profundidade (2), clareza da ideia (o teste de cobrir o logo),
energia (10), ao lado da referência (11), ideia própria (12) e o acabamento que a superfície
escolhida permite. Cada direção sai com nota; abaixo de 8, sai com o conserto
de direção (mundo, luz, material, ideia) em uma linha. Uma leitura, até 400
palavras: a ideia é barata de mudar, e a leitura também tem de ser.

## Como roda

As rodadas, o crítico que não conserta e o `revisor-de-comunicacao` em paralelo
são os da `/video` (`.claude/skills/video/critico.md`, "A rodada seguinte").
A lente só soma ao revisor de comunicação a coluna `entende` do plano.
