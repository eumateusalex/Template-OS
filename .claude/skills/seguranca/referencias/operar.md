# Modo Operar — depois que está no ar

> Carregado quando o pedido é "como monitorar", "vazou uma chave", "acho que fui
> invadido", "o que fazer agora", ou quando há sinal de comprometimento ativo.
>
> **Incidente em andamento tem precedência sobre qualquer outro modo.** Se há
> suspeita de acesso indevido acontecendo agora, ir direto para a seção 2.

---

## 1 · Rotina: o que acompanhar, e com que frequência

| Frequência | O quê | Requisitos |
|---|---|---|
| **Contínuo, automatizado** | Falha de autenticação, recusa por permissão, bloqueio por limite, taxa de erro por rota, disponibilidade externa | `MON-01` `MON-05` |
| **Semanal** | Alertas que dispararam e o que foi feito. Dependências com falha publicada | `MON-02` `SUP-01` |
| **Mensal** | Quem tem acesso a quê. Exceções vencidas. Consumo contra as cotas contratadas | `PPL-01` `GOV-03` `RES-01` |
| **Trimestral** | Exercício de restauração. Rotação de credencial de serviço. Revisão do registro de riscos | `BCP-02` `SEC-09` `RSK-01` |
| **Anual, ou a cada mudança grande** | Auditoria completa. Teste de invasão em sistema crítico | modo auditar · `VER-04` |

### Os sinais que importam, e o que cada um significa

| Sinal | Significado provável | Ação |
|---|---|---|
| Volume de falha de autenticação numa mesma conta | Tentativa de adivinhação | Confirmar que o limite está ativo. Avisar o titular |
| Volume de recusa por permissão | **Sondagem**: alguém testando o que alcança | Investigar a origem. É sinal de reconhecimento em curso |
| Volume de recurso não encontrado numa mesma conta | **Enumeração de identificadores** | Investigar. Confirmar `ACC-03` nas rotas envolvidas |
| Requisições a caminhos que nunca existiram | Varredura automatizada | Normal em volume baixo. Padrão dirigido merece atenção |
| Erro concentrado numa rota específica | Alguém testando aquela rota ativamente | Olhar o que mudou nela e o que está sendo enviado |
| Credencial de serviço usada de origem nova | **Possível vazamento de credencial** | Tratar como incidente até provar o contrário |
| Consumo de recurso pago fora do padrão | Abuso, laço no código, ou credencial vazada | Verificar cota e origem |

> **Pico de recusa por permissão é o sinal mais subestimado.** Ele antecede o
> incidente: alguém está mapeando o que consegue alcançar antes de agir.

---

## 2 · Incidente: a primeira hora

**Ordem importa.** Conter sem destruir a evidência. O erro mais comum é apagar
tentando resolver rápido, e perder a única chance de saber o que aconteceu.

### Passo 1 · Preservar, antes de qualquer limpeza

- Copiar os registros do período para local separado, **antes** de reiniciar
  qualquer coisa
- Fotografar o estado: o que está rodando, conexões ativas, processos
- **Não** reiniciar, **não** recriar contêiner, **não** apagar registro

> Preservar leva minutos. Não preservar é irreversível. É `IRP-03`.

### Passo 2 · Conter

- Revogar as sessões ativas da conta ou do sistema afetado
- Rotacionar a credencial suspeita, e as que ela alcançava
- Se necessário, isolar o serviço em vez de derrubá-lo por inteiro
- **Usar credencial diferente da comprometida durante toda a resposta**

### Passo 3 · Avaliar o alcance

Três perguntas, e a resposta precisa vir da trilha, não da memória:

1. **O que foi acessado?** Quais registros, de quais titulares
2. **Por quanto tempo?** Desde quando o acesso indevido existe
3. **O que foi alterado ou levado?** Leitura e escrita têm consequências diferentes

Se a trilha não responde, isso é achado para `IRP-05`: da próxima vez precisa
responder.

### Passo 4 · Comunicar

Conforme `IRP-04`, e nesta ordem: internamente, ao cliente quando o sistema é
dele, ao titular do dado, e à autoridade quando exigido.

O conteúdo mínimo: o que aconteceu, quando, que dado foi afetado, o que já foi
feito, e o que o afetado deve fazer.

> **Não comunicar externamente antes de conhecer o alcance**, porque a correção
> pública depois é pior. E não demorar além do prazo legal. O plano escrito é o
> que equilibra os dois sob pressão.

### Passo 5 · Erradicar e restaurar

- Corrigir a causa, não apenas o sintoma
- Restaurar a partir de cópia **anterior ao comprometimento**, se necessário
- Confirmar que o acesso indevido não persiste antes de reabrir

### Passo 6 · Aprender

`IRP-05`: análise de causa sem procurar culpado, focada em como o sistema
permitiu. **Saída obrigatória: pelo menos uma mudança permanente** — requisito
novo, controle novo, ou verificação nova. Incidente que não muda nada se repete.

---

## 3 · Casos específicos frequentes

### Credencial vazou

1. **Rotacionar imediatamente.** Remover do repositório, apagar a mensagem ou
   reescrever o histórico **não resolve**: quem copiou continua com ela
2. Levantar onde ela era usada, antes de revogar, para não derrubar integração
3. Verificar uso indevido no período entre o vazamento e a rotação
4. Se foi para repositório público, considerar comprometida desde o primeiro
   segundo: rotinas automatizadas varrem em minutos
5. `SEC-08` e `SEC-03` viram verificação recorrente depois disso

### Banco estava aberto

1. Fechar primeiro: ativar a política, começando pelas tabelas com dado pessoal
2. Levantar o que foi acessado pelos registros do provedor
3. **Se houve acesso a dado pessoal, é incidente com obrigação de comunicação**
4. `DAT-12` vira verificação recorrente: tabela nova nasce sem política

### Suspeita de acesso indevido a conta de usuário

1. Revogar as sessões daquela conta
2. Forçar troca de credencial, o que também encerra as demais sessões (`SES-05`)
3. Verificar o que foi acessado no período
4. Avisar o titular pelo canal secundário
5. Se houve padrão em várias contas, é sinal de credencial vazada em outro
   serviço sendo testada aqui: `IDN-03` e `IDN-04` sobem de prioridade

### Consumo de serviço pago disparou

1. Verificar se é uso legítimo, laço no código, ou abuso externo
2. Aplicar teto imediato, mesmo que provisório
3. Se for credencial vazada, tratar como a seção acima
4. `BIZ-10` e `AIA-05` viram obrigatórios

---

## 4 · O que deixar preparado antes de precisar

Nenhum destes se improvisa sob pressão:

- [ ] `IRP-01` — plano escrito, com responsáveis nomeados
- [ ] `IRP-02` — a sequência da primeira hora, executável por quem estiver de plantão
- [ ] `IRP-04` — modelo de comunicação pronto, e a cadeia acordada com clientes
- [ ] `BCP-02` — restauração já exercitada, com o tempo medido
- [ ] `BCP-04` — o que decifra a cópia guardado fora dela
- [ ] `LOG-01` — trilha registrando desde antes do incidente. **Não dá para
      auditar retroativamente o que nunca foi registrado**
- [ ] Credencial de emergência, guardada fora dos sistemas que ela recupera

---

## Armadilhas deste modo

**Destruir evidência tentando resolver rápido** é o erro mais comum e o mais
caro. Reiniciar, recriar e limpar apagam a única chance de entender o alcance.

**Rotacionar sem mapear os pontos de uso** derruba integrações no meio do
incidente, o que transforma um problema em dois.

**Comunicar cedo demais ou tarde demais.** Cedo, antes de conhecer o alcance,
gera correção pública. Tarde é descumprimento. O plano escrito resolve isso
antes, com a cabeça fria.

**Encerrar o incidente na correção.** Sem `IRP-05`, o mesmo caminho volta a ser
usado, e a segunda vez é sempre mais cara que a primeira.

**Análise que aponta pessoa em vez de processo** faz o próximo incidente ser
escondido, que é o pior resultado possível.
