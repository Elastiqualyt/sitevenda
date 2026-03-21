'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { CATEGORY_PRODUTO_DIGITAL } from '@/lib/categories';

type Row = {
  orderItemId: string;
  orderId: string;
  productId: string;
  paidAt: string | null;
  title: string;
  quantity: number;
  fileUrl: string;
};

export default function ContaDigitaisPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data: orderList, error: oErr } = await supabase
        .from('orders')
        .select('id, paid_at')
        .eq('buyer_id', user.id)
        .eq('status', 'paid');
      if (oErr || !orderList?.length) {
        if (!cancelled) {
          setRows([]);
          setLoading(false);
        }
        return;
      }
      const orderMap = new Map(orderList.map((o) => [o.id as string, o.paid_at as string | null]));
      const orderIds = orderList.map((o) => o.id as string);

      const { data: items, error: iErr } = await supabase
        .from('order_items')
        .select('id, order_id, product_id, title, quantity')
        .in('order_id', orderIds);

      if (iErr || !items?.length) {
        if (!cancelled) {
          setRows([]);
          setLoading(false);
        }
        return;
      }

      const productIds = [...new Set(items.map((i) => i.product_id as string))];
      const { data: products } = await supabase
        .from('products')
        .select('id, file_url, type, category, title')
        .in('id', productIds);

      const pmap = new Map((products ?? []).map((p) => [p.id as string, p]));
      const out: Row[] = [];

      for (const it of items) {
        const p = pmap.get(it.product_id as string);
        if (!p) continue;
        const fileUrl = (p.file_url as string | null)?.trim();
        if (!fileUrl) continue;
        const isDigital =
          String(p.type) === 'digital' || String(p.category) === CATEGORY_PRODUTO_DIGITAL;
        if (!isDigital) continue;
        out.push({
          orderItemId: it.id as string,
          orderId: it.order_id as string,
          productId: it.product_id as string,
          paidAt: orderMap.get(it.order_id as string) ?? null,
          title: String(it.title || p.title || 'Produto'),
          quantity: Number(it.quantity) || 1,
          fileUrl,
        });
      }

      if (!cancelled) {
        setRows(out);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <div className="vendedor-page">
      <h1>Ficheiros digitais comprados</h1>
      <p className="auth-subtitle">
        Ligações de descarga dos produtos digitais incluídos em pedidos pagos. Guarda os ficheiros localmente;
        o link público depende da configuração do Storage no Supabase.
      </p>

      {loading ? (
        <p className="loading">A carregar...</p>
      ) : rows.length === 0 ? (
        <p className="empty">
          Ainda não tens ficheiros digitais associados a compras pagas.{' '}
          <Link href="/produtos?categoria=produto-digital">Ver produtos digitais</Link>
        </p>
      ) : (
        <ul className="conta-digital-list">
          {rows.map((r) => (
            <li key={r.orderItemId} className="conta-digital-row">
              <div>
                <strong>{r.title}</strong>
                {r.quantity > 1 ? <span className="conta-digital-qty"> × {r.quantity}</span> : null}
                <p className="conta-digital-meta">
                  {r.paidAt ? new Date(r.paidAt).toLocaleString('pt-PT') : ''}
                  {' · '}
                  <Link href={`/produtos/${r.productId}`}>Ver anúncio</Link>
                </p>
              </div>
              <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                Abrir / descarregar
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
