'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import {
  CATEGORY_PRODUTO_DIGITAL,
  DIGITAL_SUBCATEGORIES,
  getCategoryLabel,
  PHYSICAL_CATEGORY_GROUPS,
} from '@/lib/categories';
import { useAuth } from '@/lib/auth-context';
import { useMarketplaceLists } from '@/lib/marketplace-lists-context';
import { supabase } from '@/lib/supabase';
import { SITE_NAME } from '@/lib/site-brand';

type SuggestProduct = { id: string; title: string; category: string };
type SuggestMember = { id: string; full_name: string | null; avatar_url: string | null };
type SearchScope = 'products' | 'members';

function HeaderUrlSync({
  onSync,
}: {
  onSync: (q: string, categoria: string, scope: SearchScope) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname === '/produtos') {
      onSync(searchParams.get('q') ?? '', searchParams.get('categoria') ?? '', 'products');
    } else if (pathname === '/membros') {
      onSync(searchParams.get('q') ?? '', '', 'members');
    } else if (pathname === '/') {
      onSync('', '', 'products');
    }
  }, [pathname, searchParams, onSync]);

  return null;
}

export default function Header() {
  const router = useRouter();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { favoritesCount, cartQtyTotal } = useMarketplaceLists();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestProduct[]>([]);
  const [memberSuggestions, setMemberSuggestions] = useState<SuggestMember[]>([]);
  const [searchScope, setSearchScope] = useState<SearchScope>('products');
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const suggestAbortRef = useRef<AbortController | null>(null);

  const syncFromUrl = useCallback((q: string, categoria: string, scope: SearchScope) => {
    setSearchQuery(q);
    setSearchCategory(categoria);
    setSearchScope(scope);
  }, []);

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
    if (!suggestOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSuggestOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [suggestOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSuggestOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

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

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setMemberSuggestions([]);
      setSuggestOpen(false);
      suggestAbortRef.current?.abort();
      return;
    }

    const t = window.setTimeout(() => {
      suggestAbortRef.current?.abort();
      const ac = new AbortController();
      suggestAbortRef.current = ac;
      setSuggestLoading(true);

      if (searchScope === 'members') {
        void fetch(`/api/profiles/search?${new URLSearchParams({ q, limit: '10' })}`, { signal: ac.signal })
          .then((r) => r.json())
          .then((data: unknown) => {
            if (Array.isArray(data)) {
              setMemberSuggestions(
                data.slice(0, 10).map((row: SuggestMember) => ({
                  id: row.id,
                  full_name: row.full_name,
                  avatar_url: row.avatar_url,
                }))
              );
              setSuggestions([]);
              setSuggestOpen(true);
            } else {
              setMemberSuggestions([]);
            }
          })
          .catch(() => {
            if (!ac.signal.aborted) setMemberSuggestions([]);
          })
          .finally(() => {
            if (!ac.signal.aborted) setSuggestLoading(false);
          });
        return;
      }

      const params = new URLSearchParams({ q, limit: '10' });
      if (searchCategory) params.set('categoria', searchCategory);
      void fetch(`/api/products?${params}`, { signal: ac.signal })
        .then((r) => r.json())
        .then((data: unknown) => {
          if (Array.isArray(data)) {
            setSuggestions(
              data.slice(0, 10).map((row: { id: string; title: string; category: string }) => ({
                id: row.id,
                title: row.title,
                category: row.category,
              }))
            );
            setMemberSuggestions([]);
            setSuggestOpen(true);
          } else {
            setSuggestions([]);
          }
        })
        .catch(() => {
          if (!ac.signal.aborted) setSuggestions([]);
        })
        .finally(() => {
          if (!ac.signal.aborted) setSuggestLoading(false);
        });
    }, 320);

    return () => {
      window.clearTimeout(t);
      suggestAbortRef.current?.abort();
    };
  }, [searchQuery, searchCategory, searchScope]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (searchScope === 'members') {
      router.push(q.length >= 2 ? `/membros?q=${encodeURIComponent(q)}` : '/membros');
      setSuggestOpen(false);
      return;
    }
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (searchCategory) params.set('categoria', searchCategory);
    const qs = params.toString();
    router.push(qs ? `/produtos?${qs}` : '/produtos');
    setSuggestOpen(false);
  };

  return (
    <header className="site-header">
      <Suspense fallback={null}>
        <HeaderUrlSync onSync={syncFromUrl} />
      </Suspense>
      <div className="site-header__row site-header__row--main">
        <div className="site-header__left">
          <Link href="/" className="site-header__logo" title={SITE_NAME}>
            <Image
              src="/images/TerraPlace_text.png"
              alt={SITE_NAME}
              width={230}
              height={60}
              className="site-header__logo-img"
              priority
            />
          </Link>
        </div>

        <div className="site-header__search-wrap" ref={searchWrapRef}>
          <div className="site-header__search-scope" role="group" aria-label="Pesquisar em">
            <button
              type="button"
              className={`site-header__search-scope-btn${searchScope === 'products' ? ' site-header__search-scope-btn--active' : ''}`}
              aria-pressed={searchScope === 'products'}
              onClick={() => {
                setSearchScope('products');
                setSuggestOpen(false);
              }}
            >
              Produtos
            </button>
            <button
              type="button"
              className={`site-header__search-scope-btn${searchScope === 'members' ? ' site-header__search-scope-btn--active' : ''}`}
              aria-pressed={searchScope === 'members'}
              onClick={() => {
                setSearchScope('members');
                setSuggestOpen(false);
              }}
            >
              Membro
            </button>
          </div>
          <form className="site-header__search" onSubmit={handleSearch} role="search">
            <input
              type="search"
              className="site-header__search-input"
              placeholder={
                searchScope === 'members' ? 'Nome do membro' : 'Pesquise por nome ou descrição'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchScope === 'products' && suggestions.length > 0) setSuggestOpen(true);
                if (searchScope === 'members' && memberSuggestions.length > 0) setSuggestOpen(true);
              }}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label={searchScope === 'members' ? 'Pesquisar membros' : 'Pesquisar produtos'}
              aria-autocomplete="list"
              aria-expanded={suggestOpen}
            />
            <button type="submit" className="site-header__search-btn" aria-label="Pesquisar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </form>
          {suggestOpen &&
          (suggestLoading ||
            (searchScope === 'products' ? suggestions.length > 0 : memberSuggestions.length > 0)) ? (
            <ul className="site-header__search-suggest" role="listbox" aria-label="Sugestões">
              {suggestLoading &&
              (searchScope === 'products' ? suggestions.length === 0 : memberSuggestions.length === 0) ? (
                <li className="site-header__search-suggest-item site-header__search-suggest-item--muted">
                  A procurar…
                </li>
              ) : null}
              {searchScope === 'products'
                ? suggestions.map((p) => (
                    <li key={p.id} role="option">
                      <Link
                        href={`/produtos/${p.id}`}
                        className="site-header__search-suggest-link"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setSuggestOpen(false)}
                      >
                        <span className="site-header__search-suggest-title">{p.title}</span>
                        <span className="site-header__search-suggest-cat">{getCategoryLabel(p.category)}</span>
                      </Link>
                    </li>
                  ))
                : memberSuggestions.map((m) => (
                    <li key={m.id} role="option">
                      <Link
                        href={`/perfil/${m.id}`}
                        className="site-header__search-suggest-link site-header__search-suggest-link--member"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setSuggestOpen(false)}
                      >
                        {m.avatar_url ? (
                          <img
                            src={m.avatar_url}
                            alt=""
                            className="site-header__search-suggest-avatar"
                            width={36}
                            height={36}
                          />
                        ) : (
                          <span className="site-header__search-suggest-avatar site-header__search-suggest-avatar--ph" aria-hidden>
                            👤
                          </span>
                        )}
                        <span className="site-header__search-suggest-title">
                          {m.full_name?.trim() || 'Membro'}
                        </span>
                        <span className="site-header__search-suggest-cat">Perfil</span>
                      </Link>
                    </li>
                  ))}
            </ul>
          ) : null}
        </div>

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
                  <div className={`site-header__user-dropdown${userMenuOpen ? ' site-header__user-dropdown--open' : ''}`}>
                    <Link href={user?.id ? `/perfil/${user.id}` : '/perfil'} className="site-header__user-dropdown-link" onClick={() => setUserMenuOpen(false)}>
                      Perfil
                    </Link>
                    <Link
                      href="/perfil#detalhes-perfil"
                      className="site-header__user-dropdown-link"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Definições
                    </Link>
                    <Link
                      href="/perfil#personalizacao-categorias"
                      className="site-header__user-dropdown-link"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Personalização
                    </Link>
                    <Link href="/conta/saldo" className="site-header__user-dropdown-link" onClick={() => setUserMenuOpen(false)}>
                      Saldo
                    </Link>
                    <Link href="/conta/compras" className="site-header__user-dropdown-link" onClick={() => setUserMenuOpen(false)}>
                      Os meus pedidos
                    </Link>
                    <button
                      type="button"
                      className="site-header__user-dropdown-link"
                      onClick={() => {
                        signOut();
                        setUserMenuOpen(false);
                      }}
                    >
                      Terminar sessão
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Link href="/registar" className="site-header__signin site-header__signin--reg">
                    Registar
                  </Link>
                  <Link href="/entrar" className="site-header__signin">
                    Iniciar sessão
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

      <nav
        className="site-header__row site-header__row--sub site-header__nav-subcats"
        aria-label="Categorias do marketplace"
      >
        {PHYSICAL_CATEGORY_GROUPS.map((g) => (
          <div key={g.slug} className="site-header__nav-cat">
            <Link
              href={`/produtos?categoria=${encodeURIComponent(g.slug)}`}
              className="site-header__nav-cat-trigger"
            >
              {g.label}
            </Link>
            <div className="site-header__nav-cat-panel" role="group" aria-label={`${g.label}: subcategorias`}>
              <Link href={`/produtos?categoria=${encodeURIComponent(g.slug)}`} className="site-header__nav-cat-all">
                Ver tudo em {g.label}
              </Link>
              {g.leaves.map((leaf) => (
                <Link key={leaf.slug} href={`/produtos?categoria=${encodeURIComponent(leaf.slug)}`}>
                  {leaf.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
        <div className="site-header__nav-cat">
          <Link
            href={`/produtos?categoria=${encodeURIComponent(CATEGORY_PRODUTO_DIGITAL)}`}
            className="site-header__nav-cat-trigger"
          >
            Produto digital
          </Link>
          <div className="site-header__nav-cat-panel" role="group" aria-label="Produto digital: subcategorias">
            <Link
              href={`/produtos?categoria=${encodeURIComponent(CATEGORY_PRODUTO_DIGITAL)}`}
              className="site-header__nav-cat-all"
            >
              Ver todos os digitais
            </Link>
            {DIGITAL_SUBCATEGORIES.map((d) => (
              <Link
                key={d.slug}
                href={`/produtos?categoria=${encodeURIComponent(CATEGORY_PRODUTO_DIGITAL)}&subcategorias=${encodeURIComponent(d.slug)}`}
              >
                {d.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}


