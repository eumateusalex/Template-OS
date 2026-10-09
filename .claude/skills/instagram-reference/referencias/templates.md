# Os moldes de página — Banco de Referências e Ideias de Conteúdo

> Abrir quando chegar no **passo 5** (conteúdo da página de referência) e no
> **passo 7** (conteúdo das páginas de roteiro). As propriedades a preencher
> estão no `SKILL.md`; aqui está só o corpo das páginas.
>
> Qual molde usar sai do **modo** definido no passo 4.

---

## Passo 5 · Corpo da página do Banco de Referências

### Modos "Padrão" e "Viral" (vídeo com fala)

```markdown
## Gancho
<trecho inicial da transcrição PT que funciona como gancho>

## Desenvolvimento
**Frase 1:** <...>
**Frase 2:** <...>
**Frase 3:** <...>
(continue numerando frase por frase até o fim do desenvolvimento)

## CTA
<trecho final da transcrição PT que funciona como CTA — "Nenhuma" se não houver>
```

### Modo "Sem fala"

```markdown
## O que acontece no vídeo
<passo a passo do que é mostrado/feito, na ordem em que acontece>

## Gancho Visual
<o que prende atenção nos primeiros segundos — texto na tela, ação, corte>
```

---

## Passo 7 · Corpo das páginas de Ideias de Conteúdo

### Molde "Sem fala" (ideia única)

```markdown
## Conceito
<o que acontece no vídeo, passo a passo do que é mostrado/feito>

## Gancho Visual
<o que prende atenção nos primeiros segundos>

## Adaptação para o seu cenário
<como transpor o tema/visual mantendo a mesma estrutura — ou ajustes de produção se já for do nicho>

## Título do vídeo
<headline curta>

## Legenda/Descrição
<legenda pronta para postar>
```

### Molde "Estrutura do original" (modo Viral, Ideia 1)

Mesmo esqueleto do vídeo de referência, conteúdo do usuário: cada bloco imita a
**função** do trecho original (o tipo de gancho, o tamanho da frase, a virada, o
tipo de CTA) com o tema, os exemplos e as palavras do usuário (`voice-model.md`).
Nenhuma frase do original entra, nem traduzida.

```markdown
## Gancho
"<gancho novo, no tema do usuário, com o mesmo mecanismo do original (tipo: <pergunta / contraste / número / ...>)>"

## Desenvolvimento
**Frase 1** (função no original: <o que aquele trecho fazia>): "<frase do usuário>"
**Frase 2** (função no original: ...): "<frase do usuário>"
(continue bloco a bloco, no mesmo ritmo e na mesma ordem de condução do original)

## CTA
"<CTA do usuário do mesmo tipo da original — se não houver, use a CTA padrão do usuário conforme voice-model.md>"

## Título do vídeo
<headline curta>

## Legenda/Descrição
<legenda pronta para postar>
```

### Molde completo (modo Padrão — todas as ideias; modo Viral — Ideia 2)

Roteiro escrito frase por frase **na voz do usuário** (aplicar `voice-model.md`:
tom, estrutura, exemplos de vídeos que funcionaram):

```markdown
## Gancho
**Opção 1** (tags: <2-3 de: atenção / curiosidade / urgência / novidade>)
"<frase do gancho>"

**Opção 2** (tags: ...)
"<frase do gancho>"

**Opção 3** (tags: ...)
"<frase do gancho>"

## Desenvolvimento
**Frase 1** (tags: <2-3 de: clareza / organização / criatividade / autenticidade>)
"<frase>"

**Frase 2** (tags: ...)
"<frase>"

(continue frase por frase até cobrir o roteiro completo)

## CTA
**Opção 1** (tags: <2-3 de: likes / seguidores / comentários / compartilhamentos / salvos>)
"<frase de CTA>"

**Opção 2** (tags: ...)
"<frase de CTA>"

**Opção 3** (tags: ...)
"<frase de CTA>"

## Título do vídeo
<headline curta para sobrepor no vídeo>

## Legenda/Descrição
<legenda pronta para postar>
```

---

## Os dois formatos fixos do passo 4

### "Gancho Identificado"

Sempre fala primeiro, depois visual, com UMA linha em branco entre os dois. No
modo "Sem fala", deixar `Fala: (sem fala)`.

```
Fala: "<frase exata dos primeiros segundos>"

Visual: <o que aparece na tela ao mesmo tempo — texto, ação, elemento gráfico>
```

### "Por que"

Sempre 3 critérios numerados, 1 frase cada. Item 4 é bônus opcional, para algo
notável que se destacou.

```
1. Alinhamento com o nicho: <como o tema se conecta com o território do usuário>
2. Replicabilidade do formato: <quão fácil é regravar esse formato com os recursos disponíveis>
3. Métricas/performance: <números do vídeo original — likes, comentários, views se disponíveis; senão "não disponível">
4. (Bônus, opcional) <algo extra que se destacou — ex: técnica de headline, transição visual, gatilho específico>
```
