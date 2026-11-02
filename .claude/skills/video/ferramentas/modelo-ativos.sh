#!/usr/bin/env bash
# Modelo do ativos.sh de uma peça: copie para a pasta da peça como `ativos.sh`
# e troque as linhas de exemplo pelas faixas que o roteiro escolheu.
#
# Refaz ativos/ (fora do git): o áudio em WAV (o MP3 carrega atraso de
# codificador no começo, e o efeito sai do quadro) e as imagens derivadas.
# Música e efeitos do Mixkit: grátis, uso comercial liberado, sem crédito
# obrigatório (https://mixkit.co/llm-info/). A origem de cada arquivo vai para a
# tabela de ativos do roteiro.md.
set -euo pipefail
aqui="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$aqui/ativos"
cd "$aqui/ativos"
baixa() { curl -sfL -A "Mozilla/5.0" "$1" -o "$2.mp3" && ffmpeg -v error -y -i "$2.mp3" -ar 48000 -ac 2 "$2.wav" && rm "$2.mp3"; }

# Música: o endereço está na página da faixa (https://assets.mixkit.co/music/<id>/<id>.mp3)
# baixa https://assets.mixkit.co/music/<id>/<id>.mp3 musica              # "<nome da faixa>", <autor>, <BPM medido>
# Efeitos: https://assets.mixkit.co/active_storage/sfx/<id>/<id>-preview.mp3
# baixa https://assets.mixkit.co/active_storage/sfx/<id>/<id>-preview.mp3 toque   # <nome do efeito>

# Ilustração com fundo branco que vai sobre textura: o recorte deixa só o desenho
# python "<caminho do workspace>/.claude/skills/video/ferramentas/recorta_fundo.py" <origem.png> <nome>.png

ls -la
