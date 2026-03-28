'use client';

import { ContaPedidosPanel } from '@/components/ContaPedidosPanel';
import { useAuth } from '@/lib/auth-context';

export default function ContaComprasPage() {
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
      <ContaPedidosPanel scope="comprados" userId={user.id} />
    </div>
  );
}
