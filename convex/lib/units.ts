// Unidades de peso convertidas para kg; demais unidades contam como itens.
export const WEIGHT_UNITS_TO_KG: Record<string, number> = {
  kg: 1,
  quilo: 1,
  quilos: 1,
  quilograma: 1,
  quilogramas: 1,
  kilo: 1,
  kilos: 1,
  g: 0.001,
  grama: 0.001,
  gramas: 0.001,
};

/**
 * Fator de conversão para kg de uma unidade de produto, ou `undefined`
 * quando a unidade não é de peso (peças, porções, litros, caixas...).
 */
export function kgFactorForUnit(unit: string | undefined | null): number | undefined {
  if (!unit) return undefined;
  return WEIGHT_UNITS_TO_KG[unit.trim().toLowerCase()];
}
