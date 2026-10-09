# Carrossel

A skill do Template OS que monta carrossel de Instagram na sua marca: roteiro, arte em HTML sobre uma biblioteca de componentes, JPEGs prontos pra postar e legenda pronta pra colar. Você responde uma entrevista curta da marca visual uma vez (cor, fontes, logo); o seu jeito de falar, o seu público e o que você vende ela lê da `_memoria/`, que o `/instalar` preenche. Daí em diante toda peça sai com a sua cor, a sua fonte e a sua voz.

O que ela entrega por peça: `roteiro.md`, `carrossel.html`, `IMAGENS.md` (o que você precisa trazer de foto, com a descrição pronta pra copiar), `instagram/slide-01.jpg` a `slide-NN.jpg` em 2160×2700 (JPEG, que é o formato que a API do Instagram aceita, e abaixo de 3 MB, com folga sobre o teto de 8 MB da Meta), `legenda.txt` e `legenda.md`.

## O que você precisa

- **Claude Code**, aberto na raiz do workspace (a pasta que tem a `.claude/`)
- **Node.js 22.7 ou mais novo**, pro render das imagens

## Preparar o render

A skill já vem no workspace, em `.claude/skills/carrossel/`. O que falta é o render, que depende do Playwright e de um Chromium. Abra o terminal na raiz do workspace e rode:

```
npm --prefix .claude/skills/carrossel/render run instalar
npm --prefix .claude/skills/carrossel/render run checar
```

O primeiro instala o Playwright e baixa o Chromium; o segundo confirma que o navegador abre.

Detalhe e o que fazer se der errado: [`render/instalar.md`](render/instalar.md).

## Configurar a marca

No Claude Code, digite:

```
/carrossel configurar
```

São 4 perguntas: cor principal, as outras cores, fontes e logo. O nome, o @, a voz, o público e o que você vende ela lê da `_memoria/`, e só pergunta o que estiver faltando lá (a resposta vai pra memória, não pra skill). "Não sei" é resposta válida em todas: a skill deriva cor da sua logo ou do seu site, e tem três pares de fontes prontos. No fim ela mostra a paleta com os hex, e só grava depois que você aprovar.

## Usar

```
/carrossel <um tema, um link, ou um material seu>
```

E, pra uma peça que você editou à mão (trocou uma foto, tirou um slide), `/carrossel render carrosseis/<peça>` só regera a linha do tempo e os JPEGs.

A skill escreve o roteiro, monta o HTML, marca onde cada foto entra e manda a descrição de cada uma pra você copiar. Você traz as fotos (ela não busca na web), ela encaixa, renderiza e escreve a legenda. A peça fica em `carrosseis/<tema>-AAAA-MM-DD/` na raiz do workspace.

Pra ver os componentes sem o Claude, abra `.claude/skills/carrossel/kit/catalogo.html` no navegador: é o catálogo da biblioteca, com um editor de cor ao vivo no topo. Depois de configurar ele abre na sua paleta; antes disso, na de demonstração.

## Como funciona por dentro

```
.claude/skills/carrossel/
├── SKILL.md            o que a skill faz, e as regras que ela não quebra
├── marca/              a SUA marca visual: tokens.css (8 cores, 3 fontes), marca.md (logo, voz do vídeo, recusas visuais), logo/, fontes/
│                       (copiados dos moldes *.molde.* na primeira vez, e versionados com o workspace)
├── kit/                a biblioteca: componentes.css, modelo-carrossel.html, catalogo.html
├── referencias/        o método editorial, a composição, a troca de marca, a entrevista
├── render/             o script que vira JPEG, e como instalar
└── scripts/            confere.mjs, o verificador da skill
```

A promessa do sistema: **um arquivo muda de marca pra marca**, o `marca/tokens.css`. A biblioteca de componentes não tem uma cor escrita à mão: toda cor é uma variável que aponta pra esse arquivo. A entrevista existe pra preencher esse arquivo sem você precisar entender CSS.

Três coisas que a skill faz de propósito e que vale saber:

- **Nunca três slides de texto seguidos.** É onde o dedo desliza. Ela varia o ritmo entre texto e imagem em toda peça.
- **A linha do tempo no rodapé é gerada por script**, não escrita à mão. Traço a mais ou contador errado é o tipo de erro que ninguém vê conferindo imagem.
- **O render se recusa a gravar se a fonte da marca não carregou.** A peça sairia numa fonte de sistema sem ninguém perceber. Ele também acusa imagem que não existe e JPEG acima de 3 MB.

## A sua marca

A sua marca visual mora em `marca/tokens.css`, `marca/marca.md`, `marca/logo/` e `marca/fontes/`; ela está configurada quando o `marca/tokens.css` existe sem a linha `ESTADO: nao-configurado`. Esses arquivos são seus: o `/salvar` os versiona junto com o resto do workspace. Os moldes (`marca/tokens.molde.css`, `marca/marca.molde.md`) são o ponto de partida e não se editam; a skill copia deles na primeira vez.

## Seis palavras que aparecem o tempo todo

- **tokens**: as 8 cores e 3 fontes da sua marca, num arquivo só (`marca/tokens.css`)
- **kicker**: a linha pequena em caixa alta que vem antes do título e diz o assunto
- **slot**: o retângulo tracejado que marca onde uma foto vai entrar, com a descrição do que precisa aparecer
- **acento**: a cor que puxa o olho (botão, palavra em destaque, a linha do tempo)
- **abismo**: a cor mais fechada da paleta, usada no terminal e num dos dois fechos
- **4:5 e 2×**: o formato do feed (1080×1350) e o dobro dele no JPEG (2160×2700), pra sair nítido

## Conferir a skill

```
node .claude/skills/carrossel/scripts/confere.mjs
```

Diz se a estrutura está inteira, se a paleta gravada é válida, se algum link aponta pro nada, se a linha do tempo do modelo está certa, se alguém escreveu cor à mão no `componentes.css`, se sobrou travessão ou caminho de uma máquina específica. Quem entrega uma cópia do workspace a outra pessoa passa `--proibidas <arquivo>` com o nome da própria marca, e ele prova que nada dela vazou. Cada linha da saída traz um código (G reprova, A só avisa), o arquivo, a linha e o conserto. Rode depois de mexer em qualquer arquivo da skill.
