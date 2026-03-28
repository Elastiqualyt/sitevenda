'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export default function ContaSaldoConfigurarPage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentBalance, setCurrentBalance] = useState<number>(profile?.balance ?? 0);

  useEffect(() => {
    setCurrentBalance(profile?.balance ?? 0);
  }, [profile?.balance]);

  useEffect(() => {
    if (!profile) return;
    if (profile.user_type !== 'vendedor') router.replace('/conta');
  }, [profile, router]);

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
      await refreshProfile();
    } else {
      setMessage(data?.error === 'insufficient' ? 'Saldo insuficiente.' : 'Erro ao sacar.');
    }
  };

  if (!profile || profile.user_type !== 'vendedor') {
    return null;
  }

  return (
    <div className="conta-saldo-pages">
      <div className="conta-saldo-panel">
        <p className="conta-saldo-panel__lead">
          Saldo disponível: <strong>{Number(currentBalance).toFixed(2).replace('.', ',')} €</strong>
        </p>

        <form onSubmit={handleWithdraw} className="auth-form conta-saldo-form">
          <label className="auth-label">
            Valor a sacar (€)
            <input
              type="text"
              className="auth-input"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0,00"
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={balanceLoading}>
            {balanceLoading ? 'A processar…' : 'Levantar Saldo'}
          </button>
        </form>

        {message ? (
          <p
            className={
              message.startsWith('Erro') || message.includes('insuficiente') || message.includes('válido')
                ? 'auth-error'
                : 'auth-success'
            }
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
