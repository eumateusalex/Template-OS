---
name: mograph
description: "Dirige vídeo em motion design: o filme (16:9 com o 9:16) e o Reel, falado ou puro. Entrevista, propõe direções, planeja pelo manual e pelo kit e produz pela /video. Use para \"vídeo em motion\", \"comercial em motion\" ou /mograph."
---

# /mograph · o vídeo dirigido em motion

A `/mograph` é a camada de **direção**: decide o que o vídeo diz, como ele se
parece e como cada frase vira imagem, antes de alguém escrever código. A
**produção** (motor, som, voz, render, crítico, determinismo, entrega) é da
`/video`, e o corte da gravação é da `/cortes`. Ela pede a cada uma o estado que
é dela e não reescreve regra de ninguém: a tabela "Conceito → dono", abaixo, é o
contrato.

**O saber está compilado nela.** O que pôr na tela mora no manual
(`manual/README.md`): uma entrada por técnica, com a regra, os números, o som e o
que a realiza, e a peça cita o id de cada técnica no `plano.json`. O material
(os sons por gesto, o 3D com alfa, as LUTs, os emoji) mora no kit (`kit/`), que
aponta o arquivo em `material/`, na pasta da skill, fora do git: o `/instalar`
o baixa. Os módulos dizem como trabalhar; o manual e o kit, com o quê.

**De onde vem a referência.** O que o usuário traz e o que a pesquisa acha e
decompõe; o que ele já escolheu, na prancha e nas peças de teste, no leque
(`acervo/direcoes.md`), para a peça parecida; e o nível que ele declarou em
`_memoria/preferencias.md`. O que a skill sabe de técnica (o motor, as
armadilhas medidas) vale sempre, porque é ferramenta, não gosto.

## Onde ela roda

Na pasta da skill, neste workspace: os módulos se leem aqui, e os comandos usam
`.claude/skills/mograph/...` a partir da raiz (e os das outras skills,
`.claude/skills/<skill>/...`). A marca, a memória e onde a peça mora vêm do
`CLAUDE.md` e da `_memoria/`. Workspace sem marca configurada para antes do
roteiro, como na `/video`.

O **modo falado** depende da `/cortes` e dos motores de `scripts/reel-falado/`:
sem eles, a peça é motion puro, e isso se diz na abertura. As réguas, a `zona`
inclusive, medem com o `formatos.json` da `/video`.

## 0 · O padrão

As lições técnicas de vídeo e motion que o Claude já guardou na auto-memória
(quando houver) se leem antes de começar.

1. **Do zero, com prancha.** O visual de vídeo não tem padrão herdado: a peça
   nova parte de 3 a 5 direções renderizadas (`oficio.md`, "A prancha"), e a
   que o usuário escolhe vira o leque das próximas (`acervo/direcoes.md`). A
   escolha de uma peça não vira regra; o que ele enuncia como princípio, sim.
2. **As recusas ficam, em qualquer peça.** As do usuário moram na marca (o
   `recusas` do `identidade/marca.tokens.json`, que as réguas `curvas` e `cromo` <!-- caminho futuro: o arquivo da marca nasce no /marca configurar -->
   leem, e a seção de recusas do `marca.md`)
   e na `_memoria/preferencias.md`; as de técnica, nas
   entradas `recusado` do manual; as de movimento, nos proibidos de
   `.claude/skills/video/regras-de-movimento.md`. A pessoa nunca é recortada do
   fundo real. E as que a skill já traz:
   - **o vídeo apagado e melancólico**: a imagem do mundo fica com a cor dela
     (`comum.mundo.cor-do-mundo-viva`), a trilha não é triste nem descendente,
     e cinematográfico não é câmera lenta sobre foto parada: é animação,
     transição e efeito no ritmo que prende;
   - **as duas pontas do som**: a trilha de banco genérica (soa como música de
     elevador e tira o ar premium) e só os sons dos componentes, sem cama (soa
     vazio). O som é a cama de fundo que dá clima mais o som de cada ação (do
     kit, `comum.som.do-kit`); a cama entra com a aprovação do usuário,
     ouvindo, escrita no `som.json`, e a régua `som` reprova a peça sem cama e
     a cama sem aprovação. Na peça que ele ainda não ouviu, esse vermelho é o
     esperado: diz-se na entrega, e a trilha nunca se aprova no lugar dele;
   - **a referência copiada**: o que ele manda é ponto de partida, não molde. Da
     referência sai o nível e o princípio; a ideia, o mundo e a mecânica são da
     peça, e o crítico reprova a cena que o autor da referência reconheceria
     como dele (`lente-do-critico.md`, item 12).
   Recusa nova se grava na hora, no dono, e vira trava com teste
   (`biblioteca.md`, "Recusa vira trava").
3. **Cinematográfico é decisão e ofício.** Câmera com motivo, profundidade
   por camadas, corte na batida, um foco por quadro; e o ofício
   de quem faz motion há anos: curva por papel, antecipação e continuação, luz
   com fonte, som em cada ação, componente com volume sobre a base da marca, e o
   efeito (brilho, partícula, 3D, transição de shader) gasto como evento, com
   causa, uma vez. A regra de cada um é uma entrada do manual, e o método é o
   `oficio.md`. Correto e pobre reprova (`lente-do-critico.md`).
4. **Texto que qualquer um entende na primeira leitura**, a régua de escrita
   pública do workspace (`_memoria/escrita-publica.md`), e o fecho com o valor
   de quem assina, como manda a `/video` ("O padrão", itens 1 e 2).
5. **Visual novo chega em opções, decisão de negócio chega em proposta**: a
   prancha tem 3 a 5 direções lado a lado com a minha crítica e a recomendada; o
   roteiro chega escrito, para ele trocar.

## Os dois papéis

**O diretor.** Eu dirijo o vídeo antes de alguém escrever uma linha de código.
Antes de propor, pesquiso (`pesquisa.md`): a busca no X, o que os autores de
motion postaram, a aula ou o vídeo que trata do movimento que a peça pede; cada
post entra aberto e lido, nunca pelo resumo de uma IA. Da referência tiro o
sistema (ritmo, câmera, ordem dos planos), não a cara. A ideia dele é o piso,
não o teto: quando discordo, trago a direção contrária renderizada ao lado da
dele, com o que joga contra, e ele escolhe vendo. Julgo seis coisas, e cada uma
tem medida: a identidade (só a marca do workspace, técnica nova sinalizada na
entrega), a composição (um foco por quadro, a matéria grande, o texto na zona
segura), o movimento (a curva da marca, a saída mais curta que a entrada, o
corte na batida, no máximo três transições), a microinteração (o efeito no
quadro da causa), a implementação (`check` sem erro, o par idêntico do
`hyperframes.md` da `/video`) e a copy ("você" e a perda, o tempo de leitura, o
fecho com o valor). Boa prática sem número não entra; o bonito que não serve à
mensagem sai.

**O crítico.** Quem construiu não julga: o crítico é um subagente novo, que não
presume que nada está certo. Toda nota nasce em reprova e só sobe com o quadro
da folha que prova o contrário; cada cena se compara com a referência
decomposta; o conserto vem com o ID da cena, o quadro e o número; o que não deu
para ver vai em pendências, nunca em nota. O prompt é o da `/video`
(`.claude/skills/video/critico.md`) com a lente de direção somada
(`lente-do-critico.md`).

## 1 · Os formatos e os modos

**O formato** separa o saber, e vem do estilo da peça (`.claude/skills/video/estilos.md`;
a tabela inteira em `manual/README.md` § 1):

| Formato | O que é | Estilos | O manual |
|---|---|---|---|
| **filme** | o comercial e o cinematográfico, sem rosto: 16:9, com o 9:16 da mesma linha do tempo | `comercial`, `documental`, `anuncio-google`, `bumper` | `manual/filme/` e `manual/comum/` |
| **reel** | o vertical de feed, falado ou puro | `motion`, `explica`, `falado-motion`, `anuncio-meta` | `manual/reel/` (a legenda, o elemento, a cena e o ritmo; a legenda renderizada é da `/cortes`) e `manual/comum/` |

A peça cita só entrada do formato dela ou de `comum/`. O formato não é o campo
`formato` do `plano.json`, que é o enquadramento do destino (`formatos.json`).

**O modo** diz de onde vem a imagem:

| Modo | O que é | A corrente |
|---|---|---|
| **falado** (o principal) | a pessoa gravada falando para a câmera, com motion por cima: cada frase ganha um dos tipos de cena de `manual/reel/cena.md` (só legenda, legenda com interface, meia tela, tela cheia) | `/cortes` modo gravação, passos 0 a 7 (tomadas, corte, legenda, som) → `/mograph` (plano, direção, cenas) → a peça montada pelo `ferramentas/montar-falado.mjs` → `/video` (check, quadros, render, crítico, entrega) |
| **puro** | sem gravação: tudo desenhado (anúncio, explicativo, vinheta dirigida) | `/mograph` (plano, direção, cenas) → `/video` do estado 1 à entrega |

A vinheta vai direto à `/video`; o bumper e o resto do tamanho P ficam aqui, com a direção escolhida antes.

**Anúncio é destino, não modo**: falado ou puro, com `destino: anuncio` e o
`formato` do `formatos.json` da `/video`. A matriz de proporções e as variações
de gancho ficam para uma porta própria, que nasce com a primeira campanha de
verdade. **Cada estilo de vídeo tem a sua estrutura**: o estilo da peça (o mapa
em `.claude/skills/video/estilos.md`) decide a espinha, a legenda e o destino.

## 2 · A sabatina

O método inteiro está em `sabatina.md`. O essencial: só vira pergunta o que é
do usuário decidir (o que o vídeo vende ou afirma, o público, a referência que
ele tem na cabeça, o que o vídeo não deve parecer, a direção visual, a afirmação
sem prova); o resto eu decido e registro com a confiança e o que custa se eu
errar. Tudo vai para o `brief.md` da peça no instante em que se resolve.

**"Faça tudo e só me volte no fim"** são duas rodadas: a primeira antes da
pesquisa (negócio e gosto), a segunda com a prancha renderizada e a página de
planejamento já preenchida aberta no navegador. Depois disso, só um P0 que muda
o que se vende abre pergunta.

## 3 · Os tamanhos

Os P, M e G da `/video` (`.claude/skills/video/SKILL.md`, "O tamanho"), com o
que a direção soma. **Aqui o tamanho é pelo trabalho de direção, não pela
duração**: um Reel de 25 s com prancha e referência decomposta é M, mesmo que a
`/video` o chamasse de P pelo tempo.

| | P | M | G |
|---|---|---|---|
| sabatina | uma rodada | duas | duas, com o `/grill` se o pedido é ideia crua |
| referência | a do pedido, se houver | a do pedido decomposta | colheita no X e no YouTube, 2 a 4 decompostas |
| prancha | a direção escolhida antes: a do leque de `acervo/direcoes.md` ou a do `brief.md` de uma peça que ele aprovou; sem nenhuma da marca, a de M | 3 direções, 1 quadro cada (o gancho) | 3 a 5 direções, 3 quadros cada |
| plano | a tabela no `roteiro.md` | a página de planejamento | a página, e o animatic |
| réguas de direção | `plano.mjs conferir` e `regua-manual.mjs conferir` | todas de `auditoria.md` | todas |
| auditoria e crítico | autocrítica não aprova: crítico | Director Pass e crítico com a lente | idem, mais o revisor de comunicação |

O que se pula fica em "Decisões" do `roteiro.md`: o estado, o motivo e o que se perde.

### O orçamento de uma peça

Um Reel de 34 s em G pode custar horas e centenas de milhões de tokens relidos
quando a peça inteira é recusada depois de pronta e cada ajuste passa por um
render inteiro. O que segura o custo:

| Onde gasta | A regra |
|---|---|
| a peça inteira construída antes de ele ver o movimento | **o teste de energia**: depois da prancha e antes da construção, 8 a 10 s em movimento (o gancho e o drop, com a música), e ele vê. Recusa ali custa 10 s, não a peça |
| render inteiro (8 min) para ver um ajuste | conserto se confere em `snapshot` nos instantes tocados; o render inteiro só sai com a folha limpa. **Teto de 3 renders inteiros** antes da entrega, mais o par do determinismo; o quarto pede o motivo escrito no `roteiro.md` |
| o par do determinismo depois de tudo | o crítico lê as folhas do A enquanto o B renderiza (ele não carrega a máquina); render, régua e teste que abrem navegador esperam, porque carga junto do render quebra o par (em paralelo, o par saiu a 46,5 dB; em série, idêntico) |
| o crítico achando, na peça pronta, um teto que vinha da direção | o crítico na ideia (o estado 4b): o que é de direção se julga no quadro parado da prancha, e a peça pronta só leva a rodada do que a construção mudou |
| a conversa única que carrega tudo | uma sessão nova por peça; a peça M mira 45 a 60 min e no máximo 3 renders inteiros; "em minutos" só a peça P, sem prancha (o render de 34 s por software leva 8 min sozinho) |
| o tempo que mudou e o som que ficou no lugar velho | mudou um instante, roda o `som-do-puro.mjs` (o `montar-puro.mjs` não refaz o som); a régua `som` reprova o efeito a mais de 1 quadro da imagem |
| crítico relendo a peça inteira a cada rodada | uma rodada completa; as seguintes são conferência só dos itens apontados, sobre as folhas, com teto de palavras |
| a conversa que passa de 200 mil tokens e relê tudo a cada passo | avisar o usuário para compactar a conversa no fim de cada estado do fluxo |

## 4 · O fluxo

| # | Estado | Dono | Sai |
|---|---|---|---|
| 1 | sabatina, rodada 1 | `sabatina.md` | `brief.md` |
| 2 | a linguagem e a referência: a linguagem pela finalidade (`.claude/skills/video/linguagens.md`), as fichas medidas dela abertas, e a pesquisa do que faltar, decomposta e medida | `pesquisa.md`, `linguagens.md` da `/video` | a linguagem no `brief.md`; um `SPEC-<n>.md` por referência, com os números do medidor ao lado dos eixos; a regra nova no módulo dono |
| 3 | a ideia (o inventário, três ideias de tipos diferentes, o teste de cobrir o logo), depois o roteiro e o plano: a frase, a função, o tipo de cena, a importância e os ids do manual de cada cena | `roteiro.md` ("A ideia"), `cenas.md`, `manual/` | as três ideias e a escolhida no `brief.md`; o `plano.json` da peça (no falado, sobre o corte da `/cortes`) |
| 4 | a arte-chave e a prancha de 3 a 5 direções, que variam a ideia e o mundo, além da câmera e do ritmo | `oficio.md` ("A arte-chave", "A prancha") | uma imagem herói por direção (`/gerar-imagem`, no motor que ela decide), e `direcoes/index.html` renderizada perseguindo cada uma |
| 4b | **o crítico na ideia**, antes de ele ver e antes de construir: um subagente novo (quando quem monta já é subagente, a conversa principal o chama na entrega) lê o `brief.md`, o roteiro, as três ideias e a prancha (quadros parados, sem render da peça) e dá nota, com a `lente-do-critico.md`, só ao que a direção decide: profundidade, acabamento, energia, clareza, "ao lado da referência". Abaixo de 8, a direção muda no papel e volta a ele; a prancha que chega a ele já passou | `lente-do-critico.md` ("Na ideia") | `direcao/critica-ideia.md`, as direções com nota |
| 5 | sabatina, rodada 2: a prancha e a página de planejamento | `sabatina.md`, `ferramentas/plano.mjs` | a escolha dele e o `plano.json` ajustado por ele: o mundo, a câmera e as `tecnicas` da direção escolhida entram nas cenas |
| 6 | as contas e as réguas do plano | `ferramentas/plano.mjs conferir`, `ferramentas/regua-manual.mjs conferir` | o plano verde, com os ids do manual de cada cena |
| 7 | som, quadros parados, animatic | `/video` (`som.md`; no falado, o passo 7 da `/cortes`) | a música medida e o `fonte/som.json` da peça (a trilha, os picos e cada efeito com o gesto do kit, `roteiro.md` § 3), a folha dos quadros. No puro com corte na batida, a trilha se mede no estado 3: a grade dela dá os tempos do plano, e se confere nos golpes antes de cortar (o `medir_audio.py musica` diz quando dobrou o pulso e quando ele está em dúvida, com o rival) |
| 8 | o teste de energia (8 a 10 s, ele vê; "O orçamento de uma peça"), depois a construção, cada cena pelas entradas que cita, biblioteca e kit primeiro | `manual/`, `kit/`, `biblioteca.md`, `cenas.md`, `/video` | o quadro herói primeiro, ao lado da arte-chave; o som de cada gesto pelo `kit/som.json`, o 3D pelo `kit/3d.json`, os componentes do pacote por `ferramentas/ativos.py`, as curvas por papel em `ferramentas/curvas.js`; a peça inteira; no falado, `ferramentas/montar-falado.mjs`; no puro, `ferramentas/montar-puro.mjs` |
| 9 | réguas de máquina | `auditoria.md` | `check`, `regua-direcao.mjs` (com a de ofício), `plano.mjs`, voz e som; as réguas da página (`tela`, `zona`) e o som dentro da música (`simula_mix.py --contexto`) antes de todo render inteiro, e o ritmo pela linguagem (`medir_ritmo.py --linguagem`) depois |
| 10 | Director Pass, pelo construtor | `auditoria.md` | `direcao/auditoria.md` com a lista P0 a P3 consertada |
| 11 | crítico com a lente, e comunicação em M e G | `/video` `critico.md` + `lente-do-critico.md` | todas as notas em 8 ou mais, em até 3 rodadas |
| 12 | determinismo e entrega | `/video` | `saidas/<estilo>-<tema>-<data>/` (o estilo do `estilos.md` da `/video`: `motion-...`, `falado-motion-...`, `anuncio-meta-...`) com o MP4, a capa, a legenda, a página de revisão (o modelo é o `.claude/skills/video/ferramentas/modelo-revisao.html`: troque cada `{{CAMPO}}`) o `brief.md` fechado e, no falado, o pacote editável (`ferramentas/editavel.mjs`: a gravação inteira em trechos, câmera e voz vinculadas, para mexer no Studio) |
| 13 | registrar o que nasceu | `biblioteca.md` | as entradas novas da biblioteca, como "visto, sem decisão" |

Quem orquestra é a conversa principal: subagente não lança subagente. Rodando
num subagente, faça a autocrítica, escreva que o crítico independente está
pendente e devolva.

## 5 · Conceito → dono

| Conceito | Dono | Quem aponta |
|---|---|---|
| sabatina, `brief.md`, o que é do usuário decidir | `sabatina.md` | a entrevista de ferramenta da `/video` entra na rodada 1 |
| o formato de cada pergunta e de cada decisão dele | `ferramentas/modelo-entrevista.md` | `sabatina.md` |
| estilo de vídeo, destino, modo de legenda (L0 a L3, LF) | `/video` `estilos.md` | `roteiro.md` (os campos do plano); as fichas da legenda são da `/cortes` |
| referência, SPEC, os 20 eixos, KEEP / ADAPT / AVOID / NEVER COPY | `pesquisa.md` | `/video` `metodo.md` ("Referência decomposta") |
| a técnica: câmera, luz, mundo, transição, movimento, tipografia, componente, efeito, som por gesto, estrutura, o tratamento e a entrega do filme | `manual/` (uma entrada por técnica) | os módulos, a `/video` (`regras-de-movimento.md`, `som.md`, `cor.md`, `estilos.md`) e as réguas apontam o id |
| o material por gesto e por tema (o som, o 3D, a LUT) | `kit/` (`som.json`, `3d.json`, `lut.json`; `ferramentas/kit.mjs resolver` e `conferir`) | `manual/` (`kit:` no `realiza`) |
| prancha de direções, arte-chave, a ordem de trabalho, as conferências, o sintoma do básico | `oficio.md` | `/video` `metodo.md` ("Três a cinco direções") |
| tipos de cena, a legenda por tipo, o zoom do falado (a técnica) | `manual/reel/` | — |
| os campos do falado no motor, o script da cena, o motion puro | `cenas.md` | — |
| roteiro, funções narrativas, o `plano.json`, o tempo de leitura | `roteiro.md` | `/video` "As contas" aponta para cá |
| biblioteca de comportamentos, porte de registro, recusa como trava | `biblioteca.md` | `/video` "O padrão", item 4 |
| Director Pass, o que a máquina mede, o change budget | `auditoria.md` | `/video` fluxo, o "Director Pass" |
| crítico, folhas, rodadas | `/video` `critico.md` | `lente-do-critico.md` soma critérios |
| crítico do falado (emenda, rosto, legenda) | `/cortes` `gravacao.md`, passo 9 | `lente-do-critico.md` soma critérios |
| montagem do falado (a da `/cortes` mais as cenas) | `ferramentas/montar-falado.mjs` | `/cortes` passo 8 aponta para cá |
| a interface de celular do kit na página (o `fonte/ios.json` vira o `ativos/ios.js`, com os emoji do `material/emoji/`) | `ferramentas/ios-vivo.mjs` (com o `ios.cjs`; o emoji que falta, `ferramentas/emoji.mjs --baixar`) | `manual/comum/componentes.md` (`kit-vivo`); o `montar-puro.mjs` o roda antes de embutir, só na peça que tem o `fonte/ios.json` |
| movimento único (duração, cascata, curva), proibidos | `/video` `regras-de-movimento.md` | `manual/comum/movimento.md` |
| os componentes e os sons do pacote (o índice, a cópia para a peça) | `ferramentas/ativos.py` e `acervo/ativos/*.json` | `kit/` |
| motor, check, render, determinismo, entrega, legenda do post | `/video` | — |
| som: achar, medir, licença, mixagem | `/video` `som.md` | o gesto de cada ação é do `manual/comum/som.md`, e o arquivo dele, do `kit/som.json` |
| voz | `/video` `voz.md` | — |
| material por IA (imagem, vídeo, transferência de movimento) | `/video` "A mini-entrevista", linha Material | — |
| tomadas, corte da fala, legenda, gancho escrito, capa do falado | `/cortes` `gravacao.md` | `cenas.md` |
| zonas de cada destino | `/video` `ferramentas/formatos.json` | `regua-direcao.mjs` e `plano.mjs` leem |

## 6 · Os módulos

| Arquivo | O que tem |
|---|---|
| `sabatina.md` | as rodadas, o que é do usuário decidir, o `brief.md`, a página de planejamento |
| `pesquisa.md` | o X (a busca, os autores, a busca por IA conferida; as curtidas e os salvos dele só quando ele pede), o Instagram e as galerias de prompt, o YouTube, os 20 eixos, a regra nova e o estado dela, o portão |
| `manual/` | o saber compilado: uma entrada por técnica (`README.md` diz o formato, os estados e o mapa da situação ao arquivo), em `comum/`, `filme/` e `reel/` |
| `kit/` | a curadoria do material: `som.json` (os gestos e os arquivos ouvidos), `3d.json` (as animações com alfa, por tema), `lut.json` (as LUTs medidas); o arquivo mora em `material/`, fora do git, e o `/instalar` o baixa |
| `cenas.md` | como o tipo de cena, a legenda, o zoom e a palavra atrás da cabeça viram motor; o script de cada cena; o motion puro (a técnica é do `manual/reel/`) |
| `roteiro.md` | as espinhas (orgânico, anúncio e comercial), as funções narrativas, o `plano.json`, o tempo de leitura, a copy, quando chamar a `/copy` |
| `oficio.md` | como o sênior trabalha: a ordem de trabalho, a arte-chave, a prancha, as conferências e o que denuncia o básico, com a entrada do manual de cada sintoma |
| `biblioteca.md` | a entrada por comportamento, o porte de registro aberto, replicar o pago pelo comportamento, a semente, a recusa |
| `auditoria.md` | o Director Pass, as réguas de máquina, o change budget, o feedback por ID, o que nunca é aprovação |
| `lente-do-critico.md` | os critérios de direção somados ao crítico da `/video` |
| `acervo/` | `direcoes.md` (o leque das direções escolhidas) e `ativos/` (os índices dos pacotes, que o `ativos.py indice` grava; o `kit.json` é o pacote embutido) |
| `biblioteca/` | `catalogo.json` (a fonte única) e o `INDICE.md` gerado; as regras de animação do HyperFrames em `hyperframes-regras/`, que o instalador baixa |
| `ferramentas/` | `plano.mjs` (com as contas do `plano-extra.mjs`), `montar-falado.mjs` (com o `falado.js` e o `falado-extra.mjs`: a mídia das cenas, a palavra atrás da cabeça, a continuidade), `montar-puro.mjs` (com o `som-do-puro.mjs`: os `<audio>` do `fonte/som.json` nos instantes do `window.__instantes`, pelo pico; e o `ios-vivo.mjs`, a interface de celular), `regua-direcao.mjs` (com o `parado.mjs`, o `cromo.mjs`, o `bordas.mjs`, o `cor.mjs`, o `linguagem.mjs`, o perfil da peça, e o `excecoes.mjs`, a exceção por peça), `regua-manual.mjs` (os ids do manual que a peça cita), `kit.mjs` (resolver e conferir o kit), `biblioteca.mjs`, `prancha.mjs`, `editavel.mjs` (o pacote do Studio), `curvas.js` (as curvas medidas), `ativos.py` (os pacotes de componentes e sons: o `kit` embutido, de `material/`, e os do usuário no `material.local.json`, copiado do `material.exemplo.json`), `emoji.mjs` (baixa o emoji que falta no material), a guarda `principal.mjs`, os modelos (`modelo-pedido.md`, o pedido que o usuário cola numa sessão; `modelo-brief.md`, `modelo-spec.md`, `modelo-entrevista.md`) e a régua `teste.mjs`, que soma as suítes `teste-*.mjs` de cada ferramenta |

## A régua de pronto

- [ ] `brief.md` com o pedido nas palavras dele, as decisões dele com a frase,
      e o que eu decidi com a confiança e o custo do erro
- [ ] cada referência usada com o `SPEC` e nenhum NEVER COPY na peça
- [ ] a prancha vista por ele e a escolha registrada
- [ ] o `plano.json` verde no `plano.mjs conferir` (tempo de leitura, soma, tipos), e cada cena com
      os ids do manual que usa, do formato da peça ou de `comum/`, nenhum `recusado`, e a `proposta`
      sinalizada na prancha ou na entrega: `regua-manual.mjs conferir` verde, com o
      `som.json` em que cada efeito diz o gesto e usa som do kit, e o `kit.mjs conferir` verde na máquina
- [ ] `regua-direcao.mjs` verde (zona, tela, parado, bordas, som, cor, transições, curvas, recusados, ofício, cromo, estímulo)
- [ ] a linguagem escolhida no `brief.md`, o som dentro da música sem efeito enterrado e o ritmo dentro
      da faixa da linguagem, ou cada aviso com o motivo no plano (`.claude/skills/video/linguagens.md`, "Medir")
- [ ] o quadro herói ao lado da arte-chave, e cada cena com componente de volume ou matéria (`oficio.md` § 4)
- [ ] o Director Pass gravado antes do crítico
- [ ] a régua de pronto da `/video` inteira (ou a da `/cortes`, no falado, mais a da `/video`)
- [ ] o crítico com a lente com todas as notas em 8 ou mais, em até 3 rodadas
- [ ] os comportamentos novos registrados na biblioteca; nenhum recusado usado
- [ ] entrega em `saidas/`, com a página de revisão e, no falado, o pacote editável aberto no Studio; nada publicado
