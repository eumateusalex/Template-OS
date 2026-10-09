# 08 · Conteúdo e crescimento: publicar o trabalho

Como um perfil de designer de produto vira referência e gera contato publicando o próprio trabalho
no X: o que publicar, quando, com que legenda, com quem conversar, e o que isso rende. Tudo medido nos
dados de um perfil real que fez esse caminho, do trabalho genérico às séries de produto.

## Base

- 933 registros do perfil, **917 próprios** (727 originais, 27 citações, 83 repostagens, 78 respostas a si mesmo e 2 a outras contas), cobrindo vários anos.
- A aba de respostas: 1.856 itens, 924 respostas próprias, em seis meses.
- O perfil (bio, link, seguidores, peça fixada), lido junto.
- Uma amostra mais recente de dez dias: 154 peças, 113 respostas, sem artigos.
- **Essa base não acompanha a skill**: os números abaixo não se recalculam. As capturas das referências que você acompanhar acrescentam as delas em `janelas/`, uma página por captura. <!-- caminho futuro: nasce na primeira captura -->

**Cuidado que toda medição precisa tomar:** a base de um perfil traz registros de terceiros (o post original de uma repostagem vem gravado com as métricas do dono), e são justamente os números mais altos ("LIQUID GLASS IS BACK", 699.537 views, entre eles). Filtre pelo perfil antes de medir.

**Método de comparação:** o alcance de um perfil pode crescer dez vezes em um mês, então comparar views brutas de peças de datas diferentes engana. Quase toda tabela traz também o **índice relativo**: as views (ou os salvos) da peça divididas pela mediana das peças com mídia do mesmo perfil numa janela de 7 dias em volta. 1,0 é a peça típica daquela semana; 2,0 é o dobro.

## As regras do jogo, medidas

1. **Volume diário alto, sem pular dia.** De ~1 peça por dia para 3,5 e depois **6 por dia**, com intervalo mediano de 1,9 hora. Publicar 10 vezes no dia não derruba o índice de cada peça (0,99 a 1,04 em todas as faixas de volume). Na amostra mais recente, **15 por dia**. → `cadencia.md`
2. **O crescimento vem junto com o volume e com o formato, não antes.** Views somadas por mês: 15.886, depois 152.629, depois **1.041.424** em 22 dias. Views medianas por peça: 506 → 680 → 2.330. → `cadencia.md`
3. **Imagem sempre; texto sozinho não anda.** Peças só de texto: índice 0,30, **zero salvo** mediano (948 views medianas na amostra recente, contra 3.427 a 6.502 das peças de imagem). → `o-que-performa.md`
4. **Legenda curta que nomeia ou promete, sem hashtag, sem link.** Mediana de 44 caracteres e 6 palavras; 0 de 226 peças com hashtag, menção ou link; pergunta em 6% e emoji em 4% (contra 38% e 33% na fase genérica). → `legendas.md`
5. **Cada projeto rende um mês de peças.** Vero apareceu 28 vezes na legenda, Rillo 25 (contando só as legendas que citam o nome; pelo logo na imagem, a seção 06 conta 30 e 27), sempre com a mesma legenda ("Vero, AI Powered Revenue Intelligence Product"). Repetir não desgasta: o índice das peças 21 a 25 da série (1,32) é maior que o das 1 a 5 (0,81). → `legendas.md`
6. **A frase de benefício é a que mais faz salvar.** Índice de salvos 3,06 ("Imagine customer support your team actually enjoys using...", 2,77% de salvos por view). → `legendas.md`
7. **A promessa ao fundador que fez o produto com IA é o que explode.** "From vibe-coded chaos to polished product." (81.873 views, 1.438 salvos) e "Turn your UI AI slop into production-ready design!" (62.896, 973, 52 respostas). O bastidor do cliente ("This one got rejected") faz a peça mais vista da amostra recente (116.856). → `legendas.md`, `o-que-performa.md`
8. **O público muda de quem curte para quem guarda.** Salvos divididos por curtidas: 0,12 na fase genérica; **0,84** nas séries de produto; **1,00** na amostra recente. → `o-que-performa.md`
9. **Rede: elogio curto e específico na peça dos pares, resposta rápida na própria.** 924 respostas em seis meses, 73% na peça de outros designers (peça-alvo com 3.814 views medianas), mediana de 11 caracteres ("thank you", "looks good", "love the clarity and structure here"). O mutirão de 318 respostas num mês não fez o perfil crescer. → `respostas-e-rede.md`
10. **Funil no perfil, não na peça.** Bio com a promessa, link de agenda curta, mensagem direta no lugar da localização, peça fixada com o melhor shot. "3 leads and meeting booked" em menos de 12 horas depois da primeira peça grande. → `respostas-e-rede.md`
11. **Alcance sem seguidor.** Cerca de 6 mil seguidores e mais de 1 milhão de views em 22 dias: o alcance vem da distribuição para quem não segue. Em poucas horas, +54 seguidores para ~17,5 mil views novas na peça principal. → `respostas-e-rede.md`
12. **O viral é reaproveitado.** Autorrepostagem horas depois (mediana de ~17 h), citação da peça viral na peça seguinte, e o vídeo campeão repostado 11 dias depois com legenda nova (mais 18.492 views). Na amostra recente, **22 pares** de peças com as mesmas imagens e outra legenda. → `cadencia.md`

## Janelas (capturas incrementais)

Cada captura de uma referência acompanhada vira um arquivo em `janelas/<id>.md`, com as contagens só <!-- caminho futuro: nasce na primeira captura -->
daquela janela, e uma linha nesta tabela. As regras acima são da base; o que cada janela confirma ou
muda fica na linha dela.

| janela | arquivo | o que confirma | o que muda |
|---|---|---|---|

## Arquivos

| arquivo | o que responde |
|---|---|
| `cadencia.md` | quantas peças por mês, por dia, por hora; intervalo; volume e canibalização; autorrepostagem |
| `legendas.md` | as famílias de legenda, com exemplos, métricas e quando usar |
| `respostas-e-rede.md` | quem responder, com que frequência, o tipo de resposta, reciprocidade, bio e funil |
| `o-que-performa.md` | as 30 peças mais vistas com o motivo, e a tabela do que não funciona |
| `janelas/` | uma página por captura incremental (nasce na primeira captura) |

Como a peça é apresentada visualmente (formato, fundo, sequência, vídeo) está em `../05-apresentacao/`.

## O que ficou incerto

- **Seguidores ao longo do tempo:** só há dois pontos, com poucas horas entre eles. Não dá para medir quanto cada peça trouxe de seguidor.
- **Taxa de resposta a comentários:** a aba de respostas só guarda o comentário quando houve resposta, então "respondeu 242 de 242" é efeito da coleta, não uma taxa.
- **Respostas antigas:** a aba não devolve respostas de mais de seis meses.
- **Hora boa para publicar:** a faixa de 18h a 23h UTC tem índice de views 1,30, mas com 42 peças e três virais dentro; é tendência, não regra.
- **Peças muito novas:** algumas tinham de 2 a 13 horas de vida na leitura; os números delas ainda subiam.
- **Leads e vendas:** o único dado é a frase "3 leads and meeting booked". Não há como medir conversão.
