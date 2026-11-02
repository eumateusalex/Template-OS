# O método: a prospecção à mão, de qualquer operação

O que vale para toda operação que aborda um a um, à mão, quem ainda não te
conhece: pelo WhatsApp, pelo direct, por e-mail, por ligação ou na porta. O que
é de cada operação (a oferta de entrada, a voz, as mensagens, as levas) mora na
pasta dela, `saidas/prospeccao-<operacao>/` <!-- caminho futuro: nasce no modo operação -->,
com o `MANUAL.md` de manual. Quem monta a pasta é o `operacao.md`.

## O que a operação precisa ter antes do primeiro envio

| Peça | Para quê | Onde mora na pasta da operação |
|---|---|---|
| o manual | a oferta de entrada, a voz, o canal, o teto, a frase do "quanto custa", as mensagens-base | `MANUAL.md` |
| a lista de quem não quer | a trava que tira o contato de toda leva | `nao-contatar.md` |
| a calibragem aprovada | a leitura do nicho antes de qualquer mensagem | `calibragem-<vertical>-<data>/CALIBRAGEM.md`, pelo agente `estrategista` |
| a leva | as fichas com o sinal e o contato, e o `LEIA.md` | `leva-<n>-<nome>/` |
| o registro do envio | o que saiu, o que não abriu, quem respondeu | o `envios.csv` de cada leva |
| o banco de objeções | a resposta que se manda, uma por objeção | `objecoes.md` |
| o mapa de situações | a classe de cada resposta, com a ação | `mapa-de-situacoes.md` |

Os moldes de todas estão em `.claude/skills/prospeccao/modelos/`. **Operação sem
essas peças não envia.**

**A régua de máquina** é o `node scripts/prospeccao/conferir.mjs <pasta da operação>`:
ela reprova a linha quebrada do `envios.csv`, o contato da lista de quem não quer
que volta numa ficha, numa folha ou num envio novo, a palavra que este método
proíbe numa mensagem e o valor fora da frase de faixa, e lista as voltas e os
`quando` do dia. Ela não julga a voz: a abertura nova é rascunho que você lê e
aprova antes de sair.

**Quem pediu para parar a uma operação não recebe de nenhuma.** Quem fala é você
em todas, e o contato já recebeu de você. A régua lê a lista de quem não quer de
toda pasta `saidas/prospeccao-*` com manual, e o mesmo contato não entra em duas
operações sem você decidir.

**Todo texto que vai ao dono fica em bloco de citação** (`>`), na ficha, na folha
do dia, no banco e no mapa. É o que a régua lê como mensagem, e é o que separa o
que sai do que é instrução.

## As regras que não se dobram

**O que nunca se diz ao dono.** A régua barra as palavras entre crases; o resto
de cada regra é leitura, e verde na régua não dispensa ler.

1. Case, depoimento, "nosso cliente" que não existe. A régua barra: `case`,
   `cases`, `depoimento`, `depoimentos`, `nosso cliente`, `nossos clientes`.
2. Garantia que você não dá de fato, e promessa de resultado que não depende só
   de você (posição em busca ou em rede, clientes novos, venda). A régua barra:
   `primeiro lugar no google`, `primeira página do google`. Sem a garantia
   declarada no manual, barra também: `garantia`, `garantido`, `garantimos`,
   `garanto`. Quem dá garantia de fato (o prazo do serviço, a troca da peça, o
   refazer sem custo) a escreve na linha "A garantia que se dá de fato" do manual
   da operação, com o prazo e o que ela cobre, e aí a palavra passa: a mensagem
   diz a garantia como ela é, e nunca a estica para resultado.
3. Preço, desconto e valor antes da conversa, salvo a frase de faixa que a
   operação decidiu para o "quanto custa" (no manual). A régua barra todo valor
   em reais fora dessa frase, e também: `desconto`, `promoção`.
4. Concorrente, e outro fornecedor ou prestador pelo nome. A régua barra:
   `concorrente`, `concorrentes`.
5. Dado de registro ou cadastro público que o dono não mostrou, usado como
   argumento (a situação na Receita ou na Junta, o protesto, o processo, a
   dívida, o vencimento de um registro): soa como vigilância, e há registro cujo
   aviso proíbe uso publicitário. Diga só o que o cliente dele vê. O caso de quem
   vende site é o registro do domínio ("venceu", "está livre"). A régua barra,
   por ele: `registro.br`, `domínio venceu`, `domínio vencido`,
   `domínio está livre`, `domínio expirou`. O registro do seu ramo entra no
   manual, em "O que esta operação não diz".
6. Conselho de classe como argumento. A régua barra: `OAB`, `CFP`, `COFFITO`,
   `CFMV`, `CFM`, `CFBM`, `CRBM`, `COFEN`, `COREN`, `conselho regional`,
   `conselho federal`. CFO, CFC e CRM valem igual, mas a régua não os cobra por
   máquina (são também sigla de cargo e de software): a leitura cobra.
7. "Negócio local": use a palavra do dono (consultório, escritório, oficina,
   loja). A régua barra: `negócio local`, `negócios locais`.
8. Frase que revela que a mensagem saiu de máquina. A régua barra: `robô`,
   `robôs`, `bot`, `mensagem automática`, `envio automático`,
   `disparo em massa`.
9. Prova inventada: o que se mediu se diz como medição; ninguém foi atendido
   antes de ser.
10. Resposta que adia a venda. Toda resposta resume o que o dono disse, liga ao
    que a oferta resolve e termina no próximo passo, com dia. A saída só vem
    quando ele diz que não quer. A régua barra: `sem pressa`,
    `quando contratar`, `é só chamar`, `fico no aguardo`,
    `qualquer coisa me chama`, `quando precisar me chama`,
    `quando quiser me chama`.
11. A oferta de entrada como brinde: ela se apresenta pelo nome e pelo que faz;
    "é de graça?" se responde quando o dono pergunta.
12. Pressa inventada (vaga que acaba, agenda que lota, prazo que não existe). A
    régua barra: `últimas vagas`, `só hoje`, `só até hoje`, `vagas limitadas`,
    `por tempo limitado`.

A operação soma as palavras dela no manual, na seção "O que esta operação não
diz", e a régua cobra as duas listas.

**Dado que envelhece se confere no dia.** A data de um post, o número de
avaliações, a placa na fachada e o que a tela mostra saem do que se viu no dia
do envio, nunca do levantamento.

**LGPD:** dizer quem fala e de onde veio o contato, guardar só o necessário, e
parar na hora quando pedem. A pasta da operação guarda contato de terceiro, e
por isso fica fora do Git.

**Quem pede para parar** ("para", "não quero", irritação) recebe uma frase, e
mais nada. A de partida, que o manual pode trocar pela dele:

> Entendido, paro por aqui. Obrigado pela resposta e boa semana.

O contato entra no `nao-contatar.md` no mesmo dia, com a data, a leva e a ficha,
o negócio, o contato (o número com 55 e DDD, só dígitos; o e-mail; o perfil com
@) e o que ele disse, e não volta em leva nenhuma.

## O canal

O método é o mesmo em todo canal um a um: a abertura diz quem fala e de onde veio
o contato, mostra um sinal e pede licença; a lista de quem não quer vale em
todos; uma variável por vez. Muda o que derruba a conta e o que conta como "não
abriu".

### WhatsApp, o caso detalhado

1. A regra escrita do WhatsApp proíbe mensagem não pedida, mesmo escrita à mão.
   O envio frio é decisão sua, com esse risco aceito.
2. O que derruba número é denúncia e bloqueio de quem recebe: a abertura diz quem
   fala e de onde veio o número, e a conversa para na hora quando pedem.
3. Não há número oficial de mensagens seguras por dia. O teto é escolha, e mora
   no manual.
4. Nada de rodízio de número para fugir de limite, nem conta nova depois de
   banimento: os termos tratam isso como violação.
5. O seu número pessoal nunca prospecta. O que envia é o da operação.

"Não está no WhatsApp" é **não abre**: anote e tente o próximo contato da ficha.
Não há jeito oficial de saber se um número tem WhatsApp sem abrir a conversa, e
verificador de terceiro consulta por fora dos termos.

### Direct de rede social

Quem não te segue recebe a mensagem como pedido, e às vezes nunca a vê: perfil
vazio parece golpe, então o perfil que envia tem conteúdo antes. O teto vale
igual, e muitos pedidos sem resposta num dia travam a conta. "Não abre" é perfil
que não aceita mensagem.

### E-mail

O e-mail frio para empresa segue a mesma regra de dizer quem fala e de onde veio o
contato, e tem uma frase de saída no fim ("se não fizer sentido, me responda
'não' e eu paro"). O que derruba o domínio é marcação de spam: envie de uma
caixa com o seu nome, poucas por dia, sem anexo e sem link encurtado na
abertura. "Não abre" é o e-mail que volta.

### Ligação e porta

Ligação só para quem respondeu, nunca para estranho. A visita presencial é a
conversa mais forte que existe, e se anota igual: uma linha por tentativa.

## Os canais, lado a lado

A operação pode usar mais de um ao mesmo tempo, e o manual diz quais estão em uso.
O primeiro cliente costuma vir da rede quente.

| Canal | A favor | Contra |
|---|---|---|
| WhatsApp frio | o dono lê; o sinal é conferível na hora | contraria a regra escrita; risco de denúncia |
| Rede quente | sem risco de bloqueio; confiança emprestada | depende da sua lista; não escala sozinha |
| Direct | não arrisca o WhatsApp | quem não segue pode nunca ver; pede perfil com conteúdo |
| E-mail | chega a quem decide em empresa maior; registro escrito | caixa cheia; spam derruba o domínio |
| Grupos e associações | proximidade gera confiança | pede um trabalho para mostrar |
| Parceiro que indica | um parceiro fala com dezenas de donos | só anda com oferta boa para quem indica |
| Presencial | a conversa mais forte que existe | só onde você estiver |
| Conteúdo e perfil | tira a cara de golpe; nutre quem chega | demora a atrair |
| Anúncio | escala | custa e pede oferta testada |

Ticket baixo pago uma vez não sustenta abordagem fria sozinho: o que sustenta é o
que vem depois. Por isso a medição vai até a proposta.

## O sinal, no seu ramo

**O sinal é do ramo de quem usa a skill, não de um ramo fixo.** É o fato que se
vê de fora, hoje, sem falar com o negócio, que mostra que ele precisa do que você
vende, e que o dono confere sozinho em segundos. Ele vem de dois jeitos:

- **o sinal de problema**: algo que está quebrado e a sua oferta conserta. A
  abertura diz o que o cliente dele vê, nunca o que o dono fez de errado;
- **o sinal de encaixe**: algo que mostra que ele usa o que você vende, sem nada
  quebrado (a frota rodando, a obra começando, a loja que abriu agora). Ele abre
  a conversa sem apontar defeito, e é o mais comum fora do serviço digital.

Para achar o do seu ramo, quatro perguntas: o que o seu cliente ideal tem, ou
faz, que se vê da rua, do mapa, da rede ou do site? O que muda nele quando passa
a precisar de você (cresceu, abriu, quebrou, venceu, trocou de fornecedor)? Onde
isso aparece de fora, e em que dia ou horário? O dono reconhece isso em segundos,
sem explicação? A calibragem (o campo 6) fecha a lista do nicho, e a ficha leva
o de cada negócio.

| Quem vende | O sinal | Onde se vê |
|---|---|---|
| Oficina mecânica, para frotas de empresas pequenas | o carro ou o utilitário com o adesivo da empresa rodando no bairro; a frota parada no pátio | a rua, o pátio, a fachada |
| Manutenção ou limpeza, para condomínios | a fachada manchada, o portão com aviso de defeito, a obra parada na entrada | a rua, a portaria |
| Doce ou salgado, para cafés e restaurantes | a vitrine sem doce no meio da tarde; o cardápio que marca "acabou" no item da casa | a vitrine, o cardápio, o perfil |
| Serviço digital (site, anúncio, rede) | o site que não abre no celular; o horário do mapa que diz fechado num sábado em que a loja abre | o site, o mapa, o perfil |

**Não é sinal**: o que você só saberia perguntando, pagando ou fingindo ser
cliente, e o registro público que o dono não mostrou (a regra 5).

## Antes de enviar

- **O contato se confere no envio.** Abre-se o primeiro contato da ordem da
  ficha; o que não abre se anota e se tenta o seguinte. Ficha sem nenhum que
  abre sai da leva e volta em 90 dias, ou por outro canal.
- **Contato que só aparece no resto da ficha não se tenta**: a bio de um perfil
  achado pela busca pode ser de outro negócio. Só o que está no campo
  `**Contato:**` da ficha vai para a folha.
- **O teto é por número ou conta, por dia, de conversas novas**, e o ritmo é
  todo dia, nunca o dobro num dia e nada na semana. A volta não conta no teto.
- **O sinal sumiu** (o defeito foi consertado, a situação que motivava a
  mensagem mudou, o site voltou): não envie.
- **O sinal é o que se vê de fora, sem falar com o negócio.** Mandar mensagem
  fingindo ser cliente para medir o atendimento não é prospecção: só depois do
  sim e com o aval do dono.
- **Não faça trabalho de graça antes do sim** (o serviço feito, a peça montada,
  o orçamento detalhado, o projeto desenhado): o sinal mostra o problema; a
  solução é o que se vende.
- **A oferta de entrada e o que a abertura pede são da operação**, no manual.

## A sequência de toques

| Quando | O quê |
|---|---|
| Dia 0 | a abertura, em mensagens curtas e separadas |
| Ele responde | a resposta certa, do banco ou da ficha, no mesmo dia |
| Dia 7 | a primeira volta, com sinal novo |
| Dia 21 | a segunda volta, a última, a pelo menos 7 dias da primeira |
| Depois | rever em 90 dias |

Para quem mostrou interesse e sumiu, as duas voltas são o mínimo. A régua calcula
as datas pela data real do envio, no `envios.csv`.

## O teste e a medição

Uma variável por vez, as duas formas alternadas pela ordem da folha, e o funil
contado até a proposta (abordado, abriu, respondeu, pediu a oferta de entrada,
conversa feita, proposta, fechou, perdido com o motivo). O que saiu antes do
teste fica fora da comparação, com o nome da forma que era. **Amostra pequena não
decide**: com menos de 20 envios por forma ou menos de 7 dias, a leitura é
"cedo", e se diz assim.

## Quando algo dá errado

| O que acontece | O que fazer |
|---|---|
| Aviso do canal de que a conta pode ser restrita | aquele número ou conta para de abrir conversa por 7 dias; os outros seguem no teto |
| Conta restrita | só responder quem já conversa; anotar a data em `aviso_do_canal` |
| Banimento | pedir análise uma vez; sem o botão, a conta acabou, e não se abre outra para fugir |
| Mais de uma denúncia ou marcação de spam na semana | teto pela metade em todos os números e contas, e reler a abertura |
| Dono irritado | a frase de saída, e a lista de quem não quer |
| Pergunta fora do que a operação faz | dizer que não é o que ela faz; oferecer a oferta de entrada só se fizer sentido |

**A parada total**, por qualquer motivo, é mais simples que começar: para a
abertura nova, a volta e a rede quente em todos os números e contas no mesmo
minuto (quem já escreveu continua sendo respondido à mão); uma linha no fim do
manual diz a data, a hora, o motivo e quem parou; volta só por decisão sua, com o
teto pela metade na primeira semana.

## Do sim em diante

A venda na conversa, etapa por etapa, é o `conversa.md`. O passo depois do sim (a
conversa marcada, a visita, o orçamento, a proposta) é o da jornada comercial do
`_memoria/oferta.md`.
