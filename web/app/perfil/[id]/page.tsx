'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { parseUserType } from '@/lib/user-type';

type PublicProfile = {
  full_name: string | null;
  avatar_url: string | null;
  user_type: string | null;
};

export default function PerfilPublicoPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_seller_public', { p_id: id });
      if (cancelled) return;
      setLoading(false);
      if (error || data == null) {
        setNotFound(true);
        setProfile(null);
        return;
      }
      setNotFound(false);
      setProfile(data as PublicProfile);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const isVendedor = profile ? parseUserType(profile.user_type) === 'vendedor' : false;
  const isOwn = user?.id === id;
  const displayName = profile?.full_name?.trim() || 'Utilizador';

  return (
    <div className="page">
      <Header />
      <main className="main perfil-public">
        <p className="perfil-public__back">
          <Link href="/produtos">← Voltar</Link>
        </p>
        {loading ? (
          <p className="loading">A carregar perfil…</p>
        ) : notFound || !profile ? (
          <p>Perfil não encontrado.</p>
        ) : (
          <>
            <header className="perfil-public__header">
              <div className="perfil-public__avatar" aria-hidden>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" />
                ) : (
                  <span className="perfil-public__avatar-placeholder">{displayName.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h1 className="perfil-public__name">{displayName}</h1>
                <p className="perfil-public__badge">{isVendedor ? 'Vendedor' : 'Comprador'}</p>
                {isOwn ? (
                  <Link href="/perfil" className="btn btn-secondary perfil-public__edit">
                    Editar o meu perfil
                  </Link>
                ) : null}
                {isVendedor ? (
                  <p className="perfil-public__actions">
                    <Link href={`/loja/${id}`} className="btn btn-primary">
                      Ver loja e produtos
                    </Link>
                  </p>
                ) : null}
              </div>
            </header>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
