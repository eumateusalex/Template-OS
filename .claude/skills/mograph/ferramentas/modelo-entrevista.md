# Modelo de entrevista

Toda pergunta ao usuário (a sabatina da peça, a entrevista de um estudo, a escolha de uma
prancha) segue este formato. A entrevista vai na seção "Entrevista" do `brief.md` da
peça, ou no `entrevista.md` do estudo. Com o formato fixo, o relatório sai por busca:
`grep -rn "virou:" saidas/ .claude/skills/` lista toda decisão que virou regra (a peça
em andamento e o estudo que a skill lê), e `grep -rn "^## E"` nas mesmas pastas lista as
perguntas; o que já saiu da árvore se acha no histórico com `git log -S "virou:"`.

## As regras

- **Só gosto e negócio.** O que tem medida eu decido e registro com a confiança e o
  custo do erro (`sabatina.md`). Decisão que ele já deu não volta.
- **No máximo 10 perguntas por rodada**, deduplicadas.
- **De 2 a 4 opções**, cada uma com um rótulo de até 5 palavras e uma linha que diz
  como fica; a recomendada primeiro, marcada, com o porquê em uma ou duas frases.
- **O que muda**: uma linha por opção, com o arquivo ou a régua que muda.
- **Linguagem de balcão**: ele não é técnico. Nome de arquivo só na linha "o que muda".
- Visual novo vai com a prova renderizada ou com a opção "quero ver antes".

## O bloco de cada pergunta

```markdown
## E<n> · <o assunto em até 6 palavras>

<o contexto em uma ou duas frases: como é hoje e o que as referências fazem>

| Opção | Como fica |
|---|---|
| **A · <rótulo>** (recomendada) | <uma linha> |
| B · <rótulo> | <uma linha> |

**Por que A**: <uma ou duas frases, com a fonte quando houver>.

**O que muda**: A <arquivo, régua>. B <arquivo, régua>.

**Resposta**: <a letra> · **frase dele**: "<a frase, nas palavras dele>" · **data**: AAAA-MM-DD
**virou**: <arquivo> § <seção> (ou "só esta peça")
```

As três últimas linhas se preenchem quando ele responde. Recusa vira trava no mesmo
passo (`biblioteca.md`, "Recusa vira trava"), e a linha "virou" aponta a trava.
