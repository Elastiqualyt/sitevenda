'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function ContaSaldoFaturasPage() {
  const router = useRouter();
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile) return;
    if (profile.user_type !== 'vendedor') router.replace('/conta');
  }, [profile, router]);

  if (!profile || profile.user_type !== 'vendedor') {
    return null;
  }

  return (
    <div className="conta-saldo-pages">
      <div className="conta-saldo-panel">
        <h2 className="conta-saldo-panel__title">Faturas</h2>
        <p className="conta-saldo-panel__muted">
          Aqui poderás consultar e descarregar faturas relacionadas com o teu saldo e atividade na plataforma. Esta
          secção será preenchida quando a emissão de faturas estiver disponível.
        </p>
      </div>
    </div>
  );
}
