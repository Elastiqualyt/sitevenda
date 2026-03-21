'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CATEGORIES,
  CATEGORY_ENTRETERIMENTO,
  CATEGORY_PRODUTO_DIGITAL,
  DIGITAL_SUBCATEGORIES,
  ENTERTAINMENT_SUBCATEGORIES,
  formatDigitalSubcategoriesList,
  formatEntertainmentSubcategoriesList,
  getCategoryLabel,
  normalizeProductType,
  PRODUCT_TYPE_REUTILIZADOS,
} from '@/lib/categories';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { StarRating } from '@/components/StarRating';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  type: string;
  image_url: string | null;
  category: string;
  digital_subcategories?: string[] | null;
  entertainment_subcategories?: string[] | null;
  review_avg?: number | null;
  review_count?: number | null;
}

function ProdutosContent() {
  const searchParams = useSearchParams();
  const tipoRaw = searchParams.get('tipo') ?? '';
  const tipoParam = tipoRaw ? normalizeProductType(tipoRaw) || tipoRaw : '';
  const categoriaParam = searchParams.get('categoria') ?? '';
  const subcategoriasParam = searchParams.get('subcategorias') ?? '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState(tipoParam);
  const [categoria, setCategoria] = useState(categoriaParam);
  const [subcategorias, setSubcategorias] = useState<string[]>([]);

  const apiParams = useMemo(() => {
    const p = new URLSearchParams();
    if (tipo) p.set('tipo', tipo);
    if (categoria) p.set('categoria', categoria);
    if (
      (categoria === CATEGORY_PRODUTO_DIGITAL || categoria === CATEGORY_ENTRETERIMENTO) &&
      subcategorias.length
    ) {
      p.set('subcategorias', subcategorias.join(','));
    }
    const s = p.toString();
    return s ? `?${s}` : '';
  }, [tipo, categoria, subcategorias]);

  useEffect(() => {
    setTipo(tipoParam);
    setCategoria(categoriaParam);
    setSubcategorias(subcategoriasParam ? subcategoriasParam.split(',').filter(Boolean) : []);
  }, [tipoParam, categoriaParam, subcategoriasParam]);

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

  const writeUrl = (next: { tipo: string; categoria: string; subcategorias: string[] }) => {
    const url = new URL(window.location.href);
    if (next.tipo) url.searchParams.set('tipo', next.tipo);
    else url.searchParams.delete('tipo');
    if (next.categoria) url.searchParams.set('categoria', next.categoria);
    else url.searchParams.delete('categoria');
    if (
      (next.categoria === CATEGORY_PRODUTO_DIGITAL || next.categoria === CATEGORY_ENTRETERIMENTO) &&
      next.subcategorias.length
    ) {
      url.searchParams.set('subcategorias', next.subcategorias.join(','));
    } else {
      url.searchParams.delete('subcategorias');
    }
    window.history.replaceState({}, '', url.toString());
  };

  const updateTipo = (newTipo: string) => {
    setTipo(newTipo);
    writeUrl({ tipo: newTipo, categoria, subcategorias });
  };

  const updateCategoria = (slug: string) => {
    setCategoria(slug);
    setSubcategorias([]);
    writeUrl({ tipo, categoria: slug, subcategorias: [] });
  };

  const toggleSubcategoriaFilter = (slug: string) => {
    const next = subcategorias.includes(slug)
      ? subcategorias.filter((s) => s !== slug)
      : [...subcategorias, slug];
    setSubcategorias(next);
    writeUrl({ tipo, categoria, subcategorias: next });
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
            onClick={() => updateTipo('')}
          >
            Todos
          </button>
          <button
            type="button"
            className={tipo === 'digital' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => updateTipo('digital')}
          >
            Digitais
          </button>
          <button
            type="button"
            className={tipo === 'physical' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => updateTipo('physical')}
          >
            Artesanato
          </button>
          <button
            type="button"
            className={tipo === PRODUCT_TYPE_REUTILIZADOS ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => updateTipo(PRODUCT_TYPE_REUTILIZADOS)}
          >
            Reutilizados
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
        {categoria === CATEGORY_PRODUTO_DIGITAL && (
          <div className="filters filters--digital-sub" role="group" aria-label="Subcategorias Produto Digital">
            <span className="filters-label">Subcategorias:</span>
            {DIGITAL_SUBCATEGORIES.map((c) => (
              <label key={c.slug} className="filters-check">
                <input
                  type="checkbox"
                  checked={subcategorias.includes(c.slug)}
                  onChange={() => toggleSubcategoriaFilter(c.slug)}
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        )}
        {categoria === CATEGORY_ENTRETERIMENTO && (
          <div className="filters filters--digital-sub" role="group" aria-label="Subcategorias Entretenimento">
            <span className="filters-label">Subcategorias:</span>
            {ENTERTAINMENT_SUBCATEGORIES.map((c) => (
              <label key={c.slug} className="filters-check">
                <input
                  type="checkbox"
                  checked={subcategorias.includes(c.slug)}
                  onChange={() => toggleSubcategoriaFilter(c.slug)}
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        )}

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
                {(p.review_count ?? 0) > 0 && p.review_avg != null ? (
                  <p className="product-card__stars" aria-label={`Média ${p.review_avg} estrelas`}>
                    <StarRating value={Number(p.review_avg)} size="sm" />
                    <span className="product-card__stars-count">({p.review_count})</span>
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
