'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  type: string;
  image_url: string | null;
  file_url?: string | null;
  category: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = params?.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactLoading, setContactLoading] = useState(false);

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

  if (loading) return <div className="page"><Header /><main className="main"><p>A carregar...</p></main><Footer /></div>;
  if (!product) return <div className="page"><Header /><main className="main"><p>Produto não encontrado.</p><Link href="/produtos">Voltar</Link></main><Footer /></div>;

  return (
    <div className="page">
      <Header />
      <main className="main">
        <Link href="/produtos">← Voltar aos produtos</Link>
        <div className="product-detail">
          <div className="product-detail-image">
            {product.image_url ? (
              <img src={product.image_url} alt={product.title} />
            ) : (
              <span className="product-placeholder">📦</span>
            )}
          </div>
          <div className="product-detail-info">
            <span className="product-type">{product.type}</span>
            <h1>{product.title}</h1>
            <p className="product-price">{Number(product.price).toFixed(2)} €</p>
            <p className="product-description">{product.description || 'Sem descrição.'}</p>
            <button type="button" className="btn btn-primary">Comprar</button>
            {' '}
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
      </main>
      <Footer />
    </div>
  );
}
