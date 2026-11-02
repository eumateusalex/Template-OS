# /carrossel · estilo X

O carrossel que imita a interface de um post de texto: fundo branco, avatar,
nome, @ e o texto em blocos. Cada slide parece um print. Serve para caso,
tese, lista e passo a passo em que o texto é o produto.

**Antes de montar, ler `x/anatomia.md` inteira**: é a régua do formato (as
formas, a imagem, as medidas, o texto, o emoji). Aqui fica só o fluxo.

## Onde as coisas moram

| O quê | Onde |
|---|---|
| A régua em texto | `x/anatomia.md` |
| O CSS e os três tipos de slide | `x/modelo.html` (o `<head>` dele é o de toda peça) |
| O molde do `gerar.js` da peça | `x/modelo-gerar.js` |
| O conferidor | `render/conferir-x.js` |
| O montador (um comando só) | `render/montar-x.mjs` |
| A prova dos dois | `render/teste-x.mjs` |

## As regras que não se quebra

1. **Réplica fiel.** Fundo branco, Inter, avatar circular, o @ em cinza. Nada de
   logo, cor da marca, marca d'água ou linha do tempo.
2. **Número, data e botão de engajamento, nunca.** Curtida inventada denuncia a
   montagem. O **selo de verificado vem desligado**: só liga (`selo: true` no
   `gerar.js`) se a conta é verificada de verdade.
3. **Não coube, quebra em dois slides.** O tamanho da letra é parte da réplica;
   o conferidor reprova o texto que vaza antes do render.
4. **A forma decide a imagem, e o sujeito do slide decide onde.** "Existe um
   registro real do que esta frase afirma?" Decoração é o jeito de perder o
   formato. Tabela e detalhe na anatomia.
5. **Imagem única em 2:1 (1976×988), inteira; retrato nunca sozinho.** Dupla é
   quadrada.
6. **Imagem é registro, e buscar faz parte.** O post cita o mundo lá fora:
   buscar a imagem do assunto é trabalho do formato, com a fonte creditada na
   legenda (nunca na arte) e sem imagem de licença paga. Cena que não dá para
   fotografar vira slot no `IMAGENS.md` ou imagem gerada, com o custo dito antes.

Valem também as regras do texto público: sem travessão, a voz e a
caixa de `_memoria/escrita-publica.md`, nenhum slide de credencial, e a clareza
acima do enigma (a capa se entende sozinha, `referencias/metodo.md`, seção 4).

## O fluxo

### 1 · Planejar

Tese, público e objetivo (o briefing do `/instagram` os dá). **Anunciar a forma
antes de montar, em uma linha, com o porquê e quantas imagens a peça leva.**
Nenhuma forma é o padrão da outra. Peça que vende segue
`referencias/copy-de-negocio.md` (os três alvos e o arco) dentro desta forma.

A pesquisa se dosa: a suficiente para entender o assunto e estar atual, uma
busca e poucos links; aprofunda quando a peça depende de número, citação ou
atribuição, e aí a fonte se confere sempre. **Propor o CTA** pronto, com o
motivo (o último slide, na anatomia).

### 2 · Roteiro

Criar `carrosseis/x-<tema>-AAAA-MM-DD/` e escrever `roteiro.md` slide a slide,
na voz da memória. Em cada slide, os blocos e, quando leva imagem, o registro
que ela é. No fim, contar os slides de texto seguidos: quatro é o alarme, e o
conserto é fundir.

### 3 · O `gerar.js` da peça

Copiar `x/modelo-gerar.js` para a pasta como `gerar.js`, preencher o `PERFIL`
(nome e @ de `_memoria/empresa.md`, a foto de perfil quadrada e o selo) e
escrever os slides com `slide()`, `img()`, `dupla()` e `slot()`. **Nunca copiar
o CSS para a peça**: o `gerar.js` lê o `<head>` do modelo na hora.

### 4 · Montar: um comando, e só ele

```
node .claude/skills/carrossel/render/montar-x.mjs carrosseis/<pasta da peça>
```

Ele roda o `gerar.js`, confere a peça, confere a `legenda.txt` (a régua de
`scripts/lib/legenda.js`), apaga os JPEGs velhos, renderiza e confere que saiu
um JPEG por slide em 2160×2700. Erro para antes do render. `--handle @conta`
cobra o @ certo em todo slide.

### 5 · Abrir os JPEGs em tamanho real

O conferidor não vê: o rosto cortado na faixa 2:1, o emoji que parece botão, a
imagem que decora em vez de provar, o ritmo dos blocos. Abrir cada JPEG antes
de mostrar.

### 6 · Legenda

A mesma do passo 6 do `SKILL.md`: `legenda.txt` pronta para colar, a régua de
`scripts/lib/legenda.js`, o crédito das imagens ali. O montador não renderiza
sem ela.

### 7 · Revisar

Uma passada do `/estudio` antes de a pessoa ver.

## A pasta da peça

```
carrosseis/x-<tema>-AAAA-MM-DD/
├── roteiro.md              slide a slide
├── gerar.js                o perfil e os slides (escreve o carrossel.html)
├── carrossel.html          gerado, nunca editado à mão
├── avatar.jpg              a foto de perfil (ou o caminho fixo no PERFIL)
├── <imagens>               2:1 ou quadradas
├── instagram/slide-XX.jpg  saída do render
├── legenda.txt             o texto pronto para colar
└── legenda.md              as decisões de copy e as fontes
```

## O que a máquina garante, e o que não

**O conferidor reprova:** texto cortado ou vazando, imagem cortada pela caixa,
imagem que não carrega ou não decodifica, avatar sem imagem, o nome ou o @ de
exemplo do modelo, o @ trocado entre slides, CSS diferente do modelo, a Inter ou
a fonte de emoji sem carregar, travessão e slide sem texto.

**Avisa:** folga menor que 40 px, mais de 6 blocos, bloco acima de 300
caracteres, numeração fora de ordem, imagem de fundo claro ou de baixa
resolução, slot vazio, emoji de símbolo de interface e palavra-gatilho em caixa
alta.

**Continua sendo julgamento:** a forma certa para o assunto, se a imagem é
registro ou decoração, o enquadramento, o ritmo, a voz e se o fecho cumpre o
que a capa prometeu.

## Quando não usar

Peça que depende de componente visual (fluxo, janela, antes e depois desenhado)
ou que precisa da marca na cara: é o `/carrossel` do kit.
