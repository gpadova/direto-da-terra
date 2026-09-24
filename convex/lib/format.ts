/**
 * Formata um valor em reais no padrão pt-BR (ex.: 1234.5 -> "R$ 1.234,50").
 * Implementação manual para não depender do suporte a Intl no runtime do Convex.
 */
export function formatBRL(value: number): string {
  const negative = value < 0;
  const [int, dec] = Math.abs(value).toFixed(2).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negative ? "-" : ""}R$ ${grouped},${dec}`;
}
