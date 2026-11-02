#!/usr/bin/env bash
# A régua de "limpo" por pasta: para cada pasta, o comando que prova o padrão dela e o resultado.
# Roda da raiz do workspace: bash .claude/skills/sanitizacao/regua-por-pasta.sh
# Imprime uma linha de tabela por pasta; "verde" só quando o comando devolve o esperado.
# Sai com 1 se alguma linha ficou vermelha.

DATA='[0-9]{4}-[0-9]{2}-[0-9]{2}'
linha () { printf '| %s | `%s` | %s | %s |\n' "$1" "$2" "$3" "$4"; }
veredito () { [ "$1" = "$2" ] && echo verde || echo "VERMELHO (esperado $2)"; }

corpo () {
echo '| Pasta | Comando | Resultado | Veredito |'
echo '|---|---|---|---|'

# raiz: só o que a tabela "Estrutura do workspace" lista, mais a configuração
esperado='.claude .git .gitattributes .github .gitignore .gitleaksignore .mcp.json CLAUDE.md LICENSE README.md _memoria carrosseis clientes dados docs identidade lixeira marketing projetos-pessoais rascunho saidas scripts templates'
# as que o CLAUDE.md manda nascer no dia em que houver o que colocar dentro
esperado="$esperado produtos financeiro specs"
sobra=$(comm -23 <(ls -A | sort) <(tr ' ' '\n' <<<"$esperado" | sort) | tr '\n' ' ')
v=$(veredito "${sobra}" ''); linha 'raiz' 'comm -23 <(ls -A) <tabela>' "sobra: ${sobra:-nada}" "$v"

r=$(node scripts/confere-memoria.mjs >/dev/null 2>&1; echo $?)
v=$(veredito "$r" 0); linha '_memoria/' 'node scripts/confere-memoria.mjs' "saída $r (os [REVIEW] vão na lista dele)" "$v"

n=$(git ls-files identidade | grep -ciE '\.(mp4|mov|webm|wav|mp3)$')
v=$(veredito "$n" 0); linha 'identidade/' "git ls-files identidade | grep -ciE '\\.(mp4|mov|webm|wav|mp3)\$'" "$n" "$v"

if [ -d carrosseis ]; then
  n=$(find carrosseis -mindepth 1 -maxdepth 1 -type d | sed 's#.*/##' | grep -vcE "^[a-z0-9-]+-$DATA$")
  v=$(veredito "$n" 0); linha 'carrosseis/' "find carrosseis -mindepth 1 -maxdepth 1 -type d | grep -vcE '^[a-z0-9-]+-AAAA-MM-DD\$'" "$n fora do padrão" "$v"
fi

n=0; s=0
for d in saidas/*/; do
  [ -d "$d" ] || continue
  d=${d%/}; b=${d#saidas/}
  echo "$b" | grep -qE "^[a-z0-9-]+-$DATA$" || n=$((n+1))
  c=$(find "$d" -maxdepth 1 -type f \( -iname '*.md' -o -name 'index.html' \) | wc -l)
  [ "$c" -eq 0 ] && ! grep -qF "\`$b/\`" saidas/README.md && s=$((s+1))
done
v=$(veredito "$n$s" 00); linha 'saidas/' 'nome fora de <assunto>-AAAA-MM-DD; trabalho sem documento nem linha no README' "$n nomes, $s sem propósito" "$v"

n=$(ls -A dados | grep -vc '^README\.md$')
v=$(veredito "$n" 0); linha 'dados/' 'ls -A dados | grep -vc README.md' "$n" "$v"

z=$(for d in .claude/skills/*/; do [ -f "$d/SKILL.md" ] || echo "$d"; done | grep -v '/remotion/$' | wc -l)
v=$(veredito "$z" 0); linha '.claude/skills/' 'skill sem SKILL.md (o remotion é plugin)' "$z" "$v"

r=$(node .claude/skills/fabrica/scripts/teste-fabrica.mjs --sem-python >/dev/null 2>&1; echo $?)
v=$(veredito "$r" 0); linha '.claude/skills/fabrica/' 'node .claude/skills/fabrica/scripts/teste-fabrica.mjs --sem-python' "saída $r" "$v"

if command -v gh >/dev/null 2>&1 && git remote get-url origin >/dev/null 2>&1; then
  ruins=0; cegos=0
  for w in .github/workflows/*.yml; do
    # o gh que falha (remoto fora do GitHub, sem login, workflow que nunca rodou) não mede: não é vermelho
    if ! c=$(gh run list --workflow "$(basename "$w")" -L 1 --json conclusion --jq '.[0].conclusion // "nunca rodou"' 2>/dev/null) || [ "$c" = "nunca rodou" ]; then
      cegos=$((cegos+1))
    elif [ "$c" != success ]; then
      ruins=$((ruins+1))
    fi
  done
  if [ "$cegos" -gt 0 ] && [ "$ruins" -eq 0 ]; then
    linha '.github/' 'gh run list --workflow <cada um> -L 1' "$cegos sem leitura (remoto fora do GitHub, gh sem login ou workflow que nunca rodou)" 'não medido'
  else
    v=$(veredito "$ruins" 0); linha '.github/' 'gh run list --workflow <cada um> -L 1: a última rodada de cada workflow' "$ruins sem sucesso na última rodada" "$v"
  fi
else
  linha '.github/' 'gh run list' 'sem o gh ou sem remoto: não medido' 'não medido'
fi

p=$(find lixeira -mindepth 1 -maxdepth 1 ! -name README.md ! -name _manifesto.md | wc -l); l=$(grep -c '^| `' lixeira/_manifesto.md)
v=$(veredito "$p" "$l"); linha 'lixeira/' 'itens = linhas do _manifesto.md' "$p = $l" "$v"

n=$(ls -A rascunho | grep -vc '^README.md$')
linha 'rascunho/' 'ls -A rascunho | grep -vc README.md' "$n (área momentânea: só se apaga com pedido)" 'informativo'

r=$(node scripts/confere-contexto.mjs >/dev/null 2>&1; echo $?)
v=$(veredito "$r" 0); linha 'documentos' 'node scripts/confere-contexto.mjs' "saída $r" "$v"
r=$(node scripts/confere-peso-git.mjs >/dev/null 2>&1; echo $?)
v=$(veredito "$r" 0); linha 'peso' 'node scripts/confere-peso-git.mjs' "saída $r" "$v"
n=$(git ls-files -ci --exclude-standard | wc -l)
v=$(veredito "$n" 0); linha '.gitignore' 'git ls-files -ci --exclude-standard | wc -l' "$n" "$v"

}

saida=$(corpo)
echo "$saida"
! grep -q 'VERMELHO' <<<"$saida"
