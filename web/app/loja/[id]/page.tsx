'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { StarRating } from '@/components/StarRating';
import type { SellerPublic } from '@/components/SellerBlock';
import { supabase } from '@/lib/supabase';
import {
  CATEGORY_ENTRETERIMENTO,
  CATEGORY_PRODUTO_DIGITAL,
  formatDigitalSubcategoriesList,
  formatEntertainmentSubcategoriesList,
  getCategoryLabel,
} from '@/lib/categories';

interface ProductRow {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  category: string;
  digital_subcategories?: string[] | null;
  entertainment_subcategories?: string[] | null;
  review_avg?: number | null;
  review_count?: number | null;
}

export default function LojaPublicPage() {
  const params = useParams();
  const sellerId = params?.id as string;
  const [seller, setSeller] = useState<SellerPublic | null>(null);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!sellerId) return;
    (async () => {
      setLoading(true);
      setNotFound(false);
      setSeller(null);
      const [pubRes, statsRes, prodRes] = await Promise.all([
        supabase.rpc('get_seller_public', { p_id: sellerId }),
        supabase.rpc('get_seller_rating_stats', { p_seller_id: sellerId }),
        supabase.from('products').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false }),
      ]);
      const pub = pubRes.data as SellerPublic | null;
      if (pubRes.error || pub == null) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setSeller(pub);
      const stats = statsRes.data as { avg_rating?: number; review_count?: number } | null;
      if (stats) {
        setAvgRating(Number(stats.avg_rating) || 0);
        setReviewCount(Number(stats.review_count) || 0);
      }
      setProducts((prodRes.data as ProductRow[]) ?? []);
      setLoading(false);
    })();
  }, [sellerId]);

  if (loading) {
    return (
      <div className="page">
        <Header />
        <main className="main">
          <p className="loading">A carregar loja...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound || !seller) {
    return (
      <div className="page">
        <Header />
        <main className="main">
          <p>Loja não encontrada.</p>
          <Link href="/produtos">← Ver produtos</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const name = seller.full_name?.trim() || 'Vendedor';
  const hasStats = reviewCount > 0;

  return (
    <div className="page">
      <Header />
      <main className="main loja-page">
        <Link href="/produtos">← Voltar aos produtos</Link>
        <header className="loja-header">
          <div className="loja-header__avatar" aria-hidden>
            {seller.avatar_url ? (
              <img src={seller.avatar_url} alt="" />
            ) : (
              <span className="loja-header__avatar-placeholder">{name.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h1 className="loja-header__title">{name}</h1>
            {hasStats ? (
              <p className="loja-header__rating">
                <StarRating value={avgRating} />
                <span>
                  {avgRating.toFixed(1).replace(/\.0$/, '')} · {reviewCount}{' '}
                  {reviewCount === 1 ? 'avaliação' : 'avaliações'} (todos os anúncios)
                </span>
              </p>
            ) : (
              <p className="loja-header__muted">Ainda sem avaliações globais</p>
            )}
          </div>
        </header>

        {products.length === 0 ? (
          <p className="empty">Este vendedor ainda não tem anúncios públicos.</p>
        ) : (
          <div className="product-grid">
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
                {(p.review_count ?? 0) > 0 && p.review_avg != null ? (
                  <p className="product-card__stars" aria-label={`Média ${p.review_avg} estrelas`}>
                    <StarRating value={Number(p.review_avg)} size="sm" />
                    <span className="product-card__stars-count">
                      ({p.review_count})
                    </span>
                  </p>
                ) : null}
                <p className="product-price">{Number(p.price).toFixed(2)} €</p>
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
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
