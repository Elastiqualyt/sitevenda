'use client';

import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useMarketplaceLists } from '@/lib/marketplace-lists-context';

function SucessoContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { refresh } = useMarketplaceLists();

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
      <p>
        <Link href="/produtos" className="btn btn-primary">
          Continuar a comprar
        </Link>
      </p>
      <p>
        <Link href="/vendedor/financas">Ver finanças (vendedor)</Link>
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
