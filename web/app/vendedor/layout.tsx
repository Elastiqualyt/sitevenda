'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';

const NAV = [
  { href: '/vendedor/produtos', label: 'Meus produtos' },
  { href: '/vendedor/mensagens', label: 'Mensagens' },
  { href: '/vendedor/financas', label: 'Finanças' },
];

export default function VendedorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/entrar?redirect=/vendedor');
      return;
    }
    if (profile && profile.user_type !== 'vendedor') {
      router.replace('/');
    }
  }, [user, profile, loading, router]);

  if (loading || !user || (profile && profile.user_type !== 'vendedor')) {
    return (
      <div className="page">
        <Header />
        <main className="main"><p className="loading">A carregar...</p></main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page">
      <Header />
      <div className="vendedor-layout">
        <aside className="vendedor-sidebar">
          <h2 className="vendedor-sidebar__title">Área do vendedor</h2>
          <nav className="vendedor-nav">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`vendedor-nav__link ${pathname.startsWith(item.href) ? 'vendedor-nav__link--active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="vendedor-main">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
