import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe-server';
import { getAppOrigin } from '@/lib/app-url';
import { getUserFromBearer } from '@/lib/supabase-route';
import { createServiceClient } from '@/lib/supabase-service';
import { checkoutShippingFeeEur, roundMoney2 } from '@/lib/product-shipping';
import { buyerTotalFromBase } from '@/lib/seller-fees';

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
      .select('id, title, price, seller_id, type, stock, shipping_fee_eur, ships_only_same_region')
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
      product_subtotal: number;
      shipping_fee: number;
      line_total: number; // valor do vendedor (artigo + portes)
      buyer_fee: number; // taxa cobrada ao comprador (6% + 0,50 €)
      buyer_total: number; // line_total + buyer_fee
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
      const productSubtotal = roundMoney2(unit * qty);
      const shippingFee = checkoutShippingFeeEur(type, p.shipping_fee_eur as number | null | undefined);
      const lineTotal = roundMoney2(productSubtotal + shippingFee);
      const buyer = buyerTotalFromBase(lineTotal);
      lines.push({
        product_id: p.id as string,
        seller_id: p.seller_id as string,
        title: String(p.title).slice(0, 500),
        quantity: qty,
        unit_price: unit,
        product_subtotal: productSubtotal,
        shipping_fee: shippingFee,
        line_total: lineTotal,
        buyer_fee: buyer.fee,
        buyer_total: buyer.total,
      });
    }

    const total = Math.round(lines.reduce((s, l) => s + l.buyer_total, 0) * 100) / 100;
    if (total < 0.5) {
      return NextResponse.json(
        { error: 'O total mínimo para pagamento com cartão é 0,50 €.' },
        { status: 400 }
      );
    }

    /**
     * Pedidos e linhas com service role: o utilizador já foi validado pelo JWT acima;
     * `buyer_id` vem sempre de `user.id` (nunca do body). Isto evita falhas de RLS
     * no insert em ambientes onde as policies não coincidem com o token.
     */
    let admin: ReturnType<typeof createServiceClient>;
    try {
      admin = createServiceClient();
    } catch (cfgErr) {
      console.error('[create-checkout-session] service client:', cfgErr);
      return NextResponse.json(
        {
          error: 'Configuração do servidor em falta.',
          details: cfgErr instanceof Error ? cfgErr.message : String(cfgErr),
        },
        { status: 500 }
      );
    }

    const { data: orderRow, error: orderErr } = await admin
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
      console.error('[create-checkout-session] orders insert:', orderErr);
      return NextResponse.json(
        {
          error: 'Não foi possível criar o pedido.',
          details: orderErr?.message ?? null,
          code: orderErr?.code ?? null,
        },
        { status: 500 }
      );
    }

    const orderId = orderRow.id as string;

    const { error: itemsErr } = await admin.from('order_items').insert(
      lines.map((l) => ({
        order_id: orderId,
        product_id: l.product_id,
        seller_id: l.seller_id,
        title: l.title,
        quantity: l.quantity,
        unit_price: l.unit_price,
        product_subtotal_eur: l.product_subtotal,
        shipping_fee_eur: l.shipping_fee,
        line_total: l.line_total,
        buyer_fee_eur: l.buyer_fee,
      }))
    );

    if (itemsErr) {
      console.error('[create-checkout-session] order_items insert:', itemsErr);
      await admin.from('orders').delete().eq('id', orderId);
      return NextResponse.json(
        {
          error: 'Não foi possível guardar as linhas do pedido.',
          details: itemsErr?.message ?? null,
          code: itemsErr?.code ?? null,
        },
        { status: 500 }
      );
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
        line_items: lines.flatMap((l) => {
          const stripeItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
            {
              price_data: {
                currency: 'eur',
                unit_amount: Math.round(l.unit_price * 100),
                product_data: {
                  name: l.title.slice(0, 120),
                },
              },
              quantity: l.quantity,
            },
          ];
          if (l.shipping_fee > 0) {
            stripeItems.push({
              price_data: {
                currency: 'eur',
                unit_amount: Math.round(l.shipping_fee * 100),
                product_data: {
                  name: `Portes: ${l.title.slice(0, 100)}`,
                },
              },
              quantity: 1,
            });
          }
          if (l.buyer_fee > 0) {
            stripeItems.push({
              price_data: {
                currency: 'eur',
                unit_amount: Math.round(l.buyer_fee * 100),
                product_data: {
                  name: `Taxa de serviço (6% + 0,50 €): ${l.title.slice(0, 90)}`,
                },
              },
              quantity: 1,
            });
          }
          return stripeItems;
        }),
      });

      const { error: updErr } = await admin
        .from('orders')
        .update({ stripe_checkout_session_id: session.id })
        .eq('id', orderId);

      if (updErr) {
        console.error(updErr);
      }

      if (!session.url) {
        await admin.from('orders').delete().eq('id', orderId);
        return NextResponse.json({ error: 'Stripe não devolveu URL de pagamento.' }, { status: 500 });
      }

      return NextResponse.json({ url: session.url, orderId });
    } catch (e) {
      console.error(e);
      await admin.from('orders').delete().eq('id', orderId);
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
