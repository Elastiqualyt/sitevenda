'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import {
  getGuestCart,
  getGuestFavoriteIds,
  setGuestCart,
  setGuestFavoriteIds,
} from '@/lib/guest-marketplace-storage';
import { mergeGuestMarketplaceToUser } from '@/lib/merge-guest-marketplace';

type MarketplaceListsContextValue = {
  ready: boolean;
  favoritesCount: number;
  /** Soma das quantidades no carrinho (para o badge). */
  cartQtyTotal: number;
  favoriteIds: Set<string>;
  /** Ordem de apresentação (mais recente primeiro na conta; visitantes: ordem de clique). */
  favoriteOrder: string[];
  cartByProductId: Map<string, number>;
  refresh: () => Promise<void>;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => Promise<{ ok: boolean; error?: string }>;
  addToCart: (productId: string, quantity?: number) => Promise<{ ok: boolean; error?: string }>;
  setCartQuantity: (productId: string, quantity: number) => Promise<{ ok: boolean; error?: string }>;
  removeFromCart: (productId: string) => Promise<void>;
};

const MarketplaceListsContext = createContext<MarketplaceListsContextValue | null>(null);

export function MarketplaceListsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteOrder, setFavoriteOrder] = useState<string[]>([]);
  const [cartByProductId, setCartByProductId] = useState<Map<string, number>>(new Map());

  const refresh = useCallback(async () => {
    if (!user?.id) {
      const favs = getGuestFavoriteIds();
      setFavoriteIds(new Set(favs));
      setFavoriteOrder(favs);
      const cart = getGuestCart();
      setCartByProductId(new Map(Object.entries(cart)));
      setReady(true);
      return;
    }

    /** Visitante → conta: copia localStorage para Supabase antes de ler o servidor. */
    await mergeGuestMarketplaceToUser(user.id);

    const [favRes, cartRes] = await Promise.all([
      supabase
        .from('product_favorites')
        .select('product_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('cart_items').select('product_id, quantity').eq('user_id', user.id),
    ]);

    if (favRes.error) {
      console.error(favRes.error);
      setFavoriteIds(new Set());
      setFavoriteOrder([]);
    } else {
      const order = (favRes.data ?? []).map((r) => r.product_id as string);
      setFavoriteOrder(order);
      setFavoriteIds(new Set(order));
    }

    if (cartRes.error) {
      console.error(cartRes.error);
      setCartByProductId(new Map());
    } else {
      const m = new Map<string, number>();
      for (const row of cartRes.data ?? []) {
        m.set(row.product_id as string, Number(row.quantity) || 1);
      }
      setCartByProductId(m);
    }
    setReady(true);
  }, [user?.id]);

  useEffect(() => {
    setReady(false);
    void refresh();
  }, [refresh]);

  const favoritesCount = favoriteIds.size;
  const cartQtyTotal = useMemo(() => {
    let t = 0;
    cartByProductId.forEach((q) => {
      t += q;
    });
    return t;
  }, [cartByProductId]);

  const isFavorite = useCallback(
    (productId: string) => favoriteIds.has(productId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (productId: string): Promise<{ ok: boolean; error?: string }> => {
      if (!productId) return { ok: false, error: 'Produto inválido.' };
      if (!user?.id) {
        const ids = getGuestFavoriteIds();
        const has = ids.includes(productId);
        const next = has ? ids.filter((id) => id !== productId) : [...ids, productId];
        setGuestFavoriteIds(next);
        setFavoriteIds(new Set(next));
        setFavoriteOrder(next);
        return { ok: true };
      }

      if (favoriteIds.has(productId)) {
        const { error } = await supabase
          .from('product_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        if (error) return { ok: false, error: error.message };
      } else {
        const { error } = await supabase.from('product_favorites').insert({
          user_id: user.id,
          product_id: productId,
        });
        if (error) return { ok: false, error: error.message };
      }
      await refresh();
      return { ok: true };
    },
    [user?.id, favoriteIds, refresh]
  );

  const addToCart = useCallback(
    async (productId: string, quantity = 1): Promise<{ ok: boolean; error?: string }> => {
      if (!productId) return { ok: false, error: 'Produto inválido.' };
      const add = Math.min(99, Math.max(1, Math.floor(quantity)));
      if (!user?.id) {
        const cart = getGuestCart();
        const prev = cart[productId] ?? 0;
        const nextQty = Math.min(99, prev + add);
        const next = { ...cart, [productId]: nextQty };
        setGuestCart(next);
        setCartByProductId(new Map(Object.entries(next)));
        return { ok: true };
      }

      const { data: row } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();
      const current = Number(row?.quantity) || 0;
      const nextQty = Math.min(99, current + add);
      const { error } = await supabase.from('cart_items').upsert(
        {
          user_id: user.id,
          product_id: productId,
          quantity: nextQty,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,product_id' }
      );
      if (error) return { ok: false, error: error.message };
      await refresh();
      return { ok: true };
    },
    [user?.id, refresh]
  );

  const setCartQuantity = useCallback(
    async (productId: string, quantity: number): Promise<{ ok: boolean; error?: string }> => {
      const q = Math.min(99, Math.max(0, Math.floor(quantity)));
      if (!user?.id) {
        const cart = { ...getGuestCart() };
        if (q < 1) delete cart[productId];
        else cart[productId] = q;
        setGuestCart(cart);
        setCartByProductId(new Map(Object.entries(cart)));
        return { ok: true };
      }
      if (q < 1) {
        await supabase.from('cart_items').delete().eq('user_id', user.id).eq('product_id', productId);
      } else {
        const { error } = await supabase.from('cart_items').upsert(
          {
            user_id: user.id,
            product_id: productId,
            quantity: q,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,product_id' }
        );
        if (error) return { ok: false, error: error.message };
      }
      await refresh();
      return { ok: true };
    },
    [user?.id, refresh]
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      await setCartQuantity(productId, 0);
    },
    [setCartQuantity]
  );

  const value = useMemo(
    () => ({
      ready,
      favoritesCount,
      cartQtyTotal,
      favoriteIds,
      favoriteOrder,
      cartByProductId,
      refresh,
      isFavorite,
      toggleFavorite,
      addToCart,
      setCartQuantity,
      removeFromCart,
    }),
    [
      ready,
      favoritesCount,
      cartQtyTotal,
      favoriteIds,
      favoriteOrder,
      cartByProductId,
      refresh,
      isFavorite,
      toggleFavorite,
      addToCart,
      setCartQuantity,
      removeFromCart,
    ]
  );

  return (
    <MarketplaceListsContext.Provider value={value}>{children}</MarketplaceListsContext.Provider>
  );
}

export function useMarketplaceLists(): MarketplaceListsContextValue {
  const ctx = useContext(MarketplaceListsContext);
  if (!ctx) {
    throw new Error('useMarketplaceLists must be used within MarketplaceListsProvider');
  }
  return ctx;
}
