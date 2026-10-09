# Receitas

O que ainda não entrou na fundação. Não vem no esqueleto: entra no projeto no dia
em que uma tela pedir, e passa a ser dele.

⚠️ **Ler um projeto para fazer outro não é cruzar projetos**, mas copiar de outro
projeto seu por iniciativa própria é: a regra de `projetos-pessoais/` pede que o
dono mande. Se um projeto seu já resolveu uma destas, diga de qual copiar.

| Precisa de | Como |
|---|---|
| **Componente do shadcn além dos dez** (diálogo, tabela, aviso flutuante, barra lateral) | `npm --prefix <projeto> exec -- shadcn add --yes --cwd <projeto> dialog table sonner sidebar`. O tema da marca já cobre os papéis que eles pedem. O `auditar-ui` confere os dez da fundação e não olha os novos; se um deles virar padrão em dois projetos, ele entra na lista numa versão nova da fundação |
| **Formulário com validação** | `react-hook-form` com `zod` 4 e o `field` que já veio; a mensagem de erro vai no `FieldError`, e o texto mora em `conteudo/` |
| **Esqueleto de carregamento** | `loading.tsx` DENTRO da pasta da rota que busca dado, nunca na raiz (na raiz ele esconde a página estática inteira) |
| **CSP com nonce** | o nonce nasce no `src/proxy.ts`, vai na requisição e na resposta, e os cabeçalhos estáticos continuam no `next.config.ts` |
| **Cor por função** (cada área do produto com um acento) | um mapa de papel para classe num lugar só, e o conferidor `marca` isenta só esse arquivo |
| **Login** | a renovação já está no `src/lib/banco/sessao.ts`; o fluxo (entrar, sair, prazo da sessão, porta de entrada) é do projeto |
| **Cena de landing animada** | Motion ou GSAP por rota, dentro da seção, pela skill `/motion`; a entrada de bloco continua no `Revela`. Todo elemento que a biblioteca esconder leva `data-revela`, ou some para quem está sem JavaScript |
| **Tema de marca própria** | ligar cada papel do shadcn a uma cor da paleta, no claro e no escuro; com a marca do projeto (o padrão), os três arquivos em `src/styles/` são seus |
| **Deriva do registry em projeto grande** | um auditor que compara cada componente com o do registry, tolerando o apelido do `cn` |
| **"Entrar ao rolar" em site Astro** | o mesmo motor do `Revela`, em script puro |

## Trilha página (Astro), à mão

A trilha página instala a marca e o portão, sem semente. No layout base do
site, com a marca do projeto (o padrão):

```astro
---
import '../styles/fontes.css'
import '../styles/tokens.css'
---
```

Com `--marca casa`, os dois moram em `fundacao/`, e as woff2 da marca vão em
`public/fontes/` (o instalador copia). O `marca.mjs` nasce
com o piso de hex medido, porque o modelo do Astro traz hex.
