'use client';

import { CookieSettingsTrigger } from '@/components/CookieSettingsTrigger';

export function CookiePreferencesBlock() {
  return (
    <p className="legal-page__cookie-prefs">
      Podes rever ou alterar as tuas escolhas (apenas cookies necessários, ou necessários e opcionais) a qualquer
      momento:{' '}
      <CookieSettingsTrigger className="cookie-settings-trigger" />
      .
    </p>
  );
}
