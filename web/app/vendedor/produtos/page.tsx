'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import {
  CATEGORY_ENTRETERIMENTO,
  CATEGORY_PRODUTO_DIGITAL,
  formatDigitalSubcategoriesList,
  formatEntertainmentSubcategoriesList,
  getCategoryLabel,
} from '@/lib/categories';
import type { Product } from '@/lib/types';

export default function VendedorProdutosPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingHiddenId, setTogglingHiddenId] = useState<string | null>(null);

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
    setMessage('');
    setDeletingId(id);
    const { error } = await supabase.from('products').delete().eq('id', id);
    setDeletingId(null);
    if (error) {
      const isFk = (error as { code?: string }).code === '23503';
      setMessage(
        isFk
          ? 'Não foi possível apagar este produto porque já está associado a pedidos/compras. Usa «Ocultar» para o tirar da vitrine.'
          : `Erro ao apagar produto: ${error.message}`
      );
      return;
    }
    setProducts((p) => p.filter((x) => x.id !== id));
    setMessage('Produto apagado.');
  };

  const handleToggleHidden = async (p: Product) => {
    setMessage('');
    const next = !p.hidden;
    setTogglingHiddenId(p.id);
    const { error } = await supabase.from('products').update({ hidden: next }).eq('id', p.id);
    setTogglingHiddenId(null);
    if (error) {
      setMessage(`Erro ao atualizar anúncio: ${error.message}`);
      return;
    }
    setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, hidden: next } : x)));
    setMessage(next ? 'Anúncio oculto na vitrine.' : 'Anúncio visível na vitrine.');
  };

  if (loading) return <p className="loading">A carregar...</p>;

  return (
    <div className="vendedor-page">
      <div className="vendedor-page__head">
        <h1>Meus produtos</h1>
        <div className="vendedor-page__actions">
          <Link href="/vendedor/produtos/importar" className="btn btn-secondary">
            Importar CSV
          </Link>
          <Link href="/vendedor/produtos/novo" className="btn btn-primary">
            + Novo produto
          </Link>
        </div>
      </div>
      <p className="vendedor-taxas-hint">
        Taxa de serviço no checkout (comprador): <Link href="/vender">política para vendedores</Link>.
      </p>
      {message ? <p className={message.startsWith('Erro') || message.startsWith('Não foi') ? 'auth-error' : 'auth-success'}>{message}</p> : null}
      {products.length === 0 ? (
        <p className="empty">Ainda não tens produtos. <Link href="/vendedor/produtos/novo">Criar o primeiro</Link>.</p>
      ) : (
        <div className="vendedor-table-wrap">
          <table className="vendedor-table">
            <thead>
              <tr>
                <th>Imagem</th>
                <th>Título / estado</th>
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
                  <td>
                    {p.title}
                    {p.hidden ? (
                      <span
                        className="vendedor-table__subcats"
                        style={{ display: 'block', marginTop: '0.35rem', color: 'var(--muted, #666)' }}
                      >
                        Oculto (fora da vitrine)
                      </span>
                    ) : null}
                  </td>
                  <td>{Number(p.price).toFixed(2)} €</td>
                  <td>{p.stock ?? 0}</td>
                  <td>
                    {getCategoryLabel(p.category)}
                    {p.category === CATEGORY_PRODUTO_DIGITAL && p.digital_subcategories?.length ? (
                      <span className="vendedor-table__subcats">
                        {' '}
                        ({formatDigitalSubcategoriesList(p.digital_subcategories)})
                      </span>
                    ) : null}
                    {p.category === CATEGORY_ENTRETERIMENTO && p.entertainment_subcategories?.length ? (
                      <span className="vendedor-table__subcats">
                        {' '}
                        ({formatEntertainmentSubcategoriesList(p.entertainment_subcategories)})
                      </span>
                    ) : null}
                  </td>
                  <td>
                    <Link href={`/produtos/${p.id}`} className="vendedor-link">Ver</Link>
                    {' · '}
                    <Link href={`/vendedor/produtos/${p.id}/editar`} className="vendedor-link">Editar</Link>
                    {' · '}
                    <button
                      type="button"
                      className="vendedor-link"
                      disabled={togglingHiddenId === p.id || deletingId === p.id}
                      onClick={() => handleToggleHidden(p)}
                    >
                      {togglingHiddenId === p.id
                        ? 'A atualizar…'
                        : p.hidden
                          ? 'Mostrar'
                          : 'Ocultar'}
                    </button>
                    {' · '}
                    <button
                      type="button"
                      className="vendedor-link vendedor-link--danger"
                      disabled={deletingId === p.id || togglingHiddenId === p.id}
                      onClick={() => handleDelete(p.id)}
                    >
                      {deletingId === p.id ? 'A apagar…' : 'Apagar'}
                    </button>
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
