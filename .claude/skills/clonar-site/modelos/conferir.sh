#!/usr/bin/env bash
# conferir.sh — a régua do projeto reconstruído de vídeo, num comando só.
# Copiar para <projeto>/regua/conferir.sh, com alvos.json, posicoes.json,
# posicoes-mov.json e interacao.mjs ao lado.
#
#   bash regua/conferir.sh            o ciclo inteiro (uns 2 min)
#   bash regua/conferir.sh --rapido   só a posição e o peso (uns 40 s)
#   PORTA=4518 bash regua/conferir.sh
#
# O ciclo: derruba o que estiver na porta, build, sobe, fotografa nas posições
# dos quadros, e prova, nesta ordem, parando na primeira vermelha:
#   1 posição e 2 peso   tinta.py comparar
#   3 cor                tinta.py cores (os dois lados)
#   5 movimento          a sequência de cada entrada, o quadro 0 (tinta.py entrada)
#                        e um par por posição; par que não sai reprova
#   6 interação          regua/interacao.mjs
#   7 largura e reduce   confere-pagina.mjs
# e monta a prancha (4 e 5, para o olho). Deixa o servidor de pé no fim.
#
# 🚨 Verde aqui NÃO é "idêntico". Fica de fora, e a última linha repete:
# o OLHO nos pares (foto, ícone, curva e duração do movimento) e o DESEMPENHO
# (dimensão 8, `npx motionscore`). Aviso de peso em texto miúdo não reprova: se olha.
#
# Build e start, não `next dev`: o dev roda os efeitos duas vezes e mostra o selo
# do Next na foto. Os registros (build, servidor) vão para node_modules/.cache,
# que o Git já ignora.

set -u
P="$(realpath "$(dirname "$0")/..")"
S="${SKILL:?SKILL= aponta para a pasta da skill clonar-site}/scripts/video"
PORTA="${PORTA:-4517}"
# Projeto de dois idiomas (origem estrangeira, site em pt-BR): a régua mede o texto
# da origem, então o build dela sai nesse idioma (IDIOMA_REGUA=en, que vira
# NEXT_PUBLIC_IDIOMA). O site entregue se confere depois, num build próprio, pelo
# confere-pagina. Sem a variável, o build é o padrão do projeto.
IDIOMA_REGUA="${IDIOMA_REGUA:-}"
URL="http://localhost:$PORTA"
REF="$P/referencia"
FOTOS="$P/regua/fotos"
LOGS="$P/node_modules/.cache/regua"
mkdir -p "$LOGS"
QUADRO="$(ls "$REF/stills"/*.png | head -1)"
le() { python -I -c "import json,sys; print(json.load(open(sys.argv[1], encoding='utf-8')).get(sys.argv[2], ''))" "$P/regua/alvos.json" "$1"; }
LARGURA="$(le largura)"
CORTE="$(le corte)"
[ -n "$LARGURA" ] && [ -n "$CORTE" ] || { echo 'o alvos.json precisa de "largura" e "corte"'; exit 1; }
vermelho() { echo "RÉGUA VERMELHA: $1"; exit 1; }

# no Windows o `npm run start` em segundo plano não morre sozinho: derruba pelo dono da porta
for pid in $(netstat -ano | grep ":$PORTA " | grep LISTENING | awk '{print $NF}' | sort -u); do taskkill //PID "$pid" //F > /dev/null 2>&1; done

NEXT_PUBLIC_IDIOMA="${IDIOMA_REGUA:-$NEXT_PUBLIC_IDIOMA}" npm --prefix "$P" run build > "$LOGS/build.log" 2>&1 || { tail -15 "$LOGS/build.log"; vermelho "build ($LOGS/build.log)"; }
echo "build verde"
(npm --prefix "$P" run start -- -p "$PORTA" > "$LOGS/start.log" 2>&1 &)
for i in $(seq 1 30); do curl -s -o /dev/null -w "%{http_code}" "$URL/" | grep -q 200 && break; sleep 1; done
curl -s -o /dev/null -w "%{http_code}" "$URL/" | grep -q 200 || vermelho "o servidor não subiu ($LOGS/start.log)"

rm -rf "$FOTOS"
URL="$URL" QUADRO="$QUADRO" POSICOES="$P/regua/posicoes.json" SAIDA="$FOTOS" node "$S/fotografa.mjs" || vermelho "fotografa"
python -I "$S/tinta.py" comparar "$P/regua/alvos.json" "$REF/stills" "$FOTOS" | tee "$LOGS/posicao.txt"
[ "${PIPESTATUS[0]}" -eq 0 ] || vermelho "posição ou peso (dimensões 1 e 2)"
AVISOS="$(grep -o 'avisos de peso [0-9]*' "$LOGS/posicao.txt" | grep -o '[0-9]*$')"
[ "${1:-}" = "--rapido" ] && { echo "posição e peso verdes (ciclo rápido: o resto não rodou)"; exit 0; }

python -I "$S/tinta.py" cores "$P/regua/alvos.json" "$REF/stills" "$FOTOS" || vermelho "cor (dimensão 3)"

# Movimento: uma sequência por posição do posicoes-mov.json, o quadro 0 conferido e o par montado.
[ -f "$P/regua/posicoes-mov.json" ] || vermelho 'falta regua/posicoes-mov.json (dimensão 5): cada entrada com "video" e "nasce"'
VIDEO="$(ls "$REF"/*.mp4 | head -1)"
rm -rf "$P/regua/fotos-mov"
rm -f "$REF/pares"/mov-*.jpg
URL="$URL" QUADRO="$QUADRO" POSICOES="$P/regua/posicoes-mov.json" SAIDA="$P/regua/fotos-mov" MODO=sequencia node "$S/fotografa.mjs" || vermelho "sequência de movimento"
python -I "$S/tinta.py" entrada "$P/regua/posicoes-mov.json" "$P/regua/fotos-mov" || vermelho "entrada (dimensão 5): algo já estava na tela antes de entrar"
ESPERADOS=0
while read -r nome t0; do
  ESPERADOS=$((ESPERADOS + 1))
  python -I "$S/prancha.py" movimento "$VIDEO" "$CORTE" "$t0" "${PASSO:-300}" "$P/regua/fotos-mov" "$nome" "$REF/pares" || vermelho "par de movimento de $nome"
done < <(python -I -c "import json,sys; [print(p['nome'], p['video']) for p in json.load(open(sys.argv[1], encoding='utf-8')) if 'video' in p]" "$P/regua/posicoes-mov.json")
FEITOS="$(ls "$REF/pares"/mov-*.jpg 2> /dev/null | wc -l)"
[ "$ESPERADOS" -gt 0 ] && [ "$FEITOS" -eq "$ESPERADOS" ] || vermelho "pares de movimento: $FEITOS de $ESPERADOS"

[ -f "$P/regua/interacao.mjs" ] || vermelho "falta regua/interacao.mjs (dimensão 6); se o vídeo não mostra interação nenhuma, um arquivo que diga isso e saia 0"
URL="$URL" node "$P/regua/interacao.mjs" || vermelho "interação (dimensão 6)"
URL="$URL" BASE="$LARGURA" LARGURAS="390,768,1024,1280,$LARGURA" node "$S/confere-pagina.mjs" || vermelho "largura ou movimento reduzido (dimensão 7)"
python -I "$S/prancha.py" pares "$P/regua/alvos.json" "$REF/stills" "$FOTOS" "$REF/pares" || vermelho "prancha"

echo
echo "RÉGUA VERDE nas dimensões 1, 2, 3, 5 (quadro 0), 6 e 7."
[ "${AVISOS:-0}" -gt 0 ] && echo "  $AVISOS aviso(s) de peso em texto miúdo: olhar no par."
echo "  Falta, e não é desta régua: o OLHO em $REF/pares/comparacao.html (foto, ícone,"
echo "  curva e duração do movimento) e o DESEMPENHO (npx --yes motionscore $URL --agent)."
