---
name: email-profissional
description: >
  Rascunha um email profissional a partir de um contexto livre.
  Calibra o tom ao destinatário e ao objetivo do email.
  Use quando o usuário disser "escreve um email pra", "preciso mandar um email sobre",
  "como eu respondo isso", "faz um email pra [cliente/pessoa]".
---

# /email-profissional — Rascunho de Email

## Dependências

- **Contexto do negócio:** `_memoria/empresa.md`
- **Tom de voz e régua do texto público:** `_memoria/escrita-publica.md`

---

## Workflow

### Passo 1 — Coletar o contexto

Se o usuário não forneceu as informações necessárias, perguntar:
1. "Para quem é o email? (nome, cargo, relação com você)"
2. "Qual é o objetivo? (cobrar, propor, responder, agradecer, dar seguimento...)"
3. "Há algo específico que precisa constar ou que deve ser evitado?"

Se o usuário fornecer o contexto de forma livre (mesmo que desorganizado), extrair as informações disponíveis e prosseguir.

### Passo 2 — Escrever o email

**Considerar:**
- Tom proporcional à relação (cliente novo = mais cuidado, parceiro antigo = mais direto)
- Objetivo claro na abertura (não enterrar o pedido no final)
- Uma ação pedida por vez
- Encerramento sem redundância ("Qualquer dúvida, fico à disposição" é padrão — utilizar apenas quando fizer sentido)

**Estrutura:**
```
Assunto: [linha de assunto direta, sem clicbait]

[Nome],

[Parágrafo 1 — contexto ou referência ao último contato]

[Parágrafo 2 — o ponto principal ou o pedido]

[Parágrafo 3 — próximo passo, se houver]

[Assinatura]
[Nome do usuário, de _memoria/empresa.md]
```

### Passo 3 — O tom (quando o assunto é delicado)

Se o assunto for delicado (cobrança, feedback negativo, recusa), entregar a
versão recomendada e, numa linha, a alternativa mais suave (ou mais direta),
dizendo por que recomendou a primeira.

### Passo 4 · Passar pela `humanizer`

O email é texto que outra pessoa lê: antes de entregar, a versão final passa
pela skill `humanizer`, que tira o maneirismo de máquina sem mudar o pedido.

---

## Regras

- Tom segue `_memoria/escrita-publica.md`
- Nunca usar linguagem corporativa genérica sem necessidade
- Assunto do email deve ser específico e descritivo, não vago ("Seguimento", "Proposta")
- Se for um email de cobrança, ser direto mas sem agressividade
- Se for resposta a algo, citar o contexto na primeira linha
