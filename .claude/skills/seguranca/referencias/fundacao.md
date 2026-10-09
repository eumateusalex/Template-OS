# Fundação — o que vale em qualquer contexto

> Lido quando o caso não está previsto no catálogo, quando é preciso justificar
> um requisito, ou quando alguém pergunta *por quê*. Os requisitos derivam
> destes princípios: quem entende esta página resolve o caso que o catálogo
> não previu.

---

## 1 · As cinco propriedades

Segurança não é só impedir que vejam. São cinco propriedades, e a maioria do
material de mercado cobre bem apenas a primeira.

| Propriedade | A pergunta | Famílias responsáveis |
|---|---|---|
| **Confidencialidade** | Quem consegue **ver** o que não devia? | `DAT` `ACC` `OUT` `SEC` `CRY` |
| **Integridade** | Quem consegue **alterar** o que não devia? | `INT` `VAL` `BIZ` `SUP` |
| **Disponibilidade** | Quem consegue **derrubar** ou **encarecer**? | `RES` `NET` `BCP` |
| **Autenticidade** | Isso é mesmo de quem diz ser? | `IDN` `SES` `CRY` |
| **Não-repúdio** | Dá para provar quem fez? | `LOG` |

**A régua de completude interna:** toda propriedade tem família própria, e toda
família protege pelo menos uma propriedade. Família nova só nasce quando essa
régua, ou as âncoras normativas, apontam lacuna. Nunca por intuição de leitura.

> **Por que disponibilidade importa mesmo em sistema pequeno:** operação cara
> sem teto é risco financeiro direto. Consumir crédito de serviço pago não
> precisa derrubar nada para doer, e um laço no próprio código produz o mesmo
> efeito sem atacante nenhum.

---

## 2 · Os dez princípios

Quando houver dúvida sobre um caso não previsto, a resposta se deduz daqui.

| # | Princípio | O que ele justifica |
|---|---|---|
| **1** | **Confiança zero** — nenhuma operação é confiável por origem | Validação no lado que se controla · verificar permissão a cada operação sensível · desconfiar até da resposta que o próprio servidor mandou |
| **2** | **Defesa em profundidade** — nenhum controle sozinho segura | **Por que ter política no banco mesmo tendo autorização na aplicação.** Sem esse princípio nomeado, o segundo controle parece redundância e alguém corta |
| **3** | **Menor privilégio** — o mínimo, pelo menor tempo | Conta de banco sem privilégio de estrutura · credencial com escopo estreito · cota de agente · papel administrativo só quando preciso |
| **4** | **Falha segura, seguro por padrão** — quando quebra, fecha | Rota nova nasce protegida · política nega antes de liberar · esquema estrito derruba campo desconhecido · recurso alheio responde como inexistente |
| **5** | **Separação de responsabilidades** — ninguém fecha o ciclo sozinho | Quem propõe não aprova · conta de migração separada da aplicação · aprovação humana antes de ação irreversível |
| **6** | **Superfície mínima** — o que não existe não é atacável | Resposta só com o campo necessário · não guardar dado que não se usa · desligar o que não se opera. **É também o princípio que sustenta a exigência legal de coleta mínima** |
| **7** | **Mediação completa** — toda operação passa por verificação | Sem caminho lateral · sem cache de decisão de acesso · a interface de programação se defende mesmo com o roteador protegido |
| **8** | **Projeto aberto** — a segurança vem do controle, não do segredo da implementação | Esconder rota não é proteger · pacote entregue ao navegador é público por natureza |
| **9** | **Assuma comprometimento** — algo vai falhar | Trilha imutável · alerta · cópia de segurança testada · rotação de credencial · procedimento de incidente escrito |
| **10** | **Aceitabilidade** — controle que atrapalha demais é contornado | Segurança inviável na prática não é segurança. Se o time burla, o desenho está errado, não o time |

> Os oito primeiros são leituras modernas dos princípios clássicos de projeto
> seguro, de 1975, que seguem sendo a base canônica. O nono e o décimo são a
> contribuição da prática: o nono sustenta os modos publicar e operar; o décimo
> é o que impede a skill de produzir processo que ninguém segue.

---

## 3 · Os três tipos de controle

Todo requisito é marcado com um. Serve para entender **o que ele faz e o que
não faz**.

| Tipo | Função | Exemplos |
|---|---|---|
| **Preventivo** | Impede que aconteça | Política no banco · validação · segundo fator · limite de requisição |
| **Detectivo** | Avisa que aconteceu | Trilha de auditoria · alerta de anomalia · varredura do pacote na esteira |
| **Corretivo** | Reduz o dano depois | Rotação de credencial · revogação de sessão · restauração de cópia |

> **Sistema com dez controles preventivos e zero detectivos é comprometido em
> silêncio.** É o padrão dos incidentes que viram notícia: a falha existia há
> meses e ninguém soube. A distribuição saudável precisa dos três.

---

## 4 · Os três níveis de rigor

Responde a pergunta prática mais frequente: *quanto de segurança para este
caso?* O rigor muda conforme **quem se machuca se der errado**.

| | **N1 · BÁSICO** | **N2 · PADRÃO** | **N3 · CRÍTICO** |
|---|---|---|---|
| **Quando** | Sem autenticação, ou só dado da própria organização. Site institucional, ferramenta interna, protótipo | **Existe dado de terceiro.** Login, cliente, cadastro, documento. É o padrão de qualquer sistema em produção com usuário real | Dado sensível, financeiro ou de saúde · volume alto · terceiros dependem disso para operar · obrigação regulatória |
| **Ameaça dominante** | Automatizada e oportunista | Mais o usuário curioso e o que quer vantagem | Mais insider, ataque dirigido e fraude |
| **Exige** | Segredo fora do código e do repositório · transporte cifrado · cabeçalhos · dependências auditadas · erro que não vaza estrutura · cópia de segurança | **Tudo de N1 +** autorização em todo ponto de entrada · isolamento por dono e por organização · validação no servidor · limite de requisição · trilha de ação sensível · classificação de dado · **restauração testada** | **Tudo de N2 +** segundo fator obrigatório · **trilha imutável** · cifra em repouso de dado pessoal · segregação de deveres · retenção e descarte definidos · gestão formal de risco e exceção · **teste de invasão antes de abrir** · plano de incidente escrito |
| **Verificação** | Checklist de publicação | **Mais teste de duas contas** · auditoria por família · verificação automatizada a cada publicação | **Mais teste de invasão** · revisão independente · auditoria periódica com evidência arquivada |
| **Formalidade** | Nenhuma. Só fazer | Registro do que foi verificado | Documentado, com dono, prazo e evidência guardada |

**Uso duplo.** Internamente define o esforço. Externamente é a justificativa de
escopo e de preço numa proposta, e protege dos dois erros simétricos: prometer
N3 cobrando N1, e travar um projeto N1 exigindo controle de N3.

---

## 5 · Contra quem

Sem modelo de ameaça, prioridade vira gosto. Cinco atacantes, ordenados por
probabilidade real.

| # | Quem | Motivação | Como entra | O que ele muda na prioridade |
|---|---|---|---|---|
| **1** | **Rotina automatizada** | Oportunidade em escala. Não escolheu você | Varre repositórios atrás de credencial · testa credencial vazada · escaneia porta e falha conhecida | **O mais provável e o mais barato de barrar.** Segredo fora do repositório, dependência atualizada, limite de requisição. Zero sofisticação do outro lado |
| **2** | **O curioso com conta** | Ver o que não é dele. Muitas vezes sem má intenção | Troca o identificador na URL. É só isso | Referência direta a objeto e isolamento entre organizações. **É o cenário nº 1 de constrangimento com cliente** |
| **3** | **Quem quer vantagem** | Plano pago, crédito, privilégio | Adultera valor, campo de plano, papel | Preço no servidor, lista explícita de campos graváveis, notificação assinada |
| **4** | **Insider** | Pessoa desligada, sócio em conflito | Credencial legítima que não foi revogada | **Trilha imutável** é o único controle que funciona contra quem tem acesso legítimo. Mais revogação e menor privilégio |
| **5** | **A ferramenta e o operador** | Nenhuma. É acidente, não ataque | Comando destrutivo, credencial exposta em contexto, automação com permissão demais | Separação de ambientes · aprovação humana em ação irreversível · cota e escopo de agente |

> Os atacantes 1 e 2 respondem por quase todo o dano real, e ambos são baratos
> de barrar. O 5 é o que quase nenhum material cobre, e é o mais próximo de quem
> constrói com ferramenta geradora de código.

---

## 6 · Por que segurança falha

As causas estruturais não são técnicas. Vale dizer em voz alta, porque é o que
explica por que sistemas feitos por gente competente quebram:

- **Funcionar e estar seguro são coisas diferentes**, e só a primeira é visível.
  Nenhuma dessas falhas aparece na tela: o sistema roda perfeito para o usuário
  honesto.
- **Quem constrói tem incentivo de entrega**, não de proteção. O prazo é real e
  a falha é hipotética até deixar de ser.
- **Ninguém reclama de um sistema que vaza em silêncio.** O retorno que corrige
  outros erros não existe aqui.
- **Ferramenta geradora otimiza para agradar**, completando o padrão mais comum
  que viu, e a internet está cheia de exemplo que embute credencial e pula
  autenticação "para simplificar".
- **Checklist marcado sem entender é pior que nenhum**: produz sensação de
  cobertura. É por isso que cada requisito traz *por quê* e *como quebra*, e não
  só a regra.
- **Segurança sem dono é segurança de ninguém.**

---

## 7 · O que este material não cobre

Honestidade sobre limite é parte do trabalho:

- **Não substitui teste de invasão** feito por pessoa. Cobre o que se sabe
  procurar; profissional acha o que não se sabe.
- **Não cobre lógica de negócio específica** de forma automática. Nenhuma
  ferramenta conhece as invariantes do seu domínio: por isso `BIZ` depende de
  alguém enumerar as regras.
- **Não prova ausência de falha.** Auditoria prova o que foi verificado, na data
  em que foi verificado, e nada além.
- **Não cobre segurança física de infraestrutura de terceiro**, nem análise de
  código de dependência linha a linha.
