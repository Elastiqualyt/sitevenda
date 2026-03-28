'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function navLinkClass(active: boolean) {
  return `conta-pedidos-nav__link${active ? ' conta-pedidos-nav__link--active' : ''}`;
}

export default function ContaComprasLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const onComprados = pathname === '/conta/compras';
  const onVendidos = pathname === '/conta/compras/vendidos';

  return (
    <div className="conta-pedidos-shell">
      <aside className="conta-pedidos-sidebar" aria-label="Os meus pedidos">
        <h1 className="conta-pedidos-sidebar__title">Os meus pedidos</h1>
        <nav className="conta-pedidos-nav">
          <Link href="/conta/compras/vendidos" className={navLinkClass(onVendidos)}>
            Vendidos
          </Link>
          <Link href="/conta/compras" className={navLinkClass(onComprados)}>
            Comprados
          </Link>
        </nav>
      </aside>
      <div className="conta-pedidos-main">{children}</div>
    </div>
  );
}
