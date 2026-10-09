#!/usr/bin/env bash
# ios-core-design v1.0 — instalador
# ============================================================
# Injeta o design system num projeto web:
#   - copia os tokens (ios-tokens.css) pra pasta de estilos — sempre
#   - detecta Tailwind v3 (copia o preset ios.tailwind.preset.js e edita o
#     tailwind.config) ou v4 (copia o @theme como ios-theme.css)
#   - injeta os @import no CSS principal (bloco delimitado, idempotente)
#   - instala @phosphor-icons/react quando o projeto tem React
#
# O que ele NÃO instala (cópia manual de assets/, quando o caso pedir):
#   app-shell-template.html (chassi single-file) · phosphor-sprite.svg
#   (ícones pra arquivo único) · tokens.json (espelho de leitura)
#
# Uso:
#   install.sh <caminho-do-projeto> [--dry-run] [--no-icons]
#
# Idempotente: rodar duas vezes seguidas deixa a segunda inteira "já em dia".
# Proteções: arquivo GERADO só é sobrescrito se tiver o marcador
# "ios-core-design" na 1ª linha; o CSS principal e o tailwind.config do
# projeto são editados por bloco delimitado (>>> <<<) com backup .ios-bak
# e node --check — nunca reescritos por inteiro.
# ============================================================
set -euo pipefail

SKILL_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ASSETS="$SKILL_ROOT/assets"

usage() {
  echo "uso: install.sh <caminho-do-projeto> [--dry-run] [--no-icons]"
}

# ---------------------------------------------------------------- argumentos
DRY=0
NO_ICONS=0
TARGET=""
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY=1 ;;
    --no-icons) NO_ICONS=1 ;;
    -h|--help) usage; exit 0 ;;
    -*) echo "erro: opção desconhecida: $arg"; usage; exit 1 ;;
    *) TARGET="$arg" ;;
  esac
done
[ -n "$TARGET" ] || { usage; exit 1; }
[ -d "$TARGET" ] || { echo "erro: pasta não existe: $TARGET"; exit 1; }
TARGET="$(cd "$TARGET" && pwd)"
command -v node >/dev/null 2>&1 || { echo "erro: node é necessário no PATH"; exit 1; }

# prefixo dos verbos no dry-run
if [ "$DRY" -eq 1 ]; then P="[dry-run] "; else P=""; fi

# ------------------------------------------------------------------- resumo
declare -a SUMMARY=()
declare -a MANUAL_NOTES=()
add_row() { SUMMARY+=("$1|$2|$3"); }
add_manual() { MANUAL_NOTES+=("$1"); }

# ---------------------------------------------------------------- detecção
PKG="$TARGET/package.json"
HAS_PKG=0; [ -f "$PKG" ] && HAS_PKG=1

# package manager por lockfile
PM_ADD="npm install"
PM_NAME="npm"
if [ -f "$TARGET/bun.lockb" ] || [ -f "$TARGET/bun.lock" ]; then PM_ADD="bun add"; PM_NAME="bun";
elif [ -f "$TARGET/pnpm-lock.yaml" ]; then PM_ADD="pnpm add"; PM_NAME="pnpm";
elif [ -f "$TARGET/yarn.lock" ]; then PM_ADD="yarn add"; PM_NAME="yarn"; fi

# dependências (via node; o caminho vai como argv — o Git Bash converte pro formato nativo)
dep_version() { # nome -> versão declarada ou vazio
  [ "$HAS_PKG" -eq 1 ] || { echo ""; return; }
  node -e "
    const fs = require('fs');
    const p = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
    const d = { ...(p.dependencies||{}), ...(p.devDependencies||{}) };
    process.stdout.write(d[process.argv[2]] || '');
  " "$PKG" "$1" 2>/dev/null || echo ""
}

TW_VERSION="$(dep_version tailwindcss)"
HAS_TW_POSTCSS="$(dep_version @tailwindcss/postcss)"
HAS_TW_VITE="$(dep_version @tailwindcss/vite)"
REACT_VERSION="$(dep_version react)"
PHOSPHOR_VERSION="$(dep_version @phosphor-icons/react)"

# CSS principal: primeiro candidato que existir
CSS_MAIN=""
for candidate in \
  "app/globals.css" "src/app/globals.css" "src/index.css" "src/main.css" \
  "src/styles/global.css" "src/styles/globals.css" "src/styles.css" "src/style.css" \
  "styles/globals.css" "styles/global.css"; do
  if [ -f "$TARGET/$candidate" ]; then CSS_MAIN="$candidate"; break; fi
done

# v4 também se o CSS principal importa "tailwindcss" (CSS-first sem dep major clara)
CSS_IMPORTS_TW=0
if [ -n "$CSS_MAIN" ] && grep -Eq '@import[[:space:]]+"tailwindcss"' "$TARGET/$CSS_MAIN"; then
  CSS_IMPORTS_TW=1
fi

TW_MODE="none"
TW_MAJOR="${TW_VERSION//[^0-9]/}"; TW_MAJOR="${TW_MAJOR:0:1}"
if [ -n "$HAS_TW_POSTCSS" ] || [ -n "$HAS_TW_VITE" ] || [ "$CSS_IMPORTS_TW" -eq 1 ] || [ "$TW_MAJOR" = "4" ]; then
  TW_MODE="v4"
elif [ "$TW_MAJOR" = "3" ]; then
  TW_MODE="v3"
fi

# config do v3
TW_CONFIG=""
for candidate in tailwind.config.js tailwind.config.cjs tailwind.config.mjs tailwind.config.ts; do
  if [ -f "$TARGET/$candidate" ]; then TW_CONFIG="$candidate"; break; fi
done

# destino dos tokens
if [ -d "$TARGET/src" ]; then DEST_DIR="src/styles"; else DEST_DIR="styles"; fi

echo "${P}alvo: $TARGET"
echo "${P}contexto: tailwind=$TW_MODE · pm=$PM_NAME · react=$([ -n "$REACT_VERSION" ] && echo sim || echo não) · css-principal=${CSS_MAIN:-nenhum}"
echo ""

# ------------------------------------------------- ação 1: copiar arquivos
install_file() { # $1 origem (em assets/)  $2 destino relativo  $3 rótulo
  local src="$ASSETS/$1" dst="$TARGET/$2" label="$3"
  if [ -f "$dst" ]; then
    # marcador ESTRITO: a 1ª linha precisa começar com o cabeçalho gerado
    # ("/* ios-core-design v..."), não apenas citar o nome em qualquer comentário
    if head -n 1 "$dst" | grep -Eq '^/\* ios-core-design v[0-9]'; then
      if cmp -s "$src" "$dst"; then
        add_row "$label" "$2" "já em dia"
      else
        if [ "$DRY" -eq 0 ]; then cp "$src" "$dst"; fi
        add_row "$label" "$2" "${P}atualizado"
      fi
    else
      add_row "$label" "$2" "MANUAL"
      add_manual "O arquivo $2 já existe e NÃO é do ios-core-design — não foi tocado. Compare com $src e resolva na mão."
    fi
  else
    if [ "$DRY" -eq 0 ]; then mkdir -p "$(dirname "$dst")"; cp "$src" "$dst"; fi
    add_row "$label" "$2" "${P}criado"
  fi
}

# nunca "tokens.css" — projetos costumam ter um tokens próprio; instalador educado não colide
install_file "tokens.css" "$DEST_DIR/ios-tokens.css" "tokens"
if [ "$TW_MODE" = "v4" ]; then
  install_file "tailwind-v4.css" "$DEST_DIR/ios-theme.css" "theme v4"
fi

# ------------------------------------------- ação 2: injetar @import no CSS
MARK_OPEN="/* >>> ios-core-design >>> */"
MARK_CLOSE="/* <<< ios-core-design <<< */"

if [ -z "$CSS_MAIN" ]; then
  add_row "import css" "-" "MANUAL"
  IMPORT_HINT="@import \"./$DEST_DIR/ios-tokens.css\";"
  [ "$TW_MODE" = "v4" ] && IMPORT_HINT="$IMPORT_HINT
@import \"./$DEST_DIR/ios-theme.css\";"
  add_manual "Nenhum CSS principal encontrado. Adicione ao seu CSS global (caminhos relativos a ele):
$IMPORT_HINT"
else
  # caminhos relativos do CSS principal até o destino
  REL_TOKENS="$(node -e "
    const path = require('path');
    let r = path.relative(path.dirname(process.argv[1]), process.argv[2]).split(path.sep).join('/');
    if (!r.startsWith('.')) r = './' + r;
    process.stdout.write(r);
  " "$TARGET/$CSS_MAIN" "$TARGET/$DEST_DIR/ios-tokens.css")"
  BLOCK="$MARK_OPEN
@import \"$REL_TOKENS\";"
  if [ "$TW_MODE" = "v4" ]; then
    REL_THEME="${REL_TOKENS%ios-tokens.css}ios-theme.css"
    BLOCK="$BLOCK
@import \"$REL_THEME\";"
  fi
  BLOCK="$BLOCK
$MARK_CLOSE"

  STATUS="$(node -e "
    // injeta/atualiza o bloco delimitado, sempre só @import, após o último @import do topo
    const fs = require('fs');
    const [file, block, dry] = process.argv.slice(1);
    const src = fs.readFileSync(file, 'utf8');
    const open = '/* >>> ios-core-design >>> */';
    const close = '/* <<< ios-core-design <<< */';
    let out, status;
    if (src.includes(open) && src.includes(close)) {
      // troca por posição (indexOf), sem regex — robusto a qualquer conteúdo do bloco
      const i = src.indexOf(open);
      const j = src.indexOf(close) + close.length;
      out = src.slice(0, i) + block + src.slice(j);
      status = out === src ? 'já em dia' : 'atualizado';
    } else {
      // acha o fim da sequência de @import/@charset/comentários/vazios do topo
      const lines = src.split('\n');
      let lastImport = -1;
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i].trim();
        if (l.startsWith('@import') || l.startsWith('@charset')) { lastImport = i; continue; }
        if (l === '' || l.startsWith('/*') || l.startsWith('*') || l.startsWith('//')) continue;
        break;
      }
      lines.splice(lastImport + 1, 0, block);
      out = lines.join('\n');
      status = 'criado';
    }
    if (dry !== '1' && status !== 'já em dia') fs.writeFileSync(file, out);
    process.stdout.write(status);
  " "$TARGET/$CSS_MAIN" "$BLOCK" "$DRY")"
  if [ "$STATUS" = "já em dia" ]; then
    add_row "import css" "$CSS_MAIN" "já em dia"
  else
    add_row "import css" "$CSS_MAIN" "${P}${STATUS}"
  fi
fi

# --------------------------------------------- ação 3: Tailwind v3 (preset)
if [ "$TW_MODE" = "v3" ]; then
  install_file "tailwind.preset.js" "ios.tailwind.preset.js" "preset v3"
  SNIPPET="presets: [require('./ios.tailwind.preset.js')],"
  if [ -z "$TW_CONFIG" ]; then
    add_row "config v3" "-" "MANUAL"
    add_manual "Tailwind v3 sem tailwind.config encontrado. Crie um com:  module.exports = { $SNIPPET content: [...] }"
  elif grep -q "ios.tailwind.preset" "$TARGET/$TW_CONFIG"; then
    add_row "config v3" "$TW_CONFIG" "já em dia"
  else
    case "$TW_CONFIG" in
      *.js|*.cjs)
        if [ "$DRY" -eq 1 ]; then
          add_row "config v3" "$TW_CONFIG" "${P}editaria (presets)"
        else
          cp "$TARGET/$TW_CONFIG" "$TARGET/$TW_CONFIG.ios-bak"
          EDIT_OK="$(node -e "
            const fs = require('fs');
            const file = process.argv[1];
            let src = fs.readFileSync(file, 'utf8');
            let done = false;
            if (/presets\s*:\s*\[/.test(src)) {
              src = src.replace(/presets\s*:\s*\[/, m => m + \"require('./ios.tailwind.preset.js'), \");
              done = true;
            } else if (/module\.exports\s*=\s*\{/.test(src)) {
              src = src.replace(/module\.exports\s*=\s*\{/, m => m + \"\\n  presets: [require('./ios.tailwind.preset.js')],\");
              done = true;
            }
            if (done) { fs.writeFileSync(file, src); process.stdout.write('ok'); }
            else process.stdout.write('padrao');
          " "$TARGET/$TW_CONFIG")"
          if [ "$EDIT_OK" = "ok" ] && node --check "$TARGET/$TW_CONFIG" >/dev/null 2>&1; then
            rm -f "$TARGET/$TW_CONFIG.ios-bak"
            add_row "config v3" "$TW_CONFIG" "atualizado"
          else
            # política dura: nunca deixar um config que não parseia
            mv -f "$TARGET/$TW_CONFIG.ios-bak" "$TARGET/$TW_CONFIG"
            add_row "config v3" "$TW_CONFIG" "MANUAL"
            add_manual "Não reconheci o formato de $TW_CONFIG (nada foi alterado). Adicione na mão:  $SNIPPET"
          fi
        fi
        ;;
      *)
        add_row "config v3" "$TW_CONFIG" "MANUAL"
        add_manual "Config $TW_CONFIG (.ts/.mjs) não é editado automaticamente. Adicione na mão:  $SNIPPET  (em .ts/.mjs: import iosPreset from './ios.tailwind.preset.js' e presets: [iosPreset])"
        ;;
    esac
  fi
fi

# ------------------------------------------------- ação 4: sem Tailwind
if [ "$TW_MODE" = "none" ]; then
  add_row "tailwind" "-" "pulado (projeto sem Tailwind)"
  add_manual "Sem Tailwind: os tokens e as classes .ios-* do ios-tokens.css valem sozinhos; os componentes .tsx da skill pressupõem Tailwind — o CSS puro de referência é o assets/PREVIEW.html."
fi

# ------------------------------------------------- ação 5: Phosphor Icons
if [ "$NO_ICONS" -eq 1 ]; then
  add_row "phosphor" "-" "pulado (--no-icons)"
elif [ -z "$REACT_VERSION" ]; then
  add_row "phosphor" "-" "pulado (projeto sem React)"
elif [ -n "$PHOSPHOR_VERSION" ]; then
  add_row "phosphor" "@phosphor-icons/react" "já em dia"
else
  if [ "$DRY" -eq 1 ]; then
    add_row "phosphor" "@phosphor-icons/react" "${P}instalaria: $PM_ADD @phosphor-icons/react"
  else
    (cd "$TARGET" && $PM_ADD @phosphor-icons/react)
    add_row "phosphor" "@phosphor-icons/react" "instalado"
  fi
fi

# ------------------------------------------------------------------- saída
echo "${P}resumo:"
printf '  %-12s | %-34s | %s\n' "AÇÃO" "ALVO" "STATUS"
printf '  %-12s | %-34s | %s\n' "------------" "----------------------------------" "----------"
for row in "${SUMMARY[@]}"; do
  IFS='|' read -r a b c <<< "$row"
  printf '  %-12s | %-34s | %s\n' "$a" "$b" "$c"
done

if [ ${#MANUAL_NOTES[@]} -gt 0 ]; then
  echo ""
  echo "${P}ações manuais pendentes:"
  for note in "${MANUAL_NOTES[@]}"; do
    echo "  - $note"
  done
fi

echo ""
echo "${P}pronto. Lembretes: os tokens exigem viewport-fit=cover pra safe area (web-translation.md §1)."
echo "${P}caso single-file (painel/protótipo): o chassi assets/app-shell-template.html e o assets/phosphor-sprite.svg são cópia manual — este instalador não os copia de propósito."
exit 0
