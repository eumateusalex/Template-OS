// fundação: semente v1 · é seu
// A base do Next (core-web-vitals + typescript) e o Prettier por último, que
// desliga as regras de estilo que brigariam com ele.
import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import prettier from "eslint-config-prettier/flat"

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    // 🚨 A versão do React se declara: a detecção automática do
    // eslint-plugin-react chama `context.getFilename`, que o ESLint 10 tirou,
    // e o lint inteiro morre com TypeError. Subiu o React no package.json,
    // sobe aqui.
    settings: { react: { version: "19.3" } },
  },
  {
    // Os componentes do registry vêm como o shadcn manda, e não se editam.
    files: ["src/components/ui/**"],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    "fabrica/**",
    "fundacao/**",
    "test-results/**",
    "playwright-report/**",
  ]),
])
