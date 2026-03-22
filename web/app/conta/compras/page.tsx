'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type OrderRow = {
  id: string;
  total_amount: number;
  paid_at: string | null;
  created_at: string;
  order_items: {
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    product_id: string;
    product_subtotal_eur?: number | null;
    shipping_fee_eur?: number | null;
  }[];
};

export default function ContaComprasPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          total_amount,
          paid_at,
          created_at,
          order_items (
            id,
            title,
            quantity,
            unit_price,
            line_total,
            product_id,
            product_subtotal_eur,
            shipping_fee_eur
          )
        `
        )
        .eq('buyer_id', user.id)
        .eq('status', 'paid')
        .order('paid_at', { ascending: false });

      if (!cancelled && !error && data) {
        setOrders(data as OrderRow[]);
      } else if (error) {
        console.error(error);
        setOrders([]);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <div className="vendedor-page">
      <h1>Histórico de compras</h1>
      <p className="auth-subtitle">
        Pedidos pagos com Stripe. O pagamento com cartão não debita o saldo interno; aparece como movimento
        &quot;Compra&quot; em Saldo.
      </p>

      {loading ? (
        <p className="loading">A carregar...</p>
      ) : orders.length === 0 ? (
        <p className="empty">
          Ainda não tens compras concluídas. <Link href="/produtos">Explorar produtos</Link>
        </p>
      ) : (
        <ul className="conta-orders-list">
          {orders.map((o) => (
            <li key={o.id} className="conta-order-card">
              <div className="conta-order-card__head">
                <span className="conta-order-card__date">
                  {(o.paid_at ? new Date(o.paid_at) : new Date(o.created_at)).toLocaleString('pt-PT')}
                </span>
                <strong className="conta-order-card__total">{Number(o.total_amount).toFixed(2)} €</strong>
              </div>
              <p className="conta-order-card__id">
                <small>Pedido: {o.id}</small>
              </p>
              <ul className="conta-order-lines">
                {(o.order_items ?? []).map((li) => (
                  <li key={li.id}>
                    <Link href={`/produtos/${li.product_id}`}>{li.title}</Link>
                    <span>
                      {li.quantity} × {Number(li.unit_price).toFixed(2)} €
                      {(li.shipping_fee_eur ?? 0) > 0
                        ? ` + ${Number(li.shipping_fee_eur).toFixed(2)} € portes`
                        : ''}{' '}
                      = {Number(li.line_total).toFixed(2)} €
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
