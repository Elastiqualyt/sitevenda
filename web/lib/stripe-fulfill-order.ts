import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getAppOrigin } from '@/lib/app-url';

/** Tolerância (cêntimos) entre total Stripe e total do pedido (arredondamentos). */
const AMOUNT_TOTAL_CENTS_TOLERANCE = 2;

type OrderItemRow = { product_id: string; seller_id: string; quantity: number | string | null };

/**
 * Cria ou reutiliza a conversa do produto e envia uma mensagem automática do comprador
 * para o vendedor (aparece no chat habitual). Só deve correr quando o pedido acabou de
 * passar a pago (cliente admin / service role).
 */
async function notifySellersViaPurchaseChat(
  admin: SupabaseClient,
  orderId: string,
  buyerId: string,
  orderItems: OrderItemRow[]
): Promise<void> {
  const { data: buyerProfile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', buyerId)
    .maybeSingle();

  const buyerName = (buyerProfile?.full_name ?? '').trim() || 'Comprador';
  const origin = getAppOrigin();
  const profileUrl = `${origin}/perfil/${buyerId}`;
  const orderRef = String(orderId).slice(0, 8);

  const productIds = [...new Set(orderItems.map((r) => String(r.product_id)))];
  const { data: products } = await admin.from('products').select('id, title').in('id', productIds);
  const titleById = new Map((products ?? []).map((p) => [String(p.id), String(p.title ?? '')]));

  for (const row of orderItems) {
    const productId = String(row.product_id);
    const sellerId = String(row.seller_id);
    const qty = Math.max(1, Number(row.quantity) || 1);
    const title = titleById.get(productId)?.trim() || 'Produto';

    const { data: conv, error: convErr } = await admin
      .from('conversations')
      .upsert(
        { product_id: productId, buyer_id: buyerId, seller_id: sellerId },
        { onConflict: 'product_id,buyer_id' }
      )
      .select('id')
      .single();

    if (convErr || !conv?.id) {
      console.error('[notifySellersViaPurchaseChat] conversation', convErr);
      continue;
    }

    const content = [
      `Olá! Acabei de comprar «${title}» (${qty}×).`,
      `Referência do pedido: ${orderRef}…`,
      '',
      `${buyerName}`,
      `Perfil: ${profileUrl}`,
    ].join('\n');

    const { error: msgErr } = await admin.from('messages').insert({
      conversation_id: conv.id,
      sender_id: buyerId,
      content,
    });

    if (msgErr) {
      console.error('[notifySellersViaPurchaseChat] message', msgErr);
    }
  }
}

export type FulfillResult =
  | { ok: true; alreadyPaid?: boolean }
  | { ok: false; reason: string };

/**
 * Marca o pedido como pago, credita vendedores, atualiza stock e regista movimentos.
 * Idempotente se o pedido já estiver `paid`.
 */
export async function fulfillStripeOrder(
  admin: SupabaseClient,
  orderId: string,
  session: Stripe.Checkout.Session
): Promise<FulfillResult> {
  if (session.payment_status !== 'paid') {
    return { ok: false, reason: 'not_paid' };
  }

  const { data: order, error: orderErr } = await admin.from('orders').select('*').eq('id', orderId).single();
  if (orderErr || !order) {
    return { ok: false, reason: 'order_missing' };
  }

  if (order.status === 'paid') {
    return { ok: true, alreadyPaid: true };
  }
  if (order.status !== 'pending') {
    return { ok: false, reason: 'order_not_pending' };
  }

  const totalCents = Math.round(Number(order.total_amount) * 100);
  if (session.amount_total != null) {
    const diff = Math.abs(session.amount_total - totalCents);
    if (diff > AMOUNT_TOTAL_CENTS_TOLERANCE) {
      console.error('[fulfillStripeOrder] amount mismatch', {
        sessionAmount: session.amount_total,
        orderCents: totalCents,
        orderId,
      });
      return { ok: false, reason: 'amount_mismatch' };
    }
  }

  const { data: orderItems, error: oiErr } = await admin
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  if (oiErr || !orderItems?.length) {
    return { ok: false, reason: 'no_items' };
  }

  const pi =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const checkoutSessionId =
    (session.id && String(session.id)) ||
    (order.stripe_checkout_session_id as string | null | undefined) ||
    null;

  const { data: updatedRows, error: updOrderErr } = await admin
    .from('orders')
    .update({
      status: 'paid',
      stripe_checkout_session_id: checkoutSessionId,
      stripe_payment_intent_id: pi,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('status', 'pending')
    .select('id');

  if (updOrderErr) {
    console.error('[fulfillStripeOrder] update order', updOrderErr);
    return { ok: false, reason: 'update_order' };
  }
  if (!updatedRows?.length) {
    const { data: again } = await admin.from('orders').select('status').eq('id', orderId).maybeSingle();
    const st = String(again?.status ?? '');
    if (st === 'paid') return { ok: true, alreadyPaid: true };
    return { ok: false, reason: 'order_not_pending' };
  }

  for (const row of orderItems) {
    const sellerId = row.seller_id as string;
    const lineTotal = Number(row.line_total); // artigo + portes, sem taxa do comprador
    const productId = row.product_id as string;
    const qty = Number(row.quantity);

    const { data: profile } = await admin.from('profiles').select('balance').eq('id', sellerId).maybeSingle();
    const bal = Number(profile?.balance ?? 0);
    const newBal = Math.round((bal + lineTotal) * 100) / 100;
    await admin
      .from('profiles')
      .update({
        balance: newBal,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sellerId);

    await admin.from('balance_transactions').insert({
      user_id: sellerId,
      type: 'sale',
      amount: lineTotal,
      status: 'completed',
      reference: `Pedido ${orderId.slice(0, 8)} — produto ${String(productId).slice(0, 8)} — crédito vendedor ${lineTotal.toFixed(2)} €`,
    });

    const { data: prod } = await admin
      .from('products')
      .select('type, stock')
      .eq('id', productId)
      .maybeSingle();
    const pType = String(prod?.type ?? '');
    if (pType !== 'digital') {
      const stock = Number(prod?.stock ?? 0);
      const newStock = Math.max(0, stock - qty);
      await admin
        .from('products')
        .update({
          stock: newStock,
          updated_at: new Date().toISOString(),
          ...(newStock === 0 ? { listing_fee_paused: true } : {}),
        })
        .eq('id', productId);
    }
  }

  const buyerId = order.buyer_id as string;
  await admin.from('cart_items').delete().eq('user_id', buyerId);

  await admin.from('balance_transactions').insert({
    user_id: buyerId,
    type: 'purchase',
    amount: Number(order.total_amount),
    status: 'completed',
    reference: `Compra Stripe — pedido ${String(orderId).slice(0, 8)}`,
  });

  await notifySellersViaPurchaseChat(admin, orderId, buyerId, orderItems as OrderItemRow[]);

  return { ok: true };
}

/**
 * Fallback quando o evento `checkout.session.completed` não chega ou falha:
 * o PaymentIntent do Checkout inclui `metadata.order_id` (ver create-checkout-session).
 */
export async function fulfillStripeOrderFromPaymentIntent(
  admin: SupabaseClient,
  pi: Stripe.PaymentIntent
): Promise<FulfillResult> {
  if (pi.status !== 'succeeded') {
    return { ok: false, reason: 'not_paid' };
  }
  const orderId = pi.metadata?.order_id;
  if (!orderId || typeof orderId !== 'string') {
    return { ok: false, reason: 'no_order' };
  }

  const { data: order, error: orderErr } = await admin.from('orders').select('*').eq('id', orderId).single();
  if (orderErr || !order) {
    return { ok: false, reason: 'order_missing' };
  }

  const checkoutSid =
    (typeof order.stripe_checkout_session_id === 'string' && order.stripe_checkout_session_id) || '';

  const syntheticSession = {
    id: checkoutSid,
    payment_status: 'paid' as const,
    amount_total: pi.amount_received ?? pi.amount,
    payment_intent: pi,
  } as Stripe.Checkout.Session;

  return fulfillStripeOrder(admin, orderId, syntheticSession);
}
