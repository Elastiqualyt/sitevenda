'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

function formatMonthYearPt(d: Date) {
  return d.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
}

export default function ContaSaldoOverviewPage() {
  const { profile } = useAuth();
  const [monthLabel, setMonthLabel] = useState('');

  useEffect(() => {
    setMonthLabel(formatMonthYearPt(new Date()));
  }, []);

  const available = Number(profile?.balance ?? 0);
  const pending = 0;

  return (
    <div className="conta-saldo-pages">
      <article className="conta-saldo-card conta-saldo-card--balance">
        <header className="conta-saldo-card__month">{monthLabel}</header>
        <div className="conta-saldo-card__row conta-saldo-card__row--pending">
          <span className="conta-saldo-card__label">Saldo pendente</span>
          <span className="conta-saldo-card__pending-right">
            <span className="conta-saldo-card__amount conta-saldo-card__amount--muted">
              {pending.toFixed(2).replace('.', ',')} €
            </span>
            <span
              className="conta-saldo-info"
              title="Valores de vendas em processo podem aparecer aqui como pendente quando estiver disponível."
              aria-label="Informação sobre saldo pendente"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </span>
          </span>
        </div>
        <div className="conta-saldo-card__row conta-saldo-card__row--available">
          <div>
            <p className="conta-saldo-card__big">{available.toFixed(2).replace('.', ',')} €</p>
            <p className="conta-saldo-card__sub">Saldo disponível</p>
          </div>
          <Link href="/conta/saldo/configurar" className="btn btn-primary conta-saldo-card__cta">
            Levantar Saldo
          </Link>
        </div>
      </article>

      <p className="conta-saldo-footnote">
        O saldo interno reflete vendas e movimentos na plataforma. Para rever movimentos, consulta o{' '}
        <Link href="/conta/saldo/historico">Histórico de pagamentos</Link>.
      </p>
    </div>
  );
}
