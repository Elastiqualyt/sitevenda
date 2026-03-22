'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function ContaOverviewPage() {
  const { profile } = useAuth();
  const bal = Number(profile?.balance ?? 0);
  const isVendedor = profile?.user_type === 'vendedor';

  return (
    <div className="vendedor-page">
      <h1>Visão geral</h1>
      <p className="auth-subtitle">
        {isVendedor
          ? 'Geres aqui o teu saldo, vês compras pagas, descarregas digitais e acedes às conversas com vendedores.'
          : 'Vês compras pagas, descarregas digitais e acedes às conversas com vendedores.'}
      </p>

      <div className="conta-dashboard-grid">
        {isVendedor && (
          <Link href="/conta/saldo" className="conta-dash-card">
            <h2>Saldo</h2>
            <p className="conta-dash-card__value">{bal.toFixed(2)} €</p>
            <span className="conta-dash-card__cta">Carregar saldo e movimentos →</span>
          </Link>
        )}
        <Link href="/conta/compras" className="conta-dash-card">
          <h2>Compras</h2>
          <p className="conta-dash-card__desc">Histórico de pedidos pagos (Stripe)</p>
          <span className="conta-dash-card__cta">Ver compras →</span>
        </Link>
        <Link href="/conta/digitais" className="conta-dash-card">
          <h2>Ficheiros digitais</h2>
          <p className="conta-dash-card__desc">PDFs e artigos digitais que compraste</p>
          <span className="conta-dash-card__cta">Ver downloads →</span>
        </Link>
        <Link href="/mensagens" className="conta-dash-card">
          <h2>Conversas</h2>
          <p className="conta-dash-card__desc">Chat com vendedores</p>
          <span className="conta-dash-card__cta">Abrir mensagens →</span>
        </Link>
      </div>

      <p className="conta-footnote">
        <Link href="/perfil">Definições do perfil</Link>
        {' · '}
        <Link href="/">Início</Link>
      </p>
    </div>
  );
}
