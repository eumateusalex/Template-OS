# Regras de movimento

Valem nos dois motores. Os números vêm de cursos de motion design feitos com IA
e foram conferidos na primeira peça medida. A curva padrão é
`cubic-bezier(0.2, 0.65, 0.2, 1)`: sai rápido, assenta devagar. Se a marca tiver
curva própria (no `tokens.css` ou no `marca.md`), ela manda.

## O que tem número

| Regra | Valor |
|---|---|
| chegada | rápida e macia: cada quadro cobre 12 a 19% da distância que falta (é o que a curva padrão faz) |
| duração de um movimento | pelo menos 0,3 s (9 quadros); os grandes, 0,5 a 0,75 s |
| cascata entre irmãos | 2 a 4 quadros |
| texto parado | pelo menos 8 quadros antes de sair; e tempo de leitura de ~3 palavras por segundo |
| corte e troca de texto | na batida, ou 2 quadros antes; o morph começa ~4 quadros antes da cena |
| pausa | nada congela: a pausa leva um empurrão lento (2 a 5% na cena inteira) |
| trecho sem nada novo | no máximo ~3 s: algo novo a cada 2 a 4 s |
| motion blur | 8 subquadros onde algo anda mais de ~15 px por quadro (4 dá fantasma) |

## O que decide

- **Transformar em vez de fazer fade.** A coisa muda de forma (o botão vira a
  conversa, o cartão vira a pílula); fade puro é o padrão de quem não escolheu.
- **Um movimento principal por vez.** Título, celular, painel e contador entrando
  juntos no mesmo drop disputam o olho; escalonar resolve.
- **Causa antes do efeito.** O que prova a tese acontece sozinho na tela
  (o fio que não chega), e só depois o que distrai (o contador).
- **Um plano novo quando a ideia muda.** Oito segundos no mesmo enquadramento,
  mudando só um número, reprovam na crítica.
- **O quadro 0 é a capa.** Texto legível e algo já entrando: nenhum plano começa parado.
- **Todo movimento responde "o que isso comunica?"** Se a resposta for "nada, é
  bonito", corta.

## Proibidos

Título centralizado sobre degradê; tudo entrando em fade; brilho (glow);
partículas genéricas; rótulos e molduras nos cantos; interface inventada de
produto real (a tela de terceiro entra genérica, sem logo nem layout copiado);
3D e modo escuro "de trailer" sem pedido; sombra difusa decorativa; cor fora da
marca; **pessoa recortada do fundo real** (a cabeça saltando do cartão, por
remoção de fundo automática: o contorno sai esquisito). Gravação real entra
inteira, dentro do cartão ou em tela cheia; recorte só sobre fundo liso ou chroma. Recusa do usuário (técnica, cor, linguagem) entra nesta lista ou no
`marca/marca.md` no mesmo dia, e a peça seguinte já não a usa. <!-- caminho futuro: o marca.md nasce no /carrossel configurar -->
