'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { BalanceTransaction } from '@/lib/types';

export default function ContaSaldoPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentBalance, setCurrentBalance] = useState<number>(profile?.balance ?? 0);

  useEffect(() => {
    setCurrentBalance(profile?.balance ?? 0);
  }, [profile?.balance]);

  useEffect(() => {
    if (authLoading) return;
    if (profile && profile.user_type !== 'vendedor') {
      router.replace('/conta');
    }
  }, [authLoading, profile, router]);

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

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      setMessage('Indica um valor válido.');
      return;
    }
    if (amount > currentBalance) {
      setMessage('Saldo insuficiente.');
      return;
    }
    setBalanceLoading(true);
    setMessage('');
    const { data } = await supabase.rpc('withdraw_balance', { amount_arg: amount });
    setBalanceLoading(false);
    if (data?.ok) {
      setWithdrawAmount('');
      setCurrentBalance(data.balance);
      setMessage('Saque registado.');
      const { data: tx } = await supabase
        .from('balance_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (tx) setTransactions((t) => [tx as BalanceTransaction, ...t]);
      await refreshProfile();
    } else {
      setMessage(data?.error === 'insufficient' ? 'Saldo insuficiente.' : 'Erro ao sacar.');
    }
  };

  if (authLoading || !profile) {
    return (
      <div className="vendedor-page">
        <p className="loading">A carregar...</p>
      </div>
    );
  }

  if (profile.user_type !== 'vendedor') {
    return (
      <div className="vendedor-page">
        <p className="loading">A redirecionar...</p>
      </div>
    );
  }

  const balanceLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Depósito';
      case 'withdrawal':
        return 'Saque';
      case 'sale':
        return 'Venda';
      case 'purchase':
        return 'Compra';
      default:
        return type;
    }
  };

  return (
    <div className="vendedor-page">
      <h1>Saldo</h1>
      <p className="auth-subtitle">
        O saldo interno pode ser usado em funcionalidades futuras; as compras com cartão são registadas como
        movimento &quot;Compra&quot;.
      </p>

      <div className="financas-balance-card">
        <h2>Saldo disponível</h2>
        <p className="financas-balance-value">{Number(currentBalance).toFixed(2)} €</p>
      </div>

      <div className="financas-actions">
        <div className="auth-card financas-form-card">
          <h3>Sacar saldo</h3>
          <p className="auth-subtitle">Regista um pedido de levantamento do saldo interno.</p>
          <form onSubmit={handleWithdraw} className="auth-form">
            <label className="auth-label">
              Valor (€)
              <input
                type="text"
                className="auth-input"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
              />
            </label>
            <button type="submit" className="btn btn-secondary" disabled={balanceLoading}>
              {balanceLoading ? 'A processar...' : 'Sacar'}
            </button>
          </form>
        </div>
      </div>

      {message && (
        <p className={message.startsWith('Erro') || message.includes('insuficiente') ? 'auth-error' : 'auth-success'}>
          {message}
        </p>
      )}

      <h3>Histórico de movimentos</h3>
      {loading ? (
        <p className="loading">A carregar...</p>
      ) : transactions.length === 0 ? (
        <p className="empty">Ainda não há movimentos.</p>
      ) : (
        <div className="vendedor-table-wrap">
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
                  <td>{Number(tx.amount).toFixed(2)} €</td>
                  <td>{tx.status}</td>
                  <td className="vendedor-table__subcats">{tx.reference ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
