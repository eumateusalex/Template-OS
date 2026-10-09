# O papel mínimo por ferramenta

> O que se pede ao cliente em cada ferramenta, o que o papel deixa ver e o que
> ele não deixa fazer. **Nunca a senha do dono.** Os nomes de papel são os que
> cada painel mostra; conferir no painel no dia, porque eles mudam de nome. O
> que se pede a quem tem dado de terceiros é também questão de LGPD: o termo de
> acesso (`modelos/termo-de-acesso.md`) passa por advogado antes do uso real.

| Ferramenta | O papel que se pede | O que ele permite | O que ele NÃO permite |
|---|---|---|---|
| Google Analytics 4 | **Leitor** (Viewer) na propriedade | ver relatórios, eventos e conversões | mudar configuração, criar evento, adicionar pessoas |
| Search Console | **usuário restrito** | ver consultas, páginas e cobertura | enviar sitemap, pedir remoção, mudar configuração |
| Perfil da Empresa no Google | nenhum para ler (o perfil é público); **gerente** só quando o plano mandar mexer | como gerente: editar dados e responder avaliações | como gerente: transferir a propriedade, remover o dono |
| Meta Business (Facebook e Instagram) | **parceiro** com acesso de **análise** (insights e desempenho) aos ativos escolhidos; **nunca a tarefa de mensagens** | ver insights de página, conta e anúncios | ler a caixa de mensagens, publicar, pagar, mudar a forma de pagamento, adicionar pessoas |
| Google Ads | **somente leitura** | ver campanhas, custos e conversões | mudar lance, orçamento ou anúncio |
| WhatsApp | **nenhum acesso**: o cliente exporta uma amostra de conversas pelo próprio app | ler a amostra, depois de anonimizada (pelo cliente, ou à mão fora do Claude: o passo está no `SKILL.md`, "Dado de terceiros") | ver o número, mandar mensagem, ver o resto |
| CRM ou planilha | **nenhum acesso**: o cliente exporta, sem as colunas de contato quando a análise não usa | ler a exportação | entrar no sistema do cliente |

Todo acesso concedido vira uma linha do `ACESSOS.md` do cliente, com quem deu,
quando e para quê.
