# App de cartas de cobrança

**Carta de cobrança jurídica escrita com IA, conferida por advogado.** 4 peças em dez dias. A peça
de abertura só nomeia a categoria (espaço de trabalho de carta de cobrança jurídica com IA), com o
celular na continuação (legenda de uma palavra, "mobile").
**[CONFIRMADO]**

| Campo | Valor |
|---|---|
| Setor | escritório de advocacia de danos pessoais: casos, documentos, cartas de demanda, modelos, citações |
| Para quem | o advogado ("Good morning, [nome] · 12 active cases · 4 demand letters in progress") |
| Tema | claro sobre cinza `#D8D8D8` de moldura **[MEDIDO, amostra quantizada]** |
| Plataforma | web (painel, Finalize & Export) + celular (home, ficha do caso, linha do tempo) |
| Acento | lavanda (casos ativos, o PDF escolhido) e lima-oliva `#C0CC78` (rascunhos, valor da demanda) em cartões inteiros; preto nos botões **[MEDIDO, amostra quantizada]** |
| Navegação | barra de abas preta em pílula no topo (Dashboard, Cases, Documents, Demand Letters, Templates, Citations, Settings), sem sidebar |

## O que cada tela tem

- **Painel** — quatro KPIs em cartões coloridos (42 casos ativos em lavanda, 8 rascunhos em lima,
  5 para revisão em lima-claro, 24 concluídos de 30 com barra de meta), a tabela "Recent cases"
  com a etapa em barra segmentada e selo, "Needs your attention" com três itens e o "Letter
  pipeline" em barras por etapa (Evidence, Drafting, Review, Finalized).
  ![painel](../galeria/06-produtos/painel-casos.jpg)
- **Celular** — a mesma home em grade 2×2 com a barra inferior flutuante preta; a ficha do caso
  "Johnson v. Miller" com o cartão lavanda da carta ("87% evidence-supported", "Open letter"); e
  a linha do tempo em que cada evento tem uma chave **"Used by AI when drafting"**: o advogado
  decide qual fato a IA pode usar. Ver
  [../03-padroes-de-ia/04-rastreabilidade.md](../03-padroes-de-ia/04-rastreabilidade.md).
  ![home celular](../galeria/06-produtos/mobile-home.jpg)
  ![ficha do caso](../galeria/06-produtos/mobile-ficha-do-caso.jpg)
  ![linha do tempo](../galeria/03-padroes-de-ia/mobile-linha-do-tempo-usada-pela-ia.jpg)
- **Cartões isolados** (a peça dos cartões pequenos que somados fazem a tela inteira, a mais
  salva da série, 311): Export (PDF, DOCX, Copy em cartões; duas chaves; "Finalize Demand
  Letter"), Final Review (demanda de $125,000 em lima, 18 documentos, "24, all verified" de
  citações, revisão do advogado "Completed") e "Visits by week" em barras empilhadas.
  ![exportar](../galeria/02-componentes/cartao-exportar-carta.png)
  ![revisão final](../galeria/02-componentes/cartao-revisao-final.jpg)
  ![visitas](../galeria/02-componentes/cartao-visitas-por-semana.png)
- **Finalize & Export** — o popup de sucesso "Demand letter finalized · Draft v3 is locked and
  saved" com o que foi gerado e "Send to adjuster", por cima da prévia da carta, que é a única
  coisa em serifa da tela (o documento jurídico parece documento).
  ![finalizada](../galeria/02-componentes/popup-carta-finalizada.jpg)

## O que a série ensina

- **O controle da IA fica no dado, não numa tela de configuração**: uma chave por evento da linha
  do tempo, "evidence-supported" em porcentagem na carta, "all verified" nas citações.
- **Serifa só no artefato que sai do produto** (a carta). A interface continua sans.
- **Cartão isolado como peça**: três cartões pequenos, cada um uma decisão, renderam mais
  salvos que a tela inteira.

## Mais telas

- Ganhou a carta com edição por trecho (Regenerate, Shorten, Expand) e o celular com a folha de citações e "The AI will use 18 documents · 46 facts".

Telas:

- App de cartas de cobrança: popup "Demand letter finalized" sobre "Finalize & Export", com o que ficou travado, "Download PDF" e "Send to adjuster" ![](../galeria/02-componentes/popup-carta-finalizada.jpg)
- App de cartas de cobrança: "Case Timeline" com a chave "Used by AI when drafting" por evento e o cartão lima "38 days from accident to draft" ![](../galeria/03-padroes-de-ia/linha-do-tempo-usada-pela-ia.jpg)
- App de cartas de cobrança: caso Johnson v. Miller com abas, cartões Accident e Injuries e cartões coloridos de tratamento e despesas ![](../galeria/06-produtos/caso-com-cartoes-coloridos.jpg)
- App de cartas de cobrança: cartão "Demand letter" com "87% evidence-supported", 24 citações, 2 claims to review e atividade com o rascunho da IA ![](../galeria/03-padroes-de-ia/carta-com-evidencia-percentual.jpg)
- App de cartas de cobrança: "Case Timeline" com eventos datados, o documento de cada um e o filtro "Used by AI when drafting" ![](../galeria/04-tipos-de-tela/linha-do-tempo-do-caso.jpg)
- App de cartas de cobrança: lista de documentos com chave "Used by AI when drafting" e o cartão verde "Treatment span 38 days" com visitas por semana ![](../galeria/03-padroes-de-ia/chave-usado-pela-ia-por-documento.jpg)
- App de cartas de cobrança: carta "Johnson v. Miller" com 87% evidence-supported, barra de edição sobre o trecho (Regenerate, Shorten, Expand) e citações ao lado ![](../galeria/03-padroes-de-ia/carta-com-citacoes-e-edicao-por-trecho.jpg)
- App de cartas de cobrança no iPhone: "Case file" Johnson v. Miller com o cartão lavanda da carta 87%, tratamento e despesas em cartões coloridos ![](../galeria/06-produtos/ficha-do-caso-iphone.jpg)
- App de cartas de cobrança no iPhone: "Damages" com total conhecido e valor pedido, itens com selo Verified/Review/Estimate e "Insert into Demand Letter" ![](../galeria/06-produtos/danos-economicos-e-morais-iphone.jpg)
- App de cartas de cobrança no iPhone: "Create letter" com "The AI will use 18 documents · 46 facts", tipo, destinatário, evidências e "Generate Draft" ![](../galeria/03-padroes-de-ia/criar-carta-com-o-que-a-ia-usa-iphone.png)
- App de cartas de cobrança no iPhone: folha "Citations" com a afirmação, a evidência que a apoia com página e "Citation status · Supported" ![](../galeria/03-padroes-de-ia/citacoes-da-afirmacao-iphone.jpg)
