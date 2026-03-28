'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useMarketplaceLists } from '@/lib/marketplace-lists-context';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type ConfirmState = 'idle' | 'loading' | 'ok' | 'error';

function SucessoContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { refresh } = useMarketplaceLists();
  const { user } = useAuth();
  const [confirmState, setConfirmState] = useState<ConfirmState>('idle');
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!sessionId || !user?.id) return;
    let cancelled = false;
    (async () => {
      setConfirmState('loading');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        if (!cancelled) {
          setConfirmState('error');
          setConfirmMessage('Inicia sessão para registar o pedido no teu histórico.');
        }
        return;
      }
      try {
        const res = await fetch('/api/stripe/confirm-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId }),
        });
        const json = (await res.json()) as { ok?: boolean; alreadyPaid?: boolean; error?: string; reason?: string };
        if (cancelled) return;
        if (res.ok && json.ok) {
          setConfirmState('ok');
          setConfirmMessage(
            json.alreadyPaid
              ? 'O pedido já estava confirmado.'
              : 'Pedido confirmado. Já podes ver o histórico e os ficheiros digitais.'
          );
          void refresh();
        } else {
          setConfirmState('error');
          setConfirmMessage(
            json.reason === 'amount_mismatch'
              ? 'Há uma diferença no valor pago. Contacta o suporte com a referência Stripe abaixo.'
              : json.error ?? 'Não foi possível sincronizar o pedido. Se já pagaste, espera alguns minutos ou contacta o suporte.'
          );
        }
      } catch {
        if (!cancelled) {
          setConfirmState('error');
          setConfirmMessage('Erro de rede ao confirmar o pedido. Tenta recarregar a página.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- confirmar só quando session_id e utilizador estão prontos
  }, [sessionId, user?.id]);

  return (
    <>
      <h1>Pagamento recebido</h1>
      <p className="cart-success-msg">
        Obrigado pela tua compra. O pedido foi registado e os vendedores foram notificados no saldo da
        conta (área Finanças).
      </p>
      {sessionId ? (
        <p className="cart-success-ref">
          Referência Stripe: <code>{sessionId}</code>
        </p>
      ) : null}
      {sessionId && user?.id ? (
        <p className="cart-success-msg" role="status" aria-live="polite">
          {confirmState === 'loading' && <span>A confirmar o teu pedido na loja…</span>}
          {confirmState === 'ok' && confirmMessage && (
            <span className="cart-success-sync cart-success-sync--ok">{confirmMessage}</span>
          )}
          {confirmState === 'error' && confirmMessage && (
            <span className="cart-success-sync cart-success-sync--warn">{confirmMessage}</span>
          )}
        </p>
      ) : sessionId && !user?.id ? (
        <p className="cart-success-msg cart-success-sync--warn">
          Inicia sessão com a mesma conta com que pagaste para veres o pedido em «Histórico de compras» e os PDFs
          em «As minhas compras digitais».
        </p>
      ) : null}
      <p>
        <Link href="/produtos" className="btn btn-primary">
          Continuar a comprar
        </Link>
      </p>
      <p className="cart-success-links">
        <Link href="/conta/compras">Histórico de compras</Link>
        {' · '}
        <Link href="/conta/digitais">Ficheiros digitais (PDF)</Link>
        {' · '}
        <Link href="/vendedor/financas">Finanças (vendedor)</Link>
      </p>
    </>
  );
}

export default function CarrinhoSucessoPage() {
  return (
    <div className="page">
      <Header />
      <main className="main">
        <Suspense fallback={<p className="loading">A carregar…</p>}>
          <SucessoContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
