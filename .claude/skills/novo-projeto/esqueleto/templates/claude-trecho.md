## Fundação

Este projeto foi criado pelo `/novo-projeto`, e roda sem a casa: tudo que ele precisa
para instalar, buildar, testar e publicar mora aqui dentro.

- **`fundacao/` é conferido**: o `base.css` (foco, toque, campo, movimento) e
  os conferidores. Não se edita; o conferidor `fundacao` reprova quem editar.
- **A marca é deste projeto**, e mora em `src/styles/` (`tokens.css`,
  `fontes.css`, `tema-shadcn.css`), com `src/styles/marca.css` como a única
  entrada. Foi gerada da entrevista de criação; para trocar, edite ou gere de
  novo.
- **O resto é seu**: configs, layout, estados, a `Secao`, o FAQ, a `/vitrine`,
  o banco e o proxy, o Dockerfile. Mude à vontade.
- **No dia a dia**, o comando é `npm run portao`.
- **O texto que o público lê é dado**, em `src/app/(site)/conteudo/`: é lá que
  o conferidor de travessão cobra.
- **A cor se pede pelo papel**: `var(--acento)`, `bg-primary`. Nunca hex, nunca
  classe da paleta do Tailwind (o conferidor `marca` cobra, em catraca).
