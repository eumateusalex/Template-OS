---
name: carrossel
description: >
  Monta carrossel de Instagram (4:5, JPEG 2160×2700) na marca de quem instalou:
  roteiro, HTML em cima do kit de componentes, IMAGENS.md com os slots de foto,
  render e legenda pronta pra colar. Tem dois modos: "/carrossel configurar"
  faz a entrevista da marca visual (uma vez); "/carrossel" monta a peça. Use
  quando o usuário pedir "carrossel", "post pro instagram", "conteúdo pro
  feed", "configurar a marca do carrossel", ou /carrossel.
---

# /carrossel

Pega um tema e entrega a peça pronta pra postar. O desenho **não se inventa
aqui**: está resolvido no kit e no `marca/tokens.css`. O tom **não se inventa
aqui**: está na `_memoria/` (a voz em `escrita-publica.md`; quem você é, o @,
o público e a oferta em `empresa.md`).

## Como rodar

| Comando | O que faz |
|---|---|
| `/carrossel configurar` | A entrevista da marca visual (cor principal, outras cores, fontes, logo) que grava `marca/`. Roda uma vez |
| `/carrossel <tema, link ou material>` | Monta a peça inteira |
| `/carrossel render <pasta da peça>` | Só regera a linha do tempo e os JPEGs de uma peça já montada (ver "Modo render") |

## Passo 0: a marca está configurada?

**A marca está configurada quando `marca/tokens.css` existe sem a linha
`ESTADO: nao-configurado`**: é o sinal que todas as skills visuais leem. Se
`marca/tokens.css` ou `marca/marca.md` não existem, copiar os moldes
(`*.molde.*`) pra eles. Marca não configurada: **parar e rodar o modo
configurar**, nunca montar peça na paleta de demonstração. Os moldes nunca se
editam; o `tokens.css` e o `marca.md` são da pessoa e se versionam com o
workspace.

---

## Modo configurar

Seguir `referencias/entrevista.md`: lê da `_memoria/` o nome, o @, a voz, o
público e a oferta (só pergunta o que falta lá, e grava lá), e pergunta o
visual (cor principal, outras cores, fontes, logo). Grava `marca/tokens.css`
(sem o marcador), `marca/marca.md` e `marca/logo/`, e termina com o
`node .claude/skills/carrossel/scripts/confere.mjs` limpo.

A régua do que se grava está em `referencias/trocar-de-marca.md`.

---

## Modo montar

### 1 · Planejar

Ler `marca/marca.md`, `referencias/metodo.md` e a memória de conteúdo
(`_memoria/empresa.md`, `escrita-publica.md`, `marketing.md`). Definir tese
(cabe em uma frase), público e objetivo. Quantidade de slides segue a
profundidade do tema: 9 é o padrão; "10 coisas" pede 11 ou 12; tema raso, 6 ou
7. **Propor o CTA** já escolhido, com o motivo, pela função da peça
(`_memoria/marketing.md`) e pela régua "O CTA" de `escrita-publica.md`.

### 2 · Escrever o roteiro

Criar a pasta `carrosseis/<tema>-AAAA-MM-DD/` na raiz do projeto e escrever
`roteiro.md` ali, slide a slide, na voz de `_memoria/escrita-publica.md`. Se
soaria estranho dito em voz alta pela pessoa, está errado. Valor cedo: os
slides 2 e 3 seguram a retenção. Uma ideia por slide.

### 3 · Montar o HTML

Duplicar `kit/modelo-carrossel.html` pra `carrossel.html` na pasta da peça e
trocar o conteúdo (os comentários do modelo explicam cada slide; a régua está
em `referencias/composicao.md`). Trocar `@SEU_PERFIL` pelo @ de
`_memoria/empresa.md`; se há logo (`marca/marca.md`), ela entra no `.follow` do
fecho.

Composição mínima, por peça:

- mínimo 2 componentes diferentes, nunca o mesmo em slides seguidos
- no máximo 1 terminal, 1 janela do Mac e 1 elemento decorativo
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

Quando as imagens chegarem: conferir o tamanho antes de renderizar (o export
é 2×; abaixo do mínimo sobe borrado), trocar o `.slot` por `<img>`, caminho
absoluto `/carrosseis/<peça>/arquivo.jpg`. A peça só abre estilizada pelo
render (os caminhos são absolutos a partir da raiz do projeto): pra ver no
navegador, olhe o JPEG. O render serve só a pasta do HTML (com as subpastas
dela) e o kit desta skill; imagem noutra pasta entra com `--servir <pasta>`, e
arquivo cujo nome começa com ponto nunca sai.

### 5 · Renderizar

```
node .claude/skills/carrossel/render/render-carrossel.js carrosseis/<peça>/carrossel.html
```

Sai um JPEG por `.slide` em `instagram/` (a API do Instagram só aceita JPEG,
até 8 MB; o render trava em 3 MB, com folga). Ele não grava se a fonte não
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
node -e "const {confereLegenda}=require('./scripts/lib/legenda.js');console.log(JSON.stringify(confereLegenda(require('fs').readFileSync(process.argv[1],'utf8'))))" <pasta>/legenda.txt
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

## As quatro regras que não se quebra

1. **Nunca três slides de texto seguidos.** Não é fórmula de dois textos por
   imagem: variar é o ponto.
2. **Imagem a pessoa traz.** Marcar o slot, listar no `IMAGENS.md`, nunca
   buscar na web.
3. **Fecho em cor cheia**, a principal ou a mais fechada, nunca as duas no
   mesmo slide. Conteúdo centralizado, assinado pela logo (se houver). Sem
   figura no fecho. Crédito de fonte vai na legenda, não na arte; a única
   exceção é arte de terceiro, que leva `arte:` no `.ct` (obrigatório).
4. **Capa é foto.** Sem foto ainda, fica o slot. Nunca montar a capa "enquanto
   isso" com outra coisa.

## Regras do kit

- **Nunca inventar cor.** Precisou de um tom que não existe nos tokens, parar
  e perguntar.
- **Nada de emoji dentro da arte.** Ícone é SVG inline em traço.
- **Sem travessão** na arte nem na legenda: ponto, vírgula, dois-pontos ou
  parênteses. É a marca mais óbvia de texto escrito por máquina.
- **Variante se propõe, não se fixa.** Janela clara ou escura, fecho na
  principal ou no abismo, palavra-gatilho ou quatro ações: chegar com uma
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
