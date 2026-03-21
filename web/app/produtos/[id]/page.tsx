'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { useMarketplaceLists } from '@/lib/marketplace-lists-context';
import { supabase } from '@/lib/supabase';
import {
  CATEGORY_ENTRETERIMENTO,
  CATEGORY_PRODUTO_DIGITAL,
  formatProductTypeLabel,
  getCategoryLabel,
  getDigitalSubcategoryLabel,
  getEntertainmentSubcategoryLabel,
} from '@/lib/categories';
import { productDisplayImages } from '@/lib/product-gallery';
import { StarRating } from '@/components/StarRating';
import { SellerBlock, type SellerPublic } from '@/components/SellerBlock';
import { ProductReviewsSection, type ProductReviewRow } from '@/components/ProductReviews';

interface Product {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  type: string;
  image_url: string | null;
  gallery_urls?: string[] | null;
  file_url?: string | null;
  category: string;
  digital_subcategories?: string[] | null;
  entertainment_subcategories?: string[] | null;
  review_avg?: number | null;
  review_count?: number | null;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { ready: listsReady, isFavorite, toggleFavorite, addToCart } = useMarketplaceLists();
  const id = params?.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactLoading, setContactLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [favBusy, setFavBusy] = useState(false);
  const [favError, setFavError] = useState('');
  const [cartBusy, setCartBusy] = useState(false);
  const [sellerPublic, setSellerPublic] = useState<SellerPublic | null>(null);
  const [sellerStats, setSellerStats] = useState({ avg: 0, count: 0 });
  const [reviews, setReviews] = useState<ProductReviewRow[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = res.ok ? await res.json() : null;
        setProduct(data);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [id]);

  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    (async () => {
      setMetaLoading(true);
      const [sellerRes, statsRes, reviewsRes] = await Promise.all([
        supabase.rpc('get_seller_public', { p_id: product.seller_id }),
        supabase.rpc('get_seller_rating_stats', { p_seller_id: product.seller_id }),
        supabase
          .from('product_reviews')
          .select('*')
          .eq('product_id', product.id)
          .order('created_at', { ascending: false }),
      ]);
      if (cancelled) return;
      setSellerPublic((sellerRes.data as SellerPublic | null) ?? null);
      const stats = statsRes.data as { avg_rating?: number; review_count?: number } | null;
      if (stats) {
        setSellerStats({
          avg: Number(stats.avg_rating) || 0,
          count: Number(stats.review_count) || 0,
        });
      }
      setReviews((reviewsRes.data as ProductReviewRow[]) ?? []);
      if (user) {
        const { data: br } = await supabase.rpc('buyer_can_review_product', {
          p_product_id: product.id,
        });
        setCanReview(!!br);
      } else {
        setCanReview(false);
      }
      setMetaLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [product?.id, product?.seller_id, user?.id]);

  if (loading) return <div className="page"><Header /><main className="main"><p>A carregar...</p></main><Footer /></div>;
  if (!product) return <div className="page"><Header /><main className="main"><p>Produto não encontrado.</p><Link href="/produtos">Voltar</Link></main><Footer /></div>;

  const displayImages = productDisplayImages(product.gallery_urls, product.image_url);
  const safeIdx = Math.min(activeImageIndex, Math.max(0, displayImages.length - 1));
  const mainImage = displayImages[safeIdx] ?? displayImages[0];

  const subSlugList =
    product.category === CATEGORY_PRODUTO_DIGITAL
      ? product.digital_subcategories ?? []
      : product.category === CATEGORY_ENTRETERIMENTO
        ? product.entertainment_subcategories ?? []
        : [];
  const subLabels = subSlugList.map((slug) =>
    product.category === CATEGORY_PRODUTO_DIGITAL
      ? getDigitalSubcategoryLabel(slug)
      : getEntertainmentSubcategoryLabel(slug)
  );
  /** Evita "Produto Digital · Digital" — o tipo não acrescenta informação. */
  const showTypeChip =
    !(product.category === CATEGORY_PRODUTO_DIGITAL && product.type === 'digital');
  const favActive = listsReady && isFavorite(product.id);

  return (
    <div className="page">
      <Header />
      <main className="main">
        <Link href="/produtos">← Voltar aos produtos</Link>
        <div className="product-detail">
          <div className="product-detail-media">
            <div className="product-detail-image">
              {mainImage ? (
                <img src={mainImage} alt={product.title} />
              ) : (
                <span className="product-placeholder">📦</span>
              )}
            </div>
            {displayImages.length > 1 && (
              <div className="product-detail-thumbs" role="list">
                {displayImages.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    role="listitem"
                    className={`product-detail-thumb${i === safeIdx ? ' product-detail-thumb--active' : ''}`}
                    onClick={() => setActiveImageIndex(i)}
                    aria-label={`Imagem ${i + 1}`}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="product-detail-info">
            <div className="product-taxonomy" aria-label="Categoria e tipo">
              <div className="product-taxonomy__row">
                <span className="product-taxonomy__cat">{getCategoryLabel(product.category)}</span>
                {showTypeChip ? (
                  <>
                    <span className="product-taxonomy__sep" aria-hidden>
                      ·
                    </span>
                    <span className="product-taxonomy__type">{formatProductTypeLabel(product.type)}</span>
                  </>
                ) : null}
              </div>
              {subLabels.length > 0 ? (
                <ul className="product-taxonomy__subs">
                  {subSlugList.map((slug, i) => (
                    <li key={slug} className="product-taxonomy__subchip">
                      {subLabels[i]}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <h1>{product.title}</h1>
            {(product.review_count ?? 0) > 0 && product.review_avg != null ? (
              <p className="product-detail-rating">
                <StarRating value={Number(product.review_avg)} />
                <a href="#avaliacoes" className="product-detail-rating__link">
                  {Number(product.review_avg).toFixed(1).replace(/\.0$/, '')} · {product.review_count}{' '}
                  {(product.review_count ?? 0) === 1 ? 'avaliação' : 'avaliações'}
                </a>
              </p>
            ) : (
              <p className="product-detail-rating product-detail-rating--muted">Ainda sem avaliações neste anúncio</p>
            )}
            <p className="product-price">{Number(product.price).toFixed(2)} €</p>
            {metaLoading ? (
              <p className="seller-block-loading">A carregar vendedor…</p>
            ) : (
              <SellerBlock
                sellerId={product.seller_id}
                seller={sellerPublic}
                avgRating={sellerStats.avg}
                reviewCount={sellerStats.count}
              />
            )}
            {product.description?.trim() ? (
              <div className="product-description">{product.description}</div>
            ) : (
              <p className="product-description product-description--empty">Sem descrição.</p>
            )}
            <div className="product-detail-actions">
              <button
                type="button"
                className={`product-fav-toggle${favActive ? ' product-fav-toggle--on' : ''}`}
                disabled={favBusy || !listsReady}
                onClick={async () => {
                  setFavError('');
                  setFavBusy(true);
                  const r = await toggleFavorite(product.id);
                  setFavBusy(false);
                  if (!r.ok) setFavError(r.error ?? 'Não foi possível atualizar favoritos.');
                }}
                aria-pressed={favActive}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill={favActive ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  />
                </svg>
                <span>{favActive ? 'Nos teus favoritos' : 'Adicionar aos favoritos'}</span>
              </button>
              {favError ? <p className="auth-error product-detail-fav-err">{favError}</p> : null}
              <div className="product-detail-actions__buy">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={cartBusy}
                  onClick={async () => {
                    setCartBusy(true);
                    await addToCart(product.id, 1);
                    setCartBusy(false);
                  }}
                >
                  Adicionar ao carrinho
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={cartBusy}
                  onClick={async () => {
                    setCartBusy(true);
                    const r = await addToCart(product.id, 1);
                    setCartBusy(false);
                    if (r.ok) router.push('/carrinho');
                  }}
                >
                  Comprar
                </button>
              </div>
            </div>
            {user ? (
              <button
                type="button"
                className="btn btn-secondary"
                disabled={contactLoading}
                onClick={async () => {
                  if (!product || user.id === product.seller_id) return;
                  setContactLoading(true);
                  const { data } = await supabase.from('conversations').upsert(
                    { product_id: product.id, buyer_id: user.id, seller_id: product.seller_id },
                    { onConflict: 'product_id,buyer_id' }
                  ).select('id').single();
                  setContactLoading(false);
                  if (data?.id) router.push('/mensagens?c=' + data.id);
                }}
              >
                {contactLoading ? 'A abrir...' : 'Contactar vendedor'}
              </button>
            ) : (
              <Link href={`/entrar?redirect=/produtos/${product.id}`} className="btn btn-secondary">Iniciar sessão para contactar</Link>
            )}
          </div>
        </div>
        <ProductReviewsSection
          productId={product.id}
          reviews={reviews}
          canReview={canReview}
          user={user}
          productAvg={product.review_avg != null ? Number(product.review_avg) : null}
          productReviewCount={product.review_count ?? 0}
          onRefresh={async () => {
            const [reviewsRes, prodRes, brRes, statsRes] = await Promise.all([
              supabase
                .from('product_reviews')
                .select('*')
                .eq('product_id', id)
                .order('created_at', { ascending: false }),
              fetch(`/api/products/${id}`).then((r) => (r.ok ? r.json() : null)),
              user
                ? supabase.rpc('buyer_can_review_product', { p_product_id: id })
                : Promise.resolve({ data: false }),
              supabase.rpc('get_seller_rating_stats', { p_seller_id: product.seller_id }),
            ]);
            if (prodRes) setProduct(prodRes);
            setReviews((reviewsRes.data as ProductReviewRow[]) ?? []);
            setCanReview(!!brRes.data);
            if (statsRes.data) {
              const s = statsRes.data as { avg_rating?: number; review_count?: number };
              setSellerStats({
                avg: Number(s.avg_rating) || 0,
                count: Number(s.review_count) || 0,
              });
            }
          }}
        />
      </main>
      <Footer />
    </div>
  );
}
