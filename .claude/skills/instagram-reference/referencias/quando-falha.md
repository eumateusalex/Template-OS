# Quando o download ou a transcrição falha

> Abrir só quando o passo 1 ou o passo 2 der erro. Em operação normal nada aqui
> é necessário.

---

## O yt-dlp falhou: conteúdo que exige login

O Instagram entrega parte do conteúdo só para sessão logada. O yt-dlp tem uma
flag para isso, `--cookies-from-browser`, e ela **falha com frequência**:

- **Chrome** trava o banco de cookies enquanto o navegador está aberto
- **Edge** falha na descriptografia, por causa da criptografia app-bound do
  Chrome 127 em diante (yt-dlp #15401, gallery-dl #6162). Sem solução conhecida
- Navegador que não estiver instalado, obviamente, não tem cookie nenhum

Vale tentar mesmo assim, com o navegador **fechado**:

```bash
yt-dlp "<URL>" --cookies-from-browser chrome --write-info-json \
  -o "marketing/instagram/.tmp/%(id)s.%(ext)s"
```

**A rota que costuma funcionar é o Playwright**, quando o workspace tiver o MCP
dele configurado e a sessão do Instagram estiver logada:

1. Abrir o contexto do navegador
2. Chamar `page.context().storageState({ path: ... })`
3. Converter o JSON resultante pro formato Netscape de cookies
4. Passar o arquivo em `--cookies <arquivo>`

A vantagem dessa rota é que **o token nunca passa pelo chat**.

⚠️ **O arquivo de cookies é credencial.** Ele vale como a sua senha enquanto a
sessão durar. Gravar em `marketing/instagram/.tmp/` (que não é versionado) e
apagar assim que o download terminar. **Nunca** comitar, nunca colar no chat.

Se mesmo assim falhar: avisar o usuário e pedir para ele colar a transcrição
manualmente, ou enviar o vídeo como arquivo.

---

## A armadilha do `--dump-json`

Não usar `--dump-json` no passo 1. Essa flag apenas **imprime** os metadados e
**não baixa o vídeo**, o que faz o passo 2 falhar por falta de arquivo. O
`--write-info-json` do comando padrão é o certo: baixa o vídeo **e** grava os
metadados.

---

## Ferramentas de vídeo do ambiente

Se o workspace tiver tools de análise de vídeo, elas servem para o **elemento
visual** — a transcrição em si o passo 2 já resolve:

- `video_analyze` com `transcription: true`, `scene_changes: true`, `silence: true`
- `video_watch` com `fps: auto`, `view_sample` pra ler texto na tela e a ação do
  gancho

**Não são garantidas.** Se retornarem erro, seguir sem elas.

---

## O Python da transcrição

O passo 2 usa `scripts/transcrever.py`, que roda faster-whisper **offline** — o
vídeo não sai da máquina.

```bash
python scripts/transcrever.py "marketing/instagram/.tmp/<id>.mp4"
```

**Se o `python` não estiver no PATH**, usar o caminho completo do interpretador.
No Windows ele costuma estar em
`~/AppData/Local/Programs/Python/Python3XX/python.exe`.

⚠️ **No Windows, cuidado com `python3`:** costuma ser o atalho da Microsoft
Store, que abre a loja em vez de rodar o script. Use `python`, ou o caminho
completo.

**Requisitos:** `pip install -r scripts/requirements.txt` e o **ffmpeg** no
PATH. Sem ffmpeg, o script não consegue extrair o áudio e falha logo no começo.
