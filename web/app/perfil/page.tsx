'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { NotificationPrefs, PaymentPreference } from '@/lib/auth-context';
import {
  FEED_PERSONALIZATION_STORAGE_KEY,
  FEED_PERSONALIZATION_STORAGE_KEY_LEGACY,
  FEED_SIZES_ADULT,
  FEED_SIZES_KIDS,
  normalizeImportedBrandIds,
  normalizeImportedSizeIds,
  POPULAR_BRANDS_BY_LETTER,
} from '@/lib/feed-personalization';
import type { BrowseSignalsState } from '@/lib/browse-signals';
import {
  clearAllBrowseSignals,
  clearProductSearches,
  clearViewedProducts,
  formatSeenAt,
  getBrowseSignals,
} from '@/lib/browse-signals';

const AVATARS_BUCKET = 'avatars';
const ACCEPT_AVATAR_IMAGES = '.jpg,.jpeg,.png,.webp';
const CITY_DATALIST_ID = 'perfil-city-suggestions';
const NOTIFICATION_PREFS_DEFAULT: NotificationPrefs = {
  email_enabled: true,
  news_updates: true,
  marketing: true,
  messages: true,
  reviews: true,
  price_drops: true,
  favorites: true,
  new_items: true,
  daily_limit: 'Até 2 notificações',
};

const VALID_DAILY_LIMITS = ['Até 2 notificações', 'Até 5 notificações', 'Até 10 notificações', 'Sem limite'] as const;

function parseNotificationPrefs(raw: unknown): NotificationPrefs {
  if (!raw || typeof raw !== 'object') {
    return { ...NOTIFICATION_PREFS_DEFAULT };
  }
  const o = raw as Record<string, unknown>;
  type NotifBoolKey = Exclude<keyof NotificationPrefs, 'daily_limit'>;
  const bool = (key: NotifBoolKey): boolean => {
    const v = o[key];
    return typeof v === 'boolean' ? v : NOTIFICATION_PREFS_DEFAULT[key];
  };
  const limitRaw = o.daily_limit;
  const daily_limit =
    typeof limitRaw === 'string' && (VALID_DAILY_LIMITS as readonly string[]).includes(limitRaw)
      ? limitRaw
      : NOTIFICATION_PREFS_DEFAULT.daily_limit;
  return {
    email_enabled: bool('email_enabled'),
    news_updates: bool('news_updates'),
    marketing: bool('marketing'),
    messages: bool('messages'),
    reviews: bool('reviews'),
    price_drops: bool('price_drops'),
    favorites: bool('favorites'),
    new_items: bool('new_items'),
    daily_limit,
  };
}

const VALID_SETTINGS_ANCHORS = new Set([
  '#detalhes-perfil',
  '#definicoes-conta',
  '#custos-envio',
  '#pagamentos-perfil',
  '#notificacoes-perfil',
  '#privacidade-perfil',
  '#seguranca-perfil',
  '#personalizacao-categorias',
  '#personalizacao-marcas',
  '#personalizacao-historico',
]);

type FeedPersonalizationState = {
  mulher: boolean;
  homem: boolean;
  crianca: boolean;
  sizesMulher: string[];
  sizesHomem: string[];
  sizesCrianca: string[];
  brandIds: string[];
};

const DEFAULT_FEED_PREFS: FeedPersonalizationState = {
  mulher: false,
  homem: false,
  crianca: false,
  sizesMulher: [],
  sizesHomem: [],
  sizesCrianca: [],
  brandIds: [],
};

const COUNTRY_OPTIONS = [
  'Alemanha',
  'Áustria',
  'Bélgica',
  'Bulgária',
  'Chipre',
  'Croácia',
  'Dinamarca',
  'Eslováquia',
  'Eslovénia',
  'Espanha',
  'Estónia',
  'Finlândia',
  'França',
  'Grécia',
  'Hungria',
  'Irlanda',
  'Itália',
  'Letónia',
  'Lituânia',
  'Luxemburgo',
  'Malta',
  'Países Baixos',
  'Polónia',
  'Portugal',
  'República Checa',
  'Roménia',
  'Suécia',
  'Canadá',
  'Estados Unidos',
  'Reino Unido',
  'Suíça',
  'Brasil',
  'Angola',
  'Moçambique',
] as const;

const COUNTRY_TO_ISO2: Record<string, string> = {
  Alemanha: 'de',
  Áustria: 'at',
  Bélgica: 'be',
  Bulgária: 'bg',
  Chipre: 'cy',
  Croácia: 'hr',
  Dinamarca: 'dk',
  Eslováquia: 'sk',
  Eslovénia: 'si',
  Espanha: 'es',
  Estónia: 'ee',
  Finlândia: 'fi',
  França: 'fr',
  Grécia: 'gr',
  Hungria: 'hu',
  Irlanda: 'ie',
  Itália: 'it',
  Letónia: 'lv',
  Lituânia: 'lt',
  Luxemburgo: 'lu',
  Malta: 'mt',
  'Países Baixos': 'nl',
  Polónia: 'pl',
  Portugal: 'pt',
  'República Checa': 'cz',
  Roménia: 'ro',
  Suécia: 'se',
  Canadá: 'ca',
  'Estados Unidos': 'us',
  'Reino Unido': 'gb',
  Suíça: 'ch',
  Brasil: 'br',
  Angola: 'ao',
  Moçambique: 'mz',
};

const GENDER_SELECT_OPTIONS = [
  { value: '', label: 'Selecionar género' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'outro', label: 'Outro' },
  { value: 'prefiro-nao-dizer', label: 'Prefiro não dizer' },
] as const;

export default function PerfilPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [phone, setPhone] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [locationCountry, setLocationCountry] = useState('Portugal');
  const [locationCity, setLocationCity] = useState('');
  const [showCityOnProfile, setShowCityOnProfile] = useState(true);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [iban, setIban] = useState('');
  const [paymentPreference, setPaymentPreference] = useState<PaymentPreference>('transferencia');
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifVintedNews, setNotifVintedNews] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifReview, setNotifReview] = useState(true);
  const [notifDiscounted, setNotifDiscounted] = useState(true);
  const [notifFavorites, setNotifFavorites] = useState(true);
  const [notifNewItems, setNotifNewItems] = useState(true);
  const [notifDailyLimit, setNotifDailyLimit] = useState('Até 2 notificações');
  const [vacationMode, setVacationMode] = useState(false);
  const [connectedProviders, setConnectedProviders] = useState({ google: false, facebook: false });
  const [accountActionLoading, setAccountActionLoading] = useState<
    'google' | 'facebook' | 'unlink-google' | 'unlink-facebook' | 'password' | null
  >(null);
  const [accountMessage, setAccountMessage] = useState('');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [nextPasswordConfirm, setNextPasswordConfirm] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [authEmailVerified, setAuthEmailVerified] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [newEmailDraft, setNewEmailDraft] = useState('');
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [phoneSubmitting, setPhoneSubmitting] = useState(false);
  const [feedPrefs, setFeedPrefs] = useState<FeedPersonalizationState>(DEFAULT_FEED_PREFS);
  const [feedPrefsHydrated, setFeedPrefsHydrated] = useState(false);
  const [sizesOpen, setSizesOpen] = useState<'mulher' | 'homem' | 'crianca' | null>(null);
  const [brandSearch, setBrandSearch] = useState('');
  const [browseSignals, setBrowseSignals] = useState<BrowseSignalsState>({
    viewedProducts: [],
    productSearches: [],
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeAnchor, setActiveAnchor] = useState('#detalhes-perfil');
  const allowNotifPersistRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    if (!authLoading && !user) {
      router.replace('/entrar?redirect=/perfil');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? '');
    setAvatarUrl(profile.avatar_url ?? null);
    setPhone(profile.phone ?? '');
    setAboutMe('');
    const rawAddress = (profile.address ?? '').trim();
    const addressParts = rawAddress
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    if (addressParts.length >= 2) {
      setLocationCountry(addressParts[addressParts.length - 1] || 'Portugal');
      setLocationCity(addressParts.slice(0, -1).join(', '));
      setShowCityOnProfile(true);
    } else if (addressParts.length === 1) {
      setLocationCountry(addressParts[0] || 'Portugal');
      setLocationCity('');
      setShowCityOnProfile(false);
    } else {
      setLocationCountry('Portugal');
      setLocationCity('');
      setShowCityOnProfile(true);
    }
    setIban(profile.iban ?? '');
    setPaymentPreference((profile.payment_preference as PaymentPreference) || 'transferencia');
    setVacationMode(Boolean((profile as { vacation_mode?: boolean | null }).vacation_mode));
    setGender(profile.gender ?? '');
    const bd = profile.birth_date;
    setBirthDate(bd ? String(bd).slice(0, 10) : '');
    const np = parseNotificationPrefs(profile.notification_prefs);
    setNotifEmail(np.email_enabled);
    setNotifVintedNews(np.news_updates);
    setNotifMarketing(np.marketing);
    setNotifMessages(np.messages);
    setNotifReview(np.reviews);
    setNotifDiscounted(np.price_drops);
    setNotifFavorites(np.favorites);
    setNotifNewItems(np.new_items);
    setNotifDailyLimit(np.daily_limit);
    allowNotifPersistRef.current = false;
    requestAnimationFrame(() => {
      allowNotifPersistRef.current = true;
    });
  }, [profile]);

  const refreshConnectedProviders = async () => {
    const { data } = await supabase.auth.getUser();
    const identities = (data.user?.identities ?? []) as Array<{ provider?: string | null }>;
    const hasGoogle = identities.some((identity) => identity.provider === 'google');
    const hasFacebook = identities.some((identity) => identity.provider === 'facebook');
    setConnectedProviders({ google: hasGoogle, facebook: hasFacebook });
  };

  useEffect(() => {
    void refreshConnectedProviders();
  }, []);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setAuthEmailVerified(Boolean(data.user?.email_confirmed_at));
    });
  }, [user?.id, emailModalOpen]);

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(FEED_PERSONALIZATION_STORAGE_KEY) ??
        localStorage.getItem(FEED_PERSONALIZATION_STORAGE_KEY_LEGACY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<FeedPersonalizationState>;
        setFeedPrefs((prev) => ({
          ...prev,
          mulher: Boolean(parsed.mulher),
          homem: Boolean(parsed.homem),
          crianca: Boolean(parsed.crianca),
          sizesMulher: normalizeImportedSizeIds(parsed.sizesMulher),
          sizesHomem: normalizeImportedSizeIds(parsed.sizesHomem),
          sizesCrianca: normalizeImportedSizeIds(parsed.sizesCrianca),
          brandIds: normalizeImportedBrandIds(parsed.brandIds),
        }));
      }
    } catch {
      /* ignore */
    }
    setFeedPrefsHydrated(true);
  }, []);

  useEffect(() => {
    if (!feedPrefsHydrated) return;
    try {
      localStorage.setItem(FEED_PERSONALIZATION_STORAGE_KEY, JSON.stringify(feedPrefs));
    } catch {
      /* ignore */
    }
  }, [feedPrefs, feedPrefsHydrated]);

  useEffect(() => {
    setBrowseSignals(getBrowseSignals());
  }, []);

  useEffect(() => {
    if (activeAnchor === '#personalizacao-historico') setBrowseSignals(getBrowseSignals());
  }, [activeAnchor]);

  useEffect(() => {
    const updateActiveAnchor = () => {
      let hash = window.location.hash || '#detalhes-perfil';
      if (hash === '#personalizacao') hash = '#personalizacao-categorias';
      setActiveAnchor(VALID_SETTINGS_ANCHORS.has(hash) ? hash : '#detalhes-perfil');
    };
    updateActiveAnchor();
    window.addEventListener('hashchange', updateActiveAnchor);
    return () => window.removeEventListener('hashchange', updateActiveAnchor);
  }, []);

  useEffect(() => {
    if (!allowNotifPersistRef.current || !user?.id) return;
    const prefs: NotificationPrefs = {
      email_enabled: notifEmail,
      news_updates: notifVintedNews,
      marketing: notifMarketing,
      messages: notifMessages,
      reviews: notifReview,
      price_drops: notifDiscounted,
      favorites: notifFavorites,
      new_items: notifNewItems,
      daily_limit: notifDailyLimit,
    };
    const t = window.setTimeout(() => {
      void (async () => {
        const { error } = await supabase
          .from('profiles')
          .update({
            notification_prefs: prefs,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
        if (!error) await refreshProfile();
      })();
    }, 450);
    return () => window.clearTimeout(t);
  }, [
    notifEmail,
    notifVintedNews,
    notifMarketing,
    notifMessages,
    notifReview,
    notifDiscounted,
    notifFavorites,
    notifNewItems,
    notifDailyLimit,
    user?.id,
    refreshProfile,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    setMessage('');
    let finalAvatarUrl = avatarUrl;
    const normalizedCountry = locationCountry.trim() || 'Portugal';
    const normalizedCity = locationCity.trim();
    const finalAddress =
      showCityOnProfile && normalizedCity
        ? `${normalizedCity}, ${normalizedCountry}`
        : normalizedCountry;

    if (avatarFile) {
      const ext = avatarFile.name.toLowerCase().split('.').pop() || 'jpg';
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from(AVATARS_BUCKET).upload(path, avatarFile, {
        contentType: avatarFile.type,
        upsert: true,
      });
      if (uploadErr) {
        setSaving(false);
        const hint =
          uploadErr.message.includes('row-level security') || uploadErr.message.includes('RLS')
            ? ' Cria o bucket "avatars" e aplica políticas de INSERT (ver migração supabase ou STORAGE.md).'
            : ' Garante que o bucket "avatars" existe no Supabase Storage.';
        setMessage('Erro ao enviar foto de perfil: ' + uploadErr.message + '.' + hint);
        return;
      }
      const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);
      finalAvatarUrl = data.publicUrl;
      setAvatarUrl(finalAvatarUrl);
    }

    const notification_prefs: NotificationPrefs = {
      email_enabled: notifEmail,
      news_updates: notifVintedNews,
      marketing: notifMarketing,
      messages: notifMessages,
      reviews: notifReview,
      price_drops: notifDiscounted,
      favorites: notifFavorites,
      new_items: notifNewItems,
      daily_limit: notifDailyLimit,
    };

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim() || null,
        avatar_url: finalAvatarUrl,
        phone: phone.trim() || null,
        address: finalAddress,
        iban: iban.trim() || null,
        payment_preference: paymentPreference,
        vacation_mode: vacationMode,
        gender: gender.trim() || null,
        birth_date: birthDate.trim() || null,
        notification_prefs,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      setMessage('Erro ao guardar: ' + error.message);
      return;
    }
    setMessage('Perfil atualizado.');
    await refreshProfile();
  };

  const handleVacationModeToggle = async (nextValue: boolean) => {
    if (!user?.id) return;
    setVacationMode(nextValue);
    setAccountMessage('');
    const { error } = await supabase
      .from('profiles')
      .update({
        vacation_mode: nextValue,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    if (error) {
      setVacationMode(!nextValue);
      setAccountMessage('Não foi possível atualizar o modo férias: ' + error.message);
      return;
    }
    await refreshProfile();
    setAccountMessage(nextValue ? 'Modo férias ativado.' : 'Modo férias desativado.');
  };

  const handleOpenEmailModal = () => {
    setAccountMessage('');
    setNewEmailDraft(user?.email ?? '');
    setEmailModalOpen(true);
  };

  const handleSubmitEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountMessage('');
    const trimmed = newEmailDraft.trim();
    if (!trimmed) {
      setAccountMessage('Indica um email válido.');
      return;
    }
    if (trimmed === user?.email) {
      setEmailModalOpen(false);
      return;
    }
    setEmailSubmitting(true);
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    setEmailSubmitting(false);
    if (error) {
      setAccountMessage('Não foi possível alterar o email: ' + error.message);
      return;
    }
    setEmailModalOpen(false);
    setAccountMessage('Confirma o novo endereço no email que te enviámos.');
    void supabase.auth.getUser().then(({ data }) => {
      setAuthEmailVerified(Boolean(data.user?.email_confirmed_at));
    });
  };

  const handleOpenPhoneModal = () => {
    setAccountMessage('');
    setPhoneDraft(phone);
    setPhoneModalOpen(true);
  };

  const handleSubmitPhoneModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setAccountMessage('');
    const trimmed = phoneDraft.trim();
    setPhoneSubmitting(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        phone: trimmed || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    setPhoneSubmitting(false);
    if (error) {
      setAccountMessage('Não foi possível guardar o telefone: ' + error.message);
      return;
    }
    setPhone(trimmed);
    setPhoneModalOpen(false);
    await refreshProfile();
    setAccountMessage('Número de telefone atualizado.');
  };

  const handleConnectProvider = async (provider: 'google' | 'facebook') => {
    setAccountMessage('');
    setAccountActionLoading(provider);
    try {
      const authWithLink = supabase.auth as unknown as {
        linkIdentity?: (args: { provider: 'google' | 'facebook'; options?: { redirectTo?: string } }) => Promise<{
          error: { message: string } | null;
        }>;
      };
      const redirectTo = `${window.location.origin}/perfil#definicoes-conta`;
      if (typeof authWithLink.linkIdentity === 'function') {
        const { error } = await authWithLink.linkIdentity({ provider, options: { redirectTo } });
        if (error) {
          setAccountMessage('Não foi possível associar conta: ' + error.message);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo },
        });
        if (error) {
          setAccountMessage('Não foi possível iniciar associação: ' + error.message);
          return;
        }
      }
      await refreshConnectedProviders();
      setAccountMessage(`Conta ${provider === 'google' ? 'Google' : 'Facebook'} associada.`);
    } finally {
      setAccountActionLoading(null);
    }
  };

  const handleUnlinkProvider = async (provider: 'google' | 'facebook') => {
    const providerLabel = provider === 'google' ? 'Google' : 'Facebook';
    const shouldUnlink = window.confirm(`Queres desassociar a conta ${providerLabel}?`);
    if (!shouldUnlink) return;
    setAccountMessage('');
    setAccountActionLoading(provider === 'google' ? 'unlink-google' : 'unlink-facebook');
    try {
      const authWithUnlink = supabase.auth as unknown as {
        unlinkIdentity?: (args: { provider: 'google' | 'facebook' }) => Promise<{
          error: { message: string } | null;
        }>;
      };
      if (typeof authWithUnlink.unlinkIdentity !== 'function') {
        setAccountMessage('A desassociação de contas não está disponível nesta versão da aplicação.');
        return;
      }
      const { error } = await authWithUnlink.unlinkIdentity({ provider });
      if (error) {
        setAccountMessage('Não foi possível desassociar conta: ' + error.message);
        return;
      }
      await refreshConnectedProviders();
      setAccountMessage(`Conta ${providerLabel} desassociada.`);
    } finally {
      setAccountActionLoading(null);
    }
  };

  const handleOpenPasswordModal = () => {
    setAccountMessage('');
    setCurrentPassword('');
    setNextPassword('');
    setNextPasswordConfirm('');
    setPasswordModalOpen(true);
  };

  const handleSubmitPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountMessage('');
    if (!user?.email) {
      setAccountMessage('Esta conta não tem email para validar a palavra-passe atual.');
      return;
    }
    if (!currentPassword.trim()) {
      setAccountMessage('Indica a palavra-passe antiga.');
      return;
    }
    if (nextPassword.length < 6) {
      setAccountMessage('A nova palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }
    if (nextPassword !== nextPasswordConfirm) {
      setAccountMessage('A confirmação da nova palavra-passe não coincide.');
      return;
    }
    if (currentPassword === nextPassword) {
      setAccountMessage('A nova palavra-passe deve ser diferente da antiga.');
      return;
    }

    setPasswordSubmitting(true);
    setAccountActionLoading('password');

    const { error: authCheckError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (authCheckError) {
      setPasswordSubmitting(false);
      setAccountActionLoading(null);
      setAccountMessage('A palavra-passe antiga está incorreta.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: nextPassword });
    setPasswordSubmitting(false);
    setAccountActionLoading(null);
    if (error) {
      setAccountMessage('Não foi possível alterar a palavra-passe: ' + error.message);
      return;
    }
    setPasswordModalOpen(false);
    setAccountMessage('Palavra-passe atualizada com sucesso.');
  };

  const handleOpenDeleteModal = () => {
    setAccountMessage('');
    setDeleteConfirmText('');
    setDeleteModalOpen(true);
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountMessage('');

    const expected = 'Quero deletar minha conta';
    if (deleteConfirmText.trim() !== expected) {
      setAccountMessage(`Escreve exatamente: "${expected}".`);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setAccountMessage('Sessão expirada. Inicia sessão novamente.');
      return;
    }

    setDeleteSubmitting(true);
    const res = await fetch('/api/account/delete', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setDeleteSubmitting(false);

    const data = (await res.json().catch(() => ({}))) as { error?: string; details?: string };
    if (!res.ok) {
      const extra = data.details ? ` (${data.details})` : '';
      setAccountMessage((data.error ?? 'Não foi possível eliminar a conta.') + extra);
      return;
    }

    setDeleteModalOpen(false);
    await supabase.auth.signOut();
    router.replace('/');
  };

  useEffect(() => {
    const q = locationCity.trim();
    const countryCode = COUNTRY_TO_ISO2[locationCountry];
    if (q.length < 2 || !countryCode) {
      setCitySuggestions([]);
      setCityLoading(false);
      return;
    }

    const ac = new AbortController();
    const timer = window.setTimeout(() => {
      setCityLoading(true);
      const params = new URLSearchParams({
        q,
        country: countryCode,
        limit: '12',
      });
      void fetch(`/api/location/cities?${params}`, { signal: ac.signal })
        .then((res) => (res.ok ? res.json() : Promise.resolve([])))
        .then((rows: unknown) => {
          if (!Array.isArray(rows)) {
            setCitySuggestions([]);
            return;
          }
          setCitySuggestions(
            rows
              .map((item) => (typeof item === 'string' ? item.trim() : ''))
              .filter(Boolean)
              .slice(0, 12)
          );
        })
        .catch(() => {
          if (!ac.signal.aborted) setCitySuggestions([]);
        })
        .finally(() => {
          if (!ac.signal.aborted) setCityLoading(false);
        });
    }, 280);

    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
  }, [locationCity, locationCountry]);

  if (authLoading) {
    return (
      <div className="page">
        <Header />
        <main className="main"><p className="loading">A carregar...</p></main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayInitial =
    (fullName.trim() || user.email || '?').trim().charAt(0).toUpperCase() || '?';
  const showSaveButton =
    activeAnchor === '#detalhes-perfil' ||
    activeAnchor === '#custos-envio' ||
    activeAnchor === '#pagamentos-perfil' ||
    activeAnchor === '#definicoes-conta';

  const isPersonalizacao =
    activeAnchor === '#personalizacao-categorias' ||
    activeAnchor === '#personalizacao-marcas' ||
    activeAnchor === '#personalizacao-historico';

  const toggleFeedCategory = (key: 'mulher' | 'homem' | 'crianca') => {
    setFeedPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const toggleFeedSize = (cat: 'mulher' | 'homem' | 'crianca', sizeId: string) => {
    const field =
      cat === 'mulher' ? 'sizesMulher' : cat === 'homem' ? 'sizesHomem' : ('sizesCrianca' as const);
    setFeedPrefs((p) => {
      const cur = p[field];
      const has = cur.includes(sizeId);
      return { ...p, [field]: has ? cur.filter((s) => s !== sizeId) : [...cur, sizeId] };
    });
  };

  const toggleFeedBrand = (brandId: string) => {
    setFeedPrefs((p) => {
      const has = p.brandIds.includes(brandId);
      return {
        ...p,
        brandIds: has ? p.brandIds.filter((id) => id !== brandId) : [...p.brandIds, brandId],
      };
    });
  };

  const brandSearchNorm = brandSearch.trim().toLowerCase();
  const brandSectionsFiltered = useMemo(() => {
    return POPULAR_BRANDS_BY_LETTER.map(({ letter, brands }) => ({
      letter,
      brands: brands.filter(
        (b) => !brandSearchNorm || b.label.toLowerCase().includes(brandSearchNorm)
      ),
    })).filter((s) => s.brands.length > 0);
  }, [brandSearchNorm]);

  return (
    <div className="page">
      <Header />
      <main className="main perfil-page">
        <div
          className={`perfil-settings-layout${isPersonalizacao ? ' perfil-settings-layout--personalizacao-only' : ''}`}
        >
          {!isPersonalizacao && (
            <aside className="perfil-settings-sidebar">
              <h1 className="perfil-settings-sidebar__title">Definições</h1>
              <nav className="perfil-settings-sidebar__nav" aria-label="Navegação de definições">
              <a
                href="#detalhes-perfil"
                className={`perfil-settings-sidebar__item${activeAnchor === '#detalhes-perfil' ? ' perfil-settings-sidebar__item--active' : ''}`}
              >
                Detalhes do perfil
              </a>
              <a
                href="#definicoes-conta"
                className={`perfil-settings-sidebar__item${activeAnchor === '#definicoes-conta' ? ' perfil-settings-sidebar__item--active' : ''}`}
              >
                Definições da conta
              </a>
              <a
                href="#custos-envio"
                className={`perfil-settings-sidebar__item${activeAnchor === '#custos-envio' ? ' perfil-settings-sidebar__item--active' : ''}`}
              >
                Custos de envio
              </a>
              <a
                href="#pagamentos-perfil"
                className={`perfil-settings-sidebar__item${activeAnchor === '#pagamentos-perfil' ? ' perfil-settings-sidebar__item--active' : ''}`}
              >
                Pagamentos
              </a>
              <a
                href="#notificacoes-perfil"
                className={`perfil-settings-sidebar__item${activeAnchor === '#notificacoes-perfil' ? ' perfil-settings-sidebar__item--active' : ''}`}
              >
                Notificações
              </a>
              <a
                href="#privacidade-perfil"
                className={`perfil-settings-sidebar__item${activeAnchor === '#privacidade-perfil' ? ' perfil-settings-sidebar__item--active' : ''}`}
              >
                Definições de privacidade
              </a>
              <a
                href="#seguranca-perfil"
                className={`perfil-settings-sidebar__item${activeAnchor === '#seguranca-perfil' ? ' perfil-settings-sidebar__item--active' : ''}`}
              >
                Segurança
              </a>
            </nav>
            </aside>
          )}

          <section className="perfil-settings-main" aria-labelledby="perfil-settings-title">
            <h2 id="perfil-settings-title" className="visually-hidden">
              Editar perfil
            </h2>
            <form onSubmit={handleSubmit} className="perfil-settings-form">
              {message && (
                <p className={message.startsWith('Erro') ? 'auth-error' : 'auth-success'}>{message}</p>
              )}

              {isPersonalizacao && (
                <div className="perfil-personalizacao-layout">
                  <aside className="perfil-personalizacao-subnav" aria-label="Personalização">
                    <a href="#detalhes-perfil" className="perfil-personalizacao-back">
                      ← Definições
                    </a>
                    <h2 className="perfil-personalizacao-subnav__title">Personalização</h2>
                    <nav className="perfil-personalizacao-subnav__list">
                      <a
                        href="#personalizacao-categorias"
                        className={`perfil-personalizacao-subnav__item${
                          activeAnchor === '#personalizacao-categorias' ? ' perfil-personalizacao-subnav__item--active' : ''
                        }`}
                      >
                        Categorias e tamanhos
                      </a>
                      <a
                        href="#personalizacao-marcas"
                        className={`perfil-personalizacao-subnav__item${
                          activeAnchor === '#personalizacao-marcas' ? ' perfil-personalizacao-subnav__item--active' : ''
                        }`}
                      >
                        Marcas
                      </a>
                      <a
                        href="#personalizacao-historico"
                        className={`perfil-personalizacao-subnav__item perfil-personalizacao-subnav__item--with-badge${
                          activeAnchor === '#personalizacao-historico' ? ' perfil-personalizacao-subnav__item--active' : ''
                        }`}
                      >
                        <span>Histórico</span>
                        <span className="perfil-personalizacao-badge">Novo</span>
                      </a>
                    </nav>
                  </aside>

                  <div className="perfil-personalizacao-main">
                    {activeAnchor === '#personalizacao-categorias' && (
                      <div id="personalizacao-categorias" className="perfil-settings-anchor">
                        <h2 className="perfil-personalizacao-panel__title">Selecionar categorias e tamanhos</h2>
                        <p className="perfil-personalizacao-panel__subtitle">
                          Seleciona as categorias e tamanhos que pretendes ver no teu feed. Tamanhos de adulto seguem a
                          escala letra + equivalência EU habitual na Vinted (ex.: S · 36, M · 38). Criança usa faixas de
                          idade/meses típicas do catálogo.
                        </p>
                        <div className="perfil-personalizacao-cat-card">
                          <div className="perfil-personalizacao-cat-block">
                            <div className="perfil-personalizacao-cat-row">
                              <div className="perfil-personalizacao-cat-row__left">
                                <span className="perfil-personalizacao-cat-icon" aria-hidden>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M12 3l2.2 4.2h4.3l1.1 8.2-4.1 3.1V22H8.5v-3.5l-4.1-3.1 1.1-8.2h4.3L12 3z" />
                                  </svg>
                                </span>
                                <span className="perfil-personalizacao-cat-label">Mulher</span>
                              </div>
                              <label className="perfil-personalizacao-check">
                                <input
                                  type="checkbox"
                                  checked={feedPrefs.mulher}
                                  onChange={() => toggleFeedCategory('mulher')}
                                />
                                <span className="perfil-personalizacao-check__ui" />
                              </label>
                            </div>
                            <button
                              type="button"
                              className="perfil-personalizacao-tamanhos-row"
                              onClick={() => setSizesOpen((v) => (v === 'mulher' ? null : 'mulher'))}
                            >
                              <span>Tamanhos</span>
                              <span className="perfil-personalizacao-chevron" aria-hidden>
                                ›
                              </span>
                            </button>
                            {sizesOpen === 'mulher' && (
                              <div className="perfil-personalizacao-sizes">
                                {FEED_SIZES_ADULT.map((opt) => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    className={`perfil-personalizacao-size-chip${
                                      feedPrefs.sizesMulher.includes(opt.id) ? ' perfil-personalizacao-size-chip--on' : ''
                                    }`}
                                    onClick={() => toggleFeedSize('mulher', opt.id)}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="perfil-personalizacao-cat-block">
                            <div className="perfil-personalizacao-cat-row">
                              <div className="perfil-personalizacao-cat-row__left">
                                <span className="perfil-personalizacao-cat-icon" aria-hidden>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M6 5l2 2h8l2-2 2 3.5-2 1.5v11H6V10L4 8.5 6 5z" />
                                  </svg>
                                </span>
                                <span className="perfil-personalizacao-cat-label">Homem</span>
                              </div>
                              <label className="perfil-personalizacao-check">
                                <input
                                  type="checkbox"
                                  checked={feedPrefs.homem}
                                  onChange={() => toggleFeedCategory('homem')}
                                />
                                <span className="perfil-personalizacao-check__ui" />
                              </label>
                            </div>
                            <button
                              type="button"
                              className="perfil-personalizacao-tamanhos-row"
                              onClick={() => setSizesOpen((v) => (v === 'homem' ? null : 'homem'))}
                            >
                              <span>Tamanhos</span>
                              <span className="perfil-personalizacao-chevron" aria-hidden>
                                ›
                              </span>
                            </button>
                            {sizesOpen === 'homem' && (
                              <div className="perfil-personalizacao-sizes">
                                {FEED_SIZES_ADULT.map((opt) => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    className={`perfil-personalizacao-size-chip${
                                      feedPrefs.sizesHomem.includes(opt.id) ? ' perfil-personalizacao-size-chip--on' : ''
                                    }`}
                                    onClick={() => toggleFeedSize('homem', opt.id)}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="perfil-personalizacao-cat-block perfil-personalizacao-cat-block--last">
                            <div className="perfil-personalizacao-cat-row">
                              <div className="perfil-personalizacao-cat-row__left">
                                <span className="perfil-personalizacao-cat-icon" aria-hidden>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="12" cy="11" r="7" />
                                    <circle cx="9.5" cy="10" r="0.9" fill="currentColor" stroke="none" />
                                    <circle cx="14.5" cy="10" r="0.9" fill="currentColor" stroke="none" />
                                    <path d="M9 14c1 1.8 3.5 2.8 5.5 1.5" />
                                  </svg>
                                </span>
                                <span className="perfil-personalizacao-cat-label">Criança</span>
                              </div>
                              <label className="perfil-personalizacao-check">
                                <input
                                  type="checkbox"
                                  checked={feedPrefs.crianca}
                                  onChange={() => toggleFeedCategory('crianca')}
                                />
                                <span className="perfil-personalizacao-check__ui" />
                              </label>
                            </div>
                            <button
                              type="button"
                              className="perfil-personalizacao-tamanhos-row"
                              onClick={() => setSizesOpen((v) => (v === 'crianca' ? null : 'crianca'))}
                            >
                              <span>Tamanhos</span>
                              <span className="perfil-personalizacao-chevron" aria-hidden>
                                ›
                              </span>
                            </button>
                            {sizesOpen === 'crianca' && (
                              <div className="perfil-personalizacao-sizes perfil-personalizacao-sizes--kids">
                                {FEED_SIZES_KIDS.map((opt) => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    className={`perfil-personalizacao-size-chip${
                                      feedPrefs.sizesCrianca.includes(opt.id)
                                        ? ' perfil-personalizacao-size-chip--on'
                                        : ''
                                    }`}
                                    onClick={() => toggleFeedSize('crianca', opt.id)}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeAnchor === '#personalizacao-marcas' && (
                      <div id="personalizacao-marcas" className="perfil-settings-anchor">
                        <h2 className="perfil-personalizacao-panel__title">Marcas populares</h2>
                        <p className="perfil-personalizacao-panel__subtitle">
                          Escolhe marcas para destacar no teu feed (inspirado na página de marcas da{' '}
                          <a href="https://www.vinted.pt/brands" target="_blank" rel="noopener noreferrer">
                            Vinted
                          </a>
                          ). Usa &quot;Seguir&quot; para as tuas preferidas.
                        </p>
                        <p className="perfil-personalizacao-brands-summary">
                          {feedPrefs.brandIds.length === 0
                            ? 'Nenhuma marca selecionada.'
                            : `${feedPrefs.brandIds.length} marca${feedPrefs.brandIds.length === 1 ? '' : 's'} a seguir.`}
                        </p>
                        <div className="perfil-personalizacao-brands-toolbar">
                          <input
                            type="search"
                            className="auth-input perfil-personalizacao-brands-search"
                            value={brandSearch}
                            onChange={(e) => setBrandSearch(e.target.value)}
                            placeholder="Procurar marca…"
                            aria-label="Procurar marca"
                          />
                          <div className="perfil-personalizacao-brands-alpha" aria-label="Saltar para letra">
                            {POPULAR_BRANDS_BY_LETTER.map(({ letter }) => (
                              <a
                                key={letter}
                                href={`#marca-letra-${letter.replace(/\s+/g, '-')}`}
                                className="perfil-personalizacao-brands-alpha__link"
                              >
                                {letter === 'Outro' ? '#' : letter}
                              </a>
                            ))}
                          </div>
                        </div>
                        <div className="perfil-personalizacao-brands-page">
                          {brandSectionsFiltered.map(({ letter, brands }) => (
                            <section
                              key={letter}
                              id={`marca-letra-${letter.replace(/\s+/g, '-')}`}
                              className="perfil-personalizacao-brand-section"
                            >
                              <h3 className="perfil-personalizacao-brand-letter">{letter}</h3>
                              <ul className="perfil-personalizacao-brand-list">
                                {brands.map((b) => {
                                  const on = feedPrefs.brandIds.includes(b.id);
                                  return (
                                    <li key={b.id} className="perfil-personalizacao-brand-row">
                                      <span className="perfil-personalizacao-brand-name">{b.label}</span>
                                      <button
                                        type="button"
                                        className={`perfil-personalizacao-brand-follow${on ? ' perfil-personalizacao-brand-follow--on' : ''}`}
                                        onClick={() => toggleFeedBrand(b.id)}
                                      >
                                        {on ? 'A seguir' : 'Seguir'}
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            </section>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeAnchor === '#personalizacao-historico' && (
                      <div id="personalizacao-historico" className="perfil-settings-anchor">
                        <h2 className="perfil-personalizacao-panel__title">Histórico de navegação</h2>
                        <p className="perfil-personalizacao-panel__subtitle">
                          Registamos os artigos que vês e as pesquisas de produtos que fazes neste dispositivo, para
                          perceber o que te interessa e, no futuro, dar mais destaque a anúncios alinhados com o teu
                          gosto. Os dados ficam apenas no teu browser até limpares.
                        </p>
                        <div className="perfil-historico-toolbar">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              clearViewedProducts();
                              setBrowseSignals(getBrowseSignals());
                            }}
                            disabled={browseSignals.viewedProducts.length === 0}
                          >
                            Limpar artigos vistos
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              clearProductSearches();
                              setBrowseSignals(getBrowseSignals());
                            }}
                            disabled={browseSignals.productSearches.length === 0}
                          >
                            Limpar pesquisas
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              clearAllBrowseSignals();
                              setBrowseSignals(getBrowseSignals());
                            }}
                            disabled={
                              browseSignals.viewedProducts.length === 0 &&
                              browseSignals.productSearches.length === 0
                            }
                          >
                            Limpar tudo
                          </button>
                        </div>

                        <section className="perfil-historico-section" aria-labelledby="perfil-historico-vistos">
                          <div className="perfil-historico-section__head">
                            <h3 id="perfil-historico-vistos" className="perfil-historico-section__title">
                              Artigos vistos
                            </h3>
                          </div>
                          {browseSignals.viewedProducts.length === 0 ? (
                            <p className="perfil-historico-empty">Ainda não há artigos vistos neste dispositivo.</p>
                          ) : (
                            <ul className="perfil-historico-views">
                              {browseSignals.viewedProducts.map((v) => (
                                <li key={v.id} className="perfil-historico-view-row">
                                  <Link href={`/produtos/${v.id}`} className="perfil-historico-view-link">
                                    <span className="perfil-historico-view-thumb">
                                      {v.imageUrl ? (
                                        <img src={v.imageUrl} alt="" width={48} height={48} loading="lazy" />
                                      ) : (
                                        <span className="perfil-historico-view-thumb--ph" aria-hidden>
                                          📦
                                        </span>
                                      )}
                                    </span>
                                    <span className="perfil-historico-view-meta">
                                      <span className="perfil-historico-view-title">{v.title}</span>
                                      {formatSeenAt(v.at) ? (
                                        <span className="perfil-historico-view-when">{formatSeenAt(v.at)}</span>
                                      ) : null}
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </section>

                        <section className="perfil-historico-section" aria-labelledby="perfil-historico-pesquisas">
                          <div className="perfil-historico-section__head">
                            <h3 id="perfil-historico-pesquisas" className="perfil-historico-section__title">
                              Pesquisas de produtos
                            </h3>
                          </div>
                          {browseSignals.productSearches.length === 0 ? (
                            <p className="perfil-historico-empty">Ainda não há pesquisas registadas neste dispositivo.</p>
                          ) : (
                            <ul className="perfil-historico-searches">
                              {browseSignals.productSearches.map((s) => (
                                <li key={`${s.query}-${s.at}`} className="perfil-historico-search-item">
                                  <Link
                                    href={`/produtos?q=${encodeURIComponent(s.query)}`}
                                    className="perfil-historico-search-link"
                                  >
                                    <span className="perfil-historico-search-q">&quot;{s.query}&quot;</span>
                                    {formatSeenAt(s.at) ? (
                                      <span className="perfil-historico-search-when">{formatSeenAt(s.at)}</span>
                                    ) : null}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </section>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeAnchor === '#detalhes-perfil' && (
                <>
                  <div id="detalhes-perfil" className="perfil-settings-card perfil-settings-anchor">
                    <div className="perfil-settings-row">
                      <div className="perfil-settings-row__label">A tua fotografia</div>
                      <div className="perfil-settings-row__content perfil-settings-photo">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Foto de perfil" className="perfil-settings-photo__img" />
                        ) : (
                          <div className="perfil-settings-photo__placeholder">{displayInitial}</div>
                        )}
                        <label className="btn btn-secondary perfil-settings-photo__btn">
                          Escolher fotografia
                          <input
                            type="file"
                            className="visually-hidden"
                            accept={ACCEPT_AVATAR_IMAGES}
                            onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="perfil-settings-row">
                      <label className="perfil-settings-row__label" htmlFor="perfil-full-name">
                        Nome de utilizador
                      </label>
                      <div className="perfil-settings-row__content">
                        <input
                          id="perfil-full-name"
                          type="text"
                          className="auth-input perfil-settings-input"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="O teu nome"
                        />
                      </div>
                    </div>

                    <div className="perfil-settings-row">
                      <label className="perfil-settings-row__label" htmlFor="perfil-bio">
                        Sobre ti
                      </label>
                      <div className="perfil-settings-row__content">
                        <textarea
                          id="perfil-bio"
                          className="auth-input perfil-settings-input"
                          rows={3}
                          value={aboutMe}
                          onChange={(e) => setAboutMe(e.target.value)}
                          placeholder="Fala-nos mais sobre ti e o teu estilo"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="perfil-settings-group-title">A minha localização</div>
                  <div className="perfil-settings-card">
                    <div className="perfil-settings-row">
                      <label className="perfil-settings-row__label" htmlFor="perfil-country-details">
                        País
                      </label>
                      <div className="perfil-settings-row__content">
                        <select
                          id="perfil-country-details"
                          className="auth-input perfil-settings-input"
                          value={locationCountry}
                          onChange={(e) => setLocationCountry(e.target.value)}
                        >
                          {COUNTRY_OPTIONS.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="perfil-settings-row">
                      <label className="perfil-settings-row__label" htmlFor="perfil-city-details">
                        Cidade/Localidade
                      </label>
                      <div className="perfil-settings-row__content">
                        <input
                          id="perfil-city-details"
                          type="text"
                          className="auth-input perfil-settings-input"
                          value={locationCity}
                          onChange={(e) => setLocationCity(e.target.value)}
                          placeholder="Seleciona uma cidade"
                          list={CITY_DATALIST_ID}
                        />
                        {cityLoading ? <span className="perfil-hint">A procurar cidades...</span> : null}
                        <datalist id={CITY_DATALIST_ID}>
                          {citySuggestions.map((city) => (
                            <option key={city} value={city} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                    <div className="perfil-settings-row">
                      <div className="perfil-settings-row__label">Mostrar cidade no perfil</div>
                      <div className="perfil-settings-row__content">
                        <label className="perfil-settings-toggle" htmlFor="perfil-show-city-details">
                          <input
                            id="perfil-show-city-details"
                            type="checkbox"
                            checked={showCityOnProfile}
                            onChange={(e) => setShowCityOnProfile(e.target.checked)}
                          />
                          <span aria-hidden className="perfil-settings-toggle__ui" />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="perfil-settings-card">
                    <div className="perfil-settings-row">
                      <div className="perfil-settings-row__label">Idioma</div>
                      <div className="perfil-settings-row__content">Português (Portuguese)</div>
                    </div>
                  </div>
                </>
              )}

              {activeAnchor === '#definicoes-conta' && (
                <>
                  <div id="definicoes-conta" className="perfil-settings-group-title perfil-settings-anchor">
                    Definições da conta
                  </div>
                  {accountMessage ? (
                    <p className={accountMessage.startsWith('Não foi possível') ? 'auth-error' : 'auth-success'}>
                      {accountMessage}
                    </p>
                  ) : null}

                  <div className="perfil-settings-card perfil-settings-card--account">
                    <div className="perfil-settings-account-row perfil-settings-account-row--contact">
                      <div className="perfil-settings-account-contact">
                        <div className="perfil-settings-account-contact__email">{user.email ?? '—'}</div>
                        {authEmailVerified ? (
                          <div className="perfil-settings-account-contact__verified">
                            <span className="perfil-settings-account-contact__check" aria-hidden>
                              ✓
                            </span>
                            Verificado
                          </div>
                        ) : (
                          <div className="perfil-settings-account-contact__pending">Por confirmar (revisa o teu email)</div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary perfil-settings-account-row__action"
                        onClick={handleOpenEmailModal}
                      >
                        Alterar
                      </button>
                    </div>
                    <div className="perfil-settings-account-row">
                      <span className="perfil-settings-account-row__title">Número de telefone</span>
                      <button
                        type="button"
                        className="btn btn-secondary perfil-settings-account-row__action"
                        onClick={handleOpenPhoneModal}
                      >
                        Verificar
                      </button>
                    </div>
                  </div>
                  <p className="perfil-settings-account-disclaimer">
                    O teu número de telefone serve exclusivamente para ajudar-te a iniciar sessão. Não será tornado público
                    nem utilizado para fins de marketing.
                  </p>

                  <div className="perfil-settings-card">
                    <div className="perfil-settings-row">
                      <label className="perfil-settings-row__label" htmlFor="perfil-account-full-name">
                        Nome completo
                      </label>
                      <div className="perfil-settings-row__content">
                        <input
                          id="perfil-account-full-name"
                          type="text"
                          className="auth-input perfil-settings-input"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          autoComplete="name"
                        />
                      </div>
                    </div>
                    <div className="perfil-settings-row">
                      <label className="perfil-settings-row__label" htmlFor="perfil-account-gender">
                        Género
                      </label>
                      <div className="perfil-settings-row__content">
                        <select
                          id="perfil-account-gender"
                          className="auth-input perfil-settings-input"
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                        >
                          {GENDER_SELECT_OPTIONS.map((opt) => (
                            <option key={opt.value || 'empty'} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="perfil-settings-row">
                      <label className="perfil-settings-row__label" htmlFor="perfil-account-birth">
                        Aniversário
                      </label>
                      <div className="perfil-settings-row__content">
                        <input
                          id="perfil-account-birth"
                          type="date"
                          className="auth-input perfil-settings-input"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="perfil-settings-card perfil-settings-card--account">
                    <div className="perfil-settings-account-row">
                      <span className="perfil-settings-account-row__title">Modo Férias</span>
                      <label className="perfil-settings-toggle" htmlFor="perfil-vacation-mode">
                        <input
                          id="perfil-vacation-mode"
                          type="checkbox"
                          checked={vacationMode}
                          onChange={(e) => void handleVacationModeToggle(e.target.checked)}
                        />
                        <span aria-hidden className="perfil-settings-toggle__ui" />
                      </label>
                    </div>
                  </div>

                  <div className="perfil-settings-card perfil-settings-card--account">
                    <div className="perfil-settings-account-row">
                      <span className="perfil-settings-account-row__title">Facebook</span>
                      {connectedProviders.facebook ? (
                        <button
                          type="button"
                          className="btn btn-secondary perfil-settings-account-row__action"
                          onClick={() => void handleUnlinkProvider('facebook')}
                          disabled={accountActionLoading === 'unlink-facebook'}
                        >
                          {accountActionLoading === 'unlink-facebook' ? 'A desassociar...' : 'Desassociar'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary perfil-settings-account-row__action"
                          onClick={() => void handleConnectProvider('facebook')}
                          disabled={accountActionLoading === 'facebook'}
                        >
                          {accountActionLoading === 'facebook' ? 'A associar...' : 'Associar'}
                        </button>
                      )}
                    </div>
                    <div className="perfil-settings-account-row">
                      <span className="perfil-settings-account-row__title">Google</span>
                      {connectedProviders.google ? (
                        <button
                          type="button"
                          className="btn btn-secondary perfil-settings-account-row__action"
                          onClick={() => void handleUnlinkProvider('google')}
                          disabled={accountActionLoading === 'unlink-google'}
                        >
                          {accountActionLoading === 'unlink-google' ? 'A desassociar...' : 'Desassociar'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary perfil-settings-account-row__action"
                          onClick={() => void handleConnectProvider('google')}
                          disabled={accountActionLoading === 'google'}
                        >
                          {accountActionLoading === 'google' ? 'A associar...' : 'Associar'}
                        </button>
                      )}
                    </div>
                    <p className="perfil-settings-account-help">
                      Associa as tuas outras contas para te tornares um membro fiável e verificado.
                    </p>
                  </div>

                  <div className="perfil-settings-card perfil-settings-card--account">
                    <div className="perfil-settings-account-row">
                      <span className="perfil-settings-account-row__title">Alterar palavra-passe</span>
                      <button
                        type="button"
                        className="btn btn-secondary perfil-settings-account-row__action"
                        onClick={handleOpenPasswordModal}
                        disabled={accountActionLoading === 'password'}
                      >
                        {accountActionLoading === 'password' ? 'A alterar...' : 'Alterar'}
                      </button>
                    </div>
                  </div>

                  <div className="perfil-settings-card perfil-settings-card--account">
                    <div className="perfil-settings-account-row">
                      <span className="perfil-settings-account-row__title">Eliminar a minha conta</span>
                      <button
                        type="button"
                        className="perfil-settings-account-row__chevron"
                        aria-label="Abrir opções para eliminar conta"
                        onClick={handleOpenDeleteModal}
                      >
                        ›
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeAnchor === '#custos-envio' && (
                <>
                  <div id="custos-envio" className="perfil-settings-group-title perfil-settings-anchor">
                    Custos de envio
                  </div>
                  <div className="perfil-settings-card">
                    <div className="perfil-settings-row">
                      <div className="perfil-settings-row__label">Regras de envio</div>
                      <div className="perfil-settings-row__content">
                        Define aqui os custos por região na área de vendedor.
                      </div>
                    </div>

                    <div className="perfil-settings-row">
                      <div className="perfil-settings-row__label">Atalho</div>
                      <div className="perfil-settings-row__content">
                        <a href="/vendedor/guia" className="btn btn-secondary">
                          Gerir custos de envio
                        </a>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeAnchor === '#descontos-conjuntos' && (
                <>
                  <div id="descontos-conjuntos" className="perfil-settings-group-title perfil-settings-anchor">
                    Descontos de conjuntos
                  </div>
                  <div className="perfil-settings-card">
                    <div className="perfil-settings-row">
                      <div className="perfil-settings-row__label">Configuração</div>
                      <div className="perfil-settings-row__content">
                        Esta configuração está disponível na área de vendedor.
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeAnchor === '#pagamentos-perfil' && (
                <>
                  <div id="pagamentos-perfil" className="perfil-settings-group-title perfil-settings-anchor">
                    Pagamentos
                  </div>
                  <div className="perfil-settings-card">
                    <div className="perfil-settings-row perfil-settings-row--stack">
                      <div className="perfil-settings-row__label perfil-settings-row__label--muted">Opções de pagamento</div>
                      <button type="button" className="perfil-settings-nav-row">
                        <span>Adicionar cartão</span>
                        <span aria-hidden>›</span>
                      </button>
                    </div>

                    <div className="perfil-settings-row perfil-settings-row--stack">
                      <div className="perfil-settings-row__label perfil-settings-row__label--muted">Opções de transferência</div>
                      <button type="button" className="perfil-settings-nav-row">
                        <span>Adicionar conta bancária</span>
                        <span aria-hidden>›</span>
                      </button>
                    </div>

                    <div className="perfil-settings-row perfil-settings-row--stack">
                      <button type="button" className="perfil-settings-nav-row">
                        <span>Centro informativo DAC7</span>
                        <span aria-hidden>›</span>
                      </button>
                    </div>

                    <div className="perfil-settings-row">
                      <div className="perfil-settings-row__label">Método preferido</div>
                      <div className="perfil-settings-row__content">
                        <div className="auth-radio-group">
                          <label className="auth-radio">
                            <input
                              type="radio"
                              name="paymentPreference"
                              value="transferencia"
                              checked={paymentPreference === 'transferencia'}
                              onChange={() => setPaymentPreference('transferencia')}
                            />
                            <span>Transferência bancária</span>
                          </label>
                          <label className="auth-radio">
                            <input
                              type="radio"
                              name="paymentPreference"
                              value="mbway"
                              checked={paymentPreference === 'mbway'}
                              onChange={() => setPaymentPreference('mbway')}
                            />
                            <span>MB Way</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="perfil-settings-row">
                      <label className="perfil-settings-row__label" htmlFor="perfil-iban">
                        IBAN
                      </label>
                      <div className="perfil-settings-row__content">
                        <input
                          id="perfil-iban"
                          type="text"
                          className="auth-input perfil-settings-input"
                          value={iban}
                          onChange={(e) => setIban(e.target.value)}
                          placeholder="PT50 0000 0000 0000 0000 00000"
                          maxLength={34}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeAnchor === '#notificacoes-perfil' && (
                <>
                  <div id="notificacoes-perfil" className="perfil-settings-group-title perfil-settings-anchor">
                    Notificações
                  </div>
                  <div className="perfil-settings-card">
                    <div className="perfil-settings-row">
                      <div className="perfil-settings-row__label">Ativar notificações por e-mail</div>
                      <div className="perfil-settings-row__content">
                        <label className="perfil-settings-toggle" htmlFor="notif-email">
                          <input
                            id="notif-email"
                            type="checkbox"
                            checked={notifEmail}
                            onChange={(e) => setNotifEmail(e.target.checked)}
                          />
                          <span aria-hidden className="perfil-settings-toggle__ui" />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="perfil-settings-group-title">Notícias</div>
                  <div className="perfil-settings-card">
                    <div className="perfil-settings-row">
                      <div className="perfil-settings-row__label">
                        Atualizações da Vinted
                        <span className="perfil-settings-row__subtext">
                          Descobre em primeira mão todas as nossas mais recentes funcionalidades, novidades e mudanças
                        </span>
                      </div>
                      <div className="perfil-settings-row__content">
                        <label className="perfil-settings-toggle" htmlFor="notif-vinted-news">
                          <input
                            id="notif-vinted-news"
                            type="checkbox"
                            checked={notifVintedNews}
                            onChange={(e) => setNotifVintedNews(e.target.checked)}
                          />
                          <span aria-hidden className="perfil-settings-toggle__ui" />
                        </label>
                      </div>
                    </div>
                    <div className="perfil-settings-row">
                      <div className="perfil-settings-row__label">
                        Comunicações de Marketing
                        <span className="perfil-settings-row__subtext">
                          Recebe incríveis ofertas personalizadas, novidades e recomendações
                        </span>
                      </div>
                      <div className="perfil-settings-row__content">
                        <label className="perfil-settings-toggle" htmlFor="notif-marketing">
                          <input
                            id="notif-marketing"
                            type="checkbox"
                            checked={notifMarketing}
                            onChange={(e) => setNotifMarketing(e.target.checked)}
                          />
                          <span aria-hidden className="perfil-settings-toggle__ui" />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="perfil-settings-group-title">Notificações de prioridade alta</div>
                  <div className="perfil-settings-card">
                    <div className="perfil-settings-row">
                      <div className="perfil-settings-row__label">Novas mensagens</div>
                      <div className="perfil-settings-row__content">
                        <label className="perfil-settings-toggle" htmlFor="notif-messages">
                          <input
                            id="notif-messages"
                            type="checkbox"
                            checked={notifMessages}
                            onChange={(e) => setNotifMessages(e.target.checked)}
                          />
                          <span aria-hidden className="perfil-settings-toggle__ui" />
                        </label>
                      </div>
                    </div>
                    <div className="perfil-settings-row">
                      <div className="perfil-settings-row__label">Nova avaliação</div>
                      <div className="perfil-settings-row__content">
                        <label className="perfil-settings-toggle" htmlFor="notif-review">
                          <input
                            id="notif-review"
                            type="checkbox"
                            checked={notifReview}
                            onChange={(e) => setNotifReview(e.target.checked)}
                          />
                          <span aria-hidden className="perfil-settings-toggle__ui" />
                        </label>
                      </div>
                    </div>
                    <div className="perfil-settings-row">
                      <div className="perfil-settings-row__label">Artigos com preço reduzido</div>
                      <div className="perfil-settings-row__content">
                        <label className="perfil-settings-toggle" htmlFor="notif-discounted">
                          <input
                            id="notif-discounted"
                            type="checkbox"
                            checked={notifDiscounted}
                            onChange={(e) => setNotifDiscounted(e.target.checked)}
                          />
                          <span aria-hidden className="perfil-settings-toggle__ui" />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="perfil-settings-group-title">Outras notificações</div>
                  <div className="perfil-settings-card">
                    <div className="perfil-settings-row">
                      <div className="perfil-settings-row__label">Artigos marcados como favoritos</div>
                      <div className="perfil-settings-row__content">
                        <label className="perfil-settings-toggle" htmlFor="notif-favorites">
                          <input
                            id="notif-favorites"
                            type="checkbox"
                            checked={notifFavorites}
                            onChange={(e) => setNotifFavorites(e.target.checked)}
                          />
                          <span aria-hidden className="perfil-settings-toggle__ui" />
                        </label>
                      </div>
                    </div>
                    <div className="perfil-settings-row">
                      <div className="perfil-settings-row__label">Novos artigos</div>
                      <div className="perfil-settings-row__content">
                        <label className="perfil-settings-toggle" htmlFor="notif-new-items">
                          <input
                            id="notif-new-items"
                            type="checkbox"
                            checked={notifNewItems}
                            onChange={(e) => setNotifNewItems(e.target.checked)}
                          />
                          <span aria-hidden className="perfil-settings-toggle__ui" />
                        </label>
                      </div>
                    </div>
                    <div className="perfil-settings-row perfil-settings-row--stack">
                      <label className="perfil-settings-row__label perfil-settings-row__label--muted" htmlFor="notif-daily-limit">
                        Definir um limite diário para cada tipo de notificação
                      </label>
                      <select
                        id="notif-daily-limit"
                        className="auth-input perfil-settings-input"
                        value={notifDailyLimit}
                        onChange={(e) => setNotifDailyLimit(e.target.value)}
                      >
                        <option>Até 2 notificações</option>
                        <option>Até 5 notificações</option>
                        <option>Até 10 notificações</option>
                        <option>Sem limite</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {activeAnchor === '#privacidade-perfil' && (
                <>
                  <div id="privacidade-perfil" className="perfil-settings-group-title perfil-settings-anchor">
                    Definições de privacidade
                  </div>
                  <div className="perfil-settings-card">
                    <div className="perfil-settings-row">
                      <div className="perfil-settings-row__label">Mostrar cidade no perfil</div>
                      <div className="perfil-settings-row__content">
                        <label className="perfil-settings-toggle" htmlFor="perfil-show-city-privacy">
                          <input
                            id="perfil-show-city-privacy"
                            type="checkbox"
                            checked={showCityOnProfile}
                            onChange={(e) => setShowCityOnProfile(e.target.checked)}
                          />
                          <span aria-hidden className="perfil-settings-toggle__ui" />
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeAnchor === '#seguranca-perfil' && (
                <>
                  <div id="seguranca-perfil" className="perfil-settings-group-title perfil-settings-anchor">
                    Segurança
                  </div>
                  <div className="perfil-settings-card">
                    <div className="perfil-settings-row">
                      <div className="perfil-settings-row__label">Alterar palavra-passe</div>
                      <div className="perfil-settings-row__content">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleOpenPasswordModal}
                          disabled={accountActionLoading === 'password'}
                        >
                          {accountActionLoading === 'password' ? 'A alterar...' : 'Alterar'}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {showSaveButton && (
                <div className="perfil-settings-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'A guardar...' : 'Guardar'}
                  </button>
                </div>
              )}
            </form>

            {emailModalOpen && (
              <div className="perfil-modal-overlay" role="presentation">
                <div className="perfil-modal" role="dialog" aria-modal="true" aria-labelledby="perfil-email-title">
                  <h3 id="perfil-email-title" className="perfil-modal__title">Alterar email</h3>
                  <p className="perfil-modal__text">
                    Vais receber um email de confirmação no novo endereço. O login continua válido até confirmares.
                  </p>
                  <form onSubmit={handleSubmitEmailChange} className="perfil-modal__form">
                    <label className="auth-label">
                      Novo email
                      <input
                        type="email"
                        className="auth-input"
                        value={newEmailDraft}
                        onChange={(e) => setNewEmailDraft(e.target.value)}
                        autoComplete="email"
                        required
                      />
                    </label>
                    <div className="perfil-modal__actions">
                      <button type="button" className="btn btn-secondary" onClick={() => setEmailModalOpen(false)}>
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={emailSubmitting}>
                        {emailSubmitting ? 'A guardar...' : 'Guardar'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {phoneModalOpen && (
              <div className="perfil-modal-overlay" role="presentation">
                <div className="perfil-modal" role="dialog" aria-modal="true" aria-labelledby="perfil-phone-title">
                  <h3 id="perfil-phone-title" className="perfil-modal__title">Número de telefone</h3>
                  <p className="perfil-modal__text">
                    Indica o teu número (com indicativo, ex. +351). Serve para recuperação de conta; não é mostrado no
                    perfil público.
                  </p>
                  <form onSubmit={handleSubmitPhoneModal} className="perfil-modal__form">
                    <label className="auth-label">
                      Telefone
                      <input
                        type="tel"
                        className="auth-input"
                        value={phoneDraft}
                        onChange={(e) => setPhoneDraft(e.target.value)}
                        autoComplete="tel"
                        placeholder="+351 912 345 678"
                      />
                    </label>
                    <div className="perfil-modal__actions">
                      <button type="button" className="btn btn-secondary" onClick={() => setPhoneModalOpen(false)}>
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={phoneSubmitting}>
                        {phoneSubmitting ? 'A guardar...' : 'Guardar'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {passwordModalOpen && (
              <div className="perfil-modal-overlay" role="presentation">
                <div className="perfil-modal" role="dialog" aria-modal="true" aria-labelledby="perfil-password-title">
                  <h3 id="perfil-password-title" className="perfil-modal__title">Alterar palavra-passe</h3>
                  <form onSubmit={handleSubmitPasswordChange} className="perfil-modal__form">
                    <label className="auth-label">
                      Palavra-passe antiga
                      <input
                        type="password"
                        className="auth-input"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                      />
                    </label>
                    <label className="auth-label">
                      Nova palavra-passe
                      <input
                        type="password"
                        className="auth-input"
                        value={nextPassword}
                        onChange={(e) => setNextPassword(e.target.value)}
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />
                    </label>
                    <label className="auth-label">
                      Repetir nova palavra-passe
                      <input
                        type="password"
                        className="auth-input"
                        value={nextPasswordConfirm}
                        onChange={(e) => setNextPasswordConfirm(e.target.value)}
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />
                    </label>
                    <div className="perfil-modal__actions">
                      <button type="button" className="btn btn-secondary" onClick={() => setPasswordModalOpen(false)} disabled={passwordSubmitting}>
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={passwordSubmitting}>
                        {passwordSubmitting ? 'A guardar...' : 'Guardar palavra-passe'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {deleteModalOpen && (
              <div className="perfil-modal-overlay" role="presentation">
                <div className="perfil-modal" role="dialog" aria-modal="true" aria-labelledby="perfil-delete-title">
                  <h3 id="perfil-delete-title" className="perfil-modal__title">Eliminar conta</h3>
                  <p className="perfil-modal__text">
                    Esta ação é permanente e elimina os teus dados da plataforma. Para confirmar, escreve:
                    <strong> Quero deletar minha conta</strong>
                  </p>
                  <form onSubmit={handleDeleteAccount} className="perfil-modal__form">
                    <input
                      type="text"
                      className="auth-input"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Quero deletar minha conta"
                      required
                    />
                    <div className="perfil-modal__actions">
                      <button type="button" className="btn btn-secondary" onClick={() => setDeleteModalOpen(false)} disabled={deleteSubmitting}>
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn-danger" disabled={deleteSubmitting}>
                        {deleteSubmitting ? 'A eliminar...' : 'Confirmar eliminação'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
