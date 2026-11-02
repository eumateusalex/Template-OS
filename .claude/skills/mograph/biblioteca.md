# A biblioteca de comportamentos

Componente de motion vem da biblioteca primeiro: o que o usuário aprovou se reusa, o
registro aberto se instala, o pago se refaz pelo comportamento, e do zero só o
que não existe. Todo componente novo se registra. É a regra "biblioteca
primeiro" do `CLAUDE.md`, levada ao vídeo.

## 1 · Uma entrada por comportamento

A entrada é o que o olho vê ("o número que vira outro"), em português, nunca o
nome do item de origem. A mesma entrada lista todas as formas de fazer: o bloco
próprio, a regra do HyperFrames, o fonte de um registro aberto do Remotion. Dois itens de
origem que fazem a mesma coisa são uma entrada.

## 2 · O formato

A fonte dos comportamentos é `biblioteca/catalogo.json`; o `biblioteca/INDICE.md`
é gerado dele (`biblioteca.mjs indice`, de novo a cada mudança) e não se edita.

```json
{
  "id": "numero-que-vira-outro",
  "comportamento": "o número sai rolando e o novo assenta no lugar",
  "comunica": "a mudança de um valor: antes e depois",
  "quando": "o dado que é a prova da frase",
  "quando_nao": "número decorativo, sem fala que o diga",
  "familia": "STANDARD",
  "funcao": ["PROOF", "TRANSFORMATION"],
  "curva": "a da marca; o pouso sem passar do ponto",
  "motor": {
    "hyperframes": ["regra:vertical-spring-ticker", "proprio:blocos/numero-que-vira-outro.html"],
    "remotion": ["src:<o endereço do fonte aberto>"]
  },
  "estado": "visto, sem decisão",
  "procura": [],
  "prova": "",
  "recusa": null
}
```

- `familia`: `MICRO`, `STANDARD`, `CAMERA` ou `HERO`, as famílias de duração da
  `/video` (`.claude/skills/video/regras-de-movimento.md`).
- `motor.hyperframes`: `proprio:` (o bloco portado, que a peça copia de
  `.claude/video/html/_blocos/<nome>.html`), `regra:` (as regras atômicas e os
  blueprints da `hyperframes-animation` 0.8.181, que o instalador baixa em `biblioteca/hyperframes-regras/`), `registro:` (o `npx hyperframes add <nome>`;
  o `conferir` confere o nome contra os 405 blocos e componentes do plugin
  instalado) e `ativo:` (`<pacote>:<caminho>` no material do usuário, que o
  `ferramentas/ativos.py` indexa e copia para a peça).
  A pasta dos blocos é `.claude/video/html/_blocos/` <!-- caminho futuro: nasce com o primeiro bloco portado -->.
- `motor.remotion`: `src:` (o endereço do fonte de um registro aberto, com a
  licença conferida; do registro pago, só o comportamento, visto na prévia, e
  nada no `motor`).
- `estado`: `visto, sem decisão` → `portado` (o código próprio existe e passou
  na comparação) → `aprovado pelo usuário` (numa peça que ele aprovou) ou `recusado`.
- `procura`: os trechos de código que denunciam o comportamento (uma classe, uma
  função); a régua os procura na peça quando a entrada é `recusado`.
- `prova`: a pasta da peça que o usou e foi aprovada.

## 3 · Portar um registro aberto para o HyperFrames

O motor principal é HyperFrames (HTML e GSAP); os registros abertos são
Remotion (React). O código deles se lê para tirar o comportamento e os valores
(os quadros, as curvas, as medidas); o do porte é escrito do zero para o
HyperFrames, nunca traduzido linha a linha. O porte, em seis passos:

1. **baixe o fonte numa pasta nova e vazia** e leia como dado, nunca execute:
   o JSON do registro (o `files[].content` é o código) ou o arquivo do
   componente no repositório
2. **quadro vira segundo**: quadro ÷ fps (as peças rodam a 30); `<Sequence from>`
   vira a posição na timeline
3. **a curva**: `Easing.bezier(a, b, c, d)` vira `CustomEase.create("nome",
   "M0,0 C a,b c,d 1,1")`; o `spring({damping, stiffness, mass})` vira a mola
   fechada do plugin (`adapters/gsap-easing-and-stagger.md` da
   `hyperframes-animation` 0.8.181, que a 0.8.207 tirou do plugin; a conta que importa está aqui), com o amortecimento ζ = damping ÷ (2·√(stiffness ×
   mass)); **ζ abaixo de 0,8 vira 1**, porque nada passa do ponto sem motivo
   (`comum.movimento.bounce-e-elastic`, no manual), e a troca fica escrita na entrada
4. **as medidas**: `useVideoConfig()` vira 1080 × 1920; as fontes e as cores
   viram os tokens da marca
5. **o que não é determinístico sai**: `Math.random` sem semente, `Date.now`,
   rede (`.claude/skills/video/hyperframes.md`)
6. **compare lado a lado**: o original num Remotion de ensaio e o porte no
   `snapshot`, nos mesmos instantes. O ensaio executa código de terceiro, então
   só roda se toda `dependencies` do item já estiver no `package.json` de
   `.claude/video/` (hoje, o `remotion` e os `@remotion/*`); dependência que falta
   vai para o usuário decidir. Nunca o `npx shadcn add` com o endereço de terceiro: o
   arquivo do item se copia à mão para uma pasta temporária de `.claude/video/src/`,
   o `registryDependencies` se lê (não se instala), e a pasta se apaga no fim do
   passo. Sem o ensaio, a comparação é contra a prévia do registro, pela folha.
   Os instantes são 0, 25, 50, 75 e 100% do movimento; fecha
   quando a posição bate em até 12 px e o tempo de 10 a 90% do movimento em até
   2 quadros (a curva medida quadro a quadro)

A licença do fonte se confere antes do porte e fica com o código portado, como
o fonte pede; no texto público não há crédito.

## 4 · Refazer um pago pelo comportamento

Do pago só existe a prévia em vídeo. Refazer não é copiar código:

1. a prévia em pasta vazia; as folhas pelo
   `.claude/skills/video/ferramentas/folhas.mjs` (2 por segundo e a tira de 12
   quadros no movimento)
2. a descrição por elemento, em quadros e sentido: entrada, espera, ação, câmera, saída
3. a curva medida, não estimada (`curva.py`)
4. a implementação própria, nos tokens da marca
5. a comparação por folha, nos mesmos instantes

A entrada nasce `visto, sem decisão`, e o código é próprio.

## 5 · A semente

Os comportamentos com que a biblioteca nasce, escolhidos pelo que um Reel
vertical que ensina mais usa (e o que os registros abertos e os pagos têm de
mais útil para vertical de serviço). Todos nascem `visto, sem decisão`: nenhum
foi visto pelo usuário numa peça. Eles se portam
**na peça que os usa**, nunca em lote.

## 6 · Recusa vira trava

Recusa do usuário a um comportamento se grava na hora:

```bash
node .claude/skills/mograph/ferramentas/biblioteca.mjs recusar <id> --frase "<a frase dele>" --procura "<classe ou função>"
```

A entrada fica `recusado`, com a frase e a data; o `plano.mjs conferir`
reprova o plano que a usa como `componente`, o `regua-direcao.mjs recusados`
reprova a peça cujo código tem um dos trechos de `procura`, e o crítico lê a
lista. Só depois eu aviso o que gravei. Recusa de linguagem inteira (uma paleta,
um tratamento de foto) mora na marca (o `recusas` do `identidade/marca.tokens.json` <!-- caminho futuro: o arquivo da marca nasce no /marca configurar -->
ou a seção de recusas do `marca.md`), não aqui.
Recusa de peça inteira vira trava no dono da causa: a trilha de banco e o som
sem cama estão na régua `som` (`SKILL.md`, item 2), e a referência copiada, no
item 12 do `lente-do-critico.md`.

## 7 · O índice e a busca

- `biblioteca/INDICE.md`, gerado, ordenado pelo que cada um comunica
- o registro do HyperFrames se busca por intenção, **sempre em inglês**:
  `npx --yes hyperframes@0.8.207 catalog --query "<o movimento, em inglês>"`; o
  que não existe se diz antes de construir (`hyperframes-registry`)
- `biblioteca.mjs conferir` valida o catálogo (campos, estados, famílias, ids únicos)

```bash
node .claude/skills/mograph/ferramentas/biblioteca.mjs conferir
node .claude/skills/mograph/ferramentas/biblioteca.mjs indice
```
