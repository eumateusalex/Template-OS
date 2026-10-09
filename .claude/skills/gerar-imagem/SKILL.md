---
name: gerar-imagem
description: >
  Gera imagem por IA pelo Nano Banana (Vertex AI, o padrão) ou, opcional, pelo GPT
  do seu plano ChatGPT, para carrossel, site, capa, fundo, textura, personagem
  recorrente ou peça avulsa. Escreve o prompt em inglês, avisa o custo e mostra o
  resultado pro usuário aprovar. Use para "gera uma imagem de...", "cria uma foto
  pra...", "faz uma ilustração", "gera pelo GPT", "pose nova do personagem", ou
  /gerar-imagem.
---

# /gerar-imagem — Imagem por IA (Nano Banana ou GPT)

A porta é `scripts/gerar-imagem.js`, com dois motores: o **Nano Banana** (o
padrão, pela Vertex AI) e o **GPT** (`--motor gpt`, opcional, ver "O motor GPT"
abaixo). A receita completa do Nano, os erros e o porquê da Vertex estão em
`scripts/guia-geracao-imagem-vertex-ai.md` — **ler só quando algo falhar**; pra
gerar imagem, esta skill basta.

⚠️ **Primeira vez?** Precisa da CLI do Google Cloud instalada, `gcloud auth
login` feito e `GOOGLE_CLOUD_PROJECT` no `scripts/.env`. O guia acima tem os
três passos, e o `--dry-run` confere sem gastar nada. O motor GPT tem passos
próprios, e só se você quiser usá-lo.

**Autenticação não tem chave.** É o login do `gcloud` na máquina, que emite token
efêmero. Se der 401/403, o conserto é `gcloud auth login` — não mexer no `.env`.

⚠️ **Testada só no Windows.** O script acha o `gcloud` pelo `GCLOUD_PATH`, pelo PATH
(em qualquer sistema) e pela pasta da instalação do Windows, e o motor GPT sabe onde
o proxy guarda o registro no Windows, no macOS e no Linux; mas as suítes e o uso
real só rodaram no Windows 11. No macOS ou no Linux, rode o `--dry-run` antes da
primeira geração.

---

## As cinco regras

**1. Avisar o custo antes e gerar UMA imagem por vez.**
Cada geração no Nano é dinheiro real (abatido dos créditos do Cloud). Nada de
gerar quatro variações "para o usuário escolher" sem ele ter pedido — isso é
multiplicar o custo por uma decisão que é do usuário.

**Visual novo vai com opções, e a opção custa zero até ser escolhida.** O
`CLAUDE.md` ("Visual novo vai com opções") manda trazer 3 a 5 variações de
elemento visual que o usuário ainda não viu, com a crítica e a recomendação. Aqui
elas chegam **como descrição e prompt**, cada uma com a crítica e a recomendação,
e **só a escolhida é gerada**. Se o usuário prefere ver as opções em imagem (ou
já disse isso em `_memoria/preferencias.md`), gerar as várias com o custo total
dito antes: o leque visto é o pedido. E se o usuário liberar o gasto (também em
`_memoria/preferencias.md`), dizer o custo passa a ser informar, e não pedir
licença. No GPT não há custo por imagem, mas há limite do plano: avisar igual.

**2. Mostrar o PNG antes de fixar.**
Imagem gerada não entra em peça nenhuma antes de o usuário ver. Decisão visual se prova
no PNG. Se não prestou, ajustar o prompt e gerar de novo — sempre
avisando o custo de novo.

**3. Prompt em inglês, sempre.**
Os modelos respondem melhor. O usuário pede em português; o Claude traduz e manda em inglês.

**4. Modelo de imagem erra letra — nunca gerar peça com texto.**
Tipografia, título e legenda saem do HTML renderizado (`/carrossel`), não da IA.
A imagem entra como **foto, cena, fundo ou textura**. Se a peça precisa mesmo de
texto legível dentro da imagem (diagrama, mockup de tela), aí sim `--modelo pro`
ou `--motor gpt`.

**5. Prompt de especialista, nunca genérico.**
O prompt diz lente, luz, material, enquadramento e o que a cena prova, escrito
como diretor de fotografia e não como legenda. "Uma mesa de escritório bonita"
gera banco de imagem; "35mm, luz lateral de fim de tarde, mesa de madeira clara
com a planilha aberta no notebook, profundidade de campo rasa" gera a cena. A
paleta e o clima saem da marca do usuário (`identidade/design-guide.md`, que
aponta para os tokens do `/carrossel`): se a marca ainda não foi configurada,
dizer isso antes de escrever prompt que dependa de cor.

---

## Uso

```bash
node scripts/gerar-imagem.js --prompt "..." --saida caminho/imagem.png
```

| Flag | Padrão | Quando mexer |
|---|---|---|
| `--motor` | `nano` | `gpt` pro motor opcional (ver "O motor GPT") |
| `--modelo` | `flash` (~US$ 0,067 em 2K) | `pro` (~US$ 0,13) só pra texto legível ou diagrama |
| `--formato` | `4:5` | `16:9` pra site/capa, `1:1` pra avatar, `9:16` pra story |
| `--tamanho` | `2K` | `1K` pra rascunho barato, `4K` só se for imprimir |
| `--ref foto.png` | — | image-to-image. **Repetível**, até 14 (ver abaixo) |
| `--prompt-file x.md` | — | prompt longo, pra não brigar com aspas no shell |
| `--dry-run` | — | validar sem gastar |
| `--personagem <pasta>` | — | personagem recorrente: as referências da pasta na frente e o prompt base antes da cena (ver abaixo) |

O `--dry-run` resolve projeto e login de verdade — é o jeito barato de descobrir
que falta configuração.

### Várias referências na mesma imagem

⭐ **Um `--ref` por imagem, e a ordem da linha de comando é a ordem em que o
modelo vê.** É isso que permite citar cada uma no prompt:

```bash
node scripts/gerar-imagem.js \
  --prompt "a pessoa da imagem 1, sentada no ambiente da imagem 2, luz da imagem 3" \
  --ref rascunho/rosto.jpg --ref rascunho/sala.png --ref rascunho/luz.webp \
  --saida rascunho/capa.png
```

Serve pro que uma referência só nunca resolveu: **manter a mesma pessoa, o mesmo
produto ou o mesmo estilo entre peças diferentes**. Uma referência muda a imagem;
várias mantêm a identidade dela.

| Modelo | Teto | Como a doc reparte |
|---|---|---|
| `flash` | 14 | até 10 de objeto em alta fidelidade, até 4 de personagem |
| `pro` | 14 | até 6 de objeto, até 5 de personagem, até 3 de estilo |
| `legacy` | 3 | ⚠️ escolha conservadora, não número oficial |

> Os 14 saíram da página oficial de geração de imagem do Gemini, conferida em
> 08/09/2026. O `legacy` (`gemini-2.5-flash-image`) **não aparece mais lá**, então
> não existe teto vigente publicado: o 3 é conservadorismo. Quem precisa de muita
> referência usa `flash` ou `pro`, que é onde o número está escrito.

Extensões aceitas: `.png`, `.jpg`, `.jpeg`, `.webp`, `.heic`, `.heif`. Qualquer
outra o script recusa **antes** de gastar.

> 🚨 **Referência de personagem não revoga "sem rostos identificáveis"** (a regra
> do passo 2 do fluxo). As duas convivem assim: rosto que pode entrar como
> referência é **o seu**, ou o de alguém que autorizou por escrito. Rosto de
> terceiro tirado da internet não entra, nem como referência nem como saída, e a
> consistência de personagem não é motivo pra abrir exceção. Na dúvida,
> **perguntar antes de gastar**.

> ⚠️ **A estimativa de custo na tela é da SAÍDA.** Cada referência entra como
> token de entrada e cobra por cima. É pouco perto da imagem gerada, mas não é
> zero, e por isso o script escreve `+ entrada de N refs` em vez de deixar o
> número parecer o total.

### Personagem recorrente

Para marca que tem um mascote ou uma ilustração fixa, que precisa sair igual em
toda pose. **Cena do personagem é sempre `--personagem <pasta>`**, nunca as refs
à mão: é o que garante a ordem.

```bash
node scripts/gerar-imagem.js --personagem <pasta-do-personagem> --prompt-file cena.md --saida <pasta>/<pose>.png
```

A pasta é do usuário (sugestão: uma pasta `personagem` dentro de `identidade/`,
criada no dia em que o usuário tiver o primeiro personagem aprovado) e leva:

| O quê | Como |
|---|---|
| `prompt-base.md` | a identidade do personagem, em inglês: traço, cores, roupa, o que nunca muda, citando "image 1, 2, 3" |
| `referencias/` <!-- caminho futuro: nasce na pasta do personagem --> | as imagens aprovadas, numeradas (`01-`, `02-`, `03-`). **A ordem do nome é a hierarquia**: a ficha de regras manda sobre o rosto, o rosto sobre a composição |

O script põe as imagens da pasta na frente (em ordem de nome), depois as `--ref`
da linha, e antepõe o `prompt-base.md` à cena. O `cena.md` leva só a cena
(`SCENE:` a pose, a expressão, o objeto) e o enquadramento (`FRAMING:`). As
referências da pasta contam no teto do modelo. Só roda no Nano: o GPT redesenha
o rosto entre gerações.

O que já se mediu num personagem real, e vale para qualquer um:

- **Uma cena por vez, e no máximo duas gerações ao mesmo tempo.** Quatro em
  paralelo deram 429 (cota)
- **Perfil estrito deriva**: de perfil, o rosto vira outra pessoa. Três quartos
  ou de frente
- **Mão simples**: uma mão aberta, poucos traços, "exactly five fingers". Mão
  perto do rosto desmonta óculos e acessórios
- **Lado é o da imagem**: "on the viewer's right", e não "his right"
- **Antes de aceitar**, lado a lado com a referência do rosto: cabelo, roupa e
  acessórios iguais, nenhuma cor que não foi pedida, nenhum dedo a mais (contar),
  nenhuma anatomia quebrada, e a cena legível com 200 px de largura. Reprovou
  num item, refazer dizendo o erro concreto no `SCENE:`

⚠️ **A saída é opaca.** O `/carrossel` pede a figura recortada em PNG
**transparente** (`.figura` e `.busto`). Pedir fundo branco liso no prompt
facilita o recorte, mas o recorte em si não é deste script.

> 🚨 **Mexeu no `gerar-imagem.js`? Rodar `node scripts/teste-gerar-imagem.mjs`**,
> que não fala com o Google: um gcloud falso da bancada dá o token, e o de
> verdade fica fora do alcance. Ele prova que o script ainda recusa o que deve,
> que a ordem das referências não inverteu e que o personagem entra na ordem da
> pasta. **Ordem invertida não dá erro**: sai imagem plausível e errada, que é o
> defeito mais caro de achar.

---

## O motor GPT

`--motor gpt` gera pelo **gpt-image-2 do seu plano ChatGPT**: sem chave de API e
sem custo por imagem (gasta o limite de imagem do plano). É **opcional**: o Nano
continua o padrão, e nada nesta skill depende do GPT.

> 🚨 **Leia antes de ligar: o caminho é NÃO OFICIAL.** O script fala com o
> servidor de imagem do ChatGPT por um proxy de terceiro (`openai-oauth`) que usa o seu login do Codex fora do Codex. Isso quer dizer:
>
> - **A OpenAI não oferece nem suporta esse caminho.** Não se acha
>   autorização nem proibição escrita para ele, e isso pode mudar. Usar o login fora do app oficial pode contrariar os termos de uso
>   dela, e **o risco é da sua conta do ChatGPT** (limite, suspensão).
> - **Pode quebrar sem aviso**, de um dia para o outro, quando o backend mudar.
> - **O proxy local não tem autenticação.** Enquanto está no ar, qualquer
>   programa do seu PC que alcance a porta dele gera imagem na sua conta (ele
>   escuta só em 127.0.0.1, então de fora do PC não se alcança). Por isso ele
>   **vive só durante a geração**: o script o sobe numa porta livre diferente a
>   cada vez, o desce no fim (também no erro e no Ctrl+C), e, se uma execução
>   morrer sem descê-lo, a seguinte o derruba antes de qualquer coisa. O pedido
>   com o seu prompt e as suas imagens não segue redirecionamento.
>
> **Para não usar, não faça nada**: sem `--motor gpt` e sem `codex login`, o
> motor GPT nunca roda, e o Nano gera tudo. Quem quiser só o caminho oficial usa
> o próprio app do ChatGPT e traz a imagem pronta.

**Para ligar** (uma vez, por decisão do usuário):

1. Instalar as dependências da pasta de scripts: `npm ci --prefix scripts` (traz
   o proxy, fixado no `scripts/package.json`)
2. Instalar o Codex CLI (`npm install -g @openai/codex`) e rodar `codex login`,
   entrando com a conta do ChatGPT. Sem esse login o script recusa, já no
   `--dry-run`, e diz o comando
3. Conferir sem gerar: `node scripts/gerar-imagem.js --motor gpt --prompt "x" --saida rascunho/x.png --dry-run`

```bash
node scripts/gerar-imagem.js --motor gpt --prompt-file cena.md --formato 4:5 --saida <pasta>/x.png
node scripts/gerar-imagem.js --motor gpt --prompt "..." --ref antes.png --saida depois.png
```

**Quando é ele, e não o Nano:** estrutura de design, diagrama, mockup de tela,
texto legível dentro da imagem, e edição fina de uma imagem que já existe (troca
uma coisa e mantém o resto). Foto de fundo grande e o personagem ficam no Nano.

O que se mediu num plano Plus, e que manda no uso:

| Ponto | Como é |
|---|---|
| Formato | o servidor **ignora** tamanho e qualidade; obedece a proporção escrita, e o script põe `Aspect ratio <--formato>.` na frente do prompt. Aceitos: 1:1, 4:5, 5:4, 3:4, 4:3, 2:3, 3:2, 9:16, 16:9 |
| Resolução | perto de 1,5 megapixel (4:5 sai 1122x1402), metade do Nano em 2K. Para foto de fundo cheia, o Nano rende mais |
| Tempo | 18 a 28 s por imagem |
| Referências | até 5 `--ref`, na ordem em que o prompt cita, só `.png`, `.jpg`, `.jpeg` e `.webp` (o `.heic` do Nano não passa) |
| Recusa | `--modelo`, `--tamanho`, `--via` e `--personagem` |

**Prompt para o GPT**, além da regra 5: texto que deve aparecer na imagem vai
entre aspas, `reads "texto em português"`; descrever composição e não intenção
("medium shot, subject centered" e não "dramatic"); listar o que não pode
aparecer ("no logos, no stock photo look").

**Limite.** O endpoint de imagem tem limite próprio do plano. Quando acabar, o
script diz quando volta, e o caminho até lá é o Nano.

**Uma geração GPT por vez.** O pacote do proxy só deixa um no ar: com outra
geração em andamento, o script recusa e pede para esperar. Se já houver um proxy
`openai-oauth` no ar subido por você, o script não o usa nem o derruba; para
usá-lo, defina `GPT_PROXY_URL` **no terminal** (não no `scripts/.env`, que o
motor GPT não lê) com o endereço dele, sempre em 127.0.0.1.

> 🚨 **Mexeu no motor GPT? Rodar `node scripts/teste-gerar-imagem-gpt.mjs`**,
> com proxy, CLI e login falsos (não precisa de `codex login` nem gasta limite):
> prova a proporção no prompt, a ordem das referências, a recusa sem login e que
> o proxy sobe e desce.

---

## Fluxo

### 1 · Entender o pedido

Antes de escrever o prompt, ter claro: **onde essa imagem vai entrar?** É o que
decide o formato e o motor.

| Destino | Formato | Onde salvar |
|---|---|---|
| Carrossel / post | `4:5` | na pasta da peça, junto do `carrossel.html` |
| Fundo ou hero de site | `16:9` | a pasta pública do projeto do site |
| Story | `9:16` | na pasta da peça |
| Avulsa, sem destino ainda | `4:5` | `rascunho/` |

Se o destino não estiver claro e mudar o formato, perguntar. Uma pergunta é mais
barata que uma imagem no formato errado.

### 2 · Escrever o prompt

Em inglês, descritivo, com a estrutura:

```
[SUJEITO/CENA], [AMBIENTE E LUZ],
shot from [ÂNGULO], [ESTILO/ESTÉTICA],
editorial quality
```

Três coisas que valem sempre:

- **Compor para o texto**: o prompt diz onde fica o assunto, em porcentagem da
  altura, e deixa calma (céu, chão, mesa escura) a faixa onde o título vai entrar.
  Sai mais barato que consertar com véu no CSS.
- **Sem rostos identificáveis** — pessoa reconhecível em peça de marca é
  problema, não estética.
- **Sem texto, letra, número ou logo** na imagem. Dizer isso no prompt.

### 3 · Avisar e gerar

Mostrar pro usuário, antes de rodar: o prompt, o formato, o motor (e o modelo,
no Nano) e o custo estimado. Rodar uma vez.

### 4 · Mostrar e decidir

Mostrar o caminho do PNG pro usuário abrir. Ele aprova ou pede ajuste.

⚠️ **A saída vem grande** (4:5 em 2K no Nano sai em ~1856×2304). Pro carrossel, o
render do `/carrossel` já cuida do enquadramento final — não redimensionar à mão
sem necessidade.

⚠️ **Imagem que vai pro Instagram vai em JPEG.** A API de publicação aceita
JPEG até 8 MB (a especificação da Meta); por isso o render entrega JPEG (o do
`/carrossel` trava em 3 MB por slide, com folga), e a imagem avulsa passa pelo
`node scripts/para-jpeg.js` (qualidade 92). O erro 9004/2207052 não é do
formato: o `/instagram-publisher` explica e já o trata.

### 5 · Guardar

Imagem gerada é **material único que só existe aqui**. Se ela for aproveitada em
alguma peça, commitar no mesmo dia, pela regra do `CLAUDE.md`: imagem que fica só
no disco some junto com a pasta de saída. O `rascunho/`
não vai para o git: imagem aprovada sai de lá para a pasta da peça.

---

## Relação com o `/carrossel`

O `/carrossel` continua com a regra 2 valendo: **a imagem que o usuário traz tem
preferência.** O usuário escolhe melhor, e foto real ganha de foto gerada quase sempre.

Esta skill é a saída pra quando **não existe imagem pra trazer** — cena que não
dá pra fotografar, fundo abstrato, textura, conceito. O `IMAGENS.md` da peça
continua sendo escrito do mesmo jeito; a diferença é que agora aquela descrição
pode virar imagem aqui mesmo, em vez de o usuário levar pra um gerador de fora.

Quem decide é o usuário. Na dúvida, perguntar:

> "Quer trazer a imagem ou quer que eu gere? (~US$ 0,07 cada no Nano; sem custo no GPT, se você ligou o motor GPT)"
