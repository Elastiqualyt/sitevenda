'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';

function VenderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/vender';
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/entrar?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    if (profile && profile.user_type !== 'vendedor') {
      // Não redirecionar; mostrar mensagem em baixo
    }
  }, [user, profile, loading, router, redirect]);

  if (loading) {
    return (
      <div className="page">
        <Header />
        <main className="main">
          <p className="loading">A carregar...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (profile && profile.user_type !== 'vendedor') {
    return (
      <div className="page">
        <Header />
        <main className="main">
          <div className="auth-card auth-card--success">
            <h1>Conta de vendedor necessária</h1>
            <p>Para publicar anúncios e vender no Marketplace precisa de uma conta de <strong>Vendedor</strong>. A sua conta atual é de utilizador comum (apenas compras).</p>
            <p>
              <Link href="/produtos" className="btn btn-secondary">Ver produtos</Link>
              {' '}
              <Link href="/">Voltar ao início</Link>
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page">
      <Header />
      <main className="main">
        <h1>Vender no Marketplace</h1>
        <p>Página para criar anúncios (formulário de produto) em breve.</p>
        <p><Link href="/produtos">Ver produtos</Link></p>
      </main>
      <Footer />
    </div>
  );
}

export default function VenderPage() {
  return (
    <Suspense fallback={
      <div className="page">
        <Header />
        <main className="main"><p className="loading">A carregar...</p></main>
        <Footer />
      </div>
    }>
      <VenderContent />
    </Suspense>
  );
}
