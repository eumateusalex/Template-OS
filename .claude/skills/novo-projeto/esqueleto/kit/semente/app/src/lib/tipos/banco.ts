// fundação: semente v1 · é seu
// Os tipos do banco, GERADOS: `npm run tipos:banco` reescreve este arquivo a
// partir do projeto no Supabase. Até o banco existir, o esqueleto vazio abaixo
// deixa o TypeScript compilar. Não se edita à mão.

export type Json = string | number | boolean | null | { [chave: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
