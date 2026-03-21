'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useMarketplaceLists } from '@/lib/marketplace-lists-context';

interface Product {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
}

function CarrinhoContent() {
  const searchParams = useSearchParams();
  const cancelled = searchParams.get('cancelled') === '1';
  const { user } = useAuth();
  const { ready, cartByProductId, setCartQuantity, removeFromCart } = useMarketplaceLists();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  const idsKey = useMemo(
    () =>
      Array.from(cartByProductId.keys())
        .sort()
        .join(','),
    [cartByProductId]
  );

  useEffect(() => {
    if (!ready) return;
    const ids = idsKey ? idsKey.split(',').filter(Boolean) : [];
    if (!ids.length) {
      setProducts([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?ids=${encodeURIComponent(ids.join(','))}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        if (!cancelled) setProducts(list as Product[]);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, idsKey]);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const cartIds = useMemo(
    () =>
      Array.from(cartByProductId.keys()).filter((id) => (cartByProductId.get(id) ?? 0) > 0),
    [cartByProductId]
  );

  const lines = useMemo(() => {
    return cartIds
      .map((id) => {
        const p = byId.get(id);
        const qty = cartByProductId.get(id) ?? 0;
        if (!p || qty < 1) return null;
        const line = Number(p.price) * qty;
        return { product: p, qty, line };
      })
      .filter((x): x is { product: Product; qty: number; line: number } => x !== null);
  }, [cartIds, byId, cartByProductId]);

  const total = useMemo(() => lines.reduce((s, l) => s + l.line, 0), [lines]);

  const payWithStripe = async () => {
    setCheckoutError('');
    if (!user?.id || !lines.length) return;
    setCheckoutLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setCheckoutError('Sessão expirada. Inicia sessão de novo.');
        setCheckoutLoading(false);
        return;
      }
      const items = lines.map((l) => ({ productId: l.product.id, quantity: l.qty }));
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setCheckoutError(data.error ?? 'Não foi possível iniciar o pagamento.');
        setCheckoutLoading(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setCheckoutError('Resposta inválida do servidor.');
    } catch {
      setCheckoutError('Erro de rede. Tenta de novo.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="page">
      <Header />
      <main className="main">
        <h1>Carrinho de compras</h1>

        {cancelled ? (
          <p className="auth-error" role="status">
            Pagamento cancelado. O teu carrinho mantém-se; podes tentar outra vez quando quiseres.
          </p>
        ) : null}

        {!ready || loading ? (
          <p className="loading">A carregar...</p>
        ) : lines.length === 0 ? (
          <p className="empty">
            O teu carrinho está vazio.{' '}
            <Link href="/produtos">Continuar a comprar</Link>
          </p>
        ) : (
          <>
            <ul className="cart-list">
              {lines.map(({ product: p, qty, line }) => (
                <li key={p.id} className="cart-row">
                  <Link href={`/produtos/${p.id}`} className="cart-row__img">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" />
                    ) : (
                      <span className="product-placeholder">📦</span>
                    )}
                  </Link>
                  <div className="cart-row__info">
                    <Link href={`/produtos/${p.id}`} className="cart-row__title">
                      {p.title}
                    </Link>
                    <p className="cart-row__unit">{Number(p.price).toFixed(2)} € / un.</p>
                  </div>
                  <div className="cart-row__qty">
                    <label htmlFor={`qty-${p.id}`} className="visually-hidden">
                      Quantidade
                    </label>
                    <input
                      id={`qty-${p.id}`}
                      type="number"
                      min={1}
                      max={99}
                      value={qty}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10);
                        if (Number.isFinite(n)) void setCartQuantity(p.id, n);
                      }}
                      className="cart-row__qty-input"
                    />
                  </div>
                  <p className="cart-row__line">{line.toFixed(2)} €</p>
                  <button
                    type="button"
                    className="cart-row__remove"
                    onClick={() => void removeFromCart(p.id)}
                    aria-label={`Remover ${p.title}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <div className="cart-total">
              <span>Total</span>
              <strong>{total.toFixed(2)} €</strong>
            </div>

            {user ? (
              <div className="cart-checkout-block">
                <button
                  type="button"
                  className="btn btn-primary cart-checkout-stripe"
                  disabled={checkoutLoading || total < 0.5}
                  onClick={() => void payWithStripe()}
                >
                  {checkoutLoading ? 'A redirecionar para o Stripe…' : 'Pagar com cartão (Stripe)'}
                </button>
                {total < 0.5 ? (
                  <p className="cart-note">O valor mínimo para pagamento com cartão é 0,50 €.</p>
                ) : null}
                {checkoutError ? <p className="auth-error">{checkoutError}</p> : null}
              </div>
            ) : (
              <p className="cart-note">
                <Link href={`/entrar?redirect=/carrinho`}>Inicia sessão</Link> para pagar com cartão (Stripe).
              </p>
            )}

            <p className="cart-note">
              Pagamento seguro via Stripe. Após o pagamento, o saldo dos vendedores é atualizado; para
              combinar envio ou levantamento contacta o vendedor em Mensagens.
            </p>
            <Link href="/produtos" className="btn btn-secondary">
              Continuar a comprar
            </Link>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function CarrinhoPage() {
  return (
    <Suspense
      fallback={
        <div className="page">
          <Header />
          <main className="main">
            <p className="loading">A carregar…</p>
          </main>
          <Footer />
        </div>
      }
    >
      <CarrinhoContent />
    </Suspense>
  );
}
