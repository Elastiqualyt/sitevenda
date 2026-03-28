import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe-server';
import {
  createSupabaseRouteUserClient,
  getBearerTokenFromRequest,
  getUserFromBearer,
} from '@/lib/supabase-route';

export const runtime = 'nodejs';

/**
 * POST /api/orders/[id]/cancel
 * Cancela um pedido ainda `pending` (pagamento não concluído).
 * Usa o JWT do comprador + RLS (não exige SUPABASE_SERVICE_ROLE_KEY).
 * Expira a sessão Stripe Checkout quando existir e STRIPE_SECRET_KEY estiver definida.
 * Header: Authorization: Bearer <access_token>
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromBearer(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Inicia sessão para cancelar o pedido.' }, { status: 401 });
    }

    const accessToken = getBearerTokenFromRequest(request);
    if (!accessToken) {
      return NextResponse.json({ error: 'Token em falta.' }, { status: 401 });
    }

    let supabase: ReturnType<typeof createSupabaseRouteUserClient>;
    try {
      supabase = createSupabaseRouteUserClient(accessToken);
    } catch (e) {
      console.error('[cancel-order] supabase client', e);
      return NextResponse.json({ error: 'Configuração do servidor em falta (Supabase).' }, { status: 500 });
    }

    const orderId = typeof params?.id === 'string' ? params.id.trim() : '';
    if (!orderId) {
      return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
    }

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, buyer_id, status, stripe_checkout_session_id')
      .eq('id', orderId)
      .maybeSingle();

    if (orderErr) {
      console.error('[cancel-order] select', orderErr);
      return NextResponse.json({ error: 'Não foi possível ler o pedido.' }, { status: 500 });
    }
    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    }
    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Só o comprador pode cancelar este pedido.' }, { status: 403 });
    }
    if (order.status !== 'pending') {
      return NextResponse.json(
        {
          error:
            order.status === 'paid'
              ? 'Este pedido já foi pago e não pode ser cancelado aqui.'
              : 'Este pedido já não está em curso.',
        },
        { status: 409 }
      );
    }

    const sessionId =
      typeof order.stripe_checkout_session_id === 'string' ? order.stripe_checkout_session_id.trim() : '';
    if (sessionId.startsWith('cs_') && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = getStripe();
        await stripe.checkout.sessions.expire(sessionId);
      } catch (e) {
        console.warn('[cancel-order] Stripe expire (sessão já expirada ou concluída?)', e);
      }
    }

    const { data: updated, error: updErr } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (updErr) {
      console.error('[cancel-order] update', updErr);
      return NextResponse.json({ error: 'Não foi possível cancelar o pedido.' }, { status: 500 });
    }
    if (!updated) {
      return NextResponse.json(
        { error: 'O pedido já foi atualizado (por exemplo, pagamento concluído). Atualiza a página.' },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: true, orderId });
  } catch (e) {
    console.error('[cancel-order]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro no servidor.' },
      { status: 500 }
    );
  }
}
