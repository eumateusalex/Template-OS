# Modo semana · o calendário de uma semana

Entrega a semana de uma conta, de segunda a domingo: uma linha por peça, com o
porquê de cada escolha, pronta para virar briefing. **Conteúdo se planeja por
semana**: a leitura de uma semana decide a seguinte.

## Entrada

- a conta (`SKILL.md`, passo 2);
- a semana (a segunda-feira dela, no fuso da pessoa);
- o que a pessoa já tem em mãos: uma notícia, um caso, uma objeção que ouviu,
  uma gravação feita. **O que ela trouxe entra primeiro**: o conteúdo nasce da
  realidade do negócio (`marketing.md`, "Produção"). **Sem material dela, a
  semana segue** com as fontes do passo 5, e o arquivo diz numa linha que os
  temas não vieram dela; não se bloqueia por pergunta.

## Os passos

```
- [ ] 1. Ler a saúde da conta e o estado (token, publicação, mensagens, link, o que está pronto)
- [ ] 2. Ler a semana anterior (o modo leitura), ou dizer por que não há
- [ ] 3. Fechar a cota e a mistura pela regra da conta
- [ ] 4. Pôr cada peça num dia e num horário, pela rotina de quem vai ver
- [ ] 5. Preencher cada linha
- [ ] 6. Conferir a semana contra as sete travas abaixo
- [ ] 7. Gravar o arquivo
```

**1. A saúde e o estado.** O leitor roda primeiro (`SKILL.md`, passo 3):

- **saída 0**: ele traz a bio e o site de hoje, que dizem para onde a peça de
  conversão manda a pessoa, e os posts do período;
- **saída 3**: o token morreu, e o publicador usa o mesmo. O estado da semana é
  "publicação pela API bloqueada", a renovação vira a primeira linha de "O que
  depende de você" e o passo 2 diz "não medi". Sem leitor, o link da bio também
  não se lê: a peça de conversão sai condicionada à pessoa confirmar o destino.

Depois, `_memoria/estrategia.md`, "Estado das frentes": se a publicação está
parada, a semana sai assim mesmo e a entrega diz que só vai ao ar quando ela
religar. **Peça pronta e não publicada** entra antes de peça nova só se passar
a régua de hoje: leia a peça contra a `escrita-publica.md` atual. "Pronta" na
memória quer dizer pronta no dia em que se escreveu.

**2. A semana anterior.** Com post publicado e o leitor em 0, rode o modo leitura
antes (`leitura.md`): o que trouxe seguidor e envio puxa a repetição da ideia em
outro gancho ou formato (`acervo/cadencia-e-semana.md`, 13). Sem post, "não há
semana anterior para ler"; sem leitor, "não medi: <o motivo>".

**3. A cota e a mistura.** A regra é a de `_memoria/marketing.md`:
"Planejamento semanal" (onde publica, quantas peças, a mistura de territórios e
de funções) e "Função do conteúdo" (a função decide o CTA). A semana precisa de
peça de atenção ou conexão, de autoridade e de prova ou conversão
(`acervo/cadencia-e-semana.md`, 3): semana só de atenção traz gente que não
compra; só de autoridade não fura a bolha.

**4. O dia e o horário.** Se a `marketing.md` não fixa dia nem horário, a skill
propõe, dizendo que é proposta: o começo da semana aceita o conteúdo denso; o
meio pede o leve que quebra o ritmo; o fim de semana aceita o bastidor e o
humano. O horário vem da rotina de quem vai ver (o público da `marketing.md`) e,
quando houver, da aba de público do app (`acervo/cadencia-e-semana.md`, 7 e 8).
Os stories seguem a quantidade da `marketing.md` e a mesma regra de cota do
feed: quando a pessoa declara o "Peças por semana" abaixo do padrão de 7, ou as
horas que tem por semana para o conteúdo, os stories se reduzem na mesma
proporção. Com 3 peças contra 7 do padrão, os dias de story caem de 7 para 3
(arredondado para cima, nunca menos de um), cada um no piso de stories do dia;
com as horas, a semana estima quantas peças cabem nelas e aplica a mesma conta,
mostrando-a. O que foi cortado (os dias, a quantidade por dia) vai dito em "O
que depende de você", com a conta, nunca decidido calado.

**5. Cada linha.**

| Campo | De onde sai |
| --- | --- |
| dia e horário | o passo 4 |
| território | `marketing.md`, "Territórios de conteúdo" |
| função | `marketing.md`, "Função do conteúdo" |
| formato | `marketing.md`, "Formatos" |
| profundidade | a tabela abaixo |
| tema | o que a pessoa trouxe; as objeções e dúvidas reais que a memória guarda; o que a leitura da semana anterior mandou repetir |
| gancho | uma frase de capa ou de primeiros segundos, na voz da `escrita-publica.md` |
| CTA | o que a função aceita com o estado de hoje (a tabela abaixo), com o motivo na mesma frase |
| skill | `/carrossel` (e qual formato), `/cortes`, `/video` |
| por quê | uma linha, com o princípio do acervo quando a escolha vem dele |

| Formato | A profundidade |
| --- | --- |
| carrossel | os números por função da `marketing.md`, dentro da faixa do `/carrossel` (o passo 1 de lá: 9 é o padrão, 6 a 12 conforme o tema) |
| carrossel estilo X | a profundidade do tema, um item por slide (`.claude/skills/carrossel/x.md`) |
| post avulso | um slide (`.slide.post` do `/carrossel`) |
| reel | a duração por função da `marketing.md` |

Sem número na `marketing.md` (o campo ainda *(a definir)*), a linha usa o padrão
do `/carrossel` e diz "sem régua da memória".

| Função | CTA com as mensagens sem quem atenda |
| --- | --- |
| atenção, conexão | nenhum, ou o envio com o motivo ("manda para quem ainda ..., porque ...") |
| autoridade | salvar ou enviar, com o motivo; nunca comentário em troca de material |
| prova | conforme a peça, sem promessa de resposta por mensagem |
| conversão | o link da bio, só com o destino lido no passo 1; sem ele, a linha fica condicionada |

Com alguém atendendo, vale a tabela de CTA da `marketing.md` inteira.

**A notícia se escolhe na semana, não no plano.** O plano reserva o dia
("notícia da semana, escolhida na véspera") e não inventa o tema. Notícia vai em
formato que se monta rápido (carrossel, estilo X), nunca em reel falado: o reel
pede gravação em lote, e a notícia é do dia.

**O roteiro do reel falado sai da pessoa em tópicos** (voz ou lista): a semana
dá o tema e o gancho, o briefing dá as perguntas que ela responde, a skill
lapida o que ela mandar, e o `/cortes` edita o que ela gravou. O briefing do
reel sai antes do dia da gravação; a semana marca o dia em "O que depende de
você".

**Os stories são gesto da pessoa, no app.** A semana diz o assunto de cada dia
numa linha, e a trava 5 conta o tempo deles.

**O gancho da semana é proposta sem régua de máquina**, e a linha diz isso. A
régua da capa roda na skill que produz.

**6. As sete travas da semana.**

1. A cota e a mistura batem com a regra da conta.
2. Nenhuma peça promete resposta por mensagem sem quem atenda, e nenhuma manda
   ao link da bio sem saber para onde ele aponta.
3. Três dias seguidos não repetem o mesmo formato nem a mesma função (o
   carrossel do kit, o estilo X, o post avulso e o reel são formatos
   diferentes).
4. O que depende da pessoa (renovar o token, gravar o reel, aprovar a notícia,
   confirmar o link) está dito, com o dia em que precisa estar pronto.
5. Cabe na semana dela: o reel falado pede gravação, e a gravação em lote é a
   regra (`marketing.md`, "Produção"). Se a semana pede mais que um bloco de
   gravação, corte peça, não a régua.
6. Fato que a peça vai afirmar está marcado "a conferir no briefing".
7. Toda linha diz o ponto de vista da pessoa numa frase, até a de notícia
   (`acervo/perfil-e-posicionamento.md`, 10).

**7. O arquivo.** `marketing/semanas/<AAAA-MM-DD>-<conta>.md` <!-- caminho futuro: nasce no primeiro uso do modo semana --> (a
segunda-feira da semana). Leva a tabela, o porquê e "O que depende de você".

## A entrega

O veredito nos dois sentidos (`SKILL.md`, "Como fecha"): "está ok: a semana tem
7 peças, 2 dependem de você gravar na terça", ou "não está ok: a semana está
planejada, mas não vai ao ar enquanto o token não for renovado". Depois, a
tabela e o que depende da pessoa em lista. Cada linha vira um briefing quando
ela disser qual peça começa (`briefing.md`).
