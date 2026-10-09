# Termo de acesso aos dados · <nome do cliente>

> ⚠️ **Modelo, não texto jurídico.** Passe por um advogado antes de usar com
> um cliente real; revisado uma vez, ele serve aos clientes seguintes. Não é
> texto final nem parecer. Os campos `<…>` se preenchem: os seus uma vez, os do
> cliente a cada cliente.

## 1. As partes e os papéis

- **Controlador:** <razão social do cliente>, CNPJ <…>, que decide para que os dados servem.
- **Operador:** <seu nome ou sua razão social>, <CPF ou CNPJ>, que trata os dados só por instrução do controlador (LGPD, art. 39), para fazer o Diagnóstico e as implementações contratadas.

## 2. A finalidade e a base legal

Os dados servem **só** para: diagnosticar a operação comercial e de marketing
do controlador, priorizar melhorias e implementar o que o controlador escolher.
Nenhum dado é usado para outro cliente, para publicidade do operador, nem
vendido ou cedido.

O controlador declara que tem base legal para tratar os dados que entrega e que
informa aos titulares (os clientes dele) que prestadores de serviço podem
tratá-los em nome dele.

## 3. Os dados e os acessos

| O quê | Como chega | O papel mínimo | Tem dado pessoal? |
|---|---|---|---|
| métricas do site | acesso ao Google Analytics 4 | Leitor | não (agregado) |
| busca orgânica | acesso ao Search Console | usuário restrito | não |
| perfil no Google | acesso ao Perfil da Empresa | só se for mexer; ler não pede acesso | só o público das avaliações |
| redes da Meta | parceiro no Meta Business | parceiro com análise, sem mensagens | não (agregado) |
| anúncios do Google | acesso ao Google Ads | somente leitura | não |
| pedidos e clientes | exportação feita pelo controlador (CRM, planilha), **sem as colunas de contato** quando a análise não usa | não há acesso ao sistema | sim |
| conversas do WhatsApp | exportação feita pelo controlador, de uma amostra com período e quantidade combinados por escrito | não há acesso ao número | sim |
| a entrevista | gravação, com o aviso a quem fala antes de começar | — | sim (a voz) |

**O operador nunca recebe a senha de ninguém.** Cada acesso é registrado com a
data, e revogado na saída. A lista completa, com o que cada papel vê e não vê,
está em `referencias/papel-minimo.md` e vai anexa.

**Dado sensível** (saúde, religião, biometria e os demais do art. 5º, II) e
**dado de criança** não se pedem. Se aparecerem numa amostra, saem antes de
qualquer análise, e o controlador é avisado.

## 4. O uso de inteligência artificial

O operador usa <a ferramenta de IA e o provedor, por exemplo o Claude, da
Anthropic> para analisar o material. **Antes de qualquer conversa ou lista de
clientes ir à IA, nomes, telefones, e-mails e documentos de pessoas são
trocados por marcadores, pelo cliente antes da entrega ou pelo operador no
próprio computador, fora da IA**
(minimização, LGPD art. 6º, III). O material cru não é aberto na IA.

<O tipo de conta e o que os termos do provedor dizem na data deste termo,
conferidos nos termos vigentes, nunca de memória: se é assinatura de
consumidor ou conta comercial, se o uso das conversas para treinar modelos está
desligado, e por quanto tempo o provedor guarda o conteúdo.> O operador não
envia conversa de trabalho do cliente como avaliação ou relato de erro ao
provedor.

## 5. Onde os dados ficam

- no computador do operador, numa pasta do cliente que não vai para nenhum repositório;
- <se essa pasta sincroniza com um serviço de nuvem (OneDrive, Google Drive, Dropbox), ele é suboperador e se nomeia aqui, com o que guarda; se não sincroniza, diga>;
- a ferramenta de IA guarda no computador o registro das sessões de trabalho, apagado sozinho em <prazo> (no Claude Code, a configuração `cleanupPeriodDays`; confira o valor que a sua instalação usa);
- a gravação da entrevista se transcreve no próprio computador, sem sair dele.

## 6. Retenção e eliminação

Os dados se apagam **90 dias depois do fim do contrato** (ou da onda, se não
houver renovação), em todas as cópias (o computador, a lixeira dele e a
lixeira do serviço de nuvem, se houver), com comprovante por e-mail ao
controlador: a data, a lista dos arquivos apagados e de onde. Antes disso, se o
controlador pedir.

## 7. Incidente

Se houver incidente com os dados (acesso indevido, perda ou roubo do
computador, material cru enviado à IA por engano), o operador avisa o
controlador em até 48 horas, dizendo o que aconteceu, o que foi afetado e o
que foi feito, para o controlador cumprir os prazos dele com a ANPD e os
titulares.

## 8. O pedido do titular

Se um titular pedir ao operador acesso, correção ou exclusão dos próprios
dados, o operador encaminha o pedido ao controlador em até 2 dias úteis e
cumpre o que o controlador instruir.

## 9. O caso de sucesso

O operador só usa o trabalho como caso público **se o resultado foi medido**
contra a linha de base e **se o controlador aprovar o texto** por escrito. Sem
os dois, nada se publica, nem de forma anônima.

## 10. Revogação

O controlador revoga qualquer acesso a qualquer hora, direto na ferramenta; o
operador registra a data e para de usar o que dependia dele.

Assinaturas: <controlador> · <operador> · <data>
