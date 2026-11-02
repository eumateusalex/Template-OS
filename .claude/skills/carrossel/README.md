# Carrossel

A skill do Template OS que monta carrossel de Instagram na sua marca: roteiro, arte em HTML sobre uma biblioteca de componentes, JPEGs prontos pra postar e legenda pronta pra colar. Você responde uma vez a entrevista curta da marca (o `/marca`: cor, fontes, logo, movimento), que vale para o workspace inteiro; o seu jeito de falar, o seu público e o que você vende ela lê da `_memoria/`, que o `/instalar` preenche. Daí em diante toda peça sai com a sua cor, a sua fonte e a sua voz.

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

A marca é do workspace inteiro, não só do carrossel. No Claude Code, digite:

```
/marca
```

(o `/carrossel configurar` leva ao mesmo lugar). A entrevista tira cor e letra do seu logo ou do seu site, pergunta a forma, o movimento, a imagem e as recusas, mostra tudo com os hex e só grava depois que você aprovar. A marca fica em `identidade/`, e o carrossel lê o `marca/tokens.css` que o gerador escreve a partir dela.

## Usar

```
/carrossel <um tema, um link, ou um material seu>
```

E, pra uma peça que você editou à mão (trocou uma foto, tirou um slide), `/carrossel render carrosseis/<peça>` só regera a linha do tempo e os JPEGs.

A skill escreve o roteiro, monta o HTML, marca onde cada foto entra e manda a descrição de cada uma pra você copiar. Você traz as fotos (ela não busca na web), ela encaixa, renderiza e escreve a legenda. A peça fica em `carrosseis/<tema>-AAAA-MM-DD/` na raiz do workspace.

**Estilo X.** Pedindo "carrossel estilo X" (ou print de post), a peça sai imitando a interface de um post de texto: fundo branco, o seu avatar, nome, @ e o texto em blocos, sem o kit nem a marca. Ela é montada por um comando só, que confere e renderiza: o fluxo está em `x.md` e a régua em `x/anatomia.md`.

Pra ver os componentes sem o Claude, abra `.claude/skills/carrossel/kit/catalogo.html` no navegador: é o catálogo da biblioteca, com um editor de cor ao vivo no topo. Depois de configurar ele abre na sua paleta; antes disso, na de demonstração.

## Como funciona por dentro

```
.claude/skills/carrossel/
├── SKILL.md            o que a skill faz, e as regras que ela não quebra
├── marca/              saída GERADA da sua marca (identidade/): tokens.css, e a cópia do logo e da fonte local em logo/ e fontes/.
│                       Não se edita: o scripts/marca/gerar.mjs reescreve, e o conferir reprova a cópia velha
├── kit/                a biblioteca: componentes.css, modelo-carrossel.html, catalogo.html
├── referencias/        o método editorial, a composição e a copy de negócio
├── x.md, x/           o estilo X: o fluxo, a régua (anatomia.md), o modelo e o molde do gerar.js
├── render/             o script que vira JPEG, o conferidor e o montador do estilo X, e como instalar
└── scripts/            confere.mjs, o verificador da skill
```

A promessa do sistema: **um arquivo muda de marca pra marca**, o `identidade/marca.tokens.json`. A biblioteca de componentes não tem uma cor escrita à mão: toda cor é uma variável do `marca/tokens.css`, que o gerador escreve a partir da marca. A entrevista do `/marca` existe pra preencher a marca sem você precisar entender CSS. <!-- caminho futuro: o /marca configurar grava -->

Três coisas que a skill faz de propósito e que vale saber:

- **Sem três slides de texto seguidos**, no padrão do kit. É onde o dedo desliza. Ela varia o ritmo entre texto e imagem em toda peça (a sua marca pode trocar o padrão).
- **A linha do tempo no rodapé é gerada por script**, não escrita à mão. Traço a mais ou contador errado é o tipo de erro que ninguém vê conferindo imagem.
- **O render se recusa a gravar sem marca configurada** (só o `--demo` renderiza nos valores de demonstração) **e se a fonte da marca não carregou.** A peça sairia numa fonte de sistema sem ninguém perceber. Ele também acusa imagem que não existe e JPEG acima de 3 MB.

## A sua marca

A sua marca mora em `identidade/` (o `marca.tokens.json`, o `marca.md`, o logo e as fontes) e se edita pelo `/marca`. O `marca/` desta skill é saída gerada: o `/salvar` a versiona, mas quem a escreve é o `scripts/marca/gerar.mjs`.

## Seis palavras que aparecem o tempo todo

- **tokens**: as cores, as fontes, os cantos e o movimento da sua marca, num arquivo só (`identidade/marca.tokens.json`), traduzidos para o carrossel em `marca/tokens.css` <!-- caminho futuro: o /marca configurar grava -->
- **kicker**: a linha pequena em caixa alta que vem antes do título e diz o assunto
- **slot**: o retângulo tracejado que marca onde uma foto vai entrar, com a descrição do que precisa aparecer
- **acento**: a cor que puxa o olho (botão, palavra em destaque, a linha do tempo)
- **abismo**: a cor mais fechada da paleta, usada no terminal e num dos dois fechos
- **4:5 e 2×**: o formato do feed (1080×1350) e o dobro dele no JPEG (2160×2700), pra sair nítido

## Conferir a skill

```
node .claude/skills/carrossel/scripts/confere.mjs
```

Diz se a estrutura está inteira, se a paleta gravada é válida, se algum link aponta pro nada, se a linha do tempo do modelo está certa, se alguém escreveu cor à mão no `componentes.css`, se sobrou travessão ou caminho de uma máquina específica. Cada linha da saída traz um código (G reprova, A só avisa), o arquivo, a linha e o conserto. Rode depois de mexer em qualquer arquivo da skill.
