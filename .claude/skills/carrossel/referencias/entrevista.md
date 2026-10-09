# A entrevista

O que este arquivo é: as perguntas do modo `/carrossel configurar`, o que cada resposta grava e como agir quando a pessoa não sabe responder. Ler só nesse modo.

A entrevista roda **uma vez** e cuida só do que é visual: a cor, a fonte e a logo. Quem você é, o seu @, a sua voz, o seu público, o que você vende e o CTA já moram na `_memoria/`, e a entrevista **lê de lá**, nunca pergunta de novo nem copia para cá. Um conceito, uma fonte: o que mora em dois lugares diverge na primeira mudança.

---

## Antes de perguntar: ler a memória

Abrir `_memoria/empresa.md` e `_memoria/escrita-publica.md` e conferir o que a peça precisa de lá:

| O que a peça usa | Onde mora | Se estiver `*(a definir)*` |
|---|---|---|
| O nome e o @ (o @ entra no cabeçalho de todo slide e no fecho) | `_memoria/empresa.md`, "Quem é" (**Marca e @**) | perguntar aqui: "Como se chama a marca, e qual é o @ do perfil?" |
| A voz (a frase transcrita, o que combina e o que destoa) | `_memoria/escrita-publica.md`, "A voz" | perguntar aqui: "Me manda uma frase sua, do jeito que você falaria com um cliente no WhatsApp." |
| Quem lê e o que se vende | `_memoria/empresa.md`, "Mercado e cliente" e "Ofertas" | perguntar aqui: "Pra quem você fala, e o que você vende?" |

A resposta do que faltava **se grava no módulo dono da memória**, pela `/memoria registrar`, e não no `marca.md`. Se a memória inteira está em branco, dizer em uma frase que o `/instalar` preenche tudo de uma vez, e seguir com o visual: a marca visual não espera a memória.

O CTA não se pergunta: cada peça propõe o dela pela função (`_memoria/marketing.md`, "Função do conteúdo") e pela régua de `_memoria/escrita-publica.md` ("O CTA").

---

## Como conduzir

- **Uma pergunta por vez**, em linguagem de conversa. Nada de formulário com todos os campos de uma vez.
- **"Não sei" é resposta válida em todas.** Cada pergunta tem um caminho pra isso, descrito abaixo.
- **Antes de gravar, mostrar o resultado** (as cores com os hex, as fontes, a logo) e perguntar se bate. Só então escrever os arquivos.
- Se a pessoa já mandou tudo de uma vez numa mensagem só, não perguntar de novo o que ela já disse. Confirmar e gravar.

---

## As 4 perguntas

### 1. Cor principal

> Qual é a cor principal da marca? Pode ser o hex, o nome, ou o link do site ou da logo que eu tiro de lá.

Grava: `--c-dark`.

Não sei: pedir o link do site ou a logo. Sem nenhum dos dois, propor três direções ("escura e sóbria", "clara e leve", "forte e quente") e a partir da escolha propor uma cor concreta, com o hex, pra ela aprovar.

### 2. As outras cores

> Tem mais cores? Um fundo claro, um acento (a cor dos botões, do que chama atenção), uma ou duas de apoio?

Grava: `--c-light`, `--c-accent`, `--c-support-1`, `--c-support-2`, `--c-rare`, `--c-abyss`, `--c-ok`.

Não sei, ou só tem a principal: derivar as sete da principal pelas regras de [trocar-de-marca.md](trocar-de-marca.md), seção "Quando a marca tem menos de 8 cores". Mostrar as oito com hex antes de gravar.

Sempre: medir o contraste `--c-dark` sobre `--c-light`. Abaixo de 4,5:1, explicar em uma frase e oferecer as duas saídas (escurecer a principal um tom, ou usar o abismo como cor de texto). A pessoa decide.

### 3. Fontes

> A marca tem fonte definida? Se tiver, qual (ou quais)? Se não tiver, eu tenho três pares prontos.

Grava: o `@import` e os três `--f-*` no `tokens.css`.

Com fonte de marca: se ela está no Google Fonts, montar o `@import`. Uma família só serve pra display; a serifada e a mono vêm de um dos pares prontos que combine. Se não está no Google Fonts, explicar o caminho do `@font-face` (trocar-de-marca.md, passo 3) e, enquanto os arquivos não chegam, gravar o par pronto mais próximo.

Não sei: descrever os três pares em uma linha cada (editorial, neutro, quente) e recomendar um a partir do que a marca vende (lido em `_memoria/empresa.md`). Gravar o escolhido.

### 4. Logo

> Tem logo? Se tiver, me passa o arquivo (PNG com fundo transparente, de preferência em duas versões: uma clara pra fundo escuro e uma escura pra fundo claro).

Grava: os arquivos em `marca/logo/` como `logo-clara.png` e `logo-escura.png`, e o registro na seção Logo do `marca.md`.

Sem logo: gravar "sem logo" no `marca.md`. O fecho usa só o @, e a capa não leva assinatura. Funciona bem; muita marca pessoal é assim.

Com uma versão só: gravar a que veio, avisar que em fundo da cor oposta ela pode sumir, e que a segunda versão pode chegar depois.

---

## O que se grava, e onde

| Arquivo | O que recebe |
|---|---|
| `marca/tokens.css` | `@import` das fontes, 8 canais RGB no bloco 1, 3 famílias no bloco 2. **O marcador `ESTADO: nao-configurado` sai**: é ele que diz a todas as skills que a marca está configurada |
| `marca/marca.md` | só o visual e o uso da peça: a logo e onde ela assina. As seções de voz de narração e de recusas visuais ficam em branco até o `/video` ou uma peça gravarem |
| `marca/logo/` | os PNGs da logo |
| `_memoria/` (pela `/memoria registrar`) | só o que faltava na memória e foi perguntado acima |

Depois de gravar, rodar `node .claude/skills/carrossel/scripts/confere.mjs`. Se reprovar, cada linha diz o arquivo, a linha e o conserto (o mais comum: hex no lugar de RGB, contraste baixo, `@import` faltando): corrigir antes de dizer que está pronto.

E fechar dizendo o próximo passo em uma linha: "Marca configurada. Me manda um tema, ou um link, e eu monto a primeira peça."

---

## O que a entrevista NÃO faz

- Não inventa cor que a pessoa não aprovou.
- Não muda o `componentes.css`.
- Não grava nome, @, voz, público, oferta nem CTA no `marca.md`: eles moram na `_memoria/`.
- Não pergunta o que a memória ou o `marca.md` já respondem, em nenhuma peça futura.
- Não promete peça sem render. Antes de fechar, rodar `node .claude/skills/carrossel/render/render-carrossel.js --checar`: se sair reclamando de Playwright ou Chromium, a entrevista termina apontando `render/instalar.md`.
