---
name: converter
description: Converte PDF, Word, Excel, PowerPoint, HTML, dados estruturados, ZIP, ePub, email, áudio ou vídeo em Markdown legível, escolhendo o motor e o destino. Use para ler, extrair, transcrever ou converter arquivo local, ou /converter.
---

# /converter — Arquivo → Markdown

**Esta skill não é um motor: ela é o roteador.** Escolher o motor errado custa
qualidade — ou **vaza arquivo pra fora da máquina** (ver o aviso do áudio no
Passo 1). A tabela de formatos é quem manda.


## Passo 0 — De quem é o arquivo?

- **De um cliente** (veio de `clientes/<nome>/dados/`, ou o usuário citou o
  cliente) → a saída vai pra `clientes/<nome>/saidas/`.
- **Do usuário** → saída em `saidas/`. Se o arquivo estava em `dados/` (a drop
  zone), a conversão é justamente o "analisar uma vez" que aquela pasta espera.

Conversão descartável (só pra eu ler e responder na hora) não precisa virar
arquivo — converter pro scratchpad e seguir.

---

## Passo 1 — Rotear pelo formato

**Esta tabela é a decisão inteira.** Não existe motor único aqui.

| Entrada | Motor | Por quê |
|---|---|---|
| `.pdf` `.docx` `.xlsx` `.xls` `.pptx` `.html` `.csv` `.json` `.xml` `.epub` `.zip` `.msg` | **MarkItDown** (CLI `markitdown`) | É o que ele faz bem |
| `.mp3` `.mp4` `.m4a` `.wav` e qualquer áudio/vídeo | **`scripts/transcrever.py`** | Whisper `large-v3-turbo`, offline, com timestamps, na placa de vídeo NVIDIA quando há e na CPU quando não (o motor é `scripts/lib/motor_whisper.py`) |
| `.png` `.jpg` `.jpeg` e imagem em geral | **Nenhum — eu leio direto** | Ver a armadilha 3 |
| `.mind` (mapa mental) | **`scripts/ler-mind.py`** | Abre o `map.json` de dentro do zip e devolve a árvore indentada, com as notas de cada nó |
| `.doc` (Word antigo) | **Nenhum aqui** | O MarkItDown só lê `.docx`; pedir ao usuário o arquivo salvo como `.docx` ou PDF |

> **Áudio e vídeo NUNCA vão pro MarkItDown**, por dois motivos:
>
> 1. **Se o extra de áudio estiver instalado, ele vaza.** O conversor de áudio
>    chama `recognizer.recognize_google()` — **manda o arquivo pros servidores
>    do Google**, sem timestamp e bem pior que o Whisper. Por isso o extra
>    `[audio-transcription]` fica **de fora de propósito** (o `scripts/requirements.txt`
>    instala o MarkItDown sem ele). Se aparecer instalado, desinstalar.
> 2. **Como ele não está instalado, o MarkItDown falha calado.** Com um mp4
>    real, ele sai com `exit 0`, **arquivo de 0 bytes, nenhuma mensagem de erro**. Ele
>    *parece* ter funcionado. É o mesmo modo de falha da imagem (armadilha 3).
>
> Tradução prática: áudio e vídeo vão pro `transcrever.py` e ponto.

---

## Passo 2 — Converter

**Documento** — o `markitdown` entra no PATH com o `python -m pip install -r scripts/requirements.txt`:

```bash
markitdown "dados/proposta.pdf" -o "saidas/proposta.md"
```

Sem `-o` ele joga na saída padrão, o que serve pra leitura rápida. Vários
arquivos → um comando por arquivo (a CLI não recebe lote).

**Áudio/vídeo** — pelo Python:

```bash
python scripts/transcrever.py "dados/call.mp4" --saida "saidas/transcricao-call.md"
```

---

## Passo 3 — Entregar e conferir

1. **Conferir o tamanho da saída e abrir o resultado** antes de dizer que deu
   certo. O modo de falha característico do MarkItDown é **`exit 0` com arquivo
   de 0 bytes** — ele não reclama, só devolve vazio. Saída com 0 byte =
   falhou, sempre. As armadilhas abaixo cobrem os casos conhecidos.
2. Se o arquivo for **material único** (análise, transcrição, extração que só
   existe aqui), **commitar no mesmo dia**: material único sem commit existe em
   cópia única.

---

## Armadilhas

**1 · PDF de design sai embolado.** PDF de texto (proposta, contrato, relatório)
sai muito bom, com tabela e tudo. PDF que é peça gráfica — catálogo, encarte,
cardápio — sai **numa linha só e sem espaço entre as palavras**
(`CATÁLOGOBUFFETDOCES…`), porque o texto no arquivo não tem separação real.
Quando acontecer: não tentar limpar na mão —
avisar o usuário e ler a peça como imagem, que é o que ela é.

**2 · Excel enche de `NaN`.** Célula vazia vira `NaN` na tabela markdown (é o
pandas por baixo). É legível, mas polui. Em planilha que vai virar entregável,
limpar os `NaN` antes de usar.

**3 · Imagem sai com 0 bytes.** O README do MarkItDown promete "EXIF e OCR",
mas na prática o conversor de imagem depende do `exiftool` (**que não vem
instalado**) ou de um LLM externo plugado. Sem isso ele devolve **arquivo
vazio, sem dar erro**. **Não conte com OCR por aqui** —
pra imagem, eu leio direto, que é melhor e não custa nada.

**4 · Não confira o resultado com `Get-Content` no PowerShell.** O PowerShell
5.1 lê com a codepage ANSI e mostra `CATÃLOGO`/`FEIJÃƒO` num
arquivo que está **perfeitamente correto** em UTF-8, e o acento quebrado vira
um diagnóstico falso. Conferir com a ferramenta de leitura nativa, ou com
`Get-Content -Encoding utf8`.

---

## Regras

- **Roteador, não motor:** a tabela do Passo 1 decide. Áudio nunca vai pro
  MarkItDown
- **Sempre olhar a saída** antes de reportar sucesso
- Arquivo de cliente sai em `clientes/<nome>/saidas/`, nunca na raiz
- Conversão não substitui leitura: depois de converter, o trabalho de verdade
  (analisar, resumir, extrair copy) é das skills que existem pra isso:
  `/analisar-dados`, `/humanizer`, `/carrossel`
