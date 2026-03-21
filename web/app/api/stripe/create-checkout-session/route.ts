import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getStripe } from '@/lib/stripe-server';
import { getAppOrigin } from '@/lib/app-url';
import { getUserFromBearer } from '@/lib/supabase-route';

export const runtime = 'nodejs';

type BodyItem = { productId: string; quantity: number };

function createUserSupabase(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/**
 * POST /api/stripe/create-checkout-session
 * Body: { items: { productId, quantity }[] }
 * Header: Authorization: Bearer <access_token>
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromBearer(request);
    if (!user?.id) {
      return NextResponse.json({ error: 'Inicia sessão para pagar.' }, { status: 401 });
    }

    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : '';
    if (!accessToken) {
      return NextResponse.json({ error: 'Token em falta.' }, { status: 401 });
    }

    const body = (await request.json()) as { items?: BodyItem[] };
    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (!rawItems.length || rawItems.length > 50) {
      return NextResponse.json({ error: 'Lista de artigos inválida.' }, { status: 400 });
    }

    const mergedQty = new Map<string, number>();
    for (const raw of rawItems) {
      const id = raw.productId?.trim();
      if (!id) continue;
      const q = Math.min(99, Math.max(1, Math.floor(Number(raw.quantity))));
      mergedQty.set(id, Math.min(99, (mergedQty.get(id) ?? 0) + q));
    }
    const items = [...mergedQty.entries()].map(([productId, quantity]) => ({ productId, quantity }));
    if (!items.length) {
      return NextResponse.json({ error: 'Lista de artigos inválida.' }, { status: 400 });
    }

    const supabase = createUserSupabase(accessToken);

    const productIds = [...new Set(items.map((i) => i.productId).filter(Boolean))];
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id, title, price, seller_id, type, stock')
      .in('id', productIds);

    if (prodErr || !products?.length) {
      return NextResponse.json({ error: 'Não foi possível carregar os produtos.' }, { status: 400 });
    }

    const byId = new Map(products.map((p) => [p.id as string, p]));

    type Line = {
      product_id: string;
      seller_id: string;
      title: string;
      quantity: number;
      unit_price: number;
      line_total: number;
    };
    const lines: Line[] = [];

    for (const raw of items) {
      const qty = Math.min(99, Math.max(1, Math.floor(Number(raw.quantity))));
      const p = byId.get(raw.productId);
      if (!p) {
        return NextResponse.json({ error: `Produto desconhecido: ${raw.productId}` }, { status: 400 });
      }
      if (p.seller_id === user.id) {
        return NextResponse.json({ error: 'Não podes comprar o teu próprio anúncio.' }, { status: 400 });
      }
      const type = String(p.type);
      const stock = Number(p.stock ?? 0);
      if (type !== 'digital' && stock < qty) {
        return NextResponse.json(
          { error: `Stock insuficiente para «${p.title}».` },
          { status: 400 }
        );
      }
      const unit = Number(p.price);
      if (!Number.isFinite(unit) || unit < 0) {
        return NextResponse.json({ error: 'Preço inválido.' }, { status: 400 });
      }
      lines.push({
        product_id: p.id as string,
        seller_id: p.seller_id as string,
        title: String(p.title).slice(0, 500),
        quantity: qty,
        unit_price: unit,
        line_total: Math.round(unit * qty * 100) / 100,
      });
    }

    const total = Math.round(lines.reduce((s, l) => s + l.line_total, 0) * 100) / 100;
    if (total < 0.5) {
      return NextResponse.json(
        { error: 'O total mínimo para pagamento com cartão é 0,50 €.' },
        { status: 400 }
      );
    }

    const { data: orderRow, error: orderErr } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        status: 'pending',
        total_amount: total,
        currency: 'eur',
      })
      .select('id')
      .single();

    if (orderErr || !orderRow?.id) {
      console.error(orderErr);
      return NextResponse.json({ error: 'Não foi possível criar o pedido.' }, { status: 500 });
    }

    const orderId = orderRow.id as string;

    const { error: itemsErr } = await supabase.from('order_items').insert(
      lines.map((l) => ({
        order_id: orderId,
        product_id: l.product_id,
        seller_id: l.seller_id,
        title: l.title,
        quantity: l.quantity,
        unit_price: l.unit_price,
        line_total: l.line_total,
      }))
    );

    if (itemsErr) {
      console.error(itemsErr);
      await supabase.from('orders').delete().eq('id', orderId);
      return NextResponse.json({ error: 'Não foi possível guardar as linhas do pedido.' }, { status: 500 });
    }

    const origin = getAppOrigin();
    const stripe = getStripe();

    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        client_reference_id: orderId,
        customer_email: user.email ?? undefined,
        success_url: `${origin}/carrinho/sucesso?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/carrinho?cancelled=1`,
        metadata: {
          order_id: orderId,
          buyer_id: user.id,
        },
        payment_intent_data: {
          metadata: {
            order_id: orderId,
            buyer_id: user.id,
          },
        },
        line_items: lines.map((l) => ({
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(l.unit_price * 100),
            product_data: {
              name: l.title.slice(0, 120),
            },
          },
          quantity: l.quantity,
        })),
      });

      const { error: updErr } = await supabase
        .from('orders')
        .update({ stripe_checkout_session_id: session.id })
        .eq('id', orderId);

      if (updErr) {
        console.error(updErr);
      }

      if (!session.url) {
        await supabase.from('orders').delete().eq('id', orderId);
        return NextResponse.json({ error: 'Stripe não devolveu URL de pagamento.' }, { status: 500 });
      }

      return NextResponse.json({ url: session.url, orderId });
    } catch (e) {
      console.error(e);
      await supabase.from('orders').delete().eq('id', orderId);
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Erro ao criar sessão Stripe.' },
        { status: 500 }
      );
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro no servidor.' },
      { status: 500 }
    );
  }
}
