import type { ProductType } from '@/lib/types';

/** Produtos enviáveis: portes aplicam-se; digitais nunca têm portes na plataforma. */
export function productTypeHasShipping(type: string): boolean {
  return type === 'physical' || type === 'reutilizados';
}

/**
 * Valor de portes a cobrar no checkout (EUR).
 * - Digitais: 0
 * - Físico / reutilizados: `null` ou `undefined` = vendedor não ativou portes na plataforma (0 €); número ≥ 0 = somado à linha (0 = grátis)
 */
export function checkoutShippingFeeEur(
  productType: string,
  shipping_fee_eur: number | null | undefined
): number {
  if (!productTypeHasShipping(productType)) return 0;
  if (shipping_fee_eur == null) return 0;
  const n = Number(shipping_fee_eur);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

export function roundMoney2(n: number): number {
  return Math.round(Number(n) * 100) / 100;
}
