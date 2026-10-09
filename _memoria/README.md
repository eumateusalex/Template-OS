# Memória

> **Responsabilidade:** este arquivo é o índice e o contrato da memória. Ele
> diz o que cada módulo carrega, o que se lê quando, onde uma informação nova
> entra e como a memória se mantém.
> **Não mora aqui:** conteúdo de negócio de qualquer tipo.

## O que esta pasta é

O contexto que o Claude carrega para trabalhar com você: quem você é, o que o
seu negócio vende, com que ferramentas, como o seu conteúdo funciona, como você
quer que se escreva, e o que importa agora. Quem preenche pela primeira vez é o
`/instalar`, e quem mantém depois é o `/memoria`.

**Memória é estado, não diário.** Ela descreve o presente. Quando um fato muda,
a frase antiga é substituída, e não anotada ao lado. Se o histórico de como uma
decisão nasceu importar para um sistema que vai durar, o lugar dele é um ADR
em `docs/adr/` do projeto em questão, pela skill `/grill`.

## Os módulos

| Arquivo | Carrega |
|---|---|
| `empresa.md` | quem você é, tese, posicionamento, mercado, ofertas e jornada comercial |
| `preferencias.md` | como trabalhar com você: responder, entregar, decidir junto, custo e automação |
| `estrategia.md` | o que importa agora: fase, gargalo, prioridades, próximo passo, estado das frentes, pendências |
| `ferramentas.md` | o ambiente em que o workspace roda: contas, servidor, motores de geração, leitura de terceiros, navegador, MCP e repositórios |
| `escrita-publica.md` | a sua voz e a régua de todo texto que o público vê: o que evitar, balcão, caixa, clareza, CTA, número e copy de venda |
| `marketing.md` | o sistema de conteúdo e aquisição: audiências, territórios, funções, funil, consciência, matriz, formatos, produção e métricas |
| `CONTEXT.md` | o vocabulário do negócio, um verbete por termo |
| `prova.md` | o que pode ser afirmado em público e com que base |

## O que se lê quando

Este README é o único dono desta lista: o `CLAUDE.md` e a skill `/abrir`
apontam para cá.

**Em toda sessão:** este README, `empresa.md`, `preferencias.md` e
`estrategia.md`.

**Quando a tarefa usa ferramenta, conta ou servidor:** somar `ferramentas.md`.

**Quando a tarefa é conteúdo, copy, peça visual ou venda:** somar
`escrita-publica.md`, `marketing.md`, `CONTEXT.md` e `prova.md`.

Ler não se anuncia nem se confirma. O contexto se usa naturalmente.

## Onde entra uma informação nova

| A informação é sobre | Vai para |
|---|---|
| quem você é, trajetória, personalidade, como quer ser percebido | `empresa.md` |
| o que o negócio vende, para quem, em que ordem, por qual jornada | `empresa.md` |
| ferramenta, conta, servidor, integração, motor, repositório | `ferramentas.md` |
| como você quer ser atendido: resposta, entrega, decisão, custo | `preferencias.md` |
| voz, palavra a evitar, texto público, CTA, número, venda | `escrita-publica.md` |
| como o conteúdo é pensado, planejado, distribuído ou medido | `marketing.md` |
| prioridade, prazo, pendência, estado de uma frente | `estrategia.md` |
| o que um termo do negócio significa | `CONTEXT.md` |
| o que pode ou não ser afirmado, e com que medição atrás | `prova.md` |
| regra de como o workspace opera (git, sessão, pastas, skills) | `CLAUDE.md` da raiz |
| o que um script faz | o README da pasta do código (`scripts/README.md`) |
| cor, fonte, logo da marca | `/carrossel configurar`, que é dono dos tokens e mede o contraste (o `identidade/design-guide.md` só aponta para lá) |
| detalhe de um projeto ou cliente | o `CLAUDE.md` daquele projeto ou cliente |

Nenhuma linha desta tabela cabe? Só então se avalia módulo novo, pela regra
abaixo.

## Regras de manutenção

**Registrar é substituir.** Um fato que mudou reescreve a frase que estava lá.
Não se acrescenta "antes era X" nem "desde tal dia é Y".

**Um conceito, um lugar.** Cada informação tem um módulo dono. Os outros
apontam para ele quando precisam, e nunca copiam. Copiar é o que faz a memória
apodrecer, porque a cópia não acompanha a mudança do original.

**Fato que fecha uma pendência mexe em dois arquivos.** O fato em si vai para o
módulo dono pela tabela acima; o item correspondente em `estrategia.md` é
riscado, e o "Próximo passo" de lá se reavalia, no mesmo commit. Registrar só o
fato deixa a estratégia mandando fazer o que já foi feito.

**Escrever no presente.** "Atualmente", "Regra:", "Princípio:", "Preferência:".
Data só ao lado de número que envelhece, no formato `(medido em AAAA-MM-DD)`.

**Sem emoji como estrutura.** Ênfase é negrito. O único marcador permitido é
`[REVIEW]` no começo da linha, para o que depende de uma decisão sua.

**Módulo novo só nasce quando:** a informação não cabe em nenhuma linha da
tabela de roteamento, tem mais de umas 40 linhas de conteúdo próprio, e o
README é atualizado no mesmo commit. Subpasta dentro de `_memoria/` é proibida.

**Teto orientativo de 250 linhas por módulo.** Passou disso, ou o domínio pede
divisão, ou o texto pede corte.

## Precedência

**A memória manda sobre oferta, preço e cliente em todo o workspace.** Quando
um sistema (uma skill, um agente, um site, um atendimento automático) descreve
um negócio que não é mais o seu, vale o que está aqui, e o sistema entra na
"Fila de realinhamento" de `estrategia.md` até ser corrigido.

## A auto-memória do Claude

O Claude Code guarda, por conta própria e fora do Git, lições técnicas de como
trabalhar no código e nas ferramentas deste workspace (a pasta
`~/.claude/projects/<workspace>/memory/`). Ela não repete o que mora aqui nem no
`CLAUDE.md`: preferência sua e regra do workspace ficam versionadas. A
`/memoria auditar` confere as duas.

## Termos aposentados

Quando um nome sai de uso (uma oferta que acabou, um produto renomeado, um sócio
que saiu), ele entra aqui, um por item, com o motivo depois de um travessão. A
partir daí, nenhum outro módulo pode citá-lo, e o verificador cobra.

## Como manter

A skill `/memoria` faz os três trabalhos: `registrar` um fato novo no lugar
certo, `auditar` a memória contra estas regras, e `revisar` os itens marcados
`[REVIEW]` um por vez.

A conferência mecânica é `node scripts/confere-memoria.mjs`.
