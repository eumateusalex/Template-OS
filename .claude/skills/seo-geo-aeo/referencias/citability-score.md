# Citability Score — a régua de PÁGINA

A nota de 0 a 10 da auditoria mede o **site** em três eixos. Esta mede a
**página**, numa pergunta só:

> **Se uma IA fosse responder a pergunta que essa página responde, ela teria de
> onde copiar?**

É o número que se move de sessão em sessão. A nota do site diz onde o trabalho
está; o Citability Score diz **se ele avançou**.

---

## 🚨 O que este número é, e o que não é

- ⭐ **É prontidão pra ser citada.** Mede se a página tem a matéria-prima que uma
  IA copia: dado, definição fechada, fonte, estrutura
- 🚨 **NÃO é medição de que já é citada.** Isso quem responde é a varredura do
  Passo 8, perguntando de verdade pras IAs. Uma página pode tirar 90 e não ser
  citada por ninguém, porque citação também depende de autoridade e de menção
  fora do site
- ⚠️ **É heurística, e vai ser sempre.** Duas pessoas dando nota na mesma página
  chegam perto, não no mesmo número. Serve pra comparar **a mesma página ao longo
  do tempo**, não pra ranquear páginas de sites diferentes

---

## As sete dimensões

Cada uma vale de 0 a 14 pontos, e o teto é 98. **Arredondar pra 100 quando as
sete estiverem cheias.**

| # | Dimensão | A pergunta | 0 pontos | 14 pontos |
|---|---|---|---|---|
| 1 | **Densidade de dado** | tem número, data e fato concreto? | só adjetivo ("líder", "qualidade") | números com unidade, datas, quantidades verificáveis |
| 2 | **Resposta no topo** | a resposta vem nos 2 primeiros parágrafos? | a resposta está no meio, depois de história | resposta direta e curta, antes de qualquer contexto |
| 3 | **Fonte citada** | referencia dado externo verificável? | nenhuma fonte | fonte nomeada com ano, e link quando existir |
| 4 | **Autoria** | dá pra saber quem escreveu e por que confiar? | texto anônimo | autor identificado, com experiência de primeira mão visível |
| 5 | **Definição fechada** | os termos-chave se explicam sozinhos? | usa o jargão sem definir | cada termo central tem uma frase que se copia inteira |
| 6 | **Schema** | tem JSON-LD adequado ao tipo? | nenhum | o tipo certo (`LocalBusiness`, `FAQPage`, `HowTo`, `Article`, `Product`) e válido |
| 7 | **Estrutura** | tem bloco que a IA copia fácil? | parede de texto | H2 em pergunta, FAQ, lista e tabela |

### Como pontuar sem travar

Três valores por dimensão, e só três. **Meio ponto não existe aqui**, porque
precisão falsa custa mais que a grosseria:

| Situação | Pontos |
|---|---|
| não tem | **0** |
| tem, mas fraco ou parcial | **7** |
| tem, e bem-feito | **14** |

---

## Onde isso mora

No relatório da auditoria (`marketing/seo/00-auditoria.md`), uma tabela: <!-- caminho futuro: a skill grava em marketing/seo/ no primeiro uso -->

```markdown
## Citability Score (média do site: __/100)

| Página | 1·Dado | 2·Topo | 3·Fonte | 4·Autor | 5·Definição | 6·Schema | 7·Estrutura | Total | Maior buraco |
|---|---|---|---|---|---|---|---|---|---|
| /             | 7 | 0 | 0 | 0 | 7 | 14 | 7 | 35 | resposta enterrada |
| /servicos/x   | 0 | 7 | 0 | 0 | 0 | 0  | 7 | 14 | não tem dado nenhum |
```

⭐ **Pontuar SÓ as páginas que vendem**, mais a home. Dar nota ao site inteiro
gasta a tarde e não muda decisão nenhuma: quem precisa subir é a página que
recebe o cliente.

⚠️ **A coluna "maior buraco" é a que vira tarefa.** Sem ela a tabela é um número
bonito que ninguém sabe o que fazer com.

---

## Como isso vira trabalho

1. Pontuar a home e as páginas de venda
2. Ordenar por **buraco mais barato de tapar**, não por nota mais baixa.
   Dimensão 6 (schema) e 2 (resposta no topo) costumam ser meia hora cada;
   dimensão 4 (autoria) pode exigir o usuário escrever e o cliente aprovar
3. Cada tarefa entra com a **falsificabilidade** junto (ver "Regras" do
   `SKILL.md`): *como saberíamos que isso falhou?*
4. Repontuar só o que mudou, e anotar a data

> 🚨 **Repontuar a página inteira toda sessão é desperdício.** A nota só se move
> quando alguém mexe na página. Se ninguém mexeu, a nota é a mesma, e conferir
> de novo é gastar a sessão medindo em vez de consertar.

---

## Relação com a nota 0 a 10 da auditoria

As duas convivem, e **não se somam**:

| | Nota 0 a 10 | Citability Score |
|---|---|---|
| Mede | o site, em SEO, GEO e AEO | uma página, em prontidão pra citação |
| Quando | na auditoria (Fase 1) | na auditoria e a cada sessão que mexe em página |
| Serve pra | dizer ao dono onde ele está | escolher a próxima tarefa e provar avanço |
