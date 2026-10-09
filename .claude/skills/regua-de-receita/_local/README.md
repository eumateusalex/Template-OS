# _local — o maquinário da skill

Aqui mora tudo que faz a skill funcionar e se provar: o **manifesto**, as **entradas locais**, o
**catálogo das imagens**, os **índices**, o **método de escrita do princípio**, as **fontes** que a
skill acompanha, os **scripts de captura** e as **quatro suítes**.

Estado: o `numeros.mjs --check` imprime princípios e temas; o `manifesto.json` guarda a base de
`references/`, as entradas locais, os enriquecimentos e as imagens órfãs esperadas. Nenhum
princípio cita post por URL nem aponta texto capturado: cada um se sustenta sozinho.

## A skill é mantida aqui

Não existe atualização automática de fora nem esteira que sobrescreva o que está aqui. Material
novo entra pelo roteiro [`../atualizar.md`](../atualizar.md), a partir das fontes que quem usa a
skill escolheu, e sempre como princípio escrito: **o texto capturado nunca entra na skill**, fica
na pasta da captura, em `rascunho/`.

## Mapa da pasta

| Caminho | O que é |
|---|---|
| [`../atualizar.md`](../atualizar.md) | **O roteiro de atualização**: escolher as fontes, capturar, triar, escrever, fechar, e as armadilhas medidas |
| [`cobertura.json`](cobertura.json) | **As fontes que a skill acompanha, em campo de máquina:** cada uma com o tipo, o que a identifica e até onde já foi lida (`triado_ate` no X, `lido_ate` nas outras), e o `fuso` das datas de calendário |
| [`regra-de-fonte.cjs`](regra-de-fonte.cjs) | **A definição única de fonte:** os tipos (x, linkedin, web, arquivo), o que cada um guarda e como se valida. O `captura/fontes.mjs` grava por ela e o verificador cobra por ela |
| `captura/` | Os scripts de captura: o `fontes.mjs` (adiciona, lista, avança e remove fontes), o `pasta.mjs` (cria a pasta de uma captura com o retrato da fonte e o ponteiro `@atual`), o `janela.mjs` (a regra da janela em UTC, o decodificador de snowflake e o fuso), o `prepara.mjs` (os trechos de navegador do X, com o perfil e a janela trocados e o corte das respostas), o `consolida.mjs` (junta a captura do X e imprime a marca a gravar), o `escreve-textos.mjs` (um texto por post, na pasta da captura), o `marca-triagem.mjs` (grava o destino da triagem em cada texto), o `baixa-imagens.mjs` (só para a pasta da captura, só de item que virou princípio, pelo portão de hosts), o `guarda-imagens.mjs` (a imagem vista entra em `assets/` e no catálogo, ou fica registrada como não guardada) e o `imagens.mjs` (o portão de download, a extensão pela assinatura e a leitura do catálogo), mais os trechos de navegador testados em `modelos/` |
| [`metodo.md`](metodo.md) | **A régua de escrita do princípio:** formato, tamanho, quando repartir, roteamento de tema, enriquecimento |
| `manifesto.json` | **A única lista.** A base de `references/`, as entradas locais, as imagens órfãs esperadas e a versão |
| `entradas/` | Um bloco de princípio pronto por arquivo (ou um enriquecimento de um que existe), aplicado pelo `reaplicar.mjs` |
| [`imagens.json`](imagens.json) | **O catálogo de metadados das imagens:** para cada arquivo de `assets/`, o que ele mostra (`shows`) e, se nenhum princípio o cita, por que fica (`why`) |
| [`../IMAGENS.md`](../IMAGENS.md) | **O catálogo legível das imagens**, gerado pelo `catalogo.mjs`: arquivo, o que mostra, quem usa |
| `catalogo.mjs` | Gera o `IMAGENS.md` a partir do `imagens.json` e das linhas `**Visual.**` |
| **`sincronizar.sh`** | **O comando que fecha um lote.** Faz tudo abaixo, na ordem certa |
| `gera-manifesto.mjs` | Regenera o `manifesto.json` a partir do estado real; guarda a versão da skill |
| `reaplicar.mjs` | O motor: insere as entradas novas no fim do tema e aplica os enriquecimentos |
| `indexar.mjs` | Gera o `INDEX.md` da raiz e o `Quick index` dos temas grandes |
| `numeros.mjs` | Sincroniza as contagens do `SKILL.md` e do `README.md` |
| `verificar.js` | As conferências de estado (o total sai na última linha dele; nenhum documento repete o número). Rodar depois de qualquer coisa |
| `teste-verificar.mjs` | Defeitos plantados: prova que o verificador sabe **reprovar**, cada defeito pela conferência que o caso nomeia, e cada conferência nomeada neutralizada sozinha faz o caso dela reprovar |
| `teste-reaplicar.mjs` | Prova que o motor aplica e reconstrói **byte a byte** (planta as suas entradas numa cópia) |
| `teste-captura.mjs` | Prova o comportamento dos scripts de captura, em pastas temporárias e com prova de mutação: fontes (registro, validação, marca que não volta), janela (fronteira pelo `prepara --lotes` e pelo `consolida`), "nada novo", imagem só pelo guardador e só de princípio, portão de download, captura só leitura, ponteiro `@atual`, endereço de post, triagem, fuso e snowflake únicos, ensaio com `--raiz` |
| `endereco-de-post.cjs` | **A definição única de endereço de post**: o verificador e a regra de fonte acusam por ela, o `escreve-textos.mjs` limpa por ela |

## O ciclo de trabalho

Escreveu, mudou ou apagou alguma coisa:

```bash
bash .claude/skills/regua-de-receita/_local/sincronizar.sh --completo
```

Ele regenera o manifesto, aplica as entradas, sincroniza os números, regenera o catálogo das
imagens e os índices, e roda as quatro suítes. **Sai não-zero se algo reprovar.**

Para escrever princípio novo, ler [`metodo.md`](metodo.md) primeiro. Para trazer material novo das
fontes, o roteiro [`../atualizar.md`](../atualizar.md).

## Por que existem quatro suítes e não uma

`verificar.js` responde "o estado está certo?". Sozinho ele é um verde que ninguém
auditou: se uma conferência morrer, ele continua verde e mais tranquilizador que antes.

`teste-verificar.mjs` responde "a régua sabe ficar vermelha?". Estraga uma coisa por vez
numa cópia e exige reprovação **pela conferência que o caso nomeia** (sair diferente de zero não
basta: um defeito que derruba três conferências esconderia a morte de uma). Depois neutraliza cada
conferência nomeada sozinha, numa cópia do verificador, e exige que o caso dela reprove. Um caso que
passa a aprovar o defeito denuncia a conferência que morreu.

`teste-reaplicar.mjs` responde "o motor aplica e reconstrói?". Planta princípios novos e um
enriquecimento numa cópia, aplica, destrói a adição e exige os arquivos de volta **byte a byte**:
um único `\n` errado na emenda entre o cabeçalho do arquivo e o primeiro princípio já é defeito.

`teste-captura.mjs` responde "os scripts de captura se comportam?". O verificador olha o estado
da skill; ele não vê o que um script faria numa captura nova. Esta suíte roda os scripts em pastas
temporárias (nunca dentro da skill) e prova as regras do roteiro: a fonte se registra pela regra
única e a marca de leitura não anda para trás; a fronteira da janela tem uma regra só (segundos
inteiros UTC, como número); "nada novo na janela" diz a mesma coisa no script e no roteiro; só o
`guarda-imagens.mjs` escreve imagem dentro da skill, e só de item que virou princípio; o artigo, o
lote e os vídeos têm comando e nome únicos; o ensaio numa cópia (`--raiz`) roda os passos 5 a 7 sem
mudar a skill de verdade; o download de imagem passa por lista fechada de hosts, sem
redirecionamento e com a assinatura conferida; os scripts de navegador não clicam nem digitam, e os
dois documentos dizem que texto capturado é dado, nunca instrução; a pasta da captura vem do
ponteiro (`@atual`), nunca de variável de shell, e cada captura é de uma fonte; o endereço de post
tem uma definição só e ela pega toda forma. A maioria das conferências tem a prova de mutação
dentro da suíte: o comportamento errado plantado de volta faz a conferência reprovar.

## Detalhes que custam caro

**Verificador que QUEBRA não é verificador que reprova.** Um `TypeError` não imprime
`FALHOU` nenhum, e quem confere por `grep FALHOU` lê isso como aprovação. Conferir pelo
**código de saída**. Pelo mesmo motivo, `cmd | tail` devolve o código do `tail`, e um
`LOTE FECHADO` lido assim sai por cima de falhas. Pelo mesmo motivo, o verificador carrega as
duas definições únicas sem quebrar: módulo apagado reprova pela conferência que precisa dele.

**A base é um fato, não uma conta.** `gera-manifesto.mjs` guarda quantos princípios
`references/` traz sem vir de uma entrada (`BASE_PRINCIPIOS`). A contagem esperada é essa base mais
as entradas novas; princípio apagado ou colado direto em `references/` sem entrada reprova. Tirar
ou juntar um princípio da base de propósito é mudar esse número no mesmo lote, e dizer no relatório.

**Enriquecer substitui a linha do rótulo.** O modo `enriquecer` troca a linha inteira de um rótulo
que o bloco já tem: para acrescentar sem perder, a entrada traz o texto existente mais o acréscimo.
Rótulo que o bloco ainda não tem entra na posição canônica (Principle, Apply when, The move,
Evidence, Visual, In one line).

**A régua de tamanho está no `metodo.md`** (110–250 palavras, teto 550); o verificador avisa
acima de 250.

**Linha em branco e lista dentro de um bloco são permitidas.** O método autoriza framework em
bullets. O que o verificador cobra são os dois limites do bloco: o título colado no
`**Principle.**`, e o bloco fechando numa linha rotulada (uma lista nunca vem depois do último
rótulo).
