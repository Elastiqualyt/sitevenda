'use client';

import { openCookieBanner } from '@/lib/cookie-consent';

type Props = {
  className?: string;
  children?: React.ReactNode;
};

/**
 * Abre o banner de cookies na vista "Definições" (ou reabre para alterar preferências).
 */
export function CookieSettingsTrigger({ className, children }: Props) {
  return (
    <button
      type="button"
      className={className ?? 'cookie-settings-trigger'}
      onClick={() => openCookieBanner({ view: 'settings' })}
    >
      {children ?? 'Definições de cookies'}
    </button>
  );
}
