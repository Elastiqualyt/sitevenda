import { supabase } from '@/lib/supabase';
import {
  clearGuestMarketplaceData,
  getGuestCart,
  getGuestFavoriteIds,
} from '@/lib/guest-marketplace-storage';

/**
 * Copia favoritos e carrinho do visitante (localStorage) para a conta Supabase.
 * Só deve ser chamado quando existe sessão; ignora duplicados e produtos apagados.
 */
export async function mergeGuestMarketplaceToUser(userId: string): Promise<{ merged: boolean }> {
  const guestFavs = getGuestFavoriteIds();
  const guestCart = getGuestCart();
  const hasFavs = guestFavs.length > 0;
  const hasCart = Object.keys(guestCart).length > 0;
  if (!hasFavs && !hasCart) {
    return { merged: false };
  }

  try {
    for (const product_id of guestFavs) {
      const { error } = await supabase.from('product_favorites').insert({
        user_id: userId,
        product_id,
      });
      if (error) {
        // 23505 = já existe; FK = produto já não existe
        if (error.code !== '23505') {
          console.warn('[merge guest] favorito ignorado', product_id, error.message);
        }
      }
    }

    for (const [product_id, qtyRaw] of Object.entries(guestCart)) {
      const q = Math.min(99, Math.max(1, Math.floor(Number(qtyRaw))));
      const { data: row } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', userId)
        .eq('product_id', product_id)
        .maybeSingle();
      const current = Number(row?.quantity) || 0;
      const nextQty = Math.min(99, current + q);
      const { error } = await supabase.from('cart_items').upsert(
        {
          user_id: userId,
          product_id,
          quantity: nextQty,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,product_id' }
      );
      if (error) {
        console.warn('[merge guest] linha carrinho ignorada', product_id, error.message);
      }
    }

    clearGuestMarketplaceData();
    return { merged: true };
  } catch (e) {
    console.error('[merge guest]', e);
    return { merged: false };
  }
}
