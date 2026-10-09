# O relatório — contrato do `achados.json` e do gerador

> **Lido quando:** for gerar o documento de uma auditoria, no passo 8 de
> `auditar.md` ou ao fim do modo publicar.
>
> Nada aqui é necessário para auditar. É a etapa de entregar.

---

## Por que existe

Auditoria que termina no terminal é lida uma vez, por uma pessoa, e some com a
janela. Ela não se manda, não se guarda, e principalmente **não se compara com a
próxima** — que é onde estaria metade do valor de auditar.

O gerador separa duas coisas que se misturavam: **quem julga** e **quem
formata**. O julgamento inteiro acontece antes, e sai num arquivo de dados. O
script só desenha, e não tem opinião nenhuma sobre o que é achado.

```
verificação → achados.json → relatorio.js → um arquivo .html
   (julga)      (o dado)      (só desenha)     (a entrega)
```

---

## O comando

```bash
node .claude/skills/seguranca/scripts/relatorio.js <achados.json> \
     [--perfil perfil.json] [--saida <pasta ou arquivo>] [--tema <arquivo.css>]
```

| Opção | O que faz |
|---|---|
| `--perfil` | Traz stack, nível, superfícies e o que não se aplica. Sem ele o relatório sai, com menos contexto |
| `--saida` | Pasta ou arquivo. Padrão: `docs/seguranca/` ao lado do `achados.json` |
| `--tema` | Folha de estilo externa, embutida no lugar da neutra |

**A saída é um arquivo só**, que abre sem servidor, funciona sem rede e imprime
em A4 pelo próprio navegador. Não há PDF a gerar: quem quiser PDF usa a
impressão, e o resultado tem o mesmo desenho.

---

## O esquema do `achados.json`

```json
{
  "projeto": "nome-do-projeto",
  "data": "2026-09-04",
  "nivel": "N2",
  "escopo": "O que foi auditado, e o que ficou de fora.",
  "autorizadoPor": "quem respondeu pelo sistema",

  "achados": [
    {
      "id": "ACC-03",
      "titulo": "Consulta por identificador não confere o dono",
      "severidade": "critica",
      "onde": "src/api/pedidos.ts:42",
      "prova": "GET /api/pedidos/8817 com a sessão de A devolveu o pedido de B",
      "impacto": "Qualquer conta lê o pedido de qualquer outra trocando o número",
      "correcao": "Levar o identificador do dono para dentro da consulta",
      "testar": "Repetir a mesma requisição e conferir que responde inexistente",
      "condicao": "opcional: o que precisa ser verdade para ser alcançável"
    }
  ],

  "pontosFortes": [
    {
      "id": "SEC-01",
      "verificado": "Busca por formato em todos os arquivos versionados e no histórico",
      "evidencia": "1.410 arquivos e 812 commits varridos, nenhum resultado"
    }
  ],

  "excecoes":      [ { "id": "IDN-05", "motivo": "...", "revisarEm": "2026-12-01", "vencida": false } ],
  "naoVerificado": [ { "id": "DAT-12", "motivo": "Exige autorização para consulta anônima ao banco" } ],
  "naoSeAplica":   ["CLI", "FIL"]
}
```

**Só `achados` é obrigatório, e ele pode ser lista vazia.** Auditoria sem achado
é resultado legítimo, e o documento sai dizendo isso.

### Os campos de um achado

| Campo | Obrigatório | Regra |
|---|---|---|
| `id` | sim | Identificador do catálogo. É o que liga o achado à ficha |
| `severidade` | sim | `critica` · `alta` · `media` · `baixa`. A régua está no `SKILL.md` |
| `onde` | sim | Arquivo e linha, ou endereço. Sem localização não há como corrigir |
| `prova` | **sim** | Saída de comando, trecho, resposta observada |
| `impacto` | sim | Em linguagem de consequência, não de categoria |
| `correcao` | sim | O caminho mais barato que resolve |
| `testar` | não | Como confirmar que a correção funcionou |
| `condicao` | não | Condição de explorabilidade, quando houver |
| `titulo` | não | Se faltar, usa o título do requisito no catálogo |

---

## As três travas que o script impõe

Não são recomendação. São código, e o script recusa gravar quando qualquer uma
é violada.

### 1 · Achado sem prova não é gravado

Falta `prova`, ou `onde`, e o item **não vira achado**: ele é movido para "não
verificado", com o motivo dizendo que faltou evidência. É a Regra 4 da skill.

O relatório sai mesmo assim, e diz o que aconteceu. Isso é deliberado: relatório
que se recusa a existir por causa de um item faz quem escreveu inventar a prova
que falta.

### 2 · Valor que pareça segredo faz o script abortar

Os campos são varridos contra os prefixos de credencial da tabela de
`stacks.md`. Se algum casar, **nada é gravado**, e o script diz qual campo de
qual achado precisa ser limpo.

É a Regra 10 da skill virando trava. O motivo é direto: o relatório de auditoria
circula por e-mail, entra em pasta compartilhada e às vezes vai para repositório.
Um relatório que documenta uma credencial exposta **e a transcreve** transforma o
achado em vazamento novo.

**Nome, prefixo e localização provam que existe.** Nunca o valor.

### 3 · O script escreve num arquivo só, no caminho que recebeu

Sem rede, sem executar processo, sem tocar em nada fora do destino. É a mesma
regra que vale para os scripts de consulta, adaptada a um script cuja função é
escrever — e a dimensão 8 do verificador cobra as duas classes separadamente.

---

## A marca fica de fora

O documento sai **neutro**: tipografia do sistema, papel claro, uma cor de
destaque, régua e tabela. Nada de identidade visual embutida.

Isso não é falta de capricho, é a consequência de a skill ser genérica. Ela serve
qualquer organização, e por isso não carrega a marca de nenhuma. Quem quiser a
sua passa `--tema` apontando para uma folha de estilo **que mora fora da skill**,
redefinindo as variáveis de cor e as famílias tipográficas.

> **Miolo claro, sempre.** Documento longo com fundo escuro é inimprimível, e
> auditoria é material que se imprime e se anota.

---

## Depois de gerar

1. **Abrir o arquivo e ler inteiro.** O gerador não confere sentido: ele confere
   forma. Achado com impacto vago passa na trava e reprova na leitura
2. **Conferir a seção de pontos fortes.** Se ela estiver vazia num sistema que
   passou em dezenas de requisitos, o julgamento foi preguiçoso, não o script
3. **A seção de tarefas** sai em texto simples, pronta para virar item de
   acompanhamento em qualquer ferramenta. Achado explorável **não** vira tarefa
   pública: ele vai por canal privado, e a lista diz isso
4. **Guardar junto do `perfil.json` e do `achados.json`.** É o que permite
   comparar com a próxima auditoria, e é `VER-05`
