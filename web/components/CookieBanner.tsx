'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { SITE_NAME } from '@/lib/site-brand';
import {
  COOKIE_BANNER_EVENT,
  COOKIE_CONSENT_STORAGE_KEY,
  getCookieConsent,
  saveCookieConsent,
  type CookieBannerEventDetail,
} from '@/lib/cookie-consent';

type View = 'main' | 'settings';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [view, setView] = useState<View>('main');
  /** Escolha na vista definições: alinhada com save */
  const [settingsChoice, setSettingsChoice] = useState<'necessary' | 'all'>('all');

  const close = useCallback(() => {
    setVisible(false);
    setView('main');
  }, []);

  const applyConsent = useCallback(
    (necessaryOnly: boolean) => {
      try {
        saveCookieConsent(necessaryOnly);
      } catch {
        /* ignore */
      }
      close();
    },
    [close],
  );

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && !localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)) {
        setVisible(true);
        setView('main');
      }
    } catch {
      setVisible(true);
      setView('main');
    }
  }, []);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const ce = e as CustomEvent<CookieBannerEventDetail>;
      const d = ce.detail ?? {};
      const consent = getCookieConsent();
      setSettingsChoice(consent?.necessaryOnly ? 'necessary' : 'all');
      setView(d.view === 'settings' ? 'settings' : 'main');
      setVisible(true);
    };
    window.addEventListener(COOKIE_BANNER_EVENT, onOpen);
    return () => window.removeEventListener(COOKIE_BANNER_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  const openSettings = () => {
    const consent = getCookieConsent();
    setSettingsChoice(consent?.necessaryOnly ? 'necessary' : 'all');
    setView('settings');
  };

  const saveSettings = () => {
    applyConsent(settingsChoice === 'necessary');
  };

  const titleId = view === 'main' ? 'cookie-banner-title' : 'cookie-banner-settings-title';

  if (!visible) return null;

  return (
    <div className="cookie-banner-overlay" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="cookie-banner cookie-banner--wide">
        {view === 'main' ? (
          <div className="cookie-banner__inner cookie-banner__inner--main">
            <div className="cookie-banner__text">
              <h2 id="cookie-banner-title" className="cookie-banner__title">
                Cookies e privacidade
              </h2>
              <p className="cookie-banner__desc">
                O <strong>{SITE_NAME}</strong> utiliza cookies necessários ao funcionamento do site e, se aceitares,
                cookies opcionais para melhorar a experiência. Consulta a{' '}
                <Link href="/cookies" className="cookie-banner__link">
                  Política de cookies
                </Link>{' '}
                e a{' '}
                <Link href="/privacidade" className="cookie-banner__link">
                  Política de privacidade
                </Link>
                .
              </p>
            </div>
            <div className="cookie-banner__actions cookie-banner__actions--stack">
              <div className="cookie-banner__row-btns">
                <button
                  type="button"
                  className="btn btn-primary cookie-banner__btn"
                  onClick={() => applyConsent(false)}
                >
                  Aceitar todos
                </button>
                <button
                  type="button"
                  className="btn btn-secondary cookie-banner__btn"
                  onClick={() => applyConsent(true)}
                >
                  Apenas necessários
                </button>
              </div>
              <button type="button" className="cookie-banner__text-btn" onClick={openSettings}>
                Definições de cookies
              </button>
            </div>
          </div>
        ) : (
          <div className="cookie-banner__inner cookie-banner__inner--settings">
            <button type="button" className="cookie-banner__back" onClick={() => setView('main')}>
              ← Voltar
            </button>
            <h2 id="cookie-banner-settings-title" className="cookie-banner__title">
              Definições de cookies
            </h2>
            <p className="cookie-banner__desc cookie-banner__desc--settings">
              Escolhe o nível de cookies que autorizas. Os cookies <strong>necessários</strong> são indispensáveis
              (sessão, segurança). Os <strong>opcionais</strong> podem incluir estatísticas ou funcionalidades
              adicionais quando as implementarmos.
            </p>

            <fieldset className="cookie-banner__fieldset">
              <legend className="cookie-banner__legend">Tipo de cookies</legend>
              <label className="cookie-banner__radio-label">
                <input
                  type="radio"
                  name="cookie-level"
                  className="cookie-banner__radio"
                  checked={settingsChoice === 'necessary'}
                  onChange={() => setSettingsChoice('necessary')}
                />
                <span>
                  <strong>Apenas necessários</strong>
                  <span className="cookie-banner__radio-sub">Funcionamento mínimo do site.</span>
                </span>
              </label>
              <label className="cookie-banner__radio-label">
                <input
                  type="radio"
                  name="cookie-level"
                  className="cookie-banner__radio"
                  checked={settingsChoice === 'all'}
                  onChange={() => setSettingsChoice('all')}
                />
                <span>
                  <strong>Necessários e opcionais (todos)</strong>
                  <span className="cookie-banner__radio-sub">Inclui cookies descritos na política como opcionais.</span>
                </span>
              </label>
            </fieldset>

            <div className="cookie-banner__actions cookie-banner__actions--settings-footer">
              <button type="button" className="btn btn-primary" onClick={saveSettings}>
                Guardar preferências
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
