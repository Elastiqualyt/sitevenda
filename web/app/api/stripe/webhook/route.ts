import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe-server';
import { createServiceClient } from '@/lib/supabase-service';
import { sellerLineNetAndCommission } from '@/lib/seller-fees';

export const runtime = 'nodejs';

/**
 * Webhook Stripe — confirma pagamento e credita vendedores (valor líquido após comissão da plataforma).
 * Comissão: `SELLER_TRANSACTION_FEE_PERCENT` em `@/lib/seller-fees` (6,5 % sobre cada linha `line_total`).
 * Configura em Stripe Dashboard → Webhooks → URL: /api/stripe/webhook · Segredo: STRIPE_WEBHOOK_SECRET
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET em falta');
    return NextResponse.json({ error: 'Webhook não configurado' }, { status: 500 });
  }

  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Assinatura em falta' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.error('Webhook signature:', err);
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== 'paid') {
    return NextResponse.json({ received: true, skipped: 'not_paid' });
  }

  const orderId =
    (session.metadata?.order_id as string | undefined) ||
    (typeof session.client_reference_id === 'string' ? session.client_reference_id : undefined);
  if (!orderId) {
    console.error('Webhook: order_id em falta no metadata');
    return NextResponse.json({ received: true, skipped: 'no_order' });
  }

  const admin = createServiceClient();

  const { data: order, error: orderErr } = await admin.from('orders').select('*').eq('id', orderId).single();
  if (orderErr || !order) {
    console.error('Webhook: pedido não encontrado', orderId, orderErr);
    return NextResponse.json({ received: true, skipped: 'order_missing' });
  }

  if (order.status === 'paid') {
    return NextResponse.json({ received: true, idempotent: true });
  }

  const totalCents = Math.round(Number(order.total_amount) * 100);
  if (session.amount_total != null && session.amount_total !== totalCents) {
    console.error('Webhook: valor não coincide', session.amount_total, totalCents);
    return NextResponse.json({ received: true, skipped: 'amount_mismatch' });
  }

  const { data: orderItems, error: oiErr } = await admin
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  if (oiErr || !orderItems?.length) {
    console.error('Webhook: linhas em falta', oiErr);
    return NextResponse.json({ received: true, skipped: 'no_items' });
  }

  const pi =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const { data: updatedRows, error: updOrderErr } = await admin
    .from('orders')
    .update({
      status: 'paid',
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: pi,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('status', 'pending')
    .select('id');

  if (updOrderErr) {
    console.error('Webhook: falha ao atualizar pedido', updOrderErr);
    return NextResponse.json({ received: true, error: 'update_order' }, { status: 500 });
  }
  if (!updatedRows?.length) {
    return NextResponse.json({ received: true, idempotent: true });
  }

  for (const row of orderItems) {
    const sellerId = row.seller_id as string;
    const lineTotal = Number(row.line_total);
    const productId = row.product_id as string;
    const qty = Number(row.quantity);

    const { net: netCredit, gross: grossLine, commission } = sellerLineNetAndCommission(lineTotal);

    const { data: profile } = await admin.from('profiles').select('balance').eq('id', sellerId).maybeSingle();
    const bal = Number(profile?.balance ?? 0);
    await admin
      .from('profiles')
      .update({
        balance: bal + netCredit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sellerId);

    await admin.from('balance_transactions').insert({
      user_id: sellerId,
      type: 'sale',
      amount: netCredit,
      status: 'completed',
      reference: `Pedido ${orderId.slice(0, 8)} — produto ${String(productId).slice(0, 8)} — líquido ${netCredit.toFixed(2)} € (bruto ${grossLine.toFixed(2)} €, comissão ${commission.toFixed(2)} € / 6,5 %)`,
    });

    const { data: prod } = await admin
      .from('products')
      .select('type, stock')
      .eq('id', productId)
      .maybeSingle();
    const pType = String(prod?.type ?? '');
    if (pType !== 'digital') {
      const stock = Number(prod?.stock ?? 0);
      await admin
        .from('products')
        .update({ stock: Math.max(0, stock - qty), updated_at: new Date().toISOString() })
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

  return NextResponse.json({ received: true, ok: true });
}
