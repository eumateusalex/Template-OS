# scripts/instagram/: as métricas do Instagram

O leitor de métricas da conta, só leitura, pela Graph API que o
`/instagram-publisher` já usa. Quem o usa é a skill `/instagram` (a saúde da
conta, a auditoria e a leitura).

```bash
node scripts/instagram/insights.mjs --dias 7 --limite 20
node scripts/instagram/insights.mjs --conta <segunda-conta> --dias 30 --json
```

| O que ele lê | De onde |
| --- | --- |
| o perfil: nome, bio inteira, site e foto | `me` |
| a conta no período: views, alcance, contas engajadas, interações, visitas ao perfil, toques no link | `me/insights` |
| cada post: views, alcance, salvos, envios, curtidas, comentários, seguidores, visitas ao perfil; no reel, o tempo médio assistido e a taxa de pulo | `<id>/insights` |

- **A conta segue a regra do publicador**: sem `--conta`, o `scripts/.env`, e a
  conta é a que ele declara em `INSTAGRAM_CONTA`; com `--conta <nome>`, o
  `scripts/.env.<nome>`. Do arquivo só se usam o token, a conta declarada e o
  endereço e a versão da API. Sem credencial, o caminho é o modo conexão do
  `/instagram-publisher`.
- **O acesso à Graph API tem um dono, o `publish.js`**: o leitor usa o
  `baseConferida` (só os hosts da Graph), o `linhaDoEnv`, o `semToken` e o
  padrão da Graph de lá, sem cópia.
- **De quem é o token se confere nas duas pontas**: a conta declarada no arquivo
  e o usuário que a Meta devolve têm que ser a conta pedida, ou nada se grava.
- **Grava** em `dados/insights/<conta>/<AAAA-MM-DD>.json`, fora do git (`--saida`
  troca a pasta). O dia é o do fuso: `--fuso`, senão a variável
  `INSTAGRAM_FUSO`, senão o da máquina.
- **A métrica que a Meta recusa** para um tipo de post sai e o pedido volta uma
  vez só. O `null` numa métrica da conta é a Meta sem o número no período (o
  `follows_and_unfollows` vem assim numa conta sem post). Os nomes das métricas
  são os da Graph API e mudam com a versão dela: se uma métrica some de todo
  post, confira na documentação oficial de insights da Meta.

Os desfechos: 0 leu; 1 a Meta respondeu outro erro; 2 uso errado, conta fora do
formato, fuso inválido ou token de outra conta; 3 o token está vencido ou
invalidado, com o passo a passo da renovação; 4 a conta ainda não foi conectada
(o arquivo de credencial não existe), com o caminho do modo conexão do
`/instagram-publisher`. **O token que sai 3
aqui é o mesmo que o publicador usa**: com ele morto, a conta também não publica
pela API.

A prova é o `insights.test.mjs`: `node --test scripts/instagram/insights.test.mjs`.
