'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SellerListingPolicy } from '@/components/SellerListingPolicy';
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
            <p>Para publicar anúncios e vender no TerraPlace precisa de uma conta de <strong>Vendedor</strong>. A sua conta atual é de utilizador comum (apenas compras).</p>
            <p className="auth-subtitle">
              <Link href="/vender/politica">Ver a política para vendedores (taxas)</Link> — informação pública antes de ativar a conta de vendedor.
            </p>
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
        <h1>Vender no TerraPlace</h1>
        <p className="vender-intro">
          Cria o teu anúncio na área de vendedor. Antes de publicares, lê a política de taxas abaixo; ao
          submeteres um produto novo ou ao guardares alterações a um anúncio, confirmas que a aceitas.
        </p>
        <p>
          <Link href="/vendedor/produtos/novo" className="btn btn-primary">
            Novo produto
          </Link>{' '}
          <Link href="/vendedor/produtos" className="btn btn-secondary">
            Meus produtos
          </Link>{' '}
          <Link href="/vendedor/guia" className="btn btn-secondary">
            Guia (portes e taxas)
          </Link>
        </p>
        <p className="auth-subtitle" style={{ marginTop: '0.5rem' }}>
          A mesma política está disponível publicamente em{' '}
          <Link href="/vender/politica">Política para vendedores</Link> (partilhável com compradores).
        </p>
        <div className="auth-card" style={{ maxWidth: 720, marginTop: '1.5rem' }}>
          <SellerListingPolicy />
        </div>
        <p style={{ marginTop: '1rem' }}>
          <Link href="/produtos">Ver produtos na loja</Link>
        </p>
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
