---
name: carrossel
description: "Monta carrossel de Instagram na sua marca: roteiro, HTML no kit, slots de foto, render em JPEG e legenda. Use para carrossel, \"post pro instagram\", \"conteúdo pro feed\" ou /carrossel. A marca é a /marca."
---

# /carrossel

Pega um tema e entrega a peça pronta pra postar. O desenho **não se inventa
aqui**: está resolvido no kit e na marca (`identidade/`, pelo `/marca`). O tom **não se inventa
aqui**: está na `_memoria/` (a voz em `escrita-publica.md`; quem você é e o @
em `empresa.md`; público e ofertas em `oferta.md`). Os slides saem em JPEG,
não em PNG, porque a API de publicação do Instagram só aceita JPEG.

## Como rodar

| Comando | O que faz |
|---|---|
| `/carrossel configurar` | Aponta para o `/marca configurar`: a marca mora em `identidade/` e vale para todas as superfícies |
| `/carrossel <tema, link ou material>` | Monta a peça inteira |
| `/carrossel render <pasta da peça>` | Só regera a linha do tempo e os JPEGs de uma peça já montada (ver "Modo render") |

## Passo 0: a marca está configurada?

A marca mora em `identidade/` e o render confere o estado sozinho: sem ela,
para com "a marca não está configurada: rode /marca", e a peça espera o
`/marca configurar` (`--demo` só prova o kit, nunca publica). O
`marca/tokens.css` desta skill é saída do `scripts/marca/gerar.mjs`: nunca se
edita.

---

## Modo configurar

Rodar o `/marca configurar`: grava `identidade/`, gera o `marca/tokens.css`
(com o logo e a fonte local em `marca/logo/` e `marca/fontes/`) e termina com o
`node scripts/marca/conferir.mjs` limpo.

---

## Modo montar

### 1 · Planejar

Ler `identidade/marca.md` <!-- caminho futuro: o /marca configurar grava -->, `referencias/metodo.md` e a memória de conteúdo.
Tese (uma frase), público e objetivo (o briefing do `/instagram` os dá).
Slides: 9; "10 coisas", 11 ou 12; tema raso, 6 ou 7. Peça que vende:
`referencias/copy-de-negocio.md`. **Propor o CTA** com o motivo, pela função
(`_memoria/marketing.md`) e por "O CTA" de `escrita-publica.md`. Estilo X:
`x.md`.

### 2 · Escrever o roteiro

Criar a pasta `carrosseis/<tema>-AAAA-MM-DD/` na raiz do projeto e escrever
`roteiro.md` ali, slide a slide, na voz de `_memoria/escrita-publica.md`. Se
soaria estranho dito em voz alta pela pessoa, está errado. Valor cedo: os
slides 2 e 3 seguram a retenção. Uma ideia por slide.

### 3 · Montar o HTML

Duplicar `kit/modelo-carrossel.html` pra `carrossel.html` na pasta da peça e
trocar o conteúdo (os comentários do modelo explicam cada slide; a régua está
em `referencias/composicao.md`). Trocar `@SEU_PERFIL` pelo @ de
`_memoria/empresa.md`; se há logo (seção "Logo" do `identidade/marca.md`), ela <!-- caminho futuro: o /marca configurar grava -->
entra no `.follow` do fecho, de `marca/logo/`.

Composição mínima, por peça:

- mínimo 2 componentes diferentes, nunca o mesmo em slides seguidos
- o padrão do kit é no máximo 1 terminal, 1 janela do Mac e 1 elemento
  decorativo por peça; a marca pode trocar
- um único trecho em serifada por título
- **nunca criar CSS dentro da peça.** Faltou componente, ele entra no
  `kit/componentes.css` e no `kit/catalogo.html`, sem cor escrita à mão

Depois de escrever, **sempre**:

```
node .claude/skills/carrossel/render/linha-do-tempo.mjs carrosseis/<peça>/carrossel.html
```

### 4 · Marcar os slots e escrever o IMAGENS.md

Cada lugar de foto vira um `.slot` com id (`IMG 03-A`), uma frase do que
precisa aparecer e o mínimo (`mín. 900×1000 · em pé`). O `IMAGENS.md` lista
uma seção por imagem, com a descrição num **bloco de código isolado** e
curta (uma ou duas linhas). **Mandar as descrições também no chat**, prontas
pra copiar. Capa e imagem cheia: em pé, mínimo 1080×1350.

Quando as imagens chegarem: trocar o `.slot` por `<img>` (na capa e na imagem
cheia, a foto vai no `--img` e o `.slot.fundo` sai), caminho absoluto
`/carrosseis/<peça>/arquivo.jpg`. O render avisa (`AVISO:`, saída 0) capa ou
imagem cheia sem foto e foto abaixo do mínimo; peça com aviso não se publica.
As fotos ficam **fora do Git** (o `.gitignore` já as ignora): o backup é seu.

A peça só abre estilizada pelo render (caminhos absolutos a partir da raiz):
olhe o JPEG. O render serve só a pasta do HTML (com as subpastas dela) e o kit
desta skill; imagem noutra pasta entra com `--servir <pasta>`, e
arquivo cujo nome começa com ponto nunca sai.

### 5 · Renderizar

```
node .claude/skills/carrossel/render/render-carrossel.js carrosseis/<peça>/carrossel.html
```

Sai um JPEG por `.slide` em `instagram/` (a API aceita até 8 MB; o render
trava em 3 MB, com folga). Ele não grava se a fonte não
carregou, acusa imagem ausente e JPEG pesado, e sai 2 quando o problema é o
ambiente (instalação: `render/instalar.md`). **Antes de mostrar, abrir os JPEGs em
resolução real**: a miniatura esconde o corte e o rodapé.

### 6 · Legenda

Dois arquivos, e eles não se repetem. `legenda.txt` é **o texto, pronto pra
colar** no Instagram: a moldura da peça, não a repetição dela (gancho na
primeira linha, o que os cards não dizem no miolo, uma ação concreta amarrada ao
tema no fecho); `legenda.md` é só o porquê (decisões de copy, o que não entrou,
crédito de fonte).

Todo texto público da peça (título, subtítulo, fecho e legenda) passa pela
skill `humanizer` depois da última reescrita e antes da régua: ela tira o
maneirismo de máquina que a régua não enxerga.

**A régua é a de `scripts/lib/legenda.js`, uma cópia só** (teto, linhas, hashtag,
emoji e CTA genérico moram lá; não copiar os números para cá). Antes de dar a
legenda por pronta:

```
node -e "const {confereLegenda}=require('./scripts/lib/legenda.js');const r=confereLegenda(require('fs').readFileSync(process.argv[1],'utf8'));console.log(JSON.stringify(r));process.exit(r.erros.length?1:0)" <pasta>/legenda.txt
```

Erro volta para a escrita; aviso é revisão de gente. Parágrafo em uma linha só
(quem quebra é o app), crédito de fonte aqui e não na arte, e a legenda no mesmo
tom da peça. A caixa é a da linha `**Caixa:**` de `_memoria/escrita-publica.md`.

### 7 · Revisar antes de mostrar

Uma passada do `/estudio` no fim, depois da régua da legenda; o reprovado
volta ao passo dono antes de a pessoa ver.

### Modo render

`/carrossel render carrosseis/<peça>` roda, nessa ordem, o comando da linha do
tempo (passo 3) e o do render (passo 5), sem mexer no conteúdo. Serve pra
quando a pessoa editou o HTML à mão, trocou uma foto ou tirou um slide.

**Post avulso** (fora de carrossel): `.slide.post`, sem `.ftr`, padding
uniforme. Os componentes são os mesmos; o catálogo mostra as variantes
(`.cards.full`, `.footer`); parte-se de um slide do modelo de carrossel.

---

## As regras que não se quebram

1. **Imagem a pessoa traz.** Marcar o slot, listar no `IMAGENS.md`, nunca
   buscar na web.
2. **Fecho em cor cheia**, a principal ou a mais fechada, nunca as duas no
   mesmo slide. Conteúdo centralizado, assinado pela logo (se houver). Sem
   figura no fecho. Crédito de fonte vai na legenda, não na arte; a única
   exceção é arte de terceiro, que leva `arte:` no `.ct` (obrigatório).

## O padrão do kit (sugerido; a marca pode trocar)

- **Sem três slides de texto seguidos**: é onde o dedo desliza.
- **A capa é foto**: sem foto ainda, fica o slot.
- **Ícone em traço**, SVG inline, e as duas sombras difusas da marca.

A recusa da marca (`recusas` no `marca.tokens.json`, "Recusas visuais" no
`marca.md`) vale por cima do padrão: ler antes de montar.

## Regras do kit

- **Nunca inventar cor.** Precisou de um tom que não existe nos tokens, ele
  entra como papel na marca, pelo `/marca trocar`, e nunca como hex na peça.
- **Nada de emoji dentro da arte.**
- **Sem travessão** na arte nem na legenda: ponto, vírgula, dois-pontos ou
  parênteses. É a marca mais óbvia de texto escrito por máquina.
- **Variante se propõe, não se fixa.** Janela clara ou escura, fecho na
  principal ou no abismo, palavra-gatilho ou ação com motivo: chegar com uma
  escolhida e dizer que troca fácil. Escolha de peça não vira regra da marca.
- **Logo na capa ou no fecho, nunca nos dois.**
- **Linha do tempo em todo slide, com o número junto**, sempre pelo script.

## A pasta da peça

```
carrosseis/<tema>-AAAA-MM-DD/
├── roteiro.md              slide a slide, o que se aprova antes do HTML
├── carrossel.html          montado em cima do kit
├── IMAGENS.md              o que a pessoa precisa trazer
├── <imagens>               entregues por ela
├── instagram/slide-XX.jpg  saída do render
├── legenda.txt             o texto pronto pra colar (régua: scripts/lib/legenda.js)
└── legenda.md              só as decisões de copy
```

A pasta não está pronta sem o `legenda.txt`. Antes de dar por entregue, o
checklist de `referencias/metodo.md`, seção 7.
