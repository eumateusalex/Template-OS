# scripts/ — os instrumentos

Rodam com `node`, usam o **Playwright do ditto** (`C:/dev/ditto/node_modules`,
configurável por `DITTO=`), e recebem parâmetro por **variável de ambiente**.

Os clones morrem; estes sobrevivem, porque são o método.

## 🚨 Quando o clone está errado e não se sabe por onde começar

| Instrumento | Responde |
|---|---|
| **`linha-de-base.mjs`** | desliga a camada inteira e mede o clone puro: **de quem é a culpa?** |

Medido no site-exemplo: 29 fora do lugar sem a camada, 45 com ela — a camada
**acrescenta 16 defeitos**. Este é o primeiro comando a rodar diante de
qualquer divergência, e o método completo está em
[`../referencias/diagnostico.md`](../referencias/diagnostico.md).

## A ordem de uso

| # | Instrumento | Responde |
|---|---|---|
| 1 | `levanta-rotas.mjs` | quais rotas o site tem? (sitemap × varredura, com procedência e status do original) |
| 2 | `clona-completo.mjs` | clona TODAS elas, pelo plano all-static via API local |
| 2b | `clona-em-lotes.mjs` | o mesmo, FATIADO, quando a API morre de memória em site grande (medido: 231 rotas derrubaram a API); a porta da API sai do `api-local.mjs` (uma livre, ou a do `API=` se não tiver dono), e ele nunca derruba o dono de uma porta (prova: `teste-api-local.mjs`) |
| 2c | **`recupera-assets.mjs`** | 🚨 os binários que o plano all-static REFERENCIA e nunca baixou — o nome local é `sha1_12(url)`, então se recompõe da origem |
| 3 | `corrige-metas.mjs` | devolve a cada rota o título, canônico e OG que ela perdeu |
| 4 | `serve-clone.mjs` | serve o `out/` sem cache, pra medir |
| 5 | `bateria-cobertura.mjs` | toda rota responde 200? título bate? imagem quebrada? overflow? |
| 6 | **`compara-geometria.mjs`** | 🚨 **CADA elemento está no lugar?** É este que decide "idêntico" |
| 6b | `compara-visual.mjs` | detector grosso: altura de página, fonte que não carregou |
| 6c | `corrige-geometria.mjs` | conserta o estático que a captura errou, e **desfaz sozinho** o que piorar |
| 6d | `inspeciona.mjs` | o microscópio: um elemento, os dois lados, lado a lado |
| 7 | `compara-conteudo.mjs` | mesmo texto, mesmas imagens, mesmos links — medido no navegador nos dois lados |
| 7b | `corrige-texto.mjs` | aplica no clone as divergências de texto **medidas** (sem digitar nada) |
| 7c | **`confere-pareado.mjs`** | 🚨 lê os DOIS lados no MESMO ponto do ciclo de vida. Existe porque a cobertura acusa título divergente num clone byte a byte IDÊNTICO quando o JS reescreve `document.title`: o clone local roda antes do original, que vem pela rede. Compara também elementos, imagens quebradas, altura, animações vivas, SVGs, fonte, fundo e **console pareado** |
| 7d | **`gate-vazamento.mjs`** | 🚨 o clone fala com servidor de TERCEIRO? Intercepta toda requisição, percorre o formulário até o envio, e reprova por host. Pega o que só existe em runtime — `fetch` de CRM e pixel alheios que NENHUM dos 7 gates enxerga, porque não está no HTML |

O fluxo com os comandos prontos está em
[`../referencias/fluxo-completo.md`](../referencias/fluxo-completo.md).

## Interação (dimensão 5)

| # | Instrumento | Responde |
|---|---|---|
| 7c | `mede-interacao.mjs` | o que responde a hover e clique, com ida e volta separadas — rodar nos **dois** lados |

⚠️ Ele **recarrega a página** sempre que um clique muda o estado. Sem isso, um
modal aberto contamina todo alvo seguinte: medido, um clique em "Contact"
contamina 8 alvos seguidos.

⚠️ Cobertura se testa em **cinco pontos**, não só no centro: no centro de um
card de projeto está a imagem, e testar só ali reprovou 4 cards perfeitamente
clicáveis.

## Comportamento (dimensões 5 e 6)

| # | Instrumento | Responde |
|---|---|---|
| 11 | `mede-scroll.mjs` | o que muda ao rolar, em que limiar, para qual estado |
| 11b | **`mede-revelacao.mjs`** | 🚨 quem está abaixo da dobra já apareceu, ou espera o scroll? Roda nos DOIS lados e compara |
| 12 | **`gera-scroll.mjs`** | mede e reconstrói, separando **alterna / revela / contínuo** |
| 13 | `gera-acordeao.mjs` | reconstrói acordeão/FAQ, medindo altura e duração no original |
| 14 | `gera-interacao.mjs` | reconstrói os estados de `:hover` medidos |
| 15 | `corrige-interacao.mjs` | 🚨 desbloqueia o clone: `::after` decorativo e `pointer-events` |
| 15b | **`mede-tipografia.mjs`** | 🚨 o ditto ARREDONDOU o font-size? Mede os dois lados em várias larguras e diz se a escala do original TRAVA na faixa |
| 15c | **`corrige-tipografia.mjs`** | devolve o font-size/line-height fracionário, só onde a escala trava — quem não trava sai declarado |
| 16 | **`corrige-variaveis-css.mjs`** | 🚨 devolve as propriedades CSS customizadas que o ditto destrói no JSX |
| 15d | **`corrige-tipografia-fluida.mjs`** | o tamanho que NÃO trava: acha a rampa por RAZÃO CONSTANTE (v/L) e escreve `clamp()`, verificando a previsão num ponto reservado |
| 15e | **`corrige-caixa-vazia.mjs`** | devolve a largura de elemento decorativo vazio que a captura colapsou para zero |
| 15f | **`corrige-viewport.mjs`** | devolve `Nvh` onde a captura congelou `100vh` em px da janela dela |
| 15f2 | **`corrige-espacador.mjs`** | 🚨 o mesmo defeito no elemento VAZIO, que o 15f não enxerga: espaçador não tem descendente para ancorar, então casa pelo VIZINHO SEGUINTE. Um espaçador de topo errado desloca a PÁGINA INTEIRA (medido: balde único de −40px em 4 rotas do framer-9) |
| 15g | **`corrige-inercia.mjs`** | 🚨 o contrapeso do `corrige-interacao`: devolve ao clone o que o ORIGINAL mantém morto (modal fechado) |
| 17 | **`liga-css.mjs`** | garante que cada rota IMPORTE as folhas (escrever o CSS não o liga) |
| 17b | **`entrega-inline.mjs`** | 🚨 põe as folhas num `<style>` de `layout.tsx` por rota — o caminho do import não entrava na cascata neste build |
| 18 | **`captura-estado.mjs`** | 🚨 captura o que só existe DEPOIS de um clique: drawer, modal, menu |
| 19 | **`gera-slides.mjs`** | 🚨 devolve os irmãos-slide que a captura de UM instante perdeu (carrossel/fileira mutilada): clona o slide-modelo do próprio clone e devolve texto/imagem/diffs por medição. Substitui slide capturado INCOMPLETO, casa por mapa de texto (sobrevive à duplicação por breakpoint), exige âncora com CAIXA VIVA (senão injeta no gêmeo `2xl` invisível) e mantém um vigia no `body` contra a hidratação do React, que APAGA a injeção |

| 20 | **`mede-navegacao.mjs`** | 🚨 **DIMENSÃO 7**: o clone troca de página como o original? Planta marca no `window`, clica com evento REAL e vê se a marca sobreviveu (client-side) ou morreu (documento novo). Mede em saltos encadeados, porque é do 2º em diante que o runtime morre, e confere se a camada continua viva depois da troca. Sem ele, um clone sai dado como pronto com a dimensão 7 nunca medida |
| 21 | **`mede-hover-curva.mjs`** | 🚨 a CURVA do hover, não só os dois extremos. O `mede-interacao` fotografa o repouso e o hover 450ms depois, e com isso o `gera-interacao` escreveria um `:hover` INSTANTÂNEO — a transição inteira do original some. Amostra por rAF, com IDA (`pointerover`) e VOLTA (`pointerout`) separadas, e declara o regime: `transicao`, `instantaneo` (≤2 quadros: o fiel é não escrever transition) ou `continuo` (laço, que nunca vira transition). Não amostra os N alvos: amostra as ASSINATURAS, e diz quais índices cada uma representa. Alimenta o `gera-interacao` por `CURVA=`. Medido no framer-5: o original tem 48 alvos com hover e, sem a curva, o clone reproduz 4, nenhum com transição |
| 22 | **`mede-transicao-pagina.mjs`** | 🚨 a CARA da troca de rota, ponto cego dos outros: o `mede-navegacao` espera 2600ms depois do clique (todo fade já acabou) e o `inventario-movimento` nem navega. Arma o coletor ANTES do clique — em navegação client-side o documento persiste — e amostra `opacity/transform/filter` durante a troca, separando o fade de SAÍDA (a marca que morre) do de ENTRADA (a que nasce) por marca incremental, nunca por índice. Diz também se elas se SOBREPÕEM, que é o critério de CSS × GSAP. Rodar nos dois lados; "não tem transição" é resultado legítimo e vira número no relatório |
| 23 | **`mede-rotacao.mjs`** | separa "elemento parado numa matriz girada" de "elemento GIRANDO" — o `mede-carrossel` lê `m.e`/`m.f` (translação) e a rotação, que vive em `a`/`b`/`c`/`d`, passa inteira por baixo dele. Desenrola o ângulo, mede °/s e o desvio relativo: `continuo` (cv<10%) pede `@keyframes` com a velocidade medida; `estatico` pede a matriz de repouso certa e exige zero. Existe porque um avatar que gira em laço é fotografado num ângulo qualquer, o clone recebe aquilo como estado fixo, e sobra um punhado de px que resiste a toda rodada — fase, não posição |

🚨 **O `corrige-interacao.mjs` vem ANTES de qualquer reconstrução de interação.**
Sem ele o clone não recebe mouse em lugar nenhum, e medir um clone bloqueado
mede o bloqueio, não o comportamento.

## Trilho: três perguntas separadas, três instrumentos

Marquee, galeria e carrossel são o mesmo objeto visto de três ângulos, e
confundi-los custa rodadas inteiras.

| Instrumento | Responde |
|---|---|
| **`reconstroi-trilho.mjs`** | **quais itens existem** — devolve ao JSX os que a captura perdeu (no framer-4, os 45 logos do marquee e os 20 slides de depoimento), com a caixa de cada um medida e a ocultação do original reproduzida |
| **`fase-marquee.mjs`** | **onde ele começa** — apaga a fase que a foto congelou; o transform capturado não é posição de repouso |
| `mede-carrossel.mjs` · `gera-carrossel.mjs` · `gera-marquee.mjs` | **como ele anda sozinho** — velocidade medida por trilho, no CSS da rota |
| `captura-slides.mjs` · `gera-slides.mjs` | carrossel **virtualizado**: os slides só nascem quando se navega até eles |
| **`gera-carrossel-janela.mjs`** | carrossel de setas com os slides **já no DOM**: o que anda é o transform mais a janela de visibilidade |

⚠️ Um trilho com a velocidade certa e a fase errada fica fora do lugar **para
sempre** (medido: 155,4px). Um com os itens certos e sem motor conta como
estático e some do controle de laço.

## Caixa que colapsa e número que sobe

| Instrumento | Responde |
|---|---|
| **`corrige-caixa-colapsada.mjs`** | 🚨 a caixa que nasce com largura ZERO porque todo o conteúdo dela é absoluto — some da tela sem deixar buraco visível (82 casos no framer-4, em 27 rotas) |
| **`mede-contador.mjs`** · **`gera-contador.mjs`** | o número que sobe: partida, chegada, duração e curva medidas — e o motor que **pausa fora da tela e retoma**, como o original |

## Rodar tudo de uma vez

| Instrumento | O que faz |
|---|---|
| `propaga-comportamento.mjs` | roda o ciclo em TODAS as rotas, em **duas passadas** com um build entre elas |
| `checkup.mjs` | a matriz final: uma linha por rota, uma coluna por dimensão — **célula vazia é pendência** |

⚠️ Ele **não builda entre rotas** de propósito: build é caro e o CSS gerado não
afeta a medição do original. O build vem uma vez no fim, e aí os gates rodam.

⚠️ Salva progresso a cada rota. Interromper não custa o trabalho inteiro —
rodar de novo pula o que já fechou.

## Camada de comportamento (depois que a cobertura fechar)

| # | Instrumento | Responde |
|---|---|---|
| 8 | `inventario-movimento.mjs` | o que se mexe, quando dispara, com que duração e curva — por **três** fontes independentes (WAAPI, rAF parado e geometria durante o scroll) |
| 9 | `gera-entrada.mjs` | escreve a animação de entrada no clone **a partir da medição**, sem número digitado |
| 10 | `confere-entrada.mjs` | 🚨 **gate obrigatório**: cada regra escrita realmente aplicou no build? |
| 10b | **`confere-entrada-todas.mjs`** | o gate acima em TODAS as rotas, agregado — em clone de 47 rotas é onde se pula o gate justamente na que quebrou |

⚠️ **O `confere-entrada.mjs` não é opcional.** Escrever a regra não garante que
ela sobreviva ao build: o minificador do Next já invalidou um `linear()` e
matou 2 de 12 animações **sem nenhum erro em lugar nenhum**. Ele é o único
instrumento que separa "gerei o CSS" de "o navegador obedeceu".

Rodar o `7` nos **dois** lados: no original para saber o que existe, no clone
para provar que a reconstrução funcionou. O método está em
[`../referencias/comportamento.md`](../referencias/comportamento.md).

## As regras que estes instrumentos embutem

Não desfazer nenhuma. Cada uma existe porque a alternativa falha de verdade:

1. **Célula vazia é trabalho não feito.** O que não foi medido sai como `null`
   e conta como pendência. Nenhum instrumento arredonda pra cima.
2. **Comparar com o ORIGINAL, nunca com o próprio clone.** Acusar "título
   duplicado" dentro do clone dá **5 falsos alarmes** — o original também
   repete o título. O defeito é divergir do original.
3. **Resolver link pelo `a.href` do navegador**, nunca pelo atributo cru. É
   por resolver o atributo contra a raiz que o crawler do ditto inventa rota
   fantasma e perde rota real.
4. **Rolar a página antes de colher.** Índice de coleção só renderiza o que
   entra em tela; colher sem rolar entrega parte da lista e chama de lista.
5. **Semear a fila com o sitemap.** Rota que ninguém linka (página de erro,
   template solto) nunca entraria pela varredura e sairia sem status.
6. **Seletor estrutural, nunca por classe.** `.bg-surface-2` é Tailwind e só
   existe no clone; medir os dois lados com ele compara coisas diferentes.
7. **Mesmo viewport nos dois lados.** Medir o original a 1920 e o clone a 1440
   produz "diferença" que não existe.
8. **Imprimir progresso a cada item.** Sem isso, varredura travada fica
   idêntica a varredura lenta.
9. **Imagem quebrada se afere por `currentSrc` + `complete` + `decode()`.**
   O `src` engana com srcset, e sem `decode()` lazy-loading dá falso positivo.
10. **Nunca montar texto no padrão de substituição de `String.replace`.**
    `$1`, `$&` e `$'` dentro de uma descrição viram referência de captura e
    corrompem o arquivo calado.

11. **Agregado não prova fidelidade.** Altura de página, marcos e fontes são
    agregados: o que um elemento perde de posição, o vizinho ganha. O
    `compara-visual.mjs` deu **42/42 com Δaltura 0px** numa página onde o
    `compara-geometria.mjs` achou **45 elementos fora do lugar**.
12. **Identidade estável entre fotos, nunca índice.** O DOM reordena (carrossel,
    lista preguiçosa) sem mudar de tamanho, e a partir do primeiro deslize todo
    índice aponta para o vizinho. Carimbar `data-dp` uma vez e ler o carimbo.
13. **Teto de erro em todo casamento.** Elemento sem texto casa com qualquer
    outro sem texto da mesma tag. Sem teto, um instrumento propôs **177
    correções** onde a medição independente via **8** divergências.
14. **Toda regra gerada mora dentro da `@media` em que foi medida.** Sem isso o
    clone fica idêntico no desktop e quebrado no celular — e isso não aparece
    em nenhuma medição feita numa largura só.
15. **O instrumento ACRESCENTA o que falta, não reescreve o que já está certo.**
    A captura acerta muita coisa. Escrever o valor absoluto do original por
    cima troca um acerto por um palpite bem medido: o FAQ sobe 146px e um
    card encolhe 154px.
16. **Corrigir pode piorar, e o instrumento tem que perceber sozinho.** Guardar
    o que foi proposto e conferir na rodada seguinte. **Sumir do casamento
    conta como piorar** — é a regressão que se disfarça de sucesso.
17. **Só se escreve o que EXPLICA o número medido.** "essa propriedade está
    diferente" não autoriza mexer nela: num site de construtor dezenas
    divergem sem mover nada. O que autoriza é o delta dela bater com o
    deslocamento observado. Sem essa regra, um `left: 194.297px` com delta
    de 194px se escreve para explicar um desvio de 5.7px, e esmaga a caixa.
18. **Excluir o que muda por TEMPO antes de falar de scroll.** Duas fotos sem
    rolar nada: o que mudou, mudou por laço de animação. Sem isso o marquee
    entra como comportamento de scroll e passa a saltar 2278px.

19. **Medir quanto cada lado varia SOZINHO antes de comparar os dois.**
    Diferença menor que a variação própria do original não é diferença, é
    ruído. Sem esse controle, três palavras de um rotador fazem a mesma rota
    dar 19 e 21 em rodadas seguidas, no mesmo build, e uma correção que
    funciona aparece como piora.
21. **O CAMINHO DE ENTREGA muda o resultado, e se escolhe medindo.** A mesma
    regra dá **3** elementos fora do lugar entregue por `import` e **24**
    entregue inline. Não há caminho universalmente melhor. Pior: com a
    entrega por arquivo inerte, uma camada inteira não faz nada e nenhuma
    medição acusa — um instrumento pode registrar "melhora" que não existe.
    Depois de escrever, REMEDIR com o build no ar.
22. **Desbloquear demais é tão errado quanto de menos.** O `corrige-interacao`
    pode reviver os controles de um modal que o original mantém fechado: 6 alvos
    mortos no original, 0 no clone. Fidelidade não é "tudo clicável", é
    "clicável onde o original é" — e nenhuma medição de rota, metadata,
    conteúdo ou geometria acusa isso.
23. **Valor DERIVADO virando constante é uma família inteira de defeito.** O
    ditto congela `100vh` em px, `margin-left:auto` em px, escala fluida em
    degrau e `font-size` fracionário em inteiro. Ao encontrar um, procurar os
    outros: são o mesmo erro em roupas diferentes.

24. 🚨 **ESCREVER O RUNTIME NÃO O LIGA — e o silêncio é total.** O `liga-css`
    garante o `import` das FOLHAS, mas nada garante o `<script>` do runtime no
    `layout.tsx`. Medido no framer-6: 559 regras de revelação
    escritas, `public/scroll.js` no ar com HTTP 200, **build verde, gate de
    entrada verde — e revelação ZERO**, porque a classe `ditto-js` que gateia
    todo o estado oculto nunca é posta. Ocultos abaixo da dobra: original
    1711, clone **145**. Depois de ligar `<script src="/scroll.js" />` no
    layout: **672**, com a amostra batendo elemento a elemento.
    **Nenhuma medição de rota, metadata, conteúdo ou geometria acusa isso** —
    a página parada fica perfeita. Quem acusa é comparar o ESTADO DE REPOUSO
    dos dois lados (`mede-revelacao.mjs`).
    ⚠️ E o `<script>` do runtime de scroll vai **no topo do `<body>`**,
    síncrono, sem `defer`: a classe precisa valer antes da primeira pintura, senão o conteúdo
    pisca visível antes de esconder.

20. **Entre dois consertos, ganha o que devolve a ESTRUTURA, não o que melhora
    o número.** Medido: compensar com margem deu 9 elementos fora do lugar e um
    desalinhamento visível dentro de cada card; devolver o tamanho ao slot
    colapsado deu 19, todos com o mesmo deslocamento rígido de 10px, que
    ninguém enxerga. Contagem é bom termômetro e péssimo juiz.

## Escrever instrumento novo

⚠️ **Sempre em arquivo, nunca inline no shell.** O escaping do shell come
`\s` de regex e o instrumento passa a "não achar nada" sem nenhum erro.

Cabeçalho obrigatório: uma linha dizendo o que mede, e as variáveis que aceita.

### 🚨 Todo gerador precisa de um jeito de NÃO escrever

Um instrumento que escreve arquivo e não sabe se calar destrói trabalho. Cada
guard abaixo existe porque a ausência dele quebra alguma coisa de verdade:

| Instrumento | O guard | O que acontece sem ele |
|---|---|---|
| `gera-scroll` | nada casou → não escreve NADA | escreve `LIMIAR = ` vazio numa rota onde nada casou e **destrói a home que já funciona** |
| `corrige-geometria` | teto de regras; lista negra; **sumir do casamento conta como piorar** | propõe 177 correções onde há 8 divergências; e uma correção esmaga um elemento de 274px para 119px sem ninguém notar |
| `corrige-geometria` | o arquivo ACUMULA, não se reescreve do zero | a correção que funciona some na rodada seguinte, porque para de ser proposta |
| `linha-de-base` | recusa desligar duas vezes | a segunda passada gravaria placeholder por cima da cópia de segurança |
| `captura-estado` | nada novo apareceu → não escreve | escreveria markup inventado no lugar de declarar que o gatilho não abriu nada |
| `liga-css` | cria arquivo vazio quando falta | import de arquivo ausente derruba o build inteiro |
| `gera-entrada` | declara quem não casou, um por um | casamento ruim entraria calado como se fosse bom |

**A regra:** antes de escrever a primeira linha de um gerador novo, responder
**"o que faz este instrumento se calar?"**. Se a resposta for "nada", ele ainda
não está pronto.

### 🚨 Instrumento que mexe em dezenas de arquivos se valida por SOMA, não por leitura

Ler o código e achar que está certo não é validação. O `linha-de-base.mjs`
sobrescreve **89 arquivos de uma vez**, e se prova assim:

```bash
md5sum <os 89 arquivos> > antes.txt   # 1. registrar
# 2. MODO=desligar  → as 89 somas TÊM que divergir (prova que desligou)
# 3. MODO=desligar de novo → tem que RECUSAR
# 4. MODO=religar
md5sum -c antes.txt                    # 5. as 89 TÊM que voltar a bater
```

Resultado: 89 de 89 conferiram. Sem esse teste, um bug de caminho teria apagado
a camada inteira em silêncio — e só apareceria na medição seguinte, já sem ter
como voltar.

💡 E o par disso: **o que ele NÃO conseguiu medir sai declarado**, com nome e
número. Silêncio vira aprovação, e aprovação falsa é o defeito mais caro que
esta skill já produziu.
