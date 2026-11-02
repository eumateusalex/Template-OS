# Mapa de situações

Cada resposta do dono cai numa situação, de S01 a S36, com o que fazer, o que se
anota no `envios.csv` e, quando a conversa se perde, o motivo (M01 a M16). As
classes e as ações são do método e valem para qualquer operação; **as mensagens
são suas**: escreva cada uma em citação (`>`) embaixo da situação, na voz do
manual, e passe a pasta na régua. A resposta escrita na própria ficha vale
primeiro; o que a ficha não cobre sai daqui ou do `objecoes.md`.

A régua (`scripts/prospeccao/conferir.mjs`) lê este arquivo: só aceita no
`envios.csv` a `situacao`, o `motivo_perda` e o `tipo_resposta` que existem aqui.
Situação nova entra com o próximo número livre e o mesmo formato.

## Como ler a resposta, nesta ordem

1. Pediu para parar, xingou ou ameaçou denunciar? S35 ou S36. Para na hora.
2. Disse não, sem irritação? S34.
3. Aceitou ver o que a abertura ofereceu? S11. Pediu a ligação ou a oferta de
   entrada por conta própria? S20 ou S31.
4. Fez uma pergunta? S08 a S10, S12, S16 a S21.
5. Resistiu com uma razão? S13 a S15 (o sinal) e S22 a S30 (a decisão). Sem razão
   e sem palavra útil: S01 a S07.

Classifique pelo trecho que ele escreveu, nunca pelo tom: educação não é
interesse. O áudio se ouve inteiro e se classifica pelo conteúdo.

## As situações

### S01 · Silêncio

- **Como reconhecer:** sem resposta 7 dias depois da abertura. Mensagem lida não prova nada.
- **O que fazer:** a volta da ficha, com sinal novo, na data que a régua lista; nunca "conseguiu ver?". A segunda volta é a última.
- **Anote:** `situacao=S01`, `resposta=silencio`; depois da segunda volta sem resposta, `motivo_perda=M01`.

### S02 · Resposta curta e vaga

- **Como reconhecer:** emoji, figurinha, "ok", "obrigado", sem pergunta e sem pedido.
- **O que fazer:** agradecer e repetir o pedido da abertura numa pergunta de sim ou não.
- **Anote:** `situacao=S02`, `tipo_resposta=ambiguo`, `resposta=sim`.

### S03 · Dúvida de uma palavra

- **Como reconhecer:** "?", "como assim?", "do que se trata?".
- **O que fazer:** quem fala e o sinal em uma frase, e o pedido de novo, sem texto novo.
- **Anote:** `situacao=S03`, `tipo_resposta=ambiguo`, `resposta=sim`.

### S04 · Resposta automática

- **Como reconhecer:** saudação de menu, horário de atendimento, igual e na hora.
- **O que fazer:** dizer que não é cliente, quem fala, e perguntar com quem falar sobre o sinal, sem fingir ser cliente.
- **Anote:** `situacao=S04`, `resposta=silencio`: não conta como resposta no funil, e as voltas seguem.

### S05 · Quem respondeu não decide

- **Como reconhecer:** "vou passar pro dono", "sou funcionária", "não sou eu que cuido disso".
- **O que fazer:** agradecer, perguntar o melhor jeito de falar com quem decide, e oferecer o sinal para ela repassar.
- **Anote:** `situacao=S05`, `tipo_resposta=indicacao`, `resposta=sim`.

### S06 · Áudio

- **Como reconhecer:** mensagem de voz, sem texto.
- **O que fazer:** ouvir até o fim, classificar pelo conteúdo e devolver em texto o que entendeu.
- **Anote:** a situação do conteúdo; no `obs`, "áudio".

### S07 · Contato errado ou negócio fechado

- **Como reconhecer:** "aqui não é mais", "fechamos", "mudou o dono", "número errado".
- **O que fazer:** sair com educação; pedir o contato certo só se ele existir.
- **Anote:** `situacao=S07`, `tipo_resposta=nao`, `motivo_perda=M13`.

### S08 · Quem é você

- **Como reconhecer:** pergunta de identidade e de origem do contato, em tom seco.
- **O que fazer:** quem fala, de onde veio o contato (a frase de origem do manual) e voltar ao pedido. A credencial é só a do `_memoria/prova.md`.
- **Anote:** `situacao=S08`, `tipo_resposta=objecao`; se perder, `motivo_perda=M08`.

### S09 · Golpe ou máquina

- **Como reconhecer:** desconfiança dita: "é golpe?", "é mensagem automática?".
- **O que fazer:** mostrar que dá para conferir sozinho (o sinal está aberto para qualquer um) e que você não pede senha, código nem pagamento; à pergunta da máquina, negar e provar que olhou, citando o que só quem olhou sabe.
- **Anote:** `situacao=S09`, `tipo_resposta=objecao`; se perder, `motivo_perda=M08`.

### S10 · De qual empresa, de onde

- **Como reconhecer:** confunde com uma empresa grande ou com a plataforma, ou quer saber a cidade.
- **O que fazer:** nunca se passar por outra empresa; dizer de onde você atende e como.
- **Anote:** `situacao=S10`, `tipo_resposta=objecao`.

### S11 · Pode mandar

- **Como reconhecer:** aceite dito: "pode", "manda", "quero ver", "como é?".
- **O que fazer:** entregar o que a abertura ofereceu em minutos, e seguir até a oferta e o pedido, pelo manual.
- **Anote:** `situacao=S11`, `tipo_resposta=interessado-agora`, `resposta=sim`.

### S12 · Como funciona

- **Como reconhecer:** pede explicação do serviço.
- **O que fazer:** explicar em uma frase, agora que ele perguntou, e pedir licença para a oferta.
- **Anote:** `situacao=S12`, `tipo_resposta=objecao`.

### S13 · Nega o sinal

- **Como reconhecer:** "aqui está tudo certo", "comigo funciona", "não tem nada errado".
- **O que fazer:** perguntar como ele vê e conferir na hora: se o sinal continua, mostrar o de hoje; se sumiu, sair com educação e corrigir a ficha.
- **Anote:** `situacao=S13`, `tipo_resposta=objecao`; se perder, `motivo_perda=M15`.

### S14 · Confirma e diminui

- **Como reconhecer:** "eu sei, não uso mais isso".
- **O que fazer:** mostrar que o cliente ainda chega até lá, pelo caminho que ele não usa mais.
- **Anote:** `situacao=S14`, `tipo_resposta=objecao`.

### S15 · Já consertou

- **Como reconhecer:** diz que resolveu depois da abertura.
- **O que fazer:** conferir antes de responder; se resolveu, reconhecer e mostrar o que mais dá para melhorar.
- **Anote:** `situacao=S15`, `tipo_resposta=objecao`; se perder, `motivo_perda=M14`.

### S16 · Pergunta técnica

- **Como reconhecer:** pergunta de como se faz, de quem fica dono do quê, do resultado que se pode esperar.
- **O que fazer:** responder só o que é verdade e decidido, nunca prometer resultado, e levar à oferta.
- **Anote:** `situacao=S16`, `tipo_resposta=objecao`.

### S17 · Quanto custa

- **Como reconhecer:** pergunta de valor, antes ou depois do sinal, ou o que se pergunta na hora de fechar (como pagar, contrato, mensalidade).
- **O que fazer:** o valor antes do preço; só a frase de faixa do manual, sem esconder e sem desconto; e uma pergunta do que ele precisa resolver.
- **Anote:** `situacao=S17`, `tipo_resposta=objecao`; se perder, `motivo_perda=M07`.

### S18 · Pede prazo

- **Como reconhecer:** "em quanto tempo fica pronto?", "demora?".
- **O que fazer:** o prazo decidido no manual, e o pedido.
- **Anote:** `situacao=S18`, `tipo_resposta=objecao`.

### S19 · Já fez pra quem

- **Como reconhecer:** "tem exemplo?", "tem portfólio?", "quem já contratou?".
- **O que fazer:** responder pela prova que existe (`_memoria/prova.md`), sem inventar cliente, e sem perder o passo.
- **Anote:** `situacao=S19`, `tipo_resposta=objecao`.

### S20 · Quer falar por ligação

- **Como reconhecer:** "me liga", "pode ligar?", "prefiro falar".
- **O que fazer:** marcar já, com dois horários; ligar porque ele pediu.
- **Anote:** `situacao=S20`, `tipo_resposta=interessado-agora`, `conversa_marcada=sim` quando marcar.

### S21 · Manda por e-mail ou manda proposta

- **Como reconhecer:** pede material em vez de conversa.
- **O que fazer:** pedir o arquivo costuma ser um jeito educado de encerrar: mande ali mesmo o que a abertura prometeu, sem proposta, e já combine o dia de perguntar o que achou.
- **Anote:** `situacao=S21`, `tipo_resposta=ambiguo`, `quando` no dia combinado.

### S22 · Já tenho quem faça

- **Como reconhecer:** fornecedor atual, ou "todo dia alguém me oferece isso".
- **O que fazer:** descobrir o que essa pessoa cuida e somar a ela, sem falar do outro.
- **Anote:** `situacao=S22`, `tipo_resposta=objecao`; se perder, `motivo_perda=M03`.

### S23 · Alguém de casa cuida

- **Como reconhecer:** ajuda informal: sobrinho, filho, amigo.
- **O que fazer:** não desautorizar quem ajuda, e dar um passo que ele repassa.
- **Anote:** `situacao=S23`, `tipo_resposta=objecao`; se perder, `motivo_perda=M04`.

### S24 · Não vê necessidade

- **Como reconhecer:** "meu cliente vem todo de indicação", "não preciso disso".
- **O que fazer:** reconhecer o canal que funciona e abrir a outra porta: o cliente que ainda não o conhece.
- **Anote:** `situacao=S24`, `tipo_resposta=objecao`; se perder, `motivo_perda=M05`.

### S25 · Lotado

- **Como reconhecer:** "estamos lotados", "se vender mais, não dou conta".
- **O que fazer:** aceitar a verdade e mostrar o que a oferta tira das costas dele, sem vender volume.
- **Anote:** `situacao=S25`, `tipo_resposta=objecao`; se perder, `motivo_perda=M06`.

### S26 · Sem tempo

- **Como reconhecer:** rotina cheia, pedido de adiar.
- **O que fazer:** tirar o trabalho dele e propor dois horários; depois de uma tentativa, não fabricar prioridade.
- **Anote:** `situacao=S26`, `tipo_resposta=objecao`; se perder, `motivo_perda=M06`.

### S27 · Vou pensar

- **Como reconhecer:** adiamento sem data, ou "depois do fim do ano".
- **O que fazer:** perguntar o que pesa (o valor, o momento ou uma dúvida) e combinar dia e hora; na volta, o pedido.
- **Anote:** `situacao=S27`, `tipo_resposta=interessado-depois`, `quando` no dia combinado; se perder, `motivo_perda=M11`.

### S28 · Decide com outra pessoa

- **Como reconhecer:** "vou falar com meu sócio", "com minha esposa".
- **O que fazer:** uma de três saídas: ajudar a explicar (o resumo para repassar), conversar com os dois, ou marcar a volta antes de sair da conversa.
- **Anote:** `situacao=S28`, `tipo_resposta=interessado-depois`, `quando`; se perder, `motivo_perda=M10`.

### S29 · Já tentei e não deu certo

- **Como reconhecer:** pagou alguém antes e ficou o prejuízo.
- **O que fazer:** perguntar o que não deu certo daquela vez, e não repetir.
- **Anote:** `situacao=S29`, `tipo_resposta=objecao`; se perder, `motivo_perda=M09`.

### S30 · Tá caro ou sem dinheiro

- **Como reconhecer:** caixa apertado, comparação com algo mais barato, ou jeito de encerrar.
- **O que fazer:** perguntar se é o caixa de agora ou se o valor não ficou claro, sem desconto, e voltar ao pedido.
- **Anote:** `situacao=S30`, `tipo_resposta=objecao`; se perder, `motivo_perda=M07`.

### S31 · Pediu a oferta de entrada

- **Como reconhecer:** pede por conta própria o que a operação oferece de entrada ("dá pra fazer uma análise?").
- **O que fazer:** fazer o que ele pediu: explicar como funciona, pedir o ok e marcar.
- **Anote:** `situacao=S31`, `tipo_resposta=interessado-agora`, `pediu_oferta_de_entrada=sim`.

### S32 · Qual a pegadinha

- **Como reconhecer:** desconfia do que é de graça ou barato demais.
- **O que fazer:** responder direto o que ele perguntou, sem usar o grátis como isca.
- **Anote:** `situacao=S32`, `tipo_resposta=interessado-agora`.

### S33 · Sumiu depois de pedir, ou faltou

- **Como reconhecer:** pediu a conversa e não respondeu, ou não apareceu.
- **O que fazer:** um lembrete sem cobrança, com dois horários.
- **Anote:** `situacao=S33`, `tipo_resposta=interessado-depois`, `quando`; se perder, `motivo_perda=M12`.

### S34 · Não tenho interesse

- **Como reconhecer:** recusa firme, sem irritação. "No momento não" não é isto: é S26 ou S27.
- **O que fazer:** sair na hora, em uma frase.
- **Anote:** `situacao=S34`, `tipo_resposta=nao`, `resposta=nao`, `motivo_perda=M02`, `quando=encerrada`.

### S35 · Pediu para parar

- **Como reconhecer:** "para de mandar", "me tira da lista".
- **O que fazer:** a frase de saída, e a linha no `nao-contatar.md` no mesmo dia.
- **Anote:** `situacao=S35`, `tipo_resposta=descadastro`, `pediu_parar=sim`, `quando=encerrada` depois que a frase saiu.

### S36 · Irritação ou ameaça de denúncia

- **Como reconhecer:** "não pedi nada", palavrão, "vou denunciar".
- **O que fazer:** a mesma saída, sem discutir nem se explicar; olhar se o número ou a conta recebeu aviso do canal.
- **Anote:** `situacao=S36`, `tipo_resposta=irritado`, `pediu_parar=sim`, `quando=encerrada`.

## Os tipos de resposta

- `ambiguo`: respondeu sem dizer o que quer.
- `indicacao`: quem respondeu não decide e aponta outra pessoa.
- `objecao`: pergunta ou resistência com razão.
- `interessado-agora`: aceitou o próximo passo.
- `interessado-depois`: aceitou, mas para outro dia.
- `nao`: recusou sem irritação.
- `descadastro`: pediu para parar, sem irritação.
- `irritado`: pediu para parar com reclamação; é o que vira denúncia.

## Os status do funil

- **enviado:** a linha existe no `envios.csv`.
- **abriu:** o contato existe no canal (não é "leu"): `abriu=sim`.
- **respondeu:** resposta de uma pessoa (a automática não conta): `resposta=sim` ou `nao`.
- **pediu a oferta de entrada:** `pediu_oferta_de_entrada=sim`.
- **conversa marcada e feita:** `conversa_marcada=sim`, `conversa_feita=sim`.
- **proposta:** recebeu a proposta com o preço: `proposta=sim`.
- **fechou:** pagou a entrada: `fechou=sim`, nunca por conversa.
- **pausado:** combinou retorno: `tipo_resposta=interessado-depois` e `quando`.
- **sem resposta:** as duas voltas sem resposta: `resposta=silencio` e `volta_2`.
- **perdido:** disse não ou sumiu depois de conversar: `motivo_perda`.
- **parar:** pediu para parar; nunca volta: `pediu_parar=sim` e a linha no `nao-contatar.md`.

## Os motivos de perda

- `M01` · silencio-fim-da-sequencia: a segunda volta sem resposta.
- `M02` · nao-tem-interesse: "não tenho interesse", sem razão.
- `M03` · ja-tem-quem-faca: fornecedor atual, profissional ou empresa.
- `M04` · ajuda-informal: alguém de casa cuida.
- `M05` · nao-ve-necessidade: o cliente vem por outro canal.
- `M06` · sem-tempo-ou-lotado: rotina cheia ou equipe no limite.
- `M07` · sem-dinheiro-ou-preco: "tá caro", "sem caixa agora".
- `M08` · desconfianca: golpe, máquina ou "não te conheço" que não passou.
- `M09` · ja-tentou-e-nao-deu-certo: pagou antes e se queimou.
- `M10` · nao-decide-sozinho: sócio, família ou matriz; dá para voltar.
- `M11` · adiou-sem-data: "vou ver" e dois toques sem resposta.
- `M12` · faltou-a-conversa: não apareceu duas vezes.
- `M13` · fora-do-perfil: contato errado, negócio fechado ou fora do recorte.
- `M14` · resolveu-sozinho: consertou o sinal sem contratar.
- `M15` · sinal-nao-confere: o sinal não existia; erro de medição, que se corrige na ficha.
- `M16` · contratou-outro: levou a ideia a outra pessoa.
