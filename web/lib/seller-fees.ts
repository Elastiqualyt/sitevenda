/**
 * Política de taxas para vendedores (Portugal / EUR).
 * A comissão sobre vendas (`SELLER_TRANSACTION_FEE_PERCENT`) é aplicada no webhook Stripe ao creditar o vendedor.
 */
export const SELLER_LISTING_FEE_EUR = 0.17;
export const SELLER_LISTING_VALIDITY_MONTHS = 4;
export const SELLER_TRANSACTION_FEE_PERCENT = 6.5;

/**
 * Crédito líquido do vendedor e comissão da plataforma sobre uma linha de pedido (bruto = produto × qtd;
 * quando existir portes na mesma linha no futuro, incluir nesse bruto).
 */
export function sellerLineNetAndCommission(lineTotalGross: number): { gross: number; net: number; commission: number } {
  const gross = Math.round(Number(lineTotalGross) * 100) / 100;
  const commission = Math.round((gross * SELLER_TRANSACTION_FEE_PERCENT) / 100 * 100) / 100;
  const net = Math.round((gross - commission) * 100) / 100;
  return { gross, net, commission };
}

export function formatEurPt(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
