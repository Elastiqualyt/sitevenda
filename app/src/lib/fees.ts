export const BUYER_TRANSACTION_FEE_PERCENT = 6;
export const BUYER_TRANSACTION_FEE_FIXED_EUR = 0.5;

export function buyerPriceFromSellerPrice(sellerPriceEur: number): number {
  const base = Math.round(Number(sellerPriceEur) * 100) / 100;
  const fee = Math.round(
    (base * (BUYER_TRANSACTION_FEE_PERCENT / 100) + BUYER_TRANSACTION_FEE_FIXED_EUR) * 100
  ) / 100;
  return Math.round((base + fee) * 100) / 100;
}

