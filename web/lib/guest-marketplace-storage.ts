/** Armazenamento local de favoritos/carrinho para visitantes (sem sessão). */

const FAV_KEY = 'marketplace_favorites_v1';
const CART_KEY = 'marketplace_cart_v1';

export function getGuestFavoriteIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

export function setGuestFavoriteIds(ids: string[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FAV_KEY, JSON.stringify([...new Set(ids)]));
}

export function getGuestCart(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed)) {
      const n = typeof v === 'number' ? v : parseInt(String(v), 10);
      if (!Number.isFinite(n) || n < 1) continue;
      out[k] = Math.min(99, Math.floor(n));
    }
    return out;
  } catch {
    return {};
  }
}

export function setGuestCart(cart: Record<string, number>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/** Remove favoritos e carrinho locais (após sincronizar com a conta). */
export function clearGuestMarketplaceData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(FAV_KEY);
  localStorage.removeItem(CART_KEY);
}

export function hasGuestMarketplaceData(): boolean {
  return getGuestFavoriteIds().length > 0 || Object.keys(getGuestCart()).length > 0;
}
