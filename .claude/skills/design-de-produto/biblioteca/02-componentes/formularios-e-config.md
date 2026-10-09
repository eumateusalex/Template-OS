# Formulários, configuração e estados vazios

A família menos frequente nas telas de referência: elas mostram painéis e telas de decisão, quase nunca
formulário. Tudo o que aparece está aqui: campo de texto, seletor, checkbox, grupo de toggles de
configuração, linha de envio de arquivo, painel de regra e os estados vazios (resolvidos sem ilustração).

Escala e método: [README](README.md#escala-e-método). Tokens oficiais:
[design-system-publicado.md](../01-sistema-visual/design-system-publicado.md): no claro, controle tem borda
`line/strong` `#D2D1DD` e campo rebaixado `bg/sunken` `#E3E2EC`; no escuro, controles têm raio de 8 a 12.

![Formulário do AgentTrail e contadores do Ergond](../galeria/02-componentes/form-config-agenttrail-e-ergond.jpg)

---

## 1. Campo de texto

**O que é.** Rótulo em cima, caixa embaixo. 6 telas **[OBSERVADO]**.

### Anatomia (AgentTrail "Identity", fator ~3,0)

1. **Cartão de grupo** com título 18 px ("Identity").
2. **Rótulo** Inter 14 cinza, 8 px acima da caixa ("Display name", "Framework", "Purpose (shown to
   auditors)"). O rótulo diz para quem o dado serve quando isso importa.
3. **Caixa**: 40 px de altura, raio 11, fundo `#1b1b1f` sobre o cartão `#151517`, borda 1 px `#2e2d33`
   **[MEDIDO]**. Confere com a regra escura *"controls 8 to 12"*.
4. **Valor** Inter 15 branco; ícone opcional à esquerda (pessoa, em "Owner").
5. **Grade de 2 colunas** para campos curtos (Owner, Environment), largura total para texto longo.

### Variações

- **Busca em caixa** (Ergond inbox): retângulo com borda, raio ~8, 36 px, lupa à esquerda.
- **Campo de mensagem com ações** (Ergond): "Write as Marina · the agent is paused" + botões "Hand back to
  agent" e "Send" dentro da mesma caixa; embaixo, chips de ação rápida ("Request tax certificate", "Confirm
  new limit").
- **Campo de pergunta à IA**: ver [ia-e-agentes](ia-e-agentes.md#1-painel-de-assistente-chat-com-orbe).

---

## 2. Seletor (select)

Mesma caixa do campo, com chevron à direita (AgentTrail "Framework"). Fora de formulário, o seletor vira
pílula pequena com borda: "Both applicants ⌄" (Mortgage), "All properties ⌄", "2026 ⌄", "Today ⌄" (FixTrack),
"This month ⌄" com ícone de calendário (AgentPay) **[OBSERVADO em 15 telas]**. Ver
[filtros](selos-chips-e-botoes.md#4-chip-de-filtro-e-seletor).

---

## 3. Checkbox

- **Quadrado preto** de 16 px, raio 4, check branco (ComplianceFlow, Rillo ledger), sempre associado à barra
  de ação em lote.
- **Quadrado contornado** que fica preto quando feito, com o estado escrito no texto (Ergond "Open items": "Tax certificate · asked 12
  Aug" vazio; "Insurance policy · validated" preenchido).
- **Redondo** em lista de tarefas do celular (caregiver "Today's tasks").

---

## 4. Grupo de toggles de configuração

**O que é.** Um cartão de regras liga/desliga, cada uma com a consequência escrita. 5 telas **[OBSERVADO]**.

### Anatomia (AgentTrail "Recording")

1. **Título do grupo** 18 px + nota em Geist Mono cinza ao lado ("changes are versioned · v2.4 → v2.5").
2. **Linha**: toggle de 36 × 19 px à esquerda (roxo `#7c6cf0` ligado, `#2e2f34` desligado) **[MEDIDO]**,
   título 16 px branco, descrição 14 px cinza embaixo ("Emails, phone numbers, card numbers and 14 custom
   patterns are masked. Raw values are never stored.").
3. **Passo** entre linhas ~56 px.
4. **Aviso de alterações** fora do cartão: "unsaved changes · 2" em Geist Mono âmbar.

**A regra.** O toggle é alinhado à ESQUERDA do texto, não à direita como no iOS. A descrição diz o efeito
real, com número quando dá ("14 custom patterns") **[OBSERVADO em 5 telas]**.

---

## 5. Painel de regra de sistema

**O que é.** Configuração de comportamento de agente ou modelo, apresentada como leitura, não como formulário.

Ergond "LLM · model configuration": lista "PER-WORKFLOW ROUTING" em linhas com borda;
bloco "FAILOVER POLICY" em três linhas com ícone (Trigger, Behaviour, Never); "RECENT FAILOVER EVENTS" com a
data em chip Geist Mono ("22 Aug 04:11"); "PROVIDER STATUS · NOW" com selo "Healthy"; e no pé uma faixa de
aviso cinza-azulada: "Collections has no fallback. If model-a…". A configuração mostra o que já aconteceu
por causa dela.

---

## 6. Linha de envio de arquivo

Mortgage "Action required": ladrilho de ícone pêssego com nuvem de upload, nome do documento 15 px, "Sarah ·
Income · Due Fri 25 Sep" cinza, botão "Upload" à direita (roxo cheio no item mais urgente, contornado no
seguinte). Ergond "Attachments · 2": ícone de arquivo + nome + selo verde "4 fields" (o que a IA já extraiu).

---

## 7. Estados vazios

**O que é.** O que a tela mostra quando não há nada. **Nenhuma das 61 telas de produto usa ilustração de
estado vazio** **[OBSERVADO]**. Em vez disso, o vazio vira informação. Seis formas:

| Forma | Onde | Receita |
|---|---|---|
| **Confirmação de que está tudo bem** | OrchestrateIQ handoff | caixa tint verde com círculo verde de check: "Nothing to fix on this run" + o motivo e o que continua vigiando ("FIX-117 is watching this edge in Monitor mode") |
| **Zero com contexto** | OrchestrateIQ Data coverage | KPI "Dropped events 0" + "no ingest rejections" |
| **Vaga hachurada** | OrchestrateIQ pistas no tempo, Mortgage etapas futuras | quadrado ou coluna com listras diagonais `line/hatch` `#CFCEDB` (token do Permitly) no lugar do conteúdo que ainda não existe |
| **Traço na célula** | AgentTrail heatmap | "–" pequeno no canto da célula sem risco |
| **Etapa bloqueada** | medspa celular | etapa a 40% de opacidade com "Tips unlock after your visit" |
| **Chat vazio com sugestões** | Automax | orbe + "Hi, There" + três cartões de ação sugerida |

**A regra.** O vazio diz por que está vazio e o que vai aparecer ali. Nunca "No data" sozinho.
