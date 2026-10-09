# Ícones — Phosphor como equivalente de SF Symbols

> SF Symbols é da Apple e não se empacota na web. O equivalente adotado é o
> **Phosphor Icons** (`@phosphor-icons/react`): mesmo espírito de sistema —
> família única, pesos variáveis e variante preenchida.
> Instalação: o `scripts/install.sh` adiciona o pacote quando o projeto tem React.

---

## 1 · Uso

```tsx
import { GearSix, Heart } from "@phosphor-icons/react";

// peso regular por padrão; fill quando ativo/selecionado
<GearSix />                        // 1em, acompanha a fonte ao lado
<Heart weight="fill" color="var(--ios-red)" />
```

## 2 · As três regras

1. **Tamanho: o ícone alinha com a altura da fonte do texto ao lado.**
   O default do Phosphor já é `1em` — **não passar `size` fixo** ao lado de
   texto; deixar o `em` acompanhar. Tamanho fixo só onde uma barra define a
   medida (ex.: tab bar), e aí documentado no `.md` do componente.
2. **Peso: `regular` por padrão, `fill` quando ativo/selecionado.**
   Tab selecionada, favorito marcado, toggle ligado → `fill`. O par
   regular/fill é o mesmo contraste que o iOS faz com os símbolos. Os demais
   pesos (thin/light/bold/duotone) não fazem parte desta linguagem.
3. **Escolher pelo mapa abaixo, nunca de memória.** Nome errado de export
   quebra o build. Ícone fora da tabela: buscar por conceito em
   <https://phosphoricons.com>, manter a mesma óptica (linha ~1.5px, formas
   arredondadas) e **conferir o export** antes de usar.

## 3 · Mapa SF Symbols → Phosphor (os 60 mais usados)

> Conferidos um a um contra `@phosphor-icons/react` v2.1.10.

| # | SF Symbol | Phosphor | Uso típico |
|---|---|---|---|
| 1 | `chevron.right` | `CaretRight` | Chevron de célula ("leva pra outra tela") |
| 2 | `chevron.left` | `CaretLeft` | Voltar na nav bar |
| 3 | `chevron.down` | `CaretDown` | Expandir, abrir picker |
| 4 | `chevron.up` | `CaretUp` | Recolher |
| 5 | `xmark` | `X` | Fechar, cancelar |
| 6 | `checkmark` | `Check` | Confirmado, item selecionado |
| 7 | `plus` | `Plus` | Adicionar |
| 8 | `minus` | `Minus` | Remover, stepper |
| 9 | `magnifyingglass` | `MagnifyingGlass` | Busca |
| 10 | `ellipsis` | `DotsThree` | Mais opções |
| 11 | `gearshape` | `GearSix` | Ajustes |
| 12 | `info.circle` | `Info` | Informação |
| 13 | `questionmark.circle` | `Question` | Ajuda |
| 14 | `exclamationmark.triangle` | `Warning` | Atenção |
| 15 | `exclamationmark.circle` | `WarningCircle` | Erro em linha (formulário) |
| 16 | `checkmark.circle` | `CheckCircle` | Sucesso |
| 17 | `xmark.circle.fill` | `XCircle` | Limpar campo, falha |
| 18 | `arrow.clockwise` | `ArrowClockwise` | Atualizar, tentar de novo |
| 19 | `arrow.right` | `ArrowRight` | Avançar, ação de seguir |
| 20 | `line.3.horizontal` | `List` | Menu (hambúrguer) |
| 21 | `person` | `User` | Perfil |
| 22 | `person.2` | `Users` | Grupo, compartilhado com |
| 23 | `person.crop.circle` | `UserCircle` | Conta, avatar genérico |
| 24 | `envelope` | `Envelope` | Email |
| 25 | `phone` | `Phone` | Ligação |
| 26 | `message` | `ChatCircle` | Mensagem, conversa |
| 27 | `bell` | `Bell` | Notificações |
| 28 | `paperplane` | `PaperPlaneTilt` | Enviar |
| 29 | `mic` | `Microphone` | Áudio, ditado |
| 30 | `speaker.wave.2` | `SpeakerHigh` | Som ligado |
| 31 | `camera` | `Camera` | Câmera |
| 32 | `photo` | `Image` | Foto, galeria |
| 33 | `play.fill` | `Play` | Reproduzir (com `weight="fill"`) |
| 34 | `pause.fill` | `Pause` | Pausar (com `weight="fill"`) |
| 35 | `house` | `House` | Início (tab Home) |
| 36 | `slider.horizontal.3` | `FadersHorizontal` | Filtros, ajustes finos |
| 37 | `trash` | `Trash` | Apagar |
| 38 | `pencil` | `PencilSimple` | Editar |
| 39 | `square.and.pencil` | `NotePencil` | Compor, novo item |
| 40 | `square.and.arrow.up` | `Export` | Compartilhar |
| 41 | `square.and.arrow.down` | `DownloadSimple` | Baixar |
| 42 | `doc` | `File` | Arquivo |
| 43 | `doc.text` | `FileText` | Documento |
| 44 | `folder` | `Folder` | Pasta |
| 45 | `paperclip` | `Paperclip` | Anexo |
| 46 | `link` | `Link` | Link |
| 47 | `heart` | `Heart` | Curtir, favorito afetivo |
| 48 | `star` | `Star` | Avaliação, destaque |
| 49 | `bookmark` | `BookmarkSimple` | Salvar pra depois |
| 50 | `flag` | `Flag` | Sinalizar |
| 51 | `tag` | `Tag` | Etiqueta, categoria |
| 52 | `calendar` | `Calendar` | Data, agenda |
| 53 | `clock` | `Clock` | Hora, histórico |
| 54 | `mappin.and.ellipse` | `MapPin` | Local |
| 55 | `globe` | `Globe` | Web, idioma |
| 56 | `lock` | `Lock` | Privado, bloqueado |
| 57 | `key` | `Key` | Senha, credencial |
| 58 | `eye` | `Eye` | Mostrar (senha, prévia) |
| 59 | `eye.slash` | `EyeSlash` | Ocultar |
| 60 | `rectangle.portrait.and.arrow.right` | `SignOut` | Sair da conta |

## 4 · Cor do ícone

- Ícone **interativo**: `var(--ios-blue)` (é um controle, segue a regra do azul).
- Ícone **informativo** ao lado de texto: a mesma cor do texto (herda
  `currentColor` — o default do Phosphor — e pronto).
- Ícone **decorativo** em célula de lista: pode usar acento de categoria
  (ver `color.md` §1) dentro do padrão de "ícone com fundinho" da célula
  (ver `components/list.md`).
- Ícone sozinho **nunca** é o único sinal do estado — ver `accessibility.md`.

## 5 · Erros comuns

| Errado | Certo |
|---|---|
| `size={20}` ao lado de texto | Sem `size` — o `1em` acompanha a fonte |
| `weight="bold"` pra dar destaque | Destaque é `fill`, não bold |
| Ícone de memória (`Gear`, `Search`…) | Conferir na tabela/export: `GearSix`, `MagnifyingGlass` |
| Misturar Phosphor com outra família | Uma família só — a consistência É o sistema |
| `<X />` sem rótulo acessível no botão | `aria-label="Fechar"` no botão que o envolve |

## 6 · Phosphor sem React — sprite SVG inline

Projeto sem build (HTML puro, arquivo único, `file://`) não importa
`@phosphor-icons/react`. O caminho que funciona é o **sprite embutido** —
e os 20 glifos de shell mais usados já estão prontos em
`assets/phosphor-sprite.svg` (colar o SUBSET que o projeto usa; pares
regular/fill de kanban/chart-bar/clock existem pra tab bar):

1. **Ícone que não está no asset**: baixar o path de
   `https://unpkg.com/@phosphor-icons/core/assets/regular/<nome>.svg`
   (e `/fill/<nome>-fill.svg` pros que têm estado ativo). Nunca confundir com
   SF Symbols, que não se embutem na web.
2. **Montar o sprite** no início do body:
   `<svg style="display:none" aria-hidden="true"><defs>` +
   `<symbol id="ph-<nome>" viewBox="0 0 256 256"><path d="…"/></symbol>` —
   viewBox 256 é o do Phosphor. ⚠️ `style="display:none"` é obrigatório:
   o atributo `hidden` NÃO se aplica a `<svg>` (ver `web-translation.md` §8c).
3. **Consumir** com `<svg class="ic" aria-hidden="true"><use href="#ph-<nome>"/></svg>`
   e `.ic{width:1em;height:1em;fill:currentColor;flex:none}` — as três
   regras do §2 continuam valendo (1em, currentColor, regular→fill no ativo;
   o par regular/fill troca pelo `href`).
4. **Tamanho fixo só onde a barra define a medida**, sempre comentado:
   24px em tab bar e tiles de ação, 20px em glifo de sidebar/notice,
   48px em empty state.
5. **Higiene**: símbolo sem `href` que o use é peso morto — remover; e uso
   por variável (`href="#${icone}"`) não aparece em grep literal, conferir
   antes de podar.
