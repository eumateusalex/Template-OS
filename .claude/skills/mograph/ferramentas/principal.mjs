// A guarda "este arquivo foi chamado direto, não importado". Quando a skill é aberta por junção
// (uma pasta de skills ligada a esta), o argv[1] chega pelo caminho da junção enquanto o
// import.meta.url é o caminho real: comparar os dois crus dava falso, e a ferramenta saía
// com 0 sem rodar. Os dois passam pelo realpath.
import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function chamadoDireto(metaUrl) {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(metaUrl));
  } catch {
    // o caminho do argv[1] não existe (node -e, REPL): não é chamada direta deste arquivo
    return false;
  }
}
