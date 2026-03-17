'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Product {
  id: string;
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
  const id = params?.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/products/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page"><main className="main"><p>A carregar...</p></main></div>;
  if (!product) return <div className="page"><main className="main"><p>Produto não encontrado.</p><Link href="/produtos">Voltar</Link></main></div>;

  return (
    <div className="page">
      <header className="header">
        <Link href="/" className="logo">Marketplace</Link>
        <nav className="nav">
          <Link href="/produtos">Produtos</Link>
          <Link href="/vender">Vender</Link>
          <Link href="/entrar">Entrar</Link>
        </nav>
      </header>
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
          </div>
        </div>
      </main>
    </div>
  );
}
