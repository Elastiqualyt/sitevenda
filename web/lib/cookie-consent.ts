/**
 * Preferências de cookies (localStorage, apenas no cliente).
 * Usar para decidir se carregas analytics/marketing no futuro.
 */

export const COOKIE_CONSENT_STORAGE_KEY = 'terraplace_cookie_consent_v1';

export type CookieConsentStored = {
  version: 2;
  /** true = só necessários; false = aceitou também opcionais (todos) */
  necessaryOnly: boolean;
  updatedAt: string;
};

/** Evento para reabrir o banner (ex.: link no rodapé ou página /cookies) */
export const COOKIE_BANNER_EVENT = 'terraplace-cookie-banner';

export type CookieBannerEventDetail = {
  view?: 'main' | 'settings';
};

export function parseCookieConsent(raw: string | null): CookieConsentStored | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as Record<string, unknown>;
    // Formato antigo: { accepted: true, at: string }
    if (j.accepted === true && typeof j.necessaryOnly !== 'boolean') {
      return {
        version: 2,
        necessaryOnly: false,
        updatedAt: typeof j.at === 'string' ? j.at : new Date().toISOString(),
      };
    }
    if (j.version === 2 && typeof j.necessaryOnly === 'boolean' && typeof j.updatedAt === 'string') {
      return j as CookieConsentStored;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function getCookieConsent(): CookieConsentStored | null {
  if (typeof window === 'undefined') return null;
  try {
    return parseCookieConsent(localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Indica se o utilizador permitiu cookies opcionais (não só necessários). */
export function hasOptionalCookiesConsent(): boolean {
  const c = getCookieConsent();
  return c != null && !c.necessaryOnly;
}

export function saveCookieConsent(necessaryOnly: boolean): void {
  const payload: CookieConsentStored = {
    version: 2,
    necessaryOnly,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(payload));
}

export function openCookieBanner(detail: CookieBannerEventDetail = {}): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<CookieBannerEventDetail>(COOKIE_BANNER_EVENT, { detail }),
  );
}
