# Writing — voz e tom de interface

> Como a Apple escreve, adaptado ao português brasileiro. Vale pra todo texto
> que aparece na tela: botão, título, alerta, erro, empty state, placeholder,
> toast. Texto de marketing e de marca não é assunto daqui.

---

## 1 · A voz

- **Direto.** A frase mais curta que ainda é clara. Corta preâmbulo,
  corta "por favor", corta redundância.
- **Na segunda pessoa.** A interface fala com você: "Suas fotos", "Escolha
  um plano". Nunca "o usuário deve", nunca a voz passiva de manual.
- **Sem jargão.** Nem técnico ("falha na requisição"), nem de marketing
  ("otimize sua experiência"). Palavra de gente.
- **Calma.** Sem exclamação de vendedor, sem "Ops!" forçado, sem drama em
  erro. Confiança é tom neutro.

## 2 · As regras por elemento

| Elemento | Regra |
|---|---|
| **Botão** | Verbo de ação em title case: "Salvar Alterações", "Adicionar Cartão". Nunca "OK" quando dá pra dizer o quê acontece. Sem ponto final |
| **Label / título de célula** | Substantivo curto, sem ponto final: "Notificações", "Conta" |
| **Título de alerta** | Curto e afirmativo (ou pergunta direta): "Apagar esta conversa?" |
| **Corpo de alerta** | UMA frase explicando a consequência: "Ela será removida de todos os seus aparelhos." |
| **Botão destrutivo** | O verbo do ato, nunca "Sim": "Apagar". Cancelar é sempre "Cancelar" |
| **Erro** | O que houve + como sair, sem culpar: "Senha incorreta. Tente de novo." |
| **Empty state** | O que estaria aqui + o primeiro passo: título curto, uma linha de apoio, um botão |
| **Placeholder** | Exemplo ou formato esperado, não instrução: "nome@exemplo.com" |
| **Toast** | Confirmação mínima, 1 a 3 palavras: "Salvo", "Link copiado" |
| **Switch/toggle** | Só o substantivo do que liga: "Modo Escuro" (o switch já diz o estado) |

**Title case à brasileira:** substantivos, verbos e adjetivos com maiúscula;
artigos, preposições e conjunções curtas em minúscula — "Adicionar à Lista",
"Salvar como Rascunho".

## 3 · 20 pares — ruim → bom

| # | Contexto | Ruim | Bom |
|---|---|---|---|
| 1 | Botão de confirmação | OK | Salvar |
| 2 | Botão com jargão | Submeter formulário | Enviar |
| 3 | Botão sem title case | Adicionar novo cartão | Adicionar Cartão |
| 4 | Label com ponto | Notificações. | Notificações |
| 5 | Título de alerta vago | Atenção!!! | Apagar esta conversa? |
| 6 | Corpo de alerta redundante | Você tem certeza que deseja realmente apagar esta conversa? | Ela será removida de todos os seus aparelhos. |
| 7 | Botão destrutivo | Sim | Apagar |
| 8 | Erro que culpa | Você digitou a senha errada | Senha incorreta. Tente de novo. |
| 9 | Erro sem saída | Erro 500 | Não foi possível carregar. Verifique sua conexão e tente de novo. |
| 10 | Erro técnico vazado | NetworkException: timeout em /api/v2/sync | A sincronização demorou demais. Tente de novo em instantes. |
| 11 | Empty state seco | Nenhum dado encontrado | Nenhuma conversa ainda |
| 12 | Empty state sem passo | Sua lista está vazia | Sua lista está vazia. Toque em Adicionar pra começar. |
| 13 | Placeholder inútil | Digite aqui | nome@exemplo.com |
| 14 | Toast burocrático | A operação foi concluída com sucesso | Salvo |
| 15 | Pedido de permissão vago | O app precisa de acesso à sua localização | Sua localização mostra os pedidos perto de você |
| 16 | Loading dramático | Aguarde, processando sua solicitação... | Carregando conversas |
| 17 | Voz de manual | O usuário deve selecionar um plano | Escolha um plano |
| 18 | Marketing na interface | Turbine sua produtividade com Pastas | Organize seus arquivos em Pastas |
| 19 | Título de tela em frase | Gerenciando os seus cartões | Cartões |
| 20 | Toggle que pergunta | Deseja ativar as notificações? | Notificações |

## 4 · Detalhes de PT-BR

- **Imperativo direto**: "Escolha", "Toque", "Arraste" — sem "você deve".
- **"Toque"**, não "clique", quando o alvo é mobile; "selecione" serve os dois.
- Data e número no formato brasileiro: "9 de agosto", "1.250", "R$ 49,90".
- Reticências de continuação usam o caractere próprio "…" e só aparecem
  quando a ação abre outra etapa ("Renomear…") ou em processo em andamento
  ("Carregando…").
- Sem travessão em texto de interface; vírgula, ponto ou dois-pontos resolvem.

## 5 · Teste rápido antes de entregar

1. Dá pra cortar alguma palavra sem perder o sentido? Corta.
2. O botão diz o que acontece quando tocar? ("Salvar", não "OK")
3. O erro diz o que houve E o que fazer, sem culpar?
4. Algum label terminou em ponto final? Tira.
5. Leu em voz alta: soa como uma pessoa explicando, ou como um sistema
   se defendendo?
