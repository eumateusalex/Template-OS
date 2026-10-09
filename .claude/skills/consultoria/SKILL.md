---
name: consultoria
description: Conduz a consultoria de um cliente (diagnóstico, plano, implantação, acompanhamento e saída) pelo método das sete fases, com a marcação de cada afirmação, a fórmula de prioridade, o papel mínimo de acesso e os modelos de arquivo. Use para abrir, tocar ou encerrar a consultoria de um cliente em `clientes/`, ou quando o /novo-cliente criar a pasta com diagnóstico. Prospecção é o agente estrategista.
---

# Consultoria

O método para vender e entregar um diagnóstico com implantação a um cliente: o
que se faz em cada fase, o que se pede, como cada afirmação prova de onde veio,
como se escolhe o que fazer primeiro, e como se sai sem deixar acesso nem dado
para trás. Os arquivos do cliente nascem dos modelos daqui, e o método fica
aqui, fora do Git do cliente: o cliente recebe o trabalho, não o método.

**Quando usar:** o cliente contratou diagnóstico ou consultoria e já tem pasta
em `clientes/<nome>/` (quem cria a pasta é o `/novo-cliente`). Antes do
contrato, quem trabalha é o agente `estrategista` (prospecção, nota e
abordagem). Uma tarefa avulsa para um cliente (um site, um post) não precisa
desta skill.

**Antes de começar**, leia o `CLAUDE.md` e o briefing do cliente (lá dentro
manda o dele), e da memória da raiz o `_memoria/empresa.md` (a oferta e a
jornada comercial), o `_memoria/estrategia.md` (a fase e a frente em foco) e o
`_memoria/prova.md` (o que se pode afirmar).

## O que é escolha sua

O método (as fases, os portões, a marcação, a fórmula, o papel mínimo, a
saída) vale para qualquer oferta. **A oferta é sua**, e o que segue se lê da
memória, nunca se inventa nem se copia de exemplo:

| Escolha | Onde mora | Sem ela na memória |
|---|---|---|
| o nome da oferta, o preço, o prazo, a garantia e o bônus | `_memoria/empresa.md`, seção "Ofertas" | proposta e devolutiva saem com `[a definir]` nesses campos, e você decide antes de enviar |
| os níveis do diagnóstico e o teto de horas de cada um | `_memoria/empresa.md`, "Ofertas" | os nomes **Essencial** e **Completo** e os tetos de `referencias/modulos-e-gatilhos.md`, ditos como ponto de partida |
| as perguntas antes da call e o que qualifica um prospect | `_memoria/empresa.md`, "Jornada comercial" | as três padrão do `estrategista` (seção "Depois do sim") |
| a vertical que você atende | `_memoria/empresa.md`, "A vertical, se existir", e o foco em `_memoria/estrategia.md` | qualquer ramo, calibrado pelo `estrategista` antes do primeiro prospect |
| o relógio do material (5 dias úteis), o roteiro (90 dias) e a guarda dos dados depois do fim (90 dias) | o seu contrato e o `termo-de-acesso.md` preenchido | os valores dos modelos, que você ajusta antes do primeiro cliente |
| o que você vende como serviço (trilho B) e o produto que você implanta (trilho C) | `_memoria/empresa.md`, "As frentes" | os trilhos B e C ficam vazios, e o plano usa A, D e E |

Os exemplos dos modelos e das referências (uma clínica, um atendente de
WhatsApp com IA) são neutros e só ensinam a forma: troque pelo seu caso.

## O mapa

| Arquivo | O que tem |
|---|---|
| `referencias/modulos-e-gatilhos.md` | as sete fases (F0 a F6) com o portão de cada uma, o Essencial (E1 a E7) e os módulos do Completo, que só entram com gatilho |
| `referencias/marcacao.md` | as seis marcas de origem (`PÚBLICO·MEDIDO`, `CLIENTE·DECLARADO`, `HIPÓTESE`…) e a sintaxe de cada achado |
| `referencias/priorizacao.md` | os eliminatórios, a fórmula (I × C × V) ÷ E e os cinco trilhos |
| `referencias/papel-minimo.md` | o papel que se pede em cada ferramenta, e o que ele não deixa fazer |
| `referencias/saida.md` | a lista da F6: acessos revogados, dados apagados, caso pedido |
| `modelos/` | os treze modelos de arquivo do cliente |

## As fases e o que cada uma preenche

| Fase | Preenche | Usa |
|---|---|---|
| F0 · Qualificar | (nada no cliente: é o dossiê do `estrategista`) | a nota e o achado grátis |
| F1 · Contratar e abrir | `ESTADO.md`, `ACESSOS.md`; nascem `termo-de-acesso.md` e `checklist-de-materiais.md` | `papel-minimo.md` |
| F2 · Imersão | `ENTREVISTA.md`, `INVENTARIO.md`, `HORAS.md` | `modelos/roteiro-de-entrevista.md`, a `/converter` |
| F3 · Diagnóstico e plano | `DIAGNOSTICO.md`, `PLANO.md`, `KPIS.md`, `DECISOES.md` | `marcacao.md`, `priorizacao.md` |
| F4 · Implementar | uma ficha por item da onda em `oportunidades/` (de `oportunidade.md`) | os trilhos |
| F5 · Acompanhar | `relatorios/`, `reunioes/`, a série do `KPIS.md` | a linha de base |
| F6 · Encerrar ou renovar | `ACESSOS.md` com "revogado em", `ESTADO.md`, `DECISOES.md` | `saida.md` |

Três réguas valem em todas: **número de resultado só sai medido** (estimativa
se diz estimativa); **o declarado que contradiz o medido vira achado
próprio**; **estourou o teto de horas, para e registra** (o estouro é dado).

## Abrir a pasta

`clientes/<nome>/consultoria/` nasce assim (o `/novo-cliente` faz isto quando
o cliente contrata diagnóstico; se a pasta do cliente já existe sem ela, faça
você):

```
clientes/<nome>/consultoria/
  ESTADO.md  ACESSOS.md  DECISOES.md  ENTREVISTA.md  INVENTARIO.md
  DIAGNOSTICO.md  PLANO.md  KPIS.md  HORAS.md
  modulos/README.md
  oportunidades/README.md
  relatorios/README.md
  reunioes/README.md
  material/prospeccao/README.md
```

1. Os nove arquivos são cópias dos modelos de mesmo nome em `modelos/`, com o
   nome do cliente na linha do título (`# …`); o resto dos campos `<…>` fica
   para a fase que os preenche.
2. **Os caminhos que os modelos citam e que não moram na pasta do cliente**
   ganham o prefixo da raiz do workspace: `referencias/<arquivo>` vira
   `.claude/skills/consultoria/referencias/<arquivo>`, e
   `roteiro-de-entrevista.md` vira
   `.claude/skills/consultoria/modelos/roteiro-de-entrevista.md`. Os da
   `_memoria/` ficam como estão, e caminho sem pasta (`PLANO.md`, `modulos/`) é
   da própria `consultoria/`.
3. Cada README de subpasta leva uma linha só:

   | Pasta | Linha do README |
   |---|---|
   | `modulos/` | Um anexo por módulo do diagnóstico. |
   | `oportunidades/` | Uma ficha por oportunidade do plano. |
   | `relatorios/` | Os relatórios do ciclo, contra a linha de base. |
   | `reunioes/` | A ata de cada reunião, com as decisões. |
   | `material/prospeccao/` | O útil do dossiê do prospect, copiado na abertura. |

4. Se houve dossiê do `estrategista` em `saidas/prospeccao-<nome>-<data>/`, o
   útil dele (achados, medição, nota) vai para `material/prospeccao/`, sem os
   prints que mostram outro negócio.

`consultoria/` versiona no Git do cliente; o material cru (gravação, exportação,
conversa) fica em `dados/`, que não versiona.

**Os outros três modelos nascem na fase que os usa**, com a mesma troca de nome
e de caminho: `checklist-de-materiais.md` e `termo-de-acesso.md` na F1, e
`oportunidade.md` na F4, um por item, como `oportunidades/NN-<nome>.md`.

## Dado de terceiros

O cliente entrega dado dos clientes dele (conversa, lista, exportação). Três
regras não se negociam: **nunca a senha de ninguém**, cada acesso no papel
mínimo e anotado; **dado pessoal chega anonimizado, antes de ir a qualquer
IA**, e o arquivo cru não se abre na sessão; **dado sensível e de criança não
se pede**.

O template não traz ferramenta de anonimizar. O caminho é um destes dois, e
nenhum passa o arquivo cru pela sessão:

1. **O cliente entrega a amostra já anonimizada** (o pedido vai no
   `checklist-de-materiais.md`). É o padrão: o dado nem sai da mão dele.
2. **Você anonimiza à mão, fora do Claude**, antes de pôr o arquivo em
   `dados/`: abre a exportação num editor de texto ou numa planilha do seu
   computador, apaga as colunas de contato que a análise não usa, troca cada
   nome por um marcador (`CLIENTE_1`, `ATENDENTE`) com o localizar e
   substituir, e troca telefone, e-mail e documento por `TELEFONE`, `EMAIL`,
   `DOC` (no editor com busca por expressão regular, `\+?\d[\d ().-]{7,}\d`
   acha telefone e `\S+@\S+` acha e-mail). Salva como arquivo novo, confere
   no olho as primeiras linhas, e só ele entra em `dados/`; o cru fica fora do
   workspace.

A data em que o arquivo chegou anonimizado vai na coluna "Anonimizado em" do
`INVENTARIO.md`. ⚠️ O `termo-de-acesso.md` e o `papel-minimo.md` são
modelos, não parecer jurídico: passe o termo por um advogado antes do primeiro
cliente real.

## A marca

Proposta, devolutiva e relatório do diagnóstico são seus, como consultor, e
levam a sua marca (a do `identidade/design-guide.md`). O que se entrega ao
cliente como produto dele (peça, site, conteúdo) leva a marca do cliente.
