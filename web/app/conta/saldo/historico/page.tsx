'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { BalanceTransaction } from '@/lib/types';

function balanceLabel(type: string) {
  switch (type) {
    case 'deposit':
      return 'Depósito';
    case 'withdrawal':
      return 'Saque';
    case 'sale':
      return 'Venda';
    case 'purchase':
      return 'Compra';
    case 'listing_fee':
      return 'Registo antigo';
    default:
      return type;
  }
}

function formatTxAmount(type: string, amount: number) {
  const n = Number(amount);
  if (type === 'listing_fee' || type === 'withdrawal') {
    return `−${n.toFixed(2).replace('.', ',')} €`;
  }
  return `${n.toFixed(2).replace('.', ',')} €`;
}

export default function ContaSaldoHistoricoPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    if (profile.user_type !== 'vendedor') router.replace('/conta');
  }, [profile, router]);

  useEffect(() => {
    if (!user?.id || authLoading) return;
    if (!profile || profile.user_type !== 'vendedor') {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data } = await supabase
          .from('balance_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(80);
        setTransactions((data as BalanceTransaction[]) ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, profile, authLoading]);

  if (!profile || profile.user_type !== 'vendedor') {
    return null;
  }

  return (
    <div className="conta-saldo-pages">
      <div className="conta-saldo-panel">
        <h2 className="conta-saldo-panel__title">Histórico de pagamentos</h2>
        <p className="conta-saldo-panel__muted">Movimentos recentes do teu saldo interno.</p>

        {loading ? (
          <p className="loading">A carregar…</p>
        ) : transactions.length === 0 ? (
          <p className="conta-saldo-panel__muted">Ainda não há movimentos.</p>
        ) : (
          <div className="vendedor-table-wrap conta-saldo-table-wrap">
            <table className="vendedor-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Estado</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.created_at).toLocaleString('pt-PT')}</td>
                    <td>{balanceLabel(tx.type)}</td>
                    <td>{formatTxAmount(tx.type, tx.amount)}</td>
                    <td>{tx.status}</td>
                    <td className="vendedor-table__subcats">{tx.reference ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
