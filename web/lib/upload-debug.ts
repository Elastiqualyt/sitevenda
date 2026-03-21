/**
 * Depuração de uploads (Storage + criação de produto).
 *
 * Ativar no browser (consola F12 → Application não, é na Consola):
 *   localStorage.setItem('marketplace_debug_upload', '1')
 * Depois F5 na página e tenta criar o anúncio de novo.
 *
 * Ou define no `.env.local`: NEXT_PUBLIC_DEBUG_UPLOAD=true
 *
 * Na consola filtra por: Marketplace
 */

const LS_KEY = 'marketplace_debug_upload';

export function isMarketplaceUploadDebug(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return (
      localStorage.getItem(LS_KEY) === '1' ||
      process.env.NEXT_PUBLIC_DEBUG_UPLOAD === 'true'
    );
  } catch {
    return false;
  }
}

export function uploadDebug(phase: string, detail?: Record<string, unknown>) {
  if (!isMarketplaceUploadDebug()) return;
  if (detail !== undefined) {
    console.log(`[Marketplace upload] ${phase}`, detail);
  } else {
    console.log(`[Marketplace upload] ${phase}`);
  }
}

/** Chamar sempre em falhas — aparece na consola mesmo sem modo debug. */
export function uploadDebugError(phase: string, err: unknown, extra?: Record<string, unknown>) {
  console.error(`[Marketplace upload ERROR] ${phase}`, err, extra ?? '');
}

export function uploadDebugTimeStart(): number {
  return typeof performance !== 'undefined' ? performance.now() : 0;
}

export function uploadDebugTimeEnd(label: string, startMs: number) {
  if (!isMarketplaceUploadDebug()) return;
  const ms =
    typeof performance !== 'undefined' ? Math.round(performance.now() - startMs) : 0;
  uploadDebug(`${label} (duração ms)`, { ms });
}
