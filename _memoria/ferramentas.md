# Ferramentas

> **Responsabilidade:** o ambiente em que o workspace roda: contas, servidor,
> motores de geração, leitura de terceiros, navegador, MCP e repositórios, e o
> que cada um custa.
> **Não mora aqui:** a regra de como usar cada ferramenta (→ `CLAUDE.md` e a
> skill dona), o estado de cada frente que roda sobre elas (→ `estrategia.md`).
> **Revisado em:** *(o `/instalar` preenche)*

Este molde **vem em branco**, e se preenche conforme você liga cada ferramenta
(o `/instalar` pergunta as que você já usa). Aqui entra **só o nome, para que
serve, o plano e o custo**. Senha, token e chave nunca entram: eles moram no
`scripts/.env`, que fica fora do Git, e o `scripts/.env.example` lista cada
variável com o que ela é. Campo sem resposta fica `*(a definir)*`, nunca
inventado.

O **Claude Code com este workspace** é o centro da operação. Em volta dele:

---

## No dia a dia

*As ferramentas que você já usa para trabalhar, e para que serve cada uma
(agenda, WhatsApp Business, planilha de orçamento, sistema de agendamento).*

- *(a definir)*

---

## Contas e servidor

*As contas que o trabalho usa e para quê: a conta do Instagram que publica (pela
`/instagram-publisher`), o perfil no X ou no LinkedIn, o GitHub, um servidor
próprio, se houver, e o que roda nele.*

- *(a definir)*

---

## Geração

*Os motores que geram imagem, vídeo, voz ou texto, com o plano e o custo de
cada um. Os que o workspace já sabe usar:*

- **Imagem** (`/gerar-imagem`): o Nano Banana pela Vertex AI do Google Cloud (o
  padrão, com custo por imagem informado antes) e, opcional, o motor GPT pelo
  login do ChatGPT. Projeto do Google Cloud: *(a definir)*
- **Vídeo por IA:** o Veo pela Vertex (`scripts/gerar-video.js`). *(se usar)*
- **Vídeo em código** (`/video`): HyperFrames e Remotion, no estúdio
  `.claude/video/`. Voz: *(a definir: a ElevenLabs, outra, ou sem voz)*
- **Transcrição** (`/cortes`): o faster-whisper, offline. Placa de vídeo:
  *(a definir: com ou sem; sem placa ele roda na CPU, mais devagar)*

---

## Leitura de terceiros

*O que lê site, anúncio ou acervo de fora, com o plano de cada um:*

- **Firecrawl** (`/raspar`): plano *(a definir)*; a chave fica no `scripts/.env`
- **ditto** (`/clonar-site`): pasta de instalação *(a definir)*
- **Acervo do `/oferta`**, se você montou um: pasta *(a definir)* (a variável `OFERTA_ACERVO`)

---

## Navegador e MCP

*Os servidores MCP do `.mcp.json` e os conectados na sua conta do Claude.*

- **No workspace:** playwright (o navegador) e motion (a documentação do Motion)
- **Conectados na conta:** *(a definir: Notion, Google Agenda, Drive, Figma e
  afins)*

---

## Repositórios

*O `/salvar` consulta esta seção antes de perguntar o remoto de uma pasta. Ela se
preenche conforme você usa.*

| Pasta | Remoto | Publica no push? |
|---|---|---|
| Raiz do workspace | *(a definir)* | *(sim ou não)* |
