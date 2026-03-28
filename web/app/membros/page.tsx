'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

type MemberRow = { id: string; full_name: string | null; avatar_url: string | null };

function MembrosResults() {
  const searchParams = useSearchParams();
  const q = (searchParams.get('q') ?? '').trim();
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (q.length < 2) {
      setRows([]);
      setError('');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    void fetch(`/api/profiles/search?${new URLSearchParams({ q, limit: '48' })}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Erro ao carregar');
        return data as MemberRow[];
      })
      .then((list) => {
        if (!cancelled) setRows(Array.isArray(list) ? list : []);
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setRows([]);
          setError(e.message || 'Erro ao carregar');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q]);

  if (q.length < 2) {
    return (
      <p className="empty">
        Usa a pesquisa no topo do site, escolhe <strong>Membro</strong> e escreve pelo menos duas letras do nome.
      </p>
    );
  }

  if (loading) {
    return <p className="loading">A procurar membros…</p>;
  }

  if (error) {
    return <p className="auth-error">{error}</p>;
  }

  if (rows.length === 0) {
    return (
      <p className="empty">
        Nenhum membro encontrado para «{q}». Tenta outras palavras ou verifica a ortografia.
      </p>
    );
  }

  return (
    <ul className="membros-list">
      {rows.map((m) => {
        const name = m.full_name?.trim() || 'Membro';
        return (
          <li key={m.id}>
            <Link href={`/perfil/${m.id}`} className="membros-card">
              {m.avatar_url ? (
                <img src={m.avatar_url} alt="" className="membros-card__avatar" width={48} height={48} />
              ) : (
                <span className="membros-card__avatar membros-card__avatar--placeholder" aria-hidden>
                  👤
                </span>
              )}
              <span className="membros-card__name">{name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function MembrosPage() {
  return (
    <div className="page">
      <Header />
      <main className="main membros-page">
        <h1>Membros</h1>
        <p className="membros-page__hint">
          Resultados da pesquisa por nome. Para mudar o termo, usa a barra no topo (tipo <strong>Membro</strong>).
        </p>
        <Suspense fallback={<p className="loading">A carregar…</p>}>
          <MembrosResults />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
