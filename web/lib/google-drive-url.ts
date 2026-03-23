/**
 * Extrai o ID de ficheiro de URLs típicas do Google Drive e devolve URL de download direto.
 * O ficheiro deve estar partilhado como "Qualquer pessoa com o link" (ou o comprador precisa de permissão).
 */
export function normalizeGoogleDriveDownloadUrl(input: string): { ok: true; url: string; fileId: string } | { ok: false; reason: string } {
  const raw = input.trim();
  if (!raw) return { ok: false, reason: 'URL vazia.' };

  let fileId: string | null = null;

  const mFile = raw.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (mFile) fileId = mFile[1];

  if (!fileId) {
    const mOpen = raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (mOpen) fileId = mOpen[1];
  }

  if (!fileId) {
    const mShort = raw.match(/drive\.google\.com\/open\?[^#]*id=([a-zA-Z0-9_-]+)/);
    if (mShort) fileId = mShort[1];
  }

  if (!fileId) {
    return {
      ok: false,
      reason:
        'Não foi possível ler o ID do ficheiro. Usa um link do tipo https://drive.google.com/file/d/ID/view',
    };
  }

  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  return { ok: true, url, fileId };
}
