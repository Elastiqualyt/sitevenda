'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { BalanceTransaction } from '@/lib/types';

export default function VendedorFinancasPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('balance_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        setTransactions((data as BalanceTransaction[]) ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const [currentBalance, setCurrentBalance] = useState<number>(profile?.balance ?? 0);
  useEffect(() => {
    setCurrentBalance(profile?.balance ?? 0);
  }, [profile?.balance]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      setMessage('Indica um valor válido.');
      return;
    }
    setBalanceLoading(true);
    setMessage('');
    const { data } = await supabase.rpc('add_balance', { amount_arg: amount });
    setBalanceLoading(false);
    if (data?.ok) {
      setDepositAmount('');
      setCurrentBalance(data.balance);
      setMessage('Saldo adicionado.');
      const { data: tx } = await supabase.from('balance_transactions').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(1).single();
      if (tx) setTransactions((t) => [tx as BalanceTransaction, ...t]);
      await refreshProfile();
    } else {
      setMessage(data?.error === 'invalid' ? 'Valor inválido.' : 'Erro ao adicionar.');
    }
  };

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
      const { data: tx } = await supabase.from('balance_transactions').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(1).single();
      if (tx) setTransactions((t) => [tx as BalanceTransaction, ...t]);
      await refreshProfile();
    } else {
      setMessage(data?.error === 'insufficient' ? 'Saldo insuficiente.' : 'Erro ao sacar.');
    }
  };

  const balanceLabel = (type: string) => {
    switch (type) {
      case 'deposit': return 'Depósito';
      case 'withdrawal': return 'Saque';
      case 'sale': return 'Venda';
      case 'purchase': return 'Compra';
      default: return type;
    }
  };

  return (
    <div className="vendedor-page">
      <h1>Finanças</h1>

      <div className="financas-balance-card">
        <h2>Saldo disponível</h2>
        <p className="financas-balance-value">{Number(currentBalance).toFixed(2)} €</p>
      </div>

      <div className="financas-actions">
        <div className="auth-card financas-form-card">
          <h3>Adicionar saldo</h3>
          <p className="auth-subtitle">Para compras ou para manter saldo na conta.</p>
          <form onSubmit={handleDeposit} className="auth-form">
            <label className="auth-label">
              Valor (€)
              <input
                type="text"
                className="auth-input"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.00"
              />
            </label>
            <button type="submit" className="btn btn-primary" disabled={balanceLoading}>
              {balanceLoading ? 'A processar...' : 'Adicionar'}
            </button>
          </form>
        </div>
        <div className="auth-card financas-form-card">
          <h3>Sacar saldo</h3>
          <p className="auth-subtitle">Transferir o teu saldo para a tua conta bancária.</p>
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

      {message && <p className="auth-error">{message}</p>}

      <h3>Movimentos</h3>
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
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{new Date(tx.created_at).toLocaleString('pt-PT')}</td>
                  <td>{balanceLabel(tx.type)}</td>
                  <td>{Number(tx.amount).toFixed(2)} €</td>
                  <td>{tx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
