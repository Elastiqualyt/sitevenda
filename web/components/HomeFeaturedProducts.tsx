'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCategoryLabel } from '@/lib/categories';
import { buyerTotalFromBase } from '@/lib/seller-fees';

interface HomeProduct {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  category: string;
}

export default function HomeFeaturedProducts() {
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        const list = Array.isArray(data) ? (data as HomeProduct[]) : [];
        setProducts(list.slice(0, 4));
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="home-featured">
      <div className="home-featured__head">
        <Link href="/produtos" className="home-featured__see-all">
          Ver todos
        </Link>
      </div>

      {loading ? (
        <p className="loading">A carregar destaques...</p>
      ) : products.length === 0 ? (
        <p className="empty">Ainda não há produtos em destaque.</p>
      ) : (
        <div className="product-grid home-featured__grid">
          {products.map((p) => (
            <Link key={p.id} href={`/produtos/${p.id}`} className="product-card">
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
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
