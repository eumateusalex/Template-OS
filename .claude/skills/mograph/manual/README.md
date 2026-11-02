# O manual

O saber da `/mograph` compilado: **uma entrada por técnica**, com a regra, os números, o som e o
que a realiza. A peça cita a entrada pelo id no `plano.json`, e a régua confere. Os módulos da
skill (`oficio.md`, `roteiro.md`, `sabatina.md`, a lente do crítico) dizem **como trabalhar**; o
manual diz **o que pôr na tela**. Regra de técnica mora aqui e só aqui: o módulo que precisa dela
aponta o id.

## 1 · Os formatos

A pasta da entrada é o formato dela, e o formato da peça vem do estilo (`.claude/skills/video/estilos.md`):

| Pasta | Formato | O que é | Estilos |
|---|---|---|---|
| `filme/` | `filme` | o comercial e o cinematográfico: 16:9, com o 9:16 da mesma linha do tempo | `comercial`, `documental`, `anuncio-google`, `bumper` |
| `reel/` | `reel` | o vertical de feed: legenda, elemento, ritmo de Reel | `motion`, `explica`, `falado-motion`, `anuncio-meta` |
| `comum/` | os dois | o que vale em qualquer peça: curva, tipografia, transição, mundo, som | todos |

A peça `filme` cita entradas de `filme/` e `comum/`; a `reel`, de `reel/` e `comum/`. Técnica de
`reel` numa peça `filme` (e o contrário) reprova: cada formato tem a sua gramática. O formato da peça
não é o campo `formato` do `plano.json`, que é o enquadramento do destino (o `formatos.json` da
`/video`): ele se lê do estilo.

## 2 · A entrada

```markdown
### comum.transicao.corte-na-curva
- **estado**: proposta
- **quando**: passar de cena na direção da corrente. **Não quando**: a cena seguinte começa parada
- **regra**: o herói sai acelerando, o corte cai no meio do movimento, e a próxima entra continuando e freia
- **parâmetros** (30 qps): a saída anda 12% do quadro; `power4.in` e `power4.out` espelhados; 0,6 s no total
- **som**: `whoosh-curto`, pico no quadro do corte
- **realiza**: `motor:transicao=curva`; `registro:cut-the-curve`
```

| Campo | O que leva |
|---|---|
| id (o título `###`) | `<pasta>.<arquivo>.<nome>`, minúsculo e com hífen; o prefixo bate com o lugar do arquivo. Id não muda: técnica renomeada mantém o id |
| `estado` | `firme`, `proposta` ou `recusado` (§ 3) |
| `quando` | a situação em que serve e, depois de "**Não quando**", a que não serve |
| `regra` | uma ou duas frases, em palavras próprias, sem nome de pessoa, de curso ou de marca |
| `parâmetros` | o número, com o qps entre parênteses quando é em quadros (a peça roda a 30; "60 → 30" é a conversão); "—" quando a técnica não tem número |
| `som` | o gesto do kit que acompanha (§ 4) e onde cai o pico, ou `nenhum` |
| `realiza` | o que constrói a técnica (§ 5) |

Uma técnica que serve aos dois formatos com números diferentes é uma entrada só, em `comum/`, com
os números de cada formato em `parâmetros`. Técnica que se repete com outro nome é a mesma entrada.

## 3 · O estado

| Estado | O que é | Na peça |
|---|---|---|
| `firme` | o padrão do ofício: técnica provada em peça, medição (zona segura, tempo de leitura) ou o que já é erro de régua | usa sem perguntar |
| `proposta` | ainda não testada numa peça da pessoa | entra sinalizada: a régua a lista, e a pessoa a vê na prancha ou na aprovação da peça |
| `recusado` | fere regra medida (o determinismo do render, os termos de um app) ou o padrão de ofício que a `regra` diz | nunca; citar reprova. A `regra` diz o porquê |

O estado muda pela pessoa: a proposta que entra numa peça que a pessoa aprovou vira `firme`, e o
`recusado` que ela quer de volta se reabre com o motivo escrito na `regra`.
O comportamento da biblioteca tem o estado dele em `biblioteca/catalogo.json`; o da entrada é o da técnica.

## 4 · Os gestos de som

O vocabulário do campo `som`. Quais arquivos tocam cada gesto é do kit (`kit/som.json`),
que dá de 3 a 5 por gesto, medidos e com o pico.

| Gesto | O que acompanha |
|---|---|
| `tecla` | cada letra digitada (o espaço não soa) |
| `clique` | o clique do cursor, o botão |
| `toque` | o dedo na tela, o elemento vivo que toca |
| `notificacao` | o aviso que chega |
| `pop` | o que nasce pequeno: o balão, o selo, o ícone |
| `plim` | o acerto com nota: o check, o número certo |
| `check` | a tarefa cumprida |
| `erro` | o não, a tentativa que falha |
| `registradora` | o valor, o dinheiro |
| `whoosh-curto` | o que anda rápido: o chicote, o corte, a entrada rápida |
| `whoosh-longo` | o que anda devagar: a câmera longa, o objeto que atravessa |
| `riser` | a tensão antes do pico |
| `impacto` | o pouso da ideia (1 a 3 por peça) |
| `golpe-tonal` | a nota que abre e fecha, no tom da trilha |
| `glitch` | a falha (só onde a marca permite) |
| `obturador` | o flash, a foto, o estalo de câmera |
| `rolagem` | a rolagem de tela, a roleta |
| `contagem` | o número que sobe |
| `cama` | o ar do mundo entre os efeitos |
| `drone` | a cama no tom |
| `silencio` | a vírgula antes do pico (é gesto: o som que se tira; não é efeito do `som.json`, e se corta na trilha) |

## 5 · O que realiza

| Valor | O que é |
|---|---|
| `biblioteca:<id>` | um comportamento de `biblioteca/catalogo.json` |
| `registro:<bloco>` | um bloco ou componente do registro do HyperFrames (`biblioteca.md`) |
| `ios:<nome>` | um construtor do `ferramentas/ios.cjs` (`conversa`, `ilha`, `toast`, `widget`, `busca`…), que a peça declara no `fonte/ios.json` e o `ios-vivo.mjs` leva à página (`comum.componentes.kit-vivo`) |
| `css:<classe>` | uma classe do CSS da marca da pessoa (`_marca/`); sem a classe na marca, a cena constrói e o valor é `mao` |
| `curva:<nome>` | uma curva de `ferramentas/curvas.js` |
| `motor:<campo>` | um campo do `plano.json` (`roteiro.md` § 3) que o motor da skill faz ou que a régua cobra (a transição, a vírgula, o tempo forte) |
| `kit:<parte>` | material do kit: `kit:som` (`kit/som.json`), `kit:3d` (`kit/3d.json`), `kit:lut` (`kit/lut.json`). O emoji e a imagem de clip-art não entram no kit (`comum.componentes.charme-premium`), e o emoji é o do sistema (`comum.componentes.emoji-do-sistema`) |
| `gerado` | matéria gerada por IA (vídeo ou imagem), com a marca em código por cima |
| `mao` | não há peça pronta: a cena constrói, e o `plano.json` escreve o motivo |

Mais de um vai separado por `;`. O `*` no fim do nome é a família inteira (`registro:transitions-*`).

## 6 · O mapa: a situação e onde ela está

| A cena precisa de… | Arquivo |
|---|---|
| câmera, profundidade, luz | `comum/camera-e-luz.md` |
| chão, fundo, composição, cor | `comum/mundo.md` |
| passar de uma cena para a outra | `comum/transicao.md` |
| curva, duração, entrada, saída, cascata, a causa | `comum/movimento.md` |
| texto, título, palavra-chave, digitação | `comum/tipografia.md` |
| ícone, aparelho, interface, selo, cursor | `comum/componentes.md` |
| brilho, partícula, grão, efeito | `comum/efeito.md` |
| som, trilha, mixagem | `comum/som.md` |
| cor e acabamento do filme, LUT | `filme/tratamento.md` |
| objeto 3D, produto, matéria gerada | `filme/3d-e-gerado.md` |
| o 16:9 e o 9:16, a entrega, a variação | `filme/entrega.md` |
| prender nos primeiros segundos, o ritmo, a pausa, os atos, o fim | `comum/estrutura.md` |
| a legenda e a palavra-chave do Reel | `reel/legenda.md` (a ficha que a renderiza é da `/cortes`) |
| a moldura, a notificação, o antes e depois, o selo e a interface no quadro vertical | `reel/elemento.md` |
| o tipo de cena do falado, a divisão da tela, o rosto, o zoom do falado | `reel/cena.md` |
| o gancho, a cadência, o rosto que volta, a música, o loop do feed | `reel/ritmo.md` |

## 7 · O material

O material do kit (o som, o 3D, a LUT e o emoji) mora em `material/`, dentro da skill, fora do git:
quem o põe lá é o `/instalar`. Os pacotes da própria pessoa se declaram no
`ferramentas/material.local.json` (o modelo é o `ferramentas/material.exemplo.json`) e não mexem no kit.

```bash
node .claude/skills/mograph/ferramentas/kit.mjs resolver som:tecla   # 3d:<id>, lut:<id>: os caminhos no material
node .claude/skills/mograph/ferramentas/kit.mjs conferir             # todo arquivo existe e o kit cobre o manual
```

Sem o material instalado, o `conferir` sai 1 e diz para rodar o `/instalar`: não medir não é passar.
