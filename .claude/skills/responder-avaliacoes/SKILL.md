---
name: responder-avaliacoes
description: "Escreve respostas curtas e humanas para avaliações do Perfil da Empresa no Google (antigo Google Meu Negócio). Use para \"responder avaliação\", \"resposta para o Google\", \"tem uma avaliação nova\" ou review colado em texto ou print."
---

# /responder-avaliacoes: respostas para as avaliações do Google

As avaliações moram no Perfil da Empresa no Google, o nome atual do Google Meu
Negócio (muita gente ainda diz "GMB" ou "Google Meu Negócio": é o mesmo lugar).

## Dependências

- **Tom de voz e emoji:** `_memoria/escrita-publica.md`
- **Contexto do negócio:** `_memoria/empresa.md` e `_memoria/oferta.md`

---

## Padrão de resposta

Respostas são **curtas** (1 a 2 frases), **pessoais** e **concretas**. Nada de
resposta automática e genérica, com cara de central de atendimento.

### Regras fixas

1. **Sempre citar o nome do cliente.** Primeiro nome, com capitalização correta
   (mesmo que o perfil esteja em minúsculo, ex.: "ana souza" → "Ana"; "joão p.
   lima" → "João"). Se o nome for ambíguo ou parecer apelido de usuário, usar um
   agradecimento caloroso sem forçar o nome.
2. **Sempre agradecer, variando a forma**: "Obrigado", "Muito obrigado", "Que
   bom", "Valeu", para não soar robótico.
3. **Frase concreta, não genérica.** Retomar algo específico da avaliação ou do
   negócio (o produto, o processo, o cuidado, a tradição). Evitar "seu feedback
   é muito importante para nós", "estamos sempre à disposição", "agradecemos a
   preferência".
4. **Emoji é escolha do dono do perfil**, registrada em
   `_memoria/escrita-publica.md` (o campo "Emoji"). Se lá diz "nenhum", a
   resposta sai sem emoji. Se lista os que ele usa, só esses, no máximo um por
   resposta, e só em avaliação calorosa (nunca em crítica nem em avaliação seca).
   Se o campo ainda está *a definir*, a resposta sai sem emoji e eu pergunto uma
   vez se ele quer usar.
5. **Tom:** o de `_memoria/escrita-publica.md`. Sem jargão de marketing ("premium",
   "qualidade ímpar", "experiência diferenciada") e sem travessão: a pausa vira
   vírgula, ponto ou dois-pontos.

### Exemplos genéricos (adaptar ao negócio)

- Cliente (5★ "Produto excelente, recomendo.")
  → *"Obrigado, [Nome]! Saber que o produto agradou é o nosso maior orgulho."*
- Cliente (5★ "Atendimento ótimo")
  → *"Que bom que gostou do atendimento, [Nome]! Caprichamos em cada detalhe."*
- Cliente (5★ sem texto)
  → *"Muito obrigado pelo carinho, [Nome]."*

---

## Workflow

### Passo 1: receber as avaliações

O usuário cola texto, print ou lista de avaliações. Extrair de cada uma:
- o nome do autor
- a nota (estrelas)
- o texto da avaliação (se tiver)

Se for print (imagem), ler e transcrever os dados antes de responder.

### Passo 2: escrever a resposta

Para cada avaliação, **uma única resposta** no padrão acima.

**Calibrar pelo tipo de avaliação:**

| Tipo | Abordagem |
|---|---|
| 5★ com elogio específico (produto, atendimento) | agradecer, retomar o que foi elogiado e, se a escolha de emoji permitir, um emoji caloroso |
| 5★ genérica ou curta ("ótimo", "recomendo") | agradecer e uma frase sobre o cuidado ou o processo |
| 5★ sem texto | agradecimento curto pelo carinho, sem inventar contexto |
| 4★ com ressalva | agradecer, reconhecer o ponto levantado e um compromisso simples, sem emoji |
| 3★ ou menos | **parar e alinhar com o usuário antes de responder**: avaliação negativa pede resposta sob medida, nunca automática |

### Passo 3: entregar em formato fácil de copiar

Cada resposta logo abaixo da avaliação, pronta para colar no Perfil da Empresa
no Google:

```
**[Nome do autor]** · [estrelas] · "[trecho curto da avaliação]"
→ [resposta]
```

Se forem muitas (5 ou mais), um bloco corrido com separador claro entre elas.

### Passo 4: salvar o histórico (opcional)

Se o usuário pedir para guardar, salvar em `marketing/avaliacoes-google/AAAA-MM-DD-respostas.md` <!-- caminho futuro: só existe se o usuário pedir o registro --> com a avaliação e a resposta publicada. A pasta só se cria se ele quiser o registro; por padrão, não.

---

## Regras

- Nunca a mesma resposta para avaliações diferentes. Variar sempre.
- A resposta é texto público: antes de entregar, passa pela skill `humanizer`.
- Não prometer o que não depende só do negócio (entrega terceirizada, prazo de
  fabricante etc.).
- Não pedir contato por mensagem privada ou telefone na resposta pública, a
  menos que o usuário peça (gera ruído na resposta).
- Só o primeiro nome do cliente, nunca o nome completo.
- Não mencionar concorrentes, mesmo se o cliente mencionar.
- Em avaliação negativa: reconhecer, não se defender, e oferecer canal privado
  só se o usuário autorizar.
