/**
 * Apaga a pasta .next (cache de build) antes de `next dev`.
 * Uso: node scripts/clean-next.mjs
 */
import { rmSync } from 'fs';
try {
  rmSync('.next', { recursive: true, force: true });
  console.log('[clean-next] Pasta .next removida.');
} catch (e) {
  if (e && e.code !== 'ENOENT') console.warn('[clean-next]', e.message);
}
