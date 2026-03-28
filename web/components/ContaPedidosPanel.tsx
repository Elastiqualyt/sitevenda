'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type PedidosScope = 'comprados' | 'vendidos';

type OrderItemRow = {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  product_id: string;
  product_subtotal_eur?: number | null;
  shipping_fee_eur?: number | null;
  buyer_fee_eur?: number | null;
};

type OrderRow = {
  id: string;
  total_amount: number;
  paid_at: string | null;
  created_at: string;
  status: string;
  order_items: OrderItemRow[];
};

type FilterKey = 'todos' | 'curso' | 'concluidos' | 'cancelados';

function matchesFilter(status: string, f: FilterKey): boolean {
  const s = (status || '').toLowerCase();
  switch (f) {
    case 'todos':
      return true;
    case 'curso':
      return s === 'pending';
    case 'concluidos':
      return s === 'paid';
    case 'cancelados':
      return s === 'failed' || s === 'cancelled';
    default:
      return true;
  }
}

function PedidosEmptyIllustration() {
  return (
    <div className="conta-pedidos-empty__art" aria-hidden>
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="28" y="22" width="64" height="82" rx="8" stroke="#5b9fd4" strokeWidth="2.5" fill="#f5faff" />
        <path
          d="M40 42h40M40 54h32M40 66h36M40 78h28"
          stroke="#5b9fd4"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

async function loadBuyerOrders(userId: string): Promise<{ orders: OrderRow[]; error: string | null }> {
  const { data: orderRows, error: orderErr } = await supabase
    .from('orders')
    .select('id, total_amount, paid_at, created_at, status')
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false });

  if (orderErr) {
    console.error('[pedidos] buyer orders', orderErr);
    return { orders: [], error: orderErr.message };
  }
  if (!orderRows?.length) {
    return { orders: [], error: null };
  }

  const orderIds = orderRows.map((o) => o.id as string);
  const { data: itemRows, error: itemsErr } = await supabase
    .from('order_items')
    .select(
      'id, order_id, title, quantity, unit_price, line_total, product_id, product_subtotal_eur, shipping_fee_eur, buyer_fee_eur'
    )
    .in('order_id', orderIds);

  if (itemsErr) {
    console.error('[pedidos] buyer items', itemsErr);
    return { orders: [], error: itemsErr.message };
  }

  const byOrder = new Map<string, OrderItemRow[]>();
  for (const it of itemRows ?? []) {
    const oid = it.order_id as string;
    const row: OrderItemRow = {
      id: it.id as string,
      title: String(it.title),
      quantity: Number(it.quantity),
      unit_price: Number(it.unit_price),
      line_total: Number(it.line_total),
      product_id: it.product_id as string,
      product_subtotal_eur: it.product_subtotal_eur as number | null | undefined,
      shipping_fee_eur: it.shipping_fee_eur as number | null | undefined,
      buyer_fee_eur: it.buyer_fee_eur as number | null | undefined,
    };
    if (!byOrder.has(oid)) byOrder.set(oid, []);
    byOrder.get(oid)!.push(row);
  }

  return {
    orders: orderRows.map((o) => ({
      id: o.id as string,
      total_amount: Number(o.total_amount),
      paid_at: (o.paid_at as string | null) ?? null,
      created_at: o.created_at as string,
      status: String(o.status ?? 'pending'),
      order_items: byOrder.get(o.id as string) ?? [],
    })),
    error: null,
  };
}

async function loadSellerOrders(userId: string): Promise<{ orders: OrderRow[]; error: string | null }> {
  const { data: itemRows, error: itemsErr } = await supabase
    .from('order_items')
    .select(
      'id, order_id, title, quantity, unit_price, line_total, product_id, product_subtotal_eur, shipping_fee_eur, buyer_fee_eur'
    )
    .eq('seller_id', userId);

  if (itemsErr) {
    console.error('[pedidos] seller items', itemsErr);
    return { orders: [], error: itemsErr.message };
  }

  if (!itemRows?.length) return { orders: [], error: null };

  const byOrder = new Map<string, OrderItemRow[]>();
  for (const it of itemRows) {
    const oid = it.order_id as string;
    const row: OrderItemRow = {
      id: it.id as string,
      title: String(it.title),
      quantity: Number(it.quantity),
      unit_price: Number(it.unit_price),
      line_total: Number(it.line_total),
      product_id: it.product_id as string,
      product_subtotal_eur: it.product_subtotal_eur as number | null | undefined,
      shipping_fee_eur: it.shipping_fee_eur as number | null | undefined,
      buyer_fee_eur: it.buyer_fee_eur as number | null | undefined,
    };
    if (!byOrder.has(oid)) byOrder.set(oid, []);
    byOrder.get(oid)!.push(row);
  }

  const orderIds = [...byOrder.keys()];
  const { data: orderRows, error: orderErr } = await supabase
    .from('orders')
    .select('id, total_amount, paid_at, created_at, status')
    .in('id', orderIds)
    .order('created_at', { ascending: false });

  if (orderErr) {
    console.error('[pedidos] seller orders', orderErr);
    return { orders: [], error: orderErr.message };
  }
  if (!orderRows?.length) {
    return { orders: [], error: null };
  }

  return {
    orders: orderRows.map((o) => ({
      id: o.id as string,
      total_amount: Number(o.total_amount),
      paid_at: (o.paid_at as string | null) ?? null,
      created_at: o.created_at as string,
      status: String(o.status ?? 'pending'),
      order_items: byOrder.get(o.id as string) ?? [],
    })),
    error: null,
  };
}

function sellerDisplayTotal(items: OrderItemRow[]): number {
  return items.reduce((acc, li) => acc + Number(li.line_total) + Number(li.buyer_fee_eur ?? 0), 0);
}

function statusLabelPt(status: string): string {
  switch (status) {
    case 'paid':
      return 'Pago';
    case 'pending':
      return 'Em curso';
    case 'failed':
      return 'Falhou';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status;
  }
}

const TABS: { key: FilterKey; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'curso', label: 'Em curso' },
  { key: 'concluidos', label: 'Concluídos' },
  { key: 'cancelados', label: 'Cancelados' },
];

export function ContaPedidosPanel({ scope, userId }: { scope: PedidosScope; userId: string }) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('curso');
  const [refreshKey, setRefreshKey] = useState(0);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadError(null);
      setCancelError(null);
      setLoading(true);
      const { orders: data, error } =
        scope === 'comprados' ? await loadBuyerOrders(userId) : await loadSellerOrders(userId);
      if (!cancelled) {
        setOrders(data);
        setLoadError(error);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scope, userId, refreshKey]);

  const reloadOrders = () => setRefreshKey((k) => k + 1);

  const cancelBuyerOrder = async (orderId: string) => {
    setCancelError(null);
    if (
      !confirm(
        'Cancelar este pedido em curso? Se ainda não pagaste, o link de pagamento deixa de ser válido. Para voltar a comprar, adiciona os artigos ao carrinho outra vez.'
      )
    ) {
      return;
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setCancelError('Inicia sessão de novo para cancelar o pedido.');
      return;
    }
    setCancellingId(orderId);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setCancelError(json.error ?? 'Não foi possível cancelar.');
        return;
      }
      reloadOrders();
    } catch {
      setCancelError('Erro de rede ao cancelar.');
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = useMemo(
    () => orders.filter((o) => matchesFilter(o.status, filter)),
    [orders, filter]
  );

  return (
    <div className="conta-pedidos-panel">
      <div className="conta-pedidos-tabs" role="tablist" aria-label="Filtrar pedidos">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={filter === t.key}
            className={`conta-pedidos-tab${filter === t.key ? ' conta-pedidos-tab--active' : ''}`}
            onClick={() => setFilter(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="conta-pedidos-panel__body" role="tabpanel">
        {cancelError ? (
          <p className="auth-error conta-pedidos-panel__msg" role="alert">
            {cancelError}
          </p>
        ) : null}
        {loadError ? (
          <p className="auth-error conta-pedidos-panel__msg" role="alert">
            Não foi possível carregar os pedidos: {loadError}.
          </p>
        ) : loading ? (
          <p className="loading conta-pedidos-panel__msg">A carregar…</p>
        ) : filtered.length === 0 ? (
          orders.length === 0 ? (
            <div className="conta-pedidos-empty">
              <PedidosEmptyIllustration />
              <p className="conta-pedidos-empty__title">Ainda sem pedidos</p>
              <p className="conta-pedidos-empty__sub">Quando venderes ou comprares algo, aparecerá aqui</p>
            </div>
          ) : (
            <div className="conta-pedidos-empty conta-pedidos-empty--filter">
              <p className="conta-pedidos-empty__title">Nada neste separador</p>
              <p className="conta-pedidos-empty__sub">Experimenta &quot;Todos&quot; ou outro estado.</p>
            </div>
          )
        ) : (
          <ul className="conta-orders-list conta-orders-list--in-panel">
            {filtered.map((o) => (
              <li key={o.id} className="conta-order-card">
                <div className="conta-order-card__head">
                  <span className="conta-order-card__date">
                    {(o.paid_at ? new Date(o.paid_at) : new Date(o.created_at)).toLocaleString('pt-PT')}
                  </span>
                  <strong className="conta-order-card__total">
                    {scope === 'vendidos'
                      ? sellerDisplayTotal(o.order_items).toFixed(2)
                      : Number(o.total_amount).toFixed(2)}{' '}
                    €
                  </strong>
                </div>
                <p className="conta-order-card__status">
                  <small>Estado: {statusLabelPt(o.status)}</small>
                </p>
                <p className="conta-order-card__id">
                  <small>Pedido: {o.id}</small>
                </p>
                {scope === 'comprados' && o.status === 'pending' ? (
                  <div className="conta-order-card__actions">
                    <button
                      type="button"
                      className="btn btn-secondary conta-order-card__cancel"
                      disabled={cancellingId === o.id}
                      onClick={() => void cancelBuyerOrder(o.id)}
                    >
                      {cancellingId === o.id ? 'A cancelar…' : 'Cancelar pedido'}
                    </button>
                  </div>
                ) : null}
                <ul className="conta-order-lines">
                  {(o.order_items ?? []).map((li) => (
                    <li key={li.id}>
                      <Link href={`/produtos/${li.product_id}`}>{li.title}</Link>
                      <span>
                        {li.quantity} × {Number(li.unit_price).toFixed(2)} €
                        {(li.shipping_fee_eur ?? 0) > 0
                          ? ` + ${Number(li.shipping_fee_eur).toFixed(2)} € portes`
                          : ''}{' '}
                        {(li.buyer_fee_eur ?? 0) > 0
                          ? ` + ${Number(li.buyer_fee_eur).toFixed(2)} € taxa comprador`
                          : ''}{' '}
                        = {(Number(li.line_total) + Number(li.buyer_fee_eur ?? 0)).toFixed(2)} €
                      </span>
                    </li>
                  ))}
                </ul>
                {(o.order_items ?? []).length === 0 ? (
                  <p className="conta-order-card__note">
                    <small>Sem linhas visíveis (contacta o suporte com o ID do pedido).</small>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
