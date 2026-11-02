# Plataforma

Fatos do Instagram: formato, limite, sinal de ranking, regra de originalidade.
**Todos são "plataforma, a conferir"**: mudam sem aviso, e antes de entrar numa
peça ou numa decisão se conferem na fonte oficial (a central de ajuda do
Instagram, o blog oficial para criadores, a documentação da Graph API da Meta).
A entrega diz que conferiu ou que não conseguiu.

## Formato e limite

### 1. Imagem do feed: a proporção vertical é a mais segura

**Por quê.** A imagem vertical ocupa mais tela. A API de publicação aceita uma
faixa de proporções; 4:5 (1080×1350) está dentro dela. O app aceita também 3:4,
mas a API pode não aceitar.
**Como aplicar.** O padrão do `/carrossel` é 4:5. Antes de usar outra
proporção, conferir a faixa aceita pela API de publicação na documentação.
**Força:** plataforma, a conferir

### 2. Carrossel: limite de slides

**Por quê.** O app e a API têm limites próprios de itens por carrossel, e as
duas documentações já divergiram.
**Como aplicar.** Conferir o limite atual da API antes de montar carrossel
acima de dez slides.
**Força:** plataforma, a conferir

### 3. Reel: duração e tamanho

**Por quê.** Há um teto de duração para o reel ser recomendado a quem não
segue, e a API aceita uma faixa de duração e tamanho de arquivo.
**Como aplicar.** Conferir os dois limites antes de produzir reel longo ou de
publicar pela API.
**Força:** plataforma, a conferir

### 4. Hashtag: limite por post

**Por quê.** O limite de hashtags por post já mudou e as fontes divergem.
**Como aplicar.** Conferir antes de escrever a legenda; o acervo recomenda
poucas e específicas.
**Força:** plataforma, a conferir

### 5. Posts fixados: quantos

**Por quê.** O número de fixados no perfil é definido pela plataforma.
**Como aplicar.** Conferir no app antes de planejar a vitrine.
**Força:** plataforma, a conferir

## Ranking e distribuição

### 6. Os sinais de ranking são ações de quem vê

**Por quê.** A plataforma declara que pesa ações como curtir, comentar, enviar,
assistir e assistir até o fim, de forma diferente por superfície (feed,
stories, reels, explorar).
**Como aplicar.** Conferir a lista atual na comunicação oficial sobre ranking.
O acervo usa envio e retenção como sinais principais.
**Força:** plataforma, a conferir

### 7. Originalidade conta

**Por quê.** A plataforma declara reduzir a recomendação de contas que
publicam majoritariamente conteúdo de outros; borda, marca d'água ou crédito
não tornam o conteúdo original.
**Como aplicar.** Conferir a regra atual antes de qualquer estratégia com
conteúdo de terceiro.
**Força:** plataforma, a conferir

### 8. Atualidade conta

**Por quê.** Conteúdo recente e ligado ao assunto do momento recebe peso.
**Como aplicar.** Base para a vaga livre de notícia na semana.
**Força:** plataforma, a conferir

### 9. Reel de teste vai primeiro para quem não segue

**Por quê.** O recurso mostra o reel a quem não segue antes de mostrar à base.
**Como aplicar.** Conferir se o recurso está disponível para a conta.
**Força:** plataforma, a conferir

### 10. O usuário pode ajustar os tópicos que vê

**Por quê.** Há controle de tópicos para quem consome, o que reforça o valor
de falar de um assunto claro.
**Como aplicar.** Conferir o recurso atual; não muda a semana, reforça o
recorte.
**Força:** plataforma, a conferir

### 11. Conteúdo gerado por IA pode receber rótulo

**Por quê.** A plataforma rotula conteúdo gerado ou alterado por IA em certas
condições.
**Como aplicar.** Conferir a regra antes de publicar imagem ou vídeo gerado.
**Força:** plataforma, a conferir

## Métricas

### 12. As métricas atrasam

**Por quê.** Os números de insights podem levar até dois dias para assentar.
**Como aplicar.** Conferir o atraso documentado; a leitura não fecha peça com
menos de dois dias.
**Força:** plataforma, a conferir

### 13. Dados de público pedem mínimo de seguidores

**Por quê.** A demografia da conta só aparece acima de um número mínimo de
seguidores.
**Como aplicar.** Conferir o mínimo; conta pequena lê público pela caixa de
mensagem e pelos comentários.
**Força:** plataforma, a conferir

### 14. Os nomes das métricas da API

**Por quê.** A Graph API nomeia as métricas (views, reach, saved, shares,
likes, comments, total_interactions, follows, profile_visits, tempo médio
assistido e taxa de pulo do reel) e as troca entre versões.
**Como aplicar.** O leitor `scripts/instagram/insights.mjs` usa esses nomes;
se uma some, conferir a documentação de insights da versão em uso.
**Força:** plataforma, a conferir
