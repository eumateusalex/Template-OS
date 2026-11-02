# Modo princípios · consultar o acervo

Responde "o que se sabe sobre X", "como fazer Y" e "isso é regra da
plataforma?" pelo acervo de princípios (`acervo/`). Não decide sobre uma conta:
para isso, os outros modos.

## Os passos

1. **Achar o tema** no índice (`acervo/README.md`) e buscar os termos nos
   arquivos:
   ```bash
   grep -rn -i '<termo>' .claude/skills/instagram/acervo/
   ```
   Tente sinônimos (capa e gancho; salvamento e salvar; mensagem e direct) antes
   de concluir que o acervo não fala do assunto.
2. **Ler o princípio inteiro** (a regra, o porquê, o como aplicar e a força),
   não só a linha que o `grep` achou.
3. **Responder com a força junto**:
   - **várias fontes**: diga como regra de trabalho;
   - **uma fonte**: diga como hipótese para testar na conta;
   - **os dois lados**: dê as duas posições e o critério de escolha do próprio
     princípio, e diga qual se aplica ao caso, se houver caso;
   - **plataforma, a conferir**: confira na fonte oficial (a central de ajuda do
     Instagram, o blog oficial para criadores, a documentação da Graph API da
     Meta) antes de afirmar, e diga se conferiu. Sem conseguir conferir, diga
     "não conferi" e trate como hipótese.
4. **A memória manda.** Se o princípio bate com uma regra da `_memoria/`, a
   resposta diz a regra da memória e que ela vence.
5. **O acervo não fala do assunto**: diga isso numa linha. Pesquisa nova vai
   pela fonte primária e pela regra de pesquisa da pessoa, e o que vier é
   leitura minha, dita como minha, até ela decidir registrar.

## A forma da resposta

```
<a resposta em uma ou duas frases>

- <regra> · <arquivo>, <número> · força: <a força>
- <regra> · <arquivo>, <número> · força: <a força>

Conferido na fonte oficial: <sim, onde | não conferi | não se aplica>
```

O acervo é método interno: nada daqui vai para peça pública como citação.
