#!/usr/bin/env bash
# Fecha um lote: regenera o manifesto, reaplica as entradas, sincroniza os numeros do
# SKILL.md/README.md, regenera o catalogo das imagens e o indice, arruma o fim de linha e confere tudo.
#
# A ordem importa:
#   1. manifesto ANTES de reaplicar (o motor le a lista de la)
#   2. numeros DEPOIS de reaplicar (ele conta o que esta em references/)
#   3. indexar por ultimo, ja com a contagem final
#
# Rodar: bash _local/sincronizar.sh [--completo] [--raiz <copia>]
#   sem argumento : manifesto + reaplicar + numeros + catalogo + indexar + verificar
#   --completo    : acrescenta as suites que provam que a regua sabe reprovar
#   --raiz <copia>: fecha o lote numa COPIA da skill (ensaio dos passos 5 a 7): roda os scripts da
#                   copia, dentro dela, e nao escreve nada na skill de verdade

set -u
completo=0; raiz=""
while [ $# -gt 0 ]; do
  case "$1" in
    --completo) completo=1 ;;
    --raiz) raiz="${2:-}"; shift ;;
    *) echo "argumento desconhecido: $1"; exit 2 ;;
  esac
  shift
done
if [ -n "$raiz" ]; then
  [ -f "$raiz/_local/manifesto.json" ] || { echo "--raiz $raiz: não é uma cópia da skill (falta _local/manifesto.json)"; exit 2; }
  cd "$raiz" || exit 1
  echo "fechando o lote na cópia: $(pwd)"
else
  cd "$(dirname "$0")/.." || exit 1
fi

falhou=0
passo() { printf '\n>>> %s\n' "$1"; }

passo 'manifesto'
node _local/gera-manifesto.mjs --escreve | tail -3

passo 'reaplicar'
node _local/reaplicar.mjs --escreve 2>&1 | grep -E '^(entradas|mudancas)' || true

passo 'números do SKILL.md e README.md'
node _local/numeros.mjs --escreve | tail -2

# O catalogo das imagens sai do _local/imagens.json e das linhas Visual: antes do verificador,
# que o confere.
passo 'catálogo das imagens'
node _local/catalogo.mjs --escreve | head -1

passo 'indice'
node _local/indexar.mjs --escreve | grep -E 'princípios|maior tema|AVISO'
sed -i 's/\r$//' INDEX.md

# `cmd | tail` devolve o codigo de saida do TAIL, nao do cmd: LOTE FECHADO sairia por cima
# de um verificador reprovado. Rodar, guardar o codigo, e so entao filtrar a saida.
roda_e_mostra() {
  local saida rc
  saida="$(node "$1" 2>&1)"; rc=$?
  printf '%s\n' "$saida" | grep -E 'FALHOU|AVISO|^TUDO|^REPROVADO|defeitos plantados|conferências' || true
  [ "$rc" -eq 0 ] || falhou=1
}

passo 'verificar'
roda_e_mostra _local/verificar.js

if [ "$completo" -eq 1 ]; then
  passo 'a régua sabe reprovar?'
  roda_e_mostra _local/teste-verificar.mjs
  passo 'o motor reconstrói byte a byte?'
  roda_e_mostra _local/teste-reaplicar.mjs
  passo 'os scripts de captura se comportam? (fontes, janela, imagens)'
  roda_e_mostra _local/teste-captura.mjs
fi

printf '\n'
[ "$falhou" -eq 0 ] && echo 'LOTE FECHADO' || echo 'LOTE REPROVADO'
exit "$falhou"
