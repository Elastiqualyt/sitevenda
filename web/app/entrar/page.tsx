'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

function EntrarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message === 'Invalid login credentials' ? 'Email ou palavra-passe incorretos.' : err.message);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <div className="page">
      <Header />
      <main className="main auth-page">
        <div className="auth-card">
          <h1>Iniciar sessão</h1>
          <p className="auth-subtitle">Acede à tua conta para comprar ou vender.</p>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <p className="auth-error">{error}</p>}
            <label className="auth-label">
              Email
              <input
                type="email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="o-teu@email.com"
                required
                autoComplete="email"
              />
            </label>
            <label className="auth-label">
              Palavra-passe
              <input
                type="password"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </label>
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'A entrar...' : 'Entrar'}
            </button>
          </form>

          <p className="auth-footer">
            Ainda não tens conta? <Link href={redirectTo === '/vender' ? '/registar?tipo=vendedor' : '/registar'}>Criar conta</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function EntrarPage() {
  return (
    <Suspense fallback={
      <div className="page">
        <Header />
        <main className="main auth-page"><p className="loading">A carregar...</p></main>
        <Footer />
      </div>
    }>
      <EntrarForm />
    </Suspense>
  );
}
