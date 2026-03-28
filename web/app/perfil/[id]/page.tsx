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
  vacation_mode?: boolean | null;
  address?: string | null;
  updated_at?: string | null;
};

type FollowStats = {
  followers_count: number;
  following_count: number;
  is_following: boolean;
};

function getCountryFromAddress(address?: string | null) {
  const raw = (address ?? '').trim();
  if (!raw) return 'Localização não definida';
  const parts = raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : raw;
}

function formatLastSeen(dateIso?: string | null) {
  if (!dateIso) return 'Atividade recente indisponível';
  const ts = Date.parse(dateIso);
  if (Number.isNaN(ts)) return 'Atividade recente indisponível';

  const diffMs = Date.now() - ts;
  if (diffMs < 0) return 'Ativo recentemente';

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Ativo agora mesmo';
  if (minutes < 60) return `Esteve online há ${minutes} minuto${minutes === 1 ? '' : 's'}`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Esteve online há ${hours} hora${hours === 1 ? '' : 's'}`;

  const days = Math.floor(hours / 24);
  return `Esteve online há ${days} dia${days === 1 ? '' : 's'}`;
}

export default function PerfilPublicoPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [followStats, setFollowStats] = useState<FollowStats>({
    followers_count: 0,
    following_count: 0,
    is_following: false,
  });
  const [followLoading, setFollowLoading] = useState(false);

  const fetchFollowStats = async (profileId: string) => {
    const { data, error } = await supabase.rpc('get_profile_follow_stats', { p_id: profileId });
    if (error || !data || typeof data !== 'object') return;
    const raw = data as Record<string, unknown>;
    setFollowStats({
      followers_count: Number(raw.followers_count ?? 0),
      following_count: Number(raw.following_count ?? 0),
      is_following: Boolean(raw.is_following),
    });
  };

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
      await fetchFollowStats(id);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void fetchFollowStats(id);
  }, [id, user?.id]);

  const isVendedor = profile ? parseUserType(profile.user_type) === 'vendedor' : false;
  const isOwn = user?.id === id;
  const displayName = profile?.full_name?.trim() || 'Utilizador';
  const country = getCountryFromAddress(profile?.address);
  const lastSeen = formatLastSeen(profile?.updated_at);
  const isOnVacation = Boolean(profile?.vacation_mode);

  const handleToggleFollow = async () => {
    if (!id || isOwn || followLoading) return;
    setFollowLoading(true);
    const { data, error } = await supabase.rpc('toggle_profile_follow', { p_target_id: id });
    setFollowLoading(false);
    if (error || !data || typeof data !== 'object') return;
    const raw = data as Record<string, unknown>;
    if (raw.ok !== true) return;
    setFollowStats({
      followers_count: Number(raw.followers_count ?? 0),
      following_count: Number(raw.following_count ?? 0),
      is_following: Boolean(raw.is_following),
    });
  };

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
              <div className="perfil-public__main">
                <h1 className="perfil-public__name">{displayName}</h1>
                <p className="perfil-public__status">Ainda sem opiniões</p>
                {isOnVacation ? (
                  <p className="perfil-public__vacation-note">
                    Este utilizador pode demorar a responder porque está em modo férias.
                  </p>
                ) : null}
                <div className="perfil-public__meta-grid">
                  <section className="perfil-public__meta">
                    <h2>Sobre:</h2>
                    <ul>
                      <li>{country}</li>
                      <li>{lastSeen}</li>
                      <li>{followStats.followers_count} seguidores, {followStats.following_count} a seguir</li>
                    </ul>
                  </section>
                  <section className="perfil-public__meta">
                    <h2>Informações verificadas:</h2>
                    <ul>
                      <li>Google</li>
                      <li>E-mail</li>
                    </ul>
                  </section>
                </div>
              </div>
              <div className="perfil-public__side">
                {isOwn ? (
                  <Link href="/perfil" className="btn btn-secondary perfil-public__edit">
                    Editar perfil
                  </Link>
                ) : null}
                {!isOwn ? (
                  <button
                    type="button"
                    className={`btn ${followStats.is_following ? 'btn-secondary' : 'btn-primary'} perfil-public__follow`}
                    onClick={handleToggleFollow}
                    disabled={followLoading}
                  >
                    {followLoading
                      ? 'A atualizar...'
                      : followStats.is_following
                        ? 'A seguir'
                        : 'Seguir'}
                  </button>
                ) : null}
                {!isOwn && isVendedor ? (
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
