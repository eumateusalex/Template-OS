// fundação: semente v1 · é seu
// O jeito brasileiro de mostrar dinheiro, telefone e data. As armadilhas
// abaixo se repetiram em quatro projetos da casa, e por isso moram aqui.

/**
 * Reais, a partir de CENTAVOS inteiros, com o espaço que o `Intl` põe entre o
 * símbolo e o número.
 *
 * 🚨 Dinheiro mora em centavos inteiros, nunca em ponto flutuante: 0,1 + 0,2
 * não dá 0,3 (decisões de engenharia da fábrica). A função só formata.
 * ⚠️ Esse espaço é o U+00A0 (não quebra), não um espaço comum: teste que
 * compara com "R$ 10,00" digitado à mão falha sem motivo aparente.
 * ⚠️ `casas` é parâmetro: preço de vitrine costuma ir sem centavos (0), extrato
 * vai com (2). O arredondamento é o do `Intl`: meio centavo sobe.
 */
export function emReais(centavos: number, casas: 0 | 2 = 2): string {
  if (!Number.isInteger(centavos))
    throw new RangeError(`dinheiro em centavos inteiros, e veio: ${centavos}`)
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(centavos / 100)
}

/**
 * Telefone brasileiro para a tela: "(11) 98765-4321" ou "(11) 3456-7890".
 * Aceita com ou sem o 55 na frente e com qualquer pontuação. Devolve `null`
 * para o que não é telefone, em vez de mostrar lixo formatado.
 */
export function telefone(entrada: string): string | null {
  let digitos = entrada.replace(/\D/g, "")
  if (digitos.length > 11 && digitos.startsWith("55"))
    digitos = digitos.slice(2)
  const partes = /^(\d{2})(\d{4,5})(\d{4})$/.exec(digitos)
  if (!partes) return null
  return `(${partes[1]}) ${partes[2]}-${partes[3]}`
}

/**
 * A data no fuso de Brasília, "dd/mm/aaaa".
 *
 * 🚨 O fuso é explícito. O servidor roda em UTC, e às 21h de Brasília já é o
 * dia seguinte lá: sem o `timeZone`, a data da tela pula um dia à noite.
 */
export function dataBrasilia(quando: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(quando)
}
