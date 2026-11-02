# O roteiro e o plano

O roteiro é o que se diz; o plano é o que cada frase vira. Os dois moram num
arquivo só da peça, o `plano.json`, e a tabela do `roteiro.md` da peça sai
dele (`plano.mjs tabela`): uma fonte, sem cópia que desanda.

## 0 · A ideia

Antes da espinha, a ideia: o que faz o vídeo parar de funcionar se trocarem o
logo pelo do concorrente. Ela se escreve no estado 3, antes da prancha, e vai para
o `brief.md`.

1. **O inventário**: o que o negócio (ou a oferta) tem de próprio: o objeto que
   ele usa, o gesto do serviço, o momento em que o cliente sente que deu certo, a
   voz (as palavras que o dono usa).
2. **Três ideias de tipos diferentes**, cada uma numa frase que prevê o que
   acontece na tela, e a primeira que veio à cabeça posta de lado. Tipos:
   documentário de uma tarefa, plano único, a calma que se quebra, ensaio
   tipográfico, montagem de resultado real, o antes e o depois.
3. **O teste de cobrir o logo**: tapando a marca, a ideia ainda é desta marca? Se
   serve a qualquer empresa, volta ao inventário.
4. **A escolha com uma frase**, e as outras duas viram direções da prancha
   (`oficio.md`, "A prancha"): a prancha varia a ideia e o mundo, não só a câmera.

O erro mais comum de peça fraca é de ideia e de mundo, não de câmera: por isso a
ideia vem antes do roteiro.

## 1 · As espinhas

**Orgânico** (o Reel do perfil, função de atenção ou autoridade), seis partes:
o gancho com a perda de quem assiste; a cena do problema acontecendo; a prova
que mostra o furo; a consequência; a virada, com quem assina resolvendo; a
assinatura com o valor dele no problema do vídeo.

**Anúncio** (resposta direta, 25 a 35 s): o gancho com a palavra
do produto, falada e escrita, até 3 s; o problema numa cena, de 3 a 8 s; a
coisa funcionando, de 8 a 20 s; a prova e o risco, de 20 a 25 s; a oferta e a
chamada no fim, com a oferta já aparecendo no começo.

**Bumper** (o anúncio de 6 s do YouTube, 16:9, o estilo `bumper` do `estilos.md` da `/video`):
uma ideia e uma frase de até ~40 caracteres, em três tempos de cerca de 2 s: a situação; a coisa
funcionando, que é o pico; a marca. Sem prova nem oferta, que não cabem em 6 s.

**Comercial** (o produto ou a marca de um negócio, sem rosto, 20 a 30 s; o estilo `comercial`
do `estilos.md` da `/video`), pelo método que se repete em quem faz comercial com IA:
1. a marca lida antes do roteiro: o print da página inteira do site, a identidade e o produto
   real mapeado, para a peça nascer do que o cliente é;
2. a empresa grande ganha a referência replicada cena por cena, pelo comportamento e nunca pela
   cara (`pesquisa.md`);
3. o pensamento do vídeo cena a cena no `plano.json` (cena, quadros, curva, cor, texto), lido e
   corrigido antes de gerar qualquer quadro;
4. a interface, o texto e a marca em código; o 3D ou a foto que o código não faz, por vídeo gerado
   por baixo (`comum.mundo.marca-em-codigo-por-cima`);
5. o refino por ondas, sempre em número ("a cena 2 vem 8 quadros para trás", "o cursor anda 150
   px");
6. o 16:9 e o 9:16 da mesma linha do tempo (`filme.entrega.dois-formatos`);
7. o fecho na marca do cliente.

**Peça com partes** (três erros, quatro passos): a espinha orgânica com as
partes no lugar da prova, e o elemento que volta a cada parte (`comum.componentes.elemento-que-volta`).

## 2 · As funções narrativas

Cada cena tem **uma** função (o campo `funcao`), das quinze:

| Parte da espinha | Funções |
|---|---|
| gancho | `HOOK` (+ `PROMISE` no anúncio) |
| problema | `PROBLEM`, `CONTEXT` |
| prova | `DEMONSTRATION`, `PROOF`, `EXPLANATION`, `PROCESS` |
| consequência | `TENSION`, `COMPARISON` |
| virada | `TRANSFORMATION`, `REVEAL` |
| assinatura | `BRAND`, `CTA`, `EMOTION` |

Cena cuja função não chega à mensagem do filme sai.

## 3 · O `plano.json`

```json
{
  "nome": "reel-exemplo",
  "modo": "falado",
  "destino": "organico",
  "formato": "reel",
  "legenda": "L2",
  "fps": 30,
  "duracao": 42.5,
  "filme": "o que quem assiste tem de lembrar, numa frase",
  "estilo": { "id": "falado-motion", "destaque": "--ios-azul", "fonte": "Inter 4" },
  "interface_aprovada": false,
  "virgula": { "em": 27.4 },
  "excecoes": [{ "curva": "back.out", "onde": "S03", "motivo": "o celular pousa" },
               { "transicao": "morph", "motivo": "o botão vira a conversa e a conversa vira a agenda: é o produto" }],
  "cenas": [
    {
      "id": "S01",
      "frase": 1,
      "de": 0, "ate": 3.2,
      "fala": "o texto falado da frase",
      "tipo": "legenda",
      "funcao": "HOOK",
      "importancia": 2,
      "tempo_forte": "acento",
      "mensagem": "a ideia da cena numa frase",
      "entende": "o que quem assiste entende aqui",
      "visual": "a ideia que a imagem mostra, nunca a palavra ilustrada",
      "camera": "PARADA",
      "motivo": "",
      "texto_tela": "",
      "componente": "",
      "tecnicas": ["reel.cena.legenda", "reel.ritmo.gancho-com-o-rosto", "comum.tipografia.duas-vozes"],
      "motivo_mao": "",
      "saida": "y-",
      "transicao": "corte",
      "entrada": "",
      "som": "",
      "porque": "por que este tipo de cena nesta frase"
    }
  ]
}
```

- `modo` é `falado` ou `puro`; `destino` é `organico` ou `anuncio` (a zona
  segura sai de `.claude/skills/video/ferramentas/formatos.json`).
- `tipo`: no falado, `legenda`, `legenda-interface`, `meia-tela`, `tela-cheia`;
  no puro, `texto`, `pessoa`, `objeto`, `grafico` (`cenas.md`; cada tipo do falado é uma entrada de `manual/reel/cena.md`, e os do puro
  estão juntos em `reel.cena.familias-do-puro`).
- No falado, `frase` é o número da frase no `cortes.json` da `/cortes`, e o
  `de`/`ate` vêm de lá (`plano.mjs` os preenche pelo `dados.js`); no puro, as
  cenas se encostam (o `ate` de uma é o `de` da seguinte) e a última termina na
  `duracao`.
- `camera` é do vocabulário do manual (`comum/camera-e-luz.md`: `PARADA`, `EMPURRA`, `RECUA`,
  `DESCE`, `SOBE`, `ACOMPANHA`, `REENQUADRA`, `MACRO`); com câmera que não é `PARADA`, o
  `motivo` tem até 6 palavras (`comum.camera-e-luz.camera-com-motivo`).
- `texto_tela` é o texto da animação (não a legenda, que é da `/cortes`): até 4
  palavras quando há voz, porque a tela traz a palavra-chave e a voz a frase. No
  puro sem voz (`"voz": false` no topo do plano) a tela carrega a frase, e o teto
  é 8 palavras, uma frase curta por tela.
- `componente` é o `id` da biblioteca (`biblioteca/catalogo.json`) ou vazio
  quando nenhum comportamento serve (nunca o mais parecido, que diz o que a cena não faz);
  nunca um recusado.
- `tecnicas` são os ids do manual (`manual/`) que a cena usa, nunca vazio: do formato da peça
  (o `filme` ou o `reel`, que sai do `estilo` pela tabela do `manual/README.md` § 1) ou de
  `comum/`, e nenhum recusado. A proposta entra, e a régua a lista para o usuário ver na prancha.
  O componente de `comum.componentes.*` que só se faz à mão (o `realiza` é só `mao`) pede o
  `motivo_mao`: por que nenhum bloco do registro, construtor do kit ou comportamento serve.
  A interface de celular que o `ios.cjs` constrói (`comum.componentes.kit-vivo`) não se copia: a peça a declara
  em `fonte/ios.json` (`{ "<id>": { "construtor": "mail", "args": { ... } } }`), o `ios-vivo.mjs` grava
  o `ativos/ios.js` (`window.IOS`) e o `montar-puro.mjs` o gera de novo antes de embutir; só a parte
  que o `ios.cjs` não tem se faz à mão, nas medidas do construtor mais próximo, com o `motivo_mao`.
- `ativos` (no topo do plano) lista cada imagem e vídeo que a página carrega, fora o `_marca/` e o `_vendor/`,
  como `{ arquivo, origem }`: `foto`, `video`, `gerado`, `kit`, `material`, `produto`, `captura`
  ou `efeito` (com `motivo`): a `origem` é só a palavra, e de onde a imagem veio vai em `nota`. O que o script pinta imitando foto é `comum.mundo.cenario-pintado-em-codigo`,
  recusado.
- No `som.json` da peça (o `fonte/som.json` do puro, o mesmo que vai no `--som` da régua do
  manual, sem cópia ao lado do plano), cada efeito diz o `gesto` do
  `kit/som.json` e usa um som dele: o arquivo com o nome que o `ativos.py trazer` grava, ou a
  `origem` (`"pacote:caminho"` do kit, que o `letras`, de nomes fixos, sempre leva), ou o
  `motivo` do som de fora do kit. A técnica de digitação pede o gesto `tecla`.
- No falado, a cena pode ter `zoom` (a câmera do falado: `em`, `escala`, `ancora_y`, `quadros`, `curva`, `volta`, `quadros_volta`, ou uma lista deles; `cenas.md`) e `midia` (o vídeo que ela toca, `cenas.md`), e o topo do
  plano pode ter `atras` (a palavra atrás da cabeça, uma vez); a `transicao` é `corte`,
  `continuidade` (só entre duas telas cheias), `zoom-dentro` (de uma cena com o rosto para uma
  tela cheia) ou `flash` (um por peça, na virada). O id da transição vai nos `tecnicas` da cena que sai.
- `excecoes` guarda o motivo de cada curva fora do padrão (o `back.out` em
  objeto que pousa); `interface_aprovada` só fica `true` depois que ele escolheu
  a interface sobre a câmera na prancha (`cenas.md`).
- `saida` é o eixo e o sentido em que a cena sai (`x+`, `x-`, `y+`, `y-`, `z+`,
  `z-`); `transicao` é como ela passa para a seguinte (sem o campo, `corte`), e `entrada`, quando a
  seguinte entra num eixo diferente (a lei do vetor e o orçamento de transições,
  `comum.transicao.vetor` e `comum.transicao.orcamento`). A segunda `morph` da peça pede o motivo
  em `excecoes`.
- `cortes_internos` (opcional) lista os instantes, em s da peça, dos cortes de câmera dentro da
  cena, os que o `visual` descreve (o plano aberto que corta para o fechado). Com o `--plano`, o
  `medir_ritmo.py` da `/video` mede cada um e o `ate` de toda cena que corta num piso
  mais baixo que o do vídeo inteiro (o corte de escala entre dois claros fica entre 0,2 e 0,3 de
  `scene`), e avisa o corte do plano que o vídeo não mostra.
- `formato` é a chave do `formatos.json` da `/video` (`reel`, `anuncio-reels`,
  `shorts`, `tiktok`, `meta-feed-4x5`, `quadrado-1x1`, `yt-16x9`); sem ele, o
  `destino` decide entre `reel` e `anuncio-reels`.
- `legenda` é o modo (`L0` a `L3`, `LF`, `.claude/skills/video/estilos.md` § 1 e § 5),
  no topo e, quando muda, por cena; o falado nunca é `L0`.
- `importancia` vai de 1 a 3 por cena; no máximo 25% das cenas em 3, e o pico é
  a primeira delas. `tempo_forte` diz o que a cena faz no tempo forte da trilha
  (`revela`, `escala`, `pousa`, `acento`); o pico cai num `revela` ou `pousa`.
- `virgula` é o instante da única parada total da peça (`comum.estrutura.virgula`), até
  1,5 s antes do pico; a régua `parado` a aceita sem aviso. O `respiro`
  (`[{ "de", "ate", "motivo" }]`) é o trecho calmo **depois** do pico, o que o
  espectador digere (o minidocumentário e a tipografia cinética medidos), e o
  `medir_ritmo.py --plano` não o conta como quase parado.
- `linguagem` é a do `linguagens.json` da `/video`, e `estilo` o do `estilos.md`
  (o texto, ou o `id` dentro do objeto de `destaque` e `fonte`); o estilo sem
  linguagem traz a dele. As réguas leem os dois (`ferramentas/linguagem.mjs`):
  onde a voz manda no tempo, o `tempo_forte` da cena pode ser `voz` (ela cai na
  frase, não na batida) e a batida da trilha não se cobra; o `documental` e o
  `so-efeitos` não cobram o piso de tipos de efeito; o `documental` aceita o
  `dissolver` com a `causa` escrita na cena que sai. A `causa` também cala a ida e
  volta de sentido.
- `texto_inteiro_em` é o instante (s da peça) em que o texto que entra aos
  poucos fica inteiro (o componente com `texto_progressivo` no catálogo: a busca
  que se digita, a frase que sobe palavra por palavra); a leitura conta dali.
- `frases` (`[{ "de" }]`, opcional, no puro com voz) é o começo de cada frase da
  voz, do `palavras.json`: a régua `estimulo` conta a frase nova como algo novo.

## 4 · As contas, antes do código

**Tempo de leitura.** Cada texto na tela fica pelo menos **caracteres ÷ 17 +
0,5 s, e nunca menos de 1,2 s** (17 caracteres por segundo é o teto do guia de
legendas da Netflix para o português do Brasil; a folga de 0,5 s e o piso são
calibragem). Vale para o `texto_tela` e
para a legenda; a conta da `/video` aponta para cá.

**Soma.** No puro, as cenas cobrem a duração sem buraco nem sobra; no falado,
toda frase do corte tem cena.

**O fim.** As cenas de CTA somam até 25% da duração. O CTA se lê com o quadro
vivo, em dois tempos, e só o último quadro resolvido fica parado (o teto, em
`comum.estrutura.o-fim`): a leitura acima e o fim curto convivem assim.

**O tempo da palavra.** No falado e no puro com voz, o que a voz nomeia entra no
quadro em que a palavra começa (o tempo vem do `palavras.json`), o texto e o som do
toque até 2 quadros antes, nunca depois.

**Espaço.** O texto e o principal ficam dentro da zona segura do destino; a
zona do anúncio é bem mais apertada embaixo que a do orgânico (os números são do
`formatos.json` da `/video`).

**História.** O revisor de comunicação lê a coluna `entende` em sequência,
sozinha: se a história não fecha só com ela, a peça não fecha.

```bash
node .claude/skills/mograph/ferramentas/plano.mjs conferir <pasta-da-peça>
node .claude/skills/mograph/ferramentas/plano.mjs tabela <pasta-da-peça>     # a tabela para o roteiro.md
node .claude/skills/mograph/ferramentas/regua-manual.mjs conferir <pasta-da-peça>/plano.json   # o manual e o kit (no falado, com --sem-som: o som é da /cortes)
```

No falado, o `plano.mjs conferir` pede o `dados.js` que a montagem da `/cortes` gera (os tempos de
cada frase): antes do corte, o plano é rascunho, e só a régua do manual roda sobre ele.

## 5 · A copy

A régua é a de escrita pública **da marca da peça**: balcão, "você" e a perda,
uma ideia por frase, sem jargão sem tradução, sem travessão. A caixa, a voz, o
convite e as palavras proibidas são da marca: `_memoria/escrita-publica.md`; num
projeto com marca própria, o guia de voz dele, que manda sobre o do workspace (o
do workspace corre junto só no que não briga com a marca do projeto). O fecho mostra o valor
de quem assina no problema do vídeo, nunca manda resolver com terceiro (a
`/video`, "O padrão"). O CTA só promete o que alguém atende
(`_memoria/estrategia.md` diz se a DM está ligada). Todo texto público passa
pela `humanizer` antes do gate.

No falado, quem fala é ele: o roteiro que eu escrevo para ele gravar segue a
voz dele, frase curta que se diz num fôlego, a primeira frase com o problema de
quem assiste (a `/cortes`, passo 0).

## 6 · Quando a peça vende

A copy passa pela `/copy`, módulo resposta-direta: o portão da oferta
(promessa, prazo, risco, uma ação) e o portão da prova. A oferta vem da memória
(`_memoria/oferta.md`), e o preço segue o que ela diz. Sem número, prazo e risco, ela
volta à `/oferta`. A `/mograph` traduz o arquivo da `/copy` em cenas; não
reescreve a oferta.
