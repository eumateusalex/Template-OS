---
name: estudio
description: "Revisa peça (carrossel, página, tela, copy, texto) com os revisores de comunicação, interface e estratégia depois do gate, e dá veredito. Use para \"passa no estúdio\", \"revisa a peça\", \"chama os revisores\" ou /estudio. Não monta nem escreve."
---

# /estudio — o Estúdio de Design

A produção mora nas skills. **O estúdio é a revisão**: olhares diferentes sobre a
mesma peça, ao mesmo tempo, depois que a máquina já disse que não tem erro.

Ele existe porque **gate verde não prova peça boa**, e porque um revisor só,
olhando tudo, deixa passar o que outro olhar pega: o gate mede a forma, e uma
peça com todos os gates verdes ainda pode ter frase que não se entende sozinha,
conta que não fecha entre os slides e botão escondido no celular.

🚨 **O orquestrador é esta skill, na conversa principal.** Subagente não lança
subagente: quem chama os revisores em paralelo é quem está conversando com o
usuário. Quando não dá para lançar (esta skill roda dentro de um subagente, ou a
sessão não tem a ferramenta Agent), vale o modo sem subagente do Passo 3.

---

## A carta do estúdio

Cada revisor tem **uma lente**, e o que não é dele está escrito com o nome de
quem cuida. Dois revisores apontando o mesmo defeito é custo, não valor.

| Revisor | Olha | Não olha | Lê | Devolve |
|---|---|---|---|---|
| `revisor-de-comunicacao` | 5 segundos na capa, os dois testes de enigma em cada título e no fecho, percepção e função, número × fonte, a história que fecha, a voz, o pedido à IA | layout, foto, ocupação | `_memoria/escrita-publica.md`, `_memoria/marketing.md`, `_memoria/prova.md`, o texto do alvo e a legenda | `[slide N] defeito — régua — a frase reescrita` |
| `revisor-de-interface` | a página (1280 e 390, console, toque, teclado, movimento, contraste, a marca na página) ou a maquete da `/design-de-produto` por uma lente | copy | o `CLAUDE.md` do projeto, a marca dele (ou o roteador `identidade/design-guide.md`), e na tela de produto o `cenario.md` e o método da `/design-de-produto` | `[rota ou tela · largura] defeito — medido × régua — como reproduzir ou corrigir` |
| `revisor-de-estrategia` | se a peça cumpre o briefing do `/instagram`: função, formato, profundidade na faixa, gancho, CTA que a função aceita, os três alvos na peça que vende | texto, layout, foto | o briefing (arquivo da semana em `marketing/semanas/`), `_memoria/marketing.md`, `_memoria/escrita-publica.md` ("O CTA"), o `roteiro.md` e a legenda | `[peça ou slide N] o defeito · a régua ou a linha do briefing · o conserto concreto` | <!-- caminho futuro: nasce com a primeira semana do /instagram -->

Os agentes moram em `.claude/agents/estudio/`. **Os três** seguem o mesmo
contrato (`referencias/contrato-de-revisor.md`): só apontam o que tem número ou
regra escrita, leem o `ACEITO.md` do alvo, entregam a lista **"Não verificado"**
e um veredito em uma linha, e dizem em uma linha quando não acharam nada.

Composição de slide, foto e direção de arte não têm revisor aqui: no carrossel,
quem confere é o render da skill e o olho de quem aprova.

---

## Superfície, gate e revisores

| Alvo | Como reconhecer | Gate (se vermelho, PARA) | Revisores em paralelo |
|---|---|---|---|
| **carrossel** | a pasta da peça do `/carrossel`, com `carrossel.html` e `legenda.txt` | o render sem erro (`node .claude/skills/carrossel/render/render-carrossel.js <peça>/carrossel.html`; no estilo X, `node .claude/skills/carrossel/render/montar-x.mjs <peça>`) e a régua da legenda (`scripts/lib/legenda.js`, o comando está na seção "6 · Legenda" do `/carrossel`) | comunicação + estratégia |
| **página** | "site", "home", uma rota, ou a pasta de um site em `projetos-pessoais/` ou `clientes/` | o portão do projeto, pelo `CLAUDE.md` dele | interface + comunicação |
| **tela de produto** | maquete HTML da `/design-de-produto`, com o `cenario.md` na pasta | o medidor (`node .claude/skills/design-de-produto/scripts/medir-tela.cjs <tela.html> --tema claro`, e `--tema escuro` no arquivo escuro) | interface, **uma chamada por lente** (fidelidade; texto-e-numeros; regras-do-projeto, se a tela é de um projeto) |
| **copy da `/copy`** | `copy.md` numa pasta `saidas/copy-<peça>-<data>/` | a régua da marca (`node scripts/copy/conferir.mjs <copy.md>`) | comunicação |
| **texto solto** | `.md` ou `.txt` de proposta, email, legenda avulsa | nenhum | comunicação |

Na tela de produto o roteiro inteiro da revisão (as três lentes, as rodadas e o
teto) é o passo 10 do `.claude/skills/design-de-produto/SKILL.md`; aqui ele só se
encaixa na mesma fusão.

---

## O fluxo

### Passo 1 · Identificar o alvo

Pelo caminho ou pelo pedido. Ambíguo, **uma pergunta**, e segue.

### Passo 2 · Rodar o gate da superfície

O comando da tabela acima, na raiz do workspace. Página: o portão que o
`CLAUDE.md` do projeto indica; se ele sobe um servidor, anote a porta que ele
imprimiu.

🚨 **Gate vermelho: devolver a saída do gate e PARAR.** Nenhum revisor é chamado.
Defeito mecânico muda a peça, e revisar o que vai mudar é pagar duas vezes.

### Passo 3 · Chamar os revisores, todos na MESMA mensagem

**Uma chamada da ferramenta Agent por revisor (ou por lente), todas numa
mensagem só.** É isso que os põe em paralelo; em mensagens separadas eles rodam
em fila.

O prompt de cada um leva, e só:

- o caminho **absoluto** do alvo e a superfície
- "o gate passou às HH:MM; não rode de novo"
- "o servidor está em http://127.0.0.1:<porta>", quando houver
- "sua lente é X; o que não é seu está com Y, não reaponte"
- "devolva no formato do seu contrato, com a lista Não verificado e o veredito"

Não resuma a peça pra eles: eles leem os arquivos. Resumo seu vira o que eles
revisam.

**Sem subagente** (esta skill roda dentro de um subagente, ou a sessão não tem
a ferramenta Agent): aplicar cada revisor na própria conversa, **um de cada
vez**. Ler o arquivo dele em `.claude/agents/estudio/<revisor>.md` do começo ao
fim e seguir como se fosse o seu prompt: a mesma ordem de leitura, a mesma
fronteira, os mesmos comandos de máquina e o mesmo formato de relatório.
Terminar a lista de um revisor antes de abrir o arquivo do seguinte, para uma
lente não contaminar a outra. O Passo 4 funde igual, e o relatório leva, logo
abaixo do título, a linha `Modo: sem subagente, as lentes aplicadas em
sequência na conversa`, porque uma leitura só, ainda que em lentes separadas,
acha menos do que leituras independentes.

### Passo 4 · Fundir num relatório só

1. **Mesmo lugar + mesmo defeito em duas lentes vira um item**, com as duas
   lentes anotadas
2. **Gravidade**, nesta ordem:
   - **1 · o público vê errado**: texto cortado, número ou fonte errada, marca de
     terceiro, frase que induz ao erro, conta que não fecha, página que rola de
     lado no celular
   - **2 · regra escrita violada**, sem o público ver errado
   - **3 · reparo pequeno**
3. **Tirar o que está no `ACEITO.md`**, se algum revisor deixou passar
4. **Veredito único**: `AJUSTAR ANTES` se sobrou item de gravidade 1 ou 2;
   `PRONTA PRA ENTREGA` se só 3 ou nada
5. **Fundir as listas "Não verificado"**, sem repetir
6. **Achado que bate em outra regra não se descarta: se resolve.** Se o conserto
   pedido derruba outra regra (um teto, um preset, a assinatura da peça), muda-se
   o que dá para mudar, e o achado só fica se o usuário aceitar, no `ACEITO.md`
7. **Conserto sugerido por revisor passa pelas recusas** que o usuário já
   registrou (`_memoria/preferencias.md` e a marca) antes de aplicar: o revisor
   não conhece o que o usuário já recusou

### Passo 5 · Consertar e rever

- O conserto é na conversa principal, com a skill da superfície (`/carrossel`,
  `/copy`, `/design-de-produto` ou a do projeto da página), nunca pelo revisor
- Gate de novo
- **Conserto não é isento:** texto reescrito por causa de uma reprovação volta
  para a mesma lente, porque é na pressa da correção que o enigma entra
- **Rechamar só as lentes tocadas**
- 🚨 **Teto de duas rodadas** (a tela de produto segue o teto da `/design-de-produto`).
  Na rodada seguinte, mostrar ao usuário o que sobrou e por quê, em vez de rodar
  de novo

### Passo 6 · Entregar

Um bloco só:

```
Estúdio · <alvo> · <veredito>
Modo: sem subagente, as lentes aplicadas em sequência na conversa   (só quando foi assim)

Consertado:
- [slide 4] frase sem dono → rótulo "Minha leitura" (comunicação)

Ficou:
- [home · 390] chip a 2px da barra fixa (interface) · aceito pelo usuário, no ACEITO.md

Não verificado:
- fonte do dado de 2025 (o PDF da pesquisa não abriu)
```

---

## O `ACEITO.md`: o que o usuário já viu e aceitou

Uma peça aprovada pode ter coisa que um revisor certo apontaria, e que o usuário
aceitou sabendo. Sem registro, **todo `/estudio` reaponta a mesma coisa**, e
relatório que sempre repete o mesmo item ensina a ignorar o relatório.

Na pasta do alvo, uma linha por exceção:

```
# ACEITO · <peça>

- [slide N] o que o usuário viu e aceitou · aceito em DD/MM/AAAA
```

Só entra o que **o usuário** aceitou, com a data. Achado que a sessão decidiu
ignorar não é aceito: é achado.

---

## A calibração

A régua do estúdio são **as peças que o usuário aprova e publica**. Enquanto não
houver, calibra-se pela marca (`identidade/`, pelo roteador
`identidade/design-guide.md`: os papéis de cor, a fonte, o raio e as `recusas`),
pelo catálogo do carrossel (`.claude/skills/carrossel/kit/catalogo.html`), que
mostra cada componente nos tokens gerados dela, e, na tela de produto, pelos
modelos da `/design-de-produto`. O gosto que os kits trazem é padrão sugerido:
só a recusa da marca vira achado.

🚨 **"Aprovada" não quer dizer "sem defeito".** Quem aprova olha a peça inteira,
não com aquelas lentes, e um revisor certo pode achar defeito real numa peça que
já foi aprovada. O achado numa peça aprovada não prova que o revisor exagerou:
ele passa pela triagem abaixo como qualquer outro.

Por isso calibrar é **triar cada achado**, e não contar vereditos:

| O achado é | O que se faz |
|---|---|
| **real**: a regra escrita existe, e a peça a fere | vai para o usuário: consertar, ou entrar no `ACEITO.md` |
| **régua no lugar errado**: a regra existe, mas não vale ali | reescrever a regra no arquivo do revisor ("só aponte quando...") |
| **régua velha**: o documento citado contradiz um mais novo | corrigir o documento, não o revisor nem a peça |
| **dívida da marca**: a peça herda do token | registrar como dívida e tirar da lente do revisor |

**Nunca mexer na peça pra agradar o revisor, e nunca afrouxar a régua pra
agradar a peça.**

⚠️ **O mesmo revisor na mesma peça não devolve sempre a mesma lista.** Revisor é
leitura, não medição: o que é garantia é o gate; o revisor aumenta a chance de
achar, e por isso roda em lentes separadas.

---

## O custo, dito

Cada revisor lê da ordem de 2 a 3 milhões de tokens de cache e uns 120 mil tokens
novos, e uma rodada leva de 5 a 10 minutos. É pouco perto do custo de produzir a
peça, e é a única etapa que acha o que o leitor vê errado.

Cabe em algumas peças por semana. **Não cabe em "roda a cada ajuste"**: o
`/estudio` roda uma vez, no fim do ciclo, e depois só nas lentes tocadas.

---

## Como adicionar um revisor

1. Escrever o agente em `.claude/agents/estudio/<nome>.md`, seguindo
   `referencias/contrato-de-revisor.md`
2. Pôr a linha dele na **carta** acima, com o que olha e o que **não** olha
3. Pôr ele na tabela de **superfície**
4. Tirar da lente dos outros o que é dele, por escrito, nos dois arquivos
5. Calibrar na régua antes de usar (a seção "A calibração")
6. Uma linha na seção de agentes do `CLAUDE.md` da raiz

⚠️ **Agente novo pode não aparecer na hora na sessão em curso**: a ferramenta
Agent responde "not found" por alguns minutos (numa sessão nova, aparece
direto). Enquanto isso, chamar um `general-purpose` com o prompt "leia
`.claude/agents/estudio/<nome>.md` e siga à risca, como se fosse o seu prompt de
sistema; você é só leitura".
