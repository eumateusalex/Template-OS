# Modo leitura · o que a conta respondeu

Lê as métricas da conta depois de postar e diz **o que reforçar, o que cortar e
o que testar na semana seguinte**. A pergunta certa não é "qual teve mais
views", é **"qual trouxe a pessoa certa para perto"** (`marketing.md`,
"Métricas").

## O comando

```bash
node scripts/instagram/insights.mjs --dias 7 --limite 20
node scripts/instagram/insights.mjs --conta <nome> --dias 30 --json
```

Só leitura. Grava em `dados/insights/<conta>/<AAAA-MM-DD>.json` <!-- caminho futuro: nasce na primeira leitura, fora do git --> e imprime
a tabela. **Saída 3 é token vencido ou invalidado**: a leitura para, a entrega
traz o passo a passo que o comando imprimiu e diz que a publicação pela API
também está parada, porque o publicador usa o mesmo token. **Saída 4 é conta não
conectada**: a leitura para e a entrega aponta o modo conexão do
`/instagram-publisher`. Não se lê métrica de cabeça nem de print velho no lugar.

## Como ler, na ordem

1. **O tamanho da amostra primeiro.** Abaixo de umas 100 contas alcançadas por
   post, a porcentagem é ruído. Na conta pequena, compare a contagem e a média
   da própria conta (`acervo/metricas-e-leitura.md`, 7 e 8). O número da Meta
   chega com atraso, e a demografia pede um mínimo de seguidores
   (`acervo/plataforma.md`, 12 e 13, a conferir).
2. **O que trouxe seguidor e envio.** Ordene os posts por seguidores ganhos e por
   envios (`acervo/metricas-e-leitura.md`, 2).
3. **Cada peça contra o objetivo dela**: a tabela "As funções" do `SKILL.md`.
   Peça de prova não se julga pelo alcance.
4. **As faixas de referência, com o rótulo de horizonte**
   (`acervo/metricas-e-leitura.md`, 9): vêm de contas maiores e de outros
   públicos, e nunca são nota.
5. **Seguidor e não seguidor.** O alcance que fica quase todo em quem já segue
   não furou a bolha. O comando dá o alcance; a divisão por tipo de público está
   no app (insights do post, "Público"), e um print dele resolve.
6. **O reel.** O tempo médio assistido contra a duração, e a taxa de pulo: pulo
   alto é gancho; queda no meio é a resposta entregue cedo ou o meio fraco;
   queda no fim é CTA fraco (`marketing.md`, "Métricas"). A curva inteira só
   existe no app.
7. **O placar de autoridade**, além do post (`acervo/metricas-e-leitura.md`,
   6): alguém salvou e mandou adiante, citou, respondeu, chamou para comprar?
   Isso vem da pessoa e das mensagens, não da API.

## O que sai

Na seção "A leitura" do arquivo da semana (`semana.md`, passo 7):

| Campo | O que diz |
| --- | --- |
| o veredito | em uma frase: a semana trouxe a pessoa certa? |
| o que reforçar | a ideia que trouxe seguidor ou envio, e como repeti-la (outro gancho, outro ângulo, outro formato) |
| o que cortar | o que alcançou e não trouxe ninguém |
| a hipótese da semana seguinte | uma variável só, que a próxima leitura confirma ou derruba |
| o que não foi medido | o que só o app ou a pessoa sabem |

**Repetir o que funcionou** segue a `marketing.md` ("Métricas"): a ideia volta,
em outro gancho ou formato. Princípio do acervo que a leitura de quatro semanas
desmente para a conta vai para a pessoa como proposta de mudar a regra, pelo
`/memoria registrar`.
