'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  type: string;
  image_url: string | null;
  category: string;
}

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState<string>('');

  useEffect(() => {
    const params = tipo ? `?tipo=${tipo}` : '';
    fetch(`/api/products${params}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [tipo]);

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
        <h1>Produtos</h1>
        <div className="filters">
          <button
            type="button"
            className={tipo === '' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setTipo('')}
          >
            Todos
          </button>
          <button
            type="button"
            className={tipo === 'digital' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setTipo('digital')}
          >
            Digitais
          </button>
          <button
            type="button"
            className={tipo === 'physical' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setTipo('physical')}
          >
            Artesanato
          </button>
          <button
            type="button"
            className={tipo === 'used' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setTipo('used')}
          >
            Usados
          </button>
        </div>

        {loading ? (
          <p className="loading">A carregar...</p>
        ) : products.length === 0 ? (
          <p className="empty">Ainda não há produtos. <Link href="/vender">Sê o primeiro a vender</Link>.</p>
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
                <p className="product-price">{Number(p.price).toFixed(2)} €</p>
                <span className="product-type">{p.type}</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
