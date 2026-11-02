# App de entregas

**O mobile de referência.** A peça central é a do design ruim gerado por IA que vira design
pronto para produção: uma tela sozinha sobre cinza.

| Campo | Valor |
|---|---|
| Nome | app de entregas (minúsculo, logo em círculo com rota) |
| Setor | entrega e logística para pequenos vendedores online em Bangladesh (moeda ৳, bairros Mirpur, Dhanmondi, pagamento bKash) |
| Para quem | o vendedor (app "Shuto & Co."), o entregador ("[produto] Rider app") e o despacho (console web) |
| Tema | claro; tela `#FFFFFF`, moldura `#E7E7E7` **[MEDIDO]** |
| Plataforma | mobile (vendedor) + web (Ops console) |
| Acento | verde-escuro `#24483C` (cartão "Today's run"), lime `#C6F08C` (payout, botão +), laranja `#FE8C4E` ("Needs you"), lilás `#E0A8F0` (avatar, bKash) **[MEDIDO]** |

## Navegação

App: tab bar flutuante em pílula branca com 5 itens (Home, Deliveries, **+**
central em círculo lime, Money, Account); o item ativo vira pílula **preta** com
ícone e rótulo brancos. Cabeçalho com avatar colorido de iniciais ("S&"), nome da
loja, data e sino em círculo de borda.

Web (Ops console): sidebar com Operate (Control room, Live
map, Dispatch, Runs), Manage (Orders, Riders, Merchants, Zones & pricing, Money,
Support), Insight (Reports).

## Módulos

| Tela | Conteúdo |
|---|---|
| Home do vendedor | cartão verde "Today's run" (quem busca e quando, curva de rota em lime, 7 segmentos de progresso, o último laranja), dois cartões lado a lado (payout lime, "Needs you" laranja), lista "Ready for pickup" |
| Onboarding | "Sell today. Delivered tonight." com mapa ilustrado e chips "Cash on delivery", "Photo proof" |
| Money | saldo da noite em cartão verde, cash coletado e taxas, barras da semana |
| Nova entrega | formulário com "Filled from a pasted message" (IA lê o WhatsApp), escolha de tamanho em 3 cartões, velocidade |
| Ops console (rider) | 4 KPIs em cartões coloridos (lime, azul, lilás, laranja), linha de on-time, cash ledger, documentos |

![home](../galeria/06-produtos/home-vendedor.jpg)
![console](../galeria/06-produtos/ops-console.jpg)

## O que é específico deste setor

- Fala a língua do pequeno vendedor: "1 buyer hasn't confirmed", "If all 7 are
  delivered". Nenhum jargão de logística.
- Dinheiro em espécie é central (cash on delivery, cash ledger, "cash held now").
- Cartões grandes de cor chapada, cada cor com um papel (verde = rota, lime =
  dinheiro a receber, laranja = precisa de você).

## Como reproduzir

Tela 390 × 844; cartões com raio ≈28 px (em 390 de largura), gap 12 px, padding 16 px;
número de dinheiro ≈30 px semibold; tab bar pílula de 64 px de altura com sombra
suave.

## Mais telas da série

App de entregas reaparece numa peça de três telas (legenda: só o nome da categoria, app de entregas): a entrada "Sell today.
Delivered tonight.", a nova entrega **"Filled from a pasted message"** com Undo, e Money com o repasse da
noite.


![mobile boas vindas vender hoje](../galeria/06-produtos/mobile-boas-vindas-vender-hoje.png)
![mobile nova entrega preenchida](../galeria/03-padroes-de-ia/mobile-nova-entrega-preenchida.png)
![mobile dinheiro semana](../galeria/06-produtos/mobile-dinheiro-semana.jpg)

## Mais telas


Telas:

- App de entregas no iPhone: entrada "Sell today. Delivered tonight." com o cartão verde-escuro da entrega e chips de pagamento ![](../galeria/06-produtos/mobile-boas-vindas-vender-hoje.png)
- App de entregas no iPhone: "Money" com o repasse da noite em verde-escuro, cartões lima e lilás e barras da semana ![](../galeria/06-produtos/mobile-dinheiro-semana.jpg)
- App de entregas no iPhone: "New delivery" com a faixa lilás "Filled from a pasted message · Check the details below" e Undo ![](../galeria/03-padroes-de-ia/mobile-nova-entrega-preenchida.png)
