# Configuração do pipeline do Instagram

> Preencha antes de rodar `/instagram-saved-scanner` ou `/instagram-reference`.
> O passo a passo para conseguir cada valor está no [README](README.md).

```yaml
# A sua conta do Instagram, SEM arroba. É a conta cujos Salvos serão varridos.
instagram_username: SEU_USUARIO_AQUI

# ID do database "Banco de Referências" (32 caracteres, da URL do Notion)
notion_banco_referencias_id: ID_DO_BANCO_DE_REFERENCIAS_AQUI

# ID do database "Ideias de Conteúdo"
notion_ideias_conteudo_id: ID_DAS_IDEIAS_DE_CONTEUDO_AQUI

# Pasta dos arquivos de contexto. Só mude se você mover esta pasta.
content_path: marketing/instagram

# Pasta de trabalho dos downloads. Não é versionada, e se esvazia sozinha.
temp_path: marketing/instagram/.tmp
```

---

## Enquanto isto estiver com placeholder

As duas skills **param e avisam**, de propósito. Elas não adivinham ID de banco:
escrever no banco errado espalha conteúdo pela base de outra pessoa, e desfazer
isso é pior que o trabalho de preencher aqui.
