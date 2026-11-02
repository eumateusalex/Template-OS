# Revisão de clone — o prompt pronto

Este arquivo diz **o que olhar** num clone antes de dizer pronto: de site no ar
com régua completa, de vídeo com cenas presas à rolagem, de captura traduzida
com o tamanho congelado solto por gerador. Metade dos pontos aparece só com o
site aberto, olhando; a outra metade, só medindo. Nenhuma régua de geometria
pega esses pontos: todos passam "verdes" antes de alguém olhar.

O arquivo tem duas partes. O **núcleo** é o bloco que se cola numa sessão
nova, junto do pedido de clone (ou de revisão de um clone que já existe): diz
o que é pronto, na ordem do trabalho, e como provar. O **anexo** guarda as
lições por assunto, e o agente lê a seção do assunto antes de mexer nele, em
vez de carregar a lista inteira de uma vez. Nenhum dos dois substitui a skill:
apontam o que conferir em cima dela. Lição nova de clone entra na seção do
anexo do assunto, no lugar dela, nunca empilhada no fim; o núcleo só muda
quando muda o que é pronto.

---

## O núcleo (colar)

```
Vou clonar (ou revisar) um site: de um site no ar, de um
vídeo ou de imagens. Siga a /clonar-site. Os critérios abaixo dizem quando o
clone está pronto. Em todos eles, um clone que "passava na régua" ainda
estava errado.

COMO PROVAR (vale para todos os critérios)
- Para cada critério, mostre o número, o print ou o quadro. O que não deu
  para medir, diga que foi no olho. "Deve estar ok" não vale.
- Toda prova nova é vista VERMELHA com o defeito plantado antes de valer, e
  a bateria falha quando uma prova quebra, não só quando reprova.
- Meça o meio, não a presença: o efeito que "existe" pode pular, travar ou
  nunca andar.
- Uma medida só numa máquina ocupada mente: repita, alterne original e
  clone, compare a mediana.
- A primeira hipótese costuma errar: isole a causa desligando uma peça por
  vez. Errou duas vezes, chame o destravador.
- Meça o build final, e confira que o navegador recebeu o código novo.
- O veredito sai da matriz de medidas, nunca de um relatório antigo.

O ANEXO
Antes de cada critério, leia a seção do anexo que ele cita, em
.claude/skills/clonar-site/referencias/revisao-de-clone.md. Cada linha ali
é um defeito que passa verde se ninguém olhar. As receitas citam a stack padrão (Next,
Motion, Tailwind v4, Cloudflare, original em Framer); em outra stack vale o
princípio, não a receita.

CRITÉRIOS DE PRONTO, NA ORDEM DO TRABALHO
1. Original congelado antes do código (anexo: Original). Pontos de quebra
   lidos no CSS dele; texto, posição, estilo, entradas e fotos de página nos
   dois lados de cada quebra e no meio das faixas; efeito declarado no
   código confirmado no site aberto; as fontes que ele serve; a régua
   montada e vista vermelha antes de construir.
2. Fidelidade (anexo: Fidelidade e língua). Posição, tamanho, fonte, cor e
   momento de entrada de cada elemento contra o original, com tolerância
   declarada; onde cada linha quebra; prancha lado a lado de todas as
   páginas, olhada inteira (cor de ícone, fundo, sombra, gradiente);
   diferença aceita só com motivo escrito. A camada fiel fica separada das
   melhorias.
3. Texto e língua (anexo: Fidelidade e língua; Texto traduzido sobre medida
   congelada). O traduzido cabe com o texto real e com um propositalmente
   mais longo: nada cortado, quebrado, vazado ou colidindo; nenhum inglês
   esquecido, de frase inteira a rótulo curto; revisão de língua nativa.
4. Movimento (anexo: Movimento; Cenas presas à rolagem; Fundo vivo). Onde
   cada peça começa a aparecer, o que anima em cada largura, a curva e a
   ordem das camadas iguais ao original, medidos; ida e volta da rolagem,
   devagar e aos saltos, sem nada preso no meio, comparando a chegada e o
   assentado; transição provada em quadros ao longo do tempo; nenhuma
   animação infinita presa fora da tela; movimento reduzido com tudo pronto
   e parado, sem quebrar a hidratação.
5. Responsividade (anexo: Responsividade). De 320 a 2560, as viradas, o
   meio das faixas, telas baixas e celular deitado: nenhuma rolagem lateral,
   texto legível no notebook, alinhamento conferido depois de cada ajuste.
6. Leveza (anexo: Leveza). Peso, LCP e rolagem num celular lento simulado,
   contra o original e alternando os dois; travada com a causa achada no
   trace.
7. Interação e higiene (anexo: Interação). Clique, toque e teclado em tudo,
   nos dois idiomas, com o foco visível; foco preso no que abre e devolvido
   ao fechar; todo link provado clicando; alvo de toque de 24 px; console
   limpo, também com movimento reduzido; nenhum endereço de fora; ícones na
   cor certa; contraste de 4,5:1; axe sem violação séria.
8. Organização (anexo: Estrutura, idioma e publicação). Texto, link e nome
   de foto num lugar só, com os dois idiomas no mesmo objeto; a estrutura
   padrão; README que diz onde editar, provado por um teste a frio de
   troca de marca em duas rodadas.
9. Publicação (anexo: Estrutura, idioma e publicação). Leia o estado de DNS
   e conta antes de mexer e não toque no que não é deste site; homologação
   conferida no navegador (todas as páginas, os dois idiomas, celular e
   desktop) antes da produção; "no ar" só com duas conferências completas
   seguidas sem falha.
10. Sessão limpa (anexo: Higiene de sessão). Processo parado só pela árvore
   da tarefa, commit por caminho, push sem commit alheio na frente.

Por último, com tudo verde, olhe a página como um designer sênior, em
várias larguras, procurando o que nenhuma régua mede.

PARE E PERGUNTE SÓ O QUE É DO DONO
Melhoria além do fiel (as opções lado a lado, com a sua crítica e a
recomendação), erro de digitação do original, frase que o vídeo corta no
meio. O resto segue.

ENTREGA
Veredito primeiro. Depois, uma tabela por critério com o número do original
e o do clone, o commit e o endereço; o que ficou diferente de propósito, e
por quê; e o que não foi provado (navegador não testado, aparelho real,
leitor de tela, o que foi só no olho, o que é ruído da máquina e não do
site). Sem "100%" onde não houve medida.
```

---

## O anexo: as lições por assunto

### Prova

- Toda prova nova tem que ser vista VERMELHA com o defeito plantado de volta,
  antes de valer. Prova que continua verde com o defeito não prova nada:
  sai da régua.
- A bateria sai com erro quando uma prova QUEBRA, não só quando falha. Já
  houve sonda quebrada (procurava um texto que mudou) com a bateria verde.
- Sonda acha a peça pela estrutura (o h2 da seção do acordeão, o data-secao),
  nunca pela frase: texto muda, e a sonda fica cega.
- Primeira hipótese costuma errar. Antes de consertar, isole a causa
  desligando uma peça por vez (com e sem WebGL, com e sem o efeito, build
  velho contra novo). Errou duas vezes: chame o destravador.
- Meça no build certo: confirme que o arquivo que você testa é o que foi
  construído (procure um trecho do código novo no bundle servido). Toda medida
  final roda sobre o build FINAL: corrigiu, rebuildou, mediu de novo.
- Ruído da máquina (várias sessões) existe: tropeço que aparece 1 vez em 3,
  sem tarefa longa, é da máquina; o do site se repete. Uma medida só numa
  máquina ocupada mente: repita, alterne antes e depois (ou original e clone)
  e compare a mediana antes de concluir. Máquina sem memória derruba a régua
  longa (saída -1 na geometria): rode em partes (--so, depois o resto com
  --sem-build), nunca afrouxe a prova.
- Divergência que a sonda acusa por limiar (8 px, por exemplo) é medida à
  parte, quadro a quadro, antes de virar defeito ou de ser descartada.
- O veredito sai da matriz, nunca do relatório: um relatório antigo pode dizer
  "pronto" com metade das rotas vermelhas no conteúdo, "pendentes: []" e só a
  1280 medida. Rota vermelha que fica é pendência com nome e número.
- Prova da régua acompanha o código: arquivo movido ou trecho reescrito, o
  defeito plantado tem que existir no lugar novo (a prova diz "o trecho não
  existe mais"); defeito que dependia de algo que saiu do site ganha outro
  que o mesmo passo pegue. Prova "verde" que não plantou nada é cega.
- Prova que abre navegador tem prazo por página e nova tentativa: com várias
  sessões na máquina, um Chromium trava e segura a bateria inteira por meia
  hora sem erro. Antes de relançar, liste e pare o processo da rodada anterior,
  que segue escrevendo nos mesmos arquivos.
- Régua de horas tem vigia: ponto de controle a cada N rotas, nunca só o aviso
  de fim (uma página travada segura a régua por horas sem erro nenhum). E
  o resultado velho sai antes de cada etapa: a etapa que travou não pode ler o
  verde da rodada anterior.
- Esperar animação: laço lendo o estado até ele parar, nunca tempo fixo, e
  nunca waitForFunction com predicado que devolve Promise (libera na hora).
- Prova de efeito mede o MEIO, não a presença: a cortina do Motion ficava
  fechada e pulava no fim, e passava porque a prova só via "existe recorte".
  Exija valor intermediário (recorte entre 2% e 98%, opacidade entre 0,02 e
  0,98) logo depois do gatilho.
- Teste a frio de troca de marca em duas rodadas: um agente sem contexto troca
  a marca só pelo README; a segunda rodada também planta defeitos e diz o que a
  régua deixou passar. Todo atrito vira
  conserto, e todo ponto cego vira verificação.
- Passar na régua não é estar bonito. Com tudo verde, olhe a página como um
  designer sênior, em várias larguras, procurando o que nenhuma régua mede.

### Original

- Leia os pontos de quebra no CSS real do original, sem supor (no Framer são
  810 e 1200). As larguras de medida saem daí.
- Congele o original (texto, posições, estilos por faixa, entradas, fotos de
  página) numa pasta própria antes de escrever código, nas larguras dos DOIS
  lados de cada ponto de quebra (no Framer, 809/810 e 1199/1200) mais 390,
  1440 e 1920, e monte a régua antes de construir. Ela compara contra a
  captura e contra o site vivo.
- Efeito que o código do original declara (parallax, rolagem suave, mola) só
  entra no clone depois de confirmado no site aberto: já houve efeito
  declarado que não agia, e rolagem suave que não liga em navegador
  automatizado.
- Use as fontes que o próprio original serve, com os MESMOS arquivos que a
  régua mediu (confira o hash): a métrica muda o layout.
- Duas camadas separadas: a FIEL (igual ao original, é o que se mede contra
  ele) e a de MELHORIAS (opcional, uma chave por melhoria, escolhida pelo usuário
  depois de ver as opções lado a lado, com a sua crítica). Nada de melhoria
  escondida na camada fiel.
- Erro de digitação do original: pergunte se fica na versão pública.

### Fidelidade e língua

- Meça posição, tamanho, peso de fonte, cor e o momento de entrada de cada
  elemento contra o original, com a tolerância declarada.
- Meça também NO MEIO das faixas (430, 500, 600, 700, 900, 2560): largura fixa
  em px do original (um depoimento de 327 px, por exemplo) bate com o w-full do
  clone só a 375 e abre 400 px a 809; nas bordas a régua fica verde.
- Antes de corrigir, leia a regra exata do original (width fixa? max-width?
  %?), peça por peça: dois elementos irmãos podem ter regras diferentes.
- Peça que se mexe sozinha (faixa de logos em laço, contador) muda conforme o
  instante. Confirme que é fase (deslocamento igual em todas as peças, tamanho
  idêntico, número que muda entre duas rodadas) antes de chamar de resíduo.
- Coletor: casar blocos pelo texto; a caixa do texto é a união das caixas das
  palavras (não a do elemento); ler borda desenhada em ::after; ignorar o
  invisível (opacidade efetiva < 0,05) e o texto de 1 px (sr-only), mas nunca o
  contêiner sem caixa (display: contents) inteiro. Mudou o coletor, recapture
  o original todo.
- Framer: texto em pre-wrap; título com text-wrap: balance; título partido em
  palavras inline-block; max-width por faixa; o espaço junto do *trecho
  apagado* fica onde o original põe.
- Onde cada linha quebra, não só a caixa: compare, em todas as rotas, a
  palavra que abre cada linha (original × clone). Caixas iguais quebram
  diferente: o título do artigo sem balance, o nbsp que o original tem num
  bloco e não no outro.
- Suavização do texto no Windows (o original prende cada bloco numa camada de
  GPU e desenha em cinza) é diferença aceita: não prenda camadas para imitar.
- Diferença aceita só com motivo (residuos.json); página que desce de
  propósito usa deslocamento exato, só abaixo do cabeçalho fixo. Quando o
  motivo some, a linha sai (tirando só ela, sem reformatar o arquivo).
- Página com vídeo em laço nunca chega a networkidle: espere o load.
- Palavra igual nas duas línguas ("Menu", "Blog", nome próprio) vai numa lista
  explícita, uma a uma; nunca "parece nome próprio porque tem maiúscula"
  ("Load More" passava). Chave técnica (página, slug, id) fica fora da conta.
- Transbordo com pt-BR e com um pseudo (en +40% com acento): controle que
  cabia em uma linha não quebra (mede também o menu do celular fechado); texto
  cortado pela própria caixa E por ancestral. Cartão de altura fixa do
  original não absorve texto maior: o README diz o limite de caracteres.
- Língua: nenhuma frase do en no HTML e nos dados do pt; rótulo curto igual
  ao en ("Sign Up"); trecho de 5 palavras do en colado em frase pt. Com as
  duas línguas no mesmo objeto o JS leva as duas: não medir o JS.
- O pt passa por uma revisão de língua nativa (falso cognato, regência, tom),
  não só pela caça ao inglês esquecido.
- Pranchas lado a lado (original × clone, todas as páginas, 1440 e 390): cor
  de ícone, fundo, sombra, gradiente e lista só aparecem ali (o visto dos
  preços saiu preto e a régua estava verde). Olhe todas.

### Texto traduzido sobre medida congelada

- A captura grava em px o tamanho da caixa que no original abraça o texto (o
  "fit content" do Framer). Com o mesmo texto cabe; traduzido, corta, quebra e
  vaza. Uma captura traduzida chega a centenas de casos, com a régua de
  texto verde. Conte antes de consertar.
- Conserto gerado, nunca um por um: meça no en quais caixas abraçam o conteúdo
  (largura vira max-content, altura vira auto, e o tamanho não muda) e solte no
  pt só a corrente acima de cada texto que corta, até a primeira caixa que não
  pode crescer. Elemento inline se atravessa, não para a corrente.
- Largura só solta em caixa em que todo texto visível está numa linha. Coluna,
  parágrafo e título partido em palavras têm a largura do conteúdo por
  coincidência: soltos, alargam além da tela e a coluna inteira sai para a
  esquerda a 390 (o início do título e do parágrafo sumiu).
- Texto que não cabe tem CINCO medidas, e cada uma pegou o que as outras
  deixavam passar:
  - cortado pelo ancestral que corta (hidden, clip);
  - transbordando a própria caixa, com texto inline medido contra o primeiro
    bloco acima (a data do card, um span numa caixa de 60 px, passou por isso);
  - caixa transbordada: o filho cresce e vaza da coluna de altura congelada,
    sem cortar texto nenhum (o título do herói cobriu o selo, e o parágrafo
    cobriu o botão);
  - quebra: caixa que abraçava uma linha no en e quebra no pt (valor em reais ou
    dólar no formato pt é mais largo: "US$" numa linha e "1.700,00" na outra);
  - colisão entre as letras de dois textos (a data por cima do autor).
- Compare com o en, nunca contra zero, e separe o eixo: a cópia que o hover
  guarda embaixo do item corta em y nos dois idiomas, e o pt longo corta em x.
- Meça dois estados: a página recém-aberta e depois de rolar até o fim e
  voltar. O cabeçalho do Framer recolhe ao descer e não reabre com scrollTo,
  e só aberto se vê o menu. O teste de "abraça o conteúdo" também nos dois.
- Fica fora da conta (com o motivo escrito na régua): opacidade efetiva 0, texto
  com reticências, elemento fixo ou grudado (cabeçalho, card do canto passando
  por cima na rolagem), a palavra que troca por animação, a sobra da palavra
  inline-block de título acima da linha, e o espaço que o pre-wrap pendura no
  fim da linha (conta letra).
- O que soltar não resolve vai para frase mais curta com o mesmo sentido (caixa
  de desenho fixo) ou para uma folha à mão, comentada e só do pt. O que se
  aprova olhando entra numa lista com motivo e teto em px: crescendo, volta a
  falhar.
- A régua só vale depois de plantar um texto longo e vê-la acusar. E a
  revisão final é de olho, em resolução real, tela por tela: foi ali que
  apareceram a sobreposição, a quebra e a colisão, que a primeira régua não
  media.

### Movimento

- "O original está mais fluido": antes de mexer em qualquer coisa, meça os
  dois lados com a mesma sonda: a curva da rolagem suave depois de uma
  rodinha, quanto cada bloco leva para aparecer, a ida e volta, o ritmo de
  quadros rolando e quantas fotos entram vazias rolando em 4G. Em geral quase
  tudo dá igual, e o que se sente são uma ou duas peças: só elas mudam. Validar não é criar coisa nova.
- O atraso e a duração de cada entrada saem de medida (3 repetições, início e
  fim em ms), nunca de chute.
- Peça interativa se compara em três camadas, quadro a quadro contra o
  original: o MODELO (no acordeão do original cada item abre sozinho e vários
  ficam abertos; o clone fechava o anterior e a página pulava), a CURVA (o
  original andava 0,4 s numa ease sem repique; o clone usava uma mola de
  0,2 s que passava do fim) e a ORDEM das camadas (no menu, o fundo reage
  0,18 s depois do clique e o painel depois dele; ao fechar, o fundo sai por
  último). Duração igual com ordem errada parece travada.
- Motion: a prop animate compara só os valores; trocar só o transition não
  para uma mola em curso. Para pular para o fim (o foco do teclado revela o
  bloco na hora), animate() imperativo no elemento.
- Efeito em foto que não faz nada: o `<picture>` é display: contents (sem
  caixa). Mire a img e meça a caixa do primeiro ancestral que tem caixa.
- Keyframes com easeInOut por trecho PARAM em cada ponto: "engasga". Para uma
  trajetória que passa por pontos (ex.: etiqueta que balança), amostre uma
  cúbica monotônica (PCHIP) e toque com ease linear.
- Qual motor anima: leia el.getAnimations() DURANTE a animação, não antes.
  (O Motion 14 já entrega x/rotate/y ao navegador.)
- Re-render de uma lista com layoutId durante a entrada faz o Motion animar
  "ajustes de layout" em JS: estado de montagem (portal) num filho; pausa fora
  da tela escreve atributo no DOM, sem useState.
- Movimento reduzido: tudo nasce pronto e parado, e a página não quebra. Não
  leia a preferência no render (quebra a hidratação): regra CSS em
  [data-entrada] com !important deixa tudo pronto.
- ONDE cada peça começa a aparecer, contra o original (desça de 40 em 40 px e
  anote o topo da peça quando a opacidade passa de 0,05): a curva certa num gatilho errado passa na
  régua de curva. Peça com entrada própria que o clone entra junto com o pai
  (o link no pé da coluna) chega parada; cartão sem entrada nasce visível;
  atraso maior só num título, e não no link ao lado, também é gatilho errado.
- O QUE anima muda por ponto de quebra: no Framer, a entrada na rolagem
  costuma ser só do desktop. Um original pode animar 85 textos a 1440 e 34 a
  1000 e a 390 (no tablet e no celular, só destaques, cartões, FAQ e prova),
  enquanto o clone anima tudo em toda largura. Liste, por largura, o que
  entra com fade nos dois lados (desça devagar e marque o texto que ficou
  abaixo de 0,5 estando na tela). Confirme cada diferença lendo a opacidade
  dos ancestrais no topo da página: a lista por texto se engana com
  agrupamento diferente (o texto num span de um lado e num p do outro).
- Fade a mais também é defeito: cartões de preço e de serviço, parágrafo e
  cabeçalho de seção que o original deixa parados. O cabeçalho de página
  interna entra ao carregar, com o deslocamento dele, e não reage mais à
  rolagem, nem na volta.
- Na volta, o gatilho do original é o contêiner: em parte dos blocos o texto
  reaparece antes de reentrar pelo topo, em outra parte faz o fade na tela.
  Não há regra única. Meça bloco a bloco, contando só a transição que
  acontece com o elemento na tela.
- Componente de código do Framer (cartão que cresce com a distância do mouse,
  clique que rola até uma âncora) não aparece no CSS. Leia as props no JS do
  original (altura mínima e máxima, distância, mola) e meça a curva quadro a
  quadro, com requestAnimationFrame dentro da página. A rolagem do clique do
  Framer não é mola: é metade do caminho em 0,1 s e uma cauda longa até 1,5 s.
- Hover com atraso: a borda do cartão espera 150 a 200 ms para entrar E para
  sair. Meça os dois sentidos.
- Parallax com useScroll({ target }): o Motion mede pelo offsetTop, que ignora
  translate e altura que muda. Foto dentro de cartão centrado com translate
  (ou que cresce com o mouse) corria até 77 px fora do original. Calcule o
  progresso pela caixa na tela (getBoundingClientRect) a cada rolagem.
- IDA E VOLTA: role descendo aos poucos até o fim e subindo pelas mesmas
  paradas, e também aos saltos (topo → fim → topo), em 390, 1024, 1440 e
  1920, nos dois sites. Compare o estado assentado E o da CHEGADA (150 ms
  depois de rolar): só a leitura assentada não distingue "a entrada fica" de
  "a entrada repete". Depois de assentar, nada pode ficar apagado, borrado ou
  no meio da entrada (entrada longa ganha tempo antes de contar); seção presa
  à rolagem volta na ordem; fundo animado e flutuação pausam fora da tela e
  voltam a andar.
- Links do menu: rolagem macia (começo e fim suaves, até ~1,4 s) que deixa o
  CONTEÚDO da seção no meio da tela (seção mais alta que a tela: o começo),
  grava o #id no endereço, põe o foco na seção e devolve o controle se a pessoa
  mexer na rodinha. Com movimento reduzido, salto direto.
- Nenhuma animação infinita presa a elemento fora da tela, NEM PAUSADA (trilho,
  equalizador): o Chrome supõe que ela sobrepõe o que vem depois e refaz as
  camadas a cada quadro; no celular fraco vira travada. Fora da tela, sem
  animação; liga 100 px antes de aparecer. Ache a causa com o trace do
  Chromium na rolagem (CPU 4×), desligando uma peça por vez, em rodadas
  alternadas.
- Movimento reduzido também quer zero animação rodando (carrossel que desliza
  conta): MotionGlobalConfig.skipAnimations no carregamento e CSS !important.
  Carrossel infinito que volta à cópia do meio por transitionend precisa de
  outro caminho sem transição.
- Aba que troca foto: deixe todas montadas e empilhadas (carregam juntas) e a
  entrada em CSS; o clip-path do Motion não interpolou.
- Transição de página (ViewTransition do React 19.3): só dispara se vier antes
  de qualquer nó do DOM da página (cabeçalho e rodapé no layout); cabeçalho
  fixo com viewTransitionName próprio (senão pula); na cortina, a página que
  sai apaga rápido; a capa que voa não tem entrada própria. Prove com
  quadros a 60, 160, 280 e 700 ms.

### Cenas presas à rolagem e reconstrução de vídeo

- Foto parada não prova fluidez: ela passa verde com a cena saltando. Filme o
  clone rolando com a roda do mouse (pelo Lenis, se houver), cena por cena, e
  ponha a folha do clone embaixo da do vídeo no mesmo trecho (10 a 15 quadros
  por segundo na transição). O que salta, o que entra fora de ordem e o que
  fica sobreposto só aparece ali.
- Cena presa (leque, pasta, cartão que encolhe) acompanha a rolagem nos dois
  sentidos, amortecida por mola sem repique: rolar devagar mostra a transição
  devagar, parar no meio deixa a cena no meio. Fase disparada por limiar faz a
  cena inteira saltar de uma vez, e isso reprova. Entradas (palavra, cartão que
  sobe, faixa que cresce) são outra coisa: tempo próprio, medido no vídeo.
- Antes de inventar uma transição, leia o vídeo quadro a quadro nela. Uma
  diagonal que vira pasta pode ser um painel branco que nasce atrás e encolhe
  recortando os cartões; um crossfade inventado ali deixa fantasma.
- Ordem medida no vídeo: o que entra depois do gesto (pílula, seta, balão,
  ícone) espera um SINAL de que a cena assentou (a mola passou de 0,97, a
  animação da faixa terminou), nunca um atraso fixo nem o inView dele mesmo
  (elemento acima da cena entra antes dela).
- Estado parado no meio de cada transição é o risco novo do modelo ligado à
  rolagem. Pare em cada faixa e confira:
  - nada meio transparente sobre foto (texto vira fantasma): o que some ou
    aparece no meio do gesto vai por tempo, disparado no limiar;
  - texto legível onde a pilha passa por baixo (véu, ou faixa mais curta);
  - nenhum controle invisível recebe clique ou Tab. O ponteiro desligado por
    classe perde para um *:pointer-events-auto do pai: ponha no style e
    prove com elementFromPoint no centro do controle;
  - a faixa da rolagem medida em px do desenho (v / k), não em px de tela:
    em 1920 ou 1024 ela sai do lugar.
- Ida e volta DENTRO das faixas de folga dos gatilhos: liga em 0,97 e
  desliga em 0,9 deixa pílula e ícone na tela subindo onde, descendo, não
  existiam. Pare no meio da folga nos dois sentidos e compare o estado (as
  pílulas e os ícones visíveis, não só pixels). Folga estreita (0,97/0,95).
- Trajetória (avatares em onda, em círculo) se mede com a MESMA ferramenta no
  vídeo e no clone, só nos quadros em que o vídeo está parado (página
  rolando contamina a curva). Confira o deslocamento da seção: um título 9 px
  mais baixo tira a onda inteira 12 px do lugar.
- Foto recortada do vídeo: no estado grande o recorte mostra o que no vídeo
  estava coberto (cantos do cartão, borda escura) e outro enquadramento (a
  cintura no lugar do rosto). Confira a foto em cada tamanho que ela assume e
  ancore como o vídeo mostra.
- Componente medido em px do desenho e encolhido na proporção da tela vira
  miniatura no celular (avatares de 26 px a 390). Dê piso de escala e
  conteúdo de celular próprio, e olhe a página inteira tela por tela em 390,
  768, 1024 e 1920, não só o "nada transborda".
- Desempenho da cena ligada à rolagem: nada lê layout por quadro
  (getBoundingClientRect, clientWidth) dentro do transform da rolagem: meça
  fora do quadro (ResizeObserver) e guarde num MotionValue. zIndex no style de
  um motion.div é reescrito a cada quadro: ponha num invólucro parado.
  Animação em requestAnimationFrame fora da tela não escreve no DOM. Só isso
  leva o motionscore de D a A.
- No modo vídeo o inglês público é o texto do vídeo, inclusive a frase que o
  vídeo corta no meio ("…buyers can discover and"). Decida com o usuário, antes de
  publicar, se o /en público completa a frase.
- O erro de ritmo mais comum tem uma causa só: validar estados, não
  movimento. Antes de mostrar, filme e compare; depois, o /estudio olha
  o estado parado no meio de cada transição (duas rodadas, no máximo).

### Fundo vivo

- Se o original mexe, o clone mexe "para sempre", não só na entrada.
- Calibre pela MASSA (quadros desfocados, 2 s) contra o vídeo, não pelo
  tremor fino: diferença crua satura no granulado e esconde que a mancha mal
  anda.
- Shader de tela cheia: ruído numa grade pequena (1/4) e a imagem na
  resolução da tela, em duas passadas. Uma passada pesa e rouba quadro das
  animações.
- Borda: a distorção vai a zero numa faixa maior que o deslocamento máximo.
  Travar a leitura na borda estica a imagem em riscos; dar zoom muda a cor.
  Meça o detalhe da borda contra o miolo.
- Textura com granulado (aquarela, filme, papel) não vai para AVIF de
  qualidade baixa: o grão some. Meça a variação pixel a pixel antes.

### Responsividade

- Varra de 320 a 1100 de 10 em 10 px, e o confere-pagina em ~30 larguras
  incluindo as viradas (639/640, 1023/1024) e as grandes (2240, 2560).
  Nenhuma rolagem lateral, nada saindo da tela.
- Limite de largura do original no celular (480, 640, 720 px, centrado ou à
  esquerda) só aparece entre 500 e 809: a 390 a tela é mais estreita que ele e
  a régua fica verde. A 600, quase todas as rotas podem sair com altura
  diferente e centenas de elementos fora do lugar. Na tela grande (1920), a coluna para
  em 1600 ou 1440, e a linha do título guarda a altura enquanto a fonte cresce.
  A régua de geometria leva 600 e 1920 por padrão.
- Celular pequeno (320–360): crachás e etiquetas sobre foto passam da tela;
  texto de botão com ícone corta ou encosta no ícone; palavra com hífen
  ("e-mail") quebra no hífen (use nowrap). Meça a folga até o ícone.
- Tablet (640–1023): cartão em meia coluna espreme botão e estrelas: deixe o
  cartão de abertura ocupar a linha.
- Desktop com escala proporcional (rem = largura/120): o texto ENCOLHE junto.
  Meça o menor texto visível de 1024 a 1920: ele chega a 6,9 px a 1024 e
  9,2 px a 1366. Piso por papel com text-[length:max(Xrem,Ypx)]: corrido
  13–14, botão/menu 13, caixa-alta 11, legenda 10. Na largura do desenho nada
  muda (a régua contra o original segue valendo).
- Depois do piso, confira ALINHAMENTO: títulos de cartões lado a lado sobem
  quando a descrição ganha linhas. Reserve linhas na faixa afetada e prove.
- Tailwind v4: variante max-lg vence max-[380px] na ordem do CSS. Se a regra
  pequena não pega, use ! nela, e meça que pegou.
- Vãos entre seções iguais (meça em 4 telas). Seção presa à rolagem com
  margem negativa: a área vazia dela cobre a anterior e rouba o clique
  (pointer-events-none no envoltório, auto nos cartões).
- Telas baixas e celular deitado (844×390, 1366×657): seções de altura da tela
  (abertura, contato, rodapé) cabem inteiras.

### Leveza

- Peso por página no celular e no desktop, contra o original.
- LCP real com CPU 4× e rede de celular. A entrada da primeira dobra em CSS e
  o CSS embutido no HTML deixam a página pintar sem esperar o JavaScript. LCP
  pode ser a animação de abertura: diga isso, não confunda com peso.
- Rolagem: quadros que engasgam (> 33 ms), pior quadro, tarefas longas e
  pulos de layout, com CPU 4×, descendo e subindo, 3 rodadas por lado,
  ALTERNANDO original e clone. Com a máquina ocupada, só a alternância é
  justa; pico isolado se repete antes de virar conclusão. Havendo travada,
  a causa sai do trace.
- motionscore sem animação por JS: animação pelo navegador, nunca quadro a
  quadro em JavaScript, e o que ninguém vê não gasta processamento.
- Fotos em AVIF com srcset e sizes certos. Foto que entra de lado (carrossel,
  galeria, menu) não pode ser lazy: nada depende de baixar na hora do clique,
  o que vai trocar já está carregado.

### Interação

- Clique, toque e teclado em tudo, nos dois idiomas, no desktop e no celular,
  com o foco visível: menu, abas, carrosséis, formulários, chaves.
- Prove o clique em todo link, e não só que ele existe: camada transparente
  por cima engole o clique (o espaço reservado do rodapé revelado).
- Hover que "enche": a cor cobre o cartão/botão inteiro em qualquer largura
  (clip-path em círculo, não escala).
- Galeria: miniaturas clicáveis, abrem grandes, Esc fecha, Tab preso no
  diálogo, foco volta à miniatura que abriu.
- Rodapé/contato cabe inteiro na tela no fim da página.
- TODA pergunta do FAQ abre com texto e fecha (não só a primeira).
- Menu do celular prende o foco: painel escondido com visibility em transição
  recusa focus(); fechado usa inert, e aberto deixa o resto da página inert.
  Prove dando 15 Tabs.
- Ponto de carrossel e botão com alvo de toque de 24 px no celular (o original
  pode ter 20); setas que só existem no desktop somem fora dele (botão
  invisível com foco é defeito).
- Higiene que só a medida vê: console limpo também com movimento reduzido
  (hidratação, React #418); nenhum endereço de fora da página (fonte, script
  de terceiro, og:image no `<head>`); ícone da aba carrega (o navegador sem
  tela não pede); ícone pintado de preto num svg de cor clara (a cor do style
  se perde na extração, e preto e branco viram o mesmo currentColor);
  contraste de 4,5:1 mesmo onde o original não tinha; classe Tailwind colada
  numa interpolação (p-7${x}) some do CSS sem erro.
- Acessibilidade: axe sem violação séria, estrutura de títulos sem salto e
  todo controle com rótulo.
- Texto sobre foto: meça o contraste no pior 5% do fundo sob as letras, no
  celular e no desktop. O conserto que não muda a foto é um véu suave só
  atrás da linha (de 3,7:1 para 5,4:1, por exemplo).

### Estrutura, idioma e publicação

- Estrutura padrão: app/, components/ (casca, secoes/<pagina>, modelos),
  lib/ (conteudo com os dois idiomas no mesmo objeto, rotas.ts, metadados.ts,
  idioma do build, site.ts, foto()), public/ (img, fonts), scripts/, regua/
  (captura, geometria, provas, sondas, saida fora do git), medicoes/, ideias/.
  README por pasta de script, uma linha por script, e um que diga onde editar;
  CLAUDE.md curto; git mv para mover. Cores com nome, uma seção por arquivo,
  o movimento num arquivo.
- Nenhum texto solto em componente e nenhum link à mão: prove lendo a árvore
  do TypeScript (texto JSX, aria-label/alt fixos, href com endereço). Os dois
  idiomas no mesmo objeto, tipado para a tradução que falta quebrar o build.
- Seções achadas por data-secao (chave fixa); o id segue o idioma.
- pt-BR na raiz, en em /en (âncoras em inglês; o en é a régua, igual ao
  original); canonical, hreflang (pt-BR, en, x-default) e sitemap com a MESMA
  forma de URL (barra final); robots aberto; 404 por idioma; laboratório só
  no dev (page.dev.tsx).
- Export estático; o en público com basePath /en; assets por caminho absoluto
  na raiz (sem duplicar img/fonts no /en). Se um build apaga a saída do
  outro, a ordem fica escrita e automatizada.
- Saída de medição, build, mídia e log ficam fora do git; fim de linha
  padronizado (.gitattributes).
- Cloudflare Workers com static assets, na conta do site: html_handling
  drop-trailing-slash, not_found_handling 404-page, account_id fixo no
  wrangler.jsonc (login trocado não publica no lugar errado). Leia o DNS do
  nome antes e não toque em registro de e-mail nem de outro site. workers.dev
  novo: TLS falha uns 2,5 min. Logo depois do deploy, um nó serve o HTML velho
  por segundos: confira de novo 1 min depois.
- Homologação → conferir no navegador (todas as páginas, pt e en, celular e
  desktop, console limpo) → produção → as mesmas provas contra o domínio:
  status das páginas, rede sem erro, clique interno que mantém o idioma e as
  sondas de movimento contra o /en publicado. Domínio próprio recém-ligado dá
  404/500 intermitente em chunk nos primeiros minutos: só é "no ar" com duas
  rodadas seguidas limpas.
- Imagem de compartilhamento no export estático: o opengraph-image sai sem
  extensão, e o Cloudflare manda como binário (a prévia do link some). Grave um
  _headers com Content-Type: image/jpeg. O twitter-image que reexporta precisa
  declarar o próprio dynamic = "force-static". E o openGraph da página
  SUBSTITUI o do layout, não soma: monte-o completo, com a imagem do idioma.
- Servidor local da régua imita o Cloudflare: a 404.html mais próxima (a do /en
  no inglês) e escuta em 127.0.0.1 (no Windows, localhost cai no IPv6).
- Next 16 export: achatar os arquivos de segmento (__next.X/Y.txt vira
  __next.X.Y.txt), senão todo link visível dá 404 no console.
- Nome de foto também mora no conteúdo (nem a imagem vazia do perfil fica no
  componente). Servidor da régua em porta 0 (outras sessões usam as fixas).
- Porta fixa de site novo sai de uma tabela de portas escrita num lugar só (a
  próxima dezena livre). Régua que reaproveita servidor confere a MARCA do site no
  HTML, não só o lang="en": com o vizinho no ar, ela mediria o site errado.
- O que sai do site público sai também do código da página: o objeto de
  conteúdo vai inteiro para os componentes de cliente (payload do React), então
  texto que só a régua mostra (crédito do original, o título do template na
  meta do en) se tira na montagem do conteúdo. Prove procurando os nomes em
  todo publicar/ (HTML, .txt e JS), não só no que se vê.
- Captura padronizada (o código do ditto mantido, na estrutura padrão): o
  data-cid se repete entre páginas, então é uma rota por página, cada uma com
  só as suas folhas, e um mapa de folhas que a troca sem recarregar liga e
  desliga (nunca [pagina] dinâmico). A casca extraída renumera o rodapé com
  prefixo próprio; página com cabeçalho próprio de mesmos números fica fora da
  regra da casca. Os scripts de comportamento acham os dados pela rota do
  original (data-rota-en) e o texto do idioma por uma variável injetada no
  layout. Folha gerada vai para a pasta da página, nunca para uma global (a
  global soma 2 MB carregados em toda página, medido).
- Script que rodou uma vez (extrair casca, seções, textos) sai depois de
  cumprir o papel, e o cabeçalho dos arquivos que ele gerou passa a apontar o
  commit, não o script removido.
- Imagem de compartilhamento capturada da página: a entrada que fica na borda
  da janela não dispara e sai borrada. Capture com a janela mais alta e
  recorte.
- basePath /en: o Link põe o /en na frente, então seletor por href que
  começa com o caminho (a[href^="/projetos/"]) falha só no inglês publicado.
- Mudou a estrutura: script movido para uma subpasta muda o "raiz = .." de
  cada um. Varra os caminhos velhos até zero e confira que todo caminho
  citado em código e README existe.
- Conferência do ar pelo Playwright: o prefetch dos links que o page.close()
  corta vira net::ERR_ABORTED em todo link. Filtre só esse erro; o resto conta.
- Ajuste de config depois de publicado: compare o publicar/ novo com o que
  está no ar, página a página e sem o id do build. Igual, não há redeploy.
- Mudou de repositório: o antigo se arquiva depois de conferir que o
  último commit dele está no histórico do novo; Workers e domínios da conta se
  listam pela API (o wrangler não lista) para não deixar órfão.

### Higiene de sessão

- Várias sessões dividem a máquina: pare processo só pela árvore da sua
  tarefa, nunca por filtro de nome (derruba o de outra sessão).
- Commit por caminho; push só sem commit alheio na frente.
- Medição antiga vai para a lixeira com a linha no manifesto, nunca apagada.
