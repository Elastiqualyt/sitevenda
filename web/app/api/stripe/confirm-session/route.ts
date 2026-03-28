import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe-server';
import { createServiceClient } from '@/lib/supabase-service';
import { getUserFromBearer } from '@/lib/supabase-route';
import { fulfillStripeOrder } from '@/lib/stripe-fulfill-order';

export const runtime = 'nodejs';

/**
 * Fallback quando o webhook Stripe falha ou chega tarde: o cliente chama após o redirect
 * de sucesso com `session_id` na URL. Confirma o pagamento na Stripe e executa a mesma
 * lógica que o webhook (marcar pedido como pago, créditos, stock, PDFs visíveis em /conta).
 *
 * POST body: { sessionId: string }
 * Header: Authorization: Bearer <access_token>
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromBearer(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Inicia sessão.' }, { status: 401 });
    }

    const body = (await request.json()) as { sessionId?: string };
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
    if (!sessionId.startsWith('cs_')) {
      return NextResponse.json({ error: 'sessionId inválido.' }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });

    const orderId =
      (session.metadata?.order_id as string | undefined) ||
      (typeof session.client_reference_id === 'string' ? session.client_reference_id : undefined);
    if (!orderId) {
      return NextResponse.json({ error: 'Pedido não associado a esta sessão.' }, { status: 400 });
    }

    const admin = createServiceClient();
    const { data: order, error: orderErr } = await admin.from('orders').select('buyer_id, status').eq('id', orderId).single();
    if (orderErr || !order) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    }
    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Esta compra não pertence à tua conta.' }, { status: 403 });
    }

    const result = await fulfillStripeOrder(admin, orderId, session);
    if (!result.ok) {
      const status =
        result.reason === 'amount_mismatch' || result.reason === 'order_not_pending' ? 409 : 400;
      const msg =
        result.reason === 'order_not_pending'
          ? 'Este pedido foi cancelado ou já não está pendente; não é possível confirmar o pagamento neste link.'
          : 'Não foi possível confirmar o pagamento.';
      return NextResponse.json({ error: msg, reason: result.reason }, { status });
    }

    return NextResponse.json({
      ok: true,
      orderId,
      alreadyPaid: result.alreadyPaid === true,
    });
  } catch (e) {
    console.error('[confirm-session]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro no servidor.' },
      { status: 500 }
    );
  }
}
