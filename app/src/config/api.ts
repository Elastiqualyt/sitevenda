import { Platform } from 'react-native';

/**
 * Backend = Next.js (`web/`) na mesma monorepo.
 *
 * Produção: https://terraplace.pt (domínio público).
 * Desenvolvimento: servidor local do Next (porta 3000), quando corres `npm run dev` em `web/`.
 *
 * Para testar num telemóvel físico na mesma rede Wi‑Fi, define temporariamente
 * `MANUAL_DEV_API_BASE` com o IP da tua máquina (ex.: http://192.168.1.10:3000).
 */
const PRODUCTION_API_BASE = 'https://terraplace.pt';

/** Só em __DEV__: se preenchido, ignora emulador/simulador e usa este URL. */
const MANUAL_DEV_API_BASE: string | null = null;

function devApiBase(): string {
  if (MANUAL_DEV_API_BASE) {
    return MANUAL_DEV_API_BASE.replace(/\/$/, '');
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }
  return 'http://localhost:3000';
}

/**
 * URL base da API REST (rotas `/api/*` do Next.js).
 * Em release builds, usa sempre produção.
 */
export const API_BASE_URL = __DEV__ ? devApiBase() : PRODUCTION_API_BASE;

export function apiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
