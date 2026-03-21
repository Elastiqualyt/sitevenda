'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { CATEGORIES, getCategoryLabel } from '@/lib/categories';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  type: string;
  image_url: string | null;
  category: string;
}

function ProdutosContent() {
  const searchParams = useSearchParams();
  const tipoParam = searchParams.get('tipo') ?? '';
  const categoriaParam = searchParams.get('categoria') ?? '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState(tipoParam);
  const [categoria, setCategoria] = useState(categoriaParam);

  const apiParams = useMemo(() => {
    const p = new URLSearchParams();
    if (tipo) p.set('tipo', tipo);
    if (categoria) p.set('categoria', categoria);
    const s = p.toString();
    return s ? `?${s}` : '';
  }, [tipo, categoria]);

  useEffect(() => {
    setTipo(tipoParam);
    setCategoria(categoriaParam);
  }, [tipoParam, categoriaParam]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/products${apiParams}`);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [apiParams]);

  const updateUrl = (newTipo: string, newCategoria: string) => {
    const url = new URL(window.location.href);
    if (newTipo) url.searchParams.set('tipo', newTipo);
    else url.searchParams.delete('tipo');
    if (newCategoria) url.searchParams.set('categoria', newCategoria);
    else url.searchParams.delete('categoria');
    window.history.replaceState({}, '', url.toString());
  };

  const updateCategoria = (slug: string) => {
    setCategoria(slug);
    updateUrl(tipo, slug);
  };

  return (
    <div className="page">
      <Header />

      <main className="main">
        <h1>Produtos</h1>
        <div className="filters">
          <span className="filters-label">Tipo:</span>
          <button
            type="button"
            className={tipo === '' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => { setTipo(''); updateUrl('', categoria); }}
          >
            Todos
          </button>
          <button
            type="button"
            className={tipo === 'digital' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => { setTipo('digital'); updateUrl('digital', categoria); }}
          >
            Digitais
          </button>
          <button
            type="button"
            className={tipo === 'physical' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => { setTipo('physical'); updateUrl('physical', categoria); }}
          >
            Artesanato
          </button>
          <button
            type="button"
            className={tipo === 'used' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => { setTipo('used'); updateUrl('used', categoria); }}
          >
            Usados
          </button>
        </div>
        <div className="filters filters--category">
          <span className="filters-label">Categoria:</span>
          <select
            className="select-category"
            value={categoria}
            onChange={(e) => updateCategoria(e.target.value)}
            aria-label="Filtrar por categoria"
          >
            <option value="">Todas as categorias</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
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
                <span className="product-type">{getCategoryLabel(p.category) || p.category || '—'}</span>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function ProdutosPage() {
  return (
    <Suspense fallback={
      <div className="page">
        <main className="main"><p className="loading">A carregar...</p></main>
      </div>
    }>
      <ProdutosContent />
    </Suspense>
  );
}
