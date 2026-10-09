# dados/ — drop zone

Largue aqui qualquer arquivo que deva ser lido uma única vez pelo sistema: CSV
de exportação do Google Ads, planilha de vendas, PDF de contrato,
transcrição de reunião, captura de tela de relatório.

Skills como `/analisar-dados` e `/relatorio-ads` leem diretamente dessa pasta.
Basta adicionar o arquivo, executar o comando e receber o resumo.

Não é um arquivo final — é uma entrada. O conteúdo relevante que está aqui se
transforma em artefato em `_memoria/`, `marketing/` ou `saidas/`.

Quando houver MCPs de armazenamento conectados (Google Drive,
Notion), é possível solicitar ao Claude que busque os arquivos diretamente da
fonte, sem necessidade de baixá-los para esta pasta.
