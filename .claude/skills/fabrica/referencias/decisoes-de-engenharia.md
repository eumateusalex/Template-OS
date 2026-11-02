# O catálogo de decisões de engenharia

> A seção `## Decisões de engenharia` que todo `plan.md` responde, e que o
> conferidor `specs` (regra S5) cobra item a item.
>
> 🚨 **Existe porque a IA não tem visão de produto.** Se você não especifica que
> quer cache, ela não faz. Ela não sabe que o seu e-commerce tem mil leituras para
> cada escrita; quem sabe é você, e só o que estiver escrito vai existir.
>
> ⚠️ **"Não se aplica: <razão>" é resposta completa.** O que não vale é deixar
> em branco: o item em branco é a decisão que ninguém tomou.

## Como responder

No `plan.md`, uma tabela:

```markdown
## Decisões de engenharia

| Decisão | Resposta | Razão |
|---|---|---|
| cache | não se aplica: cada leitura é única | sem repetição, cache só cria estado a invalidar |
| idempotência | chave por pedido, na borda | o cliente reenvia quando a rede cai |
```

## Os itens

| Decisão | Quando importa | As opções | Gatilho de ADR |
|---|---|---|---|
| **cache** | a mesma leitura se repete e custa | memória do processo, camada compartilhada, cabeçalho HTTP, nenhum | quando o dado pode ficar velho e alguém decidir por quanto tempo |
| **idempotência** | a escrita pode chegar duas vezes | chave do cliente, chave derivada do conteúdo, nenhuma | quando a repetição cobra, manda mensagem ou cria linha |
| **retentativa e fila morta** | você chama alguém que pode cair | tenta N vezes com espera crescente; fila morta com dono; desiste e avisa | sempre que houver fila morta: alguém precisa olhar |
| **fila ou síncrono** | a operação demora mais que a paciência de quem espera | responde já e processa depois, ou segura a resposta | quando a fila vira infraestrutura nova |
| **CQRS** | leitura e escrita têm formas muito diferentes | um modelo só, ou dois | sempre: é caro de desfazer |
| **tempo real** | a tela precisa saber sem perguntar | SSE, WebSocket, sondagem, nada | quando exige processo que fica de pé |
| **paginação** | a lista cresce sem teto | cursor, deslocamento, nenhuma | quando a API é pública |
| **concorrência** | dois podem escrever a mesma linha | trava otimista por versão, transação, nada | quando o conflito custa dinheiro |
| **migração** | o esquema muda com o código no ar | aditiva (coluna no fim, tabela nova), ou com parada | sempre que NÃO for aditiva |
| **fuso e horário** | a data aparece para alguém | guardar em UTC e mostrar no fuso do dono; ou guardar já no fuso | quando houver mais de um fuso |
| **dinheiro** | existe valor a cobrar | inteiro em centavos, decimal de precisão fixa; **nunca float** | quando houver arredondamento com regra |
| **autenticação e autorização** | existe mais de um dono de dado | onde se confere, e o que acontece quando falta permissão | sempre |
| **limite de taxa** | alguém de fora chama você | por chave, por IP, nenhum | quando o custo por chamada for real |
| **observabilidade** | o sistema vai rodar sem você olhando | o que se registra, o que correlaciona, o que alerta e por onde | quando o alerta acorda alguém |
| **backup e restauração** | existe dado que não se refaz | com que frequência, e **a restauração já foi provada?** | sempre: backup não provado é backup que não existe |
| **desligado por padrão** | a capacidade fala com fora, gasta ou escreve | nasce desligada e liga por gesto | sempre (princípio IV) |
| **dependência nova** | você vai instalar algo | a razão, a licença, quem mantém, e o que acontece se sumir | quando for de runtime, ou quando for difícil de trocar |

## O que este catálogo NÃO decide

Ele não escolhe por você, e não é checklist de conformidade: é a lista de
perguntas que, sem resposta escrita, viram código que ninguém pediu ou buraco
que ninguém viu. A resposta certa depende do produto, e é sua.
