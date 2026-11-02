# Histórico da fundação

Uma entrada por versão. Cada uma diz o que mudou nos **conferidos** (chega ao
projeto pelo `--atualizar`, sozinho), nas **sementes** (a que o projeto não
tocou chega pelo `--atualizar`; a que ele editou chega só como aviso, com o
diff, e ele aplica à mão se quiser) e se a versão **quebra** projeto instalado.

O `gerar-manifesto.mjs --versao X` recusa subir a versão sem uma entrada aqui,
e sem o teste inteiro verde sobre o conteúdo de agora. A entrada nova entra no
topo, acima da última.

---

## v1.0.0

A versão que acompanha o workspace: a primeira que um projeto dele recebe.

- **Conferidos**: o `base.css` e os quatro conferidores (`fundacao`, `marca`,
  `auditar-ui`, `tela`), com as provas e as libs.
- **Sementes**: o app Next 16 com Tailwind 4, os dez componentes do shadcn no
  tema da marca, o CLI `shadcn` em `devDependencies`, o banco Supabase
  desligável (`--sem-banco`), a vitrine e a tela do Playwright com axe. A marca
  padrão é a do projeto, gerada das cores e da fonte da entrevista; a do
  workspace só entra com `--marca casa`. A trilha app leva junto o
  `package-lock.json` que o teste usa (fora do manifesto: o `npm install` o
  reescreve), e o lock que o projeto já tem fica.
- **Quebra**: não se aplica (não há projeto instalado antes dela).
