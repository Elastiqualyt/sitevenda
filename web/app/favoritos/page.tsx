'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  CATEGORY_ENTRETERIMENTO,
  CATEGORY_PRODUTO_DIGITAL,
  formatDigitalSubcategoriesList,
  formatEntertainmentSubcategoriesList,
  getCategoryLabel,
} from '@/lib/categories';
import { useMarketplaceLists } from '@/lib/marketplace-lists-context';
import { buyerTotalFromBase } from '@/lib/seller-fees';

interface Product {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  category: string;
  digital_subcategories?: string[] | null;
  entertainment_subcategories?: string[] | null;
}

export default function FavoritosPage() {
  const { ready, favoriteOrder, toggleFavorite } = useMarketplaceLists();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    const ids = favoriteOrder;
    if (!ids.length) {
      setProducts([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?ids=${encodeURIComponent(ids.join(','))}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const byId = new Map(list.map((p: Product) => [p.id, p]));
        const ordered = ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
        if (!cancelled) setProducts(ordered);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, favoriteOrder]);

  return (
    <div className="page">
      <Header />
      <main className="main">
        <h1>Favoritos</h1>
        <p className="favoritos-intro">
          Os teus artigos guardados. Podes remover um artigo da lista sem o apagar da loja.
        </p>

        {!ready || loading ? (
          <p className="loading">A carregar...</p>
        ) : products.length === 0 ? (
          <p className="empty">
            Ainda não tens favoritos.{' '}
            <Link href="/produtos">Explorar produtos</Link>
          </p>
        ) : (
          <div className="product-grid favoritos-grid">
            {products.map((p) => (
              <article key={p.id} className="product-card product-card--favorito">
                <Link href={`/produtos/${p.id}`} className="product-card__body">
                  <div className="product-image">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.title} />
                    ) : (
                      <span className="product-placeholder">📦</span>
                    )}
                  </div>
                  <h3>{p.title}</h3>
                  <p className="product-price">{buyerTotalFromBase(Number(p.price)).total.toFixed(2)} €</p>
                  <span className="product-type">{getCategoryLabel(p.category) || p.category || '—'}</span>
                  {p.category === CATEGORY_PRODUTO_DIGITAL && p.digital_subcategories?.length ? (
                    <span className="product-type product-type--digital-sub">
                      {formatDigitalSubcategoriesList(p.digital_subcategories)}
                    </span>
                  ) : null}
                  {p.category === CATEGORY_ENTRETERIMENTO && p.entertainment_subcategories?.length ? (
                    <span className="product-type product-type--digital-sub">
                      {formatEntertainmentSubcategoriesList(p.entertainment_subcategories)}
                    </span>
                  ) : null}
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary product-card__remove-fav"
                  disabled={removing === p.id}
                  onClick={async () => {
                    setRemoving(p.id);
                    await toggleFavorite(p.id);
                    setRemoving(null);
                  }}
                >
                  {removing === p.id ? 'A remover…' : 'Remover dos favoritos'}
                </button>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
