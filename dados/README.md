# dados/ — drop zone

Largue aqui qualquer arquivo que deva ser lido uma única vez pelo sistema: CSV
de exportação do Google Ads, planilha de vendas, PDF de contrato,
transcrição de reunião, captura de tela de relatório.

Skills como o `/relatorio-ads` e o `/converter` leem diretamente dessa pasta.
Basta adicionar o arquivo, executar o comando e receber o resumo.

O acervo de transcrições da `/oferta`, se você montar um, mora em
`dados/acervo-oferta/` (o molde está em "Montar o acervo", no `SKILL.md` da <!-- caminho futuro: o acervo que você monta, fora do git -->
skill). Ele é a exceção desta pasta: fica, porque a skill busca nele a cada
pergunta.

O leitor de métricas do Instagram (`scripts/instagram/insights.mjs`) grava aqui,
em `insights/<conta>/<dia>.json`, fora do git.

Não é um arquivo final — é uma entrada. O conteúdo relevante que está aqui se
transforma em artefato em `_memoria/`, `marketing/` ou `saidas/`.

Quando houver MCPs de armazenamento conectados (Google Drive,
Notion), é possível solicitar ao Claude que busque os arquivos diretamente da
fonte, sem necessidade de baixá-los para esta pasta.
