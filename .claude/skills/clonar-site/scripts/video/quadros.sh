#!/usr/bin/env bash
# quadros.sh — o vídeo vira o que se mede: folhas para achar as seções, um quadro
# cheio para achar a moldura, e quadros parados recortados na área da página.
#
#   bash quadros.sh folhas <video.mp4> <pasta> [CORTE]
#     folhas 4x4 a 3 quadros por segundo, com o tempo carimbado, em <pasta>/folhas/.
#     Servem para achar em que segundo cada seção está parada e ver o movimento.
#
#   bash quadros.sh cheio <video.mp4> <pasta> <t>
#     um quadro inteiro, sem corte, em <pasta>/cheio_<t>.png. É nele que se acha a
#     moldura, por número:  python -I tinta.py moldura <pasta>/cheio_<t>.png
#
#   bash quadros.sh quadros <video.mp4> <pasta> <CORTE> <t1> <t2> ...
#     um PNG em tamanho cheio por tempo, recortado, em <pasta>/stills/s_<t>.png.
#     Escolher, por seção, o tempo em que ela está PARADA e inteira (a entrada
#     acabou e a rolagem ainda não começou).
#
# CORTE é o crop do ffmpeg, largura:altura:x:y (ex.: 1400:876:100:194).
# 🚨 Só número PAR: o vídeo é yuv420, e o ffmpeg arredonda corte ímpar calado
# (1683 vira 1682, x=59 anda 1 px). Este script recusa o ímpar e imprime o
# tamanho real do PNG. A largura impressa é a largura em que tudo se mede depois.

set -u
modo="${1:-}"; video="${2:-}"; pasta="${3:-}"
ajuda() { sed -n '2,22p' "$0"; exit 1; }
[ -f "$video" ] && [ -n "$pasta" ] || ajuda

confere_par() {
  IFS=: read -r w h x y <<< "$1"
  for n in "$w" "$h" "$x" "$y"; do
    case "$n" in ''|*[!0-9]*) echo "CORTE inválido: $1 (largura:altura:x:y)"; exit 1 ;; esac
    [ $((n % 2)) -eq 0 ] || { echo "CORTE com número ímpar ($n em $1): o ffmpeg arredondaria calado. Use só par."; exit 1; }
  done
}

case "$modo" in
  folhas)
    corte="${4:-}"
    mkdir -p "$pasta/folhas"
    filtro="fps=3,scale=500:-1,drawtext=text='%{pts\\:hms}':x=6:y=6:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.7,tile=4x4:padding=4"
    [ -n "$corte" ] && { confere_par "$corte"; filtro="crop=$corte,$filtro"; }
    ffmpeg -v error -y -i "$video" -vf "$filtro" "$pasta/folhas/f%02d.jpg" 2>&1 | grep -v -i fontconfig
    ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,duration -of default=nw=1 "$video"
    echo "folhas: $(ls "$pasta/folhas" | wc -l) em $pasta/folhas"
    ;;
  cheio)
    t="${4:-}"; [ -n "$t" ] || ajuda
    mkdir -p "$pasta"
    ffmpeg -v error -y -ss "$t" -i "$video" -frames:v 1 "$pasta/cheio_$t.png" || exit 1
    echo "quadro cheio: $pasta/cheio_$t.png ($(ffprobe -v error -show_entries stream=width,height -of csv=p=0:s=x "$pasta/cheio_$t.png"))"
    ;;
  quadros)
    corte="${4:-}"; [ -n "$corte" ] || ajuda
    confere_par "$corte"
    shift 4
    [ $# -gt 0 ] || { echo "faltam os tempos"; exit 1; }
    mkdir -p "$pasta/stills"
    for t in "$@"; do
      ffmpeg -v error -y -ss "$t" -i "$video" -frames:v 1 -vf "crop=$corte" "$pasta/stills/s_$t.png" || echo "FALHOU $t"
    done
    primeiro="$pasta/stills/s_$1.png"
    echo "quadros: $(ls "$pasta/stills" | wc -l) em $pasta/stills, cada um com $(ffprobe -v error -show_entries stream=width,height -of csv=p=0:s=x "$primeiro") px"
    ;;
  *) ajuda ;;
esac
