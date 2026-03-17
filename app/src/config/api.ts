/**
 * URL da API (Next.js na Vercel).
 * Em desenvolvimento: use o IP da tua máquina para o emulador Android
 * (ex: http://10.0.2.2:3000 para Android emulator).
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://teu-projeto.vercel.app';

export function apiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
