/**
 * Apaga a pasta .next (cache de build) antes de `next dev`.
 * Uso: node scripts/clean-next.mjs
 */
import { rmSync, existsSync } from 'fs';

function removeNext() {
  if (!existsSync('.next')) {
    console.log('[clean-next] Pasta .next não existe.');
    return;
  }
  rmSync('.next', { recursive: true, force: true, maxRetries: 5, retryDelay: 150 });
  console.log('[clean-next] Pasta .next removida.');
}

try {
  removeNext();
} catch (e) {
  console.warn('[clean-next] Primeira tentativa:', e?.message ?? e);
  const end = Date.now() + 500;
  while (Date.now() < end) {
    /* espera curta (ficheiros no Windows) */
  }
  try {
    removeNext();
  } catch (e2) {
    console.error(
      '[clean-next] Falhou. Para o servidor (Ctrl+C) e apaga manualmente a pasta web\\.next'
    );
    console.error(e2?.message ?? e2);
    process.exit(1);
  }
}
