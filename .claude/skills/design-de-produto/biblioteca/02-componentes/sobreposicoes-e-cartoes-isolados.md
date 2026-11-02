# Sobreposições, cartões isolados e outras peças

Componentes que aparecem nas séries mais recentes e completam o catálogo. Cada um com anatomia,
onde aparece e como reproduzir. Medidas em proporção da peça quando a imagem é recorte e não dá
fator confiável. **[OBSERVADO nas telas citadas]**

## 1. Popup de decisão centralizado

Modal branco de raio do nível de cartão, centrado sobre a tela inteira **escurecida** (véu cinza
uniforme, sem desfoque), com: ícone em ladrilho no canto superior esquerdo, título em frase, uma
linha de contexto, o conteúdo da decisão, e o rodapé com o cancelar fantasma à esquerda do botão
principal na cor do produto. Cinco deles renderam como peça própria
(as legendas só nomeiam o popup e pedem opinião sobre o acabamento: o quanto ele é limpo, a
decisão fácil, a versão escura, o popup do construtor de lógica).

| Onde | O que decide | O que tem de próprio |
|---|---|---|
| Assistente de reembolso — Edit condition | a regra de um ramo | o replay "47 would take Then and 3 would take Else" logo acima do rodapé |
| App de recuperação de garantia — Invite teammate | quem entra e com que papel | papéis em rádio com a frase do que cada um faz; filial e limite de envio |
| App de cartas de cobrança — Demand letter finalized | (sucesso) o que foi gerado | lista do que saiu e dois caminhos: Download PDF / Send to adjuster |
| Painel de pagamentos de agentes — New wallet (escuro) | o limite de um agente | de onde sai o dinheiro e quanto sobra, escritos antes de criar |
| App de manutenção predial — Send the job to Mike's Plumbing | o envio ao prestador | o que cada um recebe, escrito pelo sistema e editável |

![edit condition](../galeria/03-padroes-de-ia/popup-editar-condicao-replay-assistente-reembolso.jpg)
![convite](../galeria/02-componentes/popup-convidar-colega.jpg)
![finalizada](../galeria/02-componentes/popup-carta-finalizada.jpg)
![carteira](../galeria/03-padroes-de-ia/modal-nova-carteira-agente-escuro.jpg)

**Como reproduzir:** véu `rgba` do texto principal a cerca de 40% sobre a tela; modal com largura de
480 a 560 px em tela 1440; padding da escala grande; o botão principal é o único colorido.

## 2. Popup de notificações ancorado

Painel suspenso que sai do sino, com abas em pílula (All, Incidents, Fixes, System), cada aviso
em uma linha com ícone de estado, título, uma linha de contexto e a hora à direita, e no pé
"Notification settings" e "View all activity". O fundo da página fica escurecido como no popup de
decisão. Peça própria, com legenda que pergunta se o popup de notificação não sobrecarrega (painel de agentes hospitalares). ![notificações](../galeria/02-componentes/popup-notificacoes.jpg)

## 3. Barra flutuante de seleção

Barra preta em pílula que aparece no pé da tabela quando há linhas marcadas: contagem e soma ("2
selected · $4,670 · both fabricante de climatização"), a ação em lote em botão branco ("Submit to fabricante de climatização") e o fechar.
É a única peça escura da tela. (app de recuperação de garantia, Claims.)
![claims](../galeria/04-tipos-de-tela/fila-de-claims.jpg)

## 4. Cartão de recurso (ilustração + título + frase)

Cartão branco de cantos grandes com uma **ilustração feita da própria interface** na metade de cima
(barras de custo, barras de replay com o trecho final em vermelho, dois nós em loop) sobre fundo
cinza-claro, e embaixo um título curto e uma frase de uma linha e meia. Serve a landing e a peça de vitrine:
a legenda gaba o cartão com descrição clara e pede confirmação; um deles virou vídeo de
4:5 que abre o detalhe no lugar.

![custo por aresta](../galeria/02-componentes/cartao-recurso-custo-por-aresta.jpg)
![replay](../galeria/02-componentes/cartao-recurso-replay-30-dias.jpg)
![loop](../galeria/02-componentes/cartao-recurso-deteccao-de-loop.jpg)

## 5. Cartão isolado como peça

Um único cartão do produto, recortado com a sombra e a borda, centrado num quadro de retrato cinza
ou preto. Publique em trios: três cartões, três decisões (app de cartas de cobrança: exportar, revisão final,
visitas; app de autorização prévia: taxa de aprovação, revisão da IA, chance de aprovação; painel de auditoria de agentes: pesos,
evidências, integração; app de despesas com IA: autonomia, extrato, empresa). Ver o formato em
[../05-apresentacao/sequencia-do-post.md](../05-apresentacao/sequencia-do-post.md).

![exportar](../galeria/02-componentes/cartao-exportar-carta.png)
![revisão final](../galeria/02-componentes/cartao-revisao-final.jpg)
![visitas](../galeria/02-componentes/cartao-visitas-por-semana.png)
![taxa de aprovação](../galeria/02-componentes/cartao-taxa-de-aprovacao.png)
![pesos](../galeria/02-componentes/cartao-pesos-por-categoria-escuro.jpg)

## 6. Seletor de quantidade (−/+)

Linha com o nome da etapa e o guia embaixo ("Guide: up to 1.0 h"), e à direita um grupo de três
peças: botão −, valor em mono ("0.5 h"), botão +. O total fica num bloco no fim da lista. (app de recuperação de garantia,
detalhamento de mão de obra.) ![mão de obra](../galeria/06-produtos/mobile-detalhamento-mao-de-obra.png)

## 7. Comparador antes e depois

Foto partida ao meio com a alça circular no centro, rótulos "Before · 30 Apr" e "After · 12 Aug" nos
cantos, seletor de ângulo em pílulas embaixo (Front, Left, Right, Smile) e o aviso de privacidade.
(app da clínica de estética, perfil da cliente e app do paciente.)
![antes e depois](../galeria/06-produtos/mobile-tratamento-antes-depois.jpg)

## 8. Tela de bloqueio com widget e notificação acionável

O produto aparece fora dele: widget na tela de bloqueio com o número do dia ("$184,200 needs you",
"Dog Cap launch · ROAS 4.2x") e notificações com dois botões de resposta ("All good" / "Reply",
"Dismiss" / "Open chat"). Primeira tela do trio de celulares em app de contas a receber, estúdio de anúncios, app da clínica de estética, painel de licenciamento solar
e painel de pagamentos de agentes. ![bloqueio](../galeria/06-produtos/ios-tela-bloqueio-notificacoes.jpg)
![flow assist](../galeria/03-padroes-de-ia/mobile-notificacoes.jpg)

## 9. Cartão de kanban

Cartão branco numa coluna de etapa: título do pedido, quem, o logo do terceiro (plano de saúde), o
número que decide (chance de aprovação "78%" com barrinhas coloridas pela faixa) e duas células no
pé (o que falta, o prazo). Em painel de integração de empresas: selo de área colorido, frase do problema, prazo, valor por ano
em mono e avatares.
![kanban](../galeria/04-tipos-de-tela/pipeline-de-autorizacoes-kanban.jpg)
![pendências](../galeria/04-tipos-de-tela/quadro-de-pendencias.jpg)

## 10. Cabeçalho com foto do objeto

O topo do detalhe leva a foto real do objeto (o prédio, o imóvel) com o nome grande e os números
dele numa linha. Em ERP de facilities o nome vem também em árabe. Em app de locação residencial, a grade de imóveis usa a
mesma foto como capa do cartão.
![prédio](../galeria/06-produtos/predio-inteligencia-escuro.jpg)

## Mais exemplos

Os dez componentes acima, em mais telas; nenhum deles muda de regra.
Exemplos, pelo número do componente:

- **1. Popup de decisão centralizado** — app de homologação de fornecedor "Approve Lanternfish?" (contrato, risco, sign-offs e a
  confirmação marcada antes de "Approve vendor"); painel de pagamentos de agentes "Import agents from the SDK" (agentes
  marcáveis e a nota de que nada gasta ainda); painel de margem de serviços "Share job #5819"; app de recuperação de garantia "Add evidence";
  estúdio de anúncios "New campaign" e "Remix 19 ads" escuros.
  ![aprovar](../galeria/02-componentes/popup-aprovar-fornecedor-escuro.jpg)
  ![importar](../galeria/02-componentes/popup-importar-agentes-escuro.jpg)
  ![compartilhar](../galeria/02-componentes/popup-compartilhar-servico.jpg)
  ![evidência](../galeria/02-componentes/popup-adicionar-evidencia.jpg)
  ![nova campanha](../galeria/02-componentes/popup-nova-campanha-escuro.jpg)
  ![remixar](../galeria/02-componentes/popup-remixar-anuncios-escuro.jpg)
- **2. Popup de notificações ancorado** — painel de inteligência de pagamentos (abas Todas / Não lidas / Alertas e uma ação por
  alerta: "Investigate", "Mute 1 hour"); a busca global do app de manutenção preditiva aberta no mesmo lugar, com a
  pergunta à IA no pé.
  ![notificações](../galeria/02-componentes/painel-de-notificacoes-com-acao.jpg)
  ![busca](../galeria/02-componentes/busca-global-com-pergunta.jpg)
- **Folha de baixo no celular** (variação do 1) — app de homologação de fornecedor "Approve with Face ID".
  ![face id](../galeria/02-componentes/folha-aprovar-com-face-id-escuro.jpg)
- **4. Cartão de recurso** — três cartões de recurso lado a lado (custo por passagem, replay
  de 30 dias, detecção de laço).
  ![custo](../galeria/02-componentes/cartao-recurso-custo-por-aresta.jpg)
  ![replay](../galeria/02-componentes/cartao-recurso-replay-30-dias.jpg)
  ![laço](../galeria/02-componentes/cartao-recurso-loop-de-agentes.jpg)
- **5. Cartão isolado como peça** — app de homologação de fornecedor escuro (o que será checado, risco por área), app de consultoria com IA
  (conversas respondidas pela IA, evidência contra a faixa, atividade), painel de contratos e SLA (precisa de atenção,
  obrigações do mês), estúdio de anúncios (cores e tipografia da marca), estúdio de anúncios "Generating concepts".
  ![checagens](../galeria/02-componentes/cartao-o-que-sera-checado-escuro.jpg)
  ![risco](../galeria/02-componentes/cartoes-risco-por-area-escuro.jpg)
  ![conversas](../galeria/02-componentes/cartao-conversas-respondidas-pela-ia.jpg)
  ![evidência](../galeria/02-componentes/cartao-evidencia-contra-faixa.jpg)
  ![atividade](../galeria/02-componentes/cartao-atividade-dos-clientes.jpg)
  ![atenção](../galeria/02-componentes/cartao-precisa-de-atencao.jpg)
  ![obrigações](../galeria/02-componentes/cartao-obrigacoes-do-mes.jpg)
  ![cores](../galeria/02-componentes/cartao-cores-da-marca-escuro.png)
  ![tipografia](../galeria/02-componentes/cartao-tipografia-da-marca-escuro.png)
  ![gerando](../galeria/02-componentes/cartao-gerando-conceitos-escuro.jpg)
- **9. Cartão de kanban** — app de homologação de fornecedor escuro (risco, prazo, o que falta, porcentagem, anexos).
  ![kanban](../galeria/02-componentes/cartao-kanban-fornecedor-escuro.jpg)
- **Menus e listas isoladas** (variação do 5) — app da clínica de estética: troca de unidade, ações do cliente com
  atalhos de teclado e submenu, as oito etapas da jornada.
  ![unidade](../galeria/02-componentes/seletor-de-unidade.jpg)
  ![ações](../galeria/02-componentes/menu-de-acoes-do-cliente-com-atalhos.jpg)
  ![etapas](../galeria/02-componentes/lista-de-etapas-da-jornada.jpg)
- **Formulário longo** (ver [formularios-e-config.md](formularios-e-config.md)) — console de agentes de voz "Create
  agent" e o editor de passo do app de consultoria com IA.
  ![criar agente](../galeria/02-componentes/formulario-criar-agente-escuro.jpg)
  ![passo](../galeria/02-componentes/editor-de-passo-com-instrucao.jpg)
- **Mais exemplos**:
  - 1. Popup de decisão: app de autorização prévia "Submit to [operadora de saúde]?" com a chance de aprovação e a frase de
    responsabilidade; painel de integração de empresas "Create issue" aberto a partir da variação do EBITDA, com a evidência já anexada;
    estúdio de anúncios "New campaign" sobre o Brand Brain.
    ![enviar](../galeria/02-componentes/popup-enviar-autorizacao.jpg)
    ![criar problema](../galeria/02-componentes/popup-criar-problema-com-evidencia.jpg)
    ![nova campanha](../galeria/02-componentes/popup-nova-campanha-sobre-marca-escuro.jpg)
  - Gaveta lateral (variação do 1): app de recuperação de garantia "Request from Luis Herrera", com o que falta marcado e a
    mensagem pronta para o técnico.
    ![gaveta](../galeria/02-componentes/gaveta-pedido-ao-tecnico.jpg)
  - 5. Cartão isolado: estúdio de anúncios escuro (conceito de anúncio em 9:16, oportunidade "+$1.4k a month",
    "Generating concepts"), painel de contratos e SLA "Needs attention" e o cartão de navegação "Set up [produto]".
    ![conceito](../galeria/02-componentes/cartao-conceito-de-anuncio-escuro.jpg)
    ![oportunidade](../galeria/02-componentes/cartao-oportunidade-escuro.jpg)
    ![gerando](../galeria/02-componentes/cartao-gerando-conceitos-2-escuro.jpg)
    ![atenção](../galeria/02-componentes/cartao-precisa-de-atencao-2.jpg)
    ![navegação](../galeria/02-componentes/cartao-menu-de-navegacao-escuro.jpg)
