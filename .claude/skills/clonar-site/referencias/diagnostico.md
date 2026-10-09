# diagnostico.md — o clone está errado. Por onde começar?

> Não é uma lista de defeitos — essa é o `armadilhas.md`. É o **método de achar qual defeito é**, na ordem que
> economiza trabalho.

---

## 🚨 Passo zero, sempre: a LINHA DE BASE

Antes de investigar qualquer divergência, responder com número:

> **O que este clone tinha ANTES de eu escrever qualquer camada?**

```powershell
$env:APP = "$C\app"; $env:MED = $M
$env:MODO = "desligar"; node "$S\scripts\linha-de-base.mjs"
cd $env:APP; npm run build
node "$S\scripts\compara-geometria.mjs"      # ← este é o número da BASE
$env:MODO = "religar"; node "$S\scripts\linha-de-base.mjs"
cd $env:APP; npm run build
node "$S\scripts\compara-geometria.mjs"      # ← este é o número COM a camada
```

Medido no site-exemplo, na mesma home, no mesmo instante:

| | elementos fora do lugar |
|---|---|
| clone COM a camada | **45** |
| clone PURO, camada desligada | **29** |
| a camada **acrescenta** | **16** |

Sem esse número, as horas seguintes se gastam perseguindo defeitos da camada
achando que são da captura.

🚨 **Se a camada piora, ela sai antes de qualquer outra coisa.** Não se
investiga divergência em cima de uma camada que está criando divergência.

---

## A escada do diagnóstico

Quatro degraus. Cada um responde uma pergunta que o anterior **não consegue**
responder, e subir na ordem errada é o que faz perder tempo.

| # | Degrau | Responde | É cego para | Instrumento |
|---|---|---|---|---|
| 1 | **Agregado** | a página tem o tamanho e as fontes certas? | tudo que se desloca sem mudar o total | `compara-visual` |
| 2 | **Elemento** | QUEM está fora do lugar, e quanto? | por que está | `compara-geometria` |
| 3 | **Estilo** | POR QUE está — que propriedade diverge? | diferença que não é de valor | `corrige-geometria`, `inspeciona` |
| 4 | **Estrutura** | e quando nem o estilo diverge? | nada — é o último recurso, e é manual | `inspeciona` + aritmética da caixa |

### Degrau 1 → 2: por que o agregado não basta

`compara-visual` deu **42/42 medições com Δaltura 0px** numa home que estava
visivelmente desmontada. Altura de página, marcos e fontes são somas: quando um
elemento anda para o lado, o vizinho ocupa o espaço e o total não muda.

**Use o degrau 1 para:** fonte que não carregou, página que não renderizou,
rolagem horizontal. Ele é ótimo detector de catástrofe e péssimo juiz de
fidelidade.

### Degrau 2 → 3: caixa é sintoma, estilo é causa

Caixa errada **se propaga para todo filho**; estilo errado **fica num elemento
só**. Os quatro filhos da barra de contato tinham `top` idêntico ao original —
só o contêiner divergia. Corrigir por caixa escreveria 4 regras erradas;
corrigir por estilo escreve 1 certa.

### Degrau 3 → 4: quando nenhuma propriedade diverge

Existe defeito em que os dois lados têm o MESMO valor em toda propriedade e
mesmo assim a caixa cai em lugar diferente. Aí a diferença é de **estrutura**,
e o que aponta para ela é aritmética, não comparação:

- **contêiner menos conteúdo, dividido por dois** → suspeite de `justify-content`
  ou `align-items`. Medido: contêiner 648px, conteúdo 628px, deslocamento de
  10px = metade da folga. Era `center` onde o original tem `flex-start`.
- **deslocamento igual à largura de um irmão que mede 0×0** → suspeite de slot
  colapsado com filho `absolute`. Medido: 64px de deslocamento, e a miniatura
  ao lado media exatamente 64px.

---

## 🚨 A triagem: sintoma → classe → conserto

Antes de investigar do zero, procurar o sintoma aqui. Cada linha foi medida no
site-exemplo, e cada uma é uma **classe** de defeito do ditto que vai reaparecer
em outros sites.

| Sintoma medido | Classe provável | Como confirmar | Conserto |
|---|---|---|---|
| Texto renderizando com fonte/tamanho padrão onde o original tem tipografia forte | **Variável CSS destruída** na conversão para JSX | `grep '"-[A-Z]'` nos `.tsx` | `corrige-variaveis-css.mjs` |
| Cabeçalho já compacto no topo, barra já entrada, elemento no estado "depois" | **Captura congelada no estado rolado** | comparar o original fresco no topo × rolado | `gera-scroll.mjs` escreve os DOIS estados |
| Um bloco inteiro deslocado por um valor constante, `dw`=0 | **Valor estático errado** ou **estrutura** | `corrige-geometria.mjs`; se não achar causa, degrau 4 | copiar o valor medido, ou devolver a estrutura |
| Vários elementos com o MESMO `dx`, e um irmão medindo 0×0 | **Slot colapsado + filho fora do fluxo** | medir a caixa do irmão | devolver ao slot o tamanho medido |
| Bloco deslocado por METADE da folga do contêiner | **Alinhamento trocado** (`center` × `flex-start`) | contêiner menos conteúdo ÷ 2 | escrever o alinhamento do original |
| Nada responde a clique, alvos travam em timeout | **`::after` decorativo com `inset-0`** engolindo o ponteiro | log do Playwright diz "intercepts pointer events" | `corrige-interacao.mjs` |
| Um painel/menu/modal do original não existe no clone | **Estado pós-clique** — o ditto fotografa um só | clicar no original e contar elementos novos | `captura-estado.mjs` |
| Flash branco ao navegar, e a entrada reexecutando | **Navegação por recarga**, não client-side | ver se o evento `load` dispara ao clicar | `NavegacaoClient` no layout |
| Rota some, ou coleção só traz um item | **Colapso de coleção** do crawler | comparar com a lista-mestra | plano all-static (`clona-completo.mjs`) |
| Título/canônico iguais em toda rota | **Metadata só no layout raiz** | `bateria-cobertura.mjs` | `corrige-metas.mjs` |

---

## 🚨 Os quatro controles: antes de acreditar em qualquer número

Uma medição errada é pior que nenhuma, porque manda consertar o que está certo.
Todos os quatro custaram tempo de verdade antes de virarem controle.

### 1. Quanto cada lado varia SOZINHO?

Duas fotos do MESMO lado, sem tocar em nada, separadas no tempo. O que mudou
mudou por laço de animação.

> Sem esse controle, três palavras de um rotador fizeram a mesma rota dar 19 e
> 21 em rodadas seguidas, **no mesmo build**, e uma correção que funcionou
> apareceu como piora.

**Regra:** diferença menor que a variação própria do original não é diferença.

### 2. Os dois lados estão no MESMO estado?

Não basta o mesmo viewport. O mesmo **estado de scroll**, e ele se conquista com
protocolo: descer em degraus, **subir em degraus**, e esperar assentar.

> `window.scrollTo(0)` vindo do rodapé é um evento só. O framework do original
> não lê aquilo como "subiu ao topo", e a nav fica colapsada de um lado e
> expandida do outro: **158,8px de desvio acusados em 6 elementos que estavam
> certos**.

### 3. Estou comparando o MESMO elemento?

Índice em `querySelectorAll` não é identidade: o DOM reordena sozinho
(carrossel, lista preguiçosa) sem mudar de tamanho.

> Carimbar `data-dp` uma vez e ler o carimbo nas fotos seguintes fez "305
> elementos que revelam ao rolar" virarem **76**, e 74 recusas de casamento
> virarem 4. Os outros 229 eram ruído de índice deslizado.

### 4. O casamento tem TETO?

Elemento sem texto casa com qualquer outro sem texto da mesma tag.

> Sem teto de erro, um instrumento propôs **177 correções** numa página onde a
> medição independente via **8** divergências.

---

## As regras que decidem o que escrever

Depois de saber qual é o defeito, ainda dá para errar o conserto.

1. **Só se escreve o que EXPLICA o número medido.** "Essa propriedade está
   diferente" não autoriza mexer nela. O delta dela tem que bater com o
   deslocamento observado.
2. **O instrumento ACRESCENTA o que falta, não reescreve o que já está certo.**
   A captura acerta muita coisa; escrever o valor do original por cima troca um
   acerto por um palpite bem medido.
3. **Entre dois consertos, ganha o que devolve a ESTRUTURA.** Medido:
   compensar com margem deu 9 fora do lugar e um desalinhamento visível;
   devolver o slot deu 19, todos com o mesmo deslocamento rígido de 10px que
   ninguém enxerga — e abriu o caminho para achar o segundo defeito.
   **Contagem é bom termômetro e péssimo juiz.**
4. **Toda regra mora dentro da `@media` em que foi medida.**
5. **Duas camadas nunca escrevem a mesma propriedade.**
6. **Corrigir pode piorar, e o instrumento tem que perceber sozinho** — e
   **sumir do casamento conta como piorar**.

---

## O ciclo, em uma tela

```
linha de base ──► de quem é a culpa?
      │
      ├─ camada piora ──► tirar a camada, refazer o gerador
      │
      └─ captura erra ──► escada:
                            agregado?  não  →
                            elemento?  quem, quanto →
                            estilo?    por quê →
                            estrutura? aritmética da caixa
                                  │
                                  ▼
                            conserto (as 6 regras)
                                  │
                                  ▼
                            build ──► medir de novo
                                  │
                          piorou? ──► desfazer, lista negra
                          melhorou? ─► próxima divergência
```

🚨 **Duas rodadas sem fechar = residual NOMEADO.** Residual nomeado nunca conta
como dimensão fechada, e vai para o relatório com número e motivo.
