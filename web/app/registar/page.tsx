'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

function RegistarForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('As palavras-passe não coincidem.');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          user_type: 'vendedor',
        },
      },
    });
    setLoading(false);
    if (err) {
      setError(err.message === 'User already registered' ? 'Já existe uma conta com este email.' : err.message);
      return;
    }
    setSuccess(true);
    router.refresh();
  };

  if (success) {
    return (
      <div className="page">
        <Header />
        <main className="main auth-page">
          <div className="auth-card auth-card--success">
            <h1>Conta criada</h1>
            <p>Enviamos um link de confirmação para <strong>{email}</strong>. Abre o email e clica no link para ativar a conta.</p>
            <p><Link href="/entrar" className="btn btn-primary">Ir para iniciar sessão</Link></p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page">
      <Header />
      <main className="main auth-page">
        <div className="auth-card">
          <h1>Criar conta</h1>
          <p className="auth-subtitle">Cria a tua conta para comprar e vender.</p>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <p className="auth-error">{error}</p>}

            <label className="auth-label">
              Nome
              <input
                type="text"
                className="auth-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="O teu nome"
                autoComplete="name"
              />
            </label>
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
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </label>
            <label className="auth-label">
              Confirmar palavra-passe
              <input
                type="password"
                className="auth-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repete a palavra-passe"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </label>
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'A criar conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="auth-footer">
            Já tens conta? <Link href="/entrar">Iniciar sessão</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function RegistarPage() {
  return <RegistarForm />;
}
