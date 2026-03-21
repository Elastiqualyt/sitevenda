'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';

const NAV = [
  { href: '/conta', label: 'Visão geral' },
  { href: '/conta/saldo', label: 'Saldo' },
  { href: '/conta/compras', label: 'Compras' },
  { href: '/conta/digitais', label: 'Ficheiros digitais' },
  { href: '/mensagens', label: 'Conversas (chat)' },
];

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/entrar?redirect=/conta');
    }
  }, [user, loading, router]);

  if (loading || !user) {
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

  return (
    <div className="page">
      <Header />
      <div className="vendedor-layout conta-layout">
        <aside className="vendedor-sidebar">
          <h2 className="vendedor-sidebar__title">Área da conta</h2>
          <p className="conta-sidebar__hint">Compras, saldo e ficheiros digitais</p>
          <nav className="vendedor-nav">
            {NAV.map((item) => {
              const active =
                item.href === '/conta'
                  ? pathname === '/conta'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`vendedor-nav__link ${active ? 'vendedor-nav__link--active' : ''}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Link href="/perfil" className="conta-sidebar__perfil">
            Editar perfil e dados
          </Link>
        </aside>
        <main className="vendedor-main">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
