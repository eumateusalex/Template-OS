# A sabatina

A sabatina é a entrevista que roda mesmo depois do comando, para a peça sair
certa. Ela não é formulário: é o diretor fechando o que só o dono sabe, antes de gastar render.

## As regras

São as do `/grill` (`.claude/skills/grill/SKILL.md`, Passo 2), sem cópia:
cada rodada é a fronteira inteira (as decisões cujos pré-requisitos já estão
resolvidos), até 4 perguntas por `AskUserQuestion`, a recomendada primeiro com
"(Recomendado)" e o que joga contra na descrição de cada opção; fato se busca
no arquivo, nunca se pergunta; dependência antes. Muda o alvo (um filme) e onde
grava: **não grava `CONTEXT.md` nem ADR**, grava o `brief.md` da peça.

Antes da primeira pergunta, leia o que a memória já responde
(`_memoria/marketing.md`, `_memoria/escrita-publica.md`, `_memoria/prova.md`,
`_memoria/estrategia.md`): território, função, nível de consciência e CTA
possível saem dali como proposta, não como pergunta aberta.

## O que é dele e o que é meu

| Dele (vira pergunta, se o pedido não disse) | Meu (decido e registro) |
|---|---|
| o que o vídeo vende ou afirma, e a base | o motor, a duração exata, a música, os efeitos |
| para quem é (as duas audiências de `_memoria/marketing.md`) | a função narrativa de cada frase |
| a referência que ele tem na cabeça (link, curtida, "pesquise") | o tipo de cena de cada frase (proposto na página, ele ajusta) |
| o que o vídeo **não** deve parecer (a anti-referência) | a câmera, a transição, o componente |
| a direção visual: sempre renderizada, nunca descrita | o que entra da biblioteca e o que se constrói |
| afirmação sem prova medida (`_memoria/prova.md`) | as réguas e os consertos |
| no falado: gravar de novo ou usar a gravação que existe | |
| gasto: material por IA com custo, sempre antes | |

O que eu decido entra no `brief.md` com a confiança e o custo de errar:

```text
ASSUMPTION: <o que eu assumi>
CONFIDENCE: alta | média | baixa
IMPACT IF WRONG: <o que se refaz se eu errei>
```

Confiança baixa com impacto alto não é minha: vira pergunta da rodada.

## A rodada 1 · antes da pesquisa

Negócio e gosto, numa chamada. A fronteira típica, de onde se tiram até 4
perguntas (o que o pedido já disse não se pergunta; o pedido que chega pelo
`ferramentas/modelo-pedido.md` responde a rodada inteira, e o brief nasce dele):

- **o modo**: ele falando com motion por cima (o principal) ou motion puro; e,
  no falado, se ele grava com o roteiro que eu escrevo ou se a gravação já existe
- **o que fica na cabeça de quem assiste**: o filme numa frase, já proposta por
  mim a partir do pedido e da memória, com duas alternativas
- **a referência**: "tenho um link", "pesquisa no meu X", "sem referência, você
  decide"; e a anti-referência, com dois exemplos concretos do que costuma
  sair errado
- **destino e duração**: orgânico ou anúncio (a zona segura muda muito entre
  os dois, `.claude/skills/video/ferramentas/formatos.json`), e a faixa de tempo

A entrevista de ferramenta da `/video` (motor, material, formato, voz) entra
aqui só quando o pedido pede algo fora do padrão; o resto eu decido.

## O cardápio do Reel · quando ele traz a gravação

O pedido "edita esse vídeo em Reels" não abre pergunta solta, abre um **cardápio
do acervo**. Antes de perguntar, eu vejo a gravação inteira (a `/cortes`, passos 0 a 4; só
com a transcrição, eu marco o cardápio como provisório no `brief.md`): a duração, as frases
que **mostram** (a prova, o número, a lista) e as que **conectam**.

**O negócio vem antes do cardápio.** O que a gravação afirma sem prova (`_memoria/prova.md`)
e a chamada que a operação não atende hoje (a palavra que pede resposta com a automação
desligada) são perguntas da rodada 1, na forma de sempre (`ferramentas/modelo-entrevista.md`):
proposta pronta com a alternativa, e nunca menu de estilo.

**A forma de cada pergunta** é a do `ferramentas/modelo-entrevista.md`: de 2 a 4 opções, com
o rótulo e a descrição em linguagem de balcão e a prévia em desenho de caixa (o campo
`preview` do `AskUserQuestion`). Os ids das entradas vão no `brief.md` (a linha "o que muda"),
nunca na descrição que ele lê. A tabela abaixo é o vocabulário, não a ordem: **a recomendada
sai da gravação** (a lista de cinco itens, o número que é a prova, o rosto que segura), e
vem primeiro com o porquê. A opção que leva entrada `proposta` diz que ela é nova e vai sinalizada.

São duas chamadas. A primeira tem até 4 perguntas, e a segunda só sai com o que a primeira
deixou aberto.

**Chamada 1, a estrutura:**

| Pergunta | As opções (e as entradas que cada uma leva, para o `brief.md`) |
|---|---|
| **como a tela se divide** | ele na tela com a legenda, e a animação só nas frases que mostram (`reel.cena.legenda`, `reel.cena.tela-cheia`) · a animação em cima, ele embaixo (`reel.cena.meia-tela`) · um sinal pequeno sobre ele, escurecido (`reel.cena.legenda-interface`; é nova e vai sinalizada) · a gravação deitada inteira no vertical, só quando ela é 16:9 (`reel.cena.horizontal-no-vertical`) |
| **interativo ou limpo** | as coisas reagem à fala: a conversa, a notificação, a lista que se marca, a caixinha, o botão (`reel.elemento.conversa-animada`, `reel.elemento.notificacao-do-reel`, `reel.elemento.lista-que-se-marca`, `reel.elemento.caixinha-de-perguntas`, `reel.elemento.botao-interruptor`; na peça com partes, `comum.componentes.elemento-que-volta`) · só nas provas · limpo, só a legenda e o corte (`reel.legenda.bastidor-simples`) |
| **quanto dele, quanto de animação** | o rosto volta a cada 8 s, e a tela cheia vai só na prova (`reel.ritmo.rosto-que-volta`) · a animação em cima em metade das frases (`reel.cena.meia-tela`) · a animação domina, e ele abre e fecha (`reel.ritmo.gancho-com-o-rosto`, `reel.ritmo.fecho-do-falado`). A frase a frase, eu proponho na página de planejamento |
| **a legenda** | as duas vozes, a palavra forte grande (`reel.legenda.cadencia-das-duas-vozes`, firme) · a da marca com o sublinhado (a ficha `marca.json` da `/cortes`) · a palavra numa pílula (`reel.legenda.chave-em-pilula`) · "quero ver as outras do acervo" (a escada, a serifada, a palavra com volume e o traço: `reel.legenda.apoio-em-escada`, `reel.legenda.voz-serifada`, `reel.legenda.chave-com-volume`, `reel.legenda.traco-na-chave`, que vão à prancha) |

**Chamada 2, o acabamento:**

| Pergunta | As opções |
|---|---|
| **a letra** (só quando a legenda escolhida não a fechou) | a família do kit em duas vozes (`comum.tipografia.duas-vozes`) · a palavra forte em serifa de contraste (`comum.tipografia.chave-em-serifa`). Fonte comercial sem licença não entra |
| **a matéria da palavra forte** (nas duas vozes) | a cor chapada · o metal · o vidro · o degradê (o `duas_vozes.chave.material` do `legenda.json` da peça, `.claude/skills/cortes/legenda.md`) |
| **o som** | discreto: um som por ação, só nas provas · marcado: um som em toda entrada e a batida no pico (`comum.som.um-por-acao`, `comum.som.impacto`) · com o teclado por baixo (`reel.ritmo.cama-de-teclado`; é nova e vai sinalizada). Os arquivos são do `kit/som.json` |
| **o efeito e o objeto** | só o brilho na palavra forte (`comum.efeito.brilho-na-chave`) · com o grão e a luz que varre (`comum.efeito.grao`, `comum.efeito.varredura-de-luz`) · com a palavra atrás da cabeça, uma vez (`reel.legenda.palavra-atras-da-cabeca`) · com o objeto 3D do kit ao lado da palavra (`reel.elemento.objeto-ao-lado-da-palavra`) ou o emoji do sistema (`comum.componentes.emoji-do-sistema`). O emoji e a imagem de clip-art não entram |

As respostas viram linhas do `brief.md`. O cardápio escolhe o vocabulário, e a prancha
mostra o resultado: a direção continua renderizada, nunca só descrita.

## A rodada 2 · depois da pesquisa e da prancha

Duas coisas abertas no navegador do usuário, e a pergunta vem depois de ele ver:

1. **a prancha** de 3 a 5 direções (`oficio.md`, "A prancha"), com a minha
   crítica de cada uma e a recomendada marcada
2. **a página de planejamento**, já preenchida por mim: cada frase do roteiro à
   esquerda, e à direita o tipo de cena, a animação, a câmera e o porquê; em
   cima, a cor de destaque e as fontes dentro do que a marca permite. Ele muda o
   que quiser e baixa o plano; o arquivo volta pelo `plano.mjs importar`

```bash
node .claude/skills/mograph/ferramentas/plano.mjs pagina <pasta-da-peça>     # gera planejamento.html do plano.json
node .claude/skills/mograph/ferramentas/plano.mjs importar <pasta-da-peça> <plano-baixado.json>
```

Ele também pode responder no chat ("na frase 4, tela cheia com o relógio"): a
mudança entra no `plano.json` do mesmo jeito, e a página se gera de novo.

**"Faça tudo e só me volte no fim"** são exatamente estas duas rodadas. Entre
a segunda e a entrega, só um P0 que muda o que se vende abre pergunta. Sem a
frase dele, a sabatina roda até a fronteira esvaziar, com parada também nos
quadros parados.

**Quando não dá para perguntar** (a skill rodando num subagente, num teste, ou
ele fora): a recomendada de cada pergunta vira a escolha, marcada no `brief.md`
como "escolha minha, no lugar dele", com o ASSUMPTION, a confiança e o custo do
erro; a prancha se renderiza do mesmo jeito, e a página de revisão abre com
essas escolhas no topo de "O que é seu decidir". A entrega não se dá por
aprovada antes de ele ver.

## O `brief.md`

Mora em `saidas/<estilo>-<tema>-<data>/brief.md`, nasce do
`ferramentas/modelo-brief.md`, e se grava **no instante em que cada decisão se
resolve**, com uma linha de aviso por gravação. Os campos do formulário de um
estúdio de referência (referência, objetivo, plataforma, ativos, marca,
duração, proporção, versões) são as linhas do topo. No fim da peça ele fecha
com o que ficou para ele decidir, e a página de revisão o mostra.

**Cada pergunta segue o `ferramentas/modelo-entrevista.md`**: um id (`E<n>`), de
2 a 4 opções com a recomendada primeiro e o porquê, o que muda com cada uma, e,
depois da resposta, a frase dele, a data e a linha "virou" quando a decisão vira
regra. As perguntas vão na seção "Entrevista" do `brief.md`.

## O que mata a sabatina

- pergunta sem recomendação: devolve o trabalho para ele
- pergunta sobre o que a memória ou o arquivo respondem
- descrever a direção visual em palavras em vez de renderizar
- pergunta no meio da construção que não é P0 de negócio
- menu de opções para decisão de texto ou de negócio: proposta pronta, que ele troca
