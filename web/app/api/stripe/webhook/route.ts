import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe-server';
import { createServiceClient } from '@/lib/supabase-service';
import { fulfillStripeOrder, fulfillStripeOrderFromPaymentIntent } from '@/lib/stripe-fulfill-order';

export const runtime = 'nodejs';

/**
 * Webhook Stripe — confirma pagamento e credita vendedores.
 * O vendedor recebe o valor declarado no anúncio (`line_total`, incluindo portes quando aplicável).
 * A taxa de transação (6% + 0,50 €) é cobrada ao comprador no checkout.
 * Eventos: `checkout.session.completed` (principal) e opcionalmente `payment_intent.succeeded`
 * como rede de segurança (mesmo pedido, idempotente).
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

  let admin: ReturnType<typeof createServiceClient>;
  try {
    admin = createServiceClient();
  } catch (e) {
    console.error('Webhook: service client', e);
    return NextResponse.json({ error: 'Config' }, { status: 500 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const orderId =
      (session.metadata?.order_id as string | undefined) ||
      (typeof session.client_reference_id === 'string' ? session.client_reference_id : undefined);
    if (!orderId) {
      console.error('Webhook: order_id em falta no metadata');
      return NextResponse.json({ received: true, skipped: 'no_order' });
    }

    const result = await fulfillStripeOrder(admin, orderId, session);
    if (!result.ok) {
      console.error('Webhook: fulfill failed', result.reason, orderId);
      return NextResponse.json({ received: true, skipped: result.reason });
    }

    return NextResponse.json({ received: true, ok: true });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    if (!pi.metadata?.order_id) {
      return NextResponse.json({ received: true, skipped: 'pi_no_order_metadata' });
    }
    const result = await fulfillStripeOrderFromPaymentIntent(admin, pi);
    if (!result.ok) {
      console.error('Webhook: fulfill PI failed', result.reason, pi.id);
      return NextResponse.json({ received: true, skipped: result.reason });
    }
    return NextResponse.json({ received: true, ok: true, via: 'payment_intent' });
  }

  return NextResponse.json({ received: true });
}
