# A marcação de cada afirmação

Todo achado do Diagnóstico leva uma marcação, e a marcação diz de onde ele vem:
o que é informação pública, o que é dado fornecido pelo cliente, o que é
hipótese e o que é recomendação.

## As seis marcas

| Marca | Quando | O que ela exige |
|---|---|---|
| `PÚBLICO·MEDIDO` | medido por instrumento sem login (Playwright, `scripts/biblioteca-anuncios.mjs`, `curl`) | o arquivo em `material/`, a data, e duas rodadas batendo (a régua do `estrategista`) |
| `PÚBLICO·LIDO` | texto citado de fonte aberta | o endereço e a data |
| `CLIENTE·DECLARADO` | dito pelo cliente | o minuto da entrevista (`ENTREVISTA.md`) ou a mensagem com data |
| `CLIENTE·MEDIDO` | exportação ou painel com acesso autorizado | o arquivo em `dados/` (não versiona) e a linha do `ACESSOS.md` que autorizou |
| `HIPÓTESE` | inferência que ninguém verificou | a linha "o que confirmaria"; com número, vira `HIPÓTESE·ESTIMATIVA`, com a conta à mostra |
| `RECOMENDAÇÃO` | a sua opinião, como consultor | os IDs dos achados que a sustentam |

## A sintaxe, no arquivo interno

```
[A07 · CLIENTE·MEDIDO · dados/ga4-2026-10.csv · 2026-10-03]
```

O ID (`A07`) é do achado, e é por ele que a recomendação e a prioridade citam.

## As regras

- **O declarado que contradiz o medido vira achado próprio.** O dono acha que
  responde em uma hora, e a medição mostra nove: é o ponto cego mais forte.
- **Número de resultado só sai MEDIDO** (`_memoria/prova.md`). Estimativa se
  diz estimativa.
- **No que vai ao cliente**, a marca vira legenda: "o que você me contou", "o
  que eu medi", "a confirmar". É o arco da devolutiva.
- **Hipótese só entra no documento do cliente na seção "a confirmar"**, com o
  que a confirmaria.
