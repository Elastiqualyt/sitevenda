'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import { CATEGORIES } from '@/lib/categories';
import { useAuth } from '@/lib/auth-context';
import { useMarketplaceLists } from '@/lib/marketplace-lists-context';
import { supabase } from '@/lib/supabase';

const SECONDARY_LINKS = [
  { href: '/produtos?categoria=lazer', label: 'Presentes', icon: '🎁' },
  { href: '/produtos', label: 'Destaques' },
  { href: '/produtos?categoria=moveis-casa-e-jardim', label: 'Favoritos para a casa' },
  { href: '/produtos?categoria=moda', label: 'Achados de moda' },
  { href: '/produtos?tipo=reutilizados', label: 'Vintage' },
  { href: '/produtos', label: 'Lista de presentes' },
  { href: '/produtos', label: 'Cartões oferta' },
];

export default function Header() {
  const router = useRouter();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { favoritesCount, cartQtyTotal } = useMarketplaceLists();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [userMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false);
      }
    };
    if (categoriesOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [categoriesOpen]);

  const displayName = profile?.full_name?.trim() || user?.email || 'Conta';

  const fetchUnreadMessages = useCallback(async () => {
    if (!user?.id) {
      setUnreadMessages(0);
      return;
    }
    const { data, error } = await supabase.rpc('unread_message_count');
    if (error) return;
    const n = typeof data === 'number' ? data : data != null ? Number(data) : 0;
    if (Number.isFinite(n)) setUnreadMessages(Math.min(999, Math.max(0, n)));
  }, [user?.id]);

  useEffect(() => {
    void fetchUnreadMessages();
  }, [fetchUnreadMessages]);

  useEffect(() => {
    const onRefresh = () => void fetchUnreadMessages();
    window.addEventListener('marketplace-unread-refresh', onRefresh);
    window.addEventListener('focus', onRefresh);
    const interval = window.setInterval(() => void fetchUnreadMessages(), 25000);
    return () => {
      window.removeEventListener('marketplace-unread-refresh', onRefresh);
      window.removeEventListener('focus', onRefresh);
      window.clearInterval(interval);
    };
  }, [fetchUnreadMessages]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/produtos?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/produtos');
    }
  };

  return (
    <header className="site-header">
      <div className="site-header__row site-header__row--main">
        <div className="site-header__left">
          <Link href="/" className="site-header__logo">
            <Image
              src="/images/icon-512x512.png"
              alt="Marketplace"
              width={40}
              height={40}
              className="site-header__logo-img"
              priority
            />
          </Link>
          <div className="site-header__categories-wrap" ref={categoriesRef}>
            <button
              type="button"
              className="site-header__categories-btn"
              aria-haspopup="true"
              aria-expanded={categoriesOpen}
              onClick={(e) => {
                e.stopPropagation();
                setCategoriesOpen((v) => !v);
              }}
            >
              <span className="site-header__categories-icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" fill="currentColor">
                  <rect x="2" y="3" width="14" height="2" />
                  <rect x="2" y="8" width="14" height="2" />
                  <rect x="2" y="13" width="14" height="2" />
                </svg>
              </span>
              Categorias
            </button>
            {categoriesOpen && (
              <div className="site-header__categories-dropdown">
                <div className="site-header__categories-dropdown-inner">
                  {CATEGORIES.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/produtos?categoria=${encodeURIComponent(c.slug)}`}
                      className="site-header__categories-dropdown-link"
                      onClick={() => setCategoriesOpen(false)}
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <form className="site-header__search" onSubmit={handleSearch}>
          <input
            type="search"
            className="site-header__search-input"
            placeholder="Pesquise qualquer coisa"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Pesquisar"
          />
          <button type="submit" className="site-header__search-btn" aria-label="Pesquisar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </form>

        <div className="site-header__right" ref={userMenuRef}>
          {!authLoading && (
            <>
              {user ? (
                <div className="site-header__user-wrap">
                  <button
                    type="button"
                    className="site-header__user-btn"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    aria-haspopup="true"
                    aria-expanded={userMenuOpen}
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="site-header__avatar-img"
                        width={28}
                        height={28}
                      />
                    ) : (
                      <span className="site-header__avatar" aria-hidden />
                    )}
                    <span className="site-header__user-name">{displayName}</span>
                  </button>
                  {userMenuOpen && (
                    <div className="site-header__user-dropdown">
                      <span className="site-header__user-dropdown-role">
                        {profile?.user_type === 'vendedor' ? 'Vendedor' : 'Utilizador'}
                      </span>
                      <Link href="/conta" className="site-header__user-dropdown-link" onClick={() => setUserMenuOpen(false)}>
                        Minha conta
                      </Link>
                      <Link href="/perfil" className="site-header__user-dropdown-link" onClick={() => setUserMenuOpen(false)}>
                        O meu perfil
                      </Link>
                      <Link href="/favoritos" className="site-header__user-dropdown-link" onClick={() => setUserMenuOpen(false)}>
                        Favoritos
                      </Link>
                      <Link href="/carrinho" className="site-header__user-dropdown-link" onClick={() => setUserMenuOpen(false)}>
                        Carrinho
                      </Link>
                      <Link href="/mensagens" className="site-header__user-dropdown-link" onClick={() => setUserMenuOpen(false)}>
                        Mensagens
                      </Link>
                      {profile?.user_type === 'vendedor' && (
                        <>
                          <Link href="/vender" className="site-header__user-dropdown-link" onClick={() => setUserMenuOpen(false)}>
                            Vender
                          </Link>
                          <Link href="/vendedor" className="site-header__user-dropdown-link" onClick={() => setUserMenuOpen(false)}>
                            Área vendedor
                          </Link>
                        </>
                      )}
                      <button type="button" className="site-header__user-dropdown-link site-header__user-dropdown-logout" onClick={() => { signOut(); setUserMenuOpen(false); }}>
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/registar" className="site-header__signin site-header__signin--reg">
                    Registar
                  </Link>
                  <Link href="/entrar" className="site-header__signin">
                    Iniciar sessão
                  </Link>
                  <Link href="/entrar" className="site-header__icon" aria-label="Conta">
                    <span className="site-header__avatar" />
                  </Link>
                </>
              )}
              <Link href="/favoritos" className="site-header__icon site-header__icon--badge-wrap" aria-label="Favoritos">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {favoritesCount > 0 ? (
                  <span className="site-header__badge">{favoritesCount > 99 ? '99+' : favoritesCount}</span>
                ) : null}
              </Link>
              <Link href="/mensagens" className="site-header__icon site-header__icon--badge-wrap" aria-label="Mensagens">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {user && unreadMessages > 0 ? (
                  <span className="site-header__badge">{unreadMessages > 99 ? '99+' : unreadMessages}</span>
                ) : null}
              </Link>
              <Link href="/carrinho" className="site-header__icon site-header__icon--badge-wrap" aria-label="Carrinho de compras">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {cartQtyTotal > 0 ? (
                  <span className="site-header__badge">{cartQtyTotal > 99 ? '99+' : cartQtyTotal}</span>
                ) : null}
              </Link>
            </>
          )}
        </div>
      </div>

      <nav className="site-header__row site-header__row--sub">
        {SECONDARY_LINKS.map((item) => (
          <Link key={item.href + item.label} href={item.href} className="site-header__sub-link">
            {item.icon && <span className="site-header__sub-icon">{item.icon}</span>}
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
