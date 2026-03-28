'use client';

import { ContaPedidosPanel } from '@/components/ContaPedidosPanel';
import { useAuth } from '@/lib/auth-context';

export default function ContaComprasVendidosPage() {
  const { user } = useAuth();

  if (!user?.id) {
    return (
      <div className="conta-pedidos-page-inner">
        <p className="loading">A carregar…</p>
      </div>
    );
  }

  return (
    <div className="conta-pedidos-page-inner">
      <ContaPedidosPanel scope="vendidos" userId={user.id} />
    </div>
  );
}
