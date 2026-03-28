'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

function navClass(active: boolean, indent?: boolean) {
  return `conta-saldo-nav__link${indent ? ' conta-saldo-nav__link--indent' : ''}${
    active ? ' conta-saldo-nav__link--active' : ''
  }`;
}

export default function ContaSaldoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!profile || profile.user_type !== 'vendedor') {
      router.replace('/conta');
    }
  }, [loading, profile, router]);

  if (loading || !profile) {
    return (
      <main className="main conta-saldo-shell conta-saldo-shell--loading">
        <p className="loading">A carregar...</p>
      </main>
    );
  }

  if (profile.user_type !== 'vendedor') {
    return (
      <main className="main conta-saldo-shell conta-saldo-shell--loading">
        <p className="loading">A redirecionar...</p>
      </main>
    );
  }

  const onSaldoIndex = pathname === '/conta/saldo' || pathname === '/conta/saldo/configurar';
  const onHistorico = pathname === '/conta/saldo/historico';
  const onFaturas = pathname === '/conta/saldo/faturas';

  return (
    <div className="conta-saldo-shell">
      <aside className="conta-saldo-sidebar" aria-label="Navegação do saldo">
        <h1 className="conta-saldo-sidebar__title">Saldo</h1>
        <nav className="conta-saldo-nav">
          <p className="conta-saldo-nav__group">O meu saldo</p>
          <Link href="/conta/saldo" className={navClass(onSaldoIndex, true)}>
            Saldo
          </Link>
          <Link href="/conta/saldo/historico" className={navClass(onHistorico)}>
            Histórico de pagamentos
          </Link>
          <Link href="/conta/saldo/faturas" className={navClass(onFaturas)}>
            Faturas
          </Link>
        </nav>
      </aside>
      <div className="conta-saldo-main">{children}</div>
    </div>
  );
}
