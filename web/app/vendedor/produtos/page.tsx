'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { getCategoryLabel } from '@/lib/categories';
import type { Product } from '@/lib/types';

export default function VendedorProdutosPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });
        setProducts((data as Product[]) ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const handleDelete = async (id: string) => {
    if (!confirm('Apagar este produto?')) return;
    await supabase.from('products').delete().eq('id', id);
    setProducts((p) => p.filter((x) => x.id !== id));
  };

  if (loading) return <p className="loading">A carregar...</p>;

  return (
    <div className="vendedor-page">
      <div className="vendedor-page__head">
        <h1>Meus produtos</h1>
        <Link href="/vendedor/produtos/novo" className="btn btn-primary">+ Novo produto</Link>
      </div>
      {products.length === 0 ? (
        <p className="empty">Ainda não tens produtos. <Link href="/vendedor/produtos/novo">Criar o primeiro</Link>.</p>
      ) : (
        <div className="vendedor-table-wrap">
          <table className="vendedor-table">
            <thead>
              <tr>
                <th>Imagem</th>
                <th>Título</th>
                <th>Preço</th>
                <th>Stock</th>
                <th>Categoria</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="vendedor-table__img" />
                    ) : (
                      <span className="vendedor-table__placeholder">—</span>
                    )}
                  </td>
                  <td>{p.title}</td>
                  <td>{Number(p.price).toFixed(2)} €</td>
                  <td>{p.stock ?? 0}</td>
                  <td>{getCategoryLabel(p.category)}</td>
                  <td>
                    <Link href={`/produtos/${p.id}`} className="vendedor-link">Ver</Link>
                    {' · '}
                    <Link href={`/vendedor/produtos/${p.id}/editar`} className="vendedor-link">Editar</Link>
                    {' · '}
                    <button type="button" className="vendedor-link vendedor-link--danger" onClick={() => handleDelete(p.id)}>Apagar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
