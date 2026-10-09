# _local/ — o maquinário de atualização da /design-de-produto

Tudo o que a skill precisa para acompanhar as referências que você escolher: perfis públicos do X que
publicam tela de produto SaaS ou de IA. O passo a passo está no [../atualizar.md](../atualizar.md).

| O quê | Onde |
|---|---|
| as referências acompanhadas e até onde cada uma está em dia (`referencias.<handle>`: `nome`, `triado_ate`, `ate`) e o fuso | `cobertura.json` |
| o texto integral de cada post capturado, um arquivo por post, sem endereço de post | `fontes/posts-x/`, `fontes/respostas-x/` (e `fontes/artigos-x/` quando houver), criadas na primeira captura |
| a captura consolidada e as respostas cortadas, por data | `fontes/_bruto/`, criada na primeira captura |
| o que cada imagem da galeria mostra, se é da base ou de que captura veio, e de que post | `galeria.json` (gera `../biblioteca/galeria/INDICE.md`) |
| os scripts de captura, folhas de contato, catalogação e o guardador do bruto | `captura/` |
| as regras únicas que todo script importa (nenhuma tem segunda cópia) | `captura/janela.mjs` (tempo, snowflake, id da captura, fuso), `captura/endereco.mjs` (endereço de post), `captura/imagem.mjs` (download e assinatura), `captura/pasta.mjs` (pasta da captura e pastas de fonte, que podem não existir num clone limpo), `captura/referencia.mjs` (a referência da captura e a entrada dela no `cobertura.json`) |
| fonte → arquivo de fonte; fonte → onde entrou na biblioteca; índice da galeria | `escreve-fontes.mjs`, `indexa-fontes.mjs`, `indexa-galeria.mjs` |

A régua da biblioteca e os testes ficam em `../scripts/` (`confere-biblioteca.mjs`,
`teste-confere-biblioteca.mjs` e `teste-captura.mjs`). Imagem nunca mora aqui: o download vai para a pasta da
captura, fora da skill, e só a imagem vista e nomeada entra na galeria.
