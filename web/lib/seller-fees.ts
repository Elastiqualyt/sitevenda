/**
 * Política de taxas (Portugal / EUR).
 * - O vendedor recebe o valor declarado no anúncio (e portes definidos), sem débito no saldo pela publicação.
 * - A taxa de serviço da plataforma é cobrada ao comprador no checkout: 6% + 0,50 € por linha.
 */
export const SELLER_LISTING_FEE_EUR = 0;
/** Período de referência usado na BD para janelas administrativas (sem cobrança ao vendedor). */
export const SELLER_LISTING_VALIDITY_MONTHS = 4;
export const BUYER_TRANSACTION_FEE_PERCENT = 6;
export const BUYER_TRANSACTION_FEE_FIXED_EUR = 0.5;

/**
 * Total cobrado ao comprador sobre uma base (preço/linha):
 * taxa = (base × 6%) + 0,50 €.
 */
export function buyerTransactionFee(amountBaseEur: number): number {
  const base = Math.round(Number(amountBaseEur) * 100) / 100;
  const feePercent = (base * BUYER_TRANSACTION_FEE_PERCENT) / 100;
  return Math.round((feePercent + BUYER_TRANSACTION_FEE_FIXED_EUR) * 100) / 100;
}

/**
 * Valor final que o comprador vê/paga para uma base.
 */
export function buyerTotalFromBase(amountBaseEur: number): { base: number; fee: number; total: number } {
  const base = Math.round(Number(amountBaseEur) * 100) / 100;
  const fee = buyerTransactionFee(base);
  const total = Math.round((base + fee) * 100) / 100;
  return { base, fee, total };
}

export function formatEurPt(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
